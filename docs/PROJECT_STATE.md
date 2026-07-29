# PUNGSOO AI 현재 상태

Last updated: 2026-07-29

Status: `ACTIVE`

## 1. 프로젝트

- 절대 경로:
  `P:\0_지키기\02_PROJECT\99_Working\41_pungsoo-ai`
- 기본 브랜치: `main`
- GitHub: `https://github.com/Lrinvl1203/pungsoo-ai`
- 메인: `https://41pungsoo-ai.vercel.app/`
- 분석: `https://41pungsoo-ai.vercel.app/analyze`
- 관리자: `https://41pungsoo-ai.vercel.app/admin`
- 기술: React 19, TypeScript, Vite, Vercel Functions, Gemini, fal.ai,
  Supabase와 복수 결제 연동

## 2. 서비스 정체성

PUNGSOO AI는 한국 풍수의 분석 결과를 공간 처방, 개인 비방서, 수호동물,
비방화와 실물 상품으로 연결하는 서비스다.

핵심 상품 흐름:

```text
사용자 입력
  → 외부 입지 또는 내부 공간 분석
  → 오행 부족·과잉과 에너지 모드
  → 개인 비방서
  → 수호동물
  → 비방화·액자 / 데스크·현관 오브제
```

풍수 해석은 전통문화 기반의 공간·심리적 처방으로 표현하며 과학적 효능이나
매출·행운의 인과관계를 단정하지 않는다.

## 3. 분석 모드

### 내부 공간 분석 — `ACTIVE`

- 현재 입력: 방 또는 공간 사진
- 판단: 문·창문·가구·동선·시각적 구조와 오행적 처방
- 연결 상품: `Room Guardian Frame`, `Desk Guardian Totem`
- 한계: 사진만으로 진북, 방문·창문의 절대 방위와 전체 평면 구조를 확정하지
  못한다.

### 외부 입지 분석 — `ACTIVE`, 정밀 입력은 `NEXT`

- 현재 입력: 주소
- 현재 처리: 주소 검색·위경도, 지도·위성 정보, 주변 도로·녹지·수변의
  시각적 입지 분석
- 연결 상품: `Site Guardian Frame`, `Gate Guardian Totem`
- 현재 한계: 건물 정면, 주 출입구, 현관 외향 방위와 사진 EXIF를 받지 않는다.
- 결정된 개선안: 주소와 지도 핀에 외관·현관 사진을 추가하고, EXIF의
  GPS 좌표와 `GPSImgDirection`이 있으면 보조자료로 사용한다. EXIF가 없거나
  자기장 오차가 크면 지도 화살표와 반복 나침반 측정으로 교차 검증한다.
- 상세 TODO: `direction-accuracy-todo.md`

내부와 외부 분석은 현재 별도 상품 흐름이며 자동 통합 점수로 합치지 않는다.

## 4. 비방화 생성

Status: `ACTIVE`

- 사용자가 모던·레트로 등을 직접 고르는 구조를 제거했다.
- 비방서가 `PURIFY`, `CIRCULATE`, `AMPLIFY` 에너지 모드를 결정한다.
- 부족·과잉 오행이 색, 재료와 형태장을 결정한다.
- 수호동물은 이미지에서 알아볼 수 있는 큰 몸선과 종별 단서가 있어야 한다.
- 비방화와 오브제는 같은 수호동물을 공유한다.
- 현재 핵심 작품군 4개는 유지한다.
  - 은호 추상화
  - 현대 민화형
  - 수묵 여백형
  - 기하학적 토템형
- 인테리어 10개 프로필과 조화안·포인트안 확장은 설계·샘플 단계다.
- 런타임 정본: `utils/remedyArt.ts`, `api/generate-visuals.ts`
- 연구 정본: `비방화_궁극_메타프롬프트_v2_2026-07-25.md`

## 5. 액자 실물

Status: `FIRST PHYSICAL SAMPLE VALIDATED`

- 2026-07-29 미니 비방화 실물이 도착했다.
- 사용자 평가: “퀄리티 매우 만족”
- 관찰: 작은 규격에서도 용의 비늘·수염·식물 디테일이 유지되고,
  주황·먹색·아이보리 색 재현과 둥근 프레임리스 마감이 양호하다.
- 실물 사진:
  `artifacts/physical-tests/2026-07-29/mini-remedy-art-frame-delivered.jpg`
- 주문 원본:
  `artifacts/print-orders/2026-07-27/PUNGSOO-mini-art-nouveau-dragon-3x5-300dpi.png`
- 판단: 미니 탁상용 비방화의 1차 상품성 검증은 성공했다.
- 아직 기록할 항목: 업체·소재·총액·제작일·배송일, 자연광 색상, 긁힘,
  포장과 장기 내구성.

## 6. 3D 수호동물 오브제

Status: `MESH DONE`, 주문은 `DEFERRED`

- 방향: 너무 전통적인 명태 모형이 아니라 본연의 수호동물 실루엣을
  현대적 K-미스틱·로우폴리 감성으로 표현한다.
- 용도: 책상, 키링, 현관 걸이. 현관형은 명태를 거는 사용 방식만 차용한다.
- 첫 실제 3D 복원 모델: TripoSR
- STL:
  `artifacts/3d-ai/triposr-gate-mineral-v1/gate-guardian-mineral-ai-170x98x12mm-v1.stl`
- 규격: 97.761 × 170 × 12mm
- 검증: 35,608 faces, 단일 solid, watertight, winding consistent
- 남은 생산 보정: 뒷면 평탄화, 걸이 구멍 둘레, 최소 두께, 문 보호 패드
- 발주 TODO: `gate-guardian-production-todo.md`

## 7. 결제와 운영

Status: `IMPLEMENTED IN CODE`, 프로덕션 운영 확인 필요

- Supabase 인증과 주문 데이터 구조가 있다.
- Polar, Latpeed, Toss 관련 코드와 운영 문서가 공존한다.
- 과거 커밋에는 모의 결제, OAuth 결제 의도 보존, 환불과 수동 잠금 해제
  흐름이 포함돼 있다.
- 실제 판매 재개 전에는 현재 Vercel 환경변수, 활성 결제 제공자, 상품 ID,
  웹훅과 운영자 환불 흐름을 처음부터 재검증한다.
- “로그인과 결제만 붙이면 된다”는 홍보 표현은 코드 존재를 뜻할 뿐,
  프로덕션 결제가 검증됐다는 의미로 사용하지 않는다.

## 8. 시장·홍보

- 서양 시장에서는 `K-Feng Shui`보다 `Korean Pungsu`와
  `Personal Guardian Art`를 함께 사용한다.
- 한국적 요소는 상징과 재료 언어에 쓰고 전통 기념품처럼 과장하지 않는다.
- 실물 액자 수령 스토리는 제작자가 직접 만든 사실을 공개한다.
- 일이 늘어난 시점과 액자 시점이 겹친 경험은 개인적 관찰로만 말한다.
  액자가 매출이나 계약을 만들었다는 인과 주장은 하지 않는다.
- Threads·Reddit 정본: `MARKETING_STORYTELLING.md`

## 9. 우선순위

### NOW

- Codex·Claude 공통 정본과 인수인계 규칙 유지
- 실물 액자 주문 사양과 QC 데이터를 추가 기록

### NEXT

- 외부 입지에 건물·현관 사진 입력과 EXIF 추출 설계
- 지도 위 건물 정면·출입구 방향 확인 UX
- 실물 액자를 활용한 상품 상세와 사용자 반응 테스트
- 재판매 전 로그인·결제·주문 운영 흐름 재검증

### DEFERRED

- 현관 걸이 수호동물 STL의 DFM 보정과 국내 3D 출력 발주
- 방위 정밀화 전체 구현

## 10. 확인된 작업트리 주의사항

- `artifacts/print-orders/`는 사용자 소유 untracked 자료다.
- 명시적 요청 없이 해당 폴더를 이동·삭제·일괄 커밋하지 않는다.
- `.env.local`의 값은 읽어서 문서화하거나 출력하지 않는다.
