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
                        analysisData: JSON.parse(localStorage.getItem('temp_order_analysisData') || 'null')
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
        <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-[#e5e1da]">
                {status === 'processing' && (
                    <div className="flex flex-col items-center py-8">
                        <Loader2 className="w-16 h-16 text-[#d4af37] animate-spin mb-6" />
                        <h2 className="serif-font text-2xl font-bold text-[#4a443b] mb-2">결제 승인 중...</h2>
                        <p className="text-[#8c8273]">잠시만 기다려주세요. 페이지를 닫지 마세요.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center py-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="serif-font text-2xl font-bold text-[#4a443b] mb-4">결제가 완료되었습니다!</h2>
                        <p className="text-[#6b6256] mb-8 leading-relaxed">
                            의뢰하신 내용이 천지인 거사님께 성공적으로 전달되었습니다.<br />
                            확인 후 빠르게 연락드리겠습니다.
                        </p>
                        <div className="bg-[#faf9f6] w-full p-4 rounded-xl border border-[#e5e1da] mb-8 text-left text-sm text-[#8c8273]">
                            <div className="flex justify-between mb-2">
                                <span>결제 금액</span>
                                <span className="font-bold text-[#4a443b]">{Number(amount).toLocaleString()}원</span>
                            </div>
                            <div className="flex justify-between">
                                <span>주문 번호</span>
                                <span className="font-mono text-xs">{orderId}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-4 bg-[#d4af37] text-white font-bold rounded-xl hover:bg-[#c29d2f] transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            <Home className="w-5 h-5" /> 메인으로 돌아가기
                        </button>
                    </div>
                )}

                {status === 'fail' && (
                    <div className="flex flex-col items-center py-4">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="serif-font text-2xl font-bold text-[#4a443b] mb-4">결제 승인 싪패</h2>
                        <p className="text-red-500 mb-8">{errorMessage}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-4 bg-[#faf9f6] text-[#6b6256] font-bold rounded-xl hover:bg-[#e5e1da] transition-all border border-[#e5e1da]"
                        >
                            홈으로 돌아가기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
