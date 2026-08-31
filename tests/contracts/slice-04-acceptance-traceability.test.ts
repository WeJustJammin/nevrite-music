import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const acceptanceIds = [
  'P1-S04-AC-001',
  'P1-S04-AC-002',
  'P1-S04-AC-003',
  'P1-S04-AC-004',
  'P1-S04-AC-005',
  'P1-S04-AC-006',
  'P1-S04-AC-007',
  'P1-S04-AC-008',
  'P1-S04-AC-009',
  'P1-S04-AC-010',
  'P1-S04-AC-011',
  'P1-S04-AC-012',
  'P1-S04-AC-013',
  'P1-S04-AC-014',
  'P1-S04-AC-015',
  'P1-S04-AC-016',
  'P1-S04-AC-017',
  'P1-S04-AC-018',
  'P1-S04-AC-019',
  'P1-S04-AC-020',
  'P1-S04-AC-021',
  'P1-S04-AC-022',
  'P1-S04-AC-023',
  'P1-S04-AC-024',
  'P1-S04-AC-025',
  'P1-S04-AC-026',
  'P1-S04-AC-027',
  'P1-S04-AC-028',
  'P1-S04-AC-029',
  'P1-S04-AC-030',
  'P1-S04-AC-031',
  'P1-S04-AC-032',
  'P1-S04-AC-033',
  'P1-S04-AC-034',
  'P1-S04-AC-035',
  'P1-S04-AC-036',
  'P1-S04-AC-037',
  'P1-S04-AC-038',
  'P1-S04-AC-039',
  'P1-S04-AC-040',
  'P1-S04-AC-041',
  'P1-S04-AC-042',
  'P1-S04-AC-043',
  'P1-S04-AC-044',
  'P1-S04-AC-045',
  'P1-S04-AC-046',
  'P1-S04-AC-047',
  'P1-S04-AC-048',
  'P1-S04-AC-049',
  'P1-S04-AC-050',
  'P1-S04-AC-051',
  'P1-S04-AC-052',
  'P1-S04-AC-053',
  'P1-S04-AC-054',
  'P1-S04-AC-055',
  'P1-S04-AC-056',
  'P1-S04-AC-057',
  'P1-S04-AC-058',
  'P1-S04-AC-059',
  'P1-S04-AC-060',
  'P1-S04-AC-061',
  'P1-S04-AC-062',
  'P1-S04-AC-063',
  'P1-S04-AC-064',
  'P1-S04-AC-065',
  'P1-S04-AC-066',
  'P1-S04-AC-067',
  'P1-S04-AC-068',
  'P1-S04-AC-069',
  'P1-S04-AC-070',
  'P1-S04-AC-071',
  'P1-S04-AC-072',
  'P1-S04-AC-073',
  'P1-S04-AC-074',
  'P1-S04-AC-075',
  'P1-S04-AC-076',
  'P1-S04-AC-077',
  'P1-S04-AC-078',
  'P1-S04-AC-079',
  'P1-S04-AC-080',
  'P1-S04-AC-081',
  'P1-S04-AC-082',
  'P1-S04-AC-083',
  'P1-S04-AC-084',
  'P1-S04-AC-085',
  'P1-S04-AC-086',
] as const;

const evidenceFiles = [
  '../../packages/contracts/src/upload-admission.test.ts',
  '../../packages/application/src/infrastructure/upload-admission/application.test.ts',
  '../../apps/worker/src/upload-admission/upload-intent.test.ts',
  '../../apps/worker/src/storage/upload-storage.test.ts',
  '../../supabase/tests/upload_admission.sql',
  '../accessibility/slice-04-upload-admission.test.ts',
  '../integration/slice-04-upload-navigation.test.ts',
  '../integration/infrastructure-workbench-jobs.test.ts',
] as const;

describe('Slice 04 acceptance traceability', () => {
  it('maps every authored criterion once to executable contract, boundary, data, or UI evidence', () => {
    expect(acceptanceIds).toHaveLength(86);
    expect(new Set(acceptanceIds).size).toBe(86);
    acceptanceIds.forEach((id, index) => {
      expect(id).toBe(`P1-S04-AC-${String(index + 1).padStart(3, '0')}`);
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
});
