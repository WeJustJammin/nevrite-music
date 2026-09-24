import { generateKeyPairSync } from 'node:crypto';

import { deriveAc265HostedArtifactSigningKeyId } from '../infra/workflows/ac265-hosted-artifact-attestation-issuer.ts';
import { jsonBytes } from './contracts/ac265-hosted-test-fixtures.ts';

export const ISSUER_RUN_ID = '70000000-0000-4000-8000-000000000007';
export const ISSUER_RECEIPT_REF =
  'ac265-receipt://server/70000000-0000-4000-8000-000000000008';
export const ISSUER_EVIDENCE_REF =
  'ac265-evidence://blob/70000000-0000-4000-8000-000000000009';
export const ISSUER_ISSUED_AT = '2026-09-21T10:00:00.000Z';
export const ISSUER_EXPIRES_AT = '2026-09-21T10:05:00.000Z';
export const ISSUER_VALID_FROM = '2026-09-01T00:00:00.000Z';
export const ISSUER_VALID_UNTIL = '2026-10-01T00:00:00.000Z';
export const ISSUER_TRUSTED_CUTOFF_AT = '2026-09-21T10:30:00.000Z';
export const ISSUER_CANDIDATE_IDENTITY_SHA256 = 'b'.repeat(64);
export const ISSUER_RUNNER_CONTRACT_SHA256 = 'c'.repeat(64);
export const ISSUER_KEY_ID_PREFIX = 'ac265-hosted-artifact-ed25519-';

export const issuerSigningMaterial = () => {
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

export const issuerRunBinding = (overrides: Record<string, unknown> = {}) => ({
  runId: ISSUER_RUN_ID,
  candidateIdentitySha256: ISSUER_CANDIDATE_IDENTITY_SHA256,
  runnerContractSha256: ISSUER_RUNNER_CONTRACT_SHA256,
  ...overrides,
});

export const issuerReceiptSubject = () => ({
  kind: 'role',
  key: 'owner_full',
});

export const issuerReceiptBytes = (): Uint8Array =>
  jsonBytes({
    schemaVersion: 'ac265-hosted-e2e-receipt-v1',
    issuedAt: ISSUER_ISSUED_AT,
    runId: ISSUER_RUN_ID,
    subject: issuerReceiptSubject(),
    result: {},
  });

export const issuerEvidenceBytes = (): Uint8Array =>
  jsonBytes({
    schemaVersion: 'ac265-execution-evidence-v1',
    kind: 'role_assertion',
  });

export const issuerReceiptRequest = (
  overrides: Record<string, unknown> = {},
) => ({
  kind: 'server_receipt' as const,
  artifactRef: ISSUER_RECEIPT_REF,
  artifactBytes: issuerReceiptBytes(),
  subject: issuerReceiptSubject(),
  issuedAt: ISSUER_ISSUED_AT,
  expiresAt: ISSUER_EXPIRES_AT,
  ...overrides,
});

export const issuerEvidenceRequest = (
  overrides: Record<string, unknown> = {},
) => ({
  kind: 'execution_evidence' as const,
  artifactRef: ISSUER_EVIDENCE_REF,
  artifactBytes: issuerEvidenceBytes(),
  subject: { kind: 'role', key: 'owner_full' },
  issuedAt: ISSUER_ISSUED_AT,
  expiresAt: ISSUER_EXPIRES_AT,
  ...overrides,
});
