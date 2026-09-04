# Account-merge proxy routes

## Contents

This directory exposes the authenticated Astro façades for reading one merge case, starting duplicate proof, and confirming a resolved merge plan.

## Ownership

The Identity domain owns these façades. They relay same-origin browser requests to the API Worker; the Worker and protected Supabase RPCs own authorization and state transitions.

## Extension rules

Validate dynamic path values, forward only allowlisted cookies and conditional headers, and preserve the Worker's typed status and safe response projection. Never accept a candidate account identifier from the browser.

## Conventions

Mutations require same-origin CSRF, `Idempotency-Key`, and `If-Match`. No route forwards browser `Authorization` headers or logs request bodies.

## Related links

See `apps/web/src/server/auth-platform-api.ts`, `apps/worker/src/authentication/routes-account-merges.ts`, and `packages/contracts/src/authentication/`.
