# Digital Transfers, Promotions and Upgrades — Backend Specification

## Split Group

Shard 28 digital licensing and commerce, split 28c. This companion owns used-licence transfer evaluation, bundled-software transfer sequencing, promotion/bundle allocation and ownership adjustment, and upgrade/crossgrade application for IA interactions 28.12–28.15. It does not own product/entitlement truth (Shard 27), rights/split authority (Shard 10), physical order inspection authority, payment capture, contributor accounting (28d), or the Shard 18 rounding implementation.

## Classification

| Capability | Classification | Boundary decision |
|---|---|---|
| 28.12 evaluate used-licence transfer | Disabled capability and policy-evaluation command | Used transfers remain unavailable at launch pending territorial exhaustion law, vendor API deactivation and atomic proof. Unknown policy/law/provider state fails closed and refunds escrow. |
| 28.13 transfer bundled software | Inspection-gated transfer saga | The licence leg settles separately only after the physical inspection window closes and buyer vendor-account eligibility passes; a pre-settlement hardware return leaves the licence with the seller. |
| 28.14 create promotion/bundle | Immutable allocation and ownership-quote command | Every exact member must have a positive independently executable standalone-selling-price version in one settlement currency. Compute B × s_i / Σs and invoke Shard 18 largest remainder once on stable bundle_member_id keys; ownership deducts frozen shares and never re-apportions. |
| 28.15 apply upgrade/crossgrade | Entitlement-extension command | A valid base entitlement extends its version range in place with pinned price/evidence; unverifiable external ownership receives full price and never an honor-system discount. |

BE00 inheritance is mandatory for every operation: authenticated acting context, request ID, strict Zod 4 parsing, idempotency receipts, audit/outbox, CORS, rate limits, forced RLS and ApiError { code, message, requestId, details }. Shard 27 remains authoritative for product, terms, entitlement and delivery. This companion consumes Shard 18 RoundPayableAggregate and never implements a second rounding policy.

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Overview, Scope Reconciliation and Commerce Decisions, lines 7–39 | Used-transfer launch exclusion, hardware settlement gate, promotion basis/vector/ownership rules and upgrade price evidence. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Interactions, lines 85–89 | Exact 28.12–28.15 preconditions, success outcomes and failure/recovery behavior. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Command Contracts and Cross-Domain Contracts, lines 95–117 | ExecuteLicenceTransfer, SavePromotion, QuotePromotionForHolder, product/terms/entitlement authority and Shard 18 rounding ownership. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Data Models and Typed Field Registry, lines 119–149 | TransferPolicyDecision, PromotionAllocation, PromotionPriceQuote and exact SSP/member/quote fields. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Access Control and Accessibility, lines 153–189 | Holder/vendor policy roles, multi-vendor acceptance, ownership privacy and explainable price/quote output. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Event Schemas, lines 190–207 | digital_transfer.completed.v1 and digital_promotion.changed.v1 payload and privacy rules. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Edge Cases and coverage matrix, lines 209–263 | Ownership adjustment, missing SSP, stale promotion, all-owned bundle, hardware return and indivisible minor-unit rules. |
| [IA deep dive 28](../ia/deep-dives/28-digital-licensing-commerce.md) | Bundle Allocation and Ownership Adjustment, lines 21–29 | Positive same-currency SSP admission, raw proportional shares, one Shard 18 pass, vendor acceptance, ownership recheck and evidence pinning. |
| [IA deep dive 28](../ia/deep-dives/28-digital-licensing-commerce.md) | Exclusive Beat Transaction and Digital Commerce States, lines 40–84 | Transfer/entitlement state boundaries and canonical ownership of entitlement history. |
| [IA deep dive 28](../ia/deep-dives/28-digital-licensing-commerce.md) | Race Resolution, lines 110–122 | Price/terms, transfer/inspection, ownership/quote and provider race behavior. |
| [BE00](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) | Global contracts, middleware and deterministic protocol rules | Global ApiError, request identity, idempotency, audit/outbox, CORS, CAS and safe error behavior. |
| [IA Shard 27](../ia/27-digital-catalog-delivery.md#contracts) | Product, terms, entitlement and artifact authority | Transfer and upgrade commands consume current entitlement/terms facts and never issue parallel entitlements. |
| [IA Shard 18](../ia/18-royalty-accounting.md#contracts) | RoundPayableAggregate and cent remainder authority | One immutable largest-remainder pass at promotion admission; no second rounding direction or residue sink. |
| [IA Shard 10](../ia/10-rights-ownership.md#contracts) | Rights/split and clearance authority | Transfers reference rights evidence and contributor use but do not rewrite ledgers. |

## IA Source Map

### Assigned interactions

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| 28.12 Evaluate used-licence transfer | BE28C-DLC01 | Future gate, territory/vendor policy, legal/provider versions and current entitlement are evaluated; disabled/unknown fails closed and refunds escrow. |
| 28.13 Transfer bundled software | BE28C-DLC02 | Physical inspection and buyer vendor-account eligibility precede separate licence transfer; pre-settlement hardware return leaves seller licence. |
| 28.14 Create promotion/bundle | BE28C-DLC03 | Immutable same-currency positive SSP vector, one Shard 18 remainder pass, vendor acceptance, ownership-adjusted quote and evidence pins are enforced. |
| 28.15 Apply upgrade/crossgrade | BE28C-DLC04 | Valid base entitlement extends its range with pinned price/evidence; unknown ownership shows full price and no discount assumption. |

### Canonical Data Models

| IA model name | Role in this companion | Durable authority or reference |
|---|---|---|
| TransferPolicyDecision | Owned policy/law/provider evaluation and gate result | commerce.transfer_policy_decisions |
| PromotionAllocation | Owned immutable full-vector SSP allocation and vendor-acceptance evidence | commerce.promotion_allocations plus promotion_allocation_members |
| PromotionPriceQuote | Owned holder-specific ownership deduction and payable quote | commerce.promotion_price_quotes |

### Event Schemas

| Exact Event Schemas type | Producer operation | Payload authority and privacy rule |
|---|---|---|
| digital_transfer.completed.v1 | BE28C-DLC01 when enabled or BE28C-DLC02 after inspection gate | Entitlement, prior/new holder, policy/territory/provider and settlement facts; no buyer identity beyond consumer scope. |
| digital_promotion.changed.v1 | BE28C-DLC03 | Promotion, basis kind, settlement currency, allocation hash, member/listing/SSP versions, allocated values, vendor acceptance, window and version; no private ownership details. |

## Endpoint Completeness Reconciliation

BE00 owns auth, global errors, idempotency, audit/outbox and CORS. Shard 27 owns current catalog/terms/entitlement/artifact facts. Shard 18 owns exact rounding. Physical inspection and vendor account providers own their evidence. The four routes below are the only public routes for 28.12–28.15; no route creates a second entitlement, rights ledger or cent policy.

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| 28.12 | Evaluate used-licence transfer | BE28C-DLC01 | Policy decision records launch gate, territory/law/provider versions and escrow result; no holder change while disabled/unknown. |
| 28.13 | Transfer bundled software | BE28C-DLC02 | Inspection closure and buyer eligibility are pinned before separate licence transfer and settlement. |
| 28.14 | Create promotion/bundle | BE28C-DLC03 | Full SSP allocation hash/vector, vendor acceptances, ownership quote and successor-version behavior are persisted. |
| 28.15 | Apply upgrade/crossgrade | BE28C-DLC04 | Base entitlement version range extension and price/evidence pin are persisted; no honor discount on unknown ownership. |

## API Endpoints

### Authoritative Route Registry

This is the sole route registry for this companion. Every contract, error, authorization, idempotency, rate, observability, middleware and test row keys to exactly one operation ID.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| BE28C-DLC01 | POST | /api/v1/digital/commerce/transfers/evaluate | 28.12 | Current entitlement holder and vendor policy actor; capability gate is server-controlled. | 200 TransferPolicyDecisionSuccess |
| BE28C-DLC02 | POST | /api/v1/digital/commerce/transfers/bundled-software | 28.13 | Seller controls licence/order; buyer controls destination vendor account; inspection worker supplies closure. | 202 BundledSoftwareTransferSuccess |
| BE28C-DLC03 | POST | /api/v1/digital/commerce/promotions | 28.14 | Each contributing vendor controls its member listing and must accept the exact frozen allocation; holder ownership snapshot is purpose-bound. | 201 PromotionAllocationSuccess |
| BE28C-DLC04 | POST | /api/v1/digital/commerce/entitlements/{entitlementId}/upgrades | 28.15 | Holder controls base entitlement; vendor controls upgrade terms; system verifies current entitlement/evidence. | 200 UpgradeSuccess |

### External Seams

| Seam | Exact request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 acting context and idempotency | {accessToken, actingContextId, operationId, aggregateId, idempotencyKey, requestHash} → {actorId, partyId, roles, receiptId, replay} | 400 ms | No external retry; transaction serialization retries twice at 50 ms and 150 ms. | Open after 5 failures in 30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| Shard 27 entitlement/catalog resolver | {productId, entitlementId, termsVersionId, artifactVersionId, expectedVersion, purpose} → {state, holderPartyId, termsState, artifactScope, version} | 700 ms | 2 retries at 100 ms and 300 ms for timeout/408/429/5xx; deny is not retried. | Open after 4 failures in 60 s; half-open after 30 s; transfer/upgrade fails closed. |
| Transfer policy/provider adapter | {entitlementId, territory, vendorPolicyVersion, legalVersion, providerVersion, operationId} → {enabled, result, deactivationProof, escrowAction, decisionVersion} | 1,200 ms | 2 retries at 200 ms and 600 ms on timeout/408/429; unknown remains blocked. | Open after 4 failures in 60 s; half-open after 30 s; no holder mutation while open. |
| Physical inspection and vendor-account adapter | {orderId, inspectionWindowId, buyerVendorAccountRef, eligibilityVersion, expectedSettlementState} → {inspectionClosed, returned, accountEligible, evidenceHash, observedAt} | 1,500 ms | 2 retries at 250 ms and 750 ms on timeout/408/429/5xx; contradictory evidence is terminal review. | Open after 4 failures in 60 s; half-open after 30 s; licence remains seller-held. |
| Shard 18 RoundPayableAggregate | {aggregateId, currency, totalMinor, rows:[{bundleMemberId, rawNumerator, rawDenominator}], tieKeyRule:'bundle_member_id'} → {allocatedMinorByRow, residueMinor, roundingVersion, allocationHash} | 1,000 ms | 2 retries at 150 ms and 450 ms with same aggregate key; no local fallback. | Open after 3 failures in 60 s; half-open after 30 s; promotion admission remains blocked. |
| Ownership snapshot resolver | {holderPartyId, memberProductIds, expectedSnapshotVersion, purpose} → {ownedMemberIds, unownedMemberIds, snapshotId, snapshotVersion, freshness} | 500 ms | 2 retries at 75 ms and 225 ms on timeout/408/429; unknown holds cart. | Open after 4 failures in 30 s; half-open after 15 s; no unowned assumption. |

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
const Money = z.strictObject({ minor: z.int().nonnegative(), currency: Currency }).strict();
const ApiError = z.strictObject({
  code: z.string().regex(/^[A-Z0-9_]{3,80}$/),
  message: z.string().min(1).max(500),
  requestId: Id,
  details: BE00ErrorDetails,
}).strict();
const ErrorResponse = z.strictObject({ error: ApiError }).strict();
const TransferResult = z.enum(["disabled", "eligible", "blocked", "unknown"]);
const PromotionState = z.enum(["draft", "accepted", "active", "retired", "stale"]);

export const DlcC01Request = z.strictObject({
  operationId: z.literal("BE28C-DLC01"),
  entitlementId: Id,
  currentHolderPartyId: Id,
  territory: z.string().trim().min(2).max(64),
  vendorPolicyVersion: z.string().trim().min(1).max(128),
  legalVersion: z.string().trim().min(1).max(128),
  providerVersion: z.string().trim().min(1).max(128),
  escrowRef: Id.nullable(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
export const DlcC01Success = z.strictObject({
  operationId: z.literal("BE28C-DLC01"),
  decisionId: Id,
  result: TransferResult,
  capabilityEnabled: z.literal(false),
  escrowAction: z.enum(["held", "refunded", "not_applicable"]),
  reasonCode: z.string().regex(/^[A-Z0-9_]{3,80}$/),
  version: Version,
  requestId: Id,
}).strict();

export const DlcC02Request = z.strictObject({
  operationId: z.literal("BE28C-DLC02"),
  entitlementId: Id,
  orderId: Id,
  sellerPartyId: Id,
  buyerPartyId: Id,
  buyerVendorAccountRef: z.string().trim().min(1).max(160),
  inspectionWindowId: Id,
  expectedSettlementVersion: Version,
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
export const DlcC02Success = z.strictObject({
  operationId: z.literal("BE28C-DLC02"),
  transferId: Id,
  state: z.enum(["inspection_pending", "eligible_pending", "completed", "seller_retained", "manual_review"]),
  inspectionClosed: z.boolean(),
  accountEligible: z.boolean(),
  newHolderPartyId: Id.nullable(),
  providerRef: Id.nullable(),
  version: Version,
  requestId: Id,
}).strict();

const PromotionMember = z.strictObject({
  bundleMemberId: Id,
  productId: Id,
  listingVersionId: Id,
  standalonePriceVersionId: Id,
  vendorPartyId: Id,
  ssp: Money,
}).strict();
export const DlcC03Request = z.strictObject({
  operationId: z.literal("BE28C-DLC03"),
  promotionId: Id,
  settlementCurrency: Currency,
  fullBundleConsideration: Money,
  members: z.array(PromotionMember).min(1).max(100),
  effectiveFrom: IsoDate,
  effectiveTo: IsoDate,
  expectedPromotionVersion: Version,
  holderPartyId: Id.nullable(),
  ownershipSnapshotId: Id.nullable(),
  ownershipSnapshotVersion: Version.nullable(),
  vendorAcceptanceRefs: z.array(Id).max(100),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict().superRefine((v, ctx) => {
  if ((v.holderPartyId === null) !== (v.ownershipSnapshotId === null)) {
    ctx.addIssue({ code: "custom", message: "holder and ownership snapshot must be supplied together" });
  }
});
export const DlcC03Success = z.strictObject({
  operationId: z.literal("BE28C-DLC03"),
  allocationId: Id,
  promotionId: Id,
  basisKind: z.literal("standalone_selling_price"),
  allocationHash: z.string().regex(/^[a-f0-9]{64}$/),
  state: PromotionState,
  quoteId: Id.nullable(),
  allocatedTotalMinor: z.int().nonnegative(),
  settlementCurrency: Currency,
  version: Version,
  requestId: Id,
}).strict();

export const DlcC04Request = z.strictObject({
  operationId: z.literal("BE28C-DLC04"),
  entitlementId: Id,
  baseEntitlementVersion: Version,
  upgradeProductId: Id,
  upgradeTermsVersionId: Id,
  price: Money,
  ownershipProofRef: Id.nullable(),
  expectedProductVersion: Version,
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
export const DlcC04Success = z.strictObject({
  operationId: z.literal("BE28C-DLC04"),
  entitlementId: Id,
  state: z.enum(["extended", "crossgraded", "full_price_required", "blocked"]),
  newVersionRange: z.string().trim().min(1).max(180),
  priceBasisRef: Id,
  evidencePinned: z.literal(true),
  version: Version,
  requestId: Id,
}).strict();
```

### Operation Contract Matrix

| Operation ID | Request contract | Success contract and invariant | Error response |
|---|---|---|---|
| BE28C-DLC01 | DlcC01Request strict body plus Idempotency-Key; territory, law/provider versions and escrow are explicit. | DlcC01Success 200; capabilityEnabled=false at launch and unknown/blocked never changes holder. | ErrorResponse with ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429 or 503. |
| BE28C-DLC02 | DlcC02Request strict body plus Idempotency-Key; inspection and destination account are bound to order. | DlcC02Success 202; licence state and inspection/account evidence are separate; no early holder mutation. | ErrorResponse with BE00 ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429 or 503. |
| BE28C-DLC03 | DlcC03Request strict body plus Idempotency-Key; members, SSP, same currency, window, acceptances and optional ownership snapshot required. | DlcC03Success 201; immutable full vector/hash, basis kind and optional quote are returned; total equals full consideration. | ErrorResponse with BE00 ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429 or 503. |
| BE28C-DLC04 | DlcC04Request strict body plus Idempotency-Key; base entitlement/version and price evidence required. | DlcC04Success 200; range extension pins evidence; unknown ownership state is full_price_required. | ErrorResponse with BE00 ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429 or 503. |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| BE28C-DLC01 | Launch capability is disabled; territory, vendor policy, legal and provider versions are recorded. Unknown or unavailable policy returns blocked/unknown, refunds escrow and never changes holder. |
| BE28C-DLC02 | Inspection must be closed and account eligibility true before transfer. Hardware return before settlement leaves licence with seller; contradictory provider evidence enters manual_review. |
| BE28C-DLC03 | Every exact member has positive SSP independently executable in settlement currency; raw shares use B × s_i / Σs_i. Shard 18 performs one largest-remainder pass on bundle_member_id; no list/equal/vendor-weight/FX fallback. |
| BE28C-DLC03 | Every participating vendor accepts the same allocation hash before activation. Ownership snapshot is rechecked before capture; owned shares are itemized deductions, all-owned is zero/no capture, uncertainty holds cart and stale ownership creates successor quote. |
| BE28C-DLC04 | Base entitlement and terms must be current; valid proof permits extension, missing/unknown external ownership requires full price, and no buyer-specific price enters the allocation basis. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| BE28C-DLC01 | TRANSFER_CAPABILITY_DISABLED, TRANSFER_POLICY_UNKNOWN, TRANSFER_FORBIDDEN, ENTITLEMENT_NOT_FOUND, ESCROW_REFUND_PENDING, DEPENDENCY_UNAVAILABLE; hidden entitlement returns 404, visible holder without grant returns 403. | Required 7 years; hash covers entitlement, territory, policy/legal/provider versions and escrow. Replay returns decision. | 20 evaluations per holder per day, burst 3. | transfer_decision_total by result, blocked/unknown and escrow lag; log policy/version hashes, never holder identity. |
| BE28C-DLC02 | INSPECTION_OPEN, ACCOUNT_INELIGIBLE, TRANSFER_PROVIDER_UNKNOWN, TRANSFER_FORBIDDEN, ORDER_NOT_FOUND, ENTITLEMENT_NOT_FOUND, MANUAL_REVIEW_REQUIRED; hidden order returns 404, visible order without seller/buyer scope returns 403. | Required 7 years; hash covers order, entitlement, accounts, inspection and expected version. Replay returns transfer state. | 20 attempts per order per day, burst 3. | inspection gate, eligibility, provider timeout, manual-review and completion metrics; account refs hashed. |
| BE28C-DLC03 | PROMOTION_ALLOCATION_BASIS_MISSING, PROMOTION_CURRENCY_MISMATCH, PROMOTION_SPLIT_UNACCEPTED, OWNERSHIP_UNVERIFIED, PROMOTION_VERSION_STALE, VENDOR_FORBIDDEN, PROMOTION_NOT_FOUND, DEPENDENCY_UNAVAILABLE; hidden promotion/member returns 404, visible member without vendor grant returns 403. | Required 7 years; hash covers promotion, ordered member IDs, SSP versions, currency, consideration, acceptance refs and ownership snapshot. Replay returns allocation hash/quote. | 30 promotion versions per vendor per hour, burst 5; 120 holder quotes per minute. | allocation admission, basis rejects, remainder, vendor acceptance, ownership-hold, successor-quote and all-owned counters; no prices in broad logs. |
| BE28C-DLC04 | ENTITLEMENT_VERSION_CONFLICT, UPGRADE_TERMS_STALE, OWNERSHIP_UNVERIFIED, UPGRADE_FORBIDDEN, ENTITLEMENT_NOT_FOUND, DEPENDENCY_UNAVAILABLE; hidden entitlement returns 404, visible entitlement without holder grant returns 403. | Required 7 years; hash covers entitlement, base version, product/terms, price and proof ref. Replay returns extension state. | 30 upgrades per holder per hour, burst 5. | upgrade/crossgrade, full-price fallback, stale-version and evidence-pin metrics; proof refs hashed. |

## Database Schema

### PostgreSQL Model Registry

All tables use protected schemas, enabled and forced RLS, service/RPC writes only, append-only versions and same-transaction audit/outbox. Numeric promotion allocation values are exact integers/decimal intermediates; no floating-point amount is persisted.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| TransferPolicyDecision | id uuid PK NOT NULL; entitlement_id uuid NOT NULL FK catalog.entitlements(id); product_id uuid NOT NULL FK catalog.digital_products(id); current_holder_party_id uuid NOT NULL FK identity.parties(id); territory text NOT NULL CHECK length between 2 and 64; vendor_policy_version text NOT NULL CHECK length between 1 and 128; legal_version text NOT NULL CHECK length between 1 and 128; provider_version text NOT NULL CHECK length between 1 and 128; result text NOT NULL CHECK result in ('disabled','eligible','blocked','unknown'); capability_enabled boolean NOT NULL DEFAULT false CHECK capability_enabled=false; deactivation_proof uuid NULL; escrow_ref uuid NULL FK payments.escrows(id); escrow_action text NOT NULL CHECK escrow_action in ('held','refunded','not_applicable'); reason_code text NOT NULL CHECK reason_code~'^[A-Z0-9_]{3,80}$'; decision_version bigint NOT NULL CHECK decision_version>0; created_at timestamptz NOT NULL; unique (entitlement_id,territory,decision_version) | entitlement_id,result,created_at desc; product_id,territory; current_holder_party_id,created_at desc; result | Holder reads own decision; vendor reads own policy projection; service/provider writes through RPC; no direct client grant, forced RLS. |
| PromotionAllocation | id uuid PK NOT NULL; promotion_id uuid NOT NULL FK catalog.promotions(id); promotion_version bigint NOT NULL CHECK promotion_version>0; basis_kind text NOT NULL CHECK basis_kind='standalone_selling_price'; settlement_currency char(3) NOT NULL CHECK settlement_currency~'^[A-Z]{3}$'; full_bundle_consideration_minor bigint NOT NULL CHECK full_bundle_consideration_minor>=0; sum_ssp_minor bigint NOT NULL CHECK sum_ssp_minor>0; allocation_hash char(64) NOT NULL; state text NOT NULL CHECK state in ('draft','accepted','active','retired','stale'); vendor_acceptance_state text NOT NULL CHECK vendor_acceptance_state in ('pending','complete','rejected'); effective_from timestamptz NOT NULL; effective_to timestamptz NOT NULL CHECK effective_to>effective_from; rounding_version text NOT NULL; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; unique (promotion_id,promotion_version); unique (allocation_hash) | promotion_id,state; state,effective_from; settlement_currency,effective_from; allocation_hash | Participating vendors read own member/acceptance scope; cart/entitlement services read immutable active vector; no direct update/delete, forced RLS. |
| PromotionPriceQuote | id uuid PK NOT NULL; promotion_allocation_id uuid NOT NULL FK commerce.promotion_allocations(id); holder_party_id uuid NOT NULL FK identity.parties(id); ownership_snapshot_id uuid NOT NULL FK identity.ownership_snapshots(id); ownership_snapshot_version bigint NOT NULL CHECK >0; owned_member_ids uuid[] NOT NULL; unowned_member_ids uuid[] NOT NULL; deducted_minor bigint NOT NULL CHECK deducted_minor>=0; payable_minor bigint NOT NULL CHECK payable_minor>=0; currency char(3) NOT NULL; allocation_hash char(64) NOT NULL; expires_at timestamptz NOT NULL; state text NOT NULL CHECK state in ('current','superseded','captured','expired'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; unique (holder_party_id,promotion_allocation_id,ownership_snapshot_version,version) | holder_party_id,state,expires_at; promotion_allocation_id,state; ownership_snapshot_id,ownership_snapshot_version; allocation_hash | Holder reads own itemized quote; vendors see aggregate acceptance only; capture service rechecks ownership; no direct client write, forced RLS. |
| promotion_allocation_members | id uuid PK NOT NULL; allocation_id uuid NOT NULL FK commerce.promotion_allocations(id); bundle_member_id uuid NOT NULL; product_id uuid NOT NULL FK catalog.digital_products(id); listing_version_id uuid NOT NULL FK catalog.listing_versions(id); monetisation_model text NOT NULL CHECK length between 1 and 80; standalone_price_version_id uuid NOT NULL FK catalog.price_versions(id); vendor_party_id uuid NOT NULL FK identity.parties(id); ssp_minor bigint NOT NULL CHECK ssp_minor>0; raw_share_numerator numeric(38,0) NOT NULL CHECK raw_share_numerator>0; raw_share_denominator numeric(38,0) NOT NULL CHECK raw_share_denominator>0; allocated_minor bigint NOT NULL CHECK allocated_minor>=0; fractional_remainder numeric(38,18) NOT NULL CHECK fractional_remainder>=0; tie_key uuid NOT NULL; created_at timestamptz NOT NULL; unique (allocation_id,bundle_member_id); unique (allocation_id,tie_key) | allocation_id,allocated_minor; allocation_id,vendor_party_id; product_id,listing_version_id; bundle_member_id | Member rows are immutable children of allocation; vendor sees own rows, quote/capture worker reads all; no direct client grant, forced RLS. |

### State, Concurrency and Transaction Rules

- TransferPolicyDecision evaluates a disabled launch capability before any holder mutation. Unknown law, territory, vendor policy or provider deactivation proof is blocked and escrow is refunded/held according to the recorded action; no “eligible” default.
- Bundled software transfer locks the order and entitlement settlement version. Inspection closure, buyer vendor-account eligibility, payment settlement and provider deactivation/activation are separate receipts; only the admitted boundary changes holder. Hardware return before settlement leaves licence with seller.
- PromotionAllocation admission validates every positive SSP and one settlement currency, freezes listing/price versions and full consideration, computes raw proportional shares, invokes Shard 18 exactly once, and requires each vendor's acceptance of the resulting allocation hash. Existing vectors are immutable; later prices create successor versions.
- PromotionPriceQuote deducts owned-member allocated shares from the frozen full vector. Recheck ownership immediately before capture; a changed snapshot supersedes the quote, unknown holds cart, all-owned returns zero/no capture, and each acquired entitlement cites one member allocation row without recomputation.
- Upgrade/crossgrade uses an entitlement CAS. A valid base extends the version range and pins price/evidence; unknown ownership selects full-price-required and cannot manufacture a discount. Duplicate keys replay the same result.
- Serialization/deadlock conflicts retry twice at 50/150 ms. Worker crashes resume provider steps through receipts and outbox; no local FX, equal division, vendor weighting, second rounding pass or stale capture.

### Grants, RLS and Retention

- authenticated and anon roles have no direct table grants. Security-invoker RPCs recheck vendor member authority, holder ownership snapshot, entitlement version, settlement state, effective window, acceptance hash and Shard 18 rounding response.
- Vendor views expose only their member rows and acceptance status; holder views expose own quote and itemized deductions. Public projections omit ownership, buyer identity, private vendor economics and provider credentials.
- Allocation vectors, quotes, transfer decisions and upgrade evidence are retained for commerce/audit periods. Captured entitlements and allocation evidence are immutable; retired promotions and superseded quotes remain queryable by authorized finance/audit roles.
- Support cannot enable used transfer, edit SSPs, accept for a vendor, override ownership unknown, change a frozen vector, or replace the Shard 18 rounding response.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed roles | Ownership and object scope | 403 versus 404 |
|---|---|---|---|
| BE28C-DLC01 | Current holder controller; authorized vendor policy actor; support case-bound | Decision is scoped to one entitlement, territory and policy/provider version; launch gate is immutable server policy. | Hidden entitlement returns 404 ENTITLEMENT_NOT_FOUND; visible entitlement without holder/vendor scope returns 403 TRANSFER_FORBIDDEN. |
| BE28C-DLC02 | Seller/vendor controller, buyer destination controller, inspection worker, finance worker | Seller owns licence/order; destination account and inspection evidence are independently scoped. | Hidden order/entitlement returns 404 ORDER_NOT_FOUND; visible object without seller/buyer grant returns 403 TRANSFER_FORBIDDEN. |
| BE28C-DLC03 | Vendor controllers for contributed members; system allocation worker; holder quote actor | Every member vendor must control its listing; holder snapshot is limited to that holder and version. | Hidden promotion/member returns 404 PROMOTION_NOT_FOUND; visible member without vendor authority returns 403 PROMOTION_FORBIDDEN. |
| BE28C-DLC04 | Holder controller; vendor terms authority; system entitlement worker | Base entitlement belongs to holder and upgrade terms/version are current. | Hidden entitlement returns 404 ENTITLEMENT_NOT_FOUND; visible entitlement without holder grant returns 403 UPGRADE_FORBIDDEN. |

### Per-Operation Middleware Registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
|---|---|---|---|
| BE28C-DLC01 | requestId → strictCors → auth → holder/vendor policy context → rate limit → idempotency → strict body validation → launch-capability gate → policy adapter → audit/outbox | CORS policy digital-commerce: explicit web/PWA origins; no wildcard credentials; Vary: Origin | CSRF, 128 KiB body, territory/version bounds, escrow token reference, BE00 ApiError { code, message, requestId, details }, no holder identity logs. |
| BE28C-DLC02 | requestId → strictCors → auth → seller/buyer/order context → rate limit → idempotency → strict body validation → inspection CAS → account eligibility → transfer adapter → audit/outbox | CORS policy digital-commerce: explicit web/PWA origins; no wildcard credentials; Vary: Origin | CSRF, 256 KiB body, provider refs only, no holder mutation before closure, BE00 ApiError { code, message, requestId, details }. |
| BE28C-DLC03 | requestId → strictCors → auth → vendor/member context → rate limit → idempotency → strict body validation → SSP/currency gate → Shard-18 rounding → vendor-acceptance gate → optional ownership snapshot → audit/outbox | CORS policy digital-commerce: explicit web/PWA origins; no wildcard credentials; Vary: Origin | CSRF, 512 KiB body, positive SSP and stable key checks, no runtime FX/fallback, ownership privacy, BE00 ApiError { code, message, requestId, details }. |
| BE28C-DLC04 | requestId → strictCors → auth → holder context → rate limit → idempotency → strict body validation → entitlement CAS → price/evidence gate → handler/audit/outbox | CORS policy digital-commerce: explicit web/PWA origins; no wildcard credentials; Vary: Origin | CSRF, 128 KiB body, entitlement/version lock, no honor discount, BE00 ApiError { code, message, requestId, details }. |

### Security and Privacy Controls

All credentialed mutations use CSRF checks, explicit origin allowlists, secure response headers, body-size/content-type limits and request-scoped redacted logs. Ownership snapshots and buyer identity never enter vendor/public output. Provider account references and escrow tokens remain server-side. Allocation members are keyed by stable UUIDs; no request may submit a replacement rounding/tie rule. Unknown state fails closed at every external seam.

## Data Flow

1. BE28C-DLC01 records a disabled/blocked policy decision and escrow action; no transfer state or holder changes at launch.
2. BE28C-DLC02 sequences inspection closure, account eligibility, settlement and provider transfer. It commits a separate licence leg only after all required evidence is durable.
3. BE28C-DLC03 admits the promotion, validates SSP/currency, invokes Shard 18 once, persists member allocations and vendor acceptances, then optionally computes a holder quote from a verified ownership snapshot. Capture consumes the quote but never recomputes the vector.
4. BE28C-DLC04 validates the base entitlement and applies an in-place range extension/crossgrade with pinned price/evidence; unknown ownership is full price.

## Events and Consumer Contracts

| Event type | Producer operation | Required envelope and payload | Consumer behavior |
|---|---|---|---|
| digital_transfer.completed.v1 | BE28C-DLC01 only if a future gate enables it; BE28C-DLC02 after inspection settlement | {eventId, aggregateId, aggregateVersion, occurredAt, requestId, entitlementId, priorHolderPartyId, newHolderPartyId, policyVersion, territory, providerVersion, settlementRef} | Shard 27 updates the same entitlement holder; library/vendor projections consume scoped facts; duplicate refetches canonical state. |
| digital_promotion.changed.v1 | BE28C-DLC03 | {eventId, aggregateId, aggregateVersion, occurredAt, requestId, promotionId, basisKind, settlementCurrency, allocationHash, memberVersionRefs, allocatedMinorValues, vendorAcceptanceState, effectiveFrom, effectiveTo, version} | Catalog/cart/entitlement/revenue pin the allocation hash; no consumer recomputes or sees ownership details. |

Events contain IDs, versions, hashes and money only. Transactional outbox and provider receipts are deduped by event/aggregate version. Missing events cause refetch; no event changes Shard 27 entitlement or Shard 18 rounding authority.

## Error Handling and Failure Recovery

| Operation ID | Condition | HTTP | Error code | Recovery |
|---|---|---:|---|---|
| BE28C-DLC01 | Launch capability disabled or policy/provider unknown | 409 or 503 | TRANSFER_CAPABILITY_DISABLED or TRANSFER_POLICY_UNKNOWN | Keep/refund escrow per decision; do not mutate holder; retry only same evaluation key. |
| BE28C-DLC02 | Inspection open or account ineligible | 409 | INSPECTION_OPEN or ACCOUNT_INELIGIBLE | Keep licence with seller; wait for durable evidence or manual review. |
| BE28C-DLC03 | Missing SSP, currency mismatch or vendor acceptance | 422 or 409 | PROMOTION_ALLOCATION_BASIS_MISSING, PROMOTION_CURRENCY_MISMATCH or PROMOTION_SPLIT_UNACCEPTED | Publish nothing; correct member versions/acceptances and create a new promotion version. |
| BE28C-DLC03 | Ownership unknown or stale before capture | 409 | OWNERSHIP_UNVERIFIED or PROMOTION_VERSION_STALE | Hold cart or show successor quote; never capture stale price. |
| BE28C-DLC04 | Base entitlement/version or ownership proof unknown | 409 | ENTITLEMENT_VERSION_CONFLICT or OWNERSHIP_UNVERIFIED | Refetch; require full price when policy says unknown; no silent discount. |
| All | Shard 18/27/provider circuit open | 503 | DEPENDENCY_UNAVAILABLE | Retry bounded seam with same key; preserve canonical pending state and no fallback. |
| All | Idempotency hash mismatch | 409 | IDEMPOTENCY_KEY_CONFLICT | Use original key/result or a new key after intent changes. |

## Verification and Test Strategy

### Operation Test Matrix

| Test ID | Operation ID | Acceptance assertion |
|---|---|---|
| BE28C-CON-001 | BE28C-DLC01 | Disabled launch gate, policy versions, unknown state and escrow action are exact. |
| BE28C-CON-002 | BE28C-DLC02 | Inspection closure, account eligibility, separate licence state and pre-settlement return behavior are exact. |
| BE28C-CON-003 | BE28C-DLC03 | Positive same-currency SSP, formula, one Shard 18 pass, stable tie key, vendor acceptance, ownership quote and full-vector hash are exact. |
| BE28C-CON-004 | BE28C-DLC04 | Entitlement extension, price/evidence pin and full-price unknown ownership behavior are exact. |
| BE28C-ROUTE-001 | BE28C-DLC01 through BE28C-DLC04 | Method/path/operation registry is authoritative; aliases cannot bypass middleware. |
| BE28C-AUTH-001 | BE28C-DLC01 through BE28C-DLC04 | Hidden objects return 404, visible objects without role/scope return 403, and vendor/holder projections are isolated. |
| BE28C-MW-001 | BE28C-DLC01 through BE28C-DLC04 | CORS, CSRF, auth, rate, validation, BE00 ApiError and safe headers run per operation. |
| BE28C-DB-001 | BE28C-DLC01 through BE28C-DLC04 | Typed fields, constraints, indexes, forced RLS, grants, immutable members and audit/outbox are migration-tested. |
| BE28C-RACE-001 | BE28C-DLC02 through BE28C-DLC04 | Inspection/return, ownership/capture, stale quote and entitlement/version races serialize without duplicate effect. |
| BE28C-RACE-002 | BE28C-DLC01, BE28C-DLC03 | Provider unknown, Shard 18 outage, vendor non-acceptance and worker crash preserve blocked/pending state. |
| BE28C-EVT-001 | BE28C-DLC01 through BE28C-DLC04 | Exact transfer/promotion event names, redaction, outbox dedupe and consumer refetch are verified. |

### Test Levels and Acceptance Gates

- Contract/property tests reject zero/negative/cross-currency SSP, duplicate member keys, changed tie rules, stale snapshots, malformed UUIDs and unknown keys before mutation.
- Route tests assert every method/path, explicit CORS policy, authorization chain, rate class, idempotency receipt and BE00 error envelope.
- Database tests verify unique allocation/member hashes, exact minor-unit sum, one rounding response, quote conservation, forced RLS and no direct client grants.
- Integration tests simulate disabled used transfer, inspection return, provider unknown, multi-vendor acceptance, Shard 18 timeout, ownership change at capture, all-owned bundle and upgrade version race.
- Privacy tests verify buyer ownership, vendor private economics, provider account refs and raw member evidence are not exposed beyond purpose.
- Recovery tests replay lost responses/events, stale quote successors, provider retry and outbox duplication without re-apportionment.

## Deepening Passes and Ambiguity Gate

### Micro Pass

| Question | Resolution |
|---|---|
| Can launch used transfer silently move a holder? | No. Capability is disabled; unknown policy/provider returns blocked/unknown and escrow action. |
| Can hardware payment settle before inspection? | No. Licence transfer waits for inspection closure and destination account eligibility. |
| Can promotion use list price, equal shares, vendor weights or runtime FX? | No. Positive independent SSP in one currency and the frozen formula are mandatory. |
| Can ownership change rewrite the promotion vector? | No. It supersedes the quote only; allocation and acquired member evidence remain pinned. |
| Can all-owned bundle create a zero-dollar order? | No. It returns zero/no capture and mints no entitlement. |
| Can unknown ownership receive a discount? | No. Upgrade/crossgrade uses full price or blocks according to the current evidence policy. |

### Macro Pass

| Boundary question | Resolution |
|---|---|
| Does this companion own product/entitlement state? | No. Shard 27 is canonical; this companion references versions and emits transfer/promotion facts. |
| Does it own cent rounding? | No. Shard 18 RoundPayableAggregate is invoked once; no local fallback or residue sink exists. |
| Does it create a second rights/split ledger? | No. Shard 10 remains rights/split authority; member vendor acceptances reference its facts where needed. |
| Does a promotion quote leak buyer ownership to vendors? | No. Quotes are holder-scoped and vendor output exposes only acceptance/member scope. |
| Does provider completion alone prove transfer? | No. Canonical state changes only after all admitted evidence and idempotent receipts commit. |

## Ambiguity Gate

PASS. Evidence: interactions 28.12–28.15 map one-to-one to BE28C-DLC01–DLC04 and four unique routes; TransferPolicyDecision, PromotionAllocation and PromotionPriceQuote are explicitly owned; exact digital_transfer.completed.v1 and digital_promotion.changed.v1 events are inventoried; strict Zod 4 request/success/error contracts, BE00 ApiError { code, message, requestId, details }, 403-vs-404, idempotency, rate, observability, CORS, typed persistence/RLS/grants, state/recovery rules and keyed tests exist for every operation. Launch transfer disablement, inspection sequencing, SSP proportional allocation, one Shard 18 rounding pass, vendor acceptance, ownership adjustment, upgrade evidence and adjacent authority boundaries are explicit. No unresolved source conflict remains.

## Open Questions

None.

## Dependency References

- [BE00 platform contracts](00-infrastructure.md#requestresponse-contracts-zod-4-schemas): request identity, strict Zod 4, ApiError, auth, CORS, idempotency, rate, audit/outbox and forced RLS.
- [IA Shard 27 contracts](../ia/27-digital-catalog-delivery.md#contracts): product, terms, artifact and entitlement authority consumed here.
- [IA Shard 18 contracts](../ia/18-royalty-accounting.md#contracts): RoundPayableAggregate, tie-key and residue policy consumed exactly once.
- [IA Shard 10 contracts](../ia/10-rights-ownership.md#contracts): rights/split references and no parallel title/ownership ledger.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-08-28 | Initial production-grade companion for IA interactions 28.12–28.15; transfer gates, inspection sequencing, promotion allocation/quotes, upgrades, contracts, security, persistence, recovery and ambiguity evidence added. |
