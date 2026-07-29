# Supabase 마이그레이션 적용 런북

Last updated: 2026-07-30

Status: `ACTIVE`

2026-07-30 보안 작업의 DB 변경을 운영 Supabase에 적용하는 절차다.
환경변수는 `DEPLOY_ENV_SETUP.md`를 따른다.

**적용 순서: 이 문서(DB) → 환경변수 → 코드 배포.** 코드를 먼저 배포하면
신규 API가 사용량 저장소를 찾지 못해 `503`으로 닫힌다.

## 1. 무엇이 바뀌나

| 변경 | 이유 |
|---|---|
| `purchases`의 클라이언트 INSERT 정책 제거 | 로그인 사용자가 직접 `COMPLETED` 행을 넣어 결제 없이 전 콘텐츠를 열 수 있었다. |
| `purchases.order_id` UNIQUE | 모든 결제사 upsert가 `onConflict: 'order_id'`를 전제하는데 제약이 없어 중복 결제 행이 생길 수 있었다. |
| `analysis_history`·`purchases` 생성 DDL과 RLS 정책 정본화 | 최초 DDL이 저장소에 없어 스키마를 재현할 수 없었다. |
| `api_usage` 테이블 + `consume_api_usage` 함수 | 계정·IP 기준 원자적 사용량 카운트. service role 전용. |

## 2. 사전 점검 (필수)

UNIQUE 제약 추가는 기존 중복 `order_id`가 있으면 **의도적으로 실패**한다.
먼저 SQL Editor에서 아래를 실행한다.

```sql
select order_id, count(*) as cnt
from public.purchases
where order_id is not null
group by order_id
having count(*) > 1
order by cnt desc;
```

- 결과가 0행이면 3절로 진행한다.
- 결과가 있으면 각 그룹에서 남길 1행을 정하고 나머지를 정리한 뒤 다시 확인한다.
  자동 삭제 스크립트는 제공하지 않는다. 실제 결제 기록이므로 사람이 판단해야 한다.

이어서 과거에 비정상 생성된 구매 행이 있는지 감사한다. 결제사 기록과 대조해
근거 없는 행이 있으면 정리한다. 이 행들은 마이그레이션이 자동으로 지우지 않는다.

```sql
select id, user_id, order_id, order_type, amount, status, payment_key, created_at
from public.purchases
where status = 'COMPLETED'
order by created_at desc
limit 100;
```

`payment_key`가 `mock_`으로 시작하는 행은 개발용 모의 결제 흔적이다.

```sql
select count(*) from public.purchases where payment_key like 'mock_%';
```

## 3. 적용

`supabase/apply/2026-07-30-security-apply.sql` 파일 **전체**를 Supabase SQL Editor에
붙여넣고 한 번 실행한다. 두 마이그레이션이 올바른 순서로 하나의 트랜잭션(`begin`/`commit`)에
묶여 있어, 중간에 실패하면 전부 롤백된다.

원본을 따로 실행하고 싶으면 이 순서를 지킨다.

1. `supabase/migrations/20260729_payment_unlock_security_baseline.sql`
2. `supabase/migrations/20260730_api_abuse_protection.sql`

두 파일 모두 idempotent하므로 재실행해도 안전하다.

## 4. 적용 후 검증

### 4-1. 결제 우회 경로가 막혔는지

```sql
select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'purchases'
order by policyname;
```

기대: `Users can view own purchases`(SELECT), `Admin can view purchases`(SELECT)만 있고
**INSERT 정책이 없어야 한다.** `Users can insert own purchases`가 보이면 실패다.

### 4-2. UNIQUE 제약

```sql
select conname, contype
from pg_constraint
where conrelid = 'public.purchases'::regclass and conname = 'purchases_order_id_unique';
```

기대: 1행, `contype = 'u'`.

### 4-3. 사용량 저장소

```sql
select to_regclass('public.api_usage') as table_ok,
       to_regprocedure('public.consume_api_usage(text,text,text,integer,integer)') as function_ok;
```

기대: 두 값 모두 `null`이 아니어야 한다.

```sql
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'api_usage';
```

기대: `service_role`만 권한을 가진다. `anon`이나 `authenticated`가 보이면 실패다.

### 4-4. RLS 활성화

```sql
select relname, relrowsecurity
from pg_class
where relname in ('purchases', 'analysis_history', 'api_usage');
```

기대: 세 테이블 모두 `relrowsecurity = true`.

## 5. 롤백

통합 파일은 트랜잭션이므로 실행 실패 시 자동 롤백된다.
적용 후 문제가 생겨 되돌려야 하면, 코드 배포를 먼저 되돌린다. DB는 앞으로 호환이며
`api_usage`는 코드가 쓰지 않으면 사용되지 않는다.

결제 기록 정책만 급히 되돌려야 하는 예외 상황이라면 아래를 실행할 수 있다.
**이 정책을 되살리면 결제 우회 취약점이 다시 열린다는 점을 이해한 경우에만 사용한다.**

```sql
-- 비상용. 취약점이 재개방된다.
create policy "Users can insert own purchases"
  on public.purchases for insert
  with check (auth.uid() = user_id);
```

## 6. 운영 정리 작업

`api_usage`는 요청이 들어올 때 8일보다 오래된 행을 정리한다. 트래픽이 늘면
테이블 크기와 `consume_api_usage` 지연을 모니터링한다.

```sql
select count(*) as rows, min(created_at) as oldest
from public.api_usage;
```
