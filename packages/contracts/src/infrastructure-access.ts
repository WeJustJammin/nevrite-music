import { z } from 'zod';

import { CapabilitySchema } from './request-context.ts';

export const ActorClassSchema = z.enum([
  'free',
  'paid',
  'creator',
  'guardian',
  'junior',
  'business',
  'staff',
  'admin',
]);

export const InfrastructureFeatureSchema = z.enum([
  'public_read',
  'protected_command',
  'provenance',
  'destructive_high_risk',
]);

export const PresentationModeSchema = z.enum([
  'full',
  'read_only',
  'disabled',
  'not_rendered',
  'partial_hidden',
]);

export const PresentationVariantSchema = z.enum([
  'publicRead',
  'entitledRead',
  'ownerFull',
  'guardianMandate',
  'juniorRestricted',
  'businessMandate',
  'staffCaseScoped',
  'adminStepUp',
  'forbiddenHidden',
  'disabledPrerequisite',
]);

export const InfrastructureAccessProjectionSchema = z
  .object({
    actorClass: ActorClassSchema,
    capabilities: z.array(CapabilitySchema).max(64).readonly(),
    entitled: z.boolean(),
    ownsResource: z.boolean(),
    guardianMandate: z.boolean(),
    ageAllowed: z.boolean(),
    organizationMandate: z.boolean(),
    caseScoped: z.boolean(),
    stepUpVerified: z.boolean(),
    auditReasonPresent: z.boolean(),
  })
  .strict()
  .readonly();

export const PresentationDecisionSchema = z
  .object({
    mode: PresentationModeSchema,
    variant: PresentationVariantSchema,
    reason: z
      .string()
      .min(1)
      .max(160)
      .regex(/^[A-Za-z0-9][A-Za-z0-9 ._:/()-]*$/),
  })
  .strict()
  .readonly();

export type ActorClass = z.infer<typeof ActorClassSchema>;
export type InfrastructureFeature = z.infer<typeof InfrastructureFeatureSchema>;
export type InfrastructureAccessProjection = z.infer<
  typeof InfrastructureAccessProjectionSchema
>;
export type PresentationDecision = z.infer<typeof PresentationDecisionSchema>;
