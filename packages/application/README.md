# Application modules

## Contents

Use cases, policy orchestration, and injected ports live under
`packages/application/src/<domain>`.

## Ownership

Application modules own provider-neutral policy. Concrete adapters and UI
rendering remain downstream.

## Extension

Add a focused domain module behind typed ports, export it through the domain
barrel, and cover every decision branch with deterministic tests.

## Conventions

Application code depends only on contracts and domain modules. It never imports
Worker, database, provider, or web-framework implementations.

## Related links

See [`src/infrastructure/README.md`](src/infrastructure/README.md) and the
repository [engineering standards](../../.memory/wiki/specs/ENGINEERING-STANDARDS.md).
