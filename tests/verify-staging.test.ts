import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

import {
  verifyStaging,
  verifyStagingWithRetries,
} from '../infra/verify-staging.mjs';

const requestNonce = '0123456789abcdefghijkl';
const expectedSecurityHeaders = {
  'content-security-policy': `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'nonce-${requestNonce}' 'strict-dynamic'; style-src 'self' 'nonce-${requestNonce}'; img-src 'self' data: blob: https://*.supabase.co; media-src 'self' blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.provider-native diagnostics.io; frame-src 'none'; worker-src 'self' blob:; manifest-src 'self'; upgrade-insecure-requests; report-to csp-endpoint`,
  'strict-transport-security': 'max-age=63072000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), publickey-credentials-get=(self)',
};

const webHtml = `<!doctype html><html><head><title>WeJammin | Operational foundation</title></head><body><h1 id="page-title" tabindex="-1">WeJammin operational foundation</h1></body></html>`;
const webHtmlWithStaticAsset = `<!doctype html><html><head><title>WeJammin | Operational foundation</title><script type="module" src="/_astro/client.js"></script></head><body><h1 id="page-title" tabindex="-1">WeJammin operational foundation</h1></body></html>`;

const protectedHeaders = (extra: Record<string, string> = {}) => ({
  ...expectedSecurityHeaders,
  ...extra,
});

const webRuntimeRedirect = new Response(null, {
  headers: {
    ...protectedHeaders(),
    location: '/auth/sign-in?returnTo=%2Fapp%2Finfrastructure',
  },
  status: 303,
});

const httpRedirect = (location: string) =>
  new Response(null, {
    headers: protectedHeaders({ location }),
    status: 308,
  });

const webShellResponse = (html = webHtml) =>
  new Response(html, {
    headers: {
      ...protectedHeaders(),
      'content-type': 'text/html; charset=utf-8',
    },
    status: 200,
  });

const apiHealthResponse = (
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

describe('verifyStaging', () => {
  it('executes the staging verifier when invoked through a symlink', () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'wejammin-verify-staging-'));
    const verifierPath = fileURLToPath(
      new URL('../infra/verify-staging.mjs', import.meta.url),
    );
    const symlinkedVerifierPath = join(sandbox, 'verify-staging.mjs');
    const environment = { ...process.env };
    delete environment.STAGING_API_ORIGIN;
    delete environment.STAGING_WEB_ORIGIN;

    try {
      symlinkSync(verifierPath, symlinkedVerifierPath);
      const result = spawnSync(process.execPath, [symlinkedVerifierPath], {
        encoding: 'utf8',
        env: environment,
        timeout: 20_000,
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Invalid URL');
    } finally {
      rmSync(sandbox, { force: true, recursive: true });
    }
  }, 20_000);

  it('accepts the locked web and API health contracts', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(webShellResponse(webHtmlWithStaticAsset))
      .mockResolvedValueOnce(webRuntimeRedirect)
      .mockResolvedValueOnce(apiHealthResponse())
      .mockResolvedValueOnce(
        new Response('asset', {
          headers: protectedHeaders({
            'content-type': 'application/javascript',
          }),
          status: 200,
        }),
      )
      .mockResolvedValueOnce(httpRedirect('https://staging.example.com/'))
      .mockResolvedValueOnce(
        httpRedirect('https://api-staging.example.com/api/v1/health'),
      );

    await expect(
      verifyStaging({
        apiOrigin: 'https://api-staging.example.com',
        fetchImpl,
        webOrigin: 'https://staging.example.com',
      }),
    ).resolves.toEqual({
      apiStatus: 200,
      webRuntimeStatus: 303,
      webStatus: 200,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(6);
    expect(fetchImpl.mock.calls[4]?.[0]).toBe('http://staging.example.com/');
    expect(fetchImpl.mock.calls[5]?.[0]).toBe(
      'http://api-staging.example.com/api/v1/health',
    );
    expect(fetchImpl.mock.calls[4]?.[1]).toMatchObject({
      redirect: 'manual',
    });
    expect(fetchImpl.mock.calls[5]?.[1]).toMatchObject({
      redirect: 'manual',
    });
  });

  it('rejects an HTTP redirect missing a locked security header', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(webShellResponse(webHtmlWithStaticAsset))
      .mockResolvedValueOnce(webRuntimeRedirect)
      .mockResolvedValueOnce(apiHealthResponse())
      .mockResolvedValueOnce(
        new Response('asset', {
          headers: protectedHeaders({
            'content-type': 'application/javascript',
          }),
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          headers: protectedHeaders({
            location: 'https://staging.example.com/',
            'x-frame-options': 'SAMEORIGIN',
          }),
          status: 308,
        }),
      )
      .mockResolvedValueOnce(
        httpRedirect('https://api-staging.example.com/api/v1/health'),
      );

    await expect(
      verifyStaging({
        apiOrigin: 'https://api-staging.example.com',
        fetchImpl,
        webOrigin: 'https://staging.example.com',
      }),
    ).rejects.toThrow(
      'Staging web HTTP redirect security header x-frame-options mismatch',
    );
  });

  it('rejects a shell that does not disclose a static asset path', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(webShellResponse())
      .mockResolvedValueOnce(webRuntimeRedirect)
      .mockResolvedValueOnce(apiHealthResponse())
      .mockResolvedValueOnce(httpRedirect('https://staging.example.com/'))
      .mockResolvedValueOnce(
        httpRedirect('https://api-staging.example.com/api/v1/health'),
      );

    await expect(
      verifyStaging({
        apiOrigin: 'https://api-staging.example.com',
        fetchImpl,
        webOrigin: 'https://staging.example.com',
      }),
    ).rejects.toThrow('Staging web static asset discovery mismatch');
  });

  it('rejects a stale static shell that does not prove the SSR boundary', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(webShellResponse())
      .mockResolvedValueOnce(webShellResponse());

    await expect(
      verifyStaging({
        apiOrigin: 'https://api-staging.example.com',
        fetchImpl,
        webOrigin: 'https://staging.example.com',
      }),
    ).rejects.toThrow('Web SSR boundary mismatch');
  });

  it('rejects an unexpected API health contract', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(webShellResponse())
      .mockResolvedValueOnce(webRuntimeRedirect)
      .mockResolvedValueOnce(
        apiHealthResponse({ service: 'wrong-service', status: 'ok' }),
      );

    await expect(
      verifyStaging({
        apiOrigin: 'https://api-staging.example.com',
        fetchImpl,
        webOrigin: 'https://staging.example.com',
      }),
    ).rejects.toThrow('API health contract mismatch');
  });

  it('rejects the obsolete prefixed request identifier shape', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(webShellResponse())
      .mockResolvedValueOnce(webRuntimeRedirect)
      .mockResolvedValueOnce(
        apiHealthResponse({
          requestId: 'req_12345678',
          service: 'wejammin-api',
          status: 'ok',
          version: 'v1',
        }),
      );

    await expect(
      verifyStaging({
        apiOrigin: 'https://api-staging.example.com',
        fetchImpl,
        webOrigin: 'https://staging.example.com',
      }),
    ).rejects.toThrow('API health contract mismatch');
  });

  it('rejects a response with a non-locked security header value', async () => {
    const wrongHeaders = {
      ...protectedHeaders({ 'x-frame-options': 'SAMEORIGIN' }),
      'content-type': 'text/html; charset=utf-8',
    };
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(webHtml, { headers: wrongHeaders, status: 200 }),
      );

    await expect(
      verifyStaging({
        apiOrigin: 'https://api-staging.example.com',
        fetchImpl,
        webOrigin: 'https://staging.example.com',
      }),
    ).rejects.toThrow('Staging web security header x-frame-options mismatch');
  });

  it('rejects a static asset that is discoverable but not protected', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(webShellResponse(webHtmlWithStaticAsset))
      .mockResolvedValueOnce(webRuntimeRedirect)
      .mockResolvedValueOnce(apiHealthResponse())
      .mockResolvedValueOnce(
        new Response('asset', {
          headers: { 'content-type': 'application/javascript' },
          status: 200,
        }),
      );

    await expect(
      verifyStaging({
        apiOrigin: 'https://api-staging.example.com',
        fetchImpl,
        webOrigin: 'https://staging.example.com',
      }),
    ).rejects.toThrow(
      'Staging static web asset security header content-security-policy mismatch',
    );
  });

  it('rejects a cleartext probe that does not return a permanent redirect', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(webShellResponse(webHtmlWithStaticAsset))
      .mockResolvedValueOnce(webRuntimeRedirect)
      .mockResolvedValueOnce(apiHealthResponse())
      .mockResolvedValueOnce(
        new Response('asset', {
          headers: protectedHeaders({
            'content-type': 'application/javascript',
          }),
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response('cleartext', { status: 200 }));

    await expect(
      verifyStaging({
        apiOrigin: 'https://api-staging.example.com',
        fetchImpl,
        webOrigin: 'https://staging.example.com',
      }),
    ).rejects.toThrow('Staging web HTTP redirect must be permanent');
  });

  it('requires HTTPS origins', async () => {
    await expect(
      verifyStaging({
        apiOrigin: 'https://api-staging.example.com',
        fetchImpl: vi.fn<typeof fetch>(),
        webOrigin: 'http://staging.example.com',
      }),
    ).rejects.toThrow('Staging origins must use HTTPS');
  });
});

describe('verifyStagingWithRetries', () => {
  it('retries the complete contract after a transient edge mismatch', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(webHtmlWithStaticAsset, {
          headers: { 'content-type': 'text/html; charset=utf-8' },
          status: 200,
        }),
      )
      .mockResolvedValueOnce(webShellResponse(webHtmlWithStaticAsset))
      .mockResolvedValueOnce(webRuntimeRedirect)
      .mockResolvedValueOnce(apiHealthResponse())
      .mockResolvedValueOnce(
        new Response('asset', {
          headers: protectedHeaders({
            'content-type': 'application/javascript',
          }),
          status: 200,
        }),
      )
      .mockResolvedValueOnce(httpRedirect('https://staging.example.com/'))
      .mockResolvedValueOnce(
        httpRedirect('https://api-staging.example.com/api/v1/health'),
      );
    const sleepImpl = vi.fn().mockResolvedValue(undefined);

    await expect(
      verifyStagingWithRetries({
        apiOrigin: 'https://api-staging.example.com',
        attempts: 2,
        delayMs: 25,
        fetchImpl,
        sleepImpl,
        webOrigin: 'https://staging.example.com',
      }),
    ).resolves.toEqual({
      apiStatus: 200,
      webRuntimeStatus: 303,
      webStatus: 200,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(7);
    expect(sleepImpl).toHaveBeenCalledOnce();
    expect(sleepImpl).toHaveBeenCalledWith(25);
  });

  it('fails closed after the bounded retry limit', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(webHtmlWithStaticAsset, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
        status: 200,
      }),
    );
    const sleepImpl = vi.fn().mockResolvedValue(undefined);

    await expect(
      verifyStagingWithRetries({
        apiOrigin: 'https://api-staging.example.com',
        attempts: 2,
        delayMs: 0,
        fetchImpl,
        sleepImpl,
        webOrigin: 'https://staging.example.com',
      }),
    ).rejects.toThrow(
      'Staging web security header content-security-policy mismatch',
    );

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleepImpl).toHaveBeenCalledOnce();
  });

  it.each([
    [{ attempts: 0 }, 'attempts must be a positive integer'],
    [{ attempts: 1.5 }, 'attempts must be a positive integer'],
    [{ delayMs: -1 }, 'retry delay must be non-negative'],
    [{ delayMs: Number.POSITIVE_INFINITY }, 'retry delay must be non-negative'],
  ])('rejects invalid retry options %#', async (options, message) => {
    await expect(
      verifyStagingWithRetries({
        apiOrigin: 'https://api-staging.example.com',
        fetchImpl: vi.fn<typeof fetch>(),
        webOrigin: 'https://staging.example.com',
        ...options,
      }),
    ).rejects.toThrow(message);
  });
});
