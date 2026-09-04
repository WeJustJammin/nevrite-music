import { describe, expect, it } from 'vitest';

import {
  assertContentSchemaRegistryRouteRegistry,
  buildContentSchemaRegistryBrowserOpenApiDocument,
  buildContentSchemaRegistryOpenApiDocument,
  getContentSchemaRegistryBrowserOpenApiComponentSchemas,
  contentSchemaRegistryRoutePolicies,
} from './index';

const expected = [
  ['CMS-03A-01', 'POST', '/api/v1/cms/content-types'],
  [
    'CMS-03A-02',
    'POST',
    '/api/v1/cms/content-types/{contentTypeId}/versions/{versionId}/fields',
  ],
  [
    'CMS-03A-03',
    'POST',
    '/api/v1/cms/content-types/{contentTypeId}/versions/{versionId}/relations',
  ],
  [
    'CMS-03A-04',
    'POST',
    '/api/v1/cms/content-types/{contentTypeId}/versions/{versionId}/activate',
  ],
  ['CMS-03A-05', 'POST', '/api/v1/cms/blocks/versions'],
  ['CMS-03A-06', 'GET', '/api/v1/cms/content-types'],
  [
    'CMS-03A-07',
    'GET',
    '/api/v1/cms/content-types/{contentTypeId}/versions/{versionId}',
  ],
  [
    'CMS-03A-08',
    'POST',
    '/api/v1/cms/blocks/versions/{blockDefinitionVersionId}/lifecycle',
  ],
] as const;

describe('content schema registry route registry', () => {
  it('contains exactly the eight locked operations and method/path pairs', () => {
    expect(
      contentSchemaRegistryRoutePolicies.map(
        ({ operationId, method, path }) => [operationId, method, path],
      ),
    ).toEqual(expected);
  });

  it('separates human, protected-read, and signed-release authority', () => {
    const byId = Object.fromEntries(
      contentSchemaRegistryRoutePolicies.map((route) => [
        route.operationId,
        route,
      ]),
    );
    expect(byId['CMS-03A-01']?.auth).toBe('schema_designer');
    expect(byId['CMS-03A-06']?.auth).toBe('registry_reader');
    expect(byId['CMS-03A-07']?.auth).toBe('registry_reader');
    expect(byId['CMS-03A-05']?.auth).toBe('signed_release_worker');
    expect(byId['CMS-03A-08']?.auth).toBe('signed_release_worker');
    expect(byId['CMS-03A-05']?.csrf).toBe('forbidden');
    expect(byId['CMS-03A-08']?.rawBodySignature).toBe('required');
  });

  it('locks mutation preconditions, no-store policy, and deadlines', () => {
    for (const route of contentSchemaRegistryRoutePolicies) {
      expect(route.timeoutMs).toBe(15_000);
      expect(route.cacheControl).toBe('no-store');
      expect(route.slo).toEqual({
        acceptanceP99Ms: 1_000,
        commandP95Ms: 1_200,
        protectedRpcP95Ms: 300,
        tier: 2,
      });
      if (route.method === 'GET') {
        expect(route.idempotency).toBe('none');
        expect(route.ifMatch).toBe('none');
      }
    }
    for (const operationId of [
      'CMS-03A-02',
      'CMS-03A-03',
      'CMS-03A-04',
      'CMS-03A-08',
    ]) {
      const route = contentSchemaRegistryRoutePolicies.find(
        (candidate) => candidate.operationId === operationId,
      );
      expect(route?.idempotency).toBe('required');
      expect(route?.ifMatch).toBe('required');
    }
  });

  it('publishes all eight routes in OpenAPI without worker secrets', () => {
    const document = buildContentSchemaRegistryOpenApiDocument();
    const serialized = JSON.stringify(document);
    for (const [, method, path] of expected) {
      expect(document.paths[path]?.[method.toLowerCase()]).toBeDefined();
    }
    expect(serialized).not.toContain('releaseRawBodyHash');
    expect(serialized).not.toContain('releaseSignatureHash');
    expect(serialized).not.toContain('releaseNonceHash');
  });

  it('guards duplicate route registrations at runtime', () => {
    expect(() =>
      assertContentSchemaRegistryRouteRegistry([
        ...contentSchemaRegistryRoutePolicies,
        contentSchemaRegistryRoutePolicies[0],
      ]),
    ).toThrow(/Duplicate content schema registry operation/u);
    expect(() =>
      assertContentSchemaRegistryRouteRegistry(
        contentSchemaRegistryRoutePolicies.slice(0, -1),
      ),
    ).toThrow(/route count/u);
  });

  it('publishes exact protected-read, release-header, and browser-safe views', () => {
    const internal = buildContentSchemaRegistryOpenApiDocument();
    const browser = buildContentSchemaRegistryBrowserOpenApiDocument();
    const internalList = internal.paths['/api/v1/cms/content-types']?.get;
    const internalRelease = internal.paths['/api/v1/cms/blocks/versions']?.post;
    const browserList = browser.paths['/api/v1/cms/content-types']?.get;

    expect(internal['x-audience']).toBe('internal-worker');
    expect(browser['x-audience']).toBe('browser');
    expect(Object.keys(internal.paths)).toHaveLength(7);
    expect(Object.keys(browser.paths)).toHaveLength(5);
    expect(internalList).toBeDefined();
    expect(browserList).toBeDefined();
    expect(internalList?.['x-slo']).toEqual({
      acceptanceP99Ms: 1_000,
      commandP95Ms: 1_200,
      protectedRpcP95Ms: 300,
      tier: 2,
    });

    const listParameters = (internalList?.parameters ?? []) as Array<{
      name: string;
    }>;
    expect(listParameters.map(({ name }) => name)).toEqual([
      'resourceKind',
      'keyPrefix',
      'lifecycle',
      'state',
      'limit',
      'cursor',
      'sort',
      'direction',
    ]);
    expect(Object.keys(internalList?.responses ?? {}).sort()).toEqual([
      '200',
      '400',
      '401',
      '403',
      '422',
      '429',
      '500',
      '502',
      '503',
      '504',
    ]);

    const releaseParameters = (internalRelease?.parameters ?? []) as Array<{
      name: string;
    }>;
    expect(releaseParameters.map(({ name }) => name)).toEqual([
      'Idempotency-Key',
      'X-WeJammin-Release-Key-Id',
      'X-WeJammin-Release-Issued-At',
      'X-WeJammin-Release-Nonce',
      'X-WeJammin-Release-Signature',
    ]);
    expect(Object.keys(internalRelease?.responses ?? {}).sort()).toContain(
      '415',
    );
    expect(
      (internalRelease?.responses as Record<string, { content?: unknown }>)[
        '415'
      ]?.content,
    ).toBeDefined();

    const browserSerialized = JSON.stringify(browser);
    expect(browserSerialized).not.toContain('CMS-03A-05');
    expect(browserSerialized).not.toContain('CMS-03A-08');
    expect(browserSerialized).not.toContain('X-WeJammin-Release-');
    expect(browserSerialized).not.toContain('BlockRegistrationRequest');
    expect(browserSerialized).not.toContain('BlockLifecycleAdvanceRequest');
    expect(browserSerialized).not.toContain('ReleaseEnvelopeHeaders');
    expect(browserSerialized).not.toContain('releaseKeyId');
    expect(browserSerialized).not.toContain('releaseNonceHash');
    expect(
      getContentSchemaRegistryBrowserOpenApiComponentSchemas(),
    ).not.toHaveProperty('BlockDefinitionVersionResource');
    expect(
      getContentSchemaRegistryBrowserOpenApiComponentSchemas(),
    ).not.toHaveProperty('CmsEd25519Signature');
  });
});
