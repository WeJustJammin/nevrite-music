import type { WorkerContext } from '../index';
import { authError, responseForAuthError } from '../authentication/boundary';
import type {
  AuthenticationError,
  AuthenticationSession,
} from '../authentication/types';
import type {
  IdentityAuthorityDependencies,
  IdentityCommitResult,
  IdentityRecoveryInput,
} from './types';

type IdentityCommittedResult = Extract<
  IdentityCommitResult,
  Readonly<{ kind: 'committed' }>
>;

type RecoveryState = {
  pending: Set<string>;
};

export const hasRecoveryPorts = (
  dependencies: IdentityAuthorityDependencies,
): dependencies is IdentityAuthorityDependencies & {
  commit: NonNullable<IdentityAuthorityDependencies['commit']>;
  read: NonNullable<IdentityAuthorityDependencies['read']>;
  reconcile: NonNullable<IdentityAuthorityDependencies['reconcile']>;
  telemetry: NonNullable<IdentityAuthorityDependencies['telemetry']>;
} =>
  dependencies.commit !== undefined &&
  dependencies.read !== undefined &&
  dependencies.reconcile !== undefined &&
  dependencies.telemetry !== undefined;

const dependencyError = (): AuthenticationError =>
  authError(
    503,
    'DEPENDENCY_UNAVAILABLE',
    'Identity persistence is temporarily unavailable.',
  );

const inputFor = (
  context: WorkerContext,
  operationId: string,
  session: AuthenticationSession | null,
  idempotencyKey: string | null,
  ifMatch: string | null,
  mutation: boolean,
  aggregateId: string | null,
): IdentityRecoveryInput => ({
  operationId,
  requestId: context.get('requestId'),
  ...(idempotencyKey === null ? {} : { idempotencyKey }),
  ...(ifMatch === null ? {} : { ifMatch }),
  ...(session === null ? {} : { actorId: session.authUserId }),
  ...(aggregateId === null ? {} : { aggregateId }),
  ...(mutation
    ? {
        atomicWrites: [
          'canonical_state',
          'audit',
          'outbox',
          'idempotency',
        ] as const,
      }
    : {}),
});

const telemetry = async (
  dependencies: Parameters<typeof hasRecoveryPorts>[0] & {
    telemetry: NonNullable<IdentityAuthorityDependencies['telemetry']>;
  },
  event: Parameters<NonNullable<IdentityAuthorityDependencies['telemetry']>>[0],
): Promise<void> => {
  try {
    await dependencies.telemetry(event);
  } catch {
    // Telemetry failure never changes a committed domain result.
  }
};

const response = (
  context: WorkerContext,
  result: IdentityCommitResult,
): Response => {
  if (result.kind === 'conflict') {
    context.set('errorCode', result.code);
    return responseForAuthError(
      context,
      authError(
        409,
        result.code,
        'The resource changed; reload and try again.',
        result.details,
      ),
    );
  }
  return context.json(result.body, result.status);
};

export const executeRecovery = async (
  context: WorkerContext,
  dependencies: Parameters<typeof hasRecoveryPorts>[0] & {
    commit: NonNullable<IdentityAuthorityDependencies['commit']>;
    read: NonNullable<IdentityAuthorityDependencies['read']>;
    reconcile: NonNullable<IdentityAuthorityDependencies['reconcile']>;
    telemetry: NonNullable<IdentityAuthorityDependencies['telemetry']>;
  },
  state: RecoveryState,
  input: Readonly<{
    operationId: string;
    session: AuthenticationSession | null;
    idempotencyKey: string | null;
    ifMatch: string | null;
    mutation: boolean;
    aggregateId?: string | null;
    render?: (
      context: WorkerContext,
      result: IdentityCommittedResult,
    ) => Response;
  }>,
): Promise<Response> => {
  const requestInput = inputFor(
    context,
    input.operationId,
    input.session,
    input.idempotencyKey,
    input.ifMatch,
    input.mutation,
    input.aggregateId ?? null,
  );
  const key = `${input.operationId}:${input.session?.authUserId ?? 'public'}:${input.idempotencyKey ?? 'read'}`;
  try {
    if (input.mutation && state.pending.has(key)) {
      state.pending.delete(key);
      const result = await dependencies.reconcile(requestInput);
      if (result === null)
        return responseForAuthError(context, dependencyError());
      await telemetry(dependencies, {
        operationId: input.operationId,
        requestId: requestInput.requestId,
        outcome: 'reconciled',
        status: result.status,
        ...(result.kind === 'conflict' ? { errorCode: result.code } : {}),
      });
      return result.kind === 'conflict' || input.render === undefined
        ? response(context, result)
        : input.render(context, result);
    }
    const result = input.mutation
      ? await dependencies.commit(requestInput)
      : await dependencies.read(requestInput);
    await telemetry(dependencies, {
      operationId: input.operationId,
      requestId: requestInput.requestId,
      outcome: result.kind === 'conflict' ? 'failure' : 'success',
      status: result.status,
      ...(result.kind === 'conflict' ? { errorCode: result.code } : {}),
    });
    return result.kind === 'conflict' || input.render === undefined
      ? response(context, result)
      : input.render(context, result);
  } catch (error) {
    if (
      input.mutation &&
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {
      state.pending.add(key);
    }
    await telemetry(dependencies, {
      operationId: input.operationId,
      requestId: requestInput.requestId,
      outcome: 'failure',
      status: 503,
      errorCode: 'DEPENDENCY_UNAVAILABLE',
    });
    return responseForAuthError(context, dependencyError());
  }
};

export type { RecoveryState };
