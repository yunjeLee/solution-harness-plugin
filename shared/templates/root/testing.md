# TESTING.md 템플릿 (≤80줄)

`docs/rules/TESTING.md` 는 지식 문서가 아니라 **기계가 읽는 설정**이다. `work` · `unit-test` · `integration-test` · `e2e-test` · `test-writer` 5곳이 여기서 값을 읽는다.

## 담는 것 4가지

| 섹션 | 출처 | 비고 |
|---|---|---|
| 검증 명령어 | 빌드 파일 스캔 | **5종 포맷 고정** — build / lint / unit / integration / e2e |
| 네이밍 규칙 | 기존 테스트 파일 스캔 | `unit-test` 가 읽는다 |
| 사용 라이브러리 | 의존성 매니페스트 스캔 | `test-writer` 가 읽는다. **없는 것도 적는다**(예: mock 라이브러리 없음 → fake 로 작성) |
| 통합/E2E 작성 규칙 | 인터뷰 | `integration-test` · `e2e-test` 가 읽는다 |

## 담지 않는 것

- 테스트 레벨 — `harness.config.yml` 소관이다.
- 커버리지 목표 — 설정이 없으면 목표도 없다.
- CI 연동 — 워크플로우 파일이 진실이다.

## 출력 골격

```markdown
# 테스트 전략

## 검증 명령어 (work/bug-fix 루프의 단일 입력원 — 5종 포맷 고정)
- build:       {명령}
- lint:        {명령}
- unit:        {명령}
- integration: {명령}
- e2e:         {명령 또는 "사람 게이트, 수동 트리거"}

## 네이밍 규칙
{파일명 접미사 · 함수명 형식}

## 사용 라이브러리
{unit / instrumented 각각. 없는 라이브러리와 그 대안도 적는다}

## 통합/E2E 작성 규칙
{경계 단언 규칙 · 호스트 자동화 도구 · 기기 E2E 도구}
```
