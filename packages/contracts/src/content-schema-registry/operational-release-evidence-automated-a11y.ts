export const CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS = [
  {
    requestedPath: '/',
    expectedFinalPath: '/',
    expectedHttpStatus: 200,
    coverage: 'page',
  },
  {
    requestedPath: '/auth/sign-in',
    expectedFinalPath: '/auth/sign-in',
    expectedHttpStatus: 200,
    coverage: 'page',
  },
  {
    requestedPath: '/app/cms-content-modeling',
    expectedFinalPath: '/auth/sign-in',
    expectedHttpStatus: 200,
    coverage: 'auth-boundary',
  },
] as const;

export const CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_PATHS =
  CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS.map(
    ({ requestedPath }) => requestedPath,
  );
