# Profile ownership service

## Contents

PRF-API-01–08 Hono routes, strict request parsing, production RPC adapter,
typed error mapping, command orchestration, and Slice 05 service tests.

## Ownership

This directory owns the Phase 2 Slice 05 HTTP/application boundary for shadow
parties, invitations, remedies, claim initiation, challenges, proof, and
conversion. PostgreSQL remains the transaction and authorization authority;
the Worker derives caller context, validates contracts, and maps safe results.

## Extension rules

Add a public route only when its owning slice is active and the shared registry
and OpenAPI contract are locked. Production effects must call the named
service-role RPC adapter, preserve idempotency/version semantics, and parse the
database response before returning it.

## Conventions

Reject unknown fields before effects, derive identity and acting party from
trusted middleware, keep proof material out of logs, use typed disclosure-safe
errors, and return persisted jobs for asynchronous acceptance.

## Related links

- `packages/contracts/src/profile-ownership`
- `.memory/wiki/specs/be/02a-shadow-claim-ownership.md`
- `supabase/migrations/20260901051000_profile_ownership_commands.sql`
