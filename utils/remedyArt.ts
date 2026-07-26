export type RemedyEnergyMode = 'PURIFY' | 'CIRCULATE' | 'AMPLIFY';

export type RemedyArtStyleFamily =
  | 'guardian_abstract'
  | 'modern_minhwa'
  | 'ink_wash'
  | 'geometric_totem';

export type InteriorArtStyleId =
  | 'art_nouveau'
  | 'bauhaus'
  | 'art_deco'
  | 'midcentury'
  | 'renaissance'
  | 'impressionist'
  | 'ukiyoe'
  | 'cinematic_anime';

export type FiveElementKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export interface RemedyArtRoutingInput {
  remedyArt?: {
    deficiency?: string;
    solution_keyword?: string;
    image_generation_prompt?: string;
  } | null;
  fiveElements?: {
    fire?: number;
    water?: number;
    wood?: number;
    earth?: number;
    metal?: number;
    deficient?: string;
    excess?: string;
  } | null;
  zodiacObject?: {
    animal?: string;
    material_and_color?: string;
    specific_pose_or_feature?: string;
  } | null;
  fengShuiScore?: number;
  concern?: string;
  roomType?: string;
  analysisType?: 'internal' | 'external' | string;
  spatialFeatures?: string[];
  interiorStyle?: InteriorArtStyleId | null;
}

export interface RemedyArtProfile {
  targetElement: FiveElementKey;
  excessElement: FiveElementKey | null;
  energyMode: RemedyEnergyMode;
  edition: 'signature' | 'interior';
  styleFamily: RemedyArtStyleFamily;
  interiorStyle: InteriorArtStyleId | null;
  styleLabelKo: string;
  guardianAnimal: string;
  guardianAnimalKo: string;
  guardianVisibility: number;
}

export interface InteriorArtStylePack {
  id: InteriorArtStyleId;
  labelKo: string;
  labelEn: string;
  description: string;
  bestFor: string;
  previewUrl: string;
}

export const REMEDY_STYLE_LABELS: Record<RemedyArtStyleFamily, string> = {
  guardian_abstract: '은호 추상화',
  modern_minhwa: '현대 민화형',
  ink_wash: '수묵 여백형',
  geometric_totem: '기하학적 토템형',
};

export const INTERIOR_ART_STYLE_PACKS: Record<InteriorArtStyleId, InteriorArtStylePack> = {
  art_nouveau: {
    id: 'art_nouveau',
    labelKo: '아르누보 가디언',
    labelEn: 'Art Nouveau Guardian',
    description: '유기적인 곡선과 식물성 장식으로 기운의 흐름을 부드럽게 연결합니다.',
    bestFor: '내추럴 · 플랜테리어 · 곡선 가구',
    previewUrl: '/images/interior-editions/art-nouveau.jpg',
  },
  bauhaus: {
    id: 'bauhaus',
    labelKo: '바우하우스 오행',
    labelEn: 'Bauhaus Elemental',
    description: '절제된 기하 색면으로 오행의 균형과 이동 방향을 선명하게 보여줍니다.',
    bestFor: '미니멀 · 모던 · 업무 공간',
    previewUrl: '/images/interior-editions/bauhaus.jpg',
  },
  art_deco: {
    id: 'art_deco',
    labelKo: '아르데코 가디언',
    labelEn: 'Art Deco Guardian',
    description: '대칭과 부조 같은 깊이로 수호의 존재감과 고급감을 강화합니다.',
    bestFor: '호텔라이크 · 클래식 모던 · 현관',
    previewUrl: '/images/interior-editions/art-deco.jpg',
  },
  midcentury: {
    id: 'midcentury',
    labelKo: '미드센추리 가디언',
    labelEn: 'Mid-century Guardian',
    description: '따뜻한 레트로 색면과 유연한 형태로 거실에 편안하게 스며듭니다.',
    bestFor: '우드톤 · 레트로 · 가족 거실',
    previewUrl: '/images/interior-editions/midcentury.jpg',
  },
  renaissance: {
    id: 'renaissance',
    labelKo: '르네상스 명암',
    labelEn: 'Renaissance Chiaroscuro',
    description: '고전 회화의 깊은 명암과 재료감으로 중후한 수호상을 만듭니다.',
    bestFor: '클래식 · 앤티크 · 서재',
    previewUrl: '/images/interior-editions/renaissance.jpg',
  },
  impressionist: {
    id: 'impressionist',
    labelKo: '인상주의 기운',
    labelEn: 'Impressionist Atmosphere',
    description: '빛과 붓질 속에 수호동물이 나타나도록 회화적으로 번역합니다.',
    bestFor: '밝은 공간 · 침실 · 아트월',
    previewUrl: '/images/interior-editions/impressionist.jpg',
  },
  ukiyoe: {
    id: 'ukiyoe',
    labelKo: '우키요에 가디언',
    labelEn: 'Ukiyo-e Guardian',
    description: '판화의 선과 평면 색채로 수호동물과 순환 경로를 또렷하게 만듭니다.',
    bestFor: '재팬디 · 동양적 미니멀 · 포인트 월',
    previewUrl: '/images/interior-editions/ukiyoe.jpg',
  },
  cinematic_anime: {
    id: 'cinematic_anime',
    labelKo: '시네마틱 애니메이션',
    labelEn: 'Cinematic Anime Guardian',
    description: '절제된 셀 명암과 빛의 깊이로 수호동물을 현대적으로 강조합니다.',
    bestFor: '콘텐츠 룸 · 스튜디오 · 젊은 취향',
    previewUrl: '/images/interior-editions/cinematic-anime.jpg',
  },
};

const ELEMENT_PALETTES: Record<FiveElementKey, string> = {
  wood: 'deep jade, pine green, muted celadon, warm ivory, a trace of charcoal',
  fire: 'restrained cinnabar, coral, warm terracotta, mineral amber, chalk ivory',
  earth: 'warm ochre, sand limestone, muted clay, terracotta, mineral sage, deep umber',
  metal: 'limestone ivory, warm silver gray, pale celadon, graphite, a trace of muted brass',
  water: 'deep cobalt, midnight indigo, muted teal, pale celadon, warm ivory, silver gray',
};

const ELEMENT_FORM: Record<FiveElementKey, string> = {
  wood: 'rising vertical fields and one narrow cleared growth passage',
  fire: 'radiating warm fields and one controlled ascending release',
  earth: 'interlocking grounded layers and one stabilizing junction',
  metal: 'precise cut planes and one clean gathering seam',
  water: 'layered flowing fields and one directional current',
};

const ANIMALS: Array<{
  matches: string[];
  english: string;
  korean: string;
  cues: string;
  visibility: number;
}> = [
  { matches: ['백호', '호랑이', 'tiger'], english: 'tiger', korean: '호랑이', cues: 'one bowed back route and three restrained stripe cuts', visibility: 28 },
  { matches: ['토끼', 'rabbit'], english: 'rabbit', korean: '토끼', cues: 'two long connected ears and one crouching hindquarter arc', visibility: 32 },
  { matches: ['용', 'dragon'], english: 'dragon', korean: '용', cues: 'one long S-curved body route and one short angular head crest', visibility: 28 },
  { matches: ['뱀', 'snake'], english: 'snake', korean: '뱀', cues: 'one S-curved body route and one tapered turning head', visibility: 32 },
  { matches: ['말', 'horse'], english: 'horse', korean: '말', cues: 'one forward neck-and-back diagonal and three restrained mane cuts', visibility: 28 },
  { matches: ['원숭이', 'monkey'], english: 'monkey', korean: '원숭이', cues: 'one compact curved torso and one clearly connected looping tail', visibility: 36 },
  { matches: ['닭', 'rooster', 'chicken'], english: 'rooster', korean: '닭', cues: 'one upright chest route and three small connected crest steps', visibility: 36 },
  { matches: ['돼지', 'pig', 'boar'], english: 'pig', korean: '돼지', cues: 'one low rounded back and one small connected tail turn', visibility: 32 },
  { matches: ['쥐', 'rat', 'mouse'], english: 'rat', korean: '쥐', cues: 'one tapered snout route, one connected round ear, and one long tail current', visibility: 32 },
  { matches: ['소', 'ox', 'cow'], english: 'ox', korean: '소', cues: 'one low heavy shoulder route and two short restrained horn angles', visibility: 36 },
  { matches: ['양', 'goat', 'sheep'], english: 'goat', korean: '양', cues: 'one compact back route and two connected horn curls', visibility: 36 },
  { matches: ['개', 'dog'], english: 'dog', korean: '개', cues: 'one alert chest-and-back route and one connected ear angle', visibility: 36 },
];

const PURIFY_TERMS = ['휴식', '회복', '숙면', '수면', '건강', '불안', '스트레스', '안정', '정화', '치유'];
const CIRCULATE_TERMS = ['관계', '가족', '연애', '소통', '화합', '갈등', '인연', '환대', '순환'];
const AMPLIFY_TERMS = ['사업', '창업', '매출', '재물', '직장', '승진', '성과', '집중', '시험', '성장', '기회', '인지도'];
const GIFT_TERMS = ['선물', '기념', '가족', '연애', '인연', '아이', '부부'];
const WORK_TERMS = ['사업', '창업', '매출', '업무', '사무', '직장', '승진', '성과', '상업', '로비'];

function includesAny(value: string, terms: string[]): boolean {
  const normalized = value.toLowerCase();
  return terms.some(term => normalized.includes(term.toLowerCase()));
}

export function normalizeElement(value?: string | null): FiveElementKey | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes('목') || normalized.includes('木') || normalized.includes('wood')) return 'wood';
  if (normalized.includes('화') || normalized.includes('火') || normalized.includes('fire')) return 'fire';
  if (normalized.includes('토') || normalized.includes('土') || normalized.includes('earth')) return 'earth';
  if (normalized.includes('금') || normalized.includes('金') || normalized.includes('metal')) return 'metal';
  if (normalized.includes('수') || normalized.includes('水') || normalized.includes('water')) return 'water';
  return null;
}

function resolveAnimal(value?: string | null) {
  const normalized = (value || '').toLowerCase();
  return ANIMALS.find(animal =>
    animal.matches.some(match => normalized.includes(match.toLowerCase()))
  ) || ANIMALS[1];
}

export function deriveRemedyEnergyMode(input: RemedyArtRoutingInput): RemedyEnergyMode {
  const concern = `${input.concern || ''} ${input.remedyArt?.solution_keyword || ''}`;
  if (includesAny(concern, PURIFY_TERMS)) return 'PURIFY';
  if (includesAny(concern, CIRCULATE_TERMS)) return 'CIRCULATE';
  if (includesAny(concern, AMPLIFY_TERMS)) return 'AMPLIFY';

  const score = Number(input.fengShuiScore ?? 55);
  if (score <= 42) return 'PURIFY';
  if (score >= 72) return 'AMPLIFY';
  return 'CIRCULATE';
}

export function selectRemedyArtStyle(
  input: RemedyArtRoutingInput,
  energyMode = deriveRemedyEnergyMode(input)
): RemedyArtStyleFamily {
  const context = `${input.concern || ''} ${input.roomType || ''} ${input.remedyArt?.solution_keyword || ''}`;
  const room = (input.roomType || '').toLowerCase();

  if (includesAny(context, GIFT_TERMS)) return 'modern_minhwa';
  if (room.includes('침실') || room.includes('명상') || room.includes('휴식') || energyMode === 'PURIFY') {
    return 'ink_wash';
  }
  if (
    input.analysisType === 'external'
    || includesAny(context, WORK_TERMS)
    || energyMode === 'AMPLIFY'
  ) {
    return 'geometric_totem';
  }
  return 'guardian_abstract';
}

export function isInteriorArtStyleId(value: unknown): value is InteriorArtStyleId {
  return typeof value === 'string' && value in INTERIOR_ART_STYLE_PACKS;
}

export function recommendInteriorArtStyles(input: RemedyArtRoutingInput): InteriorArtStylePack[] {
  const context = [
    input.roomType,
    input.concern,
    input.remedyArt?.solution_keyword,
    ...(input.spatialFeatures || []),
  ].filter(Boolean).join(' ').toLowerCase();
  const energyMode = deriveRemedyEnergyMode(input);
  const scores: Record<InteriorArtStyleId, number> = {
    art_nouveau: 5,
    bauhaus: 5,
    art_deco: 6,
    midcentury: 6,
    renaissance: 2,
    impressionist: 5,
    ukiyoe: 5,
    cinematic_anime: 3,
  };
  const add = (ids: InteriorArtStyleId[], amount: number) => ids.forEach(id => { scores[id] += amount; });

  if (includesAny(context, ['모던', '미니멀', '깔끔', '사무', '업무', '오피스'])) {
    add(['bauhaus', 'art_deco', 'midcentury'], 5);
  }
  if (includesAny(context, ['우드', '나무', '내추럴', '식물', '플랜테리어', '곡선'])) {
    add(['art_nouveau', 'midcentury', 'impressionist'], 5);
  }
  if (includesAny(context, ['클래식', '앤티크', '고전', '호텔', '대리석', '중후'])) {
    add(['art_deco', 'renaissance', 'art_nouveau'], 6);
  }
  if (includesAny(context, ['재팬디', '동양', '한옥', '다다미', '명상', '여백'])) {
    add(['ukiyoe', 'art_nouveau', 'impressionist'], 5);
  }
  if (includesAny(context, ['레트로', '빈티지', '가족', '거실', '따뜻'])) {
    add(['midcentury', 'art_nouveau', 'impressionist'], 4);
  }
  if (includesAny(context, ['애니', '게임', '콘텐츠', '스튜디오', '취미'])) {
    add(['cinematic_anime', 'ukiyoe', 'bauhaus'], 6);
  }
  if (input.analysisType === 'external') add(['art_deco', 'bauhaus', 'ukiyoe'], 3);
  if (energyMode === 'PURIFY') add(['impressionist', 'art_nouveau', 'ukiyoe'], 3);
  if (energyMode === 'CIRCULATE') add(['art_nouveau', 'midcentury', 'ukiyoe'], 3);
  if (energyMode === 'AMPLIFY') add(['art_deco', 'bauhaus', 'cinematic_anime'], 3);

  return (Object.keys(scores) as InteriorArtStyleId[])
    .sort((a, b) => scores[b] - scores[a])
    .slice(0, 3)
    .map(id => INTERIOR_ART_STYLE_PACKS[id]);
}

export function getRemedyArtProfile(input: RemedyArtRoutingInput): RemedyArtProfile {
  const targetElement =
    normalizeElement(input.fiveElements?.deficient)
    || normalizeElement(input.remedyArt?.deficiency)
    || 'earth';
  const excessElement = normalizeElement(input.fiveElements?.excess);
  const energyMode = deriveRemedyEnergyMode(input);
  const styleFamily = selectRemedyArtStyle(input, energyMode);
  const animal = resolveAnimal(input.zodiacObject?.animal);
  const interiorStyle = isInteriorArtStyleId(input.interiorStyle) ? input.interiorStyle : null;

  const visibilityAdjustment: Record<RemedyArtStyleFamily, number> = {
    guardian_abstract: 0,
    modern_minhwa: 28,
    ink_wash: 18,
    geometric_totem: 22,
  };

  return {
    targetElement,
    excessElement,
    energyMode,
    edition: interiorStyle ? 'interior' : 'signature',
    styleFamily,
    interiorStyle,
    styleLabelKo: interiorStyle ? INTERIOR_ART_STYLE_PACKS[interiorStyle].labelKo : REMEDY_STYLE_LABELS[styleFamily],
    guardianAnimal: animal.english,
    guardianAnimalKo: animal.korean,
    guardianVisibility: Math.min(64, animal.visibility + visibilityAdjustment[styleFamily]),
  };
}

function buildInteriorStyleInstruction(style: InteriorArtStyleId): string {
  switch (style) {
    case 'art_nouveau':
      return 'INTERIOR EDITION — ART NOUVEAU GUARDIAN: use elegant botanical curves, flowing ornamental line, matte hand-crafted surface, and asymmetrical organic framing. No copied poster, named artist, decorative border, or jewel-like excess.';
    case 'bauhaus':
      return 'INTERIOR EDITION — BAUHAUS ELEMENTAL: use flat geometric color blocks, disciplined circles and rectangles, clear visual hierarchy, and restrained paper texture. No typography, logo, copied school poster, or sterile corporate graphic.';
    case 'art_deco':
      return 'INTERIOR EDITION — ART DECO GUARDIAN: use stepped geometry, controlled symmetry, shallow mineral-plaster relief, and restrained architectural glamour. No chrome, jewelry display, literal building, or excessive gold.';
    case 'midcentury':
      return 'INTERIOR EDITION — MID-CENTURY GUARDIAN: use warm organic color fields, simplified elegant contour, screen-print texture, and balanced retro rhythm. No advertising copy, kitsch mascot, furniture illustration, or copied vintage poster.';
    case 'renaissance':
      return 'INTERIOR EDITION — RENAISSANCE CHIAROSCURO: use quiet classical chiaroscuro, layered oil-glaze depth, aged fresco and tapestry-like abstract planes. Keep it non-narrative and flat enough for wall art; no palace, battle, landscape, costume, religious scene, or fantasy creature treatment.';
    case 'impressionist':
      return 'INTERIOR EDITION — IMPRESSIONIST ATMOSPHERE: use broken color, visible short brushwork, optical mixing, softened edges, diffused daylight, and rich matte canvas texture. Keep all fields abstract; no literal landscape or copied famous painting.';
    case 'ukiyoe':
      return 'INTERIOR EDITION — UKIYO-E GUARDIAN: use carved dark contour, flat mineral blocks, restrained bokashi-like gradation, washi grain, elegant asymmetry, and controlled negative space. No famous wave, Mount Fuji, historic print copy, Japanese text, or red seal.';
    case 'cinematic_anime':
      return 'INTERIOR EDITION — CINEMATIC ANIMATION GUARDIAN: use refined cel-shaped values, luminous atmospheric depth, restrained line economy, and hand-painted abstract background texture. No named studio, franchise, scenic adventure, ruins, city, mountains, action pose, or cute character treatment.';
  }
}

function buildStyleInstruction(style: RemedyArtStyleFamily): string {
  switch (style) {
    case 'modern_minhwa':
      return [
        'STYLE FAMILY — CONTEMPORARY KOREAN MINHWA',
        'Use a flat symbolic picture plane, opaque matte mineral pigments on hanji, sparse controlled ink contour, and spacious contemporary composition.',
        'The guardian is the clear secondary focal subject, elegant and dignified rather than cute.',
        'Avoid antique reproduction, palace scenery, clouds, pearls, moons, decorative borders, and generic zodiac merchandise.',
      ].join('\n');
    case 'ink_wash':
      return [
        'STYLE FAMILY — CONTEMPORARY INK-WASH NEGATIVE SPACE',
        'Use warm unbleached hanji, wet ink diffusion, dry-brush energy, restrained elemental mineral tint, and large intentional untouched-paper space.',
        'Construct the guardian from two or three economical connected brush masses and let part of its body dissolve into negative space.',
        'Avoid literal scenery, calligraphy, seals, decorative splatter, and an unfinished sketch appearance.',
      ].join('\n');
    case 'geometric_totem':
      return [
        'STYLE FAMILY — GEOMETRIC GUARDIAN TOTEM',
        'Use a frontal orthographic picture plane made from seven to nine interlocking geometric modules with very shallow carved mineral-plaster relief.',
        'Merge the guardian with the elemental channels so the same geometry could later be converted into a 3D object.',
        'Avoid freestanding product photography, deep perspective, toy-like facets, logos, machinery, chrome, and neon.',
      ].join('\n');
    default:
      return [
        'STYLE FAMILY — INTEGRATED GUARDIAN ABSTRACT',
        'Use six to eight large asymmetrical matte pigment fields on subtle hanji with restrained ink diffusion and handmade edges.',
        'The viewer should first read premium abstract wall art and then recognize the guardian within about three seconds.',
        'Avoid a single pasted animal cutout, literal landscape, corporate decoration, and generic spiritual merchandise.',
      ].join('\n');
  }
}

function buildEnergyInstruction(mode: RemedyEnergyMode): string {
  if (mode === 'PURIFY') {
    return 'ENERGY MODE — PURIFY: use a settled, releasing pose; open one clearing passage; reduce visual pressure and let excess energy leave.';
  }
  if (mode === 'AMPLIFY') {
    return 'ENERGY MODE — AMPLIFY: use a rising or forward pose; strengthen one directional route; increase contrast without aggression or visual noise.';
  }
  return 'ENERGY MODE — CIRCULATE: use a curved moving pose; connect separated fields through one turning junction; keep the eye moving without turbulence.';
}

export function buildRemedyArtPrompt(input: RemedyArtRoutingInput): {
  prompt: string;
  profile: RemedyArtProfile;
} {
  const profile = getRemedyArtProfile(input);
  const animal = resolveAnimal(input.zodiacObject?.animal);
  const excessText = profile.excessElement
    ? `The overrepresented ${profile.excessElement.toUpperCase()} energy must be visually softened, redirected, or released.`
    : 'Keep secondary energy restrained so the target element remains dominant.';
  const sourceConcept = [
    input.remedyArt?.solution_keyword,
    input.remedyArt?.image_generation_prompt,
  ].filter(Boolean).join(' / ');

  const prompt = [
    'DELIVERABLE',
    'Create one original premium portrait 3:4 remedy artwork for an A3 matte fine-art print. Output the edge-to-edge artwork only: no room, wall, frame, border, caption, or mockup.',
    '',
    'PRESCRIPTION',
    `Strengthen ${profile.targetElement.toUpperCase()} energy using ${ELEMENT_FORM[profile.targetElement]}.`,
    excessText,
    buildEnergyInstruction(profile.energyMode),
    '',
    profile.interiorStyle
      ? buildInteriorStyleInstruction(profile.interiorStyle)
      : buildStyleInstruction(profile.styleFamily),
    '',
    'GUARDIAN',
    `Integrate exactly one ${profile.guardianAnimal} guardian at approximately ${profile.guardianVisibility}% perceptual recognition.`,
    `Species-defining form grammar: ${animal.cues}.`,
    'Every ear, crest, horn, or tail cue must overlap the body or main elemental field by at least 20%; no detached circles, dots, moons, or floating symbols.',
    'Keep the guardian dignified and calm. It must express the energy mode through its pose, not through facial expression or props.',
    '',
    'PALETTE AND MATERIAL',
    `Use ${ELEMENT_PALETTES[profile.targetElement]}.`,
    'Use matte mineral pigment, subtle hanji fiber, controlled handmade irregularity, separated shadow detail, and print-friendly midtones. No digital gradient or excessive metallic dust.',
    '',
    'COMPOSITION',
    'Portrait 3:4, asymmetric balance, one clear hierarchy, large forms readable from two meters, and an 8% crop-safe margin. Avoid a large empty sky-like top area.',
    '',
    'SEMANTIC FIREWALL',
    `Source concept for emotional intent only: ${sourceConcept || 'quiet elemental balance and personal protection'}.`,
    'Do not literally render any object, landscape, moon, mountain, coin, bowl, portal, mandala, lotus, or scenery named in the source concept. Translate meaning only into color, topology, material, and guardian pose.',
    '',
    'HARD EXCLUSIONS',
    'No text, pseudo-writing, calligraphy, seal, signature, logo, watermark, zodiac badge, mascot, tattoo, heraldic emblem, cute character, human face, human body, photorealistic wildlife, stock background, NFT look, or copied artist style.',
  ].join('\n');

  return { prompt, profile };
}
