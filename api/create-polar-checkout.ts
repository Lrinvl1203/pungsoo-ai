import {
    getClientIp,
    getPolarApiBaseUrl,
    getPolarProductId,
    getRequestOrigin,
    isValidOrderType,
    toNumberValue,
    toStringValue,
} from '../server/polar-shared.js';
import { isAnalysisScope, isProductSku } from '../services/productCatalog.js';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const accessToken = process.env.POLAR_ACCESS_TOKEN || '';
    if (!accessToken) {
        return res.status(500).json({ error: 'POLAR_ACCESS_TOKEN is not configured.' });
    }

    const {
        orderId,
        orderType,
        amount,
        userId,
        analysisId,
        customerEmail,
        customerName,
        analysisScope,
        productSku,
    } = req.body || {};

    if (!orderId || !isValidOrderType(orderType)) {
        return res.status(400).json({ error: 'orderId and a valid orderType are required.' });
    }

    const productId = getPolarProductId(orderType);
    if (!productId) {
        return res.status(500).json({ error: `POLAR_PRODUCT_ID_${orderType.toUpperCase()} is not configured.` });
    }

    const origin = getRequestOrigin(req);
    const numericAmount = toNumberValue(amount);
    const encodedOrderId = encodeURIComponent(toStringValue(orderId));
    const encodedAmount = encodeURIComponent(String(numericAmount || ''));
    const successUrl = `${origin}/payment/success?provider=polar&checkout_id={CHECKOUT_ID}&orderId=${encodedOrderId}&amount=${encodedAmount}`;
    const returnUrl = analysisId
        ? `${origin}/analyze?id=${encodeURIComponent(toStringValue(analysisId))}`
        : `${origin}/analyze`;

    const metadata: Record<string, string | number> = {
        app: 'pungsoo-ai',
        orderId: toStringValue(orderId),
        orderType,
        amount: numericAmount,
    };

    const resolvedUserId = toStringValue(userId);
    const resolvedAnalysisId = toStringValue(analysisId);
    if (resolvedUserId) metadata.userId = resolvedUserId;
    if (resolvedAnalysisId) metadata.analysisId = resolvedAnalysisId;
    if (isAnalysisScope(analysisScope)) metadata.analysisScope = analysisScope;
    if (isProductSku(productSku)) metadata.productSku = productSku;

    const payload: Record<string, unknown> = {
        products: [productId],
        success_url: successUrl,
        return_url: returnUrl,
        metadata,
        external_customer_id: resolvedUserId || undefined,
        customer_email: toStringValue(customerEmail) || undefined,
        customer_name: toStringValue(customerName) || undefined,
        customer_ip_address: getClientIp(req) || undefined,
        locale: 'ko',
        allow_discount_codes: false,
        require_billing_address: false,
    };

    const checkoutCurrency = (process.env.POLAR_CHECKOUT_CURRENCY || '').trim().toLowerCase();
    if (checkoutCurrency) {
        payload.currency = checkoutCurrency;
    }

    try {
        const response = await fetch(`${getPolarApiBaseUrl()}/checkouts/`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Failed to create Polar checkout session.',
                details: data,
            });
        }

        return res.status(200).json({
            success: true,
            checkoutId: data.id,
            url: data.url,
        });
    } catch (error: any) {
        console.error('Polar checkout creation failed:', error);
        return res.status(500).json({ error: error.message || 'Polar checkout creation failed.' });
    }
}
