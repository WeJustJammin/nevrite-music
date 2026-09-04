import { authRoutePolicies, type AuthOperationId } from '@wejammin/contracts';

import type { WorkerContext } from '../index';
import { applyRateHeaders, authError, responseForAuthError } from './boundary';
import type {
  AuthenticationDependencies,
  AuthenticationResult,
  AuthenticationSession,
} from './types';

export const policyFor = (operationId: AuthOperationId) => {
  const policy = authRoutePolicies.find(
    (item) => item.operationId === operationId,
  );
  if (policy === undefined)
    throw new Error(`Missing auth policy ${operationId}`);
  return policy;
};

export const requireSession = async (
  context: WorkerContext,
  dependencies: AuthenticationDependencies,
): Promise<AuthenticationResult<AuthenticationSession>> => {
  const controller = new AbortController();
  return dependencies.resolveSession(
    context.req.raw,
    context.env,
    controller.signal,
  );
};

export const enforceRate = async (
  context: WorkerContext,
  dependencies: AuthenticationDependencies,
  operationId: AuthOperationId,
  session: AuthenticationSession | null,
  identifierDigest: string | null = null,
): Promise<Response | null> => {
  const policy = policyFor(operationId);
  const controller = new AbortController();
  const result = await dependencies.rateLimit(
    {
      operationId,
      request: context.req.raw,
      authUserId: session?.authUserId ?? null,
      identifierDigest,
      limit: policy.rateLimit,
      windowSeconds: policy.rateWindowSeconds,
    },
    context.env,
    controller.signal,
  );
  if (!result.ok) return responseForAuthError(context, result);
  applyRateHeaders(context, result.value);
  return result.value.allowed
    ? null
    : responseForAuthError(
        context,
        authError(429, 'RATE_LIMITED', 'Too many requests.'),
      );
};

export const isStepUpFresh = (
  session: AuthenticationSession,
  nowMs: number,
): boolean => {
  if (session.stepUpAt === null) return false;
  const stepUpMs = Date.parse(session.stepUpAt);
  return Number.isFinite(stepUpMs) && nowMs - stepUpMs <= 10 * 60 * 1000;
};

export const jsonSuccess = (
  context: WorkerContext,
  value: unknown,
  status: 200 | 201 | 202,
  cacheControl: string,
): Response => {
  context.header('cache-control', cacheControl);
  return context.body(JSON.stringify(value), status, {
    'content-type': 'application/json',
  });
};
