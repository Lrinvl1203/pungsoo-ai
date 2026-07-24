import { createClient } from '@supabase/supabase-js';

export type PungsooOrderType = 'report' | 'remedy' | 'zodiac' | 'frame' | 'object';

export const VALID_ORDER_TYPES: PungsooOrderType[] = ['report', 'remedy', 'zodiac', 'frame', 'object'];

export const isValidOrderType = (value: unknown): value is PungsooOrderType => {
    return typeof value === 'string' && VALID_ORDER_TYPES.includes(value as PungsooOrderType);
};

export const getPolarApiBaseUrl = () => {
    if (process.env.POLAR_API_BASE_URL) {
        return process.env.POLAR_API_BASE_URL.replace(/\/+$/, '');
    }

    return process.env.POLAR_ENV === 'sandbox'
        ? 'https://sandbox-api.polar.sh/v1'
        : 'https://api.polar.sh/v1';
};

export const getPolarProductId = (orderType: PungsooOrderType) => {
    const envKey = `POLAR_PRODUCT_ID_${orderType.toUpperCase()}`;
    return (process.env[envKey] || '').trim();
};

export const toStringValue = (value: unknown) => {
    if (value === undefined || value === null) return '';
    return String(value).trim();
};

export const toNumberValue = (value: unknown) => {
    const numeric = Number(toStringValue(value).replace(/[^\d.-]/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
};

export const getHeaderValue = (headers: Record<string, string | string[] | undefined>, key: string) => {
    const value = headers[key.toLowerCase()] || headers[key];
    return Array.isArray(value) ? value[0] : value || '';
};

export const getRequestOrigin = (req: any) => {
    const configuredOrigin = (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || '').replace(/\/+$/, '');
    if (configuredOrigin) return configuredOrigin;

    const origin = toStringValue(getHeaderValue(req.headers || {}, 'origin')).replace(/\/+$/, '');
    if (origin) return origin;

    const proto = toStringValue(getHeaderValue(req.headers || {}, 'x-forwarded-proto')) || 'https';
    const host = toStringValue(getHeaderValue(req.headers || {}, 'x-forwarded-host')) || toStringValue(req.headers?.host);
    return host ? `${proto.split(',')[0]}://${host.split(',')[0]}` : 'https://41pungsoo-ai.vercel.app';
};

export const getClientIp = (req: any) => {
    return toStringValue(getHeaderValue(req.headers || {}, 'x-forwarded-for')).split(',')[0].trim();
};

export const readRawBody = async (req: any) => {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return Buffer.from(req.body);
    if (req.body && typeof req.body === 'object') return Buffer.from(JSON.stringify(req.body));

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
};

export const headersToRecord = (headers: Record<string, string | string[] | undefined>) => {
    return Object.entries(headers || {}).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value === undefined) return acc;
        acc[key.toLowerCase()] = Array.isArray(value) ? value[0] : value;
        return acc;
    }, {});
};

export const verifyPolarWebhook = async (payload: Buffer, headers: Record<string, string>, secret: string) => {
    const { Webhook } = await import('standardwebhooks');
    const normalizedSecret = secret.startsWith('whsec_')
        ? secret
        : Buffer.from(secret, 'utf8').toString('base64');

    try {
        return new Webhook(normalizedSecret).verify(payload, headers) as Record<string, any>;
    } catch (error) {
        return new Webhook(secret, { format: 'raw' }).verify(payload, headers) as Record<string, any>;
    }
};

export const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase service role environment variables are missing.');
    }

    return createClient(supabaseUrl, supabaseKey);
};

export const resolveUserIdFromAnalysis = async (
    supabase: any,
    userId: string,
    analysisId: string,
) => {
    if (userId || !analysisId) return userId;

    const { data, error } = await supabase
        .from('analysis_history')
        .select('user_id')
        .eq('id', analysisId)
        .maybeSingle();

    if (error) {
        console.warn('Failed to resolve analysis owner for Polar purchase:', error);
    }

    return (data as { user_id?: string } | null)?.user_id || '';
};

export const upsertPolarPurchase = async (input: {
    orderId: string;
    paymentKey: string;
    amount: number;
    orderType: PungsooOrderType;
    userId: string;
    analysisId?: string | null;
    buyerName?: string | null;
    contactInfo?: string | null;
}) => {
    const supabase = getSupabaseAdmin();

    const { data: existingPurchase, error: lookupError } = await supabase
        .from('purchases')
        .select('order_id, status, refunded_at, user_id')
        .eq('order_id', input.orderId)
        .maybeSingle();

    if (lookupError) {
        throw new Error(`Failed to check Polar purchase: ${lookupError.message}`);
    }

    const existingUserId = toStringValue((existingPurchase as { user_id?: string } | null)?.user_id);
    const resolvedUserId = await resolveUserIdFromAnalysis(
        supabase,
        input.userId || existingUserId,
        input.analysisId || '',
    );

    if (!resolvedUserId) {
        throw new Error('Polar purchase is missing a resolvable userId.');
    }

    if ((existingPurchase as { status?: string } | null)?.status === 'REFUNDED') {
        return {
            userId: resolvedUserId,
            status: 'REFUNDED',
            refundedAt: (existingPurchase as { refunded_at?: string } | null)?.refunded_at || null,
        };
    }

    const purchasePayload = {
        user_id: resolvedUserId,
        order_id: input.orderId,
        payment_key: input.paymentKey,
        amount: input.amount,
        order_type: input.orderType,
        status: 'COMPLETED',
        buyer_name: input.buyerName || 'Polar customer',
        contact_info: input.contactInfo || null,
        analysis_id: input.analysisId || null,
    };

    const { error } = existingPurchase
        ? await supabase
            .from('purchases')
            .update(purchasePayload)
            .eq('order_id', input.orderId)
        : await supabase
            .from('purchases')
            .insert([purchasePayload]);

    if (error) {
        throw new Error(`Failed to save Polar purchase: ${error.message}`);
    }

    return { userId: resolvedUserId, status: 'COMPLETED' };
};

export const markPolarPurchaseRefunded = async (input: {
    orderId: string;
    paymentKey?: string;
    refundedAt?: string;
}) => {
    const supabase = getSupabaseAdmin();
    const refundedAt = input.refundedAt || new Date().toISOString();

    const buildOriginalUpdate = (payload: Record<string, unknown>) => {
        let query = supabase
            .from('purchases')
            .update(payload);

        if (input.orderId) {
            query = query.eq('order_id', input.orderId);
        } else if (input.paymentKey) {
            query = query.eq('payment_key', input.paymentKey);
        } else {
            throw new Error('Polar refund is missing orderId and paymentKey.');
        }

        return query;
    };

    let { error } = await buildOriginalUpdate({ status: 'REFUNDED', refunded_at: refundedAt });
    if (error && /refunded_at|schema cache|column/i.test(error.message || '')) {
        ({ error } = await buildOriginalUpdate({ status: 'REFUNDED' }));
    }
    if (error) {
        throw new Error(`Failed to mark Polar purchase refunded: ${error.message}`);
    }

    if (input.orderId) {
        const refundRequestOrderId = `refund_${input.orderId}`;
        const { data: existingRefundRequest, error: refundLookupError } = await supabase
            .from('purchases')
            .select('contact_info')
            .eq('order_id', refundRequestOrderId)
            .maybeSingle();

        if (refundLookupError) {
            throw new Error(`Failed to load Polar refund request: ${refundLookupError.message}`);
        }

        const completionMarker = '환불 완료 시각:';
        const currentContactInfo = toStringValue((existingRefundRequest as { contact_info?: string } | null)?.contact_info);
        const requestPayload: Record<string, unknown> = {
            status: 'REFUNDED',
            refunded_at: refundedAt,
        };

        if (!currentContactInfo.includes(completionMarker)) {
            requestPayload.contact_info = currentContactInfo
                ? `${currentContactInfo}\n\n${completionMarker}\n${refundedAt}`
                : `${completionMarker}\n${refundedAt}`;
        }

        let { error: requestError } = await supabase
            .from('purchases')
            .update(requestPayload)
            .eq('order_id', refundRequestOrderId);
        if (requestError && /refunded_at|schema cache|column/i.test(requestError.message || '')) {
            const fallbackPayload = { ...requestPayload };
            delete fallbackPayload.refunded_at;
            ({ error: requestError } = await supabase
                .from('purchases')
                .update(fallbackPayload)
                .eq('order_id', refundRequestOrderId));
        }

        if (requestError) {
            throw new Error(`Failed to mark Polar refund request completed: ${requestError.message}`);
        }
    }
};
