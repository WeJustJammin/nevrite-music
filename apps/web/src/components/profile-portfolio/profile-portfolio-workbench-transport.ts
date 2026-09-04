import type {
  ProfilePortfolioAsyncState,
  ProfilePortfolioError,
} from './profile-portfolio-workbench-types';

export const parseProfilePortfolioError = async (
  response: Response,
): Promise<ProfilePortfolioError> => {
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    value = null;
  }
  const body =
    typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const code = typeof body.code === 'string' ? body.code : 'REQUEST_FAILED';
  const message =
    typeof body.message === 'string'
      ? body.message
      : `Request failed (${response.status}).`;
  const requestId =
    typeof body.requestId === 'string' ? body.requestId : 'unknown';
  const retryAfter = Number(response.headers.get('retry-after'));
  return {
    code,
    message,
    requestId,
    ...(Number.isFinite(retryAfter) && retryAfter > 0
      ? { details: { retryAfterSeconds: retryAfter } }
      : {}),
  };
};

export const mutationFailureStatus = (
  status: number,
): ProfilePortfolioAsyncState['status'] =>
  status === 409 ? 'optimistic-rollback' : status >= 500 ? 'degraded' : 'error';
