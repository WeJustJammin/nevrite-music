import {
  createHash,
  createPrivateKey,
  createPublicKey,
  type KeyObject,
} from 'node:crypto';

import {
  AC265_HOSTED_ARTIFACT_ATTESTATION_DOMAIN,
  HostedArtifactAttestationV1Schema,
  type HostedArtifactAttestationV1,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-attestation.ts';
import { CmsReleaseKeyIdSchema } from '../../packages/contracts/src/content-schema-registry/primitives.ts';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import { parseJsonBytesWithoutDuplicateMembers } from './strict-json-object-members.ts';
import type {
  Ac265HostedArtifactExpectedBindings,
  Ac265HostedArtifactTrustedKey,
} from './ac265-hosted-artifact-attestation.ts';

const FAILURE = 'AC265 hosted artifact attestation is invalid.';
const MAX_ARTIFACT_BYTES = 64 * 1024;
const MAX_ATTESTATION_BYTES = 64 * 1024;
const SIGNING_PREFIX = `${AC265_HOSTED_ARTIFACT_ATTESTATION_DOMAIN}\0`;

const fail = (message = FAILURE): never => {
  throw new Error(message);
};

export const canonicalBytes = (value: object): Uint8Array =>
  Buffer.from(
    JSON.stringify(
      Object.fromEntries(
        Object.keys(value)
          .sort()
          .map((key) => [key, Reflect.get(value, key)]),
      ),
    ),
    'utf8',
  );

export const bytesEqual = (left: Uint8Array, right: Uint8Array): boolean =>
  Buffer.from(left).equals(Buffer.from(right));

export const sha256 = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

export const requireArtifactBytes = (bytes: Uint8Array): Uint8Array => {
  if (
    !(bytes instanceof Uint8Array) ||
    bytes.byteLength === 0 ||
    bytes.byteLength > MAX_ARTIFACT_BYTES
  )
    return fail('AC265 hosted artifact bytes are invalid.');
  return bytes;
};

export const parseAttestationBytes = (
  bytes: Uint8Array,
): HostedArtifactAttestationV1 => {
  if (
    !(bytes instanceof Uint8Array) ||
    bytes.byteLength === 0 ||
    bytes.byteLength > MAX_ATTESTATION_BYTES
  )
    return fail('AC265 hosted artifact attestation bytes are invalid.');
  let parsed: unknown;
  try {
    parsed = parseJsonBytesWithoutDuplicateMembers(
      bytes,
      'AC265 hosted artifact attestation',
    );
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      /duplicate JSON object member/u.test(error.message)
    )
      throw error;
    return fail('AC265 hosted artifact attestation JSON is invalid.');
  }
  const result = HostedArtifactAttestationV1Schema.safeParse(parsed);
  if (!result.success) return fail();
  if (!bytesEqual(bytes, canonicalBytes(result.data)))
    return fail('AC265 hosted artifact attestation bytes are not canonical.');
  return result.data;
};

export const unsignedAttestation = (
  attestation: Omit<HostedArtifactAttestationV1, 'signature'>,
): Uint8Array =>
  Buffer.concat([
    Buffer.from(SIGNING_PREFIX, 'utf8'),
    canonicalBytes(attestation),
  ]);

export const withoutSignature = (
  attestation: HostedArtifactAttestationV1,
): Omit<HostedArtifactAttestationV1, 'signature'> => ({
  schemaVersion: attestation.schemaVersion,
  domain: attestation.domain,
  algorithm: attestation.algorithm,
  keyId: attestation.keyId,
  kind: attestation.kind,
  artifactRef: attestation.artifactRef,
  artifactSha256: attestation.artifactSha256,
  runId: attestation.runId,
  candidateIdentitySha256: attestation.candidateIdentitySha256,
  runnerContractSha256: attestation.runnerContractSha256,
  subjectSha256: attestation.subjectSha256,
  issuedAt: attestation.issuedAt,
  expiresAt: attestation.expiresAt,
});

export const readPrivateKey = (pem: unknown): KeyObject => {
  if (typeof pem !== 'string' || pem.length === 0 || pem.length > 8_192)
    return fail('AC265 hosted artifact private key PEM is invalid.');
  try {
    const key = createPrivateKey(pem);
    if (key.asymmetricKeyType !== 'ed25519')
      return fail('AC265 hosted artifact private key must be Ed25519.');
    return key;
  } catch {
    return fail('AC265 hosted artifact private key PEM is invalid.');
  }
};

const readPublicKey = (pem: unknown): KeyObject => {
  if (
    typeof pem !== 'string' ||
    pem.length === 0 ||
    pem.length > 8_192 ||
    /PRIVATE KEY/u.test(pem)
  )
    return fail('AC265 hosted artifact public key PEM is invalid.');
  try {
    const key = createPublicKey(pem);
    if (key.asymmetricKeyType !== 'ed25519')
      return fail('AC265 hosted artifact public key must be Ed25519.');
    return key;
  } catch {
    return fail('AC265 hosted artifact public key PEM is invalid.');
  }
};

export const trustedKeyFor = (
  keys: readonly Ac265HostedArtifactTrustedKey[],
  attestation: HostedArtifactAttestationV1,
): KeyObject => {
  if (!Array.isArray(keys))
    return fail('AC265 hosted artifact trusted keys are invalid.');
  const matching = keys.filter((key) => key?.keyId === attestation.keyId);
  if (matching.length !== 1)
    return fail('AC265 hosted artifact signing key is unknown or ambiguous.');
  const key = matching[0]!;
  if (!CmsReleaseKeyIdSchema.safeParse(key.keyId).success)
    return fail('AC265 hosted artifact signing-key identity is invalid.');
  const validFrom = SafeReleaseTimestampSchema.safeParse(key.validFrom);
  const validUntil = SafeReleaseTimestampSchema.safeParse(key.validUntil);
  if (!validFrom.success || !validUntil.success)
    return fail('AC265 hosted artifact signing-key validity is invalid.');
  const validFromMs = Date.parse(validFrom.data);
  const validUntilMs = Date.parse(validUntil.data);
  if (validUntilMs <= validFromMs)
    return fail('AC265 hosted artifact signing-key validity is invalid.');
  if (key.status !== 'active')
    return fail('AC265 hosted artifact signing key is revoked.');
  const issuedAt = Date.parse(attestation.issuedAt);
  const expiresAt = Date.parse(attestation.expiresAt);
  if (issuedAt < validFromMs || expiresAt > validUntilMs)
    return fail(
      'AC265 hosted artifact signing key is outside its validity window.',
    );
  return readPublicKey(key.publicKeyPem);
};

export const matchesExpectedBindings = (
  attestation: HostedArtifactAttestationV1,
  expected: Ac265HostedArtifactExpectedBindings,
): boolean =>
  attestation.keyId === expected.keyId &&
  attestation.kind === expected.kind &&
  attestation.artifactRef === expected.artifactRef &&
  attestation.runId === expected.runId &&
  attestation.candidateIdentitySha256 === expected.candidateIdentitySha256 &&
  attestation.runnerContractSha256 === expected.runnerContractSha256 &&
  attestation.subjectSha256 === expected.subjectSha256;

export const snapshotExpectedBindings = (
  value: Ac265HostedArtifactExpectedBindings,
): Ac265HostedArtifactExpectedBindings => {
  if (typeof value !== 'object' || value === null)
    return fail('AC265 hosted artifact expected bindings are invalid.');
  return Object.freeze({
    keyId: value.keyId,
    kind: value.kind,
    artifactRef: value.artifactRef,
    runId: value.runId,
    candidateIdentitySha256: value.candidateIdentitySha256,
    runnerContractSha256: value.runnerContractSha256,
    subjectSha256: value.subjectSha256,
  });
};
