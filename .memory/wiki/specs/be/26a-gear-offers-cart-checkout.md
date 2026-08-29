# BE-26a — Gear Offers, Mixed Cart, and Checkout Groups

Status: implementation-ready backend contract for Shard 26 interactions 26.01–26.05. This companion owns private offer threads, seller responses, cart intents, checkout-group partitioning, eligibility preparation, and atomic claim-plus-authorization orchestration. Freight quoting and shipment/order lifecycle are BE-26b; remedies, settlement and title intents are BE-26c; pickup/service/warranty are BE-26d; disabled future commerce is BE-26e.

## Classification

| Field | Decision |
|---|---|
| Backend boundary | Offer negotiation, cart intent storage, checkout partitioning and all-line claim/authorization handoff |
| Assigned interactions | 26.01 Make/counter offer; 26.02 Accept/decline offer; 26.03 Maintain mixed-intent cart; 26.04 Resolve checkout eligibility; 26.05 Claim and authorize checkout |
| Operation IDs | BE26A-GCF01 through BE26A-GCF05 |
| Primary actors | Authenticated buyer, seller or delegated listing operator, buying-party controller, payment authorization worker |
| Non-goals | Freight quote/booking, order shipment state, returns/damage, settlement/title transfer, pickup, service, warranty, international, auction/dealer/rental flows |
| Locked product decisions | Pending/countered offers never reserve; acceptance uses the same atomic claim as Buy Now; carts never claim; mixed carts partition by fulfilment/refund/payment regime; quote validity is not a hold; losers remain visible with reasons; no charge without current authorization |
| Platform dependency | BE-00 global contract/error/idempotency/outbox/RLS/CORS rules; BE-25 listing/disclosure/inventory facts; BE-23 identity and ownership; BE-24 custody/sell grant |

The boundary preserves one inventory authority: this companion requests the claim transaction but never decrements stock in a cart write or offer submission. A checkout group is an intent partition and becomes a real independent order only after all selected lines are revalidated and authorized.

## Referenced Material Inventory

| Source | Section and line trace | Material used |
|---|---|---|
| .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md | Commerce Decisions, lines 24–38 | Offer force, cart partitioning, account/party, quote separation, domestic launch, payment/title ordering and no charge without current authorization |
| .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md | Acceptance Criteria, lines 52–56 | Exact 26.01–26.05 acceptance obligations |
| .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md | Interactions, lines 77–83 | Exact interaction names, preconditions, success and failure/recovery |
| .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md | Command Contracts, lines 104–114 | SubmitOffer, RespondOffer, PrepareCheckoutGroup, CommitCheckoutGroup and version/idempotency invariants |
| .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md | Data Models, lines 127–135 | OfferThread, Offer, CartIntent, CheckoutGroup and Order/OrderLine relationship |
| .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md | Access Control, lines 167–183 | Buyer/seller/org/provider capabilities, party resolution and private data boundaries |
| .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md | Event Schemas, lines 207–224 | gear_offer.changed.v1 and gear_checkout.group_committed.v1 plus envelope/privacy rules |
| .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md | Offer and Checkout Algorithm, lines 12–20 | Offer pinning, no pending reservation, competing-offer void, cart grouping, claim-before-charge and no half-order |
| .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md | Money/Title Ordering, lines 51–63 | Claim → authorization → order sequence; payment does not equal ownership |
| .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md | Race Resolution, lines 112–124 | Offer/Buy Now arbitration, stale price, quote readiness, webhook idempotency and canonical server clocks |
| .memory/wiki/specs/be/00-infrastructure.md | Zod/error rules, lines 112–153 | Strict Zod 4, ApiError { code, message, requestId, details }, bounded details and request IDs |
| .memory/wiki/specs/be/00-infrastructure.md | RLS/Hono/transaction rules, lines 208–308 | Forced RLS, CORS, auth/validation, rate classes, idempotency, audit and outbox |
| .memory/wiki/specs/be/25c-gear-inventory-bulk-channels.md | Inventory claim contract | MarketplaceUnit/StockLine availability and atomic claim authority |
| .memory/wiki/specs/be/25b-gear-listing-disclosure-lifecycle.md | Listing lifecycle contract | ListingVersion, DisclosureVersion, screening and policy versions pinned at offer/checkout |
| .memory/wiki/specs/be/23a-gear-identity-claims-transfers.md | Buyer/seller identity contract | Canonical account, party, ownership and transfer revisions |

## IA Source Map

### Assigned interactions

| IA ID | IA name | Backend responsibility | Operation |
|---|---|---|---|
| 26.01 | Make/counter offer | Pin listing/price/eligibility versions, validate buyer/destination and store private item-price offer; no reservation | BE26A-GCF01 |
| 26.02 | Accept/decline offer | Seller response; accepted offer enters atomic inventory claim and checkout obligation; competing offers void | BE26A-GCF02 |
| 26.03 | Maintain mixed-intent cart | Store independent intents and partition by fulfilment/refund/payment regime; never claim inventory | BE26A-GCF03 |
| 26.04 | Resolve checkout eligibility | Revalidate each line, destination, voltage, fulfilment, policy, disclosure, screening, price and stock; retain ineligible lines | BE26A-GCF04 |
| 26.05 | Claim and authorize checkout | Claim all selected group lines before/with authorization and create independent orders without half-order state | BE26A-GCF05 |

### Canonical Data Models

| IA model | This companion representation | Ownership |
|---|---|---|
| OfferThread | Private immutable conversation root with seller/buyer and listing context | Authoritative here |
| Offer | Versioned item-price proposal/response with expiry and eligibility snapshot | Authoritative here |
| CartIntent | Non-authoritative buyer intent with listing/price version and quantity | Authoritative here |
| CheckoutGroup | Partitioned fulfilment/payment/refund group with preparation deadline | Authoritative here |
| Order | Created by commit handoff and consumed by BE-26b | 26b authoritative |
| OrderLine | Created per claimed line and consumed by BE-26b | 26b authoritative |
| MarketplaceUnit | Availability/claim target consumed from BE-25c | 25c authoritative |
| Listing | Listing state and seller target consumed from BE-25b | 25b authoritative |
| ListingVersion | Price/disclosure/media snapshot pinned into offer/group | 25b authoritative |
| InventoryClaim | Atomic target claim consumed from BE-25c | 25c authoritative |
| OrderClock | Checkout deadline reference consumed by BE-26b | 26b authoritative |
| FreightQuoteRequest | Optional quote reference from BE-26b; readiness never reserves | 26b authoritative |
| Shipment | Fulfilment output from BE-26b | 26b authoritative |
| PackingEvidence | Shipment evidence from BE-26b | 26b authoritative |
| ReturnCase | Remedy output from BE-26c | 26c authoritative |
| DamageCase | Remedy output from BE-26c | 26c authoritative |
| SettlementRecord | Financial close output from BE-26c | 26c authoritative |
| OwnershipTransferIntent | Settlement-triggered title intent from BE-26c | 26c authoritative |
| PickupArrangement | Pickup branch from BE-26d | 26d authoritative |
| InternationalDetermination | Disabled future gate from BE-26e | 26e authoritative |

The complete canonical model inventory above preserves every IA Data Models name, including OfferThread / Offer, CartIntent, CheckoutGroup, Order / OrderLine, OrderClock, Shipment, FreightQuoteRequest, PackingEvidence, ReturnCase, DamageCase, SettlementRecord, OwnershipTransferIntent, PickupArrangement and InternationalDetermination.

### Event Schemas

| Event type | Producer or consumer | Contract use |
|---|---|---|
| gear_offer.changed.v1 | BE26A-GCF01 and BE26A-GCF02 producer | Private offer state/amount/expiry revision; no inventory claim until accepted |
| gear_checkout.group_committed.v1 | BE26A-GCF05 producer | Group, buying party, independent order IDs, claim and authorization revision |
| gear_order.state_changed.v1 | BE-26b consumer | Order state and clock hints; this companion does not transition order state |
| gear_order.amendment_opened.v1 | BE-26b consumer | Post-purchase seller amendment may invalidate pending checkout only before commit |
| gear_shipment.state_changed.v1 | BE-26b consumer | Shipment state; no checkout claim mutation |
| gear_order.damage_claimed.v1 | BE-26c consumer | Damage hold; no new checkout authorization |
| gear_order.return_changed.v1 | BE-26c consumer | Return/stock eligibility refresh |
| gear_order.settled.v1 | BE-26c consumer | Settlement is downstream and not an offer authorization |
| gear_order.transfer_requested.v1 | BE-26c consumer | Ownership transfer follows settlement, never checkout |
| gear_pickup.arrangement_changed.v1 | BE-26d consumer | Pickup mode is a separate group regime |
| gear_logistics.quote_changed.v1 | BE-26b consumer | Quote readiness/expiry; quote has no hold authority |
| gear_compliance.determination_changed.v1 | BE-26e consumer | Future route remains disabled unless explicit gates pass |

Every event uses BE-00 envelope eventId, eventType, schemaVersion, occurredAt, producer, aggregateType, aggregateId, actorClass, requestId, correlationId, idempotency key hash, payloadHash and payload. Payload excludes payment secrets, exact address, raw evidence, private notes and protected registry identifiers.

## Endpoint Reconciliation

BE-00 owns authentication/session, party-token resolution, generic object storage, idempotency inspection and global errors. BE-23 owns canonical accounts/parties, ownership and transfer. BE-24 owns custody and sell authority. BE-25b owns listing/disclosure/publication; BE-25c owns MarketplaceUnit/StockLine/InventoryClaim and the stock mutation; BE-26b owns order/shipment lifecycle; BE-26c owns remedy/settlement; BE-26d owns pickup; BE-26e owns future gates. Payment authorization is a provider rail invoked by GCF05, not a duplicate route. No endpoint below duplicates those boundaries.

## API Endpoints

### Umbrella Feature Trace

The IA Shard 26 feature bullets are represented across 26a–26e: 13.05 Offers, Auctions & Negotiation; 13.06 Cart, Checkout & Orders; 13.07 Gear Logistics & Cross-Border; 13.08 Returns, RMA & Warranty; 13.09 Trade-In, Part-Exchange & Consignment; 13.10 Gear Rental & Backline Hire; 13.11 Local Pickup & Meetup Safety.

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Capability | Archetype | Success |
|---|---|---|---|---|---|---|
| BE26A-GCF01 | POST | /api/v1/gear/offers | 26.01 | offer.create | ordinary command | 201 OfferSuccess |
| BE26A-GCF02 | POST | /api/v1/gear/offers/{offerId}/responses | 26.02 | offer.respond | protected atomic command | 200 OfferResponseSuccess |
| BE26A-GCF03 | PUT | /api/v1/gear/carts/{cartId}/intents | 26.03 | cart.intent.write | ordinary command | 200 CartSuccess |
| BE26A-GCF04 | POST | /api/v1/gear/checkout/groups/prepare | 26.04 | checkout.prepare | ordinary command | 200 CheckoutPreparationSuccess |
| BE26A-GCF05 | POST | /api/v1/gear/checkout/groups/commit | 26.05 | checkout.commit | protected atomic command | 201 CheckoutCommitSuccess |

This registry is the only method/path authority for these operations. Every command returns requestId and operationId. GCF04 only prepares and GCF05 is the only route that can invoke claim/authorization/order creation.

### Request/response contracts (Zod 4)

All schemas are strict Zod 4. Unknown keys, unsafe text, invalid UUIDs, stale versions, excessive offer moves, non-domestic destinations, unsupported currency and unbounded arrays reject before mutation. Every failure uses BE-00 ApiError { code, message, requestId, details } through ErrorResponse.

~~~ts
import { z } from "zod";

type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const Uuid = z.string().uuid();
const Instant = z.string().datetime({ offset: true });
const IdempotencyKey = z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/);
const Version = z.number().int().positive().max(2147483647);
const Text = (max: number) => z.string().trim().min(1).max(max);
const Currency = z.enum(["USD", "CAD", "GBP", "EUR"]);
const DomesticRegion = z.string().regex(/^[A-Z]{2,3}$/);
const Destination = z.object({
  country: z.literal("US"),
  region: z.string().regex(/^[A-Z]{2}$/),
  postalCode: z.string().regex(/^[A-Z0-9 -]{3,12}$/),
  addressToken: Uuid
}).strict();
const Mode = z.enum(["shipped", "platform_pickup", "off_platform_pickup", "digital"]);
const PaymentRegime = z.enum(["platform_card", "platform_wallet", "bank_transfer"]);
const FulfilmentRegime = z.enum(["shipped_gear", "platform_pickup", "off_platform_pickup", "digital"]);

export const Gcf01Request = z.object({
  idempotencyKey: IdempotencyKey,
  listingId: Uuid,
  listingVersionId: Uuid,
  marketplaceUnitId: Uuid,
  buyerPartyId: Uuid,
  destination: Destination,
  mode: Mode,
  amountMinor: z.number().int().positive().max(1000000000),
  currency: Currency,
  expiresAt: Instant,
  deliveredCostContext: z.object({
    freightQuoteRequestId: Uuid.nullable(),
    estimatedFreightMinor: z.number().int().nonnegative().max(1000000000).nullable()
  }).strict(),
  note: z.string().trim().max(1000).default("")
}).strict();

export const Gcf02Request = z.object({
  idempotencyKey: IdempotencyKey,
  offerId: Uuid,
  expectedOfferVersion: Version,
  action: z.enum(["accept", "decline", "counter"]),
  counterAmountMinor: z.number().int().positive().max(1000000000).nullable(),
  counterCurrency: Currency.nullable(),
  counterExpiresAt: Instant.nullable(),
  sellerPartyId: Uuid,
  note: z.string().trim().max(1000).default("")
}).strict().superRefine((v, ctx) => {
  if (v.action === "counter" && (v.counterAmountMinor === null || v.counterCurrency === null || v.counterExpiresAt === null)) {
    ctx.addIssue({ code: "custom", path: ["counterAmountMinor"], message: "counter requires amount, currency and expiry" });
  }
  if (v.action !== "counter" && (v.counterAmountMinor !== null || v.counterCurrency !== null || v.counterExpiresAt !== null)) {
    ctx.addIssue({ code: "custom", path: ["counterAmountMinor"], message: "non-counter response cannot carry counter values" });
  }
});

const CartLine = z.object({
  intentId: Uuid.nullable(),
  listingId: Uuid,
  listingVersionId: Uuid,
  marketplaceUnitId: Uuid,
  quantity: z.number().int().positive().max(1000),
  mode: Mode,
  desiredAmountMinor: z.number().int().positive().max(1000000000),
  currency: Currency
}).strict();

export const Gcf03Request = z.object({
  cartId: Uuid,
  idempotencyKey: IdempotencyKey,
  accountId: Uuid,
  lines: z.array(CartLine).max(100),
  removeIntentIds: z.array(Uuid).max(100),
  offlineCommandId: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/).nullable()
}).strict();

export const Gcf04Request = z.object({
  idempotencyKey: IdempotencyKey,
  accountId: Uuid,
  buyingPartyId: Uuid,
  destination: Destination,
  paymentRegime: PaymentRegime,
  lines: z.array(CartLine).min(1).max(50),
  requestedModes: z.array(Mode).min(1).max(4),
  policyVersionHints: z.array(Uuid).max(50)
}).strict();

const PreparedGroup = z.object({
  preparationId: Uuid,
  groupKey: z.string().regex(/^[a-f0-9]{64}$/),
  fulfilmentRegime: FulfilmentRegime,
  lineIntentIds: z.array(Uuid).min(1).max(50),
  totalMinor: z.number().int().nonnegative().max(1000000000),
  currency: Currency,
  eligibilityVersion: Version,
  expiresAt: Instant
}).strict();

export const Gcf05Request = z.object({
  idempotencyKey: IdempotencyKey,
  accountId: Uuid,
  buyingPartyId: Uuid,
  preparationId: Uuid,
  preparationVersion: Version,
  groups: z.array(PreparedGroup).min(1).max(20),
  paymentAuthorizationToken: Text(512),
  confirmActualSet: z.literal(true),
  confirmTotals: z.literal(true)
}).strict();

const BaseSuccess = z.object({
  requestId: Uuid,
  operationId: z.string().regex(/^BE26A-GCF0[1-5]$/),
  idempotencyKey: IdempotencyKey,
  occurredAt: Instant
}).strict();

export const OfferSuccess = BaseSuccess.extend({
  offerThreadId: Uuid,
  offerId: Uuid,
  offerVersion: Version,
  state: z.enum(["pending", "countered", "accepted", "declined", "expired", "voided", "held"]),
  expiresAt: Instant,
  reserved: z.literal(false),
  eventId: Uuid
}).strict();

export const OfferResponseSuccess = BaseSuccess.extend({
  offerId: Uuid,
  offerVersion: Version,
  state: z.enum(["accepted", "declined", "countered", "held", "voided"]),
  inventoryClaimId: Uuid.nullable(),
  checkoutDeadline: Instant.nullable(),
  voidedOfferIds: z.array(Uuid).max(100),
  eventId: Uuid
}).strict();

export const CartSuccess = BaseSuccess.extend({
  cartId: Uuid,
  cartVersion: Version,
  intentIds: z.array(Uuid).max(100),
  groupPreview: z.array(z.object({
    groupKey: z.string().regex(/^[a-f0-9]{64}$/),
    fulfilmentRegime: FulfilmentRegime,
    lineCount: z.number().int().nonnegative()
  }).strict()).max(20),
  claimsCreated: z.literal(false)
}).strict();

export const CheckoutPreparationSuccess = BaseSuccess.extend({
  preparationId: Uuid,
  preparationVersion: Version,
  groups: z.array(PreparedGroup).max(20),
  ineligibleLines: z.array(z.object({
    intentId: Uuid,
    reasonCode: z.string().regex(/^[A-Z0-9_]{3,64}$/),
    remediation: Text(500)
  }).strict()).max(50),
  claimsCreated: z.literal(false),
  paymentAuthorized: z.literal(false)
}).strict();

export const CheckoutCommitSuccess = BaseSuccess.extend({
  checkoutGroupId: Uuid,
  orderIds: z.array(Uuid).min(1).max(20),
  claimedLineCount: z.number().int().positive().max(50),
  removedLoserIntentIds: z.array(Uuid).max(50),
  paymentAuthorizationId: Uuid,
  eventId: Uuid
}).strict();

export const ApiError = z.object({
  code: z.string().regex(/^[A-Z0-9_]{3,64}$/),
  message: z.string().min(1).max(240),
  requestId: Uuid,
  details: BE00ErrorDetails
}).strict();

export const ErrorResponse = z.object({ error: ApiError }).strict();
~~~

PaymentAuthorizationToken is opaque and single-use; it is exchanged server-side and never logged or stored as a secret. GCF01 and GCF02 pin versions and body hashes. GCF03 and GCF04 never create a claim. GCF05 accepts only an unexpired preparation and creates no charge for a line that did not claim successfully.

### Contract Registry

| Operation ID | Request schema | Success schema | Global error contract | Commit boundary |
|---|---|---|---|---|
| BE26A-GCF01 | Gcf01Request strict; domestic destination and bounded expiry | OfferSuccess; reserved is always false | All failures use ApiError { code, message, requestId, details } via ErrorResponse | OfferThread/Offer, audit, outbox and idempotency result commit atomically |
| BE26A-GCF02 | Gcf02Request strict; counter fields conditional | OfferResponseSuccess with claim/deadline only on acceptance | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Response, claim arbitration, competing-offer voids, audit/outbox commit atomically |
| BE26A-GCF03 | Gcf03Request strict; cart line bounds | CartSuccess with claimsCreated false | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Cart intents, grouping projection, audit and idempotency commit atomically |
| BE26A-GCF04 | Gcf04Request strict; one buying party and bounded lines | CheckoutPreparationSuccess with eligibility reasons | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Preparation snapshot and audit/idempotency commit atomically; no claim/payment |
| BE26A-GCF05 | Gcf05Request strict; prepared group/version and confirmations | CheckoutCommitSuccess with independent orders and payment auth ID | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Claim, actual-set reconciliation, payment authorization, orders, audit/outbox and idempotency commit as one protected workflow |

## Authorization and Ownership

| Operation ID | Actor and role | Ownership/party predicate | 403 versus 404 |
|---|---|---|---|
| BE26A-GCF01 | Authenticated buyer with buy capability | buyerPartyId controlled by account; listing/version is public and destination-eligible | Concealed listing/unit returns 404 OFFER_TARGET_NOT_FOUND; known account without buy capability is 403 BUY_FORBIDDEN |
| BE26A-GCF02 | Seller or delegated listing operator | seller controls offer listing and sellerPartyId; only seller can accept/decline | Concealed offer returns 404 OFFER_NOT_FOUND; visible offer without seller grant is 403 OFFER_RESPONSE_FORBIDDEN |
| BE26A-GCF03 | Authenticated account owner | cart belongs to account; each intent references visible listing/unit and no private offer leakage | Unknown cart is 404 CART_NOT_FOUND; known cart for another account is 404 to avoid existence leakage |
| BE26A-GCF04 | Authenticated buyer or buying-party controller | buyingPartyId is controlled by account or current organization relationship; destination token belongs to party | Hidden party/cart line returns 404 CHECKOUT_CONTEXT_NOT_FOUND; visible party without control is 403 BUYING_PARTY_FORBIDDEN |
| BE26A-GCF05 | Authenticated buyer/organization checkout actor plus payment worker | preparation, all lines, buying party and payment token belong to account; organization control is current | Hidden preparation returns 404 CHECKOUT_PREPARATION_NOT_FOUND; visible preparation without commit grant is 403 CHECKOUT_COMMIT_FORBIDDEN |

Seller acceptance cannot settle or transfer ownership. Buying-party selection records the clicking actor separately from the controlled party. Exact address tokens are purpose-bound and never returned in offer events or public cart projections.

## Middleware and Security

### Per-operation middleware registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
|---|---|---|---|
| BE26A-GCF01 | requestId → CORS → auth → account/party context → rate limit → idempotency → strict body validation → listing eligibility → handler/audit/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary Origin | max body 64 KiB; domestic destination; offer expiry bound; note sanitization; private thread RLS |
| BE26A-GCF02 | requestId → CORS → auth → seller context → rate limit → idempotency → strict body validation → offer lock → claim arbitration → handler/audit/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary Origin | max body 32 KiB; CSRF for cookie auth; seller grant; expected version; no direct inventory table write |
| BE26A-GCF03 | requestId → CORS → auth → account context → rate limit → idempotency → strict body validation → cart ownership → handler/audit/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary Origin | max body 256 KiB; line count 100; no claim/payment side effect; object/address token authorization |
| BE26A-GCF04 | requestId → CORS → auth → buying-party context → rate limit → idempotency → strict body validation → eligibility reads → handler/audit | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary Origin | max body 128 KiB; bounded destination; current listing/price/disclosure/policy/screening versions |
| BE26A-GCF05 | requestId → CORS → auth → buying-party context → rate limit → idempotency → strict body validation → preparation lock → claim/payment workflow → audit/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary Origin | max body 128 KiB; single-use payment token; serializable actual-set check; no partial charge/order |

Payment tokens, address tokens, exact pickup locations and private offer notes are excluded from logs, traces and error details. Every provider callback is authenticated and replay-protected before state reconciliation.

## Idempotency, Rate Limits, and SLOs

| Operation ID | Idempotency and concurrency | Rate limit | SLO and timeout |
|---|---|---|---|
| BE26A-GCF01 | Required key/body hash; lock offer-thread/listing tuple; same key returns same offer | 30 per buyer per minute, burst 5 | p95 900 ms, hard 15 s; lock retry 2 at 50/150 ms |
| BE26A-GCF02 | Required key/body hash; lock offer and unit in stable order; acceptance arbitration atomic | 20 per seller per minute, burst 4 | p95 1.2 s, hard 15 s; contention retry 2 at 50/150 ms |
| BE26A-GCF03 | Required key/body hash; cart optimistic version and offlineCommandId dedupe | 60 per account per minute, burst 15 | p95 800 ms, hard 15 s; no external mutation |
| BE26A-GCF04 | Required key/body hash; preparation expires and is bound to group/filter hash | 20 per account per minute, burst 5 | p95 1.5 s, hard 15 s; dependency reads retry 2 at 100/300 ms |
| BE26A-GCF05 | Required key/body hash; preparation lock and serializable claim/payment transaction | 10 per account per 10 minutes, burst 2 | p95 2 s, hard 15 s; no automatic retry after payment ambiguity |

BE-00 idempotency records retain command results at least 24 hours. A lost response is recovered by key lookup. GCF05 fails closed if idempotency, inventory or payment authority is unavailable; it never charges a line without a durable order/claim result.

## Observability

| Operation ID | Metrics | Structured logs and traces | Audit/outbox evidence |
|---|---|---|---|
| BE26A-GCF01 | offer_created_total by mode/currency; offer_expiry_total; latency | requestId, operationId, offer/listing hashes, actor class, amount bucket, result | offer.created audit; gear_offer.changed.v1 |
| BE26A-GCF02 | offer_response_total by action; offer_conflict_total; claim_attempt_total | requestId, operationId, offer hash, expected/result version, action, reason | offer.responded/claim arbitration audit; gear_offer.changed.v1 |
| BE26A-GCF03 | cart_write_total; cart_line_total; cart_conflict_total; latency | requestId, operationId, cart hash, line count, group count, claimsCreated false | cart.updated audit; no claim event |
| BE26A-GCF04 | checkout_prepare_total by eligible/ineligible; dependency_failure_total; latency | requestId, operationId, preparation ID, group count, ineligible reason histogram | preparation.created audit; no claim/payment event |
| BE26A-GCF05 | checkout_commit_total; claim_loser_total; payment_ambiguity_total; latency | requestId, operationId, prep/group hashes, line counts, order count, result | checkout.committed audit; gear_checkout.group_committed.v1 |

Sentry receives stable error code and requestId only. Metrics never contain buyer/seller identity, payment token, address, private offer note or raw provider payload.

## Persistence and RLS

All tables are in protected schemas with enabled and forced RLS. Direct anon/authenticated table grants are denied. Security-invoker RPCs recheck account, acting party, seller/listing grant, expected versions, inventory claim authority and payment token ownership. Every mutation writes audit and, for named events, outbox rows in the same transaction.

### Complete table definitions

| Table / model | Typed fields with SQL types, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.offer_threads / OfferThread | id uuid PK; listing_id uuid NOT NULL FK platform_private.listings(id); seller_party_id uuid NOT NULL FK identity.parties(id); buyer_party_id uuid NOT NULL FK identity.parties(id); state text NOT NULL CHECK in pending/countered/accepted/declined/expired/voided/held; current_offer_version integer NOT NULL CHECK > 0; private boolean NOT NULL DEFAULT true CHECK private=true; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(listing_id,buyer_party_id,seller_party_id) | listing_id/state; buyer_party_id/updated_at DESC; seller_party_id/updated_at DESC; state/updated_at | Buyer/seller party members see thread; support only case-bound projection; public/anon denied; forced RLS; no direct client grant |
| platform_private.offers / Offer | id uuid PK; thread_id uuid NOT NULL FK platform_private.offer_threads(id); listing_version_id uuid NOT NULL FK platform_private.listing_versions(id); marketplace_unit_id uuid NOT NULL FK platform_private.marketplace_units(id); proposer_party_id uuid NOT NULL FK identity.parties(id); responder_party_id uuid NOT NULL FK identity.parties(id); amount_minor bigint NOT NULL CHECK amount_minor > 0; currency char(3) NOT NULL; delivered_cost_context jsonb NOT NULL CHECK jsonb_typeof(delivered_cost_context)='object'; state text NOT NULL CHECK in pending/countered/accepted/declined/expired/voided/held; expires_at timestamptz NOT NULL; version integer NOT NULL CHECK > 0; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL; UNIQUE(thread_id,version) | thread_id/version DESC; listing_version_id/state; marketplace_unit_id/state; expires_at/state; idempotency_record_id UNIQUE | Buyer/seller thread participants read; acceptance RPC seller-only; private note projection; forced RLS; no direct client grant |
| platform_private.offer_moves | id uuid PK; offer_id uuid NOT NULL FK platform_private.offers(id); from_state text NOT NULL; to_state text NOT NULL; amount_minor bigint NOT NULL CHECK > 0; currency char(3) NOT NULL; actor_party_id uuid NOT NULL FK identity.parties(id); note text NOT NULL DEFAULT ''; version integer NOT NULL CHECK > 0; created_at timestamptz NOT NULL; UNIQUE(offer_id,version) | offer_id/version DESC; actor_party_id/created_at DESC; to_state | Thread participants read; append-only RPC insert; forced RLS; no direct client grant |
| platform_private.carts / CartIntent | id uuid PK; account_id uuid NOT NULL FK auth.users(id); version integer NOT NULL DEFAULT 1 CHECK > 0; state text NOT NULL CHECK in active/preparing/committed/abandoned; offline_revision text NULL CHECK length <= 128; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(account_id) | account_id UNIQUE; state/updated_at DESC; offline_revision | Account owner reads/updates through cart RPC; organization buying party appears only in preparation; forced RLS; no direct client grant |
| platform_private.cart_intents | id uuid PK; cart_id uuid NOT NULL FK platform_private.carts(id); listing_id uuid NOT NULL FK platform_private.listings(id); listing_version_id uuid NOT NULL FK platform_private.listing_versions(id); marketplace_unit_id uuid NOT NULL FK platform_private.marketplace_units(id); desired_quantity integer NOT NULL CHECK desired_quantity > 0; desired_amount_minor bigint NOT NULL CHECK desired_amount_minor > 0; currency char(3) NOT NULL; mode text NOT NULL CHECK in shipped/platform_pickup/off_platform_pickup/digital; state text NOT NULL CHECK in active/ineligible/removed/committed; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | cart_id/state; listing_id/state; marketplace_unit_id/state; updated_at DESC | Account owner only; no inventory claim authority; forced RLS; no direct client grant |
| platform_private.checkout_groups / CheckoutGroup | id uuid PK; account_id uuid NOT NULL FK auth.users(id); buying_party_id uuid NOT NULL FK identity.parties(id); fulfilment_regime text NOT NULL CHECK in shipped_gear/platform_pickup/off_platform_pickup/digital; payment_regime text NOT NULL CHECK in platform_card/platform_wallet/bank_transfer; destination_token uuid NULL FK platform_private.address_tokens(id); preparation_version integer NOT NULL DEFAULT 1 CHECK > 0; state text NOT NULL CHECK in prepared/expired/committing/committed/failed; total_minor bigint NOT NULL CHECK >= 0; currency char(3) NOT NULL; expires_at timestamptz NOT NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | account_id/state; buying_party_id/state; expires_at/state; state/updated_at DESC | Account/buying-party controller sees own group; public denied; commit worker signed RPC; forced RLS; no direct client grant |
| platform_private.checkout_group_lines | id uuid PK; checkout_group_id uuid NOT NULL FK platform_private.checkout_groups(id); cart_intent_id uuid NOT NULL FK platform_private.cart_intents(id); listing_version_id uuid NOT NULL FK platform_private.listing_versions(id); marketplace_unit_id uuid NOT NULL FK platform_private.marketplace_units(id); inventory_claim_id uuid NULL FK platform_private.inventory_claims(id); quantity integer NOT NULL CHECK > 0; amount_minor bigint NOT NULL CHECK > 0; currency char(3) NOT NULL; eligibility_state text NOT NULL CHECK in eligible/ineligible/claimed/lost/created; reason_code text NULL; created_at timestamptz NOT NULL; UNIQUE(checkout_group_id,cart_intent_id) | checkout_group_id/eligibility_state; cart_intent_id; marketplace_unit_id; inventory_claim_id | Account reads own; claim worker writes through commit RPC; forced RLS; no direct client grant |
| platform_private.checkout_preparations | id uuid PK; account_id uuid NOT NULL FK auth.users(id); buying_party_id uuid NOT NULL FK identity.parties(id); preparation_hash char(64) NOT NULL; version integer NOT NULL CHECK > 0; state text NOT NULL CHECK in ready/expired/committing/committed/failed; group_ids uuid[] NOT NULL CHECK cardinality(group_ids) BETWEEN 1 AND 20; expires_at timestamptz NOT NULL; created_at timestamptz NOT NULL; UNIQUE(account_id,preparation_hash,version) | account_id/state; preparation_hash; expires_at/state; group_ids GIN | Account sees own; commit RPC only for owner; forced RLS; no direct client grant |

Constraints enforce one fulfilment/payment regime per group, no duplicate unit across simultaneously committing groups, amount/currency equality with the pinned ListingVersion, no cart-to-claim mutation, and no order creation before successful claim and payment authorization. JSON values are schema-validated and bounded in SQL.

### Permission and RLS matrix

| Principal | Read | Insert | Update | Delete |
|---|---|---|---|---|
| anon | None for private offer/cart/group; public listing projection only | None | None | None |
| authenticated buyer | Own offers, cart, preparation and groups; permitted public eligibility | Through RPC only | Through versioned RPC only | None; remove is state transition |
| seller/listing operator | Offers on controlled listing; no buyer private account data | Response RPC only | Offer response RPC only | None |
| organization controller | Groups for controlled buying party | Preparation/commit through RPC | Versioned RPC only | None |
| payment worker | Signed payment token exchange and assigned commit projection | Authorization result via RPC | Payment result only | None |
| support/risk | Case-bound redacted projection | Enumerated exception only with dual control | No ordinary cart/offer mutation | None |
| service role | Migration/redaction/retention procedures | Controlled procedures | Controlled procedures | Retention procedure only |

## State Machines, Concurrency, and Failure Recovery

### Offer and checkout state machines

| Current | Command | Preconditions | Next | Side effects |
|---|---|---|---|---|
| pending | counter | seller grant, expected version, expiry valid | countered | append Offer/Move; no reservation |
| pending/countered | decline | responder grant, expected version | declined | private event; no inventory change |
| pending/countered | accept | seller grant, listing/unit current, expiry valid | accepted or held | atomic claim; void competing offers; create checkout deadline |
| pending/countered | expiry worker | now past expiry | expired | append terminal state; no claim |
| accepted | claim fails | unit lost/held/stale | held/voided | explicit terminal reason; no charge |
| cart active | prepare | lines/current facts/destination valid | preparing/active | create non-claiming preparation |
| preparation ready | commit | current preparation, claimable lines, auth token | committing/committed/failed | independent orders only for claimed lines |

### Race and recovery matrix

| Race | Serialization rule | Winner/loser behavior | Recovery |
|---|---|---|---|
| Offer acceptance versus Buy Now | BE-25c unit arbitration lock and expected revision | First committed claim wins; other offers void with OFFER_UNIT_LOST | Refetch alternatives; no automatic price change |
| Counter versus expiry | Offer row lock and server timestamp | Committed response before deadline wins; otherwise expired | Retry only with current offer |
| Cart write versus claim | Cart version lock is separate from inventory claim | Cart persists intent; claim outcome can mark line lost | Keep loser in cart with reason |
| Quote readiness versus sale | Quote is not a hold; GCF04/GCF05 revalidate | Sale/claim wins; quote returns sold/ineligible | Reprepare current group |
| Two group commits same unit | Sorted unit locks and serializable transaction | One claim/order wins; sibling has no charge/order | Return line loser before authorization |
| Payment ambiguity after claim | Commit outbox and provider authorization reference | Do not repeat unknown charge; order/claim reconciliation worker decides | Idempotency/provider inquiry, then settle one result |
| Buying party control revoked | Party revision checked inside commit | Commit fails before claim/charge | Re-select controlled party |

Database deadlocks retry twice at 50/150 ms. Provider timeout is never guessed as success. A lost response uses idempotency lookup. Outbox is at-least-once; consumers refetch group/order/claim by canonical IDs and deduplicate event ID. A failed sibling cannot leave a paid undocumented half-order.

## External Seams

| Seam | Exact request | Exact response | Timeout | Retry/backoff | Circuit behavior |
|---|---|---|---|---|---|
| BE-25b listing eligibility | { listingVersionIds[], buyerPartyId, destination, mode } | { lines: [{ listingVersionId, state, disclosureVersionId, policyVersionId, priceMinor, eligible, reasonCode? }] } | 3,000 ms | 2 retries at 150/450 ms for transient | Open after 5 failures in 60 s; preparation returns typed unavailable, no claim |
| BE-25c claim arbitration | { targets[], expectedRevisions[], purpose: checkout, claimTtlSeconds } | { claims: [{ targetId, claimId, state, resultingRevision, expiresAt, reasonCode? }] } | 5,000 ms | 2 retries at 100/300 ms only before any payment authorization | Open after 3 failures in 60 s; commit fails closed, no charge |
| Payment authorization rail | { paymentAuthorizationToken, amountMinor, currency, merchantOrderGroupId, idempotencyKey } | { authorizationId, state: authorized/declined/pending, authorizedAmountMinor, providerEventId } | 8,000 ms | Exactly 1 retry after 100 ms with full jitter (50–150 ms), only for an explicit 502 received before authorization is accepted; timeout, connection loss, 429, provider 5xx without explicit non-acceptance, declined, and any unknown outcome are terminal for the request and move to idempotent status reconciliation; never retry a possibly accepted authorization | Opens after 3 failures in 60 s; half-opens after 60 s with 1 status-only probe; fallback while open is `pending`/503 reconciliation state and never a second charge; successful probe closes, failed probe remains open for 120 s |
| BE-23 party resolution | { accountId, buyingPartyId, purpose: checkout } | { allowed, partyRevision, partyType, sellerOrBuyerRole } | 2,000 ms | 2 retries at 100/300 ms | Open after 5 failures in 60 s; fail closed |
| BE-00 audit/outbox | { aggregateId, eventType, bodyHash, requestId } | { auditId, outboxId } | 2,000 ms | Exactly 1 bounded transaction retry after serialization/deadlock at 100 ms with full jitter (50–150 ms); retryable only before commit is known; constraint, validation, and unknown-commit outcomes are terminal for the request and reconcile by `aggregateId` plus `bodyHash`; no independent network retry | Opens after 3 failures in 30 s; half-opens after 30 s with 1 probe; fallback while open is 503 `DEPENDENCY_UNAVAILABLE` with no audit/outbox side effect; successful probe closes, failed probe remains open for 60 s; command fails atomically |

## Events and Async Consumers

| Event type | Produced by | Consumers | Idempotency key |
|---|---|---|---|
| gear_offer.changed.v1 | GCF01/GCF02 | private inbox, offer expiry, inventory claim projection | eventId plus offerId/version |
| gear_checkout.group_committed.v1 | GCF05 | BE-26b order lifecycle, payment reconciliation, receipt projection | eventId plus checkoutGroupId |
| gear_order.state_changed.v1 | BE-26b | cart/offer eligibility projection | orderId/version |
| gear_inventory.claim_resolved.v1 | BE-25c | group reconciliation and loser projection | claimId/result |
| gear_listing.screening_changed.v1 | BE-23b | GCF04 eligibility projection and GCF05 gate | screeningJobId/status |

Consumers acknowledge after durable refetch. Unknown event types are quarantined and alerted. The offer event never contains exact address, payment token, raw serial, evidence bytes or buyer private note.

## Error Matrix

| Operation IDs | Condition | HTTP | Error code | Retry/client action |
|---|---|---:|---|---|
| BE26A-GCF01 | Listing/unit hidden or not offer-enabled | 404 | OFFER_TARGET_NOT_FOUND | Do not reveal existence |
| BE26A-GCF01 | Amount, version, destination or expiry invalid | 422 | INVALID_INPUT | Correct and submit new intent |
| BE26A-GCF01 | Offer key reused with different body | 409 | IDEMPOTENCY_KEY_REUSE | New key only for new offer |
| BE26A-GCF02 | Offer hidden | 404 | OFFER_NOT_FOUND | Do not reveal offer |
| BE26A-GCF02 | Seller lacks listing control | 403 | OFFER_RESPONSE_FORBIDDEN | Use authorized operator |
| BE26A-GCF02 | Offer stale/expired/held | 409 | OFFER_VERSION_CONFLICT | Refetch; no acceptance |
| BE26A-GCF02 | Accepted claim loses unit arbitration | 409 | OFFER_UNIT_LOST | Show designed alternatives; no charge |
| BE26A-GCF03 | Cart hidden or wrong account | 404 | CART_NOT_FOUND | Do not reveal cart |
| BE26A-GCF03 | Cart version/offline command conflict | 409 | CART_VERSION_CONFLICT | Refetch and merge intents |
| BE26A-GCF04 | Buying party not controlled | 403 | BUYING_PARTY_FORBIDDEN | Select current controlled party |
| BE26A-GCF04 | Line ineligible/stale | 200 | CHECKOUT_LINE_INELIGIBLE | Keep line in cart with reason/remediation |
| BE26A-GCF05 | Preparation expired or changed | 409 | CHECKOUT_PREPARATION_STALE | Prepare again |
| BE26A-GCF05 | Partial claim before payment | 409 | CHECKOUT_CLAIM_CONFLICT | Losers removed before charge; no half-order |
| BE26A-GCF05 | Payment pending/unknown | 503 | PAYMENT_RECONCILIATION_PENDING | Do not retry token; await reconciliation |
| All | Rate limit exceeded | 429 | RATE_LIMITED | Honor Retry-After |
| All | Malformed/extra input | 400 | INVALID_INPUT | Correct strict schema |

Every error serializes ErrorResponse with BE-00 ApiError { code, message, requestId, details }. Details contain reason codes and field paths only; no private party, payment or address data.

## Testing Strategy

### Contract and route tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE26A-CON-001 | BE26A-GCF01 | Strict offer schema, domestic destination, expiry and no-reservation success are enforced |
| BE26A-CON-002 | BE26A-GCF02 | Accept/decline/counter conditional fields, seller party and expected version are enforced |
| BE26A-CON-003 | BE26A-GCF03 | Cart line bounds, mixed mode grouping, offline dedupe and claimsCreated false are enforced |
| BE26A-CON-004 | BE26A-GCF04 | One buying party, group regimes, bounded lines and no claim/payment are enforced |
| BE26A-CON-005 | BE26A-GCF05 | Preparation/version, confirmations, single-use token and independent order success are enforced |
| BE26A-ROUTE-001 | BE26A-GCF01 through BE26A-GCF05 | Route registry is exact and no alias bypasses CORS/auth/validation |

### Authorization and privacy tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE26A-AUTH-001 | BE26A-GCF01 through BE26A-GCF05 | Hidden resource returns 404; visible missing role returns 403; no existence leakage |
| BE26A-AUTH-002 | BE26A-GCF01, BE26A-GCF02 | Buyer cannot respond as seller; seller cannot submit buyer offer; delegated grants are scoped |
| BE26A-AUTH-003 | BE26A-GCF03, BE26A-GCF04, BE26A-GCF05 | Organization party control and address-token purpose are revalidated |
| BE26A-AUTH-004 | BE26A-GCF05 | Payment token, private offer note and exact address never enter logs/events/client errors |

### Persistence, idempotency, and concurrency tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE26A-DB-001 | BE26A-GCF01 through BE26A-GCF05 | Forced RLS denies direct client access and RPC checks actor/party/expected versions |
| BE26A-DB-002 | BE26A-GCF01, BE26A-GCF02 | Same key/body replays same offer/response; different body returns IDEMPOTENCY_KEY_REUSE |
| BE26A-DB-003 | BE26A-GCF03, BE26A-GCF04 | Cart/preparation writes never create InventoryClaim or payment records |
| BE26A-DB-004 | BE26A-GCF02, BE26A-GCF05 | Concurrent offer/Buy Now and group commits cannot oversell or charge losers |
| BE26A-DB-005 | All assigned operations | SQL types, nullability, constraints/FKs, indexes, RLS/grants and append-only move history are migration-tested |

### Domain, seam, event, and recovery tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE26A-DOM-001 | BE26A-GCF01, BE26A-GCF02 | Pending/countered never reserves; accepted claim voids competing offers atomically |
| BE26A-DOM-002 | BE26A-GCF03, BE26A-GCF04 | Mixed cart partitions shipped/pickup/off-platform/digital and retains ineligible lines |
| BE26A-DOM-003 | BE26A-GCF05 | Claims all selected group lines before/with payment; loser lines removed before charge; no half-order |
| BE26A-SEAM-001 | BE26A-GCF01 through BE26A-GCF05 | BE-23, BE-25b, BE-25c, payment rail and BE-00 timeout/retry/circuit contracts are exact |
| BE26A-EVT-001 | BE26A-GCF01, BE26A-GCF02, BE26A-GCF05 | Event payload privacy, outbox atomicity and duplicate consumer delivery are verified |
| BE26A-REC-001 | BE26A-GCF01 through BE26A-GCF05 | Lost response, deadlock, stale price, provider ambiguity and worker reconciliation recover as specified |

## Deepening Passes

| Pass | Question | Resolution and evidence |
|---|---|---|
| D1 offer force | Does pending or countered offer reserve stock? | No. Offer states and OfferSuccess reserved false; only acceptance enters claim arbitration |
| D2 authority | Can a cart write or quote hold inventory? | No. Cart/preparation schemas and transaction boundaries explicitly create no claim |
| D3 checkout atomicity | Can one group charge a line whose claim lost? | No. Actual-set reconciliation and claim-before-charge remove losers before payment |
| D4 party control | Can a user select an organization they no longer control? | No. BE-23 party revision is checked inside preparation and commit |
| D5 race safety | Can offer acceptance beat Buy Now inconsistently? | No. BE-25c stable unit arbitration gives one committed winner and terminal loser reasons |
| D6 price truth | Can a stale quote silently reprice? | No. listing/price versions are pinned and stale preparation/claim rejects |
| D7 reliability | What if payment response is unknown? | No retry storm; provider inquiry and idempotency reconciliation decide one durable result |
| D8 privacy | Can payment/address/private notes leak? | No. Tokenized fields, RLS, redacted logs/events and bounded errors are mandatory |
| D9 persistence | Are all fields and permissions implementable? | Every table lists SQL types, nullability, constraints/FKs, indexes, RLS and grants |
| D10 auditability | Does every operation have keyed evidence? | Contract, auth, middleware/CORS, idempotency/rate, observability, error and test rows cover GCF01–GCF05 |

## Ambiguity Gate

**PASS.** Evidence: interactions 26.01–26.05 map one-to-one to BE26A-GCF01–GCF05; OfferThread, Offer, CartIntent and CheckoutGroup authority is explicit; no-reservation offer/cart/quote behavior, atomic claim-before-charge, mixed-group partitioning, party control, stale price, payment ambiguity, privacy, exact external seams, typed persistence/RLS/grants, CORS policy gear-api, global ApiError and keyed tests are specified. Order/shipment, remedy/settlement, pickup/service and future-gate routes are referenced without duplication.

## Open Questions

None

## Dependency References

- BE-00 platform contracts in 00-infrastructure.md: strict Zod 4, ApiError { code, message, requestId, details }, CORS, idempotency, outbox, forced RLS, audit and rate classes.
- BE-23a identity/party authority in 23a-gear-identity-claims-transfers.md: canonical account, buying party, seller role and ownership revision.
- BE-24d custody in 24d-custody-cases-manifests.md: sell authority and custody grant consumed by eligibility.
- BE-25b listing lifecycle in 25b-gear-listing-disclosure-lifecycle.md: Listing, ListingVersion, DisclosureVersion, screening and policy pinning.
- BE-25c inventory in 25c-gear-inventory-bulk-channels.md: MarketplaceUnit, StockLine and InventoryClaim atomic arbitration.
- BE-26b order lifecycle: Order, OrderLine, OrderClock and shipment handoff.
- BE-26c remedies/settlement: downstream clocks, holds, settlement and ownership events.
- BE-26d pickup/service/warranty: distinct fulfilment branch and evidence.
- BE-26e future gates: international/auction/dealer/rental capabilities remain disabled.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-08-29 | Initial production-grade BE companion for interactions 26.01–26.05; offer/cart/checkout routes, strict contracts, atomic claim handoff, persistence/RLS, eventing, recovery and ambiguity evidence added |
