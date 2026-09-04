import { describe, expect, it } from 'vitest';

import * as contracts from '../../packages/contracts/src/index.ts';
import {
  s08GrantRequest,
  s08Id,
  s08OtherId,
} from './phase-02-slice-08-contract-fixtures.ts';

type SchemaLike = {
  safeParse: (input: unknown) => { success: boolean };
};

const grantSchema =
  contracts.Cfg05b04CapabilityActionRequestSchema as SchemaLike;

const withScope = (scope: unknown): unknown => ({
  ...s08GrantRequest,
  scope,
});

describe('S08 capability grant scope security', () => {
  it('[P2-S08-SEC-001] binds grants to the canonical acting-party scope key', () => {
    expect(
      grantSchema.safeParse(withScope({ actingPartyId: s08Id })).success,
    ).toBe(true);

    for (const scope of [
      {},
      { actingParyId: s08Id },
      { party: s08Id },
      { acting_party_id: s08Id },
      { actingPartyId: s08Id, userId: s08OtherId },
    ]) {
      expect(grantSchema.safeParse(withScope(scope)).success).toBe(false);
    }
  });

  it('[P2-S08-SEC-002] bounds purpose grants to one exact recovery target', () => {
    const purposeGrant = {
      ...s08GrantRequest,
      scope: { actingPartyId: s08Id },
      purposeGrant: true,
      resourceType: 'case',
      actions: ['support.case.recover'],
    };

    expect(grantSchema.safeParse(purposeGrant).success).toBe(true);
    expect(
      grantSchema.safeParse({
        ...purposeGrant,
        resourceType: 'content.entry',
      }).success,
    ).toBe(false);
    expect(
      grantSchema.safeParse({
        ...purposeGrant,
        resourceType: 'case.*',
      }).success,
    ).toBe(false);
    expect(
      grantSchema.safeParse({
        ...purposeGrant,
        actions: ['content.publish'],
      }).success,
    ).toBe(false);
  });
});
