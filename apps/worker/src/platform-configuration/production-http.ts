import {
  asRecord,
  authEncoder,
  MAX_RESPONSE_BYTES,
  normalizeAuthProductionOptions,
  traceFor,
  type AuthProductionConfiguration,
  type AuthProductionOptions,
} from '../authentication/production-configuration';
import { authError } from '../authentication/boundary';
import type {
  AuthenticationError,
  AuthenticationResult,
} from '../authentication/types';
import type { ConfigurationPortInput } from './types';
import { configurationRpcFailure } from './production-error';
import { supabaseRpcHeaders } from '../supabase-rpc-headers';

export { configurationRpcFailure } from './production-error';

export type ConfigurationSchema<T> = Readonly<{
  safeParse: (
    value: unknown,
  ) => { success: true; data: T } | { success: false };
}>;

export const configurationHeaders = (
  config: AuthProductionConfiguration,
  input: ConfigurationPortInput,
): Readonly<Record<string, string>> => {
  const trace = traceFor(input.request);
  return {
    Accept: 'application/json',
    'Accept-Profile': 'platform_api',
    'Content-Profile': 'platform_api',
    'Content-Type': 'application/json',
    ...supabaseRpcHeaders(config.secret),
    'X-Operation-Id': input.operationId,
    'X-Request-Id': trace.requestId,
    'X-Correlation-Id': trace.correlationId,
    ...(input.idempotencyKey === undefined
      ? {}
      : { 'X-Idempotency-Key': input.idempotencyKey }),
    ...(input.ifMatch === undefined
      ? {}
      : { 'If-Match': `"${input.ifMatch}"` }),
    ...(input.servicePrincipalId === undefined
      ? {}
      : { 'X-Release-Principal': input.servicePrincipalId }),
  };
};

export const readConfigurationJson = async (
  response: Response,
): Promise<unknown> => {
  const text = await response.text();
  if (authEncoder.encode(text).byteLength > MAX_RESPONSE_BYTES)
    throw authError(
      502,
      'UPSTREAM_FAILURE',
      'The configuration dependency returned an invalid response.',
    );
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw authError(
      502,
      'UPSTREAM_FAILURE',
      'The configuration dependency returned an invalid response.',
    );
  }
};

const canonical = (value: unknown): unknown => {
  const unwrapped =
    Array.isArray(value) && value.length === 1 ? value[0] : value;
  const record = asRecord(unwrapped);
  if (record === null || record.replayed !== true) return unwrapped;
  const result = { ...record };
  delete result.replayed;
  return result;
};

export const callConfigurationRpc = async (
  config: AuthProductionConfiguration,
  name: string,
  input: Readonly<Record<string, unknown>>,
  requestInput: ConfigurationPortInput,
  signal: AbortSignal,
): Promise<unknown> => {
  let response: Response;
  try {
    response = await config.fetchImpl(`${config.baseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST',
      signal,
      headers: configurationHeaders(config, requestInput),
      body: JSON.stringify(input),
    });
  } catch (error) {
    if (
      (error instanceof DOMException && error.name === 'AbortError') ||
      (error instanceof Error && error.name === 'AbortError')
    )
      throw authError(
        504,
        'UPSTREAM_TIMEOUT',
        'Configuration persistence timed out.',
      );
    throw authError(
      503,
      'VALUE_UNAVAILABLE',
      'Configuration persistence is temporarily unavailable.',
    );
  }
  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await readConfigurationJson(response);
    } catch {
      // The HTTP status remains the only safe provider signal.
    }
    throw configurationRpcFailure(payload, response.status, response);
  }
  return canonical(await readConfigurationJson(response));
};

export const callConfiguration = async <T>(
  config: AuthProductionConfiguration,
  name: string,
  input: Readonly<Record<string, unknown>>,
  requestInput: ConfigurationPortInput,
  signal: AbortSignal,
  schema: ConfigurationSchema<T>,
): Promise<AuthenticationResult<T>> => {
  try {
    const result = await callConfigurationRpc(
      config,
      name,
      input,
      requestInput,
      signal,
    );
    const parsed = schema.safeParse(result);
    return parsed.success
      ? { ok: true, value: parsed.data }
      : authError(
          502,
          'UPSTREAM_FAILURE',
          'The configuration dependency returned an invalid response.',
        );
  } catch (error) {
    return isAuthenticationError(error)
      ? error
      : authError(
          503,
          'VALUE_UNAVAILABLE',
          'Configuration persistence is temporarily unavailable.',
        );
  }
};

const isAuthenticationError = (value: unknown): value is AuthenticationError =>
  typeof value === 'object' &&
  value !== null &&
  'ok' in value &&
  value.ok === false;

export const normalizeConfigurationOptions = (
  options: AuthProductionOptions,
): AuthProductionConfiguration => normalizeAuthProductionOptions(options);
