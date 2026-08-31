import { describe, expect, it, vi } from 'vitest';

import type { JobEffectInput, JobEffectResult } from '@wejammin/application';

import {
  createProductionJobEffectDispatcher,
  type ProductionVerificationDependencies,
} from './production-job-effect-dispatcher';

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const CORRELATION_ID = '33333333-3333-4333-8333-333333333333';
const LEASE_TOKEN = '44444444-4444-4444-8444-444444444444';

const input = (type = 'platform.object.verify'): JobEffectInput => ({
  envelope: {
    aggregateId: JOB_ID,
    aggregateType: 'job',
    aggregateVersion: '1',
    causationId: null,
    correlationId: CORRELATION_ID,
    eventId: EVENT_ID,
    eventType: 'job.requested',
    schemaVersion: 1,
  },
  job: {
    id: JOB_ID,
    leaseUntilMs: null,
    state: 'queued',
    type,
    version: '1',
  },
  leaseToken: LEASE_TOKEN,
});

const succeeded: JobEffectResult = {
  errorCode: null,
  resultRef: { id: JOB_ID, type: 'object' },
  state: 'succeeded',
};

describe('production job-effect dispatcher', () => {
  it('routes the approved object verification job to the injected internal port', async () => {
    const verifyObject = vi.fn<
      ProductionVerificationDependencies['verifyObject']
    >(async (job) => {
      expect(job.job.id).toBe(JOB_ID);
      expect(job.leaseToken).toBe(LEASE_TOKEN);
      return succeeded;
    });
    const dispatch = createProductionJobEffectDispatcher({ verifyObject });

    await expect(dispatch(input())).resolves.toEqual(succeeded);
    expect(verifyObject).toHaveBeenCalledOnce();
  });

  it('accepts a completed verification with no result reference', async () => {
    const verifyObject = vi.fn<
      ProductionVerificationDependencies['verifyObject']
    >(async () => ({ errorCode: null, resultRef: null, state: 'succeeded' }));

    await expect(
      createProductionJobEffectDispatcher({ verifyObject })(input()),
    ).resolves.toEqual({
      errorCode: null,
      resultRef: null,
      state: 'succeeded',
    });
  });

  it('does not claim success when storage/verification is unconfigured', async () => {
    const dispatch = createProductionJobEffectDispatcher();

    await expect(dispatch(input())).resolves.toEqual({
      errorCode: 'DEPENDENCY_UNAVAILABLE',
      resultRef: null,
      state: 'pending_manual_review',
    });
  });

  it('routes unknown job types to manual review without invoking a provider', async () => {
    const verifyObject = vi.fn<
      ProductionVerificationDependencies['verifyObject']
    >(async () => succeeded);
    const dispatch = createProductionJobEffectDispatcher({ verifyObject });

    await expect(dispatch(input('provider.send'))).resolves.toEqual({
      errorCode: 'UNSUPPORTED_JOB_TYPE',
      resultRef: null,
      state: 'pending_manual_review',
    });
    expect(verifyObject).not.toHaveBeenCalled();
  });

  it('converts an internal dependency failure to manual review', async () => {
    const verifyObject = vi.fn<
      ProductionVerificationDependencies['verifyObject']
    >(async () => {
      throw new Error('storage adapter is not configured');
    });
    const dispatch = createProductionJobEffectDispatcher({ verifyObject });

    await expect(dispatch(input())).resolves.toEqual({
      errorCode: 'DEPENDENCY_UNAVAILABLE',
      resultRef: null,
      state: 'pending_manual_review',
    });
  });

  it('rejects malformed internal outcomes instead of persisting unsafe data', async () => {
    const invalidResults: unknown[] = [
      null,
      { errorCode: null, resultRef: null, state: 'running' },
      { errorCode: 'bad-code', resultRef: null, state: 'failed' },
      { errorCode: null, resultRef: undefined, state: 'succeeded' },
      { errorCode: null, resultRef: [], state: 'succeeded' },
      {
        errorCode: null,
        resultRef: { id: JOB_ID, type: 'object', extra: true },
        state: 'succeeded',
      },
      {
        errorCode: null,
        resultRef: { id: '', type: 'object' },
        state: 'succeeded',
      },
      {
        errorCode: null,
        resultRef: { id: 'a'.repeat(129), type: 'object' },
        state: 'succeeded',
      },
      {
        errorCode: null,
        resultRef: { id: JOB_ID, type: 'Object' },
        state: 'succeeded',
      },
    ];
    for (const result of invalidResults) {
      const verifyObject = vi.fn<
        ProductionVerificationDependencies['verifyObject']
      >(async () => result as JobEffectResult);
      const dispatch = createProductionJobEffectDispatcher({ verifyObject });
      await expect(dispatch(input())).resolves.toEqual({
        errorCode: 'DEPENDENCY_UNAVAILABLE',
        resultRef: null,
        state: 'pending_manual_review',
      });
    }
  });
});
