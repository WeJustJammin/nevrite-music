# BE-27c — Digital Entitlements, Holder Library, and Delivery

## Classification

This companion is the backend contract for 27.10–27.13: issue an entitlement, view a holder-scoped library, request a download, and resume/verify a transfer. It owns Entitlement, AcquisitionEpoch, TransferGrant, and LibraryProjection. It consumes published ProductVersion, LicenceTermsVersion, ArtifactVersion, and continuity facts from 27a/27b, and consumes payment/order and optional Shard 28 bundle-allocation evidence without becoming the payment or revenue authority. It does not publish products, revise terms, adjudicate rights, run activation, or create a static download URL.

| Boundary | Included | Excluded and handoff |
| --- | --- | --- |
| Interaction ownership | 27.10 Issue entitlement; 27.11 View holder library; 27.12 Request download; 27.13 Resume/verify transfer | Catalog/compatibility 27a; submission/QA/publication 27b; updates/assets/trials 27d; enforcement/retirement/portability 27e |
| Entitlement authority | Immutable issuance fact, purchaser/holder, origin, frozen terms/version range, acquisition epochs, allocated consideration/currency, and explicit state history | Payment capture/refund/revenue, rights adjudication, key/activation seat, custody, and ownership transfer |
| Library authority | Holder-scoped derived projection with independent entitlement, vendor, management, current/as-of, and store bands | Vendor buyer identity, blended store/owned results, destructive history deletion |
| Delivery authority | Live entitlement/version/artifact/withdrawal checks, bounded buyer/artifact grant, range reauthorization, queue capacity, size/hash/expiry disclosure | Static public link, external activation service, DRM bridge, buyer-identifying watermark, or artifact master mutation |

The implementation target is TypeScript on Hono/Cloudflare Workers with Supabase PostgreSQL, strict Zod 4 contracts, protected Supabase Storage, transactional audit/outbox, forced RLS, structured logs, and Sentry-compatible telemetry. Entitlement is the primary durable fact; licence keys, activation seats, and transfer grants are authorizations derived from it and never replace it.

## Referenced Material Inventory

| Source | Location | Material used | Traceability |
| --- | --- | --- | --- |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 24–40 | Entitlement, terms, activation, delivery, version, library, pack billing, watermark, and vendor-exit decisions | Classification, state machine, and delivery rules preserve these locks |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 77–94 | Interaction definitions 27.10–27.13 and preconditions/outcomes | One operation ID maps to each assigned interaction |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 108–120 | IssueEntitlement, CreateTransferGrant, and adjacent command contracts | Request schemas preserve purchaser/holder, origin, frozen terms/range, and grant scope |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 130–146 | Entitlement, AcquisitionEpoch, TransferGrant, LibraryProjection, ArtifactVersion, and all downstream models | Model inventory and persistence mapping distinguish owned versus consumed models |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 148–167 | Typed field/cardinality registry and immutable epoch rules | Persistence rows use explicit SQL types, nullability, constraints, FKs, indexes, RLS, and grants |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 208–225 | Exact Event Schemas and privacy rule | Event inventory uses every literal type and redacts buyer identity/key/URL |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 22–30 | Entitlement/library algorithm: payment/grant proof, product-holder lock, epoch allocation, holder projection, as-of behavior, repurchase | State, contract, and race matrices make issuance/library rules executable |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 32–39 | Delivery algorithm: live checks, 72h grant default, size/hash/expiry, range reauthorization, queue, updates, withdrawals | Download and transfer contracts implement each step |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 54–60 | Entitlement invariants, purchaser/holder separation, indelible issuance, bundle allocation, key/seat/grant distinction, terms resolvability | Persistence constraints and external seams preserve authority |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 64–68 | Entitlement state machine, re-purchase, trial same-record rule | State and error matrices enforce lawful transitions |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 105–110 | Payment/retry, repurchase/revocation, range withdrawal, update, vendor exit, metadata races | Concurrency and recovery rules are explicit |
| BE platform | .memory/wiki/specs/be/00-infrastructure.md lines 112–153 | Global strict Zod 4 conventions and ApiError { code, message, requestId, details } | Every request, success, and error contract cites the global envelope |
| BE platform | .memory/wiki/specs/be/00-infrastructure.md lines 208–308 | Auth, CORS, rate, idempotency, audit/outbox, RLS, grants, object delivery, and callback controls | Middleware, persistence, and observability matrices inherit these contracts |
| BE commerce | Shard 28 bundle/allocation contracts referenced by IA lines 32, 90, 115 | Payment proof, standalone price basis, member allocation, promotion version, ownership quote | Gcf10 validates immutable evidence; Shard 28 remains apportionment authority |
| BE identity | .memory/wiki/specs/be/23-gear-provenance.md and .memory/wiki/specs/be/24-gear-collections.md | Person/org holder control and organization grant | Library and delivery are scoped to canonical holder control |
| BE adjacent | .memory/wiki/specs/be/27a-digital-product-catalog-compatibility.md, 27b-digital-submission-qa-publication.md, 27d-digital-updates-assets-trials.md, 27e-digital-enforcement-retirement-portability.md | Catalog/publication producer and update/withdrawal consumers | Dependency references identify producer/consumer direction |

## IA Source Map

### Assigned interactions

| IA interaction | IA intent and invariant | Backend operation | Authority |
| --- | --- | --- | --- |
| 27.10 | Issue entitlement | BE27C-DCD10 | Confirmed paid order or authorized grant atomically appends one acquisition epoch; pending payment grants nothing |
| 27.11 | View holder library | BE27C-DCD11 | Holder-scoped current/as-of projection keeps owned and store bands separate and never deletes history |
| 27.12 | Request download | BE27C-DCD12 | Live entitlement/version/artifact/withdrawal check mints bounded artifact-bound transfer grant |
| 27.13 | Resume/verify transfer | BE27C-DCD13 | Every range reauthorizes, queues on capacity, and verifies completion hash; no static public link |

### Canonical Data Models

| IA model name | Role in this companion | Durable authority or reference |
| --- | --- | --- |
| Entitlement | Owned primary holder/product authorization and state/history | platform_private.digital_entitlements |
| AcquisitionEpoch | Owned indelible purchase/grant acquisition and allocated consideration evidence | platform_private.digital_acquisition_epochs |
| TransferGrant | Owned bounded artifact/buyer transfer authorization | platform_private.digital_transfer_grants |
| LibraryProjection | Owned derived holder-scoped current/as-of projection | platform_private.digital_library_projections |
| DigitalProduct | Consumed product identity/type | BE-27a |
| ProductVersion | Consumed immutable product revision | BE-27a |
| CompatibilityMatrix | Consumed version compatibility facts for display only | BE-27a |
| DependencyEdge | Consumed version dependency facts for display only | BE-27a |
| VendorSubmission | Consumed provenance through publication | BE-27b |
| QaCheck | Consumed QA scope/result for artifact eligibility | BE-27b |
| ReviewDecision | Consumed high-risk review result | BE-27b |
| LicenceTermsVersion | Consumed frozen structured terms | BE-27b |
| SeatAuthorization | Future-gated activation authorization; not created here | BE-27d/provider |
| ArtifactVersion | Consumed immutable master/size/hash/withdrawal state | BE-27b/27d/27e |
| DigitalAsset | Consumed file/asset projection for pack search | BE-27d |
| VendorContinuityManifest | Consumed retention/continuity obligation | BE-27b/27e |

### Event Schemas

| Exact Event Schemas type | Produced/consumed | Payload authority and privacy rule |
| --- | --- | --- |
| digital_entitlement.issued.v1 | Produced by BE27C-DCD10 | Entitlement/epoch, product, purchaser/holder hashes, origin, terms/range, allocated amount/currency and bundle evidence versions |
| digital_entitlement.state_changed.v1 | Produced by state/revocation workers and consumed here | Entitlement prior/new state, trigger, version; no buyer identity map |
| digital_transfer.grant_created.v1 | Produced by BE27C-DCD12 | Grant, entitlement/artifact, expiry/concurrency, served hash; no signed URL |
| digital_transfer.completed.v1 | Produced by BE27C-DCD13 | Grant/artifact, bytes/ranges/hash, completion time; no source bytes |
| digital_product.version_submitted.v1 | Consumed from 27b | Publication pipeline context only |
| digital_product.qa_completed.v1 | Consumed from 27b | QA scopes/results; no rights/safety claim |
| digital_product.published.v1 | Consumed from 27b | Immutable product/version/terms/artifact snapshot |
| digital_product.update_published.v1 | Consumed from 27d | New version is optional; old entitled range remains |
| digital_artifact.withdrawn.v1 | Consumed from 27e | Current withdrawal scope controls delivery |
| digital_asset.metadata_changed.v1 | Consumed from 27d | Asset metadata version/confidence only |
| digital_vendor.retired.v1 | Consumed from 27e | Continuity/retirement state; required artifacts remain |
| digital_enforcement.requested.v1 | Consumed from 27e | Enforcement case status may suspend delivery |

## Endpoint Reconciliation

BE-00 owns authentication/session, global errors, idempotency receipts, audit/outbox, object storage grants, CORS, and safe signed URL issuance. BE-27a owns product/type/version/catalog facts; BE-27b owns publication, terms, QA/review, artifact and continuity gates; BE-27d owns updates, assets, auditions, tags, and trials; BE-27e owns enforcement, withdrawals, retirement, and portability. Shard 28 owns payment/order/refund/revenue and bundle allocation/apportionment; BE-23/24 own person/org holder and custody facts. The four routes below are the only public routes for 27.10–27.13. No route here publishes, charges, refunds, adjudicates rights, activates software, or creates a static URL.

Issuance locks product and holder, then appends an acquisition epoch. Purchaser and holder can differ and holder can be a person or controlled organization. A pending payment record grants nothing. An already-owned bundle member mints nothing; a new bundle epoch validates the captured member share, standalone-selling-price basis, promotion/member allocation, ownership quote, and version evidence supplied by Shard 28 without recomputing or re-apportioning it.

Current library view performs live authorization; as-of view reconstructs history but disables download. Owned and store result bands use shared vocabulary but never blend. Delivery mints a buyer/artifact-bound grant with configured lifetime default 72 hours, exposes packed/unpacked size, master hash, expiry, and concurrency, then reauthorizes every range. Queue capacity is not an authorization denial.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Command | Success |
| --- | --- | --- | --- | --- | --- |
| BE27C-DCD10 | POST | /api/v1/digital/entitlements | 27.10 | IssueEntitlement | 201 EntitlementSuccess |
| BE27C-DCD11 | GET | /api/v1/digital/library | 27.11 | ViewHolderLibrary | 200 LibrarySuccess |
| BE27C-DCD12 | POST | /api/v1/digital/entitlements/{entitlementId}/downloads | 27.12 | CreateTransferGrant | 201 TransferGrantSuccess |
| BE27C-DCD13 | PATCH | /api/v1/digital/transfers/{grantId}/ranges | 27.13 | ResumeVerifyTransfer | 200 TransferProgressSuccess |

### Pagination and bounded query policy

| Operation ID | Allowlisted filters | Page size | Cursor and stable ordering |
|---|---|---|---|
| BE27C-DCD11 | `query`, `asOf`, `band`; holder is resolved from the authorized party context; no arbitrary filter or sort keys | Default 50, maximum 100; `LibrarySuccess.rows` is capped at the requested limit | Opaque cursor is bound to holder, query, as-of timestamp, band, projection version and sort; order by `productId ASC`, `entitlementId ASC` tie-break |

The cursor is rejected when holder, query, as-of, band or projection version
changes. `nextCursor` is emitted only when another bounded page exists; as-of
results remain read-only and never become a delivery grant.

### Request/response contracts (Zod 4)

All schemas are strict Zod 4. UUIDs are canonical lowercase strings; dates are RFC 3339 UTC strings; hashes are lowercase SHA-256; money is integer minor units with uppercase three-letter currency. Unknown keys, unsafe text, stale payment/order proof, holder mismatch, invalid bundle allocation, static URL requests, unbounded ranges, and missing idempotency keys fail before mutation. Every failure serializes the BE-00 global envelope ApiError { code, message, requestId, details } through ErrorResponse.

~~~ts
const Id = z.string().uuid();
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const IsoDate = z.string().datetime({ offset: true });
const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const Currency = z.string().regex(/^[A-Z]{3}$/);
const Money = z.object({
  amountMinor: z.number().int().nonnegative().max(100000000000),
  currency: Currency,
}).strict();
const Range = z.object({
  startByte: z.number().int().nonnegative().max(50000000000),
  endByteExclusive: z.number().int().positive().max(50000000000),
}).strict().refine(v => v.endByteExclusive > v.startByte);
const Gcf10Request = z.object({
  operationId: z.literal("BE27C-DCD10"),
  productId: Id,
  productVersionId: Id,
  purchaserPartyId: Id,
  holderPartyId: Id,
  origin: z.enum(["purchase", "grant", "trial"]),
  termsVersionId: Id,
  versionRange: z.string().trim().min(1).max(180),
  orderProof: z.object({
    orderId: Id,
    orderLineId: Id,
    paymentState: z.enum(["confirmed", "authorized"]),
    proofHash: Hash,
  }).strict().nullable(),
  grantProof: z.object({
    grantRef: Id,
    authorizedByPartyId: Id,
    proofHash: Hash,
  }).strict().nullable(),
  allocation: z.object({
    standaloneSellingPriceMinor: z.number().int().nonnegative(),
    standalonePriceVersion: SafeCode,
    promotionAllocationId: Id.nullable(),
    bundleMemberId: Id.nullable(),
    ownershipQuoteId: Id.nullable(),
    memberShareMinor: z.number().int().nonnegative(),
    currency: Currency,
  }).strict().nullable(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict().superRefine((v, ctx) => {
  if (v.origin === "purchase" && !v.orderProof) ctx.addIssue({ code: "custom", path: ["orderProof"], message: "purchase proof required" });
  if (v.origin !== "purchase" && !v.grantProof && !v.orderProof) ctx.addIssue({ code: "custom", path: ["grantProof"], message: "grant proof required" });
});
const SafeCode = z.string().trim().regex(/^[A-Z0-9_:-]{2,80}$/);
const Gcf11Request = z.object({
  operationId: z.literal("BE27C-DCD11"),
  holderPartyId: Id,
  query: z.string().trim().max(180).default(""),
  asOf: IsoDate.nullable(),
  band: z.enum(["owned", "store", "both"]).default("owned"),
  cursor: z.string().trim().max(256).nullable(),
  limit: z.number().int().min(1).max(100).default(50),
}).strict();
const Gcf12Request = z.object({
  operationId: z.literal("BE27C-DCD12"),
  entitlementId: Id,
  artifactVersionId: Id,
  purpose: z.literal("buyer_download"),
  requestedConcurrency: z.number().int().min(1).max(4),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const Gcf13Request = z.object({
  operationId: z.literal("BE27C-DCD13"),
  grantId: Id,
  range: Range,
  observedHash: Hash.nullable(),
  completed: z.boolean(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const EntitlementSuccess = z.object({
  operationId: z.literal("BE27C-DCD10"),
  entitlementId: Id,
  acquisitionEpochId: Id,
  productId: Id,
  holderPartyId: Id,
  state: z.enum(["active", "pending_payment", "commercially_revoked", "suspended", "refunded", "chargeback", "expired"]),
  versionRange: z.string().trim().min(1).max(180),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const LibrarySuccess = z.object({
  operationId: z.literal("BE27C-DCD11"),
  holderPartyId: Id,
  asOf: IsoDate.nullable(),
  rows: z.array(z.object({
    entitlementId: Id,
    productId: Id,
    currentVersionId: Id.nullable(),
    holderPartyId: Id,
    managementState: z.enum(["holder_controlled", "vendor_managed", "support_hold"]),
    downloadAllowed: z.boolean(),
  }).strict()),
  nextCursor: z.string().nullable(),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const TransferGrantSuccess = z.object({
  operationId: z.literal("BE27C-DCD12"),
  grantId: Id,
  entitlementId: Id,
  artifactVersionId: Id,
  packedSize: z.number().int().positive(),
  unpackedSize: z.number().int().positive(),
  masterSha256: Hash,
  expiresAt: IsoDate,
  concurrencyLimit: z.number().int().min(1).max(4),
  state: z.enum(["active", "queued", "expired", "revoked", "completed"]),
  signedUrl: z.string().url().nullable(),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const TransferProgressSuccess = z.object({
  operationId: z.literal("BE27C-DCD13"),
  grantId: Id,
  acceptedRange: Range,
  bytesServed: z.number().int().nonnegative(),
  state: z.enum(["active", "queued", "expired", "revoked", "completed", "unsafe"]),
  completedHash: Hash.nullable(),
  retryAfterSeconds: z.number().int().nonnegative().nullable(),
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

The implementation defines SafeCode before Gcf10Request in the shared schema module; ordering in this listing is explanatory, and the exported schemas are compiled after all primitives. Gcf10 requires exactly one valid proof path for purchase/grant/trial policy, and bundle purchases require allocation evidence from Shard 28. Gcf11 as-of responses always set downloadAllowed false. Gcf12 may return a short-lived signed URL only when BE-00 grants it; a null URL means the client uses the range endpoint. Gcf13 reauthorizes live state before accepting every range.

### Contract Registry

| Operation ID | Request contract | Success contract and invariant | Error contract | Atomic write set |
| --- | --- | --- | --- | --- |
| BE27C-DCD10 | Gcf10Request strict; purchaser/holder, origin, proof, frozen terms/range, allocation evidence | EntitlementSuccess; one epoch append, pending payment grants nothing, owned bundle member mints nothing | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Entitlement/epoch or replay, policy snapshot, audit, outbox, and idempotency receipt |
| BE27C-DCD11 | Gcf11Request strict; holder, query, current/as-of, band, cursor, limit | LibrarySuccess; holder-scoped projection, owned/store separation, as-of download disabled | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Read projection refresh marker, audit/read trace, and idempotency receipt where used |
| BE27C-DCD12 | Gcf12Request strict; entitlement/artifact/purpose/concurrency | TransferGrantSuccess; live checks, size/hash/expiry, artifact binding, no static public URL | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Transfer grant, queue lease, audit, outbox, and idempotency receipt |
| BE27C-DCD13 | Gcf13Request strict; grant/range/hash/completion | TransferProgressSuccess; every range reauthorized; malicious/rights withdrawal can mark unsafe | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Range append, byte progress, completion evidence, audit, outbox, and idempotency receipt |

## Authorization and Ownership

Resource existence is resolved after coarse authentication. A hidden entitlement, holder, artifact, grant, or product returns 404; a visible resource for which the actor lacks holder/provider action authority returns 403. Error details never reveal purchaser identity, licence key, signed URL, source bytes, or another holder's library.

| Operation ID | Allowed roles | Ownership and object scope | 403 versus 404 |
| --- | --- | --- | --- |
| BE27C-DCD10 | Buyer/purchaser party controller; grant worker; Shard 28 payment worker; support dual control | Purchaser proof and holder control are distinct; holder may be person/org; product/version/terms/allocation snapshot must match | Hidden product/proof context returns 404 ENTITLEMENT_CONTEXT_NOT_FOUND; visible product without party/grant authority returns 403 ENTITLEMENT_FORBIDDEN |
| BE27C-DCD11 | Controlled holder; support case-bound | Holder party controls projection; organization grant is explicit; store band is public and separate | Hidden holder returns 404 HOLDER_NOT_FOUND; visible holder without control returns 403 LIBRARY_FORBIDDEN |
| BE27C-DCD12 | Controlled holder; delivery worker | Grant request must match entitlement holder, current artifact/version range, and purpose; vendor cannot download as buyer | Hidden entitlement/artifact returns 404 ENTITLEMENT_NOT_FOUND; visible entitlement without holder grant returns 403 DOWNLOAD_FORBIDDEN |
| BE27C-DCD13 | Controlled holder/session worker; delivery provider callback | Grant and range belong to holder/account and current artifact; each range is reauthorized | Hidden grant returns 404 TRANSFER_NOT_FOUND; visible grant without holder/session grant returns 403 TRANSFER_FORBIDDEN |

Vendors receive aggregate commerce and delivery outcomes through safe reporting and never buyer identity or watermark mapping. The service does not create a new activation identity. Organization holders use canonical controlled-party grants. Support can perform mechanical recovery with an expiring purpose grant but cannot issue entitlement without proof, bypass withdrawal, or expose a key.

## Middleware and Security

### Per-operation middleware registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
| --- | --- | --- | --- |
| BE27C-DCD10 | requestId → CORS → auth → purchaser/holder context → rate limit → idempotency → strict body validation → payment/grant proof → product/terms/allocation lock → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 128 KiB body; purchaser/holder separation; Shard 28 allocation hash; pending payment grants nothing |
| BE27C-DCD11 | requestId → CORS → auth → holder control → rate limit → strict query validation → projection/as-of gate → handler/read audit | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | Query length/limit bounds; as-of download disabled; owned/store bands separate; no buyer identity |
| BE27C-DCD12 | requestId → CORS → auth → holder control → rate limit → idempotency → strict body validation → live entitlement/version/withdrawal gate → grant queue → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 64 KiB body; purpose literal; signed URL short-lived; no static public link or activation |
| BE27C-DCD13 | requestId → CORS → auth/session grant → rate limit → idempotency → strict range validation → live reauthorization → withdrawal/hash gate → handler/outbox | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 32 KiB body; ranges bounded/non-overlapping per request; queue on capacity; malicious withdrawal marks unsafe |

All routes apply CSRF protection where browser credentials are used, origin allowlisting, content-type/body-size limits, safe response headers, request-scoped tracing, and structured redaction. Object bytes are served only through BE-00 purpose-bound grants. No response contains a licence key, source byte, buyer identity map, static public URL, or buyer-identifying watermark.

## Idempotency, Rate Limits, and SLOs

| Operation ID | Idempotency and concurrency | Rate limit | SLO and timeout |
| --- | --- | --- | --- |
| BE27C-DCD10 | Required key/body hash; product-holder lock; unique epoch proof hash; replay exact result | 20 per purchaser per 10 minutes, burst 3 | p95 1.5 s, hard 15 s; payment/allocation inquiry below |
| BE27C-DCD11 | Read cursor and projection version; repeated query returns same projection version; no destructive mutation | 120 per holder per minute, burst 15 | p95 900 ms, hard 10 s |
| BE27C-DCD12 | Required key/body hash; unique active holder/artifact grant policy; account concurrency lease | 30 per holder per minute, burst 5 | p95 1.2 s, hard 15 s; object signer bounded |
| BE27C-DCD13 | Required key/body hash; range hash dedupe; per-grant/account concurrency queue; completion hash once | 600 per holder per minute, burst 40 | p95 500 ms, hard 10 s; queue returns Retry-After |

BE-00 idempotency receipts retain at least 24 hours with request hash, status, response, and expiry. A lost response is recovered by key lookup. A payment timeout never issues an entitlement; a range timeout never extends expiry or bypasses withdrawal. Transfer grant default lifetime is 72 hours unless a locked policy configures a shorter bound.

## Observability

| Operation ID | Metrics and alerts | Structured logs and traces | Audit/outbox evidence |
| --- | --- | --- | --- |
| BE27C-DCD10 | entitlement_issue_total by origin/state; pending_payment_reject_total; epoch_duplicate_total; allocation_conflict_total; latency | requestId, operationId, product/version hash, purchaser/holder hash, origin, proof class, allocation class, result; no identity/amount | digital_entitlement.issued.v1; epoch/audit IDs; proof hashes |
| BE27C-DCD11 | library_query_total by band/as-of; projection_stale_total; holder_forbidden_total; latency | requestId, operationId, holder hash, query hash, band, asOf flag, row count, result | library.read audit; projection version; no buyer identity |
| BE27C-DCD12 | transfer_grant_total by state; withdrawal_denied_total; queue_depth; grant_expiry_total; latency | requestId, operationId, entitlement/artifact hash, requested concurrency, withdrawal class, result; no signed URL | digital_transfer.grant_created.v1; grant/lease audit |
| BE27C-DCD13 | transfer_range_total; bytes_served; hash_mismatch_total; unsafe_kill_total; queue_wait; latency | requestId, operationId, grant hash, range size, completion flag, state, result; no bytes/content | digital_transfer.completed.v1 on completion; range audit; withdrawal evidence |

Trace spans include entitlement.issue, library.project, transfer.grant, transfer.range, and object.sign, preserving failures, payment/allocation conflicts, withdrawal kills, queue saturation, hash mismatch, and retries. Sentry scrubs purchaser/holder identity, keys, signed URLs, object IDs, and content metadata. Alerts fire on entitlement without proof, duplicate epoch, range accepted after malicious withdrawal, static URL generation, or buyer identity in a vendor-facing event.

## Persistence and RLS

All tables use protected schemas with enabled and forced RLS. Direct anon/authenticated table grants are denied. Security-invoker RPCs recheck purchaser/holder control, payment/grant proof, product/version/terms snapshot, Shard 28 allocation evidence, artifact withdrawal, account concurrency, range bounds, and expected versions. Every mutation writes audit and outbox rows in the same transaction. Artifact bytes remain in protected object storage.

### Complete table definitions

| Table / model | Typed fields with SQL types, nullability, constraints and FKs | Query indexes | RLS and grants |
| --- | --- | --- | --- |
| platform_private.digital_entitlements / Entitlement | id uuid PRIMARY KEY; product_id uuid NOT NULL REFERENCES platform_private.digital_products(id); current_product_version_id uuid NOT NULL REFERENCES platform_private.digital_product_versions(id); purchaser_party_id uuid NOT NULL REFERENCES identity.parties(id); holder_party_id uuid NOT NULL REFERENCES identity.parties(id); vendor_party_id uuid NOT NULL REFERENCES identity.parties(id); state text NOT NULL CHECK (state IN ('pending_payment','active','suspended','commercially_revoked','refunded','chargeback','expired')); current_terms_version_id uuid NOT NULL REFERENCES platform_private.digital_licence_terms_versions(id); version_range text NOT NULL CHECK (char_length(version_range) BETWEEN 1 AND 180); management_state text NOT NULL CHECK (management_state IN ('holder_controlled','vendor_managed','support_hold')); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(product_id,holder_party_id) | (holder_party_id,state); (product_id,state); (vendor_party_id,state); (state,updated_at DESC); (current_product_version_id) | Holder reads own projection; vendor receives aggregate safe projection; workers update via RPC; forced RLS; no direct client grant |
| platform_private.digital_acquisition_epochs / AcquisitionEpoch | id uuid PRIMARY KEY; entitlement_id uuid NOT NULL REFERENCES platform_private.digital_entitlements(id); purchaser_party_id uuid NOT NULL REFERENCES identity.parties(id); holder_party_id uuid NOT NULL REFERENCES identity.parties(id); origin text NOT NULL CHECK (origin IN ('purchase','grant','trial')); order_id uuid NULL REFERENCES platform_private.orders(id); order_line_id uuid NULL REFERENCES platform_private.order_lines(id); grant_ref uuid NULL; allocated_consideration_minor bigint NOT NULL CHECK (allocated_consideration_minor >= 0); currency char(3) NULL CHECK (currency ~ '^[A-Z]{3}$'); terms_version_id uuid NOT NULL REFERENCES platform_private.digital_licence_terms_versions(id); version_range text NOT NULL CHECK (char_length(version_range) BETWEEN 1 AND 180); promotion_allocation_id uuid NULL; bundle_member_id uuid NULL; ownership_quote_id uuid NULL; standalone_price_minor bigint NULL CHECK (standalone_price_minor >= 0); standalone_price_version text NULL CHECK (char_length(standalone_price_version) <= 80); allocation_basis_kind text NOT NULL CHECK (allocation_basis_kind IN ('standalone_selling_price','non_bundle','grant')); captured_proof_hash char(64) NOT NULL CHECK (captured_proof_hash ~ '^[a-f0-9]{64}$'); created_at timestamptz NOT NULL; UNIQUE(entitlement_id,captured_proof_hash) | (entitlement_id,created_at DESC); (purchaser_party_id,created_at DESC); (holder_party_id,created_at DESC); (order_line_id); (bundle_member_id); (promotion_allocation_id) | Holder sees safe epoch; Shard 28/payment worker scoped; append-only RPC trigger; forced RLS; no direct client grant |
| platform_private.digital_entitlement_state_history | id uuid PRIMARY KEY; entitlement_id uuid NOT NULL REFERENCES platform_private.digital_entitlements(id); prior_state text NULL CHECK (prior_state IN ('pending_payment','active','suspended','commercially_revoked','refunded','chargeback','expired')); new_state text NOT NULL CHECK (new_state IN ('pending_payment','active','suspended','commercially_revoked','refunded','chargeback','expired')); trigger_code text NOT NULL CHECK (trigger_code ~ '^[A-Z0-9_:-]{2,80}$'); actor_id uuid NULL REFERENCES auth.users(id); policy_version text NOT NULL; version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; UNIQUE(entitlement_id,version) | (entitlement_id,created_at DESC); (new_state,created_at DESC); (trigger_code) | Worker/support append only; holder/vendor safe projection; forced RLS; no direct client grant |
| platform_private.digital_transfer_grants / TransferGrant | id uuid PRIMARY KEY; entitlement_id uuid NOT NULL REFERENCES platform_private.digital_entitlements(id); artifact_version_id uuid NOT NULL REFERENCES platform_private.digital_artifact_versions(id); holder_party_id uuid NOT NULL REFERENCES identity.parties(id); account_id uuid NOT NULL REFERENCES auth.users(id); purpose text NOT NULL CHECK (purpose = 'buyer_download'); packed_size bigint NOT NULL CHECK (packed_size > 0); unpacked_size bigint NOT NULL CHECK (unpacked_size >= packed_size); master_sha256 char(64) NOT NULL CHECK (master_sha256 ~ '^[a-f0-9]{64}$'); expires_at timestamptz NOT NULL; concurrency_limit integer NOT NULL CHECK (concurrency_limit BETWEEN 1 AND 4); state text NOT NULL CHECK (state IN ('active','queued','expired','revoked','completed')); served_bytes bigint NOT NULL DEFAULT 0 CHECK (served_bytes >= 0); completed_hash char(64) NULL CHECK (completed_hash ~ '^[a-f0-9]{64}$'); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(entitlement_id,artifact_version_id,account_id) WHERE state IN ('active','queued') | (holder_party_id,state); (account_id,state); (entitlement_id,created_at DESC); (artifact_version_id,state); (expires_at,state) | Holder/session reads own active grant; worker updates; BE-00 signs bytes; forced RLS; no direct client grant |
| platform_private.digital_transfer_ranges | id uuid PRIMARY KEY; grant_id uuid NOT NULL REFERENCES platform_private.digital_transfer_grants(id); account_id uuid NOT NULL REFERENCES auth.users(id); start_byte bigint NOT NULL CHECK (start_byte >= 0); end_byte_exclusive bigint NOT NULL CHECK (end_byte_exclusive > start_byte); observed_hash char(64) NULL CHECK (observed_hash ~ '^[a-f0-9]{64}$'); completed boolean NOT NULL DEFAULT false; state text NOT NULL CHECK (state IN ('accepted','rejected','unsafe')); created_at timestamptz NOT NULL; UNIQUE(grant_id,account_id,start_byte,end_byte_exclusive) | (grant_id,created_at DESC); (account_id,created_at DESC); (grant_id,completed); (state,created_at DESC) | Holder sees own progress; worker append/update through range RPC; forced RLS; no direct client grant |
| platform_private.digital_library_projections / LibraryProjection | id uuid PRIMARY KEY; holder_party_id uuid NOT NULL REFERENCES identity.parties(id); entitlement_id uuid NOT NULL REFERENCES platform_private.digital_entitlements(id); product_id uuid NOT NULL REFERENCES platform_private.digital_products(id); current_product_version_id uuid NULL REFERENCES platform_private.digital_product_versions(id); vendor_party_id uuid NOT NULL REFERENCES identity.parties(id); management_state text NOT NULL CHECK (management_state IN ('holder_controlled','vendor_managed','support_hold')); as_of timestamptz NOT NULL; band text NOT NULL CHECK (band IN ('owned','store')); row_state text NOT NULL CHECK (row_state IN ('active','tombstoned','retired')); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(holder_party_id,entitlement_id,as_of,band) | (holder_party_id,band,updated_at DESC); (holder_party_id,product_id); (entitlement_id); (vendor_party_id,band) | Holder-only projection; store band public-safe and separate; worker rebuilds; forced RLS; no direct client grant |
| platform_private.digital_entitlement_event_inbox | id uuid PRIMARY KEY; provider_event_id text NOT NULL; event_type text NOT NULL; aggregate_id uuid NOT NULL; payload_hash char(64) NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'); received_at timestamptz NOT NULL; processed_at timestamptz NULL; state text NOT NULL CHECK (state IN ('received','processed','quarantined')); error_code text NULL; UNIQUE(provider_event_id,event_type) | (provider_event_id,event_type) unique; (state,received_at); (aggregate_id,received_at DESC) | Worker/service only; no client grant; forced RLS; raw payload protected |

The entitlement unique product/holder index is reconciled with the one-record-per-product/holder rule; repurchase appends an epoch and reactivates a commercially revoked record only through a state command. The partial unique grant index is a PostgreSQL partial unique index matching the active-state predicate. As-of projections never authorize delivery. Allocation fields are immutable snapshots and are validated against Shard 28 proof; this service never recalculates or re-apportions bundle consideration.

### Permission and RLS matrix

| Principal | Read projection | Write path | Prohibited |
| --- | --- | --- | --- |
| Holder person/org controller | Own entitlement, acquisition epochs, library, grant progress, safe artifact size/hash/expiry | GCF11–GCF13 through holder-scoped RPC | Cannot issue entitlement, alter purchaser/terms/allocation, bypass withdrawal, or view another holder |
| Purchaser/payment worker | Payment proof and bounded epoch projection | GCF10 handoff with signed order/grant proof | Cannot select arbitrary holder, write library, or sign delivery URL |
| Vendor | Aggregate issuance/delivery outcome and own product state | No entitlement or grant table write | Cannot view buyer identity, holder library, keys, grants, or force delivery |
| Shard 28 allocation/revenue worker | Scoped proof/allocation/member snapshot | Signed proof callback and reconciliation | Cannot create arbitrary entitlement or change terms/holder |
| Delivery worker | Entitlement/artifact/withdrawal and account concurrency | Grant/range RPC | Cannot issue entitlement, change product terms, or override holder control |
| Support | Case-bound safe projection and expiring recovery grant | Dual-control exception RPC | Cannot bypass payment/proof/withdrawal or expose key/source |
| Anon/authenticated table role | No direct table access | Public Hono routes only | Direct SQL/object/event grants denied |

## State Machines, Concurrency, and Failure Recovery

### Entitlement and delivery state machines

Entitlement: pending_payment → active → suspended, commercially_revoked, refunded, chargeback, or expired. commercially_revoked → active is allowed only after a valid repurchase/restoration epoch. Trial and free grant use the same record with origin and expiry; no separate trial entitlement. Issuance fact and acquisition epochs never erase.

TransferGrant: requested → active or queued → completed, expired, revoked, or unsafe. Every range checks holder control, entitlement state, version range, artifact state, current withdrawal, grant expiry, and account concurrency. superseded/defective may finish in-flight according to policy; malicious kills it and marks partial unsafe; rights stops onward/archive delivery at smallest valid scope.

LibraryProjection is current or as-of. Current renders holder and management axes and may link to live delivery; as-of reconstructs history and disables download. Owned and store bands remain separate. Re-purchase reactivates the existing commercially revoked record and appends an epoch rather than creating a duplicate entitlement.

### Race and recovery matrix

| Race/failure | Winner and invariant | Recovery |
| --- | --- | --- |
| Payment confirmation versus issuance retry | Product-holder lock and proof hash append one epoch | Replay same key; proof conflict returns 409; pending payment grants nothing |
| Bundle allocation versus issuance | Shard 28 captured member/price/quote evidence must match | Reject stale/mismatched allocation; no re-apportionment |
| Re-purchase versus commercial revocation | Aggregate version serializes lawful later trigger | Append epoch and explicit active transition only after proof |
| Library read versus state change | Projection version and live state determine current result | Return safe age/version; refetch authoritative entitlement |
| Download request versus withdrawal | Current withdrawal check wins for new grant | Return stable reason; no grant |
| Range request versus malicious withdrawal | Malicious kill wins immediately, partial unsafe | Revoke grant, record unsafe progress, notify holder |
| Range request versus superseded/defective withdrawal | Policy may complete existing in-flight range, no new range selection | Reauthorize each range and expose warning/state |
| Concurrent grants versus account limit | Existing active slots win; excess queues | Return queued state and Retry-After; no false denial |
| Completion hash mismatch | Artifact master hash wins; transfer becomes unsafe/failed | Stop delivery, preserve evidence, alert support |
| Vendor exit versus committed order | Shard 28 resolves owned or refunded; no paid-without-access | Entitlement/continuity worker reconciles and preserves artifacts |
| Worker crash after epoch/grant write | Transactional outbox preserves durable state | Lease retry; event ID/aggregate/version dedupe |
| Deadlock/serialization conflict | No partial issue or range | Retry twice at 50/150 ms, then return 409 |

Outbox delivery is at-least-once; consumers refetch canonical state and dedupe event ID plus aggregate/version. Queue leases expire after eight attempts; provider/object signer poison payloads quarantine. A cache never upgrades revoked/expired/unknown authority.

## External Seams

| Seam | Exact request | Exact response | Timeout | Retry/backoff | Circuit behavior |
| --- | --- | --- | --- | --- | --- |
| BE-00 idempotency/audit/outbox | { operationId, idempotencyKey, actorId, aggregateId, requestHash, response } | { receiptId, replay, auditId, outboxIds } | 2,000 ms | No independent retry outside transaction; transaction retry twice at 50/150 ms | Open after 3 failures in 30 s; command fails atomically |
| Shard 28 payment/order proof | { orderId, orderLineId, productId, purchaserPartyId, paymentState, proofHash } | { valid: true/false, paymentState, lineAmountMinor, currency, proofVersion } | 5,000 ms | 3 retries at 250/750/1500 ms for timeout/408/429/5xx; inquiry by proofHash | Open after 5 failures in 120 s; no entitlement on outage |
| Shard 28 bundle allocation | { bundleMemberId, promotionAllocationId, standalonePriceVersion, ownershipQuoteId, capturedMemberShareMinor, currency } | { valid: true/false, allocationVersion, memberShareMinor, basisHash } | 5,000 ms | 3 retries at 250/750/1500 ms for timeout/408/429/5xx; same allocation key | Open after 5 failures in 120 s; issuance remains pending/blocked |
| BE-00 object grant/range signer | { grantId, artifactVersionId, accountId, range, purpose, expirySeconds } | { signedUrl, expiresAt, bytes, sha256, contentType } | 3,000 ms | 2 retries at 200/600 ms on timeout; no retry on authority/hash mismatch | Open after 3 failures in 60 s; range remains queued |
| BE-27b publication/artifact | { productId, productVersionId, termsVersionId, artifactVersionId, version } | { published: true, artifactState, packedSize, unpackedSize, masterSha256 } | 2,000 ms | 2 retries at 50/150 ms on serialization conflict only | Open after 3 failures in 30 s; grant fails closed |
| BE-27e withdrawal/enforcement | { artifactVersionId, entitlementId, requestedAt, currentVersion } | { state: available/superseded/defective/malicious/rights, scope, effectiveAt, reasonCode } | 3,000 ms | 3 retries at 200/600/1200 ms for timeout/408/429/5xx; inquiry by artifact/version | Open after 5 failures in 60 s; delivery remains denied or pending |
| BE-23/24 holder authority | { holderPartyId, accountId, capability, organizationGrantId } | { allowed: true/false, partyType, grantVersion } | 3,000 ms | 2 retries at 200/600 ms on timeout/408/429/5xx; no retry on deny | Open after 5 failures in 60 s; write fails closed |

Provider responses are schema-validated; unknown payment/withdrawal/object state is pending or denied. Correlation IDs are hashed in logs. No seam can issue without proof, override withdrawal, expose a static link, or create activation/title/custody.

## Events and Async Consumers

| Event type | Producer operation | Required envelope and payload | Consumer behavior |
| --- | --- | --- | --- |
| digital_entitlement.issued.v1 | BE27C-DCD10 | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, entitlementId, epochId, productId, purchaserHash, holderHash, origin, termsVersionId, versionRange, allocationHash } | Library projection, Shard 28 revenue/refund, delivery index |
| digital_entitlement.state_changed.v1 | Entitlement/state worker | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, entitlementId, priorState, newState, triggerCode } | Library/enforcement refetch live authorization |
| digital_transfer.grant_created.v1 | BE27C-DCD12 | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, grantId, entitlementId, artifactVersionId, expiry, concurrency } | Delivery audit and support metrics |
| digital_transfer.completed.v1 | BE27C-DCD13 | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, grantId, artifactVersionId, bytes, ranges, hash } | Evidence/support metrics; no source bytes |
| digital_product.version_submitted.v1 | 27b | { eventId, aggregateId, aggregateVersion, productVersionId, submissionId, state } | Publication context |
| digital_product.qa_completed.v1 | 27b | { eventId, aggregateId, aggregateVersion, submissionId, scopes, results } | Artifact eligibility context |
| digital_product.published.v1 | 27b | { eventId, aggregateId, aggregateVersion, productId, productVersionId, termsVersionId, artifactVersionId } | Product/delivery availability |
| digital_product.update_published.v1 | 27d | { eventId, aggregateId, aggregateVersion, productId, priorVersionId, newVersionId } | Optional update offer; old range remains |
| digital_artifact.withdrawn.v1 | 27e | { eventId, aggregateId, aggregateVersion, artifactId, reason, scope, effectiveAt } | Grant/range reauthorization |
| digital_asset.metadata_changed.v1 | 27d | { eventId, aggregateId, aggregateVersion, assetId, priorVersion, newVersion } | Library/search refresh |
| digital_vendor.retired.v1 | 27e | { eventId, aggregateId, aggregateVersion, vendorId, continuityState, effectiveAt } | Continuity/library |
| digital_enforcement.requested.v1 | 27e | { eventId, aggregateId, aggregateVersion, caseId, targetHash, reasonClass } | Entitlement state/transfer enforcement |

Outbox rows include event ID, aggregate ID/version, request ID, payload hash, and redacted payload. Consumers acknowledge only after durable processing. Events never contain buyer identity maps, licence keys, signed URLs, source bytes, or watermark mappings.

## Error Matrix

| Operation ID | Condition | HTTP | Error code | Retry/client action |
| --- | --- | --- | --- | --- |
| BE27C-DCD10 | Hidden product/order/grant context | 404 | ENTITLEMENT_CONTEXT_NOT_FOUND | Do not reveal |
| BE27C-DCD10 | Payment pending or proof invalid | 409 | ENTITLEMENT_PROOF_PENDING | Await confirmed payment/grant; no access |
| BE27C-DCD10 | Bundle allocation/member share/version mismatch | 409 | BUNDLE_ALLOCATION_CONFLICT | Reconcile with Shard 28; do not recompute |
| BE27C-DCD10 | Existing owned bundle member | 409 | ENTITLEMENT_ALREADY_OWNED | Use existing entitlement; no new mint |
| BE27C-DCD11 | Hidden holder | 404 | HOLDER_NOT_FOUND | Do not reveal |
| BE27C-DCD11 | Visible holder without control | 403 | LIBRARY_FORBIDDEN | Use controlled person/org |
| BE27C-DCD11 | Invalid cursor/as-of query | 422 | LIBRARY_QUERY_INVALID | Correct query; as-of remains non-downloadable |
| BE27C-DCD12 | Hidden entitlement/artifact | 404 | ENTITLEMENT_NOT_FOUND | Do not reveal |
| BE27C-DCD12 | Entitlement revoked/expired/withdrawn | 409 | DELIVERY_NOT_AUTHORIZED | Show lawful reason; no grant |
| BE27C-DCD12 | Artifact version outside range | 409 | VERSION_RANGE_CONFLICT | Select entitled version |
| BE27C-DCD12 | Capacity unavailable | 202 | TRANSFER_QUEUED | Honor Retry-After; keep grant bounded |
| BE27C-DCD13 | Hidden grant | 404 | TRANSFER_NOT_FOUND | Do not reveal |
| BE27C-DCD13 | Grant expired/revoked or current withdrawal | 409 | TRANSFER_NOT_AUTHORIZED | Refresh grant if lawful; malicious state stays unsafe |
| BE27C-DCD13 | Range invalid/overlap/hash mismatch | 422 or 409 | TRANSFER_RANGE_INVALID or TRANSFER_HASH_MISMATCH | Retry valid range or stop unsafe transfer |
| All | Body/query/schema/unknown key/unsafe text | 400 or 422 | VALIDATION_FAILED | Correct field paths; do not retry unchanged |
| All | Rate limit exceeded | 429 | RATE_LIMITED | Honor Retry-After and same idempotency key |
| All | Payment/object/audit circuit open | 503 | DEPENDENCY_UNAVAILABLE | Retry same key with backoff; fail closed |

Every response uses ErrorResponse with BE-00 ApiError { code, message, requestId, details }. Error details contain stable codes/paths only and never purchaser/holder identity, keys, signed URLs, or source bytes.

## Testing Strategy

### Contract and route tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27C-CON-001 | BE27C-DCD10 | Strict issuance enforces purchaser/holder, origin/proof, terms/range, payment state, Shard 28 allocation, one epoch, and no pending grant |
| BE27C-CON-002 | BE27C-DCD11 | Strict holder/as-of/band/cursor query and safe library projection enforce owned/store separation and no as-of download |
| BE27C-CON-003 | BE27C-DCD12 | Strict download request returns artifact-bound size/unpacked/hash/expiry/concurrency and no static URL |
| BE27C-CON-004 | BE27C-DCD13 | Strict range/hash/completion request reauthorizes and returns queue/unsafe/completed state |
| BE27C-ROUTE-001 | BE27C-DCD10 through BE27C-DCD13 | Method/path/operation registry is authoritative; aliases cannot bypass live authorization |

### Authorization and privacy tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27C-AUTH-001 | BE27C-DCD10 through BE27C-DCD13 | Hidden resource returns 404; visible resource without role/grant returns 403; details conceal context |
| BE27C-AUTH-002 | BE27C-DCD10 | Purchaser/holder separation and person/org control are enforced; vendor cannot see buyer identity |
| BE27C-AUTH-003 | BE27C-DCD11 | Holder projection is scoped; owned/store bands do not blend; as-of disables delivery |
| BE27C-AUTH-004 | BE27C-DCD12, BE27C-DCD13 | Every grant/range checks live entitlement, holder, version, withdrawal, purpose, account, and concurrency |
| BE27C-AUTH-005 | All | CORS policy digital-api, CSRF, redaction, purpose-bound objects, no static URL/key/watermark mapping are enforced |

### Persistence, idempotency, and concurrency tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27C-DB-001 | All | Forced RLS denies direct access; RPC checks party, proof, state, version, FKs, and append-only epochs |
| BE27C-DB-002 | BE27C-DCD10 | Product-holder lock, epoch/proof uniqueness, repurchase/reactivation, pending payment, and bundle allocation validation hold |
| BE27C-DB-003 | BE27C-DCD11 | Projection version, holder scope, as-of read, and row/history retention hold |
| BE27C-DB-004 | BE27C-DCD12, BE27C-DCD13 | Grant/artifact binding, range uniqueness, queue lease, withdrawal kill, and hash completion hold |
| BE27C-DB-005 | All assigned operations | Every field lists SQL type, nullability, constraints/FKs, indexes, forced RLS, and grants and migration tests cover them |

### Domain, seam, event, and recovery tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27C-DOM-001 | BE27C-DCD10 | Entitlement primary fact, frozen terms/range, purchaser/holder, epoch allocation, and no per-file purchase are enforced |
| BE27C-DOM-002 | BE27C-DCD12, BE27C-DCD13 | Live delivery authorization, 72h/default bound, range reauthorization, queue, hash, and withdrawal matrix are enforced |
| BE27C-DOM-003 | BE27C-DCD10 through BE27C-DCD13 | Keys/seats/grants remain authorization artifacts; no activation server, buyer watermark, static URL, or rights adjudication |
| BE27C-SEAM-001 | All | BE-00, Shard 28 payment/allocation, BE-27b artifact, BE-27e withdrawal, identity, and object timeout/retry/circuit behavior is exact |
| BE27C-EVT-001 | All | Exact event types, redaction, outbox atomicity, aggregate/version dedupe, and consumer refetch are verified |
| BE27C-REC-001 | All | Lost responses, payment/allocation mismatch, withdrawal race, queue saturation, hash mismatch, vendor exit, deadlock, and poison payloads recover as specified |

## Deepening Passes

| Pass | Question | Resolution |
| --- | --- | --- |
| D1 interaction | Does every assigned IA interaction have one stable route? | Yes: 27.10–27.13 map one-to-one to BE27C-DCD10–DCD13 |
| D2 issuance | Can pending payment, duplicate bundle member, or missing allocation mint access? | No: proof and product-holder locks are required; Shard 28 evidence is validated; owned member mints nothing |
| D3 identity | Can purchaser and holder collapse or expose buyer identity? | No: separate immutable fields and holder-scoped projection |
| D4 terms | Can a key, seat, or transfer grant replace entitlement or alter frozen terms? | No: those are bounded authorizations derived from primary entitlement |
| D5 library | Can as-of/store results grant delivery or blend with owned results? | No: as-of downloadAllowed false and bands are separate |
| D6 delivery | Can static link, stale cache, or one initial check bypass current authority? | No: purpose-bound grant and every-range live reauthorization |
| D7 withdrawal | Are superseded/defective/malicious/rights effects distinct? | Yes: exact matrix preserves in-flight and kills/limits at scoped withdrawal |
| D8 authorization | Are role ownership and 403 versus 404 explicit? | Yes: every operation has scoped role and concealment row |
| D9 persistence | Are fields implementable and protected? | Yes: typed/nullability/constraints/FKs/indexes/RLS/grants are listed |
| D10 resilience | Are payment, allocation, object, queue, and event races deterministic? | Yes: exact seams, retries, locks, leases, dedupe, and recovery are specified |

## Ambiguity Gate

PASS. Evidence: 27.10–27.13 each map to one authoritative operation and route; Entitlement, AcquisitionEpoch, TransferGrant, and LibraryProjection are owned while DigitalProduct, ProductVersion, CompatibilityMatrix, DependencyEdge, VendorSubmission, QaCheck, ReviewDecision, LicenceTermsVersion, SeatAuthorization, ArtifactVersion, DigitalAsset, and VendorContinuityManifest are consumed without route duplication; exact strict Zod 4 contracts and global ApiError { code, message, requestId, details } are present; every operation has role ownership, 403-vs-404, CORS policy digital-api, idempotency, rate limit, observability, typed persistence/RLS/grants, error rows, and keyed tests; purchaser/holder separation, payment/allocation proof, epoch immutability, holder library bands, as-of non-download, 72-hour bounded grant, range reauthorization, withdrawal matrix, no activation/static URL/watermark, exact seams, event privacy, and recovery are resolved. Neighboring interactions 27.01–27.09 and 27.14–27.24 are referenced through explicit BE-27a/b/d/e and Shard 28 handoffs. No unresolved source conflict remains.

## Open Questions

None.

## Dependency References

- BE-00 platform contracts in 00-infrastructure.md: strict Zod 4, ApiError { code, message, requestId, details }, auth, CORS, idempotency, rate classes, audit/outbox, object grants, and forced RLS.
- BE-23/24 identity and collections: canonical person/org holder control, organization grants, provenance, and custody boundaries.
- BE-25b listing/disclosure lifecycle: immutable marketplace context used by product/order proof.
- BE-27a digital product catalog/compatibility: DigitalProduct, ProductVersion, CompatibilityMatrix, and DependencyEdge.
- BE-27b submission/QA/publication: VendorSubmission, QaCheck, ReviewDecision, LicenceTermsVersion, ArtifactVersion, and VendorContinuityManifest.
- BE-27d updates/assets/trials: update versions, release channels, DigitalAsset, auditions, buyer organization, and trial origin.
- BE-27e enforcement/retirement/portability: withdrawal, enforcement, retirement, continuity, and portability state.
- Shard 28 commerce/refund/revenue: payment/order proof, bundle member allocation, standalone price basis, ownership quote, refund and revenue consumers; this companion validates evidence and preserves it.

## Changelog

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-08-29 | Initial production-grade BE companion for interactions 27.10–27.13; entitlement/epoch issuance, holder library, live resumable delivery, withdrawal handling, bundle allocation validation, strict contracts, security, persistence/RLS, eventing, resilience, and ambiguity evidence added |
