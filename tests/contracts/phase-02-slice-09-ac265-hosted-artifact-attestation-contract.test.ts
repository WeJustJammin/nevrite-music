import { describe, expect, it } from 'vitest';

import {
  AC265_HOSTED_ARTIFACT_ATTESTATION_ALGORITHM,
  AC265_HOSTED_ARTIFACT_ATTESTATION_DOMAIN,
  AC265_HOSTED_ARTIFACT_ATTESTATION_SCHEMA_VERSION,
  HostedArtifactAttestationV1Schema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-attestation.ts';
import * as contentSchemaRegistry from '../../packages/contracts/src/content-schema-registry/index.ts';
import * as contracts from '../../packages/contracts/src/index.ts';
import { ContentSchemaRegistryHostedRunnerContractSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import { makeContract } from './ac265-hosted-test-fixtures.ts';

const runId = '70000000-0000-4000-8000-000000000007';
const artifactSha256 = 'a'.repeat(64);
const candidateIdentitySha256 = 'b'.repeat(64);
const runnerContractSha256 = 'c'.repeat(64);
const subjectSha256 = 'd'.repeat(64);
const signature = `${'A'.repeat(86)}==`;
const keyId = 'ac265-hosted-artifact-v1';

const serverReceiptAttestation = {
  schemaVersion: AC265_HOSTED_ARTIFACT_ATTESTATION_SCHEMA_VERSION,
  domain: AC265_HOSTED_ARTIFACT_ATTESTATION_DOMAIN,
  algorithm: AC265_HOSTED_ARTIFACT_ATTESTATION_ALGORITHM,
  keyId,
  kind: 'server_receipt',
  artifactRef: 'ac265-receipt://server/70000000-0000-4000-8000-000000000008',
  artifactSha256,
  runId,
  candidateIdentitySha256,
  runnerContractSha256,
  subjectSha256,
  issuedAt: '2026-09-21T10:00:00.000Z',
  expiresAt: '2026-09-21T10:05:00.000Z',
  signature,
} as const;

const executionEvidenceAttestation = {
  ...serverReceiptAttestation,
  kind: 'execution_evidence',
  artifactRef: 'ac265-evidence://blob/70000000-0000-4000-8000-000000000009',
} as const;

describe('AC265 hosted artifact-attestation contract', () => {
  it('accepts strict, readonly server-receipt and execution-evidence envelopes at the five-minute boundary', () => {
    for (const candidate of [
      serverReceiptAttestation,
      executionEvidenceAttestation,
    ]) {
      const parsed = HostedArtifactAttestationV1Schema.parse(candidate);

      expect(parsed).toEqual(candidate);
      expect(Object.isFrozen(parsed)).toBe(true);
    }

    expect(AC265_HOSTED_ARTIFACT_ATTESTATION_SCHEMA_VERSION).toBe(
      'ac265-hosted-artifact-attestation-v1',
    );
    expect(AC265_HOSTED_ARTIFACT_ATTESTATION_DOMAIN).toBe(
      'WEJAMMIN-AC265-HOSTED-ARTIFACT-V1',
    );
    expect(AC265_HOSTED_ARTIFACT_ATTESTATION_ALGORITHM).toBe('Ed25519');
    expect(contentSchemaRegistry.HostedArtifactAttestationV1Schema).toBe(
      HostedArtifactAttestationV1Schema,
    );
    expect(contracts.HostedArtifactAttestationV1Schema).toBe(
      HostedArtifactAttestationV1Schema,
    );
  });

  it('requires the exact reference grammar for each artifact kind', () => {
    for (const candidate of [
      {
        ...serverReceiptAttestation,
        artifactRef: executionEvidenceAttestation.artifactRef,
      },
      {
        ...executionEvidenceAttestation,
        artifactRef: serverReceiptAttestation.artifactRef,
      },
      {
        ...serverReceiptAttestation,
        artifactRef:
          'ac265-receipt://server/70000000-0000-1000-8000-000000000008',
      },
      {
        ...executionEvidenceAttestation,
        artifactRef:
          'ac265-evidence://blob/70000000-0000-4000-c000-000000000009',
      },
      {
        ...serverReceiptAttestation,
        kind: 'unknown_artifact',
      },
    ])
      expect(
        HostedArtifactAttestationV1Schema.safeParse(candidate).success,
      ).toBe(false);
  });

  it('binds lowercase artifact, candidate, runner-contract, and subject digests plus UUID/run identity', () => {
    for (const candidate of [
      { ...serverReceiptAttestation, artifactSha256: 'A'.repeat(64) },
      { ...serverReceiptAttestation, artifactSha256: 'a'.repeat(63) },
      {
        ...serverReceiptAttestation,
        candidateIdentitySha256: 'B'.repeat(64),
      },
      {
        ...serverReceiptAttestation,
        runnerContractSha256: 'c'.repeat(63),
      },
      { ...serverReceiptAttestation, subjectSha256: 'not-a-digest' },
      { ...serverReceiptAttestation, runId: 'not-a-uuid' },
      {
        ...serverReceiptAttestation,
        runId: '70000000-0000-4000-c000-000000000007',
      },
      { ...serverReceiptAttestation, runId: '70000000-0000-4000-8000' },
      {
        ...serverReceiptAttestation,
        runId: 'A0000000-0000-4000-8000-000000000007',
      },
      { ...serverReceiptAttestation, keyId: 'not valid key id!' },
    ])
      expect(
        HostedArtifactAttestationV1Schema.safeParse(candidate).success,
      ).toBe(false);
  });

  it('accepts the version-agnostic run identities the upstream runner contract allows', () => {
    for (const runId of [
      '70000000-0000-1000-8000-000000000007',
      '70000000-0000-5000-8000-000000000007',
      '70000000-0000-7000-8000-000000000007',
    ])
      expect(
        HostedArtifactAttestationV1Schema.safeParse({
          ...serverReceiptAttestation,
          runId,
        }).success,
      ).toBe(true);
  });

  it('accepts every run identity the frozen upstream runner contract accepts, except non-canonical spellings', () => {
    const contract = makeContract();
    // Canonical lowercase identities must track upstream acceptance exactly.
    for (const runId of [
      '70000000-0000-1000-8000-000000000007',
      '70000000-0000-3000-8000-000000000007',
      '70000000-0000-4000-8000-000000000007',
      '70000000-0000-5000-8000-000000000007',
      '70000000-0000-7000-8000-000000000007',
    ]) {
      expect(
        ContentSchemaRegistryHostedRunnerContractSchema.safeParse({
          ...contract,
          runId,
        }).success,
      ).toBe(true);
      expect(
        HostedArtifactAttestationV1Schema.safeParse({
          ...serverReceiptAttestation,
          runId,
        }).success,
      ).toBe(true);
    }
    // Non-canonical or malformed spellings stay rejected at this boundary even
    // though the generic upstream schema is lenient about them, so one run
    // identity always has exactly one canonical signed spelling.
    for (const runId of [
      'A0000000-0000-4000-8000-000000000007',
      '00000000-0000-0000-0000-000000000000',
      'ffffffff-ffff-ffff-ffff-ffffffffffff',
      '70000000-0000-4000-c000-000000000007',
      '70000000-0000-4000-8000',
      'not-a-uuid',
      '70000000_0000_4000_8000_000000000007',
      '',
    ])
      expect(
        HostedArtifactAttestationV1Schema.safeParse({
          ...serverReceiptAttestation,
          runId,
        }).success,
      ).toBe(false);
  });

  it('rejects a different signing domain, algorithm, unknown field, or noncanonical signature', () => {
    for (const candidate of [
      { ...serverReceiptAttestation, domain: 'WEJAMMIN-OTHER-DOMAIN-V1' },
      { ...serverReceiptAttestation, algorithm: 'Ed448' },
      { ...serverReceiptAttestation, issuer: 'untrusted-extra-field' },
      { ...serverReceiptAttestation, unexpected: true },
      {
        ...serverReceiptAttestation,
        signature: `${'B'.repeat(86)}==`,
      },
    ])
      expect(
        HostedArtifactAttestationV1Schema.safeParse(candidate).success,
      ).toBe(false);
  });

  it('requires every signed binding member and rejects malformed key syntax', () => {
    for (const field of [
      'schemaVersion',
      'domain',
      'algorithm',
      'keyId',
      'kind',
      'artifactRef',
      'artifactSha256',
      'runId',
      'candidateIdentitySha256',
      'runnerContractSha256',
      'subjectSha256',
      'issuedAt',
      'expiresAt',
      'signature',
    ]) {
      const candidate: Record<string, unknown> = {
        ...serverReceiptAttestation,
      };
      delete candidate[field];
      expect(
        HostedArtifactAttestationV1Schema.safeParse(candidate).success,
      ).toBe(false);
    }

    for (const keyIdCandidate of [
      'AC265-HOSTED-ARTIFACT-V1',
      'key id with spaces',
      'ac265/key',
    ])
      expect(
        HostedArtifactAttestationV1Schema.safeParse({
          ...serverReceiptAttestation,
          keyId: keyIdCandidate,
        }).success,
      ).toBe(false);
  });

  it('requires a positive attestation lifetime no longer than five minutes', () => {
    for (const candidate of [
      {
        ...serverReceiptAttestation,
        expiresAt: serverReceiptAttestation.issuedAt,
      },
      {
        ...serverReceiptAttestation,
        expiresAt: '2026-09-21T09:59:59.999Z',
      },
      {
        ...serverReceiptAttestation,
        expiresAt: '2026-09-21T10:05:00.001Z',
      },
    ]) {
      const parsed = HostedArtifactAttestationV1Schema.safeParse(candidate);
      expect(parsed.success).toBe(false);
      if (parsed.success)
        throw new Error('Invalid attestation window must be rejected.');
      expect(parsed.error.issues).toContainEqual(
        expect.objectContaining({ code: 'custom', path: ['expiresAt'] }),
      );
    }
  });
});
