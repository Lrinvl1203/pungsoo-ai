---
description: 에이전트 팀 리뷰를 통과한 작업을 실행하는 구현 워크플로우
---

# ⚡ 실행 워크플로우 (Execute)

에이전트 팀 리뷰를 거친 작업을 구현합니다.

## Step 1: 계획 확인
// turbo
- `team-review.md` 워크플로우를 통해 관련 에이전트의 검토가 완료되었는지 확인

## Step 2: 변경 범위 파악
- 수정할 파일 목록 정리
- 새로 생성할 파일 목록 정리
- 삭제할 파일 목록 정리

## Step 3: 구현
- 디자인 시스템(agent-design.md)의 토큰을 준수하여 구현
- 타입 변경 시 `types.ts` 먼저 수정
- 프롬프트 변경 시 `api/constants.ts` 수정 (서버 정본)
- 새 라우트 추가 시 `index.tsx`에 등록

## Step 4: 검증
// turbo
1. `npm run dev`로 로컬 서버 실행 확인
2. 브라우저로 해당 페이지 접속하여 시각적 확인
3. 관련된 에이전트 체크리스트 항목 재확인

## Step 5: 커밋 메시지 작성
한국어로, conventional commit 형식으로 작성:
```
feat: [기능 설명]

- 변경사항 1
- 변경사항 2
- 변경사항 3
```

## 파일 수정 시 주의사항
1. **기존 코드 훼손 금지**: 관련 없는 기능이 깨지지 않도록 주의
2. **다크 테마 필수**: 모든 UI 요소는 다크 테마 기반
3. **도사 이미지 경로**: `/images/masters/cheongpung.jpeg`, `/images/masters/myeongwol.jpeg`
4. **Tailwind 사용**: 인라인 스타일 최소화, Tailwind 클래스 우선
5. **반응형 필수**: `md:` 브레이크포인트 사용
