# Data access

Generated Supabase types, bounded repositories, and migration-owned RPC adapters belong here. The package implements application ports and must not own transport response shapes, cross-domain policy, or unrestricted SQL access.

`src/database.types.ts` is generated from the committed local migrations. Update it with `pnpm db:types` while the local database is running; CI regenerates it in memory and rejects drift.

## Contents

`src/` contains generated Supabase types and bounded repository/RPC adapters;
database migrations and database tests live under `supabase/`.

## Ownership

This package owns persistence adapters and generated database types. Application
ports define the usable boundary; transport contracts, domain invariants, and
provider credentials remain outside this package.

## Extension

Add a repository or RPC adapter only for an application port, then add a
deterministic integration test against the local database harness. Regenerate
`database.types.ts` from committed migrations instead of editing it by hand.

## Conventions

Keep SQL scoped to named schemas and RLS policies, use typed rows, avoid
unbounded queries, and never run production mutations from local setup or
tests. Run `pnpm db:types:check` before committing generated changes.

## Related links

- [Application modules](../application/README.md)
- [Runtime contracts](../contracts/README.md)
- [Database bootstrap](../../docs/local-bootstrap.md)
