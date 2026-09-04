import { describe, expect, it, vi } from 'vitest';

import type { Logger } from '@wejammin/observability/logging';

import { productionMigrationTelemetry } from './production-worker-runtime';
import type { MigrationWorkerTelemetryEvent } from './content-schema-registry/migration-worker';

const eventFor = (
  overrides: Partial<MigrationWorkerTelemetryEvent> = {},
): MigrationWorkerTelemetryEvent => ({
  operation: 'migration.consume',
  outcome: 'success',
  migrationPlanId: null,
  schemaVersionId: null,
  eventId: null,
  correlationId: null,
  cursor: null,
  progress: null,
  attempt: 0,
  retryable: false,
  reasonCode: null,
  durationMs: 0,
  ...overrides,
});

describe('production migration telemetry', () => {
  it('maps every operation and outcome while preserving scrubbed optional fields', () => {
    const info = vi.fn();
    const telemetry = productionMigrationTelemetry({
      info,
    } as unknown as Logger);

    telemetry(eventFor());
    telemetry(
      eventFor({
        operation: 'migration.batch',
        outcome: 'progress',
        migrationPlanId: 'plan-1',
        schemaVersionId: 'version-1',
        eventId: 'event-1',
        correlationId: 'correlation-1',
        cursor: 'cursor-1',
        progress: 0.5,
        attempt: 1,
        retryable: true,
        reasonCode: 'BATCH_IN_PROGRESS',
        durationMs: 7,
      }),
    );
    telemetry(
      eventFor({ operation: 'migration.recovery', outcome: 'dead_letter' }),
    );
    telemetry(eventFor({ operation: 'migration.recovery', outcome: 'stale' }));
    telemetry(
      eventFor({ operation: 'migration.recovery', outcome: 'duplicate' }),
    );
    telemetry(
      eventFor({
        operation: 'migration.recovery',
        migrationPlanId: 'plan-only',
      }),
    );

    expect(info).toHaveBeenCalledTimes(6);
    expect(info.mock.calls[0]?.[0]).toMatchObject({
      operation: 'migration.consume',
      outcome: 'success',
      traceSteps: [
        'cms.migration.admission',
        'cms.migration.claim',
        'cms.migration.plan',
      ],
      metrics: {
        'cms.migration.retries.total': 0,
        'cms.migration.dlq.total': 0,
      },
    });
    expect(info.mock.calls[1]?.[0]).toMatchObject({
      operation: 'migration.batch',
      outcome: 'retry',
      jobId: 'event-1',
      traceId: 'correlation-1',
      entityVersion: 'cursor-1',
      attempt: 1,
      errorCode: 'BATCH_IN_PROGRESS',
      traceSteps: [
        'cms.migration.lease',
        'cms.migration.batch',
        'cms.migration.cursor',
      ],
      metrics: {
        'cms.migration.retries.total': 1,
        'cms.migration.dlq.total': 0,
      },
    });
    expect(info.mock.calls[2]?.[0]).toMatchObject({
      operation: 'migration.recovery',
      outcome: 'failure',
      metrics: { 'cms.migration.dlq.total': 1 },
    });
    expect(info.mock.calls[3]?.[0]).toMatchObject({
      operation: 'migration.recovery',
      outcome: 'rejected',
    });
    expect(info.mock.calls[4]?.[0]).toMatchObject({
      operation: 'migration.recovery',
      outcome: 'rejected',
    });
  });
});
