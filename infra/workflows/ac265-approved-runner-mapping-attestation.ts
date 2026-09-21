import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
  type KeyObject,
} from 'node:crypto';

import {
  AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_DOMAIN,
  ApprovedRunnerMappingAttestationV1Schema,
  type ApprovedRunnerMappingAttestationV1,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-runner-mapping-attestation.ts';
import {
  ApprovedRunnerMappingsV1Schema,
  type ApprovedRunnerMappingsV1,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-runner-mappings.ts';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import { parseJsonBytesWithoutDuplicateMembers } from './strict-json-object-members.ts';

const FAILURE = 'AC265 approved runner mapping attestation is invalid.';
const MAX_DOCUMENT_BYTES = 64 * 1024;
const SIGNING_PREFIX = `${AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_DOMAIN}\0`;

type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | Readonly<Record<string, JsonValue>>;

export interface Ac265ApprovedRunnerMappingTrustedKey {
  readonly keyId: string;
  readonly publicKeyPem: string;
  readonly validFrom: string;
  readonly validUntil: string;
  readonly status: 'active' | 'revoked';
}

const authenticatedMappings = new WeakMap<
  object,
  ApprovedRunnerMappingAttestationV1
>();

const fail = (message = FAILURE): never => {
  throw new Error(message);
};

const sortJson = (value: JsonValue): JsonValue => {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, nested]) => [key, sortJson(nested)]),
    );
  }
  return value;
};

const canonicalBytes = (value: unknown): Uint8Array =>
  Buffer.from(JSON.stringify(sortJson(value as JsonValue)), 'utf8');

const bytesEqual = (left: Uint8Array, right: Uint8Array): boolean =>
  Buffer.from(left).equals(Buffer.from(right));

const sha256 = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

const parseMappingBytes = (
  bytes: Uint8Array,
): Readonly<{ mapping: ApprovedRunnerMappingsV1; bytes: Uint8Array }> => {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength > MAX_DOCUMENT_BYTES)
    return fail('AC265 approved runner mapping bytes are invalid.');
  let parsed: unknown;
  try {
    parsed = parseJsonBytesWithoutDuplicateMembers(
      bytes,
      'AC265 approved runner mapping',
    );
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      /duplicate JSON object member/u.test(error.message)
    )
      throw error;
    return fail('AC265 approved runner mapping JSON is invalid.');
  }
  const result = ApprovedRunnerMappingsV1Schema.safeParse(parsed);
  if (!result.success) return fail('AC265 approved runner mapping is invalid.');
  const canonical = canonicalBytes(result.data);
  if (!bytesEqual(bytes, canonical))
    return fail('AC265 approved runner mapping bytes are not canonical.');
  return { mapping: result.data, bytes: canonical };
};

const parseAttestationBytes = (
  bytes: Uint8Array,
): ApprovedRunnerMappingAttestationV1 => {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength > MAX_DOCUMENT_BYTES)
    return fail('AC265 runner mapping attestation bytes are invalid.');
  let parsed: unknown;
  try {
    parsed = parseJsonBytesWithoutDuplicateMembers(
      bytes,
      'AC265 runner mapping attestation',
    );
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      /duplicate JSON object member/u.test(error.message)
    )
      throw error;
    return fail('AC265 runner mapping attestation JSON is invalid.');
  }
  const result = ApprovedRunnerMappingAttestationV1Schema.safeParse(parsed);
  if (!result.success)
    return fail('AC265 runner mapping attestation is invalid.');
  if (!bytesEqual(bytes, canonicalBytes(result.data)))
    return fail('AC265 runner mapping attestation bytes are not canonical.');
  return result.data;
};

const unsignedAttestation = (
  attestation: Omit<ApprovedRunnerMappingAttestationV1, 'signature'>,
): Uint8Array =>
  Buffer.concat([
    Buffer.from(SIGNING_PREFIX, 'utf8'),
    canonicalBytes(attestation),
  ]);

const withoutSignature = (
  attestation: ApprovedRunnerMappingAttestationV1,
): Omit<ApprovedRunnerMappingAttestationV1, 'signature'> => ({
  schemaVersion: attestation.schemaVersion,
  domain: attestation.domain,
  algorithm: attestation.algorithm,
  keyId: attestation.keyId,
  mappingId: attestation.mappingId,
  runId: attestation.runId,
  mappingSha256: attestation.mappingSha256,
  issuedAt: attestation.issuedAt,
  expiresAt: attestation.expiresAt,
});

const readPrivateKey = (pem: unknown): KeyObject => {
  if (typeof pem !== 'string' || pem.length === 0 || pem.length > 8_192)
    return fail('AC265 runner mapping private key PEM is invalid.');
  try {
    const key = createPrivateKey(pem);
    if (key.asymmetricKeyType !== 'ed25519')
      return fail('AC265 runner mapping private key must be Ed25519.');
    return key;
  } catch {
    return fail('AC265 runner mapping private key PEM is invalid.');
  }
};

const readPublicKey = (pem: unknown): KeyObject => {
  if (
    typeof pem !== 'string' ||
    pem.length === 0 ||
    pem.length > 8_192 ||
    /PRIVATE KEY/u.test(pem)
  )
    return fail('AC265 runner mapping public key PEM is invalid.');
  try {
    const key = createPublicKey(pem);
    if (key.asymmetricKeyType !== 'ed25519')
      return fail('AC265 runner mapping public key must be Ed25519.');
    return key;
  } catch {
    return fail('AC265 runner mapping public key PEM is invalid.');
  }
};

const trustedKeyFor = (
  keys: readonly Ac265ApprovedRunnerMappingTrustedKey[],
  attestation: ApprovedRunnerMappingAttestationV1,
): KeyObject => {
  if (!Array.isArray(keys))
    return fail('AC265 runner mapping trusted keys are invalid.');
  const matching = keys.filter((key) => key?.keyId === attestation.keyId);
  if (matching.length !== 1)
    return fail('AC265 runner mapping signing key is unknown or ambiguous.');
  const key = matching[0]!;
  const validFrom = SafeReleaseTimestampSchema.safeParse(key.validFrom);
  const validUntil = SafeReleaseTimestampSchema.safeParse(key.validUntil);
  if (!validFrom.success || !validUntil.success)
    return fail('AC265 runner mapping signing key validity is invalid.');
  if (key.status !== 'active')
    return fail('AC265 runner mapping signing key is revoked.');
  const issuedAt = Date.parse(attestation.issuedAt);
  if (
    issuedAt < Date.parse(validFrom.data) ||
    Date.parse(attestation.expiresAt) > Date.parse(validUntil.data)
  )
    return fail(
      'AC265 runner mapping signing key is outside its validity window.',
    );
  return readPublicKey(key.publicKeyPem);
};

export const canonicalizeAc265ApprovedRunnerMappingsV1 = (
  input: unknown,
): Readonly<{ mapping: ApprovedRunnerMappingsV1; bytes: Uint8Array }> => {
  const result = ApprovedRunnerMappingsV1Schema.safeParse(input);
  if (!result.success) return fail('AC265 approved runner mapping is invalid.');
  return { mapping: result.data, bytes: canonicalBytes(result.data) };
};

export const createAc265ApprovedRunnerMappingAttestation = (input: {
  readonly mappingBytes: Uint8Array;
  readonly keyId: string;
  readonly privateKeyPem: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
}): Readonly<{
  mapping: ApprovedRunnerMappingsV1;
  attestation: ApprovedRunnerMappingAttestationV1;
  attestationBytes: Uint8Array;
}> => {
  const { mapping } = parseMappingBytes(input.mappingBytes);
  const unsigned = {
    schemaVersion: 'ac265-approved-runner-mapping-attestation-v1' as const,
    domain: AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_DOMAIN,
    algorithm: 'Ed25519' as const,
    keyId: input.keyId,
    mappingId: mapping.mappingId,
    runId: mapping.runId,
    mappingSha256: sha256(input.mappingBytes),
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
  };
  const signature = sign(
    null,
    unsignedAttestation(unsigned),
    readPrivateKey(input.privateKeyPem),
  ).toString('base64');
  const parsed = ApprovedRunnerMappingAttestationV1Schema.safeParse({
    ...unsigned,
    signature,
  });
  if (!parsed.success)
    return fail('AC265 runner mapping attestation is invalid.');
  if (Date.parse(parsed.data.issuedAt) < Date.parse(mapping.approvedAt))
    return fail('AC265 runner mapping attestation time window is invalid.');
  return {
    mapping,
    attestation: parsed.data,
    attestationBytes: canonicalBytes(parsed.data),
  };
};

export const authenticateAc265ApprovedRunnerMappingsV1 = (input: {
  readonly mappingBytes: Uint8Array;
  readonly attestationBytes: Uint8Array;
  readonly trustedKeys: readonly Ac265ApprovedRunnerMappingTrustedKey[];
}): Readonly<{
  mapping: ApprovedRunnerMappingsV1;
  attestation: ApprovedRunnerMappingAttestationV1;
}> => {
  const { mapping } = parseMappingBytes(input.mappingBytes);
  const attestation = parseAttestationBytes(input.attestationBytes);
  if (
    attestation.mappingSha256 !== sha256(input.mappingBytes) ||
    attestation.mappingId !== mapping.mappingId ||
    attestation.runId !== mapping.runId ||
    Date.parse(attestation.issuedAt) < Date.parse(mapping.approvedAt)
  )
    return fail('AC265 runner mapping attestation does not match the mapping.');
  const publicKey = trustedKeyFor(input.trustedKeys, attestation);
  const signature = Buffer.from(attestation.signature, 'base64');
  if (
    signature.byteLength !== 64 ||
    !verify(
      null,
      unsignedAttestation(withoutSignature(attestation)),
      publicKey,
      signature,
    )
  )
    return fail('AC265 runner mapping attestation signature is untrusted.');
  authenticatedMappings.set(mapping, attestation);
  return { mapping, attestation };
};

export const assertAc265ApprovedRunnerMappingAttestationWindow = (input: {
  readonly mapping: ApprovedRunnerMappingsV1;
  readonly attestation: ApprovedRunnerMappingAttestationV1;
  readonly reportStartedAt: string;
  readonly trustedCutoffAt: string;
}): void => {
  if (authenticatedMappings.get(input.mapping) !== input.attestation)
    return fail('AC265 runner mapping attestation was not authenticated.');
  const reportStartedAt = SafeReleaseTimestampSchema.safeParse(
    input.reportStartedAt,
  );
  const trustedCutoffAt = SafeReleaseTimestampSchema.safeParse(
    input.trustedCutoffAt,
  );
  if (!reportStartedAt.success || !trustedCutoffAt.success)
    return fail('AC265 runner mapping attestation window is invalid.');
  const startedAt = Date.parse(reportStartedAt.data);
  const issuedAt = Date.parse(input.attestation.issuedAt);
  const expiresAt = Date.parse(input.attestation.expiresAt);
  const cutoffAt = Date.parse(trustedCutoffAt.data);
  if (
    input.attestation.mappingId !== input.mapping.mappingId ||
    input.attestation.runId !== input.mapping.runId ||
    issuedAt < Date.parse(input.mapping.approvedAt) ||
    startedAt < issuedAt ||
    startedAt >= expiresAt ||
    cutoffAt < expiresAt ||
    startedAt > cutoffAt
  )
    return fail(
      'AC265 runner mapping attestation is outside the trusted window.',
    );
};
