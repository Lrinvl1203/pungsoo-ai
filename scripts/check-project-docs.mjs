import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];

const required = [
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  'docs/PROJECT_INDEX.md',
  'docs/PROJECT_STATE.md',
  'docs/HANDOFF.md',
  'docs/DECISION_LOG.md',
  'docs/PROMPT_INDEX.md',
  'docs/physical-product-mvp-status.md',
  'docs/templates/HANDOFF_TEMPLATE.md',
];

const contents = new Map();
for (const relativePath of required) {
  const absolutePath = resolve(root, relativePath);
  if (!existsSync(absolutePath)) {
    errors.push(`필수 문서 없음: ${relativePath}`);
    continue;
  }
  const text = readFileSync(absolutePath, 'utf8');
  contents.set(relativePath, text);
  if (text.includes('\uFFFD')) {
    errors.push(`UTF-8 대체문자 발견: ${relativePath}`);
  }
}

for (const relativePath of [
  'docs/PROJECT_INDEX.md',
  'docs/PROJECT_STATE.md',
  'docs/HANDOFF.md',
  'docs/DECISION_LOG.md',
  'docs/PROMPT_INDEX.md',
]) {
  const text = contents.get(relativePath);
  if (text && !/^Last updated: \d{4}-\d{2}-\d{2}$/m.test(text)) {
    errors.push(`Last updated 날짜 없음: ${relativePath}`);
  }
}

const requiredReferences = new Map([
  [
    'AGENTS.md',
    ['docs/PROJECT_INDEX.md', 'docs/PROJECT_STATE.md', 'docs/HANDOFF.md'],
  ],
  [
    'CLAUDE.md',
    ['AGENTS.md', 'docs/PROJECT_STATE.md', 'docs/HANDOFF.md'],
  ],
  [
    'docs/PROMPT_INDEX.md',
    ['utils/remedyArt.ts', 'api/generate-visuals.ts', 'server/constants.ts'],
  ],
  [
    'docs/PROJECT_STATE.md',
    ['https://41pungsoo-ai.vercel.app/', 'artifacts/print-orders/'],
  ],
]);

for (const [relativePath, references] of requiredReferences) {
  const text = contents.get(relativePath) || '';
  for (const reference of references) {
    if (!text.includes(reference)) {
      errors.push(`${relativePath}에 필수 참조 없음: ${reference}`);
    }
  }
}

for (const [relativePath, text] of contents) {
  const linkPattern = /\[[^\]]+\]\((?!https?:|mailto:|#)([^)]+)\)/g;
  for (const match of text.matchAll(linkPattern)) {
    const rawTarget = match[1].split('#')[0].replace(/^<|>$/g, '');
    if (!rawTarget || rawTarget.includes('*')) continue;
    const target = resolve(dirname(resolve(root, relativePath)), rawTarget);
    if (!existsSync(target)) {
      errors.push(`깨진 상대 링크: ${relativePath} -> ${match[1]}`);
    }
  }
}

let changed = [];
try {
  const output = execFileSync(
    'git',
    ['status', '--porcelain=v1', '--untracked-files=all'],
    { cwd: root, encoding: 'utf8' },
  );
  changed = output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).replaceAll('\\', '/'))
    .filter((path) => !path.startsWith('artifacts/print-orders/'));
} catch (error) {
  warnings.push(`Git 변경 파일 검사를 건너뜀: ${error.message}`);
}

const hasChanged = (test) => changed.some((path) => test(path));
const hasDocUpdate = (...paths) => paths.some((path) => changed.includes(path));

const runtimeChanged = hasChanged(
  (path) =>
    /^(api|components|contexts|hooks|pages|server|services|src|utils)\//.test(path) ||
    ['App.tsx', 'package.json', 'vercel.json'].includes(path),
);
if (
  runtimeChanged &&
  !hasDocUpdate('docs/PROJECT_STATE.md', 'docs/HANDOFF.md')
) {
  errors.push(
    '런타임 변경이 있지만 PROJECT_STATE.md 또는 HANDOFF.md가 갱신되지 않음',
  );
}

const promptChanged = hasChanged(
  (path) =>
    ['api/generate-visuals.ts', 'server/constants.ts', 'utils/remedyArt.ts'].includes(
      path,
    ) || /prompt/i.test(path),
);
if (promptChanged && !hasDocUpdate('docs/PROMPT_INDEX.md')) {
  errors.push('프롬프트 변경이 있지만 docs/PROMPT_INDEX.md가 갱신되지 않음');
}

const physicalChanged = hasChanged(
  (path) =>
    path.startsWith('artifacts/3d-') ||
    path.startsWith('artifacts/physical-tests/') ||
    /3D|액자|오브제|guardian/i.test(path),
);
if (
  physicalChanged &&
  !hasDocUpdate('docs/physical-product-mvp-status.md', 'docs/PROJECT_STATE.md')
) {
  errors.push(
    '실물 상품 변경이 있지만 physical-product-mvp-status.md 또는 PROJECT_STATE.md가 갱신되지 않음',
  );
}

for (const warning of warnings) {
  console.warn(`WARN: ${warning}`);
}

if (errors.length) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exit(1);
}

console.log(
  `Project docs OK: ${required.length} required files, ${changed.length} relevant changed paths checked.`,
);
