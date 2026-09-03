import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { discoverModules } from './lib/modules.mjs';

// 조건부 로딩 대상. 파일이 있을 때만 줄을 만든다.
const TRIGGERS = [
  ['docs/rules/TESTING.md', 'test 디렉토리(**/test/, **/androidTest/, **/*Tests/) 편집 시'],
  ['docs/rules/GIT_WORKFLOW.md', '브랜치/커밋/PR/릴리즈 작업 시'],
  ['docs/MODULE_MAP.md', '모듈 전체 구조 확인이 필요할 때'],
];

export function renderModuleMap(root) {
  const mods = discoverModules(root);
  const lines = [
    '# MODULE_MAP',
    '',
    '> 스크립트 생성물. 손으로 고치지 않는다. `node shared/scripts/index-modules.mjs <root> --write` 로 다시 만든다.',
    '',
    '| 모듈 | 경로 | 모듈 지식 |',
    '|---|---|---|',
  ];
  for (const m of mods) {
    const doc = join(m.path, 'CLAUDE.md');
    const link = existsSync(join(root, doc)) ? `\`${doc}\`` : '-';
    lines.push(`| \`${m.id}\` | \`${m.path}\` | ${link} |`);
  }
  return lines.join('\n') + '\n';
}

export function renderTriggers(root) {
  const lines = ['## 조건부 로딩'];
  for (const [path, when] of TRIGGERS) {
    if (existsSync(join(root, path))) lines.push(`- ${when} → @${path}`);
  }
  return lines.join('\n') + '\n';
}

if (process.argv[1] && process.argv[1].endsWith('index-modules.mjs')) {
  const root = process.argv[2] ?? process.cwd();
  if (process.argv.includes('--write')) {
    const out = join(root, 'docs/MODULE_MAP.md');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, renderModuleMap(root));
    console.error(`wrote ${out}`);
  }
  console.log(renderTriggers(root));
}
