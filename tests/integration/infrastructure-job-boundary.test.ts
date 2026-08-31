import { ApiErrorSchema, JobStatusTransportSchema } from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

import {
  createJobStatusReader,
  jobStatusHref,
  JobStatusHttpError,
  readServerInfrastructureJobStatus,
  readJobStatusResponse,
} from '../../apps/web/src/lib/infrastructure-jobs';
import {
  JobStatusRequestError,
  readJobStatusWithRetry,
} from '../../apps/web/src/components/infrastructure/jobs/useJobPolling';

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const REQUEST_ID = '99999999-9999-4999-8999-999999999999';
const transport = JobStatusTransportSchema.parse({
  data: {
    id: JOB_ID,
    type: 'infrastructure.reconcile',
    state: 'succeeded',
    progress: null,
    resultRef: null,
    error: null,
    createdAt: '2026-08-30T12:00:00.000Z',
    updatedAt: '2026-08-30T12:01:00.000Z',
  },
  etag: '"2"',
});

const dependencyError = () =>
  new JobStatusRequestError({
    apiError: ApiErrorSchema.parse({
      code: 'DEPENDENCY_UNAVAILABLE',
      details: { retryable: true },
      message: 'Job status is temporarily unavailable.',
      requestId: REQUEST_ID,
    }),
    httpStatus: 503,
    retryAt: 'not-a-timestamp',
  });

describe('Slice 03 job fetch and retry boundary', () => {
  it('validates the path before constructing a job URL', () => {
    expect(jobStatusHref(JOB_ID)).toBe(`/api/v1/jobs/${JOB_ID}`);
    expect(() => jobStatusHref('not-a-job-id')).toThrow();
  });

  it('uses only the declared 250ms and 750ms read retry schedule', async () => {
    let reads = 0;
    const delays: number[] = [];
    const result = await readJobStatusWithRetry({
      read: async () => {
        reads += 1;
        if (reads < 3) throw dependencyError();
        return transport;
      },
      safeRetryDeclared: true,
      sleep: async (delay) => delays.push(delay),
    });

    expect(result).toEqual(transport);
    expect(reads).toBe(3);
    expect(delays).toEqual([250, 750]);
    expect(dependencyError().retryAt).toBeNull();
  });

  it('does not retry undeclared or exhausted attempts', async () => {
    let reads = 0;
    await expect(
      readJobStatusWithRetry({
        read: async () => {
          reads += 1;
          throw dependencyError();
        },
        safeRetryDeclared: false,
        sleep: async () => undefined,
      }),
    ).rejects.toBeInstanceOf(JobStatusRequestError);
    expect(reads).toBe(1);

    reads = 0;
    await expect(
      readJobStatusWithRetry({
        read: async () => {
          reads += 1;
          throw dependencyError();
        },
        safeRetryDeclared: true,
        attempt: 2,
        sleep: async () => undefined,
      }),
    ).rejects.toBeInstanceOf(JobStatusRequestError);
    expect(reads).toBe(1);
  });

  it('parses server data and preserves only a valid server retry timestamp', async () => {
    const ok = new Response(JSON.stringify(transport.data), {
      status: 200,
      headers: { etag: transport.etag, 'x-request-id': REQUEST_ID },
    });
    await expect(readJobStatusResponse(ok)).resolves.toEqual(transport);

    const error = new Response(
      JSON.stringify({
        code: 'RATE_LIMITED',
        details: {},
        message: 'Try again later.',
        requestId: REQUEST_ID,
      }),
      {
        status: 429,
        headers: {
          'retry-after': '5',
          'retry-at': '2026-02-30T00:00:00.000Z',
          'x-request-id': REQUEST_ID,
        },
      },
    );
    await expect(readJobStatusResponse(error)).rejects.toMatchObject({
      httpStatus: 429,
      retryAt: null,
      retryAfterSeconds: 5,
    } satisfies Partial<JobStatusHttpError>);
  });

  it('creates a reader that sends a safe GET and validates the response', async () => {
    const calls: Array<{
      input: RequestInfo | URL;
      init: RequestInit | undefined;
    }> = [];
    const fetcher: typeof fetch = async (input, init) => {
      calls.push({ input, init });
      return new Response(JSON.stringify(transport.data), {
        status: 200,
        headers: { etag: transport.etag },
      });
    };

    await expect(
      createJobStatusReader(JOB_ID, fetcher)(new AbortController().signal),
    ).resolves.toEqual(transport);
    expect(calls[0]?.input).toBe(`/api/v1/jobs/${JOB_ID}`);
    expect(calls[0]?.init?.method).toBe('GET');
    expect(calls[0]?.init?.headers).toEqual({ accept: 'application/json' });
  });

  it('accepts only server-local validated job data for route SSR', () => {
    expect(
      readServerInfrastructureJobStatus({
        serverInfrastructureJobStatus: transport,
      }),
    ).toEqual(transport);
    expect(
      readServerInfrastructureJobStatus({
        serverInfrastructureJobStatus: {
          ...transport,
          data: { ...transport.data, state: 'succeeded', private: true },
        },
      }),
    ).toBeUndefined();
    expect(
      readServerInfrastructureJobStatus({
        serverInfrastructureJobStatus: undefined,
      }),
    ).toBeUndefined();
  });
});
