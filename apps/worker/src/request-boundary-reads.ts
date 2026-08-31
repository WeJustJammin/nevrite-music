import {
  AuthenticatedReadRequestSchema,
  InfrastructureQuerySchema,
  PublicReadRequestSchema,
  type AuthenticatedReadRequest,
} from '@wejammin/contracts';

import {
  invalid,
  issueDetails,
  parseQueryValues,
  requestIdFor,
} from './request-boundary-support';
import {
  type PublicReadRequest,
  type RequestBoundaryResult,
} from './request-boundary-types';

export const parsePublicReadRequest = (
  request: Request,
): RequestBoundaryResult<PublicReadRequest> => {
  const requestId = requestIdFor(request);
  if (request.method.toUpperCase() !== 'GET') {
    return invalid(requestId, 'The public read requires GET.');
  }
  const values = parseQueryValues(request);
  if (!values.ok) return values;
  const parsed = PublicReadRequestSchema.safeParse({ query: values.value });
  if (!parsed.success) {
    return invalid(
      requestId,
      'The public read request is invalid.',
      issueDetails(parsed.error.issues),
    );
  }
  return { ok: true, requestId, value: parsed.data };
};

const readAuthenticatedQuery = (
  request: Request,
): RequestBoundaryResult<AuthenticatedReadRequest> => {
  const values = parseQueryValues(request);
  if (!values.ok) return values;
  const requestValues = values.value;
  const queryValues: Record<string, string> = {};
  const partyValue = requestValues.requestedPartyId;
  const recordValue = requestValues.recordId;
  for (const key of ['q', 'sort', 'filter', 'cursor', 'selected', 'tab']) {
    const value = requestValues[key];
    if (value !== undefined) queryValues[key] = value;
  }
  const query = InfrastructureQuerySchema.safeParse(queryValues);
  if (!query.success) {
    return invalid(
      values.requestId,
      'The authenticated read request is invalid.',
      issueDetails(query.error.issues),
    );
  }
  const parsed = AuthenticatedReadRequestSchema.safeParse({
    ...(partyValue === undefined ? {} : { requestedPartyId: partyValue }),
    ...(recordValue === undefined ? {} : { recordId: recordValue }),
    query: query.data,
  });
  if (!parsed.success) {
    return invalid(
      values.requestId,
      'The authenticated read request is invalid.',
      issueDetails(parsed.error.issues),
    );
  }
  return { ok: true, requestId: values.requestId, value: parsed.data };
};

export const parseAuthenticatedReadRequest = (
  request: Request,
): RequestBoundaryResult<AuthenticatedReadRequest> => {
  const requestId = requestIdFor(request);
  if (request.method.toUpperCase() !== 'GET') {
    return invalid(requestId, 'The authenticated read requires GET.');
  }
  return readAuthenticatedQuery(request);
};
