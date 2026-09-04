import { EnvironmentConfigurationError } from '@wejammin/config/environment';
import { describe, expect, it } from 'vitest';

import * as runtimeModule from './runtime-entry';
import handler, { DIAGNOSTICS_CAPABILITY, routeTemplateFor } from './index';

describe('Worker entrypoint boundaries', () => {
  it('preserves the public diagnostics capability contract', () => {
    expect(DIAGNOSTICS_CAPABILITY).toBe('diagnostics.read');
  });

  it('exposes only the callable default binding to Cloudflare', () => {
    expect(Object.keys(runtimeModule)).toEqual(['default']);
    expect(typeof runtimeModule.default.fetch).toBe('function');
  });

  it('normalizes only unregistered route markers', () => {
    expect(routeTemplateFor('/api/v1/health')).toBe('/api/v1/health');
    expect(routeTemplateFor('unregistered')).toBe('/_unmatched');
  });

  it('rejects an incomplete server environment before serving a route', () => {
    const invalidBindings = {
      APP_ENVIRONMENT: 'production',
      APP_RELEASE: 'a2ec4803',
    } as never;

    expect(() =>
      handler.fetch(
        new Request('https://api.example.test/api/v1/health'),
        invalidBindings,
        {} as ExecutionContext,
      ),
    ).toThrowError(EnvironmentConfigurationError);
  });

  it('accepts approved server keys alongside Cloudflare runtime bindings', async () => {
    const response = await handler.fetch(
      new Request('https://api.example.test/api/v1/health'),
      {
        APP_ENVIRONMENT: 'staging',
        APP_RELEASE: 'a2ec4803',
        PLATFORM_JOBS: {
          send: async () => ({
            metadata: { metrics: { backlogBytes: 0, backlogCount: 0 } },
          }),
        },
        SUPABASE_SECRET_KEY: 'sb_secret_staging',
        SUPABASE_URL: 'https://staging.example.supabase.co',
      },
      {} as ExecutionContext,
    );

    expect(response.status).toBe(200);
  });
});
