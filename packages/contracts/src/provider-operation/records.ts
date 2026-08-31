import { z } from 'zod';

import { IdempotencyKeySchema } from '../request-navigation-security.ts';
import { WebhookProviderIdSchema } from '../webhook-admission.ts';
import {
  ProviderEffectPayloadSchema,
  ProviderIntentHashSchema,
  ProviderOperationStateSchema,
  ProviderOperationTypeSchema,
  ProviderOperationVersionSchema,
  ProviderReferenceSchema,
  SafeTimestampSchema,
} from './primitives.ts';

export const ProviderOperationSchema = z
  .object({
    id: z.uuid(),
    provider: WebhookProviderIdSchema,
    operationType: ProviderOperationTypeSchema,
    actorId: z.uuid(),
    state: ProviderOperationStateSchema,
    intentHash: ProviderIntentHashSchema,
    providerRef: ProviderReferenceSchema.nullable(),
    lastAttemptAt: SafeTimestampSchema.nullable(),
    reconciliationAt: SafeTimestampSchema.nullable(),
    version: ProviderOperationVersionSchema,
  })
  .strict()
  .readonly();

/** The only valid operation shape before a provider adapter call. */
export const ProviderOperationIntentSchema = z
  .object({
    id: z.uuid(),
    provider: WebhookProviderIdSchema,
    operationType: ProviderOperationTypeSchema,
    actorId: z.uuid(),
    state: z.literal('planned'),
    intentHash: ProviderIntentHashSchema,
    providerRef: z.null(),
    lastAttemptAt: z.null(),
    reconciliationAt: z.null(),
    version: ProviderOperationVersionSchema,
    idempotencyKey: IdempotencyKeySchema,
  })
  .strict()
  .readonly();

export const ProviderEffectRequestSchema = z
  .object({
    operationId: z.uuid(),
    provider: WebhookProviderIdSchema,
    idempotencyKey: IdempotencyKeySchema,
    payloadDigest: ProviderIntentHashSchema,
    payload: ProviderEffectPayloadSchema,
  })
  .strict()
  .readonly();

export type ProviderOperation = z.infer<typeof ProviderOperationSchema>;
export type ProviderOperationIntent = z.infer<
  typeof ProviderOperationIntentSchema
>;
export type ProviderEffectPayload = z.infer<typeof ProviderEffectPayloadSchema>;
export type ProviderEffectRequest = z.infer<typeof ProviderEffectRequestSchema>;
