# Release and recovery gates

Use this runbook to review immutable release promotion, migration failure,
maintenance, restore evidence, and protected-write readiness.

## Current cost and capability boundary

The project currently uses the Supabase free tier. Seven-day PITR is unavailable,
no measured PITR RPO/RTO evidence exists, and protected money, rights, and
publication writes remain closed. Local synthetic restore drills test the gate
mechanics only; they are not evidence that the hosted project meets PITR, RPO,
or RTO requirements. Do not upgrade a plan, begin a trial, enable an add-on, or
change a provider from this runbook.

## Release promotion

1. Identify the full source commit and content digest produced by the successful
   CI run. Preview, staging, approval, and production must reference that same
   immutable artifact; do not rebuild or relabel it between stages.
2. Confirm contract/OpenAPI drift, type checks, lint, tests and coverage,
   security, accessibility, builds, database reset/lint/pgTAP/type drift,
   registry completeness, SLO/runbook registration, and infrastructure checks
   all passed for the artifact.
3. Confirm migrations are forward-only and remain compatible with the currently
   deployed artifact. Failure after expansion stops promotion; use a forward fix
   or compensating migration and never a destructive rollback migration.
4. Preserve protected production approval and the artifact/digest evidence.
   Unknown deployment state stays pending or manual review until reconciled.

## Recovery readiness

1. Read the canonical recovery-readiness RPC and restore-fence epoch with a
   service credential. Never accept browser claims, plan labels, screenshots, or
   manually edited timestamps as recovery evidence.
2. Keep protected writes closed unless immutable evidence proves a supported
   seven-day PITR window, measured RPO at most 120 seconds, measured RTO at most
   14,400 seconds, freshness before expiry, and a matching released restore
   epoch.
3. Require database integrity, RLS negative tests, RPC grants/functions,
   idempotency/outbox/job consistency, object reconciliation, provider/webhook
   reconciliation, and public-projection checks for that epoch. Any missing,
   stale, malformed, unavailable, or failed check keeps the gate closed.
4. Reopen in the locked order: database integrity; RLS/RPC; persistence
   invariants; object state; provider/webhook state; public projections;
   protected writes; then async/provider effects. Replay current authority and
   state under the original event identity—never blind resend.

## Maintenance and availability

Announce scheduled maintenance at least 48 hours before it starts with truthful
scope, expected duration, affected capabilities, and the canonical status URL.
Do not exclude an unplanned outage from the 99.9% monthly objective. During an
outage, publish only verified shell/status facts, request IDs, evidence freshness,
and the next safe action; omit provider topology, payloads, secrets, and private
cached data.
