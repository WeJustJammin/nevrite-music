# Release composition, readiness, footprint, dates and identifiers — Backend Specification

**Status:** Complete; partner delivery disabled  
**IA Source:** [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]  
**Deep Dive:** [[specs/ia/deep-dives/22-release-distribution|Release distribution deep dive]]

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

- **Shard split:** 1 of 4; DST-01, DST-02, DST-03, DST-04, DST-05, DST-06 and DST-07.
- **Boundary:** release composition, destination validation/rendering, asset conformance, social readiness, exact territory footprint, owner-chosen dates and immutable identifiers.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 22 IA/deep dive | build/readiness, footprint/date and identifier algorithms |
| Shards 01, 02, 09, 10 and 20 | identity/credits, recordings/assets, rights/territories and licensed inclusions |

## Build and Readiness Invariants

- Release contains recordings/licensed inclusions, not files. Membership, order, release type, volume, focus, gapless and licence-expiry obligations are release facts; recording metadata remains canonical upstream.
- Destination validation projects canonical snapshot through immutable partner-knowledge version. Per-store rendering never rewrites canonical metadata.
- Asset source is immutable with explicit recording mapping. Analysis yields `conformant|unverified|blocked|unanalysable`; after three failures it never false-passes.
- Readiness first resolves machine preconditions, then rights/consent/conflict/third-party chase list with named actor/action/deadline. Override changes delivery decision only, never source record.
- Master consent/conflict and third-party clearance block. Publishing percentage dispute may ship only where source policy permits held accounting evidence.
- Footprint is per recording×explicit country×commercial model×destination from complete rights/profile capability; unresolved rights never default worldwide.
- Delivery, release, live, original-release and first-live dates are distinct. Owner chooses territory-scoped date after costed windows/forfeits; system never preselects or automatically moves announced date.
- ISRC is one per recording forever; UPC is release-scoped. Assignment is atomic/idempotent, survives failed delivery and reconciles ambiguity by lookup before another allocation.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/releases` | recordings/licensed inclusions/order/type/volume/focus/gapless; owner/key | `201 ReleaseResponse`; draft/version | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/releases/{id}/versions` | membership/order/settings/source versions; owner ETag/key | `201 ReleaseResponse`; successor/diff | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/releases/{id}/destination-validations` | destinations/profile knowledge versions; owner/key | `202 DestinationValidationResponse`; findings/renderings | `403`, `409 SOURCE_STALE`, `422`, `429`, `503` |
| `POST /api/v1/release-assets/preflights` | immutable source/mapping/target specs/checksum; producer/key | `AssetConformanceResponse`; target states/jobs | `403`, `409`, `422`, `429` |
| `POST /api/v1/releases/{id}/readiness-evaluations` | target set/source/profile/policy versions; owner/key | `ReleaseReadinessResponse`; machine/social/chase states | `403`, `409 SOURCE_STALE`, `422`, `429`, `503` |
| `POST /api/v1/releases/{id}/readiness-overrides` | affected target/reason/authority/version; owner/key | `ReleaseReadinessResponse`; explicit override | `403`, `409 VERSION_CONFLICT`, `422 OVERRIDE_NOT_ALLOWED`, `428`, `429` |
| `POST /api/v1/releases/{id}/destination-footprints` | recordings/countries/models/destinations/rights versions; owner/key | `DestinationFootprintResponse`; exact allowed/blocked/unknown | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/releases/{id}/date-plans` | footprint/partner windows/editorial/pre-save/costs; owner/key | `201 ReleaseDatePlanResponse`; owner-selected dates | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/releases/{id}/identifier-assignments` | recording/release/registrant/year/policy versions; owner/key | `202 IdentifierAssignmentResponse`; ISRC/UPC records | `403`, `409 IDENTIFIER_CONFLICT`, `422`, `429`, `503 ALLOCATION_UNKNOWN` |
| `POST /internal/v1/identifier-assignments/{id}/reconcile` | registry lookup/evidence/event; worker/key | `IdentifierAssignmentResponse`; assigned/conflict | `403`, `409 EVENT_REUSED`, `422`, `429` |

## Persistence, RLS and Workers

- `release`, immutable versions/memberships, `asset_conformance`, `release_readiness`, `destination_footprint`, `release_date_plan` and `identifier_assignment` pin all source/profile/policy versions.
- Unique constraints enforce recording/ISRC and release/UPC identity; supplied IDs are assertions until verified.
- RLS exposes release/build to project participants, chase items only to named actor/owner, private rights findings to mandate holders and identifiers to authorized catalogue parties.
- Validation/conformance/identifier workers are deterministic and idempotent. Rights drift invalidates readiness before dispatch.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Release | `draft → building → ready|blocked`; ready `→ scheduled|delivery_pending`; any mutable state `→ superseded|cancelled` | Owner version/build/readiness command triggers. Recording metadata stays upstream; source/right/profile drift invalidates readiness before dispatch. |
| Release asset conformance | `queued → analysing → conformant|unverified|blocked|unanalysable`; failed analysis retries three times then remains unverified/unanalysable | Immutable source/mapping/checksum and deterministic analyser trigger. Failure never false-passes or rewrites canonical media. |
| Readiness evaluation | `evaluating → ready|blocked|unknown`; result `→ stale|superseded` | Machine checks then named rights/consent/conflict/clearance chase fold trigger. Override changes delivery decision only and cannot alter source truth or bypass master/third-party blocks. |
| Destination footprint | immutable per recording/country/model/destination `allowed|blocked|unknown`; current `→ stale|superseded` | Complete rights/profile capability fold triggers. Missing/unresolved rights never default worldwide. |
| Release date plan | `draft → owner_selected → announced`; announced `→ superseded|cancelled` only by explicit owner plan | Costed windows/forfeits and owner command trigger. System never preselects or auto-moves an announced date. |
| Identifier assignment | `requested → pending_lookup → assigned|conflict|unknown`; unknown `→ assigned|conflict` by reconciliation | Atomic registry allocation/assertion lookup triggers. Failed delivery preserves ID; ambiguity must lookup before another allocation. |

Every unlisted transition returns the typed state/version/source conflict. Private chase and rights details remain mandate scoped.

## Failure, Deepening and Ambiguity Gate

Tests cover file-as-release, canonical mutation, asset false pass, unnamed blocker, override source mutation, worldwide fallback, automatic date move, duplicate ISRC and failed-delivery ID loss. Seven passes converge; two implementers receive identical build/readiness behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Release build/readiness contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]
- [[specs/ia/deep-dives/22-release-distribution|Deep Dive 22 — Release distribution]]
- [[specs/be/09d-sessions-delivery-readiness|Project sessions, delivery, QC and readiness — Backend Specification]]
- [[specs/be/10e-identifiers-registration-evidence|Identifiers, registration and evidence — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]
- [[specs/ia/deep-dives/22-release-distribution|Deep Dive 22 — Release and distribution lifecycle]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/09d-sessions-delivery-readiness|Project sessions, delivery, QC and readiness — Backend Specification]]
- [[specs/be/10e-identifiers-registration-evidence|Rights identifiers, registration and evidence export — Backend Specification]]
