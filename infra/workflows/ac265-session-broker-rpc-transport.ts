import { parseStrictJson } from './parse-strict-json.ts';

export const AC265_SESSION_BROKER_HTTP_TIMEOUT_MS = 10_000;
export const AC265_SESSION_BROKER_HTTP_MAX_RESPONSE_BYTES = 128 * 1024;

export const AC265_SESSION_BROKER_FAILURE =
  'AC265 session broker request failed';

const SUPABASE_PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/u;
const PRINTABLE_SECRET_PATTERN = /^[\x21-\x7e]+$/u;

export type Ac265SessionBrokerOperation = 'authorize' | 'resolve' | 'teardown';

export interface Ac265SessionBrokerTransportOptions {
  readonly supabaseUrl: string;
  readonly supabaseProjectRef: string;
  readonly serviceRoleKey: string;
  readonly fetchImpl?: typeof fetch;
}

/**
 * Raised when the broker control plane deliberately refuses the request. A
 * conflict is a fail-closed authorization outcome, not a transport or trust
 * failure: the run has no live authorization, the handle was already resolved
 * or logged out with a different idempotency reference, or the scope does not
 * match the stored run. Reporting it as a distinct typed outcome lets an
 * operator tell a refusal from a transport, digest, or trust failure.
 */
export class Ac265SessionBrokerConflictError extends Error {
  public readonly operation: Ac265SessionBrokerOperation;

  public constructor(operation: Ac265SessionBrokerOperation) {
    super(`AC265 session broker ${operation} conflict`);
    this.name = 'Ac265SessionBrokerConflictError';
    this.operation = operation;
  }
}

export const isAc265SessionBrokerConflict = (
  error: unknown,
): error is Ac265SessionBrokerConflictError =>
  error instanceof Ac265SessionBrokerConflictError;

export function fail(): never {
  throw new Error(AC265_SESSION_BROKER_FAILURE);
}

export function readServiceRoleKey(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 8_192 ||
    !PRINTABLE_SECRET_PATTERN.test(value)
  )
    return fail();
  return value;
}

export function rpcEndpoint(
  rawOrigin: unknown,
  projectRef: unknown,
  rpcName: string,
): URL {
  if (
    typeof projectRef !== 'string' ||
    !SUPABASE_PROJECT_REF_PATTERN.test(projectRef)
  )
    return fail();

  const expectedOrigin = `https://${projectRef}.supabase.co`;
  if (rawOrigin !== expectedOrigin || typeof rawOrigin !== 'string')
    return fail();

  return new URL(`/rest/v1/rpc/${rpcName}`, expectedOrigin);
}

async function cancelBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Preserve the single generic failure boundary.
  }
}

async function rejectRedirect(response: Response): Promise<void> {
  if (
    response.redirected ||
    response.type === 'opaqueredirect' ||
    (response.status >= 300 && response.status < 400)
  ) {
    await cancelBody(response);
    return fail();
  }
}

async function readBoundedText(response: Response): Promise<string> {
  const contentLength = response.headers.get('content-length');
  if (contentLength !== null) {
    if (!/^(?:0|[1-9][0-9]*)$/u.test(contentLength)) {
      await cancelBody(response);
      return fail();
    }
    if (Number(contentLength) > AC265_SESSION_BROKER_HTTP_MAX_RESPONSE_BYTES) {
      await cancelBody(response);
      return fail();
    }
  }

  const reader = response.body?.getReader();
  if (!reader) return fail();

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value === undefined) continue;
      totalBytes += value.byteLength;
      if (totalBytes > AC265_SESSION_BROKER_HTTP_MAX_RESPONSE_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // Return only the generic session-broker failure.
        }
        return fail();
      }
      chunks.push(value);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // A cancelled stream may already have released its lock.
    }
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return fail();
  }
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export function decodeStrict(source: string): unknown {
  try {
    return parseStrictJson(source);
  } catch {
    return fail();
  }
}

/**
 * The control plane answers a deliberate refusal with exactly this envelope and
 * nothing else. Any other shape stays on the generic failure boundary.
 */
const isConflictEnvelope = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  const keys = Object.keys(value);
  return (
    keys.length === 1 && keys[0] === 'status' && value.status === 'conflict'
  );
};

async function withDeadline<T>(
  operation: Ac265SessionBrokerOperation,
  perform: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error(AC265_SESSION_BROKER_FAILURE));
    }, AC265_SESSION_BROKER_HTTP_TIMEOUT_MS);
  });

  try {
    return await Promise.race([perform(controller.signal), deadline]);
  } catch (error: unknown) {
    // A deliberate refusal is a stable authorization outcome, not a transport
    // failure, so it must survive the generic deadline boundary.
    if (error instanceof Ac265SessionBrokerConflictError) throw error;
    return fail();
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

export async function callAc265SessionBrokerRpc(
  options: Ac265SessionBrokerTransportOptions,
  operation: Ac265SessionBrokerOperation,
  rpcName: string,
  request: unknown,
): Promise<string> {
  const key = readServiceRoleKey(options.serviceRoleKey);
  const endpoint = rpcEndpoint(
    options.supabaseUrl,
    options.supabaseProjectRef,
    rpcName,
  );
  const fetchImpl = options.fetchImpl ?? fetch;
  if (typeof fetchImpl !== 'function') return fail();

  return withDeadline(operation, async (signal) => {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${key}`,
        apikey: key,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ p_request: request }),
      cache: 'no-store',
      redirect: 'error',
      signal,
    });
    await rejectRedirect(response);
    if (response.status !== 200) {
      await cancelBody(response);
      return fail();
    }
    const source = await readBoundedText(response);
    if (isConflictEnvelope(decodeStrict(source)))
      throw new Ac265SessionBrokerConflictError(operation);
    return source;
  });
}
