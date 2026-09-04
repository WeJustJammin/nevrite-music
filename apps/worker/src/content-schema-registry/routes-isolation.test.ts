import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';

import {
  registerContentSchemaRegistryRoutes,
  type ContentSchemaRegistryDependencies,
  type ContentSchemaRegistryResult,
} from './index';

const CMS_ORIGIN = 'https://cms-console.example.test';
const RELEASE_ORIGIN = 'https://release-worker.example.test';

const unavailable: ContentSchemaRegistryResult<never> = {
  ok: false,
  status: 503,
  code: 'DEPENDENCY_UNAVAILABLE',
  message: 'The registry is unavailable.',
  details: {},
};

const createDependencies = (
  origins: Readonly<{
    human?: readonly string[];
    release?: readonly string[];
  }> = {},
): ContentSchemaRegistryDependencies => {
  const unavailablePort = async () => unavailable;
  return {
    ports: {
      createTypeDraft: unavailablePort,
      addFieldDefinition: unavailablePort,
      bindRelation: unavailablePort,
      activateSchema: unavailablePort,
      registerBlock: unavailablePort,
      advanceBlockLifecycle: unavailablePort,
      listContentTypes: unavailablePort,
      getContentTypeVersion: unavailablePort,
    } as unknown as ContentSchemaRegistryDependencies['ports'],
    resolveSession: async () => unavailable,
    verifyRelease: async () => unavailable,
    rateLimit: async () => unavailable,
    humanOrigins: origins.human ?? [CMS_ORIGIN],
    releaseOrigins: origins.release ?? [],
  };
};

const createComposedApp = (): Hono => {
  const app = new Hono();
  registerContentSchemaRegistryRoutes(app, createDependencies());

  app.get('/api/v1/health', () => new Response('health', { status: 200 }));
  app.post(
    '/api/v1/upload-intents',
    () => new Response('upload', { status: 201 }),
  );
  app.options(
    '/api/v1/unrelated',
    () => new Response('unrelated-options', { status: 200 }),
  );

  return app;
};

const createReleaseComposedApp = (): Hono => {
  const app = new Hono();
  registerContentSchemaRegistryRoutes(
    app,
    createDependencies({ human: [CMS_ORIGIN], release: [RELEASE_ORIGIN] }),
  );
  return app;
};

describe('content-schema-registry route composition isolation', () => {
  it('limits CMS CORS middleware to the CMS route tree', async () => {
    const app = createComposedApp();
    const init = { headers: { origin: CMS_ORIGIN } };

    const health = await app.request('/api/v1/health', init);
    const upload = await app.request('/api/v1/upload-intents', {
      ...init,
      method: 'POST',
    });
    const unknown = await app.request('/api/v1/missing', init);

    expect(await health.text()).toBe('health');
    expect(await upload.text()).toBe('upload');
    expect(unknown.status).toBe(404);
    for (const response of [health, upload, unknown]) {
      expect(response.headers.get('access-control-allow-origin')).toBeNull();
      expect(response.headers.get('x-request-id')).toBeNull();
    }
  });

  it('handles CMS preflight while leaving unrelated OPTIONS routes untouched', async () => {
    const app = createComposedApp();

    const cmsPreflight = await app.request('/api/v1/cms/content-types', {
      method: 'OPTIONS',
      headers: { origin: CMS_ORIGIN },
    });
    expect(cmsPreflight.status).toBe(204);
    expect(cmsPreflight.headers.get('access-control-allow-origin')).toBe(
      CMS_ORIGIN,
    );

    const unrelatedPreflight = await app.request('/api/v1/unrelated', {
      method: 'OPTIONS',
      headers: { origin: CMS_ORIGIN },
    });
    expect(unrelatedPreflight.status).toBe(200);
    expect(await unrelatedPreflight.text()).toBe('unrelated-options');
    expect(
      unrelatedPreflight.headers.get('access-control-allow-methods'),
    ).toBeNull();
  });

  it('isolates human and release CORS policies and never enables release credentials', async () => {
    const app = createReleaseComposedApp();
    const releasePreflight = await app.request('/api/v1/cms/blocks/versions', {
      method: 'OPTIONS',
      headers: { origin: RELEASE_ORIGIN },
    });
    expect(releasePreflight.status).toBe(204);
    expect(releasePreflight.headers.get('access-control-allow-origin')).toBe(
      RELEASE_ORIGIN,
    );
    expect(
      releasePreflight.headers.get('access-control-allow-credentials'),
    ).toBeNull();
    expect(releasePreflight.headers.get('access-control-allow-methods')).toBe(
      'POST, OPTIONS',
    );

    const humanOnRelease = await app.request('/api/v1/cms/blocks/versions', {
      method: 'OPTIONS',
      headers: { origin: CMS_ORIGIN },
    });
    expect(humanOnRelease.status).toBe(403);
    expect(
      humanOnRelease.headers.get('access-control-allow-origin'),
    ).toBeNull();

    const releaseOnHuman = await app.request('/api/v1/cms/content-types', {
      method: 'OPTIONS',
      headers: { origin: RELEASE_ORIGIN },
    });
    expect(releaseOnHuman.status).toBe(403);
    expect(
      releaseOnHuman.headers.get('access-control-allow-origin'),
    ).toBeNull();
  });
});
