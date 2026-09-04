import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { forwardIdentityAuthorityRequest } from '../../../../../server/identity-authority-platform-api.ts';

export const prerender = false;

export const POST: APIRoute = ({ request, params }) =>
  forwardIdentityAuthorityRequest(
    request,
    env.PLATFORM_API,
    `/api/v1/organizations/${encodeURIComponent(params.organizationId ?? '')}/membership-invitations`,
    'POST',
  );
