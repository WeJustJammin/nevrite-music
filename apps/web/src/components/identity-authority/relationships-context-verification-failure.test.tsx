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
  variant: 'ownerFull',
  initial: {
    status: 'success',
    data: [
      {
        id: ORGANIZATION_ID,
        version: '7',
        state: 'active',
        provenance: [],
        projection: {
          organizationId: ORGANIZATION_ID,
          ownershipState: 'owned',
          lifecycle: 'active',
          typeCodes: ['band'],
          version: '7',
          etag: '"7"',
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-02T00:00:00.000Z',
        },
      },
    ],
    version: '7',
    stale: false,
  },
  actorId: '11111111-1111-4111-8111-111111111112',
  actingPartyId: ORGANIZATION_ID,
  access: 'full',
  query: { tab: 'relationships' },
  selectedId: ORGANIZATION_ID,
  expectedVersion: '"7"',
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

describe('relationship context verification failure', () => {
  it('keeps server-rendered read content but disables mutation controls when tab binding cannot be verified', async () => {
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: undefined,
    });
    const fetchMock = vi.fn(async () => Response.json({}));
    vi.stubGlobal('fetch', fetchMock);

    const { container } = mountNode(
      <RelationshipsAuthorityGovernanceIsland {...props} />,
    );
    await flushAsyncWork();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      container
        .querySelector('[data-organization-id]')
        ?.getAttribute('data-organization-id'),
    ).toBe(ORGANIZATION_ID);
    expect(container.textContent).toContain(
      'The active tab context could not be verified; the last displayed relationship data remains read-only.',
    );
    expect(
      container.querySelector('.relationship-command-grid'),
    ).not.toBeNull();
    expect(
      Array.from(
        container.querySelectorAll<HTMLButtonElement>(
          '.relationship-command button[type="submit"]',
        ),
      ).every((button) => button.disabled),
    ).toBe(true);
  });
});
