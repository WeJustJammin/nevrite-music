import type { JobStatusTransport } from '@wejammin/contracts';

type Awaitable<T> = T | Promise<T>;

export type JobStatusAuthenticationResult =
  | Readonly<{ kind: 'authenticated'; session: unknown }>
  | Readonly<{ kind: 'unauthenticated' }>;

export type JobStatusBoundaryReadResult =
  | Readonly<{ kind: 'resource'; resource: JobStatusTransport }>
  | Readonly<{ kind: 'not_modified'; etag: string }>
  | Readonly<{ kind: 'not_found' }>
  | Readonly<{ kind: 'rate_limited'; retryAfterSeconds: number }>
  | Readonly<{ kind: 'dependency_error' }>;

export interface JobStatusBoundaryPorts {
  /**
   * Must verify the first-party session cookie or equivalent server credential,
   * or delegate that verification atomically to a trusted bound API service.
   */
  readonly authenticate: (
    request: Request,
  ) => Awaitable<JobStatusAuthenticationResult>;
  /** Must enforce actor/party/resource authorization before returning a result. */
  readonly read: (input: {
    readonly request: Request;
    readonly jobId: string;
    readonly session: unknown;
    readonly ifNoneMatch: string | null;
  }) => Awaitable<JobStatusBoundaryReadResult | JobStatusTransport | null>;
}

export type JobStatusBoundaryErrorCode =
  | 'UNAUTHENTICATED'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'DEPENDENCY_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export class JobStatusBoundaryError extends Error {
  readonly code: JobStatusBoundaryErrorCode;
  readonly retryAfterSeconds: number | null;

  constructor(
    code: JobStatusBoundaryErrorCode,
    retryAfterSeconds: number | null = null,
  ) {
    super(code);
    this.name = 'JobStatusBoundaryError';
    this.code = code;
    this.retryAfterSeconds =
      retryAfterSeconds !== null &&
      Number.isSafeInteger(retryAfterSeconds) &&
      retryAfterSeconds >= 0
        ? retryAfterSeconds
        : null;
  }
}

const trustedPorts = new WeakSet<object>();

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function createJobStatusBoundaryPorts(
  ports: JobStatusBoundaryPorts,
): JobStatusBoundaryPorts {
  if (
    typeof ports.authenticate !== 'function' ||
    typeof ports.read !== 'function'
  ) {
    throw new TypeError('Job status boundary ports must provide functions');
  }
  const trusted = Object.freeze({ ...ports });
  trustedPorts.add(trusted);
  return trusted;
}

/** Only a server-created, identity-tracked port can power the API route. */
export function readJobStatusBoundaryPorts(
  locals: unknown,
): JobStatusBoundaryPorts | null {
  if (!isObject(locals)) return null;
  const candidate = locals.jobStatusBoundaryPorts;
  return isObject(candidate) && trustedPorts.has(candidate)
    ? (candidate as unknown as JobStatusBoundaryPorts)
    : null;
}

export const isTrustedJobStatusBoundaryPorts = (
  value: unknown,
): value is JobStatusBoundaryPorts =>
  isObject(value) && trustedPorts.has(value);
