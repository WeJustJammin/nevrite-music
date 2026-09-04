import {
  AddOrganizationTypeRequestSchema,
  CreateOrganizationRequestSchema,
  IdentityStrictEmptySchema,
  OrganizationPathSchema,
  OrganizationReadResponseSchema,
  OrganizationResourceSchema,
  OrganizationTypeAssignmentPathSchema,
  OrganizationTypeAssignmentResourceSchema,
} from '@wejammin/contracts';

import type { WorkerContext, WorkerDependencies } from '../index';
import { responseForAuthError } from '../authentication/boundary';
import {
  configureRelationshipRoute,
  enforceRelationshipRate,
  parseRelationshipCommandHeaders,
  parseRelationshipJsonBody,
  relationshipPathError,
  rejectRelationshipQuery,
  resolveOptionalRelationshipSession,
  resolveRelationshipSession,
} from './relationship-handler-support';
import {
  executePublicRelationship,
  executeRelationship,
} from './relationship-handler-runtime';
import { requireIdentityCsrf } from './route-support';
import type { RecoveryState } from './recovery';

export const createOrganization = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureRelationshipRoute(context, 'ORG-01');
  const body = await parseRelationshipJsonBody(
    context.req.raw,
    CreateOrganizationRequestSchema,
  );
  if (!body.ok) return responseForAuthError(context, body);
  const headers = parseRelationshipCommandHeaders(context.req.raw, false);
  if (!headers.ok) return responseForAuthError(context, headers);
  const csrf = await requireIdentityCsrf(context);
  if (csrf !== null) return csrf;
  const resolved = await resolveRelationshipSession(context, dependencies);
  if (!resolved.ok) return responseForAuthError(context, resolved);
  const limited = await enforceRelationshipRate(
    context,
    dependencies,
    'ORG-01',
    resolved.value,
  );
  if (limited !== null) return limited;
  const input = {
    ...body.value,
    request: context.req.raw,
    session: resolved.value,
    idempotencyKey: headers.value.idempotencyKey,
    ifMatch: null,
  };
  const port = dependencies.identityAuthority?.createOrganization;
  return executeRelationship(
    context,
    dependencies,
    state,
    'ORG-01',
    {
      session: resolved.value,
      idempotencyKey: headers.value.idempotencyKey,
      ifMatch: null,
      mutation: true,
    },
    port === undefined
      ? undefined
      : (signal) => port(input, context.env, signal),
    OrganizationResourceSchema,
    201,
    {
      location: (resource) =>
        `/api/v1/organizations/${resource.organizationId}`,
    },
  );
};

export const readOrganization = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureRelationshipRoute(context, 'ORG-02');
  const path = OrganizationPathSchema.safeParse({
    organizationId: context.req.param('organizationId'),
  });
  if (!path.success)
    return responseForAuthError(
      context,
      relationshipPathError('organizationId'),
    );
  const query = rejectRelationshipQuery(context.req.raw);
  if (!query.ok) return responseForAuthError(context, query);
  const resolved = await resolveOptionalRelationshipSession(
    context,
    dependencies,
  );
  if (!resolved.ok) return responseForAuthError(context, resolved);
  const limited = await enforceRelationshipRate(
    context,
    dependencies,
    'ORG-02',
    resolved.value,
  );
  if (limited !== null) return limited;
  const input = {
    request: context.req.raw,
    session: resolved.value,
    organizationId: path.data.organizationId,
  };
  const port = dependencies.identityAuthority?.readOrganization;
  if (resolved.value === null)
    return executePublicRelationship(
      context,
      dependencies,
      state,
      'ORG-02',
      port === undefined
        ? undefined
        : (signal) => port(input, context.env, signal),
      OrganizationReadResponseSchema,
      path.data.organizationId,
    );
  return executeRelationship(
    context,
    dependencies,
    state,
    'ORG-02',
    {
      session: resolved.value,
      idempotencyKey: null,
      ifMatch: null,
      mutation: false,
      aggregateId: path.data.organizationId,
    },
    port === undefined
      ? undefined
      : (signal) => port(input, context.env, signal),
    OrganizationReadResponseSchema,
    200,
  );
};

export const addOrganizationType = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureRelationshipRoute(context, 'TYPE-01');
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
    AddOrganizationTypeRequestSchema,
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
    'TYPE-01',
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
  const port = dependencies.identityAuthority?.addOrganizationType;
  return executeRelationship(
    context,
    dependencies,
    state,
    'TYPE-01',
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
    OrganizationTypeAssignmentResourceSchema,
    201,
  );
};

export const removeOrganizationType = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureRelationshipRoute(context, 'TYPE-02');
  const path = OrganizationTypeAssignmentPathSchema.safeParse({
    organizationId: context.req.param('organizationId'),
    assignmentId: context.req.param('assignmentId'),
  });
  if (!path.success)
    return responseForAuthError(
      context,
      relationshipPathError('organizationId or assignmentId'),
    );
  const body = await parseRelationshipJsonBody(
    context.req.raw,
    IdentityStrictEmptySchema,
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
    'TYPE-02',
    resolved.value,
  );
  if (limited !== null) return limited;
  const input = {
    request: context.req.raw,
    session: resolved.value,
    organizationId: path.data.organizationId,
    assignmentId: path.data.assignmentId,
    idempotencyKey: headers.value.idempotencyKey,
    ifMatch: headers.value.ifMatch!,
  };
  const port = dependencies.identityAuthority?.removeOrganizationType;
  return executeRelationship(
    context,
    dependencies,
    state,
    'TYPE-02',
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
    OrganizationResourceSchema,
    200,
  );
};
