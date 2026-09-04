import { activeProfilePortfolioRoutePolicies } from './active-routes.ts';
import { deferredProfilePortfolioRoutePolicies } from './deferred-routes.ts';
import type { ProfilePortfolioRoutePolicy } from './route-policy.ts';

export const profilePortfolioRoutePolicies = [
  ...activeProfilePortfolioRoutePolicies,
  ...deferredProfilePortfolioRoutePolicies,
] as const satisfies readonly ProfilePortfolioRoutePolicy[];

export const profilePortfolioActiveOperationIds = new Set(
  activeProfilePortfolioRoutePolicies.map((route) => route.operationId),
);
