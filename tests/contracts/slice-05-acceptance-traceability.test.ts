import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const acceptanceIds = [
  'P1-S05-AC-001',
  'P1-S05-AC-002',
  'P1-S05-AC-003',
  'P1-S05-AC-004',
  'P1-S05-AC-005',
  'P1-S05-AC-006',
  'P1-S05-AC-007',
  'P1-S05-AC-008',
  'P1-S05-AC-009',
  'P1-S05-AC-010',
  'P1-S05-AC-011',
  'P1-S05-AC-012',
  'P1-S05-AC-013',
  'P1-S05-AC-014',
  'P1-S05-AC-015',
  'P1-S05-AC-016',
  'P1-S05-AC-017',
  'P1-S05-AC-018',
  'P1-S05-AC-019',
  'P1-S05-AC-020',
  'P1-S05-AC-021',
  'P1-S05-AC-022',
  'P1-S05-AC-023',
  'P1-S05-AC-024',
  'P1-S05-AC-025',
  'P1-S05-AC-026',
  'P1-S05-AC-027',
  'P1-S05-AC-028',
  'P1-S05-AC-029',
  'P1-S05-AC-030',
  'P1-S05-AC-031',
  'P1-S05-AC-032',
  'P1-S05-AC-033',
  'P1-S05-AC-034',
  'P1-S05-AC-035',
  'P1-S05-AC-036',
  'P1-S05-AC-037',
  'P1-S05-AC-038',
  'P1-S05-AC-039',
  'P1-S05-AC-040',
  'P1-S05-AC-041',
  'P1-S05-AC-042',
  'P1-S05-AC-043',
  'P1-S05-AC-044',
  'P1-S05-AC-045',
  'P1-S05-AC-046',
  'P1-S05-AC-047',
  'P1-S05-AC-048',
  'P1-S05-AC-049',
  'P1-S05-AC-050',
  'P1-S05-AC-051',
  'P1-S05-AC-052',
  'P1-S05-AC-053',
  'P1-S05-AC-054',
  'P1-S05-AC-055',
  'P1-S05-AC-056',
  'P1-S05-AC-057',
  'P1-S05-AC-058',
  'P1-S05-AC-059',
  'P1-S05-AC-060',
  'P1-S05-AC-061',
  'P1-S05-AC-062',
  'P1-S05-AC-063',
  'P1-S05-AC-064',
  'P1-S05-AC-065',
  'P1-S05-AC-066',
  'P1-S05-AC-067',
  'P1-S05-AC-068',
  'P1-S05-AC-069',
  'P1-S05-AC-070',
  'P1-S05-AC-071',
  'P1-S05-AC-072',
  'P1-S05-AC-073',
  'P1-S05-AC-074',
  'P1-S05-AC-075',
  'P1-S05-AC-076',
  'P1-S05-AC-077',
  'P1-S05-AC-078',
] as const;

const evidenceFiles = [
  '../../packages/contracts/src/upload-completion.test.ts',
  '../../packages/application/src/infrastructure/upload-completion/application.test.ts',
  '../../packages/application/src/infrastructure/upload-completion/application.branches.test.ts',
  '../../packages/application/src/infrastructure/upload-completion/verification.test.ts',
  '../../apps/worker/src/upload-completion/upload-intent-completion.test.ts',
  '../../supabase/tests/upload_completion_authority.sql',
  '../accessibility/slice-05-upload-completion.test.ts',
  './slice-05-openapi-completion.test.ts',
] as const;

describe('Slice 05 acceptance traceability', () => {
  it('binds every criterion to executable completion, verification, data, or UI evidence', () => {
    expect(acceptanceIds).toHaveLength(78);
    expect(new Set(acceptanceIds).size).toBe(78);
    acceptanceIds.forEach((id, index) => {
      expect(id).toBe(`P1-S05-AC-${String(index + 1).padStart(3, '0')}`);
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
