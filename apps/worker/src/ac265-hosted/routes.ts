import {
  ApiErrorSchema,
  ContentSchemaRegistryAc265PrepareRunCommandSchema,
  ContentSchemaRegistryAc265PrepareRunRequestSchema,
  ContentSchemaRegistryAc265RunnerAuthorizationSchema,
} from '@wejammin/contracts';

import type { WorkerApp, WorkerContext } from '../worker-types';
import { Ac265RunConflictError } from './types';
import type { Ac265HostedDependencies } from './types';

const PREPARE_RUN_PATH = '/api/v1/internal/ac265/runs/prepare';
const MAX_REQUEST_BYTES = 32 * 1024;
const MAX_BEARER_TOKEN_BYTES = 16_384;
const BEARER_COMPACT_JWT =
  /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/u;

type ErrorStatus = 400 | 401 | 404 | 409 | 503;

class InvalidAc265RequestError extends Error {
  constructor() {
    super('The prepare-run request is invalid.');
    this.name = 'InvalidAc265RequestError';
  }
}

const respondWithError = (
  context: WorkerContext,
  status: ErrorStatus,
  code: string,
  message: string,
): Response => {
  context.set('errorCode', code);
  context.header('cache-control', 'no-store');
  context.header('x-request-id', context.get('requestId'));
  return context.json(
    ApiErrorSchema.parse({
      code,
      details: {},
      message,
      requestId: context.get('requestId'),
    }),
    status,
  );
};

const respondNotFound = (context: WorkerContext): Response =>
  respondWithError(
    context,
    404,
    'NOT_FOUND',
    'The requested API route does not exist.',
  );

const respondInvalidRequest = (context: WorkerContext): Response =>
  respondWithError(
    context,
    400,
    'INVALID_REQUEST',
    'The prepare-run request is invalid.',
  );

const respondIdentityRejected = (context: WorkerContext): Response =>
  respondWithError(
    context,
    401,
    'OIDC_IDENTITY_REJECTED',
    'The protected runner identity could not be verified.',
  );

const respondDependencyUnavailable = (context: WorkerContext): Response =>
  respondWithError(
    context,
    503,
    'DEPENDENCY_UNAVAILABLE',
    'AC265 runner authorization is unavailable.',
  );

const hasErrorCode = (error: unknown, expectedCode: string): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  try {
    return 'code' in error && error.code === expectedCode;
  } catch {
    return false;
  }
};

const isConflict = (error: unknown): boolean =>
  error instanceof Ac265RunConflictError ||
  hasErrorCode(error, 'AC265_RUN_CONFLICT');

const contentTypeIsJson = (value: string | undefined): boolean => {
  if (value === undefined) return false;
  const [mediaType, ...parameters] = value.split(';');
  if (mediaType?.trim().toLowerCase() !== 'application/json') return false;
  for (const parameter of parameters) {
    const [rawName, rawValue, ...extra] = parameter.split('=');
    if (
      rawName?.trim().toLowerCase() === 'charset' &&
      rawValue !== undefined &&
      extra.length === 0
    ) {
      const charset = rawValue.trim().replace(/^"|"$/gu, '').toLowerCase();
      if (charset !== 'utf-8' && charset !== 'utf8') return false;
    }
  }
  return true;
};

const readBoundedUtf8Body = async (request: Request): Promise<string> => {
  const contentLength = request.headers.get('content-length');
  if (contentLength !== null) {
    if (!/^[0-9]+$/u.test(contentLength)) throw new InvalidAc265RequestError();
    const declaredBytes = Number(contentLength);
    if (
      !Number.isSafeInteger(declaredBytes) ||
      declaredBytes > MAX_REQUEST_BYTES
    )
      throw new InvalidAc265RequestError();
  }

  const contentEncoding = request.headers.get('content-encoding');
  if (
    contentEncoding !== null &&
    contentEncoding.trim().toLowerCase() !== 'identity'
  )
    throw new InvalidAc265RequestError();

  if (request.body === null) throw new InvalidAc265RequestError();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_REQUEST_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // The request is already rejected; cancellation errors are private.
        }
        throw new InvalidAc265RequestError();
      }
      chunks.push(value);
    }
  } catch {
    try {
      await reader.cancel();
    } catch {
      // The request is already rejected; cancellation errors are private.
    }
    throw new InvalidAc265RequestError();
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(
      bytes,
    );
  } catch {
    throw new InvalidAc265RequestError();
  }
};

const parseJsonString = (source: string, cursor: { value: number }): string => {
  const start = cursor.value;
  cursor.value += 1;
  while (cursor.value < source.length) {
    const current = source[cursor.value];
    if (current === '"') {
      cursor.value += 1;
      const decoded: unknown = JSON.parse(source.slice(start, cursor.value));
      if (typeof decoded !== 'string') throw new InvalidAc265RequestError();
      return decoded;
    }
    if (current === '\\') cursor.value += 2;
    else cursor.value += 1;
  }
  throw new InvalidAc265RequestError();
};

const skipJsonWhitespace = (
  source: string,
  cursor: { value: number },
): void => {
  while (
    source[cursor.value] === ' ' ||
    source[cursor.value] === '\n' ||
    source[cursor.value] === '\r' ||
    source[cursor.value] === '\t'
  )
    cursor.value += 1;
};

const assertNoDuplicateJsonKeys = (source: string): void => {
  const cursor = { value: 0 };

  const parseValue = (): void => {
    skipJsonWhitespace(source, cursor);
    const current = source[cursor.value];
    if (current === '"') {
      parseJsonString(source, cursor);
      return;
    }
    if (current === '{') {
      cursor.value += 1;
      skipJsonWhitespace(source, cursor);
      if (source[cursor.value] === '}') {
        cursor.value += 1;
        return;
      }
      const keys = new Set<string>();
      while (true) {
        skipJsonWhitespace(source, cursor);
        if (source[cursor.value] !== '"') throw new InvalidAc265RequestError();
        const key = parseJsonString(source, cursor);
        if (keys.has(key)) throw new InvalidAc265RequestError();
        keys.add(key);
        skipJsonWhitespace(source, cursor);
        if (source[cursor.value] !== ':') throw new InvalidAc265RequestError();
        cursor.value += 1;
        parseValue();
        skipJsonWhitespace(source, cursor);
        if (source[cursor.value] === '}') {
          cursor.value += 1;
          return;
        }
        if (source[cursor.value] !== ',') throw new InvalidAc265RequestError();
        cursor.value += 1;
      }
    }
    if (current === '[') {
      cursor.value += 1;
      skipJsonWhitespace(source, cursor);
      if (source[cursor.value] === ']') {
        cursor.value += 1;
        return;
      }
      while (true) {
        parseValue();
        skipJsonWhitespace(source, cursor);
        if (source[cursor.value] === ']') {
          cursor.value += 1;
          return;
        }
        if (source[cursor.value] !== ',') throw new InvalidAc265RequestError();
        cursor.value += 1;
      }
    }

    const start = cursor.value;
    // The length guard guarantees this indexed character exists.
    while (
      cursor.value < source.length &&
      !/[\s,}\]]/u.test(source[cursor.value]!)
    )
      cursor.value += 1;
    if (cursor.value === start) throw new InvalidAc265RequestError();
  };

  parseValue();
  skipJsonWhitespace(source, cursor);
  if (cursor.value !== source.length) throw new InvalidAc265RequestError();
};

const parseStrictJson = (source: string): unknown => {
  assertNoDuplicateJsonKeys(source);
  try {
    return JSON.parse(source) as unknown;
  } catch {
    throw new InvalidAc265RequestError();
  }
};

const parseBearerToken = (authorization: string | undefined): string | null => {
  if (authorization === undefined) return null;
  const match = BEARER_COMPACT_JWT.exec(authorization);
  if (match?.[1] === undefined || match[1].length > MAX_BEARER_TOKEN_BYTES)
    return null;
  return match[1];
};

const handlePrepareRun = async (
  context: WorkerContext,
  dependencies: Ac265HostedDependencies,
): Promise<Response> => {
  context.set('operation', 'ac265.hosted.run.prepare');
  context.header('cache-control', 'no-store');

  if (context.env.APP_ENVIRONMENT !== 'staging')
    return respondNotFound(context);

  const token = parseBearerToken(context.req.header('authorization'));
  if (token === null) return respondIdentityRejected(context);

  if (!contentTypeIsJson(context.req.header('content-type')))
    return respondInvalidRequest(context);

  let bodyText: string;
  let requestValue: unknown;
  try {
    bodyText = await readBoundedUtf8Body(context.req.raw);
    requestValue = parseStrictJson(bodyText);
  } catch {
    return respondInvalidRequest(context);
  }
  const parsedRequest =
    ContentSchemaRegistryAc265PrepareRunRequestSchema.safeParse(requestValue);
  if (!parsedRequest.success) return respondInvalidRequest(context);

  let github: Awaited<ReturnType<Ac265HostedDependencies['verifyGithubOidc']>>;
  try {
    github = await dependencies.verifyGithubOidc(token);
  } catch (error: unknown) {
    if (hasErrorCode(error, 'OIDC_IDENTITY_REJECTED'))
      return respondIdentityRejected(context);
    return respondDependencyUnavailable(context);
  }

  const command = ContentSchemaRegistryAc265PrepareRunCommandSchema.safeParse({
    ...parsedRequest.data,
    github,
  });
  if (!command.success) return respondIdentityRejected(context);

  let persisted: unknown;
  try {
    persisted = await dependencies.prepareRun(
      command.data,
      context.req.raw.signal,
    );
  } catch (error: unknown) {
    if (isConflict(error))
      return respondWithError(
        context,
        409,
        'AC265_RUN_CONFLICT',
        'The AC265 run conflicts with an existing authorization.',
      );
    return respondDependencyUnavailable(context);
  }

  const authorization =
    ContentSchemaRegistryAc265RunnerAuthorizationSchema.safeParse(persisted);
  if (!authorization.success) return respondDependencyUnavailable(context);

  context.header('cache-control', 'no-store');
  context.header('x-request-id', context.get('requestId'));
  return context.json(authorization.data, 200);
};

export const registerAc265HostedRoutes = (
  app: WorkerApp,
  dependencies: Ac265HostedDependencies,
): void => {
  app.all(PREPARE_RUN_PATH, async (context) => {
    if (context.req.method !== 'POST') return respondNotFound(context);
    return handlePrepareRun(context, dependencies);
  });
};
