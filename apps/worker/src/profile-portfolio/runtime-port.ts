import type { WorkerContext, WorkerDependencies } from '../index';
import { profilePortfolioResponseSchemas } from './responses';
import { eventFor } from './events';
import type { ProfilePortfolioPortInput } from './types';
import {
  fingerprint,
  replayKey,
  statusFor,
  type ActiveProfilePortfolioOperation,
  type Outcome,
  type ProfilePortfolioPortName,
} from './runtime-helpers';
import { profilePortfolioPolicy } from './route-support';

export const createProfilePortfolioPortRunner = (
  dependencies: WorkerDependencies,
) => {
  const profile = dependencies.profilePortfolio;
  const completed = new Map<
    string,
    Readonly<{ fingerprint: string; outcome: Outcome }>
  >();
  const pending = new Map<
    string,
    Readonly<{ fingerprint: string; promise: Promise<Outcome> }>
  >();

  const run = async (
    context: WorkerContext,
    operationId: ActiveProfilePortfolioOperation,
    portName: ProfilePortfolioPortName,
    input: ProfilePortfolioPortInput,
  ): Promise<Outcome> => {
    const currentFingerprint = fingerprint(input);
    const key = replayKey(input);
    const cached = completed.get(key);
    if (cached !== undefined)
      return cached.fingerprint === currentFingerprint
        ? cached.outcome
        : {
            ok: false,
            status: 409,
            code: 'IDEMPOTENCY_CONFLICT',
            message: 'The idempotency key was reused.',
            details: {},
          };
    const existing = pending.get(key);
    if (existing !== undefined)
      return existing.fingerprint === currentFingerprint
        ? existing.promise
        : {
            ok: false,
            status: 409,
            code: 'IDEMPOTENCY_CONFLICT',
            message: 'The idempotency key was reused.',
            details: {},
          };
    const promise = (async (): Promise<Outcome> => {
      if (profile === undefined || profile[portName] === undefined)
        return {
          ok: false,
          status: 503,
          code: 'DEPENDENCY_UNAVAILABLE',
          message: 'Profile portfolio is temporarily unavailable.',
          details: { dependencyClass: 'profile_portfolio', retryable: true },
        };
      const controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, profilePortfolioPolicy(operationId).timeoutMs);
      try {
        const result = await profile[portName](
          input,
          context.env,
          controller.signal,
        );
        if (!result.ok) return result;
        const parsed = profilePortfolioResponseSchemas[operationId].safeParse(
          result.value,
        );
        if (!parsed.success)
          return {
            ok: false,
            status: 502,
            code: 'DEPENDENCY_BAD_GATEWAY',
            message: 'Profile portfolio returned an invalid response.',
            details: { dependencyClass: 'profile_portfolio', retryable: true },
          };
        const event = eventFor(context, input, parsed.data);
        if (event !== null && profile.emitEvent !== undefined)
          await profile.emitEvent(
            event,
            context.env,
            new AbortController().signal,
          );
        return { ok: true, value: parsed.data, status: statusFor(operationId) };
      } catch (error) {
        if (
          timedOut ||
          (error instanceof DOMException && error.name === 'AbortError')
        )
          return {
            ok: false,
            status: 504,
            code: 'DEPENDENCY_TIMEOUT',
            message: 'Profile portfolio timed out.',
            details: {},
          };
        return {
          ok: false,
          status: 503,
          code: 'DEPENDENCY_UNAVAILABLE',
          message: 'Profile portfolio is temporarily unavailable.',
          details: { dependencyClass: 'profile_portfolio', retryable: true },
        };
      } finally {
        clearTimeout(timer);
      }
    })();
    pending.set(key, { fingerprint: currentFingerprint, promise });
    const outcome = await promise;
    pending.delete(key);
    if (outcome.ok)
      completed.set(key, { fingerprint: currentFingerprint, outcome });
    return outcome;
  };
  return run;
};
