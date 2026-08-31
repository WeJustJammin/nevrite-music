import { z } from 'zod';

import { CapabilitySchema } from './request-context.ts';

export const RouteAuthClassSchema = z.enum([
  'public',
  'authenticated',
  'admin_step_up',
  'system',
]);

export const InfrastructureRouteMetadataSchema = z
  .object({
    pathPattern: z
      .string()
      .regex(/^\/(?:app|auth|system)(?:\/[A-Za-z0-9:[\]_-]+)*$/),
    authClass: RouteAuthClassSchema,
    title: z.string().min(1).max(160),
    description: z.string().min(1).max(300),
    requiredCapability: CapabilitySchema.nullable(),
  })
  .strict()
  .readonly();
