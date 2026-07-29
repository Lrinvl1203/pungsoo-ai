import { describe, expect, it } from 'vitest';
import {
    buildRemedyArtPrompt,
    deriveRemedyEnergyMode,
    getRemedyArtProfile,
    selectRemedyArtStyle,
} from '../utils/remedyArt.js';

describe('비방화 에너지 모드·화풍 라우팅', () => {
    it.each([
        [{ concern: '숙면과 회복' }, 'PURIFY'],
        [{ concern: '가족 관계와 소통' }, 'CIRCULATE'],
        [{ concern: '사업 매출 성장' }, 'AMPLIFY'],
        [{ fengShuiScore: 30 }, 'PURIFY'],
        [{ fengShuiScore: 80 }, 'AMPLIFY'],
        [{ fengShuiScore: 55 }, 'CIRCULATE'],
    ] as const)('입력 %o를 %s 모드로 결정한다', (input, expected) => {
        expect(deriveRemedyEnergyMode(input)).toBe(expected);
    });

    it('같은 입력은 항상 같은 화풍과 프로필을 만든다', () => {
        const input = {
            concern: '업무 집중과 성과',
            analysisType: 'external',
            fengShuiScore: 76,
            fiveElements: { deficient: '화', excess: '수' },
            zodiacObject: { animal: '호랑이' },
        };

        expect(selectRemedyArtStyle(input)).toBe('geometric_totem');
        expect(getRemedyArtProfile(input)).toEqual(getRemedyArtProfile(input));
        expect(buildRemedyArtPrompt(input)).toEqual(buildRemedyArtPrompt(input));
    });

    it('침실·정화 경로는 수묵 여백형으로 라우팅한다', () => {
        expect(selectRemedyArtStyle({
            roomType: '침실',
            concern: '숙면',
            fengShuiScore: 60,
        })).toBe('ink_wash');
    });

    it('생성 프롬프트에 의미 방화벽과 문자 금지를 항상 포함한다', () => {
        const { prompt } = buildRemedyArtPrompt({
            remedyArt: { image_generation_prompt: '산과 달이 있는 풍경' },
            zodiacObject: { animal: '토끼' },
        });
        expect(prompt).toContain('SEMANTIC FIREWALL');
        expect(prompt).toContain('No text');
        expect(prompt).toContain('Do not literally render');
    });
});
