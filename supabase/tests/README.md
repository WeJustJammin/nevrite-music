# Database contract tests

## Contents

The pgTAP files verify migrations, privilege boundaries, RLS, idempotency,
state machines, restore fencing, and recovery provenance against a reset local
database.

## Ownership

This directory owns executable database acceptance evidence. It does not own
the schema under test or application-level orchestration.

## Extension

Add tests beside the migration that introduces a behavior. Cover both allowed
and denied paths, including direct-table and service-role bypass attempts.

## Conventions

- Declare an exact plan and keep assertions deterministic.
- Run against disposable local data only.
- Roll back fixture data at the end of each test file.
- Never claim hosted PITR or provider behavior from synthetic evidence.

## Related links

- `../migrations/README.md`
- `../../docs/runbooks/platform/release-recovery-gates.md`
- `../../packages/data-access/src/database.types.ts`
