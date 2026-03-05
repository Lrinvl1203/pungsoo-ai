---
description: 모든 작업 시 5-Agent 팀 리뷰를 거쳐 최적의 결과를 도출하는 메인 워크플로우
---

# 🧠 Agent Team Review Workflow

모든 작업 요청이 들어오면 이 워크플로우를 실행하여 5명의 에이전트 관점에서 검토한 뒤 실행합니다.

## 프로젝트 컨텍스트
- **서비스명**: 풍수지리 AI (Feng Shui Grand Master AI)
- **스택**: React 19 + Vite + Vercel + Supabase + Gemini + fal.ai + Toss Payments + Resend
- **핵심 브랜딩**: 두 도사(청풍 도사 + 명월 도사)가 완벽한 조화를 이루는 풍수 서비스
  - 청풍 도사: 지리 감정(診) 담당 — 산세, 지기, 수맥, 양택·음택 분석
  - 명월 도사: 비방 처방(方) 담당 — 오행 처방, 비방 예술, 명리 분석, 인테리어 처방
- **디자인 기조**: 다크 테마 (#0c0a06), 골드 액센트 (#f2b90d/#d4af37), 글래스모피즘, 미세 애니메이션
- **도사 이미지 위치**: `/images/masters/cheongpung.jpeg`, `/images/masters/myeongwol.jpeg`, `*_landing.jpeg`

## Step 1: 요청 분석
사용자의 요청을 분석하여 어떤 에이전트의 관점이 관련있는지 판단합니다.

- **UI/디자인 변경** → Agent 3 (디자인) 필수, Agent 1 (프로덕트) 권장
- **API/백엔드 변경** → Agent 2 (아키텍처) 필수, Agent 4 (프롬프트) 관련 시
- **새 기능 추가** → Agent 1 (프로덕트) 필수, Agent 2 (아키텍처) 필수
- **프롬프트/AI 변경** → Agent 4 (프롬프트) 필수
- **배포/마케팅** → Agent 5 (그로스) 필수
- **대규모 변경** → 전체 5개 에이전트 모두

## Step 2: 에이전트별 체크리스트 실행
관련 에이전트의 워크플로우 파일을 읽고 해당 체크리스트를 적용합니다:

- `.agent/workflows/agent-product.md` — 프로덕트 전략
- `.agent/workflows/agent-architect.md` — 아키텍처
- `.agent/workflows/agent-design.md` — UX/디자인
- `.agent/workflows/agent-prompt.md` — AI/프롬프트
- `.agent/workflows/agent-growth.md` — 그로스/마케팅

## Step 3: 통합 판단
각 에이전트의 의견을 종합하여:
1. **충돌하는 제안**이 있으면 → 사용자 브랜드 방향(두 도사 조화)에 부합하는 쪽 선택
2. **추가 작업이 필요하면** → 사용자에게 선택지를 제안
3. **바로 실행 가능하면** → `/execute` 워크플로우로 진행

## Step 4: 실행
`.agent/workflows/execute.md` 워크플로우를 따라 구현합니다.

## Step 5: 검증
구현 후 관련 에이전트의 체크리스트를 다시 돌려 품질을 확인합니다.
