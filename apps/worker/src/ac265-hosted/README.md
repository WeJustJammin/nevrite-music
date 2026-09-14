# AC265 hosted runner boundary

## Contents

- `github-oidc.ts` verifies the protected GitHub Actions workload identity.
- `routes.ts` owns the strict staging-only prepare-run HTTP boundary.
- `production.ts` adapts the verified command to the protected Supabase RPC.
- `types.ts` defines the narrow dependency and binding interfaces.
- The colocated test files cover authentication, routing, composition, and the
  production transport.

## Ownership

This directory owns the Worker-side authorization foundation for the AC265
hosted browser runner. It accepts only a bounded `candidateRef` request from the
pinned protected workflow, verifies GitHub OIDC claims, and resolves candidate
identity through server-owned persistence. It does not broker browser sessions,
issue outage leases, collect hosted receipts, run Playwright, or prove AC265
acceptance.

## Extension rules

Keep every new route staging-only, OIDC-authenticated, strictly parsed, and
bound to the enrolled candidate plus the exact protected workflow revision.
Caller-supplied origins, deployment identities, digests, provider coordinates,
or authorization policy are forbidden. Add control-plane capabilities through
focused contracts and protected persistence before mounting a route.

## Conventions

Responses remain redacted and bounded. Provider and database failures map to
generic public errors. GitHub token contents, service-role credentials, raw
session material, and receipt payloads must never reach logs or client-visible
errors. Tests precede implementation and cover replay, claim drift, method,
body, origin, and response-shape rejection.

## Related links

- `packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-control-plane.ts`
- `infra/workflows/ac265-github-oidc-client.ts`
- `supabase/migrations/20260914021600_ac265_prepare_run_authorization.sql`
- `tests/e2e/support/ac265-hosted-prerequisites.ts`
