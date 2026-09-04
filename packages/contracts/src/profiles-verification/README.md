# Profiles verification contracts

## Contents

Strict primitives, models, request/resource schemas, events, operation policy,
active and deferred route definitions, and their public barrel.

## Ownership

Strict Zod contracts for Slice 05 shadow-party, claim-proof, contest, transfer,
and ownership-projection boundaries. The module owns wire requests, safe
resources, private record shapes, identifier-only events, and the route policy
registry; actor, authority, and ownership decisions remain server-side.

## Extension rules

Add or activate a route only in its owning slice. Preserve strict objects,
stable error/status semantics, server-derived authority, bounded identifiers,
and exact OpenAPI component registration when extending these contracts.

## Conventions

Keep wire and private records separate, export only safe public schemas, model
asynchronous acceptance with persisted `JobStatus`, and keep proof evidence out
of events and other broad-distribution payloads.

## Related links

- `.memory/wiki/specs/be/02a-shadow-claim-ownership.md`
- `.memory/wiki/specs/ia/02-profiles-verification.md`
- `apps/worker/src/profile-ownership`
