import type { ContentSchemaRegistryDependencies } from './types';
import { createHumanHandlers } from './route-human-handlers';
import { createReleaseMutation } from './route-release-handler';
import type { RouteExecutor } from './route-execution';

export const createRouteHandlers = (
  dependencies: ContentSchemaRegistryDependencies,
  execute: RouteExecutor,
) => ({
  ...createHumanHandlers(dependencies, execute),
  releaseMutation: createReleaseMutation(dependencies, execute),
});

export type RouteHandlers = ReturnType<typeof createRouteHandlers>;
