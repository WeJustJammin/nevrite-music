# BE-26b — Gear Freight, Shipment, and Order Lifecycle

Status: implementation-ready backend contract for Shard 26 interactions 26.06–26.10. This companion owns freight quote requests, domestic shipment booking, line-scoped order state and clocks, post-purchase disclosure amendments, and dispatch/delivery evidence. Offers/cart/checkout orchestration is BE-26a; remedies/settlement/transfers are BE-26c; pickup/service/warranty are BE-26d; future international and capability gates are BE-26e.

## Classification

| Field | Decision |
|---|---|
| Backend boundary | Domestic freight eligibility/booking, independent order lifecycle, protected clocks, amendment election and verified delivery evidence |
| Assigned interactions | 26.06 Request freight quote; 26.07 Commit domestic shipment; 26.08 Manage order lifecycle; 26.09 Amend after purchase; 26.10 Confirm dispatch/delivery |
| Operation IDs | BE26B-GCF06 through BE26B-GCF10 |
| Primary actors | Buyer, seller/dispatch operator, buying-party controller, carrier adapter, support exception worker |
| Non-goals | Offers/cart/checkout claim orchestration, return/damage adjudication, settlement/payout, ownership transfer, pickup arrangement, service/RMA, international/customs, auctions/dealer/rental |
| Locked product decisions | Quote holds no inventory/payment; domestic physical launch only; no silent parcel fallback; platform brokers but is not carrier/customs agent/insurer; admitted coverage is required above threshold; verified delivery—not raw scan—starts clocks; seller disclosure change pauses dispatch and buyer elects remedy |
| Platform dependency | BE-00 global errors, strict Zod, idempotency, outbox, RLS, CORS and audit; BE-25 listing/disclosure/inventory; BE-26a independent order creation |

Orders are real independent records. A group commit can create multiple order records, but this companion never permits a paid undocumented half-order. Every line carries its own state, clock, shipment and evidence references where remedy timing differs.

## Referenced Material Inventory

| Source | Section and line trace | Material used |
|---|---|---|
| .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md | Commerce Decisions, lines 24–38 | Domestic launch, freight role, insurance thresholds, title timing, return/amendment and evidence constraints |
| .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md | Acceptance Criteria, lines 57–61 | Exact 26.06–26.10 acceptance obligations |
| .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md | Interactions, lines 84–88 | Exact interaction names, preconditions, success and failure/recovery |
| .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md | Command Contracts, lines 110–114 | Prepare/commit handoff, TransitionOrder and SubmitOrderAmendment command semantics |
| .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md | Data Models, lines 134–138 | Order, OrderLine, OrderClock, Shipment, FreightQuoteRequest and PackingEvidence |
| .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md | Access Control, lines 169–183 | Buyer/seller/provider/support permissions, address and evidence boundaries |
| .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md | Event Schemas, lines 211–222 | Order/shipment/amendment/logistics event payloads and privacy |
| .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md | Freight Quote and Dispatch, lines 22–29 | Freight class, no quote hold, revalidation, packing/coverage, scans and verified delivery |
| .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md | Clock Contract, lines 51–53 | Versioned clocks, pauses, protected filings and absolute bounds |
| .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md | Order state, lines 72–78 | Order state machine, side states, line scoping and evidentially open financial close |
| .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md | Race Resolution, lines 114–124 | Quote/sale, damage/settlement, webhook and canonical timestamp rules |
| .memory/wiki/specs/be/00-infrastructure.md | Zod/error rules, lines 112–153 | Strict Zod 4 and ApiError { code, message, requestId, details } |
| .memory/wiki/specs/be/00-infrastructure.md | RLS/Hono/transaction rules, lines 208–308 | Forced RLS, CORS, auth/validation, rate classes, idempotency, audit and outbox |
| .memory/wiki/specs/be/25b-gear-listing-disclosure-lifecycle.md | Listing lifecycle dependency | Immutable ListingVersion/DisclosureVersion, material change and screening state |
| .memory/wiki/specs/be/26a-gear-offers-cart-checkout.md | Checkout dependency | Independent order creation, pinned prices/versions and claim handoff |

## IA Source Map

### Assigned interactions

| IA ID | IA name | Backend responsibility | Operation |
|---|---|---|---|
| 26.06 | Request freight quote | Store purpose-bound quote request/options/requirements and validity; never claim/pay or parcel-downgrade | BE26B-GCF06 |
| 26.07 | Commit domestic shipment | Revalidate order/quote/coverage, pin packing standard and admitted carrier booking evidence | BE26B-GCF07 |
| 26.08 | Manage order lifecycle | Apply line-scoped explicit state transition and policy-versioned clocks with expected version | BE26B-GCF08 |
| 26.09 | Amend after purchase | Pause pre-dispatch shipment, create buyer election accept/reduction/void and deadline | BE26B-GCF09 |
| 26.10 | Confirm dispatch/delivery | Append packing/carrier/pickup evidence; verified delivery alone starts inspection/settlement clocks | BE26B-GCF10 |

### Canonical Data Models

| IA model | This companion representation | Ownership |
|---|---|---|
| Order | Independent order with buyer/seller/party snapshots and state/version | Authoritative here |
| OrderLine | Remedy/clock/shipment-scoped subject of order | Authoritative here |
| OrderClock | Versioned deadline with pauses and protected filings | Authoritative here |
| Shipment | Domestic mode, packages, freight class, quote, coverage and state | Authoritative here |
| FreightQuoteRequest | Non-claiming purpose-bound quote request and provider result | Authoritative here |
| PackingEvidence | Append-only packing standard/media/scan evidence | Authoritative here |
| OfferThread | Upstream offer context consumed from BE-26a | 26a authoritative |
| Offer | Accepted offer price/version consumed from BE-26a | 26a authoritative |
| CartIntent | Upstream non-authoritative intent consumed from BE-26a | 26a authoritative |
| CheckoutGroup | Upstream group commit consumed from BE-26a | 26a authoritative |
| ReturnCase | Remedy output consumed from BE-26c | 26c authoritative |
| DamageCase | Remedy output consumed from BE-26c | 26c authoritative |
| SettlementRecord | Financial close consumed from BE-26c | 26c authoritative |
| OwnershipTransferIntent | Settlement transfer intent consumed from BE-26c | 26c authoritative |
| PickupArrangement | Pickup branch consumed from BE-26d | 26d authoritative |
| InternationalDetermination | Future route gate consumed from BE-26e | 26e authoritative |

### Event Schemas

| Event type | Producer operation | Delivery invariant |
|---|---|---|
| gear_logistics.quote_changed.v1 | BE26B-GCF06 | Quote request/result, validity, requirements and version; no claim/payment |
| gear_order.state_changed.v1 | BE26B-GCF08 and lifecycle worker | Previous/current line state, clocks, actor and version; consumers refetch |
| gear_order.amendment_opened.v1 | BE26B-GCF09 | Disclosure diff class, choices, deadline and dispatch hold; no private evidence |
| gear_shipment.state_changed.v1 | BE26B-GCF07 and BE26B-GCF10 | Shipment state, carrier evidence reference and version; scan is not verified delivery |
| gear_checkout.group_committed.v1 | Consumed from BE-26a | Created order IDs and pinned group facts |
| gear_order.damage_claimed.v1 | Consumed from BE-26c | Damage hold prevents auto-settlement |
| gear_order.return_changed.v1 | Consumed from BE-26c | Return state affects clocks and shipment eligibility |
| gear_order.settled.v1 | Consumed from BE-26c | Settlement downstream; no lifecycle reversal |
| gear_order.transfer_requested.v1 | Consumed from BE-26c | Transfer follows settlement only |
| gear_pickup.arrangement_changed.v1 | Consumed from BE-26d | Pickup branch is a distinct order mode |
| gear_compliance.determination_changed.v1 | Consumed from BE-26e | Future route disabled unless explicit gate |

All events use BE-00 envelope eventId, eventType, schemaVersion, occurredAt, producer, aggregateType, aggregateId, actorClass, requestId, correlationId, causationId, payloadHash and payload. Payloads never contain raw addresses, payment secrets, evidence bytes or protected registry identifiers.

## Endpoint Reconciliation

BE-00 owns auth/session, object storage, idempotency inspection and global errors. BE-23 owns identity/party, custody, service-history and transfer facts. BE-24 owns custody/possession grants. BE-25b owns ListingVersion/DisclosureVersion; BE-25c owns MarketplaceUnit/InventoryClaim; BE-26a creates the independent order handoff; BE-26c owns remedy and settlement; BE-26d owns pickup; BE-26e owns disabled future gates. Carrier and payment adapters are provider seams, not public routes here. No endpoint below duplicates another shard.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Capability | Archetype | Success |
|---|---|---|---|---|---|---|
| BE26B-GCF06 | POST | /api/v1/gear/freight-quotes | 26.06 | logistics.quote.request | ordinary command | 202 FreightQuoteSuccess |
| BE26B-GCF07 | POST | /api/v1/gear/orders/{orderId}/shipments | 26.07 | shipment.commit | protected command | 201 ShipmentSuccess |
| BE26B-GCF08 | POST | /api/v1/gear/orders/{orderId}/transitions | 26.08 | order.transition | protected command | 200 OrderTransitionSuccess |
| BE26B-GCF09 | POST | /api/v1/gear/orders/{orderId}/amendments | 26.09 | order.amend | protected command | 201 AmendmentSuccess |
| BE26B-GCF10 | POST | /api/v1/gear/orders/{orderId}/delivery-events | 26.10 | order.delivery.confirm | protected command | 200 DeliverySuccess |

Only this registry defines these method/path pairs. Quote and carrier work may be queued; a queued response never claims inventory or declares delivery. All commands include requestId/operationId and a durable idempotency result.

### Request/response contracts (Zod 4)

All schemas are strict Zod 4. Unknown keys, unsafe text, malformed UUID/date, non-domestic country, unsupported freight class, unbounded packages, stale versions and invalid state actions reject before mutation. Every failure uses BE-00 ApiError { code, message, requestId, details } through ErrorResponse.

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
const DomesticDestination = z.object({
  country: z.literal("US"),
  region: z.string().regex(/^[A-Z]{2}$/),
  postalCode: z.string().regex(/^[A-Z0-9 -]{3,12}$/),
  addressToken: Uuid
}).strict();
const Currency = z.enum(["USD", "CAD", "GBP", "EUR"]);
const Mode = z.enum(["standard", "freight", "oversize"]);

export const Gcf06Request = z.object({
  idempotencyKey: IdempotencyKey,
  buyerPartyId: Uuid,
  orderLineIds: z.array(Uuid).min(1).max(20),
  destination: DomesticDestination,
  freightClass: z.enum(["standard", "freight", "oversize"]),
  dimensions: z.object({
    lengthMm: z.number().int().positive().max(100000),
    widthMm: z.number().int().positive().max(100000),
    heightMm: z.number().int().positive().max(100000),
    weightGrams: z.number().int().positive().max(100000000)
  }).strict(),
  requirements: z.array(z.enum(["liftgate", "appointment", "inside_delivery", "fragile", "declared_value"])).max(10),
  coverageRequestMinor: z.number().int().nonnegative().max(1000000000).nullable(),
  currency: Currency
}).strict();

const Package = z.object({
  packageKey: z.string().regex(/^[A-Za-z0-9._:-]{1,80}$/),
  lengthMm: z.number().int().positive().max(100000),
  widthMm: z.number().int().positive().max(100000),
  heightMm: z.number().int().positive().max(100000),
  weightGrams: z.number().int().positive().max(100000000),
  packingEvidenceFrameIds: z.array(Uuid).max(20)
}).strict();

export const Gcf07Request = z.object({
  idempotencyKey: IdempotencyKey,
  orderId: Uuid,
  expectedOrderVersion: Version,
  freightQuoteRequestId: Uuid,
  quoteVersion: Version,
  carrierOptionId: Uuid,
  mode: Mode,
  packages: z.array(Package).min(1).max(50),
  packingStandardVersion: Text(80),
  coverageConfirmationId: Uuid.nullable(),
  acknowledgeNoParcelFallback: z.literal(true)
}).strict();

export const Gcf08Request = z.object({
  idempotencyKey: IdempotencyKey,
  orderId: Uuid,
  orderLineId: Uuid,
  expectedOrderVersion: Version,
  command: z.enum(["authorize", "cancel", "awaiting_dispatch", "dispatch", "mark_delivered", "enter_inspection"]),
  offlineCommandId: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/).nullable(),
  note: z.string().trim().max(1000).default("")
}).strict();

const AmendmentChoice = z.enum(["accept", "accept_with_reduction", "void"]);
export const Gcf09Request = z.object({
  idempotencyKey: IdempotencyKey,
  orderId: Uuid,
  orderLineId: Uuid,
  expectedOrderVersion: Version,
  disclosureVersionId: Uuid,
  changeClass: z.enum(["material_condition", "originality", "model_context", "media", "other"]),
  sellerExplanation: Text(2000),
  proposedReductionMinor: z.number().int().nonnegative().max(1000000000).nullable(),
  buyerDeadlineSeconds: z.number().int().min(300).max(604800),
  choices: z.array(AmendmentChoice).min(2).max(3)
}).strict().superRefine((v, ctx) => {
  if (v.choices.includes("accept_with_reduction") && v.proposedReductionMinor === null) {
    ctx.addIssue({ code: "custom", path: ["proposedReductionMinor"], message: "reduction choice requires amount" });
  }
});

const EvidenceRef = z.object({
  evidenceFrameId: Uuid,
  kind: z.enum(["packing", "carrier_scan", "pickup_confirmation", "delivery_exception"]),
  capturedAt: Instant,
  note: z.string().trim().max(500).default("")
}).strict();

export const Gcf10Request = z.object({
  idempotencyKey: IdempotencyKey,
  orderId: Uuid,
  orderLineId: Uuid,
  expectedOrderVersion: Version,
  action: z.enum(["confirm_dispatch", "record_carrier_scan", "confirm_verified_delivery", "record_misdelivery"]),
  carrierEventId: z.string().regex(/^[A-Za-z0-9._:-]{1,180}$/).nullable(),
  evidence: z.array(EvidenceRef).min(1).max(50),
  verifiedByPartyId: Uuid.nullable(),
  verificationMethod: z.enum(["dual_party_confirmation", "carrier_delivery_plus_review", "pickup_confirmation", "support_exception"]).nullable()
}).strict().superRefine((v, ctx) => {
  if (v.action === "confirm_verified_delivery" && (v.verifiedByPartyId === null || v.verificationMethod === null)) {
    ctx.addIssue({ code: "custom", path: ["verifiedByPartyId"], message: "verified delivery requires authorized verifier and method" });
  }
  if (v.action === "record_carrier_scan" && v.carrierEventId === null) {
    ctx.addIssue({ code: "custom", path: ["carrierEventId"], message: "carrier scan requires provider event ID" });
  }
});

const BaseSuccess = z.object({
  requestId: Uuid,
  idempotencyKey: IdempotencyKey,
  occurredAt: Instant
}).strict();

export const FreightQuoteSuccess = BaseSuccess.extend({
  operationId: z.literal("BE26B-GCF06"),
  freightQuoteRequestId: Uuid,
  state: z.enum(["queued", "ready", "expired", "unavailable"]),
  quoteVersion: Version,
  options: z.array(z.object({
    carrierOptionId: Uuid,
    amountMinor: z.number().int().nonnegative(),
    currency: Currency,
    coverageStatus: z.enum(["admitted", "unsupported", "required"]),
    validUntil: Instant
  }).strict()).max(20),
  claimsCreated: z.literal(false),
  paymentAuthorized: z.literal(false)
}).strict();

export const ShipmentSuccess = BaseSuccess.extend({
  operationId: z.literal("BE26B-GCF07"),
  shipmentId: Uuid,
  orderId: Uuid,
  state: z.enum(["booked", "dispatch_blocked", "pending_provider"]),
  quoteVersion: Version,
  packingStandardVersion: Text(80),
  coverageStatus: z.enum(["admitted", "unsupported", "required"]),
  eventId: Uuid
}).strict();

export const OrderTransitionSuccess = BaseSuccess.extend({
  operationId: z.literal("BE26B-GCF08"),
  orderId: Uuid,
  orderLineId: Uuid,
  previousState: z.string().regex(/^[a-z_]{3,80}$/),
  state: z.string().regex(/^[a-z_]{3,80}$/),
  orderVersion: Version,
  activeClockIds: z.array(Uuid).max(20),
  eventId: Uuid
}).strict();

export const AmendmentSuccess = BaseSuccess.extend({
  operationId: z.literal("BE26B-GCF09"),
  amendmentId: Uuid,
  orderId: Uuid,
  orderLineId: Uuid,
  state: z.enum(["awaiting_buyer_amendment", "accepted", "accepted_with_reduction", "voided", "expired"]),
  dispatchPaused: z.literal(true),
  buyerDeadline: Instant,
  eventId: Uuid
}).strict();

export const DeliverySuccess = BaseSuccess.extend({
  operationId: z.literal("BE26B-GCF10"),
  orderId: Uuid,
  orderLineId: Uuid,
  state: z.enum(["dispatched", "delivered", "delivery_exception"]),
  verifiedDelivery: z.boolean(),
  inspectionClockId: Uuid.nullable(),
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

A carrier scan is evidence only. GCF10 may record it without moving to delivered; verified delivery requires the declared verifier/method and current order version. A quote is valid only until validUntil and must be revalidated by BE-26a checkout/claim; GCF06 never reserves.

### Contract Registry

| Operation ID | Request schema | Success schema | Global error contract | Commit boundary |
|---|---|---|---|---|
| BE26B-GCF06 | Gcf06Request strict; domestic/freight bounds | FreightQuoteSuccess with claimsCreated false | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Quote request/result receipt, audit, outbox and idempotency commit atomically |
| BE26B-GCF07 | Gcf07Request strict; current order/quote, packages and admitted coverage | ShipmentSuccess with dispatch block when coverage/provider fails | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Shipment, pinned quote/coverage/packing facts, audit/outbox commit atomically |
| BE26B-GCF08 | Gcf08Request strict; line-scoped command and expected version | OrderTransitionSuccess with canonical state/clocks | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Order/line state, clocks, transition audit and outbox commit atomically |
| BE26B-GCF09 | Gcf09Request strict; material change and buyer choices | AmendmentSuccess; dispatchPaused is always true | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Amendment, dispatch hold, deadline/clock, audit and outbox commit atomically |
| BE26B-GCF10 | Gcf10Request strict; action-specific evidence/verification | DeliverySuccess; verifiedDelivery only after verified path | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Evidence, order/shipment state, clocks, audit and outbox commit atomically |

## Authorization and Ownership

| Operation ID | Actor and role | Ownership/party predicate | 403 versus 404 |
|---|---|---|---|
| BE26B-GCF06 | Buyer or buying-party controller | buyerPartyId controlled by authenticated account; quote destination token belongs to party | Hidden line/order context returns 404 FREIGHT_CONTEXT_NOT_FOUND; visible context without buyer grant is 403 FREIGHT_QUOTE_FORBIDDEN |
| BE26B-GCF07 | Seller/dispatch operator; admitted carrier worker | Order seller or delegated operator; carrier option and coverage provider grant scoped to shipment | Hidden order returns 404 ORDER_NOT_FOUND; visible order without dispatch grant is 403 SHIPMENT_COMMIT_FORBIDDEN |
| BE26B-GCF08 | Buyer/seller for allowed action; support only enumerated exception | Action role and current order/line ownership; seller cannot settle/release escrow/confirm buyer receipt | Hidden order returns 404 ORDER_NOT_FOUND; visible action without role is 403 ORDER_TRANSITION_FORBIDDEN |
| BE26B-GCF09 | Seller proposes; buyer alone elects remedy; support case-bound | Seller controls line for amendment; buyer party controls election; no seller acceptance of buyer choice | Hidden order returns 404 ORDER_NOT_FOUND; visible party without action grant is 403 AMENDMENT_FORBIDDEN |
| BE26B-GCF10 | Seller dispatch actor, buyer receipt actor, authenticated carrier callback, or dual-control support | Provider event scoped to shipment; buyer/seller verification stage and party are current | Hidden order/shipment returns 404 DELIVERY_CONTEXT_NOT_FOUND; visible actor without action grant is 403 DELIVERY_FORBIDDEN |

Exact addresses, destination tokens, carrier credentials and evidence originals are purpose-bound. Support exceptions require immutable reason, evidence and dual control above configured value. A provider can submit facts but cannot transition unrelated state or widen user authority.

## Middleware and Security

### Per-operation middleware registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
|---|---|---|---|
| BE26B-GCF06 | requestId → CORS → auth → party context → rate limit → idempotency → strict body validation → domestic/freight policy → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary Origin | max body 128 KiB; address token only; no claim/payment; freight class cannot be downgraded |
| BE26B-GCF07 | requestId → CORS → auth → seller/dispatch context → rate limit → idempotency → strict body validation → order/quote/coverage gate → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary Origin | max body 256 KiB; package/evidence bounds; provider allowlist; no parcel fallback |
| BE26B-GCF08 | requestId → CORS → auth → party context → rate limit → idempotency → strict body validation → order lock/state guard → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary Origin | max body 64 KiB; offline ID dedupe; command allowlist; clock policy and expected version |
| BE26B-GCF09 | requestId → CORS → auth → seller context → rate limit → idempotency → strict body validation → material-change/order lock → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary Origin | max body 64 KiB; HTML-safe explanation; buyer election isolated; dispatch hold cannot be bypassed |
| BE26B-GCF10 | requestId → CORS → auth/provider signature → rate limit → idempotency → strict body validation → evidence grant/state guard → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary Origin | max body 256 KiB; carrier replay protection; verified delivery method required; no raw scan trust |

## Idempotency, Rate Limits, and SLOs

| Operation ID | Idempotency and concurrency | Rate limit | SLO and timeout |
|---|---|---|---|
| BE26B-GCF06 | Required key/body hash; one active request per buyer/line/destination tuple; quote version append-only | 10 per buyer per 10 minutes, burst 2 | receipt p95 1 s, hard 15 s; worker retry below |
| BE26B-GCF07 | Required key/body hash; order lock and quote/coverage revision; duplicate provider booking reconciles | 10 per seller per 10 minutes, burst 2 | p95 1.5 s, hard 15 s; booking ambiguity is pending |
| BE26B-GCF08 | Required key/body hash plus offlineCommandId; order/line lock; stale transition fails | 30 per actor per minute, burst 5 | p95 900 ms, hard 15 s; lock retry 2 at 50/150 ms |
| BE26B-GCF09 | Required key/body hash; one open amendment per line/disclosure version; buyer election versioned | 10 per seller per 10 minutes, burst 2 | p95 1 s, hard 15 s; deadline worker bounded |
| BE26B-GCF10 | Required key/body hash; providerEventId inbox dedupe; order/line lock | 30 per actor per minute, burst 5 | p95 900 ms, hard 15 s; provider retries below |

BE-00 idempotency results retain at least 24 hours. Lost responses recover by key lookup. A clock deadline is server time; offline device time is evidence only. No retry treats a timeout as a successful booking, delivery or transition.

## Observability

| Operation ID | Metrics | Structured logs and traces | Audit/outbox evidence |
|---|---|---|---|
| BE26B-GCF06 | quote_request_total by freight class; quote_ready_total; quote_unavailable_total; latency | requestId, operationId, line count, class, destination region, result; no address | quote.created/updated audit; gear_logistics.quote_changed.v1 |
| BE26B-GCF07 | shipment_commit_total; carrier_booking_total; coverage_block_total; latency | requestId, operationId, order hash, carrier option, quote/coverage versions, result | shipment.created/blocked audit; gear_shipment.state_changed.v1 |
| BE26B-GCF08 | order_transition_total by state; stale_transition_total; clock_expiry_total | requestId, operationId, order/line hashes, old/new state, clock IDs, reason | order.transition audit; gear_order.state_changed.v1 |
| BE26B-GCF09 | amendment_total by choice; dispatch_hold_total; deadline_void_total | requestId, operationId, order/line hash, change class, deadline, choice/result | amendment.opened/elected audit; gear_order.amendment_opened.v1 |
| BE26B-GCF10 | delivery_event_total by action; verified_delivery_total; carrier_duplicate_total; latency | requestId, operationId, shipment/order hash, evidence count, verification method, result | delivery/evidence audit; gear_shipment.state_changed.v1 and order state event |

Carrier payloads, exact addresses, payment data, evidence bytes and buyer notes never enter logs/provider-native diagnostics. Alert on carrier duplicate storms, booking ambiguity, coverage blocks, clock skew, unverified delivered state, and misdelivery events.

## Persistence and RLS

All tables are protected schemas with enabled and forced RLS. Direct anon/authenticated table grants are denied. Security-invoker RPCs recheck account/party, order line ownership, provider signature, expected version, clock policy and evidence grant. Every mutation writes audit and event outbox rows in the same transaction.

### Complete table definitions

| Table / model | Typed fields with SQL types, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.orders / Order | id uuid PK; checkout_group_id uuid NOT NULL FK platform_private.checkout_groups(id); buyer_party_id uuid NOT NULL FK identity.parties(id); seller_party_id uuid NOT NULL FK identity.parties(id); state text NOT NULL CHECK in created/authorized/awaiting_dispatch/dispatched/delivered/inspection/settled/awaiting_buyer_amendment/damage_hold/return_authorized/return_in_transit/returned/cancelled/refunded/post_settlement_claim; version bigint NOT NULL CHECK > 0; listing_version_id uuid NOT NULL FK platform_private.listing_versions(id); disclosure_version_id uuid NOT NULL FK platform_private.listing_disclosure_versions(id); policy_version_id uuid NULL FK platform_private.storefront_policy_versions(id); price_minor bigint NOT NULL CHECK >= 0; currency char(3) NOT NULL; destination_snapshot jsonb NOT NULL; payment_authorization_id uuid NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(checkout_group_id,id) | buyer_party_id/updated_at DESC; seller_party_id/state; state/updated_at DESC; checkout_group_id; listing_version_id | Buyer/seller see permitted order projection; exact destination only purpose grant; provider sees scoped shipment; forced RLS; no direct client grant |
| platform_private.order_lines / OrderLine | id uuid PK; order_id uuid NOT NULL FK platform_private.orders(id); marketplace_unit_id uuid NULL FK platform_private.marketplace_units(id); quantity integer NOT NULL CHECK > 0; amount_minor bigint NOT NULL CHECK >= 0; currency char(3) NOT NULL; state text NOT NULL CHECK in created/authorized/awaiting_dispatch/dispatched/delivered/inspection/settled/awaiting_buyer_amendment/damage_hold/return_authorized/return_in_transit/returned/cancelled/refunded/post_settlement_claim; version bigint NOT NULL CHECK > 0; listing_version_id uuid NOT NULL FK platform_private.listing_versions(id); disclosure_version_id uuid NOT NULL FK platform_private.listing_disclosure_versions(id); claim_id uuid NULL FK platform_private.inventory_claims(id); shipment_id uuid NULL FK platform_private.shipments(id); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(order_id,id) | order_id/state; marketplace_unit_id/state; claim_id; shipment_id; state/updated_at DESC | Party projection follows order; seller/buyer line-specific rights; provider scoped shipment only; forced RLS; no direct client grant |
| platform_private.order_clocks / OrderClock | id uuid PK; order_id uuid NOT NULL FK platform_private.orders(id); order_line_id uuid NULL FK platform_private.order_lines(id); clock_type text NOT NULL CHECK in offer_checkout/dispatch/amendment_response/inspection/return_dispatch/return_receipt/evidence_submission; policy_version text NOT NULL; started_at timestamptz NOT NULL; deadline_at timestamptz NOT NULL; paused_at timestamptz NULL; pause_reason text NULL; protected_filing_id uuid NULL; state text NOT NULL CHECK in active/paused/expired/completed/cancelled; version bigint NOT NULL CHECK > 0; created_at timestamptz NOT NULL; UNIQUE(order_id,order_line_id,clock_type,version) | order_id/state; order_line_id/clock_type/state; deadline_at/state; protected_filing_id | Party sees own active clock; support case-bound; worker updates through clock RPC; forced RLS; no direct client grant |
| platform_private.shipments / Shipment | id uuid PK; order_id uuid NOT NULL FK platform_private.orders(id); order_line_id uuid NOT NULL FK platform_private.order_lines(id); mode text NOT NULL CHECK in standard/freight/oversize; origin_snapshot jsonb NOT NULL; destination_snapshot jsonb NOT NULL; freight_class text NOT NULL CHECK in standard/freight/oversize; freight_quote_request_id uuid NOT NULL FK platform_private.freight_quote_requests(id); quote_version bigint NOT NULL; carrier_option_id uuid NULL; coverage_status text NOT NULL CHECK in admitted/unsupported/required/pending; booking_reference text NULL CHECK length <= 180; state text NOT NULL CHECK in pending_provider/booked/dispatch_blocked/dispatched/delivered/delivery_exception/cancelled; version bigint NOT NULL CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(order_line_id) | order_id; order_line_id; state/updated_at DESC; booking_reference; coverage_status | Buyer/seller scoped shipment projection; exact destination purpose-bound; carrier worker assigned row; forced RLS; no direct client grant |
| platform_private.freight_quote_requests / FreightQuoteRequest | id uuid PK; requester_party_id uuid NOT NULL FK identity.parties(id); order_line_ids uuid[] NOT NULL CHECK cardinality between 1 and 20; destination_token uuid NOT NULL FK platform_private.address_tokens(id); freight_class text NOT NULL CHECK in standard/freight/oversize; dimensions jsonb NOT NULL; requirements jsonb NOT NULL; coverage_request_minor bigint NULL CHECK >= 0; currency char(3) NOT NULL; state text NOT NULL CHECK in queued/ready/expired/unavailable; quote_version bigint NOT NULL CHECK > 0; valid_until timestamptz NULL; provider_request_ref text NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | requester_party_id/created_at DESC; state/valid_until; order_line_ids GIN; provider_request_ref | Requester sees own; provider assigned request only; exact address token never public; forced RLS; no direct client grant |
| platform_private.packing_evidence / PackingEvidence | id uuid PK; shipment_id uuid NOT NULL FK platform_private.shipments(id); standard_version text NOT NULL CHECK length <= 80; evidence_frame_ids uuid[] NOT NULL CHECK cardinality between 1 and 50; scan_event_id text NULL CHECK length <= 180; captured_by uuid NOT NULL FK auth.users(id); captured_at timestamptz NOT NULL; state text NOT NULL CHECK in pending/accepted/rejected; hash char(64) NOT NULL; created_at timestamptz NOT NULL; UNIQUE(shipment_id,hash) | shipment_id/captured_at DESC; scan_event_id; state; hash | Seller/authorized provider may append; buyer sees safe evidence summary; bytes via BE-00 object grant; forced RLS; no direct client grant |
| platform_private.order_amendments | id uuid PK; order_id uuid NOT NULL FK platform_private.orders(id); order_line_id uuid NOT NULL FK platform_private.order_lines(id); disclosure_version_id uuid NOT NULL FK platform_private.listing_disclosure_versions(id); change_class text NOT NULL; seller_explanation text NOT NULL CHECK length <= 2000; proposed_reduction_minor bigint NULL CHECK >= 0; state text NOT NULL CHECK in awaiting_buyer_amendment/accepted/accepted_with_reduction/voided/expired; dispatch_paused boolean NOT NULL DEFAULT true CHECK dispatch_paused=true; buyer_deadline_at timestamptz NOT NULL; buyer_decision_by uuid NULL FK identity.parties(id); version bigint NOT NULL CHECK > 0; created_at timestamptz NOT NULL; decided_at timestamptz NULL; UNIQUE(order_line_id,disclosure_version_id) | order_id/state; order_line_id/state; buyer_deadline_at/state; disclosure_version_id | Buyer/seller see permitted amendment; seller cannot elect; support case-bound; forced RLS; no direct client grant |

Database constraints enforce one shipment per order line, domestic country at launch, quote validity before booking, no shipment dispatch when coverage required/unsupported, no delivered transition from raw scan alone, one active clock per type/line, and no order state transition that bypasses expected version. JSON snapshots are schema-validated and bounded before insertion.

### Permission and RLS matrix

| Principal | Read | Insert | Update | Delete |
|---|---|---|---|---|
| anon | None; public listing only | None | None | None |
| authenticated buyer | Own order/line/clock, safe shipment/quote/evidence | Quote request, buyer transition/election through RPC | State/election RPC only | None |
| authenticated seller | Own order/line, dispatch/packing/amendment views | Shipment/amendment/evidence RPC | Dispatch/state proposal RPC only | None |
| carrier provider | Assigned shipment facts and callback projection | Signed quote/booking/scan RPC | Shipment/provider state only | None |
| support/risk | Case-bound redacted order/evidence | Enumerated exception with dual control | No ordinary state bypass | None |
| service role | Migration/redaction/retention | Controlled procedures | Controlled procedures | Retention procedure only |

## State Machines, Concurrency, and Failure Recovery

### Order and shipment state machine

| Current | Command | Preconditions | Next | Side effects |
|---|---|---|---|---|
| created | authorize | payment authorization and all committed lines | authorized | start dispatch clock |
| authorized | commit shipment | ready quote, order current, packing/coverage policy | awaiting_dispatch or dispatch_blocked | shipment record and booking job |
| awaiting_dispatch | dispatch | packing evidence and booking admitted | dispatched | append shipment event; dispatch clock complete |
| dispatched | verified delivery | authorized verification method/evidence | delivered | start inspection and settlement clocks |
| dispatched | carrier scan | signed provider event only | dispatched | append evidence; no delivery clock |
| delivered | enter inspection | verified delivery and current clock | inspection | start category/value/pickup inspection clock |
| any pre-settlement | amendment opened | material disclosure change before dispatch | awaiting_buyer_amendment | pause dispatch; buyer election clock |
| awaiting_buyer_amendment | buyer accept/reduce/void | buyer party and deadline | authorized/awaiting_dispatch or cancelled/refunded | apply election; no seller election |

Side states damage_hold, return_authorized, return_in_transit, returned, refunded and post_settlement_claim are owned by BE-26c and may suspend or complete clocks through events. Financial settlement is not produced here.

### Race and recovery matrix

| Race | Serialization rule | Winner/loser behavior | Recovery |
|---|---|---|---|
| Quote readiness versus sale | Quote has no hold; checkout/claim revalidates price/availability | Sale wins; ready quote returns stale/sold | Reprepare checkout |
| Shipment booking versus coverage failure | Order-line lock and coverage revision | Coverage failure blocks dispatch; no parcel substitute | Change carrier/coverage and resubmit |
| Disclosure amendment versus dispatch | Line lock before dispatch commit | Amendment wins before dispatch; dispatch paused | Buyer election or deadline void |
| Carrier scan versus human evidence | Evidence append and verification policy | Contradictory human evidence is not overwritten by scan | Route evidence case; keep current state |
| Delivery versus damage filing | Protected filing checked against server deadline | Timely filing creates hold; auto-settle loses | BE-26c damage workflow |
| Two order transitions | Expected version and line lock | First commit wins; stale transition 409 | Refetch canonical state |
| Provider duplicate webhook | Inbox/provider event unique key | First state transition wins; duplicate no-op | Ack after canonical refetch |
| Offline command versus online command | offlineCommandId plus order version | One valid transition; stale device gets canonical state | Reconcile draft and resubmit |

Deadlocks retry twice at 50/150 ms. Worker leases expire after eight attempts; poison carrier payloads quarantine. Lost responses recover by idempotency/provider inquiry. Outbox delivery is at-least-once, and consumers deduplicate eventId plus aggregate/version. Carrier silence remains silence and does not advance a clock.

## External Seams

| Seam | Exact request | Exact response | Timeout | Retry/backoff | Circuit behavior |
|---|---|---|---|---|---|
| Freight quote adapter | { quoteRequestId, freightClass, dimensions, destinationToken, requirements, coverageMinor, currency } | { providerRequestId, options: [{ carrierOptionId, amountMinor, coverageStatus, validUntil }], providerRevision } | 8,000 ms | 3 retries at 250/750/1500 ms for timeout/408/429/5xx | Open after 5 failures in 120 s; quote becomes unavailable, no parcel fallback |
| Carrier booking adapter | { shipmentId, orderLineId, carrierOptionId, packages, packingStandardVersion, coverageConfirmationId } | { bookingReference, state: booked/pending/declined, labelObjectId?, providerEventId, providerRevision } | 8,000 ms | 2 retries at 300/900 ms only when provider says not accepted | Open after 3 failures in 60 s; dispatch blocked/pending, never guessed booked |
| Carrier event webhook | { providerEventId, bookingReference, eventType, observedAt, evidenceRef, signature } | { accepted, canonicalShipmentState, duplicate } | 3,000 ms | Receiver performs no automatic replay; provider may redeliver up to 5 times at 1 s, 5 s, 30 s, 120 s, and 600 s with full jitter (±20%); retryable delivery responses are 408/429/5xx or timeout, while 2xx is terminally accepted and 400/401/403 signature/schema failures are terminally quarantined; dedupe by `providerEventId` and booking reference | Opens after 10 invalid signatures in 60 s; half-opens after 60 s with 1 signed probe; fallback while open is 503 `WEBHOOK_RETRYABLE` with quarantine and no mutation; successful probe closes, failed probe remains open for 120 s |
| BE-25b listing/disclosure refetch | { orderLineId, listingVersionId, disclosureVersionId } | { current, materialChange, dispatchAllowed, screeningStatus, policyVersionId } | 3,000 ms | 2 retries at 150/450 ms | Open after 5 failures in 60 s; amendment/dispatch fails closed |
| BE-25c inventory eligibility | { orderLineIds[], operation: shipment_or_lifecycle } | { lines: [{ orderLineId, claimId, availability, revision }] } | 3,000 ms | 2 retries at 150/450 ms | Open after 5 failures in 60 s; no silent stock change |
| BE-00 audit/outbox | { aggregateId, eventType, requestId, payloadHash } | { auditId, outboxId } | 2,000 ms | Exactly 1 bounded transaction retry after serialization/deadlock at 100 ms with full jitter (50–150 ms); retryable only before commit is known; constraint, validation, and unknown-commit outcomes are terminal for the request and reconcile by `aggregateId` plus `payloadHash`; no independent network retry | Opens after 3 failures in 30 s; half-opens after 30 s with 1 probe; fallback while open is 503 `DEPENDENCY_UNAVAILABLE` with no audit/outbox side effect; successful probe closes, failed probe remains open for 60 s; command fails atomically |

## Error Matrix

| Operation IDs | Condition | HTTP | Error code | Retry/client action |
|---|---|---:|---|---|
| BE26B-GCF06 | Hidden line/order or destination | 404 | FREIGHT_CONTEXT_NOT_FOUND | Do not reveal order/party |
| BE26B-GCF06 | Freight class/size unsupported | 422 | FREIGHT_UNSUPPORTED | No parcel fallback; choose supported route |
| BE26B-GCF06 | Quote provider unavailable | 503 | FREIGHT_QUOTE_UNAVAILABLE | Retry same key; no claim/payment |
| BE26B-GCF07 | Hidden order or shipment | 404 | ORDER_NOT_FOUND | Do not reveal |
| BE26B-GCF07 | Quote expired/stale | 409 | QUOTE_VERSION_CONFLICT | Request new quote |
| BE26B-GCF07 | Coverage required but not admitted | 409 | COVERAGE_REQUIRED | Change carrier/coverage |
| BE26B-GCF07 | Carrier booking ambiguous | 503 | BOOKING_RECONCILIATION_PENDING | Do not retry blindly; await provider inquiry |
| BE26B-GCF08 | Stale expected order version | 409 | ORDER_VERSION_CONFLICT | Refetch canonical state |
| BE26B-GCF08 | Illegal transition/action role | 409 or 403 | ORDER_STATE_CONFLICT or ORDER_TRANSITION_FORBIDDEN | Use state-allowed actor/action |
| BE26B-GCF09 | Material change after dispatch | 409 | AMENDMENT_TOO_LATE | Open remedy case through BE-26c |
| BE26B-GCF09 | Seller attempts buyer election | 403 | BUYER_ELECTION_REQUIRED | Buyer must elect |
| BE26B-GCF10 | Unsigned/duplicate provider event | 401 or 409 | PROVIDER_EVENT_INVALID or PROVIDER_EVENT_DUPLICATE | Verify signature or ack duplicate |
| BE26B-GCF10 | Raw scan presented as verified delivery | 422 | DELIVERY_VERIFICATION_REQUIRED | Supply authorized verification/evidence |
| All | Idempotency key body mismatch | 409 | IDEMPOTENCY_KEY_REUSE | New key only for new intent |
| All | Rate limit exceeded | 429 | RATE_LIMITED | Honor Retry-After |
| All | Extra/unsafe/malformed input | 400 | INVALID_INPUT | Correct strict schema |

Every response serializes ErrorResponse with BE-00 ApiError { code, message, requestId, details }. Error details contain stable codes/field paths only, never addresses, payment data, evidence originals or provider secrets.

## Testing Strategy

### Contract and route tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE26B-CON-001 | BE26B-GCF06 | Domestic/freight bounds, no-claim/payment success and quote validity are strict |
| BE26B-CON-002 | BE26B-GCF07 | Current quote/version, package/evidence, coverage and no-parcel acknowledgement are enforced |
| BE26B-CON-003 | BE26B-GCF08 | Command/state/version/offline ID schema and canonical success are enforced |
| BE26B-CON-004 | BE26B-GCF09 | Material amendment, reduction conditionality, buyer choices and deadline are enforced |
| BE26B-CON-005 | BE26B-GCF10 | Action-specific evidence, carrier ID, authorized verified delivery and strict response are enforced |
| BE26B-ROUTE-001 | BE26B-GCF06 through BE26B-GCF10 | Method/path registry exact; no alias bypasses middleware |

### Authorization and privacy tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE26B-AUTH-001 | BE26B-GCF06 through BE26B-GCF10 | Hidden context returns 404; visible missing grant returns 403 |
| BE26B-AUTH-002 | BE26B-GCF07, BE26B-GCF08 | Seller cannot settle/release escrow/confirm buyer receipt; provider scope is shipment-only |
| BE26B-AUTH-003 | BE26B-GCF09 | Buyer alone elects remedy; seller explanation cannot contain unsafe HTML/private evidence |
| BE26B-AUTH-004 | BE26B-GCF06, BE26B-GCF10 | Address tokens, carrier secrets and evidence bytes stay purpose-bound |

### Persistence, idempotency, and concurrency tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE26B-DB-001 | BE26B-GCF06 through BE26B-GCF10 | Forced RLS denies direct table access; RPC validates actor/party/version |
| BE26B-DB-002 | BE26B-GCF06, BE26B-GCF07 | Same key/body replays; provider booking ambiguity does not duplicate |
| BE26B-DB-003 | BE26B-GCF08, BE26B-GCF09 | Concurrent transitions/amendments serialize; clocks and dispatch hold remain consistent |
| BE26B-DB-004 | BE26B-GCF10 | Provider event inbox dedupe and raw-scan/non-delivery invariant hold |
| BE26B-DB-005 | All assigned operations | SQL types, nullability, constraints/FKs, indexes, RLS/grants and append-only evidence are migration-tested |

### Domain, seam, event, and recovery tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE26B-DOM-001 | BE26B-GCF06, BE26B-GCF07 | Freight class cannot parcel-downgrade; quote has no claim/payment; coverage blocks dispatch |
| BE26B-DOM-002 | BE26B-GCF08 | Line-scoped state machine and versioned clocks advance only on explicit valid action |
| BE26B-DOM-003 | BE26B-GCF09 | Pre-dispatch material amendment pauses shipment and buyer no-answer resolves to void at deadline |
| BE26B-DOM-004 | BE26B-GCF10 | Verified delivery starts clocks; carrier silence/scan cannot fabricate delivery; misdelivery routes recall/refund |
| BE26B-SEAM-001 | BE26B-GCF06 through BE26B-GCF10 | Quote/carrier, BE-25b/25c and BE-00 timeout/retry/circuit behavior is exact |
| BE26B-EVT-001 | BE26B-GCF06 through BE26B-GCF10 | Event privacy, outbox atomicity, duplicate webhook and consumer refetch are verified |
| BE26B-REC-001 | BE26B-GCF06 through BE26B-GCF10 | Lost response, deadlock, lease expiry, provider outage, stale transition and evidence conflict recover as specified |

## Deepening Passes

| Pass | Question | Resolution and evidence |
|---|---|---|
| D1 quote authority | Can a quote reserve or charge? | No. Quote request/success explicitly claimsCreated false and paymentAuthorized false |
| D2 freight safety | Can buyer downgrade freight to parcel? | No. Freight class derives from facts and no-parcel fallback is enforced |
| D3 coverage | What happens when declared-value cover is unsupported? | Dispatch blocks with typed COVERAGE_REQUIRED; alternate admitted option is required |
| D4 state truth | Can a raw carrier scan mean delivery? | No. Scan appends evidence; verified method and party start clocks |
| D5 remedy precedence | Can auto-settle beat timely damage/amendment? | No. Protected filing/dispatch hold wins under line lock; BE-26c owns remedy hold |
| D6 buyer election | Can seller choose accept/reduce/void? | No. Buyer controls election; no answer voids at configured deadline |
| D7 privacy | Can exact address or provider secret leak? | No. Tokens, purpose grants, redaction and scoped provider callbacks |
| D8 reliability | What if carrier response is unknown or duplicate? | Pending/reconciliation and inbox dedupe; no guessed booking/delivery |
| D9 persistence | Are fields and grants implementable? | Every table lists SQL types, nullability, constraints/FKs, indexes, RLS and grants |
| D10 auditability | Does every operation have keyed evidence? | Contract/auth/middleware/CORS/idempotency/rate/observability/error/test rows cover GCF06–GCF10 |

## Ambiguity Gate

**PASS.** Evidence: interactions 26.06–26.10 map one-to-one to BE26B-GCF06–GCF10; Order, OrderLine, OrderClock, Shipment, FreightQuoteRequest and PackingEvidence authority is explicit; quote/no-hold, domestic/no-parcel, coverage, line clocks, buyer amendment election, scan versus verified delivery, provider replay, ownership/privacy, typed persistence/RLS/grants, CORS policy gear-api, global ApiError, exact seams and keyed tests are specified. Checkout, remedies, pickup/service and future-gate routes are referenced without duplication.

## Open Questions

None

## Dependency References

- BE-00 platform contracts in 00-infrastructure.md: strict Zod 4, ApiError { code, message, requestId, details }, idempotency, outbox, forced RLS, CORS, audit and rate classes.
- BE-23a identity/party authority in 23a-gear-identity-claims-transfers.md: buyer/seller party and ownership context.
- BE-24d custody in 24d-custody-cases-manifests.md: custody/liability and sell grant.
- BE-25b listing lifecycle in 25b-gear-listing-disclosure-lifecycle.md: ListingVersion, DisclosureVersion, amendment/screening gates.
- BE-25c inventory in 25c-gear-inventory-bulk-channels.md: MarketplaceUnit/InventoryClaim and availability.
- BE-26a offers/cart/checkout in 26a-gear-offers-cart-checkout.md: group commit and independent order creation.
- BE-26c remedies/settlement: damage/return/settlement clocks and holds.
- BE-26d pickup/service/warranty: pickup confirmation can provide scoped delivery evidence.
- BE-26e future commerce gates: international remains disabled at launch.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-08-29 | Initial production-grade BE companion for interactions 26.06–26.10; domestic freight, shipment/order lifecycle, amendment, delivery evidence, strict contracts, persistence/RLS, eventing, recovery and ambiguity evidence added |
