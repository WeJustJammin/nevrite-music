import { describe, expect, it, vi } from 'vitest';

import {
  verifyCloudflareObservabilityToken,
  verifyCloudflareProductionMonitoringToken,
} from '../infra/verify-cloudflare-observability.ts';
import { AC209_EMAIL_SENDING_REQUIRED_FIELDS } from '../infra/workflows/ac209-email-sending-analytics.ts';

const config = {
  accountId: 'b1c05c00f04130a0d100adbca6696e6e',
  token: 'production-observability-token',
} as const;
const productionConfig = {
  ...config,
  emailZoneId: '4f2dc13e11f742b1a826268a27a76ac8',
} as const;

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status,
  });

describe('Cloudflare observability token verification', () => {
  it('proves zone Email Sending analytics access before accepting the production token', async () => {
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
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            viewer: {
              zones: [
                {
                  settings: {
                    emailSendingAdaptive: {
                      availableFields: [...AC209_EMAIL_SENDING_REQUIRED_FIELDS],
                      enabled: true,
                      maxNumberOfFields:
                        AC209_EMAIL_SENDING_REQUIRED_FIELDS.length,
                      maxPageSize: 50,
                    },
                  },
                },
              ],
            },
          },
        }),
      );

    await expect(
      verifyCloudflareProductionMonitoringToken(productionConfig, fetchImpl),
    ).resolves.toBeUndefined();

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const [emailAnalyticsUrl, emailAnalyticsInit] = fetchImpl.mock.calls[2]!;
    expect(emailAnalyticsUrl).toBe(
      'https://api.cloudflare.com/client/v4/graphql',
    );
    expect(JSON.parse(String(emailAnalyticsInit?.body))).toMatchObject({
      variables: { zoneTag: productionConfig.emailZoneId },
    });
  });

  it('fails safely when zone Email Sending analytics access is rejected', async () => {
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
      )
      .mockResolvedValueOnce(
        jsonResponse({
          errors: [
            {
              message: `token ${productionConfig.token} cannot access ${productionConfig.emailZoneId}`,
            },
          ],
        }),
      );

    const verification = verifyCloudflareProductionMonitoringToken(
      productionConfig,
      fetchImpl,
    );
    await expect(verification).rejects.toThrow(
      'Cloudflare Zone Analytics permission check failed: provider_graphql_error',
    );
    await expect(verification).rejects.not.toThrow(productionConfig.token);
    await expect(verification).rejects.not.toThrow(
      productionConfig.emailZoneId,
    );
  });

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

  it('accepts the documented GraphQL success envelope with null errors', async () => {
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
          errors: null,
        }),
      );

    await expect(
      verifyCloudflareObservabilityToken(config, fetchImpl),
    ).resolves.toBeUndefined();
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

  it.each([403, 500])(
    'reports Account Analytics HTTP %i without leaking the response body',
    async (status) => {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(jsonResponse({ result: {}, success: true }))
        .mockResolvedValueOnce(
          jsonResponse(
            {
              errors: [
                {
                  message: `token ${config.token} cannot access ${config.accountId}`,
                },
              ],
            },
            status,
          ),
        );

      const verification = verifyCloudflareObservabilityToken(
        config,
        fetchImpl,
      );
      await expect(verification).rejects.toThrow(
        `Cloudflare Account Analytics permission check failed: HTTP ${status}`,
      );
      await expect(verification).rejects.not.toThrow(config.token);
      await expect(verification).rejects.not.toThrow(config.accountId);
    },
  );

  it('classifies Account Analytics GraphQL permission errors without leaking provider data', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ result: {}, success: true }))
      .mockResolvedValueOnce(
        jsonResponse({
          errors: [
            {
              message: `permission denied for token ${config.token} on ${config.accountId}`,
            },
          ],
        }),
      );

    const verification = verifyCloudflareObservabilityToken(config, fetchImpl);
    await expect(verification).rejects.toThrow(
      'Cloudflare Account Analytics permission check failed: GraphQL permission error',
    );
    await expect(verification).rejects.not.toThrow(config.token);
    await expect(verification).rejects.not.toThrow(config.accountId);
  });

  it.each([
    {
      errors: [{ message: `account ${config.accountId} does not exist` }],
    },
    { data: { viewer: { accounts: [] } } },
  ])(
    'classifies an unavailable Account Analytics resource without leaking provider data',
    async (analyticsPayload) => {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(jsonResponse({ result: {}, success: true }))
        .mockResolvedValueOnce(jsonResponse(analyticsPayload));

      const verification = verifyCloudflareObservabilityToken(
        config,
        fetchImpl,
      );
      await expect(verification).rejects.toThrow(
        'Cloudflare Account Analytics permission check failed: GraphQL resource error',
      );
      await expect(verification).rejects.not.toThrow(config.accountId);
    },
  );

  it.each([
    {
      analyticsResponse: new Response('not-json', { status: 200 }),
      detail: 'invalid JSON response',
    },
    {
      analyticsResponse: jsonResponse(null),
      detail: 'invalid response envelope',
    },
    {
      analyticsResponse: jsonResponse({ errors: {} }),
      detail: 'invalid errors envelope',
    },
    {
      analyticsResponse: jsonResponse({ data: null }),
      detail: 'missing data envelope',
    },
    {
      analyticsResponse: jsonResponse({ data: { viewer: null } }),
      detail: 'missing viewer envelope',
    },
    {
      analyticsResponse: jsonResponse({
        data: { viewer: { accounts: null } },
      }),
      detail: 'missing accounts envelope',
    },
    {
      analyticsResponse: jsonResponse({
        data: { viewer: { accounts: [null] } },
      }),
      detail: 'malformed account envelope',
    },
    {
      analyticsResponse: jsonResponse({
        data: { viewer: { accounts: [{}] } },
      }),
      detail: 'queue analytics field unavailable',
    },
  ])(
    'classifies Account Analytics $detail without exposing response contents',
    async ({ analyticsResponse, detail }) => {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(jsonResponse({ result: {}, success: true }))
        .mockResolvedValueOnce(analyticsResponse);

      await expect(
        verifyCloudflareObservabilityToken(config, fetchImpl),
      ).rejects.toThrow(
        `Cloudflare Account Analytics permission check failed: ${detail}`,
      );
    },
  );

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

  it('fails closed for oversized provider response bodies before reading them', async () => {
    const response = new Response('{}', {
      headers: { 'content-length': '2000001' },
      status: 200,
    });
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(response);

    await expect(
      verifyCloudflareObservabilityToken(config, fetchImpl),
    ).rejects.toThrow(
      'Cloudflare Workers Observability permission check failed',
    );
  });

  it('fails closed for malformed UTF-8 without exposing provider bytes', async () => {
    const response = new Response(new Uint8Array([123, 195, 40, 125]), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(response);

    const verification = verifyCloudflareObservabilityToken(config, fetchImpl);
    await expect(verification).rejects.toThrow(
      'Cloudflare Workers Observability permission check failed',
    );
    await expect(verification).rejects.not.toThrow(/195|provider bytes/u);
  });
});
