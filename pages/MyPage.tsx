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
        <div className="min-h-screen bg-[#fdfbf7]">
            {/* Header */}
            <header className="bg-white border-b border-[#e5e1da] py-4 px-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-[#8c8273] hover:text-[#4a443b] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-bold text-sm">메인으로</span>
                    </button>
                    <h1 className="serif-font text-xl font-bold text-[#4a443b]">마이페이지</h1>
                    <div className="w-20" /> {/* Spacer for centering */}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Sidebar / Profile Card */}
                    <div className="w-full md:w-72 shrink-0 space-y-4">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e1da] text-center">
                            <div className="w-20 h-20 mx-auto bg-[#faf9f6] rounded-full flex items-center justify-center border-2 border-[#d4af37]/30 mb-4 overflow-hidden shadow-inner">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-[#d4af37]" />
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-[#4a443b] mb-1">{displayName}</h2>
                            <p className="text-xs text-[#8c8273] mb-4 truncate">{user.email}</p>

                            <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#6b6256] bg-[#faf9f6] py-2 rounded-lg border border-[#e5e1da] mb-6">
                                <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                                {provider === 'kakao' ? '카카오' : provider === 'google' ? 'Google' : provider} 계정 연동
                            </div>

                            <div className="flex justify-between text-xs text-[#8c8273] border-t border-[#e5e1da] pt-4 mb-4 mt-2 px-2">
                                <span>가입일</span>
                                <span className="font-bold text-[#6b6256]">{joinDate}</span>
                            </div>

                            <button
                                onClick={handleSignOut}
                                className="w-full py-2.5 mt-2 text-sm text-red-500 hover:bg-red-50 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-100"
                            >
                                <LogOut className="w-4 h-4" /> 로그아웃
                            </button>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex flex-col bg-white rounded-2xl p-2 shadow-sm border border-[#e5e1da]">
                            {[
                                { id: 'history', label: '나의 풍수 분석 기록', icon: Clock },
                                { id: 'orders', label: '의뢰 및 주문 내역', icon: ShoppingBag },
                                { id: 'gallery', label: '나의 비방 컬렉션', icon: ImageIcon },
                                { id: 'settings', label: '설정 및 기본 정보', icon: Settings },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${activeTab === tab.id
                                            ? 'bg-[#faf9f6] text-[#d4af37] shadow-sm border border-[#e5e1da]'
                                            : 'text-[#6b6256] hover:bg-[#fdfbf7]'
                                        }`}
                                >
                                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[#d4af37]' : 'text-[#8c8273]'}`} />
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
                                    className={`flex items-center gap-2 px-4 py-2.5 shrink-0 rounded-full font-bold text-sm transition-all ${activeTab === tab.id
                                            ? 'bg-[#4a443b] text-white shadow-md'
                                            : 'bg-white text-[#6b6256] border border-[#e5e1da]'
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
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="serif-font text-2xl font-bold text-[#4a443b]">나의 풍수 분석 기록</h3>
                                    {history.length > 0 && (
                                        <button
                                            onClick={handleClearHistory}
                                            className="text-xs text-[#8c8273] hover:text-red-500 flex items-center gap-1 transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" /> 전체 삭제
                                        </button>
                                    )}
                                </div>

                                {history.length === 0 ? (
                                    <div className="bg-white border-2 border-dashed border-[#e5e1da] rounded-2xl p-12 text-center">
                                        <Clock className="w-12 h-12 text-[#e5e1da] mx-auto mb-4" />
                                        <p className="text-[#8c8273] font-medium">아직 분석 기록이 없습니다.</p>
                                        <button
                                            onClick={() => navigate('/')}
                                            className="mt-4 px-6 py-2.5 bg-[#4a443b] text-white text-sm font-bold rounded-full hover:bg-[#3d3830] transition-colors shadow-sm"
                                        >
                                            풍수 분석하러 가기
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {history.map((item, idx) => (
                                            <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e1da] flex flex-col sm:flex-row gap-5 group hover:border-[#d4af37]/40 transition-colors">
                                                <div className="w-full sm:w-32 aspect-square rounded-xl overflow-hidden bg-[#faf9f6] border border-[#e5e1da] shrink-0">
                                                    <img src={item.remedyArt} alt="Remedy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="inline-block px-2.5 py-1 bg-[#fdfbf7] text-[#d4af37] border border-[#d4af37]/20 rounded text-[11px] font-bold tracking-widest uppercase">
                                                            {item.result.feng_shui_score}점
                                                        </span>
                                                        <button
                                                            onClick={() => handleDeleteHistoryItem(idx)}
                                                            className="text-[#b0a99f] hover:text-red-400 p-1"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <h4 className="font-bold text-[#4a443b] text-base mb-1 line-clamp-1">{item.result.analysis_summary}</h4>
                                                    <p className="text-xs text-[#8c8273] mb-3 line-clamp-2 leading-relaxed h-8">
                                                        {item.result.remedy_art.deficiency} 처방
                                                        {item.result.zodiac_remedy_object && ` / ${item.result.zodiac_remedy_object.animal} 비방`}
                                                    </p>
                                                    <div className="mt-auto">
                                                        <button
                                                            onClick={() => navigate('/', { state: { loadHistoryItem: idx } })}
                                                            className="text-sm font-bold text-[#d4af37] hover:text-[#b4922b] flex items-center gap-1"
                                                        >
                                                            자세히 보기 &rarr;
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
                                <h3 className="serif-font text-2xl font-bold text-[#4a443b] mb-6">의뢰 및 주문 내역</h3>
                                <div className="bg-white border border-[#e5e1da] rounded-2xl p-12 text-center shadow-sm">
                                    <div className="w-16 h-16 bg-[#faf9f6] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#e5e1da]">
                                        <ShoppingBag className="w-8 h-8 text-[#d4af37]" />
                                    </div>
                                    <h4 className="font-bold text-[#4a443b] text-lg mb-2">아직 주문 내역이 없습니다</h4>
                                    <p className="text-[#8c8273] text-sm leading-relaxed max-w-sm mx-auto">
                                        AI가 분석한 맞춤형 비방 아트 액자나<br />
                                        12간지 비방 오브제를 의뢰하여<br />
                                        공간의 기운을 보완해보세요.
                                    </p>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="mt-6 px-6 py-2.5 bg-white border border-[#d4af37] text-[#d4af37] text-sm font-bold rounded-full hover:bg-[#fdfbf7] transition-colors shadow-sm"
                                    >
                                        풍수 분석하러 가기
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'gallery' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h3 className="serif-font text-2xl font-bold text-[#4a443b] mb-6">나의 비방 컬렉션</h3>
                                {galleryImages.length === 0 ? (
                                    <div className="bg-white border border-[#e5e1da] rounded-2xl p-12 text-center shadow-sm">
                                        <ImageIcon className="w-12 h-12 text-[#e5e1da] mx-auto mb-4" />
                                        <p className="text-[#8c8273] font-medium">생성된 비방 아트가 없습니다.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {galleryImages.map((img, idx) => (
                                            <div key={idx} className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm border border-[#e5e1da] bg-white">
                                                <img src={img.url} alt="Remedy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                                    <p className="text-white text-xs font-bold mb-2 line-clamp-1">{img.keyword}</p>
                                                    <button
                                                        onClick={() => downloadImage(img.url, `FengShui_Collection_${idx}.png`)}
                                                        className="bg-white/20 hover:bg-white/40 backdrop-blur-md text-white text-[10px] py-1.5 px-3 rounded-full flex items-center justify-center gap-1 transition-colors border border-white/30"
                                                    >
                                                        <Download className="w-3 h-3" /> 저장
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
                                <h3 className="serif-font text-2xl font-bold text-[#4a443b] mb-6">설정 및 기본 정보</h3>
                                <div className="bg-white border border-[#e5e1da] rounded-2xl p-6 shadow-sm space-y-6">

                                    <div>
                                        <label className="block text-xs font-bold text-[#8c8273] uppercase tracking-wider mb-2">
                                            기본 출생연도
                                        </label>
                                        <p className="text-xs text-[#b0a99f] mb-3">풍수 감정 시 기본으로 입력될 출생연도를 설정합니다.</p>
                                        <input
                                            type="number"
                                            min={1940}
                                            max={2010}
                                            placeholder="예: 1985"
                                            value={settings.birthDate ? settings.birthDate.slice(0, 4) : ''}
                                            onChange={(e) => updateSettings({ birthDate: e.target.value })}
                                            className="w-full max-w-xs bg-[#faf9f6] border border-[#e5e1da] rounded-xl px-4 py-3 outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30 transition-all"
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-[#e5e1da]">
                                        <label className="block text-xs font-bold text-[#8c8273] uppercase tracking-wider mb-2">
                                            기본 성별
                                        </label>
                                        <div className="flex gap-3 max-w-xs">
                                            <button
                                                type="button"
                                                onClick={() => updateSettings({ gender: 'male' })}
                                                className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${settings.gender === 'male'
                                                        ? 'bg-[#d4af37] text-white border-[#d4af37] shadow-md'
                                                        : 'bg-[#faf9f6] text-[#6b6256] border-[#e5e1da] hover:border-[#d4af37]/50'
                                                    }`}
                                            >남성</button>
                                            <button
                                                type="button"
                                                onClick={() => updateSettings({ gender: 'female' })}
                                                className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${settings.gender === 'female'
                                                        ? 'bg-[#d4af37] text-white border-[#d4af37] shadow-md'
                                                        : 'bg-[#faf9f6] text-[#6b6256] border-[#e5e1da] hover:border-[#d4af37]/50'
                                                    }`}
                                            >여성</button>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-[#e5e1da]">
                                        <label className="block text-xs font-bold text-[#8c8273] uppercase tracking-wider mb-2">
                                            비방 디자인 선호 스타일
                                        </label>
                                        <p className="text-xs text-[#b0a99f] mb-3">비방 아트 생성 시 기본으로 적용될 아트를 선택합니다.</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {[
                                                { id: 'modern', label: '모던' },
                                                { id: 'buddhist', label: '레트로' },
                                                { id: 'modern_buddhist', label: '모던 + 레트로' }
                                            ].map((style) => (
                                                <button
                                                    key={style.id}
                                                    onClick={() => updateSettings({ artStyle: style.id as any })}
                                                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${settings.artStyle === style.id
                                                            ? 'bg-[#4a443b] text-white border-[#4a443b] shadow-md'
                                                            : 'bg-[#faf9f6] text-[#6b6256] border-[#e5e1da] hover:bg-[#e5e1da]'
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
