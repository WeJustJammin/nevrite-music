# Web source boundary

## Contents

Astro pages, server projections, browser islands, and the Cloudflare edge
boundary live here.

## Ownership

`middleware.ts` owns request-wide transport and response security. The
`security-headers.ts` exposes the nonce-aware policy and HTTPS redirect helpers
from the shared `edge-security-runtime.mjs`; the Astro build copies that
runtime beside the generated Cloudflare entry. Server-only data access belongs
under `server/`; browser interaction belongs under `components/` or `lib/`.

## Extension

Add a route under `pages/`, a server boundary under `server/`, or a bounded
island under `components/`. Keep secrets out of page and island modules.

## Conventions

Validate request and response contracts at the nearest server boundary. Keep
transport and security behavior covered by focused tests.

## Related links

See `apps/web/README.md`, `.agents/rules/security-first.md`, and the locked
architecture security-header policy.
