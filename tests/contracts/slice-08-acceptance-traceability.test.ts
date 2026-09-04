import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const ACCEPTANCE_COUNT = 51;
const SLICE_PROGRESS = resolve(
  ROOT,
  '.memory/pipeline/progress/slices/phase-02-slice-08.md',
);
const ID_PATTERN = /P2-S08-AC-(\d{3})/gu;
const RANGE_PATTERN =
  /P2-S08-AC-(\d{3})\s*(?:\.\.|…|–|—|-|\bthrough\b|\bto\b)\s*(?:P2-S08-AC-)?(\d{3})/gu;
const TEST_CALL_PATTERN =
  /\b(?:(?:it|test)(?:\.[a-z]+)*|(?:select|is|ok|throws_ok|lives_ok|has_[a-z_]+|results_eq|results_ne|matches|pass|fail|plan))\s*\(/iu;
const STRUCTURAL_TEST_PATTERN = /(?:traceability|depth-audit|process-gates)/iu;

const acceptanceId = (number: number): string =>
  `P2-S08-AC-${String(number).padStart(3, '0')}`;
const acceptanceIds = Array.from({ length: ACCEPTANCE_COUNT }, (_, index) =>
  acceptanceId(index + 1),
);

const readSource = (filePath: string): string => {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
};

const withoutComments = (source: string): string =>
  source
    .replace(/\/\*[\s\S]*?\*\//gu, '')
    .replace(/^\s*\/\/.*$/gmu, '')
    .replace(/^\s*--.*$/gmu, '');

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
    if (
      entry.isFile() &&
      /\.(?:test|spec)\.[cm]?[jt]sx?$|\.sql$/iu.test(entry.name)
    ) {
      files.push(entryPath);
    }
  }
  return files;
};

const evidenceFiles = [
  join(ROOT, 'tests'),
  join(ROOT, 'apps'),
  join(ROOT, 'packages'),
  join(ROOT, 'supabase', 'tests'),
]
  .filter(existsSync)
  .flatMap(walk)
  .filter((filePath) => !STRUCTURAL_TEST_PATTERN.test(basename(filePath)))
  .filter((filePath) => {
    const source = withoutComments(readSource(filePath));
    return /P2-S08-AC-|CFG-05B-0[145]|admin_(?:task|capability|audit)/iu.test(
      source,
    );
  })
  .sort();

const executableEvidence = evidenceFiles
  .map((filePath) => ({
    filePath,
    source: withoutComments(readSource(filePath)),
  }))
  .filter(({ source }) => TEST_CALL_PATTERN.test(source));
const executableText = executableEvidence
  .map(({ source }) => source)
  .join('\n');

const coveredIds = new Set<string>();
for (const match of executableText.matchAll(RANGE_PATTERN)) {
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
for (const match of executableText.matchAll(ID_PATTERN)) {
  const value = Number(match[1]);
  if (value <= ACCEPTANCE_COUNT) coveredIds.add(acceptanceId(value));
}

const surfaceEvidence = {
  contracts: executableEvidence.some(
    ({ filePath }) =>
      filePath.includes(join('packages', 'contracts')) ||
      filePath.includes(join('tests', 'contracts')),
  ),
  worker: executableEvidence.some(({ filePath }) =>
    filePath.includes(join('apps', 'worker')),
  ),
  web: executableEvidence.some(({ filePath }) =>
    filePath.includes(join('apps', 'web')),
  ),
  persistence: executableEvidence.some(({ filePath }) =>
    filePath.includes(join('supabase', 'tests')),
  ),
};

const canonicalIds = [...readSource(SLICE_PROGRESS).matchAll(ID_PATTERN)].map(
  (match) => `P2-S08-AC-${match[1]}`,
);

describe('Phase 2 Slice 08 acceptance traceability', () => {
  it('enumerates exactly the locked 51 Slice 08 acceptance criteria', () => {
    expect(canonicalIds).toEqual(acceptanceIds);
    expect(new Set(canonicalIds)).toHaveLength(ACCEPTANCE_COUNT);
    expect(canonicalIds[0]).toBe('P2-S08-AC-001');
    expect(canonicalIds.at(-1)).toBe('P2-S08-AC-051');
  });

  it('binds every criterion to an executable evidence description', () => {
    const missing = acceptanceIds.filter((id) => !coveredIds.has(id));
    expect(
      missing,
      `Missing executable Slice 08 evidence descriptions: ${missing.join(', ')}`,
    ).toEqual([]);
    expect(executableText).not.toMatch(/P[01]-S08-AC-|P2-S0[1-7]-AC-/u);
  });

  for (const id of acceptanceIds) {
    it(`[${id}] has a concrete executable evidence binding`, () => {
      expect(coveredIds, `No executable evidence for ${id}`).toContain(id);
    });
  }

  it('covers contract, worker, web, and persistence surfaces', () => {
    const missingSurfaces = Object.entries(surfaceEvidence)
      .filter(([, present]) => !present)
      .map(([surface]) => surface);
    expect(
      missingSurfaces,
      `Missing Slice 08 executable surfaces: ${missingSurfaces.join(', ')}`,
    ).toEqual([]);
  });

  it('does not use a legacy recovery slice as Slice 08 evidence', () => {
    expect(
      evidenceFiles.some((filePath) =>
        /release-recovery|recovery_readiness|P1-S07/iu.test(filePath),
      ),
    ).toBe(false);
    expect(
      evidenceFiles.map((filePath) => relative(ROOT, filePath)),
    ).not.toContain('tests/contracts/slice-07-acceptance-traceability.test.ts');
  });
});
