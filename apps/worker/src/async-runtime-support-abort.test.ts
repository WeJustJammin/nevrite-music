import { describe, expect, it, vi } from 'vitest';

import {
  AsyncRpcDependencyError,
  createSupabaseRpc,
} from './async-runtime-support';
import type { AsyncWorkerBindings } from './async-entrypoint';

const bindings: AsyncWorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'abort-coverage',
  PLATFORM_JOBS: { send: vi.fn() },
  SUPABASE_SECRET_KEY: 'secret',
  SUPABASE_URL: 'https://staging.example.supabase.co',
};

describe('async RPC pre-abort handling', () => {
  it('rejects before invoking fetch when the caller signal is already aborted', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const rpc = createSupabaseRpc(fetcher);
    const controller = new AbortController();
    controller.abort();

    await expect(
      rpc(bindings, 'read_restore_fence', {}, controller.signal),
    ).rejects.toEqual(
      expect.objectContaining<Partial<AsyncRpcDependencyError>>({
        code: 'DEPENDENCY_UNAVAILABLE',
        name: 'AsyncRpcDependencyError',
        reason: 'timeout',
        retryable: true,
      }),
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
});
