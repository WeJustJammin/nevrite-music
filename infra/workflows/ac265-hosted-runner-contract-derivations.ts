import { createHash } from 'node:crypto';

import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import type { ApprovedRunnerMappingsV1 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-runner-mappings.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input-references.ts';
import { serializeAc265HostedRunnerIdentityForDigest } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-candidate-enrollment.ts';
import type { ContentSchemaRegistryAc265OutageLeaseAcquireResult } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-outage-lease-control.ts';
import type { Ac265SessionBrokerAuthorizeResult } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-session-broker-control.ts';
import { AC265_OUTAGE_LEASE_MAX_DURATION_SECONDS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-outage-lease-control.ts';
import { AC265_HOSTED_RUNNER_POLICY_V1 } from './ac265-hosted-runner-policy-v1.ts';

const FAILURE = 'AC265 hosted runner contract derivation failed';

type HostedRole = (typeof CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES)[number];
type HostedResourceKind =
  (typeof CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS)[number];

export type DerivedSessionHandles = Readonly<
  Record<HostedRole, Readonly<{ ref: string; sha256: string }>>
>;
export type DerivedResourceRefs = readonly Readonly<{
  kind: HostedResourceKind;
  ref: string;
  sha256: string;
}>[];
export type DerivedOutageLease = Readonly<{
  ref: string;
  sha256: string;
  acquiredAt: string;
  expiresAt: string;
}>;
export type DerivedControls = Readonly<{
  googleMode: 'fresh_google_oauth_through_supabase';
  logoutScope: 'current_session_only';
  faultControlMode: 'staging_one_use_lease';
  subjectPolicy: 'existing_adults_only';
  resourcePolicy: 'preexisting_synthetic_staging_only';
  authorityPolicy: 'server_verified_no_grant_mutation';
  rateLimitMaxRequests: number;
  dependencyOutageLeaseSeconds: number;
  dependencyOutageMaxRequests: 1;
}>;

const fail = (message = FAILURE): never => {
  throw new Error(message);
};

const UUID_V4 =
  '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

const SESSION_REFERENCE_PATTERN = new RegExp(
  `^ac265-session://(${CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.join('|')})/(${UUID_V4})$`,
  'u',
);

const RESOURCE_REFERENCE_PATTERN = new RegExp(
  `^ac265-resource://(${CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.join('|')})/(${UUID_V4})$`,
  'u',
);

const LEASE_REFERENCE_PATTERN = new RegExp(
  `^ac265-lease://staging/(${UUID_V4})$`,
  'u',
);

/** Lowercase SHA-256 of an exact UTF-8 reference, the only digest form AC265 records. */
export const sha256Ac265HostedRunnerReference = (reference: string): string =>
  createHash('sha256').update(Buffer.from(reference, 'utf8')).digest('hex');

/**
 * The synchronous equivalent of `sha256Ac265HostedRunnerIdentity`, which is
 * asynchronous because it uses WebCrypto. Both digest
 * `JSON.stringify(schema.parse(identity))`, so a protected source that
 * computed the asynchronous form agrees with this one byte for byte.
 */
export const sha256Ac265HostedRunnerIdentityDigest = (
  identity: unknown,
): string => {
  let serialized: string;
  try {
    serialized = serializeAc265HostedRunnerIdentityForDigest(identity);
  } catch {
    return fail();
  }
  return createHash('sha256')
    .update(Buffer.from(serialized, 'utf8'))
    .digest('hex');
};

/**
 * Projects the nine authenticated broker handles into the contract's session
 * map. Each handle must already bind its own role and digest its own reference;
 * the broker result is authenticated state, so this never trusts a caller.
 */
export const deriveAc265HostedSessionHandles = (
  authorization: Ac265SessionBrokerAuthorizeResult,
): DerivedSessionHandles => {
  if (!Array.isArray(authorization.handles)) return fail();
  if (
    authorization.handles.length !== CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length
  )
    return fail();

  const handles: Partial<Record<HostedRole, { ref: string; sha256: string }>> =
    {};
  const references = new Set<string>();
  for (const handle of authorization.handles) {
    const match = SESSION_REFERENCE_PATTERN.exec(handle.handleRef);
    if (match === null || match[1] !== handle.role) return fail();
    if (handle.role in handles) return fail();
    if (references.has(handle.handleRef)) return fail();
    // A handle digest is only meaningful when it digests the reference itself;
    // an asserted digest for a reference the source does not hold is not proof.
    if (
      handle.handleSha256 !== sha256Ac265HostedRunnerReference(handle.handleRef)
    )
      return fail();
    references.add(handle.handleRef);
    handles[handle.role] = {
      ref: handle.handleRef,
      sha256: handle.handleSha256,
    };
  }
  for (const role of CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES)
    if (!(role in handles)) return fail();
  return handles as DerivedSessionHandles;
};

/**
 * Derives the approved safe-resource manifest from the independently approved
 * mapping. The mapping is the only source of role/resource authority, so the
 * manifest is exactly the set of references the mapping binds: one reference
 * per locked kind, in the locked declaration order. A kind the mapping does not
 * bind, or binds to two different references, fails closed rather than being
 * narrowed or invented.
 */
export const deriveAc265HostedResourceRefs = (
  mapping: ApprovedRunnerMappingsV1,
): DerivedResourceRefs => {
  const references = new Map<HostedResourceKind, string>();
  for (const role of CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES) {
    const bindings = mapping.roleResourceBindings[role];
    if (!Array.isArray(bindings)) return fail();
    for (const reference of bindings) {
      const match = RESOURCE_REFERENCE_PATTERN.exec(reference);
      if (match === null) return fail();
      const kind = match[1] as HostedResourceKind;
      const existing = references.get(kind);
      if (existing !== undefined && existing !== reference) return fail();
      references.set(kind, reference);
    }
  }
  return CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.map((kind) => {
    const reference = references.get(kind);
    if (reference === undefined) return fail();
    return {
      kind,
      ref: reference,
      sha256: sha256Ac265HostedRunnerReference(reference),
    };
  });
};

/**
 * Projects the CP-01 acquire result into the contract's run-scoped outage-lease
 * reference. The lease is issued by the control plane, so its reference,
 * digest, and window are copied from that result rather than computed here, and
 * the exactly-60-second one-request policy is re-asserted rather than assumed.
 */
export const deriveAc265HostedOutageLease = (input: {
  readonly acquisition: ContentSchemaRegistryAc265OutageLeaseAcquireResult;
  readonly trustedStartedAt: string;
  readonly trustedCutoffAt: string;
}): DerivedOutageLease => {
  const { acquisition } = input;
  if (!LEASE_REFERENCE_PATTERN.test(acquisition.leaseRef)) return fail();
  if (
    acquisition.leaseSha256 !==
    sha256Ac265HostedRunnerReference(acquisition.leaseRef)
  )
    return fail();
  if (
    acquisition.leaseDurationSeconds !==
      AC265_OUTAGE_LEASE_MAX_DURATION_SECONDS ||
    acquisition.requestLimit !== 1 ||
    acquisition.state !== 'acquired' ||
    acquisition.environment !== 'staging' ||
    acquisition.redacted !== true
  )
    return fail();
  const acquiredAt = Date.parse(acquisition.acquiredAt);
  const expiresAt = Date.parse(acquisition.expiresAt);
  const startedAt = Date.parse(input.trustedStartedAt);
  const cutoffAt = Date.parse(input.trustedCutoffAt);
  if (
    !Number.isFinite(acquiredAt) ||
    !Number.isFinite(expiresAt) ||
    !Number.isFinite(startedAt) ||
    !Number.isFinite(cutoffAt)
  )
    return fail();
  // The lease is issued before the run it serves, must still be live when that
  // run starts (otherwise it could never be consumed inside the run), expires
  // no later than the trusted cutoff, and lasts exactly its bounded window.
  if (
    expiresAt - acquiredAt !==
      AC265_OUTAGE_LEASE_MAX_DURATION_SECONDS * 1_000 ||
    acquiredAt > startedAt ||
    startedAt >= expiresAt ||
    expiresAt > cutoffAt
  )
    return fail();
  return {
    ref: acquisition.leaseRef,
    sha256: acquisition.leaseSha256,
    acquiredAt: acquisition.acquiredAt,
    expiresAt: acquisition.expiresAt,
  };
};

/**
 * Builds the bounded controls the contract must declare. Every value is either
 * a locked literal or a pinned policy maximum: nothing here is caller-supplied,
 * and the rate-limit budget and lease duration track the policy rather than
 * being restated, so the two cannot drift apart.
 */
export const deriveAc265HostedControls = (): DerivedControls => {
  const policy = AC265_HOSTED_RUNNER_POLICY_V1.scenarioParameters;
  if (
    policy.dependencyOutage.leaseSeconds >
    AC265_OUTAGE_LEASE_MAX_DURATION_SECONDS
  )
    return fail();
  return {
    googleMode: 'fresh_google_oauth_through_supabase',
    logoutScope: 'current_session_only',
    faultControlMode: 'staging_one_use_lease',
    subjectPolicy: 'existing_adults_only',
    resourcePolicy: 'preexisting_synthetic_staging_only',
    authorityPolicy: 'server_verified_no_grant_mutation',
    rateLimitMaxRequests: policy.rateLimit429.maxRequests,
    dependencyOutageLeaseSeconds: policy.dependencyOutage.leaseSeconds,
    dependencyOutageMaxRequests: policy.dependencyOutage.maxRequests,
  };
};
