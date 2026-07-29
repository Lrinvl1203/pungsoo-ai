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
                                    <td className="py-2 pr-4">업로드 이미지, 주소·지도 핀 좌표, 선택한 추정 방위각, 접속 IP·이용 기록</td>
                                    <td className="py-2">풍수 분석, 위치·방위 확인, 서비스 보안 및 사용량 제한</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. 개인정보의 이용 및 보유 기간</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>회원 정보:</strong> 계정 삭제 요청이 처리될 때까지 Supabase에 저장됩니다.</li>
                            <li><strong>분석 이력:</strong> 사용자가 마이페이지에서 단건 또는 전체 삭제할 때까지 저장됩니다.</li>
                            <li><strong>업로드 이미지:</strong> 내부 공간 분석을 위해 Google Gemini API로 전송됩니다. 원본 사진은 분석 이력 DB와 브라우저 로컬 이력에 저장하지 않으며, 현재 화면을 벗어나거나 새 사진을 선택하면 브라우저 메모리에서 제거됩니다.</li>
                            <li><strong>To-Be 편집 이미지:</strong> 편집 요청 시 fal.ai storage에 임시 업로드되어 처리됩니다. 외부 서비스에서의 처리·보유는 해당 제공자의 정책을 따릅니다.</li>
                            <li><strong>생성 이미지 URL:</strong> 사용자가 생성한 비방화·수호 오브제·To-Be 이미지 URL은 분석 이력과 함께 저장되며 마이페이지에서 분석 이력을 삭제하면 서비스 DB의 URL 기록도 함께 제거됩니다. 외부 생성 서비스의 원본 보유는 해당 제공자의 정책을 따릅니다.</li>
                            <li><strong>결제·주문 정보:</strong> 결제 확인, 환불 및 주문 관리를 위해 필요한 최소 정보가 저장되며 법령상 보존 의무가 있는 경우 해당 기간 동안 보관될 수 있습니다.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. 개인정보의 제3자 제공</h2>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p>분석과 이미지 생성을 위해 다음 외부 처리 서비스로 필요한 정보가 전송됩니다:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>Google Gemini:</strong> 업로드 이미지 또는 지도 이미지, 주소·공간 정보, 분석에 필요한 사용자 입력을 AI 분석 목적으로 전송</li>
                                <li><strong>fal.ai:</strong> To-Be 편집용 이미지와 이미지 생성 프롬프트·처방 정보를 이미지 생성 목적으로 전송</li>
                                <li><strong>Esri ArcGIS:</strong> 사용자가 확인한 지도 핀 주변의 정적 위성·도로 이미지를 불러오기 위해 위도·경도 전송</li>
                                <li><strong>Polar 등 결제대행사:</strong> 결제 처리에 필요한 최소 주문·고객 정보 전송</li>
                            </ul>
                            <p className="mt-3">그 밖에는 사용자의 동의가 있거나 법령상 의무가 있는 경우에만 제공합니다.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. 이용되는 외부 서비스</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Google Gemini API:</strong> 업로드 이미지·지도와 사용자 입력을 이용한 AI 풍수 분석</li>
                            <li><strong>fal.ai:</strong> To-Be 이미지 편집용 storage 업로드와 비방화·수호 오브제 이미지 생성</li>
                            <li><strong>Esri ArcGIS:</strong> 지도 핀 확인과 외부 입지 분석용 정적 위성·도로 이미지 제공</li>
                            <li><strong>Supabase:</strong> 사용자 인증 및 데이터 저장 (회원 정보, 분석 이력)</li>
                            <li><strong>Polar 등 결제대행사:</strong> 안전한 결제 처리, 결제 확인, 환불 처리</li>
                            <li><strong>Resend:</strong> 주문 확인 이메일 발송</li>
                            <li><strong>카카오 로컬 API:</strong> 주소 검색</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. 사용자의 권리</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.</li>
                            <li>분석 이력은 마이페이지에서 단건 또는 전체 삭제할 수 있으며 Supabase의 해당 분석 데이터도 함께 삭제됩니다.</li>
                            <li>계정, 결제·주문 정보의 삭제는 개인정보 보호 책임자 이메일로 요청할 수 있습니다. 법령상 보존 대상은 의무 기간 종료 후 삭제됩니다.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">6. 개인정보 보호 책임자</h2>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p>문의사항이 있으시면 아래로 연락해 주세요:</p>
                            <p className="mt-2">📧 이메일: <a href="mailto:lrinvl1203@gmail.com" className="text-primary hover:underline">lrinvl1203@gmail.com</a></p>
                        </div>
                    </section>

                    <p className="text-slate-500 text-xs mt-12">시행일: 2026년 7월 30일</p>
                </div>
            </main>
        </div>
    );
}
