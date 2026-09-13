import { beforeEach, describe, expect, it, vi } from 'vitest';

const schedulerMocks = vi.hoisted(() => ({
  createProductionAsyncEntrypoint: vi.fn(),
  outbox: vi.fn(),
  runProductionIdempotencyExpirySweep: vi.fn(),
  runProductionOperationalAlerts: vi.fn(),
}));

vi.mock('./production-async-entrypoint', () => ({
  createProductionAsyncEntrypoint:
    schedulerMocks.createProductionAsyncEntrypoint,
  runProductionOperationalAlerts: schedulerMocks.runProductionOperationalAlerts,
}));
vi.mock('./production-idempotency-expiry-sweep', () => ({
  runProductionIdempotencyExpirySweep:
    schedulerMocks.runProductionIdempotencyExpirySweep,
}));

import { AsyncRpcManualReviewError } from './async-runtime-support';
import handler from './index';

const createController = () => ({
  cron: '* * * * *',
  noRetry: vi.fn(),
  scheduledTime: 1_756_560_000_000,
});

beforeEach(() => {
  vi.clearAllMocks();
  schedulerMocks.createProductionAsyncEntrypoint.mockReturnValue({
    scheduled: schedulerMocks.outbox,
  });
  schedulerMocks.outbox.mockResolvedValue(undefined);
  schedulerMocks.runProductionIdempotencyExpirySweep.mockResolvedValue(
    undefined,
  );
  schedulerMocks.runProductionOperationalAlerts.mockResolvedValue(undefined);
});

describe('scheduled manual-review retry policy', () => {
  it('suppresses platform retries when the only failed job requires manual review', async () => {
    const controller = createController();
    const manualReview = new AsyncRpcManualReviewError('malformed_json');
    schedulerMocks.runProductionIdempotencyExpirySweep.mockRejectedValue(
      manualReview,
    );

    await expect(
      handler.scheduled(controller as never, {} as never, {} as never),
    ).rejects.toBe(manualReview);

    expect(controller.noRetry).toHaveBeenCalledOnce();
    expect(schedulerMocks.outbox).toHaveBeenCalledOnce();
    expect(
      schedulerMocks.runProductionOperationalAlerts,
    ).toHaveBeenCalledOnce();
  });

  it('keeps retries enabled and preserves outbox failure priority for mixed failures', async () => {
    const controller = createController();
    const outboxFailure = new Error('outbox dependency unavailable');
    schedulerMocks.outbox.mockRejectedValue(outboxFailure);
    schedulerMocks.runProductionIdempotencyExpirySweep.mockRejectedValue(
      new AsyncRpcManualReviewError('malformed_json'),
    );
    schedulerMocks.runProductionOperationalAlerts.mockRejectedValue(
      new Error('alert dependency unavailable'),
    );

    await expect(
      handler.scheduled(controller as never, {} as never, {} as never),
    ).rejects.toBe(outboxFailure);

    expect(controller.noRetry).not.toHaveBeenCalled();
    expect(schedulerMocks.outbox).toHaveBeenCalledOnce();
    expect(
      schedulerMocks.runProductionIdempotencyExpirySweep,
    ).toHaveBeenCalledOnce();
    expect(
      schedulerMocks.runProductionOperationalAlerts,
    ).toHaveBeenCalledOnce();
  });
});
