// 디지털 상품은 VAT가 포함된 단일 금액이다.
//
// 서버가 VAT를 따로 더하지 않는 이유:
//   1. Polar는 Merchant of Record라서 세금을 Polar가 직접 계산한다. 서버가 다시
//      더하면 이중 계산이 된다.
//   2. 결제사(Polar, Latpeed) 상품이 9,900원으로 설정돼 있다. 서버 정가가 이보다
//      크면 실제 결제가 성공해도 금액 불일치로 확인이 거부되어, 고객이 결제하고도
//      콘텐츠가 열리지 않는다.
//   3. 한국 소비자 가격은 VAT 포함 표시가 표준이다.
//
// 금액을 바꿀 때는 결제사 대시보드의 상품 가격도 함께 바꿔야 한다.
export const DIGITAL_PRODUCT_TOTAL_KRW = 9900;

export const formatKrw = (amount: number) => `${amount.toLocaleString('ko-KR')}원`;

export const DIGITAL_PRODUCT_TAX_NOTE = '부가세(VAT)가 포함된 금액입니다';
