import { describe, expect, it, vi } from 'vitest';

import { createLogger } from '@wejammin/observability/logging';

import { createWorkerApp, type WorkerDependencies } from '../index';
import {
  CSRF,
  ORIGIN,
  REQUEST_ID,
} from '../authentication/phase-02-slice-02.test-fixtures';
import { createApp } from '../authentication/phase-02-slice-02.test-support';
import type {
  IdentityCommitResult,
  IdentityRecoveryDependencies,
} from './types';

const IDENTITY_PATH = '/api/v1/me/identity';

const requestFor = (key: string): Request => {
  const headers = new Headers({
    origin: ORIGIN,
    cookie: `wj_session_ref=slice02-session-ref; wj_csrf=${CSRF}`,
    'x-csrf-token': CSRF,
    'idempotency-key': key,
    'x-request-id': REQUEST_ID,
    'content-type': 'application/json',
  });
  const init: RequestInit = { method: 'POST', headers };
  init.body = JSON.stringify({});
  return new Request(`${ORIGIN}${IDENTITY_PATH}`, init);
};

const committed: IdentityCommitResult = {
  kind: 'committed',
  status: 201,
  body: { version: '1' },
};

const conflict: IdentityCommitResult = {
  kind: 'conflict',
  status: 409,
  code: 'VERSION_MISMATCH',
  details: { recoveryAction: 'refetch_and_retry' },
};

const make = (reconciled: IdentityCommitResult | null) => {
  const { auth } = createApp();
  const identityAuthority: IdentityRecoveryDependencies = {
    commit: vi.fn(async () => {
      throw new DOMException('deadline', 'AbortError');
    }),
    read: vi.fn(async () => committed),
    reconcile: vi.fn(async () => reconciled),
    telemetry: vi.fn(async () => {}),
  };
  const dependencies: WorkerDependencies = {
    auth,
    captureException: vi.fn(),
    createLogger: () =>
      createLogger({
        environment: 'staging',
        release: 'phase-02-slice-03-coverage-test',
        service: 'wejammin-api',
      }),
    identityAuthority,
    now: () => Date.parse('2026-09-01T05:00:00Z'),
  };
  return { app: createWorkerApp(dependencies), identityAuthority };
};

describe('Slice 03 recovery boundary coverage', () => {
  it('returns dependency unavailable when a lost mutation cannot reconcile', async () => {
    const harness = make(null);
    const key = 'slice03-recovery-null';

    const first = await harness.app.request(requestFor(key));
    const second = await harness.app.request(requestFor(key));

    expect(first.status).toBe(503);
    expect(second.status).toBe(503);
    expect(harness.identityAuthority.reconcile).toHaveBeenCalledOnce();
    await expect(second.json()).resolves.toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
      requestId: REQUEST_ID,
    });
  });

  it('maps a reconciled conflict to the safe retry response', async () => {
    const harness = make(conflict);
    const key = 'slice03-recovery-conflict';

    const first = await harness.app.request(requestFor(key));
    const second = await harness.app.request(requestFor(key));

    expect(first.status).toBe(503);
    expect(second.status).toBe(409);
    await expect(second.json()).resolves.toMatchObject({
      code: 'VERSION_MISMATCH',
      details: { recoveryAction: 'refetch_and_retry' },
      requestId: REQUEST_ID,
    });
  });
});
