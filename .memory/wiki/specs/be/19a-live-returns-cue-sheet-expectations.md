# Live-performance returns and cue-sheet expectations — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/19-royalty-reporting-forecasting|Shard 19 — Royalty reporting and forecasting]]  
**Deep Dive:** [[specs/ia/deep-dives/19-royalty-reporting-forecasting|Royalty reporting deep dive]]

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

- **Shard split:** 1 of 3; RRF-01, RRF-02, RRF-03, RRF-04 and RRF-05.
- **Boundary:** show/setlist return drafting and submission, superseding amendments, evidence-backed cue-sheet expectations and off-platform follow-up.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 19 IA/deep dive | reporting authority and cue-sheet expectation algorithms |
| Shards 09, 10 and 18 | show/setlist, registrations/rights and society profiles/status |

## Reporting and Cue-Sheet Invariants

- Draft loads canonical Shard 09 show/setlist and matches Shard 10 registered works; covers/unmatched entries remain explicit and never infer ownership.
- Reporter must hold own society membership or explicit venue/operator reporting role for territory. Platform never borrows accreditation or impersonates performer.
- Return freezes reporter role, show/setlist version, territory, society profile, sequence and expected-by. Blind duplicate is blocked; society remains final deduper.
- Setlist amendment creates superseding return against same show, retains prior filing and restarts expected-by. No overwrite/history deletion.
- Cue-sheet expectation requires licensed placement, production, territory, obligation and evidence. State is `expected|confirmed|missing|unverifiable`; unverifiable never collapses.
- Platform may record contacts, tasks, evidence and responses but never files another production's cue sheet or claims production authority.
- No-route and honest dead-end are terminal observable states, not hidden failure or acceptance claim.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Submissions use immutable payload/receipt and stable sequence IDs.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/live-returns/drafts` | show/setlist/territory/society/source versions; performer/operator/key | `201 LiveReturnResponse`; draft/matches/gaps | `403`, `409 SOURCE_STALE`, `422 NO_REPORTING_ROUTE`, `429` |
| `POST /api/v1/live-returns/{id}/submit` | reporter role/profile/sequence/expected-by; authorized reporter ETag/key | `202 LiveReturnResponse`; submitted/manual-task state | `403 REPORTER_AUTHORITY_MISSING`, `409 DUPLICATE_SEQUENCE|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/live-returns/{id}/amendments` | successor setlist/source versions/reason; same authorized reporter/key | `201 LiveReturnResponse`; superseding version/expected-by | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/cue-sheet-expectations` | placement/production/territory/obligation/evidence; rights holder/key | `201 CueSheetExpectationResponse`; expected/unverifiable version | `403`, `409`, `422 EVIDENCE_INSUFFICIENT`, `429` |
| `POST /api/v1/cue-sheet-expectations/{id}/follow-ups` | contact/task/evidence/response/expected-by; rights holder/key | `201 CueSheetFollowUpResponse`; immutable history/state | `403`, `409 VERSION_CONFLICT`, `422 PRODUCTION_FILING_FORBIDDEN`, `428`, `429` |
| `POST /internal/v1/reporting-expectations/{id}/expected-by` | due/version/event; timer worker/key | `ReportingAlarmResponse`; overdue/dead-end/no-op | `403`, `409 EVENT_REUSED|OUTCOME_RECEIVED`, `429`, `503` |

## Persistence, RLS and Workers

- `live_return`, immutable versions, `cue_sheet_expectation` and `cue_sheet_follow_up` pin show/placement/authority/evidence sources.
- RLS exposes return to reporter/show rights participants and cue expectation to mandate-scoped rights holders; production contacts/evidence are purpose-scoped.
- Submission/follow-up workers use stable sequence/operation IDs and cannot acquire reporter/production authority from credentials alone.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Live return | `draft → submitted|manual_task|no_route`; submitted/manual-task `→ acknowledged|rejected|overdue|submitted_unknown`; any filed version `→ superseded` by amendment | Authorized reporter/profile/sequence submission, receipt or expected-by timer triggers. Borrowed accreditation, duplicate sequence or stale show/setlist blocks; amendment never overwrites history. |
| Return match row | immutable `matched|cover_unmatched|unmatched|conflicted` bound to exact source versions | Deterministic Shard 09/10 match triggers. Unmatched/cover state never infers ownership and source correction creates successor. |
| Cue-sheet expectation | `expected → confirmed|missing|unverifiable|dead_end`; confirmed/missing/unverifiable may be superseded by new evidence | Licensed placement/production/territory obligation evidence and follow-up outcome trigger. Platform cannot file for production or collapse unverifiable into missing/accepted. |
| Reporting follow-up | `open → sent → answered|overdue|no_route|closed` | Rights-holder action, response or expected-by timer triggers. Contacts/tasks do not grant production authority and silence never fabricates receipt. |

Every unlisted transition returns the typed state/version/authority conflict. Events omit private contacts, evidence and payload contents.

## Failure, Deepening and Ambiguity Gate

Tests cover inferred work ownership, borrowed accreditation, venue/performer duplicate, amendment overwrite, expected-by loss, evidence-free expectation, unverifiable-as-missing and platform production filing. Seven passes converge; two implementers receive identical reporting behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Live returns and cue expectations authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/19-royalty-reporting-forecasting|Shard 19 — Royalty reporting and forecasting]]
- [[specs/ia/deep-dives/19-royalty-reporting-forecasting|Deep Dive 19 — Royalty reporting and forecasting]]
- [[specs/be/09d-sessions-delivery-readiness|Project sessions, delivery, QC and readiness — Backend Specification]]
- [[specs/be/18a-society-affiliation-registration|Society affiliation, registration projection and delivery — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/19-royalty-reporting-forecasting|Shard 19 — Performance reporting, money-in-flight and forecasting]]
- [[specs/ia/deep-dives/19-royalty-reporting-forecasting|Deep Dive 19 — Royalty reporting and forecasting]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/09d-sessions-delivery-readiness|Project sessions, delivery, QC and readiness — Backend Specification]]
- [[specs/be/18a-society-affiliation-registration|Society affiliation, registration projection and delivery — Backend Specification]]
