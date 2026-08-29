# BE-25c — Gear Inventory, Bulk Listing, and Channel Availability

Status: implementation-ready backend contract for Shard 25 interactions 25.14–25.17. This companion owns stock quantity semantics, inventory claims, bundles and B-stock composition, bulk import/list orchestration, and external channel availability. Listing disclosure/publication remains in BE-25b; catalog authority remains in BE-25a; provenance, market guides, and storefront policy remain in BE-25d.

## Classification

| Field | Decision |
|---|---|
| Backend boundary | Seller-owned stock and atomic availability reservations, including counted stock and individually identified units |
| Assigned interactions | 25.14 Claim inventory; 25.15 Create bundle/parts/B-stock; 25.16 Bulk import/list; 25.17 Sync external availability |
| Operation IDs | BE25C-GMC14 through BE25C-GMC17 |
| Primary actors | Seller, delegated inventory operator, channel manager, and bounded import/sync workers |
| Non-goals | Listing disclosure and publication gates, catalog matching, checkout/payment capture, theft adjudication, price guides, and dealer/MAP policies |
| Locked product decisions | Qty-one and counted stock are distinct; a claim is atomic and carts do not claim inventory; bundles require all constituents; B-stock/parts expose distinct condition; channel sync is freshness-bounded and cannot manufacture ownership |
| Platform dependency | BE-00 global contracts, idempotency, outbox, RLS, CORS, rate classes, and audit ordering apply to every operation |

The boundary is valid because the IA distinguishes a purchasable unit from a listing and requires claim arbitration to be atomic. A listing can exist without a claim, but checkout eligibility is never inferred from an unclaimed draft or stale external channel quantity.

## Referenced Material Inventory

| Source | Section and line trace | Material used |
|---|---|---|
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Shard decisions, lines 1–40 | Qty-one versus counted stock, claim arbitration, bundle/B-stock, channel and outage rules |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Interactions table, lines 79–99 | Exact interaction IDs 25.14, 25.15, 25.16, and 25.17 |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Command contracts, lines 105–116 | ClaimInventory and CreateBundle command contracts; bulk and channel command boundaries |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Data Models, lines 130–144 | MarketplaceUnit, StockLine, InventoryClaim and their relationships to Listing and ListingVersion |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Event Schemas, lines 213–224 | gear_inventory.claim_resolved.v1, gear_inventory.stock_changed.v1, gear_listing.screening_changed.v1 |
| .memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md | Lifecycle and inventory, lines 33–42 | Buyer pinning, atomic qty-one/count decrement, loser alternatives, holds, sold immutability |
| .memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md | Races, lines 127–139 | Buy Now versus offer, bundle versus constituent, screening outage and claim races |
| .memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md | Listing truth, lines 22–31 | Listing/version is distinct from MarketplaceUnit and disclosure evidence |
| .memory/wiki/specs/be/00-infrastructure.md | Zod/error rules, lines 112–153 | Strict Zod 4, global ApiError { code, message, requestId, details }, bounded errors |
| .memory/wiki/specs/be/00-infrastructure.md | RLS/grants and transactions, lines 208–308 | Forced RLS, RPC-only mutation, idempotency, audit/outbox, retry and route archetype controls |
| .memory/wiki/specs/be/23a-gear-identity-claims-transfers.md | Ownership/transfer dependency | Seller custody and ownership grant are revalidated before claim or channel exposure |
| .memory/wiki/specs/be/23b-theft-screening-recovery.md | Screening dependency | Positive hit holds the unit/listing; screening outage never produces a clear availability badge |
| .memory/wiki/specs/be/25b-gear-listing-disclosure-lifecycle.md | Listing lifecycle dependency | ListingVersion, publication state, material changes and buyer-pinned versions are consumed, not redefined |

## IA Source Map

### Assigned interactions

| IA ID | IA name | Backend responsibility | Operation |
|---|---|---|---|
| 25.14 | Claim inventory | Atomically claim a qty-one unit or decrement counted stock under seller/ownership and version guards | BE25C-GMC14 |
| 25.15 | Create bundle/parts/B-stock | Compose all-or-none bundle constituents, or create separate parts/B-stock units with explicit condition and listing links | BE25C-GMC15 |
| 25.16 | Bulk import/list | Validate a bounded manifest, dry-run row outcomes, and commit accepted rows with per-row idempotency | BE25C-GMC16 |
| 25.17 | Sync external availability | Reconcile licensed/authorized channel quantities using monotonic sync tokens and freshness; never overstate platform stock | BE25C-GMC17 |

### Canonical Data Models

| IA model | This companion representation | Ownership |
|---|---|---|
| MarketplaceUnit | One identified or counted purchasable unit with quantity mode and availability state | Authoritative here |
| StockLine | Seller/category stock aggregate for counted inventory and channel allocation | Authoritative here |
| InventoryClaim | Atomic claim/reservation with actor, purpose, expected version, and expiration | Authoritative here |
| Listing | Stable listing reference consumed from BE-25b | 25b authoritative |
| ListingVersion | Immutable version pinned by a claim/order | 25b authoritative |
| DisclosureVersion | Condition and evidence reference checked before channel exposure | 25b authoritative |
| ListingModelBind | Catalog match reference used for import dedupe | 25a authoritative |

### Event Schemas

| Event type | Producer operation | Delivery invariant |
|---|---|---|
| gear_inventory.claim_resolved.v1 | BE25C-GMC14 and BE25C-GMC16 accepted claim rows | Claim result, quantity delta, unit/stock IDs, and reason; no payment or private address |
| gear_inventory.stock_changed.v1 | BE25C-GMC14, BE25C-GMC15, BE25C-GMC16, BE25C-GMC17 | Previous/new availability, source revision, and listing references; consumers refetch current state |
| gear_listing.screening_changed.v1 | Consumed from BE-23b/worker | A positive hit outranks channel availability and holds exposure |

The full Shard 25 event inventory remains mechanically traceable here: gear_catalog.assertion_submitted.v1, gear_catalog.resolution_changed.v1, gear_listing.model_bind_changed.v1, gear_listing.disclosure_changed.v1, gear_listing.published.v1, gear_listing.state_changed.v1, gear_inventory.claim_resolved.v1, gear_inventory.stock_changed.v1, gear_listing.screening_changed.v1, gear_market.comp_admitted.v1, gear_market.guide_recomputed.v1, and gear_storefront.policy_changed.v1. This companion produces only inventory events and consumes listing/screening events.

## Endpoint Reconciliation

BE-00 owns auth/session, generic upload, idempotency inspection, and global errors. BE-23 owns gear identity, custody/transfer, theft-screening adjudication and ownership grants. BE-25a owns catalog/model/fitment routes. BE-25b owns listing/disclosure/publication/state routes. BE-25d owns provenance, market, and policy routes. Checkout/order reservation remains a downstream consumer; this companion does not capture money or create an order. No route below aliases those boundaries.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Capability | Archetype | Success |
|---|---|---|---|---|---|---|
| BE25C-GMC14 | POST | /api/v1/gear/inventory/claims | 25.14 | inventory.claim | protected atomic command | 201 ClaimSuccess |
| BE25C-GMC15 | POST | /api/v1/gear/inventory/bundles | 25.15 | inventory.bundle.create | ordinary command | 201 BundleSuccess |
| BE25C-GMC16 | POST | /api/v1/gear/inventory/bulk-imports | 25.16 | inventory.bulk.import | long-running command | 202 BulkImportSuccess |
| BE25C-GMC17 | POST | /api/v1/gear/inventory/channel-syncs | 25.17 | inventory.channel.sync | protected command | 202 ChannelSyncSuccess |

The registry is the sole source of method/path truth. Each command returns requestId, operationId, idempotency key echo, and durable job/claim identifiers. Bulk and channel work is asynchronous and does not pretend that a queued request has changed availability.

### Request/response contracts (Zod 4)

The following strict schemas use Zod 4. Unknown keys reject with INVALID_INPUT. UUID, enum, quantity, timestamp, token, text, and hash bounds are checked before any transaction. Every success response contains requestId. Every failure uses BE-00 ApiError { code, message, requestId, details } through ErrorResponse.

~~~ts
import { z } from "zod";
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });

const Uuid = z.string().uuid();
const Instant = z.string().datetime({ offset: true });
const Text = (max: number) => z.string().trim().min(1).max(max);
const IdempotencyKey = z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/);
const PositiveInt = z.number().int().positive().max(1000000000);
const QuantityMode = z.enum(["qty_one", "counted"]);
const StockState = z.enum(["available", "reserved", "sold", "held", "exhausted"]);
const ClaimPurpose = z.enum(["listing", "checkout", "transfer", "bundle", "bulk"]);
const ConditionClass = z.enum(["new", "open_box", "used", "b_stock", "parts", "non_functioning"]);

const ExpectedStock = z.object({
  stockLineId: Uuid.nullable(),
  marketplaceUnitId: Uuid.nullable(),
  expectedRevision: z.number().int().nonnegative().max(2147483647),
  quantity: PositiveInt
}).strict().superRefine((v, ctx) => {
  if ((v.stockLineId === null) === (v.marketplaceUnitId === null)) {
    ctx.addIssue({ code: "custom", path: ["stockLineId"], message: "exactly one stock target is required" });
  }
});

export const Gmc14Request = z.object({
  idempotencyKey: IdempotencyKey,
  sellerAccountId: Uuid,
  expectedListingVersionId: Uuid.nullable(),
  expectedPriceMinor: z.number().int().nonnegative().max(1000000000).nullable(),
  target: ExpectedStock,
  purpose: ClaimPurpose,
  claimantType: z.enum(["seller", "checkout", "worker"]),
  claimTtlSeconds: z.number().int().min(30).max(86400),
  allowAlternatives: z.boolean().default(false)
}).strict();

const BundleComponent = z.object({
  marketplaceUnitId: Uuid,
  quantity: PositiveInt,
  role: z.enum(["primary", "included", "part", "b_stock"]),
  condition: ConditionClass
}).strict();

export const Gmc15Request = z.object({
  idempotencyKey: IdempotencyKey,
  sellerAccountId: Uuid,
  listingId: Uuid.nullable(),
  title: Text(180),
  description: z.string().trim().max(2000).default(""),
  components: z.array(BundleComponent).min(2).max(100),
  atomic: z.literal(true),
  reserveTtlSeconds: z.number().int().min(60).max(86400)
}).strict().superRefine((v, ctx) => {
  const ids = v.components.map(x => x.marketplaceUnitId);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: "custom", path: ["components"], message: "bundle components must be unique" });
  }
});

const ImportRow = z.object({
  clientRowId: z.string().regex(/^[A-Za-z0-9._:-]{1,80}$/),
  externalKey: Text(180),
  title: Text(180),
  quantityMode: QuantityMode,
  quantity: PositiveInt,
  condition: ConditionClass,
  categoryKey: z.string().regex(/^[a-z0-9_.:-]{1,120}$/),
  listingModelBindId: Uuid.nullable(),
  unmatchedModelLabel: z.string().trim().max(180).nullable(),
  mediaObjectIds: z.array(Uuid).max(20),
  disclosureVersionId: Uuid.nullable(),
  defaultedFields: z.array(z.string().regex(/^[a-z0-9_]{1,80}$/)).max(20)
}).strict();

export const Gmc16Request = z.object({
  idempotencyKey: IdempotencyKey,
  sellerAccountId: Uuid,
  organizationEntityId: Uuid.nullable(),
  sourceName: Text(120),
  mode: z.enum(["validate", "commit"]),
  allowPartial: z.boolean().default(false),
  rows: z.array(ImportRow).min(1).max(500),
  sourceRevision: z.string().regex(/^[A-Za-z0-9._:-]{1,120}$/)
}).strict().superRefine((v, ctx) => {
  const keys = v.rows.map(x => x.externalKey);
  if (new Set(keys).size !== keys.length) {
    ctx.addIssue({ code: "custom", path: ["rows"], message: "external keys must be unique in one batch" });
  }
  for (const [i, row] of v.rows.entries()) {
    if (row.listingModelBindId !== null && row.unmatchedModelLabel !== null) {
      ctx.addIssue({ code: "custom", path: ["rows", i], message: "model binding and unmatched label are mutually exclusive" });
    }
  }
});

const ChannelTarget = z.object({
  channel: z.enum(["authorized_partner", "seller_store", "licensed_marketplace"]),
  channelAccountRef: Text(180),
  listingIds: z.array(Uuid).min(1).max(500),
  requestedRevision: z.string().regex(/^[A-Za-z0-9._:-]{1,120}$/).nullable()
}).strict();

export const Gmc17Request = z.object({
  idempotencyKey: IdempotencyKey,
  sellerAccountId: Uuid,
  targets: z.array(ChannelTarget).min(1).max(20),
  mode: z.enum(["availability_only", "availability_and_pause"]),
  maxAgeSeconds: z.number().int().min(30).max(86400),
  consentToTransmit: z.literal(true)
}).strict();

const BaseSuccess = z.object({
  requestId: Uuid,
  operationId: z.string().regex(/^BE25C-GMC(1[4-7])$/),
  idempotencyKey: IdempotencyKey,
  occurredAt: Instant
}).strict();

export const ClaimSuccess = BaseSuccess.extend({
  inventoryClaimId: Uuid,
  marketplaceUnitId: Uuid.nullable(),
  stockLineId: Uuid.nullable(),
  claimedQuantity: PositiveInt,
  expiresAt: Instant,
  revision: z.number().int().positive(),
  eventId: Uuid
}).strict();

export const BundleSuccess = BaseSuccess.extend({
  bundleUnitId: Uuid,
  bundleListingId: Uuid.nullable(),
  componentCount: z.number().int().min(2).max(100),
  state: z.enum(["draft", "available", "held"]),
  revision: z.number().int().positive(),
  eventId: Uuid
}).strict();

export const BulkImportSuccess = BaseSuccess.extend({
  bulkImportId: Uuid,
  state: z.enum(["validated", "queued", "running", "completed", "partial", "failed"]),
  acceptedRows: z.number().int().nonnegative().max(500),
  rejectedRows: z.number().int().nonnegative().max(500),
  resultUrl: z.string().url().nullable(),
  eventId: Uuid.nullable()
}).strict();

export const ChannelSyncSuccess = BaseSuccess.extend({
  channelSyncId: Uuid,
  state: z.enum(["queued", "running", "completed", "partial", "failed"]),
  targetCount: z.number().int().positive().max(20),
  listingCount: z.number().int().positive().max(500),
  expiresAt: Instant,
  eventId: Uuid.nullable()
}).strict();

export const ApiError = z.object({
  code: z.string().regex(/^[A-Z0-9_]{3,64}$/),
  message: z.string().min(1).max(240),
  requestId: Uuid,
  details: BE00ErrorDetails
}).strict();

export const ErrorResponse = z.object({ error: ApiError }).strict();
~~~

The API never returns a raw channel credential, seller address, buyer payment data, private serial, or evidence bytes. Import resultUrl is a BE-00 authorized object reference and may be null until the job completes. An idempotency key reused with a different canonical body hash returns IDEMPOTENCY_KEY_REUSE.

### Contract Registry

| Operation ID | Request schema | Success schema | Global error contract | Commit boundary |
|---|---|---|---|---|
| BE25C-GMC14 | Gmc14Request strict; exactly one target and bounded TTL | ClaimSuccess with unit/stock target and revision | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Claim, stock revision, audit, event outbox, and idempotency result commit atomically |
| BE25C-GMC15 | Gmc15Request strict; two or more unique components and atomic true | BundleSuccess with bundle state and revision | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Bundle, component links, claim reservations, audit, event outbox commit atomically |
| BE25C-GMC16 | Gmc16Request strict; max 500 rows and unique external keys | BulkImportSuccess; validate mode does not mutate stock | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Batch receipt and job commit; each commit row uses row hash/idempotency and outbox transaction |
| BE25C-GMC17 | Gmc17Request strict; consent literal true and freshness bound | ChannelSyncSuccess; queued state is not availability | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Sync receipt and job commit; each channel result updates availability atomically |

## Authorization and Ownership

| Operation ID | Actor and role | Ownership/standing check | 403 versus 404 |
|---|---|---|---|
| BE25C-GMC14 | Seller or seller_inventory_operator; checkout service worker with signed grant | sellerAccountId owns stock or has active delegation; ownership/custody and listing version are revalidated | Inaccessible target is 404 INVENTORY_NOT_FOUND; visible target without claim grant is 403 INVENTORY_CLAIM_FORBIDDEN |
| BE25C-GMC15 | Seller or seller_inventory_operator | Seller owns every component and may compose each quantity; no component is sold, held by another claim, or theft-held | Unknown component set is 404; visible components lacking composition grant return 403 |
| BE25C-GMC16 | Seller, seller_inventory_operator, or authorized organisation_listing_operator | Seller account or organization entity owns import source and all supplied object refs; channel credentials never accepted from body | Unknown seller/source is 404; known seller or organization without bulk grant is 403 |
| BE25C-GMC17 | Seller or seller_channel_operator | Seller owns channel connection and every requested listing; partner entitlement and transmission consent checked | Hidden listing/channel is 404; visible listing with no channel grant is 403 |

Ownership does not transfer because an external source reports quantity. BE-23 ownership and custody grant remain authoritative. A seller may claim only available stock; a channel sync can reduce exposure but cannot create a claim or increase platform quantity beyond a verified platform stock line.

## Middleware and Security

### Per-operation middleware registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
|---|---|---|---|
| BE25C-GMC14 | requestId → CORS → auth → actor context → rate limit → idempotency → strict body validation → ownership/custody → transaction lock → handler → audit/outbox | CORS policy gear-api; allowlisted web origins; credentials only for approved origins | max body 64 KiB; no client quantity bypass; signed checkout worker token; CSRF for cookie auth |
| BE25C-GMC15 | requestId → CORS → auth → actor context → rate limit → idempotency → strict body validation → ownership → component lock → handler → audit/outbox | CORS policy gear-api; allowlisted web origins; credentials only for approved origins | max body 128 KiB; unique component check; all-or-none transaction; no recursive bundles |
| BE25C-GMC16 | requestId → CORS → auth → actor context → rate limit → idempotency → strict body validation → ownership → import policy → job enqueue | CORS policy gear-api; allowlisted web origins; credentials only for approved origins | max body 1 MiB; 500-row cap; external key normalization; object/media grant and malware state |
| BE25C-GMC17 | requestId → CORS → auth → actor context → rate limit → idempotency → strict body validation → channel grant → job enqueue | CORS policy gear-api; allowlisted web origins; credentials only for approved origins | max body 256 KiB; no credentials in body; target/listing authorization; outbound allowlist |

Channel secrets are loaded server-side from the protected secret store by channelAccountRef. Logs contain channel name and secret fingerprint only. External quantity is treated as untrusted input until schema, signature, revision, and freshness checks pass.

## Idempotency, Rate Limits, and SLOs

| Operation ID | Idempotency and concurrency | Rate limit | SLO and timeout |
|---|---|---|---|
| BE25C-GMC14 | Required key; body hash includes target, quantity, purpose and expected revision; advisory lock target; replay stable | 30 per seller per minute, burst 5 | p95 1 s, hard 15 s; lock retry 2 at 50/150 ms |
| BE25C-GMC15 | Required key; sorted component hash; locks all component IDs in order; no partial commit | 10 per seller per minute, burst 3 | p95 1.5 s, hard 15 s; lock retry 2 at 50/150 ms |
| BE25C-GMC16 | Required key; batch hash and each clientRowId hash; one batch job per source revision | 5 per seller per 10 minutes, burst 1 | receipt p95 1 s, hard 15 s; worker retries per row, not whole batch |
| BE25C-GMC17 | Required key; target/revision hash; one active sync per seller/channel/listing set | 10 per seller per 10 minutes, burst 2 | receipt p95 1 s, hard 15 s; worker seam policy below |

BE-00 idempotency records retain command results at least 24 hours. A database or queue outage fails closed for claims and returns a durable queued result only after the job receipt and idempotency row commit.

## Observability

| Operation ID | Metrics | Structured logs and traces | Audit/outbox evidence |
|---|---|---|---|
| BE25C-GMC14 | claim_total by result/purpose; claim_conflict_total; quantity_delta; latency | requestId, operationId, seller hash, target type/hash, quantity bucket, result | inventory.claim.created/resolved audit; gear_inventory.claim_resolved.v1 and stock_changed.v1 |
| BE25C-GMC15 | bundle_create_total; component_conflict_total; bundle_quantity; latency | requestId, operationId, component count/hash, seller hash, result | bundle.created audit; gear_inventory.stock_changed.v1 |
| BE25C-GMC16 | import_batch_total by state; row_accept/reject totals; duplicate_row_total; latency | requestId, operationId, batch ID, source name hash, row counts, reason histogram | import.received/row_committed audit; stock_changed.v1 for accepted rows |
| BE25C-GMC17 | channel_sync_total by channel/state; stale_result_total; external_error_total; latency | requestId, operationId, sync ID, channel, target count, revision, freshness bucket | channel_sync.started/completed audit; stock_changed.v1 for authoritative changes |

Tracing records no channel credential, raw external key, private serial, buyer identity, or media URL. Alert thresholds: claim conflict spikes, negative quantity attempts, repeated stale sync, channel circuit open, and any stock invariant violation.

## Persistence and RLS

All tables below are in protected schemas with enabled and forced RLS. Direct anon/authenticated table grants are denied. Security-invoker RPCs recheck actor, seller delegation, ownership/custody, expected revisions, claim state, and channel grant. Every state mutation writes audit and, where named, outbox in the same transaction.

### Complete table definitions

| Table / model | Typed fields with SQL types, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.marketplace_units / MarketplaceUnit | id uuid PK; seller_account_id uuid NOT NULL FK platform_private.seller_accounts(id); listing_id uuid NULL FK platform_private.listings(id); listing_version_id uuid NULL FK platform_private.listing_versions(id); quantity_mode text NOT NULL CHECK in qty_one/counted; unit_key text NULL CHECK length <= 180; quantity integer NOT NULL CHECK quantity > 0; available_quantity integer NOT NULL CHECK 0 <= available_quantity AND available_quantity <= quantity; condition_class text NOT NULL CHECK in new/open_box/used/b_stock/parts/non_functioning; state text NOT NULL CHECK in available/reserved/sold/held/exhausted; revision integer NOT NULL DEFAULT 1 CHECK > 0; theft_status text NOT NULL CHECK in unknown/clear/hold; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(seller_account_id, unit_key) when unit_key nonnull | seller_account_id/state; listing_id/state; partial available index; unique seller/unit_key; revision lookup | Seller/delegate sees own units; public sees only eligible available projection; screening worker may place hold; forced RLS; no direct client grant |
| platform_private.stock_lines / StockLine | id uuid PK; seller_account_id uuid NOT NULL FK platform_private.seller_accounts(id); listing_id uuid NULL FK platform_private.listings(id); category_key text NOT NULL CHECK length <= 120; external_key text NULL CHECK length <= 180; quantity_mode text NOT NULL CHECK counted; quantity integer NOT NULL CHECK > 0; available_quantity integer NOT NULL CHECK 0 <= available_quantity AND available_quantity <= quantity; reserved_quantity integer NOT NULL DEFAULT 0 CHECK >= 0; sold_quantity integer NOT NULL DEFAULT 0 CHECK >= 0; revision integer NOT NULL DEFAULT 1 CHECK > 0; source text NOT NULL CHECK in platform/import/channel; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(seller_account_id, external_key) when external_key nonnull | seller_account_id/category_key; listing_id; external_key; partial available index; revision | Seller/delegate own rows; channel worker updates through signed RPC; public only projection; forced RLS; no direct client grant |
| platform_private.inventory_claims / InventoryClaim | id uuid PK; seller_account_id uuid NOT NULL FK platform_private.seller_accounts(id); marketplace_unit_id uuid NULL FK platform_private.marketplace_units(id); stock_line_id uuid NULL FK platform_private.stock_lines(id); listing_version_id uuid NULL FK platform_private.listing_versions(id); claimant_id uuid NULL FK auth.users(id); purpose text NOT NULL CHECK in listing/checkout/transfer/bundle/bulk; quantity integer NOT NULL CHECK > 0; expected_price_minor bigint NULL CHECK expected_price_minor >= 0; expected_price_currency char(3) NULL; state text NOT NULL CHECK in pending/active/released/expired/rejected/converted; expected_revision integer NOT NULL; resulting_revision integer NULL; expires_at timestamptz NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL; released_at timestamptz NULL; CHECK exactly one unit/stock target | seller_account_id/state; target partial indexes; expires_at/state; listing_version_id/state; expected_price_minor; idempotency_record_id UNIQUE | Seller sees own claims; checkout sees signed claim projection; worker sees only assigned jobs; forced RLS; no direct client grant |
| platform_private.bundle_units | id uuid PK; seller_account_id uuid NOT NULL FK platform_private.seller_accounts(id); listing_id uuid NULL FK platform_private.listings(id); title text NOT NULL CHECK length between 1 and 180; description text NOT NULL DEFAULT ''; state text NOT NULL CHECK in draft/available/held/sold/ended; revision integer NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | seller_account_id/state; listing_id; state/updated_at DESC | Seller/delegate own rows; public eligible projection only; forced RLS; no direct client grant |
| platform_private.bundle_components | bundle_unit_id uuid NOT NULL FK platform_private.bundle_units(id); marketplace_unit_id uuid NOT NULL FK platform_private.marketplace_units(id); quantity integer NOT NULL CHECK > 0; role text NOT NULL CHECK in primary/included/part/b_stock; condition_class text NOT NULL CHECK in new/open_box/used/b_stock/parts/non_functioning; created_at timestamptz NOT NULL; PRIMARY KEY(bundle_unit_id, marketplace_unit_id) | marketplace_unit_id; bundle_unit_id | Access follows bundle seller and component owner; insert only atomic bundle RPC; updates/deletes denied; forced RLS; no direct client grant |
| platform_private.bulk_import_batches | id uuid PK; seller_account_id uuid NOT NULL FK platform_private.seller_accounts(id); organization_entity_id uuid NULL FK identity.entities(id); source_name text NOT NULL CHECK length <= 120; source_revision text NOT NULL CHECK length <= 120; mode text NOT NULL CHECK in validate/commit; state text NOT NULL CHECK in validated/queued/running/completed/partial/failed; row_count integer NOT NULL CHECK 1 <= row_count AND row_count <= 500; accepted_count integer NOT NULL DEFAULT 0 CHECK >= 0; rejected_count integer NOT NULL DEFAULT 0 CHECK >= 0; manifest_hash char(64) NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL; completed_at timestamptz NULL; CHECK seller_account_id or organization_entity_id is authorized; UNIQUE(seller_account_id, source_name, source_revision) | seller_account_id/created_at DESC; organization_entity_id/created_at DESC; state; source_name/source_revision; manifest_hash | Seller or authorized organisation role sees own batch/status; worker assigned batch only; forced RLS; no direct client grant |
| platform_private.bulk_import_rows | id uuid PK; batch_id uuid NOT NULL FK platform_private.bulk_import_batches(id); client_row_id text NOT NULL CHECK length <= 80; external_key text NOT NULL CHECK length <= 180; row_hash char(64) NOT NULL; defaulted_fields jsonb NOT NULL DEFAULT '[]' CHECK jsonb_array_length <= 20; state text NOT NULL CHECK in pending/accepted/rejected/duplicate/committed; reason_code text NULL; marketplace_unit_id uuid NULL FK platform_private.marketplace_units(id); stock_line_id uuid NULL FK platform_private.stock_lines(id); error_details jsonb NOT NULL DEFAULT '{}'; created_at timestamptz NOT NULL; UNIQUE(batch_id, client_row_id); UNIQUE(batch_id, external_key) | batch_id/state; external_key; row_hash; marketplace_unit_id; stock_line_id | Seller sees own rows through batch projection; worker mutates assigned batch; forced RLS; no direct client grant |
| platform_private.channel_connections | id uuid PK; seller_account_id uuid NOT NULL FK platform_private.seller_accounts(id); channel text NOT NULL CHECK in authorized_partner/seller_store/licensed_marketplace; channel_account_ref text NOT NULL CHECK length <= 180; credential_secret_ref text NOT NULL; status text NOT NULL CHECK in active/paused/revoked/error; last_success_at timestamptz NULL; last_revision text NULL; created_at timestamptz NOT NULL; UNIQUE(seller_account_id, channel, channel_account_ref) | seller_account_id/status; channel/status; last_success_at | Seller may view redacted status; channel worker only reads secret through vault RPC; forced RLS; no direct client grant |
| platform_private.channel_availability | id uuid PK; connection_id uuid NOT NULL FK platform_private.channel_connections(id); listing_id uuid NOT NULL FK platform_private.listings(id); external_listing_key text NOT NULL CHECK length <= 180; external_revision text NOT NULL CHECK length <= 120; external_quantity integer NOT NULL CHECK >= 0; platform_quantity integer NOT NULL CHECK >= 0; freshness_deadline timestamptz NOT NULL; state text NOT NULL CHECK in fresh/stale/error/held; source_hash char(64) NOT NULL; observed_at timestamptz NOT NULL; created_at timestamptz NOT NULL; UNIQUE(connection_id, external_listing_key, external_revision) | connection_id/state; listing_id/state; freshness_deadline; external key/revision | Seller sees own redacted availability; channel worker writes signed RPC; public reads derived eligibility only; forced RLS; no direct client grant |
| platform_private.channel_sync_jobs | id uuid PK; seller_account_id uuid NOT NULL FK platform_private.seller_accounts(id); connection_id uuid NOT NULL FK platform_private.channel_connections(id); requested_revision text NULL; state text NOT NULL CHECK in queued/running/completed/partial/failed; attempts smallint NOT NULL DEFAULT 0 CHECK 0 <= attempts AND attempts <= 8; next_attempt_at timestamptz NULL; lease_until timestamptz NULL; last_error_code text NULL; created_at timestamptz NOT NULL; completed_at timestamptz NULL | seller_account_id/state; connection_id/state; lease_until; next_attempt_at | Worker-only signed RPC; seller sees own status; forced RLS; no direct client grant |

Database checks additionally enforce available_quantity + reserved_quantity + sold_quantity <= quantity, no bundle self-reference, no nested bundle component, channel freshness cannot be extended by client input, and no channel sync can increase platform_quantity. Trigger/RPC checks prevent an active claim from exceeding available quantity.

### Permission and RLS matrix

| Principal | Read | Insert | Update | Delete |
|---|---|---|---|---|
| anon | Eligible public availability projection only | None | None | None |
| authenticated seller | Own units, stock, claims, bundles, import and channel status | Through RPC only | Through claim/bundle/import/channel RPC only | None; release is a state transition |
| checkout service | Signed availability and claim projection for requested listing | Claim RPC with signed grant | Convert/release claim RPC | None |
| channel worker | Assigned connection/job and redacted listing availability | Sync job/results through signed RPC | External availability and channel state only | None |
| moderator/support | Policy/audit projection, no secret or private note | None | No stock mutation | None |
| service role | Controlled migration/redaction procedures | Controlled procedures | Controlled procedures | Retention procedure only |

## State Machines, Concurrency, and Failure Recovery

### Claim and stock state machine

| Current | Command | Preconditions | Next | Side effects |
|---|---|---|---|---|
| available | claim | expected revision and quantity fit; ownership/custody clear; no theft hold | active | decrement available or reserve qty-one; emit claim and stock events |
| active | convert | signed checkout/order grant and same listing version | converted | decrement/settle stock; buyer/order service pins listing version |
| active | release | claimant/grant or expiry worker | released | restore available quantity; emit stock event |
| active | expire | now >= expiresAt and no conversion | expired | restore quantity; emit claim/stock events |
| available | hold | signed screening/policy worker | held | remove exposure; no claim created |
| held | release_hold | signed worker and clear result | available | increment revision; projection refresh |
| available | sell | downstream order settlement | sold or exhausted | immutable sold history; no deletion |

### Bundle and bulk state machine

| Flow | Atomicity rule | Failure result | Recovery |
|---|---|---|---|
| Bundle create | Lock sorted component IDs; all constituents available with exact quantity | Entire transaction rolls back; no bundle or partial claim | Refetch revisions, remove conflict, resubmit |
| B-stock/parts | Each unit has explicit condition; no silent merge with new/used stock | Invalid condition returns row/command error | Correct condition and create a new idempotency intent |
| Bulk validate | No stock mutation; every row receives deterministic outcome | Batch becomes validated with rejected rows | Correct rejected rows and submit new source revision |
| Bulk commit | Each accepted row commits independently with row hash; allowPartial must be explicit | Partial state only when allowPartial true; otherwise no accepted rows exposed | Retry failed row with same row key or new revision |
| Channel sync | External result can lower exposure or mark stale; cannot increase platform quantity | Target remains previous safe state or held on safety failure | Retry through circuit policy; manual reconnect after max attempts |

Bulk defaults are never invisible: every omitted/defaulted field is recorded in defaultedFields on the row, the seller review projection labels it, and market admission treats a defaulted observation as lower-integrity or excludes it according to the active computation policy. Invalid rows remain isolated and do not silently become publishable.

### Race and recovery matrix

| Race | Serialization rule | Winner/loser behavior | Recovery |
|---|---|---|---|
| Two claims for qty-one | Row lock on unit and expected revision | First commit wins; loser gets INVENTORY_CONFLICT | Refetch alternatives if requested |
| Two counted claims | Row lock and check available_quantity under update | First fitting claim wins; later quantity conflict | Retry with current quantity |
| Bundle versus constituent claim | Sorted locks on all component IDs | Bundle succeeds only if every component fits; otherwise no component is claimed | Resubmit after refetch |
| Channel sync versus claim | Claim transaction owns platform row; sync cannot resurrect sold/reserved | Claim wins; sync result clamps to safe quantity | Mark external result stale and retry |
| Screening hold versus claim | Hold transaction has higher priority and locks unit/listing | Hold wins; claim returns SCREENING_HOLD | Resolve screening then new claim |
| Bulk row versus manual claim | Same seller/external-key advisory key | Earlier committed row or claim wins; duplicate row is deterministic | Row status duplicate; no oversell |
| Claim expiry versus conversion | Lock claim and target; compare expiry and signed order timestamp | Conversion wins only before expiry under one transaction | Expired conversion returns CLAIM_EXPIRED |

Every retry is bounded. A lost command response is recovered by idempotency lookup. Outbox delivery is at-least-once; consumers refetch canonical unit/stock state and deduplicate event ID. A worker lease expires after eight attempts and marks the job failed without changing safe availability.

## External Seams

| Seam | Exact request | Exact response | Timeout | Retry/backoff | Circuit behavior |
|---|---|---|---|---|---|
| BE-23 ownership/custody RPC | { sellerAccountId, unitOrStockIds[], operation: claim_or_channel } | { allowed, ownershipRevision, custodyBoundaryIds[], reasonCode? } | 3,000 ms | 2 retries at 150/450 ms for transient | Open after 5 failures in 60 s; claims fail closed and channels hold |
| BE-23 screening status | { marketplaceUnitIds[], listingIds[] } | { statuses: [{ id, status: clear/hold/pending, revision }] } | 3,000 ms | 2 retries at 150/450 ms | Open after 3 failures in 60 s; no exposure increase |
| BE-25b listing eligibility | { listingIds[], operation: claim_or_channel, expectedVersion? } | { listings: [{ listingId, versionId, state, disclosureId, eligible }] } | 3,000 ms | 2 retries at 150/450 ms | Open after 5 failures in 60 s; claim/channel mutation fails closed |
| External channel adapter | { channelAccountRef, listings: [{ externalKey, platformQuantity, revision }], mode } | { revision, results: [{ externalKey, quantity, externalRevision, observedAt, state, signature }] } | 8,000 ms per batch | 3 retries at 250/750/1500 ms for 408/429/5xx | Open after 5 failures in 120 s; mark stale, stop quantity increase, alert |
| BE-00 job/outbox RPC | { jobType, aggregateId, bodyHash, eventTypes[] } | { jobId, outboxIds[] } | 2,000 ms | Exactly 1 bounded transaction retry after serialization/deadlock at 100 ms with full jitter (50–150 ms); retryable only before commit is known; constraint, validation, and unknown-commit outcomes are terminal for the request and reconcile by `aggregateId` plus `bodyHash`; no out-of-transaction network retry | Opens after 3 failures in 30 s; half-opens after 30 s with 1 probe; fallback while open is 503 `DEPENDENCY_UNAVAILABLE` with no job/outbox side effect; successful probe closes, failed probe remains open for 60 s; receipt/stock mutation fails atomically |

Only a post-consumer adapter that is registered, admitted by platform policy, and connected with an active ChannelConnection may execute GMC17. Adapters must verify response signature, revision monotonicity, quantity integer bounds, and listing-key ownership. Adapter responses never directly update MarketplaceUnit without the transaction and RLS path above. Channel sync transmits availability only: disclosure versions, storefront policies, and other listing truth never synchronize by inference or an automatic side effect. A stale price or listing-version revision is rejected by claim arbitration; inventory never silently reprices a buyer intent.

## Events and Async Consumers

### Event envelope

Events use BE-00 envelope fields eventId, exact eventType, schemaVersion 1, occurredAt, producer, aggregateType, aggregateId, actorClass, requestId, idempotencyKey hash, payloadHash, and payload. Payload contains IDs, quantity deltas, revisions, freshness, safe state, and stable reason codes only.

### Producer and consumer obligations

| Event type | Produced by | Consumers | Idempotency key |
|---|---|---|---|
| gear_inventory.claim_resolved.v1 | GMC14, accepted GMC16 rows | checkout gate, listing eligibility, seller inventory projection, audit | eventId plus claim ID/result |
| gear_inventory.stock_changed.v1 | GMC14–GMC17 when committed state changes | listing projection, channel worker, market comp eligibility, audit | eventId plus target/revision |
| gear_listing.screening_changed.v1 | Consumed from BE-23b | inventory hold worker, listing projection | screening job ID/status |
| gear_listing.published.v1 | Consumed from BE-25b | channel eligibility worker | listingVersionId |
| gear_listing.state_changed.v1 | Consumed from BE-25b | stock exposure projection | listingId/resulting version |

Unknown event types are quarantined and alerted. A duplicate delivery cannot decrement quantity twice. A stock consumer acknowledges only after durable refetch and invariant check.

## Error Matrix

| Operation IDs | Condition | HTTP | Error code | Retry/client action |
|---|---|---:|---|---|
| BE25C-GMC14 | Target hidden or absent | 404 | INVENTORY_NOT_FOUND | Do not reveal stock existence |
| BE25C-GMC14 | Quantity/revision conflict | 409 | INVENTORY_CONFLICT | Refetch revision and choose current quantity/alternative |
| BE25C-GMC14 | Theft/screening/custody hold | 409 | SCREENING_HOLD | Do not retry until hold resolution |
| BE25C-GMC14 | Listing price or version changed since expected value | 409 | STALE_PRICE | Refetch current listing/version; never silently reprice the claim |
| BE25C-GMC14 | Visible target without claim grant | 403 | INVENTORY_CLAIM_FORBIDDEN | Use authorized seller/operator |
| BE25C-GMC15 | Component absent or hidden | 404 | INVENTORY_NOT_FOUND | Correct component set |
| BE25C-GMC15 | Component unavailable or duplicate | 409 | BUNDLE_COMPONENT_CONFLICT | Refetch all constituents |
| BE25C-GMC15 | Nested bundle or invalid condition | 422 | INVALID_INPUT | Submit explicit flat component set |
| BE25C-GMC16 | Row/schema/duplicate external key invalid | 422 | IMPORT_ROW_INVALID | Validate and submit corrected row |
| BE25C-GMC16 | Partial results without allowPartial | 409 | IMPORT_REQUIRES_REVIEW | Review batch; no accepted rows exposed |
| BE25C-GMC16 | Source revision already committed | 409 | IMPORT_REVISION_REPLAY | Reuse idempotent result or choose new revision |
| BE25C-GMC17 | Channel credential/revision invalid | 422 | CHANNEL_RESPONSE_INVALID | Reconnect or obtain authorized revision |
| BE25C-GMC17 | Adapter is not admitted or connection is not active | 403 | CHANNEL_NOT_ADMITTED | Obtain platform admission or activate the connection |
| BE25C-GMC17 | Channel adapter unavailable | 503 | DEPENDENCY_UNAVAILABLE | Retry same key; stale state remains safe |
| BE25C-GMC17 | Channel target hidden/no grant | 404 | CHANNEL_TARGET_NOT_FOUND | Do not reveal listing/channel relation |
| All | Key reused with different body | 409 | IDEMPOTENCY_KEY_REUSE | New key only for new intent |
| All | Rate exceeded | 429 | RATE_LIMITED | Honor Retry-After |
| All | Malformed or extra input | 400 | INVALID_INPUT | Correct strict schema |

Every failure serializes ErrorResponse with BE-00 ApiError { code, message, requestId, details }. Details never include channel secrets, raw external credentials, buyer data, or private serial values.

## Testing Strategy

### Contract and route tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25C-CON-001 | BE25C-GMC14 | Strict target XOR, positive quantity, TTL, purpose, and claimant schemas reject invalid input |
| BE25C-CON-002 | BE25C-GMC15 | Two or more unique components, atomic literal true, no recursive bundle and condition enum enforced |
| BE25C-CON-003 | BE25C-GMC16 | 500-row bound, unique external keys, binding/unmatched XOR, dry-run nonmutation and partial flag enforced |
| BE25C-CON-004 | BE25C-GMC17 | Consent literal, channel allowlist, target bounds, freshness and idempotency schemas enforced |
| BE25C-ROUTE-001 | BE25C-GMC14 through BE25C-GMC17 | Method/path registry exact; no alternate route bypasses middleware |

### Authorization and privacy tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25C-AUTH-001 | BE25C-GMC14 through BE25C-GMC17 | Cross-seller/hidden resources return 404; visible missing grant returns 403 |
| BE25C-AUTH-002 | BE25C-GMC14, BE25C-GMC15 | Ownership/custody recheck prevents claims or bundles after transfer/hold |
| BE25C-AUTH-003 | BE25C-GMC16, BE25C-GMC17 | Import object grants and server-side channel secret lookup prevent credential or private-data leakage |
| BE25C-AUTH-004 | BE25C-GMC14, BE25C-GMC17 | Forged checkout/worker tokens are 403; worker scope cannot touch another seller |

### Persistence, idempotency, and concurrency tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25C-DB-001 | BE25C-GMC14 through BE25C-GMC17 | Forced RLS blocks direct client table access and RPC rechecks seller/expected revision |
| BE25C-DB-002 | BE25C-GMC14, BE25C-GMC15 | Concurrent claims and bundle composition cannot oversell or partially reserve |
| BE25C-DB-003 | BE25C-GMC16 | Batch and row idempotency produce stable replay, deterministic duplicate handling, and correct partial state |
| BE25C-DB-004 | BE25C-GMC17 | Monotonic channel revision and freshness checks reject replay and quantity increase |
| BE25C-DB-005 | All assigned operations | SQL types, nullability, constraints/FKs, indexes, RLS, grants, and stock invariants are migration-tested |

### Domain, seam, event, and recovery tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25C-DOM-001 | BE25C-GMC14 | Qty-one locks one unit; counted stock decrements exact quantity; cart creation alone never claims |
| BE25C-DOM-002 | BE25C-GMC15 | Bundle requires every component and exposes B-stock/parts condition separately |
| BE25C-DOM-003 | BE25C-GMC16 | Dry-run has no mutation; row errors are deterministic; allowPartial controls commit exposure |
| BE25C-DOM-004 | BE25C-GMC17 | Stale/error channel results cannot increase availability; screening hold outranks channel state |
| BE25C-SEAM-001 | BE25C-GMC14 through BE25C-GMC17 | BE-23, BE-25b, BE-00, and channel adapter request/response timeout/retry/circuit contracts are exact |
| BE25C-EVT-001 | BE25C-GMC14 through BE25C-GMC17 | Outbox events carry safe deltas/revisions; duplicate delivery does not double-decrement |
| BE25C-REC-001 | BE25C-GMC14 through BE25C-GMC17 | Lost response, deadlock, lease expiry, adapter outage, stale revision, and poison-row recovery match this document |

## Deepening Passes

| Pass | Question | Resolution and evidence |
|---|---|---|
| D1 quantity truth | Can a qty-one unit and counted stock share one mutation path? | No. MarketplaceUnit and StockLine are distinct targets and schemas enforce exactly one |
| D2 claim semantics | Does a cart claim stock? | No. Only GMC14 or an accepted GMC16 claim transaction changes claimed quantity |
| D3 bundle atomicity | Can a bundle expose with one missing constituent? | No. Sorted locks and all-or-none commit require every component |
| D4 source authority | Can external channel quantity create platform stock? | No. Channel result clamps to platform quantity and cannot increase it |
| D5 ownership | Can a transferred seller retain a claim? | No. BE-23 ownership/custody revision is rechecked; stale claim is released/held |
| D6 race safety | Can screening, channel sync, and claim oversell? | No. Hold priority, row locks, expected revisions, and safe stale handling resolve races |
| D7 bulk safety | Can a malformed row poison all accepted rows? | No. Validate mode is nonmutating; row hashes and explicit allowPartial govern exposure |
| D8 reliability | What if adapter or response fails? | Circuit opens, state remains safe/stale, idempotency recovers committed receipts, and worker leases bound retries |
| D9 privacy | Do credentials, buyer data, serials, or media bytes leak? | No. Server-side secret refs, safe event payloads, and redacted logs are mandatory |
| D10 implementability | Are schema, grants, indexes, and tests complete? | Every table lists SQL types/nullability/FKs/indexes/RLS/grants; every operation has keyed test rows |

## Ambiguity Gate

**PASS.** Evidence: interactions 25.14–25.17 map one-to-one to BE25C-GMC14–GMC17; MarketplaceUnit, StockLine, and InventoryClaim authority is explicit; qty-one/count semantics, cart non-claiming, bundle atomicity, B-stock/parts condition, bulk row policy, channel freshness, screening holds, ownership, 403/404, RLS/grants, CORS policy gear-api, global ApiError, exact external seams, race recovery, events, and operation-keyed tests are specified. Listing/disclosure, catalog, checkout, provenance, market, and storefront routes are referenced without duplication.

## Open Questions

None

## Dependency References

- BE-00 platform contracts in 00-infrastructure.md: strict Zod 4, ApiError { code, message, requestId, details }, idempotency, outbox, forced RLS, CORS, and audit.
- BE-23a ownership/transfer in 23a-gear-identity-claims-transfers.md: seller authority and custody revision.
- BE-23b screening in 23b-theft-screening-recovery.md: theft hold and screening status.
- BE-25a catalog in 25a-gear-catalog-authority-matching.md: ListingModelBind and CategorySchemaVersion references.
- BE-25b listing lifecycle in 25b-gear-listing-disclosure-lifecycle.md: Listing, ListingVersion, DisclosureVersion, publication and state gates.
- BE-25d market/policy in 25d-gear-market-guides-storefront-policies.md: downstream provenance, guides, and storefront policy projections.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-08-28 | Initial production-grade BE companion for interactions 25.14–25.17; atomic stock claims, bundles, bulk imports, channel sync, strict contracts, persistence/RLS, eventing, recovery, and ambiguity evidence added |
