import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { createSupabaseJobHintSubscriber } from '../../apps/web/src/lib/infrastructure-realtime';

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const JOB = {
  id: JOB_ID,
  type: 'infrastructure.refresh',
  state: 'running' as const,
  progress: { completed: 1, total: 2, unit: 'record' },
  resultRef: null,
  error: null,
  createdAt: '2026-08-30T12:00:00.000Z',
  updatedAt: '2026-08-30T12:01:00.000Z',
};

describe('production Supabase Realtime hint adapter', () => {
  class FakeSocket {
    static readonly instances: FakeSocket[] = [];
    readonly sent: string[] = [];
    readonly listeners = new Map<string, Set<(event: unknown) => void>>();
    readonly readyState = 1;
    closed = false;

    constructor(readonly url: string) {
      FakeSocket.instances.push(this);
    }

    addEventListener(type: string, listener: (event: unknown) => void) {
      const listeners = this.listeners.get(type) ?? new Set();
      listeners.add(listener);
      this.listeners.set(type, listeners);
    }

    removeEventListener(type: string, listener: (event: unknown) => void) {
      this.listeners.get(type)?.delete(listener);
    }

    send(value: string) {
      this.sent.push(value);
    }

    close() {
      this.closed = true;
    }

    emit(type: string, event: unknown) {
      for (const listener of this.listeners.get(type) ?? []) listener(event);
    }
  }

  it('joins a job topic with an auth token and forwards only ID/version hints', () => {
    FakeSocket.instances.length = 0;
    const subscribe = createSupabaseJobHintSubscriber(
      {
        jobId: JOB_ID,
        supabaseUrl: 'https://example.supabase.co',
        publishableKey: 'publishable',
        accessToken: 'server-issued-short-lived-token',
      },
      FakeSocket as never,
    );
    const received: unknown[] = [];
    const dispose = subscribe?.((value) => received.push(value));
    const socket = FakeSocket.instances[0];

    expect(socket?.url).toContain('/realtime/v1/websocket');
    socket?.emit('open', {});
    const join = JSON.parse(socket?.sent[0] ?? '{}') as {
      topic?: string;
      payload?: { access_token?: string };
    };
    expect(join.topic).toBe(`realtime:job:${JOB_ID}`);
    expect(join.payload?.access_token).toBe('server-issued-short-lived-token');

    const hint = {
      entityId: JOB_ID,
      entityType: 'job' as const,
      hintedVersion: '"8"',
    };
    socket?.emit('message', {
      data: JSON.stringify({
        topic: `realtime:job:${JOB_ID}`,
        event: 'broadcast',
        payload: { payload: hint },
      }),
    });
    socket?.emit('message', {
      data: JSON.stringify({
        topic: `realtime:job:${JOB_ID}`,
        event: 'broadcast',
        payload: { payload: { ...hint, data: JOB } },
      }),
    });
    socket?.emit('message', {
      data: JSON.stringify({
        topic: 'realtime:job:22222222-2222-4222-8222-222222222222',
        event: 'broadcast',
        payload: { payload: hint },
      }),
    });

    expect(received).toEqual([hint]);
    dispose?.();
    expect(socket?.closed).toBe(true);
  });
});

describe('server-owned production mounting', () => {
  it('mounts the job region with server state on both protected routes', () => {
    const routes = [
      'apps/web/src/pages/app/infrastructure/index.astro',
      'apps/web/src/pages/app/infrastructure/[recordId].astro',
    ];
    for (const route of routes) {
      const source = readFileSync(route, 'utf8');
      expect(source).toContain('jobStatus={serverJobStatus');
      expect(source).toContain('InfrastructureWorkbench');
      expect(source).not.toContain('readServerSupabaseJobRealtimeConfig');
      expect(source).not.toContain('accessToken');
    }
  });
});
