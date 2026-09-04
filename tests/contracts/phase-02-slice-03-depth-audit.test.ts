import { readFileSync, readdirSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const MAX_TEST_LINES = 400;
const ACCEPTANCE_IDS = Array.from(
  { length: 301 },
  (_, index) => `P2-S03-AC-${String(index + 1).padStart(3, '0')}`,
);
const ACCEPTANCE_ID_PATTERN = /P2-S03-AC-\d{3}/gu;
const TEST_FILE_PATTERN =
  /(?:(?:phase[-_]02[-_]slice[-_]03|slice[-_]03).*\.(?:(?:test|spec)\.[cm]?[jt]sx?|sql)|identity-authority-(?:contract-matrix|route-registry)\.test\.ts)$/u;
const META_TEST_PATTERN = /depth-audit/u;
const TEST_CALL_PATTERN =
  /\b(?:(?:it|test)(?:\.[a-z]+)?|(?:is|ok|isnt|like|unlike|throws_ok|lives_ok|has_[a-z_]+))\s*\(/u;

const walk = (directory: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!['.git', 'coverage', 'dist', 'node_modules'].includes(entry.name)) {
        files.push(...walk(entryPath));
      }
      continue;
    }
    if (entry.isFile() && TEST_FILE_PATTERN.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
};

const relativePath = (absolutePath: string): string =>
  relative(ROOT, absolutePath).split('/').join('/');

const testFiles = [
  join(ROOT, 'tests'),
  join(ROOT, 'apps'),
  join(ROOT, 'packages'),
  join(ROOT, 'supabase', 'tests'),
]
  .flatMap(walk)
  .sort();
const concreteTestFiles = testFiles.filter(
  (filePath) => !META_TEST_PATTERN.test(basename(filePath)),
);
const sources = concreteTestFiles.map((filePath) => ({
  filePath,
  relativePath: relativePath(filePath),
  source: readFileSync(filePath, 'utf8'),
}));

const coverage = new Map<string, string[]>();
for (const { relativePath: filePath, source } of sources) {
  if (!TEST_CALL_PATTERN.test(source)) continue;
  for (const acceptanceId of new Set(
    source.match(ACCEPTANCE_ID_PATTERN) ?? [],
  )) {
    const files = coverage.get(acceptanceId) ?? [];
    files.push(filePath);
    coverage.set(acceptanceId, files);
  }
}

const missingIds = ACCEPTANCE_IDS.filter(
  (acceptanceId) => !coverage.has(acceptanceId),
);

const lineBudgetViolations = testFiles
  .map((filePath) => ({
    filePath: relativePath(filePath),
    lineCount: readFileSync(filePath, 'utf8').split('\n').length,
  }))
  .filter(({ lineCount }) => lineCount > MAX_TEST_LINES);

const bareTruthyPatterns = [
  {
    label: 'toBeTruthy/toBeFalsy matcher',
    pattern: /\.toBe(?:Truthy|Falsy)\s*\(/gu,
  },
  {
    label: 'literal boolean self-comparison',
    pattern:
      /expect\s*\(\s*(?:true|false)\s*\)\s*\.\s*(?:toBe|toEqual|toStrictEqual)\s*\(\s*(?:true|false)\s*\)/gu,
  },
];

const bareTruthyFindings = sources.flatMap(
  ({ relativePath: filePath, source }) =>
    bareTruthyPatterns.flatMap(({ label, pattern }) =>
      [...source.matchAll(pattern)].map((match) => ({
        filePath,
        label,
        line: source.slice(0, match.index ?? 0).split('\n').length,
      })),
    ),
);

describe('Phase 2 Slice 03 acceptance depth audit', () => {
  it('binds every acceptance criterion to concrete executable test source', () => {
    expect(
      missingIds,
      `Missing concrete Slice 03 test evidence (${missingIds.length}): ${missingIds.join(', ')}`,
    ).toEqual([]);
  });

  it('rejects bare truthy placeholders in concrete test source', () => {
    expect(
      bareTruthyFindings,
      bareTruthyFindings
        .map(({ filePath, label, line }) => `${filePath}:${line} ${label}`)
        .join('\n'),
    ).toEqual([]);
  });

  it(`keeps every Slice 03 test file at or below ${MAX_TEST_LINES} lines`, () => {
    expect(
      lineBudgetViolations,
      lineBudgetViolations
        .map(({ filePath, lineCount }) => `${filePath} (${lineCount} lines)`)
        .join('\n'),
    ).toEqual([]);
  });
});
