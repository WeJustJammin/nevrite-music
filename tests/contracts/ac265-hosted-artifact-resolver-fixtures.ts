import type { ContentSchemaRegistryHostedRunnerContract } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import {
  createAc265HostedArtifactAttestation,
  type Ac265HostedArtifactTrustedKey,
} from '../../infra/workflows/ac265-hosted-artifact-attestation.ts';
import type { Ac265HostedArtifactSource } from '../../infra/workflows/content-schema-registry-hosted-e2e-protected-context.ts';
import { sha256Ac265HostedSemanticSubject } from '../../infra/workflows/ac265-hosted-semantic-subject.ts';
import type { HostedReceiptFixtureByteStores } from './ac265-hosted-receipt-test-types.ts';
import { jsonBytes, sha256 } from './ac265-hosted-test-fixtures.ts';

export const AC265_TEST_RUNNER_MAPPING_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIJ1hsZ3v/VpguoRK9JLsLMREScVpezJpGXA7rAMcrn9g
-----END PRIVATE KEY-----`;
export const AC265_TEST_RUNNER_MAPPING_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=
-----END PUBLIC KEY-----`;
export const AC265_TEST_RUNNER_MAPPING_KEY_ID = 'ac265-runner-mapping-v1';

export const AC265_TEST_RUNNER_MAPPING_TRUSTED_KEYS = [
  {
    keyId: AC265_TEST_RUNNER_MAPPING_KEY_ID,
    publicKeyPem: AC265_TEST_RUNNER_MAPPING_PUBLIC_KEY_PEM,
    validFrom: '2026-09-01T00:00:00.000Z',
    validUntil: '2026-10-01T00:00:00.000Z',
    status: 'active' as const,
  },
] as const satisfies readonly Ac265HostedArtifactTrustedKey[];

export type Ac265HostedArtifactAttestationWindows = Readonly<{
  receipt: Readonly<{ issuedAt: string; expiresAt: string }>;
  evidence: Readonly<{ issuedAt: string; expiresAt: string }>;
}>;

export const DEFAULT_HOSTED_ARTIFACT_ATTESTATION_WINDOWS: Ac265HostedArtifactAttestationWindows =
  {
    receipt: {
      issuedAt: '2026-09-03T10:30:00.000Z',
      expiresAt: '2026-09-03T10:35:00.000Z',
    },
    evidence: {
      issuedAt: '2026-09-03T10:30:00.000Z',
      expiresAt: '2026-09-03T10:35:00.000Z',
    },
  };

export const hostedArtifactSourcesFor = (
  fixture: HostedReceiptFixtureByteStores,
  trustedContract: ContentSchemaRegistryHostedRunnerContract,
  contractBytes: Uint8Array,
  windows: Ac265HostedArtifactAttestationWindows,
): readonly Ac265HostedArtifactSource[] => {
  const sources: Ac265HostedArtifactSource[] = [];
  const candidateIdentitySha256 = sha256(jsonBytes(trustedContract.identity));
  const runnerContractSha256 = sha256(contractBytes);
  const addSource = (
    kind: 'server_receipt' | 'execution_evidence',
    ref: string,
    artifactBytes: Uint8Array,
    subjectSha256: string,
  ): void => {
    const window = windows[kind === 'server_receipt' ? 'receipt' : 'evidence'];
    const attestation = createAc265HostedArtifactAttestation({
      artifactBytes,
      artifactRef: ref,
      kind,
      keyId: AC265_TEST_RUNNER_MAPPING_KEY_ID,
      privateKeyPem: AC265_TEST_RUNNER_MAPPING_PRIVATE_KEY_PEM,
      runId: trustedContract.runId,
      candidateIdentitySha256,
      runnerContractSha256,
      subjectSha256,
      issuedAt: window.issuedAt,
      expiresAt: window.expiresAt,
    });
    sources.push({
      expectation: {
        kind,
        ref,
        keyId: AC265_TEST_RUNNER_MAPPING_KEY_ID,
        subjectSha256,
      },
      artifactBytes,
      attestationBytes: attestation.attestationBytes,
    });
  };

  for (const [ref, bytes] of fixture.receiptBytes) {
    const envelope = JSON.parse(Buffer.from(bytes).toString('utf8')) as {
      subject: unknown;
    };
    addSource(
      'server_receipt',
      ref,
      bytes,
      sha256Ac265HostedSemanticSubject(envelope.subject),
    );
  }

  const evidenceSubjects = new Map<string, { kind: string; key: string }>();
  for (const role of fixture.report.roles)
    for (const evidence of role.executionEvidence ?? [])
      evidenceSubjects.set(evidence.ref, { kind: 'role', key: role.role });
  for (const scenario of fixture.report.scenarios)
    for (const evidence of scenario.executionEvidence ?? [])
      evidenceSubjects.set(evidence.ref, {
        kind: 'scenario',
        key: scenario.scenario,
      });
  for (const role of Object.keys(fixture.report.cleanup.sessionTeardowns)) {
    const evidence = fixture.report.cleanup.sessionTeardowns[role].evidence;
    evidenceSubjects.set(evidence.ref, {
      kind: 'session_teardown',
      key: role,
    });
  }
  for (const [ref, bytes] of fixture.evidenceBytes) {
    const subject = evidenceSubjects.get(ref);
    if (subject === undefined) continue;
    addSource(
      'execution_evidence',
      ref,
      bytes,
      sha256Ac265HostedSemanticSubject(subject),
    );
  }
  return sources;
};
