import { describe, expect, it, vi } from 'vitest';

import type { WorkerBindings } from '../index';
import {
  createProductionContentSchemaRegistryDependencies,
  ContentSchemaRegistryProductionConfigurationError,
} from './production';

const environment: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'factory-config-coverage',
  SUPABASE_SECRET_KEY: 'sb_secret_factory_config_coverage',
  SUPABASE_URL: 'https://supabase.example.test///',
};

describe('content registry production configuration', () => {
  it('rejects invalid auth, timeout, body limit, origin, and registry configuration', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response('[]'));
    const base = { environment, fetchImpl };
    expect(() =>
      createProductionContentSchemaRegistryDependencies({
        ...base,
        environment: { ...environment, SUPABASE_SECRET_KEY: 'short' },
      }),
    ).toThrow(ContentSchemaRegistryProductionConfigurationError);
    const throwingEnvironment = Object.create(environment, {
      SUPABASE_URL: {
        get: () => {
          throw 'invalid environment';
        },
      },
    }) as WorkerBindings;
    expect(() =>
      createProductionContentSchemaRegistryDependencies({
        ...base,
        environment: throwingEnvironment,
      }),
    ).toThrow(ContentSchemaRegistryProductionConfigurationError);
    const withoutFetch = { environment };
    expect(() =>
      createProductionContentSchemaRegistryDependencies(withoutFetch),
    ).not.toThrow();
    for (const override of [
      { deadlineMs: 0 },
      { deadlineMs: 15_001 },
      { deadlineMs: 1.5 },
      { maxResponseBytes: 0 },
      { maxResponseBytes: 1.5 },
    ])
      expect(() =>
        createProductionContentSchemaRegistryDependencies({
          ...base,
          ...override,
        }),
      ).toThrow(ContentSchemaRegistryProductionConfigurationError);
    expect(() =>
      createProductionContentSchemaRegistryDependencies({
        ...base,
        humanOrigins: ['https://same.example.test'],
        releaseOrigins: ['https://same.example.test'],
      }),
    ).toThrow(/overlap/u);
    expect(() =>
      createProductionContentSchemaRegistryDependencies({
        ...base,
        environment: { ...environment, CMS_RELEASE_KEY_REGISTRY: '{broken' },
      }),
    ).toThrow(/registry configuration/u);
    const throwingRegistryEnvironment = Object.create(environment, {
      CMS_RELEASE_KEY_REGISTRY: {
        get: () => {
          throw 'registry getter';
        },
      },
    }) as WorkerBindings;
    expect(() =>
      createProductionContentSchemaRegistryDependencies({
        ...base,
        environment: throwingRegistryEnvironment,
      }),
    ).toThrow('registry getter');
    const malformedVerifier = createProductionContentSchemaRegistryDependencies(
      {
        ...base,
        verifyRelease: 0 as never,
      },
    );
    await expect(
      malformedVerifier.verifyRelease(
        {} as never,
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: false, status: 503 });
    const dependencies = createProductionContentSchemaRegistryDependencies({
      ...base,
      environment: {
        ...environment,
        CMS_HUMAN_ORIGINS: 'https://env-cms.example.test',
        CMS_RELEASE_ORIGINS: 'https://env-release.example.test',
      },
    });
    expect(Object.isFrozen(dependencies.humanOrigins)).toBe(true);
    expect(dependencies.humanOrigins).toEqual(['https://env-cms.example.test']);
  });
});
