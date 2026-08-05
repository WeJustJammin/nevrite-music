# Group classes, mentorship and learning paths — Backend Specification

**Status:** Complete; minor group profile disabled  
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

- **Shard split:** 4 of 4; EDU-14, EDU-15 and EDU-16. These sibling lifecycles do not inherit each other's payment, cancellation, curriculum or safeguarding semantics.
- **Boundary:** viable group classes with all-participant refunds, fixed-term scarce mentorship and transparent self-placed learning paths over existing units.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 15 IA | EDU-14 through EDU-16; group/mentorship/path contracts and access rules |
| Shard 15 deep dive | group/mentorship/path algorithm, state machines and abuse/recovery controls |
| Shards 01, 06 and 16 | authority, safeguarding and existing course/unit ownership boundaries |
| Shard 00 BE | payment/refund adapter, timers, outbox, rate limits and observability |

## Group, Mentorship and Path Invariants

- Group class freezes instrument/level roster composition, minimum viable enrollment, maximum capacity, schedule, rate/refund terms and safeguarding profile before enrollment opens.
- Class cannot activate below threshold or with materially different roster composition. Deadline failure transitions atomically to `cancelled_refunded` and refunds every participant; organizer cannot selectively proceed or retain value.
- Group safeguarding is a distinct profile and never a relaxed version of 1:1 controls. Adult launch blocks known minors and keeps future minor-group activation inside the indivisible safeguarding gate.
- Group occurrence delivery may reuse 15b adult room/presence infrastructure, but cohort viability/refund and participant disclosure remain this contract's authority.
- Mentorship is a fixed-term agreement with explicit goals, cadence, start/end and capacity snapshot. Expected mentor capacity is one to three active mentees unless a published policy version sets a lower cap.
- Mentorship never inherits lesson credits, cancellation policy, curriculum, teacher discovery ranking or automatic renewal. Check-ins are private relationship records, not performance ratings.
- End is deliberate `completed|cancelled` with durable history. Fixed end is the default; no indefinite or silent renewal state exists.
- Learning path references immutable versions of existing units owned by Shard 16 or other approved content. It creates no copied course truth and cannot mutate source units.
- Learner may self-place or skip without grade/behind state. Enrollment discloses total current cost, prerequisites, required providers and unavailable units before confirmation.
- Path progress stores learner-owned references only. It never certifies completion, issues credentials or exposes private lesson/practice evidence.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 actor, acting-context, idempotency, expected-version, privacy-classification and rate-limit controls. Payment/refund mutations use stable provider IDs and transactional outbox compensation.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/group-classes/preflight` | organizer/composition/threshold/capacity/schedule/rate/refund/safeguarding versions; teacher or academy/key | `GroupPreflightResponse`; gaps/hash/deadline | `403 AGE_GATE_DISABLED|SAFEGUARDING_FAILED`, `409 SOURCE_STALE`, `422`, `429`, `503` |
| `POST /api/v1/group-classes` | preflight hash/occurrences/enrollment window; organizer/key | `201 GroupClassResponse`; draft/enrolling version | `403`, `409 PREFLIGHT_STALE`, `422`, `429` |
| `POST /api/v1/group-classes/{id}/enrollments` | participant/payment token/terms version; adult participant/key | `202 CohortEnrollmentResponse`; held/enrolled/provider state | `403 AGE_GATE_DISABLED`, `409 CAPACITY_RACE`, `422`, `429`, `503` |
| `POST /internal/v1/group-classes/{id}/viability-evaluate` | deadline/source versions/event; timer worker/key | `202 GroupClassResponse`; viable or refund job | `403`, `409 EVENT_REUSED|SOURCE_STALE`, `429`, `503` |
| `POST /internal/v1/group-classes/{id}/refund-all` | frozen cohort/provider operation IDs; finance worker/key | `GroupRefundResponse`; per-participant terminal/pending result | `403`, `409 EVENT_REUSED`, `429`, `503 PROVIDER_UNKNOWN` |
| `POST /api/v1/mentorships/preflight` | mentor/mentee/goals/term/cadence/capacity snapshot; parties/key | `MentorshipPreflightResponse`; eligibility/gaps/hash | `403`, `409 CAPACITY_CHANGED`, `422`, `429` |
| `POST /api/v1/mentorships` | preflight hash/explicit parties' consent; both parties/key | `201 MentorshipResponse`; proposed/active version | `403`, `409 PREFLIGHT_STALE|CONSENT_MISSING`, `422`, `429` |
| `POST /api/v1/mentorships/{id}/check-ins` | period/private record/source version; participant/key | `201 MentorshipCheckInResponse`; immutable check-in | `403`, `404`, `409 TERM_ENDED`, `422 RATING_FORBIDDEN`, `429` |
| `POST /api/v1/mentorships/{id}/end` | completion/cancellation reason and expected version; participant/key | `MentorshipResponse`; terminal state/history | `403`, `409 VERSION_CONFLICT`, `422 AUTO_RENEW_FORBIDDEN`, `428`, `429` |
| `POST /api/v1/learning-paths/preflight` | ordered unit versions/prerequisites/provider/cost snapshot; curator/key | `PathPreflightResponse`; unavailable units/total cost/hash | `403`, `409 SOURCE_STALE`, `422`, `429`, `503` |
| `POST /api/v1/learning-paths` | preflight hash/curation metadata; curator/key | `201 LearningPathResponse`; published version | `403`, `409 PREFLIGHT_STALE`, `422`, `429` |
| `POST /api/v1/learning-paths/{id}/enrollments` | exact path/cost/source versions and self-placement; adult learner/key | `201 PathEnrollmentResponse`; enrollment/progress refs | `403 AGE_GATE_DISABLED`, `409 PATH_CHANGED`, `422 COST_DISCLOSURE_REQUIRED`, `429`, `503` |
| `PATCH /api/v1/path-enrollments/{id}/progress` | unit ref/state/self-placement and expected version; learner/key | `PathEnrollmentResponse`; progress version | `403`, `404`, `409 VERSION_CONFLICT`, `422 CREDENTIAL_CLAIM_FORBIDDEN`, `428`, `429` |

## Persistence, RLS and Workers

- `group_class` stores organizer, frozen roster composition, threshold/capacity, schedule, rate/refund, safeguarding profile and state. `cohort_enrollment` is unique by class/participant and pins payment/refund operation IDs.
- Group state is `draft -> enrolling -> viable -> active -> completed` or `under_threshold -> cancelled_refunded`; activation and threshold check lock the class row and count only provider-authorized enrollments.
- `mentorship` stores mentor/mentee, term, goals, cadence, capacity snapshot, starts/ends and state. State is `proposed -> active -> ending -> completed|cancelled`; no renewal column or lesson-credit foreign key exists.
- `learning_path` stores curator and ordered source unit/version references plus cost snapshot version. `path_enrollment` stores learner/self-placement/progress refs without credential or private practice fields.
- RLS exposes group terms and safe roster composition to prospects, participant identities only under declared roster policy, mentorship/check-ins to its parties, and path progress to learner. Operators receive aggregate viability only.
- Viability/refund workers are at-least-once and idempotent. Any ambiguous refund remains visible as `refund_pending`; group cannot become active. Source-unit invalidation marks path degraded and blocks new enrollment without rewriting existing history.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Group class | `draft → enrolling → viable → active → completed`; enrolling `→ under_threshold → refund_pending → cancelled_refunded`; draft/enrolling may cancel through full refund | Frozen preflight, authorized enrollment count/deadline and occurrences trigger. Below threshold/material roster mismatch/age-safeguarding failure blocks activation; ambiguous refund remains pending. |
| Cohort enrollment | `payment_pending → held|failed|unknown`; held `→ enrolled|refund_pending`; refund-pending `→ refunded|failed|unknown` | Stable provider evidence and class viability trigger. Capacity race loses without enrollment; class cannot activate while required refund is unresolved. |
| Mentorship | `proposed → active → ending → completed|cancelled`; proposed may reject/expire | Both-party consent, explicit end or fixed term trigger. Capacity change/missing consent blocks; no renewal or indefinite state exists. |
| Mentorship check-in | immutable private `recorded` within active term | Either participant record triggers. Ended term or rating field blocks; check-in never becomes performance signal. |
| Learning path | `draft → published → degraded|retired`; degraded `→ published` after current source repair | Current unit/cost/provider preflight and curator command trigger. Source invalidation blocks new enrollment without rewriting existing history. |
| Path enrollment/progress | `active → completed|withdrawn`; each unit ref `not_started → in_progress|skipped → completed|skipped` | Learner confirmation/self-placement/progress command triggers. Missing cost disclosure, changed path, credential claim or private practice attachment blocks. |

Every unlisted transition returns the typed state/version/provider conflict. Events omit private mentorship/check-in/path progress and never certify learning.

## Failure, Deepening and Ambiguity Gate

Tests cover under-threshold activation, roster substitution, selective refund, partial minor group enablement, relaxed safeguards, mentorship credit/cancellation inheritance, capacity race, indefinite term, auto-renew, check-in rating, copied path truth, hidden total cost, forced placement and credential issuance. Seven passes converge; two implementers receive identical group, mentorship and path behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Group, mentorship and learning-path contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/15-education-delivery|Shard 15 — Lessons, practice and mentorship delivery]]
- [[specs/ia/deep-dives/15-education-delivery|Deep Dive 15 — Education delivery]]
- [[specs/be/01c-relationships-authority-governance|Relationships, authority and governance — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Policy enforcement and appeals — Backend Specification]]
- [[specs/be/15b-lesson-booking-credits-delivery|Lesson booking, credits, policy and delivery — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/15-education-delivery|Shard 15 — Lessons, practice and mentorship delivery]]
- [[specs/ia/deep-dives/15-education-delivery|Deep Dive 15 — Lessons, practice and mentorship delivery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
- [[specs/be/15b-lesson-booking-credits-delivery|Lesson booking, credits, policy and delivery — Backend Specification]]
