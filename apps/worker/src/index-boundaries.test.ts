import { EnvironmentConfigurationError } from '@wejammin/config/environment';
import { describe, expect, it } from 'vitest';

import handler, { routeTemplateFor } from './index';

describe('Worker entrypoint boundaries', () => {
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
});
