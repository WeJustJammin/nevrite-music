import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import {
  InfrastructureRecordSchema,
  JobStatusTransportSchema,
} from '@wejammin/contracts';
import { describe, expect, it, vi } from 'vitest';

import ConfirmationStep from '../../apps/web/src/components/infrastructure/ConfirmationStep';
import InfrastructureJobRegions from '../../apps/web/src/components/infrastructure/jobs/InfrastructureJobRegions';
import { createRealtimeRefetchCoordinator } from '../../apps/web/src/components/infrastructure/jobs/realtime-coordinator';
import {
  retryAfterSecondsFromError,
  JobStatusRequestError,
} from '../../apps/web/src/components/infrastructure/jobs/job-polling';
import { errorJobState } from '../../apps/web/src/components/infrastructure/jobs/job-state';
import { readJobStatusResponse } from '../../apps/web/src/lib/infrastructure-jobs';
import { selectInfrastructureRecord } from '../../apps/web/src/components/infrastructure/useInfrastructureWorkbench';

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const REQUEST_ID = '99999999-9999-4999-8999-999999999999';
const AT = '2026-08-30T12:00:00.000Z';

const transport = (etag: string, state: 'running' | 'succeeded') =>
  JobStatusTransportSchema.parse({
    data: {
      id: JOB_ID,
      type: 'infrastructure.reconcile',
      state,
      progress:
        state === 'running' ? { completed: 1, total: 2, unit: 'items' } : null,
      resultRef: null,
      error: null,
      createdAt: AT,
      updatedAt: state === 'running' ? AT : '2026-08-30T12:01:00.000Z',
    },
    etag,
  });

describe('infrastructure job remediation regressions', () => {
  it('seeds the SSR canonical version before accepting the first realtime response', async () => {
    const applied: string[] = [];
    const coordinator = createRealtimeRefetchCoordinator({
      currentJobId: JOB_ID,
      initialCanonical: transport('"3"', 'running'),
      refetch: async () => transport('"2"', 'succeeded'),
      applyCanonical: (next) => applied.push(next.etag),
    });

    await coordinator.refetchFromNavigation();

    expect(applied).toEqual([]);
  });

  it('purges the displayed canonical job when an authorized refetch returns null', async () => {
    const cleared = vi.fn();
    const coordinator = createRealtimeRefetchCoordinator({
      currentJobId: JOB_ID,
      initialCanonical: transport('"3"', 'running'),
      refetch: async () => null,
      applyCanonical: () => undefined,
      onCanonicalCleared: cleared,
    });

    await coordinator.refetchFromNavigation();

    expect(cleared).toHaveBeenCalledOnce();
  });

  it('purges the canonical cache when the server revokes authorization', async () => {
    const cleared = vi.fn();
    const coordinator = createRealtimeRefetchCoordinator({
      currentJobId: JOB_ID,
      initialCanonical: transport('"3"', 'running'),
      refetch: async () => {
        throw { apiError: { code: 'FORBIDDEN' } };
      },
      applyCanonical: () => undefined,
      onCanonicalCleared: cleared,
    });

    await expect(coordinator.refetchFromNavigation()).rejects.toEqual({
      apiError: { code: 'FORBIDDEN' },
    });
    expect(cleared).toHaveBeenCalledOnce();
  });

  it('retains server Retry-After metadata for the AsyncState recovery action', () => {
    const error = new JobStatusRequestError({
      apiError: {
        code: 'RATE_LIMITED',
        details: {},
        message: 'The server asked us to wait.',
        requestId: REQUEST_ID,
      },
      httpStatus: 429,
      retryAt: null,
      retryAfterSeconds: 5,
    });
    const state = errorJobState(
      {
        code: error.apiError.code,
        details: error.apiError.details,
        message: error.apiError.message,
        requestId: error.apiError.requestId,
      },
      true,
      error.retryAfterSeconds,
    );

    expect(retryAfterSecondsFromError(error)).toBe(5);
    expect(state.retryable).toBe(true);
    expect(state.status === 'error' ? state.retryAfterSeconds : null).toBe(5);
  });

  it('renders Retry-After as an explicit recovery control once the wait ends', () => {
    const markup = renderToStaticMarkup(
      React.createElement(InfrastructureJobRegions, {
        jobStatus: {
          status: 'error',
          error: {
            code: 'RATE_LIMITED',
            details: {},
            message: 'The server asked us to wait.',
            requestId: REQUEST_ID,
          },
          retryable: true,
        },
        jobRetryAfterSeconds: 0,
        onJobRetry: () => undefined,
        requestId: REQUEST_ID,
      }),
    );

    expect(markup).toContain('Retry available now.');
    expect(markup).toContain('Retry job status');
  });

  it('does not select the first record when the URL has no selected record', () => {
    const first = InfrastructureRecordSchema.parse({
      facts: {},
      id: '22222222-2222-4222-8222-222222222222',
      label: 'First record',
      modifiedAt: AT,
      provenance: [],
      summary: 'First record',
      version: '"1"',
    });
    expect(selectInfrastructureRecord([first], null)).toBeNull();
  });

  it('exposes a modal confirmation with a labelled focus boundary', () => {
    const markup = renderToStaticMarkup(
      React.createElement(ConfirmationStep, {
        actingContext: 'Server-selected acting party',
        consequence: 'Archive this infrastructure record',
        expectedVersion: '"2"',
        onCancel: () => undefined,
        onConfirm: () => undefined,
        scope: 'Control plane',
        stepUpVerified: true,
      }),
    );

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain('aria-labelledby="confirmation-heading"');
  });

  it('keeps the production job region on the same-origin validated integration spine', async () => {
    expect(InfrastructureJobRegions).toBeDefined();
    const response = new Response(
      JSON.stringify(transport('"4"', 'succeeded').data),
      {
        status: 200,
        headers: { etag: '"4"', 'x-request-id': REQUEST_ID },
      },
    );
    const parsed = await readJobStatusResponse(response);
    expect(parsed.etag).toBe('"4"');
  });
});
