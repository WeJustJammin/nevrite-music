import { createHash } from 'node:crypto';

import { HostedExecutionEvidencePayloadSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-execution-evidence.ts';
import { serializeAc265HostedRunnerIdentityForDigest } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-candidate-enrollment.ts';
import { ContentSchemaRegistryHostedReceiptEnvelopeSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-receipt.ts';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import { sha256Ac265HostedSemanticSubject } from './ac265-hosted-semantic-subject.ts';
import {
  AC265_HOSTED_ARTIFACT_ATTESTATION_SOURCE_MEMBERS,
  failAc265HostedArtifactAttestationIssuance,
} from './issue-ac265-hosted-artifact-attestation-contract.ts';
import { Ac265HostedArtifactAttestationEvidenceSubjectSchema } from './ac265-hosted-artifact-attestation-issuer-inputs.ts';
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
 * Receipt bytes must be a complete, duplicate-member-free server-receipt
 * envelope, not just a bare subject. The full envelope is validated before
 * signing, and the run identity plus the declared subject must match the
 * authenticated caller run binding, so a malformed or foreign-run receipt
 * cannot be attested. Canonical byte form is deliberately not required: the
 * signed artifact digest is over the exact bytes and the resolver compares the
 * digest of the same bytes, so member order and whitespace carry no meaning.
 */
export const subjectSha256ForAc265HostedServerReceipt = (
  bytes: Uint8Array,
  declared: unknown,
  runId: string,
  candidateIdentitySha256: string,
): string => {
  const document = parseJsonBytesWithoutDuplicateMembers(
    bytes,
    'AC265 hosted server receipt',
  );
  if (!isAc265AttestationRecord(document))
    return failAc265HostedArtifactAttestationIssuance();
  const envelope =
    ContentSchemaRegistryHostedReceiptEnvelopeSchema.safeParse(document);
  if (!envelope.success) return failAc265HostedArtifactAttestationIssuance();
  if (envelope.data.runId !== runId)
    return failAc265HostedArtifactAttestationIssuance();
  const receiptCandidateIdentitySha256 = createHash('sha256')
    .update(
      Buffer.from(
        serializeAc265HostedRunnerIdentityForDigest(envelope.data.identity),
        'utf8',
      ),
    )
    .digest('hex');
  if (receiptCandidateIdentitySha256 !== candidateIdentitySha256)
    return failAc265HostedArtifactAttestationIssuance();
  const subjectSha256 = sha256Ac265HostedSemanticSubject(envelope.data.subject);
  if (
    declared !== undefined &&
    subjectSha256 !== sha256Ac265HostedSemanticSubject(declared)
  )
    return failAc265HostedArtifactAttestationIssuance();
  return subjectSha256;
};

/**
 * The evidence payload's own `kind` is the discriminator the CP-04c verifier
 * compares against the descriptor's mapped kind, so the two must agree here.
 * Without this mapping a payload could carry the digest of one descriptor kind
 * while declaring another, and the producer would sign evidence that every
 * resolver rejects — the same produce-then-reject class the run identity fixes.
 */
const EXECUTION_EVIDENCE_KIND_FOR_SUBJECT_KIND = {
  role: 'role_assertion',
  scenario: 'scenario_observation',
  session_teardown: 'session_teardown',
} as const;

/**
 * Execution-evidence payloads carry only the subject digest, so the declared
 * role/scenario/teardown descriptor must equal the digest inside the bytes and
 * must map to the payload's own `kind`.
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
  const descriptor =
    Ac265HostedArtifactAttestationEvidenceSubjectSchema.safeParse(declared);
  if (!descriptor.success) return failAc265HostedArtifactAttestationIssuance();
  if (
    payload.data.kind !==
    EXECUTION_EVIDENCE_KIND_FOR_SUBJECT_KIND[descriptor.data.kind]
  )
    return failAc265HostedArtifactAttestationIssuance();
  const subjectSha256 = sha256Ac265HostedSemanticSubject(descriptor.data);
  if (payload.data.subjectSha256 !== subjectSha256)
    return failAc265HostedArtifactAttestationIssuance();
  return subjectSha256;
};
