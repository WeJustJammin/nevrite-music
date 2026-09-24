import { createHash, createPublicKey } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { authenticateAc265HostedArtifactAttestationV1 } from '../infra/workflows/ac265-hosted-artifact-attestation.ts';
import {
  createAc265HostedArtifactAttestationIssuer,
  deriveAc265HostedArtifactSigningKeyId,
} from '../infra/workflows/ac265-hosted-artifact-attestation-issuer.ts';
import { createAc265HostedArtifactResolver } from '../infra/workflows/content-schema-registry-hosted-e2e-protected-context.ts';
import { sha256Ac265HostedSemanticSubject } from '../infra/workflows/ac265-hosted-semantic-subject.ts';
import { sha256 } from './contracts/ac265-hosted-test-fixtures.ts';
import {
  ISSUER_CANDIDATE_IDENTITY_SHA256,
  ISSUER_EVIDENCE_REF,
  ISSUER_EXPIRES_AT,
  ISSUER_KEY_ID_PREFIX,
  ISSUER_RECEIPT_REF,
  ISSUER_RUNNER_CONTRACT_SHA256,
  ISSUER_RUN_ID,
  ISSUER_TRUSTED_CUTOFF_AT,
  ISSUER_VALID_FROM,
  ISSUER_VALID_UNTIL,
  issuerEvidenceBytes,
  issuerEvidenceRequest,
  issuerReceiptBytes,
  issuerReceiptRequest,
  issuerReceiptSubject,
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

describe('AC265 hosted artifact attestation issuer key material', () => {
  it('pins the caller-supplied signing key by deriving the key ID from its public half', () => {
    const { publicKeyPem, keyId } = issuerSigningMaterial();
    expect(keyId.startsWith(ISSUER_KEY_ID_PREFIX)).toBe(true);
    expect(keyId).toMatch(/^[a-z][a-z0-9_.-]{1,95}$/u);
    expect(keyId).toBe(deriveAc265HostedArtifactSigningKeyId(publicKeyPem));
    expect(keyId.slice(ISSUER_KEY_ID_PREFIX.length)).toBe(
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
    const material = issuerSigningMaterial();
    expect(() =>
      issuerWith(material, {
        keyId: `${ISSUER_KEY_ID_PREFIX}${'0'.repeat(32)}`,
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
    expect(() =>
      issuerWith(material, { validUntil: ISSUER_VALID_FROM }),
    ).toThrow(/key|issuer|window/i);
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
        validFrom: ISSUER_VALID_FROM,
        validUntil: ISSUER_VALID_UNTIL,
        extra: true,
      } as unknown as Record<string, unknown>),
    ).toThrow(/issuer/i);
  });

  it('exposes a frozen single-key registry and never leaks private material', () => {
    const material = issuerSigningMaterial();
    const issuer = issuerWith(material);
    expect(Object.isFrozen(issuer)).toBe(true);
    expect(Object.isFrozen(issuer.trustedKeys)).toBe(true);
    expect(issuer.keyId).toBe(material.keyId);
    expect(issuer.trustedKeys).toEqual([
      {
        keyId: material.keyId,
        publicKeyPem: material.publicKeyPem,
        validFrom: ISSUER_VALID_FROM,
        validUntil: ISSUER_VALID_UNTIL,
        status: 'active',
      },
    ]);
    expect(issuer.trustedKeys.every((key) => Object.isFrozen(key))).toBe(true);
    expect(JSON.stringify(issuer)).not.toContain('PRIVATE KEY');
    expect(typeof issuer.signArtifact).toBe('function');
  });
});

describe('AC265 hosted artifact attestation issuer signing', () => {
  it('binds exact caller-supplied bytes to kind, reference, window, subject, and run', () => {
    const issuer = issuerWith(issuerSigningMaterial());
    const request = issuerReceiptRequest();
    const signed = issuer.signArtifact(request, issuerRunBinding());
    expect(signed.artifactRef).toBe(ISSUER_RECEIPT_REF);
    expect(signed.kind).toBe('server_receipt');
    expect(signed.keyId).toBe(issuer.keyId);
    expect(signed.runId).toBe(ISSUER_RUN_ID);
    expect(signed.candidateIdentitySha256).toBe(
      ISSUER_CANDIDATE_IDENTITY_SHA256,
    );
    expect(signed.runnerContractSha256).toBe(ISSUER_RUNNER_CONTRACT_SHA256);
    expect(signed.subjectSha256).toBe(
      sha256Ac265HostedSemanticSubject(issuerReceiptSubject()),
    );
    expect(signed.artifactSha256).toBe(sha256(request.artifactBytes));
    expect(Buffer.from(signed.artifactBytes)).toEqual(
      Buffer.from(request.artifactBytes),
    );
    expect(signed.attestationBytes.byteLength).toBeGreaterThan(0);
    expect(signed.issuedAt).toBe('2026-09-21T10:00:00.000Z');
    expect(signed.expiresAt).toBe(ISSUER_EXPIRES_AT);
  });

  it('signs both artifact kinds so the protected resolver accepts them', () => {
    const issuer = issuerWith(issuerSigningMaterial());
    const receipt = issuer.signArtifact(
      issuerReceiptRequest(),
      issuerRunBinding(),
    );
    const evidence = issuer.signArtifact(
      issuerEvidenceRequest(),
      issuerRunBinding(),
    );
    const resolver = createAc265HostedArtifactResolver(
      {
        runId: ISSUER_RUN_ID,
        candidateIdentitySha256: ISSUER_CANDIDATE_IDENTITY_SHA256,
        runnerContractSha256: ISSUER_RUNNER_CONTRACT_SHA256,
        trustedKeys: issuer.trustedKeys,
        trustedCutoffAt: ISSUER_TRUSTED_CUTOFF_AT,
      },
      [
        {
          expectation: {
            kind: 'server_receipt',
            ref: ISSUER_RECEIPT_REF,
            keyId: issuer.keyId,
            subjectSha256: receipt.subjectSha256,
          },
          artifactBytes: receipt.artifactBytes,
          attestationBytes: receipt.attestationBytes,
        },
        {
          expectation: {
            kind: 'execution_evidence',
            ref: ISSUER_EVIDENCE_REF,
            keyId: issuer.keyId,
            subjectSha256: evidence.subjectSha256,
          },
          artifactBytes: evidence.artifactBytes,
          attestationBytes: evidence.attestationBytes,
        },
      ],
    );
    const resolvedReceipt = resolver.resolveReceipt({
      ref: ISSUER_RECEIPT_REF,
      reportStartedAt: '2026-09-21T10:00:00.000Z',
      expectedSubjectSha256: receipt.subjectSha256,
    });
    expect(Buffer.from(resolvedReceipt.bytes)).toEqual(
      Buffer.from(issuerReceiptBytes()),
    );
    expect(resolvedReceipt.attestation.kind).toBe('server_receipt');
    expect(resolvedReceipt.attestation.runId).toBe(ISSUER_RUN_ID);
    expect(resolvedReceipt.attestation.candidateIdentitySha256).toBe(
      ISSUER_CANDIDATE_IDENTITY_SHA256,
    );
    expect(resolvedReceipt.artifact.artifactSha256).toBe(
      sha256(issuerReceiptBytes()),
    );
    const resolvedEvidence = resolver.resolveEvidence({
      ref: ISSUER_EVIDENCE_REF,
      reportStartedAt: '2026-09-21T10:00:00.000Z',
      expectedSubjectSha256: evidence.subjectSha256,
    });
    expect(resolvedEvidence.attestation.kind).toBe('execution_evidence');
    const authenticated = authenticateAc265HostedArtifactAttestationV1({
      artifactBytes: issuerEvidenceBytes(),
      attestationBytes: evidence.attestationBytes,
      expected: {
        keyId: issuer.keyId,
        kind: 'execution_evidence',
        artifactRef: ISSUER_EVIDENCE_REF,
        runId: ISSUER_RUN_ID,
        candidateIdentitySha256: ISSUER_CANDIDATE_IDENTITY_SHA256,
        runnerContractSha256: ISSUER_RUNNER_CONTRACT_SHA256,
        subjectSha256: evidence.subjectSha256,
      },
      trustedKeys: issuer.trustedKeys,
    });
    expect(authenticated.artifact.artifactSha256).toBe(
      sha256(issuerEvidenceBytes()),
    );
    expect(() =>
      authenticateAc265HostedArtifactAttestationV1({
        artifactBytes: issuerEvidenceBytes(),
        attestationBytes: evidence.attestationBytes,
        expected: {
          keyId: issuer.keyId,
          kind: 'execution_evidence',
          artifactRef: ISSUER_EVIDENCE_REF,
          runId: ISSUER_RUN_ID,
          candidateIdentitySha256: ISSUER_CANDIDATE_IDENTITY_SHA256,
          runnerContractSha256: 'd'.repeat(64),
          subjectSha256: evidence.subjectSha256,
        },
        trustedKeys: issuer.trustedKeys,
      }),
    ).toThrow();
  });
});
