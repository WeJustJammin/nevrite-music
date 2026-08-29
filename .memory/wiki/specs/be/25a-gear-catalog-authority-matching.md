# BE-25a — Gear Catalog Authority and Listing Matching

**Status:** Complete
**Backend surface:** Hono on Cloudflare Workers, Supabase PostgreSQL/RLS, transactional outbox, Cloudflare Queues
**Authority boundary:** Shard 25a owns the versioned gear catalog graph, category schemas, attributed catalog assertions, moderation resolutions, serial/date hypotheses, listing-to-model binding and fitment/voltage advisory evidence. Shard 23 remains authoritative for canonical gear identity and provenance; 25b owns listing truth and disclosure.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Classification | Multi-domain IA shard split; 25a owns catalog authority, contribution/moderation, matching, decoding and fitment advisory | BE index line 42 assigns catalog authority/matching to 25a; IA interactions 25.01–25.07 at lines 53–59 and 79–85 |
| In-scope operations | Search/browse catalog, create provisional model, contribute fact, moderate resolution, match listing, decode serial/date, evaluate fitment/voltage | IA source interactions lines 75–85; deep-dive Catalog Assertion and Resolution lines 12–20 |
| Canonical state | Models and category schemas are versioned; assertions and resolutions are append-only; matching and decode are reversible evidence; fitment is advisory | IA decisions lines 27–30; models lines 130–135; deep-dive lines 14–19 |
| Boundary with 25b | 25b owns grades, originality, evidence, listing creation and lifecycle; 25a supplies schema/model/bind references and never publishes a listing | IA interactions 25.08–25.13 lines 60–65 and 86–91 |
| Boundary with Shard 23 | Shard 23 owns canonical unit identity, theft and provenance; catalog description, match or serial hypothesis never mutates identity | IA dependencies lines 120–124; IA interaction 25.06 line 84 |
| Boundary with Shard 06 | Moderation and authenticity risk may consume safety evidence; this companion cannot adjudicate a safety case or sanction a seller | IA access and cross-domain contract lines 172–181; no safety authority in 25a |
| Non-goals | Competitor scraping, unlicensed imports, automatic identity registration, bare compatibility guarantees, listing disclosure/lifecycle, checkout or market pricing | IA decisions lines 27–40; deep-dive External Data Admission lines 74–79 |

## Referenced Material Inventory

| Source file | Section and lines | Material consumed |
|---|---|---|
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Overview and scope lines 7–21 | Catalog, listing, market-data ownership, deferred enterprise scope and dependencies |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Catalog and Listing Decisions lines 23–40 | Licensed seed, unmatched state, schema authority, serial hypothesis, matching and advisory limits |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Acceptance criteria lines 53–59 | Exact validation, authentication, authorization, revision/idempotency, success and recovery behavior for 25.01–25.07 |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Interactions lines 75–85 | Exact IA interaction IDs, preconditions, outcomes and fallback states |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Command Contracts lines 105–116 | Catalog assertion, resolution, bind and model/decoder command invariants |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Data Models and Typed Field Registry lines 126–168 | GearMake, GearModel, ModelPeriod, CategorySchemaVersion, CatalogAssertion, CatalogResolution, SerialDecodeHypothesis, ListingModelBind and deterministic types |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Access Control lines 170–186 | Public browse, contributor, category standing, commercial recusal and private evidence boundaries |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Event Schemas lines 209–226 | Exact catalog/matching events and platform envelope obligations |
| .memory/wiki/specs/ia/25-gear-market-catalog.md | Edge Cases lines 228–247 | Unmatched publication, sibling ambiguity, model merge, unverified safety and decoder failures |
| .memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md | Catalog Assertion and Resolution lines 12–20 | Candidate ranking, no-match provisional path, moderator quorum and reversible graph |
| .memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md | External Data Admission lines 74–79 | Licensed provenance, mapping, retention and no-scraping admission gate |
| .memory/wiki/specs/ia/deep-dives/25-gear-market-catalog.md | Access Control and Race Resolution lines 100–115 and 127–139 | Category standing, recusal, bind-time versions and event ordering |
| .memory/wiki/specs/be/00-infrastructure.md | Request/Response Contracts lines 112–153 | Zod 4 strictness, BE00 ApiError and safe error details |
| .memory/wiki/specs/be/00-infrastructure.md | Database and RLS lines 208–251 | Forced RLS, grants, audit/outbox/idempotency relation and negative authorization tests |
| .memory/wiki/specs/be/00-infrastructure.md | Middleware and route archetypes lines 255–296 | Hono order, CORS allowlist, read/command limits, deadlines and capability checks |
| .memory/wiki/specs/be/00-infrastructure.md | Protected transaction and deterministic protocol lines 300–353 | Atomic state/audit/outbox, CAS, idempotency hash and collection ceilings |
| .memory/wiki/specs/be/23a-gear-identity-claims-transfers.md | Canonical identity and provenance contracts | gear_records identity source, owner relation and no catalog-to-identity mutation |
| .memory/wiki/specs/be/23b-theft-screening-recovery.md | Screening source and consumer contract | Positive screening hold behavior and no accusation from an advisory match |

The canonical IA source is .memory/wiki/specs/ia/25-gear-market-catalog.md. The approved BE index row is line 42; no source alias replacement was required.

## IA Source Map

### Assigned interactions

| IA ID | Source trace | Backend operation | Completion and non-negotiable recovery |
|---|---|---|---|
| 25.01 | IA source lines 53 and 79; deep dive lines 12–17 | BE25A-GMC01 searches current versioned model graph and facets | Bounded result is versioned; search failure returns exact retry metadata and never fabricates a match |
| 25.02 | IA source lines 54 and 80; deep dive lines 14–16 | BE25A-GMC02 creates a provisional model/assertion in real listing/record context | Duplicate candidates route to reversible resolution; listing can remain unmatched |
| 25.03 | IA source lines 55 and 81; deep dive lines 15–18 | BE25A-GMC03 appends attributed catalog fact | Unsupported or safety assertion remains unverified and cannot suppress a warning |
| 25.04 | IA source lines 56 and 82; deep dive lines 18–20 | BE25A-GMC04 applies category-scoped moderator resolution | Commercial recusal or quorum failure leaves contribution pending; merge/split/rename remains reversible |
| 25.05 | IA source lines 57 and 83; deep dive lines 16–19 | BE25A-GMC05 binds listing to model with source, confidence and margin | Ambiguity/unavailability degrades to unmatched; high-confidence/high-margin auto-bind is disabled across known siblings |
| 25.06 | IA source lines 58 and 84; model line 134 | BE25A-GMC06 stores versioned serial/date hypotheses | Unsupported/ambiguous input returns unknown and never mutates canonical identity |
| 25.07 | IA source lines 59 and 85; fitment decision line 17 | BE25A-GMC07 stores fitment/voltage advisory evidence | Fitment no-result suppresses a warning; voltage no-result says it could not verify; neither blocks a listing |

### Canonical Data Models

| IA Data Models name | 25a realization | Relationship and invariant |
|---|---|---|
| GearMake | catalog_model_nodes node_type make | Stable maker identity and aliases; model graph references it by version |
| GearModel | catalog_model_nodes node_type model | Unit-sold model; seller-assembled sets remain bundles in 25c |
| ModelPeriod | catalog_model_nodes node_type period | Effective period/version evidence; display may follow current graph while claims pin old bind |
| CategorySchemaVersion | catalog_schema_versions | One schema-bearing category version controls attributes, flaw options and component sets |
| CatalogAssertion | catalog_assertions | Append-only source/contributor assertion with confidence, status and supersession |
| CatalogResolution | catalog_resolutions | Reversible merge/split/alias/rename graph with effective time and moderator quorum |
| SerialDecodeHypothesis | serial_decode_hypotheses | Separate confidence-labelled evidence; no identity mutation |
| ListingModelBind | listing_model_binds | Reversible unmatched/suggested/confirmed/auto_bound/disputed/unbound binding |
| DisclosureVersion | consumed from 25b | Matching reads grade/schema version only; it does not write condition or originality |
| Listing | consumed from 25b | Listing context is required for provisional/model operations |
| ListingVersion | consumed from 25b | Bind source/version is pinned into later listing versions |
| MarketplaceUnit | consumed from 25c | Unit identity is a listing/inventory concern; matching does not claim inventory |
| StockLine | consumed from 25c | Counted stock may be matched to a model without producing unit identity |
| InventoryClaim | consumed from 25c/26 | Claim-time bind is retained by commerce; catalog graph changes never rewrite it |
| EvidenceFrame | consumed from 25b | Match evidence may cite a frame digest; raw evidence remains protected |
| EvidencePack | consumed from 25b | Listing/custody evidence boundary remains 25b-owned |
| CompObservation | consumed from 25d | Unmatched and unresolved baselines are excluded from market comps |
| GuideResult | consumed from 25d | Model/condition/originality bucket is an input, not a price output here |
| StorefrontPolicyVersion | consumed from 25d | Listing policy version is not a catalog authority |
| CustodyInterval | consumed from 24d | Catalog matching never infers ownership or custody |
| CustodyGrant | consumed from 24d | A sell/public disclosure grant is checked by listing operations, not by model graph |

### Event Schemas

| IA Event Schemas event type | 25a use | Payload restriction |
|---|---|---|
| gear_catalog.assertion_submitted.v1 | Produced by GHO02/GHO03 | Assertion/model/field/source/status, actor hash and version; no evidence bytes |
| gear_catalog.resolution_changed.v1 | Produced by GHO04 | Affected IDs, action, prior/new graph versions, quorum and actor hash |
| gear_listing.model_bind_changed.v1 | Produced by GHO05 | Listing/bind IDs, prior/new model/state, source class and version |
| gear_listing.disclosure_changed.v1 | Consumed to re-evaluate matching constraints | Event hint only; 25b remains disclosure authority |
| gear_listing.published.v1 | Consumed to start or refresh matching | No listing seller/payout/private field in payload |
| gear_listing.state_changed.v1 | Consumed to invalidate bind context | State/version only; no lifecycle mutation from this consumer |
| gear_inventory.claim_resolved.v1 | Consumed to pin bind-time model evidence | Order/claim reference and version only; no claim mutation |
| gear_inventory.stock_changed.v1 | Consumed to refresh counted-stock context | Stock/version and delta class; no unit identity inference |
| gear_listing.screening_changed.v1 | Consumed to expose screening uncertainty to match consumers | State/version/time only; no accusation or registry payload |
| gear_market.comp_admitted.v1 | Consumed to identify eligible guide bucket | Comp ID/bucket/policy version only; market data remains 25d-owned |
| gear_market.guide_recomputed.v1 | Consumed to refresh model bucket metadata | Output class/sample/period only; no price authority |
| gear_storefront.policy_changed.v1 | Consumed to revalidate future listing context | Storefront/policy version only |

All events use eventId, schemaVersion, aggregateId, aggregateVersion, actorId, actingPartyId, correlationId, causationId and occurredAt. Consumers are idempotent and refetch canonical state.

## Endpoint Reconciliation

| IA interaction | Operation ID | Route | Why this boundary is complete |
|---|---|---|---|
| 25.01 Search/browse catalog | BE25A-GMC01 | GET /api/v1/gear/catalog/search | Owns bounded graph/facet read and exact retry/unavailable response |
| 25.02 Create provisional model inline | BE25A-GMC02 | POST /api/v1/gear/catalog/provisional-models | Owns provisional model/assertion context; does not publish or bind a listing |
| 25.03 Contribute catalog fact | BE25A-GMC03 | POST /api/v1/gear/catalog/assertions | Owns attributed append and unverified status |
| 25.04 Moderate catalog change | BE25A-GMC04 | POST /api/v1/gear/catalog/resolutions | Owns category standing, recusal/quorum and reversible graph resolution |
| 25.05 Match listing to model | BE25A-GMC05 | POST /api/v1/gear/listing-model-bindings | Owns reversible bind evidence and candidate ambiguity |
| 25.06 Decode serial/date | BE25A-GMC06 | POST /api/v1/gear/serial-decode | Owns hypothesis evidence only; Shard 23 identity remains unchanged |
| 25.07 Evaluate fitment/voltage | BE25A-GMC07 | POST /api/v1/gear/fitment-evaluations | Owns advisory result and unknown coverage; no listing/booking block |

BE00 platform routes, Shard 23 identity/theft routes, 25b listing routes and 25d market routes are dependencies, not duplicate implementations. Every route below has one stable operation ID.

## API Endpoints

### Umbrella Feature Trace

The IA Shard 25 feature bullets are represented across 25a–25d: 13.01 Canonical Gear Catalog; 13.02 Condition, Originality & Disclosure; 13.03 Listings & Inventory; 13.04 Price Discovery & Market Data; 13.12 Gear Seller Storefront & Commerce Policies; 13.13 Authorized Dealer Program & MAP Pricing.

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Capability | Archetype | Success |
|---|---|---|---|---|---|---|
| BE25A-GMC01 | GET | /api/v1/gear/catalog/search | 25.01 | catalog.read | public bounded read | 200 Gmc01Success |
| BE25A-GMC02 | POST | /api/v1/gear/catalog/provisional-models | 25.02 | catalog.provisional.create | ordinary command | 201 Gmc02Success |
| BE25A-GMC03 | POST | /api/v1/gear/catalog/assertions | 25.03 | catalog.assertion.write | ordinary command | 201 Gmc03Success |
| BE25A-GMC04 | POST | /api/v1/gear/catalog/resolutions | 25.04 | catalog.moderate | high-risk moderator command | 200 Gmc04Success |
| BE25A-GMC05 | POST | /api/v1/gear/listing-model-bindings | 25.05 | listing.model.bind | ordinary command | 200 Gmc05Success |
| BE25A-GMC06 | POST | /api/v1/gear/serial-decode | 25.06 | catalog.serial.decode | ordinary advisory command | 201 Gmc06Success |
| BE25A-GMC07 | POST | /api/v1/gear/fitment-evaluations | 25.07 | catalog.fitment.read | ordinary advisory command | 201 Gmc07Success |

Only this table assigns operation IDs. A handler rejects method/path mismatch before target lookup, and a client cannot supply an operation ID to select a different handler.

### Pagination and bounded query policy

| Operation ID | Allowlisted filters | Page size | Cursor and stable ordering |
|---|---|---|---|
| BE25A-GMC01 | `categoryId`, `makerId`, `query`, `alias`, `includeUnmatched`, `schemaVersion`; no arbitrary filter or sort keys | Default 25, maximum 50; `Gmc01Success.models` and facets remain bounded | Opaque cursor is bound to actor/public principal, normalized filters, graph/schema versions and sort; order by `nodeType ASC`, normalized `name ASC`, `id ASC` tie-break |

The cursor is rejected when any filter, graph/schema version or ordering
component changes. `nextCursor` is emitted only when another page exists; the
read never returns an unbounded result or a stale graph-version blend.

### Request/Response Contracts (Zod 4)

Zod 4 schemas are strict executable contracts for Hono, TypeScript, OpenAPI and tests. Unknown keys fail. IDs are UUID strings, versions are positive decimal strings, dates are RFC 3339 with offsets and opaque cursors are bounded. Search and advisory outputs are version-pinned and never present an unqualified identity or compatibility guarantee.

~~~ts
import { z } from "zod";

type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const uuid = z.string().uuid();
const version = z.string().regex(/^[1-9][0-9]*$/).max(19);
const idemKey = z.string().regex(/^[\x21-\x7e]{8,128}$/);
const text = z.string().min(1).max(256).refine((v) => v.normalize("NFC") === v);
const cursor = z.string().regex(/^[A-Za-z0-9._~-]{1,512}$/);
const CatalogValue = z.union([z.string().trim().min(1).max(512), z.number().finite(), z.boolean(), z.array(z.string().trim().min(1).max(256)).max(32)]);
const jsonObject = z.record(z.string().regex(/^[a-z][a-z0-9_.-]{0,79}$/), CatalogValue).superRefine((value, ctx) => { if (Object.keys(value).length > 128) ctx.addIssue({ code: "custom", message: "attribute_key_limit" }); });
const dateTime = z.string().datetime({ offset: true });
const sourceState = z.enum(["known", "unknown", "withheld", "not_applicable"]);

const CatalogFilter = z.strictObject({
  categoryId: uuid.nullable(),
  makerId: uuid.nullable(),
  query: text.max(160).nullable(),
  alias: text.max(160).nullable(),
  includeUnmatched: z.boolean(),
  schemaVersion: version.nullable(),
});

const Gmc01Request = z.strictObject({
  filters: CatalogFilter,
  cursor: cursor.nullable(),
  limit: z.number().int().min(1).max(50).default(25),
  idempotencyKey: idemKey,
  requestId: uuid,
});

const CatalogModel = z.strictObject({
  id: uuid,
  nodeType: z.enum(["make", "model", "period"]),
  name: text.max(160),
  aliases: z.array(text.max(160)).max(100),
  categoryId: uuid.nullable(),
  currentGraphVersion: version,
  sourceState,
});

const Gmc01Success = z.strictObject({
  operationId: z.literal("BE25A-GMC01"),
  graphVersion: version,
  schemaVersions: z.array(z.strictObject({ categoryId: uuid, version })).max(50),
  models: z.array(CatalogModel).max(50),
  facets: z.array(z.strictObject({ key: text.max(80), label: text.max(160), count: z.number().int().nonnegative() })).max(100),
  nextCursor: cursor.nullable(),
  retryAfterSeconds: z.number().int().positive().nullable(),
  state: z.enum(["available", "unavailable"]),
  replayed: z.boolean(),
  asOf: dateTime,
});

const CatalogContext = z.strictObject({
  listingId: uuid.nullable(),
  gearRecordId: uuid.nullable(),
  contextVersion: version,
}).superRefine((v, ctx) => {
  if (v.listingId === null && v.gearRecordId === null) {
    ctx.addIssue({ code: "custom", path: ["context"], message: "listing or gear record context is required" });
  }
});

const Gmc02Request = z.strictObject({
  context: CatalogContext,
  categoryId: uuid,
  proposedName: text.max(160),
  proposedAliases: z.array(text.max(160)).max(20),
  factualAttributes: jsonObject,
  sourceType: z.enum(["seller_assertion", "licensed_import", "manufacturer_authorized", "community"]),
  evidenceDigest: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  expectedVersion: version.nullable(),
  idempotencyKey: idemKey,
  requestId: uuid,
});

const ProvisionalModel = z.strictObject({
  id: uuid,
  nodeType: z.literal("model"),
  name: text.max(160),
  aliases: z.array(text.max(160)).max(20),
  categoryId: uuid,
  graphVersion: version,
  provisional: z.literal(true),
  sourceAssertionId: uuid,
  state: z.enum(["provisional", "unmatched", "resolved"]),
});

const Gmc02Success = z.strictObject({
  operationId: z.literal("BE25A-GMC02"),
  model: ProvisionalModel,
  assertionId: uuid,
  duplicateCandidateIds: z.array(uuid).max(20),
  resolutionState: z.enum(["none", "pending_review"]),
  replayed: z.boolean(),
  createdAt: dateTime,
});

const Gmc03Request = z.strictObject({
  subjectId: uuid,
  categoryId: uuid,
  field: text.max(120),
  value: CatalogValue,
  sourceType: z.enum(["seller_assertion", "licensed_import", "manufacturer_authorized", "community"]),
  sourceRef: text.max(256).nullable(),
  evidenceDigest: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  safetyRelevant: z.boolean(),
  expectedVersion: version.nullable(),
  idempotencyKey: idemKey,
  requestId: uuid,
});

const AssertionResource = z.strictObject({
  id: uuid,
  subjectId: uuid,
  categoryId: uuid,
  field: text.max(120),
  value: CatalogValue,
  sourceType: z.enum(["seller_assertion", "licensed_import", "manufacturer_authorized", "community"]),
  confidence: z.number().min(0).max(1),
  status: z.enum(["unverified", "corroborating", "accepted", "superseded"]),
  sourceState,
  version,
  createdAt: dateTime,
});

const Gmc03Success = z.strictObject({
  operationId: z.literal("BE25A-GMC03"),
  assertion: AssertionResource,
  corroboratesCurrent: z.boolean(),
  warningSuppressionAllowed: z.literal(false),
  eventType: z.literal("gear_catalog.assertion_submitted.v1"),
  replayed: z.boolean(),
  createdAt: dateTime,
});

const Gmc04Request = z.strictObject({
  contributionId: uuid,
  categoryId: uuid,
  action: z.enum(["accept", "reject", "merge", "split", "alias", "rename"]),
  targetIds: z.array(uuid).min(1).max(20),
  reason: text.max(2000),
  expectedGraphVersion: version,
  recusalConfirmed: z.literal(true),
  quorumEvidence: z.string().regex(/^[a-f0-9]{64}$/),
  idempotencyKey: idemKey,
  requestId: uuid,
});

const ResolutionResource = z.strictObject({
  id: uuid,
  categoryId: uuid,
  action: z.enum(["accept", "reject", "merge", "split", "alias", "rename"]),
  affectedIds: z.array(uuid).min(1).max(20),
  priorGraphVersion: version,
  graphVersion: version,
  moderatorCount: z.number().int().positive(),
  state: z.enum(["applied", "pending_quorum", "rejected"]),
  reversible: z.literal(true),
});

const Gmc04Success = z.strictObject({
  operationId: z.literal("BE25A-GMC04"),
  resolution: ResolutionResource,
  eventType: z.literal("gear_catalog.resolution_changed.v1"),
  replayed: z.boolean(),
  appliedAt: dateTime,
});

const Candidate = z.strictObject({
  modelId: uuid,
  score: z.number().min(0).max(1),
  margin: z.number().min(0).max(1),
  source: z.enum(["title", "structured_attributes", "seller_sku_memory", "sibling_graph", "description"]),
  ambiguity: z.boolean(),
});

const Gmc05Request = z.strictObject({
  listingId: uuid,
  candidates: z.array(Candidate).max(50),
  selectedModelId: uuid.nullable(),
  actorType: z.enum(["seller", "moderator", "matcher"]),
  expectedVersion: version,
  idempotencyKey: idemKey,
  requestId: uuid,
});

const ModelBindResource = z.strictObject({
  id: uuid,
  listingId: uuid,
  modelId: uuid.nullable(),
  state: z.enum(["unmatched", "suggested", "confirmed", "auto_bound", "disputed", "unbound"]),
  confidence: z.number().min(0).max(1).nullable(),
  margin: z.number().min(0).max(1).nullable(),
  source: z.enum(["seller", "moderator", "matcher", "none"]),
  graphVersion: version,
  reversible: z.literal(true),
  version,
});

const Gmc05Success = z.strictObject({
  operationId: z.literal("BE25A-GMC05"),
  bind: ModelBindResource,
  candidates: z.array(Candidate).max(50),
  publicationMayContinue: z.literal(true),
  eventType: z.literal("gear_listing.model_bind_changed.v1"),
  replayed: z.boolean(),
  updatedAt: dateTime,
});

const Hypothesis = z.strictObject({
  candidate: text.max(160),
  field: z.enum(["model", "manufacture_year", "date_range", "serial_format"]),
  confidence: z.number().min(0).max(1),
  source: z.enum(["decoder", "user_input", "licensed_reference"]),
  alternativeRank: z.number().int().nonnegative(),
});

const Gmc06Request = z.strictObject({
  serialValue: text.max(128),
  decoderVersion: version,
  gearRecordId: uuid.nullable(),
  idempotencyKey: idemKey,
  requestId: uuid,
});

const Gmc06Success = z.strictObject({
  operationId: z.literal("BE25A-GMC06"),
  hypothesisId: uuid,
  inputDigest: z.string().regex(/^[a-f0-9]{64}$/),
  hypotheses: z.array(Hypothesis).max(50),
  state: z.enum(["hypotheses", "unknown", "unsupported", "ambiguous"]),
  sourceVersion: version,
  identityMutated: z.literal(false),
  replayed: z.boolean(),
  createdAt: dateTime,
});

const Gmc07Request = z.strictObject({
  modelId: uuid,
  unitFacts: jsonObject,
  regionCode: z.string().regex(/^[A-Z]{2}(-[A-Z0-9]{1,8})?$/),
  referenceVersion: version.nullable(),
  idempotencyKey: idemKey,
  requestId: uuid,
});

const AdvisoryFinding = z.strictObject({
  dimension: z.enum(["fitment", "voltage"]),
  state: z.enum(["warning", "no_result", "could_not_verify", "clear", "unknown"]),
  subject: text.max(160),
  message: text.max(500),
  sourceVersion: version.nullable(),
});

const Gmc07Success = z.strictObject({
  operationId: z.literal("BE25A-GMC07"),
  evaluationId: uuid,
  modelId: uuid,
  findings: z.array(AdvisoryFinding).max(100),
  unknownCoverage: z.number().min(0).max(1),
  state: z.enum(["complete", "partial", "unavailable"]),
  blocksListing: z.literal(false),
  version,
  replayed: z.boolean(),
  createdAt: dateTime,
});

const ApiError = z.strictObject({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
  message: z.string().min(1).max(500),
  requestId: uuid,
  details: BE00ErrorDetails,
});

const ErrorResponse = z.strictObject({ error: ApiError });
~~~

ErrorResponse is the only failure body. HTTP status stays on the response line; generic RFC fields are not added. BE00 limits details to 16 keys, four levels and 8 KiB.

### Contract Registry

| Operation ID | Request schema and source fields | Success schema and exact status | Global failure shape |
|---|---|---|---|
| BE25A-GMC01 | Gmc01Request: bounded CatalogFilter, cursor, limit, idempotencyKey and requestId | Gmc01Success, 200; graph/schema versions, models, facets and retry state | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE25A-GMC02 | Gmc02Request: real listing/gear context, category, proposed model facts, source and expectedVersion | Gmc02Success, 201; provisional model, assertion and reversible duplicate candidates | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE25A-GMC03 | Gmc03Request: subject/category/field/value, source/evidence, safety flag and expectedVersion | Gmc03Success, 201; attributed assertion, corroboration and warning suppression false | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE25A-GMC04 | Gmc04Request: contribution, category action, targets, reason, recusal/quorum evidence and expectedGraphVersion | Gmc04Success, 200; applied/pending/rejected reversible resolution | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE25A-GMC05 | Gmc05Request: listing, ranked candidates or selected model, actorType and expectedVersion | Gmc05Success, 200; reversible bind, candidate graph and publicationMayContinue true | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE25A-GMC06 | Gmc06Request: serial value, decoder version, optional gear record and idempotencyKey | Gmc06Success, 201; digest, hypotheses, confidence/state and identityMutated false | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE25A-GMC07 | Gmc07Request: model, unit facts, region and reference version | Gmc07Success, 201; advisory findings, unknown coverage, state and blocksListing false | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |

### Error Registry

| Operation ID | HTTP and code | Trigger | Safe details and recovery |
|---|---|---|---|
| BE25A-GMC01 | 400 INVALID_REQUEST or 422 VALIDATION_FAILED | Invalid filter, cursor, limit, Unicode or unknown key | BE00 FieldViolation rows only; correct filters or retry with returned cursor |
| BE25A-GMC01 | 503 CATALOG_UNAVAILABLE | Search index/graph cannot provide a coherent version | retryAfterSeconds and graph class only; no fabricated match or stale success |
| BE25A-GMC02 | 400 INVALID_REQUEST, 403 FORBIDDEN or 404 NOT_FOUND | Missing real listing/record context or concealed source | Known unauthorized context is 403; concealed source is 404; no provisional row |
| BE25A-GMC02 | 409 VERSION_MISMATCH or 422 DUPLICATE_REVIEW | Context changed or duplicate candidate requires resolution | Re-read context; return reversible candidate IDs only |
| BE25A-GMC03 | 400 INVALID_REQUEST or 422 SCHEMA_FIELD_UNSUPPORTED | Field not allowed by category schema, invalid source or unsafe value | FieldViolation and schema version; assertion remains untrusted |
| BE25A-GMC03 | 403 FORBIDDEN or 404 NOT_FOUND | Contributor lacks source/context standing or subject concealed | No contributor graph or subject existence detail |
| BE25A-GMC04 | 403 MODERATOR_STANDING_REQUIRED or 422 COMMERCIAL_RECUSED | Category standing absent, moderator commercially interested or quorum absent | Resolution remains pending; no graph mutation |
| BE25A-GMC04 | 409 VERSION_MISMATCH | Graph changed before resolution CAS | Re-read graph and submit new expected version |
| BE25A-GMC05 | 400 INVALID_REQUEST or 422 CANDIDATE_INVALID | Candidate graph malformed or selected model outside category | Field violations; listing remains unmatched |
| BE25A-GMC05 | 403 FORBIDDEN or 404 NOT_FOUND | Actor cannot edit listing or listing concealed | Known unauthorized listing is 403; concealed listing is 404 |
| BE25A-GMC05 | 409 VERSION_MISMATCH or 422 AMBIGUOUS_MATCH | Listing changed or sibling ambiguity blocks bind | Re-rank/review; publication may continue unmatched |
| BE25A-GMC06 | 400 INVALID_REQUEST or 422 DECODER_UNSUPPORTED | Decoder version unavailable or serial shape invalid | Return unknown/unsupported state only after valid request; no identity mutation |
| BE25A-GMC06 | 404 NOT_FOUND | Gear record supplied but concealed | No record existence or owner detail |
| BE25A-GMC07 | 400 INVALID_REQUEST or 422 REFERENCE_UNSUPPORTED | Region/facts/reference version invalid | Return no-result/could-not-verify advisory state; no listing block |
| BE25A-GMC07 | 503 DEPENDENCY_UNAVAILABLE | Fitment/reference provider unavailable | dependencyClass, retryable true and retryAfterSeconds; no positive compatibility |
| All | 429 RATE_LIMITED or 500 INTERNAL_ERROR | Route quota or unclassified failure | BE00 rate headers/details; no graph, source or serial data |

### Authorization and Middleware Registry

| Operation ID | Authentication and role | Ownership/purpose predicate and 403-vs-404 | Middleware, including CORS |
|---|---|---|---|
| BE25A-GMC01 | Public bounded read; optional verified session may add authorized facets | Public catalog nodes/facets only; private contributor/source fields are excluded. No public authority failure becomes 403; concealed private filter is 404 | Route inventory/request ID; TLS/query/header limits; CORS policy gear-api with explicit web/PWA origins, no wildcard credentials, Vary Origin; optional session; strict Zod; public rate limit; graph read; response/error normalization; no-store/cache policy |
| BE25A-GMC02 | Verified session; seller with real listing/record context and catalog provisional capability | Listing/record belongs to actor or delegated party; known unauthorized context is 403, absent/concealed is 404 | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins, credential allowlist, no wildcard, Vary Origin; Supabase session; Shard 01 context; strict Zod; 23 source check; BE00 idempotency/CAS; provisional transaction/outbox; redacted audit |
| BE25A-GMC03 | Verified session; authenticated contributor with source/category standing | Subject and category are readable; safety assertion never gains suppression authority. Known unauthorized subject is 403; concealed is 404 | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins, no wildcard credentials, Vary Origin; session/context; strict Zod/schema field gate; capability/RLS; BE00 idempotency; append transaction/outbox; response/error normalization |
| BE25A-GMC04 | Verified session plus category-scoped moderator standing and recent step-up | Commercially interested moderator recuses; high-blast merge/split requires independent quorum. Known ineligible moderator is 403; concealed contribution/category is 404 | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins, credential allowlist, no wildcard, Vary Origin; session/context/step-up; strict Zod; recusal/quorum policy; BE00 idempotency/CAS; resolution RPC/outbox; audited decision |
| BE25A-GMC05 | Verified session; seller controls listing, or registered matcher/moderator capability | Bind target listing is authorized; model graph is public/current. Known actor without listing authority is 403; concealed listing is 404; candidate ambiguity is 422 after authorized read | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins, credential allowlist, no wildcard, Vary Origin; session/context; strict Zod; listing RLS; BE00 idempotency/CAS; bind transaction/outbox; normalized response |
| BE25A-GMC06 | Verified session; owner, seller or delegated decoder reader; public decoder may use no private record | Optional gearRecordId is authorized before hypothesis persistence. Known unauthorized record is 403; concealed record is 404; serial value never logs or returns | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins, no wildcard credentials, Vary Origin; session/context; strict Zod; decoder policy; BE00 idempotency; hypothesis transaction; serial scrubbing; response/error normalization |
| BE25A-GMC07 | Verified session for protected unit facts; public model/region facts may run as bounded advisory read | Private unit facts require owner/custody purpose; known unauthorized unit is 403; concealed is 404; unavailable reference is typed advisory state | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins, credential allowlist, no wildcard, Vary Origin; session/context; strict Zod; source/RLS; BE00 idempotency; evaluator transaction; normalized advisory response |

### Idempotency and Concurrency Registry

| Operation ID | Idempotency contract | Version/race handling | Atomicity and replay |
|---|---|---|---|
| BE25A-GMC01 | Key binds actor or public principal, normalized filters, cursor, limit, graph contract and route; stored for 24 hours | Graph read pins graphVersion and schema versions; a changed cursor context returns INVALID_REQUEST | Reservation and bounded result metadata replay the same body; no duplicate search side effect |
| BE25A-GMC02 | Key binds actor, context, category, proposed facts, source/evidence digest and expectedVersion | Context CAS prevents provisional model from attaching to changed listing/record; duplicate candidates do not auto-resolve | Model, assertion, audit, gear_catalog.assertion_submitted.v1 and idempotency result commit together |
| BE25A-GMC03 | Key binds actor, subject/category/field/value digest, source and expectedVersion | Subject/schema version is checked under transaction; same assertion cannot overwrite prior evidence | Append assertion, audit, event and result atomically; replay returns same assertion |
| BE25A-GMC04 | Key binds moderator, contribution, action, targets, graph version, reason digest and quorum evidence | Graph CAS serializes merge/split; recusal/quorum is evaluated against current standing | Resolution, graph version, audit, event and result commit together; pending quorum has no graph effect |
| BE25A-GMC05 | Key binds actor, listing, candidate order, selected model and expectedVersion | Listing bind CAS; catalog graph changes never rewrite claim-time or historical bind; ambiguous sibling remains unmatched | Bind, audit, gear_listing.model_bind_changed.v1 and result commit together; replay cannot add a second bind |
| BE25A-GMC06 | Key binds actor, serial input digest, decoder version, optional record and contract version | Decoder version and input digest are immutable; a later hypothesis appends instead of replacing prior evidence | Hypothesis, audit and idempotency result commit; serial plaintext is discarded after digesting |
| BE25A-GMC07 | Key binds actor, model, normalized unit facts, region, reference version and policy version | Source/reference versions are pinned; stale source returns partial/unavailable and never a positive guarantee | Advisory run, audit, optional event and replay result commit; prior findings remain immutable |

### Rate, CORS and SLO Registry

| Operation ID | Rate limit and concurrency | CORS policy | Deadline and SLO |
|---|---|---|---|
| BE25A-GMC01 | 120 requests/minute/IP, burst 30/10 seconds; authenticated actor 300/minute; max 4 concurrent searches/principal | gear-api allowlist; explicit origins, no wildcard credentials, Vary Origin, GET/OPTIONS registered only | 8 second hard deadline; p95 under 500 ms with healthy graph; unavailable returns exact retry |
| BE25A-GMC02 | 30/minute/user, 60/minute/party, burst 10/10 seconds; max 2 provisional writes/context | gear-api allowlist; explicit origins, no credential wildcard, Vary Origin | 15 second hard deadline; p95 under 1,200 ms; no external import call in transaction |
| BE25A-GMC03 | 60/minute/user, 120/minute/party, burst 20/10 seconds; max 8 assertion writes/category | gear-api allowlist; no private fields in exposed headers; OPTIONS exposes registered methods/headers | 15 second hard deadline; p95 under 1,000 ms |
| BE25A-GMC04 | 10/minute/moderator, 20/minute/category, burst 4/10 seconds; one active high-blast resolution/moderator | gear-api allowlist; explicit origins, no wildcard credentials, Vary Origin | 15 second hard deadline; p95 under 1,500 ms; quorum provider budget 1,000 ms |
| BE25A-GMC05 | 60/minute/user, 120/minute/party, burst 20/10 seconds; max 8 bind attempts/listing | gear-api allowlist; credentials only for allowlisted origins, no private response headers | 15 second hard deadline; p95 under 1,200 ms |
| BE25A-GMC06 | 30/minute/user, 60/minute/party, burst 10/10 seconds; max 2 decoder runs/record | gear-api allowlist; explicit origins, no wildcard credentials, serial value never returned in headers | 15 second hard deadline; p95 under 1,500 ms; decoder budget 3,000 ms |
| BE25A-GMC07 | 30/minute/user, 60/minute/party, burst 10/10 seconds; max 2 active evaluations/actor | gear-api allowlist; explicit origins, no wildcard credentials, Vary Origin | 15 second hard deadline; p95 under 2,000 ms; evaluator budget 3,000 ms |

### Observability Registry

| Operation ID | Trace and metrics | Audit and redaction |
|---|---|---|
| BE25A-GMC01 | Span includes operation ID, requestId, graph/schema versions, filter classes, result count, cursor state and latency. Metrics cover available/unavailable, facets, cache age, rate rejects and p95 | Public search query is normalized/bucketed; no private source, seller, serial or exact input is logged |
| BE25A-GMC02 | Span includes operation ID, context hash, category, source type, candidate count and graph version. Metrics cover provisional, duplicate review, replay and conflict | Audit actor/context hashes, source class, model digest and outcome; no factual evidence bytes or private labels |
| BE25A-GMC03 | Span includes operation ID, subject/category hashes, field class, safety flag, schema version and assertion state | Audit contributor/subject hashes, field class, source class and decision; value is digest/redacted where sensitive |
| BE25A-GMC04 | Span includes operation ID, contribution/category hashes, action, blast-radius class, moderator count, quorum and graph version | Audit moderator hashes, recusal/quorum decision, reason digest and affected count; no commercial conflict narrative |
| BE25A-GMC05 | Span includes operation ID, listing/bind hashes, candidate count, score/margin buckets, graph version and state | Audit actor/listing/model hashes, source class and outcome; no seller private text or evidence |
| BE25A-GMC06 | Span includes operation ID, hypothesis ID, input digest, decoder version, hypothesis count and state | Audit actor/record hashes, decoder version, digest and outcome; never serial plaintext or identity mutation |
| BE25A-GMC07 | Span includes operation ID, evaluation/model hashes, region class, finding dimensions, unknown coverage and source age | Audit actor/model hashes, region class, policy/reference versions and outcome; unit facts and private location are excluded |

## Database Schema

All tables are in protected schemas with enabled and forced RLS. Domain RPCs revalidate actor, acting party, category standing, source visibility and expected versions. Direct anon/authenticated table grants are denied. Search uses security-invoker public projections; mutable evidence is append-only.

### Complete Table Definitions

| Table / model | Columns with SQL type, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.catalog_model_nodes / GearMake, GearModel, ModelPeriod | id uuid NOT NULL PK DEFAULT gen_random_uuid(); node_type catalog_node_type NOT NULL CHECK IN ('make','model','period'); parent_id uuid NULL FK platform_private.catalog_model_nodes(id); category_id uuid NULL FK platform_private.catalog_schema_versions(id); name text NOT NULL CHECK char_length(name) BETWEEN 1 AND 160; aliases text[] NOT NULL DEFAULT ARRAY[]::text[] CHECK cardinality(aliases)<=100; manufacturer_name text NULL CHECK char_length(manufacturer_name)<=160; period_start date NULL; period_end date NULL CHECK period_end IS NULL OR period_end>=period_start; state catalog_node_state NOT NULL CHECK IN ('active','provisional','retired'); graph_version bigint NOT NULL CHECK graph_version>0; version bigint NOT NULL CHECK version>0; created_by uuid NULL FK auth.users(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK node_type='make' OR parent_id IS NOT NULL | PK; node_type,name; category_id,state,name; parent_id; GIN aliases; graph_version,updated_at DESC | Forced RLS. Public may read only active safe model projection; contributor may append provisional through RPC; moderator may resolve by category standing; direct table grants denied; retire/merge is audited and append-only |
| platform_private.catalog_schema_versions / CategorySchemaVersion | id uuid NOT NULL PK DEFAULT gen_random_uuid(); category_key text NOT NULL CHECK category_key ~ '^[a-z0-9_-]{1,80}$'; version bigint NOT NULL CHECK version>0; attributes jsonb NOT NULL CHECK jsonb_typeof(attributes)='object'; flaw_options jsonb NOT NULL CHECK jsonb_typeof(flaw_options)='array'; component_set jsonb NOT NULL CHECK jsonb_typeof(component_set)='array'; consequence_classes jsonb NOT NULL CHECK jsonb_typeof(consequence_classes)='array'; grade_definition jsonb NOT NULL CHECK jsonb_typeof(grade_definition)='object'; status schema_status NOT NULL CHECK IN ('draft','active','retired'); created_by uuid NULL FK auth.users(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); UNIQUE category_key,version; UNIQUE category_key,status where status='active' | PK; category_key,status,version DESC; status,updated_at DESC | Forced RLS. Public reads active schema projection; contributors validate through schema RPC; moderators publish/retire with category standing and quorum; direct grants denied |
| platform_private.catalog_assertions / CatalogAssertion | id uuid NOT NULL PK DEFAULT gen_random_uuid(); subject_id uuid NOT NULL FK platform_private.catalog_model_nodes(id); category_id uuid NOT NULL FK platform_private.catalog_schema_versions(id); field text NOT NULL CHECK char_length(field) BETWEEN 1 AND 120; value jsonb NOT NULL; source_type catalog_source_type NOT NULL CHECK IN ('seller_assertion','licensed_import','manufacturer_authorized','community'); source_ref text NULL CHECK char_length(source_ref)<=256; evidence_digest bytea NULL CHECK octet_length(evidence_digest)=32; contributor_id uuid NOT NULL FK auth.users(id); confidence numeric(9,6) NOT NULL DEFAULT 0 CHECK confidence BETWEEN 0 AND 1; safety_relevant boolean NOT NULL DEFAULT false; status assertion_status NOT NULL CHECK IN ('unverified','corroborating','accepted','superseded'); supersedes_id uuid NULL FK platform_private.catalog_assertions(id); source_state source_state NOT NULL CHECK IN ('known','unknown','withheld','not_applicable'); version bigint NOT NULL CHECK version>0; correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); UNIQUE subject_id,field,version | PK; subject_id,field,created_at DESC; category_id,status,created_at DESC; contributor_id,created_at DESC; evidence_digest; partial safety_relevant, status where safety_relevant=true | Forced RLS. Contributor inserts through field/schema RPC; public sees accepted safe facts only; moderator reads bounded category evidence; UPDATE/DELETE denied; supersession appends |
| platform_private.catalog_resolutions / CatalogResolution | id uuid NOT NULL PK DEFAULT gen_random_uuid(); contribution_id uuid NOT NULL FK platform_private.catalog_assertions(id); category_id uuid NOT NULL FK platform_private.catalog_schema_versions(id); action resolution_action NOT NULL CHECK IN ('accept','reject','merge','split','alias','rename'); affected_ids uuid[] NOT NULL CHECK cardinality(affected_ids) BETWEEN 1 AND 20; prior_graph_version bigint NOT NULL CHECK prior_graph_version>0; graph_version bigint NOT NULL CHECK graph_version>prior_graph_version; reason text NOT NULL CHECK char_length(reason) BETWEEN 1 AND 2000; moderator_ids uuid[] NOT NULL CHECK cardinality(moderator_ids)>=1; quorum_digest bytea NOT NULL CHECK octet_length(quorum_digest)=32; recusal_confirmed boolean NOT NULL CHECK recusal_confirmed=true; state resolution_state NOT NULL CHECK IN ('applied','pending_quorum','rejected'); reversible boolean NOT NULL DEFAULT true CHECK reversible=true; version bigint NOT NULL CHECK version>0; correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); UNIQUE category_id,graph_version | PK; category_id,created_at DESC; contribution_id; graph_version; GIN affected_ids | Forced RLS. Category moderators read/write through quorum RPC; pending rows visible only to eligible moderators; public reads current graph projection; direct UPDATE/DELETE denied |
| platform_private.serial_decode_hypotheses / SerialDecodeHypothesis | id uuid NOT NULL PK DEFAULT gen_random_uuid(); input_digest bytea NOT NULL CHECK octet_length(input_digest)=32; decoder_version bigint NOT NULL CHECK decoder_version>0; gear_record_id uuid NULL FK platform_private.gear_records(id); candidates jsonb NOT NULL CHECK jsonb_typeof(candidates)='array'; confidence numeric(9,6) NOT NULL CHECK confidence BETWEEN 0 AND 1; state decode_state NOT NULL CHECK IN ('hypotheses','unknown','unsupported','ambiguous'); source_type decode_source_type NOT NULL CHECK IN ('decoder','user_input','licensed_reference'); actor_id uuid NOT NULL FK auth.users(id); source_state source_state NOT NULL CHECK IN ('known','unknown','withheld','not_applicable'); version bigint NOT NULL CHECK version>0; correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); UNIQUE input_digest,decoder_version,actor_id | PK; input_digest; gear_record_id,created_at DESC; state,created_at DESC; actor_id,created_at DESC | Forced RLS. Actor reads own authorized hypotheses; owner/authorized party reads record-bound evidence; decoder worker inserts through lease RPC; no public serial/decode raw input; direct grants denied |
| platform_private.listing_model_binds / ListingModelBind | id uuid NOT NULL PK DEFAULT gen_random_uuid(); listing_id uuid NOT NULL FK platform_private.listings(id); model_id uuid NULL FK platform_private.catalog_model_nodes(id); source bind_source NOT NULL CHECK IN ('seller','moderator','matcher','none'); confidence numeric(9,6) NULL CHECK confidence IS NULL OR confidence BETWEEN 0 AND 1; margin numeric(9,6) NULL CHECK margin IS NULL OR margin BETWEEN 0 AND 1; state bind_state NOT NULL CHECK IN ('unmatched','suggested','confirmed','auto_bound','disputed','unbound'); graph_version bigint NOT NULL CHECK graph_version>0; listing_version bigint NOT NULL CHECK listing_version>0; actor_id uuid NOT NULL FK auth.users(id); version bigint NOT NULL CHECK version>0; correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); CHECK (state='unmatched' AND model_id IS NULL) OR (state<>'unmatched' AND model_id IS NOT NULL) | PK; listing_id,created_at DESC; listing_id,state,created_at DESC; model_id,created_at DESC; graph_version; partial listing_id where state IN ('confirmed','auto_bound') | Forced RLS. Listing controller or registered matcher writes through bind RPC; public reads safe model label only; historical rows immutable; direct grants denied |
| platform_private.fitment_evaluations / FitmentEvaluation | id uuid NOT NULL PK DEFAULT gen_random_uuid(); model_id uuid NOT NULL FK platform_private.catalog_model_nodes(id); unit_facts jsonb NOT NULL CHECK jsonb_typeof(unit_facts)='object'; region_code text NOT NULL CHECK region_code ~ '^[A-Z]{2}(-[A-Z0-9]{1,8})?$'; reference_version bigint NULL CHECK reference_version IS NULL OR reference_version>0; findings jsonb NOT NULL CHECK jsonb_typeof(findings)='array'; unknown_coverage numeric(9,6) NOT NULL CHECK unknown_coverage BETWEEN 0 AND 1; state evaluation_state NOT NULL CHECK IN ('complete','partial','unavailable'); blocks_listing boolean NOT NULL DEFAULT false CHECK blocks_listing=false; actor_id uuid NOT NULL FK auth.users(id); version bigint NOT NULL CHECK version>0; correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); UNIQUE model_id,region_code,reference_version,actor_id,created_at | PK; model_id,region_code,created_at DESC; state,created_at DESC; actor_id,created_at DESC | Forced RLS. Actor reads own protected evaluation; public model/region evaluation may use safe projection; evaluator inserts through named RPC; no booking/listing mutation; direct grants denied |

The listing FK targets platform_private.listings, an owned 25b relation. Shard 23 platform_private.gear_records remains the identity source. All JSON fields are parsed against the corresponding strict contract before persistence.

### Index and Constraint Invariants

| Invariant | Enforcement |
|---|---|
| One active category schema | Unique category_key/status partial index and moderator publish RPC |
| Model graph reversibility | CatalogResolution stores prior/new graph versions and affected IDs; no bind-time row is rewritten |
| Assertion provenance | Source type, contributor, confidence, evidence digest, status and supersession are mandatory or explicitly null |
| Unmatched legality | ListingModelBind allows unmatched with modelId null; no match is required to continue listing publication |
| Sibling ambiguity | Known ambiguity prevents auto_bound even when score is high; seller/moderator may choose confirmed with attribution |
| Serial safety | Only input digest is persisted; raw serial is discarded after validation and hypothesis generation |
| Advisory fitment | blocks_listing is database-constrained false; unknown/no-result/could-not-verify remain explicit |
| Public privacy | Public projections omit source refs, evidence, contributor, private unit facts and serial/decode input |

### Permission and RLS Matrix

| Model | Anonymous | Authenticated contributor/seller | Moderator/matcher | Queue/operator |
|---|---|---|---|---|
| GearMake/GearModel/ModelPeriod | active safe projection only | read current graph; provisional insert only in real context | category-scoped graph resolution | graph rebuild by lease |
| CategorySchemaVersion | active schema projection | validate fields only | category standing and quorum | schema cache refresh |
| CatalogAssertion | accepted safe facts only | append own attributed assertion | bounded category evidence and decision | no direct mutation |
| CatalogResolution | current graph projection | no write | eligible category moderator with recusal/quorum | graph projection rebuild |
| SerialDecodeHypothesis | deny | own/authorized record-bound evidence | bounded review evidence | decoder lease insert |
| ListingModelBind | safe model label only | listing controller write | registered matcher/moderator write | invalidation read |
| FitmentEvaluation | safe advisory for public facts | protected unit read | bounded review | evaluator lease |

RLS policies repeat Shard 01 acting-party resolution and source predicates. The service role has no ordinary browser authorization. Realtime carries IDs, versions and state hints only.

## Middleware & Policies

### Hono Order and Security

1. Route inventory assigns the operation ID and rejects method/path mismatch.
2. Transport validates or replaces X-Request-Id, starts trace/correlation, enforces TLS/security headers, query/body/header ceilings and CORS policy gear-api. OPTIONS exposes only registered methods and headers.
3. Public search may proceed without a session; all protected operations verify a Supabase session before context resolution.
4. Shard 01 resolves acting party, seller/listing authority, contributor standing, moderator standing and purpose. JWT metadata cannot create role.
5. Strict Zod validates query/path/header/body before target lookup; unknown keys, invalid Unicode and non-finite values fail closed.
6. Catalog policy checks schema version, source license class, category field, commercial recusal, quorum, listing authority and graph/version predicates.
7. BE00 idempotency and CAS reserve and mutate in one PostgreSQL transaction with audit/outbox. No decoder/evaluator provider call is inside the write transaction.
8. Success is parsed again; ETag is a strong quoted decimal version; all errors use BE00 ApiError.
9. Structured logs, metrics and audit close with digests/redaction. Queue dispatch is after commit; expired leases are swept.

### Policy Rules

| Policy | Enforced behavior |
|---|---|
| Licensed catalog seed | Only licensed/manufacturer-authorized factual imports or attributed community contributions enter the graph; unauthorized scraping is rejected |
| Description authority | Description is a tie-break signal only; it never creates canonical identity or resolves a known sibling |
| Automation limit | Automation may rank candidates and propose duplicates/anomalies; only attributed seller/moderator action or eligible high-confidence/high-margin policy may bind |
| Moderation recusal | Commercially interested moderator cannot resolve; high-blast merge/split requires two independent category-eligible moderators |
| Reversible graph | Merge/split/alias/rename changes current graph but preserves bind-time graph versions and supports unmerge |
| Decode separation | Serial/date is a hypothesis with source/confidence/alternatives; no identity registration or ownership mutation |
| Advisory fitment | Findings, no-result, could-not-verify and unknown coverage are explicit; no booking or listing block |
| Unmatched publication | Listing may remain unmatched; no fabricated candidate or forced provisional model |

## Data Flow

### 25.01 Search/browse catalog

1. Validate bounded filters, cursor, limit and idempotency key.
2. Resolve public graph version and active category schema versions; do not expose private assertions.
3. Query security-invoker model/facet projection using deterministic sort and cursor binding.
4. Return models, aliases, facets, graph/schema versions and retry state. Search dependency failure returns unavailable, never an invented model.

### 25.02 Create provisional model inline

1. Validate that listingId or gearRecordId context exists and is authorized.
2. Resolve category schema and reject unsupported fields before mutation.
3. Reserve idempotency and lock the context version.
4. Insert provisional model node and attributed assertion in one transaction. Detect duplicate candidates without auto-merging.
5. Emit gear_catalog.assertion_submitted.v1 and return reversible resolution state. Listing remains free to stay unmatched.

### 25.03 Contribute catalog fact

1. Validate category schema, field, value and source/evidence class.
2. Resolve contributor standing and subject visibility.
3. Reserve idempotency and append CatalogAssertion with confidence/status.
4. Compute corroboration as a derived fact only; safetyRelevant assertions cannot suppress existing warnings.
5. Emit gear_catalog.assertion_submitted.v1 and retain prior assertions.

### 25.04 Moderate catalog change

1. Validate action, category, contribution, targets, reason and expected graph version.
2. Resolve category standing, commercial recusal and blast-radius quorum.
3. If quorum is absent, persist no graph mutation and return pending_quorum.
4. CAS graph version and append CatalogResolution. Current projections update only after commit.
5. Emit gear_catalog.resolution_changed.v1; bind-time snapshots retain the prior graph and unmerge remains possible.

### 25.05 Match listing to model

1. Validate listing/version and candidate list. Rank title, structured attributes, seller-SKU memory and sibling graph; description is tie-break only.
2. Authorize listing actor and candidate graph.
3. Reject auto-bind across known ambiguity siblings; require seller/moderator confirmation or high-confidence/high-margin rule.
4. CAS ListingModelBind and preserve prior bind evidence.
5. Emit gear_listing.model_bind_changed.v1. Ambiguous or unavailable candidate data returns unmatched and publicationMayContinue true.

### 25.06 Decode serial/date

1. Validate serial value in memory, decoder version and optional authorized record.
2. Hash serial input immediately; load the versioned decoder/reference.
3. Generate ordered hypotheses with source, confidence and alternatives; unsupported or ambiguous input creates unknown state.
4. Persist only digest/candidates and emit no identity mutation event. Scrub serial from logs, errors, jobs and queue payload.

### 25.07 Evaluate fitment/voltage

1. Validate model, normalized unit facts, region and reference version.
2. Authorize private unit facts and load versioned reference data.
3. Evaluate fitment and voltage independently; preserve unknown coverage and no-result distinction.
4. Persist immutable advisory evidence with blocks_listing false. A reference timeout returns unavailable or partial state and never a positive guarantee.

## State Machines, Concurrency and Failure Recovery

### Catalog graph and assertions

| State | Allowed transition | Guard and recovery |
|---|---|---|
| provisional model | provisional to resolved | Moderator resolution or confirmed graph merge with source evidence |
| provisional model | provisional to unmatched | Duplicate/unsupported path; listing continues |
| assertion | unverified to corroborating | Independent compatible assertion arrives; no overwrite |
| assertion | corroborating to accepted | Moderator/schema policy accepts; prior evidence remains |
| assertion | any nonterminal to superseded | New assertion explicitly cites prior ID |
| resolution | pending_quorum to applied | Required independent category quorum and recusal pass |
| resolution | pending_quorum to rejected | Quorum/field/policy failure recorded |

### ListingModelBind

| State | Allowed transition | Guard and recovery |
|---|---|---|
| unmatched | unmatched to suggested | Candidate graph available; no identity claim |
| suggested | suggested to confirmed | Seller/moderator selection with authorized listing version |
| suggested | suggested to auto_bound | High confidence and high margin, no known sibling ambiguity |
| confirmed/auto_bound | to disputed | New material evidence or graph conflict |
| disputed | disputed to confirmed/unbound | Attributed resolution; historical bind remains |
| any published state | to unbound | Reversible graph/identity change; listing remains historical |

### Advisory and race matrix

| Scenario | Detection | Recovery |
|---|---|---|
| Catalog merge while buyer claims | Graph version differs from bind/claim snapshot | Claim retains pre-merge bind; display may follow current graph |
| Two plausible sibling models | Ambiguity sibling flag or margin below threshold | Keep unmatched, show discriminating fields and request explicit choice |
| Moderator commercial conflict | Party relationship/recusal check | Reject action or leave pending; no role override |
| Search graph outage | Projection timeout/circuit | Return unavailable/retry; no stale fabricated models |
| Decoder unavailable | Decoder registry miss/timeout | Persist unknown/unsupported only; no identity mutation |
| Fitment provider timeout | Bounded evaluator budget | Store partial/unavailable; no warning suppression or booking block |
| Assertion races schema change | Schema version CAS | Reject stale field write; contributor resubmits against current schema |
| Queue crash after commit | Outbox lease expiry | Sweeper retries event ID; consumer dedupes and refetches |
| Same key concurrent write | BE00 unique actor/operation/key hash | One commit; matching replay; changed body mismatch |

## External Seams

Each adapter has exact request/response, timeout, retry count/backoff and circuit behavior. Raw serial/evidence bytes never cross a queue or provider boundary.

| Seam | Exact request | Exact response | Timeout, retry and circuit |
|---|---|---|---|
| BE00 command admission | operationId, actorId, actingPartyId, targetHash, requestHash, idempotencyKeyHash, expectedVersion and correlationId | reserved reservation, replay status/body hash or IDEMPOTENCY_MISMATCH | 500 ms; 2 retries at 25 ms and 100 ms for connection reset only; open after 5 failures/30 s, half-open 15 s; open maps DEPENDENCY_UNAVAILABLE |
| Shard 01 acting context | session subject, requested party, capability, category/listing target and purpose | actor/party, standing class, mandate, context version, decision and concealment flag | 800 ms; 2 retries at 50 ms and 150 ms for transport failures; open after 5/30 s, half-open 15 s; fail closed |
| Shard 23 identity projection | gearRecordIds, source version, actingPartyId, purpose and requested safe fields | canonical identity ID, owner relation, source version, safe label, availability and theft state class | 1,200 ms; 2 retries at 50 ms and 200 ms for read-only reset; open after 5/30 s, half-open 20 s; typed unknown on open |
| Shard 06 trust/safety signal | subject/listing hash, assertion class, source version and purpose | risk/authenticity decision class, restriction state, policy version and reason code | 1,000 ms; 2 retries at 50 ms and 150 ms before decision; open after 5/30 s, half-open 15 s; no catalog authority on open |
| Licensed catalog provider | provider batch ID, category mapping version, source/license digest, field map and correlationId | normalized model/assertion rows, provenance digest, license window, rejected row classes | 2,500 ms; 1 retry at 200 ms before admission; open after 5/60 s, half-open 30 s; no rows admitted on ambiguous response |
| Versioned decoder | decoderVersion, inputDigest, bounded serial in process memory, reference version and correlationId | ordered hypotheses, confidence, source class and decoder result state | 3,000 ms; 1 retry at 100 ms before decode starts; open after 5/60 s, half-open 30 s; timeout returns unsupported/unknown |
| Fitment/reference evaluator | evaluatorVersion, modelVersion, normalized unit facts, regionCode, referenceVersion and correlationId | findings by fitment/voltage, unknown coverage, source age and evaluator state | 3,000 ms; 1 retry at 100 ms before evaluation starts; open after 5/60 s, half-open 30 s; timeout returns partial/unavailable |
| BE00 outbox/Queue lease | eventId, eventType, aggregateId/version, payload digest and lease token | accepted queue ID or lease result | 500 ms; 2 retries at 25 ms and 100 ms; open after 5/30 s, half-open 15 s; committed event remains for sweeper |

No provider call runs inside a canonical catalog write transaction. Ambiguous provider outcomes remain pending/unknown and reuse the same idempotency key.

## Events and Async Consumers

### Event envelope

| Event type | Required payload | Emission rule |
|---|---|---|
| gear_catalog.assertion_submitted.v1 | assertion/model/field/source/status, actor hash and version | GHO02/GHO03 insert transactionally |
| gear_catalog.resolution_changed.v1 | affected IDs, action, prior/new graph versions, quorum and actor hash | GHO04 inserts with graph CAS |
| gear_listing.model_bind_changed.v1 | listing/bind, prior/new model/state, source class and version | GHO05 inserts with bind CAS |

### Consumer obligations

| Consumer | Event/input | Required behavior |
|---|---|---|
| Catalog graph projector | gear_catalog.assertion_submitted.v1, gear_catalog.resolution_changed.v1 | Rebuild current safe graph idempotently; preserve prior graph versions |
| Listing matcher | gear_listing.published.v1, gear_listing.disclosure_changed.v1, gear_listing.state_changed.v1 | Schedule/rerun matching with pinned listing/schema versions; never auto-bind siblings |
| Disclosure baseline | gear_listing.model_bind_changed.v1 | 25b revalidates category schema and grade/flaw options; no disclosure mutation here |
| Trust/safety consumer | gear_catalog.assertion_submitted.v1, gear_listing.model_bind_changed.v1 | Evaluate risk signals; safety case remains Shard 06 authority |
| Search/facet projection | all catalog graph events | Publish safe labels/aliases/facets after versioned rebuild; no private assertion |
| Market guide invalidation | gear_listing.model_bind_changed.v1, gear_market.guide_recomputed.v1 | Recompute bucket eligibility without changing historical comp bind |

Consumers lease work, dedupe by eventId/aggregateVersion, re-read canonical rows under RLS and acknowledge only after durable projection. Failed work remains retryable with bounded backoff.

## Error Handling

### Boundary Matrix

| Operation ID | Boundary | Required result |
|---|---|---|
| BE25A-GMC01 | Public transport/query | 400 INVALID_REQUEST or 422 VALIDATION_FAILED in BE00 ErrorResponse; no graph lookup on invalid input |
| BE25A-GMC02 | Context/authority | 403 known unauthorized or 404 concealed context; no provisional mutation |
| BE25A-GMC03 | Schema/source | 422 unsupported/unverified assertion; append remains untrusted |
| BE25A-GMC04 | Moderator/quorum | 403 standing/recusal or pending quorum; no graph mutation without quorum |
| BE25A-GMC05 | Candidate/version | 409 stale or 422 ambiguous; listing stays unmatched and may publish |
| BE25A-GMC06 | Decoder | 201 unknown/unsupported hypothesis or 422 invalid input; no identity mutation |
| BE25A-GMC07 | Evaluator | 201 partial/unavailable advisory or 503 dependency; no positive guarantee/block |
| All | Quota/system | 429, 502/503 or 500 with BE00 ErrorResponse and no source/private payload |

### Error invariants

- Every handler returns ErrorResponse containing BE00 ApiError { code, message, requestId, details } and no alternate failure shape.
- NOT_FOUND details are empty for concealed resources; FORBIDDEN includes only safe reason/recovery codes.
- Catalog description, serial hypothesis, fitment result or high score never becomes canonical identity without Shard 23 authority.
- Safety/compliance assertions remain unverified until their own decision path; no assertion suppresses a warning by itself.
- Search, decoder and evaluator unavailable states are explicit. No fallback invents a match, identity, compatibility or warning clearance.
- Transaction rollback produces no assertion/resolution/bind/evaluation event. Provider ambiguity produces pending/unknown evidence only.
- Raw serial, evidence bytes, private attributes and commercial conflict details are scrubbed from errors, logs, events and realtime.

## Testing Strategy

### Contract and route tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25A-CON-001 | BE25A-GMC01 | Strict filter/cursor schema rejects unknown keys, invalid UUID/version, unsafe Unicode and limits; graph/schema versions are required in success |
| BE25A-CON-002 | BE25A-GMC02, BE25A-GMC03 | Context/source/assertion schemas reject absent real context, unsupported fields, unsafe values and unbounded JSON |
| BE25A-CON-003 | BE25A-GMC04, BE25A-GMC05 | Resolution/bind schemas require action/quorum or candidate state and preserve reversible state |
| BE25A-CON-004 | BE25A-GMC06, BE25A-GMC07 | Decode/fitment contracts preserve digest, alternatives, unknown coverage and no-block advisory behavior |
| BE25A-ROUTE-001 | All | Only seven route registry paths dispatch; wrong method, undocumented path and duplicate operation ID fail |
| BE25A-ERR-001 | All | Every failure parses as ErrorResponse with BE00 ApiError { code, message, requestId, details }; generic RFC extras fail |

### Authorization and privacy tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25A-AUTH-001 | BE25A-GMC01 | Anonymous public browse sees active safe nodes/facets only; private source fields never appear |
| BE25A-AUTH-002 | BE25A-GMC02, BE25A-GMC03 | Correct seller/contributor context succeeds; wrong valid user is 403; concealed source is 404 |
| BE25A-AUTH-003 | BE25A-GMC04 | Category moderator standing, commercial recusal, independent quorum and step-up are enforced |
| BE25A-AUTH-004 | BE25A-GMC05 | Listing controller/matcher authority is enforced; hidden listing is 404; model graph cannot grant listing edit |
| BE25A-AUTH-005 | BE25A-GMC06, BE25A-GMC07 | Record-bound decoder/facts require purpose; serial and unit facts do not leak |
| BE25A-PRIV-001 | All | Serial plaintext, evidence bytes, private attributes, seller text, commercial conflict and source license payload never leak |
| BE25A-CORS-001 | All | CORS policy gear-api allowlist, no wildcard credentials, Vary Origin and method/header exposure are verified |

### Persistence, idempotency and concurrency tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25A-DB-001 | All | Migrations cover SQL types, nullability, CHECK/FK/unique/index definitions, forced RLS, security-invoker projections and denied direct grants |
| BE25A-DB-002 | BE25A-GMC02, BE25A-GMC03 | Concurrent context/assertion writes serialize by expected version and retain all evidence |
| BE25A-DB-003 | BE25A-GMC04, BE25A-GMC05 | Graph/bind CAS prevents stale resolution or duplicate bind; prior versions remain |
| BE25A-DB-004 | BE25A-GMC06, BE25A-GMC07 | Hypothesis/evaluation snapshots are immutable and source/reference versions are pinned |
| BE25A-IDEM-001 | All | Same key/body replays exact result; same key/different body conflicts; rollback leaves no reservation |
| BE25A-RLS-001 | All | Anonymous/private boundary, wrong party, forged acting party, revoked moderator, service credential misuse and over-disclosure are denied |

### Domain and seam tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25A-DOM-001 | BE25A-GMC01, BE25A-GMC02 | Unmatched and provisional flows preserve listing continuity and never fabricate identity |
| BE25A-DOM-002 | BE25A-GMC03, BE25A-GMC04 | Assertion provenance, recusal, quorum, merge/split reversibility and safety non-suppression are deterministic |
| BE25A-DOM-003 | BE25A-GMC05 | Candidate score/margin, sibling ambiguity and reversible bind state are deterministic |
| BE25A-DOM-004 | BE25A-GMC06, BE25A-GMC07 | Decoder hypotheses, source confidence, fitment/voltage no-result and unknown coverage are deterministic |
| BE25A-SEAM-001 | All | BE00, Shard 01, Shard 06, Shard 23, licensed provider, decoder and evaluator adapters honor exact request/response, timeout, retries and circuits |
| BE25A-FAIL-001 | All | Graph outage, provider ambiguity, queue crash, lease expiry and committed-disconnected replay recover without duplicate or fabricated state |

### Event, recovery and accessibility-support tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE25A-EVT-001 | BE25A-GMC02, BE25A-GMC03, BE25A-GMC04, BE25A-GMC05 | Exact catalog/resolution/bind event names, envelope, aggregate versions, redaction and transactional outbox are verified |
| BE25A-EVT-002 | All | Consumers dedupe event IDs, refetch canonical version and never strengthen identity, safety or confidence |
| BE25A-REC-001 | All | Restore fence validates graph, assertion, bind, idempotency, outbox and RLS integrity before activation |
| BE25A-A11Y-001 | BE25A-GMC01, BE25A-GMC05, BE25A-GMC07 | Facets, discriminating attributes, confidence, unmatched choice and advisory findings have text equivalents and no color-only state |
| BE25A-PERF-001 | All | Search/read and command deadlines, body/collection caps, rate headers and provider budgets are measured under concurrency |

## Deepening Passes

| Pass | Result | Evidence |
|---|---|---|
| 1. Source classification | PASS | 25.01–25.07 are the complete catalog authority/matching boundary from IA lines 53–59 and 79–85 |
| 2. Contract completeness | PASS | Seven routes, strict request/success contracts, graph/schema versions, unknown states and BE00 envelope are present |
| 3. Authorization | PASS | Public read, contributor, seller, moderator, matcher and record-purpose predicates include 403 versus 404 |
| 4. Privacy and provenance | PASS | Serial digest-only storage, licensed source restrictions, assertion attribution and Shard 23 identity boundary are explicit |
| 5. Persistence | PASS | Seven domain tables list SQL types, nullability, constraints, FK targets, indexes, forced RLS and grants |
| 6. Concurrency | PASS | Graph/bind CAS, append-only evidence, idempotency and queue lease recovery are deterministic |
| 7. External seams | PASS | Every seam names exact request/response, timeout, retry count/backoff and circuit behavior |
| 8. Events | PASS | Exact catalog/resolution/bind events and platform envelope map to producers and idempotent consumers |
| 9. Failure recovery | PASS | Unmatched, pending, unknown, unavailable and advisory outcomes prevent fabricated identity or compatibility |
| 10. Accessibility and operations | PASS | Text-first facets/advisories, observability, restore, rate and performance tests are specified |

## Ambiguity Gate

**PASS.** Evidence: IA interaction IDs 25.01–25.07 each map to exactly one route and operation ID; GearMake, GearModel, ModelPeriod, CategorySchemaVersion, CatalogAssertion, CatalogResolution, SerialDecodeHypothesis and ListingModelBind ownership is explicit; graph merges remain reversible; unmatched is publishable; serial decoding cannot mutate Shard 23 identity; fitment/voltage is advisory and non-blocking; licensed source, moderator recusal/quorum, authorization, persistence, seam and failure branches are filled.

## Open Questions

None

## Dependency References

- Derives from [BE-00 platform contracts](00-infrastructure.md), including strict Zod/error rules, idempotency_records, outbox lease, forced RLS, CORS and route archetypes.
- Consumes [BE-23a identity and transfer contracts](23a-gear-identity-claims-transfers.md) for canonical gear_records and owner/provenance evidence; catalog facts never mutate identity.
- Consumes [BE-23b theft screening](23b-theft-screening-recovery.md) for screening status class; a catalog match never accuses or clears theft.
- Supplies catalog schema/model/bind versions to 25b listing truth and 25c inventory; those companions own listing/disclosure/claim state.
- Supplies model/condition/originality bucket context to 25d market guides; this companion does not compute prices.
- Consumes 24d custody/grants only when a downstream listing flow checks authority; matching itself never infers custody or sale rights.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Added BE25A-GMC01 through BE25A-GMC07 for catalog search, provisional models, attributed assertions, moderated resolutions, reversible model binding, serial/date hypotheses and advisory fitment/voltage evidence with strict contracts, persistence, RLS, seams, events, tests and ambiguity evidence | /write-be-spec |
