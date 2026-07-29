import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

interface ToastItem {
    id: number;
    message: string;
    tone: ToastTone;
}

interface ToastContextValue {
    notify: (message: string, tone?: ToastTone, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const dismiss = useCallback((id: number) => {
        setToasts(current => current.filter(item => item.id !== id));
    }, []);

    const notify = useCallback((message: string, tone: ToastTone = 'info', durationMs = 6000) => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts(current => [...current.slice(-2), { id, message, tone }]);
        window.setTimeout(() => dismiss(id), durationMs);
    }, [dismiss]);

    const value = useMemo(() => ({ notify }), [notify]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div
                className="pointer-events-none fixed inset-x-3 top-3 z-[200] flex flex-col items-end gap-2 sm:left-auto sm:right-4 sm:top-4 sm:w-[min(420px,calc(100vw-2rem))]"
                aria-live="polite"
                aria-atomic="true"
            >
                {toasts.map((toast) => {
                    const Icon = toast.tone === 'success'
                        ? CheckCircle2
                        : toast.tone === 'error' || toast.tone === 'warning'
                            ? AlertTriangle
                            : Info;
                    const palette = toast.tone === 'success'
                        ? 'border-emerald-400/40 bg-emerald-950/95 text-emerald-50'
                        : toast.tone === 'error'
                            ? 'border-red-400/40 bg-red-950/95 text-red-50'
                            : toast.tone === 'warning'
                                ? 'border-amber-400/40 bg-amber-950/95 text-amber-50'
                                : 'border-sky-400/40 bg-slate-950/95 text-slate-50';

                    return (
                        <div
                            key={toast.id}
                            role={toast.tone === 'error' ? 'alert' : 'status'}
                            className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${palette}`}
                        >
                            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                            <p className="min-w-0 flex-1 text-sm font-semibold leading-relaxed">{toast.message}</p>
                            <button
                                type="button"
                                onClick={() => dismiss(toast.id)}
                                className="rounded-lg p-1 opacity-70 transition hover:bg-white/10 hover:opacity-100"
                                aria-label="알림 닫기"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const value = useContext(ToastContext);
    if (!value) {
        throw new Error('useToast must be used inside ToastProvider.');
    }
    return value;
}
