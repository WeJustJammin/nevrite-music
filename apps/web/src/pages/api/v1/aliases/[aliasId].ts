import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { forwardIdentityAuthorityRequest } from '../../../../server/identity-authority-platform-api.ts';

export const prerender = false;

export const PATCH: APIRoute = ({ request, params }) =>
  forwardIdentityAuthorityRequest(
    request,
    env.PLATFORM_API,
    `/api/v1/aliases/${encodeURIComponent(params.aliasId ?? '')}`,
    'PATCH',
  );
