import { describe, expect, it } from 'vitest';
import {
    calculateSittingFacingDirection,
    normalizeBearingDegrees,
} from '../server/utils/direction.js';

describe('24산 좌향 계산', () => {
    it.each([
        [0, '子', '午'],
        [7.499, '子', '午'],
        [7.5, '癸', '丁'],
        [352.499, '壬', '丙'],
        [352.5, '子', '午'],
    ])('%d° 경계값을 시작각 포함·끝각 제외로 판정한다', (bearing, facing, sitting) => {
        const result = calculateSittingFacingDirection(bearing);
        expect(result.facing.hanja).toBe(facing);
        expect(result.sitting.hanja).toBe(sitting);
    });

    it('15° 배수의 중심각을 24개 산에 결정론적으로 배정한다', () => {
        const sectors = Array.from({ length: 24 }, (_, index) =>
            calculateSittingFacingDirection(index * 15).facing.hanja,
        );

        expect(new Set(sectors)).toHaveLength(24);
        expect(sectors[0]).toBe('子');
        expect(sectors[23]).toBe('壬');
    });

    it('음수와 360° 이상 방위각을 정규화한다', () => {
        expect(normalizeBearingDegrees(-7.5)).toBe(352.5);
        expect(calculateSittingFacingDirection(360).inputBearingDegrees).toBe(0);
    });

    it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
        '유한하지 않은 입력 %s을 거부한다',
        (bearing) => {
            expect(() => calculateSittingFacingDirection(bearing)).toThrow(/finite number/i);
        },
    );
});
