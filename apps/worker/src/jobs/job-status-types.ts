import type { JobStatus } from '@wejammin/contracts';

export const JOB_STATUS_TIMEOUT_MS = 8_000;
export const USER_READ_LIMIT = 300;
export const PARTY_READ_LIMIT = 600;

export type MaybePromise<T> = T | Promise<T>;

export type JobStatusPrincipal =
  | Readonly<{ kind: 'anonymous' }>
  | Readonly<{ kind: 'user'; userId: string }>
  | Readonly<{
      kind: 'acting_party';
      userId: string;
      actingPartyId: string;
      capabilities: readonly string[];
    }>
  | Readonly<{
      kind: 'operator';
      userId: string;
      actingPartyId: string | null;
      capabilities: readonly string[];
      stepUpVerified: boolean;
      reason: string | null;
    }>
  | Readonly<{ kind: 'queue' }>
  | Readonly<{ kind: 'webhook' }>
  | Readonly<{ kind: 'deployment' }>
  | Readonly<{ kind: 'service' }>;

export type JobStatusRecord = Readonly<{
  actorId: string;
  actingPartyId: string | null;
  data: JobStatus;
  etag: string;
}>;

export type JobRateLimitInput = Readonly<{
  signal: AbortSignal;
  userId: string;
  actingPartyId: string | null;
  userLimit: number;
  partyLimit: number;
  nowMs: number;
}>;

export type JobRateLimitDecision = Readonly<{
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  scope: 'user' | 'party';
}>;

export type JobOperatorAuditEvent = Readonly<{
  actorId: string;
  actingPartyId: string | null;
  decision: 'allow' | 'deny';
  jobId: string;
  reason: string;
  requestId: string;
  signal: AbortSignal;
}>;

export type JobStatusDependencies = Readonly<{
  /** Resolve identity from the verified server session, never from request headers. */
  resolvePrincipal: (
    request: Request,
    signal: AbortSignal,
  ) => MaybePromise<unknown>;
  /** Read the RLS-filtered status projection without mutation or idempotency writes. */
  loadJobStatus: (
    input: Readonly<{ jobId: string; signal: AbortSignal }>,
  ) => MaybePromise<JobStatusRecord | null>;
  /** Shared edge limiter; the route fails closed when this port is absent. */
  rateLimit: (input: JobRateLimitInput) => MaybePromise<JobRateLimitDecision>;
  auditOperatorAccess?: (event: JobOperatorAuditEvent) => MaybePromise<void>;
  now?: () => number;
}>;

export class JobStatusDependencyError extends Error {
  constructor(message = 'Job status dependency unavailable') {
    super(message);
    this.name = 'JobStatusDependencyError';
  }
}

export class JobStatusInternalError extends Error {
  constructor(message = 'Job status internal failure') {
    super(message);
    this.name = 'JobStatusInternalError';
  }
}
