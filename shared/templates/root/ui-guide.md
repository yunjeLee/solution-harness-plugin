# ui-guide 모듈

호출자 (`/harness-root`, `/harness-root-edit`) 가 Read tool 로 읽고 지침을 따른다. 디자인 시스템 코드 감지 여부에 따라 분기한다.

## 대상 파일

`docs/rules/UI_GUIDE.md`

## 사전 스캔

### 감지 로직

**Android**:
- Glob: `**/ui/theme/Color.kt`, `**/ui/theme/Theme.kt`

**iOS**:
- Glob: `**/Assets.xcassets/**/Contents.json`, `**/Theme.swift`, `**/DesignSystem*.swift`
- 결과가 비어있으면 `extension Color` / `extension UIColor` 같은 색상 확장 코드를 Grep 으로 탐색해 fallback.

### 분기 처리

#### 감지 실패 시

```
디자인 시스템 코드가 감지되지 않았습니다.
docs/rules/UI_GUIDE.md 를 생성할까요? [y/N]
```

- `N` (기본): **파일 생성하지 않음**. `CLAUDE.md` 의 조건부 로딩 트리거 블록에도 UI_GUIDE 항목을 추가하지 않는다. 팀원이 나중에 수동으로 `docs/rules/UI_GUIDE.md` 를 추가하면 `/harness-root-edit ui_guide` 로 가이드를 연결할 수 있다.
- `y`: 빈 템플릿 생성 — 모든 섹션 값을 `{TBD: 디자인시스템 코드 미감지}` 로.

#### 감지 성공 시

1. Color.kt 또는 `.colorset` 에서 색상 토큰 자동 추출.
2. Theme.kt 에서 typography / shape 추출.
3. **s1 (원칙) 자동 초안 생성** — 정적 템플릿 3 개 + 스캔 매칭 추가 원칙. **정적 3 + 매칭 0~5 = 최대 8 줄** 초안.
4. **s3 (컴포넌트) 자동 초안 생성** — Composable / UIView 시그니처 통계 + 매칭 규칙. **매칭 0~4 줄** 초안 (매칭 0 시 일반 템플릿 1 줄).

### 결과 형식

- 색상 시스템 (Material3 / 커스텀 팔레트 / 단색 기반 등)
- typography 종류
- shape (rounded 수준)
- 색상 토큰 표 (자동 추출)

## 섹션 목록

| 섹션 ID | 헤더 | 타입 |
|--------|-----|-----|
| s1 | `## 원칙` | 자동 초안 |
| s2 | `## 색상` | 자동 |
| s3 | `## 컴포넌트` | 자동 초안 |
| s4 | `## AI 슬롭 금지 (하지 마라)` | 정적 |

## 신뢰도 판정 규칙

| 항목 | 판정 |
|------|------|
| 정적 기본 원칙 3 개 | 태그 없음 (정적) |
| 스캔 매칭 추가 원칙 | `[추정]` |
| 색상 토큰 자동 추출 | `[확정]` |
| 컴포넌트 매칭 규칙 | `[추정]` |

## 섹션별 생성 로직

### s1: 원칙 (자동 초안, 감지 성공 시만)

정적 기본 원칙 3 개 + 스캔 매칭 추가 원칙으로 1~3 줄을 자동 작성한다.

#### 정적 기본 원칙 (항상 포함, 태그 없음)

- 접근성: 텍스트는 4.5:1 명도 대비 이상, 터치 타겟 44pt 이상.
- 일관성: 색상 / typography / shape 는 토큰만 사용. inline 값 금지.
- 단순성: 하나의 화면에 강조 색상 1 개, 위계는 typography 로.

#### 스캔 매칭 추가 원칙

| 감지 패턴 | 추가 원칙 |
|----------|---------|
| Material3 색상 토큰 | "Material3 표준 준수, 커스텀 컬러 최소화" `[추정]` |
| colorScheme 에 light / dark 둘 다 정의 | "다크모드 우선 설계" `[추정]` |
| rounded shape 토큰 존재 | "부드러운 shape 기반, 각진 UI 지양" `[추정]` |
| 고정된 typography scale | "Typography 는 토큰만 사용, inline fontSize 지정 금지" `[추정]` |
| 커스텀 팔레트 | "브랜드 컬러 강조, 배경은 최소화된 뉴트럴" `[추정]` |

초안은 정적 3 개 + 매칭된 추가 원칙을 합쳐 최대 8 개까지 출력. 매칭 0 개여도 정적 3 개는 항상 포함된다.

### s2: 색상 (자동)

자동 추출된 색상 토큰을 표 형태로 채운다. `[확정]` 태깅.

### s3: 컴포넌트 (자동 초안, 감지 성공 시만)

모듈 내 Composable / UIView 시그니처 통계 + 매칭 규칙으로 매칭 0~4 줄 초안.

#### 시그니처 통계 수집

- Android: `**/*.kt` 중 `@Composable` 함수 시그니처 상위 10 개. 함수명 prefix (Card / Button / Icon / Text / Screen / Row / Column 등) 빈도 측정.
- iOS: `**/*.swift` 중 `View` / `UIView` 서브클래스 / `protocol Component` 적합 타입의 시그니처 상위 10 개.

#### 매칭 규칙 (감지 패턴별 자동 추가)

| 감지 패턴 | 자동 규칙 |
|----------|---------|
| Card composable 사용 | "Card 는 elevation 0, rounded 12dp 고정" `[추정]` |
| M3 Button 사용 | "Button 은 M3 Variant 만 사용 (Filled / Outlined / Text)" `[추정]` |
| 커스텀 Icon 함수 다수 | "Icon 은 20dp / 24dp 두 사이즈만 사용" `[추정]` |
| `*Screen` suffix Composable 다수 | "Screen 단위 Composable 은 모듈당 1 개, 하위는 Section 으로" `[추정]` |

매칭 0 개면 일반 템플릿 1 줄 ("컴포넌트 규칙 미수립 — 후속 spec 또는 사용자 직접 추가") 을 두고 초안 종료.

### s4: AI 슬롭 금지 (정적)

대화 없음. 출력 템플릿 본문을 그대로 기록.

## 출력 템플릿

````markdown
# UI 디자인 가이드

## 원칙
{s1 답변 또는 {TBD: 디자인시스템 코드 미감지}}

## 색상
{s2 자동 추출된 색상 토큰 표} [확정]

## 컴포넌트
{s3 답변 또는 {TBD: 디자인시스템 코드 미감지}}

## AI 슬롭 금지 (하지 마라)
- `backdrop-filter: blur()` — glass morphism
- gradient text (배경 그라데이션 텍스트)
- "Powered by AI" 배지
- box-shadow 글로우 애니메이션
- 보라/인디고 브랜드 색상 ("AI = 보라색" 클리셰)
- 배경 gradient orb (blur-3xl 원형)
````
