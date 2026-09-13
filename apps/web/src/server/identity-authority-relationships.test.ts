import { describe, expect, it } from 'vitest';

import { loadIdentityAuthorityRelationships } from './identity-authority-relationships';

const organizationId = '11111111-1111-4111-8111-111111111111';
const personId = '22222222-2222-4222-8222-222222222222';
const otherOrganizationId = '33333333-3333-4333-8333-333333333333';
const membershipIdA = '44444444-4444-4444-8444-444444444444';
const membershipIdB = '55555555-5555-4555-8555-555555555555';
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

const membership = (
  tenureId: string,
  targetOrganizationId = organizationId,
) => ({
  tenureId,
  organizationId: targetOrganizationId,
  personId,
  state: 'invited',
  provenance: 'invitation',
  startsOn: '2026-01-01',
  endsOn: null,
  acceptedAt: null,
  revokedAt: null,
  version: '2',
  etag: '"2"',
});

const membershipCollection = (
  items: ReturnType<typeof membership>[],
  nextCursor: string | null,
  hasMore: boolean,
) => ({ items, nextCursor, hasMore });

const privateContexts = {
  projectionVersion: '1',
  items: [
    {
      contextId: personId,
      partyId: personId,
      kind: 'person' as const,
      label: 'Self',
      avatarRef: null,
      selectable: true,
      authorityFreshUntil: '2030-01-01T00:00:00.000Z',
    },
    {
      contextId: organizationId,
      partyId: organizationId,
      kind: 'organization' as const,
      label: 'Band',
      avatarRef: null,
      selectable: true,
      authorityFreshUntil: '2030-01-01T00:00:00.000Z',
    },
  ],
  nextCursor: null,
  hasMore: false,
};

const loadPrivate = (
  canonicalRead: (
    path: string,
    credentials?: 'include' | 'omit',
  ) => Promise<Response>,
) =>
  loadIdentityAuthorityRelationships({
    canonicalRead,
    readJson: async (response) => response.json(),
    hasSession: true,
    requestId: 'request-s04-loader',
    personId,
    contexts: privateContexts,
    selectedId: organizationId,
  });

describe('identity-authority relationships server projection bridge', () => {
  it('keeps the server-selected acting party separate from the organization target', async () => {
    const calls: Array<{ path: string; credentials: string | undefined }> = [];
    const result = await loadIdentityAuthorityRelationships({
      canonicalRead: async (path, credentials) => {
        calls.push({ path, credentials });
        return read(
          path.includes('/memberships')
            ? membershipCollection([], null, false)
            : privateOrganization,
        );
      },
      readJson: async (response) => response.json(),
      hasSession: true,
      requestId: 'request-s04-loader',
      personId,
      contexts: privateContexts,
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

  it('follows bounded membership cursors and returns every page', async () => {
    const paths: string[] = [];
    const membershipPath = `/api/v1/organizations/${organizationId}/memberships`;
    const result = await loadPrivate(async (path) => {
      paths.push(path);
      if (path.endsWith('/memberships?cursor=next%2Fpage'))
        return read(
          membershipCollection([membership(membershipIdB)], null, false),
        );
      if (path === membershipPath)
        return read(
          membershipCollection([membership(membershipIdA)], 'next/page', true),
        );
      return read(privateOrganization);
    });

    expect(result.initial.status).toBe('success');
    if (result.initial.status === 'success')
      expect(result.initial.data.map(({ id }) => id)).toEqual([
        organizationId,
        membershipIdA,
        membershipIdB,
      ]);
    expect(paths).toEqual([
      `/api/v1/organizations/${organizationId}`,
      membershipPath,
      `${membershipPath}?cursor=next%2Fpage`,
    ]);
  });

  it.each([
    {
      label: 'a failed later page',
      pages: [
        read(membershipCollection([membership(membershipIdA)], 'next', true)),
        new Response(null, { status: 503 }),
      ],
    },
    {
      label: 'a repeated cursor',
      pages: [
        read(membershipCollection([membership(membershipIdA)], 'loop', true)),
        read(membershipCollection([], 'loop', true)),
      ],
    },
    {
      label: 'a duplicate tenure across pages',
      pages: [
        read(membershipCollection([membership(membershipIdA)], 'next', true)),
        read(membershipCollection([membership(membershipIdA)], null, false)),
      ],
    },
    {
      label: 'a membership for a different organization',
      pages: [
        read(
          membershipCollection(
            [membership(membershipIdA, otherOrganizationId)],
            null,
            false,
          ),
        ),
      ],
    },
    {
      label: 'inconsistent pagination metadata',
      pages: [
        read(membershipCollection([membership(membershipIdA)], null, true)),
      ],
    },
  ])(
    'fails closed on $label instead of returning partial organization data',
    async ({ pages }) => {
      const responses = [...pages];
      const result = await loadPrivate(async (path) => {
        if (!path.includes('/memberships')) return read(privateOrganization);
        return responses.shift() ?? new Response(null, { status: 500 });
      });

      expect(result.initial.status).toBe('degraded');
      if (result.initial.status === 'degraded')
        expect(result.initial.data).toBeNull();
    },
  );

  it('stops after the membership page bound and fails closed', async () => {
    let membershipPageCount = 0;
    const result = await loadPrivate(async (path) => {
      if (!path.includes('/memberships')) return read(privateOrganization);
      const cursor = `cursor-${membershipPageCount + 1}`;
      membershipPageCount += 1;
      return read(membershipCollection([], cursor, true));
    });

    expect(membershipPageCount).toBe(32);
    expect(result.initial.status).toBe('degraded');
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
