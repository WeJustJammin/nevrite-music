import type {
  ProviderExecutionDecision,
  ProviderExecutionInput,
  ProviderOperation,
} from './types.ts';
import {
  attemptWrite,
  classifyAdapterOutcome,
  errorCodeForFailure,
  isExecutionShape,
  isProviderOperation,
  MAX_ATTEMPTS,
  now,
  readFakeRegistryEntry,
  RETRY_DELAYS,
  saveAttempt,
} from './execution-support.ts';
import {
  createProviderDeadline,
  PROVIDER_EFFECT_DEADLINE_MS,
  runAbortable,
} from './execution-deadline.ts';
import { isAllowlistedProviderPayload } from './payload-validation.ts';

const dependencyError = (): Extract<
  ProviderExecutionDecision,
  { kind: 'error' }
> => ({
  kind: 'error',
  code: 'DEPENDENCY_UNAVAILABLE',
  noBlindResend: true,
});

const internalError = (): Extract<
  ProviderExecutionDecision,
  { kind: 'error' }
> => ({
  kind: 'error',
  code: 'INTERNAL_ERROR',
  noBlindResend: true,
});

const pendingDecision = (
  operationId: string,
  reason:
    | 'await_reconciliation'
    | 'ambiguous_provider_outcome'
    | 'retryable_provider_failure',
): Extract<ProviderExecutionDecision, { kind: 'pending' }> => ({
  kind: 'pending',
  operationId,
  reason,
  noBlindResend: true,
  acknowledgement: 'accepted',
});

export const executeProviderEffect = async (
  input: ProviderExecutionInput,
): Promise<ProviderExecutionDecision> => {
  if (!isExecutionShape(input)) return internalError();
  if (!input.restoreFenceOpen) {
    return { kind: 'retry', reason: 'restore_fenced', acknowledge: false };
  }

  let canonical: ProviderOperation | null;
  try {
    canonical = await input.persistence.readCanonical(input.operationId);
  } catch {
    return dependencyError();
  }
  if (canonical === null) {
    return {
      kind: 'retry',
      reason: 'canonical_unavailable',
      acknowledge: false,
    };
  }
  if (!isProviderOperation(canonical)) return internalError();
  if (canonical.id !== input.operationId) return internalError();
  const registryEntry = readFakeRegistryEntry(
    input.registry,
    canonical.provider,
    canonical.operationType,
  );
  if (registryEntry === null) {
    return dependencyError();
  }
  if (
    !isAllowlistedProviderPayload(
      canonical.payload,
      registryEntry.allowedPayloadKeys,
    )
  ) {
    return internalError();
  }
  if (canonical.state === 'pending') {
    return {
      kind: 'skip',
      operationId: input.operationId,
      reason: 'already_pending',
      noProviderCall: true,
    };
  }
  if (
    canonical.state === 'confirmed' ||
    canonical.state === 'failed' ||
    canonical.state === 'manual_review'
  ) {
    return {
      kind: 'skip',
      operationId: input.operationId,
      reason: 'terminal',
      noProviderCall: true,
    };
  }
  if (input.adapter.provider !== canonical.provider) return dependencyError();
  if (input.signal?.aborted) return dependencyError();

  let claim;
  try {
    claim = await input.persistence.markPending({
      operationId: canonical.id,
      expectedVersion: canonical.version,
    });
  } catch {
    return dependencyError();
  }
  if (claim.kind === 'conflict') {
    return { kind: 'retry', reason: 'lease_conflict', acknowledge: false };
  }
  if (claim.kind === 'already_pending') {
    return {
      kind: 'skip',
      operationId: input.operationId,
      reason: 'already_pending',
      noProviderCall: true,
    };
  }
  if (claim.kind === 'terminal') {
    return {
      kind: 'skip',
      operationId: input.operationId,
      reason: 'terminal',
      noProviderCall: true,
    };
  }
  if (claim.kind !== 'claimed' || !isProviderOperation(claim.operation)) {
    return internalError();
  }
  const claimed = claim.operation;
  if (
    claimed.id !== canonical.id ||
    claimed.provider !== canonical.provider ||
    claimed.operationType !== canonical.operationType ||
    claimed.intentHash !== canonical.intentHash ||
    claimed.payloadDigest !== canonical.payloadDigest ||
    JSON.stringify(claimed.payload) !== JSON.stringify(canonical.payload) ||
    !isAllowlistedProviderPayload(
      claimed.payload,
      registryEntry.allowedPayloadKeys,
    ) ||
    claimed.state !== 'pending'
  ) {
    return internalError();
  }

  const request = {
    operationId: claimed.id,
    provider: claimed.provider,
    idempotencyKey: claimed.id,
    operationType: claimed.operationType,
    payloadDigest: claimed.payloadDigest,
    payload: claimed.payload,
  } as const;
  const attempt = claimed.attempts.length + 1;
  let retryIndex = 0;
  const deadline = createProviderDeadline(
    input.signal,
    input.deadlineMs ?? PROVIDER_EFFECT_DEADLINE_MS,
  );

  try {
    while (true) {
      const startedAt = now(input);
      if (startedAt === null) return dependencyError();
      const adapterResult = await runAbortable(
        () => input.adapter.send(request, deadline.signal),
        deadline,
      );
      const rawResult =
        adapterResult.kind === 'resolved'
          ? adapterResult.value
          : adapterResult.kind === 'rejected'
            ? adapterResult.error
            : {
                kind: 'timeout' as const,
                errorCode:
                  adapterResult.reason === 'timeout'
                    ? 'PROVIDER_TIMEOUT'
                    : 'PROVIDER_CANCELLED',
              };
      const endedAt = now(input);
      if (endedAt === null) return dependencyError();
      const outcome = classifyAdapterOutcome(rawResult);
      if (outcome.kind === 'response') {
        const { result } = outcome;
        const rejected = result.status === 'rejected';
        const write = attemptWrite(
          claimed,
          attempt + retryIndex,
          startedAt,
          endedAt,
          rejected ? 'rejected' : result.status,
          rejected ? 'PROVIDER_REJECTED' : null,
          false,
          result.externalEventId,
          result.externalEventId,
        );
        if (!(await saveAttempt(input, write))) return dependencyError();
        return rejected
          ? {
              kind: 'failed',
              operationId: input.operationId,
              errorCode: 'PROVIDER_REJECTED',
              noBlindResend: true,
            }
          : pendingDecision(input.operationId, 'await_reconciliation');
      }

      if (outcome.failure === 'safe_retryable') {
        if (retryIndex >= MAX_ATTEMPTS - 1) {
          const write = attemptWrite(
            claimed,
            attempt + retryIndex,
            startedAt,
            endedAt,
            'retryable_error',
            errorCodeForFailure(outcome),
            true,
            null,
            null,
          );
          if (!(await saveAttempt(input, write))) return dependencyError();
          return pendingDecision(
            input.operationId,
            'retryable_provider_failure',
          );
        }
        const delay = retryIndex === 0 ? RETRY_DELAYS[0] : RETRY_DELAYS[1];
        const sleepResult = await runAbortable(
          () => Promise.resolve(input.sleep?.(delay)),
          deadline,
        );
        if (sleepResult.kind !== 'resolved') {
          const write = attemptWrite(
            claimed,
            attempt + retryIndex,
            startedAt,
            endedAt,
            sleepResult.kind === 'aborted' ? 'timeout' : 'retryable_error',
            sleepResult.kind === 'aborted'
              ? sleepResult.reason === 'timeout'
                ? 'PROVIDER_TIMEOUT'
                : 'PROVIDER_CANCELLED'
              : errorCodeForFailure(outcome),
            sleepResult.kind !== 'aborted',
            null,
            null,
          );
          if (!(await saveAttempt(input, write))) return dependencyError();
          return sleepResult.kind === 'aborted'
            ? pendingDecision(input.operationId, 'ambiguous_provider_outcome')
            : dependencyError();
        }
        retryIndex += 1;
        continue;
      }
      const write = attemptWrite(
        claimed,
        attempt + retryIndex,
        startedAt,
        endedAt,
        outcome.failure === 'timeout' ? 'timeout' : 'unknown_error',
        errorCodeForFailure(outcome),
        false,
        null,
        null,
      );
      if (!(await saveAttempt(input, write))) return dependencyError();
      return pendingDecision(input.operationId, 'ambiguous_provider_outcome');
    }
  } finally {
    deadline.dispose();
  }
};
