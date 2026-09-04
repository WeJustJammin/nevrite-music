import { describe, expect, it, vi } from 'vitest';

import { authError } from '../authentication/boundary';
import type { AuthenticationDependencies } from '../authentication/types';
import {
  configurationOperation,
  parseConfigurationBody,
  parseConfigurationCommandHeaders,
  parseConfigurationPath,
  parseEffectiveQuery,
  requireConfigurationSession,
} from './route-support';
import {
  makeContext,
  request,
  sessionAuth,
} from './phase-02-slice-07-route-runtime-coverage.test-support';
import { jsonRequest, sessionFor } from './phase-02-slice-07.test-support';

describe('Slice 07 route support parsing and verified sessions', () => {
  it('parses command bodies, paths, headers, and effective queries with strict rejection', async () => {
    const context = makeContext(request('/')).context;
    configurationOperation(context, 'CFG-05A-03');
    expect(context.get('operation')).toBe('CFG-05A-03');

    const bodySchema = {
      safeParse: (value: unknown) => ({ success: true as const, data: value }),
    };
    await expect(
      parseConfigurationBody(
        jsonRequest('POST', '/', { value: true }),
        bodySchema,
      ),
    ).resolves.toEqual({ ok: true, value: { value: true } });

    const invalidBodySchema = {
      safeParse: () => ({
        success: false as const,
        error: { issues: [{ path: ['value'], message: 'invalid_value' }] },
      }),
    };
    await expect(
      parseConfigurationBody(
        jsonRequest('POST', '/', { value: true }),
        invalidBodySchema,
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        ok: false,
        status: 422,
        code: 'VALIDATION_FAILED',
      }),
    );

    const pathSchema = {
      safeParse: (value: unknown) => ({ success: true as const, data: value }),
    };
    expect(parseConfigurationPath(pathSchema, 'profile.visibility')).toEqual({
      ok: true,
      value: 'profile.visibility',
    });
    expect(
      parseConfigurationPath(
        {
          safeParse: () => ({
            success: false as const,
            error: { issues: [{ path: ['key'], message: 'invalid_key' }] },
          }),
        },
        'bad key',
      ),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        status: 400,
        code: 'INVALID_REQUEST',
      }),
    );

    expect(
      parseConfigurationCommandHeaders(
        request('/', { headers: { 'idempotency-key': 'direct-command' } }),
      ),
    ).toEqual({ ok: true, value: { idempotencyKey: 'direct-command' } });
    expect(
      parseConfigurationCommandHeaders(
        request('/', {
          headers: { 'idempotency-key': 'direct-if-match', 'if-match': '"17"' },
        }),
      ),
    ).toEqual({
      ok: true,
      value: { idempotencyKey: 'direct-if-match', ifMatch: '17' },
    });
    expect(
      parseConfigurationCommandHeaders(
        request('/', {
          headers: { 'idempotency-key': 'bad-if-match', 'if-match': '17' },
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        status: 400,
        code: 'INVALID_REQUEST',
      }),
    );

    expect(
      parseEffectiveQuery(
        request(
          '/?environment=production&consumerKey=web.profile&supportedDefinitionVersions=1',
        ),
        'profile.visibility',
      ),
    ).toEqual({
      ok: true,
      value: {
        key: 'profile.visibility',
        environment: 'production',
        consumerKey: 'web.profile',
        supportedDefinitionVersions: ['1'],
      },
    });
    expect(
      parseEffectiveQuery(
        request(
          '/?unknown=value&consumerKey=web.profile&supportedDefinitionVersions=1',
        ),
        'profile.visibility',
      ),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        status: 400,
        code: 'INVALID_REQUEST',
      }),
    );
    expect(
      parseEffectiveQuery(
        request('/?consumerKey=web.profile&supportedDefinitionVersions='),
        'profile.visibility',
      ),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        status: 400,
        code: 'INVALID_REQUEST',
      }),
    );
    expect(
      parseEffectiveQuery(
        request(
          '/?consumerKey=web.profile&supportedDefinitionVersions=1&supportedDefinitionVersions=2',
        ),
        'profile.visibility',
      ),
    ).toEqual(expect.objectContaining({ ok: true }));
    expect(
      parseEffectiveQuery(
        request(
          '/?environment=production&environment=staging&consumerKey=web.profile&supportedDefinitionVersions=1',
        ),
        'profile.visibility',
      ),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        status: 400,
        code: 'INVALID_REQUEST',
      }),
    );
  });

  it('handles the defensive zero-value query collection branch', () => {
    let supportedCalls = 0;
    const originalGetAll = URLSearchParams.prototype.getAll;
    const getAllSpy = vi
      .spyOn(URLSearchParams.prototype, 'getAll')
      .mockImplementation(function (this: URLSearchParams, key: string) {
        const values = originalGetAll.call(this, key);
        if (key === 'supportedDefinitionVersions' && supportedCalls++ === 0)
          return [];
        return values;
      });

    try {
      expect(
        parseEffectiveQuery(
          request('/?consumerKey=web.profile&supportedDefinitionVersions=1'),
          'profile.visibility',
        ),
      ).toEqual(expect.objectContaining({ ok: false, status: 400 }));
    } finally {
      getAllSpy.mockRestore();
    }
  });

  it('handles a defensive non-single scalar query collection', () => {
    let environmentCalls = 0;
    const originalGetAll = URLSearchParams.prototype.getAll;
    const getAllSpy = vi
      .spyOn(URLSearchParams.prototype, 'getAll')
      .mockImplementation(function (this: URLSearchParams, key: string) {
        const values = originalGetAll.call(this, key);
        if (key === 'environment' && environmentCalls++ === 1)
          return [...values, 'duplicate'];
        return values;
      });

    try {
      expect(
        parseEffectiveQuery(
          request(
            '/?environment=production&consumerKey=web.profile&supportedDefinitionVersions=1',
          ),
          'profile.visibility',
        ),
      ).toEqual(expect.objectContaining({ ok: true }));
    } finally {
      getAllSpy.mockRestore();
    }
  });

  it('requires a verified current session and acting context', async () => {
    const session = sessionFor(401);
    const validAuth = sessionAuth({ ok: true, value: session });

    const missing = await requireConfigurationSession(
      makeContext(request('/')).context,
      validAuth,
      false,
    );
    expect(missing).toEqual(
      expect.objectContaining({ ok: false, status: 401 }),
    );

    const noAuth = await requireConfigurationSession(
      makeContext(
        request('/', { headers: { authorization: 'Bearer verified' } }),
      ).context,
      undefined,
      false,
    );
    expect(noAuth).toEqual(
      expect.objectContaining({
        ok: false,
        status: 503,
        code: 'DEPENDENCY_UNAVAILABLE',
      }),
    );

    const cookieSession = await requireConfigurationSession(
      makeContext(
        request('/', { headers: { cookie: 'wj_session_ref=verified' } }),
      ).context,
      validAuth,
      false,
    );
    expect(cookieSession).toEqual({ ok: true, value: session });

    const incomplete = await requireConfigurationSession(
      makeContext(
        request('/', { headers: { authorization: 'Bearer verified' } }),
      ).context,
      sessionAuth({ ok: true, value: { ...session, actingPartyId: null } }),
      true,
    );
    expect(incomplete).toEqual(
      expect.objectContaining({ ok: false, status: 403 }),
    );

    const expired = await requireConfigurationSession(
      makeContext(
        request('/', { headers: { authorization: 'Bearer verified' } }),
      ).context,
      sessionAuth({
        ok: true,
        value: {
          ...session,
          expiresAt: new Date(Date.now() - 1_000).toISOString(),
        },
      }),
      false,
    );
    expect(expired).toEqual(
      expect.objectContaining({ ok: false, status: 401 }),
    );

    const failed = authError(401, 'UNAUTHENTICATED', 'session rejected');
    const rejected = await requireConfigurationSession(
      makeContext(
        request('/', { headers: { authorization: 'Bearer verified' } }),
      ).context,
      sessionAuth(failed),
      false,
    );
    expect(rejected).toBe(failed);

    const throws = await requireConfigurationSession(
      makeContext(
        request('/', { headers: { authorization: 'Bearer verified' } }),
      ).context,
      {
        resolveSession: vi.fn(async () => {
          throw new Error('auth down');
        }),
      } as unknown as AuthenticationDependencies,
      false,
    );
    expect(throws).toEqual(expect.objectContaining({ ok: false, status: 503 }));
  });
});
