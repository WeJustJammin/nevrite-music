import { z } from 'zod';

import { CapabilitySchema } from './request-context.ts';
import { InfrastructureQuerySchema } from './request-navigation-security.ts';

export const VerifiedSessionSchema = z
  .object({
    userId: z.uuid(),
    sessionId: z.uuid(),
    expiresAt: z.number().int().positive(),
    authenticationMethod: z.enum(['password', 'totp', 'webauthn', 'oauth']),
  })
  .strict()
  .readonly();

export const ServerAuthoritySchema = z
  .object({
    actingPartyId: z.uuid().nullable(),
    capabilities: z.array(CapabilitySchema).max(64).readonly(),
  })
  .strict()
  .readonly();

export const HighRiskServerAuthoritySchema = z
  .object({
    actingPartyId: z.uuid().nullable(),
    capabilities: z.array(CapabilitySchema).max(64).readonly(),
    stepUpVerified: z.boolean(),
    auditReasonPresent: z.boolean(),
  })
  .strict()
  .readonly();

export const PublicReadRequestSchema = z
  .object({ query: InfrastructureQuerySchema })
  .strict()
  .readonly();

export const AuthenticatedReadRequestSchema = z
  .object({
    query: InfrastructureQuerySchema,
    requestedPartyId: z.uuid().optional(),
    recordId: z.uuid().optional(),
  })
  .strict()
  .readonly();

export type AuthenticatedReadRequest = z.infer<
  typeof AuthenticatedReadRequestSchema
>;
export type ServerAuthority = z.infer<typeof ServerAuthoritySchema>;
export type HighRiskServerAuthority = z.infer<
  typeof HighRiskServerAuthoritySchema
>;
export type VerifiedSession = z.infer<typeof VerifiedSessionSchema>;
