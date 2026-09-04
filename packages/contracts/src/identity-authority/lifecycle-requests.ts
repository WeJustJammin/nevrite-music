import { z } from 'zod';

import { IdentityUuidSchema } from './primitives.ts';
import {
  RelationshipDispositionKindSchema,
  RelationshipDispositionStatusSchema,
  RelationshipHashSchema,
  RelationshipVersionSchema,
} from './relationship-primitives.ts';

export const OrganizationObligationDispositionSchema = z
  .object({
    kind: RelationshipDispositionKindSchema,
    status: RelationshipDispositionStatusSchema,
    referenceId: IdentityUuidSchema.optional(),
  })
  .strict();

export const OrganizationObligationDispositionsSchema = z
  .array(OrganizationObligationDispositionSchema)
  .min(1)
  .max(32);

export const CloseOrganizationRequestSchema = z
  .object({
    expectedOrganizationVersion: RelationshipVersionSchema,
    dispositions: OrganizationObligationDispositionsSchema,
  })
  .strict();

export const ReopenOrganizationRequestSchema = z
  .object({ expectedOrganizationVersion: RelationshipVersionSchema })
  .strict();

export const DissolveOrganizationRequestSchema = z
  .object({
    expectedOrganizationVersion: RelationshipVersionSchema,
    activeTermsId: IdentityUuidSchema,
    expectedMemberSetHash: RelationshipHashSchema,
    dispositions: OrganizationObligationDispositionsSchema,
  })
  .strict();

export const OrganizationReFormReasonCodeSchema = z.enum([
  'NEW_ENTITY',
  'SUCCESSOR_FORMED',
  'ADMINISTRATIVE_CORRECTION',
]);
export const ReFormRequestSchema = z
  .object({
    expectedOrganizationVersion: RelationshipVersionSchema,
    reasonCode: OrganizationReFormReasonCodeSchema,
  })
  .strict();

export type OrganizationObligationDisposition = z.infer<
  typeof OrganizationObligationDispositionSchema
>;
export type CloseOrganizationRequest = z.infer<
  typeof CloseOrganizationRequestSchema
>;
export type ReopenOrganizationRequest = z.infer<
  typeof ReopenOrganizationRequestSchema
>;
export type DissolveOrganizationRequest = z.infer<
  typeof DissolveOrganizationRequestSchema
>;
export type ReFormRequest = z.infer<typeof ReFormRequestSchema>;
