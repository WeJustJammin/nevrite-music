# BE-25d — Gear Market Guides, Provenance, and Storefront Policies

Status: implementation-ready backend contract for Shard 25 interactions 25.18–25.21. This companion owns the safe provenance/theft projection, eligible settled-comps admission, confidence-gated market guides and price suggestions, and immutable storefront policy versions. Catalog authority is BE-25a; listing truth is BE-25b; inventory and channel availability are BE-25c.

## Classification

| Field | Decision |
|---|---|
| Backend boundary | Read-safe provenance/theft display, WeJammin-settled market evidence, confidence-gated guide output, and seller storefront policy versions |
| Assigned interactions | 25.18 Display provenance/theft status; 25.19 View price guide/comps; 25.20 Request price suggestion/repricing; 25.21 Manage storefront policies |
| Operation IDs | BE25D-GMC18 through BE25D-GMC21 |
| Primary actors | Public viewer, authenticated buyer/seller, seller storefront operator, market calculation worker, and policy evaluator |
| Non-goals | Theft adjudication, identity transfer, catalog matching, listing mutation, inventory reservation, checkout, external channel sync, and dealer/MAP controls |
| Locked product decisions | Positive theft hit holds exposure; pending/outage never earns a clear badge; only eligible WeJammin settled comps launch; external data requires license/provenance/review; confidence output is full/examples_only/declined; no ungated median/suggestion; repricing is disabled at launch; policy versions are immutable |
| Platform dependency | BE-00 error/idempotency/outbox/RLS/CORS/audit rules and the global ApiError contract apply to every operation |

This boundary keeps derived market information and display projections separate from authoritative listing, identity, and inventory writes. A guide can explain evidence without becoming a listing price or silently changing a seller policy.

## Referenced Material Inventory

| Source | Section and line trace | Material used |
|---|---|---|
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Shard decisions, lines 1–40 | Theft status behavior, settled-comp scope, external-data admission, confidence output, launch repricing/dealer policy decisions |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Interactions table, lines 79–99 | Exact interaction IDs 25.18–25.21 and public/seller boundaries |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Command contracts, lines 105–116 | ComputeMarketGuide and SaveStorefrontPolicy command semantics |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Data Models, lines 130–144 | CompObservation, GuideResult, StorefrontPolicyVersion plus Listing/ListingVersion references |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Event Schemas, lines 213–224 | gear_market.comp_admitted.v1, gear_market.guide_recomputed.v1, gear_storefront.policy_changed.v1 |
| .memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md | Market guide, lines 44–51 | Normalized bucket, exclusions, sample/recency/dispersion/integrity, output classes and suggestion gate |
| .memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md | Market policy, lines 96–98 | Launch-only settled comps and no consumer dealer/MAP controls |
| .memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md | Provenance and evidence, lines 89–94 | Evidence boundary and safe display references |
| .memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md | Access and races, lines 100–115 and 127–139 | Seller/buyer/public access, transfer, screening, and guide recomputation races |
| .memory/wiki/specs/be/00-infrastructure.md | Zod/error rules, lines 112–153 | Strict Zod 4, ApiError { code, message, requestId, details }, bounded details |
| .memory/wiki/specs/be/00-infrastructure.md | RLS, Hono, and transaction rules, lines 208–308 | Forced RLS, CORS, auth/validation, rate classes, idempotency, audit and outbox |
| .memory/wiki/specs/be/23b-theft-screening-recovery.md | Screening dependency | Screening status/positive-hit hold and no false-clear behavior |
| .memory/wiki/specs/be/23d-valuation-insurance-discography.md | Provenance dependency | Canonical identity/valuation references and transfer-safe provenance evidence |
| .memory/wiki/specs/be/25b-gear-listing-disclosure-lifecycle.md | Listing dependency | Published ListingVersion, DisclosureVersion, buyer pin and evidence references |
| .memory/wiki/specs/be/25c-gear-inventory-bulk-channels.md | Inventory dependency | MarketplaceUnit/StockLine eligibility and availability freshness |

## IA Source Map

### Assigned interactions

| IA ID | IA name | Backend responsibility | Operation |
|---|---|---|---|
| 25.18 | Display provenance/theft status | Return safe provenance sources, screening state and custody boundary without private evidence or false-clear badge | BE25D-GMC18 |
| 25.19 | View price guide/comps | Query normalized eligible settled comps and confidence-gated GuideResult | BE25D-GMC19 |
| 25.20 | Request price suggestion/repricing | Create an auditable request; return full suggestion only when guide confidence and listing eligibility meet threshold; repricing remains disabled | BE25D-GMC20 |
| 25.21 | Manage storefront policies | Validate statutory-safe seller policy input and append immutable StorefrontPolicyVersion | BE25D-GMC21 |

### Canonical Data Models

| IA model | This companion representation | Ownership |
|---|---|---|
| CompObservation | Normalized, provenance-linked settled sale observation with eligibility and exclusion reason | Authoritative here |
| GuideResult | Versioned confidence/output-class result for a normalized category/model bucket | Authoritative here |
| StorefrontPolicyVersion | Immutable seller policy snapshot and statutory evaluator result | Authoritative here |
| Listing | Listing/publication reference consumed from BE-25b | 25b authoritative |
| ListingVersion | Version pinned to provenance and comp normalization | 25b authoritative |
| DisclosureVersion | Condition/originality/evidence input for bucket eligibility | 25b authoritative |
| MarketplaceUnit | Availability and sold-state input consumed from BE-25c | 25c authoritative |
| ListingModelBind | Catalog normalization input consumed from BE-25a | 25a authoritative |

### Event Schemas

| Event type | Producer operation | Delivery invariant |
|---|---|---|
| gear_market.comp_admitted.v1 | Market admission worker after settled sale verification | Comp ID, normalized bucket, source class, eligibility, and provenance hash; no buyer/seller PII |
| gear_market.guide_recomputed.v1 | Guide worker after comp admission or policy-versioned recompute | Guide ID/version, bucket, confidence class, sample count, and safe range; no hidden raw observation |
| gear_storefront.policy_changed.v1 | BE25D-GMC21 | Policy version, storefront ID, statutory result, actor class, and effective time |
| gear_listing.screening_changed.v1 | Consumed from BE-23b | Listing screening status and revision; a hold invalidates public provenance badge |

The full Shard 25 event inventory is preserved for mechanical reconciliation: gear_catalog.assertion_submitted.v1, gear_catalog.resolution_changed.v1, gear_listing.model_bind_changed.v1, gear_listing.disclosure_changed.v1, gear_listing.published.v1, gear_listing.state_changed.v1, gear_inventory.claim_resolved.v1, gear_inventory.stock_changed.v1, gear_listing.screening_changed.v1, gear_market.comp_admitted.v1, gear_market.guide_recomputed.v1, and gear_storefront.policy_changed.v1. This companion produces only market and storefront events and consumes listing, inventory, and screening events.

## Endpoint Reconciliation

BE-00 owns auth/session, object storage, idempotency inspection and global errors. BE-23 owns identity, ownership transfer, theft adjudication and screening. BE-24 owns custody cases/manifests. BE-25a owns catalog/model and fitment routes. BE-25b owns listing/disclosure/publication/state. BE-25c owns inventory/channel availability. BE-26/order services provide settled transaction facts through a worker seam; this companion does not create sales or write listing prices. No route below duplicates those boundaries.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Capability | Archetype | Success |
|---|---|---|---|---|---|---|
| BE25D-GMC18 | GET | /api/v1/gear/listings/{listingId}/provenance | 25.18 | listing.provenance.read | public bounded read | 200 ProvenanceSuccess |
| BE25D-GMC19 | GET | /api/v1/gear/market-guides | 25.19 | market.guide.read | public bounded read | 200 GuideSuccess |
| BE25D-GMC20 | POST | /api/v1/gear/listings/{listingId}/price-suggestions | 25.20 | market.suggestion.request | ordinary command | 202 SuggestionSuccess |
| BE25D-GMC21 | PUT | /api/v1/gear/storefronts/{storefrontId}/policies | 25.21 | storefront.policy.write | ordinary command | 201 PolicySuccess |

This registry is the sole method/path authority. GET requests are bounded reads and use no write idempotency record; command requests require idempotency. Price suggestion is a request/result record, not an automatic listing repricing endpoint.

### Read cardinality and pagination policy

| Operation ID | Read shape and allowlisted filters | Page size and cursor |
|---|---|---|
| BE25D-GMC18 | Single listing provenance projection keyed by `listingId`; `includeEvidenceSummary` and `includeCustodyBoundary` are the only query controls; no arbitrary filters | N/A: singular resource, no cursor or page parameter; `provenanceSources` is capped at 100 and the response is one listing projection |
| BE25D-GMC19 | Guide/comps query allowlists `categoryKey`, `listingModelBindId`, `conditionClass`, `originalityAggregate`, `region`, `currency`, and `includeExamples`; no arbitrary filter or sort keys | Default 20, maximum 50; opaque cursor is bound to normalized filters, guide version and sort; order by `settledAt DESC`, `compObservationId ASC` tie-break; `nextCursor` only when another bounded page exists |

### Request/response contracts (Zod 4)

Schemas are strict Zod 4. Unknown keys, unbounded filters, unsafe text, invalid UUIDs, unsupported currencies, and oversized arrays reject before database access. Every failure uses BE-00 ApiError { code, message, requestId, details }. No response includes raw buyer/seller identity, evidence bytes, private serial, channel credential, or unredacted moderation note.

~~~ts
import { z } from "zod";
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });

const Uuid = z.string().uuid();
const Instant = z.string().datetime({ offset: true });
const Text = (max: number) => z.string().trim().min(1).max(max);
const Cursor = z.string().regex(/^[A-Za-z0-9_-]{16,256}$/).nullable();
const Currency = z.enum(["USD", "CAD", "GBP", "EUR"]);
const OutputClass = z.enum(["full", "examples_only", "declined"]);
const Screening = z.enum(["clear", "pending", "hold", "unknown"]);

export const Gmc18Request = z.object({
  listingId: Uuid,
  includeEvidenceSummary: z.boolean().default(true),
  includeCustodyBoundary: z.boolean().default(false)
}).strict();

const ProvenanceSource = z.object({
  sourceType: z.enum(["manufacturer", "licensed_import", "seller_assertion", "community_attribution", "custody_record"]),
  label: Text(180),
  sourceId: Uuid.nullable(),
  observedAt: Instant.nullable(),
  confidence: z.number().min(0).max(1),
  public: z.boolean()
}).strict();

export const ProvenanceSuccess = z.object({
  requestId: Uuid,
  operationId: z.literal("BE25D-GMC18"),
  listingId: Uuid,
  listingVersionId: Uuid,
  screeningStatus: Screening,
  badge: z.enum(["clear", "pending", "hold", "unknown"]),
  ownerConsentState: z.enum(["current", "reset", "absent"]),
  provenanceSources: z.array(ProvenanceSource).max(100),
  custodyBoundaryId: Uuid.nullable(),
  evidenceCount: z.number().int().nonnegative().max(100),
  asOf: Instant
}).strict();

export const Gmc19Request = z.object({
  categoryKey: z.string().regex(/^[a-z0-9_.:-]{1,120}$/),
  listingModelBindId: Uuid.nullable(),
  conditionClass: z.enum(["new", "open_box", "used", "b_stock", "parts", "non_functioning"]).nullable(),
  originalityAggregate: z.enum(["original", "replacement", "modified", "unknown"]).nullable(),
  region: z.string().regex(/^[A-Z]{2,3}$/),
  currency: Currency,
  includeExamples: z.boolean().default(false),
  cursor: Cursor,
  limit: z.number().int().min(1).max(50).default(20)
}).strict();

const MoneyRange = z.object({
  currency: Currency,
  lowMinor: z.number().int().nonnegative().max(1000000000),
  highMinor: z.number().int().nonnegative().max(1000000000),
  centerMinor: z.number().int().nonnegative().max(1000000000).nullable()
}).strict().superRefine((v, ctx) => {
  if (v.highMinor < v.lowMinor || (v.centerMinor !== null && (v.centerMinor < v.lowMinor || v.centerMinor > v.highMinor))) {
    ctx.addIssue({ code: "custom", path: ["highMinor"], message: "range ordering invalid" });
  }
});

const CompSummary = z.object({
  compObservationId: Uuid,
  settledAt: Instant,
  conditionClass: z.string().max(40),
  amountMinor: z.number().int().nonnegative().max(1000000000),
  currency: Currency,
  sourceLabel: Text(120),
  provenanceHash: z.string().regex(/^[a-f0-9]{64}$/)
}).strict();

export const GuideSuccess = z.object({
  requestId: Uuid,
  operationId: z.literal("BE25D-GMC19"),
  guideResultId: Uuid,
  bucketKey: z.string().regex(/^[a-f0-9]{64}$/),
  outputClass: OutputClass,
  range: MoneyRange.nullable(),
  sampleCount: z.number().int().nonnegative().max(100000),
  recencyScore: z.number().min(0).max(1),
  dispersionScore: z.number().min(0).max(1),
  integrityScore: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  examples: z.array(CompSummary).max(20),
  computedAt: Instant,
  nextCursor: z.string().regex(/^[A-Za-z0-9_-]{16,256}$/).nullable()
}).strict().superRefine((v, ctx) => {
  if (v.outputClass === "full" && v.range === null) {
    ctx.addIssue({ code: "custom", path: ["range"], message: "full guide requires range" });
  }
  if (v.outputClass === "declined" && v.range !== null) {
    ctx.addIssue({ code: "custom", path: ["range"], message: "declined guide cannot expose range" });
  }
});

export const Gmc20Request = z.object({
  listingId: Uuid,
  idempotencyKey: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  expectedListingVersionId: Uuid,
  expectedDisclosureVersionId: Uuid,
  currency: Currency,
  region: z.string().regex(/^[A-Z]{2,3}$/),
  includeExamples: z.boolean().default(false),
  requestRepricing: z.literal(false).default(false)
}).strict();

export const SuggestionSuccess = z.object({
  requestId: Uuid,
  operationId: z.literal("BE25D-GMC20"),
  priceSuggestionRequestId: Uuid,
  listingId: Uuid,
  state: z.enum(["queued", "computed", "examples_only", "declined", "disabled"]),
  outputClass: OutputClass,
  suggestedRange: MoneyRange.nullable(),
  guideResultId: Uuid.nullable(),
  repricingApplied: z.literal(false),
  reasonCode: z.string().regex(/^[A-Z0-9_]{3,64}$/),
  eventId: Uuid.nullable(),
  createdAt: Instant
}).strict();

const PolicyText = (max: number) => z.string().trim().max(max);
export const Gmc21Request = z.object({
  storefrontId: Uuid,
  idempotencyKey: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  expectedPolicyVersion: z.number().int().positive().max(2147483647),
  effectiveAt: Instant,
  returnsWindowDays: z.number().int().min(0).max(365),
  returnCondition: z.enum(["same_condition", "unused_only", "statutory_only"]),
  dispatchWindowDays: z.number().int().min(0).max(60),
  warrantyText: PolicyText(2000),
  acceptedPaymentMethods: z.array(z.enum(["platform_card", "platform_wallet", "bank_transfer"])).min(1).max(3),
  pickupAvailable: z.boolean(),
  policyText: PolicyText(4000),
  statutoryRegion: z.string().regex(/^[A-Z]{2,3}$/),
  storefrontMode: z.enum(["active", "away"]),
  inheritToFutureListings: z.literal(true).default(true),
  sellerConfirmsLegalCompliance: z.literal(true)
}).strict();

export const PolicySuccess = z.object({
  requestId: Uuid,
  operationId: z.literal("BE25D-GMC21"),
  storefrontId: Uuid,
  policyVersionId: Uuid,
  version: z.number().int().positive(),
  effectiveAt: Instant,
  storefrontMode: z.enum(["active", "away"]),
  inheritToFutureListings: z.literal(true),
  statutoryStatus: z.enum(["compatible", "overridden", "rejected"]),
  state: z.enum(["scheduled", "active"]),
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

Gmc18 and Gmc19 do not accept an idempotency key because they are reads. Gmc20 and Gmc21 require one. The server canonicalizes filters/body before hashing. A reused command key with a different body returns IDEMPOTENCY_KEY_REUSE. Guide output never supplies a numeric range for declined output, and SuggestionSuccess always reports repricingApplied false at launch.

### Contract Registry

| Operation ID | Request schema | Success schema | Global error contract | Commit boundary |
|---|---|---|---|---|
| BE25D-GMC18 | Gmc18Request strict; bounded include flags | ProvenanceSuccess with safe badge and source summaries | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Read transaction only; no mutation |
| BE25D-GMC19 | Gmc19Request strict; bounded normalized filters/cursor | GuideSuccess with confidence/output-class gate | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Read from versioned GuideResult/projection; no mutation |
| BE25D-GMC20 | Gmc20Request strict; expected listing/disclosure versions; repricing false | SuggestionSuccess; queued/computed/declined result is durable | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Suggestion request, audit, job/outbox and idempotency result commit atomically |
| BE25D-GMC21 | Gmc21Request strict; legal confirmation and policy bounds | PolicySuccess with immutable version and statutory status | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Policy version, current pointer, audit, outbox and idempotency result commit atomically |

## Authorization and Ownership

| Operation ID | Actor and role | Ownership/visibility check | 403 versus 404 |
|---|---|---|---|
| BE25D-GMC18 | Public viewer for safe fields; authenticated buyer/seller for permitted depth | Listing must have a public published projection; custody boundary and private source details require buyer/order or seller grant | Invisible/unpublished listing returns 404 PROVENANCE_NOT_FOUND; visible but private depth without grant returns 403 PROVENANCE_FORBIDDEN |
| BE25D-GMC19 | Public viewer for full/example/declined guide | Filters are public-safe; examples omit private party identity and require eligible comp projection | No bucket/result returns 404 GUIDE_NOT_FOUND; unsupported private filter is 403 GUIDE_FILTER_FORBIDDEN |
| BE25D-GMC20 | Seller or seller_market_operator | Seller owns listing and expected ListingVersion/DisclosureVersion; no repricing grant exists at launch | Inaccessible listing is 404 LISTING_NOT_FOUND; visible listing without seller grant is 403 SUGGESTION_FORBIDDEN |
| BE25D-GMC21 | Seller or delegated storefront_operator | storefrontId belongs to seller and operator has policy.write grant; statutory region evaluator runs server-side | Unknown storefront is 404 STOREFRONT_NOT_FOUND; visible storefront without grant is 403 POLICY_WRITE_FORBIDDEN |

Positive screening hit and an unresolved ownership transfer suppress public provenance details regardless of seller grant. When ownership transfers, ownerConsentState becomes reset and the prior owner-end publication consent is not carried forward; the new owner must establish consent before private source depth is exposed. If no permitted provenance history exists, the response contains an empty source list and no hidden count. Seller erasure de-identifies eligible seller identity while preserving legally required comp/provenance hashes and buyer-pinned versions. A policy cannot waive platform safety, statutory rights, theft hold, or payment restrictions.

## Middleware and Security

### Per-operation middleware registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
|---|---|---|---|
| BE25D-GMC18 | requestId → CORS → optional auth → rate limit → strict query validation → visibility projection → handler | CORS policy gear-api; allowlisted web origins; credentials only for approved origins | max query 8 KiB; public-safe projection; no raw evidence, serial, address, or signed URL |
| BE25D-GMC19 | requestId → CORS → optional auth → rate limit → strict query validation → guide policy → handler | CORS policy gear-api; allowlisted web origins; credentials only for approved origins | max query 8 KiB; cursor bound; suppress low-confidence range; examples redacted |
| BE25D-GMC20 | requestId → CORS → auth → actor context → rate limit → idempotency → strict body validation → seller ownership → version gate → handler/outbox | CORS policy gear-api; allowlisted web origins; credentials only for approved origins | max body 32 KiB; CSRF for cookie auth; repricing hard-disabled; no price write |
| BE25D-GMC21 | requestId → CORS → auth → actor context → rate limit → idempotency → strict body validation → storefront grant → statutory evaluator → handler/audit/outbox | CORS policy gear-api; allowlisted web origins; credentials only for approved origins | max body 16 KiB; CSRF for cookie auth; HTML/URL sanitization; no policy weakening |

Authorization is repeated inside the read projection/RPC. Secrets, private comp source payloads, seller notes, and unredacted policy review details never enter logs or client errors.

## Idempotency, Rate Limits, and SLOs

| Operation ID | Idempotency and concurrency | Rate limit | SLO and timeout |
|---|---|---|---|
| BE25D-GMC18 | Read consistency at one projection revision; no write idempotency | 120 per viewer per minute, burst 30 | p95 600 ms, hard 8 s; no external call in request |
| BE25D-GMC19 | Read pinned to guideResult version; cursor is signed and filter-bound | 60 per viewer per minute, burst 15 | p95 800 ms, hard 8 s; no external call in request |
| BE25D-GMC20 | Required key; body hash includes listing/disclosure versions and filters; one active request per listing/version | 10 per seller per 10 minutes, burst 2 | receipt p95 1 s, hard 15 s; worker recomputes asynchronously |
| BE25D-GMC21 | Required key; expected policy version and canonical body hash; serializes storefront pointer update | 20 per seller per hour, burst 3 | p95 900 ms, hard 15 s; statutory evaluator timeout fails closed |

BE-00 stores command idempotency results at least 24 hours. Reads never reveal whether a private result exists. Guide recompute workers use leases and bounded retry; stale guide output is labeled by computedAt and does not become an ungated suggestion.

## Observability

| Operation ID | Metrics | Structured logs and traces | Audit/outbox evidence |
|---|---|---|---|
| BE25D-GMC18 | provenance_read_total by badge; private_suppression_total; latency | requestId, operationId, listing hash, viewer class, screening status, source count | read security audit for private denial; no event |
| BE25D-GMC19 | guide_read_total by outputClass; confidence histogram; declined_total; latency | requestId, operationId, bucket hash, output class, sample bucket, scores | guide view audit for restricted examples; no event |
| BE25D-GMC20 | suggestion_request_total by state/output; declined_total; disabled_total; latency | requestId, operationId, listing hash, versions, guide ID, reason, result | suggestion.created audit; guide recomputed event only from worker |
| BE25D-GMC21 | policy_write_total by statutory status; evaluator_reject_total; version_conflict_total | requestId, operationId, storefront hash, version, region, status, actor class | policy.changed audit; gear_storefront.policy_changed.v1 |

Market worker traces include source class, guide bucket hash, sample/recency/dispersion/integrity buckets, and computation version; they exclude raw sale parties and free-text source payload. Alerts fire on external-source admission attempts at launch, guide confidence regression, policy evaluator failure, and badge/status mismatch.

## Persistence and RLS

All tables are protected schemas with enabled and forced RLS. Direct anon/authenticated table grants are denied. Security-invoker RPCs recheck listing visibility, seller/storefront grant, comp eligibility, guide threshold, expected policy version, and screening state. Derived rows are append-only except current pointers maintained by controlled RPC.

### Complete table definitions

| Table / model | Typed fields with SQL types, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.comp_observations / CompObservation | id uuid PK; listing_id uuid NOT NULL FK platform_private.listings(id); listing_version_id uuid NOT NULL FK platform_private.listing_versions(id); marketplace_unit_id uuid NULL FK platform_private.marketplace_units(id); settled_order_id uuid NOT NULL FK platform_private.orders(id); category_key text NOT NULL CHECK length <= 120; model_bind_id uuid NULL FK platform_private.listing_model_binds(id); condition_class text NOT NULL; originality_aggregate text NOT NULL; amount_minor bigint NOT NULL CHECK amount_minor >= 0; currency char(3) NOT NULL; region char(3) NOT NULL; settled_at timestamptz NOT NULL; eligibility_state text NOT NULL CHECK in pending/admitted/excluded/revoked; exclusion_code text NULL; provenance_hash char(64) NOT NULL; computation_version text NOT NULL CHECK length <= 80; created_at timestamptz NOT NULL; UNIQUE(settled_order_id, listing_version_id) | category_key/model_bind_id/settled_at DESC; condition_class/originality_aggregate; eligibility_state/settled_at; provenance_hash; settled_order_id | Public reads admitted redacted projection; market worker writes through admission RPC; seller/buyer cannot see party identity; forced RLS; no direct client grant |
| platform_private.guide_results / GuideResult | id uuid PK; bucket_key char(64) NOT NULL; category_key text NOT NULL; model_bind_id uuid NULL FK platform_private.listing_model_binds(id); condition_class text NULL; originality_aggregate text NULL; region char(3) NOT NULL; currency char(3) NOT NULL; output_class text NOT NULL CHECK in full/examples_only/declined; low_minor bigint NULL CHECK low_minor >= 0; high_minor bigint NULL CHECK high_minor >= 0; center_minor bigint NULL CHECK center_minor >= 0; sample_count integer NOT NULL CHECK 0 <= sample_count AND sample_count <= 100000; recency_score numeric(5,4) NOT NULL CHECK 0 <= recency_score AND recency_score <= 1; dispersion_score numeric(5,4) NOT NULL CHECK 0 <= dispersion_score AND dispersion_score <= 1; integrity_score numeric(5,4) NOT NULL CHECK 0 <= integrity_score AND integrity_score <= 1; confidence numeric(5,4) NOT NULL CHECK 0 <= confidence AND confidence <= 1; computation_version text NOT NULL; computed_at timestamptz NOT NULL; expires_at timestamptz NOT NULL; UNIQUE(bucket_key, computation_version, computed_at) | bucket_key/computed_at DESC; category_key/region/currency; output_class/computed_at DESC; expires_at | Public reads approved projection only; worker writes append-only; declined rows never expose amounts; forced RLS; no direct client grant |
| platform_private.guide_result_comps | guide_result_id uuid NOT NULL FK platform_private.guide_results(id); comp_observation_id uuid NOT NULL FK platform_private.comp_observations(id); rank smallint NOT NULL CHECK 1 <= rank AND rank <= 20; created_at timestamptz NOT NULL; PRIMARY KEY(guide_result_id, comp_observation_id) | guide_result_id/rank; comp_observation_id | Public reads safe summaries from approved guide; worker-only insert; forced RLS; no direct client grant |
| platform_private.price_suggestion_requests | id uuid PK; listing_id uuid NOT NULL FK platform_private.listings(id); listing_version_id uuid NOT NULL FK platform_private.listing_versions(id); disclosure_version_id uuid NOT NULL FK platform_private.listing_disclosure_versions(id); seller_account_id uuid NOT NULL FK platform_private.seller_accounts(id); guide_result_id uuid NULL FK platform_private.guide_results(id); currency char(3) NOT NULL; region char(3) NOT NULL; state text NOT NULL CHECK in queued/computed/examples_only/declined/disabled/failed; output_class text NULL CHECK in full/examples_only/declined; suggested_low_minor bigint NULL CHECK suggested_low_minor >= 0; suggested_high_minor bigint NULL CHECK suggested_high_minor >= 0; repricing_applied boolean NOT NULL DEFAULT false CHECK repricing_applied=false; reason_code text NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL; completed_at timestamptz NULL; UNIQUE(idempotency_record_id) | listing_id/created_at DESC; seller_account_id/state; state/created_at; guide_result_id | Seller sees own request/result; public cannot read; worker signed RPC updates result; forced RLS; no direct client grant |
| platform_private.listing_provenance_projections | listing_id uuid NOT NULL FK platform_private.listings(id); listing_version_id uuid NOT NULL FK platform_private.listing_versions(id); screening_status text NOT NULL CHECK in clear/pending/hold/unknown; badge text NOT NULL CHECK in clear/pending/hold/unknown; owner_consent_state text NOT NULL CHECK in current/reset/absent; sources jsonb NOT NULL CHECK jsonb_array_length <= 100; evidence_count integer NOT NULL CHECK 0 <= evidence_count AND evidence_count <= 100; custody_boundary_id uuid NULL FK platform_private.custody_boundaries(id); ownership_revision bigint NOT NULL; projected_at timestamptz NOT NULL; projection_version integer NOT NULL CHECK > 0; PRIMARY KEY(listing_id, listing_version_id) | listing_id/projected_at DESC; badge; owner_consent_state; screening_status; custody_boundary_id | Public reads only safe projection; seller/buyer grants add permitted source depth; workers update through projection RPC; forced RLS; no direct client grant |
| platform_private.storefront_policy_versions / StorefrontPolicyVersion | id uuid PK; storefront_id uuid NOT NULL FK platform_private.storefronts(id); seller_account_id uuid NOT NULL FK platform_private.seller_accounts(id); version integer NOT NULL CHECK version > 0; effective_at timestamptz NOT NULL; storefront_mode text NOT NULL CHECK in active/away; returns_window_days integer NOT NULL CHECK 0 <= returns_window_days AND returns_window_days <= 365; return_condition text NOT NULL CHECK in same_condition/unused_only/statutory_only; dispatch_window_days integer NOT NULL CHECK 0 <= dispatch_window_days AND dispatch_window_days <= 60; warranty_text text NOT NULL CHECK length <= 2000; accepted_payment_methods jsonb NOT NULL CHECK jsonb_array_length between 1 and 3; pickup_available boolean NOT NULL; policy_text text NOT NULL CHECK length <= 4000; statutory_region char(3) NOT NULL; inherit_to_future_listings boolean NOT NULL DEFAULT true CHECK inherit_to_future_listings=true; statutory_status text NOT NULL CHECK in compatible/overridden/rejected; state text NOT NULL CHECK in scheduled/active/superseded; created_by uuid NOT NULL FK auth.users(id); created_at timestamptz NOT NULL; UNIQUE(storefront_id, version) | storefront_id/version DESC; seller_account_id/state; effective_at; statutory_region/state | Seller/operator reads own; public reads active sanitized policy; evaluator/service writes via RPC; immutable after insert; forced RLS; no direct client grant |
| platform_private.storefront_policy_current | storefront_id uuid PK FK platform_private.storefronts(id); policy_version_id uuid NOT NULL FK platform_private.storefront_policy_versions(id); updated_at timestamptz NOT NULL | policy_version_id; updated_at | Public reads active safe pointer; only policy RPC updates; forced RLS; no direct client grant |

Database constraints also enforce high_minor >= low_minor, a full GuideResult has a non-null range, a declined result has no amounts, a price request cannot set repricing_applied true, an admitted CompObservation has a settled order and provenance hash, and an active policy is not statutory rejected. JSON values are schema-validated before insertion and bounded in SQL.

### Permission and RLS matrix

| Principal | Read | Insert | Update | Delete |
|---|---|---|---|---|
| anon | Safe provenance, admitted guide projection, active sanitized policy | None | None | None |
| authenticated buyer | Public projection plus order-permitted custody boundary | None | None | None |
| authenticated seller | Own suggestion results and policy versions; safe provenance | Suggestion/policy RPC only | Version/current-pointer RPC only | None |
| market worker | Assigned comp/guide jobs and redacted inputs | Admission/guide RPC only | Append result/current projection RPC only | None |
| statutory evaluator | Policy payload through signed RPC, no seller identity beyond region | Result RPC only | No direct table update | None |
| moderator/support | Redacted market/policy audit projection | None | None | None |
| service role | Controlled migration/redaction/retention procedures | Controlled procedures | Controlled procedures | Retention procedure only |

## State Machines, Concurrency, and Failure Recovery

### Guide, suggestion, provenance, and policy states

| Current | Command/event | Preconditions | Next | Side effects |
|---|---|---|---|---|
| pending comp | admit | settled order, eligible listing/version, provenance and integrity checks | admitted or excluded | emit comp_admitted only for admitted |
| admitted guide input | recompute | normalized bucket and computation version | full, examples_only, or declined | append GuideResult; emit guide_recomputed |
| queued suggestion | compute | current listing/disclosure versions; guide confidence gate | computed, examples_only, declined, or disabled | durable result; never writes listing price |
| clear screening | screening hold | signed screening event | hold | badge changes immediately; suppress source depth |
| pending screening | screening clear | signed clear event and ownership revision current | clear | projection can expose safe clear badge |
| active policy | save new | storefront grant, expected version, statutory evaluator | scheduled/active or rejected | append version, atomically move current pointer if active, emit policy event |
| superseded policy | read | no write permitted | superseded | history retained for orders/legal audit |

An active StorefrontPolicyVersion is the structured default inherited by future listings in that storefront. storefrontMode away stops new listing exposure or new claims according to the evaluated policy, while existing obligations remain serviceable. At claim/order time the applicable policy version is pinned into the order/custody record; taking a storefront away or replacing its policy never removes obligations already pinned to a buyer.

### Market eligibility and confidence

An observation is admitted only when a settled WeJammin order, immutable ListingVersion/DisclosureVersion, ownership/custody reference, normalized category/model/condition bucket, currency/region, and provenance hash are present. Cancelled, refunded, disputed, duplicate, policy-held, theft-held, stale, externally sourced without launch license, or unverifiable observations are excluded. External observations have no admission path in the launch configuration; a future licensed adapter must still record license ID, source hash, reviewer, and terms.

The worker computes sample, recency, dispersion, and integrity scores. The configured threshold is a versioned computation policy: full requires all minimum sample/recency/integrity gates and confidence >= 0.75; examples_only may expose redacted examples when confidence >= 0.45; declined exposes no range or center below that threshold. Threshold changes create a new computation version and never rewrite old GuideResult rows. A price suggestion requires full output, current listing/disclosure versions, eligible stock, no screening hold, and seller grant. Since repricing is disabled at launch, no path updates ListingVersion or price.

### Race and recovery matrix

| Race | Serialization rule | Winner/loser behavior | Recovery |
|---|---|---|---|
| Screening hold versus provenance read | Projection reads screening revision atomically | Hold wins; response badge is hold/pending and source details suppressed | Refetch after signed clear event |
| Listing amendment versus suggestion | Suggestion locks expected version or records mismatch | Amendment wins if committed first; suggestion becomes declined/stale | Request new suggestion with current versions |
| Settlement reversal versus comp admission | Order settlement revision checked before admission | Reversal/exclusion wins; comp is excluded or revoked | Recompute affected bucket |
| Duplicate settled event | Unique order/listing version and source hash | First admission wins; duplicate is no-op | Ack duplicate after canonical refetch |
| Guide recompute versus read | Read selects latest complete result by computation version | In-flight result never partially visible | Continue reading prior labeled result |
| Policy save versus policy save | Storefront advisory lock and expected version | First version wins; stale save returns POLICY_VERSION_CONFLICT | Refetch and resubmit |
| Ownership transfer versus provenance | Ownership revision in projection and transfer event | Transfer invalidates private source depth and may reset badge | Rebuild projection under new owner |

Worker jobs use 2 retries for database contention and 3 bounded retries for transient seams. A lost response is recovered by idempotency lookup for commands. Outbox events are at-least-once and consumers deduplicate eventId plus aggregate/version. Guide poison input is quarantined with no replacement result; prior guide remains explicitly labeled and suggestions decline when stale.

## External Seams

| Seam | Exact request | Exact response | Timeout | Retry/backoff | Circuit behavior |
|---|---|---|---|---|---|
| BE-23 screening/provenance | { listingId, listingVersionId, ownershipRevision, includeCustodyBoundary } | { status, badge, sources[], evidenceCount, custodyBoundaryId?, revision } | 3,000 ms | 2 retries at 150/450 ms for transient | Open after 3 failures in 60 s; return pending/unknown, never clear |
| BE-25b listing/disclosure refetch | { listingId, listingVersionId?, disclosureVersionId? } | { state, listingVersionId, disclosureVersionId, modelBindId?, conditionClass, originality, immutable, published } | 3,000 ms | 2 retries at 150/450 ms | Open after 5 failures in 60 s; suggestions decline, reads use no unverified data |
| BE-25c inventory eligibility | { listingId, operation: market_or_suggestion } | { eligible, unitState, availableQuantity, revision, screeningStatus } | 3,000 ms | 2 retries at 150/450 ms | Open after 5 failures in 60 s; guide read may remain, suggestion declines |
| BE-26 settled order feed | { sinceCursor, listingVersionIds[], include: settlement, refund, dispute } | { cursor, observations: [{ orderId, listingVersionId, unitId, amountMinor, currency, settledAt, status, provenanceHash, revision }] } | 8,000 ms | 3 retries at 250/750/1500 ms for transient | Open after 5 failures in 120 s; pause admission and alert, never fabricate comps |
| Licensed external comp adapter | { licenseId, bucket, sinceCursor } | { cursor, observations[], sourceHash, reviewerId, termsVersion } | 8,000 ms | 2 retries at 300/900 ms when enabled | Permanently open at launch; any attempted external admission is rejected and alerted |
| Statutory policy evaluator | { region, returnsWindowDays, dispatchWindowDays, paymentMethods, policyTextHash } | { status: compatible/overridden/rejected, requiredOverrides[], evaluatorVersion } | 4,000 ms | 2 retries at 200/600 ms | Open after 3 failures in 60 s; policy write fails closed |
| BE-00 job/outbox RPC | { aggregateId, jobType, bodyHash, eventTypes[] } | { jobId, outboxIds[] } | 2,000 ms | Exactly 1 bounded transaction retry after serialization/deadlock at 100 ms with full jitter (50–150 ms); retryable only before commit is known; constraint, validation, and unknown-commit outcomes are terminal for the request and reconcile by `aggregateId` plus `bodyHash`; no independent network retry | Opens after 3 failures in 30 s; half-opens after 30 s with 1 probe; fallback while open is 503 `DEPENDENCY_UNAVAILABLE` with no job/outbox side effect; successful probe closes, failed probe remains open for 60 s; command transaction fails atomically |

External responses are schema-validated, signature/revision checked where available, and stored by hash. No external source can directly expose a guide range or mutate a listing.

## Events and Async Consumers

### Event envelope

Events use BE-00 envelope fields eventId, exact eventType, schemaVersion 1, occurredAt, producer, aggregateType, aggregateId, actorClass, requestId, idempotencyKey hash, payloadHash, and payload. Payloads contain IDs, hashes, output classes, versions, scores as buckets, and safe policy status only. Buyer/seller names, addresses, payment data, raw observations, private serials, and policy free text are excluded.

### Producer and consumer obligations

| Event type | Produced by | Consumers | Idempotency key |
|---|---|---|---|
| gear_market.comp_admitted.v1 | Settlement admission worker | guide recompute, market audit, cache invalidator | eventId plus compObservationId |
| gear_market.guide_recomputed.v1 | Guide worker | public guide projection, suggestion worker, cache invalidator | eventId plus guideResultId/computationVersion |
| gear_storefront.policy_changed.v1 | GMC21 | storefront read projection, checkout policy gate, audit | eventId plus policyVersionId |
| gear_listing.screening_changed.v1 | Consumed from BE-23b | provenance projection, guide/suggestion eligibility | screeningJobId/status/revision |
| gear_inventory.stock_changed.v1 | Consumed from BE-25c | suggestion eligibility and comp admission | eventId plus target/revision |

Consumers acknowledge after durable refetch and projection. A duplicate event cannot admit a second observation, expose a held badge as clear, or move a stale policy pointer.

## Error Matrix

| Operation IDs | Condition | HTTP | Error code | Retry/client action |
|---|---|---:|---|---|
| BE25D-GMC18 | Listing absent, unpublished, or not visible | 404 | PROVENANCE_NOT_FOUND | Do not reveal existence |
| BE25D-GMC18 | Private custody/source depth without grant | 403 | PROVENANCE_FORBIDDEN | Request through authorized order/seller context |
| BE25D-GMC18 | Screening dependency unavailable | 200 | PROVENANCE_PENDING | Display pending/unknown; never clear |
| BE25D-GMC19 | No eligible bucket/result | 404 | GUIDE_NOT_FOUND | Show no guide; do not infer median |
| BE25D-GMC19 | Guide below confidence threshold | 200 | GUIDE_DECLINED | Display declined/examples-only state without range |
| BE25D-GMC19 | Cursor/filter malformed | 400 | INVALID_INPUT | Correct bounded query |
| BE25D-GMC20 | Listing/disclosure versions stale | 409 | VERSION_CONFLICT | Refetch and request using current versions |
| BE25D-GMC20 | No full guide or listing/screening/stock gate | 202 | SUGGESTION_DECLINED | Durable declined result; no numeric suggestion |
| BE25D-GMC20 | Visible listing without seller grant | 403 | SUGGESTION_FORBIDDEN | Use authorized operator |
| BE25D-GMC20 | Repricing requested at launch | 422 | REPRICING_DISABLED | Request suggestion only; no price mutation exists |
| BE25D-GMC21 | Storefront absent/inaccessible | 404 | STOREFRONT_NOT_FOUND | Do not reveal storefront |
| BE25D-GMC21 | Visible storefront without policy grant | 403 | POLICY_WRITE_FORBIDDEN | Use authorized operator |
| BE25D-GMC21 | Stale policy version | 409 | POLICY_VERSION_CONFLICT | Refetch current policy |
| BE25D-GMC21 | Statutory evaluator rejects/inaccessible | 422 or 503 | POLICY_NOT_COMPLIANT or DEPENDENCY_UNAVAILABLE | Apply named override or retry same key |
| All commands | Key reused with different body | 409 | IDEMPOTENCY_KEY_REUSE | New key only for new intent |
| All | Rate limit exceeded | 429 | RATE_LIMITED | Honor Retry-After |
| All | Extra/unsafe/malformed input | 400 | INVALID_INPUT | Correct strict schema |

Every error uses ErrorResponse and BE-00 ApiError { code, message, requestId, details }. Error details contain stable codes and field paths only; unauthorized callers never learn private resource existence.

## Testing Strategy

### Contract and route tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25D-CON-001 | BE25D-GMC18 | Strict listing UUID, bounded flags, safe projection and badge enum are enforced |
| BE25D-CON-002 | BE25D-GMC19 | Filter/cursor/currency bounds and full-range/declined-range superRefine behavior are enforced |
| BE25D-CON-003 | BE25D-GMC20 | Expected versions, idempotency, repricing literal false, and nullable range on declined are enforced |
| BE25D-CON-004 | BE25D-GMC21 | Policy bounds, accepted methods, legal confirmation and strict operation response are enforced |
| BE25D-ROUTE-001 | BE25D-GMC18 through BE25D-GMC21 | Method/path registry is exact and no alias bypasses CORS/auth/validation |

### Authorization and privacy tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25D-AUTH-001 | BE25D-GMC18 through BE25D-GMC21 | Hidden resource is 404; visible missing grant is 403; no existence leakage |
| BE25D-AUTH-002 | BE25D-GMC18 | Public/buyer/seller provenance depth redacts source IDs, evidence, custody and party identity correctly |
| BE25D-AUTH-003 | BE25D-GMC20 | Seller ownership/version gate prevents suggestions for another seller or pinned stale version |
| BE25D-AUTH-004 | BE25D-GMC21 | Storefront delegation and statutory region checks prevent cross-seller policy writes |

### Persistence, idempotency, and concurrency tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25D-DB-001 | BE25D-GMC18 through BE25D-GMC21 | Forced RLS denies direct table access; safe projections and RPC grants match matrix |
| BE25D-DB-002 | BE25D-GMC20, BE25D-GMC21 | Same key/body replays result; same key/different body returns IDEMPOTENCY_KEY_REUSE |
| BE25D-DB-003 | BE25D-GMC19, BE25D-GMC20 | Guide recompute/read and stale suggestion races never expose partial or ungated values |
| BE25D-DB-004 | BE25D-GMC21 | Concurrent policy writes serialize; stale expected version cannot move current pointer |
| BE25D-DB-005 | All assigned operations | SQL types, nullability, constraints/FKs, indexes, RLS, grants, append-only versions and guide range invariants are migration-tested |

### Domain, seam, event, and recovery tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25D-DOM-001 | BE25D-GMC18 | Positive/pending/unknown screening never presents clear; transfer revision suppresses private source depth |
| BE25D-DOM-002 | BE25D-GMC19 | Only settled eligible observations admit; external/unlicensed/cancelled/refunded/disputed rows exclude |
| BE25D-DOM-003 | BE25D-GMC19, BE25D-GMC20 | Confidence gates produce full/examples_only/declined; declined has no numeric range; no ungated median/suggestion |
| BE25D-DOM-004 | BE25D-GMC20 | Request is durable and repricing remains false/disabled under every path |
| BE25D-DOM-005 | BE25D-GMC21 | Policy versions immutable; statutory evaluator overrides/rejects correctly; platform safeguards cannot be weakened |
| BE25D-SEAM-001 | BE25D-GMC18 through BE25D-GMC21 | BE-23, BE-25b, BE-25c, BE-26, licensed adapter, evaluator, and BE-00 timeout/retry/circuit rules are exact |
| BE25D-EVT-001 | BE25D-GMC18 through BE25D-GMC21 | Event payload privacy, outbox atomicity, duplicate delivery and projection refetch are verified |
| BE25D-REC-001 | BE25D-GMC18 through BE25D-GMC21 | Dependency outage, poison comp, stale guide, lost response, lease expiry, and policy conflict recover as specified |

## Deepening Passes

| Pass | Question | Resolution and evidence |
|---|---|---|
| D1 provenance safety | Can a pending or held screening state look clear? | No. Badge equals pending/hold/unknown until signed clear with current revision |
| D2 market authority | Can an external or unsold observation create a comp? | No. Launch admission requires settled WeJammin order and provenance; external adapter is circuit-open |
| D3 confidence | Can a low sample yield a numeric median/range? | No. GuideResult output class and database/response invariants suppress range below threshold |
| D4 suggestion safety | Can a suggestion silently reprice a listing? | No. requestRepricing is literal false, repricingApplied is false, and no route writes ListingVersion price |
| D5 privacy | Can public responses leak parties, evidence or serials? | No. Projection and payload fields are redacted; source hashes are safe references |
| D6 policy law | Can seller text waive statutory/platform protection? | No. Server evaluator can override/reject and platform guards are non-waivable |
| D7 concurrency | Can guide, transfer, settlement, or policy races expose stale truth? | No. Revisions, expected versions, locks, append-only guide/policy rows, and current pointers resolve races |
| D8 reliability | What happens during dependency outage or lost response? | Reads return safe labeled status; commands use idempotency; workers lease/retry/quarantine; no fabricated result |
| D9 persistence | Are comp/guide/suggestion/provenance/policy fields implementable? | Each table specifies SQL types, nullability, constraints/FKs, indexes, RLS and grants |
| D10 auditability | Can every operation be traced and tested? | Operation registry, contract/error/auth/middleware/idempotency/rate/observability rows and keyed tests cover GMC18–GMC21 |

## Ambiguity Gate

**PASS.** Evidence: interactions 25.18–25.21 map one-to-one to BE25D-GMC18–GMC21; CompObservation, GuideResult, and StorefrontPolicyVersion authority is explicit; provenance screening and transfer behavior, settled-comp admission, confidence/output classes, no-ungated-price and launch repricing disablement, statutory policy evaluation, ownership, 403/404, CORS policy gear-api, global ApiError, typed persistence/RLS/grants, exact external seams, event privacy, race recovery, and operation-keyed tests are specified. Catalog/listing/inventory/theft-adjudication routes are referenced without duplication.

## Open Questions

None

## Dependency References

- BE-00 platform contracts in 00-infrastructure.md: strict Zod 4, ApiError { code, message, requestId, details }, CORS, idempotency, outbox, forced RLS, audit, and rate classes.
- BE-23b screening in 23b-theft-screening-recovery.md: status, hold, and clear revision; this companion never adjudicates theft.
- BE-25a catalog in 25a-gear-catalog-authority-matching.md: ListingModelBind and CategorySchemaVersion normalization.
- BE-25b listing lifecycle in 25b-gear-listing-disclosure-lifecycle.md: ListingVersion, DisclosureVersion, evidence, publication, and buyer pins.
- BE-25c inventory in 25c-gear-inventory-bulk-channels.md: MarketplaceUnit/StockLine availability and screening eligibility.
- BE-26 settled order service: worker feed used to admit only settled WeJammin observations; no checkout route is duplicated.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-08-28 | Initial production-grade BE companion for interactions 25.18–25.21; provenance, settled comps, confidence-gated guides/suggestions, storefront policy versions, strict contracts, persistence/RLS, eventing, recovery, and ambiguity evidence added |
