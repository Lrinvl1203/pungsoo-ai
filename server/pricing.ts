import { DIGITAL_PRODUCT_TOTAL_KRW } from '../services/pricing.js';
import type { PungsooOrderType } from '../services/productCatalog.js';

export const ORDER_PRICE_KRW: Record<PungsooOrderType, number> = {
    report: DIGITAL_PRODUCT_TOTAL_KRW,
    remedy: DIGITAL_PRODUCT_TOTAL_KRW,
    zodiac: DIGITAL_PRODUCT_TOTAL_KRW,
    frame: 49000,
    object: 79000,
};

export const getExpectedPriceKrw = (orderType: unknown): number | null => {
    if (typeof orderType !== 'string' || !(orderType in ORDER_PRICE_KRW)) {
        return null;
    }

    return ORDER_PRICE_KRW[orderType as PungsooOrderType];
};

export const matchesExpectedPriceKrw = (orderType: unknown, amount: unknown) => {
    const expectedPrice = getExpectedPriceKrw(orderType);
    const numericAmount = Number(amount);

    return expectedPrice !== null
        && Number.isFinite(numericAmount)
        && numericAmount === expectedPrice;
};
