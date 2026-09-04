import { describe, expect, it } from 'vitest';

import {
  AdminWorkspaceRouteRegistrySchema,
  adminWorkspaceRoutePolicies,
} from '@wejammin/contracts';

const expectRegistryIssue = (input: unknown, message: string): void => {
  const result = AdminWorkspaceRouteRegistrySchema.safeParse(input);
  expect(result.success).toBe(false);
  if (result.success) {
    throw new Error(`Expected registry issue: ${message}`);
  }
  expect(result.error.issues.map((issue) => issue.message)).toContain(message);
};

describe('Phase 02 Slice 08 admin route registry coverage', () => {
  it('rejects a duplicate operation identifier', () => {
    const routes = adminWorkspaceRoutePolicies.map((route, index) =>
      index === 1
        ? { ...route, operationId: adminWorkspaceRoutePolicies[0].operationId }
        : route,
    );

    expectRegistryIssue(routes, 'duplicate_operation');
  });

  it('rejects a duplicate method and path pair', () => {
    const routes = adminWorkspaceRoutePolicies.map((route, index) =>
      index === 1
        ? {
            ...route,
            method: adminWorkspaceRoutePolicies[0].method,
            path: adminWorkspaceRoutePolicies[0].path,
          }
        : route,
    );

    expectRegistryIssue(routes, 'duplicate_route');
  });

  it('rejects a route whose active state disagrees with the locked registry', () => {
    const routes = adminWorkspaceRoutePolicies.map((route, index) =>
      index === 0 ? { ...route, active: false } : route,
    );

    expectRegistryIssue(routes, 'active_state_mismatch');
  });
});
