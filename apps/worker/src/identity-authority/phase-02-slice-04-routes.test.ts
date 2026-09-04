import { describe, expect, it, vi } from 'vitest';

import {
  CSRF,
  ORIGIN,
  REQUEST_ID,
  bindings,
} from '../authentication/phase-02-slice-02.test-fixtures';
import {
  createApp,
  success,
} from '../authentication/phase-02-slice-02.test-support';

const ORGANIZATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ASSIGNMENT_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TENURE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const TERMS_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const EVIDENCE_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const PERSON_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const INVITE_EXPIRES_AT = new Date(
  Date.now() + 24 * 60 * 60 * 1_000,
).toISOString();

const organization = {
  organizationId: ORGANIZATION_ID,
  ownershipState: 'owned',
  lifecycle: 'active',
  typeCodes: ['band'],
  version: '1',
  etag: '"1"',
  createdAt: '2026-09-01T05:00:00Z',
  updatedAt: '2026-09-01T05:00:00Z',
};

const publicOrganization = {
  organizationId: ORGANIZATION_ID,
  typeDisplay: ['Band'],
  lifecycleLabel: 'Active',
  version: '1',
};

const assignment = {
  assignmentId: ASSIGNMENT_ID,
  organizationId: ORGANIZATION_ID,
  typeCode: 'label',
  startsAt: '2026-09-01T05:00:00Z',
  endsAt: null,
  state: 'active',
  version: '1',
  etag: '"1"',
};

const tenure = {
  tenureId: TENURE_ID,
  organizationId: ORGANIZATION_ID,
  personId: PERSON_ID,
  state: 'invited',
  provenance: 'invitation',
  startsOn: '2026-09-01',
  endsOn: null,
  acceptedAt: null,
  revokedAt: null,
  version: '1',
  etag: '"1"',
};

const assertedTenure = {
  ...tenure,
  state: 'asserted',
  provenance: 'historical_assertion',
};

const acceptedTenure = {
  ...tenure,
  state: 'confirmed',
  acceptedAt: '2026-09-01T05:00:00Z',
  version: '2',
  etag: '"2"',
};

const capacityPeriod = {
  periodId: '12121212-1212-4212-8212-121212121212',
  tenureId: TENURE_ID,
  capacity: 'touring',
  startsOn: '2026-09-01',
  endsOn: '2026-10-01',
  version: '1',
  etag: '"1"',
};

const membershipCollection = {
  items: [tenure],
  nextCursor: null,
  hasMore: false,
};

type RouteCase = Readonly<{
  criterion: string;
  operationId: string;
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  body?: Readonly<Record<string, unknown>>;
  status: 200 | 201;
  ifMatch?: boolean;
  anonymous?: boolean;
  port: string;
  response: unknown;
}>;

const routeCases: readonly RouteCase[] = [
  {
    criterion: 'P2-S04-AC-003 IDA-06 creates a self-member organization',
    operationId: 'ORG-01',
    method: 'POST',
    path: '/api/v1/organizations',
    body: { mode: 'self_member', typeCodes: ['band'] },
    status: 201,
    port: 'createOrganization',
    response: organization,
  },
  {
    criterion: 'P2-S04-AC-009 ORG-02 reads the public organization projection',
    operationId: 'ORG-02',
    method: 'GET',
    path: `/api/v1/organizations/${ORGANIZATION_ID}`,
    status: 200,
    anonymous: true,
    port: 'readOrganization',
    response: publicOrganization,
  },
  {
    criterion: 'P2-S04-AC-015 IDA-07 adds one organization type',
    operationId: 'TYPE-01',
    method: 'POST',
    path: `/api/v1/organizations/${ORGANIZATION_ID}/type-assignments`,
    body: { typeCode: 'label' },
    status: 201,
    ifMatch: true,
    port: 'addOrganizationType',
    response: assignment,
  },
  {
    criterion: 'P2-S04-AC-021 IDA-07 ends one organization type assignment',
    operationId: 'TYPE-02',
    method: 'DELETE',
    path: `/api/v1/organizations/${ORGANIZATION_ID}/type-assignments/${ASSIGNMENT_ID}`,
    body: {},
    status: 200,
    ifMatch: true,
    port: 'removeOrganizationType',
    response: organization,
  },
  {
    criterion: 'P2-S04-AC-027 IDA-08 invites an existing person',
    operationId: 'MEM-01',
    method: 'POST',
    path: `/api/v1/organizations/${ORGANIZATION_ID}/membership-invitations`,
    body: {
      personId: PERSON_ID,
      startsOn: '2026-09-01',
      termsVersionId: TERMS_ID,
      governanceMode: 'governed',
      capacity: 'permanent',
      inviteExpiresAt: INVITE_EXPIRES_AT,
    },
    status: 201,
    ifMatch: true,
    port: 'inviteMembership',
    response: tenure,
  },
  {
    criterion: 'P2-S04-AC-033 IDA-08 records a protected historical assertion',
    operationId: 'MEM-02',
    method: 'POST',
    path: `/api/v1/organizations/${ORGANIZATION_ID}/membership-assertions`,
    body: {
      personId: PERSON_ID,
      startsOn: '2024-01-01',
      provenance: 'historical_assertion',
      evidenceRef: EVIDENCE_ID,
    },
    status: 201,
    ifMatch: true,
    port: 'assertMembership',
    response: assertedTenure,
  },
  {
    criterion: 'P2-S04-AC-039 accepts membership as the invited person',
    operationId: 'MEM-03',
    method: 'POST',
    path: `/api/v1/membership-tenures/${TENURE_ID}/accept`,
    body: {
      termsVersionId: TERMS_ID,
      termsHash:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      decision: 'accept',
    },
    status: 200,
    ifMatch: true,
    port: 'acceptMembership',
    response: acceptedTenure,
  },
  {
    criterion: 'P2-S04-AC-045 ends membership immediately',
    operationId: 'MEM-04',
    method: 'POST',
    path: `/api/v1/membership-tenures/${TENURE_ID}/end`,
    body: { mode: 'now', reasonCode: 'AUTHORITY_WITHDRAWN' },
    status: 200,
    ifMatch: true,
    port: 'endMembership',
    response: {
      ...acceptedTenure,
      state: 'ended',
      revokedAt: '2026-09-01T05:00:00Z',
      version: '3',
      etag: '"3"',
    },
  },
  {
    criterion: 'P2-S04-AC-051 adds a contained capacity period',
    operationId: 'MEM-05',
    method: 'POST',
    path: `/api/v1/membership-tenures/${TENURE_ID}/capacity-periods`,
    body: { capacity: 'touring', startsOn: '2026-09-01', endsOn: '2026-10-01' },
    status: 201,
    ifMatch: true,
    port: 'addCapacityPeriod',
    response: capacityPeriod,
  },
  {
    criterion: 'P2-S04-AC-057 reads the context-bound membership collection',
    operationId: 'MEM-06',
    method: 'GET',
    path: `/api/v1/organizations/${ORGANIZATION_ID}/memberships`,
    status: 200,
    port: 'readMemberships',
    response: membershipCollection,
  },
];

const requestFor = (testCase: RouteCase): Request => {
  const headers = new Headers({
    accept: 'application/json',
    origin: ORIGIN,
    'x-request-id': REQUEST_ID,
  });
  if (!testCase.anonymous) {
    headers.set(
      'cookie',
      `wj_session_ref=slice02-session-ref; wj_csrf=${CSRF}`,
    );
    headers.set('x-csrf-token', CSRF);
  }
  if (testCase.method !== 'GET') {
    headers.set('content-type', 'application/json');
    headers.set('idempotency-key', `slice04-${testCase.operationId}`);
  }
  if (testCase.ifMatch) headers.set('if-match', '"1"');
  return new Request(`${ORIGIN}${testCase.path}`, {
    method: testCase.method,
    headers,
    ...(testCase.body === undefined
      ? {}
      : { body: JSON.stringify(testCase.body) }),
  });
};

const installPort = (
  identity: unknown,
  name: string,
  response: unknown,
): ReturnType<typeof vi.fn> => {
  const port = vi.fn(async () => success(response));
  (identity as unknown as Record<string, unknown>)[name] = port;
  return port;
};

describe('Phase 2 Slice 04 Worker route RED contracts', () => {
  it.each(routeCases)('$criterion', async (testCase) => {
    const { app, identity } = createApp();
    const port = installPort(identity, testCase.port, testCase.response);
    const response = await app.fetch(requestFor(testCase), bindings);

    expect(response.status).toBe(testCase.status);
    expect(response.headers.get('x-request-id')).toBe(REQUEST_ID);
    if (testCase.operationId === 'ORG-01')
      expect(response.headers.get('location')).toBe(
        `/api/v1/organizations/${ORGANIZATION_ID}`,
      );
    expect(port).toHaveBeenCalled();
  });
});
