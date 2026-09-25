import { describe, expect, it, vi } from 'vitest';

import { Ac209EmailSendingAnalyticsError } from '../infra/workflows/ac209-email-sending-analytics.ts';
import { Ac209QueueExerciseError } from '../infra/workflows/ac209-queue-exercise.ts';
import {
  exerciseProductionAc209,
  formatAc209StageDiagnostic,
} from '../infra/workflows/exercise-production-ac209.ts';
import {
  alertEmailSha256,
  baseInput,
  dependencies,
  deliveryFixture,
  emailReportFixture,
  MARKER,
  queueReportFixture,
  sourceRevision,
  versionId,
} from './ac209-production-exercise-failure-test-fixtures.ts';

const COMPLETED_AT = '2026-09-10T23:17:00.000Z';
const CHECKED_AT = '2026-09-10T23:15:00.000Z';
const FAILED_AT = '2026-09-10T23:18:00.000Z';

const failedExercise = async (
  overrides: Record<string, unknown> = {},
  code: 'cleanup_failed' | 'marker_not_observed' = 'marker_not_observed',
) => {
  const deps = dependencies();
  deps.queueExercise.mockImplementationOnce(async () => {
    throw new Ac209QueueExerciseError(code, 'queue exercise did not complete');
  });
  const captureFailureReceipt = vi.fn();
  const failure = exerciseProductionAc209(
    { ...(await baseInput()), ...overrides },
    { ...deps, captureFailureReceipt },
  );
  return { failure, deps, captureFailureReceipt };
};

describe('AC209 failure receipt capture', () => {
  it('retains the configuration-stage receipt when input validation fails before any mutation', async () => {
    const { failure, deps, captureFailureReceipt } = await failedExercise({
      exerciseMarker: 'invalid-marker',
    });

    await expect(failure).rejects.toThrow('AC209 production exercise failed');
    expect(deps.queueExercise).not.toHaveBeenCalled();
    expect(deps.beforeQueueAccess).not.toHaveBeenCalled();
    expect(captureFailureReceipt).toHaveBeenCalledExactlyOnceWith({
      schemaVersion: 'ac209-production-exercise-failure-v1',
      status: 'unsuccessful',
      outcome: 'no_acceptance',
      environment: 'production',
      sourceRevision,
      productionVersionId: versionId,
      stage: 'configuration',
      code: 'invalid_configuration',
      boundary: null,
      providerStatus: null,
      cleanupRequired: false,
      cleanup: 'not_required',
      recipientDigest: alertEmailSha256,
      capturedAt: FAILED_AT,
    });
  });

  it('reports cleanup as unverified once the queue boundary opened', async () => {
    const { failure, captureFailureReceipt } = await failedExercise(
      {},
      'cleanup_failed',
    );

    await expect(failure).rejects.toThrow('AC209 production exercise failed');
    expect(captureFailureReceipt).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        stage: 'queue',
        code: 'cleanup_failed',
        cleanupRequired: true,
        cleanup: 'unverified',
      }),
    );
  });

  it('retains the closed queue boundary and provider status after a provider rejection', async () => {
    const deps = dependencies();
    deps.queueExercise.mockRejectedValueOnce(
      new Ac209QueueExerciseError(
        'provider_request_failed',
        'provider refused the request',
        {
          boundary: 'queue_publish',
          code: 'provider_request_failed',
          status: 403,
        },
      ),
    );
    const captureFailureReceipt = vi.fn();

    await expect(
      exerciseProductionAc209(await baseInput(), {
        ...deps,
        captureFailureReceipt,
      }),
    ).rejects.toThrow('AC209 production exercise failed');
    expect(captureFailureReceipt).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        stage: 'queue',
        code: 'provider_request_failed',
        boundary: 'queue_publish',
        providerStatus: 403,
        cleanupRequired: true,
      }),
    );
  });

  it('reports cleanup as not required when the boundary was never entered', async () => {
    const deps = dependencies();
    deps.beforeQueueAccess.mockImplementationOnce(() => {
      throw new Error('unsafe output failure detail');
    });
    const captureFailureReceipt = vi.fn();

    await expect(
      exerciseProductionAc209(await baseInput(), {
        ...deps,
        captureFailureReceipt,
      }),
    ).rejects.toThrow('AC209 production exercise failed');
    expect(deps.queueExercise).not.toHaveBeenCalled();
    expect(captureFailureReceipt).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        cleanupRequired: false,
        cleanup: 'not_required',
        stage: 'queue',
      }),
    );
  });

  it('retains the allowlisted Email Sending evidence diagnostic', async () => {
    const deps = dependencies();
    deps.queueExercise.mockImplementationOnce(async (value) => {
      await value.whileDlqMessagePresent({
        marker: MARKER,
        messageId: 'queue-message-id',
        attempts: 4,
        timestampMs: Date.parse(COMPLETED_AT),
      });
      return undefined;
    });
    deps.collectEmailAnalytics.mockRejectedValue(
      new Ac209EmailSendingAnalyticsError('provider_graphql_error'),
    );
    const captureFailureReceipt = vi.fn();

    await expect(
      exerciseProductionAc209(
        {
          ...(await baseInput()),
          evidenceMaxPolls: 1,
          evidencePollIntervalMs: 1_000,
        },
        { ...deps, captureFailureReceipt },
      ),
    ).rejects.toThrow('AC209 production exercise failed');
    expect(captureFailureReceipt).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        stage: 'evidence',
        code: 'email_provider_graphql_error',
      }),
    );
  });

  it('never lets a capture failure replace or dilute the fail-closed result', async () => {
    const deps = dependencies();
    const reportQueueDiagnostic = vi.fn();
    const captureFailureReceipt = vi.fn(() => {
      throw new Error('secret-token capture detail ::error::forged');
    });

    await expect(
      exerciseProductionAc209(await baseInput(), {
        ...deps,
        reportQueueDiagnostic,
        captureFailureReceipt,
      }),
    ).rejects.toThrow('AC209 production exercise failed');
    expect(captureFailureReceipt).toHaveBeenCalledOnce();
    expect(reportQueueDiagnostic).toHaveBeenCalledExactlyOnceWith(
      'AC209_DIAGNOSTIC stage=queue code=marker_not_observed',
    );
    expect(
      [reportQueueDiagnostic, captureFailureReceipt]
        .flatMap((spy) =>
          spy.mock.calls.flat().map((value) => JSON.stringify(value ?? null)),
        )
        .join(' '),
    ).not.toMatch(/secret-token|capture detail|forged/u);
  });

  it('retains nothing when the exercise completes successfully', async () => {
    const deps = dependencies();
    deps.queueExercise.mockImplementationOnce(async (value) => {
      await value.whileDlqMessagePresent({
        marker: MARKER,
        messageId: 'queue-message-id',
        attempts: 4,
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
    const captureFailureReceipt = vi.fn();

    const report = await exerciseProductionAc209(await baseInput(), {
      ...deps,
      captureFailureReceipt,
    });

    expect(report.schemaVersion).toBe('ac209-production-exercise-v1');
    expect(captureFailureReceipt).not.toHaveBeenCalled();
  });

  it('keeps the closed log vocabulary aligned with the retained receipt vocabulary', () => {
    expect(
      formatAc209StageDiagnostic({ stage: 'queue', code: 'cleanup_failed' }),
    ).toBe('AC209_DIAGNOSTIC stage=queue code=cleanup_failed');
    expect(
      formatAc209StageDiagnostic({
        stage: 'queue',
        code: 'provider_request_failed',
        boundary: 'queue_purge',
        status: null,
      }),
    ).toBe(
      'AC209_DIAGNOSTIC boundary=queue_purge code=provider_request_failed status=none',
    );
    expect(
      formatAc209StageDiagnostic({ stage: 'report', code: 'not_allowlisted' }),
    ).toBeUndefined();
  });

  it('skips retention rather than fabricating a capture time when the clock is unreadable', async () => {
    for (const now of [
      () => Number.NaN,
      () => {
        throw new Error('secret-token clock detail');
      },
    ]) {
      const deps = dependencies();
      const captureFailureReceipt = vi.fn();

      await expect(
        exerciseProductionAc209(await baseInput(), {
          ...deps,
          now,
          captureFailureReceipt,
        }),
      ).rejects.toThrow('AC209 production exercise failed');
      expect(captureFailureReceipt).not.toHaveBeenCalled();
    }
  });
});
