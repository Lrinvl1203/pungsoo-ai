import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Check if already dismissed
        const dismissed = localStorage.getItem('pwa_install_dismissed');
        if (dismissed) return;

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show after 30 seconds (non-intrusive)
            setTimeout(() => setShowBanner(true), 30000);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('pwa_install_dismissed', 'true');
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom duration-300">
            <div className="bg-[#2a2518]/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Download className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm">앱으로 설치하기</h4>
                    <p className="text-slate-400 text-xs mt-0.5">홈 화면에 추가하면 더 빠르게 이용할 수 있어요</p>
                </div>
                <button
                    onClick={handleInstall}
                    className="bg-primary text-[#221e10] font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-400 transition-colors shrink-0"
                >
                    설치
                </button>
                <button
                    onClick={handleDismiss}
                    className="text-slate-500 hover:text-white transition-colors shrink-0"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
