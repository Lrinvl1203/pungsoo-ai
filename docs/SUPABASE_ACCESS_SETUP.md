# Supabase 에이전트 접근 설정

Last updated: 2026-07-30

Status: `ACTIVE`

에이전트(Claude, Codex)가 운영 Supabase에 직접 SQL을 실행할 수 있게 하는 1회 설정이다.
설정이 끝나면 마이그레이션 적용과 검증이 명령 한 줄로 끝난다.

## 1. 사용자가 해야 하는 일 (한 번만)

### 1-1. Personal Access Token 발급

1. https://supabase.com/dashboard 접속
2. 우측 상단 계정 아이콘 → **Account settings**
3. 좌측 **Access Tokens** → **Generate new token**
4. 이름은 용도를 알 수 있게 적는다. 예: `pungsoo-ai-agent`
5. 생성된 `sbp_...` 값을 복사한다. **이 값은 다시 볼 수 없다.**

### 1-2. `.env.local`에 추가

프로젝트 루트의 `.env.local` 파일에 아래 한 줄을 추가하고 저장한다.

```
SUPABASE_ACCESS_TOKEN=sbp_여기에_붙여넣기
```

`.env.local`은 `.gitignore`의 `*.local` 규칙으로 커밋되지 않는다.
토큰 값을 채팅창이나 문서에 붙여넣지 않는다.

### 1-3. 확인

```powershell
npm run db:whoami
```

기대 출력: 토큰이 유효하고, 대상 프로젝트 이름과 리전이 표시된다.
`target: NOT visible to this token`이 나오면 토큰 계정이 그 프로젝트에
접근 권한이 없다는 뜻이다.

## 2. 왜 API 키가 아니라 access token인가

| 종류 | 접두사 | 접근 대상 | DDL 실행 |
|---|---|---|---|
| Publishable key (구 `anon`) | `sb_publishable_` | 데이터 API. 공개용 | 불가 |
| Secret key (구 `service_role`) | `sb_secret_` | 데이터 API. RLS 무시 | 불가 |
| Personal Access Token | `sbp_` | Management API | 가능 |

Publishable·Secret 키는 **행을 읽고 쓰는** 데이터 API(PostgREST, Storage, Realtime)용이다.
테이블과 정책을 바꾸는 DDL은 Management API를 거쳐야 하므로 Personal Access Token이 필요하다.

## 3. 보안 주의사항

- Personal Access Token은 **그 계정이 접근 가능한 모든 프로젝트**를 다룰 수 있다.
  프로젝트 단위로 범위를 좁힐 수 없다.
- 작업이 끝나거나 더 이상 에이전트에게 권한을 주고 싶지 않으면
  대시보드에서 해당 토큰을 **Revoke**한다. 코드 변경은 필요 없다.
- 토큰이 유출됐다고 판단되면 즉시 revoke하고 새로 발급한다.
- 에이전트는 `.env.local` 값을 화면에 출력하거나 문서·커밋에 기록하지 않는다
  (`AGENTS.md` 6절).

## 4. 사용법

| 명령 | 용도 |
|---|---|
| `npm run db:whoami` | 토큰·대상 프로젝트 확인 |
| `npm run db:apply-security` | 2026-07-30 보안 마이그레이션 적용 |
| `npm run db:verify-security` | 적용 결과 5개 항목 자동 검증 |
| `npm run db:sql -- --file <경로>` | 임의 SQL 파일 실행 |
| `npm run db:sql -- --query "select 1;"` | 단일 쿼리 실행 |
| `npm run db:sql -- --file <경로> --dry-run` | 전송하지 않고 대상·크기만 확인 |

실행 스크립트는 `scripts/supabase-sql.mjs`다. 프로젝트 ref는 `SUPABASE_PROJECT_REF`가
있으면 그 값을, 없으면 `VITE_SUPABASE_URL`에서 자동 추출한다.

안전장치:

- 토큰이 없거나 `sbp_` 접두사가 아니면 실행을 거부한다.
- 실행 전에 대상 ref, 소스 파일, 구문 개수를 출력한다.
- 자격증명은 어떤 경로로도 출력하지 않는다.

## 5. Supabase CLI

CLI도 devDependency로 설치되어 있다(`npx supabase --version` → 2.110.0).
`SUPABASE_ACCESS_TOKEN`이 설정되어 있으면 `supabase login` 없이 대부분의
CLI 명령이 동작한다.

```powershell
npx supabase projects list
npx supabase migration list --linked
```

다만 `supabase db push`처럼 데이터베이스에 직접 접속하는 명령은 DB 비밀번호를
추가로 요구한다. 그래서 마이그레이션 적용의 기본 경로는 CLI가 아니라 4절의
Management API 스크립트다. 비밀번호를 저장할 필요가 없어 더 안전하다.

## 6. 다음 단계

토큰 설정이 끝나면 `SUPABASE_MIGRATION_RUNBOOK.md`의 사전 점검부터 진행한다.
사전 점검(중복 `order_id` 확인)도 아래처럼 에이전트가 실행할 수 있다.

```powershell
npm run db:sql -- --query "select order_id, count(*) from public.purchases where order_id is not null group by order_id having count(*) > 1;"
```
