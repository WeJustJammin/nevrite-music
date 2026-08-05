# Gear offers, cart eligibility and checkout commitment — Backend Specification

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

- **Shard split:** 1 of 5; 26.01, 26.02, 26.03, 26.04 and 26.05.
- **Boundary:** private offers/counters, non-reserving mixed-intent carts, checkout grouping, eligibility resolution, atomic claims, payment authorization and independent order creation.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 26 IA/deep dive | offer force, cart intent, checkout grouping, claim-before-charge and order atomicity |
| Shards 01 and 25 | acting-party authority, pinned listing truth and inventory arbitration |

## Offer and Checkout Invariants

- Offers are private, structured and item-price-only. Delivered-cost context is informative until checkout; a pending or countered offer never reserves inventory.
- Offer acceptance uses the same atomic inventory claim as Buy Now, starts a configured checkout deadline and terminally voids competing offers only after the claim wins.
- Cart is a durable intent list without inventory authority. Lines are never silently dropped and shipped, pickup, digital or incompatible destination/regime lines are split into explained checkout groups.
- Eligibility itemizes item price, tax, shipping/freight, coverage, voltage, policy, screening and other governed costs or reasons per shipment. Ineligible lines remain in cart with remediation.
- Checkout reconfirms the actual winning set before authorization. Losing or stale lines are removed before charge; authorization covers only independently created orders and no half-order aggregate commits.
- Buying-party selection requires current organization control; clicking user remains the immutable actor. Self-dealing and seller-as-buyer authority confusion are denied.
- Multi-party payment/payout topology is unreachable until B3 counsel and provider evidence gates pass. Provider ambiguity remains pending and retries never duplicate authorization or orders.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/gear-offer-threads` | listing/price version/amount/currency/expiry/destination context/key; eligible buyer | `201 GearOfferResponse`; private pending offer/version | `403 SELF_DEALING|ROUTE_INELIGIBLE`, `409 LISTING_CHANGED`, `422`, `429` |
| `POST /api/v1/gear-offer-threads/{id}/responses` | action/counter amount/expected thread+offer versions/key; buyer or controlling seller by turn | `GearOfferResponse`; countered/declined/accepted/voided | `403`, `409 OFFER_STALE|CLAIM_LOST|VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /api/v1/gear-cart` | acting account/party; authenticated actor | `GearCartResponse`; intents/groups/gaps/freshness | `403`, `429` |
| `PUT /api/v1/gear-cart/intents/{listingId}` | listing/price version/quantity/destination-mode hint/key; authenticated actor | `GearCartResponse`; durable intent/version | `403`, `409 LISTING_CHANGED`, `422`, `429` |
| `DELETE /api/v1/gear-cart/intents/{listingId}` | expected cart version/key; authenticated actor | `204`; intent removed | `403`, `409 VERSION_CONFLICT`, `428`, `429` |
| `POST /api/v1/gear-checkout/groups` | buying party/destination/selected intents/versions/key; authorized buyer | `201 CheckoutGroupResponse`; compatible groups/itemized eligibility/gaps/deadline | `403`, `409 SOURCE_STALE`, `422 NO_ELIGIBLE_LINES`, `429` |
| `POST /api/v1/gear-checkout/groups/{id}/refreshes` | group/source versions/key; authorized buyer | `CheckoutGroupResponse`; refreshed totals/reasons/version | `403`, `409 GROUP_EXPIRED`, `422`, `429` |
| `POST /api/v1/gear-checkout/groups/{id}/commitments` | prepared group/version/payment method/claims/acknowledgements/key; authorized buyer; B3 capability admitted | `201 CheckoutCommitResponse`; created orders/authorization/removed losers | `403 B3_GATE_CLOSED`, `409 CLAIM_LOST|STALE_PRICE|GROUP_CHANGED`, `422`, `428`, `429`, `503 PAYMENT_PENDING` |

## Persistence, RLS and Workers

- `offer_thread`, immutable offers/responses, `cart_intent`, `checkout_group`, eligibility line, inventory claim refs, payment intent and order creation journal pin actor, source, policy and provider versions. Money uses exact integer minor units and currency.
- RLS exposes offer threads only to buyer/seller parties, carts/groups only to acting buyer party and order-creation journals to purpose-scoped services. Payment tokens and provider payloads remain server-only.
- Offer expiry, group refresh and payment reconciliation workers consume transactional-outbox events idempotently. Canonical claim/order state wins over late provider callbacks; duplicate callbacks no-op.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Offer thread | `pending → countered|accepted|declined|expired|voided`; countered `→ countered|accepted|declined|expired|voided` | Alternating buyer/seller response and timer trigger. Pending/countered does not reserve; acceptance first wins inventory claim, then voids competitors. |
| Cart intent | `active → removed|stale|ineligible`; stale/ineligible `→ active` after explicit refresh/remediation | Buyer add/remove and listing/route changes trigger. Lines never silently disappear and cart has no inventory authority. |
| Checkout group | `prepared → refreshed|expired|changed`; prepared/refreshed `→ committing` | Compatible fulfilment grouping/itemized eligibility and source refresh trigger. Ineligible lines remain explained; stale/losing lines are removed before charge. |
| Checkout commitment | `committing → payment_pending → orders_created|failed|unknown`; unknown `→ orders_created|failed` by reconciliation | Actual winning claim set, B3 gate, authority/acknowledgments and stable provider operation trigger. No partial charge/half-order aggregate or duplicate authorization/order. |

Every unlisted transition returns the typed state/version/claim conflict. Actor and buying party remain distinct and self-dealing is denied.

## Failure, Deepening and Ambiguity Gate

Tests cover offer reservation, stale acceptance, competing-offer void before win, silent cart deletion, mixed fulfilment group, hidden delivered cost, partial charge, half-created order, acting-party confusion, B3 bypass and duplicate provider callback. Seven passes converge; two implementers receive identical offer and checkout behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Offer, cart and checkout contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
- [[specs/ia/deep-dives/26-gear-commerce-fulfilment|Deep Dive 26 — Gear commerce fulfilment]]
- [[specs/be/01c-relationships-authority-governance|Relationships, authority and governance — Backend Specification]]
- [[specs/be/25b-gear-listing-disclosure-lifecycle|Gear listing disclosure, evidence and lifecycle — Backend Specification]]
- [[specs/be/25c-gear-inventory-bulk-channels|Gear inventory claims, bundles, bulk listing and channels — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
- [[specs/ia/deep-dives/26-gear-commerce-fulfilment|Deep Dive 26 — Gear transactions, fulfilment and possession models]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/25b-gear-listing-disclosure-lifecycle|Gear listing disclosure, evidence and lifecycle — Backend Specification]]
- [[specs/be/25c-gear-inventory-bulk-channels|Gear inventory claims, bundles, bulk listing and channels — Backend Specification]]
