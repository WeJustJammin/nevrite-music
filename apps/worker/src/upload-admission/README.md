# Upload-admission Worker boundary

## Contents

This directory owns the strict HTTP boundary for `POST /api/v1/upload-intents`.
It validates transport and contract input before resolving server authority,
then delegates storage signing and canonical persistence through injected ports.

## Ownership

The Worker owns request limits, safe errors, deadlines, rate decisions, and
response headers. Production storage remains disabled until an explicitly
approved adapter and binding are supplied; absence fails closed with 503.

## Extension

Keep provider credentials and signed URLs out of logs and persistence. Add a
failing boundary test for every new refusal, retain exact idempotency/version
semantics, and register only compile-time routes.

## Conventions

- Reject oversized transport bodies while streaming.
- Apply the configured rate limiter before storage or persistence work.
- Bind request digests to the resolved authority and optimistic version.
- Revoke signed credentials when canonical persistence fails.

## Related links

- `packages/contracts/src/upload-intent/`
- `packages/application/src/infrastructure/upload-admission/`
- `apps/worker/src/storage/`
