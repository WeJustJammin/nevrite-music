import { z } from 'zod';

import {
  ProfilePortfolioInstantSchema,
  ProfilePortfolioRoleCodeSchema,
  ProfilePortfolioUuidSchema,
  ProfilePortfolioVersionSchema,
} from './primitives.ts';
import {
  ProfilePortfolioReelItemStateSchema,
  ProfilePortfolioRightsBasisSchema,
} from './enums.ts';
import { ProfilePortfolioFactRefShape } from './profile-models.ts';
import { ProfilePortfolioRequestMetaSchema } from './profile-read-resources.ts';
import { ProfilePortfolioCursorSchema } from './primitives.ts';

const creditRef = z.strictObject({
  ...ProfilePortfolioFactRefShape,
  sourceType: z.literal('credit'),
});
const mediaRef = z.strictObject({
  ...ProfilePortfolioFactRefShape,
  sourceType: z.literal('media'),
});
const rightsRef = z.strictObject({
  ...ProfilePortfolioFactRefShape,
  sourceType: z.enum(['media', 'consent']),
});
export const ReelItemResponseDataSchema = z
  .strictObject({
    id: ProfilePortfolioUuidSchema,
    partyId: ProfilePortfolioUuidSchema,
    creditRef,
    mediaRef,
    roleCode: ProfilePortfolioRoleCodeSchema,
    rightsBasis: ProfilePortfolioRightsBasisSchema,
    rightsRef,
    state: ProfilePortfolioReelItemStateSchema,
    order: z.number().int().min(0).max(999),
    version: ProfilePortfolioVersionSchema,
    createdAt: ProfilePortfolioInstantSchema,
    updatedAt: ProfilePortfolioInstantSchema,
  })
  .readonly();
export const ReelItemResponseSchema = z
  .strictObject({
    data: ReelItemResponseDataSchema,
    meta: ProfilePortfolioRequestMetaSchema,
  })
  .readonly();
export const ReelListResponseSchema = z
  .strictObject({
    data: z.array(ReelItemResponseDataSchema).max(50),
    meta: z
      .strictObject({
        requestId: ProfilePortfolioUuidSchema,
        nextCursor: ProfilePortfolioCursorSchema.nullable(),
        projectionVersion: ProfilePortfolioVersionSchema,
      })
      .readonly(),
  })
  .readonly();
export type ReelItemResponse = z.infer<typeof ReelItemResponseSchema>;
