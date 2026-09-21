import { parseStrictJson } from './parse-strict-json.ts';
import {
  ContentSchemaRegistryAc265ApprovedOutageTargetRegisterRequestSchema,
  ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResponseSchema,
  type ContentSchemaRegistryAc265ApprovedOutageTargetRegisterRequest,
  type ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResult,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-outage-target-registration.ts';

export const AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_HTTP_TIMEOUT_MS = 10_000;
export const AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_HTTP_MAX_RESPONSE_BYTES =
  64 * 1024;

const RPC_NAME = 'ac265_approved_outage_target_register';
const FAILURE = 'AC265 approved outage target registration failed';
const SUPABASE_PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/u;
const PRINTABLE_SECRET_PATTERN = /^[\x21-\x7e]+$/u;

export interface Ac265ApprovedOutageTargetRegistrationRpcOptions {
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

function registrationEndpoint(rawOrigin: unknown, projectRef: unknown): URL {
  if (
    typeof projectRef !== 'string' ||
    !SUPABASE_PROJECT_REF_PATTERN.test(projectRef)
  )
    return fail();

  const expectedOrigin = `https://${projectRef}.supabase.co`;
  if (rawOrigin !== expectedOrigin || typeof rawOrigin !== 'string')
    return fail();

  return new URL(`/rest/v1/rpc/${RPC_NAME}`, expectedOrigin);
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
    if (
      Number(contentLength) >
      AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_HTTP_MAX_RESPONSE_BYTES
    ) {
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
      if (
        totalBytes >
        AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_HTTP_MAX_RESPONSE_BYTES
      ) {
        try {
          await reader.cancel();
        } catch {
          // Return only the generic registration failure.
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

function parseRegistrationResult(
  source: string,
  request: ContentSchemaRegistryAc265ApprovedOutageTargetRegisterRequest,
  projectRef: string,
): ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResult {
  let decoded: unknown;
  try {
    decoded = parseStrictJson(source);
  } catch {
    return fail();
  }

  const parsed =
    ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResponseSchema.safeParse(
      decoded,
    );
  if (!parsed.success || parsed.data.status === 'conflict') return fail();

  const result = parsed.data;
  if (
    result.authorizationRef !== request.authorizationRef ||
    result.policyRef !== request.policyRef ||
    result.idempotencyRef !== request.idempotencyRef ||
    result.environment !== 'staging' ||
    result.hostingProjectId !== 'wejammin-staging' ||
    result.supabaseProjectRef !== projectRef ||
    result.status !== 'registered' ||
    result.redacted !== true
  )
    return fail();

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
    }, AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_HTTP_TIMEOUT_MS);
  });

  try {
    return await Promise.race([perform(controller.signal), deadline]);
  } catch {
    return fail();
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

export async function registerAc265ApprovedOutageTarget(
  options: Ac265ApprovedOutageTargetRegistrationRpcOptions,
  untrustedRequest: unknown,
): Promise<ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResult> {
  return withDeadline(async (signal) => {
    const parsedRequest =
      ContentSchemaRegistryAc265ApprovedOutageTargetRegisterRequestSchema.safeParse(
        untrustedRequest,
      );
    if (!parsedRequest.success) return fail();
    const request = parsedRequest.data;

    const key = readServiceRoleKey(options.serviceRoleKey);
    const endpoint = registrationEndpoint(
      options.supabaseUrl,
      options.supabaseProjectRef,
    );
    const fetchImpl = options.fetchImpl ?? fetch;
    if (typeof fetchImpl !== 'function') return fail();

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
    return parseRegistrationResult(
      await readBoundedText(response),
      request,
      options.supabaseProjectRef,
    );
  });
}
