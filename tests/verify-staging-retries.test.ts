import { describe, expect, it, vi } from 'vitest';

import {
  apiHealthResponse,
  httpRedirect,
  protectedHeaders,
  verifyStagingWithRetries,
  webHtmlWithStaticAsset,
  webRuntimeRedirect,
  webShellResponse,
} from './verify-staging.test-support';

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
