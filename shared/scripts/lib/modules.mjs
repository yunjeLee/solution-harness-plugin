import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// 모듈 id 는 `include( … )` 블록 **안에서만** 모은다.
// 파일 전체를 훑으면 `excludedTaskNames.addAll(listOf(":build-logic:convention:testClasses"))`
// 같은 태스크 경로까지 모듈로 잡힌다(dalla 실측: 전체 42개 중 1개가 오탐).
// 닫는 괄호를 같은 줄에서 요구해도 안 된다 — 여러 줄 `include(\n ":a",\n)` 형식에서 0개가 된다.
// 그래서 괄호 균형을 세어 블록 범위를 잡는다.
const MODULE_ID_RE = /"(:[A-Za-z0-9_:.\-]+)"/g;

function includeBlocks(src) {
  const out = [];
  const re = /\binclude\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length;
    let depth = 1;
    while (i < src.length && depth > 0) {
      if (src[i] === '(') depth++;
      else if (src[i] === ')') depth--;
      i++;
    }
    out.push(src.slice(m.index + m[0].length, i - 1));
  }
  return out;
}
const TARGET_RE = /\.target\s*\(\s*name:\s*"([^"]+)"/g;
const DEP_STRING_RE = /project\s*\(\s*"(:[^"]+)"\s*\)/g;
const DEP_ACCESSOR_RE = /projects\.([A-Za-z0-9_.]+)/g;

const camel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

/** ':core:core_util' -> 'projects.core.coreUtil' */
export function accessorOf(id) {
  return 'projects.' + id.slice(1).split(':').map(camel).join('.');
}

function firstExisting(root, names) {
  return names.map((n) => join(root, n)).find(existsSync);
}

function readDeps(root, path, accessorToId) {
  const f = firstExisting(root, [
    join(path, 'build.gradle.kts'),
    join(path, 'build.gradle'),
  ]);
  if (!f) return [];
  const src = readFileSync(f, 'utf8');
  const out = new Set();
  for (const [, id] of src.matchAll(DEP_STRING_RE)) out.add(id);
  for (const [, acc] of src.matchAll(DEP_ACCESSOR_RE)) {
    const id = accessorToId.get('projects.' + acc);
    if (id) out.add(id);
  }
  return [...out];
}

function gradle(root) {
  const f = firstExisting(root, ['settings.gradle.kts', 'settings.gradle']);
  if (!f) return null;
  const ids = [...new Set(
    includeBlocks(readFileSync(f, 'utf8')).flatMap((b) => [...b.matchAll(MODULE_ID_RE)].map(([, id]) => id)),
  )];
  const accessorToId = new Map(ids.map((id) => [accessorOf(id), id]));
  return ids.map((id) => {
    const path = id.slice(1).split(':').join('/');
    return { id, path, deps: readDeps(root, path, accessorToId) };
  });
}

function swift(root) {
  const f = firstExisting(root, ['Package.swift']);
  if (!f) return null;
  const src = readFileSync(f, 'utf8');
  return [...src.matchAll(TARGET_RE)].map(([, name]) => ({
    id: name,
    path: join('Sources', name),
    deps: [],
  }));
}

/** 레포 루트에서 모듈 목록을 찾는다. Gradle 우선, 없으면 SwiftPM. */
export function discoverModules(root) {
  return gradle(root) ?? swift(root) ?? [];
}
