import type {
  ActingContextListResource,
  MembershipCollection,
  MembershipTenureResource,
  OrganizationReadResponse,
} from '@wejammin/contracts';
import {
  MembershipCollectionSchema,
  OrganizationReadResponseSchema,
} from '@wejammin/contracts';

import type {
  IdentityAuthorityAsyncState,
  IdentityAuthorityRecord,
} from '../components/identity-authority/identity-authority-workbench-types';
import type { RelationshipsAuthorityGovernanceIslandProps } from '../components/identity-authority/RelationshipsAuthorityGovernanceIsland';

const MAX_MEMBERSHIP_PAGES = 32;

export interface IdentityAuthorityRelationshipLoadResult {
  readonly actingPartyId: string | null;
  readonly organizationId: string | null;
  readonly expectedVersion: string | null;
  readonly initial: IdentityAuthorityAsyncState<
    readonly IdentityAuthorityRecord[]
  >;
}

export const createIdentityAuthorityRelationshipWorkbench = (
  input: Readonly<{
    readonly relationshipTab: boolean;
    readonly hasSession: boolean;
    readonly personId: string | null;
    readonly selectedId: string | null;
    readonly result: IdentityAuthorityRelationshipLoadResult;
  }>,
): RelationshipsAuthorityGovernanceIslandProps | undefined => {
  if (!input.relationshipTab) return undefined;
  const { result } = input;
  return {
    contractFields: {
      source: '01c-relationships-authority-governance.md',
      fields: {},
    },
    variant:
      result.initial.status === 'degraded'
        ? 'degradedPage'
        : input.hasSession
          ? 'ownerFull'
          : 'publicRead',
    initial: result.initial,
    actorId: input.personId ?? 'public',
    actingPartyId: result.actingPartyId ?? 'public',
    access:
      result.initial.status === 'degraded'
        ? 'read-only'
        : input.hasSession
          ? 'full'
          : 'read-only',
    query: {
      tab: 'relationships',
      ...(input.selectedId === null ? {} : { selected: input.selectedId }),
    },
    selectedId: result.organizationId,
    expectedVersion: result.expectedVersion,
    organizationId: result.organizationId,
  };
};

interface RelationshipReadInput {
  readonly canonicalRead: (
    path: string,
    credentials?: 'include' | 'omit',
  ) => Promise<Response>;
  readonly readJson: (response: Response) => Promise<unknown | null>;
  readonly hasSession: boolean;
  readonly requestId: string;
  readonly personId: string | null;
  readonly contexts: ActingContextListResource | null;
  readonly selectedId: string | null;
}

const emptyResult = (
  actingPartyId: string | null,
): IdentityAuthorityRelationshipLoadResult => ({
  actingPartyId,
  organizationId: null,
  expectedVersion: null,
  initial: { status: 'empty', reason: 'no-records' },
});

const recordFromResource = (
  resource: OrganizationReadResponse,
  visibility: 'public' | 'authorized',
  now: string,
): IdentityAuthorityRecord => ({
  id: resource.organizationId,
  version: resource.version,
  state:
    'lifecycle' in resource
      ? resource.lifecycle
      : (resource.lifecycleLabel ?? 'published'),
  provenance: [
    {
      source: 'identity-authority-organization-read',
      evidence: 'canonical',
      at: now,
      visibility,
    },
  ],
  projection: resource as unknown as Readonly<Record<string, unknown>>,
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

const degradedResult = (
  actingPartyId: string | null,
  organizationId: string,
  requestId: string,
): IdentityAuthorityRelationshipLoadResult => ({
  actingPartyId,
  organizationId,
  expectedVersion: null,
  initial: {
    status: 'degraded',
    data: null,
    requestId,
    lastVerifiedAt: null,
  },
});

const readMembershipPages = async (
  canonicalRead: RelationshipReadInput['canonicalRead'],
  readJson: RelationshipReadInput['readJson'],
  organizationId: string,
): Promise<readonly MembershipTenureResource[] | null> => {
  const items: MembershipTenureResource[] = [];
  const tenureIds = new Set<string>();
  const cursors = new Set<string>();
  const base = `/api/v1/organizations/${encodeURIComponent(organizationId)}/memberships`;
  let cursor: string | null = null;

  for (let pageIndex = 0; pageIndex < MAX_MEMBERSHIP_PAGES; pageIndex += 1) {
    const path =
      cursor === null ? base : `${base}?cursor=${encodeURIComponent(cursor)}`;
    let collection: MembershipCollection;
    try {
      const response = await canonicalRead(path);
      if (!response.ok) return null;
      const parsed = MembershipCollectionSchema.safeParse(
        await readJson(response),
      );
      if (
        !parsed.success ||
        parsed.data.hasMore !== (parsed.data.nextCursor !== null)
      )
        return null;
      collection = parsed.data;
    } catch {
      return null;
    }

    for (const item of collection.items) {
      if (
        item.organizationId !== organizationId ||
        tenureIds.has(item.tenureId)
      )
        return null;
      tenureIds.add(item.tenureId);
      items.push(item);
    }
    if (!collection.hasMore) return items;

    const nextCursor = collection.nextCursor;
    if (
      nextCursor === null ||
      nextCursor.length === 0 ||
      cursors.has(nextCursor)
    )
      return null;
    cursors.add(nextCursor);
    cursor = nextCursor;
  }

  return null;
};

export const loadIdentityAuthorityRelationships = async ({
  canonicalRead,
  readJson,
  hasSession,
  requestId,
  personId,
  contexts,
  selectedId,
}: RelationshipReadInput): Promise<IdentityAuthorityRelationshipLoadResult> => {
  const selectable = contexts?.items.filter((item) => item.selectable) ?? [];
  const actingPartyId = selectable[0]?.partyId ?? personId;
  const organizationId =
    selectable.find(
      (item) => item.kind === 'organization' && item.partyId === selectedId,
    )?.partyId ??
    selectable.find((item) => item.kind === 'organization')?.partyId ??
    null;
  const publicOrganizationId = !hasSession ? selectedId : null;
  const targetOrganizationId = organizationId ?? publicOrganizationId;
  if (targetOrganizationId === null) return emptyResult(actingPartyId);

  const response = await canonicalRead(
    `/api/v1/organizations/${encodeURIComponent(targetOrganizationId)}`,
    hasSession ? 'include' : 'omit',
  );
  const parsed = response.ok ? await readJson(response) : null;
  const organization = OrganizationReadResponseSchema.safeParse(parsed);
  if (!organization.success) {
    return degradedResult(actingPartyId, targetOrganizationId, requestId);
  }

  const resource = organization.data;
  const privateResource = 'etag' in resource;
  const now = new Date().toISOString();
  const organizationRecord = recordFromResource(
    resource,
    privateResource ? 'authorized' : 'public',
    now,
  );
  let records: readonly IdentityAuthorityRecord[] = [organizationRecord];
  if (privateResource) {
    const memberships = await readMembershipPages(
      canonicalRead,
      readJson,
      targetOrganizationId,
    );
    if (memberships === null)
      return degradedResult(actingPartyId, targetOrganizationId, requestId);
    records = [organizationRecord, ...membershipRecords(memberships, now)];
  }
  return {
    actingPartyId,
    organizationId: targetOrganizationId,
    expectedVersion: privateResource ? resource.etag : null,
    initial: {
      status: 'success',
      data: records,
      version: resource.version,
      stale: false,
    },
  };
};
