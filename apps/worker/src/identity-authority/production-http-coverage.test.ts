import { describe, expect, it, vi } from 'vitest';

import type { AuthProductionConfiguration } from '../authentication/production-configuration';
import { normalizeAuthProductionOptions } from '../authentication/production-configuration';
import { callIdentity, callIdentityRpc } from './production-http';

const environment = {
  APP_ENVIRONMENT: 'development',
  APP_RELEASE: 'local',
  SUPABASE_SECRET_KEY: 'sb_secret_local_only',
  SUPABASE_URL: 'https://identity.example.test///',
} as const;

const json = (value: unknown, status = 200): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const configuration = (fetchImpl: typeof fetch): AuthProductionConfiguration =>
  normalizeAuthProductionOptions({ environment, fetchImpl });

const failure = (
  result: unknown,
): { ok: false; code: string; status: number } => {
  expect(result).toMatchObject({ ok: false });
  return result as { ok: false; code: string; status: number };
};

describe('identity production HTTP adapter', () => {
  it('posts an RPC with the platform profile and parses its JSON response', async () => {
    const fetchImpl = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        expect(String(input)).toBe(
          'https://identity.example.test/rest/v1/rpc/identity_facet_add',
        );
        expect(init?.method).toBe('POST');
        expect(init?.signal).toBeInstanceOf(AbortSignal);
        expect(init?.headers).toEqual({
          Accept: 'application/json',
          'Accept-Profile': 'platform_api',
          apikey: environment.SUPABASE_SECRET_KEY,
          'Content-Profile': 'platform_api',
          'Content-Type': 'application/json',
        });
        expect(init?.body).toBe(JSON.stringify({ p_facet_code: 'performer' }));
        return json({ personId: 'ok' });
      },
    ) as typeof fetch;

    const result = await callIdentityRpc(
      configuration(fetchImpl),
      'identity_facet_add',
      { p_facet_code: 'performer' },
      new AbortController().signal,
    );
    expect(result).toEqual({ personId: 'ok' });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('maps known RPC failures and falls back for unknown or malformed payloads', async () => {
    const cases: ReadonlyArray<readonly [unknown, number, string]> = [
      [{ message: 'HANDLE_TAKEN: duplicate' }, 409, 'HANDLE_TAKEN'],
      [{ message: 42 }, 503, 'DEPENDENCY_UNAVAILABLE'],
      [{}, 503, 'DEPENDENCY_UNAVAILABLE'],
      [null, 503, 'DEPENDENCY_UNAVAILABLE'],
      ['plain text', 503, 'DEPENDENCY_UNAVAILABLE'],
    ];

    for (const [payload, status, code] of cases) {
      const fetchImpl = vi.fn(async () => json(payload, 409)) as typeof fetch;
      const result = await callIdentity(
        configuration(fetchImpl),
        'identity_alias_patch',
        {},
        new AbortController().signal,
        {
          safeParse: (value: unknown) => ({
            success: true as const,
            data: value,
          }),
        },
      );
      const error = failure(result);
      expect(error.status).toBe(status);
      expect(error.code).toBe(code);
    }
  });

  it('maps every public identity RPC error family', async () => {
    const messages = [
      'PERSON_ALREADY_EXISTS',
      'FACET_EXISTS',
      'FACET_UNKNOWN',
      'HANDLE_TAKEN',
      'HANDLE_QUOTA_EXCEEDED',
      'ALIAS_QUOTA_EXCEEDED',
      'ALIAS_NOT_FOUND',
      'TRANSFER_NOT_FOUND',
      'TRANSFER_EXPIRED',
      'TRANSFER_NOT_ALLOWED',
      'CONTEXT_NOT_FOUND',
      'CONTEXT_REVOKED',
      'CONTEXT_RECONFIRM_REQUIRED',
      'OPEN_OBLIGATION',
      'FACET_OBLIGATIONS_OPEN',
      'VERSION_MISMATCH',
      'FORBIDDEN',
      'NOT_FOUND',
    ] as const;

    for (const message of messages) {
      const fetchImpl = vi.fn(async () =>
        json({ message }, 400),
      ) as typeof fetch;
      const result = await callIdentityRpc(
        configuration(fetchImpl),
        'identity_test',
        {},
        new AbortController().signal,
      ).catch((error: unknown) => error);
      const error = failure(result);
      expect(error.code).toBe(message);
    }
  });

  it('treats unreadable, oversized, and unknown non-success responses as unavailable', async () => {
    const bodies = [
      '{not-json',
      'x'.repeat(256 * 1024 + 1),
      JSON.stringify({ message: 'UNMAPPED_FAILURE' }),
    ];

    for (const body of bodies) {
      const fetchImpl = vi.fn(
        async () => new Response(body, { status: 500 }),
      ) as typeof fetch;
      const result = await callIdentityRpc(
        configuration(fetchImpl),
        'identity_test',
        {},
        new AbortController().signal,
      ).catch((error: unknown) => error);
      const error = failure(result);
      expect(error.status).toBe(503);
      expect(error.code).toBe('DEPENDENCY_UNAVAILABLE');
    }
  });

  it('maps transport failures and preserves authentication errors', async () => {
    const transport = vi.fn(async () => {
      throw new Error('socket closed');
    }) as typeof fetch;
    const transportResult = await callIdentityRpc(
      configuration(transport),
      'identity_test',
      {},
      new AbortController().signal,
    ).catch((error: unknown) => error);
    expect(failure(transportResult)).toMatchObject({
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
    });

    const authFailure = {
      ok: false as const,
      status: 409 as const,
      code: 'CONFLICT',
      message: 'conflict',
    };
    const throwingSchema = {
      safeParse: (): never => {
        throw authFailure;
      },
    };
    const preserved = await callIdentity(
      configuration(vi.fn(async () => json({ ok: true })) as typeof fetch),
      'identity_test',
      {},
      new AbortController().signal,
      throwingSchema,
    );
    expect(preserved).toBe(authFailure);
  });

  it('returns validated data, rejects invalid data, and reports malformed success bodies', async () => {
    const validFetch = vi.fn(async () => json({ value: 7 })) as typeof fetch;
    const valid = await callIdentity(
      configuration(validFetch),
      'identity_test',
      {},
      new AbortController().signal,
      {
        safeParse: (value: unknown) => ({
          success: true as const,
          data: value as { value: number },
        }),
      },
    );
    expect(valid).toEqual({ ok: true, value: { value: 7 } });

    const invalid = await callIdentity(
      configuration(
        vi.fn(async () => json({ unexpected: true })) as typeof fetch,
      ),
      'identity_test',
      {},
      new AbortController().signal,
      { safeParse: () => ({ success: false as const }) },
    );
    expect(invalid).toMatchObject({
      ok: false,
      status: 502,
      code: 'DEPENDENCY_INVALID_RESPONSE',
    });

    const malformed = await callIdentity(
      configuration(
        vi.fn(
          async () => new Response('{bad', { status: 200 }),
        ) as typeof fetch,
      ),
      'identity_test',
      {},
      new AbortController().signal,
      {
        safeParse: (value: unknown) => ({
          success: true as const,
          data: value,
        }),
      },
    );
    expect(malformed).toMatchObject({
      ok: false,
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
    });
  });

  it('covers null and primitive errors thrown by response validation', async () => {
    const thrownValues: readonly unknown[] = [null, 'failure'];
    for (const thrown of thrownValues) {
      const result = await callIdentity(
        configuration(vi.fn(async () => json({ ok: true })) as typeof fetch),
        'identity_test',
        {},
        new AbortController().signal,
        {
          safeParse: (): never => {
            throw thrown;
          },
        },
      );
      expect(result).toMatchObject({
        ok: false,
        status: 503,
        code: 'DEPENDENCY_UNAVAILABLE',
      });
    }
  });
});
