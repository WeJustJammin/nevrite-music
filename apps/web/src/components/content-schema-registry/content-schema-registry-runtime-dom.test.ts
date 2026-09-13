// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createContentSchemaRegistryInvalidationHint,
  type ContentSchemaRegistryInvalidationChannel,
} from './content-schema-registry-invalidation';
import {
  ACTING_CONTEXT_CHANGED_EVENT,
  CLIENT_BINDING_ID_STORAGE_KEY,
} from '../../lib/client-binding';
import { createMemoryLockManager } from '../../lib/test-support/memory-lock-manager';
import {
  installContentSchemaRegistryCanonicalRefetch,
  refetchContentSchemaRegistryCanonical,
} from './content-schema-registry-runtime-dom';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, String(value));
  }
}

const originalSessionStorage = Object.getOwnPropertyDescriptor(
  window,
  'sessionStorage',
);
const originalNavigatorLocks = Object.getOwnPropertyDescriptor(
  navigator,
  'locks',
);

class FakeChannel implements ContentSchemaRegistryInvalidationChannel {
  private listener: ((event: { readonly data: unknown }) => void) | null = null;

  postMessage(): void {}

  addEventListener(
    _type: 'message',
    listener: (event: { readonly data: unknown }) => void,
  ): void {
    this.listener = listener;
  }

  removeEventListener(
    _type: 'message',
    listener: (event: { readonly data: unknown }) => void,
  ): void {
    if (this.listener === listener) this.listener = null;
  }

  close(): void {}

  emit(data: unknown): void {
    this.listener?.({ data });
  }
}

let channel: FakeChannel;
let lockManager: ReturnType<typeof createMemoryLockManager> | null = null;

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  if (lockManager !== null) {
    window.dispatchEvent(new Event('pagehide'));
    lockManager.releaseAll();
    window.dispatchEvent(new Event('pageshow'));
    lockManager = null;
  }
  if (originalNavigatorLocks === undefined)
    Reflect.deleteProperty(navigator, 'locks');
  else Object.defineProperty(navigator, 'locks', originalNavigatorLocks);
  if (originalSessionStorage === undefined)
    Reflect.deleteProperty(window, 'sessionStorage');
  else Object.defineProperty(window, 'sessionStorage', originalSessionStorage);
  document.body.replaceChildren();
});

describe('content schema registry DOM refetch bridge', () => {
  it('performs one immediate canonical client read with this tab binding on mount', async () => {
    vi.useFakeTimers();
    document.body.innerHTML =
      '<main><section data-workbench="content-schema-registry"></section></main>';
    window.history.replaceState({}, '', '/app/cms-content-modeling');
    const clientBindingId = '99999999-9999-4999-8999-999999999999';
    const tabStorage = new MemoryStorage();
    tabStorage.setItem(CLIENT_BINDING_ID_STORAGE_KEY, clientBindingId);
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: tabStorage,
    });
    lockManager = createMemoryLockManager();
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: lockManager.manager,
    });
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push(init === undefined ? { input } : { input, init });
        return new Response(
          '<html><head><title>Canonical CMS</title></head><body><main><section data-workbench="content-schema-registry"></section></main></body></html>',
          { status: 200 },
        );
      },
    );
    vi.stubGlobal('fetch', fetcher);
    const cleanup = installContentSchemaRegistryCanonicalRefetch(
      document,
      '/app/cms-content-modeling',
      (reason) =>
        refetchContentSchemaRegistryCanonical({
          document,
          canonicalUrl: '/app/cms-content-modeling',
          reason,
        }),
    );

    await vi.runAllTimersAsync();
    await vi.runAllTimersAsync();

    expect(fetcher).toHaveBeenCalledOnce();
    expect(calls[0]?.input).toBe('/app/cms-content-modeling');
    expect(calls[0]?.init?.method).toBe('GET');
    expect(
      new Headers(calls[0]?.init?.headers).get('x-client-binding-id'),
    ).toBe(clientBindingId);
    expect(document.title).toBe('Canonical CMS');
    cleanup();
  });

  it('re-reads canonical CMS state when the acting context changes in this tab', async () => {
    vi.useFakeTimers();
    document.body.innerHTML =
      '<section data-workbench="content-schema-registry"></section>';
    const onRefetch = vi.fn();
    const cleanup = installContentSchemaRegistryCanonicalRefetch(
      document,
      '/app/cms-content-modeling',
      onRefetch,
    );

    window.dispatchEvent(new CustomEvent(ACTING_CONTEXT_CHANGED_EVENT));
    await vi.runAllTimersAsync();

    expect(onRefetch).toHaveBeenCalledOnce();
    expect(onRefetch).toHaveBeenCalledWith('list-read');
    cleanup();
  });

  it.each([
    ['/app/cms-content-modeling', 'list-read'],
    [
      '/app/cms-content-modeling/018f0c45-73fe-7dc2-9c09-68f7ecf132d8/versions/018f0c45-73fe-7dc2-9c09-68f7ecf132db',
      'detail-read',
    ],
  ] as const)(
    'preserves %s invalidation and reconnect reasons',
    async (url, readReason) => {
      vi.useFakeTimers();
      document.body.innerHTML =
        '<section data-workbench="content-schema-registry"></section>';
      channel = new FakeChannel();
      vi.stubGlobal(
        'BroadcastChannel',
        class {
          constructor() {
            return channel;
          }
        },
      );
      const onRefetch = vi.fn();
      const cleanup = installContentSchemaRegistryCanonicalRefetch(
        document,
        url,
        onRefetch,
      );

      window.dispatchEvent(new Event('offline'));
      expect(
        document.querySelector('[data-cms-offline-status]'),
      ).not.toBeNull();
      channel.emit(createContentSchemaRegistryInvalidationHint());
      await vi.runAllTimersAsync();

      expect(onRefetch.mock.calls.map(([reason]) => reason)).toEqual([
        readReason,
      ]);
      window.dispatchEvent(new Event('online'));
      await vi.runAllTimersAsync();
      expect(onRefetch.mock.calls.map(([reason]) => reason)).toEqual([
        readReason,
        'reconnect',
      ]);
      cleanup();
      expect(document.querySelector('[data-cms-offline-status]')).toBeNull();
      channel.emit(createContentSchemaRegistryInvalidationHint());
      await vi.runAllTimersAsync();
      expect(onRefetch).toHaveBeenCalledTimes(2);
    },
  );

  it('coalesces invalidations and reconnect while a canonical refetch is in flight', async () => {
    vi.useFakeTimers();
    document.body.innerHTML =
      '<section data-workbench="content-schema-registry"></section>';
    channel = new FakeChannel();
    vi.stubGlobal(
      'BroadcastChannel',
      class {
        constructor() {
          return channel;
        }
      },
    );
    let resolveFirst: (() => void) | undefined;
    type RefetchReason = 'list-read' | 'detail-read' | 'mutation' | 'reconnect';
    const onRefetch = vi.fn((...args: [RefetchReason]) => {
      void args;
      if (onRefetch.mock.calls.length === 1)
        return new Promise<void>((resolve) => {
          resolveFirst = resolve;
        });
      return Promise.resolve();
    });
    const cleanup = installContentSchemaRegistryCanonicalRefetch(
      document,
      '/app/cms-content-modeling',
      onRefetch,
    );

    channel.emit(createContentSchemaRegistryInvalidationHint());
    vi.runOnlyPendingTimers();
    await Promise.resolve();
    expect(onRefetch).toHaveBeenCalledWith('list-read');
    expect(onRefetch).toHaveBeenCalledTimes(1);

    channel.emit(createContentSchemaRegistryInvalidationHint());
    window.dispatchEvent(new Event('online'));
    channel.emit(createContentSchemaRegistryInvalidationHint());
    vi.runOnlyPendingTimers();
    expect(onRefetch).toHaveBeenCalledTimes(1);

    resolveFirst?.();
    await vi.runAllTimersAsync();
    expect(onRefetch.mock.calls.map(([reason]) => reason)).toEqual([
      'list-read',
      'reconnect',
    ]);
    cleanup();
  });
});
