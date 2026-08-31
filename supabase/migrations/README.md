# Database migrations

## Contents

Timestamped SQL files define the canonical PostgreSQL schema, RLS policies,
authority functions, audit records, and forward-only compatibility changes.
They run in filename order during local reset and CI verification.

## Ownership

This directory owns schema evolution only. Application orchestration belongs in
`packages/application`; generated TypeScript projections belong in
`packages/data-access/src/database.types.ts`.

## Extension

Add a new timestamped migration for every schema change. Never rewrite a
migration that has been applied to a shared environment. Use a forward fix and
pair it with pgTAP coverage in `../tests`.

## Conventions

- Qualify objects with their schema.
- Enable and force RLS on private authority tables.
- Revoke default access before granting the narrow executable boundary.
- Keep `security definer` functions on a fixed, empty `search_path`.
- Treat destructive rollback as prohibited production behavior.

## Related links

- `../tests/README.md`
- `../../docs/runbooks/platform/release-recovery-gates.md`
- `../../.memory/wiki/specs/be/00-infrastructure.md`
