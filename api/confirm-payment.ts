import { Resend } from 'resend';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { paymentKey, orderId, amount, name, contact, message, orderType, analysisData, userId } = req.body;

    if (!paymentKey || !orderId || !amount) {
        return res.status(400).json({ error: 'Missing payment information' });
    }

    const secretKey = process.env.TOSS_SECRET_KEY || 'test_sk_Z1aOwX7K8m2ROk9X22B38yQxzvNP';
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

        // 2. Send Order Email
        const resendKey = process.env.RESEND_KEY;
        if (resendKey) {
            const resend = new Resend(resendKey);
            const orderTypeName = orderType === 'frame' ? '디지털 액자' : '오브제';

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

            await resend.emails.send({
                from: '결제완료 <onboarding@resend.dev>',
                to: 'lrinvl1203@gmail.com',
                subject: `[결제완료] ${name}님의 ${orderTypeName} 제작 의뢰`,
                html: emailHtml,
            });
        }

        // 3. Optional: Save order to Supabase DB here if table exists

        res.status(200).json({ success: true, payment: paymentData });
    } catch (error: any) {
        console.error('Server error during payment confirmation:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
