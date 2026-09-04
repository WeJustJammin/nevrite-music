import { z } from 'zod';

import {
  ProfilePortfolioCursorSchema,
  ProfilePortfolioInstantSchema,
  ProfilePortfolioRegistryCodeSchema,
  ProfilePortfolioUuidSchema,
} from './primitives.ts';
import {
  FactRefSchema,
  ProfilePortfolioFactRefShape,
} from './profile-models.ts';
import {
  ProfilePortfolioMutationHeadersSchema,
  ProfilePortfolioReadHeadersSchema,
} from './transport.ts';

const creditRef = z.strictObject({
  ...ProfilePortfolioFactRefShape,
  sourceType: z.literal('credit'),
});
const consentRef = z.strictObject({
  ...ProfilePortfolioFactRefShape,
  sourceType: z.literal('consent'),
});

export const EpkSelectionSchema = z
  .strictObject({
    publicFactRefs: z.array(FactRefSchema).min(1).max(200),
    privateAliasInclusions: z
      .array(
        z.strictObject({
          aliasId: ProfilePortfolioUuidSchema,
          consentRef,
          forwardabilityConfirmed: z.literal(true),
        }),
      )
      .max(20),
    memberCreditInclusions: z
      .array(z.strictObject({ creditRef, consentRef }))
      .max(100),
    approvedContactRefs: z.array(FactRefSchema).max(10),
    approvedRateRefs: z.array(FactRefSchema).max(10),
  })
  .superRefine((value, context) => {
    const keys = value.publicFactRefs.map(
      ({ sourceId, sourceVersion }) => `${sourceId}/${sourceVersion}`,
    );
    if (new Set(keys).size !== keys.length)
      context.addIssue({
        code: 'custom',
        path: ['publicFactRefs'],
        message: 'duplicate_fact_reference',
      });
  })
  .readonly();

const expiry = ProfilePortfolioInstantSchema.superRefine((value, context) => {
  const timestamp = Date.parse(value);
  const now = Date.now();
  if (timestamp <= now || timestamp > now + 365 * 24 * 60 * 60 * 1_000)
    context.addIssue({ code: 'custom', message: 'invalid_expiry' });
});

export const EpkShareProfilePathSchema = z
  .strictObject({ partyId: ProfilePortfolioUuidSchema })
  .readonly();
export const EpkSharePathSchema = z
  .strictObject({ shareId: ProfilePortfolioUuidSchema })
  .readonly();
export const EpkShareCreateRequestSchema = z
  .strictObject({
    recipientLabel: z.string().trim().min(1).max(160),
    purposeCode: ProfilePortfolioRegistryCodeSchema,
    selection: EpkSelectionSchema,
    expiresAt: expiry.optional(),
  })
  .readonly();
export const EpkShareCreateApiRequestSchema = z
  .strictObject({
    path: EpkShareProfilePathSchema,
    headers: ProfilePortfolioMutationHeadersSchema,
    body: EpkShareCreateRequestSchema,
  })
  .readonly();
export const EpkShareListQuerySchema = z
  .strictObject({
    cursor: ProfilePortfolioCursorSchema.optional(),
    limit: z.coerce.number().int().min(1).max(50),
    state: z.enum(['active', 'expired', 'revoked']).optional(),
  })
  .readonly();
export const EpkShareListApiRequestSchema = z
  .strictObject({
    path: EpkShareProfilePathSchema,
    query: EpkShareListQuerySchema,
    headers: ProfilePortfolioReadHeadersSchema.optional(),
  })
  .readonly();
export const EpkShareReadApiRequestSchema = z
  .strictObject({
    path: EpkSharePathSchema,
    headers: ProfilePortfolioReadHeadersSchema.optional(),
  })
  .readonly();
export const EpkSharePutRequestSchema = z
  .strictObject({ selection: EpkSelectionSchema, expiresAt: expiry })
  .readonly();
export const EpkSharePutApiRequestSchema = z
  .strictObject({
    path: EpkSharePathSchema,
    headers: ProfilePortfolioMutationHeadersSchema,
    body: EpkSharePutRequestSchema,
  })
  .readonly();
export const EpkShareRevokeRequestSchema = z
  .strictObject({
    reasonCode: z.enum([
      'sender_revoked',
      'consent_withdrawn',
      'rights_revoked',
      'security',
    ]),
  })
  .readonly();
export const EpkShareRevokeApiRequestSchema = z
  .strictObject({
    path: EpkSharePathSchema,
    headers: ProfilePortfolioMutationHeadersSchema,
    body: EpkShareRevokeRequestSchema,
  })
  .readonly();

export type EpkSelection = z.infer<typeof EpkSelectionSchema>;
export type EpkShareCreateRequest = z.infer<typeof EpkShareCreateRequestSchema>;
export type EpkSharePutRequest = z.infer<typeof EpkSharePutRequestSchema>;
export type EpkShareRevokeRequest = z.infer<typeof EpkShareRevokeRequestSchema>;
