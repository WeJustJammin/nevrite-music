import {
  JobIdPathSchema,
  JobInvalidationHintSchema,
  type JobInvalidationHint,
} from '@wejammin/contracts';

export const SUPABASE_JOB_REALTIME_TOPIC_PREFIX = 'realtime:job:';
const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000;

export interface SupabaseJobRealtimeConfig {
  readonly jobId: string;
  readonly supabaseUrl: string;
  readonly publishableKey: string;
  /** A short-lived token from the server-owned auth/session integration. */
  readonly accessToken: string;
  readonly topicPrefix?: string;
  readonly heartbeatIntervalMs?: number;
}

export type JobHintSubscriber = (
  listener: (value: JobInvalidationHint) => void,
) => () => void;

export interface JobRealtimeSocket {
  readonly readyState: number;
  readonly addEventListener: (
    type: 'open' | 'message' | 'close' | 'error',
    listener: (event: { readonly data?: unknown }) => void,
  ) => void;
  readonly removeEventListener: (
    type: 'open' | 'message' | 'close' | 'error',
    listener: (event: { readonly data?: unknown }) => void,
  ) => void;
  readonly send: (value: string) => void;
  readonly close: () => void;
}

export type JobRealtimeSocketConstructor = new (
  url: string,
) => JobRealtimeSocket;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasControlCharacter = (value: string): boolean =>
  [...value].some((character) => {
    const code = character.codePointAt(0);
    return (
      code !== undefined &&
      (code <= 0x1f || code === 0x7f || (code >= 0x80 && code <= 0x9f))
    );
  });

const normalizedConfig = (
  config: SupabaseJobRealtimeConfig,
): SupabaseJobRealtimeConfig | null => {
  if (
    !isRecord(config) ||
    typeof config.jobId !== 'string' ||
    typeof config.supabaseUrl !== 'string' ||
    typeof config.publishableKey !== 'string' ||
    typeof config.accessToken !== 'string'
  ) {
    return null;
  }
  if (
    !JobIdPathSchema.safeParse({ jobId: config.jobId }).success ||
    config.publishableKey.length === 0 ||
    config.accessToken.length === 0 ||
    hasControlCharacter(config.publishableKey) ||
    hasControlCharacter(config.accessToken)
  ) {
    return null;
  }
  const topicPrefix = config.topicPrefix;
  if (
    topicPrefix !== undefined &&
    (typeof topicPrefix !== 'string' ||
      topicPrefix.length === 0 ||
      hasControlCharacter(topicPrefix))
  ) {
    return null;
  }
  try {
    const parsed = new URL(config.supabaseUrl);
    if (
      (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
      parsed.username !== '' ||
      parsed.password !== ''
    ) {
      return null;
    }
  } catch {
    return null;
  }
  const heartbeatIntervalMs = config.heartbeatIntervalMs;
  if (
    heartbeatIntervalMs !== undefined &&
    (!Number.isSafeInteger(heartbeatIntervalMs) || heartbeatIntervalMs < 10_000)
  ) {
    return null;
  }
  return {
    ...config,
    topicPrefix: topicPrefix ?? SUPABASE_JOB_REALTIME_TOPIC_PREFIX,
    heartbeatIntervalMs: heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS,
  };
};

const trustedServerConfigs = new WeakSet<object>();

/**
 * Creates the only realtime configuration accepted from server locals.
 * The access token must come from a server-owned, short-lived session
 * integration; this helper never derives one from browser input.
 */
export const createServerSupabaseJobRealtimeConfig = (
  config: SupabaseJobRealtimeConfig,
): SupabaseJobRealtimeConfig => {
  const normalized = normalizedConfig(config);
  if (normalized === null)
    throw new TypeError('Invalid server Supabase realtime configuration');
  const trusted = Object.freeze(normalized);
  trustedServerConfigs.add(trusted);
  return trusted;
};

/** Structural lookalikes in Astro.locals cannot enable a production socket. */
export const readServerSupabaseJobRealtimeConfig = (
  locals: unknown,
): SupabaseJobRealtimeConfig | undefined => {
  if (!isRecord(locals)) return undefined;
  const candidate = locals.serverInfrastructureRealtime;
  return isRecord(candidate) && trustedServerConfigs.has(candidate)
    ? (candidate as unknown as SupabaseJobRealtimeConfig)
    : undefined;
};

export const supabaseRealtimeWebSocketUrl = (
  config: SupabaseJobRealtimeConfig,
): string | null => {
  const normalized = normalizedConfig(config);
  if (normalized === null) return null;
  const parsed = new URL(normalized.supabaseUrl);
  parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
  parsed.pathname = `${parsed.pathname.replace(/\/$/u, '')}/realtime/v1/websocket`;
  parsed.search = '';
  parsed.searchParams.set('apikey', normalized.publishableKey);
  parsed.searchParams.set('vsn', '1.0.0');
  return parsed.toString();
};

export const parseSupabaseJobHint = (
  value: unknown,
  expectedJobId: string,
): JobInvalidationHint | null => {
  if (!isRecord(value) || value.event !== 'broadcast') return null;
  let payload: unknown = value.payload;
  if (isRecord(payload) && 'payload' in payload) payload = payload.payload;
  const parsed = JobInvalidationHintSchema.safeParse(payload);
  return parsed.success && parsed.data.entityId === expectedJobId
    ? parsed.data
    : null;
};

const defaultSocketConstructor = (): JobRealtimeSocketConstructor | null => {
  const candidate = globalThis.WebSocket;
  return typeof candidate === 'function'
    ? (candidate as unknown as JobRealtimeSocketConstructor)
    : null;
};

/**
 * Production seam for identifier/version-only Supabase broadcasts. It stays
 * disabled when browser auth has not supplied a short-lived token; this
 * adapter does not claim a live channel without the matching DB policy and
 * broadcast trigger.
 */
export const createSupabaseJobHintSubscriber = (
  config: SupabaseJobRealtimeConfig,
  socketConstructor?: JobRealtimeSocketConstructor,
): JobHintSubscriber | undefined => {
  const normalized = normalizedConfig(config);
  const url =
    normalized === null ? null : supabaseRealtimeWebSocketUrl(normalized);
  if (normalized === null || url === null) return undefined;
  const topic = `${normalized.topicPrefix}${normalized.jobId}`;

  return (listener) => {
    const Constructor = socketConstructor ?? defaultSocketConstructor();
    if (Constructor === null) return () => undefined;
    const socket = new Constructor(url);
    let reference = 1;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    const send = (
      event: string,
      payload: Record<string, unknown>,
      topicName = topic,
    ) => {
      socket.send(
        JSON.stringify({
          topic: topicName,
          event,
          payload,
          ref: String(reference++),
        }),
      );
    };
    const onOpen = (): void => {
      send('phx_join', {
        access_token: normalized.accessToken,
        config: { broadcast: { self: false }, private: true },
      });
      heartbeat = setInterval(() => {
        if (socket.readyState === 1) send('heartbeat', {}, 'phoenix');
      }, normalized.heartbeatIntervalMs);
    };
    const onMessage = (event: { readonly data?: unknown }): void => {
      if (typeof event.data !== 'string') return;
      try {
        const frame = JSON.parse(event.data) as unknown;
        if (!isRecord(frame) || frame.topic !== topic) return;
        const hint = parseSupabaseJobHint(frame, normalized.jobId);
        if (hint !== null) listener(hint);
      } catch {
        // Malformed or canonical-looking frames are ignored and never applied.
      }
    };
    const onClose = (): void => {
      if (heartbeat !== undefined) clearInterval(heartbeat);
    };
    socket.addEventListener('open', onOpen);
    socket.addEventListener('message', onMessage);
    socket.addEventListener('close', onClose);
    return () => {
      if (heartbeat !== undefined) clearInterval(heartbeat);
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('message', onMessage);
      socket.removeEventListener('close', onClose);
      socket.close();
    };
  };
};
