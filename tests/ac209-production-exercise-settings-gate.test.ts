import { describe, expect, it, vi } from 'vitest';

import { Ac209EmailSendingAnalyticsError } from '../infra/workflows/ac209-email-sending-analytics.ts';
import { exerciseProductionAc209 } from '../infra/workflows/exercise-production-ac209.ts';
import {
  baseInput,
  CHECKED_AT,
  COMPLETED_AT,
  dependencies,
  deliveryFixture,
  emailReportFixture,
  MARKER,
  queueReportFixture,
  ZONE_ID,
} from './ac209-production-exercise-failure-test-fixtures.ts';

const TOKEN = 'email-analytics-token-that-is-never-reported';

/**
 * The Settings-node preflight the protected exercise enforces before it records
 * `cleanup_required=true`. These cases assert the orchestrator's use of that
 * gate; the gate's own payload rules, query shape, and window bound are covered
 * by `./ac209-email-sending-settings-{capability,shape}.test.ts`.
 */
describe('production AC209 exercise settings preflight', () => {
  it.each([
    ['provider_resource_unavailable', 'email_provider_resource_unavailable'],
    ['provider_response_invalid', 'email_provider_response_invalid'],
    ['provider_permission_denied', 'email_provider_permission_denied'],
    ['provider_query_invalid', 'email_provider_query_invalid'],
    ['provider_request_failed', 'email_provider_request_failed'],
    ['provider_graphql_error', 'email_provider_graphql_error'],
    [
      'provider_temporarily_unavailable',
      'email_provider_temporarily_unavailable',
    ],
  ] as const)(
    'fails the %s settings preflight before queue mutation',
    async (errorCode, diagnosticCode) => {
      const deps = dependencies();
      const reportQueueDiagnostic = vi.fn<(diagnostic: string) => void>();
      deps.verifyEmailSettings.mockRejectedValueOnce(
        new Ac209EmailSendingAnalyticsError(
          errorCode,
          'secret-token provider.invalid forged',
        ),
      );

      await expect(
        exerciseProductionAc209(await baseInput(), {
          ...deps,
          reportQueueDiagnostic,
        }),
      ).rejects.toThrow('AC209 production exercise failed');
      // The events probe still runs; the settings gate is additive, and a
      // settings shortfall must abort before any queue access or mutation.
      expect(deps.verifyEmailCapability).toHaveBeenCalledOnce();
      expect(deps.beforeQueueAccess).not.toHaveBeenCalled();
      expect(deps.queueExercise).not.toHaveBeenCalled();
      expect(deps.collectEmailAnalytics).not.toHaveBeenCalled();
      expect(deps.verifyDelivery).not.toHaveBeenCalled();
      expect(reportQueueDiagnostic).toHaveBeenCalledExactlyOnceWith(
        `AC209_DIAGNOSTIC stage=evidence code=${diagnosticCode}`,
      );
      expect(reportQueueDiagnostic.mock.calls.flat().join(' ')).not.toMatch(
        /secret-token|provider\.invalid|forged/u,
      );
    },
  );

  it.each([
    [
      'typed invalid configuration',
      new Ac209EmailSendingAnalyticsError(
        'invalid_configuration',
        'secret-token provider.invalid forged',
      ),
      'email_invalid_configuration',
    ],
    [
      'typed unexpected failure',
      new Ac209EmailSendingAnalyticsError(
        'unexpected_failure',
        'secret-token provider.invalid forged',
      ),
      'email_query_failed',
    ],
    [
      'untyped dependency failure',
      new Error('secret-token provider.invalid forged'),
      'email_query_failed',
    ],
  ])(
    'closes the settings preflight on a %s without leaking detail',
    async (_label, error, diagnosticCode) => {
      const deps = dependencies();
      const reportQueueDiagnostic = vi.fn<(diagnostic: string) => void>();
      deps.verifyEmailSettings.mockRejectedValueOnce(error);

      await expect(
        exerciseProductionAc209(await baseInput(), {
          ...deps,
          reportQueueDiagnostic,
        }),
      ).rejects.toThrow('AC209 production exercise failed');
      expect(deps.beforeQueueAccess).not.toHaveBeenCalled();
      expect(deps.queueExercise).not.toHaveBeenCalled();
      expect(reportQueueDiagnostic).toHaveBeenCalledExactlyOnceWith(
        `AC209_DIAGNOSTIC stage=evidence code=${diagnosticCode}`,
      );
      expect(reportQueueDiagnostic.mock.calls.flat().join(' ')).not.toMatch(
        /secret-token|provider\.invalid|forged/u,
      );
    },
  );

  it('runs both capability preflights in order before the queue boundary opens', async () => {
    const deps = dependencies();
    deps.queueExercise.mockImplementationOnce(async (value) => {
      await value.whileDlqMessagePresent({
        attempts: 4,
        marker: MARKER,
        messageId: 'queue-message-id',
        timestampMs: Date.parse(COMPLETED_AT),
      });
      return queueReportFixture();
    });
    deps.collectEmailAnalytics.mockResolvedValue(emailReportFixture());
    deps.verifyDelivery.mockResolvedValue(deliveryFixture());
    deps.now
      .mockReset()
      .mockReturnValueOnce(Date.parse(CHECKED_AT))
      .mockReturnValue(Date.parse(COMPLETED_AT));

    const report = await exerciseProductionAc209(await baseInput(), deps);

    expect(report.queue).toStrictEqual(queueReportFixture());
    // Both preflights read the exact zone under the observability token, and the
    // settings gate is strictly additive: the events probe keeps accepting an
    // empty provider window, which that probe's own suite pins.
    expect(deps.verifyEmailCapability).toHaveBeenCalledOnce();
    expect(deps.verifyEmailSettings).toHaveBeenCalledOnce();
    for (const preflight of [
      deps.verifyEmailCapability,
      deps.verifyEmailSettings,
    ])
      expect(preflight).toHaveBeenCalledWith({
        zoneId: ZONE_ID,
        token: TOKEN,
      });
    expect(deps.verifyEmailCapability.mock.invocationCallOrder[0]).toBeLessThan(
      deps.verifyEmailSettings.mock.invocationCallOrder[0] ?? 0,
    );
    expect(deps.verifyEmailSettings.mock.invocationCallOrder[0]).toBeLessThan(
      deps.beforeQueueAccess.mock.invocationCallOrder[0] ?? 0,
    );
    expect(deps.beforeQueueAccess).toHaveBeenCalledExactlyOnceWith();
  });
});
