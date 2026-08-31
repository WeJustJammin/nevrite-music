import { JobStatusSchema, PlatformEventSchema } from '@wejammin/contracts';

import type { JobAcceptanceDecision, JobAcceptanceInput } from './types.ts';

const reject = (
  reason: Extract<JobAcceptanceDecision, { kind: 'reject' }>['reason'],
): JobAcceptanceDecision => ({
  kind: 'reject',
  partialEffects: false,
  reason,
});

export const acceptJobWithOutbox = (
  input: JobAcceptanceInput,
): JobAcceptanceDecision => {
  if (input.operation.trim() === '' || input.requestHash.trim() === '') {
    return reject('REQUEST_INVALID');
  }
  const parsedJob = JobStatusSchema.safeParse(input.job);
  if (!parsedJob.success) return reject('INVALID_JOB');
  const parsedEvent = PlatformEventSchema.safeParse(input.event);
  if (!parsedEvent.success) return reject('INVALID_EVENT');
  if (parsedJob.data.state !== 'queued') return reject('JOB_NOT_QUEUED');
  if (parsedEvent.data.eventType !== 'job.requested') {
    return reject('EVENT_NOT_JOB_REQUEST');
  }
  if (
    parsedEvent.data.aggregateType !== 'job' ||
    parsedEvent.data.aggregateId !== parsedJob.data.id ||
    parsedEvent.data.payload.jobId !== parsedJob.data.id ||
    parsedEvent.data.payload.jobType !== parsedJob.data.type ||
    input.operation !== parsedJob.data.type
  ) {
    return reject('EVENT_JOB_MISMATCH');
  }

  const existing = input.existingIdempotency;
  if (existing !== null) {
    if (
      existing.operation !== input.operation ||
      existing.requestHash !== input.requestHash
    ) {
      return {
        kind: 'conflict',
        partialEffects: false,
        reason: 'IDEMPOTENCY_MISMATCH',
      };
    }
    if (existing.state === 'completed' || existing.state === 'reserved') {
      return {
        event: parsedEvent.data,
        job: parsedJob.data,
        kind: 'replay',
        replayed: true,
      };
    }
  }
  return {
    atomicWrites: ['job', 'outbox', 'idempotency'],
    event: parsedEvent.data,
    job: parsedJob.data,
    kind: 'commit',
  };
};
