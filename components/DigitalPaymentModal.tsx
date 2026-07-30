import React, { useEffect, useState } from 'react';
import PaymentButton from './PaymentButton';
import { CheckCircle2, ShieldCheck, X, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { trackEvent } from '../services/analyticsService';
import { DIGITAL_PRODUCT_TAX_NOTE } from '../services/pricing';
import { AnalysisScope, getProductDescriptor } from '../services/productCatalog';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    orderName: string;
    orderType: 'report' | 'remedy' | 'zodiac';
    analysisId?: string | null;
    analysisScope: AnalysisScope;
}

export default function DigitalPaymentModal({ isOpen, onClose, amount, orderName, orderType, analysisId, analysisScope }: Props) {
    const { user } = useAuth();
    const product = getProductDescriptor(analysisScope, orderType);
    const modalRef = useModalFocusTrap(isOpen, onClose);

    useEffect(() => {
        if (isOpen) {
            trackEvent('payment_modal_viewed', {
                userId: user?.id,
                analysisId,
                orderType,
                amount,
                metadata: { analysisScope, productSku: product.sku },
            });
        }
    }, [isOpen, user?.id, analysisId, orderType, amount, analysisScope, product.sku]);

    if (!isOpen) return null;
    const requiresAnalysis = ['report', 'remedy', 'zodiac'].includes(orderType);
    const isPaymentReady = !requiresAnalysis || !!analysisId;
    const modalCopy = {
        report: {
            label: '프리미엄 공간비방서',
            description: '상세 감명서, 오행 균형표와 전체 비보 처방을 열람합니다. 비방화와 수호 오브제는 각각 별도 구매 상품입니다.',
            items: ['상세 감명서 전체 본문', '오행 균형표와 원인 해석', '전체 비보 처방과 배치 위치'],
        },
        remedy: {
            label: '디지털 비방 아트 원본',
            description: '공간에 부족한 오행을 보완하는 비방 아트 원본과 해설을 열람합니다.',
            items: ['고해상도 비방 아트', '처방 키워드와 생성 해설', '원본 다운로드'],
        },
        zodiac: {
            label: '수호 오브제 설계도',
            description: '12간지 수호 오브제 이미지, 재질, 색상, 배치 해설을 열람합니다.',
            items: ['수호 오브제 이미지', '재질·색상·방향 해설', '배치 및 쇼핑 키워드'],
        },
    }[orderType];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="payment-modal-title"
                tabIndex={-1}
                className="bg-[#1a1508] border border-primary/50 flex flex-col rounded-3xl w-full max-w-lg relative shadow-[0_0_50px_rgba(212,175,55,0.15)] overflow-hidden transform animate-in slide-in-from-bottom-8 duration-300 outline-none"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between pb-4 bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h2 id="payment-modal-title" className="text-xl font-bold text-white tracking-tight">{orderName}</h2>
                    </div>
                    <button onClick={onClose} aria-label="결제 창 닫기" className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 bg-[#1a1508] max-h-[70vh] overflow-y-auto">
                    <div className="mb-6 p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                        <p className="text-slate-300 text-sm mb-1">최종 결제 예상 금액</p>
                        <p className="text-3xl font-black text-primary">{amount.toLocaleString()}<span className="text-lg text-slate-400 ml-1">원</span></p>
                        <p className="mt-1 text-[11px] font-bold text-slate-500">{DIGITAL_PRODUCT_TAX_NOTE}</p>
                    </div>

                    <div className="mb-5 rounded-2xl border border-primary/25 bg-primary/10 p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <h3 className="font-black text-white">{modalCopy.label}</h3>
                        </div>
                        <p className="mb-4 text-sm leading-relaxed text-slate-300">{modalCopy.description}</p>
                        <div className="grid gap-2">
                            {modalCopy.items.map((item) => (
                                <div key={item} className="flex items-center gap-2 rounded-xl bg-black/25 px-3 py-2 text-sm font-bold text-slate-100">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-5 grid gap-2 sm:grid-cols-3">
                        {['결제 후 즉시 열람', '마이페이지 보관', '환불 요청 가능'].map((item) => (
                            <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-[12px] font-bold text-slate-300">
                                {item}
                            </div>
                        ))}
                    </div>

                    {!isPaymentReady && (
                        <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-center text-xs font-medium text-yellow-300">
                            분석 결과를 결제 내역과 연결하는 중입니다. 잠시 후 다시 눌러주세요.
                        </div>
                    )}

                    <PaymentButton
                        amount={amount}
                        orderName={orderName}
                        orderType={orderType}
                        analysisScope={analysisScope}
                        productSku={product.sku}
                        onSuccess={() => {
                            // temporary storage before Toss redirect to confirm-payment
                            localStorage.setItem('temp_order_type', orderType);
                            localStorage.setItem('temp_order_analysisScope', analysisScope);
                            localStorage.setItem('temp_order_productSku', product.sku);
                            localStorage.setItem('temp_order_userId', user?.id || '');
                            if (analysisId) {
                                localStorage.setItem('temp_order_analysisId', analysisId);
                            }
                        }}
                        disabled={!isPaymentReady}
                    />
                </div>

                {/* Footer Decor */}
                <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50"></div>
            </div>
        </div>
    );
}
