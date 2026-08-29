# BE-27a — Digital Product Catalog and Compatibility

## Classification

This companion is the backend contract for the digital catalog foundation in IA shard 27. It classifies 27.01–27.04 as authenticated catalog commands: create a typed product draft, append versioned compatibility facts, append dependency edges, and produce an advisory self-declared rig check. It owns DigitalProduct, ProductVersion, CompatibilityMatrix, DependencyEdge, and the rig-check projection used before purchase. It does not accept an artifact submission, run QA, publish a product, issue an entitlement, authorize a download, adjudicate rights, or enable executable plugins.

| Boundary | Included | Excluded and handoff |
| --- | --- | --- |
| Interaction ownership | 27.01 Create product draft; 27.02 Declare compatibility; 27.03 Declare dependencies; 27.04 Check self-declared rig | Submission/QA/publication 27b; entitlement/library/delivery 27c; updates/assets/trials 27d; enforcement/retirement/portability 27e |
| Catalog authority | Immutable product type, schema revision, product/version identity, compatibility combinations, dependency graph, and advisory rig verdict | Vendor artifact, QA verdict, terms approval, payout gate, listing activation, and content rights |
| Compatibility authority | Per-product-version axis combination with supported, known-issue, unsupported, or untested level; dependency verdict remains separate | Machine authorization, activation, seat allocation, purchase eligibility, and executable admission |
| Security boundary | Vendor party authority, buyer-controlled rig selection, organization grants, exact 403 versus 404, and redacted projections | No legal identity leak, private artifact bytes, buyer identity to vendors, payment instrument, or direct table grant |

The implementation target is TypeScript on Hono/Cloudflare Workers with Supabase PostgreSQL, strict Zod 4 contracts, transactional audit/outbox, forced RLS, structured logs, and Sentry-compatible telemetry. Product type is immutable after first publish; drafts may be corrected before binding by appending a revision. Self-declared rig checks are advisory and cannot create a compatibility badge or machine authorization.

## Referenced Material Inventory

| Source | Location | Material used | Traceability |
| --- | --- | --- | --- |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 24–40 | Product type, creator-content launch, vendor identity, compatibility, entitlement, delivery, and executable launch decisions | Classification and boundary rules below preserve these locks |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 77–89 | Interaction definitions 27.01–27.09 and their preconditions/outcomes | Assigned interaction map covers 27.01–27.04; later interactions are explicit handoffs |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 108–120 | SaveDigitalProductDraft and adjacent submission/publish command contracts | Draft schema and route reconciliation preserve command ownership |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 130–146 | Canonical Data Models DigitalProduct, ProductVersion, CompatibilityMatrix, DependencyEdge, and all downstream models | Model inventory and persistence mapping distinguish owned versus consumed models |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 208–225 | Exact Event Schemas and privacy rule | Event inventory uses every literal type and does not add an unapproved public event |
| IA shard | .memory/wiki/specs/ia/27-digital-catalog-delivery.md lines 148–167 | Typed field/cardinality registry and model constraints | Persistence rows use explicit SQL types, nullability, constraints, FKs, indexes, RLS, and grants |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 14–20 | Submission algorithm, type schema, artifact binding, review, and publish handoff | Catalog stops before submission and leaves immutable version authority to 27b |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 41–43 | Terms composition: intersect permissions/bounds, union obligations, unknown is prohibitive | Draft and compatibility contracts retain policy/schema revisions without claiming rights |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 118–122 | Executable launch, rig advisory, machine authorization, activation, and future grace locks | Self-declared rig is explicitly non-authoritative |
| IA deep dive | .memory/wiki/specs/ia/deep-dives/27-digital-catalog-delivery.md lines 105–110 | Version races and immutable correction behavior | Concurrency and recovery matrix makes append/version rules executable |
| BE platform | .memory/wiki/specs/be/00-infrastructure.md lines 112–153 | Global strict Zod 4 conventions and ApiError { code, message, requestId, details } | Every request, success, and error contract cites the global envelope |
| BE platform | .memory/wiki/specs/be/00-infrastructure.md lines 208–308 | Auth, CORS, rate, idempotency, audit/outbox, RLS, grants, and provider callback controls | Middleware, persistence, and observability matrices inherit these contracts |
| BE identity | .memory/wiki/specs/be/23-gear-provenance.md and .memory/wiki/specs/be/24-gear-collections.md | Person/org acting-party authority and organization control | Vendor identity is a role over canonical parties, not a new persona |
| BE marketplace | .memory/wiki/specs/be/25b-gear-listing-disclosure-lifecycle.md | Listing/version handoff and immutable disclosure boundary | Product catalog does not activate a marketplace listing |
| BE adjacent | .memory/wiki/specs/be/27b-digital-submission-qa-publication.md, 27c-digital-entitlements-library-delivery.md, 27d-digital-updates-assets-trials.md, 27e-digital-enforcement-retirement-portability.md | Downstream catalog consumers and no-route-duplication boundaries | Dependency references identify producer/consumer direction |

## IA Source Map

### Assigned interactions

| IA interaction | IA intent and invariant | Backend operation | Authority |
| --- | --- | --- | --- |
| 27.01 | Create product draft | BE27A-DCD01 | Acting vendor party selects immutable product type and current schema; draft key is idempotent |
| 27.02 | Declare compatibility | BE27A-DCD02 | A product version appends one fact per axis combination; unknown is not supported |
| 27.03 | Declare dependencies | BE27A-DCD03 | Versioned dependency edges distinguish required/optional and satisfied/unsatisfied/unknown |
| 27.04 | Check self-declared rig | BE27A-DCD04 | Buyer-selected rig returns separate advisory compatibility and dependency verdicts; no authorization |

### Canonical Data Models

| IA model name | Role in this companion | Durable authority or reference |
| --- | --- | --- |
| DigitalProduct | Owned typed catalog aggregate, vendor role, schema, and lifecycle | platform_private.digital_products |
| ProductVersion | Owned immutable product revision used by all downstream snapshots | platform_private.digital_product_versions |
| CompatibilityMatrix | Owned per-version axis-combination support facts | platform_private.compatibility_matrices |
| DependencyEdge | Owned per-version dependency/edition/constraint facts | platform_private.dependency_edges |
| VendorSubmission | Consumed by 27b after artifact submission | BE-27b |
| QaCheck | Consumed by 27b publication gate | BE-27b |
| ReviewDecision | Consumed by 27b high-risk review | BE-27b |
| LicenceTermsVersion | Consumed from 27b structured terms | BE-27b |
| Entitlement | Consumed from 27c for holder/library/download decisions | BE-27c |
| AcquisitionEpoch | Consumed from 27c for purchase history | BE-27c |
| SeatAuthorization | Future-gated downstream model; never created by rig check | BE-27c/27d |
| ArtifactVersion | Consumed from 27b/27d for delivery and release | BE-27b/27d |
| TransferGrant | Consumed from 27c for download transfer | BE-27c |
| LibraryProjection | Consumed from 27c for owned result context | BE-27c |
| DigitalAsset | Consumed from 27d for asset search/audition | BE-27d |
| VendorContinuityManifest | Consumed from 27b/27e for publish/retirement continuity | BE-27b/27e |

The self-declared RigCheck is an operational projection keyed to a buyer-controlled rig profile and a product version. It does not replace CompatibilityMatrix, DependencyEdge, SeatAuthorization, or any future machine authorization model.

### Event Schemas

| Exact Event Schemas type | Produced/consumed | Payload authority and privacy rule |
| --- | --- | --- |
| digital_product.version_submitted.v1 | Consumed from 27b | Submission/version and artifact IDs only; catalog invalidates stale draft projections |
| digital_product.qa_completed.v1 | Consumed from 27b | QA scopes/results and blocker counts; never interpreted as rights or safety |
| digital_product.published.v1 | Consumed from 27b | Immutable product/version/terms/artifact snapshot; catalog remains historical |
| digital_entitlement.issued.v1 | Consumed from 27c | Entitlement/epoch/version facts; no buyer identity map |
| digital_entitlement.state_changed.v1 | Consumed from 27c/27e | Entitlement state/version; no compatibility mutation |
| digital_transfer.grant_created.v1 | Consumed from 27c | Artifact-bound grant/expiry/concurrency only |
| digital_transfer.completed.v1 | Consumed from 27c | Range/hash completion facts only |
| digital_product.update_published.v1 | Consumed from 27d | Prior/new product version and compatibility changes |
| digital_artifact.withdrawn.v1 | Consumed from 27e | Scoped withdrawal; matrix remains historical and no new support claim is inferred |
| digital_asset.metadata_changed.v1 | Consumed from 27d | Asset metadata/version/confidence; no product type mutation |
| digital_vendor.retired.v1 | Consumed from 27e | Continuity state/effective version; draft authority remains immutable |
| digital_enforcement.requested.v1 | Consumed from 27e | Enforcement request/case version; no automatic compatibility or rights verdict |

Draft, compatibility, dependency, and rig-check mutations write BE-00 audit records and projection invalidation work. They do not invent a public event type absent from the IA Event Schemas registry.

## Endpoint Reconciliation

BE-00 owns authentication/session, global errors, idempotency receipts, audit/outbox, object evidence, CORS, and configuration access. BE-23/24 own canonical acting-party, organization, provenance, and custody facts. BE-25b owns marketplace listing/disclosure versions. BE-27b owns submissions, QA, review, structured terms, and publication. BE-27c owns entitlement, library, transfer grants, and delivery authorization. BE-27d owns updates, release channels, digital assets, auditions, tags, and trials. BE-27e owns enforcement, withdrawal, retirement, and account portability. The four routes below are the only public routes for 27.01–27.04. None submits bytes, claims rights, publishes, authorizes download, activates software, or creates an entitlement.

The product type is immutable after first publish. A draft may be corrected by a new revision before binding; a published ProductVersion is never edited in place. Compatibility and dependency facts are append-only and versioned. Rig checks may report unknown coverage and must expose advisory status without a badge that implies enforcement.

## API Endpoints

### Umbrella Feature Trace

The IA Shard 27 feature bullets are represented across 27a–27e: 14.01 Digital Product Catalog & Compatibility; 14.02 Licensing, Activation & Entitlement; 14.03 Delivery, Versioning & Library; 14.04 Sound Content Catalogs (Samples, Presets, Templates); 14.08 Vendor Portal, Build Submission & QA.

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Command | Success |
| --- | --- | --- | --- | --- | --- |
| BE27A-DCD01 | POST | /api/v1/digital/products/drafts | 27.01 | SaveDigitalProductDraft | 201 DigitalProductDraftSuccess |
| BE27A-DCD02 | POST | /api/v1/digital/products/{productId}/compatibility | 27.02 | DeclareCompatibility | 201 CompatibilitySuccess |
| BE27A-DCD03 | POST | /api/v1/digital/products/{productId}/dependencies | 27.03 | DeclareDependencies | 201 DependencySuccess |
| BE27A-DCD04 | POST | /api/v1/digital/rig-checks | 27.04 | CheckSelfDeclaredRig | 200 RigCheckSuccess |

### Request/response contracts (Zod 4)

All schemas are strict Zod 4. Unknown keys, unsafe text, malformed UUID/date/version, unsupported product type, unbounded axis values, duplicate edges, and missing idempotency keys fail before mutation. UUIDs are canonical lowercase strings; dates are RFC 3339 UTC strings. Every failure serializes the BE-00 global envelope ApiError { code, message, requestId, details } through ErrorResponse.

~~~ts
const Id = z.string().uuid();
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const IsoDate = z.string().datetime({ offset: true });
const SafeCode = z.string().trim().regex(/^[A-Z0-9_:-]{2,80}$/);
const ProductType = z.enum(["plugin", "sample_pack", "preset_pack", "template", "beat"]);
const Axis = z.object({
  os: z.enum(["macos", "windows", "linux", "ios", "android", "web"]),
  architecture: z.enum(["x64", "arm64", "universal", "any"]),
  format: z.enum(["audio", "midi", "preset", "project", "vst2", "vst3", "au", "aax", "standalone"]),
  host: SafeCode.nullable(),
  daw: SafeCode.nullable(),
}).strict();
const Gcf01Request = z.object({
  operationId: z.literal("BE27A-DCD01"),
  vendorPartyId: Id,
  draftKey: z.string().trim().min(16).max(128),
  type: ProductType,
  schemaVersion: SafeCode,
  title: z.string().trim().min(1).max(180),
  summary: z.string().trim().min(1).max(2000),
  continuityRequired: z.boolean(),
}).strict();
const Gcf02Request = z.object({
  operationId: z.literal("BE27A-DCD02"),
  productId: Id,
  productVersionId: Id,
  axis: Axis,
  supportLevel: z.enum(["supported", "known_issue", "unsupported", "untested"]),
  caveat: z.string().trim().max(2000).nullable(),
  source: z.enum(["vendor", "observed", "curated_host", "imported"]),
  expectedVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const Gcf03Request = z.object({
  operationId: z.literal("BE27A-DCD03"),
  productId: Id,
  productVersionId: Id,
  dependencyCode: SafeCode,
  edition: SafeCode.nullable(),
  versionConstraint: z.string().trim().min(1).max(180),
  required: z.boolean(),
  source: z.enum(["vendor", "schema", "observed"]),
  expectedVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const Gcf04Request = z.object({
  operationId: z.literal("BE27A-DCD04"),
  rigId: Id,
  productVersionId: Id,
  selectedAxis: Axis,
  installedDependencyCodes: z.array(SafeCode).max(100),
  expectedProductVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
const DigitalProductDraftSuccess = z.object({
  operationId: z.literal("BE27A-DCD01"),
  productId: Id,
  productVersionId: Id,
  type: ProductType,
  schemaVersion: SafeCode,
  state: z.enum(["draft", "schema_blocked", "ready_for_submission"]),
  vendorPartyId: Id,
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const CompatibilitySuccess = z.object({
  operationId: z.literal("BE27A-DCD02"),
  compatibilityId: Id,
  productVersionId: Id,
  supportLevel: z.enum(["supported", "known_issue", "unsupported", "untested"]),
  verdict: z.enum(["advisory", "excluded"]),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const DependencySuccess = z.object({
  operationId: z.literal("BE27A-DCD03"),
  dependencyEdgeId: Id,
  productVersionId: Id,
  required: z.boolean(),
  evaluation: z.enum(["unknown", "unsatisfied", "satisfied"]),
  version: z.number().int().positive(),
  requestId: Id,
}).strict();
const RigCheckSuccess = z.object({
  operationId: z.literal("BE27A-DCD04"),
  rigCheckId: Id,
  productVersionId: Id,
  compatibilityVerdict: z.enum(["supported", "known_issue", "unsupported", "unknown"]),
  dependencyVerdict: z.enum(["satisfied", "unsatisfied", "unknown"]),
  advisoryOnly: z.literal(true),
  machineAuthorization: z.literal(false),
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

Gcf01 draftKey is scoped to the authenticated vendor party and returns the original result on replay. Gcf02/Gcf03 use expected product-version revisions and append facts rather than mutate a previous row. Gcf04 evaluates only the submitted rig and current product version; a supported advisory result never authorizes a machine, seat, activation, or purchase.

### Contract Registry

| Operation ID | Request contract | Success contract and invariant | Error contract | Atomic write set |
| --- | --- | --- | --- | --- |
| BE27A-DCD01 | Gcf01Request strict; vendor party, immutable type, schema, title, summary, continuity flag, draft key | DigitalProductDraftSuccess; product type cannot change after publish | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Product, initial ProductVersion, vendor-role snapshot, audit, and idempotency receipt |
| BE27A-DCD02 | Gcf02Request strict; one axis combination, support level, source, and expected version | CompatibilitySuccess; support is advisory and unknown remains distinct | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Compatibility row, version bump, audit, and idempotency receipt |
| BE27A-DCD03 | Gcf03Request strict; dependency/edition/constraint and required flag | DependencySuccess; required/optional and evaluation are separate facts | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Dependency edge, version bump, audit, and idempotency receipt |
| BE27A-DCD04 | Gcf04Request strict; buyer rig, version, axis, installed dependency codes | RigCheckSuccess; advisoryOnly=true and machineAuthorization=false are invariant | All failures use ApiError { code, message, requestId, details } via ErrorResponse | Rig check projection, evidence of input version, audit, and idempotency receipt |

## Authorization and Ownership

Resource existence is resolved after coarse authentication. A hidden product, version, rig, or dependency context returns 404; a visible object for which the actor lacks the action grant returns 403. Error details never disclose vendor legal identity, private product text, or another party's rig.

| Operation ID | Allowed roles | Ownership and object scope | 403 versus 404 |
| --- | --- | --- | --- |
| BE27A-DCD01 | Vendor person/org acting-party controller; support case-bound | Vendor party must control the draft and be permitted for the selected type/schema; organization grant is explicit | Invalid/hidden vendor context returns 404 VENDOR_CONTEXT_NOT_FOUND; visible vendor without draft grant returns 403 PRODUCT_DRAFT_FORBIDDEN |
| BE27A-DCD02 | Vendor party controller; authorized catalog editor; support case-bound | Product/version must belong to vendor and remain draft/editable; compatibility row is version-scoped | Hidden product/version returns 404 PRODUCT_NOT_FOUND; visible version without edit grant returns 403 COMPATIBILITY_FORBIDDEN |
| BE27A-DCD03 | Vendor party controller; authorized catalog editor; support case-bound | Dependency edge belongs to one product version and may reference external/marketplace dependency code only | Hidden product/version returns 404 PRODUCT_NOT_FOUND; visible version without edit grant returns 403 DEPENDENCY_FORBIDDEN |
| BE27A-DCD04 | Authenticated buyer/buying-party controller; support case-bound | Rig belongs to requesting account/controlled organization; product version is publicly visible or owned by a permitted context | Hidden version returns 404 PRODUCT_VERSION_NOT_FOUND; visible version with no rig grant returns 403 RIG_CHECK_FORBIDDEN |

Vendor is an acting person/org role over canonical identity, not a new enterprise persona. A vendor cannot inspect buyer identity through a rig check. Support can recover a mechanical draft with a purpose-bound grant but cannot change type, publish, grant activation, or override unknown into supported.

## Middleware and Security

### Per-operation middleware registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
| --- | --- | --- | --- |
| BE27A-DCD01 | requestId → CORS → auth → vendor-party context → rate limit → idempotency → strict body validation → type/schema gate → handler/audit | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 128 KiB body; safe text; vendor role and immutable type; no external purchase link or artifact bytes |
| BE27A-DCD02 | requestId → CORS → auth → vendor-party context → rate limit → idempotency → strict body validation → version lock → axis policy → handler/audit | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 64 KiB body; axis allowlist; append-only correction; unknown is not supported |
| BE27A-DCD03 | requestId → CORS → auth → vendor-party context → rate limit → idempotency → strict body validation → dependency graph lock → handler/audit | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 64 KiB body; code/constraint bounds; duplicate-edge protection; unknown satisfaction is never assumed |
| BE27A-DCD04 | requestId → CORS → auth → rig-party context → rate limit → idempotency → strict body validation → product-version read gate → advisory evaluator → handler/audit | CORS policy digital-api; explicit web/PWA allowlist; no wildcard credentials; Vary: Origin | 64 KiB body; rig ownership; no machine fingerprint authorization; no compatibility badge field |

All routes apply CSRF protection for browser credentials, content-type/body-size limits, origin allowlisting, safe response headers, request-scoped tracing, and structured redaction. Draft and compatibility text is escaped on output. No route returns legal identity, private vendor evidence, buyer identity, or object bytes.

## Idempotency, Rate Limits, and SLOs

| Operation ID | Idempotency and concurrency | Rate limit | SLO and timeout |
| --- | --- | --- | --- |
| BE27A-DCD01 | Required draftKey/body hash; one active draft revision per vendor key; vendor aggregate lock | 20 per vendor per 10 minutes, burst 3 | p95 1.2 s, hard 15 s |
| BE27A-DCD02 | Required key/body hash; unique product-version-axis combination; optimistic expected version; same key replays | 120 per vendor per minute, burst 10 | p95 900 ms, hard 15 s; lock retry twice at 50/150 ms |
| BE27A-DCD03 | Required key/body hash; unique product-version-dependency-edition; graph lock and expected version | 120 per vendor per minute, burst 10 | p95 900 ms, hard 15 s; lock retry twice at 50/150 ms |
| BE27A-DCD04 | Required key/body hash; rig/product-version/input hash replay; no mutation to catalog authority | 60 per buyer per minute, burst 8 | p95 900 ms, hard 15 s; evaluator is bounded |

BE-00 idempotency receipts retain at least 24 hours with request hash, status, response, and expiry. A lost response is recovered by key lookup. Draft and catalog writes retry only bounded serialization/deadlock conflicts. A retry never changes a published type or converts an advisory rig verdict into authorization.

## Observability

| Operation ID | Metrics and alerts | Structured logs and traces | Audit/outbox evidence |
| --- | --- | --- | --- |
| BE27A-DCD01 | product_draft_created_total by type; schema_reject_total; vendor_grant_denied_total; latency | requestId, operationId, vendor hash, type, schema version, state, result; no title/summary | product.draft.created; audit product/version revision; no public event invented |
| BE27A-DCD02 | compatibility_fact_total by level/source; unknown_axis_total; version_conflict_total; latency | requestId, operationId, product/version hash, axis hash, level, source, result | compatibility.fact.appended; version/audit IDs |
| BE27A-DCD03 | dependency_edge_total by required/evaluation; cycle_reject_total; duplicate_edge_total | requestId, operationId, product/version hash, dependency code hash, required, evaluation, result | dependency.edge.appended; version/audit IDs |
| BE27A-DCD04 | rig_check_total by verdict; unknown_coverage_total; advisory_only_violation_total; latency | requestId, operationId, rig hash, product version hash, verdicts, result; no machine fingerprint | rig.check.completed; input/version audit; no authorization event |

Trace spans include catalog.draft, compatibility.append, dependency.evaluate, and rig.advisory. Sentry events scrub vendor titles, buyer rig details, fingerprints, legal identity, and private source text. Alerts fire on type mutation attempts, any advisoryOnly false response, unauthorized version write, or repeated unknown-to-supported coercion.

## Persistence and RLS

All tables use protected schemas with enabled and forced RLS. Direct anon/authenticated table grants are denied. Security-invoker RPCs recheck acting-party control, organization grant, product/version state, expected revision, axis uniqueness, dependency graph scope, and rig ownership. Every mutation writes audit rows in the same transaction. Product text and rig details are projected by purpose; no artifact bytes live here.

### Complete table definitions

| Table / model | Typed fields with SQL types, nullability, constraints and FKs | Query indexes | RLS and grants |
| --- | --- | --- | --- |
| platform_private.digital_products / DigitalProduct | id uuid PRIMARY KEY; vendor_party_id uuid NOT NULL REFERENCES identity.parties(id); type text NOT NULL CHECK (type IN ('plugin','sample_pack','preset_pack','template','beat')); state text NOT NULL CHECK (state IN ('draft','schema_blocked','ready_for_submission','published','retired')); schema_version text NOT NULL CHECK (char_length(schema_version) BETWEEN 1 AND 80); continuity_required boolean NOT NULL; current_version bigint NOT NULL CHECK (current_version > 0); created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; published_at timestamptz NULL; UNIQUE(vendor_party_id,id) | (vendor_party_id,state); (type,state); (updated_at DESC); (schema_version) | Vendor party reads/writes own draft through RPC; public reads published projection; forced RLS; no direct client grant |
| platform_private.digital_product_versions / ProductVersion | id uuid PRIMARY KEY; product_id uuid NOT NULL REFERENCES platform_private.digital_products(id); vendor_party_id uuid NOT NULL REFERENCES identity.parties(id); version bigint NOT NULL CHECK (version > 0); title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180); summary text NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 2000); schema_version text NOT NULL CHECK (char_length(schema_version) BETWEEN 1 AND 80); state text NOT NULL CHECK (state IN ('draft','schema_blocked','ready_for_submission','submitted','published','superseded')); immutable_after_publish boolean NOT NULL DEFAULT false; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; UNIQUE(product_id,version) | (product_id,version DESC); (vendor_party_id,state); (state,updated_at DESC); (title) | Vendor edits own unbound version; public sees safe published fields; 27b receives scoped handoff; forced RLS; no direct client grant |
| platform_private.compatibility_matrices / CompatibilityMatrix | id uuid PRIMARY KEY; product_version_id uuid NOT NULL REFERENCES platform_private.digital_product_versions(id); os text NOT NULL CHECK (os IN ('macos','windows','linux','ios','android','web')); architecture text NOT NULL CHECK (architecture IN ('x64','arm64','universal','any')); format text NOT NULL CHECK (format IN ('audio','midi','preset','project','vst2','vst3','au','aax','standalone')); host text NULL CHECK (char_length(host) <= 80); daw text NULL CHECK (char_length(daw) <= 80); support_level text NOT NULL CHECK (support_level IN ('supported','known_issue','unsupported','untested')); caveat text NULL CHECK (char_length(caveat) <= 2000); source text NOT NULL CHECK (source IN ('vendor','observed','curated_host','imported')); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; UNIQUE(product_version_id,os,architecture,format,host,daw,version) | (product_version_id,os,architecture,format); (support_level); (source); (product_version_id,version DESC) | Vendor/editor appends own facts; public safe projection; rig evaluator reads current version; forced RLS; no direct client grant |
| platform_private.dependency_edges / DependencyEdge | id uuid PRIMARY KEY; product_version_id uuid NOT NULL REFERENCES platform_private.digital_product_versions(id); dependency_code text NOT NULL CHECK (dependency_code ~ '^[A-Z0-9_:-]{2,80}$'); edition text NULL CHECK (char_length(edition) <= 80); version_constraint text NOT NULL CHECK (char_length(version_constraint) BETWEEN 1 AND 180); required boolean NOT NULL; source text NOT NULL CHECK (source IN ('vendor','schema','observed')); evaluation text NOT NULL CHECK (evaluation IN ('unknown','unsatisfied','satisfied')); version bigint NOT NULL CHECK (version > 0); created_at timestamptz NOT NULL; UNIQUE(product_version_id,dependency_code,edition,version) | (product_version_id,required,evaluation); (dependency_code); (source); (version_constraint) | Vendor/editor appends own edges; rig evaluator reads safe graph; forced RLS; no direct client grant |
| platform_private.rig_checks | id uuid PRIMARY KEY; rig_id uuid NOT NULL REFERENCES platform_private.rigs(id); product_version_id uuid NOT NULL REFERENCES platform_private.digital_product_versions(id); selected_axis jsonb NOT NULL; installed_dependency_codes text[] NOT NULL CHECK (cardinality(installed_dependency_codes) <= 100); compatibility_verdict text NOT NULL CHECK (compatibility_verdict IN ('supported','known_issue','unsupported','unknown')); dependency_verdict text NOT NULL CHECK (dependency_verdict IN ('satisfied','unsatisfied','unknown')); advisory_only boolean NOT NULL DEFAULT true CHECK (advisory_only = true); machine_authorization boolean NOT NULL DEFAULT false CHECK (machine_authorization = false); product_version_snapshot bigint NOT NULL CHECK (product_version_snapshot > 0); created_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL; UNIQUE(rig_id,product_version_id,product_version_snapshot) | (rig_id,created_at DESC); (product_version_id,compatibility_verdict); (dependency_verdict); (created_by,created_at DESC) | Rig owner reads own result; evaluator uses public/product-safe facts; no machine identity grant; forced RLS; no direct client grant |
| platform_private.digital_product_audit | id uuid PRIMARY KEY; product_id uuid NOT NULL REFERENCES platform_private.digital_products(id); product_version_id uuid NULL REFERENCES platform_private.digital_product_versions(id); actor_id uuid NOT NULL REFERENCES auth.users(id); action text NOT NULL CHECK (action IN ('draft_created','compatibility_appended','dependency_appended','rig_checked')); before_hash char(64) NULL; after_hash char(64) NOT NULL CHECK (after_hash ~ '^[a-f0-9]{64}$'); request_id uuid NOT NULL; created_at timestamptz NOT NULL | (product_id,created_at DESC); (product_version_id,created_at DESC); (actor_id,created_at DESC); (action,created_at DESC) | Service/RPC append only; support case-bound read; no client grant; forced RLS |

The nullable axis fields are part of the uniqueness strategy and are normalized by RPC before the unique index; null host/daw means any host/DAW. Product and version type are checked again at 27b submission. RigCheck JSON contains only non-secret selected capability facts and is not a machine authorization record.

### Permission and RLS matrix

| Principal | Read projection | Write path | Prohibited |
| --- | --- | --- | --- |
| Vendor party controller | Own drafts, versions, compatibility, dependencies, schema state | GCF01–GCF03 through scoped RPC | Cannot change type after publish, publish, submit bytes, assert rights/safety, or see buyer rig identity |
| Buyer/buying-party controller | Published product/version compatibility and own rig checks | GCF04 with own rig grant | Cannot edit vendor facts, create support badge, authorize machine, or see private vendor data |
| Catalog editor/support | Case-bound safe projection and mechanical recovery | Support RPC with reason and audit | Cannot override unknown, type, publish, rights, or executable admission |
| Public client | Published safe product/version and compatibility projection | No direct table write | No draft, dependency private source, rig identity, or artifact access |
| System evaluator | Product/version read and rig projection write | Service RPC with request identity | Cannot grant activation, seat, purchase, or rights verification |
| Anon/authenticated table role | No direct table access | Public Hono routes only | Direct SQL/RLS bypass denied |

## State Machines, Concurrency, and Failure Recovery

### Catalog state machine

DigitalProduct and ProductVersion begin draft → schema_blocked or ready_for_submission → submitted → published → superseded/retired through downstream ownership. This companion may create draft and append facts only before the downstream binding rules. Product type becomes immutable at first publish; version facts are never overwritten. Compatibility level is one of supported, known_issue, unsupported, or untested; dependency evaluation is separately satisfied, unsatisfied, or unknown.

RigCheck is requested → evaluated with compatibility and dependency verdicts → expired when product-version snapshot changes. It is advisory in every state. A rig check cannot call activation, seat, entitlement, purchase, or delivery services.

### Race and recovery matrix

| Race/failure | Winner and invariant | Recovery |
| --- | --- | --- |
| Two draft creates with same draft key | First committed vendor-scoped key wins | Replay original response; hash conflict returns 409 |
| Type edit versus first publish | Publish binding wins; type mutation is rejected | Preserve attempted mutation audit; create a new product for another type |
| Compatibility writes same axis/version | Expected version and unique row serialize one winner | Refetch and append a correction/version; no in-place replacement |
| Dependency edge versus graph cycle | Cycle/duplicate check runs under version lock | Reject edge with stable code; existing graph remains |
| Rig check versus product-version correction | Snapshot mismatch marks check stale | Re-run against current version; advisory result never persists as authorization |
| Vendor revocation versus public read | Revocation hides private context; published historical projection follows downstream policy | Return safe state; never leak vendor identity |
| Unknown provider/host registry result | Unknown remains unknown | Exclude from supported facet; no compatibility badge |
| Worker crash after audit write | Transactional audit/outbox or RPC transaction rolls back together | Retry idempotently; no orphan compatibility row |
| Serialization conflict | No partial write | Retry twice at 50/150 ms, then return 409 |

All projection invalidation is idempotent by product/version and revision. A stale cache may show an age marker but never upgrades unknown to supported. Poison input is quarantined with hash and reason; raw private source text is not copied into logs.

## External Seams

| Seam | Exact request | Exact response | Timeout | Retry/backoff | Circuit behavior |
| --- | --- | --- | --- | --- | --- |
| BE-00 idempotency/audit | { operationId, idempotencyKey, actorId, aggregateId, requestHash, response } | { receiptId, replay, auditId } | 2,000 ms | No retry outside transaction; transaction retry twice at 50/150 ms | Open after 3 failures in 30 s; command fails atomically |
| BE-23 party/organization authority | { partyId, actorId, capability, productId } | { allowed: true/false, partyType, grantId, version } | 3,000 ms | 2 retries at 200/600 ms on timeout/408/429/5xx; no retry on deny | Open after 5 failures in 60 s; write fails closed |
| BE-00 object evidence/reference | { objectId, sha256, purpose, actor, expirySeconds } | { evidenceReceiptId, expiresAt, contentType, sizeBytes } | 3,000 ms | 2 retries at 200/600 ms on timeout; no retry on hash mismatch | Open after 3 failures in 60 s; source remains pending |
| Curated host registry | { productVersionId, axis, source, requestedAt } | { state: supported/known_issue/unsupported/unknown, registryVersion, evidenceHash } | 5,000 ms | 3 retries at 250/750/1500 ms for timeout/408/429/5xx; inquiry by request ID | Open after 5 failures in 120 s; result remains unknown |
| BE-25b listing snapshot | { productId, productVersionId, requestedBy, expectedVersion } | { listingRevisionId, disclosureRevisionId, state, version } | 2,000 ms | 2 retries at 50/150 ms on serialization conflict only | Open after 3 failures in 30 s; no listing mutation |

Provider responses are schema-validated; unknown host results remain unknown. Correlation IDs are hashed in logs. No seam can publish a product, grant a seat, verify rights, or enable executable plugins.

## Events and Async Consumers

| Event type | Producer operation | Required envelope and payload | Consumer behavior |
| --- | --- | --- | --- |
| digital_product.version_submitted.v1 | 27b | { eventId, aggregateId, aggregateVersion, occurredAt, requestId, productVersionId, submissionId, state } | Catalog invalidates editable projection |
| digital_product.qa_completed.v1 | 27b | { eventId, aggregateId, aggregateVersion, occurredAt, productVersionId, blockerCount, scopes } | Publication gate refetches facts |
| digital_product.published.v1 | 27b | { eventId, aggregateId, aggregateVersion, occurredAt, productId, productVersionId, termsVersionId, vendorSnapshot } | Catalog exposes immutable published projection |
| digital_entitlement.issued.v1 | 27c | { eventId, aggregateId, aggregateVersion, occurredAt, entitlementId, epochId, productVersionRange } | Product history remains immutable |
| digital_entitlement.state_changed.v1 | 27c/27e | { eventId, aggregateId, aggregateVersion, occurredAt, entitlementId, priorState, newState } | No compatibility fact mutation |
| digital_transfer.grant_created.v1 | 27c | { eventId, aggregateId, aggregateVersion, occurredAt, grantId, artifactVersionId, expiry } | Delivery audit only |
| digital_transfer.completed.v1 | 27c | { eventId, aggregateId, aggregateVersion, occurredAt, grantId, hash, ranges } | Product version remains source |
| digital_product.update_published.v1 | 27d | { eventId, aggregateId, aggregateVersion, occurredAt, productId, priorVersionId, newVersionId } | Compatibility facets refresh by version |
| digital_artifact.withdrawn.v1 | 27e | { eventId, aggregateId, aggregateVersion, occurredAt, artifactId, reason, scope } | Published projection reflects withdrawal without rewriting facts |
| digital_asset.metadata_changed.v1 | 27d | { eventId, aggregateId, aggregateVersion, occurredAt, assetId, priorVersion, newVersion } | Search projection updates asset facets |
| digital_vendor.retired.v1 | 27e | { eventId, aggregateId, aggregateVersion, occurredAt, vendorId, effectiveAt } | Historical catalog projection follows retirement policy |
| digital_enforcement.requested.v1 | 27e | { eventId, aggregateId, aggregateVersion, occurredAt, caseId, targetHash, reasonClass } | Catalog consumes scoped enforcement status |

Outbox and audit records contain event IDs, aggregate IDs/versions, request IDs, payload hashes, and redacted payloads. A missing or duplicate downstream event never changes catalog authority; consumers refetch the canonical version.

## Error Matrix

| Operation ID | Condition | HTTP | Error code | Retry/client action |
| --- | --- | --- | --- | --- |
| BE27A-DCD01 | Hidden vendor/party context | 404 | VENDOR_CONTEXT_NOT_FOUND | Do not reveal |
| BE27A-DCD01 | Unsupported type/schema or unsafe draft text | 422 | PRODUCT_SCHEMA_INVALID | Correct fields; executable remains gated |
| BE27A-DCD01 | Draft key/body hash conflict | 409 | IDEMPOTENCY_KEY_CONFLICT | Use original key/result or new draft key |
| BE27A-DCD02 | Hidden product/version | 404 | PRODUCT_NOT_FOUND | Do not reveal |
| BE27A-DCD02 | Version bound/published or stale expected version | 409 | PRODUCT_VERSION_LOCKED or PRODUCT_VERSION_CONFLICT | Refetch; append correction only where policy permits |
| BE27A-DCD02 | Axis/source unsupported or unknown | 422 | COMPATIBILITY_AXIS_INVALID | Use allowlisted axis; retain unknown rather than claim support |
| BE27A-DCD03 | Hidden product/version | 404 | PRODUCT_NOT_FOUND | Do not reveal |
| BE27A-DCD03 | Duplicate edge or graph cycle | 409 | DEPENDENCY_EDGE_CONFLICT | Refetch graph; choose distinct edge |
| BE27A-DCD03 | Unsafe/oversized constraint | 422 | DEPENDENCY_CONSTRAINT_INVALID | Correct constraint |
| BE27A-DCD04 | Hidden product version or rig | 404 | PRODUCT_VERSION_NOT_FOUND or RIG_NOT_FOUND | Do not reveal |
| BE27A-DCD04 | Visible rig without account/organization grant | 403 | RIG_CHECK_FORBIDDEN | Use controlled holder |
| BE27A-DCD04 | Version stale or evaluator unavailable | 409 or 503 | RIG_VERSION_CONFLICT or HOST_REGISTRY_UNAVAILABLE | Refetch or retry; result stays advisory |
| All | Body/schema/unknown key/unsafe text | 400 or 422 | VALIDATION_FAILED | Correct field paths; do not retry unchanged |
| All | Rate limit exceeded | 429 | RATE_LIMITED | Honor Retry-After and same idempotency key |
| All | Audit/dependency circuit open | 503 | DEPENDENCY_UNAVAILABLE | Retry with backoff; no partial write |

Every response uses ErrorResponse with BE-00 ApiError { code, message, requestId, details }. Error details contain stable paths/codes only and never vendor legal identity, buyer rig details, source text, or artifact bytes.

## Testing Strategy

### Contract and route tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27A-CON-001 | BE27A-DCD01 | Strict draft request/response enforces immutable type, current schema, vendor party, continuity flag, and key replay |
| BE27A-CON-002 | BE27A-DCD02 | Axis combination, support level, source, expected version, and advisory result are exact |
| BE27A-CON-003 | BE27A-DCD03 | Required/optional dependency, edition/constraint, duplicate/cycle rules, and separate evaluation are exact |
| BE27A-CON-004 | BE27A-DCD04 | Rig ownership, version snapshot, separate compatibility/dependency verdicts, advisoryOnly true, and machineAuthorization false are exact |
| BE27A-ROUTE-001 | BE27A-DCD01 through BE27A-DCD04 | Method/path/operation registry is authoritative; aliases cannot bypass middleware |

### Authorization and privacy tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27A-AUTH-001 | BE27A-DCD01 through BE27A-DCD04 | Hidden resource returns 404; visible resource without role/grant returns 403; details conceal context |
| BE27A-AUTH-002 | BE27A-DCD01 through BE27A-DCD03 | Vendor organization grant and immutable type/version ownership are enforced |
| BE27A-AUTH-003 | BE27A-DCD04 | Buyer rig is account/organization scoped; vendor cannot view buyer identity; result cannot authorize machine |
| BE27A-AUTH-004 | All | CORS policy digital-api, CSRF, safe text, redaction, and no direct table/object grants are enforced |

### Persistence, idempotency, and concurrency tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27A-DB-001 | All | Forced RLS denies direct access; RPC checks party, state, version, uniqueness, and append-only rules |
| BE27A-DB-002 | BE27A-DCD01, BE27A-DCD02 | Draft key replay, type/publish race, axis uniqueness, and correction versioning serialize |
| BE27A-DB-003 | BE27A-DCD03 | Dependency duplicate/cycle validation and required/optional separation hold under concurrency |
| BE27A-DB-004 | BE27A-DCD04 | Rig ownership, snapshot invalidation, advisory-only flags, and stale cache handling hold |
| BE27A-DB-005 | All assigned operations | Every field lists SQL type, nullability, constraints/FKs, indexes, forced RLS, and grants and migration tests cover them |

### Domain, seam, event, and recovery tests

| Test ID | Operation ID | Acceptance assertion |
| --- | --- | --- |
| BE27A-DOM-001 | BE27A-DCD01 through BE27A-DCD03 | Product type immutability, versioned compatibility, dependency unknown state, and no executable publication are enforced |
| BE27A-DOM-002 | BE27A-DCD04 | Self-declared rig is advisory and separate from machine authorization/activation |
| BE27A-SEAM-001 | BE27A-DCD01 through BE27A-DCD04 | BE-00, identity, host registry, object evidence, and BE-25b timeout/retry/circuit behavior is exact |
| BE27A-EVT-001 | All assigned operations | Exact IA event types, redaction, audit/outbox references, and consumer refetch are verified |
| BE27A-REC-001 | All assigned operations | Lost responses, provider unknown, stale revisions, cycle conflict, worker crash, and poison input recover as specified |

## Deepening Passes

| Pass | Question | Resolution |
| --- | --- | --- |
| D1 interaction | Does every assigned IA interaction have one stable route? | Yes: 27.01–27.04 map one-to-one to BE27A-DCD01–DCD04 |
| D2 type | Can a vendor change type after publication or publish executable content through this companion? | No: type locks at publish; submission/QA/admission remains 27b and future policy |
| D3 compatibility | Can unknown host coverage become supported or a badge? | No: levels remain distinct and rig results are advisory only |
| D4 dependency | Can an unknown or unsatisfied required dependency claim completable? | No: required/optional and evaluation are separate; unknown is retained |
| D5 identity | Can vendor role create a new persona or expose buyer rig identity? | No: canonical person/org acting-party authority and scoped projections apply |
| D6 authorization | Are role ownership and 403 versus 404 explicit? | Yes: each operation has a role/scope and concealment row |
| D7 persistence | Are fields implementable and protected? | Yes: typed/nullability/constraints/FKs/indexes/RLS/grants are listed |
| D8 resilience | Are version races and host uncertainty deterministic? | Yes: locks, idempotency, bounded retries, unknown state, and stale invalidation are specified |
| D9 privacy | Can source text, machine fingerprint, or legal identity leak? | No: hashes, safe projections, purpose-bound evidence, and log scrubbers are explicit |
| D10 boundary | Does this duplicate submission, publication, delivery, entitlement, or enforcement? | No: reconciliation and dependency references assign every adjacent authority |

## Ambiguity Gate

PASS. Evidence: 27.01–27.04 each map to one authoritative operation and route; DigitalProduct, ProductVersion, CompatibilityMatrix, and DependencyEdge are owned while VendorSubmission, QaCheck, ReviewDecision, LicenceTermsVersion, Entitlement, AcquisitionEpoch, SeatAuthorization, ArtifactVersion, TransferGrant, LibraryProjection, DigitalAsset, and VendorContinuityManifest are consumed without route duplication; exact strict Zod 4 contracts and global ApiError { code, message, requestId, details } are present; every operation has role ownership, 403-vs-404, CORS policy digital-api, idempotency, rate limit, observability, typed persistence/RLS/grants, error rows, and keyed tests; immutable product type, append-only compatibility/dependencies, advisory rig verdict, unknown handling, organization control, exact seams, event privacy, and recovery behavior are resolved. Neighboring interactions 27.05–27.24 are referenced through explicit BE-27b/c/d/e handoffs. No unresolved source conflict remains.

## Open Questions

None.

## Dependency References

- BE-00 platform contracts in 00-infrastructure.md: strict Zod 4, ApiError { code, message, requestId, details }, auth, CORS, idempotency, rate classes, audit/outbox, object evidence, and forced RLS.
- BE-23/24 identity and collections: canonical person/org acting-party, organization grants, provenance, and custody boundaries.
- BE-25b listing/disclosure lifecycle: immutable listing/disclosure revisions; this companion never activates marketplace publication.
- BE-27b submission/QA/publication: VendorSubmission, QaCheck, ReviewDecision, LicenceTermsVersion, ArtifactVersion, and publication gate.
- BE-27c entitlements/library/delivery: Entitlement, AcquisitionEpoch, TransferGrant, LibraryProjection, and delivery authorization.
- BE-27d updates/assets/trials: update versions, release channels, DigitalAsset, auditions, buyer organization, and trial origin.
- BE-27e enforcement/retirement/portability: withdrawals, enforcement, retirement, continuity, and account export/erase.

## Changelog

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-08-29 | Initial production-grade BE companion for interactions 27.01–27.04; typed digital catalog, immutable product/version, compatibility/dependency facts, advisory rig checks, strict contracts, security, persistence/RLS, audit, resilience, and ambiguity evidence added |
