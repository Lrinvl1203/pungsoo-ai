import { Resend } from 'resend';
import { getProductDescriptor, isAnalysisScope, isProductSku } from '../services/productCatalog.js';
import { getClientIp, getSupabaseAdmin, toNumberValue, toStringValue } from '../server/polar-shared.js';

const ADMIN_EMAIL = 'lrinvl1203@gmail.com';

const escapeHtml = (value: unknown) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const nullableUuid = (value: unknown) => {
    const normalized = toStringValue(value);
    return UUID_PATTERN.test(normalized) ? normalized : null;
};

const truncate = (value: unknown, max = 500) => {
    const normalized = toStringValue(value);
    return normalized.length > max ? normalized.slice(0, max) : normalized;
};

const safeMetadata = (metadata: unknown) => {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {};

    const serialized = JSON.stringify(metadata);
    if (serialized.length <= 6000) return metadata as Record<string, unknown>;

    return {
        truncated: true,
        rawPreview: serialized.slice(0, 6000),
    };
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const resendKey = process.env.RESEND_KEY || process.env.RESEND_API_KEY;
        const { action, orderType, name, contact, message, analysisData, objectSize, refundData, analysisScope, productSku, analysisId } = req.body;

        if (action === 'track-event') {
            const eventName = truncate(req.body?.eventName, 80);
            if (!/^[a-z0-9_.:-]+$/i.test(eventName)) {
                return res.status(400).json({ error: 'Invalid eventName.' });
            }

            try {
                const supabase = getSupabaseAdmin();
                const { error } = await supabase.from('analytics_events').insert([{
                    event_name: eventName,
                    user_id: nullableUuid(req.body?.userId),
                    session_id: truncate(req.body?.sessionId, 120),
                    analysis_id: nullableUuid(req.body?.analysisId),
                    order_id: truncate(req.body?.orderId, 180) || null,
                    order_type: truncate(req.body?.orderType, 60) || null,
                    amount: req.body?.amount == null ? null : toNumberValue(req.body.amount),
                    path: truncate(req.body?.path, 500) || null,
                    referrer: truncate(req.body?.referrer, 500) || null,
                    user_agent: truncate(req.headers?.['user-agent'], 500) || null,
                    ip_address: truncate(getClientIp(req), 80) || null,
                    metadata: safeMetadata(req.body?.metadata),
                }]);

                if (error) {
                    console.warn('[analytics] insert failed:', error.message);
                    return res.status(202).json({ success: false, stored: false });
                }

                return res.status(200).json({ success: true, stored: true });
            } catch (analyticsError: any) {
                console.warn('[analytics] handler failed:', analyticsError?.message || analyticsError);
                return res.status(202).json({ success: false, stored: false });
            }
        }

        if (action === 'admin-list-purchases') {
            const authHeader = String(req.headers?.authorization || '');
            const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
            if (!accessToken) {
                return res.status(401).json({ error: 'Admin session is required.' });
            }

            const supabase = getSupabaseAdmin();
            const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
            if (userError || userData?.user?.email !== ADMIN_EMAIL) {
                return res.status(403).json({ error: 'Admin access denied.' });
            }

            const { data, error } = await supabase
                .from('purchases')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                throw new Error(`Failed to fetch purchases: ${error.message}`);
            }

            const { data: analytics, error: analyticsError } = await supabase
                .from('analytics_events')
                .select('id, created_at, event_name, user_id, session_id, analysis_id, order_id, order_type, amount, path, referrer, metadata')
                .order('created_at', { ascending: false })
                .limit(500);

            if (analyticsError) {
                console.warn(`Failed to fetch analytics events: ${analyticsError.message}`);
            }

            return res.status(200).json({
                purchases: data || [],
                analytics: analyticsError ? [] : (analytics || []),
            });
        }

        if (!orderType || !name || !contact) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (orderType === 'refund') {
            const originalOrderId = String(refundData?.orderId || '').trim();
            if (!originalOrderId) {
                return res.status(400).json({ error: 'Refund request is missing orderId.' });
            }

            const supabase = getSupabaseAdmin();
            const { data: originalPurchase, error: lookupError } = await supabase
                .from('purchases')
                .select('user_id, order_id, order_type, amount, status, analysis_id, analysis_scope, product_sku')
                .eq('order_id', originalOrderId)
                .maybeSingle();

            if (lookupError) {
                throw new Error(`Failed to check original purchase: ${lookupError.message}`);
            }
            if (!originalPurchase?.user_id) {
                return res.status(404).json({ error: 'Original purchase was not found.' });
            }
            if (originalPurchase.status === 'REFUNDED') {
                return res.status(409).json({ error: '이미 환불 완료된 주문입니다.' });
            }
            if (originalPurchase.status !== 'COMPLETED') {
                return res.status(409).json({ error: '결제완료 상태의 주문만 환불 요청할 수 있습니다.' });
            }

            const refundOrderId = `refund_${originalOrderId}`;
            const refundPayload = {
                user_id: originalPurchase.user_id,
                order_id: refundOrderId,
                payment_key: `refund_request_${originalOrderId}`,
                amount: originalPurchase.amount || refundData?.amount || 0,
                order_type: 'refund',
                status: 'REQUESTED',
                buyer_name: name,
                contact_info: `${contact}${message ? `\n\n환불 사유:\n${message}` : ''}`,
                analysis_id: originalPurchase.analysis_id || refundData?.analysisId || null,
                analysis_scope: originalPurchase.analysis_scope || null,
                product_sku: originalPurchase.product_sku || null,
            };

            const { data: existingRequest } = await supabase
                .from('purchases')
                .select('order_id, status')
                .eq('order_id', refundOrderId)
                .maybeSingle();

            if (existingRequest?.status === 'REFUNDED') {
                return res.status(409).json({ error: '이미 처리 완료된 환불 요청입니다.' });
            }

            const { error: saveError } = existingRequest
                ? await supabase.from('purchases').update(refundPayload).eq('order_id', refundOrderId)
                : await supabase.from('purchases').insert([refundPayload]);

            if (saveError) {
                throw new Error(`Failed to save refund request: ${saveError.message}`);
            }

            if (resendKey) {
                try {
                    const resend = new Resend(resendKey);
                    await resend.emails.send({
                        from: '환불요청 <onboarding@resend.dev>',
                        to: 'lrinvl1203@gmail.com',
                        subject: `[풍수 AI] 환불 요청 - ${originalOrderId}`,
                        html: `
                            <h2>환불 요청이 접수되었습니다</h2>
                            <p><strong>주문번호:</strong> ${escapeHtml(originalOrderId)}</p>
                            <p><strong>상품유형:</strong> ${escapeHtml(originalPurchase.order_type)}</p>
                            <p><strong>결제금액:</strong> ${escapeHtml(originalPurchase.amount)}</p>
                            <p><strong>현재상태:</strong> ${escapeHtml(originalPurchase.status)}</p>
                            <p><strong>분석ID:</strong> ${escapeHtml(originalPurchase.analysis_id || '-')}</p>
                            <hr />
                            <p><strong>고객명:</strong> ${escapeHtml(name)}</p>
                            <p><strong>고객 연락처:</strong> ${escapeHtml(contact)}</p>
                            <p><strong>환불 사유:</strong><br />${escapeHtml(message || '미입력').replace(/\n/g, '<br />')}</p>
                            <hr />
                            <p>Polar Dashboard &gt; Sales &gt; 해당 주문 상세에서 Refund Order를 눌러 실제 환불을 처리하세요.</p>
                        `,
                    });
                } catch (emailError) {
                    console.warn('Refund request was saved, but email notification failed:', emailError);
                }
            }

            return res.status(200).json({ success: true, saved: true, emailed: Boolean(resendKey) });
        }

        if (!resendKey) {
            console.error("API Key not found");
            return res.status(500).json({ error: 'Email service configuration error' });
        }

        const resend = new Resend(resendKey);

        if (!['frame', 'object'].includes(orderType)) {
            return res.status(400).json({ error: 'Invalid physical order type.' });
        }

        const resolvedScope = isAnalysisScope(analysisScope) ? analysisScope : 'internal';
        const resolvedProduct = getProductDescriptor(resolvedScope, orderType);
        const resolvedProductSku = isProductSku(productSku) && productSku === resolvedProduct.sku
            ? productSku
            : resolvedProduct.sku;
        const orderTypeName = resolvedProduct.labelKo;

        let emailHtml = `
      <h2>새로운 제작 의뢰: ${orderTypeName}</h2>
      <p><strong>상품 SKU:</strong> ${escapeHtml(resolvedProductSku)}</p>
      <p><strong>분석 범위:</strong> ${resolvedScope === 'internal' ? '내부 공간' : '외부 입지'}</p>
      <p><strong>분석 ID:</strong> ${escapeHtml(analysisId || '-')}</p>
      <p><strong>권장 배치:</strong> ${escapeHtml(resolvedProduct.placementKo)}</p>
      <p><strong>의뢰자 이름:</strong> ${escapeHtml(name)}</p>
      <p><strong>연락처:</strong> ${escapeHtml(contact)}</p>
      <p><strong>추가 요청사항:</strong><br/>${message ? escapeHtml(message).replace(/\n/g, '<br/>') : '없음'}</p>
      <hr />
      <h3>분석 데이터 (처방 정보)</h3>
    `;

        if (analysisData) {
            if (analysisData.remedyArtKeyword) {
                emailHtml += `<p><strong>처방 아트 키워드:</strong> ${escapeHtml(analysisData.remedyArtKeyword)}</p>`;
            }
            if (analysisData.deficiency) {
                emailHtml += `<p><strong>보완할 오행 기운:</strong> ${escapeHtml(analysisData.deficiency)}</p>`;
            }
            if (orderType === 'object' && analysisData.zodiacAnimal) {
                emailHtml += `<p><strong>추천 12간지 동물:</strong> ${escapeHtml(analysisData.zodiacAnimal)}</p>`;
            }
        } else {
            emailHtml += `<p>분석 데이터 없음</p>`;
        }

        if (orderType === 'object' && objectSize) {
            emailHtml += `
      <hr />
      <h3>제작 사이즈</h3>
      <p><strong>가로 (W):</strong> ${escapeHtml(objectSize.width)} cm</p>
      <p><strong>세로 (D):</strong> ${escapeHtml(objectSize.height)} cm</p>
      <p><strong>높이 (H):</strong> ${escapeHtml(objectSize.depth)} cm</p>
      <p style="color:#888;">※ 최종 사이즈는 상담 후 확정됩니다.</p>
    `;
        }

        const data = await resend.emails.send({
            from: '의뢰알림 <onboarding@resend.dev>',
            to: 'lrinvl1203@gmail.com',
            subject: `[풍수 AI] ${truncate(name, 80)}님의 ${orderTypeName} 제작 의뢰`,
            html: emailHtml,
        });

        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
