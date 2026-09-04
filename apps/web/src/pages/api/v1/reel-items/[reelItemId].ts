import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { forwardProfilePortfolioBrowserRequest } from '../../../../server/profile-portfolio-api-route.ts';

export const prerender = false;

const forward =
  (method: 'DELETE' | 'PUT'): APIRoute =>
  ({ request, params }) =>
    forwardProfilePortfolioBrowserRequest(
      request,
      env,
      `/api/v1/reel-items/${encodeURIComponent(params.reelItemId ?? '')}`,
      method,
      { credentials: 'include' },
    );

export const PUT = forward('PUT');
export const DELETE = forward('DELETE');
