# Real-route support

## Contents

- Local API and session-authority fixtures
- Wrangler configuration and process runner
- Legacy profile-portfolio fixture

## Ownership

This directory owns test-only bindings for the Slice 09 real-route browser
checks. It does not own production API behavior, Supabase persistence, or
deployment credentials.

## Extension

Add a fixture only when a browser contract needs an isolated local boundary.
Document its process lifetime, origin, authority assumptions, and cleanup in
this file, and keep production paths delegated to the real server entry.

## Conventions

Use explicit loopback origins, bounded readiness polling, process-group
cleanup, and test-only secrets. Never use these fixtures as evidence for
deployed Worker, RLS, identity-provider, or external-service behavior.

## Related links

- `tests/e2e/phase-02-slice-09-content-schema-registry-real-route.spec.ts`
- `apps/web/content-schema-registry-web.mjs`
- `docs/local-bootstrap.md`

This directory contains test-owned local bindings used by production-built
Astro/Cloudflare E2E checks. The harness starts the API Worker first, waits for
API and web readiness, runs Playwright against an explicit loopback origin, and
tears down child process groups. It does not connect to Supabase, external
identity providers, billing, or Cloudflare deployment resources.
The in-memory adapter is not evidence of Supabase persistence, PostgreSQL RLS,
or a deployed Worker.

## Module map

- `content-schema-registry-api.ts` — local Worker API composition with an
  in-memory registry projection, HMAC-validated session authority, and a
  test-only revocation control.
- `s09-session-authority.ts` — local HMAC signature, expiry, session-ID, and
  revocation verifier shared by the API fixture.
- `wrangler.s09-api.jsonc` — Wrangler configuration for that API Worker.
- `run-s09-real-servers.mjs` — ordered production web build, API/web startup,
  readiness polling, explicit port handling, and process-group teardown.
- `profile-portfolio-api.mjs` — legacy HTTP fixture for profile-portfolio E2E;
  it is independent of the Slice 09 Worker binding harness.

The web-side test adapter lives at `apps/web/content-schema-registry-web.mjs`
and delegates all non-test paths to the production server entry. Its temporary
Wrangler config is created under the operating-system temp directory, never in
`apps/web`.
