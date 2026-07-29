import React from 'react';
import { Home, MapPin, Loader2, Sparkles, Send, RefreshCw } from 'lucide-react';
import { UserMetadata, AnalysisResult, ImageSizeOption } from '../types';
import ExternalMapDirectionPicker from './ExternalMapDirectionPicker';

interface AddressSuggestion {
    place_name: string;
    address_name: string;
    x: string;
    y: string;
}

interface AnalysisFormProps {
    metadata: UserMetadata;
    setMetadata: React.Dispatch<React.SetStateAction<UserMetadata>>;
    images: string[];
    loading: boolean;
    history: { result: AnalysisResult; image: string; remedyArt: string; zodiacImage: string | null }[];
    addressQuery: string;
    setAddressQuery: (q: string) => void;
    addressSuggestions: AddressSuggestion[];
    isSearchingAddress: boolean;
    showSuggestions: boolean;
    setShowSuggestions: (v: boolean) => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveImage: (index: number) => void;
    onClearImages: () => void;
    onAnalyze: () => void;
    onLoadHistory: (idx: number) => void;
    onClearHistory: () => void;
}

export default function AnalysisForm({
    metadata,
    setMetadata,
    images,
    loading,
    history,
    addressQuery,
    setAddressQuery,
    addressSuggestions,
    isSearchingAddress,
    showSuggestions,
    setShowSuggestions,
    onImageUpload,
    onRemoveImage,
    onClearImages,
    onAnalyze,
    onLoadHistory,
    onClearHistory,
}: AnalysisFormProps) {
    return (
        <div className="space-y-8">
            {/* Analysis Type Toggle */}
            <div className="flex bg-white/10 p-1 rounded-xl shadow-inner" role="radiogroup" aria-label="분석 유형">
                <button
                    type="button"
                    role="radio"
                    aria-checked={metadata.analysisType === 'internal'}
                    onClick={() => setMetadata({ ...metadata, analysisType: 'internal' })}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${metadata.analysisType === 'internal' ? 'bg-white/5 backdrop-blur-md text-primary shadow-sm' : 'text-slate-300 hover:text-white'}`}
                >
                    내부 공간 분석
                </button>
                <button
                    type="button"
                    role="radio"
                    aria-checked={metadata.analysisType === 'external'}
                    onClick={() => setMetadata({ ...metadata, analysisType: 'external' })}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${metadata.analysisType === 'external' ? 'bg-white/5 backdrop-blur-md text-primary shadow-sm' : 'text-slate-300 hover:text-white'}`}
                >
                    외부 입지 분석
                </button>
            </div>
            <p className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-[12px] leading-relaxed text-slate-300">
                {metadata.analysisType === 'internal'
                    ? '방 사진과 구조를 분석해 룸 가디언 액자와 데스크 오브제로 이어집니다.'
                    : '주소 주변의 산세·물길·도로 흐름을 분석해 사이트 가디언 액자와 현관·카운터 오브제로 이어집니다.'}
            </p>

            {metadata.analysisType === 'internal' ? (
                <section className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/10 animate-in slide-in-from-left-4 duration-300">
                    <h2 className="font-bold text-xl font-bold mb-6 flex items-center gap-2">
                        <Home className="w-5 h-5 text-primary" /> 공간 이미지 업로드
                    </h2>
                    <div className="mb-5 rounded-xl border border-primary/20 bg-primary/10 p-4">
                        <p className="mb-2 text-xs font-black text-primary">잘 읽히는 촬영 체크리스트</p>
                        <ul className="grid gap-1.5 text-xs leading-relaxed text-slate-200 sm:grid-cols-2">
                            <li>✓ 문이나 현관이 보이게</li>
                            <li>✓ 방 전체가 한 화면에 들어오게</li>
                            <li>✓ 낮 자연광에서 밝게</li>
                            <li>✓ 기울이지 말고 정면에서</li>
                        </ul>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {images.map((uploadedImage, index) => (
                            <figure key={`${uploadedImage.slice(-24)}-${index}`} className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30">
                                <img
                                    src={uploadedImage}
                                    alt={`${['공간 전체', '문 또는 현관', '창 방향'][index]} 사진 미리보기`}
                                    className="aspect-[4/3] w-full object-cover"
                                />
                                <figcaption className="px-3 py-2 text-center text-[11px] font-bold text-slate-300">
                                    {['1. 공간 전체', '2. 문·현관', '3. 창 방향'][index]}
                                </figcaption>
                                {!loading && (
                                    <button
                                        type="button"
                                        onClick={() => onRemoveImage(index)}
                                        className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-red-600"
                                        aria-label={`${index + 1}번 사진 삭제`}
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                )}
                            </figure>
                        ))}
                        {images.length < 3 && (
                            <label
                                htmlFor="space-images"
                                className="relative flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary bg-black/30 p-5 text-center transition hover:bg-primary/10"
                            >
                                <Sparkles className="mb-3 h-6 w-6 text-primary" />
                                <span className="text-sm font-bold text-white">{images.length ? '사진 더 추가' : '사진 선택'}</span>
                                <span className="mt-1 text-[11px] text-slate-400">최대 3장 · JPG/PNG/WebP</span>
                                <input
                                    id="space-images"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={onImageUpload}
                                    className="sr-only"
                                />
                            </label>
                        )}
                    </div>
                    {images.length > 0 && !loading && (
                        <button type="button" onClick={onClearImages} className="mt-3 text-xs font-bold text-slate-400 hover:text-red-300">
                            사진 전체 지우기
                        </button>
                    )}
                    <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                        한 장만 올려도 분석할 수 있습니다. 여러 장은 같은 공간의 구조를 교차 확인하는 참고 자료로 사용됩니다.
                    </p>
                </section>
            ) : (
                <section className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/10 animate-in slide-in-from-right-4 duration-300">
                    <h2 className="font-bold text-xl font-bold mb-6 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" /> 지리적 입지 주소 입력
                    </h2>
                    <div className="relative">
                        <label htmlFor="external-address" className="block text-xs font-semibold text-slate-300 uppercase mb-1">분석할 장소명 또는 주소</label>
                        <input
                            id="external-address"
                            type="text"
                            placeholder="예: 강남역, 스타벅스 성수점, 테헤란로 123"
                            value={addressQuery || metadata.address || ''}
                            onChange={(e) => {
                                setAddressQuery(e.target.value);
                                setMetadata({
                                    ...metadata,
                                    address: e.target.value,
                                    latitude: undefined,
                                    longitude: undefined,
                                    locationConfirmed: false,
                                    entranceBearingDegrees: null,
                                    directionMethod: 'none',
                                    directionConfidence: 'none',
                                });
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
                                            const latitude = Number(suggestion.y);
                                            const longitude = Number(suggestion.x);
                                            setMetadata({
                                                ...metadata,
                                                address: fullAddress,
                                                latitude,
                                                longitude,
                                                locationConfirmed: false,
                                                entranceBearingDegrees: null,
                                                directionMethod: 'none',
                                                directionConfidence: 'none',
                                            });
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
                        {Number.isFinite(metadata.latitude) && Number.isFinite(metadata.longitude) && (
                            <ExternalMapDirectionPicker
                                latitude={metadata.latitude as number}
                                longitude={metadata.longitude as number}
                                locationConfirmed={metadata.locationConfirmed === true}
                                bearingDegrees={metadata.directionMethod === 'map_arrow'
                                    && Number.isFinite(metadata.entranceBearingDegrees)
                                    ? metadata.entranceBearingDegrees as number
                                    : null}
                                onLocationChange={(latitude, longitude) => {
                                    setMetadata({
                                        ...metadata,
                                        latitude,
                                        longitude,
                                        locationConfirmed: false,
                                    });
                                }}
                                onLocationConfirmedChange={(confirmed) => {
                                    setMetadata({ ...metadata, locationConfirmed: confirmed });
                                }}
                                onBearingChange={(bearingDegrees) => {
                                    setMetadata({
                                        ...metadata,
                                        entranceBearingDegrees: bearingDegrees,
                                        directionMethod: bearingDegrees == null ? 'none' : 'map_arrow',
                                        directionConfidence: bearingDegrees == null ? 'none' : 'low',
                                    });
                                }}
                            />
                        )}
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
                                <label htmlFor="room-type" className="block text-xs font-semibold text-slate-300 uppercase mb-1">장소 구분</label>
                                <select
                                    id="room-type"
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
                            <label htmlFor="birth-year" className="block text-xs font-semibold text-slate-300 uppercase mb-1">출생연도</label>
                            <input
                                id="birth-year"
                                type="number" min={1940} max={2010} placeholder="예: 1985"
                                value={metadata.birthDate ? metadata.birthDate.slice(0, 4) : ''}
                                onChange={(e) => setMetadata({ ...metadata, birthDate: e.target.value })}
                                className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <span id="gender-label" className="block text-xs font-semibold text-slate-300 uppercase mb-1">성별</span>
                            <div className="flex gap-2 h-[38px]" role="radiogroup" aria-labelledby="gender-label">
                                <button type="button" onClick={() => setMetadata({ ...metadata, gender: 'male' })}
                                    role="radio" aria-checked={metadata.gender === 'male'}
                                    className={`flex-1 rounded-lg border text-sm font-bold transition-all ${metadata.gender === 'male' ? 'bg-[#d4af37] text-white border-primary shadow-md' : 'bg-black/30 text-white text-slate-200 border-white/10 hover:border-primary'}`}
                                >남성</button>
                                <button type="button" onClick={() => setMetadata({ ...metadata, gender: 'female' })}
                                    role="radio" aria-checked={metadata.gender === 'female'}
                                    className={`flex-1 rounded-lg border text-sm font-bold transition-all ${metadata.gender === 'female' ? 'bg-[#d4af37] text-white border-primary shadow-md' : 'bg-black/30 text-white text-slate-200 border-white/10 hover:border-primary'}`}
                                >여성</button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="block text-xs font-semibold text-slate-300 uppercase mb-1">비방화 자동 조형</p>
                        <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-3 flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-white">비방서가 작품군을 직접 정합니다</p>
                                <p className="text-[11px] leading-relaxed text-slate-300 mt-1">
                                    오행·공간·고민·수호동물을 종합해 추상화, 현대 민화, 수묵 여백, 기하 토템 중 가장 맞는 방식을 자동 적용합니다.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Image Size */}
                    <div>
                        <span id="image-size-label" className="block text-xs font-semibold text-slate-300 uppercase mb-1">비방 이미지 비율 (사이즈)</span>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {(['1:1', '9:16', '16:9', '3:4', '4:3', 'custom'] as ImageSizeOption[]).map((size) => (
                                <button key={size}
                                    type="button"
                                    aria-pressed={metadata.imageSize.preset === size}
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
                                    <label htmlFor="custom-image-width" className="text-xs text-slate-300 font-semibold">가로</label>
                                    <input id="custom-image-width" type="number" placeholder="px"
                                        value={metadata.imageSize.customWidth || ''}
                                        onChange={(e) => setMetadata({ ...metadata, imageSize: { ...metadata.imageSize, customWidth: parseInt(e.target.value) || undefined } })}
                                        className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-primary"
                                    />
                                </div>
                                <span className="text-slate-300 text-sm">x</span>
                                <div className="flex-1 flex items-center gap-2">
                                    <label htmlFor="custom-image-height" className="text-xs text-slate-300 font-semibold">세로</label>
                                    <input id="custom-image-height" type="number" placeholder="px"
                                        value={metadata.imageSize.customHeight || ''}
                                        onChange={(e) => setMetadata({ ...metadata, imageSize: { ...metadata.imageSize, customHeight: parseInt(e.target.value) || undefined } })}
                                        className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="analysis-concern" className="block text-xs font-semibold text-slate-300 uppercase mb-1">고민사항</label>
                        <textarea
                            id="analysis-concern"
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
                                <img src={item.remedyArt || item.image || '/images/masters/cheongpung.jpeg'} className="w-12 h-12 object-cover rounded-md" alt="History" />
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
                disabled={loading || (metadata.analysisType === 'internal' && images.length === 0) || (metadata.analysisType === 'external' && !metadata.address)}
                className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${loading || (metadata.analysisType === 'internal' && images.length === 0) || (metadata.analysisType === 'external' && !metadata.address) ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-primary text-[#221e10] hover:bg-yellow-400 hover:scale-[1.02] active:scale-95 hover:shadow-primary/30 hover:shadow-xl'}`}
            >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> 감명 중...</> : <><Send className="w-5 h-5" /> 무료 풍수 감정 시작</>}
            </button>
        </div>
    );
}
