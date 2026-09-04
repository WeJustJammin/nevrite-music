import { describe, expect, it, vi } from 'vitest';

import type {
  AuthenticationError,
  AuthenticationSession,
} from '../authentication/types';
import type { ConfigurationPort } from './types';
import {
  definitionRequest,
  definitionId,
  definitionResponse,
  effectiveResponse,
  expectError,
  makeHarness,
  nextSession,
  otherId,
  proposal,
  proposalRequest,
  proposalResponse,
  releaseRequest,
  serviceEffectiveRequest,
} from './phase-02-slice-07.test-support';

describe('Phase 2 Slice 07 Worker route behavioral acceptance', () => {
  it('[P2-S07-AC-007,P2-S07-AC-051] uses the verified release identity and refuses browser-only release access', async () => {
    const port = vi.fn<ConfigurationPort>(async (input) => {
      expect(input.servicePrincipalId).toBe('verified.release');
      expect(input.session).toBeUndefined();
      expect(input.body).toEqual(definitionRequest);
      return { ok: true as const, value: definitionResponse };
    });
    const harness = makeHarness({ port });

    const verified = await harness.app.request(
      releaseRequest(definitionRequest),
    );
    expect(verified.status).toBe(201);
    expect(port).toHaveBeenCalledOnce();

    const browserOnly = await harness.app.request(
      releaseRequest(definitionRequest, {
        'x-release-principal': undefined,
        'x-release-signature': undefined,
      }),
    );
    await expectError(
      browserOnly,
      401,
      'UNAUTHENTICATED',
      'A valid release service credential is required.',
    );
    expect(port).toHaveBeenCalledOnce();
  });

  it.each([
    {
      criterion: 'P2-S07-AC-007,P2-S07-AC-051',
      options: {
        releasePrincipal: {
          ok: false as const,
          status: 401 as const,
          code: 'UNAUTHENTICATED',
          message: 'Release signature verification failed.',
        },
      },
      makeRequest: () => releaseRequest(definitionRequest),
      status: 401 as const,
      code: 'UNAUTHENTICATED',
      message: 'Release signature verification failed.',
    },
    {
      criterion: 'P2-S07-AC-011,P2-S07-AC-054',
      options: {
        serviceConsumer: {
          ok: false as const,
          status: 401 as const,
          code: 'UNAUTHENTICATED',
          message: 'Service signature verification failed.',
        },
      },
      makeRequest: serviceEffectiveRequest,
      status: 401 as const,
      code: 'UNAUTHENTICATED',
      message: 'Service signature verification failed.',
    },
  ] as const)(
    '[$criterion] does not promote syntactically valid release or service headers into authority',
    async ({ options, makeRequest, status, code, message }) => {
      const harness = makeHarness(options);

      const response = await harness.app.request(makeRequest());

      await expectError(response, status, code, message);
      expect(harness.port).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['P2-S07-AC-007,P2-S07-AC-051', 'release' as const],
    ['P2-S07-AC-011,P2-S07-AC-054', 'service' as const],
  ] as const)(
    '[%s] fails closed when the credential verifier is not configured',
    async (_criterion, kind) => {
      const harness = makeHarness(
        kind === 'release'
          ? { omitReleaseVerifier: true }
          : { omitServiceVerifier: true },
      );
      const response = await harness.app.request(
        kind === 'release'
          ? releaseRequest(definitionRequest)
          : serviceEffectiveRequest(),
      );

      await expectError(
        response,
        503,
        'DEPENDENCY_UNAVAILABLE',
        'Configuration authentication is temporarily unavailable.',
        { dependencyClass: `${kind}_verifier`, retryable: true },
      );
      expect(harness.port).not.toHaveBeenCalled();
    },
  );

  it('[P2-S07-AC-011,P2-S07-AC-054] passes the service identity returned by verification to the effective-value port', async () => {
    const port = vi.fn<ConfigurationPort>(async (input) => {
      expect(input.servicePrincipalId).toBe('verified.consumer');
      expect(input.serviceConsumerKey).toBe('web.profile');
      expect(input.session).toBeUndefined();
      expect(input.query).toEqual({
        key: 'profile.visibility',
        consumerKey: 'web.profile',
        supportedDefinitionVersions: ['1'],
      });
      return { ok: true as const, value: effectiveResponse };
    });
    const harness = makeHarness({ port });

    const response = await harness.app.request(serviceEffectiveRequest());

    expect(response.status).toBe(200);
    expect(port).toHaveBeenCalledOnce();
  });

  it('[P2-S07-AC-013,P2-S07-AC-019,P2-S07-AC-025,P2-S07-AC-054,P2-S07-AC-057,P2-S07-AC-060] binds human session, actor, party and scope at the route/port boundary', async () => {
    let received: Parameters<ConfigurationPort>[0] | undefined;
    const port = vi.fn<ConfigurationPort>(async (input) => {
      received = input;
      return { ok: true as const, value: proposalResponse };
    });
    const harness = makeHarness({ port });

    const response = await harness.app.request(proposalRequest());

    expect(response.status).toBe(201);
    expect(received?.session).toEqual(harness.session);
    expect(received?.body).toEqual(proposal);
    expect(received?.body).not.toHaveProperty('authUserId');
    expect(received?.body).not.toHaveProperty('actingPartyId');
    expect(received?.body).not.toHaveProperty('capability');
    expect(received?.path).toEqual({ definitionId });
    expect(port).toHaveBeenCalledOnce();
  });

  it('[P2-S07-AC-013,P2-S07-AC-019,P2-S07-AC-025,P2-S07-AC-054,P2-S07-AC-057,P2-S07-AC-060] rejects a forged human scope before the port and lets the port remain the capability authority', async () => {
    const forbidden: AuthenticationError = {
      ok: false,
      status: 403,
      code: 'FORBIDDEN',
      message: 'The action is not allowed.',
    };
    const port = vi.fn<ConfigurationPort>(async () => forbidden);
    const harness = makeHarness({ port });

    const forgedScope = await harness.app.request(
      proposalRequest({ ...proposal, scopeId: otherId }),
    );
    await expectError(
      forgedScope,
      403,
      'FORBIDDEN',
      'The requested configuration context is outside the verified acting context.',
    );
    expect(port).not.toHaveBeenCalled();

    const capabilityDenied = await harness.app.request(proposalRequest());
    await expectError(
      capabilityDenied,
      403,
      'FORBIDDEN',
      'The action is not allowed.',
    );
    expect(port).toHaveBeenCalledOnce();
  });

  it.each([
    ['P2-S07-AC-013,P2-S07-AC-019,P2-S07-AC-025', 'expired' as const],
    ['P2-S07-AC-013,P2-S07-AC-019,P2-S07-AC-025', 'missing-party' as const],
  ] as const)(
    '[%s] refuses an expired or incomplete human session before the configuration port',
    async (_criterion, variant) => {
      const session = nextSession();
      const invalidSession: AuthenticationSession =
        variant === 'expired'
          ? {
              ...session,
              expiresAt: new Date(Date.now() - 1_000).toISOString(),
            }
          : { ...session, actingPartyId: null };
      const harness = makeHarness({ session: invalidSession });

      const response = await harness.app.request(proposalRequest());

      if (variant === 'expired') {
        await expectError(
          response,
          401,
          'UNAUTHENTICATED',
          'The authentication session is invalid.',
        );
      } else {
        await expectError(
          response,
          403,
          'FORBIDDEN',
          'An acting context is required.',
        );
      }
      expect(harness.port).not.toHaveBeenCalled();
    },
  );

  it.each([
    [
      'P2-S07-AC-017,P2-S07-AC-053,P2-S07-AC-057,P2-S07-AC-059',
      'missing' as const,
    ],
    [
      'P2-S07-AC-017,P2-S07-AC-053,P2-S07-AC-057,P2-S07-AC-059',
      'wrong' as const,
    ],
  ] as const)(
    '[%s] enforces the cookie-authenticated CSRF boundary before a mutation port call',
    async (_criterion, csrfVariant) => {
      const harness = makeHarness();
      const headers = {
        cookie: `wj_session_ref=session-${csrfVariant}; wj_csrf=opaque-csrf-token`,
        ...(csrfVariant === 'wrong' ? { 'x-csrf-token': 'wrong-token' } : {}),
      };

      const response = await harness.app.request(
        proposalRequest(proposal, headers),
      );

      await expectError(
        response,
        403,
        'FORBIDDEN',
        'The CSRF token is invalid.',
      );
      expect(harness.port).not.toHaveBeenCalled();
    },
  );

  it('[P2-S07-AC-017,P2-S07-AC-053,P2-S07-AC-057,P2-S07-AC-059,P2-S07-AC-152] accepts a valid same-origin double-submit token and forwards the command', async () => {
    const port = vi.fn<ConfigurationPort>(async () => ({
      ok: true as const,
      value: proposalResponse,
    }));
    const harness = makeHarness({ port });

    const response = await harness.app.request(
      proposalRequest(proposal, {
        cookie: 'wj_session_ref=session-valid; wj_csrf=opaque-csrf-token',
        'x-csrf-token': 'opaque-csrf-token',
      }),
    );

    expect(response.status).toBe(201);
    expect(port).toHaveBeenCalledOnce();
  });

  it('[P2-S07-AC-017,P2-S07-AC-023,P2-S07-AC-053,P2-S07-AC-059,P2-S07-AC-062,P2-S07-AC-152] rejects a foreign origin before auth, CSRF or a configuration port call', async () => {
    const harness = makeHarness();

    const response = await harness.app.request(
      proposalRequest(proposal, { origin: 'https://evil.example.test' }),
    );

    await expectError(
      response,
      403,
      'FORBIDDEN',
      'The request origin is not allowed.',
    );
    expect(harness.auth.resolveSession).not.toHaveBeenCalled();
    expect(harness.port).not.toHaveBeenCalled();
  });
});
