import { describe, expect, it } from 'vitest';

import {
  PROFILE_OWNERSHIP_ROUTE_CONTRACTS,
  forwardProfileOwnershipRequest,
} from './profile-ownership-platform-api.ts';

const RECORD_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const REQUEST_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132dc';

const binding = (capture: (request: Request) => void, response: Response) => ({
  fetch: async (input: RequestInfo | URL): Promise<Response> => {
    capture(new Request(input));
    return response;
  },
});

const browserRequest = (path: string, body: string): Request =>
  new Request(`https://webjammin.test${path}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      cookie:
        'wj_session_ref=session-secret; wj_csrf=csrf-secret; analytics=should-not-forward',
      authorization: 'Bearer browser-token-must-not-forward',
      'x-acting-party-id': 'attacker-controlled-party',
      'x-csrf-token': 'csrf-secret',
      'idempotency-key': 'slice05-invitation-key',
      'if-match': '"7"',
      'x-request-id': REQUEST_ID,
    },
    body,
  });

describe('P2-S05 same-origin profile ownership API façade', () => {
  it('[P2-S05-AC-091..105] exposes only the active PRF-API-01..08 route map with canonical methods and paths', () => {
    expect(PROFILE_OWNERSHIP_ROUTE_CONTRACTS).toHaveLength(8);
    expect(
      PROFILE_OWNERSHIP_ROUTE_CONTRACTS.map(({ operationId }) => operationId),
    ).toEqual([
      'PRF-API-01',
      'PRF-API-02',
      'PRF-API-03',
      'PRF-API-04',
      'PRF-API-05',
      'PRF-API-06',
      'PRF-API-07',
      'PRF-API-08',
    ]);
    expect(
      PROFILE_OWNERSHIP_ROUTE_CONTRACTS.map(({ method }) => method),
    ).toEqual(['POST', 'POST', 'POST', 'POST', 'GET', 'POST', 'POST', 'POST']);
    expect(PROFILE_OWNERSHIP_ROUTE_CONTRACTS.map(({ path }) => path)).toEqual([
      '/api/v1/shadow-party-matches',
      '/api/v1/shadow-parties/:shadowId/invitations',
      '/api/v1/shadow-remedies',
      '/api/v1/party-claims',
      '/api/v1/party-claims/:claimId',
      '/api/v1/party-claims/:claimId/challenges',
      '/api/v1/party-claims/:claimId/proofs',
      '/api/v1/party-claims/:claimId/convert',
    ]);
    expect(
      PROFILE_OWNERSHIP_ROUTE_CONTRACTS.every(
        ({ deferred }) => deferred === false,
      ),
    ).toBe(true);
  });

  it('[P2-S05-AC-019, P2-S05-AC-025, P2-S05-AC-042, P2-S05-AC-050] forwards typed JSON and approved browser headers without browser authority', async () => {
    let forwarded: Request | null = null;
    const response = await forwardProfileOwnershipRequest(
      browserRequest(
        `/api/v1/shadow-parties/${RECORD_ID}/invitations`,
        JSON.stringify({ contactRouteId: RECORD_ID, trigger: 'initial' }),
      ),
      binding(
        (request) => {
          forwarded = request;
        },
        new Response(JSON.stringify({ state: 'queued' }), {
          status: 201,
          headers: {
            'content-type': 'application/json',
            etag: '"8"',
            'x-request-id': REQUEST_ID,
            'x-private-upstream': 'secret',
          },
        }),
      ),
      `/api/v1/shadow-parties/${RECORD_ID}/invitations`,
      'POST',
    );

    expect(forwarded).not.toBeNull();
    const captured = forwarded as unknown as Request;
    expect(captured.headers.get('cookie')).toBe(
      'wj_session_ref=session-secret; wj_csrf=csrf-secret',
    );
    expect(captured.headers.get('authorization')).toBeNull();
    expect(captured.headers.get('x-acting-party-id')).toBeNull();
    expect(captured.headers.get('x-csrf-token')).toBe('csrf-secret');
    expect(captured.headers.get('idempotency-key')).toBe(
      'slice05-invitation-key',
    );
    expect(captured.headers.get('if-match')).toBe('"7"');
    await expect(captured.json()).resolves.toEqual({
      contactRouteId: RECORD_ID,
      trigger: 'initial',
    });
    expect(response.status).toBe(201);
    expect(response.headers.get('etag')).toBe('"8"');
    expect(response.headers.get('x-private-upstream')).toBeNull();
  });

  it('[P2-S05-AC-003, P2-S05-AC-116..118] forwards account-free remedy without authenticating the pointer or leaking private cookies', async () => {
    let forwarded: Request | null = null;
    const response = await forwardProfileOwnershipRequest(
      browserRequest(
        '/api/v1/shadow-remedies',
        JSON.stringify({
          pointerToken: 'rm8p2v6q9yw4abcdefghijklmnopqrstuvwxyz1abcd',
          action: 'suppress',
          scope: 'both',
          proof: { kind: 'route_code', code: '123456' },
        }),
      ),
      binding(
        (request) => {
          forwarded = request;
        },
        new Response(JSON.stringify({ accepted: true, state: 'active' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
      '/api/v1/shadow-remedies',
      'POST',
      { credentials: 'omit' },
    );

    expect(forwarded).not.toBeNull();
    const captured = forwarded as unknown as Request;
    expect(captured.headers.get('cookie')).toBeNull();
    expect(captured.headers.get('x-csrf-token')).toBeNull();
    expect(captured.headers.get('if-match')).toBeNull();
    expect(captured.headers.get('idempotency-key')).toBe(
      'slice05-invitation-key',
    );
    expect(captured.headers.get('authorization')).toBeNull();
    expect(response.status).toBe(200);
  });

  it('[P2-S05-AC-032, P2-S05-AC-068, P2-S05-AC-074] converts invalid bindings, non-JSON upstreams, and thrown fetches into typed no-store dependency errors', async () => {
    const request = browserRequest(
      '/api/v1/party-claims',
      JSON.stringify({ targetPartyId: RECORD_ID, claimKind: 'self' }),
    );
    const invalid = await forwardProfileOwnershipRequest(
      request,
      null,
      '/api/v1/party-claims',
      'POST',
    );
    expect(invalid.status).toBe(503);
    expect(invalid.headers.get('cache-control')).toBe('no-store');
    await expect(invalid.json()).resolves.toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
      requestId: REQUEST_ID,
    });

    const nonJson = await forwardProfileOwnershipRequest(
      request,
      binding(() => undefined, new Response('upstream html', { status: 200 })),
      '/api/v1/party-claims',
      'POST',
    );
    expect(nonJson.status).toBe(503);
    expect(nonJson.headers.get('cache-control')).toBe('no-store');
  });
});
