import { assertContentSchemaRegistryRouteRegistry } from './route-policy.ts';
import { humanRoutePolicies } from './routes-human.ts';
import { readRoutePolicies } from './routes-read.ts';
import { releaseRoutePolicies } from './routes-release.ts';

const routePolicies = [
  ...humanRoutePolicies,
  releaseRoutePolicies[0],
  ...readRoutePolicies,
  releaseRoutePolicies[1],
] as const;

export const contentSchemaRegistryRoutePolicies =
  assertContentSchemaRegistryRouteRegistry(routePolicies);
