import { describe, expect, it, vi } from 'vitest';

import type { WorkerBindings } from '../index';
import { normalizeAuthProductionOptions } from './production-configuration';
import { createOperationalDependencies } from './production-rate-limit';

const environment: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'rate-limit-coverage',
  SUPABASE_SECRET_KEY: 'sb_secret_rate_limit_coverage',
  SUPABASE_URL: 'https://supabase.example.test',
};

describe('authentication production rate-limit input coverage', () => {
  it('rejects every invalid limit or window before hashing or persistence', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const dependencies = createOperationalDependencies(
      normalizeAuthProductionOptions({ environment, fetchImpl }),
    );
    const request = new Request('https://api.example.test/auth');
    const base = {
      operationId: 'AUTH-API-01',
      request,
      authUserId: null,
      identifierDigest: null,
      limit: 10,
      windowSeconds: 60,
    };
    const invalidInputs = [
      { ...base, limit: 0 },
      { ...base, limit: 10_001 },
      { ...base, limit: 1.5 },
      { ...base, limit: Number.NaN },
      { ...base, windowSeconds: 0 },
      { ...base, windowSeconds: 86_401 },
      { ...base, windowSeconds: 1.5 },
      { ...base, windowSeconds: Number.NaN },
    ];
    for (const input of invalidInputs)
      await expect(
        dependencies.rateLimit(
          input,
          environment,
          new AbortController().signal,
        ),
      ).resolves.toMatchObject({
        ok: false,
        status: 400,
        code: 'INVALID_REQUEST',
        message: 'The authentication rate limit request is invalid.',
      });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
