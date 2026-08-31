import { z } from 'zod';

import { QuotedVersionSchema } from './request-navigation-security.ts';

const CanonicalUuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );

export const OfflineIntentStateSchema = z.enum([
  'queued',
  'replaying',
  'accepted',
  'refused',
  'pending_manual_review',
]);

const OfflineIntentRefusalSchema = z
  .object({
    code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
    retryable: z.boolean(),
    requestId: CanonicalUuidSchema.nullable(),
  })
  .strict()
  .readonly();

export const OfflineIntentSchema = z
  .object({
    intentId: CanonicalUuidSchema,
    operation: z.string().regex(/^[a-z][a-z0-9_.:-]{0,127}$/),
    targetId: CanonicalUuidSchema.nullable(),
    localPayloadRef: z
      .string()
      .regex(
        /^local:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      ),
    payloadHash: z.string().regex(/^sha256:[0-9a-f]{64}$/),
    expectedVersion: QuotedVersionSchema.nullable(),
    state: OfflineIntentStateSchema,
    refusal: OfflineIntentRefusalSchema.nullable(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict()
  .superRefine(({ createdAt, refusal, state, updatedAt }, context) => {
    if (updatedAt < createdAt) {
      context.addIssue({
        code: 'custom',
        message: 'Intent update cannot predate creation',
        path: ['updatedAt'],
      });
    }
    if ((state === 'refused') !== (refusal !== null)) {
      context.addIssue({
        code: 'custom',
        message: 'Only refused intents carry refusal metadata',
        path: ['refusal'],
      });
    }
  })
  .readonly();

export type OfflineIntent = z.infer<typeof OfflineIntentSchema>;
export type OfflineIntentState = z.infer<typeof OfflineIntentStateSchema>;
