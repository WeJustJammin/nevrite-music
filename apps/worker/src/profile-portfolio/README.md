# Profile portfolio Worker boundary

## Contents

Active `PRF-PROF-01` through `PRF-PROF-11` handlers, transport validation,
policy checks, production adapters, and focused tests live here.

## Ownership

Handlers own HTTP validation and orchestration. Server-only
`ProfilePortfolioDependencies` ports own persistence, transactions, outbox
delivery, and canonical authorization evidence.

## Extension

Add a route only after its strict contract, failing test, capability policy,
rate class, transaction boundary, and typed failure mapping are locked.

## Conventions

Keep producer payloads bounded and hash-only, validate every dependency result,
and fail closed when adapters or event sinks are unavailable. Deferred EPK
operations remain unmounted.

## Related links

See [`../../../../packages/contracts/src/profile-portfolio/`](../../../../packages/contracts/src/profile-portfolio/)
for route contracts and `02b-profile-portfolio-epk.md` in the backend
specification corpus for the locked behavior.
