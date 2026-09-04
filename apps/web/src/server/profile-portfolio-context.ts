import {
  ActingContextListResponseSchema,
  PersonIdentityResponseSchema,
  ProfileUuidSchema,
} from '@wejammin/contracts';

import { forwardIdentityAuthorityRequest } from './identity-authority-platform-api.ts';
import {
  forwardProfilePortfolioRequest,
  hasProfilePortfolioSession,
  resolveProfilePortfolioBinding,
} from './profile-portfolio-platform-api.ts';
import {
  parseProfilePortfolioProjection,
  type ProfilePortfolioProjection,
} from './profile-portfolio-projection.ts';
import {
  degradedProfilePortfolioPage,
  emptyProfilePortfolioPage,
  readyProfilePortfolioPage,
} from './profile-portfolio-page-state.ts';

export { hasProfilePortfolioSession } from './profile-portfolio-platform-api.ts';

export type ProfilePortfolioPageState = Readonly<{
  state: 'ready' | 'forbidden' | 'degraded';
  actorId: string | null;
  actingPartyId: string | null;
  capabilitySnapshot: readonly string[];
  access: 'read-only' | 'full' | 'disabled';
  csrfToken: string;
  requestId: string;
  projection: ProfilePortfolioProjection | null;
  projectionVersion: string | null;
  etag: string | null;
  lastVerifiedAt: string | null;
}>;

export type ProfilePortfolioPageResult =
  | Readonly<{ kind: 'unauthenticated' }>
  | Readonly<{ kind: 'not_found' }>
  | Readonly<{ kind: 'ready'; page: ProfilePortfolioPageState }>;

type Surface = 'public' | 'app';

const json = async (response: Response): Promise<unknown | null> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const cookie = (request: Request, name: string): string =>
  request.headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) ?? '';

const makeReadRequest = (
  request: Request,
  path: string,
  preservePublicQuery = false,
): Request => {
  const target = new URL(path, request.url);
  if (preservePublicQuery) {
    const source = new URL(request.url).searchParams;
    const query = new URLSearchParams();
    for (const key of ['locale', 'source']) {
      const value = source.get(key);
      if (value !== null) query.set(key, value);
    }
    target.search = query.toString();
  } else {
    target.search = '';
  }
  return new Request(target, { method: 'GET', headers: request.headers });
};

const readIdentity = (request: Request, binding: unknown) =>
  forwardIdentityAuthorityRequest(
    makeReadRequest(request, '/api/v1/me/identity'),
    binding,
    '/api/v1/me/identity',
    'GET',
  );

const readContexts = (request: Request, binding: unknown) =>
  forwardIdentityAuthorityRequest(
    makeReadRequest(request, '/api/v1/me/acting-contexts'),
    binding,
    '/api/v1/me/acting-contexts',
    'GET',
  );

const readProfile = (
  request: Request,
  binding: unknown,
  partyId: string,
  surface: Surface,
) => {
  const path = `/api/v1/profiles/${encodeURIComponent(partyId)}`;
  return forwardProfilePortfolioRequest(
    makeReadRequest(request, path, surface === 'public'),
    binding,
    path,
    'GET',
    { credentials: surface === 'public' ? 'omit' : 'include' },
  );
};

const parseProjection = async (
  response: Response,
): Promise<ProfilePortfolioProjection | null> =>
  parseProfilePortfolioProjection(await json(response));

const notFoundOrDegraded = async (input: {
  response: Response;
  requestId: string;
  actorId: string | null;
  actingPartyId: string | null;
}): Promise<ProfilePortfolioPageResult> => {
  if (input.response.status === 401) return { kind: 'unauthenticated' };
  if (input.response.status === 403 || input.response.status === 404)
    return { kind: 'not_found' };
  return {
    kind: 'ready',
    page: degradedProfilePortfolioPage({
      requestId: input.requestId,
      actorId: input.actorId,
      actingPartyId: input.actingPartyId,
    }),
  };
};

export const resolveProfilePortfolioPage = async (input: {
  request: Request;
  binding: unknown;
  localApiOrigin?: string;
  partyId: string;
  requestId: string;
  surface: Surface;
}): Promise<ProfilePortfolioPageResult> => {
  if (!ProfileUuidSchema.safeParse(input.partyId).success)
    return { kind: 'not_found' };

  const binding = resolveProfilePortfolioBinding(
    input.binding,
    input.localApiOrigin,
  );

  if (input.surface === 'public') {
    const response = await readProfile(
      input.request,
      binding,
      input.partyId,
      'public',
    );
    if (!response.ok)
      return notFoundOrDegraded({
        ...input,
        response,
        actorId: null,
        actingPartyId: null,
      });
    const projection = await parseProjection(response);
    if (projection === null)
      return {
        kind: 'ready',
        page: degradedProfilePortfolioPage({
          requestId: input.requestId,
          actorId: null,
          actingPartyId: null,
        }),
      };
    return {
      kind: 'ready',
      page: readyProfilePortfolioPage({
        requestId: input.requestId,
        actorId: null,
        actingPartyId: null,
        csrfToken: '',
        access: 'read-only',
        projection,
        response,
      }),
    };
  }

  if (!hasProfilePortfolioSession(input.request))
    return { kind: 'unauthenticated' };

  const identityResponse = await readIdentity(input.request, binding);
  if (identityResponse.status === 401) return { kind: 'unauthenticated' };
  const identity = identityResponse.ok
    ? PersonIdentityResponseSchema.safeParse(await json(identityResponse))
    : null;
  if (!identityResponse.ok || identity === null || !identity.success) {
    return {
      kind: 'ready',
      page:
        identityResponse.status === 403
          ? emptyProfilePortfolioPage({
              requestId: input.requestId,
              actorId: null,
              actingPartyId: null,
              csrfToken: '',
              state: 'forbidden',
            })
          : degradedProfilePortfolioPage({
              requestId: input.requestId,
              actorId: null,
              actingPartyId: null,
            }),
    };
  }

  const contextsResponse = await readContexts(input.request, binding);
  if (contextsResponse.status === 401) return { kind: 'unauthenticated' };
  const contexts = contextsResponse.ok
    ? ActingContextListResponseSchema.safeParse(await json(contextsResponse))
    : null;
  if (!contextsResponse.ok || contexts === null || !contexts.success) {
    return {
      kind: 'ready',
      page:
        contextsResponse.status === 403
          ? emptyProfilePortfolioPage({
              requestId: input.requestId,
              actorId: identity.data.personId,
              actingPartyId: null,
              csrfToken: '',
              state: 'forbidden',
            })
          : degradedProfilePortfolioPage({
              requestId: input.requestId,
              actorId: identity.data.personId,
              actingPartyId: null,
            }),
    };
  }

  const actingPartyId =
    contexts.data.items.find(
      (item) => item.selectable && item.partyId === input.partyId,
    )?.partyId ?? null;
  if (actingPartyId === null) {
    return {
      kind: 'ready',
      page: emptyProfilePortfolioPage({
        requestId: input.requestId,
        actorId: identity.data.personId,
        actingPartyId: null,
        csrfToken: '',
        state: 'forbidden',
      }),
    };
  }

  const response = await readProfile(
    input.request,
    binding,
    input.partyId,
    'app',
  );
  if (!response.ok)
    return notFoundOrDegraded({
      ...input,
      response,
      actorId: identity.data.personId,
      actingPartyId,
    });
  const projection = await parseProjection(response);
  if (projection === null)
    return {
      kind: 'ready',
      page: degradedProfilePortfolioPage({
        requestId: input.requestId,
        actorId: identity.data.personId,
        actingPartyId,
      }),
    };
  return {
    kind: 'ready',
    page: readyProfilePortfolioPage({
      requestId: input.requestId,
      actorId: identity.data.personId,
      actingPartyId,
      csrfToken: cookie(input.request, 'wj_csrf'),
      access: 'full',
      projection,
      response,
    }),
  };
};
