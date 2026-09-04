import {
  CapacityPeriodRequestSchema,
  MembershipCapacityPeriodResourceSchema,
  MembershipTenurePathSchema,
} from '@wejammin/contracts';

import type { WorkerContext, WorkerDependencies } from '../index';
import { responseForAuthError } from '../authentication/boundary';
import {
  configureRelationshipRoute,
  enforceRelationshipRate,
  parseRelationshipCommandHeaders,
  parseRelationshipJsonBody,
  relationshipPathError,
  resolveRelationshipSession,
} from './relationship-handler-support';
import { executeRelationship } from './relationship-handler-runtime';
import { requireIdentityCsrf } from './route-support';
import type { RecoveryState } from './recovery';

export const addCapacityPeriod = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureRelationshipRoute(context, 'MEM-05');
  const path = MembershipTenurePathSchema.safeParse({
    tenureId: context.req.param('tenureId'),
  });
  if (!path.success)
    return responseForAuthError(context, relationshipPathError('tenureId'));
  const body = await parseRelationshipJsonBody(
    context.req.raw,
    CapacityPeriodRequestSchema,
  );
  if (!body.ok) return responseForAuthError(context, body);
  const headers = parseRelationshipCommandHeaders(context.req.raw, true);
  if (!headers.ok) return responseForAuthError(context, headers);
  const csrf = await requireIdentityCsrf(context);
  if (csrf !== null) return csrf;
  const resolved = await resolveRelationshipSession(context, dependencies);
  if (!resolved.ok) return responseForAuthError(context, resolved);
  const limited = await enforceRelationshipRate(
    context,
    dependencies,
    'MEM-05',
    resolved.value,
  );
  if (limited !== null) return limited;
  const input = {
    ...body.value,
    request: context.req.raw,
    session: resolved.value,
    tenureId: path.data.tenureId,
    idempotencyKey: headers.value.idempotencyKey,
    ifMatch: headers.value.ifMatch!,
  };
  const port = dependencies.identityAuthority?.addCapacityPeriod;
  return executeRelationship(
    context,
    dependencies,
    state,
    'MEM-05',
    {
      session: resolved.value,
      idempotencyKey: headers.value.idempotencyKey,
      ifMatch: headers.value.ifMatch!,
      mutation: true,
      aggregateId: path.data.tenureId,
    },
    port === undefined
      ? undefined
      : (signal) => port(input, context.env, signal),
    MembershipCapacityPeriodResourceSchema,
    201,
  );
};
