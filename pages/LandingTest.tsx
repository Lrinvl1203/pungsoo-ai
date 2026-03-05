
import React from 'react';
import { Sparkles, Compass, Shield, Eye, Zap, ArrowRight, CheckCircle2, Star, Users, Target, Heart, Send, TrendingUp, Award, BookOpen } from 'lucide-react';

export default function LandingTest() {
    React.useEffect(() => {
        const link1 = document.createElement('link');
        link1.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800;900&display=swap';
        link1.rel = 'stylesheet';
        document.head.appendChild(link1);

        const script1 = document.createElement('script');
        script1.src = 'https://cdn.tailwindcss.com?plugins=forms,container-queries';
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.innerHTML = `
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#f2b90d",
                        "background-dark": "#221e10",
                    },
                    fontFamily: {
                        "display": ["Plus Jakarta Sans", "sans-serif"]
                    },
                },
            },
        }
    `;
        document.head.appendChild(script2);

        const originalHtmlClass = document.documentElement.className;
        document.documentElement.className = 'dark';

        return () => {
            if (document.head.contains(link1)) document.head.removeChild(link1);
            if (document.head.contains(script1)) document.head.removeChild(script1);
            if (document.head.contains(script2)) document.head.removeChild(script2);
            document.documentElement.className = originalHtmlClass;
        };
    }, []);

    return (
        <div className="relative min-h-screen w-full font-display text-slate-100 antialiased overflow-x-hidden bg-[#0c0a06]">

            {/* ============================================ */}
            {/* SECTION 1 — HERO */}
            {/* ============================================ */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#1a1508] via-[#0c0a06] to-[#0c0a06]"></div>
                {/* Radial glow behind masters */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-primary/5 rounded-full blur-[150px]"></div>
                {/* Floating particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="particle particle-1"></div>
                    <div className="particle particle-2"></div>
                    <div className="particle particle-3"></div>
                    <div className="particle particle-4"></div>
                    <div className="particle particle-5"></div>
                    <div className="particle particle-6"></div>
                </div>

                {/* Navigation */}
                <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0c0a06]/70 backdrop-blur-2xl">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                                <Compass className="w-5 h-5" />
                            </div>
                            <span className="text-lg font-bold text-white tracking-tight">풍수지리 AI</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#why" className="text-sm text-slate-400 hover:text-primary transition-colors">풍수란?</a>
                            <a href="#masters" className="text-sm text-slate-400 hover:text-primary transition-colors">도사 소개</a>
                            <a href="#how" className="text-sm text-slate-400 hover:text-primary transition-colors">서비스 소개</a>
                            <a href="#trust" className="text-sm text-slate-400 hover:text-primary transition-colors">신뢰도</a>
                        </div>
                        <a href="/" className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-[#221e10] hover:bg-yellow-400 transition-all hover:scale-105 active:scale-95">
                            <span>분석 시작</span>
                            <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                </nav>

                {/* Hero Content */}
                <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left — Text */}
                        <div className="text-left fade-in-up">
                            <div className="flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 backdrop-blur-sm mb-8">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="text-xs font-bold uppercase tracking-wider text-primary">40년 대가의 풍수 이론 × AI 기술</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-white mb-6">
                                두 도사가 함께<br />
                                읽어내는<br />
                                <span className="text-primary">공간의 기운</span>
                            </h1>
                            <p className="text-lg leading-relaxed text-slate-400 max-w-lg mb-10">
                                명월 도사와 청풍 도사. 40년간 풍수 현장을 함께 지켜온 두 대가의 감각과 지식을 AI로 학습하여,
                                당신의 공간에 맞는 <strong className="text-slate-200">맞춤형 풍수 처방</strong>을 그려냅니다.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href="/" className="group flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-[#221e10] transition-all hover:bg-yellow-400 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                                    무료로 분석 시작하기
                                    <Send className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </a>
                                <a href="#how" className="flex h-14 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 text-base font-medium text-white backdrop-blur-sm transition-all hover:border-primary/50 hover:text-primary">
                                    서비스 자세히 보기
                                </a>
                            </div>
                        </div>

                        {/* Right — Two Masters */}
                        <div className="relative flex justify-center items-center fade-in-up" style={{ animationDelay: '0.3s' }}>
                            {/* Glow rings */}
                            <div className="absolute w-[380px] h-[380px] rounded-full border border-primary/10 animate-pulse"></div>
                            <div className="absolute w-[440px] h-[440px] rounded-full border border-primary/5"></div>

                            {/* 청풍 도사 (left, slightly behind) */}
                            <div className="relative -mr-8 z-10 group">
                                <div className="w-52 h-52 md:w-64 md:h-64 rounded-full overflow-hidden border-2 border-primary/30 shadow-2xl shadow-primary/10 transition-transform duration-500 group-hover:scale-105">
                                    <img src="/images/masters/cheongpung.jpeg" alt="청풍 도사" className="w-full h-full object-cover object-top" />
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#1a1508] border border-primary/30 rounded-full px-4 py-1.5 whitespace-nowrap backdrop-blur-xl">
                                    <span className="text-xs font-bold text-primary">청풍 도사</span>
                                </div>
                            </div>

                            {/* 명월 도사 (right, slightly in front) */}
                            <div className="relative -ml-8 z-20 group">
                                <div className="w-52 h-52 md:w-64 md:h-64 rounded-full overflow-hidden border-2 border-primary/30 shadow-2xl shadow-primary/10 transition-transform duration-500 group-hover:scale-105">
                                    <img src="/images/masters/myeongwol.jpeg" alt="명월 도사" className="w-full h-full object-cover object-top" />
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#1a1508] border border-primary/30 rounded-full px-4 py-1.5 whitespace-nowrap backdrop-blur-xl">
                                    <span className="text-xs font-bold text-primary">명월 도사</span>
                                </div>
                            </div>

                            {/* Yin-Yang connector */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                                <div className="w-12 h-12 rounded-full bg-[#0c0a06] border-2 border-primary/40 flex items-center justify-center shadow-xl">
                                    <span className="text-xl">☯</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 fade-in-up" style={{ animationDelay: '0.8s' }}>
                    <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
                        <div className="w-1.5 h-3 rounded-full bg-primary scroll-indicator"></div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* SECTION 2 — WHY FENG SHUI */}
            {/* ============================================ */}
            <section id="why" className="relative py-28 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Section header */}
                    <div className="text-center mb-20">
                        <div className="flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mx-auto mb-6">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">풍수지리란?</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">
                            당신의 <span className="text-primary">공간</span>이<br className="md:hidden" /> 운명을 바꿉니다
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            풍수지리는 수천 년간 동양 문명을 이끌어온 공간 과학입니다.
                            현대 과학으로도 증명되는 환경 심리학적 원리가 그 기반에 있습니다.
                        </p>
                    </div>

                    {/* Master Quote — 청풍 */}
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/[0.06] p-8 md:p-12 mb-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[80px]"></div>
                        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                            <div className="flex-shrink-0">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg">
                                    <img src="/images/masters/cheongpung.jpeg" alt="청풍 도사" className="w-full h-full object-cover object-top" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-primary font-bold text-sm">청풍 도사</span>
                                    <span className="text-slate-600 text-xs">風水 大家 · 40년 실전 경력</span>
                                </div>
                                <blockquote className="text-xl md:text-2xl font-bold text-white leading-relaxed italic mb-6">
                                    "좋은 땅에 집을 지으면 가문이 번성하고, 나쁜 자리에 앉으면 기운이 쇠한다.<br className="hidden md:block" />
                                    이것은 미신이 아니라 <span className="text-primary">수천 년간 검증된 공간의 법칙</span>입니다."
                                </blockquote>
                                <p className="text-slate-400 leading-relaxed">
                                    풍수는 바람(風)과 물(水)의 흐름을 읽어, 자연의 기운(氣)이 모이는 곳을 찾는 학문입니다.
                                    주거 공간의 기 흐름이 거주자의 건강, 재운, 인간관계에 직접적 영향을 미칩니다.
                                    현대 환경 심리학 연구에서도 공간 배치가 생산성, 수면의 질, 스트레스 수준에 유의미한 영향을 미친다는 것이 입증되었습니다.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Importance Cards */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-8 hover:border-primary/20 transition-all group">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                <Shield className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-3">건강 & 안정</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                잘못된 가구 배치, 침대 방향 하나가 수면의 질을 좌우합니다.
                                풍수 교정으로 만성 피로, 불면의 원인을 제거합니다.
                            </p>
                        </div>
                        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-8 hover:border-primary/20 transition-all group">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                <TrendingUp className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-3">재운 & 번영</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                재물의 기가 모이는 자리, 빠져나가는 자리가 있습니다.
                                오행의 균형을 맞추면 재운의 흐름이 달라집니다.
                            </p>
                        </div>
                        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-8 hover:border-primary/20 transition-all group">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                <Heart className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-3">관계 & 조화</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                가족 간 갈등, 부부 불화의 원인이 공간에 숨어 있을 수 있습니다.
                                기의 순환을 개선하면 관계의 기운도 바뀝니다.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* SECTION 3 — MEET THE MASTERS */}
            {/* ============================================ */}
            <section id="masters" className="relative py-28 px-6">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent"></div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-20">
                        <div className="flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mx-auto mb-6">
                            <Users className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">두 도사의 조화</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                            <span className="text-primary">청풍</span>과 <span className="text-primary">명월</span>, 완벽한 조화
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            산세와 지기를 읽는 청풍 도사, 명리와 비방을 짓는 명월 도사.<br />
                            두 대가의 40년 실전 경험이 하나의 AI에 담겼습니다.
                        </p>
                    </div>

                    {/* Master Cards */}
                    <div className="grid md:grid-cols-2 gap-8 mb-16">
                        {/* 청풍 도사 */}
                        <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/[0.06] overflow-hidden group hover:border-primary/20 transition-all">
                            <div className="relative h-72 overflow-hidden">
                                <img src="/images/masters/cheongpung_landing.jpeg" alt="청풍 도사" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06] via-transparent to-transparent"></div>
                                <div className="absolute bottom-4 left-6">
                                    <h3 className="text-2xl font-black text-white">청풍 도사</h3>
                                    <p className="text-primary text-sm font-bold">地理 · 風水 大家</p>
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">산세 분석</span>
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">지기 감별</span>
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">양택·음택</span>
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">수맥 탐지</span>
                                </div>
                                <p className="text-slate-400 leading-relaxed text-sm mb-6">
                                    40년간 전국 수천 곳의 명당과 흉지를 직접 답사한 풍수 지리의 대가.
                                    산의 형세와 물의 흐름으로 땅의 기운을 읽어내는 전통 풍수의 핵심을 담당합니다.
                                    외부 공간의 지리적 분석, 주변 환경이 집에 미치는 영향을 정밀 감정합니다.
                                </p>
                                <div className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.06]">
                                    <p className="text-white italic text-sm leading-relaxed">
                                        "산은 뼈대요, 물은 핏줄이라. 집이 어느 산의 줄기 위에 앉았는지,
                                        어느 물줄기의 기운을 받는지가 그 집의 운명을 결정짓소."
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 명월 도사 */}
                        <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/[0.06] overflow-hidden group hover:border-primary/20 transition-all">
                            <div className="relative h-72 overflow-hidden">
                                <img src="/images/masters/myeongwol_landing.jpeg" alt="명월 도사" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06] via-transparent to-transparent"></div>
                                <div className="absolute bottom-4 left-6">
                                    <h3 className="text-2xl font-black text-white">명월 도사</h3>
                                    <p className="text-primary text-sm font-bold">命理 · 處方 大家</p>
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">오행 처방</span>
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">비방 예술</span>
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">명리 분석</span>
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">인테리어 처방</span>
                                </div>
                                <p className="text-slate-400 leading-relaxed text-sm mb-6">
                                    풍수의 진단 결과를 예술적 비방(처방)으로 풀어내는 명리학의 대가.
                                    부족한 오행을 채워주는 디지털 비방 아트, 12간지 오브제 처방,
                                    인테리어 교정 등 실질적 해결책을 제시합니다.
                                </p>
                                <div className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.06]">
                                    <p className="text-white italic text-sm leading-relaxed">
                                        "병이 있으면 약이 있고, 기운이 부족하면 비방이 있는 법이지요.
                                        공간에 맞는 정확한 처방을 내리는 것이 진정한 풍수의 완성이랍니다."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Collaboration Banner */}
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl border border-primary/20 p-8 md:p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0"></div>
                        <div className="flex items-center justify-center gap-6 mb-6">
                            <img src="/images/masters/cheongpung.jpeg" alt="청풍 도사" className="w-16 h-16 rounded-full border-2 border-primary/30 object-cover object-top" />
                            <div className="w-10 h-10 rounded-full bg-[#0c0a06] border-2 border-primary/30 flex items-center justify-center">
                                <span className="text-lg">☯</span>
                            </div>
                            <img src="/images/masters/myeongwol.jpeg" alt="명월 도사" className="w-16 h-16 rounded-full border-2 border-primary/30 object-cover object-top" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-3">감정(診) + 처방(方) = 완벽한 풍수</h3>
                        <p className="text-slate-300 max-w-lg mx-auto text-sm leading-relaxed">
                            청풍 도사가 공간의 기운을 읽고, 명월 도사가 맞춤 처방을 내립니다.<br />
                            진단과 치유가 하나로 이어지는 원스톱 풍수 서비스입니다.
                        </p>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* SECTION 4 — HOW IT WORKS */}
            {/* ============================================ */}
            <section id="how" className="relative py-28 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <div className="flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mx-auto mb-6">
                            <Zap className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">이용 방법</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                            사진 한 장으로 완성되는<br /><span className="text-primary">AI 풍수 감정</span>
                        </h2>
                    </div>

                    {/* Steps */}
                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { step: '01', icon: Eye, title: '사진 업로드', desc: '분석할 공간의 사진을 올리거나 주소를 입력합니다.', master: '청풍' },
                            { step: '02', icon: Compass, title: 'AI 풍수 감정', desc: '청풍 도사의 지리학적 분석이 시작됩니다. 오행, 방위, 기의 흐름을 읽습니다.', master: '청풍' },
                            { step: '03', icon: Sparkles, title: '비방 처방', desc: '명월 도사가 부족한 오행을 채우는 디지털 비방 아트를 생성합니다.', master: '명월' },
                            { step: '04', icon: Target, title: '맞춤 인테리어', desc: '실제 적용 가능한 인테리어 처방과 오브제 추천을 받습니다.', master: '명월' },
                        ].map((item, i) => (
                            <div key={i} className="relative text-center group">
                                {i < 3 && (
                                    <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-primary/30 to-primary/10"></div>
                                )}
                                <div className="w-24 h-24 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-6 group-hover:border-primary/30 transition-all relative">
                                    <item.icon className="w-10 h-10 text-primary" />
                                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-[#221e10] flex items-center justify-center text-xs font-black">{item.step}</div>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-3">{item.desc}</p>
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary/70">
                                    <img src={`/images/masters/${item.master === '청풍' ? 'cheongpung' : 'myeongwol'}.jpeg`} alt={item.master} className="w-5 h-5 rounded-full object-cover object-top border border-primary/30" />
                                    {item.master} 도사 담당
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* SECTION 5 — TRUST / ACCURACY */}
            {/* ============================================ */}
            <section id="trust" className="relative py-28 px-6">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent"></div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-20">
                        <div className="flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mx-auto mb-6">
                            <Award className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">신뢰와 정확성</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                            왜 <span className="text-primary">풍수지리 AI</span>를<br />사용해야 하나요?
                        </h2>
                    </div>

                    {/* Master Quote — 명월 */}
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/[0.06] p-8 md:p-12 mb-16 relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/5 rounded-full blur-[80px]"></div>
                        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                            <div className="flex-shrink-0">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg">
                                    <img src="/images/masters/myeongwol.jpeg" alt="명월 도사" className="w-full h-full object-cover object-top" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-primary font-bold text-sm">명월 도사</span>
                                    <span className="text-slate-600 text-xs">命理學 大家 · 디지털 비방 창시</span>
                                </div>
                                <blockquote className="text-xl md:text-2xl font-bold text-white leading-relaxed italic mb-6">
                                    "우리가 40년간 현장에서 쌓아온 감각을 AI에 고스란히 담았습니다.
                                    <span className="text-primary"> 이제 누구든, 어디서든</span>,
                                    대가의 풍수 처방을 받을 수 있는 시대가 열렸습니다."
                                </blockquote>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                        {[
                            { number: '40+', label: '년 실전 경력', icon: Award },
                            { number: '98%', label: '이용자 만족도', icon: Star },
                            { number: '3,000+', label: '누적 감정 건수', icon: Target },
                            { number: '24/7', label: '즉시 분석 가능', icon: Zap },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6 text-center hover:border-primary/20 transition-all">
                                <stat.icon className="w-6 h-6 text-primary mx-auto mb-3" />
                                <div className="text-3xl md:text-4xl font-black text-primary mb-1">{stat.number}</div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Trust Points */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { title: '실제 대가의 지식 기반', desc: '인터넷 정보가 아닌, 40년간 현장에서 검증된 실전 풍수 이론을 학습했습니다.' },
                            { title: '과학적 환경 심리학 결합', desc: '전통 풍수에 현대 환경 심리학, 색채학, 공간 디자인 원리를 접목합니다.' },
                            { title: '개인 맞춤형 처방', desc: '생년, 성별, 공간 유형을 고려한 사주 기반 맞춤 분석으로 정확도를 높입니다.' },
                            { title: '시각적 결과물 제공', desc: '추상적 조언이 아닌, 실제 적용 가능한 비방 아트와 인테리어 처방을 제공합니다.' },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 items-start bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04] hover:border-primary/15 transition-all">
                                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* SECTION 6 — FINAL CTA */}
            {/* ============================================ */}
            <section className="relative py-28 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <img src="/images/masters/cheongpung.jpeg" alt="청풍 도사" className="w-14 h-14 rounded-full border-2 border-primary/30 object-cover object-top" />
                        <img src="/images/masters/myeongwol.jpeg" alt="명월 도사" className="w-14 h-14 rounded-full border-2 border-primary/30 object-cover object-top" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                        공간의 기운을 바꾸면<br /><span className="text-primary">삶의 흐름</span>이 달라집니다
                    </h2>
                    <p className="text-slate-400 max-w-lg mx-auto mb-10 leading-relaxed">
                        청풍 도사와 명월 도사가 함께 당신의 공간을 감정합니다.
                        지금 바로 무료로 시작해 보세요.
                    </p>
                    <a href="/" className="group inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-10 text-lg font-bold text-[#221e10] transition-all hover:bg-yellow-400 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                        무료 풍수 감정 받기
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </a>
                </div>
            </section>

            {/* ============================================ */}
            {/* FOOTER */}
            {/* ============================================ */}
            <footer className="border-t border-white/[0.06] py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <Compass className="w-5 h-5 text-primary" />
                        <span className="font-bold text-white">풍수지리 AI</span>
                    </div>
                    <p className="text-slate-500 text-xs text-center max-w-md leading-relaxed">
                        본 서비스는 40년 대가의 풍수 이론을 학습한 AI가 제공하는 분석 결과입니다.
                        엔터테인먼트 및 인테리어 참고용으로 활용하시길 권장합니다.
                    </p>
                    <p className="text-slate-600 text-[10px]">© Feng Shui Grand Master AI</p>
                </div>
            </footer>

            {/* ============================================ */}
            {/* STYLES */}
            {/* ============================================ */}
            <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.8s ease-out forwards;
        }

        @keyframes scrollDown {
          0% { transform: translateY(0); opacity: 1; }
          60% { transform: translateY(6px); opacity: 0.5; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .scroll-indicator {
          animation: scrollDown 1.5s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          25% { transform: translateY(-80px) translateX(15px); opacity: 0.5; }
          50% { transform: translateY(-160px) translateX(-10px); opacity: 0.2; }
          75% { transform: translateY(-80px) translateX(-15px); opacity: 0.4; }
        }
        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #f2b90d;
          border-radius: 50%;
          opacity: 0.2;
        }
        .particle-1 { bottom: 15%; left: 8%; animation: float 9s ease-in-out infinite; }
        .particle-2 { bottom: 25%; left: 25%; animation: float 11s ease-in-out infinite 1s; width: 2px; height: 2px; }
        .particle-3 { bottom: 10%; right: 15%; animation: float 13s ease-in-out infinite 2s; width: 4px; height: 4px; }
        .particle-4 { bottom: 20%; right: 35%; animation: float 10s ease-in-out infinite 3s; }
        .particle-5 { bottom: 35%; left: 55%; animation: float 12s ease-in-out infinite 4s; width: 2px; height: 2px; }
        .particle-6 { bottom: 5%; left: 70%; animation: float 8s ease-in-out infinite 2s; }
      `}</style>
        </div>
    );
}
