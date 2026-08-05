# Ticket guest allocations, comps and door additions — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]  
**Deep Dive:** [[specs/ia/deep-dives/35-ticket-products-sales|Ticket products and sales deep dive]]

**Error Architecture:** Every endpoint uses [[specs/2026-08-02-architecture-design#error-architecture|Architecture Design § Error Architecture]] with `{ code, message, details, requestId }`; `code` is the application enum listed by the endpoint, never an HTTP-status string.  
**Error Recovery:** For every endpoint code, `400|401|403|404|415|422` is non-retryable without corrected input/authority; `409|412|428` requires refetch or prerequisite repair; `429` retries only after `Retry-After`; `502|503|504` retries idempotent reads and committed-key mutations with jitter after status reconciliation; `500` is never blindly retried.  
**Endpoint Security:** Every endpoint rejects unknown fields through strict Zod validation at middleware stage 8, normalizes bounded text and rejects control/format smuggling before domain execution. Response serialization allowlists only the named success/error schema and excludes secrets, tokens, raw provider payloads, SQL, stack traces, private policy predicates, restricted evidence and PII not explicitly named in that response.  
**Endpoint Middleware:** The route's request/authorization cell selects exactly one non-implicit profile: public/cacheable read `120/min/IP`; authenticated read `300/min/user` and `600/min/party`; search `60/min/user` or `30/min/IP`, max 50; ordinary mutation `60/min/user` and `120/min/party`; high-risk command `10/min/user`; admin read/command `120/10 per min/user`; signed provider/webhook `300/min/provider`; internal worker `300/min/service principal`. All run the fixed Shard 00 middleware order. Browser `/api/v1` permits credentialed exact first-party origins only with documented methods/headers and 10-minute-max preflight; `/internal/v1` and worker/provider routes deny browser CORS. `429` includes `Retry-After` and RateLimit headers.  
**Concurrency and Collections:** Every retryable `POST` reserves `Idempotency-Key`; internal/event writes additionally enforce the named producer/event uniqueness key. `PUT|PATCH|DELETE` require `If-Match`/expected version and return `428` when absent and `409 VERSION_CONFLICT` when stale; named allocator, claim, close or lease operations use the stronger serializable/row-lock/unique-key rule stated in the endpoint invariants. Every unbounded collection uses opaque cursor pagination with default `25`, maximum `50`, stable `(created_at DESC, id DESC)` order, only the filters/sorts named in its request cell, and `nextCursor: null` at exhaustion. Explicit bounded embedded arrays/registries return the complete allowlisted set with maximum 50 and no pagination.  
**External Seam:** When an endpoint names a provider/adapter, its outbound request is the strict allowlisted adapter DTO derived from that endpoint's request cell and its response is reduced to the named success fields before domain use; raw payloads never cross the adapter. Synchronous calls have a `5,000 ms` deadline. Idempotent reads retry at most twice with jittered `250 ms` then `1,000 ms` backoff; mutations do not retry after an ambiguous outcome and enter the named reconciliation state. The circuit opens after five consecutive retryable failures for 60 seconds, then admits one probe; exhausted work returns `502|503|504` or the explicit queued/unknown state.  
**IA Traceability:** Every endpoint/worker below implements only the interaction IDs allocated in `## Classification`; its domain request and success tokens are exact projections of the cited IA shard `## Contracts` and `## Data Model`, while transport-only `requestId`, idempotency, version, cursor and error fields derive from [[specs/be/00-infrastructure|Shard 00]]. No endpoint or field may be inferred outside those cited sections; a new field requires contract evolution.  
**Schema Grammar:** Every request/response token expands through [[specs/be/00-infrastructure#normative-schema-grammar|Shard 00 § Normative Schema Grammar]] into an exact strict Zod 4 and PostgreSQL type; local constraints only narrow it. Optionality/nullability must be written, and an unresolved token blocks implementation rather than becoming `any`, `unknown` or free text.  
**Persistence Grammar:** Every locally named table/record expands through [[specs/be/00-infrastructure#normative-persistence-grammar|Shard 00 § Normative Persistence Grammar]] for exact types, non-null defaults, FK/delete actions, uniqueness, query-matched indexes, RLS/grants and atomic audit/outbox behavior. A missing local field, relationship, state or query blocks implementation.  

## Classification

- **Shard split:** 3 of 5; 35.12, 35.13 and 35.14.
- **Boundary:** funded held guest allocations, per-head/+1 comp issuance and reserve-backed or explicitly authorized door additions.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 35 IA/deep dive | guest funding, held-to-comp transitions, +1 atomicity and door reserve |
| Shards 30 and 31 | contracted holds and settlement statement allocation |

## Guest and Door Invariants

- Guest allocation pins entitled party/funder, matching held units, deadline and manifest version. It may increase within headroom but never lower below spend.
- Artist guest allocator spends only own held units and cannot configure global inventory.
- Submission issues one deterministic ticket/barcode per head and moves held to comp atomically. +1 request is all-or-none; partial spend is forbidden.
- Duplicate guest identity warns without exposing unrelated guest list and requires explicit resolution.
- Door role may spend signed reserve only. Operator may authorize over-allocation online with absorb party/reason and append settlement line.
- Offline beyond reserve refuses safely; it never mints unbacked admission or queues hidden over-allocation.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/ticket-manifests/{id}/guest-allocations` | party/funder/units/deadline/manifest version/key; entitled allocator | `201 GuestAllocationResponse`; held allocation/version | `403`, `409 MANIFEST_HEADROOM_EXHAUSTED`, `422 HOLD_SOURCE_REQUIRED`, `429` |
| `POST /api/v1/guest-allocations/{id}/versions` | raised units/deadline/expected version/key; allocator | `201 GuestAllocationResponse`; successor/spend floor | `403`, `409 BELOW_SPEND|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/guest-allocations/{id}/submissions` | guests/+1 groups/price-level refs/key; allocator | `201 GuestSubmissionResponse`; per-head comp tickets | `403`, `409 ALLOCATION_EXHAUSTED|DEADLINE_PASSED|DUPLICATE_GUEST`, `422 PARTIAL_PLUS_ONE_FORBIDDEN`, `429` |
| `POST /api/v1/ticket-events/{id}/door-additions` | guest/reserve units/authorizer/absorb party/reason/key; door or operator role | `201 DoorGuestResponse`; reserve-backed or attributed over-allocation | `403 ONLINE_AUTH_REQUIRED`, `409 RESERVE_EXHAUSTED`, `422 ABSORB_PARTY_REQUIRED`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Guest allocation version | `current -> superseded|expired`; `expired -> superseded` | An authorized raise/deadline successor atomically supersedes the prior version; deadline expiry ends new spend. A successor below committed spend returns `409 BELOW_SPEND`, and expired units return according to the pinned manifest hold policy. |
| Guest submission | `validating -> issued|blocked`; `issued -> corrected` | Atomic validation consumes exact held units and issues one deterministic comp identity per head; any +1, duplicate, deadline or capacity failure blocks the entire submission. Corrections append a successor and never reuse or silently replace ticket identity. |
| Duplicate-identity review | `warning -> resolved_same_person|resolved_distinct|rejected` | The entitled allocator explicitly resolves the privacy-minimized warning. Until resolution, issuance returns `409 DUPLICATE_GUEST`; no unrelated guest-list identity is disclosed. |
| Door reserve | `available -> partially_spent|exhausted`; `partially_spent -> exhausted`; `available|partially_spent -> closed` | Each signed online/offline spend atomically decrements backed units. Offline exhaustion refuses safely; reserve state never becomes negative or mints an unbacked admission. |
| Door over-allocation | `requested -> authorized|rejected`; `authorized -> issued|failed` | Online operator authority plus absorb party and reason permits one attributed settlement line and admission. Missing authority or attribution rejects before inventory/ticket mutation; failed issuance preserves the authorization audit without spend. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; destructive mutation of spent allocation, issued identity or settlement attribution returns `409 IMMUTABLE_GUEST_FACT`.

## Persistence, RLS and Workers

- Guest allocation/funder/held-unit/deadline versions, submissions/head identities/tickets and door reserve/authorization/settlement-line rows pin actor and manifest versions.
- RLS exposes allocation to funder/allocator and own ticket to guest; door sees minimum lookup/reserve state, not global guest identities or settlement detail.
- Deadline, duplicate warning, held-to-comp and settlement-line workers are idempotent; offline route cannot enqueue unauthorized over-allocation.

## Failure, Deepening and Ambiguity Gate

Tests cover lowering below spend, artist global inventory edit, partial +1, duplicate identity leak, comp without held unit, door global inventory, offline beyond reserve and missing absorb party. Seven passes converge; two implementers receive identical guest allocation and door behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Guest allocation and door contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
- [[specs/ia/deep-dives/35-ticket-products-sales|Deep Dive 35 — Ticket products and sales]]
- [[specs/be/30c-booking-documents-payments-announcement|Booking announcement, documents, amendments and payment assertions — Backend Specification]]
- [[specs/be/31b-settlement-inputs-reconciliation-disputes|Live settlement inputs, reconciliation and disputes — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
- [[specs/ia/deep-dives/35-ticket-products-sales|Deep Dive 35 — Ticket products, sales, access packages and delivery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/30c-booking-documents-payments-announcement|Booking announcement, documents, amendments and payment assertions — Backend Specification]]
- [[specs/be/31b-settlement-inputs-reconciliation-disputes|Live settlement inputs, reconciliation and disputes — Backend Specification]]
