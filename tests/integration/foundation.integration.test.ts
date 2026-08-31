import { HealthResponseSchema } from '@wejammin/contracts';
import { createLogger } from '@wejammin/observability/logging';
import { createIntegrationFixture } from '@wejammin/test-support';
import { describe, expect, it } from 'vitest';

import { createWorkerApp } from '../../apps/worker/src/index.ts';

describe('integration test project', () => {
  it('crosses the Worker boundary with deterministic request and runtime fixtures', async () => {
    const fixture = createIntegrationFixture();
    const app = createWorkerApp({
      captureException: () => {},
      createLogger: () =>
        createLogger(
          {
            environment: fixture.bindings.APP_ENVIRONMENT,
            release: fixture.bindings.APP_RELEASE,
            service: 'wejammin-api',
          },
          {
            now: () => new Date('2026-08-30T06:30:00.000Z'),
            random: () => 0,
            sink: () => {},
          },
        ),
      now: () => 12,
    });

    const response = await app.request(
      fixture.request.path,
      {
        headers: {
          'x-correlation-id': fixture.request.correlationId,
          'x-request-id': fixture.request.requestId,
        },
      },
      fixture.bindings,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toBe(
      fixture.request.requestId,
    );
    expect(response.headers.get('x-correlation-id')).toBe(
      fixture.request.correlationId,
    );
    const payload = HealthResponseSchema.parse(await response.json());
    expect(payload).toEqual({
      requestId: fixture.request.requestId,
      service: 'wejammin-api',
      status: 'ok',
      version: 'v1',
    });
  });
});
