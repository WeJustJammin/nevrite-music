import { isDeepStrictEqual } from 'node:util';

import { ContentSchemaRegistryHostedRunnerContractSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import {
  sha256Bytes,
  readAc265HostedRunManifestV1Bytes,
  type Ac265HostedRunManifestV1,
} from './ac265-hosted-run-manifest-crypto.ts';
import {
  failAc265RetainedReport,
  requireAc265Digest,
} from './ac265-retained-report-provenance.ts';
import { parseJsonBytesWithoutDuplicateMembers } from './strict-json-object-members.ts';

/**
 * Membership the frozen run manifest shares with the retained-run contract. The
 * manifest is a reference container, so every shared member must be the exact
 * value the contract names: a manifest for another run, candidate, session set,
 * resource set, or control policy must not be able to authorize this run.
 */
const SHARED_CONTRACT_MEMBERS = [
  'criterion',
  'contractVersion',
  'runId',
  'identity',
  'sessionHandles',
  'resourceRefs',
  'controls',
] as const;

/**
 * Reads the protected run manifest from the exact bytes the orchestrator
 * supplies and binds its membership to the runner contract those same bytes
 * describe.
 *
 * The bytes must be the canonical CP-04f form: the digest-bound read boundary
 * rejects duplicate members, schema drift, and any encoding that is not already
 * canonical, so insertion-ordered members fail closed here instead of being
 * quietly re-canonicalized into a different digest. The digest is recomputed
 * over the supplied bytes and must equal the independently trusted value, so a
 * fabricated digest cannot stand in for the manifest.
 *
 * The contract is read from `runnerContractBytes` — the same bytes the report is
 * assembled from — rather than from the manifest, so the two artifacts cannot
 * validate each other.
 */
export const parseAc265RetainedReportRunManifest = (input: {
  runManifestBytes: unknown;
  expectedRunManifestSha256: unknown;
  runnerContractBytes: unknown;
}): Readonly<{
  manifest: Ac265HostedRunManifestV1;
  sha256: string;
  // Copy-on-read accessor for the exact verified bytes, matching the CP-04f
  // build result: a caller cannot mutate bytes after the digest was computed.
  bytes: () => Uint8Array;
}> => {
  const manifestBytes = input.runManifestBytes;
  const contractBytes = input.runnerContractBytes;
  if (!(manifestBytes instanceof Uint8Array) || manifestBytes.byteLength === 0)
    return failAc265RetainedReport();
  if (!(contractBytes instanceof Uint8Array) || contractBytes.byteLength === 0)
    return failAc265RetainedReport();
  const expected = requireAc265Digest(input.expectedRunManifestSha256);

  // Snapshot before verifying, so a caller that mutates the array afterwards
  // cannot change the bytes the digest and the manifest describe.
  const snapshot = new Uint8Array(manifestBytes);

  const contract = ContentSchemaRegistryHostedRunnerContractSchema.safeParse(
    parseJsonBytesWithoutDuplicateMembers(
      contractBytes,
      'AC265 hosted runner contract',
    ),
  );
  if (!contract.success) return failAc265RetainedReport();

  // Digest binding happens inside the read boundary: bytes that are not the
  // canonical form, or that do not hash to the trusted digest, never parse.
  const manifest = readAc265HostedRunManifestV1Bytes(snapshot, expected);
  // Published verbatim as the digest recomputed over the bytes this run bound;
  // the read boundary has already proven it equals the trusted value.
  const sha256 = sha256Bytes(snapshot);

  for (const member of SHARED_CONTRACT_MEMBERS) {
    const manifestValue =
      member === 'contractVersion'
        ? manifest.contractVersion
        : (manifest as unknown as Record<string, unknown>)[member];
    const contractValue =
      member === 'contractVersion'
        ? contract.data.schemaVersion
        : (contract.data as unknown as Record<string, unknown>)[member];
    if (!isDeepStrictEqual(manifestValue, contractValue))
      return failAc265RetainedReport();
  }

  return Object.freeze({
    manifest,
    sha256,
    bytes: () => new Uint8Array(snapshot),
  });
};
