# PUNGSOO AI 현재 인수인계

Last updated: 2026-08-11

## 1. 작업 위치

- 프로젝트: PUNGSOO AI
- 절대 경로:
  `P:\0_지키기\02_PROJECT\99_Working\41_pungsoo-ai`
- 기본 브랜치: `main`
- 정확한 HEAD는 작업 시작 시 `git rev-parse HEAD`로 확인
- 현재 알려진 사용자 소유 untracked:
  `artifacts/print-orders/`

## 2. 마지막 완료

- 결제·언락 경계를 서버로 이동했다. 클라이언트 `purchases` INSERT 정책을
  제거하는 baseline, `order_id` UNIQUE, 서버 정가 검증, 토큰 기반
  `user_id`, service role 기록과 환불 소유권 확인을 구현했다.
- 고비용 API에 Supabase 원자적 계정/IP 슬라이딩 윈도우, 전역 일일 상한,
  이미지 생성 로그인·분석 소유권 확인과 8MB 입력 제한을 구현했다.
- Gemini 응답 검증·정규화, 오류 응답 위생, HTML 이스케이프와 개인정보
  처리방침·DB 삭제·localStorage 사진 제외를 반영했다.
- 외부 분석에 위성지도 확인, 핀 조정과 선택적인 대문·현관 외향 화살표를
  구현했다. 서버가 24산 좌향을 결정론적으로 계산해 입력각·규칙·근거와
  함께 프롬프트에 주입한다.
- 방위가 없으면 결과·PDF를 `초견 분석`으로 표시하고 방위 단정을
  금지한다. 지도 화살표는 항상 `추정 방위`, 신뢰도 `low`다.
- CSP와 보안 헤더를 적용하고 Vitest를 도입했다. 현재 10개 파일,
  65개 테스트가 통과한다.
- 최초 방문 온보딩, 최대 3장 사진, 결과 URL·로컬 복원, 상태별 토스트,
  PDF 팝업 차단 fallback, 모달 접근성과 모바일 레이아웃을 정리했다.
- 액자·오브제 미검증 실물 SKU 즉시결제는 feature flag로 껐으며 이메일
  제작 의뢰만 노출한다.
- 분석 함수의 Vercel 실행시간을 120초로 맞추고, Gemini 이미지 처리 실패를
  422로 안내하며, 주소 자동완성을 키보드 combobox로 보강했다.
- 프로덕션 배포본을 Playwright로 클릭 검증했다(25개 항목 통과). 지도 방위
  화살표가 화면 45도에서 45도로 기록되는 것을 배포 환경에서 확인했다.
- `vite.config.ts`의 `define`을 제거해 `GEMINI_API_KEY`가 클라이언트 번들에
  인라인될 여지를 없앴다. 배포 번들에 키가 없는 것도 직접 확인했다.
- 주소 제안 드롭다운이 반투명이라 아래 안내문·지도 패널 글자와 겹쳐 보이던
  문제를 불투명 배경과 상위 z-index로 고쳤다.
- 디지털 상품 정가를 결제사 설정과 같은 9,900원(VAT 포함)으로 맞췄다.
- 비방서의 오행·상태·에너지 모드·목적·수호동물·배치·색·자세를 하나의
  `Remedy Identity`로 고정해 비방화와 3D 오브제가 공유하는 디자인 시스템을
  문서화했다.
- 대표 비방 조합 10종 오브제 렌더를
  `artifacts/3d-concepts/2026-08-03-remedy-guardian-collection-v1/`에
  저장했다. 실제 고객 비방서 10건 출력이 아니라 조형 문법 연구 샘플이다.
- 사용자의 신규 사업장을 익명 `PILOT-BIZ-001`로 등록하고 외부·내부 분석,
  Remedy Identity, 설치 전후와 운영 관찰을 분리한 파일럿 절차를 만들었다.
- 사용자 정정에 따라 사업장 기본 입력을 내부 사진 1장·선택 사진 1장·위치·
  현관 외향 방위 확인으로 축소했다. 외관 여러 장, 반복 나침반, 평면도,
  업종·고민·사주는 기본 입력이 아니다.
- 첫 공사 전 호스텔 파일럿에서 주소 검색은 성공했으나 프로덕션
  `/api/analyze-location`이 `EXTERNAL_ANALYSIS_FAILED`를 반환했다. 같은
  요청 조건에서 ArcGIS `World_Street_Map` export HTTP 500과
  `World_Imagery` 성공을 재현했다. 실제 주소·좌표는 Git에 남기지 않았다.

## 3. 즉시 가능한 다음 작업

다음 에이전트는 아래 배포 순서를 바꾸지 않는다.

> **배포 순서 경고:** 마이그레이션 미적용 상태로 코드만 배포하면
> `api_usage`/`consume_api_usage`를 찾지 못해 고비용 신규 API가
> fail-closed로 503을 반환한다. 반드시 **(1) 마이그레이션 적용 →
> (2) 환경변수 설정 → (3) 코드 배포** 순서를 지킨다.

### 1. 운영 DB 마이그레이션

절차 정본은 `SUPABASE_MIGRATION_RUNBOOK.md`다. 사전 점검 쿼리, 붙여넣기용
통합 파일 `supabase/apply/2026-07-30-security-apply.sql`, 적용 후 검증
쿼리와 비상 롤백이 모두 그 문서에 있다. 환경변수는 `DEPLOY_ENV_SETUP.md`를
따른다.

원본을 개별 실행할 경우 Supabase SQL Editor에서 다음 순서를 지킨다.

1. `supabase/migrations/20260729_payment_unlock_security_baseline.sql`
2. `supabase/migrations/20260730_api_abuse_protection.sql`

첫 파일은 중복 `purchases.order_id`가 있으면 안전하게 중단한다. 중단 시
중복 행을 운영자가 확인·정리한 뒤 다시 실행한다. 적용 후 클라이언트
INSERT 정책 부재, UNIQUE 제약, `api_usage` RLS와 service role 전용 RPC
권한을 확인한다.

### 2. Vercel 환경변수

`.env.example`을 기준으로 최소 다음을 설정·재확인한다.

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `RATE_LIMIT_HASH_SALT`
- `ANALYZE_DAILY_CAP`, `VISUALS_DAILY_CAP`
- `ADMIN_EMAIL`, `RESEND_API_KEY` (`RESEND_KEY`는 호환 fallback만 유지)
- 활성 결제사의 secret·webhook·상품 ID와 프런트 공개 키

비밀값은 문서나 Git에 기록하지 않는다.

### 3. 배포와 E2E

- 사용자 확인 후 커밋을 push하고 Vercel에 배포한다.
- 로그인/비로그인 분석 한도와 한도 초과 429, 전역 상한 503을 확인한다.
- 내부 1장·3장 분석, 외부 지도 핀·화살표·무방위 초견 분석을 확인한다.
- 실제 활성 결제사 상품가가 서버 정가 9,900원인지 확인한다.
- 결제 성공, 웹훅 재전송/중복, 언락, 타인 분석·환불 차단, 환불 완료,
  마이페이지 DB 삭제를 확인한다.
- 모바일 실기기에서 지도 드래그, 모달 키보드·Escape, PDF 저장과 팝업
  차단 fallback을 확인한다.
- AI Studio 임시 배경은 `public/bg-hanok-cosmos.png`로 자체 호스팅을 마쳤다.
  `App.tsx`에 외부 URL이 남아 있지 않다.
- CSP 위반을 관찰한 뒤 SDK를 깨지 않도록 nonce/hash를 도입해
  `unsafe-inline`을 제거한다.

### 4. 배포 이후 제품 작업

- 이미지 모델은 Seedream 4.5를 유지한다. Nano Banana 계열과 동일 입력
  blind test를 수행한 뒤 교체 여부를 결정한다.
- 외관·현관 사진, EXIF, 휴대폰 나침반 교차 검증과 내부 평면도 방위는
  `direction-accuracy-todo.md`의 후속 범위다.
- 현관 수호동물 DFM·발주와 액자 장기 QC는 계속 `DEFERRED`다.

### 5. 신규 사업장 파일럿 입력

정본은 `NEW_BUSINESS_PILOT_PROTOCOL.md`다. 다음 구현은 내부 사진 1장과
선택 사진 1장, 위치·현관 외향 방위 한 번의 입력으로 외부 Site와 내부 Room
분석을 실행하는 `빠른 사업장 분석`이다. 현재 앱은 두 흐름이 분리돼 있어
통합 입력·오케스트레이션은 구현 전이다. 주소·사주 원본은 Git에 기록하지
않는다.

### 6. 외부 분석 지도 장애 복구

`server/map-image.ts`와 `api/analyze-location.ts`를 확인한다. 현재
`Promise.all`에서 도로지도 한 장이 실패하면 위성지도까지 버리고 전체 분석이
500으로 끝난다. 도로지도 export 실패 시 위성 단독 분석 또는 대체 도로지도
폴백을 사용하고, 결과에 사용 지도와 누락 지도를 기록한다. 제공자 500,
비이미지 응답과 단일 지도 성공 회귀 테스트를 추가한 뒤 익명 파일럿으로
프로덕션 재검증한다.

## 4. 고정 결정

- 내부와 외부 분석은 별도 흐름이다.
- 방위가 없으면 초견 분석이며 방향을 단정하지 않는다.
- 지도 화살표는 현장 실측이 아닌 신뢰도 낮은 추정 방위다.
- 4개 코어 작품군과 자동 라우팅을 유지한다.
- 비방화와 오브제는 같은 수호동물을 공유한다.
- Seedream 4.5는 blind test 전까지 유지한다.
- 결제 기록은 service role 전용이며 서버 정가와 토큰 사용자를 신뢰
  경계로 삼는다.
- 미검증 실물 SKU 즉시결제는 비활성화한다.
- 현관 제품은 명태 모양이 아니라 수호동물 본연의 형태를 유지한다.
- 홍보에서 풍수와 매출의 인과관계를 주장하지 않는다.
- Hunyuan3D-2는 대한민국 라이선스 문제로 사용하지 않는다.
- 오브제는 `Remedy Identity`를 비방화와 공유하며 10종 대표 샘플을 실제
  고객 10건의 결과로 표현하지 않는다.
- 신규 사업장 파일럿의 운영 지표는 관찰 자료이며 풍수와 매출의 인과를
  주장하지 않는다.
- 사용자에게 운영 QA 자료를 기본 입력으로 요구하지 않는다. 사진 1장·선택
  사진 1장·위치·현관 외향 방위만으로 분석하고 부족한 근거는 초견·신뢰도로
  표시한다.

전체 근거는 `DECISION_LOG.md`를 따른다.

## 5. 검증 명령

```powershell
npx tsc --noEmit
npm run build
npm test
npm run docs:check
git status --short
git branch --show-current
git rev-parse HEAD
```

## 6. 권한 경계

- 사용자 소유 untracked 자료를 자동 커밋하지 않는다.
- `.env.local`과 결제·API 비밀값을 출력하거나 문서화하지 않는다.
- 주문, 결제, 이메일, 배포와 외부 시스템 변경은 현재 요청 범위 안에서만 한다.
- 운영 DB 마이그레이션은 사용자가 Supabase SQL Editor에서 수동 적용한다.
- 두 에이전트가 같은 worktree를 동시에 수정하지 않는다.

## 7. 다음 에이전트 복귀 보고

1. 변경 파일
2. 핵심 변경
3. 테스트와 결과
4. 남은 문제·위험
5. 문서 갱신 여부
6. 커밋·푸시·배포 여부
