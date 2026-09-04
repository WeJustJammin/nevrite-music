import { SCHEMA_MIGRATION_RPC } from './migration-worker-constants';
import type {
  SchemaMigrationQueueEnvelope,
  SchemaMigrationJobPayload,
} from './migration-worker-input-schemas';
import type { MigrationPlanRecord } from './migration-worker-plan-schemas';
import type { MigrationWorkerRuntime } from './migration-worker-runtime';
import type {
  MigrationWorkerResult,
  NormalizedInput,
} from './migration-worker-types';
import {
  errorCode,
  eventClaimStatus,
  eventFinalizationFailure,
  eventReleaseFailure,
  parsePlanResult,
  resultWith,
  retryAfter,
} from './migration-worker-validation';
import { inputFromNormalized } from './migration-worker-results';

export type MigrationAdmission =
  | MigrationWorkerResult
  | Readonly<{
      plan: MigrationPlanRecord;
      event: SchemaMigrationQueueEnvelope | null;
      job: SchemaMigrationJobPayload;
    }>;

type AcknowledgementRecoveryInput = Readonly<{
  runtime: MigrationWorkerRuntime;
  event: SchemaMigrationQueueEnvelope;
  input: unknown;
  signal: AbortSignal;
  attempt: number;
  migrationPlanId: string | null;
  schemaVersionId: string | null;
  state: MigrationWorkerResult['state'];
  cursor: string | null;
  progress: number | null;
  correlationId: string | null;
  startedAt: number;
  outcome: 'ignored' | 'success' | 'failure';
}>;

const acknowledgeEventOrRecover = async ({
  runtime,
  event,
  input,
  signal,
  attempt,
  migrationPlanId,
  schemaVersionId,
  state,
  cursor,
  progress,
  correlationId,
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
    migrationPlanId,
    schemaVersionId,
    eventId: event.eventId,
    state,
    cursor,
    progress,
    reasonCode: failure.code,
  } satisfies Partial<MigrationWorkerResult>;
  if (failure.retryable) {
    await runtime.emit({
      operation: 'migration.consume',
      outcome: 'retry',
      migrationPlanId,
      schemaVersionId,
      eventId: event.eventId,
      correlationId,
      cursor,
      progress,
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

  await runtime.deadLetter(input, failure.code, signal);
  await runtime.emit({
    operation: 'migration.consume',
    outcome: 'dead_letter',
    migrationPlanId,
    schemaVersionId,
    eventId: event.eventId,
    correlationId,
    cursor,
    progress,
    attempt,
    retryable: false,
    reasonCode: failure.code,
    durationMs: Math.max(0, runtime.now() - startedAt),
  });
  return resultWith('dead_letter', resultDetails);
};

const releaseBlockedClaim = async (
  runtime: MigrationWorkerRuntime,
  event: SchemaMigrationQueueEnvelope,
  plan: MigrationPlanRecord,
  signal: AbortSignal,
  attempt: number,
  startedAt: number,
): Promise<MigrationWorkerResult | null> => {
  const released = await runtime.releaseEventClaim(signal);
  const failure = released.ok
    ? eventReleaseFailure(released.value)
    : released.failure;
  if (failure === null) {
    runtime.markEventClaimReleased();
    return null;
  }
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
    migrationPlanId: plan.id,
    schemaVersionId: plan.toVersionId,
    eventId: event.eventId,
    state: plan.state,
    cursor: plan.cursor,
    progress: plan.progress,
    retryAfterMs: retryAfter(attempt),
    reasonCode: failure.code,
  });
};

export const admitMigrationInput = async (
  runtime: MigrationWorkerRuntime,
  normalized: NormalizedInput,
  signal: AbortSignal,
  attempt: number,
  replay: boolean,
): Promise<MigrationAdmission> => {
  const startedAt = runtime.now();
  const event = normalized.event;
  const job = normalized.job;
  if (event !== null) {
    const claim = await runtime.call(
      SCHEMA_MIGRATION_RPC.claimEvent,
      {
        eventId: event.eventId,
        aggregateId: event.aggregateId,
        aggregateVersion: event.aggregateVersion,
        migrationPlanId: job?.migrationPlanId ?? null,
        replay,
      },
      signal,
    );
    if (!claim.ok) {
      const retry = resultWith('retry', {
        migrationPlanId: job?.migrationPlanId ?? null,
        schemaVersionId: job?.schemaVersionId ?? event.payload.schemaVersionId,
        eventId: event.eventId,
        retryAfterMs: retryAfter(attempt),
        reasonCode: claim.failure.code,
      });
      await runtime.emit({
        operation: 'migration.consume',
        outcome: 'retry',
        migrationPlanId: job?.migrationPlanId ?? null,
        schemaVersionId: job?.schemaVersionId ?? event.payload.schemaVersionId,
        eventId: event.eventId,
        correlationId: event.correlationId,
        cursor: null,
        progress: null,
        attempt,
        retryable: true,
        reasonCode: claim.failure.code,
        durationMs: Math.max(0, runtime.now() - startedAt),
      });
      return retry;
    }
    let status: ReturnType<typeof eventClaimStatus>;
    try {
      status = eventClaimStatus(claim.value);
    } catch (error) {
      const reason = errorCode(error, 'DEPENDENCY_INVALID_RESPONSE');
      return resultWith('retry', {
        migrationPlanId: job?.migrationPlanId ?? null,
        schemaVersionId: job?.schemaVersionId ?? event.payload.schemaVersionId,
        eventId: event.eventId,
        retryAfterMs: retryAfter(attempt),
        reasonCode: reason,
      });
    }
    if (status === 'in_progress')
      return resultWith('retry', {
        migrationPlanId: job?.migrationPlanId ?? null,
        schemaVersionId: job?.schemaVersionId ?? event.payload.schemaVersionId,
        eventId: event.eventId,
        retryAfterMs: retryAfter(attempt),
        reasonCode: 'EVENT_IN_PROGRESS',
      });
    if (status === 'duplicate')
      return resultWith('duplicate', {
        migrationPlanId: job?.migrationPlanId ?? null,
        schemaVersionId: job?.schemaVersionId ?? event.payload.schemaVersionId,
        eventId: event.eventId,
        reasonCode: 'EVENT_DUPLICATE',
      });
    if (status === 'stale')
      return resultWith('stale', {
        migrationPlanId: job?.migrationPlanId ?? null,
        schemaVersionId: job?.schemaVersionId ?? event.payload.schemaVersionId,
        eventId: event.eventId,
        reasonCode: 'EVENT_OUT_OF_ORDER',
      });
    runtime.markEventClaimAcquired();
  }

  if (job === null) {
    const ignored = resultWith('completed', {
      eventId: event?.eventId ?? null,
      schemaVersionId: event?.payload.schemaVersionId ?? null,
      state: 'completed',
    });
    if (event !== null) {
      const acknowledgementRecovery = await acknowledgeEventOrRecover({
        runtime,
        event,
        input: inputFromNormalized(normalized),
        signal,
        attempt,
        migrationPlanId: null,
        schemaVersionId: event.payload.schemaVersionId,
        state: 'completed',
        cursor: null,
        progress: null,
        correlationId: event.correlationId,
        startedAt,
        outcome: 'ignored',
      });
      if (acknowledgementRecovery !== null) return acknowledgementRecovery;
    }
    await runtime.emit({
      operation: 'migration.consume',
      outcome: 'success',
      migrationPlanId: null,
      schemaVersionId: event?.payload.schemaVersionId ?? null,
      eventId: event?.eventId ?? null,
      correlationId: event?.correlationId ?? null,
      cursor: null,
      progress: null,
      attempt,
      retryable: false,
      reasonCode: 'NO_MIGRATION_REQUIRED',
      durationMs: Math.max(0, runtime.now() - startedAt),
    });
    return ignored;
  }

  const read = await runtime.call(
    SCHEMA_MIGRATION_RPC.readPlan,
    {
      migrationPlanId: job.migrationPlanId,
      schemaVersionId: job.schemaVersionId,
      expectedVersion: job.expectedVersion,
    },
    signal,
  );
  if (!read.ok) {
    const retry = resultWith('retry', {
      migrationPlanId: job.migrationPlanId,
      schemaVersionId: job.schemaVersionId,
      eventId: event?.eventId ?? null,
      retryAfterMs: retryAfter(attempt),
      reasonCode: read.failure.code,
    });
    await runtime.emit({
      operation: 'migration.consume',
      outcome: 'retry',
      migrationPlanId: job.migrationPlanId,
      schemaVersionId: job.schemaVersionId,
      eventId: event?.eventId ?? null,
      correlationId: event?.correlationId ?? job.correlationId,
      cursor: null,
      progress: null,
      attempt,
      retryable: read.failure.retryable,
      reasonCode: read.failure.code,
      durationMs: Math.max(0, runtime.now() - startedAt),
    });
    return retry;
  }

  let plan: MigrationPlanRecord;
  try {
    plan = parsePlanResult(read.value);
  } catch (error) {
    const reason = errorCode(error, 'DEPENDENCY_INVALID_RESPONSE');
    await runtime.deadLetter(inputFromNormalized(normalized), reason, signal);
    return resultWith('dead_letter', {
      migrationPlanId: job.migrationPlanId,
      schemaVersionId: job.schemaVersionId,
      eventId: event?.eventId ?? null,
      reasonCode: reason,
    });
  }
  if (
    plan.id !== job.migrationPlanId ||
    plan.toVersionId !== job.schemaVersionId
  ) {
    const stale = resultWith('stale', {
      migrationPlanId: job.migrationPlanId,
      schemaVersionId: job.schemaVersionId,
      eventId: event?.eventId ?? null,
      state: plan.state,
      reasonCode: 'PLAN_TARGET_MISMATCH',
    });
    if (event !== null) {
      const acknowledgementRecovery = await acknowledgeEventOrRecover({
        runtime,
        event,
        input: inputFromNormalized(normalized),
        signal,
        attempt,
        migrationPlanId: plan.id,
        schemaVersionId: plan.toVersionId,
        state: plan.state,
        cursor: plan.cursor,
        progress: plan.progress,
        correlationId: event.correlationId,
        startedAt,
        outcome: 'failure',
      });
      if (acknowledgementRecovery !== null) return acknowledgementRecovery;
    }
    return stale;
  }
  if (plan.version !== job.expectedVersion && plan.state !== 'completed') {
    const stale = resultWith('stale', {
      migrationPlanId: job.migrationPlanId,
      schemaVersionId: job.schemaVersionId,
      eventId: event?.eventId ?? null,
      state: plan.state,
      cursor: plan.cursor,
      progress: plan.progress,
      reasonCode: 'PLAN_VERSION_MISMATCH',
    });
    if (event !== null) {
      const acknowledgementRecovery = await acknowledgeEventOrRecover({
        runtime,
        event,
        input: inputFromNormalized(normalized),
        signal,
        attempt,
        migrationPlanId: plan.id,
        schemaVersionId: plan.toVersionId,
        state: plan.state,
        cursor: plan.cursor,
        progress: plan.progress,
        correlationId: event.correlationId,
        startedAt,
        outcome: 'failure',
      });
      if (acknowledgementRecovery !== null) return acknowledgementRecovery;
    }
    return stale;
  }
  if (plan.state === 'completed') {
    const completed = resultWith('completed', {
      migrationPlanId: plan.id,
      schemaVersionId: plan.toVersionId,
      eventId: event?.eventId ?? null,
      state: plan.state,
      cursor: plan.cursor,
      progress: plan.progress,
    });
    if (event !== null) {
      const acknowledgementRecovery = await acknowledgeEventOrRecover({
        runtime,
        event,
        input: inputFromNormalized(normalized),
        signal,
        attempt,
        migrationPlanId: plan.id,
        schemaVersionId: plan.toVersionId,
        state: plan.state,
        cursor: plan.cursor,
        progress: plan.progress,
        correlationId: event.correlationId,
        startedAt,
        outcome: 'success',
      });
      if (acknowledgementRecovery !== null) return acknowledgementRecovery;
    }
    await runtime.emit({
      operation: 'migration.consume',
      outcome: 'success',
      migrationPlanId: plan.id,
      schemaVersionId: plan.toVersionId,
      eventId: event?.eventId ?? null,
      correlationId: event?.correlationId ?? job.correlationId,
      cursor: plan.cursor,
      progress: plan.progress,
      attempt,
      retryable: false,
      reasonCode: null,
      durationMs: Math.max(0, runtime.now() - startedAt),
    });
    return completed;
  }
  if (plan.state === 'failed_terminal') {
    if (event !== null) {
      const acknowledgementRecovery = await acknowledgeEventOrRecover({
        runtime,
        event,
        input: inputFromNormalized(normalized),
        signal,
        attempt,
        migrationPlanId: plan.id,
        schemaVersionId: plan.toVersionId,
        state: plan.state,
        cursor: plan.cursor,
        progress: plan.progress,
        correlationId: event.correlationId,
        startedAt,
        outcome: 'failure',
      });
      if (acknowledgementRecovery !== null) return acknowledgementRecovery;
    }
    return resultWith('failed_terminal', {
      migrationPlanId: plan.id,
      schemaVersionId: plan.toVersionId,
      eventId: event?.eventId ?? null,
      state: plan.state,
      cursor: plan.cursor,
      progress: plan.progress,
      reasonCode: 'MIGRATION_TERMINAL',
    });
  }
  if (plan.state === 'blocked') {
    const blocked = resultWith('blocked', {
      migrationPlanId: plan.id,
      schemaVersionId: plan.toVersionId,
      eventId: event?.eventId ?? null,
      state: plan.state,
      cursor: plan.cursor,
      progress: plan.progress,
      reasonCode: 'MIGRATION_BLOCKED',
    });
    if (event !== null) {
      const releaseFailure = await releaseBlockedClaim(
        runtime,
        event,
        plan,
        signal,
        attempt,
        startedAt,
      );
      if (releaseFailure !== null) return releaseFailure;
    }
    return blocked;
  }
  return { plan, event, job };
};
