// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getClientBindingId } from '../../lib/client-binding';
import { createMemoryLockManager } from '../../lib/test-support/memory-lock-manager';
import { MemoryStorage } from '../../lib/test-support/memory-storage';
import { executeContentSchemaRegistryMutation } from './content-schema-registry-runtime';
import { executeContentSchemaRegistryRead } from './content-schema-registry-runtime-read';

let locks = createMemoryLockManager();

beforeEach(() => {
  locks = createMemoryLockManager();
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    value: new MemoryStorage(),
  });
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: locks.manager,
  });
});

afterEach(() => {
  window.dispatchEvent(new Event('pagehide'));
  locks.releaseAll();
  window.dispatchEvent(new Event('pageshow'));
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('CMS browser requests carry the tab binding selector', () => {
  it('adds the same tab identifier to canonical reads', async () => {
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push(init === undefined ? { input } : { input, init });
        return new Response('<html></html>');
      },
    );

    await executeContentSchemaRegistryRead({
      url: '/app/cms-content-modeling',
      fetcher,
      sleep: async () => undefined,
    });

    expect(fetcher).toHaveBeenCalledOnce();
    const init = calls[0]?.init;
    expect(new Headers(init?.headers).get('x-client-binding-id')).toBe(
      await getClientBindingId(),
    );
  });

  it('adds the tab identifier to enhanced same-origin mutations', async () => {
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push(init === undefined ? { input } : { input, init });
        return new Response('{"code":"INVALID_REQUEST"}', {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      },
    );
    const formData = new FormData();
    formData.set('idempotency-key', 'idempotency-cms-01');

    await executeContentSchemaRegistryMutation({
      action: '/app/cms-content-modeling',
      operationId: 'CMS-03A-01',
      formData,
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledOnce();
    const init = calls[0]?.init;
    expect(new Headers(init?.headers).get('x-client-binding-id')).toBe(
      await getClientBindingId(),
    );
  });
});
