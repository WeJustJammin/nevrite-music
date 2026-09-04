import {
  AcceptMembershipRequestSchema,
  EndMembershipRequestSchema,
  HistoricalMembershipAssertionRequestSchema,
  MembershipInvitationRequestSchema,
  MembershipTenurePathSchema,
  MembershipTenureResourceSchema,
  OrganizationPathSchema,
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

export const inviteMembership = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureRelationshipRoute(context, 'MEM-01');
  const path = OrganizationPathSchema.safeParse({
    organizationId: context.req.param('organizationId'),
  });
  if (!path.success)
    return responseForAuthError(
      context,
      relationshipPathError('organizationId'),
    );
  const body = await parseRelationshipJsonBody(
    context.req.raw,
    MembershipInvitationRequestSchema,
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
    'MEM-01',
    resolved.value,
  );
  if (limited !== null) return limited;
  const input = {
    ...body.value,
    request: context.req.raw,
    session: resolved.value,
    organizationId: path.data.organizationId,
    idempotencyKey: headers.value.idempotencyKey,
    ifMatch: headers.value.ifMatch!,
  };
  const port = dependencies.identityAuthority?.inviteMembership;
  return executeRelationship(
    context,
    dependencies,
    state,
    'MEM-01',
    {
      session: resolved.value,
      idempotencyKey: headers.value.idempotencyKey,
      ifMatch: headers.value.ifMatch!,
      mutation: true,
      aggregateId: path.data.organizationId,
    },
    port === undefined
      ? undefined
      : (signal) => port(input, context.env, signal),
    MembershipTenureResourceSchema,
    201,
  );
};

export const assertMembership = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureRelationshipRoute(context, 'MEM-02');
  const path = OrganizationPathSchema.safeParse({
    organizationId: context.req.param('organizationId'),
  });
  if (!path.success)
    return responseForAuthError(
      context,
      relationshipPathError('organizationId'),
    );
  const body = await parseRelationshipJsonBody(
    context.req.raw,
    HistoricalMembershipAssertionRequestSchema,
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
    'MEM-02',
    resolved.value,
  );
  if (limited !== null) return limited;
  const input = {
    ...body.value,
    request: context.req.raw,
    session: resolved.value,
    organizationId: path.data.organizationId,
    idempotencyKey: headers.value.idempotencyKey,
    ifMatch: headers.value.ifMatch!,
  };
  const port = dependencies.identityAuthority?.assertMembership;
  return executeRelationship(
    context,
    dependencies,
    state,
    'MEM-02',
    {
      session: resolved.value,
      idempotencyKey: headers.value.idempotencyKey,
      ifMatch: headers.value.ifMatch!,
      mutation: true,
      aggregateId: path.data.organizationId,
    },
    port === undefined
      ? undefined
      : (signal) => port(input, context.env, signal),
    MembershipTenureResourceSchema,
    201,
  );
};

export const acceptMembership = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureRelationshipRoute(context, 'MEM-03');
  const path = MembershipTenurePathSchema.safeParse({
    tenureId: context.req.param('tenureId'),
  });
  if (!path.success)
    return responseForAuthError(context, relationshipPathError('tenureId'));
  const body = await parseRelationshipJsonBody(
    context.req.raw,
    AcceptMembershipRequestSchema,
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
    'MEM-03',
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
  const port = dependencies.identityAuthority?.acceptMembership;
  return executeRelationship(
    context,
    dependencies,
    state,
    'MEM-03',
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
    MembershipTenureResourceSchema,
    200,
  );
};

export const endMembership = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureRelationshipRoute(context, 'MEM-04');
  const path = MembershipTenurePathSchema.safeParse({
    tenureId: context.req.param('tenureId'),
  });
  if (!path.success)
    return responseForAuthError(context, relationshipPathError('tenureId'));
  const body = await parseRelationshipJsonBody(
    context.req.raw,
    EndMembershipRequestSchema,
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
    'MEM-04',
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
  const port = dependencies.identityAuthority?.endMembership;
  return executeRelationship(
    context,
    dependencies,
    state,
    'MEM-04',
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
    MembershipTenureResourceSchema,
    200,
  );
};
