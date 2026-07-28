# 수호동물 AI → 출력용 STL 파이프라인

## 현재 결론

현관용 수호동물은 `제품 정면 원화 → TripoSR 입체 복원 → 치수/두께 정규화
→ STL 검증` 순서로 첫 실물 후보를 만든다.

- 로컬 장비: NVIDIA RTX 3070 8GB, RAM 32GB
- 1차 모델: [TripoSR](https://github.com/VAST-AI-Research/TripoSR)
- 선택 이유: 기본 약 6GB VRAM, 단일 이미지 복원, 코드와 사전학습 모델 MIT
  라이선스
- 현재 산출물: 97.761 × 170 × 12mm, 35,608 triangles, watertight solid

## 모델 후보 판단

### TripoSR — 현재 적용

- 이 장비에서 GPU 추론 가능
- 공식 기본 설정은 단일 이미지당 약 6GB VRAM
- MIT 라이선스로 초기 상품 실험에 가장 단순
- 원본 출력은 OBJ/GLB이며 출력용 STL 보정이 별도로 필요

### Stable Fast 3D — 후속 품질 비교

- [공식 저장소](https://github.com/Stability-AI/stable-fast-3d)
- TripoSR 기반으로 메시 아티팩트, UV, 재질 예측을 개선
- 기본 약 6GB VRAM으로 장비 범위 안
- Windows 지원은 실험적이며 VS 2022와 Hugging Face 접근 승인이 필요
- Stability AI Community License 적용. 상업 사용 시 등록 및 매출 조건 확인 필요

### InstantMesh — 보류

- [공식 저장소](https://github.com/TencentARC/InstantMesh)
- 단일 이미지에서 다중 시점을 만든 뒤 메시를 복원
- Apache-2.0이지만 현재 장비에서는 구성과 메모리 부담이 TripoSR보다 큼

### TRELLIS — 로컬 제외

- [공식 저장소](https://github.com/microsoft/TRELLIS)
- 공식 요구사항이 Linux와 최소 16GB VRAM이므로 RTX 3070 8GB에 부적합

### Hunyuan3D-2 — 프로젝트 제외

- [공식 라이선스](https://github.com/Tencent-Hunyuan/Hunyuan3D-2/blob/main/LICENSE)
- 라이선스가 대한민국에 적용되지 않는다고 명시되어 국내 상업 프로젝트에서 제외

## 실행 구조

1. 인테리어 목업에서 수호동물만 정면 제품 원화로 재구성한다.
2. 배경을 투명 처리한 뒤 회색 배경에 합성한다.
3. TripoSR로 watertight 입체 메시를 생성한다.
4. 가장 긴 축을 높이, 중간 축을 폭, 가장 짧은 축을 깊이로 정규화한다.
5. 현관 샘플 규격 170mm 높이와 12mm 깊이로 변환한다.
6. STL 재로딩 후 단일 컴포넌트, watertight, winding, volume을 검사한다.

## 현재 파일

- 정제 원화: `artifacts/3d-source/gate-guardian-mineral-front-alpha-v1.png`
- AI 원본 메시: `artifacts/3d-ai/triposr-gate-mineral-v1/0/mesh.obj`
- 출력 후보 STL:
  `artifacts/3d-ai/triposr-gate-mineral-v1/gate-guardian-mineral-ai-170x98x12mm-v1.stl`
- 변환 스크립트: `scripts/finalize_ai_mesh_for_print.py`

## 생산 전 남은 DFM

이번 파일은 실제 닫힌 3D solid이지만 바로 대량 생산용 마스터로 확정하지 않는다.

- 슬라이서에서 0.4mm 노즐 기준 최소 벽/모서리 확인
- 뒷면 평탄도와 문 충돌 여부 확인
- 걸이 구멍 둘레 최소 3mm 이상 확인
- FDM과 레진 각각 1개 시험 출력
- 낙하/당김 테스트 후 걸이부 보강
- 필요하면 CAD에서 뒷면과 걸이부만 재설계하고 AI 전면 형상은 유지
