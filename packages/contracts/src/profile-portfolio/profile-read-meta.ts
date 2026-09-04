import { z } from 'zod';

import { ApiErrorSchema } from '../api-error.ts';
import {
  ProfilePortfolioCursorSchema,
  ProfilePortfolioUuidSchema,
} from './primitives.ts';

export const ProfilePortfolioRequestMetaSchema = z
  .strictObject({ requestId: ProfilePortfolioUuidSchema })
  .readonly();
export const ProfilePortfolioListMetaSchema = z
  .strictObject({
    requestId: ProfilePortfolioUuidSchema,
    nextCursor: ProfilePortfolioCursorSchema.nullable(),
  })
  .readonly();
export const ProfilePortfolioApiErrorSchema = ApiErrorSchema;
