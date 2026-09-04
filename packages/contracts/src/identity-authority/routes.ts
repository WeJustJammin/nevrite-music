import { z } from 'zod';

export const IdentityOperationIdSchema = z.enum([
  'BE01b-01',
  'BE01b-02',
  'BE01b-03',
  'BE01b-04',
  'BE01b-05',
  'BE01b-06',
  'BE01b-07',
  'BE01b-08',
  'BE01b-09',
  'BE01b-10',
  'BE01b-11',
  'BE01b-12',
  'BE01b-13',
  'BE01b-14',
  'BE01b-15',
  'BE01b-16',
  'BE01b-17',
  'BE01b-18',
]);

export type IdentityOperationId = z.infer<typeof IdentityOperationIdSchema>;
export type IdentityRoutePolicy = Readonly<{
  operationId: IdentityOperationId;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  auth: 'public' | 'session' | 'session_step_up';
  rateLimit: number;
  rateWindowSeconds: number;
  timeoutMs: 8_000 | 15_000;
  cacheControl: 'public, max-age=60' | 'no-store';
  idempotency: 'none' | 'required';
  ifMatch: 'none' | 'required';
}>;

const route = (
  operationId: IdentityOperationId,
  method: IdentityRoutePolicy['method'],
  path: string,
  rateLimit: number,
  rateWindowSeconds: number,
  idempotency: IdentityRoutePolicy['idempotency'],
  ifMatch: IdentityRoutePolicy['ifMatch'],
  auth: IdentityRoutePolicy['auth'] = 'session',
): IdentityRoutePolicy => ({
  operationId,
  method,
  path,
  auth,
  rateLimit,
  rateWindowSeconds,
  timeoutMs: method === 'GET' ? 8_000 : 15_000,
  cacheControl: operationId === 'BE01b-18' ? 'public, max-age=60' : 'no-store',
  idempotency,
  ifMatch,
});

export const identityRoutePolicies = [
  route(
    'BE01b-01',
    'POST',
    '/api/v1/me/identity',
    2,
    86_400,
    'required',
    'none',
  ),
  route('BE01b-02', 'GET', '/api/v1/me/identity', 300, 60, 'none', 'none'),
  route('BE01b-03', 'POST', '/api/v1/me/facets', 60, 60, 'required', 'none'),
  route(
    'BE01b-04',
    'DELETE',
    '/api/v1/me/facets/:facetCode',
    30,
    60,
    'required',
    'required',
  ),
  route('BE01b-05', 'POST', '/api/v1/aliases', 10, 60, 'required', 'none'),
  route(
    'BE01b-06',
    'PATCH',
    '/api/v1/aliases/:aliasId',
    30,
    60,
    'required',
    'required',
  ),
  route(
    'BE01b-07',
    'POST',
    '/api/v1/aliases/:aliasId/handle-changes',
    10,
    60,
    'required',
    'required',
  ),
  route(
    'BE01b-08',
    'POST',
    '/api/v1/aliases/:aliasId/retire',
    10,
    60,
    'required',
    'required',
  ),
  route(
    'BE01b-09',
    'POST',
    '/api/v1/aliases/:aliasId/transfer-offers',
    10,
    60,
    'required',
    'none',
  ),
  route(
    'BE01b-10',
    'POST',
    '/api/v1/alias-transfer-offers/:offerId/accept',
    10,
    60,
    'required',
    'required',
  ),
  route(
    'BE01b-11',
    'POST',
    '/api/v1/alias-transfer-offers/:offerId/decline',
    10,
    60,
    'required',
    'required',
  ),
  route(
    'BE01b-12',
    'GET',
    '/api/v1/me/acting-contexts',
    300,
    60,
    'none',
    'none',
  ),
  route(
    'BE01b-13',
    'POST',
    '/api/v1/me/acting-context-bindings',
    60,
    60,
    'required',
    'none',
  ),
  route(
    'BE01b-14',
    'GET',
    '/api/v1/me/legal-identity',
    60,
    60,
    'none',
    'none',
    'session_step_up',
  ),
  route(
    'BE01b-15',
    'PUT',
    '/api/v1/me/legal-identity',
    5,
    3600,
    'required',
    'required',
    'session_step_up',
  ),
  route(
    'BE01b-16',
    'POST',
    '/api/v1/legal-identity-disclosures',
    10,
    60,
    'required',
    'required',
    'session_step_up',
  ),
  route(
    'BE01b-17',
    'GET',
    '/api/v1/legal-identity-disclosures/:disclosureId',
    60,
    60,
    'none',
    'none',
    'session_step_up',
  ),
  route(
    'BE01b-18',
    'GET',
    '/api/v1/identity/parties/:partyId/projection',
    120,
    60,
    'none',
    'none',
    'public',
  ),
] as const satisfies readonly IdentityRoutePolicy[];
