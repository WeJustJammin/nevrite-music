import { createHash } from 'node:crypto';
import {
  Ac265HostedRunManifestV1Schema,
  type Ac265HostedRunManifestV1,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-run-manifest.ts';
import { ContentSchemaRegistryHostedRunnerContractSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input-references.ts';
import { CorrelationIdSchema } from '../../packages/contracts/src/identifiers.ts';

const FAILURE = 'AC265 hosted run manifest is invalid.';

export const AC265_HOSTED_RUN_MANIFEST_MAX_BYTES = 64 * 1024;

export interface Ac265HostedRunManifestBuildResult {
  readonly manifest: Ac265HostedRunManifestV1;
  readonly manifestSha256: string;
  readonly runnerContractSha256: string;
  // Byte accessors return a caller-owned copy of the held snapshot. Freezing a
  // non-empty `Buffer` with elements would throw, and a shared mutable array
  // would let a caller corrupt bytes after the digests were computed.
  readonly manifestBytes: () => Uint8Array;
  readonly runnerContractBytes: () => Uint8Array;
}

const fail = (message = FAILURE): never => {
  throw new Error(message);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const compareCodePoints = (left: string, right: string): number =>
  left < right ? -1 : 1;

// Exactly one contract collection is a set rather than a sequence: the four
// safe resource references are one per locked kind and distinct, and the V3
// verifier consumes them through a keyed map. Their array order therefore
// carries no meaning, so it is normalized to the contract's own locked
// declaration order before serialization and one logical contract yields one
// digest.
//
// Nothing else is reordered. The V3 verifier compares `roleResourceBindings`
// and `scenarioRoleBindings` by exact deep equality against the independently
// attested ac265-approved-runner-mappings-v1 bytes, so their element order is
// approval-source-significant: a reordered sequence is a different mapping and
// must produce a different digest rather than being silently normalized to
// match. There is no canonical set normalization for those collections.
//
// The normalized resource order is also applied to the manifest the builder
// returns, so the frozen object, the published bytes, and the digest all
// describe the same value.
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

const normalizeResourceRefs = (value: unknown): unknown =>
  Array.isArray(value)
    ? [...value].sort(
        lockedOrder<unknown>(
          CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS,
          (item) => String((item as { kind?: unknown }).kind),
        ),
      )
    : value;

const canonicalContractValue = (value: object): object => {
  const contract = value as { resourceRefs?: unknown };
  return {
    ...value,
    resourceRefs: normalizeResourceRefs(contract.resourceRefs),
  };
};

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
// ordered object members and UTF-8 JSON bytes, so the same logical manifest
// always produces the same digest.
export const canonicalManifestBytes = (value: object): Uint8Array =>
  Buffer.from(JSON.stringify(canonicalValue(value)), 'utf8');

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

const assertReferenceDigests = (manifest: Ac265HostedRunManifestV1): void => {
  for (const handle of Object.values(manifest.sessionHandles))
    if (handle.sha256 !== sha256Reference(handle.ref)) fail();
  for (const resource of manifest.resourceRefs)
    if (resource.sha256 !== sha256Reference(resource.ref)) fail();
};

// Builds the frozen run manifest from the exact `ac265-hosted-runner-v1`
// contract. The locked contract names a run correlation ID as manifest
// membership but names no source or format for it, so the protected
// orchestrator supplies `correlationId` as a UUID, matching this repository's
// correlation-ID convention. This builder never derives it from the run ID,
// the identity, or time.
//
// `correlationId` is a non-authority correlation label only. It carries no
// anti-replay meaning, no ordering or sequence meaning, and no binding or
// ownership meaning: the schema accepts any UUID version, including nil and
// v1, so it is not a v4 identifier and is neither asserted nor checked for
// global uniqueness. It distinguishes records; it authorizes nothing.
//
// The bounded control policy is the shared `controls` schema only. That schema
// constrains declared modes and numeric ranges; the pinned policy values
// (for example the 121-request rate-limit budget and the 60-second lease) are
// enforced by the separately versioned `ac265-hosted-runner-policy-v1`
// comparison at verification time, not by this builder.
//
// This is a reference container and shape/digest boundary only. It resolves no
// broker, verifies no attestation, and authorizes no role/resource or
// scenario/role mapping.
export const buildAc265HostedRunManifestV1 = (
  input: unknown,
): Ac265HostedRunManifestBuildResult => {
  if (!isRecord(input)) fail();
  if (
    Object.keys(input).length !== 2 ||
    !Object.hasOwn(input, 'correlationId') ||
    !Object.hasOwn(input, 'runnerContract')
  )
    fail();

  const correlationId = CorrelationIdSchema.safeParse(input['correlationId']);
  if (!correlationId.success) fail();
  const contract = ContentSchemaRegistryHostedRunnerContractSchema.safeParse(
    input['runnerContract'],
  );
  if (!contract.success) fail();

  const manifestCandidate = {
    schemaVersion: 'ac265-hosted-run-manifest-v1',
    criterion: contract.data.criterion,
    contractVersion: contract.data.schemaVersion,
    runId: contract.data.runId,
    correlationId: correlationId.data,
    identity: contract.data.identity,
    sessionHandles: contract.data.sessionHandles,
    resourceRefs: contract.data.resourceRefs,
    controls: contract.data.controls,
  };
  const manifest = Ac265HostedRunManifestV1Schema.safeParse(manifestCandidate);
  if (!manifest.success) fail();
  assertReferenceDigests(manifest.data);

  // Normalize before freezing so the returned manifest is exactly the value the
  // canonical bytes and digest describe: re-hashing it reproduces the digest.
  const normalizedManifest = Ac265HostedRunManifestV1Schema.safeParse({
    ...manifest.data,
    resourceRefs: normalizeResourceRefs(manifest.data.resourceRefs),
  });
  if (!normalizedManifest.success) fail();

  const manifestBytes = canonicalManifestBytes(normalizedManifest.data);
  const runnerContractBytes = canonicalManifestBytes(
    canonicalContractValue(contract.data),
  );
  if (
    manifestBytes.byteLength > AC265_HOSTED_RUN_MANIFEST_MAX_BYTES ||
    runnerContractBytes.byteLength > AC265_HOSTED_RUN_MANIFEST_MAX_BYTES
  )
    fail();

  return deepFreeze({
    manifest: normalizedManifest.data,
    manifestBytes: () => new Uint8Array(manifestBytes),
    manifestSha256: sha256Bytes(manifestBytes),
    runnerContractBytes: () => new Uint8Array(runnerContractBytes),
    runnerContractSha256: sha256Bytes(runnerContractBytes),
  });
};
