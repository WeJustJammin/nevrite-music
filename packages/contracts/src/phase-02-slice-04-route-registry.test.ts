import { describe, expect, it } from 'vitest';

import {
  activeRelationshipRoutePolicies,
  relationshipRoutePolicies,
  RelationshipOperationIdSchema,
} from './identity-authority/relationship-routes.ts';

const expectedActive = [
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

describe('Phase 2 Slice 04 relationship route registry', () => {
  it('P2-S04-AC-116 through AC-145 retain all thirty BE01c operation IDs', () => {
    expect(relationshipRoutePolicies).toHaveLength(30);
    expect(
      new Set(relationshipRoutePolicies.map(({ operationId }) => operationId))
        .size,
    ).toBe(30);
    for (const policy of relationshipRoutePolicies) {
      expect(RelationshipOperationIdSchema.parse(policy.operationId)).toBe(
        policy.operationId,
      );
    }
  });

  it('P2-S04-AC-003 through AC-062 mark only ORG/TYPE/MEM routes active for this slice', () => {
    expect(
      activeRelationshipRoutePolicies.map(({ operationId }) => operationId),
    ).toEqual(expectedActive);
    expect(activeRelationshipRoutePolicies.every(({ active }) => active)).toBe(
      true,
    );
    expect(
      relationshipRoutePolicies.filter(({ active }) => !active),
    ).toHaveLength(20);
  });

  it('P2-S04-AC-006/012/018/024/030/036/042/048/054/060 bind mutation headers only to mutations', () => {
    const reads = new Set([
      'ORG-02',
      'MEM-06',
      'REP-04',
      'AUTH-01',
      'GOV-02',
      'NAME-02',
      'TRE-01',
      'LIFE-05',
    ]);
    for (const policy of relationshipRoutePolicies) {
      if (reads.has(policy.operationId)) {
        expect(policy.idempotency).toBe('none');
        expect(policy.ifMatch).toBe('none');
      } else {
        expect(policy.idempotency).toBe('required');
        expect(policy.ifMatch).toBe(
          policy.operationId === 'ORG-01' ? 'none' : 'required',
        );
      }
    }
  });

  it('P2-S04-AC-009 gives ORG-02 the only anonymous public projection policy', () => {
    const publicPolicies = relationshipRoutePolicies.filter(
      ({ auth }) => auth === 'public',
    );
    expect(publicPolicies.map(({ operationId }) => operationId)).toEqual([
      'ORG-02',
    ]);
    expect(publicPolicies[0]).toMatchObject({
      method: 'GET',
      path: '/api/v1/organizations/{organizationId}',
      cacheControl: 'public, max-age=60',
      timeoutMs: 8_000,
    });
  });
});
