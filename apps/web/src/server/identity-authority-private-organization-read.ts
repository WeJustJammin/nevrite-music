import {
  ApiErrorSchema,
  ClientBindingIdSchema,
  createRequestId,
  IdentityPartyPathSchema,
  OrganizationResourceSchema,
} from '@wejammin/contracts';

import {
  forwardIdentityAuthorityRequest,
  hasIdentityAuthoritySession,
} from './identity-authority-platform-api.ts';
import type { IdentityAuthorityPlatformApiBinding } from './identity-authority-platform-api.ts';
import { CLIENT_BINDING_ID_HEADER } from '../lib/client-binding';

const errorResponse = (
  request: Request,
  status: number,
  code: string,
  message: string,
): Response => {
  const requestId = createRequestId(
    request.headers.get('x-request-id') ?? undefined,
  );
  return Response.json(
    ApiErrorSchema.parse({ code, details: {}, message, requestId }),
    {
      status,
      headers: { 'cache-control': 'no-store', 'x-request-id': requestId },
    },
  );
};

const noStore = (response: Response): Response => {
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-store');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

/** Authenticated, tab-bound detail read; public ORG-02 remains anonymous. */
export const forwardPrivateOrganizationRead = async (
  request: Request,
  binding: IdentityAuthorityPlatformApiBinding | unknown,
  organizationId: string,
): Promise<Response> => {
  if (!hasIdentityAuthoritySession(request))
    return errorResponse(
      request,
      401,
      'UNAUTHENTICATED',
      'An authenticated identity-authority session is required.',
    );

  const clientBindingId = request.headers.get(CLIENT_BINDING_ID_HEADER);
  if (
    clientBindingId === null ||
    !ClientBindingIdSchema.safeParse(clientBindingId).success
  )
    return errorResponse(
      request,
      400,
      'INVALID_CLIENT_BINDING',
      'A valid client binding is required for this organization read.',
    );

  const parsedPath = IdentityPartyPathSchema.safeParse({
    partyId: organizationId,
  });
  if (!parsedPath.success)
    return errorResponse(
      request,
      400,
      'INVALID_REQUEST',
      'The organization identifier is invalid.',
    );

  const cleanUrl = new URL(request.url);
  cleanUrl.search = '';
  const cleanRequest = new Request(cleanUrl, {
    method: 'GET',
    headers: request.headers,
  });
  const upstream = await forwardIdentityAuthorityRequest(
    cleanRequest,
    binding,
    `/api/v1/organizations/${encodeURIComponent(parsedPath.data.partyId)}`,
    'GET',
  );
  if (!upstream.ok) return noStore(upstream);

  let value: unknown;
  try {
    value = await upstream.clone().json();
  } catch {
    return errorResponse(
      request,
      502,
      'DEPENDENCY_INVALID_RESPONSE',
      'The private organization projection could not be verified.',
    );
  }

  const parsedOrganization = OrganizationResourceSchema.safeParse(value);
  if (!parsedOrganization.success)
    return errorResponse(
      request,
      502,
      'DEPENDENCY_INVALID_RESPONSE',
      'The private organization projection could not be verified.',
    );

  return noStore(
    new Response(JSON.stringify(parsedOrganization.data), {
      status: upstream.status,
      headers: upstream.headers,
    }),
  );
};
