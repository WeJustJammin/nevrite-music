import {
  expectedVersionValue,
  hashRequest,
  traceFor,
  type AuthProductionConfiguration,
} from '../authentication/production-configuration';
import {
  callRelationship,
  type RelationshipReplay,
  type RelationshipSchema,
} from './relationship-production-http';
import type {
  RelationshipCommandInput,
  RelationshipReadInput,
} from './relationship-types';

export const requestHeaders = (
  request: Request,
  operationId: string,
  idempotencyKey?: string,
  ifMatch?: string | null,
): Readonly<Record<string, string>> => {
  const trace = traceFor(request);
  return {
    'X-Operation-Id': operationId,
    'X-Request-Id': trace.requestId,
    'X-Correlation-Id': trace.correlationId,
    ...(idempotencyKey === undefined
      ? {}
      : { 'X-Idempotency-Key': idempotencyKey }),
    ...(ifMatch === undefined || ifMatch === null
      ? {}
      : { 'If-Match': ifMatch }),
  };
};

const databaseContext = (
  input: RelationshipCommandInput | RelationshipReadInput,
): Readonly<Record<string, unknown>> => {
  const trace = traceFor(input.request);
  return {
    ...(input.session === null
      ? {}
      : {
          p_auth_user_id: input.session.authUserId,
          p_session_id: input.session.sessionId,
          p_actor_id: input.session.personId,
          p_acting_party_id: input.session.actingPartyId,
        }),
    p_request_id: trace.requestId,
    p_correlation_id: trace.correlationId,
  };
};

export const expectedVersion = (ifMatch: string | null): string =>
  expectedVersionValue(ifMatch ?? '"0"');

export const replayFor = (
  input: RelationshipCommandInput,
  rpc: string,
  idField: string,
  idParameter: string,
  operationId: string,
): RelationshipReplay => ({
  rpc,
  idField,
  idParameter,
  baseInput: databaseContext(input),
  headers: requestHeaders(input.request, operationId),
});

export const commandRpc = async <T>(
  config: AuthProductionConfiguration,
  input: RelationshipCommandInput,
  signal: AbortSignal,
  operationId: string,
  rpc: string,
  body: Readonly<Record<string, unknown>>,
  schema: RelationshipSchema<T>,
  replay: RelationshipReplay,
) =>
  callRelationship(
    config,
    rpc,
    {
      ...databaseContext(input),
      ...body,
      p_key_hash: await hashRequest(input.idempotencyKey),
      p_request_hash: await hashRequest({
        operationId,
        ...body,
        ifMatch: input.ifMatch,
      }),
    },
    signal,
    schema,
    requestHeaders(
      input.request,
      operationId,
      input.idempotencyKey,
      input.ifMatch,
    ),
    replay,
  );

export const readRpc = <T>(
  config: AuthProductionConfiguration,
  input: RelationshipReadInput,
  signal: AbortSignal,
  operationId: string,
  rpc: string,
  body: Readonly<Record<string, unknown>>,
  schema: RelationshipSchema<T>,
) =>
  callRelationship(
    config,
    rpc,
    { ...databaseContext(input), ...body },
    signal,
    schema,
    requestHeaders(input.request, operationId),
  );
