import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Lock, Key } from 'lucide-react';
import { useToast } from './ToastProvider';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
}

export default function LoginPromptModal({ isOpen, onClose, message = '프리미엄 콘텐츠를 열람하기 위해 로그인이 필요합니다.' }: Props) {
    const { signInWithKakao, signInWithGoogle } = useAuth();
    const { notify } = useToast();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const modalRef = useModalFocusTrap(isOpen, onClose);

    if (!isOpen) return null;

    const handleSignIn = async (provider: 'kakao' | 'google') => {
        setIsSigningIn(true);
        try {
            // 로그인 후 현재 페이지로 돌아오도록 redirectTo 설정
            const redirectTo = window.location.href;
            if (provider === 'kakao') {
                await signInWithKakao(redirectTo);
            } else {
                await signInWithGoogle(redirectTo);
            }
            // On success, redirecting happens so no need to stop spinner usually
        } catch (e) {
            console.error(e);
            notify('로그인을 시작하지 못했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.', 'error');
            setIsSigningIn(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-modal-title"
                tabIndex={-1}
                className="bg-[#1a1508] border border-primary/30 rounded-3xl w-full max-w-sm p-8 relative shadow-2xl text-center transform animate-in slide-in-from-bottom-8 duration-300 outline-none"
            >
                <button
                    onClick={onClose}
                    aria-label="로그인 창 닫기"
                    className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <Lock className="w-8 h-8 text-primary" />
                </div>

                <h3 id="login-modal-title" className="text-xl font-bold text-white mb-2">계정 연동 후 바로 이어집니다</h3>
                <p className="text-sm text-slate-300 mb-8 leading-relaxed">
                    {message}<br />로그인 후 결제창이 자동으로 다시 열립니다.
                </p>

                <div className="mb-6 grid grid-cols-3 gap-2">
                    {['구매권 보관', '마이페이지 열람', '환불 요청 가능'].map((item) => (
                        <div key={item} className="rounded-xl border border-primary/20 bg-primary/10 px-2 py-2 text-[11px] font-bold text-primary">
                            {item}
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => handleSignIn('kakao')}
                        disabled={isSigningIn}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#FEE500] hover:bg-[#E5CE00] text-[#000000] text-[15px] font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70"
                    >
                        {isSigningIn ? '로그인 처리 중...' : '카카오로 계속하기'}
                    </button>
                    <button
                        onClick={() => handleSignIn('google')}
                        disabled={isSigningIn}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[15px] font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google로 계속하기
                    </button>
                </div>

                <p className="mt-6 text-[11px] text-slate-500">
                    결제 내역과 프리미엄 열람권을 잃지 않도록<br />소셜 계정에 안전하게 연결합니다.
                </p>
            </div>
        </div>
    );
}
