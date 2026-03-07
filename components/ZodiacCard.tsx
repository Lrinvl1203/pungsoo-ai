import React, { useState } from 'react';
import { Loader2, Download, Sparkles, MapPin, ExternalLink, Box, Lock } from 'lucide-react';
import { ZodiacRemedyObject } from '../types';

interface ZodiacCardProps {
    zodiacObject: ZodiacRemedyObject;
    zodiacImage: string | null;
    onDownloadImage: (dataUrl: string, filename: string) => void;
    onOrderObject: () => void;
}

export default function ZodiacCard({ zodiacObject, zodiacImage, onDownloadImage, onOrderObject }: ZodiacCardProps) {
    const [isUnlocked, setIsUnlocked] = useState(false);

    return (
        <section className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-primary/40 ring-4 ring-primary/10 mt-10 stagger-item" style={{ animationDelay: '0.6s' }}>
            <div className="bg-primary text-background-dark p-5 text-white flex justify-between items-center shadow-sm">
                <h3 className="font-bold flex items-center gap-3 text-xl">
                    <img src="/images/masters/myeongwol.jpeg" className="w-8 h-8 rounded-full border border-white" alt="명월" />
                    AI 풍수 처방: 12간지 비방 오브제
                </h3>
            </div>
            <div className="p-6 md:p-8">
                <div className="flex flex-col gap-8">
                    {/* Object Display with Paywall */}
                    <div className="w-full max-w-sm mx-auto aspect-square bg-[#fcfbfa] rounded-2xl overflow-hidden relative shadow-inner ring-1 ring-black/5">
                        {zodiacImage ? (
                            <>
                                <img src={zodiacImage} alt="Zodiac Remedy Object" className={`w-full h-full object-cover transition-all duration-700 ${!isUnlocked ? 'blur-xl scale-110 brightness-50' : 'blur-0 scale-100'}`} />
                                {!isUnlocked && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-black/40 backdrop-blur-sm">
                                        <Lock className="w-10 h-10 text-primary mb-4" />
                                        <h4 className="text-xl font-bold text-white mb-2">12간지 맞춤 오브제 처방</h4>
                                        <p className="text-sm text-slate-200 mb-6 leading-relaxed">명월 도사가 특별히 선별한 기운 보충용 오브제 디자인과 해설을 확인하시겠습니까?</p>
                                        <button
                                            onClick={() => setIsUnlocked(true)}
                                            className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#c29d2f] text-white font-bold rounded-xl hover:shadow-lg transition-all animate-pulse-glow"
                                        >
                                            12간지 비방 열람하기 (₩3,000)
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#221e10]">
                                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                                <p className="text-[15px] text-slate-300 leading-relaxed">맞춤형 <span className="font-bold text-primary">12간지 비방 오브제</span>를<br />생성 중입니다...</p>
                            </div>
                        )}
                        {(zodiacImage && isUnlocked) && (
                            <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                                <button onClick={() => onDownloadImage(zodiacImage, 'FengShui_Zodiac_Object.png')}
                                    className="bg-black/60 backdrop-blur-md shadow-xl p-3 rounded-full text-white hover:bg-black/80 hover:scale-105 transition-all" title="이미지 다운로드">
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center space-y-5">
                        <div
                            className={`bg-white/5 backdrop-blur-xl p-6 rounded-xl border border-primary/30 shadow-sm relative overflow-hidden transition-all duration-700 ${!isUnlocked ? 'opacity-30 select-none' : 'opacity-100'}`}
                            style={{ filter: !isUnlocked ? 'blur(4px)' : 'none' }}
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#d4af37]/5 rounded-full blur-xl"></div>
                            <h4 className="text-primary font-bold text-[13px] uppercase tracking-widest mb-2 relative z-10">추천 오브제</h4>
                            <p className="text-white font-extrabold text-3xl mb-4 relative z-10">{zodiacObject.animal}</p>
                            <div className="space-y-2 relative z-10">
                                <p className="text-[14px] text-slate-200 flex items-center gap-2 bg-white/5 p-2 rounded-lg"><span className="font-bold text-slate-300 w-20 shrink-0">재질 및 색상</span> {zodiacObject.material_and_color}</p>
                                <p className="text-[14px] text-slate-200 flex items-center gap-2 bg-white/5 p-2 rounded-lg"><span className="font-bold text-slate-300 w-20 shrink-0">선별 특징</span> {zodiacObject.specific_pose_or_feature}</p>
                            </div>
                        </div>
                        <div
                            className={`bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-sm transition-all duration-700 ${!isUnlocked ? 'opacity-30 select-none' : 'hover:border-primary/30 opacity-100'}`}
                            style={{ filter: !isUnlocked ? 'blur(4px)' : 'none' }}
                        >
                            <h4 className="text-white font-bold text-[16px] mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> 추천 이유</h4>
                            <p className="text-slate-200 text-[15px] leading-relaxed font-medium">{zodiacObject.reason}</p>
                        </div>
                        <div
                            className={`bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-sm transition-all duration-700 ${!isUnlocked ? 'opacity-30 select-none' : 'hover:border-primary/30 opacity-100'}`}
                            style={{ filter: !isUnlocked ? 'blur(4px)' : 'none' }}
                        >
                            <h4 className="text-white font-bold text-[16px] mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> 배치 가이드</h4>
                            <p className="text-slate-200 text-[15px] leading-relaxed font-medium">{zodiacObject.placement_guide}</p>
                        </div>

                        {isUnlocked && (
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
        </section>
    );
}
