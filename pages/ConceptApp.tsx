
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Home, MapPin, Heart, Send, Loader2, Compass, AlertTriangle, CheckCircle2, ShoppingBag, Download, ExternalLink, ImageIcon, Palette, RefreshCw, Flower2, Box } from 'lucide-react';
import { UserMetadata, AnalysisResult, ImageSizeOption } from '../types';
import { analyzeFengShui, generateToBeImage, generateRemedyArtImage, generateZodiacArtImage } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useUserSettings } from '../hooks/useUserSettings';
import LoginButton from '../components/LoginButton';
import PaymentButton from '../components/PaymentButton';

export default function ConceptApp() {
  React.useEffect(() => {
    // Inject Google Fonts
    const link1 = document.createElement('link');
    link1.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800;900&display=swap';
    link1.rel = 'stylesheet';
    document.head.appendChild(link1);

    const link2 = document.createElement('link');
    link2.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    link2.rel = 'stylesheet';
    document.head.appendChild(link2);

    // Inject Tailwind classes specifically for this test page dynamically
    const script1 = document.createElement('script');
    script1.src = 'https://cdn.tailwindcss.com?plugins=forms,container-queries';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#f2b90d",
                        "background-light": "#f8f8f5",
                        "background-dark": "#221e10",
                    },
                    fontFamily: {
                        "display": ["Plus Jakarta Sans", "sans-serif"]
                    },
                    borderRadius: {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                },
            },
        }
    `;
    document.head.appendChild(script2);

    // Store original class
    const originalHtmlClass = document.documentElement.className;
    document.documentElement.className = 'dark';

    return () => {
      if (document.head.contains(link1)) document.head.removeChild(link1);
      if (document.head.contains(link2)) document.head.removeChild(link2);
      if (document.head.contains(script1)) document.head.removeChild(script1);
      if (document.head.contains(script2)) document.head.removeChild(script2);
      document.documentElement.className = originalHtmlClass;
    };
  }, []);

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
    artStyle: settings.artStyle,
    imageSize: { preset: '4:3' }
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
  const [orderFormData, setOrderFormData] = useState({ name: '', contact: '', message: '', objectSize: { width: 5, height: 5, depth: 5 } });
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
          objectSize: orderType === 'object' ? orderFormData.objectSize : undefined,
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
        setOrderFormData({ name: '', contact: '', message: '', objectSize: { width: 5, height: 5, depth: 5 } });
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
        generateRemedyArtImage(analysis.remedy_art.image_generation_prompt, metadata.artStyle, metadata.imageSize),
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

      if (visualObj && visualObj.status === 'fulfilled') {
        setToBeImage(visualObj.value);
      } else if (visualObj && visualObj.status === 'rejected') {
        console.error("To-Be image generation failed:", visualObj.reason);
        setToBeImage('error');
      }
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
      const newImage = await generateRemedyArtImage(result.remedy_art.image_generation_prompt, metadata.artStyle, metadata.imageSize);
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

    <div className="relative flex min-h-screen w-full flex-col group/design-root font-display text-slate-100 antialiased overflow-x-hidden">
      {/* Background Image Layer */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(34, 30, 16, 0.3), rgba(34, 30, 16, 0.95)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCvWHIjiF4g5DNNRn-SXcwt2avj0BLQtkpRNkxzW4yaTcZygH6W75Mgm8xZfJMFwgDl3ZzUlc6mIm4DU7KMOq9ZA8y3P28VLj1AWm2fRSFz2W-eyaA8d3S-LT53x4KMyKZpWH97cfzWmHsYvjueHKf65AAHWn-QMjARhiNGq2m8jJxhg0Z_jHAroZMcVI7Cnqw_qBdC3swN5eLsbl34fGk8Nfx5AJ9q5f5qB6fz36r-sNjy-iST8wYDkl9viWeX0tRoiIMznIsyWmEx")' }}></div>
      {/* Floating Particles */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
      </div>
      <div className="relative z-10">

        {/* Header Navigation */}
        <header className="fixed top-0 z-50 w-full border-b border-primary/20 bg-[#221e10]/80 backdrop-blur-xl transition-all">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Compass className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold leading-tight tracking-tight text-white">풍수지리 AI</h2>
            </div>
            <nav className="hidden md:flex flex-1 justify-center">
              <ul className="flex items-center gap-8">
                <li><a className="text-sm font-medium text-slate-300 transition-colors hover:text-primary cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>홈</a></li>
                <li><a className="text-sm font-medium text-slate-300 transition-colors hover:text-primary" href="#analyze-section">분석하기</a></li>
                <li><a className="text-sm font-medium text-slate-300 transition-colors hover:text-primary" href="/mypage">마이페이지</a></li>
              </ul>
            </nav>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={toggleTestMode}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors shadow-sm ${isTestMode ? 'bg-primary/20 text-primary border-primary font-bold' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
              >
                {isTestMode ? '🧪 ON' : '🧪 OFF'}
              </button>
              <LoginButton />
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative flex min-h-[85vh] flex-col items-center justify-center text-center px-4 pt-20">
          <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 backdrop-blur-sm mx-auto mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">AI 기반 풍수 분석 서비스</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight text-white mb-6 fade-in-up" style={{ animationDelay: '0.2s' }}>
            공간의 <span className="text-primary">기운</span>을<br />예술로 치유하다
          </h1>
          <p className="text-lg md:text-xl leading-relaxed text-slate-300 max-w-xl mx-auto mb-8 fade-in-up" style={{ animationDelay: '0.3s' }}>
            40년 대가의 풍수 이론을 학습한 AI가 당신의 공간을 분석하고,<br className="hidden md:block" />
            부족한 오행을 채워주는 디지털 비방(Remedy Art)을 처방합니다.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-center fade-in-up" style={{ animationDelay: '0.4s' }}>
            <a href="#analyze-section" className="group flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-bold text-[#221e10] transition-all hover:bg-yellow-400 hover:scale-105 active:scale-95">
              <span>분석 시작하기</span>
              <Send className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a href="/mypage" className="group flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-[#221e10]/50 px-8 text-base font-bold text-white backdrop-blur-sm transition-all hover:border-primary hover:text-primary">
              <Compass className="w-5 h-5" />
              <span>마이페이지</span>
            </a>
          </div>
          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
              <div className="w-1.5 h-3 rounded-full bg-primary scroll-indicator"></div>
            </div>
          </div>
        </section>

        <main id="analyze-section" className="max-w-2xl mx-auto px-4 py-16 pb-24">
          <div className="flex flex-col gap-16">

            {/* Input Section */}
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
                        // Delay hiding suggestions to allow click events to register
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
                              e.preventDefault(); // Prevent onBlur from firing before onClick
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

                  {/* 출생연도 + 성별 입력 - 본명궁 계산용 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                        출생연도
                      </label>
                      <input
                        type="number"
                        min={1940}
                        max={2010}
                        placeholder="예: 1985"
                        value={metadata.birthDate ? metadata.birthDate.slice(0, 4) : ''}
                        onChange={(e) => setMetadata({ ...metadata, birthDate: e.target.value })}
                        className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                        성별
                      </label>
                      <div className="flex gap-2 h-[38px]">
                        <button
                          type="button"
                          onClick={() => setMetadata({ ...metadata, gender: 'male' })}
                          className={`flex-1 rounded-lg border text-sm font-bold transition-all ${metadata.gender === 'male'
                            ? 'bg-[#d4af37] text-white border-primary shadow-md'
                            : 'bg-black/30 text-white text-slate-200 border-white/10 hover:border-primary'
                            }`}
                        >남성</button>
                        <button
                          type="button"
                          onClick={() => setMetadata({ ...metadata, gender: 'female' })}
                          className={`flex-1 rounded-lg border text-sm font-bold transition-all ${metadata.gender === 'female'
                            ? 'bg-[#d4af37] text-white border-primary shadow-md'
                            : 'bg-black/30 text-white text-slate-200 border-white/10 hover:border-primary'
                            }`}
                        >여성</button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">기본 비방 아트 스타일</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setMetadata({ ...metadata, artStyle: 'modern' })}
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all text-xs ${metadata.artStyle === 'modern' ? 'bg-[#d4af37] text-white border-primary font-bold shadow-md' : 'bg-black/30 text-white text-slate-200 border-white/10 hover:border-primary'}`}
                      >
                        <Palette className="w-4 h-4" /> 모던
                      </button>
                      <button
                        onClick={() => setMetadata({ ...metadata, artStyle: 'buddhist' })}
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all text-xs ${metadata.artStyle === 'buddhist' ? 'bg-[#d4af37] text-white border-primary font-bold shadow-md' : 'bg-black/30 text-white text-slate-200 border-white/10 hover:border-primary'}`}
                      >
                        <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[8px]">卍</div> 레트로
                      </button>
                      <button
                        onClick={() => setMetadata({ ...metadata, artStyle: 'modern_buddhist' })}
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all text-xs ${metadata.artStyle === 'modern_buddhist' ? 'bg-[#d4af37] text-white border-primary font-bold shadow-md' : 'bg-black/30 text-white text-slate-200 border-white/10 hover:border-primary'}`}
                      >
                        <Flower2 className="w-4 h-4" /> 모던 + 레트로
                      </button>
                    </div>
                  </div>

                  {/* Digital Art Image Size Section */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">비방 이미지 비율 (사이즈)</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(['1:1', '9:16', '16:9', '3:4', '4:3', 'custom'] as ImageSizeOption[]).map((size) => (
                        <button
                          key={size}
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
                          <input
                            type="number"
                            placeholder="px"
                            value={metadata.imageSize.customWidth || ''}
                            onChange={(e) => setMetadata({ ...metadata, imageSize: { ...metadata.imageSize, customWidth: parseInt(e.target.value) || undefined } })}
                            className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <span className="text-slate-300 text-sm">x</span>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-xs text-slate-300 font-semibold">세로:</span>
                          <input
                            type="number"
                            placeholder="px"
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

              {history.length > 0 && (
                <section className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/10">
                  <h2 className="font-bold text-xl font-bold mb-4 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-primary" /> 최근 분석 기록
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
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-black/30 text-white transition-colors text-left border border-transparent hover:border-white/10"
                      >
                        <img src={item.remedyArt} className="w-12 h-12 object-cover rounded-md" alt="History" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{item.result.analysis_summary}</p>
                          <p className="text-[10px] text-slate-300">{item.result.remedy_art.deficiency}</p>
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        localStorage.removeItem('pungsoo_history');
                        setHistory([]);
                      }}
                      className="w-full py-2 text-[10px] text-slate-400 hover:text-red-400 transition-colors"
                    >
                      기록 전체 삭제
                    </button>
                  </div>
                </section>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loading || (metadata.analysisType === 'internal' && !image) || (metadata.analysisType === 'external' && !metadata.address)}
                className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${loading || (metadata.analysisType === 'internal' && !image) || (metadata.analysisType === 'external' && !metadata.address) ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-primary text-[#221e10] hover:bg-yellow-400 hover:scale-[1.02] active:scale-95 hover:shadow-primary/30 hover:shadow-xl'}`}
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> 감명 중...</> : <><Send className="w-5 h-5" /> 풍수 감정 & 비방 생성</>}
              </button>
            </div>

            {/* Results Section */}
            <div className="relative">
              {loading && (
                <div className="absolute inset-0 bg-[#221e10]/80 backdrop-blur-xl z-20 flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-primary/20">
                  <div className="w-24 h-24 mb-8 relative">
                    <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                    <div className="absolute inset-[-4px] border-4 border-transparent border-t-primary rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
                    <div className="absolute inset-[6px] border-4 border-transparent border-b-primary/50 rounded-full animate-spin" style={{ animationDuration: '2.5s', animationDirection: 'reverse' }}></div>
                    <Compass className="absolute inset-0 m-auto w-10 h-10 text-primary loading-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">공간의 명당을 찾는 중...</h3>
                  <p className="text-slate-400 max-w-xs">부족한 기운을 채울 예술적 비방을 그려내고 있습니다.</p>
                  <div className="mt-6 flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary loading-dot" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary loading-dot" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary loading-dot" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}

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
                    <h3 className="font-bold text-2xl font-bold text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-primary" /> 종합 점수: <span className="text-primary text-3xl ml-1">{result.feng_shui_score}점</span>
                    </h3>
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

                  {/* 2. Detailed Report (Full Documentation) */}
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
                      <div className="prose prose-sm max-w-none text-white/95 leading-[1.9] whitespace-pre-wrap font-medium relative z-10 text-[15px]">
                        {result.detailed_report}
                      </div>
                    </section>
                  )}

                  {/* 3. Feng Shui Interior Prescription */}
                  {result.solution_items && result.solution_items.length > 0 && (
                    <section className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border border-white/10 stagger-item" style={{ animationDelay: '0.3s' }}>
                      <div className="bg-white/5 backdrop-blur-sm p-5 border-b border-white/10 flex justify-between items-center">
                        <h3 className="font-bold font-bold text-white flex items-center gap-2 text-xl">
                          <ShoppingBag className="w-6 h-6 text-primary" /> 풍수 인테리어 처방
                        </h3>
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
                  <section className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-primary/40 ring-4 ring-primary/10 mt-10 stagger-item" style={{ animationDelay: '0.5s' }}>
                    <div className="bg-primary text-background-dark p-5 text-white flex justify-between items-center shadow-sm">
                      <h3 className="font-bold font-bold flex items-center gap-2 text-xl">
                        <Sparkles className="w-6 h-6 text-white" /> AI 풍수 처방: 디지털 비방
                      </h3>
                    </div>
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col gap-8">
                        <div className={`w-full max-w-sm mx-auto ${metadata.imageSize.preset === '1:1' ? 'aspect-square' : metadata.imageSize.preset === '9:16' ? 'aspect-[9/16]' : metadata.imageSize.preset === '16:9' ? 'aspect-video w-full max-w-lg' : metadata.imageSize.preset === '3:4' ? 'aspect-[3/4]' : metadata.imageSize.preset === '4:3' ? 'aspect-[4/3] w-full max-w-md' : metadata.imageSize.customWidth && metadata.imageSize.customHeight ? `aspect-[${metadata.imageSize.customWidth}/${metadata.imageSize.customHeight}]` : 'aspect-[3/4]'} bg-[#fcfbfa] rounded-2xl overflow-hidden relative shadow-inner ring-1 ring-black/5 transition-all duration-300`}>
                          {remedyArt ? (
                            <img src={remedyArt} alt="Remedy Art" className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                              <p className="text-[15px] text-slate-300 leading-relaxed">부족한 <span className="font-bold text-primary">'{result.remedy_art.deficiency}'</span>의 기운을<br />
                                <span className="font-bold text-white">{metadata.artStyle === 'buddhist' ? '레트로 예술' : metadata.artStyle === 'modern_buddhist' ? '모던 레트로 예술' : '모던 아트'}</span>로 승화시키는 중입니다...</p>
                            </div>
                          )}
                          {remedyArt && (
                            <div className="absolute bottom-4 right-4 flex gap-2">
                              <button
                                onClick={() => downloadImage(remedyArt, 'FengShui_Remedy.png')}
                                className="bg-black/60 backdrop-blur-md shadow-xl p-3 rounded-full text-white hover:bg-black/80 hover:scale-105 transition-all"
                                title="이미지 다운로드"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-center space-y-5">
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
                                {/* Style Options */}
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1.5">스타일</label>
                                  <div className="grid grid-cols-3 gap-2">
                                    <button
                                      onClick={() => setMetadata({ ...metadata, artStyle: 'modern' })}
                                      className={`py-2.5 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${metadata.artStyle === 'modern' ? 'bg-[#4a443b] text-white shadow-md' : 'bg-black/30 text-white text-slate-200 hover:bg-white/10'}`}
                                    >
                                      모던
                                    </button>
                                    <button
                                      onClick={() => setMetadata({ ...metadata, artStyle: 'buddhist' })}
                                      className={`py-2.5 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${metadata.artStyle === 'buddhist' ? 'bg-[#4a443b] text-white shadow-md' : 'bg-black/30 text-white text-slate-200 hover:bg-white/10'}`}
                                    >
                                      레트로
                                    </button>
                                    <button
                                      onClick={() => setMetadata({ ...metadata, artStyle: 'modern_buddhist' })}
                                      className={`py-2.5 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${metadata.artStyle === 'modern_buddhist' ? 'bg-[#4a443b] text-white shadow-md' : 'bg-black/30 text-white text-slate-200 hover:bg-white/10'}`}
                                    >
                                      모던+레트로
                                    </button>
                                  </div>
                                </div>

                                {/* Size Options */}
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1.5">비율 (사이즈)</label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(['1:1', '9:16', '16:9', '3:4', '4:3', 'custom'] as ImageSizeOption[]).map((size) => (
                                      <button
                                        key={size}
                                        onClick={() => setMetadata({ ...metadata, imageSize: { ...metadata.imageSize, preset: size } })}
                                        className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all ${metadata.imageSize.preset === size ? 'bg-[#d4af37] text-white shadow-md' : 'bg-black/30 text-white text-slate-200 border border-white/10 hover:border-primary'}`}
                                      >
                                        {size === 'custom' ? '직접입력' : size}
                                      </button>
                                    ))}
                                  </div>
                                  {metadata.imageSize.preset === 'custom' && (
                                    <div className="flex items-center gap-2 mt-2 bg-black/30 text-white p-2 rounded-lg border border-white/10">
                                      <input
                                        type="number"
                                        placeholder="가로 px"
                                        value={metadata.imageSize.customWidth || ''}
                                        onChange={(e) => setMetadata({ ...metadata, imageSize: { ...metadata.imageSize, customWidth: parseInt(e.target.value) || undefined } })}
                                        className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded px-2 py-1 text-[11px] outline-none focus:border-primary"
                                      />
                                      <span className="text-slate-300 text-[10px]">x</span>
                                      <input
                                        type="number"
                                        placeholder="세로 px"
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
                              onClick={handleRegenerateArt}
                              disabled={isRegeneratingArt}
                              className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] to-[#c29d2f] text-white text-[15px] font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                              {isRegeneratingArt ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                              위 옵션으로 비방 다시 그리기
                            </button>
                          </div>

                          <div className="bg-[#4a443b] p-6 rounded-xl text-white italic text-[16px] leading-relaxed shadow-lg relative">
                            <div className="absolute top-2 left-3 text-4xl text-white/10 font-bold">"</div>
                            {result.remedy_art.art_story}
                            <div className="absolute bottom-[-10px] right-3 text-4xl text-white/10 font-bold">"</div>
                          </div>
                          <div className="space-y-2">
                            <button
                              disabled={!remedyArt}
                              onClick={() => { setOrderType('frame'); setIsInquiryModalOpen(true); }}
                              className="w-full py-3 border border-primary text-primary font-bold rounded-lg hover:bg-[#d4af37]/10 transition-colors flex items-center justify-center gap-2"
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
                    <section className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-primary/40 ring-4 ring-primary/10 mt-10 stagger-item" style={{ animationDelay: '0.6s' }}>
                      <div className="bg-primary text-background-dark p-5 text-white flex justify-between items-center shadow-sm">
                        <h3 className="font-bold font-bold flex items-center gap-2 text-xl">
                          <Box className="w-6 h-6 text-white" /> AI 풍수 처방: 12간지 비방 오브제
                        </h3>
                      </div>
                      <div className="p-6 md:p-8">
                        <div className="flex flex-col gap-8">
                          <div className="w-full max-w-sm mx-auto aspect-square bg-[#fcfbfa] rounded-2xl overflow-hidden relative shadow-inner ring-1 ring-black/5">
                            {zodiacImage ? (
                              <img src={zodiacImage} alt="Zodiac Remedy Object" className="w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                                <p className="text-[15px] text-slate-300 leading-relaxed">맞춤형 <span className="font-bold text-primary">12간지 비방 오브제</span>를<br />생성 중입니다...</p>
                              </div>
                            )}
                            {zodiacImage && (
                              <div className="absolute bottom-4 right-4 flex gap-2">
                                <button
                                  onClick={() => downloadImage(zodiacImage, 'FengShui_Zodiac_Object.png')}
                                  className="bg-black/60 backdrop-blur-md shadow-xl p-3 rounded-full text-white hover:bg-black/80 hover:scale-105 transition-all"
                                  title="이미지 다운로드"
                                >
                                  <Download className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col justify-center space-y-5">
                            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-xl border border-primary/30 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-[#d4af37]/5 rounded-full blur-xl"></div>
                              <h4 className="text-primary font-bold text-[13px] uppercase tracking-widest mb-2 relative z-10">추천 오브제</h4>
                              <p className="text-white font-extrabold text-3xl mb-4 relative z-10">{result.zodiac_remedy_object.animal}</p>
                              <div className="space-y-2 relative z-10">
                                <p className="text-[14px] text-slate-200 flex items-center gap-2 bg-white/5 backdrop-blur-md/60 p-2 rounded-lg"><span className="font-bold text-slate-300 w-20 shrink-0">재질 및 색상</span> {result.zodiac_remedy_object.material_and_color}</p>
                                <p className="text-[14px] text-slate-200 flex items-center gap-2 bg-white/5 backdrop-blur-md/60 p-2 rounded-lg"><span className="font-bold text-slate-300 w-20 shrink-0">선별 특징</span> {result.zodiac_remedy_object.specific_pose_or_feature}</p>
                              </div>
                            </div>

                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-sm hover:border-primary/30 transition-colors">
                              <h4 className="text-white font-bold text-[16px] mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> 추천 이유</h4>
                              <p className="text-slate-200 text-[15px] leading-relaxed font-medium">{result.zodiac_remedy_object.reason}</p>
                            </div>

                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-sm hover:border-primary/30 transition-colors">
                              <h4 className="text-white font-bold text-[16px] mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" /> 배치 가이드
                              </h4>
                              <p className="text-slate-200 text-[15px] leading-relaxed font-medium">{result.zodiac_remedy_object.placement_guide}</p>
                            </div>

                            <div className="space-y-2 pt-2">
                              <a
                                href={`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(result.zodiac_remedy_object.animal + ' 장식품 ' + result.zodiac_remedy_object.material_and_color)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="w-full py-3 border border-primary text-primary font-bold rounded-lg hover:bg-[#d4af37]/10 transition-colors flex items-center justify-center gap-2"
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
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl p-10 border-2 border-primary/30 text-center shadow-lg mt-12 mb-8 relative overflow-hidden group stagger-item" style={{ animationDelay: '0.7s' }}>
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0"></div>
                    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Heart className="w-10 h-10 text-primary mx-auto mb-5 drop-shadow-sm" />
                    <p className="text-white font-bold text-2xl italic leading-[1.8] max-w-xl mx-auto">
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
            <div className="bg-[#221e10]/95 backdrop-blur-xl border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <h3 className="font-bold text-2xl font-bold text-white mb-2">
                {orderType === 'frame' ? '액자 제작 의뢰' : '오브제 제작 의뢰'}
              </h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                {orderType === 'frame'
                  ? 'AI가 처방한 당신만의 디지털 비방을 최고급 린넨 캔버스 액자로 간직하세요. 기운을 가장 잘 보존하는 명당에 걸어두시면 좋습니다.'
                  : '추천받은 12간지 비방 오브제를 3D 프린팅으로 맞춤 제작해 드립니다.'}
              </p>

              <form onSubmit={handleOrderSubmit} className="space-y-4 mb-6">
                {!isLoggedIn && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">이름</label>
                      <input
                        type="text"
                        required
                        value={orderFormData.name}
                        onChange={(e) => setOrderFormData({ ...orderFormData, name: e.target.value })}
                        className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary"
                        placeholder="의뢰자 성함"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">연락처 (이메일 또는 전화번호)</label>
                      <input
                        type="text"
                        required
                        value={orderFormData.contact}
                        onChange={(e) => setOrderFormData({ ...orderFormData, contact: e.target.value })}
                        className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary"
                        placeholder="회신 받으실 연락처"
                      />
                    </div>
                  </>
                )}

                {/* 오브제 제작 사이즈 입력 */}
                {orderType === 'object' && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-primary/30 p-4 space-y-3">
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-primary" /> 제작 사이즈 (cm)
                    </label>

                    {/* 프리셋 버튼 */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: '소형 (5×5×5)', w: 5, h: 5, d: 5 },
                        { label: '중형 (10×10×10)', w: 10, h: 10, d: 10 },
                        { label: '대형 (15×15×15)', w: 15, h: 15, d: 15 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setOrderFormData({ ...orderFormData, objectSize: { width: preset.w, height: preset.h, depth: preset.d } })}
                          className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${orderFormData.objectSize.width === preset.w &&
                            orderFormData.objectSize.height === preset.h &&
                            orderFormData.objectSize.depth === preset.d
                            ? 'bg-[#d4af37] text-white border-primary shadow-md'
                            : 'bg-white/5 backdrop-blur-md text-slate-200 border-white/10 hover:border-primary'
                            }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* 직접 입력 */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: '가로 (W)', key: 'width' as const },
                        { label: '세로 (D)', key: 'height' as const },
                        { label: '높이 (H)', key: 'depth' as const },
                      ].map(({ label, key }) => (
                        <div key={key}>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">{label}</label>
                          <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg px-2 py-1.5 focus-within:border-primary transition-colors">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={orderFormData.objectSize[key]}
                              onChange={(e) => setOrderFormData({
                                ...orderFormData,
                                objectSize: { ...orderFormData.objectSize, [key]: parseInt(e.target.value) || 1 }
                              })}
                              className="w-full outline-none text-sm text-white font-bold bg-transparent"
                            />
                            <span className="text-[10px] text-slate-400 shrink-0">cm</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 크기 비교 안내 */}
                    <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 px-3 py-2.5">
                      <p className="text-[10px] font-bold text-slate-300 uppercase mb-1.5">📐 크기 비교</p>
                      {(() => {
                        const vol = orderFormData.objectSize.width * orderFormData.objectSize.height * orderFormData.objectSize.depth;
                        const maxDim = Math.max(orderFormData.objectSize.width, orderFormData.objectSize.height, orderFormData.objectSize.depth);
                        if (maxDim <= 5) return <p className="text-[11px] text-slate-200 leading-relaxed">🧊 골프공 (4cm) ~ 탁구공 (4cm) 정도의 크기입니다.</p>;
                        if (maxDim <= 8) return <p className="text-[11px] text-slate-200 leading-relaxed">🍎 사과 하나 정도의 크기입니다.</p>;
                        if (maxDim <= 12) return <p className="text-[11px] text-slate-200 leading-relaxed">☕ 머그컵 또는 스마트폰 정도의 크기입니다.</p>;
                        if (maxDim <= 18) return <p className="text-[11px] text-slate-200 leading-relaxed">📚 A5 노트 또는 두꺼운 책 정도의 크기입니다.</p>;
                        if (maxDim <= 25) return <p className="text-[11px] text-slate-200 leading-relaxed">🖥️ A4 용지 또는 소형 화분 정도의 크기입니다.</p>;
                        return <p className="text-[11px] text-slate-200 leading-relaxed">🪴 대형 화분이나 책상 소품 수준의 크기입니다. 제작 전 별도 상담이 진행됩니다.</p>;
                      })()}
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        현재 입력: {orderFormData.objectSize.width}cm × {orderFormData.objectSize.height}cm × {orderFormData.objectSize.depth}cm
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">추가 요청사항 (선택사항)</label>
                  <textarea
                    value={orderFormData.message}
                    onChange={(e) => setOrderFormData({ ...orderFormData, message: e.target.value })}
                    className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary resize-none h-20"
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
                      if (orderType === 'object') {
                        localStorage.setItem('temp_order_objectSize', JSON.stringify(orderFormData.objectSize));
                      }
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
                className="w-full py-3 bg-black/30 text-white text-slate-300 font-bold rounded-xl hover:bg-white/10 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="border-t border-white/10 bg-[#221e10]/80 backdrop-blur-xl text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-8 px-6 py-6 lg:px-8">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-white/5 text-primary">
                <Compass className="w-5 h-5" />
              </span>
              <div>
                <p className="text-2xl font-bold leading-none">1,247</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider">총 분석</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-white/5 text-primary">
                <Heart className="w-5 h-5" />
              </span>
              <div>
                <p className="text-2xl font-bold leading-none">892</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider">사용자</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-white/5 text-primary">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <p className="text-2xl font-bold leading-none">3,841</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider">생성 아트</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3 border-l border-white/10 pl-8">
              <p className="text-sm font-medium text-slate-300">서비스 상태:</p>
              <span className="flex items-center gap-1.5 text-sm font-bold text-green-400"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> 정상 운영</span>
            </div>
          </div>
        </div>

        <footer className="bg-[#221e10]/90 backdrop-blur-xl border-t border-white/10 py-12 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="text-white font-bold mb-2">풍수지리 AI 대가</p>
            <p className="text-slate-400 text-xs mb-6 max-w-sm mx-auto leading-relaxed">
              본 서비스는 40년 대가의 풍수 이론을 학습한 AI가 제공하는 분석 결과입니다.
              엔터테인먼트 및 인테리어 참고용으로 활용하시길 권장하며, 개인의 선택과 결과에 대한 법적 책임은 사용자에게 있습니다.
            </p>
            <p className="text-slate-500 text-[10px]">© Feng Shui Grand Master AI. All rights reserved.</p>
          </div>
        </footer>

        <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

        /* Animations */
        @keyframes zoom-in-95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-in { animation: zoom-in-95 0.2s ease-out; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.8s ease-out forwards;
        }

        @keyframes staggerIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stagger-item {
          opacity: 0;
          animation: staggerIn 0.6s ease-out forwards;
        }

        @keyframes scrollDown {
          0% { transform: translateY(0); opacity: 1; }
          60% { transform: translateY(6px); opacity: 0.5; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .scroll-indicator {
          animation: scrollDown 1.5s ease-in-out infinite;
        }

        @keyframes loadingPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
        .loading-pulse {
          animation: loadingPulse 2s ease-in-out infinite;
        }

        @keyframes loadingDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
        .loading-dot {
          animation: loadingDot 1.4s ease-in-out infinite;
        }

        /* Floating particles */
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-100px) translateX(20px); opacity: 0.6; }
          50% { transform: translateY(-200px) translateX(-10px); opacity: 0.3; }
          75% { transform: translateY(-100px) translateX(-20px); opacity: 0.5; }
        }
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #f2b90d;
          border-radius: 50%;
          opacity: 0.3;
        }
        .particle-1 { bottom: 10%; left: 10%; animation: float 8s ease-in-out infinite; }
        .particle-2 { bottom: 20%; left: 30%; animation: float 10s ease-in-out infinite 1s; width: 3px; height: 3px; }
        .particle-3 { bottom: 5%; right: 20%; animation: float 12s ease-in-out infinite 2s; width: 5px; height: 5px; }
        .particle-4 { bottom: 15%; right: 40%; animation: float 9s ease-in-out infinite 3s; width: 2px; height: 2px; }
        .particle-5 { bottom: 30%; left: 60%; animation: float 11s ease-in-out infinite 4s; width: 3px; height: 3px; }
      `}</style>
      </div>
    </div>
  );
}
