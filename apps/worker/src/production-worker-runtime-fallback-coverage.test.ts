import { describe, expect, it, vi } from 'vitest';

import type { WorkerApp, WorkerBindings, WorkerDependencies } from './index';

vi.mock('./platform-configuration/production', async () => {
  const actual = await vi.importActual<
    typeof import('./platform-configuration/production')
  >('./platform-configuration/production');

  return {
    ...actual,
    createProductionPlatformConfigurationDependencies: (
      options: Parameters<
        typeof actual.createProductionPlatformConfigurationDependencies
      >[0],
    ) => {
      const dependencies =
        actual.createProductionPlatformConfigurationDependencies(options);
      const legacy = { ...dependencies };
      delete legacy.readCapabilityKeys;
      return legacy;
    },
  };
});

import { createProductionWorkerAppRuntime } from './production-worker-runtime';

const environment: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'production-fallback-coverage',
  SUPABASE_SECRET_KEY: 'sb_secret_fallback_coverage',
  SUPABASE_URL: 'https://staging.example.supabase.co',
};

describe('production runtime capability fallback', () => {
  it('omits an unavailable capability reader from CMS dependencies', () => {
    let captured: WorkerDependencies | undefined;
    const app = {} as WorkerApp;

    expect(
      createProductionWorkerAppRuntime(
        (dependencies) => {
          captured = dependencies;
          return app;
        },
        environment,
        vi.fn(async () => Response.json([])),
      ),
    ).toBe(app);
    expect(captured?.contentSchemaRegistry).toBeDefined();
    expect(captured?.contentSchemaRegistry).not.toHaveProperty(
      'resolveCapabilities',
    );
  });
});
