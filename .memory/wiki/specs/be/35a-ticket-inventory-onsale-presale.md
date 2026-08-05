# Ticket inventory, manifests, on-sale and presale — Backend Specification

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

- **Shard split:** 1 of 5; 35.01, 35.02, 35.03, 35.04, 35.05, 35.06 and 35.07.
- **Boundary:** scaling/manifest authority, fee parity, DST-safe schedules, source-pool presales/codes and neutral reconnectable queues.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 35 IA/deep dive | capacity scaling, manifest lock, fees, schedules, presales and queues |
| Shards 29, 30 and 31 | room capacity, announcement authority and settlement economics |

## Inventory and On-Sale Invariants

- Scaling pins show/room configuration, currency, ticket types, shared variants, tiers and limits. Reserved seats are unit-addressable; GA uses serializable quantity journal.
- Concession variant changes price/eligibility, never capacity block. Scaling cannot exceed current room capacity.
- Manifest lock reconciles sellable, held, killed and accessible/protected stock exactly. Accessible stock has direct parity and is never hidden behind support path.
- Contract-derived hold edit creates Shard 30 amendment request; local override cannot silently contradict contract.
- Fee version exposes exact all-in calculation and parity. Mid-sale increase is blocked for active holds/carts.
- Announce/on-sale requires Shard 30 authorization and fully locked manifest. Venue-local wall time plus timezone resolves to UTC jobs; DST gap rejects.
- Presale allocates real source-pool units. Code redemption atomically checks eligibility/use count and reserves from exact pool; invalid and exhausted are distinct.
- Queue position is randomized neutral with reconnect token, no role priority and no duplicate fan/session positions.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/shows/{id}/ticket-scalings` | room config/currency/types/variants/tiers/limits/expected version/key; settlement authority | `201 TicketScalingResponse`; version/capacity totals | `403`, `409 VERSION_CONFLICT`, `422 CAPACITY_EXCEEDED|CURRENCY_MISMATCH|TIER_INVALID`, `428`, `429` |
| `POST /api/v1/ticket-scalings/{id}/manifest-locks` | blocks/holds/kills/protected stock/deadlines/key; manifest authority | `201 TicketManifestResponse`; locked balanced version | `403`, `409 MANIFEST_UNBALANCED`, `422 ACCESSIBLE_PARITY_FAILED|HOLD_DEADLINE_MISSING`, `429` |
| `POST /api/v1/ticket-manifests/{id}/fee-versions` | fee lines/all-in calculation/effective time/expected version/key; settlement authority | `201 TicketFeeResponse`; exact all-in/version | `403`, `409 ACTIVE_CART_PRICE_LOCK|VERSION_CONFLICT`, `422 PARITY_VIOLATION`, `428`, `429` |
| `POST /api/v1/ticket-manifests/{id}/sale-schedules` | announcement auth/local times/timezone/windows/expected version/key; operator | `201 TicketSaleScheduleResponse`; local/UTC jobs/version | `403`, `409 MANIFEST_UNLOCKED|VERSION_CONFLICT`, `422 DST_NONEXISTENT`, `428`, `429` |
| `POST /api/v1/ticket-manifests/{id}/presales` | source pool/window/allocation/eligibility/code policy/key; operator | `201 TicketPresaleResponse`; reserved allocation/version | `403`, `409 INVENTORY_OVERLAP`, `422`, `429` |
| `POST /api/v1/ticket-presales/{id}/code-redemptions` | fan/code/requested units/key; eligible fan | `201 PresaleCodeResponse`; eligibility/use/cart-source reservation | `403 CODE_INVALID`, `409 ALLOCATION_EXHAUSTED|USE_LIMIT`, `422`, `429` |
| `POST /api/v1/ticket-sales/{id}/queue-entries` | fan/session/reconnect proof/key; eligible fan | `201 TicketQueueResponse`; neutral position/reconnect token | `403`, `409 DUPLICATE_POSITION`, `422`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Ticket scaling version | `current -> superseded` | An expected-version write creates the immutable successor and atomically supersedes the prior scaling. Capacity, currency or tier violations block creation; superseded scalings cannot receive new manifest locks. |
| Ticket manifest | `draft -> locked`; `locked -> superseded` | A balanced stock reconciliation with accessible parity locks the exact version; a new approved scaling/manifest creates a successor. Unbalanced or contract-conflicting stock returns the named `409|422` and never partially locks. |
| Fee version | `scheduled -> effective|cancelled`; `effective -> superseded` | Effective time activates the exact all-in calculation; an authorized successor supersedes it for future buyers. Active holds/carts retain their pinned version and block a mid-sale increase with `409 ACTIVE_CART_PRICE_LOCK`. |
| Sale schedule | `scheduled -> announced -> on_sale -> closed`; `scheduled|announced -> cancelled` | UTC jobs derived from valid venue-local time advance each window after authorization and manifest lock checks. Missing authorization, unlocked manifest or nonexistent DST time blocks scheduling; cancelled/closed schedules do not reopen. |
| Presale | `scheduled -> open -> exhausted|closed`; `scheduled|open -> cancelled` | Window jobs open/close the exact source-pool allocation; atomic redemptions may exhaust it. Closed, cancelled or exhausted presales reject new reservations without consuming a code use. |
| Presale code | `active -> exhausted|expired|revoked`; `exhausted|expired|revoked -> active` is forbidden | Each successful atomic reservation increments governed use count; limit, window expiry or operator revocation ends eligibility. Invalid and exhausted outcomes remain distinct and never decrement inventory. |
| Queue entry | `waiting -> admitted|expired|left`; `admitted -> consumed|expired` | Neutral randomized admission or TTL advances a unique fan/session position; reconnect preserves the same entry. Duplicate positions return `409 DUPLICATE_POSITION`, and terminal entries never regain priority. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; destructive mutation of locked inventory journals or immutable versions returns `409 IMMUTABLE_TICKETING_FACT`.

## Persistence, RLS and Workers

- Scaling/type/variant/tier, manifest block/pool/seat/quantity journal, fee, schedule job, presale/code redemption and queue rows pin source and policy versions.
- RLS exposes public sale facts, eligible window/code outcome to fan and exact inventory/admin state to ticketing roles. Queue internals and fan identities remain private.
- Schedule, code, queue and inventory workers are idempotent; every release returns units to exact source pool.

## Failure, Deepening and Ambiguity Gate

Tests cover capacity overrun, concession capacity duplication, inaccessible accessible stock, contract hold override, hidden fee, mid-cart increase, DST coercion, overlapping presales, code-error collapse, role queue priority and duplicate queue entry. Seven passes converge; two implementers receive identical ticket inventory and on-sale behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|---|
| 2026-08-03 | Ticket inventory and on-sale contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
- [[specs/ia/deep-dives/35-ticket-products-sales|Deep Dive 35 — Ticket products and sales]]
- [[specs/be/29a-place-room-authority-status|Place and room identity, authority and status — Backend Specification]]
- [[specs/be/30c-booking-documents-payments-announcement|Booking announcement, documents, amendments and payment assertions — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
- [[specs/ia/deep-dives/35-ticket-products-sales|Deep Dive 35 — Ticket products, sales, access packages and delivery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/29a-place-room-authority-status|Place and room identity, authority and status — Backend Specification]]
- [[specs/be/30c-booking-documents-payments-announcement|Booking announcement, documents, amendments and payment assertions — Backend Specification]]
