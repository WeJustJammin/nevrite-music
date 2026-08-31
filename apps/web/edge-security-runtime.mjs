/**
 * Runtime shared by Astro middleware and the generated Cloudflare entry.
 *
 * The generated adapter checks static assets before Astro middleware. The
 * build integration copies this module beside that entry so one outer fetch
 * boundary can protect dynamic pages, ASSETS responses, and fallback assets.
 */

import { rewriteHtmlTags } from './edge-security-html.mjs';

const HSTS_VALUE = 'max-age=63072000; includeSubDomains';
const PERMISSIONS_POLICY_VALUE =
  'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), publickey-credentials-get=(self)';

export const generateRequestNonce = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
};

export const createContentSecurityPolicy = (nonce) =>
  `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'nonce-${nonce}'; img-src 'self' data: blob: https://*.supabase.co; media-src 'self' blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.provider-native diagnostics.io; frame-src 'none'; worker-src 'self' blob:; manifest-src 'self'; upgrade-insecure-requests; report-to csp-endpoint`;

export const createSecurityHeaders = (nonce) => ({
  'content-security-policy': createContentSecurityPolicy(nonce),
  'strict-transport-security': HSTS_VALUE,
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': PERMISSIONS_POLICY_VALUE,
});

export const applySecurityHeaders = (
  response,
  nonce = generateRequestNonce(),
) => {
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

const isLoopbackHostname = (hostname) => {
  if (hostname === 'localhost' || hostname === '::1' || hostname === '[::1]') {
    return true;
  }

  const octets = hostname.split('.');
  return (
    octets.length === 4 &&
    octets[0] === '127' &&
    octets.every((octet) => {
      if (!/^\d+$/u.test(octet)) return false;
      const value = Number(octet);
      return value >= 0 && value <= 255;
    })
  );
};

/** Deployed hostnames must use HTTPS; local Astro dev servers may use HTTP. */
export const shouldRedirectToHttps = (request) => {
  const url = new URL(request.url);
  return url.protocol === 'http:' && !isLoopbackHostname(url.hostname);
};

export const createHttpsRedirectResponse = (request) => {
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

const createResponseWithHeaders = (response, headers) =>
  new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });

const createInternalServerErrorResponse = () =>
  new Response('Internal Server Error', {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/plain; charset=utf-8',
    },
    status: 500,
  });

const transformWithCloudflareHtmlRewriter = (response, headers, nonce) => {
  const HTMLRewriter = Reflect.get(globalThis, 'HTMLRewriter');
  if (typeof HTMLRewriter !== 'function') return null;

  const setNonce = {
    element(element) {
      element.setAttribute('nonce', nonce);
    },
  };

  return new HTMLRewriter()
    .on('script', setNonce)
    .on('style', setNonce)
    .transform(createResponseWithHeaders(response, headers));
};

/**
 * Adds security headers to any Astro response and nonce-tags generated HTML.
 * The Cloudflare HTMLRewriter path preserves streaming; the conservative
 * parser is used only where that edge primitive is unavailable.
 */
export const withSecurityHeaders = async (response, nonce) => {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(createSecurityHeaders(nonce))) {
    headers.set(name, value);
  }

  const contentType = headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('text/html')) {
    return createResponseWithHeaders(response, headers);
  }

  headers.delete('content-length');
  const rewritten = transformWithCloudflareHtmlRewriter(
    response,
    headers,
    nonce,
  );
  if (rewritten) return rewritten;

  const html = rewriteHtmlTags(await response.text(), nonce);
  return new Response(html, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
};

/**
 * Wraps the generated Astro adapter fetch. This runs before adapter routing
 * (including ASSETS.fetch) and applies the same policy to every response.
 */
export const createEdgeFetchHandler =
  (handler) => async (request, env, context) => {
    const nonce = generateRequestNonce();
    if (shouldRedirectToHttps(request)) {
      return await withSecurityHeaders(
        createHttpsRedirectResponse(request),
        nonce,
      );
    }

    try {
      return await withSecurityHeaders(
        await handler(request, env, context),
        nonce,
      );
    } catch {
      return await withSecurityHeaders(
        createInternalServerErrorResponse(),
        nonce,
      );
    }
  };
