import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { forwardIdentityAuthorityRequest } from '../../../../../../server/identity-authority-platform-api.ts';

export const prerender = false;

/** Public projection is deliberately anonymous; no session or CSRF cookie is forwarded. */
export const GET: APIRoute = ({ request, params }) =>
  forwardIdentityAuthorityRequest(
    request,
    env.PLATFORM_API,
    `/api/v1/identity/parties/${encodeURIComponent(params.partyId ?? '')}/projection`,
    'GET',
    { credentials: 'omit' },
  );
