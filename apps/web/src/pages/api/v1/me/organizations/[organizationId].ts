import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { forwardPrivateOrganizationRead } from '../../../../../server/identity-authority-private-organization-read.ts';

export const prerender = false;

export const GET: APIRoute = ({ request, params }) =>
  forwardPrivateOrganizationRead(
    request,
    env.PLATFORM_API,
    params.organizationId ?? '',
  );
