import { z } from 'zod';

import { ProfilePortfolioUuidSchema } from './primitives.ts';

export const ReelItemPathSchema = z
  .strictObject({ reelItemId: ProfilePortfolioUuidSchema })
  .readonly();
