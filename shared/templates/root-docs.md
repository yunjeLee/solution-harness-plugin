# harness-root 문서 템플릿 — 인덱스 & 공통 규칙

harness-root / harness-root-edit / harness-update 가 문서를 생성·갱신할 때, 아래 per-doc 상세 템플릿을 Read 해 지침을 따른다. 이 파일은 **공통 규칙(태깅·폴더배치·cap)** 과 **per-doc 경로 인덱스**만 담는다.

> 폴더 규칙 — `docs/` 루트 = **자동 적재**(항상 `@` 로드), `docs/rules/` = **조건부 로딩**(트리거 시 Read). 트리거(언제 읽을지)는 항상 CLAUDE.md 안에만 둔다.

## 신뢰도 태깅 (4단계) — 모든 초안 항목에 1개 부착

| 태그 | 의미 | 판정 근거 |
|------|------|----------|
| `[확정]` | 코드로 검증됨 | build.gradle/Podfile/코드에 존재 확인 |
| `[추정]` | 간접 근거 | 패턴 매칭·README·git log |
| `[검수 필요]` | 일반 템플릿 초안 | 코드로 판정 불가, 사람 확인 필요 |
| `{TBD: 사유}` | 근거 없음 | 스캔 소스 부재. **반드시 중괄호** (verifier 완전성 검사가 `{TBD}` 를 grep) |

## per-doc 템플릿 인덱스

| 대상 문서 | 배치 | 템플릿 |
|----------|------|--------|
| docs/ARCHITECTURE.md | 자동적재 | `root/architecture.md` |
| docs/CONVENTIONS.md | 자동적재 | `root/conventions.md` |
| docs/SESSION.md | 자동적재 | `root/session.md` |
| docs/rules/PRD.md | 조건부 | `root/prd.md` |
| docs/rules/ADR.md | 조건부 | `root/adr.md` |
| docs/rules/TESTING.md | 조건부 | `root/testing.md` |
| docs/rules/UI_GUIDE.md | 조건부·선택 | `root/ui-guide.md` |
| CLAUDE.md | 루트 | `root/claude-md.md` |

## 공통 cap

- 자동적재 3종(ARCHITECTURE/CONVENTIONS/SESSION): 출력 최상단 `<!-- ≤80줄 유지 -->` 주석. 태그는 줄끝 인라인이라 줄 수 불변.
- 각 per-doc 템플릿의 "출력 템플릿" 블록이 실제 산출 문서의 골격이다.
