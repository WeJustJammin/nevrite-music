# Test support

## Contents

Deterministic factories, serializable fixtures, and test-only boundary inputs
live in this package. The package is consumed by Vitest and Playwright checks;
it never runs in production bundles.

## Ownership

QA owns this package. It may model public contracts and synthetic runtime
bindings, but it does not own production helpers, provider clients, secrets, or
network access.

## Extension

Add a named factory to `src/factories.ts` and its serializable type to
`src/types.ts` when a test category needs a stable input. Keep each factory
fresh, deterministic, and safe to JSON-serialize. Update the category test
that consumes it in the same change.

## Conventions

Use fixed UUIDs, timestamps, URLs, and release labels. Return frozen objects or
arrays where practical; accept explicit overrides for refusal-path tests. Do
not read process environment, current time, randomness, production data, or
provider credentials.

## Related links

- [Cross-surface tests](../../tests/README.md)
- [Runtime contracts](../contracts/README.md)
- [Local bootstrap](../../docs/local-bootstrap.md)
