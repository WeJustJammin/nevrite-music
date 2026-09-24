import { supabaseRpcHeaders } from '../../apps/worker/src/supabase-rpc-headers.ts';
import { readBoundedProviderResponseText } from './bounded-provider-response.ts';
import { parseStrictJson } from './parse-strict-json.ts';

export const AC265_OUTAGE_LEASE_HTTP_TIMEOUT_MS = 10_000;
export const AC265_OUTAGE_LEASE_HTTP_MAX_RESPONSE_BYTES = 64 * 1024;

const SUPABASE_PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/u;
const PRINTABLE_SECRET_PATTERN = /^[\x21-\x7e]+$/u;
const CONFLICT_STATUS = 'conflict';

export type Ac265OutageLeaseOperation = 'acquire' | 'consume' | 'release';

export interface Ac265OutageLeaseRpcOptions {
  readonly supabaseUrl: string;
  readonly supabaseProjectRef: string;
  readonly serviceRoleKey: string;
  readonly fetchImpl?: typeof fetch;
}

/**
 * Raised when the control plane deliberately refuses the request. A conflict
 * is a fail-closed authorization outcome, not a transport or trust failure:
 * no lease exists, or the exact request was already decided.
 */
export class Ac265OutageLeaseConflictError extends Error {
  public readonly operation: Ac265OutageLeaseOperation;

  public constructor(operation: Ac265OutageLeaseOperation) {
    super(`AC265 outage lease ${operation} conflict`);
    this.name = 'Ac265OutageLeaseConflictError';
    this.operation = operation;
  }
}

export const isAc265OutageLeaseConflict = (
  error: unknown,
): error is Ac265OutageLeaseConflictError =>
  error instanceof Ac265OutageLeaseConflictError;

type Json = Record<string, unknown>;
type SafeParseResult<T> =
  { readonly success: true; readonly data: T } | { readonly success: false };
export type Ac265OutageLeaseSchema<T> = {
  safeParse(value: unknown): SafeParseResult<T>;
};

export const outageLeaseFailure = (
  operation: Ac265OutageLeaseOperation,
): never => {
  throw new Error(`AC265 outage lease ${operation} failed`);
};

const readServiceRoleKey = (
  value: unknown,
  operation: Ac265OutageLeaseOperation,
): string => {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 8_192 ||
    !PRINTABLE_SECRET_PATTERN.test(value)
  )
    return outageLeaseFailure(operation);
  return value;
};

const endpoint = (
  rawOrigin: unknown,
  projectRef: unknown,
  rpc: string,
  operation: Ac265OutageLeaseOperation,
): URL => {
  if (
    typeof projectRef !== 'string' ||
    !SUPABASE_PROJECT_REF_PATTERN.test(projectRef)
  )
    return outageLeaseFailure(operation);
  const expectedOrigin = `https://${projectRef}.supabase.co`;
  if (rawOrigin !== expectedOrigin || typeof rawOrigin !== 'string')
    return outageLeaseFailure(operation);
  return new URL(`/rest/v1/rpc/${rpc}`, expectedOrigin);
};

const cancelBody = async (response: Response): Promise<void> => {
  await response.body?.cancel().catch(() => undefined);
};

const rejectRedirect = async (
  response: Response,
  operation: Ac265OutageLeaseOperation,
): Promise<void> => {
  if (
    response.redirected ||
    response.type === 'opaqueredirect' ||
    (response.status >= 300 && response.status < 400)
  ) {
    await cancelBody(response);
    outageLeaseFailure(operation);
  }
};

const readBoundedText = async (
  response: Response,
  signal: AbortSignal,
  operation: Ac265OutageLeaseOperation,
): Promise<string> => {
  const contentLength = response.headers.get('content-length');
  if (contentLength !== null) {
    if (!/^(?:0|[1-9][0-9]*)$/u.test(contentLength)) {
      await cancelBody(response);
      return outageLeaseFailure(operation);
    }
    if (Number(contentLength) > AC265_OUTAGE_LEASE_HTTP_MAX_RESPONSE_BYTES) {
      await cancelBody(response);
      return outageLeaseFailure(operation);
    }
  }
  try {
    return await readBoundedProviderResponseText(response, {
      maxBytes: AC265_OUTAGE_LEASE_HTTP_MAX_RESPONSE_BYTES,
      timeoutMs: AC265_OUTAGE_LEASE_HTTP_TIMEOUT_MS,
      signal,
      onTimeout: () => undefined,
    });
  } catch {
    return outageLeaseFailure(operation);
  }
};

const withDeadline = async <T>(
  operation: Ac265OutageLeaseOperation,
  perform: (signal: AbortSignal) => Promise<T>,
): Promise<T> => {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error('request deadline exceeded'));
    }, AC265_OUTAGE_LEASE_HTTP_TIMEOUT_MS);
  });
  try {
    return await Promise.race([perform(controller.signal), deadline]);
  } catch (error: unknown) {
    // A deliberate refusal is a stable authorization outcome, not a transport
    // failure, so it must survive the generic deadline boundary.
    if (error instanceof Ac265OutageLeaseConflictError) throw error;
    return outageLeaseFailure(operation);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
};

/** The control plane answers a deliberate refusal with exactly this envelope. */
const isConflictEnvelope = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  const keys = Object.keys(value);
  return (
    keys.length === 1 &&
    keys[0] === 'status' &&
    (value as Json).status === CONFLICT_STATUS
  );
};

const parseBody = async (
  response: Response,
  signal: AbortSignal,
  operation: Ac265OutageLeaseOperation,
): Promise<unknown> => {
  const source = await readBoundedText(response, signal, operation);
  try {
    return parseStrictJson(source);
  } catch {
    return outageLeaseFailure(operation);
  }
};

/**
 * Accepts only a schema-valid success envelope that the caller's `verify`
 * callback binds to the exact submitted request and project.
 */
const bindResult = <T>(
  decoded: unknown,
  schema: Ac265OutageLeaseSchema<T>,
  operation: Ac265OutageLeaseOperation,
  verify: (result: T) => boolean,
): T => {
  if (isConflictEnvelope(decoded))
    throw new Ac265OutageLeaseConflictError(operation);
  const parsed = schema.safeParse(decoded);
  if (!parsed.success || !verify(parsed.data))
    return outageLeaseFailure(operation);
  return parsed.data;
};

export const invokeAc265OutageLeaseRpc = async <TRequest, TResponse>(input: {
  readonly options: Ac265OutageLeaseRpcOptions;
  readonly operation: Ac265OutageLeaseOperation;
  readonly rpc: string;
  readonly requestSchema: Ac265OutageLeaseSchema<TRequest>;
  readonly responseSchema: Ac265OutageLeaseSchema<TResponse>;
  readonly untrustedRequest: unknown;
  readonly preflight: (request: TRequest) => boolean;
  readonly verify: (request: TRequest, response: TResponse) => boolean;
}): Promise<TResponse> =>
  withDeadline(input.operation, async (signal) => {
    const parsedRequest = input.requestSchema.safeParse(input.untrustedRequest);
    if (!parsedRequest.success) return outageLeaseFailure(input.operation);
    const request = parsedRequest.data;
    if (!input.preflight(request)) return outageLeaseFailure(input.operation);
    const key = readServiceRoleKey(
      input.options.serviceRoleKey,
      input.operation,
    );
    const url = endpoint(
      input.options.supabaseUrl,
      input.options.supabaseProjectRef,
      input.rpc,
      input.operation,
    );
    const fetchImpl = input.options.fetchImpl ?? fetch;
    if (typeof fetchImpl !== 'function')
      return outageLeaseFailure(input.operation);
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Accept-Profile': 'platform_api',
        'Content-Profile': 'platform_api',
        ...supabaseRpcHeaders(key),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ p_request: request }),
      cache: 'no-store',
      redirect: 'error',
      signal,
    });
    await rejectRedirect(response, input.operation);
    if (response.status !== 200) {
      await cancelBody(response);
      return outageLeaseFailure(input.operation);
    }
    return bindResult(
      await parseBody(response, signal, input.operation),
      input.responseSchema,
      input.operation,
      (result) => input.verify(request, result),
    );
  });
