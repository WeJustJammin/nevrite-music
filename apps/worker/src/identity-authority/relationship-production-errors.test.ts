import { describe, expect, it, vi } from 'vitest';

import type { AuthProductionConfiguration } from '../authentication/production-configuration';
import { normalizeAuthProductionOptions } from '../authentication/production-configuration';
import {
  callRelationship,
  callRelationshipRpc,
} from './relationship-production-http';

const environment = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'slice-04-relationship-errors',
  SUPABASE_SECRET_KEY: 'sb_secret_relationship_test',
  SUPABASE_URL: 'https://staging.example.supabase.co',
} as const;

const configuration = (fetchImpl: typeof fetch): AuthProductionConfiguration =>
  normalizeAuthProductionOptions({ environment, fetchImpl });

const json = (value: unknown, status: number): Response =>
  new Response(JSON.stringify(value), { status });

const failure = (
  value: unknown,
): Readonly<{ code: string; status: number }> => {
  expect(value).toMatchObject({ ok: false });
  return value as Readonly<{ code: string; status: number }>;
};

describe('relationship production error boundary', () => {
  it('uses safe status fallbacks for unclassified provider failures', async () => {
    const cases: ReadonlyArray<readonly [number, number, string]> = [
      [401, 401, 'UNAUTHENTICATED'],
      [403, 403, 'FORBIDDEN'],
      [404, 404, 'NOT_FOUND'],
      [409, 409, 'CONFLICT'],
      [429, 429, 'RATE_LIMITED'],
      [500, 503, 'DEPENDENCY_UNAVAILABLE'],
    ];
    for (const [status, expectedStatus, code] of cases) {
      const result = await callRelationshipRpc(
        configuration(
          vi.fn(async () =>
            json({ message: 'provider text' }, status),
          ) as typeof fetch,
        ),
        'relationship_test',
        {},
        new AbortController().signal,
      ).catch((error: unknown) => error);
      expect(failure(result)).toMatchObject({ status: expectedStatus, code });
    }
    const nullPayload = await callRelationshipRpc(
      configuration(vi.fn(async () => json(null, 500)) as typeof fetch),
      'relationship_test',
      {},
      new AbortController().signal,
    ).catch((error: unknown) => error);
    expect(failure(nullPayload)).toMatchObject({
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
    });
  });

  it('fails closed on transport, oversized, and replay-without-id responses', async () => {
    const unavailable = await callRelationshipRpc(
      configuration(
        vi.fn(async () => {
          throw new Error('socket closed');
        }) as typeof fetch,
      ),
      'relationship_test',
      {},
      new AbortController().signal,
    ).catch((error: unknown) => error);
    expect(failure(unavailable)).toMatchObject({
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
    });

    const oversized = await callRelationship(
      configuration(
        vi.fn(async () =>
          json('x'.repeat(128 * 1024 + 1), 200),
        ) as typeof fetch,
      ),
      'relationship_test',
      {},
      new AbortController().signal,
      { safeParse: () => ({ success: true as const, data: {} }) },
    );
    expect(failure(oversized)).toMatchObject({
      status: 502,
      code: 'DEPENDENCY_INVALID_RESPONSE',
    });

    const replayWithoutId = await callRelationship(
      configuration(
        vi.fn(async () => json({ replayed: true }, 200)) as typeof fetch,
      ),
      'relationship_test',
      {},
      new AbortController().signal,
      { safeParse: () => ({ success: false as const }) },
      {},
      {
        rpc: 'relationship_read',
        idField: 'organizationId',
        idParameter: 'p_organization_id',
        baseInput: {},
        headers: {},
      },
    );
    expect(failure(replayWithoutId)).toMatchObject({
      status: 502,
      code: 'DEPENDENCY_INVALID_RESPONSE',
    });
  });

  it('ignores malformed retry headers and non-object success payloads', async () => {
    const limited = await callRelationshipRpc(
      configuration(
        vi.fn(
          async () =>
            new Response(JSON.stringify({ message: 'RATE_LIMITED' }), {
              status: 429,
              headers: { 'retry-after': '99999' },
            }),
        ) as typeof fetch,
      ),
      'relationship_test',
      {},
      new AbortController().signal,
    ).catch((error: unknown) => error);
    expect(failure(limited)).toMatchObject({
      status: 429,
      code: 'RATE_LIMITED',
    });
    expect(limited).not.toHaveProperty('retryAfterSeconds');

    const primitive = await callRelationship(
      configuration(vi.fn(async () => json('unexpected', 200)) as typeof fetch),
      'relationship_test',
      {},
      new AbortController().signal,
      { safeParse: () => ({ success: false as const }) },
    );
    expect(failure(primitive)).toMatchObject({
      status: 502,
      code: 'DEPENDENCY_INVALID_RESPONSE',
    });
  });
});
