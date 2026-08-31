import { z } from 'zod';

import { WebhookProviderIdSchema } from '../webhook-admission.ts';
import {
  ProviderExternalEventIdSchema,
  ProviderIntentHashSchema,
  SafeTimestampSchema,
} from './primitives.ts';

export const ProviderEffectResponseSchema = z
  .object({
    providerOperationId: z.string().min(1).max(128),
    accepted: z.boolean(),
    status: z.enum(['accepted', 'rejected', 'pending']),
    externalEventId: ProviderExternalEventIdSchema.nullable(),
  })
  .strict()
  .superRefine((response, context) => {
    if (response.status === 'accepted' && !response.accepted) {
      context.addIssue({
        code: 'custom',
        message: 'Accepted provider status must set accepted=true',
        path: ['accepted'],
      });
    }
    if (response.status !== 'accepted' && response.accepted) {
      context.addIssue({
        code: 'custom',
        message: 'Rejected or pending provider status must set accepted=false',
        path: ['accepted'],
      });
    }
    if (response.status === 'pending' && response.externalEventId !== null) {
      context.addIssue({
        code: 'custom',
        message: 'Unknown provider outcomes cannot claim an external event ID',
        path: ['externalEventId'],
      });
    }
  })
  .readonly();

export const ProviderUnknownOutcomeSchema = z
  .object({
    providerOperationId: z.string().min(1).max(128),
    accepted: z.literal(false),
    status: z.literal('pending'),
    externalEventId: z.null(),
  })
  .strict()
  .readonly();

export const ProviderResolutionEvidenceSchema = z
  .object({
    operationId: z.uuid(),
    provider: WebhookProviderIdSchema,
    payloadDigest: ProviderIntentHashSchema,
    externalEventId: ProviderExternalEventIdSchema.nullable(),
    status: z.enum(['confirmed', 'failed', 'manual_review']),
    observedAt: SafeTimestampSchema,
  })
  .strict()
  .readonly();

export type ProviderEffectResponse = z.infer<
  typeof ProviderEffectResponseSchema
>;
export type ProviderUnknownOutcome = z.infer<
  typeof ProviderUnknownOutcomeSchema
>;
export type ProviderResolutionEvidence = z.infer<
  typeof ProviderResolutionEvidenceSchema
>;
