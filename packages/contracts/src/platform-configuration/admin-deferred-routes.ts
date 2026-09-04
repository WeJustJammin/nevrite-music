import {
  adminRoute,
  bulkRouteErrors,
  searchRouteErrors,
  type AdminWorkspaceRoutePolicy,
} from './admin-route-policy.ts';

export const deferredAdminWorkspaceRoutePolicies = [
  adminRoute(
    'CFG-05B-02',
    'POST',
    '/api/v1/admin/search',
    'Cfg05b02SearchRequestSchema',
    'Cfg05b02SearchResponseSchema',
    60,
    'admin_search',
    8_000,
    'required',
    'none',
    searchRouteErrors,
    false,
  ),
  adminRoute(
    'CFG-05B-03',
    'POST',
    '/api/v1/admin/bulk-operations',
    'Cfg05b03BulkActionRequestSchema',
    'Cfg05b03BulkActionResponseSchema',
    10,
    'admin_bulk_action',
    15_000,
    'required',
    'required',
    bulkRouteErrors,
    false,
  ),
] as const satisfies readonly AdminWorkspaceRoutePolicy[];
