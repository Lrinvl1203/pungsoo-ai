
import { GoogleGenAI } from "@google/genai";
import { MASTER_SYSTEM_PROMPT } from "../constants";
import { UserMetadata, AnalysisResult, SolutionItem } from "../types";

// Always create a fresh instance if needed, but for general use:
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const analyzeFengShui = async (
  base64Image: string,
  metadata: UserMetadata
): Promise<AnalysisResult> => {
  const ai = getAI();
  
  const userPrompt = `
    [메타 정보]
    - 촬영 장소: ${metadata.roomType}
    - 방위: ${metadata.direction}
    - 사용자 생년월일: ${metadata.birthDate} (${metadata.gender === 'male' ? '남성' : '여성'})
    - 위치: ${metadata.location || '미지정'}
    - 고민: ${metadata.concern}

    이미지와 메타데이터를 분석하여 풍수지리 진단과 부족한 오행을 보완할 '디지털 비방(Remedy Art)' 프롬프트를 생성해 주세요.
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(',')[1] || base64Image,
    },
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [
        { text: userPrompt },
        imagePart
      ]
    },
    config: {
      systemInstruction: MASTER_SYSTEM_PROMPT,
      temperature: 0.5,
      responseMimeType: "application/json",
    },
  });

  try {
    const text = response.text || "{}";
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedText) as AnalysisResult;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("분석 결과를 처리하는 중에 오류가 발생했습니다.");
  }
};

export const generateToBeImage = async (
  base64Image: string,
  solutions: SolutionItem[]
): Promise<string> => {
  const ai = getAI();
  const itemsText = solutions.map(item => `${item.item_name} (${item.placement_guide})`).join(", ");
  const prompt = `
    Modify this original room image. 
    Maintain EXACT camera angle and room structure. 
    Add these items naturally: ${itemsText}. 
    Style: Photo-realistic, interior design photography.
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(',')[1] || base64Image,
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [imagePart, { text: prompt }],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("이미지 생성 실패");
};

export const generateRemedyArtImage = async (
  prompt: string,
  style: 'modern' | 'buddhist' | 'modern_buddhist' = 'modern'
): Promise<string> => {
  const ai = getAI();
  
  let styleKeywords = "";
  if (style === 'buddhist') {
    styleKeywords = "Traditional Buddhist Art style, Thangka painting aesthetic, Zen spirituality, golden aura, intricate mandala patterns, temple atmosphere, divine and sacred look";
  } else if (style === 'modern_buddhist') {
    styleKeywords = "Fusion of Modern Minimalist and Buddhist Art, sophisticated zen aesthetics, subtle golden lotus or mandala motifs in abstract geometry, contemporary spiritual art, clean lines, meditative atmosphere, gallery quality";
  } else {
    styleKeywords = "Modern Abstract Art style, minimalist, aesthetic, spiritual, 3D render, luxurious texture, cinematic lighting";
  }

  const finalPrompt = `Create a high-quality portrait artistic talisman/digital art based on this concept: ${prompt}. 
  
  Design Style Instructions: ${styleKeywords}.
  
  The image must be suitable for a mobile wallpaper or framed wall art. High resolution, 8k.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: finalPrompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "9:16"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("디지털 비방 생성 실패");
};
