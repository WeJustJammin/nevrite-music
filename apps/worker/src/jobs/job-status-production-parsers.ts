import { JobStatusSchema } from '@wejammin/contracts';

import {
  hasExactKeys,
  isRecord,
  isUuid,
  parseVersion,
  type ServerAuthority,
} from './job-status-production-support';
import type { JobRateLimitDecision, JobStatusRecord } from './job-status-types';

const PROJECTION_KEYS = [
  'actor_id',
  'acting_party_id',
  'created_at',
  'error_code',
  'job_id',
  'job_type',
  'lease_until',
  'progress',
  'result_ref',
  'state',
  'updated_at',
  'version',
] as const;

const RATE_DECISION_KEYS = [
  'allowed',
  'limit_value',
  'remaining',
  'reset_at',
  'scope',
] as const;

export const parseProjection = (
  value: unknown,
  jobId: string,
  authority: ServerAuthority,
): JobStatusRecord | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, PROJECTION_KEYS) ||
    value.job_id !== jobId ||
    !isUuid(value.actor_id) ||
    value.actor_id !== authority.actorId ||
    (value.acting_party_id !== null && !isUuid(value.acting_party_id)) ||
    (value.lease_until !== null && typeof value.lease_until !== 'string')
  ) {
    return null;
  }

  const version = parseVersion(value.version);
  if (version === null) return null;
  if (value.error_code !== null && typeof value.error_code !== 'string') {
    return null;
  }
  const error =
    value.error_code === null
      ? null
      : { code: value.error_code, retryable: false };
  const parsed = JobStatusSchema.safeParse({
    createdAt: value.created_at,
    error,
    id: value.job_id,
    progress: value.progress,
    resultRef: value.result_ref,
    state: value.state,
    type: value.job_type,
    updatedAt: value.updated_at,
  });
  if (!parsed.success) return null;
  return {
    actorId: value.actor_id,
    actingPartyId: value.acting_party_id,
    data: parsed.data,
    etag: `"${version}"`,
  };
};

export const parseRateDecision = (
  value: unknown,
): JobRateLimitDecision | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, RATE_DECISION_KEYS) ||
    typeof value.allowed !== 'boolean' ||
    typeof value.limit_value !== 'number' ||
    !Number.isSafeInteger(value.limit_value) ||
    value.limit_value < 1 ||
    typeof value.remaining !== 'number' ||
    !Number.isSafeInteger(value.remaining) ||
    value.remaining < 0 ||
    value.remaining > value.limit_value ||
    (value.scope !== 'user' && value.scope !== 'party') ||
    typeof value.reset_at !== 'string'
  ) {
    return null;
  }
  const resetAtMs = Date.parse(value.reset_at);
  if (Number.isNaN(resetAtMs) || resetAtMs < 0) return null;
  return {
    allowed: value.allowed,
    limit: value.limit_value,
    remaining: value.remaining,
    resetAt: Math.ceil(resetAtMs / 1_000),
    scope: value.scope,
  };
};
