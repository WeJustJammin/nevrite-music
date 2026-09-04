import { createLogger } from '@wejammin/observability/logging';
import type {
  ActingContextBindingResponse,
  ActingContextListResource,
  AliasResponse,
  FacetMutationResponse,
  PersonIdentityResponse,
  PublicPartyProjectionResponse,
  TransferOfferResponse,
} from '@wejammin/contracts';
import { vi } from 'vitest';

import { createWorkerApp, type WorkerDependencies } from '../index';
import type {
  AddFacetInput,
  BindActingContextInput,
  ChangeHandleInput,
  CreateAliasInput,
  CreateTransferOfferInput,
  IdentityAuthorityDependencies,
  PatchAliasInput,
  ReadPublicProjectionInput,
  RemoveFacetInput,
  RetireAliasInput,
  TransferDecisionInput,
} from '../identity-authority/types';
import type { AuthenticationDependencies, AuthenticationResult } from './types';
import {
  authorization,
  CSRF,
  IDENTITY_ID,
  job,
  loginMethods,
  MERGE_ID,
  mergeCase,
  ORIGIN,
  PERSON_ID,
  providerCatalog,
  REQUEST_ID,
  session,
} from './phase-02-slice-02.test-fixtures';

export const success = <T>(value: T): AuthenticationResult<T> => ({
  ok: true,
  value,
});

export const failure = (
  status: 400 | 401 | 403 | 404 | 409 | 503,
  code: string,
  message: string,
): AuthenticationResult<never> => ({ ok: false, status, code, message });

const createBaseAuth = (
  overrides: Partial<AuthenticationDependencies> = {},
): AuthenticationDependencies => ({
  loadProviderCatalog: vi.fn(async () => success(providerCatalog)),
  startEmail: vi.fn(async () =>
    success({ resource: { accepted: true as const }, cookies: [] }),
  ),
  startOAuth: vi.fn(async () =>
    success({ resource: authorization, cookies: [] }),
  ),
  completeCallback: vi.fn(async () =>
    success({ location: '/app', cookies: [] }),
  ),
  resolveSession: vi.fn(async () => success(session)),
  readSession: vi.fn(async () =>
    success({
      authenticated: true as const,
      accountState: 'active' as const,
      bootstrapState: 'complete' as const,
      personId: session.personId,
      actingPartyId: session.actingPartyId,
      sessionExpiresAt: session.expiresAt,
    }),
  ),
  refreshSession: vi.fn(async () =>
    success({
      resource: {
        authenticated: true as const,
        accountState: 'active' as const,
        bootstrapState: 'complete' as const,
        personId: session.personId,
        actingPartyId: session.actingPartyId,
        sessionExpiresAt: session.expiresAt,
      },
      cookies: [],
    }),
  ),
  bootstrap: vi.fn(async () =>
    success({
      created: false,
      resource: {
        personId: session.personId,
        actingPartyId: session.actingPartyId,
        contextKind: 'self' as const,
        accountState: 'active' as const,
        bindingVersion: '1',
      },
    }),
  ),
  logout: vi.fn(async () => success({ cookies: [] })),
  rateLimit: vi.fn(async (input) =>
    success({
      allowed: true,
      limit: input.limit,
      remaining: Math.max(0, input.limit - 1),
      resetAt: 1_788_236_460,
    }),
  ),
  ...overrides,
});

export const createSliceDependencies = () => ({
  readLoginMethods: vi.fn(async () => success(loginMethods)),
  startLoginMethodLink: vi.fn(async () =>
    success({ resource: authorization, cookies: [] as readonly string[] }),
  ),
  unlinkLoginMethod: vi.fn(async () => success(loginMethods)),
  createAccountMerge: vi.fn(async () => success(mergeCase)),
  readAccountMerge: vi.fn(async () => success(mergeCase)),
  startAccountMergeProof: vi.fn(async () =>
    success({ resource: authorization, cookies: [] as readonly string[] }),
  ),
  confirmAccountMerge: vi.fn(async () => success(job)),
});

const IDENTITY_ALIAS_ID = '66666666-6666-4666-8666-666666666666';
const IDENTITY_OFFER_ID = '77777777-7777-4777-8777-777777777777';
const IDENTITY_RECIPIENT_ID = '88888888-8888-4888-8888-888888888888';
const IDENTITY_CONTEXT_ID = '99999999-9999-4999-8999-999999999999';
const IDENTITY_BINDING_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MISSING_ID = '00000000-0000-4000-8000-000000000000';

const identityPerson: PersonIdentityResponse = {
  personId: PERSON_ID,
  partyKind: 'person',
  accountState: 'active',
  version: '1',
  facets: [],
  aliases: [],
};

const identityFacet: FacetMutationResponse = {
  personId: PERSON_ID,
  facetCode: 'performer',
  state: 'active',
  version: '2',
};

const identityAlias: AliasResponse = {
  aliasId: IDENTITY_ALIAS_ID,
  displayName: 'Neon Harbor',
  handle: 'neon.harbor',
  lifecycle: 'active',
  publicLinkState: 'public',
  version: '1',
};

const identityOffer: TransferOfferResponse = {
  offerId: IDENTITY_OFFER_ID,
  aliasId: IDENTITY_ALIAS_ID,
  state: 'pending',
  offeredAt: '2026-09-01T05:00:00Z',
  expiresAt: '2026-09-08T05:00:00Z',
  version: '1',
  offeringPersonId: PERSON_ID,
  recipientPersonId: IDENTITY_RECIPIENT_ID,
};

const identityContexts: ActingContextListResource = {
  projectionVersion: '1',
  items: [
    {
      contextId: IDENTITY_CONTEXT_ID,
      partyId: PERSON_ID,
      kind: 'person',
      label: 'Rob Example',
      avatarRef: null,
      selectable: true,
      authorityFreshUntil: '2026-09-01T06:00:00Z',
    },
  ],
  nextCursor: null,
  hasMore: false,
};

const identityBinding: ActingContextBindingResponse = {
  bindingId: IDENTITY_BINDING_ID,
  selectedPartyId: PERSON_ID,
  expiresAt: '2026-09-01T06:00:00Z',
  projectionVersion: '1',
  version: '1',
};

const publicProjection: PublicPartyProjectionResponse = {
  partyId: IDENTITY_RECIPIENT_ID,
  kind: 'person',
  displayName: 'Rob Example',
  handle: 'rob-example',
  profileRef: null,
  publicLinkState: 'public',
  lifecycle: 'active',
  version: '1',
  facetLabels: ['performer'],
};

const denyForeignActor = <T>(input: {
  session: { actingPartyId: string | null; personId: string | null };
}): AuthenticationResult<T> | null =>
  input.session.actingPartyId === input.session.personId
    ? null
    : (failure(
        403,
        'FORBIDDEN',
        'The acting context is not authorized.',
      ) as AuthenticationResult<T>);

export const createIdentityDependencies = (): IdentityAuthorityDependencies => {
  const identity = {
    createPerson: vi.fn(async () => success(identityPerson)),
    readPerson: vi.fn(async () => success(identityPerson)),
    addFacet: vi.fn(
      async (input: AddFacetInput) =>
        denyForeignActor<FacetMutationResponse>(input) ??
        success(identityFacet),
    ),
    removeFacet: vi.fn(
      async (input: RemoveFacetInput) =>
        denyForeignActor<FacetMutationResponse>(input) ??
        success(identityFacet),
    ),
    createAlias: vi.fn(
      async (input: CreateAliasInput) =>
        denyForeignActor<AliasResponse>(input) ?? success(identityAlias),
    ),
    patchAlias: vi.fn(async (input: PatchAliasInput) => {
      if (input.aliasId === MISSING_ID)
        return failure(404, 'ALIAS_NOT_FOUND', 'The alias was not found.');
      return denyForeignActor<AliasResponse>(input) ?? success(identityAlias);
    }),
    changeHandle: vi.fn(
      async (input: ChangeHandleInput) =>
        denyForeignActor<AliasResponse>(input) ?? success(identityAlias),
    ),
    retireAlias: vi.fn(
      async (input: RetireAliasInput) =>
        denyForeignActor<AliasResponse>(input) ?? success(identityAlias),
    ),
    createTransferOffer: vi.fn(
      async (input: CreateTransferOfferInput) =>
        denyForeignActor<TransferOfferResponse>(input) ??
        success(identityOffer),
    ),
    acceptTransferOffer: vi.fn(
      async (input: TransferDecisionInput) =>
        denyForeignActor<AliasResponse>(input) ?? success(identityAlias),
    ),
    declineTransferOffer: vi.fn(
      async (input: TransferDecisionInput) =>
        denyForeignActor<TransferOfferResponse>(input) ??
        success(identityOffer),
    ),
    readActingContexts: vi.fn(async () => success(identityContexts)),
    bindActingContext: vi.fn(async (input: BindActingContextInput) => {
      if (input.contextId === MISSING_ID)
        return failure(
          404,
          'CONTEXT_NOT_FOUND',
          'The acting context was not found.',
        );
      return (
        denyForeignActor<ActingContextBindingResponse>(input) ??
        success(identityBinding)
      );
    }),
    readPublicProjection: vi.fn(async (input: ReadPublicProjectionInput) =>
      input.partyId === MISSING_ID
        ? failure(404, 'NOT_FOUND', 'The requested resource was not found.')
        : success(publicProjection),
    ),
  };
  return identity as unknown as IdentityAuthorityDependencies;
};

export const createApp = (
  authOverrides: Partial<AuthenticationDependencies> = {},
) => {
  const slice = createSliceDependencies();
  const auth = Object.assign(createBaseAuth(authOverrides), slice);
  const identity = createIdentityDependencies();
  const dependencies: WorkerDependencies & {
    auth: AuthenticationDependencies;
    identityAuthority: IdentityAuthorityDependencies;
  } = {
    auth,
    identityAuthority: identity,
    captureException: vi.fn(),
    createLogger: () =>
      createLogger({
        environment: 'staging',
        release: 'phase-02-slice-02-test',
        service: 'wejammin-api',
      }),
    now: () => Date.now(),
  };
  return { app: createWorkerApp(dependencies), auth, identity, slice };
};

export type SliceOperation = Readonly<{
  id: `AUTH-API-${string}`;
  path: string;
  method: 'DELETE' | 'GET' | 'POST';
  body?: Readonly<Record<string, unknown>>;
  dependency: keyof ReturnType<typeof createSliceDependencies>;
  successStatus: 200 | 201 | 202;
  mutation: boolean;
}>;

export const operations: readonly SliceOperation[] = [
  {
    id: 'AUTH-API-09',
    path: '/api/v1/account/login-methods',
    method: 'GET',
    dependency: 'readLoginMethods',
    successStatus: 200,
    mutation: false,
  },
  {
    id: 'AUTH-API-10',
    path: '/api/v1/account/login-methods/google/link-intents',
    method: 'POST',
    body: { returnTo: '/settings/security' },
    dependency: 'startLoginMethodLink',
    successStatus: 201,
    mutation: true,
  },
  {
    id: 'AUTH-API-11',
    path: `/api/v1/account/login-methods/${IDENTITY_ID}`,
    method: 'DELETE',
    body: { reason: 'provider_compromise' },
    dependency: 'unlinkLoginMethod',
    successStatus: 200,
    mutation: true,
  },
  {
    id: 'AUTH-API-12',
    path: '/api/v1/account-merges',
    method: 'POST',
    body: { returnTo: '/settings/security' },
    dependency: 'createAccountMerge',
    successStatus: 201,
    mutation: true,
  },
  {
    id: 'AUTH-API-13',
    path: `/api/v1/account-merges/${MERGE_ID}`,
    method: 'GET',
    dependency: 'readAccountMerge',
    successStatus: 200,
    mutation: false,
  },
  {
    id: 'AUTH-API-14',
    path: `/api/v1/account-merges/${MERGE_ID}/prove-duplicate`,
    method: 'POST',
    body: { provider: 'google', returnTo: '/settings/security' },
    dependency: 'startAccountMergeProof',
    successStatus: 201,
    mutation: true,
  },
  {
    id: 'AUTH-API-15',
    path: `/api/v1/account-merges/${MERGE_ID}/confirm`,
    method: 'POST',
    body: {
      conflictPlanVersion: '4',
      acknowledgements: ['profiles.safe_repoint', 'aliases.reviewed'],
    },
    dependency: 'confirmAccountMerge',
    successStatus: 202,
    mutation: true,
  },
];

export const requestFor = (
  operation: SliceOperation,
  options: Readonly<{
    invalid?: boolean;
    omitVersion?: boolean;
    omitCsrf?: boolean;
  }> = {},
): Request => {
  const path = options.invalid
    ? operation.method === 'GET'
      ? `${operation.path}?unknown=1`
      : operation.path
    : operation.path;
  const headers = new Headers({
    accept: 'application/json',
    origin: ORIGIN,
    cookie: `wj_session_ref=slice02-session-ref; wj_csrf=${CSRF}`,
    'x-csrf-token': CSRF,
    'x-request-id': REQUEST_ID,
  });
  if (operation.mutation) {
    headers.set('content-type', 'application/json');
    headers.set('idempotency-key', `slice02-${operation.id}`);
    if (!options.omitVersion) headers.set('if-match', '"7"');
    if (options.omitCsrf) headers.delete('x-csrf-token');
  }
  return new Request(`${ORIGIN}${path}`, {
    method: operation.method,
    headers,
    ...(operation.method === 'GET'
      ? {}
      : {
          body: JSON.stringify(
            options.invalid ? { unknown: true } : operation.body,
          ),
        }),
  });
};
