import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, ShoppingCart, TrendingUp, Users, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

const ADMIN_EMAIL = 'lrinvl1203@gmail.com';

interface Purchase {
    id: number;
    created_at: string;
    order_id: string;
    amount: number;
    order_type: string;
    status: string;
    buyer_name: string;
    contact_info: string;
}

interface Stats {
    totalRevenue: number;
    totalOrders: number;
    todayOrders: number;
    todayRevenue: number;
}

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalOrders: 0, todayOrders: 0, todayRevenue: 0 });
    const [loading, setLoading] = useState(true);

    const isAdmin = user?.email === ADMIN_EMAIL;

    useEffect(() => {
        if (authLoading) return;
        if (!user || !isAdmin) { setLoading(false); return; }

        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('purchases')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) { console.error(error); setLoading(false); return; }

                const all = data || [];
                setPurchases(all);

                const today = new Date().toISOString().split('T')[0];
                const todayItems = all.filter((p: Purchase) => p.created_at?.startsWith(today));

                setStats({
                    totalRevenue: all.reduce((sum: number, p: Purchase) => sum + (p.amount || 0), 0),
                    totalOrders: all.length,
                    todayOrders: todayItems.length,
                    todayRevenue: todayItems.reduce((sum: number, p: Purchase) => sum + (p.amount || 0), 0),
                });
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };

        fetchData();
    }, [user, authLoading, isAdmin]);

    const orderTypeLabel = (type: string) => {
        switch (type) {
            case 'report': return '감명서';
            case 'remedy': return '비방 아트';
            case 'zodiac': return '오브제 설계';
            case 'frame': return '액자 제작';
            case 'object': return '오브제 제작';
            default: return type;
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#0c0a06] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
                <div className="max-w-5xl mx-auto flex items-center gap-3 px-4 py-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-300" />
                    </button>
                    <h1 className="text-lg font-bold text-white tracking-tight">📊 관리자 대시보드</h1>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
                {/* Stats Cards */}
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
                            <span className="text-xs text-slate-400 uppercase">총 주문</span>
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
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center"><Users className="w-4 h-4 text-purple-400" /></div>
                            <span className="text-xs text-slate-400 uppercase">오늘 주문</span>
                        </div>
                        <p className="text-2xl font-black text-white">{stats.todayOrders}<span className="text-sm text-slate-400 ml-1">건</span></p>
                    </div>
                </div>

                {/* Recent Orders Table */}
                <section className="bg-[#1a1508] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5">
                        <h2 className="text-base font-bold text-white">최근 주문 내역</h2>
                    </div>
                    {purchases.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">아직 주문이 없습니다.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5 text-slate-400 text-xs uppercase">
                                        <th className="px-4 py-3 text-left">일시</th>
                                        <th className="px-4 py-3 text-left">고객</th>
                                        <th className="px-4 py-3 text-left">상품</th>
                                        <th className="px-4 py-3 text-right">금액</th>
                                        <th className="px-4 py-3 text-center">상태</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchases.map((p) => (
                                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 text-slate-300 whitespace-nowrap text-xs">
                                                {new Date(p.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-white font-medium text-xs">{p.buyer_name || '비회원'}</p>
                                                <p className="text-slate-500 text-[10px]">{p.contact_info || '-'}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-bold">{orderTypeLabel(p.order_type)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-white font-bold">{(p.amount || 0).toLocaleString()}원</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                                    {p.status === 'COMPLETED' ? '완료' : p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
