# Room reservations, waitlists, recurring series and performance handoff — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]  
**Deep Dive:** [[specs/ia/deep-dives/29-venues-spaces|Venues and spaces deep dive]]

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

- **Shard split:** 4 of 4; 29.15, 29.16, 29.17, 29.18, 29.19, 29.20 and 29.22.
- **Boundary:** instant room-hire reservation, compound resources, mutation/completion, waitlist/series arbitration and immutable performance-bill handoff to Shard 30.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 29 IA/deep dive | quote/reservation atomicity, compound resources, policy mutation, completion, waitlist, recurrence and seam rules |
| Shards 14 and 26 | service/reservation state patterns and payment compensation boundaries |

## Reservation and Handoff Invariants

- Instant book requires full place claim, fresh certain calendar, valid rate card/payout, eligible use type and current policy. Quote pins configuration, extras, rate/policy versions, total/currency and expiry.
- Reservation commits hold, quote, holder authority, every room/person/asset resource, payment authorization and policy acceptance idempotently; any leg fails all-or-release-all with visible compensation.
- One compound identity owns member reservations/holds. Member failure names dependency and releases all; soft contention must be allocated or explicitly acknowledged.
- Cancel/reduce/reschedule uses pinned policy ladder against released delta. One allowed move is atomic; stale request returns current state/terms and never partially mutates.
- Completion may infer only after end plus configured provisional window. Timely no-show voids provisional evidence harvest; money dispute remains separate from operational attendance.
- Waitlist is ranked and lead-time-aware with sequential expiring offers and bounded acceptance. Expiry advances queue; repeated-loss notifications obey budget.
- Recurring series validates every instance through review horizon and commits all with explicit exception instances. Conflict names exact occurrence; trim/split is explicit, never silent partial create.
- Venue-pays/splits-with-act use type is not room hire: Shard 30 receives immutable room/spec/availability snapshots. Room-hire fields reject at seam and no dual lifecycle is created.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/room-hire/quotes` | holder/use type/slot/configuration/extras/calendar-rate-policy versions/key; qualified requester | `201 RoomHireQuoteResponse`; itemized quote/expiry/binding posture | `403`, `409 CALENDAR_UNCERTAIN`, `422 RATE_UNAVAILABLE|MANDATORY_EXTRA_MISSING`, `429` |
| `POST /api/v1/room-reservations` | hold/quote/holder/payment authorization/policy acceptance/key; holder controller | `201 RoomReservationResponse`; reservation/compound/members/compensation state | `403`, `409 HOLD_EXPIRED|QUOTE_EXPIRED|AUTHORITY_LOST`, `422 PAYMENT_NOT_AUTHORIZED`, `429` |
| `POST /api/v1/room-reservations/{id}/mutations` | cancel/reduce/reschedule delta/expected version/key; authorized party | `RoomReservationResponse`; successor/money instruction/current terms | `403`, `409 POLICY_BLOCKED|MINIMUM_BLOCK|VERSION_CONFLICT|ALREADY_FINAL`, `422`, `428`, `429` |
| `POST /internal/v1/room-reservations/{id}/completion-evaluations` | end/provisional window/evidence/no-show state/event key; completion worker | `RoomReservationResponse`; provisional/complete/no-show and harvest eligibility | `403`, `409 EVENT_REUSED|NO_SHOW_RACE`, `429` |
| `POST /api/v1/room-waitlists` | room/use type/slot range/lead time/requester/key; eligible requester | `201 RoomWaitlistResponse`; rank/expiry/notification budget | `403`, `409 DEMAND_DUPLICATE`, `422`, `429` |
| `POST /api/v1/room-waitlist-offers/{id}/responses` | accept/decline/expected version/key; offered requester | `RoomWaitlistOfferResponse`; accepted hold or advanced queue | `403`, `409 OFFER_EXPIRED|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/room-reservation-series` | recurrence/instances/review horizon/exceptions/resources/policy versions/key; holder controller | `201 RoomReservationSeriesResponse`; committed series/instances | `403`, `409 INSTANCE_CONFLICT`, `422 DST_AMBIGUOUS|HORIZON_INVALID`, `429` |
| `POST /api/v1/rooms/{id}/performance-bill-handoffs` | declared venue-pays use/snapshotted room-spec-availability refs/key; authorized venue actor | `201 PerformanceBillHandoffResponse`; immutable Shard-30 handoff | `403`, `409 SNAPSHOT_STALE`, `422 ROOM_HIRE_FIELDS_FORBIDDEN|USE_TYPE_INVALID`, `429` |

## Persistence, RLS and Workers

- Quote, reservation/compound/member, payment compensation, mutation, completion/no-show, waitlist/offer, series/instance and performance handoff rows pin holder, resource, policy, snapshot and provider versions.
- RLS exposes reservations to parties and scoped operators, payment refs to finance services, waitlist rank without claimant identities and Shard-30 handoff only to authorized producer/consumer services.
- Hold/quote/offer expiry, completion, series review and payment compensation workers are idempotent. Transactional outbox keeps resource, reservation and handoff state consistent.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Room-hire quote | `draft → active → accepted|expired|superseded|cancelled` | Full claim/certain calendar/rate/payout/use/policy preflight and timer trigger. Missing mandatory extra or uncertain calendar blocks instant-book quote. |
| Compound reservation | `committing → confirmed|compensating|failed`; confirmed `→ cancelled|reduced|rescheduled|provisional_complete|no_show|complete`; compensation releases every leg | Atomic hold/quote/authority/resources/payment/policy acceptance trigger. Any member failure releases all and names dependency. |
| Reservation mutation | `requested → applied|blocked|stale`; one allowed move appends successor atomically | Pinned policy ladder/released delta/expected version trigger. No partial mutation and stale returns current state/terms. |
| Waitlist/offer | waitlist `active → offered|withdrawn|expired`; offer `pending → accepted|declined|expired`; terminal offer advances queue sequentially | Rank/lead time/timer/requester response trigger. Acceptance creates hold and notifications obey budget. |
| Reservation series | `validating → committed|blocked`; committed `→ active → completed|cancelled|superseded` with explicit exception instances | Every occurrence through horizon/resource policy trigger. Conflict names exact occurrence; trim/split is explicit, never silent partial creation. |
| Performance-bill handoff | `draft → emitted|stale|failed`; emitted is immutable Shard 30 snapshot reference | Declared venue-pays use and exact room/spec/availability snapshots trigger. Room-hire fields/use mismatch block and no dual lifecycle forms. |

Every unlisted transition returns the typed state/version/resource conflict. Operational attendance, money dispute and settlement remain separate.

## Failure, Deepening and Ambiguity Gate

Tests cover instant-book stale calendar, partial resource commit, hidden compensation, partial reschedule, no-show/harvest race, waitlist simultaneous acceptance, notification spam, silent partial series, DST ambiguity and room-hire/performance dual lifecycle. Seven passes converge; two implementers receive identical reservation, series and handoff behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Reservation, series and handoff contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]
- [[specs/ia/deep-dives/29-venues-spaces|Deep Dive 29 — Venues and spaces]]
- [[specs/be/14a-service-listings-quotes-engagements|Service listings, quotes and engagements — Backend Specification]]
- [[specs/be/26a-gear-offers-cart-checkout|Gear offers, cart eligibility and checkout commitment — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]
- [[specs/ia/deep-dives/29-venues-spaces|Deep Dive 29 — Venues, studios and spaces]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/14a-service-listings-quotes-engagements|Service listings, quotes and engagement creation — Backend Specification]]
- [[specs/be/26a-gear-offers-cart-checkout|Gear offers, cart eligibility and checkout commitment — Backend Specification]]
