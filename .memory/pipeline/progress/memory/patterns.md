# Reusable Patterns

## Test-only database dependencies stay outside public generated types

Install PostgreSQL test extensions into an explicit non-public schema and call
their functions through that schema. A public test-only extension can make the
post-test live schema differ from committed generated database types even when
the application migration is unchanged.

## Browser actions wait for an explicit island-readiness boundary

Server-first HTML is valid before hydration, but an automated interaction that
depends on a React handler must wait for the island's explicit readiness marker.
This prevents a click from landing while hydration replaces or moves the SSR
control, without weakening the no-JavaScript fallback test.

## Operational provider effects use claim-before-effect receipts

Evaluate provider-neutral thresholds first, then acquire a server-owned,
time-bounded claim before sending an external notification. Persist only a hash
of the in-memory UUID claim token and complete the record with a digest of the
redacted delivery content. This makes overlapping cron executions idempotent,
keeps provider payloads and credentials out of storage, and permits a failed
delivery claim to expire safely without declaring success.
