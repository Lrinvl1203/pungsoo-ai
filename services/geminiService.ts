
import { UserMetadata, AnalysisResult, SolutionItem } from "../types";

export const analyzeFengShui = async (
  inputData: { base64Image?: string; address?: string },
  metadata: UserMetadata
): Promise<AnalysisResult> => {
  const endpoint = metadata.analysisType === 'external' ? '/api/analyze-location' : '/api/analyze';
  const bodyData = metadata.analysisType === 'external'
    ? { address: inputData.address, metadata }
    : { image: inputData.base64Image, metadata };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "분석 결과를 처리하는 중에 오류가 발생했습니다.");
  }

  return response.json();
};

export const generateToBeImage = async (
  base64Image: string,
  solutions: SolutionItem[]
): Promise<string> => {
  const response = await fetch('/api/generate-visuals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'to-be', image: base64Image, solutions }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "이미지 생성 실패");
  }

  const data = await response.json();
  return data.image;
};

export const generateRemedyArtImage = async (
  prompt: string,
  style: 'modern' | 'buddhist' | 'modern_buddhist' = 'modern'
): Promise<string> => {
  const response = await fetch('/api/generate-visuals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'remedy', prompt, artStyle: style }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "디지털 비방 생성 실패");
  }

  const data = await response.json();
  return data.image;
};


export const generateZodiacArtImage = async (
  zodiacObj: any
): Promise<string> => {
  const response = await fetch('/api/generate-visuals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'zodiac', zodiacObj }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "12간지 비방 생성 실패");
  }

  const data = await response.json();
  return data.image;
};
