# Teacher tuition facets, discovery and trials — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/15-education-delivery|Shard 15 — Lessons, practice and mentorship delivery]]  
**Deep Dive:** [[specs/ia/deep-dives/15-education-delivery|Education delivery deep dive]]

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

- **Shard split:** 1 of 4; EDU-01, EDU-02 and EDU-08. Booking, credits, rooms and delivery are owned by 15b.
- **Boundary:** self-authored tuition facets, read-only evidence projection, transparent teacher discovery, protected trials and quiet conversion expiry.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 15 IA | EDU-01, EDU-02, EDU-08; contracts, access, accessibility and events |
| Shard 15 deep dive | canonical fields, discovery/trial algorithm, abuse/recovery and implementation envelope |
| Shards 01, 02 and 06 | acting authority, evidence projection, blocks/restrictions and safeguarding eligibility |
| Shard 00 BE | envelopes, errors, rate limits, upload/outbox, observability and provider-failure rules |

## Facet, Discovery and Trial Invariants

- Tuition facet is an identity facet, not a second profile. Teacher authors biography, pedagogy, instruments, levels, modes, languages, intake and age range; rate-card and availability versions are required for publication.
- Credential, credit and vouch evidence is read-only from Shard 02 and displayed as separate labelled blocks. Teacher cannot author, reorder by hidden trust value or synthesize a score/badge.
- Contact data, private student outcomes and off-platform payment instructions are rejected. Expired vetting retracts affected evidence and under-18 range without unpublishing an otherwise eligible adult facet.
- Consumer launch rejects any known under-18 teacher or student with `AGE_GATE_DISABLED`; future minor discovery cannot activate separately from the complete safeguarding profile.
- Search hard-filters instrument, level within one declared level, age eligibility, mode, language, bookability, restrictions and safeguarding. It partitions matching-window bookable, other-hours bookable and fully booked before ranking.
- Ranking uses published weights for window fit, mode/geography, behavioural evidence and capped credential/credit evidence. Evidence contributes at most 8/100 and never more than the lowest behavioural signal.
- Results return reasons and missing/degraded inputs but no rank integer or comparative position. Empty results widen one filter at a time and state each widening.
- Trial is unique per teacher-student pair and inherits full booking, safeguarding and delivery controls. It records no required rating or rejection reason.
- Conversion prompt appears at room end; one nudge may send within 48 hours and the conversion offer becomes silently expired at seven days.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 actor, acting-context, idempotency, expected-version, privacy-classification and rate-limit controls. Every mutation audits actor/party/source hashes; every query emits freshness and degraded-input fields.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/tuition-facets/preflight` | authored fields, rate/availability/evidence versions, age range; teacher/key | `FacetPreflightResponse`; exact gaps/source hash | `403`, `409 SOURCE_STALE`, `422 CONTACT_DATA_FORBIDDEN|AGE_GATE_DISABLED`, `429`, `503` |
| `POST /api/v1/tuition-facets` | preflight hash and complete facet; teacher/key | `201 TuitionFacetResponse`; draft/published version | `403`, `409 PREFLIGHT_STALE`, `422`, `429` |
| `PATCH /api/v1/tuition-facets/{id}` | authored-field whitelist and source versions; owner ETag/key | `TuitionFacetResponse`; successor version | `403`, `404`, `409 VERSION_CONFLICT`, `422 EVIDENCE_READ_ONLY`, `428`, `429` |
| `POST /internal/v1/tuition-facets/{id}/evidence-refresh` | Shard 02 source version/event; worker/key | `TuitionFacetResponse`; retracted/refreshed projection | `403`, `409 EVENT_REUSED|SOURCE_STALE`, `429`, `503` |
| `POST /api/v1/teacher-searches` | instrument/level/age/mode/language/window/cursor; authenticated adult/key | `TeacherSearchResponse`; partitions, reasons, missing inputs, freshness | `403 AGE_GATE_DISABLED`, `422`, `429`, `503` |
| `POST /api/v1/teacher-searches/{id}/widen` | prior search/version and one accepted widening; same student/key | `TeacherSearchResponse`; explicit widening history | `403`, `404`, `409 SEARCH_STALE`, `422 INVALID_WIDENING`, `429` |
| `POST /api/v1/trials` | teacher/student/rate line/occurrence/policy/safeguarding versions; adult student/key | `201 TrialResponse`; booking reference/state/version | `403 AGE_GATE_DISABLED|SAFEGUARDING_FAILED`, `409 TRIAL_EXISTS`, `422`, `429`, `503` |
| `POST /api/v1/trials/{id}/conversion-prompts` | delivered trial/version; system or student/key | `ConversionResponse`; offered/quiet-expiry timestamps | `403`, `409 TRIAL_NOT_DELIVERED|EVENT_REUSED`, `422`, `429` |
| `POST /internal/v1/trials/{id}/conversion-nudges` | due trial/version/event; timer worker/key | `ConversionResponse`; sent or typed no-op | `403`, `409 NUDGE_ALREADY_SENT|CONVERTED`, `429`, `503` |
| `POST /internal/v1/trials/{id}/expire` | seven-day due/version/event; timer worker/key | `ConversionResponse`; quietly expired/no-op | `403`, `409 EVENT_REUSED`, `429`, `503` |

## Persistence, RLS and Workers

- `tuition_facet` stores teacher/party, authored JSON schema version, intake, age range, rate-card/availability/evidence versions, publication state and bigint version. GIN indexes cover curated instrument/language/mode fields only; no free-form contact indexing.
- `teacher_search` stores requester, normalized hard filters, partition/ranking policy version, degraded inputs and seven-day expiry. Result rows pin reason codes and source versions; they are never public analytics.
- `trial` is unique on teacher/student pair and references the canonical 15b occurrence. `trial_conversion` permits one prompt, one nudge and one terminal conversion/quiet expiry.
- RLS exposes published safe facet projection broadly, full facet to owner/authorized academy, searches to requester only, and trials to participants. Blocks/restrictions return non-enumerating `404` where existence disclosure would create harm.
- Evidence-refresh, nudge and expiry workers use transactional outbox IDs, at-least-once delivery and idempotent no-op replay. Search dependency failure degrades with freshness; safeguarding failure always fails closed.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Tuition facet | `draft → published`; published `↔ paused`; published/paused `→ retired`; source change appends a successor | Teacher command with current rate/availability/evidence preflight triggers. Contact injection, stale source or age/safeguarding gate blocks; evidence expiry retracts affected projection without rewriting facet. |
| Teacher search | `created → ready|degraded|failed`; ready/degraded `→ widened|expired|stale` | Adult requester query and dependency fold trigger. One explicit accepted filter widening creates successor history; no rank integer or private input is emitted. |
| Trial | `reserved → scheduled → delivered|cancelled|no_show|failed`; delivered `→ conversion_offered` | Unique pair booking and 15b occurrence outcome trigger. Age/safeguarding failure or duplicate pair blocks; no rating/rejection reason is required. |
| Trial conversion | `not_offered → offered → converted|quietly_expired`; offered may receive one `nudged` delivery status before terminal | Room-end prompt, one bounded nudge, conversion or seven-day timer triggers. Duplicate nudge and post-conversion/expiry delivery are no-ops/conflicts. |

Every unlisted transition returns the typed state/version/safeguarding conflict. Events omit private search inputs, student outcomes and contact data.

## Failure, Deepening and Ambiguity Gate

Tests cover contact injection, self-authored evidence, vetting expiry, partial minor enablement, private-data ranking, evidence cap, fully-booked-as-score, rank-number leakage, deterministic widening, duplicate trial, forced rating, duplicate nudge and noisy expiry. Seven passes converge; two implementers receive identical facet, discovery and trial behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Facet, discovery and trial contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/15-education-delivery|Shard 15 — Lessons, practice and mentorship delivery]]
- [[specs/ia/deep-dives/15-education-delivery|Deep Dive 15 — Education delivery]]
- [[specs/be/01c-relationships-authority-governance|Relationships, authority and governance — Backend Specification]]
- [[specs/be/02c-credentials-trader|Credentials and trader evidence — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Policy enforcement and appeals — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/15-education-delivery|Shard 15 — Lessons, practice and mentorship delivery]]
- [[specs/ia/deep-dives/15-education-delivery|Deep Dive 15 — Lessons, practice and mentorship delivery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/02c-credentials-trader|Credentials and trader-status assessment — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
