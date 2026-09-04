import type { AuthProductionConfiguration } from '../authentication/production-configuration';
import type {
  AuthenticationError,
  AuthenticationResult,
} from '../authentication/types';
import {
  canonicalProfilePayload,
  invalidProfileResponse,
  mapProfileFailure,
  profileHeaders,
  profileRpcFailure,
  readProfileJson,
  replayProfileId,
  retryAfterFromProfileResponse,
  type ProfileReplay,
  type ProfileSchema,
} from './production-support';
import { profileApplicationFailure } from './profile-conflicts';

export type { ProfileReplay, ProfileSchema } from './production-support';

export const callProfileRpc = async (
  config: AuthProductionConfiguration,
  name: string,
  input: Readonly<Record<string, unknown>>,
  signal: AbortSignal,
  extraHeaders: Readonly<Record<string, string>> = {},
): Promise<unknown> => {
  let response: Response;
  try {
    response = await config.fetchImpl(`${config.baseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST',
      signal,
      headers: profileHeaders(config, extraHeaders),
      body: JSON.stringify(input),
    });
  } catch (error) {
    throw mapProfileFailure(error);
  }
  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await readProfileJson(response);
    } catch {
      // Preserve the HTTP status fallback when the provider error is unreadable.
    }
    throw profileRpcFailure(
      payload,
      response.status,
      retryAfterFromProfileResponse(response),
    );
  }
  return readProfileJson(response);
};

export const callProfile = async <T>(
  config: AuthProductionConfiguration,
  name: string,
  input: Readonly<Record<string, unknown>>,
  signal: AbortSignal,
  schema: ProfileSchema<T>,
  extraHeaders: Readonly<Record<string, string>> = {},
  replay?: ProfileReplay,
): Promise<AuthenticationResult<T>> => {
  try {
    const result = await callProfileRpc(
      config,
      name,
      input,
      signal,
      extraHeaders,
    );
    const applicationFailure = profileApplicationFailure(result);
    if (applicationFailure !== null)
      return applicationFailure as AuthenticationResult<T>;
    let parsed = schema.safeParse(canonicalProfilePayload(result));
    if (!parsed.success && replay !== undefined) {
      const id = replayProfileId(result, replay.idField);
      if (id !== null) {
        const baseRequest = replay.baseInput.p_request;
        const replayInput =
          typeof baseRequest === 'object' && baseRequest !== null
            ? {
                p_request: {
                  ...(baseRequest as Readonly<Record<string, unknown>>),
                  [replay.idParameter]: id,
                },
              }
            : { ...replay.baseInput, [replay.idParameter]: id };
        const reread = await callProfileRpc(
          config,
          replay.rpc,
          replayInput,
          signal,
          replay.headers,
        );
        parsed = schema.safeParse(canonicalProfilePayload(reread));
      }
    }
    return parsed.success
      ? { ok: true, value: parsed.data }
      : invalidProfileResponse();
  } catch (error) {
    return isAuthenticationError(error)
      ? (error as AuthenticationError)
      : mapProfileFailure(error);
  }
};

const isAuthenticationError = (value: unknown): value is AuthenticationError =>
  typeof value === 'object' &&
  value !== null &&
  'ok' in value &&
  value.ok === false;
