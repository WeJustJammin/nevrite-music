/**
 * The only cross-tab/realtime message allowed for the protected registry is
 * an invalidation hint. It deliberately carries no IDs, versions, rows, or
 * error payload; every recipient performs its own authorized canonical read.
 */
export const CONTENT_SCHEMA_REGISTRY_INVALIDATION_TYPE =
  'content-schema-registry.invalidate' as const;

export interface ContentSchemaRegistryInvalidationHint {
  readonly type: typeof CONTENT_SCHEMA_REGISTRY_INVALIDATION_TYPE;
}

export const createContentSchemaRegistryInvalidationHint =
  (): ContentSchemaRegistryInvalidationHint => ({
    type: CONTENT_SCHEMA_REGISTRY_INVALIDATION_TYPE,
  });

export const isContentSchemaRegistryInvalidationHint = (
  value: unknown,
): value is ContentSchemaRegistryInvalidationHint =>
  typeof value === 'object' &&
  value !== null &&
  Object.keys(value).length === 1 &&
  (value as { readonly type?: unknown }).type ===
    CONTENT_SCHEMA_REGISTRY_INVALIDATION_TYPE;

export interface ContentSchemaRegistryInvalidationChannel {
  readonly postMessage: (
    message: ContentSchemaRegistryInvalidationHint,
  ) => void;
  readonly addEventListener: (
    type: 'message',
    listener: (event: { readonly data: unknown }) => void,
  ) => void;
  readonly removeEventListener: (
    type: 'message',
    listener: (event: { readonly data: unknown }) => void,
  ) => void;
  readonly close?: () => void;
}

export interface ContentSchemaRegistryInvalidationSubscription {
  readonly channel: ContentSchemaRegistryInvalidationChannel | null;
  readonly unsubscribe: () => void;
}

/** Publish only a metadata-free invalidation signal. */
export const publishContentSchemaRegistryInvalidation = (
  channel: ContentSchemaRegistryInvalidationChannel,
): void => {
  channel.postMessage(createContentSchemaRegistryInvalidationHint());
};

/**
 * Subscribe to BroadcastChannel invalidations. A valid hint invokes the
 * supplied canonical refetch callback; malformed or data-bearing messages are
 * ignored. No message is retained or applied as client state.
 */
export const subscribeContentSchemaRegistryInvalidation = (input: {
  readonly onInvalidate: () => void | Promise<void>;
  readonly channel?: ContentSchemaRegistryInvalidationChannel | undefined;
  readonly channelName?: string;
}): ContentSchemaRegistryInvalidationSubscription => {
  let channel = input.channel ?? null;
  let ownsChannel = false;
  if (channel === null && typeof globalThis !== 'undefined') {
    const candidate = globalThis as typeof globalThis & {
      readonly BroadcastChannel?: new (
        name: string,
      ) => ContentSchemaRegistryInvalidationChannel;
    };
    if (candidate.BroadcastChannel !== undefined) {
      try {
        channel = new candidate.BroadcastChannel(
          input.channelName ?? 'wejammin-content-schema-registry',
        );
        ownsChannel = true;
      } catch {
        channel = null;
      }
    }
  }
  if (channel === null) return { channel: null, unsubscribe: () => undefined };
  const listener = (event: { readonly data: unknown }): void => {
    if (isContentSchemaRegistryInvalidationHint(event.data)) {
      void input.onInvalidate();
    }
  };
  channel.addEventListener('message', listener);
  return {
    channel,
    unsubscribe: () => {
      channel?.removeEventListener('message', listener);
      if (ownsChannel) channel?.close?.();
    },
  };
};

/** Realtime adapters may feed the same metadata-only invalidation contract. */
export const bindContentSchemaRegistryRealtimeInvalidation = (
  source: ContentSchemaRegistryInvalidationChannel,
  onInvalidate: () => void | Promise<void>,
): (() => void) =>
  subscribeContentSchemaRegistryInvalidation({
    channel: source,
    onInvalidate,
  }).unsubscribe;
