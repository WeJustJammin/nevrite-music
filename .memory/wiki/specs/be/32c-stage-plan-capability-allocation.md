# Stage plans, input lists, monitors and venue capability allocation — Backend Specification

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

- **Shard split:** 3 of 4; 32.05, 32.06, 32.07, 32.08 and 32.09.
- **Boundary:** structured stage geometry, deterministic input lists, monitor needs, snapshot capability diffs and pooled bill allocation.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 32 IA/deep dive | stage sources/positions, derived channels, monitor semantics and allocation-aware venue diff |
| Shards 24 and 29 | gear manifests/register projections and room specification snapshots |

## Stage and Capability Invariants

- Stage plan stores structured 2D sources/positions/footprints plus optional height. Accessible ordered list editor is canonical; graphical render is derived.
- Geometry conflict names exact items. No map/canvas-only editing or hidden overlap resolution is allowed.
- Input list derives deterministically from pinned plot sources into channels, DI, mic, stand and power rows. Independent source-row edits reject; venue may edit patch column only.
- Monitor needs map channel-to-position mixes and equipment expectations. Relative-level request remains note and is never machine-matched.
- Capability diff pins rider, plot/input, manifest, room spec and bill allocation versions and returns per item `match|shortfall|unknown`, basis, caveats and confidence.
- Stale hard venue field demotes to unknown. Pooled capacity requires explicit per-act allocation version; over-allocation blocks allocation commit, not event.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/production-events/{id}/stage-plans` | sources/positions/footprints/heights/key; act producer | `201 StagePlanResponse`; plan/input version/render hash | `403`, `409 SOURCE_MISSING`, `422 GEOMETRY_INVALID`, `429` |
| `POST /api/v1/stage-plans/{id}/versions` | structured delta/expected version/key; scoped editor | `201 StagePlanResponse`; successor/derived input diff | `403`, `409 VERSION_CONFLICT`, `422 GEOMETRY_INVALID`, `428`, `429` |
| `PATCH /api/v1/stage-input-rows/{id}/venue-patch` | venue patch column/expected version/key; venue production actor | `StageInputRowResponse`; patch-only successor | `403`, `409 VERSION_CONFLICT`, `422 SOURCE_ROW_IMMUTABLE`, `428`, `429` |
| `PUT /api/v1/production-events/{id}/monitor-needs` | position/channel mixes/equipment/notes/expected version/key; authorized act member | `MonitorNeedsResponse`; structured needs/version | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/production-events/{id}/capability-diffs` | rider/plot/input/manifest/room/allocation versions/key; producer | `201 VenueCapabilityDiffResponse`; per-item outcomes/confidence | `403`, `409 SNAPSHOT_MISSING`, `422 SCHEMA_INCOMPATIBLE|ALLOCATION_UNRESOLVED`, `429` |
| `POST /api/v1/production-events/{id}/capability-allocations` | bill/pool/per-act allocations/expected pool version/key; show producer | `201 CapabilityAllocationResponse`; committed allocation/version | `403`, `409 VERSION_CONFLICT`, `422 OVER_ALLOCATION`, `428`, `429` |

## Persistence, RLS and Workers

- Stage plan/source/position versions, derived input rows, venue patch column, monitor needs, capability diff and pool allocation rows pin all source snapshots.
- RLS exposes act requirements to assigned production parties, venue patch to venue crew and private gear/location details only through source grants. Public projections receive none.
- Input derivation, render, diff and allocation notification workers are idempotent; stale hard facts cannot produce false matches.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Stage plan | `draft → active → superseded|frozen`; invalid geometry keeps attempted successor blocked | Act-producer structured source/position/footprint edit triggers. Accessible ordered list is canonical; canvas/render never authors state. |
| Derived input row | immutable derived `active → superseded`; venue patch column has separate `active → superseded` versions | Stage source derivation or venue patch-only command triggers. Independent source-row edit rejects. |
| Monitor needs | `draft → active → superseded|frozen` | Authorized act member channel/position/equipment update triggers. Relative-level note remains human note and never machine-matches. |
| Capability diff | `queued → completed|partial|failed|stale`; each item `match|shortfall|unknown` | Exact rider/plot/input/manifest/room/allocation snapshots trigger. Stale hard venue fact demotes unknown, never match. |
| Capability allocation | `draft → committed|blocked`; committed `→ superseded` | Exact pool/per-act allocation and current pool version trigger. Over-allocation blocks allocation commit, not event. |

Every unlisted transition returns the typed state/version/geometry conflict. Public projections receive no stage/gear/location detail.

## Failure, Deepening and Ambiguity Gate

Tests cover canvas-only source, hidden geometry fix, edited derived channel, venue source mutation, relative-level matching, stale field shortfall, unallocated pool match, over-allocation event cancellation and private manifest leak. Seven passes converge; two implementers receive identical stage and capability behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|---|
| 2026-08-03 | Stage and capability contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]
- [[specs/ia/deep-dives/32-show-production-planning|Deep Dive 32 — Show production planning]]
- [[specs/be/24d-custody-cases-manifests|Gear custody, operational cases, manifests and theft handoff — Backend Specification]]
- [[specs/be/29b-room-specs-accessibility-conformance|Room specifications, gear, accessibility and conformance — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]
- [[specs/ia/deep-dives/32-show-production-planning|Deep Dive 32 — Event production planning and advancing]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/24d-custody-cases-manifests|Gear custody, operational cases, manifests and theft handoff — Backend Specification]]
- [[specs/be/29b-room-specs-accessibility-conformance|Room specifications, gear, accessibility and conformance — Backend Specification]]
