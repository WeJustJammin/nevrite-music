import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { forwardAuthRequest } from '../../server/auth-platform-api.ts';

export const prerender = false;

export const GET: APIRoute = ({ request }) => {
  let binding: unknown;
  try {
    binding = env.PLATFORM_API;
  } catch {
    binding = undefined;
  }
  return forwardAuthRequest(request, binding, '/auth/callback', 'GET');
};
