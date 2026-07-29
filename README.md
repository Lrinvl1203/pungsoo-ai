# PUNGSOO AI

한국 풍수의 외부 입지·내부 공간 분석을 개인 비방서, 수호동물, 비방화,
액자와 오브제로 연결하는 React/Vercel 프로젝트다.

## Live

- 메인: <https://41pungsoo-ai.vercel.app/>
- 분석: <https://41pungsoo-ai.vercel.app/analyze>
- 관리자: <https://41pungsoo-ai.vercel.app/admin>

## Codex·Claude 작업 시작

이 프로젝트는 여러 AI 도구가 번갈아 작업하므로 대화 기억이 아니라 저장소의
정본 문서를 사용한다.

1. `AGENTS.md`
2. `CLAUDE.md`
3. `docs/PROJECT_INDEX.md`
4. `docs/PROJECT_STATE.md`
5. `docs/HANDOFF.md`

중요 결정은 `docs/DECISION_LOG.md`, 프롬프트는
`docs/PROMPT_INDEX.md`에서 시작한다.

## 현재 핵심 상태

- 내부 분석: 공간 사진 기반
- 외부 분석: 주소·지도 기반. 외관 사진·EXIF·방위 확인은 다음 단계
- 비방화: 비방서가 4개 코어 작품군을 자동 결정
- 미니 액자: 첫 실물 도착, 사용자 품질 만족으로 1차 검증 성공
- 현관 오브제: TripoSR 기반 실제 170mm STL 완료, 출력 발주는 보류
- 결제: 코드와 운영 문서가 있으나 판매 재개 전에 프로덕션 E2E 재검증 필요

자세한 사실과 TODO는 `docs/PROJECT_STATE.md`를 따른다.

## Local development

Prerequisite: Node.js

```powershell
npm install
npm run dev
```

환경변수 이름은 `.env.example`을 참고한다. `.env.local`의 실제 비밀값을
문서나 Git에 추가하지 않는다.

## Verification

```powershell
npm run build
npm run docs:check
```

## Specialized docs

- 서비스 전체: `docs/앱소개_MASTER.md`
- 분석 정확도: `docs/direction-accuracy-todo.md`
- 이미지 프롬프트: `docs/PROMPT_INDEX.md`
- 실물 상품: `docs/physical-product-mvp-status.md`
- 3D 제작: `docs/3D_AI_STL_PIPELINE.md`
- 운영: `docs/customer-operator-runbook.md`
- 홍보 스토리: `docs/MARKETING_STORYTELLING.md`

Original AI Studio reference:
<https://ai.studio/apps/drive/1yXia8xw36FWWj4QixFkQZyBehwr84R-n>
