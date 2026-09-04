import {
  ChallengeResourceSchema,
  ClaimResourceSchema,
  JobStatusSchema,
  MatchResponseSchema,
  ProfileClaimChangedEventSchema,
  RemedyResourceSchema,
  type ProfileEvent,
} from '@wejammin/contracts';

import type { WorkerContext } from '../index';
import { authError, responseForAuthError } from '../authentication/boundary';
import type {
  AuthenticationResult,
  AuthenticationSession,
} from '../authentication/types';
import type { ActiveOperation, Outcome } from './route-types';
import type { ProfilePortInput } from './types';

export type { Outcome };

const statuses: Readonly<Record<ActiveOperation, 200 | 201 | 202>> = {
  'PRF-API-01': 200,
  'PRF-API-02': 202,
  'PRF-API-03': 200,
  'PRF-API-04': 201,
  'PRF-API-05': 200,
  'PRF-API-06': 201,
  'PRF-API-07': 200,
  'PRF-API-08': 200,
};

const responseSchemas = {
  'PRF-API-01': MatchResponseSchema,
  'PRF-API-02': JobStatusSchema,
  'PRF-API-03': RemedyResourceSchema,
  'PRF-API-04': ClaimResourceSchema,
  'PRF-API-05': ClaimResourceSchema,
  'PRF-API-06': ChallengeResourceSchema,
  'PRF-API-07': ClaimResourceSchema,
  'PRF-API-08': ClaimResourceSchema,
} as const;

const stable = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stable);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stable(child)]),
  );
};

export const fingerprint = (input: ProfilePortInput): string =>
  JSON.stringify(
    stable({
      operationId: input.operationId,
      path: input.path ?? {},
      body: input.body ?? {},
      ifMatch: input.ifMatch ?? null,
    }),
  );

export const replayKey = (input: ProfilePortInput): string =>
  `${input.operationId}|${input.session?.authUserId ?? 'anonymous'}|${input.idempotencyKey ?? ''}`;

export const validateResponse = (
  operationId: ActiveOperation,
  value: unknown,
): AuthenticationResult<unknown> => {
  const parsed = responseSchemas[operationId].safeParse(value);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : authError(
        502,
        'DEPENDENCY_UNAVAILABLE',
        'Profile ownership returned an invalid response.',
        {
          dependencyClass: 'profile_ownership',
          retryable: true,
        },
      );
};

export const claimEvent = (
  context: WorkerContext,
  value: unknown,
  session: AuthenticationSession,
): AuthenticationResult<ProfileEvent> => {
  const record =
    typeof value === 'object' && value !== null
      ? (value as Readonly<Record<string, unknown>>)
      : null;
  if (
    typeof record?.id !== 'string' ||
    typeof record.targetPartyId !== 'string' ||
    typeof record.version !== 'string'
  )
    return authError(
      502,
      'DEPENDENCY_UNAVAILABLE',
      'Profile ownership returned an invalid claim.',
      {
        dependencyClass: 'profile_ownership',
        retryable: true,
      },
    );
  const parsed = ProfileClaimChangedEventSchema.safeParse({
    eventId: crypto.randomUUID(),
    schemaVersion: 1,
    aggregateType: 'claim_case',
    aggregateId: record.id,
    aggregateVersion: record.version,
    correlationId: context.get('correlationId'),
    causationId: null,
    actorId: session.personId,
    actingPartyId: session.actingPartyId,
    occurredAt: new Date().toISOString(),
    eventType: 'profile.claim.changed.v1',
    payload: { claimCaseId: record.id, partyId: record.targetPartyId },
  });
  return parsed.success
    ? { ok: true, value: parsed.data }
    : authError(
        502,
        'DEPENDENCY_UNAVAILABLE',
        'Profile ownership returned an invalid claim event.',
        {
          dependencyClass: 'profile_ownership',
          retryable: true,
        },
      );
};

export const send = (
  context: WorkerContext,
  outcome: Outcome,
  operationId?: ActiveOperation,
): Response => {
  if (!outcome.ok) return responseForAuthError(context, outcome.error);
  context.header('cache-control', 'no-store');
  const record =
    typeof outcome.value === 'object' && outcome.value !== null
      ? (outcome.value as Readonly<Record<string, unknown>>)
      : null;
  if (typeof record?.version === 'string')
    context.header('etag', `"${record.version}"`);
  if (typeof record?.jobId === 'string')
    context.header('location', `/api/v1/jobs/${record.jobId}`);
  if (operationId === 'PRF-API-02' && typeof record?.id === 'string')
    context.header('location', `/api/v1/jobs/${record.id}`);
  return context.json(outcome.value as Record<string, unknown>, outcome.status);
};

export const statusFor = (operationId: ActiveOperation): 200 | 201 | 202 =>
  statuses[operationId];
