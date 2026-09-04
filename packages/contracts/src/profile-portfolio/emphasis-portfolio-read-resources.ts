import { z } from 'zod';

import {
  ProfilePortfolioInstantSchema,
  ProfilePortfolioRoleCodeSchema,
  ProfilePortfolioUuidSchema,
  ProfilePortfolioVersionSchema,
} from './primitives.ts';
import { FactRefSchema } from './profile-models.ts';
import {
  ProfilePortfolioListMetaSchema,
  ProfilePortfolioRequestMetaSchema,
} from './profile-read-meta.ts';
import { PublicProfileFactSchema } from './profile-section-read-resources.ts';

export const EmphasisResponseDataSchema = z
  .strictObject({
    partyId: ProfilePortfolioUuidSchema,
    surface: z.enum(['public', 'epk']),
    defaultFilter: z
      .strictObject({
        roleCodes: z.array(ProfilePortfolioRoleCodeSchema).max(20),
      })
      .nullable(),
    orderedRefs: z.array(FactRefSchema).max(100),
    version: ProfilePortfolioVersionSchema,
    updatedAt: ProfilePortfolioInstantSchema,
  })
  .readonly();
export const EmphasisResponseSchema = z
  .strictObject({
    data: EmphasisResponseDataSchema,
    meta: ProfilePortfolioRequestMetaSchema,
  })
  .readonly();
export type EmphasisResponse = z.infer<typeof EmphasisResponseSchema>;

export const PortfolioFactSchema = PublicProfileFactSchema;
export const PortfolioListDataSchema = z
  .strictObject({
    items: z.array(PortfolioFactSchema).max(50),
    visibleTotals: z.strictObject({ items: z.number().int().nonnegative() }),
    filters: z.strictObject({
      roleCodes: z.array(ProfilePortfolioRoleCodeSchema).max(20),
    }),
    projectionVersion: ProfilePortfolioVersionSchema,
  })
  .readonly();
export const PortfolioListResponseSchema = z
  .strictObject({
    data: PortfolioListDataSchema,
    meta: ProfilePortfolioListMetaSchema,
  })
  .readonly();
export type PortfolioListResponse = z.infer<typeof PortfolioListResponseSchema>;
