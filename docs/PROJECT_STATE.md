# PUNGSOO AI 현재 상태

Last updated: 2026-08-11

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

- 현재 입력: 방 또는 공간 사진 최대 3장. 한 장만으로도 기존 흐름을 유지하며,
  여러 장이면 전체·문/현관·창 방향을 교차 확인한다.
- 판단: 문·창문·가구·동선·시각적 구조와 오행적 처방
- 연결 상품: `Room Guardian Frame`, `Desk Guardian Totem`
- 방위 데이터는 받지 않으므로 결과와 PDF를 `초견 분석`으로 표시한다.
  프롬프트는 동서사택·길흉방·좌향과 절대 방향을 확정적으로 단정하지 않고
  사진에서 관찰되는 창·문·가구·빛·동선만 근거로 삼는다.
- 한계: 사진만으로 진북, 방문·창문의 절대 방위와 전체 평면 구조를 확정하지
  못한다. 여러 장도 동일 공간의 보조 관찰 자료이며 평면도나 현장 측정을
  대체하지 않는다.

### 외부 입지 분석 — `ACTIVE`, 지도 기반 추정 방위 구현

- 현재 입력: 주소, 정적 위성지도상의 확인 핀, 선택적인 대문·현관 외향
  화살표
- 현재 처리:
  - 주소 검색 후 위경도와 진북이 위인 위성지도를 표시한다.
  - 사용자가 대상 위치를 확인하고 핀을 미세 조정할 수 있다.
  - 선택적으로 대문·현관이 바깥을 바라보는 방향을 화살표로 지정한다.
  - 서버는 입력 방위각을 15° 간격의 24산 좌향으로 결정론적으로 계산하고,
    입력 각도·좌/향 산·경계 거리·판정 규칙과 출처를 프롬프트에 사전
    계산값으로 주입한다. AI가 이를 재계산하거나 바꾸지 못하게 한다.
  - 방위각·`map_arrow` 측정 방식·`low` 신뢰도는
    `analysis_history.metadata`에 저장한다.
- 연결 상품: `Site Guardian Frame`, `Gate Guardian Totem`
- 방위 화살표가 없으면 결과와 PDF를 `초견 분석`으로 표시하고,
  동서사택·길흉방·좌향을 단정하지 않는다. 도로·녹지·수변·건물 배치처럼
  지도에서 관찰 가능한 형기 근거만 사용한다.
- 현재 한계: 지도 화살표는 사용자가 위성 이미지를 보고 정한 추정치이므로
  항상 `추정 방위`, 신뢰도 `low`로 표시한다. 현장 나침반, 건물 도면,
  외관·현관 사진, 필지 경계, 고도·경사·정밀 수계는 아직 사용하지 않는다.
  24산 계산의 결정론성은 입력각 분류를 일관되게 할 뿐 입력 자체의 정확도를
  높이지 않는다.
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
- 비방서 → 오브제 디자인 시스템:
  `docs/OBJECT_REMEDY_DESIGN_SYSTEM.md`
- 2026-08-03 대표 비방 조합 10종을 생성해
  `artifacts/3d-concepts/2026-08-03-remedy-guardian-collection-v1/`에
  저장했다. 실제 고객 비방서 10건의 출력은 아니며 변환 문법 테스트다.
- 실제 생성에서는 `Remedy Identity`의 목표 오행·상태·에너지 모드·목적·
  수호동물·배치·색·자세를 비방화와 오브제에 동일하게 전달한다.

## 6.1 신규 사업장 실제 파일럿

Status: `PILOT CONCEPTS GENERATED`, 내부 분석·실물 제작 전

- 사용자의 신규 사업장을 익명 ID `PILOT-BIZ-001`로 첫 실제 사업장
  검증에 사용한다.
- 소비자 기본 입력은 내부 핵심 공간 사진 1장, 선택 사진 1장, 위치와 현관
  외향 방위 확인뿐이다. 외관 여러 장·반복 나침반·평면도·업종·고민·사주는
  기본 분석을 막지 않는다.
- 위치·위성지도는 외부 입지, 사진은 내부 구조, 공통 방위는 양쪽의 신뢰도
  메타데이터로 사용한다.
- 외부 입지와 내부 공간은 각각 분석하고 총점으로 합치지 않는다.
- 비방서 확정 후 `Remedy Identity`를 고정하고 비방화·오브제 일치와
  설치 전후 공간 적합성을 검증한다.
- 개인 주소·사주 원본은 Git에 기록하지 않는다.
- 운영 지표는 관찰값이며 풍수와 매출의 인과를 주장하지 않는다.
- 실행 정본: `docs/NEW_BUSINESS_PILOT_PROTOCOL.md`
- 2026-08-11 첫 공사 전 호스텔 입력에서 주소 검색은 성공했으나 프로덕션
  외부 분석은 `EXTERNAL_ANALYSIS_FAILED`를 반환했다. 독립 재현에서
  ArcGIS `World_Street_Map` export는 HTTP 500, `World_Imagery`는 성공했다.
  실제 주소·좌표는 Git에 기록하지 않는다.
- 외부 사진·추정 방위·비식별 지도 맥락을 사람이 직접 검토해 토 중심,
  목 보조, `STABILIZE` 우선, 개 `Space Guardian`을 잠정 Remedy Identity로
  확정했다.
- 첫 아트월 3안은 개의 털·눈·코가 실제 반려견 초상처럼 보여 제작 후보에서
  제외했다. 동물 가시성과 사실성을 분리하는 `SPIRIT ABSTRACTION LOCK`을
  추가하고 추상 회화·현대 민화·수묵 여백·기하 토템·일본 민화·유럽 신화의
  영물형 아트월 6안을 다시 생성했다. 책상·현관·키링 오브제 3안은 유지한다.
  이미지와 재생성 메타 프롬프트는
  `docs/pilots/PILOT-BIZ-001-CONCEPTS.md`에 보존한다. 제품 렌더는 STL이
  아니며 선택 후 턴어라운드·메시·DFM·소형 출력 검증이 필요하다.
- 우키요에는 하나의 분위기로 취급하지 않고 산수 대경관, 아이즈리 야행,
  고급 스리모노의 3개 하위 변형을 추가해 영물형 아트월 v2가 총 9안이 됐다.
  스리모노 초안의 여우형 얼굴은 폐기하고 개 머리 비율로 교정한 최종본만
  정본에 저장했다.

## 7. 결제와 운영

Status: `SECURED IN CODE`, 운영 DB 적용·프로덕션 검증 필요

- `purchases`의 클라이언트 INSERT RLS 정책을 제거하는 idempotent baseline
  마이그레이션이 추가됐다. 적용 후 결제 기록은
  `SUPABASE_SERVICE_ROLE_KEY`를 사용하는 서버만 쓸 수 있다.
- 결제 확인 API는 Authorization의 Supabase access token으로 사용자를
  검증하며 `purchases.user_id`에 클라이언트 입력이 아니라 토큰의 사용자
  ID를 기록한다.
- `server/pricing.ts`의 정가표로 `orderType`과 금액을 대조해 불일치 요청을
  400으로 거부한다. `purchases.order_id` UNIQUE 제약으로 웹훅 upsert와
  중복 처리의 기반을 마련했다.
- 환불 요청은 로그인 토큰과 원주문의 소유권을 확인한다. Latpeed 웹훅은
  명시적인 완료 상태와 정확한 금액이 모두 확인될 때만 완료 처리한다.
- 실물 액자 49,000원·오브제 79,000원 SKU는 운영 검증 전까지
  `ENABLE_PHYSICAL_PRODUCT_IMMEDIATE_PAYMENT = false`로 즉시결제를
  비활성화하고 이메일 제작 의뢰만 노출한다.
- 개발용 `mock_` 결제 성공 분기는 프로덕션에서 차단된다.
- Polar, Latpeed, Toss와 Paddle 관련 코드가 공존한다. 실제 판매 재개
  전에는 활성 결제사 상품가가 서버 총액 9,900원과 같은지, 웹훅·환불·
  재전송·중복 처리가 맞는지 프로덕션 E2E로 확인한다.
- 보안 마이그레이션은 코드 배포와 별개이며 아직 운영 DB 적용이 확인되지
  않았다. 마이그레이션 미적용 상태에서 신규 API 코드를 먼저 배포하면
  rate-limit 저장소 확인이 fail-closed되어 503을 반환한다.
- “로그인과 결제만 붙이면 된다”는 홍보 표현은 코드 존재를 뜻할 뿐,
  프로덕션 결제가 검증됐다는 의미로 사용하지 않는다.

## 8. 운영 안전성·테스트·개인정보

### API 남용 방지

- Supabase `api_usage`와 `consume_api_usage` RPC를 service role 전용
  원자적 슬라이딩 윈도우 저장소로 사용한다.
- 분석 API는 로그인 계정 기준 시간당 10회·일 30회, 비로그인 IP 기준
  시간당 3회·일 5회로 제한한다.
- 이미지 생성은 로그인과 해당 `analysisId` 소유권을 요구하고 계정 기준
  시간당 10회로 제한한다.
- 주소 검색은 IP 기준 분당 30회, 이벤트·제작문의도 IP 기준 한도를 둔다.
- 분석과 이미지 생성은 `ANALYZE_DAILY_CAP`, `VISUALS_DAILY_CAP`의 전역
  일일 상한을 사용하며 미설정 시 각각 100회·50회의 안전한 기본값을 쓴다.
- rate-limit 저장소나 소유권 확인이 실패하면 비용 API를 실행하지 않고
  503으로 닫는다. 내부 사진은 최대 3장, base64 합계 8MB로 제한한다.

### 보안 헤더와 응답 위생

- `vercel.json`에서 실제 사용 도메인을 허용한 CSP, HSTS,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
  `X-Frame-Options`를 적용한다.
- 현재 CSP는 React/Vite·결제 SDK 호환을 위해 `script-src`와
  `style-src`에 `unsafe-inline`이 남아 있다. 배포 후 위반 로그와 SDK
  동작을 확인한 뒤 nonce/hash 방식으로 제거하는 것이 후속 과제다.
- 분석 오류의 stack/name은 서버 로그에만 남기며, 클라이언트에는 일반
  메시지와 오류 코드만 반환한다.
- Gemini 결과는 `server/validateAnalysis.ts`에서 타입·점수 범위·배열
  길이·오행 필드를 검증하고 안전하게 정규화하며 변경 필드를 서버 로그에
  남긴다.
- HTML/PDF/관리자 이메일의 사용자·Gemini 입력은 공용 `escapeHtml`로
  이스케이프한다.

### 분석 응답성과 입력 오류 UX

- `api/analyze.ts`와 `api/analyze-location.ts`는 실제 심층 리포트 생성과
  지도 수집 시간을 고려해 Vercel `maxDuration: 120`을 사용한다.
  클라이언트 분석 fetch에는 별도 AbortController 제한이 없어 서버보다 먼저
  중단되지 않으며, 로딩 UI는 최대 2분 소요 가능성을 안내한다.
- Gemini가 사진을 처리하지 못한 4xx는 내부 원인을 서버 로그에 남기고
  `422 IMAGE_UNPROCESSABLE`로 변환한다. 사용자는 다른 선명한 사진이나
  주소·지도 위치를 다시 선택하라는 안내를 받는다.
- 외부 주소 자동완성은 combobox/listbox 의미를 제공하며 ArrowDown·ArrowUp,
  Enter 선택과 Escape 닫기를 지원한다.
- 전체 화면 배경은 아직 AI Studio의 `lh3.googleusercontent.com/aida-public`
  임시 URL을 사용한다. 로컬 파일 확보가 차단되어 자체 호스팅 전환이 남아
  있으며, 배포 전 `public/bg-hanok-cosmos.jpg`로 교체해야 한다.
- CSP의 `*.googleusercontent.com`은 배경 때문이 아니라 Google OAuth가
  반환하는 `avatar_url`/`picture` 프로필 사진을 위해 유지한다.

### 테스트

- Vitest를 devDependency로 사용하며 `npm test`가 실제 assertion을 가진
  단위 테스트를 실행한다.
- 2026-07-30 기준 10개 테스트 파일, 65개 테스트가 통과한다.
- 24산·삼원구운·본명궁·정가·분석 응답 검증·시맨틱 방화벽·HTML
  이스케이프·비방화 라우팅·결제/환불 보안·CSP·오류 UX를 커버한다.
- 과거 1회성 Puppeteer 스크립트는 `scripts/manual/`로 이동해 수동
  디버깅 도구로만 유지한다.

### 개인정보 정합성

- 처리방침은 업로드 이미지가 Google Gemini로 전송되고 To-Be 편집 시
  fal.ai storage에 업로드되는 실제 흐름을 명시한다.
- 마이페이지 데이터 삭제는 본인 소유 `analysis_history`의 DB 행 삭제와
  localStorage 삭제를 함께 수행한다.
- `pungsoo_history`에는 사진 base64를 저장하지 않으며 기존 기록을 읽을
  때도 data URL 이미지를 제거한다.

### 시장·홍보

- 서양 시장에서는 `K-Feng Shui`보다 `Korean Pungsu`와
  `Personal Guardian Art`를 함께 사용한다.
- 한국적 요소는 상징과 재료 언어에 쓰고 전통 기념품처럼 과장하지 않는다.
- 실물 액자 수령 스토리는 제작자가 직접 만든 사실을 공개한다.
- 일이 늘어난 시점과 액자 시점이 겹친 경험은 개인적 관찰로만 말한다.
  액자가 매출이나 계약을 만들었다는 인과 주장은 하지 않는다.
- Threads·Reddit 정본: `MARKETING_STORYTELLING.md`

## 9. 우선순위

### NOW

- Supabase SQL Editor에서
  `20260729_payment_unlock_security_baseline.sql`과
  `20260730_api_abuse_protection.sql`을 순서대로 적용
- Vercel에 service role, rate-limit salt·일일 상한, 관리자·메일과 결제사
  환경변수를 `.env.example` 기준으로 설정
- 위 두 작업을 확인한 뒤에만 코드 배포

### NEXT

- 배포 후 로그인·내부/외부 분석·지도 핀/화살표·결제·웹훅·언락·환불·
  데이터 삭제 E2E
- Polar·Latpeed·Paddle·Toss 중 실제 활성 결제사의 상품가와 서버 정가
  9,900원 정합 확인
- 모바일 실기기에서 3장 업로드, 지도 드래그, 모달 포커스, PDF 인쇄와
  팝업 차단 fallback 확인
- AI Studio 임시 배경 이미지를 로컬 자산으로 확보해 자체 호스팅하고 외부
  배경 요청 제거
- CSP 위반을 관찰하고 결제·Kakao SDK 호환을 유지하며
  `unsafe-inline`을 nonce/hash 방식으로 제거
- `PILOT-BIZ-001`의 내부 사진 1장과 선택 사진 1장, 지도 핀·현관 외향
  방위를 한 번만 수집
- 기존 내부·외부 별도 UI를 사진 1~2장·위치·방위 한 번으로 두 분석을
  실행하는 `빠른 사업장 분석`으로 통합하되 결과와 근거는 분리
- 외부 분석의 지도 이미지 수집을 한 제공자·두 이미지의 동시 성공에
  의존하지 않게 하고, 도로지도 실패 시 위성 단독 또는 대체 지도 폴백을
  사용하도록 복구한 뒤 `PILOT-BIZ-001`로 재검증
- 외부 Site와 내부 Room 비방서를 각각 생성하고 `Remedy Identity`를 고정
- 저비용 공간 처방 → 비방화 → 오브제를 최소 7일 간격으로 적용·관찰

### DEFERRED

- 외부 입지의 외관·현관 사진, EXIF, 휴대폰 나침반과 지도 축 교차 검증
- 내부 평면도·진북·문/창/가구 마킹을 포함한 현장급 방위 정밀화
- 현관 걸이 수호동물 STL의 DFM 보정과 국내 3D 출력 발주
- 실물 액자 주문 사양·장기 QC 기록과 A4/A3 확대 테스트

## 10. 확인된 작업트리 주의사항

- `artifacts/print-orders/`는 사용자 소유 untracked 자료다.
- 명시적 요청 없이 해당 폴더를 이동·삭제·일괄 커밋하지 않는다.
- `.env.local`의 값은 읽어서 문서화하거나 출력하지 않는다.
