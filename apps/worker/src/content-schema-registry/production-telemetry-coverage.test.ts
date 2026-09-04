import { describe, expect, it, vi } from 'vitest';

import type { Logger } from '@wejammin/observability/logging';

import { createProductionContentSchemaRegistryDependencies } from './production';

const environment = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'telemetry-coverage',
  SUPABASE_SECRET_KEY: 'sb_secret_telemetry_coverage',
  SUPABASE_URL: 'https://supabase.example.test',
} as const;

describe('content registry telemetry defaults', () => {
  it('fills optional telemetry fields with scrubbed defaults', () => {
    const info = vi.fn();
    const dependencies = createProductionContentSchemaRegistryDependencies({
      environment,
      fetchImpl: vi.fn<typeof fetch>(),
      logger: { info } as unknown as Logger,
    });
    dependencies.telemetry?.({
      operationId: 'CMS-03A-06',
      requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      outcome: 'failure',
      status: 503,
      durationMs: 1,
      actorClass: 'anonymous',
    });
    expect(info).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'cms.registry.CMS-03A-06',
        attributes: expect.objectContaining({
          rate_class: 'unknown',
          alert_class: 'content_schema_registry_tier2',
          runbook: 'content-schema-registry',
        }),
        retryable: true,
      }),
      expect.objectContaining({ samplingClass: 'always', highRisk: true }),
    );
    dependencies.telemetry?.({
      operationId: 'CMS-03A-06',
      requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      outcome: 'success',
      errorCode: 'DEPENDENCY_UNAVAILABLE',
      status: 200,
      durationMs: 2,
      actorClass: 'anonymous',
    });
    expect(info).toHaveBeenLastCalledWith(
      expect.objectContaining({
        correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        errorCode: 'DEPENDENCY_UNAVAILABLE',
        retryable: false,
      }),
      expect.objectContaining({ samplingClass: 'always', highRisk: false }),
    );
  });
});
