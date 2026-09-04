import { describe, expect, it } from 'vitest';

import { loadIdentityAuthorityRelationships } from './identity-authority-relationships';

const organizationId = '11111111-1111-4111-8111-111111111111';
const personId = '22222222-2222-4222-8222-222222222222';
const instant = '2026-01-01T00:00:00.000Z';

const privateOrganization = {
  organizationId,
  ownershipState: 'owned' as const,
  lifecycle: 'active' as const,
  typeCodes: ['band' as const],
  version: '7',
  etag: '"7"',
  createdAt: instant,
  updatedAt: instant,
};

const read = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

describe('identity-authority relationships server projection bridge', () => {
  it('keeps the server-selected acting party separate from the organization target', async () => {
    const calls: Array<{ path: string; credentials: string | undefined }> = [];
    const result = await loadIdentityAuthorityRelationships({
      canonicalRead: async (path, credentials) => {
        calls.push({ path, credentials });
        return read(
          path.endsWith('/memberships')
            ? { items: [], nextCursor: null, hasMore: false }
            : privateOrganization,
        );
      },
      readJson: async (response) => response.json(),
      hasSession: true,
      requestId: 'request-s04-loader',
      personId,
      contexts: {
        projectionVersion: '1',
        items: [
          {
            contextId: personId,
            partyId: personId,
            kind: 'person',
            label: 'Self',
            avatarRef: null,
            selectable: true,
            authorityFreshUntil: '2030-01-01T00:00:00.000Z',
          },
          {
            contextId: organizationId,
            partyId: organizationId,
            kind: 'organization',
            label: 'Band',
            avatarRef: null,
            selectable: true,
            authorityFreshUntil: '2030-01-01T00:00:00.000Z',
          },
        ],
        nextCursor: null,
        hasMore: false,
      },
      selectedId: organizationId,
    });

    expect(result.actingPartyId).toBe(personId);
    expect(result.organizationId).toBe(organizationId);
    expect(result.expectedVersion).toBe('"7"');
    expect(result.initial.status).toBe('success');
    expect(calls).toEqual([
      {
        path: `/api/v1/organizations/${organizationId}`,
        credentials: 'include',
      },
      {
        path: `/api/v1/organizations/${organizationId}/memberships`,
        credentials: undefined,
      },
    ]);
  });

  it('uses an explicit public organization selection without inventing acting authority', async () => {
    const calls: Array<{ path: string; credentials: string | undefined }> = [];
    const result = await loadIdentityAuthorityRelationships({
      canonicalRead: async (path, credentials) => {
        calls.push({ path, credentials });
        return read({
          organizationId,
          typeDisplay: ['Band'],
          lifecycleLabel: 'Active',
          version: '3',
        });
      },
      readJson: async (response) => response.json(),
      hasSession: false,
      requestId: 'request-s04-public',
      personId: null,
      contexts: null,
      selectedId: organizationId,
    });

    expect(result.actingPartyId).toBeNull();
    expect(result.organizationId).toBe(organizationId);
    expect(result.expectedVersion).toBeNull();
    expect(result.initial.status).toBe('success');
    expect(calls).toEqual([
      {
        path: `/api/v1/organizations/${organizationId}`,
        credentials: 'omit',
      },
    ]);
  });
});
