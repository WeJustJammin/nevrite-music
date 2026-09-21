import { createHash, generateKeyPairSync } from 'node:crypto';

import {
  createAc265HostedArtifactSourceAuthority,
  createAc265HostedArtifactSourceManifest,
  type Ac265HostedArtifactSourceManifestExpectedBindings,
  type Ac265HostedArtifactSourceManifestTrustedKey,
} from '../infra/workflows/ac265-hosted-artifact-source-manifest.ts';
import type { Ac265HostedArtifactSourceManifestV1 } from '../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-source-manifest.ts';
import {
  CANDIDATE_IDENTITY_SHA256,
  EVIDENCE_BYTES,
  EVIDENCE_REF,
  EVIDENCE_SUBJECT_SHA256,
  KEY_ID,
  RECEIPT_BYTES,
  RECEIPT_REF,
  RECEIPT_SUBJECT_SHA256,
  RUN_ID,
  RUNNER_CONTRACT_SHA256,
  TRUSTED_CUTOFF_AT,
  evidenceAttestation,
  receiptAttestation,
  trustedKey,
} from './ac265-hosted-artifact-protected-context.fixtures.ts';

export {
  CANDIDATE_IDENTITY_SHA256,
  EVIDENCE_BYTES,
  EVIDENCE_REF,
  EVIDENCE_SUBJECT_SHA256,
  KEY_ID,
  RECEIPT_BYTES,
  RECEIPT_REF,
  RECEIPT_SUBJECT_SHA256,
  RUN_ID,
  RUNNER_CONTRACT_SHA256,
  TRUSTED_CUTOFF_AT,
  evidenceAttestation,
  receiptAttestation,
  trustedKey,
} from './ac265-hosted-artifact-protected-context.fixtures.ts';

export const AUTHORITY_ID = 'ac265-source-authority-v1';
export const AUTHORITY_KEY_ID = 'ac265-source-manifest-v1';
export const MANIFEST_REF =
  'ac265-artifact-manifest://staging/70000000-0000-4000-8000-000000000010';
export const AUTHORIZATION_REF =
  'ac265-authorization://staging/70000000-0000-4000-8000-000000000011';
export const SOURCE_REVISION = 'f'.repeat(40);
export const DEPLOYMENT_ID = 'staging-deployment-1';
export const MANIFEST_ISSUED_AT = '2026-09-21T10:00:00.000Z';
export const MANIFEST_EXPIRES_AT = '2026-09-21T10:05:00.000Z';

const keyPair = generateKeyPairSync('ed25519');
const privateKeyPem = keyPair.privateKey
  .export({ type: 'pkcs8', format: 'pem' })
  .toString();
const publicKeyPem = keyPair.publicKey
  .export({ type: 'spki', format: 'pem' })
  .toString();

export const authorityPrivateKeyPem = privateKeyPem;
export const authorityPublicKeyPem = publicKeyPem;
export const authorityTrustedKey: Ac265HostedArtifactSourceManifestTrustedKey =
  Object.freeze({
    authorityId: AUTHORITY_ID,
    keyId: AUTHORITY_KEY_ID,
    publicKeyPem,
    validFrom: '2026-09-01T00:00:00.000Z',
    validUntil: '2026-10-01T00:00:00.000Z',
    status: 'active',
  });

const sha256 = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

const sourceEntries = [
  {
    kind: 'execution_evidence' as const,
    artifactRef: EVIDENCE_REF,
    artifactSha256: sha256(EVIDENCE_BYTES),
    attestationSha256: sha256(evidenceAttestation.attestationBytes),
    attestationKeyId: KEY_ID,
    subjectSha256: EVIDENCE_SUBJECT_SHA256,
  },
  {
    kind: 'server_receipt' as const,
    artifactRef: RECEIPT_REF,
    artifactSha256: sha256(RECEIPT_BYTES),
    attestationSha256: sha256(receiptAttestation.attestationBytes),
    attestationKeyId: KEY_ID,
    subjectSha256: RECEIPT_SUBJECT_SHA256,
  },
] as const;

export const unsignedManifest = Object.freeze({
  schemaVersion: 'ac265-hosted-artifact-source-manifest-v1' as const,
  domain: 'WEJAMMIN-AC265-HOSTED-ARTIFACT-SOURCE-MANIFEST-V1' as const,
  algorithm: 'Ed25519' as const,
  criterion: 'P2-S09-AC-265' as const,
  environment: 'staging' as const,
  source: 'protected-upstream-artifact-authority' as const,
  authorityId: AUTHORITY_ID,
  authorityKeyId: AUTHORITY_KEY_ID,
  manifestRef: MANIFEST_REF,
  authorizationRef: AUTHORIZATION_REF,
  runId: RUN_ID,
  candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
  sourceRevision: SOURCE_REVISION,
  deploymentId: DEPLOYMENT_ID,
  runnerContractSha256: RUNNER_CONTRACT_SHA256,
  sources: sourceEntries,
  issuedAt: MANIFEST_ISSUED_AT,
  expiresAt: MANIFEST_EXPIRES_AT,
});

export const signedManifest = () =>
  createAc265HostedArtifactSourceManifest({
    manifest: unsignedManifest,
    privateKeyPem: authorityPrivateKeyPem,
  });

export const expectedBindings: Ac265HostedArtifactSourceManifestExpectedBindings =
  Object.freeze({
    authorityId: AUTHORITY_ID,
    authorityKeyId: AUTHORITY_KEY_ID,
    manifestRef: MANIFEST_REF,
    manifestSha256: sha256(signedManifest().manifestBytes),
    authorizationRef: AUTHORIZATION_REF,
    authorization: Object.freeze({
      authorizedAt: MANIFEST_ISSUED_AT,
      expiresAt: MANIFEST_EXPIRES_AT,
    }),
    runId: RUN_ID,
    candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
    sourceRevision: SOURCE_REVISION,
    deploymentId: DEPLOYMENT_ID,
    runnerContractSha256: RUNNER_CONTRACT_SHA256,
  });

export const manifestSourceInputs = [
  {
    expectation: {
      kind: 'execution_evidence' as const,
      ref: EVIDENCE_REF,
      keyId: KEY_ID,
      subjectSha256: EVIDENCE_SUBJECT_SHA256,
    },
    artifactBytes: EVIDENCE_BYTES,
    attestationBytes: evidenceAttestation.attestationBytes,
  },
  {
    expectation: {
      kind: 'server_receipt' as const,
      ref: RECEIPT_REF,
      keyId: KEY_ID,
      subjectSha256: RECEIPT_SUBJECT_SHA256,
    },
    artifactBytes: RECEIPT_BYTES,
    attestationBytes: receiptAttestation.attestationBytes,
  },
] as const;

export const createSourceAuthority = () =>
  createAc265HostedArtifactSourceAuthority({
    manifestBytes: signedManifest().manifestBytes,
    expected: expectedBindings,
    trustedAuthorityKeys: [authorityTrustedKey],
    artifactTrustedKeys: [trustedKey],
    trustedCutoffAt: TRUSTED_CUTOFF_AT,
  });

export type TestManifest = Ac265HostedArtifactSourceManifestV1;
