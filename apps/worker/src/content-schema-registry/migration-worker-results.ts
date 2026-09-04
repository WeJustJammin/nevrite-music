import {
  MIGRATION_RETRY_DELAYS_MS,
  SCHEMA_MIGRATION_RPC,
} from './migration-worker-constants';
import type {
  MigrationWorkerResult,
  MigrationWorkerRpcFailure,
  NormalizedInput,
  RpcCaller,
  MigrationWorkerTelemetryEvent,
} from './migration-worker-types';
import type {
  SchemaMigrationJobPayload,
  SchemaMigrationQueueEnvelope,
} from './migration-worker-input-schemas';
import { isRecord } from './migration-worker-schema-core';
import {
  deadLetterPersistenceError,
  eventFinalizationFailure,
  parsePlanResult,
  resultWith,
  retryAfter,
} from './migration-worker-validation';
import type { MigrationPlanRecord } from './migration-worker-plan-schemas';

type EventAcknowledgementRecovery = Readonly<{
  signal: AbortSignal;
  call: RpcCaller;
  deadLetter: (
    input: unknown,
    reasonCode: string,
    signal: AbortSignal,
  ) => Promise<void>;
}>;

const acknowledgeEventOrRecover = async (
  plan: MigrationPlanRecord,
  event: SchemaMigrationQueueEnvelope,
  attempt: number,
  now: () => number,
  emit: (event: MigrationWorkerTelemetryEvent) => Promise<void>,
  recovery: EventAcknowledgementRecovery,
): Promise<MigrationWorkerResult | null> => {
  const acknowledgement = await recovery.call(
    SCHEMA_MIGRATION_RPC.acknowledgeEvent,
    { eventId: event.eventId, outcome: 'failure' },
    recovery.signal,
  );
  const failure = !acknowledgement.ok
    ? acknowledgement.failure
    : eventFinalizationFailure(acknowledgement.value);
  if (failure === null) return null;

  const resultDetails = {
    ...resultPlanMetadata(plan, event),
    reasonCode: failure.code,
  } satisfies Partial<MigrationWorkerResult>;
  if (failure.retryable) {
    await emit({
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
      durationMs: Math.max(0, now() - Date.parse(event.occurredAt)),
    });
    return resultWith('retry', {
      ...resultDetails,
      retryAfterMs: retryAfter(attempt),
    });
  }

  await recovery.deadLetter(event, failure.code, recovery.signal);
  await emit({
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
    durationMs: Math.max(0, now() - Date.parse(event.occurredAt)),
  });
  return resultWith('dead_letter', resultDetails);
};

export type BatchRunResult = Readonly<{
  outcome: 'progress' | 'retry' | 'failure';
  done: boolean;
  version: string;
  cursor: string;
  progress: number;
  sourceCount: string;
  targetCount: string;
  rowErrorCount: string;
  migratedCount: string;
  failedCount: string;
  reasonCode: string | null;
}>;
export const inputFromNormalized = (normalized: NormalizedInput): unknown =>
  normalized.event ?? normalized.job;
export const leaseRequest = (
  plan: MigrationPlanRecord,
  job: SchemaMigrationJobPayload,
  workerId: string,
  leaseDurationMs: number,
  nowMs: number,
): Readonly<Record<string, unknown>> => ({
  migrationPlanId: plan.id,
  schemaVersionId: job.schemaVersionId,
  expectedVersion: plan.version,
  cursor: plan.cursor,
  leaseOwner: workerId,
  workerId,
  leaseDurationMs,
  now: new Date(nowMs).toISOString(),
  transformKey: plan.transformKey,
  transformVersion: plan.transformVersion,
  compilerHash: plan.compilerHash,
  sourceHash: plan.sourceHash,
  targetHash: plan.targetHash,
});
export const verificationRequest = (
  plan: MigrationPlanRecord,
  job: SchemaMigrationJobPayload,
  leaseToken: string | null,
): Readonly<Record<string, unknown>> => ({
  migrationPlanId: plan.id,
  schemaVersionId: job.schemaVersionId,
  expectedVersion: plan.version,
  cursor: plan.cursor,
  leaseToken,
  sourceCount: plan.sourceCount,
  targetCount: plan.targetCount,
  rowErrorCount: plan.rowErrorCount,
  migratedCount: plan.migratedCount,
  failedCount: plan.failedCount,
  transformKey: plan.transformKey,
  transformVersion: plan.transformVersion,
  compilerHash: plan.compilerHash,
  sourceHash: plan.sourceHash,
  targetHash: plan.targetHash,
});
export const resultPlanMetadata = (
  plan: MigrationPlanRecord,
  event: SchemaMigrationQueueEnvelope | null,
): Partial<MigrationWorkerResult> => ({
  migrationPlanId: plan.id,
  schemaVersionId: plan.toVersionId,
  eventId: event?.eventId ?? null,
  state: plan.state,
  cursor: plan.cursor,
  progress: plan.progress,
});

export const completedResult = async (
  plan: MigrationPlanRecord,
  event: SchemaMigrationQueueEnvelope | null,
  activationSwitched: boolean,
  attempt: number,
  now: () => number,
  emit: (event: MigrationWorkerTelemetryEvent) => Promise<void>,
): Promise<MigrationWorkerResult> => {
  await emit({
    operation: 'migration.recovery',
    outcome: 'success',
    migrationPlanId: plan.id,
    schemaVersionId: plan.toVersionId,
    eventId: event?.eventId ?? null,
    correlationId: event?.correlationId ?? null,
    cursor: plan.cursor,
    progress: plan.progress,
    attempt,
    retryable: false,
    reasonCode: null,
    durationMs:
      event === null ? 0 : Math.max(0, now() - Date.parse(event.occurredAt)),
  });
  return resultWith('completed', {
    ...resultPlanMetadata(plan, event),
    activationSwitched,
  });
};

export const workerResultFromBatch = async (
  plan: MigrationPlanRecord,
  event: SchemaMigrationQueueEnvelope | null,
  batch: BatchRunResult,
  attempt: number,
  now: () => number,
  emit: (event: MigrationWorkerTelemetryEvent) => Promise<void>,
): Promise<MigrationWorkerResult> => {
  const progressed = resultWith('progress', {
    migrationPlanId: plan.id,
    schemaVersionId: plan.toVersionId,
    eventId: event?.eventId ?? null,
    state: plan.state,
    cursor: batch.cursor,
    progress: batch.progress,
    retryAfterMs: MIGRATION_RETRY_DELAYS_MS[0],
    reasonCode: null,
  });
  await emit({
    operation: 'migration.batch',
    outcome: 'progress',
    migrationPlanId: plan.id,
    schemaVersionId: plan.toVersionId,
    eventId: event?.eventId ?? null,
    correlationId: event?.correlationId ?? null,
    cursor: batch.cursor,
    progress: batch.progress,
    attempt,
    retryable: true,
    reasonCode: null,
    durationMs:
      event === null ? 0 : Math.max(0, now() - Date.parse(event.occurredAt)),
  });
  return progressed;
};

export const leaseRetry = async (
  plan: MigrationPlanRecord,
  event: SchemaMigrationQueueEnvelope | null,
  reasonCode: string,
  attempt: number,
  now: () => number,
  emit: (event: MigrationWorkerTelemetryEvent) => Promise<void>,
): Promise<MigrationWorkerResult> => {
  const result = resultWith('retry', {
    migrationPlanId: plan.id,
    schemaVersionId: plan.toVersionId,
    eventId: event?.eventId ?? null,
    state: plan.state,
    cursor: plan.cursor,
    progress: plan.progress,
    retryAfterMs: retryAfter(attempt),
    reasonCode,
  });
  await emit({
    operation: 'migration.recovery',
    outcome: 'retry',
    migrationPlanId: plan.id,
    schemaVersionId: plan.toVersionId,
    eventId: event?.eventId ?? null,
    correlationId: event?.correlationId ?? null,
    cursor: plan.cursor,
    progress: plan.progress,
    attempt,
    retryable: true,
    reasonCode,
    durationMs: 0,
  });
  return result;
};

export const failureResult = async (
  plan: MigrationPlanRecord,
  event: SchemaMigrationQueueEnvelope | null,
  failure: MigrationWorkerRpcFailure,
  attempt: number,
  now: () => number,
  emit: (event: MigrationWorkerTelemetryEvent) => Promise<void>,
  recovery?: EventAcknowledgementRecovery,
): Promise<MigrationWorkerResult> => {
  if (!failure.retryable && event !== null) {
    if (recovery === undefined)
      throw deadLetterPersistenceError('ACK_RECOVERY_UNAVAILABLE');
    const acknowledgementRecovery = await acknowledgeEventOrRecover(
      plan,
      event,
      attempt,
      now,
      emit,
      recovery,
    );
    if (acknowledgementRecovery !== null) return acknowledgementRecovery;
  }
  const outcome = failure.retryable ? 'retry' : 'failed_terminal';
  const result = resultWith(outcome, {
    ...resultPlanMetadata(plan, event),
    retryAfterMs: failure.retryable ? retryAfter(attempt) : null,
    reasonCode: failure.code,
  });
  await emit({
    operation: 'migration.recovery',
    outcome: failure.retryable ? 'retry' : 'failure',
    migrationPlanId: plan.id,
    schemaVersionId: plan.toVersionId,
    eventId: event?.eventId ?? null,
    correlationId: event?.correlationId ?? null,
    cursor: plan.cursor,
    progress: plan.progress,
    attempt,
    retryable: failure.retryable,
    reasonCode: failure.code,
    durationMs:
      event === null ? 0 : Math.max(0, now() - Date.parse(event.occurredAt)),
  });
  return result;
};

export const failAndRollback = async (
  plan: MigrationPlanRecord,
  event: SchemaMigrationQueueEnvelope | null,
  job: SchemaMigrationJobPayload,
  leaseToken: string | null,
  reasonCode: string,
  retryable: boolean,
  attempt: number,
  signal: AbortSignal,
  now: () => number,
  emit: (event: MigrationWorkerTelemetryEvent) => Promise<void>,
  call: RpcCaller,
  recovery?: EventAcknowledgementRecovery,
): Promise<MigrationWorkerResult> => {
  const rollback = await call(
    SCHEMA_MIGRATION_RPC.rollback,
    {
      migrationPlanId: plan.id,
      schemaVersionId: job.schemaVersionId,
      expectedVersion: plan.version,
      cursor: plan.cursor,
      leaseToken,
      reasonCode,
      retryable,
      fallbackVersionId: plan.fromVersionId,
      preserveOldActive: true,
      deleteRows: false,
      transformKey: plan.transformKey,
      transformVersion: plan.transformVersion,
      compilerHash: plan.compilerHash,
      sourceHash: plan.sourceHash,
      targetHash: plan.targetHash,
    },
    signal,
  );
  if (!rollback.ok)
    return failureResult(
      plan,
      event,
      rollback.failure,
      attempt,
      now,
      emit,
      recovery,
    );
  let rolledBackPlan = plan;
  if (isRecord(rollback.value) && 'plan' in rollback.value) {
    try {
      rolledBackPlan = parsePlanResult(rollback.value);
    } catch {
      // The rollback result is advisory; the durable failure outcome is still
      // represented by the worker result and can be reconciled on replay.
    }
  }
  const result = resultWith(
    retryable ? 'failed_retryable' : 'failed_terminal',
    {
      ...resultPlanMetadata(rolledBackPlan, event),
      retryAfterMs: retryable ? retryAfter(attempt) : null,
      reasonCode,
    },
  );
  if (!retryable && event !== null) {
    if (recovery === undefined)
      throw deadLetterPersistenceError('ACK_RECOVERY_UNAVAILABLE');
    const acknowledgementRecovery = await acknowledgeEventOrRecover(
      rolledBackPlan,
      event,
      attempt,
      now,
      emit,
      recovery,
    );
    if (acknowledgementRecovery !== null) return acknowledgementRecovery;
  }
  await emit({
    operation: 'migration.recovery',
    outcome: retryable ? 'retry' : 'failure',
    migrationPlanId: plan.id,
    schemaVersionId: plan.toVersionId,
    eventId: event?.eventId ?? null,
    correlationId: event?.correlationId ?? job.correlationId,
    cursor: plan.cursor,
    progress: plan.progress,
    attempt,
    retryable,
    reasonCode,
    durationMs: 0,
  });
  return result;
};
