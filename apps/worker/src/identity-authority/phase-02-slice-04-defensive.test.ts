import { describe, expect, it, vi } from 'vitest';

import {
  CSRF,
  ORIGIN,
  REQUEST_ID,
  bindings,
} from '../authentication/phase-02-slice-02.test-fixtures';
import {
  createApp,
  failure,
  success,
} from '../authentication/phase-02-slice-02.test-support';

const ORGANIZATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ASSIGNMENT_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TENURE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const TERMS_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const PERSON_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const INVITE_EXPIRES_AT = new Date(
  Date.now() + 24 * 60 * 60 * 1_000,
).toISOString();
const WRONG_CSRF = `${CSRF.slice(0, -1)}${CSRF.endsWith('0') ? '1' : '0'}`;

type RouteCase = Readonly<{
  operationId: string;
  port: string;
  path: string;
  method: 'DELETE' | 'GET' | 'POST';
  body?: Readonly<Record<string, unknown>>;
  mutation: boolean;
  ifMatch?: boolean;
}>;

const cases: readonly RouteCase[] = [
  {
    operationId: 'ORG-01',
    port: 'createOrganization',
    path: '/api/v1/organizations',
    method: 'POST',
    body: { mode: 'self_member', typeCodes: ['band'] },
    mutation: true,
  },
  {
    operationId: 'ORG-02',
    port: 'readOrganization',
    path: `/api/v1/organizations/${ORGANIZATION_ID}`,
    method: 'GET',
    mutation: false,
  },
  {
    operationId: 'TYPE-01',
    port: 'addOrganizationType',
    path: `/api/v1/organizations/${ORGANIZATION_ID}/type-assignments`,
    method: 'POST',
    body: { typeCode: 'label' },
    mutation: true,
    ifMatch: true,
  },
  {
    operationId: 'TYPE-02',
    port: 'removeOrganizationType',
    path: `/api/v1/organizations/${ORGANIZATION_ID}/type-assignments/${ASSIGNMENT_ID}`,
    method: 'DELETE',
    body: {},
    mutation: true,
    ifMatch: true,
  },
  {
    operationId: 'MEM-01',
    port: 'inviteMembership',
    path: `/api/v1/organizations/${ORGANIZATION_ID}/membership-invitations`,
    method: 'POST',
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
  },
  {
    operationId: 'MEM-02',
    port: 'assertMembership',
    path: `/api/v1/organizations/${ORGANIZATION_ID}/membership-assertions`,
    method: 'POST',
    body: {
      personId: PERSON_ID,
      startsOn: '2024-01-01',
      provenance: 'historical_assertion',
      evidenceRef: TERMS_ID,
    },
    mutation: true,
    ifMatch: true,
  },
  {
    operationId: 'MEM-03',
    port: 'acceptMembership',
    path: `/api/v1/membership-tenures/${TENURE_ID}/accept`,
    method: 'POST',
    body: {
      termsVersionId: TERMS_ID,
      termsHash: 'a'.repeat(64),
      decision: 'accept',
    },
    mutation: true,
    ifMatch: true,
  },
  {
    operationId: 'MEM-04',
    port: 'endMembership',
    path: `/api/v1/membership-tenures/${TENURE_ID}/end`,
    method: 'POST',
    body: { mode: 'now', reasonCode: 'AUTHORITY_WITHDRAWN' },
    mutation: true,
    ifMatch: true,
  },
  {
    operationId: 'MEM-05',
    port: 'addCapacityPeriod',
    path: `/api/v1/membership-tenures/${TENURE_ID}/capacity-periods`,
    method: 'POST',
    body: { capacity: 'touring', startsOn: '2026-09-01', endsOn: '2026-10-01' },
    mutation: true,
    ifMatch: true,
  },
  {
    operationId: 'MEM-06',
    port: 'readMemberships',
    path: `/api/v1/organizations/${ORGANIZATION_ID}/memberships`,
    method: 'GET',
    mutation: false,
  },
];

const requestFor = (
  testCase: RouteCase,
  options: Readonly<{ csrf?: string; query?: string }> = {},
): Request => {
  const headers = new Headers({
    accept: 'application/json',
    origin: ORIGIN,
    cookie: `wj_session_ref=slice02-session-ref; wj_csrf=${CSRF}`,
    'x-csrf-token': options.csrf ?? CSRF,
    'x-request-id': REQUEST_ID,
  });
  if (testCase.mutation) {
    headers.set('content-type', 'application/json');
    headers.set('idempotency-key', `slice04-${testCase.operationId}`);
  }
  if (testCase.ifMatch) headers.set('if-match', '"1"');
  return new Request(`${ORIGIN}${testCase.path}${options.query ?? ''}`, {
    method: testCase.method,
    headers,
    ...(testCase.body === undefined
      ? {}
      : { body: JSON.stringify(testCase.body) }),
  });
};

const expectError = async (
  response: Response,
  status: number,
  code: string,
): Promise<void> => {
  expect(response.status).toBe(status);
  await expect(response.json()).resolves.toMatchObject({
    code,
    requestId: REQUEST_ID,
  });
};

describe('Phase 2 Slice 04 relationship defensive boundaries', () => {
  it.each(cases.filter(({ mutation }) => mutation))(
    '[P2-S04-AC-005,017,023,029,035,041,047,053] rejects invalid CSRF before session or persistence: $operationId',
    async (testCase) => {
      const { app, auth } = createApp();
      const response = await app.fetch(
        requestFor(testCase, { csrf: WRONG_CSRF }),
        bindings,
      );

      await expectError(response, 403, 'FORBIDDEN');
      expect(auth.resolveSession).not.toHaveBeenCalled();
    },
  );

  it.each(cases)(
    '[P2-S04-AC-006,012,018,024,030,036,042,048,054,060] enforces route rate policy: $operationId',
    async (testCase) => {
      const { app } = createApp({
        rateLimit: vi.fn(async () =>
          success({
            allowed: false,
            limit: 1,
            remaining: 0,
            resetAt: 1_788_236_460,
          }),
        ),
      });
      await expectError(
        await app.fetch(requestFor(testCase), bindings),
        429,
        'RATE_LIMITED',
      );
    },
  );

  it.each(cases)(
    '[P2-S04-AC-007,013,019,025,031,037,043,049,055,061] fails closed when the operation port is absent: $operationId',
    async (testCase) => {
      const { app, identity } = createApp();
      delete (identity as unknown as Record<string, unknown>)[testCase.port];

      await expectError(
        await app.fetch(requestFor(testCase), bindings),
        503,
        'DEPENDENCY_UNAVAILABLE',
      );
    },
  );

  it('[P2-S04-AC-007,013] converts rate dependency rejection to a safe 503', async () => {
    const { app } = createApp({
      rateLimit: vi.fn(async () =>
        Promise.reject(new Error('private topology')),
      ),
    });
    await expectError(
      await app.fetch(requestFor(cases[0]!), bindings),
      503,
      'DEPENDENCY_UNAVAILABLE',
    );
  });

  it('[P2-S04-AC-011] authenticates an ORG-02 request that presents credentials', async () => {
    const { app, auth } = createApp({
      resolveSession: vi.fn(async () =>
        failure(401, 'UNAUTHENTICATED', 'Sign in is required.'),
      ),
    });
    await expectError(
      await app.fetch(requestFor(cases[1]!), bindings),
      401,
      'UNAUTHENTICATED',
    );
    expect(auth.resolveSession).toHaveBeenCalledOnce();
  });

  it.each([
    [cases[1]!, '/api/v1/organizations/not-a-uuid'],
    [cases[2]!, '/api/v1/organizations/not-a-uuid/type-assignments'],
    [
      cases[3]!,
      `/api/v1/organizations/${ORGANIZATION_ID}/type-assignments/not-a-uuid`,
    ],
    [cases[4]!, '/api/v1/organizations/not-a-uuid/membership-invitations'],
    [cases[5]!, '/api/v1/organizations/not-a-uuid/membership-assertions'],
    [cases[6]!, '/api/v1/membership-tenures/not-a-uuid/accept'],
    [cases[7]!, '/api/v1/membership-tenures/not-a-uuid/end'],
    [cases[8]!, '/api/v1/membership-tenures/not-a-uuid/capacity-periods'],
    [cases[9]!, '/api/v1/organizations/not-a-uuid/memberships'],
  ] as const)(
    '[P2-S04-AC-070,076,082,088,094,100,106,112,118] rejects a malformed relationship path',
    async (source, path) => {
      const request = requestFor({ ...source, path });
      await expectError(
        await createApp().app.fetch(request, bindings),
        400,
        'INVALID_REQUEST',
      );
    },
  );

  it('[P2-S04-AC-124,125] rejects duplicate or invalid membership collection filters', async () => {
    const readCase = cases.at(-1)!;
    for (const query of [
      '?limit=1&limit=2',
      '?limit=0',
      '?limit=not-a-number',
    ]) {
      await expectError(
        await createApp().app.fetch(requestFor(readCase, { query }), bindings),
        400,
        'INVALID_REQUEST',
      );
    }
  });
});
