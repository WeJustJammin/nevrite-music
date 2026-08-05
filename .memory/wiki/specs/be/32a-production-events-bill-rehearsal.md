# Production events, bill projection and rehearsal linkage — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]  
**Deep Dive:** [[specs/ia/deep-dives/32-show-production-planning|Show production planning deep dive]]

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

- **Shard split:** 1 of 4; 32.01, 32.02 and 32.16.
- **Boundary:** booking-caused production event identity, ordered bill projection and rehearsal subtype linkage without duplicate booking/calendar state.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 32 IA/deep dive | event causation, bill projection and rehearsal boundary |
| Shards 29 and 30 | room booking, accepted deal and bill-slot authority |

## Production Event Invariants

- Production event requires accepted/confirmed Shard 30 booking and links exact date, room, act, role, bill, slot and counterparty refs. Duplicate causal booking returns existing event.
- Bill projection is ordered and versioned with named/TBA/off-platform placeholders; it references Shard 30 ownership and never creates a second commercial lifecycle.
- Concurrent slot edits produce mergeable conflict with current version and affected slot IDs; no edit is silently lost.
- Rehearsal is a production-event subtype linked to existing production plan and Shard 29 room booking. It owns readiness scope/outcomes, not calendar/reservation state.
- Production lifecycle events expose only minimum operational refs to downstream Shards 33/34; private offer/payment/authority facts remain at source.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /internal/v1/production-events` | booking/show/act/bill-slot/room refs/key; booking event worker | `201 ProductionEventResponse`; created or existing causal event | `403`, `409 EVENT_ALREADY_EXISTS`, `422 BOOKING_INELIGIBLE`, `429` |
| `PUT /api/v1/production-events/{id}/bill-projection` | ordered named/TBA/off-platform slots/expected version/key; show producer | `ProductionBillResponse`; successor/diff | `403`, `409 VERSION_CONFLICT|SLOT_CONTROL_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/production-events/{id}/rehearsals` | room booking/readiness scope/source plan versions/key; producer | `201 ProductionEventResponse`; rehearsal subtype/linkage | `403`, `409 REHEARSAL_EXISTS|ROOM_BOOKING_CONFLICT`, `422`, `429` |
| `POST /api/v1/production-rehearsals/{id}/outcomes` | readiness outcomes/evidence/expected version/key; assigned producer/crew | `ProductionRehearsalOutcomeResponse`; appended outcomes/version | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |

## Persistence, RLS and Workers

- Production event/causation, bill projection versions/slots and rehearsal linkage/outcome rows pin booking, room and source versions.
- RLS exposes event/bill to scoped production parties and rehearsal outcomes to assigned crew; downstream projections contain opaque commercial refs only.
- Booking ingest, projection and rehearsal notification workers are idempotent; duplicate causation cannot create parallel events.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Production event | `created → planning → advancing → show_ready → completed|cancelled`; source invalidation may `→ blocked|superseded` | Accepted/confirmed Shard 30 booking causation triggers one event. Duplicate causal key returns existing; event never creates commercial lifecycle. |
| Bill projection | immutable `active → superseded`; each slot remains `named|TBA|off_platform` until source changes | Show-producer ordered update/Shard 30 refs trigger. Concurrent conflict returns current version/affected slots and no edit is lost. |
| Rehearsal event | `planned → ready → completed|cancelled|blocked`; outcome appends `ready|not_ready|partial|unknown` evidence | Existing production plan plus Shard 29 room booking trigger. It owns readiness only and cannot mutate calendar/reservation. |
| Downstream production projection | `current → stale|superseded` | Production lifecycle/source change triggers. Only opaque/minimum operational refs cross to Shards 33/34. |

Every unlisted transition returns the typed state/version/causation conflict. Private offer/payment/authority facts remain at source.

## Failure, Deepening and Ambiguity Gate

Tests cover ineligible booking, duplicate event, duplicate commercial bill, silent slot conflict, TBA identity fiction, rehearsal-created calendar and downstream private commercial leak. Seven passes converge; two implementers receive identical production event and rehearsal behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Production event and rehearsal contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]
- [[specs/ia/deep-dives/32-show-production-planning|Deep Dive 32 — Show production planning]]
- [[specs/be/29d-room-reservations-series-handoff|Room reservations, waitlists, recurring series and performance handoff — Backend Specification]]
- [[specs/be/30e-booking-rfq-bill-construction|Booking RFQ triage and performance bill construction — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]
- [[specs/ia/deep-dives/32-show-production-planning|Deep Dive 32 — Event production planning and advancing]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/29d-room-reservations-series-handoff|Room reservations, waitlists, recurring series and performance handoff — Backend Specification]]
- [[specs/be/30e-booking-rfq-bill-construction|Booking RFQ triage and performance bill construction — Backend Specification]]
