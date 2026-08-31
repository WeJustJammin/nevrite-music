# Provider evidence UI

## Contents

This directory owns the bounded, read-only provider-operation and webhook
receipt evidence island. It renders only a server-validated operation/receipt
projection, with case-scoped staff or capability-scoped admin access.

## Ownership

The parent route owns canonical reads, capability checks, URL state, and data
refresh. This island owns presentation of the safe projection, status
announcements, and read-only retry/refetch descriptors. It has no authority to
invoke provider effects, acknowledge webhooks, or replay an operation.

## Extension

Extend the island only with fields present in the locked server projection and
with contract-first tests. New evidence must preserve operation-only links,
focus, filter state, and the no-raw-payload/no-secrets boundary. Add provider
actions or registry entries outside this directory only through a separately
approved backend and capability contract.

## Conventions

Keep this bounded island server-first: receive a safe projection, render
accessible read-only evidence, and return refresh intent to the parent route.
Use typed state and deterministic error ownership; do not add network clients,
browser persistence, provider calls, or effect controls here.

## Related links

The infrastructure FE contract is documented in
`.memory/wiki/specs/fe/00-infrastructure.md`; the Phase 1 acceptance criteria
are tracked in `.memory/pipeline/progress/slices/phase-01-slice-06.md`.

## Security boundary

Payloads, provider references, actor identifiers, secrets, external event IDs,
and raw provider responses are not accepted by the projection or rendered by
the panel. Production provider registrations stay empty in Phase 1; the UI
states that provider effects are disabled and never exposes an effect action.

## Concurrency and recovery

The parent route owns canonical reads. Multi-tab, Realtime, and reconnect hints
call the invalidation seam so the route refetches canonical evidence. Retry
descriptors are bounded to safe read reconciliation (250 ms and 750 ms) and
cannot resend a provider effect. Degraded views retain the last verified
projection and timestamp without claiming freshness.
