import { describe, expect, it } from 'vitest';

import {
  AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_ALGORITHM,
  AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_DOMAIN,
  AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_SCHEMA_VERSION,
  ApprovedRunnerMappingAttestationV1Schema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-runner-mapping-attestation.ts';

const mappingId = '40000000-0000-4000-8000-000000000004';
const runId = '40000000-0000-4000-8000-000000000005';
const mappingSha256 = 'a'.repeat(64);
const signature = `${'A'.repeat(86)}==`;

const attestation = {
  schemaVersion: AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_SCHEMA_VERSION,
  domain: AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_DOMAIN,
  algorithm: AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_ALGORITHM,
  keyId: 'ac265-runner-mapping-v1',
  mappingId,
  runId,
  mappingSha256,
  issuedAt: '2026-09-21T10:00:00.000Z',
  expiresAt: '2026-09-21T10:05:00.000Z',
  signature,
} as const;

describe('AC265 approved runner mapping attestation contract', () => {
  it('accepts a strict, domain-separated Ed25519 V1 attestation at the five-minute boundary', () => {
    const parsed = ApprovedRunnerMappingAttestationV1Schema.parse(attestation);

    expect(parsed).toEqual(attestation);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_SCHEMA_VERSION).toBe(
      'ac265-approved-runner-mapping-attestation-v1',
    );
    expect(AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_DOMAIN).toBe(
      'WEJAMMIN-AC265-APPROVED-RUNNER-MAPPING-V1',
    );
    expect(AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_ALGORITHM).toBe('Ed25519');
  });

  it('binds the mapping identity, run identity, and canonical lowercase mapping digest', () => {
    for (const candidate of [
      { ...attestation, mappingId: 'not a safe id' },
      { ...attestation, mappingId: 'ac265-safe-but-not-a-uuid' },
      { ...attestation, mappingId: '40000000-0000-1000-8000-000000000004' },
      { ...attestation, runId: 'not-a-uuid' },
      { ...attestation, mappingSha256: 'A'.repeat(64) },
      { ...attestation, mappingSha256: 'b'.repeat(63) },
      { ...attestation, keyId: 'not valid key id!' },
    ])
      expect(
        ApprovedRunnerMappingAttestationV1Schema.safeParse(candidate).success,
      ).toBe(false);
  });

  it('rejects a different signing domain, algorithm, or unknown field', () => {
    for (const candidate of [
      { ...attestation, domain: 'WEJAMMIN-OTHER-DOMAIN-V1' },
      { ...attestation, algorithm: 'Ed448' },
      { ...attestation, unexpected: true },
    ])
      expect(
        ApprovedRunnerMappingAttestationV1Schema.safeParse(candidate).success,
      ).toBe(false);
  });

  it('rejects noncanonical Ed25519 signatures at the contract boundary', () => {
    const noncanonicalSignature = `${'B'.repeat(86)}==`;
    expect(
      ApprovedRunnerMappingAttestationV1Schema.safeParse({
        ...attestation,
        signature: noncanonicalSignature,
      }).success,
    ).toBe(false);
  });

  it('requires a positive issued-at to expiry window no longer than five minutes', () => {
    const cases = [
      {
        candidate: { ...attestation, expiresAt: attestation.issuedAt },
        path: ['expiresAt'],
      },
      {
        candidate: {
          ...attestation,
          expiresAt: '2026-09-21T09:59:59.999Z',
        },
        path: ['expiresAt'],
      },
      {
        candidate: {
          ...attestation,
          expiresAt: '2026-09-21T10:05:00.001Z',
        },
        path: ['expiresAt'],
      },
    ];

    for (const { candidate, path } of cases) {
      const parsed =
        ApprovedRunnerMappingAttestationV1Schema.safeParse(candidate);
      expect(parsed.success).toBe(false);
      if (parsed.success)
        throw new Error('Invalid attestation window must be rejected.');
      expect(parsed.error.issues).toContainEqual(
        expect.objectContaining({ code: 'custom', path }),
      );
    }
  });
});
