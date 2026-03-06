import React from 'react';
import { Compass, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
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
                <h1 className="text-3xl font-black text-white mb-8">개인정보처리방침</h1>
                <div className="prose prose-invert prose-sm max-w-none space-y-8 text-slate-300 leading-relaxed">

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. 수집하는 개인정보</h2>
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="text-left py-2 pr-4 text-primary font-bold">구분</th>
                                    <th className="text-left py-2 pr-4 text-primary font-bold">수집 항목</th>
                                    <th className="text-left py-2 text-primary font-bold">수집 목적</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                <tr className="border-b border-white/10">
                                    <td className="py-2 pr-4">필수</td>
                                    <td className="py-2 pr-4">Google 계정 정보 (이메일, 이름)</td>
                                    <td className="py-2">회원 식별 및 로그인</td>
                                </tr>
                                <tr className="border-b border-white/10">
                                    <td className="py-2 pr-4">선택</td>
                                    <td className="py-2 pr-4">출생연도, 성별</td>
                                    <td className="py-2">풍수 분석 정확도 향상</td>
                                </tr>
                                <tr className="border-b border-white/10">
                                    <td className="py-2 pr-4">주문 시</td>
                                    <td className="py-2 pr-4">이름, 연락처</td>
                                    <td className="py-2">제작 의뢰 접수 및 회신</td>
                                </tr>
                                <tr className="border-b border-white/10">
                                    <td className="py-2 pr-4">자동 수집</td>
                                    <td className="py-2 pr-4">업로드 이미지, 주소 정보</td>
                                    <td className="py-2">풍수 분석 수행</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. 개인정보의 이용 및 보유 기간</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>회원 정보:</strong> 회원 탈퇴 시까지 (Supabase에 안전하게 저장)</li>
                            <li><strong>분석 이력:</strong> 회원 탈퇴 시 또는 사용자 삭제 요청 시 즉시 파기</li>
                            <li><strong>업로드 이미지:</strong> 분석 완료 후 서버에 저장하지 않음 (클라이언트에서만 처리)</li>
                            <li><strong>결제 정보:</strong> 토스페이먼츠에서 관리하며 본 서비스에 저장하지 않음</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. 개인정보의 제3자 제공</h2>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p>본 서비스는 아래의 경우를 제외하고 사용자의 개인정보를 제3자에게 제공하지 않습니다:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>사용자의 사전 동의가 있는 경우</li>
                                <li>법령에 의한 요청이 있는 경우</li>
                                <li>결제 처리를 위해 토스페이먼츠에 필요 최소한의 정보 전달</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. 이용되는 외부 서비스</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Google Gemini API:</strong> AI 풍수 분석 및 이미지 생성 (이미지는 분석 후 즉시 폐기)</li>
                            <li><strong>Supabase:</strong> 사용자 인증 및 데이터 저장 (회원 정보, 분석 이력)</li>
                            <li><strong>토스페이먼츠:</strong> 안전한 결제 처리</li>
                            <li><strong>Resend:</strong> 주문 확인 이메일 발송</li>
                            <li><strong>카카오 로컬 API:</strong> 주소 검색</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. 사용자의 권리</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.</li>
                            <li>회원 탈퇴를 통해 모든 개인정보를 즉시 삭제할 수 있습니다.</li>
                            <li>분석 이력은 마이페이지에서 직접 삭제할 수 있습니다.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">6. 개인정보 보호 책임자</h2>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p>문의사항이 있으시면 아래로 연락해 주세요:</p>
                            <p className="mt-2">📧 이메일: <a href="mailto:lrinvl1203@gmail.com" className="text-primary hover:underline">lrinvl1203@gmail.com</a></p>
                        </div>
                    </section>

                    <p className="text-slate-500 text-xs mt-12">시행일: 2026년 3월 5일</p>
                </div>
            </main>
        </div>
    );
}
