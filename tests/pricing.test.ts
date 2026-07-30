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
    // 결제사(Polar, Latpeed) 상품이 9,900원으로 설정돼 있다. 서버 정가가 이와
    // 다르면 실제 결제가 성공해도 확인이 거부되어 고객이 결제하고도 콘텐츠가
    // 열리지 않는다. 이 값을 바꿀 때는 결제사 대시보드도 함께 바꿔야 한다.
    it('디지털 상품 정가는 결제사 설정과 같은 9,900원이다', () => {
        expect(ORDER_PRICE_KRW.report).toBe(9900);
        expect(ORDER_PRICE_KRW.remedy).toBe(9900);
        expect(ORDER_PRICE_KRW.zodiac).toBe(9900);
        expect(matchesExpectedPriceKrw('report', 9900)).toBe(true);
        expect(matchesExpectedPriceKrw('report', 10890)).toBe(false);
    });


    it('알 수 없는 주문 유형은 정가가 없다', () => {
        expect(getExpectedPriceKrw('refund')).toBeNull();
        expect(getExpectedPriceKrw(null)).toBeNull();
    });
});
