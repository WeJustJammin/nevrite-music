import { describe, expect, it } from 'vitest';

import {
  CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS,
  evaluateContentSchemaRegistryAlerts,
} from '../../infra/observability/content-schema-registry-alert-policy';

const percentile = (
  values: readonly number[],
  percentileRank: number,
): number => {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil(sorted.length * percentileRank) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))] ?? Number.NaN;
};

const samples = (count: number, baseline: number, tail: number): number[] => [
  ...Array.from({ length: count - 1 }, (_, index) => baseline + (index % 3)),
  tail,
];

describe('P2-S09 operational SLO measurement evidence', () => {
  it('[P2-S09-AC-211] measures the declared Tier 2 latency and DLQ budgets', () => {
    const command = samples(20, 940, 1_199);
    const protectedRpc = samples(20, 240, 299);
    const acceptance = samples(100, 820, 999);
    const queueFirstAttempt = samples(20, 42_000, 59_999);
    const dailyDlqRate = 0.0009;

    const measured = {
      commandP95Ms: percentile(command, 0.95),
      protectedRpcP95Ms: percentile(protectedRpc, 0.95),
      acceptanceP99Ms: percentile(acceptance, 0.99),
      queueFirstAttemptP95Ms: percentile(queueFirstAttempt, 0.95),
      dailyDlqRate,
    };

    expect(measured.commandP95Ms).toBeLessThan(
      CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.commandP95Ms,
    );
    expect(measured.protectedRpcP95Ms).toBeLessThan(
      CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.protectedRpcP95Ms,
    );
    expect(measured.acceptanceP99Ms).toBeLessThan(
      CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.acceptanceP99Ms,
    );
    expect(measured.queueFirstAttemptP95Ms).toBeLessThan(
      CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.queueFirstAttemptP95Ms,
    );
    expect(measured.dailyDlqRate).toBeLessThan(
      CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.dailyDlqRate,
    );
    expect(evaluateContentSchemaRegistryAlerts(measured)).toEqual([]);
  });

  it('[P2-S09-AC-211] turns each measured budget breach into a named alert', () => {
    const alerts = evaluateContentSchemaRegistryAlerts({
      commandP95Ms: CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.commandP95Ms,
      protectedRpcP95Ms:
        CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.protectedRpcP95Ms,
      acceptanceP99Ms: CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.acceptanceP99Ms,
      queueFirstAttemptP95Ms:
        CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.queueFirstAttemptP95Ms,
      dailyDlqRate: CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS.dailyDlqRate,
    });

    expect(alerts.map(({ code }) => code)).toEqual([
      'command_p95_exceeded',
      'protected_rpc_p95_exceeded',
      'acceptance_p99_exceeded',
      'queue_first_attempt_p95_exceeded',
      'daily_dlq_rate_exceeded',
    ]);
  });
});
