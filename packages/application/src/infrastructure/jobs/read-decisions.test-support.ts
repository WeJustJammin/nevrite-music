export const ACTOR_ID = '11111111-1111-4111-8111-111111111111';
export const PARTY_ID = '22222222-2222-4222-8222-222222222222';
export const JOB_ID = '33333333-3333-4333-8333-333333333333';
const EVENT_ID = '44444444-4444-4444-8444-444444444444';
const CORRELATION_ID = '55555555-5555-4555-8555-555555555555';

export const job = {
  id: JOB_ID,
  type: 'object.verify',
  state: 'queued',
  progress: null,
  resultRef: null,
  error: null,
  createdAt: '2026-08-30T12:00:00Z',
  updatedAt: '2026-08-30T12:00:00Z',
} as const;

export const baseRead = {
  target: { job, actorId: ACTOR_ID, actingPartyId: PARTY_ID },
} as const;

export const event = {
  eventId: EVENT_ID,
  eventType: 'job.requested',
  schemaVersion: 1,
  aggregateType: 'job',
  aggregateId: JOB_ID,
  aggregateVersion: '1',
  correlationId: CORRELATION_ID,
  causationId: null,
  actorId: ACTOR_ID,
  actingPartyId: PARTY_ID,
  occurredAt: '2026-08-30T12:00:00Z',
  payload: { jobId: JOB_ID, jobType: 'object.verify' },
} as const;
