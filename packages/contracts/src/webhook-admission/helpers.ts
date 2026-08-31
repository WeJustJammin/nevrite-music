import { z } from 'zod';

import {
  WebhookProviderConfigSchema,
  type WebhookProviderConfig,
} from './registry.ts';
import { WebhookRawRequestSchema } from './request.ts';
import {
  GLOBAL_WEBHOOK_BODY_MAX_BYTES,
  WebhookProviderIdSchema,
} from './identity.ts';

export const createWebhookRouteSchema = <const Provider extends string>(
  provider: Provider,
) => {
  WebhookProviderIdSchema.parse(provider);
  return z.literal(provider);
};

export const createWebhookAdmissionSchema = (config: WebhookProviderConfig) => {
  const parsedConfig = WebhookProviderConfigSchema.parse(config);

  return WebhookRawRequestSchema.superRefine((request, context) => {
    if (!parsedConfig.enabled) {
      context.addIssue({
        code: 'custom',
        message: 'Provider is disabled',
        path: ['rawBody'],
      });
    }
    if (request.rawBody.byteLength > parsedConfig.maxBodyBytes) {
      context.addIssue({
        code: 'custom',
        message: 'Webhook body exceeds the provider limit',
        path: ['rawBody'],
      });
    }
  });
};

export const isWebhookTimestampFresh = (
  timestampSeconds: number,
  nowSeconds: number,
  replayWindowSeconds: number,
): boolean =>
  Number.isSafeInteger(timestampSeconds) &&
  Number.isSafeInteger(nowSeconds) &&
  Number.isSafeInteger(replayWindowSeconds) &&
  replayWindowSeconds > 0 &&
  Math.abs(nowSeconds - timestampSeconds) <= replayWindowSeconds;

export const WEBHOOK_GLOBAL_BODY_MAX_BYTES = GLOBAL_WEBHOOK_BODY_MAX_BYTES;
