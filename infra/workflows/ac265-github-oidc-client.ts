import {
  AC265_GITHUB_OIDC_AUDIENCE,
  AC265_STAGING_API_ORIGIN,
  ContentSchemaRegistryAc265PrepareRunRequestSchema,
  ContentSchemaRegistryAc265RunnerAuthorizationSchema,
  type ContentSchemaRegistryAc265PrepareRunRequest,
  type ContentSchemaRegistryAc265RunnerAuthorization,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-control-plane.ts';

export const AC265_RUNNER_HTTP_TIMEOUT_MS = 10_000;
export const AC265_RUNNER_HTTP_MAX_RESPONSE_BYTES = 16 * 1024;

const GITHUB_ACTIONS_TOKEN_SERVICE_HOST =
  'pipelines.actions.githubusercontent.com';
const COMPACT_JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u;
const MAX_COMPACT_JWT_LENGTH = 12 * 1024;

type Fetcher = typeof fetch;

export interface Ac265GithubActionsEnvironment {
  readonly ACTIONS_ID_TOKEN_REQUEST_URL?: string;
  readonly ACTIONS_ID_TOKEN_REQUEST_TOKEN?: string;
}

export interface RequestAc265GithubOidcTokenOptions {
  readonly environment?: Ac265GithubActionsEnvironment;
  readonly fetcher?: Fetcher;
}

export interface PrepareAc265HostedRunOptions {
  readonly fetcher?: Fetcher;
}

export type RequestAc265HostedRunAuthorizationOptions =
  RequestAc265GithubOidcTokenOptions;

type ClientOperation = 'oidc' | 'prepare';

function failure(operation: ClientOperation): Error {
  return new Error(
    operation === 'oidc'
      ? 'AC265 GitHub OIDC token request failed'
      : 'AC265 hosted-run preparation request failed',
  );
}

function readGithubActionsEnvironment(): Ac265GithubActionsEnvironment {
  const runtimeGlobal = globalThis as typeof globalThis & {
    readonly process?: {
      readonly env?: Ac265GithubActionsEnvironment;
    };
  };
  return runtimeGlobal.process?.env ?? {};
}

async function withinTimeout<T>(
  operation: ClientOperation,
  perform: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(failure(operation));
    }, AC265_RUNNER_HTTP_TIMEOUT_MS);
  });

  try {
    return await Promise.race([perform(controller.signal), timedOut]);
  } catch {
    throw failure(operation);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

function readTokenServiceUrl(rawUrl: string | undefined): URL {
  if (!rawUrl || rawUrl.length > 2_048) throw new Error('invalid token URL');

  const url = new URL(rawUrl);
  if (
    url.protocol !== 'https:' ||
    url.username !== '' ||
    url.password !== '' ||
    url.hostname !== GITHUB_ACTIONS_TOKEN_SERVICE_HOST ||
    url.port !== '' ||
    url.hash !== ''
  ) {
    throw new Error('invalid token URL');
  }

  url.searchParams.set('audience', AC265_GITHUB_OIDC_AUDIENCE);
  return url;
}

function readRunnerRequestCredential(
  rawCredential: string | undefined,
): string {
  if (
    !rawCredential ||
    rawCredential.length > 8_192 ||
    !/^[\x21-\x7E]+$/u.test(rawCredential)
  ) {
    throw new Error('invalid runner credential');
  }

  return rawCredential;
}

function isCompactJwt(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_COMPACT_JWT_LENGTH &&
    COMPACT_JWT.test(value)
  );
}

function assertNoRedirect(response: Response): void {
  if (
    response.redirected ||
    response.type === 'opaqueredirect' ||
    (response.status >= 300 && response.status < 400)
  ) {
    void response.body?.cancel().catch(() => undefined);
    throw new Error('redirect rejected');
  }
}

async function readBoundedResponseText(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > AC265_RUNNER_HTTP_MAX_RESPONSE_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // The caller receives only the operation's generic failure.
        }
        throw new Error('response too large');
      }
      chunks.push(value);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // A completed or cancelled reader may already have released its lock.
    }
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function rejectUnsuccessfulResponse(response: Response): void {
  if (!response.ok) {
    void response.body?.cancel().catch(() => undefined);
    throw new Error('unsuccessful response');
  }
}

function validatePrepareDestination(request: unknown):
  | Readonly<{
      request: ContentSchemaRegistryAc265PrepareRunRequest;
      endpoint: URL;
    }>
  | undefined {
  try {
    const parsedRequest =
      ContentSchemaRegistryAc265PrepareRunRequestSchema.safeParse(request);
    if (!parsedRequest.success) return undefined;

    return {
      request: parsedRequest.data,
      endpoint: new URL(
        '/api/v1/internal/ac265/runs/prepare',
        AC265_STAGING_API_ORIGIN,
      ),
    };
  } catch {
    return undefined;
  }
}

function parseStrictTokenResponse(responseText: string): string {
  const value: unknown = JSON.parse(responseText);
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 1 ||
    !Object.hasOwn(value, 'value') ||
    !isCompactJwt((value as { value?: unknown }).value)
  ) {
    throw new Error('invalid token response');
  }

  return (value as { value: string }).value;
}

export async function requestAc265GithubOidcToken(
  options: RequestAc265GithubOidcTokenOptions = {},
): Promise<string> {
  return withinTimeout('oidc', async (signal) => {
    const environment = options.environment ?? readGithubActionsEnvironment();
    const url = readTokenServiceUrl(environment.ACTIONS_ID_TOKEN_REQUEST_URL);
    const credential = readRunnerRequestCredential(
      environment.ACTIONS_ID_TOKEN_REQUEST_TOKEN,
    );
    const fetcher = options.fetcher ?? fetch;
    const response = await fetcher(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${credential}`,
      },
      redirect: 'manual',
      cache: 'no-store',
      signal,
    });

    assertNoRedirect(response);
    rejectUnsuccessfulResponse(response);
    return parseStrictTokenResponse(await readBoundedResponseText(response));
  });
}

export async function prepareAc265HostedRun(
  request: ContentSchemaRegistryAc265PrepareRunRequest,
  githubOidcToken: string,
  options: PrepareAc265HostedRunOptions,
): Promise<ContentSchemaRegistryAc265RunnerAuthorization> {
  return withinTimeout('prepare', async (signal) => {
    const destination = validatePrepareDestination(request);
    if (!destination || !isCompactJwt(githubOidcToken)) {
      throw new Error('invalid prepare request');
    }

    const fetcher = options.fetcher ?? fetch;
    const response = await fetcher(destination.endpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${githubOidcToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(destination.request),
      redirect: 'manual',
      cache: 'no-store',
      signal,
    });

    assertNoRedirect(response);
    rejectUnsuccessfulResponse(response);
    const responseValue: unknown = JSON.parse(
      await readBoundedResponseText(response),
    );
    const authorization =
      ContentSchemaRegistryAc265RunnerAuthorizationSchema.safeParse(
        responseValue,
      );
    if (!authorization.success) throw new Error('invalid prepare response');
    return authorization.data;
  });
}

export async function requestAc265HostedRunAuthorization(
  request: ContentSchemaRegistryAc265PrepareRunRequest,
  options: RequestAc265HostedRunAuthorizationOptions,
): Promise<ContentSchemaRegistryAc265RunnerAuthorization> {
  const destination = validatePrepareDestination(request);
  if (!destination) throw failure('prepare');

  const githubOidcToken = await requestAc265GithubOidcToken({
    ...(options.environment ? { environment: options.environment } : {}),
    ...(options.fetcher ? { fetcher: options.fetcher } : {}),
  });
  return prepareAc265HostedRun(destination.request, githubOidcToken, {
    ...(options.fetcher ? { fetcher: options.fetcher } : {}),
  });
}
