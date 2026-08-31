# Provider effects boundary

## Contents

- `provider-effect.ts` — Worker orchestration boundary.
- `provider-support.ts` — adapter and persistence support.
- `provider-validation.ts` — request and configuration validation.
- `provider-types.ts` — local dependency types.
- `*.test.ts` — branch, configuration, and production fail-closed evidence.

## Ownership

This directory owns the Worker seam from a local provider-operation intent and
outbox record to an injected provider adapter and reconciliation result.

## Extension

Keep extensions behind the typed registry. Persist the planned intent before
calling an adapter, send only the minimum provider request, and leave unknown
timeouts pending so the reconciler—not a retry loop—decides what happens next.
Production registries must remain empty. Adapters are test doubles or locally
owned integrations; this boundary never makes an unapproved external call and
never logs payloads or secrets.

## Conventions

Pair every boundary change with focused tests in this directory. Keep modules
focused and below 300 lines; keep validation and deadline behavior in their
dedicated modules rather than adding branches to the entry point.

## Related links

- `packages/application/src/infrastructure/provider-effects/`
- `packages/contracts/src/provider-operation/`
- `docs/runbooks/platform/provider-webhook-reconciliation.md`
