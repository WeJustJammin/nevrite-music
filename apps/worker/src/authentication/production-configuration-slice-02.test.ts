import { describe, expect, it, vi } from 'vitest';

import type { WorkerBindings } from '../index';
import {
  expectedVersionValue,
  hashRequest,
  invalidPersistenceResponse,
  normalizeAuthProductionOptions,
} from './production-configuration';
import { enabledProvider } from './production-flows';

const environment: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'phase-02-slice-02-configuration-test',
  SUPABASE_SECRET_KEY: 'sb_secret_test_only',
  SUPABASE_URL: 'https://staging.example.supabase.co',
};

const json = (value: unknown): Response =>
  new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json' },
  });

describe('Slice 02 production configuration and provider guards', () => {
  it('normalizes the quoted CAS value, hashes a request, and emits the typed invalid response', async () => {
    expect(expectedVersionValue('"42"')).toBe('42');
    await expect(
      hashRequest({ mergeId: 'case', acknowledgements: ['one'] }),
    ).resolves.toMatch(/^\\x[0-9a-f]{64}$/u);
    expect(invalidPersistenceResponse()).toEqual({
      ok: false,
      status: 502,
      code: 'DEPENDENCY_INVALID_RESPONSE',
      message: 'Authentication persistence returned an invalid response.',
      details: {},
    });
  });

  it('maps malformed and unavailable provider registries without enabling a provider', async () => {
    const signal = new AbortController().signal;
    const config = normalizeAuthProductionOptions({
      environment,
      fetchImpl: vi.fn(async () => json({ providers: 'not-an-array' })),
    });
    await expect(
      enabledProvider('google', config, signal),
    ).resolves.toMatchObject({
      status: 502,
      code: 'DEPENDENCY_INVALID_RESPONSE',
    });

    const disabledConfig = normalizeAuthProductionOptions({
      environment,
      fetchImpl: vi.fn(async () =>
        json({
          providers: [
            {
              code: 'google',
              label: 'Google',
              state: 'temporarily_unavailable',
            },
          ],
          emailRecoveryEnabled: true,
          version: '1',
        }),
      ),
    });
    await expect(
      enabledProvider('google', disabledConfig, signal),
    ).resolves.toMatchObject({
      status: 422,
      code: 'PROVIDER_NOT_AVAILABLE',
    });
  });
});
