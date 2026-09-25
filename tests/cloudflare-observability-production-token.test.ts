import { describe, expect, it, vi } from 'vitest';

import { verifyCloudflareProductionMonitoringToken } from '../infra/verify-cloudflare-observability.ts';
import {
  AC209_EMAIL_SENDING_CAPABILITY_QUERY,
  AC209_EMAIL_SENDING_REQUIRED_FIELDS,
} from '../infra/workflows/ac209-email-sending-analytics.ts';
import { AC209_EMAIL_SENDING_SETTINGS_QUERY } from '../infra/workflows/ac209-email-sending-settings-capability.ts';

const productionConfig = {
  accountId: 'b1c05c00f04130a0d100adbca6696e6e',
  emailZoneId: '4f2dc13e11f742b1a826268a27a76ac8',
  token: 'production-observability-token',
} as const;

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status,
  });

const dryObservabilityResponse = (): Response =>
  jsonResponse({ result: { run: { dry: true } }, success: true });

const accountAnalyticsResponse = (): Response =>
  jsonResponse({
    data: { viewer: { accounts: [{ queueBacklogAdaptiveGroups: [] }] } },
  });

const eventsResponse = (): Response =>
  jsonResponse({
    data: {
      viewer: { zones: [{ emailSendingAdaptive: [{ status: 'delivered' }] }] },
    },
  });

const settingsResponse = (overrides: Record<string, unknown> = {}): Response =>
  jsonResponse({
    data: {
      viewer: {
        zones: [
          {
            settings: {
              emailSendingAdaptive: {
                availableFields: [...AC209_EMAIL_SENDING_REQUIRED_FIELDS],
                enabled: true,
                maxDuration: 2_678_400,
                maxNumberOfFields: 30,
                maxPageSize: 10_000,
                notOlderThan: 2_678_400,
                ...overrides,
              },
            },
          },
        ],
      },
    },
  });

const respondingFetch = (...responses: readonly Response[]) => {
  const fetchImpl = vi.fn<typeof fetch>();
  for (const value of responses)
    fetchImpl.mockResolvedValueOnce(value as never);
  return fetchImpl;
};

/**
 * The production monitoring preflight is the capability gate the deploy and
 * observability workflows run before any production work, so it has to reject
 * the same Email Sending shortfalls the protected exercise rejects.
 */
describe('Cloudflare production monitoring token verification', () => {
  it('proves zone Email Sending analytics access and settings capability before accepting the production token', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-14T23:59:59-04:00'));
    try {
      const fetchImpl = respondingFetch(
        dryObservabilityResponse(),
        accountAnalyticsResponse(),
        eventsResponse(),
        settingsResponse(),
      );

      await expect(
        verifyCloudflareProductionMonitoringToken(productionConfig, fetchImpl),
      ).resolves.toBeUndefined();

      expect(fetchImpl).toHaveBeenCalledTimes(4);
      const [emailAnalyticsUrl, emailAnalyticsInit] = fetchImpl.mock.calls[2]!;
      expect(emailAnalyticsUrl).toBe(
        'https://api.cloudflare.com/client/v4/graphql',
      );
      const emailAnalyticsBody = JSON.parse(
        String(emailAnalyticsInit?.body),
      ) as {
        query: string;
        variables: Record<string, unknown>;
      };
      expect(emailAnalyticsBody).toEqual({
        query: AC209_EMAIL_SENDING_CAPABILITY_QUERY,
        variables: {
          zoneTag: productionConfig.emailZoneId,
          start: '2026-09-15T02:59:59.000Z',
          end: '2026-09-15T03:59:59.000Z',
        },
      });
      expect(emailAnalyticsBody.query).toMatch(
        /emailSendingAdaptive\([\s\S]*\)\s*\{\s*status\s*\}/u,
      );
      expect(emailAnalyticsBody.query).not.toMatch(
        /\b(?:from|to|subject|messageId|sender|recipient|errorCause)\b/iu,
      );

      // The settings gate reads the exact zone's Settings node under the same
      // token, so a disabled dataset, an unavailable selected field, or a
      // sub-window requester limit is rejected here rather than after a
      // protected run has opened the queue boundary.
      const [settingsUrl, settingsInit] = fetchImpl.mock.calls[3]!;
      expect(settingsUrl).toBe('https://api.cloudflare.com/client/v4/graphql');
      expect(
        JSON.parse(String(settingsInit?.body)) as {
          query: string;
          variables: Record<string, unknown>;
        },
      ).toEqual({
        query: AC209_EMAIL_SENDING_SETTINGS_QUERY,
        variables: { zoneTag: productionConfig.emailZoneId },
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([
    ['a disabled dataset', { enabled: false }],
    [
      'a selected field unavailable to the token',
      { availableFields: ['status'] },
    ],
    ['a sub-window single-request span', { maxDuration: 60 }],
    ['a sub-window retention horizon', { notOlderThan: 60 }],
  ])(
    'rejects the production token for %s before any protected run',
    async (_label, override) => {
      const fetchImpl = respondingFetch(
        dryObservabilityResponse(),
        accountAnalyticsResponse(),
        eventsResponse(),
        settingsResponse(override),
      );

      const verification = verifyCloudflareProductionMonitoringToken(
        productionConfig,
        fetchImpl,
      );
      await expect(verification).rejects.toThrow(
        'Cloudflare Zone Analytics read and Email Sending capability check failed: provider_resource_unavailable',
      );
      await expect(verification).rejects.not.toThrow(productionConfig.token);
      await expect(verification).rejects.not.toThrow(
        productionConfig.emailZoneId,
      );
    },
  );

  it('fails safely when zone Email Sending analytics access is rejected', async () => {
    const fetchImpl = respondingFetch(
      dryObservabilityResponse(),
      accountAnalyticsResponse(),
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
      'Cloudflare Zone Analytics read and Email Sending capability check failed: provider_permission_denied',
    );
    await expect(verification).rejects.not.toThrow(productionConfig.token);
    await expect(verification).rejects.not.toThrow(
      productionConfig.emailZoneId,
    );
  });
});
