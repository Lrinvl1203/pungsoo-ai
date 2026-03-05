import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Home } from 'lucide-react';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'processing' | 'success' | 'fail'>('processing');
    const [errorMessage, setErrorMessage] = useState('');

    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    useEffect(() => {
        if (!paymentKey || !orderId || !amount) {
            setStatus('fail');
            setErrorMessage('잘못된 접근입니다. 결제 정보가 부족합니다.');
            return;
        }

        const confirmPayment = async () => {
            try {
                const response = await fetch('/api/confirm-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        paymentKey,
                        orderId,
                        amount,
                        // We would ideally pass name, contact, message from session storage or state if needed.
                        // For now, Toss confirmation is the priority. 
                        // In a real app, these should be temporarily stored before redirect.
                        name: localStorage.getItem('temp_order_name') || '비회원',
                        contact: localStorage.getItem('temp_order_contact') || '',
                        message: localStorage.getItem('temp_order_message') || '',
                        orderType: localStorage.getItem('temp_order_type') || 'frame',
                        userId: localStorage.getItem('temp_order_userId') || '',
                        analysisData: JSON.parse(localStorage.getItem('temp_order_analysisData') || 'null'),
                        objectSize: JSON.parse(localStorage.getItem('temp_order_objectSize') || 'null')
                    }),
                });

                if (response.ok) {
                    setStatus('success');
                    // Clear temp data
                    localStorage.removeItem('temp_order_name');
                    localStorage.removeItem('temp_order_contact');
                    localStorage.removeItem('temp_order_message');
                    localStorage.removeItem('temp_order_type');
                    localStorage.removeItem('temp_order_userId');
                    localStorage.removeItem('temp_order_analysisData');
                    localStorage.removeItem('temp_order_objectSize');
                } else {
                    let errorMsg = '결제 승인 중 오류가 발생했습니다.';
                    try {
                        const data = await response.json();
                        if (data.error) errorMsg = data.error;
                    } catch (e) {
                        // Handle cases where response is not JSON (e.g., 404 HTML from Vite dev server)
                        if (response.status === 404) {
                            errorMsg = '개발 모드(npm run dev)에서는 결제 승인 API가 실행되지 않습니다. Vercel 환경에서 테스트해주세요.';
                        } else {
                            errorMsg = `서버 오류 (${response.status})`;
                        }
                    }
                    setStatus('fail');
                    setErrorMessage(errorMsg);
                }
            } catch (error) {
                console.error(error);
                setStatus('fail');
                setErrorMessage('서버와 통신 중 문제가 발생했습니다.');
            }
        };

        confirmPayment();
    }, [paymentKey, orderId, amount]);

    return (
        <div className="min-h-screen bg-[#0c0a06] text-slate-100 font-display flex items-center justify-center p-4">
            <div className="bg-[#1a1508] p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>

                {status === 'processing' && (
                    <div className="flex flex-col items-center py-8 relative z-10">
                        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6 drop-shadow-lg" />
                        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">결제 승인 중...</h2>
                        <p className="text-slate-400 text-sm">잠시만 기다려주세요. 페이지를 닫지 마세요.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center py-4 animate-in fade-in zoom-in duration-300 relative z-10">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20 shadow-inner">
                            <CheckCircle2 className="w-10 h-10 text-green-500 drop-shadow-sm" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-4 tracking-tight">결제가 완료되었습니다!</h2>
                        <p className="text-slate-300 mb-8 leading-relaxed text-[15px]">
                            의뢰하신 내용이 천지인 거사님께 성공적으로 전달되었습니다.<br />
                            확인 후 빠르게 연락드리겠습니다.
                        </p>
                        <div className="bg-black/40 w-full p-5 rounded-2xl border border-white/5 mb-8 text-left text-sm text-slate-300 shadow-inner">
                            <div className="flex justify-between mb-3 border-b border-white/10 pb-3">
                                <span className="text-slate-400">결제 금액</span>
                                <span className="font-bold text-primary text-lg">{Number(amount).toLocaleString()}원</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">주문 번호</span>
                                <span className="font-mono text-[11px] bg-white/5 px-2 py-1.5 rounded-lg border border-white/5 text-slate-300">{orderId}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-4 bg-primary text-[#0c0a06] font-bold rounded-2xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-lg hover:-translate-y-1"
                        >
                            <Home className="w-5 h-5" /> 메인으로 돌아가기
                        </button>
                    </div>
                )}

                {status === 'fail' && (
                    <div className="flex flex-col items-center py-4 relative z-10">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-inner">
                            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-white mb-4 tracking-tight">결제 승인 실패</h2>
                        <p className="text-red-400 mb-8 font-medium">{errorMessage}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 hover:text-white transition-all border border-white/10 shadow-sm"
                        >
                            홈으로 돌아가기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
