# BE-26d — Gear Pickup, Pre-Dispatch Service, and Warranty Routing

## Classification

This companion is the backend contract for pickup arrangements, pre-dispatch service elections, and warranty/RMA routing in IA shard 26. It classifies 26.17–26.20 as authenticated, line-scoped commands with protected location data, adult-participant checks, evidence requirements, policy-versioned clocks, and durable handoffs. It owns PickupArrangement and the service/RMA route records needed to broker those workflows. It does not become a warehouse, carrier, insurer, warranty administrator, escrow, settlement, title registry, or custody authority.

| Boundary | Included | Excluded and handoff |
| --- | --- | --- |
| Interaction ownership | 26.17 Arrange platform pickup; 26.18 Complete off-platform pickup; 26.19 Add pre-dispatch service; 26.20 Route RMA/warranty | Offers/cart/checkout 26a; freight, dispatch, and delivery 26b; remedies, settlement, and title 26c; future commerce gates 26e |
| Pickup authority | Platform-settled pickup arrangement, coarse venue, protected exact-location token, adult participant attestations, dual confirmation, disagreement/no-show state | BE-24 custody grants, BE-26c settlement and title, and any physical custody by the platform |
| Service authority | Pre-dispatch service request, price/eligibility snapshot, provider handoff, and dispatch-impact election | BE-14 service engagement/history; seller remains responsible for service promises; no platform warranty |
| Warranty authority | Manufacturer/seller warranty eligibility and RMA routing receipt | Manufacturer or seller adjudicates warranty; platform brokers evidence and routing only |
| Security boundary | Party-scoped projections, purpose-bound location/evidence, callback signatures, and 403 versus 404 | No direct client table grant, exact location in public events, payment instrument, or provider secret |

The implementation target is TypeScript on Hono/Cloudflare Workers with Supabase PostgreSQL, strict Zod 4 contracts, transactional outbox, forced RLS, structured audit, and Sentry-compatible telemetry. A platform pickup can influence fulfillment and settlement eligibility only through explicit state and evidence; an off-platform pickup records an arrangement and confirmation but provides no escrow, settlement, or automatic ownership-transfer guarantee.

## Referenced Material Inventory

| Source | Location | Material used | Traceability |
| --- | --- | --- | --- |
| IA shard | .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md lines 24–38 | Locked decisions for platform/off-platform pickup, adults-only exchange, service and warranty boundaries, and no platform custody | Restated in pickup, service, warranty, and state sections |
| IA shard | .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md lines 79–100 | Interaction definitions 26.17–26.20 and neighboring routes | One operation ID maps to each assigned interaction in the IA Source Map and route registry |
| IA shard | .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md lines 106–117 | ConfirmPickup command contract and shared order command conventions | Pickup request schema preserves confirmation, actor, location, and expected version controls |
| IA shard | .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md lines 129–144 | Canonical Data Models including PickupArrangement and consumed order, clock, shipment, disclosure, and compliance models | Model inventory and persistence mapping distinguish owned models from consumed models |
| IA shard | .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md lines 209–222 | Event Schemas for pickup, order, shipment, logistics, offer, checkout, remedy, and compliance | Event table uses exact event type literals and privacy rules |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md lines 43–47 | Platform versus off-platform pickup, safe venue, protected location, dual confirmation, no-show, disagreement, and minor restrictions | Pickup state and race matrices make both branches executable |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md lines 47–48 | Pre-dispatch service election, contradiction handling, manufacturer warranty/RMA route, and no platform warranty | Service/RMA state and seam contracts preserve provider ownership |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md lines 57–63 | Payment, ownership, settlement, and custody ordering | Pickup confirmation never independently settles or transfers ownership |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md lines 76–91 | Pickup side states, access controls, exact address purpose binding, organization control, and custody liability | Authorization, persistence, and state rows apply least privilege |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md lines 116–122 | Pickup disagreement/no-show races, duplicate callbacks, and service/warranty failures | Idempotency and recovery matrices define holds and replay |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md lines 130–143 | Pickup evidence tiers, no warehouse/custody, no platform warranty, and deferred rental/trade flows | Ambiguity Gate records each lock and non-duplication boundary |
| BE platform | .memory/wiki/specs/be/00-infrastructure.md lines 112–153 | Global strict Zod 4 schema conventions and ApiError { code, message, requestId, details } | All request, success, and error contracts cite the global envelope |
| BE platform | .memory/wiki/specs/be/00-infrastructure.md lines 208–308 | Auth, forced RLS, grants, idempotency, rate classes, CORS, audit, outbox, and callback controls | Middleware, persistence, and observability matrices inherit these contracts |
| BE identity/custody | .memory/wiki/specs/be/23-gear-provenance.md and .memory/wiki/specs/be/24-gear-collections.md | Canonical parties, service history, ownership, custody, and possession grants | Pickup and warranty records reference party/custody authority without rewriting it |
| BE service | .memory/wiki/specs/be/14-service-engagements.md | Service eligibility, provider engagement, pricing, warranty/service history, and provider callback boundary | Pre-dispatch service and RMA seams defer adjudication to BE-14/provider |
| BE marketplace | .memory/wiki/specs/be/25b-gear-listing-disclosure-lifecycle.md and .memory/wiki/specs/be/25c-gear-inventory-bulk-channels.md | Purchased disclosure, listing, inventory claim, and seller/party context | Service and pickup decisions use immutable order-line snapshots |
| BE adjacent shard | .memory/wiki/specs/be/26a-gear-offers-cart-checkout.md and .memory/wiki/specs/be/26b-gear-logistics-order-lifecycle.md | Independent order, line, shipment, verified delivery, and policy clocks | This companion consumes canonical order/line/shipment/clock facts |
| BE adjacent shard | .memory/wiki/specs/be/26c-gear-remedies-settlement-transfers.md and .memory/wiki/specs/be/26e-gear-future-commerce-gates.md | Remedy/settlement/title handoff and disabled future compliance/capability gates | Pickup/service/warranty routes do not duplicate these authorities |

## IA Source Map

### Assigned interactions

| IA interaction | IA intent and invariant | Backend operation | Authority |
| --- | --- | --- | --- |
| 26.17 | Arrange platform pickup | BE26D-GCF17 | Adult buyer/seller participants, safe coarse venue, protected location token, and platform pickup state are persisted before confirmation |
| 26.18 | Complete off-platform pickup | BE26D-GCF18 | Both parties confirm or disagreement/no-show holds the arrangement; off-platform evidence never creates escrow, settlement, or automatic title |
| 26.19 | Add pre-dispatch service | BE26D-GCF19 | Seller/provider service request is tied to purchased line and dispatch election; contradictions require cancel/reprice/continue decision |
| 26.20 | Route RMA/warranty | BE26D-GCF20 | Eligibility and evidence are routed to manufacturer/seller; platform reports receipt and status without adjudicating warranty |

### Canonical Data Models

| IA model name | Role in this companion | Durable authority or reference |
| --- | --- | --- |
| PickupArrangement | Owned platform/off-platform pickup mode, participants, venue, location token, confirmation, and disagreement state | platform_private.pickup_arrangements |
| Order | Consumed aggregate and state/version gate | platform_private.orders |
| OrderLine | Consumed line scope, purchased snapshot, and dispatch/settlement relationship | platform_private.order_lines |
| OrderClock | Consumed/advanced pickup, dispatch, confirmation, and remedy deadlines | platform_private.order_clocks |
| Shipment | Consumed shipping branch; platform pickup may avoid shipment while off-platform does not prove delivery | platform_private.shipments |
| PackingEvidence | Consumed evidence when a pickup/service branch requires pre-handoff proof | platform_private.packing_evidence |
| OfferThread | Upstream provenance only through immutable order snapshot | BE-26a/BE-25 authority |
| Offer | Upstream accepted price/provenance only | BE-26a/BE-25 authority |
| CartIntent | Upstream fulfillment intent only | BE-26a authority |
| CheckoutGroup | Upstream independent order partition only | BE-26a authority |
| FreightQuoteRequest | Consumed only when a service or branch requires delivery alternative | BE-26b authority |
| ReturnCase | Downstream remedy case may be opened after failed pickup/service/RMA outcome | BE-26c authority |
| DamageCase | Downstream damage evidence may pause settlement | BE-26c authority |
| SettlementRecord | Downstream money close; pickup confirmation never creates it | BE-26c authority |
| OwnershipTransferIntent | Downstream title request only after settlement | BE-26c and BE-23 authority |
| InternationalDetermination | Consumed compliance gate; non-domestic capability remains disabled | BE-26e authority |

Auxiliary service and warranty route records are operational projections, not new IA canonical model names: ServicePreDispatchRequest and WarrantyRmaRoute retain provider correlation, snapshot versions, and status while BE-14 or the manufacturer remains authoritative.

### Event Schemas

| Exact Event Schemas type | Produced/consumed | Payload authority and privacy rule |
| --- | --- | --- |
| gear_pickup.arrangement_changed.v1 | Produced by BE26D-GCF17 and BE26D-GCF18 | Arrangement ID, order/line hashes, mode, state, confirmation class, disagreement code, and version; no exact venue/location |
| gear_order.state_changed.v1 | Consumed from 26b | Canonical line state/version; pickup route refetches before confirmation |
| gear_order.amendment_opened.v1 | Consumed from 26b | Dispatch hold and buyer election gate service timing |
| gear_shipment.state_changed.v1 | Consumed from 26b | Shipment/delivery facts; pickup never treats a raw scan as verified delivery |
| gear_logistics.quote_changed.v1 | Consumed from 26b | Delivery alternative only; service/pickup does not alter freight quote |
| gear_order.damage_claimed.v1 | Consumed from 26c | Damage hold and evidence state may block pickup completion |
| gear_order.return_changed.v1 | Consumed from 26c | Return/inspection state may cancel or pause pickup/service |
| gear_order.settled.v1 | Consumed from 26c | Financial close remains separate from pickup confirmation |
| gear_order.transfer_requested.v1 | Consumed from 26c | Title intent remains settlement-backed; off-platform confirmation cannot synthesize it |
| gear_compliance.determination_changed.v1 | Consumed from 26e | Current domestic/compliance status; fail closed if missing or non-domestic |
| gear_offer.changed.v1 | Consumed as historical price context | No offer mutation or new pricing decision |
| gear_checkout.group_committed.v1 | Consumed as independent order origin | Mixed cart remains partitioned; no one pickup can join independent groups |

## Endpoint Reconciliation

BE-00 owns authentication/session, global error serialization, signed object evidence, idempotency receipts, audit/outbox, and CORS primitives. BE-23 owns identity, service-history, and ownership registry facts; BE-24 owns custody/possession grants and does not delegate custody to this service. BE-14 owns service engagement/provider history and manufacturer/seller warranty authority. BE-25b and BE-25c own immutable disclosure/listing and inventory facts. BE-26a owns checkout/order creation; BE-26b owns shipment, delivery verification, state transitions, and clocks; BE-26c owns remedies, settlement, and title transfer; BE-26e owns disabled international and future capability gates. The four routes below are the only public routes for 26.17–26.20. No route below settles, captures payment, changes a disclosure snapshot, confirms carrier delivery, grants custody, or writes an ownership registry event.

Platform pickup is a fulfillment/evidence branch: the service records a protected location token, staged release, and dual confirmation, then hands state to the canonical order/remedy services. Off-platform pickup records a voluntary arrangement and participant attestations only. An off-platform confirmation is not a payment or delivery receipt and cannot trigger automatic settlement or ownership transfer.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Command | Success |
| --- | --- | --- | --- | --- | --- |
| BE26D-GCF17 | POST | /api/v1/gear/orders/{orderId}/pickup-arrangements | 26.17 | ArrangePlatformPickup | 201 PickupArrangementSuccess |
| BE26D-GCF18 | POST | /api/v1/gear/pickups/{pickupId}/complete | 26.18 | ConfirmPickup | 200 OffPlatformPickupSuccess |
| BE26D-GCF19 | POST | /api/v1/gear/orders/{orderId}/pre-dispatch-services | 26.19 | AddPreDispatchService | 201 ServiceRequestSuccess |
| BE26D-GCF20 | POST | /api/v1/gear/orders/{orderId}/warranty-rmas | 26.20 | RouteWarrantyRma | 202 WarrantyRmaSuccess |

### Request/response contracts (Zod 4)

All schemas are strict Zod 4. UUIDs are canonical lowercase UUID strings; dates are RFC 3339 UTC strings; monetary values are integer minor units and uppercase three-letter currency. Unknown keys, minors, unsafe text, exact public locations, unsupported order states, cross-party IDs, invalid policy versions, and missing idempotency keys fail before mutation. Every failure serializes the BE-00 global envelope ApiError { code, message, requestId, details } through ErrorResponse. Exact location is represented only by a purpose-bound opaque token.

~~~ts
const Id = z.string().uuid();
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const IsoDate = z.string().datetime({ offset: true });
const SafeText = z.string().trim().min(1).max(2000);
const Money = z.object({
  amountMinor: z.number().int().nonnegative().max(100000000000),
  currency: z.string().regex(/^[A-Z]{3}$/),
}).strict();
const EvidenceRef = z.object({
  objectId: Id,
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  kind: z.enum(["photo", "video", "pickup_attestation", "service_record", "warranty_record"]),
  capturedAt: IsoDate,
}).strict();

const Gcf17Request = z.object({
  operationId: z.literal("BE26D-GCF17"),
  orderId: Id,
  orderLineId: Id,
  mode: z.literal("platform"),
  buyerPartyId: Id,
  sellerPartyId: Id,
  coarseVenue: z.enum(["seller_site", "public_safe_venue", "approved_partner_site"]),
  proposedWindowStart: IsoDate,
  proposedWindowEnd: IsoDate,
  exactLocationToken: Id.nullable(),
  participantAttestations: z.object({
    buyerAdult: z.literal(true),
    sellerAdult: z.literal(true),
  }).strict(),
  expectedOrderVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();

const Gcf18Request = z.object({
  operationId: z.literal("BE26D-GCF18"),
  pickupId: Id,
  mode: z.literal("off_platform"),
  confirmer: z.enum(["buyer", "seller"]),
  confirmation: z.enum(["completed", "no_show", "disputed"]),
  completedAt: IsoDate,
  evidence: z.array(EvidenceRef).min(1).max(10),
  note: SafeText.nullable(),
  expectedPickupVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();

const Gcf19Request = z.object({
  operationId: z.literal("BE26D-GCF19"),
  orderId: Id,
  orderLineId: Id,
  serviceCode: z.string().regex(/^[A-Z0-9_:-]{2,80}$/),
  providerPartyId: Id.nullable(),
  servicePrice: Money.nullable(),
  dispatchImpact: z.enum(["no_hold", "hold_until_complete", "buyer_election_required"]),
  buyerElection: z.enum(["accept", "accept_reprice", "cancel"]).nullable(),
  requestedStartAt: IsoDate.nullable(),
  serviceNotes: SafeText.nullable(),
  expectedOrderVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();

const Gcf20Request = z.object({
  operationId: z.literal("BE26D-GCF20"),
  orderId: Id,
  orderLineId: Id,
  warrantyBasis: z.enum(["manufacturer_warranty", "seller_warranty", "statutory_repair", "service_provider_warranty"]),
  issueCode: z.string().regex(/^[A-Z0-9_:-]{2,80}$/),
  issueDescription: SafeText,
  purchaseEvidence: z.array(EvidenceRef).min(1).max(10),
  requestedResolution: z.enum(["repair", "replacement", "inspection", "refund_review"]),
  manufacturerId: Id.nullable(),
  expectedOrderVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();

const PickupArrangementSuccess = z.object({
  operationId: z.literal("BE26D-GCF17"),
  pickupId: Id,
  orderId: Id,
  orderLineId: Id,
  mode: z.literal("platform"),
  state: z.enum(["proposed", "scheduled", "ready", "buyer_confirmed", "seller_confirmed", "completed", "no_show", "disputed", "cancelled"]),
  coarseVenue: z.string().trim().min(1).max(160),
  exactLocationReleased: z.boolean(),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const OffPlatformPickupSuccess = z.object({
  operationId: z.literal("BE26D-GCF18"),
  pickupId: Id,
  mode: z.literal("off_platform"),
  state: z.enum(["arranged", "buyer_confirmed", "seller_confirmed", "completed", "no_show", "disputed", "cancelled"]),
  escrow: z.literal("none"),
  automaticOwnershipTransfer: z.literal(false),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const ServiceRequestSuccess = z.object({
  operationId: z.literal("BE26D-GCF19"),
  serviceRequestId: Id,
  orderId: Id,
  orderLineId: Id,
  state: z.enum(["requested", "quoted", "buyer_election_required", "accepted", "in_progress", "complete", "cancelled", "failed"]),
  dispatchImpact: z.enum(["no_hold", "hold_until_complete", "buyer_election_required"]),
  providerReceipt: z.string().min(1).max(180).nullable(),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const WarrantyRmaSuccess = z.object({
  operationId: z.literal("BE26D-GCF20"),
  rmaRouteId: Id,
  orderId: Id,
  orderLineId: Id,
  state: z.enum(["received", "eligibility_pending", "routed", "manufacturer_review", "seller_review", "repair", "replacement", "refund_review", "closed", "rejected"]),
  warrantyBasis: z.enum(["manufacturer_warranty", "seller_warranty", "statutory_repair", "service_provider_warranty"]),
  providerReceipt: z.string().min(1).max(180).nullable(),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const ApiError = z.object({
  code: z.string().regex(/^[A-Z0-9_]{3,80}$/),
  message: z.string().min(1).max(500),
  requestId: Id,
  details: BE00ErrorDetails,
}).strict();
const ErrorResponse = z.object({ error: ApiError }).strict();
~~~

Gcf17 exactLocationToken is null during proposal and can be populated only by a protected location-release step controlled by the pickup state machine; the public response returns only exactLocationReleased. Gcf18 requires a participant-specific action and does not accept a fabricated dual confirmation. Gcf19 provider and amount are reconciled against BE-14; Gcf20 eligibility and provider routing are reconciled against manufacturer/seller policy. Response replay returns the original stored response through BE-00 idempotency.

### Contract Registry

| Operation ID | Request contract | Success contract and invariant | Error contract | Atomic write set |
| --- | --- | --- | --- | --- |
| BE26D-GCF17 | Gcf17Request strict; platform mode, adult participants, coarse venue, window, and expected order version | PickupArrangementSuccess; exact location remains protected and arrangement is not complete | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Arrangement, participant rows, optional location token, clock, audit, outbox, and idempotency receipt |
| BE26D-GCF18 | Gcf18Request strict; off-platform confirmer, outcome, evidence, and expected pickup version | OffPlatformPickupSuccess; escrow is none and automaticOwnershipTransfer is false | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Confirmation/evidence, arrangement state, disagreement/no-show clock, audit, outbox, and idempotency receipt |
| BE26D-GCF19 | Gcf19Request strict; service code, price/election, provider, and dispatch-impact policy | ServiceRequestSuccess; provider receipt and dispatch hold reflect BE-14 result | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Service request, order hold/election, provider handoff, audit, outbox, and idempotency receipt |
| BE26D-GCF20 | Gcf20Request strict; warranty basis, issue, evidence, requested resolution, and order snapshot | WarrantyRmaSuccess; route receipt is not an eligibility or warranty decision | All failures use ApiError { code, message, requestId, details } via ErrorResponse | RMA route, evidence links, provider handoff, clock, audit, outbox, and idempotency receipt |

## Authorization and Ownership

Resource existence is resolved only after coarse authenticated lookup. A hidden order, line, pickup, service request, RMA route, party, or provider returns 404; a visible resource for which the actor lacks the action grant returns 403. Error details contain stable field paths and codes without hidden venue, party, evidence, or provider facts.

| Operation ID | Allowed roles | Ownership and object scope | 403 versus 404 |
| --- | --- | --- | --- |
| BE26D-GCF17 | Buyer/buying-party controller and seller/dispatch operator; support with case-bound dual control | Both canonical parties must match the order line; exact location is purpose-bound and released only to adult participants when state allows | Hidden order/line returns 404 ORDER_NOT_FOUND; visible line without party/control grant returns 403 PICKUP_ARRANGEMENT_FORBIDDEN |
| BE26D-GCF18 | Authenticated buyer or seller participant; support dual control for dispute/no-show resolution | Confirmer must be a current order party; evidence and confirmation are arrangement-scoped; one side cannot claim bilateral completion | Hidden pickup returns 404 PICKUP_NOT_FOUND; visible pickup without participant grant returns 403 PICKUP_CONFIRMATION_FORBIDDEN |
| BE26D-GCF19 | Seller/dispatch operator; buyer for buyer-election action; BE-14 service worker; support case-bound | Service is tied to purchased line and seller/provider authorization; buyer election cannot be authored by seller | Hidden order/line returns 404 ORDER_NOT_FOUND; visible service action without role/grant returns 403 SERVICE_REQUEST_FORBIDDEN |
| BE26D-GCF20 | Buyer/buying-party controller; seller warranty operator; manufacturer/RMA worker; support case-bound | Request references purchased line and immutable disclosure; provider sees only scoped evidence and route facts | Hidden order/line returns 404 ORDER_NOT_FOUND; visible line without warranty/RMA grant returns 403 WARRANTY_ROUTE_FORBIDDEN |

Minors cannot arrange or complete a stranger pickup; an adult participant assertion is checked against the canonical account/party policy and never inferred from a client boolean alone. Organization actors require an active controlled-party grant. Support exceptions are reason-coded, audited, and require two distinct staff identities when they release exact location, resolve disagreement, or alter money/title-adjacent state. The platform records custody handoff evidence but never claims physical custody.

## Middleware and Security

### Per-operation middleware registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
| --- | --- | --- | --- |
| BE26D-GCF17 | requestId → CORS → auth → party context/adult gate → rate limit → idempotency → strict body validation → order/line state lock → safe-venue policy → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 128 KiB body; coarse venue allowlist; exact location token purpose-bound; no minor or cross-party participant |
| BE26D-GCF18 | requestId → CORS → auth → participant grant → rate limit → idempotency → strict body validation → pickup lock → evidence grant → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 128 KiB body; off-platform literal required; no escrow/settlement/title fields accepted; replay and evidence hash checks |
| BE26D-GCF19 | requestId → CORS → auth → seller/buyer election context → rate limit → idempotency → strict body validation → order/disclosure lock → BE-14 policy gate → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 128 KiB body; provider and price server-reconciled; buyer election isolated from seller; dispatch hold cannot be bypassed |
| BE26D-GCF20 | requestId → CORS → auth/provider signature → party/warranty context → rate limit → idempotency → strict body validation → order/disclosure lock → RMA policy gate → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 256 KiB body; evidence IDs/hash only; provider allowlist; no client eligibility decision or payment data |

All routes apply CSRF protection where browser credentials are used, content-type/body-size checks, safe response headers, origin allowlisting, structured redaction, and request-scoped tracing. Signed object URLs are short-lived and purpose-bound through BE-00. Service/provider callbacks require signed timestamps, replay window 5 minutes, provider event ID dedupe, and scoped worker identity. Exact venue data is withheld from public events, logs, and notifications.

## Idempotency, Rate Limits, and SLOs

| Operation ID | Idempotency and concurrency | Rate limit | SLO and timeout |
| --- | --- | --- | --- |
| BE26D-GCF17 | Required key/body hash; one active platform arrangement per line; order/line lock; same key returns original arrangement | 10 per buyer or seller per 10 minutes, burst 2 | p95 1.2 s, hard 15 s; venue policy is bounded |
| BE26D-GCF18 | Required key/body hash; unique participant confirmation per pickup/version; arrangement lock; provider/evidence duplicate replay | 20 per participant per 10 minutes, burst 3 | p95 1.2 s, hard 15 s; disagreement remains held |
| BE26D-GCF19 | Required key/body hash; one active service code/version per line; line lock; provider correlation dedupe | 10 per seller per 10 minutes, burst 2 | p95 1.5 s, hard 15 s; BE-14 handoff is asynchronous |
| BE26D-GCF20 | Required key/body hash; one active route per issue/warranty basis; provider event ID inbox dedupe | 10 per buyer per 10 minutes, burst 2 | p95 1.5 s, hard 15 s; manufacturer/RMA handoff is asynchronous |

BE-00 idempotency receipts retain at least 24 hours with request hash, status, response, and expiry. A lost response is recovered by key lookup. Server receipt time controls pickup and warranty clocks; client device time is evidence only. Deadlock/serialization retry is at most twice at 50 ms and 150 ms; a timeout never creates a second arrangement, service request, or RMA route.

## Observability

| Operation ID | Metrics and alerts | Structured logs and traces | Audit/outbox evidence |
| --- | --- | --- | --- |
| BE26D-GCF17 | pickup_arrangement_total by venue/state; adult_gate_denied_total; location_release_total; latency; alert on unsafe venue or location leak | requestId, operationId, order/line hash, mode, coarse venue, participant role, state, result; never exact location | pickup.arrangement.created/changed; gear_pickup.arrangement_changed.v1; location token audit |
| BE26D-GCF18 | pickup_confirmation_total by outcome; no_show_total; dispute_total; duplicate_confirmation_total | requestId, operationId, pickup hash, confirmer role, outcome, evidence count, state, result; no note/evidence original | pickup.confirmation.recorded; gear_pickup.arrangement_changed.v1; protected evidence hashes |
| BE26D-GCF19 | service_request_total by code/state; dispatch_hold_total; buyer_election_total; provider_timeout_total | requestId, operationId, order/line hash, service code, provider hash, dispatch impact, election, result; no private notes | service.requested/elected; order hold audit; BE-14 handoff outbox |
| BE26D-GCF20 | warranty_route_total by basis/state; provider_rejection_total; rma_pending_age; evidence_hash_mismatch_total | requestId, operationId, order/line hash, basis, issue code, provider hash, state, result; no issue description/originals | warranty.rma.routed; provider receipt audit; scoped evidence and outbox IDs |

Trace spans include pickup.arrangement, pickup.confirmation, service.dispatch, warranty.rma, and provider.callback, preserving failures, denials, location release, disagreement, and retries. Sentry events scrub exact venue, descriptions, evidence URLs, party identifiers, payment data, and provider credentials. Alerts fire on any off-platform completion marked escrow/transfer, any minor pickup attempt, any exact-location event payload, and any dispatch hold cleared without provider/election evidence.

## Persistence and RLS

All tables use protected schemas with enabled and forced RLS. Direct anon/authenticated table grants are denied. Security-invoker RPCs recheck account/party, adult policy, order/line ownership, mode, state/version, exact-location purpose, service provider grant, warranty policy, and callback signature. Every mutation writes audit and outbox rows in the same transaction. Evidence originals remain in BE-00 object storage; these tables store opaque IDs and hashes.

### Complete table definitions

| Table / model | Typed fields with SQL types, nullability, constraints and FKs | Query indexes | RLS and grants |
| --- | --- | --- | --- |
| platform_private.pickup_arrangements / PickupArrangement | id uuid PRIMARY KEY; order_id uuid NOT NULL REFERENCES platform_private.orders(id); order_line_id uuid NOT NULL REFERENCES platform_private.order_lines(id); buyer_party_id uuid NOT NULL REFERENCES identity.parties(id); seller_party_id uuid NOT NULL REFERENCES identity.parties(id); mode text NOT NULL CHECK (mode IN ('platform','off_platform')); coarse_venue text NOT NULL CHECK (coarse_venue IN ('seller_site','public_safe_venue','approved_partner_site')); state text NOT NULL CHECK (state IN ('proposed','scheduled','ready','arranged','buyer_confirmed','seller_confirmed','completed','no_show','disputed','cancelled')); proposed_window_start timestamptz NOT NULL; proposed_window_end timestamptz NOT NULL CHECK (proposed_window_end > proposed_window_start); exact_location_token uuid NULL REFERENCES platform_private.location_tokens(id); exact_location_released boolean NOT NULL DEFAULT false; escrow_mode text NOT NULL CHECK (escrow_mode IN ('platform_settled','none')); automatic_ownership_transfer boolean NOT NULL DEFAULT false CHECK (automatic_ownership_transfer = false); expected_order_version bigint NOT NULL CHECK (expected_order_version > 0); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(order_line_id) WHERE state IN ('proposed','scheduled','ready','arranged','buyer_confirmed','seller_confirmed','disputed') | (order_line_id,state); (order_id,created_at DESC); (mode,state); (coarse_venue,proposed_window_start); (exact_location_token) | Buyer/seller party projections only; exact token only after purpose grant; support dual-control; forced RLS; no direct client grant |
| platform_private.pickup_confirmations | id uuid PRIMARY KEY; pickup_id uuid NOT NULL REFERENCES platform_private.pickup_arrangements(id); confirmer_party_id uuid NOT NULL REFERENCES identity.parties(id); confirmer_role text NOT NULL CHECK (confirmer_role IN ('buyer','seller')); outcome text NOT NULL CHECK (outcome IN ('completed','no_show','disputed')); completed_at timestamptz NOT NULL; evidence_count integer NOT NULL CHECK (evidence_count BETWEEN 1 AND 10); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; UNIQUE(pickup_id,confirmer_party_id,version) | (pickup_id,created_at DESC); (confirmer_party_id,created_at DESC); (outcome,created_at) | Participant sees own confirmation and safe counterpart state; support/worker case-bound; forced RLS; no direct client grant |
| platform_private.pickup_evidence | id uuid PRIMARY KEY; pickup_id uuid NOT NULL REFERENCES platform_private.pickup_arrangements(id); object_id uuid NOT NULL REFERENCES platform_private.object_refs(id); sha256 char(64) NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'); kind text NOT NULL CHECK (kind IN ('photo','video','pickup_attestation')); captured_at timestamptz NOT NULL; added_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL; UNIQUE(pickup_id,sha256) | (pickup_id,created_at DESC); (object_id); (sha256) | Participants see metadata only; BE-00 grants originals by purpose; forced RLS; no direct client grant |
| platform_private.location_tokens | id uuid PRIMARY KEY; order_id uuid NOT NULL REFERENCES platform_private.orders(id); order_line_id uuid NOT NULL REFERENCES platform_private.order_lines(id); token_hash char(64) NOT NULL CHECK (token_hash ~ '^[a-f0-9]{64}$'); encrypted_location bytea NOT NULL; purpose text NOT NULL CHECK (purpose IN ('platform_pickup_release')); released_to_buyer_at timestamptz NULL; released_to_seller_at timestamptz NULL; expires_at timestamptz NOT NULL; revoked_at timestamptz NULL; created_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL; UNIQUE(order_line_id,purpose) | (order_line_id,purpose); (expires_at,revoked_at); (token_hash) | Only adult party grant and worker can decrypt through BE-00; no direct SQL/storage grant; forced RLS; never in public event |
| platform_private.service_pre_dispatch_requests | id uuid PRIMARY KEY; order_id uuid NOT NULL REFERENCES platform_private.orders(id); order_line_id uuid NOT NULL REFERENCES platform_private.order_lines(id); requested_by uuid NOT NULL REFERENCES auth.users(id); service_code text NOT NULL CHECK (service_code ~ '^[A-Z0-9_:-]{2,80}$'); provider_party_id uuid NULL REFERENCES identity.parties(id); quoted_amount_minor bigint NULL CHECK (quoted_amount_minor >= 0); currency char(3) NULL CHECK (currency ~ '^[A-Z]{3}$'); dispatch_impact text NOT NULL CHECK (dispatch_impact IN ('no_hold','hold_until_complete','buyer_election_required')); buyer_election text NULL CHECK (buyer_election IN ('accept','accept_reprice','cancel')); state text NOT NULL CHECK (state IN ('requested','quoted','buyer_election_required','accepted','in_progress','complete','cancelled','failed')); provider_receipt text NULL CHECK (char_length(provider_receipt) <= 180); order_version bigint NOT NULL CHECK (order_version > 0); policy_version text NOT NULL; version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(order_line_id,service_code) WHERE state IN ('requested','quoted','buyer_election_required','accepted','in_progress') | (order_line_id,state); (provider_party_id,state); (dispatch_impact,state); (created_at DESC); (provider_receipt) | Seller/provider writes through BE-14 handoff; buyer reads/elects own line; support case-bound; forced RLS; no direct client grant |
| platform_private.warranty_rma_routes | id uuid PRIMARY KEY; order_id uuid NOT NULL REFERENCES platform_private.orders(id); order_line_id uuid NOT NULL REFERENCES platform_private.order_lines(id); requested_by uuid NOT NULL REFERENCES auth.users(id); warranty_basis text NOT NULL CHECK (warranty_basis IN ('manufacturer_warranty','seller_warranty','statutory_repair','service_provider_warranty')); issue_code text NOT NULL CHECK (issue_code ~ '^[A-Z0-9_:-]{2,80}$'); issue_description text NOT NULL CHECK (char_length(issue_description) BETWEEN 1 AND 2000); requested_resolution text NOT NULL CHECK (requested_resolution IN ('repair','replacement','inspection','refund_review')); manufacturer_id uuid NULL REFERENCES identity.parties(id); state text NOT NULL CHECK (state IN ('received','eligibility_pending','routed','manufacturer_review','seller_review','repair','replacement','refund_review','closed','rejected')); provider_receipt text NULL CHECK (char_length(provider_receipt) <= 180); policy_version text NOT NULL; order_version bigint NOT NULL CHECK (order_version > 0); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(order_line_id,warranty_basis,issue_code) WHERE state NOT IN ('closed','rejected') | (order_line_id,state); (manufacturer_id,state); (warranty_basis,created_at DESC); (provider_receipt) | Buyer/seller see permitted route state; manufacturer/provider scoped; BE-14/service worker may update status; forced RLS; no direct client grant |
| platform_private.warranty_rma_evidence | id uuid PRIMARY KEY; rma_route_id uuid NOT NULL REFERENCES platform_private.warranty_rma_routes(id); object_id uuid NOT NULL REFERENCES platform_private.object_refs(id); sha256 char(64) NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'); kind text NOT NULL CHECK (kind IN ('photo','video','service_record','warranty_record')); captured_at timestamptz NOT NULL; added_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL; UNIQUE(rma_route_id,sha256) | (rma_route_id,created_at DESC); (object_id); (sha256) | Case participants see metadata; provider sees scoped evidence; BE-00 grants originals; forced RLS; no direct client grant |
| platform_private.pickup_service_event_inbox | id uuid PRIMARY KEY; provider_event_id text NOT NULL; event_type text NOT NULL; aggregate_id uuid NOT NULL; payload_hash char(64) NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'); received_at timestamptz NOT NULL; processed_at timestamptz NULL; state text NOT NULL CHECK (state IN ('received','processed','quarantined')); error_code text NULL; UNIQUE(provider_event_id,event_type) | (provider_event_id,event_type) unique; (state,received_at); (aggregate_id,received_at DESC) | Worker/service only; no client grant; forced RLS; raw payload retained in protected event store |

The partial unique indexes are created as PostgreSQL partial unique indexes matching the active-state predicates shown in the field constraints. Exact location encryption keys are held outside the database; token rows are opaque references. Service prices and provider receipts are snapshots, not authority to charge. No table permits a client to set escrow_mode to platform_settled on an off-platform arrangement or automatic_ownership_transfer to true.

### Permission and RLS matrix

| Principal | Read projection | Write path | Prohibited |
| --- | --- | --- | --- |
| Buyer/buying-party controller | Own pickup state, coarse venue/window, safe confirmation, service election, and RMA route state | Public routes with own party grant; exact location only after adult/purpose gate | Cannot see seller private data, claim bilateral completion, grant custody, settle, or transfer title |
| Seller/dispatch operator | Own order-line pickup/service/warranty state, evidence requests, and provider status | Arrangement proposal, service request, evidence, and seller confirmation through scoped RPC | Cannot release buyer location, force buyer confirmation, settle, transfer title, or adjudicate buyer warranty entitlement |
| Assigned provider/manufacturer | Provider-scoped service/RMA route and evidence metadata | Signed callback or worker RPC with provider receipt and route version | Cannot change order money/title, access unrelated line, or see exact pickup venue |
| Support/safety operator | Case-bound protected projection; exact location only for safety exception | Dual-control release/dispute/no-show and provider escalation RPC | Cannot use generic admin access, erase evidence, or convert off-platform pickup to escrow |
| BE-14/service worker | Service request and dispatch-impact projection | Service handoff and signed provider callback | Cannot create warranty entitlement, capture payment, or change original disclosure |
| BE-26b/26c workers | Necessary state/clock/settlement projections | Canonical order/clock/remedy handoff | Cannot infer delivery/settlement/title from pickup event alone |
| Anon/authenticated client | No direct table access | Public routes after Hono/RPC authorization | Direct SQL, storage, event, location, payment, custody, and registry grants denied |

## State Machines, Concurrency, and Failure Recovery

### Pickup, service, and warranty state machines

Platform PickupArrangement: proposed → scheduled → ready → buyer_confirmed and seller_confirmed → completed; either branch may enter no_show, disputed, or cancelled. Exact location is released only after ready, adult and party checks, and a valid purpose token. Off-platform PickupArrangement: arranged → buyer_confirmed and seller_confirmed → completed, or arranged → no_show|disputed|cancelled; completed remains non-escrow and does not automatically advance settlement/title.

ServicePreDispatchRequest: requested → quoted → buyer_election_required → accepted → in_progress → complete, with cancelled or failed exits. A material service contradiction pauses dispatch until the buyer accepts, accepts a server-reconciled price, or cancels; seller cannot author the buyer election. WarrantyRmaRoute: received → eligibility_pending → routed → manufacturer_review|seller_review → repair|replacement|refund_review → closed, with rejected exit. Routing receipt is not an eligibility or warranty decision.

Pickup confirmation is an evidence transition, not delivery proof. Platform-settled pickup can hand off to the canonical order/remedy service only after both participant confirmations, required evidence, and no active disagreement; off-platform completion hands off an arrangement fact with escrow none and automatic ownership transfer false. Any damage, return, amendment, or service hold blocks the corresponding next state.

### Race and recovery matrix

| Race/failure | Winner and invariant | Recovery |
| --- | --- | --- |
| Buyer and seller confirm pickup concurrently | Per-participant unique confirmations commit under pickup lock; completed only after both valid confirmations | Replay duplicate participant request; reconcile aggregate version |
| Confirmation versus no-show worker | First protected confirmation before deadline wins that participant branch; bilateral completion still requires both | Worker rechecks version; no-show becomes disputed if evidence conflicts |
| Confirmation versus damage/return filing | Protected remedy filing places hold before completion/settlement handoff | Keep pickup evidence; 26c resolves remedy; no title or money inference |
| Exact location release versus cancellation | Cancellation/revocation wins unless release transaction committed first; released token is immediately revoked | Audit recipient and expiry; support safety workflow handles exposure |
| Off-platform completion versus unilateral seller claim | No unilateral claim is bilateral completion | Record no-show/dispute and require other participant or support evidence |
| Service request versus dispatch | Material service hold/election wins before dispatch commit | 26b rechecks hold; buyer election or cancellation resolves |
| Provider service callback duplicate | Provider event ID and route version dedupe | Replay stored result; quarantine hash conflict |
| Warranty route provider outage | Route remains eligibility_pending/routed; no platform decision | Retry inquiry with same route ID; notify safe pending state |
| RMA evidence hash mismatch | Reject that evidence append; preserve route and prior valid evidence | Request new signed object reference; never overwrite prior hash |
| Order amended after service request | Immutable disclosure/policy version mismatch blocks provider action | Refetch order; create new service request only through policy |
| Mixed-cart independent order | Each order line and pickup arrangement remains in its own checkout group | Reject cross-order pickup ID; no cart-level completion |
| Worker crash after commit | Transactional outbox and inbox preserve durable state | Lease retry; consumer dedupes event ID plus aggregate/version |
| Deadlock or serialization conflict | No partial confirmation/hold/provider handoff | Retry twice at 50/150 ms; return 409 after bound |

Worker leases expire after eight attempts; poison provider payloads quarantine. A carrier scan or participant note cannot fabricate verified delivery, settlement, ownership, warranty eligibility, or custody. Provider silence remains pending and does not advance a deadline without a server policy action.

## External Seams

| Seam | Exact request | Exact response | Timeout | Retry/backoff | Circuit behavior |
| --- | --- | --- | --- | --- | --- |
| BE-00 idempotency/audit/outbox | { operationId, idempotencyKey, actorId, aggregateId, requestHash, response } | { receiptId, replay, auditId, outboxIds } | 2,000 ms | No independent retry outside transaction; transaction retry twice at 50/150 ms | Open after 3 failures in 30 s; command fails atomically |
| BE-00 protected location | { orderLineId, locationTokenId, recipientPartyId, purpose, expiresAt } | { releaseId, released: true, expiresAt, revocable: true } | 3,000 ms | 2 retries at 200/600 ms on timeout; no retry on grant/purpose mismatch | Open after 3 failures in 60 s; no location release |
| BE-00 object evidence | { objectId, sha256, purpose, actor, expirySeconds } | { signedUrl, expiresAt, contentType, sizeBytes } | 3,000 ms | 2 retries at 200/600 ms on timeout; no retry on hash mismatch | Open after 3 failures in 60 s; evidence remains pending |
| BE-14 service engagement | { serviceRequestId, orderId, lineId, serviceCode, providerPartyId, quotedAmountMinor, currency, policyVersion } | { providerReceipt, state: requested/quoted/accepted/in_progress/complete/failed, dispatchImpact, version } | 5,000 ms | 3 retries at 250/750/1500 ms for timeout/408/429/5xx; inquiry by serviceRequestId | Open after 5 failures in 120 s; dispatch hold remains |
| Manufacturer warranty/RMA adapter | { rmaRouteId, orderLineId, warrantyBasis, issueCode, evidenceHashes, requestedResolution, purchaseSnapshot } | { providerReceipt, state: received/eligibility_pending/routed/manufacturer_review/repair/replacement/rejected, nextActionAt } | 8,000 ms | 3 retries at 250/750/1500 ms for timeout/408/429/5xx; same route ID | Open after 5 failures in 120 s; route remains pending |
| BE-26b order/clock service | { orderId, lineId, action, expectedVersion, pickupId, serviceHoldId } | { orderId, lineId, state, version, clocks, accepted: true } | 2,000 ms | 2 retries at 50/150 ms on serialization conflict only | Open after 3 failures in 30 s; state handoff fails closed |
| BE-26c remedy/settlement service | { orderId, lineId, pickupState, evidenceHashes, protectedHold, sourceVersion } | { accepted: true, nextState, holdId, settlementEligible: false/true } | 2,000 ms | 2 retries at 50/150 ms on serialization conflict; no retry on policy conflict | Open after 3 failures in 30 s; no settlement/title action |
| BE-23 service history/party | { orderLineId, serviceRequestId, rmaRouteId, providerReceipt, eventVersion } | { accepted: true, historyReceiptId, partyScope } | 3,000 ms | 3 retries at 200/600/1200 ms for timeout/408/429/5xx; event dedupe | Open after 5 failures in 60 s; outbox remains pending |

Provider responses are schema-validated and unknown states are pending. Correlation IDs and provider receipts are hashed in logs. No provider seam can grant custody, settle, transfer title, or turn off the domestic/compliance gates.

## Events and Async Consumers

| Event type | Producer operation | Required envelope and payload | Consumer behavior |
| --- | --- | --- | --- |
| gear_pickup.arrangement_changed.v1 | BE26D-GCF17/GCF18 | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, pickupId, orderLineHash, mode, state, confirmationClass, disagreement } | 26b reads fulfillment state; 26c waits for valid platform evidence; notifications receive safe projection |
| gear_order.state_changed.v1 | 26b | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, lineId, previousState, currentState } | Pickup/service workers refetch canonical state/version |
| gear_order.amendment_opened.v1 | 26b | { eventId, aggregateId, aggregateVersion, lineId, disclosureDiffClass, dispatchPaused, buyerDeadlineAt } | Service request pauses until buyer election |
| gear_shipment.state_changed.v1 | 26b | { eventId, aggregateId, aggregateVersion, shipmentId, state, verifiedDelivery } | Pickup branch never treats scan as delivery |
| gear_logistics.quote_changed.v1 | 26b | { eventId, aggregateId, aggregateVersion, quoteId, validity, carrierOption } | Delivery alternative remains separate from pickup |
| gear_order.damage_claimed.v1 | 26c | { eventId, aggregateId, aggregateVersion, caseId, lineHash, protectedFiling } | Pickup completion/settlement handoff checks damage hold |
| gear_order.return_changed.v1 | 26c | { eventId, aggregateId, aggregateVersion, returnId, lineHash, state, deadlineAt } | Pickup/service may pause or cancel under remedy policy |
| gear_order.settled.v1 | 26c | { eventId, aggregateId, aggregateVersion, settlementId, lineHash, moneyState } | No pickup event can create or rewrite settlement |
| gear_order.transfer_requested.v1 | 26c | { eventId, aggregateId, aggregateVersion, intentId, settlementId, compensating } | Ownership registry remains settlement-backed |
| gear_compliance.determination_changed.v1 | 26e | { eventId, aggregateId, aggregateVersion, determinationId, jurisdiction, state, rulesRevision } | Non-domestic or missing determination fails closed |
| gear_offer.changed.v1 | 26a/25 | { eventId, aggregateId, aggregateVersion, offerId, state, priceSnapshot } | Historical line price only |
| gear_checkout.group_committed.v1 | 26a | { eventId, aggregateId, aggregateVersion, checkoutGroupId, orderIds } | Cross-group pickup is rejected |

Outbox rows include event ID, type, aggregate ID/version, request ID, payload hash, and redacted payload. Consumers acknowledge only after durable processing and dedupe event ID plus aggregate/version. Exact location, service notes, warranty issue descriptions, evidence originals, and provider credentials never enter public events.

## Error Matrix

| Operation ID | Condition | HTTP | Error code | Retry/client action |
| --- | --- | --- | --- | --- |
| BE26D-GCF17 | Hidden order/line or party context | 404 | ORDER_NOT_FOUND | Do not reveal context |
| BE26D-GCF17 | Minor, non-adult, unsafe venue, or cross-party participant | 403 or 422 | PICKUP_ADULT_REQUIRED or PICKUP_VENUE_INVALID | Use eligible adult and approved venue |
| BE26D-GCF17 | Active pickup or stale order version | 409 | PICKUP_ALREADY_ACTIVE or ORDER_VERSION_CONFLICT | Refetch arrangement/order |
| BE26D-GCF17 | Exact location purpose/grant unavailable | 409 | LOCATION_RELEASE_UNAVAILABLE | Keep coarse venue; retry scoped release |
| BE26D-GCF18 | Hidden pickup | 404 | PICKUP_NOT_FOUND | Do not reveal |
| BE26D-GCF18 | Actor is not buyer/seller participant | 403 | PICKUP_CONFIRMATION_FORBIDDEN | Use current party account |
| BE26D-GCF18 | Off-platform literal absent or platform pickup addressed | 409 | PICKUP_MODE_CONFLICT | Use platform completion path or record arrangement |
| BE26D-GCF18 | Duplicate/conflicting participant confirmation | 409 | PICKUP_CONFIRMATION_CONFLICT | Replay same key or await dispute resolution |
| BE26D-GCF19 | Hidden order/line | 404 | ORDER_NOT_FOUND | Do not reveal |
| BE26D-GCF19 | Seller attempts buyer election | 403 | BUYER_ELECTION_REQUIRED | Buyer must elect through own grant |
| BE26D-GCF19 | Service not eligible or disclosure/version changed | 409 | SERVICE_POLICY_CONFLICT | Refetch policy/order; do not dispatch |
| BE26D-GCF19 | BE-14 provider unavailable | 503 | SERVICE_PROVIDER_UNAVAILABLE | Retry same key; hold remains |
| BE26D-GCF20 | Hidden order/line | 404 | ORDER_NOT_FOUND | Do not reveal |
| BE26D-GCF20 | Warranty/RMA role or provider not allowed | 403 or 422 | WARRANTY_ROUTE_FORBIDDEN or WARRANTY_PROVIDER_INVALID | Use scoped manufacturer/seller route |
| BE26D-GCF20 | Purchased snapshot/evidence missing | 409 | WARRANTY_EVIDENCE_REQUIRED | Add purpose-bound evidence |
| BE26D-GCF20 | Provider unavailable or unknown route state | 503 | WARRANTY_PROVIDER_UNAVAILABLE | Retry/inquire same route ID; remain pending |
| All | Body/schema/unknown key/unsafe text | 400 or 422 | VALIDATION_FAILED | Correct field paths; do not retry unchanged |
| All | Rate limit exceeded | 429 | RATE_LIMITED | Honor Retry-After and idempotency key |
| All | Provider/outbox circuit open | 503 | DEPENDENCY_UNAVAILABLE | Retry same key with backoff; no duplicate handoff |

Every response uses ErrorResponse with BE-00 ApiError { code, message, requestId, details }. Error details never include exact locations, private service/warranty notes, evidence originals, payment instruments, or provider secrets.

## Testing Strategy

### Contract and route tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE26D-CON-001 | BE26D-GCF17 | Strict platform pickup request/response enforces adult participants, venue/window, protected location, and order version |
| BE26D-CON-002 | BE26D-GCF18 | Strict off-platform confirmation enforces confirmer, evidence, expected version, escrow none, and automatic transfer false |
| BE26D-CON-003 | BE26D-GCF19 | Service code/provider/price/election/dispatch impact and canonical success are exact |
| BE26D-CON-004 | BE26D-GCF20 | Warranty basis, issue/evidence, requested resolution, provider receipt, and routing response are exact |
| BE26D-ROUTE-001 | BE26D-GCF17 through BE26D-GCF20 | Method/path/operation registry is authoritative; no alias bypasses middleware or scope |

### Authorization and privacy tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE26D-AUTH-001 | BE26D-GCF17 through BE26D-GCF20 | Hidden resource returns 404; visible resource without role/grant returns 403; details conceal context |
| BE26D-AUTH-002 | BE26D-GCF17, BE26D-GCF18 | Minors cannot stranger-pickup; adult party grant, bilateral confirmation, safe venue, and exact-location purpose are enforced |
| BE26D-AUTH-003 | BE26D-GCF19 | Seller cannot elect buyer choice; provider sees scoped line/service only; buyer cannot impersonate provider |
| BE26D-AUTH-004 | BE26D-GCF20 | Manufacturer/seller route is scoped; evidence originals, issue notes, and provider secrets remain protected |
| BE26D-AUTH-005 | All | CORS policy gear-api, CSRF, signed callbacks, redaction, and no direct table/location/storage grants are enforced |

### Persistence, idempotency, and concurrency tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE26D-DB-001 | All | Forced RLS denies direct access; RPC rechecks party, adult policy, state/version, FK scope, and provider grant |
| BE26D-DB-002 | BE26D-GCF17, BE26D-GCF18 | Confirmation/no-show/dispute races serialize; exact location release is revocable and purpose-bound |
| BE26D-DB-003 | BE26D-GCF19 | Service active uniqueness, dispatch hold, buyer election, provider dedupe, and snapshot version hold |
| BE26D-DB-004 | BE26D-GCF20 | RMA route/evidence hash uniqueness, provider inbox dedupe, and pending outage behavior hold |
| BE26D-DB-005 | All assigned operations | Every field lists SQL type, nullability, constraints/FKs, indexes, forced RLS, and grants and migration tests cover them |

### Domain, seam, event, and recovery tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE26D-DOM-001 | BE26D-GCF17, BE26D-GCF18 | Platform dual confirmation and off-platform non-escrow/non-transfer branch are distinct; no unilateral completion |
| BE26D-DOM-002 | BE26D-GCF19 | Material service contradiction pauses dispatch until buyer accept/reprice/cancel; seller cannot choose |
| BE26D-DOM-003 | BE26D-GCF20 | Routing receipt does not adjudicate warranty; provider eligibility and evidence failures remain pending/rejected |
| BE26D-DOM-004 | BE26D-GCF17 through BE26D-GCF20 | Pickup/service/RMA cannot fabricate delivery, settlement, ownership, custody, or disclosure changes |
| BE26D-SEAM-001 | BE26D-GCF17 through BE26D-GCF20 | BE-00, BE-14, manufacturer/RMA, BE-23, BE-26b, and BE-26c timeout/retry/circuit contracts are exact |
| BE26D-EVT-001 | BE26D-GCF17 through BE26D-GCF20 | Exact event type literals, redaction, outbox atomicity, aggregate/version dedupe, and consumer refetch are verified |
| BE26D-REC-001 | BE26D-GCF17 through BE26D-GCF20 | Lost responses, no-show, disagreement, location cancellation, provider outage, duplicate callbacks, deadlock, and poison payloads recover as specified |

## Deepening Passes

| Pass | Question | Resolution |
| --- | --- | --- |
| D1 interaction | Does every assigned IA interaction have one stable route? | Yes: 26.17–26.20 map one-to-one to BE26D-GCF17–GCF20 |
| D2 command | Are IA command and provider boundaries preserved? | Yes: ConfirmPickup is explicit; service/RMA operations broker to BE-14/manufacturer without becoming authorities |
| D3 pickup | Can off-platform or unilateral evidence create money/title? | No: off-platform success always returns escrow none and automaticOwnershipTransfer false; bilateral platform evidence is required |
| D4 safety | Can a minor, unsafe venue, or exact address leak through? | No: adult/party policy, approved coarse venue, purpose-bound token, revocation, redaction, and safe events are explicit |
| D5 service | Can seller force a service election or dispatch through a contradiction? | No: material service hold/election is line-scoped and buyer-controlled |
| D6 warranty | Can route receipt be mistaken for warranty adjudication? | No: manufacturer/seller/provider owns eligibility and disposition; platform stores routing state only |
| D7 authorization | Are role ownership and 403 versus 404 explicit? | Yes: each operation has a scoped role row and concealment row; support exceptions require reason/dual control |
| D8 persistence | Are all fields implementable and protected? | Yes: typed/nullability/constraints/FKs/indexes/RLS/grants are listed for every table |
| D9 resilience | Are provider outages/replays deterministic? | Yes: exact request/response, timeout, retry/backoff, circuit, inquiry, pending, and dedupe behavior are specified |
| D10 boundary | Does this duplicate order, logistics, remedy, custody, or future-gate routes? | No: endpoint reconciliation and dependency references assign each adjacent authority |

## Ambiguity Gate

PASS. Evidence: 26.17–26.20 each map to one authoritative operation and route; PickupArrangement is owned while Order, OrderLine, OrderClock, Shipment, PackingEvidence, OfferThread, Offer, CartIntent, CheckoutGroup, FreightQuoteRequest, ReturnCase, DamageCase, SettlementRecord, OwnershipTransferIntent, and InternationalDetermination are consumed without route duplication; exact platform/off-platform pickup, adult/safe-venue/location, service election, and warranty/RMA Zod 4 contracts are present; every operation has role ownership, 403-vs-404, CORS policy gear-api, idempotency, rate limit, observability, typed persistence/RLS/grants, error rows, and keyed tests; global ApiError { code, message, requestId, details }, exact seams, event privacy, state/race rules, no custody, no platform warranty, settlement separation, and recovery behavior are resolved. Neighboring interactions 26.01–26.16 and 26.21–26.22 are referenced through explicit BE-26a/b/c/e handoffs. No unresolved source conflict remains.

## Open Questions

None.

## Dependency References

- BE-00 platform contracts in 00-infrastructure.md: strict Zod 4, ApiError { code, message, requestId, details }, auth, CORS, idempotency, rate classes, audit/outbox, protected object/location evidence, and forced RLS.
- BE-14 service engagements: service eligibility, provider engagement, service history, warranty-adjacent records, and provider callbacks.
- BE-23 gear provenance: canonical parties, ownership registry, service history, and transfer facts.
- BE-24 gear collections: custody/possession grants and safety exceptions; this companion never becomes custodian.
- BE-25b listing/disclosure lifecycle: immutable ListingVersion and DisclosureVersion snapshots used for service/warranty comparison.
- BE-25c inventory/bulk/channels: MarketplaceUnit and InventoryClaim facts used to keep pickup/service/RMA line-specific.
- BE-26a offers/cart/checkout: committed CheckoutGroup, Order, and OrderLine handoff; no cross-group pickup.
- BE-26b logistics/order lifecycle: Shipment, verified delivery, OrderClock, amendments, and canonical state/version transitions.
- BE-26c remedies/settlement/transfers: DamageCase, ReturnCase, SettlementRecord, OwnershipTransferIntent, holds, and title ordering.
- BE-26e future commerce gates: domestic-only compliance and disabled international/auction/ISO/dealer/rental/consignment admission.
- Manufacturer/seller warranty and RMA providers are external seams; their route receipts never become platform warranty decisions.

## Changelog

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-08-29 | Initial production-grade BE companion for interactions 26.17–26.20; platform/off-platform pickup, adult and location controls, service election, warranty/RMA routing, strict contracts, security, persistence/RLS, eventing, resilience, and ambiguity evidence added |
