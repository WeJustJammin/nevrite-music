# BE-26e — Gear International and Future Commerce Gates

## Classification

This companion is the backend contract for the two deliberately gated IA interactions in shard 26: 26.21 Run future international gate and 26.22 Run future auction/ISO/dealer flows. It classifies both as authenticated, fail-closed evaluation commands that persist a versioned determination or capability result without opening a live purchase path. It owns InternationalDetermination and the operational evaluation records for future capabilities. It does not create an international order, auction, ISO exchange, dealer program, rental/consignment flow, customs agency, insurance policy, custody grant, payment authorization, settlement, or ownership transfer.

| Boundary | Included | Excluded and handoff |
| --- | --- | --- |
| Interaction ownership | 26.21 international/provider/counsel/rules admission evaluation; 26.22 independent future capability admission evaluation | Offers/cart/checkout 26a; freight/order/delivery 26b; remedies/settlement/title 26c; pickup/service/warranty 26d |
| International authority | Current jurisdiction, tariff, CITES/export, landed-cost, provider, counsel, and policy-version gate; domestic launch remains the only admitted path | Customs broker/agent, carrier, insurer, tax authority, legal counsel, and any live international fulfillment or payment route |
| Future-capability authority | Capability-specific admission for auction, ISO, dealer, rental, consignment, trade-in, layaway, protection, and related expansions | Live marketplace listing, checkout, custody, rental contract, dealer contract, or substitute persona |
| Security boundary | Compliance/support/seller/buyer projections with fail-closed defaults, provider signatures, immutable decisions, and 403 versus 404 | No public compliance secrets, provider credentials, exact address, payment data, or direct table grant |

The implementation target is TypeScript on Hono/Cloudflare Workers with Supabase PostgreSQL, strict Zod 4 contracts, transactional outbox, forced RLS, structured audit, and Sentry-compatible telemetry. A PASS result here means only that an admission gate is satisfied for a specific version; it does not enable a route. A current launch policy explicitly returns disabled for international and future capabilities even when an external provider responds positively.

## Referenced Material Inventory

| Source | Location | Material used | Traceability |
| --- | --- | --- | --- |
| IA shard | .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md lines 24–38 | Locked domestic-only launch, international/CITES/landed-cost disablement, provider/counsel/rules gate, deferred auction/ISO/dealer/rental/consignment and no substitute path | Gate invariants and state sections preserve each lock |
| IA shard | .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md lines 79–100 | Interaction definitions 26.21 and 26.22 plus adjacent fulfillment interactions | One operation ID maps to each assigned interaction in the IA Source Map and route registry |
| IA shard | .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md lines 106–117 | Shared command contract conventions and compliance determination handoff | Strict requests include target, policy, provider evidence, and expected versions |
| IA shard | .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md lines 129–144 | Canonical Data Models including InternationalDetermination and all consumed commerce models | Model inventory and persistence mapping distinguish owned determination from consumed order facts |
| IA shard | .memory/wiki/specs/ia/26-gear-commerce-fulfilment.md lines 209–222 | Event Schemas including gear_compliance.determination_changed.v1 and all neighboring events | Event table uses exact event type literals and fail-closed consumers |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md lines 67–70 | Domestic freight/coverage boundary, customs/insurance role, and international gate | External seam and error matrices require provider/counsel/rules evidence |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md lines 130–143 | International, auction, ISO, dealer, rental, consignment, trade-in, layaway, protection, and warranty locks | Future capability matrix records each disabled capability independently |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md lines 51–53 | Policy-versioned clocks, bounded validity, and immutable historical policy | Determination revisions and evaluations retain the policy/rules revision |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/26-gear-commerce-fulfilment.md lines 116–122 | Provider outage, duplicate webhook, stale state, and race recovery principles | Inbox, idempotency, circuit, and recovery rules are explicit |
| BE platform | .memory/wiki/specs/be/00-infrastructure.md lines 112–153 | Global strict Zod 4 schema conventions and ApiError { code, message, requestId, details } | All request, success, and error contracts cite the global envelope |
| BE platform | .memory/wiki/specs/be/00-infrastructure.md lines 208–308 | Auth, forced RLS, grants, idempotency, rate classes, CORS, audit, outbox, and provider callback controls | Middleware, persistence, and observability matrices inherit these contracts |
| BE identity/custody | .memory/wiki/specs/be/23-gear-provenance.md and .memory/wiki/specs/be/24-gear-collections.md | Canonical party, provenance, ownership, and custody boundaries | Gate evaluation cannot grant identity, custody, or title |
| BE marketplace | .memory/wiki/specs/be/25b-gear-listing-disclosure-lifecycle.md and .memory/wiki/specs/be/25c-gear-inventory-bulk-channels.md | Listing/disclosure, inventory, channel, and party facts | Evaluation references immutable snapshots and does not mutate listing admission |
| BE adjacent shard | .memory/wiki/specs/be/26a-gear-offers-cart-checkout.md and .memory/wiki/specs/be/26b-gear-logistics-order-lifecycle.md | Checkout, order, freight, and domestic shipment boundaries | A gate result never bypasses live route reconciliation |
| BE adjacent shard | .memory/wiki/specs/be/26c-gear-remedies-settlement-transfers.md and .memory/wiki/specs/be/26d-gear-pickup-service-warranty.md | Remedy/title and pickup/service/warranty boundaries | Compliance gate is a prerequisite signal only, not a downstream mutation |

## IA Source Map

### Assigned interactions

| IA interaction | IA intent and invariant | Backend operation | Authority |
| --- | --- | --- | --- |
| 26.21 | Run future international gate | BE26E-GCF21 | Evaluate current jurisdiction, item, provider, counsel, rules, tariff/CITES, landed-cost, and policy gates; fail closed and keep launch disabled |
| 26.22 | Run future auction/ISO/dealer flows | BE26E-GCF22 | Evaluate one named future capability at a time; capabilities are independently admitted and remain disabled until explicit launch policy |

### Canonical Data Models

| IA model name | Role in this companion | Durable authority or reference |
| --- | --- | --- |
| InternationalDetermination | Owned versioned international/compliance evaluation and disabled/admitted result | platform_private.international_determinations |
| OfferThread | Consumed historical offer provenance only | BE-26a/BE-25 authority |
| Offer | Consumed accepted price/provenance only | BE-26a/BE-25 authority |
| CartIntent | Consumed fulfillment intent only | BE-26a authority |
| CheckoutGroup | Consumed independent order partition only | BE-26a authority |
| Order | Consumed order context; international gate cannot mutate it | BE-26a/26b authority |
| OrderLine | Consumed item and disclosure context | BE-26b authority |
| OrderClock | Consumed policy clock context; gate does not create a fulfillment deadline | BE-26b authority |
| Shipment | Consumed domestic shipment context only | BE-26b authority |
| FreightQuoteRequest | Consumed freight facts; no international quote at launch | BE-26b authority |
| PackingEvidence | Consumed item/evidence facts when an evaluation requires them | BE-26b authority |
| ReturnCase | Consumed remedy context; gate cannot change entitlement | BE-26c authority |
| DamageCase | Consumed damage/liability context; gate cannot change settlement | BE-26c authority |
| SettlementRecord | Consumed financial close context; no gate creates settlement | BE-26c authority |
| OwnershipTransferIntent | Consumed title context; no gate creates transfer | BE-26c authority |
| PickupArrangement | Consumed alternative fulfillment context; no international/off-platform substitute | BE-26d authority |

FutureCapabilityGate is an operational auxiliary projection keyed by capability name and policy revision; it does not replace an IA canonical model or open a public route.

### Event Schemas

| Exact Event Schemas type | Produced/consumed | Payload authority and privacy rule |
| --- | --- | --- |
| gear_compliance.determination_changed.v1 | Produced by BE26E-GCF21 and consumed by gate-aware workers | Determination ID, target hash, jurisdiction class, state, gate result, rules revision, and version; no address or provider credential |
| gear_offer.changed.v1 | Consumed as historical market context | No offer mutation or auction admission |
| gear_checkout.group_committed.v1 | Consumed as independent-order context | Gate result cannot join or reprioritize checkout groups |
| gear_order.state_changed.v1 | Consumed from 26b | Current order/line state and version; fail closed when stale |
| gear_order.amendment_opened.v1 | Consumed from 26b | Disclosure amendment may invalidate a prior evaluation |
| gear_shipment.state_changed.v1 | Consumed from 26b | Domestic shipment/verified delivery only; no international shipment route |
| gear_order.damage_claimed.v1 | Consumed from 26c | Damage context may invalidate an item gate |
| gear_order.return_changed.v1 | Consumed from 26c | Return context may pause or invalidate evaluation |
| gear_order.settled.v1 | Consumed from 26c | Settlement remains separate from a capability result |
| gear_order.transfer_requested.v1 | Consumed from 26c | Title remains settlement-backed and independent |
| gear_pickup.arrangement_changed.v1 | Consumed from 26d | Pickup arrangement cannot substitute for international/customs admission |
| gear_logistics.quote_changed.v1 | Consumed from 26b | Domestic quote facts only; no parcel downgrade or international quote |

## Endpoint Reconciliation

BE-00 remains the authority for authentication/session, global error serialization, idempotency receipts, audit/outbox, signed evidence, CORS, and feature-configuration access. BE-23 owns identity/provenance and ownership registry facts; BE-24 owns custody/possession grants. BE-25b and BE-25c own listing, disclosure, inventory, and channel facts. BE-26a owns offers/cart/checkout; BE-26b owns domestic freight, shipment, delivery, order state, and clocks; BE-26c owns remedies, settlement, and title; BE-26d owns pickup, service, and warranty. External customs/tariff/CITES, landed-cost, insurer/carrier, counsel, and feature-admission systems remain provider seams. The two routes below evaluate and persist a gate only. Neither route enables checkout, creates an order, books a carrier, collects payment, settles money, grants custody, or transfers ownership.

The international result is deliberately two-dimensional: provider/legal facts may be complete while launch admission remains disabled. A positive external response never overrides the current launch policy. Future capability results are named and independently versioned; a positive auction evaluation cannot enable ISO, dealer, rental, consignment, trade-in, layaway, protection, or another capability. There is no hidden substitute persona or partial route.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Command | Success |
| --- | --- | --- | --- | --- | --- |
| BE26E-GCF21 | POST | /api/v1/gear/commerce/international-determinations | 26.21 | RunInternationalGate | 200 InternationalDeterminationSuccess |
| BE26E-GCF22 | POST | /api/v1/gear/commerce/future-capability-gates | 26.22 | RunFutureCapabilityGate | 200 FutureCapabilityGateSuccess |

### Request/response contracts (Zod 4)

All schemas are strict Zod 4. UUIDs are canonical lowercase UUID strings; dates are RFC 3339 UTC strings; jurisdiction and capability values are allowlisted. Unknown keys, exact public addresses, client-selected admission, unsupported capabilities, stale snapshots, missing provider/counsel/rules evidence, and missing idempotency keys fail before mutation. Every failure serializes the BE-00 global envelope ApiError { code, message, requestId, details } through ErrorResponse.

~~~ts
const Id = z.string().uuid();
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const IsoDate = z.string().datetime({ offset: true });
const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const Target = z.object({
  listingVersionId: Id.nullable(),
  disclosureVersionId: Id.nullable(),
  marketplaceUnitId: Id.nullable(),
  orderLineId: Id.nullable(),
}).strict();
const Evidence = z.object({
  evidenceId: Id,
  sha256: Hash,
  kind: z.enum(["provider_result", "counsel_attestation", "rules_snapshot", "item_classification", "cost_snapshot"]),
  capturedAt: IsoDate,
}).strict();

const Gcf21Request = z.object({
  operationId: z.literal("BE26E-GCF21"),
  target: Target,
  originCountry: z.string().regex(/^[A-Z]{2}$/),
  destinationCountry: z.string().regex(/^[A-Z]{2}$/),
  itemCategory: z.string().regex(/^[A-Z0-9_:-]{2,80}$/),
  harmonizedCode: z.string().regex(/^[0-9]{6,12}$/).nullable(),
  citesClassification: z.enum(["not_applicable", "not_listed", "listed", "unknown"]),
  landedCost: z.object({
    amountMinor: z.number().int().nonnegative().max(100000000000),
    currency: z.string().regex(/^[A-Z]{3}$/),
    includesDuty: z.boolean(),
    includesTax: z.boolean(),
  }).strict().nullable(),
  deliveryTerm: z.enum(["domestic_only", "ddp_candidate", "dap_candidate"]),
  providerEvidence: z.array(Evidence).max(20),
  counselEvidence: z.array(Evidence).max(10),
  rulesEvidence: z.array(Evidence).max(20),
  expectedDeterminationVersion: z.number().int().positive().nullable(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();

const Gcf22Request = z.object({
  operationId: z.literal("BE26E-GCF22"),
  capability: z.enum(["auction", "iso_exchange", "dealer_channel", "rental", "consignment", "trade_in", "layaway", "protection_plan"]),
  target: Target,
  requestedByPartyId: Id,
  policyVersion: z.string().regex(/^[A-Za-z0-9._:-]{1,80}$/),
  capabilityEvidence: z.array(Evidence).max(20),
  expectedGateVersion: z.number().int().positive().nullable(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();

const InternationalDeterminationSuccess = z.object({
  operationId: z.literal("BE26E-GCF21"),
  determinationId: Id,
  state: z.enum(["evaluated_disabled", "evaluated_blocked", "evaluated_admitted", "provider_pending", "stale"]),
  launchAdmission: z.literal("disabled"),
  providerEligibility: z.enum(["unknown", "blocked", "eligible"]),
  reasons: z.array(z.string().regex(/^[A-Z0-9_]{3,80}$/)).min(1).max(20),
  policyVersion: z.string().regex(/^[A-Za-z0-9._:-]{1,80}$/),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const FutureCapabilityGateSuccess = z.object({
  operationId: z.literal("BE26E-GCF22"),
  gateId: Id,
  capability: z.enum(["auction", "iso_exchange", "dealer_channel", "rental", "consignment", "trade_in", "layaway", "protection_plan"]),
  state: z.enum(["disabled", "blocked", "evaluated_admitted", "provider_pending", "stale"]),
  publicRouteEnabled: z.literal(false),
  policyVersion: z.string().regex(/^[A-Za-z0-9._:-]{1,80}$/),
  reasons: z.array(z.string().regex(/^[A-Z0-9_]{3,80}$/)).min(1).max(20),
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

Gcf21 never accepts an exact address or a client admission flag. DDP and DAP are evaluation labels only; neither is selectable for live launch. Gcf22 requires one capability literal and returns publicRouteEnabled false even if evidence is complete. Response replay returns the original stored response through BE-00 idempotency.

### Contract Registry

| Operation ID | Request contract | Success contract and invariant | Error contract | Atomic write set |
| --- | --- | --- | --- | --- |
| BE26E-GCF21 | Gcf21Request strict; target snapshot, jurisdiction/item facts, landed-cost label, and evidence | InternationalDeterminationSuccess; launchAdmission is always disabled at current policy | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Determination, evidence links, policy snapshot, audit, outbox, and idempotency receipt |
| BE26E-GCF22 | Gcf22Request strict; one capability, target, party, policy, and evidence | FutureCapabilityGateSuccess; publicRouteEnabled is always false until a separately locked launch policy | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Gate evaluation, evidence links, policy snapshot, audit, outbox, and idempotency receipt |

## Authorization and Ownership

Resource existence is resolved only after coarse authenticated lookup. A hidden listing, unit, order line, determination, gate, or party returns 404; a visible resource for which the actor lacks evaluation authority returns 403. Error details contain stable codes and field paths without revealing destination, provider, legal, or private item facts.

| Operation ID | Allowed roles | Ownership and object scope | 403 versus 404 |
| --- | --- | --- | --- |
| BE26E-GCF21 | Compliance worker; authorized seller/listing controller for own item; support/legal dual control | Target must belong to the authenticated party or assigned compliance case; provider/counsel/rules facts are scoped to target and policy revision | Hidden target returns 404 GATE_TARGET_NOT_FOUND; visible target without evaluation grant returns 403 INTERNATIONAL_GATE_FORBIDDEN |
| BE26E-GCF22 | Feature-admission worker; compliance/product governance; support dual control | One capability evaluation is scoped to target, requested party, and policy version; no actor can enable a public route | Hidden target/gate returns 404 CAPABILITY_TARGET_NOT_FOUND; visible target without governance grant returns 403 FUTURE_GATE_FORBIDDEN |

Buyers and sellers may request an evaluation only for their own line/listing context; they cannot mark a result admitted. Compliance workers can record provider/legal/rules results but cannot publish a route. Governance can change a policy version only through the locked policy process; this endpoint records the version and cannot silently widen scope. Organization accounts require controlled-party grants. No evaluation grants custody, title, payment, or a new persona.

## Middleware and Security

### Per-operation middleware registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
| --- | --- | --- | --- |
| BE26E-GCF21 | requestId → CORS → auth → party/compliance context → rate limit → idempotency → strict body validation → snapshot/version gate → provider evidence verifier → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 256 KiB body; no exact address; evidence hash and provider signature required; domestic launch policy always wins |
| BE26E-GCF22 | requestId → CORS → auth → governance context → rate limit → idempotency → strict body validation → capability allowlist → policy/version gate → handler/outbox | CORS policy gear-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 128 KiB body; one capability only; no publicRouteEnabled input; no substitute persona or cross-target evaluation |

All routes apply CSRF protection where browser credentials are used, content-type/body-size checks, origin allowlisting, safe response headers, structured redaction, and request-scoped tracing. Provider callbacks require signed timestamps, replay window 5 minutes, provider event ID dedupe, and scoped worker identity. Evidence originals are purpose-bound through BE-00; public events expose hashes and coarse categories only. Gate results are advisory to route guards and cannot be used as a direct feature flag.

## Idempotency, Rate Limits, and SLOs

| Operation ID | Idempotency and concurrency | Rate limit | SLO and timeout |
| --- | --- | --- | --- |
| BE26E-GCF21 | Required key/body hash; unique target/policy/rules revision evaluation; target lock; duplicate provider event replay | 20 per party per 10 minutes, burst 3 | p95 1.5 s, hard 15 s; provider checks are asynchronous |
| BE26E-GCF22 | Required key/body hash; unique target/capability/policy version evaluation; capability lock; no route enable in transaction | 20 per governance actor per 10 minutes, burst 3 | p95 1.2 s, hard 15 s; feature-admission evidence is asynchronous |

BE-00 idempotency receipts retain at least 24 hours with request hash, status, response, and expiry. A lost response is recovered by key lookup. Policy/rules revisions are immutable for historical evaluations. Deadlock/serialization retry is at most twice at 50 ms and 150 ms; a provider timeout never turns a gate into admitted.

## Observability

| Operation ID | Metrics and alerts | Structured logs and traces | Audit/outbox evidence |
| --- | --- | --- | --- |
| BE26E-GCF21 | international_gate_total by state/reason; provider_pending_total; domestic_policy_block_total; stale_evaluation_total; latency | requestId, operationId, target hash, origin/destination country class, item category, CITES class, policy/rules revision, result; no address/provider secret | compliance.determination.changed; gear_compliance.determination_changed.v1; evidence hashes and provider correlation hash |
| BE26E-GCF22 | future_gate_total by capability/state; public_route_enable_attempt_total; policy_conflict_total; stale_evaluation_total | requestId, operationId, target hash, capability, policy version, requester role, result; no private item/provider data | future.capability.evaluated; gate policy audit; no enable event |

Trace spans include compliance.determination, customs.rules, counsel.attestation, capability.gate, and provider.callback, preserving all denials, stale versions, missing evidence, provider retries, and route-enable attempts. Sentry events scrub addresses, legal notes, provider credentials, evidence URLs, and party identifiers. Alerts fire on any non-domestic result marked admitted, any public route enable attempt, missing rules/counsel evidence, and any positive provider response overridden incorrectly by launch policy.

## Persistence and RLS

All tables use protected schemas with enabled and forced RLS. Direct anon/authenticated table grants are denied. Security-invoker RPCs recheck account/party, target ownership, policy version, provider signature, evidence hash, expected version, and the current launch-disable policy. Every mutation writes audit and outbox rows in the same transaction. Evidence originals remain in BE-00 object storage; these tables store opaque IDs and hashes.

### Complete table definitions

| Table / model | Typed fields with SQL types, nullability, constraints and FKs | Query indexes | RLS and grants |
| --- | --- | --- | --- |
| platform_private.international_determinations / InternationalDetermination | id uuid PRIMARY KEY; target_listing_version_id uuid NULL REFERENCES platform_private.listing_versions(id); target_disclosure_version_id uuid NULL REFERENCES platform_private.listing_disclosure_versions(id); target_marketplace_unit_id uuid NULL REFERENCES platform_private.marketplace_units(id); target_order_line_id uuid NULL REFERENCES platform_private.order_lines(id); origin_country char(2) NOT NULL CHECK (origin_country ~ '^[A-Z]{2}$'); destination_country char(2) NOT NULL CHECK (destination_country ~ '^[A-Z]{2}$'); item_category text NOT NULL CHECK (item_category ~ '^[A-Z0-9_:-]{2,80}$'); harmonized_code text NULL CHECK (harmonized_code ~ '^[0-9]{6,12}$'); cites_classification text NOT NULL CHECK (cites_classification IN ('not_applicable','not_listed','listed','unknown')); delivery_term text NOT NULL CHECK (delivery_term IN ('domestic_only','ddp_candidate','dap_candidate')); provider_eligibility text NOT NULL CHECK (provider_eligibility IN ('unknown','blocked','eligible')); launch_admission text NOT NULL DEFAULT 'disabled' CHECK (launch_admission = 'disabled'); state text NOT NULL CHECK (state IN ('evaluated_disabled','evaluated_blocked','evaluated_admitted','provider_pending','stale')); reason_codes text[] NOT NULL CHECK (cardinality(reason_codes) BETWEEN 1 AND 20); policy_version text NOT NULL; rules_revision text NULL; expected_version bigint NOT NULL CHECK (expected_version > 0); version bigint NOT NULL CHECK (version > 0); evaluated_at timestamptz NOT NULL; created_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | (target_order_line_id,state); (target_marketplace_unit_id,evaluated_at DESC); (destination_country,state); (policy_version,evaluated_at DESC); (state,updated_at) | Requesting party sees own safe projection; compliance worker target-scoped; no direct client grant; forced RLS |
| platform_private.international_cost_snapshots | id uuid PRIMARY KEY; determination_id uuid NOT NULL REFERENCES platform_private.international_determinations(id); amount_minor bigint NULL CHECK (amount_minor >= 0); currency char(3) NULL CHECK (currency ~ '^[A-Z]{3}$'); includes_duty boolean NULL; includes_tax boolean NULL; source text NOT NULL CHECK (source IN ('provider','counsel','rules','manual')); source_revision text NOT NULL; captured_at timestamptz NOT NULL; evidence_hash char(64) NOT NULL CHECK (evidence_hash ~ '^[a-f0-9]{64}$'); created_at timestamptz NOT NULL; UNIQUE(determination_id,source_revision,evidence_hash) | (determination_id,captured_at DESC); (source,source_revision); (evidence_hash) | Compliance worker and assigned governance read; no client write; forced RLS; no direct grant |
| platform_private.international_gate_evidence | id uuid PRIMARY KEY; determination_id uuid NOT NULL REFERENCES platform_private.international_determinations(id); evidence_id uuid NOT NULL REFERENCES platform_private.object_refs(id); sha256 char(64) NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'); kind text NOT NULL CHECK (kind IN ('provider_result','counsel_attestation','rules_snapshot','item_classification','cost_snapshot')); provider_event_id text NULL; captured_at timestamptz NOT NULL; added_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL; UNIQUE(determination_id,sha256) | (determination_id,created_at DESC); (kind,created_at DESC); (provider_event_id); (sha256) | Compliance worker may append; target party sees safe evidence count; BE-00 grants originals by purpose; forced RLS |
| platform_private.future_capability_gates | id uuid PRIMARY KEY; capability text NOT NULL CHECK (capability IN ('auction','iso_exchange','dealer_channel','rental','consignment','trade_in','layaway','protection_plan')); target_listing_version_id uuid NULL REFERENCES platform_private.listing_versions(id); target_marketplace_unit_id uuid NULL REFERENCES platform_private.marketplace_units(id); target_order_line_id uuid NULL REFERENCES platform_private.order_lines(id); requested_by_party_id uuid NOT NULL REFERENCES identity.parties(id); policy_version text NOT NULL; state text NOT NULL CHECK (state IN ('disabled','blocked','evaluated_admitted','provider_pending','stale')); public_route_enabled boolean NOT NULL DEFAULT false CHECK (public_route_enabled = false); reason_codes text[] NOT NULL CHECK (cardinality(reason_codes) BETWEEN 1 AND 20); version bigint NOT NULL CHECK (version > 0); evaluated_at timestamptz NOT NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(capability,policy_version,target_marketplace_unit_id,target_order_line_id) | (capability,state); (requested_by_party_id,created_at DESC); (policy_version,capability); (target_order_line_id,capability); (target_marketplace_unit_id,capability) | Governance/feature worker only writes; requester sees safe status; no public route grant; forced RLS; no direct client grant |
| platform_private.future_capability_evidence | id uuid PRIMARY KEY; gate_id uuid NOT NULL REFERENCES platform_private.future_capability_gates(id); evidence_id uuid NOT NULL REFERENCES platform_private.object_refs(id); sha256 char(64) NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'); kind text NOT NULL CHECK (kind IN ('provider_result','counsel_attestation','rules_snapshot','item_classification','cost_snapshot')); captured_at timestamptz NOT NULL; added_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL; UNIQUE(gate_id,sha256) | (gate_id,created_at DESC); (kind,created_at DESC); (sha256) | Governance/feature worker may append; requester receives count/projection; BE-00 grants originals by purpose; forced RLS |
| platform_private.compliance_provider_inbox | id uuid PRIMARY KEY; provider_event_id text NOT NULL; event_type text NOT NULL; target_hash char(64) NOT NULL CHECK (target_hash ~ '^[a-f0-9]{64}$'); payload_hash char(64) NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'); received_at timestamptz NOT NULL; processed_at timestamptz NULL; state text NOT NULL CHECK (state IN ('received','processed','quarantined')); error_code text NULL; UNIQUE(provider_event_id,event_type) | (provider_event_id,event_type) unique; (state,received_at); (target_hash,received_at DESC) | Worker/service only; no client grant; forced RLS; raw payload retained in protected event store |

The target columns allow a listing, unit, or order line but require at least one non-null target through a database CHECK constraint and RPC validation. Current launch policy is represented by immutable launch_admission and public_route_enabled checks; changing those checks is a separate locked architecture/policy change, not a request parameter. Evidence and cost snapshots are append-only. Gate rows never hold payment, custody, or title authority.

### Permission and RLS matrix

| Principal | Read projection | Write path | Prohibited |
| --- | --- | --- | --- |
| Buyer/buying-party controller | Own target safe result, reason classes, policy version, and disabled state | Request evaluation through public route with own target grant | Cannot select admission, see provider/legal originals, or open international/future commerce |
| Seller/listing controller | Own listing/unit safe determination and evidence count | Request GCF21 for own listing/unit; no governance write | Cannot enable route, bypass domestic policy, or expose provider/counsel details |
| Compliance worker | Target-scoped full determination/evidence metadata | Signed provider/counsel/rules evaluation RPC | Cannot override launch disable or mutate listing/order/custody |
| Governance/feature worker | Capability and policy projections | GCF22 policy-versioned evaluation RPC | Cannot enable a public route through this endpoint; no substitute capability |
| Support/legal | Case-bound safe projection; sensitive evidence with dual control | Exception evaluation with reason and two identities | Cannot erase history, change policy checks, or grant payment/title/custody |
| Provider callback worker | Target hash, event inbox, and scoped result | Signed callback/inbox RPC | Cannot access unrelated target or directly change public flags |
| Anon/authenticated client | No direct table access | Public routes after Hono/RPC authorization | Direct SQL, storage, event, feature, payment, custody, and registry grants denied |

## State Machines, Concurrency, and Failure Recovery

### Gate state machines

InternationalDetermination: requested → provider_pending → evaluated_disabled or evaluated_blocked or evaluated_admitted; stale is entered when target/disclosure/rules/policy version changes. evaluated_admitted means external gate facts passed, but launch_admission remains disabled at current launch policy. A missing provider, counsel, rules, tariff/CITES, landed-cost, or current item classification produces evaluated_blocked or provider_pending, never success-by-default.

FutureCapabilityGate: requested → disabled or provider_pending → blocked or evaluated_admitted → stale on target/policy revision. Each capability is independently keyed: auction, iso_exchange, dealer_channel, rental, consignment, trade_in, layaway, and protection_plan. A positive result for one capability never changes another. public_route_enabled remains false in every state from this endpoint.

Every evaluation retains the exact policy version, rules revision, evidence hashes, target snapshot IDs, and result reasons. A later disclosure amendment, inventory state change, ownership/custody change, or legal/policy revision invalidates the evaluation rather than silently widening it. Gate evaluation is advisory; route handlers must separately enforce the current launch policy and their own contracts.

### Race and recovery matrix

| Race/failure | Winner and invariant | Recovery |
| --- | --- | --- |
| Provider positive response versus launch-disabled policy | Launch policy wins; result may be evaluated_admitted externally but remains disabled publicly | Persist both facts and reason; route guard continues to reject |
| Evaluation versus listing/disclosure revision | New target revision wins; old result becomes stale | Refetch immutable snapshot and rerun with same or new idempotency key |
| International determination versus checkout | Checkout policy/route remains authoritative; determination cannot create order or payment | Return gate status only; no checkout mutation |
| Capability evaluation versus route-enable attempt | This service has no enable path; route-enable attempt is denied and audited | Alert governance; preserve disabled gate |
| Duplicate provider webhook | Provider event ID and payload hash inbox dedupe | Replay stored result; quarantine same ID with different hash |
| Missing counsel/rules/CITES evidence | Fail closed to blocked or provider_pending | Request evidence; never infer eligibility |
| DDP/DAP label versus customs capability | Label is evaluation metadata only; no delivery term selected for launch | Keep launch disabled; do not book carrier or calculate charge |
| Target deleted/hidden versus worker retry | Resource concealment wins for clients; worker receives scoped not-found | Mark evaluation stale/cancelled with audit; no disclosure |
| Worker crash after DB commit | Transactional outbox remains pending | Lease retry; consumers dedupe event ID plus aggregate/version |
| Deadlock or serialization conflict | No partial gate/evidence write | Retry twice at 50/150 ms; return 409 after bound |
| Stale policy worker writes positive result | Expected policy version check rejects write | Refetch current policy; retain stale evidence |

Worker leases expire after eight attempts; poison provider payloads quarantine. Provider silence remains pending and does not advance a capability. A gate result cannot be interpreted as customs clearance, tax advice, insurance, carrier acceptance, warranty, custody, settlement, or title.

## External Seams

| Seam | Exact request | Exact response | Timeout | Retry/backoff | Circuit behavior |
| --- | --- | --- | --- | --- | --- |
| BE-00 idempotency/audit/outbox | { operationId, idempotencyKey, actorId, targetHash, requestHash, response } | { receiptId, replay, auditId, outboxIds } | 2,000 ms | No independent retry outside transaction; transaction retry twice at 50/150 ms | Open after 3 failures in 30 s; command fails atomically |
| Customs/tariff/CITES provider | { determinationId, originCountry, destinationCountry, itemCategory, harmonizedCode, citesClassification, targetSnapshot } | { providerEventId, state: eligible/blocked/unknown, tariffRevision, citesResult, landedCostRequired, validUntil } | 8,000 ms | 3 retries at 250/750/1500 ms for timeout/408/429/5xx; inquiry by determinationId | Open after 5 failures in 120 s; determination remains provider_pending/disabled |
| Landed-cost provider | { determinationId, destinationCountry, itemCategory, harmonizedCode, deliveryTerm, declaredValue } | { providerEventId, state: quoted/unavailable, dutyMinor, taxMinor, feesMinor, currency, revision } | 8,000 ms | 3 retries at 250/750/1500 ms for timeout/408/429/5xx; same determination key | Open after 5 failures in 120 s; no international price or checkout |
| Counsel/rules registry | { determinationId, jurisdiction, itemCategory, citesClassification, ruleRevision, evidenceHashes } | { counselReceipt, state: approved/rejected/pending, restrictions, expiresAt, ruleRevision } | 5,000 ms | 2 retries at 300/900 ms for timeout/408/429/5xx; inquiry by determinationId | Open after 5 failures in 120 s; gate blocked/pending |
| Future feature-admission registry | { gateId, capability, targetHash, policyVersion, evidenceHashes } | { admissionReceipt, state: disabled/blocked/evaluated_admitted/pending, policyRevision, routeEnabled: false } | 3,000 ms | 3 retries at 200/600/1200 ms for timeout/408/429/5xx; same gate ID | Open after 5 failures in 60 s; route remains disabled |
| BE-25 listing/disclosure and BE-26b order context | { target IDs, expectedSnapshotVersions, capability, policyVersion } | { snapshotVersions, state, disclosureHash, domesticOnly: true } | 2,000 ms | 2 retries at 50/150 ms on serialization conflict only | Open after 3 failures in 30 s; evaluation fails closed |
| BE-00 object evidence | { evidenceId, sha256, purpose, actor, expirySeconds } | { signedUrl, expiresAt, contentType, sizeBytes } | 3,000 ms | 2 retries at 200/600 ms on timeout; no retry on hash mismatch | Open after 3 failures in 60 s; evidence remains pending |

Provider responses are schema-validated, event IDs are deduped, and unknown values are pending or blocked. Correlation IDs are hashed in logs. No seam can change launch_admission or public_route_enabled to true.

## Events and Async Consumers

| Event type | Producer operation | Required envelope and payload | Consumer behavior |
| --- | --- | --- | --- |
| gear_compliance.determination_changed.v1 | BE26E-GCF21 | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, determinationId, targetHash, jurisdictionClass, state, launchAdmission, rulesRevision, reasonCodes } | Gate-aware workers refetch current policy; route guards remain independently fail-closed |
| gear_offer.changed.v1 | 26a/25 | { eventId, aggregateId, aggregateVersion, offerId, state, priceSnapshot } | Historical context only; no gate enable |
| gear_checkout.group_committed.v1 | 26a | { eventId, aggregateId, aggregateVersion, checkoutGroupId, orderIds } | Independent orders remain domestic/routed by their own policy |
| gear_order.state_changed.v1 | 26b | { eventId, aggregateId, aggregateVersion, lineId, previousState, currentState } | Stale target evaluation is invalidated |
| gear_order.amendment_opened.v1 | 26b | { eventId, aggregateId, aggregateVersion, lineId, disclosureDiffClass, dispatchPaused } | Re-evaluation required for changed disclosure |
| gear_shipment.state_changed.v1 | 26b | { eventId, aggregateId, aggregateVersion, shipmentId, state, verifiedDelivery } | No international shipment inference |
| gear_order.damage_claimed.v1 | 26c | { eventId, aggregateId, aggregateVersion, caseId, lineHash, protectedFiling } | Compliance context may be marked stale |
| gear_order.return_changed.v1 | 26c | { eventId, aggregateId, aggregateVersion, returnId, lineHash, state } | Gate-aware consumers refetch remedy context |
| gear_order.settled.v1 | 26c | { eventId, aggregateId, aggregateVersion, settlementId, lineHash, moneyState } | Settlement remains separate from gate result |
| gear_order.transfer_requested.v1 | 26c | { eventId, aggregateId, aggregateVersion, intentId, settlementId, compensating } | Ownership remains registry-backed |
| gear_pickup.arrangement_changed.v1 | 26d | { eventId, aggregateId, aggregateVersion, pickupId, mode, state, confirmationClass } | Pickup cannot substitute for customs/international admission |
| gear_logistics.quote_changed.v1 | 26b | { eventId, aggregateId, aggregateVersion, quoteId, validity, carrierOption } | Domestic quote only; no international route |

Outbox rows include event ID, type, aggregate ID/version, request ID, payload hash, and redacted payload. Consumers acknowledge only after durable processing and dedupe event ID plus aggregate/version. A missing event never enables a feature; consumers refetch current policy and target snapshots.

## Error Matrix

| Operation ID | Condition | HTTP | Error code | Retry/client action |
| --- | --- | --- | --- | --- |
| BE26E-GCF21 | Hidden listing/unit/order target | 404 | GATE_TARGET_NOT_FOUND | Do not reveal target |
| BE26E-GCF21 | Visible target without compliance/party grant | 403 | INTERNATIONAL_GATE_FORBIDDEN | Use authorized compliance context |
| BE26E-GCF21 | Destination is non-domestic at launch | 422 | INTERNATIONAL_DISABLED | Use domestic route; no checkout workaround |
| BE26E-GCF21 | Missing provider/counsel/rules/CITES/cost evidence | 409 | INTERNATIONAL_EVIDENCE_PENDING | Supply scoped evidence or await provider |
| BE26E-GCF21 | Snapshot or policy version stale | 409 | DETERMINATION_VERSION_CONFLICT | Refetch and evaluate current revision |
| BE26E-GCF21 | Provider unavailable | 503 | COMPLIANCE_PROVIDER_UNAVAILABLE | Retry same key; remain disabled/pending |
| BE26E-GCF22 | Hidden target/gate | 404 | CAPABILITY_TARGET_NOT_FOUND | Do not reveal target |
| BE26E-GCF22 | Visible target without governance grant | 403 | FUTURE_GATE_FORBIDDEN | Use authorized governance context |
| BE26E-GCF22 | Capability not in allowlist | 422 | CAPABILITY_UNSUPPORTED | Request an explicitly named capability |
| BE26E-GCF22 | Route enable attempted | 409 | FUTURE_ROUTE_DISABLED | Persist evaluation only; no public path |
| BE26E-GCF22 | Policy or target version stale | 409 | CAPABILITY_VERSION_CONFLICT | Refetch current policy/target |
| BE26E-GCF22 | Admission registry unavailable | 503 | ADMISSION_PROVIDER_UNAVAILABLE | Retry same key; route remains disabled |
| All | Body/schema/unknown key/unsafe text | 400 or 422 | VALIDATION_FAILED | Correct field paths; do not retry unchanged |
| All | Rate limit exceeded | 429 | RATE_LIMITED | Honor Retry-After and idempotency key |
| All | Provider/outbox circuit open | 503 | DEPENDENCY_UNAVAILABLE | Retry same key with backoff; fail closed |

Every response uses ErrorResponse with BE-00 ApiError { code, message, requestId, details }. Error details never include exact addresses, provider credentials, counsel notes, evidence originals, payment instruments, or hidden party facts.

## Testing Strategy

### Contract and route tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE26E-CON-001 | BE26E-GCF21 | Strict request/response enforces target, jurisdiction/item/CITES, DDP/DAP labels, evidence, version, disabled launch result, and reason codes |
| BE26E-CON-002 | BE26E-GCF22 | Strict request/response enforces one capability, target, party, policy/evidence/version, false public route, and independent state |
| BE26E-ROUTE-001 | BE26E-GCF21, BE26E-GCF22 | Method/path/operation registry is authoritative; no alias bypasses middleware or creates a live feature route |

### Authorization and privacy tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE26E-AUTH-001 | BE26E-GCF21, BE26E-GCF22 | Hidden target returns 404; visible target without evaluation role returns 403; details conceal context |
| BE26E-AUTH-002 | BE26E-GCF21 | Party/compliance scope, provider signature, evidence purpose, domestic policy, and no exact address are enforced |
| BE26E-AUTH-003 | BE26E-GCF22 | Governance scope and one-capability boundary hold; positive result cannot enable public route or substitute persona |
| BE26E-AUTH-004 | All | CORS policy gear-api, CSRF, signed callbacks, redaction, and no direct table/storage/feature grants are enforced |

### Persistence, idempotency, and concurrency tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE26E-DB-001 | All | Forced RLS denies direct access; RPC rechecks target, party, policy, evidence hash, expected version, and launch-disable checks |
| BE26E-DB-002 | BE26E-GCF21 | Determination target/policy uniqueness, evidence append-only behavior, stale invalidation, and provider inbox dedupe hold |
| BE26E-DB-003 | BE26E-GCF22 | Capability/policy uniqueness, independent capability states, false route flag, and gate evidence dedupe hold |
| BE26E-DB-004 | All assigned operations | Every field lists SQL type, nullability, constraints/FKs, indexes, forced RLS, and grants and migration tests cover them |

### Domain, seam, event, and recovery tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE26E-DOM-001 | BE26E-GCF21 | Missing/negative international evidence and non-domestic launch policy fail closed; DDP/DAP labels never open checkout |
| BE26E-DOM-002 | BE26E-GCF22 | Auction, ISO, dealer, rental, consignment, trade-in, layaway, and protection are independently gated and publicly disabled |
| BE26E-DOM-003 | BE26E-GCF21, BE26E-GCF22 | Gate result cannot create order, shipment, payment, settlement, custody, ownership, warranty, or substitute persona |
| BE26E-SEAM-001 | BE26E-GCF21, BE26E-GCF22 | BE-00, customs/tariff/CITES, landed-cost, counsel/rules, feature-admission, BE-25, and BE-26b timeout/retry/circuit behavior is exact |
| BE26E-EVT-001 | BE26E-GCF21, BE26E-GCF22 | Exact event type, redacted payload, outbox atomicity, aggregate/version dedupe, stale invalidation, and consumer refetch are verified |
| BE26E-REC-001 | BE26E-GCF21, BE26E-GCF22 | Lost responses, positive-provider/disabled-policy race, provider outage, duplicate webhook, stale target, deadlock, and poison payloads recover as specified |

## Deepening Passes

| Pass | Question | Resolution |
| --- | --- | --- |
| D1 interaction | Does every assigned IA interaction have one stable route? | Yes: 26.21 and 26.22 map one-to-one to BE26E-GCF21 and BE26E-GCF22 |
| D2 international | Can a provider-positive answer enable a live international sale? | No: launchAdmission is always disabled; customs, landed-cost, counsel, and rules are evidence only |
| D3 delivery terms | Can DDP or DAP be selected as a hidden launch path? | No: both are evaluation labels; no international shipment/payment route exists |
| D4 capability | Can a positive auction result enable ISO/dealer/rental/consignment or another flow? | No: capability keys are independent, policy-versioned, and publicRouteEnabled is always false |
| D5 privacy | Can exact address, legal note, provider secret, or evidence original leak? | No: target hashes, coarse jurisdiction, purpose-bound evidence, redacted events, and scrubbed logs |
| D6 authorization | Are role ownership and 403 versus 404 explicit? | Yes: each operation has target scope, role row, and concealment row; governance/support exceptions are controlled |
| D7 persistence | Are all fields implementable and protected? | Yes: typed/nullability/constraints/FKs/indexes/RLS/grants are listed for every table |
| D8 resilience | Are provider outages and stale policy deterministic? | Yes: exact request/response, timeout, retry/backoff, circuit, pending, inquiry, quarantine, and fail-closed behavior are specified |
| D9 events | Can a missing or stale event enable a gate? | No: consumers refetch target/policy and route guards independently enforce disabled policy |
| D10 boundary | Does this duplicate live commerce, logistics, remedy, custody, or title? | No: endpoint reconciliation and dependency references assign each adjacent authority |

## Ambiguity Gate

PASS. Evidence: 26.21 and 26.22 each map to one authoritative operation and route; InternationalDetermination is owned while OfferThread, Offer, CartIntent, CheckoutGroup, Order, OrderLine, OrderClock, Shipment, FreightQuoteRequest, PackingEvidence, ReturnCase, DamageCase, SettlementRecord, OwnershipTransferIntent, and PickupArrangement are consumed without route duplication; exact strict Zod 4 contracts preserve target/policy/evidence/version bounds and global ApiError { code, message, requestId, details }; every operation has role ownership, 403-vs-404, CORS policy gear-api, idempotency, rate limit, observability, typed persistence/RLS/grants, error rows, and keyed tests; domestic-only launch, CITES/tariff/landed-cost/counsel/rules fail-closed evaluation, DDP/DAP non-selection, independent future capability gates, public route disabled state, exact provider seams, event privacy, stale invalidation, and recovery are resolved. Neighboring interactions 26.01–26.20 are referenced through explicit BE-26a/b/c/d handoffs. No unresolved source conflict remains.

## Open Questions

None.

## Dependency References

- BE-00 platform contracts in 00-infrastructure.md: strict Zod 4, ApiError { code, message, requestId, details }, auth, CORS, idempotency, rate classes, audit/outbox, evidence, feature configuration, and forced RLS.
- BE-23 gear provenance: canonical parties, ownership registry, and provenance facts; this gate never grants identity or title.
- BE-24 gear collections: custody/possession grants; this gate never grants custody.
- BE-25b listing/disclosure lifecycle: immutable ListingVersion and DisclosureVersion target snapshots.
- BE-25c inventory/bulk/channels: MarketplaceUnit, InventoryClaim, and channel facts.
- BE-26a offers/cart/checkout: OfferThread, Offer, CartIntent, CheckoutGroup, and independent order creation boundaries.
- BE-26b logistics/order lifecycle: Order, OrderLine, OrderClock, Shipment, FreightQuoteRequest, PackingEvidence, domestic-only freight, and canonical state/version gates.
- BE-26c remedies/settlement/transfers: ReturnCase, DamageCase, SettlementRecord, OwnershipTransferIntent, money/title ordering, and protected holds.
- BE-26d pickup/service/warranty: PickupArrangement, service/RMA boundaries, and no platform custody/warranty.
- Customs/tariff/CITES, landed-cost, carrier/insurance, counsel/rules, and feature-admission registries are external seams with exact contracts in this companion.

## Changelog

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-08-29 | Initial production-grade BE companion for interactions 26.21–26.22; international fail-closed determination, future capability gates, strict contracts, security, persistence/RLS, eventing, provider resilience, disabled launch policy, and ambiguity evidence added |
