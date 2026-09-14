import { createLogger } from '@wejammin/observability/logging';
import { describe, expect, it, vi } from 'vitest';

import { createWorkerApp, type WorkerDependencies } from '../index';
import type { WorkerBindings } from '../worker-bindings';
import type { Ac265HostedDependencies } from './types';

const path = '/api/v1/internal/ac265/runs/prepare';
const requestId = '10000000-0000-4000-8000-000000000001';
const staging: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'a'.repeat(40),
  SUPABASE_SECRET_KEY: 'sb_secret_ac265_composition',
  SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
};

const baseDependencies = (): WorkerDependencies => ({
  captureException: () => {},
  createLogger: () =>
    createLogger(
      {
        environment: 'staging',
        release: 'a'.repeat(40),
        service: 'wejammin-api',
      },
      { now: () => new Date(0), random: () => 0, sink: () => {} },
    ),
  now: Date.now,
});

const ac265Hosted: Ac265HostedDependencies = {
  verifyGithubOidc: vi.fn(),
  prepareRun: vi.fn(),
};

const post = (
  app: ReturnType<typeof createWorkerApp>,
  bindings: WorkerBindings,
) =>
  app.request(
    path,
    { method: 'POST', headers: { 'x-request-id': requestId } },
    bindings,
  );

describe('AC265 Worker route composition', () => {
  it('registers the route only when the staging dependency seam is injected', async () => {
    const registered = await post(
      createWorkerApp({ ...baseDependencies(), ac265Hosted }),
      staging,
    );
    expect(registered.status).toBe(401);
    await expect(registered.json()).resolves.toMatchObject({
      code: 'OIDC_IDENTITY_REJECTED',
      requestId,
    });

    const absent = await post(createWorkerApp(baseDependencies()), staging);
    expect(absent.status).toBe(404);
    await expect(absent.json()).resolves.toMatchObject({
      code: 'NOT_FOUND',
      requestId,
    });
  });

  it('stays indistinguishable from an absent route in production even if mis-injected', async () => {
    const response = await post(
      createWorkerApp({ ...baseDependencies(), ac265Hosted }),
      { ...staging, APP_ENVIRONMENT: 'production' },
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: 'NOT_FOUND',
      requestId,
    });
    expect(ac265Hosted.verifyGithubOidc).not.toHaveBeenCalled();
    expect(ac265Hosted.prepareRun).not.toHaveBeenCalled();
  });
});
