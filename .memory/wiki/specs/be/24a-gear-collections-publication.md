# BE-24a — Gear Collections and Safe Publication

Status: Complete

This specification turns IA Shard 24 interactions 24.01 and 24.02 into one
bounded collection projection read and one safe publication command. It owns
CollectionProjection and PublicGearProjection, including per-item visibility,
former-ownership separation, safe media rendition, composed-exposure
acknowledgement and publication versioning. It composes Shard 23 gear identity
without exposing serials, exact location, private value or hidden-history
counts, and it never grants ownership, custody, sale or booking authority.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Classification | Multi-domain split, personal collection and item-publication subdomain | BE index line 41 assigns 24a to collections/publication; IA interaction table lines 66-69 assigns 24.01 and 24.02. |
| Backend surface | Authenticated Hono REST projection and publication command, protected media references, exposure policy evaluation, Supabase RPCs and transactional outbox | IA Contracts lines 89-95 and Access Control lines 149-163; BE00 Middleware lines 253-297 and Events lines 357-415. |
| Canonical owner | 24a owns CollectionProjection and PublicGearProjection, per-item visibility, safe rendition references and publication/exposure acknowledgement state | IA Data Models lines 109-120 and Typed Field Registry lines 127-145. |
| Consumed boundaries | Shard 23 gear_record, gear_identity_key, gear_claim and bounded provenance; Shard 01 party/entity/acting context; BE00 objects, policies, idempotency, audit and outbox | IA Cross-Domain Contracts lines 101-107, Access Control lines 149-163 and Cross-Shard Map lines 249-256. |
| Explicit non-ownership | Rigs/compatibility/export, organisation registers/condition, custody/cases/manifests remain 24b, 24c and 24d; identity and title remain Shard 23 | IA Scope Reconciliation lines 11-20 and interactions lines 68-83. |
| Split validity | PASS: collection projection and item publication share visibility and exposure policy, with no rig, condition, custody or logistics interaction split into 24a | Approved BE index split plus IA interaction Preconditions, Required behavior, Completion and Failure / recovery lines 47-48 and 68-69. |

## Referenced Material Inventory

| Source file | Section and lines | Material consumed |
|---|---|---|
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Overview lines 7-9 | Collection views and public item visibility owned by Shard 24; composition over Shard 23. |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Scope Reconciliation lines 11-20 | Personal collection/publication boundary versus rigs, registers, custody and logistics. |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Holdings Decisions lines 22-35 | Private-by-default visibility, composed exposure warning and no public serial/value/location. |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Acceptance Criteria lines 47-48 | AC-24.01 and AC-24.02 validation, acting context, authorization, revision, idempotency and failure behavior. |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Interactions lines 68-69 | Exact 24.01 view-collection and 24.02 publish-item source truth. |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Command Contracts lines 87-95 | PublishCollectionItem command fields and safe-audience invariants. |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Cross-Domain Contracts lines 101-107 | Shard 23 ownership and downstream venue/commerce boundaries. |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Data Models lines 109-126 | CollectionProjection and PublicGearProjection fields and derived-view rules. |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Typed Field Registry lines 127-145 | Deterministic SQL typing, core fields, cardinality and projection constraints. |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Access Control lines 147-174 | Owner/controller, holder, entity staff and public visibility capabilities. |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Event Schemas lines 186-201 | Collection publication event envelope and safe consumer behavior. |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Edge Cases lines 203-218 | Composed physical risk, serial-in-media, privacy failure and stale projection outcomes. |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Dependency References lines 220-226 and Cross-Shard Map lines 249-256 | Shard 23, 25, 26, 29, 32 and 34 direction/ownership. |
| .memory/wiki/specs/ia/deep-dives/24-gear-holdings-operations.md | Publication and Exposure Algorithm lines 12-20 | Safe rendition, composed exposure, warning acknowledgement and atomic publication. |
| .memory/wiki/specs/ia/deep-dives/24-gear-holdings-operations.md | Snapshot Contract lines 52-57 | Versioned projection, known/unknown/withheld labels and readiness semantics. |
| .memory/wiki/specs/ia/deep-dives/24-gear-holdings-operations.md | Disclosure Matrix lines 83-98 | Public/holder/controller data limits, rendition immutability and revocation. |
| .memory/wiki/specs/ia/deep-dives/24-gear-holdings-operations.md | Implementation Envelope lines 143-149 | Supabase/RLS, typed Hono/Zod commands, queue/outbox and failure handling. |
| .memory/wiki/specs/be/00-infrastructure.md | Zod Contracts lines 112-200 | Strict Zod 4 objects, ApiError four-field envelope, details limits and response headers. |
| .memory/wiki/specs/be/00-infrastructure.md | Database Schema lines 202-251 | platform_private boundary, forced RLS, RPC-only access, idempotency, audit and outbox. |
| .memory/wiki/specs/be/00-infrastructure.md | Middleware lines 253-297 | Middleware order, CORS, authentication, acting context, capability and concurrency rules. |
| .memory/wiki/specs/be/00-infrastructure.md | Events lines 357-415 | Outbox envelope, leasing, retry and consumer recovery. |
| .memory/wiki/specs/be/00-infrastructure.md | Error and Observability lines 416-461 | Boundary mapping, compensation, structured audit, metrics, traces and redaction. |
| .memory/wiki/specs/be/00-infrastructure.md | Testing Strategy lines 476-505 | Contract, RLS, policy, media, idempotency and recovery obligations. |
| Repository path check | Requested 24-gear-collections.md | Alias absent; 24-gear-holdings-operations.md is the sole matching canonical IA source. |

## IA Source Map

### Assigned interactions

| IA ID | Source trace | Backend realization | Completion and non-negotiable recovery |
|---|---|---|---|
| 24.01 | IA 24-gear-holdings-operations.md lines 47 and 68; deep dive Snapshot Contract lines 52-57 | BE24A-GHO01 returns an authorized collection projection separated into current and formerly owned records, with optional private aggregate and preserved filters. | Returns one coherent current projection or an explicit unavailable state with retry metadata; never falls back to a partial public projection. |
| 24.02 | IA 24-gear-holdings-operations.md lines 48 and 69; deep dive Publication and Exposure Algorithm lines 12-20 | BE24A-GHO02 verifies item authority, safe media rendition and composed-exposure evaluator acknowledgement before activating public projection. | Returns public-safe projection/version or typed blocked state; missing rendition, authority, policy result or current acknowledgement cannot activate publication. |

### Canonical Data Models

| IA model name | 24a relationship and ownership |
|---|---|
| CollectionProjection | Canonical 24a derived collection view with current/former records, item visibility and private aggregate. |
| PublicGearProjection | Canonical 24a safe item publication projection and exposure acknowledgement state. |
| Rig | Owned by 24b; 24a does not expose rig membership through a collection route. |
| RigVersion | Owned by 24b; only bounded references may be consumed by downstream projections. |
| RigMember | Owned by 24b; member identity and owner details never enter public collection output. |
| CompatibilityRun | Owned by 24b; no compatibility result is implied by publication. |
| RegisterLine | Owned by 24c; collection does not expose organisation quantity/identity register internals. |
| ConditionReport | Owned by 24c; known condition cannot be hidden if a downstream publication composes it. |
| PublicBacklineProjection | Owned by 24c; public collection publication is separate from room/backline projection. |
| CustodyInterval | Owned by 24d; possession does not grant collection publication authority. |
| CustodyGrant | Owned by 24d; public_disclosure is checked only when an owner/controller grants it. |
| Case | Owned by 24d; case membership is not a collection ownership signal. |
| CaseMembership | Owned by 24d; no case item is made public by collection membership alone. |
| GearLogisticsFacts | Owned by 24d; weight/origin/purpose facts stay purpose-bound and private. |
| ManifestSnapshot | Owned by 24d; collection route does not issue a logistics snapshot. |

### Event Schemas

| IA event type | 24a use | Safe payload rule |
|---|---|---|
| gear.collection_item_published.v1 | Produced by GPR-02 after safe publication commit. | Item/publication version/audience and actor hashes only; no serial/location/value/media URL. |
| gear.rig_version_saved.v1 | Consumed only to invalidate any derived collection context that names a rig. | Rig/version/context identifiers only. |
| gear.rig_member_unresolved.v1 | Consumed only to avoid claiming a formerly visible member remains available. | Rig/version/member state/reason, no owner identity. |
| gear.compatibility_run_completed.v1 | Consumed only by 24b compatibility projections; not a publication guarantee. | Run/version/severity counts and freshness only. |
| gear.register_line_changed.v1 | Consumed only where an organisation collection projection is explicitly authorized. | Entity/line/mode/version, no serial or price. |
| gear.condition_reported.v1 | Consumed to refresh a published item's honest condition projection. | Line/report/grade/time with privacy-safe attribution. |
| gear.custody_changed.v1 | Consumed to remove publication authority when a disclosure grant is revoked. | Custody/state/grant version only. |
| gear.case_membership_changed.v1 | Consumed only for collection invalidation; case membership never publishes an item. | Case/membership/version only. |
| gear.manifest_snapshot_created.v1 | Consumed only by logistics/manifest projections, not collection output. | Snapshot/purpose/source version/gap count only. |
| gear.readiness_gap_changed.v1 | Consumed to mark a projection stale where an explicitly selected readiness dependency changes. | Subject/gap status/version only. |

## Endpoint Reconciliation

The approved 24a split has one route per assigned interaction. The route
registry is authoritative for this file. 24b rig routes, 24c register/condition
routes, 24d custody/case/manifest routes, Shard 23 routes and BE00 platform
routes are dependencies and are not duplicated.

| IA interaction | Operation ID | Route | Why this boundary is complete |
|---|---|---|---|
| 24.01 View collection | BE24A-GHO01 | GET /api/v1/gear/collections/:partyId | The read projection owns current/former separation, private aggregate selection and unavailable-state semantics without exposing companion internals. |
| 24.02 Publish collection item | BE24A-GHO02 | POST /api/v1/gear/collections/items/:gearRecordId/publication | The command owns safe rendition, exposure acknowledgement and atomic publication; identity, custody and condition producers remain authoritative. |
| Public media bytes | BE00 object flow | No 24a byte route | Safe rendition object references are authorized by purpose; original media and signed URLs remain BE00-owned. |
| Ownership/title/custody | Shard 23 and 24d commands | No 24a authority route | Collection visibility cannot mint title, custody, sale or insurance rights. |

## API Endpoints

### Umbrella Feature Trace

The IA Shard 24 feature bullets are represented across 24a–24d: 15.04 Gear Collection & Visibility; 15.06 Rig Profile & Compatibility; 15.07 Studio & Backline Asset Register; 15.08 Custody, Loans & Consignment; 15.10 Cases, Manifests & Carnet Source Data.

### Authoritative Route Registry

This is the only 24a route registry. Every later registry uses these stable
operation IDs. No route is shared with 24b, 24c, 24d, Shard 23 or BE00.

| Operation ID | Method | Path | Capability | Response |
|---|---|---|---|---|
| BE24A-GHO01 | GET | /api/v1/gear/collections/:partyId | gear.collection_read | Gho01Success |
| BE24A-GHO02 | POST | /api/v1/gear/collections/items/:gearRecordId/publication | gear.collection_publish | Gho02Success |

### Pagination and bounded query policy

| Operation ID | Allowlisted filters | Page size | Cursor and stable ordering |
|---|---|---|---|
| BE24A-GHO01 | `entityId`, `includePrivateAggregate`, `visibility`, `projectionVersion`; no arbitrary query keys | Default 50, maximum 100; response arrays never exceed the requested bound | Opaque cursor is bound to actor, party/entity, filters, projection version and sort; order by lifecycle band (`current` then `formerly_owned`), `publishedAt DESC NULLS LAST`, `gearRecordId ASC` tie-break |

The cursor is invalidated when its bound filter or projection version changes.
The server returns `nextCursor` only when another bounded page exists; a
coherent read failure returns the typed unavailable result and never a partial
page or an unbounded fallback.

### Request/Response Contracts (Zod 4)

Zod 4 schemas are strict runtime contracts. They validate Hono path/query/
headers/body, generated OpenAPI, projection responses, outbox payloads and
tests. Unknown keys and unsafe media/publication fields fail before any
existence-sensitive lookup.

~~~ts
import { z } from "zod";

type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const Uuid = z.uuid();
const Timestamp = z.iso.datetime({ offset: true });
const Version = z.string().regex(/^[1-9][0-9]*$/);
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const ShortText = z.string().trim().min(1).max(256);
const Cursor = z.string().trim().min(1).max(512);

const SafeItem = z.object({
  gearRecordId: Uuid,
  label: ShortText,
  lifecycle: z.enum(["current", "formerly_owned"]),
  visibility: z.enum(["private", "public", "withheld"]),
  safeMediaObjectId: Uuid.nullable(),
  sourceVersion: Version,
  publishedAt: Timestamp.nullable(),
}).strict();

const Gho01Request = z.object({
  partyId: Uuid,
  entityId: Uuid,
  includePrivateAggregate: z.boolean().default(false),
  visibility: z.enum(["all", "private", "public"]).default("all"),
  cursor: Cursor.nullable(),
  limit: z.number().int().positive().max(100).default(50),
  projectionVersion: Version,
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();

const Gho01Success = z.object({
  operationId: z.literal("BE24A-GHO01"),
  partyId: Uuid,
  entityId: Uuid,
  state: z.enum(["available", "unavailable"]),
  current: z.array(SafeItem).max(100),
  formerlyOwned: z.array(SafeItem).max(100),
  privateAggregate: z.object({
    itemCount: z.number().int().nonnegative(),
    publicItemCount: z.number().int().nonnegative(),
    formerlyOwnedCount: z.number().int().nonnegative(),
  }).strict().nullable(),
  appliedFilters: z.object({
    visibility: z.enum(["all", "private", "public"]),
    limit: z.number().int().positive(),
  }).strict(),
  nextCursor: Cursor.nullable(),
  retryAfterSeconds: z.number().int().positive().nullable(),
  projectionVersion: Version,
  createdAt: Timestamp,
}).strict();

const SafeRendition = z.object({
  objectId: Uuid,
  digest: Digest,
  mediaType: z.enum(["image/jpeg", "image/png", "video/mp4"]),
  rendererPolicyVersion: Version,
}).strict();

const ExposureAck = z.object({
  evaluatorVersion: Version,
  warningId: ShortText,
  acknowledgedAt: Timestamp,
  acknowledgedByPartyId: Uuid,
}).strict();

const Gho02Request = z.object({
  gearRecordId: Uuid,
  expectedGearVersion: Version,
  audience: z.enum(["public_collection", "public_profile", "public_item"]),
  safeRendition: SafeRendition,
  exposureAcknowledgement: ExposureAck,
  idempotencyKey: z.string().trim().min(16).max(128),
  actorContextId: Uuid,
  requestId: Uuid,
}).strict();

const Gho02Success = z.object({
  operationId: z.literal("BE24A-GHO02"),
  gearRecordId: Uuid,
  state: z.enum(["active", "blocked", "revoked"]),
  audience: z.enum(["public_collection", "public_profile", "public_item"]),
  publicationVersion: Version,
  safeRenditionObjectId: Uuid,
  exposureEvaluatorVersion: Version,
  eventType: z.literal("gear.collection_item_published.v1"),
  publicProjection: z.object({
    label: ShortText,
    visibility: z.literal("public"),
  }).strict().nullable(),
  version: Version,
  createdAt: Timestamp,
}).strict();

const ApiError = z.object({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
  message: z.string().trim().min(1).max(500),
  requestId: Uuid,
  details: BE00ErrorDetails,
}).strict();

const ErrorResponse = z.object({ error: ApiError }).strict();
~~~

Gho01Request is constructed from the path, query and headers; GET has no body.
The server binds partyId and entityId to the resolved acting context and
rejects a caller-supplied owner override. Gho02Request path gearRecordId must
match its body value, Idempotency-Key is the canonical idempotency key and
X-Request-Id must equal requestId. The exposure acknowledgement must be for
the current evaluator/policy version and the named warning. Every error is
exactly the BE00/global ApiError { code, message, requestId, details } contract;
HTTP status remains on the response line. Public success bodies contain no
serial, exact location, private value, hidden-history count, original media
URL, owner contact or private provenance.

### Contract Registry

| Operation ID | Request schema | Success schema | Domain errors | Global failure shape |
|---|---|---|---|---|
| BE24A-GHO01 | Gho01Request from path/query/headers; party/entity/projection version and idempotency key required | Gho01Success; current/former records and optional private aggregate are separated | PROJECTION_UNAVAILABLE, FORBIDDEN, NOT_FOUND, CONFLICT, VALIDATION_FAILED | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details }. |
| BE24A-GHO02 | Gho02Request; path/body, request ID and Idempotency-Key equality required | Gho02Success; safe public projection only after policy/acknowledgement gates | SAFE_RENDITION_REQUIRED, EXPOSURE_ACK_REQUIRED, EXPOSURE_EVALUATION_UNAVAILABLE, FORBIDDEN, NOT_FOUND, CONFLICT, DEPENDENCY_UNAVAILABLE | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details }. |

### Error Registry

| Operation ID | HTTP and code | Trigger and safe details |
|---|---|---|
| BE24A-GHO01 | 400 INVALID_REQUEST or 422 VALIDATION_FAILED | Invalid path/query/header, projection version, cursor or limit. Details use BE00 FieldViolation rows and no target data. |
| BE24A-GHO01 | 401 UNAUTHENTICATED | Missing, expired or ambiguous session/acting context. No collection existence is disclosed. |
| BE24A-GHO01 | 403 FORBIDDEN | Authenticated actor lacks read authority for party/entity projection or asks for a private aggregate outside purpose. Details contain reasonCode/recoveryAction only. |
| BE24A-GHO01 | 404 NOT_FOUND | Party/entity is absent, revoked or concealed. A known but unauthorized target is 403 only after safe authority evaluation; concealed target remains 404. |
| BE24A-GHO01 | 409 CONFLICT | Projection version/idempotency key conflicts with a prior request. Details use BE00 VERSION_MISMATCH or IDEMPOTENCY_MISMATCH. |
| BE24A-GHO01 | 503 PROJECTION_UNAVAILABLE | Canonical source or projection cannot be read coherently. Filters are returned only in safe error details and no partial public fallback is served. |
| BE24A-GHO01 | 429 RATE_LIMITED | Party/entity/IP quota exceeded; response includes retry metadata and no projection. |
| BE24A-GHO02 | 400 INVALID_REQUEST or 422 VALIDATION_FAILED | Path/body mismatch, unknown unsafe field, stale acknowledgement shape or malformed rendition reference. No lookup or mutation. |
| BE24A-GHO02 | 401 UNAUTHENTICATED or STEP_UP_REQUIRED | Session, acting context or required publication step-up is absent/expired. |
| BE24A-GHO02 | 403 FORBIDDEN | Actor does not control item visibility or lacks public_collection capability. Holder without owner disclosure grant and entity staff outside role receive 403. |
| BE24A-GHO02 | 404 NOT_FOUND | Gear record or media reference is absent, revoked or concealed. Hidden owner/record existence is not disclosed. |
| BE24A-GHO02 | 409 CONFLICT | Stale gear/publication version, duplicate non-equivalent idempotency key or acknowledgement policy race. Prior publication remains unchanged. |
| BE24A-GHO02 | 422 SAFE_RENDITION_REQUIRED or EXPOSURE_ACK_REQUIRED | Safe media rendition is missing/unreviewed, warning acknowledgement is absent/stale, or composed exposure requires a new acknowledgement. No activation. |
| BE24A-GHO02 | 502/503/504 EXPOSURE_EVALUATION_UNAVAILABLE or DEPENDENCY_UNAVAILABLE | Exposure evaluator, BE00 object verification or Shard 23 projection is unavailable. Publication fails closed and can be retried with the same key. |
| BE24A-GHO02 | 429 RATE_LIMITED | Actor/item/publication quota exceeded; no projection or event is written. |

All codes conform to the BE00 uppercase code pattern. Error details are capped
at 16 keys, four levels and 8 KiB. Anonymous requests receive 401 before
lookup. Evaluated authority failure is 403; absent/revoked/concealed targets
are 404. A safe rendition or exposure result is never inferred from a service
credential or a previous policy version.

### Authorization and Middleware Registry

| Operation ID | Authentication and role | Ownership/purpose predicate and 403-vs-404 | Middleware, including CORS |
|---|---|---|---|
| BE24A-GHO01 | Authenticated owner/controller or delegated entity reader; public visitor has no private collection command | Shard 01 resolves party/entity read scope; private aggregate requires owner/controller purpose. Known actor outside scope is 403; absent/revoked/concealed party/entity is 404. | Route inventory/request ID; TLS/body/header limits; CORS policy gear-api with explicit web/PWA origins, credentials only for allowlisted origins, no wildcard, Vary Origin; Supabase session; acting-context/entity resolution; strict Zod validation; party/entity rate limit; capability/RLS projection check; BE00 idempotency/version check; projection RPC; response/error normalization; sanitized audit/trace. |
| BE24A-GHO02 | Authenticated current Shard 23 owner/controller or entity asset controller with publication capability; step-up where policy requires | Actor must control item visibility and any required public_disclosure grant; safe rendition and exposure evaluator must be current. Known non-controller is 403; missing/concealed gear/object is 404. | Route inventory/request ID; TLS/body/header limits; CORS policy gear-api with explicit web/PWA origins, credentials only for allowlisted origins, no wildcard, Vary Origin; Supabase session and step-up; Shard 01 acting context; strict Zod validation; actor/item rate limit; owner/grant/purpose check; BE00 idempotency/CAS; safe-rendition/exposure RPCs; atomic publication/outbox; response/error normalization; sanitized audit/trace. |

No browser role receives direct table grants. RLS and named RPCs repeat
party/entity ownership, item control, safe-rendition purpose, evaluator
version and disclosure-grant predicates. Cookie mutations require same-origin
CSRF binding; bearer clients use the registered authorization header and no
ambient cookie.

### Idempotency and Concurrency Registry

| Operation ID | Idempotency contract | Version and race handling | Atomicity and replay |
|---|---|---|---|
| BE24A-GHO01 | Require Idempotency-Key 16-128 characters, scoped by actor, operation, party and entity; hash normalized filters and projectionVersion in BE00 idempotency_records for 30 days. | Projection read pins source versions; concurrent source change yields a coherent unavailable/refresh result rather than mixing current/former rows. A changed key request returns IDEMPOTENCY_MISMATCH. | Reserve/replay metadata and projection result are bound to the same request hash. Same request replay returns byte-equivalent Gho01Success or registered unavailable result; no public fallback is generated. |
| BE24A-GHO02 | Require Idempotency-Key 16-128 characters, scoped by actor, operation and gearRecordId; hash rendition digest, acknowledgement, audience and expected version. | Lock publication aggregate and compare expectedGearVersion, publicationVersion and exposure evaluator version. One activation wins; stale writer receives 409 without changing prior state. | Verify rendition/evaluator, append PublicGearProjection, audit and gear.collection_item_published.v1 outbox event atomically. Same request replay returns the stored success; changed payload returns IDEMPOTENCY_MISMATCH. |

Validation and authorization failures are not a reason to bypass a reserved
key. A retry re-evaluates current authority and policy. Rollback removes
publication/projection/outbox/audit writes except immutable idempotency evidence
required for safe replay.

### Rate, CORS and SLO Registry

| Operation ID | Rate limit | CORS policy | Deadline and response SLO |
|---|---|---|---|
| BE24A-GHO01 | 120 requests/minute/actor, 300/minute/entity, burst 30/10 seconds; public IP limits apply only to public projections | gear-api allowlist only; GET and OPTIONS; explicit origins, no wildcard credentials, Vary Origin, no private headers exposed | 8 second hard read deadline; p95 <= 500 ms with healthy projection; unavailable coherent read returns 503 without partial data. |
| BE24A-GHO02 | 20 requests/minute/actor, 60/minute/item, burst 5/10 seconds; exposure-evaluation quota can tighten | gear-api allowlist only; POST and OPTIONS; explicit origins, no wildcard credentials, Vary Origin, no signed URLs exposed | 15 second hard command deadline; p95 <= 1.5 seconds with healthy policy/object dependencies; timeout leaves prior publication unchanged. |

Rate keys use resolved actor/party/entity/item identity, never caller-supplied
owner IDs. OPTIONS has no mutation capability and returns only registered
methods/headers. Errors include no-store, X-Request-Id and matching rate
headers.

### Observability Registry

| Operation ID | Trace and metrics | Audit and redaction |
|---|---|---|
| BE24A-GHO01 | Span includes operation ID, requestId, correlationId, party/entity hashes, filter enum, source versions and projection state. Metrics cover available, unavailable, replayed, forbidden, not_found, conflict, latency, stale projection and cache age. | Audit records actor/party/entity hashes, purpose, filters, source version, outcome and reason. Never log item IDs, labels, aggregate values, serials, exact locations, media URLs or private history. |
| BE24A-GHO02 | Span includes operation ID, requestId, correlationId, gear hash, audience, rendition digest hash, evaluator version, outcome and dependency class. Metrics cover active, blocked, revoked, safe_rendition_denied, exposure_denied, replayed, conflict, dependency failure and latency. | Audit records actor/item hashes, audience, evaluator version, acknowledgement decision, safe-rendition digest hash and reason. Never log serial, location, private value, original media URL, warning private inputs or owner contact. |

Sentry receives correlation ID, operation ID and sanitized code only. Structured
logs use stable enums/digests; request bodies and private projection values are
excluded.

## Database Schema

All 24a tables live in non-exposed platform_private with RLS enabled and forced.
Shard 01 identity.party/entity and Shard 23 gear_records are explicit foreign
key targets. BE00 object_records is the only media-object target. Browser roles
receive no table grants. Named security-invoker RPCs repeat actor, entity,
purpose, disclosure, target version and safe-rendition predicates. A
security-definer helper, if used, has an empty fixed search_path, fully
qualified objects, revoked PUBLIC execution and positive/negative tests.

### Complete Table Definitions

| Table / model | Columns with SQL type, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.collection_projections / CollectionProjection | id uuid NOT NULL PK DEFAULT gen_random_uuid(); party_id uuid NOT NULL FK identity.party(id); entity_id uuid NOT NULL FK identity.entities(id); current_item_ids uuid[] NOT NULL DEFAULT [] CHECK cardinality(current_item_ids)>=0; former_item_ids uuid[] NOT NULL DEFAULT [] CHECK cardinality(former_item_ids)>=0; private_aggregate jsonb NULL CHECK private_aggregate IS NULL OR jsonb_typeof(private_aggregate)='object'; visibility_filter collection_visibility_filter NOT NULL CHECK IN all,private,public; source_version bigint NOT NULL CHECK >0; state collection_projection_state NOT NULL CHECK IN available,unavailable; version bigint NOT NULL CHECK >0; correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); UNIQUE party_id,entity_id,source_version | PK; party_id,entity_id,updated_at DESC,id; entity_id,visibility_filter,updated_at DESC; GIN current_item_ids; GIN former_item_ids; state,updated_at | Forced RLS. Owner/controller may read its party/entity projection through named RPC; delegated entity reader receives bounded projection; queue may refresh by lease; public receives no private table row. anon/authenticated direct table grants denied; UPDATE/DELETE denied except audited projection rebuild/tombstone RPC. |
| platform_private.public_gear_projections / PublicGearProjection | id uuid NOT NULL PK DEFAULT gen_random_uuid(); gear_record_id uuid NOT NULL FK platform_private.gear_records(id); audience publication_audience NOT NULL CHECK IN public_collection,public_profile,public_item; safe_label text NOT NULL CHECK char_length(safe_label) BETWEEN 1 AND 256; safe_media_object_id uuid NOT NULL FK platform_private.object_records(id); safe_media_digest bytea NOT NULL CHECK octet_length(safe_media_digest)=32; renderer_policy_version bigint NOT NULL CHECK >0; exposure_evaluator_version bigint NOT NULL CHECK >0; exposure_warning_id text NOT NULL CHECK char_length(exposure_warning_id) BETWEEN 1 AND 256; exposure_ack_party_id uuid NOT NULL FK identity.party(id); exposure_ack_at timestamptz NOT NULL; publication_version bigint NOT NULL CHECK >0; source_gear_version bigint NOT NULL CHECK >0; state public_projection_state NOT NULL CHECK IN draft,active,blocked,revoked; owner_disclosure_grant_id uuid NULL FK identity.disclosure_grants(id); version bigint NOT NULL CHECK >0; correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); UNIQUE gear_record_id,audience,publication_version; CHECK state='active' OR safe_media_object_id IS NOT NULL | PK; gear_record_id,audience,state,updated_at DESC; audience,state,updated_at DESC; safe_media_object_id; exposure_evaluator_version; owner_disclosure_grant_id | Forced RLS. Owner/controller may write through publication RPC; public reads only a security-invoker safe projection where state=active and object is safe; downstream readers receive bounded fields. anon/authenticated direct table grants denied; UPDATE/DELETE denied except append-only revocation/tombstone RPC. |

Array item IDs are individually verified against platform_private.gear_records
through the Shard 23 projection RPC before a collection projection is committed;
array cardinality and source version are part of the digest. Safe media objects
must be BE00 object_records state ready, purpose publication, digest-matched and
renderer-policy approved. Public projections never include serial, exact
location, private value, hidden-history counts, owner contact or original media.

### Shared persistence invariants

- Every mutation reserves inherited BE00 idempotency with actor, operation,
  request hash and target. Projection/publication rows, audit and outbox commit
  atomically.
- Collection current and former ownership arrays are separate. A transfer or
  source change cannot silently turn former ownership into current ownership;
  projection refresh is version-pinned.
- CollectionProjection is a derived view, not title evidence. A private
  aggregate never enters a public projection, and aggregate collection value is
  never computed for public output.
- PublicGearProjection activates only with current item authority, safe
  rendition, current exposure evaluator and named warning acknowledgement.
  Missing or uncertain media sanitization blocks activation.
- Revocation removes future/live public projection and object grants but does
  not rewrite lawful delivered snapshots; audit and required tombstones remain.
- Publication does not grant ownership, possession, sale, transfer, insurance,
  booking or custody authority. Public media is a safe immutable derivative.
- Realtime messages carry only IDs, versions and event hints. Consumers refetch
  canonical authorized state; no event payload is an authorization grant.

## Middleware & Policies

### Hono order and security

1. Match only the route registry; attach UUID requestId, operation ID, trace and
   correlation context; enforce URL/header/body ceilings.
2. Apply TLS/security headers and CORS policy gear-api. Allow only registered
   web/PWA origins, GET/POST and OPTIONS, no wildcard credential mode, and
   Vary: Origin.
3. Authenticate Supabase session; resolve Shard 01 acting party/entity. Ignore
   caller-supplied ownership or disclosure claims.
4. Apply actor, party, entity and item rate limits before sensitive lookup.
5. Validate path/query/headers/body with strict Zod; reject unknown unsafe
   rendition, serial, value, location and owner-contact fields.
6. Evaluate capability, ownership, disclosure purpose, projection version,
   evaluator version and safe-object state; rely on matching RLS/RPC checks.
7. Reserve BE00 idempotency/version state and invoke one named projection or
   publication RPC. Policy/media provider calls remain outside DB transaction.
8. Commit projection, audit and outbox atomically. Normalize success or the
   exact BE00 ErrorResponse; add no partial fallback.
9. Return X-Request-Id, cache/no-store and rate headers, then close sanitized
   trace/audit spans.

### Policy rules

| Policy | Required behavior |
|---|---|
| Collection privacy | Item visibility is private by default. Current/former records remain separately labelled; aggregate is owner/controller-only. |
| Public projection | Safe label/media, bounded audience and publication version only. Serial, exact location, private value and hidden-history counts are absent. |
| Exposure warning | Evaluator considers public city, dates/absence, venue address and follower reach without exposing private inputs; acknowledgement binds warning and evaluator versions. |
| Media safety | Original media stays protected. A safe rendition is immutable, digest-matched and policy-approved; sanitizer uncertainty blocks activation. |
| Authority | Shard 23 identity/title and Shard 01 party authority are canonical. A public disclosure grant may widen projection only for its exact subject/audience/term. |
| Realtime | Event hints are untrusted; every consumer rechecks current authorization and source version. |
| Revocation | Remove future public projection and signed access; preserve lawful snapshots and immutable audit/tombstone evidence. |
| No fallback | A coherent private collection read failure returns unavailable with filters/retry, never a partial public list. |

## Data Flow

### 24.01 view collection

1. Hono authenticates the actor, resolves party/entity context and parses
   Gho01Request. A public visitor cannot use this private collection route.
2. The projection RPC checks party/entity read capability, fetches a pinned
   Shard 23 source version and separates current from formerly owned records.
3. If includePrivateAggregate is true, the RPC applies owner/controller
   purpose and returns only aggregate counts; no public caller can request it.
4. The response is validated by Gho01Success. If source/projection versions
   cannot be read coherently, return state unavailable, preserved filters and a
   retry interval; never blend a partial public fallback.

### 24.02 publish collection item

1. Hono authenticates current owner/controller, resolves any public_disclosure
   grant and validates safe rendition plus exposure acknowledgement.
2. BE00 verifies the safe object is ready and digest-matched. The exposure
   evaluator checks current policy and returns evaluatorVersion, warningId,
   material flag and safe acknowledgement requirements without private inputs.
3. The publication RPC rechecks Shard 23 gear authority/source version, then
   appends PublicGearProjection with publicationVersion, audit and
   gear.collection_item_published.v1 in one transaction.
4. If any gate is missing, stale or unavailable, the prior state remains
   unchanged and the response is a typed blocked/dependency failure. No public
   object URL, serial or exact risk input is returned.

## State Machines, Concurrency and Failure Recovery

### Collection projection state

| State | Allowed transition | Guard and recovery |
|---|---|---|
| available | available to unavailable | Source/projection read loses coherence or policy invalidates the materialized view; retry refreshes all filters against one source version. |
| unavailable | unavailable to available | A fresh coherent source read completes; prior filters are preserved and no partial list is promoted. |

### Public projection state

| State | Allowed transition | Guard and recovery |
|---|---|---|
| draft | draft to active or blocked | Current authority, safe rendition, exposure result and acknowledgement are required for active; any missing gate blocks. |
| active | active to revoked or blocked | Revocation, source authority loss or policy change removes future projection; delivered lawful snapshots remain unchanged. |
| blocked | blocked to active or revoked | Fresh safe rendition/evaluator/authority can activate with a new version; no automatic retry activates stale acknowledgement. |
| revoked | none | Historical publication is retained as audit/tombstone; a new publication creates a new version and acknowledgement. |

### Failure and race matrix

| Scenario | Detection | Recovery |
|---|---|---|
| Source changes during collection read | Pinned Shard 23 source/version mismatch | Return PROJECTION_UNAVAILABLE with retry and filters; no mixed current/former rows. |
| Actor lacks party/entity authority | Shard 01 capability/RLS predicate | Return 403 for evaluated failure or concealed 404; no owner/entity leak. |
| Safe rendition missing or uncertain | BE00 object state/digest/renderer policy | Return SAFE_RENDITION_REQUIRED 422; prior publication stays unchanged. |
| Exposure evaluator unavailable | Timeout/circuit state | Return EXPOSURE_EVALUATION_UNAVAILABLE; fail closed and retry same idempotency key. |
| Warning acknowledgement stale | Evaluator version mismatch | Return EXPOSURE_ACK_REQUIRED; require named current warning acknowledgement. |
| Two publication writers race | Publication lock and expected gear/version CAS | One commits; loser receives typed 409 and cannot overwrite active projection. |
| Revocation crosses activation | Aggregate version ordering | Later accepted revocation emits compensating state; no stale activation remains public. |
| Object upload becomes revoked after commit | BE00 object event/consumer check | Revoke live projection and signed access; retain audit, source version and delivered snapshot record. |
| Request times out after commit | BE00 idempotency result | Replay same key returns stored success; no duplicate projection/event. |
| Queue/consumer crash | Outbox lease expiry and event ID dedupe | Reclaim lease and replay; consumers refetch canonical authorized state. |

No failure or transition labels a current/former record as owned by the viewer,
turns publication into sale/custody authority, or exposes private risk inputs.

## External Seams

Each seam has an exact request/response, timeout, finite retry/backoff and
circuit rule. Private projection values and original media never cross a seam
without an explicit purpose grant.

| Seam | Exact request and response | Timeout, retry and circuit |
|---|---|---|
| BE00 command admission/idempotency | Request: operationId, actorId, partyId, entityId, target hash, idempotencyKeyHash, requestHash, expectedVersion and correlationId. Response: reserved, replay with stored status/body hash, or IDEMPOTENCY_MISMATCH. | 500 ms; 2 retries at 25 ms and 100 ms for connection/reset only. Open after 5 failures in 30 seconds, half-open after 15 seconds; open returns DEPENDENCY_UNAVAILABLE. |
| Shard 01 party/entity authority | Request: actorId, actingPartyId, partyId, entityId, gearRecordId, capability and purpose. Response: resolved party/entity role, owner/controller standing, disclosure grant scope/expiry and stepUpSatisfied. | 800 ms; 1 retry at 50 ms for transport failure. Open after 5 failures in 30 seconds and fail closed; expired/ambiguous authority is 403. |
| Shard 23 source projection | Request: gearRecordId or item ID list, expected source version, requested fields current/former/public-safe and projection purpose. Response: source versions, lifecycle, safe labels, authority result and bounded item refs. | 700 ms; 2 retries at 50 ms and 150 ms for transport failure. Open after 5 failures in 30 seconds; version mismatch returns typed conflict, not stale success. |
| BE00 safe rendition/object | Request: objectId, digest, rendererPolicyVersion, owner/party purpose, audience and gearRecordId. Response: ready true, safe object ID, digest, media type and policy version; no bytes. | 900 ms; 2 retries at 100 ms and 250 ms for transport failure. Open after 5 failures in 30 seconds; unavailable or uncertain safety blocks publication. |
| Exposure policy evaluator | Request: audience, evaluatorPolicyVersion, public projection candidate hashes, public city/date/venue reach references and acknowledgement intent; response: evaluatorVersion, warningId, material flag, required acknowledgement and expiry. Private raw inputs are never returned. | 1200 ms; 2 retries at 100 ms and 300 ms for transport failure only. Open after 5 failures in 60 seconds, half-open after 30 seconds; open/ambiguous response blocks activation. |
| BE00 outbox/event lease | Request: event type, aggregate ID/version, safe payload, correlation/causation IDs. Response: event ID, lease/dispatch status. | Local insert target <= 500 ms; dispatcher retries 3 times at 1, 5 and 30 seconds, then manual review. Circuit opens after 5 consumer failures in 60 seconds; payload is immutable. |

No seam may use a service credential as owner authority. External retry reuses
the same idempotency key and fresh authorization. Ambiguous media or exposure
results remain unknown and cannot be converted to active by timeout.

## Events and Async Consumers

### Event envelope

GPR-02 emits gear.collection_item_published.v1 after the PublicGearProjection
transaction commits:

~~~ts
type GearCollectionEvent = {
  id: string,
  eventType: "gear.collection_item_published.v1",
  schemaVersion: 1,
  aggregateType: "gear_record",
  aggregateId: string,
  aggregateVersion: string,
  correlationId: string,
  causationId: string | null,
  occurredAt: string,
  payload: {
    gearRecordId: string,
    audience: "public_collection" | "public_profile" | "public_item",
    publicationVersion: string,
    state: "active" | "blocked" | "revoked",
    safeRenditionDigest: string,
    exposureEvaluatorVersion: string
  }
};
~~~

The payload excludes serials, exact locations, private values, hidden-history
counts, owner/contact identity, original media URL and evaluator private inputs.
Consumers are idempotent, refetch canonical state and never treat the event as
an ownership, custody, sale or booking grant.

### Consumer obligations

| Consumer | Event/input | Required behavior |
|---|---|---|
| Public profile/search projection | gear.collection_item_published.v1 | Activate only the safe projection and current publication version; remove it on revocation. |
| Shard 29 venue projection | gear.collection_item_published.v1 | Consume bounded public item visibility only; room terms, price and bookable posture remain Shard 29-owned. |
| Shard 25 listing projection | gear.collection_item_published.v1 | Treat publication as a display hint, not listing/sale authority; recheck custody/grant. |
| Shard 23 provenance projection | gear.identity.changed.v1, gear.claim.changed.v1, gear.transfer.changed.v1 | Invalidate stale public labels and refetch under source ownership; no public identity leak. |
| 24b/24c/24d projections | gear.rig_version_saved.v1, gear.register_line_changed.v1, gear.condition_reported.v1, gear.custody_changed.v1 | Refresh collection hints without importing rig, register, condition or custody authority. |
| 24d/Shard 32 logistics | gear.case_membership_changed.v1, gear.manifest_snapshot_created.v1, gear.readiness_gap_changed.v1 | Keep collection publication independent from case/manifest readiness. |

## Error Handling

### Boundary matrix

| Operation ID | Boundary | Required result |
|---|---|---|
| BE24A-GHO01 | Transport/schema | 400 INVALID_REQUEST or 422 VALIDATION_FAILED with BE00 ErrorResponse; no lookup. |
| BE24A-GHO01 | Authentication/authority | 401 before lookup, 403 for evaluated scope failure, 404 for absent/concealed target. |
| BE24A-GHO01 | Coherent projection read | 503 PROJECTION_UNAVAILABLE with filters/retry metadata; no partial public fallback. |
| BE24A-GHO01 | Version/idempotency race | 409 CONFLICT and one replayable result; no mixed source versions. |
| BE24A-GHO02 | Transport/schema | 400/422 with safe field violations; no media/policy lookup before validation. |
| BE24A-GHO02 | Authority/disclosure | 401, 403 or concealed 404; no owner, grant or private risk detail. |
| BE24A-GHO02 | Rendition/exposure gate | 422 SAFE_RENDITION_REQUIRED or EXPOSURE_ACK_REQUIRED; prior state unchanged. |
| BE24A-GHO02 | Dependency timeout | 503 DEPENDENCY_UNAVAILABLE or EXPOSURE_EVALUATION_UNAVAILABLE; activation never passes. |
| BE24A-GHO02 | Version/idempotency race | 409 CONFLICT with BE00 details; exactly one publication version wins. |

### Error invariants

- Every failure has Content-Type application/json, X-Request-Id,
  Cache-Control no-store and rate headers.
- ErrorResponse contains exactly one ApiError with code, message, requestId and
  details. RFC problem fields, SQL, stack, private policy input, serial,
  location, owner identity and media URL are prohibited.
- Validation and authentication precede existence-sensitive access. Concealed
  targets cannot be distinguished from absence.
- Failed or timed-out transactions leave no projection/event/audit completion
  except registered idempotency evidence.
- A public projection is never served from stale private data after an exposure
  policy/evaluator change without a fresh gate.

## Testing Strategy

### Contract and route tests

| Test ID | Operation ID | Acceptance evidence |
|---|---|---|
| BE24A-T01 | BE24A-GHO01 | Gho01Request/Gho01Success bounded cursor projection, audience RLS, 403/404, ApiError, CORS, and cache-key assertions pass |
| BE24A-T02 | BE24A-GHO02 | Gho02Request/Gho02Success publication and rendition constraints, source authority, idempotency/CAS, ApiError, event, and output-redaction assertions pass |

- Parse Gho01Request/Gho01Success, Gho02Request/Gho02Success and ErrorResponse
  with Zod 4. Assert unknown unsafe fields, path/body mismatch, invalid cursor,
  missing rendition, stale acknowledgement and private aggregate overreach fail.
- Assert exactly two unique method/path pairs, one route per 24.01/24.02, and
  both operation IDs appear in contract, error, authorization, idempotency,
  rate and observability registries.
- Assert every failure serializes BE00 ApiError and public success omits
  serials, exact locations, private values, hidden-history counts, owner
  contact, original media URL and policy private inputs.

### Authorization and privacy tests

- For each operation test owner/controller, delegated entity reader, holder,
  non-owner, entity staff outside role, reviewer, anonymous, revoked party,
  expired session, forged actorContextId and service credential misuse.
- Assert current/former separation, private aggregate scope, 401/403/404
  concealment, public disclosure grant expiry and no title/custody escalation.
- Assert CORS gear-api rejects unallowlisted origins, wildcard credentials and
  unregistered methods; OPTIONS exposes only registered headers.
- Assert rendition/object purpose, digest and renderer policy gates; original
  media and exact exposure inputs never appear in responses/logs/events.

### Persistence, idempotency and concurrency tests

- Migration tests verify platform_private tables, SQL types/nullability,
  foreign keys, enum/check constraints, array cardinality, digest lengths,
  unique keys, query indexes, forced RLS and revoked direct grants.
- Replay collection reads and publication commands after success/timeout/crash;
  assert deterministic result, one publication version/event and changed-key
  IDEMPOTENCY_MISMATCH.
- Race publication with source transfer/revocation, evaluator version change
  and two equal expected versions; assert one CAS winner and no stale active
  projection.
- Attempt direct table read/update/delete as anon, authenticated, owner,
  delegated entity reader, holder, queue and maintenance roles; assert only
  named projection/revocation/retention RPCs work.

### Domain and seam tests

- 24.01 tests current/former ownership, private aggregate permission, filters,
  source-version drift, unavailable projection and no public fallback.
- 24.02 tests safe rendition, serial-in-photo block, composed city/date/venue
  warning, acknowledgement version, grant scope, revocation and safe media
  expiry.
- Contract-test every seam's exact request/response, timeout, retry count and
  backoff, circuit-open behavior, ambiguous result and same-key replay.
- Assert event consumers refetch canonical state and cannot turn publication
  into title, custody, sale, booking or insurance authority.

### Event, recovery and accessibility-support tests

- Validate all ten IA event identifiers and publication event payload, event
  ID/aggregate-version dedupe, outbox lease expiry, retry exhaustion and
  consumer replay.
- Inject Shard 01, Shard 23, BE00 object, exposure evaluator, DB and queue
  failures; assert typed errors, no partial effects and alertable metrics.
- Property-test public projection omission: no serial, exact location, private
  value, hidden-history count, owner contact, original media or private policy
  input can pass a safe schema.
- Projection fixtures preserve filters/retry state and current/former labels;
  publication fixtures expose text warnings, evidence of acknowledgement and
  no color-only safety meaning at client boundaries.

## Deepening Passes

| Pass | Result | Evidence |
|---|---|---|
| 1. Source coverage | PASS | 24.01/24.02, all 15 canonical Data Models names and all 10 Event Schemas names are retained in the source map. |
| 2. Contract exactness | PASS | Strict Zod 4 schemas, path/header equality, safe rendition/acknowledgement and BE00 ApiError are explicit. |
| 3. Endpoint reconciliation | PASS | Two operation IDs map one-to-one to approved 24a; no 24b/24c/24d/23/BE00 route duplication. |
| 4. Authorization | PASS | Party/entity scope, owner/controller, disclosure grant, public limits and 403-vs-404 are keyed per operation. |
| 5. Persistence | PASS | CollectionProjection and PublicGearProjection fields list SQL types, nullability, constraints, FKs, indexes and forced-RLS/grants. |
| 6. Concurrency/idempotency | PASS | BE00 reservation, source/publication CAS, request hashes, atomic outbox and replay are defined per operation. |
| 7. External failure | PASS | Source, object, evaluator, authority and outbox seams include exact request/response, timeout, retries/backoff and circuit behavior. |
| 8. Security/observability | PASS | CORS gear-api, middleware order, media/privacy redaction, audit, metrics and traces are explicit. |
| 9. Adversarial review | PASS | Composed exposure, serial-in-media, stale source, public fallback, grant revocation and credential escalation fail closed. |
| 10. Implementer replay | PASS | Two independent implementers can derive the same routes, projections, gates, states, events and tests without unstated choices. |

## Ambiguity Gate

PASS. Micro-level review fixed current/former collection semantics, aggregate
scope, filter persistence, safe rendition digest/policy, warning/evaluator
acknowledgement, audience values, publication states, error details and
public-field omission. Macro-level review fixed the 24a boundary:
CollectionProjection and PublicGearProjection are owned here; Shard 23 owns
identity/title, 24b rigs, 24c register/condition, 24d custody/logistics, and
BE00 owns objects/jobs. A two-implementer replay produced the same two routes
and atomic read/publication sequencing. Devil's advocate cases (source drift,
private aggregate overreach, serial in media, exposure evaluator outage, stale
acknowledgement, holder publication, revocation race and post-commit timeout)
all have typed recoverable outcomes. Decision lock: private by default, no
partial public fallback, safe rendition required, warning acknowledgement
version-bound, and publication grants no ownership or custody rights.

## Open Questions

None

## Dependency References

- Depends on: BE00 for ApiError, idempotency, object readiness, audit, outbox
  and event lease; Shard 01 for party/entity/acting context and disclosure
  grants; Shard 23 for gear identity, ownership lifecycle and safe source
  versions; the exposure policy evaluator for composed-risk decisions.
- Publishes to: public profile/search, Shard 25 listing hints, Shard 29 bounded
  venue projections and downstream collection consumers through
  gear.collection_item_published.v1.
- Consumes: gear.identity.changed.v1, gear.claim.changed.v1,
  gear.transfer.changed.v1, gear.rig_version_saved.v1,
  gear.rig_member_unresolved.v1, gear.compatibility_run_completed.v1,
  gear.register_line_changed.v1, gear.condition_reported.v1,
  gear.custody_changed.v1, gear.case_membership_changed.v1,
  gear.manifest_snapshot_created.v1 and gear.readiness_gap_changed.v1 only as
  bounded invalidation/status inputs.
- Direction: 24a never reads companion stores directly; named RPCs/events cross
  boundaries, producers retain canonical ownership and consumers cannot
  strengthen title, possession, disclosure, publication or safety state.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Added BE24A-GHO01 collection projection and BE24A-GHO02 safe publication command with strict contracts, exposure acknowledgement, persistence, RLS, failure recovery and event coverage | /write-be-spec |
| 2026-08-28 | Locked current/former separation, private-by-default visibility, safe rendition requirement and no-partial-public-fallback behavior | /write-be-spec-deepen |
