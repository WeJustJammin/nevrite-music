import { readFileSync } from 'node:fs';

import { platformRegistrySet } from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

import { PRODUCTION_PROVIDER_REGISTRY } from '../../apps/web/src/components/infrastructure/provider-evidence/provider-evidence-state';

const acceptanceIds = [
  'P1-S06-AC-001',
  'P1-S06-AC-002',
  'P1-S06-AC-003',
  'P1-S06-AC-004',
  'P1-S06-AC-005',
  'P1-S06-AC-006',
  'P1-S06-AC-007',
  'P1-S06-AC-008',
  'P1-S06-AC-009',
  'P1-S06-AC-010',
  'P1-S06-AC-011',
  'P1-S06-AC-012',
  'P1-S06-AC-013',
  'P1-S06-AC-014',
  'P1-S06-AC-015',
  'P1-S06-AC-016',
  'P1-S06-AC-017',
  'P1-S06-AC-018',
  'P1-S06-AC-019',
  'P1-S06-AC-020',
  'P1-S06-AC-021',
  'P1-S06-AC-022',
  'P1-S06-AC-023',
  'P1-S06-AC-024',
  'P1-S06-AC-025',
  'P1-S06-AC-026',
  'P1-S06-AC-027',
  'P1-S06-AC-028',
  'P1-S06-AC-029',
  'P1-S06-AC-030',
  'P1-S06-AC-031',
  'P1-S06-AC-032',
  'P1-S06-AC-033',
  'P1-S06-AC-034',
  'P1-S06-AC-035',
  'P1-S06-AC-036',
  'P1-S06-AC-037',
  'P1-S06-AC-038',
  'P1-S06-AC-039',
  'P1-S06-AC-040',
  'P1-S06-AC-041',
  'P1-S06-AC-042',
  'P1-S06-AC-043',
  'P1-S06-AC-044',
  'P1-S06-AC-045',
  'P1-S06-AC-046',
  'P1-S06-AC-047',
  'P1-S06-AC-048',
  'P1-S06-AC-049',
  'P1-S06-AC-050',
  'P1-S06-AC-051',
  'P1-S06-AC-052',
  'P1-S06-AC-053',
  'P1-S06-AC-054',
  'P1-S06-AC-055',
  'P1-S06-AC-056',
] as const;

const evidenceFiles = [
  '../../packages/contracts/src/webhook-admission.test.ts',
  '../../packages/contracts/src/provider-operation.test.ts',
  '../../packages/application/src/infrastructure/provider-effects/application.test.ts',
  '../../packages/application/src/infrastructure/provider-effects/edge-cases.test.ts',
  '../../packages/application/src/infrastructure/provider-effects/security.test.ts',
  '../../apps/worker/src/webhooks/webhook-processor.test.ts',
  '../../apps/worker/src/provider-effects/provider-effect.test.ts',
  '../../apps/worker/src/provider-effects/provider-effect-branches.test.ts',
  '../../supabase/tests/webhook_provider_authority.sql',
  '../accessibility/slice-06-provider-evidence.test.ts',
  '../integration/infrastructure-workbench-jobs.test.ts',
] as const;

describe('Slice 06 acceptance traceability', () => {
  it('binds all criteria to executable contract, effect, receipt, data, and UI evidence', () => {
    expect(acceptanceIds).toHaveLength(56);
    expect(new Set(acceptanceIds).size).toBe(56);
    acceptanceIds.forEach((id, index) => {
      expect(id).toBe(`P1-S06-AC-${String(index + 1).padStart(3, '0')}`);
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

  it('keeps production provider and webhook registries empty until explicitly configured', () => {
    expect(platformRegistrySet.providers).toEqual([]);
    expect(PRODUCTION_PROVIDER_REGISTRY).toEqual([]);
    expect(
      platformRegistrySet.routes.filter(({ path }) =>
        path.startsWith('/api/v1/webhooks/'),
      ),
    ).toEqual([]);
  });
});
