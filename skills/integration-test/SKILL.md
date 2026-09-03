---
name: integration-test
description: "모듈과 모듈 사이 경계를 검증하는 통합 테스트 코드를 작성할 때 사용한다(test-after). 'A 모듈과 B 모듈 통합 테스트', 'repository 에서 api·datasource 호출하는 경계 테스트', 'DTO 가 도메인 모델로 매핑되는지 검증', 'api→repository→usecase 흐름 테스트', 'cross-module 테스트', 'Robolectric 으로 repository 통합' 처럼 두 모듈·컴포넌트가 연결되는 지점을 단언하는 테스트를 요청하면 사용한다. work 6.5 에서 변경이 모듈 경계를 가로지를 때 자동 호출된다. 단, 단일 클래스·함수의 단위 테스트(→ unit-test)나 화면을 눌러가는 사용자 플로우 E2E(→ e2e-test)는 이 스킬이 아니다. 테스트를 실행하지는 않는다 — 작성만 한다(실행은 completion-verifier)."
model: opus
---

# integration-test — 모듈 경계 통합 테스트 작성 (test-after)

`unit-test` 가 채우는 *한 모듈 안* sociable unit 밖, **모듈↔모듈 경계**를 단언하는 통합 테스트 *코드를 작성*한다. 돌리지는 않는다.

## 강제 법칙

> **경계를 넘는 데이터·계약을 단언하라. "크래시 안 남"은 통과가 아니다.**

mock 으로 경계를 막아 세우면 통합테스트가 아니다. 경계 양쪽의 real code 를 통과시켜, 실제로 건너가는 데이터·계약을 단언한다.

## 언제

- `work` 6.5 에서 이번 변경이 **모듈 경계를 가로질렀다**고 판단해 호출할 때.
- 호출 = 경계가 이미 식별됐다는 뜻. 이 스킬은 그 경계의 통합 테스트를 작성한다.

## 책임 경계

| 한다 | 안 한다 |
|---|---|
| `test-writer` 에 **작성 위임** | 테스트 **실행** (→ 6c·7단계 `completion-verifier`) |
| 작성 파일·단언 요약·대상 경계를 run 파일에 기록 | **무엇을 단언할지 도출** (→ `work` 6.5-A) / 실패 **수정** (→ work 의 bug-fix 루프) |
| 레벨 확인 · 그린필드 가드(규칙 비면 분기) | 필요 여부 **판단** (→ `work` 6.5) |

## 절차

1. **범위 탐지**: git diff·import 로 이번 변경이 가로지른 모듈 경계를 식별한다. 완료기준에 경계가 명시됐으면(예: "core·data 통합") 그걸 우선한다.

2. **레벨 확인**: 대상 프로젝트 루트 `harness.config.yml` 에 `shared/test-levels.md` §3 판정을 적용한다.
   - `integration` 이 꺼져 있으면 **작성하지 않고** `.harness/runs/run-{id}.md` 에 `integration-test: 생략 — integration 레벨 꺼짐` 을 기록하고 끝낸다.
   - `MALFORMED` / `CONFLICT` → 사람에게 되묻고 진행하지 않는다.
   - `work` 경로에서는 6.5-A 가 이미 걸러 호출하지 않는다. 이 확인은 **사람이 이 스킬을 직접 호출한 경우**를 위한 것이다.

3. **규칙 로드**: `@docs/rules/TESTING.md` 에서 통합테스트 도구/명령/네이밍을 읽는다(단일 출처).
   - ⚠️ **그린필드 가드**: 통합테스트 도구·작성 규칙이 비어 있으면 → 작성을 멈추고 `/harness-init` 로 분기해 테스트 스택을 먼저 확정한다. (빈 규칙이 입력 되는 걸 차단)

4. **작성 위임**: `work` 6.5-A 가 도출한 3열 명세(파일 / 레벨 / 단언할 것)의 `integration` 행을 **`test-writer` 에이전트**에 전달한다.
   - 함께 전달: 허용 레벨(1.5 확정값) · run-id · `docs/rules/TESTING.md` 경로 · 아래 경계 제약.
   - **무엇을 단언할지는 이 스킬이 정하지 않는다** — `work` 6.5-A 가 도출한다. 이 스킬은 명세를 그대로 넘기는 통로다.
   - 함께 넘기는 경계 제약:
     - **real code 우선, mock 최소.** 경계 양쪽을 실제로 통과시키고 fake 는 가장 바깥 끝단에만 둔다. mock 으로 경계를 막으면 경계를 건넜다는 것을 증명하지 못한다.
     - 호스트 자동 레벨(예: Android JVM/in-memory, iOS XCTest)로 작성한다. 기기/시뮬레이터가 필요한 플로우는 이 스킬이 아니라 `e2e-test` 소관이다.
     - ⚠️ **Robolectric 이 필요하면 `ui` 레벨이므로 이 스킬이 아니다.** `shared/test-levels.md` §1 의 경계 기준은 "Robolectric 없이 JVM 단독으로 도는가"다. `ui` 가 꺼져 있으면 아예 작성하지 않는다.
   - ⚠️ **재작성 모드 (pass-through)**: `test-reviewer` 위반 목록을 함께 받았으면(6.7 `fix-tests`) **원 명세와 위반 목록을 둘 다 그대로** `test-writer` 에 넘긴다. **요약·가공하지 않는다.** 위반 목록을 빠뜨리면 같은 입력 → 같은 출력이 되어 재시도가 2회를 헛돌고 사람에게 넘어가는 것이 기본 경로가 된다.

5. **실행 안 함**: 작성만 한다. 통과 확인은 7단계 `completion-verifier` 가 전체 스위트와 함께 격리 실행한다. 여기서 직접 돌려 메인 컨텍스트를 오염시키지 않는다.

6. **기록**: `test-writer` 가 보고한 작성 파일 + 파일별 단언 요약과 대상 경계를 `.harness/runs/run-{id}.md` 에 남긴다. (work 가 "integration-test: 호출" 로그와 함께 추적)

## 단언 예시 (무엇이 "경계를 단언"인가)

`repository ↔ remote(datasource)` 경계 변경을 예로 든다. 핵심은 "경계를 건너며 변환되는 것"을 잡는 것이다.

**약한 단언 (이건 통합 테스트가 아니다):**
```kotlin
// 그냥 호출되고 안 터졌다 — 경계에서 뭐가 깨지는지 못 잡는다
val result = repository.getUser(1)
assertNotNull(result)
```

**경계를 단언 (이게 통합 테스트다):**
```kotlin
// remote 의 DTO 가 repository 의 도메인 모델로 "건너가며" 제대로 매핑되는지 단언
// — 필드 매핑·null 처리·에러 전파는 경계에서만 깨진다
val dto = UserDto(id = 1, full_name = "Kim", deleted_at = null)
fakeRemote.enqueue(dto)

val user = repository.getUser(1)   // real repository + real mapper, fake 는 네트워크 끝단만

assertEquals(1, user.id)
assertEquals("Kim", user.name)     // full_name → name 매핑이 경계를 넘었는가
assertTrue(user.isActive)          // deleted_at == null → isActive 계약이 지켜졌는가
```

차이의 핵심: fake 를 **네트워크 끝단(가장 바깥)** 에만 두고, 그 안쪽 경계(mapper·repository)는 real code 로 통과시킨다. mock 으로 mapper 까지 막으면 "경계를 건넜다"를 증명하지 못한다.

## 가드

- test-after 사각지대 방지: "실행돼서 안 터졌다"가 아니라, 경계를 건너는 구체 데이터·계약을 **단언**해야 한다. 단언 없는 통합 테스트는 작성한 게 아니다.
- 범위 누수 방지: 이번 변경이 가로지르지 않은 경계까지 새로 쓰지 않는다(작성=변경분 한정). 안 건드린 경계의 회귀는 7단계 전체 실행이 잡는다.

## 원칙

- 스킬=통로, 에이전트=작성기(`test-writer`)·실행기(`completion-verifier`). 작성·실행·수정은 전부 위임된 책임이며 이 스킬은 손대지 않는다.
- 규칙은 `TESTING.md` 단일 출처. 도구/명령/네이밍을 여기 하드코딩하지 않는다.
