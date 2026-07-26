import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Home } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { trackEvent } from '../services/analyticsService';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'processing' | 'success' | 'fail'>('processing');
    const [errorMessage, setErrorMessage] = useState('');
    const [returnPath, setReturnPath] = useState('/');
    const [analyticsOrderType, setAnalyticsOrderType] = useState('');
    const trackedStatusRef = useRef<string | null>(null);

    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const provider = searchParams.get('provider');
    const paddleTransactionId = searchParams.get('paddleTransactionId');
    const polarCheckoutId = searchParams.get('checkoutId') || searchParams.get('checkout_id');

    const clearTempOrder = () => {
        localStorage.removeItem('temp_order_name');
        localStorage.removeItem('temp_order_contact');
        localStorage.removeItem('temp_order_message');
        localStorage.removeItem('temp_order_type');
        localStorage.removeItem('temp_order_analysisScope');
        localStorage.removeItem('temp_order_productSku');
        localStorage.removeItem('temp_order_userId');
        localStorage.removeItem('temp_order_analysisId');
        localStorage.removeItem('temp_order_analysisData');
        localStorage.removeItem('temp_order_objectSize');
        localStorage.removeItem('temp_order_amount');
        localStorage.removeItem('temp_order_id');
        localStorage.removeItem('temp_order_provider');
        localStorage.removeItem('temp_latpeed_return_url');
        localStorage.removeItem('temp_latpeed_claim_url');
    };

    useEffect(() => {
        if (provider === 'latpeed') {
            const confirmLatpeedPayment = async () => {
                const orderType = localStorage.getItem('temp_order_type') || 'report';
                setAnalyticsOrderType(orderType);
                const userId = localStorage.getItem('temp_order_userId') || '';
                const analysisId = localStorage.getItem('temp_order_analysisId') || null;
                const resolvedOrderId = orderId || localStorage.getItem('temp_order_id') || '';
                const resolvedAmount = Number(amount || localStorage.getItem('temp_order_amount') || 0);
                const claimUrl = new URL('/latpeed/claim', window.location.origin);
                if (resolvedOrderId) claimUrl.searchParams.set('orderId', resolvedOrderId);
                claimUrl.searchParams.set('orderType', orderType);
                claimUrl.searchParams.set('amount', String(resolvedAmount || ''));
                if (analysisId) claimUrl.searchParams.set('analysisId', analysisId);

                if (analysisId && ['report', 'remedy', 'zodiac'].includes(orderType)) {
                    setReturnPath(`/analyze?id=${analysisId}`);
                } else {
                    setReturnPath('/mypage');
                }

                if (!resolvedOrderId) {
                    setStatus('fail');
                    setErrorMessage('Latpeed orderId가 없습니다. 결제 버튼에서 다시 시도해 주세요.');
                    return;
                }

                try {
                    if (!import.meta.env.DEV || userId) {
                        const { data: existingPurchase } = await supabase
                            .from('purchases')
                            .select('order_id')
                            .eq('order_id', resolvedOrderId)
                            .eq('status', 'COMPLETED')
                            .maybeSingle();

                        if (existingPurchase) {
                            clearTempOrder();
                            setStatus('success');
                            return;
                        }
                    }

                    if (!import.meta.env.DEV) {
                        navigate(`${claimUrl.pathname}${claimUrl.search}`, { replace: true });
                        return;
                    }

                    if (userId) {
                        const { error } = await supabase.from('purchases').insert([{
                            user_id: userId,
                            order_id: resolvedOrderId,
                            payment_key: `latpeed_manual_${resolvedOrderId}`,
                            amount: resolvedAmount,
                            order_type: orderType,
                            status: 'COMPLETED',
                            analysis_id: analysisId || null,
                            buyer_name: 'Latpeed manual test',
                            contact_info: 'local-dev',
                        }]);

                        if (error) {
                            console.warn('Latpeed local confirmation insert failed:', error);
                        }
                    }

                    clearTempOrder();
                    setStatus('success');
                } catch (error) {
                    console.error(error);
                    setStatus('fail');
                    setErrorMessage('Latpeed 결제 확인 중 문제가 발생했습니다.');
                }
            };

            confirmLatpeedPayment();
            return;
        }

        if (provider === 'polar' && polarCheckoutId) {
            const confirmPolarPayment = async () => {
                try {
                    const orderType = localStorage.getItem('temp_order_type') || 'report';
                    setAnalyticsOrderType(orderType);
                    const analysisId = localStorage.getItem('temp_order_analysisId') || null;
                    if (analysisId && ['report', 'remedy', 'zodiac'].includes(orderType)) {
                        setReturnPath(`/analyze?id=${analysisId}`);
                    } else {
                        setReturnPath('/mypage');
                    }

                    const response = await fetch('/api/confirm-polar-payment', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            checkoutId: polarCheckoutId,
                            orderId,
                        }),
                    });

                    let confirmationData: any = {};
                    try {
                        confirmationData = await response.json();
                    } catch {
                        confirmationData = {};
                    }

                    if (!response.ok) {
                        let errorMsg = 'Polar 결제 확인 중 오류가 발생했습니다.';
                        try {
                            const data = confirmationData;
                            if (data.error) errorMsg = data.error;
                        } catch {
                            errorMsg = `서버 오류 (${response.status})`;
                        }
                        setStatus('fail');
                        setErrorMessage(errorMsg);
                        return;
                    }

                    if (confirmationData.analysisId && ['report', 'remedy', 'zodiac'].includes(confirmationData.orderType)) {
                        setReturnPath(`/analyze?id=${confirmationData.analysisId}`);
                    } else if (!analysisId) {
                        setReturnPath('/mypage');
                    }

                    clearTempOrder();
                    setStatus('success');
                } catch (error) {
                    console.error(error);
                    setStatus('fail');
                    setErrorMessage('Polar 서버와 통신 중 문제가 발생했습니다.');
                }
            };

            confirmPolarPayment();
            return;
        }

        if (provider === 'paddle' && paddleTransactionId) {
            const confirmPaddlePayment = async () => {
                try {
                    const orderType = localStorage.getItem('temp_order_type') || 'report';
                    setAnalyticsOrderType(orderType);
                    const analysisId = localStorage.getItem('temp_order_analysisId') || null;
                    if (analysisId && ['report', 'remedy', 'zodiac'].includes(orderType)) {
                        setReturnPath(`/analyze?id=${analysisId}`);
                    } else {
                        setReturnPath('/mypage');
                    }

                    const response = await fetch('/api/confirm-paddle-payment', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            transactionId: paddleTransactionId,
                            orderId,
                        }),
                    });

                    if (!response.ok) {
                        let errorMsg = 'Paddle 결제 확인 중 오류가 발생했습니다.';
                        try {
                            const data = await response.json();
                            if (data.error) errorMsg = data.error;
                        } catch {
                            errorMsg = `서버 오류 (${response.status})`;
                        }
                        setStatus('fail');
                        setErrorMessage(errorMsg);
                        return;
                    }

                    localStorage.removeItem('temp_order_name');
                    localStorage.removeItem('temp_order_contact');
                    localStorage.removeItem('temp_order_message');
                    localStorage.removeItem('temp_order_type');
                    localStorage.removeItem('temp_order_analysisScope');
                    localStorage.removeItem('temp_order_productSku');
                    localStorage.removeItem('temp_order_userId');
                    localStorage.removeItem('temp_order_analysisId');
                    localStorage.removeItem('temp_order_analysisData');
                    localStorage.removeItem('temp_order_objectSize');
                    localStorage.removeItem('temp_order_amount');
                    setStatus('success');
                } catch (error) {
                    console.error(error);
                    setStatus('fail');
                    setErrorMessage('Paddle 서버와 통신 중 문제가 발생했습니다.');
                }
            };

            confirmPaddlePayment();
            return;
        }

        if (!paymentKey || !orderId || !amount) {
            setStatus('fail');
            setErrorMessage('잘못된 접근입니다. 결제 정보가 부족합니다.');
            return;
        }

        // Mock 결제 모드: 실제 API 호출 없이 성공 처리 + DB 저장
        if (paymentKey.startsWith('mock_')) {
            (async () => {
                const orderType = localStorage.getItem('temp_order_type') || 'report';
                setAnalyticsOrderType(orderType);
                const userId = localStorage.getItem('temp_order_userId') || '';
                const analysisId = localStorage.getItem('temp_order_analysisId');
                const analysisScope = localStorage.getItem('temp_order_analysisScope');
                const productSku = localStorage.getItem('temp_order_productSku');
                if (analysisId && ['report', 'remedy', 'zodiac'].includes(orderType)) {
                    setReturnPath(`/analyze?id=${analysisId}`);
                } else {
                    setReturnPath('/mypage');
                }
                if (userId) {
                    await supabase.from('purchases').insert([{
                        user_id: userId,
                        order_id: orderId,
                        payment_key: paymentKey,
                        amount: parseInt(amount),
                        order_type: orderType,
                        status: 'COMPLETED',
                        analysis_id: analysisId || null,
                        analysis_scope: ['internal', 'external'].includes(analysisScope || '') ? analysisScope : null,
                        product_sku: productSku || null,
                    }]);
                }
                localStorage.removeItem('temp_order_type');
                localStorage.removeItem('temp_order_analysisScope');
                localStorage.removeItem('temp_order_productSku');
                localStorage.removeItem('temp_order_userId');
                localStorage.removeItem('temp_order_analysisId');
                localStorage.removeItem('temp_order_name');
                localStorage.removeItem('temp_order_contact');
                localStorage.removeItem('temp_order_message');
                localStorage.removeItem('temp_order_analysisData');
                localStorage.removeItem('temp_order_objectSize');
                localStorage.removeItem('temp_order_amount');
                setStatus('success');
            })();
            return;
        }

        const confirmPayment = async () => {
            try {
                const orderType = localStorage.getItem('temp_order_type') || 'frame';
                setAnalyticsOrderType(orderType);
                const analysisId = localStorage.getItem('temp_order_analysisId') || null;
                if (analysisId && ['report', 'remedy', 'zodiac'].includes(orderType)) {
                    setReturnPath(`/analyze?id=${analysisId}`);
                } else {
                    setReturnPath('/mypage');
                }

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
                        orderType,
                        userId: localStorage.getItem('temp_order_userId') || '',
                        analysisId,
                        analysisScope: localStorage.getItem('temp_order_analysisScope') || null,
                        productSku: localStorage.getItem('temp_order_productSku') || null,
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
                    localStorage.removeItem('temp_order_analysisScope');
                    localStorage.removeItem('temp_order_productSku');
                    localStorage.removeItem('temp_order_userId');
                    localStorage.removeItem('temp_order_analysisId');
                    localStorage.removeItem('temp_order_analysisData');
                    localStorage.removeItem('temp_order_objectSize');
                    localStorage.removeItem('temp_order_amount');
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
    }, [paymentKey, orderId, amount, provider, paddleTransactionId, polarCheckoutId]);

    useEffect(() => {
        if (status === 'processing' || trackedStatusRef.current === status) return;
        trackedStatusRef.current = status;

        const resolvedAmount = Number(amount || localStorage.getItem('temp_order_amount') || 0);
        trackEvent(status === 'success' ? 'payment_completed' : 'payment_failed', {
            orderId,
            orderType: analyticsOrderType || localStorage.getItem('temp_order_type') || null,
            amount: resolvedAmount,
            metadata: {
                provider: provider || localStorage.getItem('temp_order_provider') || (paymentKey?.startsWith('mock_') ? 'mock' : 'toss'),
                checkoutId: polarCheckoutId || undefined,
                paddleTransactionId: paddleTransactionId || undefined,
                errorMessage: status === 'fail' ? errorMessage : undefined,
                returnPath,
            },
        });
    }, [status, orderId, analyticsOrderType, amount, provider, paymentKey, polarCheckoutId, paddleTransactionId, errorMessage, returnPath]);

    useEffect(() => {
        if (status !== 'success') return;
        const redirectTimer = window.setTimeout(() => {
            navigate(returnPath, { replace: true });
        }, 1500);

        return () => window.clearTimeout(redirectTimer);
    }, [status, returnPath, navigate]);

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
                                <span className="font-bold text-primary text-lg">{Number(amount || localStorage.getItem('temp_order_amount') || 0).toLocaleString()}원</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">주문 번호</span>
                                <span className="font-mono text-[11px] bg-white/5 px-2 py-1.5 rounded-lg border border-white/5 text-slate-300">{orderId}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate(returnPath)}
                            className="w-full py-4 bg-primary text-[#0c0a06] font-bold rounded-2xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-lg hover:-translate-y-1"
                        >
                            <Home className="w-5 h-5" /> 구매한 콘텐츠 확인하기
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
