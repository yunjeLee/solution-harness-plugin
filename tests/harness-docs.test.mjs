import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(ROOT + p, 'utf8');

test('root 템플릿은 claude-md 와 testing 둘뿐이다', () => {
  assert.deepEqual(readdirSync(ROOT + 'shared/templates/root').sort(), [
    'claude-md.md',
    'testing.md',
  ]);
});

test('root-docs 인덱스가 삭제됐다', () => {
  assert.ok(!existsSync(ROOT + 'shared/templates/root-docs.md'));
});

test('gotcha 템플릿에 4섹션이 있다', () => {
  const md = read('shared/templates/gotcha.md');
  for (const s of ['과도기', '죽은 것', '하지 마라', '팀 규칙']) {
    assert.ok(md.includes(s), `${s} 섹션이 없다`);
  }
  assert.match(md, /60줄/, '상한이 기재돼 있지 않다');
});

test('module 템플릿은 2섹션만 남는다', () => {
  const md = read('shared/templates/module-claude.md');
  assert.ok(md.includes('하지 마라'));
  assert.ok(md.includes('암묵 규칙'));
  // 현재 파일의 실제 문자열을 금지어로 쓴다. 실측: 6줄 `- **역할**:`, 8줄 `- **의존성**`.
  // `## 역할` 처럼 원본에 없던 형태를 금지하면 가드가 공회전해 드리프트를 못 잡는다.
  for (const banned of ['- **역할**', '- **의존성**', '상위 묶음 모듈']) {
    assert.ok(!md.includes(banned), `${banned} 가 남아 있다`);
  }
});

test('claude-md 템플릿의 자동 적재는 GOTCHA 한 줄이다', () => {
  const md = read('shared/templates/root/claude-md.md');
  assert.match(md, /@docs\/GOTCHA\.md/);
  for (const gone of ['ARCHITECTURE.md', 'CONVENTIONS.md', 'SESSION.md']) {
    assert.ok(!md.includes(gone), `${gone} 참조가 남아 있다`);
  }
});

// 신뢰도 태그는 전면 폐지다(spec 결정 3).
test('태그를 생성하는 자리에 신뢰도 태그가 없다', () => {
  // 스캔 대상은 **문서를 만들어내는** 템플릿뿐이다. agents/harness-scout.md 는
  // 구문서에 남은 태그를 입력으로 읽어야 해서 그 이름을 본문에 적는다 — 생성이 아니라 소비다.
  const scan = ['shared/templates'];
  const walk = (d, out = []) => {
    for (const e of readdirSync(ROOT + d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`;
      if (e.isDirectory()) walk(p, out);
      else if (p.endsWith('.md')) out.push(p);
    }
    return out;
  };
  const hits = [];
  for (const f of scan.flatMap((d) => walk(d))) {
    const t = read(f);
    for (const tag of ['[확정]', '[추정]', '[검수 필요]', '{TBD']) {
      if (t.includes(tag)) hits.push(`${f} :: ${tag}`);
    }
  }
  assert.deepEqual(hits, [], `신뢰도 태그 잔존:\n${hits.join('\n')}`);
});

test('interview 문서에 신호 8종과 진행 규칙이 있다', () => {
  const md = read('shared/interview.md');
  for (const kind of ['unused', 'deprecated', 'hack', 'reversed', 'orphan', 'untested', 'moved']) {
    assert.ok(md.includes(kind), `신호 ${kind} 가 없다`);
  }
  assert.ok(md.includes('같은 역할이 둘'), '에이전트 담당 8번째 신호가 없다');
  assert.match(md, /8문항/, '라운드 크기가 없다');
  assert.ok(md.includes('상') && md.includes('중') && md.includes('하'), '등급 3종이 없다');
  assert.match(md, /기본값.*중단|중단.*기본값/, '중단 기본값 규칙이 없다');
  assert.match(md, /interview-log\.json/, '재질문 방지 기록이 없다');
});

// 스킬이 아니라 참조 문서다. SKILL.md 가 되면 / 목록에 노출된다.
test('interview 는 스킬이 아니다', () => {
  assert.ok(!existsSync(ROOT + 'skills/harness-interview'));
  assert.ok(!existsSync(ROOT + 'skills/interview'));
});

test('harness-scout 이 harness-read-write 를 대체했다', () => {
  assert.ok(!existsSync(ROOT + 'agents/harness-read-write.md'));
  assert.ok(existsSync(ROOT + 'agents/harness-scout.md'));
});

// 문서를 쓰지 않는 에이전트다. Write/Edit 이 남으면 코드 요약 생성이 되살아난다.
test('harness-scout 은 Write·Edit 도구가 없다', () => {
  const tools = read('agents/harness-scout.md').match(/^tools:.*$/m)[0];
  assert.ok(!/\bWrite\b/.test(tools), `tools 에 Write 가 있다: ${tools}`);
  assert.ok(!/\bEdit\b/.test(tools), `tools 에 Edit 가 있다: ${tools}`);
});

test('harness-scout 에 mode 2종이 있다', () => {
  const md = read('agents/harness-scout.md');
  assert.ok(md.includes('interview'));
  assert.ok(md.includes('extract'));
});

test('검증 에이전트가 3축이다', () => {
  const md = read('agents/harness-doc-verifier.md');
  for (const keep of ['모호성', '일관성', '참조 무결성']) assert.ok(md.includes(keep));
  // 완전성은 "답이 없으면 안 쓴다"와 충돌해 폐기됐다. 압축도·실상일치는 스크립트로 갔다.
  assert.ok(!md.includes('완전성'), '완전성 축이 남아 있다');
  assert.ok(!md.includes('압축도'), '압축도 축이 남아 있다');
});

test('plan-reviewer 의 대조 대상이 교체됐다', () => {
  const md = read('agents/plan-reviewer.md');
  assert.ok(md.includes('docs/GOTCHA.md'));
  assert.ok(!md.includes('CONVENTIONS'), 'CONVENTIONS 참조가 남아 있다');
  assert.ok(!md.includes('ARCHITECTURE'), 'ARCHITECTURE 참조가 남아 있다');
});
