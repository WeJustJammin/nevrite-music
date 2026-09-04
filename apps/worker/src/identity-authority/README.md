# Identity authority Worker

## Contents

Route composition, parsing, handlers, recovery, production adapters, and tests.

## Ownership

This module owns BE01b-01 through BE01b-13 and BE01b-18 runtime behavior.

## Extension rules

Add contract-first ports and failing tests before any new handler or adapter.

## Conventions

Resolve authority per request, fail closed, and commit canonical state, audit, and outbox atomically.

## Related links

- `.memory/wiki/specs/be/01b-party-identity-aliases.md`
