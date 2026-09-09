import {
  verifyStaging as verifyStagingImplementation,
  verifyStagingWithRetries as verifyStagingWithRetriesImplementation,
} from '../infra/verify-staging.mjs';

const requestNonce = '0123456789abcdefghijkl';
export const expectedRelease = 'a'.repeat(40);
const expectedSecurityHeaders = {
  'content-security-policy': `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'nonce-${requestNonce}' 'strict-dynamic'; style-src 'self' 'nonce-${requestNonce}'; img-src 'self' data: blob: https://*.supabase.co; media-src 'self' blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.provider-native diagnostics.io; frame-src 'none'; worker-src 'self' blob:; manifest-src 'self'; upgrade-insecure-requests; report-to csp-endpoint`,
  'strict-transport-security': 'max-age=63072000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), publickey-credentials-get=(self)',
};

export const webHtml =
  '<!doctype html><html><head><title>WeJammin | Operational foundation</title></head><body><h1 id="page-title" tabindex="-1">WeJammin operational foundation</h1></body></html>';
export const webHtmlWithStaticAsset =
  '<!doctype html><html><head><title>WeJammin | Operational foundation</title><script type="module" src="/_astro/client.js"></script></head><body><h1 id="page-title" tabindex="-1">WeJammin operational foundation</h1></body></html>';

export const protectedHeaders = (extra: Record<string, string> = {}) => ({
  ...expectedSecurityHeaders,
  'x-wejammin-release': expectedRelease,
  ...extra,
});

export const webRuntimeRedirect = new Response(null, {
  headers: {
    ...protectedHeaders(),
    location: '/auth/sign-in?returnTo=%2Fapp%2Finfrastructure',
  },
  status: 303,
});

export const httpRedirect = (location: string) =>
  new Response(null, {
    headers: protectedHeaders({ location }),
    status: 308,
  });

export const webShellResponse = (html = webHtml) =>
  new Response(html, {
    headers: {
      ...protectedHeaders(),
      'content-type': 'text/html; charset=utf-8',
    },
    status: 200,
  });

export const apiHealthResponse = (
  body = {
    requestId: '11111111-1111-4111-8111-111111111111',
    service: 'wejammin-api',
    status: 'ok',
    version: 'v1',
  },
) =>
  Response.json(body, {
    headers: protectedHeaders(),
  });

export const verifyStaging = (
  options: Parameters<typeof verifyStagingImplementation>[0],
) => verifyStagingImplementation({ ...options, expectedRelease });

export const verifyStagingWithRetries = (
  options: Parameters<typeof verifyStagingWithRetriesImplementation>[0],
) => verifyStagingWithRetriesImplementation({ ...options, expectedRelease });
