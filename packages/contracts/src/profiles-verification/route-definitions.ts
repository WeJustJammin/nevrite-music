import { activeProfileRoutePolicies } from './active-routes.ts';
import { deferredProfileRoutePolicies } from './deferred-routes.ts';
import type { ProfileRoutePolicy } from './route-policy.ts';

export const profileRoutePolicies = [
  ...activeProfileRoutePolicies,
  ...deferredProfileRoutePolicies,
] as const satisfies readonly ProfileRoutePolicy[];
