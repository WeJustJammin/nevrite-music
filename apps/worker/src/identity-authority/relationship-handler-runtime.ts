import type { RelationshipOperationId } from '@wejammin/contracts';

import type { WorkerContext, WorkerDependencies } from '../index';
import { responseForAuthError } from '../authentication/boundary';
import type {
  AuthenticationError,
  AuthenticationResult,
} from '../authentication/types';
import type { IdentityCommitResult } from './types';
import {
  executeRecovery,
  hasRecoveryPorts,
  type RecoveryState,
} from './recovery';
import {
  identityResponse,
  invalidPersistence,
  missingIdentityDependency,
} from './route-support';
import {
  relationshipError,
  relationshipPolicy,
} from './relationship-handler-support';

export type RelationshipSessionInput = Readonly<{
  session: import('../authentication/types').AuthenticationSession | null;
  idempotencyKey: string | null;
  ifMatch: string | null;
  mutation: boolean;
  aggregateId?: string | null;
}>;

export type RelationshipSchema<T> = Readonly<{
  safeParse: (
    value: unknown,
  ) => { success: true; data: T } | { success: false };
}>;

export type RelationshipResponseOptions<T> = Readonly<{
  location?: (value: T) => string;
}>;

const relationshipResponse = <T>(
  context: WorkerContext,
  result: AuthenticationResult<T>,
  schema: RelationshipSchema<T>,
  status: 200 | 201,
  options?: RelationshipResponseOptions<T>,
): Response => {
  if (result.ok && options?.location !== undefined) {
    const parsed = schema.safeParse(result.value);
    if (!parsed.success) return invalidPersistence(context);
    context.header('location', options.location(parsed.data));
  }
  return identityResponse(context, result, schema, status);
};

const recoveryRelationshipResponse = <T>(
  context: WorkerContext,
  result: Extract<IdentityCommitResult, Readonly<{ kind: 'committed' }>>,
  schema: RelationshipSchema<T>,
  status: 200 | 201,
  options?: RelationshipResponseOptions<T>,
): Response => {
  const parsed = schema.safeParse(result.body);
  if (!parsed.success) return invalidPersistence(context);
  return relationshipResponse(
    context,
    { ok: true, value: parsed.data },
    schema,
    status,
    options,
  );
};

const publicRelationshipResponse = <T extends Readonly<{ version: string }>>(
  context: WorkerContext,
  result: AuthenticationResult<unknown>,
  schema: RelationshipSchema<T>,
): Response => {
  if (!result.ok) return responseForAuthError(context, result);
  const parsed = schema.safeParse(result.value);
  if (!parsed.success) return invalidPersistence(context);
  context.header('etag', `"${parsed.data.version}"`);
  context.header('cache-control', 'public, max-age=60');
  return context.json(parsed.data, 200);
};

export const callRelationshipPort = async <T>(
  operationId: RelationshipOperationId,
  fn: (signal: AbortSignal) => Promise<AuthenticationResult<T>>,
): Promise<AuthenticationResult<T>> => {
  const controller = new AbortController();
  const timeoutMs = relationshipPolicy(operationId).timeoutMs;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const result = await fn(controller.signal);
    return timedOut
      ? relationshipError(
          504,
          'DEPENDENCY_TIMEOUT',
          'Identity persistence timed out.',
        )
      : result;
  } catch (error) {
    if (
      timedOut ||
      (error instanceof DOMException && error.name === 'AbortError')
    )
      return relationshipError(
        504,
        'DEPENDENCY_TIMEOUT',
        'Identity persistence timed out.',
      );
    if (
      typeof error === 'object' &&
      error !== null &&
      'ok' in error &&
      error.ok === false
    )
      return error as AuthenticationError;
    return relationshipError(
      503,
      'DEPENDENCY_UNAVAILABLE',
      'Identity persistence is temporarily unavailable.',
    );
  } finally {
    clearTimeout(timer);
  }
};

export const executeRelationship = async <T>(
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
  operationId: RelationshipOperationId,
  input: RelationshipSessionInput,
  port: ((signal: AbortSignal) => Promise<AuthenticationResult<T>>) | undefined,
  schema: RelationshipSchema<T>,
  status: 200 | 201,
  options?: RelationshipResponseOptions<T>,
): Promise<Response> => {
  const authority = dependencies.identityAuthority;
  if (authority !== undefined && hasRecoveryPorts(authority))
    return executeRecovery(context, authority, state, {
      operationId,
      ...input,
      render: (recoveryContext, result) =>
        recoveryRelationshipResponse(
          recoveryContext,
          result,
          schema,
          status,
          options,
        ),
    });
  if (port === undefined) return missingIdentityDependency(context);
  return relationshipResponse(
    context,
    await callRelationshipPort(operationId, port),
    schema,
    status,
    options,
  );
};

export const executePublicRelationship = async <
  T extends Readonly<{ version: string }>,
>(
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
  operationId: RelationshipOperationId,
  port: ((signal: AbortSignal) => Promise<AuthenticationResult<T>>) | undefined,
  schema: RelationshipSchema<T>,
  aggregateId: string | null,
): Promise<Response> => {
  const authority = dependencies.identityAuthority;
  if (authority !== undefined && hasRecoveryPorts(authority))
    return executeRecovery(context, authority, state, {
      operationId,
      session: null,
      idempotencyKey: null,
      ifMatch: null,
      mutation: false,
      aggregateId,
      render: (recoveryContext, result) =>
        publicRelationshipResponse(
          recoveryContext,
          { ok: true, value: result.body },
          schema,
        ),
    });
  if (port === undefined) return missingIdentityDependency(context);
  return publicRelationshipResponse(
    context,
    await callRelationshipPort(operationId, port),
    schema,
  );
};
