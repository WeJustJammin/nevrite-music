# Gear damage, returns, settlement and ownership transfer — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]  
**Deep Dive:** [[specs/ia/deep-dives/26-gear-commerce-fulfilment|Gear commerce fulfilment deep dive]]

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

- **Shard split:** 3 of 5; 26.11, 26.12, 26.13, 26.14, 26.15 and 26.16.
- **Boundary:** timely damage/return remedies, returned-unit inspection, exactly-once financial settlement and asynchronous compensating ownership events.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 26 IA/deep dive | remedy race, settlement/title ordering and registry retry contracts |
| Shards 06, 14 and 23 | disputes/evidence, repair inspection and canonical title history |

## Remedy and Transfer Invariants

- Return and damage are distinct case types with reason-specific statutory/policy basis, evidence, freight payer and deadlines. Timely filing protects remedy even if processing occurs later.
- A timely damage claim atomically suspends settlement and ownership-transfer emission. Tie with auto-settle resolves to the claim; later filing becomes a post-settlement case without rewriting history.
- Buyer remedy never depends on seller cooperation, carrier/insurer recovery or duty reclaim. Platform makes no insurer or warranty promise.
- Return inspection compares custody-boundary evidence and emits attributed condition delta. Diminished-value analysis may change refund amount under lawful policy but never refuse intake solely because seller disputes condition.
- Conflicting evidence routes to bounded dispute while clocks remain visible and governed. Support uses enumerated case commands, purpose grants and immutable audit; high-value exceptions require dual control.
- Delivery is not settlement, payment is not ownership, and settlement does not wait for registry availability. Settlement closes money exactly once while evidence remains open under retention policy.
- One transfer intent is emitted per settled line/canonical unit. Registry collision appends contested state and never misattaches; outage retries asynchronously without delaying payout.
- Completed return/rescission emits a compensating event referencing the original transfer. Refund never waits for registry append; chargeback without object return never fabricates returned title.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/gear-orders/{id}/damage-cases` | line/type/reason/evidence/capture times/expected order version/key; buyer | `201 DamageCaseResponse`; protected filing/settlement-title hold | `403`, `409 DEADLINE_STATE_RACE|CASE_EXISTS`, `422`, `429` |
| `POST /api/v1/gear-orders/{id}/return-cases` | line/reason/statutory-policy basis/evidence/key; buyer or authorized case actor | `201 ReturnCaseResponse`; authorization/freight payer/deadlines | `403`, `409 CASE_EXISTS`, `422 RETURN_INELIGIBLE`, `429` |
| `POST /api/v1/gear-return-cases/{id}/shipment-events` | carrier/manual event/evidence/expected version/key; authorized party or adapter | `ReturnCaseResponse`; in-transit/received/freshness | `403`, `409 EVENT_REUSED|VERSION_CONFLICT`, `422`, `429` |
| `POST /api/v1/gear-return-cases/{id}/inspections` | custody evidence/condition delta/remedy calculation/expected version/key; authorized inspector | `ReturnInspectionResponse`; full/partial/diminished proposal or dispute | `403`, `409 EVIDENCE_CONFLICT|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/gear-cases/{id}/remedy-elections` | remedy/amount/evidence/expected version/key; authorized buyer or case adjudicator by policy | `GearRemedyResponse`; selected remedy/refund state | `403`, `409 VERSION_CONFLICT`, `422 REMEDY_UNAVAILABLE`, `428`, `429` |
| `POST /internal/v1/gear-order-lines/{id}/settlements` | delivery/remedy/dispute/payment versions/event key; settlement worker; B3 capability admitted | `SettlementRecordResponse`; settled money/outbox version | `403 B3_GATE_CLOSED`, `409 HOLD_ACTIVE|EVENT_REUSED|STATE_CHANGED`, `429`, `503 PAYOUT_RECONCILIATION_REQUIRED` |
| `POST /internal/v1/gear-settlements/{id}/transfer-intents` | line/unit/composite identity/from-to parties/settled time/key; settlement worker | `201 OwnershipTransferIntentResponse`; queued/contested | `403`, `409 INTENT_EXISTS|IDENTITY_COLLISION`, `422`, `429` |
| `POST /internal/v1/gear-transfer-intents/{id}/attempts` | intent/registry version/event key; registry worker | `OwnershipTransferIntentResponse`; applied/contested/retry | `403`, `409 EVENT_REUSED|REGISTRY_CONFLICT`, `429`, `503` |
| `POST /internal/v1/gear-transfer-intents/{id}/reversals` | completed return/rescission/original transfer/parties/key; remedy worker | `201 OwnershipTransferIntentResponse`; compensating intent | `403`, `409 REVERSAL_EXISTS|RETURN_INCOMPLETE`, `422`, `429` |

## Persistence, RLS and Workers

- `damage_case`, `return_case`, evidence/inspection/remedy events, immutable `settlement_record`, ownership transfer intent/attempt/reversal and exception-command audit pin source, actor, policy and provider versions.
- RLS exposes cases to order parties and case-bound roles; settlement money to authorized parties/finance services; transfer intents to registry workers and affected parties without private payment payloads.
- Deadline, refund, settlement and registry workers are idempotent. Settlement transaction writes money terminal state and outbox atomically; payout/provider failure becomes human reconciliation and never reopens settlement.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Damage case | `open → evidence_pending → remedy_pending|disputed|closed`; timely open places `settlement_hold|transfer_hold`; post-settlement open remains separate | Buyer timely filing/Shard 06 evidence trigger. Tie beats auto-settle; later case never rewrites settlement history. |
| Return case | `authorized → in_transit → received → inspecting → remedy_pending|disputed → completed|closed`; shipment may become lost/unknown | Policy/statutory basis, carrier/manual evidence and custody-boundary inspection trigger. Seller dispute cannot refuse intake alone. |
| Remedy | `proposed → elected → refund_pending|replacement_pending|repair_pending|denied`; pending `→ completed|failed|unknown` | Authorized buyer/adjudicator under enumerated policy triggers. Buyer remedy never waits for seller/carrier/insurer cooperation. |
| Settlement | `pending → held|settling → settled|reconciliation_required`; held `→ settling` after exact hold release; settled is money-terminal | Delivery/remedy/dispute/payment versions and B3 capability trigger. Money closes exactly once; payout failure never reopens settlement. |
| Ownership transfer intent | `queued → attempting → applied|contested|retry`; applied `→ reversed` only by compensating intent after completed return/rescission | One per settled canonical unit and registry evidence trigger. Collision never misattaches; outage never delays payout/refund. |

Every unlisted transition returns the typed state/version/remedy conflict. Delivery, settlement, payment and title remain distinct facts.

## Failure, Deepening and Ambiguity Gate

Tests cover claim/auto-settle tie, late claim rewrite, seller-gated refund, insurer recovery dependency, return refusal, conflicting evidence timeout, duplicate payout, settlement waiting on registry, collision misattachment, refund waiting on reversal and chargeback-as-title-return. Seven passes converge; two implementers receive identical remedy, settlement and transfer behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Remedy, settlement and transfer contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
- [[specs/ia/deep-dives/26-gear-commerce-fulfilment|Deep Dive 26 — Gear commerce fulfilment]]
- [[specs/be/06a-case-intake-evidence|Case intake and evidence — Backend Specification]]
- [[specs/be/14e-repair-inspection-custody|Repair, inspection and custody — Backend Specification]]
- [[specs/be/23a-gear-identity-claims-transfers|Gear identity, ownership claims, transfers and provenance — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
- [[specs/ia/deep-dives/26-gear-commerce-fulfilment|Deep Dive 26 — Gear transactions, fulfilment and possession models]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/14e-repair-inspection-custody|Repair, inspection, custody and damage evidence — Backend Specification]]
- [[specs/be/23a-gear-identity-claims-transfers|Gear identity, ownership claims, transfers and provenance — Backend Specification]]
