export const PROVIDER_EFFECT_DEADLINE_MS = 15_000;

export type ProviderAbortReason = 'timeout' | 'cancelled';

export type ProviderDeadline = Readonly<{
  signal: AbortSignal;
  reason(): ProviderAbortReason | null;
  dispose(): void;
}>;

export type AbortableCallResult =
  | Readonly<{ kind: 'resolved'; value: unknown }>
  | Readonly<{ kind: 'rejected'; error: unknown }>
  | Readonly<{ kind: 'aborted'; reason: ProviderAbortReason }>;

export const createProviderDeadline = (
  parent: AbortSignal | undefined,
  timeoutMs: number,
): ProviderDeadline => {
  const controller = new AbortController();
  let abortReason: ProviderAbortReason | null = null;
  const onParentAbort = (): void => {
    abortReason = 'cancelled';
    controller.abort();
  };
  if (parent !== undefined) {
    if (parent.aborted) onParentAbort();
    else parent.addEventListener('abort', onParentAbort, { once: true });
  }
  const timer = setTimeout(() => {
    if (!controller.signal.aborted) {
      abortReason = 'timeout';
      controller.abort();
    }
  }, timeoutMs);
  return {
    signal: controller.signal,
    reason: () => abortReason,
    dispose: () => {
      clearTimeout(timer);
      parent?.removeEventListener('abort', onParentAbort);
    },
  };
};

export const runAbortable = async (
  operation: () => Promise<unknown>,
  deadline: ProviderDeadline,
): Promise<AbortableCallResult> => {
  const reason = deadline.reason();
  if (deadline.signal.aborted) {
    return { kind: 'aborted', reason: reason ?? 'cancelled' };
  }

  let resolveAbort!: (result: AbortableCallResult) => void;
  const onAbort = (): void =>
    resolveAbort({
      kind: 'aborted',
      reason: deadline.reason() ?? 'cancelled',
    });
  const abortPromise = new Promise<AbortableCallResult>((resolve) => {
    resolveAbort = resolve;
    deadline.signal.addEventListener('abort', onAbort, { once: true });
  });
  const operationPromise = Promise.resolve()
    .then(operation)
    .then(
      (value): AbortableCallResult => ({ kind: 'resolved', value }),
      (error: unknown): AbortableCallResult => ({ kind: 'rejected', error }),
    );
  const result = await Promise.race([operationPromise, abortPromise]);
  deadline.signal.removeEventListener('abort', onAbort);
  return result;
};
