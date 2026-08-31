import { JobIdPathSchema } from '@wejammin/contracts';

import {
  boundaryErrorResponse,
  dependencyError,
  errorResponse,
  ifNoneMatchFor,
  notModifiedResponse,
  parseAuthentication,
  parseReadResult,
  requestIdFor,
  successResponse,
} from './job-status-boundary-response';
import {
  isTrustedJobStatusBoundaryPorts,
  JobStatusBoundaryError,
} from './job-status-boundary-types';
import type {
  JobStatusAuthenticationResult,
  JobStatusBoundaryPorts,
  JobStatusBoundaryReadResult,
} from './job-status-boundary-types';

export {
  createJobStatusBoundaryPorts,
  JobStatusBoundaryError,
  readJobStatusBoundaryPorts,
} from './job-status-boundary-types';
export type {
  JobStatusAuthenticationResult,
  JobStatusBoundaryErrorCode,
  JobStatusBoundaryPorts,
  JobStatusBoundaryReadResult,
} from './job-status-boundary-types';

export async function handleJobStatusRead(
  request: Request,
  jobId: string | undefined,
  ports: JobStatusBoundaryPorts | null | undefined,
): Promise<Response> {
  const requestId = requestIdFor(request);
  if (request.method !== 'GET') {
    return errorResponse(
      requestId,
      405,
      'INVALID_REQUEST',
      'Only GET is supported for job status.',
      { method: 'GET' },
    );
  }
  const parsedJobId = JobIdPathSchema.safeParse({ jobId });
  if (!parsedJobId.success) {
    return errorResponse(
      requestId,
      400,
      'INVALID_REQUEST',
      'The jobId path value is invalid.',
      { path: '/path/jobId' },
    );
  }
  if (!isTrustedJobStatusBoundaryPorts(ports)) {
    return dependencyError(requestId);
  }

  let authentication: JobStatusAuthenticationResult | null;
  try {
    authentication = parseAuthentication(await ports.authenticate(request));
  } catch (error) {
    if (error instanceof JobStatusBoundaryError)
      return boundaryErrorResponse(requestId, error);
    return dependencyError(requestId);
  }
  if (authentication === null) return dependencyError(requestId);
  if (authentication.kind === 'unauthenticated') {
    return errorResponse(
      requestId,
      401,
      'UNAUTHENTICATED',
      'Authentication is required.',
    );
  }

  const ifNoneMatch = ifNoneMatchFor(request);
  let result: JobStatusBoundaryReadResult | null;
  try {
    result = parseReadResult(
      await ports.read({
        request,
        jobId: parsedJobId.data.jobId,
        session: authentication.session,
        ifNoneMatch,
      }),
    );
  } catch (error) {
    if (error instanceof JobStatusBoundaryError)
      return boundaryErrorResponse(requestId, error);
    return dependencyError(requestId);
  }
  if (result === null || result.kind === 'dependency_error')
    return dependencyError(requestId);
  if (result.kind === 'not_found') {
    return errorResponse(
      requestId,
      404,
      'NOT_FOUND',
      'The requested job was not found.',
    );
  }
  if (result.kind === 'rate_limited') {
    return errorResponse(
      requestId,
      429,
      'RATE_LIMITED',
      'Too many job status requests.',
      {},
      result.retryAfterSeconds,
    );
  }
  if (result.kind === 'not_modified') {
    return ifNoneMatch === result.etag
      ? notModifiedResponse(requestId, result.etag)
      : dependencyError(requestId);
  }
  if (result.resource.data.id !== parsedJobId.data.jobId) {
    return errorResponse(
      requestId,
      404,
      'NOT_FOUND',
      'The requested job was not found.',
    );
  }
  return ifNoneMatch === result.resource.etag
    ? notModifiedResponse(requestId, result.resource.etag)
    : successResponse(requestId, result.resource);
}
