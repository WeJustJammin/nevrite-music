# Ticket carts, orders and returned-inventory waitlists — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]  
**Deep Dive:** [[specs/ia/deep-dives/35-ticket-products-sales|Ticket products and sales deep dive]]

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

- **Shard split:** 2 of 5; 35.08, 35.09, 35.10 and 35.11.
- **Boundary:** atomic price/inventory holds, idempotent payment-order-ticket commit, private waitlists and source-pool returned inventory offers.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 35 IA/deep dive | cart hold, checkout compensation, private demand and sequential offers |
| Shards 26 and 31 | claim-before-charge, payment ambiguity and settlement payee facts |

## Cart and Order Invariants

- Cart atomically holds exact seat IDs or GA units from named source pool plus exact price/fee version and absolute expiry. Tier may advance for new buyers; held cart price remains fixed.
- Fan limits apply across active cart/order identities under governed anti-abuse policy; no oversell under concurrency.
- Checkout commits payment, order and deterministic ticket identities atomically or compensates/reconciles. Ambiguous provider is bounded pending and grants no usable admission.
- Payee must be eligible and multiparty money effects remain behind B3 counsel/provider gate.
- Waitlist entry is private with quantity/all-or-partial preference and consent. Position is never disclosed.
- Returned units stay tied to exact source pool and are offered sequentially in bounded batches. Claim moves permitted quantity into cart; expiry advances without public release.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/ticket-carts` | fan/session/source pool/units/price version/key; eligible fan | `201 TicketCartResponse`; held units/total/absolute expiry | `403`, `409 INVENTORY_UNAVAILABLE|PRICE_VERSION_STALE`, `422 LIMIT_EXCEEDED`, `429` |
| `POST /api/v1/ticket-carts/{id}/checkout` | cart/all-in total/payment/payee/holder/key; cart owner; B3 admitted where applicable | `201 TicketOrderResponse`; order/ticket refs or reconcile state | `403 B3_GATE_CLOSED`, `409 HOLD_EXPIRED|TOTAL_MISMATCH|PAYEE_INELIGIBLE`, `422 PAYMENT_AMBIGUOUS`, `429` |
| `GET /api/v1/ticket-orders/{id}` | order; holder/controller | `TicketOrderResponse`; payment/order/tickets/freshness | `403`, `404`, `429` |
| `POST /api/v1/ticket-waitlists` | fan/source pool/quantity/partial preference/consent/key; eligible fan | `201 TicketWaitlistResponse`; private entry/state | `403`, `409 ENTRY_EXISTS`, `422`, `429` |
| `POST /api/v1/ticket-waitlist-offers/{id}/claims` | offer/code/requested quantity/key; offered fan | `201 TicketCartResponse`; source-pool cart/expiry | `403`, `409 OFFER_EXPIRED|ALLOCATION_EXHAUSTED`, `422 QUANTITY_NOT_PERMITTED`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Ticket cart | `active -> checkout_pending|expired|abandoned`; `checkout_pending -> converted|active|reconciliation_required`; `reconciliation_required -> converted|released` | Checkout atomically claims held units and starts the committed payment attempt; definitive failure restores an unexpired cart, ambiguity enters reconciliation, and success converts once. Expired/released holds return exact units to their source pool. |
| Payment attempt | `initiated -> succeeded|failed|unknown`; `unknown -> succeeded|failed` | Provider result or bounded reconciliation resolves the committed attempt. Unknown grants no admission and cannot be retried as a new charge; the same provider/idempotency identity must be reconciled. |
| Ticket order | `pending_payment -> confirmed|failed|reconciliation_required`; `reconciliation_required -> confirmed|failed` | Atomic payment/order/ticket commit confirms once; compensation records failure, while ambiguous outcomes remain bounded reconciliation. Tickets remain unusable until confirmed and duplicate confirmation is idempotent. |
| Waitlist entry | `active -> offered|withdrawn|fulfilled`; `offered -> active|fulfilled|withdrawn` | Sequential source-pool return creates one private bounded offer; expiry returns the entry to active, claim fulfils permitted quantity, and consent withdrawal terminates it. Position is never projected. |
| Waitlist offer | `active -> claimed|expired|declined`; `claimed|expired|declined -> active` is forbidden | A valid single-use claim atomically moves permitted units into a cart; TTL or explicit decline returns unused units to the source pool. Terminal offers reject replay with `409 OFFER_EXPIRED` or equivalent consumed-state error. |
| Source-pool return | `queued -> offered|released`; `offered -> claimed|queued` | The worker offers sequentially in bounded batches; offer expiry requeues without public release, successful claim ties units to the new cart, and exhausted waitlist releases them to normal inventory. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; any operation that could duplicate a charge, order, ticket or inventory decrement returns `409 DUPLICATE_COMMIT`.

## Persistence, RLS and Workers

- Cart/seat-or-quantity holds, price snapshot, payment/order/ticket journal, reconcile attempts, waitlist entry/offer and source-pool return rows pin exact versions.
- RLS exposes own cart/order/tickets/waitlist only to fan/support-purpose roles; payee/provider data remains server-side and waitlist position has no projection.
- Cart expiry, payment reconcile, source-pool return and waitlist offer workers are idempotent; retries never duplicate order, ticket or inventory decrement.

## Failure, Deepening and Ambiguity Gate

Tests cover tier repricing held cart, seat/GA oversell, duplicate checkout, ambiguous-payment ticket use, ineligible payee, B3 bypass, public waitlist position, wrong-pool return, public returned release and partial preference violation. Seven passes converge; two implementers receive identical cart, order and waitlist behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|---|
| 2026-08-03 | Ticket cart, order and waitlist contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
- [[specs/ia/deep-dives/35-ticket-products-sales|Deep Dive 35 — Ticket products and sales]]
- [[specs/be/26a-gear-offers-cart-checkout|Gear offers, cart eligibility and checkout commitment — Backend Specification]]
- [[specs/be/31d-live-splits-disbursement-tax|Live splits, disbursement obligations and tax evidence — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
- [[specs/ia/deep-dives/35-ticket-products-sales|Deep Dive 35 — Ticket products, sales, access packages and delivery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/26a-gear-offers-cart-checkout|Gear offers, cart eligibility and checkout commitment — Backend Specification]]
- [[specs/be/31d-live-splits-disbursement-tax|Live splits, disbursement obligations and tax evidence — Backend Specification]]
