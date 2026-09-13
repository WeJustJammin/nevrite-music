import { isDeepStrictEqual } from 'node:util';

import {
  HostedRoleResourceBindingsSchema,
  HostedScenarioRoleBindingsSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input-scenarios.ts';
import type { ContentSchemaRegistryHostedRunnerContract } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';

export type TrustedHostedRunnerMappings = {
  readonly expectedRoleResourceBindings: ContentSchemaRegistryHostedRunnerContract['roleResourceBindings'];
  readonly expectedScenarioRoleBindings: ContentSchemaRegistryHostedRunnerContract['scenarioRoleBindings'];
};

export const parseTrustedHostedRunnerMappings = (
  context: Record<string, unknown>,
): TrustedHostedRunnerMappings => {
  const roleResourceBindings = HostedRoleResourceBindingsSchema.safeParse(
    context['expectedRoleResourceBindings'],
  );
  if (!roleResourceBindings.success)
    throw new Error(
      'Hosted E2E trusted expected role-resource mapping is required and must be valid.',
    );
  const scenarioRoleBindings = HostedScenarioRoleBindingsSchema.safeParse(
    context['expectedScenarioRoleBindings'],
  );
  if (!scenarioRoleBindings.success)
    throw new Error(
      'Hosted E2E trusted expected scenario-role mapping is required and must be valid.',
    );
  return {
    expectedRoleResourceBindings: roleResourceBindings.data,
    expectedScenarioRoleBindings: scenarioRoleBindings.data,
  };
};

export const assertHostedRunnerMappingsApproved = (
  contract: ContentSchemaRegistryHostedRunnerContract,
  expected: TrustedHostedRunnerMappings,
): void => {
  if (
    !isDeepStrictEqual(
      contract.roleResourceBindings,
      expected.expectedRoleResourceBindings,
    )
  )
    throw new Error(
      'Hosted E2E role-resource mapping does not match the independently approved mapping.',
    );
  if (
    !isDeepStrictEqual(
      contract.scenarioRoleBindings,
      expected.expectedScenarioRoleBindings,
    )
  )
    throw new Error(
      'Hosted E2E scenario-role mapping does not match the independently approved mapping.',
    );
};
