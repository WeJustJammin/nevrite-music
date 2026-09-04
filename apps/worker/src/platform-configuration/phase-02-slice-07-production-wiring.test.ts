import { describe, expect, it, vi } from 'vitest';

import type { WorkerBindings } from '../index';
import { normalizeAuthProductionOptions } from '../authentication/production-configuration';
import { normalizeConfigurationOptions } from './production-http';
import {
  configurationCommandRpc,
  configurationDatabaseContext,
  configurationExpectedVersion,
  configurationReadRpc,
} from './production-request';
import {
  PLATFORM_CONFIGURATION_RPC,
  configurationResponseSchemas,
  createProductionConfigurationDependencies,
  createProductionPlatformConfigurationDependencies,
} from './production';
import type { ConfigurationPortInput } from './types';
import {
  CORRELATION_ID,
  REQUEST_ID,
  actionResponse,
  definitionId,
  definitionResponse,
  effectiveResponse,
  proposalResponse,
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

const without = (
  input: ConfigurationPortInput,
  ...fields: readonly (keyof ConfigurationPortInput)[]
): ConfigurationPortInput => {
  const copy = { ...input } as Record<string, unknown>;
  for (const field of fields) delete copy[field];
  return copy as ConfigurationPortInput;
};

describe('Phase 2 Slice 07 production adapter wiring', () => {
  it('serializes database context and command/read RPC envelopes', async () => {
    const empty = { operationId: 'CFG-05A-02', request } as const;
    expect(configurationDatabaseContext(empty)).toEqual({
      requestId: REQUEST_ID,
      correlationId: CORRELATION_ID,
    });
    expect(
      configurationDatabaseContext(without(portInput(), 'session')),
    ).toEqual({
      releasePrincipalId: 'verified.release',
      servicePrincipalId: 'verified.release',
      serviceConsumerKey: 'web.profile',
      requestId: REQUEST_ID,
      correlationId: CORRELATION_ID,
    });
    expect(
      configurationDatabaseContext(
        without(
          portInput({
            session: { ...sessionFor(2), stepUpAt: null },
          }),
          'servicePrincipalId',
          'serviceConsumerKey',
        ),
      ),
    ).toMatchObject({
      authUserId: expect.any(String),
      sessionId: expect.any(String),
      actorPersonId: expect.any(String),
      actingPartyId: definitionId,
      stepUpVerified: false,
      stepUpAt: null,
    });
    expect(configurationExpectedVersion(undefined)).toBeUndefined();
    expect(configurationExpectedVersion('7')).toBe('7');

    const fetchImpl = vi.fn(async (...args: Parameters<typeof fetch>) => {
      void args;
      return json({ value: true });
    });
    const config = configFor(fetchImpl as typeof fetch);
    const schema = {
      safeParse: (value: unknown) => ({ success: true as const, data: value }),
    };
    await configurationCommandRpc(
      config,
      portInput(),
      new AbortController().signal,
      'cfg_command',
      schema,
      { field: 'value' },
    );
    await configurationCommandRpc(
      config,
      empty,
      new AbortController().signal,
      'cfg_command',
      schema,
      {},
    );
    await configurationReadRpc(
      config,
      portInput(),
      new AbortController().signal,
      'cfg_read',
      schema,
      { key: 'profile.visibility' },
    );
    const bodies = fetchImpl.mock.calls.map(([, init]) =>
      JSON.parse(String(init?.body)),
    );
    expect(bodies[0]).toMatchObject({
      p_request: {
        field: 'value',
        idempotencyKey: 'adapter-idem',
        ifMatch: '7',
      },
    });
    expect(bodies[1]).toEqual({
      p_request: {
        context: { requestId: REQUEST_ID, correlationId: CORRELATION_ID },
      },
    });
    expect(bodies[2]).toMatchObject({
      p_request: { key: 'profile.visibility' },
    });
  });

  it('maps every production dependency operation to its real RPC and preserves resolver options', async () => {
    const responses: Readonly<Record<string, unknown>> = {
      [PLATFORM_CONFIGURATION_RPC.registerDefinition]: definitionResponse,
      [PLATFORM_CONFIGURATION_RPC.resolveEffectiveValue]: effectiveResponse,
      [PLATFORM_CONFIGURATION_RPC.proposeChange]: proposalResponse,
      [PLATFORM_CONFIGURATION_RPC.changeAction]: actionResponse,
    };
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const rpc = String(input).split('/').at(-1) ?? '';
      calls.push(rpc);
      return json(responses[rpc]);
    });
    const noResolvers = createProductionPlatformConfigurationDependencies({
      environment,
      fetchImpl: fetchImpl as typeof fetch,
    });
    const signal = new AbortController().signal;
    await noResolvers.registerDefinition!(
      portInput({ body: { key: 'x' } }),
      environment,
      signal,
    );
    await noResolvers.registerDefinition!(
      without(portInput(), 'body'),
      environment,
      signal,
    );
    await noResolvers.resolveEffectiveValue!(
      portInput({ path: { key: 'profile.visibility' } }),
      environment,
      signal,
    );
    await noResolvers.resolveEffectiveValue!(
      without(portInput({ query: { key: 'profile.visibility' } }), 'path'),
      environment,
      signal,
    );
    await noResolvers.resolveEffectiveValue!(
      without(portInput(), 'path', 'query'),
      environment,
      signal,
    );
    await noResolvers.proposeChange!(
      portInput({ path: { definitionId } }),
      environment,
      signal,
    );
    await noResolvers.changeAction!(
      portInput({ path: { reviewId: definitionId } }),
      environment,
      signal,
    );
    expect(calls).toEqual([
      'cfg_register_definition',
      'cfg_register_definition',
      'cfg_resolve_effective_value',
      'cfg_resolve_effective_value',
      'cfg_resolve_effective_value',
      'cfg_propose_change',
      'cfg_change_action',
    ]);
    const releaseResolver = vi.fn();
    const serviceResolver = vi.fn();
    const withResolvers = createProductionConfigurationDependencies({
      environment,
      resolveReleasePrincipal: releaseResolver,
      resolveServiceConsumer: serviceResolver,
    });
    expect(withResolvers.resolveReleasePrincipal).toBe(releaseResolver);
    expect(withResolvers.resolveServiceConsumer).toBe(serviceResolver);
    expect(normalizeConfigurationOptions({ environment }).baseUrl).toBe(
      'https://supabase.example.test',
    );
    expect(configurationResponseSchemas['CFG-05A-01']).toBeDefined();
  });
});
