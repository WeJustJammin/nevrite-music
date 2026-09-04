import {
  canonicalPayload,
  invalidRelationshipResponse,
  mapRelationshipFailure,
  readBoundedJson,
  replayId,
  retryAfterFromResponse,
  relationshipHeaders,
  rpcFailure,
  type RelationshipReplay,
  type RelationshipSchema,
} from './relationship-production-support';
import type { AuthProductionConfiguration } from '../authentication/production-configuration';
import type { AuthenticationResult } from '../authentication/types';

export type {
  RelationshipReplay,
  RelationshipSchema,
} from './relationship-production-support';

export const callRelationshipRpc = async (
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
      headers: relationshipHeaders(config, extraHeaders),
      body: JSON.stringify(input),
    });
  } catch (error) {
    throw mapRelationshipFailure(error);
  }
  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await readBoundedJson(response);
    } catch {
      // A malformed provider error cannot be safely classified.
    }
    throw rpcFailure(
      payload,
      response.status,
      retryAfterFromResponse(response),
    );
  }
  return readBoundedJson(response);
};

export const callRelationship = async <T>(
  config: AuthProductionConfiguration,
  name: string,
  input: Readonly<Record<string, unknown>>,
  signal: AbortSignal,
  schema: RelationshipSchema<T>,
  extraHeaders: Readonly<Record<string, string>> = {},
  replay?: RelationshipReplay,
): Promise<AuthenticationResult<T>> => {
  try {
    const result = await callRelationshipRpc(
      config,
      name,
      input,
      signal,
      extraHeaders,
    );
    let parsed = schema.safeParse(canonicalPayload(result));
    if (!parsed.success && replay !== undefined) {
      const id = replayId(result, replay.idField);
      if (id !== null) {
        const reread = await callRelationshipRpc(
          config,
          replay.rpc,
          { ...replay.baseInput, [replay.idParameter]: id },
          signal,
          replay.headers,
        );
        parsed = schema.safeParse(canonicalPayload(reread));
      }
    }
    return parsed.success
      ? { ok: true, value: parsed.data }
      : invalidRelationshipResponse();
  } catch (error) {
    return mapRelationshipFailure(error);
  }
};
