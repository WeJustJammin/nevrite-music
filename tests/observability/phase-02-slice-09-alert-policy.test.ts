import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS,
  evaluateContentSchemaRegistryAlerts,
  type ContentSchemaRegistryOperationalSnapshot,
} from '../../infra/observability/content-schema-registry-alert-policy';

const runbook = readFileSync(
  resolve(
    import.meta.dirname,
    '../../.memory/wiki/operations/runbooks/content-schema-registry.md',
  ),
  'utf8',
);

const healthy: ContentSchemaRegistryOperationalSnapshot = {
  activationBlockedMs:
    CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.activationBlockedMs,
  migrationRetryCount:
    CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.migrationRetryCount,
  nonceRejectionRate: 0.01,
  nonceRejectionBaseline: 0.01,
  dlqDepth: 0,
  outboxAgeMs: CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.outboxAgeMs,
  conflictRate: CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.conflictRate,
  conflictWindowMs: CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.conflictWindowMs,
  unknownEventVersions: 0,
  commandP95Ms: CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.commandP95Ms - 1,
  protectedRpcP95Ms:
    CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.protectedRpcP95Ms - 1,
  acceptanceP99Ms: CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.acceptanceP99Ms - 1,
  queueFirstAttemptP95Ms:
    CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.queueFirstAttemptP95Ms - 1,
  dailyDlqRate:
    CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.dailyDlqRate - 0.000001,
};

describe('[P2-S09-AC-209] operational alert and SLO policy', () => {
  it('keeps the locked on-call thresholds in one executable policy', () => {
    expect(CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS).toEqual({
      activationBlockedMs: 900_000,
      migrationRetryCount: 3,
      outboxAgeMs: 120_000,
      conflictRate: 0.05,
      conflictWindowMs: 300_000,
      unknownEventVersions: 0,
      commandP95Ms: 1_200,
      protectedRpcP95Ms: 300,
      acceptanceP99Ms: 1_000,
      queueFirstAttemptP95Ms: 60_000,
      dailyDlqRate: 0.001,
    });
    expect(evaluateContentSchemaRegistryAlerts(healthy)).toEqual([]);
  });

  it.each([
    ['activation_blocked', { activationBlockedMs: 900_001 }],
    ['migration_retry_exceeded', { migrationRetryCount: 4 }],
    [
      'nonce_rejection_spike',
      { nonceRejectionRate: 0.11, nonceRejectionBaseline: 0.1 },
    ],
    ['dlq_nonempty', { dlqDepth: 1 }],
    ['outbox_age_exceeded', { outboxAgeMs: 120_001 }],
    [
      'conflict_rate_exceeded',
      { conflictRate: 0.050001, conflictWindowMs: 300_000 },
    ],
    ['unknown_event_version', { unknownEventVersions: 1 }],
    ['command_p95_exceeded', { commandP95Ms: 1_200 }],
    ['protected_rpc_p95_exceeded', { protectedRpcP95Ms: 300 }],
    ['acceptance_p99_exceeded', { acceptanceP99Ms: 1_000 }],
    ['queue_first_attempt_p95_exceeded', { queueFirstAttemptP95Ms: 60_000 }],
    ['daily_dlq_rate_exceeded', { dailyDlqRate: 0.001 }],
  ] as const)('pages the exact %s condition', (code, patch) => {
    const alerts = evaluateContentSchemaRegistryAlerts({
      ...healthy,
      ...patch,
    });
    expect(alerts.map((entry) => entry.code)).toContain(code);
    expect(alerts.every((entry) => entry.route === 'platform.on_call')).toBe(
      true,
    );
    expect(
      alerts.every((entry) => entry.runbook === 'content-schema-registry'),
    ).toBe(true);
  });

  it('requires the complete five-minute conflict window and does not page on malformed input', () => {
    expect(
      evaluateContentSchemaRegistryAlerts({
        ...healthy,
        conflictRate: 0.06,
        conflictWindowMs: 299_999,
      }),
    ).toEqual([]);
    expect(
      evaluateContentSchemaRegistryAlerts({
        ...healthy,
        activationBlockedMs: Number.NaN,
        migrationRetryCount: Number.POSITIVE_INFINITY,
        dailyDlqRate: Number.NEGATIVE_INFINITY,
      }),
    ).toEqual([]);
  });

  it('matches the runbook conditions and the production telemetry SLO fields', () => {
    for (const condition of [
      'activation remains blocked longer than 15 minutes',
      'CMS DLQ depth is greater than zero',
      'oldest CMS outbox event age exceeds two minutes',
      'version/idempotency conflicts exceed 5% for five minutes',
      'a consumer observes an unknown event version',
      'Tier 2 command p95 exceeds 1,200 ms',
      'protected RPC p95 exceeds 300 ms',
      'acceptance p99 exceeds 1,000 ms',
      'queue first-attempt p95 exceeds 60 seconds',
      'daily DLQ rate reaches 0.1%',
    ])
      expect(runbook).toContain(condition);

    const telemetry = readFileSync(
      resolve(
        import.meta.dirname,
        '../../apps/worker/src/content-schema-registry/production-telemetry.ts',
      ),
      'utf8',
    );
    for (const field of [
      'slo_command_p95_ms',
      'slo_protected_rpc_p95_ms',
      'slo_acceptance_p99_ms',
      'alert_class',
      'alert_route',
      'runbook',
    ])
      expect(telemetry).toContain(field);
  });
});
