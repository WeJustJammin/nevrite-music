import type { ServerEnvironment } from '@wejammin/config/environment';
import { RequestIdSchema } from '@wejammin/contracts';

import {
  JobStatusDependencyError,
  JobStatusInternalError,
} from './job-status-types';

export const DEFAULT_MAX_RESPONSE_BYTES = 64 * 1024;
export const MAX_BEARER_BYTES = 4 * 1024;
export const RPC_NAME = /^[a-z][a-z0-9_]{0,63}$/;
export const POSITIVE_BIGINT = /^[1-9]\d{0,18}$/;
export const JOB_STATUS_RPC = 'read_authorized_job';
export const RATE_LIMIT_RPC = 'consume_job_read_rate_limit';

export type SupabaseEnvironment = Pick<
  ServerEnvironment,
  'SUPABASE_SECRET_KEY' | 'SUPABASE_URL'
>;

export type JobStatusProductionFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type JobStatusProductionAuthorityKind =
  'acting_party' | 'operator' | 'user';

export type JobStatusProductionAuthority = Readonly<{
  actingPartyId?: string | null;
  capabilities?: readonly string[];
  reason?: unknown;
  stepUpVerified?: boolean;
}>;

export type VerifiedJobStatusSession = Readonly<{
  userId: string;
}>;

export type JobStatusProductionAuthorityResolver = (
  input: Readonly<{
    request: Request;
    session: VerifiedJobStatusSession;
    signal: AbortSignal;
  }>,
) => unknown | Promise<unknown>;

export type JobStatusProductionOptions = Readonly<{
  environment: SupabaseEnvironment;
  fetchImpl: JobStatusProductionFetch;
  jobStatusRpc?: string;
  maxResponseBytes?: number;
  rateLimitRpc?: string;
  resolveServerAuthority?: JobStatusProductionAuthorityResolver;
  now?: () => number;
}>;

export type ServerAuthority = Readonly<{
  actorId: string;
  actingPartyId: string | null;
  capabilities: readonly string[];
  capability: string | null;
  kind: JobStatusProductionAuthorityKind;
  stepUpVerified: boolean;
  reason: string | null;
}>;

export class JobStatusProductionConfigurationError extends Error {
  constructor(message = 'Invalid JobStatus production configuration') {
    super(message);
    this.name = 'JobStatusProductionConfigurationError';
  }
}

export class JobStatusProductionUnavailableError extends JobStatusDependencyError {
  constructor() {
    super('JobStatus production dependency unavailable');
    this.name = 'JobStatusProductionUnavailableError';
  }
}

export class JobStatusProductionInternalError extends JobStatusInternalError {
  constructor() {
    super('JobStatus production response was invalid');
    this.name = 'JobStatusProductionInternalError';
  }
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const hasExactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
};

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && RequestIdSchema.safeParse(value).success;

export const isControlFree = (value: string): boolean =>
  ![...value].some((character) => {
    const codePoint = character.charCodeAt(0);
    return (
      codePoint <= 0x1f ||
      codePoint === 0x7f ||
      (codePoint >= 0x80 && codePoint <= 0x9f)
    );
  });

export const normalizeConfiguration = (options: JobStatusProductionOptions) => {
  if (
    !isRecord(options) ||
    !isRecord(options.environment) ||
    typeof options.fetchImpl !== 'function' ||
    (options.resolveServerAuthority !== undefined &&
      typeof options.resolveServerAuthority !== 'function')
  ) {
    throw new JobStatusProductionConfigurationError();
  }

  const { SUPABASE_SECRET_KEY: secret, SUPABASE_URL: rawUrl } =
    options.environment;
  if (
    typeof secret !== 'string' ||
    secret.length === 0 ||
    !isControlFree(secret) ||
    secret.length > 512 ||
    typeof rawUrl !== 'string'
  ) {
    throw new JobStatusProductionConfigurationError();
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new JobStatusProductionConfigurationError();
  }
  if (
    (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') ||
    parsedUrl.username !== '' ||
    parsedUrl.password !== ''
  ) {
    throw new JobStatusProductionConfigurationError();
  }

  const maxResponseBytes =
    options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
  if (!Number.isSafeInteger(maxResponseBytes) || maxResponseBytes < 1_024) {
    throw new JobStatusProductionConfigurationError();
  }
  const jobStatusRpc = options.jobStatusRpc ?? JOB_STATUS_RPC;
  const rateLimitRpc = options.rateLimitRpc ?? RATE_LIMIT_RPC;
  if (!RPC_NAME.test(jobStatusRpc) || !RPC_NAME.test(rateLimitRpc)) {
    throw new JobStatusProductionConfigurationError();
  }

  return {
    baseUrl: rawUrl.replace(/\/+$/, ''),
    fetchImpl: options.fetchImpl,
    jobStatusRpc,
    maxResponseBytes,
    now: options.now ?? Date.now,
    rateLimitRpc,
    resolveServerAuthority: options.resolveServerAuthority,
    secret,
  } as const;
};

export const parseBearerToken = (request: Request): string | null => {
  const value = request.headers.get('authorization');
  if (
    value === null ||
    value.length > MAX_BEARER_BYTES ||
    !isControlFree(value) ||
    !/^Bearer [^\s]+$/.test(value)
  ) {
    return null;
  }
  return value.slice('Bearer '.length);
};

export const readJson = async (
  response: Response,
  maxResponseBytes: number,
): Promise<unknown> => {
  const contentLength = response.headers.get('content-length');
  if (contentLength !== null) {
    const parsedLength = Number(contentLength);
    if (
      !Number.isSafeInteger(parsedLength) ||
      parsedLength < 0 ||
      parsedLength > maxResponseBytes
    ) {
      throw new JobStatusProductionUnavailableError();
    }
  }

  let body: string;
  try {
    body = await response.text();
  } catch {
    throw new JobStatusProductionUnavailableError();
  }
  if (new TextEncoder().encode(body).byteLength > maxResponseBytes) {
    throw new JobStatusProductionUnavailableError();
  }
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new JobStatusProductionInternalError();
  }
};

export const callRpc = async (
  input: Readonly<{
    baseUrl: string;
    fetchImpl: JobStatusProductionFetch;
    maxResponseBytes: number;
    name: string;
    secret: string;
    signal: AbortSignal;
    body: Record<string, unknown>;
  }>,
): Promise<unknown> => {
  if (input.signal.aborted) throw new JobStatusProductionUnavailableError();
  let response: Response;
  try {
    response = await input.fetchImpl(
      `${input.baseUrl}/rest/v1/rpc/${input.name}`,
      {
        body: JSON.stringify(input.body),
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${input.secret}`,
          'Accept-Profile': 'platform_api',
          'Content-Profile': 'platform_api',
          'Content-Type': 'application/json',
          apikey: input.secret,
        },
        method: 'POST',
        signal: input.signal,
      },
    );
  } catch {
    throw new JobStatusProductionUnavailableError();
  }
  if (response.status < 200 || response.status >= 300) {
    throw new JobStatusProductionUnavailableError();
  }
  return readJson(response, input.maxResponseBytes);
};

export const parseVersion = (value: unknown): string | null => {
  const text =
    typeof value === 'string'
      ? value
      : typeof value === 'number' && Number.isSafeInteger(value)
        ? String(value)
        : null;
  if (text === null || !POSITIVE_BIGINT.test(text)) return null;
  return BigInt(text) <= 9_223_372_036_854_775_807n ? text : null;
};
