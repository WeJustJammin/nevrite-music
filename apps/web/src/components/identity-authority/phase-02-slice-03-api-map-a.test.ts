import { describe, expect, it } from 'vitest';

import { identityAuthorityOperationMap } from './identity-authority-operation-map.ts';

type OperationEntry = Readonly<{
  source: string;
  workbench: string;
  operations: readonly string[];
}>;

const expectedAuthOperations = [
  'AUTH-API-01',
  'AUTH-API-02',
  'AUTH-API-03',
  'AUTH-API-04',
  'AUTH-API-05',
  'AUTH-API-06',
  'AUTH-API-07',
  'AUTH-API-08',
  'AUTH-API-09',
  'AUTH-API-10',
  'AUTH-API-11',
  'AUTH-API-12',
  'AUTH-API-13',
  'AUTH-API-14',
  'AUTH-API-15',
] as const;

const entries = Object.values(
  identityAuthorityOperationMap as unknown as Record<string, OperationEntry>,
);

const authEntry = (): OperationEntry => {
  const entry = entries.find(
    (candidate) => candidate.source === '01a-auth-account-linking.md',
  );
  expect(entry, '01a auth operation map entry').toBeDefined();
  return entry as OperationEntry;
};

const aliasesEntry = (): OperationEntry => {
  const entry = entries.find(
    (candidate) => candidate.source === '01b-party-identity-aliases.md',
  );
  expect(entry, '01b aliases operation map entry').toBeDefined();
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

describe('P2-S03 API map A: authentication and party aliases', () => {
  it('P2-S03-AC-255 maps AUTH-API-01 to AuthAccountLinkingWorkbench', () => {
    expectOperation(
      authEntry(),
      '01a-auth-account-linking.md',
      'AuthAccountLinkingWorkbench',
      expectedAuthOperations,
      'AUTH-API-01',
    );
  });

  it('P2-S03-AC-256 maps AUTH-API-02 to AuthAccountLinkingWorkbench', () => {
    expectOperation(
      authEntry(),
      '01a-auth-account-linking.md',
      'AuthAccountLinkingWorkbench',
      expectedAuthOperations,
      'AUTH-API-02',
    );
  });

  it('P2-S03-AC-257 maps AUTH-API-03 to AuthAccountLinkingWorkbench', () => {
    expectOperation(
      authEntry(),
      '01a-auth-account-linking.md',
      'AuthAccountLinkingWorkbench',
      expectedAuthOperations,
      'AUTH-API-03',
    );
  });

  it('P2-S03-AC-258 maps AUTH-API-04 to AuthAccountLinkingWorkbench', () => {
    expectOperation(
      authEntry(),
      '01a-auth-account-linking.md',
      'AuthAccountLinkingWorkbench',
      expectedAuthOperations,
      'AUTH-API-04',
    );
  });

  it('P2-S03-AC-259 maps AUTH-API-05 to AuthAccountLinkingWorkbench', () => {
    expectOperation(
      authEntry(),
      '01a-auth-account-linking.md',
      'AuthAccountLinkingWorkbench',
      expectedAuthOperations,
      'AUTH-API-05',
    );
  });

  it('P2-S03-AC-260 maps AUTH-API-06 to AuthAccountLinkingWorkbench', () => {
    expectOperation(
      authEntry(),
      '01a-auth-account-linking.md',
      'AuthAccountLinkingWorkbench',
      expectedAuthOperations,
      'AUTH-API-06',
    );
  });

  it('P2-S03-AC-261 maps AUTH-API-07 to AuthAccountLinkingWorkbench', () => {
    expectOperation(
      authEntry(),
      '01a-auth-account-linking.md',
      'AuthAccountLinkingWorkbench',
      expectedAuthOperations,
      'AUTH-API-07',
    );
  });

  it('P2-S03-AC-262 maps AUTH-API-08 to AuthAccountLinkingWorkbench', () => {
    expectOperation(
      authEntry(),
      '01a-auth-account-linking.md',
      'AuthAccountLinkingWorkbench',
      expectedAuthOperations,
      'AUTH-API-08',
    );
  });

  it('P2-S03-AC-263 maps AUTH-API-09 to AuthAccountLinkingWorkbench', () => {
    expectOperation(
      authEntry(),
      '01a-auth-account-linking.md',
      'AuthAccountLinkingWorkbench',
      expectedAuthOperations,
      'AUTH-API-09',
    );
  });

  it('P2-S03-AC-264 maps AUTH-API-10 to AuthAccountLinkingWorkbench', () => {
    expectOperation(
      authEntry(),
      '01a-auth-account-linking.md',
      'AuthAccountLinkingWorkbench',
      expectedAuthOperations,
      'AUTH-API-10',
    );
  });

  it('P2-S03-AC-265 maps AUTH-API-11 to AuthAccountLinkingWorkbench', () => {
    expectOperation(
      authEntry(),
      '01a-auth-account-linking.md',
      'AuthAccountLinkingWorkbench',
      expectedAuthOperations,
      'AUTH-API-11',
    );
  });

  it('P2-S03-AC-266 maps AUTH-API-12 to AuthAccountLinkingWorkbench', () => {
    expectOperation(
      authEntry(),
      '01a-auth-account-linking.md',
      'AuthAccountLinkingWorkbench',
      expectedAuthOperations,
      'AUTH-API-12',
    );
  });

  it('P2-S03-AC-267 maps AUTH-API-13 to AuthAccountLinkingWorkbench', () => {
    expectOperation(
      authEntry(),
      '01a-auth-account-linking.md',
      'AuthAccountLinkingWorkbench',
      expectedAuthOperations,
      'AUTH-API-13',
    );
  });

  it('P2-S03-AC-268 maps AUTH-API-14 to AuthAccountLinkingWorkbench', () => {
    expectOperation(
      authEntry(),
      '01a-auth-account-linking.md',
      'AuthAccountLinkingWorkbench',
      expectedAuthOperations,
      'AUTH-API-14',
    );
  });

  it('P2-S03-AC-269 maps AUTH-API-15 to AuthAccountLinkingWorkbench', () => {
    expectOperation(
      authEntry(),
      '01a-auth-account-linking.md',
      'AuthAccountLinkingWorkbench',
      expectedAuthOperations,
      'AUTH-API-15',
    );
  });

  it('P2-S03-AC-270 maps BE01b AUTH-API-07 to PartyIdentityAliasesWorkbench', () => {
    expectOperation(
      aliasesEntry(),
      '01b-party-identity-aliases.md',
      'PartyIdentityAliasesWorkbench',
      ['AUTH-API-07'],
      'AUTH-API-07',
    );
  });
});
