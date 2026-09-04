import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ORIGIN,
  REQUEST_ID,
  bindings,
} from '../authentication/phase-02-slice-02.test-fixtures';
import {
  createApp,
  success,
} from '../authentication/phase-02-slice-02.test-support';
import type { WorkerDependencies } from '../index';
import type { AuthenticationDependencies } from '../authentication/types';
import {
  enforceRelationshipRate,
  relationshipPolicy,
} from './relationship-handler-support';

afterEach(() => {
  vi.useRealTimers();
});

describe('Phase 2 Slice 04 rate dependency deadlines', () => {
  it('maps a late rate decision to the registered deadline', async () => {
    vi.useFakeTimers();
    const lateRateLimit: AuthenticationDependencies['rateLimit'] = async () =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve(
              success({
                allowed: true,
                limit: 60,
                remaining: 59,
                resetAt: 1_788_236_460,
              }),
            ),
          15_001,
        ),
      );
    const { app, auth } = createApp({
      rateLimit: vi.fn(lateRateLimit),
    });
    app.get('/test-rate-late', (context) =>
      enforceRelationshipRate(
        context,
        { auth } as unknown as WorkerDependencies,
        'ORG-01',
        null,
      ).then((response) => response ?? context.text('ok')),
    );

    const pending = app.fetch(
      new Request(`${ORIGIN}/test-rate-late`, {
        headers: { origin: ORIGIN, 'x-request-id': REQUEST_ID },
      }),
      bindings,
    );
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(
      relationshipPolicy('ORG-01').timeoutMs + 1,
    );
    await expect(pending).resolves.toMatchObject({ status: 504 });
  });
});
