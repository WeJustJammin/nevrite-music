/** Browser-visible profile routes. Internal producer ingress and deferred EPK routes stay unmounted. */
export const PROFILE_PORTFOLIO_ROUTE_CONTRACTS = [
  {
    operationId: 'PRF-PROF-01',
    method: 'GET',
    path: '/api/v1/profiles/:partyId',
    deferred: false,
  },
  {
    operationId: 'PRF-PROF-02',
    method: 'GET',
    path: '/api/v1/profiles/:partyId/sections/:sectionCode/revisions',
    deferred: false,
  },
  {
    operationId: 'PRF-PROF-03',
    method: 'PUT',
    path: '/api/v1/profiles/:partyId/sections/:sectionCode',
    deferred: false,
  },
  {
    operationId: 'PRF-PROF-04',
    method: 'PUT',
    path: '/api/v1/profiles/:partyId/emphasis',
    deferred: false,
  },
  {
    operationId: 'PRF-PROF-05',
    method: 'GET',
    path: '/api/v1/profiles/:partyId/portfolio',
    deferred: false,
  },
  {
    operationId: 'PRF-PROF-06',
    method: 'GET',
    path: '/api/v1/profiles/:partyId/reel',
    deferred: false,
  },
  {
    operationId: 'PRF-PROF-07',
    method: 'POST',
    path: '/api/v1/profiles/:partyId/reel-items',
    deferred: false,
  },
  {
    operationId: 'PRF-PROF-08',
    method: 'PUT',
    path: '/api/v1/reel-items/:reelItemId',
    deferred: false,
  },
  {
    operationId: 'PRF-PROF-09',
    method: 'DELETE',
    path: '/api/v1/reel-items/:reelItemId',
    deferred: false,
  },
  {
    operationId: 'PRF-PROF-10',
    method: 'POST',
    path: '/internal/v1/profile-fact-observations',
    deferred: false,
  },
  {
    operationId: 'PRF-PROF-11',
    method: 'GET',
    path: '/api/v1/profiles/:partyId/emphasis',
    deferred: false,
  },
] as const;
