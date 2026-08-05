# Room specifications, gear, accessibility and conformance — Backend Specification

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

- **Shard split:** 2 of 4; 29.05, 29.06, 29.07, 29.08, 29.09 and 29.21.
- **Boundary:** typed room facts, provisioned gear projections, attributed evidence, route-specific accessibility, immutable corrections/contests and rider conformance.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 29 IA/deep dive | field authority, evidence provenance, accessibility routes and conformance evaluation |
| Shards 06 and 24 | contest handling and disclosure-safe gear register projections |

## Room Truth Invariants

- Every specification field revision is immutable, typed and attributed with source, age, caveats, condition and completeness tier. Malformed/impossible values reject; contradictions coexist visibly until resolved.
- Commercial terms and statutory declarations require operator/qualified authority and never community-overwrite. Safe configured factual fields may auto-apply only with preserved prior revision.
- Gear provision references an authorized Shard 24 register projection and states provision posture plus available identity/count. Missing authority or composed exposure risk suppresses detail rather than inventing availability.
- First-hand/operator evidence attaches to checklist purpose and field. Safety/privacy removal is allowed; accurate but unflattering evidence becomes a contest, not erasure.
- Accessibility separates audience and performer routes, segment caveats, source, freshness and temporary impairment override. Unknown is explicit; no aggregate binary `accessible` claim is inferred.
- Rider comparison pins rider/spec/event-condition snapshots and returns per-field `match|unknown|conflict`, confidence and reasons. Stale/unsupported becomes unknown, never false conflict.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/rooms/{id}/spec-revisions` | field/typed value/caveats/condition/source evidence/schema version/key; actor authorized by field class | `201 RoomSpecRevisionResponse`; revision/completeness/freshness/contest | `403 SOURCE_FORBIDDEN`, `409 VERSION_CONFLICT`, `422 FIELD_UNKNOWN|VALUE_INVALID`, `429` |
| `PUT /api/v1/rooms/{id}/gear-provision` | Shard-24 register projection/provision posture/authority versions/key; room operator | `RoomGearProvisionResponse`; public-safe identity/count/freshness | `403`, `409 SOURCE_STALE`, `422 DISCLOSURE_AUTHORITY_REQUIRED|EXPOSURE_RISK`, `429` |
| `POST /api/v1/rooms/{id}/evidence` | checklist slot/field/media-or-text/source/first-hand attestation/key; contributor | `201 RoomEvidenceResponse`; attached/review state/provenance | `403`, `409 DUPLICATE_EVIDENCE`, `422`, `429` |
| `GET /public/rooms/{id}/accessibility` | audience/performer route and effective time | `RoomAccessibilityResponse`; segments/caveats/unknowns/overrides/freshness | `404`, `429`, `503` |
| `POST /api/v1/rooms/{id}/accessibility-overrides` | route segment/impairment interval/source/evidence/key; authorized operator or qualified source | `201 AccessibilityOverrideResponse`; effective override/notices | `403`, `409 INTERVAL_CONFLICT`, `422`, `429` |
| `POST /api/v1/room-spec-revisions/{id}/contests` | challenger source/reason/evidence/key; eligible actor | `201 RoomFieldContestResponse`; visible revision/case/review state | `403`, `409 CONTEST_EXISTS`, `422`, `429` |
| `POST /api/v1/room-conformance-evaluations` | rider version/room spec version/event conditions/key; authorized requester/operator | `201 RoomConformanceResponse`; summary/per-field refs/confidence | `403`, `409 SNAPSHOT_MISSING`, `422 SCHEMA_INCOMPATIBLE`, `429` |

## Persistence, RLS and Workers

- Spec field revisions, evidence/checklist links, gear projection refs, accessibility route/override and conformance runs pin source, actor, schema and snapshot versions.
- RLS exposes public-safe facts/access routes publicly, operator detail to room operators, community contributors pseudonymously and raw evidence to operator/case reviewers only. Private register facts remain in Shard 24.
- Freshness, moderation, accessibility notice and conformance workers are idempotent; projections never strengthen source confidence or authority.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Room spec revision | immutable `active|contested`; active/contested `→ superseded|removed_for_safety_privacy`; freshness may become `stale` | Typed attributed field evidence and authorized field class trigger. Contradictions coexist; community cannot overwrite commercial/statutory authority. |
| Gear provision projection | `pending → active|suppressed|stale`; active `→ suppressed|stale|superseded` | Authorized Shard 24 register/provision posture and exposure check trigger. Missing disclosure or composed risk suppresses detail, never invents availability. |
| Room evidence | `submitted → attached|review_required|rejected`; attached `→ contested|removed_for_safety_privacy|superseded` | Purpose/field/source evidence moderation trigger. Accurate unflattering evidence contests, not erases. |
| Accessibility route/override | route facts `known|unknown|stale|conflicting`; temporary override `scheduled → active → expired|revoked` | Audience/performer segment evidence/effective interval trigger. No binary accessible state is inferred and routes remain separate. |
| Rider conformance | `queued → completed|partial|failed|stale`, each field `match|unknown|conflict` | Exact rider/spec/event-condition snapshots trigger. Stale/unsupported yields unknown, never false conflict. |

Every unlisted transition returns the typed state/version/schema conflict. Projections never strengthen source confidence or reveal private register facts.

## Failure, Deepening and Ambiguity Gate

Tests cover impossible typed value, community commercial overwrite, provision without grant, private gear leak, unflattering-evidence deletion, binary accessibility, audience/performer collapse, map-only evidence, stale false conflict and hidden field contest. Seven passes converge; two implementers receive identical room truth, accessibility and conformance behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Room truth and conformance contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]
- [[specs/ia/deep-dives/29-venues-spaces|Deep Dive 29 — Venues and spaces]]
- [[specs/be/06a-case-intake-evidence|Case intake and evidence — Backend Specification]]
- [[specs/be/24c-organization-register-backline|Organization gear register and public backline — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]
- [[specs/ia/deep-dives/29-venues-spaces|Deep Dive 29 — Venues, studios and spaces]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/24c-organization-register-backline|Organization asset registers, condition and public backline — Backend Specification]]
