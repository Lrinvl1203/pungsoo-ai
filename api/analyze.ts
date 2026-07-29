
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSystemPrompt } from "../server/constants.js";
import { buildMingongContext } from "../server/utils/fengshui.js";
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

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const estimateBase64Bytes = (value: string) => {
  const base64 = (value.split(',')[1] || value).replace(/\s/g, '');
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { image, images, metadata } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('[analyze] GEMINI_API_KEY is not configured.');
    return res.status(500).json({ error: '분석 서비스를 준비할 수 없습니다.', code: 'ANALYSIS_CONFIG_ERROR' });
  }
  if (!metadata || typeof metadata !== 'object') {
    return res.status(400).json({ error: 'metadata is required.' });
  }
  const submittedImages = Array.isArray(images) && images.length > 0
    ? images
    : image
      ? [image]
      : [];
  if (
    submittedImages.length === 0
    || submittedImages.length > 3
    || submittedImages.some((item: unknown) => typeof item !== 'string' || !item)
  ) {
    return res.status(400).json({ error: 'image 또는 최대 3개의 images가 필요합니다.' });
  }
  const normalizedImages = submittedImages as string[];
  const totalImageBytes = normalizedImages.reduce(
    (total, item) => total + estimateBase64Bytes(item),
    0,
  );
  if (totalImageBytes > MAX_IMAGE_BYTES) {
    return res.status(413).json({
      error: '사진 전체 용량이 너무 큽니다. 합계 8MB 이하로 다시 시도해 주세요.',
      code: 'IMAGES_TOO_LARGE',
    });
  }
  let auth;
  try {
    auth = await authenticateOptionalSupabaseRequest(req);
  } catch (error) {
    console.error('[analyze] Supabase auth initialization failed:', error);
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
    console.error('[analyze] Rate limit check failed:', error);
    return sendRateLimitUnavailableResponse(res);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: buildSystemPrompt({ hasDirectionData: false }),
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    }
  });

  const birthYear = metadata.birthDate ? parseInt(String(metadata.birthDate).slice(0, 4), 10) : 0;
  const hasMingong = birthYear >= 1900 && birthYear <= 2010;
  const mingongCtx = hasMingong ? buildMingongContext(birthYear, metadata.gender ?? 'male') : null;

  const mingongSection = hasMingong && mingongCtx ? `
[사전 계산된 이기(理氣) 데이터 - AI가 재계산하지 말고 이 값을 그대로 사용하십시오]
- 본명궁: ${mingongCtx.mingong}궁
- 시대 기운: ${mingongCtx.yun.yun}운(${mingongCtx.yun.startYear}~${mingongCtx.yun.endYear}) - 주관 오행: ${mingongCtx.yun.elementKo}
- ${mingongCtx.yun.yun}운 참고색: ${mingongCtx.yun.luckyColorsKo.join(', ')}
- 공간의 실측 방위는 제공되지 않았습니다. 본명궁을 공간 좌향·길흉방과 결합하지 말고 초견 분석으로만 서술하십시오.
` : '[본명궁 정보 없음 - 형기 중심으로 분석]\n';

  const userPrompt = `
    [메타 정보]
    - 촬영 장소: ${metadata.roomType}
    - 사용자 생년월일: ${metadata.birthDate} (${metadata.gender === 'male' ? '남성' : '여성'})
    - 고민: ${metadata.concern}
    - 제공 사진: ${normalizedImages.length}장
      1번은 공간 전체, 2번은 문/현관, 3번은 창 방향 참고용입니다. 실제 제공된 사진만 상호 대조하십시오.

    ${mingongSection}

    복수 사진은 같은 공간을 다른 각도에서 촬영한 자료입니다. 사진 사이에서 일치하는 구조를 우선하고,
    한 장에서만 보이는 요소는 단정하지 마십시오. 이미지와 메타데이터를 분석하여 풍수지리 진단과
    부족한 오행을 보완할 '디지털 비방(Remedy Art)' 프롬프트를 생성해 주세요.
  `;

  const imageParts = normalizedImages.map((submittedImage) => {
    const mimeType = submittedImage.match(/^data:([^;,]+)[;,]/)?.[1] || 'image/jpeg';
    return {
      inlineData: {
        mimeType,
        data: submittedImage.split(',')[1] || submittedImage,
      },
    };
  });

  try {
    const result = await model.generateContent([userPrompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // Remove non-printable control characters (except \t which is valid in JSON)
    const sanitizedText = cleanedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

    // Try direct parse first; if it fails, repair literal newlines inside JSON strings
    let parsed: any;
    try {
      parsed = JSON.parse(sanitizedText);
    } catch {
      parsed = JSON.parse(repairJsonNewlines(sanitizedText));
    }

    const validated = validateAndNormalizeAnalysis(parsed);
    if (validated.normalizedFields.length > 0) {
      console.warn('[analyze] Gemini fields normalized:', validated.normalizedFields);
    }

    return res.status(200).json(validated.value);
  } catch (error: any) {
    console.error("VERCEL FUNCTION CRASH LOG:", error);
    return res.status(500).json({
      error: '분석 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      code: 'ANALYSIS_FAILED',
    });
  }
}

/**
 * Gemini occasionally emits literal \n, \r, \t inside JSON string values
 * instead of the escaped forms \\n \\r \\t, which breaks JSON.parse.
 * This function walks the raw text and escapes those characters only when
 * they appear inside a JSON string (between unescaped double-quotes).
 */
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
