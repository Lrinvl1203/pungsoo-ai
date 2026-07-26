import {
    getPolarApiBaseUrl,
    isValidOrderType,
    toNumberValue,
    toStringValue,
    upsertPolarPurchase,
} from '../server/polar-shared.js';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const accessToken = process.env.POLAR_ACCESS_TOKEN || '';
    if (!accessToken) {
        return res.status(500).json({ error: 'POLAR_ACCESS_TOKEN is not configured.' });
    }

    const checkoutId = toStringValue(req.body?.checkoutId || req.body?.checkout_id);
    const fallbackOrderId = toStringValue(req.body?.orderId);

    if (!checkoutId) {
        return res.status(400).json({ error: 'Polar checkoutId is required.' });
    }

    try {
        const response = await fetch(`${getPolarApiBaseUrl()}/checkouts/${encodeURIComponent(checkoutId)}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
            },
        });

        const checkout = await response.json().catch(() => ({}));
        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Failed to retrieve Polar checkout session.',
                details: checkout,
            });
        }

        if (checkout.status !== 'succeeded') {
            return res.status(409).json({
                error: 'Polar checkout has not succeeded yet.',
                status: checkout.status || null,
            });
        }

        const metadata = checkout.metadata || {};
        const orderType = metadata.orderType;
        if (!isValidOrderType(orderType)) {
            return res.status(400).json({ error: 'Polar checkout metadata has an invalid orderType.' });
        }

        const orderId = toStringValue(metadata.orderId) || fallbackOrderId || `polar_checkout_${checkoutId}`;
        const amount = Number(checkout.total_amount || checkout.amount || 0) || toNumberValue(metadata.amount);

        const savedPurchase = await upsertPolarPurchase({
            orderId,
            paymentKey: `polar_checkout_${checkoutId}`,
            amount,
            orderType,
            userId: toStringValue(metadata.userId || checkout.external_customer_id),
            analysisId: toStringValue(metadata.analysisId) || null,
            buyerName: toStringValue(checkout.customer_name || checkout.customer_billing_name) || null,
            contactInfo: toStringValue(checkout.customer_email) || null,
            analysisScope: metadata.analysisScope === 'internal' || metadata.analysisScope === 'external'
                ? metadata.analysisScope
                : null,
            productSku: toStringValue(metadata.productSku) || null,
        });

        if (savedPurchase.status === 'REFUNDED') {
            return res.status(409).json({
                error: '이미 환불 완료된 주문입니다. 새 주문으로 다시 결제해 주세요.',
                status: 'REFUNDED',
            });
        }

        return res.status(200).json({
            success: true,
            checkoutId,
            orderId,
            orderType,
            analysisId: toStringValue(metadata.analysisId) || null,
            analysisScope: metadata.analysisScope || null,
            productSku: metadata.productSku || null,
        });
    } catch (error: any) {
        console.error('Polar payment confirmation failed:', error);
        return res.status(500).json({ error: error.message || 'Polar payment confirmation failed.' });
    }
}
