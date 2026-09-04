import { z } from 'zod';

import { activeProfilePortfolioRoutePolicies } from './active-routes.ts';
import { deferredProfilePortfolioRoutePolicies } from './deferred-routes.ts';
import { profilePortfolioRoutePolicies } from './route-definitions.ts';
import { ProfilePortfolioRoutePolicySchema } from './route-policy.ts';

export const ProfilePortfolioActiveRouteRegistrySchema = z
  .array(ProfilePortfolioRoutePolicySchema)
  .length(activeProfilePortfolioRoutePolicies.length)
  .superRefine((routes, context) => {
    const activeIds = new Set(
      activeProfilePortfolioRoutePolicies.map((route) => route.operationId),
    );
    routes.forEach((route, index) => {
      if (!activeIds.has(route.operationId))
        context.addIssue({
          code: 'custom',
          path: [index, 'operationId'],
          message: 'inactive_route_mounted',
        });
      if (!route.active)
        context.addIssue({
          code: 'custom',
          path: [index, 'active'],
          message: 'active_registry_requires_active_route',
        });
    });
  })
  .readonly();

export const ProfilePortfolioRouteRegistrySchema = z
  .array(ProfilePortfolioRoutePolicySchema)
  .length(profilePortfolioRoutePolicies.length)
  .superRefine((routes, context) => {
    const ids = new Set<string>();
    const paths = new Set<string>();
    const activeIds = new Set(
      activeProfilePortfolioRoutePolicies.map((route) => route.operationId),
    );
    const catalogIds = new Set(
      profilePortfolioRoutePolicies.map((route) => route.operationId),
    );
    routes.forEach((route, index) => {
      const routeKey = `${route.method} ${route.path}`;
      if (ids.has(route.operationId))
        context.addIssue({
          code: 'custom',
          path: [index, 'operationId'],
          message: 'duplicate_operation',
        });
      if (paths.has(routeKey))
        context.addIssue({
          code: 'custom',
          path: [index, 'path'],
          message: 'duplicate_route',
        });
      if (!catalogIds.has(route.operationId))
        context.addIssue({
          code: 'custom',
          path: [index, 'operationId'],
          message: 'unknown_operation',
        });
      if (route.active !== activeIds.has(route.operationId))
        context.addIssue({
          code: 'custom',
          path: [index, 'active'],
          message: 'active_state_mismatch',
        });
      ids.add(route.operationId);
      paths.add(routeKey);
    });
  })
  .readonly();

export const activeProfilePortfolioRouteRegistry =
  ProfilePortfolioActiveRouteRegistrySchema.parse(
    activeProfilePortfolioRoutePolicies,
  );
export const profilePortfolioRouteRegistry =
  ProfilePortfolioRouteRegistrySchema.parse(profilePortfolioRoutePolicies);
export const deferredProfilePortfolioRouteRegistry =
  deferredProfilePortfolioRoutePolicies;
export type ProfilePortfolioRouteRegistry = z.infer<
  typeof ProfilePortfolioRouteRegistrySchema
>;
