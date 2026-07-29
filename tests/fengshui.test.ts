import { describe, expect, it } from 'vitest';
import {
    calculateMingong,
    getAuspiciousDirections,
    getEastWestGroup,
    getYunContext,
} from '../server/utils/fengshui.js';

describe('삼원구운 날짜 경계', () => {
    it.each([
        ['2024-02-03T23:59:59+09:00', 8, 2004, 2023],
        ['2024-02-04T00:00:00+09:00', 9, 2024, 2043],
        ['2044-02-03T23:59:59+09:00', 9, 2024, 2043],
        ['2044-02-04T00:00:00+09:00', 1, 2044, 2063],
    ])('%s의 운 경계를 판정한다', (iso, yun, startYear, endYear) => {
        expect(getYunContext(new Date(iso))).toMatchObject({ yun, startYear, endYear });
    });

    it('잘못된 날짜를 거부한다', () => {
        expect(() => getYunContext(new Date('invalid'))).toThrow(/valid date/i);
    });
});

describe('본명궁과 동서사택', () => {
    it.each([
        [1985, 'male' as const, 6, 'west'],
        [1985, 'female' as const, 1, 'east'],
        [1990, 'male' as const, 1, 'east'],
        [1990, 'female' as const, 6, 'west'],
    ])('%d년생 %s의 본명궁을 계산한다', (year, gender, mingong, group) => {
        expect(calculateMingong(year, gender)).toBe(mingong);
        expect(getEastWestGroup(mingong)).toBe(group);
    });

    it('동사택과 서사택의 길방 목록을 분리한다', () => {
        expect(getAuspiciousDirections('east')).toEqual(['북', '동', '남동', '남']);
        expect(getAuspiciousDirections('west')).toEqual(['서', '북서', '북동', '남서']);
    });
});
