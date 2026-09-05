import type { Logger } from '@wejammin/observability/logging';

import type { PlatformJobsMessage } from '../async-entrypoint';
import type { MigrationWorkerResult } from './migration-worker';

export const logSchemaMigrationQueueAttempt = (
  logger: Logger,
  result: MigrationWorkerResult,
  message: Pick<PlatformJobsMessage, 'attempts' | 'timestamp'>,
  now: () => number = Date.now,
): void => {
  const retryable =
    result.outcome === 'retry' || result.outcome === 'failed_retryable';
  const failed = result.outcome === 'failed_terminal';
  const sentAt = message.timestamp?.getTime();
  logger.info(
    {
      eventName: 'cms.registry.queue_attempt',
      operation: 'migration.consume',
      outcome: retryable ? 'retry' : failed ? 'failure' : 'success',
      attempt: Math.max(1, message.attempts),
      durationMs:
        sentAt === undefined || !Number.isFinite(sentAt)
          ? 0
          : Math.max(0, now() - sentAt),
      retryable,
    },
    {
      highRisk: retryable || failed,
      samplingClass: 'always',
    },
  );
};
