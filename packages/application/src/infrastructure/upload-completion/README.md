# Upload-completion application policy

## Contents

This directory owns the contract-first orchestration for completing an upload,
scheduling verification, and exposing an object only after canonical readiness.

## Ownership

Application code owns lifecycle decisions and typed ports. HTTP parsing,
database RPCs, object-store inspection, credentials, and provider configuration
remain in injected adapters outside this directory.

## Extension

Add a failing contract or application test before changing the lifecycle.
Preserve compare-and-set completion, replay safety, asynchronous verification,
and the rule that unverified objects are never consumable.

## Conventions

Use strict shared schemas, server-derived authority, canonical compare-and-set
versions, and sanitized error results. Tests precede lifecycle changes.

## Related links

- `docs/runbooks/platform/upload-admission-reconciliation.md`
- `packages/contracts/src/upload-completion.ts`
