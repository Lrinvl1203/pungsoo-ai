import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildExternalSystemPrompt } from "./constants.js";
import { buildMingongContext } from "./utils/fengshui.js";

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

        let x: string, y: string;

        if (geocodeData.documents && geocodeData.documents.length > 0) {
            x = geocodeData.documents[0].x;
            y = geocodeData.documents[0].y;
        } else {
            // 주소 검색 실패 시 키워드 검색으로 폴백 (장소명, 건물명 등 지원)
            const keywordUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(address)}`;
            const keywordRes = await fetch(keywordUrl, {
                headers: { Authorization: `KakaoAK ${kakaoKey}` }
            });
            const keywordData = await keywordRes.json();

            if (!keywordData.documents || keywordData.documents.length === 0) {
                return res.status(400).json({ error: '입력하신 주소의 좌표를 찾을 수 없습니다. 정확한 주소를 입력해주세요.' });
            }
            x = keywordData.documents[0].x;
            y = keywordData.documents[0].y;
        }

        // 2. 좌표를 바탕으로 정적 지도 이미지 2장 가져오기 (Esri ArcGIS REST API - API 키 불필요)
        const lng = parseFloat(x);
        const lat = parseFloat(y);
        const delta = 0.008; // bbox 범위 (약 800m)

        const fetchMapAsBase64 = async (service: string): Promise<string> => {
            const bbox = `${lng - delta},${lat - delta * 0.7},${lng + delta},${lat + delta * 0.7}`;
            const url = `https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/export?bbox=${bbox}&bboxSR=4326&imageSR=4326&size=600,400&f=image&format=jpg`;
            const imgRes = await fetch(url);
            if (!imgRes.ok) throw new Error(`지도 이미지를 가져오는데 실패했습니다 (${service})`);
            const arrayBuffer = await imgRes.arrayBuffer();
            return Buffer.from(arrayBuffer).toString('base64');
        };

        // 위성 이미지
        const mapSkyviewBase64 = await fetchMapAsBase64('World_Imagery');

        // 도로 지도 - OSM 타일 기반 정적 이미지 생성
        const fetchOsmRoadmapBase64 = async (): Promise<string> => {
            // 줌 레벨 15에서 타일 좌표 계산
            const zoom = 15;
            const tileX = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
            const tileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));

            // 중앙 타일 1장 가져오기 (256x256)
            const tileUrl = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;
            const tileRes = await fetch(tileUrl, {
                headers: { 'User-Agent': 'PungsooAI/1.0 (Feng Shui Analysis)' }
            });
            if (!tileRes.ok) throw new Error('도로 지도 타일을 가져오는데 실패했습니다');
            const arrayBuffer = await tileRes.arrayBuffer();
            return Buffer.from(arrayBuffer).toString('base64');
        };

        const mapRoadmapBase64 = await fetchOsmRoadmapBase64();

        // 3. Gemini Vision 분석
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: buildExternalSystemPrompt(),
            generationConfig: {
                responseMimeType: "application/json",
            }
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
                    mimeType: "image/png",
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

        // Remove control characters (0x00-0x1F except \n, \r, \t) that break JSON.parse
        const sanitizedText = cleanedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

        return res.status(200).json(JSON.parse(sanitizedText));

    } catch (error: any) {
        console.error("VERCEL FUNCTION CRASH LOG:", error);
        return res.status(500).json({
            error: error.message || 'External analysis failed',
            stack: error.stack,
            name: error.name
        });
    }
}
