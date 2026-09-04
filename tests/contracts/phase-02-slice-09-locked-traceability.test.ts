import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const read = (path: string): string =>
  readFileSync(resolve(ROOT, path), 'utf8');

const phasePlan = read('.memory/pipeline/progress/slices/phase-02-slice-09.md');
const be03a = read('.memory/wiki/specs/be/03a-content-schema-registry.md');
const ia03 = read('.memory/wiki/specs/ia/03-cms-content-modeling.md');
const fe03 = read('.memory/wiki/specs/fe/03-cms-content-modeling.md');
const be03b = read(
  '.memory/wiki/specs/be/03b-editorial-workflow-publication.md',
);
const be03c = read(
  '.memory/wiki/specs/be/03c-composition-taxonomy-localization.md',
);

const registryOperations = [
  'CMS-03A-01',
  'CMS-03A-02',
  'CMS-03A-03',
  'CMS-03A-04',
  'CMS-03A-05',
  'CMS-03A-06',
  'CMS-03A-07',
  'CMS-03A-08',
] as const;

const featureRows = [
  ['25.01.01', 'CMS-03A-01'],
  ['25.01.02', 'CMS-03A-02'],
  ['25.01.03', 'CMS-03A-03'],
  ['25.01.04', 'CMS-03A-04'],
  ['25.03.01', 'CMS-03A-05'],
] as const;

describe('[P2-S09-AC-269] locked cross-layer traceability', () => {
  it('maps every BE03a operation and feature-ledger row to the locked sources', () => {
    for (const operationId of registryOperations) {
      expect(phasePlan, operationId).toContain(operationId);
      expect(be03a, operationId).toContain(operationId);
      expect(fe03, operationId).toContain(operationId);
    }

    for (const [ledgerId, operationId] of featureRows) {
      const row = be03a.match(
        new RegExp(`${ledgerId}[\\s\\S]{0,320}${operationId}`, 'u'),
      );
      expect(row, `${ledgerId} -> ${operationId}`).not.toBeNull();
    }

    for (const acceptanceId of [
      'AC-CMS-01',
      'AC-CMS-02',
      'AC-CMS-03',
      'AC-CMS-04',
      'AC-CMS-10',
    ]) {
      expect(ia03, acceptanceId).toContain(acceptanceId);
    }
  });

  it('keeps FE ownership and 03b/03c consumed boundaries explicit', () => {
    expect(fe03).toContain('ContentSchemaRegistryWorkbench');
    expect(fe03).toContain('03a-content-schema-registry.md');
    expect(fe03).toContain('03b-editorial-workflow-publication.md');
    expect(fe03).toContain('03c-composition-taxonomy-localization.md');
    expect(be03b).toMatch(
      /03a remains the source of schema\/field\/relation compatibility/iu,
    );
    expect(be03c).toMatch(/BlockDefinitionVersion is owned by 03a/iu);
    expect(be03c).toMatch(/consumes.*03a.*safe registry/isu);
  });

  it('anchors AC269 itself to the engineering-standard traceability requirement', () => {
    expect(phasePlan).toMatch(
      /P2-S09-AC-269[^\n]*Trace all eight BE03a operations[^\n]*five feature-ledger rows[^\n]*IA CMS-01\/02\/03\/04\/10[^\n]*FE registry ownership[^\n]*BE03b\/03c/iu,
    );
  });
});
