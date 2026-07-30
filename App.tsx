
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Home, Heart, Send, Loader2, Compass, Box, Menu, X } from 'lucide-react';
import { UserMetadata, AnalysisResult, ImageSizeOption } from './types';
import { analyzeFengShui, generateRemedyArtImage, generateZodiacArtImage } from './services/geminiService';
import { useAuth } from './contexts/AuthContext';
import { useUserSettings } from './hooks/useUserSettings';
import LoginButton from './components/LoginButton';
import PaymentButton from './components/PaymentButton';
import AnalysisForm from './components/AnalysisForm';
import ResultView from './components/ResultView';
import Onboarding, { ONBOARDING_COMPLETED_KEY } from './components/Onboarding';
import DailyFengShui from './components/DailyFengShui';
import { saveAnalysis, getAnalysisById, updateAnalysisVisuals } from './services/analysisHistoryService';
import { TEST_SAMPLE_ANALYSIS, TEST_SAMPLE_HISTORY_ITEM, TEST_SAMPLE_REMEDY_ART_IMAGE, TEST_SAMPLE_ZODIAC_IMAGE } from './services/sampleAnalysis';
import { supabase } from './services/supabaseClient';
import { trackEvent } from './services/analyticsService';
import { getProductDescriptor } from './services/productCatalog';
import { InteriorArtStyleId, INTERIOR_ART_STYLE_PACKS } from './utils/remedyArt';
import { clearLocalHistory, readLocalHistory, writeLocalHistory } from './services/localHistory';
import { useToast } from './components/ToastProvider';
import { useModalFocusTrap } from './hooks/useModalFocusTrap';
import { apiErrorFromResponse, getActionableErrorMessage } from './utils/apiError';

const ENABLE_PHYSICAL_PRODUCT_IMMEDIATE_PAYMENT = false;
const MAX_INPUT_IMAGES = 3;

const replaceAnalysisIdInUrl = (analysisId: string | null) => {
  const url = new URL(window.location.href);
  if (analysisId) url.searchParams.set('id', analysisId);
  else url.searchParams.delete('id');
  window.history.replaceState(window.history.state, document.title, `${url.pathname}${url.search}${url.hash}`);
};

const compressImageFile = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('사진을 읽지 못했습니다.'));
  reader.onload = () => {
    const source = String(reader.result || '');
    const uploadedImage = new Image();
    uploadedImage.onerror = () => reject(new Error('지원하지 않는 이미지 형식입니다.'));
    uploadedImage.onload = () => {
      // Keep three-photo requests comfortably below common serverless body limits.
      const maxSize = 1024;
      const ratio = Math.min(1, maxSize / uploadedImage.width, maxSize / uploadedImage.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(uploadedImage.width * ratio));
      canvas.height = Math.max(1, Math.round(uploadedImage.height * ratio));
      const context = canvas.getContext('2d');
      if (!context) {
        resolve(source);
        return;
      }
      context.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.76));
    };
    uploadedImage.src = source;
  };
  reader.readAsDataURL(file);
});

// Ensure Kakao SDK is typed
declare global {
  interface Window {
    Kakao: any;
  }
}

export default function App() {
  const location = useLocation();
  const { notify } = useToast();
  const canUseTestMode = import.meta.env.DEV;
  const [images, setImages] = useState<string[]>([]);
  const image = images[0] || null;
  const [toBeImage, setToBeImage] = useState<string | null>(null);
  const [remedyArt, setRemedyArt] = useState<string | null>(null);
  const [interiorRemedyArt, setInteriorRemedyArt] = useState<string | null>(null);
  const [interiorStyleId, setInteriorStyleId] = useState<InteriorArtStyleId | null>(null);
  const [zodiacImage, setZodiacImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingVisuals, setGeneratingVisuals] = useState(false);
  const [isRegeneratingArt, setIsRegeneratingArt] = useState(false);
  const [isGeneratingZodiacImage, setIsGeneratingZodiacImage] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [sharedAnalysisMessage, setSharedAnalysisMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<{
    analysisId?: string | null;
    result: AnalysisResult;
    image: string;
    remedyArt: string;
    interiorRemedyArt?: string | null;
    interiorStyleId?: InteriorArtStyleId | null;
    zodiacImage: string | null;
    metadata?: UserMetadata;
  }[]>([]);
  const { user, loading: authLoading } = useAuth();
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // Address Autocomplete States
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{
    place_name: string;
    address_name: string;
    x: string;
    y: string;
  }>>([]);
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
      return localStorage.getItem(ONBOARDING_COMPLETED_KEY) !== 'true';
    }
    return true;
  });

  // Test Mode State
  const [isTestMode, setIsTestMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return canUseTestMode && localStorage.getItem('PUNGSOO_TEST_MODE') === 'true';
    }
    return false;
  });
  const [isPremiumPreviewUnlocked, setIsPremiumPreviewUnlocked] = useState(() => {
    if (typeof window !== 'undefined') {
      return canUseTestMode && localStorage.getItem('PUNGSOO_PREMIUM_PREVIEW') === 'true';
    }
    return false;
  });

  const toggleTestMode = () => {
    if (!canUseTestMode) return;
    const newVal = !isTestMode;
    setIsTestMode(newVal);
    localStorage.setItem('PUNGSOO_TEST_MODE', newVal.toString());
  };

  const togglePremiumPreview = () => {
    if (!canUseTestMode) return;
    const newVal = !isPremiumPreviewUnlocked;
    setIsPremiumPreviewUnlocked(newVal);
    localStorage.setItem('PUNGSOO_PREMIUM_PREVIEW', newVal.toString());
  };

  React.useEffect(() => {
    if (!canUseTestMode) {
      setIsTestMode(false);
      setIsPremiumPreviewUnlocked(false);
      localStorage.removeItem('PUNGSOO_TEST_MODE');
      localStorage.removeItem('PUNGSOO_PREMIUM_PREVIEW');
      return;
    }
    if (!isTestMode && isPremiumPreviewUnlocked) {
      setIsPremiumPreviewUnlocked(false);
      localStorage.removeItem('PUNGSOO_PREMIUM_PREVIEW');
    }
  }, [canUseTestMode, isTestMode, isPremiumPreviewUnlocked]);

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
      if (authLoading) return;
      setLoading(true);
      setSharedAnalysisMessage(null);
      getAnalysisById(sharedId)
        .then((data) => {
          if (data) {
            setResult(data.result);
            setImages(data.image_url ? [data.image_url] : []);
            setRemedyArt(data.remedy_art_url);
            setInteriorRemedyArt(data.interior_remedy_art_url || null);
            setInteriorStyleId(data.interior_style_id || null);
            setZodiacImage(data.zodiac_image_url);
            setToBeImage(data.to_be_image_url);
            setMetadata(data.metadata);
            setCurrentAnalysisId(data.id);
            setSharedAnalysisMessage(null);

            // Scroll to analysis result
            setTimeout(() => {
              document.getElementById('analyze-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 500);
          } else {
            setSharedAnalysisMessage(user ? '분석 결과를 찾을 수 없습니다.' : '로그인 후 구매한 공간비방서를 확인할 수 있습니다.');
            console.error('Shared analysis not found');
            const fallback = readLocalHistory<typeof history[number]>()[0];
            if (fallback) {
              setResult(fallback.result);
              setImages(fallback.image ? [fallback.image] : []);
              setRemedyArt(fallback.remedyArt);
              setInteriorRemedyArt(fallback.interiorRemedyArt || null);
              setInteriorStyleId(fallback.interiorStyleId || null);
              setZodiacImage(fallback.zodiacImage || null);
              if (fallback.metadata) setMetadata(fallback.metadata);
              setCurrentAnalysisId(fallback.analysisId || null);
              setSharedAnalysisMessage('서버 결과를 열지 못해 이 기기에 저장된 최근 분석을 복원했습니다.');
            }
          }
        })
        .finally(() => setLoading(false));
    } else {
      setSharedAnalysisMessage(null);
    }

    // 3. Load local history
    const storedHistory = readLocalHistory<{
      analysisId?: string | null;
      result: AnalysisResult;
      image: string;
      remedyArt: string;
      interiorRemedyArt?: string | null;
      interiorStyleId?: InteriorArtStyleId | null;
      zodiacImage: string | null;
      metadata?: UserMetadata;
    }>();
    const ensureTestSample = (items: typeof storedHistory): typeof storedHistory => {
      if (!isTestMode) return items;
      const sampleIndex = items.findIndex((item) => item.result?.analysis_summary === TEST_SAMPLE_ANALYSIS.analysis_summary);
      if (sampleIndex >= 0) {
        const nextItems = [...items];
        nextItems[sampleIndex] = TEST_SAMPLE_HISTORY_ITEM;
        return nextItems;
      }
      return [TEST_SAMPLE_HISTORY_ITEM, ...items].slice(0, 10);
    };

    if (storedHistory.length > 0) {
      try {
        const parsedHistory = ensureTestSample(storedHistory);
        setHistory(parsedHistory);
        writeLocalHistory(parsedHistory);
        // Only load if there's no sharedId
        if (!sharedId) {
          if (location.state && typeof location.state.loadHistoryItem === 'number') {
            const idx = location.state.loadHistoryItem;
            if (parsedHistory[idx]) {
              const item = parsedHistory[idx];
              setResult(item.result);
              setImages(item.image ? [item.image] : []);
              setRemedyArt(item.remedyArt);
              setInteriorRemedyArt(item.interiorRemedyArt || null);
              setInteriorStyleId(item.interiorStyleId || null);
              setZodiacImage(item.zodiacImage || null);
              setToBeImage(null);
              if (item.metadata) setMetadata(item.metadata);
              setCurrentAnalysisId(item.analysisId || null);
              replaceAnalysisIdInUrl(item.analysisId || null);
            }
          } else if (parsedHistory.length > 0) {
            // 새로고침·결제 복귀·비로그인 상태 모두 최근 로컬 결과로 복원
            const latest = parsedHistory[0];
            setResult(latest.result);
            setImages(latest.image ? [latest.image] : []);
            setRemedyArt(latest.remedyArt);
            setInteriorRemedyArt(latest.interiorRemedyArt || null);
            setInteriorStyleId(latest.interiorStyleId || null);
            setZodiacImage(latest.zodiacImage || null);
            setToBeImage(null);
            if (latest.metadata) setMetadata(latest.metadata);
            setCurrentAnalysisId(latest.analysisId || null);
            if (latest.analysisId) replaceAnalysisIdInUrl(latest.analysisId);
          }
        }
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    } else if (isTestMode) {
      const sampleHistory = [TEST_SAMPLE_HISTORY_ITEM];
      setHistory(sampleHistory);
      writeLocalHistory(sampleHistory);
    }
  }, [location.search, location.state, isTestMode, authLoading, user?.id]);

  const { settings, updateSettings } = useUserSettings();

  const [metadata, setMetadata] = useState<UserMetadata>({
    analysisType: 'internal',
    roomType: '침실',
    address: '',
    locationConfirmed: false,
    entranceBearingDegrees: null,
    directionMethod: 'none',
    directionConfidence: 'none',
    birthDate: settings.birthDate,
    gender: settings.gender,
    concern: '',
    artStyle: 'auto',
    imageSize: { preset: '3:4' }
  });

  // Save specific settings when they change
  React.useEffect(() => {
    updateSettings({
      birthDate: metadata.birthDate,
      gender: metadata.gender,
      artStyle: 'auto'
    });
  }, [metadata.birthDate, metadata.gender]);

  // Handle address input change with debounce
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (isTestMode) {
        setAddressSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      if (addressQuery.trim().length > 1) {
        setIsSearchingAddress(true);
        try {
          const res = await fetch(`/api/search-address?q=${encodeURIComponent(addressQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setAddressSuggestions(data.results || []);
            setShowSuggestions(true);
          } else {
            throw await apiErrorFromResponse(res, '주소 검색에 실패했습니다.');
          }
        } catch (error) {
          console.error("Failed to search address", error);
          setAddressSuggestions([]);
          notify(getActionableErrorMessage(error, '주소를 검색하지 못했습니다. 잠시 후 다시 시도해 주세요.'), 'error');
        } finally {
          setIsSearchingAddress(false);
        }
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [addressQuery, isTestMode, notify]);

  // Order Modal States
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [orderType, setOrderType] = useState<'frame' | 'object'>('frame');
  const [frameArtworkSelection, setFrameArtworkSelection] = useState<{
    edition: 'signature' | 'interior';
    styleId: InteriorArtStyleId | null;
    artworkUrl: string | null;
  }>({ edition: 'signature', styleId: null, artworkUrl: null });
  const [orderFormData, setOrderFormData] = useState({ name: '', contact: '', message: '', objectSize: { width: 5, height: 5, depth: 5 } });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const inquiryModalRef = useModalFocusTrap(isInquiryModalOpen, () => setIsInquiryModalOpen(false));
  const isLoggedIn = !!user;
  const selectedPhysicalProduct = getProductDescriptor(metadata.analysisType, orderType);
  const orderCustomerName = isLoggedIn ? (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '회원') : orderFormData.name;
  const orderCustomerContact = isLoggedIn ? (user?.email || orderFormData.contact) : orderFormData.contact;

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOrder(true);
    try {
      const response = await fetch('/api/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType,
          analysisScope: metadata.analysisType,
          productSku: selectedPhysicalProduct.sku,
          analysisId: currentAnalysisId,
          name: orderCustomerName,
          contact: orderCustomerContact,
          message: orderFormData.message, userId: user?.id,
          objectSize: orderType === 'object' ? orderFormData.objectSize : undefined,
          analysisData: result ? {
            remedyArtKeyword: result.remedy_art?.solution_keyword,
            deficiency: result.remedy_art?.deficiency,
            zodiacAnimal: result.zodiac_remedy_object?.animal,
            artEdition: orderType === 'frame' ? frameArtworkSelection.edition : null,
            interiorStyleId: orderType === 'frame' ? frameArtworkSelection.styleId : null,
            artworkUrl: orderType === 'frame' ? frameArtworkSelection.artworkUrl : null,
          } : null
        })
      });
      if (response.ok) {
        notify('의뢰가 접수되었습니다. 입력한 연락처로 확인 안내를 드립니다.', 'success');
        setIsInquiryModalOpen(false);
        setOrderFormData({ name: '', contact: '', message: '', objectSize: { width: 5, height: 5, depth: 5 } });
      } else {
        throw await apiErrorFromResponse(response, '의뢰 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      notify(getActionableErrorMessage(error, '의뢰를 보내지 못했습니다. 입력 내용을 확인하고 다시 시도해 주세요.'), 'error');
    }
    finally { setIsSubmittingOrder(false); }
  };

  const handlePaymentFail = () => {
    notify('결제가 완료되지 않았습니다. 주문 내용은 유지되므로 준비되면 다시 시도해 주세요.', 'warning');
    setIsInquiryModalOpen(false);
  };

  const resetGeneratedResult = () => {
    setToBeImage(null);
    setRemedyArt(null);
    setInteriorRemedyArt(null);
    setInteriorStyleId(null);
    setZodiacImage(null);
    setResult(null);
    setCurrentAnalysisId(null);
    replaceAnalysisIdInUrl(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    if (selected.length === 0) return;

    const availableSlots = MAX_INPUT_IMAGES - images.length;
    if (availableSlots <= 0) {
      notify('사진은 최대 3장까지 올릴 수 있습니다. 기존 사진을 지운 뒤 다시 선택해 주세요.', 'warning');
      return;
    }
    if (selected.length > availableSlots) {
      notify(`최대 3장까지만 가능해 앞의 ${availableSlots}장만 추가합니다.`, 'warning');
    }

    try {
      const compressed = await Promise.all(selected.slice(0, availableSlots).map(compressImageFile));
      setImages(current => [...current, ...compressed].slice(0, MAX_INPUT_IMAGES));
      resetGeneratedResult();
    } catch (error) {
      console.error(error);
      notify(getActionableErrorMessage(error, '사진을 처리하지 못했습니다. JPG, PNG 또는 WebP 파일로 다시 시도해 주세요.'), 'error');
    }
  };

  const handleAnalyze = async () => {
    if (metadata.analysisType === 'internal' && images.length === 0) {
      notify('공간 전체가 보이는 사진을 한 장 이상 올려 주세요.', 'warning');
      return;
    }
    if (metadata.analysisType === 'external' && !metadata.address) {
      notify('외부 입지 분석을 위해 주소를 입력해 주세요.', 'warning');
      return;
    }
    if (metadata.analysisType === 'external'
      && (!Number.isFinite(metadata.latitude) || !Number.isFinite(metadata.longitude))) {
      notify('주소 검색 결과에서 실제 분석할 위치를 선택해 주세요.', 'warning');
      return;
    }
    if (metadata.analysisType === 'external' && metadata.locationConfirmed !== true) {
      notify('위성 지도에서 핀 위치가 맞는지 확인한 뒤 위치 확인을 완료해 주세요.', 'warning');
      return;
    }
    trackEvent('analysis_started', {
      userId: userRef.current?.id,
      metadata: {
        analysisType: metadata.analysisType,
        roomType: metadata.roomType || null,
        hasImage: Boolean(image),
        hasAddress: Boolean(metadata.address),
        concernLength: metadata.concern?.length || 0,
        isTestMode,
      },
    });
    setShowSuggestions(false); setLoading(true); setGeneratingVisuals(false); setResult(null); setCurrentAnalysisId(null); setToBeImage(null); setRemedyArt(null); setInteriorRemedyArt(null); setInteriorStyleId(null); setZodiacImage(null);
    try {
      const analysis = await analyzeFengShui({
        base64Image: image || undefined,
        base64Images: images,
        address: metadata.address,
      }, metadata);
      setResult(analysis);
      let savedAnalysisId: string | null = null;

      // Keep the free path low-cost. Paid fal.ai visuals are generated only after unlock.
      let newHistory = [{
        analysisId: null as string | null,
        result: analysis,
        image: metadata.analysisType === 'internal' ? (image || '') : 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&q=80&w=400',
        remedyArt: isTestMode ? TEST_SAMPLE_REMEDY_ART_IMAGE : '',
        interiorRemedyArt: null,
        interiorStyleId: null,
        zodiacImage: isTestMode ? TEST_SAMPLE_ZODIAC_IMAGE : null,
        metadata: { ...metadata },
      }, ...history].slice(0, 10);

      // Save to Supabase — use session from SDK (primary) or userRef (fallback)
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const currentUserId = currentSession?.user?.id ?? userRef.current?.id;
      if (currentUserId) {
        const savedData = await saveAnalysis({
          userId: currentUserId,
          analysisType: metadata.analysisType,
          image: null,
          address: metadata.analysisType === 'external' ? (metadata.address || null) : null,
          metadata,
          result: analysis,
          remedyArt: null,
          interiorRemedyArt: null,
          interiorStyleId: null,
          zodiacImage: null,
          toBeImage: null,
        });
        if (savedData) {
          savedAnalysisId = savedData.id;
          setCurrentAnalysisId(savedData.id);
          replaceAnalysisIdInUrl(savedData.id);
          newHistory = newHistory.map((item, index) => (
            index === 0 ? { ...item, analysisId: savedData.id } : item
          ));
        } else {
          notify('분석은 완료됐지만 서버 저장에 실패했습니다. 이 기기의 최근 기록으로 임시 보관합니다.', 'warning', 9000);
        }
      }
      setHistory(newHistory);
      writeLocalHistory(newHistory);
      trackEvent('analysis_completed', {
        userId: currentUserId,
        analysisId: savedAnalysisId,
        metadata: {
          analysisType: metadata.analysisType,
          score: analysis.feng_shui_score,
          saved: Boolean(savedAnalysisId),
          isTestMode,
        },
      });
    } catch (error) {
      console.error(error);
      trackEvent('analysis_failed', {
        userId: userRef.current?.id,
        metadata: {
          analysisType: metadata.analysisType,
          message: error instanceof Error ? error.message : String(error),
          isTestMode,
        },
      });
      notify(getActionableErrorMessage(error, '분석 중 오류가 발생했습니다. 입력 내용을 유지했으니 다시 시도해 주세요.'), 'error', 9000);
    }
    finally { setLoading(false); setGeneratingVisuals(false); }
  };

  const handleRegenerateArt = async (requestedInteriorStyle?: InteriorArtStyleId | null) => {
    if (!result) return;
    if (!currentAnalysisId) {
      notify('로그인 후 서버에 저장된 분석 결과에서만 이미지를 생성할 수 있습니다.', 'warning');
      return;
    }
    setIsRegeneratingArt(true);
    if (!requestedInteriorStyle) setRemedyArt(null);
    trackEvent(requestedInteriorStyle ? 'interior_art_generation_started' : 'remedy_art_regeneration_started', {
      userId: userRef.current?.id,
      analysisId: currentAnalysisId,
      metadata: {
        interiorStyle: requestedInteriorStyle || null,
        targetElement: result.five_elements?.deficient || result.remedy_art?.deficiency || null,
        guardianAnimal: result.zodiac_remedy_object?.animal || null,
      },
    });
    try {
      const newImage = await generateRemedyArtImage(result, metadata, currentAnalysisId, requestedInteriorStyle);
      if (requestedInteriorStyle) {
        setInteriorRemedyArt(newImage);
        setInteriorStyleId(requestedInteriorStyle);
      } else {
        setRemedyArt(newImage);
      }
      if (currentAnalysisId) {
        await updateAnalysisVisuals(currentAnalysisId, requestedInteriorStyle
          ? { interior_remedy_art_url: newImage, interior_style_id: requestedInteriorStyle }
          : { remedy_art_url: newImage });
      }
      trackEvent(requestedInteriorStyle ? 'interior_art_generation_completed' : 'remedy_art_regeneration_completed', {
        userId: userRef.current?.id,
        analysisId: currentAnalysisId,
        metadata: { interiorStyle: requestedInteriorStyle || null },
      });
    }
    catch (error) {
      console.error(error);
      trackEvent(requestedInteriorStyle ? 'interior_art_generation_failed' : 'remedy_art_regeneration_failed', {
        userId: userRef.current?.id,
        analysisId: currentAnalysisId,
        metadata: {
          interiorStyle: requestedInteriorStyle || null,
          message: error instanceof Error ? error.message : String(error),
        },
      });
      notify(getActionableErrorMessage(error, '비방 이미지를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.'), 'error');
    }
    finally { setIsRegeneratingArt(false); }
  };

  const handleGenerateZodiacImage = async () => {
    if (!result?.zodiac_remedy_object) return;
    if (!currentAnalysisId) {
      notify('로그인 후 서버에 저장된 분석 결과에서만 수호 이미지를 생성할 수 있습니다.', 'warning');
      return;
    }
    setIsGeneratingZodiacImage(true); setZodiacImage(null);
    try {
      const newImage = await generateZodiacArtImage(result.zodiac_remedy_object, currentAnalysisId);
      setZodiacImage(newImage);
      if (currentAnalysisId) {
        await updateAnalysisVisuals(currentAnalysisId, { zodiac_image_url: newImage });
      }
    } catch (error) {
      console.error(error);
      notify(getActionableErrorMessage(error, '수호 이미지를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.'), 'error');
    } finally {
      setIsGeneratingZodiacImage(false);
    }
  };

  useEffect(() => {
    if (!user || !result || currentAnalysisId || loading) return;
    let cancelled = false;

    (async () => {
      const savedData = await saveAnalysis({
        userId: user.id,
        analysisType: metadata.analysisType,
        image: null,
        address: metadata.analysisType === 'external' ? (metadata.address || null) : null,
        metadata,
        result,
        remedyArt,
        interiorRemedyArt,
        interiorStyleId,
        zodiacImage,
        toBeImage,
      });
      if (!cancelled && savedData) {
        setCurrentAnalysisId(savedData.id);
        replaceAnalysisIdInUrl(savedData.id);
        setHistory(current => {
          const updated = current.map((item, index) => (
            index === 0 ? { ...item, analysisId: savedData.id } : item
          ));
          writeLocalHistory(updated);
          return updated;
        });
      } else if (!cancelled) {
        notify('로그인 결과를 서버에 저장하지 못했습니다. 현재 기기의 최근 기록은 유지됩니다.', 'warning', 9000);
      }
    })().catch(err => console.error('[Supabase] save after login failed:', err));

    return () => { cancelled = true; };
  }, [user, result, currentAnalysisId, loading]);

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
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(34, 30, 16, 0.3), rgba(34, 30, 16, 0.95)), url("/bg-hanok-cosmos.png")' }}></div>
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
              {canUseTestMode && (
                <>
                  <button onClick={toggleTestMode} className={`text-xs px-3 py-1.5 rounded-full border transition-colors shadow-sm ${isTestMode ? 'bg-primary/20 text-primary border-primary font-bold' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}>
                    {isTestMode ? '🧪 ON' : '🧪 OFF'}
                  </button>
                  {isTestMode && (
                    <button onClick={togglePremiumPreview} className={`text-xs px-3 py-1.5 rounded-full border transition-colors shadow-sm ${isPremiumPreviewUnlocked ? 'bg-green-500/20 text-green-300 border-green-400 font-bold' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}>
                      {isPremiumPreviewUnlocked ? '🔓 유료보기' : '🔒 유료보기'}
                    </button>
                  )}
                </>
              )}
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
            {sharedAnalysisMessage && (
              <div className="rounded-2xl border border-primary/30 bg-[#1a1508]/85 p-6 text-center shadow-2xl">
                <Compass className="mx-auto mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-xl font-black text-white">공간비방서 확인이 필요합니다</h3>
                <p className="mx-auto mb-5 max-w-md text-sm leading-relaxed text-slate-300">{sharedAnalysisMessage}</p>
                {!user && <LoginButton />}
              </div>
            )}

            {/* Input Section — Extracted Component */}
            <AnalysisForm
              metadata={metadata} setMetadata={setMetadata} images={images} loading={loading} history={history}
              addressQuery={addressQuery} setAddressQuery={setAddressQuery}
              addressSuggestions={addressSuggestions} isSearchingAddress={isSearchingAddress}
              showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions}
              onImageUpload={handleImageUpload}
              onRemoveImage={(index) => {
                setImages(current => current.filter((_, imageIndex) => imageIndex !== index));
                resetGeneratedResult();
              }}
              onClearImages={() => {
                setImages([]);
                resetGeneratedResult();
              }}
              onAnalyze={handleAnalyze}
              onLoadHistory={(idx) => {
                const item = history[idx];
                setResult(item.result);
                setImages(item.image ? [item.image] : []);
                setRemedyArt(item.remedyArt);
                setInteriorRemedyArt(item.interiorRemedyArt || null);
                setInteriorStyleId(item.interiorStyleId || null);
                setZodiacImage(item.zodiacImage || null);
                setToBeImage(null);
                setCurrentAnalysisId(item.analysisId || null);
                replaceAnalysisIdInUrl(item.analysisId || null);
                if (item.metadata) setMetadata(item.metadata);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onClearHistory={() => { clearLocalHistory(); setHistory([]); }}
            />

            {/* Results Section — Extracted Component */}
            <ResultView
              result={result} loading={loading} generatingVisuals={generatingVisuals} image={image} toBeImage={toBeImage}
              remedyArt={remedyArt} zodiacImage={zodiacImage}
              interiorRemedyArt={interiorRemedyArt} interiorStyleId={interiorStyleId}
              metadata={metadata} setMetadata={setMetadata}
              isRegeneratingArt={isRegeneratingArt} onRegenerateArt={handleRegenerateArt}
              isGeneratingZodiacImage={isGeneratingZodiacImage} onGenerateZodiacImage={handleGenerateZodiacImage}
              onDownloadImage={downloadImage}
              onOrderFrame={(selection) => {
                setFrameArtworkSelection(selection);
                setOrderType('frame');
                setIsInquiryModalOpen(true);
              }}
              onOrderObject={() => { setOrderType('object'); setIsInquiryModalOpen(true); }}
              currentAnalysisId={currentAnalysisId}
              premiumPreviewUnlocked={isTestMode && isPremiumPreviewUnlocked}
            />
          </div>
        </main>

        {/* Inquiry Modal */}
        {isInquiryModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              ref={inquiryModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="inquiry-modal-title"
              tabIndex={-1}
              className="bg-[#221e10]/95 backdrop-blur-xl border border-white/10 rounded-3xl max-w-lg w-full p-4 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto custom-scrollbar outline-none"
            >
              <div className="mb-3 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-black tracking-wider text-primary">
                {metadata.analysisType === 'internal' ? 'INTERIOR PRODUCT' : 'SITE PRODUCT'} · {selectedPhysicalProduct.sku}
              </div>
              <h3 id="inquiry-modal-title" className="font-bold text-xl sm:text-2xl text-white mb-2">{selectedPhysicalProduct.labelKo} 제작 의뢰</h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                {selectedPhysicalProduct.shortDescriptionKo} 권장 배치: {selectedPhysicalProduct.placementKo}.
              </p>
              {orderType === 'frame' && (
                <div className="mb-5 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-primary">선택 작품</p>
                  <p className="mt-1 text-sm font-black text-white">
                    {frameArtworkSelection.edition === 'interior' && frameArtworkSelection.styleId
                      ? `인테리어 에디션 · ${INTERIOR_ART_STYLE_PACKS[frameArtworkSelection.styleId].labelKo}`
                      : 'PUNGSOO 시그니처'}
                  </p>
                </div>
              )}
              <form onSubmit={handleOrderSubmit} className="space-y-4 mb-6">
                {!isLoggedIn && (<>
                  <div><label htmlFor="inquiry-name" className="block text-xs font-semibold text-slate-300 mb-1">이름</label>
                    <input id="inquiry-name" type="text" required value={orderFormData.name} onChange={(e) => setOrderFormData({ ...orderFormData, name: e.target.value })}
                      className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary" placeholder="의뢰자 성함" /></div>
                  <div><label htmlFor="inquiry-contact" className="block text-xs font-semibold text-slate-300 mb-1">연락처 (이메일 또는 전화번호)</label>
                    <input id="inquiry-contact" type="text" required value={orderFormData.contact} onChange={(e) => setOrderFormData({ ...orderFormData, contact: e.target.value })}
                      className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary" placeholder="회신 받으실 연락처" /></div>
                </>)}
                {orderType === 'object' && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-primary/30 p-4 space-y-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-300"><Box className="w-3.5 h-3.5 text-primary" /> 제작 사이즈 (cm)</p>
                    <div className="flex flex-wrap gap-2">
                      {[{ label: '소형 (5×5×5)', w: 5, h: 5, d: 5 }, { label: '중형 (10×10×10)', w: 10, h: 10, d: 10 }, { label: '대형 (15×15×15)', w: 15, h: 15, d: 15 }].map((preset) => (
                        <button key={preset.label} type="button"
                          aria-pressed={orderFormData.objectSize.width === preset.w && orderFormData.objectSize.height === preset.h && orderFormData.objectSize.depth === preset.d}
                          onClick={() => setOrderFormData({ ...orderFormData, objectSize: { width: preset.w, height: preset.h, depth: preset.d } })}
                          className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${orderFormData.objectSize.width === preset.w && orderFormData.objectSize.height === preset.h && orderFormData.objectSize.depth === preset.d ? 'bg-[#d4af37] text-white border-primary shadow-md' : 'bg-white/5 backdrop-blur-md text-slate-200 border-white/10 hover:border-primary'}`}>
                          {preset.label}
                        </button>))}
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {[{ label: '가로 (W)', key: 'width' as const }, { label: '세로 (D)', key: 'height' as const }, { label: '높이 (H)', key: 'depth' as const }].map(({ label, key }) => (
                        <div key={key}><label htmlFor={`object-size-${key}`} className="block text-[10px] font-semibold text-slate-400 mb-1">{label}</label>
                          <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg px-2 py-1.5 focus-within:border-primary transition-colors">
                            <input id={`object-size-${key}`} type="number" min={1} max={100} value={orderFormData.objectSize[key]}
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
                <div><label htmlFor="inquiry-message" className="block text-xs font-semibold text-slate-300 mb-1">추가 요청사항 (선택사항)</label>
                  <textarea id="inquiry-message" value={orderFormData.message} onChange={(e) => setOrderFormData({ ...orderFormData, message: e.target.value })}
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

                  {ENABLE_PHYSICAL_PRODUCT_IMMEDIATE_PAYMENT && (
                    <>
                      <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">또는 즉시 결제</span>
                        <div className="flex-grow border-t border-white/10"></div>
                      </div>

                      <PaymentButton amount={orderType === 'frame' ? 49000 : 79000}
                        orderName={`[풍수AI] ${selectedPhysicalProduct.labelKo} 제작 의뢰`}
                        orderType={orderType}
                        analysisScope={metadata.analysisType}
                        productSku={selectedPhysicalProduct.sku}
                        onSuccess={() => {
                          localStorage.setItem('temp_order_name', orderCustomerName); localStorage.setItem('temp_order_contact', orderCustomerContact);
                          localStorage.setItem('temp_order_message', orderFormData.message); localStorage.setItem('temp_order_type', orderType);
                          localStorage.setItem('temp_order_analysisScope', metadata.analysisType); localStorage.setItem('temp_order_productSku', selectedPhysicalProduct.sku);
                          localStorage.setItem('temp_order_userId', user?.id || '');
                          if (currentAnalysisId) { localStorage.setItem('temp_order_analysisId', currentAnalysisId); }
                          if (orderType === 'object') { localStorage.setItem('temp_order_objectSize', JSON.stringify(orderFormData.objectSize)); }
                          if (result) {
                            localStorage.setItem('temp_order_analysisData', JSON.stringify({
                              remedyArtKeyword: result.remedy_art?.solution_keyword,
                              deficiency: result.remedy_art?.deficiency,
                              zodiacAnimal: result.zodiac_remedy_object?.animal,
                              artEdition: orderType === 'frame' ? frameArtworkSelection.edition : null,
                              interiorStyleId: orderType === 'frame' ? frameArtworkSelection.styleId : null,
                              artworkUrl: orderType === 'frame' ? frameArtworkSelection.artworkUrl : null,
                            }));
                          }
                        }}
                        onFail={handlePaymentFail}
                        disabled={!isLoggedIn ? (!orderFormData.name || !orderFormData.contact) : false} />
                    </>
                  )}
                </div>
              </form>
              <button onClick={() => setIsInquiryModalOpen(false)} className="w-full py-3 bg-black/30 text-slate-300 font-bold rounded-xl hover:bg-white/10 transition-all">닫기</button>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <footer className="bg-[#221e10]/90 backdrop-blur-xl border-t border-white/10 py-12 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="text-white font-bold mb-2">풍수지리 AI 대가</p>
            <p className="text-slate-400 text-xs mb-4 max-w-sm mx-auto leading-relaxed">본 서비스는 40년 대가의 풍수 이론을 학습한 AI가 제공하는 분석 결과입니다. 엔터테인먼트 및 인테리어 참고용으로 활용하시길 권장하며, 개인의 선택과 결과에 대한 법적 책임은 사용자에게 있습니다.</p>
            <div className="flex items-center justify-center gap-4 mb-4 text-xs">
              <a href="/terms" className="text-slate-400 hover:text-primary transition-colors">이용약관</a>
              <span className="text-slate-600">|</span>
              <a href="/privacy" className="text-slate-400 hover:text-primary transition-colors">개인정보처리방침</a>
              <span className="text-slate-600">|</span>
              <a href="/refund" className="text-slate-400 hover:text-primary transition-colors">환불정책</a>
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
