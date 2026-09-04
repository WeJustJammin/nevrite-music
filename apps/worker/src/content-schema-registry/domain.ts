import { createContentSchemaRegistryPortRunner } from './runtime-port';
import type {
  ContentSchemaRegistryDependencies,
  ContentSchemaRegistryPortInput,
  ContentSchemaRegistryResult,
} from './types';

export const BLOCK_LIFECYCLE_EVENT_TYPE =
  'cms.block.lifecycle.changed.v1' as const;
export const BLOCK_LIFECYCLE_ORDER = [
  'supported',
  'deprecated',
  'withdrawn',
] as const;

const stableValue = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => a.localeCompare(b),
  );
  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableValue(entry)}`).join(',')}}`;
};

const fingerprintFor = (input: ContentSchemaRegistryPortInput): string =>
  stableValue({
    operationId: input.operationId,
    path: input.path,
    body: input.body,
    query: input.query,
    idempotencyKey: input.idempotencyKey,
    ifMatch: input.ifMatch,
    userId: input.session?.userId,
    actingPartyId: input.session?.actingPartyId,
    principalId: input.principal?.principalId,
    release:
      input.release === undefined
        ? undefined
        : {
            headers: {
              keyId: input.release.headers.keyId,
              issuedAt: input.release.headers.issuedAt,
              nonce: input.release.headers.nonce,
              signature: input.release.headers.signature,
            },
            rawBodyHash: input.principal?.rawBodyHash,
            signatureHash: input.principal?.signatureHash,
            nonceHash: input.principal?.nonceHash,
          },
    ...(input.operationId === 'CMS-03A-08'
      ? {
          lifecycleEventType: BLOCK_LIFECYCLE_EVENT_TYPE,
          lifecycleOrder: BLOCK_LIFECYCLE_ORDER,
        }
      : {}),
  });

export const createContentSchemaRegistryDomain = (
  dependencies: ContentSchemaRegistryDependencies,
) => {
  const runner = createContentSchemaRegistryPortRunner(dependencies);
  const completed = new Map<
    string,
    Readonly<{
      fingerprint: string;
      outcome: ContentSchemaRegistryResult<unknown>;
    }>
  >();
  const pending = new Map<
    string,
    Readonly<{
      fingerprint: string;
      promise: Promise<ContentSchemaRegistryResult<unknown>>;
    }>
  >();

  const execute = async (
    input: ContentSchemaRegistryPortInput,
  ): Promise<ContentSchemaRegistryResult<unknown>> => {
    const key = input.idempotencyKey;
    if (key === undefined) return runner.run(input);
    const fingerprint = fingerprintFor(input);
    const previous = completed.get(`${input.operationId}:${key}`);
    if (previous !== undefined)
      return previous.fingerprint === fingerprint
        ? previous.outcome
        : {
            ok: false,
            status: 409,
            code: 'IDEMPOTENCY_CONFLICT',
            message: 'The idempotency key was used for another request.',
            details: {},
          };
    const cacheKey = `${input.operationId}:${key}`;
    const inFlight = pending.get(cacheKey);
    if (inFlight !== undefined)
      return inFlight.fingerprint === fingerprint
        ? inFlight.promise
        : {
            ok: false,
            status: 409,
            code: 'IDEMPOTENCY_CONFLICT',
            message: 'The idempotency key was used for another request.',
            details: {},
          };
    const promise = runner.run(input);
    pending.set(cacheKey, { fingerprint, promise });
    const outcome = await promise;
    pending.delete(cacheKey);
    // A failed transaction has no durable reservation. Retrying the same key
    // must re-enter the named RPC so the adapter can reconcile its outcome.
    if (outcome.ok) completed.set(cacheKey, { fingerprint, outcome });
    return outcome;
  };

  return { execute };
};
