import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    Clipboard,
    Clock3,
    ExternalLink,
    Loader2,
    RefreshCw,
    ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

type ClaimStatus = 'checking' | 'confirmed' | 'pending' | 'error';

const ORDER_TYPE_LABEL: Record<string, string> = {
    report: '프리미엄 공간비방서',
    remedy: '맞춤형 디지털 비방 아트워크',
    zodiac: '12간지 비방 오브제 설계도',
    frame: '디지털 액자 제작 의뢰',
    object: '비방 오브제 제작 의뢰',
};

const readStoredValue = (key: string) => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(key) || '';
};

export default function LatpeedClaim() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, loading, signInWithKakao, signInWithGoogle } = useAuth();
    const [status, setStatus] = useState<ClaimStatus>('checking');
    const [message, setMessage] = useState('');
    const [isCopying, setIsCopying] = useState(false);

    const claim = useMemo(() => {
        const orderId = searchParams.get('orderId') || readStoredValue('temp_order_id');
        const orderType = searchParams.get('orderType') || readStoredValue('temp_order_type') || 'report';
        const analysisId = searchParams.get('analysisId') || readStoredValue('temp_order_analysisId');
        const amount = searchParams.get('amount') || readStoredValue('temp_order_amount') || '9900';

        return {
            orderId,
            orderType,
            analysisId,
            amount: Number(amount || 0),
        };
    }, [searchParams]);

    const resultPath = claim.analysisId ? `/analyze?id=${encodeURIComponent(claim.analysisId)}` : '/analyze';
    const productLabel = ORDER_TYPE_LABEL[claim.orderType] || ORDER_TYPE_LABEL.report;
    const userEmail = user?.email || '';

    const referenceText = [
        userEmail ? `앱 가입 이메일: ${userEmail}` : '앱 가입 이메일: 로그인 후 자동 표시',
        claim.analysisId ? `분석ID: ${claim.analysisId}` : '분석ID: 분석 결과 페이지 주소 또는 분석ID 필요',
        claim.orderId ? `앱 주문번호: ${claim.orderId}` : '앱 주문번호: 결제 버튼을 통해 진입하면 자동 생성',
        `상품: ${productLabel}`,
    ].join('\n');

    const checkPurchase = useCallback(async () => {
        if (loading) return;

        if (!user) {
            setStatus('pending');
            setMessage('결제 확인을 위해 먼저 풍수지리 AI에 로그인해 주세요.');
            return;
        }

        if (!claim.orderId && !claim.analysisId) {
            setStatus('pending');
            setMessage('결제는 완료했지만 앱 주문번호나 분석ID를 찾지 못했습니다. Latpeed 구매자 설문에 앱 이메일과 분석ID를 입력했다면 수동 확인 후 열람 권한이 부여됩니다.');
            return;
        }

        setStatus('checking');
        setMessage('');

        try {
            let query = supabase
                .from('purchases')
                .select('order_id, analysis_id, order_type, status')
                .eq('user_id', user.id)
                .eq('status', 'COMPLETED')
                .limit(1);

            if (claim.orderId) {
                query = query.eq('order_id', claim.orderId);
            } else {
                query = query.eq('analysis_id', claim.analysisId).eq('order_type', claim.orderType);
            }

            const { data, error } = await query.maybeSingle();

            if (error) {
                throw error;
            }

            if (data) {
                setStatus('confirmed');
                setMessage('결제 확인이 완료되었습니다. 이제 프리미엄 내용을 열람할 수 있습니다.');
                return;
            }

            setStatus('pending');
            setMessage('결제 확인 대기 중입니다. Latpeed 구매자 설문에 앱 이메일과 분석ID를 남겼다면 확인 후 프리미엄 열람 권한이 부여됩니다.');
        } catch (error) {
            console.error('Latpeed claim check failed:', error);
            setStatus('error');
            setMessage('결제 확인 상태를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.');
        }
    }, [claim.analysisId, claim.orderId, claim.orderType, loading, user]);

    useEffect(() => {
        checkPurchase();
    }, [checkPurchase]);

    const handleCopy = async () => {
        setIsCopying(true);
        try {
            await navigator.clipboard.writeText(referenceText);
            setMessage('확인용 정보가 복사되었습니다.');
        } catch (error) {
            console.error('Failed to copy claim reference:', error);
            setMessage('복사가 되지 않으면 아래 정보를 직접 선택해서 보내주세요.');
        } finally {
            window.setTimeout(() => setIsCopying(false), 800);
        }
    };

    const isConfirmed = status === 'confirmed';
    const canRefresh = status !== 'checking' && !!user;

    return (
        <div className="min-h-screen bg-[#0c0a06] text-slate-100 font-display antialiased">
            <header className="border-b border-white/10 bg-[#1a1508]/85 backdrop-blur-xl px-4 py-4">
                <div className="mx-auto flex max-w-4xl items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate(resultPath)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        분석으로
                    </button>
                    <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-black tracking-widest text-primary">
                        LATPEED CLAIM
                    </span>
                </div>
            </header>

            <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 md:py-12">
                <section className="rounded-3xl border border-white/10 bg-[#1a1508] p-6 shadow-2xl md:p-8">
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-primary">
                                결제 후 수령 확인
                            </p>
                            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                                {isConfirmed ? '프리미엄 열람 준비가 끝났습니다' : '결제 확인을 진행 중입니다'}
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                                Latpeed는 외부 결제 링크라 결제 직후 앱 권한이 바로 열리지 않을 수 있습니다.
                                결제 완료 내역과 분석ID가 확인되면 프리미엄 공간비방서가 열립니다.
                            </p>
                        </div>

                        <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border ${
                            isConfirmed
                                ? 'border-green-500/25 bg-green-500/10 text-green-400'
                                : status === 'checking'
                                    ? 'border-primary/25 bg-primary/10 text-primary'
                                    : 'border-amber-400/25 bg-amber-400/10 text-amber-300'
                        }`}>
                            {isConfirmed ? (
                                <CheckCircle2 className="h-10 w-10" />
                            ) : status === 'checking' ? (
                                <Loader2 className="h-10 w-10 animate-spin" />
                            ) : (
                                <Clock3 className="h-10 w-10" />
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-3xl border border-white/10 bg-[#1a1508] p-6 shadow-xl">
                        <div className="mb-5 flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-black text-white">현재 상태</h2>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                            <p className={`mb-3 text-sm font-black ${
                                isConfirmed ? 'text-green-400' : status === 'error' ? 'text-red-300' : 'text-amber-300'
                            }`}>
                                {isConfirmed ? '결제 확인 완료' : status === 'checking' ? '확인 중' : status === 'error' ? '확인 오류' : '확인 대기'}
                            </p>
                            <p className="text-sm leading-7 text-slate-300">{message}</p>
                        </div>

                        <div className="mt-5 grid gap-3 text-sm">
                            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                                <span className="text-slate-400">상품</span>
                                <span className="font-bold text-white">{productLabel}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                                <span className="text-slate-400">결제 금액</span>
                                <span className="font-bold text-primary">{claim.amount.toLocaleString()}원</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-400">분석ID</span>
                                <span className="max-w-[58%] truncate font-mono text-xs text-slate-200">
                                    {claim.analysisId || '미확인'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-[#1a1508] p-6 shadow-xl">
                        <div className="mb-5 flex items-center gap-3">
                            <Clipboard className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-black text-white">확인용 정보</h2>
                        </div>
                        <pre className="min-h-40 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/35 p-4 text-[12px] leading-6 text-slate-300">
                            {referenceText}
                        </pre>
                        <p className="mt-4 text-xs leading-6 text-slate-400">
                            Latpeed 구매자 설문에 위 정보가 들어가 있으면 확인이 가장 빠릅니다.
                            누락했다면 구매 내역 화면에서 이 정보를 고객센터나 운영자에게 전달하면 됩니다.
                        </p>
                    </div>
                </section>

                {!user && !loading && (
                    <section className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
                        <p className="mb-4 text-sm font-bold leading-6 text-primary">
                            결제한 계정과 같은 풍수지리 AI 계정으로 로그인하면 열람 권한 확인이 가능합니다.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => signInWithKakao(window.location.href)}
                                className="rounded-2xl bg-[#FEE500] px-5 py-3 text-sm font-black text-[#191600] transition-transform hover:-translate-y-0.5"
                            >
                                카카오로 로그인
                            </button>
                            <button
                                type="button"
                                onClick={() => signInWithGoogle(window.location.href)}
                                className="rounded-2xl border border-white/15 bg-white px-5 py-3 text-sm font-black text-[#151515] transition-transform hover:-translate-y-0.5"
                            >
                                Google로 로그인
                            </button>
                        </div>
                    </section>
                )}

                <div className="grid gap-3 sm:grid-cols-3">
                    <button
                        type="button"
                        onClick={() => navigate(resultPath)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-black text-[#0c0a06] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-yellow-400"
                    >
                        <ExternalLink className="h-4 w-4" />
                        {isConfirmed ? '프리미엄 보기' : '분석으로 돌아가기'}
                    </button>
                    <button
                        type="button"
                        onClick={checkPurchase}
                        disabled={!canRefresh}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        <RefreshCw className="h-4 w-4" />
                        다시 확인
                    </button>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-white transition-colors hover:bg-white/10"
                    >
                        <Clipboard className="h-4 w-4" />
                        {isCopying ? '복사됨' : '정보 복사'}
                    </button>
                </div>
            </main>
        </div>
    );
}
