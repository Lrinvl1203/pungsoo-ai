# Claude Code 시작 지침

이 프로젝트는 Codex와 Claude Code가 번갈아 작업한다. Claude의 대화 기억이나
이전 세션 요약을 정본으로 사용하지 말고 저장소의 공통 규칙과 상태 문서로
맥락을 복구한다.

## 시작할 때 반드시 읽을 파일

1. `AGENTS.md`
2. `docs/PROJECT_INDEX.md`
3. `docs/PROJECT_STATE.md`
4. `docs/HANDOFF.md`
5. 현재 작업에 해당하는 전문 문서

읽기 전에 `pwd`, `git status --short`, 현재 브랜치와 HEAD를 확인한다.

## Claude 전용 주의

- `AGENTS.md`의 갱신 계약과 Git 경계를 그대로 따른다.
- Codex 채팅에만 존재하는 정보가 있다고 가정하지 않는다.
- 불확실한 과거 결정을 추측하지 말고 `DECISION_LOG.md`에서 확인한다.
- 프롬프트 수정은 `PROMPT_INDEX.md`가 가리키는 런타임 소스와 전문 문서를
  함께 갱신한다.
- 다른 에이전트가 같은 worktree에서 작업 중이면 수정하지 않는다.
- 작업 완료 후 `docs/HANDOFF.md`를 최신화하고 변경 파일, 검증 결과,
  남은 문제, 커밋 상태를 보고한다.

새 세션의 첫 확인 명령:

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
npm run docs:check
```
