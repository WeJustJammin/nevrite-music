import type {
  ActingContextListResource,
  MembershipCollection,
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
  collection: MembershipCollection,
  now: string,
): readonly IdentityAuthorityRecord[] =>
  collection.items.map((item) => ({
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
    return {
      actingPartyId,
      organizationId: targetOrganizationId,
      expectedVersion: null,
      initial: {
        status: 'degraded',
        data: null,
        requestId,
        lastVerifiedAt: null,
      },
    };
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
    const memberships = await canonicalRead(
      `/api/v1/organizations/${encodeURIComponent(targetOrganizationId)}/memberships`,
    );
    if (memberships.ok) {
      const parsedMemberships = MembershipCollectionSchema.safeParse(
        await readJson(memberships),
      );
      if (parsedMemberships.success) {
        records = [
          organizationRecord,
          ...membershipRecords(parsedMemberships.data, now),
        ];
      }
    }
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
