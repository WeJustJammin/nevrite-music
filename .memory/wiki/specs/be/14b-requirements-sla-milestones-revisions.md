# Service requirements, SLA, milestones, revisions and change orders — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]  
**Deep Dive:** [[specs/ia/deep-dives/14-services-marketplace|Services marketplace deep dive]]  
**Engagement Boundary:** [[specs/be/14a-service-listings-quotes-engagements|Service listings and engagement creation]]

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

- **Shard split:** 2 of 5; SRV-05, SRV-06, SRV-07, SRV-08 and SRV-09. Final delivery/acceptance and rights execution are owned by 14c.
- **Boundary:** frozen requirement gates, attributable SLA clocks, milestone delivery/acceptance, bounded revision rounds and expiring priced change orders.
- **Approval:** Recommended split accepted under standing autonomy.

## Work Lifecycle Invariants

- Accepted quote freezes typed requirement checklist. Later requirements require an accepted change order. Project attachment is preferred before upload; off-platform file links are invalid.
- Requirement checks measure mechanical completeness only and return observations, never artistic verdict. All items pass atomically. Three rejection rounds maximum; third failure enters no-fault deadlock/full return/no kill fee.
- Upstream `satisfied_by` engagement suppresses nudges/fault while on-time. Requirement pass starts SLA at actual instant; pause only when buyer owes a named response, resume only on that act and record attributed due-date shift.
- Replacement after pass restarts SLA only if seller elects. On-location gate deadline derives from cancellation boundary. Clock events are contestable and append-only.
- Milestones default sequential, pin quote-declared artifact set/tranche/revision allowance and require complete delivery. Accepted milestone releases tranche/stage credit only; no final rights transfer.
- Revision opens with at least one note against exact artifact, batches until explicit send or bounded 48h/24h-rush window, then freezes. Seller cannot redeliver before freeze. Valid different-file redelivery decrements allowance; identical/rejected consumes nothing.
- Out-of-scope request becomes an expiring mini-quote with price/payment/scope and allowance delta default zero. Private assistant may suggest scope but never decide. Pending change order does not pause final auto-accept.
- Post-acceptance support is recall, never revision.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 envelopes including idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `GET /api/v1/engagements/{id}/requirements` | buyer/seller authorized viewer | `RequirementGateResponse`; frozen checklist/submissions/gaps/round/deadlock/version | `403`, `404`, `429`, `503` |
| `POST /api/v1/engagements/{id}/requirements/{itemId}/submissions` | typed value/blob/project attachment and source version; buyer/key | `201 RequirementSubmissionResponse`; observed completeness/version | `403`, `404`, `409 SOURCE_STALE`, `422 OFFPLATFORM_LINK_FORBIDDEN`, `429` |
| `POST /api/v1/engagements/{id}/requirements/evaluate` | exact item/source hashes; seller/system key | `RequirementGateResponse`; passed or typed rejected/deadlock state | `403`, `409 REQUIREMENTS_CHANGED`, `422 REQUIREMENTS_INCOMPLETE`, `429`, `503` |
| `POST /api/v1/engagements/{id}/sla-events` | start/pause/resume with named cause/awaited act/source; authorized party ETag/key | `SLAClockResponse`; absolute due/version/contest route | `403`, `409 INVALID_CLOCK_TRANSITION|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/engagements/{id}/milestones/{milestoneId}/deliveries` | complete artifact set/digests/declarations; seller/key | `201 MilestoneDeliveryResponse`; QC/delivery/version | `403`, `409 PRIOR_MILESTONE_INCOMPLETE`, `422 DELIVERY_INCOMPLETE|QC_FAILED`, `429` |
| `POST /api/v1/milestone-deliveries/{id}/accept` | exact delivery/version; eligible buyer ETag/key | `201 MilestoneAcceptanceResponse`; tranche/credit instruction IDs | `403 SELF_ACCEPTANCE_FORBIDDEN`, `409 VERSION_CONFLICT`, `422`, `428`, `429`, `503` |
| `POST /api/v1/deliveries/{deliveryId}/revision-rounds` | artifact/version, >=1 notes, urgency/window; buyer/key | `201 RevisionRoundResponse`; open batch/deadline/version | `403`, `409 ACCEPTANCE_ALREADY_COMMITTED`, `422 REVISION_NOTE_REQUIRED`, `429` |
| `POST /api/v1/revision-rounds/{id}/freeze` | exact note set/hash; buyer/system ETag/key | `RevisionRoundResponse`; frozen seller-work state | `403`, `409 ROUND_EXPIRED|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/revision-rounds/{id}/redeliveries` | new artifact set/digest and note resolutions; seller/key | `RevisionRoundResponse`; valid/identical/rejected allowance result | `403`, `409 ROUND_NOT_FROZEN|REVISION_RACE`, `422`, `429` |
| `POST /api/v1/engagements/{id}/change-orders` | scope/price/payment delta/expiry/allowance delta; seller or buyer-proposed/key | `201 ChangeOrderResponse`; mini-quote/version | `403`, `409`, `422`, `429` |
| `POST /api/v1/change-orders/{id}/accept` | exact terms/material acknowledgements/payment token; eligible counterparty/key | `201 ChangeOrderResponse`; accepted scope/payment/version | `403 SELF_ACCEPTANCE_FORBIDDEN`, `409 QUOTE_EXPIRED|VERSION_CONFLICT`, `422`, `429`, `503 PAYMENT_AUTH_FAILED` |

Requirement/SLA reads are 120/min; submissions/evaluations 60/min; clock events 30/min; milestone/revision 60/min; change orders 20/hour/engagement. Private requirements/artifacts/notes/prices are no-store and excluded from events/logs.

## Persistence, RLS and Workers

Tables: `service.requirement_items`, `requirement_submissions`, `sla_clock_events`, `milestones`, `milestone_deliveries`, `revision_rounds`, `revision_notes`, `change_orders` and audit events. Quote source/version is immutable across all rows.

RLS is engagement buyer/seller/scoped contributor bound. Requirement pass RPC locks all items and starts clock atomically. Timer workers use database time and attributed awaited-act versions. Revision scheduler grants deadline+120-second acceptance precedence to timely received revision. Change-order acceptance authorizes payment idempotently and versions scope without rewriting accepted quote.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Requirement gate | `collecting → evaluating → passed|rejected`; rejected `→ collecting` through round three, then `→ deadlocked`; passed is frozen unless accepted change order appends requirements | Complete item hashes/evaluation trigger. Mechanical incompleteness rejects atomically; third failure yields no-fault deadlock/full return/no kill fee. |
| SLA clock | `not_started → running ↔ paused`; running `→ met|breached|stopped`; any event may be `contested` append-only | Requirement pass starts; only named buyer-owed act pauses and that act resumes with attributed due shift. Invalid clock cause/order blocks. |
| Milestone | `pending → active → delivered → accepted|revision_requested`; accepted activates next sequential milestone | Complete artifact/QC delivery and eligible buyer decision trigger. Prior incomplete milestone, partial artifact set or mandatory QC failure blocks. |
| Revision round | `open → frozen → redelivered → resolved|rejected`; open auto-freezes at governed deadline; any round may become `superseded` by accepted change/exit | First exact-artifact note opens, explicit/timer freeze hands control to seller. Redelivery before freeze, identical file or race blocks/does not consume allowance as specified. |
| Change order | `draft → issued → accepted|declined|expired|superseded|void`; acceptance may be `payment_pending` until reconciled | Complete mini-quote and counterparty acknowledgment/provider evidence trigger. Pending order never pauses final auto-accept; stale/expired/self-acceptance blocks. |

Every unlisted transition returns the typed state/version/clock conflict. Events omit requirement values, artifacts, revision notes and prices.

## Failure, Deepening and Ambiguity Gate

Tests cover requirement injection, off-platform links, mechanical-vs-artistic verdict, three-reject deadlock, upstream in-flight suppression, clock pause abuse, milestone rights transfer, note dripping, empty/identical redelivery allowance, revision/accept race, assistant scope ruling and pending change-order auto-accept pause. Seven passes converge; two implementers receive identical gate, clock, milestone, revision and change-order behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Requirements/SLA/revision contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
- [[specs/ia/deep-dives/14-services-marketplace|Deep Dive 14 — Services marketplace lifecycle]]
- [[specs/be/14a-service-listings-quotes-engagements|Service listings, quotes and engagement creation — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/09d-sessions-delivery-readiness|Project sessions, delivery, QC and readiness — Backend Specification]]
