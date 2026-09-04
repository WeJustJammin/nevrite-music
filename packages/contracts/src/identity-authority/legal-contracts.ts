import { z } from 'zod';

import {
  IdentityCasCommandHeadersSchema,
  IdentityCommandHeadersSchema,
  IdentityDecimalVersionSchema,
  IdentityIsoInstantSchema,
  IdentityUuidSchema,
} from './primitives.ts';

export const IdentityIsoDateSchema = z.iso.date();
export const IdentityPurposeCodeSchema = z.enum(['service.contract']);
export const IdentityFieldCodeSchema = z.enum([
  'legal_name',
  'address',
  'tax_id',
  'kyc_status',
]);

export const PutLegalIdentityRequestSchema = z
  .object({
    protectedFieldRefs: z
      .object({
        legalNameRef: IdentityUuidSchema,
        addressRef: IdentityUuidSchema,
        taxRef: IdentityUuidSchema.optional(),
        kycRef: IdentityUuidSchema.optional(),
      })
      .strict(),
    effectiveFrom: IdentityIsoDateSchema,
    effectiveTo: IdentityIsoDateSchema.optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.effectiveTo === undefined ||
      value.effectiveTo > value.effectiveFrom,
    'effective_period_invalid',
  );
export const CreateDisclosureRequestSchema = z
  .object({
    legalIdentityId: IdentityUuidSchema,
    transactionId: IdentityUuidSchema,
    recipientPartyId: IdentityUuidSchema,
    purposeCode: IdentityPurposeCodeSchema,
    fieldCodes: z
      .array(IdentityFieldCodeSchema)
      .min(1)
      .max(8)
      .refine(
        (values) => new Set(values).size === values.length,
        'field_codes_unique',
      ),
  })
  .strict();
export const LegalDisclosurePathSchema = z
  .object({ disclosureId: IdentityUuidSchema })
  .strict();

export const PutLegalIdentityApiRequestSchema = z
  .object({
    headers: IdentityCasCommandHeadersSchema,
    body: PutLegalIdentityRequestSchema,
  })
  .strict();
export const CreateDisclosureApiRequestSchema = z
  .object({
    headers: IdentityCommandHeadersSchema.extend({
      ifMatch: IdentityCasCommandHeadersSchema.shape.ifMatch,
    }).strict(),
    body: CreateDisclosureRequestSchema,
  })
  .strict();

export const LegalIdentityMetadataResponseSchema = z
  .object({
    legalIdentityId: IdentityUuidSchema,
    state: z.enum(['active', 'superseded', 'withdrawn']),
    effectiveFrom: IdentityIsoDateSchema,
    effectiveTo: IdentityIsoDateSchema.nullable(),
    fieldCodes: z.array(IdentityFieldCodeSchema).max(16),
    version: IdentityDecimalVersionSchema,
  })
  .strict();
export const DisclosureEventResponseSchema = z
  .object({
    eventId: IdentityUuidSchema,
    legalIdentityId: IdentityUuidSchema,
    legalIdentityVersion: IdentityDecimalVersionSchema,
    transactionId: IdentityUuidSchema.optional(),
    recipientPartyId: IdentityUuidSchema,
    purposeCode: IdentityPurposeCodeSchema,
    fieldCodes: z.array(IdentityFieldCodeSchema).min(1).max(8),
    occurredAt: IdentityIsoInstantSchema,
  })
  .strict();

export type LegalIdentityMetadataResponse = z.infer<
  typeof LegalIdentityMetadataResponseSchema
>;
export type DisclosureEventResponse = z.infer<
  typeof DisclosureEventResponseSchema
>;
