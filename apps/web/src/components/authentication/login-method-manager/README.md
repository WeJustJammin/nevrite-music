# Login-method manager

## Contents

This directory contains the bounded React island used by the server-rendered security settings page. It presents the caller's approved login-method projection and the duplicate-account merge workflow without exposing account-discovery data.

## Ownership

The Identity domain owns this island. The server-rendered page supplies only an authenticated, bounded initial projection; Worker routes and protected RPCs remain authoritative for every mutation.

## Conventions

- `LoginMethodsPanel.tsx` renders link and unlink controls from server-authorized method capabilities.
- `AccountMergePanel.tsx` renders duplicate proof, conflict acknowledgement, and confirmation states.
- `use-account-security.ts` owns client state transitions and preserves safe recovery state.
- `api.ts` calls same-origin Astro proxy routes and forwards only required conditional and idempotency headers.
- `types.ts` defines the island's internal state and prop contracts.

## Extension rules

Keep server authority in the Worker and Supabase RPCs. Never add candidate lookup, raw provider subjects, email disclosure, bearer-token forwarding, or client-derived ownership. Add a failing accessibility and integration test before changing a user-visible state transition.

## Related links

See `apps/web/src/pages/settings/security.astro`, `apps/web/src/server/auth-platform-api.ts`, `apps/worker/src/authentication/`, and `packages/contracts/src/authentication/`.
