import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const ROOT = new URL('..', import.meta.url).pathname;

// agents/ 는 tests/agent-contract.test.mjs 가 지킨다. 이 파일은 shared/scripts/ 쪽
// 대칭이다. deps.mjs 가 CLI 를 가진 채 호출자 없이 13번의 검토를 통과한 뒤 추가됐다.
function cliScripts(dir = ROOT + 'shared/scripts', out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) cliScripts(p, out);
    // CLI 진입점 가드가 있는 파일만 실행 주체를 요구한다. lib/ 아래 순수 모듈은
    // import 로만 쓰이므로 대상이 아니다.
    else if (p.endsWith('.mjs') && readFileSync(p, 'utf8').includes('process.argv[1]')) out.push(p);
  }
  return out;
}

function callerDocs(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) callerDocs(p, out);
    else if (p.endsWith('.md')) out.push(p);
  }
  return out;
}

// README 는 산출물 목록을 설명할 뿐 실행 주체가 아니다. 호출자로 치지 않는다.
function callerTexts() {
  const files = [
    ...callerDocs(ROOT + 'skills'),
    ...callerDocs(ROOT + 'agents'),
    ...readdirSync(ROOT + 'shared')
      .filter((f) => f.endsWith('.md'))
      .map((f) => ROOT + 'shared/' + f),
  ];
  return files.map((f) => readFileSync(f, 'utf8'));
}

test('CLI 진입점을 가진 스크립트가 최소 한 스킬·에이전트에서 호출된다', () => {
  const scripts = cliScripts();
  assert.ok(scripts.length > 0, 'shared/scripts/ 에서 CLI 스크립트를 하나도 찾지 못했다');

  const texts = callerTexts();
  assert.ok(texts.length > 0, 'skills/·agents/ 에서 문서를 하나도 찾지 못했다');

  const orphans = scripts
    .map((p) => p.slice(ROOT.length))
    .filter((rel) => !texts.some((text) => text.includes(rel)));

  assert.deepEqual(orphans, [], `호출자 없는 유령 스크립트: ${orphans.join(', ')}`);
});
