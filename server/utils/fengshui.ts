export interface YunContext {
    yun: number;
    elementKo: string;
    luckyColorsKo: string[];
    startYear: number;
    endYear: number;
}

export interface MingongContext {
    mingong: number;
    group: 'east' | 'west';
    auspiciousDirections: string[];
    yun: YunContext;
}

export function calculateMingong(birthYear: number, gender: 'male' | 'female'): number {
    let sum = birthYear.toString().split('').reduce((acc, curr) => acc + parseInt(curr, 10), 0);
    while (sum > 9) {
        sum = sum.toString().split('').reduce((acc, curr) => acc + parseInt(curr, 10), 0);
    }

    let mingong = 0;
    if (gender === 'male') {
        mingong = 11 - sum;
        while (mingong > 9) mingong -= 9;
        if (mingong === 5) mingong = 9;
    } else {
        mingong = sum - 4;
        while (mingong <= 0) mingong += 9;
        if (mingong === 5) mingong = 9;
    }
    return mingong;
}

export function getEastWestGroup(mingong: number): 'east' | 'west' {
    if ([1, 3, 4, 9].includes(mingong)) return 'east';
    return 'west';
}

export function getAuspiciousDirections(group: 'east' | 'west'): string[] {
    if (group === 'east') return ['북', '동', '남동', '남'];
    return ['서', '북서', '북동', '남서'];
}

const YUN_PROFILES: Record<number, Pick<YunContext, 'elementKo' | 'luckyColorsKo'>> = {
    1: { elementKo: '수(Water)', luckyColorsKo: ['파랑(Blue)', '검정(Black)'] },
    2: { elementKo: '토(Earth)', luckyColorsKo: ['황토(Ochre)', '베이지(Beige)'] },
    3: { elementKo: '목(Wood)', luckyColorsKo: ['초록(Green)', '청록(Teal)'] },
    4: { elementKo: '목(Wood)', luckyColorsKo: ['초록(Green)', '청록(Teal)'] },
    5: { elementKo: '토(Earth)', luckyColorsKo: ['황토(Ochre)', '베이지(Beige)'] },
    6: { elementKo: '금(Metal)', luckyColorsKo: ['흰색(White)', '회색(Gray)'] },
    7: { elementKo: '금(Metal)', luckyColorsKo: ['흰색(White)', '회색(Gray)'] },
    8: { elementKo: '토(Earth)', luckyColorsKo: ['황토(Ochre)', '베이지(Beige)'] },
    9: { elementKo: '화(Fire)', luckyColorsKo: ['보라(Purple)', '빨강(Red)'] },
};

const getSeoulCalendarDate = (date: Date) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const value = (type: Intl.DateTimeFormatPartTypes) => Number(
        parts.find(part => part.type === type)?.value,
    );

    return {
        year: value('year'),
        month: value('month'),
        day: value('day'),
    };
};

export function getYunContext(date = new Date()): YunContext {
    if (Number.isNaN(date.getTime())) {
        throw new Error('A valid date is required to calculate the San Yuan period.');
    }

    const seoul = getSeoulCalendarDate(date);
    const effectiveYear = seoul.month < 2 || (seoul.month === 2 && seoul.day < 4)
        ? seoul.year - 1
        : seoul.year;
    const periodOffset = Math.floor((effectiveYear - 1864) / 20);
    const yun = ((periodOffset % 9) + 9) % 9 + 1;
    const startYear = 1864 + periodOffset * 20;
    const profile = YUN_PROFILES[yun];

    return {
        yun,
        elementKo: profile.elementKo,
        luckyColorsKo: profile.luckyColorsKo,
        startYear,
        endYear: startYear + 19,
    };
}

export function getCurrentYunContext(): YunContext {
    return getYunContext(new Date());
}

export function buildMingongContext(birthYear: number, gender: 'male' | 'female'): MingongContext {
    const mingong = calculateMingong(birthYear, gender);
    const group = getEastWestGroup(mingong);
    const auspiciousDirections = getAuspiciousDirections(group);
    const yun = getCurrentYunContext();

    return {
        mingong,
        group,
        auspiciousDirections,
        yun
    };
}

const yunBoundaryCases = [
    { iso: '2024-02-03T23:59:59+09:00', expected: 8 },
    { iso: '2024-02-04T00:00:00+09:00', expected: 9 },
    { iso: '2043-12-31T23:59:59+09:00', expected: 9 },
    { iso: '2044-02-03T23:59:59+09:00', expected: 9 },
    { iso: '2044-02-04T00:00:00+09:00', expected: 1 },
] as const;

export function assertYunBoundaryCases() {
    for (const testCase of yunBoundaryCases) {
        const result = getYunContext(new Date(testCase.iso));
        if (result.yun !== testCase.expected) {
            throw new Error(`San Yuan period boundary validation failed for ${testCase.iso}.`);
        }
    }
}

assertYunBoundaryCases();
