import { z } from 'zod';

import {
  GLOBAL_WEBHOOK_BODY_MAX_BYTES,
  PositiveSafeIntegerSchema,
  WebhookHeaderNameSchema,
  WebhookProviderIdSchema,
} from './identity.ts';

export const WebhookProviderConfigSchema = z
  .object({
    providerId: WebhookProviderIdSchema,
    maxBodyBytes: PositiveSafeIntegerSchema.max(GLOBAL_WEBHOOK_BODY_MAX_BYTES),
    replayWindowSeconds: PositiveSafeIntegerSchema.max(86_400),
    signatureHeader: WebhookHeaderNameSchema,
    timestampHeader: WebhookHeaderNameSchema,
    enabled: z.boolean(),
  })
  .strict()
  .superRefine((config, context) => {
    if (
      config.signatureHeader.toLowerCase() ===
      config.timestampHeader.toLowerCase()
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Signature and timestamp headers must be distinct',
        path: ['timestampHeader'],
      });
    }
  })
  .readonly();

export const WebhookProviderDefinitionSchema = WebhookProviderConfigSchema;

export const WebhookProviderRegistrySchema = z
  .array(WebhookProviderConfigSchema)
  .max(64)
  .superRefine((providers, context) => {
    const seen = new Set<string>();
    for (const [index, provider] of providers.entries()) {
      if (seen.has(provider.providerId)) {
        context.addIssue({
          code: 'custom',
          message: 'Provider IDs must be unique',
          path: [index, 'providerId'],
        });
      }
      seen.add(provider.providerId);
    }
  })
  .readonly();

/** Production Phase 1 deliberately has no enabled provider registrations. */
export const ProductionWebhookProviderRegistrySchema = z.tuple([]).readonly();

export type WebhookProviderConfig = z.infer<typeof WebhookProviderConfigSchema>;
export type WebhookProviderRegistry = z.infer<
  typeof WebhookProviderRegistrySchema
>;
