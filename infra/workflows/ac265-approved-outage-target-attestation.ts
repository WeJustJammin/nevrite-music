import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
  type KeyObject,
} from 'node:crypto';

import {
  AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_DOMAIN,
  ApprovedOutageTargetAttestationV1Schema,
  type ApprovedOutageTargetAttestationV1,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-outage-target-attestation.ts';
import {
  ApprovedOutageTargetV1Schema,
  type ApprovedOutageTargetV1,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-outage-target.ts';
import { CmsReleaseKeyIdSchema } from '../../packages/contracts/src/content-schema-registry/primitives.ts';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import { parseJsonBytesWithoutDuplicateMembers } from './strict-json-object-members.ts';

const FAILURE = 'AC265 approved outage-target attestation is invalid.';
const MAX_DOCUMENT_BYTES = 64 * 1024;
const SIGNING_PREFIX = `${AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_DOMAIN}\0`;

type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | Readonly<Record<string, JsonValue>>;

export interface Ac265ApprovedOutageTargetTrustedKey {
  readonly keyId: string;
  readonly publicKeyPem: string;
  readonly validFrom: string;
  readonly validUntil: string;
  readonly status: 'active' | 'revoked';
}

const authenticatedTargets = new WeakMap<
  object,
  ApprovedOutageTargetAttestationV1
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

const canonicalBytes = (value: JsonValue): Uint8Array =>
  Buffer.from(JSON.stringify(sortJson(value)), 'utf8');

const bytesEqual = (left: Uint8Array, right: Uint8Array): boolean =>
  Buffer.from(left).equals(Buffer.from(right));

const sha256 = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

const parseTargetBytes = (
  bytes: Uint8Array,
): Readonly<{ target: ApprovedOutageTargetV1; bytes: Uint8Array }> => {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength > MAX_DOCUMENT_BYTES)
    return fail('AC265 approved outage target bytes are invalid.');
  let parsed: unknown;
  try {
    parsed = parseJsonBytesWithoutDuplicateMembers(
      bytes,
      'AC265 approved outage target',
    );
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      /duplicate JSON object member/u.test(error.message)
    )
      throw error;
    return fail('AC265 approved outage target JSON is invalid.');
  }
  const result = ApprovedOutageTargetV1Schema.safeParse(parsed);
  if (!result.success) return fail('AC265 approved outage target is invalid.');
  const canonical = canonicalBytes(result.data);
  if (!bytesEqual(bytes, canonical))
    return fail('AC265 approved outage target bytes are not canonical.');
  return { target: result.data, bytes: canonical };
};

const parseAttestationBytes = (
  bytes: Uint8Array,
): ApprovedOutageTargetAttestationV1 => {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength > MAX_DOCUMENT_BYTES)
    return fail('AC265 outage-target attestation bytes are invalid.');
  let parsed: unknown;
  try {
    parsed = parseJsonBytesWithoutDuplicateMembers(
      bytes,
      'AC265 outage-target attestation',
    );
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      /duplicate JSON object member/u.test(error.message)
    )
      throw error;
    return fail('AC265 outage-target attestation JSON is invalid.');
  }
  const result = ApprovedOutageTargetAttestationV1Schema.safeParse(parsed);
  if (!result.success)
    return fail('AC265 outage-target attestation is invalid.');
  if (!bytesEqual(bytes, canonicalBytes(result.data)))
    return fail('AC265 outage-target attestation bytes are not canonical.');
  return result.data;
};

const unsignedAttestation = (
  attestation: Omit<ApprovedOutageTargetAttestationV1, 'signature'>,
): Uint8Array =>
  Buffer.concat([
    Buffer.from(SIGNING_PREFIX, 'utf8'),
    canonicalBytes(attestation),
  ]);

const withoutSignature = (
  attestation: ApprovedOutageTargetAttestationV1,
): Omit<ApprovedOutageTargetAttestationV1, 'signature'> => ({
  schemaVersion: attestation.schemaVersion,
  domain: attestation.domain,
  algorithm: attestation.algorithm,
  keyId: attestation.keyId,
  targetRef: attestation.targetRef,
  runId: attestation.runId,
  targetSha256: attestation.targetSha256,
  issuedAt: attestation.issuedAt,
  expiresAt: attestation.expiresAt,
});

const readPrivateKey = (pem: unknown): KeyObject => {
  if (typeof pem !== 'string' || pem.length === 0 || pem.length > 8_192)
    return fail('AC265 outage-target private key PEM is invalid.');
  try {
    const key = createPrivateKey(pem);
    if (key.asymmetricKeyType !== 'ed25519')
      return fail('AC265 outage-target private key must be Ed25519.');
    return key;
  } catch {
    return fail('AC265 outage-target private key PEM is invalid.');
  }
};

const readPublicKey = (pem: unknown): KeyObject => {
  if (
    typeof pem !== 'string' ||
    pem.length === 0 ||
    pem.length > 8_192 ||
    /PRIVATE KEY/u.test(pem)
  )
    return fail('AC265 outage-target public key PEM is invalid.');
  try {
    const key = createPublicKey(pem);
    if (key.asymmetricKeyType !== 'ed25519')
      return fail('AC265 outage-target public key must be Ed25519.');
    return key;
  } catch {
    return fail('AC265 outage-target public key PEM is invalid.');
  }
};

const trustedKeyFor = (
  keys: readonly Ac265ApprovedOutageTargetTrustedKey[],
  attestation: ApprovedOutageTargetAttestationV1,
): KeyObject => {
  if (!Array.isArray(keys))
    return fail('AC265 outage-target trusted keys are invalid.');
  const matching = keys.filter((key) => key?.keyId === attestation.keyId);
  if (matching.length !== 1)
    return fail('AC265 outage-target signing key is unknown or ambiguous.');
  const key = matching[0]!;
  if (!CmsReleaseKeyIdSchema.safeParse(key.keyId).success)
    return fail('AC265 outage-target signing key id is invalid.');
  const validFrom = SafeReleaseTimestampSchema.safeParse(key.validFrom);
  const validUntil = SafeReleaseTimestampSchema.safeParse(key.validUntil);
  if (!validFrom.success || !validUntil.success)
    return fail('AC265 outage-target signing key validity is invalid.');
  const validFromMs = Date.parse(validFrom.data);
  const validUntilMs = Date.parse(validUntil.data);
  if (validUntilMs <= validFromMs)
    return fail('AC265 outage-target signing key validity is invalid.');
  if (key.status !== 'active')
    return fail('AC265 outage-target signing key is revoked.');
  const issuedAt = Date.parse(attestation.issuedAt);
  const expiresAt = Date.parse(attestation.expiresAt);
  if (issuedAt < validFromMs || expiresAt > validUntilMs)
    return fail(
      'AC265 outage-target signing key is outside its validity window.',
    );
  return readPublicKey(key.publicKeyPem);
};

export const canonicalizeAc265ApprovedOutageTargetV1 = (
  input: unknown,
): Readonly<{ target: ApprovedOutageTargetV1; bytes: Uint8Array }> => {
  const result = ApprovedOutageTargetV1Schema.safeParse(input);
  if (!result.success) return fail('AC265 approved outage target is invalid.');
  return { target: result.data, bytes: canonicalBytes(result.data) };
};

export const createAc265ApprovedOutageTargetAttestation = (input: {
  readonly targetBytes: Uint8Array;
  readonly keyId: string;
  readonly privateKeyPem: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
}): Readonly<{
  target: ApprovedOutageTargetV1;
  attestation: ApprovedOutageTargetAttestationV1;
  attestationBytes: Uint8Array;
}> => {
  const { target, bytes } = parseTargetBytes(input.targetBytes);
  const unsigned = {
    schemaVersion: 'ac265-approved-outage-target-attestation-v1' as const,
    domain: AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_DOMAIN,
    algorithm: 'Ed25519' as const,
    keyId: input.keyId,
    targetRef: target.targetRef,
    runId: target.scope.runId,
    targetSha256: sha256(bytes),
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
  };
  const signature = sign(
    null,
    unsignedAttestation(unsigned),
    readPrivateKey(input.privateKeyPem),
  ).toString('base64');
  const parsed = ApprovedOutageTargetAttestationV1Schema.safeParse({
    ...unsigned,
    signature,
  });
  if (!parsed.success)
    return fail('AC265 outage-target attestation is invalid.');
  if (
    Date.parse(parsed.data.issuedAt) < Date.parse(target.approvedAt) ||
    Date.parse(parsed.data.expiresAt) > Date.parse(target.expiresAt)
  )
    return fail('AC265 outage-target attestation time window is invalid.');
  return {
    target,
    attestation: parsed.data,
    attestationBytes: canonicalBytes(parsed.data),
  };
};

export const authenticateAc265ApprovedOutageTargetV1 = (input: {
  readonly targetBytes: Uint8Array;
  readonly attestationBytes: Uint8Array;
  readonly trustedKeys: readonly Ac265ApprovedOutageTargetTrustedKey[];
}): Readonly<{
  target: ApprovedOutageTargetV1;
  attestation: ApprovedOutageTargetAttestationV1;
}> => {
  const { target, bytes } = parseTargetBytes(input.targetBytes);
  const attestation = parseAttestationBytes(input.attestationBytes);
  if (
    attestation.targetSha256 !== sha256(bytes) ||
    attestation.targetRef !== target.targetRef ||
    attestation.runId !== target.scope.runId ||
    Date.parse(attestation.issuedAt) < Date.parse(target.approvedAt) ||
    Date.parse(attestation.expiresAt) > Date.parse(target.expiresAt)
  )
    return fail('AC265 outage-target attestation does not match the target.');
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
    return fail('AC265 outage-target attestation signature is untrusted.');
  authenticatedTargets.set(target, attestation);
  return { target, attestation };
};

export const assertAc265ApprovedOutageTargetAttestationWindow = (input: {
  readonly target: ApprovedOutageTargetV1;
  readonly attestation: ApprovedOutageTargetAttestationV1;
  readonly reportStartedAt: string;
  readonly trustedCutoffAt: string;
}): void => {
  if (authenticatedTargets.get(input.target) !== input.attestation)
    return fail('AC265 outage-target attestation was not authenticated.');
  const reportStartedAt = SafeReleaseTimestampSchema.safeParse(
    input.reportStartedAt,
  );
  const trustedCutoffAt = SafeReleaseTimestampSchema.safeParse(
    input.trustedCutoffAt,
  );
  if (!reportStartedAt.success || !trustedCutoffAt.success)
    return fail('AC265 outage-target attestation window is invalid.');
  const startedAt = Date.parse(reportStartedAt.data);
  const approvedAt = Date.parse(input.target.approvedAt);
  const targetExpiresAt = Date.parse(input.target.expiresAt);
  const issuedAt = Date.parse(input.attestation.issuedAt);
  const expiresAt = Date.parse(input.attestation.expiresAt);
  const cutoffAt = Date.parse(trustedCutoffAt.data);
  if (
    input.attestation.targetRef !== input.target.targetRef ||
    input.attestation.runId !== input.target.scope.runId ||
    issuedAt < approvedAt ||
    expiresAt > targetExpiresAt ||
    startedAt < issuedAt ||
    startedAt >= expiresAt ||
    cutoffAt < expiresAt ||
    startedAt > cutoffAt
  )
    return fail(
      'AC265 outage-target attestation is outside the trusted window.',
    );
};
