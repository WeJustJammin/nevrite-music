import type { WorkerContext, WorkerDependencies } from '../index';
import { authError } from '../authentication/boundary';
import type { AuthenticationResult } from '../authentication/types';
import {
  configurationDeadline,
  configurationFingerprint,
  configurationReplayKey,
  configurationStatus,
  type ConfigurationPortName,
} from './runtime-helpers';
import type {
  ConfigurationOutcome,
  ConfigurationPortInput,
  ConfigurationWorkerDependencies,
  PlatformConfigurationOperationId,
  PlatformConfigurationDependencies,
} from './types';
import type { SchemaLike } from './route-support';
import { emitPlatformConfigurationTelemetry } from './telemetry';

const dependenciesFor = (
  dependencies: WorkerDependencies,
): PlatformConfigurationDependencies | undefined =>
  (dependencies as ConfigurationWorkerDependencies).platformConfiguration;

const portUnavailable = (): ConfigurationOutcome => ({
  ok: false,
  status: 503,
  code: 'DEPENDENCY_UNAVAILABLE',
  message: 'Configuration persistence is temporarily unavailable.',
  details: { dependencyClass: 'configuration', retryable: true },
  retryAfterSeconds: 5,
});

const invalidResponse = (): ConfigurationOutcome =>
  authError(
    502,
    'UPSTREAM_FAILURE',
    'The configuration dependency returned an invalid response.',
  );

const runWithDeadline = async (
  invoke: (signal: AbortSignal) => Promise<AuthenticationResult<unknown>>,
  deadlineMs: number,
): Promise<AuthenticationResult<unknown>> => {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<AuthenticationResult<unknown>>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(
        authError(
          504,
          'UPSTREAM_TIMEOUT',
          'Configuration persistence timed out.',
        ),
      );
    }, deadlineMs);
  });
  try {
    return await Promise.race([invoke(controller.signal), timeout]);
  } catch {
    return authError(
      503,
      'VALUE_UNAVAILABLE',
      'Configuration persistence is temporarily unavailable.',
    );
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
};

export const createPlatformConfigurationPortRunner = (
  dependencies: WorkerDependencies,
) => {
  const completed = new Map<
    string,
    Readonly<{ fingerprint: string; outcome: ConfigurationOutcome }>
  >();
  const pending = new Map<
    string,
    Readonly<{ fingerprint: string; promise: Promise<ConfigurationOutcome> }>
  >();

  const run = async (
    context: WorkerContext,
    operationId: PlatformConfigurationOperationId,
    portName: ConfigurationPortName,
    input: ConfigurationPortInput,
    schema: SchemaLike<unknown>,
  ): Promise<ConfigurationOutcome> => {
    const startedAt = dependencies.now();
    const finish = async (
      outcome: ConfigurationOutcome,
    ): Promise<ConfigurationOutcome> => {
      await emitPlatformConfigurationTelemetry(
        context,
        dependencies,
        input,
        outcome,
        startedAt,
      );
      return outcome;
    };
    const configuration = dependenciesFor(dependencies);
    if (configuration === undefined || configuration[portName] === undefined)
      return finish(portUnavailable());

    const invoke = async (): Promise<ConfigurationOutcome> => {
      const result = await runWithDeadline(
        (signal) => configuration[portName](input, context.env, signal),
        configurationDeadline(operationId),
      );
      if (!result.ok) return result;
      const parsed = schema.safeParse(result.value);
      return parsed.success
        ? {
            ok: true,
            value: parsed.data,
            status: configurationStatus(operationId),
          }
        : invalidResponse();
    };

    if (input.idempotencyKey === undefined) return finish(await invoke());
    const key = configurationReplayKey(input);
    const currentFingerprint = configurationFingerprint(input);
    const previous = completed.get(key);
    if (previous !== undefined) {
      return finish(
        previous.fingerprint === currentFingerprint
          ? previous.outcome
          : authError(
              409,
              'IDEMPOTENCY_CONFLICT',
              'The idempotency key was used for another request.',
            ),
      );
    }
    const inFlight = pending.get(key);
    if (inFlight !== undefined) {
      return finish(
        inFlight.fingerprint === currentFingerprint
          ? await inFlight.promise
          : authError(
              409,
              'IDEMPOTENCY_CONFLICT',
              'The idempotency key was used for another request.',
            ),
      );
    }
    const promise = invoke();
    pending.set(key, { fingerprint: currentFingerprint, promise });
    const outcome = await promise;
    pending.delete(key);
    completed.set(key, { fingerprint: currentFingerprint, outcome });
    return finish(outcome);
  };

  return { run };
};
