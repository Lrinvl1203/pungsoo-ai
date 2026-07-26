# 방위 정밀화 구현 TODO

상태: `DEFERRED`

우선순위: 액자·오브제 실물 샘플과 주문 검증 이후

목적: 주소나 사진만으로 만드는 초견 분석과, 실제 방위를 측정한 정밀
분석을 구분한다. 방위값이 없는 결과를 정밀 풍수 분석이라고 표현하지
않는다.

## 1. 현재 구현의 한계

### 외부 입지

- 주소를 위경도로 변환하고 북쪽이 위인 위성·도로 지도를 가져온다.
- 주변 약 800m의 도로, 녹지, 수변과 지형의 시각적 특징은 분석할 수 있다.
- 건물 정면, 주 출입구 위치, 대문과 현관이 바라보는 각도는 알 수 없다.
- 필지 경계, 건물 외곽선, 실제 고도·경사·수계 데이터는 사용하지 않는다.

### 내부 공간

- 방 사진에서 가구, 문, 창문과 상대적인 배치는 판독할 수 있다.
- 사진만으로는 진북, 방문 방향, 창문 방향, 침대 머리와 책상 시선 방향을
  알 수 없다.
- 실내의 휴대폰 나침반은 철골, 금속문, 엘리베이터와 전자기기의 영향을
  받을 수 있으므로 단일 측정값을 확정값으로 사용하면 안 된다.

## 2. 분석 등급

| 등급 | 필수 입력 | 결과 표현 |
|---|---|---|
| 초견 분석 | 주소 또는 사진 | 시각적 공간·입지 참고 분석 |
| 정밀 분석 | 지도 핀, 건물 정면, 주 출입구 방향, 평면 구조와 진북 | 방위가 반영된 정밀 분석 |
| 현장급 분석 | 다중 방위 측정, 필지·건물 경계, 고도·경사·수계 | 측정 근거와 오차를 포함한 심층 분석 |

사용자가 정밀 분석을 구매했지만 방위 입력을 완료하지 않으면 초견 분석으로
자동 강등하고 그 사실을 결과에 표시한다.

## 3. 필수 입력

### 외부 입지 입력

1. 국가와 전체 주소
2. 지도에서 사용자가 확인한 정확한 핀
3. 위성지도상의 대상 건물 또는 필지
4. 건물 정면
5. 주 출입구 위치
6. 주 출입구가 바깥을 바라보는 방향
7. 선택 입력: 필지 경계, 대문, 차량 진입로, 상가 카운터

### 내부 공간 입력

1. 방 사진 2장 이상 또는 평면도
2. 평면도상의 진북 화살표
3. 방문과 창문 위치
4. 침대 머리 방향
5. 책상에 앉았을 때 바라보는 방향
6. 소파, 조리대, 계산대 등 공간 목적별 핵심 방향
7. 외부 분석에서 확정한 건물 축과 해당 방의 위치

## 4. 권장 측정 흐름

1. 주소를 위경도로 변환한다.
2. 사용자가 지도 핀과 대상 건물을 확인한다.
3. 위성지도 위에 정면과 주 출입구 화살표를 그리게 한다.
4. 휴대폰으로 동일 방향을 5~10회 측정한다.
5. 측정값의 원형 평균과 분산을 계산한다.
6. 위치와 날짜에 따른 자기편각을 적용해 자북을 진북으로 변환한다.
7. 위성지도에서 계산한 건물 축과 휴대폰 측정값을 비교한다.
8. 오차가 허용 범위를 넘으면 재측정을 요청한다.
9. 확정된 진북 기준 각도와 오차를 분석 데이터에 저장한다.

휴대폰 센서만으로 확정하지 않는다. 가능한 경우 지도상의 건물 축과 평면도
정렬을 주 기준으로 사용하고 휴대폰은 교차 검증 수단으로 사용한다.

## 5. 결과에 표시할 방위 정보

예시:

```text
주 출입구 좌향: 127° 남동향
기준: 진북
측정 오차: ±4.2°
측정 방식: 지도 건물 축 + 휴대폰 8회 평균
방위 신뢰도: 높음
```

권장 신뢰도 기준:

| 신뢰도 | 조건 |
|---|---|
| 높음 | 교차 검증 완료, 예상 오차 ±5° 이하 |
| 보통 | 단일 기준 또는 예상 오차 ±5~10° |
| 낮음 | 예상 오차 10° 초과, 측정값 충돌 또는 센서 정확도 불량 |

신뢰도가 낮으면 세밀한 방위 단정과 특정 각도 기반 처방을 생성하지 않는다.

## 6. 데이터 모델 초안

```ts
interface DirectionMeasurement {
  reference: 'true_north' | 'magnetic_north';
  bearingDegrees: number;
  accuracyDegrees: number | null;
  measuredAt: string;
  latitude: number;
  longitude: number;
  source: 'map_axis' | 'device_compass' | 'floorplan' | 'manual';
}

interface DirectionProfile {
  mainEntranceBearing: number | null;
  facadeBearing: number | null;
  roomNorthBearing: number | null;
  bedHeadBearing: number | null;
  deskViewBearing: number | null;
  declinationDegrees: number | null;
  confidence: 'high' | 'medium' | 'low';
  measurements: DirectionMeasurement[];
}
```

## 7. 구현 작업 목록

- [ ] 국내·해외 글로벌 주소 검색과 지도 핀 확인
- [ ] 지도 위 건물 정면·출입구 화살표 편집 UI
- [ ] 모바일 센서 권한 요청과 방위 측정 UI
- [ ] iOS 진북·자북 및 heading accuracy 처리
- [ ] Android 가속도계·지자기 센서 결합 처리
- [ ] 자기편각 보정
- [ ] 각도 원형 평균과 이상치 제거
- [ ] 지도 건물 축과 센서 측정값 교차 검증
- [ ] 평면도 북쪽·문·창문·가구 마킹 UI
- [ ] 방위 신뢰도 계산 및 재측정 안내
- [ ] 분석 프롬프트에 확정 방위와 오차 전달
- [ ] 보고서에 측정 근거·각도·신뢰도 표시
- [ ] 방위 없는 기존 분석을 `초견 분석`으로 명확히 표시
- [ ] 국내·미국·유럽·남반구 주소별 테스트

## 8. 완료 조건

- 사용자가 건물과 출입구 방향을 지도에서 확인할 수 있다.
- 내부 평면 구조와 진북을 하나의 좌표계로 정렬할 수 있다.
- 자북·진북 기준이 데이터와 결과 화면에 명시된다.
- 분석마다 각도, 오차, 측정 방식과 신뢰도가 저장된다.
- 낮은 신뢰도의 입력으로 정밀 방위 처방을 생성하지 않는다.
- 내부·외부 결과가 동일한 진북 기준을 사용한다.

## 9. 표현과 책임 범위

정확한 방위, 거리, 고도와 지형을 측정하는 것과 풍수 해석의 과학적
유효성은 구분한다. 결과 화면에서는 측정 데이터는 객관적 공간 정보로,
길흉과 비보는 전통 풍수 체계에 기반한 문화적·공간적 해석으로 설명한다.

## 10. 참고 자료

- [NOAA: Magnetic Declination](https://www.ngdc.noaa.gov/geomag/declination.shtml)
- [NOAA: 2025 World Magnetic Model](https://www.nesdis.noaa.gov/news/noaabritish-geological-survey-release-2025-world-magnetic-model-report)
- [Apple: trueHeading](https://developer.apple.com/documentation/corelocation/clheading/trueheading)
- [Apple: Getting heading and course information](https://developer.apple.com/documentation/corelocation/getting-heading-and-course-information)
- [Android Developers: Position sensors](https://developer.android.com/develop/sensors-and-location/sensors/sensors_position)

