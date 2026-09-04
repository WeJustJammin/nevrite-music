import type { ContentSchemaRegistryError } from './types';

const safeVersionDetails = (
  details: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> =>
  Object.fromEntries(
    ['expectedVersion', 'currentVersion', 'reason'].flatMap((key) =>
      typeof details[key] === 'string' ? [[key, details[key]]] : [],
    ),
  );

/** Keep only bounded error details that are useful to a human client. */
export const safeDetails = (
  result: ContentSchemaRegistryError,
): Readonly<Record<string, unknown>> => {
  if (result.status === 404 || result.status === 500) return {};
  if (result.status === 400 || result.status === 422) {
    const details = result.details ?? {};
    const violations = details.violations;
    const safeViolations = Array.isArray(violations)
      ? violations.flatMap((value) => {
          if (typeof value !== 'object' || value === null) return [];
          const candidate = value as Record<string, unknown>;
          const pointer =
            typeof candidate.pointer === 'string' &&
            candidate.pointer.length <= 256 &&
            /^[\x20-\x7e]+$/u.test(candidate.pointer)
              ? candidate.pointer
              : null;
          const message =
            typeof candidate.message === 'string' &&
            candidate.message.length <= 500 &&
            /^[\x20-\x7e]+$/u.test(candidate.message)
              ? candidate.message
              : null;
          const code =
            typeof candidate.code === 'string' &&
            candidate.code.length <= 64 &&
            /^[A-Z][A-Z0-9_]{0,63}$/u.test(candidate.code)
              ? candidate.code
              : null;
          return pointer === null && message === null && code === null
            ? []
            : [
                {
                  ...(pointer === null ? {} : { pointer }),
                  ...(message === null ? {} : { message }),
                  ...(code === null ? {} : { code }),
                },
              ];
        })
      : [];
    return {
      ...safeVersionDetails(details),
      ...(safeViolations.length === 0
        ? {}
        : { violations: safeViolations.slice(0, 50) }),
    };
  }
  if (result.status === 401)
    return result.details?.recoveryAction === 'reauthenticate'
      ? { recoveryAction: 'reauthenticate' }
      : {};
  if (result.status === 403)
    return typeof result.details?.reasonCode === 'string'
      ? { reasonCode: result.details.reasonCode }
      : {};
  if (result.status === 409) return safeVersionDetails(result.details ?? {});
  if (result.status === 429) {
    const details = result.details ?? {};
    return Object.fromEntries(
      ['limit', 'resetAt', 'retryAfterSeconds'].flatMap((key) =>
        typeof details[key] === 'number' ? [[key, details[key]]] : [],
      ),
    );
  }
  if (result.status === 502 || result.status === 503 || result.status === 504) {
    const details = result.details ?? {};
    return {
      ...(typeof details.dependencyClass === 'string'
        ? { dependencyClass: details.dependencyClass }
        : {}),
      ...(typeof details.retryable === 'boolean'
        ? { retryable: details.retryable }
        : {}),
      ...(typeof result.retryAfterSeconds === 'number'
        ? { retryAfterSeconds: result.retryAfterSeconds }
        : {}),
    };
  }
  return {};
};
