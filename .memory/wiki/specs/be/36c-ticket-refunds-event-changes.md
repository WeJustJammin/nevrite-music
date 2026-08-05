# Ticket refunds, event cancellation and rescheduling — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]  
**Deep Dive:** [[specs/ia/deep-dives/36-box-office-risk|Box-office risk deep dive]]

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

- **Shard split:** 3 of 5; 36.11, 36.12 and 36.13.
- **Boundary:** individual refund/exchange obligations, blast-radius event cancellation and reschedule/TBC opt-out windows.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 36 IA/deep dive | one-obligation refund, cancellation preview and reschedule expiry |
| Shards 30 and 35 | contractual event authority and ticket/order/holder state |

## Refund and Event-Change Invariants

- Individual refund/exchange pins ticket, holder, original payer/method, policy/cause and unscanned state. One obligation exists per cause/ticket; exchange is atomic.
- Refund returns original charged currency/instrument to original payer unless lawful explicit exception; holder and payer may differ.
- State exposes obligation, method, exact amount and next action. Finance reconciles obligation but cannot rewrite event/ticket evidence.
- Event cancellation requires step-up binding actor, current blast-radius preview and reason. Cancellation plus per-ticket obligations commit atomically; rail failure never rolls back cancellation.
- Reschedule/postpone pins new date or TBC deadline and policy. Wallet/pass updates and opt-out window open; deadline expiry automatically converts to cancellation under pinned policy.
- No fan is silently moved, charged, refunded or stranded outside visible obligation/window state.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/tickets/{id}/refund-or-exchange-evaluations` | holder/payer/policy/cause/expected state/key; holder or support | `201 TicketRemedyResponse`; automatic/excluded/discretionary/options | `403`, `409 ALREADY_SCANNED|ALREADY_REFUNDED`, `422 POLICY_EXCLUDED`, `429` |
| `POST /api/v1/ticket-remedies/{id}/commitments` | selected refund-or-exchange/original method/expected version/key; authorized actor | `TicketRemedyResponse`; obligation or atomic exchange | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/ticket-events/{id}/cancellation-previews` | event/ticket-order scope/reason/version/key; step-up actor | `TicketEventChangePreviewResponse`; blast radius/hash/expiry | `403 STEP_UP_REQUIRED`, `409 ALREADY_TERMINAL`, `422`, `429` |
| `POST /api/v1/ticket-events/{id}/cancellations` | preview hash/reason/expected version/key; step-up actor | `201 TicketEventChangeResponse`; cancelled/obligations/rail states | `403 STEP_UP_REQUIRED`, `409 PREVIEW_STALE|ALREADY_TERMINAL`, `428`, `429` |
| `POST /api/v1/ticket-events/{id}/reschedules` | new date-or-TBC deadline/policy/expected version/key; binding operator | `201 TicketEventChangeResponse`; successor/opt-out window | `403`, `409 VERSION_CONFLICT`, `422 DATE_INVALID|DEADLINE_INVALID`, `428`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Ticket remedy | `evaluated -> excluded|automatic|discretionary`; `automatic|discretionary -> committed`; `discretionary -> declined` | Policy/cause/holder/payer and unscanned-state evaluation selects available outcome; authorized selection commits one obligation or atomic exchange. Scanned/already-refunded tickets and duplicate causes block without creating another obligation. |
| Refund obligation | `pending -> processing|exception_required`; `processing -> paid|failed|unknown`; `failed|unknown -> processing`; `exception_required -> processing|closed` | Original-method rail processing or lawful explicit exception advances the obligation. Unknown remains visible and reconciled under the same identity; no rail result rewrites event/ticket evidence. |
| Atomic exchange | `pending -> committed|failed` | Replacement eligibility, old-ticket invalidation and new-ticket issuance commit together. Any failure leaves the original ticket state unchanged and records no partial exchange. |
| Cancellation preview | `active -> consumed|expired|stale`; `consumed|expired|stale -> active` is forbidden | Matching expected version, blast-radius hash, reason and step-up actor consume once. Source change or TTL invalidates it and returns `409 PREVIEW_STALE`. |
| Ticket event | `scheduled -> rescheduled|postponed|cancelled`; `rescheduled -> rescheduled|postponed|cancelled`; `postponed -> rescheduled|cancelled` | Binding operator commits a successor date/TBC policy or step-up cancellation. Cancellation is terminal; per-ticket obligations commit atomically and later rail failure cannot restore the event. |
| Opt-out window | `scheduled -> open -> closed`; `open -> exercised`; `scheduled|open -> cancelled` | Reschedule/pass-update workflow opens the pinned policy window; holder exercise creates the selected visible remedy. TBC deadline expiry closes the window and triggers the pinned automatic cancellation path. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; destructive mutation of obligations or terminal event state returns `409 IMMUTABLE_EVENT_CHANGE`.

## Persistence, RLS and Workers

- Remedy evaluation/obligation/exchange, cancellation preview/blast radius, event change, ticket obligations and reschedule/opt-out/deadline rows pin policy, actor and source versions.
- RLS exposes own remedy/change state to holder/payer as applicable, finance obligation to finance role and blast-radius internals only to step-up operator.
- Refund rail, pass update, opt-out expiry and automatic cancellation workers are idempotent; rail outcome cannot revert event terminal state.

## Failure, Deepening and Ambiguity Gate

Tests cover duplicate obligation, holder-as-payer assumption, scanned refund, non-atomic exchange, cancellation without preview, rail rollback, silent reschedule, missing opt-out and TBC expiry without cancellation. Seven passes converge; two implementers receive identical refund and event-change behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|---|
| 2026-08-03 | Ticket refund and event-change contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/ia/deep-dives/36-box-office-risk|Deep Dive 36 — Box-office risk]]
- [[specs/be/30d-booking-cancellation-postponement-exclusivity|Booking cancellation, postponement and exclusivity — Backend Specification]]
- [[specs/be/35e-ticket-delivery-transfer-claim|Ticket delivery, pass projection and transfer claim — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/ia/deep-dives/36-box-office-risk|Deep Dive 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/30d-booking-cancellation-postponement-exclusivity|Booking cancellation, postponement and exclusivity — Backend Specification]]
- [[specs/be/35e-ticket-delivery-transfer-claim|Ticket delivery, pass projection and transfer claim — Backend Specification]]
