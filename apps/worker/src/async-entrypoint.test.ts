import { describe, expect, it, vi } from 'vitest';

import {
  createAsyncEntrypoint,
  enqueuePlatformJob,
  type AsyncExecutionContext,
  type AsyncWorkerBindings,
  type PlatformJobsBatch,
  type PlatformJobsMessage,
  type PlatformJobsQueue,
} from './async-entrypoint';

const createQueue = (): PlatformJobsQueue => ({
  send: vi.fn(async () => ({
    metadata: { metrics: { backlogBytes: 0, backlogCount: 0 } },
  })),
});

const bindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'local',
  PLATFORM_JOBS: createQueue(),
  SUPABASE_SECRET_KEY: 'server-secret',
  SUPABASE_URL: 'https://staging.example.supabase.co',
} satisfies AsyncWorkerBindings;

const executionContext = {
  waitUntil: vi.fn(),
} satisfies AsyncExecutionContext;

const envelope = {
  aggregateId: '11111111-1111-4111-8111-111111111111',
  aggregateType: 'job',
  aggregateVersion: '1',
  causationId: null,
  correlationId: '22222222-2222-4222-8222-222222222222',
  eventId: '33333333-3333-4333-8333-333333333333',
  eventType: 'job.requested',
  schemaVersion: 1,
} as const;

const createMessage = (body: unknown): PlatformJobsMessage => ({
  ack: vi.fn(),
  attempts: 1,
  body,
  id: 'message-1',
  retry: vi.fn(),
});

const createBatch = (
  messages: readonly PlatformJobsMessage[],
  queue = 'platform-jobs',
): PlatformJobsBatch => ({ messages, queue });

describe('Worker asynchronous entrypoint', () => {
  it('sends only a validated QueueEnvelope through the typed PLATFORM_JOBS producer', async () => {
    const queue = createQueue();

    await enqueuePlatformJob(queue, envelope);

    expect(queue.send).toHaveBeenCalledWith(envelope);
    await expect(
      enqueuePlatformJob(queue, { ...envelope, schemaVersion: 2 }),
    ).rejects.toThrow();
    expect(queue.send).toHaveBeenCalledTimes(1);
  });

  it('delegates each platform queue message to application orchestration and acknowledges success', async () => {
    const message = createMessage(envelope);
    const orchestrateQueueMessage = vi.fn(async () => 'ack' as const);
    const entrypoint = createAsyncEntrypoint({ orchestrateQueueMessage });

    await entrypoint.queue(createBatch([message]), bindings, executionContext);

    expect(orchestrateQueueMessage).toHaveBeenCalledWith({
      env: bindings,
      executionContext,
      message,
    });
    expect(message.ack).toHaveBeenCalledOnce();
    expect(message.retry).not.toHaveBeenCalled();
  });

  it('retries a message when application orchestration returns retry', async () => {
    const message = createMessage(envelope);
    const entrypoint = createAsyncEntrypoint({
      orchestrateQueueMessage: async () => 'retry' as const,
    });

    await entrypoint.queue(createBatch([message]), bindings, executionContext);

    expect(message.retry).toHaveBeenCalledOnce();
    expect(message.ack).not.toHaveBeenCalled();
  });

  it('retries a message when orchestration throws or is unavailable', async () => {
    const failedMessage = createMessage(envelope);
    const throwingEntrypoint = createAsyncEntrypoint({
      orchestrateQueueMessage: async () => {
        throw new Error('dependency unavailable');
      },
    });
    await throwingEntrypoint.queue(
      createBatch([failedMessage]),
      bindings,
      executionContext,
    );
    expect(failedMessage.retry).toHaveBeenCalledOnce();
    expect(failedMessage.ack).not.toHaveBeenCalled();

    const unavailableMessage = createMessage(envelope);
    await createAsyncEntrypoint().queue(
      createBatch([unavailableMessage]),
      bindings,
      executionContext,
    );
    expect(unavailableMessage.retry).toHaveBeenCalledOnce();
    expect(unavailableMessage.ack).not.toHaveBeenCalled();
  });

  it('fails closed for a queue that is not the registered platform queue', async () => {
    const message = createMessage(envelope);
    const orchestrateQueueMessage = vi.fn(async () => 'ack' as const);
    const entrypoint = createAsyncEntrypoint({ orchestrateQueueMessage });

    await entrypoint.queue(
      createBatch([message], 'unregistered-queue'),
      bindings,
      executionContext,
    );

    expect(orchestrateQueueMessage).not.toHaveBeenCalled();
    expect(message.retry).toHaveBeenCalledOnce();
    expect(message.ack).not.toHaveBeenCalled();
  });

  it('delegates the one-minute scheduled sweep and leaves Cloudflare retries enabled', async () => {
    const controller = {
      cron: '* * * * *',
      scheduledTime: 1_756_560_000_000,
    };
    const sweepOutbox = vi.fn(async () => 'completed' as const);
    const entrypoint = createAsyncEntrypoint({ sweepOutbox });

    await entrypoint.scheduled(controller, bindings, executionContext);

    expect(sweepOutbox).toHaveBeenCalledWith({
      controller,
      env: bindings,
      executionContext,
    });
  });

  it('throws when the scheduled sweep is unavailable or requests retry', async () => {
    const controller = {
      cron: '* * * * *',
      scheduledTime: 1_756_560_000_000,
    };

    await expect(
      createAsyncEntrypoint().scheduled(controller, bindings, executionContext),
    ).rejects.toThrow();
    await expect(
      createAsyncEntrypoint({
        sweepOutbox: async () => 'retry' as const,
      }).scheduled(controller, bindings, executionContext),
    ).rejects.toThrow();
  });
});
