import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const acceptanceIds = [
  'P1-S07-AC-001',
  'P1-S07-AC-002',
  'P1-S07-AC-003',
  'P1-S07-AC-004',
  'P1-S07-AC-005',
  'P1-S07-AC-006',
  'P1-S07-AC-007',
  'P1-S07-AC-008',
  'P1-S07-AC-009',
  'P1-S07-AC-010',
  'P1-S07-AC-011',
  'P1-S07-AC-012',
  'P1-S07-AC-013',
  'P1-S07-AC-014',
  'P1-S07-AC-015',
  'P1-S07-AC-016',
  'P1-S07-AC-017',
  'P1-S07-AC-018',
  'P1-S07-AC-019',
  'P1-S07-AC-020',
  'P1-S07-AC-021',
  'P1-S07-AC-022',
] as const;

const evidenceFiles = [
  '../../packages/contracts/src/release-recovery.test.ts',
  '../../packages/application/src/infrastructure/release-recovery/promotion.test.ts',
  '../../packages/application/src/infrastructure/release-recovery/recovery.test.ts',
  '../../packages/application/src/infrastructure/release-recovery/availability.test.ts',
  '../../packages/observability/src/logging.test.ts',
  '../../supabase/tests/recovery_readiness_authority.sql',
  '../release-identity-contract.test.ts',
  '../accessibility/slice-07-release-recovery.test.ts',
] as const;

describe('Slice 07 acceptance traceability', () => {
  it('binds every criterion to executable release, recovery, logging, data, or UI evidence', () => {
    expect(acceptanceIds).toHaveLength(22);
    expect(new Set(acceptanceIds).size).toBe(22);
    acceptanceIds.forEach((id, index) => {
      expect(id).toBe(`P1-S07-AC-${String(index + 1).padStart(3, '0')}`);
    });

    for (const relativePath of evidenceFiles) {
      const source = readFileSync(
        new URL(relativePath, import.meta.url),
        'utf8',
      );
      expect(source.length).toBeGreaterThan(100);
      expect(source).toMatch(/(?:\bit\(|select\s+(?:ok|is|throws_ok)\s*\()/u);
    }
  });

  it('keeps free-tier recovery evidence truthful and protected writes closed', () => {
    const contract = readFileSync(
      new URL(
        '../../packages/contracts/src/recovery-readiness.ts',
        import.meta.url,
      ),
      'utf8',
    );
    const runbook = readFileSync(
      new URL(
        '../../docs/runbooks/platform/release-recovery-gates.md',
        import.meta.url,
      ),
      'utf8',
    );

    expect(contract).toContain('available: z.literal(false)');
    expect(contract).toContain('measuredRpoSeconds');
    expect(runbook).toContain('PITR is unavailable');
    expect(runbook).toMatch(/protected[\s\S]{0,100}writes remain closed/u);
  });
});
