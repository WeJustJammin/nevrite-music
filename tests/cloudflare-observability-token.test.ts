import { describe, expect, it, vi } from 'vitest';

import { verifyCloudflareObservabilityToken } from '../infra/verify-cloudflare-observability.ts';

const config = {
  accountId: 'b1c05c00f04130a0d100adbca6696e6e',
  token: 'production-observability-token',
} as const;

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status,
  });

describe('Cloudflare observability token verification', () => {
  it('proves Workers Observability and Account Analytics access without exposing the token', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ result: {}, success: true }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            viewer: {
              accounts: [{ queueBacklogAdaptiveGroups: [] }],
            },
          },
        }),
      );

    await expect(
      verifyCloudflareObservabilityToken(config, fetchImpl),
    ).resolves.toBeUndefined();

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const [logsUrl, logsInit] = fetchImpl.mock.calls[0]!;
    const [analyticsUrl, analyticsInit] = fetchImpl.mock.calls[1]!;
    expect(logsUrl).toBe(
      `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/workers/observability/telemetry/query`,
    );
    expect(analyticsUrl).toBe('https://api.cloudflare.com/client/v4/graphql');
    expect(logsInit?.headers).toEqual({
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    });
    expect(analyticsInit?.headers).toEqual(logsInit?.headers);
    expect(String(logsInit?.body)).not.toContain(config.token);
    expect(String(analyticsInit?.body)).not.toContain(config.token);
  });

  it('fails safely when Workers Observability permission is rejected', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        errors: [{ message: `token ${config.token} is forbidden` }],
        success: false,
      }),
    );

    const verification = verifyCloudflareObservabilityToken(config, fetchImpl);
    await expect(verification).rejects.toThrow(
      'Cloudflare Workers Observability permission check failed',
    );
    await expect(verification).rejects.not.toThrow(config.token);
  });

  it('fails safely when Account Analytics permission is rejected', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ result: {}, success: true }))
      .mockResolvedValueOnce(
        jsonResponse({ errors: [{ message: `token ${config.token} denied` }] }),
      );

    const verification = verifyCloudflareObservabilityToken(config, fetchImpl);
    await expect(verification).rejects.toThrow(
      'Cloudflare Account Analytics permission check failed',
    );
    await expect(verification).rejects.not.toThrow(config.token);
  });

  it('rejects invalid local configuration before making a request', async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      verifyCloudflareObservabilityToken(
        { accountId: 'wrong-account', token: config.token },
        fetchImpl,
      ),
    ).rejects.toThrow(
      'Cloudflare account ID must be 32 lowercase hex characters',
    );
    await expect(
      verifyCloudflareObservabilityToken(
        { accountId: config.accountId, token: 'contains whitespace' },
        fetchImpl,
      ),
    ).rejects.toThrow('Cloudflare observability token is malformed');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
