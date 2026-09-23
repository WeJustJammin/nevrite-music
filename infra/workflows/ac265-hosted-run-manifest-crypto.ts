import { createHash } from 'node:crypto';
import {
  Ac265HostedRunManifestV1Schema,
  type Ac265HostedRunManifestV1,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-run-manifest.ts';
import { ContentSchemaRegistryHostedRunnerContractSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input-references.ts';
import { parseJsonBytesWithoutDuplicateMembers } from './strict-json-object-members.ts';

const FAILURE = 'AC265 hosted run manifest is invalid.';

export const AC265_HOSTED_RUN_MANIFEST_MAX_BYTES = 64 * 1024;

const fail = (message = FAILURE): never => {
  throw new Error(message);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const compareCodePoints = (left: string, right: string): number =>
  left < right ? -1 : 1;

// Exactly one manifest collection is a set rather than a sequence: the four safe
// resource references are one per locked kind and distinct, and the V3 verifier
// consumes them through a keyed map. Their array order carries no meaning, so it
// is normalized to the contract's own locked declaration order and one logical
// contract yields one digest.
//
// Nothing else is reordered. The V3 verifier compares `roleResourceBindings` and
// `scenarioRoleBindings` by exact deep equality against the independently
// attested ac265-approved-runner-mappings-v1 bytes, so their element order is
// approval-source-significant: a reordered sequence is a different mapping and
// must produce a different digest rather than being normalized to match.
const lockedOrder =
  <Item>(
    locked: readonly string[],
    keyOf: (item: Item) => string,
  ): ((left: Item, right: Item) => number) =>
  (left, right) => {
    const leftIndex = locked.indexOf(keyOf(left));
    const rightIndex = locked.indexOf(keyOf(right));
    return (
      (leftIndex === -1 ? locked.length : leftIndex) -
      (rightIndex === -1 ? locked.length : rightIndex)
    );
  };

export const normalizeAc265HostedResourceRefs = (value: unknown): unknown =>
  Array.isArray(value)
    ? [...value].sort(
        lockedOrder<unknown>(
          CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS,
          (item) => String((item as { kind?: unknown }).kind),
        ),
      )
    : value;

const canonicalValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort(compareCodePoints)
      .map((key) => [key, canonicalValue(value[key])]),
  );
};

// Mirror of the promoted source-manifest canonical form: recursively code-point
// ordered object members serialized as UTF-8 JSON, so one logical value always
// produces one byte sequence and one digest.
//
// Returns a fresh plain `Uint8Array`, never a `Buffer` and never a retained
// internal alias: `Buffer` is a `Uint8Array` subclass, and a shared mutable
// buffer would let a caller mutate bytes after the digest was computed.
export const canonicalManifestBytes = (value: object): Uint8Array =>
  new Uint8Array(Buffer.from(JSON.stringify(canonicalValue(value)), 'utf8'));

export const bytesEqual = (left: Uint8Array, right: Uint8Array): boolean =>
  Buffer.from(left).equals(Buffer.from(right));

export const sha256Bytes = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

const deepFreeze = <Value>(value: Value): Value => {
  if (
    value === null ||
    typeof value !== 'object' ||
    value instanceof Uint8Array ||
    Object.isFrozen(value)
  )
    return value;
  Object.freeze(value);
  for (const key of Reflect.ownKeys(value))
    deepFreeze((value as Record<PropertyKey, unknown>)[key]);
  return value;
};

const sha256Reference = (reference: string): string =>
  sha256Bytes(Buffer.from(reference, 'utf8'));

// A reference is only bound when its recorded digest digests the reference
// itself. The digest never covers session state, which the manifest cannot
// carry, and a reference is not authority to resolve the referenced object.
const assertReferenceDigests = (manifest: Ac265HostedRunManifestV1): void => {
  for (const handle of Object.values(manifest.sessionHandles))
    if (handle.sha256 !== sha256Reference(handle.ref)) fail();
  for (const resource of manifest.resourceRefs)
    if (resource.sha256 !== sha256Reference(resource.ref)) fail();
};

// Applies the one set-order normalization and re-validates, so the returned
// object is exactly the value the canonical bytes and digest describe.
export const normalizeAc265HostedRunManifest = (
  manifest: Ac265HostedRunManifestV1,
): Ac265HostedRunManifestV1 => {
  const normalized = Ac265HostedRunManifestV1Schema.safeParse({
    ...manifest,
    resourceRefs: normalizeAc265HostedResourceRefs(manifest.resourceRefs),
  });
  if (!normalized.success) fail();
  assertReferenceDigests(normalized.data);
  return normalized.data;
};

export const canonicalAc265HostedRunManifestBytes = (
  manifest: Ac265HostedRunManifestV1,
): Uint8Array =>
  canonicalManifestBytes(normalizeAc265HostedRunManifest(manifest));

export const canonicalAc265HostedRunnerContractBytes = (
  contract: unknown,
): Uint8Array => {
  const parsed =
    ContentSchemaRegistryHostedRunnerContractSchema.safeParse(contract);
  if (!parsed.success) fail();
  return canonicalManifestBytes({
    ...parsed.data,
    resourceRefs: normalizeAc265HostedResourceRefs(parsed.data.resourceRefs),
  });
};

// Reads a hosted run manifest from untrusted bytes. The manifest is the one
// artifact whose bytes arrive from outside the builder, so this boundary rejects
// non-bytes input, empty input, oversized input, duplicate JSON object members,
// schema drift, and any encoding that is not already the canonical form.
export const parseAc265HostedRunManifestV1Bytes = (
  bytes: Uint8Array,
): Ac265HostedRunManifestV1 => {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) fail();
  if (bytes.byteLength > AC265_HOSTED_RUN_MANIFEST_MAX_BYTES) fail();

  let parsed: unknown;
  try {
    parsed = parseJsonBytesWithoutDuplicateMembers(
      bytes,
      'AC265 hosted run manifest',
    );
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      /duplicate JSON object member/u.test(error.message)
    )
      throw error;
    fail();
  }

  const result = Ac265HostedRunManifestV1Schema.safeParse(parsed);
  if (!result.success) fail();
  const normalized = normalizeAc265HostedRunManifest(result.data);
  if (!bytesEqual(bytes, canonicalManifestBytes(normalized)))
    fail('AC265 hosted run manifest bytes are not canonical.');
  return deepFreeze(normalized);
};

export const canonicalizeAc265HostedRunManifestV1 = (
  input: unknown,
): Readonly<{
  readonly manifest: Ac265HostedRunManifestV1;
  readonly bytes: Uint8Array;
}> => {
  const result = Ac265HostedRunManifestV1Schema.safeParse(input);
  if (!result.success) fail();
  const normalized = normalizeAc265HostedRunManifest(result.data);
  return deepFreeze({
    manifest: normalized,
    bytes: canonicalManifestBytes(normalized),
  });
};

const isDigest = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value);

export const verifyAc265HostedRunManifestSha256 = (
  bytes: Uint8Array,
  expectedSha256: unknown,
): string => {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) fail();
  if (bytes.byteLength > AC265_HOSTED_RUN_MANIFEST_MAX_BYTES) fail();
  if (!isDigest(expectedSha256)) fail();
  const digest = sha256Bytes(bytes);
  if (digest !== expectedSha256) fail();
  return digest;
};

// Digest binding lives here rather than in the caller so a consumer cannot read
// manifest bytes without proving them against the expected digest. This is the
// entrypoint a hosted consumer should use instead of the bare parser.
export const readAc265HostedRunManifestV1Bytes = (
  bytes: Uint8Array,
  expectedSha256: unknown,
): Ac265HostedRunManifestV1 => {
  verifyAc265HostedRunManifestSha256(bytes, expectedSha256);
  return parseAc265HostedRunManifestV1Bytes(bytes);
};

export type { Ac265HostedRunManifestV1 };
