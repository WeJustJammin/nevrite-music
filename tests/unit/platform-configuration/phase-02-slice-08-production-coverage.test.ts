import { describe, expect, it, vi } from 'vitest';

import type { AuthenticationSession } from '../../../apps/worker/src/authentication/types';
import type { WorkerBindings } from '../../../apps/worker/src/index';
import { createProductionRequestContextResolver } from '../../../apps/worker/src/platform-configuration/production-context';
import { configurationRpcFailure } from '../../../apps/worker/src/platform-configuration/production-error';
import {
  createProductionPlatformConfigurationDependencies,
  PLATFORM_CONFIGURATION_RPC,
} from '../../../apps/worker/src/platform-configuration/production';
import type { ConfigurationPortInput } from '../../../apps/worker/src/platform-configuration/types';

const environment: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'slice-08-production-coverage',
  SUPABASE_SECRET_KEY: 'sb_secret_slice_08_production_coverage',
  SUPABASE_URL: 'https://supabase.example.test',
};

const session: AuthenticationSession = {
  authUserId: '11111111-1111-4111-8111-111111111111',
  sessionId: '22222222-2222-4222-8222-222222222222',
  accountState: 'active',
  personId: '33333333-3333-4333-8333-333333333333',
  actingPartyId: '44444444-4444-4444-8444-444444444444',
  expiresAt: '2099-01-01T00:00:00.000Z',
  stepUpAt: '2098-12-31T23:59:00.000Z',
};

const jsonResponse = (value: unknown, status = 200): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const configurationInput = (
  operationId: ConfigurationPortInput['operationId'],
  overrides: Partial<ConfigurationPortInput> = {},
): ConfigurationPortInput => ({
  operationId,
  request: new Request('https://api.wejammin.test/admin/configuration'),
  session,
  body: {},
  ...overrides,
});

describe('Slice 08 production boundary coverage', () => {
  it('resolves an unverified input session with generated metadata and capabilities', async () => {
    const resolveSession = vi.fn(
      async (_request: Request, _env: WorkerBindings, signal: AbortSignal) => {
        expect(signal).toBeInstanceOf(AbortSignal);
        return { ok: true as const, value: session };
      },
    );
    const resolveCapabilities = vi.fn(
      async (
        resolvedSession: AuthenticationSession,
        request: Request,
        env: WorkerBindings,
        signal: AbortSignal,
      ) => {
        expect(resolvedSession).toBe(session);
        expect(request.url).toContain('/admin/configuration');
        expect(env).toBe(environment);
        expect(signal).toBeInstanceOf(AbortSignal);
        return ['admin.inbox.read'];
      },
    );
    const request = new Request(
      'https://api.wejammin.test/admin/configuration',
    );

    const result = await createProductionRequestContextResolver(
      { resolveSession },
      resolveCapabilities,
    )(request, environment);

    expect(resolveSession).toHaveBeenCalledWith(
      request,
      environment,
      expect.any(AbortSignal),
    );
    expect(resolveCapabilities).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      requestId: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
      ),
      correlationId: expect.any(String),
      userId: session.authUserId,
      actingPartyId: session.actingPartyId,
      capabilities: ['admin.inbox.read'],
    });
  });

  it('uses an injected verified session and defaults capabilities to empty', async () => {
    const resolveSession = vi.fn();
    const request = new Request(
      'https://api.wejammin.test/admin/configuration',
      {
        headers: {
          'x-request-id': session.authUserId,
          'x-correlation-id': session.sessionId,
        },
      },
    );
    const signal = new AbortController().signal;

    const result = await createProductionRequestContextResolver({
      resolveSession,
    })(request, environment, signal, session);

    expect(resolveSession).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      requestId: session.authUserId,
      correlationId: session.sessionId,
      userId: session.authUserId,
      capabilities: [],
    });
  });

  it('returns null when session resolution fails before capability lookup', async () => {
    const resolveSession = vi.fn(async () => ({
      ok: false as const,
      status: 401 as const,
      code: 'UNAUTHENTICATED',
      message: 'The authentication session is invalid.',
    }));
    const resolveCapabilities = vi.fn();

    const result = await createProductionRequestContextResolver(
      { resolveSession },
      resolveCapabilities,
    )(
      new Request('https://api.wejammin.test/admin/configuration'),
      environment,
      new AbortController().signal,
    );

    expect(result).toBeNull();
    expect(resolveCapabilities).not.toHaveBeenCalled();
  });

  it('maps the 504 fallback and bounded retry hint', () => {
    expect(
      configurationRpcFailure(
        null,
        504,
        new Response('', { headers: { 'retry-after': '86400' } }),
      ),
    ).toMatchObject({
      ok: false,
      status: 504,
      code: 'UPSTREAM_TIMEOUT',
      retryAfterSeconds: 86_400,
    });
  });

  it('rejects malformed capability-key payloads', async () => {
    for (const payload of [
      Array.from({ length: 65 }, () => 'admin.inbox.read'),
      ['admin.inbox.read', 'Admin.inbox.read'],
      ['admin.inbox.read', 'admin.inbox.read'],
    ]) {
      const fetchImpl = vi.fn(async () => jsonResponse(payload));
      const dependencies = createProductionPlatformConfigurationDependencies({
        environment,
        fetchImpl: fetchImpl as typeof fetch,
      });

      await expect(
        dependencies.readCapabilityKeys!(
          session,
          new Request('https://api.wejammin.test/admin/configuration'),
          environment,
          new AbortController().signal,
        ),
      ).rejects.toMatchObject({
        ok: false,
        status: 503,
        code: 'DEPENDENCY_UNAVAILABLE',
      });
    }
  });

  it('preserves an aborted capability lookup error', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new DOMException('aborted', 'AbortError');
    });
    const dependencies = createProductionPlatformConfigurationDependencies({
      environment,
      fetchImpl: fetchImpl as typeof fetch,
    });
    const controller = new AbortController();
    controller.abort();

    await expect(
      dependencies.readCapabilityKeys!(
        session,
        new Request('https://api.wejammin.test/admin/configuration'),
        environment,
        controller.signal,
      ),
    ).rejects.toMatchObject({
      ok: false,
      status: 504,
      code: 'DEPENDENCY_TIMEOUT',
    });
  });

  it('routes capability actions through the production RPC dependency', async () => {
    const response = {
      grantId: '55555555-5555-4555-8555-555555555555',
      subjectPersonId: session.personId,
      capabilityKey: 'admin.inbox.read',
      resourceType: 'admin_task',
      resourceId: '66666666-6666-4666-8666-666666666666',
      state: 'active',
      startsAt: '2026-09-02T03:00:00.000Z',
      endsAt: '2026-09-03T03:00:00.000Z',
      version: '1',
      notificationTaskId: '66666666-6666-4666-8666-666666666666',
      outboxEventId: '77777777-7777-4777-8777-777777777777',
    };
    const fetchImpl = vi.fn(async () => jsonResponse(response));
    const dependencies = createProductionPlatformConfigurationDependencies({
      environment,
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(
      dependencies.capabilityAction!(
        configurationInput('CFG-05B-04', {
          body: { action: 'create', capabilityKey: 'admin.inbox.read' },
        }),
        environment,
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: true, value: response });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining(
        `/rest/v1/rpc/${PLATFORM_CONFIGURATION_RPC.capabilityAction}`,
      ),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('defers diagnostic runs without calling persistence', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}));
    const dependencies = createProductionPlatformConfigurationDependencies({
      environment,
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(
      dependencies.auditDiagnostic!(
        configurationInput('CFG-05B-05', {
          body: { action: 'run_diagnostic' },
        }),
        environment,
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 422,
      code: 'INVALID_REQUEST',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
