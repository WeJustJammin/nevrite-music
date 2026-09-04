const SUPABASE_OPAQUE_SECRET_PREFIX = 'sb_secret_';

/**
 * Build headers for server-side Supabase REST RPC calls.
 *
 * Supabase's newer `sb_secret_` credentials are opaque API keys rather than
 * JWTs. Sending one as a Bearer token makes the gateway attempt JWT
 * validation and reject the otherwise valid API-key request. Legacy
 * service-role JWTs continue to receive the Bearer form for compatibility.
 */
export const supabaseRpcHeaders = (
  secret: string,
): Readonly<Record<string, string>> => ({
  apikey: secret,
  ...(secret.startsWith(SUPABASE_OPAQUE_SECRET_PREFIX)
    ? {}
    : { authorization: `Bearer ${secret}` }),
});
