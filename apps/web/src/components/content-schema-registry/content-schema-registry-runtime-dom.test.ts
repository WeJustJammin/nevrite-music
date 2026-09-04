// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createContentSchemaRegistryInvalidationHint,
  type ContentSchemaRegistryInvalidationChannel,
} from './content-schema-registry-invalidation';
import { installContentSchemaRegistryCanonicalRefetch } from './content-schema-registry-runtime-dom';

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

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('content schema registry DOM refetch bridge', () => {
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
