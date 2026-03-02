import { Resend } from 'resend';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const resendKey = process.env.RESEND_KEY;
        if (!resendKey) {
            console.error("API Key not found");
            return res.status(500).json({ error: 'Email service configuration error' });
        }

        const resend = new Resend(resendKey);
        const { orderType, name, contact, message, analysisData, objectSize } = req.body;

        if (!orderType || !name || !contact) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const orderTypeName = orderType === 'frame' ? '디지털 액자' : '오브제';

        let emailHtml = `
      <h2>새로운 제작 의뢰: ${orderTypeName}</h2>
      <p><strong>의뢰자 이름:</strong> ${name}</p>
      <p><strong>연락처:</strong> ${contact}</p>
      <p><strong>추가 요청사항:</strong><br/>${message ? message.replace(/\n/g, '<br/>') : '없음'}</p>
      <hr />
      <h3>분석 데이터 (처방 정보)</h3>
    `;

        if (analysisData) {
            if (analysisData.remedyArtKeyword) {
                emailHtml += `<p><strong>처방 아트 키워드:</strong> ${analysisData.remedyArtKeyword}</p>`;
            }
            if (analysisData.deficiency) {
                emailHtml += `<p><strong>보완할 오행 기운:</strong> ${analysisData.deficiency}</p>`;
            }
            if (orderType === 'object' && analysisData.zodiacAnimal) {
                emailHtml += `<p><strong>추천 12간지 동물:</strong> ${analysisData.zodiacAnimal}</p>`;
            }
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

        const data = await resend.emails.send({
            from: '의뢰알림 <onboarding@resend.dev>',
            to: 'lrinvl1203@gmail.com',
            subject: `[풍수 AI] ${name}님의 ${orderTypeName} 제작 의뢰`,
            html: emailHtml,
        });

        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
