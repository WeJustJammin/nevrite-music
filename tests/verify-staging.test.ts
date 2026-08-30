import { describe, expect, it, vi } from 'vitest';

import { verifyStaging } from '../infra/verify-staging.mjs';

const webHtml = `<!doctype html><html><head><title>WeJammin | Operational foundation</title></head><body><h1>WeJammin operational foundation</h1></body></html>`;

describe('verifyStaging', () => {
  it('accepts the locked web and API health contracts', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(webHtml, {
          headers: { 'content-type': 'text/html; charset=utf-8' },
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
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
    ).resolves.toEqual({
      apiStatus: 200,
      webStatus: 200,
    });
  });

  it('rejects an unexpected API health contract', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(webHtml, {
          headers: { 'content-type': 'text/html; charset=utf-8' },
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ service: 'wrong-service', status: 'ok' }),
      );

    await expect(
      verifyStaging({
        apiOrigin: 'https://api-staging.example.com',
        fetchImpl,
        webOrigin: 'https://staging.example.com',
      }),
    ).rejects.toThrow('API health contract mismatch');
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
