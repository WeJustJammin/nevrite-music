import { vi } from 'vitest';

import { collectContentSchemaRegistryAlertConfiguration } from '../infra/workflows/collect-content-schema-registry-alert-configuration.ts';
import { Ac209QueueExerciseError } from '../infra/workflows/ac209-queue-exercise.ts';
import {
  alertEmailSha256,
  dlqId,
  input as configurationInput,
  sourceRevision,
  supabaseUrl,
  versionId,
} from './ac209-alert-configuration-test-fixtures.ts';

export { alertEmailSha256, dlqId, sourceRevision, supabaseUrl, versionId };

export const ACCOUNT_ID = 'b1c05c00f04130a0d100adbca6696e6e';
export const SOURCE_QUEUE_ID = '3ef0a968a51b47b8be094d8dad2a71d4';
export const ZONE_ID = '1234567890abcdef1234567890abcdef';
export const CHECKED_AT = '2026-09-10T23:15:00.000Z';
export const COMPLETED_AT = '2026-09-10T23:17:00.000Z';
export const FAILED_AT = '2026-09-10T23:18:00.000Z';
export const MARKER = '22222222-2222-4222-8222-222222222222';
export const SENDER_SHA256 = 'a'.repeat(64);

export const configuration = async () =>
  (await collectContentSchemaRegistryAlertConfiguration(configurationInput()))
    .report;

export const baseInput = async () => ({
  accountId: ACCOUNT_ID,
  queueToken: 'queue-exercise-token-that-is-never-reported',
  emailAnalyticsToken: 'email-analytics-token-that-is-never-reported',
  emailZoneId: ZONE_ID,
  sourceRevision,
  productionVersionId: versionId,
  exerciseMarker: MARKER,
  expectedSourceQueueId: SOURCE_QUEUE_ID,
  expectedDeadLetterQueueId: dlqId,
  expectedSenderSha256: SENDER_SHA256,
  expectedRecipientSha256: alertEmailSha256,
  supabaseUrl,
  supabaseServiceKey: 'supabase-service-key-that-is-never-reported',
  configuration: await configuration(),
  execution: {
    environment: 'production',
    ref: 'refs/heads/main',
    checkedOutSha: sourceRevision,
  },
});

export const dependencies = () => ({
  queueExercise: vi.fn(async () => {
    throw new Ac209QueueExerciseError('marker_not_observed', 'never observed');
  }),
  beforeQueueAccess: vi.fn(),
  readEligibility: vi.fn(async () => ({
    schemaVersion: 'ac209-exercise-eligibility-v1' as const,
    eligible: true as const,
    checkedAt: CHECKED_AT,
  })),
  verifyEmailCapability: vi.fn(async () => undefined),
  collectEmailAnalytics: vi.fn(),
  verifyDelivery: vi.fn(),
  now: vi.fn<() => number>().mockReturnValue(Date.parse(FAILED_AT)),
  sleep: vi.fn(async () => undefined),
});

export const queueReportFixture = () => ({
  sourceQueue: { id: SOURCE_QUEUE_ID, name: 'platform-jobs' as const },
  deadLetterQueue: { id: dlqId, name: 'platform-jobs-dlq' as const },
  consumer: {
    scriptName: 'wejammin-api' as const,
    maxRetries: 3 as const,
    deadLetterQueueName: 'platform-jobs-dlq' as const,
  },
  markerSha256: 'b'.repeat(64),
  preflight: { sourceMessages: 0 as const, deadLetterMessages: 0 as const },
  pushAccepted: true as const,
  dlq: {
    attempts: 0,
    messageIdSha256: 'c'.repeat(64),
    timestampMs: Date.parse(COMPLETED_AT),
  },
  cleanup: {
    purgedRefCount: 1,
    markerAbsent: true as const,
    sourceMessages: 0,
    deadLetterMessages: 0,
  },
});

export const emailReportFixture = () => ({
  schemaVersion: 'ac209-email-sending-analytics-v1' as const,
  sourceRevision,
  environment: 'production' as const,
  zoneId: ZONE_ID,
  window: { start: CHECKED_AT, end: COMPLETED_AT },
  event: {
    senderSha256: SENDER_SHA256,
    recipientSha256: alertEmailSha256,
    subject: '[WeJammin] dlq_nonempty',
    messageId: 'cloudflare-email-message-0001',
    datetime: COMPLETED_AT,
    status: 'delivered' as const,
  },
});

export const deliveryFixture = () => ({
  schemaVersion: 'ac209-delivery-verification-v1' as const,
  verified: true as const,
  alertCode: 'dlq_nonempty' as const,
  release: sourceRevision,
  state: 'delivered' as const,
  claimedAt: COMPLETED_AT,
  deliveredAt: COMPLETED_AT,
  providerMessageIdMatched: true as const,
});
