const FIVE_ELEMENT_KEYS = ['fire', 'water', 'wood', 'earth', 'metal'] as const;

const asObject = (value: unknown): Record<string, any> => (
    value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, any>
        : {}
);

const stringValue = (value: unknown, fallback: string, field: string, normalized: string[]) => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    normalized.push(field);
    return fallback;
};

const numberInRange = (
    value: unknown,
    fallback: number,
    field: string,
    normalized: string[],
) => {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) {
        normalized.push(field);
        return fallback;
    }

    const clamped = Math.min(100, Math.max(0, numeric));
    if (clamped !== numeric || typeof value !== 'number') normalized.push(field);
    return Math.round(clamped);
};

const stringArray = (
    value: unknown,
    field: string,
    normalized: string[],
    min: number,
    max: number,
    fallbackPrefix: string,
) => {
    const items = Array.isArray(value)
        ? value.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim()).slice(0, max)
        : [];

    if (!Array.isArray(value) || items.length !== value.length || items.length < min || items.length > max) {
        normalized.push(field);
    }

    while (items.length < min) {
        items.push(`${fallbackPrefix} ${items.length + 1}`);
    }

    return items;
};

export const validateAndNormalizeAnalysis = (input: unknown) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('Analysis response must be a JSON object.');
    }

    const source = asObject(input);
    const normalizedFields: string[] = [];

    const diagnosisSource = Array.isArray(source.diagnosis) ? source.diagnosis : [];
    const diagnosis = diagnosisSource.slice(0, 7).map((item, index) => {
        const row = asObject(item);
        const rawType = typeof row.type === 'string' ? row.type : '';
        const type = /길|good/i.test(rawType) ? '길(Good)' : '흉(Bad)';
        if (type !== rawType) normalizedFields.push(`diagnosis[${index}].type`);

        return {
            type,
            keyword: stringValue(row.keyword, '추가 확인 필요', `diagnosis[${index}].keyword`, normalizedFields),
            description: stringValue(row.description, '현장 정보가 부족하여 추가 확인이 필요합니다.', `diagnosis[${index}].description`, normalizedFields),
        };
    });
    if (!Array.isArray(source.diagnosis) || diagnosis.length < 5 || diagnosisSource.length > 7) {
        normalizedFields.push('diagnosis');
    }
    while (diagnosis.length < 5) {
        diagnosis.push({
            type: '흉(Bad)',
            keyword: '추가 확인 필요',
            description: '현장 정보가 부족하여 추가 확인이 필요합니다.',
        });
    }

    const fiveElementsSource = asObject(source.five_elements);
    const fiveElements: Record<string, unknown> = {};
    for (const key of FIVE_ELEMENT_KEYS) {
        fiveElements[key] = numberInRange(
            fiveElementsSource[key],
            50,
            `five_elements.${key}`,
            normalizedFields,
        );
    }
    fiveElements.deficient = stringValue(fiveElementsSource.deficient, '확인 필요', 'five_elements.deficient', normalizedFields);
    fiveElements.excess = stringValue(fiveElementsSource.excess, '확인 필요', 'five_elements.excess', normalizedFields);
    fiveElements.advice = stringValue(fiveElementsSource.advice, '오행 수치는 참고용으로 확인해 주세요.', 'five_elements.advice', normalizedFields);

    const solutionSource = Array.isArray(source.solution_items) ? source.solution_items : [];
    const solutionItems = solutionSource.slice(0, 5).map((item, index) => {
        const row = asObject(item);
        return {
            item_name: stringValue(row.item_name, '추가 확인 항목', `solution_items[${index}].item_name`, normalizedFields),
            target_problem: stringValue(row.target_problem, '추가 진단 필요', `solution_items[${index}].target_problem`, normalizedFields),
            placement_guide: stringValue(row.placement_guide, '배치 전 현장 상태를 다시 확인해 주세요.', `solution_items[${index}].placement_guide`, normalizedFields),
            product_search_keyword: stringValue(row.product_search_keyword, '공간 정리 소품', `solution_items[${index}].product_search_keyword`, normalizedFields),
        };
    });
    if (!Array.isArray(source.solution_items) || solutionItems.length !== 5 || solutionSource.length !== 5) {
        normalizedFields.push('solution_items');
    }
    while (solutionItems.length < 5) {
        solutionItems.push({
            item_name: '추가 확인 항목',
            target_problem: '추가 진단 필요',
            placement_guide: '배치 전 현장 상태를 다시 확인해 주세요.',
            product_search_keyword: '공간 정리 소품',
        });
    }

    const remedySource = asObject(source.remedy_art);
    const zodiacSource = asObject(source.zodiac_remedy_object);

    const value = {
        ...source,
        analysis_summary: stringValue(source.analysis_summary, '공간 분석 결과를 확인해 주세요.', 'analysis_summary', normalizedFields),
        detailed_report: stringValue(source.detailed_report, '## 분석 안내\n\n세부 감정서 생성이 불완전하여 다시 확인이 필요합니다.', 'detailed_report', normalizedFields),
        spatial_features: stringArray(source.spatial_features, 'spatial_features', normalizedFields, 5, 7, '추가 관찰 필요'),
        feng_shui_score: numberInRange(source.feng_shui_score, 50, 'feng_shui_score', normalizedFields),
        diagnosis,
        five_elements: fiveElements,
        solution_items: solutionItems,
        remedy_art: {
            ...remedySource,
            deficiency: stringValue(remedySource.deficiency, '확인 필요', 'remedy_art.deficiency', normalizedFields),
            solution_keyword: stringValue(remedySource.solution_keyword, '균형과 정돈', 'remedy_art.solution_keyword', normalizedFields),
            image_generation_prompt: stringValue(remedySource.image_generation_prompt, 'A calm, balanced interior remedy artwork.', 'remedy_art.image_generation_prompt', normalizedFields),
            art_story: stringValue(remedySource.art_story, '공간의 균형과 정돈을 상징하는 비방화입니다.', 'remedy_art.art_story', normalizedFields),
        },
        zodiac_remedy_object: {
            ...zodiacSource,
            animal: stringValue(zodiacSource.animal, '수호동물 확인 필요', 'zodiac_remedy_object.animal', normalizedFields),
            material_and_color: stringValue(zodiacSource.material_and_color, '중성 재료와 색상', 'zodiac_remedy_object.material_and_color', normalizedFields),
            specific_pose_or_feature: stringValue(zodiacSource.specific_pose_or_feature, '안정적인 자세', 'zodiac_remedy_object.specific_pose_or_feature', normalizedFields),
            reason: stringValue(zodiacSource.reason, '세부 선정 이유를 다시 확인해 주세요.', 'zodiac_remedy_object.reason', normalizedFields),
            placement_guide: stringValue(zodiacSource.placement_guide, '배치 전 공간 상태를 확인해 주세요.', 'zodiac_remedy_object.placement_guide', normalizedFields),
        },
        overall_advice: stringValue(source.overall_advice, '분석 결과는 참고용이며 현장 상태와 함께 확인해 주세요.', 'overall_advice', normalizedFields),
    };

    return {
        value,
        normalizedFields: [...new Set(normalizedFields)],
    };
};
