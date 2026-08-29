# BE-26c — Gear Remedies, Settlement, and Ownership Transfers

## Classification

This companion is the backend contract for the post-purchase remedy, financial-close, and ownership-transfer boundary of IA shard 26. It classifies 26.11–26.16 as authenticated, state-changing commands with durable evidence, policy-versioned clocks, append-only audit, and outbox publication. The companion owns damage and return cases, inspection decisions, settlement records, and the transfer intent/reversal workflow. It consumes the order, line, shipment, packing, disclosure, and inventory facts produced by adjacent contracts; it does not create a second order, payment, custody, listing, or identity API.

| Boundary | Included | Excluded and handoff |
| --- | --- | --- |
| Interaction ownership | 26.11 Open damage claim; 26.12 Request return; 26.13 Inspect returned unit; 26.14 Settle order; 26.15 Emit ownership transfer; 26.16 Reverse ownership event | Freight and delivery evidence remain in 26b; pickup/service/warranty remain in 26d; international and deferred capability admission remain in 26e |
| Aggregate ownership | DamageCase, ReturnCase, SettlementRecord, OwnershipTransferIntent, and compensating reversal append | Order, OrderLine, OrderClock, Shipment, FreightQuoteRequest, PackingEvidence, OfferThread, Offer, CartIntent, CheckoutGroup, PickupArrangement, and InternationalDetermination remain canonical in their owning contracts |
| Money and title boundary | Close each eligible order line once, record refund/fee/hold facts, then request one ownership transfer intent; reversals are compensating records | Payment authorization, capture, refund execution, payout accounts, identity registry, and title/custody history are external seams owned by BE-00, payment, BE-23, or BE-24 |
| Security boundary | Buyer, seller, support, inspection, payment, and registry actors receive least-privilege projections with 403 versus 404 concealment | No direct client table grant, no raw payment instrument, exact address, evidence original, or provider secret |

The implementation target is TypeScript on Hono/Cloudflare Workers with Supabase PostgreSQL, strict Zod 4 contracts, transactional outbox, forced RLS, structured audit, and Sentry-compatible telemetry. Every mutation is idempotent and records the request, actor, policy revision, and aggregate version that made the decision.

## Referenced Material Inventory

| Source | Location | Material used | Traceability |
| --- | --- | --- | --- |
| IA shard | .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md lines 24–38 | Locked decisions for material amendments, statutory returns, settlement, title transfer, compensating reversal, pickup boundary, and disabled future commerce | Decisions are restated in the domain and state sections below |
| IA shard | .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md lines 79–100 | Interaction definitions 26.11–26.16 and neighboring boundaries | One operation ID maps to each assigned interaction in the IA Source Map and route registry |
| IA shard | .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md lines 106–117 | OpenReturnOrDamageCase, SettleOrderLine, and RecordTransferFromSettlement command contracts | Request schemas and handler invariants preserve command names and required fields |
| IA shard | .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md lines 129–144 | Canonical Data Models including Order, OrderLine, OrderClock, Shipment, PackingEvidence, ReturnCase, DamageCase, SettlementRecord, and OwnershipTransferIntent | Model inventory and persistence mapping distinguish owned models from consumed models |
| IA shard | .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md lines 209–222 | Event Schemas for damage, return, settlement, transfer, and neighboring logistics/compliance events | Event table, outbox rules, and consumer tests use exact event type literals |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md lines 33–39 | Remedy precedence, protected damage filing, return reason/payer rules, independent refund, one-time settlement, and transfer ordering | State, race, error, and test matrices enforce the deep-dive rules |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md lines 57–63 | Money/title ordering, settlement and refund independence, chargeback/title non-fabrication | State machine and recovery matrix make the ordering executable |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md lines 76–91 | Order and remedy states, return payer matrix, and custody/liability separation | State and authorization rows preserve line scope and seller liability |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md lines 116–122 | Race conditions for damage versus auto-settle, refund/reversal independence, duplicate webhooks, and evidence conflicts | Concurrency matrix and idempotency rules define winners and recovery |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md lines 130–143 | Edge locks: ownership only after settlement, evidence tiers, no platform custody, no platform warranty, and deferred flows | Ambiguity Gate evidence records each lock and the non-duplication boundary |
| BE platform | .memory/wiki/specs/be/00-infrastructure.md lines 112–153 | Global strict Zod 4 schema conventions and ApiError { code, message, requestId, details } | All request, success, and error contracts cite the global envelope |
| BE platform | .memory/wiki/specs/be/00-infrastructure.md lines 208–308 | Auth, forced RLS, grants, idempotency, rate classes, CORS, audit, outbox, and provider callback controls | Middleware, persistence, and observability matrices inherit these contracts |
| BE identity/custody | .memory/wiki/specs/be/23-gear-provenance.md and .memory/wiki/specs/be/24-gear-collections.md | Party, ownership registry, custody, and transfer acceptance seams | Transfer request does not rewrite registry facts; provider scope is explicit |
| BE marketplace | .memory/wiki/specs/be/25b-gear-listing-disclosure-lifecycle.md and .memory/wiki/specs/be/25c-gear-inventory-bulk-channels.md | Immutable disclosure snapshots, inventory claim, seller listing context, and order handoff | Remedy eligibility compares the purchased disclosure and claimed unit snapshots |
| BE adjacent shard | .memory/wiki/specs/be/26a-gear-offers-cart-checkout.md and .memory/wiki/specs/be/26b-gear-logistics-order-lifecycle.md | Independent order, verified delivery, packing evidence, and policy-versioned clocks | This companion consumes their canonical identifiers and never duplicates their routes |
| BE adjacent shard | .memory/wiki/specs/be/26d-gear-pickup-service-warranty.md and .memory/wiki/specs/be/26e-gear-future-commerce-gates.md | Pickup, service, warranty, international, and deferred-capability handoffs | Dependency references identify the consumer/producer direction |

## IA Source Map

### Assigned interactions

| IA interaction | IA intent and invariant | Backend operation | Authority |
| --- | --- | --- | --- |
| 26.11 | Open damage claim | BE26C-GCF11 | Timely protected filing places a settlement/title hold and persists evidence references |
| 26.12 | Request return | BE26C-GCF12 | Return entitlement, payer, deadline, and line state are derived from reason, policy, and purchased snapshot |
| 26.13 | Inspect returned unit | BE26C-GCF13 | Authorized inspection records condition, discrepancy, and disposition without changing the original disclosure |
| 26.14 | Settle order | BE26C-GCF14 | Eligible line closes money exactly once; refund/recovery is independent and evidence remains readable |
| 26.15 | Emit ownership transfer | BE26C-GCF15 | Settlement creates one transfer intent; registry acceptance is asynchronous and does not precede settlement |
| 26.16 | Reverse ownership event | BE26C-GCF16 | A valid reversal appends a compensating transfer request; it never edits or deletes the original event |

### Canonical Data Models

| IA model name | Role in this companion | Durable authority or reference |
| --- | --- | --- |
| ReturnCase | Owned return request, entitlement, payer, deadline, state, and evidence links | platform_private.return_cases |
| DamageCase | Owned damage/condition claim, protected filing, liability assessment, and hold | platform_private.damage_cases |
| SettlementRecord | Owned one-time line settlement, money disposition, recovery status, and policy snapshot | platform_private.settlement_records |
| OwnershipTransferIntent | Owned post-settlement request to the identity/ownership registry | platform_private.ownership_transfer_intents |
| Order | Consumed aggregate; financial state and line relationship are read under lock | platform_private.orders |
| OrderLine | Consumed unit-level state, purchased disclosure, claim, and settlement scope | platform_private.order_lines |
| OrderClock | Consumed/advanced inspection, return, damage, and settlement deadlines | platform_private.order_clocks |
| Shipment | Consumed dispatch, delivery, carrier, and coverage evidence | platform_private.shipments |
| PackingEvidence | Consumed append-only packing and evidence references | platform_private.packing_evidence |
| OfferThread | Upstream price/offer provenance used only through the immutable order snapshot | BE-26a/BE-25 listing authority |
| Offer | Upstream accepted offer provenance; never reopened by a remedy route | BE-26a/BE-25 listing authority |
| CartIntent | Upstream cart grouping provenance; not mutable after order creation | BE-26a |
| CheckoutGroup | Upstream payment/fulfilment partition; used to locate independent order | BE-26a |
| PickupArrangement | Downstream alternate fulfilment evidence; settlement route branches on its state | BE-26d |
| InternationalDetermination | Downstream compliance status; current launch rejects non-domestic settlement | BE-26e |

### Event Schemas

| Exact Event Schemas type | Produced/consumed | Payload authority and privacy rule |
| --- | --- | --- |
| gear_order.damage_claimed.v1 | Produced by BE26C-GCF11 | Case ID, order/line hashes, reason class, protected filing and policy revision; no evidence originals |
| gear_order.return_changed.v1 | Produced by BE26C-GCF12/13 | Return state, reason, payer, deadline, disposition class, and aggregate version |
| gear_order.settled.v1 | Produced by BE26C-GCF14 | Settlement ID, line hash, money disposition class, recovery state, and version; no payment instrument |
| gear_order.transfer_requested.v1 | Produced by BE26C-GCF15/16 | Intent ID, transfer direction, settlement ID, registry correlation, compensating flag, and version |
| gear_offer.changed.v1 | Consumed as historical context | Accepted price provenance only; this companion cannot mutate an offer |
| gear_checkout.group_committed.v1 | Consumed as order-origin context | Checkout group and independent order correlation only |
| gear_order.state_changed.v1 | Consumed and causally referenced | Canonical line transition/version; consumers refetch rather than trusting stale payload |
| gear_order.amendment_opened.v1 | Consumed for material disclosure election | Dispatch hold, disclosure diff, and buyer deadline gate remedy eligibility |
| gear_shipment.state_changed.v1 | Consumed for delivery/return logistics | Verified delivery and return shipment evidence, never raw scan as delivery |
| gear_pickup.arrangement_changed.v1 | Consumed for pickup branch | Platform/off-platform confirmation and disagreement state; no exact venue in public event |
| gear_logistics.quote_changed.v1 | Consumed as freight/payment context | Quote validity and carrier facts; no ownership or settlement authority |
| gear_compliance.determination_changed.v1 | Consumed as current compliance gate | Domestic/international determination and rule revision; fail closed on missing status |

## Endpoint Reconciliation

BE-00 remains the authority for authentication/session, global error serialization, idempotency receipts, audit/outbox primitives, and protected object evidence. BE-25b remains the authority for immutable listing and disclosure versions; BE-25c remains the authority for inventory claims; BE-26a hands off an independent Order and OrderLine; BE-26b owns shipment, delivery verification, and order lifecycle transitions; BE-26d owns pickup/service/warranty; BE-26e owns disabled future gates. BE-23 owns party and ownership-registry facts, and BE-24 owns custody/possession grants. Payment, recovery, carrier, coverage, and registry adapters are external seams. The six routes below are the only public routes for 26.11–26.16. No route below settles a whole mixed cart, changes a disclosure version, mutates inventory, confirms delivery, or directly writes an ownership registry event.

Remedy actions are line-scoped even when a request carries an order ID. An order can retain readable evidence and post-settlement claims after its financial terminal state; such evidence does not reopen money or title automatically. A buyer refund can complete while a carrier/seller recovery remains pending. A chargeback without object return does not fabricate a title-return event.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Command | Success |
| --- | --- | --- | --- | --- | --- |
| BE26C-GCF11 | POST | /api/v1/gear/orders/{orderId}/damage-claims | 26.11 | OpenReturnOrDamageCase | 201 DamageCaseSuccess |
| BE26C-GCF12 | POST | /api/v1/gear/orders/{orderId}/returns | 26.12 | OpenReturnOrDamageCase | 201 ReturnCaseSuccess |
| BE26C-GCF13 | POST | /api/v1/gear/returns/{returnId}/inspections | 26.13 | InspectReturnedUnit | 200 ReturnInspectionSuccess |
| BE26C-GCF14 | POST | /api/v1/gear/orders/{orderId}/settlements | 26.14 | SettleOrderLine | 200 SettlementSuccess |
| BE26C-GCF15 | POST | /api/v1/gear/orders/{orderId}/ownership-transfer-intents | 26.15 | RecordTransferFromSettlement | 202 TransferIntentSuccess |
| BE26C-GCF16 | POST | /api/v1/gear/ownership-transfer-intents/{intentId}/reversals | 26.16 | ReverseOwnershipEvent | 202 TransferReversalSuccess |

### Request/response contracts (Zod 4)

All schemas are strict Zod 4. UUIDs are canonical lowercase UUID strings; dates are RFC 3339 UTC strings; money is integer minor units and a three-letter uppercase currency. Unknown keys, unsafe text, private evidence URLs, malformed versions, unsupported reasons, out-of-order actions, and missing idempotency keys fail before a write. Every failure serializes the BE-00 global envelope ApiError { code, message, requestId, details } through ErrorResponse. Evidence is referenced by an opaque object ID and hash, never embedded as an original.

~~~ts
const Id = z.string().uuid();
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const IsoDate = z.string().datetime({ offset: true });
const Money = z.object({
  amountMinor: z.number().int().nonnegative().max(100000000000),
  currency: z.string().regex(/^[A-Z]{3}$/),
}).strict();
const Reason = z.enum(["not_as_described", "damage_in_transit", "damage_on_arrival", "change_of_mind", "buyer_caused"]);
const ActorKind = z.enum(["buyer", "seller", "support", "inspector", "payment_worker", "registry_worker"]);
const EvidenceRef = z.object({
  objectId: Id,
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  capturedAt: IsoDate,
  kind: z.enum(["photo", "video", "carrier_record", "inspection_note", "delivery_record"]),
}).strict();

const Gcf11Request = z.object({
  operationId: z.literal("BE26C-GCF11"),
  orderId: Id,
  orderLineId: Id,
  reason: z.enum(["damage_in_transit", "damage_on_arrival", "not_as_described", "buyer_caused"]),
  description: z.string().trim().min(1).max(4000),
  evidence: z.array(EvidenceRef).min(1).max(20),
  observedAt: IsoDate,
  expectedOrderVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();

const Gcf12Request = z.object({
  operationId: z.literal("BE26C-GCF12"),
  orderId: Id,
  orderLineId: Id,
  reason: z.enum(["not_as_described", "damage_in_transit", "damage_on_arrival", "change_of_mind", "buyer_caused"]),
  description: z.string().trim().min(1).max(4000),
  requestedResolution: z.enum(["refund", "replacement_not_available", "repair_if_policy_allows"]),
  evidence: z.array(EvidenceRef).max(20),
  expectedOrderVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();

const Gcf13Request = z.object({
  operationId: z.literal("BE26C-GCF13"),
  returnId: Id,
  inspectionOutcome: z.enum(["matches_claim", "not_as_described_confirmed", "damage_confirmed", "buyer_caused", "no_issue", "incomplete_return"]),
  conditionGrade: z.enum(["a", "b", "c", "d", "unusable"]),
  disposition: z.enum(["refund_full", "refund_less_diminished_value", "repair", "reship", "reject_claim", "escalate"]),
  notes: z.string().trim().min(1).max(4000),
  evidence: z.array(EvidenceRef).min(1).max(30),
  expectedReturnVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();

const Gcf14Request = z.object({
  operationId: z.literal("BE26C-GCF14"),
  orderId: Id,
  orderLineId: Id,
  settlementReason: z.enum(["delivered_no_case", "return_accepted", "damage_resolved", "buyer_cancelled", "support_exception"]),
  refund: Money.nullable(),
  sellerPayout: Money.nullable(),
  platformFee: Money,
  recovery: z.object({
    status: z.enum(["none", "pending", "recovered", "written_off"]),
    amount: Money,
  }).strict(),
  expectedOrderVersion: z.number().int().positive(),
  expectedCaseVersion: z.number().int().positive().nullable(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();

const Gcf15Request = z.object({
  operationId: z.literal("BE26C-GCF15"),
  orderId: Id,
  orderLineId: Id,
  settlementId: Id,
  transferDirection: z.enum(["buyer_receives_from_seller", "seller_receives_from_buyer"]),
  ownershipBasis: z.literal("settled_order_line"),
  expectedSettlementVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();

const Gcf16Request = z.object({
  operationId: z.literal("BE26C-GCF16"),
  intentId: Id,
  reversalReason: z.enum(["settlement_reversed", "registry_rejected", "fraud_confirmed", "duplicate_transfer", "legal_order"]),
  basisEventId: Id,
  evidence: z.array(EvidenceRef).min(1).max(20),
  expectedIntentVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();

const DamageCaseSuccess = z.object({
  operationId: z.literal("BE26C-GCF11"),
  caseId: Id,
  orderId: Id,
  orderLineId: Id,
  state: z.enum(["open", "under_review", "settlement_hold", "resolved", "rejected"]),
  settlementHeld: z.boolean(),
  clock: z.object({ clockId: Id, deadlineAt: IsoDate, policyVersion: z.string().regex(/^[A-Za-z0-9._:-]{1,80}$/) }).strict(),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const ReturnCaseSuccess = z.object({
  operationId: z.literal("BE26C-GCF12"),
  returnId: Id,
  orderId: Id,
  orderLineId: Id,
  state: z.enum(["requested", "authorized", "return_in_transit", "returned", "inspected", "resolved", "rejected", "expired"]),
  payer: z.enum(["buyer", "seller", "platform", "statutory_determination"]),
  deadlineAt: IsoDate,
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const ReturnInspectionSuccess = z.object({
  operationId: z.literal("BE26C-GCF13"),
  returnId: Id,
  state: z.enum(["inspected", "resolved", "rejected", "escalated"]),
  outcome: z.enum(["matches_claim", "not_as_described_confirmed", "damage_confirmed", "buyer_caused", "no_issue", "incomplete_return"]),
  disposition: z.enum(["refund_full", "refund_less_diminished_value", "repair", "reship", "reject_claim", "escalate"]),
  diminishedValue: Money.nullable(),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const SettlementSuccess = z.object({
  operationId: z.literal("BE26C-GCF14"),
  settlementId: Id,
  orderId: Id,
  orderLineId: Id,
  state: z.literal("settled"),
  moneyState: z.enum(["refund_pending", "refunded", "payout_pending", "paid", "partially_recovered", "written_off"]),
  titleTransferRequired: z.boolean(),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const TransferIntentSuccess = z.object({
  operationId: z.literal("BE26C-GCF15"),
  intentId: Id,
  settlementId: Id,
  state: z.enum(["requested", "accepted", "contested", "reversed"]),
  transferDirection: z.enum(["buyer_receives_from_seller", "seller_receives_from_buyer"]),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const TransferReversalSuccess = z.object({
  operationId: z.literal("BE26C-GCF16"),
  reversalId: Id,
  intentId: Id,
  state: z.literal("requested"),
  compensating: z.literal(true),
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

settlementId is accepted by BE26C-GCF15 only when it belongs to the addressed line, is settled, and has not already produced a non-reversed transfer intent. basisEventId in BE26C-GCF16 must be an existing immutable transfer event ID and cannot point to an unrelated aggregate. Response replay returns the originally stored response byte-for-byte through BE-00 idempotency.

### Contract Registry

| Operation ID | Request contract | Success contract and invariant | Error contract | Atomic write set |
| --- | --- | --- | --- | --- |
| BE26C-GCF11 | Gcf11Request strict; damage reason, evidence, observed time, and expected order version | DamageCaseSuccess; protected filing sets settlementHeld=true for a timely eligible case | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Damage case, protected clock, line hold, audit, outbox, and idempotency receipt |
| BE26C-GCF12 | Gcf12Request strict; return reason and evidence; statutory/policy entitlement derived server-side | ReturnCaseSuccess; payer and deadline are policy-derived, never client-authoritative | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Return case, return clock, line state/hold, audit, outbox, and idempotency receipt |
| BE26C-GCF13 | Gcf13Request strict; authorized inspector outcome and evidence | ReturnInspectionSuccess; disposition is constrained by case reason and evidence | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Inspection, case transition, evidence links, audit, outbox, and idempotency receipt |
| BE26C-GCF14 | Gcf14Request strict; one line, one settlement, policy-compatible money totals | SettlementSuccess; money closes once and title transfer remains a separate intent | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Settlement, line/order state, clocks, refund/payout commands, audit, outbox, and idempotency receipt |
| BE26C-GCF15 | Gcf15Request strict; settled line and matching settlement only | TransferIntentSuccess; exactly one active transfer intent per settlement | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Transfer intent, registry request outbox, audit, and idempotency receipt |
| BE26C-GCF16 | Gcf16Request strict; immutable basis event and evidence | TransferReversalSuccess; compensating=true, original transfer remains unchanged | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Reversal append, intent state, registry request outbox, audit, and idempotency receipt |

## Authorization and Ownership

The service resolves resource existence only after a coarse authenticated lookup. A hidden order, line, case, return, settlement, or intent returns 404; a visible resource for which the actor lacks the action grant returns 403. Error details contain stable field paths and codes but no hidden party, address, payment, or evidence facts.

| Operation ID | Allowed roles | Ownership and object scope | 403 versus 404 |
| --- | --- | --- | --- |
| BE26C-GCF11 | Buyer/buying-party controller; support case opener for enumerated exception | Buyer controls the purchased line; claim must reference the current order/disclosure/shipment snapshot; support exception requires reason and dual control | Hidden order/line returns 404 ORDER_NOT_FOUND; visible line without buyer/support grant returns 403 DAMAGE_CLAIM_FORBIDDEN |
| BE26C-GCF12 | Buyer/buying-party controller; support under statutory escalation | Buyer controls the request; seller cannot create a buyer election; payer and entitlement are server-derived | Hidden order/line returns 404 ORDER_NOT_FOUND; visible line without remedy grant returns 403 RETURN_FORBIDDEN |
| BE26C-GCF13 | Assigned inspector; support dual control; authorized return processor | Inspector sees only case-bound evidence and line condition; seller cannot rewrite the inspection or original disclosure | Hidden return returns 404 RETURN_NOT_FOUND; visible return without inspector assignment returns 403 RETURN_INSPECTION_FORBIDDEN |
| BE26C-GCF14 | Settlement worker; payment worker for bounded money result; support dual control | Settlement worker may close only eligible line state and matching case/clock; seller cannot settle or release escrow | Hidden order/line returns 404 ORDER_NOT_FOUND; visible line without settlement grant returns 403 SETTLEMENT_FORBIDDEN |
| BE26C-GCF15 | Settlement worker or registry worker callback initiator; support only with dual control | Intent must match this service's settled line and the canonical buyer/seller parties; client cannot choose arbitrary parties | Hidden settlement/order returns 404 SETTLEMENT_NOT_FOUND; visible settled line without transfer grant returns 403 TRANSFER_INTENT_FORBIDDEN |
| BE26C-GCF16 | Registry worker; settlement worker; support legal/fraud dual control | Reversal must reference an immutable transfer basis event and an intent owned by the actor's case/registry scope | Hidden intent returns 404 TRANSFER_INTENT_NOT_FOUND; visible intent without reversal authority returns 403 TRANSFER_REVERSAL_FORBIDDEN |

Seller permissions are limited to seller-visible case state, evidence requests, and policy-defined responses. Sellers cannot elect a buyer remedy, suppress a protected filing, alter purchased disclosure, settle, release escrow, or assert ownership transfer. Support exceptions are enumerated, reason-coded, audited, and require two distinct staff identities when they affect money or title. Organizations act only through the canonical controlled-party grant; an employee's personal account never substitutes for organization control.

## Middleware and Security

### Per-operation middleware registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
| --- | --- | --- | --- |
| BE26C-GCF11 | requestId → CORS → auth → party context → rate limit → idempotency → strict body validation → order/line visibility → case/clock policy → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 128 KiB body; evidence IDs/hash only; no payment values accepted; observed time cannot override server receipt without protected-filing check |
| BE26C-GCF12 | requestId → CORS → auth → party context → rate limit → idempotency → strict body validation → order/disclosure snapshot → entitlement policy → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 128 KiB body; reason allowlist; no client-selected payer/deadline; HTML-safe text; statutory policy version required |
| BE26C-GCF13 | requestId → CORS → auth → inspector grant → rate limit → idempotency → strict body validation → return lock → evidence authorization → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 256 KiB body; evidence count/hash bounds; no direct object bytes; disposition/reason compatibility checked server-side |
| BE26C-GCF14 | requestId → CORS → service auth → settlement grant → rate limit → idempotency → strict body validation → order/case lock → money invariant → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 64 KiB body; client amounts must equal immutable order/case totals; no card data; seller role cannot invoke |
| BE26C-GCF15 | requestId → CORS → service auth → settlement/registry grant → rate limit → idempotency → strict body validation → settlement lock → registry handoff → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 64 KiB body; one active intent constraint; parties loaded from settlement; transfer direction checked against order |
| BE26C-GCF16 | requestId → CORS → service auth/signature → legal/fraud grant → rate limit → idempotency → strict body validation → immutable-event lookup → reversal lock → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 128 KiB body; basis event immutable; compensating reason/evidence required; no delete/update of original event |

All routes apply CSRF protection where browser credentials are used, origin allowlisting, content-type and body-size checks, safe response headers, structured redaction, and request-scoped tracing. Object storage access uses BE-00 purpose-bound signed URLs with short expiry; a public event contains hashes and opaque IDs only. Service-to-service callbacks require mTLS-equivalent worker identity or signed timestamped payload, replay window 5 minutes, and provider event ID dedupe.

## Idempotency, Rate Limits, and SLOs

| Operation ID | Idempotency and concurrency | Rate limit | SLO and timeout |
| --- | --- | --- | --- |
| BE26C-GCF11 | Required key/body hash; unique active case per line/reason window; order and line lock; same key returns original case response | 10 per buyer per 10 minutes, burst 2 | p95 1.2 s, hard 15 s; worker evidence lookup below |
| BE26C-GCF12 | Required key/body hash; one open return per line unless support reopens with a new policy revision; line lock | 10 per buyer per 10 minutes, burst 2 | p95 1.2 s, hard 15 s; entitlement computation is bounded |
| BE26C-GCF13 | Required key/body hash; unique inspection per return version; return lock; duplicate processor callback replays | 30 per inspector per minute, burst 5 | p95 1.5 s, hard 15 s; evidence provider is asynchronous |
| BE26C-GCF14 | Required key/body hash; unique settlement per order line; serializable line lock; retry only on deadlock | 30 per worker per minute, burst 5 | p95 1.5 s, hard 15 s; payment dispatch is outbox-driven |
| BE26C-GCF15 | Required key/body hash; unique (settlement_id, active) intent; registry correlation dedupe | 30 per worker per minute, burst 5 | p95 1.2 s, hard 15 s; registry request is asynchronous |
| BE26C-GCF16 | Required key/body hash; unique (intent_id, basis_event_id, reversal_reason) append; immutable event lock | 10 per support/worker per 10 minutes, burst 2 | p95 1.2 s, hard 15 s; registry reversal is asynchronous |

BE-00 idempotency receipts retain at least 24 hours and store request hash, status, response, and expiry. A lost response is recovered by key lookup. Server receipt time, not a client clock, controls deadline decisions. A timeout never causes a second money or title command. Deadlock retry is at most twice at 50 ms and 150 ms; serialization conflicts return 409 after bounded retries.

## Observability

| Operation ID | Metrics and alerts | Structured logs and traces | Audit/outbox evidence |
| --- | --- | --- | --- |
| BE26C-GCF11 | damage_case_open_total by reason; protected_filing_total; settlement_hold_total; latency; alert on hold-write failure | requestId, operationId, order/line hash, reason, evidence count, policy version, result; never description or originals | damage.case.opened; gear_order.damage_claimed.v1; protected clock and hold IDs |
| BE26C-GCF12 | return_request_total by reason/payer; return_deadline_total; return_forbidden_total; latency | requestId, operationId, order/line hash, reason, policy revision, payer class, result | return.case.opened; gear_order.return_changed.v1; entitlement snapshot |
| BE26C-GCF13 | return_inspection_total by outcome; inspection_escalation_total; discrepancy count; latency | requestId, operationId, return hash, inspector hash, outcome, disposition, evidence count, result | return.inspection.recorded; gear_order.return_changed.v1; evidence hashes |
| BE26C-GCF14 | settlement_total by reason/state; settlement_duplicate_total; refund_pending_total; latency; alert on double-close attempt | requestId, operationId, order/line hash, settlement ID, money state, recovery state, policy revision, result; no amounts beyond classified bands | order.settled; gear_order.settled.v1; payment command and line version |
| BE26C-GCF15 | transfer_intent_total by state/direction; registry_rejection_total; age of pending intents | requestId, operationId, settlement/intent hash, direction, registry correlation hash, result | ownership.transfer.requested; gear_order.transfer_requested.v1; settlement basis |
| BE26C-GCF16 | transfer_reversal_total by reason; registry_reversal_pending_total; contested age; duplicate append count | requestId, operationId, intent/basis hash, reason, legal/fraud case hash, result | ownership.transfer.reversal_requested; compensating gear_order.transfer_requested.v1; original event link |

Trace spans include remedy.case, settlement.close, payment.dispatch, and registry.transfer, with sampling that preserves all failures, authorization denials, money/title races, and provider retries. Sentry events use a scrubber for addresses, descriptions, evidence URLs, payment data, and provider secrets. Alert thresholds: any duplicate settlement attempt, any title request without a settled basis, any outbox age over 60 seconds, and any protected filing that loses its hold.

## Persistence and RLS

All tables use protected schemas with enabled and forced RLS. Direct anon/authenticated table grants are denied. Security-invoker RPCs recheck account/party, order line ownership, case state, immutable disclosure snapshot, policy version, expected version, and worker grant. Every mutation writes audit and outbox rows in the same transaction. Evidence originals remain in BE-00 object storage; these tables store IDs and hashes.

### Complete table definitions

| Table / model | Typed fields with SQL types, nullability, constraints and FKs | Query indexes | RLS and grants |
| --- | --- | --- | --- |
| platform_private.damage_cases / DamageCase | id uuid PRIMARY KEY; order_id uuid NOT NULL REFERENCES platform_private.orders(id); order_line_id uuid NOT NULL REFERENCES platform_private.order_lines(id); opened_by uuid NOT NULL REFERENCES auth.users(id); reason text NOT NULL CHECK (reason IN ('damage_in_transit','damage_on_arrival','not_as_described','buyer_caused')); description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 4000); observed_at timestamptz NOT NULL; received_at timestamptz NOT NULL; state text NOT NULL CHECK (state IN ('open','under_review','settlement_hold','resolved','rejected')); settlement_held boolean NOT NULL DEFAULT false; protected_filing boolean NOT NULL DEFAULT false; policy_version text NOT NULL; order_version bigint NOT NULL CHECK (order_version > 0); resolution_code text NULL; resolved_at timestamptz NULL; version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(order_line_id, reason, opened_by, received_at) | (order_line_id,state); (order_id,created_at DESC); (state,updated_at); (protected_filing,received_at) | Buyer sees own case projection; seller sees redacted assigned case; support/worker case-bound; forced RLS; no direct client grant |
| platform_private.damage_case_evidence | id uuid PRIMARY KEY; case_id uuid NOT NULL REFERENCES platform_private.damage_cases(id); object_id uuid NOT NULL REFERENCES platform_private.object_refs(id); sha256 char(64) NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'); kind text NOT NULL CHECK (kind IN ('photo','video','carrier_record','inspection_note','delivery_record')); captured_at timestamptz NOT NULL; added_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL; UNIQUE(case_id,sha256) | (case_id,created_at DESC); (object_id); (sha256) | Case participants see metadata only; BE-00 grants original bytes by purpose; forced RLS; no direct client grant |
| platform_private.return_cases / ReturnCase | id uuid PRIMARY KEY; order_id uuid NOT NULL REFERENCES platform_private.orders(id); order_line_id uuid NOT NULL REFERENCES platform_private.order_lines(id); requested_by uuid NOT NULL REFERENCES auth.users(id); reason text NOT NULL CHECK (reason IN ('not_as_described','damage_in_transit','damage_on_arrival','change_of_mind','buyer_caused')); description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 4000); requested_resolution text NOT NULL CHECK (requested_resolution IN ('refund','replacement_not_available','repair_if_policy_allows')); payer text NOT NULL CHECK (payer IN ('buyer','seller','platform','statutory_determination')); entitlement text NOT NULL CHECK (entitlement IN ('statutory','policy','not_entitled','pending_inspection')); state text NOT NULL CHECK (state IN ('requested','authorized','return_in_transit','returned','inspected','resolved','rejected','expired')); deadline_at timestamptz NOT NULL; policy_version text NOT NULL; disclosure_version_id uuid NOT NULL REFERENCES platform_private.listing_disclosure_versions(id); order_version bigint NOT NULL CHECK (order_version > 0); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; resolved_at timestamptz NULL; UNIQUE(order_line_id) WHERE state IN ('requested','authorized','return_in_transit','returned','inspected') | (order_line_id,state); (order_id,created_at DESC); (state,deadline_at); (payer,state); (disclosure_version_id) | Buyer sees own case; seller sees permitted reason/state and no private evidence; processor/worker case-bound; forced RLS; no direct client grant |
| platform_private.return_case_evidence | id uuid PRIMARY KEY; return_id uuid NOT NULL REFERENCES platform_private.return_cases(id); object_id uuid NOT NULL REFERENCES platform_private.object_refs(id); sha256 char(64) NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'); kind text NOT NULL CHECK (kind IN ('photo','video','carrier_record','inspection_note','delivery_record')); captured_at timestamptz NOT NULL; added_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL; UNIQUE(return_id,sha256) | (return_id,created_at DESC); (object_id); (sha256) | Return participants see metadata projection; BE-00 grants originals; forced RLS; no direct client grant |
| platform_private.return_inspections | id uuid PRIMARY KEY; return_id uuid NOT NULL REFERENCES platform_private.return_cases(id); inspector_id uuid NOT NULL REFERENCES auth.users(id); inspection_outcome text NOT NULL CHECK (inspection_outcome IN ('matches_claim','not_as_described_confirmed','damage_confirmed','buyer_caused','no_issue','incomplete_return')); condition_grade text NOT NULL CHECK (condition_grade IN ('a','b','c','d','unusable')); disposition text NOT NULL CHECK (disposition IN ('refund_full','refund_less_diminished_value','repair','reship','reject_claim','escalate')); notes text NOT NULL CHECK (char_length(notes) BETWEEN 1 AND 4000); diminished_value_minor bigint NULL CHECK (diminished_value_minor >= 0); currency char(3) NULL CHECK (currency ~ '^[A-Z]{3}$'); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; UNIQUE(return_id,version) | (return_id,created_at DESC); (inspector_id,created_at DESC); (inspection_outcome) | Assigned inspector can append; seller/buyer read redacted result; support dual control; forced RLS; no direct client grant |
| platform_private.settlement_records / SettlementRecord | id uuid PRIMARY KEY; order_id uuid NOT NULL REFERENCES platform_private.orders(id); order_line_id uuid NOT NULL REFERENCES platform_private.order_lines(id); case_id uuid NULL REFERENCES platform_private.return_cases(id); damage_case_id uuid NULL REFERENCES platform_private.damage_cases(id); settlement_reason text NOT NULL CHECK (settlement_reason IN ('delivered_no_case','return_accepted','damage_resolved','buyer_cancelled','support_exception')); order_amount_minor bigint NOT NULL CHECK (order_amount_minor >= 0); refund_amount_minor bigint NULL CHECK (refund_amount_minor >= 0); seller_payout_minor bigint NULL CHECK (seller_payout_minor >= 0); platform_fee_minor bigint NOT NULL CHECK (platform_fee_minor >= 0); currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'); money_state text NOT NULL CHECK (money_state IN ('refund_pending','refunded','payout_pending','paid','partially_recovered','written_off')); recovery_status text NOT NULL CHECK (recovery_status IN ('none','pending','recovered','written_off')); recovery_amount_minor bigint NOT NULL CHECK (recovery_amount_minor >= 0); policy_version text NOT NULL; disclosure_version_id uuid NOT NULL REFERENCES platform_private.listing_disclosure_versions(id); settled_at timestamptz NOT NULL; created_by uuid NOT NULL REFERENCES auth.users(id); version bigint NOT NULL CHECK (version > 0); UNIQUE(order_line_id) | (order_line_id) unique; (order_id,settled_at DESC); (money_state,settled_at); (recovery_status,settled_at); (case_id) | Settlement worker only writes; buyer/seller receive money-state projection; payment worker sees bounded command; forced RLS; no direct client grant |
| platform_private.ownership_transfer_intents / OwnershipTransferIntent | id uuid PRIMARY KEY; settlement_id uuid NOT NULL UNIQUE REFERENCES platform_private.settlement_records(id); order_id uuid NOT NULL REFERENCES platform_private.orders(id); order_line_id uuid NOT NULL REFERENCES platform_private.order_lines(id); from_party_id uuid NOT NULL REFERENCES identity.parties(id); to_party_id uuid NOT NULL REFERENCES identity.parties(id); transfer_direction text NOT NULL CHECK (transfer_direction IN ('buyer_receives_from_seller','seller_receives_from_buyer')); ownership_basis text NOT NULL CHECK (ownership_basis = 'settled_order_line'); state text NOT NULL CHECK (state IN ('requested','accepted','contested','reversed')); registry_correlation text NULL; basis_event_id uuid NULL; requested_at timestamptz NOT NULL; accepted_at timestamptz NULL; version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | (settlement_id) unique; (order_line_id,state); (state,requested_at); (registry_correlation); (from_party_id,to_party_id) | Registry worker and settlement worker only; parties see safe status; BE-23 receives scoped request; forced RLS; no direct client grant |
| platform_private.ownership_transfer_reversals | id uuid PRIMARY KEY; intent_id uuid NOT NULL REFERENCES platform_private.ownership_transfer_intents(id); basis_event_id uuid NOT NULL; reversal_reason text NOT NULL CHECK (reversal_reason IN ('settlement_reversed','registry_rejected','fraud_confirmed','duplicate_transfer','legal_order')); evidence_summary jsonb NOT NULL; requested_by uuid NOT NULL REFERENCES auth.users(id); state text NOT NULL CHECK (state IN ('requested','accepted','contested','rejected')); compensating boolean NOT NULL DEFAULT true CHECK (compensating = true); registry_correlation text NULL; version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; UNIQUE(intent_id,basis_event_id,reversal_reason) | (intent_id,created_at DESC); (basis_event_id); (state,created_at); (registry_correlation) | Legal/fraud/support dual control or worker append; parties see safe status; registry sees scoped evidence summary; forced RLS; no direct client grant |
| platform_private.remedy_event_inbox | id uuid PRIMARY KEY; provider_event_id text NOT NULL; event_type text NOT NULL; aggregate_id uuid NOT NULL; payload_hash char(64) NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'); received_at timestamptz NOT NULL; processed_at timestamptz NULL; state text NOT NULL CHECK (state IN ('received','processed','quarantined')); error_code text NULL; UNIQUE(provider_event_id,event_type) | (provider_event_id,event_type) unique; (state,received_at); (aggregate_id,received_at DESC) | Worker/service only; no client grant; forced RLS; payload body retained in protected event store |

The partial unique return index is implemented as a PostgreSQL partial unique index on active states; the table row still lists the business constraint. Monetary invariants enforce refund + seller payout + platform fee <= order amount unless a statutory/support policy version explicitly records an approved platform subsidy. A transfer intent FK to settlement_records prevents title requests without financial close. Reversal rows are append-only by trigger and RPC policy.

### Permission and RLS matrix

| Principal | Read projection | Write path | Prohibited |
| --- | --- | --- | --- |
| Buyer/buying-party controller | Own order-line remedy state, deadlines, payer class, safe inspection outcome, refund state | BE26C-GCF11/12 with own party grant; no direct table write | Cannot inspect, settle, change payer, request arbitrary transfer, or see seller/payment secrets |
| Seller/dispatch operator | Own listing/order case status, evidence requests, recovery status | Evidence response through bounded case workflow | Cannot elect buyer remedy, settle, release escrow, rewrite snapshots, or confirm title |
| Assigned inspector | Case-bound evidence metadata and line condition | BE26C-GCF13 RPC with inspector grant | Cannot alter original disclosure, order amount, payer, or settlement |
| Payment worker | Settlement money command and provider result projection | Payment callback RPC with settlement ID and signed provider event | Cannot create settlement or title transfer without service basis |
| Registry worker | Settlement-backed transfer intent and reversal evidence summary | BE-23 registry handoff and callback RPC | Cannot change money state or invent a settlement basis |
| Support/legal/fraud | Case-bound projection; sensitive fields require reason and dual control | Enumerated exception RPC with two identities | Cannot use generic admin access or erase append-only evidence |
| Anon/authenticated client | No direct table access | Public routes only after Hono/RPC authorization | Direct SQL, storage, event, payment, and party-registry grants denied |

## State Machines, Concurrency, and Failure Recovery

### Remedy, settlement, and transfer state machines

DamageCase: open → under_review → settlement_hold → resolved|rejected; a timely protected filing may enter settlement_hold atomically, while an invalid or late filing is rejected with reason. ReturnCase: requested → authorized → return_in_transit → returned → inspected → resolved|rejected; requested → expired occurs only after the policy-versioned deadline and absent a protected filing. SettlementRecord: eligible → money_pending → settled; settlement is financially terminal, but recovery and post-settlement evidence remain append-only. OwnershipTransferIntent: requested → accepted|contested → reversed; only a compensating reversal can move an accepted intent to reversed.

The order/line lifecycle remains created → authorized → awaiting_dispatch → dispatched → delivered → inspection → settled, with side states awaiting_buyer_amendment, damage_hold, return_authorized, return_in_transit, returned, cancelled, refunded, and post_settlement_claim. This companion may request a line transition through the canonical order service but does not bypass BE-26b state/version guards.

Money/title ordering is fixed: claim → authorization → order → dispatch → verified delivery → remedy → settlement → ownership. Payment success is not ownership; delivery is not settlement. A damage/return filing received before auto-settle wins when the protected filing transaction commits first. A return or damage case must be resolved or policy-expired before settlement unless an explicitly allowed delivered_no_case path has no active hold.

### Return payer and remedy policy

| Reason and finding | Entitlement | Freight/liability payer | Settlement effect |
| --- | --- | --- | --- |
| not_as_described confirmed against purchased disclosure | Statutory/policy return | Seller-side freight; seller/logistics recovery | Full eligible refund or policy remedy; hold until disposition |
| damage_in_transit or damage_on_arrival with admitted coverage/evidence | Statutory/policy return | Seller-side freight/coverage path | Refund or replacement policy; buyer refund does not wait on recovery |
| change_of_mind | Policy/statutory check required | Buyer-side freight unless law or storefront policy overrides | Refund after return acceptance, less only lawful disclosed deductions |
| buyer_caused or diminished condition | No statutory seller-fault entitlement; inspection may allow policy resolution | Buyer-side return; lawful diminished-value deduction | Deduction must be evidenced and bounded; unsupported charge is rejected |
| Incomplete, missing, or contradictory inspection | Escalate and keep hold | Provisional responsibility remains policy-defined | No automatic settlement or title transfer while protected dispute is active |

### Race and recovery matrix

| Race/failure | Winner and invariant | Recovery |
| --- | --- | --- |
| Damage filing versus auto-settle worker | First committed protected filing with valid line version; worker must recheck hold inside settlement transaction | Lost response resolves by idempotency key; worker retries stale read, never settles held line |
| Return request versus dispatch | Material remedy lock wins before dispatch; after verified dispatch, return route requires shipment/case policy | Create return shipment through logistics seam; no retroactive dispatch rewrite |
| Inspection versus seller response | One inspection version per return; assigned inspector lock wins; later response is evidence append | Escalate contradictory evidence; preserve both hashes and require support decision |
| Duplicate settlement command/provider callback | Unique order-line settlement and idempotency receipt win | Replay stored response; payment callback updates money state only, never creates second settlement |
| Refund provider succeeds while recovery fails | Refund is independent and may complete; recovery remains pending | Recovery worker retries; write off only policy-authorized; no title fabrication |
| Transfer request versus settlement reversal | Reversal cannot erase original intent; registry sees compensating event | Append reversal with basis event, mark intent contested/reversed, reconcile registry |
| Registry collision or stale party | Registry rejects/contests intent; settlement remains historical | Quarantine callback, manual dual-control resolution, retry with same intent ID |
| Chargeback without object return | No ownership-return event is inferred | Keep settlement/chargeback facts separate; create post-settlement case if evidence arrives |
| Worker crash after DB commit | Transactional outbox remains pending | Lease worker, retry with event ID and aggregate/version dedupe; poison payload quarantines |
| Deadlock or serialization conflict | No partial write is accepted | Retry twice at 50/150 ms; then return 409 with stable conflict code |

Worker leases expire after eight attempts; outbox delivery is at-least-once and consumers deduplicate by event ID plus aggregate/version. A provider timeout never causes blind retry of a money or registry command when inquiry can recover the original result. Case clocks are immutable policy snapshots, and a protected filing extends/pauses only the clock types named by policy.

## External Seams

| Seam | Exact request | Exact response | Timeout | Retry/backoff | Circuit behavior |
| --- | --- | --- | --- | --- | --- |
| BE-00 idempotency/audit/outbox | { operationId, idempotencyKey, actorId, aggregateId, requestHash, response } | { receiptId, replay, auditId, outboxIds } | 2,000 ms | No independent retry outside transaction; transaction retry twice at 50/150 ms | Open after 3 failures in 30 s; command fails atomically |
| Payment refund/payout adapter | { settlementId, orderLineId, action, amountMinor, currency, providerKey } | { providerOperationId, state: accepted/succeeded/failed/unknown, amountMinor, currency } | 8,000 ms | 3 retries at 250/750/1500 ms only for timeout/408/429/5xx; same settlement/provider key | Open after 5 failures in 120 s; money state remains pending, no duplicate command |
| BE-06 remedy/evidence case service | { caseId, orderId, lineId, evidenceHashes, policyVersion, action } | { caseId, state, evidenceReceiptIds, version } | 5,000 ms | 2 retries at 300/900 ms for timeout/409 inquiry; no retry on 4xx | Open after 5 failures in 120 s; local protected hold persists |
| BE-23 ownership registry | { intentId, settlementId, lineId, fromPartyId, toPartyId, direction, basisEventId } | { registryEventId, state: accepted/contested/rejected, currentOwnerPartyId, registryVersion } | 8,000 ms | 3 retries at 250/750/1500 ms for timeout/408/429/5xx; inquiry by intent ID before retry | Open after 5 failures in 120 s; intent remains requested/contested |
| BE-41 financial/reporting consumer | { eventId, settlementId, lineId, moneyState, policyVersion } | { accepted: true, receiptId } | 3,000 ms | 3 retries at 200/600/1200 ms for timeout/408/429/5xx; event ID dedupe | Open after 5 failures in 60 s; outbox remains pending |
| BE-26b order/clock service | { orderId, lineId, action, expectedVersion, protectedCaseId } | { orderId, lineId, state, version, clocks } | 2,000 ms | 2 retries at 50/150 ms on serialization conflict only | Open after 3 failures in 30 s; settlement fails closed |
| BE-00 object evidence | { objectId, sha256, purpose, actor, expirySeconds } | { signedUrl, expiresAt, contentType, sizeBytes } | 3,000 ms | 2 retries at 200/600 ms on timeout; no retry on hash mismatch | Open after 3 failures in 60 s; case remains evidence-pending |

Provider responses are schema-validated, correlation IDs are hashed in logs, and unknown states are treated as pending rather than success. The circuit breaker never changes the domestic-only or title-after-settlement rules.

## Events and Async Consumers

| Event type | Producer operation | Required envelope and payload | Consumer behavior |
| --- | --- | --- | --- |
| gear_order.damage_claimed.v1 | BE26C-GCF11 | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, caseId, lineHash, reason, protectedFiling, policyVersion } | 26b holds/reads line; notification sends redacted case status; BE-06 indexes evidence |
| gear_order.return_changed.v1 | BE26C-GCF12/13 | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, returnId, lineHash, state, reason, payer, deadlineAt, disposition } | 26b transitions eligible line; logistics creates/updates return path; notifications use safe projection |
| gear_order.settled.v1 | BE26C-GCF14 | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, settlementId, lineHash, moneyState, recoveryStatus, transferRequired } | Payment executes bounded commands; BE-41 records income; BE-23 waits for transfer intent |
| gear_order.transfer_requested.v1 | BE26C-GCF15/16 | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, intentId, settlementId, direction, compensating, basisEventId } | BE-23 accepts/contests registry request; BE-24 reconciles possession; audit preserves append order |
| gear_order.state_changed.v1 | 26b | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, lineId, previousState, currentState } | Remedy worker refetches canonical line before eligibility decision |
| gear_shipment.state_changed.v1 | 26b | { eventId, aggregateId, aggregateVersion, shipmentId, state, verifiedDelivery } | Damage/return policy reads verified delivery and coverage, never raw scan |
| gear_order.amendment_opened.v1 | 26b | { eventId, aggregateId, aggregateVersion, lineId, disclosureDiffClass, dispatchPaused, buyerDeadlineAt } | Return entitlement waits for buyer election or policy deadline |
| gear_pickup.arrangement_changed.v1 | 26d | { eventId, aggregateId, aggregateVersion, pickupId, mode, confirmationState, disagreement } | Settlement branch verifies platform dual confirmation; off-platform remains non-escrow |
| gear_logistics.quote_changed.v1 | 26b | { eventId, aggregateId, aggregateVersion, quoteId, validity, carrierOption } | Return freight policy consumes quote version; no money/title mutation |
| gear_compliance.determination_changed.v1 | 26e | { eventId, aggregateId, aggregateVersion, determinationId, jurisdiction, state, rulesRevision } | Settlement fails closed if current compliance is missing/non-domestic |
| gear_offer.changed.v1 | 26a/25 | { eventId, aggregateId, aggregateVersion, offerId, state, priceSnapshot } | Historical price only; no remedy mutation |
| gear_checkout.group_committed.v1 | 26a | { eventId, aggregateId, aggregateVersion, checkoutGroupId, orderIds } | Locates independent order; mixed cart never becomes one settlement |

Outbox rows carry event type, aggregate ID/version, event ID, request ID, payload hash, and redacted payload. Consumers acknowledge only after durable processing; duplicate delivery is safe. A consumer cannot infer settlement, transfer, entitlement, or delivery from a missing event and must refetch the source service.

## Error Matrix

| Operation ID | Condition | HTTP | Error code | Retry/client action |
| --- | --- | --- | --- | --- |
| BE26C-GCF11 | Hidden order/line or non-owned case context | 404 | ORDER_NOT_FOUND | Do not reveal context |
| BE26C-GCF11 | Duplicate active damage case or stale order version | 409 | DAMAGE_CASE_CONFLICT | Refetch line/case; replay same key if duplicate |
| BE26C-GCF11 | Filing outside protected policy window | 422 | DAMAGE_FILING_TOO_LATE | Use statutory/support escalation if available |
| BE26C-GCF12 | Hidden order/line | 404 | ORDER_NOT_FOUND | Do not reveal |
| BE26C-GCF12 | Return entitlement unavailable or policy version missing | 409 | RETURN_POLICY_UNRESOLVED | Retry after policy service recovery; no automatic settlement |
| BE26C-GCF12 | Open return already exists | 409 | RETURN_ALREADY_OPEN | Refetch and use existing return ID |
| BE26C-GCF13 | Hidden return | 404 | RETURN_NOT_FOUND | Do not reveal |
| BE26C-GCF13 | Inspector not assigned or case not returned | 403 or 409 | RETURN_INSPECTION_FORBIDDEN or RETURN_STATE_CONFLICT | Use assigned processor and state-allowed action |
| BE26C-GCF13 | Evidence contradicts disposition bounds | 422 | INSPECTION_DISPOSITION_INVALID | Escalate; do not force settlement |
| BE26C-GCF14 | Hidden order/line | 404 | ORDER_NOT_FOUND | Do not reveal |
| BE26C-GCF14 | Active damage/return hold or stale version | 409 | SETTLEMENT_HELD or ORDER_VERSION_CONFLICT | Resolve case/refetch canonical state |
| BE26C-GCF14 | Settlement already exists | 409 | SETTLEMENT_ALREADY_CLOSED | Replay original settlement; never create another |
| BE26C-GCF14 | Money totals do not match policy/order snapshot | 422 | SETTLEMENT_TOTAL_INVALID | Recompute from server snapshot |
| BE26C-GCF15 | Hidden settlement or line | 404 | SETTLEMENT_NOT_FOUND | Do not reveal |
| BE26C-GCF15 | Settlement is not terminal/accepted basis | 409 | TRANSFER_BASIS_INVALID | Wait for settlement/refetch |
| BE26C-GCF15 | Active transfer intent already exists | 409 | TRANSFER_INTENT_ALREADY_EXISTS | Refetch intent and replay key |
| BE26C-GCF16 | Hidden intent or basis event | 404 | TRANSFER_INTENT_NOT_FOUND | Do not reveal |
| BE26C-GCF16 | Basis event is mutable, unrelated, or already compensated | 409 | REVERSAL_BASIS_CONFLICT | Refetch registry history; do not append blindly |
| BE26C-GCF16 | Missing legal/fraud/support evidence | 403 or 422 | TRANSFER_REVERSAL_FORBIDDEN or REVERSAL_EVIDENCE_REQUIRED | Obtain dual-control authorization |
| All | Body/schema/unknown key or unsafe text | 400 or 422 | VALIDATION_FAILED | Correct field paths; do not retry unchanged |
| All | Rate limit exceeded | 429 | RATE_LIMITED | Honor Retry-After |
| All | Provider or outbox circuit open | 503 | DEPENDENCY_UNAVAILABLE | Retry same key with backoff; no blind duplicate money/title action |

Every response uses ErrorResponse with BE-00 ApiError { code, message, requestId, details }. Error details never include exact addresses, payment instruments, evidence originals, private descriptions, or provider credentials.

## Testing Strategy

### Contract and route tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE26C-CON-001 | BE26C-GCF11 | Strict request/response rejects unknown keys, unsafe text, invalid reason/evidence/hash, and stale order version; success returns protected clock and hold |
| BE26C-CON-002 | BE26C-GCF12 | Reason, requested resolution, policy-derived payer/deadline, and return state are exact; client cannot select payer |
| BE26C-CON-003 | BE26C-GCF13 | Assigned inspector, outcome/disposition compatibility, evidence bounds, and versioned response are exact |
| BE26C-CON-004 | BE26C-GCF14 | Money integer/currency totals, case/clock requirement, one-time settlement, and title-transfer flag are exact |
| BE26C-CON-005 | BE26C-GCF15 | Only settled matching line can create one transfer intent; direction and basis are server-checked |
| BE26C-CON-006 | BE26C-GCF16 | Immutable basis event, compensating literal, evidence, and reversal response are exact |
| BE26C-ROUTE-001 | BE26C-GCF11 through BE26C-GCF16 | Method/path/operation registry is authoritative; no alias bypasses middleware or changes line scope |

### Authorization and privacy tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE26C-AUTH-001 | BE26C-GCF11 through BE26C-GCF16 | Hidden resource returns 404; visible resource without role/grant returns 403; error details do not disclose context |
| BE26C-AUTH-002 | BE26C-GCF11, BE26C-GCF12 | Buyer owns remedy request; seller cannot elect buyer remedy, suppress hold, or change payer |
| BE26C-AUTH-003 | BE26C-GCF13 | Inspector is case-assigned; seller/buyer cannot write inspection; evidence originals remain purpose-bound |
| BE26C-AUTH-004 | BE26C-GCF14 | Seller cannot settle/release escrow; settlement worker cannot bypass active hold or line ownership |
| BE26C-AUTH-005 | BE26C-GCF15, BE26C-GCF16 | Registry and legal/fraud grants are scoped; no transfer/reversal without settlement basis and dual control |
| BE26C-AUTH-006 | All | CORS policy gear-api, CSRF, signed callbacks, redaction, and no direct table/storage grants are enforced |

### Persistence, idempotency, and concurrency tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE26C-DB-001 | All | Forced RLS denies direct access; RPC rechecks party, role, FK scope, expected version, policy, and append-only rules |
| BE26C-DB-002 | BE26C-GCF11, BE26C-GCF12 | Concurrent cases serialize; protected damage filing defeats auto-settle; one active return policy is enforced |
| BE26C-DB-003 | BE26C-GCF13 | Inspection version uniqueness and evidence hash dedupe hold under duplicate submissions |
| BE26C-DB-004 | BE26C-GCF14 | One settlement per line, money invariants, outbox/audit atomicity, and refund/recovery independence hold |
| BE26C-DB-005 | BE26C-GCF15, BE26C-GCF16 | Unique transfer intent, immutable original, append-only compensating reversal, and registry correlation hold |
| BE26C-DB-006 | All assigned operations | Every listed field has SQL type, nullability, constraints/FKs, indexes, forced RLS, and grants tested by migration |

### Domain, seam, event, and recovery tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE26C-DOM-001 | BE26C-GCF11, BE26C-GCF12 | Statutory/not-as-described/damage/change-of-mind/buyer-caused matrix selects entitlement and payer without client override |
| BE26C-DOM-002 | BE26C-GCF13 | Inspection evidence controls disposition; diminished value is lawful, evidenced, bounded, and never fabricated |
| BE26C-DOM-003 | BE26C-GCF14 | Money closes once; delivery is not settlement; active hold blocks auto-settle; post-settlement case remains readable |
| BE26C-DOM-004 | BE26C-GCF15, BE26C-GCF16 | Transfer follows settlement exactly once; reversal is compensating and does not erase original ownership event |
| BE26C-SEAM-001 | BE26C-GCF11 through BE26C-GCF16 | BE-00, payment, BE-06, BE-23, BE-26b, object evidence timeout/retry/circuit behavior matches this spec |
| BE26C-EVT-001 | BE26C-GCF11 through BE26C-GCF16 | Exact event types, redacted payloads, outbox atomicity, aggregate/version dedupe, and consumer refetch are verified |
| BE26C-REC-001 | BE26C-GCF11 through BE26C-GCF16 | Lost responses, provider unknown states, deadlocks, lease expiry, chargeback without return, registry collision, and poison payloads recover as specified |

## Deepening Passes

| Pass | Question | Resolution |
| --- | --- | --- |
| D1 interaction | Does every assigned IA interaction have one stable route? | Yes: 26.11–26.16 map one-to-one to BE26C-GCF11–GCF16 |
| D2 command | Are IA command names preserved without inventing a second authority? | Yes: OpenReturnOrDamageCase, SettleOrderLine, and RecordTransferFromSettlement are mapped; inspection/reversal are bounded companion commands |
| D3 state | Can money or title advance on a weaker signal? | No: protected filing beats auto-settle; verified delivery precedes remedy; settlement precedes transfer; reversal compensates |
| D4 money | Can refund wait for seller/carrier recovery or double-close? | No: refund is independent; unique line settlement and provider idempotency prevent double close |
| D5 privacy | Can evidence, descriptions, address, or payment data leak? | No: hashes/opaque IDs, purpose-bound object access, projection redaction, and structured-log scrubber |
| D6 authorization | Are role ownership and 403 versus 404 explicit? | Yes: every operation has a role row and concealment row; support exceptions require reason and dual control |
| D7 persistence | Are all fields implementable and protected? | Yes: typed/nullability/constraints/FKs/indexes/RLS/grants are listed for every table |
| D8 resilience | Are external seams deterministic under outage and replay? | Yes: exact request/response, timeout, retry/backoff, circuit, inquiry, and pending behavior are specified |
| D9 events | Can consumers infer state from stale/missing events? | No: events are redacted and deduped; consumers refetch canonical source |
| D10 boundary | Does this duplicate logistics, pickup, future gates, or platform endpoints? | No: endpoint reconciliation and dependency references assign each adjacent authority |

## Ambiguity Gate

PASS. Evidence: 26.11–26.16 each map to one authoritative operation and route; ReturnCase, DamageCase, SettlementRecord, and OwnershipTransferIntent ownership is explicit; Order, OrderLine, OrderClock, Shipment, PackingEvidence, OfferThread, Offer, CartIntent, CheckoutGroup, PickupArrangement, and InternationalDetermination are consumed without route duplication; exact damage/return/inspection/settlement/transfer Zod 4 contracts and global ApiError { code, message, requestId, details } are present; every operation has role ownership, 403-vs-404, CORS policy gear-api, idempotency, rate limit, observability, typed persistence/RLS/grants, error rows, and keyed tests; protected filing, statutory return precedence, refund/recovery independence, settlement-before-title, append-only reversal, exact external seams, event redaction, and failure recovery are resolved. Neighboring interactions 26.01–26.10 and 26.17–26.22 are referenced through explicit BE-26a/b/d/e handoffs. No unresolved source conflict remains.

## Open Questions

None.

## Dependency References

- BE-00 platform contracts in 00-infrastructure.md: strict Zod 4, ApiError { code, message, requestId, details }, auth, CORS, idempotency, rate classes, audit/outbox, object evidence, and forced RLS.
- BE-06 case/evidence contracts: case-bound evidence indexing and provider-safe evidence references.
- BE-23 gear provenance: canonical party, ownership registry, transfer acceptance, service-history, and post-transfer facts.
- BE-24 gear collections: custody/possession grants and custody exception records.
- BE-25b listing/disclosure lifecycle: immutable ListingVersion and DisclosureVersion snapshots used for remedy comparison.
- BE-25c inventory/bulk/channels: MarketplaceUnit and InventoryClaim facts used to keep remedy scope line-specific.
- BE-26a offers/cart/checkout: committed CheckoutGroup, Order, and OrderLine handoff; no mixed-cart settlement.
- BE-26b logistics/order lifecycle: verified delivery, Shipment, PackingEvidence, OrderClock, amendments, and canonical state/version transitions.
- BE-26d pickup/service/warranty: platform/off-platform pickup evidence, service contradiction, warranty/RMA handoff.
- BE-26e future commerce gates: domestic-only compliance and disabled international/auction/ISO/dealer/rental/consignment admission.
- Payment/refund, carrier/coverage, BE-41 reporting, and ownership registry are provider seams with the exact contracts in this companion.

## Changelog

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-08-29 | Initial production-grade BE companion for interactions 26.11–26.16; remedy cases, return payer policy, inspection, one-time settlement, refund/recovery independence, ownership transfer/reversal, strict contracts, security, persistence/RLS, eventing, resilience, and ambiguity evidence added |
