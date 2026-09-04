import {
  createCorrelationId,
  createRequestId,
  RequestContextSchema,
} from '@wejammin/contracts';

import type {
  AuthenticationDependencies,
  AuthenticationSession,
} from '../authentication/types';
import type { WorkerBindings, WorkerDependencies } from '../index';

type CapabilityResolver = (
  session: AuthenticationSession,
  request: Request,
  env: WorkerBindings,
  signal: AbortSignal,
) => ReadonlyArray<string> | Promise<ReadonlyArray<string>>;

/**
 * Build the request context from the already verified server session.  The
 * optional capability resolver is a trusted deployment seam; no request
 * header is read as an identity or capability claim.
 */
export const createProductionRequestContextResolver =
  (
    auth: Pick<AuthenticationDependencies, 'resolveSession'>,
    resolveCapabilities?: CapabilityResolver,
  ): NonNullable<WorkerDependencies['resolveRequestContext']> =>
  async (request, env, signal, verifiedSession) => {
    const controller = signal === undefined ? new AbortController() : undefined;
    const effectiveSignal = signal ?? controller!.signal;
    const resolved =
      verifiedSession === undefined
        ? await auth.resolveSession(request, env, effectiveSignal)
        : { ok: true as const, value: verifiedSession };
    if (!resolved.ok) return null;
    const capabilities =
      resolveCapabilities === undefined
        ? []
        : await resolveCapabilities(
            resolved.value,
            request,
            env,
            effectiveSignal,
          );
    const requestId = createRequestId(
      request.headers.get('x-request-id') ?? undefined,
    );
    const correlationId = createCorrelationId(
      request.headers.get('x-correlation-id') ?? requestId,
      requestId,
    );
    return RequestContextSchema.parse({
      requestId,
      correlationId,
      causationId: null,
      traceId: `worker-${requestId}`,
      userId: resolved.value.authUserId,
      actingPartyId: resolved.value.actingPartyId,
      capabilities,
      locale: 'en-US',
      clientVersion: 'worker',
    });
  };
