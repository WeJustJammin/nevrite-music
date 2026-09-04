import {
  forwardProfilePortfolioRequest,
  resolveProfilePortfolioBinding,
  type ProfilePortfolioForwardOptions,
} from './profile-portfolio-platform-api.ts';

type ProfilePortfolioRouteEnvironment = Readonly<{
  PLATFORM_API?: unknown;
  PROFILE_PORTFOLIO_LOCAL_API_ORIGIN?: unknown;
}>;

export const forwardProfilePortfolioBrowserRequest = (
  request: Request,
  environment: ProfilePortfolioRouteEnvironment,
  path: string,
  method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT',
  options?: ProfilePortfolioForwardOptions,
): Promise<Response> =>
  forwardProfilePortfolioRequest(
    request,
    resolveProfilePortfolioBinding(
      environment.PLATFORM_API,
      typeof environment.PROFILE_PORTFOLIO_LOCAL_API_ORIGIN === 'string'
        ? environment.PROFILE_PORTFOLIO_LOCAL_API_ORIGIN
        : undefined,
    ),
    path,
    method,
    options,
  );
