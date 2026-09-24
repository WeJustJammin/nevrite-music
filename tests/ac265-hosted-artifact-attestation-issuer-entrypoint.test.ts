import { generateKeyPairSync } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { createAc265HostedArtifactResolver } from '../infra/workflows/content-schema-registry-hosted-e2e-protected-context.ts';
import { runIssueAc265HostedArtifactsAttestations } from '../infra/workflows/issue-ac265-hosted-artifact-attestations.ts';
import { sha256Ac265HostedSemanticSubject } from '../infra/workflows/ac265-hosted-semantic-subject.ts';
import { deriveAc265HostedArtifactSigningKeyId } from '../infra/workflows/ac265-hosted-artifact-attestation-issuer.ts';
import { jsonBytes, sha256 } from './contracts/ac265-hosted-test-fixtures.ts';

const RUN_ID = '71000000-0000-4000-8000-000000000007';
const RECEIPT_REF =
  'ac265-receipt://server/71000000-0000-4000-8000-000000000008';
const EVIDENCE_REF =
  'ac265-evidence://blob/71000000-0000-4000-8000-000000000009';
const ISSUED_AT = '2026-09-23T10:00:00.000Z';
const EXPIRES_AT = '2026-09-23T10:05:00.000Z';
const CANDIDATE_IDENTITY_SHA256 = 'b'.repeat(64);
const RUNNER_CONTRACT_SHA256 = 'c'.repeat(64);
const VALID_FROM = '2026-09-01T00:00:00.000Z';
const VALID_UNTIL = '2026-10-01T00:00:00.000Z';
const FAILURE = 'AC265 hosted artifact attestation issuance failed';
const ENTRYPOINT_PATH = fileURLToPath(
  new URL(
    '../infra/workflows/issue-ac265-hosted-artifact-attestations.ts',
    import.meta.url,
  ),
);

const roots: string[] = [];

const material = () => {
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

const receiptSubject = { kind: 'role', key: 'owner_full' };
const evidenceSubject = { kind: 'scenario', key: 'idp_sign_in' };
const REFERENCED_ARTIFACT_SHA256 = 'e'.repeat(64);

const receiptBytes = jsonBytes({
  schemaVersion: 'ac265-hosted-e2e-receipt-v1',
  issuedAt: ISSUED_AT,
  runId: RUN_ID,
  subject: receiptSubject,
  result: {},
});
const evidenceBytes = jsonBytes({
  schemaVersion: 'ac265-execution-evidence-v1',
  candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
  subjectSha256: sha256Ac265HostedSemanticSubject(evidenceSubject),
  artifactSha256: REFERENCED_ARTIFACT_SHA256,
  kind: 'scenario_observation',
});

const harness = (
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

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true });
});

describe('AC265 hosted artifact attestation issuance entrypoint', () => {
  it('loads under the raw Node runtime without executing as an imported module', () => {
    const result = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--input-type=module',
        '--eval',
        "await import('./infra/workflows/issue-ac265-hosted-artifact-attestations.ts')",
      ],
      { cwd: process.cwd(), encoding: 'utf8' },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
  });

  it('fails closed with one generic message when required environment is absent', () => {
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', ENTRYPOINT_PATH],
      { encoding: 'utf8', env: { PATH: process.env.PATH ?? '/usr/bin:/bin' } },
    );
    const output = `${result.stdout}${result.stderr}`;
    expect(result.status).toBe(1);
    expect(output).toContain(FAILURE);
    expect(output).not.toContain('Error:');
  });

  it('issues signed companions for genuine caller-supplied bytes with owner-only publication', async () => {
    const run = harness();
    const summary = await runIssueAc265HostedArtifactsAttestations({
      env: run.env,
    });
    expect(summary.sources).toBe(2);
    expect(summary.keyId).toBe(run.key.keyId);
    expect(summary.runId).toBe(RUN_ID);
    const directoryStat = statSync(run.output);
    expect(directoryStat.isDirectory()).toBe(true);
    expect(directoryStat.mode & 0o777).toBe(0o700);
    const index = JSON.parse(
      readFileSync(
        join(run.output, 'ac265-hosted-artifact-attestation-index.json'),
        'utf8',
      ),
    ) as {
      schemaVersion: string;
      entries: readonly {
        kind: string;
        ref: string;
        keyId: string;
        artifactSha256: string;
        subjectSha256: string;
        attestationMember: string;
      }[];
    };
    expect(index.schemaVersion).toBe(
      'ac265-hosted-artifact-attestation-index-v1',
    );
    expect(index.entries).toHaveLength(2);
    const receiptEntry = index.entries.find(
      (entry) => entry.ref === RECEIPT_REF,
    );
    const evidenceEntry = index.entries.find(
      (entry) => entry.ref === EVIDENCE_REF,
    );
    expect(receiptEntry?.kind).toBe('server_receipt');
    expect(receiptEntry?.artifactSha256).toBe(sha256(receiptBytes));
    expect(receiptEntry?.subjectSha256).toBe(
      sha256Ac265HostedSemanticSubject(receiptSubject),
    );
    expect(evidenceEntry?.subjectSha256).toBe(
      sha256Ac265HostedSemanticSubject(evidenceSubject),
    );
    const attestationPath = join(
      run.output,
      receiptEntry?.attestationMember ?? '',
    );
    expect(statSync(attestationPath).mode & 0o777).toBe(0o600);
    const resolver = createAc265HostedArtifactResolver(
      {
        runId: RUN_ID,
        candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
        trustedKeys: summary.trustedKeys,
        trustedCutoffAt: '2026-09-23T10:30:00.000Z',
      },
      index.entries.map((entry) => ({
        expectation: {
          kind: entry.kind as 'server_receipt' | 'execution_evidence',
          ref: entry.ref,
          keyId: entry.keyId,
          subjectSha256: entry.subjectSha256,
        },
        artifactBytes: readFileSync(
          join(
            run.artifactsDirectory,
            entry.ref === RECEIPT_REF ? 'receipt.json' : 'evidence.json',
          ),
        ),
        attestationBytes: readFileSync(
          join(run.output, entry.attestationMember),
        ),
      })),
    );
    const resolved = resolver.resolveReceipt({
      ref: RECEIPT_REF,
      reportStartedAt: ISSUED_AT,
      expectedSubjectSha256: sha256Ac265HostedSemanticSubject(receiptSubject),
    });
    expect(resolved.artifact.artifactSha256).toBe(sha256(receiptBytes));
    expect(
      resolver.resolveEvidence({
        ref: EVIDENCE_REF,
        reportStartedAt: ISSUED_AT,
        expectedSubjectSha256:
          sha256Ac265HostedSemanticSubject(evidenceSubject),
      }).attestation.kind,
    ).toBe('execution_evidence');
    const summaryText = readFileSync(run.summary, 'utf8');
    expect(summaryText).toContain(RUN_ID);
    expect(summaryText).toContain(run.key.keyId);
    expect(summaryText).not.toContain('PRIVATE KEY');
    expect(summaryText).not.toContain(RUNNER_CONTRACT_SHA256);
  });

  it('refuses to overwrite an existing artifact or a pre-existing output directory', async () => {
    const run = harness();
    mkdirSync(run.output, { mode: 0o700 });
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: run.env }),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects unsafe members, duplicate references, and unbounded source sets', async () => {
    const base = {
      schemaVersion: 'ac265-hosted-artifact-attestation-request-v1',
      runId: RUN_ID,
      candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
      runnerContractSha256: RUNNER_CONTRACT_SHA256,
    };
    const source = {
      kind: 'server_receipt',
      ref: RECEIPT_REF,
      artifactMember: 'receipt.json',
      subject: receiptSubject,
      issuedAt: ISSUED_AT,
      expiresAt: EXPIRES_AT,
    };
    const cases: readonly unknown[] = [
      { ...base, sources: [] },
      { ...base, sources: [source, source] },
      {
        ...base,
        sources: [
          source,
          {
            ...source,
            ref: EVIDENCE_REF,
            artifactMember: '../escaping.json',
          },
        ],
      },
      {
        ...base,
        sources: [source, { ...source, kind: 'execution_evidence' }],
      },
      {
        ...base,
        sources: [
          source,
          {
            ...source,
            ref: EVIDENCE_REF,
            subject: { kind: 'unknown', key: 'x' },
          },
        ],
      },
      {
        ...base,
        sources: [
          source,
          {
            ...source,
            ref: EVIDENCE_REF,
            artifactMember: 'evidence.json',
            expiresAt: 'not-a-timestamp',
          },
        ],
      },
      { ...base, sources: [source], extra: true },
      {
        ...base,
        sources: Array.from({ length: 257 }, (_, index) => ({
          ...source,
          artifactMember: `receipt-${index}.json`,
        })),
      },
    ];
    for (const request of cases) {
      const run = harness({ request });
      await expect(
        runIssueAc265HostedArtifactsAttestations({ env: run.env }),
      ).rejects.toThrow(FAILURE);
    }
  });

  it('rejects missing artifact bytes, symlinked artifacts, and a key/identity mismatch', async () => {
    const missing = harness({ artifacts: { 'receipt.json': receiptBytes } });
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: missing.env }),
    ).rejects.toThrow(FAILURE);

    const symlinked = harness();
    rmSync(join(symlinked.artifactsDirectory, 'evidence.json'));
    symlinkSync(
      join(symlinked.artifactsDirectory, 'receipt.json'),
      join(symlinked.artifactsDirectory, 'evidence.json'),
    );
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: symlinked.env }),
    ).rejects.toThrow(FAILURE);

    const swapped = harness();
    writeFileSync(
      join(swapped.artifactsDirectory, 'evidence.json'),
      receiptBytes,
    );
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: swapped.env }),
    ).rejects.toThrow(FAILURE);

    const foreignKey = material();
    const mismatched = harness({
      env: {
        AC265_HOSTED_ARTIFACT_SIGNING_PRIVATE_KEY_PEM: foreignKey.privateKeyPem,
      },
    });
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: mismatched.env }),
    ).rejects.toThrow(FAILURE);

    const outside = harness();
    await expect(
      runIssueAc265HostedArtifactsAttestations({
        env: { ...outside.env, AC265_ATTESTATION_OUTPUT_DIR: tmpdir() },
      }),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects an artifact whose member does not match the declared kind reference', async () => {
    const run = harness({
      request: {
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
            expiresAt: '2026-09-23T10:06:00.000Z',
          },
        ],
      },
    });
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: run.env }),
    ).rejects.toThrow(FAILURE);
    expect(statSync(join(run.runnerTemp, 'request.json')).isFile()).toBe(true);
  });

  it('rejects a malformed request document before creating any output directory', async () => {
    const run = harness();
    writeFileSync(run.requestPath, '{"schemaVersion":"wrong",', {
      mode: 0o600,
    });
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: run.env }),
    ).rejects.toThrow(FAILURE);
    expect(() => statSync(run.output)).toThrow();
  });
});
