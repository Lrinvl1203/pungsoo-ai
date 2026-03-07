import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Lock, Key } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
}

export default function LoginPromptModal({ isOpen, onClose, message = '프리미엄 콘텐츠를 열람하기 위해 로그인이 필요합니다.' }: Props) {
    const { signInWithKakao, signInWithGoogle } = useAuth();
    const [isSigningIn, setIsSigningIn] = useState(false);

    if (!isOpen) return null;

    const handleSignIn = async (provider: 'kakao' | 'google') => {
        setIsSigningIn(true);
        try {
            if (provider === 'kakao') {
                await signInWithKakao();
            } else {
                await signInWithGoogle();
            }
            // On success, redirecting happens so no need to stop spinner usually
        } catch (e) {
            console.error(e);
            alert('로그인 처리 중 오류가 발생했습니다.');
            setIsSigningIn(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
            <div className="bg-[#1a1508] border border-primary/30 rounded-3xl w-full max-w-sm p-8 relative shadow-2xl text-center transform animate-in slide-in-from-bottom-8 duration-300">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <Lock className="w-8 h-8 text-primary" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">로그인이 필요합니다</h3>
                <p className="text-sm text-slate-300 mb-8 leading-relaxed">
                    {message}<br />결제 내역은 회원 계정에 안전하게 보관됩니다.
                </p>

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
                    안전한 결제 및 구매 내역 보관을 위해<br />소셜 계정 연동을 진행합니다.
                </p>
            </div>
        </div>
    );
}
