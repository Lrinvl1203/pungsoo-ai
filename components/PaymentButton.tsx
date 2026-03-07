import React, { useEffect, useRef, useState } from 'react';
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CreditCard } from 'lucide-react';

// Use Vercel env variable if available, otherwise forcefully fall back to the user's personal test client key.
// Client keys are safe to expose publicly in standard payment flows.
const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_d46qopOB89O0zmNDzRRYVZmM75y0';
const customerKey = 'test_customer_key'; // In production, use user's unique ID if logged in

interface PaymentButtonProps {
    amount: number;
    orderName: string;
    orderType: 'frame' | 'object';
    onSuccess: (paymentKey: string, orderId: string, amount: number) => void;
    onFail?: () => void;
    disabled?: boolean;
}

export default function PaymentButton({ amount, orderName, orderType, onSuccess, onFail, disabled }: PaymentButtonProps) {
    const { user } = useAuth();
    const [paymentWidget, setPaymentWidget] = useState<PaymentWidgetInstance | null>(null);
    const paymentMethodsWidgetRef = useRef<ReturnType<PaymentWidgetInstance['renderPaymentMethods']> | null>(null);
    const [isSdkLoaded, setIsSdkLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showWidget, setShowWidget] = useState(false);
    const [isWidgetRendered, setIsWidgetRendered] = useState(false);
    const orderId = useRef(crypto.randomUUID().replace(/-/g, ''));

    useEffect(() => {
        (async () => {
            try {
                const widget = await loadPaymentWidget(clientKey, user?.id || customerKey);
                setPaymentWidget(widget);
                setIsSdkLoaded(true);
            } catch (error) {
                console.error('Failed to load Tosspayments SDK', error);
            }
        })();
    }, [user]);

    useEffect(() => {
        if (paymentWidget && showWidget) {
            const paymentMethodsWidget = paymentWidget.renderPaymentMethods(
                '#payment-widget',
                { value: amount },
                { variantKey: 'DEFAULT' }
            );

            // Wait for iframe to fully render before allowing the user to click "requestPayment"
            paymentMethodsWidget.on('ready', () => {
                setIsWidgetRendered(true);
            });

            paymentWidget.renderAgreement('#agreement', { variantKey: 'AGREEMENT' });
            paymentMethodsWidgetRef.current = paymentMethodsWidget;
        }
    }, [paymentWidget, amount, showWidget]);

    const handlePayment = async () => {
        if (!showWidget) {
            setShowWidget(true);
            // Give the Toss Widget iframe a brief moment to mount on the DOM before requesting payment.
            // This prevents the "UI has not rendered yet" Toss internal error.
            return;
        }

        if (!paymentWidget || !isWidgetRendered) return;
        setIsProcessing(true);

        try {
            // Save temp data to localStorage before redirect
            onSuccess('', '', amount); // We pass empty strings because Toss hasn't created them yet, App.tsx only uses this to save state

            // paymentWidget.requestPayment returns a Promise but it physically redirects the user
            // so we use window.location.origin as the return URL, 
            // but Toss UI supports iframe approach which we will use here
            await paymentWidget.requestPayment({
                orderId: orderId.current,
                orderName,
                customerName: user?.user_metadata?.full_name || user?.user_metadata?.name || '익명 고객',
                customerEmail: user?.email || undefined,
                successUrl: `${window.location.origin}/payment/success`,
                failUrl: `${window.location.origin}/payment/fail`,
            });
            // Note: Because Toss SDK redirects, the following code won't run directly in Redirect mode.
            // However, PaymentWidget standard UI actually uses iframe/popup in most modern browsers.
            // If it redirects, we would need a dedicated route. 
            // To keep it SPA friendly, Toss usually callbacks if origin matches.
            // Actually, standard Toss V2 requires redirect. We will set up a fast mock or redirect catch later if needed.
        } catch (error) {
            console.error(error);
            if (onFail) onFail();
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isSdkLoaded) {
        return (
            <button disabled className="w-full py-4 rounded-xl bg-gray-100 text-gray-400 font-bold flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                결제 모듈 로딩 중...
            </button>
        );
    }

    return (
        <div className="w-full flex flex-col gap-4">
            {/* Toss Payment Widget Containers */}
            <div className={`w-full overflow-y-auto max-h-[50vh] custom-scrollbar rounded-xl border border-[#e5e1da] ${showWidget ? 'block' : 'hidden'}`}>
                <div id="payment-widget" className="w-full" />
                <div id="agreement" className="w-full" />
            </div>

            <button
                type="button"
                onClick={handlePayment}
                disabled={disabled || isProcessing}
                className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 
          ${disabled || isProcessing ? 'bg-[#c9c5bd] text-white cursor-not-allowed' : 'bg-[#3182f6] text-white hover:bg-[#1b64da] hover:scale-[1.02] active:scale-95'}`}
            >
                {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <CreditCard className="w-5 h-5" />
                )}
                {showWidget ? `${amount.toLocaleString()}원 결제하기` : `${amount.toLocaleString()}원 결제수단 선택하기`}
            </button>
        </div>
    );
}
