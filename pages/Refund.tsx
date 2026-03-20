import React from 'react';
import { ArrowLeft, ShieldCheck, AlertTriangle, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Refund() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#0c0a06] text-slate-100 font-display">
            <header className="sticky top-0 z-40 bg-[#0c0a06]/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 py-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-300" />
                    </button>
                    <h1 className="text-lg font-bold text-white tracking-tight">환불 및 취소 정책</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
                <section className="bg-[#1a1508] border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                        <ShieldCheck className="w-5 h-5" />
                        <h2 className="text-lg font-bold">디지털 콘텐츠 (감명서 / 비방 아트 / 오브제 설계)</h2>
                    </div>
                    <ul className="text-slate-300 text-sm leading-relaxed space-y-3 list-disc list-inside">
                        <li>디지털 콘텐츠의 특성상, <strong className="text-white">결제 완료 후 콘텐츠가 제공(잠금 해제)된 경우 환불이 불가</strong>합니다.</li>
                        <li>이는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항 제5호에 근거합니다.</li>
                        <li>결제 후 콘텐츠가 정상적으로 제공되지 않은 경우(서버 오류, 로딩 실패 등)에는 전액 환불해 드립니다.</li>
                        <li>중복 결제가 확인된 경우, 중복분에 대해 전액 환불 처리됩니다.</li>
                    </ul>
                </section>

                <section className="bg-[#1a1508] border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                        <ShieldCheck className="w-5 h-5" />
                        <h2 className="text-lg font-bold">실물 제작 의뢰 (액자 / 오브제 제작)</h2>
                    </div>
                    <ul className="text-slate-300 text-sm leading-relaxed space-y-3 list-disc list-inside">
                        <li><strong className="text-white">제작 착수 전:</strong> 의뢰 접수 후 제작이 시작되기 전까지는 전액 환불 가능합니다.</li>
                        <li><strong className="text-white">제작 착수 후:</strong> 맞춤 제작 상품의 특성상, 제작이 시작된 이후에는 환불이 불가합니다.</li>
                        <li><strong className="text-white">불량/파손:</strong> 배송 중 파손 또는 제작 하자가 확인된 경우, 수령일로부터 7일 이내에 연락 주시면 교환 또는 환불 처리해 드립니다.</li>
                    </ul>
                </section>

                <section className="bg-[#1a1508] border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-yellow-400">
                        <AlertTriangle className="w-5 h-5" />
                        <h2 className="text-lg font-bold text-white">환불 신청 방법</h2>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        아래 연락처로 <strong className="text-white">주문 번호</strong>와 <strong className="text-white">환불 사유</strong>를 알려주시면 영업일 기준 1~3일 내에 처리해 드립니다.
                    </p>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-3 border border-white/5">
                            <Mail className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-slate-200 text-sm">lrinvl1203@gmail.com</span>
                        </div>
                    </div>
                </section>

                <p className="text-slate-500 text-xs text-center pt-4">
                    본 정책은 2026년 3월 20일부터 적용됩니다.
                </p>
            </main>
        </div>
    );
}
