# Upload-admission application policy

## Contents

This directory owns the pure orchestration and validation policy for creating
upload intents. It sequences server-derived authorization, idempotency and
version checks, bounded signing, and one atomic canonical commit.

## Ownership

Application code owns decisions and typed ports. HTTP parsing, database RPCs,
object-storage signing, credentials, and provider configuration remain in
injected adapters outside this directory.

## Extension

Add policy through a focused typed port and a failing test first. Preserve the
authorize-before-sign and sign-before-commit order, compensate unused signed
admission on commit failure, and never persist or log a signed URL.

## Conventions

Keep orchestration pure, adapters injected, authority server-derived, and
idempotency/version bindings canonical. Every branch starts with a failing test.

## Related links

- `docs/runbooks/platform/upload-admission-reconciliation.md`
- `packages/contracts/src/upload-admission.ts`
