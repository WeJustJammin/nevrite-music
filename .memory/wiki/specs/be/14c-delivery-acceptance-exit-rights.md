# Final delivery, acceptance, exit settlement, recall and rights execution — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]  
**Deep Dive:** [[specs/ia/deep-dives/14-services-marketplace|Services marketplace deep dive]]  
**Rights Boundary:** [[specs/be/10c-title-control-conflicts-freezes|Chain of title and control]]

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

- **Shard split:** 3 of 5; SRV-10, SRV-11, SRV-12, SRV-13 and SRV-16. Money, rights and credits remain separate atomic legs; Shard 14 never holds money outside provider contracts.
- **Boundary:** complete frozen delivery, QC/declarations, explicit/auto acceptance race, atomic payment-rights-credit coordination, exit settlement and post-terminal recall.
- **Approval:** Recommended split accepted under standing autonomy.

## Delivery and Exit Invariants

- Final delivery requires complete frozen artifact set/digests plus source, AI and human-performance declarations and seller payout-readiness. Partial set remains draft; mandatory QC failure is not delivery.
- Technical/QC engine outage fails open with explicit unverifiable state; watermark outage fails closed to streaming-only. Platform never promises artistic quality, leak prevention, legal effect, union enforcement or AI detection.
- Acceptance window is contract-selected within code-owned 3-business-day floor and 30-calendar-day ceiling. Revision received through deadline+120 seconds wins ties. Auto-accept rechecks no timely revision/extension/retraction and uses actual fire time, never backdates.
- Explicit accepter is eligible non-seller buyer authority. Acceptance saga uses frozen quote/artifact facts and stable leg IDs for payment release, Shard 10 rights execution and Shard 07 credit emission; all commit or all compensate/rollback after retries `2s/8s/32s` and human page.
- Rights posture has no default. Final execution reads frozen master/composition elections/artifact digests plus live Shard 10 aggregate allocation only; no listing reinterpretation. AI-generated part emits no performance credit.
- Exit kinds are distinct `buyer_cancel|seller_cancel|abandonment|mutual_release`. Delivery received first wins against cancellation. Settlement has four named legs: consumed fee/kill, refund, expenses 100% zero-take, rights disposition.
- Abandonment timer starts from awaited act, resets only by that act and permits one consented extension. Automatic result uses kill schedule, never full amount; points-only exit creates rights disposition only. Seller fault has no reverse kill fee.
- Recall is bounded post-terminal support and never reopens acceptance, payment or transferred rights.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/engagements/{id}/deliveries` | complete artifact manifest/digests/declarations/acceptance window; seller/key | `201 DeliveryResponse`; draft/QC state/version | `403`, `409 SOURCE_STALE`, `422 DELIVERY_INCOMPLETE`, `429` |
| `POST /api/v1/deliveries/{id}/publish` | exact artifact/QC/declaration/payout-readiness hashes; seller ETag/key | `DeliveryResponse`; delivered/window/version | `403`, `409 PAYOUT_NOT_READY|VERSION_CONFLICT`, `422 QC_FAILED`, `428`, `429` |
| `POST /api/v1/deliveries/{id}/accept` | exact delivery/terms/delta and authority; eligible buyer/key | `202 AcceptanceResponse`; saga/leg IDs/state | `403 SELF_ACCEPTANCE_FORBIDDEN`, `409 REVISION_RACE|VERSION_CONFLICT`, `422`, `429`, `503` |
| `POST /internal/v1/deliveries/{id}/auto-accept` | due delivery/version/event ID; timer worker/key | `202 AcceptanceResponse`; auto saga or no-op reason | `403`, `409 EVENT_REUSED|TIMELY_REVISION_EXISTS`, `429`, `503` |
| `GET /api/v1/acceptances/{id}` | buyer/seller | `AcceptanceResponse`; explicit/auto state and leg evidence classes | `403`, `404`, `429`, `503` |
| `POST /api/v1/engagements/{id}/exit-preflights` | exit kind/fault/source versions; authorized party/key | `ExitSettlementResponse`; four-leg calculation/bases/gaps | `403`, `409 DELIVERY_ALREADY_RECEIVED`, `422 EXIT_INVALID`, `429` |
| `POST /api/v1/engagements/{id}/exits` | exact preflight hash/authority/mutual consent if needed; party/key | `202 ExitSettlementResponse`; settlement instruction/terminal state | `403`, `409 SOURCE_STALE`, `422`, `429`, `503` |
| `POST /api/v1/engagements/{id}/abandonment-events` | awaited act/timeout/extension evidence; authorized party ETag/key | `AbandonmentResponse`; attributed timer/version | `403`, `409 INVALID_AWAITED_ACT|EXTENSION_USED`, `422`, `428`, `429` |
| `POST /api/v1/engagements/{id}/recalls` | support kind/evidence within quote window; party/key | `201 RecallResponse`; bounded task/count/state | `403`, `409 RECALL_WINDOW_CLOSED|RECALL_LIMIT`, `422`, `429` |

Delivery reads/writes are 120/min and 20/hour; acceptance 10/hour with step-up/100% audit; exits 10/hour; recalls quote-bounded. Private artifacts/declarations/economics are no-store and omitted from events/logs.

## Persistence, RLS and Workers

Tables: `service.deliveries`, `delivery_artifacts`, `performance_declarations`, `source_warranties`, `acceptances`, `acceptance_legs`, `rights_elections`, `rights_executions`, `exit_settlements`, `abandonment_events`, `recalls` and audit events.

RLS is engagement party/scoped worker bound. Delivery publication locks complete manifest. Acceptance coordinator serializes against revision, creates stable payment/rights/credit legs, retries complete set, compensates every successful leg if another fails, preserves delivered state and pages human. Exit calculator uses frozen quote schedules and never initiates money outside provider adapter.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Final delivery | `draft → qc_pending → deliverable|qc_failed|unverifiable`; deliverable/unverifiable `→ delivered`; delivered `→ acceptance_pending|revision_requested|retracted` | Complete frozen manifest/declarations/QC and seller publish trigger. Partial set, payout-not-ready or mandatory QC failure blocks; QC outage may yield explicit unverifiable, watermark outage streaming-only. |
| Acceptance saga | `pending → running → committed|compensating|human_review`; compensating `→ rolled_back|human_review`; committed is terminal | Eligible buyer/auto timer and stable payment-rights-credit legs trigger. Timely revision wins; any failed leg retries then compensates all successful legs before terminal truth. |
| Rights execution | `pending → applied|failed|unknown`; failed/unknown retry under stable leg ID; applied `→ compensated` only with whole-saga rollback | Frozen elections/artifact hashes plus live Shard 10 aggregate trigger. Missing posture/allocation or AI-performance mismatch blocks; no listing default is used. |
| Exit settlement | `preflight → pending → applied|failed|unknown`; applied yields engagement terminal exit | Authorized distinct exit kind and exact four-leg calculation trigger. Delivered-first race, stale source or missing mutual consent blocks; result never claims payment outside adapter evidence. |
| Abandonment timer | `inactive → running → extended|satisfied|expired|cancelled`; extended `→ running` once; running resets only on named awaited act | Attributed awaited-act event/time triggers. Unrelated activity cannot reset and a second extension is forbidden. |
| Recall | `open → resolved|expired|cancelled`; terminal recall never reopens engagement/acceptance/payment/rights | In-window bounded support request and resolution/timer trigger. Closed window or exhausted count blocks. |

Every unlisted transition returns the typed state/version/race conflict. Events omit artifacts, declarations and economics while preserving leg evidence classes.

## Failure, Deepening and Ambiguity Gate

Tests cover dummy/partial delivery, QC/watermark outage, revision grace race, auto-accept backdating, self-accept, partial saga/compensation, mutable listing rights, AI performance-credit claim, delivery/cancel race, full-amount abandonment, seller reverse kill fee, points-only cash debt and recall reopening. Seven passes converge; two implementers receive identical delivery, acceptance, exit and rights behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Delivery, acceptance, exit and rights contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
- [[specs/ia/deep-dives/14-services-marketplace|Deep Dive 14 — Services marketplace lifecycle]]
- [[specs/be/10c-title-control-conflicts-freezes|Chain of title, control, conflicts and freeze instructions — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/07a-credit-assertions-visibility|Credit assertions, visibility and graph — Backend Specification]]
- [[specs/be/14b-requirements-sla-milestones-revisions|Service requirements, SLA, milestones, revisions and change orders — Backend Specification]]
