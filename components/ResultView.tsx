import React, { useState, useRef } from 'react';
import { Share2, FileText, CheckCircle2, AlertTriangle, Download, Compass, Sparkles, MapPin, ImageIcon, Loader2, Lock, FileDown } from 'lucide-react';
import { AnalysisResult, UserMetadata } from '../types';
import RemedyCard from './RemedyCard';
import ZodiacCard from './ZodiacCard';
import { useAuth } from '../contexts/AuthContext';
import DigitalPaymentModal from './DigitalPaymentModal';
import LoginPromptModal from './LoginPromptModal';
import { supabase } from '../services/supabaseClient';

interface ResultViewProps {
    result: AnalysisResult | null;
    loading: boolean;
    generatingVisuals: boolean;
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
    generatingVisuals,
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

    // Auth and Modals
    const { user, loading: authLoading } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // 로그인 후 복귀 시 결제 모달 자동 오픈
    React.useEffect(() => {
        if (!authLoading && user) {
            const raw = localStorage.getItem('pending_payment_intent');
            if (raw) {
                try {
                    const intent = JSON.parse(raw);
                    if (intent.type === 'report') {
                        localStorage.removeItem('pending_payment_intent');
                        setShowPaymentModal(true);
                    }
                } catch { /* ignore */ }
            }
        }
    }, [user, authLoading]);

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
                    .eq('order_type', 'report');

                if (data && data.length > 0) {
                    setIsReportUnlocked(true);
                }
            }
        };
        checkUnlockStatus();
    }, [user, currentAnalysisId]);

    const handleUnlockReport = () => {
        if (!user) {
            // 로그인 후 결제 모달이 자동 복원되도록 intent 저장
            localStorage.setItem('pending_payment_intent', JSON.stringify({ type: 'report' }));
            setShowLoginModal(true);
        } else {
            setShowPaymentModal(true);
        }
    };

    const handlePrintPDF = () => {
        if (!result) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) { alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.'); return; }

        // Five elements data from result (with fallback)
        const fe = (result as any).five_elements || { fire: 50, water: 50, wood: 50, earth: 50, metal: 50, deficient: '-', excess: '-', advice: '' };

        // Diagnosis cards HTML
        const diagnosisHTML = (result.diagnosis ?? []).map(diag => {
            const isGood = diag.type.includes('길');
            return `<div class="diag-card ${isGood ? 'good' : 'bad'}">
                <div class="diag-header">${isGood ? '✅' : '⚠️'} ${diag.keyword}</div>
                <p>${diag.description}</p>
            </div>`;
        }).join('');

        // Convert markdown-ish report to HTML paragraphs
        const reportHTML = (result.detailed_report || '')
            .replace(/## (.*)/g, '<h2 class="section-title">$1</h2>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br/>');

        const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

        printWindow.document.write(`<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"/>
<title>풍수AI 초정밀 감명서</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Manrope:wght@300;400;600&display=swap" rel="stylesheet"/>
<style>
  :root { --gold:#D4AF37; --gold-dark:#8B7355; --ink:#1A1A1A; --paper:#FDF9EF; --red:#B81D2E; --green:#2D7F5E; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Manrope','Apple SD Gothic Neo',sans-serif; background:var(--paper); color:var(--ink); line-height:1.9; max-width:800px; margin:0 auto; }
  
  /* Header */
  .header { background:linear-gradient(180deg,#1a1508,#2a2010); color:var(--paper); padding:48px 40px; text-align:center; position:relative; border-bottom:0.5px solid rgba(212,175,55,0.3); }
  .header::before { content:''; position:absolute; inset:0 0 auto 0; height:16px; opacity:0.3; background:radial-gradient(circle at 10px 10px,var(--gold) 2px,transparent 0); background-size:24px 24px; }
  .header h1 { font-family:'Noto Serif KR',serif; font-size:36px; font-weight:900; color:var(--gold); letter-spacing:12px; margin:8px 0; }
  .header .subtitle { font-size:12px; color:#a09882; letter-spacing:4px; }
  .score-badge { display:inline-flex; flex-direction:column; align-items:center; background:rgba(212,175,55,0.1); border:2px solid var(--gold); padding:12px 32px; margin-top:16px; }
  .score-badge .number { font-family:'Noto Serif KR',serif; font-size:52px; font-weight:900; color:var(--gold); line-height:1; }
  .score-badge .unit { font-size:16px; color:var(--gold); opacity:0.8; }
  .score-badge .label { font-size:10px; color:#a09882; letter-spacing:3px; margin-top:4px; text-transform:uppercase; }
  
  /* Body */
  .body { padding:48px 40px; }
  
  /* Sections */
  .section { margin-bottom:40px; }
  .section-header { display:flex; align-items:center; gap:12px; padding-bottom:12px; border-bottom:2px solid var(--gold); margin-bottom:20px; position:relative; }
  .section-header::after { content:'❀'; position:absolute; bottom:-10px; left:50%; transform:translateX(-50%); background:var(--paper); padding:0 12px; color:var(--gold); font-size:13px; }
  .section-num { font-family:'Noto Serif KR',serif; font-size:12px; font-weight:700; color:var(--gold); background:rgba(212,175,55,0.1); width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:1.5px solid var(--gold); flex-shrink:0; }
  .section-title { font-family:'Noto Serif KR',serif; font-size:20px; font-weight:700; color:var(--ink); letter-spacing:2px; margin:24px 0 16px; }
  h2.section-title { border:none; padding:0; }
  
  /* Report text */
  .report-text { font-size:14px; color:#3D3D3D; line-height:2; text-align:justify; }
  .report-text p { margin-bottom:14px; text-indent:1em; }
  
  /* Quote block */
  .quote { background:linear-gradient(135deg,rgba(212,175,55,0.05),rgba(139,115,85,0.05)); border-left:4px solid var(--gold); padding:16px 20px; margin:20px 0; }
  .quote .text { font-family:'Noto Serif KR',serif; font-size:16px; font-weight:700; letter-spacing:1px; }
  .quote .meaning { font-size:12px; color:var(--gold-dark); font-style:italic; margin-top:4px; }
  
  /* Diagnosis cards */
  .diag-card { padding:16px; margin-bottom:12px; border-left:4px solid; }
  .diag-card.good { background:rgba(45,127,94,0.04); border-color:var(--green); }
  .diag-card.bad { background:rgba(184,29,46,0.04); border-color:var(--red); }
  .diag-header { font-weight:700; font-size:15px; margin-bottom:6px; }
  .diag-card.good .diag-header { color:var(--green); }
  .diag-card.bad .diag-header { color:var(--red); }
  .diag-card p { font-size:13px; color:#555; line-height:1.7; }
  
  /* Five elements */
  .elements { display:flex; gap:16px; justify-content:center; padding:24px; background:#F1EEE4; margin:24px 0; border:1px solid rgba(139,115,85,0.15); }
  .el-item { text-align:center; flex:1; }
  .el-icon { font-size:24px; margin-bottom:4px; }
  .el-name { font-family:'Noto Serif KR',serif; font-size:12px; font-weight:700; margin-bottom:6px; }
  .el-bar { width:100%; height:5px; background:rgba(0,0,0,0.08); overflow:hidden; }
  .el-fill { height:100%; }
  .el-pct { font-size:10px; color:var(--gold-dark); margin-top:3px; }
  .el-summary { margin-top:16px; padding:12px; background:var(--paper); border:1px solid rgba(212,175,55,0.2); text-align:center; font-size:13px; color:#555; }
  
  /* Footer / Seal */
  .footer { text-align:center; padding:40px; border-top:1px solid rgba(139,115,85,0.2); margin-top:40px; }
  .seal { display:inline-block; width:72px; height:72px; border:3px solid var(--red); transform:rotate(-8deg); position:relative; margin-bottom:12px; opacity:0.8; }
  .seal-inner { position:absolute; inset:3px; border:1.5px solid var(--red); display:flex; align-items:center; justify-content:center; font-family:'Noto Serif KR',serif; font-size:14px; font-weight:900; color:var(--red); writing-mode:vertical-rl; text-orientation:upright; line-height:1.2; letter-spacing:2px; }
  .footer-text { font-size:10px; color:var(--gold-dark); letter-spacing:2px; }
  .footer-date { font-size:11px; color:#999; margin-top:6px; }
  
  @media print {
    body { padding:0; max-width:none; }
    .header { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .section, .diag-card { page-break-inside:avoid; }
    .elements { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .seal { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  }
</style>
</head><body>

<div class="header">
  <div class="subtitle">風水地理 AI 大家 — 天地人 居士</div>
  <h1>풍 수 감 정 서</h1>
  <div class="score-badge">
    <div class="label">종합 풍수 점수</div>
    <div><span class="number">${result.feng_shui_score || 0}</span><span class="unit">점</span></div>
  </div>
</div>

<div class="body">
  <!-- Summary -->
  <div class="section">
    <div class="quote">
      <div class="text">${result.analysis_summary || ''}</div>
      <div class="meaning">— 청풍 도사의 감평</div>
    </div>
  </div>

  <!-- Detailed Report -->
  <div class="section">
    <div class="report-text"><p>${reportHTML}</p></div>
  </div>

  <!-- Diagnosis Cards -->
  <div class="section">
    <div class="section-header">
      <div class="section-num">診</div>
      <h3 style="font-family:'Noto Serif KR',serif;font-size:20px;font-weight:700;letter-spacing:2px;">길흉 진단 요약</h3>
    </div>
    ${diagnosisHTML}
  </div>

  <!-- Five Elements -->
  <div class="section">
    <div class="section-header">
      <div class="section-num">行</div>
      <h3 style="font-family:'Noto Serif KR',serif;font-size:20px;font-weight:700;letter-spacing:2px;">오행(五行) 균형 분석</h3>
    </div>
    <div class="elements">
      <div class="el-item"><div class="el-icon">🔥</div><div class="el-name">火</div><div class="el-bar"><div class="el-fill" style="width:${fe.fire}%;background:#DC2626;"></div></div><div class="el-pct">${fe.fire}%</div></div>
      <div class="el-item"><div class="el-icon">💧</div><div class="el-name">水</div><div class="el-bar"><div class="el-fill" style="width:${fe.water}%;background:#2563EB;"></div></div><div class="el-pct">${fe.water}%</div></div>
      <div class="el-item"><div class="el-icon">🌿</div><div class="el-name">木</div><div class="el-bar"><div class="el-fill" style="width:${fe.wood}%;background:#16A34A;"></div></div><div class="el-pct">${fe.wood}%</div></div>
      <div class="el-item"><div class="el-icon">⛰️</div><div class="el-name">土</div><div class="el-bar"><div class="el-fill" style="width:${fe.earth}%;background:#CA8A04;"></div></div><div class="el-pct">${fe.earth}%</div></div>
      <div class="el-item"><div class="el-icon">🪙</div><div class="el-name">金</div><div class="el-bar"><div class="el-fill" style="width:${fe.metal}%;background:#6B7280;"></div></div><div class="el-pct">${fe.metal}%</div></div>
    </div>
    ${fe.advice ? `<div class="el-summary">부족: <strong>${fe.deficient}</strong> · 과잉: <strong>${fe.excess}</strong><br/>${fe.advice}</div>` : ''}
  </div>

  <!-- Overall Advice -->
  <div class="section" style="margin-top:32px;">
    <div class="quote" style="text-align:center;">
      <div class="text" style="font-size:15px;">${result.overall_advice || ''}</div>
      <div class="meaning">— 청풍 · 명월 두 대가의 총평</div>
    </div>
  </div>
</div>

<!-- Footer with Seal -->
<div class="footer">
  <div class="seal"><div class="seal-inner">天地人居士</div></div>
  <div class="footer-text">풍수지리 AI 대가 — 천지인 거사 감정</div>
  <div class="footer-date">${today} 발행</div>
  <div style="margin-top:16px;font-size:9px;color:#bbb;">© 풍수AI · 본 문서는 AI 분석 결과이며, 전문가의 현장 감정을 대체하지 않습니다.</div>
</div>

</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 800);
    };


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
                            {(result.diagnosis ?? []).map((diag, idx) => (
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
                                <div
                                    className={`prose prose-sm max-w-none text-white/95 leading-[1.9] whitespace-pre-wrap font-medium relative z-10 text-[15px] transition-all duration-700 ${!isReportUnlocked ? 'h-[160px] overflow-hidden select-none' : ''}`}
                                    style={{ filter: !isReportUnlocked ? 'blur(6px)' : 'none' }}
                                >
                                    {result.detailed_report}

                                    {!isReportUnlocked && (
                                        <div className="absolute bottom-0 left-0 w-full h-[120px] bg-gradient-to-t from-[#4a443b] to-transparent z-20"></div>
                                    )}
                                </div>

                                {/* Unlock Overlay */}
                                {isReportUnlocked && (
                                    <div className="mt-6 flex justify-center">
                                        <button onClick={handlePrintPDF} className="flex items-center gap-2 px-5 py-3 bg-primary/10 border border-primary/30 text-primary font-bold rounded-xl hover:bg-primary/20 transition-all text-sm">
                                            <FileDown className="w-4 h-4" /> 감명서 PDF 저장
                                        </button>
                                    </div>
                                )}

                                {!isReportUnlocked && (
                                    <div className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-end pb-2 pt-24 z-30 pointer-events-auto">
                                        <div className="bg-[#221e10]/90 backdrop-blur-xl p-6 rounded-2xl border border-primary/50 shadow-2xl w-[90%] max-w-sm text-center transform translate-y-8">
                                            <Lock className="w-8 h-8 mx-auto text-primary mb-3" />
                                            <h4 className="text-lg font-bold text-white mb-2">프리미엄 진단 내용 잠김</h4>
                                            <p className="text-sm text-slate-300 mb-5">청풍 도사의 구체적인 공간 진단과 운기 상승 비결을 온전히 확인하고 싶다면 잠금을 해제하세요.</p>
                                            <button
                                                onClick={handleUnlockReport}
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

                    {/* 4. To-Be Visualization — only show when generating or image is available */}
                    {metadata.analysisType === 'internal' && image && (toBeImage !== null || generatingVisuals) && (
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
                        currentAnalysisId={currentAnalysisId}
                    />

                    {/* 6. Zodiac Remedy Object */}
                    {result.zodiac_remedy_object && (
                        <ZodiacCard
                            zodiacObject={result.zodiac_remedy_object}
                            zodiacImage={zodiacImage}
                            onDownloadImage={onDownloadImage}
                            onOrderObject={onOrderObject}
                            currentAnalysisId={currentAnalysisId}
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

            {/* Modals for Premium Report */}
            <LoginPromptModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
            <DigitalPaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                amount={3000}
                orderName="초정밀 도사 감명서 프리미엄 열람"
                orderType="report"
            />
        </div>
    );
}
