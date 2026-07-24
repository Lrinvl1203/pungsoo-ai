import React, { useState } from 'react';
import { Loader2, Download, Sparkles, MapPin, ExternalLink, Box, Lock } from 'lucide-react';
import { ZodiacRemedyObject } from '../types';
import { useAuth } from '../contexts/AuthContext';
import DigitalPaymentModal from './DigitalPaymentModal';
import LoginPromptModal from './LoginPromptModal';
import { supabase } from '../services/supabaseClient';
import { DIGITAL_PRODUCT_TOTAL_KRW, formatKrw } from '../services/pricing';

interface ZodiacCardProps {
    zodiacObject: ZodiacRemedyObject;
    zodiacImage: string | null;
    isGeneratingZodiacImage: boolean;
    onGenerateZodiacImage: () => void;
    onDownloadImage: (dataUrl: string, filename: string) => void;
    onOrderObject: () => void;
    currentAnalysisId?: string | null;
    premiumPreviewUnlocked?: boolean;
}

export default function ZodiacCard({ zodiacObject, zodiacImage, isGeneratingZodiacImage, onGenerateZodiacImage, onDownloadImage, onOrderObject, currentAnalysisId, premiumPreviewUnlocked = false }: ZodiacCardProps) {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [hasRequestedPaidImage, setHasRequestedPaidImage] = useState(false);
    const effectiveUnlocked = isUnlocked || premiumPreviewUnlocked;

    // Auth and Modals
    const { user } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Fetch unlock status from DB
    React.useEffect(() => {
        const checkUnlockStatus = async () => {
            if (user && currentAnalysisId) {
                const { data } = await supabase
                    .from('purchases')
                    .select('order_type')
                    .eq('user_id', user.id)
                    .eq('analysis_id', currentAnalysisId)
                    .eq('status', 'COMPLETED')
                    .eq('order_type', 'zodiac');

                if (data && data.length > 0) {
                    setIsUnlocked(true);
                }
            }
        };
        checkUnlockStatus();
    }, [user, currentAnalysisId]);

    React.useEffect(() => {
        if (!user) return;
        const raw = localStorage.getItem('pending_payment_intent');
        if (!raw) return;
        try {
            const intent = JSON.parse(raw);
            if (intent.type === 'zodiac') {
                localStorage.removeItem('pending_payment_intent');
                setShowPaymentModal(true);
            }
        } catch {
            localStorage.removeItem('pending_payment_intent');
        }
    }, [user]);

    React.useEffect(() => {
        if (isUnlocked && !zodiacImage && !isGeneratingZodiacImage && !hasRequestedPaidImage) {
            setHasRequestedPaidImage(true);
            onGenerateZodiacImage();
        }
    }, [isUnlocked, zodiacImage, isGeneratingZodiacImage, hasRequestedPaidImage, onGenerateZodiacImage]);

    const handleUnlockZodiac = () => {
        if (!user) {
            localStorage.setItem('pending_payment_intent', JSON.stringify({ type: 'zodiac' }));
            setShowLoginModal(true);
        } else {
            setShowPaymentModal(true);
        }
    };

    return (
        <section className="bg-[#101816] backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-primary/45 ring-4 ring-primary/10 mt-10 stagger-item" style={{ animationDelay: '0.6s' }}>
            <div className="bg-[#183028] p-5 text-white flex justify-between items-center shadow-sm border-b border-primary/25">
                <h3 className="font-bold flex items-center gap-3 text-xl">
                    <img src="/images/masters/myeongwol.jpeg" className="w-8 h-8 rounded-full border border-white object-cover object-top" alt="명월" />
                    제6장 수호물: 12간지 비방 오브제
                </h3>
            </div>
            <div className="p-6 md:p-8">
                <div className="flex flex-col gap-8">
                    {/* Object Display with Paywall */}
                    <div className="w-full max-w-sm mx-auto aspect-square bg-[#fcfbfa] rounded-2xl overflow-hidden relative shadow-inner ring-1 ring-black/5">
                        {zodiacImage ? (
                            <>
                                <img src={zodiacImage} alt="Zodiac Remedy Object" className={`w-full h-full object-cover transition-all duration-700 ${!effectiveUnlocked ? 'blur-xl scale-110 brightness-50' : 'blur-0 scale-100'}`} />
                                {!effectiveUnlocked && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-black/40 backdrop-blur-sm">
                                        <Lock className="w-10 h-10 text-primary mb-4" />
                                        <h4 className="text-xl font-bold text-white mb-2">수호 오브제 설계도 봉인</h4>
                                        <p className="text-sm text-slate-200 mb-6 leading-relaxed">명월 도사가 선별한 기운 보충용 오브제 디자인, 재질, 배치 해설을 열람합니다.</p>
                                        <button
                                            onClick={handleUnlockZodiac}
                                            className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#c29d2f] text-white font-bold rounded-xl hover:shadow-lg transition-all animate-pulse-glow"
                                        >
                                            수호 오브제 설계도 열람 ({formatKrw(DIGITAL_PRODUCT_TOTAL_KRW)})
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : effectiveUnlocked ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#221e10]">
                                {isUnlocked ? (
                                    <>
                                        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                                        <p className="text-[15px] text-slate-300 leading-relaxed">결제가 확인되었습니다.<br />맞춤형 <span className="font-bold text-primary">12간지 비방 오브제</span>를 생성 중입니다...</p>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-10 h-10 text-primary mb-4" />
                                        <h4 className="text-xl font-bold text-white mb-2">수호 오브제 미리보기</h4>
                                        <p className="text-sm text-slate-200 leading-relaxed">테스트 미리보기 상태입니다.<br />실제 결제 후 설계 이미지가 생성됩니다.</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#221e10]">
                                <Lock className="w-10 h-10 text-primary mb-4" />
                                <h4 className="text-xl font-bold text-white mb-2">수호 오브제 설계도 봉인</h4>
                                <p className="text-sm text-slate-200 mb-6 leading-relaxed">결제 후 12간지 수호 오브제 이미지를 생성하고 설계 해설을 열람할 수 있습니다.</p>
                                <button
                                    onClick={handleUnlockZodiac}
                                    className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#c29d2f] text-white font-bold rounded-xl hover:shadow-lg transition-all animate-pulse-glow"
                                >
                                    수호 오브제 생성 및 열람 ({formatKrw(DIGITAL_PRODUCT_TOTAL_KRW)})
                                </button>
                            </div>
                        )}
                        {(zodiacImage && effectiveUnlocked) && (
                            <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                                <button onClick={() => onDownloadImage(zodiacImage, 'FengShui_Zodiac_Object.png')}
                                    className="bg-black/60 backdrop-blur-md shadow-xl p-3 rounded-full text-white hover:bg-black/80 hover:scale-105 transition-all" title="이미지 다운로드">
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center space-y-5">
                        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-xl border border-primary/30 shadow-sm relative overflow-hidden transition-all duration-700">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#d4af37]/5 rounded-full blur-xl"></div>
                            <h4 className="text-primary font-bold text-[13px] uppercase tracking-widest mb-2 relative z-10">추천 오브제</h4>
                            <p className="text-white font-extrabold text-3xl mb-4 relative z-10">{zodiacObject.animal}</p>
                            {effectiveUnlocked ? (
                                <div className="space-y-2 relative z-10">
                                    <p className="text-[14px] text-slate-200 flex items-center gap-2 bg-white/5 p-2 rounded-lg"><span className="font-bold text-slate-300 w-20 shrink-0">재질 및 색상</span> {zodiacObject.material_and_color}</p>
                                    <p className="text-[14px] text-slate-200 flex items-center gap-2 bg-white/5 p-2 rounded-lg"><span className="font-bold text-slate-300 w-20 shrink-0">선별 특징</span> {zodiacObject.specific_pose_or_feature}</p>
                                </div>
                            ) : (
                                <div className="relative z-10 rounded-lg border border-primary/20 bg-black/20 p-3 text-sm leading-relaxed text-slate-300">
                                    재질, 자세, 제작 포인트는 결제 후 설계도에서 열립니다.
                                </div>
                            )}
                        </div>

                        {effectiveUnlocked ? (
                            <>
                                <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-sm transition-all duration-700 hover:border-primary/30">
                                    <h4 className="text-white font-bold text-[16px] mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> 추천 이유</h4>
                                    <p className="text-slate-200 text-[15px] leading-relaxed font-medium">{zodiacObject.reason}</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-sm transition-all duration-700 hover:border-primary/30">
                                    <h4 className="text-white font-bold text-[16px] mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> 배치 가이드</h4>
                                    <p className="text-slate-200 text-[15px] leading-relaxed font-medium">{zodiacObject.placement_guide}</p>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-sm">
                                <h4 className="text-white font-bold text-[16px] mb-3 flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> 수호 오브제 해설 봉인</h4>
                                <p className="text-slate-300 text-[15px] leading-relaxed font-medium">
                                    왜 이 오브제가 필요한지, 어디에 두어야 하는지, 어떤 재질과 방향이 맞는지는 결제 후 열람됩니다.
                                </p>
                            </div>
                        )}

                        {effectiveUnlocked && (
                            <div className="space-y-2 pt-2 animate-fade-in">
                                <a href={`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(zodiacObject.animal + ' 장식품 ' + zodiacObject.material_and_color)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="w-full py-3 border border-primary text-primary font-bold rounded-lg hover:bg-[#d4af37]/10 transition-colors flex items-center justify-center gap-2">
                                    <ExternalLink className="w-4 h-4" /> 유사한 장식품 찾아보기
                                </a>
                                <button onClick={onOrderObject}
                                    className="w-full py-3 bg-[#d4af37] text-white font-bold rounded-lg hover:bg-[#c29d2f] transition-all flex items-center justify-center gap-2 shadow-sm">
                                    <Box className="w-4 h-4" /> 천지인 거사님께 오브제 제작 의뢰하기
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals for Premium Zodiac Object */}
            <LoginPromptModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
            <DigitalPaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                amount={DIGITAL_PRODUCT_TOTAL_KRW}
                orderName="12간지 비방 오브제 설계도 열람"
                orderType="zodiac"
                analysisId={currentAnalysisId}
            />
        </section>
    );
}
