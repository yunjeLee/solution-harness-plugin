---
name: harness-verify
description: "하네스 문서를 3축 기준으로 검증 agent에 위임하고, 수정 제안과 '수정할거냐' 게이트를 제공한다. /harness-verify, 하네스 검증, 문서 검증, 6축 점검 요청 시 사용한다. 인자 없음."
model: opus
---

# harness-verify — 하네스 문서 검증 (root / module 공용)

## 트리거
- `/harness-verify` — 하네스 문서 전체 검증

## 절차
1. **스크립트 2축 먼저**: `node ${CLAUDE_PLUGIN_ROOT}/shared/scripts/verify-docs.mjs {레포루트}` 를 실행한다. 앵커 생존(`DEAD`)과 줄 수(`CAP`) 위반을 얻는다. 인자를 받지 않는다 — 대상은 하네스 문서 전체다.

2. **위임**: `harness-doc-verifier` 에이전트에 (대상, 문서 경로 목록, 레포 루트)를 전달해 6축 검증.

3. **결과 제시**: 축별 문제 + 구체적 수정 문안 + 심각도(block/warn/nit)를 보여준다.

4. **게이트**: "이대로 수정할까요?" 를 묻는다. **수정 여부 선택은 사람이.** 자동 수정하지 않는다.
   - 수정 동의 시 → `gotcha` 로 연결.

## 검증 6축 (agent 기준)
모호성 · 일관성 · 완전성 · 참조 무결성 · **레포 실상 일치** ⭐ · 압축도

## 원칙
- 검증과 수정을 분리한다. 검증 agent 는 진단만, 수정은 사람 게이트 후 edit 스킬.
