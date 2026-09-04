import {
  ApiErrorSchema,
  Cfg05a03ChangeResponseSchema,
  Cfg05a04ChangeActionResponseSchema,
} from '@wejammin/contracts';

import { mutationFailureState } from './platform-configuration-state';
import type {
  PlatformConfigurationAsyncState,
  PlatformConfigurationError,
} from './platform-configuration-workbench-types';
export { SETTINGS_FLAGS_RUNTIME_ERROR_CODES } from './settings-flags-runtime-workbench-contract';
export {
  canonicalInstantFormValue,
  formDataToConfigurationCommand,
  jsonFormValue,
} from './settings-flags-runtime-workbench-command';

export const SETTINGS_FLAGS_RUNTIME_OPERATION_MAP = Object.freeze({
  'CFG-05A-02': 'GET /api/v1/config/:key/effective',
  'CFG-05A-03': 'POST /api/v1/admin/settings/:definitionId/changes',
  'CFG-05A-04': 'POST /api/v1/admin/settings/changes/:reviewId/actions',
} as const);

const fallbackError = (
  status: number,
  requestId: string,
): PlatformConfigurationError => ({
  code:
    status === 429
      ? 'RATE_LIMITED'
      : status === 409
        ? 'VERSION_CONFLICT'
        : status >= 500
          ? 'DEPENDENCY_UNAVAILABLE'
          : 'INVALID_REQUEST',
  message:
    status === 429
      ? 'Too many requests. Retry after the countdown.'
      : status === 409
        ? 'The current version changed. Review before retrying.'
        : status >= 500
          ? 'Platform configuration is temporarily unavailable.'
          : 'This request could not be read. Review the form and try again.',
  requestId,
});

const presentationErrorDetails = (
  value: Readonly<Record<string, unknown>>,
): PlatformConfigurationError['details'] | undefined => {
  const rawViolations = value.violations;
  const violations = Array.isArray(rawViolations)
    ? rawViolations.slice(0, 32).flatMap((item) => {
        if (item === null || typeof item !== 'object') return [];
        const record = item as Readonly<Record<string, unknown>>;
        if (
          typeof record.path !== 'string' ||
          record.path.length > 256 ||
          typeof record.message !== 'string' ||
          record.message.length > 500
        ) {
          return [];
        }
        const code =
          typeof record.code === 'string' && record.code.length <= 64
            ? record.code
            : undefined;
        return [
          {
            path: record.path,
            message: record.message,
            ...(code === undefined ? {} : { code }),
          },
        ];
      })
    : [];
  const retryAfterSeconds = value.retryAfterSeconds;
  const safeRetryAfter =
    typeof retryAfterSeconds === 'number' &&
    Number.isInteger(retryAfterSeconds) &&
    retryAfterSeconds >= 0 &&
    retryAfterSeconds <= 86_400
      ? retryAfterSeconds
      : undefined;
  if (violations.length === 0 && safeRetryAfter === undefined) return undefined;
  return {
    ...(violations.length === 0 ? {} : { violations }),
    ...(safeRetryAfter === undefined
      ? {}
      : { retryAfterSeconds: safeRetryAfter }),
  };
};

export const parsePlatformConfigurationError = async (
  response: Response,
  requestId = response.headers.get('x-request-id') ??
    'platform-configuration-request',
): Promise<PlatformConfigurationError> => {
  try {
    const parsed = ApiErrorSchema.safeParse(await response.clone().json());
    if (parsed.success) {
      const details = presentationErrorDetails(parsed.data.details);
      return {
        code: parsed.data.code,
        message: parsed.data.message,
        requestId: parsed.data.requestId,
        ...(details === undefined ? {} : { details }),
      };
    }
  } catch {
    // Use the status fallback below; malformed provider responses never render.
  }
  return fallbackError(response.status, requestId);
};

export const parseConfigurationCommandResponse = (
  value: unknown,
  operationId: 'CFG-05A-03' | 'CFG-05A-04',
) => {
  const schema =
    operationId === 'CFG-05A-03'
      ? Cfg05a03ChangeResponseSchema
      : Cfg05a04ChangeActionResponseSchema;
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

export const commandFailureState = (
  response: Response,
  error: PlatformConfigurationError,
): PlatformConfigurationAsyncState =>
  mutationFailureState(response.status, error.requestId, error);
