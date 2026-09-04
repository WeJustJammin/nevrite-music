import { z } from 'zod';

import {
  Cfg05a01DefinitionResponseSchema,
  Cfg05a01RegisterDefinitionRequestSchema,
  Cfg05a02EffectiveValueQuerySchema,
  Cfg05a02EffectiveValueResponseSchema,
  Cfg05a03ChangeResponseSchema,
  Cfg05a03ProposeChangeRequestSchema,
  Cfg05a04ChangeActionRequestSchema,
  Cfg05a04ChangeActionResponseSchema,
} from './settings.ts';

export const ConfigurationOperationIdSchema = z.enum([
  'CFG-05A-01',
  'CFG-05A-02',
  'CFG-05A-03',
  'CFG-05A-04',
]);

export const CONFIGURATION_ROUTE_CONTRACTS = [
  {
    operationId: 'CFG-05A-01',
    method: 'POST',
    path: '/api/v1/internal/config/definitions',
    request: Cfg05a01RegisterDefinitionRequestSchema,
    response: Cfg05a01DefinitionResponseSchema,
    successStatus: 201,
    authClass: 'release_service',
    idempotencyRequired: true,
    deadlineMs: 15_000,
  },
  {
    operationId: 'CFG-05A-02',
    method: 'GET',
    path: '/api/v1/config/:key/effective',
    request: Cfg05a02EffectiveValueQuerySchema,
    response: Cfg05a02EffectiveValueResponseSchema,
    successStatus: 200,
    authClass: 'authenticated_or_service',
    idempotencyRequired: false,
    deadlineMs: 8_000,
  },
  {
    operationId: 'CFG-05A-03',
    method: 'POST',
    path: '/api/v1/admin/settings/:definitionId/changes',
    request: Cfg05a03ProposeChangeRequestSchema,
    response: Cfg05a03ChangeResponseSchema,
    successStatus: 201,
    authClass: 'authenticated_step_up_by_risk',
    idempotencyRequired: true,
    deadlineMs: 15_000,
  },
  {
    operationId: 'CFG-05A-04',
    method: 'POST',
    path: '/api/v1/admin/settings/changes/:reviewId/actions',
    request: Cfg05a04ChangeActionRequestSchema,
    response: Cfg05a04ChangeActionResponseSchema,
    successStatus: 200,
    authClass: 'authenticated_step_up',
    idempotencyRequired: true,
    deadlineMs: 15_000,
  },
] as const;

export const ConfigurationRouteMetadataSchema = z.strictObject({
  operationId: ConfigurationOperationIdSchema,
  method: z.enum(['GET', 'POST']),
  path: z.string().startsWith('/api/v1/'),
  successStatus: z.number().int().min(200).max(202),
  authClass: z.enum([
    'release_service',
    'authenticated_or_service',
    'authenticated_step_up_by_risk',
    'authenticated_step_up',
  ]),
  idempotencyRequired: z.boolean(),
  deadlineMs: z.number().int().min(1).max(15_000),
});
