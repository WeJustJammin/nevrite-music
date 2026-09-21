import type { HostedArtifactAttestationKind } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-attestation.ts';
import { CmsReleaseKeyIdSchema } from '../../packages/contracts/src/content-schema-registry/primitives.ts';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import type {
  Ac265HostedArtifactExpectation,
  Ac265HostedArtifactSource,
  Ac265HostedArtifactTrust,
} from './content-schema-registry-hosted-e2e-protected-context.ts';
import type { Ac265HostedArtifactTrustedKey } from './ac265-hosted-artifact-attestation.ts';

const MAX_TRUSTED_KEYS = 16;
const MAX_ARTIFACT_BYTES = 64 * 1024;
const MAX_ATTESTATION_BYTES = 64 * 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const RECEIPT_REFERENCE_PATTERN =
  /^ac265-receipt:\/\/server\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const EVIDENCE_REFERENCE_PATTERN =
  /^ac265-evidence:\/\/blob\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

const fail = (message: string): never => {
  throw new Error(message);
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isKind = (
  value: unknown,
): value is HostedArtifactAttestationKind =>
  value === 'server_receipt' || value === 'execution_evidence';

export const isReferenceForKind = (
  kind: HostedArtifactAttestationKind,
  value: unknown,
): value is string =>
  typeof value === 'string' &&
  (kind === 'server_receipt'
    ? RECEIPT_REFERENCE_PATTERN.test(value)
    : EVIDENCE_REFERENCE_PATTERN.test(value));

export const requireDigest = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value))
    return fail(`AC265 hosted artifact ${label} is invalid.`);
  return value;
};

export const requireTimestamp = (value: unknown, label: string): string => {
  const parsed = SafeReleaseTimestampSchema.safeParse(value);
  if (!parsed.success)
    return fail(`AC265 hosted artifact ${label} is invalid.`);
  return parsed.data;
};

export const cloneTrustedKeys = (
  input: unknown,
): readonly Ac265HostedArtifactTrustedKey[] => {
  if (
    !Array.isArray(input) ||
    input.length === 0 ||
    input.length > MAX_TRUSTED_KEYS
  )
    return fail('AC265 hosted artifact trusted keys are invalid.');
  const seen = new Set<string>();
  const keys = input.map((value) => {
    if (!isRecord(value))
      return fail('AC265 hosted artifact trusted key is invalid.');
    const keyId = value['keyId'];
    const publicKeyPem = value['publicKeyPem'];
    const validFrom = value['validFrom'];
    const validUntil = value['validUntil'];
    const status = value['status'];
    if (
      !CmsReleaseKeyIdSchema.safeParse(keyId).success ||
      typeof publicKeyPem !== 'string' ||
      publicKeyPem.length === 0 ||
      publicKeyPem.length > 8_192 ||
      !(status === 'active' || status === 'revoked')
    )
      return fail('AC265 hosted artifact trusted key is invalid.');
    const normalizedKeyId = keyId as string;
    if (seen.has(normalizedKeyId))
      return fail('AC265 hosted artifact trusted keys are ambiguous.');
    seen.add(normalizedKeyId);
    const normalizedValidFrom = requireTimestamp(
      validFrom,
      'trusted key validity',
    );
    const normalizedValidUntil = requireTimestamp(
      validUntil,
      'trusted key validity',
    );
    if (Date.parse(normalizedValidUntil) <= Date.parse(normalizedValidFrom))
      return fail('AC265 hosted artifact trusted key validity is invalid.');
    return Object.freeze({
      keyId: normalizedKeyId,
      publicKeyPem,
      validFrom: normalizedValidFrom,
      validUntil: normalizedValidUntil,
      status,
    });
  });
  return Object.freeze(keys);
};

export const cloneTrust = (input: unknown): Ac265HostedArtifactTrust => {
  if (!isRecord(input)) return fail('AC265 hosted artifact trust is invalid.');
  const runId = input['runId'];
  if (typeof runId !== 'string' || !UUID_V4_PATTERN.test(runId))
    return fail('AC265 hosted artifact run identity is invalid.');
  return Object.freeze({
    runId,
    candidateIdentitySha256: requireDigest(
      input['candidateIdentitySha256'],
      'candidate identity digest',
    ),
    runnerContractSha256: requireDigest(
      input['runnerContractSha256'],
      'runner contract digest',
    ),
    trustedKeys: cloneTrustedKeys(input['trustedKeys']),
    trustedCutoffAt: requireTimestamp(
      input['trustedCutoffAt'],
      'trusted cutoff',
    ),
  });
};

export const cloneSource = (input: unknown): Ac265HostedArtifactSource => {
  if (!isRecord(input) || !isRecord(input['expectation']))
    return fail('AC265 hosted artifact source is invalid.');
  const expectation = input['expectation'];
  const kind = expectation['kind'];
  const ref = expectation['ref'];
  if (!isKind(kind) || !isReferenceForKind(kind, ref))
    return fail('AC265 hosted artifact source reference or kind is invalid.');
  const keyId = expectation['keyId'];
  if (!CmsReleaseKeyIdSchema.safeParse(keyId).success)
    return fail('AC265 hosted artifact source key is invalid.');
  const artifactBytes = input['artifactBytes'];
  const attestationBytes = input['attestationBytes'];
  if (
    !(artifactBytes instanceof Uint8Array) ||
    !(attestationBytes instanceof Uint8Array) ||
    artifactBytes.byteLength === 0 ||
    artifactBytes.byteLength > MAX_ARTIFACT_BYTES ||
    attestationBytes.byteLength === 0 ||
    attestationBytes.byteLength > MAX_ATTESTATION_BYTES
  )
    return fail('AC265 hosted artifact source bytes exceed bounded limits.');
  const normalizedExpectation: Ac265HostedArtifactExpectation = {
    kind,
    ref,
    keyId: keyId as string,
    subjectSha256: requireDigest(
      expectation['subjectSha256'],
      'subject digest',
    ),
  };
  return Object.freeze({
    expectation: Object.freeze(normalizedExpectation),
    artifactBytes: Buffer.from(artifactBytes),
    attestationBytes: Buffer.from(attestationBytes),
  });
};
