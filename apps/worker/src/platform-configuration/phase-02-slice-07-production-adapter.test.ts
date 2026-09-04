import { describe, expect, it, vi } from 'vitest';

import type { WorkerBindings } from '../index';
import type { AuthenticationError } from '../authentication/types';
import {
  MAX_RESPONSE_BYTES,
  normalizeAuthProductionOptions,
} from '../authentication/production-configuration';
import {
  callConfiguration,
  callConfigurationRpc,
  configurationHeaders,
  configurationRpcFailure,
  readConfigurationJson,
} from './production-http';
import { configurationRequestHeaders } from './production-request';
import type { ConfigurationPortInput } from './types';
import {
  CORRELATION_ID,
  REQUEST_ID,
  definitionId,
  sessionFor,
} from './phase-02-slice-07.test-support';

const environment: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'slice-07-production-adapter',
  SUPABASE_SECRET_KEY: 'sb_secret_slice_07_adapter',
  SUPABASE_URL: 'https://supabase.example.test///',
};

const request = new Request('https://api.wejammin.test/configuration', {
  headers: {
    'x-request-id': REQUEST_ID,
    'x-correlation-id': CORRELATION_ID,
  },
});

const json = (value: unknown, status = 200, headers?: HeadersInit): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

const configFor = (fetchImpl: typeof fetch) =>
  normalizeAuthProductionOptions({ environment, fetchImpl });

const portInput = (
  overrides: Partial<ConfigurationPortInput> = {},
): ConfigurationPortInput => ({
  operationId: 'CFG-05A-01',
  request,
  body: { setting: true },
  path: { definitionId, reviewId: definitionId, key: 'profile.visibility' },
  query: { key: 'profile.visibility', consumerKey: 'web.profile' },
  idempotencyKey: 'adapter-idem',
  ifMatch: '7',
  session: sessionFor(1),
  servicePrincipalId: 'verified.release',
  serviceConsumerKey: 'web.profile',
  ...overrides,
});

const expectAuthError = async (
  result: Promise<unknown>,
  status: number,
  code: string,
): Promise<void> => {
  await expect(result).resolves.toMatchObject({ ok: false, status, code });
};

describe('Phase 2 Slice 07 production adapter boundaries', () => {
  it('maps provider error candidates, retry-after values, and HTTP fallbacks', () => {
    const recognized: ReadonlyArray<readonly [string, number, string]> = [
      ['IDEMPOTENCY_MISMATCH', 409, 'IDEMPOTENCY_CONFLICT'],
      ['VERSION_MISMATCH', 409, 'VERSION_CONFLICT'],
      ['STALE_DEFINITION', 409, 'STALE_DEFINITION'],
      ['APPROVAL_INVALID', 422, 'APPROVAL_INVALID'],
      ['SNAPSHOT_UNAVAILABLE', 503, 'SNAPSHOT_UNAVAILABLE'],
      ['VALUE_UNAVAILABLE', 503, 'VALUE_UNAVAILABLE'],
      ['DISALLOWED_CONTEXT', 422, 'DISALLOWED_CONTEXT'],
      ['DEFINITION_NOT_FOUND', 404, 'DEFINITION_NOT_FOUND'],
      ['REVIEW_NOT_FOUND', 404, 'REVIEW_NOT_FOUND'],
      ['STEP_UP_REQUIRED', 401, 'STEP_UP_REQUIRED'],
      ['UNAUTHENTICATED', 401, 'UNAUTHENTICATED'],
      ['FORBIDDEN', 403, 'FORBIDDEN'],
      ['PROTECTED_SETTING', 422, 'PROTECTED_SETTING'],
      ['INVALID_DEFINITION', 422, 'INVALID_DEFINITION'],
      ['VALUE_INVALID', 422, 'VALUE_INVALID'],
      ['INVALID_REQUEST', 400, 'INVALID_REQUEST'],
      ['RATE_LIMITED', 429, 'RATE_LIMITED'],
    ];
    for (const [needle, status, code] of recognized) {
      expect(configurationRpcFailure({ message: needle }, 500)).toMatchObject({
        ok: false,
        status,
        code,
      });
    }
    expect(configurationRpcFailure({ code: 'nested' }, 500)).toMatchObject({
      status: 503,
      code: 'VALUE_UNAVAILABLE',
    });
    expect(
      configurationRpcFailure(
        { error: { code: 'FORBIDDEN', errorCode: 'ignored', message: 'safe' } },
        500,
        new Response('', { headers: { 'retry-after': '30' } }),
      ),
    ).toMatchObject({ status: 403, code: 'FORBIDDEN', retryAfterSeconds: 30 });
    for (const value of [null, 42, 'provider text', {}]) {
      expect(configurationRpcFailure(value, 500)).toMatchObject({
        status: 503,
        code: 'VALUE_UNAVAILABLE',
      });
    }
    for (const [status, code] of [
      [401, 'UNAUTHENTICATED'],
      [403, 'FORBIDDEN'],
      [404, 'NOT_FOUND'],
      [409, 'VERSION_CONFLICT'],
      [429, 'RATE_LIMITED'],
      [502, 'UPSTREAM_FAILURE'],
      [503, 'VALUE_UNAVAILABLE'],
    ] as const) {
      expect(configurationRpcFailure(null, status)).toMatchObject({
        status,
        code,
      });
    }
    for (const retryAfter of [null, '1.5', '86401']) {
      expect(
        configurationRpcFailure(
          null,
          500,
          new Response(
            '',
            retryAfter === null
              ? undefined
              : {
                  headers: { 'retry-after': retryAfter },
                },
          ),
        ),
      ).not.toHaveProperty('retryAfterSeconds');
    }
  });

  it('builds authenticated provider headers and parses bounded JSON', async () => {
    expect(configurationHeaders(configFor(fetch), portInput())).toEqual({
      Accept: 'application/json',
      'Accept-Profile': 'platform_api',
      'Content-Profile': 'platform_api',
      'Content-Type': 'application/json',
      apikey: environment.SUPABASE_SECRET_KEY,
      'X-Operation-Id': 'CFG-05A-01',
      'X-Request-Id': REQUEST_ID,
      'X-Correlation-Id': CORRELATION_ID,
      'X-Idempotency-Key': 'adapter-idem',
      'If-Match': '"7"',
      'X-Release-Principal': 'verified.release',
    });
    expect(
      configurationHeaders(configFor(fetch), {
        operationId: 'CFG-05A-02',
        request,
      }),
    ).not.toHaveProperty('X-Idempotency-Key');
    expect(configurationRequestHeaders(portInput())).toMatchObject({
      'X-Operation-Id': 'CFG-05A-01',
      'X-Request-Id': REQUEST_ID,
      'X-Correlation-Id': CORRELATION_ID,
      'X-Idempotency-Key': 'adapter-idem',
      'If-Match': '7',
    });
    expect(
      configurationRequestHeaders({ operationId: 'CFG-05A-02', request }),
    ).toEqual({
      'X-Operation-Id': 'CFG-05A-02',
      'X-Request-Id': REQUEST_ID,
      'X-Correlation-Id': CORRELATION_ID,
    });
    await expect(readConfigurationJson(json({ value: 1 }))).resolves.toEqual({
      value: 1,
    });
    await expect(
      readConfigurationJson(new Response('{bad')),
    ).rejects.toMatchObject({
      status: 502,
      code: 'UPSTREAM_FAILURE',
    });
    await expect(
      readConfigurationJson(new Response('x'.repeat(MAX_RESPONSE_BYTES + 1))),
    ).rejects.toMatchObject({ status: 502, code: 'UPSTREAM_FAILURE' });
  });

  it('covers RPC canonicalization, transport failures, and response validation', async () => {
    const replay = vi.fn(async () => json([{ replayed: true, value: 1 }]));
    await expect(
      callConfigurationRpc(
        configFor(replay as typeof fetch),
        'cfg_replay',
        {},
        portInput(),
        new AbortController().signal,
      ),
    ).resolves.toEqual({ value: 1 });
    for (const payload of [
      [{ value: 1 }, { value: 2 }],
      { replayed: false, value: 1 },
      null,
      'primitive',
    ]) {
      await expect(
        callConfigurationRpc(
          configFor(vi.fn(async () => json(payload)) as typeof fetch),
          'cfg_value',
          {},
          portInput(),
          new AbortController().signal,
        ),
      ).resolves.toEqual(payload);
    }
    for (const error of [
      new DOMException('aborted', 'AbortError'),
      Object.assign(new Error('aborted'), { name: 'AbortError' }),
      new Error('socket closed'),
    ]) {
      await expectAuthError(
        callConfiguration(
          configFor(
            vi.fn(async () => {
              throw error;
            }) as typeof fetch,
          ),
          'cfg_failure',
          {},
          portInput(),
          new AbortController().signal,
          { safeParse: (value) => ({ success: true as const, data: value }) },
        ),
        error.name === 'AbortError' ? 504 : 503,
        error.name === 'AbortError' ? 'UPSTREAM_TIMEOUT' : 'VALUE_UNAVAILABLE',
      );
    }
    await expectAuthError(
      callConfiguration(
        configFor(
          vi.fn(async () =>
            json({ message: 'VERSION_MISMATCH' }, 409, { 'retry-after': '9' }),
          ) as typeof fetch,
        ),
        'cfg_error',
        {},
        portInput(),
        new AbortController().signal,
        { safeParse: (value) => ({ success: true as const, data: value }) },
      ),
      409,
      'VERSION_CONFLICT',
    );
    await expectAuthError(
      callConfiguration(
        configFor(
          vi.fn(
            async () => new Response('not-json', { status: 502 }),
          ) as typeof fetch,
        ),
        'cfg_error',
        {},
        portInput(),
        new AbortController().signal,
        { safeParse: () => ({ success: true as const, data: null }) },
      ),
      502,
      'UPSTREAM_FAILURE',
    );
    await expect(
      callConfiguration(
        configFor(vi.fn(async () => json({ value: 7 })) as typeof fetch),
        'cfg_valid',
        {},
        portInput(),
        new AbortController().signal,
        { safeParse: (value) => ({ success: true as const, data: value }) },
      ),
    ).resolves.toEqual({ ok: true, value: { value: 7 } });
    await expectAuthError(
      callConfiguration(
        configFor(vi.fn(async () => json({ value: 7 })) as typeof fetch),
        'cfg_invalid',
        {},
        portInput(),
        new AbortController().signal,
        { safeParse: () => ({ success: false as const }) },
      ),
      502,
      'UPSTREAM_FAILURE',
    );
    const preserved: AuthenticationError = {
      ok: false,
      status: 409,
      code: 'VERSION_CONFLICT',
      message: 'preserved',
    };
    await expect(
      callConfiguration(
        configFor(vi.fn(async () => json({ value: 7 })) as typeof fetch),
        'cfg_schema_throw',
        {},
        portInput(),
        new AbortController().signal,
        {
          safeParse: () => {
            throw preserved;
          },
        },
      ),
    ).resolves.toBe(preserved);
    await expectAuthError(
      callConfiguration(
        configFor(vi.fn(async () => json({ value: 7 })) as typeof fetch),
        'cfg_schema_throw',
        {},
        portInput(),
        new AbortController().signal,
        {
          safeParse: () => {
            throw new Error('schema broke');
          },
        },
      ),
      503,
      'VALUE_UNAVAILABLE',
    );
  });
});
