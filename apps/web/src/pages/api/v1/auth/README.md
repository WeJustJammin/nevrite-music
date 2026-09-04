# Authentication API proxies

## Contents

Astro server routes proxy the canonical authentication API through the private `PLATFORM_API` binding. Nested `email/`, `oauth/`, and `session/` directories preserve the public contract paths.

## Ownership

The Identity domain owns these boundaries. The web surface may relay validated requests, responses, and cookies but never becomes authentication authority.

## Extension rules

Add a proxy only after its Zod contract, worker route, route-registry entry, and OpenAPI operation exist. Forward only allowlisted headers and keep credential cookies server-managed.

## Conventions

Routes are non-prerendered, use `forwardAuthRequest`, preserve typed failures, and expose no provider secrets or browser-readable session tokens.

## Related links

See `packages/contracts/src/authentication/`, `apps/worker/src/authentication/`, and `docs/openapi/openapi.json`.
