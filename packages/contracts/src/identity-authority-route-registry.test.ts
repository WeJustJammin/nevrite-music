import { describe, expect, it } from 'vitest';

import {
  identityRoutePolicies,
  type IdentityRoutePolicy,
} from './identity-authority/routes.ts';

const expectPolicy = (expected: IdentityRoutePolicy): void => {
  const policy = identityRoutePolicies.find(
    ({ operationId }) => operationId === expected.operationId,
  );

  expect(policy).toEqual(expected);
};

describe('identity authority route registry', () => {
  it('P2-S03-AC-120: BE01b-01 registers idempotent person creation', () => {
    expectPolicy({
      operationId: 'BE01b-01',
      method: 'POST',
      path: '/api/v1/me/identity',
      auth: 'session',
      rateLimit: 2,
      rateWindowSeconds: 86_400,
      timeoutMs: 15_000,
      cacheControl: 'no-store',
      idempotency: 'required',
      ifMatch: 'none',
    });
  });

  it('P2-S03-AC-121: BE01b-02 registers the own-identity projection', () => {
    expectPolicy({
      operationId: 'BE01b-02',
      method: 'GET',
      path: '/api/v1/me/identity',
      auth: 'session',
      rateLimit: 300,
      rateWindowSeconds: 60,
      timeoutMs: 8_000,
      cacheControl: 'no-store',
      idempotency: 'none',
      ifMatch: 'none',
    });
  });

  it('P2-S03-AC-122: BE01b-03 registers self-asserted facet creation', () => {
    expectPolicy({
      operationId: 'BE01b-03',
      method: 'POST',
      path: '/api/v1/me/facets',
      auth: 'session',
      rateLimit: 60,
      rateWindowSeconds: 60,
      timeoutMs: 15_000,
      cacheControl: 'no-store',
      idempotency: 'required',
      ifMatch: 'none',
    });
  });

  it('P2-S03-AC-123: BE01b-04 registers CAS-protected facet removal', () => {
    expectPolicy({
      operationId: 'BE01b-04',
      method: 'DELETE',
      path: '/api/v1/me/facets/:facetCode',
      auth: 'session',
      rateLimit: 30,
      rateWindowSeconds: 60,
      timeoutMs: 15_000,
      cacheControl: 'no-store',
      idempotency: 'required',
      ifMatch: 'required',
    });
  });

  it('P2-S03-AC-124: BE01b-05 registers alias creation', () => {
    expectPolicy({
      operationId: 'BE01b-05',
      method: 'POST',
      path: '/api/v1/aliases',
      auth: 'session',
      rateLimit: 10,
      rateWindowSeconds: 60,
      timeoutMs: 15_000,
      cacheControl: 'no-store',
      idempotency: 'required',
      ifMatch: 'none',
    });
  });

  it('P2-S03-AC-125: BE01b-06 registers owned-alias patching with CAS', () => {
    expectPolicy({
      operationId: 'BE01b-06',
      method: 'PATCH',
      path: '/api/v1/aliases/:aliasId',
      auth: 'session',
      rateLimit: 30,
      rateWindowSeconds: 60,
      timeoutMs: 15_000,
      cacheControl: 'no-store',
      idempotency: 'required',
      ifMatch: 'required',
    });
  });

  it('P2-S03-AC-126: BE01b-07 registers alias handle changes with CAS', () => {
    expectPolicy({
      operationId: 'BE01b-07',
      method: 'POST',
      path: '/api/v1/aliases/:aliasId/handle-changes',
      auth: 'session',
      rateLimit: 10,
      rateWindowSeconds: 60,
      timeoutMs: 15_000,
      cacheControl: 'no-store',
      idempotency: 'required',
      ifMatch: 'required',
    });
  });

  it('P2-S03-AC-127: BE01b-08 registers alias retirement with CAS', () => {
    expectPolicy({
      operationId: 'BE01b-08',
      method: 'POST',
      path: '/api/v1/aliases/:aliasId/retire',
      auth: 'session',
      rateLimit: 10,
      rateWindowSeconds: 60,
      timeoutMs: 15_000,
      cacheControl: 'no-store',
      idempotency: 'required',
      ifMatch: 'required',
    });
  });

  it('P2-S03-AC-128: BE01b-09 registers alias transfer-offer creation', () => {
    expectPolicy({
      operationId: 'BE01b-09',
      method: 'POST',
      path: '/api/v1/aliases/:aliasId/transfer-offers',
      auth: 'session',
      rateLimit: 10,
      rateWindowSeconds: 60,
      timeoutMs: 15_000,
      cacheControl: 'no-store',
      idempotency: 'required',
      ifMatch: 'none',
    });
  });

  it('P2-S03-AC-129: BE01b-10 registers transfer-offer acceptance with CAS', () => {
    expectPolicy({
      operationId: 'BE01b-10',
      method: 'POST',
      path: '/api/v1/alias-transfer-offers/:offerId/accept',
      auth: 'session',
      rateLimit: 10,
      rateWindowSeconds: 60,
      timeoutMs: 15_000,
      cacheControl: 'no-store',
      idempotency: 'required',
      ifMatch: 'required',
    });
  });

  it('P2-S03-AC-130: BE01b-11 registers transfer-offer decline with CAS', () => {
    expectPolicy({
      operationId: 'BE01b-11',
      method: 'POST',
      path: '/api/v1/alias-transfer-offers/:offerId/decline',
      auth: 'session',
      rateLimit: 10,
      rateWindowSeconds: 60,
      timeoutMs: 15_000,
      cacheControl: 'no-store',
      idempotency: 'required',
      ifMatch: 'required',
    });
  });

  it('P2-S03-AC-131: BE01b-12 registers acting-context listing', () => {
    expectPolicy({
      operationId: 'BE01b-12',
      method: 'GET',
      path: '/api/v1/me/acting-contexts',
      auth: 'session',
      rateLimit: 300,
      rateWindowSeconds: 60,
      timeoutMs: 8_000,
      cacheControl: 'no-store',
      idempotency: 'none',
      ifMatch: 'none',
    });
  });

  it('P2-S03-AC-132: BE01b-13 registers deliberate context binding', () => {
    expectPolicy({
      operationId: 'BE01b-13',
      method: 'POST',
      path: '/api/v1/me/acting-context-bindings',
      auth: 'session',
      rateLimit: 60,
      rateWindowSeconds: 60,
      timeoutMs: 15_000,
      cacheControl: 'no-store',
      idempotency: 'required',
      ifMatch: 'none',
    });
  });

  it('P2-S03-AC-133: BE01b-14 protects legal-identity reads with step-up auth', () => {
    expectPolicy({
      operationId: 'BE01b-14',
      method: 'GET',
      path: '/api/v1/me/legal-identity',
      auth: 'session_step_up',
      rateLimit: 60,
      rateWindowSeconds: 60,
      timeoutMs: 8_000,
      cacheControl: 'no-store',
      idempotency: 'none',
      ifMatch: 'none',
    });
  });

  it('P2-S03-AC-134: BE01b-15 protects legal-identity writes with step-up and CAS', () => {
    expectPolicy({
      operationId: 'BE01b-15',
      method: 'PUT',
      path: '/api/v1/me/legal-identity',
      auth: 'session_step_up',
      rateLimit: 5,
      rateWindowSeconds: 3600,
      timeoutMs: 15_000,
      cacheControl: 'no-store',
      idempotency: 'required',
      ifMatch: 'required',
    });
  });

  it('P2-S03-AC-135: BE01b-16 protects legal-identity disclosures with step-up and CAS', () => {
    expectPolicy({
      operationId: 'BE01b-16',
      method: 'POST',
      path: '/api/v1/legal-identity-disclosures',
      auth: 'session_step_up',
      rateLimit: 10,
      rateWindowSeconds: 60,
      timeoutMs: 15_000,
      cacheControl: 'no-store',
      idempotency: 'required',
      ifMatch: 'required',
    });
  });

  it('P2-S03-AC-136: BE01b-17 protects disclosure reads with step-up auth', () => {
    expectPolicy({
      operationId: 'BE01b-17',
      method: 'GET',
      path: '/api/v1/legal-identity-disclosures/:disclosureId',
      auth: 'session_step_up',
      rateLimit: 60,
      rateWindowSeconds: 60,
      timeoutMs: 8_000,
      cacheControl: 'no-store',
      idempotency: 'none',
      ifMatch: 'none',
    });
  });

  it('P2-S03-AC-137: BE01b-18 registers the cacheable public party projection', () => {
    expectPolicy({
      operationId: 'BE01b-18',
      method: 'GET',
      path: '/api/v1/identity/parties/:partyId/projection',
      auth: 'public',
      rateLimit: 120,
      rateWindowSeconds: 60,
      timeoutMs: 8_000,
      cacheControl: 'public, max-age=60',
      idempotency: 'none',
      ifMatch: 'none',
    });
  });
});
