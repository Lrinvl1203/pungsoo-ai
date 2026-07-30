import { describe, expect, it } from 'vitest';
import { isGeminiImageInputError } from '../server/gemini-error.js';

describe('Gemini 이미지 입력 오류 분류', () => {
    it('400 이미지 처리 실패를 사용자 입력 오류로 분류한다', () => {
        expect(isGeminiImageInputError({
            status: 400,
            message: '[400 Bad Request] Unable to process input image',
        })).toBe(true);
    });

    it('메시지에 포함된 4xx 상태도 인식한다', () => {
        expect(isGeminiImageInputError({
            message: 'GoogleGenerativeAI Error [400 Bad Request]: Unable to process input image',
        })).toBe(true);
    });

    it('서버 오류와 이미지 이외의 400 오류는 해당 분류에서 제외한다', () => {
        expect(isGeminiImageInputError({
            status: 500,
            message: 'Unable to process input image',
        })).toBe(false);
        expect(isGeminiImageInputError({
            status: 400,
            message: 'Invalid generation config',
        })).toBe(false);
    });
});
