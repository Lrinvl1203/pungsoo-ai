# PILOT-BIZ-001 아트월·오브제 콘셉트

Last updated: 2026-08-11

Status: `6 CONCEPTS GENERATED`, 선택·출력·STL 미진행

실제 주소·좌표는 기록하지 않는다. 이 문서는 비식별화한 Site Remedy
Identity를 아트월과 제품으로 번역한 결과와 재생성 프롬프트를 보존한다.

## 1. 공통 Remedy Identity

```json
{
  "analysis_scope": "external",
  "product_identity": "Space Guardian",
  "target_element": "earth",
  "secondary_element": "wood",
  "energy_mode": "STABILIZE",
  "secondary_mode": "CIRCULATE",
  "remedy_goal": "스쳐 지나가는 골목 흐름을 밝고 안정적인 도착 경험으로 전환",
  "guardian_animal": "Korean native guardian dog",
  "placement": "gate_and_reception",
  "primary_color": "warm sand and ochre",
  "secondary_color": "muted celadon and charcoal",
  "accent": "restrained brass",
  "pose": "seated alert guardian with the tail closing a protected loop",
  "form_language": "grounded_shield_loop",
  "guardian_visibility": 80
}
```

개는 고객의 출생 띠가 아니라 공간의 문지기·환대·안정을 담당하는
`Space Guardian`이다. 아트월과 오브제는 같은 동물, 보호 고리, 오행 팔레트를
공유하되 완전히 같은 형상을 복제하지 않는다.

## 2. 생성 결과

### 아트월

1. `Quiet Gate` — 밝은 기본형, 현대 민화 선묘와 유기적 추상

   ![Quiet Gate](../assets/pilots/pilot-biz-001/artwall-01-quiet-gate.png)

2. `Celadon Night Watch` — 어두운 부티크 로비형, 옻칠·야간 청자 흐름

   ![Celadon Night Watch](../assets/pilots/pilot-biz-001/artwall-02-celadon-night-watch.png)

3. `Ochre Arrival` — 대담한 그래픽형, 황토 중심의 도착·정착 서사

   ![Ochre Arrival](../assets/pilots/pilot-biz-001/artwall-03-ochre-arrival.png)

### 오브제

1. `Desk Guardian` — 약 12cm 책상·리셉션용 로우폴리 조형

   ![Desk Guardian](../assets/pilots/pilot-biz-001/object-01-desk-guardian.png)

2. `Gate Guardian` — 약 22cm 현관 걸이용 얕은 부조

   ![Gate Guardian](../assets/pilots/pilot-biz-001/object-02-gate-guardian.png)

3. `Pocket Guardian` — 약 5.5cm 키링형 수호 참

   ![Pocket Guardian](../assets/pilots/pilot-biz-001/object-03-pocket-guardian.png)

## 3. 아트월 메타 프롬프트

```text
Use case: stylized-concept
Asset type: premium vertical art-wall print for a personalized Korean Pungsu
hospitality product

Create {CONCEPT_NAME}. Translate the supplied Remedy Identity into one
museum-quality contemporary artwork. Earth is primary, Wood secondary;
STABILIZE first and CIRCULATE second. Show one clearly recognizable Korean
native guardian dog occupying 30–40% of the image. The dog is a calm,
benevolent Space Guardian, not a zodiac mascot. Its single tail closes into
a protective loop around a small warm orb. Show one arriving path or current
that bends and settles around the guardian.

Style: {STYLE_VARIANT}. Contemporary Korean-mystic fine art, mineral pigment
and subtle hanji texture, selective restrained brass contour. Stylish K-content
sensibility without costume-drama historicism.

Composition: portrait 2:3, full bleed, strong animal silhouette readable from
across a room, balanced negative space.

Palette: {PALETTE_VARIANT}; use warm sand, ochre, terracotta, muted celadon,
charcoal and only tiny brass accents.

Hard constraints: one anatomically coherent dog, four legs, one tail; no frame,
room mockup, typography, logo or watermark.

Avoid: dragon, tiger, kitsch zodiac illustration, cute mascot, generic fantasy,
anime, ornate palace motifs, excessive clouds, neon, aggressive expression,
copied artist style.
```

변형값:

| 콘셉트 | `STYLE_VARIANT` | `PALETTE_VARIANT` | 구도 잠금 |
|---|---|---|---|
| Quiet Gate | modernized minhwa linework + restrained organic abstraction | warm sand·ochre·terracotta·muted celadon·charcoal | 밝은 지형, 보호 원, 들어와 정착하는 길 |
| Celadon Night Watch | Korean lacquer painting + minimalist editorial abstraction | charcoal·ink black·muted celadon·dark umber·ochre | 큰 어두운 여백, 청자 흐름, 야간 보호 원 |
| Ochre Arrival | flattened mineral-pigment editorial poster | ochre·burnt terracotta·sand·celadon·charcoal | 비대칭 지형, 방패 고리, 대담한 도착 흐름 |

## 4. 오브제 메타 프롬프트

```text
Use case: product-mockup
Asset type: manufacturable collectible guardian object coordinated with the
Site art-wall collection

Create {OBJECT_NAME}, a hip contemporary Korean guardian-dog product based on
the supplied Remedy Identity. Preserve the recognizable seated dog, one thick
tail forming an integrated protective loop, and one captive ochre/brass orb.
Use refined low-poly architectural planes. It must feel sophisticated and
collectible, not cute or folkloric.

Format and scale: {FORMAT_AND_SCALE}
Construction: {CONSTRUCTION_RULES}

Materials and palette: matte warm sand or charcoal body, muted celadon inset,
charcoal edge or underside, tiny satin brass orb. Limit paint/material zones.

Presentation: one complete product, three-quarter or straight-on catalog view,
neutral premium studio lighting, full object visible, no packaging.

Manufacturing constraints: stable or reinforced connected silhouette, safe
rounded edges, no floating parts, fragile fur, whiskers or thin appendages;
support-minimized and plausible for FDM, resin printing or shallow-relief
production.

Hard constraints: one dog, one tail, no text, logo or watermark.
Avoid: dragon, tiger, fish shape, chibi mascot, ornate talisman replica,
tourist-shop souvenir, glossy cheap plastic, impossible undercuts.
```

변형값:

| 오브제 | `FORMAT_AND_SCALE` | `CONSTRUCTION_RULES` |
|---|---|---|
| Desk Guardian | 약 12cm 독립형 책상 조형 | 넓고 평평한 받침, 분리 가능한 구체, 지지대 최소화 |
| Gate Guardian | 약 22cm, 깊이 12–18mm 현관 얕은 부조 | 일체형 후면판, 보강 걸이 구멍 또는 키홀, 느슨한 장식 없음 |
| Pocket Guardian | 약 5.5cm, 두께 4–6mm 키링 참 | 4mm 이상 보강 연결공, 주머니에 걸리지 않는 모서리, 건메탈 링 |

## 5. 평가와 다음 제작 단계

- 아트월 1안은 가장 범용적이고 실제 미니 액자 후속 테스트에 적합하다.
- 아트월 2안은 어두운 로비에 강하지만 실물 출력 전 암부 뭉침 시험이 필요하다.
- 아트월 3안은 발견성과 젊은 인상이 강해 복도·객실 번호 구역 확장에 적합하다.
- Desk Guardian은 1차 3D 제작 후보로 가장 구조가 단순하고 상품성이 높다.
- Gate Guardian 렌더의 장식 외곽판은 실제 DFM에서 더 단순화해야 한다.
- Pocket Guardian은 귀·상단 연결공·꼬리 안쪽의 최소 두께를 CAD에서 검증한다.
- 생성 이미지는 제품 콘셉트 렌더이며 STL·CAD 원본이 아니다.
- 선택안이 정해지면 정면·측면·후면 턴어라운드 → 메시 생성 → CAD/메시 보정
  → 소형 출력 → 도색·걸이 내구 시험 순서로 진행한다.

