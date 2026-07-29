import { describe, expect, it } from 'vitest';
import { validateAndNormalizeAnalysis } from '../server/validateAnalysis.js';

const validAnalysis = () => ({
    analysis_summary: '균형 잡힌 공간입니다.',
    detailed_report: '## 상세 분석\n\n관찰 결과입니다.',
    spatial_features: ['창', '문', '도로', '녹지', '채광'],
    feng_shui_score: 82,
    diagnosis: Array.from({ length: 5 }, (_, index) => ({
        type: index % 2 ? '흉(Bad)' : '길(Good)',
        keyword: `진단 ${index + 1}`,
        description: `진단 설명 ${index + 1}`,
    })),
    five_elements: {
        fire: 40,
        water: 60,
        wood: 55,
        earth: 50,
        metal: 45,
        deficient: '화',
        excess: '수',
        advice: '균형을 조정하세요.',
    },
    solution_items: Array.from({ length: 5 }, (_, index) => ({
        item_name: `항목 ${index + 1}`,
        target_problem: `문제 ${index + 1}`,
        placement_guide: `배치 ${index + 1}`,
        product_search_keyword: `검색 ${index + 1}`,
    })),
    remedy_art: {
        deficiency: '화',
        solution_keyword: '따뜻한 균형',
        image_generation_prompt: 'Warm balanced abstract composition.',
        art_story: '공간의 균형을 상징합니다.',
    },
    zodiac_remedy_object: {
        animal: '호랑이',
        material_and_color: '황동과 적색',
        specific_pose_or_feature: '안정적인 자세',
        reason: '보완 목적',
        placement_guide: '현관 안쪽',
    },
    overall_advice: '현장 조건과 함께 참고하세요.',
});

describe('Gemini 분석 응답 검증과 정규화', () => {
    it('정상 응답은 변경 없이 통과한다', () => {
        const result = validateAndNormalizeAnalysis(validAnalysis());
        expect(result.normalizedFields).toEqual([]);
        expect(result.value.feng_shui_score).toBe(82);
        expect(result.value.solution_items).toHaveLength(5);
    });

    it('숫자 타입 불일치를 숫자로 정규화하고 기록한다', () => {
        const input = validAnalysis();
        (input as any).feng_shui_score = '82';
        const result = validateAndNormalizeAnalysis(input);
        expect(result.value.feng_shui_score).toBe(82);
        expect(result.normalizedFields).toContain('feng_shui_score');
    });

    it('점수와 오행 범위를 0~100으로 제한한다', () => {
        const input = validAnalysis();
        input.feng_shui_score = 130;
        input.five_elements.water = -20;
        const result = validateAndNormalizeAnalysis(input);
        expect(result.value.feng_shui_score).toBe(100);
        expect(result.value.five_elements.water).toBe(0);
        expect(result.normalizedFields).toEqual(expect.arrayContaining([
            'feng_shui_score',
            'five_elements.water',
        ]));
    });

    it('진단·공간특성·처방 배열 길이를 안전한 길이로 보정한다', () => {
        const input = validAnalysis();
        input.diagnosis = input.diagnosis.slice(0, 1);
        input.spatial_features = [];
        input.solution_items = input.solution_items.slice(0, 2);
        const result = validateAndNormalizeAnalysis(input);
        expect(result.value.diagnosis).toHaveLength(5);
        expect(result.value.spatial_features).toHaveLength(5);
        expect(result.value.solution_items).toHaveLength(5);
        expect(result.normalizedFields).toEqual(expect.arrayContaining([
            'diagnosis',
            'spatial_features',
            'solution_items',
        ]));
    });

    it('top-level 객체가 아니면 거부한다', () => {
        expect(() => validateAndNormalizeAnalysis(null)).toThrow(/JSON object/i);
        expect(() => validateAndNormalizeAnalysis([])).toThrow(/JSON object/i);
    });
});
