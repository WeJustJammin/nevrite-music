# Design system

## Contents

Typed design tokens, global cascade layers, accessible shared primitives, and
framework-neutral navigation/presentation policies.

## Ownership

The UI package owns shared presentation behavior. Feature packages may consume
its exports but may not redefine global tokens or create a second style system.

## Extension

Add focused modules under `src/`, export stable subpaths from `package.json`,
and cover every interaction and accessibility branch with deterministic tests.

## Conventions

Do not introduce Tailwind, runtime CSS-in-JS, inline styles, or client-derived
authority. UI policy may depend only on the contracts package.

## Related links

See [`src/infrastructure/README.md`](src/infrastructure/README.md) and the
[frontend specification](../../.memory/wiki/specs/fe/00-infrastructure.md).
