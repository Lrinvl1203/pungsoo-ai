import React, { useState } from 'react';
import { Sparkles, Compass, Shield, Eye, Zap, ArrowRight, CheckCircle2, Star, Users, Target, Heart, Send, TrendingUp, Award, BookOpen, Clock, ChevronRight } from 'lucide-react';
import Onboarding from '../components/Onboarding';
import DailyFengShui from '../components/DailyFengShui';

export default function Landing() {
    // Onboarding State
    const [showOnboarding, setShowOnboarding] = useState(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('onboarding') === 'true') {
                return true;
            }
            return localStorage.getItem('PUNGSOO_ONBOARDING_COMPLETED') !== 'true';
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
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">대한민국 최초 듀얼 페르소나 풍수 AI</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight text-white mb-6 text-shadow-xl">
                            당신의 공간이<br />
                            <span className="text-primary">운명을 결정합니다</span>
                        </h1>
                        <p className="text-xl leading-relaxed text-slate-300 max-w-xl mb-12 text-shadow">
                            40년 경력 청풍 도사의 <strong className="text-white">공간 진단</strong>과
                            명월 도사의 <strong className="text-white">맞춤 비방 처방</strong>.<br />
                            사진 한 장으로 두 대가의 완벽한 풍수 솔루션을 경험하세요.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-16">
                            <a href="/analyze" className="group flex h-16 items-center justify-center gap-3 rounded-2xl bg-primary px-10 text-lg font-bold text-[#221e10] transition-all hover:bg-yellow-400 hover:scale-105 shadow-xl shadow-primary/20">
                                무료로 공간 진단하기
                                <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                            </a>
                            <a href="#why" className="flex h-16 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-8 text-lg font-medium text-white backdrop-blur-md transition-all hover:bg-white/10">
                                결과 미리보기
                            </a>
                        </div>

                        {/* Social Proof Bar */}
                        <div className="flex flex-wrap items-center gap-8 py-6 border-t border-white/10 backdrop-blur-sm bg-[#0c0a06]/40 rounded-3xl px-8">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-3">
                                    <img src="https://i.pravatar.cc/100?img=1" className="w-10 h-10 rounded-full border-2 border-[#1a1508]" alt="User" />
                                    <img src="https://i.pravatar.cc/100?img=2" className="w-10 h-10 rounded-full border-2 border-[#1a1508]" alt="User" />
                                    <img src="https://i.pravatar.cc/100?img=3" className="w-10 h-10 rounded-full border-2 border-[#1a1508]" alt="User" />
                                    <div className="w-10 h-10 rounded-full border-2 border-[#1a1508] bg-primary flex items-center justify-center text-[#1a1508] font-bold text-xs">+1K</div>
                                </div>
                                <div>
                                    <div className="flex text-primary mb-1">
                                        <Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" />
                                    </div>
                                    <div className="text-xs font-bold text-slate-400">1,247명 감정 완료</div>
                                </div>
                            </div>
                            <div className="w-px h-10 bg-white/10 hidden md:block"></div>
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-primary" />
                                <div>
                                    <div className="text-sm font-bold text-white">즉시 분석 가능</div>
                                    <div className="text-xs text-slate-400">평균 소요시간 30초</div>
                                </div>
                            </div>
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
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">공간의 차이가 운명의 차이</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6">현대 환경심리학이 증명한 <span className="text-primary">명당의 비밀</span></h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">미신이 아닙니다. 색채, 채광, 배치가 스트레스 지수와 업무 능률에 미치는 영향은 숱한 논문을 통해 입증되었습니다.</p>
                    </div>

                    {/* Before/After Showcase */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
                        <div className="relative group">
                            {/* Comparison Slider Concept (Static for now) */}
                            <div className="relative rounded-3xl overflow-hidden border border-white/10 aspect-video shadow-2xl">
                                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                                    <span className="text-slate-500 font-bold">인테리어 비교 이미지 영역</span>
                                </div>
                                {/* Mockup label */}
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
                                    { icon: Shield, title: "화(火)와 수(水)의 충돌 방지", desc: "주방의 가스레인지와 싱크대 배치를 교정하여 부부 갈등의 원인을 제거합니다." },
                                    { icon: TrendingUp, title: "배산임수의 원리 적용", desc: "침대의 헤드 방향을 안정적인 벽으로 향하게 하여 수면 중 기운 누출을 막습니다." },
                                    { icon: Eye, title: "현관 기운 정화", desc: "집의 첫인상인 현관의 거울 위치를 조정하여 밖에서 들어오는 좋은 기운을 반사시키지 않게 합니다." }
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
                                "공간은 사람의 그릇이오. 그릇이 깨져 있으면 재물이 새고, 그릇이 곧으면 사람이 모이는 법이지요. 작은 구조 변경만으로도 운의 흐름을 확연히 바꿀 수 있소이다."
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
                        <div className="bg-gradient-to-br from-[#1a1508] to-[#0c0a06] p-12 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
                            <img src="/images/masters/cheongpung.jpeg" className="w-16 h-16 rounded-full border-2 border-primary mb-6 relative z-10" alt="청풍" />
                            <h3 className="text-3xl font-black text-white mb-2 relative z-10">진단(診) 담당 : 청풍 도사</h3>
                            <p className="text-primary font-bold text-sm mb-6 relative z-10">지리·풍수 대가 | 산세 및 공간 기운 감정</p>
                            <ul className="space-y-3 mb-8 relative z-10">
                                <li className="flex gap-2 items-center text-slate-300"><CheckCircle2 className="w-4 h-4 text-primary" /> 터와 지기의 길흉 분석</li>
                                <li className="flex gap-2 items-center text-slate-300"><CheckCircle2 className="w-4 h-4 text-primary" /> 방위와 사신사(四神砂) 판별</li>
                                <li className="flex gap-2 items-center text-slate-300"><CheckCircle2 className="w-4 h-4 text-primary" /> 수맥 및 흉살 요인 탐지</li>
                            </ul>
                        </div>
                        {/* Myeongwol Side */}
                        <div className="bg-gradient-to-tl from-[#1a1508] to-[#0c0a06] p-12 relative overflow-hidden border-t md:border-t-0 md:border-l border-white/5">
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
                            <img src="/images/masters/myeongwol.jpeg" className="w-16 h-16 rounded-full border-2 border-primary mb-6 relative z-10" alt="명월" />
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
            {/* 5. URGENCY & CTA */}
            {/* ============================================ */}
            <section className="relative py-32 border-t border-white/10 bg-gradient-to-b from-transparent to-primary/5">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="inline-block animate-bounce mb-8">
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-2 rounded-full font-bold shadow-lg shadow-red-500/10">
                            🔥 일일 무료 분석 한도 300명 (잔여: 14명)
                        </div>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
                        운명의 흐름을 바꿀<br />가장 <span className="text-primary">완벽한 타이밍</span>
                    </h2>

                    <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
                        더 이상 나쁜 기운이 머무는 공간에 방치하지 마세요.<br />청풍과 명월, 두 대가가 지금 당신의 공간을 기다립니다.
                    </p>

                    <a href="/analyze" className="group inline-flex h-20 items-center justify-center gap-4 rounded-full bg-primary px-12 text-2xl font-black text-[#221e10] transition-all hover:bg-yellow-400 hover:scale-105 shadow-2xl shadow-primary/30">
                        무료 감정 시작하기
                        <ArrowRight className="w-8 h-8 transition-transform group-hover:translate-x-2" />
                    </a>

                    {/* Mini Testimonials */}
                    <div className="mt-16 grid md:grid-cols-2 gap-6 text-left">
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl">
                            <div className="flex text-primary mb-3"><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /></div>
                            <p className="text-sm text-slate-300 font-medium mb-4">"침대 방향을 바꾸라는 조언대로 한 뒤, 거짓말처럼 몇 년간 시달리던 불면증이 사라졌습니다. 처방해주신 연꽃 비방 아트를 폰 배경으로 쓰고 있어요."</p>
                            <div className="text-xs text-slate-500 font-bold">- 김*영 님 (아파트 안방 감정)</div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl">
                            <div className="flex text-primary mb-3"><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /></div>
                            <p className="text-sm text-slate-300 font-medium mb-4">"오픈한 카페의 매출이 오르지 않아 고민이었는데, 현관 거울 위치와 목(木) 기운 부족을 짚어주셨어요. 화분 2개를 적재적소에 놓았더니 손님이 늘었습니다."</p>
                            <div className="text-xs text-slate-500 font-bold">- 이*준 님 (상가 감정)</div>
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
                        본 서비스는 두 대가의 40년 풍수 이론을 학습한 AI가 제공합니다.<br />엔터테인먼트 및 인테리어 기획 단계의 참고용으로 활용하시길 권장합니다.
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
