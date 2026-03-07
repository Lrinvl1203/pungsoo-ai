import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Compass, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#1a1710] flex items-center justify-center px-4">
                    <div className="max-w-md w-full text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
                            <Compass className="w-10 h-10 text-red-400" />
                        </div>
                        <h1 className="text-2xl font-black text-white mb-3">예기치 않은 오류가 발생했습니다</h1>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            서비스에 일시적인 문제가 발생했습니다.<br />잠시 후 다시 시도해 주세요.
                        </p>
                        {this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">오류 상세 정보</summary>
                                <pre className="mt-2 text-[10px] text-red-400/70 bg-black/30 p-3 rounded-lg overflow-auto max-h-32 border border-white/10">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => { (this as any).setState({ hasError: false, error: null }); window.location.reload(); }}
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-[#221e10] font-bold rounded-lg hover:bg-yellow-400 transition-all"
                            >
                                <RefreshCw className="w-4 h-4" /> 다시 시도
                            </button>
                            <a href="/"
                                className="flex items-center gap-2 px-6 py-3 border border-white/20 text-white font-bold rounded-lg hover:border-primary hover:text-primary transition-all"
                            >
                                <Home className="w-4 h-4" /> 홈으로
                            </a>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
