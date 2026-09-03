import { discoverModules } from './lib/modules.mjs';

// 계층 순서. 앞이 아래층이다. core 가 feature 에 의존하면 역방향이다.
const LAYERS = ['core', 'data', 'domain', 'feature', 'app'];
const layerOf = (path) => LAYERS.indexOf(path.split('/')[0]);

export function buildGraph(root) {
  const mods = discoverModules(root);
  const nodes = mods.map((m) => m.id);
  const byId = new Map(mods.map((m) => [m.id, m]));
  const edges = [];
  const inbound = new Map(nodes.map((n) => [n, 0]));

  for (const m of mods) {
    for (const d of m.deps) {
      if (!byId.has(d)) continue;
      edges.push([m.id, d]);
      inbound.set(d, inbound.get(d) + 1);
    }
  }

  const reversed = edges.filter(([from, to]) => {
    const a = layerOf(byId.get(from).path);
    const b = layerOf(byId.get(to).path);
    return a >= 0 && b >= 0 && a < b;
  });

  return { nodes, edges, inbound, reversed };
}

function render(root) {
  const { nodes, edges, inbound, reversed } = buildGraph(root);
  const out = ['# 의존성 그래프 (즉석 생성 — 파일로 저장하지 않는다)', ''];
  for (const n of nodes) {
    const deps = edges.filter(([f]) => f === n).map(([, t]) => t);
    out.push(`${n}  (의존받음 ${inbound.get(n)})`);
    for (const d of deps) out.push(`  └─> ${d}`);
  }
  if (reversed.length) {
    out.push('', '## 역방향 의존 (계층 위반)');
    for (const [f, t] of reversed) out.push(`  ${f} -> ${t}`);
  }
  return out.join('\n');
}

// signals.mjs 가 buildGraph 를 import 할 때 이 블록이 돌면 안 된다.
// 파일명으로 판정하면 `node signals.mjs` 일 때 argv[1] 이 signals.mjs 라 안전하다.
if (process.argv[1] && process.argv[1].endsWith('deps.mjs')) {
  console.log(render(process.argv[2] ?? process.cwd()));
}
