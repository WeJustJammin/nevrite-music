import { describe, expect, it, vi } from 'vitest';

import {
  ASYNC_RPC_MAX_RESPONSE_BYTES,
  createSupabaseRpc,
} from './async-runtime-support';
import type { AsyncWorkerBindings } from './async-entrypoint';

const bindings = (): AsyncWorkerBindings => ({
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'test',
  PLATFORM_JOBS: {
    send: vi.fn(async () => ({
      metadata: { metrics: { backlogBytes: 0, backlogCount: 0 } },
    })),
  },
  SUPABASE_SECRET_KEY: 'secret',
  SUPABASE_URL: 'https://staging.example.supabase.co',
});

const responseWithReader = (reader: ReadableStreamDefaultReader<Uint8Array>) =>
  ({
    body: { getReader: () => reader },
    headers: { get: () => null },
    ok: true,
  }) as unknown as Response;

const settlesBeforeTimeout = async <T>(promise: Promise<T>): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('response read hung')), 100);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
};

describe('async runtime bounded-response cancellation', () => {
  it('does not await a never-settling cancel after zero progress', async () => {
    let emptyReads = 0;
    let cancelCalls = 0;
    const reader = {
      cancel: vi.fn(() => {
        cancelCalls += 1;
        return new Promise<void>(() => {});
      }),
      read: vi.fn(async () => {
        emptyReads += 1;
        return { done: false, value: new Uint8Array() };
      }),
      releaseLock: vi.fn(),
    } as unknown as ReadableStreamDefaultReader<Uint8Array>;
    const rpc = createSupabaseRpc(
      vi.fn(async () => responseWithReader(reader)),
    );

    await expect(
      settlesBeforeTimeout(rpc(bindings(), 'read_restore_fence', {})),
    ).rejects.toMatchObject({
      name: 'AsyncRpcManualReviewError',
      reason: 'malformed_response',
    });
    expect(emptyReads).toBe(1025);
    expect(cancelCalls).toBe(1);
    expect(reader.releaseLock).toHaveBeenCalledOnce();
  });

  it('does not await a never-settling cancel after exceeding the body cap', async () => {
    let cancelCalls = 0;
    const reader = {
      cancel: vi.fn(() => {
        cancelCalls += 1;
        return new Promise<void>(() => {});
      }),
      read: vi.fn(async () => ({
        done: false,
        value: new Uint8Array(ASYNC_RPC_MAX_RESPONSE_BYTES + 1),
      })),
      releaseLock: vi.fn(),
    } as unknown as ReadableStreamDefaultReader<Uint8Array>;
    const rpc = createSupabaseRpc(
      vi.fn(async () => responseWithReader(reader)),
    );

    await expect(
      settlesBeforeTimeout(rpc(bindings(), 'read_restore_fence', {})),
    ).rejects.toMatchObject({
      name: 'AsyncRpcManualReviewError',
      reason: 'response_too_large',
    });
    expect(cancelCalls).toBe(1);
    expect(reader.releaseLock).toHaveBeenCalledOnce();
  });
});
