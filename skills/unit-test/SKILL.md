---
name: unit-test
description: "한 모듈 안의 단위 테스트를 작성할 때 사용한다(test-first). 'ViewModel 테스트', 'UseCase 단위 테스트', 'Mapper 변환 검증', 'StateFlow 상태 전이 테스트' 처럼 단일 클래스·함수의 동작을 단언하는 테스트를 요청하면 사용한다. work 6b 에서 자동 호출된다. 단, 모듈 경계를 넘는 경계 테스트(→ integration-test)나 화면을 조작하는 UI 테스트(→ e2e-test)는 이 스킬이 아니다. 테스트를 실행하지는 않는다 — 작성만 한다(실행은 completion-verifier)."
model: opus
---

# unit-test — 한 모듈 안 단위 테스트 작성 (test-first)

한 모듈 안의 **단일 클래스·함수**가 무엇을 하는지 단언하는 테스트 *코드를 작성*한다. 돌리지는 않는다.
모듈 경계 밖은 `integration-test`, 화면 조작은 `e2e-test` 소관이다.

## 강제 법칙

> **테스트를 먼저 쓴다. 상태와 계약을 단언하라. "안 터짐"은 통과가 아니다.**

이 스킬은 프로덕션 코드가 **아직 없는 시점**에 호출된다(`work` 6b). 대상 클래스·메서드가 없어 컴파일이 안 되는 것이 정상이며, 그것이 `work` 6c 가 확인할 Red 다. "일단 컴파일되게" 만들려고 단언을 비우거나 대상을 바꾸지 않는다.

## 언제

- `work` 6b 에서 6a 가 도출한 3열 명세의 `unit` 행을 받아 호출될 때.
- 호출 = 무엇을 단언할지가 이미 정해졌다는 뜻. 이 스킬은 그 명세대로 작성한다.

## 책임 경계

| 한다 | 안 한다 |
|---|---|
| `test-writer` 에 **작성 위임** | 테스트 **실행** (→ 6c·7단계 `completion-verifier`) |
| 작성 파일·단언 요약을 run 파일에 기록 | 무엇을 단언할지 **도출** (→ `work` 6a) |
| 레벨 확인 · 그린필드 가드(규칙 비면 분기) | 프로덕션 코드 수정 (→ 메인 6d) |

## 절차

1. **레벨 확인**: 대상 프로젝트 루트 `harness.config.yml` 에 `shared/test-levels.md` §3 판정을 적용한다.
   - `unit` 이 꺼져 있으면 **작성하지 않고** `.harness/runs/run-{id}.md` 에 `unit-test: 생략 — unit 레벨 꺼짐` 을 기록하고 끝낸다.
   - `MALFORMED` / `CONFLICT` → 사람에게 되묻고 진행하지 않는다.
   - `work` 경로에서는 1.5·6a 가 이미 걸러 호출하지 않는다. 이 확인은 **사람이 이 스킬을 직접 호출한 경우**를 위한 것이다.

2. **규칙 로드**: `@docs/rules/TESTING.md` 에서 unit 테스트 도구/명령/네이밍을 읽는다(단일 출처).
   - ⚠️ **그린필드 가드**: unit 테스트 도구·작성 규칙이 비어 있으면 → 작성을 멈추고 `/harness-root`(또는 `/harness-root-edit testing`) 로 분기해 테스트 스택을 먼저 확정한다. (빈 규칙이 입력 되는 걸 차단)

3. **작성 위임**: `work` 6a 가 도출한 3열 명세(파일 / 레벨 / 단언할 것)의 `unit` 행을 **`test-writer` 에이전트**에 전달한다.
   - 함께 전달: 허용 레벨(1.5 확정값) · run-id · `docs/rules/TESTING.md` 경로.
   - **무엇을 단언할지는 이 스킬이 정하지 않는다** — `work` 6a 가 도출한다. 이 스킬은 명세를 그대로 넘기는 통로다.
   - ⚠️ **재작성 모드 (pass-through)**: `test-reviewer` 위반 목록을 함께 받았으면(6c 재시도 · 6.7 `fix-tests`) **원 명세와 위반 목록을 둘 다 그대로** `test-writer` 에 넘긴다. **요약·가공하지 않는다.** 위반 목록을 빠뜨리면 같은 입력 → 같은 출력이 되어 재시도가 2회를 헛돌고 사람에게 넘어가는 것이 기본 경로가 된다.

4. **실행 안 함**: 작성만 한다. Red 확인은 `work` 6c, 최종 통과 확인은 `work` 7단계 `completion-verifier` 가 한다. 여기서 직접 돌려 메인 컨텍스트를 오염시키지 않는다.

5. **기록**: `test-writer` 가 보고한 작성 파일 + **파일별 단언 요약 1줄**을 `.harness/runs/run-{id}.md` 에 남긴다. (`bug-fix` 가 테스트 내용을 모르므로 이 요약이 유일한 맥락이다)

> 무엇을 단언할지는 `work` 6a 가 도출한다. 세 테스트 스킬(`unit-test` / `integration-test` / `e2e-test`)은 모두 명세를 `test-writer` 에 넘기는 **통로**이며, 스킬이 단언을 설계하지 않는다.

## 단언 예시 (무엇이 "상태·계약을 단언"인가)

로그인 ViewModel 의 실패 처리를 예로 든다. 핵심은 **상태 전이와 계약**을 잡는 것이다.

**약한 단언 (이건 unit 테스트가 아니다):**
```kotlin
// 호출되고 안 터졌다 — 실패했을 때 무엇이 되는지 모른다
viewModel.login("a@b.com", "wrong")
assertNotNull(viewModel.state.value)
```

**상태·계약을 단언 (이게 unit 테스트다):**
```kotlin
// 실패 시 어떤 상태로 "전이하는가" 와 그 상태가 무엇을 담는가를 단언
fakeRepository.willFailWith(AuthError.InvalidCredentials)

viewModel.login("a@b.com", "wrong")

val state = viewModel.state.value
assertIs<LoginState.Error>(state)
assertEquals(AuthError.InvalidCredentials, state.cause)   // 원인이 보존되는가
assertFalse(state.isSubmitEnabled)                        // 재시도 게이트 계약
```

차이의 핵심: "무엇이 됐는가"(상태)와 "무엇을 약속하는가"(계약)를 단언한다. 구현의 계산식을 그대로 베껴 단언하면 구현이 틀려도 같이 틀린다.

## 가드

- 프로덕션 코드가 없어서 컴파일이 안 되는 것은 **정상**이다. 단언을 비우거나 대상을 바꿔 컴파일을 통과시키지 않는다.
- 모듈 경계가 끼면 그건 `integration`, Robolectric 이 필요하면 그건 `ui` 다 (`shared/test-levels.md` §1). 레벨을 넘는 테스트를 이 스킬에서 쓰지 않는다.
- 단언 없는 unit 테스트는 작성한 게 아니다. `work` 6c 에서 **통과해 버려** 비정상으로 걸린다.

## 원칙

- 스킬=통로, 에이전트=작성기(`test-writer`)·실행기(`completion-verifier`). 작성·실행·수정은 전부 위임된 책임이며 이 스킬은 손대지 않는다.
- 규칙은 `TESTING.md` 단일 출처. 도구/명령/네이밍을 여기 하드코딩하지 않는다.
- 레벨 정의·판정은 `shared/test-levels.md` 단일 출처. 여기 복사하지 않는다.
