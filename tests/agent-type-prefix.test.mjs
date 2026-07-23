import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const ROOT = new URL('..', import.meta.url).pathname;

// 워크플로우 JS 는 agentType 을 문자열로 하드코딩한다(스크립트에 fs 접근이 없어 plugin.json 을
// 읽을 수 없다). 플러그인 이름이 바뀌면 이 상수들이 조용히 뒤처져 agent 해석이 실패하므로,
// plugin.json 의 name 과 일치하는지 여기서 못 박는다.
const WORKFLOW_SCRIPTS = [
  'skills/harness-update/script/harness-update.js',
  'skills/harness-module/script/harness-module-gen.js',
];

test('워크플로우 JS 의 agentType prefix 가 plugin.json name 과 일치한다', () => {
  const { name } = JSON.parse(readFileSync(ROOT + '.claude-plugin/plugin.json', 'utf8'));

  let checked = 0;
  for (const rel of WORKFLOW_SCRIPTS) {
    const src = readFileSync(ROOT + rel, 'utf8');
    for (const [, ns, agent] of src.matchAll(/'([\w-]+):(harness-[\w-]+)'/g)) {
      assert.equal(ns, name, `${rel}: agentType prefix 불일치 ('${ns}:${agent}')`);
      checked++;
    }
  }
  assert.ok(checked > 0, 'agentType 상수를 하나도 찾지 못했다 — 정규식이 코드와 어긋났다');
});
