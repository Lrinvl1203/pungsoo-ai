
import React, { useState } from 'react';
import { Sparkles, Home, MapPin, Heart, Send, Loader2, Compass, AlertTriangle, CheckCircle2, ShoppingBag, Download, ExternalLink, ImageIcon, Palette, RefreshCw, Flower2 } from 'lucide-react';
import { UserMetadata, AnalysisResult } from './types';
import { analyzeFengShui, generateToBeImage, generateRemedyArtImage } from './services/geminiService';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [toBeImage, setToBeImage] = useState<string | null>(null);
  const [remedyArt, setRemedyArt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingVisuals, setGeneratingVisuals] = useState(false);
  const [isRegeneratingArt, setIsRegeneratingArt] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<{ result: AnalysisResult, image: string, remedyArt: string }[]>([]);

  // Load history from localStorage on mount
  React.useEffect(() => {
    const savedHistory = localStorage.getItem('pungsoo_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const [metadata, setMetadata] = useState<UserMetadata>({
    analysisType: 'internal',
    roomType: '침실',
    address: '',
    birthDate: '',
    gender: 'male',
    concern: '',
    artStyle: 'modern'
  });

  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setToBeImage(null);
        setRemedyArt(null);
        setResult(null);
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

    setLoading(true);
    setResult(null);
    setToBeImage(null);
    setRemedyArt(null);

    try {
      const analysis = await analyzeFengShui({ base64Image: image || undefined, address: metadata.address }, metadata);
      setResult(analysis);

      setGeneratingVisuals(true);

      const promises = [
        generateRemedyArtImage(analysis.remedy_art.image_generation_prompt, metadata.artStyle)
      ];

      if (metadata.analysisType === 'internal' && image) {
        promises.push(generateToBeImage(image, analysis.solution_items));
      }

      const settled = await Promise.allSettled(promises);

      let remedyObj = settled[0];
      let visualObj = metadata.analysisType === 'internal' ? settled[1] : null;

      if (visualObj && visualObj.status === 'fulfilled') setToBeImage(visualObj.value);
      if (remedyObj && remedyObj.status === 'fulfilled') {
        setRemedyArt(remedyObj.value);
        // Save to history
        const newHistory = [{
          result: analysis,
          image: metadata.analysisType === 'internal' ? (image || '') : 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&q=80&w=400',
          remedyArt: remedyObj.value
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

  const downloadForInstagram = () => {
    if (!remedyArt || !result) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Set canvas to 1080x1920 (Instagram Story size)
      canvas.width = 1080;
      canvas.height = 1920;
      if (!ctx) return;

      // Draw background
      ctx.fillStyle = '#fdfbf7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Remedy Art centered (maintain 9:16)
      const artWidth = 900;
      const artHeight = 1600;
      const x = (1080 - artWidth) / 2;
      const y = 100;
      ctx.drawImage(img, x, y, artWidth, artHeight);

      // Add branding overlay
      ctx.fillStyle = 'rgba(74, 68, 59, 0.8)';
      ctx.fillRect(x, y + artHeight - 200, artWidth, 200);

      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 60px serif';
      ctx.textAlign = 'center';
      ctx.fillText('풍수지리 AI 대가', 540, y + artHeight - 110);

      ctx.fillStyle = 'white';
      ctx.font = '40px sans-serif';
      ctx.fillText(`${result.remedy_art.deficiency} 처방 비방`, 540, y + artHeight - 50);

      // Score Badge
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(900, 200, 80, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 50px serif';
      ctx.fillText(`${result.feng_shui_score}점`, 900, 215);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'FengShui_Instagram_Story.png';
      link.click();
    };
    img.src = remedyArt;
  };

  const shareToKakao = () => {
    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init('PLACEHOLDER_KAKAO_KEY'); // Should be replaced by user
      }

      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '내 공간의 풍수 분석 결과',
          description: result ? `${result.analysis_summary} (점수: ${result.feng_shui_score}점)` : 'AI가 분석하는 우리 집 풍수 명당',
          imageUrl: remedyArt || 'https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6',
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
        buttons: [
          {
            title: '나도 분석하기',
            link: {
              mobileWebUrl: window.location.href,
              webUrl: window.location.href,
            },
          },
        ],
      });
    } else {
      alert('카카오 SDK 로딩 중입니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e1da] py-8 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center shadow-lg">
              <Compass className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="serif-font text-4xl font-bold text-[#4a443b] mb-2">풍수지리 AI 대가</h1>
          <p className="text-[#8c8273] text-lg font-light">공간의 기운을 읽고 예술로 치유하는 AI 풍수 처방</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

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
                      onClick={() => { setImage(null); setResult(null); setToBeImage(null); setRemedyArt(null); }}
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
                <div>
                  <label className="block text-xs font-semibold text-[#8c8273] uppercase mb-1">분석할 공간의 주소</label>
                  <input
                    type="text"
                    placeholder="예: 서울시 강남구 테헤란로 123"
                    value={metadata.address || ''}
                    onChange={(e) => setMetadata({ ...metadata, address: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-[#e5e1da] rounded-lg px-3 py-3 outline-none focus:border-[#d4af37] transition-all"
                  />
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
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* 1. Remedy Art Section (PORTRAIT TALISMAN) */}
                <section className="bg-white rounded-2xl overflow-hidden shadow-xl border border-[#d4af37]/30">
                  <div className="gold-gradient p-4 text-[#4a443b] flex justify-between items-center">
                    <h3 className="serif-font font-bold flex items-center gap-2">
                      <Sparkles className="w-5 h-5" /> AI 풍수 처방: 디지털 비방(Remedy Art)
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-1/2 aspect-[9/16] bg-gray-100 rounded-xl overflow-hidden relative shadow-inner">
                        {remedyArt ? (
                          <img src={remedyArt} alt="Remedy Art" className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                            <Loader2 className="w-10 h-10 animate-spin text-[#d4af37] mb-2" />
                            <p className="text-sm text-[#8c8273]">부족한 '{result.remedy_art.deficiency}'의 기운을<br />
                              {metadata.artStyle === 'buddhist' ? '레트로 예술' : metadata.artStyle === 'modern_buddhist' ? '모던 레트로 예술' : '모던 아트'}로 승화시키는 중입니다...</p>
                          </div>
                        )}
                        {remedyArt && (
                          <div className="absolute bottom-4 right-4 flex gap-2">
                            <button
                              onClick={() => downloadImage(remedyArt, 'FengShui_Remedy.png')}
                              className="bg-white/90 p-2 rounded-full shadow-lg text-[#4a443b] hover:bg-white transition-colors"
                              title="이미지 다운로드"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                            <button
                              onClick={downloadForInstagram}
                              className="bg-white/90 p-2 rounded-full shadow-lg text-[#4a443b] hover:bg-white transition-colors"
                              title="인스타그램 스토리용 저장"
                            >
                              <ImageIcon className="w-5 h-5 text-pink-500" />
                            </button>
                            <button
                              onClick={shareToKakao}
                              className="bg-yellow-400 p-2 rounded-full shadow-lg text-black hover:bg-yellow-300 transition-colors"
                              title="카카오톡 공유"
                            >
                              <Send className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center space-y-4">
                        <div className="bg-[#fdfbf7] p-4 rounded-xl border border-[#d4af37]/20">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-[#d4af37] font-bold text-sm uppercase tracking-tighter">처방 키워드</h4>
                          </div>
                          <p className="text-[#4a443b] font-bold text-lg">{result.remedy_art.deficiency}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {result.remedy_art.solution_keyword.split(',').map((kw, i) => (
                              <span key={i} className="text-[10px] bg-white border border-[#e5e1da] px-2 py-1 rounded-md text-[#8c8273]">#{kw.trim()}</span>
                            ))}
                          </div>
                        </div>

                        {/* Style Controls for Regeneration */}
                        <div className="p-4 bg-white rounded-xl border border-[#e5e1da] shadow-sm space-y-3">
                          <h5 className="text-xs font-bold text-[#8c8273] flex items-center gap-1">
                            <Palette className="w-3 h-3" /> 비방 스타일 변경 (옵션 선택)
                          </h5>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => setMetadata({ ...metadata, artStyle: 'modern' })}
                              className={`py-2 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${metadata.artStyle === 'modern' ? 'bg-[#4a443b] text-white ring-2 ring-[#d4af37] ring-offset-1' : 'bg-[#faf9f6] text-[#6b6256] hover:bg-[#e5e1da]'}`}
                            >
                              모던
                            </button>
                            <button
                              onClick={() => setMetadata({ ...metadata, artStyle: 'buddhist' })}
                              className={`py-2 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${metadata.artStyle === 'buddhist' ? 'bg-[#4a443b] text-white ring-2 ring-[#d4af37] ring-offset-1' : 'bg-[#faf9f6] text-[#6b6256] hover:bg-[#e5e1da]'}`}
                            >
                              레트로
                            </button>
                            <button
                              onClick={() => setMetadata({ ...metadata, artStyle: 'modern_buddhist' })}
                              className={`py-2 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${metadata.artStyle === 'modern_buddhist' ? 'bg-[#4a443b] text-white ring-2 ring-[#d4af37] ring-offset-1' : 'bg-[#faf9f6] text-[#6b6256] hover:bg-[#e5e1da]'}`}
                            >
                              모던 + 레트로
                            </button>
                          </div>

                          <button
                            onClick={handleRegenerateArt}
                            disabled={isRegeneratingArt}
                            className="w-full py-3 bg-[#d4af37] text-white text-sm font-bold rounded-lg hover:bg-[#c29d2f] transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            {isRegeneratingArt ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            선택한 스타일로 비방 재생성
                          </button>
                        </div>

                        <div className="bg-[#4a443b] p-5 rounded-xl text-white italic text-sm leading-relaxed shadow-lg">
                          " {result.remedy_art.art_story} "
                        </div>
                        <div className="space-y-2">
                          <button
                            disabled={!remedyArt}
                            onClick={() => setIsInquiryModalOpen(true)}
                            className="w-full py-3 border border-[#d4af37] text-[#d4af37] font-bold rounded-lg hover:bg-[#d4af37]/10 transition-colors flex items-center justify-center gap-2"
                          >
                            <ShoppingBag className="w-4 h-4" /> 실물 액자 제작 문의
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Before/After Space Visualization */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-[#e5e1da]">
                  <div className="bg-[#4a443b] p-4 text-white flex justify-between items-center">
                    <h3 className="serif-font font-bold flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" /> 공간 비보풍수 시각화 (To-Be)
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-0.5 bg-[#e5e1da]">
                    <div className="relative aspect-square">
                      <img src={image!} alt="Before" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded font-bold">BEFORE</div>
                    </div>
                    <div className="relative aspect-square bg-[#faf9f6] flex items-center justify-center">
                      {toBeImage ? (
                        <img src={toBeImage} alt="After" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#d4af37]" />
                          <p className="text-xs text-[#8c8273]">공간 비보 적용 중...</p>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-[#d4af37] text-white text-[10px] px-2 py-0.5 rounded font-bold">AFTER</div>
                    </div>
                  </div>
                </div>

                {/* 3. Detailed Diagnosis & Solutions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="bg-white rounded-2xl p-6 shadow-md border-t-4 border-t-[#d4af37]">
                    <h3 className="serif-font text-xl font-bold text-[#4a443b] mb-4">종합 점수: {result.feng_shui_score}점</h3>
                    <p className="text-sm text-[#8c8273] mb-4">{result.analysis_summary}</p>
                    <div className="space-y-3">
                      {result.diagnosis.map((diag, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border-l-4 ${diag.type.includes('길') ? 'bg-green-50 border-l-green-400' : 'bg-red-50 border-l-red-400'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            {diag.type.includes('길') ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                            <span className="font-bold text-xs text-[#4a443b]">{diag.keyword}</span>
                          </div>
                          <p className="text-[11px] text-[#6b6256]">{diag.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="bg-[#4a443b] rounded-2xl p-6 text-white shadow-md">
                    <h3 className="serif-font text-xl font-bold mb-4 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-[#d4af37]" /> 풍수 인테리어 처방
                    </h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {result.solution_items.map((item, idx) => (
                        <div key={idx} className="bg-white/10 rounded-xl p-3 border border-white/5">
                          <h5 className="font-bold text-[#d4af37] text-sm">{item.item_name}</h5>
                          <p className="text-[10px] text-white/60 mb-2">{item.target_problem}</p>
                          <p className="text-[11px] bg-black/20 p-2 rounded mb-3">{item.placement_guide}</p>
                          <a
                            href={`https://ohou.se/productions/feed?query=${encodeURIComponent(item.product_search_keyword)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#d4af37] hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" /> 추천 상품 보러가기
                          </a>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Overall Advice Footer */}
                <div className="bg-[#f9f295]/20 rounded-2xl p-6 border border-[#f9f295]/50 text-center">
                  <Heart className="w-8 h-8 text-[#d4af37] mx-auto mb-3" />
                  <p className="text-[#4a443b] serif-font text-lg italic leading-relaxed">
                    "{result.overall_advice}"
                  </p>
                </div>

                {/* PRO DETAILED REPORT */}
                {result.detailed_report && (
                  <section className="bg-white rounded-2xl p-8 shadow-md border-t-8 border-[#4a443b] mt-8 mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <Compass className="w-32 h-32" />
                    </div>
                    <h3 className="serif-font text-2xl font-bold text-[#4a443b] mb-6 border-b border-[#e5e1da] pb-4 flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-[#d4af37]" />
                      초정밀 도사 감명서 (Full Documentation)
                    </h3>
                    <div className="prose prose-sm max-w-none text-[#4a443b] leading-[1.8] whitespace-pre-wrap font-medium">
                      {result.detailed_report}
                    </div>
                  </section>
                )}

              </div>
            )}
          </div>
        </div>
      </main>

      {/* Inquiry Modal */}
      {isInquiryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="serif-font text-2xl font-bold text-[#4a443b] mb-2">실물 비방 액자 제작 문의</h3>
            <p className="text-[#8c8273] text-sm mb-6">AI가 처방한 당신만의 디지털 비방을 최고급 린텐 캔버스 액자로 간직하세요. 기운을 가장 잘 보존하는 명당에 걸어두시면 좋습니다.</p>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-2 border-b border-[#e5e1da]">
                <span className="text-[#8c8273] text-sm">액자 사이즈</span>
                <span className="text-[#4a443b] font-bold">A3 (297x420mm)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#e5e1da]">
                <span className="text-[#8c8273] text-sm">제작 비용</span>
                <span className="text-[#4a443b] font-bold">59,000원 (배송비 무료)</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert('현재 준비 중인 서비스입니다. 카카오톡 채널로 문의해주시면 상세히 안내해 드리겠습니다.');
                setIsInquiryModalOpen(false);
              }}
              className="w-full py-4 gold-gradient text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all mb-3"
            >
              카카오톡으로 예약 문의하기
            </button>
            <button
              onClick={() => setIsInquiryModalOpen(false)}
              className="w-full py-4 bg-[#faf9f6] text-[#8c8273] font-bold rounded-xl hover:bg-[#e5e1da] transition-all"
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
