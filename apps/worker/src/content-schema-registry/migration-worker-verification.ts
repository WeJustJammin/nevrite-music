import { SCHEMA_MIGRATION_RPC } from './migration-worker-constants';
import type { MigrationExecutionInput } from './migration-worker-stage-types';
import type { MigrationWorkerResult } from './migration-worker-types';
import {
  completedResult,
  failAndRollback,
  failureResult,
  verificationRequest,
} from './migration-worker-results';
import { isRecord, isSafeToken } from './migration-worker-schema-core';
import {
  errorCode,
  eventFinalizationFailure,
  parsePlanResult,
  resultStatus,
  resultWith,
  retryAfter,
} from './migration-worker-validation';

type AcknowledgementRecoveryInput = Readonly<{
  runtime: MigrationExecutionInput['runtime'];
  plan: MigrationExecutionInput['plan'];
  event: NonNullable<MigrationExecutionInput['event']>;
  signal: AbortSignal;
  attempt: number;
  startedAt: number;
  outcome: 'success';
}>;

const acknowledgeEventOrRecover = async ({
  runtime,
  plan,
  event,
  signal,
  attempt,
  startedAt,
  outcome,
}: AcknowledgementRecoveryInput): Promise<MigrationWorkerResult | null> => {
  const acknowledgement = await runtime.call(
    SCHEMA_MIGRATION_RPC.acknowledgeEvent,
    { eventId: event.eventId, outcome },
    signal,
  );
  const failure = !acknowledgement.ok
    ? acknowledgement.failure
    : eventFinalizationFailure(acknowledgement.value);
  if (failure === null) return null;

  const resultDetails = {
    migrationPlanId: plan.id,
    schemaVersionId: plan.toVersionId,
    eventId: event.eventId,
    state: plan.state,
    cursor: plan.cursor,
    progress: plan.progress,
    reasonCode: failure.code,
  } satisfies Partial<MigrationWorkerResult>;
  if (failure.retryable) {
    await runtime.emit({
      operation: 'migration.recovery',
      outcome: 'retry',
      migrationPlanId: plan.id,
      schemaVersionId: plan.toVersionId,
      eventId: event.eventId,
      correlationId: event.correlationId,
      cursor: plan.cursor,
      progress: plan.progress,
      attempt,
      retryable: true,
      reasonCode: failure.code,
      durationMs: Math.max(0, runtime.now() - startedAt),
    });
    return resultWith('retry', {
      ...resultDetails,
      retryAfterMs: retryAfter(attempt),
    });
  }

  await runtime.deadLetter(event, failure.code, signal);
  await runtime.emit({
    operation: 'migration.recovery',
    outcome: 'dead_letter',
    migrationPlanId: plan.id,
    schemaVersionId: plan.toVersionId,
    eventId: event.eventId,
    correlationId: event.correlationId,
    cursor: plan.cursor,
    progress: plan.progress,
    attempt,
    retryable: false,
    reasonCode: failure.code,
    durationMs: Math.max(0, runtime.now() - startedAt),
  });
  return resultWith('dead_letter', resultDetails);
};

export async function runVerificationStage(
  input: MigrationExecutionInput,
): Promise<MigrationWorkerResult> {
  const { runtime, plan, event, job, leaseToken, signal, attempt } = input;
  const startedAt = runtime.now();
  let current = plan;
  if (current.state === 'verifying') {
    const verified = await runtime.call(
      SCHEMA_MIGRATION_RPC.verify,
      verificationRequest(current, job, leaseToken),
      signal,
    );
    if (!verified.ok)
      return failureResult(
        current,
        event,
        verified.failure,
        attempt,
        runtime.now,
        runtime.emit,
        { signal, call: runtime.call, deadLetter: runtime.deadLetter },
      );
    if (!isRecord(verified.value) || typeof verified.value.valid !== 'boolean')
      return failureResult(
        current,
        event,
        { code: 'DEPENDENCY_INVALID_RESPONSE', retryable: false },
        attempt,
        runtime.now,
        runtime.emit,
        { signal, call: runtime.call, deadLetter: runtime.deadLetter },
      );
    if (!verified.value.valid)
      return failAndRollback(
        current,
        event,
        job,
        leaseToken,
        isSafeToken(verified.value.reasonCode, 64)
          ? verified.value.reasonCode
          : 'VERIFICATION_FAILED',
        false,
        attempt,
        signal,
        runtime.now,
        runtime.emit,
        runtime.call,
        { signal, call: runtime.call, deadLetter: runtime.deadLetter },
      );
    const completed = await runtime.call(
      SCHEMA_MIGRATION_RPC.complete,
      {
        migrationPlanId: current.id,
        expectedVersion: current.version,
        leaseToken,
      },
      signal,
    );
    if (!completed.ok)
      return failureResult(
        current,
        event,
        completed.failure,
        attempt,
        runtime.now,
        runtime.emit,
        { signal, call: runtime.call, deadLetter: runtime.deadLetter },
      );
    try {
      current = parsePlanResult(completed.value);
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
    const switched = await runtime.call(
      SCHEMA_MIGRATION_RPC.activate,
      {
        migrationPlanId: current.id,
        contentTypeId: current.contentTypeId,
        schemaVersionId: current.toVersionId,
        expectedVersion: current.version,
        expectedActiveVersionId: current.fromVersionId,
        transformKey: current.transformKey,
        transformVersion: current.transformVersion,
        compilerHash: current.compilerHash,
        sourceHash: current.sourceHash,
        targetHash: current.targetHash,
        idempotencyKey: `cms-migration:${current.id}`,
        switchOnlyOnce: true,
      },
      signal,
    );
    if (!switched.ok) {
      const reconciled = await runtime.call(
        SCHEMA_MIGRATION_RPC.reconcileActivation,
        {
          migrationPlanId: current.id,
          schemaVersionId: current.toVersionId,
          expectedActiveVersionId: current.fromVersionId,
          idempotencyKey: `cms-migration:${current.id}`,
        },
        signal,
      );
      if (
        reconciled.ok &&
        isRecord(reconciled.value) &&
        reconciled.value.activated === true
      ) {
        if (event !== null) {
          const acknowledgementRecovery = await acknowledgeEventOrRecover({
            runtime,
            plan: current,
            event,
            signal,
            attempt,
            startedAt,
            outcome: 'success',
          });
          if (acknowledgementRecovery !== null) return acknowledgementRecovery;
        }
        return completedResult(
          current,
          event,
          true,
          attempt,
          runtime.now,
          runtime.emit,
        );
      }
      return failAndRollback(
        current,
        event,
        job,
        leaseToken,
        switched.failure.code,
        switched.failure.retryable,
        attempt,
        signal,
        runtime.now,
        runtime.emit,
        runtime.call,
        { signal, call: runtime.call, deadLetter: runtime.deadLetter },
      );
    }
    const activationStatus = resultStatus(switched.value);
    const switchedAlready =
      activationStatus === 'already_active' || activationStatus === 'duplicate';
    if (
      isRecord(switched.value) &&
      switched.value.activated === false &&
      !switchedAlready
    )
      return failAndRollback(
        current,
        event,
        job,
        leaseToken,
        'ACTIVATION_NOT_COMMITTED',
        false,
        attempt,
        signal,
        runtime.now,
        runtime.emit,
        runtime.call,
        { signal, call: runtime.call, deadLetter: runtime.deadLetter },
      );
    if (event !== null) {
      const acknowledgementRecovery = await acknowledgeEventOrRecover({
        runtime,
        plan: current,
        event,
        signal,
        attempt,
        startedAt,
        outcome: 'success',
      });
      if (acknowledgementRecovery !== null) return acknowledgementRecovery;
    }
    return completedResult(
      current,
      event,
      !switchedAlready,
      attempt,
      runtime.now,
      runtime.emit,
    );
  }

  return resultWith('retry', {
    migrationPlanId: current.id,
    schemaVersionId: current.toVersionId,
    eventId: event?.eventId ?? null,
    state: current.state,
    cursor: current.cursor,
    progress: current.progress,
    retryAfterMs: retryAfter(attempt),
    reasonCode: 'UNEXPECTED_MIGRATION_STATE',
  });
}
