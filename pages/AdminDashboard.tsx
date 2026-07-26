import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowLeft,
    BarChart3,
    CheckCircle2,
    Clipboard,
    DollarSign,
    ExternalLink,
    Loader2,
    RefreshCw,
    ShieldAlert,
    ShoppingCart,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoginButton from '../components/LoginButton';

const ADMIN_EMAIL = 'lrinvl1203@gmail.com';
const POLAR_SALES_URL = 'https://polar.sh/dashboard/mumulab/sales';

interface Purchase {
    id: number | string;
    created_at: string;
    order_id: string;
    payment_key?: string | null;
    amount: number;
    order_type: string;
    status: string;
    buyer_name: string | null;
    contact_info: string | null;
    analysis_id?: string | null;
    analysis_scope?: 'internal' | 'external' | null;
    product_sku?: string | null;
}

interface AnalyticsEvent {
    id: string;
    created_at: string;
    event_name: string;
    user_id?: string | null;
    session_id?: string | null;
    analysis_id?: string | null;
    order_id?: string | null;
    order_type?: string | null;
    amount?: number | null;
    path?: string | null;
    metadata?: Record<string, unknown> | null;
}

interface Stats {
    totalRevenue: number;
    totalOrders: number;
    todayOrders: number;
    todayRevenue: number;
}

const orderTypeLabel = (type: string) => {
    switch (type) {
        case 'report': return '공간비방서';
        case 'remedy': return '비방 아트';
        case 'zodiac': return '12간지 설계';
        case 'frame': return '액자 제작';
        case 'object': return '오브제 제작';
        case 'refund': return '환불 요청';
        default: return type;
    }
};

const statusClass = (status: string) => {
    if (status === 'COMPLETED') return 'bg-green-500/10 text-green-300 border-green-500/20';
    if (status === 'REQUESTED') return 'bg-red-500/10 text-red-300 border-red-500/20';
    if (status === 'REFUNDED') return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
    return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20';
};

const statusLabel = (status: string) => {
    if (status === 'COMPLETED') return '결제완료';
    if (status === 'REQUESTED') return '요청접수';
    if (status === 'REFUNDED') return '환불완료';
    return status;
};

const eventLabel = (eventName: string) => {
    switch (eventName) {
        case 'landing_cta_click': return '랜딩 CTA 클릭';
        case 'analysis_started': return '분석 시작';
        case 'analysis_completed': return '분석 완료';
        case 'analysis_failed': return '분석 실패';
        case 'login_prompt_opened': return '로그인 유도';
        case 'payment_modal_opened': return '결제 모달 열림';
        case 'payment_modal_viewed': return '결제 모달 노출';
        case 'payment_checkout_started': return '체크아웃 시작';
        case 'payment_request_failed': return '결제 요청 실패';
        case 'payment_completed': return '결제 완료';
        case 'payment_failed': return '결제 실패';
        case 'refund_requested': return '환불 요청';
        case 'refund_request_failed': return '환불 요청 실패';
        default: return eventName;
    }
};

const originalOrderIdFromRefund = (purchase: Purchase) => {
    if (purchase.payment_key?.startsWith('refund_request_')) {
        return purchase.payment_key.replace('refund_request_', '');
    }
    if (purchase.order_id?.startsWith('refund_')) {
        return purchase.order_id.replace('refund_', '');
    }
    return purchase.order_id;
};

const splitContactAndReason = (contactInfo?: string | null) => {
    const raw = contactInfo || '';
    const [contact, reason] = raw.split('\n\n환불 사유:\n');
    return {
        contact: contact || '-',
        reason: reason || '사유 미입력',
    };
};

export default function AdminDashboard() {
    const { user, session, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const isAdmin = user?.email === ADMIN_EMAIL;

    const fetchData = async () => {
        if (!user || !isAdmin || !session?.access_token) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/send-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ action: 'admin-list-purchases' }),
            });

            if (!response.ok) {
                console.error(await response.text());
                return;
            }

            const data = await response.json();
            setPurchases((data.purchases || []) as Purchase[]);
            setAnalytics((data.analytics || []) as AnalyticsEvent[]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        fetchData();
    }, [user, session?.access_token, authLoading, isAdmin]);

    const refundRequests = useMemo(() => {
        return purchases.filter((purchase) => purchase.order_type === 'refund' && purchase.status === 'REQUESTED');
    }, [purchases]);

    const paidOrders = useMemo(() => {
        return purchases.filter((purchase) => purchase.order_type !== 'refund' && purchase.status === 'COMPLETED');
    }, [purchases]);

    const recentOrders = useMemo(() => {
        return purchases.filter((purchase) => purchase.order_type !== 'refund');
    }, [purchases]);

    const stats: Stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayItems = paidOrders.filter((purchase) => purchase.created_at?.startsWith(today));

        return {
            totalRevenue: paidOrders.reduce((sum, purchase) => sum + (purchase.amount || 0), 0),
            totalOrders: paidOrders.length,
            todayOrders: todayItems.length,
            todayRevenue: todayItems.reduce((sum, purchase) => sum + (purchase.amount || 0), 0),
        };
    }, [paidOrders]);

    const funnel = useMemo(() => {
        const count = (eventName: string) => analytics.filter((event) => event.event_name === eventName).length;
        const analysisCompleted = count('analysis_completed');
        const checkoutStarted = count('payment_checkout_started');

        return [
            { label: '랜딩 CTA 클릭', eventName: 'landing_cta_click', count: count('landing_cta_click'), rate: null },
            { label: '분석 시작', eventName: 'analysis_started', count: count('analysis_started'), rate: null },
            { label: '분석 완료', eventName: 'analysis_completed', count: analysisCompleted, rate: null },
            {
                label: '결제창 열림',
                eventName: 'payment_modal_opened',
                count: count('payment_modal_opened'),
                rate: analysisCompleted ? Math.round((count('payment_modal_opened') / analysisCompleted) * 100) : 0,
            },
            {
                label: '체크아웃 시작',
                eventName: 'payment_checkout_started',
                count: checkoutStarted,
                rate: analysisCompleted ? Math.round((checkoutStarted / analysisCompleted) * 100) : 0,
            },
            {
                label: '결제 완료',
                eventName: 'payment_completed',
                count: count('payment_completed'),
                rate: checkoutStarted ? Math.round((count('payment_completed') / checkoutStarted) * 100) : 0,
            },
            { label: '환불 요청', eventName: 'refund_requested', count: count('refund_requested'), rate: null },
        ];
    }, [analytics]);

    const copyText = async (text: string) => {
        await navigator.clipboard.writeText(text);
        alert('복사되었습니다.');
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#0c0a06] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#0c0a06] flex items-center justify-center p-4">
                <div className="bg-[#1a1508] border border-primary/30 rounded-2xl p-8 text-center max-w-sm">
                    <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">관리자 로그인 필요</h2>
                    <p className="text-slate-400 text-sm mb-6">관리자 대시보드는 로그인 후 확인할 수 있습니다.</p>
                    <div className="flex justify-center">
                        <LoginButton />
                    </div>
                    <button onClick={() => navigate('/')} className="mt-5 px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors font-bold">
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#0c0a06] flex items-center justify-center p-4">
                <div className="bg-[#1a1508] border border-red-500/30 rounded-2xl p-8 text-center max-w-sm">
                    <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">접근 제한</h2>
                    <p className="text-slate-400 text-sm mb-6">관리자 권한이 필요합니다.</p>
                    <button onClick={() => navigate('/')} className="px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors font-bold">
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0c0a06] text-slate-100 font-display">
            <header className="sticky top-0 z-40 bg-[#0c0a06]/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 py-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-300" />
                        </button>
                        <h1 className="text-lg font-bold text-white tracking-tight">관리자 대시보드</h1>
                    </div>
                    <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10">
                        <RefreshCw className="h-4 w-4" /> 새로고침
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#1a1508] border border-white/5 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center"><DollarSign className="w-4 h-4 text-green-400" /></div>
                            <span className="text-xs text-slate-400 uppercase">총 매출</span>
                        </div>
                        <p className="text-2xl font-black text-white">{stats.totalRevenue.toLocaleString()}<span className="text-sm text-slate-400 ml-1">원</span></p>
                    </div>
                    <div className="bg-[#1a1508] border border-white/5 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><ShoppingCart className="w-4 h-4 text-blue-400" /></div>
                            <span className="text-xs text-slate-400 uppercase">결제 건수</span>
                        </div>
                        <p className="text-2xl font-black text-white">{stats.totalOrders}<span className="text-sm text-slate-400 ml-1">건</span></p>
                    </div>
                    <div className="bg-[#1a1508] border border-white/5 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-primary" /></div>
                            <span className="text-xs text-slate-400 uppercase">오늘 매출</span>
                        </div>
                        <p className="text-2xl font-black text-white">{stats.todayRevenue.toLocaleString()}<span className="text-sm text-slate-400 ml-1">원</span></p>
                    </div>
                    <div className="bg-[#1a1508] border border-white/5 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-red-300" /></div>
                            <span className="text-xs text-slate-400 uppercase">환불 요청</span>
                        </div>
                        <p className="text-2xl font-black text-white">{refundRequests.length}<span className="text-sm text-slate-400 ml-1">건</span></p>
                    </div>
                </div>

                <section className="bg-[#1a1508] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-primary" /> 전환 퍼널
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">최근 이벤트 500건 기준입니다. 분석 완료 대비 결제 진입률을 먼저 보세요.</p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
                            이벤트 {analytics.length}건
                        </span>
                    </div>
                    {analytics.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            아직 수집된 이벤트가 없습니다. `analytics_events` 테이블 적용 후 사용자 행동이 들어오면 표시됩니다.
                        </div>
                    ) : (
                        <div className="grid gap-3 p-4 md:grid-cols-7">
                            {funnel.map((step) => (
                                <div key={step.eventName} className="rounded-xl border border-white/5 bg-black/20 p-4">
                                    <p className="mb-2 text-[11px] font-black text-slate-400">{step.label}</p>
                                    <p className="text-2xl font-black text-white">{step.count}<span className="ml-1 text-xs text-slate-500">건</span></p>
                                    {step.rate !== null && (
                                        <p className="mt-2 text-xs font-bold text-primary">{step.rate}%</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="bg-[#1a1508] border border-red-500/20 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-300" /> 환불 요청
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">요청을 확인한 뒤 Polar 관리자에서 실제 환불을 실행하세요.</p>
                        </div>
                        <a href={POLAR_SALES_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/20">
                            Polar 주문 열기 <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </div>

                    {refundRequests.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">접수된 환불 요청이 없습니다.</div>
                    ) : (
                        <div className="grid gap-4 p-4">
                            {refundRequests.map((request) => {
                                const originalOrderId = originalOrderIdFromRefund(request);
                                const parsed = splitContactAndReason(request.contact_info);

                                return (
                                    <div key={request.id} className="rounded-xl border border-red-500/20 bg-black/20 p-4">
                                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-xs font-bold text-red-200">환불 요청</span>
                                                    <span className="text-xs text-slate-400">{new Date(request.created_at).toLocaleString('ko-KR')}</span>
                                                </div>
                                                <h3 className="text-lg font-black text-white">원주문: {originalOrderId}</h3>
                                                <p className="text-sm text-slate-300">고객: {request.buyer_name || '-'} / {parsed.contact}</p>
                                                <p className="text-sm text-slate-300">금액: {(request.amount || 0).toLocaleString()}원 / 분석ID: {request.analysis_id || '-'}</p>
                                                <div className="rounded-lg bg-black/30 border border-white/5 p-3">
                                                    <p className="text-[11px] font-bold text-slate-500 mb-1">환불 사유</p>
                                                    <p className="text-sm text-slate-200 whitespace-pre-wrap">{parsed.reason}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                                                <button onClick={() => copyText(originalOrderId)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10">
                                                    <Clipboard className="h-3.5 w-3.5" /> 주문번호 복사
                                                </button>
                                                <a href={POLAR_SALES_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-[#0c0a06] hover:bg-yellow-400">
                                                    Polar에서 환불 <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            </div>
                                        </div>
                                        <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.03] p-3 text-xs leading-relaxed text-slate-400">
                                            처리 순서: Polar 주문 페이지에서 원주문을 찾기 → 주문 상세의 <strong className="text-slate-200">Refund Order</strong> 실행 → 환불 완료 웹훅이 들어오면 원 결제는 <strong className="text-slate-200">REFUNDED</strong>로 바뀌고 사용자 콘텐츠가 다시 잠깁니다.
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className="bg-[#1a1508] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5">
                        <h2 className="text-base font-bold text-white">최근 결제 내역</h2>
                    </div>
                    {recentOrders.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">아직 결제 내역이 없습니다.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5 text-slate-400 text-xs uppercase">
                                        <th className="px-4 py-3 text-left">일시</th>
                                        <th className="px-4 py-3 text-left">고객</th>
                                        <th className="px-4 py-3 text-left">상품</th>
                                        <th className="px-4 py-3 text-left">주문번호</th>
                                        <th className="px-4 py-3 text-right">금액</th>
                                        <th className="px-4 py-3 text-center">상태</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map((purchase) => (
                                        <tr key={purchase.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 text-slate-300 whitespace-nowrap text-xs">
                                                {new Date(purchase.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-white font-medium text-xs">{purchase.buyer_name || '고객'}</p>
                                                <p className="text-slate-500 text-[10px] truncate max-w-[220px]">{purchase.contact_info || '-'}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-bold">{orderTypeLabel(purchase.order_type)}</span>
                                                {purchase.product_sku && <p className="mt-1 font-mono text-[9px] text-slate-500">{purchase.product_sku}</p>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button onClick={() => copyText(purchase.order_id)} className="font-mono text-[10px] text-slate-400 hover:text-primary">
                                                    {purchase.order_id.split('_').pop()}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right text-white font-bold">{(purchase.amount || 0).toLocaleString()}원</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusClass(purchase.status)}`}>
                                                    {statusLabel(purchase.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="bg-[#1a1508] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5">
                        <h2 className="text-base font-bold text-white">최근 이벤트</h2>
                    </div>
                    {analytics.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">이벤트 로그가 없습니다.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5 text-slate-400 text-xs uppercase">
                                        <th className="px-4 py-3 text-left">일시</th>
                                        <th className="px-4 py-3 text-left">이벤트</th>
                                        <th className="px-4 py-3 text-left">상품/금액</th>
                                        <th className="px-4 py-3 text-left">분석ID</th>
                                        <th className="px-4 py-3 text-left">경로</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.slice(0, 30).map((event) => (
                                        <tr key={event.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 text-slate-300 whitespace-nowrap text-xs">
                                                {new Date(event.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">{eventLabel(event.event_name)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-300">
                                                {event.order_type ? orderTypeLabel(event.order_type) : '-'}
                                                {event.amount ? ` / ${event.amount.toLocaleString()}원` : ''}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{event.analysis_id || '-'}</td>
                                            <td className="px-4 py-3 text-[11px] text-slate-500 max-w-[260px] truncate">{event.path || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-white/5 bg-[#1a1508] p-5">
                    <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-white">
                        <CheckCircle2 className="h-4 w-4 text-primary" /> 운영 처리 메모
                    </h2>
                    <div className="grid gap-3 text-sm leading-relaxed text-slate-300 md:grid-cols-2 lg:grid-cols-4">
                        <p className="rounded-xl bg-black/20 p-4">
                            <strong className="block text-white mb-1">1. 고객 여정</strong>
                            랜딩 → 로그인 → 무료 분석 → 프리미엄 잠금 → Polar 결제 → 성공 화면 → 마이페이지 순서로 봅니다.
                        </p>
                        <p className="rounded-xl bg-black/20 p-4">
                            <strong className="block text-white mb-1">2. 환불 접수</strong>
                            고객이 마이페이지에서 사유를 남기면 환불 요청 행이 REQUESTED로 생성되고 이 화면에 뜹니다.
                        </p>
                        <p className="rounded-xl bg-black/20 p-4">
                            <strong className="block text-white mb-1">3. 실제 환불</strong>
                            원주문 번호를 복사해 Polar Sales에서 주문을 찾고 Refund Order를 실행합니다.
                        </p>
                        <p className="rounded-xl bg-black/20 p-4">
                            <strong className="block text-white mb-1">4. 완료 검수</strong>
                            order.refunded 웹훅 후 원주문과 환불 요청이 REFUNDED로 바뀌고, 고객 타임라인이 완료로 표시되는지 확인합니다.
                        </p>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                        관리자 접근은 {ADMIN_EMAIL} 계정만 허용됩니다. 접근 오류가 나면 먼저 같은 Google 계정으로 로그인했는지 확인하세요.
                    </p>
                </section>
            </main>
        </div>
    );
}
