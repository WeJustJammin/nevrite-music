import { describe, expect, it } from 'vitest';

import { buildContentSchemaRegistryOperationalSnapshot } from './operational-alert-metrics';

const at = (timestamp: string, source: Record<string, unknown>) => ({
  source: { ...source, timestamp },
});

describe('content schema registry operational metrics', () => {
  it('derives redacted alert and SLO measurements from structured production events', () => {
    const now = Date.parse('2026-09-05T12:00:00.000Z');
    const events = [
      at('2026-09-05T11:58:00.000Z', {
        eventName: 'cms.registry.command',
        durationMs: 900,
        outcome: 'success',
      }),
      at('2026-09-05T11:59:00.000Z', {
        eventName: 'cms.registry.command',
        durationMs: 1_300,
        errorCode: 'VERSION_CONFLICT',
        outcome: 'rejected',
      }),
      at('2026-09-05T11:59:10.000Z', {
        eventName: 'cms.registry.rpc',
        durationMs: 350,
        outcome: 'success',
      }),
      at('2026-09-05T11:59:20.000Z', {
        eventName: 'cms.registry.acceptance',
        durationMs: 1_100,
        outcome: 'success',
      }),
      at('2026-09-05T11:59:30.000Z', {
        eventName: 'cms.registry.queue_attempt',
        durationMs: 61_000,
        attempt: 1,
        outcome: 'success',
      }),
      at('2026-09-05T11:59:40.000Z', {
        eventName: 'cms.registry.migration',
        attempt: 4,
        errorCode: 'UNKNOWN_EVENT_VERSION',
        metrics: { 'cms.migration.dlq.total': 1 },
        outcome: 'failure',
        retryable: true,
      }),
      at('2026-09-05T11:59:45.000Z', {
        eventName: 'cms.registry.request',
        errorCode: 'NONCE_REJECTED',
        outcome: 'rejected',
      }),
      at('2026-09-05T11:53:00.000Z', {
        eventName: 'cms.registry.request',
        errorCode: 'NONCE_REJECTED',
        outcome: 'rejected',
      }),
    ];

    expect(
      buildContentSchemaRegistryOperationalSnapshot({
        database: { activationBlockedMs: 900_001, outboxAgeMs: 120_001 },
        dlqDepth: 2,
        events,
        now,
      }),
    ).toEqual({
      acceptanceP99Ms: 1_100,
      activationBlockedMs: 900_001,
      commandP95Ms: 1_300,
      conflictRate: 0.5,
      conflictWindowMs: 300_000,
      dailyDlqRate: 1,
      dlqDepth: 2,
      migrationRetryCount: 4,
      nonceRejectionBaseline: 1,
      nonceRejectionRate: 1,
      outboxAgeMs: 120_001,
      protectedRpcP95Ms: 350,
      queueFirstAttemptP95Ms: 61_000,
      unknownEventVersions: 1,
    });
  });

  it('uses the authoritative migration DLQ total below the retry threshold', () => {
    const now = Date.parse('2026-09-05T12:00:00.000Z');
    const snapshot = buildContentSchemaRegistryOperationalSnapshot({
      database: {},
      events: [
        at('2026-09-05T11:59:00.000Z', {
          eventName: 'cms.registry.queue_attempt',
          attempt: 1,
          outcome: 'success',
        }),
        at('2026-09-05T11:59:10.000Z', {
          eventName: 'cms.registry.migration',
          attempt: 1,
          metrics: { 'cms.migration.dlq.total': 1 },
          outcome: 'success',
          retryable: false,
        }),
      ],
      now,
    });

    expect(snapshot.dailyDlqRate).toBe(1);
  });

  it('does not fall back to the retry-attempt heuristic when the authoritative total is zero', () => {
    const now = Date.parse('2026-09-05T12:00:00.000Z');
    const snapshot = buildContentSchemaRegistryOperationalSnapshot({
      database: {},
      events: [
        at('2026-09-05T11:59:00.000Z', {
          eventName: 'cms.registry.queue_attempt',
          attempt: 1,
          outcome: 'success',
        }),
        at('2026-09-05T11:59:10.000Z', {
          eventName: 'cms.registry.migration',
          attempt: 4,
          metrics: { 'cms.migration.dlq.total': 0 },
          outcome: 'failure',
          retryable: true,
        }),
      ],
      now,
    });

    expect(snapshot.dailyDlqRate).toBe(0);
  });

  it('omits the daily DLQ rate when the authoritative total is malformed', () => {
    const now = Date.parse('2026-09-05T12:00:00.000Z');
    const snapshot = buildContentSchemaRegistryOperationalSnapshot({
      database: {},
      events: [
        at('2026-09-05T11:59:00.000Z', {
          eventName: 'cms.registry.queue_attempt',
          attempt: 1,
          outcome: 'success',
        }),
        at('2026-09-05T11:59:10.000Z', {
          eventName: 'cms.registry.migration',
          attempt: 4,
          metrics: { 'cms.migration.dlq.total': '1' },
          outcome: 'failure',
          retryable: true,
        }),
      ],
      now,
    });

    expect(snapshot).not.toHaveProperty('dailyDlqRate');
  });

  it('omits measurements that cannot be established from finite provider data', () => {
    expect(
      buildContentSchemaRegistryOperationalSnapshot({
        database: {},
        events: [
          { source: 'not-structured' },
          { source: { durationMs: NaN } },
          { source: { timestamp: 'not-a-time' } },
        ],
        now: Date.parse('2026-09-05T12:00:00.000Z'),
      }),
    ).toEqual({
      conflictWindowMs: 300_000,
      nonceRejectionBaseline: 0,
      nonceRejectionRate: 0,
      unknownEventVersions: 0,
    });
  });
});
