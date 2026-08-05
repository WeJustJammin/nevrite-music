# Show safety evidence, weather decisions and post-show corrections — Backend Specification

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

- **Shard split:** 4 of 4; 33.14, 33.15, 33.16, 33.17 and 33.18.
- **Boundary:** requirement/evidence tracking, advisory weather monitoring, human operational decisions, governed post-show reports and source-domain correction suggestions.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 33 IA/deep dive | safety evidence, weather uncertainty, decision authority, report locks and correction routing |
| Shards 06, 29 and 32 | evidence escalation and provenance-preserving venue/production corrections |

## Safety and Recovery Invariants

- Safety requirement pins event/venue/jurisdiction/source/date, responsible role, presence, date-validity and acceptance evidence. Platform never emits blanket `compliant` status.
- Weather monitoring is advisory with provider/source time, thresholds, named decision chain and `known|unknown` state. Provider outage marks unknown and never implies safe.
- Proceed/modify/pause/cancel is authorized-human decision with reason/evidence and affected-party notifications. System cannot decide or fabricate acceptance.
- Post-show report separates factual and judgement items, prefilled known variances, visibility and source refs. It is private to production parties; moderators see referenced evidence only on escalation.
- Edit-window expiry locks version. Correction appends governed successor/restatement; no direct rewrite.
- Qualified venue/gear/production report item creates Shard 29/32 provenance suggestion. One report never changes source truth or supplier reputation directly.
- Incident/report forms support resumable evidence upload and voice-dictation-compatible labels.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/show-events/{id}/safety-requirements` | venue/jurisdiction/source/date/role/evidence/key; safety actor | `201 ShowSafetyRequirementResponse`; tracked validity/acceptance | `403`, `409 SOURCE_STALE`, `422 EVIDENCE_POLICY_FAILED`, `429` |
| `POST /internal/v1/show-events/{id}/weather-observations` | provider condition/source time/threshold state/event key; weather worker | `WeatherContingencyResponse`; advisory known/unknown/alerts | `403`, `409 EVENT_REUSED`, `422`, `429`, `503 PROVIDER_UNKNOWN` |
| `POST /api/v1/show-events/{id}/operational-decisions` | trigger/decision/reason/evidence/authority ref/key; authorized human | `201 OperationalDecisionResponse`; record/notifications | `403 DECIDER_UNAUTHORIZED`, `409 DECISION_SUPERSEDED`, `422 REASON_REQUIRED|EVIDENCE_POLICY_FAILED`, `429` |
| `POST /api/v1/show-events/{id}/post-show-reports` | factual/judgement items/source refs/visibility/key; production party | `201 PostShowReportResponse`; version/lock time | `403 SOURCE_FORBIDDEN`, `409 VERSION_CONFLICT`, `422`, `429` |
| `POST /api/v1/post-show-reports/{id}/corrections` | corrected item/reason/evidence/expected version/key; report author or governed reviewer | `201 PostShowReportResponse`; successor/correction lineage | `403`, `409 EDIT_WINDOW_CLOSED|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/post-show-report-items/{id}/source-suggestions` | target Shard 29/32 field/evidence/key; qualified reporter | `201 SourceCorrectionSuggestionResponse`; pending provenance suggestion | `403`, `409 SUGGESTION_EXISTS`, `422 TARGET_INVALID`, `429` |

## Persistence, RLS and Workers

- Safety requirement/evidence/acceptance, weather observation/threshold, operational decision/notification, post-report/version/correction and source suggestion rows pin actor, source and policy versions.
- RLS exposes safety/decision state to operational parties, private reports to production parties and escalated evidence only to case-bound moderators; providers receive no unrelated event data.
- Weather, threshold, notification, report-lock and correction-routing workers are idempotent. Provider state never writes human decision or source-domain truth.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Safety requirement | `pending → accepted|rejected|expired|stale`; accepted `→ superseded` by source/date change | Exact event/venue/jurisdiction/source/date/role/evidence trigger. No aggregate compliant state exists. |
| Weather observation/contingency | `known|unknown`; known/unknown `→ stale|superseded`; alert `inactive → active → cleared` | Provider source time/threshold worker triggers. Outage yields unknown and never safe. |
| Operational decision | immutable `proceed|modify|pause|cancel`; current `→ superseded` by later authorized decision | Authorized human reason/evidence trigger. System/provider cannot decide or fabricate acceptance. |
| Post-show report | `draft → open → locked`; open `→ superseded` by in-window edit; locked corrections append successor/restatement | Production-party facts/judgements/source refs/edit-window timer trigger. Direct rewrite after lock is forbidden. |
| Source correction suggestion | `pending → accepted|rejected|review_required|superseded` under owning Shard 29/32 | Qualified report item/evidence trigger. One report never mutates source truth or supplier reputation. |

Every unlisted transition returns the typed state/version/authority conflict. Private reports/evidence remain production/case scoped.

## Failure, Deepening and Ambiguity Gate

Tests cover blanket compliance, weather outage safe result, system-made cancellation, fabricated acceptance, factual/judgement collapse, public post-report, destructive late edit, one-report reputation mutation and direct source overwrite. Seven passes converge; two implementers receive identical safety, weather and recovery behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|---|
| 2026-08-03 | Safety, weather and recovery contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/33-show-day-operations|Shard 33 — Show-day execution and recovery]]
- [[specs/ia/deep-dives/33-show-day-operations|Deep Dive 33 — Show-day operations]]
- [[specs/be/06a-case-intake-evidence|Case intake and evidence — Backend Specification]]
- [[specs/be/29b-room-specs-accessibility-conformance|Room specifications, gear, accessibility and conformance — Backend Specification]]
- [[specs/be/32d-advance-checklist-freeze|Production advance checklist, sheets and freeze control — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/33-show-day-operations|Shard 33 — Show-day execution and recovery]]
- [[specs/ia/deep-dives/33-show-day-operations|Deep Dive 33 — Show-day execution and recovery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/29b-room-specs-accessibility-conformance|Room specifications, gear, accessibility and conformance — Backend Specification]]
- [[specs/be/32d-advance-checklist-freeze|Production advance checklist, sheets and freeze control — Backend Specification]]
