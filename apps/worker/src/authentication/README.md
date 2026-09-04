# Authentication worker boundary

## Contents

Strict request parsing, route policy enforcement, Supabase Auth integration, encrypted server cookies, protected RPC composition, and Phase 2 authentication acceptance tests live here.

## Ownership

The Identity domain owns these routes and persistence calls. Supabase validates provider credentials; the worker remains the application authority for sessions, people, audit, and recovery.

## Extension rules

Start from a locked Zod contract and failing test. Add policy metadata before a route, keep all secrets server-side, use protected RPCs instead of direct table access, and preserve exact idempotency and deadline behavior.

Route modules separate provider access, sessions, login methods, and account merges. Production adapters separate configuration, cookies, tokens, bounded HTTP/RPC calls, authorization flows, sessions, login methods, merge commands, and rate limiting. Keep each module within the repository size limits and preserve the public composition exports in `routes.ts` and `production.ts`.

## Conventions

Errors use the shared `ApiError` envelope. Logs contain stable IDs and outcome codes, never tokens, raw emails, state, nonces, PKCE verifiers, or provider payloads.

OAuth callbacks require a locally validated ID-token nonce and digest provider subjects before an intent-specific RPC may run. Sign-in/recovery callbacks may establish a session; provider-link and duplicate-proof callbacks preserve the initiating survivor session. Mutation CSRF tokens are bound to the sealed session reference, and high-risk step-up freshness comes from the original explicit MFA AMR event rather than JWT issue or refresh time. Provider unlink remains `reconciling` until its governed provider operation reaches a terminal outcome.

## Related links

See `packages/contracts/src/authentication/`, `supabase/migrations/20260901010000_authentication_foundation.sql`, `supabase/migrations/20260901020000_login_methods_account_merge.sql`, and `docs/openapi/openapi.json`.
