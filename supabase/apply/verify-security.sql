-- 2026-07-30 보안 마이그레이션 적용 검증. 읽기 전용이므로 언제든 실행해도 안전하다.
-- 실행: npm run db:verify-security
-- 기대: 아래 4개 행이 모두 pass = true

with purchase_insert_policy as (
  select count(*) as cnt
  from pg_policies
  where schemaname = 'public'
    and tablename = 'purchases'
    and cmd = 'INSERT'
),
order_id_unique as (
  select count(*) as cnt
  from pg_constraint
  where conrelid = 'public.purchases'::regclass
    and conname = 'purchases_order_id_unique'
    and contype = 'u'
),
usage_store as (
  select
    (to_regclass('public.api_usage') is not null)::int
    + (to_regprocedure('public.consume_api_usage(text,text,text,integer,integer)') is not null)::int
      as cnt
),
usage_grants as (
  select count(*) as cnt
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'api_usage'
    and grantee in ('anon', 'authenticated')
),
rls_enabled as (
  select count(*) as cnt
  from pg_class
  where relname in ('purchases', 'analysis_history', 'api_usage')
    and relrowsecurity
)
select '1. purchases INSERT 정책 없음 (결제 우회 차단)' as check_name,
       (select cnt from purchase_insert_policy) = 0 as pass,
       (select cnt from purchase_insert_policy)::text || ' policy' as detail
union all
select '2. purchases.order_id UNIQUE 제약',
       (select cnt from order_id_unique) = 1,
       (select cnt from order_id_unique)::text || ' constraint'
union all
select '3. api_usage 테이블 + consume_api_usage 함수',
       (select cnt from usage_store) = 2,
       (select cnt from usage_store)::text || '/2 present'
union all
select '4. api_usage가 anon/authenticated에 노출되지 않음',
       (select cnt from usage_grants) = 0,
       (select cnt from usage_grants)::text || ' grant'
union all
select '5. RLS 활성화 (purchases, analysis_history, api_usage)',
       (select cnt from rls_enabled) = 3,
       (select cnt from rls_enabled)::text || '/3 enabled'
order by check_name;
