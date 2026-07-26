import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserSettings } from '../hooks/useUserSettings';
import {
    ArrowLeft, User, LogOut, Clock, ShoppingBag,
    Image as ImageIcon, Settings, Trash2, ShieldCheck, Download, RotateCcw
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { supabase } from '../services/supabaseClient';
import { trackEvent } from '../services/analyticsService';

interface HistoryItem {
    result: AnalysisResult;
    image: string;
    remedyArt: string;
    zodiacImage: string | null;
}

export default function MyPage() {
    const navigate = useNavigate();
    const { user, signOut, loading } = useAuth();
    const { settings, updateSettings } = useUserSettings();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'orders' | 'gallery' | 'settings'>('history');
    const [requestingRefundId, setRequestingRefundId] = useState<string | null>(null);

    const fetchPurchases = useCallback(async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('purchases')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data && !error) {
            setPurchases(data);
        }
    }, [user]);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            navigate('/');
            return;
        }

        const savedHistory = localStorage.getItem('pungsoo_history');
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error('Failed to parse history', e);
            }
        }

        fetchPurchases();
    }, [user, loading, navigate, fetchPurchases]);

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (e) {
            console.error(e);
            alert('로그아웃 처리 중 오류가 발생했습니다.');
        }
    };

    const handleDeleteHistoryItem = (index: number) => {
        if (window.confirm('이 분석 기록을 삭제하시겠습니까?')) {
            const newHistory = [...history];
            newHistory.splice(index, 1);
            setHistory(newHistory);
            localStorage.setItem('pungsoo_history', JSON.stringify(newHistory));
        }
    };

    const handleClearHistory = () => {
        if (window.confirm('모든 분석 기록을 삭제하시겠습니까?')) {
            setHistory([]);
            localStorage.removeItem('pungsoo_history');
        }
    };

    const downloadImage = (dataUrl: string, filename: string) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.click();
    };

    if (loading) return <div className="min-h-screen bg-[#0c0a06] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
    if (!user) return null;

    const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || '회원';
    const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    const provider = user?.app_metadata?.provider || '이메일';
    const joinDate = new Date(user?.created_at || '').toLocaleDateString('ko-KR');

    const galleryImages = history.flatMap(h => {
        const images = [];
        if (h.remedyArt) images.push({ url: h.remedyArt, keyword: h.result.remedy_art.solution_keyword });
        if (h.zodiacImage) images.push({ url: h.zodiacImage, keyword: h.result.zodiac_remedy_object?.animal || '12간지 비방' });
        return images;
    });

    const visiblePurchases = purchases.filter((purchase) => purchase.order_type !== 'refund');

    const purchaseStatusLabel = (status: string) => {
        if (status === 'COMPLETED') return '결제완료';
        if (status === 'REQUESTED') return '요청접수';
        if (status === 'REFUNDED') return '환불완료';
        return status;
    };

    const purchaseStatusClass = (status: string) => {
        if (status === 'COMPLETED') return 'bg-primary/10 text-primary border border-primary/20';
        if (status === 'REQUESTED') return 'bg-sky-500/10 text-sky-300 border border-sky-500/20';
        if (status === 'REFUNDED') return 'bg-red-500/10 text-red-300 border border-red-500/20';
        return 'bg-white/10 text-slate-300 border border-white/20';
    };

    const refundRequestFor = (purchase: any) => {
        return purchases.find((item) =>
            item.order_type === 'refund'
            && item.payment_key === `refund_request_${purchase.order_id}`
        );
    };

    const hasRefundRequestFor = (purchase: any) => {
        return refundRequestFor(purchase)?.status === 'REQUESTED';
    };

    const formatTimelineDate = (value?: string | null) => {
        if (!value) return '시간 확인 중';
        return new Date(value).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const refundReasonFrom = (refundRequest: any) => {
        const text = refundRequest?.contact_info || '';
        const marker = '환불 사유:';
        const markerIndex = text.indexOf(marker);
        if (markerIndex < 0) return '';
        return text.slice(markerIndex + marker.length).split('환불 완료 시각:')[0].trim();
    };

    const refundCompletedAtFrom = (refundRequest: any) => {
        const text = refundRequest?.contact_info || '';
        const marker = '환불 완료 시각:';
        const markerIndex = text.indexOf(marker);
        if (markerIndex < 0) return '';
        return text.slice(markerIndex + marker.length).trim().split('\n')[0]?.trim() || '';
    };

    const refundTimelineFor = (purchase: any) => {
        const refundRequest = refundRequestFor(purchase);
        if (!refundRequest && purchase.status !== 'REFUNDED') return [];

        const reason = refundReasonFrom(refundRequest);
        const completionTime = purchase.refunded_at || refundRequest?.refunded_at || refundCompletedAtFrom(refundRequest) || null;
        const timeline: Array<{ title: string; description: string; time?: string | null; done: boolean }> = [
            {
                title: '결제 완료',
                description: '프리미엄 열람권이 활성화되었습니다.',
                time: purchase.created_at,
                done: true,
            },
        ];

        if (refundRequest) {
            timeline.push({
                title: '환불 요청 접수',
                description: reason ? `사유: ${reason}` : '환불 요청이 접수되었습니다.',
                time: refundRequest.created_at,
                done: true,
            });
        }

        if (purchase.status === 'REFUNDED') {
            timeline.push({
                title: '환불 완료',
                description: '운영자 확인 후 Polar에서 환불 처리가 완료되었습니다.',
                time: completionTime,
                done: true,
            });
        } else if (refundRequest) {
            timeline.push({
                title: '운영자 확인 중',
                description: '운영자가 결제사에서 환불을 처리하면 완료로 바뀝니다.',
                time: null,
                done: false,
            });
        }

        return timeline;
    };

    const orderTypeLabel = (orderType: string) => {
        if (orderType === 'report') return '초정밀 도사 감명서 프리미엄 열람';
        if (orderType === 'remedy') return '맞춤형 디지털 비방 아트워크 다운로드';
        if (orderType === 'zodiac') return '12간지 비방 오브제 설계도 열람';
        if (orderType === 'frame') return '디지털 액자 제작 의뢰';
        if (orderType === 'refund') return '환불 요청 접수';
        return '비방 오브제 제작 의뢰';
    };

    const handleRefundRequest = async (purchase: any) => {
        const reason = window.prompt('환불 사유를 입력해 주세요. 관리자 확인 후 처리됩니다.');
        if (reason === null) return;
        if (!reason.trim()) {
            alert('환불 사유를 입력해야 요청할 수 있습니다.');
            return;
        }

        setRequestingRefundId(purchase.order_id);
        try {
            const response = await fetch('/api/send-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderType: 'refund',
                    name: displayName,
                    contact: user.email,
                    message: reason,
                    refundData: {
                        orderId: purchase.order_id,
                        orderType: purchase.order_type,
                        amount: purchase.amount,
                        status: purchase.status,
                        analysisId: purchase.analysis_id,
                    },
                }),
            });

            if (!response.ok) {
                let message = '환불 요청 접수 중 오류가 발생했습니다.';
                try {
                    const data = await response.json();
                    if (data.error) message = data.error;
                } catch {
                    // keep default message
                }
                throw new Error(message);
            }

            alert('환불 요청이 접수되었습니다. 관리자 확인 후 처리됩니다.');
            await fetchPurchases();
            setActiveTab('orders');
            trackEvent('refund_requested', {
                userId: user.id,
                analysisId: purchase.analysis_id,
                orderId: purchase.order_id,
                orderType: purchase.order_type,
                amount: purchase.amount,
                metadata: {
                    reasonLength: reason?.length || 0,
                },
            });
        } catch (error: any) {
            trackEvent('refund_request_failed', {
                userId: user.id,
                analysisId: purchase.analysis_id,
                orderId: purchase.order_id,
                orderType: purchase.order_type,
                amount: purchase.amount,
                metadata: {
                    message: error instanceof Error ? error.message : String(error),
                    reasonLength: reason?.length || 0,
                },
            });
            const mailSubject = encodeURIComponent(`[41Pungsoo 환불 요청] ${purchase.order_id}`);
            const mailBody = encodeURIComponent([
                `주문번호: ${purchase.order_id}`,
                `상품유형: ${purchase.order_type}`,
                `결제금액: ${purchase.amount}`,
                `분석ID: ${purchase.analysis_id || '-'}`,
                `환불 사유: ${reason || ''}`,
            ].join('\n'));
            alert(`${error.message || '환불 요청 접수에 실패했습니다.'}\n메일 작성 화면으로 연결합니다.`);
            window.location.href = `mailto:lrinvl1203@gmail.com?subject=${mailSubject}&body=${mailBody}`;
        } finally {
            setRequestingRefundId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#0c0a06] text-slate-100 font-display selection:bg-primary/30 antialiased overflow-x-hidden">
            {/* Header */}
            <header className="bg-[#1a1508]/80 backdrop-blur-xl border-b border-white/10 py-4 px-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm">메인으로</span>
                    </button>
                    <h1 className="text-xl font-bold text-white tracking-tight">마이페이지</h1>
                    <div className="w-20" /> {/* Spacer for centering */}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Sidebar / Profile Card */}
                    <div className="w-full md:w-72 shrink-0 space-y-6 fade-in-up">
                        <div className="bg-[#1a1508] rounded-3xl p-6 shadow-2xl border border-white/5 text-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                            <div className="w-24 h-24 mx-auto bg-black/40 rounded-full flex items-center justify-center border-2 border-primary/30 mb-5 overflow-hidden shadow-inner relative z-10">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-primary" />
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight relative z-10">{displayName}</h2>
                            <p className="text-sm text-slate-400 mb-5 truncate relative z-10">{user.email}</p>

                            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300 bg-white/5 py-2.5 rounded-xl border border-white/10 mb-6 relative z-10">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                {provider === 'kakao' ? '카카오' : provider === 'google' ? 'Google' : provider} 계정 연동
                            </div>

                            <div className="flex justify-between text-xs text-slate-400 border-t border-white/10 pt-5 mb-5 px-2 relative z-10">
                                <span>가입일</span>
                                <span className="font-bold text-slate-200">{joinDate}</span>
                            </div>

                            <button
                                onClick={handleSignOut}
                                className="w-full py-3 mt-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-red-500/20 relative z-10"
                            >
                                <LogOut className="w-4 h-4" /> 로그아웃
                            </button>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex flex-col bg-[#1a1508] rounded-3xl p-3 shadow-2xl border border-white/5">
                            {[
                                { id: 'history', label: '나의 풍수 분석 기록', icon: Clock },
                                { id: 'orders', label: '의뢰 및 주문 내역', icon: ShoppingBag },
                                { id: 'gallery', label: '나의 비방 컬렉션', icon: ImageIcon },
                                { id: 'settings', label: '설정 및 기본 정보', icon: Settings },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all text-left group ${activeTab === tab.id
                                        ? 'bg-primary text-[#0c0a06] shadow-lg shadow-primary/20'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[#0c0a06]' : 'text-slate-500 group-hover:text-primary'}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Mobile Navigation */}
                        <div className="md:hidden flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                            {[
                                { id: 'history', label: '분석 기록', icon: Clock },
                                { id: 'orders', label: '주문 내역', icon: ShoppingBag },
                                { id: 'gallery', label: '컬렉션', icon: ImageIcon },
                                { id: 'settings', label: '설정', icon: Settings },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-5 py-3 shrink-0 rounded-2xl font-bold text-sm transition-all ${activeTab === tab.id
                                        ? 'bg-primary text-[#0c0a06] shadow-lg shadow-primary/20'
                                        : 'bg-[#1a1508] text-slate-400 border border-white/10'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1">
                        {activeTab === 'history' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">나의 풍수 분석 기록</h3>
                                    {history.length > 0 && (
                                        <button
                                            onClick={handleClearHistory}
                                            className="text-xs font-bold text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" /> 전체 삭제
                                        </button>
                                    )}
                                </div>

                                {history.length === 0 ? (
                                    <div className="bg-[#1a1508]/50 border-2 border-dashed border-white/10 rounded-3xl p-10 md:p-16 text-center">
                                        <Clock className="w-16 h-16 text-white/10 mx-auto mb-6" />
                                        <p className="text-slate-400 font-medium text-lg">아직 분석 기록이 없습니다.</p>
                                        <button
                                            onClick={() => navigate('/analyze')}
                                            className="mt-8 px-8 py-4 bg-primary text-[#0c0a06] text-sm font-bold rounded-2xl hover:bg-yellow-400 transition-all shadow-lg hover:-translate-y-1"
                                        >
                                            풍수 분석 시작하기
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {history.map((item, idx) => (
                                            <div key={idx} className="bg-[#1a1508] rounded-3xl p-5 md:p-6 shadow-xl border border-white/5 flex flex-col sm:flex-row gap-6 group hover:border-primary/30 transition-all hover:shadow-primary/5">
                                                <div className="w-full sm:w-40 aspect-square rounded-2xl overflow-hidden bg-black/50 border border-white/10 shrink-0 relative">
                                                    <img src={item.remedyArt || item.image || '/images/masters/cheongpung.jpeg'} alt="Remedy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-black tracking-widest uppercase shadow-sm">
                                                            {item.result.feng_shui_score}점
                                                        </span>
                                                        <button
                                                            onClick={() => handleDeleteHistoryItem(idx)}
                                                            className="text-slate-600 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <h4 className="font-bold text-white text-lg mb-2 line-clamp-1">{item.result.analysis_summary}</h4>
                                                    <p className="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                                                        {item.result.remedy_art.deficiency} 처방
                                                        {item.result.zodiac_remedy_object && ` / ${item.result.zodiac_remedy_object.animal} 비방`}
                                                    </p>
                                                    <div className="mt-auto">
                                                        <button
                                                            onClick={() => navigate('/analyze', { state: { loadHistoryItem: idx } })}
                                                            className="text-sm font-bold text-primary hover:text-yellow-300 flex items-center gap-1.5 group/btn"
                                                        >
                                                            자세히 보기 <span className="group-hover/btn:translate-x-1 transition-transform">&rarr;</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-8">의뢰 및 주문 내역</h3>
                                {visiblePurchases.length === 0 ? (
                                    <div className="bg-[#1a1508]/50 border-2 border-dashed border-white/10 rounded-3xl p-10 md:p-16 text-center shadow-lg">
                                        <div className="w-20 h-20 bg-black/40 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                                            <ShoppingBag className="w-10 h-10 text-primary opacity-80" />
                                        </div>
                                        <h4 className="font-bold text-white text-xl mb-3">아직 주문 내역이 없습니다</h4>
                                        <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                                            AI가 분석한 맞춤형 비방 아트 액자나<br />
                                            12간지 비방 오브제를 의뢰하여<br />
                                            공간의 기운을 보완해보세요.
                                        </p>
                                        <button
                                            onClick={() => navigate('/analyze')}
                                            className="mt-8 px-8 py-3.5 bg-white/5 border border-primary text-primary text-sm font-bold rounded-2xl hover:bg-primary hover:text-[#0c0a06] transition-all shadow-sm"
                                        >
                                            풍수 분석하러 가기
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {visiblePurchases.map((purchase, idx) => (
                                            <div key={idx} className="bg-[#1a1508] rounded-3xl p-5 md:p-6 shadow-xl border border-white/5 flex flex-col md:flex-row gap-4 items-start md:items-center group hover:border-primary/30 transition-all">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black tracking-widest uppercase shadow-sm ${purchaseStatusClass(purchase.status)}`}>
                                                            {purchaseStatusLabel(purchase.status)}
                                                        </span>
                                                        <span className="text-xs text-slate-400">{new Date(purchase.created_at).toLocaleDateString('ko-KR')}</span>
                                                    </div>
                                                    <h4 className="font-bold text-white text-lg mb-1">
                                                        {orderTypeLabel(purchase.order_type)}
                                                    </h4>
                                                    {purchase.analysis_id && (
                                                        <p className="text-[12px] text-slate-500 flex items-center gap-1.5 mt-2">
                                                            <Clock className="w-3 h-3" /> 연관된 분석 내역 (ID: {purchase.analysis_id})
                                                        </p>
                                                    )}
                                                    {refundTimelineFor(purchase).length > 0 && (
                                                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                                                            <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">환불 처리 흐름</p>
                                                            <div className="space-y-3">
                                                                {refundTimelineFor(purchase).map((step, stepIdx, timeline) => (
                                                                    <div key={`${purchase.order_id}-${step.title}`} className="flex gap-3">
                                                                        <div className="flex flex-col items-center pt-1">
                                                                            <span className={`h-2.5 w-2.5 rounded-full ${step.done ? 'bg-primary shadow-[0_0_12px_rgba(242,185,13,0.45)]' : 'bg-slate-500'}`} />
                                                                            {stepIdx < timeline.length - 1 && <span className="mt-1 h-10 w-px bg-white/10" />}
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                <p className="text-sm font-bold text-white">{step.title}</p>
                                                                                <span className="text-[11px] text-slate-500">{formatTimelineDate(step.time)}</span>
                                                                            </div>
                                                                            <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{step.description}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right flex flex-row md:flex-col justify-between w-full md:w-auto items-center md:items-end mt-2 md:mt-0 pt-4 md:pt-0 border-t border-white/10 md:border-0 gap-3">
                                                    <span className="font-bold text-primary text-xl md:text-2xl">{purchase.amount.toLocaleString()}<span className="text-sm text-slate-400 ml-1">원</span></span>
                                                    <p className="text-[10px] text-slate-500 font-mono mt-1.5 bg-black/30 px-2 py-1 rounded border border-white/5">주문번호: {purchase.order_id.split('_').pop()}</p>
                                                    {purchase.status === 'COMPLETED' && (
                                                        <button
                                                            onClick={() => handleRefundRequest(purchase)}
                                                            disabled={requestingRefundId === purchase.order_id || hasRefundRequestFor(purchase)}
                                                            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                            {hasRefundRequestFor(purchase) ? '요청 접수됨' : requestingRefundId === purchase.order_id ? '요청 중' : '환불 요청'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'gallery' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-8">나의 비방 컬렉션</h3>
                                {galleryImages.length === 0 ? (
                                    <div className="bg-[#1a1508]/50 border-2 border-dashed border-white/10 rounded-3xl p-10 md:p-16 text-center shadow-lg">
                                        <ImageIcon className="w-16 h-16 text-white/10 mx-auto mb-6" />
                                        <p className="text-slate-400 font-medium text-lg">생성된 비방 아트가 없습니다.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                                        {galleryImages.map((img, idx) => (
                                            <div key={idx} className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-[#1a1508]">
                                                <img src={img.url} alt="Remedy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-4 md:p-5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                                    <p className="text-primary text-xs md:text-sm font-bold mb-3 line-clamp-1">{img.keyword}</p>
                                                    <button
                                                        onClick={() => downloadImage(img.url, `FengShui_Collection_${idx}.png`)}
                                                        className="w-full bg-white/10 hover:bg-primary hover:text-[#0c0a06] backdrop-blur-md text-white md:text-xs text-[10px] font-bold py-2 px-3 md:px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/20 hover:border-transparent"
                                                    >
                                                        <Download className="w-3 h-3 md:w-4 md:h-4" /> 기기에 저장
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-8">설정 및 기본 정보</h3>
                                <div className="bg-[#1a1508] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8">

                                    <div>
                                        <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">
                                            기본 출생연도
                                        </label>
                                        <p className="text-sm text-slate-400 mb-4 font-medium">풍수 감정 시 기본으로 입력될 출생연도를 설정합니다.</p>
                                        <input
                                            type="number"
                                            min={1940}
                                            max={2010}
                                            placeholder="예: 1985"
                                            value={settings.birthDate ? settings.birthDate.slice(0, 4) : ''}
                                            onChange={(e) => updateSettings({ birthDate: e.target.value })}
                                            className="w-full max-w-xs bg-black/40 text-white border border-white/10 rounded-xl px-5 py-4 font-medium outline-none focus:border-primary transition-all shadow-inner"
                                        />
                                    </div>

                                    <div className="pt-6 border-t border-white/10">
                                        <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">
                                            기본 성별
                                        </label>
                                        <div className="flex gap-3 max-w-xs mt-4">
                                            <button
                                                type="button"
                                                onClick={() => updateSettings({ gender: 'male' })}
                                                className={`flex-1 py-4 rounded-xl border-2 text-sm font-bold transition-all shadow-sm ${settings.gender === 'male'
                                                    ? 'bg-primary text-[#0c0a06] border-primary shadow-primary/20'
                                                    : 'bg-black/30 text-slate-300 border-white/5 hover:border-white/20'
                                                    }`}
                                            >남성</button>
                                            <button
                                                type="button"
                                                onClick={() => updateSettings({ gender: 'female' })}
                                                className={`flex-1 py-4 rounded-xl border-2 text-sm font-bold transition-all shadow-sm ${settings.gender === 'female'
                                                    ? 'bg-primary text-[#0c0a06] border-primary shadow-primary/20'
                                                    : 'bg-black/30 text-slate-300 border-white/5 hover:border-white/20'
                                                    }`}
                                            >여성</button>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/10">
                                        <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">
                                            비방 디자인 방식
                                        </label>
                                        <p className="text-sm text-slate-400 mb-4 font-medium">
                                            화풍을 미리 고르지 않습니다. 비방서가 오행·공간·고민·수호동물을 해석해 작품군을 자동 선정합니다.
                                        </p>
                                        <div className="rounded-xl border-2 border-primary/40 bg-primary/10 px-5 py-4">
                                            <p className="text-sm font-black text-white">비방서 자동 맞춤</p>
                                            <p className="mt-2 text-xs leading-relaxed text-slate-300">
                                                은호 추상화 · 현대 민화형 · 수묵 여백형 · 기하학적 토템형
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
