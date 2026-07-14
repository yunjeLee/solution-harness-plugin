# testing 모듈

호출자 (`/harness-root`, `/harness-root-edit`) 가 Read tool 로 읽고 지침을 따른다. 사전 스캔 결과로 자동 초안을 생성하고 신뢰도 태깅한다.

## 대상 파일

`docs/rules/TESTING.md`

## 사전 스캔

질문 시작 전 아래 소스를 Read / Glob / Bash 로 확인한다.

| 소스 | 용도 |
|------|------|
| `src/test/**/*.kt`, `src/androidTest/**/*.kt` (Android) | 테스트 디렉토리 존재 및 샘플 파일 |
| `Tests/**/*.swift`, `*Tests/**/*.swift` (iOS) | iOS 테스트 파일 |
| `libs.versions.toml`, `build.gradle(.kts)` | JUnit, MockK, Turbine, Espresso 등 감지 |
| `Package.swift`, `Podfile` | XCTest, Nimble, Quick 등 감지 |
| `.github/workflows/*.yml`, `Jenkinsfile`, `bitrise.yml` | CI 에서 테스트 실행 여부 |
| jacoco / kover 설정 파일 | 커버리지 도구 감지 |

### 결과 형식

- 테스트 디렉토리 존재 / 부재
- 기존 테스트 파일 샘플 1~2 개의 네이밍 패턴
- 사용 라이브러리 목록 (s5 자동 채움 용)
- CI 설정 존재 / 부재
- 커버리지 도구 존재 / 부재

## 섹션 목록

| 섹션 ID | 헤더 | 타입 |
|--------|-----|-----|
| s0 | `## 검증 명령어` | 자동 |
| s1 | `## 테스트 레벨` | 자동 초안 |
| s2 | `## 네이밍 규칙` | 자동 초안 |
| s3 | `## 커버리지 목표` | 자동 초안 |
| s4 | `## CI 연동` | 자동 초안 |
| s5 | `## 사용 라이브러리` | 자동 |

## 신뢰도 판정 규칙

| 섹션 | 판정 |
|------|------|
| 검증 명령어 | 항상 `{TBD}` (기존과 동일) |
| 테스트 레벨 | test/androidTest 존재 → `[추정]`, 없음 → `{TBD: 테스트 디렉토리 없음}` |
| 네이밍 규칙 | 기존 테스트 파일 샘플 패턴 매칭 → `[추정]`, 없음 → `[검수 필요]` |
| 커버리지 목표 | jacoco/kover 설정 → `[확정]`, 없음 → `[검수 필요]` |
| CI 연동 | workflow 파일에 test step 감지 → `[확정]`, 없음 → `{TBD: CI 설정 없음}` |
| 사용 라이브러리 | 자동 스캔 → `[확정]` (기존과 동일) |

## 초안 생성 로직

### s0: 검증 명령어 (자동)

5 개 항목 (build / lint / unit / integration / e2e) 을 모두 `{TBD}` placeholder 로 자동 생성한다.
사용자에게 묻지 않는다. 값은 사용자가 나중에 직접 채우거나 `/harness-root-edit testing` 로 갱신한다.

### s1: 테스트 레벨

- `src/test` 있음, `androidTest` 없음 → "unit 만 (ViewModel / UseCase / Mapper)" `[추정]`
- `src/test` + `androidTest` 있음 → "unit + instrumented" `[추정]`
- Room/Realm 감지 + `src/test` → "unit + integration (DB / Repository 포함)" `[추정]`
- 테스트 디렉토리 없음 → `{TBD: 테스트 디렉토리 없음}`

### s2: 네이밍 규칙

기존 테스트 파일에서 함수 시그니처를 샘플링:
- `given_when_then` 패턴 감지 → "BDD (given_when_then)" `[추정]`
- 한글 백틱 테스트명 감지 → "한글 백틱" `[추정]`
- 일반 camelCase → "camelCase 서술" `[추정]`
- 테스트 파일 없음 → `[검수 필요]`

### s3: 커버리지 목표

- jacoco/kover 설정 존재 → 설정에서 추출한 목표값 `[확정]`
- 없음 → 일반 템플릿 ("중요한 비즈니스 로직 우선") `[검수 필요]`

### s4: CI 연동

- workflow 파일에 test step 감지 → 해당 설정 기술 `[확정]`
- CI 파일 없음 → `{TBD: CI 설정 없음}`

### s5: 사용 라이브러리 (자동)

`build.gradle(.kts)`, `libs.versions.toml`, `Podfile`, `Package.swift` 에서 감지된 테스트 관련 라이브러리 목록을 자동 추출한다 (JUnit, MockK, Turbine, Espresso, XCTest, Nimble, Quick 등). 부재 시 `{TBD: 감지된 라이브러리 없음}`.

## 출력 템플릿
```markdown
# 테스트 전략

## 검증 명령어 (work/bug-fix 루프의 단일 입력원 — 5종 포맷 고정)
- build:       {TBD: 프로젝트가 채움}
- lint:        {TBD: 프로젝트가 채움}
- unit:        {TBD: 프로젝트가 채움}
- integration: {TBD: 호스트 자동 — work 자동 루프 포함}
- e2e:         {TBD: 기기/시뮬레이터 — 사람 게이트, 수동 트리거}

## 테스트 레벨
{초안 텍스트} [추정]

## 네이밍 규칙
{초안 텍스트} [추정]

## 커버리지 목표
{초안 텍스트} [검수 필요]

## CI 연동
{초안 텍스트} [확정]

## 사용 라이브러리
{자동 스캔 결과} [확정]

## 통합/E2E 작성 규칙
- 경계 동작(cross-module behavior)을 실제로 단언할 것 (test-after 사각지대 가드)
- 호스트 자동 통합 (예) Android: JVM/Robolectric·in-memory / iOS: XCTest
- 기기/시뮬레이터 E2E (예) Android: Espresso/Maestro / iOS: XCUITest/Maestro
```
