# BE Spec 35b — Ticket Queues, Carts, Orders, and Waitlists

> Source: [IA Shard 35](../ia/35-ticket-products-sales.md), interactions 35.07–35.11. This companion owns fair queue positions, expiring inventory carts, checkout/order orchestration, waitlist entries, and returned-inventory offers. Inventory blocks and fees are pinned from 35a; payment, fraud, identity, delivery, and admission remain source-owned.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 35](../ia/35-ticket-products-sales.md) | Interactions lines 77–103; Contracts lines 104–126; Data Models lines 127–173; Access Control lines 174–197; Event Schemas and Edge Cases lines 207–247 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 19.01 Ticket Configuration, Scaling & Allocations | BE35B-08–BE35B-09 / 35.08–35.09 |
| 19.02 On-Sale, Announce & Presale Access | BE35B-07, BE35B-10, and BE35B-11 / 35.07 and 35.10–35.11 |

## API Endpoints

Canonical models: `QueuePosition`, `TicketCart`, `WaitlistEntry`, and `TicketOrder`. Canonical events: `ticketing.cart.changed`, `ticketing.order.changed`, and `ticketing.waitlist.offer_changed`.

### Authoritative Route Registry

| Operation ID | IA | Method | Path | Authorization | Idempotency/concurrency | Rate/cache/SLO | CORS policy |
|---|---|---|---|---|---|---|---|
| BE35B-07 | 35.07 | POST | `/api/v1/ticketing/events/{eventId}/queue-entries` | authenticated/anonymous device session under event policy | key binds event/session/device proof | 10/min/session; no-store; p95 300 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35B-08 | 35.08 | POST | `/api/v1/ticketing/events/{eventId}/carts` | admitted queue identity or permitted direct-sale identity | key + manifest/offer digest | 20/min/identity; no-store; p95 500 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35B-09 | 35.09 | POST | `/api/v1/ticketing/carts/{cartId}/checkout` | cart controller + step-up/risk policy | key + cart version/payment intent | 10/min/cart; no-store; 202 <800 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35B-10 | 35.10 | POST | `/api/v1/ticketing/events/{eventId}/waitlist-entries` | eligible identity under event policy | key + identity/event/product scope | 10/hour/identity; no-store; p95 400 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35B-11 | 35.11 | POST | `/api/v1/ticketing/waitlist-offers/{offerId}/claims` | exact offered identity with live token | key + offer/cart versions | 10/min/offer; no-store; p95 600 ms | `BE00-CORS-WEB-CREDENTIALLED` |

Queue admission never promises a precise purchase time or bypasses accessible/policy allocations. Cart creation reserves bounded inventory until database expiry. Checkout produces one order only after confirmed payment authorization/capture policy. Waitlist ordering is policy-versioned and immutable; returned inventory is leased to one offer with a deadline and safely requeues on expiry.

TLS, ULID IDs, request ID, strict JSON, session/device proof, and a 64 KiB body cap are mandatory. Exact consumer origins receive credentialed CORS; payment/risk workers are non-browser. Preflight allows route method plus `OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`; responses are private/no-store and never expose queue population identities or waitlist rank of others.

### Per-Operation Validation Middleware Matrix

This is the validation column of the authoritative route registry: join on the stable operation ID above. Each row runs after BE00 request ID/CORS and authentication admission, before authorization/handler execution; the same registry row supplies the numeric rate and literal CORS policy.

| Operation ID | Validation middleware |
|---|---|
| BE35B-07 | strict path `eventId`, session headers, and `QueueRequest` body; reject unknown keys and validate the success body before serialization |
| BE35B-08 | strict path `eventId`, headers, and `CartRequest` body; reject unknown keys and validate the success body before serialization |
| BE35B-09 | strict path `cartId`, headers, and `CheckoutRequest` body; reject unknown keys and validate the success body before serialization |
| BE35B-10 | strict path `eventId`, headers, and `WaitlistRequest` body; reject unknown keys and validate the success body before serialization |
| BE35B-11 | strict path `offerId`, claim headers, and `ClaimOfferRequest` body; reject unknown keys and validate the success body before serialization |

## Zod 4 Contracts

```ts
const Id=z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const At=z.string().datetime({offset:true});
const Ver=z.number().int().positive();
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
const JsonPrimitive=z.union([z.string(),z.number().finite(),z.boolean(),z.null()]);
const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(()=>z.union([JsonPrimitive,z.array(JsonValueSchema),z.record(z.string(),JsonValueSchema)]));
const ApiError=z.object({code:z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),message:z.string().min(1).max(500),requestId:z.string().uuid(),details:z.record(z.string(),JsonValueSchema).refine(v=>Object.keys(v).length<=16)}).strict();
const QueueRequest=z.object({
  sessionId:Id,deviceProof:z.string().min(32).max(2048),channelRef:Id,
  requestedProductRefs:z.array(Id).min(1).max(20),accessibilityNeedCode:z.enum(['none','wheelchair_space','companion','other'])
}).strict();
const CartLine=z.object({
  inventoryBlockId:Id,quantity:z.number().int().min(1).max(100),
  priceSnapshotId:Id,feeProfileVersion:Ver
}).strict();
const CartRequest=z.object({
  queuePositionId:Id.optional(),manifestVersion:Ver,
  lines:z.array(CartLine).min(1).max(20),currency:z.string().regex(/^[A-Z]{3}$/),
  controllerIdentityId:Id
}).strict().refine(v=>new Set(v.lines.map(x=>x.inventoryBlockId)).size===v.lines.length,{path:['lines'],message:'duplicate block'});
const CheckoutRequest=z.object({
  expectedCartVersion:Ver,paymentIntentRef:Id,billingCountry:z.string().regex(/^[A-Z]{2}$/),
  purchaserIdentityId:Id,attestationRefs:z.array(Id).max(20),
  deliveryPreference:z.enum(['mobile','wallet','will_call','accessible_pickup'])
}).strict();
const WaitlistRequest=z.object({
  identityId:Id,productRef:Id,quantity:z.number().int().min(1).max(100),
  policyVersion:Ver,channelRef:Id,expiresAt:At.optional()
}).strict();
const ClaimOfferRequest=z.object({
  offerToken:z.string().min(32).max(2048),expectedOfferVersion:Ver,
  manifestVersion:Ver,quantity:z.number().int().min(1).max(100)
}).strict();
```

Unknown keys, duplicated lines/entries, stale manifest/fees/policy, invalid device/offer proof, quantity over identity/event/product limit, inaccessible blocks, mismatched currency, expired queue/cart/offer, and raw payment credentials fail before mutation. Totals use checked bigint arithmetic from pinned price/fee snapshots; clients cannot submit a trusted total.

## Persistence and Access Control

```sql
create table queue_positions (
  id text primary key, tenant_id text not null, event_id text not null,
  session_id text not null, identity_id text, device_proof_hash text not null,
  channel_ref text not null, policy_version bigint not null,
  sequence bigint not null, priority_class text not null,
  state text not null check(state in ('waiting','admitted','expired','blocked')),
  admitted_at timestamptz, expires_at timestamptz not null, version bigint not null check(version>0), created_at timestamptz not null,
  unique(event_id,session_id), unique(event_id,sequence)
);
create table ticket_carts (
  id text not null, version bigint not null check(version>0), tenant_id text not null,
  event_id text not null, controller_identity_id text not null,
  queue_position_id text, manifest_version bigint not null,
  line_snapshot jsonb not null, subtotal_minor bigint not null check(subtotal_minor>=0),
  fee_minor bigint not null check(fee_minor>=0), currency char(3) not null,
  state text not null check(state in ('active','checkout_pending','ordered','expired','cancelled')),
  expires_at timestamptz not null, created_at timestamptz not null,
  primary key(id,version)
);
create table waitlist_entries (
  id text primary key, tenant_id text not null, event_id text not null,
  identity_id text not null, product_ref text not null, quantity integer not null check(quantity>0),
  policy_version bigint not null, acceptance_mode text not null
    check(acceptance_mode in ('manual','automatic_no_charge','automatic_confirmed_payment_method')), sequence bigint not null,
  state text not null check(state in ('waiting','offered','claimed','expired','removed')),
  created_at timestamptz not null, unique(event_id,identity_id,product_ref),
  unique(event_id,product_ref,sequence)
);
create table waitlist_offers (
  id text not null, version bigint not null check(version>0),
  waitlist_entry_id text not null references waitlist_entries(id),
  inventory_reservation_id text not null, token_hash text not null unique,
  quantity integer not null check(quantity>0),
  state text not null check(state in ('offered','claimed','expired','revoked')),
  expires_at timestamptz not null, created_at timestamptz not null,
  primary key(id,version)
);
create table ticket_orders (
  id text primary key, tenant_id text not null, event_id text not null,
  cart_id text not null, cart_version bigint not null, purchaser_identity_id text not null,
  payment_intent_ref text not null, payment_state text not null
    check(payment_state in ('authorized','captured','failed','reversed','pending')),
  subtotal_minor bigint not null, fee_minor bigint not null, total_minor bigint not null,
  currency char(3) not null, delivery_preference text not null,
  state text not null check(state in ('pending_payment','confirmed','failed','cancelled','refunded')),
  expires_at timestamptz, version bigint not null check(version>0),
  created_at timestamptz not null, unique(cart_id), unique(payment_intent_ref),
  foreign key(cart_id,cart_version) references ticket_carts(id,version)
);
```

Reservation rows pin inventory block, quantity, cart/offer, expiry, and state with uniqueness preventing oversell. Indexes cover queue waiting sequence/expiry, carts controller/state/expiry, waitlist sequence/state, offer expiry, orders purchaser/state/payment, and reservation block/state/expiry. All tables enable and force RLS. Anonymous queue access uses an opaque signed session projection only. Authenticated callers execute scoped RPCs; no direct base writes/deletes. A controller reads only own carts/orders/waitlist state. Staff access is purpose/capability scoped. Payment and expiry workers have narrow leased rows; payment refs and device/offer hashes are service-only.

## Transactions and State Machines

- BE35B-07 verifies device/session rate and event policy, allocates a monotonic sequence in one transaction, and returns an opaque position/status token. Admission uses weighted-fair policy classes and a CAS transition; reconnect preserves sequence.
- BE35B-08 locks active manifest blocks in sorted order, verifies queue admission and purchase limits across identity/device/payment-risk scopes, creates cart/reservations with one expiry, then commits audit/outbox. Insufficient inventory rolls back every line.
- BE35B-09 locks current cart/reservations, transitions `active -> checkout_pending`, creates/reuses one payment intent, and returns 202. Webhook processing verifies signature/sequence, then atomically commits `TicketOrder`, consumes reservations, and queues 35e ticket delivery. Failure releases inventory exactly once.
- BE35B-10 allocates immutable waitlist sequence under policy; repeated identity/product request returns the existing entry. Removal/expiry is a state transition, never sequence reuse.
- BE35B-11 locks offer/entry/reservation, validates token hash/identity/deadline, creates a cart or consumes into an existing permitted cart, and marks claimed atomically. Expiry returns inventory and advances the next eligible entry in a separate idempotent worker transaction.

Idempotency binds tenant, actor/session, route, aggregate, and canonical body hash for 72 hours. Same key/different body returns `409 IDEMPOTENCY_CONFLICT`; replay returns the stored result. Database time controls all deadlines. Locks are acquired event -> inventory block -> queue/waitlist -> cart/order to avoid deadlocks.

## Events and External Boundaries

| Event | Trigger and payload |
|---|---|
| `ticketing.cart.changed` | cart/reservation transition: `{eventId,cartId,version,state,lineRefs,expiresAt,changeCode,occurredAt}` |
| `ticketing.order.changed` | order/payment transition: `{eventId,orderId,state,paymentState,cartId,ticketQuantity,currency,totalMinorVisibility,occurredAt}` |
| `ticketing.waitlist.offer_changed` | entry/offer transition: `{eventId,entryId,offerId,state,quantity,expiresAt,policyVersion,occurredAt}` |

Transactional outbox, per-aggregate ordering, at-least-once, event-ID dedupe, retry for 24 hours then dead letter. Public/general consumers do not receive identity, device, payment, exact position, price, or offer token.

Payment adapter: 500 ms connect/3 s total, two synchronous retries for pre-intent network failure only; after provider reference exists, poll/webhook recovery prevents duplicate intent. Circuit after 5 failures/min for 2 min; checkout remains pending or safely releases at its explicit deadline. Risk/identity/inventory sources use 2 s, two retries 100/500 ms, and fail closed. Workers lease 60 s/renew 20 s and use destination idempotency keys.

### Exact integration contracts

| Seam | Exact request → response | Timeout, retry/backoff, circuit, and recovery |
|---|---|---|
| Payment adapter | `{orderId,amountMinor,currency,paymentMethodToken,idempotencyKey,returnReceiptUrl}` → `{providerIntentRef,state,authorizedMinor,providerReceipt}` | 500 ms connect/3 s total; at most two pre-intent attempts at 200/800 ms full-jitter backoff; opens after 5 failures/min for 2 min; once a provider ref may exist, no blind resend—webhook/poll reconciliation keeps checkout pending or releases only at its deadline |
| Risk/identity source | `{buyerRef,eventId,quantity,deviceAssertionRef,policyVersion}` → `{decision,reasonCodes,identityClass,policyVersion,expiresAt}` | 2 s total; two attempts at 100/500 ms backoff; opens after 5 failures/30 s for 60 s; unknown/timeout fails closed without identity details in the response |
| Inventory authority | `{eventId,manifestVersion,cartLines,expectedInventoryVersions}` → `{reservationRefs,expiresAt,inventoryVersions}` | 2 s total; two attempts at 100/500 ms backoff; source circuit as above; any partial/conflicting reservation rolls back the whole cart mutation |

## Middleware, Errors, Observability, and Verification

Order: request ID -> TLS/CORS/body/content -> session/auth -> tenant/context -> rate/bot defense -> strict Zod -> event/identity RLS -> queue/limit/risk -> idempotency/If-Match -> transaction -> response schema -> redacted audit. Errors strictly use `ApiError { code, message, requestId, details }`.

| Status/code | Meaning |
|---|---|
| 400 `VALIDATION_FAILED` | malformed line, quantity, currency, token or state |
| 401 `UNAUTHENTICATED` | required identity/session invalid |
| 403 `FORBIDDEN` | known resource but controller/eligibility absent |
| 404 `NOT_FOUND` | absent/concealed cart/entry/offer |
| 409 `VERSION_CONFLICT` | stale cart/offer |
| 409 `INVENTORY_CONFLICT` | atomic reservation unavailable |
| 409 `PURCHASE_LIMIT_REACHED` | identity/event/product limit reached |
| 409 `IDEMPOTENCY_CONFLICT` | key/body mismatch |
| 410 `QUEUE_OR_CART_EXPIRED` | deadline elapsed; re-enter |
| 410 `OFFER_EXPIRED` | offer returned; entry state supplied safely |
| 422 `PAYMENT_FAILED` | provider terminal failure |
| 429 `RATE_LIMITED` | honor `Retry-After` |
| 503 `DEPENDENCY_UNAVAILABLE` | safe pending/release contract applies |

Logs include opaque request/event/aggregate IDs, versions, quantities, state/code, latency, queue class, reservation result, payment attempt state, worker lease, and outbox age; exclude identity, device proof, payment ref, amount, exact rank, token, and inventory topology. Metrics cover admission lag/fairness, reservation conflicts/oversell invariant, cart expiry, checkout conversion/failure, waitlist offer age/claim, latency/errors/circuit/outbox. Availability target 99.95% during sale; p99 queue/cart writes <1 s; oversell target exactly zero; page on reservation invariant breach, due queue admission lag >10 s, payment pending >5 min, or five-minute 5xx >1%.

Tests cover strict schemas, quantity/limit/total arithmetic, device/session replay, fair ordering, reconnect, every route x role/tenant/revocation, RLS/grants, multi-line reservation rollback, concurrent carts/claims/checkouts, cart/offer expiry races, payment webhook signature/order/duplicate, idempotency conflict/replay, adapter retry/circuit/recovery, events privacy/order/duplicates, log redaction, migration/index plans, CORS, and SLO alerts. CI fails on uncovered 35.07–35.11, absent four models/three events, route collision, direct write grant, oversell path, malformed table/link, or secret/payment leakage.

## Exact Typed Success Schemas

Operation comments are the normative route mappings for these strict Zod 4 bodies. Queue and waitlist responses intentionally omit exact rank.

~~~ts
import { z } from "zod";
const Uuid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const Version = z.int().positive();
const Instant = z.iso.datetime({ offset: true });
const RequestId = z.string().min(16).max(128);
const Currency = z.string().regex(/^[A-Z]{3}$/);
// BE35B-07 / 35.07
export const QueuePositionV1 = z.object({
  queuePositionId: Uuid, eventId: Uuid, state: z.enum(["waiting", "admitted", "expired", "blocked"]),
  admissionWindow: z.object({ startsAt: Instant, endsAt: Instant }).strict().nullable(),
  reconnectToken: z.string().min(32).max(512), policyVersion: Version, version: Version, requestId: RequestId,
}).strict();
const CartLine = z.object({ lineId: Uuid, productRef: Uuid, quantity: z.int().positive().max(100), unitMinor: z.bigint(), totalMinor: z.bigint() }).strict();
// BE35B-08 / 35.08
export const TicketCartV1 = z.object({
  cartId: Uuid, eventId: Uuid, lines: z.array(CartLine).min(1).max(100), currency: Currency,
  state: z.enum(["active", "checkout_pending", "ordered", "expired", "cancelled"]), expiresAt: Instant,
  manifestVersion: Version, version: Version, requestId: RequestId,
}).strict();
// BE35B-09 / 35.09
export const TicketOrderV1 = z.object({
  orderId: Uuid, cartId: Uuid, state: z.enum(["pending_payment", "confirmed", "failed", "cancelled", "refunded"]),
  paymentState: z.enum(["pending", "authorized", "captured", "failed", "reversed"]),
  expiresAt: Instant.nullable(), version: Version, requestId: RequestId,
}).strict();
// BE35B-10 / 35.10
export const WaitlistEntryV1 = z.object({
  entryId: Uuid, eventId: Uuid, productRef: Uuid, quantity: z.int().positive().max(100),
  acceptanceMode: z.enum(["manual", "automatic_no_charge", "automatic_confirmed_payment_method"]),
  state: z.enum(["waiting", "offered", "claimed", "expired", "removed"]), joinedAt: Instant,
  policyVersion: Version, requestId: RequestId,
}).strict();
// BE35B-11 / 35.11
export const WaitlistClaimV1 = z.object({
  offerId: Uuid, entryId: Uuid, cartId: Uuid, claimedQuantity: z.int().positive().max(100),
  state: z.literal("claimed"), expiresAt: Instant, version: Version, requestId: RequestId,
}).strict();
~~~

## Per-Operation Auditability Closure

Every failure is BE00 `ApiError { code, message, requestId, details }`; safe details exclude identity/device proof, payment reference, exact queue/waitlist rank, offer token, price, and inventory topology. Unknown faults are `500 INTERNAL_ERROR`; rate denial is `429 RATE_LIMITED` with `Retry-After`.

| Operation | Exact request → success contract | Exact errors and deterministic recovery | Required observability | Required operation tests |
|---|---|---|---|---|
| BE35B-07 | `QueueRequest` → 201/200 `QueuePositionV1 { queuePositionId,eventId,state,admissionWindow nullable,reconnectToken,policyVersion,version,requestId }` | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED when required; 403 FORBIDDEN; 404 NOT_FOUND; 409 PURCHASE_LIMIT_REACHED or IDEMPOTENCY_CONFLICT; 410 QUEUE_OR_CART_EXPIRED; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE. Reconnect replays same neutral position; no exact rank disclosure. | `queue_entry_total`, admission lag/fairness band, reconnect/replay, denial/code | device/session/body and response; anonymous/auth policy; CORS/ApiError; duplicate join/reconnect/fair ordering |
| BE35B-08 | `CartRequest` → 201 `TicketCartV1 { cartId,eventId,lines,currency,state,expiresAt,manifestVersion,version,requestId }` | common set plus 409 INVENTORY_CONFLICT, PURCHASE_LIMIT_REACHED, VERSION_CONFLICT, or IDEMPOTENCY_CONFLICT. Transaction releases all line locks on any failure. | `ticket_cart_total`, reservation conflict/expiry, oversell invariant, lock latency | line/quantity/currency properties; queue/controller scope; CORS/BE00 ApiError envelope; multi-line rollback/concurrent carts |
| BE35B-09 | `CheckoutRequest` → 202/200 `TicketOrderV1 { orderId,cartId,state,paymentState,expiresAt,version,requestId }` | common set plus 409 VERSION_CONFLICT, INVENTORY_CONFLICT, or IDEMPOTENCY_CONFLICT; 410 QUEUE_OR_CART_EXPIRED; 422 PAYMENT_FAILED; 503 DEPENDENCY_UNAVAILABLE. After provider ref, reconcile/poll instead of creating a second intent. | `ticket_checkout_total`, pending age, provider attempt/circuit, conversion/failure | checkout/success; controller+step-up; CORS/ApiError; timeout before/after provider ref, webhook duplicate/order, pending recovery |
| BE35B-10 | `WaitlistRequest` → 201 `WaitlistEntryV1 { entryId,eventId,productRef,quantity,acceptanceMode,state,joinedAt,policyVersion,requestId }` | common set plus 409 PURCHASE_LIMIT_REACHED or IDEMPOTENCY_CONFLICT; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE. Duplicate active identity/product replays; rank stays private. | `waitlist_entry_total`, join/suppression/offer age, policy version | quantity/mode/window; identity eligibility; CORS/BE00 ApiError envelope; duplicate active entry and policy race |
| BE35B-11 | `ClaimOfferRequest` → 201 `WaitlistClaimV1 { offerId,entryId,cartId,claimedQuantity,state,expiresAt,version,requestId }` | common set plus 409 INVENTORY_CONFLICT or VERSION_CONFLICT; 410 OFFER_EXPIRED; 503 DEPENDENCY_UNAVAILABLE. Offer lock either commits one cart/claim or returns inventory atomically. | `waitlist_claim_total`, offer age/expiry, claim conflicts, requeue lag | token/quantity/success; exact offered identity; CORS/ApiError; claim-vs-expiry race and atomic requeue |

## Ambiguity Gate

- Interactions 35.07–35.11, all four canonical models, and all three events have deterministic contracts.
- Fairness, limits, reservation atomicity, checkout recovery, waitlist ordering/offers, persistence, RLS/grants, errors, observability, and tests are explicit.
- Open Questions: None.
- Result: **PASS**.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Added explicit pre-audit structural closure and normalized authoritative per-operation CORS policies. |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [IA Shard 35](../ia/35-ticket-products-sales.md)
- Shards 01/06/11/35a/35e identity, risk, payment, inventory, and delivery contracts.
