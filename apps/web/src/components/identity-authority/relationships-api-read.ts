import {
  MembershipCollectionSchema,
  OrganizationReadResponseSchema,
} from '@wejammin/contracts';
import type {
  MembershipTenureResource,
  OrganizationReadResponse,
  OrganizationResource,
} from '@wejammin/contracts';

import {
  addClientBindingIdHeader,
  CLIENT_BINDING_ID_HEADER,
} from '../../lib/client-binding';
import { readCurrentTabContext } from './acting-context-api-read';
import type {
  IdentityAuthorityAsyncState,
  IdentityAuthorityRecord,
} from './identity-authority-workbench-types';

const MAX_MEMBERSHIP_PAGES = 32;
export interface RelationshipCanonicalSnapshot {
  readonly actingPartyId: string;
  readonly organizationId: string | null;
  readonly expectedVersion: string | null;
  readonly initial: IdentityAuthorityAsyncState<
    readonly IdentityAuthorityRecord[]
  >;
}

const emptySnapshot = (
  actingPartyId: string,
): RelationshipCanonicalSnapshot => ({
  actingPartyId,
  organizationId: null,
  expectedVersion: null,
  initial: { status: 'empty', reason: 'no-records' },
});

const readBoundJson = async (endpoint: string): Promise<unknown> => {
  const init = await addClientBindingIdHeader(endpoint, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { accept: 'application/json' },
  });
  if (new Headers(init.headers).get(CLIENT_BINDING_ID_HEADER) === null)
    throw new Error('This tab cannot verify a bound relationship read.');

  const response = await fetch(endpoint, init);
  if (!response.ok)
    throw new Error('The canonical relationship projection is unavailable.');
  try {
    return await response.json();
  } catch {
    throw new Error('The canonical relationship projection is invalid.');
  }
};

const readAnonymousJson = async (endpoint: string): Promise<unknown> => {
  const response = await fetch(endpoint, {
    method: 'GET',
    credentials: 'omit',
    cache: 'no-store',
    headers: { accept: 'application/json' },
  });
  if (!response.ok)
    throw new Error('The public organization projection is unavailable.');
  try {
    return await response.json();
  } catch {
    throw new Error('The public organization projection is invalid.');
  }
};

const organizationRecord = (
  organization: OrganizationReadResponse,
  visibility: 'authorized' | 'public',
  now: string,
): IdentityAuthorityRecord => ({
  id: organization.organizationId,
  version: organization.version,
  state:
    'lifecycle' in organization
      ? organization.lifecycle
      : (organization.lifecycleLabel ?? 'published'),
  provenance: [
    {
      source: 'identity-authority-organization-read',
      evidence: 'canonical',
      at: now,
      visibility,
    },
  ],
  projection: organization as unknown as Readonly<Record<string, unknown>>,
});

const membershipRecords = (
  items: readonly MembershipTenureResource[],
  now: string,
): readonly IdentityAuthorityRecord[] =>
  items.map((item) => ({
    id: item.tenureId,
    version: item.version,
    state: item.state,
    provenance: [
      {
        source: 'identity-authority-membership-read',
        evidence: item.provenance,
        at: now,
        visibility: 'authorized',
      },
    ],
    projection: item as unknown as Readonly<Record<string, unknown>>,
  }));

const successSnapshot = (
  actingPartyId: string,
  organizationId: string,
  organization: OrganizationResource,
  memberships: readonly MembershipTenureResource[],
): RelationshipCanonicalSnapshot => {
  const now = new Date().toISOString();
  const data = [
    organizationRecord(organization, 'authorized', now),
    ...membershipRecords(memberships, now),
  ];
  return {
    actingPartyId,
    organizationId,
    expectedVersion: organization.etag,
    initial: {
      status: 'success',
      data,
      version: organization.version,
      stale: false,
    },
  };
};

const selectedOrganizationId = (
  resolved: Awaited<ReturnType<typeof readCurrentTabContext>>,
  requestedOrganizationId: string | null,
): string | null => {
  if (resolved.active.kind === 'organization') return resolved.active.partyId;
  const selectableOrganizations = resolved.resource.items.filter(
    (item) => item.kind === 'organization' && item.selectable,
  );
  return (
    selectableOrganizations.find(
      (item) => item.partyId === requestedOrganizationId,
    )?.partyId ??
    selectableOrganizations[0]?.partyId ??
    null
  );
};

const readMembershipPages = async (
  organizationId: string,
): Promise<readonly MembershipTenureResource[]> => {
  const items: MembershipTenureResource[] = [];
  const tenureIds = new Set<string>();
  const cursors = new Set<string>();
  const base = `/api/v1/organizations/${encodeURIComponent(organizationId)}/memberships`;
  let cursor: string | null = null;

  for (let pageIndex = 0; pageIndex < MAX_MEMBERSHIP_PAGES; pageIndex += 1) {
    const endpoint =
      cursor === null ? base : `${base}?cursor=${encodeURIComponent(cursor)}`;
    const parsed = MembershipCollectionSchema.safeParse(
      await readBoundJson(endpoint),
    );
    if (
      !parsed.success ||
      parsed.data.hasMore !== (parsed.data.nextCursor !== null)
    )
      throw new Error('The canonical membership projection is invalid.');

    for (const item of parsed.data.items) {
      if (
        item.organizationId !== organizationId ||
        tenureIds.has(item.tenureId)
      )
        throw new Error('The canonical membership projection is inconsistent.');
      tenureIds.add(item.tenureId);
      items.push(item);
    }
    if (!parsed.data.hasMore) return items;

    const nextCursor = parsed.data.nextCursor;
    if (nextCursor === null || cursors.has(nextCursor))
      throw new Error('The canonical membership projection is inconsistent.');
    cursors.add(nextCursor);
    cursor = nextCursor;
  }

  throw new Error('The canonical membership projection exceeds safe limits.');
};

export const readCurrentRelationshipProjections = async (
  requestedOrganizationId: string | null,
): Promise<RelationshipCanonicalSnapshot> => {
  const resolved = await readCurrentTabContext();
  const organizationId = selectedOrganizationId(
    resolved,
    requestedOrganizationId,
  );
  if (organizationId === null) return emptySnapshot(resolved.active.partyId);

  const endpoint = `/api/v1/me/organizations/${encodeURIComponent(organizationId)}`;
  const organizationResponse = OrganizationReadResponseSchema.safeParse(
    await readBoundJson(endpoint),
  );
  if (
    !organizationResponse.success ||
    !('etag' in organizationResponse.data) ||
    organizationResponse.data.organizationId !== organizationId
  )
    throw new Error(
      'The private organization projection could not be verified.',
    );

  const memberships = await readMembershipPages(organizationId);
  return successSnapshot(
    resolved.active.partyId,
    organizationId,
    organizationResponse.data,
    memberships,
  );
};

export const readPublicRelationshipProjections = async (
  organizationId: string | null,
): Promise<RelationshipCanonicalSnapshot> => {
  if (organizationId === null) return emptySnapshot('public');
  const endpoint = `/api/v1/organizations/${encodeURIComponent(organizationId)}`;
  const parsed = OrganizationReadResponseSchema.safeParse(
    await readAnonymousJson(endpoint),
  );
  if (
    !parsed.success ||
    'etag' in parsed.data ||
    parsed.data.organizationId !== organizationId
  )
    throw new Error(
      'The public organization projection could not be verified.',
    );
  const now = new Date().toISOString();
  const record = organizationRecord(parsed.data, 'public', now);
  return {
    actingPartyId: 'public',
    organizationId,
    expectedVersion: null,
    initial: {
      status: 'success',
      data: [record],
      version: parsed.data.version,
      stale: false,
    },
  };
};

export const unavailableRelationshipState = (): IdentityAuthorityAsyncState<
  readonly IdentityAuthorityRecord[]
> => ({
  status: 'degraded',
  data: null,
  requestId: 'relationship-context-unavailable',
  lastVerifiedAt: null,
});
