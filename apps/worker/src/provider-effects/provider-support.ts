import {
  type ProviderEffectAdapter,
  type ProviderEffectRegistry,
} from './provider-types';

const REGISTRY_KEY = /^[a-z][a-z0-9_.:-]{0,127}$/;

export const defineProviderEffectRegistry = <
  const Registry extends ProviderEffectRegistry,
>(
  registry: Registry,
): Registry => {
  if (
    Object.keys(registry).some(
      (provider) =>
        !REGISTRY_KEY.test(provider) ||
        registry[provider] === undefined ||
        typeof registry[provider]?.send !== 'function',
    )
  )
    throw new Error('Provider effect registry is invalid.');
  return Object.freeze({ ...registry });
};

export const createProductionProviderEffectRegistry = <
  const Registry extends ProviderEffectRegistry,
>(
  registry = {} as Registry,
): Registry => {
  if (Object.keys(registry).length !== 0) {
    throw new Error('Provider effect registry must be empty in production.');
  }
  return Object.freeze({ ...registry });
};

export const withDeadline = async <T>(
  operation: (signal: AbortSignal) => Promise<T>,
  deadlineMs: number,
  signal?: AbortSignal,
): Promise<T> => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectAbort: ((reason?: unknown) => void) | undefined;
  const aborted = signal
    ? new Promise<never>((_, reject) => {
        rejectAbort = reject;
      })
    : undefined;
  const onAbort = () => rejectAbort?.(new Error('provider-effect-aborted'));
  signal?.addEventListener('abort', onAbort, { once: true });
  if (signal?.aborted) {
    signal.removeEventListener('abort', abort);
    signal.removeEventListener('abort', onAbort);
    throw new Error('provider-effect-aborted');
  }
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error('provider-effect-timeout'));
    }, deadlineMs);
  });
  try {
    return await Promise.race(
      aborted === undefined
        ? [operation(controller.signal), timeout]
        : [operation(controller.signal), timeout, aborted],
    );
  } finally {
    clearTimeout(timer!);
    signal?.removeEventListener('abort', abort);
    signal?.removeEventListener('abort', onAbort);
  }
};

export type { ProviderEffectAdapter };
