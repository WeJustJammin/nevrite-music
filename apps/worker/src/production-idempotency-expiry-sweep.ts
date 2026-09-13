import {
  createCorrelationId,
  createRequestId,
  IdempotencyExpirySweepResultSchema,
} from '@wejammin/contracts';
import { createLogger } from '@wejammin/observability/logging';

import type { AsyncWorkerBindings } from './async-entrypoint';
import { createSupabaseRpc } from './async-runtime';
import { AsyncRpcTransportError } from './async-runtime-support';

const IDEMPOTENCY_EXPIRY_SWEEP_LIMIT = 64;

const retrySweep = (
  logger: ReturnType<typeof createLogger>,
  correlationId: string,
  errorCode: 'DEPENDENCY_INVALID_RESPONSE' | 'DEPENDENCY_UNAVAILABLE',
): Error => {
  logger.error({
    correlationId,
    errorCode,
    eventName: 'idempotency_expiry_sweep.failed',
    operation: 'idempotency_expiry_sweep',
    outcome: 'retry',
    retryable: true,
  });
  return new Error('Idempotency expiry sweep requested retry');
};

const recordManualReview = (
  logger: ReturnType<typeof createLogger>,
  correlationId: string,
  reason: AsyncRpcTransportError['reason'],
): void => {
  logger.error({
    attributes: { reason },
    correlationId,
    errorCode: 'MANUAL_REVIEW',
    eventName: 'idempotency_expiry_sweep.manual_review_required',
    operation: 'idempotency_expiry_sweep',
    outcome: 'failure',
    retryable: false,
  });
};

/** Run one bounded retention sweep; remaining expired rows wait for the next cron. */
export const runProductionIdempotencyExpirySweep = async (
  env: AsyncWorkerBindings,
): Promise<void> => {
  const correlationId = createCorrelationId(
    undefined,
    createRequestId(undefined),
  );
  const logger = createLogger({
    environment: env.APP_ENVIRONMENT,
    release: env.APP_RELEASE,
    service: 'wejammin-worker',
  });

  let result: unknown;
  try {
    result = await createSupabaseRpc()(env, 'idempotency_expiry_sweep', {
      p_limit: IDEMPOTENCY_EXPIRY_SWEEP_LIMIT,
      p_correlation_id: correlationId,
    });
  } catch (error) {
    if (
      error instanceof AsyncRpcTransportError &&
      error.disposition === 'manual_review' &&
      error.retryable === false
    ) {
      recordManualReview(logger, correlationId, error.reason);
      throw error;
    }
    throw retrySweep(logger, correlationId, 'DEPENDENCY_UNAVAILABLE');
  }

  const parsed = IdempotencyExpirySweepResultSchema.safeParse(result);
  const validResult = parsed.success ? parsed.data : undefined;
  if (validResult === undefined)
    throw retrySweep(logger, correlationId, 'DEPENDENCY_INVALID_RESPONSE');
  if (validResult.deletedCount > IDEMPOTENCY_EXPIRY_SWEEP_LIMIT)
    throw retrySweep(logger, correlationId, 'DEPENDENCY_INVALID_RESPONSE');

  logger.info({
    attributes: {
      hasMore: validResult.hasMore,
      limit: IDEMPOTENCY_EXPIRY_SWEEP_LIMIT,
    },
    correlationId,
    eventName: 'idempotency_expiry_sweep.completed',
    metrics: { deletedCount: validResult.deletedCount },
    operation: 'idempotency_expiry_sweep',
    outcome: 'success',
  });
};
