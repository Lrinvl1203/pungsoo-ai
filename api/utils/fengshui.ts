export interface YunContext {
    yun: number;
    elementKo: string;
    luckyColorsKo: string[];
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

export function getCurrentYunContext(): YunContext {
    return {
        yun: 9,
        elementKo: '화(Fire)',
        luckyColorsKo: ['보라(Purple)', '빨강(Red)']
    };
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
