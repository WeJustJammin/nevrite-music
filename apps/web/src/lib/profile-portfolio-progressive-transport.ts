import type { ProfilePortfolioError } from '../components/profile-portfolio/profile-portfolio-workbench-types';

export const profilePortfolioProgressiveResponseError = async (
  response: Response,
): Promise<ProfilePortfolioError> => {
  let body: Record<string, unknown> = {};
  try {
    const value: unknown = await response.json();
    if (typeof value === 'object' && value !== null)
      body = value as Record<string, unknown>;
  } catch {
    // The status and headers still provide a safe generic failure.
  }
  const retryAfter = Number(response.headers.get('retry-after'));
  return {
    code:
      typeof body.code === 'string'
        ? body.code
        : response.status === 409
          ? 'VERSION_CONFLICT'
          : 'REQUEST_FAILED',
    message:
      typeof body.message === 'string'
        ? body.message
        : response.status === 409
          ? 'The current profile version changed. Review changes.'
          : 'Review the highlighted request.',
    requestId:
      typeof body.requestId === 'string'
        ? body.requestId
        : (response.headers.get('x-request-id') ?? 'unknown'),
    ...(Number.isFinite(retryAfter) && retryAfter > 0
      ? { details: { retryAfterSeconds: retryAfter } }
      : {}),
  };
};
