# conventions 모듈

호출자 (`/harness-root`, `/harness-root-edit`) 가 Read tool 로 읽고 지침을 따른다. 사전 스캔 결과로 자동 초안을 생성하고 신뢰도 태깅한다.

> 산출물 `docs/CONVENTIONS.md` 는 `@docs/CONVENTIONS.md` 로 매 LLM call 자동 적재됨. 섹션이 부풀면 prefix cache_read 비용 누수.

## 대상 파일

`docs/CONVENTIONS.md`

## 사전 스캔

| 소스 | 용도 |
|------|------|
| `.editorconfig`, `detekt.yml`, `ktlint` 설정, `.swiftlint.yml`, `.swiftformat` | 린터/포맷터 감지 |
| 기존 모듈 내 interface/class 네이밍 샘플 | 네이밍 패턴 추출 |
| `sealed class Result`, `sealed interface Result` Grep | Result 패턴 감지 |
| `arrow-kt` 의존성 | Either 함수형 감지 |
| `Timber`, `Log.d`, `os_log`, `SwiftLog` Grep | 로깅 라이브러리 감지 |
| `git log --oneline -20` | 최근 커밋 메시지 패턴 |
| `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS` | PR 정책 단서 |
| `~/.claude/CLAUDE.md` | 존재 시 자동으로 초안 소스에 활용, 활용한 섹션은 `[추정]` 태깅 |

### 결과 형식

- 린터 종류 / 부재
- interface 네이밍 패턴 (접미사 없음 / I 접두사 / Impl 접미사)
- Result / Either 사용 여부
- 로깅 라이브러리
- 최근 커밋 패턴
- PR 정책 단서

## 섹션 목록

| 섹션 ID | 헤더 | 타입 |
|--------|-----|-----|
| s1 | `## 기본 코드 스타일 (≤7 줄)` | 자동 초안 |
| s2 | `## 에러 처리 (≤7 줄)` | 자동 초안 |
| s3 | `## 로깅 (≤5 줄)` | 자동 초안 |
| s4 | `## Claude 작업 스코프 (≤7 줄)` | 자동 초안 |
| s5 | `## 커밋 메시지 (≤5 줄)` | 자동 초안 |
| s6 | `## Push 정책 (≤5 줄)` | 자동 초안 |

## 신뢰도 판정 규칙

| 섹션 | 판정 |
|------|------|
| 기본 코드 스타일 | 린터 설정 존재 → `[확정]`, 패턴 매칭 → `[추정]`, 없음 → `[검수 필요]` |
| 에러 처리 | sealed Result/Either 감지 → `[확정]`, 없음 → `[검수 필요]` |
| 로깅 | Timber/Log.d 등 감지 → `[확정]`, 없음 → `[검수 필요]` |
| Claude 작업 스코프 | 코드로 알 수 없음 → 기본 템플릿 + `[검수 필요]` |
| 커밋 메시지 | git log 패턴 매칭 → `[추정]` |
| Push 정책 | CODEOWNERS/PR template 존재 → `[추정]`, 없음 → `[검수 필요]` |

## 초안 생성 로직

### s1: 기본 코드 스타일

- 린터 설정 감지 → 린터 종류 + 감지된 네이밍 패턴 기술 `[확정]`
- 패턴 매칭만 (린터 없음) → 감지된 패턴 기술 `[추정]`
- 둘 다 없음 → 일반 템플릿 `[검수 필요]`
- `~/.claude/CLAUDE.md` 에 코드 스타일 섹션 존재 시 → 해당 내용 반영 `[추정]`

### s2: 에러 처리

- sealed Result 감지 → "sealed Result<Success, Error> — 도메인 에러는 Result, 시스템 오류만 throw" `[확정]`
- arrow-kt Either 감지 → "Either<Error, Success> 함수형 접근" `[확정]`
- 둘 다 없음 → 일반 템플릿 ("try-catch 최소화, 경계 레이어에서만") `[검수 필요]`

### s3: 로깅

- Timber 감지 → "Timber only, Log.d 직접 호출 금지" `[확정]`
- os_log 감지 → "os_log + signpost" `[확정]`
- 없음 → 일반 템플릿 `[검수 필요]`

### s4: Claude 작업 스코프

코드로 판정 불가. 기본 템플릿 자동 적용:
- "요청한 파일 + 직접 호출자만 수정. 주변 리팩토링은 별도 PR" `[검수 필요]`

### s5: 커밋 메시지

- 최근 20 개 커밋에서 `feat:` / `fix:` 패턴 감지 → "Conventional Commits" `[추정]`
- 한글 커밋 패턴 → "한글 요약" `[추정]`
- 패턴 감지 안 됨 → "자유 형식" `[추정]`

### s6: Push 정책

- CODEOWNERS 존재 → "master/main 직접 push 금지, PR 필수" `[추정]`
- PR template 존재 → "PR 필수" `[추정]`
- 없음 → 일반 템플릿 `[검수 필요]`

## 출력 템플릿

각 섹션 헤더의 (≤N 줄) 은 본문 줄 수 soft cap. 초과 시 핵심만 남기고 압축한다.

````markdown
<!-- 이 파일은 ≤80 줄로 유지. 자동 적재 prefix 비용 절감. 초과 시 on-demand Read 파일로 위임. 모듈 CLAUDE.md 50 줄 cap 과 대칭. -->
# 팀 컨벤션

## 기본 코드 스타일 (≤7 줄)
{초안 텍스트} [확정]

## 에러 처리 (≤7 줄)
{초안 텍스트} [검수 필요]

## 로깅 (≤5 줄)
{초안 텍스트} [확정]

## Claude 작업 스코프 (≤7 줄)
{초안 텍스트} [검수 필요]

## 커밋 메시지 (≤5 줄)
{초안 텍스트} [추정]

## Push 정책 (≤5 줄)
{초안 텍스트} [검수 필요]
````
