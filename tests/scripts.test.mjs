import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as pjoin } from 'node:path';
import { discoverModules, accessorOf } from '../shared/scripts/lib/modules.mjs';
import { buildGraph } from '../shared/scripts/deps.mjs';
import { renderModuleMap, renderTriggers } from '../shared/scripts/index-modules.mjs';

const FIX = new URL('./fixtures/mini-repo/', import.meta.url).pathname;

test('Gradle settings 에서 모듈 2개를 찾는다', () => {
  const mods = discoverModules(FIX);
  assert.equal(mods.length, 2);
  assert.deepEqual(
    mods.map((m) => m.path).sort(),
    ['core/core_util', 'feature/feature_home'],
  );
});

test('id 를 폴더 경로로 옮긴다', () => {
  const m = discoverModules(FIX).find((x) => x.id === ':core:core_util');
  assert.equal(m.path, 'core/core_util');
});

// 타입세이프 액세서(projects.core.coreUtil)와 문자열 표기(project(":core:core_util"))를
// 둘 다 해석해야 한다. 하나만 지원하면 실제 레포에서 의존성이 통째로 비어 나온다.
test('타입세이프 액세서 의존성을 해석한다', () => {
  const home = discoverModules(FIX).find((x) => x.id === ':feature:feature_home');
  assert.deepEqual(home.deps, [':core:core_util']);
});

test('의존성이 없는 모듈은 빈 배열이다', () => {
  const util = discoverModules(FIX).find((x) => x.id === ':core:core_util');
  assert.deepEqual(util.deps, []);
});

test('accessorOf 가 언더스코어를 카멜로 바꾼다', () => {
  // dalla 실측으로 확인된 규칙이다 — settings 의 ":core:core_util" 에 대응하는
  // build.gradle.kts 의 액세서가 projects.core.coreUtil 이다(단일 언더스코어만 카멜로).
  assert.equal(accessorOf(':core:core_util'), 'projects.core.coreUtil');
  assert.equal(accessorOf(':core:core_designsystem'), 'projects.core.coreDesignsystem');
  assert.equal(accessorOf(':app'), 'projects.app');
});

// 한 줄 형식과 여러 줄 형식을 둘 다 해석해야 한다. 한쪽만 지원하면
// 픽스처는 통과하고 실제 레포에서만 모듈이 0개가 된다.
test('한 줄 include 형식도 해석한다', () => {
  const d = mkdtempSync(pjoin(tmpdir(), 'gr-'));
  writeFileSync(pjoin(d, 'settings.gradle.kts'),
    'rootProject.name = "x"\nincludeBuild("build-logic")\ninclude(":app")\n');
  assert.deepEqual(discoverModules(d).map((m) => m.id), [':app']);
});

// include( ) 블록 **밖**의 콜론 문자열은 모듈이 아니다.
// dalla 실측에서 excludedTaskNames 의 태스크 경로가 모듈로 잡혔다.
test('include 블록 밖의 태스크 경로를 모듈로 세지 않는다', () => {
  const d = mkdtempSync(pjoin(tmpdir(), 'gr-'));
  writeFileSync(pjoin(d, 'settings.gradle.kts'),
    'gradle.startParameter.excludedTaskNames.addAll(listOf(":build-logic:convention:testClasses"))\n' +
    'include(\n    ":app",\n)\n');
  assert.deepEqual(discoverModules(d).map((m) => m.id), [':app']);
});

test('의존성 그래프의 노드와 간선을 만든다', () => {
  const g = buildGraph(FIX);
  assert.equal(g.nodes.length, 2);
  assert.deepEqual(g.edges, [[':feature:feature_home', ':core:core_util']]);
});

// 진입차수 0 = 아무도 안 쓰는 모듈. 이상 신호의 입력이 된다.
test('진입차수를 센다', () => {
  const g = buildGraph(FIX);
  assert.equal(g.inbound.get(':core:core_util'), 1);
  assert.equal(g.inbound.get(':feature:feature_home'), 0);
});

// core 가 feature 에 의존하면 계층이 뒤집힌 것이다.
test('역방향 간선이 없으면 빈 배열이다', () => {
  assert.deepEqual(buildGraph(FIX).reversed, []);
});

test('MODULE_MAP 은 경로 인덱스만 담는다', () => {
  const md = renderModuleMap(FIX);
  assert.match(md, /core\/core_util/);
  assert.match(md, /feature\/feature_home/);
  // 역할 요약 컬럼은 폐지됐다(spec 결정 10). 되살아나면 코드 요약이 다시 들어온다.
  assert.doesNotMatch(md, /역할/);
});

test('MODULE_MAP 은 존재하는 모듈 CLAUDE.md 만 링크한다', () => {
  // 픽스처에는 모듈 CLAUDE.md 가 없다. 없는 파일을 링크하면 참조 무결성이 깨진다.
  assert.doesNotMatch(renderModuleMap(FIX), /core_util\/CLAUDE\.md/);
});

test('트리거 블록에 모듈 접근 줄이 없다', () => {
  // 모듈 CLAUDE.md 는 파일 위치가 트리거다. CLAUDE.md 에 줄을 만들지 않는다.
  const t = renderTriggers(FIX);
  assert.match(t, /## 조건부 로딩/);
  assert.doesNotMatch(t, /core_util/);
});

test('트리거 블록은 존재하는 문서만 등록한다', () => {
  // 픽스처에 docs/rules/ 가 없으므로 TESTING·GIT_WORKFLOW 줄이 없어야 한다.
  assert.doesNotMatch(renderTriggers(FIX), /TESTING\.md/);
});
