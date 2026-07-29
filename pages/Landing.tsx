import React, { useState } from 'react';
import { Sparkles, Compass, Shield, Eye, ArrowRight, CheckCircle2, Users, Target, Heart, TrendingUp, Award, BookOpen, Clock, ChevronRight, Home } from 'lucide-react';
import Onboarding, { ONBOARDING_COMPLETED_KEY } from '../components/Onboarding';
import DailyFengShui from '../components/DailyFengShui';
import { trackEvent } from '../services/analyticsService';
import { DIGITAL_PRODUCT_TOTAL_KRW, formatKrw } from '../services/pricing';

export default function Landing() {
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

    return (
        <div className="relative min-h-screen w-full font-display text-slate-100 antialiased overflow-x-hidden bg-[#0c0a06]">
            {showOnboarding && (
                <Onboarding onComplete={() => setShowOnboarding(false)} />
            )}
            {!showOnboarding && <DailyFengShui />}

            {/* ============================================ */}
            {/* 1. HERO — Cinematic Full-Bleed */}
            {/* ============================================ */}
            <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
                {/* Cinematic Background Images */}
                <div className="absolute top-0 right-0 w-[55%] h-full z-0 opacity-80 mix-blend-luminosity fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0c0a06] via-[#0c0a06]/80 to-transparent z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06] via-transparent to-[#0c0a06] z-10"></div>
                    <div className="flex h-full">
                        <img src="/images/masters/cheongpung_landing.jpeg" className="w-1/2 h-full object-cover object-center" alt="청풍" />
                        <img src="/images/masters/myeongwol_landing.jpeg" className="w-1/2 h-full object-cover object-center" alt="명월" />
                    </div>
                </div>

                {/* Floating particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-50">
                    <div className="particle particle-1"></div>
                    <div className="particle particle-2"></div>
                    <div className="particle particle-3"></div>
                    <div className="particle particle-4"></div>
                </div>

                {/* Navigation */}
                <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0c0a06]/70 backdrop-blur-2xl">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                                <Compass className="w-5 h-5" />
                            </div>
                            <span className="text-lg font-bold text-white tracking-tight">풍수지리 AI</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#why" className="text-sm font-bold text-slate-400 hover:text-primary transition-colors">풍수란?</a>
                            <a href="#sample" className="text-sm font-bold text-slate-400 hover:text-primary transition-colors">샘플</a>
                            <a href="#packages" className="text-sm font-bold text-slate-400 hover:text-primary transition-colors">개업 패키지</a>
                            <a href="#process" className="text-sm font-bold text-slate-400 hover:text-primary transition-colors">감정 과정</a>
                            <a href="#masters" className="text-sm font-bold text-slate-400 hover:text-primary transition-colors">대가 소개</a>
                        </div>
                        <a href="/analyze" className="flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-bold text-[#221e10] hover:bg-yellow-400 transition-all hover:scale-105">
                            <span>무료 감정받기</span>
                        </a>
                    </div>
                </nav>

                {/* Hero Content */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
                    <div className="max-w-3xl fade-in-up">
                        <div className="flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-[#0c0a06]/80 backdrop-blur-md px-4 py-1.5 mb-8">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">사진 기반 공간 진단 · 프리미엄 비방서</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight text-white mb-6 text-shadow-xl">
                            공간의 흐름이<br />
                            <span className="text-primary">일상을 바꿉니다</span>
                        </h1>
                        <p className="text-xl leading-relaxed text-slate-300 max-w-xl mb-12 text-shadow">
                            사진 한 장과 공간 목적을 바탕으로 채광, 동선, 방향, 오행 균형을 읽고
                            청풍 도사의 <strong className="text-white">진단</strong>과 명월 도사의 <strong className="text-white">실행 처방</strong>으로 정리합니다.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-16">
                        <a
                            href="/analyze"
                            onClick={() => trackEvent('landing_cta_click', { metadata: { placement: 'hero_primary' } })}
                            className="group flex h-16 items-center justify-center gap-3 rounded-2xl bg-primary px-10 text-lg font-bold text-[#221e10] transition-all hover:bg-yellow-400 hover:scale-105 shadow-xl shadow-primary/20"
                        >
                            무료 초견 받아보기
                            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                        </a>
                            <a href="#sample" className="flex h-16 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-8 text-lg font-medium text-white backdrop-blur-md transition-all hover:bg-white/10">
                                프리미엄 샘플 보기
                            </a>
                        </div>

                        {/* Social Proof Bar */}
                        <div className="grid gap-4 border-t border-white/10 bg-[#0c0a06]/50 px-5 py-5 backdrop-blur-sm sm:grid-cols-3 sm:rounded-3xl sm:px-6">
                            {[
                                { icon: Eye, title: '무료 초견 먼저 확인', desc: '결제 전 핵심 징후 공개' },
                                { icon: Clock, title: '즉시 분석 가능', desc: '사진 업로드 후 바로 결과 확인' },
                                { icon: Shield, title: '주문 기록 보관', desc: '마이페이지에서 결제·환불 상태 확인' },
                            ].map((item) => (
                                <div key={item.title} className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">{item.title}</div>
                                        <div className="text-xs text-slate-400">{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* 2. WHY FENG SHUI / BEFORE-AFTER */}
            {/* ============================================ */}
            <section id="why" className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <div className="flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mx-auto mb-6">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">신비한 언어, 현실적인 실행</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6">풍수 감각을 <span className="text-primary">공간 심리와 동선</span>으로 번역합니다</h2>
                        <p className="text-lg text-slate-400 max-w-3xl mx-auto">단정적인 예언이 아니라, 채광·시야·동선·색감·수납의 흐름을 풍수 언어로 읽고 실제로 바꿀 수 있는 행동으로 정리합니다.</p>
                    </div>

                    {/* Before/After Showcase */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
                        <div className="relative group">
                            <div className="relative rounded-3xl overflow-hidden border border-white/10 aspect-video shadow-2xl">
                                <div className="absolute inset-0 grid grid-cols-2 bg-[#16130b]">
                                    <div className="relative overflow-hidden border-r border-white/10 p-5">
                                        <div className="absolute inset-0 bg-red-500/5"></div>
                                        <div className="relative h-full rounded-2xl border border-red-500/25 bg-black/25 p-4">
                                            <div className="mb-4 flex items-center justify-between">
                                                <span className="text-xs font-black text-red-300">막힌 흐름</span>
                                                <span className="rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-bold text-red-200">Before</span>
                                            </div>
                                            <div className="grid h-[72%] grid-cols-3 grid-rows-3 gap-2">
                                                <div className="rounded-lg bg-slate-700/60"></div>
                                                <div className="col-span-2 rounded-lg border border-red-400/40 bg-red-500/10"></div>
                                                <div className="row-span-2 rounded-lg border border-white/10 bg-slate-800/80"></div>
                                                <div className="rounded-lg bg-slate-700/40"></div>
                                                <div className="rounded-lg bg-slate-700/40"></div>
                                                <div className="col-span-2 rounded-lg border border-red-400/40 bg-red-500/10"></div>
                                            </div>
                                            <div className="absolute left-1/2 top-1/2 h-24 w-1 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-red-400/50 blur-sm"></div>
                                        </div>
                                    </div>
                                    <div className="relative overflow-hidden p-5">
                                        <div className="absolute inset-0 bg-primary/5"></div>
                                        <div className="relative h-full rounded-2xl border border-primary/30 bg-black/25 p-4">
                                            <div className="mb-4 flex items-center justify-between">
                                                <span className="text-xs font-black text-primary">정돈된 흐름</span>
                                                <span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold text-primary">After</span>
                                            </div>
                                            <div className="grid h-[72%] grid-cols-3 grid-rows-3 gap-2">
                                                <div className="rounded-lg bg-primary/25"></div>
                                                <div className="rounded-lg bg-slate-700/45"></div>
                                                <div className="rounded-lg bg-primary/20"></div>
                                                <div className="col-span-3 rounded-lg border border-primary/30 bg-primary/10"></div>
                                                <div className="rounded-lg bg-slate-700/45"></div>
                                                <div className="rounded-lg bg-primary/20"></div>
                                                <div className="rounded-lg bg-slate-700/45"></div>
                                            </div>
                                            <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/35"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 border border-white/10 rounded-lg text-xs font-bold text-white">흉지 (Before)</div>
                                <div className="absolute top-4 right-4 bg-primary/90 text-black px-3 py-1.5 border border-primary/20 rounded-lg text-xs font-bold">명당 (After)</div>
                                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-primary/50 cursor-ew-resize hidden md:block">
                                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black shadow-lg">
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white mb-6">가구 배치 하나가<br />수면의 질을 결정합니다</h3>
                            <ul className="space-y-6 mb-8">
                                {[
                                    { icon: Shield, title: "화(火)와 수(水)의 충돌 완화", desc: "주방의 열기와 물 사용 동선을 읽고, 가족의 체류감이 깨지는 지점을 현실적인 배치로 조정합니다." },
                                    { icon: TrendingUp, title: "등 뒤 지지와 시야 안정", desc: "침대와 책상 뒤가 비어 있을 때 생기는 불안정한 시야를 줄이고, 집중과 휴식에 유리한 방향을 제안합니다." },
                                    { icon: Eye, title: "현관의 첫 인상 정리", desc: "거울, 조명, 수납, 바닥의 시선 흐름을 점검해 들어오는 순간의 밝기와 정돈감을 개선합니다." }
                                ].map((item, idx) => (
                                    <li key={idx} className="flex gap-4 items-start">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <item.icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-white mb-1">{item.title}</h4>
                                            <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Master Bubble: Cheongpung */}
                    <div className="bg-gradient-to-r from-white/5 to-transparent border-l-4 border-primary p-6 md:p-8 rounded-r-3xl flex flex-col md:flex-row gap-6 items-center md:items-start max-w-4xl mx-auto backdrop-blur-sm">
                        <img src="/images/masters/cheongpung.jpeg" className="w-20 h-20 rounded-full border-2 border-primary/30 object-cover object-top" alt="청풍" />
                        <div>
                            <div className="text-primary font-bold text-sm mb-2">청풍 도사의 한마디</div>
                            <blockquote className="text-xl md:text-2xl text-white italic font-bold leading-relaxed">
                                "풍수는 겁을 주는 말이 아니라 공간을 정리하는 언어입니다. 빛이 머무는 자리, 사람이 쉬는 방향, 물건이 쌓이는 흐름을 바로잡으면 공간의 인상이 달라집니다."
                            </blockquote>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* 3. MASTERS & FIVE ELEMENTS */}
            {/* ============================================ */}
            <section id="masters" className="relative py-32 bg-white/[0.02] border-y border-white/[0.05]">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Five Elements Infographic */}
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-12">조화로운 공간을 만드는 <span className="text-primary">오행(五行)</span> 분석</h2>
                        <div className="flex flex-wrap justify-center gap-6">
                            {[
                                { name: "목(木)", color: "border-green-500/50 bg-green-500/10 text-green-400", desc: "성장/발전" },
                                { name: "화(火)", color: "border-red-500/50 bg-red-500/10 text-red-400", desc: "열정/명예" },
                                { name: "토(土)", color: "border-yellow-600/50 bg-yellow-600/10 text-yellow-500", desc: "안정/신용" },
                                { name: "금(金)", color: "border-slate-300/50 bg-slate-300/10 text-slate-200", desc: "재물/결실" },
                                { name: "수(水)", color: "border-blue-500/50 bg-blue-500/10 text-blue-400", desc: "지혜/유연" }
                            ].map((el, i) => (
                                <div key={i} className={`flex flex-col items-center justify-center w-36 h-36 rounded-full border-2 ${el.color} backdrop-blur-sm shadow-xl`}>
                                    <span className="text-3xl font-black mb-2">{el.name}</span>
                                    <span className="text-xs font-bold opacity-80">{el.desc}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-slate-400 mt-10 max-w-2xl mx-auto">AI가 공간에 부족한 오행을 파악하여, 음양오행의 균형을 맞추는 최적의 처방을 내립니다.</p>
                    </div>

                    {/* Split Screen Master Banner */}
                    <div className="grid md:grid-cols-2 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                        {/* Cheongpung Side */}
                        <div className="bg-gradient-to-br from-[#1a1508] to-[#0c0a06] p-10 sm:p-12 relative overflow-hidden group min-h-[360px]">
                            <img src="/images/masters/cheongpung_landing.jpeg" className="pointer-events-none absolute inset-y-0 right-0 h-full w-2/3 object-cover object-center opacity-[0.12] mix-blend-luminosity transition-transform duration-700 group-hover:scale-105" alt="" aria-hidden="true" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1508] via-[#1a1508]/95 to-[#1a1508]/60"></div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
                            <div className="relative z-10 mb-7 flex items-center gap-4">
                                <div className="relative h-24 w-24 shrink-0 rounded-[1.35rem] bg-gradient-to-br from-primary via-[#fff0a6] to-[#6d4c12] p-[2px] shadow-2xl shadow-primary/15">
                                    <div className="h-full w-full overflow-hidden rounded-[1.2rem] bg-[#1b1509]">
                                        <img src="/images/masters/cheongpung.jpeg" className="h-full w-full object-cover object-top" alt="청풍 도사" />
                                    </div>
                                    <div className="pointer-events-none absolute inset-[2px] rounded-[1.2rem] ring-1 ring-white/25"></div>
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Diagnosis Master</p>
                                    <p className="mt-1 text-sm font-bold text-slate-400">산세와 공간 기운 판독</p>
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-white mb-2 relative z-10">진단(診) 담당 : 청풍 도사</h3>
                            <p className="text-primary font-bold text-sm mb-6 relative z-10">지리·풍수 대가 | 산세 및 공간 기운 감정</p>
                            <ul className="space-y-3 mb-8 relative z-10">
                                <li className="flex gap-2 items-center text-slate-300"><CheckCircle2 className="w-4 h-4 text-primary" /> 터와 지기의 길흉 분석</li>
                                <li className="flex gap-2 items-center text-slate-300"><CheckCircle2 className="w-4 h-4 text-primary" /> 방위와 사신사(四神砂) 판별</li>
                                <li className="flex gap-2 items-center text-slate-300"><CheckCircle2 className="w-4 h-4 text-primary" /> 수맥 및 흉살 요인 탐지</li>
                            </ul>
                        </div>
                        {/* Myeongwol Side */}
                        <div className="bg-gradient-to-tl from-[#1a1508] to-[#0c0a06] p-10 sm:p-12 relative overflow-hidden border-t md:border-t-0 md:border-l border-white/5 group min-h-[360px]">
                            <img src="/images/masters/myeongwol_landing.jpeg" className="pointer-events-none absolute inset-y-0 right-0 h-full w-2/3 object-cover object-center opacity-[0.12] mix-blend-luminosity transition-transform duration-700 group-hover:scale-105" alt="" aria-hidden="true" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1508] via-[#1a1508]/95 to-[#1a1508]/60"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
                            <div className="relative z-10 mb-7 flex items-center gap-4">
                                <div className="relative h-24 w-24 shrink-0 rounded-[1.35rem] bg-gradient-to-br from-primary via-[#fff0a6] to-[#6d4c12] p-[2px] shadow-2xl shadow-primary/15">
                                    <div className="h-full w-full overflow-hidden rounded-[1.2rem] bg-[#1b1509]">
                                        <img src="/images/masters/myeongwol.jpeg" className="h-full w-full object-cover object-top" alt="명월 도사" />
                                    </div>
                                    <div className="pointer-events-none absolute inset-[2px] rounded-[1.2rem] ring-1 ring-white/25"></div>
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Remedy Master</p>
                                    <p className="mt-1 text-sm font-bold text-slate-400">오행 보완과 비방 설계</p>
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-white mb-2 relative z-10">처방(方) 담당 : 명월 도사</h3>
                            <p className="text-primary font-bold text-sm mb-6 relative z-10">명리·비방 대가 | 오행 보완 및 비방 오브제</p>
                            <ul className="space-y-3 mb-8 relative z-10">
                                <li className="flex gap-2 items-center text-slate-300"><CheckCircle2 className="w-4 h-4 text-primary" /> 부족한 오행 기운 보충 처방</li>
                                <li className="flex gap-2 items-center text-slate-300"><CheckCircle2 className="w-4 h-4 text-primary" /> 맞춤형 디지털 비방 아트 생성</li>
                                <li className="flex gap-2 items-center text-slate-300"><CheckCircle2 className="w-4 h-4 text-primary" /> 실생활 인테리어 교정 가이드</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* 4. PROCESS / HOW IT WORKS */}
            {/* ============================================ */}
            <section id="process" className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black text-white mb-6">두 대가의 합작, <span className="text-primary">4단계 정밀 분석</span></h2>
                        <p className="text-slate-400">당신의 공간 사진 한 장이 거치는 놀라운 변화의 과정입니다.</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6 px-4">
                        {[
                            { step: "01", title: "공간 촬영", desc: "분석할 거실, 침실, 사무실 등의 사진을 찍어 업로드합니다.", by: "사용자" },
                            { step: "02", title: "정밀 감정", desc: "청풍 도사의 AI가 공간의 형세, 방위, 동선을 스캔하여 흉살을 찾아냅니다.", by: "청풍 도사" },
                            { step: "03", title: "비방 생성", desc: "진단 결과를 바탕으로 명월 도사가 부족한 기운을 채우는 맞춤 비방 아트를 짓습니다.", by: "명월 도사" },
                            { step: "04", title: "적용 완료", desc: "추천받은 가구 배치와 비방 아트를 적용하여 명당을 완성합니다.", by: "완성" }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 hover:border-primary/30 transition-all group">
                                <div className="text-6xl font-black text-white/5 mb-6 group-hover:text-primary/10 transition-colors">{item.step}</div>
                                <h4 className="text-xl font-bold text-white mb-3">{item.title}</h4>
                                <p className="text-sm text-slate-400 mb-6 flex-grow min-h-[60px]">{item.desc}</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/5 text-xs font-bold text-primary">
                                    <Target className="w-3 h-3" /> 담당: {item.by}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Master Bubble: Myeongwol */}
                    <div className="mt-20 bg-gradient-to-l from-white/5 to-transparent border-r-4 border-primary p-6 md:p-8 rounded-l-3xl flex flex-col md:flex-row-reverse gap-6 items-center md:items-start max-w-4xl mx-auto backdrop-blur-sm text-right">
                        <img src="/images/masters/myeongwol.jpeg" className="w-20 h-20 rounded-full border-2 border-primary/30 object-cover object-top" alt="명월" />
                        <div>
                            <div className="text-primary font-bold text-sm mb-2">명월 도사의 한마디</div>
                            <blockquote className="text-xl md:text-2xl text-white italic font-bold leading-relaxed">
                                "지리가 병을 찾으면, 명리가 약을 내리는 것이지요. 두 도사의 지혜가 하나로 합쳐질 때, 비로소 당신의 공간에 진정한 평온과 복이 깃든답니다."
                            </blockquote>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* 5. SAMPLE REPORT */}
            {/* ============================================ */}
            <section id="sample" className="relative py-32 px-6 bg-[#120f08] border-y border-white/[0.06]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-12 items-center">
                        <div>
                            <div className="flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6">
                                <Award className="w-4 h-4 text-primary" />
                                <span className="text-xs font-bold uppercase tracking-wider text-primary">샘플 감명서 미리보기</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                                무료는 판단의 시작,<br />
                                <span className="text-primary">프리미엄은 실행 문서</span>입니다
                            </h2>
                            <p className="text-lg text-slate-400 leading-relaxed mb-8">
                                무료 초견은 결제 전 핵심 징후를 보여줍니다. 프리미엄 공간비방서는 빛, 동선, 오행 결핍, 배치 처방, 비방 아트와 수호 오브제까지 실제로 따라 할 수 있는 순서로 정리합니다.
                            </p>
                            <div className="grid sm:grid-cols-3 gap-3">
                                {[
                                    ['8장', '보관용 감명서 구성'],
                                    ['5개', '핵심 징후와 원인'],
                                    ['7일', '실행 체크리스트'],
                                ].map(([value, label]) => (
                                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                        <div className="text-3xl font-black text-primary mb-1">{value}</div>
                                        <div className="text-xs font-bold text-slate-400">{label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-3xl border border-primary/20 bg-primary/5"></div>
                            <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-[#f4e6bd] p-6 md:p-8 text-[#25180d] shadow-2xl">
                                <div className="flex items-start justify-between gap-4 border-b border-[#8f6f26]/25 pb-5 mb-6">
                                    <div>
                                        <p className="text-[11px] font-black tracking-[0.28em] text-[#8f1f1f] mb-2">PREMIUM SPACE REPORT</p>
                                        <h3 className="text-2xl md:text-3xl font-black">프리미엄 공간비방서 샘플</h3>
                                        <p className="text-sm font-bold text-[#7a6332] mt-2">거실 겸 작업 공간 / 채광·동선·수납 진단</p>
                                    </div>
                                    <div className="shrink-0 rounded-2xl border border-[#8f6f26]/30 bg-[#25180d] px-4 py-3 text-center text-[#f4e6bd]">
                                        <div className="text-3xl font-black leading-none">91</div>
                                        <div className="text-[10px] font-bold">점</div>
                                    </div>
                                </div>

                                <div className="space-y-5 text-sm leading-relaxed">
                                    <div>
                                        <h4 className="mb-2 font-black text-[#8f1f1f]">1장. 공간의 첫 판독</h4>
                                        <p>현관에서 창으로 이어지는 직선 동선이 시선을 빠르게 흘려보내고, 작업 좌석 뒤의 여백이 집중감을 약하게 만듭니다. 밝은 채광은 장점이지만 이를 붙잡아 줄 금(金)의 정돈감이 부족합니다.</p>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="rounded-2xl border border-[#8f6f26]/25 bg-white/35 p-4">
                                            <h5 className="font-black text-[#2d5f46] mb-1">유지할 요소</h5>
                                            <p>밝은 채광, 열린 시야, 시작을 돕는 화(火)의 활력</p>
                                        </div>
                                        <div className="rounded-2xl border border-[#8f6f26]/25 bg-white/35 p-4">
                                            <h5 className="font-black text-[#8f1f1f] mb-1">바꿀 요소</h5>
                                            <p>빠른 시선 흐름, 금기 부족, 등 뒤 지지 약화</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="mb-2 font-black text-[#8f1f1f]">5장. 실행 비방</h4>
                                        <ul className="space-y-2">
                                            <li>현관과 창 사이에 낮은 식물 또는 반투명 오브제를 두어 시선의 속도를 낮춥니다.</li>
                                            <li>서쪽 선반에 백색 원형 트레이를 배치해 금(金)의 정돈감을 보강합니다.</li>
                                            <li>비방 아트는 달빛, 은빛 원형 그릇, 흰 산 능선을 중심 이미지로 생성합니다.</li>
                                        </ul>
                                    </div>
                                    <div className="rounded-2xl border border-[#8f6f26]/25 bg-[#25180d]/10 p-4">
                                        <h4 className="mb-3 font-black text-[#8f1f1f]">구매 후 제공 항목</h4>
                                        <div className="grid gap-2 sm:grid-cols-3">
                                            {['상세 감명서', '비방 아트 원본', '배치 체크리스트'].map((item) => (
                                                <div key={item} className="rounded-xl bg-white/40 px-3 py-2 text-center text-xs font-black text-[#25180d]">
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                    <a href="/analyze" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25180d] px-5 py-3 text-sm font-black text-[#f4e6bd] hover:bg-[#3a2916] transition-colors">
                                        내 공간도 무료 진단하기 <ArrowRight className="w-4 h-4" />
                                    </a>
                                    <a href="#compare" className="flex flex-1 items-center justify-center rounded-xl border border-[#8f6f26]/35 px-5 py-3 text-sm font-black text-[#25180d] hover:bg-white/40 transition-colors">
                                        무료/프리미엄 비교
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* 6. COMPARISON */}
            {/* ============================================ */}
            <section id="compare" className="relative py-28 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-4xl font-black text-white mb-4">결제 이유가 한눈에 보이게</h2>
                        <p className="text-slate-400">무료 결과는 판단을 돕고, 프리미엄은 바로 실행할 수 있는 문서와 이미지 원본을 제공합니다.</p>
                    </div>
                    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03]">
                        <div className="min-w-[760px]">
                            <div className="grid grid-cols-3 bg-black/30 text-sm font-black text-white">
                                <div className="p-5">구성</div>
                                <div className="p-5 border-l border-white/10">무료 초견첩</div>
                                <div className="p-5 border-l border-primary/30 bg-primary/10 text-primary">프리미엄 공간비방서</div>
                            </div>
                            {[
                                ['공간 점수와 핵심 진단', '요약 점수와 대표 징후', '징후별 원인, 위험도, 우선순위'],
                                ['오행 분석', '부족 기운 일부 공개', '화·수·목·금·토 균형표와 보완 방식'],
                                ['비보 처방', '첫 처방 1개 중심', '전체 처방, 배치 위치, 실행 순서'],
                                ['비방 아트', '키워드 미리보기', '고해상도 생성, 재생성, 다운로드'],
                                ['수호 오브제', '추천 방향만 공개', '동물, 재질, 색상, 배치 해설'],
                                ['PDF 보관', '제공 안 됨', '프리미엄 감명서 PDF 저장'],
                            ].map(([feature, free, premium]) => (
                                <div key={feature} className="grid grid-cols-3 border-t border-white/10 text-sm">
                                    <div className="p-5 font-bold text-white">{feature}</div>
                                    <div className="p-5 border-l border-white/10 text-slate-400">{free}</div>
                                    <div className="p-5 border-l border-primary/20 bg-primary/[0.04] text-slate-100">
                                        <CheckCircle2 className="mr-2 inline h-4 w-4 text-primary" />
                                        {premium}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* 7. OPENING / GIFT PACKAGES */}
            {/* ============================================ */}
            <section id="packages" className="relative py-32 px-6 bg-[#101816] border-y border-white/[0.06]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mx-auto mb-6">
                            <Users className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">개업, 이전, 집들이, 선물 패키지</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6">방과 터를 따로 읽고, 따로 소장합니다</h2>
                        <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
                            내부 공간은 사진 속 구조와 사용 목적을, 외부 입지는 주소 주변의 산세·물길·도로 흐름을 분석합니다. 두 분석은 각각 전용 비방서와 액자, 수호 오브제로 이어집니다.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        {[
                            {
                                eyebrow: 'INTERIOR BALANCE',
                                title: '내부 공간 컬렉션',
                                price: `프리미엄 감명서 ${formatKrw(DIGITAL_PRODUCT_TOTAL_KRW)}`,
                                desc: '방 사진, 용도, 사용자의 오행을 함께 읽고 실제 방 안에 둘 수 있는 처방으로 연결합니다.',
                                points: ['내부 공간 균형 비방서', '룸 가디언 액자', '책상·선반용 데스크 가디언 오브제'],
                            },
                            {
                                eyebrow: 'SITE GUARDIAN',
                                title: '외부 입지 컬렉션',
                                price: `프리미엄 감명서 ${formatKrw(DIGITAL_PRODUCT_TOTAL_KRW)}`,
                                desc: '집과 사업장의 주소를 중심으로 터의 흐름을 읽고 입구와 카운터를 위한 처방으로 연결합니다.',
                                points: ['외부 입지 수호 비방서', '사이트 가디언 액자', '현관·카운터용 게이트 가디언 오브제'],
                            },
                        ].map((pkg, idx) => (
                            <div key={pkg.title} className={`rounded-3xl border p-8 ${idx === 0 ? 'border-primary/45 bg-primary/10' : 'border-white/10 bg-white/[0.03]'}`}>
                                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-black/35 text-primary">
                                    {idx === 0 ? <Home className="w-6 h-6" /> : <Compass className="w-6 h-6" />}
                                </div>
                                <p className="mb-2 text-[11px] font-black tracking-[0.18em] text-primary">{pkg.eyebrow}</p>
                                <h3 className="text-2xl font-black text-white mb-2">{pkg.title}</h3>
                                <p className="mb-5 text-sm font-bold text-primary">{pkg.price}</p>
                                <p className="text-sm leading-relaxed text-slate-400 mb-6">{pkg.desc}</p>
                                <ul className="space-y-3">
                                    {pkg.points.map((point) => (
                                        <li key={point} className="flex items-center gap-2 text-sm text-slate-300">
                                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="mt-14 rounded-3xl border border-primary/20 bg-black/25 p-6 md:p-8">
                        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
                            <div>
                                <h3 className="text-2xl font-black text-white mb-2">개업 선물용 패키지로 자연스럽게 이어집니다</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    “사장님 자리와 계산대 위치를 먼저 봐드립니다”처럼 목적이 분명한 공간은 분석 결과를 바로 실행하기 좋습니다. 감명서, 비방 아트, 카운터용 오브제를 묶으면 선물로도 설득력이 생깁니다.
                                </p>
                            </div>
                            <a href="/analyze" className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-black text-[#101816] hover:bg-yellow-400 transition-all">
                                개업 공간 진단하기 <ArrowRight className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* 8. CASE STUDIES */}
            {/* ============================================ */}
            <section className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-white mb-4">가장 많이 쓰이는 상황</h2>
                        <p className="text-slate-400">아래는 실제 후기 대신, 구매자가 바로 이해할 수 있는 대표 활용 사례입니다.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                tag: '신규 카페',
                                title: '카운터 앞 동선이 너무 빠른 매장',
                                quote: '손님은 많이 지나가는데 머무는 느낌이 약한 공간입니다.',
                                outcome: '입구와 계산대 사이에 시선 완충 장치, 원형 조명, 금속 트레이를 배치하는 처방으로 객석 체류감을 강화합니다.',
                            },
                            {
                                tag: '1인 사무실',
                                title: '대표 자리 뒤가 비어 있는 업무실',
                                quote: '결정은 많은데 마무리가 늦어지는 구조입니다.',
                                outcome: '등 뒤 지지면, 북서쪽 금기 보강, 책상 위 오브제 위치를 제안해 업무 집중과 신뢰감을 높입니다.',
                            },
                            {
                                tag: '집들이 선물',
                                title: '밝지만 차분함이 부족한 신혼집',
                                quote: '빛은 좋지만 기운이 빨리 빠져나가는 집입니다.',
                                outcome: '프리미엄 PDF와 맞춤 비방 아트를 함께 전달해 단순 소품이 아닌 의미 있는 선물로 만듭니다.',
                            },
                        ].map((item) => (
                            <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 hover:border-primary/35 transition-colors">
                                <div className="mb-5 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black text-primary">{item.tag}</div>
                                <h3 className="text-xl font-black text-white mb-4">{item.title}</h3>
                                <p className="mb-5 border-l-2 border-primary pl-4 text-sm font-bold leading-relaxed text-slate-200">{item.quote}</p>
                                <p className="text-sm leading-relaxed text-slate-400">{item.outcome}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* 9. URGENCY & CTA */}
            {/* ============================================ */}
            <section className="relative py-32 border-t border-white/10 bg-gradient-to-b from-transparent to-primary/5">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="inline-block mb-8">
                        <div className="rounded-full border border-primary/20 bg-primary/10 px-6 py-2 font-bold text-primary shadow-lg shadow-primary/10">
                            무료 초견은 결제 없이 먼저 확인할 수 있습니다
                        </div>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
                        내 공간의 첫 진단을<br />먼저 <span className="text-primary">받아보세요</span>
                    </h2>

                    <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
                        사진을 올리면 핵심 징후와 첫 처방을 확인할 수 있습니다.<br />프리미엄은 필요한 사람만 선택하면 됩니다.
                    </p>

                    <a href="/analyze" className="group inline-flex h-20 items-center justify-center gap-4 rounded-full bg-primary px-12 text-2xl font-black text-[#221e10] transition-all hover:bg-yellow-400 hover:scale-105 shadow-2xl shadow-primary/30">
                        무료 초견 시작하기
                        <ArrowRight className="w-8 h-8 transition-transform group-hover:translate-x-2" />
                    </a>

                    {/* Usage Notes */}
                    <div className="mt-16 grid md:grid-cols-2 gap-6 text-left">
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl">
                            <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-primary">Home</div>
                            <p className="text-sm text-slate-300 font-medium mb-4">침실, 거실, 현관처럼 매일 오래 머무는 공간은 채광과 동선, 시야 안정이 중요합니다.</p>
                            <div className="text-xs text-slate-500 font-bold">추천: 이사 전, 가구 재배치 전, 집들이 선물</div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl">
                            <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-primary">Business</div>
                            <p className="text-sm text-slate-300 font-medium mb-4">카운터, 대표 자리, 입구 동선은 매장의 첫 인상과 체류감을 좌우합니다.</p>
                            <div className="text-xs text-slate-500 font-bold">추천: 개업 전, 사무실 이전, 상담 공간 정리</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* FOOTER */}
            {/* ============================================ */}
            <footer className="border-t border-white/[0.06] py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <Compass className="w-5 h-5 text-primary" />
                        <span className="font-bold text-white tracking-widest uppercase">풍수지리 AI</span>
                    </div>
                    <p className="text-slate-500 text-xs text-center max-w-md leading-relaxed">
                        본 서비스는 전통 풍수 이론과 공간 분석 프롬프트를 기반으로 한 AI 참고 서비스입니다.<br />엔터테인먼트 및 인테리어 기획 단계의 보조 자료로 활용하시길 권장합니다.
                    </p>
                    <p className="text-slate-600 text-[10px]">© 2026 Feng Shui Grand Master AI. All rights reserved.</p>
                </div>
            </footer>

            <style>{`
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            .fade-in-up { opacity: 0; animation: fadeInUp 0.8s ease-out forwards; }
            .text-shadow-xl { text-shadow: 0 10px 30px rgba(0,0,0,0.8); }
            .text-shadow { text-shadow: 0 4px 10px rgba(0,0,0,0.5); }
            @keyframes float { 0%, 100% { transform: translateY(0); opacity: 0.2; } 50% { transform: translateY(-50px); opacity: 0.6; } }
            .particle { position: absolute; width: 4px; height: 4px; background: #f2b90d; border-radius: 50%; blur: 2px; }
            .particle-1 { bottom: 20%; left: 10%; animation: float 8s ease-in-out infinite; }
            .particle-2 { top: 30%; left: 40%; animation: float 12s ease-in-out infinite 2s; width: 3px; height: 3px; }
            .particle-3 { top: 20%; right: 20%; animation: float 10s ease-in-out infinite 1s; width: 5px; height: 5px; }
            .particle-4 { bottom: 40%; right: 40%; animation: float 14s ease-in-out infinite 3s; }
            `}</style>
        </div>
    );
}
