# Webhook admission boundary

## Contents

- `webhook-admission.ts` — strict admission orchestration.
- `webhook-support.ts` — bounded byte and verification helpers.
- `webhook-validation.ts` — provider registry and event validation.
- `webhook-types.ts` — local dependency types.
- `*.test.ts` — body, signature, replay, and production fail-closed evidence.

## Ownership

This directory owns the Worker boundary for provider webhook admission:
bounded raw-body intake, signature and replay verification, strict event
validation, and receipt deduplication.

## Extension

Keep provider definitions behind the typed registry. Verify the exact raw bytes
before parsing, preserve the global and provider body ceilings, and return the
safe `{ received: true }` acknowledgement for accepted, duplicate, and
conflict receipts. Production registries must remain empty. This boundary does
not use browser auth, log signatures or payloads, or call a provider.

## Conventions

Pair every boundary change with focused tests in this directory. Keep modules
focused and below 300 lines; keep response, validation, and type ownership in
their dedicated modules rather than expanding the handler entry point.

## Related links

- `packages/contracts/src/webhook-admission/`
- `packages/application/src/infrastructure/provider-effects/`
- `docs/runbooks/platform/provider-webhook-reconciliation.md`
