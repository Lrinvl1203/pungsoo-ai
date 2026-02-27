
import { UserMetadata, AnalysisResult, SolutionItem } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const isTestMode = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('PUNGSOO_TEST_MODE') === 'true';
  }
  return false;
};

export const analyzeFengShui = async (
  inputData: { base64Image?: string; address?: string },
  metadata: UserMetadata
): Promise<AnalysisResult> => {
  if (isTestMode()) {
    await delay(1500);
    return {
      feng_shui_score: 85,
      analysis_summary: "[테스트 모드] 전반적으로 안정적인 기운이 흐르는 공간입니다. 약간의 보완을 통해 완벽한 명당으로 거듭날 수 있습니다.",
      spatial_features: ["넓은 창문 (채광 우수)", "적절한 여백 공간"],
      overall_advice: "현재 매우 좋은 기운을 담고 있습니다. 추천 비방을 적용하면 운기를 더욱 상승시킬 수 있습니다.",
      diagnosis: [
        {
          keyword: "채광 우수 (길)",
          description: "창문을 통한 채광이 좋아 긍정적인 양기가 잘 들어옵니다.",
          type: "길(Good)"
        },
        {
          keyword: "공간 배치 아쉬움 (흉)",
          description: "가구 배치가 기의 흐름을 다소 방해하고 있습니다.",
          type: "흉(Bad)"
        }
      ],
      detailed_report: "이곳은 재물운을 불러오는 좋은 기운이 흐르는 곳입니다.\n현관에서의 기운이 안쪽으로 잘 스며들며, 전체적인 음양의 조화가 맞습니다.\n다만 침대의 방향이나 책상의 위치를 조금 변경한다면 더욱 맑은 기운을 받을 수 있습니다.\n\n*이 결과는 테스트 모드에 의한 가짜 데이터이며, 실제 API 호출 비용이 발생하지 않았습니다.",
      solution_items: [
        {
          item_name: "황금빛 해바라기 액자",
          target_problem: "재물운 상승을 위한 비보",
          placement_guide: "현관에서 들어왔을 때 대각선 방향에 배치하세요.",
          product_search_keyword: "해바라기 액자"
        },
        {
          item_name: "작은 관엽식물",
          target_problem: "목(木)의 기운 보충",
          placement_guide: "햇빛이 잘 드는 창가에 두어 생기를 불어넣으세요.",
          product_search_keyword: "소형 관엽식물"
        }
      ],
      remedy_art: {
        image_generation_prompt: "Mock prompt",
        deficiency: "수(水) 기운",
        solution_keyword: "물, 호수, 푸른색",
        art_story: "잔잔한 호수는 재물을 모으고 기운을 차분하게 가라앉혀 줍니다."
      },
      zodiac_remedy_object: {
        animal: "청룡 (푸른 용)",
        material_and_color: "청동 재질의 푸른색",
        specific_pose_or_feature: "여의주를 물고 하늘로 비상하는 형태",
        placement_guide: "동쪽을 향하게 두어 재물과 명예운을 상승시키세요.",
        reason: "목(木) 기운을 보완하고 성공을 돕기 위해 용의 형상이 가장 적합합니다."
      }
    };
  }

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
  if (isTestMode()) {
    await delay(1500);
    return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80';
  }

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
  if (isTestMode()) {
    await delay(1500);
    return 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80';
  }

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
  if (isTestMode()) {
    await delay(1500);
    return 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?auto=format&fit=crop&w=400&q=80';
  }

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
