import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CreditCard, ExternalLink } from 'lucide-react';
import { trackEvent } from '../services/analyticsService';
import { AnalysisScope, ProductSku } from '../services/productCatalog';

interface PaymentButtonProps {
    amount: number;
    orderName: string;
    orderType: 'report' | 'remedy' | 'zodiac' | 'frame' | 'object';
    analysisScope?: AnalysisScope;
    productSku?: ProductSku;
    onSuccess: (paymentKey: string, orderId: string, amount: number) => void;
    onFail?: () => void;
    disabled?: boolean;
}

declare global {
    interface Window {
        Paddle?: {
            Environment?: { set: (environment: 'sandbox') => void };
            Initialize: (options: Record<string, unknown>) => void;
            Checkout: { open: (options: Record<string, unknown>) => void };
        };
        __PUNGSOO_PADDLE_READY__?: boolean;
        __PUNGSOO_PADDLE_EVENT_CALLBACK__?: (event: { name?: string; data?: { transaction_id?: string } }) => void;
    }
}

const PADDLE_PRICE_ENV_BY_ORDER_TYPE: Record<PaymentButtonProps['orderType'], string | undefined> = {
    report: import.meta.env.VITE_PADDLE_PRICE_REPORT,
    remedy: import.meta.env.VITE_PADDLE_PRICE_REMEDY,
    zodiac: import.meta.env.VITE_PADDLE_PRICE_ZODIAC,
    frame: undefined,
    object: undefined,
};

const LATPEED_URL_ENV_BY_ORDER_TYPE: Record<PaymentButtonProps['orderType'], string | undefined> = {
    report: import.meta.env.VITE_LATPEED_URL_REPORT,
    remedy: import.meta.env.VITE_LATPEED_URL_REMEDY,
    zodiac: import.meta.env.VITE_LATPEED_URL_ZODIAC,
    frame: import.meta.env.VITE_LATPEED_URL_FRAME,
    object: import.meta.env.VITE_LATPEED_URL_OBJECT,
};

const getLocalStorageValue = (key: string) => {
    if (typeof window === 'undefined') return '';
    return (localStorage.getItem(key) || '').trim();
};

const getLatpeedProductUrl = (orderType: PaymentButtonProps['orderType']) => {
    const storageKey = `PUNGSOO_LATPEED_URL_${orderType.toUpperCase()}`;
    return (getLocalStorageValue(storageKey) || LATPEED_URL_ENV_BY_ORDER_TYPE[orderType] || '').trim();
};

const buildLatpeedUrl = (productUrl: string, params: Record<string, string | number>) => {
    const url = new URL(productUrl);
    Object.entries(params).forEach(([key, value]) => {
        if (value === '') return;
        url.searchParams.set(key, String(value));
    });
    return url.toString();
};

const loadPaddleScript = () => {
    if (window.Paddle) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
        const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://cdn.paddle.com/paddle/v2/paddle.js"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(), { once: true });
            existingScript.addEventListener('error', () => reject(new Error('Paddle.js 로드에 실패했습니다.')), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Paddle.js 로드에 실패했습니다.'));
        document.head.appendChild(script);
    });
};

export default function PaymentButton({ amount, orderName, orderType, analysisScope, productSku, onSuccess, onFail, disabled }: PaymentButtonProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const orderId = useRef('order_' + Date.now() + '_' + crypto.randomUUID().replace(/-/g, '').slice(0, 18));
    const navigate = useNavigate();
    const isTestMode = import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem('PUNGSOO_TEST_MODE') === 'true';
    const paddleClientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
    const paddlePriceId = PADDLE_PRICE_ENV_BY_ORDER_TYPE[orderType];
    const paymentProvider = (
        import.meta.env.VITE_PAYMENT_PROVIDER ||
        getLocalStorageValue('PUNGSOO_PAYMENT_PROVIDER') ||
        ''
    ).trim().toLowerCase();
    const latpeedProductUrl = getLatpeedProductUrl(orderType);
    const shouldUseLatpeed = !!latpeedProductUrl && (!paymentProvider || paymentProvider === 'latpeed');
    const shouldUsePolar = !isTestMode && paymentProvider === 'polar';
    const shouldUsePaddle = !isTestMode && !shouldUseLatpeed && !shouldUsePolar && !!paddleClientToken && !!paddlePriceId;
    const providerName = isTestMode && !shouldUseLatpeed
        ? 'mock'
        : shouldUseLatpeed
            ? 'latpeed'
            : shouldUsePolar
                ? 'polar'
                : shouldUsePaddle
                    ? 'paddle'
                    : 'toss';

    const handlePayment = async () => {
        setIsProcessing(true);
        onSuccess('', orderId.current, amount);
        localStorage.setItem('temp_order_amount', String(amount));
        localStorage.setItem('temp_order_id', orderId.current);
        trackEvent('payment_checkout_started', {
            userId: localStorage.getItem('temp_order_userId') || null,
            analysisId: localStorage.getItem('temp_order_analysisId') || null,
            orderId: orderId.current,
            orderType,
            amount,
            metadata: { provider: providerName, orderName, analysisScope, productSku },
        });

        try {
            if (isTestMode && !shouldUseLatpeed) {
                await new Promise(resolve => setTimeout(resolve, 1200));

                const mockPaymentKey = 'mock_pk_' + crypto.randomUUID().replace(/-/g, '');
                navigate(
                    `/payment/success?paymentKey=${mockPaymentKey}&orderId=${orderId.current}&amount=${amount}`
                );
                return;
            }

            if (shouldUseLatpeed) {
                const analysisId = localStorage.getItem('temp_order_analysisId') || '';
                const userId = localStorage.getItem('temp_order_userId') || '';
                const claimUrl = new URL('/latpeed/claim', window.location.origin);
                claimUrl.searchParams.set('orderId', orderId.current);
                claimUrl.searchParams.set('orderType', orderType);
                claimUrl.searchParams.set('amount', String(amount));
                if (analysisId) claimUrl.searchParams.set('analysisId', analysisId);
                const returnUrl = claimUrl.toString();

                localStorage.setItem('temp_order_provider', 'latpeed');
                localStorage.setItem('temp_latpeed_return_url', returnUrl);
                localStorage.setItem('temp_latpeed_claim_url', returnUrl);

                const checkoutUrl = buildLatpeedUrl(latpeedProductUrl, {
                    source: 'pungsoo-ai',
                    order_id: orderId.current,
                    order_type: orderType,
                    analysis_scope: analysisScope || '',
                    product_sku: productSku || '',
                    analysis_id: analysisId,
                    user_id: userId,
                    amount,
                    return_url: returnUrl,
                    success_url: returnUrl,
                });

                window.location.href = checkoutUrl;
                return;
            }

            if (paymentProvider === 'latpeed') {
                throw new Error('Latpeed product URL is missing. Set VITE_LATPEED_URL_REPORT or PUNGSOO_LATPEED_URL_REPORT first.');
            }

            if (shouldUsePolar) {
                const response = await fetch('/api/create-polar-checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        orderId: orderId.current,
                        orderType,
                        amount,
                        orderName,
                        userId: localStorage.getItem('temp_order_userId') || '',
                        analysisId: localStorage.getItem('temp_order_analysisId') || '',
                        analysisScope,
                        productSku,
                    }),
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok || !data.url) {
                    throw new Error(data.error || 'Polar checkout session could not be created.');
                }

                localStorage.setItem('temp_order_provider', 'polar');
                window.location.href = data.url;
                return;
            }

            if (shouldUsePaddle) {
                await loadPaddleScript();

                if (!window.Paddle) {
                    throw new Error('Paddle 결제 모듈을 불러오지 못했습니다.');
                }

                window.__PUNGSOO_PADDLE_EVENT_CALLBACK__ = (event) => {
                    if (event.name !== 'checkout.completed') return;
                    const transactionId = event.data?.transaction_id;
                    if (!transactionId) return;
                    navigate(`/payment/success?provider=paddle&paddleTransactionId=${transactionId}&orderId=${orderId.current}&amount=${amount}`);
                };

                if (!window.__PUNGSOO_PADDLE_READY__) {
                    if (import.meta.env.VITE_PADDLE_ENV === 'sandbox') {
                        window.Paddle.Environment?.set('sandbox');
                    }

                    window.Paddle.Initialize({
                        token: paddleClientToken,
                        checkout: {
                            settings: {
                                displayMode: 'overlay',
                                theme: 'light',
                                locale: 'ko',
                            },
                        },
                        eventCallback: (event: { name?: string; data?: { transaction_id?: string } }) => {
                            window.__PUNGSOO_PADDLE_EVENT_CALLBACK__?.(event);
                        },
                    });
                    window.__PUNGSOO_PADDLE_READY__ = true;
                }

                window.Paddle.Checkout.open({
                    settings: {
                        displayMode: 'overlay',
                        theme: 'light',
                        locale: 'ko',
                    },
                    items: [
                        {
                            priceId: paddlePriceId,
                            quantity: 1,
                        },
                    ],
                    customData: {
                        orderId: orderId.current,
                        orderType,
                        userId: localStorage.getItem('temp_order_userId') || '',
                        analysisId: localStorage.getItem('temp_order_analysisId') || '',
                        analysisScope: analysisScope || '',
                        productSku: productSku || '',
                        app: 'pungsoo-ai',
                    },
                });
                setIsProcessing(false);
                return;
            }

            const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
            if (!clientKey) {
                throw new Error('Toss 클라이언트 키가 설정되지 않았습니다.');
            }

            const { ANONYMOUS, loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
            const tossPayments = await loadTossPayments(clientKey);
            const payment = tossPayments.payment({ customerKey: ANONYMOUS });

            await payment.requestPayment({
                method: 'CARD',
                amount: {
                    currency: 'KRW',
                    value: amount,
                },
                orderId: orderId.current,
                orderName,
                successUrl: `${window.location.origin}/payment/success`,
                failUrl: `${window.location.origin}/payment/fail`,
                card: {
                    useEscrow: false,
                    flowMode: 'DEFAULT',
                    useCardPoint: false,
                    useAppCardOnly: false,
                },
            });
        } catch (error) {
            console.error('Payment request failed:', error);
            trackEvent('payment_request_failed', {
                userId: localStorage.getItem('temp_order_userId') || null,
                analysisId: localStorage.getItem('temp_order_analysisId') || null,
                orderId: orderId.current,
                orderType,
                amount,
                metadata: {
                    provider: providerName,
                    message: error instanceof Error ? error.message : String(error),
                },
            });
            onFail?.();
            alert(error instanceof Error ? error.message : '결제 요청 중 문제가 발생했습니다.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-4">
            {shouldUseLatpeed && (
                <div className="w-full p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <ExternalLink className="mx-auto mb-1 h-4 w-4 text-emerald-300" />
                    <p className="text-emerald-300 text-xs font-medium">Latpeed 결제 링크로 이동합니다.</p>
                </div>
            )}
            {!shouldUseLatpeed && (isTestMode ? (
                <div className="w-full p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                    <p className="text-yellow-400 text-xs font-medium">🧪 테스트 모드 — 실제 결제가 이루어지지 않습니다</p>
                </div>
            ) : (
                <div className="w-full p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
                    <p className="text-blue-300 text-xs font-medium">{shouldUsePolar ? 'Polar 보안 결제창으로 이동합니다' : shouldUsePaddle ? 'Paddle 글로벌 결제창으로 이동합니다' : 'Toss Payments 결제창으로 이동합니다'}</p>
                </div>
            ))}

            <button
                type="button"
                onClick={handlePayment}
                disabled={disabled || isProcessing}
                className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
          ${disabled || isProcessing
                        ? 'bg-[#c9c5bd] text-white cursor-not-allowed'
                        : 'bg-[#3182f6] text-white hover:bg-[#1b64da] hover:scale-[1.02] active:scale-95'}`}
            >
                {isProcessing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> 결제 처리 중...</>
                ) : (
                    <>{shouldUseLatpeed || shouldUsePolar ? <ExternalLink className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />} {amount.toLocaleString()}원 결제하기{isTestMode && !shouldUseLatpeed ? ' (테스트)' : ''}</>
                )}
            </button>
        </div>
    );
}
