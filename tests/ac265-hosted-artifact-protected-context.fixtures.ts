import { createAc265HostedArtifactAttestation } from '../infra/workflows/ac265-hosted-artifact-attestation.ts';
import {
  createAc265HostedArtifactResolver,
  type Ac265HostedArtifactExpectation,
  type Ac265HostedArtifactResolver,
  type Ac265HostedArtifactSource,
  type Ac265HostedArtifactTrust,
} from '../infra/workflows/content-schema-registry-hosted-e2e-protected-context.ts';

export type {
  Ac265HostedArtifactResolver,
  Ac265HostedArtifactSource,
  Ac265HostedArtifactTrust,
};

export const KEY_ID = 'ac265-hosted-artifact-v1';
export const RUN_ID = '70000000-0000-4000-8000-000000000007';
export const CANDIDATE_IDENTITY_SHA256 = 'b'.repeat(64);
export const RUNNER_CONTRACT_SHA256 = 'c'.repeat(64);
export const RECEIPT_SUBJECT_SHA256 = 'd'.repeat(64);
export const EVIDENCE_SUBJECT_SHA256 = 'e'.repeat(64);
export const EXPIRES_AT = '2026-09-21T10:05:00.000Z';
export const TRUSTED_CUTOFF_AT = '2026-09-21T10:30:00.000Z';
export const REPORT_STARTED_AT = '2026-09-21T10:01:00.000Z';
export const LATE_REPORT_STARTED_AT = '2026-09-21T10:27:00.000Z';
export const EARLY_REPORT_STARTED_AT = '2026-09-21T09:59:59.999Z';
export const EXPIRY_REPORT_STARTED_AT = EXPIRES_AT;

export const RECEIPT_REF =
  'ac265-receipt://server/70000000-0000-4000-8000-000000000008';
export const EVIDENCE_REF =
  'ac265-evidence://blob/70000000-0000-4000-8000-000000000009';
export const RECEIPT_BYTES = Buffer.from(
  '{"schemaVersion":"ac265-hosted-e2e-receipt-v1","kind":"server_receipt"}\n',
  'utf8',
);
export const EVIDENCE_BYTES = Buffer.from(
  '{"schemaVersion":"ac265-execution-evidence-v1","kind":"role_assertion"}\n',
  'utf8',
);

const TEST_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIJ1hsZ3v/VpguoRK9JLsLMREScVpezJpGXA7rAMcrn9g
-----END PRIVATE KEY-----`;
export const TEST_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=
-----END PUBLIC KEY-----`;

export const trustedKey = Object.freeze({
  keyId: KEY_ID,
  publicKeyPem: TEST_PUBLIC_KEY_PEM,
  validFrom: '2026-09-01T00:00:00.000Z',
  validUntil: '2026-10-01T00:00:00.000Z',
  status: 'active' as const,
});

type Kind = 'server_receipt' | 'execution_evidence';

type AttestationOverrides = Partial<{
  keyId: string;
  runId: string;
  candidateIdentitySha256: string;
  runnerContractSha256: string;
  subjectSha256: string;
  artifactRef: string;
  issuedAt: string;
  expiresAt: string;
  privateKeyPem: string;
}>;

export const signedArtifact = (
  kind: Kind,
  artifactRef: string,
  artifactBytes: Uint8Array,
  overrides: AttestationOverrides = {},
) =>
  createAc265HostedArtifactAttestation({
    kind,
    artifactRef: overrides.artifactRef ?? artifactRef,
    artifactBytes,
    keyId: overrides.keyId ?? KEY_ID,
    privateKeyPem: overrides.privateKeyPem ?? TEST_PRIVATE_KEY_PEM,
    runId: overrides.runId ?? RUN_ID,
    candidateIdentitySha256:
      overrides.candidateIdentitySha256 ?? CANDIDATE_IDENTITY_SHA256,
    runnerContractSha256:
      overrides.runnerContractSha256 ?? RUNNER_CONTRACT_SHA256,
    subjectSha256: overrides.subjectSha256 ?? RECEIPT_SUBJECT_SHA256,
    issuedAt: overrides.issuedAt ?? '2026-09-21T10:00:00.000Z',
    expiresAt: overrides.expiresAt ?? EXPIRES_AT,
  });

export const receiptAttestation = signedArtifact(
  'server_receipt',
  RECEIPT_REF,
  RECEIPT_BYTES,
  { subjectSha256: RECEIPT_SUBJECT_SHA256 },
);
export const evidenceAttestation = signedArtifact(
  'execution_evidence',
  EVIDENCE_REF,
  EVIDENCE_BYTES,
  { subjectSha256: EVIDENCE_SUBJECT_SHA256 },
);

export const expectation = (
  kind: Kind,
  ref: string,
  keyId = KEY_ID,
  subjectSha256 = kind === 'server_receipt'
    ? RECEIPT_SUBJECT_SHA256
    : EVIDENCE_SUBJECT_SHA256,
): Ac265HostedArtifactExpectation => ({
  kind,
  ref,
  keyId,
  subjectSha256,
});

export const source = (
  kind: Kind,
  ref: string,
  artifactBytes: Uint8Array,
  attestationBytes: Uint8Array,
  expected = expectation(kind, ref),
): Ac265HostedArtifactSource => ({
  expectation: expected,
  artifactBytes,
  attestationBytes,
});

export const receiptSource = () =>
  source(
    'server_receipt',
    RECEIPT_REF,
    RECEIPT_BYTES,
    receiptAttestation.attestationBytes,
  );

export const evidenceSource = () =>
  source(
    'execution_evidence',
    EVIDENCE_REF,
    EVIDENCE_BYTES,
    evidenceAttestation.attestationBytes,
  );

export const receiptRequest = (
  ref = RECEIPT_REF,
  reportStartedAt = REPORT_STARTED_AT,
  expectedSubjectSha256 = RECEIPT_SUBJECT_SHA256,
) => ({
  ref,
  reportStartedAt,
  expectedSubjectSha256,
});

export const evidenceRequest = (
  ref = EVIDENCE_REF,
  reportStartedAt = REPORT_STARTED_AT,
  expectedSubjectSha256 = EVIDENCE_SUBJECT_SHA256,
) => ({
  ref,
  reportStartedAt,
  expectedSubjectSha256,
});

export const trust = (): Ac265HostedArtifactTrust => ({
  runId: RUN_ID,
  candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
  runnerContractSha256: RUNNER_CONTRACT_SHA256,
  trustedKeys: [trustedKey],
  trustedCutoffAt: TRUSTED_CUTOFF_AT,
});

export const createResolver = (
  sources: readonly Ac265HostedArtifactSource[] = [
    receiptSource(),
    evidenceSource(),
  ],
  fixedTrust: Ac265HostedArtifactTrust = trust(),
): Ac265HostedArtifactResolver =>
  createAc265HostedArtifactResolver(fixedTrust, sources);
