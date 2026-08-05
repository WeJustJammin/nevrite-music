# Gear service, repair and component history — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear provenance registry]]  
**Deep Dive:** [[specs/ia/deep-dives/23-gear-provenance-registry|Gear provenance deep dive]]

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

- **Shard split:** 3 of 4; GPR-11 and GPR-12.
- **Boundary:** append-only service facts from completed work orders and manual component modifications with originality provenance.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 23 IA/deep dive | service/component continuity algorithm |
| Shard 14 | completed repair/service work, parts, measurements and owner approval |

## Service and Component Invariants

- Completed Shard 14 work order or owner manual declaration creates service event; corrections supersede and never destructively edit.
- Event pins gear/config version, work, provider, parts, measurements, evidence and owner approval where provider-originated.
- Manual modification identifies component removal/replacement and originality source without claiming whole-item originality.
- Removing serial-bearing component preserves original identity history and appends replacement/component identity fact; it never rewrites item origin.
- No recorded service history means “no history recorded,” never “never serviced.”
- Service fact is evidence, not warranty, condition guarantee, title proof or insurer acceptance.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /internal/v1/gear-service-events/from-work-order` | completed Shard 14 job/gear/config/parts/measurements/approval/event; worker/key | `201 GearServiceEventResponse`; append-only event | `403`, `409 EVENT_REUSED|SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/gear-records/{id}/manual-modifications` | component/removal/replacement/originality/evidence; owner/key | `201 ComponentFactResponse`; component/version | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/gear-service-events/{id}/corrections` | corrected facts/reason/source refs; author/key | `201 GearServiceEventResponse`; successor/diff | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /api/v1/gear-records/{id}/service-history` | viewer scope/cursor | `GearServiceHistoryResponse`; evidence-labelled history/gaps | `403`, `404`, `429`, `503` |

## Persistence, RLS and Workers

- `service_event`, `component_fact` and supersession links retain immutable gear/config/work/evidence versions.
- RLS exposes full evidence to owner/provider, bounded history under owner visibility and private measurements/documents only to authorized viewers.
- Work-order consumer is idempotent and cannot create service fact before terminal completed/approved source state.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Service event | immutable `recorded`; current representation `→ superseded` by correction | Terminal completed/approved Shard 14 work order or owner manual declaration triggers. Incomplete job/source-stale blocks and correction never edits prior event. |
| Component fact | immutable `installed|removed|replaced|modified`; later physical change appends successor relation | Owner declaration/evidence triggers. Serial-bearing replacement preserves original item/component identity history and cannot rewrite origin. |
| Service-history projection | `current → stale|suppressed`; stale `→ current` after authorized rebuild | Source/visibility/retention change triggers. Empty projection states “no history recorded,” never “never serviced.” |

Every unlisted transition returns the typed state/version/source conflict. Service facts never imply warranty, condition, title or insurer acceptance.

## Failure, Deepening and Ambiguity Gate

Tests cover incomplete job, destructive correction, whole-item originality claim, serial-component rewrite, no-history inference, warranty/condition/title implication and evidence leakage. Seven passes converge; two implementers receive identical service-history behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Service/component history authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear provenance registry]]
- [[specs/ia/deep-dives/23-gear-provenance-registry|Deep Dive 23 — Gear provenance]]
- [[specs/be/14e-repair-inspection-custody|Repair, inspection, custody and damage evidence — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear identity, provenance and recovery]]
- [[specs/ia/deep-dives/23-gear-provenance-registry|Deep Dive 23 — Gear identity, provenance and recovery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/14e-repair-inspection-custody|Repair, inspection, custody and damage evidence — Backend Specification]]
