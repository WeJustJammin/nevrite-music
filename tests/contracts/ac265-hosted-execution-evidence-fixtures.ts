import type { ContentSchemaRegistryHostedRunnerContract } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import { sha256Ac265HostedSemanticSubject } from '../../infra/workflows/ac265-hosted-semantic-subject.ts';
import { jsonBytes, sha256, uuidFor } from './ac265-hosted-test-fixtures.ts';

type HostedIdentity = ContentSchemaRegistryHostedRunnerContract['identity'];
export type HostedEvidenceKind =
  'role_assertion' | 'scenario_observation' | 'session_teardown';
export type HostedEvidenceReference = {
  kind: HostedEvidenceKind;
  ref: string;
  sha256: string;
};

export const createSyntheticHostedExecutionEvidence = (
  identity: HostedIdentity,
) => {
  const evidenceBytes = new Map<string, Uint8Array>();
  let sequence = 0;
  const makeExecutionEvidence = (
    kind: HostedEvidenceKind,
    subject: { kind: string; key: string },
    sessionRefSha256?: string,
  ): HostedEvidenceReference => {
    const artifactIndex = sequence++;
    const ref = `ac265-evidence://blob/${uuidFor(artifactIndex + 2_000)}`;
    const payload = {
      schemaVersion: 'ac265-execution-evidence-v1',
      candidateIdentitySha256: sha256(jsonBytes(identity)),
      subjectSha256: sha256Ac265HostedSemanticSubject(subject),
      kind,
      artifactSha256: sha256(
        Buffer.from(`synthetic fixture artifact ${artifactIndex}`),
      ),
      ...(sessionRefSha256 === undefined ? {} : { sessionRefSha256 }),
    };
    const bytes = jsonBytes(payload);
    evidenceBytes.set(ref, bytes);
    return { kind, ref, sha256: sha256(bytes) };
  };

  return { evidenceBytes, makeExecutionEvidence };
};
