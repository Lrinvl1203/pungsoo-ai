import {
    headersToRecord,
    isValidOrderType,
    markPolarPurchaseRefunded,
    readRawBody,
    toNumberValue,
    toStringValue,
    upsertPolarPurchase,
    verifyPolarWebhook,
} from '../server/polar-shared.js';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET || '';
    if (!webhookSecret) {
        return res.status(500).json({ error: 'POLAR_WEBHOOK_SECRET is not configured.' });
    }

    try {
        const rawBody = await readRawBody(req);
        const event = await verifyPolarWebhook(rawBody, headersToRecord(req.headers || {}), webhookSecret);

        if (event.type !== 'order.paid' && event.type !== 'order.refunded') {
            return res.status(202).json({ success: true, ignored: true, type: event.type });
        }

        const order = event.data || {};

        if (event.type === 'order.refunded') {
            const metadata = order.metadata || {};
            const orderId = toStringValue(metadata.orderId) || `polar_order_${order.id || order.checkout_id}`;
            const refundedAt = toStringValue(order.refunded_at || order.refund_date || event.created_at) || new Date().toISOString();
            await markPolarPurchaseRefunded({
                orderId,
                paymentKey: `polar_order_${order.id || order.checkout_id || orderId}`,
                refundedAt,
            });

            return res.status(200).json({ success: true, orderId, type: event.type });
        }

        if (order.paid === false || (order.status && order.status !== 'paid')) {
            return res.status(202).json({ success: true, ignored: true, status: order.status || null });
        }

        const metadata = order.metadata || {};
        const orderType = metadata.orderType;
        if (!isValidOrderType(orderType)) {
            return res.status(400).json({ error: 'Polar order metadata has an invalid orderType.' });
        }

        const orderId = toStringValue(metadata.orderId) || `polar_order_${order.id || order.checkout_id}`;
        const amount = Number(order.total_amount || order.amount || 0) || toNumberValue(metadata.amount);

        await upsertPolarPurchase({
            orderId,
            paymentKey: `polar_order_${order.id || order.checkout_id || orderId}`,
            amount,
            orderType,
            userId: toStringValue(metadata.userId || order.customer?.external_id),
            analysisId: toStringValue(metadata.analysisId) || null,
            buyerName: toStringValue(order.billing_name || order.customer?.name) || null,
            contactInfo: toStringValue(order.customer?.email) || null,
        });

        return res.status(200).json({ success: true, orderId, type: event.type });
    } catch (error: any) {
        console.error('Polar webhook failed:', error);
        const status = error?.name === 'WebhookVerificationError' ? 403 : 500;
        return res.status(status).json({ error: error.message || 'Polar webhook failed.' });
    }
}
