import {
  ADMIN_WORKSPACE_ROUTE_CONTRACTS,
  CONFIGURATION_ROUTE_CONTRACTS,
} from '@wejammin/contracts';

export type PlatformConfigurationMethod = 'GET' | 'POST';

export const PLATFORM_CONFIGURATION_ROUTE_CONTRACTS = [
  ...CONFIGURATION_ROUTE_CONTRACTS,
  ...ADMIN_WORKSPACE_ROUTE_CONTRACTS,
] as const;

const supportedMethods = new Set<PlatformConfigurationMethod>(['GET', 'POST']);

const isSafeApiPath = (path: string): boolean =>
  path.startsWith('/api/v1/') &&
  ![...path].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  }) &&
  !/[?#\\]/u.test(path) &&
  path.split('/').every((segment) => segment !== '.' && segment !== '..');

const routePattern = (path: string): RegExp =>
  new RegExp(
    `^${path
      .split('/')
      .map((segment) =>
        segment.startsWith(':')
          ? '[^/]+'
          : segment.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'),
      )
      .join('/')}$`,
    'u',
  );

const activeAdminWorkspaceOperations = new Set([
  'CFG-05B-01',
  'CFG-05B-04',
  'CFG-05B-05',
]);

export const deferredAdminWorkspacePaths = new Set([
  'POST /api/v1/admin/search',
  'POST /api/v1/admin/bulk-operations',
]);

const browserRoutes = PLATFORM_CONFIGURATION_ROUTE_CONTRACTS.filter(
  (route) =>
    route.operationId !== 'CFG-05A-01' &&
    (!route.operationId.startsWith('CFG-05B-') ||
      activeAdminWorkspaceOperations.has(route.operationId)) &&
    route.path.startsWith('/api/v1/') &&
    supportedMethods.has(route.method),
).map((route) => ({
  operationId: route.operationId,
  method: route.method,
  path: route.path,
  pattern: routePattern(route.path),
}));

export const PLATFORM_CONFIGURATION_BROWSER_ROUTES = browserRoutes.map(
  ({ operationId, method, path }) => ({ operationId, method, path }),
);

export const isSafePlatformConfigurationPath = isSafeApiPath;

export const isSupportedPlatformConfigurationMethod = (
  method: string,
): method is PlatformConfigurationMethod =>
  supportedMethods.has(method as PlatformConfigurationMethod);

export const matchingPlatformConfigurationRoute = (
  path: string,
  method: string,
) =>
  browserRoutes.find(
    (route) => route.method === method && route.pattern.test(path),
  );
