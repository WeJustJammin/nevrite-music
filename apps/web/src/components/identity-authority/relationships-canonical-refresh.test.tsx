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
import { renderToStaticMarkup } from 'react-dom/server';

import {
  ACTING_CONTEXT_CHANGED_EVENT,
  CLIENT_BINDING_ID_HEADER,
} from '../../lib/client-binding';
import RelationshipsAuthorityGovernanceIsland from './RelationshipsAuthorityGovernanceIsland';
import {
  act,
  cleanupMounted,
  flushAsyncWork,
  installBrowserState,
  mountNode,
  restoreReactActEnvironment,
} from './acting-context-test-support';

const PERSON_ID = '11111111-1111-4111-8111-111111111112';
const ORGANIZATION_A = '22222222-2222-4222-8222-222222222221';
const ORGANIZATION_B = '33333333-3333-4333-8333-333333333331';
const MEMBERSHIP_ID_A = '44444444-4444-4444-8444-444444444441';
const MEMBERSHIP_ID_B = '55555555-5555-4555-8555-555555555551';
const CONTEXT_PERSON_ID = '11111111-1111-4111-8111-111111111111';
const CONTEXT_ORGANIZATION_A = '22222222-2222-4222-8222-222222222222';
const CONTEXT_ORGANIZATION_B = '33333333-3333-4333-8333-333333333332';

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

const organization = (organizationId: string, version: string) => ({
  organizationId,
  ownershipState: 'owned',
  lifecycle: 'active',
  typeCodes: ['band'],
  version,
  etag: `"${version}"`,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
});

const membership = (tenureId: string, organizationId: string) => ({
  items: [
    {
      tenureId,
      organizationId,
      personId: PERSON_ID,
      state: 'invited',
      provenance: 'invitation',
      startsOn: '2026-09-01',
      endsOn: null,
      acceptedAt: null,
      revokedAt: null,
      version: '2',
      etag: '"2"',
    },
  ],
  nextCursor: null,
  hasMore: false,
});

const actingContexts = () => ({
  projectionVersion: '1',
  items: [
    {
      contextId: CONTEXT_PERSON_ID,
      partyId: PERSON_ID,
      kind: 'person',
      label: 'My profile',
      avatarRef: null,
      selectable: true,
      authorityFreshUntil: '2026-09-13T00:00:00.000Z',
    },
    {
      contextId: CONTEXT_ORGANIZATION_A,
      partyId: ORGANIZATION_A,
      kind: 'organization',
      label: 'Organization A',
      avatarRef: null,
      selectable: true,
      authorityFreshUntil: '2026-09-13T00:00:00.000Z',
    },
    {
      contextId: CONTEXT_ORGANIZATION_B,
      partyId: ORGANIZATION_B,
      kind: 'organization',
      label: 'Organization B',
      avatarRef: null,
      selectable: true,
      authorityFreshUntil: '2026-09-13T00:00:00.000Z',
    },
  ],
  nextCursor: null,
  hasMore: false,
});

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
        id: ORGANIZATION_A,
        version: '7',
        state: 'active',
        provenance: [],
        projection: organization(ORGANIZATION_A, '7'),
      },
    ],
    version: '7',
    stale: false,
  },
  actorId: PERSON_ID,
  actingPartyId: ORGANIZATION_A,
  access: 'full',
  query: { tab: 'relationships' },
  selectedId: ORGANIZATION_A,
  expectedVersion: '"7"',
  organizationId: ORGANIZATION_A,
} as const;

const session = (actingPartyId: string) => ({
  authenticated: true,
  accountState: 'active',
  bootstrapState: 'complete',
  personId: PERSON_ID,
  actingPartyId,
  sessionExpiresAt: '2026-09-13T00:00:00.000Z',
});

const mutationSubmitButtons = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLButtonElement>(
      '.relationship-command button[type="submit"]',
    ),
  );

describe('relationship canonical context refresh', () => {
  it('verifies tab context before refreshing the active organization and memberships on mount and context change', async () => {
    let activeOrganizationId = ORGANIZATION_A;
    const requestedPaths: string[] = [];
    const bindingIds: Array<string | null> = [];
    let releaseOrganizationBRead: ((response: Response) => void) | undefined;
    let markOrganizationBReadStarted: () => void = () => undefined;
    const organizationBReadStarted = new Promise<void>((resolve) => {
      markOrganizationBReadStarted = resolve;
    });
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = new URL(String(input), window.location.origin).pathname;
        requestedPaths.push(path);
        bindingIds.push(
          new Headers(init?.headers).get(CLIENT_BINDING_ID_HEADER),
        );

        if (path === '/api/v1/auth/session')
          return Response.json(session(activeOrganizationId));
        if (path === '/api/v1/me/acting-contexts')
          return Response.json(actingContexts());
        if (path === `/api/v1/me/organizations/${ORGANIZATION_B}`) {
          markOrganizationBReadStarted();
          return new Promise<Response>((resolve) => {
            releaseOrganizationBRead = resolve;
          });
        }
        if (path === `/api/v1/me/organizations/${activeOrganizationId}`)
          return Response.json(organization(activeOrganizationId, '8'));
        if (
          path === `/api/v1/organizations/${activeOrganizationId}/memberships`
        )
          return Response.json(
            membership(
              activeOrganizationId === ORGANIZATION_A
                ? MEMBERSHIP_ID_A
                : MEMBERSHIP_ID_B,
              activeOrganizationId,
            ),
          );
        return new Response(null, { status: 404 });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const serverMarkup = renderToStaticMarkup(
      <RelationshipsAuthorityGovernanceIsland {...props} />,
    );
    const serverContainer = document.createElement('div');
    serverContainer.innerHTML = serverMarkup;
    expect(serverMarkup).toContain(`data-organization-id="${ORGANIZATION_A}"`);
    expect(serverMarkup).toContain('Canonical relationship records loaded.');
    expect(serverMarkup).toContain(
      'Relationship data is server-rendered and not verified for this tab; commands remain read-only until verification succeeds.',
    );
    const serverMutationButtons = mutationSubmitButtons(serverContainer);
    expect(serverMutationButtons.length).toBeGreaterThan(0);
    expect(serverMutationButtons.every((button) => button.disabled)).toBe(true);
    expect(
      serverContainer.querySelector(
        '.relationship-command[data-operation="ORG-02"] button:not([disabled])',
      ),
    ).not.toBeNull();

    const { container } = mountNode(
      <RelationshipsAuthorityGovernanceIsland {...props} />,
    );
    expect(
      container
        .querySelector('[data-organization-id]')
        ?.getAttribute('data-organization-id'),
    ).toBe(ORGANIZATION_A);
    expect(
      mutationSubmitButtons(container).every((button) => button.disabled),
    ).toBe(true);
    await flushAsyncWork();

    expect(requestedPaths).toEqual([
      '/api/v1/auth/session',
      '/api/v1/me/acting-contexts',
      `/api/v1/me/organizations/${ORGANIZATION_A}`,
      `/api/v1/organizations/${ORGANIZATION_A}/memberships`,
    ]);
    expect(new Set(bindingIds).size).toBe(1);
    expect(bindingIds[0]).toMatch(/^[A-Za-z0-9._:-]{1,128}$/u);
    expect(
      fetchMock.mock.calls.every(
        ([, init]) =>
          new Headers(init?.headers).get('authorization') === null &&
          init?.credentials === 'same-origin' &&
          init?.cache === 'no-store',
      ),
    ).toBe(true);
    expect(
      container
        .querySelector('[data-organization-id]')
        ?.getAttribute('data-organization-id'),
    ).toBe(ORGANIZATION_A);
    expect(
      mutationSubmitButtons(container).some((button) => !button.disabled),
    ).toBe(true);

    activeOrganizationId = ORGANIZATION_B;
    await act(async () => {
      window.dispatchEvent(new CustomEvent(ACTING_CONTEXT_CHANGED_EVENT));
      await organizationBReadStarted;
    });

    const organizationDuringContextRefresh = container
      .querySelector('[data-organization-id]')
      ?.getAttribute('data-organization-id');
    const commandsEnabledDuringContextRefresh = mutationSubmitButtons(
      container,
    ).some((button) => !button.disabled);
    expect(releaseOrganizationBRead).toBeTypeOf('function');
    releaseOrganizationBRead?.(
      Response.json(organization(ORGANIZATION_B, '8')),
    );
    await flushAsyncWork();

    expect(requestedPaths.slice(4)).toEqual([
      '/api/v1/auth/session',
      '/api/v1/me/acting-contexts',
      `/api/v1/me/organizations/${ORGANIZATION_B}`,
      `/api/v1/organizations/${ORGANIZATION_B}/memberships`,
    ]);
    expect(organizationDuringContextRefresh).toBe(ORGANIZATION_A);
    expect(commandsEnabledDuringContextRefresh).toBe(false);
    expect(
      container
        .querySelector('[data-organization-id]')
        ?.getAttribute('data-organization-id'),
    ).toBe(ORGANIZATION_B);
    expect(container.textContent).toContain('invited');
  });
});
