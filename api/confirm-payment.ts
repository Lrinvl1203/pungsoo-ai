import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { getProductDescriptor, isAnalysisScope, isProductSku } from '../services/productCatalog.js';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { paymentKey, orderId, amount, name, contact, message, orderType, analysisData, userId, objectSize, analysisId, analysisScope, productSku } = req.body;
    const resolvedScope = isAnalysisScope(analysisScope) ? analysisScope : null;
    const resolvedProductSku = isProductSku(productSku)
        ? productSku
        : resolvedScope && ['report', 'remedy', 'zodiac', 'frame', 'object'].includes(orderType)
            ? getProductDescriptor(resolvedScope, orderType).sku
            : null;

    if (!paymentKey || !orderId || !amount) {
        return res.status(400).json({ error: 'Missing payment information' });
    }

    const secretKey = process.env.TOSS_SECRET_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!secretKey) {
        return res.status(500).json({ error: 'TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다.' });
    }

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Supabase 서버 저장 환경변수가 설정되지 않았습니다. SUPABASE_SERVICE_ROLE_KEY를 추가해주세요.' });
    }

    const encodedKey = Buffer.from(`${secretKey}:`).toString('base64');

    try {
        // 1. Confirm Payment with Toss
        const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${encodedKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentKey,
                orderId,
                amount,
            }),
        });

        if (!tossResponse.ok) {
            const errorData = await tossResponse.json();
            console.error('Toss Payment Confirmation Failed:', errorData);
            return res.status(400).json({ error: '결제 승인에 실패했습니다.', details: errorData });
        }

        const paymentData = await tossResponse.json();

        // 2. Save order to Supabase DB with service role, so RLS cannot block server-side confirmations.
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
            .from('purchases')
            .insert([
                {
                    user_id: userId || null,
                    order_id: orderId,
                    payment_key: paymentKey,
                    amount: Number(amount),
                    order_type: orderType,
                    status: 'COMPLETED',
                    buyer_name: name || '비회원',
                    contact_info: contact || null,
                    analysis_id: analysisId || null,
                    analysis_scope: resolvedScope,
                    product_sku: resolvedProductSku,
                }
            ]);

        if (error) {
            console.error('Failed to insert into purchases table:', error);
            return res.status(500).json({ error: '결제는 승인되었지만 구매 내역 저장에 실패했습니다.', details: error.message });
        }

        // 3. Send Order Email (Only for physical items)
        const isPhysicalOrder = orderType === 'frame' || orderType === 'object';
        const resendKey = process.env.RESEND_KEY;

        if (isPhysicalOrder && resendKey) {
            const resend = new Resend(resendKey);
            const orderTypeName = resolvedScope
                ? getProductDescriptor(resolvedScope, orderType).labelKo
                : orderType === 'frame' ? '디지털 액자' : '오브제';

            let emailHtml = `
        <h2>결제완료: 새로운 제작 의뢰 (${orderTypeName})</h2>
        <p><strong>결제 금액:</strong> ${amount.toLocaleString()}원 (결제키: ${paymentKey})</p>
        <p><strong>의뢰자 이름:</strong> ${name}</p>
        <p><strong>연락처:</strong> ${contact}</p>
        <p><strong>고객 ID (Supabase):</strong> ${userId || '비회원'}</p>
        <p><strong>추가 요청사항:</strong><br/>${message ? message.replace(/\n/g, '<br/>') : '없음'}</p>
        <hr />
        <h3>분석 데이터 (처방 정보)</h3>
      `;

            if (analysisData) {
                if (analysisData.remedyArtKeyword) emailHtml += `<p><strong>처방 아트 키워드:</strong> ${analysisData.remedyArtKeyword}</p>`;
                if (analysisData.deficiency) emailHtml += `<p><strong>보완할 오행 기운:</strong> ${analysisData.deficiency}</p>`;
                if (orderType === 'object' && analysisData.zodiacAnimal) emailHtml += `<p><strong>추천 12간지 동물:</strong> ${analysisData.zodiacAnimal}</p>`;
            } else {
                emailHtml += `<p>분석 데이터 없음</p>`;
            }

            if (orderType === 'object' && objectSize) {
                emailHtml += `
        <hr />
        <h3>제작 사이즈</h3>
        <p><strong>가로 (W):</strong> ${objectSize.width} cm</p>
        <p><strong>세로 (D):</strong> ${objectSize.height} cm</p>
        <p><strong>높이 (H):</strong> ${objectSize.depth} cm</p>
        <p style="color:#888;">※ 최종 사이즈는 상담 후 확정됩니다.</p>
      `;
            }

            await resend.emails.send({
                from: '결제완료 <onboarding@resend.dev>',
                to: 'lrinvl1203@gmail.com',
                subject: `[결제완료] ${name}님의 ${orderTypeName} 제작 의뢰`,
                html: emailHtml,
            });
        }

        // 4. Send confirmation email to CUSTOMER
        if (resendKey && contact && contact.includes('@')) {
            const resend = new Resend(resendKey);
            const scopedProductLabel = resolvedScope && ['report', 'remedy', 'zodiac', 'frame', 'object'].includes(orderType)
                ? getProductDescriptor(resolvedScope, orderType).labelKo
                : null;
            const orderTypeLabel = scopedProductLabel || (orderType === 'frame' ? '디지털 액자 제작'
                : orderType === 'object' ? '12간지 비방 오브제 제작'
                : orderType === 'report' ? '초정밀 도사 감명서'
                : orderType === 'remedy' ? '맞춤형 디지털 비방 아트워크'
                : orderType === 'zodiac' ? '12간지 비방 오브제 설계'
                : '풍수AI 서비스');

            const customerHtml = `
        <div style="font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:520px;margin:0 auto;background:#0c0a06;color:#e2e0dc;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#1a1508,#2a2010);padding:32px 24px;text-align:center;border-bottom:2px solid #d4af37;">
            <h1 style="color:#d4af37;font-size:22px;margin:0 0 8px;">✨ 결제가 완료되었습니다</h1>
            <p style="color:#a09882;font-size:13px;margin:0;">풍수지리 AI 대가 — 천지인 거사</p>
          </div>
          <div style="padding:24px;">
            <div style="background:#1a1508;border:1px solid #333;border-radius:12px;padding:20px;margin-bottom:20px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="color:#a09882;padding:8px 0;font-size:13px;">주문 상품</td><td style="color:#fff;text-align:right;font-weight:bold;font-size:14px;">${orderTypeLabel}</td></tr>
                <tr><td style="color:#a09882;padding:8px 0;font-size:13px;border-top:1px solid #222;">결제 금액</td><td style="color:#d4af37;text-align:right;font-weight:bold;font-size:18px;border-top:1px solid #222;">${Number(amount).toLocaleString()}원</td></tr>
                <tr><td style="color:#a09882;padding:8px 0;font-size:13px;border-top:1px solid #222;">주문 번호</td><td style="color:#888;text-align:right;font-size:11px;font-family:monospace;border-top:1px solid #222;">${orderId}</td></tr>
              </table>
            </div>
            ${isPhysicalOrder ? '<p style="color:#c9c5bd;font-size:13px;line-height:1.7;">의뢰하신 내용이 천지인 거사님께 전달되었습니다.<br/>확인 후 빠르게 연락드리겠습니다.</p>' : '<p style="color:#c9c5bd;font-size:13px;line-height:1.7;">구매하신 콘텐츠가 즉시 활성화됩니다.<br/>앱에 접속하여 확인해 주세요.</p>'}
            <a href="https://41pungsoo-ai.vercel.app/analyze" style="display:block;background:#d4af37;color:#0c0a06;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;margin-top:20px;">풍수AI로 돌아가기</a>
          </div>
          <div style="padding:16px 24px;text-align:center;border-top:1px solid #222;">
            <p style="color:#666;font-size:10px;margin:0;">본 메일은 풍수AI 결제 시스템에서 자동 발송되었습니다.</p>
          </div>
        </div>`;

            try {
                await resend.emails.send({
                    from: '풍수AI <onboarding@resend.dev>',
                    to: contact,
                    subject: `[풍수AI] ${orderTypeLabel} 결제 확인 (${Number(amount).toLocaleString()}원)`,
                    html: customerHtml,
                });
            } catch (emailError) {
                console.warn('Failed to send customer confirmation email:', emailError);
            }
        }

        res.status(200).json({ success: true, payment: paymentData });
    } catch (error: any) {
        console.error('Server error during payment confirmation:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
