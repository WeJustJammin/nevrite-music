/**
 * Edge response security policy shared by every Hono response path.
 *
 * The CSP nonce is generated per request. It is deliberately passed into this
 * module instead of being read from a global so tests and the web adapter can
 * prove that one nonce is used consistently for a response.
 */

const HSTS_VALUE = 'max-age=63072000; includeSubDomains';
const PERMISSIONS_POLICY_VALUE =
  'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), publickey-credentials-get=(self)';

export const generateRequestNonce = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
};

export const createContentSecurityPolicy = (nonce: string): string =>
  `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'nonce-${nonce}'; img-src 'self' data: blob: https://*.supabase.co; media-src 'self' blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.provider-native diagnostics.io; frame-src 'none'; worker-src 'self' blob:; manifest-src 'self'; upgrade-insecure-requests; report-to csp-endpoint`;

export const createSecurityHeaders = (
  nonce: string,
): Readonly<Record<string, string>> => ({
  'content-security-policy': createContentSecurityPolicy(nonce),
  'strict-transport-security': HSTS_VALUE,
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': PERMISSIONS_POLICY_VALUE,
});

/**
 * Applies headers by cloning the response. Cloning keeps this safe for Hono's
 * immutable redirect/error responses and preserves existing response headers.
 */
export const applySecurityHeaders = (
  response: Response,
  nonce: string = generateRequestNonce(),
): Response => {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(createSecurityHeaders(nonce))) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
};

const isLoopbackHostname = (hostname: string): boolean =>
  hostname === 'localhost' ||
  hostname === '::1' ||
  hostname === '[::1]' ||
  /^127(?:\.\d{1,3}){3}$/u.test(hostname);

/**
 * HTTP is redirected at the application edge. Loopback is intentionally
 * exempt so Astro/Hono local development can continue to use their HTTP dev
 * servers; all deployed hostnames are redirected.
 */
export const shouldRedirectToHttps = (request: Request): boolean => {
  const url = new URL(request.url);
  return url.protocol === 'http:' && !isLoopbackHostname(url.hostname);
};

export const createHttpsRedirectResponse = (request: Request): Response => {
  const location = new URL(request.url);
  location.protocol = 'https:';

  return new Response(null, {
    headers: {
      'cache-control': 'no-store',
      location: location.toString(),
    },
    status: 308,
  });
};
