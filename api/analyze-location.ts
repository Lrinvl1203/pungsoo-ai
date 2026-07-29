import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildExternalSystemPrompt } from "../server/constants.js";
import { buildMingongContext } from "../server/utils/fengshui.js";
import { calculateSittingFacingDirection } from "../server/utils/direction.js";
import { fetchArcGisMapImage, isValidMapCoordinate } from "../server/map-image.js";
import { authenticateOptionalSupabaseRequest } from "../server/supabase-auth.js";
import {
    consumeRateLimits,
    getAccountRateLimitSubject,
    getGlobalRateLimitSubject,
    getIpRateLimitSubject,
    readPositiveIntEnv,
    sendCircuitBreakerResponse,
    sendRateLimitResponse,
    sendRateLimitUnavailableResponse,
} from "../server/rate-limit.js";
import { validateAndNormalizeAnalysis } from "../server/validateAnalysis.js";

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { address, metadata } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    const kakaoKey = process.env.VITE_KAKAO_REST_API_KEY;

    if (!apiKey) {
        console.error('[analyze-location] GEMINI_API_KEY is not configured.');
        return res.status(500).json({ error: '입지 분석 서비스를 준비할 수 없습니다.', code: 'ANALYSIS_CONFIG_ERROR' });
    }
    if (!kakaoKey) {
        console.error('[analyze-location] Kakao REST API key is not configured.');
        return res.status(500).json({ error: '입지 분석 서비스를 준비할 수 없습니다.', code: 'MAP_CONFIG_ERROR' });
    }
    if (!address || typeof address !== 'string') {
        return res.status(400).json({ error: 'address is required.' });
    }
    if (!metadata || typeof metadata !== 'object') {
        return res.status(400).json({ error: 'metadata is required.' });
    }

    let auth;
    try {
        auth = await authenticateOptionalSupabaseRequest(req);
    } catch (error) {
        console.error('[analyze-location] Supabase auth initialization failed:', error);
        return sendRateLimitUnavailableResponse(res);
    }
    if (auth.ok === false) {
        return res.status(auth.status).json({ error: '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.', code: 'INVALID_SESSION' });
    }

    const rateSubject = auth.user
        ? getAccountRateLimitSubject(auth.user.id)
        : getIpRateLimitSubject(req);
    const rateRules = auth.user
        ? [
            { action: 'analysis.account.hour', limit: 10, windowSeconds: 60 * 60 },
            { action: 'analysis.account.day', limit: 30, windowSeconds: 24 * 60 * 60 },
        ]
        : [
            { action: 'analysis.ip.hour', limit: 3, windowSeconds: 60 * 60 },
            { action: 'analysis.ip.day', limit: 5, windowSeconds: 24 * 60 * 60 },
        ];

    try {
        const rateLimit = await consumeRateLimits(rateSubject, rateRules, auth.supabase);
        if (!rateLimit.allowed) {
            return sendRateLimitResponse(res, rateLimit, '분석 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.');
        }

        const dailyCap = await consumeRateLimits(
            getGlobalRateLimitSubject(),
            [{
                action: 'analysis.global.day',
                limit: readPositiveIntEnv('ANALYZE_DAILY_CAP', 100),
                windowSeconds: 24 * 60 * 60,
            }],
            auth.supabase,
        );
        if (!dailyCap.allowed) {
            return sendCircuitBreakerResponse(res, '오늘 준비된 분석 처리량을 모두 사용했습니다. 내일 다시 시도해 주세요.');
        }
    } catch (error) {
        console.error('[analyze-location] Rate limit check failed:', error);
        return sendRateLimitUnavailableResponse(res);
    }

    try {
        // 1. 사용자가 확인한 지도 핀을 우선 사용하고, 기존 주소 입력은 Kakao 좌표 검색으로 폴백한다.
        let latitude = Number(metadata.latitude);
        let longitude = Number(metadata.longitude);
        const hasConfirmedMapPin = metadata.locationConfirmed === true
            && isValidMapCoordinate(latitude, longitude);

        if (!hasConfirmedMapPin) {
            const geocodeUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
            const geocodeRes = await fetch(geocodeUrl, {
                headers: { Authorization: `KakaoAK ${kakaoKey}` }
            });
            const geocodeData = await geocodeRes.json();

            if (geocodeData.documents && geocodeData.documents.length > 0) {
                longitude = Number(geocodeData.documents[0].x);
                latitude = Number(geocodeData.documents[0].y);
            } else {
                const keywordUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(address)}`;
                const keywordRes = await fetch(keywordUrl, {
                    headers: { Authorization: `KakaoAK ${kakaoKey}` }
                });
                const keywordData = await keywordRes.json();

                if (!keywordData.documents || keywordData.documents.length === 0) {
                    return res.status(400).json({ error: '입력하신 주소의 좌표를 찾을 수 없습니다. 정확한 주소를 입력해주세요.' });
                }
                longitude = Number(keywordData.documents[0].x);
                latitude = Number(keywordData.documents[0].y);
            }
        }

        if (!isValidMapCoordinate(latitude, longitude)) {
            return res.status(400).json({ error: '분석 위치 좌표가 올바르지 않습니다.' });
        }

        // 2. 같은 중심점·축척의 위성/도로 이미지를 사용하므로 두 이미지 모두 정중앙이 분석 대상이다.
        const [mapSkyview, mapRoadmap] = await Promise.all([
            fetchArcGisMapImage(latitude, longitude, 'World_Imagery'),
            fetchArcGisMapImage(latitude, longitude, 'World_Street_Map'),
        ]);
        const mapSkyviewBase64 = mapSkyview.toString('base64');
        const mapRoadmapBase64 = mapRoadmap.toString('base64');

        const rawBearing = Number(metadata.entranceBearingDegrees);
        const hasDirectionData = metadata.directionMethod === 'map_arrow'
            && Number.isFinite(rawBearing)
            && rawBearing >= 0
            && rawBearing < 360;
        const direction = hasDirectionData
            ? calculateSittingFacingDirection(rawBearing)
            : null;

        // 3. Gemini Vision 분석
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: buildExternalSystemPrompt({ hasDirectionData }),
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.4,
            }
        });

        const birthYear = metadata.birthDate ? parseInt(String(metadata.birthDate).slice(0, 4), 10) : 0;
        const hasMingong = birthYear >= 1900 && birthYear <= 2010;
        const mingongCtx = hasMingong ? buildMingongContext(birthYear, metadata.gender ?? 'male') : null;

        const mingongSection = hasMingong && mingongCtx ? `
[사전 계산된 사용자 기운 데이터 - AI가 재계산하지 말고 이 값을 그대로 사용하십시오]
- 사용자 본명궁: ${mingongCtx.mingong}궁
- 시대 기운: ${mingongCtx.yun.yun}운(${mingongCtx.yun.startYear}~${mingongCtx.yun.endYear}) - 주관 오행: ${mingongCtx.yun.elementKo}
${hasDirectionData ? `- 사택 분류: ${mingongCtx.group === 'east' ? '동사명(東四命)' : '서사명(西四命)'}
- 개인 길방 참고: ${mingongCtx.auspiciousDirections.join(', ')}` : '- 실측 방위가 없으므로 사택 분류와 개인 길방을 공간 좌향에 결합하지 마십시오.'}
` : '[사용자 생년월일 정보 없음]\n';

        const directionSection = direction ? `
[사전 계산된 추정 방위·24산 데이터 - AI가 재계산하거나 다른 산으로 바꾸지 말고 이 값을 그대로 사용하십시오]
- 입력 방위각: 진북 기준 시계방향 ${direction.inputBearingDegrees}°
- 측정 방식: 지도 화살표(map_arrow), 사용자 추정치
- 신뢰도: 낮음(low)
- 향(向): ${direction.facing.hanja}(${direction.facing.korean}, ${direction.facing.code}), 중심각 ${direction.facing.centerDegrees}°
- 좌(坐): ${direction.sitting.hanja}(${direction.sitting.korean}, ${direction.sitting.code}), 중심각 ${direction.sitting.centerDegrees}°
- 좌향 판정: ${direction.sittingFacingLabel}
- 가장 가까운 24산 경계까지: ${direction.distanceToNearestBoundaryDegrees}°
- 판정 규칙: ${direction.ruleSource}
- 규칙 참고: ${direction.referenceUrl}
- 반드시 "추정 방위"라고 표현하고 현장 실측값으로 과장하지 마십시오.
` : `
[방위 데이터 없음]
- 대문·현관 외향 방위가 제공되지 않았습니다.
- 결과를 "초견 분석"으로 표시하고 동서사택·길흉방·좌향을 확정하지 마십시오.
`;

        const userPrompt = `
      [메타 정보]
      - 분석할 입지 주소: ${address}
      - 사용자가 확인한 분석 좌표: 위도 ${latitude.toFixed(6)}, 경도 ${longitude.toFixed(6)}
      - 사용자 생년월일: ${metadata.birthDate} (${metadata.gender === 'male' ? '남성' : '여성'})
      - 주요 고민사항: ${metadata.concern}

      ${mingongSection}
      ${directionSection}

      위성 지도와 일반 지도를 같은 중심점과 축척으로 첨부했습니다. 별도의 마커는 그려져 있지 않으며, 두 이미지의 정중앙 지점이 분석 대상 건물/토지입니다. 두 이미지 모두 위쪽이 진북입니다.
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

        // Remove control characters (0x00-0x1F except \n, \r, \t) that break JSON.parse
        const sanitizedText = cleanedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

        let parsed: any;
        try {
            parsed = JSON.parse(sanitizedText);
        } catch {
            parsed = JSON.parse(repairJsonNewlines(sanitizedText));
        }

        const validated = validateAndNormalizeAnalysis(parsed);
        if (validated.normalizedFields.length > 0) {
            console.warn('[analyze-location] Gemini fields normalized:', validated.normalizedFields);
        }

        return res.status(200).json(validated.value);

    } catch (error: any) {
        console.error("VERCEL FUNCTION CRASH LOG:", error);
        return res.status(500).json({
            error: '입지 분석 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
            code: 'EXTERNAL_ANALYSIS_FAILED',
        });
    }
}

function repairJsonNewlines(text: string): string {
    let inString = false;
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const prev = i > 0 ? text[i - 1] : '';
        if (ch === '"' && prev !== '\\') {
            inString = !inString;
            result += ch;
            continue;
        }
        if (inString) {
            if (ch === '\n') { result += '\\n'; continue; }
            if (ch === '\r') { result += '\\r'; continue; }
            if (ch === '\t') { result += '\\t'; continue; }
        }
        result += ch;
    }
    return result;
}
