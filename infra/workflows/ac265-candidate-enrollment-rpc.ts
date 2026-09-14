import { parseStrictJson } from './parse-strict-json.ts';
import {
  ContentSchemaRegistryAc265CandidateEnrollmentRequestSchema,
  ContentSchemaRegistryAc265CandidateEnrollmentResultSchema,
  sha256Ac265HostedRunnerIdentity,
  type ContentSchemaRegistryAc265CandidateEnrollmentRequest,
  type ContentSchemaRegistryAc265CandidateEnrollmentResult,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-candidate-enrollment.ts';

export const AC265_CANDIDATE_ENROLLMENT_HTTP_TIMEOUT_MS = 10_000;
export const AC265_CANDIDATE_ENROLLMENT_HTTP_MAX_RESPONSE_BYTES = 16 * 1024;

const RPC_NAME = 'ac265_enroll_verified_candidate';
const FAILURE = 'AC265 candidate enrollment failed';

export interface Ac265CandidateEnrollmentRpcOptions {
  readonly supabaseUrl: string;
  readonly supabaseProjectRef: string;
  readonly serviceRoleKey: string;
  readonly fetchImpl?: typeof fetch;
}

function fail(): never {
  throw new Error(FAILURE);
}

function readServiceRoleKey(value: string): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 8_192 ||
    !/^[\x21-\x7e]+$/u.test(value)
  )
    return fail();
  return value;
}

function enrollmentEndpoint(
  rawOrigin: string,
  projectRef: string,
  request: ContentSchemaRegistryAc265CandidateEnrollmentRequest,
): URL {
  if (
    !/^[a-z0-9]{20}$/u.test(projectRef) ||
    projectRef !== request.provenance.migration.projectRef ||
    projectRef !== request.identity.supabaseProjectRef
  )
    return fail();

  const expectedOrigin = `https://${projectRef}.supabase.co`;
  let parsed: URL;
  try {
    parsed = new URL(rawOrigin);
  } catch {
    return fail();
  }
  if (
    rawOrigin !== expectedOrigin ||
    request.identity.supabaseOrigin !== expectedOrigin ||
    parsed.origin !== expectedOrigin ||
    parsed.protocol !== 'https:' ||
    parsed.username !== '' ||
    parsed.password !== '' ||
    parsed.pathname !== '/' ||
    parsed.search !== '' ||
    parsed.hash !== ''
  )
    return fail();

  return new URL(`/rest/v1/rpc/${RPC_NAME}`, expectedOrigin);
}

function rejectRedirect(response: Response): void {
  if (
    response.redirected ||
    response.type === 'opaqueredirect' ||
    (response.status >= 300 && response.status < 400)
  ) {
    void response.body?.cancel().catch(() => undefined);
    return fail();
  }
}

async function readBoundedText(response: Response): Promise<string> {
  const contentLength = response.headers.get('content-length');
  if (contentLength !== null) {
    if (!/^(?:0|[1-9][0-9]*)$/u.test(contentLength)) return fail();
    if (
      Number(contentLength) > AC265_CANDIDATE_ENROLLMENT_HTTP_MAX_RESPONSE_BYTES
    )
      return fail();
  }

  const reader = response.body?.getReader();
  if (!reader) return fail();

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > AC265_CANDIDATE_ENROLLMENT_HTTP_MAX_RESPONSE_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // Return only the generic enrollment failure.
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

function parseEnrollmentResult(
  source: string,
  request: ContentSchemaRegistryAc265CandidateEnrollmentRequest,
): ContentSchemaRegistryAc265CandidateEnrollmentResult {
  let decoded: unknown;
  try {
    decoded = parseStrictJson(source);
  } catch {
    return fail();
  }

  const result =
    ContentSchemaRegistryAc265CandidateEnrollmentResultSchema.safeParse(
      decoded,
    );
  if (!result.success || result.data.identitySha256 !== request.identitySha256)
    return fail();
  return result.data;
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
    }, AC265_CANDIDATE_ENROLLMENT_HTTP_TIMEOUT_MS);
  });

  try {
    return await Promise.race([perform(controller.signal), deadline]);
  } catch {
    return fail();
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

export async function registerAc265CandidateEnrollment(
  options: Ac265CandidateEnrollmentRpcOptions,
  untrustedRequest: unknown,
): Promise<ContentSchemaRegistryAc265CandidateEnrollmentResult> {
  return withDeadline(async (signal) => {
    const parsedRequest =
      ContentSchemaRegistryAc265CandidateEnrollmentRequestSchema.safeParse(
        untrustedRequest,
      );
    if (!parsedRequest.success) return fail();
    const request = parsedRequest.data;
    let verifiedIdentitySha256: string;
    try {
      verifiedIdentitySha256 = await sha256Ac265HostedRunnerIdentity(
        request.identity,
      );
    } catch {
      return fail();
    }
    if (verifiedIdentitySha256 !== request.identitySha256) return fail();
    const key = readServiceRoleKey(options.serviceRoleKey);
    const endpoint = enrollmentEndpoint(
      options.supabaseUrl,
      options.supabaseProjectRef,
      request,
    );
    const fetchImpl = options.fetchImpl ?? fetch;
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
    rejectRedirect(response);
    if (response.status !== 200) {
      void response.body?.cancel().catch(() => undefined);
      return fail();
    }
    return parseEnrollmentResult(await readBoundedText(response), request);
  });
}
