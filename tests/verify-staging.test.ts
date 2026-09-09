import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

import {
  apiHealthResponse,
  httpRedirect,
  protectedHeaders,
  webHtml,
  webHtmlWithStaticAsset,
  webRuntimeRedirect,
  webShellResponse,
  verifyStaging,
} from './verify-staging.test-support';

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
