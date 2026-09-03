---
name: harness-init
description: "하네스 문서를 만들고·기존 문서를 이관하고·갱신하는 단일 진입점. 스크립트로 기계 산출물을 만들고 인터뷰로 사람 지식을 받는다. /harness-init, 하네스 만들기, 하네스 초기화, 하네스 이관, 하네스 갱신 요청 시 사용한다. 코드를 읽어 문서를 생성하지 않는다."
model: opus
---

# harness-init — 하네스 구축·이관·갱신

**코드 요약을 만들지 않는다.** 기계 산출물은 스크립트가, 사람 지식은 인터뷰가 만든다.

## 트리거

- `/harness-init` — 대상 프로젝트 루트에서 실행

## 0. 모드 판정

`docs/GOTCHA.md` 존재 여부와 삭제 대상 문서 존재 여부로 **자동 판정한다. 사람이 모드를 고르지 않는다.**

삭제 대상 = `docs/SESSION.md` · `docs/ARCHITECTURE.md` · `docs/CONVENTIONS.md` · `docs/rules/PRD.md` · `docs/rules/ADR.md` · `docs/rules/UI_GUIDE.md` · `docs/rules/{app,core,data,feature}.md`

| GOTCHA | 삭제 대상 | 모드 | 절차 |
|:---:|:---:|---|---|
| 없음 | 없음 | **신규** | 3 → 4 |
| 없음 | 있음 | **이관** | 1 → 2 → 3 → 4 |
| 있음 | 있음 | **이관 미완** | 남은 구문서만 1 → 2, 이후 3 → 4 |
| 있음 | 없음 | **갱신** | 3 → 4 (인터뷰는 다음 라운드부터) |

판정 결과를 사람에게 1줄로 알린다.

## 1. 추출 (이관 모드)

1. `harness-scout` 에 `mode=extract`, 삭제 대상 문서 경로 목록, 레포 루트를 전달해 위임한다.
2. 돌아온 **채택 후보**를 목록으로 보여주고 사람이 체크하게 한다. **체크된 것만** `docs/GOTCHA.md` 에 쓴다.
3. 돌아온 **인터뷰 전환 질문**은 4단계 신호 목록에 합류시킨다.

## 2. 삭제 게이트 (이관 모드)

1. 삭제 대상 전체 목록을 **파일명 · 줄 수**와 함께 보여준다.
2. 복원 방법을 함께 보여준다 — `git show HEAD:<경로>`
3. 대상이 git 추적 대상이 아니면 **그 사실을 먼저 경고한다.**
4. **`삭제` 단어 입력을 받는다.** `y/N` 을 쓰지 않는다. 받기 전에는 지우지 않는다.
5. 승인 시 루트 문서를 삭제하고 모듈 `CLAUDE.md` 는 **파일째 삭제**한다.

백업을 따로 만들지 않는다. git 이 복원한다.

## 3. 스크립트 실행

```bash
node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/index-modules.mjs {레포루트} --write
```

- `docs/MODULE_MAP.md` 를 쓴다.
- 표준출력의 `## 조건부 로딩` 블록을 루트 `CLAUDE.md` 에 넣는다.
- **빈 `{module}/CLAUDE.md` 를 만들지 않는다.** 모듈 문서는 `gotcha` 가 기록할 때 생긴다.
- `docs/rules/TESTING.md` 가 없으면 `@${CLAUDE_PLUGIN_ROOT}/shared/templates/root/testing.md` 로 만든다. 검증 명령 5종은 빌드 파일을 읽어 채우고, 통합/E2E 작성 규칙은 4단계 인터뷰로 받는다.

## 4. 인터뷰

```bash
node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/signals.mjs {레포루트}
```

1. `.harness/interview-log.json` 이 있으면 거기 있는 `id` 를 신호 목록에서 뺀다.
2. `harness-scout` 에 `mode=interview`, 신호 JSON, 레포 루트를 전달해 위임한다.
3. 돌아온 질문을 **`@${CLAUDE_PLUGIN_ROOT}/shared/interview.md` 절차대로** 사람에게 묻는다.
4. 답변 직후 **즉시** 배치 위치에 기록한다. 인터뷰 종료를 기다리지 않는다.
5. 답한 `id` 를 `.harness/interview-log.json` 에 남긴다. "모름"도 답한 것으로 본다.

## 5. 멱등성 — 재실행이 사람 지식을 파괴하지 않는다

| 종류 | 파일 | 재실행 시 |
|---|---|---|
| 기계 산출물 | `docs/MODULE_MAP.md` · `CLAUDE.md` 의 `## 조건부 로딩` 블록 | **덮어쓴다** |
| 사람 지식 | `docs/GOTCHA.md` · `{module}/CLAUDE.md` · `CLAUDE.md` 의 `## CRITICAL` | **덮어쓰지 않는다. 추가만 한다** |

## 6. 검증과 사람 게이트

1. `/harness-verify` 를 호출한다.
2. 결과와 생성·변경 diff 를 보여주고 승인/반려를 받는다.

## 하지 않는 것

- 코드를 읽어 문서 내용을 생성하지 않는다.
- 빈 `{module}/CLAUDE.md` 를 만들지 않는다.
- 사람이 답하지 않은 항목을 추측으로 채우지 않는다.
- `삭제` 입력 없이 대상 레포의 문서를 지우지 않는다.
- `docs/rules/GIT_WORKFLOW.md` 를 생성하지 않는다. 존재하면 조건부 로딩에만 등록한다.
