export const DIGITAL_PRODUCT_SUBTOTAL_KRW = 9900;
export const DIGITAL_PRODUCT_VAT_KRW = 990;
export const DIGITAL_PRODUCT_TOTAL_KRW = DIGITAL_PRODUCT_SUBTOTAL_KRW + DIGITAL_PRODUCT_VAT_KRW;

export const formatKrw = (amount: number) => `${amount.toLocaleString('ko-KR')}원`;

export const DIGITAL_PRODUCT_TAX_NOTE =
    `${formatKrw(DIGITAL_PRODUCT_SUBTOTAL_KRW)} + VAT ${formatKrw(DIGITAL_PRODUCT_VAT_KRW)}`;
