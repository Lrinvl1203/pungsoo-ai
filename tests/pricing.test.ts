import { describe, expect, it } from 'vitest';
import {
    getExpectedPriceKrw,
    matchesExpectedPriceKrw,
    ORDER_PRICE_KRW,
} from '../server/pricing.js';

describe('서버 정가표', () => {
    it.each(Object.entries(ORDER_PRICE_KRW))('%s 정가 %d원을 반환한다', (orderType, amount) => {
        expect(getExpectedPriceKrw(orderType)).toBe(amount);
        expect(matchesExpectedPriceKrw(orderType, amount)).toBe(true);
    });

    it.each([
        ['report', 1],
        ['frame', 79000],
        ['object', 49000],
        ['unknown', 9900],
        ['report', Number.NaN],
    ])('%s의 변조 금액 %s을 거부한다', (orderType, amount) => {
        expect(matchesExpectedPriceKrw(orderType, amount)).toBe(false);
    });

    it('알 수 없는 주문 유형은 정가가 없다', () => {
        expect(getExpectedPriceKrw('refund')).toBeNull();
        expect(getExpectedPriceKrw(null)).toBeNull();
    });
});
