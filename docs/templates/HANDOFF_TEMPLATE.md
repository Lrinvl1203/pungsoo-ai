# PUNGSOO AI 작업 인계 템플릿

새 Codex·Claude 세션에 필요한 범위만 복사한다. 대괄호를 남기지 말고 현재
저장소에서 확인한 사실로 바꾼다.

```md
# 작업 인계

## 1. 작업 위치
- 프로젝트: PUNGSOO AI
- 절대 경로: P:\0_지키기\02_PROJECT\99_Working\41_pungsoo-ai
- 브랜치:
- 기준 커밋:
- 대상 도구·모델:
- 작업 방식: 같은 worktree 순차 작업 / 별도 worktree / 읽기 전용

## 2. 시작 전 필수 확인
- AGENTS.md
- CLAUDE.md
- docs/PROJECT_INDEX.md
- docs/PROJECT_STATE.md
- docs/HANDOFF.md
- git status --short

## 3. 목표

## 4. 완료 기준
- [관찰 가능한 결과]
- [필수 테스트 결과]

## 5. 현재 상태
- 완료:
- 미완료:
- 작업트리:
- 재현 방법:

## 6. 작업 범위
- 수정 가능:
- 읽기만 가능:
- 수정 금지:

## 7. 고정 결정과 제약
- [변경하지 않을 결정]
- [보안·호환성 제약]

## 8. 관련 파일
- [경로와 심볼]
- [경로와 심볼]

## 9. 검증
```text
npm run build
npm run docs:check
```

## 10. 권한
- 커밋:
- 푸시:
- 배포:
- 외부 시스템 변경:
- 삭제·초기화:

## 11. 복귀 보고
1. 변경 파일
2. 핵심 변경
3. 테스트 결과
4. 남은 문제
5. 문서 갱신
6. 커밋·푸시·배포 여부
```

## Claude 시작 문장

```text
PUNGSOO AI 프로젝트에서 아래 인계 범위만 수행하라.
먼저 현재 경로와 Git 상태를 확인하고 AGENTS.md, CLAUDE.md,
docs/PROJECT_INDEX.md, docs/PROJECT_STATE.md, docs/HANDOFF.md를 읽어라.
기존의 관련 없는 변경을 보존하고 작업 후 상태·결정·프롬프트·인계 문서를
갱신한 뒤 검증 결과를 보고하라.

[완성한 인계문]
```
## Codex 시작 문장

```text
이 메시지는 PUNGSOO AI의 선택적 인계문이다.
대화의 다른 프로젝트 맥락은 사용하지 말고 현재 저장소 정본을 우선하라.
먼저 현재 경로, AGENTS.md, 프로젝트 상태 문서와 git status --short를 확인하라.

[완성한 인계문]
```
