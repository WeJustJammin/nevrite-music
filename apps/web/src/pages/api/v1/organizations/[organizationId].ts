import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { forwardIdentityAuthorityRequest } from '../../../../server/identity-authority-platform-api.ts';

export const prerender = false;

/** ORG-02 is public; no browser authentication state crosses this boundary. */
export const GET: APIRoute = ({ request, params }) =>
  forwardIdentityAuthorityRequest(
    request,
    env.PLATFORM_API,
    `/api/v1/organizations/${encodeURIComponent(params.organizationId ?? '')}`,
    'GET',
    { credentials: 'omit' },
  );
