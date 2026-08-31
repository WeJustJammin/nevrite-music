# Test-support sources

## Contents

`factories.ts` owns deterministic category fixtures and `types.ts` owns their
serializable contracts. `index.ts` is the public package entrypoint.

## Ownership

QA owns these sources. They model synthetic public inputs only and may not
contain production data, provider clients, credentials, or network access.

## Extension

Add a type and factory together, then consume the factory from the relevant
contract, integration, accessibility, performance, security, or E2E test.
Keep source modules focused and below the package file-size limit.

## Conventions

Factories use fixed values and fresh frozen objects. Overrides are explicit and
remain serializable so tests are deterministic across Vitest and Playwright.

## Related links

- [Test-support package](../README.md)
- [Cross-surface tests](../../../tests/README.md)
