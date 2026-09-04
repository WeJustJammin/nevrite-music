import { z } from 'zod';

export const RelationshipOperationIdSchema = z.enum([
  'ORG-01',
  'ORG-02',
  'TYPE-01',
  'TYPE-02',
  'MEM-01',
  'MEM-02',
  'MEM-03',
  'MEM-04',
  'MEM-05',
  'MEM-06',
  'REP-01',
  'REP-02',
  'REP-03',
  'REP-04',
  'MAN-01',
  'MAN-02',
  'AUTH-01',
  'GOV-01',
  'GOV-02',
  'GOV-03',
  'GOV-04',
  'NAME-01',
  'NAME-02',
  'TRE-01',
  'TRE-02',
  'LIFE-01',
  'LIFE-02',
  'LIFE-03',
  'LIFE-04',
  'LIFE-05',
]);

export const RelationshipRoutePolicySchema = z
  .object({
    operationId: RelationshipOperationIdSchema,
    active: z.boolean(),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    path: z.string().regex(/^\/api\/v1(?:\/[A-Za-z0-9{}_.:-]+)*$/u),
    auth: z.enum(['public', 'session']),
    rateLimit: z.number().int().positive(),
    rateWindowSeconds: z.number().int().positive(),
    timeoutMs: z.union([z.literal(8_000), z.literal(15_000)]),
    cacheControl: z.enum(['public, max-age=60', 'no-store']),
    idempotency: z.enum(['none', 'required']),
    ifMatch: z.enum(['none', 'required']),
  })
  .strict()
  .readonly();

export type RelationshipOperationId = z.infer<
  typeof RelationshipOperationIdSchema
>;
export type RelationshipRoutePolicy = z.infer<
  typeof RelationshipRoutePolicySchema
>;

const activeOperationIds = new Set<RelationshipOperationId>([
  'ORG-01',
  'ORG-02',
  'TYPE-01',
  'TYPE-02',
  'MEM-01',
  'MEM-02',
  'MEM-03',
  'MEM-04',
  'MEM-05',
  'MEM-06',
]);
const readOperationIds = new Set<RelationshipOperationId>([
  'ORG-02',
  'MEM-06',
  'REP-04',
  'AUTH-01',
  'GOV-02',
  'NAME-02',
  'TRE-01',
  'LIFE-05',
]);
const publicOperationIds = new Set<RelationshipOperationId>(['ORG-02']);

const route = (
  operationId: RelationshipOperationId,
  method: RelationshipRoutePolicy['method'],
  path: string,
  rateLimit: number,
): RelationshipRoutePolicy => {
  const read = readOperationIds.has(operationId);
  return {
    operationId,
    active: activeOperationIds.has(operationId),
    method,
    path,
    auth: publicOperationIds.has(operationId) ? 'public' : 'session',
    rateLimit,
    rateWindowSeconds: 60,
    timeoutMs: read ? 8_000 : 15_000,
    cacheControl: publicOperationIds.has(operationId)
      ? 'public, max-age=60'
      : 'no-store',
    idempotency: read ? 'none' : 'required',
    ifMatch: read || operationId === 'ORG-01' ? 'none' : 'required',
  };
};

export const relationshipRoutePolicies = [
  route('ORG-01', 'POST', '/api/v1/organizations', 60),
  route('ORG-02', 'GET', '/api/v1/organizations/{organizationId}', 120),
  route(
    'TYPE-01',
    'POST',
    '/api/v1/organizations/{organizationId}/type-assignments',
    60,
  ),
  route(
    'TYPE-02',
    'DELETE',
    '/api/v1/organizations/{organizationId}/type-assignments/{assignmentId}',
    60,
  ),
  route(
    'MEM-01',
    'POST',
    '/api/v1/organizations/{organizationId}/membership-invitations',
    60,
  ),
  route(
    'MEM-02',
    'POST',
    '/api/v1/organizations/{organizationId}/membership-assertions',
    60,
  ),
  route('MEM-03', 'POST', '/api/v1/membership-tenures/{tenureId}/accept', 60),
  route('MEM-04', 'POST', '/api/v1/membership-tenures/{tenureId}/end', 10),
  route(
    'MEM-05',
    'POST',
    '/api/v1/membership-tenures/{tenureId}/capacity-periods',
    60,
  ),
  route(
    'MEM-06',
    'GET',
    '/api/v1/organizations/{organizationId}/memberships',
    300,
  ),
  route('REP-01', 'POST', '/api/v1/representation-edges', 60),
  route('REP-02', 'POST', '/api/v1/representation-edges/{edgeId}/confirm', 10),
  route('REP-03', 'POST', '/api/v1/representation-edges/{edgeId}/revoke', 10),
  route('REP-04', 'GET', '/api/v1/parties/{partyId}/representation-edges', 300),
  route('MAN-01', 'POST', '/api/v1/mandates', 10),
  route('MAN-02', 'POST', '/api/v1/mandates/{mandateId}/revoke', 10),
  route('AUTH-01', 'GET', '/api/v1/parties/{partyId}/authority', 300),
  route(
    'GOV-01',
    'POST',
    '/api/v1/organizations/{organizationId}/governance-terms',
    10,
  ),
  route(
    'GOV-02',
    'GET',
    '/api/v1/organizations/{organizationId}/governance-terms/{termsId}',
    300,
  ),
  route('GOV-03', 'POST', '/api/v1/governance-terms/{termsId}/confirm', 10),
  route('GOV-04', 'POST', '/api/v1/governance-terms/{termsId}/activate', 10),
  route(
    'NAME-01',
    'POST',
    '/api/v1/organizations/{organizationId}/name-ownership-statements',
    60,
  ),
  route(
    'NAME-02',
    'GET',
    '/api/v1/organizations/{organizationId}/name-ownership-statements',
    300,
  ),
  route(
    'TRE-01',
    'GET',
    '/api/v1/organizations/{organizationId}/treasury-authority',
    120,
  ),
  route(
    'TRE-02',
    'POST',
    '/api/v1/organizations/{organizationId}/treasury-authorizations',
    10,
  ),
  route('LIFE-01', 'POST', '/api/v1/organizations/{organizationId}/close', 10),
  route('LIFE-02', 'POST', '/api/v1/organizations/{organizationId}/reopen', 10),
  route(
    'LIFE-03',
    'POST',
    '/api/v1/organizations/{organizationId}/dissolve',
    10,
  ),
  route(
    'LIFE-04',
    'POST',
    '/api/v1/organizations/{organizationId}/re-form',
    10,
  ),
  route(
    'LIFE-05',
    'GET',
    '/api/v1/organizations/{organizationId}/lineage',
    300,
  ),
] satisfies readonly RelationshipRoutePolicy[];

export const activeRelationshipRoutePolicies = relationshipRoutePolicies.filter(
  ({ active }) => active,
);
