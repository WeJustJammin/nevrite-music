# Run of show, crew calls and credentials — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/33-show-day-operations|Shard 33 — Show-day execution and recovery]]  
**Deep Dive:** [[specs/ia/deep-dives/33-show-day-operations|Show-day operations deep dive]]

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

- **Shard split:** 2 of 4; 33.05, 33.06, 33.07, 33.08, 33.09 and 33.10.
- **Boundary:** source-derived timelines, live slippage/curfew risk, role calls, advisory credentials and external local-crew linkage.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 33 IA/deep dive | run derivation, mutation cascades, curfew ranges, crew conflicts and passes |
| Shards 14, 29 and 32 | external engagements, venue areas/constraints and frozen advance sources |

## Timeline, Crew and Access Invariants

- Run of show derives from frozen plan, bill, calls and constraints. Every item has owner/source and uncertainty; missing source creates gap, never invented time.
- Server timeline version determines operational order. Device time is evidence only; stale client replays against canonical timeline with visible cascade preview.
- Live slippage commits only after authorized owner accepts affected-time cascade. Curfew margin is `breach|tight|clear|unknown` over duration range with provenance; stale/unknown constraint never returns clear.
- Crew roster derives per-role calls from accepted engagements/schedule and names one-person/multiple-role overlap. Crew sees own call/pass/day-sheet projection, not full contact graph.
- Credential is advisory version bound to event/person/role/venue-area map. Role/area change supersedes prior pass; name/code fallback exists when camera/QR is inaccessible.
- Local crew entry references accepted Shard 14 engagement, role, call and payment ref; it creates no duplicate hiring/payment lifecycle.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/show-events/{id}/timelines` | frozen plan/bill/calls/constraints/source versions/key; show producer | `201 RunOfShowResponse`; items/gaps/uncertainty/curfew | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/show-timelines/{id}/mutations` | item/actual-or-estimate/cascade acceptance/expected version/key; item owner | `201 RunOfShowResponse`; successor/cascade/curfew margin | `403 OWNER_REQUIRED`, `409 VERSION_CONFLICT`, `422 CURFEW_BREACH_UNACKNOWLEDGED`, `428`, `429` |
| `POST /api/v1/show-events/{id}/crew-rosters` | engagements/roles/schedule/source versions/key; producer | `201 ShowCrewRosterResponse`; calls/conflicts/version | `403`, `409 SOURCE_STALE`, `422 ROLE_CONFLICT`, `429` |
| `POST /api/v1/show-events/{id}/credentials` | person/role/areas/roster+map versions/key; access issuer | `201 ShowCredentialResponse`; advisory pass/version/fallback code | `403`, `409 ROLE_STALE`, `422 ROSTER_REQUIRED|AREA_FORBIDDEN`, `429` |
| `POST /api/v1/show-credentials/{id}/supersessions` | new role/areas/source versions/key; access issuer | `ShowCredentialResponse`; superseded/successor | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/show-events/{id}/local-crew-links` | Shard-14 engagement/person/role/call/payment ref/key; producer | `201 LocalCrewLinkResponse`; linked roster row | `403`, `409 LINK_EXISTS`, `422 ENGAGEMENT_REQUIRED`, `429` |

## Persistence, RLS and Workers

- Timeline/item/source, mutation/cascade, curfew evaluation, crew roster/call/conflict, credential/supersession and external engagement-link rows pin source versions.
- RLS exposes full timeline/roster to production operators, each crew member's projection to that member, and credential lookup minimum fields to access staff. Payment refs stay opaque.
- Timeline, curfew, roster, pass invalidation and notification workers are idempotent; stale device events cannot reorder canonical state.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Run-of-show timeline | `draft → active → superseded|completed`; mutation `pending → applied|blocked|stale` with visible cascade | Frozen plan/bill/calls/constraints and item-owner accepted cascade trigger. Server version controls order; stale device evidence cannot reorder. |
| Curfew margin | immutable evaluation `breach|tight|clear|unknown`; current `→ stale|superseded` | Duration range/constraint provenance trigger. Stale/unknown constraint never returns clear. |
| Crew roster/call | roster `draft → active → superseded`; call `scheduled → acknowledged|changed|cancelled|completed` | Accepted engagements/schedule/role derivation trigger. Multiple-role overlap remains named and no duplicate hiring/payment lifecycle forms. |
| Credential | `issued → active → superseded|revoked|expired`; inaccessible scanner uses name/code fallback without state change | Exact event/person/role/area map trigger. Role/area change supersedes; pass remains advisory. |
| Local crew link | `pending → linked|blocked|superseded` | Accepted Shard 14 engagement/role/call/payment opaque ref trigger. Missing engagement blocks. |

Every unlisted transition returns the typed state/version/timeline conflict. Crew sees own call/pass/day sheet, not full contact graph.

## Failure, Deepening and Ambiguity Gate

Tests cover invented timeline, device-clock ordering, silent cascade, stale curfew clear, hidden role conflict, full-roster crew leak, inaccessible QR-only credential, stale pass and duplicate local hiring. Seven passes converge; two implementers receive identical timeline, crew and credential behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Run-of-show, crew and credential contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/33-show-day-operations|Shard 33 — Show-day execution and recovery]]
- [[specs/ia/deep-dives/33-show-day-operations|Deep Dive 33 — Show-day operations]]
- [[specs/be/14a-service-listings-quotes-engagements|Service listings, quotes and engagements — Backend Specification]]
- [[specs/be/32d-advance-checklist-freeze|Production advance checklist, sheets and freeze control — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/33-show-day-operations|Shard 33 — Show-day execution and recovery]]
- [[specs/ia/deep-dives/33-show-day-operations|Deep Dive 33 — Show-day execution and recovery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/14a-service-listings-quotes-engagements|Service listings, quotes and engagement creation — Backend Specification]]
- [[specs/be/32d-advance-checklist-freeze|Production advance checklist, sheets and freeze control — Backend Specification]]
