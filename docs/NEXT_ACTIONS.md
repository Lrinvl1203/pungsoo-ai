# 다음에 할 일

Last updated: 2026-07-30

Status: `ACTIVE`

지금 시점에서 사람이 결정하거나 직접 해야 하는 일만 순서대로 적었다.
코드로 끝낼 수 있는 일은 이미 끝났고, 커밋 9개가 로컬 `main`에 있다(푸시 전).

---

## 완료된 것 (다시 안 해도 됨)

- 결제 우회 취약점 차단, 서버 정가·신원 검증, 환불 IDOR 차단
- 고비용 API 남용 방지(계정·IP 한도, 일일 상한, 소유권 검증, 8MB 제한)
- 방위 신뢰성(초견 분석 표기, 지도 확인·대문 화살표, 24산 서버 계산)
- 개인정보 정합성(처리방침 정정, 실제 DB 삭제, 로컬 사진 제거)
- 보안 헤더, Vitest 65개 테스트, UX 정리
- **운영 Supabase 마이그레이션 적용 (2026-07-30, 검증 5/5 통과)**

---

## 1. 환경변수 — 2026-07-30 완료

Vercel Production에 아래 5개를 추가했고 `vercel env ls`로 확인했다.
로컬 `.env.local`에도 같은 값이 들어 있다. 상세는 `DEPLOY_ENV_SETUP.md`.

| 이름 | 값 | Sensitive |
|---|---|---|
| `RATE_LIMIT_SALT` | 암호학적 난수 48바이트 base64 | ON |
| `ANALYZE_DAILY_CAP` | `100` (rolling 24시간) | OFF |
| `VISUALS_DAILY_CAP` | `50` (fal.ai 비용 직결) | OFF |
| `ADMIN_EMAIL` | `lrinvl1203@gmail.com` | OFF |
| `RESEND_API_KEY` | 기존 `RESEND_KEY`와 동일 값 | ON |

`SUPABASE_SERVICE_ROLE_KEY`는 이미 Production에 있었다(55일 전 설정).

`ADMIN_EMAIL`이 마이그레이션 RLS 정책의 이메일 리터럴과 일치하므로 DB 변경은
필요 없었다. 운영자 계정을 바꿀 때는 두 곳을 함께 바꾼다.

확인된 문제: Resend 키가 프로덕션에 아예 없었다. 코드가 키 없으면 조용히
건너뛰고 결제를 성공 처리하므로, 그동안 주문·환불 알림 메일이 발송되지
않았을 가능성이 높다. 과거 주문 문의 누락 여부를 확인할 필요가 있다.

Preview 환경에는 비밀키를 넣지 않았다. 의도된 상태이며 이유는 D-027에 있다.

`RATE_LIMIT_SALT` 생성 (암호학적 난수 48바이트):

```powershell
$b = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
[Convert]::ToBase64String($b)
```

`Get-Random`은 암호용 난수가 아니므로 salt 생성에 쓰지 않는다.
같은 값을 Vercel과 로컬 `.env.local` 양쪽에 넣어야 사용량 카운트가 일관된다.
Vercel에서는 Sensitive를 켠다.

`ADMIN_EMAIL` 주의: PostgreSQL RLS는 Vercel 환경변수를 읽을 수 없어서, 관리자
조회 정책에 이메일이 SQL 문자열로 박혀 있다. 두 값이 다르면 관리자 화면이
어긋난다. 계정을 바꿀 때는 SQL 정책도 같이 바꿔야 한다.

기존 값 중 `SUPABASE_SERVICE_ROLE_KEY`가 설정돼 있는지 확인한다. 결제 기록이
이제 service role로만 저장되므로 없으면 결제 확인이 실패한다.

---

## 2. 결제사 가격 결정 — 사람이 판단해야 함

서버가 이제 주문 종류별 정가를 검증한다.

| 주문 | 서버 정가 |
|---|---|
| `report` / `remedy` / `zodiac` | 10,890원 (9,900 + VAT 990) |
| `frame` | 49,000원 |
| `object` | 79,000원 |

Polar·Latpeed 상품은 문서상 9,900원이다. 이 상태로 결제하면 금액 불일치로
확인이 거부되거나 `PENDING`으로 기록된다.

선택지:

- **A.** 결제사 상품 가격을 10,890원으로 올린다. 코드 변경 없음.
- **B.** `services/pricing.ts`의 정가를 9,900원으로 내리고 VAT 표기를 정리한다.
  코드 변경과 재배포 필요.

세무·가격 정책 판단이라 코드에서 임의로 정하지 않았다.

---

## 3. push와 배포

환경변수와 가격 결정이 끝난 뒤에 진행한다.

```powershell
git log --oneline -9    # 내용 확인
git push origin main
```

Vercel 자동 배포를 쓰면 push 시 배포된다.

---

## 4. 배포 후 검증

- [ ] 로그인(Kakao, Google) — CSP 적용 후 회귀 확인
- [ ] 내부 분석: 사진 1장, 3장 각각
- [ ] 외부 분석: 주소 검색 → 위성지도 확인 → 핀 조정 → 대문 화살표
- [ ] 방위 미입력 시 `초견 분석` 표시 확인
- [ ] 실제 결제 1건 → 언락 확인 → `purchases` 행 확인
- [ ] webhook 재전송 시 중복 행이 생기지 않는지
- [ ] 타인 `orderId` 환불 요청이 거부되는지
- [ ] 마이페이지 삭제 후 서버 데이터도 사라지는지
- [ ] 한도 초과 `429`, 대용량 `413`, 상한 `503` 안내 문구
- [ ] 모바일: 지도 화살표, 3장 업로드, 팝업 차단 상태 PDF 저장
- [ ] 관리자 메일 수신

DB 상태 확인은 언제든:

```powershell
npm run db:verify-security
```

---

## 5. 결정이 필요한 제품 이슈

### 5-1. 공유 링크가 막힌다

`analysis_history`에 소유자 전용 SELECT 정책이 적용됐다. 따라서 `?id=` 링크를
타인에게 보내면 상대는 열 수 없다. 카카오톡 공유 버튼이 그대로 있으므로,
공유를 마케팅 수단으로 쓸 생각이면 별도의 공개 공유 설계가 필요하다.

선택지: 공유 기능을 접는다 / 공개 토큰이 있는 행만 열람 가능한 정책을 추가한다 /
공유용 요약 이미지만 만든다.

### 5-2. 디지털 상품 번들

현재 report·remedy·zodiac이 각각 10,890원이다. 3개 다 사면 32,670원인데,
번들(예: 19,900원)이 전환과 객단가 모두 유리할 가능성이 있다. 도입하려면
bundle SKU와 서버 가격 검증을 함께 만들어야 한다.

### 5-3. 제휴 링크

솔루션 아이템의 오늘의집·네이버쇼핑 링크가 순수 검색 URL이다. 제휴 링크로
바꾸면 무료 사용자에게서도 수익이 난다. 광고·제휴 고지 문구가 함께 필요하다.

---

## 6. 다음 개발 후보 (우선순위 순)

1. **이미지 모델 blind test** — 비방화 최종본을 Seedream 4.5 대신 상위 모델로
   바꿀지 결정. 연구 정본의 30케이스 + 자동 심사 프롬프트로 4화풍 × 3에너지
   비교. 품질·비용·지연·상업 이용조건을 함께 본다. 결정 전까지 4.5 유지(D-026).
2. **방위 정밀화 2단계** — EXIF `GPSImgDirection`, 반복 나침반 측정, 평면도
   입력. 상세는 `direction-accuracy-todo.md`.
3. **CSP `unsafe-inline` 제거** — 인라인 스크립트·스타일에 nonce 도입.
4. **실물 상품 재개** — 액자·오브제 생산·납기·환불 조건 확정 후 `App.tsx`의
   즉시결제 feature flag를 켠다. 현재는 이메일 의뢰만 노출.
   상태는 `physical-product-mvp-status.md`.
5. **결제 E2E 자동화** — 현재 결제 테스트는 외부 호출 모킹이다. 실제 provider
   샌드박스 대상 E2E가 있으면 재발 방지가 확실해진다.
6. **i18n** — 서양 시장(`Korean Pungsu`) 전략과 한국어 하드코딩이 어긋난다.
   문자열 분리와 글로벌 지오코딩이 선행 과제.

---

## 7. 참고 문서

| 문서 | 용도 |
|---|---|
| `DEPLOY_ENV_SETUP.md` | 환경변수 상세와 배포 후 검증 |
| `SUPABASE_MIGRATION_RUNBOOK.md` | DB 절차, 검증 쿼리, 비상 롤백 |
| `SUPABASE_ACCESS_SETUP.md` | 에이전트 DB 접근 설정과 명령 목록 |
| `PROJECT_STATE.md` | 현재 구현 상태 정본 |
| `DECISION_LOG.md` | 확정된 결정(D-001~D-026) |
| `HANDOFF.md` | 다음 에이전트 인수인계 |
