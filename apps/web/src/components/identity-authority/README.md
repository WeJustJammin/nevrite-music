# Identity authority components

## Contents

Route shells, source-specific workbenches, shared primitives, typed state,
operation maps, invalidation rules, and their Slice 03 tests.

## Ownership

This directory contains the bounded Phase 2 Slice 03 client surface for
identity-authority records. `IdentityAuthorityRoute` owns the server-selected
shell; the four workbenches render disclosure-safe list/detail projections;
the primitive, state, role, form, operation-map, and security modules keep
contracts and policy explicit.

## Extension rules

Extend a workbench through `IdentityAuthorityWorkbenchProps` and a typed
source-specific wrapper. Keep URL values view-only, refetch canonical data
after invalidation, preserve safe prior content during loading/degraded
states, and do not pass provider secrets or raw untrusted HTML to the client.

## Conventions

Keep server-derived authority outside island state, use native controls and
named regions, and map API failures through the shared schema/error map.

## Related links

- `docs/ARCHITECTURE.md`
- `.memory/wiki/specs/fe/01-identity-authority.md`
- `.memory/wiki/operations/runbooks/identity-authority.md`
