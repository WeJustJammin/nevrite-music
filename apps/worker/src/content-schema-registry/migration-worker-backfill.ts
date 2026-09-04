import { SCHEMA_MIGRATION_RPC } from './migration-worker-constants';
import { runMigrationBatches } from './migration-worker-batches';
import type {
  MigrationExecutionInput,
  MigrationStageResult,
} from './migration-worker-stage-types';
import {
  errorCode,
  parsePlanResult,
  readAcquired,
} from './migration-worker-validation';
import {
  failAndRollback,
  failureResult,
  leaseRequest,
  leaseRetry,
  workerResultFromBatch,
} from './migration-worker-results';

export const runBackfillStage = async (
  input: MigrationExecutionInput,
): Promise<MigrationStageResult> => {
  const { runtime, plan, event, job, signal, attempt } = input;
  let current = plan;
  let leaseToken = input.leaseToken;
  if (
    current.state === 'ready' ||
    current.state === 'running' ||
    current.state === 'failed_retryable'
  ) {
    if (leaseToken === null) {
      const claimed = await runtime.call(
        SCHEMA_MIGRATION_RPC.claimLease,
        leaseRequest(
          current,
          job,
          runtime.workerId,
          runtime.leaseDurationMs,
          runtime.now(),
        ),
        signal,
      );
      if (!claimed.ok)
        return failureResult(
          current,
          event,
          claimed.failure,
          attempt,
          runtime.now,
          runtime.emit,
          { signal, call: runtime.call, deadLetter: runtime.deadLetter },
        );
      try {
        const acquired = readAcquired(claimed.value);
        if (!acquired.acquired)
          return leaseRetry(
            current,
            event,
            acquired.reasonCode,
            attempt,
            runtime.now,
            runtime.emit,
          );
        leaseToken = acquired.leaseToken;
        current = acquired.plan ?? current;
      } catch (error) {
        return failureResult(
          current,
          event,
          {
            code: errorCode(error, 'DEPENDENCY_INVALID_RESPONSE'),
            retryable: false,
          },
          attempt,
          runtime.now,
          runtime.emit,
          { signal, call: runtime.call, deadLetter: runtime.deadLetter },
        );
      }
    }
    const backfill = await runMigrationBatches(
      runtime,
      current,
      event,
      job,
      leaseToken,
      false,
      signal,
      attempt,
      runtime.maxBatches,
    );
    if (backfill.outcome === 'retry')
      return failureResult(
        current,
        event,
        {
          code: backfill.reasonCode ?? 'MIGRATION_RETRY',
          retryable: true,
        },
        attempt,
        runtime.now,
        runtime.emit,
        { signal, call: runtime.call, deadLetter: runtime.deadLetter },
      );
    if (backfill.outcome === 'failure')
      return failAndRollback(
        current,
        event,
        job,
        leaseToken,
        backfill.reasonCode ?? 'MIGRATION_FAILED',
        false,
        attempt,
        signal,
        runtime.now,
        runtime.emit,
        runtime.call,
        { signal, call: runtime.call, deadLetter: runtime.deadLetter },
      );
    if (backfill.done !== true)
      return workerResultFromBatch(
        current,
        event,
        backfill,
        attempt,
        runtime.now,
        runtime.emit,
      );
    const verifying = await runtime.call(
      SCHEMA_MIGRATION_RPC.beginVerification,
      {
        migrationPlanId: current.id,
        expectedVersion: backfill.version,
        cursor: backfill.cursor,
        sourceCount: backfill.sourceCount,
        targetCount: backfill.targetCount,
        rowErrorCount: backfill.rowErrorCount,
        migratedCount: backfill.migratedCount,
        failedCount: backfill.failedCount,
        transformKey: current.transformKey,
        transformVersion: current.transformVersion,
        compilerHash: current.compilerHash,
        sourceHash: current.sourceHash,
        targetHash: current.targetHash,
      },
      signal,
    );
    if (!verifying.ok)
      return failureResult(
        current,
        event,
        verifying.failure,
        attempt,
        runtime.now,
        runtime.emit,
        { signal, call: runtime.call, deadLetter: runtime.deadLetter },
      );
    try {
      current = parsePlanResult(verifying.value);
    } catch (error) {
      return failureResult(
        current,
        event,
        {
          code: errorCode(error, 'DEPENDENCY_INVALID_RESPONSE'),
          retryable: false,
        },
        attempt,
        runtime.now,
        runtime.emit,
        { signal, call: runtime.call, deadLetter: runtime.deadLetter },
      );
    }
  }
  return { plan: current, leaseToken };
};
