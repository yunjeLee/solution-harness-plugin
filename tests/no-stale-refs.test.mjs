import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const ROOT = new URL('..', import.meta.url).pathname;

// 스캔 대상을 명시적으로 한정한다. 레포 전체를 훑으면 docs/ 아래의 설계 스펙 문서가
// 이 문자열을 정당하게 언급하므로 항상 실패한다(docs/ 는 .gitignore 대상이지만
// 파일시스템에는 존재한다). tests/ 도 제외한다 — 이 파일 자신이 금지어를 담는다.
const SCAN = ['skills', 'agents', 'hooks', 'shared', '.claude-plugin', 'README.md'];

// 금지 패턴은 네임스페이스 없는 형태로 둔다. 정확 문자열
// 'superpowers:test-driven-development' 만 막으면 work 0단계의
// '(brainstorming/test-driven-development)' 표기를 못 잡고 초록불이 된다.
// 그 줄이 살아 있으면 superpowers 미설치 시 work 가 통째로 멈춘다.
const FORBIDDEN = 'test-driven-development';

function walk(p, out = []) {
  if (statSync(p).isDirectory()) {
    for (const entry of readdirSync(p)) walk(join(p, entry), out);
  } else if (/\.(md|sh|js|mjs|json)$/.test(p)) {
    out.push(p);
  }
  return out;
}

test('superpowers TDD 스킬 참조가 남아 있지 않다', () => {
  const files = SCAN.flatMap((rel) => walk(ROOT + rel));
  assert.ok(files.length > 0, '스캔 대상 파일을 하나도 찾지 못했다 — SCAN 경로가 레포와 어긋났다');

  const hits = [];
  for (const file of files) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (line.includes(FORBIDDEN)) hits.push(`${file.slice(ROOT.length)}:${i + 1}`);
      });
  }
  assert.deepEqual(hits, [], `'${FORBIDDEN}' 잔존 참조 ${hits.length}건:\n${hits.join('\n')}`);
});

test('unit-test 스킬이 존재하고 이름이 일치한다', () => {
  const md = readFileSync(ROOT + 'skills/unit-test/SKILL.md', 'utf8');
  assert.match(md, /^name: unit-test$/m, 'frontmatter name 이 unit-test 가 아니다');
});
