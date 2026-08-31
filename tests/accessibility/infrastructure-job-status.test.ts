import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { JobStatusTransportSchema } from '@wejammin/contracts';
import type { AsyncState } from '@wejammin/ui/infrastructure/presentation';
import { describe, expect, it } from 'vitest';

import JobProgress from '../../apps/web/src/components/infrastructure/jobs/JobProgress';
import JobStatusFields from '../../apps/web/src/components/infrastructure/jobs/JobStatusFields';
import JobStatusPanel from '../../apps/web/src/components/infrastructure/jobs/JobStatusPanel';
import {
  JOB_STATUS_FIELD_OWNERS,
  mapJobStatusFields,
} from '../../apps/web/src/components/infrastructure/jobs/job-state';
import { pollJobStatus } from '../../apps/web/src/components/infrastructure/jobs/useJobPolling';

const REQUEST_ID = '99999999-9999-4999-8999-999999999999';
const JOB_ID = '11111111-1111-4111-8111-111111111111';
const CREATED_AT = '2026-08-30T12:00:00.000Z';
const UPDATED_AT = '2026-08-30T12:01:00.000Z';

const transport = (
  state: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled',
) =>
  JobStatusTransportSchema.parse({
    data: {
      id: JOB_ID,
      type: 'infrastructure.reconcile',
      state,
      progress:
        state === 'running' ? { completed: 2, total: 4, unit: 'items' } : null,
      resultRef:
        state === 'succeeded'
          ? { type: 'infrastructure.record', id: JOB_ID }
          : null,
      error:
        state === 'failed'
          ? { code: 'DEPENDENCY_UNAVAILABLE', retryable: true }
          : null,
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    },
    etag: '"2"',
  });

describe('Slice 03 job status presentation', () => {
  it('P1-S03-AC-037', () => {
    const loading: AsyncState<ReturnType<typeof transport>['data']> = {
      status: 'loading',
      startedAt: CREATED_AT,
      preserveSafePriorContent: false,
    };
    const loadingMarkup = renderToStaticMarkup(
      React.createElement(JobStatusPanel, {
        state: loading,
        requestId: REQUEST_ID,
      }),
    );
    expect(loadingMarkup).toContain('Loading job status');

    const error: AsyncState<ReturnType<typeof transport>['data']> = {
      status: 'error',
      error: {
        code: 'DEPENDENCY_UNAVAILABLE',
        message: 'The job status service is unavailable.',
        requestId: REQUEST_ID,
        details: null,
      },
      retryable: true,
    };
    const errorMarkup = renderToStaticMarkup(
      React.createElement(JobStatusPanel, {
        state: error,
        requestId: REQUEST_ID,
        onRetry: () => undefined,
      }),
    );
    expect(errorMarkup).toContain('DEPENDENCY_UNAVAILABLE');
    expect(errorMarkup).toContain(`Request ID: ${REQUEST_ID}`);
    expect(errorMarkup).not.toContain('No jobs found');

    const success = {
      status: 'success' as const,
      data: transport('succeeded').data,
      version: transport('succeeded').etag,
      stale: false as const,
    };
    const successMarkup = renderToStaticMarkup(
      React.createElement(JobStatusPanel, {
        state: success,
        requestId: REQUEST_ID,
      }),
    );
    expect(successMarkup).toContain('succeeded');
    expect(successMarkup).toContain(JOB_ID);
    expect(successMarkup).toContain('&quot;2&quot;');
  });

  it('P1-S03-AC-043', async () => {
    const reads = [transport('running'), transport('succeeded')];
    let readCount = 0;
    const result = await pollJobStatus({
      read: async () => {
        const next = reads[readCount];
        readCount += 1;
        if (next === undefined)
          throw new Error('poll reopened after terminal state');
        return next;
      },
      sleep: async () => undefined,
      pollIntervalMs: 0,
    });

    expect(result.data.state).toBe('succeeded');
    expect(readCount).toBe(2);

    const terminal = await pollJobStatus({
      initial: transport('cancelled'),
      read: async () => {
        throw new Error('terminal job was polled');
      },
      sleep: async () => undefined,
      pollIntervalMs: 0,
    });
    expect(terminal.data.state).toBe('cancelled');
  });

  it('P1-S03-AC-044', () => {
    const job = transport('failed').data;
    expect(JOB_STATUS_FIELD_OWNERS.map(({ field }) => field)).toEqual([
      'id',
      'type',
      'state',
      'progress',
      'resultRef',
      'error',
      'createdAt',
      'updatedAt',
    ]);
    expect(mapJobStatusFields(job).map(({ field }) => field)).toEqual(
      JOB_STATUS_FIELD_OWNERS.map(({ field }) => field),
    );
    const markup = renderToStaticMarkup(
      React.createElement(JobStatusFields, { job }),
    );
    expect(markup).toContain('Job ID');
    expect(markup).toContain('Job type');
    expect(markup).toContain('Error');
    expect(markup).toContain('DEPENDENCY_UNAVAILABLE');
  });

  it('renders truthful determinate and unknown progress semantics', () => {
    const determinate = renderToStaticMarkup(
      React.createElement(JobProgress, {
        progress: { completed: 2, total: 4 },
      }),
    );
    expect(determinate).toContain('<progress');
    expect(determinate).toContain('value="2"');
    expect(determinate).toContain('max="4"');

    const unknown = renderToStaticMarkup(
      React.createElement(JobProgress, { progress: null }),
    );
    expect(unknown).toContain('Progress not reported');
    expect(unknown).not.toContain('<progress');
  });
});
