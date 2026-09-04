import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  _operationForHumanPath,
  expectApiError,
  jsonRequest,
  makeHarness,
  mutationPath,
  releaseRequest,
} from './phase-02-slice-09-worker-test-support';
import {
  DRY_RUN_ID,
  TYPE_ID,
  VERSION_ID,
  REQUEST_ID,
  API_ORIGIN,
  CMS_ORIGIN,
  session,
  activation,
  validDraft,
  validField,
  validRelation,
  validActivation,
  validBlock,
  validLifecycle,
  ok,
} from './phase-02-slice-09-test-values';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('S09 worker content-schema-registry RED routes', () => {
  it.each([
    [
      'CMS-03A-01',
      '/api/v1/cms/content-types',
      validDraft,
      'createTypeDraft',
      201,
    ],
    ['CMS-03A-02', mutationPath.field, validField, 'addFieldDefinition', 201],
    ['CMS-03A-03', mutationPath.relation, validRelation, 'bindRelation', 201],
    [
      'CMS-03A-04',
      mutationPath.activate,
      validActivation,
      'activateSchema',
      200,
    ],
    [
      'CMS-03A-06',
      '/api/v1/cms/content-types?limit=25&sort=key&direction=asc',
      null,
      'listContentTypes',
      200,
    ],
    [
      'CMS-03A-07',
      `/api/v1/cms/content-types/${TYPE_ID}/versions/${VERSION_ID}`,
      null,
      'getContentTypeVersion',
      200,
    ],
  ] as const)(
    '[$0] returns the strict success envelope and calls the named RPC seam',
    async (_operation, path, body, port, status) => {
      const harness = makeHarness();
      const headers = { 'x-request-id': REQUEST_ID };
      const request =
        body === null
          ? new Request(`${API_ORIGIN}${path}`, {
              headers: {
                origin: CMS_ORIGIN,
                authorization: 'Bearer verified-session',
                ...headers,
              },
            })
          : jsonRequest(path, body, {
              ...headers,
              ...(_operation === 'CMS-03A-02' ||
              _operation === 'CMS-03A-03' ||
              _operation === 'CMS-03A-04'
                ? { 'if-match': '"1"' }
                : {}),
            });
      const response = await harness.app.request(request);
      expect(response.status).toBe(status);
      expect(response.headers.get('x-request-id')).toBe(REQUEST_ID);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(harness.ports[port]).toHaveBeenCalledTimes(1);
      expect(harness.ports[port]).toHaveBeenCalledWith(
        expect.objectContaining({ operationId: _operation }),
        expect.any(AbortSignal),
      );
    },
  );

  it('returns 202 when activation work remains', async () => {
    const harness = makeHarness();
    harness.ports.activateSchema.mockResolvedValue(
      ok({ ...activation, jobId: DRY_RUN_ID }),
    );
    const response = await harness.app.request(
      jsonRequest(mutationPath.activate, validActivation, {
        'if-match': '"1"',
      }),
    );
    expect(response.status).toBe(202);
    expect(harness.ports.activateSchema).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['CMS-03A-05', '/api/v1/cms/blocks/versions', validBlock, 'registerBlock'],
    [
      'CMS-03A-08',
      mutationPath.lifecycle,
      validLifecycle,
      'advanceBlockLifecycle',
    ],
  ] as const)(
    '[$0] accepts only the signed release-worker envelope',
    async (_operation, path, body, port) => {
      const harness = makeHarness();
      const response = await harness.app.request(
        releaseRequest(path, body, {
          'x-request-id': REQUEST_ID,
          ...(_operation === 'CMS-03A-08' ? { 'if-match': '"1"' } : {}),
        }),
      );
      expect(response.status).toBe(201);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(harness.verifyRelease).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: _operation,
          rawBody: expect.any(Uint8Array),
        }),
        expect.any(AbortSignal),
      );
      expect(harness.ports[port]).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    ['/api/v1/cms/content-types', validDraft, 'createTypeDraft'],
    [mutationPath.field, validField, 'addFieldDefinition'],
    [mutationPath.relation, validRelation, 'bindRelation'],
    [mutationPath.activate, validActivation, 'activateSchema'],
  ] as const)(
    'rejects human mutation without the exact capability',
    async (path, body, port) => {
      const harness = makeHarness({
        session: ok({ ...session, capabilities: ['cms.schema_registry.read'] }),
      });
      await expectApiError(
        await harness.app.request(
          jsonRequest(path, body, {
            ...(_operationForHumanPath(path) ? { 'if-match': '"1"' } : {}),
          }),
        ),
        403,
        'FORBIDDEN',
      );
      expect(harness.ports[port]).not.toHaveBeenCalled();
    },
  );
});
