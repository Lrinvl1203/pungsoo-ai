export type AnalysisScope = 'internal' | 'external';
export type PungsooOrderType = 'report' | 'remedy' | 'zodiac' | 'frame' | 'object';
export type ProductSku = `${AnalysisScope}_${PungsooOrderType}`;

export interface ProductDescriptor {
    sku: ProductSku;
    scope: AnalysisScope;
    orderType: PungsooOrderType;
    labelKo: string;
    labelEn: string;
    shortDescriptionKo: string;
    placementKo: string;
}

const PRODUCT_COPY: Record<AnalysisScope, Record<PungsooOrderType, Omit<ProductDescriptor, 'sku' | 'scope' | 'orderType'>>> = {
    internal: {
        report: {
            labelKo: '내부 공간 균형 비방서',
            labelEn: 'Interior Balance Reading',
            shortDescriptionKo: '방 사진과 용도, 사용자의 오행을 함께 읽는 내부 구조 분석',
            placementKo: '침실·거실·현관·주방·사무실',
        },
        remedy: {
            labelKo: '룸 가디언 비방화',
            labelEn: 'Room Guardian Artwork',
            shortDescriptionKo: '방 안의 부족한 기운과 수호 동물을 담은 맞춤형 비방 아트',
            placementKo: '분석한 방의 벽면',
        },
        zodiac: {
            labelKo: '데스크 가디언 설계도',
            labelEn: 'Desk Guardian Blueprint',
            shortDescriptionKo: '책상과 선반에 놓는 개인 수호 동물 오브제 설계',
            placementKo: '책상·협탁·선반',
        },
        frame: {
            labelKo: '룸 가디언 액자',
            labelEn: 'Room Guardian Frame',
            shortDescriptionKo: '방의 기운을 보완하도록 제작하는 맞춤형 수호 액자',
            placementKo: '침실·거실·업무 공간의 권장 벽면',
        },
        object: {
            labelKo: '데스크 가디언 오브제',
            labelEn: 'Desk Guardian Totem',
            shortDescriptionKo: '개인의 오행과 방의 목적을 함께 반영한 소형 수호 오브제',
            placementKo: '책상·협탁·선반',
        },
    },
    external: {
        report: {
            labelKo: '외부 입지 수호 비방서',
            labelEn: 'Site Guardian Reading',
            shortDescriptionKo: '주소 주변의 산세·물길·도로 흐름과 사용자의 오행을 함께 읽는 입지 분석',
            placementKo: '주택·상가·사무실·사업장 입지',
        },
        remedy: {
            labelKo: '사이트 가디언 비방화',
            labelEn: 'Site Guardian Artwork',
            shortDescriptionKo: '터의 흐름과 방향을 상징화한 맞춤형 입지 수호 아트',
            placementKo: '현관·로비·카운터 후면',
        },
        zodiac: {
            labelKo: '게이트 가디언 설계도',
            labelEn: 'Gate Guardian Blueprint',
            shortDescriptionKo: '입구와 사업장의 흐름을 지키는 수호 동물 오브제 설계',
            placementKo: '현관·로비·카운터',
        },
        frame: {
            labelKo: '사이트 가디언 액자',
            labelEn: 'Site Guardian Frame',
            shortDescriptionKo: '터의 흐름과 권장 방향을 담아 제작하는 입지 수호 액자',
            placementKo: '현관·로비·카운터 후면의 권장 방향',
        },
        object: {
            labelKo: '게이트 가디언 오브제',
            labelEn: 'Gate Guardian Totem',
            shortDescriptionKo: '입지와 출입구의 흐름을 반영한 현관·카운터용 수호 오브제',
            placementKo: '현관·로비·카운터',
        },
    },
};

export const getProductDescriptor = (
    scope: AnalysisScope,
    orderType: PungsooOrderType,
): ProductDescriptor => ({
    sku: `${scope}_${orderType}`,
    scope,
    orderType,
    ...PRODUCT_COPY[scope][orderType],
});

export const isAnalysisScope = (value: unknown): value is AnalysisScope =>
    value === 'internal' || value === 'external';

export const isProductSku = (value: unknown): value is ProductSku =>
    typeof value === 'string' && /^(internal|external)_(report|remedy|zodiac|frame|object)$/.test(value);

