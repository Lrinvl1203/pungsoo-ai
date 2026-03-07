import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, X } from 'lucide-react';

const DAILY_MESSAGES = [
    { title: "오늘의 길운 방향", content: "오늘은 동남쪽에서 귀인이 찾아옵니다. 중요한 만남은 동남쪽을 등지고 앉으세요.", type: "good" },
    { title: "재물운 상승의 날", content: "현관을 깨끗이 닦고 밝게 유지하면 좋은 재물운이 집안으로 스며듭니다.", type: "good" },
    { title: "오늘은 조심하세요", content: "북쪽 창문은 잠시 닫아두는 것이 좋습니다. 찬 기운이 건강운을 해칠 수 있습니다.", type: "warning" },
    { title: "대인관계 길일", content: "오랜만에 연락하는 지인에게서 좋은 소식이 들려올 수 있습니다. 부드러운 화법을 쓰세요.", type: "good" },
    { title: "공간 환기의 중요성", content: "오전 10시에서 11시 사이, 모든 창문을 열어 집안의 탁한 기운을 빼내세요.", type: "info" }
];

export default function DailyFengShui() {
    const [message, setMessage] = useState(DAILY_MESSAGES[0]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Simple predictable pseudo-random based on current date
        const today = new Date();
        const dayIndex = today.getDate() + today.getMonth();
        setMessage(DAILY_MESSAGES[dayIndex % DAILY_MESSAGES.length]);

        // Check if user has already closed it today
        const dateKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        const lastSeen = localStorage.getItem('PUNGSOO_DAILY_SEEN');

        if (lastSeen !== dateKey) {
            // Slight delay for dramatic effect
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        const today = new Date();
        const dateKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        localStorage.setItem('PUNGSOO_DAILY_SEEN', dateKey);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 animate-fade-in-up">
            <div className="relative bg-[#221e10]/95 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-2xl p-5 overflow-hidden group">
                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#d4af37]/10 rounded-full blur-2xl"></div>
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#d4af37] to-transparent"></div>

                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center border border-white/10 shrink-0">
                        {message.type === 'warning' ? (
                            <Calendar className="w-5 h-5 text-amber-500" />
                        ) : (
                            <Sparkles className="w-5 h-5 text-primary" />
                        )}
                    </div>
                    <div>
                        <h4 className="text-primary font-bold text-sm">도사님의 오늘의 한마디</h4>
                        <p className="text-white font-medium text-[15px]">{message.title}</p>
                    </div>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed relative z-10 pl-[52px]">
                    {message.content}
                </p>
            </div>
        </div>
    );
}
