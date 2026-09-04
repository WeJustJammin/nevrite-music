import type { WorkerApp, WorkerDependencies } from '../index';
import { createProfilePortfolioRouteRuntime } from './route-runtime';
import { registerProfilePortfolioInvalidRoutes } from './invalid-routes';
import { registerProfilePortfolioMutationRoutes } from './mutation-routes';
import { registerProfilePortfolioReadRoutes } from './read-routes';

export const registerProfilePortfolioRoutes = (
  app: WorkerApp,
  dependencies: WorkerDependencies,
): void => {
  const runtime = createProfilePortfolioRouteRuntime(dependencies);
  registerProfilePortfolioReadRoutes(app, runtime);
  registerProfilePortfolioMutationRoutes(app, runtime);
  registerProfilePortfolioInvalidRoutes(app);
};
