import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { forwardIdentityAuthorityRequest } from '../../../../../server/identity-authority-platform-api.ts';

export const prerender = false;

export const DELETE: APIRoute = ({ request, params }) =>
  forwardIdentityAuthorityRequest(
    request,
    env.PLATFORM_API,
    `/api/v1/me/facets/${encodeURIComponent(params.facetCode ?? '')}`,
    'DELETE',
  );
