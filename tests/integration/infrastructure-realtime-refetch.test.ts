import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { JobStatusTransportSchema } from '@wejammin/contracts';
import { describe, expect, it, vi } from 'vitest';

import RealtimeRefetchStatus from '../../apps/web/src/components/infrastructure/jobs/RealtimeRefetchStatus';
import {
  attachJobInvalidationChannel,
  createRealtimeRefetchCoordinator,
  parseJobRealtimeHint,
  type JobInvalidationChannel,
} from '../../apps/web/src/components/infrastructure/jobs/useRealtimeRefetch';

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const REQUEST_ID = '99999999-9999-4999-8999-999999999999';
const hint = {
  entityId: JOB_ID,
  entityType: 'job' as const,
  hintedVersion: '"2"',
};
const canonical = JobStatusTransportSchema.parse({
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

class FakeChannel implements JobInvalidationChannel {
  private listener: ((event: MessageEvent<unknown>) => void) | null = null;

  addEventListener(
    _type: 'message',
    listener: (event: MessageEvent<unknown>) => void,
  ): void {
    this.listener = listener;
  }

  removeEventListener(
    _type: 'message',
    listener: (event: MessageEvent<unknown>) => void,
  ): void {
    if (this.listener === listener) this.listener = null;
  }

  close(): void {
    this.listener = null;
  }

  emit(value: unknown): void {
    this.listener?.({ data: value } as MessageEvent<unknown>);
  }
}

describe('Slice 03 realtime invalidation and canonical refetch', () => {
  it('P1-S03-AC-026', async () => {
    const refetch = vi.fn(async () => canonical);
    const applied: string[] = [];
    const coordinator = createRealtimeRefetchCoordinator({
      currentJobId: JOB_ID,
      refetch,
      applyCanonical: (resource) => applied.push(resource.etag),
    });

    await Promise.all([
      coordinator.handleHint(hint),
      coordinator.handleHint(hint),
    ]);

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(applied).toEqual(['"2"']);
    expect(refetch.mock.calls[0]?.[0]).toEqual(hint);
    expect(refetch.mock.calls[0]?.[0]).not.toHaveProperty('state');
  });

  it('P1-S03-AC-031', () => {
    expect(parseJobRealtimeHint(hint, JOB_ID)).toEqual(hint);
    expect(
      parseJobRealtimeHint({ ...hint, state: 'succeeded' }, JOB_ID),
    ).toBeNull();
    expect(
      parseJobRealtimeHint(
        { ...hint, entityId: '22222222-2222-4222-8222-222222222222' },
        JOB_ID,
      ),
    ).toBeNull();
  });

  it('P1-S03-AC-035', async () => {
    const refetch = vi.fn(async () => canonical);
    const coordinator = createRealtimeRefetchCoordinator({
      currentJobId: JOB_ID,
      refetch,
      applyCanonical: () => undefined,
    });

    await coordinator.refetchFromNavigation();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('P1-S03-AC-039', () => {
    const channel = new FakeChannel();
    const received: unknown[] = [];
    const detach = attachJobInvalidationChannel(
      channel,
      (value) => received.push(value),
      JOB_ID,
    );

    channel.emit(hint);
    channel.emit({ ...hint, entityType: 'infrastructure_record' });
    channel.emit({ ...hint, carriesCanonicalState: { state: 'succeeded' } });

    expect(received).toEqual([hint]);
    detach();
    channel.emit(hint);
    expect(received).toEqual([hint]);
  });

  it('P1-S03-AC-040', async () => {
    const focus = vi.fn();
    const coordinator = createRealtimeRefetchCoordinator({
      currentJobId: JOB_ID,
      refetch: async () => canonical,
      applyCanonical: () => undefined,
      getActiveElement: () => ({ isConnected: true, focus }),
    });

    await coordinator.handleHint(hint);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('P1-S03-AC-041', () => {
    const markup = renderToStaticMarkup(
      React.createElement(RealtimeRefetchStatus, {
        state: 'error',
        requestId: REQUEST_ID,
        message: 'Canonical job status could not be refreshed.',
      }),
    );
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-atomic="true"');
    expect(markup).toContain(`Request ID: ${REQUEST_ID}`);
  });
});
