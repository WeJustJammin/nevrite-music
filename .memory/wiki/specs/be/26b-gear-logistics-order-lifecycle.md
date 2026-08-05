# Gear freight, shipment and order lifecycle — Backend Specification

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

- **Shard split:** 2 of 5; 26.06, 26.07, 26.08, 26.09 and 26.10.
- **Boundary:** freight quote separation, domestic shipment commitment, order state/clocks, buyer-elected disclosure amendments and dispatch/delivery evidence.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 26 IA/deep dive | freight classification, shipment evidence, order state machine, amendment and delivery clocks |
| Shards 04, 14 and 25 | governed evidence, service sequencing and pinned listing disclosure |

## Logistics and Order Invariants

- Freight/oversize classification has no silent parcel fallback. Quote request is purpose-bound, holds neither inventory nor payment and must revalidate validity, coverage and requirements at checkout/commit.
- Launch routing is domestic and admitted-provider-supported only. Platform brokers evidence/options and never represents itself as carrier, insurer or customs agent.
- Shipment pins origin/destination snapshots, package facts, freight class, quote/coverage versions, packing standard and delivery requirements. Exact addresses are purpose-limited private data.
- Order and order-line transitions use an explicit versioned state machine. Concurrent clocks remain separately visible; every stall has a policy-versioned automatic resolution, while messaging silence alone never pauses a clock.
- Offline commands retain client command ID and expected version. Stale commands fail loudly with canonical state; they never replay over a newer transition.
- Material seller disclosure change before dispatch atomically pauses dispatch. Buyer alone elects accept, accept reduction or void/full refund; no answer resolves toward void under the configured deadline.
- Dispatch evidence is append-only and packing-complete. Verified delivery starts inspection/settlement clocks; carrier silence remains unknown and misdelivery starts recall/refund rather than delivery fiction.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/gear-logistics/freight-quotes` | route/package facts/destination/requirements/key; order party | `202 FreightQuoteResponse`; pending/ready/options/validity | `403`, `409 REQUEST_REUSED`, `422 FREIGHT_FACTS_REQUIRED`, `429` |
| `GET /api/v1/gear-logistics/freight-quotes/{id}` | request; order party | `FreightQuoteResponse`; state/options/requirements/freshness | `403`, `404`, `429`, `503` |
| `POST /api/v1/gear-orders/{id}/shipments` | current quote/coverage/package/packing standard/destination versions/key; seller | `201 GearShipmentResponse`; committed shipment/dispatch gaps | `403`, `409 QUOTE_STALE|ORDER_STATE_CHANGED`, `422 COVERAGE_REQUIRED|NO_PARCEL_FALLBACK`, `429` |
| `POST /api/v1/gear-orders/{id}/transitions` | line/command/expected version/offline command ID/evidence/key; authorized actor for command | `GearOrderResponse`; canonical state/clocks/next action | `403`, `409 VERSION_CONFLICT|INVALID_TRANSITION`, `422`, `428`, `429` |
| `POST /api/v1/gear-orders/{id}/amendments` | line/disclosure diff/proposed reduction/expected versions/key; seller | `201 OrderAmendmentResponse`; dispatch hold/options/deadline | `403`, `409 ALREADY_DISPATCHED|VERSION_CONFLICT`, `422 MATERIAL_DIFF_REQUIRED`, `429` |
| `POST /api/v1/gear-orders/{id}/amendments/{amendmentId}/elections` | accept/reduction/void/expected version/key; buyer only | `GearOrderResponse`; amended or void/refund state | `403 BUYER_ONLY`, `409 DEADLINE_EXPIRED|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/gear-shipments/{id}/dispatch-evidence` | packing evidence/carrier booking/expected shipment version/key; seller | `GearShipmentResponse`; dispatched/evidence seal | `403`, `409 PACKING_INCOMPLETE|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /internal/v1/gear-shipments/{id}/carrier-events` | provider event/digest/occurred time/evidence; admitted carrier adapter | `GearShipmentResponse`; canonical delivery/misdelivery/unknown | `403`, `409 EVENT_REUSED|EVENT_OUT_OF_ORDER`, `422`, `429` |

## Persistence, RLS and Workers

- `freight_quote_request`, provider attempts, `shipment`, immutable address snapshot, package, packing evidence, `order_clock`, transition event and amendment/election rows pin policy, actor and provider versions.
- RLS exposes order/logistics data to order parties and purpose-scoped support; exact addresses only at required stage; evidence originals to parties/case reviewers; public projections contain no address or private carrier payload.
- Quote, carrier, clock and amendment-deadline workers are idempotent. Provider ambiguity remains `pending|unknown`; event ordering uses provider occurrence time plus canonical aggregate version.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Freight quote | `requested → pending → ready|failed|unknown|expired`; ready `→ stale|expired` | Purpose-bound provider evidence/validity trigger. Quote holds no inventory/payment and stale/unsupported freight never falls back silently to parcel. |
| Order/line | `created → awaiting_seller → dispatch_ready → dispatched → delivered → inspection → settlement_pending → settled`; branches include `amendment_hold|cancelled|returning|disputed` | Explicit authorized command/evidence and separate policy clocks trigger. Stale offline command fails loudly; messaging silence never pauses clock. |
| Order amendment | `proposed → buyer_pending → accepted|accepted_reduction|voided|expired`; expiry resolves to void/full refund | Material pre-dispatch disclosure diff triggers dispatch hold. Buyer alone elects and no answer never means acceptance. |
| Shipment | `planned → packing → dispatched → in_transit → delivered|misdelivered|lost|unknown`; unknown may reconcile to any evidenced outcome | Complete packing seal/carrier events ordered by occurrence+aggregate version trigger. Carrier silence stays unknown; misdelivery starts recall/refund, never delivery. |
| Order clock | `running → satisfied|expired|superseded`; clock-specific automatic resolution appends canonical transition | Named policy event/time triggers. Clocks remain separately visible and cannot be conflated. |

Every unlisted transition returns the typed state/version/order conflict. Exact addresses and carrier payloads remain purpose limited.

## Failure, Deepening and Ambiguity Gate

Tests cover freight-to-parcel fallback, quote reservation, stale quote dispatch, platform-as-carrier wording, address leakage, clock conflation, offline stale overwrite, seller-selected remedy, no-answer acceptance, incomplete packing dispatch and carrier-silence delivery. Seven passes converge; two implementers receive identical logistics and order lifecycle behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Logistics and order lifecycle contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
- [[specs/ia/deep-dives/26-gear-commerce-fulfilment|Deep Dive 26 — Gear commerce fulfilment]]
- [[specs/be/04b-governed-media-renditions|Governed media renditions — Backend Specification]]
- [[specs/be/14e-repair-inspection-custody|Repair, inspection and custody — Backend Specification]]
- [[specs/be/25b-gear-listing-disclosure-lifecycle|Gear listing disclosure, evidence and lifecycle — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
- [[specs/ia/deep-dives/26-gear-commerce-fulfilment|Deep Dive 26 — Gear transactions, fulfilment and possession models]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/04b-governed-media-renditions|Governed media, rights, renditions and takedown — Backend Specification]]
- [[specs/be/14e-repair-inspection-custody|Repair, inspection, custody and damage evidence — Backend Specification]]
- [[specs/be/25b-gear-listing-disclosure-lifecycle|Gear listing disclosure, evidence and lifecycle — Backend Specification]]
