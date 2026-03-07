import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CreditCard } from 'lucide-react';

interface PaymentButtonProps {
    amount: number;
    orderName: string;
    orderType: 'frame' | 'object';
    onSuccess: (paymentKey: string, orderId: string, amount: number) => void;
    onFail?: () => void;
    disabled?: boolean;
}

export default function PaymentButton({ amount, onSuccess, disabled }: PaymentButtonProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const orderId = useRef('mock_' + crypto.randomUUID().replace(/-/g, ''));
    const navigate = useNavigate();

    const handlePayment = async () => {
        setIsProcessing(true);
        // localStorage 저장 (DigitalPaymentModal의 onSuccess 콜백)
        onSuccess('', '', amount);

        // 실제 결제처럼 짧은 딜레이
        await new Promise(resolve => setTimeout(resolve, 1200));

        const mockPaymentKey = 'mock_pk_' + crypto.randomUUID().replace(/-/g, '');
        navigate(
            `/payment/success?paymentKey=${mockPaymentKey}&orderId=${orderId.current}&amount=${amount}`
        );
    };

    return (
        <div className="w-full flex flex-col gap-4">
            {/* Mock 안내 배너 */}
            <div className="w-full p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                <p className="text-yellow-400 text-xs font-medium">🧪 개발 모드 — 실제 결제가 이루어지지 않습니다</p>
            </div>

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
                    <><CreditCard className="w-5 h-5" /> {amount.toLocaleString()}원 결제하기 (테스트)</>
                )}
            </button>
        </div>
    );
}
