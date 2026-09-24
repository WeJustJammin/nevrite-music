import { generateKeyPairSync } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { deriveAc265HostedArtifactSigningKeyId } from '../infra/workflows/ac265-hosted-artifact-attestation-issuer.ts';
import { sha256Ac265HostedSemanticSubject } from '../infra/workflows/ac265-hosted-semantic-subject.ts';
import { jsonBytes } from './contracts/ac265-hosted-test-fixtures.ts';

export const RUN_ID = '71000000-0000-4000-8000-000000000007';
export const RECEIPT_REF =
  'ac265-receipt://server/71000000-0000-4000-8000-000000000008';
export const EVIDENCE_REF =
  'ac265-evidence://blob/71000000-0000-4000-8000-000000000009';
export const ISSUED_AT = '2026-09-23T10:00:00.000Z';
export const EXPIRES_AT = '2026-09-23T10:05:00.000Z';
export const CANDIDATE_IDENTITY_SHA256 = 'b'.repeat(64);
export const RUNNER_CONTRACT_SHA256 = 'c'.repeat(64);
export const VALID_FROM = '2026-09-01T00:00:00.000Z';
export const VALID_UNTIL = '2026-10-01T00:00:00.000Z';
export const FAILURE = 'AC265 hosted artifact attestation issuance failed';
export const ENTRYPOINT_PATH = fileURLToPath(
  new URL(
    '../infra/workflows/issue-ac265-hosted-artifact-attestations.ts',
    import.meta.url,
  ),
);

const REFERENCED_ARTIFACT_SHA256 = 'e'.repeat(64);

export const roots: string[] = [];

export const material = () => {
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

export const receiptSubject = { kind: 'role', key: 'owner_full' };
export const evidenceSubject = { kind: 'scenario', key: 'idp_sign_in' };

export const receiptBytes = jsonBytes({
  schemaVersion: 'ac265-hosted-e2e-receipt-v1',
  issuedAt: ISSUED_AT,
  runId: RUN_ID,
  subject: receiptSubject,
  result: {},
});

export const evidenceBytes = jsonBytes({
  schemaVersion: 'ac265-execution-evidence-v1',
  candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
  subjectSha256: sha256Ac265HostedSemanticSubject(evidenceSubject),
  artifactSha256: REFERENCED_ARTIFACT_SHA256,
  kind: 'scenario_observation',
});

export const harness = (
  overrides: {
    readonly key?: ReturnType<typeof material>;
    readonly request?: unknown;
    readonly artifacts?: Readonly<Record<string, Uint8Array>>;
    readonly env?: Readonly<Record<string, string | undefined>>;
  } = {},
) => {
  const key = overrides.key ?? material();
  const runnerTemp = mkdtempSync(join(tmpdir(), 'ac265-issuer-entrypoint-'));
  roots.push(runnerTemp);
  const summary = join(runnerTemp, 'summary.md');
  writeFileSync(summary, '', { mode: 0o600 });
  const artifactsDirectory = join(runnerTemp, 'artifacts');
  mkdirSync(artifactsDirectory, { mode: 0o700 });
  const artifacts = overrides.artifacts ?? {
    'receipt.json': receiptBytes,
    'evidence.json': evidenceBytes,
  };
  for (const [name, bytes] of Object.entries(artifacts))
    writeFileSync(join(artifactsDirectory, name), bytes, { mode: 0o600 });
  const requestPath = join(runnerTemp, 'request.json');
  writeFileSync(
    requestPath,
    JSON.stringify(
      overrides.request ?? {
        schemaVersion: 'ac265-hosted-artifact-attestation-request-v1',
        runId: RUN_ID,
        candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
        sources: [
          {
            kind: 'server_receipt',
            ref: RECEIPT_REF,
            artifactMember: 'receipt.json',
            subject: receiptSubject,
            issuedAt: ISSUED_AT,
            expiresAt: EXPIRES_AT,
          },
          {
            kind: 'execution_evidence',
            ref: EVIDENCE_REF,
            artifactMember: 'evidence.json',
            subject: evidenceSubject,
            issuedAt: ISSUED_AT,
            expiresAt: EXPIRES_AT,
          },
        ],
      },
    ),
    { mode: 0o600 },
  );
  const output = join(runnerTemp, 'ac265-hosted-artifact-attestations');
  return {
    key,
    runnerTemp,
    summary,
    requestPath,
    artifactsDirectory,
    output,
    env: {
      RUNNER_TEMP: runnerTemp,
      GITHUB_STEP_SUMMARY: summary,
      AC265_ATTESTATION_OUTPUT_DIR: output,
      AC265_HOSTED_ARTIFACT_SIGNING_KEY_VALID_FROM: VALID_FROM,
      AC265_HOSTED_ARTIFACT_SIGNING_KEY_VALID_UNTIL: VALID_UNTIL,
      AC265_ATTESTATION_REQUEST_PATH: requestPath,
      AC265_ATTESTATION_ARTIFACT_DIR: artifactsDirectory,
      AC265_HOSTED_ARTIFACT_SIGNING_KEY_ID: key.keyId,
      AC265_HOSTED_ARTIFACT_SIGNING_PRIVATE_KEY_PEM: key.privateKeyPem,
      ...overrides.env,
    },
  };
};

export const cleanupAttestationIssuerRoots = (): void => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true });
};
