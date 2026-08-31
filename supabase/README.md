# Supabase source

This directory is the reviewable source of truth for the WeJammin PostgreSQL foundation. Managed Supabase projects are deployment targets; their schema must be reproducible from the committed migrations and tests here.

## Schema boundaries

- `platform_private`: canonical operational records; never exposed through PostgREST.
- `audit_private`: append-only security and provenance evidence; never exposed through PostgREST.
- `platform_api`: narrow RPCs and views for authenticated application access.
- `public_api`: deliberately publishable projections only.
- `public`: not an API surface; anonymous and authenticated roles cannot create objects there.

The local API allowlist contains only `platform_api` and `public_api`. New objects remain inaccessible until their owning slice adds explicit grants and RLS or RPC authorization tests.

## Local verification

Docker must be running. The pinned Supabase CLI is installed through the workspace lockfile.

```sh
pnpm db:start
pnpm db:verify
pnpm db:stop
```

`db:verify` rebuilds the database from migrations, runs the database linter, and executes every pgTAP test in `supabase/tests/`. CI uses `pnpm db:ci`, which serializes the shared self-hosted runner's local Supabase stack and always removes its data volume afterward.

Generated database types are committed at `packages/data-access/src/database.types.ts`. Run `pnpm db:types` after changing a migration; `pnpm db:types:check` proves the committed artifact matches the rebuilt schema.

## Migration policy

Create migrations with `pnpm exec supabase migration new <name>`. Migrations are immutable and forward-only after they reach a shared environment. Correct a released migration with a new compensating migration; never rewrite history or rely on a destructive rollback. Seeds contain synthetic, non-sensitive fixtures only.

Remote project references, access tokens, database passwords, and service-role keys never belong in this directory or Git history.
