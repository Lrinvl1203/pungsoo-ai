import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Key, ChevronDown } from 'lucide-react';

export default function LoginButton() {
    const { user, signInWithKakao, signInWithGoogle, signOut, loading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);

    if (loading) {
        return (
            <div className="animate-pulse flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                <div className="w-16 h-4 rounded bg-gray-200"></div>
            </div>
        );
    }

    const handleSignIn = async (provider: 'kakao' | 'google') => {
        setIsSigningIn(true);
        setIsOpen(false);
        try {
            if (provider === 'kakao') {
                await signInWithKakao();
            } else {
                await signInWithGoogle();
            }
        } catch (e) {
            console.error(e);
            alert('로그인 처리 중 오류가 발생했습니다.');
            setIsSigningIn(false); // only reset on error, on success it will redirect
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            setIsOpen(false);
        } catch (e) {
            console.error(e);
            alert('로그아웃 처리 중 오류가 발생했습니다.');
        }
    };

    const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || '회원';
    const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

    return (
        <div className="relative">
            {user ? (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e5e1da] shadow-sm rounded-full hover:bg-[#faf9f6] transition-all"
                >
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full" />
                    ) : (
                        <div className="w-6 h-6 bg-[#d4af37]/20 rounded-full flex justify-center items-center">
                            <User className="w-4 h-4 text-[#d4af37]" />
                        </div>
                    )}
                    <span className="text-sm font-bold text-[#4a443b] max-w-[100px] truncate">{displayName}님</span>
                    <ChevronDown className="w-4 h-4 text-[#8c8273]" />
                </button>
            ) : (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={isSigningIn}
                    className="flex items-center gap-2 px-4 py-2 bg-[#d4af37] text-white shadow-sm shadow-[#d4af37]/20 rounded-full text-sm font-bold hover:bg-[#c29d2f] transition-all"
                >
                    {isSigningIn ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <Key className="w-4 h-4" />
                    )}
                    로그인
                </button>
            )}

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#e5e1da] rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {user ? (
                        <div className="p-1">
                            <div className="px-4 py-3 border-b border-[#e5e1da] mb-1 bg-[#faf9f6]">
                                <p className="text-xs font-bold text-[#4a443b]">{displayName}</p>
                                <p className="text-[10px] text-[#8c8273] truncate" title={user.email}>{user.email}</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-medium transition-colors rounded-lg"
                            >
                                <LogOut className="w-4 h-4" />
                                로그아웃
                            </button>
                        </div>
                    ) : (
                        <div className="p-1 flex flex-col gap-1">
                            <button
                                onClick={() => handleSignIn('kakao')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FEE500] hover:bg-[#E5CE00] text-[#000000] text-sm font-bold rounded-lg transition-colors"
                            >
                                카카오로 시작하기
                            </button>
                            <button
                                onClick={() => handleSignIn('google')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google로 시작하기
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
