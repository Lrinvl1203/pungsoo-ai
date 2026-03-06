import React, { useState } from 'react';
import { Share2, FileText, CheckCircle2, AlertTriangle, Download, Compass, Sparkles, MapPin, ImageIcon, Loader2, Lock } from 'lucide-react';
import { AnalysisResult, UserMetadata } from '../types';
import RemedyCard from './RemedyCard';
import ZodiacCard from './ZodiacCard';

interface ResultViewProps {
    result: AnalysisResult | null;
    loading: boolean;
    image: string | null;
    toBeImage: string | null;
    remedyArt: string | null;
    zodiacImage: string | null;
    metadata: UserMetadata;
    setMetadata: React.Dispatch<React.SetStateAction<UserMetadata>>;
    isRegeneratingArt: boolean;
    onRegenerateArt: () => void;
    onDownloadImage: (dataUrl: string, filename: string) => void;
    onOrderFrame: () => void;
    onOrderObject: () => void;
    currentAnalysisId?: number | null;
}

export default function ResultView({
    result,
    loading,
    image,
    toBeImage,
    remedyArt,
    zodiacImage,
    metadata,
    setMetadata,
    isRegeneratingArt,
    onRegenerateArt,
    onDownloadImage,
    onOrderFrame,
    onOrderObject,
    currentAnalysisId,
}: ResultViewProps) {
    // Paywall mock states
    const [isReportUnlocked, setIsReportUnlocked] = useState(false);
    const [isRemedyUnlocked, setIsRemedyUnlocked] = useState(false);
    const [isZodiacUnlocked, setIsZodiacUnlocked] = useState(false);

    const handleShare = async () => {
        if (!currentAnalysisId) {
            alert('저장된 분석 결과가 없습니다. 다시 시도해주세요.');
            return;
        }
        const shareUrl = `${window.location.origin}/analyze?id=${currentAnalysisId}`;
        const imageUrl = image || 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&q=80&w=800';

        const Kakao = (window as any).Kakao;
        if (!Kakao || !Kakao.isInitialized()) {
            console.error('카카오 SDK가 초기화되지 않았습니다.');
            alert('카카오톡 공유를 준비 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: '풍수 AI 공간 감명 결과',
                description: `나의 종합 풍수 점수는 ${result?.feng_shui_score || 0}점! 청풍 도사의 진단을 확인해보세요.`,
                imageUrl: imageUrl,
                link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
            },
            buttons: [{ title: '감정서 확인하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }]
        });
    };

    const handleCopyLink = () => {
        if (!currentAnalysisId) return;
        const shareUrl = `${window.location.origin}/analyze?id=${currentAnalysisId}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('링크가 복사되었습니다!');
        }).catch(err => console.error('링크 복사 실패:', err));
    };

    return (
        <div className="relative">
            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 bg-[#221e10]/80 backdrop-blur-xl z-20 flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-primary/20">
                    <div className="w-24 h-24 mb-8 relative">
                        <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                        <div className="absolute inset-[-4px] border-4 border-transparent border-t-primary rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
                        <div className="absolute inset-[6px] border-4 border-transparent border-b-primary/50 rounded-full animate-spin" style={{ animationDuration: '2.5s', animationDirection: 'reverse' }}></div>
                        <Compass className="absolute inset-0 m-auto w-10 h-10 text-primary loading-pulse" />
                    </div>
                    <div className="flex -space-x-4 mb-6">
                        <img src="/images/masters/cheongpung.jpeg" className="w-16 h-16 rounded-full border-4 border-[#221e10] object-cover relative z-10 shadow-lg" alt="청풍 도사" />
                        <img src="/images/masters/myeongwol.jpeg" className="w-16 h-16 rounded-full border-4 border-[#221e10] object-cover relative z-0 shadow-lg" alt="명월 도사" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">두 대가가 전력을 다해 감명 중입니다...</h3>
                    <p className="text-slate-400 max-w-xs">청풍 도사의 공간 진단과 명월 도사의 비방 처방을 준비하고 있습니다.</p>
                    <div className="mt-6 flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-primary loading-dot" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 rounded-full bg-primary loading-dot" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 rounded-full bg-primary loading-dot" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                </div>
            )}

            {/* Empty Placeholder */}
            {!result && !loading && (
                <div className="h-full min-h-[600px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-12 text-slate-400">
                    <Sparkles className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg">분석을 시작하면 대가의 처방전과<br />맞춤형 예술 비방이 나타납니다.</p>
                </div>
            )}

            {result && (
                <div className="space-y-10 relative mt-8">

                    {/* 1. Score & Summary */}
                    <section className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-primary/30 relative overflow-hidden stagger-item" style={{ animationDelay: '0.1s' }}>
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Compass className="w-40 h-40" />
                        </div>
                        <div className="flex items-start justify-between mb-6 border-b border-primary/20 pb-4">
                            <div className="flex items-center gap-4">
                                <img src="/images/masters/cheongpung.jpeg" className="w-14 h-14 rounded-full border-2 border-primary object-cover" alt="청풍" />
                                <div>
                                    <div className="text-primary font-bold text-xs mb-1 uppercase tracking-widest">진단 (診)</div>
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">청풍 도사의 공간 감정서</h3>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-slate-400 text-sm font-medium mb-1">종합 풍수 점수</div>
                                <div className="text-primary text-3xl font-black">{result.feng_shui_score}점</div>
                            </div>
                        </div>
                        <p className="text-slate-300 text-[17px] mb-6 leading-relaxed font-medium">{result.analysis_summary}</p>
                        <div className="space-y-3 relative z-10">
                            {result.diagnosis.map((diag, idx) => (
                                <div key={idx} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white/5 backdrop-blur-md border ${diag.type.includes('길') ? 'border-l-green-500 border-gray-100' : 'border-l-red-500 border-gray-100'}`}>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        {diag.type.includes('길') ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
                                        <span className="font-bold text-[15px] text-white">{diag.keyword}</span>
                                    </div>
                                    <p className="text-[14px] text-slate-200 leading-relaxed">{diag.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 2. Detailed Report (PAYWALL STAGE 1) */}
                    {result.detailed_report && (
                        <section className="bg-[#4a443b]/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-primary/30 relative overflow-hidden text-white mt-10 mb-10 stagger-item" style={{ animationDelay: '0.2s' }}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <MapPin className="w-40 h-40 text-primary" />
                            </div>
                            <div className="absolute -left-10 -bottom-10 opacity-10 pointer-events-none">
                                <Compass className="w-56 h-56 text-primary" />
                            </div>
                            <h3 className="font-bold text-2xl font-bold mb-8 border-b border-primary/30 pb-4 flex items-center gap-3">
                                <Sparkles className="w-6 h-6 text-primary" />
                                초정밀 도사 감명서 <span className="text-primary text-sm font-medium tracking-widest uppercase ml-2 opacity-80">(Full Documentation)</span>
                            </h3>

                            <div className="relative">
                                {/* Blurred text container if locked */}
                                <div className={`prose prose-sm max-w-none text-white/95 leading-[1.9] whitespace-pre-wrap font-medium relative z-10 text-[15px] ${!isReportUnlocked ? 'h-[160px] overflow-hidden' : ''}`}>
                                    {result.detailed_report}

                                    {!isReportUnlocked && (
                                        <div className="absolute bottom-0 left-0 w-full h-[120px] bg-gradient-to-t from-[#4a443b] to-transparent z-20"></div>
                                    )}
                                </div>

                                {/* Unlock Overlay */}
                                {!isReportUnlocked && (
                                    <div className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-end pb-2 pt-24 z-30 pointer-events-auto">
                                        <div className="bg-[#221e10]/90 backdrop-blur-xl p-6 rounded-2xl border border-primary/50 shadow-2xl w-[90%] max-w-sm text-center transform translate-y-8">
                                            <Lock className="w-8 h-8 mx-auto text-primary mb-3" />
                                            <h4 className="text-lg font-bold text-white mb-2">프리미엄 진단 내용 잠김</h4>
                                            <p className="text-sm text-slate-300 mb-5">청풍 도사의 구체적인 공간 진단과 운기 상승 비결을 온전히 확인하고 싶다면 잠금을 해제하세요.</p>
                                            <button
                                                onClick={() => setIsReportUnlocked(true)}
                                                className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#c29d2f] text-white font-bold rounded-xl hover:shadow-lg transition-all animate-pulse-glow"
                                            >
                                                자세한 감명서 열람하기 (₩3,000)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* 3. Feng Shui Interior Prescription */}
                    {result.solution_items && result.solution_items.length > 0 && (
                        <section className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border border-white/10 stagger-item" style={{ animationDelay: '0.3s' }}>
                            <div className="bg-white/5 backdrop-blur-sm p-5 border-b border-white/10 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <img src="/images/masters/myeongwol.jpeg" className="w-10 h-10 rounded-full border-2 border-primary object-cover" alt="명월" />
                                    <div>
                                        <div className="text-primary font-bold text-[10px] uppercase tracking-widest mb-0.5">처방 (方)</div>
                                        <h3 className="font-bold font-bold text-white flex items-center gap-2 text-xl">명월 도사의 맞춤 비방 가이드</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {result.solution_items.map((item, idx) => (
                                        <div key={idx} className="bg-black/30 text-white rounded-xl p-5 border border-white/10 transition-all hover:border-primary/50 hover:shadow-md">
                                            <h5 className="font-bold text-white text-[16px] mb-1">{item.item_name}</h5>
                                            <p className="text-[14px] text-slate-300 mb-4">{item.target_problem}</p>
                                            <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 mb-4">
                                                <p className="text-[14px] text-slate-200 leading-relaxed flex items-start gap-2.5">
                                                    <MapPin className="w-4 h-4 text-primary mt-1 shrink-0" />
                                                    {item.placement_guide}
                                                </p>
                                            </div>
                                            <a
                                                href={`https://ohou.se/productions/feed?query=${encodeURIComponent(item.product_search_keyword)}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-[14px] text-primary font-bold hover:text-[#b4922b] transition-colors"
                                            >
                                                <span className="w-4 h-4">↗</span> 추천 상품 보러가기
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 4. To-Be Visualization */}
                    {metadata.analysisType === 'internal' && image && (
                        <section className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border border-white/10 stagger-item" style={{ animationDelay: '0.4s' }}>
                            <div className="bg-white/5 backdrop-blur-sm p-5 border-b border-white/10 flex justify-between items-center">
                                <h3 className="font-bold font-bold text-white flex items-center gap-2 text-xl">
                                    <ImageIcon className="w-6 h-6 text-primary" /> 공간 비보풍수 시각화 (To-Be)
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 gap-0.5 bg-white/10">
                                <div className="relative aspect-square">
                                    <img src={image} alt="Before" className="w-full h-full object-cover" />
                                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg font-bold tracking-widest text-xs shadow-lg">BEFORE</div>
                                </div>
                                <div className="relative aspect-square bg-black/30 text-white flex items-center justify-center">
                                    {toBeImage && toBeImage !== 'error' ? (
                                        <img src={toBeImage} alt="After" className="w-full h-full object-cover" />
                                    ) : toBeImage === 'error' ? (
                                        <div className="text-center p-4">
                                            <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-400" />
                                            <p className="text-sm text-slate-300 font-medium">이미지 생성에 실패했습니다.</p>
                                            <p className="text-xs text-slate-400 mt-1">다시 분석을 시도해주세요.</p>
                                        </div>
                                    ) : (
                                        <div className="text-center p-4">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                                            <p className="text-sm text-slate-300 font-medium">공간 비보 적용 중...</p>
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 bg-gradient-to-r from-[#d4af37] to-[#f9f295] text-white px-3 py-1.5 rounded-lg font-extrabold tracking-widest text-xs shadow-lg">AFTER</div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 5. Digital Remedy Art */}
                    <RemedyCard
                        result={result}
                        remedyArt={remedyArt}
                        metadata={metadata}
                        setMetadata={setMetadata}
                        isRegeneratingArt={isRegeneratingArt}
                        onRegenerateArt={onRegenerateArt}
                        onDownloadImage={onDownloadImage}
                        onOrderFrame={onOrderFrame}
                    />

                    {/* 6. Zodiac Remedy Object */}
                    {result.zodiac_remedy_object && (
                        <ZodiacCard
                            zodiacObject={result.zodiac_remedy_object}
                            zodiacImage={zodiacImage}
                            onDownloadImage={onDownloadImage}
                            onOrderObject={onOrderObject}
                        />
                    )}

                    {/* 7. Overall Advice Footer */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl p-10 border-2 border-primary/30 text-center shadow-lg mt-12 mb-8 relative overflow-hidden group stagger-item" style={{ animationDelay: '0.7s' }}>
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0"></div>
                        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex justify-center -space-x-4 mb-6">
                            <img src="/images/masters/cheongpung.jpeg" className="w-16 h-16 rounded-full border-4 border-[#221e10] object-cover relative z-10 shadow-lg" alt="청풍 도사" />
                            <img src="/images/masters/myeongwol.jpeg" className="w-16 h-16 rounded-full border-4 border-[#221e10] object-cover relative z-0 shadow-lg" alt="명월 도사" />
                        </div>
                        <p className="text-white font-bold text-2xl italic leading-[1.8] max-w-xl mx-auto">
                            "{result.overall_advice}"
                        </p>
                        <div className="mt-4 text-primary font-bold text-sm tracking-widest uppercase mb-8">
                            풍수지리 대가 청풍 & 명월 드림
                        </div>

                        {/* Social Share Buttons */}
                        {currentAnalysisId && (
                            <div className="flex items-center justify-center gap-4 mt-8 pt-8 border-t border-white/10">
                                <button
                                    onClick={handleShare}
                                    className="flex-1 py-3 bg-[#FEE500] text-[#000000] font-bold rounded-xl hover:bg-[#FEE500]/90 transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                    <Share2 className="w-5 h-5 text-black" /> 카카오톡 공유
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className="flex items-center gap-2 bg-white/10 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-white/20 transition-colors shadow-sm border border-white/20"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    링크 복사
                                </button>
                            </div>
                        )}
                    </div>


                </div>
            )}
        </div>
    );
}
