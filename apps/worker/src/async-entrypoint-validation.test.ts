import { describe, expect, it, vi } from 'vitest';

import {
  createAsyncEntrypoint,
  type AsyncExecutionContext,
  type AsyncWorkerBindings,
  type PlatformJobsBatch,
  type PlatformJobsMessage,
} from './async-entrypoint';

const envelope = {
  aggregateId: '11111111-1111-4111-8111-111111111111',
  aggregateType: 'job',
  aggregateVersion: '1',
  causationId: null,
  correlationId: '22222222-2222-4222-8222-222222222222',
  eventId: '33333333-3333-4333-8333-333333333333',
  eventType: 'job.requested' as const,
  schemaVersion: 1 as const,
};

const bindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'local',
  PLATFORM_JOBS: { send: vi.fn() },
  SUPABASE_SECRET_KEY: 'secret',
  SUPABASE_URL: 'https://staging.example.supabase.co',
} as AsyncWorkerBindings;

const context = { waitUntil: vi.fn() } as AsyncExecutionContext;

const message = (body: unknown): PlatformJobsMessage => ({
  ack: vi.fn(),
  attempts: 1,
  body,
  id: 'message-1',
  retry: vi.fn(),
});

const batch = (
  messages: readonly PlatformJobsMessage[],
): PlatformJobsBatch => ({
  messages,
  queue: 'platform-jobs-staging',
});

describe('async queue admission', () => {
  it('delegates only validated job.requested/1 envelopes', async () => {
    const valid = message(envelope);
    const malformed = message({ ...envelope, schemaVersion: 2 });
    const unsupported = message({ ...envelope, eventType: 'object.uploaded' });
    const missing = message(null);
    const orchestrateQueueMessage = vi.fn(async () => 'ack' as const);

    await createAsyncEntrypoint({ orchestrateQueueMessage }).queue(
      batch([valid, malformed, unsupported, missing]),
      bindings,
      context,
    );

    expect(orchestrateQueueMessage).toHaveBeenCalledTimes(1);
    expect(valid.ack).toHaveBeenCalledOnce();
    for (const invalid of [malformed, unsupported, missing]) {
      expect(invalid.retry).toHaveBeenCalledOnce();
      expect(invalid.ack).not.toHaveBeenCalled();
    }
  });
});
