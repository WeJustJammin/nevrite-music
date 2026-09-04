# Profile portfolio contracts

## Contents

Strict Zod schemas, request and response resources, route metadata, event
contracts, registries, and OpenAPI composition for Profile/Portfolio live here.

## Ownership

The active registry owns `PRF-PROF-01` through `PRF-PROF-11`. The deferred
catalog owns `PRF-EPK-01` through `PRF-EPK-08` without mounting runtime routes.

## Extension

Add contract fields before tests or implementation. Preserve strict objects,
branded identifiers, bounded collections, cursor validation, and explicit
active-versus-deferred registry membership.

## Conventions

Keep schema modules at or below 150 lines and utility modules at or below 300.
Export stable barrels and generate OpenAPI from the same route metadata used by
the Worker.

## Related links

See [`../../../../apps/worker/src/profile-portfolio/`](../../../../apps/worker/src/profile-portfolio/)
for the runtime boundary and `02b-profile-portfolio-epk.md` in the backend
specification corpus for the source contract.
