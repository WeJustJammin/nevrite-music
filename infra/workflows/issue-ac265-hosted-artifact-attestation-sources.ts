import { HostedExecutionEvidencePayloadSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-execution-evidence.ts';
import { ContentSchemaRegistryHostedReceiptSubjectSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-receipt.ts';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import { sha256Ac265HostedSemanticSubject } from './ac265-hosted-semantic-subject.ts';
import {
  AC265_HOSTED_ARTIFACT_ATTESTATION_SOURCE_MEMBERS,
  failAc265HostedArtifactAttestationIssuance,
} from './issue-ac265-hosted-artifact-attestation-contract.ts';
import {
  isAc265AttestationMemberName,
  isAc265AttestationRecord,
} from './issue-ac265-hosted-artifact-attestation-files.ts';
import { parseJsonBytesWithoutDuplicateMembers } from './strict-json-object-members.ts';

export interface Ac265HostedArtifactAttestationDeclaredSource {
  readonly kind: 'server_receipt' | 'execution_evidence';
  readonly ref: string;
  readonly artifactMember: string;
  readonly subject: unknown;
  readonly issuedAt: string;
  readonly expiresAt: string;
}

const requireTimestamp = (value: unknown): string => {
  const parsed = SafeReleaseTimestampSchema.safeParse(value);
  if (!parsed.success) return failAc265HostedArtifactAttestationIssuance();
  return parsed.data;
};

export const parseAc265HostedArtifactAttestationDeclaredSource = (
  value: unknown,
): Ac265HostedArtifactAttestationDeclaredSource => {
  if (!isAc265AttestationRecord(value))
    return failAc265HostedArtifactAttestationIssuance();
  if (
    Object.keys(value).sort().join(',') !==
    [...AC265_HOSTED_ARTIFACT_ATTESTATION_SOURCE_MEMBERS].sort().join(',')
  )
    return failAc265HostedArtifactAttestationIssuance();
  const kind = value['kind'];
  if (kind !== 'server_receipt' && kind !== 'execution_evidence')
    return failAc265HostedArtifactAttestationIssuance();
  const ref = value['ref'];
  if (typeof ref !== 'string')
    return failAc265HostedArtifactAttestationIssuance();
  if (!isAc265AttestationMemberName(value['artifactMember']))
    return failAc265HostedArtifactAttestationIssuance();
  return {
    kind,
    ref,
    artifactMember: value['artifactMember'],
    subject: value['subject'],
    issuedAt: requireTimestamp(value['issuedAt']),
    expiresAt: requireTimestamp(value['expiresAt']),
  };
};

/**
 * Receipt subjects are read from the receipt bytes, never from the caller.
 * The declared descriptor, when present, must match the bytes exactly.
 */
export const subjectSha256ForAc265HostedServerReceipt = (
  bytes: Uint8Array,
  declared: unknown,
): string => {
  const document = parseJsonBytesWithoutDuplicateMembers(
    bytes,
    'AC265 hosted server receipt',
  );
  if (!isAc265AttestationRecord(document))
    return failAc265HostedArtifactAttestationIssuance();
  const parsed = ContentSchemaRegistryHostedReceiptSubjectSchema.safeParse(
    document['subject'],
  );
  if (!parsed.success) return failAc265HostedArtifactAttestationIssuance();
  const subjectSha256 = sha256Ac265HostedSemanticSubject(parsed.data);
  if (
    declared !== undefined &&
    subjectSha256 !== sha256Ac265HostedSemanticSubject(declared)
  )
    return failAc265HostedArtifactAttestationIssuance();
  return subjectSha256;
};

/**
 * Execution-evidence payloads carry only the subject digest, so the declared
 * role/scenario/teardown descriptor must equal the digest inside the bytes.
 */
export const subjectSha256ForAc265HostedExecutionEvidence = (
  bytes: Uint8Array,
  declared: unknown,
  candidateIdentitySha256: string,
): string => {
  const payload = HostedExecutionEvidencePayloadSchema.safeParse(
    parseJsonBytesWithoutDuplicateMembers(
      bytes,
      'AC265 hosted execution evidence',
    ),
  );
  if (!payload.success) return failAc265HostedArtifactAttestationIssuance();
  if (payload.data.candidateIdentitySha256 !== candidateIdentitySha256)
    return failAc265HostedArtifactAttestationIssuance();
  const subjectSha256 = sha256Ac265HostedSemanticSubject(declared);
  if (payload.data.subjectSha256 !== subjectSha256)
    return failAc265HostedArtifactAttestationIssuance();
  return subjectSha256;
};
