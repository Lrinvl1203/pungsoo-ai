import React from 'react';
import { Compass, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#1a1710] text-slate-200">
            <header className="border-b border-white/10 bg-[#221e10]/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
                    <Link to="/" className="flex items-center gap-3 text-white hover:text-primary transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <div className="flex items-center gap-2">
                            <Compass className="w-5 h-5 text-primary" />
                            <span className="font-bold">풍수지리 AI</span>
                        </div>
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-black text-white mb-8">이용약관</h1>
                <div className="prose prose-invert prose-sm max-w-none space-y-8 text-slate-300 leading-relaxed">

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">제1조 (목적)</h2>
                        <p>본 약관은 풍수지리 AI (이하 "서비스")가 제공하는 AI 기반 풍수 분석, 디지털 비방 아트 생성, 비방 오브제 제작 의뢰 등 모든 서비스의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">제2조 (서비스의 내용)</h2>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li><strong>AI 풍수 분석:</strong> 사용자가 업로드한 공간 이미지 또는 입력한 주소를 기반으로 AI가 풍수지리 관점에서 분석 결과를 제공합니다.</li>
                            <li><strong>디지털 비방 아트:</strong> 분석 결과에 기반하여 AI가 맞춤형 디지털 아트를 생성합니다.</li>
                            <li><strong>12간지 비방 오브제:</strong> 사용자의 생년에 맞는 12간지 비방 오브제 이미지를 생성합니다.</li>
                            <li><strong>액자/오브제 제작 의뢰:</strong> 유료 결제를 통해 실물 제작을 의뢰할 수 있습니다.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">제3조 (면책 조항)</h2>
                        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                            <p className="text-primary font-bold mb-2">⚠️ 중요 안내</p>
                            <p>본 서비스는 40년 경력 풍수 대가의 이론을 학습한 AI가 제공하는 분석입니다. <strong>엔터테인먼트 및 인테리어 참고 목적</strong>으로 제작되었으며, 과학적·의학적·법적 근거가 있는 조언이 아닙니다.</p>
                        </div>
                        <ul className="list-disc pl-5 space-y-2 mt-3">
                            <li>분석 결과에 따른 의사결정 및 그 결과에 대한 책임은 전적으로 사용자에게 있습니다.</li>
                            <li>AI 분석의 정확성, 완전성, 적시성을 보장하지 않습니다.</li>
                            <li>서비스 이용으로 인한 직접적·간접적 손해에 대해 책임을 지지 않습니다.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">제4조 (결제 및 환불)</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>유료 서비스(액자/오브제 제작 의뢰)는 토스페이먼츠를 통해 결제됩니다.</li>
                            <li><strong>결제 후 제작 착수 전:</strong> 전액 환불 가능 (결제 후 24시간 이내)</li>
                            <li><strong>제작 착수 후:</strong> 환불 불가 (제작 시작 안내 이메일 발송 후)</li>
                            <li>제품 하자 시 수령 후 7일 이내 교환 또는 환불 가능합니다.</li>
                            <li>환불 요청은 이메일(lrinvl1203@gmail.com)로 접수해 주세요.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">제5조 (지적재산권)</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>AI가 생성한 디지털 아트의 저작권은 서비스 제공자에게 귀속됩니다.</li>
                            <li>유료 결제 사용자에게는 개인 비상업적 사용권이 부여됩니다.</li>
                            <li>서비스의 UI, 코드, 디자인 등은 서비스 제공자의 지적재산입니다.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">제6조 (서비스 변경 및 중단)</h2>
                        <p>서비스 제공자는 운영상·기술상 이유로 서비스의 전부 또는 일부를 변경하거나 중단할 수 있으며, 이 경우 사전 공지합니다.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">제7조 (준거법)</h2>
                        <p>본 약관은 대한민국 법률에 따라 규율되며, 분쟁 발생 시 서울중앙지방법원을 제1심 관할법원으로 합니다.</p>
                    </section>

                    <p className="text-slate-500 text-xs mt-12">시행일: 2026년 3월 5일</p>
                </div>
            </main>
        </div>
    );
}
