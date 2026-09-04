import { authError } from '../authentication/boundary';
import type { AuthProductionConfiguration } from '../authentication/production-configuration';
import { mapProductionFailure } from '../authentication/production-http';
import type {
  AuthenticationError,
  AuthenticationResult,
} from '../authentication/types';

const boundedJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > 256 * 1024)
    throw new Error('response_too_large');
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('malformed_json');
  }
};

const rpcFailure = (value: unknown): AuthenticationError => {
  const message =
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
      ? value.message
      : '';
  const known: Readonly<
    Record<
      string,
      Readonly<{
        status: AuthenticationError['status'];
        code: string;
        message: string;
      }>
    >
  > = {
    PERSON_ALREADY_EXISTS: {
      status: 409,
      code: 'PERSON_ALREADY_EXISTS',
      message: 'A person identity already exists.',
    },
    FACET_EXISTS: {
      status: 409,
      code: 'FACET_EXISTS',
      message: 'The facet is already active.',
    },
    FACET_UNKNOWN: {
      status: 422,
      code: 'FACET_UNKNOWN',
      message: 'The selected facet is not available.',
    },
    HANDLE_TAKEN: {
      status: 409,
      code: 'HANDLE_TAKEN',
      message: 'The handle is unavailable.',
    },
    HANDLE_QUOTA_EXCEEDED: {
      status: 409,
      code: 'HANDLE_QUOTA_EXCEEDED',
      message: 'The handle-change limit was reached.',
    },
    ALIAS_QUOTA_EXCEEDED: {
      status: 409,
      code: 'ALIAS_QUOTA_EXCEEDED',
      message: 'The alias creation limit was reached.',
    },
    ALIAS_NOT_FOUND: {
      status: 404,
      code: 'ALIAS_NOT_FOUND',
      message: 'The alias was not found.',
    },
    TRANSFER_NOT_FOUND: {
      status: 404,
      code: 'TRANSFER_NOT_FOUND',
      message: 'The transfer offer was not found.',
    },
    TRANSFER_EXPIRED: {
      status: 409,
      code: 'TRANSFER_EXPIRED',
      message: 'The transfer offer has expired.',
    },
    TRANSFER_NOT_ALLOWED: {
      status: 409,
      code: 'TRANSFER_NOT_ALLOWED',
      message: 'The transfer is not allowed.',
    },
    CONTEXT_NOT_FOUND: {
      status: 404,
      code: 'CONTEXT_NOT_FOUND',
      message: 'The acting context was not found.',
    },
    CONTEXT_REVOKED: {
      status: 403,
      code: 'CONTEXT_REVOKED',
      message: 'The acting context is no longer available.',
    },
    CONTEXT_RECONFIRM_REQUIRED: {
      status: 403,
      code: 'CONTEXT_RECONFIRM_REQUIRED',
      message: 'Fresh confirmation is required.',
    },
    OPEN_OBLIGATION: {
      status: 409,
      code: 'OPEN_OBLIGATION',
      message: 'The alias has an open obligation.',
    },
    FACET_OBLIGATIONS_OPEN: {
      status: 409,
      code: 'FACET_OBLIGATIONS_OPEN',
      message: 'The facet has open obligations.',
    },
    VERSION_MISMATCH: {
      status: 409,
      code: 'VERSION_MISMATCH',
      message: 'The resource changed; reload and try again.',
    },
    FORBIDDEN: {
      status: 403,
      code: 'FORBIDDEN',
      message: 'The action is not allowed.',
    },
    NOT_FOUND: {
      status: 404,
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    },
  };
  const match = Object.keys(known).find((code) => message.includes(code));
  const mapped = match === undefined ? undefined : known[match];
  return mapped === undefined
    ? authError(
        503,
        'DEPENDENCY_UNAVAILABLE',
        'Identity persistence is unavailable.',
      )
    : authError(mapped.status, mapped.code, mapped.message);
};

export const callIdentityRpc = async (
  config: AuthProductionConfiguration,
  name: string,
  input: Readonly<Record<string, unknown>>,
  signal: AbortSignal,
): Promise<unknown> => {
  let response: Response;
  try {
    response = await config.fetchImpl(`${config.baseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST',
      signal,
      headers: {
        Accept: 'application/json',
        'Accept-Profile': 'platform_api',
        apikey: config.secret,
        authorization: `Bearer ${config.secret}`,
        'Content-Profile': 'platform_api',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
  } catch (error) {
    throw mapProductionFailure(error);
  }
  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await boundedJson(response);
    } catch {
      // An unreadable error payload is still an unavailable dependency.
    }
    throw rpcFailure(payload);
  }
  return boundedJson(response);
};

export const callIdentity = async <T>(
  config: AuthProductionConfiguration,
  name: string,
  input: Readonly<Record<string, unknown>>,
  signal: AbortSignal,
  schema: {
    safeParse: (
      value: unknown,
    ) => { success: true; data: T } | { success: false };
  },
): Promise<AuthenticationResult<T>> => {
  try {
    const parsed = schema.safeParse(
      await callIdentityRpc(config, name, input, signal),
    );
    return parsed.success
      ? { ok: true, value: parsed.data }
      : authError(
          502,
          'DEPENDENCY_INVALID_RESPONSE',
          'Identity persistence returned an invalid response.',
        );
  } catch (error) {
    return typeof error === 'object' &&
      error !== null &&
      'ok' in error &&
      error.ok === false
      ? (error as AuthenticationError)
      : mapProductionFailure(error);
  }
};
