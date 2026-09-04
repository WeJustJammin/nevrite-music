import { describe, expect, it } from 'vitest';

import { identityAuthorityOperationMap } from './identity-authority-operation-map';

const relationshipEntry = identityAuthorityOperationMap.relationships;

describe('P2-S04 relationship operation and disclosure map', () => {
  it('[P2-S04-AC-003..062, AC-118..125] maps every ORG, TYPE, and MEM route to the relationship workbench', () => {
    expect(relationshipEntry.source).toBe(
      '01c-relationships-authority-governance.md',
    );
    expect(relationshipEntry.workbench).toBe(
      'RelationshipsAuthorityGovernanceWorkbench',
    );
    expect(relationshipEntry.operations).toEqual([
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
    ]);
  });

  it('[P2-S04-AC-063..097] owns request, resource, version, and provenance fields without dropping protected-state markers', () => {
    expect(relationshipEntry.fields).toEqual(
      expect.arrayContaining([
        'ApiError',
        'ETag',
        'idempotencyKey',
        'ifMatch',
        'expectedOrganizationVersion',
        'mode',
        'typeCodes',
        'typeCode',
        'organizationId',
        'organizationVersion',
        'ownershipState',
        'lifecycle',
        'assignmentId',
        'personId',
        'tenureId',
        'state',
        'provenance',
        'startsOn',
        'endsOn',
        'acceptedAt',
        'revokedAt',
        'termsVersionId',
        'termsHash',
        'capacity',
        'inviteExpiresAt',
        'evidenceRef',
        'counterpartConfirmationId',
        'reasonCode',
        'periodId',
        'version',
        'etag',
        'requestId',
        'correlationId',
        'registryVersion',
      ]),
    );
  });

  it('[P2-S04-AC-004..014, AC-016..026, AC-028..062, AC-098..115] maps validation, authority, concurrency, rate, and recovery errors explicitly', () => {
    expect(relationshipEntry.errors).toEqual(
      expect.arrayContaining([
        'INVALID_REQUEST',
        'VALIDATION_FAILED',
        'UNAUTHENTICATED',
        'FORBIDDEN',
        'NOT_FOUND',
        'RATE_LIMITED',
        'DEPENDENCY_UNAVAILABLE',
        'CONFLICT',
        'IDEMPOTENCY_MISMATCH',
        'VERSION_MISMATCH',
        'ORGANIZATION_TYPE_UNKNOWN',
        'ORGANIZATION_MODE_REQUIRED',
        'ORGANIZATION_VERSION_CONFLICT',
        'MEMBERSHIP_STATE_INVALID',
        'MEMBERSHIP_VERSION_CONFLICT',
        'MEMBERSHIP_ASSERTION_REJECTED',
        'TERMS_ACCEPTANCE_REQUIRED',
        'RETROACTIVE_END_CONFIRMATION_REQUIRED',
        'CAPACITY_OVERLAP',
        'DATE_INVALID',
        'PERIOD_INVALID',
        'EVIDENCE_REFERENCE_INVALID',
      ]),
    );
  });

  it('[P2-S04-AC-116..145] does not authorize protected relationship fields from client role labels or generic operation aliases', () => {
    expect(relationshipEntry.fields).not.toEqual(
      expect.arrayContaining(['role', 'owner', 'admin', 'capabilityGraph']),
    );
    expect(relationshipEntry.operations).not.toContain(
      'RELATIONSHIPS-AUTHORITY-GOVERNANCE-REGISTRY',
    );
  });
});
