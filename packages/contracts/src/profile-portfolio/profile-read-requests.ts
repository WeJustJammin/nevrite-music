import { z } from 'zod';

import {
  ProfilePortfolioCursorSchema,
  ProfilePortfolioDateSchema,
  ProfilePortfolioRoleCodeSchema,
  ProfilePortfolioUuidSchema,
} from './primitives.ts';
import { ProfilePortfolioSurfaceSchema } from './enums.ts';
import { ProfilePortfolioReadHeadersSchema } from './transport.ts';

const pageSize = z.coerce.number().int().min(1).max(50);
const roleCode = ProfilePortfolioRoleCodeSchema;
const readHeaders = ProfilePortfolioReadHeadersSchema.optional();

export const PublicProfilePathSchema = z
  .strictObject({ partyId: ProfilePortfolioUuidSchema })
  .readonly();
export const PublicProfileQuerySchema = z
  .strictObject({
    locale: z
      .string()
      .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/u)
      .default('en'),
  })
  .readonly();
export const PublicProfileApiRequestSchema = z
  .strictObject({
    path: PublicProfilePathSchema,
    query: PublicProfileQuerySchema,
    headers: readHeaders,
  })
  .readonly();

export const SectionRevisionPathSchema = z
  .strictObject({
    partyId: ProfilePortfolioUuidSchema,
    sectionCode: z.enum(['now', 'biography', 'services', 'availability']),
  })
  .readonly();
export const SectionRevisionListQuerySchema = z
  .strictObject({
    cursor: ProfilePortfolioCursorSchema.optional(),
    limit: pageSize,
  })
  .readonly();
export const SectionRevisionListApiRequestSchema = z
  .strictObject({
    path: SectionRevisionPathSchema,
    query: SectionRevisionListQuerySchema,
    headers: readHeaders,
  })
  .readonly();

export const EmphasisPathSchema = PublicProfilePathSchema;
export const EmphasisGetQuerySchema = z
  .strictObject({ surface: ProfilePortfolioSurfaceSchema })
  .readonly();
export const EmphasisGetApiRequestSchema = z
  .strictObject({
    path: EmphasisPathSchema,
    query: EmphasisGetQuerySchema,
    headers: readHeaders,
  })
  .readonly();

export const PortfolioListQuerySchema = z
  .strictObject({
    cursor: ProfilePortfolioCursorSchema.optional(),
    limit: pageSize,
    roleCode: roleCode.optional(),
    from: ProfilePortfolioDateSchema.optional(),
    to: ProfilePortfolioDateSchema.optional(),
  })
  .superRefine((value, context) => {
    if (
      value.from !== undefined &&
      value.to !== undefined &&
      value.from > value.to
    )
      context.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'to_precedes_from',
      });
  })
  .readonly();
export const PortfolioListApiRequestSchema = z
  .strictObject({
    path: PublicProfilePathSchema,
    query: PortfolioListQuerySchema,
    headers: readHeaders,
  })
  .readonly();

export const ReelListQuerySchema = z
  .strictObject({
    cursor: ProfilePortfolioCursorSchema.optional(),
    limit: pageSize,
    includeInactive: z.enum(['true', 'false']).optional(),
  })
  .readonly();
export const ReelListApiRequestSchema = z
  .strictObject({
    path: PublicProfilePathSchema,
    query: ReelListQuerySchema,
    headers: readHeaders,
  })
  .readonly();

export type PublicProfileQuery = z.infer<typeof PublicProfileQuerySchema>;
export type SectionRevisionListQuery = z.infer<
  typeof SectionRevisionListQuerySchema
>;
export type EmphasisGetQuery = z.infer<typeof EmphasisGetQuerySchema>;
export type PortfolioListQuery = z.infer<typeof PortfolioListQuerySchema>;
export type ReelListQuery = z.infer<typeof ReelListQuerySchema>;
