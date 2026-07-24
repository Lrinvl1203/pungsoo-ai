
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { Analytics } from '@vercel/analytics/react';

const AnalyzeRoute = React.lazy(() => import('./pages/AnalyzeRoute'));
const Landing = React.lazy(() => import('./pages/Landing'));
const MyPageRoute = React.lazy(() => import('./pages/MyPageRoute'));
const PaymentSuccess = React.lazy(() => import('./pages/PaymentSuccess'));
const PaymentFail = React.lazy(() => import('./pages/PaymentFail'));
const LatpeedClaimRoute = React.lazy(() => import('./pages/LatpeedClaimRoute'));
const Terms = React.lazy(() => import('./pages/Terms'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const Refund = React.lazy(() => import('./pages/Refund'));
const AdminRoute = React.lazy(() => import('./pages/AdminRoute'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0a06] px-6 text-center font-display text-slate-100">
      <div>
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-primary/25 border-t-primary"></div>
        <p className="text-sm font-bold text-slate-400">공간의 흐름을 여는 중입니다</p>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/analyze" element={<AnalyzeRoute />} />
            <Route path="/mypage" element={<MyPageRoute />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/fail" element={<PaymentFail />} />
            <Route path="/latpeed/claim" element={<LatpeedClaimRoute />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/admin" element={<AdminRoute />} />
          </Routes>
        </Suspense>
        <PWAInstallPrompt />
        {import.meta.env.PROD && <Analytics />}
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
