import type { JobPersistencePort } from './index.ts';

export const JOB_ID = '11111111-1111-4111-8111-111111111111';
export const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const OPERATION_ID = '33333333-3333-4333-8333-333333333333';
export const LEASE_TOKEN = '44444444-4444-4444-8444-444444444444';

export const job = {
  id: JOB_ID,
  type: 'object.verify',
  state: 'queued' as const,
  progress: null,
  resultRef: null,
  error: null,
  createdAt: '2026-08-30T12:00:00Z',
  updatedAt: '2026-08-30T12:00:00Z',
};

const event = {
  eventId: EVENT_ID,
  eventType: 'job.requested' as const,
  schemaVersion: 1 as const,
  aggregateType: 'job',
  aggregateId: JOB_ID,
  aggregateVersion: '1',
  correlationId: OPERATION_ID,
  causationId: null,
  actorId: null,
  actingPartyId: null,
  occurredAt: '2026-08-30T12:00:00Z',
  payload: { jobId: JOB_ID, jobType: 'object.verify' },
};

const canonicalJob = {
  id: JOB_ID,
  type: 'object.verify',
  state: 'queued' as const,
  version: '1',
  leaseUntilMs: null,
};

export const openFence = {
  expectedEpoch: 'epoch-1',
  consumerEpoch: 'epoch-1',
  integrityVerified: true,
  reconciliationComplete: true,
};

export const makePersistence = (
  overrides: Partial<JobPersistencePort> = {},
): JobPersistencePort => ({
  transaction: async (callback) =>
    callback({ acceptJobWithOutbox: async () => undefined }),
  readCanonicalJob: async () => canonicalJob,
  claimOutboxEvent: async () => ({
    id: EVENT_ID,
    eventType: 'job.requested',
    schemaVersion: 1,
    aggregateType: 'job',
    aggregateId: JOB_ID,
    aggregateVersion: '1',
  }),
  completeOutboxEvent: async () => true,
  claimJobLease: async () => ({
    jobId: JOB_ID,
    leaseToken: LEASE_TOKEN,
    expectedVersion: '1',
    version: '2',
    leaseUntilMs: 30_000,
  }),
  heartbeatJobLease: async () => true,
  applyJobOutcome: async () => true,
  recordProcessedEvent: async () => 'recorded',
  readRestoreFence: async () => openFence,
  ...overrides,
});

export const acceptanceInput = (overrides: Record<string, unknown> = {}) => ({
  job,
  event,
  operation: 'object.verify',
  requestHash: 'sha256:request',
  existingIdempotency: null,
  ...overrides,
});

export const leaseRequest = (overrides: Record<string, unknown> = {}) => ({
  jobId: JOB_ID,
  state: 'queued' as const,
  currentVersion: '1',
  leaseUntilMs: null,
  nowMs: 10,
  leaseToken: LEASE_TOKEN,
  leaseSeconds: 300,
  ...overrides,
});

export const outcomeRequest = (overrides: Record<string, unknown> = {}) => ({
  jobId: JOB_ID,
  leaseToken: LEASE_TOKEN,
  currentState: 'running' as const,
  nextState: 'succeeded' as const,
  expectedVersion: '"1"',
  currentVersion: '"1"',
  retryable: false,
  resultRef: null,
  errorCode: null,
  ...overrides,
});

export const processedRequest = (overrides: Record<string, unknown> = {}) => ({
  eventId: EVENT_ID,
  eventType: 'job.requested',
  schemaVersion: 1,
  aggregateId: JOB_ID,
  pendingManualReview: false,
  ...overrides,
});
