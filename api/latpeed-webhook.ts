import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

type FlatPayload = Record<string, unknown>;

const normalizeKey = (key: string) => key.toLowerCase().replace(/[\s_.-]/g, '');

const flattenPayload = (value: unknown, prefix = '', output: FlatPayload = {}) => {
    if (!value || typeof value !== 'object') return output;

    Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        output[path] = nestedValue;
        if (nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
            flattenPayload(nestedValue, path, output);
        }
    });

    return output;
};

const pickField = (payload: FlatPayload, aliases: string[]) => {
    const normalizedAliases = aliases.map(normalizeKey);
    const entry = Object.entries(payload).find(([key]) => normalizedAliases.includes(normalizeKey(key)));
    return entry?.[1];
};

const toStringValue = (value: unknown) => {
    if (value === undefined || value === null) return '';
    return String(value).trim();
};

const toAmount = (value: unknown) => {
    const numeric = Number(toStringValue(value).replace(/[^\d.-]/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
};

const isCompletedStatus = (value: unknown) => {
    const status = toStringValue(value);
    if (!status) return true;
    return /paid|completed|complete|success|confirmed|approved|결제|완료/i.test(status);
};

const extractUuid = (value: string) => {
    return value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0] || '';
};

const extractEmail = (value: string) => {
    return value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
};

const inferOrderType = (value: string) => {
    if (/12\s*간지|zodiac|설계도/i.test(value)) return 'zodiac';
    if (/아트워크|remedy/i.test(value)) return 'remedy';
    if (/액자|frame/i.test(value)) return 'frame';
    if (/오브제\s*제작|object/i.test(value)) return 'object';
    if (/공간비방서|감명서|프리미엄|report|XJ8Ul/i.test(value)) return 'report';
    return '';
};

const hashPayload = (value: unknown) => {
    return createHash('sha256').update(JSON.stringify(value || {})).digest('hex').slice(0, 24);
};

const readWebhookSecret = (req: any) => {
    const authorization = toStringValue(req.headers?.authorization);
    if (authorization.toLowerCase().startsWith('bearer ')) {
        return authorization.slice(7).trim();
    }

    return toStringValue(
        req.headers?.['x-latpeed-webhook-secret'] ||
        req.headers?.['x-webhook-secret'] ||
        req.query?.secret
    );
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const expectedSecret = process.env.LATPEED_WEBHOOK_SECRET || '';
    if (!expectedSecret) {
        return res.status(500).json({ error: 'LATPEED_WEBHOOK_SECRET is not configured.' });
    }

    if (readWebhookSecret(req) !== expectedSecret) {
        return res.status(401).json({ error: 'Invalid Latpeed webhook secret.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Supabase service role environment variables are missing.' });
    }

    const payloadBody = req.body || {};
    const payloadText = JSON.stringify(payloadBody);
    const payload = flattenPayload(payloadBody);
    let orderId = toStringValue(pickField(payload, [
        'orderId',
        'order_id',
        'merchantOrderId',
        'merchant_order_id',
        'customData.orderId',
        'custom_data.order_id',
        'metadata.orderId',
        'metadata.order_id',
        '주문번호',
    ]));
    const paymentKey = toStringValue(pickField(payload, [
        'paymentKey',
        'payment_key',
        'paymentId',
        'payment_id',
        'transactionId',
        'transaction_id',
        'latpeedOrderId',
        'latpeed_order_id',
    ])) || orderId || `latpeed_${hashPayload(payloadBody)}`;
    if (!orderId) {
        orderId = paymentKey.startsWith('latpeed_') ? paymentKey : `latpeed_${paymentKey}`;
    }

    const rawOrderType = toStringValue(pickField(payload, [
        'orderType',
        'order_type',
        'customData.orderType',
        'custom_data.order_type',
        'metadata.orderType',
        'metadata.order_type',
        '상품유형',
    ]));
    const orderType = rawOrderType || inferOrderType(payloadText);
    let userId = toStringValue(pickField(payload, [
        'userId',
        'user_id',
        'customData.userId',
        'custom_data.user_id',
        'metadata.userId',
        'metadata.user_id',
        '사용자ID',
    ]));
    const rawAnalysisId = toStringValue(pickField(payload, [
        'analysisId',
        'analysis_id',
        'customData.analysisId',
        'custom_data.analysis_id',
        'metadata.analysisId',
        'metadata.analysis_id',
        '분석ID',
    ]));
    const analysisId = extractUuid(rawAnalysisId) || extractUuid(payloadText);
    const amount = toAmount(pickField(payload, [
        'amount',
        'totalAmount',
        'total_amount',
        'paidAmount',
        'paid_amount',
        'price',
        '결제금액',
    ]));
    const status = pickField(payload, [
        'status',
        'paymentStatus',
        'payment_status',
        'state',
        'event',
        'eventName',
        'event_name',
    ]);

    if (!isCompletedStatus(status)) {
        return res.status(202).json({ success: false, ignored: true, reason: 'Payment is not completed yet.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!userId && analysisId) {
        const { data: analysisRow, error: analysisError } = await supabase
            .from('analysis_history')
            .select('user_id')
            .eq('id', analysisId)
            .maybeSingle();

        if (analysisError) {
            console.warn('Failed to resolve Latpeed analysis owner:', analysisError);
        }

        if (analysisRow?.user_id) {
            userId = analysisRow.user_id;
        }
    }

    if (!orderType || !userId) {
        return res.status(400).json({
            error: 'Latpeed webhook payload is missing orderType or a resolvable userId.',
            hint: 'Include app user_id in metadata, or ask buyers to enter an analysis result URL / analysisID in the Latpeed buyer survey.',
            parsed: { orderId, orderType, userId, analysisId, amount },
        });
    }

    if (!['report', 'remedy', 'zodiac', 'frame', 'object'].includes(orderType)) {
        return res.status(400).json({ error: 'Invalid orderType.', orderType });
    }

    const buyerName = toStringValue(pickField(payload, ['buyerName', 'buyer_name', 'name', 'customerName', 'customer_name', '구매자명']));
    const contactInfo = toStringValue(pickField(payload, ['contact', 'phone', 'email', 'customerEmail', 'customer_email', '구매자연락처', '이메일'])) || extractEmail(payloadText);

    const { error } = await supabase
        .from('purchases')
        .upsert([{
            user_id: userId,
            order_id: orderId,
            payment_key: paymentKey,
            amount: amount || 9900,
            order_type: orderType,
            status: 'COMPLETED',
            buyer_name: buyerName || 'Latpeed customer',
            contact_info: contactInfo || null,
            analysis_id: analysisId || null,
        }], { onConflict: 'order_id' });

    if (error) {
        console.error('Failed to save Latpeed purchase:', error);
        return res.status(500).json({ error: 'Failed to save Latpeed purchase.', details: error.message });
    }

    return res.status(200).json({
        success: true,
        orderId,
        orderType,
        analysisId: analysisId || null,
    });
}
