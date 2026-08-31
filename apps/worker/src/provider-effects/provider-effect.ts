import {
  PROVIDER_EFFECT_TIMEOUT_MS,
  type ProviderEffectRepository,
  type ProviderEffectResponse,
  type ProviderEffectOutcome,
  type ProviderEffectRegistry,
  type ProviderIntentRepository,
  type ProviderIntentResult,
  type ProviderOperationIntent,
} from './provider-types';
import {
  createProductionProviderEffectRegistry,
  defineProviderEffectRegistry,
  withDeadline,
} from './provider-support';
import {
  safelyValidIntent,
  safelyValidOperation,
  validateProviderResponse,
} from './provider-validation';

export { PROVIDER_EFFECT_TIMEOUT_MS } from './provider-types';
export { createProductionProviderEffectRegistry, defineProviderEffectRegistry };
export type {
  ProviderEffectAdapter,
  ProviderEffectPayload,
  ProviderEffectRequest,
  ProviderEffectResponse,
  ProviderEffectRepository,
  ProviderEffectOutcome,
  ProviderEffectRegistry,
  ProviderIntentRepository,
  ProviderIntentResult,
  ProviderOperationForSend,
  ProviderOperationIntent,
  ProviderOperationState,
} from './provider-types';

/** Commits local intent before the queue consumer is allowed to send. */
export const createProviderOperationIntent = async (
  input: ProviderOperationIntent,
  repository: ProviderIntentRepository,
  signal: AbortSignal = new AbortController().signal,
): Promise<ProviderIntentResult> => {
  if (!safelyValidIntent(input))
    throw new Error('Provider operation intent is invalid.');
  return repository.createPlanned(input, signal);
};

export const createProviderEffectConsumer = <
  const Provider extends string,
  const Registry extends ProviderEffectRegistry &
    Readonly<
      Record<Provider, import('./provider-types').ProviderEffectAdapter>
    >,
>(
  provider: Provider,
  options: Readonly<{
    deadlineMs?: number;
    environment?: 'local' | 'production' | 'staging';
    registry: Registry;
    repository: ProviderEffectRepository;
  }>,
) => {
  const adapter = options.registry[provider];
  const disabledInProduction = options.environment === 'production';
  if (adapter === undefined && !disabledInProduction)
    throw new Error('Provider effect adapter is not registered.');
  const deadlineMs = options.deadlineMs ?? PROVIDER_EFFECT_TIMEOUT_MS;
  if (
    !Number.isSafeInteger(deadlineMs) ||
    deadlineMs < 1 ||
    deadlineMs > PROVIDER_EFFECT_TIMEOUT_MS
  )
    throw new Error('Provider effect deadline is invalid.');

  return async (
    operationId: string,
    signal?: AbortSignal,
  ): Promise<ProviderEffectOutcome> => {
    if (disabledInProduction) return { kind: 'dependency_unavailable' };
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        operationId,
      )
    )
      return { kind: 'not_found' };
    if (signal?.aborted) return { kind: 'dependency_unavailable' };

    let claimed: Awaited<ReturnType<ProviderEffectRepository['claimPlanned']>>;
    try {
      claimed = await withDeadline(
        (innerSignal) =>
          options.repository.claimPlanned(
            { operationId, provider },
            innerSignal,
          ),
        deadlineMs,
        signal,
      );
    } catch {
      return { kind: 'dependency_unavailable' };
    }
    if (
      typeof claimed !== 'object' ||
      claimed === null ||
      !('kind' in claimed) ||
      (claimed.kind !== 'claimed' &&
        claimed.kind !== 'missing' &&
        claimed.kind !== 'pending' &&
        claimed.kind !== 'terminal')
    )
      return { kind: 'dependency_unavailable' };
    if (claimed.kind === 'missing') return { kind: 'not_found' };
    if (claimed.kind === 'pending')
      return { kind: 'pending', reason: 'awaiting_reconciliation' };
    if (
      claimed.kind === 'terminal' &&
      (claimed.state === 'confirmed' ||
        claimed.state === 'failed' ||
        claimed.state === 'manual_review')
    )
      return { kind: 'noop', state: claimed.state };
    if (claimed.kind === 'terminal') return { kind: 'dependency_unavailable' };
    if (typeof claimed.operation !== 'object' || claimed.operation === null)
      return { kind: 'dependency_unavailable' };
    if (!safelyValidOperation(claimed.operation, provider))
      return { kind: 'dependency_unavailable' };

    let response: ProviderEffectResponse | null;
    try {
      response = validateProviderResponse(
        await withDeadline(
          (innerSignal) =>
            adapter.send(
              {
                idempotencyKey: claimed.operation.providerIdempotencyKey,
                operationId: claimed.operation.operationId,
                payload: claimed.operation.payload,
                payloadDigest: claimed.operation.payloadDigest,
                provider,
              },
              innerSignal,
            ),
          deadlineMs,
          signal,
        ),
      );
    } catch {
      return { kind: 'pending', reason: 'ambiguous_timeout' };
    }
    if (response === null)
      return { kind: 'pending', reason: 'ambiguous_timeout' };
    if (response.status === 'pending')
      return { kind: 'pending', reason: 'awaiting_reconciliation' };
    if (response.status !== 'rejected')
      return { kind: 'sent', state: 'pending' };
    try {
      await withDeadline(
        (innerSignal) =>
          options.repository.recordOutcome(
            {
              externalEventId: response.externalEventId,
              operationId: claimed.operation.operationId,
              providerOperationId: response.providerOperationId,
              state: 'failed',
              version: claimed.operation.version,
            },
            innerSignal,
          ),
        deadlineMs,
        signal,
      );
    } catch {
      return { kind: 'dependency_unavailable' };
    }
    return { kind: 'rejected', state: 'failed' };
  };
};
