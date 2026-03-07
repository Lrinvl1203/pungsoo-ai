import React, { useEffect, useState } from 'react';
import PaymentButton from './PaymentButton';
import { X, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    orderName: string;
    orderType: 'report' | 'remedy' | 'zodiac';
    analysisId?: number | null;
}

export default function DigitalPaymentModal({ isOpen, onClose, amount, orderName, orderType, analysisId }: Props) {
    const { user } = useAuth();

    // Prevent scrolling on background when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
            <div className="bg-[#1a1508] border border-primary/50 flex flex-col rounded-3xl w-full max-w-lg relative shadow-[0_0_50px_rgba(212,175,55,0.15)] overflow-hidden transform animate-in slide-in-from-bottom-8 duration-300">
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between pb-4 bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold text-white tracking-tight">{orderName}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 bg-[#1a1508] max-h-[70vh] overflow-y-auto">
                    <div className="mb-6 p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                        <p className="text-slate-300 text-sm mb-1">결제 금액 (VAT 포함)</p>
                        <p className="text-3xl font-black text-primary">{amount.toLocaleString()}<span className="text-lg text-slate-400 ml-1">원</span></p>
                    </div>

                    <PaymentButton
                        amount={amount}
                        orderName={orderName}
                        orderType={orderType as any}
                        onSuccess={() => {
                            // temporary storage before Toss redirect to confirm-payment
                            localStorage.setItem('temp_order_type', orderType);
                            localStorage.setItem('temp_order_userId', user?.id || '');
                            if (analysisId) {
                                localStorage.setItem('temp_order_analysisId', analysisId.toString());
                            }
                        }}
                    />
                </div>

                {/* Footer Decor */}
                <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50"></div>
            </div>
        </div>
    );
}
