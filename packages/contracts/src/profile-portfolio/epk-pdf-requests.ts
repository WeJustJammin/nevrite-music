import { z } from 'zod';

import { ProfilePortfolioUuidSchema } from './primitives.ts';
import {
  ProfilePortfolioMutationHeadersSchema,
  ProfilePortfolioReadHeadersSchema,
} from './transport.ts';
import { EpkSharePathSchema } from './epk-share-requests.ts';

export const EpkTokenPathSchema = z
  .strictObject({
    token: z
      .string()
      .min(43, 'token_invalid')
      .max(128, 'token_invalid')
      .regex(/^[A-Za-z0-9_-]+$/u, 'token_invalid'),
  })
  .readonly();
export const EpkSnapshotPathSchema = z
  .strictObject({
    shareId: ProfilePortfolioUuidSchema,
    snapshotId: ProfilePortfolioUuidSchema,
  })
  .readonly();
export const EpkLiveReadApiRequestSchema = z
  .strictObject({
    path: EpkTokenPathSchema,
    headers: ProfilePortfolioReadHeadersSchema.optional(),
  })
  .readonly();
export const EpkPdfJobRequestSchema = z
  .strictObject({
    locale: z
      .string()
      .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/u, 'locale_invalid')
      .default('en'),
    paper: z.enum(['a4', 'letter']).default('letter'),
  })
  .readonly();
export const EpkPdfJobApiRequestSchema = z
  .strictObject({
    path: EpkSharePathSchema,
    headers: ProfilePortfolioMutationHeadersSchema,
    body: EpkPdfJobRequestSchema,
  })
  .readonly();
export const EpkPdfSnapshotReadApiRequestSchema = z
  .strictObject({
    path: EpkSnapshotPathSchema,
    headers: ProfilePortfolioReadHeadersSchema.optional(),
  })
  .readonly();
