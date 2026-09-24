import { createHash, createPublicKey, generateKeyPairSync } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS } from '../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-control-plane.ts';
import {
  assertAc265HostedArtifactAttestationWindow,
  authenticateAc265HostedArtifactAttestationV1,
} from '../infra/workflows/ac265-hosted-artifact-attestation.ts';
import {
  assertAc265HostedArtifactAttestationIssuerRunBinding,
  createAc265HostedArtifactAttestationIssuer,
  deriveAc265HostedArtifactSigningKeyId,
} from '../infra/workflows/ac265-hosted-artifact-attestation-issuer.ts';
import { createAc265HostedArtifactResolver } from '../infra/workflows/content-schema-registry-hosted-e2e-protected-context.ts';
import { sha256Ac265HostedSemanticSubject } from '../infra/workflows/ac265-hosted-semantic-subject.ts';
import {
  jsonBytes,
  makeContract,
  sha256,
} from './contracts/ac265-hosted-test-fixtures.ts';

const RUN_ID = '70000000-0000-4000-8000-000000000007';
const RECEIPT_REF =
  'ac265-receipt://server/70000000-0000-4000-8000-000000000008';
const EVIDENCE_REF =
  'ac265-evidence://blob/70000000-0000-4000-8000-000000000009';
const ISSUED_AT = '2026-09-21T10:00:00.000Z';
const EXPIRES_AT = '2026-09-21T10:05:00.000Z';
const VALID_FROM = '2026-09-01T00:00:00.000Z';
const VALID_UNTIL = '2026-10-01T00:00:00.000Z';
const TRUSTED_CUTOFF_AT = '2026-09-21T10:30:00.000Z';
const CANDIDATE_IDENTITY_SHA256 = 'b'.repeat(64);
const RUNNER_CONTRACT_SHA256 = 'c'.repeat(64);

const KEY_ID_PREFIX = 'ac265-hosted-artifact-ed25519-';

const signingMaterial = () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const publicKeyPem = publicKey
    .export({ type: 'spki', format: 'pem' })
    .toString();
  return {
    privateKeyPem: privateKey
      .export({ type: 'pkcs8', format: 'pem' })
      .toString(),
    publicKeyPem,
    keyId: deriveAc265HostedArtifactSigningKeyId(publicKeyPem),
  };
};

const runBinding = (overrides: Record<string, unknown> = {}) => ({
  runId: RUN_ID,
  candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
  runnerContractSha256: RUNNER_CONTRACT_SHA256,
  ...overrides,
});

const receiptSubjectFor = () => ({ kind: 'role', key: 'owner_full' });

const receiptBytes = (): Uint8Array =>
  jsonBytes({
    schemaVersion: 'ac265-hosted-e2e-receipt-v1',
    issuedAt: ISSUED_AT,
    runId: RUN_ID,
    subject: receiptSubjectFor(),
    result: {},
  });

const evidenceBytes = (): Uint8Array =>
  jsonBytes({
    schemaVersion: 'ac265-execution-evidence-v1',
    kind: 'role_assertion',
  });

const issuerWith = (
  material: ReturnType<typeof signingMaterial>,
  overrides: Record<string, unknown> = {},
) =>
  createAc265HostedArtifactAttestationIssuer({
    keyId: material.keyId,
    privateKeyPem: material.privateKeyPem,
    validFrom: VALID_FROM,
    validUntil: VALID_UNTIL,
    ...overrides,
  });

const receiptRequest = (overrides: Record<string, unknown> = {}) => ({
  kind: 'server_receipt' as const,
  artifactRef: RECEIPT_REF,
  artifactBytes: receiptBytes(),
  subject: receiptSubjectFor(),
  issuedAt: ISSUED_AT,
  expiresAt: EXPIRES_AT,
  ...overrides,
});

const evidenceRequest = (overrides: Record<string, unknown> = {}) => ({
  kind: 'execution_evidence' as const,
  artifactRef: EVIDENCE_REF,
  artifactBytes: evidenceBytes(),
  subject: { kind: 'role', key: 'owner_full' },
  issuedAt: ISSUED_AT,
  expiresAt: EXPIRES_AT,
  ...overrides,
});

describe('AC265 hosted artifact attestation issuer', () => {
  it('pins the caller-supplied signing key by deriving the key ID from its public half', () => {
    const { publicKeyPem, keyId } = signingMaterial();
    expect(keyId.startsWith(KEY_ID_PREFIX)).toBe(true);
    expect(keyId).toMatch(/^[a-z][a-z0-9_.-]{1,95}$/u);
    expect(keyId).toBe(deriveAc265HostedArtifactSigningKeyId(publicKeyPem));
    expect(keyId.slice(KEY_ID_PREFIX.length)).toBe(
      createHash('sha256')
        .update(
          createPublicKey(publicKeyPem).export({
            type: 'spki',
            format: 'der',
          }),
        )
        .digest('hex')
        .slice(0, 32),
    );
    expect(() => deriveAc265HostedArtifactSigningKeyId('not-a-pem')).toThrow(
      /key|issuer/i,
    );
  });

  it('refuses mismatched, malformed, revoked-shaped, or non-Ed25519 signing material', () => {
    const material = signingMaterial();
    expect(() =>
      issuerWith(material, {
        keyId: `${KEY_ID_PREFIX}${'0'.repeat(32)}`,
      }),
    ).toThrow(/key|issuer/i);
    expect(() => issuerWith(material, { keyId: 'Invalid Key Id' })).toThrow(
      /key|issuer/i,
    );
    expect(() => issuerWith(material, { privateKeyPem: 'not-a-key' })).toThrow(
      /key|issuer/i,
    );
    expect(() =>
      issuerWith(material, { privateKeyPem: material.publicKeyPem }),
    ).toThrow(/key|issuer/i);
    expect(() => issuerWith(material, { validUntil: VALID_FROM })).toThrow(
      /key|issuer|window/i,
    );
    expect(() =>
      issuerWith(material, { validFrom: 'not-a-timestamp' }),
    ).toThrow(/key|issuer|window/i);
    expect(() =>
      createAc265HostedArtifactAttestationIssuer(
        null as unknown as Record<string, unknown>,
      ),
    ).toThrow(/issuer/i);
    expect(() =>
      createAc265HostedArtifactAttestationIssuer({
        keyId: material.keyId,
        privateKeyPem: material.privateKeyPem,
        validFrom: VALID_FROM,
        validUntil: VALID_UNTIL,
        extra: true,
      } as unknown as Record<string, unknown>),
    ).toThrow(/issuer/i);
  });

  it('exposes a frozen single-key registry and never leaks private material', () => {
    const material = signingMaterial();
    const issuer = issuerWith(material);
    expect(Object.isFrozen(issuer)).toBe(true);
    expect(Object.isFrozen(issuer.trustedKeys)).toBe(true);
    expect(issuer.keyId).toBe(material.keyId);
    expect(issuer.trustedKeys).toEqual([
      {
        keyId: material.keyId,
        publicKeyPem: material.publicKeyPem,
        validFrom: VALID_FROM,
        validUntil: VALID_UNTIL,
        status: 'active',
      },
    ]);
    expect(issuer.trustedKeys.every((key) => Object.isFrozen(key))).toBe(true);
    expect(JSON.stringify(issuer)).not.toContain('PRIVATE KEY');
    expect(typeof issuer.signArtifact).toBe('function');
  });

  it('binds exact caller-supplied bytes to kind, reference, window, subject, and run', () => {
    const issuer = issuerWith(signingMaterial());
    const request = receiptRequest();
    const signed = issuer.signArtifact(request, runBinding());
    expect(signed.artifactRef).toBe(RECEIPT_REF);
    expect(signed.kind).toBe('server_receipt');
    expect(signed.keyId).toBe(issuer.keyId);
    expect(signed.runId).toBe(RUN_ID);
    expect(signed.candidateIdentitySha256).toBe(CANDIDATE_IDENTITY_SHA256);
    expect(signed.runnerContractSha256).toBe(RUNNER_CONTRACT_SHA256);
    expect(signed.subjectSha256).toBe(
      sha256Ac265HostedSemanticSubject(receiptSubjectFor()),
    );
    expect(signed.artifactSha256).toBe(sha256(request.artifactBytes));
    expect(Buffer.from(signed.artifactBytes)).toEqual(
      Buffer.from(request.artifactBytes),
    );
    expect(signed.attestationBytes.byteLength).toBeGreaterThan(0);
  });

  it('signs both artifact kinds so the protected resolver accepts them', () => {
    const issuer = issuerWith(signingMaterial());
    const receipt = issuer.signArtifact(receiptRequest(), runBinding());
    const evidence = issuer.signArtifact(evidenceRequest(), runBinding());
    const resolver = createAc265HostedArtifactResolver(
      {
        runId: RUN_ID,
        candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
        trustedKeys: issuer.trustedKeys,
        trustedCutoffAt: TRUSTED_CUTOFF_AT,
      },
      [
        {
          expectation: {
            kind: 'server_receipt',
            ref: RECEIPT_REF,
            keyId: issuer.keyId,
            subjectSha256: receipt.subjectSha256,
          },
          artifactBytes: receipt.artifactBytes,
          attestationBytes: receipt.attestationBytes,
        },
        {
          expectation: {
            kind: 'execution_evidence',
            ref: EVIDENCE_REF,
            keyId: issuer.keyId,
            subjectSha256: evidence.subjectSha256,
          },
          artifactBytes: evidence.artifactBytes,
          attestationBytes: evidence.attestationBytes,
        },
      ],
    );
    const resolvedReceipt = resolver.resolveReceipt({
      ref: RECEIPT_REF,
      reportStartedAt: ISSUED_AT,
      expectedSubjectSha256: receipt.subjectSha256,
    });
    expect(Buffer.from(resolvedReceipt.bytes)).toEqual(
      Buffer.from(receiptBytes()),
    );
    expect(resolvedReceipt.attestation.kind).toBe('server_receipt');
    expect(resolvedReceipt.attestation.runId).toBe(RUN_ID);
    expect(resolvedReceipt.attestation.candidateIdentitySha256).toBe(
      CANDIDATE_IDENTITY_SHA256,
    );
    expect(resolvedReceipt.artifact.artifactSha256).toBe(
      sha256(receiptBytes()),
    );
    const resolvedEvidence = resolver.resolveEvidence({
      ref: EVIDENCE_REF,
      reportStartedAt: ISSUED_AT,
      expectedSubjectSha256: evidence.subjectSha256,
    });
    expect(resolvedEvidence.attestation.kind).toBe('execution_evidence');
    const authenticated = authenticateAc265HostedArtifactAttestationV1({
      artifactBytes: evidenceBytes(),
      attestationBytes: evidence.attestationBytes,
      expected: {
        keyId: issuer.keyId,
        kind: 'execution_evidence',
        artifactRef: EVIDENCE_REF,
        runId: RUN_ID,
        candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
        subjectSha256: evidence.subjectSha256,
      },
      trustedKeys: issuer.trustedKeys,
    });
    expect(authenticated.artifact.artifactSha256).toBe(sha256(evidenceBytes()));
    expect(() =>
      authenticateAc265HostedArtifactAttestationV1({
        artifactBytes: evidenceBytes(),
        attestationBytes: evidence.attestationBytes,
        expected: {
          keyId: issuer.keyId,
          kind: 'execution_evidence',
          artifactRef: EVIDENCE_REF,
          runId: RUN_ID,
          candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
          runnerContractSha256: 'd'.repeat(64),
          subjectSha256: evidence.subjectSha256,
        },
        trustedKeys: issuer.trustedKeys,
      }),
    ).toThrow();
  });

  it('emits a resolution window the resolver accepts and rejects window abuse', () => {
    const issuer = issuerWith(signingMaterial());
    const signed = issuer.signArtifact(receiptRequest(), runBinding());
    const authenticated = authenticateAc265HostedArtifactAttestationV1({
      artifactBytes: signed.artifactBytes,
      attestationBytes: signed.attestationBytes,
      expected: {
        keyId: issuer.keyId,
        kind: 'server_receipt',
        artifactRef: RECEIPT_REF,
        runId: RUN_ID,
        candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
        subjectSha256: signed.subjectSha256,
      },
      trustedKeys: issuer.trustedKeys,
    });
    expect(() =>
      assertAc265HostedArtifactAttestationWindow({
        artifact: authenticated.artifact,
        attestation: authenticated.attestation,
        reportStartedAt: ISSUED_AT,
        trustedCutoffAt: TRUSTED_CUTOFF_AT,
      }),
    ).not.toThrow();
    expect(() =>
      assertAc265HostedArtifactAttestationWindow({
        artifact: authenticated.artifact,
        attestation: authenticated.attestation,
        reportStartedAt: ISSUED_AT,
        trustedCutoffAt: '2026-09-21T10:04:59.000Z',
      }),
    ).toThrow(/window/i);
    expect(() =>
      assertAc265HostedArtifactAttestationWindow({
        artifact: authenticated.artifact,
        attestation: authenticated.attestation,
        reportStartedAt: '2026-09-21T09:59:59.000Z',
        trustedCutoffAt: TRUSTED_CUTOFF_AT,
      }),
    ).toThrow(/window/i);
  });

  it('rejects malformed requests, kind/reference swaps, and byte-shape abuse', () => {
    const issuer = issuerWith(signingMaterial());
    const binding = runBinding();
    const invalid: readonly unknown[] = [
      null,
      {},
      receiptRequest({ artifactRef: EVIDENCE_REF }),
      evidenceRequest({ artifactRef: RECEIPT_REF }),
      receiptRequest({ kind: 'other_artifact' }),
      receiptRequest({ artifactRef: `${RECEIPT_REF}extra` }),
      receiptRequest({ artifactRef: RECEIPT_REF.toUpperCase() }),
      receiptRequest({ artifactBytes: Buffer.alloc(0) }),
      receiptRequest({ artifactBytes: Buffer.alloc(64 * 1024 + 1, 1) }),
      receiptRequest({ artifactBytes: 'not-bytes' }),
      receiptRequest({ subject: null }),
      receiptRequest({ subject: { kind: 'role', key: 'not_a_role' } }),
      receiptRequest({ subject: { kind: 'unknown_kind', key: 'owner_full' } }),
      receiptRequest({ issuedAt: 'not-a-timestamp' }),
      receiptRequest({ expiresAt: ISSUED_AT }),
      receiptRequest({
        expiresAt: new Date(
          Date.parse(ISSUED_AT) +
            AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS +
            1,
        ).toISOString(),
      }),
      receiptRequest({ issuedAt: '2026-08-31T23:59:59.000Z' }),
      receiptRequest({ expiresAt: '2026-10-01T00:00:00.001Z' }),
      receiptRequest({ extraMember: true }),
    ];
    for (const request of invalid)
      expect(() =>
        issuer.signArtifact(request as Record<string, unknown>, binding),
      ).toThrow(
        /attestation|artifact|invalid|window|kind|reference|subject|key/i,
      );
  });

  it('rejects invalid, swapped, and inconsistent run bindings before signing', () => {
    const issuer = issuerWith(signingMaterial());
    const request = receiptRequest();
    const invalidBindings: readonly unknown[] = [
      null,
      {},
      runBinding({ runId: 'not-a-uuid' }),
      runBinding({
        runId: '7a000000-0000-4000-8000-000000000007'.toUpperCase(),
      }),
      runBinding({ candidateIdentitySha256: 'B'.repeat(64) }),
      runBinding({ candidateIdentitySha256: 'short' }),
      runBinding({ runnerContractSha256: 'c'.repeat(63) }),
      runBinding({ extra: true }),
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
    const issuer = issuerWith(signingMaterial());
    expect(() =>
      assertAc265HostedArtifactAttestationIssuerRunBinding(
        issuer,
        runBinding(),
      ),
    ).not.toThrow();
    const forged = Object.freeze({ ...issuer });
    expect(() =>
      assertAc265HostedArtifactAttestationIssuerRunBinding(
        forged,
        runBinding(),
      ),
    ).toThrow(/issuer|binding/i);
    expect(() =>
      (
        issuer.signArtifact as (this: unknown, ...args: unknown[]) => unknown
      ).call(forged, receiptRequest(), runBinding()),
    ).toThrow(/issuer|attestation/i);
  });

  it('returns fresh byte copies so callers cannot corrupt issuer state', () => {
    const issuer = issuerWith(signingMaterial());
    const request = receiptRequest();
    const binding = runBinding();
    const signed = issuer.signArtifact(request, binding);
    signed.artifactBytes.fill(0);
    signed.attestationBytes.fill(0);
    const again = issuer.signArtifact(request, binding);
    expect(sha256(again.artifactBytes)).toBe(sha256(receiptBytes()));
    expect(Buffer.from(again.attestationBytes).byteLength).toBeGreaterThan(0);
    const first = issuer.signArtifact(request, binding).attestationBytes;
    expect(sha256(again.attestationBytes)).toBe(sha256(first));
  });

  it('keeps the signed artifact digest stable across independent issuers for identical bytes', () => {
    const material = signingMaterial();
    const first = issuerWith(material).signArtifact(
      receiptRequest(),
      runBinding(),
    );
    const second = issuerWith(material).signArtifact(
      receiptRequest(),
      runBinding(),
    );
    expect(second.artifactSha256).toBe(first.artifactSha256);
    expect(sha256(second.attestationBytes)).toBe(
      sha256(first.attestationBytes),
    );
  });

  it('accepts contract-shaped identity digests derived from the runner contract', () => {
    const contract = makeContract();
    const issuer = issuerWith(signingMaterial());
    const binding = runBinding({
      runId: contract.runId,
      candidateIdentitySha256: sha256(jsonBytes(contract.identity)),
    });
    const signed = issuer.signArtifact(receiptRequest(), binding);
    expect(signed.runId).toBe(contract.runId);
    expect(signed.candidateIdentitySha256).toBe(
      sha256(jsonBytes(contract.identity)),
    );
  });
});
