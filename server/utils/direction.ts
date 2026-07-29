export interface MountainSector {
    code: string;
    hanja: string;
    korean: string;
    centerDegrees: number;
    startDegrees: number;
    endDegrees: number;
}

export interface SittingFacingDirection {
    inputBearingDegrees: number;
    facing: MountainSector;
    sitting: MountainSector;
    sittingFacingLabel: string;
    distanceToNearestBoundaryDegrees: number;
    ruleSource: string;
    referenceUrl: string;
}

const MOUNTAIN_NAMES = [
    ['N2', '子', '자'],
    ['N3', '癸', '계'],
    ['NE1', '丑', '축'],
    ['NE2', '艮', '간'],
    ['NE3', '寅', '인'],
    ['E1', '甲', '갑'],
    ['E2', '卯', '묘'],
    ['E3', '乙', '을'],
    ['SE1', '辰', '진'],
    ['SE2', '巽', '손'],
    ['SE3', '巳', '사'],
    ['S1', '丙', '병'],
    ['S2', '午', '오'],
    ['S3', '丁', '정'],
    ['SW1', '未', '미'],
    ['SW2', '坤', '곤'],
    ['SW3', '申', '신'],
    ['W1', '庚', '경'],
    ['W2', '酉', '유'],
    ['W3', '辛', '신'],
    ['NW1', '戌', '술'],
    ['NW2', '乾', '건'],
    ['NW3', '亥', '해'],
    ['N1', '壬', '임'],
] as const;

export const TWENTY_FOUR_MOUNTAIN_RULE_SOURCE =
    '현공풍수 지반(地盤) 24산 규칙: 진북 0°의 子를 중심으로 360°를 24개의 15° 구간으로 균등 분할하고, 좌(坐)는 향(向)의 정반대 방향(+180°)으로 판정한다. 구간은 시작각 포함·끝각 제외로 처리한다.';

export const TWENTY_FOUR_MOUNTAIN_REFERENCE_URL =
    'https://doi.org/10.1038/s40494-025-02289-3';

export const normalizeBearingDegrees = (bearing: number): number => (
    ((bearing % 360) + 360) % 360
);

const sectorForBearing = (bearing: number): MountainSector => {
    const normalized = normalizeBearingDegrees(bearing);
    const index = Math.floor(((normalized + 7.5) % 360) / 15);
    const [code, hanja, korean] = MOUNTAIN_NAMES[index];
    const centerDegrees = index === 23 ? 345 : index * 15;

    return {
        code,
        hanja,
        korean,
        centerDegrees,
        startDegrees: normalizeBearingDegrees(centerDegrees - 7.5),
        endDegrees: normalizeBearingDegrees(centerDegrees + 7.5),
    };
};

export const calculateSittingFacingDirection = (
    inputBearingDegrees: number,
): SittingFacingDirection => {
    if (!Number.isFinite(inputBearingDegrees)) {
        throw new Error('Direction bearing must be a finite number.');
    }

    const normalized = normalizeBearingDegrees(inputBearingDegrees);
    const facing = sectorForBearing(normalized);
    const sitting = sectorForBearing(normalized + 180);
    const offsetFromCenter = Math.abs(
        ((normalized - facing.centerDegrees + 540) % 360) - 180,
    );

    return {
        inputBearingDegrees: Math.round(normalized * 10) / 10,
        facing,
        sitting,
        sittingFacingLabel: `${sitting.hanja}산 ${facing.hanja}향 (${sitting.korean}좌 ${facing.korean}향)`,
        distanceToNearestBoundaryDegrees: Math.round((7.5 - offsetFromCenter) * 10) / 10,
        ruleSource: TWENTY_FOUR_MOUNTAIN_RULE_SOURCE,
        referenceUrl: TWENTY_FOUR_MOUNTAIN_REFERENCE_URL,
    };
};

const boundaryCases = [
    { bearing: 0, facing: '子', sitting: '午' },
    { bearing: 7.499, facing: '子', sitting: '午' },
    { bearing: 7.5, facing: '癸', sitting: '丁' },
    { bearing: 352.499, facing: '壬', sitting: '丙' },
    { bearing: 352.5, facing: '子', sitting: '午' },
    { bearing: 180, facing: '午', sitting: '子' },
] as const;

export const assertTwentyFourMountainBoundaries = () => {
    for (const testCase of boundaryCases) {
        const result = calculateSittingFacingDirection(testCase.bearing);
        if (result.facing.hanja !== testCase.facing || result.sitting.hanja !== testCase.sitting) {
            throw new Error(`24-mountain boundary validation failed at ${testCase.bearing}°.`);
        }
    }
};

assertTwentyFourMountainBoundaries();
