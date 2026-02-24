import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildExternalSystemPrompt } from "../constants";
import { buildMingongContext } from "../utils/fengshui";

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { address, metadata } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    const kakaoKey = process.env.VITE_KAKAO_REST_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API Key not configured' });
    }
    if (!kakaoKey) {
        return res.status(500).json({ error: 'Kakao REST API Key not configured' });
    }

    try {
        // 1. 주소를 좌표로 변환 (Kakao Local API)
        const geocodeUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
        const geocodeRes = await fetch(geocodeUrl, {
            headers: { Authorization: `KakaoAK ${kakaoKey}` }
        });
        const geocodeData = await geocodeRes.json();

        if (!geocodeData.documents || geocodeData.documents.length === 0) {
            return res.status(400).json({ error: '입력하신 주소의 좌표를 찾을 수 없습니다. 정확한 주소를 입력해주세요.' });
        }

        const { x, y } = geocodeData.documents[0]; // x: longitude, y: latitude

        // 2. 좌표를 바탕으로 Kakao Static Map 이미지 2장 가져오기
        const fetchMapAsBase64 = async (mapType: 'ROADMAP' | 'SKYVIEW') => {
            // level=3 or 4 is good for neighborhood view
            const url = `https://dapi.kakao.com/v2/local/staticmap?map_type=${mapType}&x=${x}&y=${y}&level=4&marker=type:d|size:mid|pos:${x}%20${y}`;
            const imgRes = await fetch(url, {
                headers: { Authorization: `KakaoAK ${kakaoKey}` }
            });
            if (!imgRes.ok) throw new Error(`지도 이미지를 가져오는데 실패했습니다 (${mapType})`);
            const arrayBuffer = await imgRes.arrayBuffer();
            return Buffer.from(arrayBuffer).toString('base64');
        };

        const mapRoadmapBase64 = await fetchMapAsBase64('ROADMAP');
        const mapSkyviewBase64 = await fetchMapAsBase64('SKYVIEW');

        // 3. Gemini Vision 분석
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro-latest",
            systemInstruction: buildExternalSystemPrompt(),
        });

        const birthYear = metadata.birthDate ? parseInt(String(metadata.birthDate).slice(0, 4), 10) : 0;
        const hasMingong = birthYear >= 1900 && birthYear <= 2010;
        const mingongCtx = hasMingong ? buildMingongContext(birthYear, metadata.gender ?? 'male') : null;

        const mingongSection = hasMingong && mingongCtx ? `
[사전 계산된 사용자 기운 데이터 - AI가 재계산하지 말고 이 값을 그대로 사용하십시오]
- 사용자 본명궁: ${mingongCtx.mingong}궁
- 사택 분류: ${mingongCtx.group === 'east' ? '동사명(東四命)' : '서사명(西四命)'}
- 시대 기운: 9운(2024~2043)
` : '[사용자 생년월일 정보 없음]\n';

        const userPrompt = `
      [메타 정보]
      - 분석할 입지 주소: ${address}
      - 사용자 생년월일: ${metadata.birthDate} (${metadata.gender === 'male' ? '남성' : '여성'})
      - 주요 고민사항: ${metadata.concern}

      ${mingongSection}

      위성 지도와 일반 지도를 함께 첨부했습니다. (중앙의 마커 위치가 분석 대상 건물/토지입니다).
      이지역의 산맥, 도로망, 인접 자연 환경을 종합적으로 분석하여 길흉을 판별하고, 외부 입지용 풍수지리 감정서와 결함 보완용 '디지털 비방(Remedy Art)' 프롬프트를 3페이지 분량의 심층 리포트로 출력해주세요.
    `;

        const imageParts = [
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: mapRoadmapBase64,
                },
            },
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: mapSkyviewBase64,
                },
            }
        ];

        const result = await model.generateContent([userPrompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return res.status(200).json(JSON.parse(cleanedText));

    } catch (error: any) {
        console.error("VERCEL FUNCTION CRASH LOG:", error);
        return res.status(500).json({
            error: error.message || 'External analysis failed',
            stack: error.stack,
            name: error.name
        });
    }
}
