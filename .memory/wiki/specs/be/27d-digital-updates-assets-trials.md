# BE-27d — Digital Updates, Assets, Release Channels, and Trials

## Classification

This companion is the backend contract for 27.14–27.19: publish an ordinary product update, select a release channel, search owned assets, audition content, update buyer tags/collections, and start a trial/free grant. It owns DigitalAsset and the update, channel, audition, organization, and trial projections required for those interactions. It consumes immutable ProductVersion, ArtifactVersion, Entitlement, TransferGrant, LibraryProjection, terms, and withdrawal facts from 27a–27c/27e. It does not mutate a published version, force migration, sell individual pack files, create a separate trial object, run activation, adjudicate rights, or expose original download URLs.

| Boundary | Included | Excluded and handoff |
| --- | --- | --- |
| Interaction ownership | 27.14 Publish ordinary update; 27.15 Select release channel; 27.16 Search owned assets; 27.17 Audition content; 27.18 Update buyer tags/collections; 27.19 Start trial/free grant | Catalog/compatibility 27a; submission/QA/publication 27b; entitlement/library/delivery authority 27c; enforcement/retirement/portability 27e |
| Update authority | New immutable ProductVersion/ArtifactVersion release notes and optional holder notification | Existing version mutation, forced migration, artifact master replacement, entitlement range rewrite |
| Asset/library authority | File/asset search and audition projections with music facets, confidence, holder tags, and separate owned/store bands | Pack billing, individual file purchase, holder identity blending, original artifact delivery |
| Trial authority | Vendor-policy and origin-admitted grant through the same Entitlement model with bounded expiry and appealable abuse checks | Separate trial product, unbounded free access, payment capture, activation, or rights decision |

The implementation target is TypeScript on Hono/Cloudflare Workers with Supabase PostgreSQL, strict Zod 4 contracts, protected Supabase Storage, transactional audit/outbox, forced RLS, structured logs, and Sentry-compatible telemetry. Ordinary updates remain optional for holders; every previously entitled version stays fetchable unless a smallest-scope malicious or rights withdrawal applies.

## Referenced Material Inventory

| Source | Location | Material used | Traceability |
| --- | --- | --- | --- |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 24–40 | Version immutability, delivery, updates, library, pack/file grain, watermark, and vendor-exit decisions | Classification, state, and asset rules preserve these locks |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 77–99 | Interaction definitions 27.14–27.19 and preconditions/outcomes | One operation ID maps to each assigned interaction |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 108–120 | PublishProductUpdate and adjacent entitlement/transfer commands | Update and trial contracts preserve immutable version and same-entitlement rules |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 130–146 | ArtifactVersion, TransferGrant, LibraryProjection, DigitalAsset, Entitlement, and all canonical models | Model inventory and persistence mapping distinguish owned versus consumed models |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 148–167 | Typed field/cardinality registry and immutable corrections | Persistence rows use explicit SQL types, nullability, constraints, FKs, indexes, RLS, and grants |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 208–225 | Exact Event Schemas and privacy rule | Event inventory uses every literal type and no original URLs/identity maps |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 32–39 | Delivery/withdrawal behavior, update optionality, range authorization, and withdrawal effects | Update/channel/audition state and race matrices preserve delivery authority |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 22–30 | Library projection, holder scope, as-of behavior, and re-purchase | Search/organization/trial contracts preserve one-holder projection |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 118–127 | Rig advisory, activation, gift, freeware/trial, pack/file grain, and watermark locks | Trial and audition rules remain separate from activation and file purchase |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 105–110 | Update/withdrawal, vendor-exit, and metadata-correction races | Concurrency and recovery matrix makes optional update and old-version access executable |
| BE platform | .memory/wiki/specs/be/00-infrastructure.md lines 112–153 | Global strict Zod 4 conventions and ApiError { code, message, requestId, details } | Every request, success, and error contract cites the global envelope |
| BE platform | .memory/wiki/specs/be/00-infrastructure.md lines 208–308 | Auth, CORS, rate, idempotency, audit/outbox, RLS, grants, and object delivery | Middleware, persistence, and observability matrices inherit these contracts |
| BE identity | .memory/wiki/specs/be/23-gear-provenance.md and .memory/wiki/specs/be/24-gear-collections.md | Person/org holder control and organization grant | Library, tags, auditions, and trials are holder-scoped |
| BE adjacent | .memory/wiki/specs/be/27a-digital-product-catalog-compatibility.md, 27b-digital-submission-qa-publication.md, 27c-digital-entitlements-library-delivery.md, 27e-digital-enforcement-retirement-portability.md | Immutable product/publication producer, entitlement/delivery authority, and withdrawal consumer | Dependency references identify producer/consumer direction |

## IA Source Map

### Assigned interactions

| IA interaction | IA intent and invariant | Backend operation | Authority |
| --- | --- | --- | --- |
| 27.14 | Publish ordinary update | BE27D-DCD14 | New version/release notes/compatibility and artifact references append; prior entitled versions remain |
| 27.15 | Select release channel | BE27D-DCD15 | Stable/beta selection is versioned and future executable gate-aware; vendor may stage/withdraw with reason |
| 27.16 | Search owned assets | BE27D-DCD16 | Holder-scoped asset facets and separate owned/store bands return current projection |
| 27.17 | Audition content | BE27D-DCD17 | Complete-duration protected rendition streams with source/confidence labels; original download is never returned |
| 27.18 | Update buyer tags/collections | BE27D-DCD18 | Holder-owned metadata survives product revision/refund tombstone and re-purchase relights without merging entitlements |
| 27.19 | Start trial/free grant | BE27D-DCD19 | Same Entitlement model records origin/expiry; vendor policy, platform bounds, and abuse review apply |

### Canonical Data Models

| IA model name | Role in this companion | Durable authority or reference |
| --- | --- | --- |
| DigitalAsset | Owned file/asset metadata, music facets, confidence, and organization projection | platform_private.digital_assets |
| ProductVersion | Consumed immutable current/prior version | BE-27a |
| DigitalProduct | Consumed product identity/type | BE-27a |
| CompatibilityMatrix | Consumed per-version support facts | BE-27a |
| DependencyEdge | Consumed per-version dependency facts | BE-27a |
| VendorSubmission | Consumed publication provenance | BE-27b |
| QaCheck | Consumed QA scope/result | BE-27b |
| ReviewDecision | Consumed high-risk review | BE-27b |
| LicenceTermsVersion | Consumed structured terms | BE-27b |
| Entitlement | Consumed primary holder/grant fact and owned by 27c | BE-27c |
| AcquisitionEpoch | Consumed purchase/grant history | BE-27c |
| SeatAuthorization | Future activation model; never created by trial or channel route | BE-27c/provider |
| ArtifactVersion | Consumed immutable artifact/channel/withdrawal fact | BE-27b/27c |
| TransferGrant | Consumed download authorization; audition uses distinct rendition grant | BE-27c |
| LibraryProjection | Consumed holder-scoped entitlement projection | BE-27c |
| VendorContinuityManifest | Consumed continuity obligation | BE-27b/27e |

Auxiliary records UpdateRelease, ReleaseChannelSelection, AuditionGrant, AssetOrganization, and TrialGrantProjection are operational projections and do not replace the canonical IA models.

### Event Schemas

| Exact Event Schemas type | Produced/consumed | Payload authority and privacy rule |
| --- | --- | --- |
| digital_product.update_published.v1 | Produced by BE27D-DCD14/DCD15 | Product/prior-new version, notes hash, compatibility change, release channel; no artifact bytes |
| digital_asset.metadata_changed.v1 | Produced by BE27D-DCD18 | Asset prior/new metadata version, facet/confidence hashes; no buyer identity |
| digital_entitlement.issued.v1 | Produced by BE27D-DCD19 through 27c entitlement authority | Entitlement/epoch, origin/trial expiry, holder hash; no grant URL |
| digital_transfer.grant_created.v1 | Consumed from 27c for owned delivery | Artifact-bound grant/expiry/concurrency |
| digital_transfer.completed.v1 | Consumed from 27c | Range/hash completion only |
| digital_entitlement.state_changed.v1 | Consumed from 27c/27e | Entitlement state/trigger/version |
| digital_product.version_submitted.v1 | Consumed from 27b | Publication context |
| digital_product.qa_completed.v1 | Consumed from 27b | QA scope/results, no rights/safety assertion |
| digital_product.published.v1 | Consumed from 27b | Immutable product/version/terms/artifact snapshot |
| digital_artifact.withdrawn.v1 | Consumed from 27e | Withdrawal scope controls audition/channel/delivery |
| digital_vendor.retired.v1 | Consumed from 27e | Vendor continuity/retirement status |
| digital_enforcement.requested.v1 | Consumed from 27e | Scoped enforcement case/reason |

## Endpoint Reconciliation

BE-00 owns authentication/session, global errors, idempotency receipts, audit/outbox, object storage grants, CORS, and safe rendition signing. BE-27a owns product/type/version/catalog facts; BE-27b owns artifact publication, terms, QA, review, and continuity; BE-27c owns Entitlement, AcquisitionEpoch, TransferGrant, LibraryProjection, and live delivery; BE-27e owns enforcement, withdrawal, retirement, and portability. BE-23/24 own person/org holder control and custody boundaries. The six routes below are the only public routes for 27.14–27.19. No route here mutates an old version, sells a file, creates a separate trial object, runs activation, grants a seat, issues a full artifact URL, adjudicates rights, or forces migration.

An ordinary update is offered, never forced. An entitled old version remains fetchable subject to current withdrawal. Release channel selection is a content/version preference; executable plugins remain disabled until a separately locked admission gate. Audition is a complete-duration protected rendition and abuse signal, not original download. Buyer organization survives refund tombstones and product revisions. A trial/free grant uses the same Entitlement model, with origin and bounded expiry.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Command | Success |
| --- | --- | --- | --- | --- | --- |
| BE27D-DCD14 | POST | /api/v1/digital/products/{productId}/updates | 27.14 | PublishProductUpdate | 201 ProductUpdateSuccess |
| BE27D-DCD15 | POST | /api/v1/digital/products/{productId}/release-channels | 27.15 | SelectReleaseChannel | 200 ReleaseChannelSuccess |
| BE27D-DCD16 | GET | /api/v1/digital/library/assets | 27.16 | SearchOwnedAssets | 200 AssetSearchSuccess |
| BE27D-DCD17 | POST | /api/v1/digital/assets/{assetId}/auditions | 27.17 | AuditionContent | 201 AuditionGrantSuccess |
| BE27D-DCD18 | PATCH | /api/v1/digital/library/assets/{assetId}/organization | 27.18 | UpdateBuyerOrganization | 200 AssetOrganizationSuccess |
| BE27D-DCD19 | POST | /api/v1/digital/entitlements/{entitlementId}/trial-grants | 27.19 | StartTrialFreeGrant | 201 TrialGrantSuccess |

### Pagination and bounded query policy

| Operation ID | Allowlisted filters | Page size | Cursor and stable ordering |
|---|---|---|---|
| BE27D-DCD16 | `query`, `facets` with `SafeCode` keys and bounded values, `band`; holder is resolved from authorized context; no arbitrary filter or sort keys | Default 50, maximum 100; `AssetSearchSuccess.rows` never exceeds the requested limit | Opaque cursor is bound to holder, normalized query/facets, band, projection version and sort; order by `productVersionId ASC`, `assetId ASC` tie-break |

The cursor is rejected when holder, query, facet set, band or projection
version changes. `nextCursor` is emitted only when another bounded page exists;
owned and store bands are never mixed by an implicit fallback.

### Request/response contracts (Zod 4)

All schemas are strict Zod 4. UUIDs are canonical lowercase strings; dates are RFC 3339 UTC; hashes are lowercase SHA-256; codes are allowlisted. Unknown keys, unsafe text, unbounded metadata, forced migration flags, original-download requests, cross-holder tags, unbounded trial duration, and missing idempotency keys fail before mutation. Every failure serializes the BE-00 global envelope ApiError { code, message, requestId, details } through ErrorResponse.

~~~ts
const Id = z.string().uuid();
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const IsoDate = z.string().datetime({ offset: true });
const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const SafeCode = z.string().trim().regex(/^[A-Z0-9_:-]{2,80}$/);
const SafeText = z.string().trim().min(1).max(2000);
const Gcf14Request = z.object({
  operationId: z.literal("BE27D-DCD14"),
  productId: Id,
  priorProductVersionId: Id,
  newProductVersionId: Id,
  releaseNotes: SafeText,
  compatibilityChangeHash: Hash,
  artifactVersionId: Id,
  notificationPolicy: z.enum(["notify_entitled_holders", "silent_metadata_correction"]),
  expectedProductVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const Gcf15Request = z.object({
  operationId: z.literal("BE27D-DCD15"),
  productId: Id,
  productVersionId: Id,
  channel: z.enum(["stable", "beta"]),
  vendorAction: z.enum(["stage", "withdraw"]),
  reasonCode: SafeCode.nullable(),
  expectedProductVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const Gcf16Request = z.object({
  operationId: z.literal("BE27D-DCD16"),
  holderPartyId: Id,
  query: z.string().trim().max(180).default(""),
  facets: z.record(SafeCode, z.string().trim().max(120)).default({}),
  band: z.enum(["owned", "store"]).default("owned"),
  cursor: z.string().trim().max(256).nullable(),
  limit: z.number().int().min(1).max(100).default(50),
}).strict();
const Gcf17Request = z.object({
  operationId: z.literal("BE27D-DCD17"),
  assetId: Id,
  holderPartyId: Id.nullable(),
  requestedDurationSeconds: z.number().int().min(1).max(3600),
  purpose: z.literal("protected_audition"),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const Gcf18Request = z.object({
  operationId: z.literal("BE27D-DCD18"),
  assetId: Id,
  holderPartyId: Id,
  collectionIds: z.array(Id).max(50),
  buyerTags: z.array(SafeCode).max(50),
  expectedOrganizationVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const Gcf19Request = z.object({
  operationId: z.literal("BE27D-DCD19"),
  entitlementId: Id,
  vendorPolicyId: Id,
  holderPartyId: Id,
  durationDays: z.number().int().min(1).max(365),
  origin: z.enum(["trial", "free_grant"]),
  abuseReviewToken: Hash.nullable(),
  expectedEntitlementVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const ProductUpdateSuccess = z.object({
  operationId: z.literal("BE27D-DCD14"),
  updateId: Id,
  productId: Id,
  priorProductVersionId: Id,
  newProductVersionId: Id,
  state: z.enum(["published", "pending_notification"]),
  oldVersionPreserved: z.literal(true),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const ReleaseChannelSuccess = z.object({
  operationId: z.literal("BE27D-DCD15"),
  selectionId: Id,
  productVersionId: Id,
  channel: z.enum(["stable", "beta"]),
  state: z.enum(["staged", "withdrawn", "executable_disabled"]),
  executableEnabled: z.literal(false),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const AssetSearchSuccess = z.object({
  operationId: z.literal("BE27D-DCD16"),
  holderPartyId: Id,
  band: z.enum(["owned", "store"]),
  rows: z.array(z.object({
    assetId: Id,
    entitlementId: Id.nullable(),
    productVersionId: Id,
    facetConfidence: z.enum(["high", "medium", "low", "unknown"]),
    buyerTags: z.array(SafeCode),
    organizationState: z.enum(["holder_controlled", "vendor_managed", "support_hold", "not_applicable"]),
  }).strict()),
  nextCursor: z.string().nullable(),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const AuditionGrantSuccess = z.object({
  operationId: z.literal("BE27D-DCD17"),
  auditionGrantId: Id,
  assetId: Id,
  durationSeconds: z.number().int().positive(),
  renditionHash: Hash,
  sourceLabel: SafeCode,
  confidenceLabel: SafeCode,
  expiresAt: IsoDate,
  originalDownloadUrl: z.literal(null),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const AssetOrganizationSuccess = z.object({
  operationId: z.literal("BE27D-DCD18"),
  assetId: Id,
  holderPartyId: Id,
  collectionIds: z.array(Id),
  buyerTags: z.array(SafeCode),
  state: z.enum(["active", "tombstoned"]),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const TrialGrantSuccess = z.object({
  operationId: z.literal("BE27D-DCD19"),
  entitlementId: Id,
  acquisitionEpochId: Id,
  origin: z.enum(["trial", "free_grant"]),
  state: z.enum(["active", "expired", "suspended"]),
  expiresAt: IsoDate,
  sameEntitlementModel: z.literal(true),
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

Gcf14 requires the new version and ArtifactVersion to be published by 27b and leaves the prior version untouched. Gcf15 cannot enable executable delivery; executableEnabled is always false in this contract. Gcf17 signs only a protected rendition and returns originalDownloadUrl null. Gcf19 validates the vendor policy and delegates primary entitlement issuance to 27c, retaining origin/expiry in the same model. Response replay returns the original stored response through BE-00 idempotency.

### Contract Registry

| Operation ID | Request contract | Success contract and invariant | Error contract | Atomic write set |
| --- | --- | --- | --- | --- |
| BE27D-DCD14 | Gcf14Request strict; prior/new version, notes, compatibility hash, artifact, notification policy | ProductUpdateSuccess; oldVersionPreserved=true and no forced migration | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Update projection, version handoff, notification outbox, audit, and idempotency receipt |
| BE27D-DCD15 | Gcf15Request strict; stable/beta channel, stage/withdraw, reason, expected version | ReleaseChannelSuccess; executableEnabled=false at launch | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Channel selection, artifact state handoff, audit, outbox, and idempotency receipt |
| BE27D-DCD16 | Gcf16Request strict; holder, query/facets, band, cursor, limit | AssetSearchSuccess; one-holder projection and owned/store separation | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Projection read/version trace and idempotency receipt where used |
| BE27D-DCD17 | Gcf17Request strict; asset, bounded rendition duration, protected purpose | AuditionGrantSuccess; source/confidence labels and originalDownloadUrl null | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Audition grant, abuse signal, rendition lease, audit, and idempotency receipt |
| BE27D-DCD18 | Gcf18Request strict; holder-owned collections/tags and expected organization version | AssetOrganizationSuccess; metadata survives revisions/refund tombstones | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Organization projection, metadata event, audit, and idempotency receipt |
| BE27D-DCD19 | Gcf19Request strict; existing entitlement, vendor policy, holder, bounded duration, origin | TrialGrantSuccess; sameEntitlementModel=true and expiry bounded by policy | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Entitlement/epoch handoff, expiry clock, abuse signal, audit, outbox, and idempotency receipt |

## Authorization and Ownership

Resource existence is resolved after coarse authentication. A hidden product, asset, entitlement, holder, or grant returns 404; a visible resource for which the actor lacks holder/vendor action authority returns 403. Error details never reveal purchaser identity, source bytes, signed URLs, vendor private metadata, or another holder's organization.

| Operation ID | Allowed roles | Ownership and object scope | 403 versus 404 |
| --- | --- | --- | --- |
| BE27D-DCD14 | Vendor party controller; publication worker; support case-bound | Product/version and update belong to vendor; prior/new snapshots and artifact gate must match | Hidden product/version returns 404 PRODUCT_VERSION_NOT_FOUND; visible version without update grant returns 403 UPDATE_FORBIDDEN |
| BE27D-DCD15 | Vendor party controller; release worker; support case-bound | Vendor controls channel selection for own product/version; buyer cannot stage vendor release | Hidden product/version returns 404 PRODUCT_VERSION_NOT_FOUND; visible version without channel grant returns 403 CHANNEL_FORBIDDEN |
| BE27D-DCD16 | Controlled holder; support case-bound | Holder controls projection; store band is separate public-safe data; organization grant explicit | Hidden holder returns 404 HOLDER_NOT_FOUND; visible holder without control returns 403 ASSET_SEARCH_FORBIDDEN |
| BE27D-DCD17 | Controlled holder; audition worker; public listener only for public-eligible asset | Asset and rendition scope checked; holder entitlement required for owned asset; no original URL | Hidden asset returns 404 ASSET_NOT_FOUND; visible asset without audition grant returns 403 AUDITION_FORBIDDEN |
| BE27D-DCD18 | Controlled holder; support case-bound | Buyer tags/collections belong to holder and asset organization projection | Hidden asset/holder returns 404 ASSET_NOT_FOUND; visible asset without holder grant returns 403 ASSET_ORGANIZATION_FORBIDDEN |
| BE27D-DCD19 | Holder/purchaser party controller; vendor grant worker; 27c entitlement worker; support dual control | Existing entitlement and vendor policy scope the same holder; trial origin does not replace entitlement | Hidden entitlement returns 404 ENTITLEMENT_NOT_FOUND; visible entitlement without holder/policy grant returns 403 TRIAL_FORBIDDEN |

Vendor receives aggregate update/delivery outcomes and never buyer identity or watermark mapping. Organization holders use canonical controlled-party grants. Support may restore a tombstoned organization projection with an expiring grant but cannot merge entitlements, extend a trial outside policy, expose original bytes, or enable executable delivery.

## Middleware and Security

### Per-operation middleware registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
| --- | --- | --- | --- |
| BE27D-DCD14 | requestId → CORS → auth → vendor context → rate limit → idempotency → strict body validation → publication/version lock → notification policy → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 128 KiB body; immutable version refs; no forced migration or artifact mutation |
| BE27D-DCD15 | requestId → CORS → auth → vendor context → rate limit → idempotency → strict body validation → channel/version lock → executable policy → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 64 KiB body; stable/beta allowlist; executable flag forced false; reason required for withdraw |
| BE27D-DCD16 | requestId → CORS → auth → holder control → rate limit → strict query validation → projection/as-of/owned-band gate → handler/read audit | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | Query/facet/limit bounds; no holder blending; store and owned bands separate |
| BE27D-DCD17 | requestId → CORS → auth → asset/holder context → rate limit → idempotency → strict body validation → withdrawal/entitlement gate → rendition signer → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 64 KiB body; duration bound; protected rendition only; originalDownloadUrl forced null |
| BE27D-DCD18 | requestId → CORS → auth → holder control → rate limit → idempotency → strict body validation → organization lock → tag/collection policy → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 64 KiB body; safe tags/collection IDs; no cross-holder write; metadata event only |
| BE27D-DCD19 | requestId → CORS → auth → holder/vendor policy context → rate limit → idempotency → strict body validation → entitlement/version lock → abuse policy → 27c handoff → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 64 KiB body; duration bound; same entitlement model; no standalone trial or activation |

All routes apply CSRF protection for browser credentials, origin allowlisting, content-type/body-size limits, safe response headers, request-scoped tracing, and structured redaction. Object storage uses BE-00 purpose-bound grants. Audition output is a protected rendition with short expiry and no original URL. Public events expose hashes/status only.

## Idempotency, Rate Limits, and SLOs

| Operation ID | Idempotency and concurrency | Rate limit | SLO and timeout |
| --- | --- | --- | --- |
| BE27D-DCD14 | Required key/body hash; unique product/new-version update; product lock; same key replay | 20 per vendor per 10 minutes, burst 3 | p95 1.5 s, hard 15 s |
| BE27D-DCD15 | Required key/body hash; one channel selection per product/version/channel; version lock | 30 per vendor per minute, burst 5 | p95 1.2 s, hard 15 s |
| BE27D-DCD16 | Cursor/projection version; repeated query is stable; no destructive mutation | 120 per holder per minute, burst 15 | p95 900 ms, hard 10 s |
| BE27D-DCD17 | Required key/body hash; one active audition lease per asset/account/rendition; rendition request dedupe | 120 per holder/listener per minute, burst 15 | p95 1.2 s, hard 15 s; rendition signer bounded |
| BE27D-DCD18 | Required key/body hash; holder/asset organization version; metadata event dedupe | 60 per holder per minute, burst 8 | p95 900 ms, hard 15 s |
| BE27D-DCD19 | Required key/body hash; one trial/free grant per entitlement/policy epoch; entitlement lock | 10 per holder per 24 hours, burst 2 | p95 1.5 s, hard 15 s; 27c handoff asynchronous |

BE-00 idempotency receipts retain at least 24 hours with request hash, status, response, and expiry. A lost response is recovered by key lookup. Trial duration is bounded by vendor policy and platform maximum; a retry never extends expiry or creates a second entitlement epoch. Audition abuse checks are best-effort and appealable, never an automatic rights finding.

## Observability

| Operation ID | Metrics and alerts | Structured logs and traces | Audit/outbox evidence |
| --- | --- | --- | --- |
| BE27D-DCD14 | product_update_total; holder_notification_total; old_version_preserved_violation_total; latency | requestId, operationId, product/version hashes, channel/notification class, result; no notes/content | digital_product.update_published.v1; update/audit IDs |
| BE27D-DCD15 | release_channel_total by channel/state; executable_enable_attempt_total; withdrawal_total; latency | requestId, operationId, product/version hash, channel, vendor action, reason code, result | digital_product.update_published.v1; channel audit; executable policy audit |
| BE27D-DCD16 | asset_search_total by band; holder_forbidden_total; projection_stale_total; latency | requestId, operationId, holder hash, query/facet hash, band, row count, result | library.read audit; projection version |
| BE27D-DCD17 | audition_total; rendition_sign_total; original_url_attempt_total; abuse_signal_total; latency | requestId, operationId, asset hash, duration bucket, source/confidence label, withdrawal result; no URL | audition.grant.created; rendition lease/audit; no public event |
| BE27D-DCD18 | asset_organization_total; tag_reject_total; tombstone_relight_total; version_conflict_total | requestId, operationId, asset/holder hash, tag/collection counts, state, result; no private tag text | digital_asset.metadata_changed.v1; organization audit |
| BE27D-DCD19 | trial_grant_total by origin/state; abuse_review_total; trial_expiry_total; duplicate_epoch_total; latency | requestId, operationId, entitlement/holder hash, origin, duration bucket, policy ID hash, result | digital_entitlement.issued.v1; epoch/expiry audit; 27c handoff |

Trace spans include product.update, release.channel, asset.search, audition.rendition, organization.write, and trial.entitlement, preserving failures, stale versions, withdrawal kills, URL attempts, abuse appeals, and retries. Sentry scrubs holder identity, tags, notes, signed URLs, source metadata, and provider secrets. Alerts fire on forced migration, executable enable attempt, original URL generation, cross-holder tag write, and trial duration beyond policy.

## Persistence and RLS

All tables use protected schemas with enabled and forced RLS. Direct anon/authenticated table grants are denied. Security-invoker RPCs recheck vendor/holder control, product/version state, entitlement/withdrawal, rendition purpose, organization version, vendor trial policy, and expected versions. Every mutation writes audit and outbox rows in the same transaction. Artifact bytes and rendition bytes remain in BE-00 object storage.

### Complete table definitions

| Table / model | Typed fields with SQL types, nullability, constraints and FKs | Query indexes | RLS and grants |
| --- | --- | --- | --- |
| platform_private.digital_product_updates | id uuid PRIMARY KEY; product_id uuid NOT NULL REFERENCES platform_private.digital_products(id); prior_product_version_id uuid NOT NULL REFERENCES platform_private.digital_product_versions(id); new_product_version_id uuid NOT NULL REFERENCES platform_private.digital_product_versions(id); artifact_version_id uuid NOT NULL REFERENCES platform_private.digital_artifact_versions(id); release_notes text NOT NULL CHECK (char_length(release_notes) BETWEEN 1 AND 2000); compatibility_change_hash char(64) NOT NULL CHECK (compatibility_change_hash ~ '^[a-f0-9]{64}$'); notification_policy text NOT NULL CHECK (notification_policy IN ('notify_entitled_holders','silent_metadata_correction')); state text NOT NULL CHECK (state IN ('published','pending_notification','superseded')); old_version_preserved boolean NOT NULL DEFAULT true CHECK (old_version_preserved = true); version bigint NOT NULL CHECK (version > 0); created_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL; UNIQUE(product_id,new_product_version_id) | (product_id,created_at DESC); (new_product_version_id); (prior_product_version_id); (state,created_at DESC) | Vendor/publication worker scoped; holders see safe notes/status; forced RLS; no direct client grant |
| platform_private.release_channel_selections | id uuid PRIMARY KEY; product_id uuid NOT NULL REFERENCES platform_private.digital_products(id); product_version_id uuid NOT NULL REFERENCES platform_private.digital_product_versions(id); artifact_version_id uuid NOT NULL REFERENCES platform_private.digital_artifact_versions(id); channel text NOT NULL CHECK (channel IN ('stable','beta')); vendor_action text NOT NULL CHECK (vendor_action IN ('stage','withdraw')); reason_code text NULL CHECK (reason_code ~ '^[A-Z0-9_:-]{2,80}$'); state text NOT NULL CHECK (state IN ('staged','withdrawn','executable_disabled')); executable_enabled boolean NOT NULL DEFAULT false CHECK (executable_enabled = false); version bigint NOT NULL CHECK (version > 0); created_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL; UNIQUE(product_version_id,channel,version) | (product_id,channel,state); (product_version_id,channel); (artifact_version_id,state); (vendor_action,created_at DESC) | Vendor/release worker writes; holders see permitted channel; forced RLS; no direct client grant |
| platform_private.digital_assets / DigitalAsset | id uuid PRIMARY KEY; product_id uuid NOT NULL REFERENCES platform_private.digital_products(id); product_version_id uuid NOT NULL REFERENCES platform_private.digital_product_versions(id); artifact_version_id uuid NOT NULL REFERENCES platform_private.digital_artifact_versions(id); file_identity_hash char(64) NOT NULL CHECK (file_identity_hash ~ '^[a-f0-9]{64}$'); asset_type text NOT NULL CHECK (asset_type IN ('sample','preset','beat','template','plugin_component','demo')); metadata jsonb NOT NULL; facet_confidence jsonb NOT NULL; terms_version_id uuid NOT NULL REFERENCES platform_private.digital_licence_terms_versions(id); state text NOT NULL CHECK (state IN ('active','tombstoned','withdrawn')); packed_size bigint NOT NULL CHECK (packed_size > 0); unpacked_size bigint NULL CHECK (unpacked_size >= packed_size); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(product_version_id,file_identity_hash) | (product_version_id,asset_type); (file_identity_hash); (state,updated_at DESC); (product_id,updated_at DESC) | Public safe metadata projection; holder-owned results reference entitlement; worker writes; forced RLS; no direct client grant |
| platform_private.digital_audition_grants | id uuid PRIMARY KEY; asset_id uuid NOT NULL REFERENCES platform_private.digital_assets(id); entitlement_id uuid NULL REFERENCES platform_private.digital_entitlements(id); holder_party_id uuid NULL REFERENCES identity.parties(id); account_id uuid NOT NULL REFERENCES auth.users(id); purpose text NOT NULL CHECK (purpose = 'protected_audition'); requested_duration_seconds integer NOT NULL CHECK (requested_duration_seconds BETWEEN 1 AND 3600); rendition_object_id uuid NOT NULL REFERENCES platform_private.object_refs(id); rendition_hash char(64) NOT NULL CHECK (rendition_hash ~ '^[a-f0-9]{64}$'); source_label text NOT NULL CHECK (source_label ~ '^[A-Z0-9_:-]{2,80}$'); confidence_label text NOT NULL CHECK (confidence_label ~ '^[A-Z0-9_:-]{2,80}$'); expires_at timestamptz NOT NULL; state text NOT NULL CHECK (state IN ('active','expired','revoked','completed')); abuse_signal_state text NOT NULL CHECK (abuse_signal_state IN ('none','review','appealed')); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; UNIQUE(asset_id,account_id,rendition_hash) | (account_id,state); (asset_id,created_at DESC); (holder_party_id,created_at DESC); (expires_at,state); (abuse_signal_state) | Account/holder sees own grant; public asset grants are safe; BE-00 signs rendition; forced RLS; no direct client grant |
| platform_private.digital_asset_organizations | id uuid PRIMARY KEY; asset_id uuid NOT NULL REFERENCES platform_private.digital_assets(id); holder_party_id uuid NOT NULL REFERENCES identity.parties(id); collection_ids uuid[] NOT NULL CHECK (cardinality(collection_ids) <= 50); buyer_tags text[] NOT NULL CHECK (cardinality(buyer_tags) <= 50); state text NOT NULL CHECK (state IN ('active','tombstoned')); source_entitlement_id uuid NULL REFERENCES platform_private.digital_entitlements(id); version bigint NOT NULL CHECK (version > 0); updated_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(asset_id,holder_party_id) | (holder_party_id,state); (asset_id,holder_party_id); (source_entitlement_id); (updated_at DESC) | Holder-only write/read; tombstone survives refund/revision; re-purchase relights same holder row without merging entitlement; forced RLS |
| platform_private.digital_trial_grant_projections | id uuid PRIMARY KEY; entitlement_id uuid NOT NULL REFERENCES platform_private.digital_entitlements(id); acquisition_epoch_id uuid NOT NULL REFERENCES platform_private.digital_acquisition_epochs(id); vendor_policy_id uuid NOT NULL; holder_party_id uuid NOT NULL REFERENCES identity.parties(id); origin text NOT NULL CHECK (origin IN ('trial','free_grant')); starts_at timestamptz NOT NULL; expires_at timestamptz NOT NULL CHECK (expires_at > starts_at); policy_duration_days integer NOT NULL CHECK (policy_duration_days BETWEEN 1 AND 365); abuse_review_state text NOT NULL CHECK (abuse_review_state IN ('not_checked','clear','review','appealed')); state text NOT NULL CHECK (state IN ('active','expired','suspended')); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; UNIQUE(entitlement_id,origin,vendor_policy_id) | (holder_party_id,state); (entitlement_id,expires_at); (vendor_policy_id,state); (abuse_review_state) | Holder/vendor policy projection; 27c entitlement worker owns primary fact; forced RLS; no direct client grant |
| platform_private.digital_asset_event_inbox | id uuid PRIMARY KEY; provider_event_id text NOT NULL; event_type text NOT NULL; aggregate_id uuid NOT NULL; payload_hash char(64) NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'); received_at timestamptz NOT NULL; processed_at timestamptz NULL; state text NOT NULL CHECK (state IN ('received','processed','quarantined')); error_code text NULL; UNIQUE(provider_event_id,event_type) | (provider_event_id,event_type) unique; (state,received_at); (aggregate_id,received_at DESC) | Worker/service only; no client grant; forced RLS; raw payload protected |

Asset metadata is JSON validated against the asset type schema and stores confidence separately from value. The organization unique key is holder-scoped, so a refund tombstone does not erase buyer organization. The partial/active uniqueness rules are implemented as PostgreSQL indexes matching the stated state predicates. TrialGrantProjection cannot replace an Entitlement or widen its expiry.

### Permission and RLS matrix

| Principal | Read projection | Write path | Prohibited |
| --- | --- | --- | --- |
| Vendor party controller | Own update/channel/trial policy status and aggregate holder outcomes | GCF14/GCF15 and policy-scoped GCF19 | Cannot force migration, enable executable plugin, edit buyer tags, or view buyer identity |
| Holder person/org controller | Own asset search, audition, organization, entitlement/trial status | GCF16–GCF19 with holder grant | Cannot edit product metadata, choose vendor release, access original URL, or merge entitlements |
| Publication/update worker | Product/version/artifact/terms snapshots | GCF14 atomic handoff | Cannot mutate old artifact or bypass 27b QA/publication |
| Delivery/audition worker | Asset, entitlement, withdrawal, rendition metadata | GCF17 grant/rendition RPC | Cannot issue entitlement, change terms, or expose master bytes |
| Entitlement/trial worker | Existing entitlement/policy/epoch scope | GCF19 handoff to 27c | Cannot mint separate trial object or change payment state |
| Support | Case-bound projection and expiring mechanical recovery | Dual-control organization/appeal RPC | Cannot force migration, extend trial beyond policy, or bypass withdrawal |
| Anon/authenticated table role | No direct table access | Public Hono routes only | Direct SQL/object/event grants denied |

## State Machines, Concurrency, and Failure Recovery

### Update, asset, audition, and trial state machines

ProductUpdate: requested → published or pending_notification; a later update supersedes selection but does not erase prior entitled versions. ReleaseChannelSelection: staged → withdrawn or executable_disabled; executable_enabled is not a state of this contract. DigitalAsset: active → tombstoned, withdrawn, or active after a metadata correction version. AuditionGrant: active → completed, expired, or revoked; malicious/rights withdrawal revokes according to scope.

TrialGrantProjection: requested → active → expired or suspended; primary Entitlement remains the same model with origin trial/free_grant and a bounded expiry. Abuse review is not an automatic rights verdict and may be appealed. Buyer organization: active → tombstoned and can relight on lawful repurchase without merging entitlement records.

### Race and recovery matrix

| Race/failure | Winner and invariant | Recovery |
| --- | --- | --- |
| Update publish versus old download | Grant remains artifact-bound; holder chooses new version | Keep old range fetchable unless withdrawal policy applies |
| Metadata correction versus active audition | New master/version/hash is used for new grant; current protected rendition completes by policy | Reauthorize next request; retain old audit |
| Channel selection versus executable policy | Launch policy wins; channel is staged/executable_disabled | Return disabled state; no activation route |
| Asset search versus entitlement state change | Live holder/entitlement projection determines owned row | Refetch projection; store band remains separate |
| Organization update versus refund tombstone | Holder organization write version wins; tombstone preserves history | Re-purchase relights row; no entitlement merge |
| Audition versus malicious/rights withdrawal | Withdrawal kills or scopes rendition immediately | Revoke grant, mark signal, notify safe reason |
| Trial start versus expiry/abuse review | Entitlement/policy lock serializes; expiry never extends on retry | Replay original; appeal review leaves state controlled |
| Trial start versus existing trial | Unique entitlement/policy origin wins | Return existing grant or stable conflict; no second epoch |
| Vendor exit versus committed order | Shard 28 resolves owned/refunded; continuity keeps required artifacts | Entitlement/delivery workers reconcile |
| Worker crash after update/trial write | Transactional outbox preserves durable state | Lease retry; event ID/aggregate/version dedupe |
| Deadlock/serialization conflict | No partial metadata/epoch | Retry twice at 50/150 ms, then return 409 |

Outbox delivery is at-least-once; consumers refetch canonical state and dedupe event ID plus aggregate/version. Queue/rendition leases expire after eight attempts. A stale cache cannot force migration, revive withdrawn content, extend a trial, or blend holder/store bands.

## External Seams

| Seam | Exact request | Exact response | Timeout | Retry/backoff | Circuit behavior |
| --- | --- | --- | --- | --- | --- |
| BE-00 idempotency/audit/outbox | { operationId, idempotencyKey, actorId, aggregateId, requestHash, response } | { receiptId, replay, auditId, outboxIds } | 2,000 ms | No independent retry outside transaction; transaction retry twice at 50/150 ms | Open after 3 failures in 30 s; command fails atomically |
| BE-00 rendition signer | { auditionGrantId, assetId, renditionObjectId, accountId, durationSeconds, purpose, expirySeconds } | { signedUrl, expiresAt, contentType, durationSeconds, renditionHash } | 3,000 ms | 2 retries at 200/600 ms on timeout; no retry on purpose/hash mismatch | Open after 3 failures in 60 s; audition remains pending |
| BE-27b publication/artifact | { productId, priorVersionId, newVersionId, artifactVersionId, termsVersionId, expectedVersion } | { published: true, artifactState, compatibilityHash, version } | 2,000 ms | 2 retries at 50/150 ms on serialization conflict only | Open after 3 failures in 30 s; update fails closed |
| BE-27c entitlement/delivery | { entitlementId, holderPartyId, artifactVersionId, action, expectedVersion } | { allowed: true/false, state, versionRange, withdrawalState, grantId } | 2,000 ms | 2 retries at 50/150 ms on serialization conflict; no retry on authorization deny | Open after 3 failures in 30 s; delivery/audition fails closed |
| BE-27c entitlement issue | { entitlementId, holderPartyId, origin, vendorPolicyId, expiresAt, proof } | { entitlementId, acquisitionEpochId, state, expiresAt, version } | 5,000 ms | 3 retries at 250/750/1500 ms for timeout/408/429/5xx; inquiry by entitlement/policy | Open after 5 failures in 120 s; trial remains pending |
| BE-27e withdrawal/enforcement | { assetId, artifactVersionId, entitlementId, requestedAt, currentVersion } | { state: available/superseded/defective/malicious/rights, scope, effectiveAt, reasonCode } | 3,000 ms | 3 retries at 200/600/1200 ms for timeout/408/429/5xx; inquiry by asset/version | Open after 5 failures in 60 s; audition/delivery denied or pending |
| BE-23/24 holder authority | { holderPartyId, accountId, capability, organizationGrantId } | { allowed: true/false, partyType, grantVersion } | 3,000 ms | 2 retries at 200/600 ms on timeout/408/429/5xx; no retry on deny | Open after 5 failures in 60 s; write fails closed |

Provider responses are schema-validated, correlation IDs are hashed in logs, and unknown states remain pending or denied. No seam can force migration, create per-file purchase, expose original URL, enable executable delivery, or bypass entitlement expiry.

## Events and Async Consumers

| Event type | Producer operation | Required envelope and payload | Consumer behavior |
| --- | --- | --- | --- |
| digital_product.update_published.v1 | BE27D-DCD14/DCD15 | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, productId, priorVersionId, newVersionId, channel, notesHash } | Library offers optional update; old range remains |
| digital_asset.metadata_changed.v1 | BE27D-DCD18 | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, assetId, priorVersion, newVersion, facetHash } | Search/audition projections refresh |
| digital_entitlement.issued.v1 | 27c handoff from BE27D-DCD19 | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, entitlementId, epochId, origin, holderHash, expiresAt } | Library/delivery enforce same entitlement |
| digital_entitlement.state_changed.v1 | 27c/27e | { eventId, aggregateId, aggregateVersion, entitlementId, priorState, newState, triggerCode } | Trial expiry/withdrawal updates projection |
| digital_transfer.grant_created.v1 | 27c | { eventId, aggregateId, aggregateVersion, grantId, artifactVersionId, expiry } | Owned delivery audit |
| digital_transfer.completed.v1 | 27c | { eventId, aggregateId, aggregateVersion, grantId, hash, ranges } | Completion metrics |
| digital_product.version_submitted.v1 | 27b | { eventId, aggregateId, aggregateVersion, productVersionId, submissionId, state } | Update waits for publication |
| digital_product.qa_completed.v1 | 27b | { eventId, aggregateId, aggregateVersion, submissionId, scopes, results } | Update gate context |
| digital_product.published.v1 | 27b | { eventId, aggregateId, aggregateVersion, productId, productVersionId, termsVersionId, artifactVersionId } | Asset/library availability |
| digital_artifact.withdrawn.v1 | 27e | { eventId, aggregateId, aggregateVersion, artifactId, reason, scope, effectiveAt } | Audition/channel/delivery reauthorize |
| digital_vendor.retired.v1 | 27e | { eventId, aggregateId, aggregateVersion, vendorId, continuityState, effectiveAt } | Old versions/continuity |
| digital_enforcement.requested.v1 | 27e | { eventId, aggregateId, aggregateVersion, caseId, targetHash, reasonClass } | Enforcement projection |

Outbox rows include event ID, aggregate ID/version, request ID, payload hash, and redacted payload. Events never include source bytes, signed URLs, buyer identity, private tags, or watermark mapping. Consumers acknowledge only after durable processing and refetch canonical state.

## Error Matrix

| Operation ID | Condition | HTTP | Error code | Retry/client action |
| --- | --- | --- | --- | --- |
| BE27D-DCD14 | Hidden product/version or vendor context | 404 | PRODUCT_VERSION_NOT_FOUND | Do not reveal |
| BE27D-DCD14 | New version/artifact not published or stale | 409 | UPDATE_VERSION_CONFLICT | Refetch 27b publication |
| BE27D-DCD14 | Forced migration requested | 422 | FORCED_MIGRATION_FORBIDDEN | Offer optional update |
| BE27D-DCD15 | Hidden product/version | 404 | PRODUCT_VERSION_NOT_FOUND | Do not reveal |
| BE27D-DCD15 | Channel not allowed or executable gate absent | 409 | CHANNEL_POLICY_CONFLICT | Keep executable_disabled; use content path |
| BE27D-DCD15 | Withdrawal reason missing | 422 | CHANNEL_REASON_REQUIRED | Supply scoped reason |
| BE27D-DCD16 | Hidden holder | 404 | HOLDER_NOT_FOUND | Do not reveal |
| BE27D-DCD16 | Holder control absent or invalid facet | 403 or 422 | ASSET_SEARCH_FORBIDDEN or ASSET_QUERY_INVALID | Use controlled holder/correct query |
| BE27D-DCD17 | Hidden asset | 404 | ASSET_NOT_FOUND | Do not reveal |
| BE27D-DCD17 | Entitlement/withdrawal/rendition authority fails | 409 | AUDITION_NOT_AUTHORIZED | Refresh state; no original URL |
| BE27D-DCD17 | Duration/source rendition invalid | 422 | AUDITION_REQUEST_INVALID | Use bounded duration |
| BE27D-DCD18 | Hidden asset/holder or stale organization version | 404 or 409 | ASSET_NOT_FOUND or ORGANIZATION_VERSION_CONFLICT | Refetch holder projection |
| BE27D-DCD18 | Tag/collection scope invalid | 422 | ASSET_ORGANIZATION_INVALID | Correct bounded metadata |
| BE27D-DCD19 | Hidden entitlement or vendor policy | 404 | ENTITLEMENT_NOT_FOUND | Do not reveal |
| BE27D-DCD19 | Trial already exists or expiry reached | 409 | TRIAL_ALREADY_USED or TRIAL_EXPIRED | Use existing entitlement state |
| BE27D-DCD19 | Duration exceeds policy/abuse review required | 422 or 403 | TRIAL_POLICY_INVALID or TRIAL_REVIEW_REQUIRED | Use bounded policy or appeal |
| All | Body/query/schema/unknown key/unsafe text | 400 or 422 | VALIDATION_FAILED | Correct field paths; do not retry unchanged |
| All | Rate limit exceeded | 429 | RATE_LIMITED | Honor Retry-After and same idempotency key |
| All | Publication/delivery/rendition circuit open | 503 | DEPENDENCY_UNAVAILABLE | Retry same key with backoff; fail closed |

Every response uses ErrorResponse with BE-00 ApiError { code, message, requestId, details }. Error details contain stable codes/paths only and never holder identity, tags, signed URLs, source bytes, or provider secrets.

## Testing Strategy

### Contract and route tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27D-CON-001 | BE27D-DCD14 | Strict update contract enforces prior/new version, artifact, notes, compatibility hash, notification, and old-version preservation |
| BE27D-CON-002 | BE27D-DCD15 | Strict stable/beta selection, stage/withdraw reason, version, executableDisabled, and no-enable response are exact |
| BE27D-CON-003 | BE27D-DCD16 | Strict holder query/facets/band/cursor and asset projection enforce owned/store separation |
| BE27D-CON-004 | BE27D-DCD17 | Strict audition duration/purpose and protected rendition response enforce originalDownloadUrl null |
| BE27D-CON-005 | BE27D-DCD18 | Strict holder organization version, bounded tags/collections, tombstone state, and response are exact |
| BE27D-CON-006 | BE27D-DCD19 | Strict same-entitlement trial/free grant, policy, bounded duration, expiry, and origin are exact |
| BE27D-ROUTE-001 | BE27D-DCD14 through BE27D-DCD19 | Method/path/operation registry is authoritative; aliases cannot bypass live gates |

### Authorization and privacy tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27D-AUTH-001 | BE27D-DCD14 through BE27D-DCD19 | Hidden resource returns 404; visible resource without role/grant returns 403; details conceal context |
| BE27D-AUTH-002 | BE27D-DCD14, BE27D-DCD15 | Vendor controls own update/channel; buyer cannot stage, withdraw, or force migration |
| BE27D-AUTH-003 | BE27D-DCD16, BE27D-DCD18 | Holder and organization control are scoped; store/owned bands and tombstones remain separate |
| BE27D-AUTH-004 | BE27D-DCD17 | Entitlement/asset/withdrawal/purpose and protected rendition access are enforced; no original URL |
| BE27D-AUTH-005 | BE27D-DCD19 | Vendor policy and holder grant are scoped; trial cannot become activation or separate entitlement |
| BE27D-AUTH-006 | All | CORS policy digital-api, CSRF, redaction, purpose-bound object access, and no direct grants are enforced |

### Persistence, idempotency, and concurrency tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27D-DB-001 | All | Forced RLS denies direct access; RPC checks party, state, version, withdrawal, policy, and append-only rules |
| BE27D-DB-002 | BE27D-DCD14, BE27D-DCD15 | Update/channel uniqueness, old-version preservation, staged/withdrawn state, and executable flag hold |
| BE27D-DB-003 | BE27D-DCD16, BE27D-DCD18 | Holder projection, facet scope, organization uniqueness, tombstone relight, and metadata event dedupe hold |
| BE27D-DB-004 | BE27D-DCD17 | Audition grant/rendition lease, duration/expiry, hash, withdrawal kill, and abuse signal hold |
| BE27D-DB-005 | BE27D-DCD19 | Same-entitlement trial uniqueness, bounded expiry, policy version, epoch handoff, and abuse review hold |
| BE27D-DB-006 | All assigned operations | Every field lists SQL type, nullability, constraints/FKs, indexes, forced RLS, and grants and migration tests cover them |

### Domain, seam, event, and recovery tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27D-DOM-001 | BE27D-DCD14, BE27D-DCD15 | Updates are optional, old versions remain entitled, release channel is versioned, executable content remains disabled |
| BE27D-DOM-002 | BE27D-DCD16, BE27D-DCD17 | Asset facets/confidence, complete-duration protected audition, abuse signal, and no original URL are enforced |
| BE27D-DOM-003 | BE27D-DCD18, BE27D-DCD19 | Buyer organization survives revisions/refund tombstones; trial uses same entitlement model and bounded policy |
| BE27D-SEAM-001 | BE27D-DCD14 through BE27D-DCD19 | BE-00, 27b publication, 27c entitlement/delivery, 27e withdrawal, identity, and rendition timeout/retry/circuit behavior is exact |
| BE27D-EVT-001 | BE27D-DCD14 through BE27D-DCD19 | Exact event types, redaction, outbox atomicity, aggregate/version dedupe, and consumer refetch are verified |
| BE27D-REC-001 | BE27D-DCD14 through BE27D-DCD19 | Lost responses, withdrawal race, old-version access, queue/rendition failure, tombstone relight, trial duplicate, deadlock, and poison payloads recover as specified |

## Deepening Passes

| Pass | Question | Resolution |
| --- | --- | --- |
| D1 interaction | Does every assigned IA interaction have one stable route? | Yes: 27.14–27.19 map one-to-one to BE27D-DCD14–DCD19 |
| D2 update | Can an ordinary update force migration or overwrite an entitled version? | No: new immutable version and optional notification; old version preserved |
| D3 channel | Can a beta/stable selection enable executable content at launch? | No: executableEnabled is forced false; separate admission is required |
| D4 assets | Can owned/store results blend or file purchase appear? | No: holder projection bands are separate and pack remains billing unit |
| D5 audition | Can audition return original bytes or URL? | No: protected complete-duration rendition with source/confidence labels and null original URL |
| D6 organization | Do tags/collections disappear on refund/revision or merge entitlements? | No: holder-owned tombstone relights without entitlement merge |
| D7 trial | Can a trial create a parallel object or unbounded grant? | No: same Entitlement model, origin/expiry, vendor/platform bounds, appealable abuse |
| D8 authorization | Are role ownership and 403 versus 404 explicit? | Yes: every operation has scoped role and concealment row |
| D9 persistence | Are all fields implementable and protected? | Yes: typed/nullability/constraints/FKs/indexes/RLS/grants are listed |
| D10 resilience | Are update, withdrawal, rendition, organization, and trial races deterministic? | Yes: exact seams, locks, retries, leases, dedupe, and fail-closed behavior |

## Ambiguity Gate

PASS. Evidence: 27.14–27.19 each map to one authoritative operation and route; DigitalAsset and update/channel/audition/organization/trial projections are owned while ProductVersion, DigitalProduct, CompatibilityMatrix, DependencyEdge, VendorSubmission, QaCheck, ReviewDecision, LicenceTermsVersion, Entitlement, AcquisitionEpoch, SeatAuthorization, ArtifactVersion, TransferGrant, LibraryProjection, and VendorContinuityManifest are consumed without route duplication; exact strict Zod 4 contracts and global ApiError { code, message, requestId, details } are present; every operation has role ownership, 403-vs-404, CORS policy digital-api, idempotency, rate limit, observability, typed persistence/RLS/grants, error rows, and keyed tests; optional updates, channel/executable gating, holder asset bands, protected audition, no original URL, buyer organization tombstones, same-entitlement trials, exact seams, event privacy, and recovery are resolved. Neighboring interactions 27.01–27.13 and 27.20–27.24 are referenced through explicit BE-27a/b/c/e and Shard 28 handoffs. No unresolved source conflict remains.

## Open Questions

None.

## Dependency References

- BE-00 platform contracts in 00-infrastructure.md: strict Zod 4, ApiError { code, message, requestId, details }, auth, CORS, idempotency, rate classes, audit/outbox, protected object/rendition grants, and forced RLS.
- BE-23/24 identity and collections: canonical person/org holder control, organization grants, provenance, and custody boundaries.
- BE-27a digital product catalog/compatibility: DigitalProduct, ProductVersion, CompatibilityMatrix, and DependencyEdge.
- BE-27b digital submission/QA/publication: VendorSubmission, QaCheck, ReviewDecision, LicenceTermsVersion, ArtifactVersion, and VendorContinuityManifest.
- BE-27c entitlements/library/delivery: Entitlement, AcquisitionEpoch, TransferGrant, LibraryProjection, live delivery, and same-entitlement grant authority.
- BE-27e enforcement/retirement/portability: withdrawals, enforcement, retirement, continuity, and portability state.
- Shard 28 commerce/refund/revenue: purchase/refund and vendor outcome consumers; this companion never changes payment allocation.

## Changelog

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-08-29 | Initial production-grade BE companion for interactions 27.14–27.19; immutable updates, release channels, asset search/audition, buyer organization, bounded same-entitlement trials, strict contracts, security, persistence/RLS, eventing, resilience, and ambiguity evidence added |
