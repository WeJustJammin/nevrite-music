import type { NormalizedWorkersObservabilityEvent } from '../../infra/workflows/content-schema-registry-slo-provider.ts';

export const sourceRevision = 'a'.repeat(40);
export const digest = 'b'.repeat(64);
export const constantDurations = (value: number): number[] =>
  Array.from({ length: 300 }, () => value);

export const validDataset = {
  criterion: 'P2-S09-AC-211',
  schemaVersion: 2,
  sourceRevision,
  environment: 'production',
  deploymentId: 'production-deployment-33460000000',
  queryId: 's09-production-slo-20260903',
  window: {
    startedAt: '2026-09-02T00:00:00.000Z',
    endedAt: '2026-09-03T00:00:00.000Z',
  },
  providerProvenance: ['cloudflare_workers_logs', 'cloudflare_queue_analytics'],
  queueAnalytics: {
    date: '2026-09-02',
    queueId: 'c'.repeat(32),
    queryId: 's09-production-slo-20260903',
    queueAttempts: 1_000,
    dlqMessages: 0,
  },
  durationsMs: {
    command: constantDurations(900),
    protectedRpc: constantDurations(240),
    acceptance: constantDurations(800),
    queueFirstAttempt: constantDurations(42_000),
  },
  counts: {
    queueAttempts: 1_000,
    dlqMessages: 0,
    errorCount: 0,
  },
  completeness: {
    pageCount: 2,
    eventsRead: 1_200,
    providerEventCount: 1_200,
    apiEvidenceGroups: 300,
    complete: true,
  },
  createdAt: '2026-09-03T12:10:00.000Z',
} as const;

export const validMeasurement = {
  criterion: 'P2-S09-AC-211',
  schemaVersion: 2,
  sourceRevision,
  environment: 'production',
  deploymentId: validDataset.deploymentId,
  queryId: validDataset.queryId,
  window: validDataset.window,
  datasetDigest: digest,
  samples: {
    commands: 300,
    protectedRpcs: 300,
    acceptances: 300,
    queueAttempts: 1_000,
    dlqMessages: 0,
    errorCount: 0,
  },
  thresholds: {
    commandP95Ms: 1_200,
    protectedRpcP95Ms: 300,
    acceptanceP99Ms: 1_000,
    queueFirstAttemptP95Ms: 60_000,
    dailyDlqRate: 0.001,
  },
  observed: {
    commandP95Ms: 900,
    protectedRpcP95Ms: 240,
    acceptanceP99Ms: 800,
    queueFirstAttemptP95Ms: 42_000,
    dailyDlqRate: 0,
  },
  completeness: validDataset.completeness,
  createdAt: validDataset.createdAt,
} as const;

export const validSlo = {
  sourceRevision,
  environment: 'production',
  deploymentId: validDataset.deploymentId,
  queryId: validDataset.queryId,
  measurementReport: {
    path: 'slo/measurement.json',
    sha256: digest,
  },
  datasetReport: {
    path: 'slo/dataset.json',
    sha256: digest,
  },
  window: validDataset.window,
  samples: validMeasurement.samples,
  thresholds: validMeasurement.thresholds,
  observed: validMeasurement.observed,
} as const;

export const validOutput = {
  dataset: validDataset,
  measurement: validMeasurement,
  slo: validSlo,
} as const;

export const event = (
  cursor: string,
  eventName: string,
  durationMs: number,
  overrides: Partial<NormalizedWorkersObservabilityEvent> = {},
): NormalizedWorkersObservabilityEvent => ({
  cursor,
  durationMs,
  environment: 'production',
  eventName,
  operation: 'cms.registry.CMS-03A-01',
  outcome: 'success',
  release: sourceRevision,
  service: 'wejammin-api',
  timestamp: '2026-09-02T12:00:00.000Z',
  ...overrides,
});
