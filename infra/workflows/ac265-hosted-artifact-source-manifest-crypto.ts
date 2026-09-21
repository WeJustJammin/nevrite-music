import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
  type KeyObject,
} from 'node:crypto';

import {
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_DOMAIN,
  HostedArtifactSourceManifestV1Schema,
  type HostedArtifactSourceManifestV1,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-source-manifest.ts';
import { CmsReleaseKeyIdSchema } from '../../packages/contracts/src/content-schema-registry/primitives.ts';
import {
  SafeReleaseIdSchema,
  SafeReleaseTimestampSchema,
} from '../../packages/contracts/src/release-recovery-common.ts';
import { parseJsonBytesWithoutDuplicateMembers } from './strict-json-object-members.ts';

export const AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_MAX_BYTES = 64 * 1024;
export const AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_MAX_KEYS = 16;
export const AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_MAX_KEY_PEM_BYTES = 8_192;

const FAILURE = 'AC265 hosted artifact-source manifest is invalid.';
const SIGNING_PREFIX = `${AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_DOMAIN}\0`;

export interface Ac265HostedArtifactSourceManifestTrustedKey {
  readonly authorityId: string;
  readonly keyId: string;
  readonly publicKeyPem: string;
  readonly validFrom: string;
  readonly validUntil: string;
  readonly status: 'active' | 'revoked';
}

const fail = (message = FAILURE): never => {
  throw new Error(message);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const compareCodePoints = (left: string, right: string): number =>
  left < right ? -1 : 1;

const canonicalValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort(compareCodePoints)
      .map((key) => [key, canonicalValue(value[key])]),
  );
};

export const canonicalManifestBytes = (value: object): Uint8Array =>
  Buffer.from(JSON.stringify(canonicalValue(value)), 'utf8');
export const bytesEqual = (left: Uint8Array, right: Uint8Array): boolean =>
  Buffer.from(left).equals(Buffer.from(right));
export const sha256Bytes = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

const withoutSignature = (
  manifest: HostedArtifactSourceManifestV1,
): Omit<HostedArtifactSourceManifestV1, 'signature'> => ({
  schemaVersion: manifest.schemaVersion,
  domain: manifest.domain,
  algorithm: manifest.algorithm,
  criterion: manifest.criterion,
  environment: manifest.environment,
  source: manifest.source,
  authorityId: manifest.authorityId,
  authorityKeyId: manifest.authorityKeyId,
  manifestRef: manifest.manifestRef,
  authorizationRef: manifest.authorizationRef,
  runId: manifest.runId,
  candidateIdentitySha256: manifest.candidateIdentitySha256,
  sourceRevision: manifest.sourceRevision,
  deploymentId: manifest.deploymentId,
  runnerContractSha256: manifest.runnerContractSha256,
  sources: manifest.sources,
  issuedAt: manifest.issuedAt,
  expiresAt: manifest.expiresAt,
});

export const unsignedManifestBytes = (
  manifest: HostedArtifactSourceManifestV1,
): Uint8Array =>
  Buffer.concat([
    Buffer.from(SIGNING_PREFIX, 'utf8'),
    canonicalManifestBytes(withoutSignature(manifest)),
  ]);

const readPrivateKey = (pem: unknown): KeyObject => {
  if (
    typeof pem !== 'string' ||
    pem.length === 0 ||
    pem.length > AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_MAX_KEY_PEM_BYTES
  )
    return fail('AC265 source-manifest private key PEM is invalid.');
  try {
    const key = createPrivateKey(pem);
    if (key.asymmetricKeyType !== 'ed25519')
      return fail('AC265 source-manifest private key must be Ed25519.');
    return key;
  } catch {
    return fail('AC265 source-manifest private key PEM is invalid.');
  }
};

const readPublicKey = (pem: unknown): KeyObject => {
  if (
    typeof pem !== 'string' ||
    pem.length === 0 ||
    pem.length > AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_MAX_KEY_PEM_BYTES ||
    /PRIVATE KEY/u.test(pem)
  )
    return fail('AC265 source-manifest public key PEM is invalid.');
  try {
    const key = createPublicKey(pem);
    if (key.asymmetricKeyType !== 'ed25519')
      return fail('AC265 source-manifest public key must be Ed25519.');
    return key;
  } catch {
    return fail('AC265 source-manifest public key PEM is invalid.');
  }
};

export const parseAc265HostedArtifactSourceManifestBytes = (
  bytes: Uint8Array,
): HostedArtifactSourceManifestV1 => {
  if (
    !(bytes instanceof Uint8Array) ||
    bytes.byteLength === 0 ||
    bytes.byteLength > AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_MAX_BYTES
  )
    return fail('AC265 source-manifest bytes exceed bounded limits.');
  let parsed: unknown;
  try {
    parsed = parseJsonBytesWithoutDuplicateMembers(
      bytes,
      'AC265 hosted artifact-source manifest',
    );
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      /duplicate JSON object member/u.test(error.message)
    )
      throw error;
    return fail('AC265 source-manifest JSON is invalid.');
  }
  const result = HostedArtifactSourceManifestV1Schema.safeParse(parsed);
  if (!result.success) return fail();
  const canonical = canonicalManifestBytes(result.data);
  if (!bytesEqual(bytes, canonical))
    return fail('AC265 source-manifest bytes are not canonical.');
  return result.data;
};

export const canonicalizeAc265HostedArtifactSourceManifestV1 = (
  input: unknown,
): Readonly<{
  readonly manifest: HostedArtifactSourceManifestV1;
  readonly bytes: Uint8Array;
}> => {
  const result = HostedArtifactSourceManifestV1Schema.safeParse(input);
  if (!result.success) return fail();
  return { manifest: result.data, bytes: canonicalManifestBytes(result.data) };
};

export const createAc265HostedArtifactSourceManifest = (input: {
  readonly manifest: Omit<HostedArtifactSourceManifestV1, 'signature'>;
  readonly privateKeyPem: string;
}): Readonly<{
  readonly manifest: HostedArtifactSourceManifestV1;
  readonly manifestBytes: Uint8Array;
}> => {
  const manifestSnapshot = { ...input.manifest };
  const candidate = HostedArtifactSourceManifestV1Schema.safeParse({
    ...manifestSnapshot,
    signature: `${'A'.repeat(86)}==`,
  });
  if (!candidate.success) return fail();
  const signature = sign(
    null,
    unsignedManifestBytes(candidate.data),
    readPrivateKey(input.privateKeyPem),
  ).toString('base64');
  const parsed = HostedArtifactSourceManifestV1Schema.parse({
    ...candidate.data,
    signature,
  });
  return {
    manifest: parsed,
    manifestBytes: canonicalManifestBytes(parsed),
  };
};

export const cloneTrustedManifestKeys = (
  input: unknown,
): readonly Ac265HostedArtifactSourceManifestTrustedKey[] => {
  if (
    !Array.isArray(input) ||
    input.length === 0 ||
    input.length > AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_MAX_KEYS
  )
    return fail('AC265 source-manifest trusted keys are invalid.');
  const seen = new Set<string>();
  const keys = input.map((value) => {
    if (!isRecord(value))
      return fail('AC265 source-manifest trusted key is invalid.');
    const authorityId = value['authorityId'];
    const keyId = value['keyId'];
    const publicKeyPem = value['publicKeyPem'];
    const validFrom = value['validFrom'];
    const validUntil = value['validUntil'];
    const status = value['status'];
    if (
      typeof authorityId !== 'string' ||
      !SafeReleaseIdSchema.safeParse(authorityId).success ||
      !CmsReleaseKeyIdSchema.safeParse(keyId).success ||
      typeof publicKeyPem !== 'string' ||
      publicKeyPem.length === 0 ||
      publicKeyPem.length >
        AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_MAX_KEY_PEM_BYTES ||
      !(status === 'active' || status === 'revoked')
    )
      return fail('AC265 source-manifest trusted key is invalid.');
    const identity = `${authorityId}\0${keyId}`;
    if (seen.has(identity))
      return fail('AC265 source-manifest trusted keys are ambiguous.');
    seen.add(identity);
    const normalizedValidFrom = SafeReleaseTimestampSchema.safeParse(validFrom);
    const normalizedValidUntil =
      SafeReleaseTimestampSchema.safeParse(validUntil);
    if (!normalizedValidFrom.success || !normalizedValidUntil.success)
      return fail('AC265 source-manifest trusted key validity is invalid.');
    if (
      Date.parse(normalizedValidUntil.data) <=
      Date.parse(normalizedValidFrom.data)
    )
      return fail('AC265 source-manifest trusted key validity is invalid.');
    readPublicKey(publicKeyPem);
    return Object.freeze({
      authorityId,
      keyId: keyId as string,
      publicKeyPem,
      validFrom: normalizedValidFrom.data,
      validUntil: normalizedValidUntil.data,
      status,
    });
  });
  return Object.freeze(keys);
};

export const trustedManifestKeyFor = (
  keys: readonly Ac265HostedArtifactSourceManifestTrustedKey[],
  manifest: HostedArtifactSourceManifestV1,
): KeyObject => {
  const matching = keys.filter(
    (key) =>
      key.authorityId === manifest.authorityId &&
      key.keyId === manifest.authorityKeyId,
  );
  if (matching.length !== 1)
    return fail('AC265 source-manifest signing key is unknown or ambiguous.');
  const key = matching[0]!;
  if (key.status !== 'active')
    return fail('AC265 source-manifest signing key is revoked.');
  const issuedAt = Date.parse(manifest.issuedAt);
  const expiresAt = Date.parse(manifest.expiresAt);
  if (
    issuedAt < Date.parse(key.validFrom) ||
    expiresAt > Date.parse(key.validUntil)
  )
    return fail(
      'AC265 source-manifest signing key is outside its validity window.',
    );
  return readPublicKey(key.publicKeyPem);
};

export const verifyAc265HostedArtifactSourceManifestSignature = (input: {
  readonly manifest: HostedArtifactSourceManifestV1;
  readonly publicKey: KeyObject;
}): void => {
  const signature = Buffer.from(input.manifest.signature, 'base64');
  if (
    signature.byteLength !== 64 ||
    !verify(
      null,
      unsignedManifestBytes(input.manifest),
      input.publicKey,
      signature,
    )
  )
    return fail('AC265 source-manifest signature is untrusted.');
};
