import { describe, expect, it, vi } from 'vitest';

import { createLogger } from '@wejammin/observability/logging';

import { createWorkerApp, type WorkerDependencies } from '../index';
import {
  CSRF,
  ORIGIN,
  REQUEST_ID,
} from '../authentication/phase-02-slice-02.test-fixtures';
import { createApp } from '../authentication/phase-02-slice-02.test-support';
import type { IdentityCommitResult } from './types';

const ORGANIZATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ASSIGNMENT_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TENURE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const TERMS_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const PERSON_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const INVITE_EXPIRES_AT = new Date(Date.now() + 86_400_000).toISOString();
const AUDIT_ID = '12121212-1212-4212-8212-121212121212';
const OUTBOX_ID = '13131313-1313-4313-8313-131313131313';
const responseBodyFor = (operationId: string): unknown => {
  const organization = {
    organizationId: ORGANIZATION_ID,
    ownershipState: 'owned',
    lifecycle: 'active',
    typeCodes: ['band'],
    version: '2',
    etag: '"2"',
    createdAt: '2026-09-01T05:00:00Z',
    updatedAt: '2026-09-01T05:00:00Z',
  };
  const tenure = {
    tenureId: TENURE_ID,
    organizationId: ORGANIZATION_ID,
    personId: PERSON_ID,
    state: 'confirmed',
    provenance: 'invitation',
    startsOn: '2026-09-01',
    endsOn: null,
    acceptedAt: '2026-09-01T05:00:00Z',
    revokedAt: null,
    version: '2',
    etag: '"2"',
  };
  const assignment = {
    assignmentId: ASSIGNMENT_ID,
    organizationId: ORGANIZATION_ID,
    typeCode: 'label',
    startsAt: '2026-09-01T05:00:00Z',
    endsAt: null,
    state: 'active',
    version: '2',
    etag: '"2"',
  };
  const capacityPeriod = {
    periodId: '12121212-1212-4212-8212-121212121212',
    tenureId: TENURE_ID,
    capacity: 'touring',
    startsOn: '2026-09-01',
    endsOn: '2026-10-01',
    version: '2',
    etag: '"2"',
  };
  switch (operationId) {
    case 'ORG-01':
    case 'TYPE-02':
      return organization;
    case 'ORG-02':
      return {
        organizationId: ORGANIZATION_ID,
        typeDisplay: ['Band'],
        lifecycleLabel: 'Active',
        version: '2',
      };
    case 'TYPE-01':
      return assignment;
    case 'MEM-01':
    case 'MEM-02':
    case 'MEM-03':
    case 'MEM-04':
      return tenure;
    case 'MEM-05':
      return capacityPeriod;
    case 'MEM-06':
      return { items: [tenure], nextCursor: null, hasMore: false };
    default:
      throw new Error(`Missing Slice 04 response fixture for ${operationId}`);
  }
};
type RecoveryCase = Readonly<{
  criterion: string;
  operationId: string;
  method: 'DELETE' | 'GET' | 'POST';
  path: string;
  body?: Readonly<Record<string, unknown>>;
  mutation: boolean;
  ifMatch: boolean;
  anonymous: boolean;
  status: 200 | 201;
}>;
const cases: readonly RecoveryCase[] = [
  {
    criterion: 'P2-S04-AC-008',
    operationId: 'ORG-01',
    method: 'POST',
    path: '/api/v1/organizations',
    body: { mode: 'self_member', typeCodes: ['band'] },
    mutation: true,
    ifMatch: false,
    anonymous: false,
    status: 201,
  },
  {
    criterion: 'P2-S04-AC-014',
    operationId: 'ORG-02',
    method: 'GET',
    path: `/api/v1/organizations/${ORGANIZATION_ID}`,
    mutation: false,
    ifMatch: false,
    anonymous: true,
    status: 200,
  },
  {
    criterion: 'P2-S04-AC-020',
    operationId: 'TYPE-01',
    method: 'POST',
    path: `/api/v1/organizations/${ORGANIZATION_ID}/type-assignments`,
    body: { typeCode: 'label' },
    mutation: true,
    ifMatch: true,
    anonymous: false,
    status: 201,
  },
  {
    criterion: 'P2-S04-AC-026',
    operationId: 'TYPE-02',
    method: 'DELETE',
    path: `/api/v1/organizations/${ORGANIZATION_ID}/type-assignments/${ASSIGNMENT_ID}`,
    body: {},
    mutation: true,
    ifMatch: true,
    anonymous: false,
    status: 200,
  },
  {
    criterion: 'P2-S04-AC-032',
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
    mutation: true,
    ifMatch: true,
    anonymous: false,
    status: 201,
  },
  {
    criterion: 'P2-S04-AC-038',
    operationId: 'MEM-02',
    method: 'POST',
    path: `/api/v1/organizations/${ORGANIZATION_ID}/membership-assertions`,
    body: {
      personId: PERSON_ID,
      startsOn: '2024-01-01',
      provenance: 'historical_assertion',
      evidenceRef: TERMS_ID,
    },
    mutation: true,
    ifMatch: true,
    anonymous: false,
    status: 201,
  },
  {
    criterion: 'P2-S04-AC-044',
    operationId: 'MEM-03',
    method: 'POST',
    path: `/api/v1/membership-tenures/${TENURE_ID}/accept`,
    body: {
      termsVersionId: TERMS_ID,
      termsHash: 'a'.repeat(64),
      decision: 'accept',
    },
    mutation: true,
    ifMatch: true,
    anonymous: false,
    status: 200,
  },
  {
    criterion: 'P2-S04-AC-050',
    operationId: 'MEM-04',
    method: 'POST',
    path: `/api/v1/membership-tenures/${TENURE_ID}/end`,
    body: { mode: 'now', reasonCode: 'AUTHORITY_WITHDRAWN' },
    mutation: true,
    ifMatch: true,
    anonymous: false,
    status: 200,
  },
  {
    criterion: 'P2-S04-AC-056',
    operationId: 'MEM-05',
    method: 'POST',
    path: `/api/v1/membership-tenures/${TENURE_ID}/capacity-periods`,
    body: { capacity: 'touring', startsOn: '2026-09-01', endsOn: '2026-10-01' },
    mutation: true,
    ifMatch: true,
    anonymous: false,
    status: 201,
  },
  {
    criterion: 'P2-S04-AC-062',
    operationId: 'MEM-06',
    method: 'GET',
    path: `/api/v1/organizations/${ORGANIZATION_ID}/memberships`,
    mutation: false,
    ifMatch: false,
    anonymous: false,
    status: 200,
  },
];
type RecoveryDependencies = {
  commit: ReturnType<typeof vi.fn>;
  read: ReturnType<typeof vi.fn>;
  reconcile: ReturnType<typeof vi.fn>;
  telemetry: ReturnType<typeof vi.fn>;
};
const committed = (testCase: RecoveryCase): IdentityCommitResult => ({
  kind: 'committed',
  status: testCase.status,
  body: responseBodyFor(testCase.operationId),
  auditId: AUDIT_ID,
  outboxIds: [OUTBOX_ID],
});
const requestFor = (testCase: RecoveryCase, key = 'slice04-recovery') => {
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
  }
  if (testCase.mutation) {
    headers.set('content-type', 'application/json');
    headers.set('idempotency-key', key);
    headers.set('x-csrf-token', CSRF);
    if (testCase.ifMatch) headers.set('if-match', '"1"');
  }
  return new Request(`${ORIGIN}${testCase.path}`, {
    method: testCase.method,
    headers,
    ...(testCase.body === undefined
      ? {}
      : { body: JSON.stringify(testCase.body) }),
  });
};
const make = (
  testCase: RecoveryCase,
  mode: 'success' | 'commit_failure' | 'lost_response' = 'success',
) => {
  const state = { canonical: false, audit: 0, outbox: 0 };
  let durableCommit = false;
  const commit = vi.fn(async (): Promise<IdentityCommitResult> => {
    if (mode === 'commit_failure') throw new Error('atomic transaction failed');
    state.canonical = true;
    state.audit += 1;
    state.outbox += 1;
    durableCommit = true;
    if (mode === 'lost_response')
      throw new DOMException('deadline', 'AbortError');
    return committed(testCase);
  });
  const read = vi.fn(async () => committed(testCase));
  const reconcile = vi.fn(async () =>
    durableCommit ? committed(testCase) : null,
  );
  const telemetry = vi.fn(async (event: Record<string, unknown>) => {
    expect(event).toEqual(
      expect.objectContaining({
        operationId: testCase.operationId,
        requestId: REQUEST_ID,
      }),
    );
    expect(JSON.stringify(event)).not.toContain('slice02-session-ref');
  });
  const identityAuthority: RecoveryDependencies = {
    commit,
    read,
    reconcile,
    telemetry,
  };
  const { auth } = createApp();
  const dependencies = {
    auth,
    captureException: vi.fn(),
    createLogger: () =>
      createLogger({
        environment: 'staging',
        release: 'phase-02-slice-04-recovery',
        service: 'wejammin-api',
      }),
    identityAuthority,
    now: () => Date.parse('2026-09-01T05:00:00Z'),
  } as WorkerDependencies & { identityAuthority: RecoveryDependencies };
  return {
    app: createWorkerApp(dependencies),
    state,
    commit,
    read,
    reconcile,
    telemetry,
  };
};
const payload = async (response: Response) =>
  (await response.json()) as Record<string, unknown>;
describe('Phase 2 Slice 04 endpoint recovery and atomic effects', () => {
  it.each(cases)(
    '$criterion commits or reads with redacted telemetry: $operationId',
    async (testCase) => {
      const harness = make(testCase);
      const response = await harness.app.request(requestFor(testCase));

      expect(response.status).toBe(testCase.status);
      expect(harness.telemetry).toHaveBeenCalledWith(
        expect.objectContaining({ operationId: testCase.operationId }),
      );
      if (testCase.mutation) {
        expect(harness.commit).toHaveBeenCalledOnce();
        expect(harness.state).toEqual({ canonical: true, audit: 1, outbox: 1 });
      } else {
        expect(harness.read).toHaveBeenCalledOnce();
      }
    },
  );

  it.each(cases.filter(({ mutation }) => mutation))(
    '$criterion rolls back on atomic commit failure: $operationId',
    async (testCase) => {
      const harness = make(testCase, 'commit_failure');
      const response = await harness.app.request(requestFor(testCase));

      expect(response.status).toBe(503);
      await expect(payload(response)).resolves.toMatchObject({
        code: 'DEPENDENCY_UNAVAILABLE',
        requestId: REQUEST_ID,
      });
      expect(harness.state).toEqual({ canonical: false, audit: 0, outbox: 0 });
    },
  );

  it.each(cases.filter(({ mutation }) => mutation))(
    '$criterion reconciles a lost response without duplicate effects: $operationId',
    async (testCase) => {
      const harness = make(testCase, 'lost_response');
      const key = `slice04-lost-${testCase.operationId}`;
      const first = await harness.app.request(requestFor(testCase, key));
      const replay = await harness.app.request(requestFor(testCase, key));

      expect(first.status).toBe(503);
      expect(replay.status).toBe(testCase.status);
      expect(harness.commit).toHaveBeenCalledOnce();
      expect(harness.reconcile).toHaveBeenCalledOnce();
      expect(harness.state).toEqual({ canonical: true, audit: 1, outbox: 1 });
    },
  );

  it.each(cases.filter(({ mutation }) => mutation))(
    '$criterion returns typed conflict recovery without partial effects: $operationId',
    async (testCase) => {
      const harness = make(testCase);
      harness.commit.mockResolvedValueOnce({
        kind: 'conflict',
        status: 409,
        code: 'VERSION_MISMATCH',
        details: { recoveryAction: 'refetch_and_retry' },
      });
      const response = await harness.app.request(requestFor(testCase));

      expect(response.status).toBe(409);
      await expect(payload(response)).resolves.toMatchObject({
        code: 'VERSION_MISMATCH',
        details: { recoveryAction: 'refetch_and_retry' },
      });
      expect(harness.state).toEqual({ canonical: false, audit: 0, outbox: 0 });
    },
  );
});
