import {
  PositiveBigintDecimalSchema,
  QueueEnvelopeSchema,
  type QueueEnvelope,
} from '@wejammin/contracts';
import {
  type CanonicalJob,
  type JobEffectPort,
  type JobLeaseClaimRequest,
  type JobLeaseClaimResult,
  type JobPersistencePort,
} from '@wejammin/application';
import type {
  AsyncWorkerBindings,
  PlatformJobsMessage,
} from './async-entrypoint';
import { parseRestoreFence } from './async-runtime-fence';
import type { SchemaMigrationRpcName } from './content-schema-registry/migration-worker';

export { parseRestoreFence } from './async-runtime-fence';
export type AsyncRpcOperation =
  | 'claim_outbox_batch'
  | 'complete_outbox_event'
  | 'read_canonical_job'
  | 'read_restore_fence'
  | 'claim_job'
  | 'heartbeat_job_lease'
  | 'apply_job_outcome'
  | 'record_processed_event'
  | SchemaMigrationRpcName;
export const PLATFORM_API_PROFILE = 'platform_api' as const;
export type AsyncRpcEnvironment = Pick<
  AsyncWorkerBindings,
  'SUPABASE_URL' | 'SUPABASE_SECRET_KEY'
>;
export type AsyncRpcClient = <T>(
  env: AsyncRpcEnvironment,
  operation: AsyncRpcOperation,
  input: Record<string, unknown>,
  signal?: AbortSignal,
) => Promise<T>;
export type AsyncJobRuntimeDependencies = Readonly<{
  rpc?: AsyncRpcClient;
  fetch?: typeof fetch;
  effect?: JobEffectPort['execute'];
  leaseToken?: (message: PlatformJobsMessage) => string;
  outboxLeaseToken?: () => string;
  leaseSeconds?: number;
  maxOutboxClaims?: number;
  now?: () => number;
}>;
export type ClaimedOutbox = Readonly<{
  outboxId: string;
  leaseToken: string;
  envelope: QueueEnvelope;
}>;
const UuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const JobTypePattern = /^[a-z][a-z0-9_.-]{0,63}$/;
const VersionPattern = /^[1-9]\d{0,18}$/;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const firstRow = (value: unknown): unknown =>
  Array.isArray(value) ? (value.length === 1 ? value[0] : null) : value;
const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UuidPattern.test(value);
export const toVersion = (value: unknown): string | null => {
  if (typeof value === 'string') {
    if (!VersionPattern.test(value)) return null;
    return PositiveBigintDecimalSchema.safeParse(value).success ? value : null;
  }
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return String(value);
  }
  return null;
};
export const toTimeMs = (value: unknown): number | null => {
  if (value === null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }
  return null;
};
export const parseCanonicalJob = (value: unknown): CanonicalJob | null => {
  const row = firstRow(value);
  if (!isRecord(row)) return null;
  const id = row.id ?? row.job_id;
  const type = row.type ?? row.job_type;
  const version = toVersion(row.version);
  const leaseValue = row.leaseUntilMs ?? row.lease_until ?? null;
  if (
    !isUuid(id) ||
    typeof type !== 'string' ||
    !JobTypePattern.test(type) ||
    version === null ||
    !(
      row.state === 'queued' ||
      row.state === 'running' ||
      row.state === 'succeeded' ||
      row.state === 'failed' ||
      row.state === 'cancelled'
    )
  ) {
    return null;
  }
  const leaseUntilMs = toTimeMs(leaseValue);
  if (leaseValue !== null && leaseUntilMs === null) return null;
  return { id, type, state: row.state, version, leaseUntilMs };
};
export const parseLease = (
  value: unknown,
  request: JobLeaseClaimRequest,
): JobLeaseClaimResult => {
  const row = firstRow(value);
  if (!isRecord(row)) throw new Error('Invalid job lease');
  const jobId = row.jobId ?? row.job_id;
  const leaseToken = row.leaseToken ?? row.lease_token ?? request.leaseToken;
  const expectedVersion =
    row.expectedVersion ?? row.expected_version ?? request.expectedVersion;
  const version = toVersion(row.version);
  const leaseUntilMs = toTimeMs(row.leaseUntilMs ?? row.lease_until);
  const expected = toVersion(expectedVersion);
  if (
    !isUuid(jobId) ||
    !isUuid(leaseToken) ||
    expected === null ||
    version === null ||
    leaseUntilMs === null
  ) {
    throw new Error('Invalid job lease');
  }
  return {
    jobId,
    leaseToken,
    expectedVersion: expected,
    version,
    leaseUntilMs,
  };
};
export const parseOutboxClaim = (value: unknown): ClaimedOutbox | null => {
  if (!isRecord(value)) return null;
  const outboxId = value.outboxId ?? value.event_id;
  const eventId = value.eventId ?? value.event_id;
  const leaseToken = value.leaseToken ?? value.lease_token;
  const eventType = value.eventType ?? value.event_type;
  const schemaVersion = value.schemaVersion ?? value.schema_version;
  const aggregateType = value.aggregateType ?? value.aggregate_type;
  const aggregateId = value.aggregateId ?? value.aggregate_id;
  const aggregateVersion = value.aggregateVersion ?? value.aggregate_version;
  const correlationId = value.correlationId ?? value.correlation_id;
  const causationId = value.causationId ?? value.causation_id ?? null;
  const version = toVersion(aggregateVersion);
  if (
    !isUuid(outboxId) ||
    !isUuid(eventId) ||
    !isUuid(leaseToken) ||
    eventType !== 'job.requested' ||
    schemaVersion !== 1 ||
    aggregateType !== 'job' ||
    !isUuid(aggregateId) ||
    version === null ||
    !isUuid(correlationId) ||
    (causationId !== null && !isUuid(causationId))
  ) {
    return null;
  }
  const envelope = QueueEnvelopeSchema.parse({
    aggregateId,
    aggregateType,
    aggregateVersion: version,
    causationId,
    correlationId,
    eventId,
    eventType,
    schemaVersion,
  });
  return { envelope, leaseToken, outboxId };
};
export const parseBoolean = (value: unknown, message: string): boolean => {
  if (typeof value !== 'boolean') throw new Error(message);
  return value;
};
const normalizeRpcVersion = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const unquoted =
    value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;
  return toVersion(unquoted);
};
const createPersistence = (
  env: AsyncWorkerBindings,
  rpc: AsyncRpcClient,
): Pick<
  JobPersistencePort,
  | 'readCanonicalJob'
  | 'readRestoreFence'
  | 'claimJobLease'
  | 'heartbeatJobLease'
  | 'applyJobOutcome'
  | 'recordProcessedEvent'
> => ({
  readCanonicalJob: async (jobId) =>
    parseCanonicalJob(
      await rpc(env, 'read_canonical_job', { p_job_id: jobId }),
    ),
  readRestoreFence: async () =>
    parseRestoreFence(await rpc(env, 'read_restore_fence', {})),
  claimJobLease: async (input) => {
    const value = await rpc<unknown>(env, 'claim_job', {
      p_job_id: input.jobId,
      p_expected_version: input.expectedVersion,
      p_lease_token: input.leaseToken,
      p_lease_seconds: input.leaseSeconds,
    });
    if (value === null || (Array.isArray(value) && value.length === 0)) {
      return null;
    }
    return parseLease(value, input);
  },
  heartbeatJobLease: async (input) =>
    parseBoolean(
      await rpc(env, 'heartbeat_job_lease', {
        p_job_id: input.jobId,
        p_expected_version: input.expectedVersion,
        p_lease_token: input.leaseToken,
        p_lease_seconds: input.leaseSeconds,
      }),
      'Invalid heartbeat result',
    ),
  applyJobOutcome: async (input) => {
    if (input.nextState === 'pending_manual_review') return false;
    const expectedVersion = normalizeRpcVersion(input.expectedVersion);
    if (expectedVersion === null) return false;
    return parseBoolean(
      await rpc(env, 'apply_job_outcome', {
        p_job_id: input.jobId,
        p_expected_version: expectedVersion,
        p_lease_token: input.leaseToken,
        p_next_state: input.nextState,
        p_result_ref: input.resultRef,
        p_error_code: input.errorCode,
        p_retryable: input.retryable,
      }),
      'Invalid outcome result',
    );
  },
  recordProcessedEvent: async (input) => {
    const value = await rpc<unknown>(env, 'record_processed_event', {
      p_event_id: input.eventId,
      p_event_type: input.eventType,
      p_schema_version: input.schemaVersion,
      p_aggregate_id: input.aggregateId,
      p_pending_manual_review: input.pendingManualReview,
    });
    const result = firstRow(value);
    if (result !== 'recorded' && result !== 'duplicate') {
      throw new Error('Invalid processed-event result');
    }
    return result;
  },
});
export const createJobPersistence = createPersistence;

/** BE00 caps every ordinary JSON response at 256 KiB. */
export const ASYNC_RPC_MAX_RESPONSE_BYTES = 256 * 1024;
/** Async RPCs are bounded by the protected-command deadline. */
export const ASYNC_RPC_DEADLINE_MS = 15_000;

export type AsyncRpcTransportFailureReason =
  | 'timeout'
  | 'request_failed'
  | 'http_error'
  | 'invalid_content_length'
  | 'response_too_large'
  | 'body_read_failed'
  | 'invalid_utf8'
  | 'malformed_json'
  | 'malformed_response';

export type AsyncRpcTransportFailureCode =
  'DEPENDENCY_UNAVAILABLE' | 'MANUAL_REVIEW';

/**
 * Safe, typed failure from the Supabase RPC transport. The reason is
 * diagnostic-only; no dependency payload or response bytes are retained.
 */
export class AsyncRpcTransportError extends Error {
  readonly code: AsyncRpcTransportFailureCode;
  readonly errorCode: AsyncRpcTransportFailureCode;
  readonly retryable: boolean;
  readonly disposition: 'dependency_unavailable' | 'manual_review';

  constructor(
    readonly reason: AsyncRpcTransportFailureReason,
    disposition: 'dependency_unavailable' | 'manual_review',
  ) {
    super(
      disposition === 'manual_review'
        ? 'Supabase RPC response requires manual review.'
        : 'Supabase RPC dependency is unavailable.',
    );
    this.name = 'AsyncRpcTransportError';
    this.code =
      disposition === 'manual_review'
        ? 'MANUAL_REVIEW'
        : 'DEPENDENCY_UNAVAILABLE';
    this.errorCode = this.code;
    this.retryable = disposition === 'dependency_unavailable';
    this.disposition = disposition;
  }
}

export class AsyncRpcDependencyError extends AsyncRpcTransportError {
  constructor(reason: AsyncRpcTransportFailureReason) {
    super(reason, 'dependency_unavailable');
    this.name = 'AsyncRpcDependencyError';
  }
}

export class AsyncRpcManualReviewError extends AsyncRpcTransportError {
  constructor(reason: AsyncRpcTransportFailureReason) {
    super(reason, 'manual_review');
    this.name = 'AsyncRpcManualReviewError';
  }
}

export type AsyncRpcClientOptions = Readonly<{
  deadlineMs?: number;
  maxResponseBytes?: number;
}>;

const responseLength = (
  response: Response,
  maxResponseBytes: number,
): number | null => {
  let value: string | null;
  try {
    value = response.headers.get('content-length');
  } catch {
    throw new AsyncRpcManualReviewError('malformed_response');
  }
  if (value === null) return null;
  if (!/^\d+$/.test(value)) {
    throw new AsyncRpcManualReviewError('invalid_content_length');
  }
  const length = Number(value);
  if (!Number.isSafeInteger(length)) {
    throw new AsyncRpcManualReviewError('invalid_content_length');
  }
  if (length > maxResponseBytes) {
    void response.body?.cancel().catch(() => undefined);
    throw new AsyncRpcManualReviewError('response_too_large');
  }
  return length;
};

const readBoundedResponse = async (
  response: Response,
  maxResponseBytes: number,
  signal: AbortSignal,
): Promise<Uint8Array> => {
  if (response.body === null) return new Uint8Array();

  let reader: ReadableStreamDefaultReader<Uint8Array>;
  try {
    reader = response.body.getReader();
  } catch {
    throw new AsyncRpcManualReviewError('malformed_response');
  }
  // Keep response storage bounded even when a peer emits many tiny chunks.
  const body = new Uint8Array(maxResponseBytes);
  let total = 0;
  let emptyChunkCount = 0;
  const maxEmptyChunks = 1024;
  let wasAborted = false;
  let rejectAbort: ((reason?: unknown) => void) | undefined;
  const aborted = new Promise<never>((_, reject) => {
    rejectAbort = reject;
  });
  void aborted.catch(() => undefined);

  const onAbort = () => {
    wasAborted = true;
    rejectAbort?.(new AsyncRpcDependencyError('timeout'));
    void reader.cancel().catch(() => undefined);
  };
  signal.addEventListener('abort', onAbort, { once: true });

  try {
    if (signal.aborted) {
      onAbort();
      throw new AsyncRpcDependencyError('timeout');
    }
    while (true) {
      let next: ReadableStreamReadResult<Uint8Array>;
      try {
        next = await Promise.race([reader.read(), aborted]);
      } catch (error) {
        if (wasAborted) throw new AsyncRpcDependencyError('timeout');
        if (error instanceof AsyncRpcTransportError) throw error;
        throw new AsyncRpcDependencyError('body_read_failed');
      }
      if (wasAborted) throw new AsyncRpcDependencyError('timeout');
      if (next.done) break;
      if (!(next.value instanceof Uint8Array)) {
        throw new AsyncRpcManualReviewError('malformed_response');
      }
      if (next.value.byteLength === 0) {
        emptyChunkCount += 1;
        if (emptyChunkCount > maxEmptyChunks) {
          void reader.cancel().catch(() => undefined);
          throw new AsyncRpcManualReviewError('malformed_response');
        }
      } else {
        emptyChunkCount = 0;
      }
      total += next.value.byteLength;
      if (!Number.isSafeInteger(total) || total > maxResponseBytes) {
        void reader.cancel().catch(() => undefined);
        throw new AsyncRpcManualReviewError('response_too_large');
      }
      body.set(next.value, total - next.value.byteLength);
    }
  } finally {
    signal.removeEventListener('abort', onAbort);
    reader.releaseLock();
  }

  return body.subarray(0, total);
};

const parseResponseBody = (body: Uint8Array): unknown => {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(
      body,
    );
  } catch {
    throw new AsyncRpcManualReviewError('invalid_utf8');
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AsyncRpcManualReviewError('malformed_json');
  }
};

const normalizeRpcOptions = (options: AsyncRpcClientOptions) => {
  if (options === null || typeof options !== 'object') {
    throw new Error('Async RPC transport limits are invalid.');
  }
  const deadlineMs = options.deadlineMs ?? ASYNC_RPC_DEADLINE_MS;
  const maxResponseBytes =
    options.maxResponseBytes ?? ASYNC_RPC_MAX_RESPONSE_BYTES;
  if (
    !Number.isSafeInteger(deadlineMs) ||
    deadlineMs < 1 ||
    deadlineMs > ASYNC_RPC_DEADLINE_MS ||
    !Number.isSafeInteger(maxResponseBytes) ||
    maxResponseBytes < 1 ||
    maxResponseBytes > ASYNC_RPC_MAX_RESPONSE_BYTES
  ) {
    throw new Error('Async RPC transport limits are invalid.');
  }
  return { deadlineMs, maxResponseBytes } as const;
};

const fetchClient = (
  fetcher: typeof fetch = globalThis.fetch,
  options: AsyncRpcClientOptions = {},
): AsyncRpcClient => {
  const { deadlineMs, maxResponseBytes } = normalizeRpcOptions(options);
  return async <T>(
    env: AsyncRpcEnvironment,
    operation: AsyncRpcOperation,
    input: Record<string, unknown>,
    externalSignal?: AbortSignal,
  ): Promise<T> => {
    if (
      env.SUPABASE_URL.trim() === '' ||
      env.SUPABASE_SECRET_KEY.trim() === ''
    ) {
      throw new Error('Supabase RPC configuration unavailable');
    }
    const url = new URL(
      `/rest/v1/rpc/${operation}`,
      env.SUPABASE_URL,
    ).toString();
    const controller = new AbortController();
    let timedOut = false;
    let externallyAborted = false;
    let rejectDeadline: ((reason?: unknown) => void) | undefined;
    const deadline = new Promise<never>((_, reject) => {
      rejectDeadline = reject;
    });
    void deadline.catch(() => undefined);
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      rejectDeadline?.(new AsyncRpcDependencyError('timeout'));
    }, deadlineMs);
    const abortExternal = (): void => {
      externallyAborted = true;
      controller.abort();
      rejectDeadline?.(new AsyncRpcDependencyError('timeout'));
    };
    if (externalSignal?.aborted) abortExternal();
    externalSignal?.addEventListener('abort', abortExternal, { once: true });
    if (externallyAborted) {
      clearTimeout(timer);
      externalSignal?.removeEventListener('abort', abortExternal);
      throw new AsyncRpcDependencyError('timeout');
    }

    try {
      let response: Response;
      try {
        response = await Promise.race([
          Promise.resolve().then(() =>
            fetcher(url, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Accept-Profile': PLATFORM_API_PROFILE,
                apikey: env.SUPABASE_SECRET_KEY,
                authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
                'Content-Profile': PLATFORM_API_PROFILE,
                'content-type': 'application/json',
              },
              body: JSON.stringify(input),
              signal: controller.signal,
            }),
          ),
          deadline,
        ]);
      } catch (error) {
        if (timedOut || externallyAborted)
          throw new AsyncRpcDependencyError('timeout');
        if (error instanceof AsyncRpcTransportError) throw error;
        throw new AsyncRpcDependencyError('request_failed');
      }

      if (
        response === null ||
        typeof response !== 'object' ||
        typeof response.ok !== 'boolean' ||
        response.headers === null ||
        typeof response.headers.get !== 'function'
      ) {
        throw new AsyncRpcManualReviewError('malformed_response');
      }
      if (!response.ok) {
        throw new AsyncRpcDependencyError('http_error');
      }
      responseLength(response, maxResponseBytes);
      const body = await readBoundedResponse(
        response,
        maxResponseBytes,
        controller.signal,
      );
      return parseResponseBody(body) as T;
    } catch (error) {
      if (timedOut || externallyAborted)
        throw new AsyncRpcDependencyError('timeout');
      if (error instanceof AsyncRpcTransportError) throw error;
      throw new AsyncRpcDependencyError('request_failed');
    } finally {
      clearTimeout(timer);
      externalSignal?.removeEventListener('abort', abortExternal);
    }
  };
};

export const createSupabaseRpc = fetchClient;
