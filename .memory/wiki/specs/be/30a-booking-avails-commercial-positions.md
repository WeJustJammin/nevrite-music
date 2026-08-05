# Booking avails, routing windows and commercial positions — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]  
**Deep Dive:** [[specs/ia/deep-dives/30-booking-contracts|Booking contracts deep dive]]

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

- **Shard split:** 1 of 5; 30.01, 30.02, 30.03, 30.04 and 30.05.
- **Boundary:** room-date commercial avails, artist routing windows, dual priority ladders, reordering/release and directly-superior challenges.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 30 IA/deep dive | commercial intention, scoped windows, ladder priority and challenge races |
| Shards 01 and 29 | representation authority, physical slots and resource holds |

## Avail and Position Invariants

- Avail overlays commercial intention/terms/visibility on an immutable Shard 29 physical slot. Physical change marks it stale; commercial state never mutates source availability.
- Artist routing window requires scoped representation authority and pins territory, pattern, quota, fee floor, visibility and expiry without leaking denied windows.
- Commercial request names an act and creates room-side and artist-side positions from one snapshot. Arrival order is not guaranteed and ladders may disagree.
- Shard 29 `ResourceHold` reserves physical resources; Shard 30 `CommercialPosition` represents negotiation priority. Confirmation requires both and neither implies the other.
- Reorder/release is versioned and notifies affected parties. Directly superior challenge has bounded clock; concurrent release wins and timeout equals drop.
- Participants see own-side ladder and conflict-risk summary, never hidden counterparty identity.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/booking/room-avails` | acting party/entity/Shard-29 slot/intent/terms/visibility/expiry/key; buyer-side authority | `201 BookingAvailResponse`; active/version/source snapshot | `403 AUTHORITY_REQUIRED`, `409 PHYSICAL_SLOT_STALE`, `422 TERMS_INCOMPLETE`, `429` |
| `POST /api/v1/booking/artist-windows` | artist/territory/pattern/quota/fee floor/visibility/expiry/key; scoped representative | `201 ArtistRoutingWindowResponse`; active/version | `403 TERRITORIAL_AUTHORITY_REQUIRED`, `409 WINDOW_CONFLICT`, `422`, `429` |
| `POST /api/v1/booking/commercial-positions` | act/mandate/room+artist refs/indicative fee/key; booking actor | `201 CommercialPositionResponse`; both ladder refs/disclosed ranks | `403 MANDATE_INVALID`, `409 SLOT_UNAVAILABLE`, `422 ACT_REQUIRED|POSITION_LIMIT`, `429` |
| `POST /api/v1/booking/ladders/{id}/versions` | ordered positions/releases/expected version/key; ladder owner | `201 CommercialLadderResponse`; successor/notices | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/booking/positions/{id}/challenges` | target directly-superior position/expected version/key; eligible challenger | `201 PositionChallengeResponse`; clock/options/escalation | `403`, `409 NOT_DIRECTLY_SUPERIOR|CHALLENGE_ALREADY_ACTIVE|RELEASE_WON`, `422`, `429` |

## Persistence, RLS and Workers

- Avail, routing window, ladder/version, position and challenge rows pin authority, slot, terms and policy versions.
- RLS exposes avails at configured commercial visibility, windows to authorized scopes, and ladder identities only to owner/named act side. No fan projection exists.
- Staleness, expiry, challenge and notice workers are idempotent; late challenge cannot revive released position.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Room avail | `active → stale|expired|withdrawn|superseded`; stale may return active only through a new physical-slot snapshot | Buyer-side authority/Shard 29 slot change/timer trigger. Commercial state never mutates physical availability. |
| Artist routing window | `active → expired|revoked|superseded`; quota may derive `exhausted` without exposing denied windows | Scoped territorial representation/term/quota trigger. Missing authority or conflict blocks. |
| Commercial position | `active → reordered|released|challenged|expired|confirmed`; challenged `→ retained|dropped|released`; timeout equals dropped | One request snapshot/ladders/challenge clock trigger. Position is negotiation priority only and never physical hold. |
| Commercial ladder | immutable `active → superseded`; successor pins ordered positions/releases | Ladder owner versioned reorder/release triggers. Participants see own ladder/conflict summary only; arrival order is not promised. |

Every unlisted transition returns the typed state/version/authority conflict. Concurrent release wins and late challenge cannot revive.

## Failure, Deepening and Ambiguity Gate

Tests cover source-slot mutation, denied-window leak, actless request, arrival-order promise, hold/position conflation, lost reorder, counterparty identity leak and release/challenge race. Seven passes converge; two implementers receive identical avail and commercial-position behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Avail and commercial-position contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
- [[specs/ia/deep-dives/30-booking-contracts|Deep Dive 30 — Booking contracts]]
- [[specs/be/01c-relationships-authority-governance|Relationships, authority and governance — Backend Specification]]
- [[specs/be/29c-room-calendars-holds-enquiries|Room calendars, external busy mirrors, holds and enquiries — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
- [[specs/ia/deep-dives/30-booking-contracts|Deep Dive 30 — Booking, negotiation and contracts]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/29c-room-calendars-holds-enquiries|Room calendars, external busy mirrors, holds and enquiries — Backend Specification]]
