import { parseStrictJson } from './parse-strict-json.ts';
import { supabaseRpcHeaders } from '../../apps/worker/src/supabase-rpc-headers.ts';
import { readBoundedProviderResponseText } from './bounded-provider-response.ts';
import {
  ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeRequestSchema,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponseSchema,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestReadRequestSchema,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestReadResponseSchema,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterRequestSchema,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponseSchema,
  type ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponse,
  type ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponse,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-source-manifest-control.ts';
export const AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_HTTP_TIMEOUT_MS = 10_000;
export const AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_HTTP_MAX_RESPONSE_BYTES =
  64 * 1024;
const SUPABASE_PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/u;
const PRINTABLE_SECRET_PATTERN = /^[\x21-\x7e]+$/u;
const REGISTER_RPC = 'ac265_hosted_artifact_manifest_register';
const FINALIZE_RPC = 'ac265_hosted_artifact_manifest_finalize';
const READ_RPC = 'ac265_hosted_artifact_manifest_read';
export interface Ac265HostedArtifactSourceManifestRpcOptions {
  readonly supabaseUrl: string;
  readonly supabaseProjectRef: string;
  readonly serviceRoleKey: string;
  readonly fetchImpl?: typeof fetch;
}
type ManifestRegisterResponse =
  ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponse;
type ManifestFinalizeResponse =
  ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponse;
type ManifestProjection = Exclude<
  ManifestRegisterResponse,
  { readonly status: 'conflict' }
>;
type FinalizedProjection = Exclude<
  ManifestFinalizeResponse,
  { readonly status: 'conflict' }
>;
type SafeParseResult<T> =
  { readonly success: true; readonly data: T } | { readonly success: false };
type Schema<T> = { safeParse(value: unknown): SafeParseResult<T> };
const failure = (operation: string): never => {
  throw new Error(`AC265 hosted artifact-source manifest ${operation} failed`);
};
const readServiceRoleKey = (value: unknown, operation: string): string => {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 8_192 ||
    !PRINTABLE_SECRET_PATTERN.test(value)
  )
    return failure(operation);
  return value;
};
const endpoint = (
  rawOrigin: unknown,
  projectRef: unknown,
  rpc: string,
  operation: string,
): URL => {
  if (
    typeof projectRef !== 'string' ||
    !SUPABASE_PROJECT_REF_PATTERN.test(projectRef)
  )
    return failure(operation);
  const expectedOrigin = `https://${projectRef}.supabase.co`;
  if (rawOrigin !== expectedOrigin || typeof rawOrigin !== 'string')
    return failure(operation);
  return new URL(`/rest/v1/rpc/${rpc}`, expectedOrigin);
};
const cancelBody = async (response: Response): Promise<void> => {
  await response.body?.cancel().catch(() => undefined);
};
const rejectRedirect = async (
  response: Response,
  operation: string,
): Promise<void> => {
  if (
    response.redirected ||
    response.type === 'opaqueredirect' ||
    (response.status >= 300 && response.status < 400)
  ) {
    await cancelBody(response);
    failure(operation);
  }
};
const readBoundedText = async (
  response: Response,
  signal: AbortSignal,
  operation: string,
): Promise<string> => {
  const contentLength = response.headers.get('content-length');
  if (contentLength !== null) {
    if (!/^(?:0|[1-9][0-9]*)$/u.test(contentLength)) {
      await cancelBody(response);
      return failure(operation);
    }
    if (
      Number(contentLength) >
      AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_HTTP_MAX_RESPONSE_BYTES
    ) {
      await cancelBody(response);
      return failure(operation);
    }
  }
  try {
    return await readBoundedProviderResponseText(response, {
      maxBytes: AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_HTTP_MAX_RESPONSE_BYTES,
      timeoutMs: AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_HTTP_TIMEOUT_MS,
      signal,
      onTimeout: () => undefined,
    });
  } catch {
    return failure(operation);
  }
};
const withDeadline = async <T>(
  operation: string,
  perform: (signal: AbortSignal) => Promise<T>,
): Promise<T> => {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error('request deadline exceeded'));
    }, AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_HTTP_TIMEOUT_MS);
  });
  try {
    return await Promise.race([perform(controller.signal), deadline]);
  } catch {
    return failure(operation);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
};
const isConflict = (value: unknown): value is { readonly status: 'conflict' } =>
  typeof value === 'object' &&
  value !== null &&
  'status' in value &&
  value.status === 'conflict';
const parseResponse = <T>(
  source: string,
  schema: Schema<T>,
  operation: string,
): T => {
  let decoded: unknown;
  try {
    decoded = parseStrictJson(source);
  } catch {
    return failure(operation);
  }
  const parsed = schema.safeParse(decoded);
  if (!parsed.success || isConflict(parsed.data)) return failure(operation);
  return parsed.data;
};
const validateCommonProjection = (
  value: ManifestProjection,
  projectRef: string,
  operation: string,
): void => {
  if (
    value.environment !== 'staging' ||
    value.hostingProjectId !== 'wejammin-staging' ||
    value.supabaseProjectRef !== projectRef ||
    value.manifestRef !==
      `ac265-artifact-manifest://staging/${value.manifestId}`
  )
    failure(operation);
};
const invoke = async <TRequest, TResponse>(input: {
  readonly options: Ac265HostedArtifactSourceManifestRpcOptions;
  readonly operation: string;
  readonly rpc: string;
  readonly requestSchema: Schema<TRequest>;
  readonly responseSchema: Schema<TResponse>;
  readonly untrustedRequest: unknown;
  readonly validate: (request: TRequest, response: TResponse) => void;
}): Promise<TResponse> =>
  withDeadline(input.operation, async (signal) => {
    const parsedRequest = input.requestSchema.safeParse(input.untrustedRequest);
    if (!parsedRequest.success) return failure(input.operation);
    const request = parsedRequest.data;
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
    if (typeof fetchImpl !== 'function') return failure(input.operation);
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
      return failure(input.operation);
    }
    const parsedResponse = parseResponse(
      await readBoundedText(response, signal, input.operation),
      input.responseSchema,
      input.operation,
    );
    input.validate(request, parsedResponse);
    return parsedResponse;
  });
export const registerAc265HostedArtifactSourceManifest = (
  options: Ac265HostedArtifactSourceManifestRpcOptions,
  untrustedRequest: unknown,
): Promise<ManifestProjection> =>
  invoke({
    options,
    operation: 'register',
    rpc: REGISTER_RPC,
    requestSchema:
      ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterRequestSchema,
    responseSchema:
      ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponseSchema,
    untrustedRequest,
    validate: (request, response) => {
      if (response.authorizationRef !== request.authorizationRef)
        failure('register');
      validateCommonProjection(
        response,
        options.supabaseProjectRef,
        'register',
      );
      if (response.idempotencyRef !== request.idempotencyRef)
        failure('register');
    },
  });
export const finalizeAc265HostedArtifactSourceManifest = (
  options: Ac265HostedArtifactSourceManifestRpcOptions,
  untrustedRequest: unknown,
): Promise<FinalizedProjection> =>
  invoke({
    options,
    operation: 'finalize',
    rpc: FINALIZE_RPC,
    requestSchema:
      ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeRequestSchema,
    responseSchema:
      ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponseSchema,
    untrustedRequest,
    validate: (request, response) => {
      if (
        response.authorizationRef !== request.authorizationRef ||
        response.manifestId !== request.manifestId ||
        response.manifestSha256 !== request.manifestSha256 ||
        response.finalizationRef !== request.finalizationRef
      )
        failure('finalize');
      validateCommonProjection(
        response,
        options.supabaseProjectRef,
        'finalize',
      );
    },
  });
export const readAc265HostedArtifactSourceManifest = (
  options: Ac265HostedArtifactSourceManifestRpcOptions,
  untrustedRequest: unknown,
): Promise<FinalizedProjection> =>
  invoke({
    options,
    operation: 'read',
    rpc: READ_RPC,
    requestSchema:
      ContentSchemaRegistryAc265HostedArtifactSourceManifestReadRequestSchema,
    responseSchema:
      ContentSchemaRegistryAc265HostedArtifactSourceManifestReadResponseSchema,
    untrustedRequest,
    validate: (request, response) => {
      if (
        response.authorizationRef !== request.authorizationRef ||
        response.manifestId !== request.manifestId
      )
        failure('read');
      validateCommonProjection(response, options.supabaseProjectRef, 'read');
    },
  });
