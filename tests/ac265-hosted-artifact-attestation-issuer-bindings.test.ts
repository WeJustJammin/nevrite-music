import { describe, expect, it } from 'vitest';

import { AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS } from '../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-control-plane.ts';
import {
  assertAc265HostedArtifactAttestationWindow,
  authenticateAc265HostedArtifactAttestationV1,
} from '../infra/workflows/ac265-hosted-artifact-attestation.ts';
import {
  assertAc265HostedArtifactAttestationIssuerRunBinding,
  createAc265HostedArtifactAttestationIssuer,
} from '../infra/workflows/ac265-hosted-artifact-attestation-issuer.ts';
import {
  jsonBytes,
  makeContract,
  sha256,
} from './contracts/ac265-hosted-test-fixtures.ts';
import {
  ISSUER_CANDIDATE_IDENTITY_SHA256,
  ISSUER_EVIDENCE_REF,
  ISSUER_ISSUED_AT,
  ISSUER_RECEIPT_REF,
  ISSUER_RUNNER_CONTRACT_SHA256,
  ISSUER_RUN_ID,
  ISSUER_TRUSTED_CUTOFF_AT,
  ISSUER_VALID_FROM,
  ISSUER_VALID_UNTIL,
  issuerEvidenceRequest,
  issuerReceiptBytes,
  issuerReceiptRequest,
  issuerRunBinding,
  issuerSigningMaterial,
} from './ac265-hosted-artifact-attestation-issuer-fixtures.ts';

const issuerWith = (
  material: ReturnType<typeof issuerSigningMaterial>,
  overrides: Record<string, unknown> = {},
) =>
  createAc265HostedArtifactAttestationIssuer({
    keyId: material.keyId,
    privateKeyPem: material.privateKeyPem,
    validFrom: ISSUER_VALID_FROM,
    validUntil: ISSUER_VALID_UNTIL,
    ...overrides,
  });

describe('AC265 hosted artifact attestation issuer windows and bindings', () => {
  it('emits a resolution window the resolver accepts and rejects window abuse', () => {
    const issuer = issuerWith(issuerSigningMaterial());
    const signed = issuer.signArtifact(
      issuerReceiptRequest(),
      issuerRunBinding(),
    );
    const authenticated = authenticateAc265HostedArtifactAttestationV1({
      artifactBytes: signed.artifactBytes,
      attestationBytes: signed.attestationBytes,
      expected: {
        keyId: issuer.keyId,
        kind: 'server_receipt',
        artifactRef: ISSUER_RECEIPT_REF,
        runId: ISSUER_RUN_ID,
        candidateIdentitySha256: ISSUER_CANDIDATE_IDENTITY_SHA256,
        runnerContractSha256: ISSUER_RUNNER_CONTRACT_SHA256,
        subjectSha256: signed.subjectSha256,
      },
      trustedKeys: issuer.trustedKeys,
    });
    expect(() =>
      assertAc265HostedArtifactAttestationWindow({
        artifact: authenticated.artifact,
        attestation: authenticated.attestation,
        reportStartedAt: ISSUER_ISSUED_AT,
        trustedCutoffAt: ISSUER_TRUSTED_CUTOFF_AT,
      }),
    ).not.toThrow();
    expect(() =>
      assertAc265HostedArtifactAttestationWindow({
        artifact: authenticated.artifact,
        attestation: authenticated.attestation,
        reportStartedAt: ISSUER_ISSUED_AT,
        trustedCutoffAt: '2026-09-21T10:04:59.000Z',
      }),
    ).toThrow(/window/i);
    expect(() =>
      assertAc265HostedArtifactAttestationWindow({
        artifact: authenticated.artifact,
        attestation: authenticated.attestation,
        reportStartedAt: '2026-09-21T09:59:59.000Z',
        trustedCutoffAt: ISSUER_TRUSTED_CUTOFF_AT,
      }),
    ).toThrow(/window/i);
  });

  it('rejects malformed requests, kind/reference swaps, and byte-shape abuse', () => {
    const issuer = issuerWith(issuerSigningMaterial());
    const binding = issuerRunBinding();
    const invalid: readonly unknown[] = [
      null,
      {},
      issuerReceiptRequest({ artifactRef: ISSUER_EVIDENCE_REF }),
      issuerEvidenceRequest({ artifactRef: ISSUER_RECEIPT_REF }),
      issuerReceiptRequest({ kind: 'other_artifact' }),
      issuerReceiptRequest({ artifactRef: `${ISSUER_RECEIPT_REF}extra` }),
      issuerReceiptRequest({ artifactRef: ISSUER_RECEIPT_REF.toUpperCase() }),
      issuerReceiptRequest({ artifactBytes: Buffer.alloc(0) }),
      issuerReceiptRequest({ artifactBytes: Buffer.alloc(64 * 1024 + 1, 1) }),
      issuerReceiptRequest({ artifactBytes: 'not-bytes' }),
      issuerReceiptRequest({ subject: null }),
      issuerReceiptRequest({ subject: { kind: 'role', key: 'not_a_role' } }),
      issuerReceiptRequest({
        subject: { kind: 'unknown_kind', key: 'owner_full' },
      }),
      issuerReceiptRequest({ issuedAt: 'not-a-timestamp' }),
      issuerReceiptRequest({ expiresAt: ISSUER_ISSUED_AT }),
      issuerReceiptRequest({
        expiresAt: new Date(
          Date.parse(ISSUER_ISSUED_AT) +
            AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS +
            1,
        ).toISOString(),
      }),
      issuerReceiptRequest({ issuedAt: '2026-08-31T23:59:59.000Z' }),
      issuerReceiptRequest({ expiresAt: '2026-10-01T00:00:00.001Z' }),
      issuerReceiptRequest({ extraMember: true }),
    ];
    for (const request of invalid)
      expect(() =>
        issuer.signArtifact(request as Record<string, unknown>, binding),
      ).toThrow(
        /attestation|artifact|invalid|window|kind|reference|subject|key/i,
      );
  });

  it('rejects invalid, swapped, and inconsistent run bindings before signing', () => {
    const issuer = issuerWith(issuerSigningMaterial());
    const request = issuerReceiptRequest();
    const invalidBindings: readonly unknown[] = [
      null,
      {},
      issuerRunBinding({ runId: 'not-a-uuid' }),
      issuerRunBinding({
        runId: '7a000000-0000-4000-8000-000000000007'.toUpperCase(),
      }),
      issuerRunBinding({ candidateIdentitySha256: 'B'.repeat(64) }),
      issuerRunBinding({ candidateIdentitySha256: 'short' }),
      issuerRunBinding({ runnerContractSha256: 'c'.repeat(63) }),
      issuerRunBinding({ extra: true }),
    ];
    for (const binding of invalidBindings)
      expect(() =>
        issuer.signArtifact(request, binding as Record<string, unknown>),
      ).toThrow(/binding|attestation|invalid|key/i);
    expect(() =>
      assertAc265HostedArtifactAttestationIssuerRunBinding(
        issuer,
        null as unknown as Record<string, unknown>,
      ),
    ).toThrow(/binding|issuer|invalid/i);
  });

  it('accepts exact run bindings and rejects a foreign issuer object', () => {
    const issuer = issuerWith(issuerSigningMaterial());
    expect(() =>
      assertAc265HostedArtifactAttestationIssuerRunBinding(
        issuer,
        issuerRunBinding(),
      ),
    ).not.toThrow();
    const forged = Object.freeze({ ...issuer });
    expect(() =>
      assertAc265HostedArtifactAttestationIssuerRunBinding(
        forged,
        issuerRunBinding(),
      ),
    ).toThrow(/issuer|binding/i);
    expect(() =>
      (
        issuer.signArtifact as (this: unknown, ...args: unknown[]) => unknown
      ).call(forged, issuerReceiptRequest(), issuerRunBinding()),
    ).toThrow(/issuer|attestation/i);
  });

  it('returns fresh byte copies so callers cannot corrupt issuer state', () => {
    const issuer = issuerWith(issuerSigningMaterial());
    const request = issuerReceiptRequest();
    const binding = issuerRunBinding();
    const signed = issuer.signArtifact(request, binding);
    signed.artifactBytes.fill(0);
    signed.attestationBytes.fill(0);
    const again = issuer.signArtifact(request, binding);
    expect(sha256(again.artifactBytes)).toBe(sha256(issuerReceiptBytes()));
    expect(Buffer.from(again.attestationBytes).byteLength).toBeGreaterThan(0);
    const first = issuer.signArtifact(request, binding).attestationBytes;
    expect(sha256(again.attestationBytes)).toBe(sha256(first));
  });

  it('keeps the signed artifact digest stable across independent issuers for identical bytes', () => {
    const material = issuerSigningMaterial();
    const first = issuerWith(material).signArtifact(
      issuerReceiptRequest(),
      issuerRunBinding(),
    );
    const second = issuerWith(material).signArtifact(
      issuerReceiptRequest(),
      issuerRunBinding(),
    );
    expect(second.artifactSha256).toBe(first.artifactSha256);
    expect(sha256(second.attestationBytes)).toBe(
      sha256(first.attestationBytes),
    );
  });

  it('accepts contract-shaped identity digests derived from the runner contract', () => {
    const contract = makeContract();
    const issuer = issuerWith(issuerSigningMaterial());
    const binding = issuerRunBinding({
      runId: contract.runId,
      candidateIdentitySha256: sha256(jsonBytes(contract.identity)),
    });
    const signed = issuer.signArtifact(issuerReceiptRequest(), binding);
    expect(signed.runId).toBe(contract.runId);
    expect(signed.candidateIdentitySha256).toBe(
      sha256(jsonBytes(contract.identity)),
    );
  });

  it('rejects a non-v4 run identity, matching the authority that mints it and CP-04d', () => {
    const issuer = issuerWith(issuerSigningMaterial());
    // The run authority mints `randomUUID()` (v4) and CP-04d plus retained-report
    // provenance are v4-only, so a v1/v5/v7 identity must fail at this boundary
    // rather than produce a companion the rest of the pipeline cannot carry.
    for (const runId of [
      '70000000-0000-1000-8000-000000000007',
      '70000000-0000-5000-8000-000000000007',
      '70000000-0000-7000-8000-000000000007',
    ])
      expect(() =>
        issuer.signArtifact(
          issuerReceiptRequest(),
          issuerRunBinding({ runId }),
        ),
      ).toThrow(/binding|attestation|invalid|key/i);
    expect(() =>
      assertAc265HostedArtifactAttestationIssuerRunBinding(
        issuer,
        issuerRunBinding({ runId: '70000000-0000-7000-8000-000000000007' }),
      ),
    ).toThrow(/binding|issuer|invalid/i);
    // The v4 identity the authority actually mints still signs and authenticates.
    const signed = issuer.signArtifact(
      issuerReceiptRequest(),
      issuerRunBinding(),
    );
    expect(signed.runId).toBe(ISSUER_RUN_ID);
    expect(
      authenticateAc265HostedArtifactAttestationV1({
        artifactBytes: signed.artifactBytes,
        attestationBytes: signed.attestationBytes,
        expected: {
          keyId: issuer.keyId,
          kind: 'server_receipt',
          artifactRef: ISSUER_RECEIPT_REF,
          runId: ISSUER_RUN_ID,
          candidateIdentitySha256: ISSUER_CANDIDATE_IDENTITY_SHA256,
          runnerContractSha256: ISSUER_RUNNER_CONTRACT_SHA256,
          subjectSha256: signed.subjectSha256,
        },
        trustedKeys: issuer.trustedKeys,
      }).attestation.runId,
    ).toBe(ISSUER_RUN_ID);
  });

  it('still rejects malformed, wrong-variant, uppercase-swapped, and short run identities', () => {
    const issuer = issuerWith(issuerSigningMaterial());
    const request = issuerReceiptRequest();
    for (const runId of [
      'not-a-uuid',
      '70000000-0000-4000-c000-000000000007',
      '70000000-0000-4000-8000',
      '70000000-0000-4000-8000-00000000000',
      '70000000_0000_4000_8000_000000000007',
      '',
      7,
    ])
      expect(() =>
        issuer.signArtifact(
          request,
          issuerRunBinding({ runId }) as Record<string, unknown>,
        ),
      ).toThrow(/binding|attestation|invalid|key/i);
  });
});
