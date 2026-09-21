import { describe, expect, it } from 'vitest';

import {
  AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_ALGORITHM,
  AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_DOMAIN,
  AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_SCHEMA_VERSION,
  ApprovedOutageTargetAttestationV1Schema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-outage-target-attestation.ts';
import {
  AC265_APPROVED_OUTAGE_TARGET_SCHEMA_VERSION,
  AC265_APPROVED_OUTAGE_TARGET_SOURCE,
  ApprovedOutageTargetV1Schema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-outage-target.ts';
import { Ac265OutageLeaseTargetReferenceSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-outage-lease-control.ts';

const targetId = '30000000-0000-4000-8000-000000000003';
const targetRef = `ac265-outage-target://staging/${targetId}`;
const runId = '30000000-0000-4000-8000-000000000004';

const target = {
  schemaVersion: AC265_APPROVED_OUTAGE_TARGET_SCHEMA_VERSION,
  source: AC265_APPROVED_OUTAGE_TARGET_SOURCE,
  targetId,
  targetRef,
  approvedAt: '2026-09-21T10:00:00.000Z',
  expiresAt: '2026-09-21T10:30:00.000Z',
  scope: {
    runId,
    hostingProjectId: 'wejammin-staging',
    supabaseProjectRef: 'abcdefghijklmnopqrst',
    deploymentId: 'deployment-20260921',
    dependencyId: 'content-schema-registry',
    route: {
      operationId: 'CMS-03A-06',
      method: 'GET',
      path: '/api/v1/cms/content-types',
    },
  },
} as const;

const attestation = {
  schemaVersion: AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_SCHEMA_VERSION,
  domain: AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_DOMAIN,
  algorithm: AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_ALGORITHM,
  keyId: 'ac265-outage-target-v1',
  targetRef,
  runId,
  targetSha256: 'a'.repeat(64),
  issuedAt: '2026-09-21T10:00:00.000Z',
  expiresAt: '2026-09-21T10:05:00.000Z',
  signature: `${'A'.repeat(86)}==`,
} as const;

describe('AC265 approved outage-target attestation contract', () => {
  it('accepts a strict target with a v4 id, exact reference, scope run, and positive target window', () => {
    const parsed = ApprovedOutageTargetV1Schema.parse(target);

    expect(parsed).toEqual(target);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.scope)).toBe(true);
    expect(Ac265OutageLeaseTargetReferenceSchema.parse(targetRef)).toBe(
      targetRef,
    );
  });

  it('rejects target references that do not identify the exact target id', () => {
    for (const candidate of [
      { ...target, targetId: '30000000-0000-1000-8000-000000000003' },
      {
        ...target,
        targetRef:
          'ac265-outage-target://staging/30000000-0000-4000-8000-000000000005',
      },
      {
        ...target,
        targetRef:
          'ac265-outage-target://production/30000000-0000-4000-8000-000000000003',
      },
    ])
      expect(ApprovedOutageTargetV1Schema.safeParse(candidate).success).toBe(
        false,
      );
  });

  it('rejects malformed, reversed, and unknown target fields', () => {
    for (const candidate of [
      { ...target, targetId: 'not-a-uuid' },
      { ...target, targetId: '30000000-0000-4000-c000-000000000003' },
      { ...target, approvedAt: '2026-09-21T10:30:00.000Z' },
      { ...target, expiresAt: '2026-09-21T10:00:00.000Z' },
      { ...target, unexpected: true },
    ])
      expect(ApprovedOutageTargetV1Schema.safeParse(candidate).success).toBe(
        false,
      );
  });

  it('accepts a strict Ed25519 attestation at the five-minute boundary', () => {
    const parsed = ApprovedOutageTargetAttestationV1Schema.parse(attestation);

    expect(parsed).toEqual(attestation);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_SCHEMA_VERSION).toBe(
      'ac265-approved-outage-target-attestation-v1',
    );
    expect(AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_DOMAIN).toBe(
      'WEJAMMIN-AC265-APPROVED-OUTAGE-TARGET-V1',
    );
    expect(AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_ALGORITHM).toBe('Ed25519');
  });

  it('binds target reference, run identity, lowercase digest, and strict fields', () => {
    for (const candidate of [
      { ...attestation, targetRef: 'ac265-outage-target://staging/not-a-uuid' },
      { ...attestation, runId: 'not-a-uuid' },
      { ...attestation, targetSha256: 'A'.repeat(64) },
      { ...attestation, targetSha256: 'b'.repeat(63) },
      { ...attestation, keyId: 'not valid key id!' },
      { ...attestation, unexpected: true },
      { ...attestation, domain: 'WEJAMMIN-OTHER-DOMAIN-V1' },
      { ...attestation, algorithm: 'Ed448' },
    ])
      expect(
        ApprovedOutageTargetAttestationV1Schema.safeParse(candidate).success,
      ).toBe(false);
  });

  it('requires a positive attestation lifetime no longer than five minutes', () => {
    for (const candidate of [
      { ...attestation, expiresAt: attestation.issuedAt },
      { ...attestation, expiresAt: '2026-09-21T09:59:59.999Z' },
      { ...attestation, expiresAt: '2026-09-21T10:05:00.001Z' },
    ]) {
      const parsed =
        ApprovedOutageTargetAttestationV1Schema.safeParse(candidate);
      expect(parsed.success).toBe(false);
      if (parsed.success)
        throw new Error('Invalid attestation window must be rejected.');
      expect(parsed.error.issues).toContainEqual(
        expect.objectContaining({ code: 'custom', path: ['expiresAt'] }),
      );
    }
  });
});
