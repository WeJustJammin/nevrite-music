import { describe, expect, it } from 'vitest';

import { identityAuthorityOperationMap } from './identity-authority-operation-map.ts';

type OperationEntry = Readonly<{
  source: string;
  workbench: string;
  operations: readonly string[];
}>;

const expectedRelationshipOperations = [
  'ORG-01',
  'ORG-02',
  'TYPE-01',
  'TYPE-02',
  'MEM-01',
  'MEM-02',
  'MEM-03',
  'MEM-04',
  'MEM-05',
  'MEM-06',
] as const;

const expectedLegacyOperations = [
  'IDL-API-01',
  'IDL-API-06',
  'IDL-API-02',
  'IDL-API-03',
  'IDL-API-04',
  'IDL-API-05',
  'IDL-API-07',
  'IDL-API-08',
  'IDL-API-09',
  'IDL-API-10',
  'IDL-API-11',
  'IDL-API-12',
  'IDL-API-13',
  'IDL-API-14',
  'IDL-API-15',
] as const;

const entries = Object.values(
  identityAuthorityOperationMap as unknown as Record<string, OperationEntry>,
);

const entryFor = (source: string, label: string): OperationEntry => {
  const entry = entries.find((candidate) => candidate.source === source);
  expect(entry, label).toBeDefined();
  return entry as OperationEntry;
};

const expectOperation = (
  entry: OperationEntry,
  expectedSource: string,
  expectedWorkbench: string,
  expectedOperations: readonly string[],
  operationId: string,
): void => {
  expect(entry).toMatchObject({
    source: expectedSource,
    workbench: expectedWorkbench,
  });
  expect(entry.operations).toEqual(expectedOperations);
  expect(entry.operations).toContain(operationId);
};

const relationshipsEntry = (): OperationEntry =>
  entryFor(
    '01c-relationships-authority-governance.md',
    '01c relationships operation map entry',
  );

const legacyEntry = (): OperationEntry =>
  entryFor('01d-identifiers-legacy.md', '01d identifiers operation map entry');

describe('P2-S03 API map B: relationships authority and legacy identifiers', () => {
  it('P2-S03-AC-271 maps the BE01c registry to RelationshipsAuthorityGovernanceWorkbench', () => {
    expectOperation(
      relationshipsEntry(),
      '01c-relationships-authority-governance.md',
      'RelationshipsAuthorityGovernanceWorkbench',
      expectedRelationshipOperations,
      'ORG-01',
    );
  });

  it('P2-S03-AC-272 maps IDL-API-01 to IdentifiersLegacyWorkbench', () => {
    expectOperation(
      legacyEntry(),
      '01d-identifiers-legacy.md',
      'IdentifiersLegacyWorkbench',
      expectedLegacyOperations,
      'IDL-API-01',
    );
  });

  it('P2-S03-AC-273 maps IDL-API-06 to IdentifiersLegacyWorkbench', () => {
    expectOperation(
      legacyEntry(),
      '01d-identifiers-legacy.md',
      'IdentifiersLegacyWorkbench',
      expectedLegacyOperations,
      'IDL-API-06',
    );
  });

  it('P2-S03-AC-274 maps IDL-API-02 to IdentifiersLegacyWorkbench', () => {
    expectOperation(
      legacyEntry(),
      '01d-identifiers-legacy.md',
      'IdentifiersLegacyWorkbench',
      expectedLegacyOperations,
      'IDL-API-02',
    );
  });

  it('P2-S03-AC-275 maps IDL-API-03 to IdentifiersLegacyWorkbench', () => {
    expectOperation(
      legacyEntry(),
      '01d-identifiers-legacy.md',
      'IdentifiersLegacyWorkbench',
      expectedLegacyOperations,
      'IDL-API-03',
    );
  });

  it('P2-S03-AC-276 maps IDL-API-04 to IdentifiersLegacyWorkbench', () => {
    expectOperation(
      legacyEntry(),
      '01d-identifiers-legacy.md',
      'IdentifiersLegacyWorkbench',
      expectedLegacyOperations,
      'IDL-API-04',
    );
  });

  it('P2-S03-AC-277 maps IDL-API-05 to IdentifiersLegacyWorkbench', () => {
    expectOperation(
      legacyEntry(),
      '01d-identifiers-legacy.md',
      'IdentifiersLegacyWorkbench',
      expectedLegacyOperations,
      'IDL-API-05',
    );
  });

  it('P2-S03-AC-278 maps IDL-API-07 to IdentifiersLegacyWorkbench', () => {
    expectOperation(
      legacyEntry(),
      '01d-identifiers-legacy.md',
      'IdentifiersLegacyWorkbench',
      expectedLegacyOperations,
      'IDL-API-07',
    );
  });

  it('P2-S03-AC-279 maps IDL-API-08 to IdentifiersLegacyWorkbench', () => {
    expectOperation(
      legacyEntry(),
      '01d-identifiers-legacy.md',
      'IdentifiersLegacyWorkbench',
      expectedLegacyOperations,
      'IDL-API-08',
    );
  });

  it('P2-S03-AC-280 maps IDL-API-09 to IdentifiersLegacyWorkbench', () => {
    expectOperation(
      legacyEntry(),
      '01d-identifiers-legacy.md',
      'IdentifiersLegacyWorkbench',
      expectedLegacyOperations,
      'IDL-API-09',
    );
  });

  it('P2-S03-AC-281 maps IDL-API-10 to IdentifiersLegacyWorkbench', () => {
    expectOperation(
      legacyEntry(),
      '01d-identifiers-legacy.md',
      'IdentifiersLegacyWorkbench',
      expectedLegacyOperations,
      'IDL-API-10',
    );
  });

  it('P2-S03-AC-282 maps IDL-API-11 to IdentifiersLegacyWorkbench', () => {
    expectOperation(
      legacyEntry(),
      '01d-identifiers-legacy.md',
      'IdentifiersLegacyWorkbench',
      expectedLegacyOperations,
      'IDL-API-11',
    );
  });

  it('P2-S03-AC-283 maps IDL-API-12 to IdentifiersLegacyWorkbench', () => {
    expectOperation(
      legacyEntry(),
      '01d-identifiers-legacy.md',
      'IdentifiersLegacyWorkbench',
      expectedLegacyOperations,
      'IDL-API-12',
    );
  });

  it('P2-S03-AC-284 maps IDL-API-13 to IdentifiersLegacyWorkbench', () => {
    expectOperation(
      legacyEntry(),
      '01d-identifiers-legacy.md',
      'IdentifiersLegacyWorkbench',
      expectedLegacyOperations,
      'IDL-API-13',
    );
  });

  it('P2-S03-AC-285 maps IDL-API-14 to IdentifiersLegacyWorkbench', () => {
    expectOperation(
      legacyEntry(),
      '01d-identifiers-legacy.md',
      'IdentifiersLegacyWorkbench',
      expectedLegacyOperations,
      'IDL-API-14',
    );
  });

  it('P2-S03-AC-286 maps IDL-API-15 to IdentifiersLegacyWorkbench', () => {
    expectOperation(
      legacyEntry(),
      '01d-identifiers-legacy.md',
      'IdentifiersLegacyWorkbench',
      expectedLegacyOperations,
      'IDL-API-15',
    );
  });
});
