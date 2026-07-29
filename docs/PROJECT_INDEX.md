# PUNGSOO AI 프로젝트 정본 인덱스

Last updated: 2026-07-30

이 문서는 Codex, Claude Code와 사람이 동일한 맥락에서 작업하기 위한 문서
지도다. 새 세션은 대화 전체를 옮기지 말고 이 인덱스와 연결된 정본을 읽는다.

## 1. 항상 읽는 정본

| 문서 | 역할 |
|---|---|
| `../AGENTS.md` | 모든 에이전트의 필수 작업·기록·검증 규칙 |
| `../CLAUDE.md` | Claude Code 진입 지침 |
| `PROJECT_STATE.md` | 현재 구현, 제품, 배포, 완료·미완료 상태 |
| `HANDOFF.md` | 마지막 작업과 다음 작업의 즉시 실행 지점 |
| `DECISION_LOG.md` | 되돌리면 안 되는 결정과 보류 판단 |
| `PROMPT_INDEX.md` | 프롬프트·모델·스타일 정본 위치 |

## 2. 주제별 전문 문서

### 배포와 운영 준비

- `SUPABASE_MIGRATION_RUNBOOK.md`: DB 마이그레이션 사전 점검·적용·검증 절차
- `DEPLOY_ENV_SETUP.md`: 사람이 입력할 환경변수와 배포 후 검증 체크리스트

두 문서의 순서는 DB → 환경변수 → 코드 배포다. 순서를 바꾸면 신규 API가
사용량 저장소를 찾지 못해 `503`으로 닫힌다.

### 서비스와 운영

- `앱소개_MASTER.md`: 전체 서비스·결과 데이터·화면·API 참고서
- `customer-operator-runbook.md`: 고객·환불·운영자 흐름
- `polar-payment-setup.md`: Polar 결제 설정
- `latpeed-product-setup.md`: Latpeed 상품·설문·웹훅

### 분석 정확도

- `direction-accuracy-todo.md`: 구현된 지도 추정 방위와 남은 센서·도면
  기반 외부·내부 방위 정밀화
- `PROJECT_STATE.md`: 현재 실제 입력 범위와 한계

### 비방화와 이미지

- `비방화_궁극_메타프롬프트_v2_2026-07-25.md`: 30개 테스트를 반영한 연구 정본
- `비방화_자동스타일_적용_2026-07-26.md`: 자동 작품군 라우팅
- `interior-art-style-mapping.md`: 인테리어 10종과 기존 작품군 결합
- `expanded-art-style-study.md`: 확장 화풍 26종 연구
- `비방화_이미지모델_선정_및_메타프롬프트_2026-07-25.md`: 모델 선정 근거
- `비방화 update by gemini 3.1 pro.md`: 외부 모델 검토 기록
- `이미지생성_프롬프트_현황.md`: 과거 런타임 기록. 현재 정본은 아님

### 실물 상품

- `physical-product-mvp-status.md`: 액자·오브제 실물 검증 정본
- `국내_비방화_출력_액자_주문처_조사_2026-07-27.md`: 국내 액자 업체 조사
- `3D_AI_STL_PIPELINE.md`: TripoSR 기반 실제 메시·STL 파이프라인
- `현관_수호동물_3D프린팅_예상견적_2026-07-28.md`: 국내 출력 예상 견적
- `gate-guardian-production-todo.md`: 현관 명태식 걸이 오브제 발주 보류 작업

### 시장과 홍보

- `k-feng-shui-western-product-strategy.md`: 서양권 K-풍수 상품 전략
- `MARKETING_STORYTELLING.md`: 실물 액자 기반 Threads·Reddit 스토리 정본

## 3. 코드 정본

| 영역 | 위치 |
|---|---|
| 앱 진입·분석 흐름 | `App.tsx`, `components/AnalysisForm.tsx` |
| 결과 화면 | `components/ResultView.tsx`, `components/RemedyCard.tsx` |
| 분석 시스템 프롬프트 | `server/constants.ts` |
| 비방화 라우터·최종 프롬프트 | `utils/remedyArt.ts` |
| 이미지 생성 API·모델 | `api/generate-visuals.ts` |
| 외부 입지 분석 | `api/analyze-location.ts`, `api/search-address.ts` |
| 내부 분석 | `api/analyze.ts` |
| 결제 | `components/PaymentButton.tsx`, `api/confirm-*`, `server/*payment*` |

## 4. 상태 표기

- `ACTIVE`: 현재 정본이며 유지
- `NOW`: 지금 수행할 작업
- `NEXT`: NOW 완료 후 수행
- `LATER`: 의도적으로 후순위
- `DEFERRED`: 사용자가 재개할 때까지 중단
- `BLOCKED`: 외부 승인·키·결정이 필요
- `DONE`: 구현과 검증 완료
- `SUPERSEDED`: 기록 보존용이며 최신 정본 아님

## 5. 문서 갱신 흐름

```text
작업 시작
  → AGENTS / PROJECT_INDEX / PROJECT_STATE / HANDOFF 확인
  → git status 확인
  → 구현 또는 조사
  → 테스트
  → PROJECT_STATE 갱신
  → 결정이 생기면 DECISION_LOG 갱신
  → 프롬프트가 바뀌면 PROMPT_INDEX 갱신
  → HANDOFF에 다음 시작점 기록
  → npm run docs:check
```

## 6. 새 세션에 전달할 최소 문장

```text
프로젝트 경로:
P:\0_지키기\02_PROJECT\99_Working\41_pungsoo-ai

먼저 AGENTS.md, docs/PROJECT_INDEX.md, docs/PROJECT_STATE.md,
docs/HANDOFF.md와 git status --short를 확인하라. 대화 기억보다 저장소
정본을 우선하고, 작업 후 상태·결정·프롬프트·인계 문서를 갱신하라.
```
