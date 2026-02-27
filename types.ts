
export interface FengShuiDiagnosis {
  type: "길(Good)" | "흉(Bad)";
  keyword: string;
  description: string;
}

export interface SolutionItem {
  item_name: string;
  target_problem: string;
  placement_guide: string;
  product_search_keyword: string;
}

export interface RemedyArt {
  deficiency: string;
  solution_keyword: string;
  image_generation_prompt: string;
  art_story: string;
}

export interface ZodiacRemedyObject {
  animal: string;
  material_and_color: string;
  specific_pose_or_feature: string;
  reason: string;
  placement_guide: string;
}

export interface AnalysisResult {
  analysis_summary: string;
  detailed_report: string; // A4 3-page sized very detailed markdown report
  spatial_features: string[];
  feng_shui_score: number;
  diagnosis: FengShuiDiagnosis[];
  solution_items: SolutionItem[];
  remedy_art: RemedyArt;
  zodiac_remedy_object: ZodiacRemedyObject;
  overall_advice: string;
}

export interface UserMetadata {
  analysisType: 'internal' | 'external';
  roomType?: string; // Only for internal
  address?: string; // Only for external
  birthDate: string;
  gender: 'male' | 'female';
  concern: string;
  artStyle: 'modern' | 'buddhist' | 'modern_buddhist';
}
