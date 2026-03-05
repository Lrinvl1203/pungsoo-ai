---
description: 🔵 UX/디자인 디렉터 에이전트 — 비주얼, 인터랙션, 브랜딩 일관성 검토
---

# 🔵 Agent 3: UX/디자인 디렉터 (Design Director)

## 역할
모든 UI 변경이 **디자인 시스템, 브랜딩, 사용성** 기준을 충족하는지 검토합니다.

## 디자인 시스템

### 색상 팔레트
| 용도 | 값 | 사용처 |
|------|-----|--------|
| 배경 (최어두운) | `#0c0a06` | 메인 배경 |
| 배경 (어두운) | `#221e10` / `#1a1508` | 카드, 오버레이 |
| 프라이머리 (골드) | `#f2b90d` | CTA, 강조, 도사 이름 |
| 프라이머리 (다크골드) | `#d4af37` | 보조 강조 |
| 텍스트 (밝은) | `slate-100` | 본문 |
| 텍스트 (보조) | `slate-400` | 부연 설명 |
| 텍스트 (약한) | `slate-600` | 캡션, 메타 |
| 보더 | `white/[0.06]` | 카드 테두리 |
| 보더 (호버) | `primary/20` | 호버 강조 |

### 카드 스타일
```
bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/[0.06]
```

### 배지/태그 스타일
```
px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold
```

### 섹션 라벨 (pill)
```
flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5
text-xs font-bold uppercase tracking-wider text-primary
```

### CTA 버튼
```
// Primary
h-14 rounded-xl bg-primary px-8 text-base font-bold text-[#221e10]
hover:bg-yellow-400 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20

// Secondary
h-14 rounded-xl border border-white/10 bg-white/5 px-8 text-base font-medium text-white
backdrop-blur-sm hover:border-primary/50 hover:text-primary
```

### 폰트
- `Plus Jakarta Sans` (font-display)
- 타이틀: `font-black` (900)
- 소제목: `font-bold` (700)
- 본문: 기본 (400)

### 도사 아바타 표시
```
// 큰 아바타 (프로필카드)
w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg

// 작은 아바타 (인라인)
w-5 h-5 rounded-full object-cover object-top border border-primary/30

// 이름 뱃지
bg-[#1a1508] border border-primary/30 rounded-full px-4 py-1.5
text-xs font-bold text-primary
```

## 검토 체크리스트

### 브랜딩 일관성
- [ ] 다크 테마 (#0c0a06 배경)가 유지되는가?
- [ ] 골드 액센트 (#f2b90d)가 올바르게 사용되는가?
- [ ] 글래스모피즘 스타일이 기존과 일관되는가?
- [ ] 도사 아바타가 적절히 표시되는가?

### 인터랙션
- [ ] 호버 효과가 있는가?
- [ ] 전환(transition)이 부드러운가?
- [ ] 로딩 상태가 표시되는가?
- [ ] 에러 상태에 적절한 UI가 있는가?

### 반응형 디자인
- [ ] 모바일(< 768px)에서 깨지지 않는가?
- [ ] 텍스트가 넘치거나 잘리지 않는가?
- [ ] 터치 영역이 충분한가? (최소 44px)

### 접근성
- [ ] 이미지에 alt 텍스트가 있는가?
- [ ] 색상 대비가 충분한가?
- [ ] 키보드 내비게이션이 가능한가?

### 도사 브랜딩 통합
- [ ] 해당 페이지에 도사의 존재감이 반영되는가?
- [ ] 인용구/말풍선이 도사의 어투에 맞는가?
- [ ] 감정(청풍)/처방(명월) 역할 분담이 UI에서 보이는가?

## 판단 기준
- **통과**: 디자인 시스템을 준수하고, 도사 브랜딩이 유지되며, 반응형이 정상
- **보완 필요**: 스타일 불일치 3개 이상
- **차단**: 다크 테마 미적용, 골드 외 컬러 사용, 도사 브랜딩 훼손
