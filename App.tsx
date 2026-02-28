
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Home, MapPin, Heart, Send, Loader2, Compass, AlertTriangle, CheckCircle2, ShoppingBag, Download, ExternalLink, ImageIcon, Palette, RefreshCw, Flower2, Box } from 'lucide-react';
import { UserMetadata, AnalysisResult } from './types';
import { analyzeFengShui, generateToBeImage, generateRemedyArtImage, generateZodiacArtImage } from './services/geminiService';
import { useAuth } from './contexts/AuthContext';
import { useUserSettings } from './hooks/useUserSettings';
import LoginButton from './components/LoginButton';
import PaymentButton from './components/PaymentButton';

export default function App() {
  const location = useLocation();
  const [image, setImage] = useState<string | null>(null);
  const [toBeImage, setToBeImage] = useState<string | null>(null);
  const [remedyArt, setRemedyArt] = useState<string | null>(null);
  const [zodiacImage, setZodiacImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingVisuals, setGeneratingVisuals] = useState(false);
  const [isRegeneratingArt, setIsRegeneratingArt] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<{ result: AnalysisResult, image: string, remedyArt: string, zodiacImage: string | null }[]>([]);

  // Address Autocomplete States
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ place_name: string; address_name: string }>>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Test Mode State
  const [isTestMode, setIsTestMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('PUNGSOO_TEST_MODE') === 'true';
    }
    return false;
  });

  const toggleTestMode = () => {
    const newVal = !isTestMode;
    setIsTestMode(newVal);
    localStorage.setItem('PUNGSOO_TEST_MODE', newVal.toString());
  };

  // Load history from localStorage on mount
  React.useEffect(() => {
    const savedHistory = localStorage.getItem('pungsoo_history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);

        // Check if we came from MyPage with a specific history item to load
        if (location.state && typeof location.state.loadHistoryItem === 'number') {
          const idx = location.state.loadHistoryItem;
          if (parsedHistory[idx]) {
            const item = parsedHistory[idx];
            setResult(item.result);
            setImage(item.image);
            setRemedyArt(item.remedyArt);
            setZodiacImage(item.zodiacImage || null);
            setToBeImage(null);

            // Clean up state so refreshing doesn't reload it
            window.history.replaceState({}, document.title);
          }
        }
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, [location.state]);

  const { settings, updateSettings } = useUserSettings();

  const [metadata, setMetadata] = useState<UserMetadata>({
    analysisType: 'internal',
    roomType: '침실',
    address: '',
    birthDate: settings.birthDate,
    gender: settings.gender,
    concern: '',
    artStyle: settings.artStyle
  });

  // Save specific settings when they change
  React.useEffect(() => {
    updateSettings({
      birthDate: metadata.birthDate,
      gender: metadata.gender,
      artStyle: metadata.artStyle
    });
  }, [metadata.birthDate, metadata.gender, metadata.artStyle]);

  // Handle address input change with debounce
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (addressQuery.trim().length > 1) {
        setIsSearchingAddress(true);
        try {
          const res = await fetch(`/api/search-address?q=${encodeURIComponent(addressQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setAddressSuggestions(data.results || []);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error("Failed to search address", error);
        } finally {
          setIsSearchingAddress(false);
        }
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [addressQuery]);

  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [orderType, setOrderType] = useState<'frame' | 'object'>('frame');
  const [orderFormData, setOrderFormData] = useState({ name: '', contact: '', message: '' });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOrder(true);

    try {
      const response = await fetch('/api/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType,
          name: orderFormData.name,
          contact: orderFormData.contact,
          message: orderFormData.message,
          userId: user?.id,
          analysisData: result ? {
            remedyArtKeyword: result.remedy_art?.solution_keyword,
            deficiency: result.remedy_art?.deficiency,
            zodiacAnimal: result.zodiac_remedy_object?.animal
          } : null
        })
      });

      if (response.ok) {
        alert('의뢰가 성공적으로 접수되었습니다. 곧 연락드리겠습니다.');
        setIsInquiryModalOpen(false);
        setOrderFormData({ name: '', contact: '', message: '' });
      } else {
        alert('의뢰 전송에 실패했습니다. 관리자에게 문의해주세요.');
      }
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handlePaymentFail = () => {
    alert('결제가 실패했거나 취소되었습니다.');
    setIsInquiryModalOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // 이미지를 Canvas로 리사이즈/압축하여 Vercel 4.5MB 제한 방지
        const img = new Image();
        img.onload = () => {
          const MAX_SIZE = 1024;
          let { width, height } = img;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            setImage(compressed);
          } else {
            setImage(reader.result as string); // fallback
          }
          setToBeImage(null);
          setRemedyArt(null);
          setZodiacImage(null);
          setResult(null);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (metadata.analysisType === 'internal' && !image) {
      alert("분석할 이미지를 업로드해주세요.");
      return;
    }
    if (metadata.analysisType === 'external' && !metadata.address) {
      alert("지리적 입지 분석을 위한 주소를 입력해주세요.");
      return;
    }

    setShowSuggestions(false);

    setLoading(true);
    setResult(null);
    setToBeImage(null);
    setRemedyArt(null);
    setZodiacImage(null);

    try {
      const analysis = await analyzeFengShui({ base64Image: image || undefined, address: metadata.address }, metadata);
      setResult(analysis);

      setGeneratingVisuals(true);

      const promises = [
        generateRemedyArtImage(analysis.remedy_art.image_generation_prompt, metadata.artStyle),
      ];

      if (analysis.zodiac_remedy_object) {
        promises.push(generateZodiacArtImage(analysis.zodiac_remedy_object));
      } else {
        promises.push(Promise.resolve(""));
      }

      if (metadata.analysisType === 'internal' && image) {
        promises.push(generateToBeImage(image, analysis.solution_items));
      }

      const settled = await Promise.allSettled(promises);

      let remedyObj = settled[0];
      let zodiacObjRes = settled[1];
      let visualObj = metadata.analysisType === 'internal' ? settled[2] : null;

      if (visualObj && visualObj.status === 'fulfilled') setToBeImage(visualObj.value);
      let newZodiacImage = zodiacObjRes && zodiacObjRes.status === 'fulfilled' && zodiacObjRes.value ? zodiacObjRes.value : null;
      if (newZodiacImage) setZodiacImage(newZodiacImage);

      if (remedyObj && remedyObj.status === 'fulfilled') {
        setRemedyArt(remedyObj.value);
        // Save to history
        const newHistory = [{
          result: analysis,
          image: metadata.analysisType === 'internal' ? (image || '') : 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&q=80&w=400',
          remedyArt: remedyObj.value,
          zodiacImage: newZodiacImage
        }, ...history].slice(0, 10); // Keep last 10
        setHistory(newHistory);
        localStorage.setItem('pungsoo_history', JSON.stringify(newHistory));
      }

    } catch (error) {
      console.error(error);
      alert("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
      setGeneratingVisuals(false);
    }
  };

  const handleRegenerateArt = async () => {
    if (!result) return;

    setIsRegeneratingArt(true);
    setRemedyArt(null); // Clear current image to show loader

    try {
      const newImage = await generateRemedyArtImage(result.remedy_art.image_generation_prompt, metadata.artStyle);
      setRemedyArt(newImage);
    } catch (error) {
      console.error(error);
      alert("이미지 재생성에 실패했습니다.");
    } finally {
      setIsRegeneratingArt(false);
    }
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e1da] py-8 px-4 text-center relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
          <LoginButton />
          <button
            onClick={toggleTestMode}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors shadow-sm ${isTestMode ? 'bg-indigo-50 text-indigo-600 border-indigo-200 font-bold' : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}`}
          >
            {isTestMode ? '🧪 테스트 모드 ON' : '🧪 테스트 모드 OFF'}
          </button>
        </div>
        <div className="max-w-4xl mx-auto mt-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center shadow-lg">
              <Compass className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="serif-font text-4xl font-bold text-[#4a443b] mb-2">풍수지리 AI 대가</h1>
          <p className="text-[#8c8273] text-lg font-light">공간의 기운을 읽고 예술로 치유하는 AI 풍수 처방</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12 pb-24">
        <div className="flex flex-col gap-16">

          {/* Input Section */}
          <div className="space-y-8">
            {/* Analysis Type Toggle */}
            <div className="flex bg-[#e5e1da] p-1 rounded-xl shadow-inner">
              <button
                onClick={() => setMetadata({ ...metadata, analysisType: 'internal' })}
                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${metadata.analysisType === 'internal' ? 'bg-white text-[#d4af37] shadow-sm' : 'text-[#8c8273] hover:text-[#4a443b]'}`}
              >
                내부 공간 (인테리어)
              </button>
              <button
                onClick={() => setMetadata({ ...metadata, analysisType: 'external' })}
                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${metadata.analysisType === 'external' ? 'bg-white text-[#d4af37] shadow-sm' : 'text-[#8c8273] hover:text-[#4a443b]'}`}
              >
                외부 공간 (지리적 입지)
              </button>
            </div>

            {metadata.analysisType === 'internal' ? (
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e1da] animate-in slide-in-from-left-4 duration-300">
                <h2 className="serif-font text-xl font-bold mb-6 flex items-center gap-2">
                  <Home className="w-5 h-5 text-[#d4af37]" /> 공간 이미지 업로드
                </h2>

                <div className="relative group">
                  <div className={`w-full aspect-video rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center bg-[#faf9f6] ${image ? 'border-transparent' : 'border-[#d4af37]'}`}>
                    {image ? (
                      <img src={image} alt="Upload preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="text-center p-8">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <Sparkles className="text-[#d4af37] w-6 h-6" />
                        </div>
                        <p className="text-[#8c8273] text-sm">공간의 사진을 올려주세요</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  {image && !loading && (
                    <button
                      onClick={() => { setImage(null); setResult(null); setToBeImage(null); setRemedyArt(null); setZodiacImage(null); }}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  )}
                </div>
              </section>
            ) : (
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e1da] animate-in slide-in-from-right-4 duration-300">
                <h2 className="serif-font text-xl font-bold mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#d4af37]" /> 지리적 입지 주소 입력
                </h2>
                <div className="relative">
                  <label className="block text-xs font-semibold text-[#8c8273] uppercase mb-1">분석할 장소명 또는 주소</label>
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
                      // Delay hiding suggestions to allow click events to register
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    className="w-full bg-[#faf9f6] border border-[#e5e1da] rounded-lg px-3 py-3 outline-none focus:border-[#d4af37] transition-all"
                  />
                  {isSearchingAddress && (
                    <div className="absolute right-3 top-9">
                      <Loader2 className="w-5 h-5 text-[#d4af37] animate-spin" />
                    </div>
                  )}
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-[#e5e1da] rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                      {addressSuggestions.map((suggestion, idx) => (
                        <li
                          key={idx}
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent onBlur from firing before onClick
                            const fullAddress = suggestion.place_name !== suggestion.address_name ?
                              `${suggestion.place_name} (${suggestion.address_name})` :
                              suggestion.address_name;

                            setMetadata({ ...metadata, address: fullAddress });
                            setAddressQuery(fullAddress);
                            setShowSuggestions(false);
                          }}
                          className="px-4 py-3 hover:bg-[#faf9f6] cursor-pointer border-b border-[#e5e1da] last:border-b-0"
                        >
                          <div className="font-bold text-[#4a443b] text-sm">{suggestion.place_name}</div>
                          {suggestion.address_name !== suggestion.place_name && (
                            <div className="text-xs text-[#8c8273] mt-0.5">{suggestion.address_name}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[#8c8273] text-[11px] mt-3 bg-[#faf9f6] p-2 rounded border border-[#e5e1da]">
                    * 주변 산맥과 도로망의 모습을 위성 지도로 가져와 배산임수, 노충살 등의 길흉화복을 분석합니다.
                  </p>
                </div>
              </section>
            )}

            <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e1da]">
              <h2 className="serif-font text-xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#d4af37]" /> 상세 정보 입력
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {metadata.analysisType === 'internal' && (
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-[#8c8273] uppercase mb-1">장소 구분</label>
                      <select
                        value={metadata.roomType}
                        onChange={(e) => setMetadata({ ...metadata, roomType: e.target.value })}
                        className="w-full bg-[#faf9f6] border border-[#e5e1da] rounded-lg px-3 py-2 outline-none focus:border-[#d4af37]"
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

                {/* 출생연도 + 성별 입력 - 본명궁 계산용 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#8c8273] uppercase mb-1">
                      출생연도
                    </label>
                    <input
                      type="number"
                      min={1940}
                      max={2010}
                      placeholder="예: 1985"
                      value={metadata.birthDate ? metadata.birthDate.slice(0, 4) : ''}
                      onChange={(e) => setMetadata({ ...metadata, birthDate: e.target.value })}
                      className="w-full bg-[#faf9f6] border border-[#e5e1da] rounded-lg px-3 py-2 outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#8c8273] uppercase mb-1">
                      성별
                    </label>
                    <div className="flex gap-2 h-[38px]">
                      <button
                        type="button"
                        onClick={() => setMetadata({ ...metadata, gender: 'male' })}
                        className={`flex-1 rounded-lg border text-sm font-bold transition-all ${metadata.gender === 'male'
                          ? 'bg-[#d4af37] text-white border-[#d4af37] shadow-md'
                          : 'bg-[#faf9f6] text-[#6b6256] border-[#e5e1da] hover:border-[#d4af37]'
                          }`}
                      >남성</button>
                      <button
                        type="button"
                        onClick={() => setMetadata({ ...metadata, gender: 'female' })}
                        className={`flex-1 rounded-lg border text-sm font-bold transition-all ${metadata.gender === 'female'
                          ? 'bg-[#d4af37] text-white border-[#d4af37] shadow-md'
                          : 'bg-[#faf9f6] text-[#6b6256] border-[#e5e1da] hover:border-[#d4af37]'
                          }`}
                      >여성</button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8c8273] uppercase mb-1">기본 비방 아트 스타일</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setMetadata({ ...metadata, artStyle: 'modern' })}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all text-xs ${metadata.artStyle === 'modern' ? 'bg-[#d4af37] text-white border-[#d4af37] font-bold shadow-md' : 'bg-[#faf9f6] text-[#6b6256] border-[#e5e1da] hover:border-[#d4af37]'}`}
                    >
                      <Palette className="w-4 h-4" /> 모던
                    </button>
                    <button
                      onClick={() => setMetadata({ ...metadata, artStyle: 'buddhist' })}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all text-xs ${metadata.artStyle === 'buddhist' ? 'bg-[#d4af37] text-white border-[#d4af37] font-bold shadow-md' : 'bg-[#faf9f6] text-[#6b6256] border-[#e5e1da] hover:border-[#d4af37]'}`}
                    >
                      <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[8px]">卍</div> 레트로
                    </button>
                    <button
                      onClick={() => setMetadata({ ...metadata, artStyle: 'modern_buddhist' })}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all text-xs ${metadata.artStyle === 'modern_buddhist' ? 'bg-[#d4af37] text-white border-[#d4af37] font-bold shadow-md' : 'bg-[#faf9f6] text-[#6b6256] border-[#e5e1da] hover:border-[#d4af37]'}`}
                    >
                      <Flower2 className="w-4 h-4" /> 모던 + 레트로
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8c8273] uppercase mb-1">고민사항</label>
                  <textarea
                    placeholder="재물운, 건강운 등 보완하고 싶은 운세를 적어주세요."
                    value={metadata.concern}
                    onChange={(e) => setMetadata({ ...metadata, concern: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-[#e5e1da] rounded-lg px-3 py-2 h-20 outline-none focus:border-[#d4af37] resize-none"
                  />
                </div>
              </div>
            </section>

            {history.length > 0 && (
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e1da]">
                <h2 className="serif-font text-xl font-bold mb-4 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-[#d4af37]" /> 최근 분석 기록
                </h2>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {history.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setResult(item.result);
                        setImage(item.image);
                        setRemedyArt(item.remedyArt);
                        setZodiacImage(item.zodiacImage || null);
                        setToBeImage(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#faf9f6] transition-colors text-left border border-transparent hover:border-[#e5e1da]"
                    >
                      <img src={item.remedyArt} className="w-12 h-12 object-cover rounded-md" alt="History" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#4a443b] truncate">{item.result.analysis_summary}</p>
                        <p className="text-[10px] text-[#8c8273]">{item.result.remedy_art.deficiency}</p>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      localStorage.removeItem('pungsoo_history');
                      setHistory([]);
                    }}
                    className="w-full py-2 text-[10px] text-[#b0a99f] hover:text-red-400 transition-colors"
                  >
                    기록 전체 삭제
                  </button>
                </div>
              </section>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading || (metadata.analysisType === 'internal' && !image) || (metadata.analysisType === 'external' && !metadata.address)}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${loading || (metadata.analysisType === 'internal' && !image) || (metadata.analysisType === 'external' && !metadata.address) ? 'bg-[#c9c5bd] cursor-not-allowed' : 'gold-gradient hover:scale-[1.02] active:scale-95'}`}
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> 감명 중...</> : <><Send className="w-5 h-5" /> 풍수 감정 & 비방 생성</>}
            </button>
          </div>

          {/* Results Section */}
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-[#e5e1da]">
                <div className="w-20 h-20 mb-6 relative">
                  <div className="absolute inset-0 border-4 border-[#d4af37]/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#d4af37] rounded-full border-t-transparent animate-spin"></div>
                  <Compass className="absolute inset-0 m-auto w-10 h-10 text-[#d4af37]" />
                </div>
                <h3 className="serif-font text-2xl font-bold text-[#4a443b]">공간의 명당을 찾는 중...</h3>
                <p className="text-[#8c8273] mt-2">부족한 기운을 채울 예술적 비방을 그려내고 있습니다.</p>
              </div>
            )}

            {!result && !loading && (
              <div className="h-full min-h-[600px] border-2 border-dashed border-[#e5e1da] rounded-2xl flex flex-col items-center justify-center text-center p-12 text-[#b0a99f]">
                <Sparkles className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg">분석을 시작하면 대가의 처방전과<br />맞춤형 예술 비방이 나타납니다.</p>
              </div>
            )}

            {result && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative mt-8">

                {/* 1. Score & Summary */}
                <section className="bg-white rounded-2xl p-6 shadow-xl border border-[#d4af37]/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Compass className="w-40 h-40" />
                  </div>
                  <h3 className="serif-font text-2xl font-bold text-[#4a443b] mb-4 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-[#d4af37]" /> 종합 점수: <span className="text-[#d4af37] text-3xl ml-1">{result.feng_shui_score}점</span>
                  </h3>
                  <p className="text-[#8c8273] text-[17px] mb-6 leading-relaxed font-medium">{result.analysis_summary}</p>
                  <div className="space-y-3 relative z-10">
                    {result.diagnosis.map((diag, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white border ${diag.type.includes('길') ? 'border-l-green-500 border-gray-100' : 'border-l-red-500 border-gray-100'}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          {diag.type.includes('길') ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
                          <span className="font-bold text-[15px] text-[#4a443b]">{diag.keyword}</span>
                        </div>
                        <p className="text-[14px] text-[#6b6256] leading-relaxed">{diag.description}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 2. Detailed Report (Full Documentation) */}
                {result.detailed_report && (
                  <section className="bg-[#4a443b] rounded-2xl p-8 shadow-2xl border border-[#d4af37]/30 relative overflow-hidden text-white mt-10 mb-10">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <MapPin className="w-40 h-40 text-[#d4af37]" />
                    </div>
                    <div className="absolute -left-10 -bottom-10 opacity-10 pointer-events-none">
                      <Compass className="w-56 h-56 text-[#d4af37]" />
                    </div>
                    <h3 className="serif-font text-2xl font-bold mb-8 border-b border-[#d4af37]/30 pb-4 flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-[#d4af37]" />
                      초정밀 도사 감명서 <span className="text-[#d4af37] text-sm font-medium tracking-widest uppercase ml-2 opacity-80">(Full Documentation)</span>
                    </h3>
                    <div className="prose prose-sm max-w-none text-white/95 leading-[1.9] whitespace-pre-wrap font-medium relative z-10 text-[15px]">
                      {result.detailed_report}
                    </div>
                  </section>
                )}

                {/* 3. Feng Shui Interior Prescription */}
                {result.solution_items && result.solution_items.length > 0 && (
                  <section className="bg-white rounded-2xl overflow-hidden shadow-xl border border-[#e5e1da]">
                    <div className="bg-[#fdfbf7] p-5 border-b border-[#e5e1da] flex justify-between items-center">
                      <h3 className="serif-font font-bold text-[#4a443b] flex items-center gap-2 text-xl">
                        <ShoppingBag className="w-6 h-6 text-[#d4af37]" /> 풍수 인테리어 처방
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {result.solution_items.map((item, idx) => (
                          <div key={idx} className="bg-[#faf9f6] rounded-xl p-5 border border-[#e5e1da] transition-all hover:border-[#d4af37]/50 hover:shadow-md">
                            <h5 className="font-bold text-[#4a443b] text-[16px] mb-1">{item.item_name}</h5>
                            <p className="text-[14px] text-[#8c8273] mb-4">{item.target_problem}</p>
                            <div className="bg-white p-4 rounded-xl border border-[#e5e1da] mb-4">
                              <p className="text-[14px] text-[#6b6256] leading-relaxed flex items-start gap-2.5">
                                <MapPin className="w-4 h-4 text-[#d4af37] mt-1 shrink-0" />
                                {item.placement_guide}
                              </p>
                            </div>
                            <a
                              href={`https://ohou.se/productions/feed?query=${encodeURIComponent(item.product_search_keyword)}`}
                              target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[14px] text-[#d4af37] font-bold hover:text-[#b4922b] transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" /> 추천 상품 보러가기
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* 4. To-Be Visualization */}
                {metadata.analysisType === 'internal' && image && (
                  <section className="bg-white rounded-2xl overflow-hidden shadow-xl border border-[#e5e1da]">
                    <div className="bg-[#fdfbf7] p-5 border-b border-[#e5e1da] flex justify-between items-center">
                      <h3 className="serif-font font-bold text-[#4a443b] flex items-center gap-2 text-xl">
                        <ImageIcon className="w-6 h-6 text-[#d4af37]" /> 공간 비보풍수 시각화 (To-Be)
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-0.5 bg-[#e5e1da]">
                      <div className="relative aspect-square">
                        <img src={image} alt="Before" className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg font-bold tracking-widest text-xs shadow-lg">BEFORE</div>
                      </div>
                      <div className="relative aspect-square bg-[#faf9f6] flex items-center justify-center">
                        {toBeImage ? (
                          <img src={toBeImage} alt="After" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-4">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#d4af37]" />
                            <p className="text-sm text-[#8c8273] font-medium">공간 비보 적용 중...</p>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-[#d4af37] to-[#f9f295] text-[#4a443b] px-3 py-1.5 rounded-lg font-extrabold tracking-widest text-xs shadow-lg">AFTER</div>
                      </div>
                    </div>
                  </section>
                )}

                {/* 5. Digital Remedy Art */}
                <section className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#d4af37]/40 ring-4 ring-[#d4af37]/10 mt-10">
                  <div className="gold-gradient p-5 text-[#4a443b] flex justify-between items-center shadow-sm">
                    <h3 className="serif-font font-bold flex items-center gap-2 text-xl">
                      <Sparkles className="w-6 h-6 text-[#4a443b]" /> AI 풍수 처방: 디지털 비방
                    </h3>
                  </div>
                  <div className="p-6 md:p-8">
                    <div className="flex flex-col gap-8">
                      <div className="w-full max-w-sm mx-auto aspect-[9/16] bg-[#fcfbfa] rounded-2xl overflow-hidden relative shadow-inner ring-1 ring-black/5">
                        {remedyArt ? (
                          <img src={remedyArt} alt="Remedy Art" className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                            <Loader2 className="w-12 h-12 animate-spin text-[#d4af37] mb-4" />
                            <p className="text-[15px] text-[#8c8273] leading-relaxed">부족한 <span className="font-bold text-[#d4af37]">'{result.remedy_art.deficiency}'</span>의 기운을<br />
                              <span className="font-bold text-[#4a443b]">{metadata.artStyle === 'buddhist' ? '레트로 예술' : metadata.artStyle === 'modern_buddhist' ? '모던 레트로 예술' : '모던 아트'}</span>로 승화시키는 중입니다...</p>
                          </div>
                        )}
                        {remedyArt && (
                          <div className="absolute bottom-4 right-4 flex gap-2">
                            <button
                              onClick={() => downloadImage(remedyArt, 'FengShui_Remedy.png')}
                              className="bg-white/95 backdrop-blur shadow-xl p-3 rounded-full text-[#4a443b] hover:bg-white hover:scale-105 transition-all"
                              title="이미지 다운로드"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center space-y-5">
                        <div className="bg-[#fdfbf7] p-5 rounded-xl border border-[#d4af37]/30 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-[#d4af37]/5 rounded-full blur-xl"></div>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-[#d4af37] font-bold text-[13px] uppercase tracking-widest">처방 키워드</h4>
                          </div>
                          <p className="text-[#4a443b] font-extrabold text-2xl relative z-10">{result.remedy_art.deficiency}</p>
                          <div className="flex flex-wrap gap-2 mt-3 relative z-10">
                            {result.remedy_art.solution_keyword.split(',').map((kw, i) => (
                              <span key={i} className="text-[12px] bg-white border border-[#e5e1da] px-3 py-1.5 rounded-lg text-[#8c8273] shadow-sm font-medium">#{kw.trim()}</span>
                            ))}
                          </div>
                        </div>

                        {/* Style Controls for Regeneration */}
                        <div className="p-5 bg-white rounded-xl border border-[#e5e1da] shadow-sm space-y-4">
                          <h5 className="text-[14px] font-bold text-[#8c8273] flex items-center gap-2">
                            <Palette className="w-4 h-4" /> 비방 스타일 변경 <span className="text-[11px] font-normal px-2 py-0.5 bg-[#fdfbf7] rounded text-[#d4af37] border border-[#d4af37]/30">옵션</span>
                          </h5>
                          <div className="grid grid-cols-3 gap-2.5">
                            <button
                              onClick={() => setMetadata({ ...metadata, artStyle: 'modern' })}
                              className={`py-3 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${metadata.artStyle === 'modern' ? 'bg-[#4a443b] text-white shadow-md shadow-[#4a443b]/20 scale-[1.02]' : 'bg-[#faf9f6] text-[#6b6256] hover:bg-[#e5e1da]'}`}
                            >
                              모던
                            </button>
                            <button
                              onClick={() => setMetadata({ ...metadata, artStyle: 'buddhist' })}
                              className={`py-3 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${metadata.artStyle === 'buddhist' ? 'bg-[#4a443b] text-white shadow-md shadow-[#4a443b]/20 scale-[1.02]' : 'bg-[#faf9f6] text-[#6b6256] hover:bg-[#e5e1da]'}`}
                            >
                              레트로
                            </button>
                            <button
                              onClick={() => setMetadata({ ...metadata, artStyle: 'modern_buddhist' })}
                              className={`py-3 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${metadata.artStyle === 'modern_buddhist' ? 'bg-[#4a443b] text-white shadow-md shadow-[#4a443b]/20 scale-[1.02]' : 'bg-[#faf9f6] text-[#6b6256] hover:bg-[#e5e1da]'}`}
                            >
                              모던+레트로
                            </button>
                          </div>

                          <button
                            onClick={handleRegenerateArt}
                            disabled={isRegeneratingArt}
                            className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] to-[#c29d2f] text-white text-[15px] font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                          >
                            {isRegeneratingArt ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                            선택한 스타일로 비방 재생성
                          </button>
                        </div>

                        <div className="bg-[#4a443b] p-6 rounded-xl text-white italic text-[16px] leading-relaxed shadow-lg relative">
                          <div className="absolute top-2 left-3 text-4xl text-white/10 serif-font">"</div>
                          {result.remedy_art.art_story}
                          <div className="absolute bottom-[-10px] right-3 text-4xl text-white/10 serif-font">"</div>
                        </div>
                        <div className="space-y-2">
                          <button
                            disabled={!remedyArt}
                            onClick={() => { setOrderType('frame'); setIsInquiryModalOpen(true); }}
                            className="w-full py-3 border border-[#d4af37] text-[#d4af37] font-bold rounded-lg hover:bg-[#d4af37]/10 transition-colors flex items-center justify-center gap-2"
                          >
                            <ShoppingBag className="w-4 h-4" /> 천지인 거사님께 액자 제작 의뢰하기
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 6. Zodiac Remedy Object */}
                {result.zodiac_remedy_object && (
                  <section className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#d4af37]/40 ring-4 ring-[#d4af37]/10 mt-10">
                    <div className="gold-gradient p-5 text-[#4a443b] flex justify-between items-center shadow-sm">
                      <h3 className="serif-font font-bold flex items-center gap-2 text-xl">
                        <Box className="w-6 h-6 text-[#4a443b]" /> AI 풍수 처방: 12간지 비방 오브제
                      </h3>
                    </div>
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col gap-8">
                        <div className="w-full max-w-sm mx-auto aspect-square bg-[#fcfbfa] rounded-2xl overflow-hidden relative shadow-inner ring-1 ring-black/5">
                          {zodiacImage ? (
                            <img src={zodiacImage} alt="Zodiac Remedy Object" className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                              <Loader2 className="w-12 h-12 animate-spin text-[#d4af37] mb-4" />
                              <p className="text-[15px] text-[#8c8273] leading-relaxed">맞춤형 <span className="font-bold text-[#d4af37]">12간지 비방 오브제</span>를<br />생성 중입니다...</p>
                            </div>
                          )}
                          {zodiacImage && (
                            <div className="absolute bottom-4 right-4 flex gap-2">
                              <button
                                onClick={() => downloadImage(zodiacImage, 'FengShui_Zodiac_Object.png')}
                                className="bg-white/95 backdrop-blur shadow-xl p-3 rounded-full text-[#4a443b] hover:bg-white hover:scale-105 transition-all"
                                title="이미지 다운로드"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-center space-y-5">
                          <div className="bg-[#fdfbf7] p-6 rounded-xl border border-[#d4af37]/30 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#d4af37]/5 rounded-full blur-xl"></div>
                            <h4 className="text-[#d4af37] font-bold text-[13px] uppercase tracking-widest mb-2 relative z-10">추천 오브제</h4>
                            <p className="text-[#4a443b] font-extrabold text-3xl mb-4 relative z-10">{result.zodiac_remedy_object.animal}</p>
                            <div className="space-y-2 relative z-10">
                              <p className="text-[14px] text-[#6b6256] flex items-center gap-2 bg-white/60 p-2 rounded-lg"><span className="font-bold text-[#8c8273] w-20 shrink-0">재질 및 색상</span> {result.zodiac_remedy_object.material_and_color}</p>
                              <p className="text-[14px] text-[#6b6256] flex items-center gap-2 bg-white/60 p-2 rounded-lg"><span className="font-bold text-[#8c8273] w-20 shrink-0">선별 특징</span> {result.zodiac_remedy_object.specific_pose_or_feature}</p>
                            </div>
                          </div>

                          <div className="bg-white p-6 rounded-xl border border-[#e5e1da] shadow-sm hover:border-[#d4af37]/30 transition-colors">
                            <h4 className="text-[#4a443b] font-bold text-[16px] mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#d4af37]" /> 추천 이유</h4>
                            <p className="text-[#6b6256] text-[15px] leading-relaxed font-medium">{result.zodiac_remedy_object.reason}</p>
                          </div>

                          <div className="bg-white p-6 rounded-xl border border-[#e5e1da] shadow-sm hover:border-[#d4af37]/30 transition-colors">
                            <h4 className="text-[#4a443b] font-bold text-[16px] mb-3 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-[#d4af37]" /> 배치 가이드
                            </h4>
                            <p className="text-[#6b6256] text-[15px] leading-relaxed font-medium">{result.zodiac_remedy_object.placement_guide}</p>
                          </div>

                          <div className="space-y-2 pt-2">
                            <a
                              href={`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(result.zodiac_remedy_object.animal + ' 장식품 ' + result.zodiac_remedy_object.material_and_color)}`}
                              target="_blank" rel="noopener noreferrer"
                              className="w-full py-3 border border-[#d4af37] text-[#d4af37] font-bold rounded-lg hover:bg-[#d4af37]/10 transition-colors flex items-center justify-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" /> 유사한 장식품 찾아보기
                            </a>
                            <button
                              onClick={() => {
                                setOrderType('object');
                                setIsInquiryModalOpen(true);
                              }}
                              className="w-full py-3 bg-[#d4af37] text-white font-bold rounded-lg hover:bg-[#c29d2f] transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                              <Box className="w-4 h-4" /> 천지인 거사님께 오브제 제작 의뢰하기
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* 7. Overall Advice Footer */}
                <div className="bg-[#fdfbf7] rounded-xl p-10 border-2 border-[#d4af37]/30 text-center shadow-lg mt-12 mb-8 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1.5 gold-gradient"></div>
                  <div className="absolute bottom-0 left-0 w-full h-1.5 gold-gradient opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Heart className="w-10 h-10 text-[#d4af37] mx-auto mb-5 drop-shadow-sm" />
                  <p className="text-[#4a443b] serif-font text-2xl italic leading-[1.8] font-bold max-w-xl mx-auto">
                    "{result.overall_advice}"
                  </p>
                </div>

              </div>
            )}
          </div>
        </div>
      </main>

      {/* Inquiry Modal */}
      {isInquiryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="serif-font text-2xl font-bold text-[#4a443b] mb-2">
              {orderType === 'frame' ? '액자 제작 의뢰' : '오브제 제작 의뢰'}
            </h3>
            <p className="text-[#8c8273] text-sm mb-6 leading-relaxed">
              {orderType === 'frame'
                ? 'AI가 처방한 당신만의 디지털 비방을 최고급 린넨 캔버스 액자로 간직하세요. 기운을 가장 잘 보존하는 명당에 걸어두시면 좋습니다.'
                : '추천받은 12간지 비방 오브제를 3D 프린팅으로 맞춤 제작해 드립니다.'}
            </p>

            <form onSubmit={handleOrderSubmit} className="space-y-4 mb-6">
              {!isLoggedIn && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#8c8273] mb-1">이름</label>
                    <input
                      type="text"
                      required
                      value={orderFormData.name}
                      onChange={(e) => setOrderFormData({ ...orderFormData, name: e.target.value })}
                      className="w-full bg-[#faf9f6] border border-[#e5e1da] rounded-lg px-3 py-2 outline-none focus:border-[#d4af37]"
                      placeholder="의뢰자 성함"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#8c8273] mb-1">연락처 (이메일 또는 전화번호)</label>
                    <input
                      type="text"
                      required
                      value={orderFormData.contact}
                      onChange={(e) => setOrderFormData({ ...orderFormData, contact: e.target.value })}
                      className="w-full bg-[#faf9f6] border border-[#e5e1da] rounded-lg px-3 py-2 outline-none focus:border-[#d4af37]"
                      placeholder="회신 받으실 연락처"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#8c8273] mb-1">추가 요청사항 (선택사항)</label>
                <textarea
                  value={orderFormData.message}
                  onChange={(e) => setOrderFormData({ ...orderFormData, message: e.target.value })}
                  className="w-full bg-[#faf9f6] border border-[#e5e1da] rounded-lg px-3 py-2 outline-none focus:border-[#d4af37] resize-none h-20"
                  placeholder={isLoggedIn ? `연락받으실 번호와 요청사항을 적어주세요.\n(예: 010-1234-5678, 배송은 주말에 해주세요.)` : "그 외 요청하실 사항을 적어주세요."}
                />
              </div>

              <div className="pt-4">
                <PaymentButton
                  amount={orderType === 'frame' ? 49000 : 79000}
                  orderName={`[풍수AI] ${orderType === 'frame' ? '디지털 액자' : '12간지 비방 오브제'} 제작 의뢰`}
                  orderType={orderType}
                  onSuccess={() => {
                    localStorage.setItem('temp_order_name', orderFormData.name);
                    localStorage.setItem('temp_order_contact', orderFormData.contact);
                    localStorage.setItem('temp_order_message', orderFormData.message);
                    localStorage.setItem('temp_order_type', orderType);
                    localStorage.setItem('temp_order_userId', user?.id || '');
                    if (result) {
                      localStorage.setItem('temp_order_analysisData', JSON.stringify({
                        remedyArtKeyword: result.remedy_art?.solution_keyword,
                        deficiency: result.remedy_art?.deficiency,
                        zodiacAnimal: result.zodiac_remedy_object?.animal
                      }));
                    }
                  }}
                  onFail={handlePaymentFail}
                  disabled={!isLoggedIn ? (!orderFormData.name || !orderFormData.contact) : false}
                />
              </div>
            </form>

            <button
              onClick={() => setIsInquiryModalOpen(false)}
              className="w-full py-3 bg-[#faf9f6] text-[#8c8273] font-bold rounded-xl hover:bg-[#e5e1da] transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-[#e5e1da] py-12 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#4a443b] serif-font font-bold mb-2">풍수지리 AI 대가</p>
          <p className="text-[#8c8273] text-xs mb-6 max-w-sm mx-auto leading-relaxed">
            본 서비스는 40년 대가의 풍수 이론을 학습한 AI가 제공하는 분석 결과입니다.
            엔터테인먼트 및 인테리어 참고용으로 활용하시길 권장하며, 개인의 선택과 결과에 대한 법적 책임은 사용자에게 있습니다.
          </p>
          <p className="text-[#b0a99f] text-[10px]">© 2024 Feng Shui Grand Master AI. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        @keyframes zoom-in-95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-in { animation: zoom-in-95 0.2s ease-out; }
      `}</style>
    </div>
  );
}
