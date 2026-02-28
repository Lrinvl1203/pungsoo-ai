import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export default function PaymentFail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const code = searchParams.get('code');
    const message = searchParams.get('message');

    return (
        <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-[#e5e1da]">
                <div className="flex flex-col items-center py-4">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="serif-font text-2xl font-bold text-[#4a443b] mb-4">결제가 취소되었거나 실패했습니다</h2>

                    <div className="bg-[#faf9f6] w-full p-4 rounded-xl border border-red-100 mb-8 text-left text-sm text-[#8c8273]">
                        <p className="text-red-500 font-medium whitespace-pre-wrap">{message || '사용자가 결제를 취소했습니다.'}</p>
                        {code && <p className="text-xs mt-2 opacity-60">에러 코드: {code}</p>}
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-[#4a443b] text-white font-bold rounded-xl hover:bg-[#3d3830] transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Home className="w-5 h-5" /> 메인으로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    );
}
