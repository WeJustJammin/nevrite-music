import { describe, expect, it } from 'vitest';

import {
  CreateShadowByReferenceRequestSchema,
  RecordOwnershipCaseOutcomeRequestSchema,
  ProfileCommandPolicyRegistrySchema,
  profileCommandPolicies,
} from '@wejammin/contracts';

const partyId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d4';
const personId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d9';
const claimId = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';

describe('Phase 2 Slice 05 protected command contracts', () => {
  it('[P2-S05-AC-001, P2-S05-AC-061] keeps CMD-01 as a protected source command and CMD-02 as a typed non-HTTP boundary', () => {
    const command = {
      sourceDomain: 'projects',
      sourceEntityId: 'work-812',
      sourceVersion: '3',
      creatorPersonId: personId,
      actingPartyId: partyId,
      roleCode: 'performer',
      idempotencyKey: 'shadow-create-20260828',
    };
    const outcome = {
      callerShard: '06' as const,
      caseId: claimId,
      contestId: claimId,
      outcomeCode: 'uphold',
      expectedVersion: '2',
      idempotencyKey: 'outcome-record-01',
    };
    expect(CreateShadowByReferenceRequestSchema.parse(command)).toEqual(
      command,
    );
    expect(RecordOwnershipCaseOutcomeRequestSchema.parse(outcome)).toEqual(
      outcome,
    );
    expect(
      ProfileCommandPolicyRegistrySchema.parse(profileCommandPolicies),
    ).toEqual(profileCommandPolicies);
    expect(profileCommandPolicies[1]).toMatchObject({
      commandId: 'CMD-02',
      active: false,
      transport: 'protected',
      httpExposure: false,
    });
    expect(() =>
      ProfileCommandPolicyRegistrySchema.parse(
        profileCommandPolicies.map((policy) =>
          policy.commandId === 'CMD-02' ? { ...policy, active: true } : policy,
        ),
      ),
    ).toThrow();
    expect(() =>
      ProfileCommandPolicyRegistrySchema.parse(
        profileCommandPolicies.map((policy) => ({ ...policy, extra: true })),
      ),
    ).toThrow();
    expect(() =>
      CreateShadowByReferenceRequestSchema.parse({ ...command, headers: {} }),
    ).toThrow();
    expect(() =>
      CreateShadowByReferenceRequestSchema.parse({
        ...command,
        roleCode: undefined,
        instrumentCode: undefined,
      }),
    ).toThrow();
  });
});
