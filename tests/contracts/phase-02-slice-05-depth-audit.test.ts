import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const MAX_TEST_LINES = 400;
const ACCEPTANCE_COUNT = 258;
const acceptanceId = (number: number): string =>
  `P2-S05-AC-${String(number).padStart(3, '0')}`;
const ACCEPTANCE_IDS = Array.from({ length: ACCEPTANCE_COUNT }, (_, index) =>
  acceptanceId(index + 1),
);

const TEST_FILE_PATTERN =
  /phase[-_]02[-_]slice[-_]05(?:[-_][^/]*)?\.(?:(?:test|spec)\.[cm]?[jt]sx?|sql)$/iu;
const TEST_CALL_PATTERN =
  /\b(?:(?:it|test)(?:\.[a-z]+)*|(?:is|ok|isnt|like|unlike|throws_ok|lives_ok|has_[a-z_]+|results_eq|results_ne|matches|pass|fail|plan))\s*\(/iu;
const RANGE_PATTERN =
  /(?:P2-S05-)?AC-(\d{3})\s*(?:\.\.|…|–|—|-|\bthrough\b|\bto\b)\s*(?:(?:P2-S05-)?AC-)?(\d{3})/gu;
const SINGLE_ID_PATTERN = /(?<![A-Z0-9-])(?:P2-S05-)?AC-(\d{3})(?!\d)/gu;

const walk = (directory: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!['.git', 'coverage', 'dist', 'node_modules'].includes(entry.name)) {
        files.push(...walk(entryPath));
      }
    } else if (entry.isFile() && TEST_FILE_PATTERN.test(entry.name)) {
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
  if (!TEST_CALL_PATTERN.test(source)) continue;

  for (const match of source.matchAll(RANGE_PATTERN)) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (start > end) continue;
    for (let value = start; value <= end; value += 1) {
      if (value <= ACCEPTANCE_COUNT) coveredIds.add(acceptanceId(value));
    }
  }

  for (const match of source.matchAll(SINGLE_ID_PATTERN)) {
    const value = Number(match[1]);
    if (value <= ACCEPTANCE_COUNT) coveredIds.add(acceptanceId(value));
  }
}

const missingIds = ACCEPTANCE_IDS.filter((id) => !coveredIds.has(id));
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

describe('Phase 2 Slice 05 acceptance depth audit', () => {
  it('enumerates exactly the locked Slice 05 acceptance criteria', () => {
    expect(ACCEPTANCE_IDS).toHaveLength(ACCEPTANCE_COUNT);
    expect(new Set(ACCEPTANCE_IDS)).toHaveLength(ACCEPTANCE_COUNT);
    expect(ACCEPTANCE_IDS[0]).toBe('P2-S05-AC-001');
    expect(ACCEPTANCE_IDS.at(-1)).toBe('P2-S05-AC-258');
    ACCEPTANCE_IDS.forEach((id, index) => {
      expect(id).toBe(acceptanceId(index + 1));
    });
  });

  it('binds every criterion to executable Slice 05 evidence', () => {
    expect(
      missingIds,
      `Missing concrete Slice 05 evidence (${missingIds.length}): ${missingIds.join(', ')}`,
    ).toEqual([]);
  });

  it('rejects bare truthy placeholders', () => {
    expect(bareTruthyFindings).toEqual([]);
  });

  it(`keeps every Slice 05 test at or below ${MAX_TEST_LINES} lines`, () => {
    expect(lineBudgetViolations).toEqual([]);
  });
});
