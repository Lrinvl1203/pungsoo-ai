export type AnalyticsEventName =
    | 'landing_cta_click'
    | 'analysis_started'
    | 'analysis_completed'
    | 'analysis_failed'
    | 'interior_art_generation_started'
    | 'interior_art_generation_completed'
    | 'interior_art_generation_failed'
    | 'remedy_art_regeneration_started'
    | 'remedy_art_regeneration_completed'
    | 'remedy_art_regeneration_failed'
    | 'login_prompt_opened'
    | 'payment_modal_opened'
    | 'payment_modal_viewed'
    | 'payment_checkout_started'
    | 'payment_request_failed'
    | 'payment_completed'
    | 'payment_failed'
    | 'refund_requested'
    | 'refund_request_failed';

interface TrackEventPayload {
    userId?: string | null;
    analysisId?: string | null;
    orderId?: string | null;
    orderType?: string | null;
    amount?: number | string | null;
    metadata?: Record<string, unknown>;
}

const SESSION_KEY = 'PUNGSOO_ANALYTICS_SESSION_ID';

const getSessionId = () => {
    if (typeof window === 'undefined') return '';

    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const generated = `sess_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    localStorage.setItem(SESSION_KEY, generated);
    return generated;
};

export const trackEvent = (eventName: AnalyticsEventName, payload: TrackEventPayload = {}) => {
    if (typeof window === 'undefined') return;

    const body = {
        eventName,
        sessionId: getSessionId(),
        path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        referrer: document.referrer || '',
        ...payload,
    };

    fetch('/api/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'track-event', ...body }),
        keepalive: true,
    }).catch((error) => {
        console.warn('[analytics] event tracking failed:', error);
    });
};
