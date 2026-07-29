# PUNGSOO AI 프롬프트 정본 인덱스

Last updated: 2026-07-29

Status: `ACTIVE`

## 1. 우선순위

프롬프트 내용이 충돌하면 다음 순서를 따른다.

1. 프로덕션 런타임 코드
2. 이 인덱스가 `연구 정본`으로 지정한 문서
3. 테스트 샘플과 과거 기록

`앱소개_MASTER.md`의 과거 모던·레트로 스타일 예시와
`이미지생성_프롬프트_현황.md`는 현재 런타임 정본이 아니다.

## 2. 분석 프롬프트

| 목적 | 정본 | 입력 | 출력 |
|---|---|---|---|
| 내부 공간 분석 | `server/constants.ts` 내부 시스템 프롬프트 | 공간 사진, 사용자 메타데이터 | 5장 분석, 오행, 비방서, 수호동물, 비방화 개념 |
| 외부 입지 분석 | `server/constants.ts`, `api/analyze-location.ts` | 주소, 지도·위성 컨텍스트 | 입지 분석, 오행, 비방서, Site Guardian 개념 |

고정 규칙:

- 처방 부분은 명월 도사의 문체를 사용한다.
- 비방화와 12간지 오브제는 같은 수호동물을 공유한다.
- 수호동물은 부족 오행 후보, 띠 충 회피와 공간 목적을 함께 본다.
- 풍수의 문화적 해석과 객관적 위치·방위 데이터는 구분한다.

## 3. 비방화 런타임 프롬프트

### 프로덕션 정본

- 조립기·스타일 라우터: `utils/remedyArt.ts`
- 모델 호출: `api/generate-visuals.ts`
- 분석 문맥 전달: `services/geminiService.ts`

현재 모델:

```text
fal-ai/bytedance/seedream/v4.5/text-to-image
```

현재 라우팅:

```text
사용자 고민
  → PURIFY / CIRCULATE / AMPLIFY
부족·과잉 오행
  → 색·재료·형태장
수호동물
  → 큰 몸선 + 종별 단서 2개
공간과 목적
  → 은호 추상화 / 현대 민화형 / 수묵 여백형 / 기하 토템형
```

금지:

- 달·산·동전·그릇 등 분석 문장의 사물을 그대로 그리는 의미 누출
- 읽을 수 있는 문자, 한자, 부적 문양과 로고
- 흔한 판타지 캐릭터나 장난감 같은 동물
- 사용자가 고르는 `modern / buddhist / modern_buddhist`를 최신 UX로 복원

### 연구 정본

- 전체 메타 프롬프트:
  `비방화_궁극_메타프롬프트_v2_2026-07-25.md`
- 자동 라우팅:
  `비방화_자동스타일_적용_2026-07-26.md`
- 인테리어 변형:
  `interior-art-style-mapping.md`
- 확장 화풍:
  `expanded-art-style-study.md`

연구 정본에는 다음이 포함돼 있다.

- 30개 테스트에서 도출한 의미 방화벽
- 에너지별 구도와 오행별 형식 잠금
- 이미지 모델 직접 전송 템플릿
- 생성 후 자동 심사 프롬프트
- 수호동물 가시성 기준

## 4. 오브제 렌더 프롬프트

현재 런타임 정본은 `api/generate-visuals.ts`의 `type === 'zodiac'` 분기다.

```text
A full-body 3D low-poly geometric sculpture of a {animal} for modern
interior decor. Placed in a majestic pose. Crafted from luxurious
{material_and_color}. Special feature: {specific_pose_or_feature}.
High-end minimalist art object photography, professional studio lighting
with dramatic reflections, clean neutral background, 8k resolution,
C4D Arnold render style, ready for 3D printing aesthetic.
```

주의: 이 프롬프트는 3D 제품 렌더 이미지를 만들며 STL 자체를 생성하지 않는다.
실제 STL 파이프라인은 `3D_AI_STL_PIPELINE.md`를 따른다.

## 5. 현관 수호동물 3D 입력 원화 프롬프트

2026-07-28 TripoSR용으로 사용한 핵심 편집 명세:

```text
기존 Gate Guardian 미네랄 릴리프에서 수호동물만 분리한다.
연속된 S자 로우폴리 실루엣, 각진 동물 머리, 분절된 광물 패널,
아래쪽 원형 꼬리, 황토·세이지·아이보리·차콜·테라코타 팔레트와
한국적 현대 미스틱 언어를 유지한다.
벽, 문, 식물, 못, 끈, 그림자와 별도 금속 방울은 제거한다.
상단에는 본체와 일체화된 보강 걸이 구멍 하나를 둔다.
분리되거나 떠 있는 조각 없이 하나의 제조 가능한 입체 형상으로 만든다.
카메라는 정면 직교, 원근 왜곡 없음, 전체가 보이게 한다.
배경은 균일한 크로마키색이며 텍스트·로고·워터마크가 없어야 한다.
```

실제 정제 원화:

- `artifacts/3d-source/gate-guardian-mineral-front-alpha-v1.png`
- `artifacts/3d-source/gate-guardian-mineral-front-gray-v1.png`

## 6. To-Be 공간 편집

정본: `api/generate-visuals.ts`, `type === 'to-be'`

모델:

```text
fal-ai/bytedance/seedream/v4.5/edit
```

고정 불변사항:

- 원본 카메라 각도, 벽, 바닥과 기존 가구를 유지한다.
- 처방 아이템만 자연스럽게 추가한다.
- 분석용 공간 사진과 실제 액자 설치 벽 사진은 장기적으로 별도 입력이다.

## 7. 홍보 문안

- Threads·Reddit 실물 스토리: `MARKETING_STORYTELLING.md`
- 고정 원칙: 제작자 공개, 실제 경험만 사용, 매출 인과 단정 금지,
  심리적 앵커와 디자인 가치 강조

## 8. 프롬프트 변경 체크리스트

- [ ] 목적과 대상 모델이 기록됐는가
- [ ] 입력 변수와 기본값이 기록됐는가
- [ ] 출력 형식과 비율이 기록됐는가
- [ ] 금지 항목과 의미 누출 방지가 있는가
- [ ] 수호동물·오행·에너지 모드가 결과와 일치하는가
- [ ] 대표 시나리오 테스트를 실행했는가
- [ ] 런타임 코드와 연구 문서가 함께 갱신됐는가
- [ ] `DECISION_LOG.md`, `PROJECT_STATE.md`, `HANDOFF.md`가 필요한 경우 갱신됐는가
