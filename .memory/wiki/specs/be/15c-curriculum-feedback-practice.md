# Curriculum, assignments, feedback, practice and progress — Backend Specification

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

- **Shard split:** 3 of 4; EDU-09, EDU-10, EDU-11, EDU-12 and EDU-13. Booking/presence facts come from 15b; credentials remain Shard 02 and courses remain Shard 16.
- **Boundary:** optional versioned curriculum, assignments, immutable takes, bounded feedback, private practice capture and teacher-approved coverage reports.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 15 IA | EDU-09 through EDU-13; learning contracts, privacy/access and accessibility |
| Shard 15 deep dive | assignment/feedback/practice algorithm, canonical fields and recovery threats |
| Shards 02, 06 and 16 | credential separation, safeguarding restrictions and course-boundary isolation |
| Shard 00 BE | upload intents, offline outbox, storage privacy, observability and errors |

## Learning Artifact Invariants

- Curriculum instance is optional and pins a template version. Later template edits never mutate a live learner plan; learner may self-place without behind-schedule, overdue, failed or grade state.
- Assignment declares medium, instructions and optional reference. It cannot require public submission, professional credit, automated assessment or completion pressure.
- Every submission is an immutable take with source hash and optional predecessor. In-room capture auto-stops at ten minutes; external media over twenty minutes is rejected before upload transfer.
- Upload retry is `2s/8s/32s`, then durable local/outbox retry on next open without expiry. Failed upload does not erase the local take or mutate assignment state.
- Feedback requires current teacher-student relationship, safeguarding profile and declared stance `included|in_lesson_only|capped_weekly`. No platform feedback SLA exists.
- Every annotation has a time anchor; bar/beat anchor is allowed only when the take contains declared click/tempo evidence. Resubmission preserves prior takes and comments.
- Teacher media/annotation access expires 90 days after the last delivered lesson. Student retains their own material; required abuse evidence moves only through Shard 06 protected evidence.
- Practice capture is optional, offline/manual-friendly, student-private and non-evidentiary. It never appears in public, teacher, guardian, purchaser or operator named views and never mints Shard 07 credit.
- Practice tools may provide non-judgmental diagnostics but no skill score, grade, trust signal or coercive streak. Streak is optional and cannot gate any feature.
- Progress report contains coverage facts only, requires explicit teacher approval and named audience, and never measures musicianship or becomes a credential automatically.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 actor, acting-context, idempotency, expected-version, privacy-classification and rate-limit controls. Media routes use private storage intents; events exclude lesson notes, take bytes and practice details.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/curriculum-instances` | relationship/template version/optional self-placement; teacher or adult student/key | `201 CurriculumResponse`; pinned instance/version | `403`, `409 TEMPLATE_STALE`, `422`, `429` |
| `POST /api/v1/curriculum-instances/{id}/versions` | unit references/order/rationale; authorized participant ETag/key | `201 CurriculumResponse`; successor/diff | `403`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/assignments` | relationship/curriculum unit/medium/reference/instructions; teacher/key | `201 AssignmentResponse`; active/version | `403`, `409 RELATIONSHIP_STALE`, `422 GRADE_SCHEMA_FORBIDDEN`, `429` |
| `POST /api/v1/assignments/{id}/takes/preflight` | source/duration/content type/bytes/hash; student/key | `TakePreflightResponse`; upload intent or local-only route | `403`, `409 ASSIGNMENT_CLOSED`, `422 DURATION_EXCEEDED`, `429` |
| `POST /api/v1/assignments/{id}/takes` | preflight/upload/hash/supersedes; student/key | `201 TakeResponse`; immutable take/version | `403`, `409 HASH_MISMATCH|SOURCE_STALE`, `422`, `429`, `503 UPLOAD_FAILED` |
| `GET /api/v1/assignments/{id}/takes` | student/current authorized teacher | `TakePage`; viewer-safe versions/access expiry | `403`, `404`, `429`, `503` |
| `POST /api/v1/takes/{id}/annotations` | time range/body/stance version/optional click-tempo anchor; teacher/key | `201 FeedbackResponse`; annotation/version/expiry | `403 FEEDBACK_NOT_INCLUDED`, `409 RELATIONSHIP_STALE`, `422 TEMPO_EVIDENCE_REQUIRED`, `429` |
| `POST /api/v1/feedback/{id}/versions` | replacement body/range/reason; author ETag/key | `201 FeedbackResponse`; immutable history/current version | `403`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/practice-events/batches` | offline event IDs/tool/source/duration/local time/manual flag; student/key | `202 PracticeBatchResponse`; accepted/duplicates/rejected | `403`, `409 IDEMPOTENCY_MISMATCH`, `422`, `429` |
| `GET /api/v1/practice-logs` | own cursor/date/assignment filters; student only | `PracticeLogPage`; private events/streak preference/freshness | `403`, `429`, `503` |
| `POST /api/v1/progress-reports/previews` | relationship/coverage window/source versions; teacher/key | `ProgressReportPreview`; coverage facts/gaps/hash | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/progress-reports` | preview hash/audience/explicit approval; teacher/key | `201 ProgressReportResponse`; approved immutable report | `403`, `409 PREVIEW_STALE`, `422 MUSICIANSHIP_MEASURE_FORBIDDEN`, `429` |
| `POST /internal/v1/learning-access/expire` | relationship/90-day due/source version/event; worker/key | `AccessExpiryResponse`; revoked/no-op/evidence move | `403`, `409 EVENT_REUSED|NEWER_LESSON_EXISTS`, `429`, `503` |

## Persistence, RLS and Workers

- `curriculum_instance` and append-only versions pin template/unit refs and learner placement. `assignment` state is `active|submitted|feedback_available|discussed|closed`; overdue, failed and grade columns are forbidden.
- `submission_take` stores assignment/student/blob hash/duration/source/supersedes/state. `feedback_annotation` stores take/teacher/time range/body-history/stance version/access expiry; source bytes remain private storage objects.
- `practice_event` is student-owned and append-only with unique offline event ID. No analytics consumer, public projection or cross-user aggregate may receive identifiable rows.
- `progress_report` stores immutable approved coverage snapshot, source versions and audience. It is not inserted into qualification or professional-credit tables.
- RLS permits learner own curriculum/takes/practice/reports, current teacher assigned curriculum/takes/feedback, and denies purchaser/guardian/operator practice access even if they can view billing. Expired teacher access returns `404` without existence leakage.
- Upload completion and access expiry workers are idempotent. Retry exhaustion surfaces durable pending state; deletion preserves required tombstone/evidence while revoking derived access and bytes according to retention policy.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Curriculum instance | `active → superseded|closed`; successor remains active and pins immutable source unit versions | Authorized participant version append/close triggers. Stale template/version blocks; no behind/overdue/failed/grade state exists. |
| Assignment | `active → submitted → feedback_available → discussed|closed`; active/submitted/feedback may close | Teacher create/close, take submission and feedback availability trigger. Public submission, grade schema or completion pressure is forbidden. |
| Submission take | `local_pending → uploading → settling → available|failed`; available `→ superseded|deleted`; failed remains locally retryable | Student capture/upload/checksum triggers. Duration/hash/source failure blocks availability; retry exhaustion never erases local take or mutates assignment. |
| Feedback annotation | immutable active version `→ superseded|deleted`; teacher access `active → expired` after 90-day rule | Current relationship/stance/safeguarding and time anchor trigger. Missing tempo evidence blocks beat anchor; expired access returns concealment-safe denial. |
| Practice event | immutable student-private `recorded`; deletion/retention creates private tombstone only | Student offline/manual batch triggers. No teacher/guardian/purchaser/operator/public consumer, credit, score or coercive streak transition exists. |
| Progress report | `preview → approved|stale`; approved is immutable and audience-bound | Current coverage preview plus explicit teacher approval triggers. Stale source, musicianship measure or credential claim blocks. |

Every unlisted transition returns the typed state/version/access conflict. Events omit lesson notes, take bytes, feedback bodies and practice detail.

## Failure, Deepening and Ambiguity Gate

Tests cover template mutation, behind-schedule state, grade injection, duration bypass, failed-upload loss, mutable take, tempo-free bar anchor, stale relationship feedback, feedback SLA promise, 90-day access, guardian practice access, public streak, attendance-to-credit and unapproved musicianship report. Seven passes converge; two implementers receive identical curriculum, feedback and practice behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Learning artifacts and privacy contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/15-education-delivery|Shard 15 — Lessons, practice and mentorship delivery]]
- [[specs/ia/deep-dives/15-education-delivery|Deep Dive 15 — Education delivery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/15b-lesson-booking-credits-delivery|Lesson booking, credits, policy and delivery — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/15-education-delivery|Shard 15 — Lessons, practice and mentorship delivery]]
- [[specs/ia/deep-dives/15-education-delivery|Deep Dive 15 — Lessons, practice and mentorship delivery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/15b-lesson-booking-credits-delivery|Lesson booking, credits, policy and delivery — Backend Specification]]
