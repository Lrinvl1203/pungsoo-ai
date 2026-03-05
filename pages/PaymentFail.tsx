import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export default function PaymentFail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const code = searchParams.get('code');
    const message = searchParams.get('message');

    return (
        <div className="min-h-screen bg-[#0c0a06] text-slate-100 font-display flex items-center justify-center p-4">
            <div className="bg-[#1a1508] p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl"></div>

                <div className="flex flex-col items-center py-4 relative z-10">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-inner">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-4 tracking-tight">결제가 취소되었거나 실패했습니다</h2>

                    <div className="bg-black/40 w-full p-5 rounded-2xl border border-red-500/20 mb-8 text-left text-sm text-slate-300 shadow-inner">
                        <p className="text-red-400 font-medium whitespace-pre-wrap">{message || '사용자가 결제를 취소했습니다.'}</p>
                        {code && <p className="text-[11px] mt-3 text-red-500/60 font-mono bg-red-500/5 px-2 py-1 rounded w-fit">에러 코드: {code}</p>}
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm border border-white/10"
                    >
                        <Home className="w-5 h-5" /> 메인으로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    );
}
