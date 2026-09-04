import {
  ActingContextListResponseSchema,
  ClaimResourceSchema,
  PersonIdentityResponseSchema,
  ProfileUuidSchema,
  type ClaimResource,
} from '@wejammin/contracts';

import { forwardIdentityAuthorityRequest } from './identity-authority-platform-api.ts';
import {
  forwardProfileOwnershipRequest,
  hasProfileOwnershipSession,
} from './profile-ownership-platform-api.ts';

export type ProfileOwnershipPageState = Readonly<{
  state: 'ready' | 'forbidden' | 'degraded';
  actorId: string | null;
  actingPartyId: string | null;
  capabilitySnapshot: readonly string[];
  access: 'read-only' | 'disabled';
  claim: ClaimResource | null;
  csrfToken: string;
  requestId: string;
}>;

export type ProfileOwnershipPageResult =
  | Readonly<{ kind: 'unauthenticated' }>
  | Readonly<{ kind: 'invalid_selection' }>
  | Readonly<{ kind: 'ready'; page: ProfileOwnershipPageState }>;

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

const read = (request: Request, binding: unknown, path: string) =>
  forwardIdentityAuthorityRequest(
    new Request(new URL(path, request.url), {
      method: 'GET',
      headers: request.headers,
    }),
    binding,
    path,
    'GET',
  );

const readClaim = (request: Request, binding: unknown, claimId: string) => {
  const path = `/api/v1/party-claims/${encodeURIComponent(claimId)}`;
  return forwardProfileOwnershipRequest(
    new Request(new URL(path, request.url), {
      method: 'GET',
      headers: request.headers,
    }),
    binding,
    path,
    'GET',
  );
};

const emptyPage = (
  requestId: string,
  actorId: string | null,
  actingPartyId: string | null,
  csrfToken: string,
  state: 'ready' | 'forbidden' | 'degraded' = 'ready',
): ProfileOwnershipPageState => ({
  state,
  actorId,
  actingPartyId,
  capabilitySnapshot: [],
  access: state === 'ready' ? 'read-only' : 'disabled',
  claim: null,
  csrfToken: state === 'ready' ? csrfToken : '',
  requestId,
});

export const resolveProfileOwnershipPage = async (input: {
  request: Request;
  binding: unknown;
  selectedId: string | null;
  requestId: string;
}): Promise<ProfileOwnershipPageResult> => {
  if (!hasProfileOwnershipSession(input.request))
    return { kind: 'unauthenticated' };
  if (
    input.selectedId !== null &&
    !ProfileUuidSchema.safeParse(input.selectedId).success
  )
    return { kind: 'invalid_selection' };

  const identityResponse = await read(
    input.request,
    input.binding,
    '/api/v1/me/identity',
  );
  if (identityResponse.status === 401) return { kind: 'unauthenticated' };
  const identity = identityResponse.ok
    ? PersonIdentityResponseSchema.safeParse(await json(identityResponse))
    : null;
  if (!identityResponse.ok || identity === null || !identity.success) {
    return {
      kind: 'ready',
      page: emptyPage(
        input.requestId,
        null,
        null,
        '',
        identityResponse.status === 403 ? 'forbidden' : 'degraded',
      ),
    };
  }

  const contextsResponse = await read(
    input.request,
    input.binding,
    '/api/v1/me/acting-contexts',
  );
  const contexts = contextsResponse.ok
    ? ActingContextListResponseSchema.safeParse(await json(contextsResponse))
    : null;
  const actingPartyId = contexts?.success
    ? (contexts.data.items.find((item) => item.selectable)?.partyId ??
      identity.data.personId)
    : null;
  if (!contextsResponse.ok || contexts === null || !contexts.success) {
    return {
      kind: 'ready',
      page: emptyPage(
        input.requestId,
        identity.data.personId,
        actingPartyId,
        '',
        contextsResponse.status === 403 ? 'forbidden' : 'degraded',
      ),
    };
  }

  let claim: ClaimResource | null = null;
  let state: ProfileOwnershipPageState['state'] = 'ready';
  if (input.selectedId !== null) {
    const response = await readClaim(
      input.request,
      input.binding,
      input.selectedId,
    );
    if (response.status === 401) return { kind: 'unauthenticated' };
    if (response.status === 403) state = 'forbidden';
    else if (response.status === 503) state = 'degraded';
    else if (response.ok) {
      const parsed = ClaimResourceSchema.safeParse(await json(response));
      if (parsed.success) claim = parsed.data;
      else state = 'degraded';
    } else if (response.status !== 404) state = 'degraded';
  }

  return {
    kind: 'ready',
    page: {
      ...emptyPage(
        input.requestId,
        identity.data.personId,
        actingPartyId,
        cookie(input.request, 'wj_csrf'),
        state,
      ),
      claim,
    },
  };
};
