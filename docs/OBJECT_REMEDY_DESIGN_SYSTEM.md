# 비방서 → 3D 수호 오브제 디자인 시스템

Last updated: 2026-08-11

Status: `DESIGNED`, 실물 출력 전

## 1. 목적

비방서에서 나온 오행·에너지 모드·공간 목적·수호동물을 장식적인 색상 교체가
아니라 실제 오브제의 종, 자세, 실루엣, 무게중심, 재료 언어와 설치 구조로
번역한다. 비방화와 오브제는 하나의 `Remedy Identity`를 공유한다.

2026-08-03 생성한 10종은 실제 고객 비방서 10건의 결과가 아니라 이 번역
문법을 검증하기 위한 대표 비방 조합이다. 실제 판매 결과처럼 표현하지 않는다.

## 2. 정본 입력: Remedy Identity

```json
{
  "analysis_scope": "internal | external",
  "target_element": "wood | fire | earth | metal | water",
  "element_condition": "deficient | excessive | stagnant | balanced",
  "energy_mode": "PURIFY | CIRCULATE | AMPLIFY | STABILIZE | RESTORE",
  "remedy_goal": "짧은 자연어 목적",
  "guardian_animal": "비방서가 정한 수호동물",
  "placement": "desk | gate | shelf | keyring",
  "recommended_direction": "optional; measured or estimated metadata required",
  "primary_color": "오행 기반 주조색",
  "secondary_color": "균형 보조색",
  "pose": "조형 자세",
  "form_language": "open_loop | closed_loop | rising | grounded | shield",
  "guardian_visibility": 75
}
```

수호동물은 출생 띠를 그대로 복제하지 않는다. 출생 정보는 참고값이며,
사주·공간 문제·보완 오행·배치 목적을 합친 비방서의 최종 수호동물을 사용한다.

## 3. 번역 규칙

### 오행 → 형태와 색

| 오행 | 조형 문법 | 주조색 |
|---|---|---|
| 목 | 상승, 가지, 열린 아치, 성장 방향 | 비취, 옥색, 솔잎색 |
| 화 | 전진, 상승, 방사, 날렵한 면 | 주사, 적갈, 호박색 |
| 토 | 낮은 중심, 넓은 바닥, 산·기단형 | 황토, 모래, 따뜻한 베이지 |
| 금 | 대칭, 방패, 명확한 절단면 | 백색, 회색, 흑연, 제한적 황동 |
| 수 | 곡선, 물방울, 고리, 연속 흐름 | 남색, 먹색, 달빛 회색 |

### 에너지 모드 → 자세와 실루엣

| 모드 | 목적 | 자세·형태 |
|---|---|---|
| `PURIFY` | 과잉·정체 제거 | 방패형, 선명한 윤곽, 안쪽으로 모아 배출 |
| `CIRCULATE` | 막힌 흐름 재순환 | S자, 열린 고리, 연속 곡선 |
| `AMPLIFY` | 부족 기운 보충 | 상승, 전진, 방사, 큰 흉곽 |
| `STABILIZE` | 생활·재물 기반 고정 | 앉은 자세, 낮은 중심, 넓은 기단 |
| `RESTORE` | 소진된 기운 회복 | 완만한 상승, 보호 곡선, 단계형 성장 |

### 설치 위치 → 제품 구조

| 위치 | 구조 |
|---|---|
| 데스크·선반 | 80~120mm, 자체 기립, 넓고 평평한 바닥 |
| 현관·문 | 140~180mm, 평탄한 후면, 일체형 보강 걸이, 문 보호 패드 면 |
| 키링 | 45~65mm, 단순 실루엣, 두꺼운 일체형 고리, 돌출부 최소화 |

## 4. 10종 대표 샘플

| 번호 | 대표 비방 | 수호동물 | 핵심 조형 | 파일 |
|---|---|---|---|---|
| 01 | 목·순환 | 토끼 | 귀를 두꺼운 상승 아치로 결합 | `../artifacts/3d-concepts/2026-08-03-remedy-guardian-collection-v1/01-wood-circulate-rabbit.png` |
| 02 | 목·화·증폭 | 호랑이 | 웅크린 전진 에너지와 감긴 꼬리 기단 | `../artifacts/3d-concepts/2026-08-03-remedy-guardian-collection-v1/02-wood-fire-amplify-tiger.png` |
| 03 | 균형·순환 | 용 | 보호 중심을 감싸는 굵은 S자 고리 | `../artifacts/3d-concepts/2026-08-03-remedy-guardian-collection-v1/03-balance-circulate-dragon.png` |
| 04 | 화·정화 | 뱀 | 방패형 머리와 무한 고리 기단 | `../artifacts/3d-concepts/2026-08-03-remedy-guardian-collection-v1/04-fire-purify-snake.png` |
| 05 | 화·증폭 | 말 | 상승하는 흉곽과 전진 자세 | `../artifacts/3d-concepts/2026-08-03-remedy-guardian-collection-v1/05-fire-amplify-horse.png` |
| 06 | 토·안정 | 소 | 낮고 넓은 단일 덩어리 | `../artifacts/3d-concepts/2026-08-03-remedy-guardian-collection-v1/06-earth-stabilize-ox.png` |
| 07 | 토·목·회복 | 양 | 산형 상승 실루엣과 머리에 붙은 나선 뿔 | `../artifacts/3d-concepts/2026-08-03-remedy-guardian-collection-v1/07-earth-wood-restore-goat.png` |
| 08 | 금·순환 | 원숭이 | 몸·팔·꼬리가 만드는 보호 고리 | `../artifacts/3d-concepts/2026-08-03-remedy-guardian-collection-v1/08-metal-circulate-monkey.png` |
| 09 | 금·정화 | 닭 | 방패형 몸과 두꺼운 계단식 부채 꼬리 | `../artifacts/3d-concepts/2026-08-03-remedy-guardian-collection-v1/09-metal-purify-rooster.png` |
| 10 | 수·증폭 | 쥐 | 물방울형 몸과 닫힌 꼬리 고리 | `../artifacts/3d-concepts/2026-08-03-remedy-guardian-collection-v1/10-water-amplify-rat.png` |

## 5. 공통 생성 프롬프트 정본

```text
Use case: product-mockup
Asset type: premium concept render for a real 3D-printable PUNGSOO AI
guardian object.

Design one personalized K-feng-shui guardian sculpture manufacturable by
FDM or resin printing at 8–12 cm. Use hip contemporary Korean mysticism,
low-poly collectible design and gallery-store product language. It must not
look like a traditional souvenir, cute mascot or toy.

Use exactly one recognizable guardian animal and one contiguous,
watertight-looking solid. Integrate a broad stable base into the body.
All limbs, ears, horns, feathers and tail must merge into the main mass;
avoid free-floating parts and thin protrusions. Use shallow embossed detail,
modest overhangs and minimum-looking feature thickness of 2.5 mm.

Translate Korean mineral pigment and matte lacquer into printable color
zones, with restrained brushed-brass accent seams, faceted planes and subtle
contemporary dancheong geometry without readable symbols.

Show an isolated full-body object in a front three-quarter orthographic-like
product view on a soft warm-gray studio background with a subtle contact
shadow. No text, letters, logo, watermark, separate pedestal, scenery, prop,
extra animal, human or photoreal fur.

Append the Remedy Identity variables:
- target element and condition
- energy mode and remedy goal
- guardian animal and two recognizable species cues
- pose and form language
- primary and secondary color
- intended placement
```

## 6. 생성물 심사

이미지 생성 성공과 실제 출력 가능성을 구분한다.

- 비방서와 수호동물·오행·에너지 모드가 일치하는가
- 동물 종이 실루엣만으로 구분되는가
- 비방화와 같은 수호동물·주조색·흐름을 공유하는가
- 장난감·판타지 캐릭터·전통 기념품처럼 보이지 않는가
- 한 덩어리 메시로 복원 가능한가
- 얇은 귀·뿔·꼬리·다리·깃털과 과도한 오버행이 없는가
- 데스크형은 스스로 서고, 현관형은 평탄한 후면과 보강 걸이가 가능한가

선택된 1안만 정면·좌측·우측·후면·상면의 동일 형상 시트로 재생성한 뒤
TripoSR 복원, 메시 정리, 치수 정규화와 실제 출력 DFM을 진행한다.
