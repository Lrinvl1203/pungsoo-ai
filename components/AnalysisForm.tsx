import React from 'react';
import { Home, MapPin, Loader2, Sparkles, Send, RefreshCw, Palette, Flower2 } from 'lucide-react';
import { UserMetadata, AnalysisResult, ImageSizeOption } from '../types';

interface AddressSuggestion {
    place_name: string;
    address_name: string;
}

interface AnalysisFormProps {
    metadata: UserMetadata;
    setMetadata: React.Dispatch<React.SetStateAction<UserMetadata>>;
    image: string | null;
    loading: boolean;
    history: { result: AnalysisResult; image: string; remedyArt: string; zodiacImage: string | null }[];
    addressQuery: string;
    setAddressQuery: (q: string) => void;
    addressSuggestions: AddressSuggestion[];
    isSearchingAddress: boolean;
    showSuggestions: boolean;
    setShowSuggestions: (v: boolean) => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClearImage: () => void;
    onAnalyze: () => void;
    onLoadHistory: (idx: number) => void;
    onClearHistory: () => void;
}

export default function AnalysisForm({
    metadata,
    setMetadata,
    image,
    loading,
    history,
    addressQuery,
    setAddressQuery,
    addressSuggestions,
    isSearchingAddress,
    showSuggestions,
    setShowSuggestions,
    onImageUpload,
    onClearImage,
    onAnalyze,
    onLoadHistory,
    onClearHistory,
}: AnalysisFormProps) {
    return (
        <div className="space-y-8">
            {/* Analysis Type Toggle */}
            <div className="flex bg-white/10 p-1 rounded-xl shadow-inner">
                <button
                    onClick={() => setMetadata({ ...metadata, analysisType: 'internal' })}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${metadata.analysisType === 'internal' ? 'bg-white/5 backdrop-blur-md text-primary shadow-sm' : 'text-slate-300 hover:text-white'}`}
                >
                    내부 공간 (인테리어)
                </button>
                <button
                    onClick={() => setMetadata({ ...metadata, analysisType: 'external' })}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${metadata.analysisType === 'external' ? 'bg-white/5 backdrop-blur-md text-primary shadow-sm' : 'text-slate-300 hover:text-white'}`}
                >
                    외부 공간 (지리적 입지)
                </button>
            </div>

            {metadata.analysisType === 'internal' ? (
                <section className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/10 animate-in slide-in-from-left-4 duration-300">
                    <h2 className="font-bold text-xl font-bold mb-6 flex items-center gap-2">
                        <Home className="w-5 h-5 text-primary" /> 공간 이미지 업로드
                    </h2>
                    <div className="relative group">
                        <div className={`w-full aspect-video rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center bg-black/30 text-white ${image ? 'border-transparent' : 'border-primary'}`}>
                            {image ? (
                                <img src={image} alt="Upload preview" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <div className="text-center p-8">
                                    <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <Sparkles className="text-primary w-6 h-6" />
                                    </div>
                                    <p className="text-slate-300 text-sm">공간의 사진을 올려주세요</p>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={onImageUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                        {image && !loading && (
                            <button
                                onClick={onClearImage}
                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        )}
                    </div>
                </section>
            ) : (
                <section className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/10 animate-in slide-in-from-right-4 duration-300">
                    <h2 className="font-bold text-xl font-bold mb-6 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" /> 지리적 입지 주소 입력
                    </h2>
                    <div className="relative">
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">분석할 장소명 또는 주소</label>
                        <input
                            type="text"
                            placeholder="예: 강남역, 스타벅스 성수점, 테헤란로 123"
                            value={addressQuery || metadata.address || ''}
                            onChange={(e) => {
                                setAddressQuery(e.target.value);
                                setMetadata({ ...metadata, address: e.target.value });
                                setShowSuggestions(true);
                            }}
                            onFocus={() => {
                                if (addressSuggestions.length > 0) setShowSuggestions(true);
                            }}
                            onBlur={() => {
                                setTimeout(() => setShowSuggestions(false), 200);
                            }}
                            className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-3 outline-none focus:border-primary transition-all"
                        />
                        {isSearchingAddress && (
                            <div className="absolute right-3 top-9">
                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            </div>
                        )}
                        {showSuggestions && addressSuggestions.length > 0 && (
                            <ul className="absolute z-10 w-full mt-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                                {addressSuggestions.map((suggestion, idx) => (
                                    <li
                                        key={idx}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            const fullAddress = suggestion.place_name !== suggestion.address_name ?
                                                `${suggestion.place_name} (${suggestion.address_name})` :
                                                suggestion.address_name;
                                            setMetadata({ ...metadata, address: fullAddress });
                                            setAddressQuery(fullAddress);
                                            setShowSuggestions(false);
                                        }}
                                        className="px-4 py-3 hover:bg-black/30 text-white cursor-pointer border-b border-white/10 last:border-b-0"
                                    >
                                        <div className="font-bold text-white text-sm">{suggestion.place_name}</div>
                                        {suggestion.address_name !== suggestion.place_name && (
                                            <div className="text-xs text-slate-300 mt-0.5">{suggestion.address_name}</div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <p className="text-slate-300 text-[11px] mt-3 bg-black/30 text-white p-2 rounded border border-white/10">
                            * 주변 산맥과 도로망의 모습을 위성 지도로 가져와 배산임수, 노충살 등의 길흉화복을 분석합니다.
                        </p>
                    </div>
                </section>
            )}

            {/* Detailed Info Section */}
            <section className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/10">
                <h2 className="font-bold text-xl font-bold mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" /> 상세 정보 입력
                </h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {metadata.analysisType === 'internal' && (
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">장소 구분</label>
                                <select
                                    value={metadata.roomType}
                                    onChange={(e) => setMetadata({ ...metadata, roomType: e.target.value })}
                                    className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary"
                                >
                                    <option>침실</option>
                                    <option>거실</option>
                                    <option>현관</option>
                                    <option>주방</option>
                                    <option>사무실</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">출생연도</label>
                            <input
                                type="number" min={1940} max={2010} placeholder="예: 1985"
                                value={metadata.birthDate ? metadata.birthDate.slice(0, 4) : ''}
                                onChange={(e) => setMetadata({ ...metadata, birthDate: e.target.value })}
                                className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">성별</label>
                            <div className="flex gap-2 h-[38px]">
                                <button type="button" onClick={() => setMetadata({ ...metadata, gender: 'male' })}
                                    className={`flex-1 rounded-lg border text-sm font-bold transition-all ${metadata.gender === 'male' ? 'bg-[#d4af37] text-white border-primary shadow-md' : 'bg-black/30 text-white text-slate-200 border-white/10 hover:border-primary'}`}
                                >남성</button>
                                <button type="button" onClick={() => setMetadata({ ...metadata, gender: 'female' })}
                                    className={`flex-1 rounded-lg border text-sm font-bold transition-all ${metadata.gender === 'female' ? 'bg-[#d4af37] text-white border-primary shadow-md' : 'bg-black/30 text-white text-slate-200 border-white/10 hover:border-primary'}`}
                                >여성</button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">기본 비방 아트 스타일</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setMetadata({ ...metadata, artStyle: 'modern' })}
                                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all text-xs ${metadata.artStyle === 'modern' ? 'bg-[#d4af37] text-white border-primary font-bold shadow-md' : 'bg-black/30 text-white text-slate-200 border-white/10 hover:border-primary'}`}
                            ><Palette className="w-4 h-4" /> 모던</button>
                            <button onClick={() => setMetadata({ ...metadata, artStyle: 'buddhist' })}
                                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all text-xs ${metadata.artStyle === 'buddhist' ? 'bg-[#d4af37] text-white border-primary font-bold shadow-md' : 'bg-black/30 text-white text-slate-200 border-white/10 hover:border-primary'}`}
                            ><div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[8px]">卍</div> 레트로</button>
                            <button onClick={() => setMetadata({ ...metadata, artStyle: 'modern_buddhist' })}
                                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all text-xs ${metadata.artStyle === 'modern_buddhist' ? 'bg-[#d4af37] text-white border-primary font-bold shadow-md' : 'bg-black/30 text-white text-slate-200 border-white/10 hover:border-primary'}`}
                            ><Flower2 className="w-4 h-4" /> 모던 + 레트로</button>
                        </div>
                    </div>

                    {/* Image Size */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">비방 이미지 비율 (사이즈)</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {(['1:1', '9:16', '16:9', '3:4', '4:3', 'custom'] as ImageSizeOption[]).map((size) => (
                                <button key={size}
                                    onClick={() => setMetadata({ ...metadata, imageSize: { ...metadata.imageSize, preset: size } })}
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${metadata.imageSize.preset === size ? 'bg-[#d4af37] text-white border-primary shadow-md' : 'bg-black/30 text-white text-slate-200 border-white/10 hover:border-primary'}`}
                                >
                                    {size === 'custom' ? '직접 입력' : size}
                                </button>
                            ))}
                        </div>
                        {metadata.imageSize.preset === 'custom' && (
                            <div className="flex items-center gap-2 mt-2 bg-black/30 text-white p-2 rounded-lg border border-white/10">
                                <div className="flex-1 flex items-center gap-2">
                                    <span className="text-xs text-slate-300 font-semibold">가로:</span>
                                    <input type="number" placeholder="px"
                                        value={metadata.imageSize.customWidth || ''}
                                        onChange={(e) => setMetadata({ ...metadata, imageSize: { ...metadata.imageSize, customWidth: parseInt(e.target.value) || undefined } })}
                                        className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-primary"
                                    />
                                </div>
                                <span className="text-slate-300 text-sm">x</span>
                                <div className="flex-1 flex items-center gap-2">
                                    <span className="text-xs text-slate-300 font-semibold">세로:</span>
                                    <input type="number" placeholder="px"
                                        value={metadata.imageSize.customHeight || ''}
                                        onChange={(e) => setMetadata({ ...metadata, imageSize: { ...metadata.imageSize, customHeight: parseInt(e.target.value) || undefined } })}
                                        className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">고민사항</label>
                        <textarea
                            placeholder="재물운, 건강운 등 보완하고 싶은 운세를 적어주세요."
                            value={metadata.concern}
                            onChange={(e) => setMetadata({ ...metadata, concern: e.target.value })}
                            className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-2 h-20 outline-none focus:border-primary resize-none"
                        />
                    </div>
                </div>
            </section>

            {/* Recent History */}
            {history.length > 0 && (
                <section className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/10">
                    <h2 className="font-bold text-xl font-bold mb-4 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-primary" /> 최근 분석 기록
                    </h2>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {history.map((item, idx) => (
                            <button key={idx}
                                onClick={() => onLoadHistory(idx)}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-black/30 text-white transition-colors text-left border border-transparent hover:border-white/10"
                            >
                                <img src={item.remedyArt} className="w-12 h-12 object-cover rounded-md" alt="History" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{item.result.analysis_summary}</p>
                                    <p className="text-[10px] text-slate-300">{item.result.remedy_art.deficiency}</p>
                                </div>
                            </button>
                        ))}
                        <button onClick={onClearHistory}
                            className="w-full py-2 text-[10px] text-slate-400 hover:text-red-400 transition-colors"
                        >기록 전체 삭제</button>
                    </div>
                </section>
            )}

            {/* Analyze Button */}
            <button
                onClick={onAnalyze}
                disabled={loading || (metadata.analysisType === 'internal' && !image) || (metadata.analysisType === 'external' && !metadata.address)}
                className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${loading || (metadata.analysisType === 'internal' && !image) || (metadata.analysisType === 'external' && !metadata.address) ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-primary text-[#221e10] hover:bg-yellow-400 hover:scale-[1.02] active:scale-95 hover:shadow-primary/30 hover:shadow-xl'}`}
            >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> 감명 중...</> : <><Send className="w-5 h-5" /> 풍수 감정 & 비방 생성</>}
            </button>
        </div>
    );
}
