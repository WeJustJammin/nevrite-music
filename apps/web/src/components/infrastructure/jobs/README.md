# Infrastructure job UI

This directory owns the bounded presentation and coordination primitives for
job status, offline intent replay, and realtime invalidation. Each primitive
accepts server-validated data and injected readers/adapters; no module owns a
global store or treats client hints as canonical state.

## Contents

- `JobStatusPanel`, `JobStatusFields`, and `JobProgress` render every job field
  with progress as a separate owner.
- `useJobPolling` performs terminal-safe status reads and only applies the
  declared bounded read retry schedule.
- `OfflineIntentQueue` and `useOfflineIntentReconciliation` keep local intents
  visibly noncanonical until an injected server adapter revalidates them.
- `RealtimeRefetchStatus` and `useRealtimeRefetch` consume invalidation hints
  and coalesce canonical refetches while preserving focus.

The stylesheet is in `apps/web/src/styles/infrastructure-jobs.css`; the fetch
boundary is in `apps/web/src/lib/infrastructure-jobs.ts`.

## Ownership

This directory owns bounded job-status presentation and coordination. Server
authorization, canonical data, and mutation effects remain outside the UI.

## Extension

Add one focused component or hook per responsibility. Keep components below
200 lines and utilities below 300 lines; add contract-first tests for new
states before extending a renderer.

## Conventions

Use the shared `AsyncState`, strict contracts, native controls, and injected
read/replay adapters. Realtime messages invalidate only; they never carry
canonical state or authority.

## Related links

See [`../README.md`](../README.md) for the parent infrastructure boundary and
[`../../../styles/infrastructure-jobs.css`](../../../styles/infrastructure-jobs.css)
for responsive presentation rules.
