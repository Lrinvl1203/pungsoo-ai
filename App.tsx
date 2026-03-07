
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Home, Heart, Send, Loader2, Compass, Box, Menu, X } from 'lucide-react';
import { UserMetadata, AnalysisResult, ImageSizeOption } from './types';
import { analyzeFengShui, generateToBeImage, generateRemedyArtImage, generateZodiacArtImage } from './services/geminiService';
import { useAuth } from './contexts/AuthContext';
import { useUserSettings } from './hooks/useUserSettings';
import LoginButton from './components/LoginButton';
import PaymentButton from './components/PaymentButton';
import AnalysisForm from './components/AnalysisForm';
import ResultView from './components/ResultView';
import Onboarding from './components/Onboarding';
import DailyFengShui from './components/DailyFengShui';
import { saveAnalysis, getAnalysisById } from './services/analysisHistoryService';
import { supabase } from './services/supabaseClient';

// Ensure Kakao SDK is typed
declare global {
  interface Window {
    Kakao: any;
  }
}

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
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ result: AnalysisResult, image: string, remedyArt: string, zodiacImage: string | null }[]>([]);

  // Address Autocomplete States
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ place_name: string; address_name: string }>>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('onboarding') === 'true') {
        return true;
      }
      return localStorage.getItem('PUNGSOO_ONBOARDING_COMPLETED') !== 'true';
    }
    return true;
  });

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

  // Load history from localStorage on mount, and handle shared URL (?id=)
  React.useEffect(() => {
    // 1. Initialize Kakao SDK
    if (window.Kakao && !window.Kakao.isInitialized()) {
      const kakaoKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
      if (kakaoKey) {
        window.Kakao.init(kakaoKey);
      }
    }

    // 2. Check for shared ID
    const searchParams = new URLSearchParams(location.search);
    const sharedId = searchParams.get('id');

    if (sharedId) {
      setLoading(true);
      getAnalysisById(sharedId)
        .then((data) => {
          if (data) {
            setResult(data.result);
            setImage(data.image_url);
            setRemedyArt(data.remedy_art_url);
            setZodiacImage(data.zodiac_image_url);
            setToBeImage(data.to_be_image_url);
            setMetadata(data.metadata);

            // Scroll to analysis result
            setTimeout(() => {
              document.getElementById('analyze-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 500);
          } else {
            console.error('Shared analysis not found');
          }
        })
        .finally(() => setLoading(false));
    }

    // 3. Load local history
    const savedHistory = localStorage.getItem('pungsoo_history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
        // Only load if there's no sharedId
        if (!sharedId && location.state && typeof location.state.loadHistoryItem === 'number') {
          const idx = location.state.loadHistoryItem;
          if (parsedHistory[idx]) {
            const item = parsedHistory[idx];
            setResult(item.result);
            setImage(item.image);
            setRemedyArt(item.remedyArt);
            setZodiacImage(item.zodiacImage || null);
            setToBeImage(null);
            window.history.replaceState({}, document.title);
          }
        }
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, [location.search, location.state]);

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
    }, 300);
    return () => clearTimeout(timer);
  }, [addressQuery]);

  // Order Modal States
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [orderType, setOrderType] = useState<'frame' | 'object'>('frame');
  const [orderFormData, setOrderFormData] = useState({ name: '', contact: '', message: '', objectSize: { width: 5, height: 5, depth: 5 } });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const { user } = useAuth();
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);
  const isLoggedIn = !!user;

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOrder(true);
    try {
      const response = await fetch('/api/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType, name: orderFormData.name, contact: orderFormData.contact,
          message: orderFormData.message, userId: user?.id,
          objectSize: orderType === 'object' ? orderFormData.objectSize : undefined,
          analysisData: result ? { remedyArtKeyword: result.remedy_art?.solution_keyword, deficiency: result.remedy_art?.deficiency, zodiacAnimal: result.zodiac_remedy_object?.animal } : null
        })
      });
      if (response.ok) {
        alert('의뢰가 성공적으로 접수되었습니다. 곧 연락드리겠습니다.');
        setIsInquiryModalOpen(false);
        setOrderFormData({ name: '', contact: '', message: '', objectSize: { width: 5, height: 5, depth: 5 } });
      } else { alert('의뢰 전송에 실패했습니다. 관리자에게 문의해주세요.'); }
    } catch (error) { console.error(error); alert('오류가 발생했습니다. 다시 시도해주세요.'); }
    finally { setIsSubmittingOrder(false); }
  };

  const handlePaymentFail = () => { alert('결제가 실패했거나 취소되었습니다.'); setIsInquiryModalOpen(false); };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const MAX_SIZE = 1024;
          let { width, height } = img;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
            width = Math.round(width * ratio); height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) { ctx.drawImage(img, 0, 0, width, height); setImage(canvas.toDataURL('image/jpeg', 0.8)); }
          else { setImage(reader.result as string); }
          setToBeImage(null); setRemedyArt(null); setZodiacImage(null); setResult(null);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (metadata.analysisType === 'internal' && !image) { alert("분석할 이미지를 업로드해주세요."); return; }
    if (metadata.analysisType === 'external' && !metadata.address) { alert("지리적 입지 분석을 위한 주소를 입력해주세요."); return; }
    setShowSuggestions(false); setLoading(true); setResult(null); setToBeImage(null); setRemedyArt(null); setZodiacImage(null);
    try {
      const analysis = await analyzeFengShui({ base64Image: image || undefined, address: metadata.address }, metadata);
      setResult(analysis); setGeneratingVisuals(true);
      const promises = [generateRemedyArtImage(analysis.remedy_art.image_generation_prompt, metadata.artStyle, metadata.imageSize)];
      if (analysis.zodiac_remedy_object) { promises.push(generateZodiacArtImage(analysis.zodiac_remedy_object)); } else { promises.push(Promise.resolve("")); }
      if (metadata.analysisType === 'internal' && image) { promises.push(generateToBeImage(image, analysis.solution_items)); }
      const settled = await Promise.allSettled(promises);
      let remedyObj = settled[0]; let zodiacObjRes = settled[1]; let visualObj = metadata.analysisType === 'internal' ? settled[2] : null;
      if (visualObj && visualObj.status === 'fulfilled') { setToBeImage(visualObj.value); }
      else if (visualObj && visualObj.status === 'rejected') { console.error("To-Be image generation failed:", visualObj.reason); setToBeImage('error'); }
      let newZodiacImage = zodiacObjRes && zodiacObjRes.status === 'fulfilled' && zodiacObjRes.value ? zodiacObjRes.value : null;
      if (newZodiacImage) setZodiacImage(newZodiacImage);
      const newRemedyArt = remedyObj && remedyObj.status === 'fulfilled' ? remedyObj.value : null;
      if (newRemedyArt) setRemedyArt(newRemedyArt);
      const newHistory = [{ result: analysis, image: metadata.analysisType === 'internal' ? (image || '') : 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&q=80&w=400', remedyArt: newRemedyArt ?? '', zodiacImage: newZodiacImage }, ...history].slice(0, 10);
      setHistory(newHistory); localStorage.setItem('pungsoo_history', JSON.stringify(newHistory));

      // Save to Supabase — use session from SDK (primary) or userRef (fallback)
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const currentUserId = currentSession?.user?.id ?? userRef.current?.id;
      if (currentUserId) {
        const toBeVal = visualObj && visualObj.status === 'fulfilled' ? visualObj.value : null;
        saveAnalysis({
          userId: currentUserId,
          analysisType: metadata.analysisType,
          image: null,
          address: metadata.analysisType === 'external' ? (metadata.address || null) : null,
          metadata,
          result: analysis,
          remedyArt: newRemedyArt,
          zodiacImage: newZodiacImage,
          toBeImage: toBeVal,
        }).then(savedData => {
          if (savedData) setCurrentAnalysisId(savedData.id);
        }).catch(err => console.error('[Supabase] save failed:', err));
      }
    } catch (error) { console.error(error); alert("분석 중 오류가 발생했습니다. 다시 시도해주세요."); }
    finally { setLoading(false); setGeneratingVisuals(false); }
  };

  const handleRegenerateArt = async () => {
    if (!result) return;
    setIsRegeneratingArt(true); setRemedyArt(null);
    try { const newImage = await generateRemedyArtImage(result.remedy_art.image_generation_prompt, metadata.artStyle, metadata.imageSize); setRemedyArt(newImage); }
    catch (error) { console.error(error); alert("이미지 재생성에 실패했습니다."); }
    finally { setIsRegeneratingArt(false); }
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a'); link.href = dataUrl; link.download = filename; link.click();
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col group/design-root font-display text-slate-100 antialiased overflow-x-hidden">
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
      {!showOnboarding && <DailyFengShui />}
      {/* Background Image Layer */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(34, 30, 16, 0.3), rgba(34, 30, 16, 0.95)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCvWHIjiF4g5DNNRn-SXcwt2avj0BLQtkpRNkxzW4yaTcZygH6W75Mgm8xZfJMFwgDl3ZzUlc6mIm4DU7KMOq9ZA8y3P28VLj1AWm2fRSFz2W-eyaA8d3S-LT53x4KMyKZpWH97cfzWmHsYvjueHKf65AAHWn-QMjARhiNGq2m8jJxhg0Z_jHAroZMcVI7Cnqw_qBdC3swN5eLsbl34fGk8Nfx5AJ9q5f5qB6fz36r-sNjy-iST8wYDkl9viWeX0tRoiIMznIsyWmEx")' }}></div>
      {/* Floating Particles */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="particle particle-1"></div><div className="particle particle-2"></div><div className="particle particle-3"></div><div className="particle particle-4"></div><div className="particle particle-5"></div>
      </div>
      <div className="relative z-10">

        {/* Header Navigation */}
        <header className="fixed top-0 z-50 w-full border-b border-primary/20 bg-[#221e10]/80 backdrop-blur-xl transition-all">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Compass className="w-6 h-6" /></div>
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
              <button onClick={toggleTestMode} className={`text-xs px-3 py-1.5 rounded-full border transition-colors shadow-sm ${isTestMode ? 'bg-primary/20 text-primary border-primary font-bold' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}>
                {isTestMode ? '🧪 ON' : '🧪 OFF'}
              </button>
              <span className="hidden md:block"><LoginButton /></span>
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 text-slate-300 hover:text-primary transition-colors">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute top-0 right-0 h-full w-72 bg-[#221e10]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl p-6 flex flex-col" style={{ animation: 'slideInRight 0.25s ease-out' }}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-primary" />
                  <span className="font-bold text-white">풍수지리 AI</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1">
                <ul className="space-y-1">
                  <li><a onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"><Home className="w-5 h-5" /> 홈</a></li>
                  <li><a href="#analyze-section" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all"><Sparkles className="w-5 h-5" /> 분석하기</a></li>
                  <li><a href="/mypage" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all"><Heart className="w-5 h-5" /> 마이페이지</a></li>
                </ul>
              </nav>
              <div className="border-t border-white/10 pt-4 space-y-3">
                <LoginButton />
                <div className="flex gap-3 text-[10px] text-slate-500">
                  <a href="/terms" className="hover:text-primary transition-colors">이용약관</a>
                  <a href="/privacy" className="hover:text-primary transition-colors">개인정보처리방침</a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="relative flex min-h-[85vh] flex-col items-center justify-center text-center px-4 pt-20">
          <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 backdrop-blur-sm mx-auto mb-6">
              <Sparkles className="w-4 h-4 text-primary" /><span className="text-xs font-bold uppercase tracking-wider text-primary">AI 기반 풍수 분석 서비스</span>
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
              <span>분석 시작하기</span><Send className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a href="/mypage" className="group flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-[#221e10]/50 px-8 text-base font-bold text-white backdrop-blur-sm transition-all hover:border-primary hover:text-primary">
              <Compass className="w-5 h-5" /><span>마이페이지</span>
            </a>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5"><div className="w-1.5 h-3 rounded-full bg-primary scroll-indicator"></div></div>
          </div>
        </section>

        <main id="analyze-section" className="max-w-2xl mx-auto px-4 py-16 pb-24">
          <div className="flex flex-col gap-16">
            {/* Input Section — Extracted Component */}
            <AnalysisForm
              metadata={metadata} setMetadata={setMetadata} image={image} loading={loading} history={history}
              addressQuery={addressQuery} setAddressQuery={setAddressQuery}
              addressSuggestions={addressSuggestions} isSearchingAddress={isSearchingAddress}
              showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions}
              onImageUpload={handleImageUpload}
              onClearImage={() => { setImage(null); setResult(null); setToBeImage(null); setRemedyArt(null); setZodiacImage(null); }}
              onAnalyze={handleAnalyze}
              onLoadHistory={(idx) => { const item = history[idx]; setResult(item.result); setImage(item.image); setRemedyArt(item.remedyArt); setZodiacImage(item.zodiacImage || null); setToBeImage(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onClearHistory={() => { localStorage.removeItem('pungsoo_history'); setHistory([]); }}
            />

            {/* Results Section — Extracted Component */}
            <ResultView
              result={result} loading={loading} image={image} toBeImage={toBeImage}
              remedyArt={remedyArt} zodiacImage={zodiacImage}
              metadata={metadata} setMetadata={setMetadata}
              isRegeneratingArt={isRegeneratingArt} onRegenerateArt={handleRegenerateArt}
              onDownloadImage={downloadImage}
              onOrderFrame={() => { setOrderType('frame'); setIsInquiryModalOpen(true); }}
              onOrderObject={() => { setOrderType('object'); setIsInquiryModalOpen(true); }}
              currentAnalysisId={currentAnalysisId}
            />
          </div>
        </main>

        {/* Inquiry Modal */}
        {isInquiryModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#221e10]/95 backdrop-blur-xl border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <h3 className="font-bold text-2xl text-white mb-2">{orderType === 'frame' ? '액자 제작 의뢰' : '오브제 제작 의뢰'}</h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                {orderType === 'frame' ? 'AI가 처방한 당신만의 디지털 비방을 최고급 린넨 캔버스 액자로 간직하세요.' : '추천받은 12간지 비방 오브제를 3D 프린팅으로 맞춤 제작해 드립니다.'}
              </p>
              <form onSubmit={handleOrderSubmit} className="space-y-4 mb-6">
                {!isLoggedIn && (<>
                  <div><label className="block text-xs font-semibold text-slate-300 mb-1">이름</label>
                    <input type="text" required value={orderFormData.name} onChange={(e) => setOrderFormData({ ...orderFormData, name: e.target.value })}
                      className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary" placeholder="의뢰자 성함" /></div>
                  <div><label className="block text-xs font-semibold text-slate-300 mb-1">연락처 (이메일 또는 전화번호)</label>
                    <input type="text" required value={orderFormData.contact} onChange={(e) => setOrderFormData({ ...orderFormData, contact: e.target.value })}
                      className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary" placeholder="회신 받으실 연락처" /></div>
                </>)}
                {orderType === 'object' && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-primary/30 p-4 space-y-3">
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center gap-1.5"><Box className="w-3.5 h-3.5 text-primary" /> 제작 사이즈 (cm)</label>
                    <div className="flex flex-wrap gap-2">
                      {[{ label: '소형 (5×5×5)', w: 5, h: 5, d: 5 }, { label: '중형 (10×10×10)', w: 10, h: 10, d: 10 }, { label: '대형 (15×15×15)', w: 15, h: 15, d: 15 }].map((preset) => (
                        <button key={preset.label} type="button"
                          onClick={() => setOrderFormData({ ...orderFormData, objectSize: { width: preset.w, height: preset.h, depth: preset.d } })}
                          className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${orderFormData.objectSize.width === preset.w && orderFormData.objectSize.height === preset.h && orderFormData.objectSize.depth === preset.d ? 'bg-[#d4af37] text-white border-primary shadow-md' : 'bg-white/5 backdrop-blur-md text-slate-200 border-white/10 hover:border-primary'}`}>
                          {preset.label}
                        </button>))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ label: '가로 (W)', key: 'width' as const }, { label: '세로 (D)', key: 'height' as const }, { label: '높이 (H)', key: 'depth' as const }].map(({ label, key }) => (
                        <div key={key}><label className="block text-[10px] font-semibold text-slate-400 mb-1">{label}</label>
                          <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg px-2 py-1.5 focus-within:border-primary transition-colors">
                            <input type="number" min={1} max={100} value={orderFormData.objectSize[key]}
                              onChange={(e) => setOrderFormData({ ...orderFormData, objectSize: { ...orderFormData.objectSize, [key]: parseInt(e.target.value) || 1 } })}
                              className="w-full outline-none text-sm text-white font-bold bg-transparent" />
                            <span className="text-[10px] text-slate-400 shrink-0">cm</span>
                          </div></div>))}
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 px-3 py-2.5">
                      <p className="text-[10px] font-bold text-slate-300 uppercase mb-1.5">📐 크기 비교</p>
                      {(() => {
                        const maxDim = Math.max(orderFormData.objectSize.width, orderFormData.objectSize.height, orderFormData.objectSize.depth);
                        if (maxDim <= 5) return <p className="text-[11px] text-slate-200">🧊 골프공 ~ 탁구공 정도의 크기입니다.</p>;
                        if (maxDim <= 8) return <p className="text-[11px] text-slate-200">🍎 사과 하나 정도의 크기입니다.</p>;
                        if (maxDim <= 12) return <p className="text-[11px] text-slate-200">☕ 머그컵 또는 스마트폰 정도의 크기입니다.</p>;
                        if (maxDim <= 18) return <p className="text-[11px] text-slate-200">📚 A5 노트 또는 두꺼운 책 정도의 크기입니다.</p>;
                        if (maxDim <= 25) return <p className="text-[11px] text-slate-200">🖥️ A4 용지 또는 소형 화분 정도의 크기입니다.</p>;
                        return <p className="text-[11px] text-slate-200">🪴 대형 화분이나 책상 소품 수준의 크기입니다.</p>;
                      })()}
                      <p className="text-[10px] text-slate-400 mt-1.5">현재 입력: {orderFormData.objectSize.width}cm × {orderFormData.objectSize.height}cm × {orderFormData.objectSize.depth}cm</p>
                    </div>
                  </div>
                )}
                <div><label className="block text-xs font-semibold text-slate-300 mb-1">추가 요청사항 (선택사항)</label>
                  <textarea value={orderFormData.message} onChange={(e) => setOrderFormData({ ...orderFormData, message: e.target.value })}
                    className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary resize-none h-20"
                    placeholder={isLoggedIn ? `연락받으실 번호와 요청사항을 적어주세요.\n(예: 010-1234-5678, 배송은 주말에 해주세요.)` : "그 외 요청하실 사항을 적어주세요."} />
                </div>
                <div className="pt-4 space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmittingOrder || (!isLoggedIn && (!orderFormData.name || !orderFormData.contact))}
                    className="w-full py-4 bg-[#d4af37] text-[#221e10] font-bold rounded-xl hover:bg-[#c29d2f] transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmittingOrder ? (
                      <div className="w-5 h-5 border-2 border-[#221e10]/30 border-t-[#221e10] rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    이메일로 먼저 의뢰 접수하기 (나중에 결제)
                  </button>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">또는 즉시 결제</span>
                    <div className="flex-grow border-t border-white/10"></div>
                  </div>

                  <PaymentButton amount={orderType === 'frame' ? 49000 : 79000}
                    orderName={`[풍수AI] ${orderType === 'frame' ? '디지털 액자' : '12간지 비방 오브제'} 제작 의뢰`}
                    orderType={orderType}
                    onSuccess={() => {
                      localStorage.setItem('temp_order_name', orderFormData.name); localStorage.setItem('temp_order_contact', orderFormData.contact);
                      localStorage.setItem('temp_order_message', orderFormData.message); localStorage.setItem('temp_order_type', orderType);
                      localStorage.setItem('temp_order_userId', user?.id || '');
                      if (orderType === 'object') { localStorage.setItem('temp_order_objectSize', JSON.stringify(orderFormData.objectSize)); }
                      if (result) { localStorage.setItem('temp_order_analysisData', JSON.stringify({ remedyArtKeyword: result.remedy_art?.solution_keyword, deficiency: result.remedy_art?.deficiency, zodiacAnimal: result.zodiac_remedy_object?.animal })); }
                    }}
                    onFail={handlePaymentFail}
                    disabled={!isLoggedIn ? (!orderFormData.name || !orderFormData.contact) : false} />
                </div>
              </form>
              <button onClick={() => setIsInquiryModalOpen(false)} className="w-full py-3 bg-black/30 text-slate-300 font-bold rounded-xl hover:bg-white/10 transition-all">닫기</button>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="border-t border-white/10 bg-[#221e10]/80 backdrop-blur-xl text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-8 px-6 py-6 lg:px-8">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-white/5 text-primary"><Compass className="w-5 h-5" /></span><div><p className="text-2xl font-bold leading-none">1,247</p><p className="text-xs text-slate-400 uppercase tracking-wider">총 분석</p></div></div>
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-white/5 text-primary"><Heart className="w-5 h-5" /></span><div><p className="text-2xl font-bold leading-none">892</p><p className="text-xs text-slate-400 uppercase tracking-wider">사용자</p></div></div>
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-white/5 text-primary"><Sparkles className="w-5 h-5" /></span><div><p className="text-2xl font-bold leading-none">3,841</p><p className="text-xs text-slate-400 uppercase tracking-wider">생성 아트</p></div></div>
            <div className="hidden md:flex items-center gap-3 border-l border-white/10 pl-8"><p className="text-sm font-medium text-slate-300">서비스 상태:</p><span className="flex items-center gap-1.5 text-sm font-bold text-green-400"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> 정상 운영</span></div>
          </div>
        </div>

        <footer className="bg-[#221e10]/90 backdrop-blur-xl border-t border-white/10 py-12 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="text-white font-bold mb-2">풍수지리 AI 대가</p>
            <p className="text-slate-400 text-xs mb-4 max-w-sm mx-auto leading-relaxed">본 서비스는 40년 대가의 풍수 이론을 학습한 AI가 제공하는 분석 결과입니다. 엔터테인먼트 및 인테리어 참고용으로 활용하시길 권장하며, 개인의 선택과 결과에 대한 법적 책임은 사용자에게 있습니다.</p>
            <div className="flex items-center justify-center gap-4 mb-4 text-xs">
              <a href="/terms" className="text-slate-400 hover:text-primary transition-colors">이용약관</a>
              <span className="text-slate-600">|</span>
              <a href="/privacy" className="text-slate-400 hover:text-primary transition-colors">개인정보처리방침</a>
              <span className="text-slate-600">|</span>
              <a href="mailto:lrinvl1203@gmail.com" className="text-slate-400 hover:text-primary transition-colors">문의하기</a>
            </div>
            <p className="text-slate-500 text-[10px]">© Feng Shui Grand Master AI. All rights reserved.</p>
          </div>
        </footer>

        <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        @keyframes zoom-in-95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-in { animation: zoom-in-95 0.2s ease-out; }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { opacity: 0; animation: fadeInUp 0.8s ease-out forwards; }
        @keyframes staggerIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .stagger-item { opacity: 0; animation: staggerIn 0.6s ease-out forwards; }
        @keyframes scrollDown { 0% { transform: translateY(0); opacity: 1; } 60% { transform: translateY(6px); opacity: 0.5; } 100% { transform: translateY(0); opacity: 1; } }
        .scroll-indicator { animation: scrollDown 1.5s ease-in-out infinite; }
        @keyframes loadingPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.9); } }
        .loading-pulse { animation: loadingPulse 2s ease-in-out infinite; }
        @keyframes loadingDot { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.2); } }
        .loading-dot { animation: loadingDot 1.4s ease-in-out infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; } 25% { transform: translateY(-100px) translateX(20px); opacity: 0.6; } 50% { transform: translateY(-200px) translateX(-10px); opacity: 0.3; } 75% { transform: translateY(-100px) translateX(-20px); opacity: 0.5; } }
        .particle { position: absolute; width: 4px; height: 4px; background: #f2b90d; border-radius: 50%; opacity: 0.3; }
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
