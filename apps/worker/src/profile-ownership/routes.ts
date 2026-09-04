import type { WorkerApp, WorkerDependencies } from '../index';
import { registerProfileClaimRoutes } from './claim-routes';
import { createProfileRouteRuntime } from './route-runtime';
import { registerProfileShadowRoutes } from './shadow-routes';

/** Mounts only the eight active profile-ownership operations. */
export const registerProfileOwnershipRoutes = (
  app: WorkerApp,
  dependencies: WorkerDependencies,
): void => {
  const runtime = createProfileRouteRuntime(dependencies);
  registerProfileShadowRoutes(app, runtime);
  registerProfileClaimRoutes(app, runtime);
};
