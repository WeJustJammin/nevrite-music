import { spawnSync } from 'node:child_process';
import {
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { runIssueAc265HostedArtifactsAttestations } from '../infra/workflows/issue-ac265-hosted-artifact-attestations.ts';
import {
  CANDIDATE_IDENTITY_DIGEST,
  CANDIDATE_IDENTITY_SHA256,
  ENTRYPOINT_PATH,
  EXPIRES_AT,
  FAILURE,
  ISSUED_AT,
  RECEIPT_REF,
  RUNNER_CONTRACT_SHA256,
  RUN_ID,
  cleanupAttestationIssuerRoots,
  harness,
  receiptBytes,
} from './ac265-hosted-artifact-attestation-issuer.test-support.ts';

afterEach(() => {
  cleanupAttestationIssuerRoots();
});

describe('AC265 hosted artifact attestation issuance boundaries', () => {
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

  it('rejects missing artifact bytes, symlinked artifacts, and swapped kinds', async () => {
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
  });

  it('rejects an output directory outside runner temp and one that already exists', async () => {
    const outside = harness();
    await expect(
      runIssueAc265HostedArtifactsAttestations({
        env: { ...outside.env, AC265_ATTESTATION_OUTPUT_DIR: tmpdir() },
      }),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects a source window that exceeds the pinned five-minute attestation bound', async () => {
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
            subject: { kind: 'role', key: 'owner_full' },
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

  it('rejects an attestation window outside the pinned signing-key validity', async () => {
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
            subject: { kind: 'role', key: 'owner_full' },
            issuedAt: '2026-08-31T23:59:00.000Z',
            expiresAt: '2026-09-01T00:03:00.000Z',
          },
        ],
      },
    });
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: run.env }),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects evidence bytes whose embedded subject digest contradicts the descriptor', async () => {
    const run = harness({
      request: {
        schemaVersion: 'ac265-hosted-artifact-attestation-request-v1',
        runId: RUN_ID,
        candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
        sources: [
          {
            kind: 'execution_evidence',
            ref: 'ac265-evidence://blob/71000000-0000-4000-8000-000000000009',
            artifactMember: 'evidence.json',
            subject: { kind: 'role', key: 'guardian_mandate' },
            issuedAt: ISSUED_AT,
            expiresAt: EXPIRES_AT,
          },
        ],
      },
    });
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: run.env }),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects a receipt whose declared subject contradicts its bytes', async () => {
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
            subject: { kind: 'cleanup', key: 'cleanup' },
            issuedAt: ISSUED_AT,
            expiresAt: EXPIRES_AT,
          },
        ],
      },
    });
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: run.env }),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects a bare-subject receipt that is not a complete canonical envelope', async () => {
    const run = harness({
      artifacts: {
        'receipt.json': Buffer.from(
          JSON.stringify({ subject: { kind: 'role', key: 'owner_full' } }),
          'utf8',
        ),
      },
      request: {
        schemaVersion: 'ac265-hosted-artifact-attestation-request-v1',
        runId: RUN_ID,
        candidateIdentitySha256: CANDIDATE_IDENTITY_DIGEST,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
        sources: [
          {
            kind: 'server_receipt',
            ref: RECEIPT_REF,
            artifactMember: 'receipt.json',
            subject: { kind: 'role', key: 'owner_full' },
            issuedAt: ISSUED_AT,
            expiresAt: EXPIRES_AT,
          },
        ],
      },
    });
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: run.env }),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects a canonical receipt bound to a foreign run or foreign identity', async () => {
    const foreignRun = JSON.parse(
      Buffer.from(receiptBytes).toString('utf8'),
    ) as Record<string, unknown>;
    foreignRun['runId'] = '72000000-0000-4000-8000-000000000007';
    const foreignRunHarness = harness({
      artifacts: {
        'receipt.json': Buffer.from(JSON.stringify(foreignRun), 'utf8'),
      },
      request: {
        schemaVersion: 'ac265-hosted-artifact-attestation-request-v1',
        runId: RUN_ID,
        candidateIdentitySha256: CANDIDATE_IDENTITY_DIGEST,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
        sources: [
          {
            kind: 'server_receipt',
            ref: RECEIPT_REF,
            artifactMember: 'receipt.json',
            subject: { kind: 'role', key: 'owner_full' },
            issuedAt: ISSUED_AT,
            expiresAt: EXPIRES_AT,
          },
        ],
      },
    });
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: foreignRunHarness.env }),
    ).rejects.toThrow(FAILURE);

    const foreignIdentity = JSON.parse(
      Buffer.from(receiptBytes).toString('utf8'),
    ) as { identity: Record<string, unknown> };
    foreignIdentity.identity['deploymentId'] = 'deployment-99999999999';
    const foreignIdentityHarness = harness({
      artifacts: {
        'receipt.json': Buffer.from(JSON.stringify(foreignIdentity), 'utf8'),
      },
      request: {
        schemaVersion: 'ac265-hosted-artifact-attestation-request-v1',
        runId: RUN_ID,
        candidateIdentitySha256: CANDIDATE_IDENTITY_DIGEST,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
        sources: [
          {
            kind: 'server_receipt',
            ref: RECEIPT_REF,
            artifactMember: 'receipt.json',
            subject: { kind: 'role', key: 'owner_full' },
            issuedAt: ISSUED_AT,
            expiresAt: EXPIRES_AT,
          },
        ],
      },
    });
    await expect(
      runIssueAc265HostedArtifactsAttestations({
        env: foreignIdentityHarness.env,
      }),
    ).rejects.toThrow(FAILURE);
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

  it('requires the step summary and artifact directory to resolve beneath runner temp', async () => {
    const outsideSummary = harness();
    const foreignSummary = join(
      tmpdir(),
      `ac265-foreign-summary-${process.pid}.md`,
    );
    writeFileSync(foreignSummary, '', { mode: 0o600 });
    await expect(
      runIssueAc265HostedArtifactsAttestations({
        env: { ...outsideSummary.env, GITHUB_STEP_SUMMARY: foreignSummary },
      }),
    ).rejects.toThrow(FAILURE);
    rmSync(foreignSummary, { force: true });

    const outsideArtifacts = harness();
    await expect(
      runIssueAc265HostedArtifactsAttestations({
        env: {
          ...outsideArtifacts.env,
          AC265_ATTESTATION_ARTIFACT_DIR: tmpdir(),
        },
      }),
    ).rejects.toThrow(FAILURE);

    const outsideRequest = harness();
    await expect(
      runIssueAc265HostedArtifactsAttestations({
        env: {
          ...outsideRequest.env,
          AC265_ATTESTATION_REQUEST_PATH: '/etc/hosts',
        },
      }),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects a symlinked request document and a symlinked step summary', async () => {
    const symlinkedRequest = harness();
    const realRequest = `${symlinkedRequest.requestPath}.real`;
    renameSync(symlinkedRequest.requestPath, realRequest);
    symlinkSync(realRequest, symlinkedRequest.requestPath);
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: symlinkedRequest.env }),
    ).rejects.toThrow(FAILURE);

    const symlinkedSummary = harness();
    const realSummary = `${symlinkedSummary.summary}.real`;
    renameSync(symlinkedSummary.summary, realSummary);
    symlinkSync(realSummary, symlinkedSummary.summary);
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: symlinkedSummary.env }),
    ).rejects.toThrow(FAILURE);
  });

  it('rejects a request document with a foreign schema version or unknown members', async () => {
    const wrongSchema = harness({
      request: {
        schemaVersion: 'ac265-hosted-artifact-attestation-request-v2',
        runId: RUN_ID,
        candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
        sources: [],
      },
    });
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: wrongSchema.env }),
    ).rejects.toThrow(FAILURE);

    const unknownMember = harness({
      request: {
        schemaVersion: 'ac265-hosted-artifact-attestation-request-v1',
        runId: RUN_ID,
        candidateIdentitySha256: CANDIDATE_IDENTITY_SHA256,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
        sources: [],
        extraMember: true,
      },
    });
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: unknownMember.env }),
    ).rejects.toThrow(FAILURE);
  });
});
