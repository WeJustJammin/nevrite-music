import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { createAc265HostedArtifactResolver } from '../infra/workflows/content-schema-registry-hosted-e2e-protected-context.ts';
import { runIssueAc265HostedArtifactsAttestations } from '../infra/workflows/issue-ac265-hosted-artifact-attestations.ts';
import { sha256Ac265HostedSemanticSubject } from '../infra/workflows/ac265-hosted-semantic-subject.ts';
import { sha256 } from './contracts/ac265-hosted-test-fixtures.ts';
import {
  CANDIDATE_IDENTITY_DIGEST,
  EVIDENCE_REF,
  EXPIRES_AT,
  FAILURE,
  ISSUED_AT,
  RECEIPT_REF,
  RUNNER_CONTRACT_SHA256,
  RUN_ID,
  cleanupAttestationIssuerRoots,
  evidenceSubject,
  harness,
  material,
  receiptBytes,
  receiptSubject,
} from './ac265-hosted-artifact-attestation-issuer.test-support.ts';

afterEach(() => {
  cleanupAttestationIssuerRoots();
});

describe('AC265 hosted artifact attestation issuance', () => {
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
        candidateIdentitySha256: CANDIDATE_IDENTITY_DIGEST,
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

  it('appends its step summary without clobbering earlier step content', async () => {
    const run = harness();
    const earlier = '## Earlier step\n\nkept verbatim.\n';
    writeFileSync(run.summary, earlier, { mode: 0o600 });
    await runIssueAc265HostedArtifactsAttestations({ env: run.env });
    const summaryText = readFileSync(run.summary, 'utf8');
    expect(summaryText.startsWith(earlier)).toBe(true);
    expect(summaryText).toContain(
      '## AC265 hosted artifact attestation issuance',
    );
    expect(summaryText).toContain(RUN_ID);
  });

  it('rejects unsafe members, duplicate references, and unbounded source sets', async () => {
    const base = {
      schemaVersion: 'ac265-hosted-artifact-attestation-request-v1',
      runId: RUN_ID,
      candidateIdentitySha256: CANDIDATE_IDENTITY_DIGEST,
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

  it('rejects a foreign signing key that does not match the declared key ID', async () => {
    const foreignKey = material();
    const mismatched = harness({
      env: {
        AC265_HOSTED_ARTIFACT_SIGNING_PRIVATE_KEY_PEM: foreignKey.privateKeyPem,
      },
    });
    await expect(
      runIssueAc265HostedArtifactsAttestations({ env: mismatched.env }),
    ).rejects.toThrow(FAILURE);
  });
});
