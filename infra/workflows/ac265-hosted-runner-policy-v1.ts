import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import {
  AC265_APPROVED_OUTAGE_TARGET_SCHEMA_VERSION,
  AC265_APPROVED_OUTAGE_TARGET_SOURCE,
  ApprovedOutageTargetV1Schema,
  type ApprovedOutageTargetV1,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-outage-target.ts';
import {
  AC265_APPROVED_RUNNER_MAPPINGS_SCHEMA_VERSION,
  ApprovedRunnerMappingsV1Schema,
  type ApprovedRunnerMappingsV1,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-runner-mappings.ts';
import type { ContentSchemaRegistryHostedRunnerContract } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import { parseJsonBytesWithoutDuplicateMembers } from './strict-json-object-members.ts';

export const AC265_HOSTED_RUNNER_POLICY_V1_VERSION =
  'ac265-hosted-runner-policy-v1' as const;
const authenticatedTargets = new WeakSet<object>();
const authenticatedRunnerMappings = new WeakSet<object>();

const deepFreeze = <Value>(value: Value): Value => {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
};

export const AC265_HOSTED_RUNNER_POLICY_V1 = deepFreeze({
  version: AC265_HOSTED_RUNNER_POLICY_V1_VERSION,
  scenarioParameters: {
    viewportWidthsCssPx: { mobile: 320, tablet: 769, desktop: 1_025 },
    rateLimit429: {
      target: {
        operationId: 'CMS-03A-06',
        method: 'GET',
        path: '/api/v1/cms/content-types',
        rateClass: 'cms-definition-read',
        perUserPerMinute: 120,
      },
      maxRequests: 121,
    },
    dependencyOutage: {
      targetSource: AC265_APPROVED_OUTAGE_TARGET_SOURCE,
      leaseSeconds: 60,
      maxRequests: 1,
      outageLease: {
        required: true,
        referencePrefix: 'ac265-lease://staging/',
        referenceDigest: 'sha256(canonical-utf8-reference)',
        maxDurationMs: 60_000,
        exactlyOneConsume: true,
        authenticatedReceiptRequired: true,
        releaseProofRequired: true,
      },
    },
  },
} as const);

type HostedRunnerContract = ContentSchemaRegistryHostedRunnerContract;

const sha256Reference = (reference: string): string =>
  createHash('sha256').update(Buffer.from(reference, 'utf8')).digest('hex');

export const authenticateApprovedOutageTargetV1 = (
  bytes: Uint8Array,
  verifyAuthenticity: (bytes: Uint8Array, parsedTarget: unknown) => boolean,
): ApprovedOutageTargetV1 => {
  let parsed: unknown;
  try {
    parsed = parseJsonBytesWithoutDuplicateMembers(
      bytes,
      'AC265 approved outage target',
    );
  } catch (error: unknown) {
    throw new Error(
      `AC265 approved outage target bytes are invalid: ${error instanceof Error ? error.message : 'unknown error'}.`,
      {
        cause: error,
      },
    );
  }
  const result = ApprovedOutageTargetV1Schema.safeParse(parsed);
  if (!result.success)
    throw new Error('AC265 approved outage target is invalid.');
  if (verifyAuthenticity(bytes, result.data) !== true)
    throw new Error('AC265 approved outage target authenticity is untrusted.');
  authenticatedTargets.add(result.data);
  return result.data;
};

export const authenticateApprovedRunnerMappingsV1 = (
  bytes: Uint8Array,
  verifyAuthenticity: (
    bytes: Uint8Array,
    parsedMappings: ApprovedRunnerMappingsV1,
  ) => boolean,
): ApprovedRunnerMappingsV1 => {
  let parsed: unknown;
  const sourceBytes = bytes.slice();
  try {
    parsed = parseJsonBytesWithoutDuplicateMembers(
      sourceBytes,
      'AC265 approved runner mappings',
    );
  } catch (error: unknown) {
    throw new Error(
      `AC265 approved runner mapping bytes are invalid: ${error instanceof Error ? error.message : 'unknown error'}.`,
      {
        cause: error,
      },
    );
  }
  const result = ApprovedRunnerMappingsV1Schema.safeParse(parsed);
  if (!result.success)
    throw new Error('AC265 approved runner mappings are invalid.');
  if (
    /(placeholder|approved-staging|example|fixture|todo)/iu.test(
      result.data.mappingId,
    )
  )
    throw new Error(
      'AC265 approved runner mapping contains placeholder values.',
    );
  if (verifyAuthenticity(sourceBytes, result.data) !== true)
    throw new Error('AC265 approved runner mapping authenticity is untrusted.');
  authenticatedRunnerMappings.add(result.data);
  return result.data;
};

const assertApprovedTargetIsReal = (target: ApprovedOutageTargetV1): void => {
  if (!authenticatedTargets.has(target))
    throw new Error(
      `AC265 approved outage target must come from the protected source (${AC265_APPROVED_OUTAGE_TARGET_SCHEMA_VERSION}).`,
    );
  const possiblePlaceholders = [
    target.targetId,
    target.scope.dependencyId,
    target.scope.route.operationId,
    target.scope.route.path,
  ];
  if (
    possiblePlaceholders.some((value) =>
      /(placeholder|approved-staging|ac265-staging-fault|example|fixture|todo)/iu.test(
        value,
      ),
    )
  )
    throw new Error(
      'AC265 approved outage target contains placeholder values.',
    );
};

const assertApprovedRunnerMappingsAreReal = (
  mappings: ApprovedRunnerMappingsV1,
): void => {
  if (!authenticatedRunnerMappings.has(mappings))
    throw new Error(
      `AC265 approved runner mappings must come from the protected source (${AC265_APPROVED_RUNNER_MAPPINGS_SCHEMA_VERSION}).`,
    );
  if (
    /(placeholder|approved-staging|example|fixture|todo)/iu.test(
      mappings.mappingId,
    )
  )
    throw new Error(
      'AC265 approved runner mapping contains placeholder values.',
    );
};

const createCompletePolicy = (target: ApprovedOutageTargetV1) => {
  assertApprovedTargetIsReal(target);
  const partial = AC265_HOSTED_RUNNER_POLICY_V1;
  return {
    ...partial,
    approvedOutageTarget: target,
    scenarioParameters: {
      ...partial.scenarioParameters,
      dependencyOutage: {
        dependencyId: target.scope.dependencyId,
        route: target.scope.route,
        leaseSeconds: partial.scenarioParameters.dependencyOutage.leaseSeconds,
        maxRequests: partial.scenarioParameters.dependencyOutage.maxRequests,
        outageLeasePolicy:
          partial.scenarioParameters.dependencyOutage.outageLease,
      },
    },
  };
};

const assertScenarioParameters = (
  contract: HostedRunnerContract,
  policy: ReturnType<typeof createCompletePolicy>,
): void => {
  const parameters = contract.scenarioParameters;
  const { outageLease, ...dependencyOutage } = parameters.dependencyOutage;
  const actualFixedParameters = {
    viewportWidthsCssPx: parameters.viewportWidthsCssPx,
    rateLimit429: parameters.rateLimit429,
    dependencyOutage,
  };
  const { outageLeasePolicy, ...expectedDependencyOutage } =
    policy.scenarioParameters.dependencyOutage;
  const expectedFixedParameters = {
    viewportWidthsCssPx: policy.scenarioParameters.viewportWidthsCssPx,
    rateLimit429: policy.scenarioParameters.rateLimit429,
    dependencyOutage: expectedDependencyOutage,
  };
  if (!isDeepStrictEqual(actualFixedParameters, expectedFixedParameters))
    throw new Error(
      `Hosted E2E scenario parameter policy mismatch (${AC265_HOSTED_RUNNER_POLICY_V1_VERSION}).`,
    );
  if (
    outageLease === undefined ||
    !outageLease.ref.startsWith(outageLeasePolicy.referencePrefix) ||
    outageLease.sha256 !== sha256Reference(outageLease.ref)
  )
    throw new Error(
      `Hosted E2E outage lease reference violates policy (${AC265_HOSTED_RUNNER_POLICY_V1_VERSION}).`,
    );
};

export const assertAc265HostedRunnerPolicyV1 = (
  contract: HostedRunnerContract,
  target: ApprovedOutageTargetV1,
  mappings: ApprovedRunnerMappingsV1,
  reportStartedAt: string,
  trustedCutoffAt: string,
): void => {
  const policy = createCompletePolicy(target);
  assertApprovedRunnerMappingsAreReal(mappings);
  if (
    mappings.runId !== contract.runId ||
    !isDeepStrictEqual(mappings.identity, contract.identity)
  )
    throw new Error(
      'AC265 approved runner mapping does not match the trusted run identity.',
    );
  if (
    Date.parse(mappings.approvedAt) > Date.parse(reportStartedAt) ||
    Date.parse(mappings.approvedAt) > Date.parse(trustedCutoffAt)
  )
    throw new Error(
      'AC265 approved runner mapping is outside the trusted time window.',
    );
  if (
    target.scope.runId !== contract.runId ||
    target.scope.hostingProjectId !== contract.identity.hostingProjectId ||
    target.scope.supabaseProjectRef !== contract.identity.supabaseProjectRef ||
    target.scope.deploymentId !== contract.identity.deploymentId ||
    Date.parse(target.approvedAt) > Date.parse(reportStartedAt) ||
    Date.parse(target.approvedAt) > Date.parse(trustedCutoffAt)
  )
    throw new Error(
      'AC265 approved outage target does not match the trusted run identity or time window.',
    );
  if (
    !isDeepStrictEqual(
      contract.roleResourceBindings,
      mappings.roleResourceBindings,
    )
  )
    throw new Error(
      'Hosted E2E role-resource mapping does not match the independently approved mapping.',
    );
  if (
    !isDeepStrictEqual(
      contract.scenarioRoleBindings,
      mappings.scenarioRoleBindings,
    )
  )
    throw new Error(
      'Hosted E2E scenario-role mapping does not match the independently approved mapping.',
    );
  assertScenarioParameters(contract, policy);
};
