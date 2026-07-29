# PUNGSOO AI 현재 인수인계

Last updated: 2026-07-29

## 1. 작업 위치

- 프로젝트: PUNGSOO AI
- 절대 경로:
  `P:\0_지키기\02_PROJECT\99_Working\41_pungsoo-ai`
- 기본 브랜치: `main`
- 정확한 HEAD는 작업 시작 시 `git rev-parse HEAD`로 확인
- 현재 알려진 사용자 소유 untracked:
  `artifacts/print-orders/`

## 2. 마지막 완료

- Codex·Claude 공통 정본·인수인계 문서 체계를 추가했다.
- `AGENTS.md`와 `CLAUDE.md`가 동일한 상태 문서를 읽도록 연결했다.
- 프로젝트 상태, 결정 로그와 프롬프트 정본 인덱스를 만들었다.
- 오늘 도착한 미니 비방화 실물 사진과 높은 품질 만족 결과를 기록했다.
- 170mm 현관 수호동물 TripoSR STL은 생성·검증됐고 실제 발주는 보류됐다.
- 외부 입지에 사진·EXIF·지도 방위 교차 검증이 필요하다는 결정을 기록했다.

## 3. 즉시 가능한 다음 작업

우선순위는 사용자 요청으로 결정한다.

### A. 실물 액자 상품화

- 주문 업체, 소재, 가격, 주문·도착일을 `physical-product-mvp-status.md`에 기록
- 자연광·야간광 색상, 긁힘, 모서리와 포장 QC
- 실물 사진을 이용한 상품 상세·Threads·Reddit 게시물 제작

### B. 외부 입지 입력 고도화

- `AnalysisForm.tsx` 외부 모드에 건물 정면·현관 사진 입력 추가
- EXIF GPS와 `GPSImgDirection` 추출
- 개인정보 동의와 EXIF 없음 fallback
- 지도에서 정면·출입구 화살표 확인
- 상세 기준은 `direction-accuracy-todo.md`

### C. 현관 수호동물 발주

- STL 뒷면 평탄화와 걸이부 보강
- 3DFARM·WOW3D·FabCube 최신 견적
- 결제 직전 사용자 확인
- 현재 상태는 `DEFERRED`

### D. 판매 재개

- Vercel 환경변수와 활성 결제 제공자 확인
- 로그인, 결제, 웹훅, 주문 저장, 환불 E2E
- 실제 구매 전 운영자 runbook 재검증

## 4. 고정 결정

- 내부와 외부 분석은 별도 흐름이다.
- 외부 입지는 주소만으로 정밀하다고 말하지 않는다.
- 4개 코어 작품군과 자동 라우팅을 유지한다.
- 비방화와 오브제는 같은 수호동물을 공유한다.
- 현관 제품은 명태 모양이 아니라 수호동물 본연의 형태를 유지한다.
- 홍보에서 풍수와 매출의 인과관계를 주장하지 않는다.
- Hunyuan3D-2는 대한민국 라이선스 문제로 사용하지 않는다.

전체 근거는 `DECISION_LOG.md`를 따른다.

## 5. 검증 명령

```powershell
npm run build
npm run docs:check
git status --short
git branch --show-current
git rev-parse HEAD
```

## 6. 권한 경계

- 사용자 소유 untracked 자료를 자동 커밋하지 않는다.
- `.env.local`과 결제·API 비밀값을 출력하거나 문서화하지 않는다.
- 주문, 결제, 이메일, 배포와 외부 시스템 변경은 현재 요청 범위 안에서만 한다.
- 두 에이전트가 같은 worktree를 동시에 수정하지 않는다.

## 7. 다음 에이전트 복귀 보고

1. 변경 파일
2. 핵심 변경
3. 테스트와 결과
4. 남은 문제·위험
5. 문서 갱신 여부
6. 커밋·푸시·배포 여부
