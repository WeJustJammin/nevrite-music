import {
  ApiErrorSchema,
  createRequestId,
  JobIdPathSchema,
  JobStatusTransportSchema,
  RequestIdSchema,
  type ApiError,
  type JobStatusTransport,
} from '@wejammin/contracts';

export const JOB_STATUS_API_PREFIX = '/api/v1/jobs';

export const jobStatusHref = (jobId: string): string => {
  const parsed = JobIdPathSchema.parse({ jobId });
  return `${JOB_STATUS_API_PREFIX}/${encodeURIComponent(parsed.jobId)}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isRfc3339Timestamp = (value: string): boolean => {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/u,
  );
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][month - 1];
  return (
    daysInMonth !== undefined &&
    day >= 1 &&
    day <= daysInMonth &&
    Number.isFinite(Date.parse(value))
  );
};

const responseRequestId = (response: Response): string => {
  const header = response.headers.get('x-request-id');
  return RequestIdSchema.safeParse(header).success
    ? RequestIdSchema.parse(header)
    : createRequestId(undefined);
};

const safeApiError = (body: unknown, requestId: string): ApiError => {
  const candidate = isRecord(body) && 'error' in body ? body.error : body;
  const parsed = ApiErrorSchema.safeParse(candidate);
  return parsed.success
    ? parsed.data
    : {
        code: 'INTERNAL_ERROR',
        details: {},
        message: 'The job status could not be read.',
        requestId: RequestIdSchema.parse(requestId),
      };
};

export class JobStatusHttpError extends Error {
  readonly apiError: ApiError;
  readonly httpStatus: number;
  readonly retryAt: string | null;
  readonly retryAfterSeconds: number | null;

  constructor(
    apiError: ApiError,
    httpStatus: number,
    retryAt: string | null,
    retryAfterSeconds: number | null = null,
  ) {
    super(apiError.message);
    this.name = 'JobStatusHttpError';
    this.apiError = apiError;
    this.httpStatus = httpStatus;
    this.retryAt = retryAt;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function readJobStatusResponse(
  response: Response,
  previous: JobStatusTransport | null = null,
): Promise<JobStatusTransport> {
  const requestId = responseRequestId(response);
  const responseEtag = response.headers.get('etag');
  if (response.status === 304) {
    if (previous !== null && responseEtag === previous.etag) return previous;
    throw new JobStatusHttpError(
      safeApiError(null, requestId),
      response.status,
      null,
    );
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const apiError = safeApiError(body, requestId);
    const retryAtHeader = response.headers.get('retry-at');
    const retryAt =
      retryAtHeader !== null && isRfc3339Timestamp(retryAtHeader)
        ? retryAtHeader
        : null;
    const retryAfterHeader = response.headers.get('retry-after');
    const retryAfterCandidate =
      retryAfterHeader === null ? NaN : Number(retryAfterHeader);
    const retryAfterSeconds =
      Number.isSafeInteger(retryAfterCandidate) && retryAfterCandidate >= 0
        ? retryAfterCandidate
        : null;
    throw new JobStatusHttpError(
      apiError,
      response.status,
      retryAt,
      retryAfterSeconds,
    );
  }

  return JobStatusTransportSchema.parse({ data: body, etag: responseEtag });
}

export type JobStatusReader = (
  signal: AbortSignal,
) => Promise<JobStatusTransport>;
export type JobStatusFetcher = (
  jobId: string,
  signal: AbortSignal,
) => Promise<JobStatusTransport>;

/**
 * Reads an optional status already authorized by the server route. Query
 * parameters and browser headers are intentionally not considered here.
 */
export const readServerInfrastructureJobStatus = (
  locals: unknown,
): JobStatusTransport | undefined => {
  if (!isRecord(locals)) return undefined;
  const candidate = locals.serverInfrastructureJobStatus;
  const parsed = JobStatusTransportSchema.safeParse(candidate);
  return parsed.success ? parsed.data : undefined;
};

export function createJobStatusReader(
  jobId: string,
  fetcher: typeof fetch = globalThis.fetch,
): JobStatusReader {
  const href = jobStatusHref(jobId);
  let previous: JobStatusTransport | null = null;
  return async (signal: AbortSignal): Promise<JobStatusTransport> => {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (previous !== null) headers['if-none-match'] = previous.etag;
    try {
      const response = await fetcher(href, {
        method: 'GET',
        headers,
        credentials: 'same-origin',
        cache: 'no-store',
        signal,
      });
      const resource = await readJobStatusResponse(response, previous);
      previous = resource;
      return resource;
    } catch (error) {
      if (
        error instanceof JobStatusHttpError &&
        [401, 403, 404].includes(error.httpStatus)
      ) {
        previous = null;
      }
      throw error;
    }
  };
}

export function createJobStatusFetcher(
  fetcher: typeof fetch = globalThis.fetch,
): JobStatusFetcher {
  return async (jobId, signal) => createJobStatusReader(jobId, fetcher)(signal);
}
