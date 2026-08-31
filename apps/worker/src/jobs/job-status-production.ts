import {
  callRpc,
  JobStatusProductionInternalError,
  JobStatusProductionUnavailableError,
  isUuid,
  normalizeConfiguration,
  parseBearerToken,
  readJson,
  type JobStatusProductionOptions,
  type ServerAuthority,
} from './job-status-production-support';
import {
  authorityFromResolver,
  principalFromAuthority,
} from './job-status-production-authority';
import {
  parseProjection,
  parseRateDecision,
} from './job-status-production-parsers';
import type {
  JobRateLimitInput,
  JobStatusDependencies,
} from './job-status-types';

export type {
  JobStatusProductionAuthority,
  JobStatusProductionAuthorityKind,
  JobStatusProductionAuthorityResolver,
  JobStatusProductionFetch,
  JobStatusProductionOptions,
  ServerAuthority,
  VerifiedJobStatusSession,
} from './job-status-production-support';
export {
  JobStatusProductionConfigurationError,
  JobStatusProductionInternalError,
  JobStatusProductionUnavailableError,
} from './job-status-production-support';

export const createProductionJobStatusDependencies = (
  options: JobStatusProductionOptions,
): JobStatusDependencies => {
  const configuration = normalizeConfiguration(options);
  const authorities = new WeakMap<AbortSignal, ServerAuthority>();

  const resolvePrincipal: JobStatusDependencies['resolvePrincipal'] = async (
    request,
    signal,
  ) => {
    const token = parseBearerToken(request);
    if (token === null) return null;
    if (signal.aborted) throw new JobStatusProductionUnavailableError();

    let response: Response;
    try {
      response = await configuration.fetchImpl(
        `${configuration.baseUrl}/auth/v1/user`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            apikey: configuration.secret,
          },
          method: 'GET',
          signal,
        },
      );
    } catch {
      throw new JobStatusProductionUnavailableError();
    }
    if (response.status >= 400 && response.status < 500) return null;
    if (response.status < 200 || response.status >= 300) {
      throw new JobStatusProductionUnavailableError();
    }
    if (signal.aborted) throw new JobStatusProductionUnavailableError();
    const payload = await readJson(response, configuration.maxResponseBytes);
    if (signal.aborted) throw new JobStatusProductionUnavailableError();
    if (!isUserPayload(payload)) throw new JobStatusProductionInternalError();
    let authority: ServerAuthority;
    if (configuration.resolveServerAuthority !== undefined) {
      let resolved: unknown;
      try {
        resolved = await configuration.resolveServerAuthority({
          request,
          session: { userId: payload.id },
          signal,
        });
      } catch {
        throw new JobStatusProductionUnavailableError();
      }
      if (signal.aborted) throw new JobStatusProductionUnavailableError();
      authority = authorityFromResolver(payload.id, resolved);
    } else {
      authority = authorityFromResolver(payload.id, null);
    }
    authorities.set(signal, authority);
    return principalFromAuthority(authority);
  };

  const loadJobStatus: JobStatusDependencies['loadJobStatus'] = async ({
    jobId,
    signal,
  }) => {
    const authority = authorities.get(signal);
    if (authority === undefined || !isUuid(jobId)) {
      throw new JobStatusProductionInternalError();
    }
    const payload = await callRpc({
      baseUrl: configuration.baseUrl,
      body: {
        p_acting_party_id: authority.actingPartyId,
        p_actor_id: authority.actorId,
        p_capability: authority.capability,
        p_job_id: jobId,
        p_reason: authority.reason,
        p_step_up_verified: authority.stepUpVerified,
      },
      fetchImpl: configuration.fetchImpl,
      maxResponseBytes: configuration.maxResponseBytes,
      name: configuration.jobStatusRpc,
      secret: configuration.secret,
      signal,
    });
    if (!Array.isArray(payload)) throw new JobStatusProductionInternalError();
    if (payload.length === 0) return null;
    if (payload.length !== 1) throw new JobStatusProductionInternalError();
    const record = parseProjection(payload[0], jobId, authority);
    if (record === null) throw new JobStatusProductionInternalError();
    return record;
  };

  const rateLimit: JobStatusDependencies['rateLimit'] = async (
    input: JobRateLimitInput,
  ) => {
    if (
      !isUuid(input.userId) ||
      (input.actingPartyId !== null && !isUuid(input.actingPartyId)) ||
      input.userLimit !== 300 ||
      input.partyLimit !== 600 ||
      !Number.isSafeInteger(input.nowMs) ||
      input.nowMs < 0
    ) {
      throw new JobStatusProductionInternalError();
    }
    const payload = await callRpc({
      baseUrl: configuration.baseUrl,
      body: {
        p_acting_party_id: input.actingPartyId,
        p_user_id: input.userId,
      },
      fetchImpl: configuration.fetchImpl,
      maxResponseBytes: configuration.maxResponseBytes,
      name: configuration.rateLimitRpc,
      secret: configuration.secret,
      signal: input.signal,
    });
    if (!Array.isArray(payload) || payload.length !== 1) {
      throw new JobStatusProductionInternalError();
    }
    const decision = parseRateDecision(payload[0]);
    if (decision === null) throw new JobStatusProductionInternalError();
    return decision;
  };

  return {
    loadJobStatus,
    now: configuration.now,
    rateLimit,
    resolvePrincipal,
  };
};

const isUserPayload = (value: unknown): value is Readonly<{ id: string }> =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  isUuid(value.id);
