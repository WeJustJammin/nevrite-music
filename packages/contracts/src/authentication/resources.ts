import { z } from 'zod';

import {
  AuthDecimalVersionSchema,
  AuthIsoTimeSchema,
  AuthProviderCodeSchema,
  AuthProviderLaunchStateSchema,
} from './primitives.ts';

export const ProviderCatalogSchema = z
  .object({
    providers: z
      .array(
        z
          .object({
            code: AuthProviderCodeSchema,
            label: z.string().min(1).max(80),
            state: AuthProviderLaunchStateSchema,
          })
          .strict(),
      )
      .max(5),
    emailRecoveryEnabled: z.literal(true),
    version: AuthDecimalVersionSchema,
  })
  .strict();

export const AuthorizationStartSchema = z
  .object({
    authorizationUrl: z.url().refine((value) => {
      const parsed = new URL(value);
      const providerHost =
        parsed.hostname === 'accounts.google.com' ||
        parsed.hostname === 'appleid.apple.com' ||
        parsed.hostname === 'www.facebook.com' ||
        parsed.hostname === 'secure.soundcloud.com' ||
        parsed.hostname.endsWith('.supabase.co');
      const loopback =
        parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
      return (
        (parsed.protocol === 'https:' && providerHost) ||
        (parsed.protocol === 'http:' && loopback)
      );
    }, 'provider_authorization_url_invalid'),
    expiresAt: AuthIsoTimeSchema,
    intentId: z.uuid().optional(),
  })
  .strict();

export const AuthStartAcceptedSchema = z
  .object({ accepted: z.literal(true) })
  .strict();

export const SessionResourceSchema = z
  .object({
    authenticated: z.literal(true),
    accountState: z
      .enum([
        'claimed',
        'active',
        'suspended',
        'memorialised',
        'erasure_processing',
      ])
      .nullable(),
    bootstrapState: z.enum(['complete', 'required', 'blocked']),
    personId: z.uuid().nullable(),
    actingPartyId: z.uuid().nullable(),
    sessionExpiresAt: AuthIsoTimeSchema,
  })
  .strict();

export const PersonBootstrapResourceSchema = z
  .object({
    personId: z.uuid(),
    actingPartyId: z.uuid(),
    contextKind: z.literal('self'),
    accountState: z.enum(['claimed', 'active']),
    bindingVersion: AuthDecimalVersionSchema,
  })
  .strict();

export const LoginMethodsResourceSchema = z
  .object({
    methods: z
      .array(
        z
          .object({
            id: z.uuid(),
            provider: AuthProviderCodeSchema,
            label: z.string().min(1).max(80),
            verifiedAt: AuthIsoTimeSchema,
            lastUsedAt: AuthIsoTimeSchema.nullable(),
            removable: z.boolean(),
          })
          .strict(),
      )
      .max(10),
    recoveryBaselinePresent: z.boolean(),
    version: AuthDecimalVersionSchema,
  })
  .strict();

export const MergeCaseResourceSchema = z
  .object({
    mergeId: z.uuid(),
    state: z.enum([
      'awaiting_duplicate_proof',
      'analyzing',
      'awaiting_confirmation',
      'queued',
      'running',
      'completed',
      'manual_review',
      'expired',
    ]),
    expiresAt: AuthIsoTimeSchema,
    conflictPlanVersion: AuthDecimalVersionSchema.nullable(),
    jobId: z.uuid().nullable(),
    version: AuthDecimalVersionSchema,
  })
  .strict();

export type ProviderCatalog = z.infer<typeof ProviderCatalogSchema>;
export type AuthorizationStart = z.infer<typeof AuthorizationStartSchema>;
export type AuthStartAccepted = z.infer<typeof AuthStartAcceptedSchema>;
export type SessionResource = z.infer<typeof SessionResourceSchema>;
export type PersonBootstrapResource = z.infer<
  typeof PersonBootstrapResourceSchema
>;
export type LoginMethodsResource = z.infer<typeof LoginMethodsResourceSchema>;
export type MergeCaseResource = z.infer<typeof MergeCaseResourceSchema>;
