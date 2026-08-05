# Course commerce, entitlements, consumption, refunds and diagnostics — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/16-education-credentials-institutions|Shard 16 — Courses, credentials, institutions and special practice]]  
**Deep Dive:** [[specs/ia/deep-dives/16-education-credentials-institutions|Course and institution deep dive]]

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

- **Shard split:** 2 of 4; EDU-CI-05, EDU-CI-06, EDU-CI-07, EDU-CI-09 and EDU-CI-10.
- **Boundary:** frozen checkout, unique product entitlement, atomic course-plus-lesson bundle, private playback progress, policy-based refund and thresholded author diagnostics.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 16 IA/deep dive | entitlement/bundle/refund and consumption/privacy algorithms |
| Shards 00, 14 and 15 | provider reconciliation, transaction invariants and lesson-credit grant |

## Commerce and Privacy Invariants

- Checkout freezes buyer, course/revision, offer, amount/currency, territory, tax and refund policy. Course change during checkout either honors that eligible snapshot or fails before charge.
- Provider success creates no entitlement until server reconciliation confirms intended account, amount, currency and idempotency key.
- Course entitlement is unique, product-scoped, non-transferable, non-spendable and not cash. Existing ownership blocks before payment.
- Course-plus-lessons transaction creates one course entitlement and one Shard 15 teacher/academy-rate-line credit event in the same database transaction; both grants/outbox rows commit or neither does.
- Application failure after provider success enters visible unfulfilled reconciliation/refund state; UI never asserts no charge while provider state is unknown.
- Playback requires active entitlement and eligible revision/media, then issues a short-lived signed grant. Offline governed-media download is disabled.
- Progress stores monotonic furthest position per lesson. Explicit restart changes presentation only; it never erases canonical consumption evidence.
- Completion is descriptive and creates no badge, score, certificate, public signal, pressure notification or inferred ability.
- Change-of-mind refund is eligible through 14 calendar days only while consumed duration is below 20% of published course duration. Verified defect, material misrepresentation and mandatory law may override.
- Approved refund revokes playback while preserving learner-private progress and Shard 15 practice provenance.
- Author diagnostics contain delayed buckets only after configured privacy threshold; no learner key, targeting export, named progress or musicianship inference.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Provider operations and bundle legs use stable IDs; ambiguous outcomes reconcile asynchronously.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/course-checkouts/preflight` | course/revision/offer/territory/buyer; adult buyer/key | `CourseCheckoutPreflight`; frozen terms/ownership/hash | `403 AGE_GATE_DISABLED`, `409 OFFER_STALE|ALREADY_OWNED`, `422`, `429` |
| `POST /api/v1/course-purchases` | preflight/payment token; buyer/key | `202 CoursePurchaseResponse`; provider/reconciliation state | `403`, `409 PREFLIGHT_STALE`, `422`, `429`, `503 PROVIDER_UNKNOWN` |
| `POST /api/v1/course-bundle-purchases` | course preflight plus Shard 15 credit preflight/payment token; buyer/key | `202 BundlePurchaseResponse`; atomic leg IDs/state | `403`, `409 SOURCE_STALE`, `422`, `429`, `503` |
| `POST /internal/v1/course-purchases/{id}/reconcile` | provider evidence/expected amount/event; finance worker/key | `CoursePurchaseResponse`; active/unfulfilled/refund_pending | `403`, `409 EVENT_REUSED|PROVIDER_MISMATCH`, `429`, `503` |
| `GET /api/v1/course-library` | own cursor/state filter; learner | `CourseLibraryPage`; active/revoked/degraded entitlements | `403`, `429`, `503` |
| `POST /api/v1/course-lessons/{id}/playback-grants` | entitlement/revision/device nonce; entitled learner/key | `201 PlaybackGrantResponse`; 60-second signed grant | `403`, `404`, `409 ENTITLEMENT_INACTIVE|MEDIA_UNAVAILABLE`, `429`, `503` |
| `PATCH /api/v1/course-progress/{lessonId}` | entitlement/client version/furthest ms/completion marker; learner/key | `CourseProgressResponse`; monotonic row version | `403`, `409 CLIENT_VERSION_STALE`, `422 PROGRESS_REGRESSION`, `428`, `429` |
| `POST /api/v1/course-refunds/preflight` | purchase/reason/evidence refs; buyer/key | `RefundPreflightResponse`; days/consumption/override eligibility/hash | `403`, `409 PURCHASE_STATE_CHANGED`, `422`, `429` |
| `POST /api/v1/course-refunds` | preflight hash/expected version; buyer or reviewer/key | `202 CourseRefundResponse`; revoke/provider state | `403`, `409 PREFLIGHT_STALE|PLAYBACK_RACE`, `422`, `428`, `429`, `503` |
| `GET /api/v1/courses/{id}/diagnostics` | revision/date buckets; author/key | `CourseDiagnosticResponse`; thresholded delayed aggregates | `403`, `404`, `409 PRIVACY_THRESHOLD_UNMET`, `429`, `503` |

## Persistence, RLS and Workers

- `course_offer`, `course_purchase`, `course_entitlement`, `course_progress` and `course_refund` retain frozen snapshots and bigint versions. Unique active entitlement is enforced by learner/course product key.
- `course_progress` stores learner/entitlement/lesson/furthest milliseconds/completed-at/client and row version; refund retains row but revokes playback join.
- `course_diagnostic_bucket` has course/revision/lesson/time aggregates only after privacy floor and contains no learner identifier.
- RLS exposes purchase to buyer, entitlement/progress to learner, safe aggregate diagnostics to author and provider refs only to finance service. Author cannot query progress rows.
- Reconciliation/refund workers are idempotent and compensate unfulfilled purchases. Playback/refund serializes on entitlement version; post-revocation grants fail.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Course purchase | `pending_provider → provider_confirmed|declined|unknown`; confirmed `→ fulfilled|unfulfilled`; unfulfilled `→ fulfilled|refund_pending`; refund-pending `→ refunded|failed|unknown` | Stable provider reconciliation and atomic entitlement/bundle transaction trigger. Mismatch/duplicate ownership blocks; unknown never asserts no charge. |
| Course entitlement | `pending → active → revoked|degraded`; degraded `→ active|revoked` after media/eligibility recovery | Server-confirmed exact purchase/bundle legs trigger. Provider success alone cannot activate; refund revokes playback but preserves learner-private progress. |
| Playback grant | `issued → consumed|expired|revoked` | Active entitlement/media authorization creates 60-second grant. Inactive entitlement, unavailable media or replay blocks; governed offline download remains disabled. |
| Course progress | monotonic `not_started → in_progress → completed`; explicit restart changes presentation only | Entitled learner progress command triggers. Lower furthest position/stale client blocks canonical regression; completion creates no credential or public signal. |
| Course refund | `preflight → approved|denied|stale`; approved `→ provider_pending → refunded|failed|unknown` | Consumption/time/policy/law evaluation and provider evidence trigger. Playback race/stale purchase blocks; approved flow revokes entitlement consistently with provider reconciliation. |

Every unlisted transition returns the typed state/version/provider conflict. Diagnostics remain thresholded and never expose learner identity or ability inference.

## Failure, Deepening and Ambiguity Gate

Tests cover checkout substitution, duplicate webhook, existing owner charge, half bundle, unknown provider result, transferable entitlement, offline byte access, progress regression, completion credential, refund/playback race, exact 14-day/20% boundaries, private-progress deletion and low-volume diagnostics. Seven passes converge; two implementers receive identical commerce and consumption behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Course commerce and privacy contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/16-education-credentials-institutions|Shard 16 — Courses, credentials, institutions and special practice]]
- [[specs/ia/deep-dives/16-education-credentials-institutions|Deep Dive 16 — Courses and institutions]]
- [[specs/be/15b-lesson-booking-credits-delivery|Lesson booking, credits, policy and delivery — Backend Specification]]
- [[specs/be/16a-course-authoring-publication-catalog|Course authoring, publication and catalog — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/16-education-credentials-institutions|Shard 16 — Courses, credentials, institutions and special practice]]
- [[specs/ia/deep-dives/16-education-credentials-institutions|Deep Dive 16 — Courses, credentials, institutions and special practice]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/15b-lesson-booking-credits-delivery|Lesson booking, credits, policy and delivery — Backend Specification]]
- [[specs/be/16a-course-authoring-publication-catalog|Course authoring, publication and catalog — Backend Specification]]
