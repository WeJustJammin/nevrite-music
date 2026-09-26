import { isDeepStrictEqual } from 'node:util';

import {
  assertAc265ApprovedOutageTargetAttestationWindow,
  authenticateAc265ApprovedOutageTargetV1,
} from './ac265-approved-outage-target-attestation.ts';
import {
  assertAc265ApprovedRunnerMappingAttestationWindow,
  authenticateAc265ApprovedRunnerMappingsV1,
  type Ac265ApprovedRunnerMappingTrustedKey,
} from './ac265-approved-runner-mapping-attestation.ts';
import type { Ac265ApprovedOutageTargetTrustedKey } from './ac265-approved-outage-target-attestation.ts';
import {
  ContentSchemaRegistryHostedRunnerContractSchema,
  type ContentSchemaRegistryHostedRunnerContract,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import { ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-outage-lease-control.ts';
import { Ac265SessionBrokerAuthorizeResultSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-session-broker-control.ts';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import {
  canonicalAc265HostedRunnerContractBytes,
  sha256Bytes,
} from './ac265-hosted-run-manifest-crypto.ts';
import {
  deriveAc265HostedControls,
  deriveAc265HostedOutageLease,
  deriveAc265HostedResourceRefs,
  deriveAc265HostedSessionHandles,
  sha256Ac265HostedRunnerIdentityDigest,
} from './ac265-hosted-runner-contract-derivations.ts';
import { AC265_HOSTED_RUNNER_POLICY_V1 } from './ac265-hosted-runner-policy-v1.ts';

export const AC265_HOSTED_RUNNER_CONTRACT_COMPOSITION_FAILURE =
  'AC265 hosted runner contract composition failed';

const FAILURE = AC265_HOSTED_RUNNER_CONTRACT_COMPOSITION_FAILURE;

const INPUT_KEYS = [
  'mappingBytes',
  'mappingAttestationBytes',
  'mappingTrustedKeys',
  'targetBytes',
  'targetAttestationBytes',
  'targetTrustedKeys',
  'sessionBrokerAuthorization',
  'leaseAcquisition',
  'trustedStartedAt',
  'trustedCutoffAt',
] as const;

export interface Ac265HostedRunnerContractCompositionRequest {
  /** Exact canonical `ac265-approved-runner-mappings-v1` bytes (CP-03 source). */
  readonly mappingBytes: Uint8Array;
  /** Domain-separated Ed25519 attestation over those exact bytes. */
  readonly mappingAttestationBytes: Uint8Array;
  /** Independently trusted CP-03 keys; a caller boolean is not a substitute. */
  readonly mappingTrustedKeys: readonly Ac265ApprovedRunnerMappingTrustedKey[];
  /** Exact canonical `ac265-approved-outage-target-v1` bytes (CP-04a source). */
  readonly targetBytes: Uint8Array;
  /** Domain-separated Ed25519 attestation over those exact bytes. */
  readonly targetAttestationBytes: Uint8Array;
  /** Independently trusted CP-04a keys. */
  readonly targetTrustedKeys: readonly Ac265ApprovedOutageTargetTrustedKey[];
  /** Authenticated session-broker authorization carrying the nine handles. */
  readonly sessionBrokerAuthorization: unknown;
  /** CP-01 acquire result that issued the run-scoped one-use outage lease. */
  readonly leaseAcquisition: unknown;
  /** Trusted run start; never derived from the contract or scenario parameters. */
  readonly trustedStartedAt: string;
  /** Trusted cutoff captured from protected workflow state. */
  readonly trustedCutoffAt: string;
}

export interface Ac265HostedRunnerContractCompositionResult {
  readonly contract: ContentSchemaRegistryHostedRunnerContract;
  readonly runnerContractSha256: string;
  /**
   * Copy-on-read accessor for the exact canonical `ac265-hosted-runner-v1`
   * bytes. It returns a caller-owned copy, so a consumer cannot corrupt bytes
   * after the digest was computed.
   */
  readonly runnerContractBytes: () => Uint8Array;
}

const fail = (): never => {
  throw new Error(FAILURE);
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

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean =>
  Object.keys(value).length === expected.length &&
  expected.every((key) => Object.hasOwn(value, key));

const compose = (
  input: unknown,
): Ac265HostedRunnerContractCompositionResult => {
  if (!isRecord(input) || !hasExactKeys(input, INPUT_KEYS)) return fail();
  const startedAt = SafeReleaseTimestampSchema.safeParse(
    input['trustedStartedAt'],
  );
  const cutoffAt = SafeReleaseTimestampSchema.safeParse(
    input['trustedCutoffAt'],
  );
  if (!startedAt.success || !cutoffAt.success) return fail();
  if (Date.parse(startedAt.data) > Date.parse(cutoffAt.data)) return fail();

  // Authenticate the two protected sources. Neither the mapping, the target,
  // nor either attestation may come from dispatch data or the contract: these
  // strict readers accept only exact canonical bytes that a trusted key signed.
  const { mapping, attestation: mappingAttestation } =
    authenticateAc265ApprovedRunnerMappingsV1({
      mappingBytes: input['mappingBytes'] as Uint8Array,
      attestationBytes: input['mappingAttestationBytes'] as Uint8Array,
      trustedKeys: input[
        'mappingTrustedKeys'
      ] as readonly Ac265ApprovedRunnerMappingTrustedKey[],
    });
  const { target, attestation: targetAttestation } =
    authenticateAc265ApprovedOutageTargetV1({
      targetBytes: input['targetBytes'] as Uint8Array,
      attestationBytes: input['targetAttestationBytes'] as Uint8Array,
      trustedKeys: input[
        'targetTrustedKeys'
      ] as readonly Ac265ApprovedOutageTargetTrustedKey[],
    });
  // The two independent sources must describe the same attempt. A mapping or
  // target that authorizes a different run, hosting project, Supabase project,
  // or deployment is not authority for this run, so each scope field is
  // compared against the identity the mapping itself attests rather than
  // against a caller-supplied value.
  if (
    mapping.runId !== target.scope.runId ||
    target.scope.hostingProjectId !== mapping.identity.hostingProjectId ||
    target.scope.supabaseProjectRef !== mapping.identity.supabaseProjectRef ||
    target.scope.deploymentId !== mapping.identity.deploymentId
  )
    return fail();

  const authorization = Ac265SessionBrokerAuthorizeResultSchema.safeParse(
    input['sessionBrokerAuthorization'],
  );
  if (!authorization.success) return fail();
  const acquisition =
    ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema.safeParse(
      input['leaseAcquisition'],
    );
  if (!acquisition.success) return fail();

  const identity = mapping.identity;
  // The broker authorization must authenticate the same run, identity digest,
  // staging project, and deployment as the approved mapping and target. An
  // authorization minted for another attempt cannot supply this run's sessions.
  if (
    authorization.data.runId !== mapping.runId ||
    authorization.data.identitySha256 !==
      sha256Ac265HostedRunnerIdentityDigest(identity) ||
    authorization.data.environment !== identity.environment ||
    authorization.data.hostingProjectId !== identity.hostingProjectId
  )
    return fail();
  // The lease must have been acquired under that same authorization and for
  // exactly the authenticated outage target, so the reference it issued is the
  // only lease this contract may pin.
  if (
    acquisition.data.authorizationRef !== authorization.data.authorizationRef ||
    acquisition.data.targetRef !== target.targetRef
  )
    return fail();
  // Reuse the promoted window assertions instead of re-deriving the bounds here,
  // so this composer cannot drift from the policy the hosted gate already
  // applies. Together they enforce that each attestation was issued no earlier
  // than its source approval and no later than the trusted run start
  // (startedAt >= issuedAt), that the run start falls inside the attestation
  // lifetime, that the trusted cutoff covers the attestation expiry, and that
  // the source approval itself precedes the run. A run that starts before its
  // authority existed, or whose mapping was only approved after the run began,
  // is rejected here rather than composed into publishable bytes.
  assertAc265ApprovedRunnerMappingAttestationWindow({
    mapping,
    attestation: mappingAttestation,
    reportStartedAt: startedAt.data,
    trustedCutoffAt: cutoffAt.data,
  });
  assertAc265ApprovedOutageTargetAttestationWindow({
    target,
    attestation: targetAttestation,
    reportStartedAt: startedAt.data,
    trustedCutoffAt: cutoffAt.data,
  });

  const outageLease = deriveAc265HostedOutageLease({
    acquisition: acquisition.data,
    trustedStartedAt: startedAt.data,
    trustedCutoffAt: cutoffAt.data,
  });
  const parameters = AC265_HOSTED_RUNNER_POLICY_V1.scenarioParameters;
  const contract = ContentSchemaRegistryHostedRunnerContractSchema.safeParse({
    criterion: 'P2-S09-AC-265',
    schemaVersion: 'ac265-hosted-runner-v1',
    runId: mapping.runId,
    identity,
    sessionHandles: deriveAc265HostedSessionHandles(authorization.data),
    resourceRefs: deriveAc265HostedResourceRefs(mapping),
    controls: deriveAc265HostedControls(),
    scenarioParameters: {
      viewportWidthsCssPx: parameters.viewportWidthsCssPx,
      rateLimit429: parameters.rateLimit429,
      dependencyOutage: {
        dependencyId: target.scope.dependencyId,
        route: target.scope.route,
        leaseSeconds: parameters.dependencyOutage.leaseSeconds,
        maxRequests: parameters.dependencyOutage.maxRequests,
        outageLease,
      },
    },
    roleResourceBindings: mapping.roleResourceBindings,
    scenarioRoleBindings: mapping.scenarioRoleBindings,
  });
  if (!contract.success) return fail();
  // The composed value must be exactly what the promoted policy accepts for
  // these two authenticated sources; otherwise the bytes would be published in
  // a shape the hosted gate already rejects.
  if (
    !isDeepStrictEqual(contract.data.identity, mapping.identity) ||
    !isDeepStrictEqual(
      contract.data.roleResourceBindings,
      mapping.roleResourceBindings,
    ) ||
    !isDeepStrictEqual(
      contract.data.scenarioRoleBindings,
      mapping.scenarioRoleBindings,
    )
  )
    return fail();

  const runnerContractBytes = canonicalAc265HostedRunnerContractBytes(
    contract.data,
  );
  return deepFreeze({
    contract: contract.data,
    runnerContractSha256: sha256Bytes(runnerContractBytes),
    runnerContractBytes: () => new Uint8Array(runnerContractBytes),
  });
};

/**
 * Composes the canonical `ac265-hosted-runner-v1` contract bytes and digest
 * from the protected AC265 sources, fail-closed.
 *
 * Authority is derived, never accepted. The CP-03 authenticated runner-mapping
 * attestation supplies the run, candidate identity, role/resource bindings, and
 * scenario/role bindings; the CP-04a authenticated outage-target attestation
 * supplies the dependency and route; the authenticated session-broker
 * authorization supplies the nine role-matched session references; and the
 * CP-01 acquire result supplies the run-scoped one-use outage lease. The
 * bounded controls and fixed scenario parameters come from
 * `ac265-hosted-runner-policy-v1`.
 *
 * This composer produces contract bytes only. It creates no live authority, no
 * identity, no session, and no fault: it closes no acceptance criterion and
 * establishes no hosted acceptance.
 */
export const composeAc265HostedRunnerContractV1 = (
  input: unknown,
): Ac265HostedRunnerContractCompositionResult => {
  try {
    return compose(input);
  } catch {
    throw new Error(FAILURE);
  }
};
