import {
  authDecoder,
  authEncoder,
  base64UrlDecode,
  base64UrlEncode,
  sha256Hex,
  type AuthFlowCookie,
  type AuthProductionConfiguration,
  type VerifiedAuthToken,
} from './production-configuration';

export const FLOW_COOKIE = 'wj_auth_flow';
export const SESSION_REF_COOKIE = 'wj_session_ref';
export const ACCESS_COOKIE = 'wj_access';
export const REFRESH_COOKIE = 'wj_refresh';
export const CSRF_COOKIE = 'wj_csrf';

const flowKey = async (secret: string): Promise<CryptoKey> => {
  const material = await crypto.subtle.digest(
    'SHA-256',
    authEncoder.encode(`wejammin-auth-flow-v1\u0000${secret}`),
  );
  return crypto.subtle.importKey('raw', material, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
};

export const sealFlowCookie = async (
  flow: AuthFlowCookie,
  config: AuthProductionConfiguration,
): Promise<string> => {
  const iv = config.randomBytes(12);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await flowKey(config.secret),
    authEncoder.encode(JSON.stringify(flow)),
  );
  return `${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(ciphertext))}`;
};

export const openFlowCookie = async (
  value: string,
  config: AuthProductionConfiguration,
): Promise<AuthFlowCookie | null> => {
  try {
    const [iv, ciphertext, extra] = value.split('.');
    if (iv === undefined || ciphertext === undefined || extra !== undefined)
      return null;
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64UrlDecode(iv) },
      await flowKey(config.secret),
      base64UrlDecode(ciphertext),
    );
    const parsed = JSON.parse(
      authDecoder.decode(plaintext),
    ) as Partial<AuthFlowCookie>;
    if (
      typeof parsed.state !== 'string' ||
      typeof parsed.nonce !== 'string' ||
      typeof parsed.verifier !== 'string' ||
      typeof parsed.provider !== 'string' ||
      typeof parsed.intent !== 'string' ||
      typeof parsed.expiresAt !== 'string' ||
      (parsed.authUserId !== undefined &&
        typeof parsed.authUserId !== 'string') ||
      (parsed.sessionId !== undefined &&
        typeof parsed.sessionId !== 'string') ||
      (parsed.mergeId !== undefined && typeof parsed.mergeId !== 'string') ||
      Date.parse(parsed.expiresAt) <= config.now()
    )
      return null;
    return parsed as AuthFlowCookie;
  } catch {
    return null;
  }
};

export const readCookie = (request: Request, name: string): string | null =>
  request.headers
    .get('cookie')
    ?.split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1) ?? null;

export const secureCookie = (
  name: string,
  value: string,
  maxAge: number,
): string =>
  `${name}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`;

const csrfCookie = (value: string, maxAge: number): string =>
  `${CSRF_COOKIE}=${value}; Max-Age=${maxAge}; Path=/; Secure; SameSite=Lax`;

export const clearAuthCookies = (): readonly string[] => [
  secureCookie(FLOW_COOKIE, '', 0),
  secureCookie(SESSION_REF_COOKIE, '', 0),
  secureCookie(ACCESS_COOKIE, '', 0),
  secureCookie(REFRESH_COOKIE, '', 0),
  csrfCookie('', 0),
];

export const sessionCookies = async (
  token: VerifiedAuthToken,
  config: AuthProductionConfiguration,
): Promise<readonly string[]> => {
  const maxAge = Math.max(
    1,
    Math.floor((Date.parse(token.expiresAt) - config.now()) / 1000),
  );
  const sessionRef = await sealFlowCookie(
    {
      state: token.sessionId,
      nonce: token.authUserId,
      verifier: token.stepUpAt ?? '',
      provider: 'session',
      intent: 'session',
      expiresAt: new Date(
        config.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    config,
  );
  const csrfRandom = base64UrlEncode(config.randomBytes(24));
  const csrfToken = `${csrfRandom}.${await sha256Hex(
    `${sessionRef}\u0000${csrfRandom}`,
  )}`;
  return [
    secureCookie(ACCESS_COOKIE, token.accessToken, maxAge),
    secureCookie(REFRESH_COOKIE, token.refreshToken, 30 * 24 * 60 * 60),
    secureCookie(SESSION_REF_COOKIE, sessionRef, 30 * 24 * 60 * 60),
    csrfCookie(csrfToken, 30 * 24 * 60 * 60),
    secureCookie(FLOW_COOKIE, '', 0),
  ];
};
