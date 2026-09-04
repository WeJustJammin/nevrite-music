import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');

const readProjectFile = (relativePath: string): string =>
  readFileSync(resolve(ROOT, relativePath), 'utf8');

const acceptanceIds = Array.from(
  { length: 301 },
  (_, index) => `P2-S03-AC-${String(index + 1).padStart(3, '0')}`,
);

const redEvidenceFiles = [
  'apps/worker/src/identity-authority/phase-02-slice-03-routes.test.ts',
  'tests/contracts/slice-03-platform-contracts.test.ts',
  'tests/contracts/slice-03-openapi-contract.test.ts',
  'tests/e2e/phase-02-slice-03-acting-context.spec.ts',
] as const;

describe('Phase 2 Slice 03 acceptance traceability', () => {
  it('declares and matches all 301 authored acceptance criteria', () => {
    expect(acceptanceIds).toHaveLength(301);
    expect(new Set(acceptanceIds).size).toBe(301);
    acceptanceIds.forEach((id, index) => {
      expect(id).toBe(`P2-S03-AC-${String(index + 1).padStart(3, '0')}`);
    });

    const phasePlan = readProjectFile('.memory/wiki/specs/phases/phase-2.md');
    const planIds = [...phasePlan.matchAll(/P2-S03-AC-\d{3}/gu)].map(
      ([id]) => id,
    );
    expect(planIds).toEqual(acceptanceIds);
  });

  it('binds the RED proof to executable contract and browser evidence', () => {
    for (const relativePath of redEvidenceFiles) {
      const source = readProjectFile(relativePath);
      expect(source.length, relativePath).toBeGreaterThan(100);
      expect(source, relativePath).toMatch(
        /(?:\b(?:it|test)(?:\.(?:describe|each))?\s*\()/u,
      );
    }
  });

  it('requires tracking, feature-ledger, runbook, and architecture-map evidence', () => {
    const sliceProgress = readProjectFile(
      '.memory/pipeline/progress/slices/phase-02-slice-03.md',
    );
    const phaseProgress = readProjectFile(
      '.memory/pipeline/progress/phases/phase-02.md',
    );
    const progressIndex = readProjectFile('.memory/pipeline/progress/index.md');
    const session = readProjectFile(
      '.memory/pipeline/progress/sessions/2026-09-01.md',
    );
    const featureLedger = readProjectFile(
      '.memory/wiki/specs/feature-ledger.md',
    );
    const runbook = readProjectFile(
      '.memory/wiki/operations/runbooks/identity-authority.md',
    );
    const architectureMap = readProjectFile('docs/ARCHITECTURE.md');

    expect(sliceProgress).toContain('P2-S03-AC-300');
    expect(sliceProgress).toContain('P2-S03-AC-301');
    expect(sliceProgress).toContain('## Completion Signature');
    expect(phaseProgress).toMatch(/- \[x\] \*\*Slice 03\*\*/u);
    expect(progressIndex).toMatch(/\b(?:[3-9]|1[0-7])\/17\b/u);
    expect(session).toMatch(/Slice 03 RED proof retained/iu);
    expect(featureLedger).toMatch(/01\.01\.03[^\n]*P2-S03/u);
    expect(runbook).toMatch(/acting context|identity authority/iu);
    expect(architectureMap).toMatch(
      /Slice 03|acting context|identity.authority/iu,
    );
  });
});
