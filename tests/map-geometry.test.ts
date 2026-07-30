import { describe, expect, it } from 'vitest';
import {
    calculateMapLatitudeDelta,
    MAP_IMAGE_HEIGHT,
    MAP_IMAGE_WIDTH,
    MAP_LONGITUDE_DELTA,
    mapCoordinatesToNormalizedPoint,
    normalizedMapPointToCoordinates,
} from '../server/map-image.js';

const KILOMETERS_PER_LONGITUDE_DEGREE_AT_EQUATOR = 111.320;
const KILOMETERS_PER_LATITUDE_DEGREE = 110.574;

describe('정적 지도 bbox 기하', () => {
    it.each([33, 37.5626, 38])(
        '위도 %d°에서 지리 범위와 이미지 종횡비가 1%% 이내로 일치한다',
        (latitude) => {
            const latitudeDelta = calculateMapLatitudeDelta(latitude);
            const geographicWidth = MAP_LONGITUDE_DELTA
                * 2
                * KILOMETERS_PER_LONGITUDE_DEGREE_AT_EQUATOR
                * Math.cos(latitude * Math.PI / 180);
            const geographicHeight = latitudeDelta
                * 2
                * KILOMETERS_PER_LATITUDE_DEGREE;
            const geographicAspectRatio = geographicWidth / geographicHeight;
            const imageAspectRatio = MAP_IMAGE_WIDTH / MAP_IMAGE_HEIGHT;

            // 기존 latitudeDelta = longitudeDelta * 0.7이면 서울에서 약 1.14가
            // 되어 1.5인 이미지 종횡비와 맞지 않으므로 이 검증을 통과하지 못한다.
            expect(
                Math.abs(geographicAspectRatio - imageAspectRatio) / imageAspectRatio,
            ).toBeLessThan(0.01);
        },
    );

    it.each([33, 37.5626, 38])(
        '위도 %d°에서 핀 정규화 좌표를 위경도로 바꿨다가 정확히 복원한다',
        (latitude) => {
            const center = { latitude, longitude: 126.978 };
            const originalPoint = { x: 0.23, y: 0.76 };
            const coordinate = normalizedMapPointToCoordinates(originalPoint, center);
            const restoredPoint = mapCoordinatesToNormalizedPoint(coordinate, center);

            expect(restoredPoint.x).toBeCloseTo(originalPoint.x, 10);
            expect(restoredPoint.y).toBeCloseTo(originalPoint.y, 10);
        },
    );
});
