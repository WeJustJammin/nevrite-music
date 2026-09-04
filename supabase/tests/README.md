# Database contract tests

## Contents

The pgTAP files verify migrations, privilege boundaries, RLS, idempotency,
state machines, restore fencing, and recovery provenance against a reset local
database.

## Ownership

This directory owns executable database acceptance evidence. It does not own
the schema under test or application-level orchestration.

### Slice 08 — Admin workspace foundation

`phase_02_slice_08_{schema,boundaries,semantics}.sql` owns acceptance evidence
for the seven `platform_private.admin_*` tables, forced RLS/no direct DML,
strict constraints/indexes/FKs, and the active Worker-only RPCs
`platform_api.admin_inbox`, `admin_capability_action`, and
`admin_audit_diagnostic`. Search/bulk execution and diagnostic-run execution
remain deferred; diagnostic definition/run tables are forward-only foundations.
The focused `phase_02_slice_08_{security_reaudit,inbox_reaudit,audit_reaudit,
context_capabilities_reaudit}.sql` suites pin purpose-grant approval, durable
CAS/idempotency, filtered pagination/freshness, disclosure-safe audit reads,
and the service-only capability-context seam.

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
