# Lesson booking, credits, policy and delivery — Backend Specification

**Status:** Complete; minor profiles disabled  
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

- **Shard split:** 2 of 4; EDU-03, EDU-04, EDU-05, EDU-06 and EDU-07. Discovery/trial presentation is owned by 15a; learning artifacts are owned by 15c.
- **Boundary:** version-pinned bookings and series, teacher/rate-line lesson entitlements, residual value, cancellation/no-show/make-up settlement, identity-bound rooms, presence evidence and delivery close.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 15 IA | EDU-03 through EDU-07; booking/credit contracts, access and edge cases |
| Shard 15 deep dive | credit/policy and safeguarding/delivery algorithms, canonical fields and state machines |
| Shards 00, 01 and 06 | payment adapter, identity/authority, restrictions and protected safeguarding evidence |
| Shard 14 BE | provider authorization and no-custody transaction boundaries; education semantics remain separate |

## Booking, Credit and Delivery Invariants

- Purchase pins teacher/academy, rate line, policy, contract currency, tax, FX, revenue share and purchaser/student split. Lesson credit is a scoped entitlement unit, never money, transferable currency or platform-wide balance.
- Teacher earns nothing at purchase. Append-only credit events separately record purchase, reserve, return, burn, earn, residual, make-up grant and refund; event sums must reconcile units and residual basis exactly.
- Booking reserves one matching teacher/academy plus rate-line unit. Cross-teacher/rate-line movement is forbidden except a typed departure remedy with preserved purchase value.
- Expiry removes the historical rate lock only. Every unused unit becomes paid residual value redeemable with that teacher at current price; expiry never confiscates value or creates teacher earnings.
- Cancellation uses booking-pinned policy and server receipt order. Teacher override may only improve student outcome. Failed settlement mutation leaves booking unchanged.
- No-show is provisional until scheduled end and is vacated by at least five minutes joint server presence. A cancellation received before no-show commit wins as late cancellation.
- In-person delivery assertion missing after seven calendar days returns the reserved credit. Make-up has independent validity and returns credit if it becomes impossible to redeem.
- Consumer launch admits adults only. Any known minor returns `AGE_GATE_DISABLED` before payment, booking or room effect; no role, academy or feature flag can partly enable a future minor profile.
- Room requires authenticated identity and occurrence role; no bearer link, dial-in or anonymous join. Server records joins/leaves and concurrent milliseconds and never infers attendance before a human joins.
- Delivery requires teacher/student joint server presence for at least 50% of scheduled duration. Partial remains separate. Session-record write failure never reverses earned delivery; it opens a private teacher-quality task.
- Future remote-minor profile requires the complete guardian/vetting/chaperone-or-recording/feedback/privacy/incident bundle. Recording loss ends the lesson unless declared guardian observer joins within 60 seconds.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 actor, acting-context, idempotency, expected-version, privacy-classification and rate-limit controls. Provider calls use stable operation IDs; ambiguous outcomes remain `pending_provider` until webhook/reconciliation proves one terminal result.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/lesson-series/preflight` | participants/rate/recurrence/timezone/mode/policy/safeguarding versions; adult purchaser/key | `LessonPreflightResponse`; occurrences/value/consequences/hash | `403 AGE_GATE_DISABLED|SAFEGUARDING_FAILED`, `409 SOURCE_STALE`, `422`, `429`, `503` |
| `POST /api/v1/lesson-credit-purchases` | preflight/payment token/units/auto-renew explicit false-by-default; purchaser/key | `202 CreditPurchaseResponse`; account/provider operation/state | `403`, `409 PREFLIGHT_STALE`, `422`, `429`, `503 PROVIDER_UNKNOWN` |
| `GET /api/v1/lesson-credit-accounts/{id}` | purchaser/student/teacher safe projection | `LessonCreditAccountResponse`; units/residual/events/freshness | `403`, `404`, `429`, `503` |
| `POST /api/v1/lesson-bookings` | occurrence/rate-policy-credit versions or payment token; adult student/purchaser/key | `201 LessonBookingResponse`; reservation/occurrence/version | `403 AGE_GATE_DISABLED`, `409 CREDIT_UNAVAILABLE|SLOT_RACE`, `422`, `429`, `503` |
| `POST /api/v1/lesson-bookings/{id}/cancellation-preflights` | actor/reason/source versions; participant/key | `CancellationPreflightResponse`; exact return/burn/make-up consequence/hash | `403`, `409 PRESENCE_ALREADY_STARTED`, `422`, `429` |
| `POST /api/v1/lesson-bookings/{id}/cancel` | preflight hash and expected version; participant/key | `LessonSettlementResponse`; canonical event IDs/state | `403`, `409 POLICY_CONFLICT|VERSION_CONFLICT`, `422`, `428`, `429`, `503` |
| `POST /internal/v1/lesson-occurrences/{id}/no-show-evaluate` | scheduled-end/version/presence hash/event; timer worker/key | `LessonSettlementResponse`; provisional/committed/vacated | `403`, `409 EVENT_REUSED|TIMELY_CANCELLATION`, `429`, `503` |
| `POST /internal/v1/lesson-occurrences/{id}/in-person-evidence-expire` | seven-day due/version/event; timer worker/key | `LessonSettlementResponse`; credit returned/no-op | `403`, `409 EVENT_REUSED|DELIVERY_RECORDED`, `429`, `503` |
| `POST /api/v1/lesson-occurrences/{id}/room-grants` | participant identity/device/role/safeguarding versions; participant/key | `201 RoomGrantResponse`; 60-second single-use grant/roster | `403 AGE_GATE_DISABLED|ROOM_IDENTITY_REQUIRED|SAFEGUARDING_FAILED`, `409 ROLE_STALE`, `429`, `503` |
| `POST /internal/v1/lesson-occurrences/{id}/presence-events` | grant/join-leave/server timestamp/sequence; room service/key | `202 PresenceResponse`; accepted/deduplicated | `403`, `409 EVENT_REUSED|SEQUENCE_CONFLICT`, `422`, `429` |
| `POST /api/v1/lesson-occurrences/{id}/close` | exact presence hash/session-record result; teacher or worker/key | `202 LessonCloseResponse`; delivery/partial/state/settlement job | `403`, `409 VERSION_CONFLICT`, `422 DELIVERY_EVIDENCE_INSUFFICIENT`, `429`, `503` |
| `POST /internal/v1/lesson-occurrences/{id}/settle-delivery` | close/version/stable event IDs; credit worker/key | `LessonSettlementResponse`; earn/return/quality-task IDs | `403`, `409 EVENT_REUSED`, `429`, `503` |

## Persistence, RLS and Workers

- `lesson_series` pins teacher/student/purchaser, rate line, recurrence/timezone, mode, safeguarding profile and state. `lesson_occurrence` pins materialization source, scheduled interval, rate/policy versions, room/location and bigint version.
- `lesson_credit_account` is unique by purchaser/student/teacher-or-academy/rate line/currency basis. `lesson_credit_event` is append-only with a unique idempotency key and check constraints preventing impossible unit/residual signs.
- `lesson_presence` is append-only by occurrence/participant/grant/sequence; a transaction computes concurrent milliseconds from server timestamps. Device telemetry and continuous location are forbidden.
- RLS exposes billing/value to purchaser, entitlement to student, earning-safe event projection to teacher, occurrence facts to participants and protected safeguarding evidence only to assigned reviewers. Practice and lesson notes never join billing views.
- Credit purchase, cancellation and delivery settlement use serializable database functions plus outbox. Provider ambiguity queues reconciliation; room outage fails closed for admission but existing canonical credits/bookings remain unchanged.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Credit purchase | `pending_provider → authorized|declined|unknown`; unknown `→ authorized|declined`; authorized `→ credited|refunded|failed` | Stable provider evidence/reconciliation triggers. Unknown cannot duplicate provider operation or entitlement. |
| Lesson credit unit | `available → reserved → returned|burned|earned`; available `→ residual`; make-up `granted → reserved|returned|expired_to_residual` | Booking, cancellation/no-show/delivery/expiry events trigger append-only ledger entries. Cross-teacher/rate movement and negative/unreconciled units block. |
| Lesson booking/occurrence | `reserved → scheduled → in_progress → delivered|partial|cancelled|no_show|evidence_expired`; scheduled may cancel before start | Server receipt order, presence, close or timers trigger. Timely cancellation beats no-show; five-minute joint presence vacates provisional no-show. |
| Room grant | `issued → consumed|expired|revoked`; consumed grant yields append-only presence events | Authenticated occurrence participant command and single-use timer trigger. Bearer/anonymous/wrong-role/age/safeguarding failure blocks. |
| Delivery settlement | `pending → earning|returning → settled|failed|unknown`; failed/unknown retry with stable event IDs | Exact close/presence hash triggers. Joint presence below 50% cannot earn; session-record failure opens quality task without reversing earned delivery. |

Every unlisted transition returns the typed state/version/provider conflict. Events omit billing credentials, lesson notes and device telemetry.

## Failure, Deepening and Ambiguity Gate

Tests cover credit-as-currency, purchase-time earning, cross-teacher transfer, expiry confiscation, auto-renew default, cancellation/no-show race, five-minute vacate, missing in-person evidence, unredeemable make-up, anonymous join, pre-human attendance, partial-vs-delivered threshold, record-write failure and partial minor activation. Seven passes converge; two implementers receive identical booking, credit and delivery behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Booking, entitlement, policy and delivery contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/15-education-delivery|Shard 15 — Lessons, practice and mentorship delivery]]
- [[specs/ia/deep-dives/15-education-delivery|Deep Dive 15 — Education delivery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Policy enforcement and appeals — Backend Specification]]
- [[specs/be/14a-service-listings-quotes-engagements|Service listings, quotes and engagement creation — Backend Specification]]
- [[specs/be/15a-teacher-facets-discovery-trials|Teacher tuition facets, discovery and trials — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/15-education-delivery|Shard 15 — Lessons, practice and mentorship delivery]]
- [[specs/ia/deep-dives/15-education-delivery|Deep Dive 15 — Lessons, practice and mentorship delivery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
- [[specs/be/14a-service-listings-quotes-engagements|Service listings, quotes and engagement creation — Backend Specification]]
- [[specs/be/15a-teacher-facets-discovery-trials|Teacher tuition facets, discovery and trials — Backend Specification]]
