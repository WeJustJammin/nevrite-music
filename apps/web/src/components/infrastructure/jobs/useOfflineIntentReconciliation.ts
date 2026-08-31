import { useCallback, useEffect, useRef, useState } from 'react';
import {
  OfflineIntentSchema,
  type OfflineIntent,
  type OfflineIntentState,
} from '@wejammin/contracts';

export type OfflineIntentReplayDecision =
  | Readonly<{
      state: 'accepted';
      intent?: OfflineIntent;
    }>
  | Readonly<{
      state: 'refused';
      refusal: {
        code: string;
        retryable: boolean;
        requestId: string | null;
      };
      intent?: OfflineIntent;
    }>
  | Readonly<{
      state: 'pending_manual_review';
      intent?: OfflineIntent;
    }>;

export interface OfflineIntentReplayAdapter {
  /** The server revalidates identity, authority, content, and version. */
  readonly revalidate: (
    intent: OfflineIntent,
    signal: AbortSignal,
  ) => Promise<OfflineIntentReplayDecision>;
}

export interface ReconcileOfflineIntentOptions {
  readonly now?: () => string;
  readonly signal?: AbortSignal;
  readonly persist?: (intent: OfflineIntent) => void | Promise<void>;
}

const defaultNow = (): string => new Date().toISOString();

const isRetryableRefusal = (intent: OfflineIntent): boolean =>
  intent.state === 'refused' && intent.refusal?.retryable === true;

export const isReplayableOfflineIntent = (intent: OfflineIntent): boolean =>
  intent.state === 'queued' || isRetryableRefusal(intent);

const transitionIntent = (
  intent: OfflineIntent,
  state: OfflineIntentState,
  now: () => string,
  refusal: OfflineIntent['refusal'] = null,
): OfflineIntent =>
  OfflineIntentSchema.parse({
    ...intent,
    state,
    refusal,
    updatedAt: now(),
  });

const decisionIntent = (
  original: OfflineIntent,
  decision: OfflineIntentReplayDecision,
  now: () => string,
): OfflineIntent => {
  const candidate = decision.intent ?? original;
  return transitionIntent(
    candidate,
    decision.state,
    now,
    decision.state === 'refused' ? decision.refusal : null,
  );
};

export async function reconcileOfflineIntents(
  intents: readonly OfflineIntent[],
  adapter: OfflineIntentReplayAdapter,
  options: ReconcileOfflineIntentOptions = {},
): Promise<readonly OfflineIntent[]> {
  const now = options.now ?? defaultNow;
  const signal = options.signal ?? new AbortController().signal;
  const result: OfflineIntent[] = [];

  for (const candidate of intents) {
    const intent = OfflineIntentSchema.parse(candidate);
    if (!isReplayableOfflineIntent(intent)) {
      result.push(intent);
      continue;
    }
    if (signal.aborted) {
      result.push(intent);
      continue;
    }

    const replaying = transitionIntent(intent, 'replaying', now);
    await options.persist?.(replaying);
    try {
      const decision = await adapter.revalidate(replaying, signal);
      const resolved = decisionIntent(replaying, decision, now);
      result.push(resolved);
      await options.persist?.(resolved);
    } catch {
      const pending = transitionIntent(replaying, 'pending_manual_review', now);
      result.push(pending);
      await options.persist?.(pending);
    }
  }

  return result;
}

export interface UseOfflineIntentReconciliationOptions {
  readonly intents: readonly OfflineIntent[];
  readonly connectivity: 'online' | 'offline';
  readonly adapter?: OfflineIntentReplayAdapter;
  readonly persist?: (
    intents: readonly OfflineIntent[],
  ) => void | Promise<void>;
  readonly now?: () => string;
}

export interface UseOfflineIntentReconciliationResult {
  readonly intents: readonly OfflineIntent[];
  readonly connectivity: 'online' | 'offline';
  readonly reconciling: boolean;
  readonly reconcile: () => Promise<readonly OfflineIntent[]>;
  readonly retryIntent: (intentId: string) => Promise<readonly OfflineIntent[]>;
}

export function useOfflineIntentReconciliation({
  intents: initialIntents,
  connectivity: initialConnectivity,
  adapter,
  persist,
  now,
}: UseOfflineIntentReconciliationOptions): UseOfflineIntentReconciliationResult {
  const [intents, setIntents] =
    useState<readonly OfflineIntent[]>(initialIntents);
  const [connectivity, setConnectivity] = useState<'online' | 'offline'>(
    initialConnectivity,
  );
  const [reconciling, setReconciling] = useState(false);
  const intentsRef = useRef(intents);
  intentsRef.current = intents;
  const connectivityRef = useRef(connectivity);
  connectivityRef.current = connectivity;
  const controllerRef = useRef<AbortController | null>(null);
  const nowFn = now ?? defaultNow;

  const reconcile = useCallback(async (): Promise<readonly OfflineIntent[]> => {
    if (
      adapter === undefined ||
      connectivityRef.current !== 'online' ||
      controllerRef.current !== null
    ) {
      return intentsRef.current;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setReconciling(true);
    try {
      const next = await reconcileOfflineIntents(intentsRef.current, adapter, {
        now: nowFn,
        signal: controller.signal,
        persist: async (intent) => {
          const current = intentsRef.current.map((candidate) =>
            candidate.intentId === intent.intentId ? intent : candidate,
          );
          intentsRef.current = current;
          setIntents(current);
          await persist?.(current);
        },
      });
      intentsRef.current = next;
      setIntents(next);
      await persist?.(next);
      return next;
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setReconciling(false);
      }
    }
  }, [adapter, nowFn, persist]);

  const retryIntent = useCallback(
    async (intentId: string): Promise<readonly OfflineIntent[]> => {
      const candidate = intentsRef.current.find(
        (intent) => intent.intentId === intentId,
      );
      if (
        candidate === undefined ||
        !isRetryableRefusal(candidate) ||
        adapter === undefined
      ) {
        return intentsRef.current;
      }
      if (connectivityRef.current !== 'online') return intentsRef.current;
      const next = await reconcileOfflineIntents([candidate], adapter, {
        now: nowFn,
      });
      const merged = intentsRef.current.map((intent) =>
        intent.intentId === intentId ? (next[0] ?? intent) : intent,
      );
      intentsRef.current = merged;
      setIntents(merged);
      await persist?.(merged);
      return merged;
    },
    [adapter, nowFn, persist],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onOnline = (): void => {
      connectivityRef.current = 'online';
      setConnectivity('online');
      void reconcile();
    };
    const onOffline = (): void => {
      connectivityRef.current = 'offline';
      setConnectivity('offline');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    if (connectivityRef.current === 'online') void reconcile();
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      controllerRef.current?.abort();
    };
  }, [reconcile]);

  return { intents, connectivity, reconciling, reconcile, retryIntent };
}

export default useOfflineIntentReconciliation;
