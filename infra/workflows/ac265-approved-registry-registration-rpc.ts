import { parseStrictJson } from './parse-strict-json.ts';
import {
  ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequestSchema,
  ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResponseSchema,
  ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequestSchema,
  ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResponseSchema,
  type ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequest,
  type ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResult,
  type ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequest,
  type ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResult,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-registry-control.ts';

export const AC265_APPROVED_REGISTRY_HTTP_TIMEOUT_MS = 10_000;
export const AC265_APPROVED_REGISTRY_HTTP_MAX_RESPONSE_BYTES = 64 * 1024;

const SAFE_RESOURCE_RPC_NAME = 'ac265_approved_safe_resource_register';
const RUNNER_MAPPING_RPC_NAME = 'ac265_approved_runner_mapping_register';
const SAFE_RESOURCE_FAILURE =
  'AC265 approved safe resource registration failed';
const RUNNER_MAPPING_FAILURE =
  'AC265 approved runner mapping registration failed';
const SUPABASE_PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/u;
const PRINTABLE_SECRET_PATTERN = /^[\x21-\x7e]+$/u;

export interface Ac265ApprovedRegistryRpcOptions {
  readonly supabaseUrl: string;
  readonly supabaseProjectRef: string;
  readonly serviceRoleKey: string;
  readonly fetchImpl?: typeof fetch;
}

function readServiceRoleKey(value: unknown, fail: () => never): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 8_192 ||
    !PRINTABLE_SECRET_PATTERN.test(value)
  )
    return fail();
  return value;
}

function registrationEndpoint(
  rawOrigin: unknown,
  projectRef: unknown,
  rpcName: string,
  fail: () => never,
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

async function rejectRedirect(
  response: Response,
  fail: () => never,
): Promise<void> {
  if (
    response.redirected ||
    response.type === 'opaqueredirect' ||
    (response.status >= 300 && response.status < 400)
  ) {
    await cancelBody(response);
    return fail();
  }
}

async function readBoundedText(
  response: Response,
  fail: () => never,
): Promise<string> {
  const contentLength = response.headers.get('content-length');
  if (contentLength !== null) {
    if (!/^(?:0|[1-9][0-9]*)$/u.test(contentLength)) {
      await cancelBody(response);
      return fail();
    }
    if (
      Number(contentLength) > AC265_APPROVED_REGISTRY_HTTP_MAX_RESPONSE_BYTES
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
      if (totalBytes > AC265_APPROVED_REGISTRY_HTTP_MAX_RESPONSE_BYTES) {
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

function decodeStrictJson(source: string, fail: () => never): unknown {
  try {
    return parseStrictJson(source);
  } catch {
    return fail();
  }
}

async function withDeadline<T>(
  perform: (signal: AbortSignal) => Promise<T>,
  fail: () => never,
): Promise<T> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error('deadline'));
    }, AC265_APPROVED_REGISTRY_HTTP_TIMEOUT_MS);
  });

  try {
    return await Promise.race([perform(controller.signal), deadline]);
  } catch {
    return fail();
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

async function postStrictRequest(
  options: Ac265ApprovedRegistryRpcOptions,
  rpcName: string,
  request: unknown,
  fail: () => never,
  signal: AbortSignal,
): Promise<Response> {
  const key = readServiceRoleKey(options.serviceRoleKey, fail);
  const endpoint = registrationEndpoint(
    options.supabaseUrl,
    options.supabaseProjectRef,
    rpcName,
    fail,
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
  await rejectRedirect(response, fail);
  if (response.status !== 200) {
    await cancelBody(response);
    return fail();
  }
  return response;
}

function bindSafeResourceResult(
  result: ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResult,
  request: ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequest,
  projectRef: string,
  fail: () => never,
): ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResult {
  if (
    result.authorizationRef !== request.authorizationRef ||
    result.idempotencyRef !== request.idempotencyRef ||
    result.locatorSha256 !== request.locatorSha256 ||
    result.resource.kind !== request.resourceKind ||
    result.environment !== 'staging' ||
    result.hostingProjectId !== 'wejammin-staging' ||
    result.supabaseProjectRef !== projectRef ||
    result.redacted !== true
  )
    return fail();
  return result;
}

function bindRunnerMappingResult(
  result: ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResult,
  request: ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequest,
  projectRef: string,
  fail: () => never,
): ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResult {
  const boundRoles = new Set<string>();
  const declaredResources = new Set(result.resources.map(({ ref }) => ref));
  for (const role of Object.keys(request.roleResourceBindings)) {
    const requested =
      request.roleResourceBindings[
        role as keyof typeof request.roleResourceBindings
      ];
    const returned =
      result.mapping.roleResourceBindings[
        role as keyof typeof result.mapping.roleResourceBindings
      ];
    if (
      requested === undefined ||
      returned === undefined ||
      requested.length !== returned.length ||
      requested.some((reference, index) => reference !== returned[index])
    )
      return fail();
    for (const reference of requested) boundRoles.add(reference);
  }
  for (const scenario of Object.keys(request.scenarioRoleBindings)) {
    const requested =
      request.scenarioRoleBindings[
        scenario as keyof typeof request.scenarioRoleBindings
      ];
    const returned =
      result.mapping.scenarioRoleBindings[
        scenario as keyof typeof result.mapping.scenarioRoleBindings
      ];
    if (
      requested === undefined ||
      returned === undefined ||
      requested.length !== returned.length ||
      requested.some((role, index) => role !== returned[index])
    )
      return fail();
  }
  if (
    result.authorizationRef !== request.authorizationRef ||
    result.idempotencyRef !== request.idempotencyRef ||
    result.environment !== 'staging' ||
    result.hostingProjectId !== 'wejammin-staging' ||
    result.supabaseProjectRef !== projectRef ||
    result.redacted !== true ||
    result.mapping.identity.environment !== 'staging' ||
    result.mapping.identity.supabaseProjectRef !== projectRef ||
    result.mapping.roleResourceBindings.entitled_read === undefined ||
    declaredResources.size !== result.resources.length
  )
    return fail();
  for (const reference of declaredResources)
    if (!boundRoles.has(reference)) return fail();
  return result;
}

export async function registerAc265ApprovedSafeResource(
  options: Ac265ApprovedRegistryRpcOptions,
  untrustedRequest: unknown,
): Promise<ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResult> {
  const fail = (): never => {
    throw new Error(SAFE_RESOURCE_FAILURE);
  };
  return withDeadline(async (signal) => {
    const parsedRequest =
      ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequestSchema.safeParse(
        untrustedRequest,
      );
    if (!parsedRequest.success) return fail();
    const request = parsedRequest.data;
    const response = await postStrictRequest(
      options,
      SAFE_RESOURCE_RPC_NAME,
      request,
      fail,
      signal,
    );
    const parsed =
      ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResponseSchema.safeParse(
        decodeStrictJson(await readBoundedText(response, fail), fail),
      );
    if (!parsed.success || 'status' in parsed.data) return fail();
    return bindSafeResourceResult(
      parsed.data,
      request,
      options.supabaseProjectRef,
      fail,
    );
  }, fail);
}

export async function registerAc265ApprovedRunnerMapping(
  options: Ac265ApprovedRegistryRpcOptions,
  untrustedRequest: unknown,
): Promise<ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResult> {
  const fail = (): never => {
    throw new Error(RUNNER_MAPPING_FAILURE);
  };
  return withDeadline(async (signal) => {
    const parsedRequest =
      ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequestSchema.safeParse(
        untrustedRequest,
      );
    if (!parsedRequest.success) return fail();
    const request = parsedRequest.data;
    const response = await postStrictRequest(
      options,
      RUNNER_MAPPING_RPC_NAME,
      request,
      fail,
      signal,
    );
    const parsed =
      ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResponseSchema.safeParse(
        decodeStrictJson(await readBoundedText(response, fail), fail),
      );
    if (!parsed.success || 'status' in parsed.data) return fail();
    return bindRunnerMappingResult(
      parsed.data,
      request,
      options.supabaseProjectRef,
      fail,
    );
  }, fail);
}
