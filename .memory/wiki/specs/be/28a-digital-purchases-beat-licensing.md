# Digital Purchases and Beat Licensing — Backend Specification

## Split Group

Shard 28 digital licensing and commerce, split 28a. This companion owns the product and tier decision snapshot, beat lease vocabulary projection, exclusive purchase saga, and usage evidence for IA interactions 28.01–28.05. It does not own entitlement issuance or delivery enforcement (Shard 27), rights instruments and contributor splits (Shard 10), payment settlement policy, refunds and revocation (28b), transfers and promotions (28c), or contributor accrual (28d).

## Classification

| Capability | Classification | Boundary decision |
|---|---|---|
| 28.01 select perpetual product/tier | Explicit authenticated purchase-selection command | Pin product, holder, price, terms, artifact and version range in DigitalOfferSnapshot; a changed terms version invalidates consent even if a price hold remains. |
| 28.02 select beat lease | Explicit tier-selection command | Expose plain caps, obligations, non-exclusive status and artifact scope from Shard 27; missing or unknown terms fail closed. |
| 28.03 purchase exclusive beat rights | Atomic commerce/right/delist saga | Payment, Shard-10 rights instrument, existing-lease disclosure and product delist commit as one boundary or enter visible compensation; no silent partial completion. |
| 28.04 serve tagged beat preview | Public-safe read with signed preview grant | Every approved public preview carries the audible source tag required by density policy; a forensic watermark is a separate control and paid delivery is not served by this route. |
| 28.05 track lease cap/expiry | Evidence and notification command | tracked, self_reported and unknown are distinct evidence states; this companion never auto-takes down, revokes, or mutates a vendor entitlement. |

BE00 inheritance is mandatory for every operation: authenticated acting context, request ID, strict Zod 4 parsing, idempotency receipts, audit/outbox, CORS, rate limits, forced RLS and ApiError { code, message, requestId, details }. BE00 platform routes are not duplicated. Shard 27 remains authoritative for product, terms, artifact, entitlement and delivery facts.

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Overview, Scope Reconciliation and Commerce Decisions, lines 7–39 | Launch model, perpetual/beat lease scope, explicit non-exclusivity, atomic exclusive sale, notification-only lease evidence and payment boundary. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Interactions, lines 70–78 | Exact 28.01–28.05 preconditions, success outcomes and failure/recovery behavior. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Command Contracts and Cross-Domain Contracts, lines 93–117 | CommitDigitalPurchase, CommitExclusivePurchase, terms/artifact authority, rights transfer and payment ownership. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Data Models and Typed Field Registry, lines 119–143 | DigitalOfferSnapshot, BeatLeaseTier, ExclusivePurchaseSaga, UsageEvidence, typed fields and cardinalities. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Access Control and Accessibility, lines 153–189 | Buyer, holder, vendor, system and support boundaries; safe tier summaries and buyer/vendor privacy. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Event Schemas, lines 190–207 | digital_commerce.purchase_completed.v1, digital_beat.exclusive_committed.v1, digital_lease.usage_changed.v1 payload and privacy rules. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Edge Cases and coverage matrix, lines 209–263 | Tagged-preview, exclusive-race, unmeasurable-cap, deletion, retry, idempotency and projection recovery rules. |
| [IA deep dive 28](../ia/deep-dives/28-digital-licensing-commerce.md) | Purchase and Waiver Flow, lines 12–20 | Version resolution, payment/order sequencing, no delivery before applicable waiver and counsel policy gate. |
| [IA deep dive 28](../ia/deep-dives/28-digital-licensing-commerce.md) | Exclusive Beat Transaction, lines 40–47 | Aggregate locks, prior-lease disclosure, atomic delist/right issuance and durable saga compensation. |
| [IA deep dive 28](../ia/deep-dives/28-digital-licensing-commerce.md) | Digital Commerce States and Access Control, lines 79–100 | Projection state authority, holder/vendor privacy, support recovery and no rights mutation. |
| [BE00](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) | Global contracts, middleware and deterministic protocol rules | Global ApiError, request identity, idempotency, audit/outbox, CORS, CAS and safe error behavior. |
| [IA Shard 27](../ia/27-digital-catalog-delivery.md#contracts) | Product, terms, artifact, entitlement and delivery authority | This companion consumes immutable version facts and never issues or enforces delivery. |
| [IA Shard 10](../ia/10-rights-ownership.md#contracts) | Rights instruments and transfer authority | Exclusive purchase requests a scoped rights instrument; it never authors a parallel rights ledger. |

## IA Source Map

### Assigned interactions

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| 28.01 Select perpetual product/tier | BE28A-DLC01 | Authenticated holder selection snapshots price, terms, artifact and version range; changed terms break consent while preserving a valid price hold. |
| 28.02 Select beat lease | BE28A-DLC02 | Tier response exposes plain caps, obligations, explicit non-exclusive state and delivered artifact scope; unknown terms fail closed. |
| 28.03 Purchase exclusive beat rights | BE28A-DLC03 | Payment, delist, prior-lease facts and Shard-10 rights transfer are committed atomically or compensated with visible state. |
| 28.04 Serve tagged beat preview | BE28A-DLC04 | Public preview grant is signed, scope-bound and audibly tagged; paid master and forensic watermark paths are separate. |
| 28.05 Track lease cap/expiry | BE28A-DLC05 | Append-only tracked/self-reported/unknown evidence and reminders never become takedown, revocation or vendor mutation. |

### Canonical Data Models

| IA model name | Role in this companion | Durable authority or reference |
|---|---|---|
| DigitalOfferSnapshot | Owned immutable buyer/holder decision and price/terms/artifact pin | commerce.digital_offer_snapshots |
| BeatLeaseTier | Owned commerce projection of Shard-27 structured tier terms | commerce.beat_lease_tiers |
| ExclusivePurchaseSaga | Owned transaction coordinator and compensation state | commerce.exclusive_purchase_sagas |
| UsageEvidence | Owned append-only lease metric evidence and notification state | commerce.usage_evidence |

### Event Schemas

| Exact Event Schemas type | Producer operation | Payload authority and privacy rule |
|---|---|---|
| digital_commerce.purchase_completed.v1 | BE28A-DLC01 or BE28A-DLC03 | Order/line, product/tier, holder, pinned versions and money only; no payment secret, licence bytes or buyer free text. |
| digital_beat.exclusive_committed.v1 | BE28A-DLC03 | Beat, order, rights instrument, lease count and delist version; consumers refetch canonical saga state. |
| digital_lease.usage_changed.v1 | BE28A-DLC05 | Entitlement, metric/source/value, prior/new evidence state and version; no automatic enforcement claim. |

## Endpoint Completeness Reconciliation

BE00 owns session/authentication, global errors, idempotency receipts, audit/outbox and CORS. Shard 27 owns product, terms, artifact, entitlement and delivery. Shard 10 owns rights instruments. Payment provider owns capture truth. The five routes below are the only public routes for 28.01–28.05. They do not create a second entitlement, rights ledger, payment ledger, delivery grant or watermark authority.

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| 28.01 | Select perpetual product/tier | BE28A-DLC01 | Snapshot pins price, holder, terms, artifact and version range; stale terms are surfaced before purchase. |
| 28.02 | Select beat lease | BE28A-DLC02 | Tier response carries caps, obligations, non-exclusive flag and artifact scope or typed fail-closed error. |
| 28.03 | Purchase exclusive beat rights | BE28A-DLC03 | Saga records payment, rights, lease disclosure and delist outcomes; compensation is visible if a leg fails. |
| 28.04 | Serve tagged beat preview | BE28A-DLC04 | Signed preview grant references approved tagged rendition and expiry; no paid master bytes. |
| 28.05 | Track lease cap/expiry | BE28A-DLC05 | Append-only evidence and reminder are recorded; no takedown or automatic revocation is possible. |

## API Endpoints

### Umbrella Feature Trace

The IA Shard 28 feature bullets are represented across 28a–28d: 14.05 Beat & Instrumental Licensing; 14.06 Used Licence Transfer & Resale; 14.07 Monetisation Models & Pricing; 14.09 Digital Refunds, Withdrawal & Revocation; 14.10 Contributor Revenue & Per-Download Royalty Pool.

### Authoritative Route Registry

This is the sole route registry for this companion. Every contract, error, authorization, idempotency, rate, observability, middleware and test row keys to exactly one operation ID.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| BE28A-DLC01 | POST | /api/v1/digital/commerce/offers/select | 28.01 | Authenticated buyer or controlled holder; offer and product context must be visible and holder-scoped. | 201 DigitalOfferSnapshotSuccess |
| BE28A-DLC02 | POST | /api/v1/digital/commerce/beat-leases/select | 28.02 | Authenticated buyer or controlled holder; tier must be an active Shard-27 version. | 201 BeatLeaseSelectionSuccess |
| BE28A-DLC03 | POST | /api/v1/digital/commerce/exclusive-purchases | 28.03 | Authenticated buyer/holder plus vendor seller authority; beat and rights aggregate are transaction-scoped. | 202 ExclusivePurchaseSagaSuccess |
| BE28A-DLC04 | GET | /api/v1/digital/commerce/beats/{beatId}/preview | 28.04 | Public published beat projection; private or withdrawn beat is concealed. | 200 TaggedPreviewSuccess |
| BE28A-DLC05 | POST | /api/v1/digital/commerce/lease-usage | 28.05 | Entitlement holder, vendor evidence actor or system collector for the scoped entitlement. | 201 UsageEvidenceSuccess |

### Read cardinality and pagination policy

| Operation ID | Read shape and allowlisted filters | Page size and cursor |
|---|---|---|
| BE28A-DLC04 | Single public preview grant keyed by `beatId`, `previewPolicyVersion`, and `requestedRendition`; no arbitrary query or sort keys | N/A: singular rendition grant, no cursor or page parameter; the response is one bounded `TaggedPreviewSuccess` and paid-master bytes are never a list fallback |

### External Seams

| Seam | Exact request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 acting context and idempotency | {accessToken, actingContextId, operationId, aggregateId, idempotencyKey, requestHash} → {actorId, partyId, roles, receiptId, replay} | 400 ms | No external retry; transaction serialization retries twice at 50 ms and 150 ms. | Open after 5 failures in 30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| Shard 27 product/terms/artifact resolver | {productId, tierId, productVersionId, termsVersionId, artifactVersionId, purpose} → {sellable, termsState, artifactScope, version, policyVersion} | 700 ms | 2 retries at 100 ms and 300 ms for timeout/408/429/5xx; deny is not retried. | Open after 4 failures in 30 s; half-open after 20 s; selection fails closed. |
| Shard 10 rights transfer authority | {beatId, orderId, holderPartyId, expectedRightsVersion, instrumentKind} → {instrumentId, rightsVersion, accepted, priorLeaseCount, conflictClass} | 900 ms | 2 retries at 150 ms and 450 ms with the same saga key; unknown stays pending. | Open after 4 failures in 60 s; half-open after 30 s; saga enters compensation_pending. |
| Payment capture rail | {orderId, amountMinor, currency, instrumentTokenRef, idempotencyKey} → {captureId, state, chargedMinor, currency, providerRequestId} | 2,500 ms | 2 retries at 250 ms and 750 ms only on timeout/408/429; never retry a definitive decline. | Open after 3 failures in 60 s; half-open after 30 s; no entitlement/delist commit while unknown. |
| Tagged preview delivery adapter | {beatId, artifactVersionId, previewPolicyVersion, tagDensity, expiresAt} → {grantId, renditionHash, tagApplied, expiresAt, contentType} | 1,200 ms | 2 retries at 100 ms and 300 ms with same grant key; hash/tag mismatch is terminal. | Open after 5 failures in 60 s; half-open after 20 s; return 503 without untagged fallback. |

## Request/Response Contracts

All request schemas are strict Zod 4. UUIDs are canonical lowercase strings, dates are RFC 3339 UTC strings, money is integer minor units with an ISO-4217 currency, and Idempotency-Key is required on every mutation. Every failure is ErrorResponse containing BE00 ApiError { code, message, requestId, details }.

### Zod 4 Contract Definitions

```typescript
import { z } from "zod";

type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const Id = z.uuid();
const IsoDate = z.iso.datetime({ offset: true });
const Version = z.int().positive();
const Currency = z.string().regex(/^[A-Z]{3}$/);
const Money = z.strictObject({
  minor: z.int().nonnegative(),
  currency: Currency,
}).strict();
const ApiError = z.strictObject({
  code: z.string().regex(/^[A-Z0-9_]{3,80}$/),
  message: z.string().min(1).max(500),
  requestId: Id,
  details: BE00ErrorDetails,
}).strict();
const ErrorResponse = z.strictObject({ error: ApiError }).strict();
const EvidenceSource = z.enum(["tracked", "self_reported", "unknown"]);
const SagaState = z.enum(["pending", "captured", "rights_pending", "delisted", "completed", "compensation_pending", "compensated", "failed"]);

export const Dlc01Request = z.strictObject({
  operationId: z.literal("BE28A-DLC01"),
  productId: Id,
  tierId: Id.nullable(),
  holderPartyId: Id,
  expectedProductVersion: Version,
  expectedTermsVersion: Version,
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
export const Dlc01Success = z.strictObject({
  operationId: z.literal("BE28A-DLC01"),
  snapshotId: Id,
  holderPartyId: Id,
  price: Money,
  termsVersionId: Id,
  artifactVersionId: Id,
  version: Version,
  state: z.enum(["selected", "price_held", "terms_changed", "expired"]),
  expiresAt: IsoDate,
  requestId: Id,
}).strict();

export const Dlc02Request = z.strictObject({
  operationId: z.literal("BE28A-DLC02"),
  productId: Id,
  tierId: Id,
  holderPartyId: Id,
  expectedTierVersion: Version,
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
export const Dlc02Success = z.strictObject({
  operationId: z.literal("BE28A-DLC02"),
  tierId: Id,
  termsVersionId: Id,
  artifactScope: z.array(z.string().trim().min(1).max(120)).min(1).max(100),
  cap: z.strictObject({ value: z.number().positive().nullable(), unit: z.string().trim().max(40).nullable() }).strict(),
  obligations: z.array(z.string().trim().min(1).max(500)).max(100),
  exclusive: z.literal(false),
  version: Version,
  requestId: Id,
}).strict();

export const Dlc03Request = z.strictObject({
  operationId: z.literal("BE28A-DLC03"),
  orderId: Id,
  beatId: Id,
  buyerHolderPartyId: Id,
  exclusiveTermsVersionId: Id,
  expectedRightsVersion: Version,
  expectedCatalogVersion: Version,
  payment: Money,
  priorLeaseDisclosureAccepted: z.literal(true),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
export const Dlc03Success = z.strictObject({
  operationId: z.literal("BE28A-DLC03"),
  sagaId: Id,
  state: SagaState,
  captureState: z.enum(["not_started", "captured", "unknown", "refunded"]),
  rightsInstrumentId: Id.nullable(),
  priorLeaseCount: z.int().nonnegative(),
  delistVersion: Version.nullable(),
  compensationRequired: z.boolean(),
  version: Version,
  requestId: Id,
}).strict();

export const Dlc04Request = z.strictObject({
  operationId: z.literal("BE28A-DLC04"),
  beatId: Id,
  previewPolicyVersion: Version,
  requestedRendition: z.enum(["public_preview"]),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
export const Dlc04Success = z.strictObject({
  operationId: z.literal("BE28A-DLC04"),
  previewGrantId: Id,
  renditionHash: z.string().regex(/^[a-f0-9]{64}$/),
  audibleTagApplied: z.literal(true),
  forensicWatermarkApplied: z.boolean(),
  expiresAt: IsoDate,
  contentType: z.string().regex(/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/),
  requestId: Id,
}).strict();

export const Dlc05Request = z.strictObject({
  operationId: z.literal("BE28A-DLC05"),
  entitlementId: Id,
  metric: z.enum(["plays", "downloads", "uses", "elapsed_seconds"]),
  value: z.number().nonnegative(),
  source: EvidenceSource,
  observedAt: IsoDate,
  sourceVersion: z.string().trim().min(1).max(128),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
export const Dlc05Success = z.strictObject({
  operationId: z.literal("BE28A-DLC05"),
  evidenceId: Id,
  entitlementId: Id,
  source: EvidenceSource,
  state: z.enum(["recorded", "unknown", "duplicate"]),
  reminderAt: IsoDate.nullable(),
  version: Version,
  requestId: Id,
}).strict();
```

### Operation Contract Matrix

| Operation ID | Request contract | Success contract and invariant | Error response |
|---|---|---|---|
| BE28A-DLC01 | Dlc01Request strict body plus Idempotency-Key; product, holder and expected versions required. | Dlc01Success 201; snapshot pins terms/artifact/price and a changed terms version cannot silently consent. | ErrorResponse with ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429 or 503. |
| BE28A-DLC02 | Dlc02Request strict body plus Idempotency-Key; active tier and expected revision required. | Dlc02Success 201; exclusive=false, plain caps/obligations and artifact scope are explicit. | ErrorResponse with BE00 ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429 or 503. |
| BE28A-DLC03 | Dlc03Request strict body plus Idempotency-Key; payment and prior-lease disclosure acceptance required. | Dlc03Success 202; saga state makes each leg and compensation decision visible; no silent partial completion. | ErrorResponse with BE00 ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429, 502 or 503. |
| BE28A-DLC04 | Dlc04Request strict query/body contract; public beat and approved policy required. | Dlc04Success 200; audibleTagApplied=true, separate forensic flag and expiring signed grant. | ErrorResponse with BE00 ApiError { code, message, requestId, details }; 400, 404, 409, 429 or 503. |
| BE28A-DLC05 | Dlc05Request strict body plus Idempotency-Key; source class remains explicit. | Dlc05Success 201; evidence is append-only and reminder-only for caps/expiry. | ErrorResponse with BE00 ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429 or 503. |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| BE28A-DLC01 | Product, tier, terms and artifact versions must be current and sellable; holder authority and currency/price are validated before snapshot. Terms revision conflict returns TERMS_VERSION_STALE; price hold may remain but consent is broken. |
| BE28A-DLC02 | Tier must be active, structured and non-exclusive; cap and obligation vocabulary comes from Shard 27. Unknown or missing terms return LEASE_TERMS_UNAVAILABLE; no guessed cap or artifact scope. |
| BE28A-DLC03 | Payment amount, rights version, catalog version and prior-lease disclosure must match. Any provider unknown or competing exclusive lock stops finalization; no charge without a compensating saga decision. |
| BE28A-DLC04 | Beat must be public and approved; preview rendition hash and audible tag are verified by the adapter. Untagged, withdrawn, private or paid-master rendition is rejected; forensic watermark does not replace audible tag. |
| BE28A-DLC05 | Entitlement scope, metric, nonnegative value, observed time and source class are validated. unknown records uncertainty and schedules notification only; evidence cannot revoke or alter the vendor entitlement. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| BE28A-DLC01 | VALIDATION_FAILED, OFFER_NOT_SELLABLE, TERMS_VERSION_STALE, FORBIDDEN, OFFER_NOT_FOUND, IDEMPOTENCY_KEY_CONFLICT, DEPENDENCY_UNAVAILABLE; hidden offer/product/holder returns 404, visible offer without holder grant returns 403. | Required 24 months; hash covers product/tier, holder, expected versions and policy. Same key replays snapshot; hash mismatch returns 409. | 60 selections per holder per minute, burst 10. | offer_selection_total, stale-terms and replay counters; log requestId, operationId, product/tier hashes, version and result, never buyer identity or private terms. |
| BE28A-DLC02 | VALIDATION_FAILED, LEASE_TERMS_UNAVAILABLE, TIER_VERSION_CONFLICT, FORBIDDEN, TIER_NOT_FOUND, IDEMPOTENCY_KEY_CONFLICT; hidden tier returns 404, visible tier without holder access returns 403. | Required 24 months; hash covers tier, holder and expected revision; replay returns same tier facts. | 60 selections per holder per minute, burst 10. | Tier selection/unknown-terms/version-conflict metrics; structured tier hash, source version and safe verdict only. |
| BE28A-DLC03 | VALIDATION_FAILED, EXCLUSIVE_RACE, PAYMENT_UNKNOWN, RIGHTS_TRANSFER_BLOCKED, FORBIDDEN, ORDER_NOT_FOUND, COMPENSATION_PENDING, DEPENDENCY_UNAVAILABLE; hidden order/beat returns 404, visible order without seller/holder grant returns 403. | Required 7 years; hash covers order, beat, holder, payment and expected versions. Replay returns saga state; mismatch returns 409. | 10 attempts per buyer per 10 minutes, burst 2; vendor saga starts capped at 20 per hour. | Saga leg latency, race, payment-unknown, compensation and completed-event counters; log hashed order/beat, state and leg outcome. |
| BE28A-DLC04 | PREVIEW_NOT_PUBLIC, PREVIEW_POLICY_INVALID, BEAT_NOT_FOUND, PREVIEW_TAG_REQUIRED, PREVIEW_PROVIDER_UNAVAILABLE; hidden beat returns 404 and no public route returns 403 for a concealed beat. | Required 15 minutes by beat/policy/rendition hash; replay returns same grant or typed expiry. | 120 preview grants per IP per minute, 20 per holder, burst 20. | Preview grants, tag mismatch, withdrawn and latency metrics; log beat hash, rendition hash, tag policy and grant expiry, never bytes. |
| BE28A-DLC05 | VALIDATION_FAILED, ENTITLEMENT_NOT_FOUND, USAGE_FORBIDDEN, USAGE_VERSION_CONFLICT, IDEMPOTENCY_KEY_CONFLICT, DEPENDENCY_UNAVAILABLE; hidden entitlement returns 404, visible entitlement without evidence scope returns 403. | Required 24 months; hash covers entitlement, metric, value, observedAt, source and sourceVersion; replay returns evidence. | 600 evidence writes per entitlement per hour, burst 30; system collectors are partition-scoped. | Evidence state, unknown rate, reminder queue, duplicate and latency metrics; log entitlement hash, metric class and source class, no holder identity. |

## Database Schema

### PostgreSQL Model Registry

All tables use protected schemas, enabled and forced RLS, service/RPC writes only, append-only revisions and same-transaction audit/outbox. UUID fields are lower-case uuid; money is integer bigint plus char(3) currency; exact state enums are checked text values.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| DigitalOfferSnapshot | id uuid PK NOT NULL; product_id uuid NOT NULL FK catalog.digital_products(id); tier_id uuid NULL FK catalog.digital_tiers(id); vendor_party_id uuid NOT NULL FK identity.parties(id); holder_party_id uuid NOT NULL FK identity.parties(id); price_minor bigint NOT NULL CHECK price_minor>=0; currency char(3) NOT NULL CHECK currency~'^[A-Z]{3}$'; terms_version_id uuid NOT NULL FK catalog.terms_versions(id); artifact_version_id uuid NOT NULL FK catalog.artifact_versions(id); product_version bigint NOT NULL CHECK product_version>0; policy_version text NOT NULL CHECK length(policy_version) between 1 and 128; state text NOT NULL CHECK state in ('selected','price_held','terms_changed','expired','purchased'); expires_at timestamptz NOT NULL; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; unique (holder_party_id,product_id,version) | holder_party_id,state,updated_at desc; product_id,terms_version_id; vendor_party_id,state; expires_at,state | Holder reads own snapshot; vendor reads own safe offer facts; service validates catalog authority; no direct client grant, delete or update. |
| BeatLeaseTier | id uuid PK NOT NULL; product_id uuid NOT NULL FK catalog.digital_products(id); terms_version_id uuid NOT NULL FK catalog.terms_versions(id); artifact_scope jsonb NOT NULL CHECK jsonb_typeof(artifact_scope)='array'; vendor_party_id uuid NOT NULL FK identity.parties(id); price_minor bigint NOT NULL CHECK price_minor>=0; currency char(3) NOT NULL; cap_value numeric(12,4) NULL CHECK cap_value>0; cap_unit text NULL CHECK cap_unit is null or length(cap_unit) between 1 and 40; obligations jsonb NOT NULL; exclusive boolean NOT NULL DEFAULT false CHECK exclusive=false; state text NOT NULL CHECK state in ('active','retired','unknown_terms'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; unique (product_id,terms_version_id,version) | product_id,state; terms_version_id; vendor_party_id,state; state,updated_at desc | System/RPC projection writes; buyer reads active public tier fields; vendor reads own projection; forced RLS, no direct table write. |
| ExclusivePurchaseSaga | id uuid PK NOT NULL; order_id uuid NOT NULL FK commerce.orders(id); beat_id uuid NOT NULL FK catalog.digital_products(id); buyer_holder_party_id uuid NOT NULL FK identity.parties(id); seller_party_id uuid NOT NULL FK identity.parties(id); rights_instrument_id uuid NULL FK rights.instruments(id); payment_capture_id uuid NULL FK payments.captures(id); prior_lease_count integer NOT NULL CHECK prior_lease_count>=0; expected_rights_version bigint NOT NULL CHECK expected_rights_version>0; expected_catalog_version bigint NOT NULL CHECK expected_catalog_version>0; delist_version bigint NULL CHECK delist_version>0; state text NOT NULL CHECK state in ('pending','captured','rights_pending','delisted','completed','compensation_pending','compensated','failed'); capture_state text NOT NULL CHECK capture_state in ('not_started','captured','unknown','refunded'); compensation_state text NOT NULL CHECK compensation_state in ('not_required','pending','completed','failed'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; unique (order_id) | beat_id,state,updated_at desc; buyer_holder_party_id,created_at desc; seller_party_id,created_at desc; state,updated_at | Buyer/holder sees own saga; seller sees scoped prior-lease and state, never buyer identity beyond authorized order; finance sees payment leg; forced RLS and append-only transitions. |
| UsageEvidence | id uuid PK NOT NULL; entitlement_id uuid NOT NULL FK catalog.entitlements(id); metric text NOT NULL CHECK metric in ('plays','downloads','uses','elapsed_seconds'); value numeric(20,6) NOT NULL CHECK value>=0; source_class text NOT NULL CHECK source_class in ('tracked','self_reported','unknown'); observed_at timestamptz NOT NULL; source_version text NOT NULL CHECK length(source_version) between 1 and 128; state text NOT NULL CHECK state in ('recorded','unknown','duplicate'); reminder_at timestamptz NULL; version bigint NOT NULL CHECK version>0; created_by uuid NOT NULL FK identity.parties(id); created_at timestamptz NOT NULL; unique (entitlement_id,metric,observed_at,source_version) | entitlement_id,observed_at desc; source_class,observed_at desc; state,reminder_at; created_by,created_at desc | Holder and vendor read purpose-limited evidence; system writes collector facts; vendor cannot use it to revoke; no direct client update/delete, forced RLS. |

### State, Concurrency and Transaction Rules

- DigitalOfferSnapshot follows selected → price_held → purchased or terms_changed/expired. Product, terms, artifact and price are resolved in one snapshot; a changed terms version invalidates consent without erasing the price hold record.
- BeatLeaseTier is a Shard-27 terms projection. Unknown/missing terms remain unknown_terms; no inferred cap, obligation, exclusivity or artifact scope is allowed.
- ExclusivePurchaseSaga locks the beat aggregate, order, rights version and catalog version. The payment, rights, prior-lease disclosure, delist and exclusive entitlement handoff either commit in the admitted boundary or enter compensation_pending; a provider-unknown result is never reported completed.
- The same idempotency key and request hash return the original response. Serialization/deadlock conflicts retry twice at 50/150 ms; a third conflict returns 409 without a partial write. Audit and outbox records commit with the canonical state.
- UsageEvidence is append-only and deduped by entitlement, metric, observed time and source version. Evidence states are notification data only; no worker calls revocation, delist or vendor mutation from a cap/expiry observation.
- Worker crash after one provider effect is recovered from the saga step receipt. Reconciliation either confirms the same provider idempotency key or records compensation_pending; no blind second charge, rights grant or delist.

### Grants, RLS and Retention

- authenticated and anon roles have no direct table grants. Security-invoker RPCs recheck acting party, holder/vendor role, aggregate ownership, expected versions and state transitions.
- Buyer/holder projections omit vendor private evidence and provider identifiers. Vendor projections omit buyer identity and refund/case narrative; public preview grants contain only rendition hash, tag policy and expiry.
- Offer, tier, saga, usage, audit and outbox evidence is retained for the applicable commerce/legal retention period. Non-empty order/saga and earning usage records are tombstoned rather than deleted; derived grants expire.
- Support may replay a mechanical provider reconciliation only with an expiring purpose grant and immutable reason. Support cannot alter terms, rights, payment outcome, tag policy or usage enforcement.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed roles | Ownership and object scope | 403 versus 404 |
|---|---|---|---|
| BE28A-DLC01 | Buyer or holder party controller; support case-bound recovery | Holder controls the selected snapshot; product/tier must be visible and sellable in current catalog version. | Hidden product/tier or holder context returns 404 OFFER_NOT_FOUND; visible offer without holder grant returns 403 OFFER_FORBIDDEN. |
| BE28A-DLC02 | Buyer or holder party controller; support case-bound | Holder may select only a visible active tier; vendor role is not buyer authority. | Hidden tier/product returns 404 TIER_NOT_FOUND; visible tier with no holder grant returns 403 TIER_FORBIDDEN. |
| BE28A-DLC03 | Buyer/holder controller plus vendor seller authority and system saga worker | Buyer controls order/holder; seller controls contributed beat; worker may progress only the same saga step. | Hidden order/beat returns 404 ORDER_NOT_FOUND; visible object without buyer/seller grant returns 403 EXCLUSIVE_PURCHASE_FORBIDDEN. |
| BE28A-DLC04 | Public read; system preview worker | Only published public beat projection and approved preview rendition are addressable. | Private/withdrawn beat returns 404 BEAT_NOT_FOUND; no existence-bearing authorization response is emitted. |
| BE28A-DLC05 | Holder, vendor evidence actor, or system collector | Evidence must be scoped to an entitlement and source authority; vendor cannot change entitlement. | Hidden entitlement returns 404 ENTITLEMENT_NOT_FOUND; visible entitlement without evidence grant returns 403 USAGE_FORBIDDEN. |

### Per-Operation Middleware Registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
|---|---|---|---|
| BE28A-DLC01 | requestId → strictCors → auth → holder context → rate limit → idempotency → strict body validation → catalog version gate → handler/audit/outbox | CORS policy digital-commerce: explicit web/PWA origins; no wildcard credentials; Vary: Origin | CSRF, 128 KiB body, safe text, UUID/version bounds, BE00 ApiError { code, message, requestId, details }, no buyer identity in logs. |
| BE28A-DLC02 | requestId → strictCors → auth → holder context → rate limit → idempotency → strict body validation → Shard-27 terms gate → handler/audit | CORS policy digital-commerce: explicit web/PWA origins; no wildcard credentials; Vary: Origin | 128 KiB body, tier allowlist, unknown terms fail closed, no exclusive flag override, BE00 ApiError { code, message, requestId, details }. |
| BE28A-DLC03 | requestId → strictCors → auth → buyer/seller context → rate limit → idempotency → strict body validation → aggregate locks → payment/rights saga → audit/outbox | CORS policy digital-commerce: explicit web/PWA origins; no wildcard credentials; Vary: Origin | CSRF, 256 KiB body, payment token reference only, no raw provider secret, prior-lease disclosure required, BE00 ApiError { code, message, requestId, details }. |
| BE28A-DLC04 | requestId → strictCors → public auth context → preview policy gate → rate limit → strict query validation → tagged-rendition adapter → safe response headers | CORS policy digital-commerce-public: explicit public origins; no credential wildcard; Vary: Origin | Range limits, content disposition, tag/hash verification, no master bytes, no private metadata, BE00 ApiError { code, message, requestId, details } for failures. |
| BE28A-DLC05 | requestId → strictCors → auth → entitlement/evidence context → rate limit → idempotency → strict body validation → source policy gate → handler/audit | CORS policy digital-commerce: explicit web/PWA origins; no wildcard credentials; Vary: Origin | 128 KiB body, metric bounds, source allowlist, no automatic enforcement callback, BE00 ApiError { code, message, requestId, details }. |

### Security and Privacy Controls

All routes apply secure headers, CSRF protection for credentialed browser mutations, content-type and body-size limits, request-scoped tracing and redacted structured logging. Payment instrument data is tokenized and server-side only. Preview responses use short-lived signed grants and cannot reveal private artifact paths. Vendor views expose aggregate/safe lease facts, never buyer identity. A stale cache may show freshness age but never upgrades unknown terms or evidence to a positive verdict.

## Data Flow

1. BE28A-DLC01 and BE28A-DLC02 resolve Shard-27 versions, validate holder authority, write an immutable snapshot or tier projection, and return a pinned decision. No delivery grant is issued here.
2. BE28A-DLC03 creates a saga, locks the order/beat/rights aggregates, captures payment with the same idempotency key, requests the Shard-10 instrument, preserves prior lease disclosure, and commits or compensates delist and exclusive state.
3. BE28A-DLC04 reads only the public approved rendition, obtains a tagged grant from the delivery adapter, and returns the safe grant metadata. Paid master delivery remains Shard 27 and is not reachable through this route.
4. BE28A-DLC05 appends evidence and queues reminders. The evidence event is consumed by reporting and holder projections; it cannot invoke revocation, takedown or vendor mutation.

## Events and Consumer Contracts

| Event type | Producer operation | Required envelope and payload | Consumer behavior |
|---|---|---|---|
| digital_commerce.purchase_completed.v1 | BE28A-DLC01 after purchase commit or BE28A-DLC03 after completed saga | {eventId, aggregateId, aggregateVersion, occurredAt, requestId, orderId, lineId, productId, tierId, holderPartyId, pinnedVersionIds, amountMinor, currency} | Shard 27 creates/updates entitlement from pinned facts; revenue consumes money; consumers refetch on duplicate. |
| digital_beat.exclusive_committed.v1 | BE28A-DLC03 | {eventId, aggregateId, aggregateVersion, occurredAt, requestId, beatId, orderId, rightsInstrumentId, priorLeaseCount, delistVersion} | Catalog and rights projections update; notifications disclose preserved prior leases; no private buyer data. |
| digital_lease.usage_changed.v1 | BE28A-DLC05 | {eventId, aggregateId, aggregateVersion, occurredAt, requestId, entitlementId, metric, sourceClass, value, priorState, newState, version} | Holder/vendor reports and reminders update; consumers never infer automatic revocation. |

Events contain IDs, versions, hashes and money only. Transactional outbox records are deduped by event ID and aggregate version. A missing event causes consumer refetch; it never changes this companion's canonical state.

## Error Handling and Failure Recovery

| Operation ID | Condition | HTTP | Error code | Recovery |
|---|---|---:|---|---|
| BE28A-DLC01 | Hidden product/tier/holder | 404 | OFFER_NOT_FOUND | Do not reveal existence; refresh public catalog. |
| BE28A-DLC01 | Terms changed after price hold | 409 | TERMS_VERSION_STALE | Show changed terms and require a new snapshot; preserve price evidence. |
| BE28A-DLC02 | Missing or unknown tier terms | 422 | LEASE_TERMS_UNAVAILABLE | Fail closed; vendor must publish a structured successor tier. |
| BE28A-DLC03 | Competing exclusive lock | 409 | EXCLUSIVE_RACE | Serialize one winner; losing checkout is not charged and receives a typed outcome. |
| BE28A-DLC03 | Payment or rights provider unknown | 503 | PAYMENT_UNKNOWN or RIGHTS_TRANSFER_BLOCKED | Keep saga pending/compensation state; reconcile with same key, never report completion. |
| BE28A-DLC04 | Untagged or wrong rendition | 422 | PREVIEW_TAG_REQUIRED | Reject adapter result; no untagged fallback or master delivery. |
| BE28A-DLC05 | Cap cannot be measured | 201 | USAGE_UNKNOWN | Record unknown, notify, and perform no takedown/revocation. |
| All | Idempotency hash mismatch | 409 | IDEMPOTENCY_KEY_CONFLICT | Use original key/result or a new key after intent changes. |
| All | Rate or dependency circuit open | 429 or 503 | RATE_LIMITED or DEPENDENCY_UNAVAILABLE | Honor Retry-After/backoff; no partial mutation. |

## Verification and Test Strategy

### Operation Test Matrix

| Test ID | Operation ID | Acceptance assertion |
|---|---|---|
| BE28A-CON-001 | BE28A-DLC01 | Strict request/success/error schemas pin holder, price, terms, artifact, version and terms-change behavior. |
| BE28A-CON-002 | BE28A-DLC02 | Active structured tier, caps, obligations, explicit non-exclusive flag and unknown fail-closed state are exact. |
| BE28A-CON-003 | BE28A-DLC03 | Exclusive saga schema exposes every leg, prior leases, provider unknown and compensation state without silent completion. |
| BE28A-CON-004 | BE28A-DLC04 | Preview grant has audible tag true, rendition hash and expiry; paid master and forensic controls remain separate. |
| BE28A-CON-005 | BE28A-DLC05 | Evidence source classes, metric bounds, reminder behavior and append-only response are exact. |
| BE28A-ROUTE-001 | BE28A-DLC01 through BE28A-DLC05 | Method/path/operation registry is authoritative; aliases cannot bypass middleware. |
| BE28A-AUTH-001 | BE28A-DLC01 through BE28A-DLC05 | Hidden objects return 404, visible objects without grant return 403, and projections redact private identity/evidence. |
| BE28A-MW-001 | BE28A-DLC01 through BE28A-DLC05 | CORS policy, CSRF, request IDs, rate limits, validation, BE00 ApiError and safe headers run in order. |
| BE28A-DB-001 | BE28A-DLC01 through BE28A-DLC05 | Typed fields, constraints, indexes, forced RLS, grants and append-only audit/outbox are migration-tested. |
| BE28A-RACE-001 | BE28A-DLC03 | Exclusive race, provider unknown, worker crash and compensation retry preserve one charge/right/delist result. |
| BE28A-RACE-002 | BE28A-DLC01, BE28A-DLC02, BE28A-DLC05 | Expected-version conflicts and duplicate evidence serialize and replay without duplicate effects. |
| BE28A-EVT-001 | BE28A-DLC01 through BE28A-DLC05 | Exact IA event names, payload redaction, outbox dedupe and consumer refetch are verified. |

### Test Levels and Acceptance Gates

- Contract tests parse every strict request, success and ErrorResponse; unknown keys, malformed UUIDs, stale versions and unsafe text fail before mutation.
- Route tests assert each registered method/path, CORS policy, auth chain, rate class, idempotency receipt and BE00 error envelope.
- Database tests exercise foreign keys, check constraints, unique keys, forced RLS, no direct client grants, tombstones and audit/outbox atomicity.
- Property tests generate competing exclusive checkouts to verify one winner, no double charge and deterministic replay.
- Integration tests simulate Shard 27 terms drift, Shard 10 rights denial, payment timeout, tagged adapter mismatch, queue retry and consumer event loss.
- Privacy tests verify buyer identity, payment secrets, private terms and artifact bytes never appear in vendor/public responses, logs or events.

## Deepening Passes and Ambiguity Gate

### Micro Pass

| Question | Resolution |
|---|---|
| Can a price hold consent to changed terms? | No. DigitalOfferSnapshot records the held price, but a new terms version requires a new affirmative decision. |
| Can an unknown cap cause takedown? | No. UsageEvidence records unknown and queues notification only. |
| Can an exclusive purchase silently revoke prior leases? | No. Prior lease count and scope are disclosed and preserved; any failure enters compensation. |
| Can a preview route return an untagged rendition? | No. Adapter hash/tag verification rejects it; forensic watermark is not an audible source tag. |
| Can the vendor see buyer identity through usage evidence? | No. Vendor projection is purpose-limited and aggregate where possible. |

### Macro Pass

| Boundary question | Resolution |
|---|---|
| Does this companion issue entitlements or deliver bytes? | No. Shard 27 owns entitlement/delivery; this companion emits pinned commerce facts. |
| Does exclusive purchase create a second rights ledger? | No. Shard 10 owns rights instruments; the saga stores only references and step evidence. |
| Does lease monitoring enforce legal caps? | No. It is tracked/self-reported/unknown evidence and notification only. |
| Are provider retries allowed to create duplicate money or rights? | No. Provider idempotency and saga step receipts make retries safe; unknown stays pending. |
| Is the public preview a source-of-truth artifact? | No. It is a short-lived projection over an approved rendition and policy version. |

## Ambiguity Gate

PASS. Evidence: interactions 28.01–28.05 each map one-to-one to BE28A-DLC01–DLC05 and the five unique routes; DigitalOfferSnapshot, BeatLeaseTier, ExclusivePurchaseSaga and UsageEvidence are explicitly owned; the exact digital_commerce.purchase_completed.v1, digital_beat.exclusive_committed.v1 and digital_lease.usage_changed.v1 events are inventoried; strict Zod 4 request/success/error contracts, BE00 ApiError { code, message, requestId, details }, authorization and 403-vs-404, idempotency, rate, observability, CORS, typed persistence/RLS/grants, state/recovery rules and keyed tests exist for every operation. Shard 27, Shard 10 and payment authority boundaries are explicit. No unresolved source conflict remains.

## Open Questions

None.

## Dependency References

- [BE00 platform contracts](00-infrastructure.md#requestresponse-contracts-zod-4-schemas): request identity, strict Zod 4, ApiError, auth, CORS, idempotency, rate, audit/outbox and forced RLS.
- [IA Shard 27 contracts](../ia/27-digital-catalog-delivery.md#contracts): product, tier, terms, artifact, entitlement and delivery authority consumed here.
- [IA Shard 10 contracts](../ia/10-rights-ownership.md#contracts): exclusive rights instrument and prior-lease truth; this companion never authors split percentages or title.
- [IA Shard 06 contracts](../ia/06-trust-safety.md#contracts): fraud/dispute gates may block a saga; no safety verdict is inferred here.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-08-28 | Initial production-grade companion for IA interactions 28.01–28.05; pinned digital offer/tier decisions, exclusive saga, tagged preview, usage evidence, contracts, security, persistence, recovery and ambiguity evidence added. |
