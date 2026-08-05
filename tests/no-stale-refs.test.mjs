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

test('test-level 스킬이 존재하고 이름이 일치한다', () => {
  const md = readFileSync(ROOT + 'skills/test-level/SKILL.md', 'utf8');
  assert.match(md, /^name: test-level$/m, 'frontmatter name 이 test-level 이 아니다');
});

// 판정 규칙은 shared/test-levels.md 가 단일 출처다. 스킬이 정규식을 복사하면
// 규칙이 갈라져도 아무도 모른다 — 문자열 수준에서 복사를 금지한다.
test('test-level 스킬이 판정 규칙을 복사하지 않는다', () => {
  const md = readFileSync(ROOT + 'skills/test-level/SKILL.md', 'utf8');
  assert.doesNotMatch(md, /```regex/, '판정 정규식 펜스를 본문에 복사했다');
  assert.doesNotMatch(md, /\[\[:space:\],\]/, '판정 정규식 조각을 본문에 복사했다');
});

test('README 스킬 표에 test-level 행이 있다', () => {
  const md = readFileSync(ROOT + 'README.md', 'utf8');
  assert.match(md, /^\| `test-level` \|/m, 'README 스킬 표에 test-level 행이 없다');
});

// 설정 파일 생성 창구는 정확히 2곳이어야 한다(shared/test-levels.md §2).
// 세 테스트 스킬이 생성에 가담하면 "누가 만들었는지"를 추적할 수 없다.
test('harness.config.yml 생성 창구는 work 와 test-level 둘뿐이다', () => {
  const MARK = '§2 생성 템플릿';
  const has = (p) => readFileSync(ROOT + p, 'utf8').includes(MARK);

  assert.ok(has('skills/work/SKILL.md'), 'work 1.5 에 생성 게이트가 없다');
  assert.ok(has('skills/test-level/SKILL.md'), 'test-level 에 생성 절차가 없다');

  for (const p of [
    'skills/unit-test/SKILL.md',
    'skills/integration-test/SKILL.md',
    'skills/e2e-test/SKILL.md',
  ]) {
    assert.ok(!has(p), `${p} 가 설정 파일을 생성하려 한다 — 창구는 2곳이어야 한다`);
  }
});
