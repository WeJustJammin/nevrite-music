import { z } from 'zod';

import {
  ConfigurationCapabilitySchema,
  ConfigurationHashSchema,
  ConfigurationInstantSchema,
  ConfigurationJsonObjectSchema,
  ConfigurationJsonValueSchema,
  ConfigurationKeySchema,
  ConfigurationMergeModeSchema,
  ConfigurationRiskClassSchema,
  ConfigurationScopeTypeSchema,
  ConfigurationTextSchema,
  ConfigurationUuidSchema,
  ConfigurationValueKindSchema,
  ConfigurationVersionSchema,
} from './primitives.ts';

const distinctScopes = (values: readonly string[]): boolean =>
  new Set(values).size === values.length;

export const Cfg05a01RegisterDefinitionRequestSchema = z
  .strictObject({
    key: ConfigurationKeySchema,
    valueKind: ConfigurationValueKindSchema,
    schema: ConfigurationJsonObjectSchema,
    ownerCapability: ConfigurationCapabilitySchema,
    allowedScopes: z
      .array(ConfigurationScopeTypeSchema)
      .min(1)
      .max(7)
      .refine(distinctScopes, 'scope_duplicate'),
    precedence: z
      .array(ConfigurationScopeTypeSchema)
      .min(1)
      .max(7)
      .refine(distinctScopes, 'precedence_duplicate'),
    mergeMode: ConfigurationMergeModeSchema,
    defaultSource: z.enum(['contract', 'literal', 'required']),
    defaultValue: ConfigurationJsonValueSchema.optional(),
    riskClass: ConfigurationRiskClassSchema,
    approverPolicy: z.strictObject({
      minimumDistinct: z.number().int().min(1).max(5),
      requiresMfa: z.boolean(),
      requiresCanary: z.boolean(),
      notifyCapabilities: z.array(ConfigurationCapabilitySchema).max(16),
    }),
    consumerKeys: z.array(ConfigurationKeySchema).max(64),
    contractRelease: z.string().trim().min(1).max(128),
    sensitivity: z.enum(['public', 'internal', 'restricted']),
    deprecationAt: ConfigurationInstantSchema.nullable().optional(),
    reason: ConfigurationTextSchema,
  })
  .superRefine((value, context) => {
    if (
      value.precedence.some((scope) => !value.allowedScopes.includes(scope))
    ) {
      context.addIssue({
        code: 'custom',
        path: ['precedence'],
        message: 'scope_not_allowed',
      });
    }
    if (value.defaultSource === 'literal' && value.defaultValue === undefined) {
      context.addIssue({
        code: 'custom',
        path: ['defaultValue'],
        message: 'literal_default_required',
      });
    }
    if (
      value.defaultSource === 'required' &&
      value.defaultValue !== undefined
    ) {
      context.addIssue({
        code: 'custom',
        path: ['defaultValue'],
        message: 'required_default_forbids_literal',
      });
    }
  });

export const Cfg05a01DefinitionResponseSchema = z.strictObject({
  definitionId: ConfigurationUuidSchema,
  definitionVersionId: ConfigurationUuidSchema,
  key: ConfigurationKeySchema,
  version: ConfigurationVersionSchema,
  valueKind: ConfigurationValueKindSchema,
  allowedScopes: z.array(ConfigurationScopeTypeSchema),
  precedence: z.array(ConfigurationScopeTypeSchema),
  mergeMode: ConfigurationMergeModeSchema,
  riskClass: ConfigurationRiskClassSchema,
  lifecycle: z.enum(['draft', 'active', 'deprecated', 'retired']),
  schemaHash: ConfigurationHashSchema,
  contractRelease: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u),
  synchronized: z.boolean(),
  createdAt: ConfigurationInstantSchema,
});

export type Cfg05a01RegisterDefinitionRequest = z.infer<
  typeof Cfg05a01RegisterDefinitionRequestSchema
>;
