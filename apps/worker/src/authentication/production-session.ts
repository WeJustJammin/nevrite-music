import { SessionResourceSchema } from '@wejammin/contracts';

import { authError } from './boundary';
import {
  asRecord,
  traceFor,
  type AuthProductionConfiguration,
} from './production-configuration';
import { callAuthJson, callRpc, mapProductionFailure } from './production-http';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  SESSION_REF_COOKIE,
  openFlowCookie,
  readCookie,
  sessionCookies,
} from './production-cookie';
import { verifyTokenResponse } from './production-token';
import type {
  AuthenticationDependencies,
  AuthenticationResult,
  AuthenticationSession,
} from './types';

const sessionProjection = (
  value: unknown,
  token: Pick<AuthenticationSession, 'expiresAt'>,
): AuthenticationResult<ReturnType<typeof SessionResourceSchema.parse>> => {
  const candidate = asRecord(value);
  const parsed = SessionResourceSchema.safeParse({
    authenticated: true,
    accountState: candidate?.accountState ?? null,
    bootstrapState: candidate?.bootstrapState ?? 'required',
    personId: candidate?.personId ?? null,
    actingPartyId: candidate?.actingPartyId ?? null,
    sessionExpiresAt: token.expiresAt,
  });
  return parsed.success
    ? { ok: true, value: parsed.data }
    : authError(
        502,
        'DEPENDENCY_INVALID_RESPONSE',
        'Authentication persistence returned an invalid response.',
      );
};

const readIndexedSession = async (
  authUserId: string,
  sessionId: string,
  expiresAt: string,
  config: AuthProductionConfiguration,
  signal: AbortSignal,
) => {
  const projection = await callRpc(
    config,
    'auth_session_read',
    { p_auth_user_id: authUserId, p_session_id: sessionId },
    signal,
  );
  return sessionProjection(projection, { expiresAt });
};

export const createSessionDependencies = (
  config: AuthProductionConfiguration,
): Pick<
  AuthenticationDependencies,
  'resolveSession' | 'readSession' | 'refreshSession'
> => ({
  resolveSession: async (request, _env, signal) => {
    try {
      if (new URL(request.url).pathname === '/api/v1/auth/session/refresh') {
        const sealed = readCookie(request, SESSION_REF_COOKIE);
        const reference =
          sealed === null ? null : await openFlowCookie(sealed, config);
        if (reference === null || reference.provider !== 'session') {
          return authError(
            401,
            'UNAUTHENTICATED',
            'The authentication session is invalid.',
          );
        }
        const indexed = await readIndexedSession(
          reference.nonce,
          reference.state,
          new Date(config.now() + 60_000).toISOString(),
          config,
          signal,
        );
        if (!indexed.ok) return indexed;
        return {
          ok: true,
          value: {
            authUserId: reference.nonce,
            sessionId: reference.state,
            accountState: indexed.value.accountState,
            personId: indexed.value.personId,
            actingPartyId: indexed.value.actingPartyId,
            expiresAt: indexed.value.sessionExpiresAt,
            stepUpAt: null,
          },
        };
      }
      const accessToken = readCookie(request, ACCESS_COOKIE);
      const sealedReference = readCookie(request, SESSION_REF_COOKIE);
      const sessionReference =
        sealedReference === null
          ? null
          : await openFlowCookie(sealedReference, config);
      if (accessToken === null || sessionReference?.provider !== 'session') {
        return authError(
          401,
          'UNAUTHENTICATED',
          'The authentication session is invalid.',
        );
      }
      const verified = await verifyTokenResponse(
        { access_token: accessToken, refresh_token: 'server-cookie' },
        config,
        signal,
      );
      if (!verified.ok) return verified;
      if (
        sessionReference.nonce !== verified.value.authUserId ||
        sessionReference.state !== verified.value.sessionId
      ) {
        return authError(
          401,
          'UNAUTHENTICATED',
          'The authentication session is invalid.',
        );
      }
      const indexed = await readIndexedSession(
        verified.value.authUserId,
        verified.value.sessionId,
        verified.value.expiresAt,
        config,
        signal,
      );
      if (!indexed.ok) return indexed;
      return {
        ok: true,
        value: {
          authUserId: verified.value.authUserId,
          sessionId: verified.value.sessionId,
          accountState: indexed.value.accountState,
          personId: indexed.value.personId,
          actingPartyId: indexed.value.actingPartyId,
          expiresAt: verified.value.expiresAt,
          stepUpAt:
            sessionReference.verifier !== '' &&
            Number.isFinite(Date.parse(sessionReference.verifier)) &&
            Date.parse(sessionReference.verifier) <= config.now() + 30_000
              ? sessionReference.verifier
              : null,
        },
      };
    } catch (error) {
      return mapProductionFailure(error);
    }
  },

  readSession: async (session) => ({
    ok: true,
    value: SessionResourceSchema.parse({
      authenticated: true,
      accountState: session.accountState,
      bootstrapState: session.personId === null ? 'required' : 'complete',
      personId: session.personId,
      actingPartyId: session.actingPartyId,
      sessionExpiresAt: session.expiresAt,
    }),
  }),

  refreshSession: async (request, _env, signal) => {
    try {
      const refreshToken = readCookie(request, REFRESH_COOKIE);
      const sealedReference = readCookie(request, SESSION_REF_COOKIE);
      const sessionReference =
        sealedReference === null
          ? null
          : await openFlowCookie(sealedReference, config);
      if (refreshToken === null || sessionReference?.provider !== 'session') {
        return authError(
          401,
          'UNAUTHENTICATED',
          'The authentication session is invalid.',
        );
      }
      const payload = await callAuthJson(
        config,
        '/auth/v1/token?grant_type=refresh_token',
        {
          method: 'POST',
          signal,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        },
      );
      const token = await verifyTokenResponse(payload, config, signal);
      if (!token.ok) return token;
      if (
        sessionReference.nonce !== token.value.authUserId ||
        sessionReference.state !== token.value.sessionId
      ) {
        return authError(
          401,
          'UNAUTHENTICATED',
          'The authentication session is invalid.',
        );
      }
      const preservedToken = {
        ...token.value,
        stepUpAt:
          sessionReference.verifier !== '' &&
          Number.isFinite(Date.parse(sessionReference.verifier)) &&
          Date.parse(sessionReference.verifier) <= config.now() + 30_000
            ? sessionReference.verifier
            : null,
      };
      const trace = traceFor(request);
      await callRpc(
        config,
        'auth_session_register',
        {
          p_auth_user_id: token.value.authUserId,
          p_session_id: token.value.sessionId,
          p_issued_at: new Date(config.now()).toISOString(),
          p_request_id: trace.requestId,
          p_correlation_id: trace.correlationId,
        },
        signal,
      );
      const indexed = await readIndexedSession(
        token.value.authUserId,
        token.value.sessionId,
        token.value.expiresAt,
        config,
        signal,
      );
      if (!indexed.ok) return indexed;
      return {
        ok: true,
        value: {
          resource: indexed.value,
          cookies: await sessionCookies(preservedToken, config),
        },
      };
    } catch (error) {
      return mapProductionFailure(error);
    }
  },
});
