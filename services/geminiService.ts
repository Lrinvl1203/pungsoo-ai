
import { UserMetadata, AnalysisResult, SolutionItem } from "../types";
import { InteriorArtStyleId, INTERIOR_ART_STYLE_PACKS } from "../utils/remedyArt";
import { TEST_SAMPLE_ANALYSIS, TEST_SAMPLE_REMEDY_ART_IMAGE, TEST_SAMPLE_ZODIAC_IMAGE } from "./sampleAnalysis";
import { supabase } from "./supabaseClient";
import { apiErrorFromResponse } from "../utils/apiError";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const isTestMode = () => {
  if (typeof window !== 'undefined') {
    return import.meta.env.DEV && localStorage.getItem('PUNGSOO_TEST_MODE') === 'true';
  }
  return false;
};

const getApiHeaders = async (requireSession = false) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (error && requireSession) {
    throw new Error('로그인 세션을 확인할 수 없습니다. 다시 로그인해 주세요.');
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else if (requireSession) {
    throw new Error('이미지 생성은 로그인이 필요합니다.');
  }

  return headers;
};

export const analyzeFengShui = async (
  inputData: { base64Image?: string; base64Images?: string[]; address?: string },
  metadata: UserMetadata
): Promise<AnalysisResult> => {
  if (isTestMode()) {
    await delay(1500);
    return TEST_SAMPLE_ANALYSIS;
  }

  const endpoint = metadata.analysisType === 'external' ? '/api/analyze-location' : '/api/analyze';
  const bodyData = metadata.analysisType === 'external'
    ? { address: inputData.address, metadata }
    : {
      image: inputData.base64Image || inputData.base64Images?.[0],
      images: inputData.base64Images,
      metadata,
    };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: await getApiHeaders(),
    body: JSON.stringify(bodyData),
  });

  if (!response.ok) {
    throw await apiErrorFromResponse(response, "분석 결과를 처리하는 중에 오류가 발생했습니다.");
  }

  return response.json();
};

export const generateToBeImage = async (
  base64Image: string,
  solutions: SolutionItem[],
  analysisId: string,
): Promise<string> => {
  if (isTestMode()) {
    await delay(1500);
    return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80';
  }

  const response = await fetch('/api/generate-visuals', {
    method: 'POST',
    headers: await getApiHeaders(true),
    body: JSON.stringify({ type: 'to-be', image: base64Image, solutions, analysisId }),
  });

  if (!response.ok) {
    throw await apiErrorFromResponse(response, "이미지 생성에 실패했습니다.");
  }

  const data = await response.json();
  return data.image;
};

export const generateRemedyArtImage = async (
  result: AnalysisResult,
  metadata: UserMetadata,
  analysisId: string,
  interiorStyle?: InteriorArtStyleId | null
): Promise<string> => {
  if (isTestMode()) {
    await delay(1500);
    if (interiorStyle) return INTERIOR_ART_STYLE_PACKS[interiorStyle].previewUrl;
    return TEST_SAMPLE_REMEDY_ART_IMAGE;
  }

  const response = await fetch('/api/generate-visuals', {
    method: 'POST',
    headers: await getApiHeaders(true),
    body: JSON.stringify({
      type: 'remedy',
      analysisId,
      prompt: result.remedy_art.image_generation_prompt,
      imageSize: metadata.imageSize,
      remedyContext: {
        remedyArt: result.remedy_art,
        fiveElements: result.five_elements,
        zodiacObject: result.zodiac_remedy_object,
        fengShuiScore: result.feng_shui_score,
        concern: metadata.concern,
        roomType: metadata.roomType,
        analysisType: metadata.analysisType,
        spatialFeatures: result.spatial_features,
        interiorStyle: interiorStyle || null,
      },
    }),
  });

  if (!response.ok) {
    throw await apiErrorFromResponse(response, "디지털 비방 생성에 실패했습니다.");
  }

  const data = await response.json();
  return data.image;
};


export const generateZodiacArtImage = async (
  zodiacObj: any,
  analysisId: string,
): Promise<string> => {
  if (isTestMode()) {
    await delay(1500);
    return TEST_SAMPLE_ZODIAC_IMAGE;
  }

  const response = await fetch('/api/generate-visuals', {
    method: 'POST',
    headers: await getApiHeaders(true),
    body: JSON.stringify({ type: 'zodiac', zodiacObj, analysisId }),
  });

  if (!response.ok) {
    throw await apiErrorFromResponse(response, "12간지 비방 생성에 실패했습니다.");
  }

  const data = await response.json();
  return data.image;
};
