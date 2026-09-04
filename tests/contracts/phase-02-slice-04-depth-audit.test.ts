import { readFileSync, readdirSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const MAX_TEST_LINES = 400;
const acceptanceId = (number: number): string =>
  `P2-S04-AC-${String(number).padStart(3, '0')}`;
const ACCEPTANCE_IDS = Array.from({ length: 156 }, (_, index) =>
  acceptanceId(index + 1),
);
const TEST_FILE_PATTERN =
  /phase[-_]02[-_]slice[-_]04.*\.(?:(?:test|spec)\.[cm]?[jt]sx?|sql)$/u;
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
  .flatMap(walk)
  .sort();
const concreteFiles = testFiles.filter(
  (filePath) => !basename(filePath).includes('depth-audit'),
);

const coveredIds = new Set<string>();
for (const filePath of concreteFiles) {
  const source = readFileSync(filePath, 'utf8');
  if (!TEST_CALL_PATTERN.test(source)) continue;
  for (const match of source.matchAll(/(?:P2-S04-)?AC-(\d{3})/gu)) {
    coveredIds.add(acceptanceId(Number(match[1])));
  }
  for (const match of source.matchAll(
    /P2-S04-AC-(\d{3})(?:\.\.|\s+through\s+)AC-(\d{3})/gu,
  )) {
    for (let value = Number(match[1]); value <= Number(match[2]); value += 1) {
      coveredIds.add(acceptanceId(value));
    }
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

describe('Phase 2 Slice 04 acceptance depth audit', () => {
  it('binds every criterion to executable Slice 04 evidence', () => {
    expect(
      missingIds,
      `Missing concrete Slice 04 evidence (${missingIds.length}): ${missingIds.join(', ')}`,
    ).toEqual([]);
  });

  it('rejects bare truthy placeholders', () => {
    expect(bareTruthyFindings).toEqual([]);
  });

  it(`keeps every Slice 04 test at or below ${MAX_TEST_LINES} lines`, () => {
    expect(lineBudgetViolations).toEqual([]);
  });
});
