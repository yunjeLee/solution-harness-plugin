# session 모듈

harness-root / harness-root-edit 가 Read 해 지침을 따른다. 대부분 정적 템플릿.

## 대상 파일
`docs/SESSION.md` (자동 적재 — 짧게 유지)

## 사전 스캔
| 소스 | 용도 |
|------|------|
| `docs/rules/TESTING.md` 검증명령어 | 세션 종료 시 실행할 명령 존재 확인 |
| `.harness/runs/` 디렉토리 | 진행 추적 run 파일 규칙 반영 |

## 섹션 목록
| 섹션 ID | 헤더 | 타입 |
|--------|-----|-----|
| s1 | `## 세션 원칙` | 정적 |
| s2 | `## 세션 시작` | 정적 |
| s3 | `## 세션 종료` | 정적 |
| s4 | `## 진행 추적` | 정적(solution 고유) |

## 초안 생성 로직
s1~s4 모두 아래 출력템플릿을 그대로 기록(정적). 태그 없음. **s4 는 solution 의 `.harness/runs/` 규칙을 반드시 포함** — work 0.5 재개점검이 이 규칙에 의존.

## 출력 템플릿
```markdown
<!-- 이 파일은 ≤80 줄로 유지. 자동 적재 — 산문 금지, 짧은 규칙 목록만. -->
# 세션 규칙

## 세션 원칙
- 한 세션 = 한 기능(WIP=1) 권장
- 완료 정의 = docs/rules/TESTING.md 검증명령어 전체 통과 + 최종 commit

## 세션 시작
1. 미완료 run 점검: `.harness/runs/run-*.md` 중 완료기준 마커 블록에 남은 `- [ ]` 가 있으면 → 재개 제안
2. `git status` / `git log --oneline -5`
3. 이상 있으면 새 작업 전 먼저 해결

## 세션 종료
1. docs/rules/TESTING.md 검증명령어 실행 (`{TBD}` 항목은 건너뜀)
2. 실패 시 수정 후 재검증 — 전부 통과까지
3. 활성 run 파일 갱신 → 최종 commit

## 진행 추적
- 파일: `.harness/runs/run-{KST날짜-시간-요구slug}.md` (id 예: `run-20260714-1430-payment-refund`)
- 미완료 판정 = 완료기준 마커(`<!-- COMPLETION-CRITERIA:START/END -->`) 블록 안에 남은 `- [ ]` 존재
```
