import React, { useState } from 'react';
import { Share2, FileText, CheckCircle2, AlertTriangle, Compass, Sparkles, MapPin, ImageIcon, Loader2, Lock, FileDown } from 'lucide-react';
import { AnalysisResult, UserMetadata } from '../types';
import RemedyCard from './RemedyCard';
import ZodiacCard from './ZodiacCard';
import { useAuth } from '../contexts/AuthContext';
import DigitalPaymentModal from './DigitalPaymentModal';
import LoginPromptModal from './LoginPromptModal';
import { supabase } from '../services/supabaseClient';
import { trackEvent } from '../services/analyticsService';
import { DIGITAL_PRODUCT_TOTAL_KRW, formatKrw } from '../services/pricing';
import { InteriorArtStyleId } from '../utils/remedyArt';

interface ResultViewProps {
    result: AnalysisResult | null;
    loading: boolean;
    generatingVisuals: boolean;
    image: string | null;
    toBeImage: string | null;
    remedyArt: string | null;
    interiorRemedyArt: string | null;
    interiorStyleId: InteriorArtStyleId | null;
    zodiacImage: string | null;
    metadata: UserMetadata;
    setMetadata: React.Dispatch<React.SetStateAction<UserMetadata>>;
    isRegeneratingArt: boolean;
    onRegenerateArt: (interiorStyle?: InteriorArtStyleId | null) => void;
    isGeneratingZodiacImage: boolean;
    onGenerateZodiacImage: () => void;
    onDownloadImage: (dataUrl: string, filename: string) => void;
    onOrderFrame: (selection: {
        edition: 'signature' | 'interior';
        styleId: InteriorArtStyleId | null;
        artworkUrl: string | null;
    }) => void;
    onOrderObject: () => void;
    currentAnalysisId?: string | null;
    premiumPreviewUnlocked?: boolean;
}

interface PremiumReportSection {
    title: string;
    paragraphs: string[];
    seal: string;
}

const REPORT_SEALS = ['序', '壹', '貳', '叄', '肆', '伍', '結'];

function parsePremiumReport(report?: string): PremiumReportSection[] {
    const cleaned = (report || '').trim();
    if (!cleaned) return [];

    if (!/^##\s+/m.test(cleaned)) {
        return [{
            title: '공간비방서 본문',
            paragraphs: cleaned.split(/\n{2,}/).map(part => part.trim()).filter(Boolean),
            seal: '秘',
        }];
    }

    return cleaned
        .split(/^##\s+/m)
        .map(part => part.trim())
        .filter(Boolean)
        .map((part, index) => {
            const [rawTitle, ...bodyLines] = part.split(/\r?\n/);
            const body = bodyLines.join('\n').trim();
            return {
                title: rawTitle.trim(),
                paragraphs: body.split(/\n{2,}/).map(paragraph => paragraph.trim()).filter(Boolean),
                seal: REPORT_SEALS[index] || String(index + 1).padStart(2, '0'),
            };
        });
}

function renderParagraphText(paragraph: string) {
    return paragraph.split(/\r?\n/).map((line, index, lines) => (
        <React.Fragment key={`${line}-${index}`}>
            {line}
            {index < lines.length - 1 && <br />}
        </React.Fragment>
    ));
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    }[char] || char));
}

function premiumReportToHtml(report?: string): string {
    return parsePremiumReport(report).map(section => {
        const paragraphs = section.paragraphs
            .map(paragraph => `<p>${escapeHtml(paragraph).replace(/\r?\n/g, '<br/>')}</p>`)
            .join('');
        return `<section class="report-section">
            <div class="report-section-kicker">${escapeHtml(section.seal)} · CONFIDENTIAL MANUAL</div>
            <h2 class="section-title">${escapeHtml(section.title)}</h2>
            ${paragraphs}
        </section>`;
    }).join('');
}

function PremiumReportBody({ sections, locked = false }: { sections: PremiumReportSection[]; locked?: boolean }) {
    return (
        <div className="space-y-7">
            {sections.map((section, index) => (
                <article key={`${section.title}-${index}`} className="relative border-l-2 border-[#b9892e]/45 pl-4 md:pl-6">
                    <div className="absolute right-0 top-0 text-[56px] leading-none font-black text-[#8f1f1f]/10 select-none">
                        {section.seal}
                    </div>
                    <div className="relative mb-3 flex items-start gap-3">
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center border border-[#8f1f1f]/35 bg-[#8f1f1f]/10 text-[13px] font-black text-[#8f1f1f] shadow-inner">
                            {section.seal}
                        </div>
                        <div>
                            <div className="text-[10px] font-black tracking-[0.24em] text-[#8f1f1f]/75">CONFIDENTIAL MANUAL</div>
                            <h4 className="mt-1 text-[18px] md:text-[21px] font-black leading-snug text-[#2a190b]">
                                {section.title}
                            </h4>
                        </div>
                    </div>
                    <div className={`relative space-y-3 text-[14px] md:text-[15px] leading-[1.95] text-[#3f2b16] ${locked ? 'opacity-80' : ''}`}>
                        {section.paragraphs.map((paragraph, paragraphIndex) => (
                            <p key={`${section.title}-${paragraphIndex}`} className="font-medium">
                                {renderParagraphText(paragraph)}
                            </p>
                        ))}
                    </div>
                </article>
            ))}
        </div>
    );
}

export default function ResultView({
    result,
    loading,
    generatingVisuals,
    image,
    toBeImage,
    remedyArt,
    interiorRemedyArt,
    interiorStyleId,
    zodiacImage,
    metadata,
    setMetadata,
    isRegeneratingArt,
    onRegenerateArt,
    isGeneratingZodiacImage,
    onGenerateZodiacImage,
    onDownloadImage,
    onOrderFrame,
    onOrderObject,
    currentAnalysisId,
    premiumPreviewUnlocked = false,
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
                        trackEvent('payment_modal_opened', {
                            userId: user.id,
                            analysisId: currentAnalysisId,
                            orderType: 'report',
                            amount: DIGITAL_PRODUCT_TOTAL_KRW,
                            metadata: { source: 'post_login_restore' },
                        });
                        setShowPaymentModal(true);
                    }
                } catch { /* ignore */ }
            }
        }
    }, [user, authLoading, currentAnalysisId]);

    // Fetch unlock status from DB. Retry briefly after checkout because webhooks can land a moment later.
    React.useEffect(() => {
        let cancelled = false;
        let attempts = 0;
        let retryTimer: number | null = null;

        const checkUnlockStatus = async () => {
            if (!user || !currentAnalysisId) {
                if (!cancelled) setIsReportUnlocked(false);
                return false;
            }

            const { data } = await supabase
                .from('purchases')
                .select('order_type')
                .eq('user_id', user.id)
                .eq('analysis_id', currentAnalysisId)
                .eq('status', 'COMPLETED')
                .eq('order_type', 'report')
                .limit(1);

            const unlocked = Boolean(data && data.length > 0);
            if (!cancelled) setIsReportUnlocked(unlocked);
            return unlocked;
        };

        const runCheck = async () => {
            const unlocked = await checkUnlockStatus();
            attempts += 1;
            if ((unlocked || attempts >= 6) && retryTimer) {
                window.clearInterval(retryTimer);
                retryTimer = null;
            }
        };

        runCheck();
        retryTimer = window.setInterval(runCheck, 2500);
        window.addEventListener('focus', runCheck);

        return () => {
            cancelled = true;
            if (retryTimer) window.clearInterval(retryTimer);
            window.removeEventListener('focus', runCheck);
        };
    }, [user, currentAnalysisId]);

    const handleUnlockReport = () => {
        if (!user) {
            trackEvent('login_prompt_opened', {
                analysisId: currentAnalysisId,
                orderType: 'report',
                amount: DIGITAL_PRODUCT_TOTAL_KRW,
                metadata: { source: 'premium_report_unlock' },
            });
            // 로그인 후 결제 모달이 자동 복원되도록 intent 저장
            localStorage.setItem('pending_payment_intent', JSON.stringify({ type: 'report' }));
            setShowLoginModal(true);
        } else {
            trackEvent('payment_modal_opened', {
                userId: user.id,
                analysisId: currentAnalysisId,
                orderType: 'report',
                amount: DIGITAL_PRODUCT_TOTAL_KRW,
                metadata: { source: 'premium_report_unlock' },
            });
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

        const reportHTML = premiumReportToHtml(result.detailed_report);

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
  .section-title { font-family:'Noto Serif KR',serif; font-size:20px; font-weight:700; color:var(--ink); letter-spacing:2px; margin:4px 0 14px; }
  h2.section-title { border:none; padding:0; }
  
  /* Report text */
  .report-text { font-size:14px; color:#3D3D3D; line-height:2; text-align:justify; }
  .report-section { border-left:3px solid var(--gold); padding-left:18px; margin:0 0 30px; page-break-inside:avoid; }
  .report-section-kicker { font-size:10px; font-weight:800; color:var(--red); letter-spacing:2px; margin-bottom:4px; }
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
    <div class="report-text">${reportHTML}</div>
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

    const diagnosisItems = result?.diagnosis ?? [];
    const goodDiagnosis = diagnosisItems.find(diag => diag.type.includes('길') || diag.type.includes('Good')) || diagnosisItems[0];
    const badDiagnosis = diagnosisItems.find(diag => diag.type.includes('흉') || diag.type.includes('Bad')) || diagnosisItems[1] || diagnosisItems[0];
    const previewPrescription = result?.solution_items?.[0];
    const fiveElements = result ? ((result as any).five_elements || null) : null;
    const effectiveReportUnlocked = isReportUnlocked || premiumPreviewUnlocked;
    const lockedReportPreview = result ? [
        '## 제1장 좌향과 기맥 판독',
        `${result.analysis_summary}`,
        '',
        '## 제2장 길흉 지점 정밀 해석',
        goodDiagnosis ? `길한 흐름: ${goodDiagnosis.keyword}` : '길한 흐름: 프리미엄 본문에서 공개',
        badDiagnosis ? `막힌 기운: ${badDiagnosis.keyword}` : '막힌 기운: 프리미엄 본문에서 공개',
        '',
        '## 제3장 오행 균형과 비보 처방',
        '상세 오행 수치, 전체 처방, 실행 순서는 결제 후 열람됩니다.'
    ].join('\n') : '';
    const premiumReportSections = parsePremiumReport(result?.detailed_report);
    const lockedReportPreviewSections = parsePremiumReport(lockedReportPreview);

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

                    {/* 1. Free Preview: First Reading Scroll */}
                    <section className="relative overflow-hidden rounded-2xl border border-[#d4af37]/50 bg-[#f2e4c2] text-[#26190b] shadow-2xl stagger-item" style={{ animationDelay: '0.1s' }}>
                        <div
                            className="absolute inset-0 opacity-[0.18] pointer-events-none"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 16px 16px, rgba(116, 75, 30, 0.35) 1px, transparent 0)',
                                backgroundSize: '28px 28px'
                            }}
                        />
                        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full border border-[#8f1f1f]/25 opacity-50 pointer-events-none"></div>
                        <div className="relative p-6 md:p-8">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b border-[#7a5125]/25 pb-6">
                                <div className="flex items-center gap-4">
                                    <img src="/images/masters/cheongpung.jpeg" className="w-14 h-14 rounded-full border-2 border-[#8f1f1f] object-cover shadow-md" alt="청풍" />
                                    <div>
                                        <div className="text-[#8f1f1f] font-black text-[11px] mb-1 tracking-[0.24em]">무료 공개본 · 初見帖</div>
                                        <h3 className="text-2xl md:text-3xl font-black text-[#24160a]">공간 초견첩</h3>
                                        <p className="text-[13px] text-[#6d4b26] mt-1 font-semibold">청풍 도사의 첫 감평과 핵심 징후만 공개됩니다.</p>
                                    </div>
                                </div>
                                <div className="shrink-0 w-28 h-28 rounded-full border-4 border-[#8f1f1f]/70 bg-[#f8edcf]/80 flex flex-col items-center justify-center shadow-inner rotate-[-4deg]">
                                    <span className="text-[11px] font-black text-[#8f1f1f] tracking-widest">風水點</span>
                                    <span className="text-4xl font-black text-[#24160a] leading-none">{result.feng_shui_score}</span>
                                    <span className="text-[12px] font-bold text-[#7a5125]">점</span>
                                </div>
                            </div>

                            <div className="mt-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-stretch">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-[12px] font-black text-[#8f1f1f] tracking-[0.22em] mb-2">한 줄 감평</div>
                                        <p className="text-[17px] leading-relaxed font-bold text-[#2f2111]">{result.analysis_summary}</p>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {goodDiagnosis && (
                                            <div className="bg-[#fff7df]/65 border border-[#2d7f5e]/25 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-2 text-[#1f7a58] font-black text-[14px]">
                                                    <CheckCircle2 className="w-4 h-4" /> 열린 길
                                                </div>
                                                <p className="font-black text-[#24160a] mb-1">{goodDiagnosis.keyword}</p>
                                                <p className="text-[13px] leading-relaxed text-[#5e4121]">{goodDiagnosis.description}</p>
                                            </div>
                                        )}
                                        {badDiagnosis && (
                                            <div className="bg-[#fff7df]/65 border border-[#8f1f1f]/25 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-2 text-[#8f1f1f] font-black text-[14px]">
                                                    <AlertTriangle className="w-4 h-4" /> 막힌 기운
                                                </div>
                                                <p className="font-black text-[#24160a] mb-1">{badDiagnosis.keyword}</p>
                                                <p className="text-[13px] leading-relaxed text-[#5e4121]">{badDiagnosis.description}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-[#24160a] text-[#f8edcf] rounded-xl p-5 border border-[#d4af37]/35 shadow-xl relative overflow-hidden">
                                    <div className="absolute right-3 top-3 opacity-10">
                                        <Compass className="w-20 h-20" />
                                    </div>
                                    <div className="text-[#d4af37] text-[11px] font-black tracking-[0.22em] mb-3">초견 처방 1건</div>
                                    {previewPrescription ? (
                                        <>
                                            <h4 className="text-xl font-black mb-2">{previewPrescription.item_name}</h4>
                                            <p className="text-[13px] text-[#e9d8a8] leading-relaxed mb-4">{previewPrescription.target_problem}</p>
                                            <p className="text-[14px] leading-relaxed border-t border-[#d4af37]/20 pt-4">{previewPrescription.placement_guide}</p>
                                        </>
                                    ) : (
                                        <p className="text-[14px] text-[#e9d8a8] leading-relaxed">초견 처방을 정리하는 중입니다.</p>
                                    )}
                                    <div className="mt-5 pt-4 border-t border-[#d4af37]/20 text-[12px] text-[#d4af37] font-bold">
                                        전체 비방, 오행 균형, 세부 배치법은 프리미엄 비방서에 봉인되어 있습니다.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. Premium Manual (PAYWALL STAGE 1) */}
                    {result.detailed_report && (
                        <section className="relative overflow-hidden rounded-2xl border border-[#d4af37]/45 bg-[#14100a] text-white shadow-2xl mt-10 mb-10 stagger-item" style={{ animationDelay: '0.2s' }}>
                            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#8f1f1f] via-[#d4af37] to-[#2d7f5e]"></div>
                            <div className="absolute right-[-70px] top-[-60px] opacity-10 pointer-events-none">
                                <Compass className="w-72 h-72 text-[#d4af37]" />
                            </div>
                            <div className="relative p-6 md:p-8">
                                <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-8">
                                    <div className="relative border border-[#d4af37]/30 bg-[#21180e] p-6 md:p-7 shadow-inner">
                                        <div className="absolute inset-3 border border-[#d4af37]/15 pointer-events-none"></div>
                                        <div className="relative">
                                            <div className="flex items-center gap-3 mb-8">
                                                <img src="/images/masters/cheongpung.jpeg" className="w-10 h-10 rounded-full border border-[#d4af37] object-cover" alt="청풍" />
                                                <img src="/images/masters/myeongwol.jpeg" className="w-10 h-10 rounded-full border border-[#d4af37] object-cover -ml-5" alt="명월" />
                                                <div className="text-[11px] font-black tracking-[0.22em] text-[#d4af37]">PREMIUM 秘方書</div>
                                            </div>
                                            <div className="text-[#d4af37] text-[12px] font-black tracking-[0.3em] mb-3">청풍명월 합감</div>
                                            <h3 className="text-3xl md:text-4xl font-black leading-tight mb-4">공간비방서</h3>
                                            <p className="text-[14px] leading-relaxed text-[#d9caa0] mb-7">
                                                초견첩의 단편 징후를 넘어 공간의 길흉, 오행 결핍, 실전 비보 배치까지 한 권의 감명서로 엮었습니다.
                                            </p>
                                            <div className="space-y-3 text-[13px]">
                                                {['제1장 좌향과 기맥 판독', '제2장 길흉 지점 정밀 해석', '제3장 오행 결핍과 과잉', '제4장 맞춤 비보 처방', '제5장 실행 순서와 보관용 PDF'].map((chapter) => (
                                                    <div key={chapter} className="flex items-center gap-3 border-b border-[#d4af37]/10 pb-3 text-[#f4e6bd]">
                                                        <FileText className="w-4 h-4 text-[#d4af37] shrink-0" />
                                                        <span className="font-bold">{chapter}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {fiveElements && (
                                                <div className="mt-7 border border-[#d4af37]/20 p-4 bg-black/20">
                                                    <div className="text-[11px] font-black tracking-[0.22em] text-[#d4af37] mb-3">五行 BALANCE</div>
                                                    <div className="grid grid-cols-5 gap-2 text-center">
                                                        {[
                                                            ['火', fiveElements.fire ?? 50, '#dc2626'],
                                                            ['水', fiveElements.water ?? 50, '#2563eb'],
                                                            ['木', fiveElements.wood ?? 50, '#16a34a'],
                                                            ['土', fiveElements.earth ?? 50, '#ca8a04'],
                                                            ['金', fiveElements.metal ?? 50, '#94a3b8']
                                                        ].map(([label, value, color]) => (
                                                            <div key={label as string}>
                                                                <div className="text-[#f4e6bd] font-black mb-1">{label}</div>
                                                                <div className="h-16 bg-white/10 flex items-end">
                                                                    <div className="w-full" style={{ height: `${value}%`, backgroundColor: color as string }}></div>
                                                                </div>
                                                                <div className="text-[10px] text-[#d9caa0] mt-1">{value}%</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="relative min-h-[360px]">
                                        <div
                                            className={`relative overflow-hidden bg-[#f6ebcf] text-[#25180d] border border-[#d4af37]/40 p-5 md:p-8 shadow-xl transition-all duration-700 ${!effectiveReportUnlocked ? 'h-[360px] select-none' : ''}`}
                                            style={{ filter: !effectiveReportUnlocked ? 'blur(6px)' : 'none' }}
                                        >
                                            <div
                                                className="absolute inset-0 opacity-[0.16] pointer-events-none"
                                                style={{
                                                    backgroundImage: 'linear-gradient(rgba(116,75,30,0.16) 1px, transparent 1px)',
                                                    backgroundSize: '100% 31px'
                                                }}
                                            />
                                            <div className="relative">
                                                <div className="mb-5 flex items-center justify-between gap-4 border-b border-[#8f1f1f]/20 pb-4">
                                                    <div>
                                                        <div className="text-[#8f1f1f] text-[11px] font-black tracking-[0.24em] mb-1">
                                                            {effectiveReportUnlocked ? '봉인 해제본' : '본문 미리보기'}
                                                        </div>
                                                        <div className="text-[13px] font-bold text-[#6d4b26]">
                                                            청풍 진단과 명월 처방을 장별로 정리한 보관용 감명서
                                                        </div>
                                                    </div>
                                                    <div className="hidden sm:flex h-12 w-12 items-center justify-center border-2 border-[#8f1f1f]/45 text-[#8f1f1f] font-black rotate-[-6deg]">
                                                        秘
                                                    </div>
                                                </div>
                                                <PremiumReportBody
                                                    sections={effectiveReportUnlocked ? premiumReportSections : lockedReportPreviewSections}
                                                    locked={!effectiveReportUnlocked}
                                                />
                                            </div>
                                            {!effectiveReportUnlocked && (
                                                <div className="absolute bottom-0 left-0 w-full h-[150px] bg-gradient-to-t from-[#14100a] to-transparent z-20"></div>
                                            )}
                                        </div>

                                        {effectiveReportUnlocked && (
                                            <div className="mt-6 flex justify-center">
                                                <button onClick={handlePrintPDF} className="flex items-center gap-2 px-5 py-3 bg-[#d4af37]/10 border border-[#d4af37]/35 text-[#d4af37] font-bold rounded-xl hover:bg-[#d4af37]/20 transition-all text-sm">
                                                    <FileDown className="w-4 h-4" /> 비방서 PDF 저장
                                                </button>
                                            </div>
                                        )}

                                        {!effectiveReportUnlocked && (
                                            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-2 pt-28 z-30 pointer-events-auto">
                                                <div className="bg-[#1d150c]/95 backdrop-blur-xl p-6 rounded-2xl border border-[#d4af37]/55 shadow-2xl w-[92%] max-w-sm text-center">
                                                    <Lock className="w-8 h-8 mx-auto text-[#d4af37] mb-3" />
                                                    <h4 className="text-lg font-black text-white mb-2">공간비방서 봉인 중</h4>
                                                    <p className="text-sm text-[#d9caa0] mb-4 leading-relaxed">한 번 결제로 아래 잠금 영역이 모두 열립니다.</p>
                                                    <div className="mb-5 grid gap-2 text-left">
                                                        {['상세 감명서 전체 본문', '오행 균형표와 원인 해석', '비방 아트·수호 오브제 해설'].map((item) => (
                                                            <div key={item} className="flex items-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/10 px-3 py-2 text-[12px] font-bold text-[#f4e6bd]">
                                                                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#d4af37]" />
                                                                {item}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={handleUnlockReport}
                                                        className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#c29d2f] text-white font-bold rounded-xl hover:shadow-lg transition-all animate-pulse-glow"
                                                    >
                                                        {formatKrw(DIGITAL_PRODUCT_TOTAL_KRW)}으로 즉시 열람하기
                                                    </button>
                                                    <p className="mt-3 text-[11px] font-medium text-[#a8976b]">결제 완료 후 이 분석 페이지와 마이페이지에서 다시 볼 수 있습니다.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 3. Premium Feng Shui Prescription */}
                    {result.solution_items && result.solution_items.length > 0 && (
                        <section className="relative overflow-hidden rounded-2xl border border-[#d4af37]/35 bg-[#0f1c18] text-white shadow-xl stagger-item" style={{ animationDelay: '0.3s' }}>
                            <div className="absolute left-[-80px] bottom-[-80px] opacity-10 pointer-events-none">
                                <MapPin className="w-72 h-72 text-[#2d7f5e]" />
                            </div>
                            <div className="relative p-6 md:p-8">
                                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 border-b border-[#d4af37]/20 pb-5 mb-6">
                                    <div className="flex items-center gap-3">
                                        <img src="/images/masters/myeongwol.jpeg" className="w-11 h-11 rounded-full border-2 border-[#d4af37] object-cover" alt="명월" />
                                        <div>
                                            <div className="text-[#d4af37] font-black text-[11px] tracking-[0.24em] mb-1">제4장 · 秘補處方</div>
                                            <h3 className="font-black text-white text-2xl">명월 도사의 맞춤 비보 처방</h3>
                                        </div>
                                    </div>
                                    <div className="text-[12px] text-[#d9caa0] font-bold">
                                        {effectiveReportUnlocked ? `${result.solution_items.length}개 처방 전체 공개` : '무료판은 첫 처방만 공개'}
                                    </div>
                                </div>

                                <div className="relative">
                                    <div
                                        className={`grid md:grid-cols-2 gap-4 transition-all duration-700 ${!effectiveReportUnlocked ? 'max-h-[260px] overflow-hidden select-none' : ''}`}
                                        style={{ filter: !effectiveReportUnlocked ? 'blur(5px)' : 'none' }}
                                    >
                                        {(effectiveReportUnlocked ? result.solution_items : result.solution_items.slice(0, 1)).map((item, idx) => (
                                            <div key={idx} className="bg-black/25 text-white rounded-xl p-5 border border-white/10 transition-all hover:border-[#d4af37]/45 hover:shadow-md">
                                                <div className="text-[#d4af37] text-[11px] font-black tracking-[0.18em] mb-2">비방 {String(idx + 1).padStart(2, '0')}</div>
                                                <h5 className="font-black text-white text-[17px] mb-2">{item.item_name}</h5>
                                                <p className="text-[14px] text-[#d9caa0] mb-4 leading-relaxed">{item.target_problem}</p>
                                                <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 mb-4">
                                                    <p className="text-[14px] text-slate-200 leading-relaxed flex items-start gap-2.5">
                                                        <MapPin className="w-4 h-4 text-[#d4af37] mt-1 shrink-0" />
                                                        {item.placement_guide}
                                                    </p>
                                                </div>
                                                {effectiveReportUnlocked && (
                                                    <a
                                                        href={`https://ohou.se/productions/feed?query=${encodeURIComponent(item.product_search_keyword)}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-[14px] text-[#d4af37] font-bold hover:text-[#f3d56b] transition-colors"
                                                    >
                                                        <span className="w-4 h-4">↗</span> 추천 상품 보러가기
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {!effectiveReportUnlocked && (
                                        <div className="absolute inset-x-0 bottom-0 flex justify-center pt-24 pb-1 bg-gradient-to-t from-[#0f1c18] via-[#0f1c18]/90 to-transparent">
                                            <div className="bg-[#14100a]/95 backdrop-blur-xl p-5 rounded-2xl border border-[#d4af37]/45 shadow-2xl w-[92%] max-w-md text-center">
                                                <Lock className="w-7 h-7 mx-auto text-[#d4af37] mb-3" />
                                                <h4 className="text-lg font-black text-white mb-2">전체 비보 처방 봉인</h4>
                                                <p className="text-sm text-[#d9caa0] mb-4 leading-relaxed">공간비방서 구매 시 전체 처방과 실행 순서가 함께 열립니다.</p>
                                                <div className="mb-4 grid grid-cols-3 gap-2">
                                                    {['전체 처방', '배치 위치', '추천 키워드'].map((item) => (
                                                        <div key={item} className="rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/10 px-2 py-2 text-[11px] font-black text-[#f4e6bd]">
                                                            {item}
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={handleUnlockReport}
                                                    className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#c29d2f] text-white font-bold rounded-xl hover:shadow-lg transition-all"
                                                >
                                                    같은 {formatKrw(DIGITAL_PRODUCT_TOTAL_KRW)}으로 전체 열람
                                                </button>
                                            </div>
                                        </div>
                                    )}
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
                        interiorRemedyArt={interiorRemedyArt}
                        interiorStyleId={interiorStyleId}
                        metadata={metadata}
                        setMetadata={setMetadata}
                        isRegeneratingArt={isRegeneratingArt}
                        onRegenerateArt={onRegenerateArt}
                        onDownloadImage={onDownloadImage}
                        onOrderFrame={onOrderFrame}
                        currentAnalysisId={currentAnalysisId}
                        premiumPreviewUnlocked={premiumPreviewUnlocked}
                    />

                    {/* 6. Zodiac Remedy Object */}
                    {result.zodiac_remedy_object && (
                        <ZodiacCard
                            zodiacObject={result.zodiac_remedy_object}
                            zodiacImage={zodiacImage}
                            isGeneratingZodiacImage={isGeneratingZodiacImage}
                            onGenerateZodiacImage={onGenerateZodiacImage}
                            onDownloadImage={onDownloadImage}
                            onOrderObject={onOrderObject}
                            currentAnalysisId={currentAnalysisId}
                            premiumPreviewUnlocked={premiumPreviewUnlocked}
                            analysisScope={metadata.analysisType}
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
                        {effectiveReportUnlocked ? (
                            <p className="text-white font-bold text-2xl italic leading-[1.8] max-w-xl mx-auto">
                                "{result.overall_advice}"
                            </p>
                        ) : (
                            <div className="mx-auto max-w-xl rounded-2xl border border-primary/20 bg-black/25 p-6">
                                <Lock className="mx-auto mb-3 h-8 w-8 text-primary" />
                                <p className="text-xl font-black text-white">결(結) 총평 봉인 중</p>
                                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                                    청풍과 명월이 함께 남기는 최종 덕담과 장기 실행 조언은 프리미엄 공간비방서에서 열립니다.
                                </p>
                                <button
                                    onClick={handleUnlockReport}
                                    className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-black text-[#0c0a06] transition-colors hover:bg-yellow-400"
                                >
                                    결론까지 열람하기
                                </button>
                            </div>
                        )}
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
                amount={DIGITAL_PRODUCT_TOTAL_KRW}
                orderName="초정밀 도사 감명서 프리미엄 열람"
                orderType="report"
                analysisId={currentAnalysisId}
                analysisScope={metadata.analysisType}
            />
        </div>
    );
}
