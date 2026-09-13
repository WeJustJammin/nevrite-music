// @vitest-environment jsdom

import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { CLIENT_BINDING_ID_HEADER } from '../../lib/client-binding';
import RelationshipsAuthorityGovernanceIsland from './RelationshipsAuthorityGovernanceIsland';
import {
  cleanupMounted,
  flushAsyncWork,
  installBrowserState,
  mountNode,
  restoreReactActEnvironment,
} from './acting-context-test-support';

const ORGANIZATION_ID = '22222222-2222-4222-8222-222222222221';

const props = {
  contractFields: {
    source: '01c-relationships-authority-governance.md',
    fields: {},
  },
  variant: 'publicRead',
  initial: {
    status: 'success',
    data: [
      {
        id: ORGANIZATION_ID,
        version: '7',
        state: 'Active',
        provenance: [],
        projection: {
          organizationId: ORGANIZATION_ID,
          typeDisplay: ['Band'],
          lifecycleLabel: 'Active',
          version: '7',
        },
      },
    ],
    version: '7',
    stale: false,
  },
  actorId: '11111111-1111-4111-8111-111111111112',
  actingPartyId: ORGANIZATION_ID,
  access: 'read-only',
  query: { tab: 'relationships' },
  selectedId: ORGANIZATION_ID,
  expectedVersion: null,
  organizationId: ORGANIZATION_ID,
} as const;

let locks: ReturnType<typeof installBrowserState>['locks'];

beforeEach(() => {
  locks = installBrowserState().locks;
});

afterEach(() => {
  cleanupMounted(locks);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

afterAll(restoreReactActEnvironment);

describe('public relationship canonical refresh', () => {
  it('refreshes public organization projections anonymously without a tab binding', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(new URL(String(input), window.location.origin).pathname).toBe(
          `/api/v1/organizations/${ORGANIZATION_ID}`,
        );
        expect(init?.credentials).toBe('omit');
        expect(init?.cache).toBe('no-store');
        expect(
          new Headers(init?.headers).get(CLIENT_BINDING_ID_HEADER),
        ).toBeNull();
        expect(new Headers(init?.headers).get('authorization')).toBeNull();
        return Response.json({
          organizationId: ORGANIZATION_ID,
          typeDisplay: ['Band'],
          lifecycleLabel: 'Active',
          version: '8',
        });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const { container } = mountNode(
      <RelationshipsAuthorityGovernanceIsland {...props} />,
    );
    await flushAsyncWork();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(
      container
        .querySelector('[data-organization-id]')
        ?.getAttribute('data-organization-id'),
    ).toBe(ORGANIZATION_ID);
    expect(container.textContent).toContain(
      'Canonical relationship records loaded.',
    );
  });
});
