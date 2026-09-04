import {
  forwardPlatformConfigurationRequest,
  resolvePlatformConfigurationBinding,
  type PlatformConfigurationForwardOptions,
} from './platform-configuration-platform-api';

export type PlatformConfigurationRouteEnvironment = Readonly<{
  PLATFORM_API?: unknown;
  PLATFORM_CONFIGURATION_LOCAL_API_ORIGIN?: unknown;
}>;

/** Thin Astro adapter; all security policy stays in the server boundary. */
export const forwardPlatformConfigurationBrowserRequest = (
  request: Request,
  environment: PlatformConfigurationRouteEnvironment,
  path: string,
  method: 'GET' | 'POST',
  options?: PlatformConfigurationForwardOptions,
): Promise<Response> =>
  forwardPlatformConfigurationRequest(
    request,
    resolvePlatformConfigurationBinding(
      environment.PLATFORM_API,
      typeof environment.PLATFORM_CONFIGURATION_LOCAL_API_ORIGIN === 'string'
        ? environment.PLATFORM_CONFIGURATION_LOCAL_API_ORIGIN
        : undefined,
    ),
    path,
    method,
    options,
  );
