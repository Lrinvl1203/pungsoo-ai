# 배포 환경변수 설정 가이드

Last updated: 2026-07-30

Status: `ACTIVE`

이 문서는 2026-07-30 보안·신뢰성 작업 이후 **사람이 직접 입력해야 하는 값**만 모았다.
값 자체는 이 문서에 적지 않는다. 실제 비밀값은 Vercel 환경변수와 `.env.local`에만 둔다.

## 0. 반드시 지킬 순서

새 API는 사용량 저장소가 없으면 안전하게 `503`을 반환한다(fail-closed).
순서를 바꾸면 서비스가 멈춘다.

1. ~~Supabase 마이그레이션 적용~~ — **2026-07-30 완료.** 검증 5개 항목 통과.
   재확인은 `npm run db:verify-security`.
2. **이 문서의 환경변수 설정 ← 지금 여기**
3. 코드 push 및 배포
4. 배포 후 검증

DB가 이미 준비됐으므로 환경변수만 넣으면 배포할 수 있다.

## 1. 새로 추가해야 하는 환경변수

Vercel → 프로젝트 → Settings → Environment Variables.

**2026-07-30 기준 아래 5개는 Production에 이미 설정 완료.** 이 절은 값을 바꾸거나
환경을 새로 만들 때 참고한다.

**Preview에는 비밀키를 넣지 않는다.** service role 키가 프로덕션 데이터를
변경할 수 있고, 프리뷰 호출이 실제 API 비용과 일일 상한을 잠식하며, Preview URL은
프로덕션만큼 보호되지 않는다. 자세한 근거는 `DECISION_LOG.md` D-027.
프리뷰 기능 테스트가 필요하면 별도 Supabase 프로젝트와 테스트용 키를 쓴다.

| 이름 | 값을 어떻게 정하나 | 없으면 어떻게 되나 |
|---|---|---|
| `RATE_LIMIT_SALT` | 충분히 긴 임의 문자열. 아래 생성 명령 참고. 한 번 정하면 바꾸지 않는다(바꾸면 기존 사용량 카운트가 초기화된다). | rate limit 주체 해시가 약해진다. 반드시 설정한다. |
| `ANALYZE_DAILY_CAP` | 하루에 허용할 분석 총건수. 초기 권장 `100`. rolling 24시간 기준이며 자정 초기화가 아니다. | 안전한 기본값이 쓰이지만 명시 권장. |
| `VISUALS_DAILY_CAP` | 하루에 허용할 이미지 생성 총건수. 초기 권장 `50`. fal.ai 비용에 직결되므로 보수적으로 시작한다. | 위와 같다. |
| `ADMIN_EMAIL` | 운영자 이메일. **2절의 주의사항을 꼭 읽을 것.** | 관리자 알림 메일과 관리자 조회가 동작하지 않는다. |
| `RESEND_API_KEY` | Resend 대시보드의 API 키. 기존에 `RESEND_KEY`로 넣어둔 값이 있으면 코드가 fallback으로 계속 인정하지만, 신규 정본은 이 이름이다. | 주문·환불 알림 메일이 발송되지 않는다(결제는 성공 처리됨). |

`RATE_LIMIT_SALT` 생성 (PowerShell, 암호학적 난수 48바이트):

```powershell
$b = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
[Convert]::ToBase64String($b)
```

`Get-Random`은 암호용 난수가 아니므로 salt 생성에 쓰지 않는다.
Vercel과 로컬 `.env.local`에 같은 값을 넣고, Vercel에서는 Sensitive를 켠다.

## 2. `ADMIN_EMAIL` 주의사항

PostgreSQL의 RLS 정책은 Vercel 환경변수를 읽을 수 없다. 그래서 관리자 조회 권한은
마이그레이션 SQL 안에 이메일 문자열로 남아 있다.

- 파일: `supabase/migrations/20260729_payment_unlock_security_baseline.sql`
- 정책: `Admin can view purchases`

`ADMIN_EMAIL`과 이 SQL 리터럴이 **서로 다르면** 관리자 화면과 관리자 메일이 어긋난다.
운영자 계정을 바꿀 때는 두 곳을 함께 바꿔야 한다.

## 3. 기존 값 중 점검이 필요한 것

| 이름 | 점검 내용 |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | 결제 기록이 이제 서버 service role로만 저장된다. 이 값이 없으면 결제 확인이 실패한다. |
| `VITE_PAYMENT_PROVIDER` | 현재 실제로 쓸 결제 제공자와 일치하는지 확인한다. |
| `POLAR_PRODUCT_ID_*`, `VITE_LATPEED_URL_*` | **4절 가격 정합 문제를 먼저 해결해야 한다.** |
| `RESEND_KEY` | 레거시 이름. 당장 지울 필요는 없지만 `RESEND_API_KEY`로 이전 권장. |

## 4. 결제사 상품 가격 정합 — 2026-07-31 정리됨

서버가 주문 종류별 정가를 검증한다(`server/pricing.ts`).

| 주문 종류 | 서버 정가 |
|---|---|
| `report`, `remedy`, `zodiac` | 9,900원 (VAT 포함) |
| `frame` | 49,000원 |
| `object` | 79,000원 |

결제사 상품 가격을 올리지 않기로 결정해, 서버 정가를 결제사 설정(9,900원)에
맞췄다. 서버는 VAT를 따로 더하지 않는다. Polar는 Merchant of Record라서 세금을
직접 계산하므로 서버가 다시 더하면 이중 계산이 되고, 한국 소비자 가격은 VAT
포함 표시가 표준이기 때문이다. 근거는 `DECISION_LOG.md` D-028.

**가격을 바꿀 때는 `services/pricing.ts`와 결제사 대시보드를 반드시 함께 바꾼다.**
둘이 어긋나면 실제 결제가 성공해도 금액 불일치로 확인이 거부되어, 고객이
결제하고도 콘텐츠가 열리지 않는다.

## 5. 물리 상품 즉시결제 플래그

액자·오브제의 즉시결제는 실물 생산 검증이 끝나지 않아 코드에서 비활성화되어 있다.
현재는 이메일 의뢰 접수만 노출된다. 생산·납기·환불 조건이 확정되면 `App.tsx`의
해당 feature flag를 켠다. 상세 상태는 `physical-product-mvp-status.md`를 따른다.

## 6. 배포 후 검증 체크리스트

- [ ] 로그인(Kakao, Google) 정상 동작 — CSP 적용 후 회귀 확인
- [ ] 내부 분석 1건: 사진 1장과 3장 각각
- [ ] 외부 분석 1건: 주소 검색 → 위성지도 확인 → 핀 조정 → 대문 화살표
- [ ] 방위 미입력 시 결과에 `초견 분석` 표시가 뜨는지
- [ ] 결제 1건 실제 진행 → 언락 확인 → `purchases` 행 확인
- [ ] 같은 webhook 재전송 시 중복 행이 생기지 않는지
- [ ] 타인 `orderId`로 환불 요청이 거부되는지
- [ ] 마이페이지 데이터 삭제 후 서버 데이터도 사라지는지
- [ ] 한도 초과 시 `429`, 대용량 사진 `413`, 상한 도달 시 `503` 안내 문구가 뜨는지
- [ ] 모바일에서 지도 화살표, 3장 업로드, 팝업 차단 상태 PDF 저장
- [ ] 관리자 메일 수신(`ADMIN_EMAIL`)

## 7. 알려진 동작 변화

- `analysis_history`에 소유자 전용 SELECT 정책이 적용된다. 따라서 `?id=` 링크를
  **다른 사람에게 공유하면 그 사람은 열 수 없다.** 카카오톡 공유 기능을 실제
  타인 공유 용도로 유지하려면 별도의 공개 공유 설계가 필요하다(현재 미구현).
- 로컬 기록에는 사진 base64를 더 이상 저장하지 않는다. 비로그인 사용자가
  새로고침하면 분석 내용은 복원되지만 원본 사진은 표시되지 않을 수 있다.
- 일일 상한은 rolling 24시간이다. 자정에 초기화되지 않는다.
