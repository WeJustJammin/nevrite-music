import { describe, expect, it, vi } from 'vitest';
import { CONTENT_SCHEMA_REGISTRY_RETRYABLE_HEADER } from '@wejammin/contracts';

import {
  ContentSchemaRegistryPlatformError,
  createContentSchemaRegistryPlatformPorts,
  createContentSchemaRegistryRefetch,
} from '../../server/content-schema-registry-platform-api';
import type {
  ContentSchemaRegistryAuthority,
  ContentSchemaRegistrySession,
} from '../../server/content-schema-registry-context';

const LIST = { items: [], nextCursor: null };

describe('content schema registry PLATFORM_API adapter', () => {
  it('keeps the private binding GET-only and caches the trusted read proof', async () => {
    const requests: Request[] = [];
    const binding = {
      fetch: vi.fn(async (input: RequestInfo | URL) => {
        const request = input instanceof Request ? input : new Request(input);
        requests.push(request);
        return new Response(JSON.stringify(LIST), {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'x-content-schema-registry-capabilities':
              'cms.schema_registry.read,cms.schema_designer',
          },
        });
      }),
    };
    const request = new Request(
      'https://app.test/app/cms-content-modeling?resourceKind=content_type&limit=25',
      {
        headers: {
          cookie: 'wj_access=opaque-session; unrelated=must-not-forward',
          'x-request-id': 'request-123',
        },
      },
    );
    const ports = createContentSchemaRegistryPlatformPorts(binding);
    const session = (await ports.verifySession(
      request,
    )) as ContentSchemaRegistrySession | null;
    expect(session).toMatchObject({ serverVerified: true });
    if (session === null) throw new Error('expected verified session');
    const authority = (await ports.resolveAuthority({
      request,
      session,
      route: 'list',
      contentTypeId: null,
      versionId: null,
    })) as ContentSchemaRegistryAuthority;
    await ports.loadList({
      request,
      session,
      authority,
      query: {} as never,
    });

    expect(binding.fetch).toHaveBeenCalledTimes(1);
    expect(requests[0]?.method).toBe('GET');
    expect(requests[0]?.url).toBe(
      'https://platform-api.internal/api/v1/cms/content-types?resourceKind=content_type&limit=25',
    );
    expect(requests[0]?.headers.get('cookie')).toBe('wj_access=opaque-session');
    expect(requests[0]?.headers.get('x-request-id')).toBe('request-123');
    expect(requests[0]?.headers.get('authorization')).toBeNull();
    expect(authority.capabilities).toEqual([
      'cms.schema_registry.read',
      'cms.schema_designer',
    ]);
  });

  it('performs a bounded current-resource GET for SSR retry', async () => {
    const requests: Request[] = [];
    const binding = {
      fetch: vi.fn(async (input: RequestInfo | URL) => {
        requests.push(input instanceof Request ? input : new Request(input));
        return new Response(JSON.stringify(LIST), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }),
    };
    const request = new Request(
      'https://app.test/app/cms-content-modeling?keyPrefix=hero',
      { headers: { cookie: 'wj_session_ref=opaque-session' } },
    );
    const refetch = createContentSchemaRegistryRefetch(request, binding);
    await refetch('list-read');
    expect(binding.fetch).toHaveBeenCalledTimes(1);
    expect(requests[0]).toBeInstanceOf(Request);
    expect(requests[0]?.method).toBe('GET');
  });

  it('preserves exact upstream status categories at the private boundary', async () => {
    const cases = [
      [400, 'invalid_request'],
      [422, 'validation_failed'],
      [429, 'rate_limited'],
      [500, 'internal_error'],
      [502, 'dependency_invalid_response'],
      [503, 'dependency_unavailable'],
      [504, 'dependency_deadline_exceeded'],
    ] as const;

    for (const [status, kind] of cases) {
      const binding = {
        fetch: vi.fn(async () => new Response('{}', { status })),
      };
      const ports = createContentSchemaRegistryPlatformPorts(binding);

      await expect(
        ports.verifySession(
          new Request('https://app.test/app/cms-content-modeling', {
            headers: { cookie: 'wj_access=opaque-session' },
          }),
        ),
      ).rejects.toMatchObject({
        kind,
        status,
      } satisfies Partial<ContentSchemaRegistryPlatformError>);
    }
  });

  it('classifies a malformed upstream body as invalid dependency data', async () => {
    const binding = {
      fetch: vi.fn(async () => new Response('not-json', { status: 200 })),
    };
    const ports = createContentSchemaRegistryPlatformPorts(binding);

    await expect(
      ports.verifySession(
        new Request('https://app.test/app/cms-content-modeling', {
          headers: { cookie: 'wj_access=opaque-session' },
        }),
      ),
    ).rejects.toMatchObject({
      kind: 'dependency_invalid_response',
      status: 200,
    });
  });

  it('carries the trusted retry proof and Retry-After through dependency errors', async () => {
    const binding = {
      fetch: vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              code: 'DEPENDENCY_UNAVAILABLE',
              message: 'Temporary registry outage.',
              requestId: '018f0c45-73fe-7dc2-9c09-68f7ecf132da',
              details: {
                dependencyClass: 'cms_registry',
                retryable: true,
              },
            }),
            {
              status: 503,
              headers: {
                'content-type': 'application/json',
                [CONTENT_SCHEMA_REGISTRY_RETRYABLE_HEADER]: 'true',
                'retry-after': '7',
              },
            },
          ),
      ),
    };
    const ports = createContentSchemaRegistryPlatformPorts(binding);

    await expect(
      ports.verifySession(
        new Request('https://app.test/app/cms-content-modeling', {
          headers: { cookie: 'wj_access=opaque-session' },
        }),
      ),
    ).rejects.toMatchObject({
      kind: 'dependency_unavailable',
      status: 503,
      retryable: true,
      retryAfterSeconds: 7,
    });
  });
});
