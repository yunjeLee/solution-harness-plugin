import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

// spec §문서 집합의 상한. 여기가 단일 출처다.
const CAPS = [
  ['CLAUDE.md', 40],
  ['docs/GOTCHA.md', 60],
  ['docs/rules/TESTING.md', 80],
];
const MODULE_CAP = 50;

const SRC_EXT = new Set(['.kt', '.java', '.swift', '.gradle', '.kts', '.toml']);
const SKIP_DIR = new Set(['build', '.git', '.gradle', 'node_modules', 'Pods', 'docs']);

const lineCount = (p) => readFileSync(p, 'utf8').split('\n').filter(Boolean).length;

function walk(root, dir = root, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIR.has(entry)) continue;
    const p = join(dir, entry);
    try {
      if (statSync(p).isDirectory()) walk(root, p, out);
      else out.push(p);
    } catch {
      // 깨진 심볼릭 링크(ENOENT)나 순환 링크(ELOOP)는 건너뛴다.
      continue;
    }
  }
  return out;
}

/** 상한이 있는 모든 문서의 현재 줄 수를 모은다(위반 여부와 무관하게). */
export function docLineCounts(root) {
  const counts = [];
  for (const [rel, cap] of CAPS) {
    const p = join(root, rel);
    if (!existsSync(p)) continue;
    counts.push({ file: rel, lines: lineCount(p), cap });
  }
  for (const p of walk(root).filter((f) => f.endsWith('/CLAUDE.md'))) {
    const rel = relative(root, p);
    if (rel === 'CLAUDE.md') continue;
    counts.push({ file: rel, lines: lineCount(p), cap: MODULE_CAP });
  }
  return counts;
}

export function checkLineCaps(root) {
  return docLineCounts(root).filter((c) => c.lines > c.cap);
}

/** 하네스 문서의 백틱 토큰이 코드에 아직 있는지 본다. */
export function checkAnchors(root) {
  const docs = [join(root, 'docs/GOTCHA.md'),
    ...walk(root).filter((f) => f.endsWith('/CLAUDE.md'))]
    .filter(existsSync);
  const code = walk(root)
    .filter((f) => SRC_EXT.has(extname(f)))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');

  const extSet = new Set([...SRC_EXT].map((e) => e.slice(1)));
  const dead = [];
  for (const doc of docs) {
    for (const [, tok] of readFileSync(doc, 'utf8').matchAll(/`([A-Za-z][\w./:]{2,})`/g)) {
      const bare = tok.split(/[./:]/).pop();
      if (!bare || bare.length < 3) continue;
      if (extSet.has(bare)) continue; // `build.gradle.kts` 같은 확장자 꼬리는 식별자가 아니다.
      if (/^\d+$/.test(bare)) continue; // `File.kt:261` 같은 줄 참조의 줄 번호는 식별자가 아니다.
      if (!new RegExp(`\\b${bare}\\b`).test(code)) dead.push({ file: relative(root, doc), anchor: tok });
    }
  }
  return dead;
}

if (process.argv[1] && process.argv[1].endsWith('verify-docs.mjs')) {
  const root = process.argv[2] ?? process.cwd();
  const counts = docLineCounts(root);
  const caps = checkLineCaps(root);
  const dead = checkAnchors(root);
  for (const c of counts) console.log(`COUNT ${c.file}: ${c.lines}/${c.cap}줄`);
  for (const c of caps) console.log(`CAP  ${c.file}: ${c.lines}줄 (상한 ${c.cap})`);
  for (const d of dead) console.log(`DEAD ${d.file}: \`${d.anchor}\` 가 코드에 없다`);
  if (caps.length + dead.length === 0) console.log('OK');
  process.exit(caps.length + dead.length ? 1 : 0);
}
