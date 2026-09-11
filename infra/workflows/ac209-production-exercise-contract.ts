import { z } from '../../packages/contracts/node_modules/zod/index.js';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import { Ac209DeliveryVerificationSchema } from './ac209-delivery-verification.ts';
import { Ac209EmailSendingAnalyticsReportSchema } from './ac209-email-sending-analytics.ts';

const SOURCE_REVISION = /^[0-9a-f]{40}$/u;
const PROVIDER_ID = /^[0-9a-f]{32}$/u;
const SHA256 = /^[0-9a-f]{64}$/u;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;

const Ac209QueueExerciseReportSchema = z
  .object({
    sourceQueue: z
      .object({
        id: z.string().regex(PROVIDER_ID),
        name: z.literal('platform-jobs'),
      })
      .strict(),
    deadLetterQueue: z
      .object({
        id: z.string().regex(PROVIDER_ID),
        name: z.literal('platform-jobs-dlq'),
      })
      .strict(),
    consumer: z
      .object({
        scriptName: z.literal('wejammin-api'),
        maxRetries: z.literal(3),
        deadLetterQueueName: z.literal('platform-jobs-dlq'),
      })
      .strict(),
    markerSha256: z.string().regex(SHA256),
    preflight: z
      .object({
        sourceMessages: z.literal(0),
        deadLetterMessages: z.literal(0),
      })
      .strict(),
    pushAccepted: z.literal(true),
    dlq: z
      .object({
        attempts: z.number().int().min(2),
        messageIdSha256: z.string().regex(SHA256),
        timestampMs: z.number().int().nonnegative(),
      })
      .strict(),
    cleanup: z
      .object({
        purgedRefCount: z.number().int().min(1),
        markerAbsent: z.literal(true),
        sourceMessages: z.number().int().nonnegative(),
        deadLetterMessages: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const Ac209ProductionExerciseReportSchema = z
  .object({
    schemaVersion: z.literal('ac209-production-exercise-v1'),
    sourceRevision: z.string().regex(SOURCE_REVISION),
    productionVersionId: z.string().regex(SAFE_ID),
    environment: z.literal('production'),
    configuration: z
      .object({
        configurationId: z.string().regex(SAFE_ID),
        configurationReference: z.string().min(1).max(256),
        deploymentId: z.string().regex(SAFE_ID),
        versionId: z.string().regex(SAFE_ID),
        capturedAt: SafeReleaseTimestampSchema,
      })
      .strict(),
    timing: z
      .object({
        startedAt: SafeReleaseTimestampSchema,
        completedAt: SafeReleaseTimestampSchema,
      })
      .strict(),
    queue: Ac209QueueExerciseReportSchema,
    email: Ac209EmailSendingAnalyticsReportSchema,
    database: Ac209DeliveryVerificationSchema,
    mailboxReceipt: z
      .object({ status: z.literal('pending_manual_verification') })
      .strict(),
  })
  .strict();

export type Ac209ProductionExerciseReport = z.infer<
  typeof Ac209ProductionExerciseReportSchema
>;
