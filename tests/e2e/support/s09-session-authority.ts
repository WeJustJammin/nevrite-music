const SESSION_SIGNING_SECRET = 's09-real-route-session-secret';

export const isLocalSessionId = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^80000000-0000-4000-8000-[0-9a-f]{12}$/u.test(value);

const cookieValue = (request: Request, name: string): string | null => {
  const cookie = request.headers.get('cookie') ?? '';
  for (const part of cookie.split(';')) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf('=');
    if (separator > 0 && trimmed.slice(0, separator) === name)
      return trimmed.slice(separator + 1);
  }
  return null;
};

const decodeBase64Url = (value: string): Uint8Array | null => {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) return null;
  try {
    const padded =
      value.replace(/-/gu, '+').replace(/_/gu, '/') +
      '='.repeat((4 - (value.length % 4)) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
};

/** Create a local-only authority verifier for the production-route harness. */
export const createSessionVerifier = (
  expectedUserId: string,
  revokedSessionIds: ReadonlySet<string>,
): ((request: Request) => Promise<boolean>) => {
  const signingKey = crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SESSION_SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  return async (request: Request): Promise<boolean> => {
    if (cookieValue(request, 'wj_session_ref') === null) return false;
    const token = cookieValue(request, 'wj_access');
    if (token === null) return false;
    const parts = token.split('.');
    if (parts.length !== 3 || parts[0] === undefined || parts[1] === undefined)
      return false;
    const encodedHeader = decodeBase64Url(parts[0]);
    const encodedPayload = decodeBase64Url(parts[1]);
    const encodedSignature = decodeBase64Url(parts[2] ?? '');
    if (
      encodedHeader === null ||
      encodedPayload === null ||
      encodedSignature === null
    )
      return false;
    try {
      const header = JSON.parse(new TextDecoder().decode(encodedHeader)) as {
        alg?: unknown;
        typ?: unknown;
      };
      const payload = JSON.parse(new TextDecoder().decode(encodedPayload)) as {
        exp?: unknown;
        session_id?: unknown;
        sub?: unknown;
      };
      if (header.alg !== 'HS256' || header.typ !== 'JWT') return false;
      if (
        payload.sub !== expectedUserId ||
        !isLocalSessionId(payload.session_id) ||
        typeof payload.exp !== 'number' ||
        !Number.isSafeInteger(payload.exp) ||
        payload.exp <= Math.floor(Date.now() / 1_000) ||
        revokedSessionIds.has(payload.session_id)
      )
        return false;
      return await crypto.subtle.verify(
        'HMAC',
        await signingKey,
        encodedSignature,
        new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
      );
    } catch {
      return false;
    }
  };
};
