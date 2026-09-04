import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');

const readProjectFile = (relativePath: string): string =>
  readFileSync(resolve(ROOT, relativePath), 'utf8');

const acceptanceIds = Array.from(
  { length: 156 },
  (_, index) => `P2-S04-AC-${String(index + 1).padStart(3, '0')}`,
);

const redEvidenceFiles = [
  'tests/contracts/phase-02-slice-04-depth-audit.test.ts',
  'apps/worker/src/identity-authority/phase-02-slice-04-handler-hardening.test.ts',
  'apps/web/src/components/identity-authority/phase-02-slice-04-relationships-workbench.test.tsx',
  'tests/e2e/phase-02-slice-04-relationships.spec.ts',
  'supabase/tests/phase_02_slice_04_organizations.sql',
  'supabase/tests/phase_02_slice_04_memberships.sql',
] as const;

describe('Phase 2 Slice 04 acceptance traceability', () => {
  it('declares and matches all 156 authored acceptance criteria', () => {
    expect(acceptanceIds).toHaveLength(156);
    expect(new Set(acceptanceIds).size).toBe(156);

    const phasePlan = readProjectFile('.memory/wiki/specs/phases/phase-2.md');
    const planIds = [...phasePlan.matchAll(/P2-S04-AC-\d{3}/gu)].map(
      ([id]) => id,
    );
    expect(planIds).toEqual(acceptanceIds);
  });

  it('binds QA-RED through QA-GREEN to executable evidence', () => {
    for (const relativePath of redEvidenceFiles) {
      const source = readProjectFile(relativePath);
      expect(source.length, relativePath).toBeGreaterThan(100);
      expect(source, relativePath).toMatch(
        /(?:\b(?:it|test)(?:\.(?:describe|each))?\s*\(|\b(?:is|ok|isnt|like|unlike|throws_ok|lives_ok|has_[a-z_]+)\s*\()/u,
      );
    }
  });

  it('closes P2-S04-AC-155 and P2-S04-AC-156 with tracking evidence', () => {
    const sliceProgress = readProjectFile(
      '.memory/pipeline/progress/slices/phase-02-slice-04.md',
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

    expect(sliceProgress).toContain('- [x] **P2-S04-AC-155**');
    expect(sliceProgress).toContain('- [x] **P2-S04-AC-156**');
    expect(sliceProgress).toContain('## Completion Signature');
    expect(phaseProgress).toMatch(/- \[x\] \*\*Slice 04\*\*/u);
    const phaseTwoProgress = progressIndex.match(
      /\| Phase 2:[^\n]*\|[^\n]*\|\s*(\d+)\/17\s*\|/u,
    );
    expect(Number(phaseTwoProgress?.[1])).toBeGreaterThanOrEqual(4);
    expect(session).toMatch(/Slice 04 QA-GREEN and canonical validation/iu);
    expect(featureLedger).toMatch(/01\.02\.01[^\n]*P2-S04/u);
    expect(featureLedger).toMatch(/01\.02\.02[^\n]*P2-S04/u);
    expect(featureLedger).toMatch(/01\.03\.01[^\n]*P2-S04/u);
    expect(runbook).toMatch(
      /organization.*membership|membership.*organization/iu,
    );
    expect(architectureMap).toMatch(
      /Slice 04|organization type assignment|membership tenure/iu,
    );
  });
});
