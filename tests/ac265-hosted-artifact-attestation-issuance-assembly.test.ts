import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { runIssueAc265HostedArtifactsAttestations } from '../infra/workflows/issue-ac265-hosted-artifact-attestations.ts';
import { createAc265HostedArtifactResolver } from '../infra/workflows/content-schema-registry-hosted-e2e-protected-context.ts';
import { sha256Ac265HostedSemanticSubject } from '../infra/workflows/ac265-hosted-semantic-subject.ts';
import {
  contextFor,
  createFixture,
} from './contracts/ac265-hosted-receipt-test-fixtures.ts';
import { jsonBytes, sha256 } from './contracts/ac265-hosted-test-fixtures.ts';
import {
  cleanupAttestationIssuerRoots,
  harness,
  material,
} from './ac265-hosted-artifact-attestation-issuer.test-support.ts';

afterEach(() => {
  cleanupAttestationIssuerRoots();
});

const matchesSubject = (
  subject: { kind: string; key: string },
  subjectSha256: string,
): boolean => sha256Ac265HostedSemanticSubject(subject) === subjectSha256;

/**
 * Mirrors the protected resolver fixture mapping: evidence refs are classified
 * as role, scenario, or session-teardown descriptors, which is the descriptor
 * vocabulary the evidence payload digest is computed over.
 */
const evidenceSubjectFor = (
  fixture: ReturnType<typeof createFixture>,
  ref: string,
  subjectSha256: string,
): { kind: string; key: string } | undefined => {
  for (const result of fixture.report.roles)
    for (const entry of result.executionEvidence ?? [])
      if (
        entry.ref === ref &&
        matchesSubject({ kind: 'role', key: result.role }, subjectSha256)
      )
        return { kind: 'role', key: result.role };
  for (const result of fixture.report.scenarios)
    for (const entry of result.executionEvidence ?? [])
      if (
        entry.ref === ref &&
        matchesSubject(
          { kind: 'scenario', key: result.scenario },
          subjectSha256,
        )
      )
        return { kind: 'scenario', key: result.scenario };
  for (const role of Object.keys(fixture.report.cleanup.sessionTeardowns)) {
    const entry = fixture.report.cleanup.sessionTeardowns[role]?.evidence;
    if (
      entry !== undefined &&
      entry.ref === ref &&
      matchesSubject({ kind: 'session_teardown', key: role }, subjectSha256)
    )
      return { kind: 'session_teardown', key: role };
  }
  return undefined;
};

/**
 * Positive control for the P1 fix: the same canonical envelopes the real v3
 * verifier resolves must be issuable end to end. This signs the fixture's own
 * receipt and evidence bytes through the protected entrypoint and then feeds
 * the produced sources to the protected resolver, so a regression to
 * bare-subject validation would fail here as well as in the negative suites.
 */
describe('AC265 hosted artifact attestation issuance assembly control', () => {
  it('signs canonical fixture receipts and evidence the resolver accepts', async () => {
    const fixture = createFixture({
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T11:00:00.000Z',
    });
    const contract = fixture.contract;
    const candidateIdentitySha256 = sha256(jsonBytes(contract.identity));
    const runnerContractSha256 = sha256(jsonBytes(contract));
    const key = material();
    const run = harness({
      env: {
        AC265_HOSTED_ARTIFACT_SIGNING_KEY_ID: key.keyId,
        AC265_HOSTED_ARTIFACT_SIGNING_PRIVATE_KEY_PEM: key.privateKeyPem,
      },
    });

    const receiptEntries = [...fixture.receiptBytes.entries()].slice(0, 3);
    const evidenceEntries = [...fixture.evidenceBytes.entries()].slice(0, 3);
    const sources: Record<string, unknown>[] = [];
    const written = new Map<string, Uint8Array>();
    let index = 0;
    for (const [ref, bytes] of receiptEntries) {
      const member = `receipt-${index++}.json`;
      written.set(member, bytes);
      const envelope = JSON.parse(Buffer.from(bytes).toString('utf8')) as {
        subject: unknown;
      };
      sources.push({
        kind: 'server_receipt',
        ref,
        artifactMember: member,
        subject: envelope.subject,
        issuedAt: '2026-09-03T11:00:00.000Z',
        expiresAt: '2026-09-03T11:05:00.000Z',
      });
    }
    for (const [ref, bytes] of evidenceEntries) {
      const member = `evidence-${index++}.json`;
      written.set(member, bytes);
      const payload = JSON.parse(Buffer.from(bytes).toString('utf8')) as {
        subjectSha256: string;
      };
      const subject = evidenceSubjectFor(fixture, ref, payload.subjectSha256);
      expect(subject).toBeDefined();
      sources.push({
        kind: 'execution_evidence',
        ref,
        artifactMember: member,
        subject,
        issuedAt: '2026-09-03T11:00:00.000Z',
        expiresAt: '2026-09-03T11:05:00.000Z',
      });
    }
    expect(sources.length).toBeGreaterThan(0);
    mkdirSync(run.artifactsDirectory, { recursive: true, mode: 0o700 });
    for (const [member, bytes] of written)
      writeFileSync(join(run.artifactsDirectory, member), bytes, {
        mode: 0o600,
      });
    writeFileSync(
      run.requestPath,
      JSON.stringify({
        schemaVersion: 'ac265-hosted-artifact-attestation-request-v1',
        runId: contract.runId,
        candidateIdentitySha256,
        runnerContractSha256,
        sources,
      }),
      { mode: 0o600 },
    );

    const summary = await runIssueAc265HostedArtifactsAttestations({
      env: run.env,
    });
    expect(summary.sources).toBe(sources.length);
    const index2 = JSON.parse(
      readFileSync(
        join(run.output, 'ac265-hosted-artifact-attestation-index.json'),
        'utf8',
      ),
    ) as {
      entries: readonly {
        kind: 'server_receipt' | 'execution_evidence';
        ref: string;
        keyId: string;
        subjectSha256: string;
        attestationMember: string;
      }[];
    };
    const resolver = createAc265HostedArtifactResolver(
      {
        runId: contract.runId,
        candidateIdentitySha256,
        runnerContractSha256,
        trustedKeys: summary.trustedKeys,
        trustedCutoffAt: '2026-09-03T12:00:00.000Z',
      },
      index2.entries.map((entry) => ({
        expectation: {
          kind: entry.kind,
          ref: entry.ref,
          keyId: entry.keyId,
          subjectSha256: entry.subjectSha256,
        },
        artifactBytes: readFileSync(
          join(
            run.artifactsDirectory,
            sources.find((source) => source['ref'] === entry.ref)?.[
              'artifactMember'
            ] as string,
          ),
        ),
        attestationBytes: readFileSync(
          join(run.output, entry.attestationMember),
        ),
      })),
    );
    const receipt = index2.entries.find(
      (entry) => entry.kind === 'server_receipt',
    );
    const evidence = index2.entries.find(
      (entry) => entry.kind === 'execution_evidence',
    );
    expect(receipt).toBeDefined();
    expect(evidence).toBeDefined();
    const resolvedReceipt = resolver.resolveReceipt({
      ref: receipt!.ref,
      reportStartedAt: '2026-09-03T11:00:00.000Z',
      expectedSubjectSha256: receipt!.subjectSha256,
    });
    expect(sha256(resolvedReceipt.bytes)).toBe(
      sha256(fixture.receiptBytes.get(receipt!.ref)!),
    );
    const resolvedEvidence = resolver.resolveEvidence({
      ref: evidence!.ref,
      reportStartedAt: '2026-09-03T11:00:00.000Z',
      expectedSubjectSha256: evidence!.subjectSha256,
    });
    expect(sha256(resolvedEvidence.bytes)).toBe(
      sha256(fixture.evidenceBytes.get(evidence!.ref)!),
    );
    expect(contextFor(fixture).expectedIdentity).toEqual(contract.identity);
  });
});
