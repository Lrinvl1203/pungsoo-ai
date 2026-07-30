import { describe, expect, it } from 'vitest';
import { bearingFromNormalizedOffset } from '../utils/bearing.js';

describe('정규화 지도 좌표의 방위각 계산', () => {
    it('3:2 지도에서 화면상 북동 45° 드래그를 45°로 계산한다', () => {
        // 600×400 지도에서 오른쪽 60px, 위쪽 60px은 정규화하면
        // dx=0.1, dy=-0.15다. 종횡비 보정이 없으면 33.7°가 되어 이 테스트가 실패한다.
        const bearing = bearingFromNormalizedOffset(60 / 600, -60 / 400, 600 / 400);

        expect(bearing).toBeCloseTo(45, 10);
    });

    it.each([
        ['북', 0, -0.2, 0],
        ['동', 0.2, 0, 90],
        ['남', 0, 0.2, 180],
        ['서', -0.2, 0, 270],
    ])('%s 방향은 종횡비와 무관하게 %d°다', (_label, dx, dy, expected) => {
        expect(bearingFromNormalizedOffset(dx, dy, 1.5)).toBeCloseTo(expected, 10);
        expect(bearingFromNormalizedOffset(dx, dy, 0.75)).toBeCloseTo(expected, 10);
    });

    it('정사각형 지도에서도 북동 45°를 유지한다', () => {
        expect(bearingFromNormalizedOffset(0.2, -0.2, 1)).toBeCloseTo(45, 10);
    });
});
