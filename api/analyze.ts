
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSystemPrompt } from "./constants.js";
import { buildMingongContext } from "./utils/fengshui.js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { image, metadata } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key not configured' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: buildSystemPrompt(),
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const birthYear = metadata.birthDate ? parseInt(String(metadata.birthDate).slice(0, 4), 10) : 0;
  const hasMingong = birthYear >= 1900 && birthYear <= 2010;
  const mingongCtx = hasMingong ? buildMingongContext(birthYear, metadata.gender ?? 'male') : null;

  const mingongSection = hasMingong && mingongCtx ? `
[사전 계산된 이기(理氣) 데이터 - AI가 재계산하지 말고 이 값을 그대로 사용하십시오]
- 본명궁: ${mingongCtx.mingong}궁
- 사택 분류: ${mingongCtx.group === 'east' ? '동사명(東四命)' : '서사명(西四命)'}
- 길방: ${mingongCtx.auspiciousDirections.join(', ')}
- 시대 기운: 9운(2024~2043) - 주관 오행: ${mingongCtx.yun.elementKo}
- 9운 행운색: ${mingongCtx.yun.luckyColorsKo.join(', ')}
` : '[본명궁 정보 없음 - 형기 중심으로 분석]\n';

  const userPrompt = `
    [메타 정보]
    - 촬영 장소: ${metadata.roomType}
    - 사용자 생년월일: ${metadata.birthDate} (${metadata.gender === 'male' ? '남성' : '여성'})
    - 고민: ${metadata.concern}

    ${mingongSection}

    이미지와 메타데이터를 분석하여 풍수지리 진단과 부족한 오행을 보완할 '디지털 비방(Remedy Art)' 프롬프트를 생성해 주세요.
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: image.split(',')[1] || image,
    },
  };

  try {
    const result = await model.generateContent([userPrompt, imagePart]);
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

    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error("VERCEL FUNCTION CRASH LOG:", error);
    return res.status(500).json({
      error: error.message || 'Analysis failed',
      stack: error.stack,
      name: error.name
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
