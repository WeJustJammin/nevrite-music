import { z } from 'zod';

import { IdentityIsoInstantSchema } from './primitives.ts';

export const ORGANIZATION_TYPE_CODES = [
  'band',
  'collective',
  'studio',
  'venue',
  'label',
  'agency',
  'shop',
] as const;

export const OrganizationTypeCodeSchema = z.enum(ORGANIZATION_TYPE_CODES);

const OrganizationTypeDisplayNameSchema = z.string().trim().min(1).max(128);

export const OrganizationTypeRegistryEntrySchema = z
  .object({
    code: OrganizationTypeCodeSchema,
    registryVersion: z.number().int().positive(),
    displayName: OrganizationTypeDisplayNameSchema,
    active: z.boolean(),
  })
  .strict()
  .readonly();

export const OrganizationTypeRegistrySchema = z
  .array(OrganizationTypeRegistryEntrySchema)
  .length(ORGANIZATION_TYPE_CODES.length)
  .superRefine((entries, context) => {
    const seen = new Set<string>();
    for (const [index, entry] of entries.entries()) {
      if (seen.has(entry.code)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate organization type: ${entry.code}`,
          path: [index, 'code'],
        });
      }
      seen.add(entry.code);
    }
    for (const code of ORGANIZATION_TYPE_CODES) {
      if (!seen.has(code)) {
        context.addIssue({
          code: 'custom',
          message: `Missing organization type: ${code}`,
        });
      }
    }
  })
  .readonly();

export const ORGANIZATION_TYPE_REGISTRY = OrganizationTypeRegistrySchema.parse(
  ORGANIZATION_TYPE_CODES.map((code) => ({
    code,
    registryVersion: 1,
    displayName: code.charAt(0).toUpperCase() + code.slice(1),
    active: true,
  })),
);

export const OrganizationTypeCodesSchema = z
  .array(OrganizationTypeCodeSchema)
  .max(ORGANIZATION_TYPE_CODES.length)
  .superRefine((codes, context) => {
    if (new Set(codes).size !== codes.length) {
      context.addIssue({
        code: 'custom',
        message: 'Organization type codes must be unique.',
      });
    }
  })
  .readonly();

export const OrganizationCreationModeSchema = z.enum([
  'self_member',
  'shadow_custodial',
  'external_reference',
]);
export const OrganizationOwnershipStateSchema = z.enum([
  'unclaimed',
  'owned',
  'ownerless',
]);
export const OrganizationLifecycleSchema = z.enum([
  'active',
  'dormant',
  'closing',
  'closed',
  'dissolving',
  'dissolved',
]);
export const OrganizationTypeAssignmentStateSchema = z.enum([
  'active',
  'ended',
]);

export const OrganizationTimestampSchema = IdentityIsoInstantSchema.refine(
  (value) => value.endsWith('Z'),
  'timestamp_not_utc',
);
