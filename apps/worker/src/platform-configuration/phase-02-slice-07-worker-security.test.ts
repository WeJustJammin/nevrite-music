import { createLogger } from '@wejammin/observability/logging';
import { describe, expect, it, vi } from 'vitest';

import { createWorkerApp } from '../index';
import type {
  ConfigurationPort,
  PlatformConfigurationDependencies,
} from './types';

const definitionId = '018f2f72-4b5a-7c9d-8e1f-123456789abc';
const victimPartyId = '018f2f72-4b5a-7c9d-8e1f-123456789abd';
const actorId = '018f2f72-4b5a-7c9d-8e1f-123456789abe';
const sessionId = '018f2f72-4b5a-7c9d-8e1f-123456789abf';
const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

const validDefinition = {
  key: 'profile.visibility',
  valueKind: 'boolean',
  schema: { type: 'boolean' },
  ownerCapability: 'settings.profile.write',
  allowedScopes: ['platform', 'party'],
  precedence: ['party', 'platform'],
  mergeMode: 'replace',
  defaultSource: 'literal',
  defaultValue: false,
  riskClass: 'high',
  approverPolicy: {
    minimumDistinct: 2,
    requiresMfa: true,
    requiresCanary: true,
    notifyCapabilities: ['settings.profile.read'],
  },
  consumerKeys: ['web.profile'],
  contractRelease: 'phase-2.7',
  sensitivity: 'internal',
  reason: 'Register governed profile visibility.',
} as const;

const validProposal = {
  scopeType: 'party',
  scopeId: definitionId,
  environment: 'production',
  typedValue: true,
  interval: {
    effectiveFrom: '2026-09-02T03:00:00.000Z',
    effectiveTo: '2026-09-03T03:00:00.000Z',
  },
  expectedDefinitionVersion: '1',
  impactManifest: { consumers: ['web.profile'] },
  rollbackCandidate: false,
  reason: 'Enable the governed profile projection.',
  consumerKeys: ['web.profile'],
} as const;

type Harness = Readonly<{
  app: ReturnType<typeof createWorkerApp>;
  auth: {
    resolveSession: ReturnType<typeof vi.fn>;
    rateLimit: ReturnType<typeof vi.fn>;
  };
  port: ReturnType<typeof vi.fn>;
  configuration: PlatformConfigurationDependencies;
}>;

const session = (stepUpAt: string | null = new Date().toISOString()) => ({
  authUserId: actorId,
  sessionId,
  accountState: 'active' as const,
  personId: actorId,
  actingPartyId: definitionId,
  expiresAt,
  stepUpAt,
});

const makeHarness = (
  options: Readonly<{
    stepUpAt?: string | null;
    resolveReleasePrincipal?: PlatformConfigurationDependencies['resolveReleasePrincipal'];
    resolveServiceConsumer?: PlatformConfigurationDependencies['resolveServiceConsumer'];
  }> = {},
): Harness => {
  const port: ReturnType<typeof vi.fn> = vi.fn<ConfigurationPort>(() =>
    Promise.resolve({
      ok: false as const,
      status: 503 as const,
      code: 'DEPENDENCY_UNAVAILABLE',
      message: 'test port should not be reached',
    }),
  );
  const auth = {
    resolveSession: vi.fn(async () => ({
      ok: true as const,
      value: session(options.stepUpAt),
    })),
    rateLimit: vi.fn(async () => ({
      ok: true as const,
      value: {
        allowed: true,
        limit: 100,
        remaining: 99,
        resetAt: 2_000_000_000,
      },
    })),
  };
  const configuration = {
    registerDefinition: port,
    resolveEffectiveValue: port,
    proposeChange: port,
    changeAction: port,
    ...(options.resolveReleasePrincipal === undefined
      ? {}
      : { resolveReleasePrincipal: options.resolveReleasePrincipal }),
    ...(options.resolveServiceConsumer === undefined
      ? {}
      : { resolveServiceConsumer: options.resolveServiceConsumer }),
  } as PlatformConfigurationDependencies;
  const app = createWorkerApp({
    auth: auth as never,
    captureException: () => undefined,
    createLogger: () =>
      createLogger({
        environment: 'test',
        release: 'slice-07-security',
        service: 'worker',
      }),
    now: () => Date.now(),
    platformConfiguration: configuration,
  });
  return { app, auth, port, configuration };
};

const request = (
  path: string,
  init: RequestInit & Readonly<{ body?: string }> = {},
) =>
  new Request(`https://api.wejammin.test${path}`, {
    ...init,
    headers: {
      origin: 'https://api.wejammin.test',
      ...(init.headers ?? {}),
    },
  });

const releaseHeaders = {
  authorization: 'Bearer forged-browser-token',
  'content-type': 'application/json',
  'idempotency-key': 'security-release-001',
  'x-release-principal': 'release.ci',
  'x-release-signature': 'syntactically-valid-but-forged',
};

const serviceHeaders = {
  'x-worker-consumer': 'consumer.web',
  'x-consumer-key': 'web.profile',
  'x-worker-signature': 'syntactically-valid-but-forged',
};

describe('Slice 07 Worker security boundary', () => {
  it('does not treat syntactically valid release headers as authentication', async () => {
    const resolveReleasePrincipal = vi.fn(async () => ({
      ok: false as const,
      status: 401 as const,
      code: 'UNAUTHENTICATED',
      message: 'Release signature verification failed.',
    }));
    const harness = makeHarness({ resolveReleasePrincipal });

    const response = await harness.app.request(
      request('/api/v1/internal/config/definitions', {
        method: 'POST',
        headers: releaseHeaders,
        body: JSON.stringify(validDefinition),
      }),
    );

    expect(response.status).toBe(401);
    expect(resolveReleasePrincipal).toHaveBeenCalledOnce();
    expect(harness.port).not.toHaveBeenCalled();
  });

  it('does not treat syntactically valid service-consumer headers as authentication', async () => {
    const resolveServiceConsumer = vi.fn(async () => ({
      ok: false as const,
      status: 401 as const,
      code: 'UNAUTHENTICATED',
      message: 'Service signature verification failed.',
    }));
    const harness = makeHarness({ resolveServiceConsumer });

    const response = await harness.app.request(
      request(
        '/api/v1/config/profile.visibility/effective?consumerKey=web.profile&supportedDefinitionVersions=1',
        { headers: serviceHeaders },
      ),
    );

    expect(response.status).toBe(401);
    expect(resolveServiceConsumer).toHaveBeenCalledOnce();
    expect(harness.port).not.toHaveBeenCalled();
  });

  it('fails closed when the release verifier is not injected', async () => {
    const harness = makeHarness();
    const response = await harness.app.request(
      request('/api/v1/internal/config/definitions', {
        method: 'POST',
        headers: releaseHeaders,
        body: JSON.stringify(validDefinition),
      }),
    );

    expect(response.status).toBe(503);
    expect(harness.port).not.toHaveBeenCalled();
  });

  it('rejects a stale step-up before the proposal port', async () => {
    const harness = makeHarness({
      stepUpAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    });
    const response = await harness.app.request(
      request(`/api/v1/admin/settings/${definitionId}/changes`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer verified-session',
          'content-type': 'application/json',
          'idempotency-key': 'security-proposal-001',
        },
        body: JSON.stringify(validProposal),
      }),
    );

    expect(response.status).toBe(401);
    expect(harness.port).not.toHaveBeenCalled();
  });

  it.each([
    [
      'party',
      `/api/v1/config/profile.visibility/effective?consumerKey=web.profile&partyId=${victimPartyId}&supportedDefinitionVersions=1`,
    ],
    [
      'user',
      `/api/v1/config/profile.visibility/effective?consumerKey=web.profile&userId=${victimPartyId}&supportedDefinitionVersions=1`,
    ],
  ] as const)(
    'rejects a cross-%s effective-value context before the port',
    async (_scope, path) => {
      const harness = makeHarness();
      const response = await harness.app.request(
        request(path, {
          headers: { authorization: 'Bearer verified-session' },
        }),
      );

      expect(response.status).toBe(403);
      expect(harness.port).not.toHaveBeenCalled();
    },
  );

  it('rejects a proposal for a party outside the verified acting context', async () => {
    const harness = makeHarness();
    const response = await harness.app.request(
      request(`/api/v1/admin/settings/${definitionId}/changes`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer verified-session',
          'content-type': 'application/json',
          'idempotency-key': 'security-proposal-002',
        },
        body: JSON.stringify({ ...validProposal, scopeId: victimPartyId }),
      }),
    );

    expect(response.status).toBe(403);
    expect(harness.port).not.toHaveBeenCalled();
  });

  it('uses the identity returned by the verified service resolver at the port', async () => {
    const resolveServiceConsumer = vi.fn(async () => ({
      ok: true as const,
      value: { principalId: 'verified.worker', consumerKey: 'web.profile' },
    }));
    const harness = makeHarness({ resolveServiceConsumer });
    const response = await harness.app.request(
      request(
        '/api/v1/config/profile.visibility/effective?consumerKey=web.profile&supportedDefinitionVersions=1',
        {
          headers: {
            ...serviceHeaders,
            'x-worker-consumer': 'verified.worker',
          },
        },
      ),
    );

    expect(response.status).toBe(503);
    expect(harness.port).toHaveBeenCalledOnce();
    expect(harness.port.mock.calls[0]?.[0]).toMatchObject({
      servicePrincipalId: 'verified.worker',
      serviceConsumerKey: 'web.profile',
    });
  });
});
