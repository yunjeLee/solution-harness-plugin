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
