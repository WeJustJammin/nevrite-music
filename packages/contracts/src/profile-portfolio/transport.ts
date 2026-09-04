import { z } from 'zod';

import {
  IdempotencyKeySchema,
  QuotedVersionSchema,
} from '../request-navigation-security.ts';

export const ProfilePortfolioReadHeadersSchema = z.strictObject({});
export const ProfilePortfolioMutationHeadersSchema = z
  .strictObject({
    contentType: z.literal('application/json'),
    idempotencyKey: IdempotencyKeySchema,
    ifMatch: QuotedVersionSchema,
  })
  .readonly();
export const ProfilePortfolioObservationHeadersSchema = z
  .strictObject({
    contentType: z.literal('application/json'),
    idempotencyKey: IdempotencyKeySchema,
  })
  .readonly();

export type ProfilePortfolioMutationHeaders = z.infer<
  typeof ProfilePortfolioMutationHeadersSchema
>;
export type ProfilePortfolioObservationHeaders = z.infer<
  typeof ProfilePortfolioObservationHeadersSchema
>;
