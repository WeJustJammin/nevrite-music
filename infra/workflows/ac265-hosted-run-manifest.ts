import {
  Ac265HostedRunManifestV1Schema,
  type Ac265HostedRunManifestV1,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-run-manifest.ts';
import { ContentSchemaRegistryHostedRunnerContractSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import { CorrelationIdSchema } from '../../packages/contracts/src/identifiers.ts';
import {
  AC265_HOSTED_RUN_MANIFEST_MAX_BYTES,
  canonicalAc265HostedRunnerContractBytes,
  canonicalManifestBytes,
  normalizeAc265HostedRunManifest,
  sha256Bytes,
} from './ac265-hosted-run-manifest-crypto.ts';

const FAILURE = 'AC265 hosted run manifest is invalid.';

export {
  AC265_HOSTED_RUN_MANIFEST_MAX_BYTES,
  canonicalManifestBytes,
  sha256Bytes,
};

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
  // Normalize before freezing so the returned manifest is exactly the value the
  // canonical bytes and digest describe: re-hashing it reproduces the digest.
  const normalizedManifest = normalizeAc265HostedRunManifest(manifest.data);

  const manifestBytes = canonicalManifestBytes(normalizedManifest);
  const runnerContractBytes = canonicalAc265HostedRunnerContractBytes(
    contract.data,
  );
  if (
    manifestBytes.byteLength > AC265_HOSTED_RUN_MANIFEST_MAX_BYTES ||
    runnerContractBytes.byteLength > AC265_HOSTED_RUN_MANIFEST_MAX_BYTES
  )
    fail();

  return deepFreeze({
    manifest: normalizedManifest,
    manifestBytes: () => new Uint8Array(manifestBytes),
    manifestSha256: sha256Bytes(manifestBytes),
    runnerContractBytes: () => new Uint8Array(runnerContractBytes),
    runnerContractSha256: sha256Bytes(runnerContractBytes),
  });
};
