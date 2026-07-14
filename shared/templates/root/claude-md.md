# claude-md 모듈

호출자 (`/harness-root`, `/harness-root-edit`) 가 Read tool 로 읽고 지침을 따른다. 다른 7 개 모듈과 다르게 `@docs/...` 참조 블록을 메인으로 한다. 사전 스캔 결과로 자동 초안을 생성하고 신뢰도 태깅한다.

## 대상 파일

`CLAUDE.md` (프로젝트 루트)

## 사전 스캔

### 입력 소스 (우선순위 순)

1. 레포 내 설정 파일:
   - Android: `build.gradle(.kts)`, `libs.versions.toml`, `settings.gradle(.kts)`, `detekt.yml`, `.editorconfig`, `ktlint` 설정
   - iOS: `Package.swift`, `Info.plist`, `*.xcodeproj`, `.swiftlint.yml`, `.swiftformat`, `.editorconfig`
2. `~/.claude/CLAUDE.md` (user-level) — 존재 시 자동으로 초안 소스에 활용, 활용한 섹션은 `[추정]` 태깅.

### 결과 형식

- 프로젝트명 (`settings.gradle.kts` 의 `rootProject.name` 또는 `Info.plist` 의 `CFBundleName`)
- 기술 스택 (사용 라이브러리에서 자동 추출)
- 최소 SDK (Android `minSdk`, iOS `IPHONEOS_DEPLOYMENT_TARGET`)
- 모듈 구조 / 라이브러리 사용 패턴 (CRITICAL 예시 생성 용)

## 섹션 목록

| 섹션 ID | 헤더 | 타입 |
|--------|-----|-----|
| s1 | `## CRITICAL 규칙` | 자동 초안 |
| s2 | `## 피해야 할 것 (AVOID)` | 자동 초안 |
| s3 | `## Claude Code 응답 규칙` | 자동 초안 |
| s4 | `## (참조 블록 + 조건부 로딩 트리거 블록)` | 정적 |

> s4 는 `## 아키텍처`(ARCHITECTURE 문서 참조), `## 팀 컨벤션`(CONVENTIONS 문서 참조), `## 세션 규칙`(SESSION 문서 참조), `## 조건부 로딩` 4 개 H2 묶음이다. 앞 3 개가 `@` 참조로 매 turn 자동 적재되고, 나머지 4 개 docs (PRD / ADR / UI_GUIDE / TESTING) 는 조건부 로딩 블록에 트리거 조건별로 한 줄씩 명시되어 해당 트리거 상황에서 `docs/rules/` 하위 문서로 적재된다. 부분 수정 시 4 개 H2 묶음 단위로 다룬다.

## 신뢰도 판정 규칙

| 섹션 | 판정 |
|------|------|
| CRITICAL 규칙 | 감지 패턴 매칭(Hilt/Compose/Clean 등) → `[추정]`, 일반 템플릿 → `[검수 필요]` |
| 피해야 할 것 | 플랫폼 기본 템플릿 자동 적용 → `[검수 필요]` |
| Claude Code 응답 규칙 | 기본 템플릿 자동 적용 → `[검수 필요]` |
| 참조 블록 + 조건부 로딩 트리거 블록 | 정적 (기존과 동일, 태그 없음) |

## 초안 생성 로직

### s1: CRITICAL 규칙

레포의 모듈 구조 및 주요 라이브러리 사용 패턴을 스캔해 자동 초안을 생성한다.

#### 감지 패턴 → 자동 규칙

| 감지 패턴 | 규칙 |
|----------|------|
| `:data` 모듈 존재 | "모든 API / 외부 DB 호출은 `:data` 모듈에서만" |
| `:domain` 모듈 + UseCase 파일 | "비즈니스 로직은 UseCase 계층에서만. ViewModel 은 UseCase 만 호출" |
| Hilt 사용 | "Direct singleton 접근 금지. 모든 의존성은 constructor injection 으로" |
| Compose + ViewModel | "Composable 내 ViewModel 직접 생성 금지. `hiltViewModel()` 또는 파라미터 주입" |
| Coroutine 사용 | "GlobalScope 사용 금지. ViewModelScope / LifecycleScope 사용" |

- 매칭된 규칙 → `[추정]` 태깅
- 스캔 매칭 실패 시 → 일반 템플릿 규칙 + `[검수 필요]` 태깅
- `~/.claude/CLAUDE.md` 에 관련 규칙 존재 시 → 해당 내용 반영 `[추정]`

### s2: 피해야 할 것

플랫폼별 기본 템플릿을 자동 적용하고 `[검수 필요]` 태깅.

#### 기본 템플릿 (Android)

```
- 의미 없는 추상화
- 과도한 generic / base class 설계
- direct singleton 남용
- lifecycle 을 무시한 상태 처리
- Compose 에서 상태 소유권이 불명확한 구조
- Context 의존성이 퍼지는 구조
- "일단 동작만 하는" 임시 코드
- 현재 프로젝트 문맥을 무시한 과한 리팩토링
```

#### 기본 템플릿 (iOS)

```
- 의미 없는 추상화
- 과도한 protocol / generic 설계
- singleton 남용
- ARC / retain cycle 을 무시한 클로저 캡처
- Combine / SwiftUI 에서 상태 소유권이 불명확한 구조
- AppDelegate 의존성이 퍼지는 구조
- "일단 동작만 하는" 임시 코드
- 현재 프로젝트 문맥을 무시한 과한 리팩토링
```

`~/.claude/CLAUDE.md` 에 "피해야 할 것" 섹션이 있으면, 그 내용을 기본 템플릿 대신 채용하고 `[추정]` 태깅.

### s3: Claude Code 응답 규칙

기본 템플릿을 자동 적용하고 `[검수 필요]` 태깅.

```
- 응답 언어: 한국어
- 응답 순서: 문제 요약 → 원인/구조 → 해결 방향 → 추천안 → 코드 예시
- 코드 예시: Kotlin (Android) / Swift (iOS), 복붙 가능한 Markdown
- 불확실한 내용: 추측하지 말고 "추정" 이라고 명시
- "정답" 단정 금지, trade-off 함께 제시
- 코드 수정 전 변경안 먼저 제시하고 확인 후 진행
- 장황한 이론보다 실무 적용 중심 설명
```

`~/.claude/CLAUDE.md` 에 응답 규칙 섹션이 있으면, 그 내용을 기본 템플릿 대신 채용하고 `[추정]` 태깅.

### s4: 참조 블록 + 조건부 로딩 트리거 블록 (정적)

매 turn 자동 적재 (`@` 참조) 대상은 **3 개로 제한**한다 — ARCHITECTURE / CONVENTIONS / SESSION 문서. 나머지 4 개 (PRD / ADR / UI_GUIDE / TESTING) 는 `## 조건부 로딩` 섹션에 트리거 조건별로 기록하여, 해당 트리거 상황(예: test 디렉토리 편집, 의존성 매니페스트 편집, 신규 기능 작업 시작, 상위 모듈 접근)에서 `docs/rules/` 하위 문서로 적재되도록 한다. 대화 없음.

트리거 리스트는 출력 템플릿의 형식 그대로 생성한다. `docs/rules/UI_GUIDE.md` 가 생성되지 않은 프로젝트라면 UI_GUIDE 트리거 줄을 제외하고 나머지 줄만 기록한다.

> `docs/rules/UI_GUIDE.md` 트리거 줄은 파일이 생성된 경우에만 출력한다.

> 결정 근거: `/harness-verify` 측정 결과 — 6 개 모두 자동 적재 시 prefix ≈ 8K 토큰이 매 LLM call 마다 cache_read 로 누적. 핵심 3 개만 적재 + 나머지는 조건부 로딩 트리거로 위임해 prefix 절감 효과 확보.

## 출력 템플릿

````markdown
<!-- 이 파일은 ≤80 줄로 유지. -->
# 프로젝트: {프로젝트명}

## 아키텍처
@docs/ARCHITECTURE.md

## 팀 컨벤션
@docs/CONVENTIONS.md

## 세션 규칙
@docs/SESSION.md

## CRITICAL 규칙
{s1 자동 초안} [추정]

## 피해야 할 것 (AVOID)
{s2 자동 초안} [검수 필요]

## Claude Code 응답 규칙
{s3 자동 초안} [검수 필요]

## 조건부 로딩 (rule) — 트리거는 항상 여기, 내용은 docs/rules/
- test 디렉토리(**/test/, **/androidTest/, **/*Tests/) 편집 시 → @docs/rules/TESTING.md
- {사용자 지정 경로} 편집 시 → @docs/rules/UI_GUIDE.md   # UI_GUIDE 생성 시에만. harness-root 가 경로를 물어 채움
- 신규 기능/스펙 작업 시작 시 → @docs/rules/PRD.md
- 의존성 매니페스트(build.gradle.kts, libs.versions.toml, Podfile, Package.swift) 편집 시 → @docs/rules/ADR.md
- {상위 모듈} 접근 시 → @docs/rules/{module}.md          # harness-module 이 존재하는 상위 모듈만
````

> 팀 컨벤션 / 작업 규칙 / 사용 라이브러리 등은 `docs/CONVENTIONS.md` 에서 수집한다. CLAUDE.md 는 `@` 참조로 위임. `~/.claude/CLAUDE.md` 참고에 동의한 경우 해당 파일의 "피해야 할 것", "팀 컨벤션", "리팩토링 원칙", "우선순위" 등을 conventions 모듈의 예시 생성에 활용한다.
