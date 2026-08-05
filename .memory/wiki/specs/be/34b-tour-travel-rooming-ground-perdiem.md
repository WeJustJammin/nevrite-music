# Tour travel, rooming, ground transport and per diem — Backend Specification

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

- **Shard split:** 2 of 4; 34.06, 34.07, 34.08 and 34.09.
- **Boundary:** source-confirmed travel/stays, minimal rooming assignments, advisory ground feasibility and exact per-diem/float obligations without custody fiction.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 34 IA/deep dive | travel facts, rooming privacy, driver/rest feasibility and cash obligations |
| Shards 01 and 33 | person/role authority and show calls/timeline impacts |

## Travel and Per-Diem Invariants

- Travel/accommodation records append only from authorized explicit source confirmation. Platform performs no booking and no silent email ingestion.
- Record pins segment/stay, traveler set, source, cost/currency, cancellation facts and confidence. Ambiguity remains pending.
- Rooming list uses current roster, inventory, person constraints and minimal assignments. Producer sees operational constraints, not sensitive reasons; hotel export is explicit recipient/purpose/time scoped.
- Ground transport pins vehicle, driver, leg, load/call and rest facts and returns feasibility/call impact. No legality claim without authoritative rule profile.
- Driver sees own legs/rest facts, not full roster/finance.
- Per diem/float version derives roster/day eligibility, rate/currency and obligations. Cash assertions are separate; neither obligation nor assertion implies custody, advance or discharge.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/tours/{id}/travel-records` | segment-or-stay/source/travelers/cost/cancellation/key; tour travel actor | `201 TourTravelResponse`; version/confidence | `403 TRAVELER_FORBIDDEN`, `409 RECORD_CONFLICT`, `422 SOURCE_REQUIRED|DATE_INVALID`, `429` |
| `POST /api/v1/tours/{id}/rooming-lists` | roster/inventory/constraints/assignments/key; lodging coordinator | `201 TourRoomingResponse`; minimal assignments/conflicts/version | `403 PII_SCOPE_FORBIDDEN`, `409 CONSTRAINT_CONFLICT`, `422`, `429` |
| `POST /api/v1/tour-rooming-lists/{id}/exports` | hotel recipient/purpose/expiry/key; lodging coordinator | `201 RoomingExportResponse`; scoped artifact/grant | `403`, `409 SOURCE_STALE`, `422 PURPOSE_INVALID`, `429` |
| `POST /api/v1/tours/{id}/ground-transport-evaluations` | vehicle/driver/leg/load-call/rest/profile versions/key; transport coordinator | `201 GroundTransportResponse`; feasibility/call impacts/confidence | `403`, `409 SOURCE_STALE`, `422 INPUT_INCOMPLETE|PROFILE_UNAUTHORED`, `429` |
| `POST /api/v1/tours/{id}/per-diem-versions` | roster/day eligibility/rates/currency/float assertions/expected version/key; finance role | `201 TourPerDiemResponse`; obligations/assertions/version | `403`, `409 VERSION_CONFLICT`, `422 RATE_INVALID`, `428`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Travel or accommodation record | `pending -> confirmed|cancelled`; `confirmed -> cancelled|superseded`; `cancelled -> superseded` | Explicit authorized source confirmation resolves ambiguity; a source correction creates a successor. Pending records cannot drive final itineraries or confirmed totals, and no transition performs a booking. |
| Rooming-list version | `current -> superseded` | A new roster, inventory, constraint or assignment version atomically supersedes the prior immutable projection. Constraint collisions return `409 CONSTRAINT_CONFLICT`; sensitive reasons never enter the operational state. |
| Rooming export grant | `active -> expired|revoked`; `expired -> revoked` | TTL expiry or explicit coordinator revocation disables artifact access. Expired/revoked grants never reactivate; a new purpose-scoped export is required. |
| Ground-transport evaluation | `current -> stale|superseded`; `stale -> superseded` | Any pinned vehicle, driver, leg, call, rest or rule-profile version change marks the result stale; a fresh evaluation supersedes it. Stale or unauthored-profile results cannot support a legality claim. |
| Per-diem version | `current -> superseded` | An expected-version write creates the immutable successor for roster/day/rate/currency changes. Stale writes return `409 VERSION_CONFLICT`; prior obligations and assertions remain auditable. |
| Cash assertion | `recorded -> corrected|disputed`; `disputed -> corrected` | An authorized finance actor appends correction or dispute evidence. No assertion state implies custody, advance, payment or discharge of the separate obligation. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; destructive mutation of immutable records or versions returns `409 IMMUTABLE_RECORD`.

## Persistence, RLS and Workers

- Travel/stay/source/traveler, rooming constraint/assignment/export, vehicle/driver/rest evaluation and per-diem/float obligation/assertion rows pin source and policy versions.
- RLS exposes own travel/room assignment to traveler, operational grid to coordinator, explicit export to hotel, own legs to driver and per-diem finance detail to permitted roles.
- Travel projection, export expiry, transport and per-diem workers are idempotent; no worker books travel, infers sensitive reason or converts obligation into custody.

## Failure, Deepening and Ambiguity Gate

Tests cover silent email ingestion, platform booking claim, sensitive rooming reason leak, broad hotel export, driver roster leak, profileless legality claim, per-diem-as-paid and float-as-custody. Seven passes converge; two implementers receive identical travel, rooming, transport and per-diem behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|---|
| 2026-08-03 | Travel, rooming, transport and per-diem contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/34-touring-operations|Shard 34 — Tour routing, logistics, finance and reporting]]
- [[specs/ia/deep-dives/34-touring-operations|Deep Dive 34 — Touring operations]]
- [[specs/be/01c-relationships-authority-governance|Relationships, authority and governance — Backend Specification]]
- [[specs/be/33b-run-of-show-crew-credentials|Run of show, crew calls and credentials — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/34-touring-operations|Shard 34 — Tour routing, logistics, finance and reporting]]
- [[specs/ia/deep-dives/34-touring-operations|Deep Dive 34 — Tour routing, logistics, finance and reporting]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/33b-run-of-show-crew-credentials|Run of show, crew calls and credentials — Backend Specification]]
