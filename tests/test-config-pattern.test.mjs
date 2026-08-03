import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { after } from 'node:test';

const ROOT = new URL('..', import.meta.url).pathname;
const LEVELS_DOC = ROOT + 'shared/test-levels.md';

// shared/test-levels.md 의 ```regex 펜스가 판정 패턴의 단일 출처다.
// 문서에 나온 순서대로 3-0(형식 위반) · 3-1(레벨 ON) · 3-2(값 존재) 세 개여야 한다.
// 3-3(none 혼용)은 3-1 을 두 번 적용하는 것이라 자기 펜스를 갖지 않는다.
// 개수가 3 이 아니면 조용히 부분 통과하지 말고 실패해야 한다.
function loadPatterns() {
  const md = readFileSync(LEVELS_DOC, 'utf8');
  const found = [...md.matchAll(/```regex\n([\s\S]*?)```/g)].map((m) => m[1].trim());
  assert.equal(
    found.length,
    3,
    `shared/test-levels.md 의 \`\`\`regex 펜스가 3개가 아니다 (${found.length}개)`,
  );
  return { MALFORMED: found[0], LEVEL: found[1], PRESENT: found[2] };
}

const P = loadPatterns();

// 정규식을 JS 로 흉내내면 bash 의 실제 동작과 어긋난다. 실제 grep 을 구동한다.
function grepMatches(pattern, line) {
  const r = spawnSync('grep', ['-Eq', pattern], { input: line });
  if (r.status > 1) throw new Error(`grep 실행 실패: ${r.stderr}`);
  return r.status === 0;
}

// 전처리: 파일에서 첫 test.levels 줄만 취한다(중복 키는 먼저 나온 줄만 유효).
// 매치가 없으면(파일 없음 / 키 없음) null.
function firstLine(file) {
  const r = spawnSync('grep', ['-m1', '^test\\.levels:', file]);
  return r.status === 0 ? r.stdout.toString().replace(/\n$/, '') : null;
}

// 실행 순서: 전처리 → 3-0 → 3-2 게이트 → 3-3 → 3-1.
// 문서 §3 의 서술 순서(3-0 → 3-1 → 3-2 → 3-3)와 다르지만 결과는 동치다 — 3-1(`on`)은
// 여기서 정의만 하고 지연 평가되며, 3-2(PRESENT)가 거짓이면 값이 비었거나 주석뿐이라
// 3-1 도 반드시 거짓이기 때문이다. 문서가 요구한 유일한 순서 제약("3-3 은 3-1 뒤")은 지켜진다.
function judge(file, level) {
  const line = firstLine(file);
  if (line === null) return 'DEFAULT';
  if (grepMatches(P.MALFORMED, line)) return 'MALFORMED';
  const on = (lv) => grepMatches(P.LEVEL.replace('<레벨>', lv), line);
  if (!grepMatches(P.PRESENT, line)) return 'DEFAULT';
  if (on('none') && ['unit', 'integration', 'ui'].some((lv) => on(lv))) return 'CONFLICT';
  return on(level) ? 'ON' : 'OFF';
}

const DIR = mkdtempSync(join(tmpdir(), 'harness-test-levels-'));
after(() => rmSync(DIR, { recursive: true, force: true }));

let seq = 0;
function writeConfig(content) {
  const f = join(DIR, `cfg-${seq++}.yml`);
  writeFileSync(f, content);
  return f;
}

const CASES = [
  { name: 'ui 켜짐', content: 'test.levels: unit, integration, ui\n', level: 'ui', expect: 'ON' },
  { name: '주석 뒤는 안 본다', content: 'test.levels: unit  # no ui\n', level: 'ui', expect: 'OFF' },
  { name: '부분 일치 없음 (uiflow)', content: 'test.levels: uiflow\n', level: 'ui', expect: 'OFF' },
  { name: '콜론 뒤 공백 누락', content: 'test.levels:unit\n', level: 'unit', expect: 'MALFORMED' },
  { name: '콜론 뒤 공백 누락 + 다중값', content: 'test.levels:unit, ui\n', level: 'ui', expect: 'MALFORMED' },
  { name: '키 없음', content: '# 아무 설정 없음\n', level: 'unit', expect: 'DEFAULT' },
  { name: '값이 비어 있음', content: 'test.levels:\n', level: 'unit', expect: 'DEFAULT' },
  { name: 'none 단독 — none 은 켜짐', content: 'test.levels: none\n', level: 'none', expect: 'ON' },
  { name: 'none 단독 — unit 은 꺼짐', content: 'test.levels: none\n', level: 'unit', expect: 'OFF' },
  { name: 'none 혼용', content: 'test.levels: none, unit\n', level: 'unit', expect: 'CONFLICT' },
  { name: '들여쓰기는 형식 밖 → 기본값', content: '  test.levels: none\n', level: 'unit', expect: 'DEFAULT' },
  {
    name: '중복 키 — 먼저 나온 줄만 유효',
    content: 'test.levels: unit\ntest.levels: unit, ui\n',
    level: 'ui',
    expect: 'OFF',
  },
];

for (const c of CASES) {
  test(`판정: ${c.name}`, () => {
    assert.equal(judge(writeConfig(c.content), c.level), c.expect);
  });
}

test('판정: 파일 자체가 없으면 기본값', () => {
  assert.equal(judge(join(DIR, 'does-not-exist.yml'), 'unit'), 'DEFAULT');
});

test('shared/test-levels.md 가 판정 패턴 3개를 정의한다', () => {
  const p = loadPatterns();
  assert.match(p.LEVEL, /<레벨>/, '3-1 패턴에 <레벨> 플레이스홀더가 없다');
  assert.match(p.MALFORMED, /^\^test/, '3-0 패턴이 ^test 앵커로 시작하지 않는다');
  assert.match(p.PRESENT, /^\^test/, '3-2 패턴이 ^test 앵커로 시작하지 않는다');
});
