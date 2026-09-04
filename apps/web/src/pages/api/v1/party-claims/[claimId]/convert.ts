import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { forwardProfileOwnershipRequest } from '../../../../../server/profile-ownership-platform-api.ts';

export const prerender = false;

export const POST: APIRoute = ({ request, params }) =>
  forwardProfileOwnershipRequest(
    request,
    env.PLATFORM_API,
    `/api/v1/party-claims/${encodeURIComponent(params.claimId ?? '')}/convert`,
    'POST',
  );
