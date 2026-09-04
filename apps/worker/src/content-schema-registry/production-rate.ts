import type {
  ContentSchemaRegistryDependencies,
  ContentSchemaRegistryResult,
  RateLimitDecision,
} from './types';
import type { ContentSchemaRegistryProductionOptions } from './production-types';
import {
  deadlineExceeded,
  invalidResponse,
  isAbortError,
  mapAuthResult,
  unavailable,
} from './production-errors';

const digestHex = async (value: BufferSource): Promise<string> =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', value))]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const authRateLimiter = (
  options: ContentSchemaRegistryProductionOptions,
): ContentSchemaRegistryDependencies['rateLimit'] | undefined => {
  const limiter = options.auth?.rateLimit;
  if (limiter === undefined) return undefined;
  return async (input, signal) => {
    const identifierDigest = await digestHex(
      new TextEncoder().encode(`${input.principalClass}:${input.actorId}`),
    );
    const result = await limiter(
      {
        operationId: input.operationId,
        request: input.request,
        authUserId: input.principalClass === 'human' ? input.actorId : null,
        actingPartyId: input.actingPartyId,
        identifierDigest,
        limit: input.limit,
        windowSeconds: input.windowSeconds,
      },
      options.environment,
      signal,
    );
    return mapAuthResult(result);
  };
};

export const createRateLimiter = (
  options: ContentSchemaRegistryProductionOptions,
): ContentSchemaRegistryDependencies['rateLimit'] => {
  const limiter = options.rateLimit ?? authRateLimiter(options);
  return async (input, signal) => {
    if (limiter === undefined) return unavailable('rate_limiter');
    try {
      const result = await limiter(input, signal);
      if (!result.ok) return result;
      const value = result.value;
      if (
        typeof value.allowed !== 'boolean' ||
        !Number.isSafeInteger(value.limit) ||
        value.limit < 1 ||
        value.remaining < 0 ||
        !Number.isSafeInteger(value.remaining) ||
        value.remaining > value.limit ||
        !Number.isSafeInteger(value.resetAt) ||
        value.resetAt < 0
      )
        return invalidResponse();
      return {
        ok: true,
        value,
      } as ContentSchemaRegistryResult<RateLimitDecision>;
    } catch (error) {
      return isAbortError(error) || signal.aborted
        ? deadlineExceeded('rate_limiter')
        : unavailable('rate_limiter');
    }
  };
};
