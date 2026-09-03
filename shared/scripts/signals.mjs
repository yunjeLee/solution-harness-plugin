import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { discoverModules } from './lib/modules.mjs';
import { buildGraph } from './deps.mjs';

const SRC_EXT = new Set(['.kt', '.java', '.swift']);
const SKIP_DIR = new Set(['build', '.git', '.gradle', 'node_modules', 'Pods']);

const DECL_RE = /\b(?:interface|object|class)\s+([A-Z][A-Za-z0-9_]*)/g;
const DEPRECATED_RE = /@Deprecated[\s\S]{0,120}?\b(?:object|class|fun|interface)\s+([A-Za-z0-9_]+)/g;
const HACK_RE = /\b(HACK|FIXME|TODO)\b[:\s]*(.{0,60})/;

const sig = (kind, file, anchor, detail) => ({
  kind,
  file,
  anchor,
  id: `${kind}:${file}#${anchor}`,
  detail,
});

function sourceFiles(root, dir = root, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIR.has(entry)) continue;
    const p = join(dir, entry);
    try {
      if (statSync(p).isDirectory()) sourceFiles(root, p, out);
      else if (SRC_EXT.has(extname(p))) out.push(p);
    } catch {
      // 깨진 심볼릭 링크(ENOENT)나 순환 링크(ELOOP)는 건너뛴다.
      continue;
    }
  }
  return out;
}

function gitMoved(root) {
  try {
    const raw = execFileSync(
      'git',
      ['log', '--since=3.months', '--diff-filter=RD', '--name-only', '--format='],
      { cwd: root, encoding: 'utf8' },
    );
    const counts = new Map();
    for (const line of raw.split('\n')) {
      const dir = line.trim().split('/').slice(0, 2).join('/');
      if (dir) counts.set(dir, (counts.get(dir) ?? 0) + 1);
    }
    return [...counts].filter(([, n]) => n >= 5).map(([dir, n]) =>
      sig('moved', dir, dir, `최근 3개월 이동·삭제 ${n}건`));
  } catch {
    return [];
  }
}

export function collectSignals(root) {
  const files = sourceFiles(root);
  const texts = files.map((f) => [relative(root, f), readFileSync(f, 'utf8')]);
  const all = texts.map(([, t]) => t).join('\n');
  const out = [];

  for (const [rel, text] of texts) {
    for (const [, name] of text.matchAll(DECL_RE)) {
      // 선언 1회 = 자기 자신뿐. 다른 곳에서 안 쓰인다.
      const uses = all.split(new RegExp(`\\b${name}\\b`)).length - 1;
      if (uses <= 1) out.push(sig('unused', rel, name, '참조 0건'));
    }
    for (const [, name] of text.matchAll(DEPRECATED_RE)) {
      const uses = all.split(new RegExp(`\\b${name}\\b`)).length - 1;
      if (uses > 1) out.push(sig('deprecated', rel, name, `사용처 ${uses - 1}곳`));
    }
    const hack = text.match(HACK_RE);
    if (hack) out.push(sig('hack', rel, hack[1], hack[2].trim()));
  }

  const { inbound, reversed } = buildGraph(root);
  for (const [id, n] of inbound) {
    if (n === 0) out.push(sig('orphan', 'settings.gradle.kts', id, '아무도 의존하지 않음'));
  }
  for (const [from, to] of reversed) {
    out.push(sig('reversed', 'settings.gradle.kts', `${from}->${to}`, '계층 역방향'));
  }

  for (const m of discoverModules(root)) {
    const hasTest =
      existsSync(join(root, m.path, 'src/test')) ||
      existsSync(join(root, m.path, 'src/androidTest')) ||
      existsSync(join(root, m.path, 'Tests'));
    if (!hasTest) out.push(sig('untested', m.path, m.id, '테스트 소스셋 없음'));
  }

  return [...out, ...gitMoved(root)];
}

if (process.argv[1] && process.argv[1].endsWith('signals.mjs')) {
  console.log(JSON.stringify(collectSignals(process.argv[2] ?? process.cwd()), null, 2));
}
