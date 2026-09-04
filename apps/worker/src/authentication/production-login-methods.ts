import {
  AuthorizationStartSchema,
  LoginMethodsResourceSchema,
} from '@wejammin/contracts';

import { authError } from './boundary';
import {
  asRecord,
  base64UrlEncode,
  bytea,
  expectedVersionValue,
  hashRequest,
  sha256Hex,
  traceFor,
  type AuthProductionConfiguration,
} from './production-configuration';
import { callRpc, mapProductionFailure } from './production-http';
import {
  FLOW_COOKIE,
  openFlowCookie,
  readCookie,
  sealFlowCookie,
  secureCookie,
} from './production-cookie';
import { enabledProvider } from './production-flows';
import type {
  AuthenticationDependencies,
  AuthenticationSession,
} from './types';

const sha256Base64Url = async (value: string): Promise<string> =>
  base64UrlEncode(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
    ),
  );

export const createAccountControlFlow = async (
  rpcName:
    'auth_login_method_link_intent_create' | 'auth_account_merge_proof_create',
  input: Readonly<{
    provider: string;
    returnTo: string;
    mergeId?: string;
    session: AuthenticationSession;
    idempotencyKey: string;
    ifMatch: string;
  }>,
  request: Request,
  config: AuthProductionConfiguration,
  signal: AbortSignal,
): Promise<
  Readonly<{
    resource: ReturnType<typeof AuthorizationStartSchema.parse>;
    cookie: string;
  }>
> => {
  const intent =
    rpcName === 'auth_account_merge_proof_create' ? 'prove_merge' : 'link';
  const sealed = readCookie(request, FLOW_COOKIE);
  const previous =
    sealed === null ? null : await openFlowCookie(sealed, config);
  const reusable =
    previous?.intent === intent &&
    previous.provider === input.provider &&
    previous.authUserId === input.session.authUserId &&
    previous.sessionId === input.session.sessionId &&
    previous.mergeId === input.mergeId
      ? previous
      : null;
  const state = reusable?.state ?? base64UrlEncode(config.randomBytes(32));
  const nonce = reusable?.nonce ?? base64UrlEncode(config.randomBytes(32));
  const verifier =
    reusable?.verifier ?? base64UrlEncode(config.randomBytes(64));
  const expiresAt =
    reusable?.expiresAt ??
    new Date(config.now() + 10 * 60 * 1000).toISOString();
  const trace = traceFor(request);
  const requestPayload =
    input.mergeId === undefined
      ? {
          provider: input.provider,
          returnTo: input.returnTo,
          ifMatch: input.ifMatch,
        }
      : {
          mergeId: input.mergeId,
          provider: input.provider,
          returnTo: input.returnTo,
          ifMatch: input.ifMatch,
        };
  const created = asRecord(
    await callRpc(
      config,
      rpcName,
      {
        p_auth_user_id: input.session.authUserId,
        p_session_id: input.session.sessionId,
        ...(input.mergeId === undefined ? {} : { p_merge_id: input.mergeId }),
        p_provider: input.provider,
        p_return_path: input.returnTo,
        p_state_digest: bytea(await sha256Hex(state)),
        p_nonce_digest: bytea(await sha256Hex(nonce)),
        p_pkce_verifier_digest: bytea(await sha256Hex(verifier)),
        p_expires_at: expiresAt,
        p_expected_version: expectedVersionValue(input.ifMatch),
        p_key_hash: await hashRequest(input.idempotencyKey),
        p_request_hash: await hashRequest(requestPayload),
        p_request_id: trace.requestId,
        p_correlation_id: trace.correlationId,
      },
      signal,
    ),
  );
  if (
    created === null ||
    typeof created.intentId !== 'string' ||
    typeof created.expiresAt !== 'string'
  ) {
    throw authError(
      502,
      'DEPENDENCY_INVALID_RESPONSE',
      'Authentication persistence returned an invalid response.',
    );
  }
  if (created.replayed === true && reusable === null) {
    throw authError(
      409,
      'IDEMPOTENCY_REPLAY_UNAVAILABLE',
      'Retry from the original browser session or start a new request.',
    );
  }
  const callback = new URL('/auth/callback', request.url);
  callback.searchParams.set('state', state);
  const authorization = new URL(`${config.baseUrl}/auth/v1/authorize`);
  authorization.searchParams.set('provider', input.provider);
  authorization.searchParams.set('redirect_to', callback.toString());
  authorization.searchParams.set(
    'code_challenge',
    await sha256Base64Url(verifier),
  );
  authorization.searchParams.set('code_challenge_method', 's256');
  authorization.searchParams.set('state', state);
  authorization.searchParams.set('nonce', nonce);
  const resource = AuthorizationStartSchema.parse({
    authorizationUrl: authorization.toString(),
    expiresAt: created.expiresAt,
    intentId: created.intentId,
  });
  const flow = {
    state,
    nonce,
    verifier,
    provider: input.provider,
    intent,
    expiresAt,
    authUserId: input.session.authUserId,
    sessionId: input.session.sessionId,
    ...(input.mergeId === undefined ? {} : { mergeId: input.mergeId }),
  } as const;
  return {
    resource,
    cookie: secureCookie(FLOW_COOKIE, await sealFlowCookie(flow, config), 600),
  };
};

export const createLoginMethodDependencies = (
  config: AuthProductionConfiguration,
): Pick<
  AuthenticationDependencies,
  'readLoginMethods' | 'startLoginMethodLink' | 'unlinkLoginMethod'
> => ({
  readLoginMethods: async (input, _env, signal) => {
    try {
      const trace = traceFor(input.request);
      const result = await callRpc(
        config,
        'auth_login_methods_read',
        {
          p_auth_user_id: input.session.authUserId,
          p_session_id: input.session.sessionId,
          p_request_id: trace.requestId,
          p_correlation_id: trace.correlationId,
        },
        signal,
      );
      const parsed = LoginMethodsResourceSchema.safeParse(result);
      return parsed.success
        ? { ok: true, value: parsed.data }
        : authError(
            502,
            'DEPENDENCY_INVALID_RESPONSE',
            'Authentication persistence returned an invalid response.',
          );
    } catch (error) {
      return mapProductionFailure(error);
    }
  },

  startLoginMethodLink: async (input, _env, signal) => {
    try {
      const available = await enabledProvider(input.provider, config, signal);
      if (!available.ok) return available;
      const flow = await createAccountControlFlow(
        'auth_login_method_link_intent_create',
        input,
        input.request,
        config,
        signal,
      );
      return {
        ok: true,
        value: { resource: flow.resource, cookies: [flow.cookie] },
      };
    } catch (error) {
      return mapProductionFailure(error);
    }
  },

  unlinkLoginMethod: async (input, _env, signal) => {
    try {
      const trace = traceFor(input.request);
      const result = await callRpc(
        config,
        'auth_login_method_unlink',
        {
          p_auth_user_id: input.session.authUserId,
          p_session_id: input.session.sessionId,
          p_identity_id: input.identityId,
          p_reason: input.reason,
          p_expected_version: expectedVersionValue(input.ifMatch),
          p_key_hash: await hashRequest(input.idempotencyKey),
          p_request_hash: await hashRequest({
            identityId: input.identityId,
            reason: input.reason,
            ifMatch: input.ifMatch,
          }),
          p_request_id: trace.requestId,
          p_correlation_id: trace.correlationId,
        },
        signal,
      );
      const parsed = LoginMethodsResourceSchema.safeParse(result);
      return parsed.success
        ? { ok: true, value: parsed.data }
        : authError(
            502,
            'DEPENDENCY_INVALID_RESPONSE',
            'Authentication persistence returned an invalid response.',
          );
    } catch (error) {
      return mapProductionFailure(error);
    }
  },
});
