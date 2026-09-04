import {
  AuthCallbackQuerySchema,
  ProviderCatalogSchema,
} from '@wejammin/contracts';

import { authError } from './boundary';
import {
  asRecord,
  bytea,
  sha256Hex,
  traceFor,
  type AuthProductionConfiguration,
} from './production-configuration';
import { callAuthJson, callRpc, mapProductionFailure } from './production-http';
import {
  FLOW_COOKIE,
  openFlowCookie,
  readCookie,
  secureCookie,
  sessionCookies,
} from './production-cookie';
import {
  createAuthFlow,
  validateReturnPath,
  verifyTokenResponse,
} from './production-token';
import type { AuthenticationDependencies, AuthenticationResult } from './types';

export const enabledProvider = async (
  provider: string,
  config: AuthProductionConfiguration,
  signal: AbortSignal,
): Promise<AuthenticationResult<true>> => {
  if (provider === 'email') {
    return authError(
      422,
      'PROVIDER_NOT_AVAILABLE',
      'The selected provider is not available.',
    );
  }
  const catalog = ProviderCatalogSchema.safeParse(
    await callRpc(config, 'auth_provider_catalog', {}, signal),
  );
  if (!catalog.success) {
    return authError(
      502,
      'DEPENDENCY_INVALID_RESPONSE',
      'The provider registry returned an invalid response.',
    );
  }
  return catalog.data.providers.some(
    (entry) => entry.code === provider && entry.state === 'enabled',
  )
    ? { ok: true, value: true }
    : authError(
        422,
        'PROVIDER_NOT_AVAILABLE',
        'The selected provider is not available.',
      );
};

const failCallback = async (
  flowState: string,
  reason: 'PROVIDER_ERROR' | 'PROVIDER_EXCHANGE_FAILED' | 'TOKEN_INVALID',
  request: Request,
  config: AuthProductionConfiguration,
  signal: AbortSignal,
) => {
  const trace = traceFor(request);
  await callRpc(
    config,
    'auth_callback_fail',
    {
      p_state_digest: bytea(await sha256Hex(flowState)),
      p_reason: reason,
      p_request_id: trace.requestId,
      p_correlation_id: trace.correlationId,
    },
    signal,
  );
  return {
    ok: true as const,
    value: {
      location: '/auth/sign-in?result=failed',
      cookies: [secureCookie(FLOW_COOKIE, '', 0)],
    },
  };
};

export const createAuthenticationFlowDependencies = (
  config: AuthProductionConfiguration,
): Pick<
  AuthenticationDependencies,
  'startEmail' | 'startOAuth' | 'completeCallback'
> => ({
  startEmail: async (input, request, _env, signal) => {
    try {
      const flow = await createAuthFlow(
        { provider: 'email', intent: input.intent, returnTo: input.returnTo },
        request,
        null,
        config,
        signal,
      );
      const callback = new URL('/auth/callback', request.url);
      callback.searchParams.set('state', flow.state);
      await callAuthJson(config, '/auth/v1/otp', {
        method: 'POST',
        signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: input.email,
          create_user: input.intent === 'sign_in',
          options: { email_redirect_to: callback.toString() },
        }),
      });
      return {
        ok: true,
        value: { resource: { accepted: true }, cookies: [flow.cookie] },
      };
    } catch (error) {
      return mapProductionFailure(error);
    }
  },

  startOAuth: async (input, session, request, _env, signal) => {
    try {
      if (input.intent !== 'sign_in' || session !== null) {
        return authError(
          400,
          'INVALID_REQUEST',
          'Use the account-control endpoint for link or duplicate proof.',
        );
      }
      const available = await enabledProvider(input.provider, config, signal);
      if (!available.ok) return available;
      const flow = await createAuthFlow(
        input,
        request,
        session,
        config,
        signal,
      );
      const callback = new URL('/auth/callback', request.url);
      callback.searchParams.set('state', flow.state);
      const authorization = new URL(`${config.baseUrl}/auth/v1/authorize`);
      authorization.searchParams.set('provider', input.provider);
      authorization.searchParams.set('redirect_to', callback.toString());
      authorization.searchParams.set('code_challenge', flow.challenge);
      authorization.searchParams.set('code_challenge_method', 's256');
      authorization.searchParams.set('state', flow.state);
      authorization.searchParams.set('nonce', flow.nonce);
      return {
        ok: true,
        value: {
          resource: {
            authorizationUrl: authorization.toString(),
            expiresAt: flow.expiresAt,
            intentId: flow.intentId,
          },
          cookies: [flow.cookie],
        },
      };
    } catch (error) {
      return mapProductionFailure(error);
    }
  },

  completeCallback: async (input, request, _env, signal) => {
    try {
      const parsedInput = AuthCallbackQuerySchema.parse(input);
      const sealed = readCookie(request, FLOW_COOKIE);
      const flow =
        sealed === null ? null : await openFlowCookie(sealed, config);
      if (flow === null || flow.state !== parsedInput.state) {
        return authError(
          400,
          'AUTH_CALLBACK_INVALID',
          'The authentication callback is invalid.',
        );
      }
      if (parsedInput.code === undefined) {
        const failed = await failCallback(
          flow.state,
          'PROVIDER_ERROR',
          request,
          config,
          signal,
        );
        return failed;
      }
      let tokenPayload: unknown;
      try {
        tokenPayload = await callAuthJson(
          config,
          '/auth/v1/token?grant_type=pkce',
          {
            method: 'POST',
            signal,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              auth_code: parsedInput.code,
              code_verifier: flow.verifier,
            }),
          },
        );
      } catch {
        const failed = await failCallback(
          flow.state,
          'PROVIDER_EXCHANGE_FAILED',
          request,
          config,
          signal,
        );
        return failed;
      }
      const token = await verifyTokenResponse(
        tokenPayload,
        config,
        signal,
        flow.nonce,
        flow.provider,
      );
      if (!token.ok) {
        const failed = await failCallback(
          flow.state,
          'TOKEN_INVALID',
          request,
          config,
          signal,
        );
        return failed;
      }
      const trace = traceFor(request);
      const accountControl =
        flow.intent === 'link' || flow.intent === 'prove_merge';
      if (accountControl && token.value.providerSubjectDigest === null) {
        return authError(
          502,
          'PROVIDER_INVALID_RESPONSE',
          'The authentication provider returned an invalid response.',
        );
      }
      const callbackRpc =
        flow.intent === 'link'
          ? 'auth_login_method_link_callback_complete'
          : flow.intent === 'prove_merge'
            ? 'auth_account_merge_proof_callback_complete'
            : 'auth_callback_complete';
      const completed = asRecord(
        await callRpc(
          config,
          callbackRpc,
          accountControl
            ? {
                p_state_digest: bytea(await sha256Hex(flow.state)),
                p_provider: flow.provider,
                p_callback_auth_user_id: token.value.authUserId,
                p_provider_subject_digest: token.value.providerSubjectDigest,
                p_request_id: trace.requestId,
                p_correlation_id: trace.correlationId,
              }
            : {
                p_state_digest: bytea(await sha256Hex(flow.state)),
                p_auth_user_id: token.value.authUserId,
                p_session_id: token.value.sessionId,
                p_session_expires_at: token.value.expiresAt,
                p_request_id: trace.requestId,
                p_correlation_id: trace.correlationId,
              },
          signal,
        ),
      );
      const location = validateReturnPath(completed?.returnPath);
      if (location === null) {
        return authError(
          502,
          'DEPENDENCY_INVALID_RESPONSE',
          'Authentication persistence returned an invalid response.',
        );
      }
      return {
        ok: true,
        value: {
          location,
          cookies: accountControl
            ? [secureCookie(FLOW_COOKIE, '', 0)]
            : await sessionCookies(token.value, config),
        },
      };
    } catch (error) {
      return mapProductionFailure(error);
    }
  },
});
