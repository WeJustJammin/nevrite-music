import { z } from 'zod';

import {
  ConfigurationScopeTypeSchema,
  ConfigurationUuidSchema,
  ConfigurationVersionSchema,
} from './primitives.ts';

export const ConfigDefinitionRegisteredV1Schema = z.strictObject({
  definitionId: ConfigurationUuidSchema,
  definitionVersionId: ConfigurationUuidSchema,
  version: ConfigurationVersionSchema,
});

export const ConfigValueResolvedV1Schema = z.strictObject({
  definitionId: ConfigurationUuidSchema,
  definitionVersionId: ConfigurationUuidSchema,
  valueVersionId: ConfigurationUuidSchema.nullable(),
});

export const ConfigChangeProposedV1Schema = z.strictObject({
  reviewId: ConfigurationUuidSchema,
  candidateId: ConfigurationUuidSchema,
  candidateVersion: ConfigurationVersionSchema,
});

export const ConfigChangeTransitionedV1Schema = z.strictObject({
  reviewId: ConfigurationUuidSchema,
  resultingValueVersionId: ConfigurationUuidSchema.nullable(),
  snapshotIntentId: ConfigurationUuidSchema.nullable(),
});

export const ConfigSettingActivatedV1Schema = z.strictObject({
  definitionId: ConfigurationUuidSchema,
  valueVersionId: ConfigurationUuidSchema,
  scopeType: ConfigurationScopeTypeSchema,
  scopeId: ConfigurationUuidSchema.nullable(),
});

export const ConfigFlagChangedV1Schema = z.strictObject({
  flagId: ConfigurationUuidSchema,
  flagVersionId: ConfigurationUuidSchema,
});

export const ConfigExperimentChangedV1Schema = z.strictObject({
  experimentId: ConfigurationUuidSchema,
  experimentVersionId: ConfigurationUuidSchema,
});

export const ConfigKillSwitchChangedV1Schema = z.strictObject({
  switchId: ConfigurationUuidSchema,
  switchVersionId: ConfigurationUuidSchema,
  activationId: ConfigurationUuidSchema,
});
