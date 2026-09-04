import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const ACCEPTANCE_COUNT = 51;
const MAX_TEST_LINES = 400;
const ID_PATTERN = /P2-S08-AC-(\d{3})/gu;
const RANGE_PATTERN =
  /(?:P2-S08-)?AC-(\d{3})\s*(?:\.\.|…|–|—|-|\bthrough\b|\bto\b)\s*(?:(?:P2-S08-)?AC-)?(\d{3})/gu;
const TEST_CALL_PATTERN =
  /\b(?:(?:it|test)(?:\.[a-z]+)*|(?:select|is|ok|throws_ok|lives_ok|has_[a-z_]+|results_eq|results_ne|matches|pass|fail|plan))\s*\(/iu;
const STRUCTURAL_TEST_PATTERN = /(?:traceability|depth-audit|process-gates)/iu;

const acceptanceId = (number: number): string =>
  `P2-S08-AC-${String(number).padStart(3, '0')}`;
const acceptanceIds = Array.from({ length: ACCEPTANCE_COUNT }, (_, index) =>
  acceptanceId(index + 1),
);

const walk = (directory: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!['.git', 'coverage', 'dist', 'node_modules'].includes(entry.name)) {
        files.push(...walk(entryPath));
      }
    } else if (
      entry.isFile() &&
      /\.(?:test|spec)\.[cm]?[jt]sx?$|\.sql$/iu.test(entry.name)
    ) {
      files.push(entryPath);
    }
  }
  return files;
};

const allTestFiles = [
  join(ROOT, 'tests'),
  join(ROOT, 'apps'),
  join(ROOT, 'packages'),
  join(ROOT, 'supabase', 'tests'),
]
  .filter(existsSync)
  .flatMap(walk)
  .sort();
const sliceFiles = allTestFiles.filter((filePath) => {
  const source = readFileSync(filePath, 'utf8');
  return (
    /slice[-_]08|P2-S08-AC-|CFG-05B-0[145]|admin_(?:task|capability|audit)/iu.test(
      `${filePath}\n${source}`,
    ) && !STRUCTURAL_TEST_PATTERN.test(basename(filePath))
  );
});

const coveredIds = new Set<string>();
for (const filePath of sliceFiles) {
  const source = readFileSync(filePath, 'utf8');
  if (!TEST_CALL_PATTERN.test(source)) continue;
  for (const match of source.matchAll(RANGE_PATTERN)) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (start > end) continue;
    for (
      let value = start;
      value <= end && value <= ACCEPTANCE_COUNT;
      value += 1
    ) {
      coveredIds.add(acceptanceId(value));
    }
  }
  for (const match of source.matchAll(ID_PATTERN)) {
    const value = Number(match[1]);
    if (value <= ACCEPTANCE_COUNT) coveredIds.add(acceptanceId(value));
  }
}

const missingIds = acceptanceIds.filter((id) => !coveredIds.has(id));
const lineBudgetViolations = sliceFiles
  .map((filePath) => ({
    filePath: relative(ROOT, filePath),
    lines: readFileSync(filePath, 'utf8').split('\n').length,
  }))
  .filter(({ lines }) => lines > MAX_TEST_LINES);
const bareTruthyFindings = sliceFiles.flatMap((filePath) => {
  const source = readFileSync(filePath, 'utf8');
  return [...source.matchAll(/\.toBe(?:Truthy|Falsy)\s*\(/gu)].map(
    (match) =>
      `${relative(ROOT, filePath)}:${source.slice(0, match.index).split('\n').length}`,
  );
});

const moduleDocs = [
  'apps/web/src/components/platform-configuration/README.md',
  'apps/worker/src/platform-configuration/README.md',
  'packages/contracts/src/platform-configuration/README.md',
  'supabase/tests/README.md',
].map((relativePath) => ({
  relativePath,
  source: readFileSync(resolve(ROOT, relativePath), 'utf8'),
}));

describe('Phase 2 Slice 08 acceptance depth audit', () => {
  it('enumerates exactly the locked 51 Slice 08 acceptance criteria', () => {
    expect(acceptanceIds).toHaveLength(ACCEPTANCE_COUNT);
    expect(new Set(acceptanceIds)).toHaveLength(ACCEPTANCE_COUNT);
    expect(acceptanceIds[0]).toBe('P2-S08-AC-001');
    expect(acceptanceIds.at(-1)).toBe('P2-S08-AC-051');
  });

  it('binds every criterion to concrete executable Slice 08 evidence', () => {
    expect(
      missingIds,
      `Missing concrete Slice 08 evidence (${missingIds.length}): ${missingIds.join(', ')}`,
    ).toEqual([]);
  });

  it('rejects bare truthy placeholders in Slice 08 evidence', () => {
    expect(bareTruthyFindings).toEqual([]);
  });

  it(`keeps every Slice 08 test at or below ${MAX_TEST_LINES} lines`, () => {
    expect(lineBudgetViolations).toEqual([]);
  });

  it('requires each implementation module README to record Slice 08 ownership', () => {
    const missingDocs = moduleDocs
      .filter(({ source }) => !/P2-S08|CFG-05B|Slice 08/iu.test(source))
      .map(({ relativePath }) => relativePath);
    expect(
      missingDocs,
      `Module docs missing Slice 08 ownership: ${missingDocs.join(', ')}`,
    ).toEqual([]);
  });
});
