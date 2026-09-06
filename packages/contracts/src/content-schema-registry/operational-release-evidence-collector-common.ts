import { z } from 'zod';

import { SafeReleaseIdSchema } from '../release-recovery-common.ts';
import { ReleaseEvidenceWindowSchema } from './operational-release-evidence-common.ts';

export const CONTENT_SCHEMA_REGISTRY_AC211_CRITERION = 'P2-S09-AC-211' as const;
export const CONTENT_SCHEMA_REGISTRY_AC211_SCHEMA_VERSION = 2 as const;
export const CONTENT_SCHEMA_REGISTRY_AC211_PROVIDER_PROVENANCE = [
  'cloudflare_workers_logs',
  'cloudflare_queue_analytics',
] as const;
export const CONTENT_SCHEMA_REGISTRY_AC211_MAX_DURATION_SAMPLES = 64_000;
export const CONTENT_SCHEMA_REGISTRY_AC211_MAX_DURATION_MS = 86_400_000;
export const CONTENT_SCHEMA_REGISTRY_AC211_MAX_COUNT = 64_000;
export const CONTENT_SCHEMA_REGISTRY_AC211_MAX_PAGES = 32;
export const CONTENT_SCHEMA_REGISTRY_AC211_MIN_API_EVIDENCE_GROUPS = 200;

export const completeUtcDay = (value: {
  startedAt: string;
  endedAt: string;
}): boolean => {
  const startedAt = Date.parse(value.startedAt);
  const endedAt = Date.parse(value.endedAt);
  const start = new Date(startedAt);
  return (
    startedAt ===
      Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate(),
      ) && endedAt - startedAt === 86_400_000
  );
};

export const ContentSchemaRegistryAc211WindowSchema =
  ReleaseEvidenceWindowSchema.refine(
    completeUtcDay,
    'AC211 evidence must cover one complete UTC day',
  );

const duration = z
  .number()
  .finite()
  .nonnegative()
  .max(CONTENT_SCHEMA_REGISTRY_AC211_MAX_DURATION_MS);
export const durations = (minimum: number) =>
  z
    .array(duration)
    .min(minimum)
    .max(CONTENT_SCHEMA_REGISTRY_AC211_MAX_DURATION_SAMPLES)
    .readonly();
export const count = z
  .number()
  .int()
  .nonnegative()
  .max(CONTENT_SCHEMA_REGISTRY_AC211_MAX_COUNT);
export const completeness = z
  .object({
    pageCount: z
      .number()
      .int()
      .positive()
      .max(CONTENT_SCHEMA_REGISTRY_AC211_MAX_PAGES),
    eventsRead: count,
    providerEventCount: count,
    apiEvidenceGroups: z
      .number()
      .int()
      .min(CONTENT_SCHEMA_REGISTRY_AC211_MIN_API_EVIDENCE_GROUPS)
      .max(CONTENT_SCHEMA_REGISTRY_AC211_MAX_COUNT),
    complete: z.literal(true),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.eventsRead !== value.providerEventCount)
      context.addIssue({
        code: 'custom',
        path: ['eventsRead'],
        message: 'Events read must equal the provider event count',
      });
    if (value.apiEvidenceGroups > value.eventsRead)
      context.addIssue({
        code: 'custom',
        path: ['apiEvidenceGroups'],
        message: 'API evidence groups cannot exceed events read',
      });
  })
  .readonly();
export const provenance = z
  .array(z.enum(CONTENT_SCHEMA_REGISTRY_AC211_PROVIDER_PROVENANCE))
  .length(2)
  .superRefine((value, context) => {
    if (
      new Set(value).size !== value.length ||
      !CONTENT_SCHEMA_REGISTRY_AC211_PROVIDER_PROVENANCE.every((provider) =>
        value.includes(provider),
      )
    )
      context.addIssue({
        code: 'custom',
        message: 'Provider provenance entries must be unique',
      });
  })
  .readonly();

export const datasetDurations = z
  .object({
    command: durations(200),
    protectedRpc: durations(200),
    acceptance: durations(200),
    queueFirstAttempt: durations(1),
  })
  .strict()
  .readonly();
export const datasetCounts = z
  .object({ queueAttempts: count, dlqMessages: count, errorCount: count })
  .strict()
  .readonly();
export const queueAnalytics = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
    queueId: z.string().regex(/^[a-f0-9]{32}$/u),
    queryId: SafeReleaseIdSchema,
    queueAttempts: count,
    dlqMessages: count,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.queueAttempts === 0 || value.dlqMessages > value.queueAttempts)
      context.addIssue({
        code: 'custom',
        path: ['queueAttempts'],
        message: 'Queue Analytics counts are invalid',
      });
  })
  .readonly();
