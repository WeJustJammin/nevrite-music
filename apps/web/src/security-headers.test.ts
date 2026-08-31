import { describe, expect, it } from 'vitest';

import {
  applySecurityHeaders,
  createHttpsRedirectResponse,
  createEdgeFetchHandler,
  generateRequestNonce,
  shouldRedirectToHttps,
  withSecurityHeaders,
} from './security-headers';

describe('web edge security boundary', () => {
  it('applies the locked headers and a fresh nonce', () => {
    const nonce = generateRequestNonce();
    const response = applySecurityHeaders(new Response('ok'), nonce);

    expect(response.headers.get('strict-transport-security')).toBe(
      'max-age=63072000; includeSubDomains',
    );
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('referrer-policy')).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(response.headers.get('permissions-policy')).toBe(
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), publickey-credentials-get=(self)',
    );
    expect(response.headers.get('content-security-policy')).toContain(
      `'nonce-${nonce}'`,
    );
  });

  it('adds the nonce to Astro and React script/style tags in HTML responses', async () => {
    const nonce = '0123456789abcdefghijkl';
    const response = await withSecurityHeaders(
      new Response(
        '<html><head><style>.x{}</style></head><body><script>boot()</script><script nonce="keep">keep()</script></body></html>',
        { headers: { 'content-type': 'text/html; charset=utf-8' } },
      ),
      nonce,
    );

    const html = await response.text();
    expect(html).toContain(`<style nonce="${nonce}">`);
    expect(html).toContain(`<script nonce="${nonce}">boot()`);
    expect(html).toContain(`<script nonce="${nonce}">keep()`);
    expect(response.headers.get('content-security-policy')).toContain(
      `'nonce-${nonce}'`,
    );
    expect(response.headers.has('content-length')).toBe(false);
  });

  it('replaces mismatched nonces without rewriting script-like text', async () => {
    const nonce = 'request-nonce-123';
    const response = await withSecurityHeaders(
      new Response(
        '<script>const template = "<script data-literal=\\"yes\\">";</script><style data-note=">">.x{}</style>',
        { headers: { 'content-type': 'text/html; charset=utf-8' } },
      ),
      nonce,
    );

    const html = await response.text();
    expect(html).toContain(
      `<script nonce="${nonce}">const template = "<script data-literal=\\"yes\\">";</script>`,
    );
    expect(html).toContain(
      `<style nonce="${nonce}" data-note=">">.x{}</style>`,
    );
    expect(html).not.toContain('<script nonce="keep">');
    expect(html.match(/nonce="request-nonce-123"/gu)).toHaveLength(2);
  });

  it('secures static asset and fallback responses at the adapter boundary', async () => {
    let upstreamCalls = 0;
    const edgeFetch = createEdgeFetchHandler(async (request) => {
      upstreamCalls += 1;
      const isAsset = new URL(request.url).pathname.startsWith('/_astro/');
      return new Response(isAsset ? 'asset' : 'fallback', {
        status: isAsset ? 200 : 404,
        headers: {
          'content-type': isAsset
            ? 'application/javascript'
            : 'text/plain; charset=utf-8',
        },
      });
    });

    const asset = await edgeFetch(
      new Request('https://web.example.test/_astro/client.js'),
      {},
      {},
    );
    expect(asset.status).toBe(200);
    expect(await asset.text()).toBe('asset');
    expect(asset.headers.get('x-content-type-options')).toBe('nosniff');
    expect(asset.headers.get('x-frame-options')).toBe('DENY');
    expect(asset.headers.get('referrer-policy')).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(asset.headers.get('permissions-policy')).toBe(
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), publickey-credentials-get=(self)',
    );
    expect(asset.headers.get('strict-transport-security')).toBe(
      'max-age=63072000; includeSubDomains',
    );
    expect(asset.headers.get('content-security-policy')).toContain(
      "script-src 'self' 'nonce-",
    );

    const fallback = await edgeFetch(
      new Request('https://web.example.test/missing'),
      {},
      {},
    );
    expect(fallback.status).toBe(404);
    expect(await fallback.text()).toBe('fallback');
    expect(fallback.headers.get('x-content-type-options')).toBe('nosniff');

    const insecureAsset = await edgeFetch(
      new Request('http://web.example.test/_astro/client.js'),
      {},
      {},
    );
    expect(insecureAsset.status).toBe(308);
    expect(insecureAsset.headers.get('location')).toBe(
      'https://web.example.test/_astro/client.js',
    );
    expect(insecureAsset.headers.get('x-content-type-options')).toBe('nosniff');
    expect(upstreamCalls).toBe(2);
  });

  it('returns a protected generic error response when the adapter throws', async () => {
    const edgeFetch = createEdgeFetchHandler(async () => {
      throw new Error('adapter failure');
    });

    const response = await edgeFetch(
      new Request('https://web.example.test/failure'),
      {},
      {},
    );

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Internal Server Error');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('content-security-policy')).toContain(
      "default-src 'self'",
    );
  });

  it('returns a protected generic error response when HTML body rewriting rejects', async () => {
    const edgeFetch = createEdgeFetchHandler(async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.error(new Error('HTML body failure'));
        },
      });
      return new Response(stream, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    });

    const response = await edgeFetch(
      new Request('https://web.example.test/broken-html'),
      {},
      {},
    );

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Internal Server Error');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('redirects HTTP requests and leaves loopback development HTTP available', () => {
    const insecure = new Request('http://web.example.test/private?next=%2Fapp');
    expect(shouldRedirectToHttps(insecure)).toBe(true);
    const redirect = createHttpsRedirectResponse(insecure);
    expect(redirect.status).toBe(308);
    expect(redirect.headers.get('location')).toBe(
      'https://web.example.test/private?next=%2Fapp',
    );
    expect(
      shouldRedirectToHttps(new Request('https://web.example.test/')),
    ).toBe(false);
    expect(shouldRedirectToHttps(new Request('http://127.0.0.1:4321/'))).toBe(
      false,
    );
    expect(shouldRedirectToHttps(new Request('http://[::1]:4321/'))).toBe(
      false,
    );
  });
});
