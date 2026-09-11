import { describe, expect, it, vi } from 'vitest';

import {
  Ac209ProductionExerciseReportSchema,
  exerciseProductionAc209,
} from '../infra/workflows/exercise-production-ac209.ts';
import { sha256CanonicalEmail } from '../infra/workflows/ac209-email-sending-analytics.ts';
import type { Ac209QueueExerciseReport } from '../infra/workflows/ac209-queue-exercise.ts';
import {
  alertEmailSha256,
  dlqId,
  input as configurationInput,
  sourceRevision,
  supabaseUrl,
  versionId,
} from './ac209-alert-configuration-test-fixtures.ts';
import { collectContentSchemaRegistryAlertConfiguration } from '../infra/workflows/collect-content-schema-registry-alert-configuration.ts';

const ACCOUNT_ID = 'b1c05c00f04130a0d100adbca6696e6e';
const SOURCE_QUEUE_ID = '3ef0a968a51b47b8be094d8dad2a71d4';
const ZONE_ID = '1234567890abcdef1234567890abcdef';
const CHECKED_AT = '2026-09-10T23:15:00.000Z';
const COMPLETED_AT = '2026-09-10T23:17:00.000Z';
const MESSAGE_ID = 'cloudflare-email-message-0001';
const SENDER_SHA256 = sha256CanonicalEmail('platform.on-call@alerts.wejamm.in');

const queueReport: Ac209QueueExerciseReport = {
  sourceQueue: { id: SOURCE_QUEUE_ID, name: 'platform-jobs' },
  deadLetterQueue: { id: dlqId, name: 'platform-jobs-dlq' },
  consumer: {
    scriptName: 'wejammin-api',
    maxRetries: 3,
    deadLetterQueueName: 'platform-jobs-dlq',
  },
  markerSha256: 'b'.repeat(64),
  preflight: { sourceMessages: 0, deadLetterMessages: 0 },
  pushAccepted: true,
  dlq: {
    attempts: 4,
    messageIdSha256: 'c'.repeat(64),
    timestampMs: Date.parse('2026-09-10T23:15:20.000Z'),
  },
  cleanup: {
    purgedRefCount: 1,
    markerAbsent: true,
    sourceMessages: 0,
    deadLetterMessages: 0,
  },
};

const emailReport = {
  schemaVersion: 'ac209-email-sending-analytics-v1' as const,
  sourceRevision,
  environment: 'production' as const,
  zoneId: ZONE_ID,
  window: {
    start: CHECKED_AT,
    end: '2026-09-10T23:16:30.000Z',
  },
  event: {
    senderSha256: SENDER_SHA256,
    recipientSha256: alertEmailSha256,
    subject: '[WeJammin] dlq_nonempty',
    messageId: MESSAGE_ID,
    datetime: '2026-09-10T23:16:00.000Z',
    status: 'delivered' as const,
  },
};

const delivery = {
  schemaVersion: 'ac209-delivery-verification-v1' as const,
  verified: true as const,
  alertCode: 'dlq_nonempty' as const,
  release: sourceRevision,
  state: 'delivered' as const,
  claimedAt: '2026-09-10T23:15:50.000Z',
  deliveredAt: '2026-09-10T23:15:51.000Z',
  providerMessageIdMatched: true as const,
};

const configuration = async () =>
  (await collectContentSchemaRegistryAlertConfiguration(configurationInput()))
    .report;

const baseInput = async () => ({
  accountId: ACCOUNT_ID,
  queueToken: 'queue-exercise-token-that-is-never-reported',
  emailAnalyticsToken: 'email-analytics-token-that-is-never-reported',
  emailZoneId: ZONE_ID,
  sourceRevision,
  productionVersionId: versionId,
  exerciseMarker: '22222222-2222-4222-8222-222222222222',
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

const dependencies = () => {
  let callback:
    | ((context: {
        marker: string;
        messageId: string;
        attempts: number;
        timestampMs: number;
      }) => Promise<void>)
    | undefined;
  const queueExercise = vi.fn(async (value) => {
    callback = value.whileDlqMessagePresent;
    await callback?.({
      marker: '22222222-2222-4222-8222-222222222222',
      messageId: 'queue-message-id',
      attempts: 4,
      timestampMs: queueReport.dlq.timestampMs,
    });
    return queueReport;
  });
  return {
    queueExercise,
    readEligibility: vi.fn(async () => ({
      schemaVersion: 'ac209-exercise-eligibility-v1' as const,
      eligible: true as const,
      checkedAt: CHECKED_AT,
    })),
    collectEmailAnalytics: vi.fn(async () => emailReport),
    verifyDelivery: vi.fn(async () => delivery),
    now: vi
      .fn<() => number>()
      .mockReturnValueOnce(Date.parse(CHECKED_AT))
      .mockReturnValueOnce(Date.parse('2026-09-10T23:16:30.000Z'))
      .mockReturnValue(Date.parse(COMPLETED_AT)),
    sleep: vi.fn(async () => undefined),
  };
};

describe('production AC209 queue-to-email exercise orchestration', () => {
  it('binds one real retry, provider delivery, database receipt, and exact cleanup', async () => {
    const deps = dependencies();
    const report = await exerciseProductionAc209(await baseInput(), deps);

    expect(report).toMatchObject({
      schemaVersion: 'ac209-production-exercise-v1',
      sourceRevision,
      productionVersionId: versionId,
      environment: 'production',
      queue: queueReport,
      email: emailReport,
      database: delivery,
      mailboxReceipt: { status: 'pending_manual_verification' },
    });
    expect(Ac209ProductionExerciseReportSchema.parse(report)).toEqual(report);
    expect(deps.readEligibility).toHaveBeenCalledWith(
      expect.objectContaining({ checkedAt: CHECKED_AT }),
    );
    expect(deps.queueExercise).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceQueueName: 'platform-jobs',
        deadLetterQueueName: 'platform-jobs-dlq',
        expectedDeadLetterQueueId: dlqId,
        expectedSourceQueueId: SOURCE_QUEUE_ID,
        markerUuid: '22222222-2222-4222-8222-222222222222',
        expectedConsumer: {
          scriptName: 'wejammin-api',
          maxRetries: 3,
          deadLetterQueueName: 'platform-jobs-dlq',
        },
      }),
    );
    expect(deps.collectEmailAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceRevision,
        expectedSubject: '[WeJammin] dlq_nonempty',
        expectedMessageId: undefined,
      }),
    );
    expect(deps.verifyDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        notBefore: CHECKED_AT,
        providerMessageId: MESSAGE_ID,
        sourceRevision,
      }),
    );
  });

  it('fails before queue access when the alert cooldown is active', async () => {
    const deps = dependencies();
    deps.readEligibility.mockResolvedValueOnce({
      schemaVersion: 'ac209-exercise-eligibility-v1',
      eligible: false,
      checkedAt: CHECKED_AT,
      blockedUntil: '2026-09-10T23:20:00.000Z',
    });
    await expect(
      exerciseProductionAc209(await baseInput(), deps),
    ).rejects.toThrow('AC209 production exercise failed');
    expect(deps.queueExercise).not.toHaveBeenCalled();
  });

  it.each([
    ['source revision', { sourceRevision: 'd'.repeat(40) }],
    ['production version', { productionVersionId: 'wrong-version' }],
    ['DLQ identity', { expectedDeadLetterQueueId: 'e'.repeat(32) }],
    ['recipient digest', { expectedRecipientSha256: 'f'.repeat(64) }],
    ['exercise marker', { exerciseMarker: 'invalid-marker' }],
  ])(
    'rejects a %s mismatch against the exact configuration artifact',
    async (_name, override) => {
      const deps = dependencies();
      await expect(
        exerciseProductionAc209({ ...(await baseInput()), ...override }, deps),
      ).rejects.toThrow('AC209 production exercise failed');
      expect(deps.queueExercise).not.toHaveBeenCalled();
    },
  );

  it('fails closed when the provider message is not bound to the database delivery', async () => {
    const deps = dependencies();
    deps.verifyDelivery.mockRejectedValue(new Error('not matched'));
    await expect(
      exerciseProductionAc209(await baseInput(), deps),
    ).rejects.toThrow('AC209 production exercise failed');
    expect(deps.verifyDelivery).toHaveBeenCalledWith(
      expect.objectContaining({ providerMessageId: MESSAGE_ID }),
    );
    expect(deps.queueExercise).toHaveBeenCalledOnce();
  });

  it('rejects database delivery evidence from before this exercise', async () => {
    const deps = dependencies();
    deps.verifyDelivery.mockResolvedValue({
      ...delivery,
      claimedAt: '2026-09-10T23:14:58.000Z',
      deliveredAt: '2026-09-10T23:14:59.000Z',
    });
    await expect(
      exerciseProductionAc209(await baseInput(), deps),
    ).rejects.toThrow('AC209 production exercise failed');
    expect(deps.queueExercise).toHaveBeenCalledOnce();
  });

  it('never includes credentials, raw addresses, marker, or queue ref in evidence', async () => {
    const report = await exerciseProductionAc209(
      await baseInput(),
      dependencies(),
    );
    const serialized = JSON.stringify(report);
    for (const forbidden of [
      'queue-exercise-token',
      'email-analytics-token',
      'supabase-service-key',
      'platform.on-call@alerts.wejamm.in',
      'admin.wejammin@gmail.com',
      '22222222-2222-4222-8222-222222222222',
      'queue-message-id',
      '"ref":',
    ])
      expect(serialized).not.toContain(forbidden);
  });
});
