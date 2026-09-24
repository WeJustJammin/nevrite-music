import { isDeepStrictEqual } from 'node:util';

import { ContentSchemaRegistryHostedRunnerContractSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import {
  normalizeAc265HostedResourceRefs,
  sha256Bytes,
  readAc265HostedRunManifestV1Bytes,
  type Ac265HostedRunManifestV1,
} from './ac265-hosted-run-manifest-crypto.ts';
import {
  MAX_RETAINED_REPORT_BYTES,
  failAc265RetainedReport,
  requireAc265Digest,
} from './ac265-retained-report-provenance.ts';
import { parseJsonBytesWithoutDuplicateMembers } from './strict-json-object-members.ts';

/**
 * Membership the frozen run manifest shares with the retained-run contract,
 * paired with the projection each side is compared through. The manifest is a
 * reference container, so every shared member must be the exact value the
 * contract names: a manifest for another run, candidate, session set, resource
 * set, or control policy must not be able to authorize this run.
 *
 * `resourceRefs` is the one member the locked schemas treat as a set rather than
 * a sequence: `HostedResourceReferencesSchema` requires all four safe kinds
 * exactly once with distinct references and no ordering rule, and the CP-04f
 * builder normalizes the manifest side to the locked kind order. Comparing raw
 * array order would reject a legitimate contract that simply lists the same
 * four references in another order, so both sides pass through the same
 * normalization. The comparison stays exact-value: kind, reference, and digest
 * must still all be equal, so a drifted reference or digest is rejected.
 */
const SHARED_CONTRACT_MEMBERS = [
  { member: 'criterion', ordered: false },
  { member: 'contractVersion', ordered: false },
  { member: 'runId', ordered: false },
  { member: 'identity', ordered: false },
  { member: 'sessionHandles', ordered: false },
  { member: 'resourceRefs', ordered: true },
  { member: 'controls', ordered: false },
] as const;

type SharedContractMember = (typeof SHARED_CONTRACT_MEMBERS)[number]['member'];

// Session handles and controls are keyed records and the remaining members are
// scalars or strict objects, so only the resource-reference set is projected.
const projectSharedMember = (
  member: SharedContractMember,
  ordered: boolean,
  value: unknown,
): unknown =>
  ordered && member === 'resourceRefs'
    ? normalizeAc265HostedResourceRefs(value)
    : value;

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
 *
 * The contract buffer is bounded by the retained-byte cap before decoding, so an
 * oversized document is rejected instead of being decoded in full first. The
 * bound matches the one `parseRunnerContract` already applies to the same bytes.
 *
 * Bounded claim: the manifest digest returned here is not published anywhere the
 * locked V3 report or release-evidence schema can carry. `ac265-hosted-e2e-v3`
 * is strict and has no manifest member, and the release-evidence sidecar's
 * hosted section references only the report. The digest is therefore bound at
 * this producer boundary and returned to the protected caller, which is a
 * locally verifiable property, not hosted proof. Carrying it into retained
 * evidence would require a decision to change a locked schema and is not done
 * here.
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
  if (
    manifestBytes.byteLength > MAX_RETAINED_REPORT_BYTES ||
    contractBytes.byteLength > MAX_RETAINED_REPORT_BYTES
  )
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

  for (const { member, ordered } of SHARED_CONTRACT_MEMBERS) {
    const manifestValue = projectSharedMember(
      member,
      ordered,
      member === 'contractVersion'
        ? manifest.contractVersion
        : (manifest as unknown as Record<string, unknown>)[member],
    );
    const contractValue = projectSharedMember(
      member,
      ordered,
      member === 'contractVersion'
        ? contract.data.schemaVersion
        : (contract.data as unknown as Record<string, unknown>)[member],
    );
    if (!isDeepStrictEqual(manifestValue, contractValue))
      return failAc265RetainedReport();
  }

  return Object.freeze({
    manifest,
    sha256,
    bytes: () => new Uint8Array(snapshot),
  });
};
