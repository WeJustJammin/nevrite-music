import { parseStrictJson } from './parse-strict-json.ts';
import {
  AC265_SESSION_BROKER_HOSTING_PROJECT_ID,
  CONTENT_SCHEMA_REGISTRY_AC265_SESSION_BROKER_SCHEMA_VERSION,
  Ac265SessionBrokerAuthorizeRequestSchema,
  Ac265SessionBrokerAuthorizeResponseSchema,
  Ac265SessionBrokerResolveRequestSchema,
  Ac265SessionBrokerResolveResponseSchema,
  Ac265SessionBrokerTeardownRequestSchema,
  Ac265SessionBrokerTeardownResponseSchema,
  type Ac265SessionBrokerAuthorizeResult,
  type Ac265SessionBrokerResolveResult,
  type Ac265SessionBrokerTeardownResult,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-session-broker-control.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';

export const AC265_SESSION_BROKER_HTTP_TIMEOUT_MS = 10_000;
export const AC265_SESSION_BROKER_HTTP_MAX_RESPONSE_BYTES = 128 * 1024;

const AUTHORIZE_RPC_NAME = 'ac265_session_broker_authorize';
const RESOLVE_RPC_NAME = 'ac265_session_broker_resolve';
const TEARDOWN_RPC_NAME = 'ac265_session_broker_teardown';
const FAILURE = 'AC265 session broker request failed';
const SUPABASE_PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/u;
const PRINTABLE_SECRET_PATTERN = /^[\x21-\x7e]+$/u;
const HANDLE_ROLE_PATTERN =
  /^ac265-session:\/\/([a-z_]+)\/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/u;

export interface Ac265SessionBrokerRpcOptions {
  readonly supabaseUrl: string;
  readonly supabaseProjectRef: string;
  readonly serviceRoleKey: string;
  readonly fetchImpl?: typeof fetch;
}

function fail(): never {
  throw new Error(FAILURE);
}

function readServiceRoleKey(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 8_192 ||
    !PRINTABLE_SECRET_PATTERN.test(value)
  )
    return fail();
  return value;
}

function rpcEndpoint(
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

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

function decodeStrict(source: string): unknown {
  try {
    return parseStrictJson(source);
  } catch {
    return fail();
  }
}

function requireBoundHandle(
  handleRef: string,
  role: string,
): { readonly role: string; readonly handleRef: string } {
  const match = HANDLE_ROLE_PATTERN.exec(handleRef);
  if (match === null || match[1] !== role) return fail();
  return { role, handleRef };
}

async function parseAuthorizeResult(
  source: string,
  projectRef: string,
  request: { readonly authorizationRef: string; readonly runId: string },
): Promise<Ac265SessionBrokerAuthorizeResult> {
  const decoded = decodeStrict(source);
  const parsed = Ac265SessionBrokerAuthorizeResponseSchema.safeParse(decoded);
  if (!parsed.success || 'status' in parsed.data) return fail();

  const result = parsed.data;
  if (
    result.authorizationRef !== request.authorizationRef ||
    result.runId !== request.runId ||
    result.environment !== 'staging' ||
    result.hostingProjectId !== AC265_SESSION_BROKER_HOSTING_PROJECT_ID ||
    result.schemaVersion !==
      CONTENT_SCHEMA_REGISTRY_AC265_SESSION_BROKER_SCHEMA_VERSION ||
    result.handles.length !== CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length
  )
    return fail();

  const roles = new Set<string>();
  const references = new Set<string>();
  for (const handle of result.handles) {
    requireBoundHandle(handle.handleRef, handle.role);
    if (roles.has(handle.role) || references.has(handle.handleRef))
      return fail();
    roles.add(handle.role);
    references.add(handle.handleRef);
    if (handle.handleSha256 !== (await sha256Hex(handle.handleRef)))
      return fail();
  }
  for (const role of CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES)
    if (!roles.has(role)) return fail();

  return result;
}

async function parseResolveResult(
  source: string,
  projectRef: string,
  request: {
    readonly authorizationRef: string;
    readonly runId: string;
    readonly role: string;
    readonly handleRef: string;
    readonly handleSha256: string;
  },
): Promise<Ac265SessionBrokerResolveResult> {
  const decoded = decodeStrict(source);
  const parsed = Ac265SessionBrokerResolveResponseSchema.safeParse(decoded);
  if (!parsed.success || 'status' in parsed.data) return fail();

  const result = parsed.data;
  if (
    result.authorizationRef !== request.authorizationRef ||
    result.runId !== request.runId ||
    result.role !== request.role ||
    result.handleRef !== request.handleRef ||
    result.handleSha256 !== request.handleSha256 ||
    result.environment !== 'staging' ||
    result.hostingProjectId !== AC265_SESSION_BROKER_HOSTING_PROJECT_ID ||
    result.materialRef === result.handleRef
  )
    return fail();

  requireBoundHandle(result.handleRef, result.role);
  if (result.handleSha256 !== (await sha256Hex(result.handleRef)))
    return fail();
  return result;
}

async function parseTeardownResult(
  source: string,
  projectRef: string,
  request: {
    readonly authorizationRef: string;
    readonly runId: string;
    readonly role: string;
    readonly handleRef: string;
    readonly handleSha256: string;
  },
): Promise<Ac265SessionBrokerTeardownResult> {
  const decoded = decodeStrict(source);
  const parsed = Ac265SessionBrokerTeardownResponseSchema.safeParse(decoded);
  if (!parsed.success || 'status' in parsed.data) return fail();

  const result = parsed.data;
  if (
    result.authorizationRef !== request.authorizationRef ||
    result.runId !== request.runId ||
    result.role !== request.role ||
    result.handleRef !== request.handleRef ||
    result.handleSha256 !== request.handleSha256 ||
    result.sessionRefSha256 !== request.handleSha256 ||
    result.environment !== 'staging' ||
    result.hostingProjectId !== AC265_SESSION_BROKER_HOSTING_PROJECT_ID
  )
    return fail();

  requireBoundHandle(result.handleRef, result.role);
  return result;
}

async function withDeadline<T>(
  perform: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error(FAILURE));
    }, AC265_SESSION_BROKER_HTTP_TIMEOUT_MS);
  });

  try {
    return await Promise.race([perform(controller.signal), deadline]);
  } catch {
    return fail();
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

async function callBroker(
  options: Ac265SessionBrokerRpcOptions,
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

  return withDeadline(async (signal) => {
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
    return readBoundedText(response);
  });
}

export async function authorizeAc265SessionBroker(
  options: Ac265SessionBrokerRpcOptions,
  untrustedRequest: unknown,
): Promise<Ac265SessionBrokerAuthorizeResult> {
  const parsed =
    Ac265SessionBrokerAuthorizeRequestSchema.safeParse(untrustedRequest);
  if (!parsed.success) return fail();
  for (const handle of parsed.data.handles)
    if (handle.handleSha256 !== (await sha256Hex(handle.handleRef)))
      return fail();
  const source = await callBroker(options, AUTHORIZE_RPC_NAME, parsed.data);
  return parseAuthorizeResult(source, options.supabaseProjectRef, parsed.data);
}

export async function resolveAc265SessionBroker(
  options: Ac265SessionBrokerRpcOptions,
  untrustedRequest: unknown,
): Promise<Ac265SessionBrokerResolveResult> {
  const parsed =
    Ac265SessionBrokerResolveRequestSchema.safeParse(untrustedRequest);
  if (!parsed.success) return fail();
  // The handle digest must be derived from the exact reference bytes locally;
  // a caller cannot assert a digest for a reference it does not hold.
  if (parsed.data.handleSha256 !== (await sha256Hex(parsed.data.handleRef)))
    return fail();
  const source = await callBroker(options, RESOLVE_RPC_NAME, parsed.data);
  return parseResolveResult(source, options.supabaseProjectRef, parsed.data);
}

export async function teardownAc265SessionBroker(
  options: Ac265SessionBrokerRpcOptions,
  untrustedRequest: unknown,
): Promise<Ac265SessionBrokerTeardownResult> {
  const parsed =
    Ac265SessionBrokerTeardownRequestSchema.safeParse(untrustedRequest);
  if (!parsed.success) return fail();
  if (parsed.data.handleSha256 !== (await sha256Hex(parsed.data.handleRef)))
    return fail();
  const source = await callBroker(options, TEARDOWN_RPC_NAME, parsed.data);
  return parseTeardownResult(source, options.supabaseProjectRef, parsed.data);
}
