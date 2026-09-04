import { describe, expect, it } from 'vitest';

import {
  CREDIT_ID,
  bindings,
  MEDIA_ID,
  PARTY_ID,
  REEL_ITEM_ID,
  RIGHTS_ID,
  REQUEST_ID,
  SECTION_ID,
  createProfilePortfolioApp,
  expectApiError,
  jsonRequest,
  readRequest,
  responses,
} from './phase-02-slice-06.test-support';

const profilePath = `/api/v1/profiles/${PARTY_ID}`;
const sectionPath = `${profilePath}/sections/biography`;
const reelPath = `${profilePath}/reel`;
const reelItemPath = `/api/v1/reel-items/${REEL_ITEM_ID}`;

const factRef = {
  sourceType: 'credit',
  sourceId: CREDIT_ID,
  sourceVersion: '3',
} as const;

type ActiveRoute = Readonly<{
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  request: () => Request;
  dependency: keyof ReturnType<
    typeof createProfilePortfolioApp
  >['profilePortfolio'];
  status: 200 | 201 | 202;
  response: unknown;
  cacheControl: string;
}>;

const activeRoutes: readonly ActiveRoute[] = [
  {
    id: 'PRF-PROF-01',
    method: 'GET',
    path: profilePath,
    request: () => readRequest(profilePath),
    dependency: 'readPublicProfile',
    status: 200,
    response: responses.publicProfile,
    cacheControl: 'public, max-age=60, stale-if-error=300',
  },
  {
    id: 'PRF-PROF-02',
    method: 'GET',
    path: `${sectionPath}/revisions`,
    request: () => readRequest(`${sectionPath}/revisions`, 'limit=25', true),
    dependency: 'readSectionRevisions',
    status: 200,
    response: responses.sectionRevisions,
    cacheControl: 'private, no-store',
  },
  {
    id: 'PRF-PROF-03',
    method: 'PUT',
    path: sectionPath,
    request: () =>
      jsonRequest(
        'PUT',
        sectionPath,
        {
          state: 'active',
          blocks: [{ kind: 'paragraph', text: 'A safe profile section.' }],
          clientReason: 'Refresh the asserted profile section',
        },
        { ifMatch: '"1"' },
      ),
    dependency: 'putSection',
    status: 200,
    response: responses.section,
    cacheControl: 'private, no-store',
  },
  {
    id: 'PRF-PROF-04',
    method: 'PUT',
    path: `${profilePath}/emphasis`,
    request: () =>
      jsonRequest(
        'PUT',
        `${profilePath}/emphasis`,
        {
          surface: 'public',
          defaultFilter: { roleCodes: ['performer'] },
          orderedRefs: [factRef],
        },
        { ifMatch: '"3"' },
      ),
    dependency: 'putEmphasis',
    status: 200,
    response: responses.emphasis,
    cacheControl: 'private, no-store',
  },
  {
    id: 'PRF-PROF-05',
    method: 'GET',
    path: `${profilePath}/portfolio`,
    request: () =>
      readRequest(`${profilePath}/portfolio`, 'limit=25&roleCode=performer'),
    dependency: 'readPortfolio',
    status: 200,
    response: responses.portfolio,
    cacheControl: 'public, max-age=60',
  },
  {
    id: 'PRF-PROF-06',
    method: 'GET',
    path: reelPath,
    request: () => readRequest(reelPath, 'limit=25'),
    dependency: 'readReel',
    status: 200,
    response: responses.reel,
    cacheControl: 'public, max-age=60',
  },
  {
    id: 'PRF-PROF-07',
    method: 'POST',
    path: `${profilePath}/reel-items`,
    request: () =>
      jsonRequest(
        'POST',
        `${profilePath}/reel-items`,
        {
          creditRef: factRef,
          mediaRef: {
            sourceType: 'media',
            sourceId: MEDIA_ID,
            sourceVersion: '3',
          },
          roleCode: 'performer',
          rightsBasis: 'ownership',
          rightsRef: {
            sourceType: 'media',
            sourceId: RIGHTS_ID,
            sourceVersion: '3',
          },
          order: 0,
        },
        { ifMatch: '"3"' },
      ),
    dependency: 'createReelItem',
    status: 201,
    response: responses.reelItem,
    cacheControl: 'private, no-store',
  },
  {
    id: 'PRF-PROF-08',
    method: 'PUT',
    path: reelItemPath,
    request: () =>
      jsonRequest(
        'PUT',
        reelItemPath,
        {
          roleCode: 'performer',
          rightsBasis: 'ownership',
          rightsRef: {
            sourceType: 'media',
            sourceId: RIGHTS_ID,
            sourceVersion: '3',
          },
          order: 0,
          desiredState: 'verifying_rights',
        },
        { ifMatch: '"1"' },
      ),
    dependency: 'updateReelItem',
    status: 200,
    response: responses.reelItem,
    cacheControl: 'private, no-store',
  },
  {
    id: 'PRF-PROF-09',
    method: 'DELETE',
    path: reelItemPath,
    request: () =>
      jsonRequest(
        'DELETE',
        reelItemPath,
        { reasonCode: 'controller_unlisted' },
        { ifMatch: '"1"' },
      ),
    dependency: 'removeReelItem',
    status: 200,
    response: responses.reelItem,
    cacheControl: 'private, no-store',
  },
  {
    id: 'PRF-PROF-10',
    method: 'POST',
    path: '/internal/v1/profile-fact-observations',
    request: () =>
      jsonRequest(
        'POST',
        '/internal/v1/profile-fact-observations',
        {
          messageId: '15151515-1515-4515-8515-151515151515',
          producer: 'shard04',
          partyId: PARTY_ID,
          fact: factRef,
          provenanceState: 'attested',
          evidenceClass: 'governed_credit',
          evidenceCount: 1,
          visibility: 'public',
          embargoUntil: null,
          listingState: 'listed',
          disputeState: 'clear',
          occurredOn: null,
          roleCodes: ['performer'],
          payload: {},
          observedAt: '2026-09-01T05:00:00.000Z',
        },
        { authenticated: false, internal: true },
      ),
    dependency: 'ingestProfileFactObservation',
    status: 202,
    response: responses.observation,
    cacheControl: 'private, no-store',
  },
  {
    id: 'PRF-PROF-11',
    method: 'GET',
    path: `${profilePath}/emphasis`,
    request: () =>
      readRequest(`${profilePath}/emphasis?surface=public`, undefined, true),
    dependency: 'readEmphasis',
    status: 200,
    response: responses.emphasis,
    cacheControl: 'private, no-store',
  },
];

describe('Phase 2 Slice 06 Worker route RED acceptance', () => {
  it.each(activeRoutes)(
    '[P2-S06 route $id] mounts the exact method/path and returns a parsed success resource',
    async (testCase) => {
      const harness = createProfilePortfolioApp();
      const response = await harness.app.fetch(testCase.request(), bindings);

      expect(response.status).toBe(testCase.status);
      expect(response.headers.get('content-type')).toContain(
        'application/json',
      );
      expect(response.headers.get('x-request-id')).toBe(REQUEST_ID);
      expect(response.headers.get('cache-control')).toBe(testCase.cacheControl);
      await expect(response.json()).resolves.toEqual(testCase.response);
      expect(
        harness.profilePortfolio[testCase.dependency],
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: testCase.id,
          request: expect.any(Request),
        }),
        expect.anything(),
        expect.any(AbortSignal),
      );
    },
  );

  it('[P2-S06-AC-001,005,007] conceals an unclaimed or unreadable public target as a stable 404', async () => {
    const harness = createProfilePortfolioApp({
      readPublicProfile: async () => ({
        ok: false,
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'The requested profile was not found.',
        details: {},
      }),
    });

    await expectApiError(
      await harness.app.fetch(readRequest(profilePath), bindings),
      404,
      'RESOURCE_NOT_FOUND',
    );
  });

  it.each([
    '/api/v1/epk-shares',
    `/api/v1/epk-shares/${SECTION_ID}`,
    `/api/v1/epk-shares/${SECTION_ID}/pdf-jobs`,
    `/api/v1/epk-shares/${SECTION_ID}/pdf-snapshots/${REEL_ITEM_ID}`,
    `/epk/${'A'.repeat(43)}`,
  ])(
    '[P2-S06-AC-095,096,097,098,099,100,101,102,109,110] keeps deferred EPK route %s unmounted',
    async (path) => {
      const harness = createProfilePortfolioApp();
      const request = path.endsWith('pdf-jobs')
        ? jsonRequest('POST', path, { locale: 'en', paper: 'letter' })
        : readRequest(path);
      const response = await harness.app.fetch(request, bindings);

      expect(response.status).toBe(404);
      expect(harness.profilePortfolio.readPublicProfile).not.toHaveBeenCalled();
      expect(harness.profilePortfolio.readPortfolio).not.toHaveBeenCalled();
      expect(harness.profilePortfolio.emitEvent).not.toHaveBeenCalled();
    },
  );
});
