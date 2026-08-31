import {
  PositiveBigintDecimalSchema,
  QuotedVersionSchema,
} from '@wejammin/contracts';

import { acceptJobWithOutbox } from './acceptance.ts';
import { decideJobLease } from './dispatch.ts';
import { canRunExternalEffect } from './restore.ts';
import { evaluateJobTransition } from './transition.ts';
import type { JobLeaseInput } from './types.ts';
import type {
  AtomicAcceptanceWrite,
  JobAcceptanceRuntimeDecision,
  JobAcceptanceRuntimeInput,
  JobHeartbeatRequest,
  JobOutcomeRequest,
  JobOutcomeRuntimeDecision,
  JobPersistencePort,
  OutboxClaimRequest,
  OutboxCompleteRequest,
  ProcessedEventRequest,
  ProcessedEventRuntimeDecision,
} from './runtime-types.ts';

const UuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UuidPattern.test(value);

const isFiniteTime = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const isPositiveLease = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const isPositiveVersion = (value: unknown): value is string =>
  typeof value === 'string' &&
  PositiveBigintDecimalSchema.safeParse(value).success;

const isQuotedVersion = (value: unknown): value is string =>
  typeof value === 'string' && QuotedVersionSchema.safeParse(value).success;

export const acceptJobAtomically = async (
  input: JobAcceptanceRuntimeInput,
): Promise<JobAcceptanceRuntimeDecision> => {
  const decision = acceptJobWithOutbox(input);
  if (decision.kind !== 'commit') return decision;
  const write: AtomicAcceptanceWrite = {
    event: decision.event,
    job: decision.job,
    operation: input.operation,
    requestHash: input.requestHash,
  };
  await input.persistence.transaction((transaction) =>
    transaction.acceptJobWithOutbox(write),
  );
  return decision;
};

const validOutboxClaim = (input: OutboxClaimRequest): boolean =>
  isUuid(input.outboxId) &&
  isUuid(input.leaseToken) &&
  isPositiveLease(input.leaseSeconds) &&
  isFiniteTime(input.nowMs);

export const claimOutboxEvent = async (input: {
  persistence: Pick<
    JobPersistencePort,
    'readRestoreFence' | 'claimOutboxEvent'
  >;
  request: OutboxClaimRequest;
}) => {
  if (!validOutboxClaim(input.request)) {
    return { kind: 'reject' as const, reason: 'INVALID_CLAIM' as const };
  }
  if (!canRunExternalEffect(await input.persistence.readRestoreFence())) {
    return { kind: 'retry' as const, reason: 'restore_fenced' as const };
  }
  const event = await input.persistence.claimOutboxEvent(input.request);
  return event === null
    ? { kind: 'skip' as const, reason: 'not_available' as const }
    : { kind: 'claimed' as const, event };
};

const validOutboxComplete = (input: OutboxCompleteRequest): boolean =>
  isUuid(input.outboxId) && isUuid(input.leaseToken);

export const completeOutboxEvent = async (input: {
  persistence: Pick<JobPersistencePort, 'completeOutboxEvent'>;
  request: OutboxCompleteRequest;
}) => {
  if (!validOutboxComplete(input.request)) {
    return { kind: 'reject' as const, reason: 'INVALID_CLAIM' as const };
  }
  const completed = await input.persistence.completeOutboxEvent(input.request);
  return completed
    ? { kind: 'completed' as const, outboxId: input.request.outboxId }
    : {
        kind: 'skip' as const,
        outboxId: input.request.outboxId,
        reason: 'lease_mismatch' as const,
      };
};

const validLeaseRequest = (
  input: JobLeaseInput & Readonly<{ leaseToken: string; leaseSeconds: number }>,
): boolean => isUuid(input.leaseToken) && isPositiveLease(input.leaseSeconds);

export const acquireJobLease = async (input: {
  persistence: Pick<JobPersistencePort, 'readRestoreFence' | 'claimJobLease'>;
  request: JobLeaseInput &
    Readonly<{ leaseToken: string; leaseSeconds: number }>;
}) => {
  if (!validLeaseRequest(input.request)) {
    return { kind: 'reject' as const, reason: 'INVALID_LEASE' as const };
  }
  const decision = decideJobLease(input.request);
  if (decision.kind !== 'acquire') return decision;
  if (!canRunExternalEffect(await input.persistence.readRestoreFence())) {
    return { kind: 'retry' as const, reason: 'restore_fenced' as const };
  }
  const claimed = await input.persistence.claimJobLease({
    expectedVersion: decision.expectedVersion,
    jobId: decision.jobId,
    leaseSeconds: input.request.leaseSeconds,
    leaseToken: input.request.leaseToken,
    nowMs: input.request.nowMs,
  });
  return claimed === null
    ? { kind: 'retry' as const, reason: 'cas_conflict' as const }
    : { kind: 'claimed' as const, lease: claimed };
};

export const heartbeatJobLease = async (input: {
  persistence: Pick<JobPersistencePort, 'heartbeatJobLease'>;
  request: JobHeartbeatRequest;
}) => {
  const request = input.request;
  if (
    !isUuid(request.jobId) ||
    !isUuid(request.leaseToken) ||
    !isPositiveVersion(request.expectedVersion) ||
    !isFiniteTime(request.leaseUntilMs) ||
    !isFiniteTime(request.nowMs) ||
    !isPositiveLease(request.leaseSeconds)
  ) {
    return { kind: 'reject' as const, reason: 'INVALID_HEARTBEAT' as const };
  }
  if (
    request.leaseUntilMs - request.nowMs >
    (request.leaseSeconds * 1000) / 3
  ) {
    return { kind: 'skip' as const, reason: 'not_due' as const };
  }
  const renewed = await input.persistence.heartbeatJobLease(request);
  return renewed
    ? { kind: 'renewed' as const, jobId: request.jobId }
    : { kind: 'skip' as const, reason: 'cas_conflict' as const };
};

const validOutcome = (input: JobOutcomeRequest): boolean =>
  isUuid(input.jobId) &&
  isUuid(input.leaseToken) &&
  isQuotedVersion(input.expectedVersion) &&
  isQuotedVersion(input.currentVersion) &&
  (input.errorCode === null || typeof input.errorCode === 'string');

export const applyJobOutcomeCas = async (input: {
  persistence: Pick<JobPersistencePort, 'applyJobOutcome'>;
  request: JobOutcomeRequest;
}): Promise<JobOutcomeRuntimeDecision> => {
  const request = input.request;
  if (request.nextState === 'pending_manual_review') {
    return { kind: 'manual_review', canonicalWrite: false, replayable: false };
  }
  if (!validOutcome(request)) {
    return { kind: 'reject', reason: 'INVALID_OUTCOME', partialEffects: false };
  }
  const transition = evaluateJobTransition({
    currentState: request.currentState,
    nextState: request.nextState,
    expectedVersion: request.expectedVersion,
    currentVersion: request.currentVersion,
    retryable: request.retryable,
  });
  if (transition.kind !== 'apply') return transition;
  const applied = await input.persistence.applyJobOutcome({
    ...request,
    nextVersion: transition.nextVersion,
  });
  return applied
    ? {
        kind: 'applied',
        jobId: request.jobId,
        nextState: transition.nextState,
        nextVersion: transition.nextVersion,
      }
    : { kind: 'conflict', reason: 'VERSION_MISMATCH', canonicalWrite: false };
};

const validProcessedEvent = (input: ProcessedEventRequest): boolean =>
  isUuid(input.eventId) &&
  isUuid(input.aggregateId) &&
  input.eventType === 'job.requested' &&
  input.schemaVersion === 1 &&
  typeof input.pendingManualReview === 'boolean';

export const recordProcessedEventIdempotently = async (input: {
  persistence: Pick<JobPersistencePort, 'recordProcessedEvent'>;
  request: ProcessedEventRequest;
}): Promise<ProcessedEventRuntimeDecision> => {
  const request = input.request;
  if (request.pendingManualReview) {
    return { kind: 'manual_review', canonicalWrite: false, replayable: false };
  }
  if (!validProcessedEvent(request)) {
    return { kind: 'reject', reason: 'INVALID_PROCESSED_EVENT' };
  }
  const result = await input.persistence.recordProcessedEvent(request);
  return result === 'recorded'
    ? { kind: 'recorded', canonicalWrite: true, replayable: true }
    : { kind: 'duplicate', canonicalWrite: false, replayable: false };
};

export const acceptJobWithOutboxAtomic = acceptJobAtomically;
export const persistJobAcceptance = acceptJobAtomically;
export const claimOutbox = claimOutboxEvent;
export const completeOutbox = completeOutboxEvent;
export const claimJobLease = acquireJobLease;
export const heartbeatJob = heartbeatJobLease;
export const applyJobOutcome = applyJobOutcomeCas;
export const recordProcessedEvent = recordProcessedEventIdempotently;
