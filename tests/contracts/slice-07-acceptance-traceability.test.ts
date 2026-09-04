import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const ACCEPTANCE_COUNT = 176;
const acceptanceId = (number: number): string =>
  `P2-S07-AC-${String(number).padStart(3, '0')}`;
const acceptanceIds = Array.from({ length: ACCEPTANCE_COUNT }, (_, index) =>
  acceptanceId(index + 1),
);
const rangePattern =
  /P2-S07-AC-(\d{3})\s*(?:\.\.|…|–|—|-|\bthrough\b|\bto\b)\s*(?:P2-S07-AC-)?(\d{3})/gu;
const singleIdPattern = /P2-S07-AC-(\d{3})/gu;

const evidenceFiles = [
  '../../packages/contracts/src/platform-configuration/settings.test.ts',
  '../../tests/contracts/phase-02-slice-07-contracts.test.ts',
  '../../tests/contracts/phase-02-slice-07-telemetry.test.ts',
  '../../apps/worker/src/platform-configuration/phase-02-slice-07-success-validation.test.ts',
  '../../apps/worker/src/platform-configuration/phase-02-slice-07-auth-context.test.ts',
  '../../apps/worker/src/platform-configuration/phase-02-slice-07-idempotency-errors.test.ts',
  '../../apps/worker/src/platform-configuration/phase-02-slice-07-edge-cases.test.ts',
  '../../apps/worker/src/platform-configuration/phase-02-slice-07-route-mounts.test.ts',
  '../../apps/worker/src/platform-configuration/phase-02-slice-07-worker-security.test.ts',
  '../../apps/worker/src/platform-configuration/phase-02-slice-07-telemetry.test.ts',
  '../../apps/web/src/components/platform-configuration/phase-02-slice-07-frontend.test.tsx',
  '../../apps/web/src/components/platform-configuration/phase-02-slice-07-fe-security.test.tsx',
  '../../apps/web/src/components/platform-configuration/phase-02-slice-07-interactions.test.tsx',
  '../../apps/web/src/components/platform-configuration/phase-02-slice-07-boundaries.test.tsx',
  '../../apps/web/src/server/platform-configuration-context.test.ts',
  '../../supabase/tests/phase_02_slice_07_schema.sql',
  '../../supabase/tests/phase_02_slice_07_boundaries.sql',
  '../../supabase/tests/phase_02_slice_07_authority_security.sql',
  '../../supabase/tests/phase_02_slice_07_behavior.sql',
  '../../supabase/tests/phase_02_slice_07_deferred_controls.sql',
  '../e2e/phase-02-slice-07-behavior.spec.ts',
  './phase-02-slice-07-process-gates.test.ts',
] as const;

const withoutComments = (source: string): string =>
  source
    .replace(/\/\*[\s\S]*?\*\//gu, '')
    .replace(/^\s*\/\/.*$/gmu, '')
    .replace(/^\s*--.*$/gmu, '');

describe('Phase 2 Slice 07 acceptance traceability', () => {
  it('enumerates the complete locked Phase 2 criterion set without legacy aliases', () => {
    expect(acceptanceIds).toHaveLength(ACCEPTANCE_COUNT);
    expect(new Set(acceptanceIds).size).toBe(ACCEPTANCE_COUNT);
    expect(acceptanceIds[0]).toBe('P2-S07-AC-001');
    expect(acceptanceIds.at(-1)).toBe('P2-S07-AC-176');
  });

  it('binds every criterion to an executable Phase 2 test description', () => {
    const sources = evidenceFiles.map((relativePath) => {
      const source = readFileSync(
        new URL(relativePath, import.meta.url),
        'utf8',
      );
      expect(source).toMatch(
        /(?:\b(?:it|test)(?:\.[a-z]+)*\s*\(|select\s+(?:ok|is|throws_ok|lives_ok)\s*\()/u,
      );
      return withoutComments(source);
    });
    const executableText = sources.join('\n');
    const covered = new Set<string>();
    for (const match of executableText.matchAll(rangePattern)) {
      const start = Number(match[1]);
      const end = Number(match[2]);
      if (start > end) continue;
      for (
        let value = start;
        value <= end && value <= ACCEPTANCE_COUNT;
        value += 1
      ) {
        covered.add(acceptanceId(value));
      }
    }
    for (const match of executableText.matchAll(singleIdPattern)) {
      const value = Number(match[1]);
      if (value <= ACCEPTANCE_COUNT) covered.add(acceptanceId(value));
    }
    const missing = acceptanceIds.filter((id) => !covered.has(id));

    expect(
      missing,
      `Missing executable Phase 2 evidence descriptions: ${missing.join(', ')}`,
    ).toEqual([]);
    expect(executableText).not.toMatch(/P1-S07-AC-/u);
  });

  it('does not substitute the historical Phase 1 recovery slice for platform configuration', () => {
    expect(
      evidenceFiles.some((file) => file.includes('release-recovery')),
    ).toBe(false);
    expect(
      evidenceFiles.some((file) => file.includes('recovery_readiness')),
    ).toBe(false);
  });
});
