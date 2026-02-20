
import { UserMetadata, AnalysisResult, SolutionItem } from "../types";

export const analyzeFengShui = async (
  base64Image: string,
  metadata: UserMetadata
): Promise<AnalysisResult> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image, metadata }),
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

