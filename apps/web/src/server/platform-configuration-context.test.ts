import { describe, expect, it, vi } from 'vitest';

import type { PlatformConfigurationPlatformApiBinding } from './platform-configuration-platform-api.ts';
import {
  forwardPlatformConfigurationRequest,
  parsePlatformConfigurationCapabilities,
  platformConfigurationResponseCapabilities,
  resolvePlatformConfigurationBinding,
} from './platform-configuration-platform-api.ts';
import {
  resolvePlatformConfigurationPage,
  type PlatformConfigurationPageState,
} from './platform-configuration-context.ts';
import { platformConfigurationInitial } from './platform-configuration-app-state.ts';

const ACTOR_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const PARTY_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d9';
const DEFINITION_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132da';
const VERSION_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132db';
const CORRELATION_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132dc';
const REQUEST_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132dd';

const identity = {
  personId: ACTOR_ID,
  partyKind: 'person',
  accountState: 'active',
  version: '1',
  facets: [],
  aliases: [],
};

const contexts = {
  projectionVersion: '1',
  items: [
    {
      contextId: PARTY_ID,
      partyId: PARTY_ID,
      kind: 'person',
      label: 'Verified context',
      avatarRef: null,
      selectable: true,
      authorityFreshUntil: '2026-09-03T00:00:00.000Z',
    },
  ],
  nextCursor: null,
  hasMore: false,
};

const effective = {
  definitionId: DEFINITION_ID,
  definitionVersionId: VERSION_ID,
  key: 'web.theme',
  valueKind: 'json_object',
  typedValue: {
    theme: 'dark',
    secretToken: 'must-not-reach-the-browser',
  },
  sourceScope: 'platform',
  sourceSubjectId: null,
  sourceValueVersionId: null,
  isDefault: true,
  effectiveFrom: null,
  effectiveTo: null,
  evaluatedAt: '2026-09-02T00:00:00.000Z',
  evaluatorVersion: '7',
  correlationId: CORRELATION_ID,
  compatibility: 'exact',
} as const;

const json = (
  value: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

const makeBinding = (
  options: {
    readonly capabilityHeader?: string;
    readonly resolveCapabilities?: PlatformConfigurationPlatformApiBinding['resolveCapabilities'];
    readonly effectiveStatus?: number;
  } = {},
): PlatformConfigurationPlatformApiBinding & {
  readonly fetch: ReturnType<typeof vi.fn>;
} => {
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const request = input as Request;
    const pathname = new URL(request.url).pathname;
    if (pathname === '/api/v1/me/identity') return json(identity);
    if (pathname === '/api/v1/me/acting-contexts') return json(contexts);
    if (pathname === '/api/v1/config/web.theme/effective') {
      return json(
        effective,
        options.effectiveStatus ?? 200,
        options.capabilityHeader === undefined
          ? {}
          : { 'x-configuration-capabilities': options.capabilityHeader },
      );
    }
    return json({ code: 'NOT_FOUND', details: {}, message: 'not found' }, 404);
  });
  return {
    fetch,
    ...(options.resolveCapabilities === undefined
      ? {}
      : { resolveCapabilities: options.resolveCapabilities }),
  };
};

const resolve = (
  binding: PlatformConfigurationPlatformApiBinding,
  search = '?key=web.theme&role=editor',
) =>
  resolvePlatformConfigurationPage({
    request: new Request(
      `https://web.example/app/platform-configuration-admin${search}`,
      {
        headers: { cookie: 'wj_session_ref=verified; wj_csrf=csrf' },
      },
    ),
    binding,
    key: 'web.theme',
    requestId: REQUEST_ID,
    surface: 'index',
  });

describe('platform configuration SSR authority boundary', () => {
  it('ignores an untrusted URL role and keeps a verified read projection read-only', async () => {
    const binding = makeBinding();
    const result = await resolve(binding, '?key=web.theme&role=editor');

    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;
    expect(result.page.access).toBe('read-only');
    expect(result.page.variant).toBe('adminStepUp');
    expect(result.page.capabilitySnapshot).toEqual([]);
    expect(result.page.effective).not.toBeNull();

    const forwarded = binding.fetch.mock.calls.map(
      ([value]) => new URL((value as Request).url),
    );
    expect(forwarded.some((url) => url.searchParams.has('role'))).toBe(false);
  });

  it('does not pass caller role or capability headers to the server-only resolver', async () => {
    const binding = makeBinding({
      resolveCapabilities: ({ request }) =>
        request.headers.get('x-provider-role') === 'admin' ||
        request.headers.get('x-configuration-capabilities') !== null ||
        request.headers.get('x-role') === 'admin' ||
        request.headers.get('x-capability') === 'configuration.editor'
          ? ['configuration.editor']
          : ['configuration.read'],
    });
    const result = await resolvePlatformConfigurationPage({
      request: new Request(
        'https://web.example/app/platform-configuration-admin?key=web.theme&role=editor',
        {
          headers: {
            cookie: 'wj_session_ref=verified; wj_csrf=csrf; tracking=ignored',
            'x-configuration-capability': 'configuration.editor',
            'x-configuration-capabilities': 'configuration.editor',
            'x-provider-role': 'admin',
            'x-role': 'admin',
            'x-capability': 'configuration.editor',
          },
        },
      ),
      binding,
      key: 'web.theme',
      requestId: REQUEST_ID,
      surface: 'index',
    });

    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;
    expect(result.page.access).toBe('read-only');
    expect(result.page.capabilitySnapshot).toEqual(['configuration.read']);
  });

  it.each([
    'configuration.editor',
    'configuration.approver',
    'configuration.release-manager',
    'configuration.rollback-authority',
  ])(
    'uses the verified %s grant for full command projection',
    async (capability) => {
      const result = await resolve(
        makeBinding({ capabilityHeader: capability }),
        '?key=web.theme&role=free',
      );

      expect(result.kind).toBe('ready');
      if (result.kind !== 'ready') return;
      expect(result.page.access).toBe('full');
      expect(result.page.variant).toBe('adminStepUp');
      expect(result.page.capabilitySnapshot).toEqual([capability]);
      expect(result.page.effective?.typedValue).toEqual({
        theme: 'dark',
        // The server page state is disclosure-safe before Astro serializes it.
      });
      expect(JSON.stringify(result)).not.toContain(
        'must-not-reach-the-browser',
      );
    },
  );

  it('does not disclose a response when an explicitly verified capability snapshot has no read grant', async () => {
    const binding = makeBinding({
      resolveCapabilities: () => [],
    });
    const result = await resolve(binding, '?key=web.theme&role=admin');

    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;
    expect(result.page.access).toBe('not-rendered');
    expect(result.page.variant).toBe('forbiddenHidden');
    expect(result.page.effective).toBeNull();

    const initial = platformConfigurationInitial(
      result,
      result.page,
      result.page.effective,
    );
    expect(initial).toEqual({
      status: 'empty',
      reason: 'not-disclosed',
      data: [],
    });
    expect(JSON.stringify(initial)).not.toContain('must-not-reach-the-browser');
  });

  it('fails closed when no selectable server acting context exists', async () => {
    const binding = makeBinding();
    const noContextBinding = {
      ...binding,
      fetch: vi.fn(async (input: RequestInfo | URL) => {
        const pathname = new URL((input as Request).url).pathname;
        if (pathname === '/api/v1/me/identity') return json(identity);
        if (pathname === '/api/v1/me/acting-contexts') {
          return json({ ...contexts, items: [] });
        }
        return json(effective);
      }),
    };
    const result = await resolve(noContextBinding);

    expect(result).toMatchObject({
      kind: 'ready',
      page: {
        state: 'forbidden',
        variant: 'forbiddenHidden',
        access: 'not-rendered',
        actorId: ACTOR_ID,
        actingPartyId: null,
        effective: null,
      },
    });
  });

  it('validates capability metadata and never treats role text as a capability', () => {
    expect(
      parsePlatformConfigurationCapabilities([
        'configuration.editor, not valid, configuration.editor',
        'configuration.rollback-authority',
      ]),
    ).toEqual(['configuration.editor', 'configuration.rollback-authority']);
    expect(
      parsePlatformConfigurationCapabilities(['role=editor', 'Admin']),
    ).toEqual([]);
    expect(
      platformConfigurationResponseCapabilities(
        new Response(null, {
          headers: {
            'x-configuration-capability': 'configuration.read',
            'x-configuration-capabilities': 'configuration.editor',
            'x-provider-role': 'admin',
          },
        }),
      ),
    ).toEqual(['configuration.editor', 'configuration.read']);
  });

  it('forwards only the trusted capability metadata header through the API boundary', async () => {
    const fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          headers: {
            'content-type': 'application/json',
            'x-configuration-capabilities': 'configuration.read',
            'x-provider-role': 'admin',
          },
        }),
    );
    const response = await forwardPlatformConfigurationRequest(
      new Request('https://web.example/api/v1/config/web.theme/effective', {
        headers: { cookie: 'wj_session_ref=verified' },
      }),
      { fetch },
      '/api/v1/config/web.theme/effective',
      'GET',
    );

    expect(response.headers.get('x-configuration-capabilities')).toBe(
      'configuration.read',
    );
    expect(response.headers.get('x-provider-role')).toBeNull();
  });

  it('preserves POST method, headers, and body through the development local binding', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' },
      }),
    );
    const binding = resolvePlatformConfigurationBinding(
      null,
      'http://127.0.0.1:8787',
    ) as PlatformConfigurationPlatformApiBinding;
    await binding.fetch(
      new Request(
        'https://platform-configuration.internal/api/v1/admin/settings/definition/changes',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'idempotency-key': 'operation-7',
          },
          body: JSON.stringify({ typedValue: 'jam' }),
        },
      ),
    );

    const forwarded = fetch.mock.calls[0]?.[0];
    expect(forwarded).toBeInstanceOf(Request);
    if (!(forwarded instanceof Request)) return;
    expect(forwarded.url).toBe(
      'http://127.0.0.1:8787/api/v1/admin/settings/definition/changes',
    );
    expect(forwarded.method).toBe('POST');
    expect(forwarded.headers.get('idempotency-key')).toBe('operation-7');
    await expect(forwarded.clone().json()).resolves.toEqual({
      typedValue: 'jam',
    });
    fetch.mockRestore();
  });

  it('keeps unauthorized app state empty even if a caller supplies a response', () => {
    const page: PlatformConfigurationPageState = {
      state: 'forbidden',
      variant: 'forbiddenHidden',
      access: 'not-rendered',
      actorId: ACTOR_ID,
      actingPartyId: null,
      capabilitySnapshot: [],
      csrfToken: '',
      requestId: REQUEST_ID,
      key: 'web.theme',
      effective: null,
      etag: null,
      lastVerifiedAt: null,
      notDisclosed: true,
    };
    const initial = platformConfigurationInitial(
      pageResult(page),
      page,
      effective,
    );
    expect(initial).toEqual({
      status: 'empty',
      reason: 'not-disclosed',
      data: [],
    });
  });
});

const pageResult = (page: PlatformConfigurationPageState) => ({
  kind: 'ready' as const,
  page,
});
