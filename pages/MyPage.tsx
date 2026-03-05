import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserSettings } from '../hooks/useUserSettings';
import {
    ArrowLeft, User, LogOut, Clock, ShoppingBag,
    Image as ImageIcon, Settings, Trash2, ShieldCheck, Download
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface HistoryItem {
    result: AnalysisResult;
    image: string;
    remedyArt: string;
    zodiacImage: string | null;
}

export default function MyPage() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { settings, updateSettings } = useUserSettings();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'orders' | 'gallery' | 'settings'>('history');

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        const savedHistory = localStorage.getItem('pungsoo_history');
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error('Failed to parse history', e);
            }
        }
    }, [user, navigate]);

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (e) {
            console.error(e);
            alert('로그아웃 처리 중 오류가 발생했습니다.');
        }
    };

    const handleDeleteHistoryItem = (index: number) => {
        if (window.confirm('이 분석 기록을 삭제하시겠습니까?')) {
            const newHistory = [...history];
            newHistory.splice(index, 1);
            setHistory(newHistory);
            localStorage.setItem('pungsoo_history', JSON.stringify(newHistory));
        }
    };

    const handleClearHistory = () => {
        if (window.confirm('모든 분석 기록을 삭제하시겠습니까?')) {
            setHistory([]);
            localStorage.removeItem('pungsoo_history');
        }
    };

    const downloadImage = (dataUrl: string, filename: string) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.click();
    };

    if (!user) return null;

    const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || '회원';
    const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    const provider = user?.app_metadata?.provider || '이메일';
    const joinDate = new Date(user?.created_at || '').toLocaleDateString('ko-KR');

    const galleryImages = history.flatMap(h => {
        const images = [];
        if (h.remedyArt) images.push({ url: h.remedyArt, keyword: h.result.remedy_art.solution_keyword });
        if (h.zodiacImage) images.push({ url: h.zodiacImage, keyword: h.result.zodiac_remedy_object?.animal || '12간지 비방' });
        return images;
    });

    return (
        <div className="min-h-screen bg-[#0c0a06] text-slate-100 font-display selection:bg-primary/30 antialiased overflow-x-hidden">
            {/* Header */}
            <header className="bg-[#1a1508]/80 backdrop-blur-xl border-b border-white/10 py-4 px-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm">메인으로</span>
                    </button>
                    <h1 className="text-xl font-bold text-white tracking-tight">마이페이지</h1>
                    <div className="w-20" /> {/* Spacer for centering */}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Sidebar / Profile Card */}
                    <div className="w-full md:w-72 shrink-0 space-y-6 fade-in-up">
                        <div className="bg-[#1a1508] rounded-3xl p-6 shadow-2xl border border-white/5 text-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                            <div className="w-24 h-24 mx-auto bg-black/40 rounded-full flex items-center justify-center border-2 border-primary/30 mb-5 overflow-hidden shadow-inner relative z-10">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-primary" />
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight relative z-10">{displayName}</h2>
                            <p className="text-sm text-slate-400 mb-5 truncate relative z-10">{user.email}</p>

                            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300 bg-white/5 py-2.5 rounded-xl border border-white/10 mb-6 relative z-10">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                {provider === 'kakao' ? '카카오' : provider === 'google' ? 'Google' : provider} 계정 연동
                            </div>

                            <div className="flex justify-between text-xs text-slate-400 border-t border-white/10 pt-5 mb-5 px-2 relative z-10">
                                <span>가입일</span>
                                <span className="font-bold text-slate-200">{joinDate}</span>
                            </div>

                            <button
                                onClick={handleSignOut}
                                className="w-full py-3 mt-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-red-500/20 relative z-10"
                            >
                                <LogOut className="w-4 h-4" /> 로그아웃
                            </button>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex flex-col bg-[#1a1508] rounded-3xl p-3 shadow-2xl border border-white/5">
                            {[
                                { id: 'history', label: '나의 풍수 분석 기록', icon: Clock },
                                { id: 'orders', label: '의뢰 및 주문 내역', icon: ShoppingBag },
                                { id: 'gallery', label: '나의 비방 컬렉션', icon: ImageIcon },
                                { id: 'settings', label: '설정 및 기본 정보', icon: Settings },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all text-left group ${activeTab === tab.id
                                        ? 'bg-primary text-[#0c0a06] shadow-lg shadow-primary/20'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[#0c0a06]' : 'text-slate-500 group-hover:text-primary'}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Mobile Navigation */}
                        <div className="md:hidden flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                            {[
                                { id: 'history', label: '분석 기록', icon: Clock },
                                { id: 'orders', label: '주문 내역', icon: ShoppingBag },
                                { id: 'gallery', label: '컬렉션', icon: ImageIcon },
                                { id: 'settings', label: '설정', icon: Settings },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-5 py-3 shrink-0 rounded-2xl font-bold text-sm transition-all ${activeTab === tab.id
                                        ? 'bg-primary text-[#0c0a06] shadow-lg shadow-primary/20'
                                        : 'bg-[#1a1508] text-slate-400 border border-white/10'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1">
                        {activeTab === 'history' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">나의 풍수 분석 기록</h3>
                                    {history.length > 0 && (
                                        <button
                                            onClick={handleClearHistory}
                                            className="text-xs font-bold text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" /> 전체 삭제
                                        </button>
                                    )}
                                </div>

                                {history.length === 0 ? (
                                    <div className="bg-[#1a1508]/50 border-2 border-dashed border-white/10 rounded-3xl p-10 md:p-16 text-center">
                                        <Clock className="w-16 h-16 text-white/10 mx-auto mb-6" />
                                        <p className="text-slate-400 font-medium text-lg">아직 분석 기록이 없습니다.</p>
                                        <button
                                            onClick={() => navigate('/analyze')}
                                            className="mt-8 px-8 py-4 bg-primary text-[#0c0a06] text-sm font-bold rounded-2xl hover:bg-yellow-400 transition-all shadow-lg hover:-translate-y-1"
                                        >
                                            풍수 분석 시작하기
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {history.map((item, idx) => (
                                            <div key={idx} className="bg-[#1a1508] rounded-3xl p-5 md:p-6 shadow-xl border border-white/5 flex flex-col sm:flex-row gap-6 group hover:border-primary/30 transition-all hover:shadow-primary/5">
                                                <div className="w-full sm:w-40 aspect-square rounded-2xl overflow-hidden bg-black/50 border border-white/10 shrink-0 relative">
                                                    <img src={item.remedyArt} alt="Remedy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-black tracking-widest uppercase shadow-sm">
                                                            {item.result.feng_shui_score}점
                                                        </span>
                                                        <button
                                                            onClick={() => handleDeleteHistoryItem(idx)}
                                                            className="text-slate-600 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <h4 className="font-bold text-white text-lg mb-2 line-clamp-1">{item.result.analysis_summary}</h4>
                                                    <p className="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                                                        {item.result.remedy_art.deficiency} 처방
                                                        {item.result.zodiac_remedy_object && ` / ${item.result.zodiac_remedy_object.animal} 비방`}
                                                    </p>
                                                    <div className="mt-auto">
                                                        <button
                                                            onClick={() => navigate('/analyze', { state: { loadHistoryItem: idx } })}
                                                            className="text-sm font-bold text-primary hover:text-yellow-300 flex items-center gap-1.5 group/btn"
                                                        >
                                                            자세히 보기 <span className="group-hover/btn:translate-x-1 transition-transform">&rarr;</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-8">의뢰 및 주문 내역</h3>
                                <div className="bg-[#1a1508]/50 border-2 border-dashed border-white/10 rounded-3xl p-10 md:p-16 text-center shadow-lg">
                                    <div className="w-20 h-20 bg-black/40 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                                        <ShoppingBag className="w-10 h-10 text-primary opacity-80" />
                                    </div>
                                    <h4 className="font-bold text-white text-xl mb-3">아직 주문 내역이 없습니다</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                                        AI가 분석한 맞춤형 비방 아트 액자나<br />
                                        12간지 비방 오브제를 의뢰하여<br />
                                        공간의 기운을 보완해보세요.
                                    </p>
                                    <button
                                        onClick={() => navigate('/analyze')}
                                        className="mt-8 px-8 py-3.5 bg-white/5 border border-primary text-primary text-sm font-bold rounded-2xl hover:bg-primary hover:text-[#0c0a06] transition-all shadow-sm"
                                    >
                                        풍수 분석하러 가기
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'gallery' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-8">나의 비방 컬렉션</h3>
                                {galleryImages.length === 0 ? (
                                    <div className="bg-[#1a1508]/50 border-2 border-dashed border-white/10 rounded-3xl p-10 md:p-16 text-center shadow-lg">
                                        <ImageIcon className="w-16 h-16 text-white/10 mx-auto mb-6" />
                                        <p className="text-slate-400 font-medium text-lg">생성된 비방 아트가 없습니다.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                                        {galleryImages.map((img, idx) => (
                                            <div key={idx} className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-[#1a1508]">
                                                <img src={img.url} alt="Remedy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-4 md:p-5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                                    <p className="text-primary text-xs md:text-sm font-bold mb-3 line-clamp-1">{img.keyword}</p>
                                                    <button
                                                        onClick={() => downloadImage(img.url, `FengShui_Collection_${idx}.png`)}
                                                        className="w-full bg-white/10 hover:bg-primary hover:text-[#0c0a06] backdrop-blur-md text-white md:text-xs text-[10px] font-bold py-2 px-3 md:px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/20 hover:border-transparent"
                                                    >
                                                        <Download className="w-3 h-3 md:w-4 md:h-4" /> 기기에 저장
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-8">설정 및 기본 정보</h3>
                                <div className="bg-[#1a1508] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8">

                                    <div>
                                        <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">
                                            기본 출생연도
                                        </label>
                                        <p className="text-sm text-slate-400 mb-4 font-medium">풍수 감정 시 기본으로 입력될 출생연도를 설정합니다.</p>
                                        <input
                                            type="number"
                                            min={1940}
                                            max={2010}
                                            placeholder="예: 1985"
                                            value={settings.birthDate ? settings.birthDate.slice(0, 4) : ''}
                                            onChange={(e) => updateSettings({ birthDate: e.target.value })}
                                            className="w-full max-w-xs bg-black/40 text-white border border-white/10 rounded-xl px-5 py-4 font-medium outline-none focus:border-primary transition-all shadow-inner"
                                        />
                                    </div>

                                    <div className="pt-6 border-t border-white/10">
                                        <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">
                                            기본 성별
                                        </label>
                                        <div className="flex gap-3 max-w-xs mt-4">
                                            <button
                                                type="button"
                                                onClick={() => updateSettings({ gender: 'male' })}
                                                className={`flex-1 py-4 rounded-xl border-2 text-sm font-bold transition-all shadow-sm ${settings.gender === 'male'
                                                    ? 'bg-primary text-[#0c0a06] border-primary shadow-primary/20'
                                                    : 'bg-black/30 text-slate-300 border-white/5 hover:border-white/20'
                                                    }`}
                                            >남성</button>
                                            <button
                                                type="button"
                                                onClick={() => updateSettings({ gender: 'female' })}
                                                className={`flex-1 py-4 rounded-xl border-2 text-sm font-bold transition-all shadow-sm ${settings.gender === 'female'
                                                    ? 'bg-primary text-[#0c0a06] border-primary shadow-primary/20'
                                                    : 'bg-black/30 text-slate-300 border-white/5 hover:border-white/20'
                                                    }`}
                                            >여성</button>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/10">
                                        <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">
                                            비방 디자인 선호 스타일
                                        </label>
                                        <p className="text-sm text-slate-400 mb-4 font-medium">비방 아트 생성 시 기본으로 적용될 화풍을 선택합니다.</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {[
                                                { id: 'modern', label: '모던 아트' },
                                                { id: 'buddhist', label: '레트로 아트' },
                                                { id: 'modern_buddhist', label: '모던+레트로 퓨전' }
                                            ].map((style) => (
                                                <button
                                                    key={style.id}
                                                    onClick={() => updateSettings({ artStyle: style.id as any })}
                                                    className={`py-4 px-5 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${settings.artStyle === style.id
                                                        ? 'bg-primary text-[#0c0a06] border-primary shadow-primary/20'
                                                        : 'bg-black/30 text-slate-300 border-white/5 hover:bg-white/5 hover:text-white'
                                                        }`}
                                                >
                                                    {style.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
