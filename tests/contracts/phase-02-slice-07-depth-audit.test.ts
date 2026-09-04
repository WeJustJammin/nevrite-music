import { basename, join, relative, resolve } from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const ACCEPTANCE_COUNT = 176;
const MAX_TEST_LINES = 400;
const acceptanceId = (number: number): string =>
  `P2-S07-AC-${String(number).padStart(3, '0')}`;
const acceptanceIds = Array.from({ length: ACCEPTANCE_COUNT }, (_, index) =>
  acceptanceId(index + 1),
);

const testFilePattern =
  /phase[-_]02[-_]slice[-_]07(?:[-_][^/]*)?\.(?:(?:test|spec)\.[cm]?[jt]sx?|sql)$/iu;
const testCallPattern =
  /\b(?:(?:it|test)(?:\.[a-z]+)*|(?:is|ok|isnt|like|unlike|throws_ok|lives_ok|has_[a-z_]+|results_eq|results_ne|matches|pass|fail|plan))\s*\(/iu;
const rangePattern =
  /(?:P2-S07-)?AC-(\d{3})\s*(?:\.\.|…|–|—|-|\bthrough\b|\bto\b)\s*(?:(?:P2-S07-)?AC-)?(\d{3})/gu;
const singleIdPattern = /(?<![A-Z0-9-])(?:P2-S07-)?AC-(\d{3})(?!\d)/gu;

const walk = (directory: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!['.git', 'coverage', 'dist', 'node_modules'].includes(entry.name))
        files.push(...walk(entryPath));
    } else if (entry.isFile() && testFilePattern.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
};

const testFiles = [
  join(ROOT, 'tests'),
  join(ROOT, 'apps'),
  join(ROOT, 'packages'),
  join(ROOT, 'supabase', 'tests'),
]
  .filter((directory) => existsSync(directory))
  .flatMap(walk)
  .sort();
const concreteFiles = testFiles.filter(
  (filePath) => !basename(filePath).includes('depth-audit'),
);

const coveredIds = new Set<string>();
for (const filePath of concreteFiles) {
  const source = readFileSync(filePath, 'utf8');
  if (!testCallPattern.test(source)) continue;
  for (const match of source.matchAll(rangePattern)) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (start > end) continue;
    for (let value = start; value <= end; value += 1) {
      if (value <= ACCEPTANCE_COUNT) coveredIds.add(acceptanceId(value));
    }
  }
  for (const match of source.matchAll(singleIdPattern)) {
    const value = Number(match[1]);
    if (value <= ACCEPTANCE_COUNT) coveredIds.add(acceptanceId(value));
  }
}

const missingIds = acceptanceIds.filter((id) => !coveredIds.has(id));
const lineBudgetViolations = testFiles
  .map((filePath) => ({
    filePath: relative(ROOT, filePath),
    lines: readFileSync(filePath, 'utf8').split('\n').length,
  }))
  .filter(({ lines }) => lines > MAX_TEST_LINES);
const bareTruthyFindings = concreteFiles.flatMap((filePath) => {
  const source = readFileSync(filePath, 'utf8');
  return [...source.matchAll(/\.toBe(?:Truthy|Falsy)\s*\(/gu)].map(
    (match) =>
      `${relative(ROOT, filePath)}:${source.slice(0, match.index).split('\n').length}`,
  );
});

describe('Phase 2 Slice 07 acceptance depth audit', () => {
  it('enumerates exactly the locked 176 Slice 07 acceptance criteria', () => {
    expect(acceptanceIds).toHaveLength(ACCEPTANCE_COUNT);
    expect(new Set(acceptanceIds)).toHaveLength(ACCEPTANCE_COUNT);
    expect(acceptanceIds[0]).toBe('P2-S07-AC-001');
    expect(acceptanceIds.at(-1)).toBe('P2-S07-AC-176');
    acceptanceIds.forEach((id, index) => {
      expect(id).toBe(acceptanceId(index + 1));
    });
  });

  it('binds every criterion to executable Slice 07 evidence', () => {
    expect(
      missingIds,
      `Missing concrete Slice 07 evidence (${missingIds.length}): ${missingIds.join(', ')}`,
    ).toEqual([]);
  });

  it('rejects bare truthy placeholders in Slice 07 tests', () => {
    expect(bareTruthyFindings).toEqual([]);
  });

  it(`keeps every Slice 07 test at or below ${MAX_TEST_LINES} lines`, () => {
    expect(lineBudgetViolations).toEqual([]);
  });
});
