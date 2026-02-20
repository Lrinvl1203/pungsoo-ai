
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

export interface AnalysisResult {
  analysis_summary: string;
  spatial_features: string[];
  feng_shui_score: number;
  diagnosis: FengShuiDiagnosis[];
  solution_items: SolutionItem[];
  remedy_art: RemedyArt;
  overall_advice: string;
}

export interface UserMetadata {
  roomType: string;
  direction: string;
  birthDate: string;
  gender: 'male' | 'female';
  concern: string;
  location?: string;
  artStyle: 'modern' | 'buddhist' | 'modern_buddhist';
}
