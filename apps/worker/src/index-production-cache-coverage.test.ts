import { afterEach, describe, expect, it, vi } from 'vitest';

import handler, { type WorkerBindings } from './index';

const environment: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'index-cache-coverage',
  SUPABASE_SECRET_KEY: 'sb_secret_index_cache',
  SUPABASE_URL: 'https://staging.example.supabase.co',
};

const executionContext = { waitUntil: vi.fn() } as never;
const queueEnvironment = {
  ...environment,
  PLATFORM_JOBS: { send: vi.fn() },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('production entrypoint cache boundaries', () => {
  it('reuses a production app for an identical projected environment', async () => {
    const first = await handler.fetch(
      new Request('https://api.example.test/api/v1/health'),
      queueEnvironment,
      executionContext,
    );
    const second = await handler.fetch(
      new Request('https://api.example.test/api/v1/health'),
      queueEnvironment,
      executionContext,
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });

  it('reuses one migration worker for messages sharing the same queue environment', async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({ accepted: true }),
    );
    vi.stubGlobal('fetch', fetcher);
    const firstAck = vi.fn();
    const secondAck = vi.fn();

    await handler.queue(
      {
        queue: 'platform-jobs-staging',
        metadata: { metrics: { backlogBytes: 0, backlogCount: 0 } },
        retryAll: vi.fn(),
        ackAll: vi.fn(),
        messages: [
          {
            id: 'message-one',
            timestamp: new Date(),
            attempts: 1,
            body: { eventType: 'cms.schema.invalid' },
            ack: firstAck,
            retry: vi.fn(),
          },
          {
            id: 'message-two',
            timestamp: new Date(),
            attempts: 2,
            body: { eventType: 'cms.schema.invalid' },
            ack: secondAck,
            retry: vi.fn(),
          },
        ],
      },
      queueEnvironment,
      executionContext,
    );

    expect(firstAck).toHaveBeenCalledOnce();
    expect(secondAck).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
