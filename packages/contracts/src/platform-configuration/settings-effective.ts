import { z } from 'zod';

import {
  ConfigurationInstantSchema,
  ConfigurationJsonValueSchema,
  ConfigurationKeySchema,
  ConfigurationScopeTypeSchema,
  ConfigurationUuidSchema,
  ConfigurationValueKindSchema,
  ConfigurationVersionSchema,
} from './primitives.ts';

export const Cfg05a02EffectiveValueQuerySchema = z.strictObject({
  key: ConfigurationKeySchema,
  environment: z.string().trim().min(1).max(64).optional(),
  partyId: ConfigurationUuidSchema.optional(),
  siteId: ConfigurationUuidSchema.optional(),
  route: z
    .string()
    .regex(/^\/[A-Za-z0-9/_-]{0,255}$/u)
    .optional(),
  feature: ConfigurationKeySchema.optional(),
  userId: ConfigurationUuidSchema.optional(),
  consumerKey: ConfigurationKeySchema,
  supportedDefinitionVersions: z
    .array(ConfigurationVersionSchema)
    .min(1)
    .max(8),
  at: ConfigurationInstantSchema.optional(),
});

export const Cfg05a02EffectiveValueResponseSchema = z.strictObject({
  definitionId: ConfigurationUuidSchema,
  definitionVersionId: ConfigurationUuidSchema,
  key: ConfigurationKeySchema,
  valueKind: ConfigurationValueKindSchema,
  typedValue: ConfigurationJsonValueSchema,
  sourceScope: ConfigurationScopeTypeSchema,
  sourceSubjectId: ConfigurationUuidSchema.nullable(),
  sourceValueVersionId: ConfigurationUuidSchema.nullable(),
  isDefault: z.boolean(),
  effectiveFrom: ConfigurationInstantSchema.nullable(),
  effectiveTo: ConfigurationInstantSchema.nullable(),
  evaluatedAt: ConfigurationInstantSchema,
  evaluatorVersion: ConfigurationVersionSchema,
  correlationId: ConfigurationUuidSchema,
  compatibility: z.enum(['exact', 'last_compatible', 'contract_fallback']),
});

export type Cfg05a02EffectiveValueQuery = z.infer<
  typeof Cfg05a02EffectiveValueQuerySchema
>;
