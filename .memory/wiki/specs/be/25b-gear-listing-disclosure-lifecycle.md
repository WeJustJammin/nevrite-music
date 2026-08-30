# BE-25b — Gear Listing Disclosure and Lifecycle

Status: implementation-ready backend contract for Shard 25 interactions 25.08–25.13. This companion owns disclosure truth, originality declarations, listing versions, publication gates, and lifecycle transitions. Catalog authority and model matching remain in BE-25a; inventory claims, bundles, bulk import, and channel adapters remain in BE-25c.

## Classification

| Field | Decision |
|---|---|
| Backend boundary | Seller-controlled disclosure and listing state, with immutable versions after publication or buyer pinning |
| Assigned interactions | 25.08 Grade and disclose flaws; 25.09 Declare originality; 25.10 Create listing/media; 25.11 Publish listing; 25.12 Amend live listing; 25.13 End/pause/relist |
| Operation IDs | BE25B-GMC08 through BE25B-GMC13 |
| Primary actors | Authenticated seller; delegated seller operator; catalog-scoped moderator for policy exceptions; system workers for screening and media processing |
| Non-goals | Catalog authority, theft adjudication, stock claiming, bundle allocation, external channel synchronization, dealer/MAP policies, and price-guide computation |
| Locked product decisions | Eight explicit condition grades with no default; flaws cap grade; originality is separate and unknown is first-class; material contradiction blocks publication; published and buyer-pinned versions are immutable; ending never deletes a published listing |
| Platform dependency | BE-00 global contract, error, idempotency, outbox, RLS, CORS, and observability rules apply to every operation |

The boundary is valid because the IA source separates listing truth from inventory ownership: a listing may be drafted and disclosed before a stock claim, while a buyer claim pins the listing and disclosure versions. 25.05 model matching is consumed as an input and never reimplemented here.

## Referenced Material Inventory

| Source | Section and line trace | Material used |
|---|---|---|
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Shard header and decisions, lines 1–40 | Licensed catalog source, reversible matching, schema ownership, grade/originality rules, evidence boundary, immutable publication and relist rules |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Interactions table, lines 79–99 | Exact interaction IDs 25.08–25.13 and their actor/output boundaries |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Command contracts, lines 105–116 | SaveDisclosureVersion, PublishListing, TransitionListing and their command semantics |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Data Models, lines 130–144 | DisclosureVersion, EvidenceFrame, EvidencePack, Listing, ListingVersion; MarketplaceUnit is referenced as the stock binding owned by 25c |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Event Schemas, lines 213–224 | gear_listing.disclosure_changed.v1, gear_listing.published.v1, gear_listing.state_changed.v1 and platform envelope requirements |
| .memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md | Listing truth, lines 22–31 | Versioned category schema, grade ceiling, originality vectors, contradiction handling, evidence, publication pinning and asynchronous screening |
| .memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md | Lifecycle and inventory, lines 33–42 | Draft/published/paused/ended/relisted state, buyer pinning, sold immutability, and erasure behavior |
| .memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md | Grade ceiling, lines 55–60 | Eight grade values, no default, flaw ceiling, and non-functioning rule |
| .memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md | Originality aggregate, lines 62–72 | Per-part originality vector, unknown handling, confidence, and seller assertions |
| .memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md | Evidence boundary, lines 89–94 | Listing, purchase, dispatch, arrival evidence pack and custody handoff |
| .memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md | Listing state and races, lines 83–87 and 127–139 | State transition graph and amend-with-offer, claim, screening, and sold races |
| .memory/wiki/specs/be/00-infrastructure.md | Zod/error rules, lines 112–153 | Strict Zod 4 input, global ApiError shape, request ID and bounded details |
| .memory/wiki/specs/be/00-infrastructure.md | RLS and grants, lines 208–251 | Forced RLS, private/mutable table grants, security-invoker RPC, audit and outbox |
| .memory/wiki/specs/be/00-infrastructure.md | Hono middleware and archetypes, lines 255–308 | CORS, auth, validation, rate classes, idempotency and atomic audit/outbox ordering |
| .memory/wiki/specs/be/23b-theft-screening-recovery.md | Screening dependency | Positive theft hit holds publication; outage produces pending/no badge and never a false clear |
| .memory/wiki/specs/be/24d-custody-cases-manifests.md | Evidence and custody dependency | EvidencePack references custody boundary without copying custody routes |

## IA Source Map

### Assigned interactions

| IA ID | IA name | Backend responsibility | Operation |
|---|---|---|---|
| 25.08 | Grade and disclose flaws | Validate category schema, condition grade, flaw checklist, materiality, and evidence; persist immutable disclosure version | BE25B-GMC08 |
| 25.09 | Declare originality | Validate per-part originality vector and aggregate confidence; persist seller assertion separately from platform facts | BE25B-GMC09 |
| 25.10 | Create listing/media | Create seller-owned draft and media references; require model binding or explicit unmatched baseline | BE25B-GMC10 |
| 25.11 | Publish listing | Reconcile pinned versions, ownership, evidence, screening, payout, and policy gates; enqueue screening | BE25B-GMC11 |
| 25.12 | Amend live listing | Create a new version, classify materiality, and pause or re-screen when a material field changes | BE25B-GMC12 |
| 25.13 | End/pause/relist | Apply guarded state transitions and create a fresh relist version without deleting history | BE25B-GMC13 |

### Canonical Data Models

| IA model | This companion representation | Ownership |
|---|---|---|
| DisclosureVersion | Versioned condition, flaw, originality, evidence references, schema version, and contradiction summary | Authoritative here |
| EvidenceFrame | Immutable object reference, capture metadata, hash, and redaction state | Authoritative here; bytes remain in BE-00 storage |
| EvidencePack | Ordered listing/purchase/dispatch/arrival evidence references and custody boundary | Authoritative here; custody transitions consumed from BE-24d |
| Listing | Stable seller-owned listing identity and current state/version pointers | Authoritative here |
| ListingVersion | Immutable snapshot of public and operational listing fields | Authoritative here |
| MarketplaceUnit | Stock/purchasable unit pointer consumed from BE-25c; not redefined or routed here | 25c authoritative |
| ListingModelBind | Model binding consumed from BE-25a and revalidated by version | 25a authoritative |
| CategorySchemaVersion | Schema and flaw ceiling consumed from BE-25a | 25a authoritative |

### Event Schemas

This companion produces exactly these platform event types and consumes screening and custody events by canonical refetch:

| Event type | Producer operation | Delivery invariant |
|---|---|---|
| gear_listing.disclosure_changed.v1 | BE25B-GMC08, BE25B-GMC09, BE25B-GMC12 | Disclosure version ID, listing ID, schema version, actor, and public-safe change summary; no evidence bytes or private serial |
| gear_listing.published.v1 | BE25B-GMC11 | Listing/version IDs, publication timestamp, screening status, and outbox event ID; consumer refetches the pinned version |
| gear_listing.state_changed.v1 | BE25B-GMC13 and BE25B-GMC12 when auto-pausing | Previous/current state, reason code, listing/version IDs, and actor; repeated delivery is idempotent |

The full Shard 25 event inventory remains traceable here for cross-companion reconciliation: gear_catalog.assertion_submitted.v1, gear_catalog.resolution_changed.v1, gear_listing.model_bind_changed.v1, gear_listing.disclosure_changed.v1, gear_listing.published.v1, gear_listing.state_changed.v1, gear_inventory.claim_resolved.v1, gear_inventory.stock_changed.v1, gear_listing.screening_changed.v1, gear_market.comp_admitted.v1, gear_market.guide_recomputed.v1, and gear_storefront.policy_changed.v1. This is an inventory reference, not a claim that this companion produces catalog, inventory, market, or policy events.

## Endpoint Reconciliation

BE-00 owns authentication/session endpoints, generic object upload and signed URL endpoints, idempotency inspection, health, and the global error envelope. BE-23 owns gear-record identity, owner transfer, theft-screening adjudication, and transfer gates. BE-24 owns custody case/manifest endpoints. BE-25a owns catalog search, provisional models, catalog assertions/resolution, listing-model binding, serial hypotheses, and fitment evaluation. BE-25c owns inventory claims, bundles, bulk import, and external channel sync. BE-25d owns provenance projection, guides, suggestions, and storefront policy. No route below duplicates those endpoints.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Capability | Archetype | Success |
|---|---|---|---|---|---|---|
| BE25B-GMC08 | POST | /api/v1/gear/listings/{listingId}/disclosures | 25.08 | listing.disclosure.write | ordinary command | 201 DisclosureVersionSuccess |
| BE25B-GMC09 | POST | /api/v1/gear/listings/{listingId}/originality | 25.09 | listing.originality.write | ordinary command | 201 DisclosureVersionSuccess |
| BE25B-GMC10 | POST | /api/v1/gear/listings | 25.10 | listing.create | ordinary command | 201 ListingSuccess |
| BE25B-GMC11 | POST | /api/v1/gear/listings/{listingId}/publication | 25.11 | listing.publish | protected command | 202 PublicationSuccess |
| BE25B-GMC12 | PATCH | /api/v1/gear/listings/{listingId} | 25.12 | listing.amend | ordinary command | 201 ListingSuccess |
| BE25B-GMC13 | POST | /api/v1/gear/listings/{listingId}/transitions | 25.13 | listing.transition | protected command | 200 TransitionSuccess |

Path parameters are UUIDs. A route is authoritative only in this registry. A successful command returns requestId and event/outbox references where asynchronous work is scheduled. Listing reads are intentionally not duplicated: consumers use the published projection owned by the listing service.

### Request/response contracts (Zod 4)

The following schemas are strict Zod 4 contracts. Unknown keys reject with INVALID_INPUT. All string lengths and nested collection limits are enforced before persistence. Dates are RFC 3339 strings parsed to UTC instants. UUIDs use the platform UUID parser. Every success response includes requestId; every failure uses BE-00 ApiError { code, message, requestId, details }.

~~~ts
import { z } from "zod";
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });

const Uuid = z.string().uuid();
const Instant = z.string().datetime({ offset: true });
const Version = z.number().int().positive().max(2147483647);
const Text = (max: number) => z.string().trim().min(1).max(max);
const NullableText = (max: number) => z.string().trim().max(max).nullable();
const EvidenceKind = z.enum(["listing", "purchase", "dispatch", "arrival", "service"]);
const Grade = z.enum([
  "mint", "excellent", "very_good", "good",
  "fair", "poor", "project", "non_functioning"
]);
const OriginalityValue = z.enum(["original", "replacement", "modified", "unknown"]);
const DisclosureStatus = z.enum(["draft", "published", "superseded", "redacted"]);

const EvidenceRef = z.object({
  evidenceFrameId: Uuid,
  kind: EvidenceKind,
  caption: z.string().trim().max(240).default(""),
  sortOrder: z.number().int().min(0).max(999)
}).strict();

const Flaw = z.object({
  code: z.string().regex(/^[a-z0-9_:-]{1,80}$/),
  severity: z.enum(["cosmetic", "functional", "safety", "material"]),
  observed: z.boolean(),
  description: Text(1000),
  evidenceFrameIds: z.array(Uuid).max(12)
}).strict();

const ComponentOriginality = z.object({
  componentKey: z.string().regex(/^[a-z0-9_.:-]{1,120}$/),
  value: OriginalityValue,
  confidence: z.number().min(0).max(1),
  basis: z.enum(["seller_assertion", "platform_record", "evidence", "unknown"]),
  note: z.string().trim().max(500).default("")
}).strict();

const DisclosureInput = z.object({
  expectedListingVersion: Version,
  categorySchemaVersionId: Uuid,
  grade: Grade,
  flaws: z.array(Flaw).max(200),
  originality: z.array(ComponentOriginality).max(100),
  evidence: z.array(EvidenceRef).max(100),
  functionalTestedAt: Instant.nullable(),
  functionalTestNote: NullableText(1000),
  sellerDisclosure: Text(4000),
  materialContradictionAcknowledged: z.literal(false).default(false)
}).strict();

export const Gmc08Request = z.object({
  listingId: Uuid,
  idempotencyKey: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  disclosure: DisclosureInput
}).strict();

export const Gmc09Request = z.object({
  listingId: Uuid,
  idempotencyKey: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  expectedListingVersion: Version,
  categorySchemaVersionId: Uuid,
  originality: z.array(ComponentOriginality).min(1).max(100),
  evidenceFrameIds: z.array(Uuid).max(100),
  sellerNote: z.string().trim().max(2000).default("")
}).strict();

const MediaRef = z.object({
  storageObjectId: Uuid,
  mediaType: z.enum(["image", "video", "document"]),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  altText: Text(240),
  sortOrder: z.number().int().min(0).max(99)
}).strict();

export const Gmc10Request = z.object({
  idempotencyKey: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  sellerAccountId: Uuid,
  title: Text(180),
  description: Text(5000),
  categoryKey: z.string().regex(/^[a-z0-9_.:-]{1,120}$/),
  listingModelBindId: Uuid.nullable(),
  unmatchedModelLabel: z.string().trim().max(180).nullable(),
  marketplaceUnitId: Uuid.nullable(),
  media: z.array(MediaRef).min(1).max(99),
  draftDisclosure: DisclosureInput.nullable()
}).strict().superRefine((v, ctx) => {
  if (v.listingModelBindId === null && (v.unmatchedModelLabel === null || v.unmatchedModelLabel.length === 0)) {
    ctx.addIssue({ code: "custom", path: ["unmatchedModelLabel"], message: "model binding or unmatched label is required" });
  }
  if (v.listingModelBindId !== null && v.unmatchedModelLabel !== null) {
    ctx.addIssue({ code: "custom", path: ["unmatchedModelLabel"], message: "binding and unmatched label are mutually exclusive" });
  }
});

export const Gmc11Request = z.object({
  listingId: Uuid,
  idempotencyKey: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  expectedListingVersion: Version,
  expectedDisclosureVersion: Version,
  expectedListingState: z.literal("draft"),
  confirmPayoutDestination: z.literal(true),
  confirmLegalRightToSell: z.literal(true),
  confirmDisclosureAccurate: z.literal(true)
}).strict();

const AmendPatch = z.object({
  title: Text(180).optional(),
  description: Text(5000).optional(),
  listingModelBindId: Uuid.nullable().optional(),
  unmatchedModelLabel: z.string().trim().max(180).nullable().optional(),
  media: z.array(MediaRef).min(1).max(99).optional(),
  disclosure: DisclosureInput.omit({ expectedListingVersion: true }).optional()
}).strict();

export const Gmc12Request = z.object({
  listingId: Uuid,
  idempotencyKey: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  expectedListingVersion: Version,
  patch: AmendPatch
}).strict().superRefine((v, ctx) => {
  if (Object.keys(v.patch).length === 0) {
    ctx.addIssue({ code: "custom", path: ["patch"], message: "at least one field is required" });
  }
});

export const Gmc13Request = z.object({
  listingId: Uuid,
  idempotencyKey: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  expectedListingVersion: Version,
  expectedState: z.enum(["draft", "published", "paused", "ended"]),
  transition: z.enum(["pause", "resume", "end", "relist"]),
  reasonCode: z.enum([
    "seller_request", "sold", "policy_hold", "screening_hold",
    "stock_unavailable", "expiration", "correction"
  ]),
  note: z.string().trim().max(1000).default("")
}).strict();

const BaseSuccess = z.object({
  requestId: Uuid,
  operationId: z.string().regex(/^BE25B-GMC(0[89]|1[0-3])$/),
  idempotencyKey: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  occurredAt: Instant
}).strict();

export const DisclosureVersionSuccess = BaseSuccess.extend({
  disclosureVersionId: Uuid,
  listingId: Uuid,
  version: Version,
  status: DisclosureStatus,
  validationState: z.enum(["complete", "partial", "pending_review"]),
  effectiveGrade: Grade,
  originalityAggregate: OriginalityValue,
  screeningRequired: z.boolean(),
  materialContradiction: z.boolean(),
  eventId: Uuid
}).strict();

export const ListingSuccess = BaseSuccess.extend({
  listingId: Uuid,
  listingVersionId: Uuid,
  version: Version,
  state: z.enum(["draft", "published", "paused", "ended"]),
  materialChange: z.boolean(),
  eventId: Uuid.nullable()
}).strict();

export const PublicationSuccess = BaseSuccess.extend({
  listingId: Uuid,
  listingVersionId: Uuid,
  version: Version,
  state: z.enum(["published", "paused"]),
  screeningStatus: z.enum(["pending", "clear", "hold"]),
  screeningJobId: Uuid,
  eventId: Uuid
}).strict();

export const TransitionSuccess = BaseSuccess.extend({
  listingId: Uuid,
  previousState: z.enum(["draft", "published", "paused", "ended"]),
  state: z.enum(["draft", "published", "paused", "ended"]),
  listingVersionId: Uuid,
  version: Version,
  relistedFromListingId: Uuid.nullable(),
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

The error response is intentionally the BE-00 shape, not an RFC 7807 variant. details is redacted for unauthorized actors and is bounded to BE-00 limits. Requests containing an already-used idempotency key with a different canonical body hash return IDEMPOTENCY_KEY_REUSE.

### Contract Registry

| Operation ID | Request schema | Success schema | Global error contract | Commit boundary |
|---|---|---|---|---|
| BE25B-GMC08 | Gmc08Request strict; listingId and expected version | DisclosureVersionSuccess with effective grade and contradiction flag | All failures use ApiError { code, message, requestId, details } via ErrorResponse | disclosure row, audit row, event outbox, and idempotency result commit atomically |
| BE25B-GMC09 | Gmc09Request strict; at least one component | DisclosureVersionSuccess with originality aggregate | All failures use ApiError { code, message, requestId, details } via ErrorResponse | originality disclosure and event outbox commit atomically |
| BE25B-GMC10 | Gmc10Request strict; model binding/unmatched XOR and media | ListingSuccess with draft version | All failures use ApiError { code, message, requestId, details } via ErrorResponse | listing, listing version, media refs, audit, and idempotency result commit atomically |
| BE25B-GMC11 | Gmc11Request strict; all confirmations literal true | PublicationSuccess; screening may remain pending | All failures use ApiError { code, message, requestId, details } via ErrorResponse | publication pin, audit, event outbox, and screening job commit atomically |
| BE25B-GMC12 | Gmc12Request strict; nonempty patch and expected version | ListingSuccess with materialChange | All failures use ApiError { code, message, requestId, details } via ErrorResponse | new immutable version, state effect, audit, and outbox commit atomically |
| BE25B-GMC13 | Gmc13Request strict; transition must match expected state | TransitionSuccess with state result | All failures use ApiError { code, message, requestId, details } via ErrorResponse | state/version/transition audit and event outbox commit atomically |

## Authorization and Ownership

| Operation ID | Actor and role | Ownership/standing check | 403 versus 404 |
|---|---|---|---|
| BE25B-GMC08 | Seller or seller_operator with listing.write | Seller account owns listing or has active delegated write grant; listing not sold/pinned immutable | Return 404 LISTING_NOT_FOUND when caller cannot establish visibility; return 403 LISTING_WRITE_FORBIDDEN when visible but grant is absent or listing is locked |
| BE25B-GMC09 | Seller or seller_operator with listing.write | Same ownership/grant; originality evidence may be read only by seller, moderator, buyer after publication | Same non-disclosure 404 rule; visible immutable/sold state returns 403 LISTING_LOCKED |
| BE25B-GMC10 | Authenticated seller with seller_account.create_listing | sellerAccountId belongs to actor or delegated party; media object grant and MIME/hash validated | Invalid or inaccessible seller account is 404; valid account without create grant is 403 |
| BE25B-GMC11 | Seller or seller_operator with listing.publish; moderator cannot publish as seller | Ownership, payout destination, sell grant, legal confirmation, category schema and custody prerequisites | Invisible listing is 404; visible listing failing actor grant is 403; policy or missing precondition is 409 |
| BE25B-GMC12 | Seller or seller_operator with listing.write | Ownership and current version; buyer-pinned/sold immutable fields cannot be changed | Invisible listing is 404; visible but locked or ungranted is 403; stale expected version is 409 |
| BE25B-GMC13 | Seller or seller_operator with listing.manage_state; system worker for policy/screening holds | Ownership/grant for seller transitions; worker may only apply named system reason and signed job token | Invisible listing is 404; visible but no transition grant is 403; illegal transition is 409 |

Seller erasure de-identifies eligible seller PII while retaining legally required listing, disclosure, and event history. It never rewrites the public factual history into a new assertion. Moderators have read and moderation grants scoped to category; they cannot impersonate seller publication or alter seller-owned evidence without an audit reason.

## Middleware and Security

### Per-operation middleware registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
|---|---|---|---|
| BE25B-GMC08 | requestId → CORS → auth → actor context → rate limit → idempotency → strict body validation → ownership → handler → audit/outbox | CORS policy gear-api; allowlisted web origins only; credentials only for approved origins | max body 256 KiB; evidence IDs only; no storage bytes; object authorization recheck |
| BE25B-GMC09 | requestId → CORS → auth → actor context → rate limit → idempotency → strict body validation → ownership → handler → audit/outbox | CORS policy gear-api; allowlisted web origins only; credentials only for approved origins | max body 128 KiB; component count 100; prevent seller note HTML and unsafe Unicode |
| BE25B-GMC10 | requestId → CORS → auth → actor context → rate limit → idempotency → strict body validation → account grant → handler → audit/outbox | CORS policy gear-api; allowlisted web origins only; credentials only for approved origins | max body 512 KiB; media object grant, MIME/hash/virus state and alt text required |
| BE25B-GMC11 | requestId → CORS → auth → actor context → rate limit → idempotency → strict body validation → ownership → policy gates → handler → audit/outbox | CORS policy gear-api; allowlisted web origins only; credentials only for approved origins | max body 32 KiB; CSRF token for cookie auth; recheck model/disclosure/custody/screening |
| BE25B-GMC12 | requestId → CORS → auth → actor context → rate limit → idempotency → strict body validation → ownership → expected version → handler → audit/outbox | CORS policy gear-api; allowlisted web origins only; credentials only for approved origins | max body 512 KiB; immutable-field allowlist; media grant and material-change classifier |
| BE25B-GMC13 | requestId → CORS → auth → actor context → rate limit → idempotency → strict body validation → ownership/worker token → state guard → handler → audit/outbox | CORS policy gear-api; allowlisted web origins only; credentials only for approved origins | max body 32 KiB; signed system reason; transition allowlist; no direct table writes |

Auth tokens are never logged. Error details contain field names and stable reason codes, never seller PII, serial values, evidence URLs, or moderation notes. Storage object IDs are re-authorized at every use and are never accepted as public URLs.

## Idempotency, Rate Limits, and SLOs

| Operation ID | Idempotency and concurrency | Rate limit | SLO and timeout |
|---|---|---|---|
| BE25B-GMC08 | Required key; body hash includes listing, schema, grade, flaws, originality and evidence; lock listing advisory key; repeat returns same result | 30 per seller per minute, burst 5 | p95 800 ms, hard 15 s; contention retries 2 at 50/150 ms |
| BE25B-GMC09 | Required key; body hash includes component vector; lock listing; same key replay returns same disclosureVersionId | 30 per seller per minute, burst 5 | p95 800 ms, hard 15 s; contention retries 2 at 50/150 ms |
| BE25B-GMC10 | Required key; body hash includes media refs; seller/category advisory key; replay returns same listing | 10 per seller per minute, burst 3 | p95 1.2 s, hard 15 s; no retry after media or grant ambiguity |
| BE25B-GMC11 | Required key; body hash includes confirmations and expected versions; serializable publication transaction | 10 per seller per 10 minutes, burst 2 | p95 1.5 s, hard 15 s; screening enqueue is in-transaction |
| BE25B-GMC12 | Required key; expected version and patch hash; optimistic update; stale version never auto-merges | 30 per seller per minute, burst 5 | p95 1.2 s, hard 15 s; contention retries 2 at 50/150 ms |
| BE25B-GMC13 | Required key; expected state/version and transition hash; state lock; replay is stable | 20 per seller per minute, burst 3 | p95 800 ms, hard 15 s; contention retries 2 at 50/150 ms |

Rate-limit keys are actor plus seller account plus route. BE-00 idempotency records retain the canonical response for at least 24 hours and are never used to bypass authorization. Transactions fail closed if the idempotency store is unavailable.

## Observability

| Operation ID | Metrics | Structured logs and traces | Audit/outbox evidence |
|---|---|---|---|
| BE25B-GMC08 | listing_disclosure_write_total by result/grade; latency; schema_reject_total; contradiction_total | requestId, operationId, listingId hash, schema version, actor class, result; evidence IDs hashed | audit action disclosure.created; gear_listing.disclosure_changed.v1 |
| BE25B-GMC09 | listing_originality_write_total by aggregate; unknown_component_total; latency | requestId, operationId, listingId hash, component count, confidence bucket, result | audit action originality.created; gear_listing.disclosure_changed.v1 |
| BE25B-GMC10 | listing_create_total; media_ref_reject_total; latency; draft_size_bytes | requestId, operationId, seller account hash, category, media count, binding presence, result | audit action listing.created; no publication event |
| BE25B-GMC11 | listing_publish_total by gate/result; screening_enqueue_total; latency | requestId, operationId, listingId hash, version, gate codes, screening job ID, result | audit action listing.published; gear_listing.published.v1 |
| BE25B-GMC12 | listing_amend_total by materiality; auto_pause_total; version_conflict_total | requestId, operationId, listingId hash, changed field classes, previous/new version, result | audit action listing.amended; disclosure/state event when applicable |
| BE25B-GMC13 | listing_transition_total by transition/result; invalid_transition_total; latency | requestId, operationId, listingId hash, old/new state, reason code, result | audit action listing.state_changed; gear_listing.state_changed.v1 |

Trace spans use requestId and operationId. Sampling may reduce payload detail but never removes audit records, outbox records, or security failures. provider-native diagnostic sinks receive stable error code and requestId only.

## Persistence and RLS

All tables below are in protected schemas, have enabled and forced RLS, deny direct anon and authenticated table grants, and are accessed by security-invoker RPCs owned by the application role. Every mutation writes audit and, for event-producing operations, outbox rows in the same transaction. Storage bytes remain in BE-00 object storage.

### Complete table definitions

| Table / model | Typed fields with SQL types, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.listing_disclosure_versions / DisclosureVersion | id uuid PK; listing_id uuid NOT NULL FK platform_private.listings(id); version integer NOT NULL CHECK version > 0; category_schema_version_id uuid NOT NULL FK platform_private.catalog_schema_versions(id); grade text NOT NULL CHECK in eight grade values; flaws jsonb NOT NULL CHECK jsonb_array_length <= 200; originality jsonb NOT NULL CHECK jsonb_array_length <= 100; evidence_pack_id uuid NOT NULL FK platform_private.listing_evidence_packs(id); effective_grade text NOT NULL; validation_state text NOT NULL CHECK in complete/partial/pending_review; material_contradiction boolean NOT NULL DEFAULT false; status text NOT NULL CHECK in draft/published/superseded/redacted; created_by uuid NOT NULL FK auth.users(id); created_at timestamptz NOT NULL; superseded_at timestamptz NULL; UNIQUE(listing_id, version) | UNIQUE listing_id/version; listing_id/status/version DESC; evidence_pack_id; validation_state; partial index on material_contradiction true | Seller sees own listing rows; published rows expose only approved projection; moderator category grant; service role only for redaction; forced RLS; no direct client grant |
| platform_private.listing_evidence_frames / EvidenceFrame | id uuid PK; storage_object_id uuid NOT NULL FK storage.objects(id); sha256 char(64) NOT NULL CHECK length=64; kind text NOT NULL CHECK in listing/purchase/dispatch/arrival/service; mime_type text NOT NULL; byte_size bigint NOT NULL CHECK 0 < byte_size <= 52428800; captured_at timestamptz NULL; alt_text text NOT NULL CHECK length <= 240; virus_state text NOT NULL CHECK in pending/clean/quarantined; redaction_state text NOT NULL CHECK in clear/redacted; created_by uuid NOT NULL FK auth.users(id); created_at timestamptz NOT NULL; UNIQUE(storage_object_id, sha256) | storage_object_id; created_by/created_at DESC; virus_state; sha256 | Owner or authorized listing participant may read metadata; bytes require BE-00 signed object grant; quarantined rows hidden; forced RLS; no direct client grant |
| platform_private.listing_evidence_packs / EvidencePack | id uuid PK; listing_id uuid NOT NULL FK platform_private.listings(id); pack_version integer NOT NULL CHECK > 0; frames jsonb NOT NULL CHECK jsonb_array_length <= 100; boundary text NOT NULL CHECK in listing/purchase/dispatch/arrival; custody_case_id uuid NULL FK platform_private.custody_cases(id); integrity_sha256 char(64) NOT NULL; immutable boolean NOT NULL DEFAULT false; created_by uuid NOT NULL FK auth.users(id); created_at timestamptz NOT NULL; UNIQUE(listing_id, pack_version) | listing_id/pack_version DESC; custody_case_id; boundary | Seller reads own pack; buyer reads pack pinned to their transaction; custody service may append boundary reference; immutable packs cannot update; forced RLS; no direct client grant |
| platform_private.listings / Listing | id uuid PK; seller_account_id uuid NOT NULL FK platform_private.seller_accounts(id); listing_model_bind_id uuid NULL FK platform_private.listing_model_binds(id); unmatched_model_label text NULL CHECK length <= 180; current_version integer NOT NULL DEFAULT 1 CHECK > 0; state text NOT NULL CHECK in draft/published/paused/ended; screening_status text NOT NULL CHECK in pending/clear/hold/unknown; payout_destination_id uuid NULL FK platform_private.payout_destinations(id); legal_sell_grant boolean NOT NULL DEFAULT false; buyer_pinned_version integer NULL; sold_at timestamptz NULL; ended_at timestamptz NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; CHECK exactly one model binding/unmatched label at publication | seller_account_id/state; state/updated_at DESC; listing_model_bind_id; partial published index; partial buyer_pinned index | Seller account owner/delegate controls mutable draft; public projection only for published; buyer sees pinned version; screening worker can update status with signed token; forced RLS; no direct client grant |
| platform_private.listing_versions / ListingVersion | id uuid PK; listing_id uuid NOT NULL FK platform_private.listings(id); version integer NOT NULL CHECK > 0; title text NOT NULL CHECK length between 1 and 180; description text NOT NULL CHECK length <= 5000; category_key text NOT NULL CHECK length <= 120; listing_model_bind_id uuid NULL FK platform_private.listing_model_binds(id); unmatched_model_label text NULL; disclosure_version_id uuid NOT NULL FK platform_private.listing_disclosure_versions(id); media_refs jsonb NOT NULL CHECK jsonb_array_length between 1 and 99; public_hash char(64) NOT NULL; material_change boolean NOT NULL DEFAULT false; pinned_for_buyer boolean NOT NULL DEFAULT false; created_by uuid NOT NULL FK auth.users(id); created_at timestamptz NOT NULL; UNIQUE(listing_id, version) | listing_id/version DESC; public_hash; partial pinned index; category_key/state projection index | Seller reads own; published version is public-safe projection; buyer-pinned remains readable after seller erasure; updates denied after insert; forced RLS; no direct client grant |
| platform_private.listing_transitions | id uuid PK; listing_id uuid NOT NULL FK platform_private.listings(id); from_state text NOT NULL; to_state text NOT NULL; reason_code text NOT NULL; note text NOT NULL DEFAULT ''; expected_version integer NOT NULL; resulting_version integer NOT NULL; actor_id uuid NULL FK auth.users(id); worker_job_id uuid NULL; created_at timestamptz NOT NULL; UNIQUE(listing_id, resulting_version) | listing_id/created_at DESC; worker_job_id; reason_code | Seller sees own transitions; moderator and support see authorized audit projection; append-only service insert; forced RLS; no direct client grant |
| platform_private.listing_publication_jobs | id uuid PK; listing_id uuid NOT NULL FK platform_private.listings(id); listing_version_id uuid NOT NULL FK platform_private.listing_versions(id); screening_status text NOT NULL CHECK in queued/running/clear/hold/failed; attempts smallint NOT NULL DEFAULT 0 CHECK 0 <= attempts <= 8; next_attempt_at timestamptz NULL; lease_until timestamptz NULL; last_error_code text NULL; created_at timestamptz NOT NULL; completed_at timestamptz NULL; UNIQUE(listing_version_id) | screening_status/next_attempt_at; lease_until; listing_id | Worker-only security-invoker RPC; seller can read own job status through projection; forced RLS; no direct client grant |

PostgreSQL CHECK constraints also enforce title/description lengths, no NUL characters, and no publication of quarantined evidence. JSON values are schema-validated before insertion; database checks prevent array blowups if a caller bypasses the API.

### Permission and RLS matrix

| Principal | Read | Insert | Update | Delete |
|---|---|---|---|---|
| anon | Published public projection only | None | None | None |
| authenticated seller | Own mutable listing/disclosure/evidence metadata; public published versions | Through RPC only | Through version/state RPC only; no in-place published edits | None |
| buyer | Public version plus buyer-pinned EvidencePack permitted by order grant | None | None | None |
| category moderator | Category-scoped review projection and audit | Moderation decision RPC only | No seller-owned row update | None |
| screening worker | Signed job RPC and screening status projection | Job/audit/outbox via RPC | Screening status only | None |
| service role | Narrow migration/redaction procedures | Controlled procedures | Controlled procedures | Retention/redaction procedure only |

## State Machines, Concurrency, and Failure Recovery

### Listing and version state machine

| Current state | Command | Preconditions | Next state | Side effects |
|---|---|---|---|---|
| draft | publish | all publish gates pass; expected state/version match | published or paused | pin listing/disclosure version; enqueue screening; emit published event |
| published | pause | seller grant or policy/screening reason | paused | stop new checkout eligibility; emit state event |
| paused | resume | seller grant; no theft/policy hold; current disclosure valid | published or paused | if screening required, remain paused pending; emit state event |
| published | end | seller grant or sold/expiration system reason, and no active buyer reservation | ended | remove from sale; retain history; emit state event |
| paused | end | seller grant/system reason | ended | retain pinned history; emit state event |
| ended | relist | seller grant; new listing version and current stock path | draft | create new version/listing relation; no resurrection of ended row |
| draft | relist | only if prior draft superseded by correction | draft | version increment; audit reason |
| published | amend | seller grant; expected version; field classifier | published or paused | new immutable version; material change may pause and re-screen |

A sold or buyer-pinned listing may only receive non-content operational updates allowed by the order/custody service. A published listing with a live offer or active reservation rejects a price change with LIVE_OFFER_PRICE_LOCK; price is not an allowlisted direct patch here. The API rejects attempts to mutate the pinned public hash, price/stock fields owned by 25c, disclosure version, or evidence pack. A reserved listing exits only through the order service's atomic cancellation path, not a seller end command.

### Disclosure and publication gates

1. Load Listing, ListingModelBind, CategorySchemaVersion, and current ListingVersion under a transaction lock.
2. Validate DisclosureVersion against the exact CategorySchemaVersion. No default grade is inferred.
3. Compute effective grade as the lowest permitted grade after flaw ceilings. A functional failure is the only path to non_functioning; cosmetic evidence cannot produce it.
4. Compute originality independently. Unknown remains unknown; a platform record pre-fills basis but never silently changes seller assertion.
5. Verify every EvidenceFrame belongs to the actor/listing, is clean, has matching hash, and is referenced by the EvidencePack.
6. Verify seller ownership, payout destination, legal sell grant, model binding/unmatched baseline, and required category fields.
7. If a material contradiction exists, return DISCLOSURE_CONTRADICTION and leave listing unpublished. If the category validator is unavailable after bounded retries, persist validationState pending_review (or partial with unavailable components explicitly unknown); publication may be flagged for asynchronous review only where policy permits, and never earns a clear badge. A validator outage never invents a grade, originality claim, or material-flaw clearance.
8. Commit version, audit, outbox, and idempotency record. A worker performs screening and only the signed screening RPC changes screening status.

### Concurrency and recovery matrix

| Race | Serialization rule | Winner/loser behavior | Recovery |
|---|---|---|---|
| Disclosure edit versus publish | advisory lock listing ID plus expected versions | First commit wins; stale publish returns VERSION_CONFLICT | Refetch current versions and resubmit |
| Material amend versus offer/order | order service owns buyer pin; listing amend sees pin before commit | Buyer pin wins; material amend returns LISTING_LOCKED | Seller creates relist after end if needed |
| Buy Now versus pause/end | 25c/checkout transaction locks MarketplaceUnit; listing state rechecked | Atomic reservation or transition; loser gets STOCK_UNAVAILABLE or STATE_CONFLICT | Idempotent checkout retry/refetch |
| Screening outage versus publish | publication commits pending only when policy allows; clear badge cannot be fabricated | Pending publication is not eligible where policy requires clear | Job retries with bounded backoff; manual hold after max attempts |
| Catalog bind change versus listing publication | 25a binding version checked under lock | Publication uses pinned bind; matcher outage degrades to an explicit unmatched baseline and never invents a match | Amend or relist when a new match is available |
| Evidence quarantine after publication | signed media event marks dependent listing paused | Safety hold outranks seller resume | Replace evidence, create disclosure version, re-screen |
| Seller erasure versus buyer pin | buyer-pinned version and event history retained; seller PII tokenized | Erasure never deletes public/legal record | Projection refresh with redacted seller identity |

### Failure recovery

Database deadlocks retry twice with 50 ms and 150 ms jitter. A committed transaction with a lost response is recovered by idempotency lookup. Outbox publication is at-least-once; consumers refetch by listing/version ID and deduplicate event ID. Screening job lease expiry returns the job to queued up to eight attempts, then marks failed and pauses publication. No worker retries a non-retryable policy, validation, or authorization failure.

## External Seams

| Seam | Exact request | Exact response | Timeout | Retry/backoff | Circuit behavior |
|---|---|---|---|---|---|
| BE-00 media authorization | { storageObjectId, actorId, sha256, purpose: listing_evidence } | { allowed: boolean, virusState, mimeType, byteSize } | 2,000 ms | 2 retries at 100/300 ms for 502/503/timeout | Open after 5 failures in 30 s; evidence write fails closed until 30 s half-open |
| BE-23 theft screening | { listingId, listingVersionId, gearRecordId?, evidenceHashes[] } | { screeningJobId, status: pending/clear/hold, reasonCode? } | 5,000 ms enqueue RPC | 3 retries at 200/500/1,000 ms for transient only | Open after 3 failures in 60 s; publication stays pending/paused, never clear |
| BE-24 custody grant | { listingId, sellerAccountId, evidencePackId, operation: publish } | { allowed, custodyBoundaryId?, reasonCode? } | 3,000 ms | 2 retries at 150/450 ms | Open after 5 failures in 60 s; publication fails closed with DEPENDENCY_UNAVAILABLE |
| BE-25a model bind refetch | { listingModelBindId, expectedVersion } | { bindId, modelId?, confidence, status, schemaVersion } | 2,000 ms | 2 retries at 100/300 ms | Open after 5 failures in 30 s; preserve bind history but use explicit unmatched baseline for publication, never a stale or fabricated match |
| BE-25c inventory eligibility | { listingId, marketplaceUnitId?, operation: publish_or_resume } | { eligible, quantityMode, claimState, reasonCode? } | 3,000 ms | 2 retries at 150/450 ms | Open after 5 failures in 60 s; keep listing paused/pending |
| BE-00 audit/outbox RPC | { transactionRef, eventType, aggregateId, payloadHash } | { auditId, outboxId } | 2,000 ms | Exactly 1 bounded transaction retry after serialization/deadlock at 100 ms with full jitter (50–150 ms); retryable only before commit is known; constraint, validation, and unknown-commit outcomes are terminal for the request and reconcile by `transactionRef`; no independent network retry | Opens after 3 failures in 30 s; half-opens after 30 s with 1 probe; fallback while open is 503 `DEPENDENCY_UNAVAILABLE` with no audit/outbox side effect; successful probe closes, failed probe remains open for 60 s; command fails atomically |

No external seam accepts evidence bytes, raw serials, private seller notes, or a caller-supplied authorization decision. Requests and responses are versioned internally; timeout and circuit policy is part of this contract.

## Events and Async Consumers

### Event envelope

Each emitted event uses the BE-00 envelope: eventId UUID, eventType exact string, schemaVersion 1, occurredAt UTC, producer, aggregateType, aggregateId, actorClass, requestId, idempotencyKey hash, payloadHash, and payload. Payload includes only IDs, states, version numbers, stable reason codes, and public-safe summaries. It never includes evidence bytes, signed URLs, raw serial values, private seller note, or moderation details.

### Producer and consumer obligations

| Event type | Produced by | Consumers | Idempotency key |
|---|---|---|---|
| gear_listing.disclosure_changed.v1 | GMC08, GMC09, GMC12 when disclosure changes | search/public projection, screening worker, audit projector, FE cache invalidator | eventId plus disclosureVersionId |
| gear_listing.published.v1 | GMC11 | screening worker, inventory eligibility, search/public projection, audit projector | eventId plus listingVersionId |
| gear_listing.state_changed.v1 | GMC12 auto-pause, GMC13 | search/public projection, inventory eligibility, order gate, audit projector | eventId plus listingId/resultingVersion |
| gear_listing.screening_changed.v1 | 23b worker, consumed for state gate | listing publication projection, seller status projection | screeningJobId/status |
| gear_inventory.claim_resolved.v1 | 25c, consumed for publish/resume eligibility | listing eligibility projection | inventoryClaimId/result |

Consumers must acknowledge only after durable refetch/projection. Unknown future event fields are ignored; unknown event type is quarantined and alerted. A duplicate event cannot create a second listing version or transition.

## Error Matrix

| Operation IDs | Condition | HTTP | Error code | Retry/client action |
|---|---|---:|---|---|
| BE25B-GMC08, BE25B-GMC09 | Unknown listing or no visibility | 404 | LISTING_NOT_FOUND | Do not reveal existence; refetch route context |
| BE25B-GMC08, BE25B-GMC09 | Stale expected listing version | 409 | VERSION_CONFLICT | Refetch latest version and reconcile |
| BE25B-GMC08, BE25B-GMC09 | Grade/flaw/schema contradiction | 422 | DISCLOSURE_CONTRADICTION | Correct disclosure/evidence; no automatic downgrade |
| BE25B-GMC08, BE25B-GMC09 | Visible but immutable/pinned/sold | 403 | LISTING_LOCKED | Create a new relist path |
| BE25B-GMC10 | Media object not clean or not granted | 422 | MEDIA_NOT_READY | Wait for media processing, then retry with new idempotency key |
| BE25B-GMC10 | Binding and unmatched label both supplied | 422 | MODEL_CONTEXT_AMBIGUOUS | Send exactly one baseline |
| BE25B-GMC11 | Missing payout/legal/evidence/custody gate | 409 | PUBLICATION_PRECONDITION_FAILED | Fix named gate; same key remains replayable |
| BE25B-GMC11 | Theft screening positive | 409 | SCREENING_HOLD | Do not retry blindly; resolve screening hold |
| BE25B-GMC11 | Screening unavailable | 503 | DEPENDENCY_UNAVAILABLE | Retry with same key; no clear badge |
| BE25B-GMC12 | Patch tries to mutate buyer-pinned field | 403 | LISTING_LOCKED | End/relist; do not bypass pin |
| BE25B-GMC12 | Price change while live offer or reservation exists | 409 | LIVE_OFFER_PRICE_LOCK | Resolve/cancel through order service or relist; no silent repricing |
| BE25B-GMC12 | No patch or invalid immutable field | 422 | INVALID_INPUT | Correct allowlisted patch |
| BE25B-GMC13 | Transition not valid from expected state | 409 | STATE_CONFLICT | Refetch state; choose allowed transition |
| BE25B-GMC13 | Reserved listing end requested outside order cancellation | 409 | LISTING_RESERVED | Use order cancellation/settlement path |
| BE25B-GMC13 | Seller cannot transition visible listing | 403 | LISTING_STATE_FORBIDDEN | Use authorized seller operator |
| All | Idempotency key reused with different body | 409 | IDEMPOTENCY_KEY_REUSE | Generate a new key only for a new intent |
| All | Rate limit exceeded | 429 | RATE_LIMITED | Honor Retry-After; no request replay storm |
| All | Unknown/extra field or malformed body | 400 | INVALID_INPUT | Fix strict schema |

Every response in this matrix serializes through ErrorResponse and BE-00 ApiError { code, message, requestId, details }. Authorization failures do not disclose whether an inaccessible listing exists.

## Testing Strategy

### Contract and route tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25B-CON-001 | BE25B-GMC08, BE25B-GMC09 | Strict schemas reject unknown keys, unsafe text, invalid UUID/date, overlarge arrays, default grade, and invalid originality values |
| BE25B-CON-002 | BE25B-GMC10 | Binding/unmatched XOR, media count/hash/alt text, and seller account validation are enforced |
| BE25B-CON-003 | BE25B-GMC11 | Literal confirmations, expected draft state/version, and ApiError response shape are enforced |
| BE25B-CON-004 | BE25B-GMC12, BE25B-GMC13 | Nonempty patch, expected version/state, legal transitions, and strict operationId success are enforced |
| BE25B-ROUTE-001 | BE25B-GMC08 through BE25B-GMC13 | Method/path registry is exact; no route aliases bypass middleware |

### Authorization and privacy tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25B-AUTH-001 | BE25B-GMC08 through BE25B-GMC13 | Cross-seller access returns indistinguishable 404; visible missing grant returns 403 |
| BE25B-AUTH-002 | BE25B-GMC10, BE25B-GMC11 | Delegated seller operator grant is scoped to seller account; moderator cannot impersonate publication |
| BE25B-AUTH-003 | BE25B-GMC08, BE25B-GMC09, BE25B-GMC12 | Buyer-pinned/sold disclosure and public hash cannot be changed; evidence bytes never appear in response |
| BE25B-AUTH-004 | BE25B-GMC11, BE25B-GMC13 | Screening worker signed token can only update named job/reason; forged worker request is 403 |

### Persistence, idempotency, and concurrency tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25B-DB-001 | BE25B-GMC08 through BE25B-GMC13 | Forced RLS denies direct anon/authenticated table access; RPC validates actor and expected version |
| BE25B-DB-002 | BE25B-GMC08, BE25B-GMC09, BE25B-GMC10 | Same idempotency key/body returns same result; same key/different body returns IDEMPOTENCY_KEY_REUSE |
| BE25B-DB-003 | BE25B-GMC11, BE25B-GMC12 | Concurrent publish/amend has one serializable winner; no dangling version or outbox row |
| BE25B-DB-004 | BE25B-GMC13 | Concurrent pause/end/relist obeys state lock and unique resulting version |
| BE25B-DB-005 | All assigned operations | Database field constraints, FKs, indexes, append-only versions, and RLS policies match this document |

### Domain, seam, event, and recovery tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25B-DOM-001 | BE25B-GMC08 | Flaw ceiling computes effective grade; only functional failure permits non_functioning; no default grade |
| BE25B-DOM-002 | BE25B-GMC09 | Originality aggregate preserves unknown and does not overwrite seller assertion from platform record |
| BE25B-DOM-003 | BE25B-GMC11 | Material contradiction blocks publication; screening outage yields pending/paused and never clear |
| BE25B-DOM-004 | BE25B-GMC12 | Material disclosure/model/media changes create new version, auto-pause, and enqueue re-screen |
| BE25B-DOM-005 | BE25B-GMC13 | End retains history; relist creates fresh draft relation; sold/pinned versions remain immutable |
| BE25B-SEAM-001 | BE25B-GMC08, BE25B-GMC10, BE25B-GMC11 | BE-00 media, BE-23 screening, BE-24 custody, and BE-25a refetch timeout/retry/circuit behavior is exact |
| BE25B-EVT-001 | BE25B-GMC08 through BE25B-GMC13 | Outbox event payload excludes private material; duplicate consumer delivery is idempotent |
| BE25B-REC-001 | BE25B-GMC11, BE25B-GMC13 | Lost response, deadlock, lease expiry, dependency outage, and worker poison cases recover as specified |

## Deepening Passes

| Pass | Question | Resolution and evidence |
|---|---|---|
| D1 contract completeness | Can any request omit a grade or silently receive a default? | No. Grade is a required enum in DisclosureInput and no default is defined; BE25B-CON-001 covers omission |
| D2 source truth | Can description or platform prefill become authoritative? | No. ListingModelBind and platform records are references; seller DisclosureVersion and evidence remain explicit |
| D3 authority | Can seller edit published or buyer-pinned bytes in place? | No. ListingVersion and DisclosureVersion are append-only; lock and 403 behavior are explicit |
| D4 security | Can inaccessible listing existence be inferred? | No. Ownership failures resolve to 404; visible missing grants resolve to 403 |
| D5 race safety | Can amend race publish, order, or screening? | Expected versions plus advisory/serializable locks and screening hold rules resolve each race |
| D6 reliability | What happens if response or outbox delivery is lost? | Idempotency lookup recovers responses; atomic outbox and consumer refetch provide at-least-once safety |
| D7 privacy | Do evidence bytes, raw serials, notes, or signed URLs leak? | No. Contracts carry IDs/hashes only; logs/events redact sensitive fields |
| D8 interoperability | Are external seams actionable? | Every seam defines request, response, timeout, retry/backoff, and circuit behavior |
| D9 persistence | Are fields and grants implementable? | Each table lists SQL type, nullability, constraints/FKs, indexes, RLS and grants |
| D10 testability | Does every operation have contract, auth, rate, observability, and tests? | Registry rows and keyed test rows cover BE25B-GMC08–GMC13 |

## Ambiguity Gate

**PASS.** Evidence: interactions 25.08–25.13 map one-to-one to BE25B-GMC08–GMC13; DisclosureVersion, EvidenceFrame, EvidencePack, Listing, and ListingVersion ownership is explicit; grade and originality semantics are concrete; publication and amendment gates name every dependency; state transitions, buyer pinning, sold immutability, screening outage, ownership privacy, retries, RLS/grants, CORS policy gear-api, global ApiError, and test rows are specified. Cross-companion ownership of ListingModelBind, MarketplaceUnit, inventory, theft screening, provenance, market guides, and storefront policy is referenced without duplicate routes.

## Open Questions

None

## Dependency References

- BE-00 platform contracts in 00-infrastructure.md: strict Zod 4, ApiError { code, message, requestId, details }, CORS, idempotency, outbox, forced RLS, and audit ordering.
- BE-23b screening contract in 23b-theft-screening-recovery.md: screening status and positive-hit hold; this companion never adjudicates theft.
- BE-24d custody contract in 24d-custody-cases-manifests.md: custody boundary grant and evidence handoff; this companion stores only the reference.
- BE-25a catalog contract in 25a-gear-catalog-authority-matching.md: CategorySchemaVersion and ListingModelBind validation; this companion never creates catalog authority.
- BE-25c inventory contract: MarketplaceUnit eligibility, claim, and stock state are consumed for publish/resume.
- BE-25d market/policy contract: provenance and storefront policy projections consume listing/version events.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-08-28 | Initial production-grade BE companion for interactions 25.08–25.13; routes, strict contracts, immutable versions, disclosure/publication gates, persistence, RLS, eventing, recovery, and ambiguity evidence added |
