import { z } from 'zod';

import { SafeReleaseIdSchema } from '../release-recovery-common.ts';

export const HostedDependencyOutageRouteSchema = z
  .object({
    operationId: SafeReleaseIdSchema,
    method: z.enum(['GET', 'HEAD']),
    path: z
      .string()
      .max(200)
      .regex(/^\/api\/v1\/[a-z0-9][a-z0-9/_-]*$/u),
  })
  .strict()
  .readonly();
