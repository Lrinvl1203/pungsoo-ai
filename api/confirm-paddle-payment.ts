import { createClient } from '@supabase/supabase-js';

const PADDLE_API_BASE_URL = process.env.PADDLE_ENV === 'sandbox'
    ? 'https://sandbox-api.paddle.com'
    : 'https://api.paddle.com';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { transactionId, orderId } = req.body || {};

    if (!transactionId || typeof transactionId !== 'string') {
        return res.status(400).json({ error: 'Paddle transactionId가 필요합니다.' });
    }

    const paddleApiKey = process.env.PADDLE_API_KEY || '';
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!paddleApiKey) {
        return res.status(500).json({ error: 'PADDLE_API_KEY 환경변수가 설정되지 않았습니다.' });
    }

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Supabase 서버 저장 환경변수가 설정되지 않았습니다. SUPABASE_SERVICE_ROLE_KEY를 추가해주세요.' });
    }

    try {
        const paddleResponse = await fetch(`${PADDLE_API_BASE_URL}/transactions/${encodeURIComponent(transactionId)}`, {
            headers: {
                Authorization: `Bearer ${paddleApiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!paddleResponse.ok) {
            const details = await paddleResponse.text();
            return res.status(400).json({ error: 'Paddle 거래 조회에 실패했습니다.', details });
        }

        const transaction = await paddleResponse.json();
        const data = transaction?.data;

        if (!data || !['paid', 'completed'].includes(data.status)) {
            return res.status(409).json({ error: '아직 완료되지 않은 Paddle 거래입니다.', status: data?.status || null });
        }

        const customData = data.custom_data || {};
        const orderType = customData.orderType || null;
        const userId = customData.userId || null;
        const analysisId = customData.analysisId || null;
        const analysisScope = ['internal', 'external'].includes(customData.analysisScope) ? customData.analysisScope : null;
        const productSku = typeof customData.productSku === 'string' ? customData.productSku : null;
        const total = Number(data.details?.totals?.total || 0);

        if (!['report', 'remedy', 'zodiac', 'frame', 'object'].includes(orderType)) {
            return res.status(400).json({ error: 'Paddle 거래의 customData.orderType이 올바르지 않습니다.' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const purchaseOrderId = orderId || customData.orderId || transactionId;

        const { error } = await supabase
            .from('purchases')
            .upsert([
                {
                    user_id: userId || null,
                    order_id: purchaseOrderId,
                    payment_key: transactionId,
                    amount: total,
                    order_type: orderType,
                    status: 'COMPLETED',
                    buyer_name: data.customer_id || 'Paddle customer',
                    contact_info: data.customer_id || null,
                    analysis_id: analysisId || null,
                    analysis_scope: analysisScope,
                    product_sku: productSku,
                }
            ], { onConflict: 'order_id' });

        if (error) {
            console.error('Failed to insert Paddle purchase:', error);
            return res.status(500).json({ error: '구매 내역 저장에 실패했습니다.', details: error.message });
        }

        return res.status(200).json({
            success: true,
            transactionId,
            orderType,
            analysisId,
            analysisScope,
            productSku,
        });
    } catch (error: any) {
        console.error('Paddle confirmation failed:', error);
        return res.status(500).json({ error: error.message || 'Paddle 결제 확인 중 오류가 발생했습니다.' });
    }
}
