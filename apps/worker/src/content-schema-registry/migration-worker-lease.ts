import { SCHEMA_MIGRATION_RPC } from './migration-worker-constants';
import type {
  SchemaMigrationJobPayload,
  SchemaMigrationQueueEnvelope,
} from './migration-worker-input-schemas';
import type { MigrationPlanRecord } from './migration-worker-plan-schemas';
import type { MigrationWorkerResult } from './migration-worker-types';
import type { MigrationWorkerRuntime } from './migration-worker-runtime';
import { errorCode, readAcquired } from './migration-worker-validation';
import {
  failureResult,
  leaseRequest,
  leaseRetry,
} from './migration-worker-results';

export type MigrationLeaseResult =
  | Readonly<{ kind: 'result'; result: MigrationWorkerResult }>
  | Readonly<{
      kind: 'acquired';
      plan: MigrationPlanRecord;
      leaseToken: string;
    }>;

export const acquireMigrationLease = async (
  runtime: MigrationWorkerRuntime,
  plan: MigrationPlanRecord,
  event: SchemaMigrationQueueEnvelope | null,
  job: SchemaMigrationJobPayload,
  signal: AbortSignal,
  attempt: number,
): Promise<MigrationLeaseResult> => {
  const transition = await runtime.call(
    SCHEMA_MIGRATION_RPC.claimLease,
    leaseRequest(
      plan,
      job,
      runtime.workerId,
      runtime.leaseDurationMs,
      runtime.now(),
    ),
    signal,
  );
  if (!transition.ok)
    return {
      kind: 'result',
      result: await failureResult(
        plan,
        event,
        transition.failure,
        attempt,
        runtime.now,
        runtime.emit,
        {
          signal,
          call: runtime.call,
          deadLetter: runtime.deadLetter,
        },
      ),
    };
  try {
    const acquired = readAcquired(transition.value);
    if (!acquired.acquired)
      return {
        kind: 'result',
        result: await leaseRetry(
          plan,
          event,
          acquired.reasonCode,
          attempt,
          runtime.now,
          runtime.emit,
        ),
      };
    return {
      kind: 'acquired',
      leaseToken: acquired.leaseToken,
      plan: acquired.plan ?? plan,
    };
  } catch (error) {
    return {
      kind: 'result',
      result: await failureResult(
        plan,
        event,
        {
          code: errorCode(error, 'DEPENDENCY_INVALID_RESPONSE'),
          retryable: false,
        },
        attempt,
        runtime.now,
        runtime.emit,
        {
          signal,
          call: runtime.call,
          deadLetter: runtime.deadLetter,
        },
      ),
    };
  }
};
