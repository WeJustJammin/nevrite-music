import { JobStatusSchema } from '@wejammin/contracts';
import { createLogger } from '@wejammin/observability/logging';
import { vi } from 'vitest';

import {
  createWorkerApp,
  type WorkerBindings,
  type WorkerDependencies,
} from '../index';
import {
  PARTY_READ_LIMIT,
  USER_READ_LIMIT,
  type JobRateLimitDecision,
  type JobStatusDependencies,
  type JobStatusPrincipal,
  type JobStatusRecord,
} from './job-status';

export const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
export const USER_ID = '22222222-2222-4222-8222-222222222222';
export const OTHER_USER_ID = '33333333-3333-4333-8333-333333333333';
export const PARTY_ID = '44444444-4444-4444-8444-444444444444';
export const OTHER_PARTY_ID = '55555555-5555-4555-8555-555555555555';
export const JOB_ID = '66666666-6666-4666-8666-666666666666';

export const bindings: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'slice03-test',
  SUPABASE_SECRET_KEY: 'sb_secret_test_only',
  SUPABASE_URL: 'https://staging.example.supabase.co',
};

export const status = JobStatusSchema.parse({
  id: JOB_ID,
  type: 'infrastructure.sync',
  state: 'running',
  progress: { completed: 2, total: 4, unit: 'items' },
  resultRef: null,
  error: null,
  createdAt: '2026-08-30T06:00:00.000Z',
  updatedAt: '2026-08-30T06:01:00.000Z',
});

export const record: JobStatusRecord = {
  actorId: USER_ID,
  actingPartyId: PARTY_ID,
  data: status,
  etag: '"7"',
};

export const allowRate: JobRateLimitDecision = {
  allowed: true,
  limit: USER_READ_LIMIT,
  remaining: USER_READ_LIMIT - 1,
  resetAt: 1_756_530_000,
  scope: 'user',
};

export const basePrincipal: JobStatusPrincipal = {
  kind: 'user',
  userId: USER_ID,
};

export const createJobDependencies = (
  overrides: Partial<JobStatusDependencies> = {},
): JobStatusDependencies => ({
  loadJobStatus: vi.fn(async () => record),
  rateLimit: vi.fn(async () => allowRate),
  resolvePrincipal: vi.fn(async () => basePrincipal),
  now: () => 1_756_530_000_000,
  ...overrides,
});

export const createTestApp = (
  jobs: JobStatusDependencies,
  overrides: Partial<WorkerDependencies> = {},
) => {
  const dependencies: WorkerDependencies = {
    captureException: vi.fn(),
    createLogger: () =>
      createLogger({
        environment: 'staging',
        release: 'slice03-test',
        service: 'wejammin-api',
      }),
    jobs,
    now: () => 1_756_530_000_000,
    ...overrides,
  };
  return createWorkerApp(dependencies);
};

export const request = (
  path = `/api/v1/jobs/${JOB_ID}`,
  headers?: HeadersInit,
) =>
  new Request(`https://api.example.test${path}`, {
    method: 'GET',
    headers: { 'x-request-id': REQUEST_ID, ...headers },
  });

export const json = async (
  response: Response,
): Promise<Record<string, unknown>> =>
  (await response.json()) as Record<string, unknown>;

export { PARTY_READ_LIMIT, USER_READ_LIMIT };
