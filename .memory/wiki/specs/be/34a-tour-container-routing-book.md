# Tour containers, dates, routing and tour books — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/34-touring-operations|Shard 34 — Tour routing, logistics, finance and reporting]]  
**Deep Dive:** [[specs/ia/deep-dives/34-touring-operations|Touring operations deep dive]]

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

- **Shard split:** 1 of 4; 34.01, 34.02, 34.03, 34.04 and 34.05.
- **Boundary:** tour/date identity, co-headline shared-cost instruments, route-leg feasibility and recipient-scoped tour-book delivery.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 34 IA/deep dive | tour ownership, date types, shared allocation, route risk and tour-book projection |
| Shards 29, 30 and 33 | venue/show dates, accepted booking and show-day operational sources |

## Tour and Routing Invariants

- Tour is primary-act-owned container with append-only participant/date links. One-off show may remain standalone; system never forces a tour.
- Ordered date is `show|hold|travel|off|rehearsal|other` with constraints and cost scope. Conflicting primary ownership rejects while linked participants retain own-tour authority.
- Shared co-headline cost requires binding allocation instrument accepted by linked tours. Each budget records source-linked portion and never duplicates invoice truth; missing approval remains unallocated.
- Route evaluation pins adjacent date/load windows, transport, driver/rest facts and authored rule profile. Returns ranges, rest and humane-risk with confidence; unknown profile returns facts only and no legality claim.
- Ordered-list route/tour-book alternative is canonical alongside optional maps. Gaps and uncertainty remain explicit.
- Tour book pins exact sources and recipient projection, renders accessible artifact/live link/offline bundle, and old versions announce supersession.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/tours` | owner/participants/optional dates/key; primary-act authority | `201 TourResponse`; container/version | `403`, `409 OWNER_CONFLICT`, `422`, `429` |
| `POST /api/v1/tours/{id}/versions` | participant/date deltas/order/expected version/key; tour owner | `201 TourResponse`; successor/conflicts | `403`, `409 DATE_CONFLICT|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/tour-shared-cost-allocations` | linked tours/date/invoice ref/allocation/approvals/key; binding tour actors | `201 SharedTourCostResponse`; allocated/unallocated version | `403`, `409 APPROVAL_INCOMPLETE`, `422 TOTAL_INVALID`, `429` |
| `POST /api/v1/tours/{id}/route-evaluations` | adjacent date versions/load windows/vehicle-driver-rest/profile/key; tour operator | `201 TourRouteEvaluationResponse`; ranges/rest/risk/confidence | `403`, `409 SOURCE_STALE`, `422 INPUT_INCOMPLETE|PROFILE_UNAUTHORED|RANGE_INVALID`, `429` |
| `POST /api/v1/tours/{id}/tour-books` | source versions/recipient role/offline posture/key; tour operator | `201 TourBookResponse`; version/artifact/live/offline refs/gaps | `403 PROJECTION_FORBIDDEN`, `409 SOURCE_VERSION_MISSING`, `422`, `429` |
| `POST /api/v1/tour-books/{id}/supersessions` | successor sources/reason/key; tour operator | `TourBookResponse`; successor/old-link notice | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Tour container | `active -> closed`; `closed -> active` | Owner closes or explicitly reopens the container. Closing preserves every participant/date version and blocks new versions until reopen; deleting a tour with linked dates, costs or books is forbidden. |
| Tour version | `current -> superseded` | A successful expected-version write creates the immutable successor and atomically supersedes the prior version. Stale writes return `409 VERSION_CONFLICT`; superseded versions never become current again. |
| Tour date link | `planned -> confirmed|cancelled`; `confirmed -> changed|cancelled`; `changed -> confirmed|cancelled` | An authorized tour-version delta records the next append-only date state. Primary-owner conflicts return `409 DATE_CONFLICT`; cancellation preserves the linked source and cost scope. |
| Shared cost allocation | `unallocated -> pending_approval -> allocated`; `pending_approval -> unallocated` | Complete linked-tour approvals atomically allocate the exact invoice portion; withdrawal or rejection returns it to unallocated. Missing approvals return `409 APPROVAL_INCOMPLETE`; allocated portions are corrected only by a new instrument. |
| Route evaluation | `current -> stale|superseded`; `stale -> superseded` | Any pinned date, load-window, vehicle, driver, rest or rule-profile change marks the evaluation stale; a new evaluation supersedes it. Stale evaluations remain historical and cannot support a current feasibility claim. |
| Tour book | `rendering -> current|failed`; `current -> superseded|expired|revoked`; `failed -> rendering` | Rendering commits the exact source/recipient projection before publication. Supersession, grant expiry or explicit revocation blocks old offline/live access and surfaces the successor notice; retry requires the same committed key or a new version. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; destructive mutation of immutable versions returns `409 IMMUTABLE_VERSION`.

## Persistence, RLS and Workers

- Tour/version/date/participant, shared allocation/invoice refs, route evaluation and tour-book projection/artifact/offline-grant rows pin actor and source versions.
- RLS exposes container/date to scoped participants, shared instruments only to linked tours/finance, and recipient-minimized tour books. High-PII offline artifacts show owner/version/expiry and revoke/report-loss path.
- Route, allocation, rendering, expiry and supersession workers are idempotent; derived feasibility never mutates source dates.

## Failure, Deepening and Ambiguity Gate

Tests cover forced one-off tour, primary-owner conflict, duplicate invoice cost, unapproved allocation, unknown-profile legality claim, map-only routing, hidden gap, stale offline artifact and silent supersession. Seven passes converge; two implementers receive identical tour, routing and tour-book behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Tour, routing and tour-book contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/34-touring-operations|Shard 34 — Tour routing, logistics, finance and reporting]]
- [[specs/ia/deep-dives/34-touring-operations|Deep Dive 34 — Touring operations]]
- [[specs/be/30b-booking-offers-approval-acceptance|Booking offers, counters, approvals and confirmation — Backend Specification]]
- [[specs/be/33b-run-of-show-crew-credentials|Run of show, crew calls and credentials — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/34-touring-operations|Shard 34 — Tour routing, logistics, finance and reporting]]
- [[specs/ia/deep-dives/34-touring-operations|Deep Dive 34 — Tour routing, logistics, finance and reporting]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/30b-booking-offers-approval-acceptance|Booking offers, counters, approvals and confirmation — Backend Specification]]
- [[specs/be/33b-run-of-show-crew-credentials|Run of show, crew calls and credentials — Backend Specification]]
