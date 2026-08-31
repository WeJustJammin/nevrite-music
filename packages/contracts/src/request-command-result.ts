import { z } from 'zod';

import { CapabilitySchema } from './request-context.ts';
import { QuotedVersionSchema } from './request-navigation-security.ts';

export const CommandResultSchema = z
  .object({
    operationId: z.uuid(),
    resourceId: z.uuid(),
    version: QuotedVersionSchema,
    status: z.literal('committed'),
    replayed: z.boolean(),
  })
  .strict()
  .readonly();

export const AuthorizationAuditSchema = z
  .object({
    actorId: z.uuid(),
    actingPartyId: z.uuid(),
    targetId: z.uuid(),
    capability: CapabilitySchema,
    decision: z.enum(['allow', 'deny']),
    reasonCode: z
      .string()
      .min(3)
      .max(64)
      .regex(/^[A-Z][A-Z0-9_]*$/),
  })
  .strict()
  .readonly();

export type AuthorizationAudit = z.infer<typeof AuthorizationAuditSchema>;
export type CommandResult = z.infer<typeof CommandResultSchema>;
