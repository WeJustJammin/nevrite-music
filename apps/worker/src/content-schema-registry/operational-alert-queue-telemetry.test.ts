import { describe, expect, it, vi } from 'vitest';

import type { Logger } from '@wejammin/observability/logging';
import type { MigrationWorkerResult } from './migration-worker';
import { logSchemaMigrationQueueAttempt } from './operational-alert-queue-telemetry';

const result = (
  outcome: MigrationWorkerResult['outcome'],
): MigrationWorkerResult => ({ outcome }) as MigrationWorkerResult;

describe('schema migration queue telemetry', () => {
  it.each([
    ['retry', 'retry', true],
    ['failed_retryable', 'retry', true],
    ['failed_terminal', 'failure', true],
    ['completed', 'success', false],
  ] as const)(
    'maps %s without payload evidence',
    (workerOutcome, outcome, highRisk) => {
      const info = vi.fn();
      logSchemaMigrationQueueAttempt(
        { info } as unknown as Logger,
        result(workerOutcome),
        { attempts: 0, timestamp: new Date(900) },
        () => 1_000,
      );
      expect(info).toHaveBeenCalledWith(
        expect.objectContaining({
          attempt: 1,
          durationMs: 100,
          eventName: 'cms.registry.queue_attempt',
          outcome,
        }),
        { highRisk, samplingClass: 'always' },
      );
    },
  );

  it.each([undefined, new Date(Number.NaN)])(
    'uses a safe zero delay for an unavailable timestamp',
    (timestamp) => {
      const info = vi.fn();
      logSchemaMigrationQueueAttempt(
        { info } as unknown as Logger,
        result('completed'),
        { attempts: 2, ...(timestamp === undefined ? {} : { timestamp }) },
      );
      expect(info.mock.calls[0]?.[0]).toMatchObject({
        attempt: 2,
        durationMs: 0,
      });
    },
  );
});
