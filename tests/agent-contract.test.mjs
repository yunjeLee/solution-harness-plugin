import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const ROOT = new URL('..', import.meta.url).pathname;

// 기존 tests/agent-type-prefix.test.mjs 는 워크플로우 JS 안의 'namespace:harness-*'
// 리터럴만 긁는다. test-writer/test-reviewer 는 JS 에서 호출되지 않고 이름도
// harness- 로 시작하지 않아 그 테스트로는 확장할 수 없다. 그래서 별도 계약 테스트다.
function agentNames() {
  return readdirSync(ROOT + 'agents')
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.slice(0, -'.md'.length));
}

function skillDocs(dir = ROOT + 'skills', out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) skillDocs(p, out);
    else if (p.endsWith('.md')) out.push(p);
  }
  return out;
}

test('agents/*.md 의 frontmatter name 이 파일명과 일치한다', () => {
  const names = agentNames();
  assert.ok(names.length > 0, 'agents/ 에서 에이전트를 하나도 찾지 못했다');

  for (const name of names) {
    const md = readFileSync(`${ROOT}agents/${name}.md`, 'utf8');
    const m = md.match(/^name:\s*(\S+)\s*$/m);
    assert.ok(m, `agents/${name}.md 에 frontmatter name 이 없다`);
    assert.equal(m[1], name, `agents/${name}.md 의 name 이 파일명과 다르다`);
  }
});

// 추출 방향을 한쪽으로 고정한다. agents/ 디렉토리를 진실로 삼고 스킬 본문에서 찾는다.
// 반대 방향(스킬 본문의 백틱 토큰을 전부 긁기)은 superpowers:brainstorming ·
// harness-check 같은 스킬명에 오탐한다.
test('모든 에이전트가 최소 한 스킬에서 호출된다', () => {
  const docs = skillDocs().map((f) => readFileSync(f, 'utf8'));
  assert.ok(docs.length > 0, 'skills/ 에서 SKILL 문서를 하나도 찾지 못했다');

  const orphans = agentNames().filter((name) => !docs.some((text) => text.includes(name)));
  assert.deepEqual(orphans, [], `호출자 없는 유령 에이전트: ${orphans.join(', ')}`);
});

test('테스트 3층 에이전트가 존재한다', () => {
  const names = agentNames();
  for (const required of ['test-writer', 'test-reviewer', 'completion-verifier']) {
    assert.ok(names.includes(required), `agents/${required}.md 가 없다`);
  }
});
