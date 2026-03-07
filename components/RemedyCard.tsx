import React, { useState } from 'react';
import { Loader2, Download, RefreshCw, Palette, ShoppingBag, Lock } from 'lucide-react';
import { AnalysisResult, UserMetadata, ImageSizeOption } from '../types';
import { useAuth } from '../contexts/AuthContext';
import DigitalPaymentModal from './DigitalPaymentModal';
import LoginPromptModal from './LoginPromptModal';
import { supabase } from '../services/supabaseClient';

interface RemedyCardProps {
    result: AnalysisResult;
    remedyArt: string | null;
    metadata: UserMetadata;
    setMetadata: React.Dispatch<React.SetStateAction<UserMetadata>>;
    isRegeneratingArt: boolean;
    onRegenerateArt: () => void;
    onDownloadImage: (dataUrl: string, filename: string) => void;
    onOrderFrame: () => void;
    currentAnalysisId?: number | null;
}

export default function RemedyCard({
    result,
    remedyArt,
    metadata,
    setMetadata,
    isRegeneratingArt,
    onRegenerateArt,
    onDownloadImage,
    onOrderFrame,
    currentAnalysisId,
}: RemedyCardProps) {
    const [isUnlocked, setIsUnlocked] = useState(false);

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
                    .eq('order_type', 'remedy');

                if (data && data.length > 0) {
                    setIsUnlocked(true);
                }
            }
        };
        checkUnlockStatus();
    }, [user, currentAnalysisId]);

    const handleUnlockRemedy = () => {
        if (!user) {
            setShowLoginModal(true);
        } else {
            setShowPaymentModal(true);
        }
    };

    if (!result.remedy_art) return null;

    const aspectClass = metadata.imageSize.preset === '1:1' ? 'aspect-square'
        : metadata.imageSize.preset === '9:16' ? 'aspect-[9/16]'
            : metadata.imageSize.preset === '16:9' ? 'aspect-video w-full max-w-lg'
                : metadata.imageSize.preset === '3:4' ? 'aspect-[3/4]'
                    : metadata.imageSize.preset === '4:3' ? 'aspect-[4/3] w-full max-w-md'
                        : 'aspect-[3/4]';

    return (
        <section className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-primary/40 ring-4 ring-primary/10 mt-10 stagger-item" style={{ animationDelay: '0.5s' }}>
            <div className="bg-primary text-background-dark p-5 text-white flex justify-between items-center shadow-sm">
                <h3 className="font-bold flex items-center gap-3 text-xl">
                    <img src="/images/masters/myeongwol.jpeg" className="w-8 h-8 rounded-full border border-white" alt="명월" />
                    AI 풍수 처방: 디지털 비방 아트
                </h3>
            </div>
            <div className="p-6 md:p-8">
                <div className="flex flex-col gap-8">
                    {/* Art Display with Paywall */}
                    <div className={`w-full max-w-sm mx-auto ${aspectClass} bg-[#fcfbfa] rounded-2xl overflow-hidden relative shadow-inner ring-1 ring-black/5 transition-all duration-300`}>
                        {remedyArt ? (
                            <>
                                <img
                                    src={remedyArt}
                                    alt="Remedy Art"
                                    className={`w-full h-full object-cover transition-all duration-700 ${!isUnlocked ? 'scale-110 brightness-50' : 'scale-100'}`}
                                    style={{ filter: !isUnlocked ? 'blur(12px)' : 'none' }}
                                />
                                {!isUnlocked && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-black/40 backdrop-blur-sm">
                                        <Lock className="w-10 h-10 text-primary mb-4" />
                                        <h4 className="text-xl font-bold text-white mb-2">맞춤형 디지털 비방 아트워크</h4>
                                        <p className="text-sm text-slate-200 mb-6 leading-relaxed">내 공간에 부족한 <strong className="text-primary">'{result.remedy_art.deficiency}'</strong> 기운을 보완하기 위해 AI가 특별히 생성한 단 하나뿐인 예술 작품입니다.</p>
                                        <button
                                            onClick={handleUnlockRemedy}
                                            className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#c29d2f] text-white font-bold rounded-xl hover:shadow-lg transition-all animate-pulse-glow"
                                        >
                                            작품 확인 및 원본 다운로드 (₩1,000)
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#221e10]">
                                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                                <p className="text-[15px] text-slate-300 leading-relaxed">부족한 <span className="font-bold text-primary">'{result.remedy_art.deficiency}'</span> 기운을<br />
                                    <span className="font-bold text-white">{metadata.artStyle === 'buddhist' ? '레트로 예술' : metadata.artStyle === 'modern_buddhist' ? '모던 레트로 예술' : '모던 아트'}</span>로 승화시키는 중입니다...</p>
                            </div>
                        )}
                        {(remedyArt && isUnlocked) && (
                            <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                                <button
                                    onClick={() => onDownloadImage(remedyArt, 'FengShui_Remedy.png')}
                                    className="bg-black/60 backdrop-blur-md shadow-xl p-3 rounded-full text-white hover:bg-black/80 hover:scale-105 transition-all"
                                    title="이미지 다운로드"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-5">
                        {/* Keyword Info */}
                        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-xl border border-primary/30 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-[#d4af37]/5 rounded-full blur-xl"></div>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-primary font-bold text-[13px] uppercase tracking-widest">처방 키워드</h4>
                            </div>
                            <p className="text-white font-extrabold text-2xl relative z-10">{result.remedy_art.deficiency}</p>
                            <div className="flex flex-wrap gap-2 mt-3 relative z-10">
                                {result.remedy_art.solution_keyword.split(',').map((kw, i) => (
                                    <span key={i} className="text-[12px] bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-slate-300 shadow-sm font-medium">#{kw.trim()}</span>
                                ))}
                            </div>
                        </div>

                        {/* Style Controls for Regeneration */}
                        <div className="p-5 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-sm space-y-5">
                            <div>
                                <h5 className="text-[14px] font-bold text-slate-300 flex items-center gap-2 mb-3">
                                    <Palette className="w-4 h-4" /> 옵션 변경하여 재생성 (스타일/사이즈)
                                </h5>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1.5">스타일</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['modern', 'buddhist', 'modern_buddhist'] as const).map((style) => (
                                                <button key={style}
                                                    onClick={() => setMetadata({ ...metadata, artStyle: style })}
                                                    className={`py-2.5 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${metadata.artStyle === style ? 'bg-[#4a443b] text-white shadow-md' : 'bg-black/30 text-white text-slate-200 hover:bg-white/10'}`}
                                                >
                                                    {style === 'modern' ? '모던' : style === 'buddhist' ? '레트로' : '모던+레트로'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1.5">비율 (사이즈)</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(['1:1', '9:16', '16:9', '3:4', '4:3', 'custom'] as ImageSizeOption[]).map((size) => (
                                                <button key={size}
                                                    onClick={() => setMetadata({ ...metadata, imageSize: { ...metadata.imageSize, preset: size } })}
                                                    className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all ${metadata.imageSize.preset === size ? 'bg-[#d4af37] text-white shadow-md' : 'bg-black/30 text-white text-slate-200 border border-white/10 hover:border-primary'}`}
                                                >
                                                    {size === 'custom' ? '직접입력' : size}
                                                </button>
                                            ))}
                                        </div>
                                        {metadata.imageSize.preset === 'custom' && (
                                            <div className="flex items-center gap-2 mt-2 bg-black/30 text-white p-2 rounded-lg border border-white/10">
                                                <input type="number" placeholder="가로 px"
                                                    value={metadata.imageSize.customWidth || ''}
                                                    onChange={(e) => setMetadata({ ...metadata, imageSize: { ...metadata.imageSize, customWidth: parseInt(e.target.value) || undefined } })}
                                                    className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded px-2 py-1 text-[11px] outline-none focus:border-primary"
                                                />
                                                <span className="text-slate-300 text-[10px]">x</span>
                                                <input type="number" placeholder="세로 px"
                                                    value={metadata.imageSize.customHeight || ''}
                                                    onChange={(e) => setMetadata({ ...metadata, imageSize: { ...metadata.imageSize, customHeight: parseInt(e.target.value) || undefined } })}
                                                    className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded px-2 py-1 text-[11px] outline-none focus:border-primary"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onRegenerateArt}
                                disabled={isRegeneratingArt}
                                className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] to-[#c29d2f] text-white text-[15px] font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                {isRegeneratingArt ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                위 옵션으로 비방 다시 그리기
                            </button>
                        </div>

                        {/* Art Story */}
                        <div className="bg-[#4a443b] p-6 rounded-xl text-white italic text-[16px] leading-relaxed shadow-lg relative">
                            <div className="absolute top-2 left-3 text-4xl text-white/10 font-bold">"</div>
                            {result.remedy_art.art_story}
                            <div className="absolute bottom-[-10px] right-3 text-4xl text-white/10 font-bold">"</div>
                        </div>

                        {/* Order Button */}
                        <div className="space-y-2">
                            <button
                                disabled={!remedyArt}
                                onClick={onOrderFrame}
                                className="w-full py-3 border border-primary text-primary font-bold rounded-lg hover:bg-[#d4af37]/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <ShoppingBag className="w-4 h-4" /> 천지인 거사님께 액자 제작 의뢰하기
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals for Premium Remedy */}
            <LoginPromptModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
            <DigitalPaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                amount={1000}
                orderName="맞춤형 디지털 비방 아트워크 다운로드"
                orderType="remedy"
            />
        </section>
    );
}
