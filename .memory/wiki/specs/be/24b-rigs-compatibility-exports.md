# BE-24b — Rigs, Compatibility and Source Exports

**Status:** Complete
**Backend surface:** Hono on Cloudflare Workers, Supabase PostgreSQL/RLS, transactional outbox, Cloudflare Queues
**Authority boundary:** Shard 24 owns rig aggregate state, ordered rig membership, advisory compatibility evidence and source-export snapshots. Shard 23 remains authoritative for gear identity and title; custody authority is supplied by the 24d companion; Shard 32 consumes snapshots for production planning.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Classification | Multi-domain IA shard split; 24b owns the rig, compatibility and export capability boundary | BE index line 41 assigns rigs/compatibility to 24b; IA interactions 24.03–24.06 at lines 49–52 and 70–73 |
| In-scope operations | Create rig, add rig member, run compatibility check, export rig source data | IA source interactions lines 66–73; deep-dive Rig, Compatibility and Export Flow lines 21–29 |
| Canonical state | Rig and RigVersion are actor-owned; RigMember is ordered evidence; CompatibilityRun and export snapshots are immutable once committed | IA models lines 115–117; deep-dive Snapshot Contract lines 52–57 |
| Boundary with 24a | 24a owns collection reads and public item publication; this companion consumes safe record references and never publishes a collection item | IA interactions 24.01–24.02 lines 47–48 and 68–69 |
| Boundary with 24d | This companion may require confirmed custody and read custody grants; it does not create, confirm, dispute or end custody | IA access and custody decisions lines 33, 56–59, 147–163 |
| Non-goals | Automatic compatibility guarantees, booking blocks, title transfer, public serial disclosure, carnet issuance and stage-plot layout | IA decisions lines 28–35; edge cases lines 207–218; dependency map lines 220–226 |

## Referenced Material Inventory

| Source file | Section and lines | Material consumed |
|---|---|---|
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Overview and scope lines 7–20 | Shard ownership, personal versus organisation context, possession/logistics separation and source filename |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Holdings Decisions lines 22–35 | Acting-party rig authority, unresolved member continuity, advisory compatibility, safe export and disclosure rules |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Acceptance criteria lines 49–52 | Required validation, authentication, authorization, revision/idempotency, success and failure behavior for 24.03–24.06 |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Interactions lines 66–73 | Exact IA interaction IDs, preconditions, outcomes and recovery boundary |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Command Contracts lines 89–99 | SaveRigVersion, RunCompatibility and export input invariants |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Data Models and Typed Field Registry lines 109–145 | Rig, RigVersion, RigMember, CompatibilityRun, snapshot typing and cardinality rules |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Access Control and Events lines 147–163 and 186–201 | Owner/holder roles, disclosure restrictions, exact event names and envelope obligations |
| .memory/wiki/specs/ia/deep-dives/24-gear-holdings-operations.md | Rig, Compatibility and Export Flow lines 21–29 | Ordered member behavior, placeholder replacement, pinned advisory runs and masked export |
| .memory/wiki/specs/ia/deep-dives/24-gear-holdings-operations.md | Authority Derivation and Snapshot Contract lines 43–57 | Effective capability intersection, immutable versions, typed unknown states and readiness |
| .memory/wiki/specs/ia/deep-dives/24-gear-holdings-operations.md | Race Resolution lines 110–120 | Transfer, custody, case and policy races; transactional event emission |
| .memory/wiki/specs/be/00-infrastructure.md | Request/Response Contracts lines 112–153 | Zod 4 strictness, BE00 ApiError, error codes and disclosure-safe details |
| .memory/wiki/specs/be/00-infrastructure.md | Database and RLS lines 208–251 | Forced RLS, grants, idempotency/outbox relations and negative authorization tests |
| .memory/wiki/specs/be/00-infrastructure.md | Middleware and route archetypes lines 255–296 | Hono order, CORS, ordinary command/read limits, deadlines and capability checks |
| .memory/wiki/specs/be/00-infrastructure.md | Protected transaction and deterministic protocol lines 300–353 | Atomic idempotency, CAS versions, request hashing, body/collection limits and cursor rules |
| .memory/wiki/specs/be/23a-gear-identity-claims-transfers.md | Contracts, database and event schemas | Canonical gear_records identity reference and ownership/transfer events consumed as source truth |
| .memory/wiki/specs/be/23b-theft-screening-recovery.md | Theft standing contracts and event consumers | Eligibility signal for unresolved members and no authority from a rig reference |

The requested alias 24-gear-collections.md is absent. The sole canonical IA source used here is .memory/wiki/specs/ia/24-gear-holdings-operations.md; the alias mismatch is recorded for audit and does not change the approved shard boundary.

## IA Source Map

### Assigned interactions

| IA ID | Source trace | Backend operation | Completion and non-negotiable recovery |
|---|---|---|---|
| 24.03 | IA 24-gear-holdings-operations.md lines 49 and 70; deep dive lines 21–24 | BE24B-GHO03 creates an actor-owned rig and its first immutable RigVersion | Invalid acting party or unreadable context aborts the transaction; no empty or partially created rig |
| 24.04 | IA source lines 50 and 71; deep dive lines 23–26 | BE24B-GHO04 appends one ordered RigMember to a new version | Record, confirmed-held record or non-identifying placeholder is explicit; inaccessible records never leak owner facts |
| 24.05 | IA source lines 51 and 72; deep dive lines 26–28 | BE24B-GHO05 stores a pinned CompatibilityRun | Findings, unchecked members, coverage and freshness are explicit; stale/unavailable target is not a pass or booking block |
| 24.06 | IA source lines 52 and 73; deep dive lines 27–29 | BE24B-GHO06 stores a versioned source-export snapshot | Held identity requires a matching disclosure grant; otherwise a masked placeholder and gap are returned |

### Canonical Data Models

| IA Data Models name | 24b realization | Relationship and invariant |
|---|---|---|
| Rig | gear_rigs aggregate | N:1 to acting party; context is readable context only and never ownership |
| RigVersion | gear_rig_versions immutable revision | N:1 to Rig; ordered membership and source versions are pinned |
| RigMember | gear_rig_members immutable version row | Exactly one reference kind; sold, unavailable or inaccessible identity becomes a placeholder in later live versions |
| CompatibilityRun | gear_compatibility_runs immutable evidence | N:1 to RigVersion; target/reference versions and checked/unchecked counts are retained |
| CollectionProjection | consumed read projection from 24a | No write or publication authority is taken from a collection projection |
| PublicGearProjection | consumed safe record projection from 24a | Used only for safe labels/media; serial, exact location and private value remain absent |
| CustodyInterval | consumed 24d authority | Confirmed active custody can support an allowed operational reference; pending/stale/disputed custody cannot |
| CustodyGrant | consumed 24d disclosure evidence | public_disclosure grant is checked per item, audience and term; possession alone is insufficient |
| Case | consumed logistics grouping | Export may include a case reference only when the caller can read it; case ownership remains 24d |
| CaseMembership | consumed effective-dated grouping | Export pins the membership version and reports divergence rather than mutating a case |
| RegisterLine | consumed source for technical/quantity context | A quantity line is never represented as an identified member |
| ConditionReport | consumed evidence | Export may carry honest condition state; it cannot suppress conflicts or upgrade unknown state |
| PublicBacklineProjection | not written by 24b | Rig export does not become a public backline listing |
| GearLogisticsFacts | consumed optional source | Weight, origin and purpose values are copied with source version and typed gaps |
| ManifestSnapshot | downstream consumer | 24b export is a source snapshot; manifest/carnet readiness remains 24d/Shard 32 authority |

### Event Schemas

| IA Event Schemas event type | Producer/consumer role | Payload restriction |
|---|---|---|
| gear.rig_version_saved.v1 | Produced by GHO03/GHO04 after the RigVersion transaction commits | Rig/version IDs, actor hashes, context reference class, member count and source versions; no hidden owner data |
| gear.rig_member_unresolved.v1 | Produced when a later authoritative identity, transfer or custody event replaces a live usable member | Rig/version/member IDs, reason enum and source event ID; no serialized private record |
| gear.compatibility_run_completed.v1 | Produced by GHO05 after immutable evidence is stored | Run/version IDs, severity counts, coverage, unchecked count, target freshness and advisory state |
| gear.collection_item_published.v1 | Consumed only to invalidate or re-evaluate a safe label/media reference | Consumer refetches 24a canonical projection; event hints never grant rig access |
| gear.register_line_changed.v1 | Consumed to refresh technical or quantity context | Quantity changes may make a member unresolved or a finding unchecked; no identity is inferred |
| gear.condition_reported.v1 | Consumed to annotate export condition | Report attribution and observed time remain visible; no verified-working state is generated |
| gear.custody_changed.v1 | Consumed to revoke an unauthorized held-item reference and trigger placeholder replacement | Active custody and accepted grant are re-read from 24d; stale/disputed state removes derived authority |
| gear.case_membership_changed.v1 | Consumed to mark a case context stale | Existing snapshots remain valid; new export pins the new case version |
| gear.manifest_snapshot_created.v1 | Consumed as a downstream acknowledgement only | This companion does not rewrite the manifest or issue a carnet |
| gear.readiness_gap_changed.v1 | Consumed to expose export gap freshness | Gap severity and source version only; no private value or serial in the event |

All event rows use the parent envelope eventId, schemaVersion, aggregateId, aggregateVersion, actorId, actingPartyId, correlationId, causationId and occurredAt. Consumer handlers are idempotent and re-read canonical state.

## Endpoint Reconciliation

| IA interaction | Operation ID | Route | Why this boundary is complete |
|---|---|---|---|
| 24.03 Create rig | BE24B-GHO03 | POST /api/v1/gear/rigs | Owns actor/context resolution, first version, ordered initial members, audit and outbox |
| 24.04 Add rig member | BE24B-GHO04 | POST /api/v1/gear/rigs/:rigId/members | Owns one versioned membership append and placeholder masking; it does not mutate the referenced gear record |
| 24.05 Run compatibility check | BE24B-GHO05 | POST /api/v1/gear/compatibility-runs | Owns pure pinned evaluation evidence and freshness gaps, not target or booking state |
| 24.06 Export rig source data | BE24B-GHO06 | POST /api/v1/gear/rigs/:rigId/exports | Owns disclosure-filtered source snapshot and gap report, not document layout or freight/carnet issuance |

BE00 routes INF-API-01 through INF-API-04, 24a collection/publication routes, and Shard 23 identity/theft routes are dependencies, not duplicate implementations here. Every route below has one stable operation ID.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Capability | Archetype | Success |
|---|---|---|---|---|---|---|
| BE24B-GHO03 | POST | /api/v1/gear/rigs | 24.03 | gear.rig.create | ordinary command | 201 Gho03Success |
| BE24B-GHO04 | POST | /api/v1/gear/rigs/:rigId/members | 24.04 | gear.rig.edit | ordinary command | 201 Gho04Success |
| BE24B-GHO05 | POST | /api/v1/gear/compatibility-runs | 24.05 | gear.compatibility.read | ordinary command with advisory evidence | 201 Gho05Success |
| BE24B-GHO06 | POST | /api/v1/gear/rigs/:rigId/exports | 24.06 | gear.rig.export | high-risk disclosure command | 201 Gho06Success |

Only the routes in this table may invoke these operation IDs. A route handler must reject a method/path mismatch before domain lookup and must not accept operation IDs supplied by a client.

### Request/Response Contracts (Zod 4)

Zod 4 schemas are strict and are the executable source for TypeScript, Hono validation, OpenAPI and contract tests. Unknown keys fail. UUIDs are canonical lowercase UUID strings; versions are decimal strings to avoid JavaScript bigint loss. No success schema exposes a serial, exact location, private value or hidden owner fact.

~~~ts
import { z } from "zod";

type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const uuid = z.string().uuid();
const version = z.string().regex(/^[1-9][0-9]*$/).max(19);
const idemKey = z.string().regex(/^[\x21-\x7e]{8,128}$/);
const safeText = z.string().min(1).max(256).refine((v) => v.normalize("NFC") === v);
const RigSpecValue = z.union([z.string().trim().min(1).max(512), z.number().finite(), z.boolean()]);
const jsonObject = z.record(z.string().regex(/^[a-z][a-z0-9_.-]{0,63}$/), z.union([RigSpecValue, z.array(RigSpecValue).max(32)])).superRefine((value, ctx) => { if (Object.keys(value).length > 64) ctx.addIssue({ code: "custom", message: "spec_key_limit" }); });
const sourceState = z.enum(["known", "unknown", "withheld", "not_applicable"]);
const memberKind = z.enum(["record", "confirmed_held", "placeholder"]);

const RigContextRef = z.strictObject({
  kind: z.enum(["project", "tour", "production"]),
  id: uuid,
  readableVersion: version,
});

const RigMemberInput = z.strictObject({
  kind: memberKind,
  gearRecordId: uuid.nullable(),
  custodyId: uuid.nullable(),
  placeholderCode: z.string().regex(/^[A-Z0-9_-]{1,64}$/).nullable(),
  order: z.number().int().min(0).max(9999),
  role: safeText.max(80),
  connection: safeText.max(120).nullable(),
  placement: safeText.max(120).nullable(),
  specs: jsonObject.nullable(),
}).superRefine((v, ctx) => {
  const validShape =
    (v.kind === "record" && v.gearRecordId !== null && v.custodyId === null && v.placeholderCode === null) ||
    (v.kind === "confirmed_held" && v.gearRecordId !== null && v.custodyId !== null && v.placeholderCode === null) ||
    (v.kind === "placeholder" && v.gearRecordId === null && v.custodyId === null && v.placeholderCode !== null);
  if (!validShape) ctx.addIssue({ code: "custom", path: ["kind"], message: "exact member reference shape is required" });
  if (v.kind === "placeholder" && v.specs !== null) {
    ctx.addIssue({ code: "custom", path: ["specs"], message: "placeholder specs must remain null" });
  }
});

const RigMemberResource = z.strictObject({
  id: uuid,
  kind: memberKind,
  gearRecordId: uuid.nullable(),
  custodyId: uuid.nullable(),
  placeholderCode: z.string().regex(/^[A-Z0-9_-]{1,64}$/).nullable(),
  order: z.number().int().nonnegative(),
  role: safeText.max(80),
  connection: safeText.max(120).nullable(),
  placement: safeText.max(120).nullable(),
  specs: jsonObject.nullable(),
  sourceState,
  version,
});

const RigVersionResource = z.strictObject({
  id: uuid,
  rigId: uuid,
  version,
  state: z.enum(["draft", "active", "superseded"]),
  members: z.array(RigMemberResource).max(200),
  unknownMemberCount: z.number().int().nonnegative(),
  sourceVersions: z.array(z.strictObject({ subject: safeText.max(120), version })).max(100),
  createdAt: z.string().datetime({ offset: true }),
});

const RigResource = z.strictObject({
  id: uuid,
  actingPartyId: uuid,
  contextRef: RigContextRef.nullable(),
  name: safeText.max(120),
  status: z.enum(["draft", "active", "archived"]),
  version,
  currentVersionId: uuid,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

const Gho03Request = z.strictObject({
  actingPartyId: uuid,
  contextRef: RigContextRef.nullable(),
  name: safeText.max(120),
  initialMembers: z.array(RigMemberInput).max(200),
  expectedVersion: version.nullable(),
  idempotencyKey: idemKey,
  requestId: uuid,
});

const Gho03Success = z.strictObject({
  operationId: z.literal("BE24B-GHO03"),
  rig: RigResource,
  rigVersion: RigVersionResource,
  replayed: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
});

const Gho04Request = z.strictObject({
  rigId: uuid,
  member: RigMemberInput,
  expectedVersion: version,
  idempotencyKey: idemKey,
  requestId: uuid,
});

const Gho04Success = z.strictObject({
  operationId: z.literal("BE24B-GHO04"),
  rig: RigResource,
  rigVersion: RigVersionResource,
  member: RigMemberResource,
  unresolved: z.boolean(),
  replayed: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
});

const CompatibilityFinding = z.strictObject({
  severity: z.enum(["hard", "warning", "info"]),
  dimension: z.enum(["voltage", "connector", "physical", "format", "reference"]),
  subject: safeText.max(120),
  message: safeText.max(500),
  sourceState,
});

const Gho05Request = z.strictObject({
  rigVersionId: uuid,
  targetVersionId: uuid,
  regionStandardVersion: version.nullable(),
  idempotencyKey: idemKey,
  requestId: uuid,
});

const Gho05Success = z.strictObject({
  operationId: z.literal("BE24B-GHO05"),
  runId: uuid,
  rigVersionId: uuid,
  targetVersionId: uuid,
  regionStandardVersion: version.nullable(),
  advisoryState: z.enum(["findings", "no_findings", "unchecked", "unavailable"]),
  findings: z.array(CompatibilityFinding).max(1000),
  checkedMemberCount: z.number().int().nonnegative(),
  uncheckedMemberCount: z.number().int().nonnegative(),
  coverageRatio: z.number().min(0).max(1),
  targetState: z.enum(["current", "stale", "unavailable"]),
  targetObservedAt: z.string().datetime({ offset: true }).nullable(),
  sourceVersions: z.array(z.strictObject({ subject: safeText.max(120), version })).max(100),
  version,
  replayed: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
});

const Gho06Request = z.strictObject({
  rigVersionId: uuid,
  purpose: z.enum(["private_operations", "production_planning", "advancing_source", "insurance_review"]),
  disclosureGrantIds: z.array(uuid).max(200),
  includeTechnicalSourceData: z.boolean(),
  idempotencyKey: idemKey,
  requestId: uuid,
});

const ExportMember = z.strictObject({
  memberId: uuid,
  kind: memberKind,
  publicLabel: safeText.max(160).nullable(),
  technicalData: jsonObject.nullable(),
  sourceState,
  disclosure: z.enum(["full", "masked", "withheld", "not_applicable"]),
});

const Gho06Success = z.strictObject({
  operationId: z.literal("BE24B-GHO06"),
  exportId: uuid,
  rigVersionId: uuid,
  purpose: z.enum(["private_operations", "production_planning", "advancing_source", "insurance_review"]),
  members: z.array(ExportMember).max(200),
  gapCodes: z.array(z.string().regex(/^[A-Z0-9_]{1,64}$/)).max(200),
  advisoryRequirements: z.array(safeText.max(300)).max(200),
  sourceVersions: z.array(z.strictObject({ subject: safeText.max(120), version })).max(100),
  createdAt: z.string().datetime({ offset: true }),
  version,
  replayed: z.boolean(),
});

const ApiError = z.strictObject({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
  message: z.string().min(1).max(500),
  requestId: uuid,
  details: BE00ErrorDetails,
});

const ErrorResponse = z.strictObject({ error: ApiError });
~~~

ErrorResponse is the only failure body. HTTP status stays on the response line; top-level type, title, status, detail, instance, error and timestamp fields from generic RFC envelopes are not added. BE00 limits details to 16 keys, four nesting levels and 8 KiB.

### Contract Registry

| Operation ID | Request schema and source fields | Success schema and exact status | Global failure shape |
|---|---|---|---|
| BE24B-GHO03 | Gho03Request: actingPartyId, optional readable contextRef, ordered initialMembers, expectedVersion, idempotencyKey and requestId | Gho03Success, 201; RigResource plus first RigVersionResource, no partial aggregate | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE24B-GHO04 | Gho04Request: rigId, one exact-kind member, expectedVersion, idempotencyKey and requestId | Gho04Success, 201; new version plus member and unresolved flag | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE24B-GHO05 | Gho05Request: pinned rigVersionId, targetVersionId, optional regionStandardVersion, idempotencyKey and requestId | Gho05Success, 201; immutable advisory findings, coverage and freshness | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE24B-GHO06 | Gho06Request: pinned rigVersionId, purpose, grant IDs, technical-data choice, idempotencyKey and requestId | Gho06Success, 201; immutable disclosure-filtered source snapshot | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |

### Error Registry

| Operation ID | HTTP and code | Trigger | Safe details and recovery |
|---|---|---|---|
| BE24B-GHO03 | 400 INVALID_REQUEST or 422 VALIDATION_FAILED | Malformed UUID/version/name/member union, unknown key or limit violation | BE00 FieldViolation rows only; retry after correcting input |
| BE24B-GHO03 | 401 UNAUTHENTICATED or 403 FORBIDDEN | Missing session, acting-party role absent, or context not readable | Reauthenticate or request the registered role; no party/context existence detail |
| BE24B-GHO03 | 404 NOT_FOUND or 409 VERSION_MISMATCH | Concealed party/context or stale expectedVersion | Concealed target returns {}; authorized version conflict returns expected/current decimal versions |
| BE24B-GHO04 | 400 INVALID_REQUEST or 422 MEMBER_REFERENCE_INVALID | Kind/reference cardinality invalid, placeholder has specs, or referenced record is not canonical | Field violations; no record label or owner data |
| BE24B-GHO04 | 403 FORBIDDEN or 404 NOT_FOUND | Actor lacks rig edit or custody/record reference is concealed | Known rig without edit capability is 403; absent/concealed rig or record is 404 |
| BE24B-GHO04 | 409 VERSION_MISMATCH or 422 PLACEHOLDER_REQUIRED | Rig changed, member version raced, or record became unavailable during CAS | Re-read rig; retry with new version; placeholder replacement may be submitted explicitly |
| BE24B-GHO05 | 403 FORBIDDEN or 404 NOT_FOUND | Rig/target not readable under acting context | No target existence or private reference detail |
| BE24B-GHO05 | 409 VERSION_MISMATCH or 422 TARGET_UNAVAILABLE | Source version changed or target is unavailable/stale at evaluation | Return typed targetState and no positive verdict; caller may retry |
| BE24B-GHO05 | 502 DEPENDENCY_UNAVAILABLE | Reference provider or source projection exceeded its bounded deadline | dependencyClass, retryable true and retryAfterSeconds; no provider payload |
| BE24B-GHO06 | 403 FORBIDDEN or 404 NOT_FOUND | Export capability, rig visibility or purpose scope absent | No grant graph or private record existence detail |
| BE24B-GHO06 | 409 VERSION_MISMATCH | Rig version or disclosure grant changed before snapshot commit | Re-read and submit a new pinned export request |
| BE24B-GHO06 | 422 DISCLOSURE_REQUIRED or EXPORT_NOT_READY | Held identity lacks accepted grant, safe source is unavailable, or required purpose field is unknown | Return masked member and bounded gap codes; never reveal withheld values |
| All | 429 RATE_LIMITED, 503 DEPENDENCY_UNAVAILABLE or 500 INTERNAL_ERROR | Route quota/dependency/system failure | BE00 Retry-After and rate headers where applicable; no stack, SQL or source payload |

### Authorization and Middleware Registry

| Operation ID | Authentication and role | Ownership/purpose predicate and 403-vs-404 | Middleware, including CORS |
|---|---|---|---|
| BE24B-GHO03 | Verified Supabase session; owner/controller of acting person or entity with gear.rig.create | Shard 01 resolves actingPartyId and entity role; optional context must be readable. Known actor without role is 403; absent/revoked/concealed party or context is 404 | Route inventory/request ID; TLS and body/header limits; CORS policy gear-api with explicit web/PWA origins, credentials only for allowlisted origins, no wildcard, Vary Origin; session; acting-context resolution; strict Zod; capability/RLS; BE00 idempotency/CAS; rig transaction; response/error normalization; sanitized audit/trace |
| BE24B-GHO04 | Verified session; rig controller/delegated editor, or confirmed holder only for a custody-authorized operational member | Rig belongs to acting party; record is readable or custody is active with allowed purpose. Known rig without edit capability is 403; concealed rig/record/custody is 404 | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins and no credential wildcard; Supabase session; Shard 01 context; strict Zod union; per-reference authority and grant check; BE00 idempotency/CAS; member transaction; event/outbox; normalized response; redacted audit |
| BE24B-GHO05 | Verified session; reader of the rig and target/reference versions in the acting context | Every pinned source is authorized before evaluation. Known resource outside scope is 403; absent/concealed resource is 404; stale state is a typed success state only after authorized read | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins, credentials allowlist, no wildcard, Vary Origin; session/context; strict Zod; source-version authorization; compatibility policy; BE00 idempotency; evaluation transaction; event/outbox; normalized response/error; trace |
| BE24B-GHO06 | Verified session; rig export capability for owner/controller/delegated producer; recent step-up for insurance_review | Each member disclosure is checked for owner grant, audience, term and revocation. Known caller without purpose grant is 403; concealed rig/member/grant is 404; missing grant is 422 only after the rig is authorized | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins, credentials allowlist, no wildcard, Vary Origin; session and step-up where required; context; strict Zod; grant/purpose/RLS check; BE00 idempotency/CAS; snapshot transaction; audit/outbox; response/error normalization; no original-media access |

### Idempotency and Concurrency Registry

| Operation ID | Idempotency contract | Version/race handling | Atomicity and replay |
|---|---|---|---|
| BE24B-GHO03 | Idempotency-Key is 8–128 printable ASCII, scoped by actor, operation and acting party; normalized Gho03Request hash stored in BE00 idempotency_records for 30 days | expectedVersion is null for a new rig or must match the resolved acting-party aggregate; unique rig name is not used as identity | Reserve, rig, first version, audit, gear.rig_version_saved.v1 and replay result commit in one RPC. Same hash replays byte-equivalent Gho03Success; different hash returns IDEMPOTENCY_MISMATCH |
| BE24B-GHO04 | Key binds actor, rig, expectedVersion and member payload; record/custody/placeholder reference is part of the hash | PostgreSQL CAS on Rig.version and insertion of the next RigVersion; concurrent edit returns VERSION_MISMATCH without a second member | Member row, new version, unresolved event if needed, audit, outbox and idempotency response commit together. Replay does not append another version |
| BE24B-GHO05 | Key binds actor, rigVersionId, targetVersionId, region reference and contract version | All source versions are re-read in one transaction; a changed source returns a typed conflict or unavailable result, never mixed findings | CompatibilityRun and event are written with reserved idempotency result. Same request replays identical findings and source versions |
| BE24B-GHO06 | Key binds actor, rigVersionId, purpose, exact sorted grant IDs and technical-data choice; grant IDs are not trusted without revalidation | Rig and grants are locked/read at one source version; grant revocation before commit causes DISCLOSURE_REQUIRED and no export | Export snapshot, gap rows, audit, outbox if registered and replay result commit atomically. Prior snapshots remain immutable |

### Rate, CORS and SLO Registry

| Operation ID | Rate limit and concurrency | CORS policy | Deadline and SLO |
|---|---|---|---|
| BE24B-GHO03 | 60 requests/minute/user, 120/minute/party, burst 20/10 seconds; max 4 concurrent rig mutations/party | gear-api allowlist only; explicit origins, credentials only for allowlisted origins, OPTIONS exposes registered methods/headers, Vary Origin | 15 second hard deadline; p95 under 1,200 ms when dependencies are healthy; no provider call in request transaction |
| BE24B-GHO04 | 60/minute/user, 120/minute/party, burst 20/10 seconds; max 8 concurrent member edits/rig | gear-api allowlist only; no wildcard credentials and no private response headers exposed | 15 second hard deadline; p95 under 1,200 ms; stale conflict is returned before timeout |
| BE24B-GHO05 | 30/minute/user, 60/minute/party, burst 10/10 seconds; max 2 active evaluations/actor | gear-api allowlist only; response is no-store and does not expose source secrets | 15 second hard deadline; p95 under 2,000 ms; dependency budget is 3,000 ms and produces explicit unavailable state |
| BE24B-GHO06 | 10/minute/user, 20/minute/party, burst 4/10 seconds; max 2 active exports/actor and 200 members/export | gear-api allowlist only; no original-object URLs or private headers exposed | 15 second command deadline; p95 under 2,000 ms for a 200-member snapshot; large rendering is downstream and asynchronous |

### Observability Registry

| Operation ID | Trace and metrics | Audit and redaction |
|---|---|---|
| BE24B-GHO03 | Span includes operation ID, requestId, correlationId, acting-party hash, context kind, member count and source versions. Metrics cover created, rejected, replayed, forbidden, conflict, latency and unresolved count | Audit actor/party/rig hashes, purpose, result, member kinds and version. Never log labels, serials, custody IDs, private context IDs or specs |
| BE24B-GHO04 | Span includes operation ID, rig/version hashes, member kind, source state and CAS result. Metrics cover append, placeholder, inaccessible, conflict and event lag | Audit reference digest, kind, order, reason and outcome. Mask gear labels, owner identity, grant details and exact technical data |
| BE24B-GHO05 | Span includes operation ID, run ID, pinned version hashes, target state, checked/unchecked counts and evaluator version. Metrics cover findings by severity/dimension, stale targets, unavailable dependencies and p95 | Audit actor/rig/target hashes, policy version, counts and outcome. Do not log compatibility source payload, private dimensions or addresses |
| BE24B-GHO06 | Span includes operation ID, export ID, purpose, rig/version hashes, grant count, masked count, gap count and source age. Metrics cover export ready/masked/withheld, missing grants, replay and latency | Audit actor, purpose, source versions, grant decision codes and counts. Never log serial, value, exact location, original object key or private note |

## Database Schema

All tables are in protected schemas, have enabled and forced RLS, and are reachable only through named RPCs or security-invoker projections. Every mutable row carries a positive version and correlation ID. Direct anon and authenticated table grants are denied. Service credentials are not an authorization shortcut.

### Complete Table Definitions

| Table / model | Columns with SQL type, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.gear_rigs / Rig | id uuid NOT NULL PK DEFAULT gen_random_uuid(); acting_party_id uuid NOT NULL FK identity.party(id); context_kind text NULL CHECK context_kind IN ('project','tour','production'); context_id uuid NULL; context_version bigint NULL CHECK context_version>0; name text NOT NULL CHECK char_length(name) BETWEEN 1 AND 120; status gear_rig_status NOT NULL CHECK IN ('draft','active','archived'); current_version_id uuid NULL; version bigint NOT NULL DEFAULT 1 CHECK version>0; created_by uuid NOT NULL FK auth.users(id); correlation_id uuid NOT NULL; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK ((context_kind IS NULL AND context_id IS NULL AND context_version IS NULL) OR (context_kind IS NOT NULL AND context_id IS NOT NULL AND context_version IS NOT NULL)) | PK; acting_party_id,status,updated_at DESC,id; context_id,context_version; unique acting_party_id,name where status <> 'archived' | Forced RLS. Controller or delegated gear.rig.create/edit RPC may insert/read its party rows; context resolver may read only version metadata; Queue may mark archived through a lease RPC. anon/authenticated direct SELECT/INSERT/UPDATE/DELETE denied; service role named migration/runbook only |
| platform_private.gear_rig_versions / RigVersion | id uuid NOT NULL PK DEFAULT gen_random_uuid(); rig_id uuid NOT NULL FK platform_private.gear_rigs(id); version_no bigint NOT NULL CHECK version_no>0; state rig_version_state NOT NULL CHECK IN ('draft','active','superseded'); member_count integer NOT NULL CHECK member_count BETWEEN 0 AND 200; unknown_member_count integer NOT NULL CHECK unknown_member_count BETWEEN 0 AND member_count; ordered_member_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[]; source_versions jsonb NOT NULL CHECK jsonb_typeof(source_versions)='array'; context_snapshot jsonb NULL CHECK context_snapshot IS NULL OR jsonb_typeof(context_snapshot)='object'; source_digest bytea NOT NULL CHECK octet_length(source_digest)=32; created_by uuid NOT NULL FK auth.users(id); correlation_id uuid NOT NULL; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); UNIQUE (rig_id,version_no); UNIQUE (rig_id,source_digest) | PK; rig_id,version_no DESC; rig_id,state,created_at DESC; GIN ordered_member_ids | Forced RLS. Rig controller/authorized holder reads through version RPC; insert only the rig transaction; no UPDATE/DELETE after commit; Queue invalidation reads IDs/versions only; direct role grants denied |
| platform_private.gear_rig_members / RigMember | id uuid NOT NULL PK DEFAULT gen_random_uuid(); rig_version_id uuid NOT NULL FK platform_private.gear_rig_versions(id); kind rig_member_kind NOT NULL CHECK IN ('record','confirmed_held','placeholder'); gear_record_id uuid NULL FK platform_private.gear_records(id); custody_id uuid NULL FK platform_private.custody_intervals(id); placeholder_code text NULL CHECK placeholder_code ~ '^[A-Z0-9_-]{1,64}$'; member_order integer NOT NULL CHECK member_order BETWEEN 0 AND 9999; role text NOT NULL CHECK char_length(role) BETWEEN 1 AND 80; connection text NULL CHECK char_length(connection)<=120; placement text NULL CHECK char_length(placement)<=120; specs jsonb NULL CHECK specs IS NULL OR jsonb_typeof(specs)='object'; source_state source_state NOT NULL CHECK IN ('known','unknown','withheld','not_applicable'); version bigint NOT NULL DEFAULT 1 CHECK version>0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK ((kind='record' AND gear_record_id IS NOT NULL AND custody_id IS NULL AND placeholder_code IS NULL) OR (kind='confirmed_held' AND gear_record_id IS NOT NULL AND custody_id IS NOT NULL AND placeholder_code IS NULL) OR (kind='placeholder' AND gear_record_id IS NULL AND custody_id IS NULL AND placeholder_code IS NOT NULL AND specs IS NULL)); UNIQUE (rig_version_id,member_order) | PK; rig_version_id,member_order; gear_record_id,created_at DESC; custody_id where custody_id IS NOT NULL; placeholder_code where kind='placeholder' | Forced RLS inherited through RigVersion/Rig controller; no public read; authorized write only during version transaction; immutable after commit; direct table grants denied |
| platform_private.gear_compatibility_runs / CompatibilityRun | id uuid NOT NULL PK DEFAULT gen_random_uuid(); rig_version_id uuid NOT NULL FK platform_private.gear_rig_versions(id); target_version_id uuid NOT NULL FK platform_private.compatibility_targets(id); region_standard_version bigint NULL CHECK region_standard_version>0; evaluator_version text NOT NULL CHECK char_length(evaluator_version) BETWEEN 1 AND 64; advisory_state compatibility_state NOT NULL CHECK IN ('findings','no_findings','unchecked','unavailable'); findings jsonb NOT NULL CHECK jsonb_typeof(findings)='array'; checked_member_count integer NOT NULL CHECK checked_member_count>=0; unchecked_member_count integer NOT NULL CHECK unchecked_member_count>=0; coverage_ratio numeric(9,6) NOT NULL CHECK coverage_ratio BETWEEN 0 AND 1; target_state target_freshness NOT NULL CHECK IN ('current','stale','unavailable'); target_observed_at timestamptz NULL; source_versions jsonb NOT NULL CHECK jsonb_typeof(source_versions)='array'; version bigint NOT NULL DEFAULT 1 CHECK version>0; actor_id uuid NOT NULL FK auth.users(id); acting_party_id uuid NOT NULL FK identity.party(id); correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK (checked_member_count>=0 AND unchecked_member_count>=0) | PK; rig_version_id,created_at DESC,id; target_version_id,created_at DESC; acting_party_id,created_at DESC; advisory_state,target_state | Forced RLS. Reader of both pinned sources may read bounded run; insert only named compatibility RPC; immutable findings; direct grants denied; no public or booking-role mutation |
| platform_private.gear_rig_export_snapshots / RigExportSnapshot | id uuid NOT NULL PK DEFAULT gen_random_uuid(); rig_version_id uuid NOT NULL FK platform_private.gear_rig_versions(id); purpose export_purpose NOT NULL CHECK IN ('private_operations','production_planning','advancing_source','insurance_review'); source_versions jsonb NOT NULL CHECK jsonb_typeof(source_versions)='array'; members jsonb NOT NULL CHECK jsonb_typeof(members)='array'; gap_codes text[] NOT NULL DEFAULT ARRAY[]::text[]; advisory_requirements text[] NOT NULL DEFAULT ARRAY[]::text[]; masked_member_count integer NOT NULL CHECK masked_member_count>=0; withheld_member_count integer NOT NULL CHECK withheld_member_count>=0; state export_state NOT NULL CHECK IN ('ready','gap','withheld'); version bigint NOT NULL DEFAULT 1 CHECK version>0; actor_id uuid NOT NULL FK auth.users(id); acting_party_id uuid NOT NULL FK identity.party(id); correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK cardinality(gap_codes)<=200 AND cardinality(advisory_requirements)<=200 | PK; rig_version_id,created_at DESC,id; acting_party_id,purpose,created_at DESC; state,created_at DESC | Forced RLS. Caller with rig and purpose capability reads own bounded snapshot; Shard 32 adapter reads through a grant-scoped RPC; no public access; immutable after commit; direct grants denied |

platform_private.custody_intervals is the 24d-owned target of the RigMember custody_id FK; its exact lifecycle, RLS and grant rules remain authoritative in 24d. platform_private.compatibility_targets is a reference-provider boundary with immutable version rows; this companion never mutates target truth.

### Index and Constraint Invariants

| Invariant | Enforcement |
|---|---|
| One ordered position per RigVersion | Unique rig_version_id,member_order and a transaction check that member orders are contiguous from zero |
| Exactly one member reference kind | RigMember CHECK plus application Zod union; an inaccessible record can only be appended as placeholder |
| Version immutability | UPDATE/DELETE revoked from application roles; a new member always creates a new RigVersion |
| Advisory result integrity | coverage_ratio is between zero and one; checked and unchecked counts are nonnegative; findings retain severity and dimension |
| Export disclosure | Snapshot member rows store disclosure state; source versions and gap codes are immutable; no original object key is persisted |
| Context ownership | context_id/context_version are validated by Shard 01 and named context RPC; context never becomes acting_party_id |

### Permission and RLS Matrix

| Model | Anonymous | Authenticated acting party | Confirmed holder | Queue/consumer | Operator/service |
|---|---|---|---|---|---|
| Rig | deny | controller/delegated party through named RPC | read and edit only when delegated | read IDs/versions for invalidation | named runbook only |
| RigVersion | deny | same party as Rig; historical versions read-only | relevant version for allowed operation | read source versions | no direct mutation |
| RigMember | deny | same party; record details from Shard 23 policy | confirmed custody slice, no title/grant escalation | may flag unresolved by registered event RPC | no direct access |
| CompatibilityRun | deny | reader of all pinned sources | no broader than parent rig authority | may invalidate/recompute via registered lease | bounded evidence capability only |
| RigExportSnapshot | deny | caller with purpose capability and grant checks | only allowed purpose and own custody scope | Shard 32 reads scoped snapshot | insurance_review requires step-up and reason |

Every RPC repeats actor, acting party, relationship, target version and grant predicates. Realtime payloads contain only IDs, versions, event hints and gap counts; clients refetch canonical projections.

## Middleware & Policies

### Hono Order and Security

1. Route inventory matches one method/path and assigns the registered operation ID; client-supplied operation IDs are ignored.
2. Request context validates or replaces X-Request-Id, starts correlation, applies TLS/security headers, enforces 256 KiB JSON/body limits and runs CORS policy gear-api. OPTIONS exposes only registered methods and headers.
3. Supabase session verification runs before acting-context resolution. User IDs and party IDs in a request are inputs to compare, never authority.
4. Shard 01 resolves acting party, role, mandate and context read scope. A service credential cannot satisfy this predicate by itself.
5. Strict Zod parses path, headers and body; unknown keys, malformed Unicode, non-finite numbers and invalid version strings fail before resource lookup.
6. Domain authorization checks rig ownership/delegation, source visibility, custody state, disclosure grant subject/audience/term, purpose and step-up freshness.
7. BE00 idempotency and expected-version CAS reserve the request and run with the domain transaction. Provider or object calls never run inside the transaction.
8. Success output is parsed again; ETag is the strong quoted decimal resource version; error mapping returns BE00 ApiError and no stack/database detail.
9. Completion emits one sanitized audit record, metrics and trace span. Queue dispatch is best effort after commit; lease sweeper recovers undispatched events.

### Policy Rules

| Policy | Enforced behavior |
|---|---|
| Rig owner | acting person or organisation owns the rig; project/tour context is a reference only |
| Ordered continuity | A member removed by transfer, loss or unavailability is represented by an explicit placeholder in the next live version; historical versions are untouched |
| Compatibility advisory | No endpoint returns a bare compatible boolean; advisoryState, findings, unchecked count, target state and coverage are always present |
| Export disclosure | A held item identity is included only when an accepted public_disclosure or purpose-specific grant matches the export; otherwise use a non-identifying placeholder |
| Source-state honesty | known, unknown, withheld and not_applicable are represented as values, never by omission |
| Privacy | Safe labels/media are fetched through 24a/BE00 projection; serials, private values, exact locations and hidden history never enter this companion's public response |
| Offline edits | A stale expected version returns a conflict; caller retries against current state, and removed facts remain in historical snapshots |

## Data Flow

### 24.03 Create rig

1. Validate Gho03Request and derive RequestContext from the verified session.
2. Resolve acting party and optional context version. Reject invalid or unreadable context before reserving idempotency.
3. Reserve BE00 idempotency using the canonical request hash. A matching completed binding replays the stored success.
4. In one PostgreSQL RPC insert Rig, RigVersion and each valid RigMember. Validate all record references, custody grants and placeholder unions.
5. Write AuditEvent and gear.rig_version_saved.v1 outbox row with aggregateVersion equal to the committed RigVersion.
6. Commit, return Gho03Success and enqueue the outbox ID. If commit fails, no rig/version/event exists and the same key can retry.

### 24.04 Add rig member

1. Validate rigId, exact member union, idempotency key and strong If-Match/expectedVersion.
2. Resolve rig access. Read the canonical record from Shard 23, or the 24d custody interval and accepted operational grant for confirmed_held.
3. If the record is inaccessible, unavailable or transferred, require explicit placeholder input; do not reveal why a hidden record was rejected.
4. Lock the Rig row, assert expected version, copy the old ordered members, append the new member, and insert a new immutable RigVersion.
5. Emit gear.rig_version_saved.v1 and gear.rig_member_unresolved.v1 when the member is a placeholder derived from a source event; both are transactionally linked to the version.
6. Return the new version with unresolved and sourceState fields. A race returns VERSION_MISMATCH without deleting the prior version.

### 24.05 Run compatibility check

1. Validate pinned rigVersionId, targetVersionId and optional regionStandardVersion.
2. Authorize both source aggregates, then read exact versions. No latest-version substitution is allowed.
3. Invoke the bounded compatibility evaluator with normalized member signal data. Sort findings by voltage, connector, physical, format, then stable subject ID.
4. Exclude placeholders and unknown specs from a positive conclusion, increment uncheckedMemberCount and keep those members equally prominent.
5. Persist immutable CompatibilityRun with evaluator version, target freshness, source versions and advisory state; emit gear.compatibility_run_completed.v1.
6. Return 201 even for an advisory unavailable result when the evidence itself was stored. A dependency timeout maps to DEPENDENCY_UNAVAILABLE only when no evidence row could be committed.

### 24.06 Export rig source data

1. Validate purpose, pinned rig version, grant ID list and technical-source choice.
2. Authorize the rig and each requested grant. Grants are re-read by subject, purpose, audience, term and revocation state.
3. Read safe labels, condition and logistics facts through named projections. Serial, exact location and private values are withheld unless the purpose-specific owner policy explicitly permits a source field.
4. Emit each member as full, masked, withheld or not_applicable. Unknown source fields create gap codes rather than empty known values.
5. Insert immutable RigExportSnapshot with source versions, gap codes, advisory requirements and disclosure counts; emit registered outbox evidence for downstream Shard 32 consumption.
6. Return Gho06Success. Shard 32 decides layout, delivery, stage plot and carnet processing; it cannot mutate this snapshot.

## State Machines, Concurrency and Failure Recovery

### Rig state

| State | Allowed transition | Guard and recovery |
|---|---|---|
| draft | draft to active | First valid version and acting-party authority exist; failure leaves draft absent or unchanged |
| active | active to active | Every member edit creates a new RigVersion and increments version |
| active | active to archived | Controller or governed retention operation; historical versions remain readable within retention |
| archived | terminal | No member or context mutation; export of an archived rig is allowed only for an authorized historical purpose |

### RigVersion state

| State | Allowed transition | Guard and recovery |
|---|---|---|
| draft | draft to active | All ordered members pass exact union and source-state checks |
| active | active to superseded | A later version commits through CAS |
| superseded | terminal | Never updated or deleted; source versions preserve historical truth |

### Compatibility and export states

| Aggregate | State | Meaning |
|---|---|---|
| CompatibilityRun | findings | One or more advisory findings, with counts and source freshness |
| CompatibilityRun | no_findings | No known finding among checked members; unchecked count and scope remain visible |
| CompatibilityRun | unchecked | Insufficient source/member coverage; not a pass |
| CompatibilityRun | unavailable | Target/reference unavailable or stale; no automatic booking decision |
| RigExportSnapshot | ready | Purpose-required fields and grants are present |
| RigExportSnapshot | gap | Snapshot is usable as source evidence but has explicit missing/advisory fields |
| RigExportSnapshot | withheld | One or more required identities are withheld; masked placeholders preserve shape |

### Failure and race matrix

| Scenario | Detection | Recovery |
|---|---|---|
| Transfer while member append commits | Shard 23 source version or transfer event changes during CAS | Transfer wins; retry against current record or append placeholder; prior RigVersion remains |
| Custody confirmation and revocation cross | 24d aggregate version differs from the grant read | Reject stale export/member append; re-read and require active accepted custody |
| Context loses readability | Shard 01 context version check fails | Abort atomically; no rig/version is created |
| Compatibility target goes stale | targetObservedAt/freshness threshold fails | Store stale/unavailable advisory state; no positive verdict or booking block |
| Placeholder appears in run | member kind is placeholder or specs unknown | Count as unchecked; retain equal-prominence coverage gap |
| Export grant revoked during commit | grant version/purpose predicate fails | Roll back snapshot and return DISCLOSURE_REQUIRED; no partial member rows |
| Queue dispatch crashes after commit | outbox lease expires | Sweeper retries with event ID; consumer dedupes by event ID and source version |
| Same key concurrent requests | unique BE00 idempotency row serializes | One transaction commits; all matching callers replay exact result |

## External Seams

Every seam has an adapter contract. The adapter receives a correlation ID, never receives a browser token, and returns typed unavailable/unknown outcomes rather than throwing provider details into the API.

| Seam | Exact request | Exact response | Timeout, retry and circuit |
|---|---|---|---|
| BE00 command admission | operationId, actorId, actingPartyId, targetHash, requestHash, idempotencyKeyHash, expectedVersion, correlationId | reserved with reservationId; replay with status/body hash; or IDEMPOTENCY_MISMATCH | 500 ms; 2 retries at 25 ms and 100 ms for connection reset only; open after 5 failures/30 s, half-open after 15 s; open maps to DEPENDENCY_UNAVAILABLE |
| Shard 01 acting context | user session subject, requested actingPartyId, capability, contextRef and purpose | resolved actor, party, role, mandate, contextVersion, decision and concealment flag | 800 ms; 2 retries at 50 ms and 150 ms for transport failures; circuit opens after 5/30 s and half-opens after 15 s; open fails closed as DEPENDENCY_UNAVAILABLE |
| Shard 23 identity projection | gearRecordId list, requested sourceVersion, actingPartyId, purpose and correlationId | per-record safe label, recordVersion, owner relation, availability, sourceState and condition reference; no hidden fields | 1,200 ms; 2 retries at 50 ms and 200 ms for read-only reset; circuit opens after 5/30 s, half-open 20 s; unavailable members become typed gaps |
| Shard 24d custody/grant read | custodyId or gearRecordId, actingPartyId, purpose, audience, asOf and expectedVersion | custody state/version, owner/holder relation, accepted grants with scope/term/revocation and decision | 1,000 ms; 2 retries at 50 ms and 150 ms; circuit opens after 5/30 s and half-opens after 15 s; no authority on open |
| Compatibility evaluator | evaluatorVersion, rigVersionId, normalized member signals, targetVersionId, regionStandardVersion, correlationId | findings array, severity/dimension, checked/unchecked counts, coverageRatio, targetState, targetObservedAt | 3,000 ms; 1 retry at 100 ms only before evaluation starts; circuit opens after 5/60 s and half-opens after 30 s; timeout returns unavailable evidence or 502 if no row |
| BE00 safe rendition/object | object IDs, safe-purpose, media policy version, actor/party scope and correlationId | safe rendition ID, reviewState, redactionVersion, mediaType, checksum, bytes metadata; never original key | 1,000 ms; 2 retries at 50 ms and 150 ms for read-only calls; circuit opens after 5/30 s, half-opens 15 s; uncertain rendition blocks disclosure |
| BE00 outbox/Queue lease | eventId, eventType, aggregateId/version, payload digest, lease token | accepted queue ID or leased/unleased result | 500 ms; 2 retries at 25 ms and 100 ms; circuit opens after 5/30 s, half-opens 15 s; committed event remains for sweeper |

No external call runs inside the canonical transaction. An ambiguous evaluator or rendition response is persisted as pending/unavailable evidence, keyed by the same idempotency request, and is never silently retried as a second effect.

## Events and Async Consumers

### Event envelope

| Event type | Required payload | Emission rule |
|---|---|---|
| gear.rig_version_saved.v1 | rigId, rigVersionId, priorVersion, memberCount, unknownMemberCount, actor and context hashes | Inserted with Gho03/Gho04 version transaction; aggregateVersion equals RigVersion.version_no |
| gear.rig_member_unresolved.v1 | rigId, rigVersionId, memberId, reason, sourceEventId, actor and correlation IDs | Emitted only when a live usable reference is replaced by placeholder; historical versions are not rewritten |
| gear.compatibility_run_completed.v1 | runId, rigVersionId, targetVersionId, evaluatorVersion, advisoryState, severity counts, coverage, unchecked count and targetState | Inserted with CompatibilityRun; immutable source versions let consumers re-read |

### Consumer obligations

| Consumer | Event/input | Required behavior |
|---|---|---|
| Rig invalidation worker | gear.collection_item_published.v1, gear.register_line_changed.v1, gear.condition_reported.v1 | Mark derived labels/technical context stale and prompt an explicit new version; never mutate canonical Shard 23 or condition evidence |
| Custody reconciliation worker | gear.custody_changed.v1 | Re-evaluate affected member references; append a placeholder version when authority is lost and emit gear.rig_member_unresolved.v1 |
| Case/manifest readiness | gear.case_membership_changed.v1, gear.readiness_gap_changed.v1 | Mark new export stale; keep existing RigExportSnapshot and ManifestSnapshot immutable |
| Compatibility invalidation | source version changes and gear.rig_version_saved.v1 | Do not rewrite prior CompatibilityRun; next request pins new versions |
| Shard 32 advancing adapter | RigExportSnapshot through grant-scoped read and gear.compatibility_run_completed.v1 | Consume IDs/versions/gaps; choose document layout and request refresh when source versions changed |

Consumers claim work with a lease, dedupe by eventId and aggregateVersion, re-read RLS-authorized canonical rows, and acknowledge only after the effect is durable. Failed effects remain retryable with bounded backoff.

## Error Handling

### Boundary Matrix

| Operation ID | Boundary | Required result |
|---|---|---|
| BE24B-GHO03 | Transport/schema | 400 INVALID_REQUEST or 422 VALIDATION_FAILED in BE00 ErrorResponse; no lookup or mutation |
| BE24B-GHO03 | Identity/context | 401 UNAUTHENTICATED, 403 FORBIDDEN or concealment-safe 404; no acting-party detail |
| BE24B-GHO04 | Member source | 422 MEMBER_REFERENCE_INVALID or PLACEHOLDER_REQUIRED; no owner or serial leakage |
| BE24B-GHO04 | CAS/idempotency | 409 VERSION_MISMATCH or IDEMPOTENCY_MISMATCH; prior version remains |
| BE24B-GHO05 | Source/evaluator | typed unavailable/stale advisory result or 502 DEPENDENCY_UNAVAILABLE; never a false pass |
| BE24B-GHO06 | Disclosure/purpose | 403 FORBIDDEN for missing capability; 422 DISCLOSURE_REQUIRED after authorized rig read; masked snapshot only |
| All | Quota/system | 429 RATE_LIMITED or 500/503 typed BE00 failure with no stack/provider payload |

### Error invariants

- Every handler returns ErrorResponse containing BE00 ApiError { code, message, requestId, details } and no alternate failure shape.
- NOT_FOUND details are empty for concealed resources. FORBIDDEN names only a safe reason code and recovery action.
- A stale source is not mapped to success with a positive compatibility guarantee. The typed state remains in the success body.
- A disclosure gap never reveals which grant, owner or private field is missing beyond the bounded gap code allowed for the caller.
- Transaction failure cannot return a created rig/version/run/export. Queue or evaluator failure cannot create a second canonical effect.
- Logs and events are scrubbed before serialization; exact records, serials, private context and object keys are excluded.

## Testing Strategy

### Contract and route tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE24B-CON-001 | BE24B-GHO03, BE24B-GHO04 | Zod 4 accepts only strict schemas, rejects unknown keys, malformed UUID/version, invalid member union, unsafe strings and over-limit arrays |
| BE24B-CON-002 | BE24B-GHO05 | Findings schema requires advisoryState, counts, coverage, targetState and source versions; a bare compatible boolean is rejected |
| BE24B-CON-003 | BE24B-GHO06 | Export schema preserves disclosure and sourceState per member, gap codes and advisory requirements; serial/private value fields cannot be added |
| BE24B-ROUTE-001 | All | Method/path registry dispatches only the four routes; wrong method, duplicate operation ID and undocumented route fail |
| BE24B-ERR-001 | All | Every failure parses as ErrorResponse with BE00 ApiError { code, message, requestId, details }; RFC envelope extras fail |

### Authorization and privacy tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE24B-AUTH-001 | BE24B-GHO03 | Correct person/entity controller succeeds; wrong valid user is 403; absent/concealed party and unreadable context are disclosure-safe 404 |
| BE24B-AUTH-002 | BE24B-GHO04 | Confirmed custody permits only allowed operational reference; pending/stale/disputed custody cannot create a confirmed-held member |
| BE24B-AUTH-003 | BE24B-GHO05 | Caller must read both exact source versions; target absence is 404 and target staleness is explicit advisory state |
| BE24B-AUTH-004 | BE24B-GHO06 | Accepted disclosure grant is checked for subject, purpose, audience, term and revocation; missing grant masks identity and never leaks owner details |
| BE24B-PRIV-001 | All | Serial, exact location, private value, hidden history, original media key and private context never appear in success, errors, logs, events or realtime hints |
| BE24B-CORS-001 | All | CORS policy gear-api permits only configured origins, disallows wildcard credentials, emits Vary Origin and exposes only registered methods/headers |

### Persistence, idempotency and concurrency tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE24B-DB-001 | All | Migration tests cover SQL types, nullability, CHECK constraints, FKs, unique/index definitions, forced RLS, exposed-schema grants and denied direct table access |
| BE24B-DB-002 | BE24B-GHO03, BE24B-GHO04 | Concurrent same-version member edits yield one commit and one VERSION_MISMATCH; no partial RigVersion or dangling member |
| BE24B-IDEM-001 | All | Same key/body returns byte-equivalent result; same key/different body returns IDEMPOTENCY_MISMATCH; rollback leaves no reservation |
| BE24B-SNAP-001 | BE24B-GHO05, BE24B-GHO06 | Later source edits never mutate a saved CompatibilityRun or RigExportSnapshot; source version comparison requests refresh |
| BE24B-RLS-001 | All | Anonymous, wrong party, forged acting party, revoked mandate, service credential misuse and over-disclosure are denied |

### Domain and seam tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE24B-DOM-001 | BE24B-GHO03, BE24B-GHO04 | Context remains non-owner; order is contiguous; placeholder is the only valid representation of an inaccessible/unavailable member |
| BE24B-DOM-002 | BE24B-GHO05 | Finding sort order is deterministic; placeholders and unknown specs increment unchecked count; stale target cannot become no_findings |
| BE24B-DOM-003 | BE24B-GHO06 | Each purpose enforces required grants and field disclosure; unknown/withheld/not_applicable states survive serialization |
| BE24B-SEAM-001 | All | BE00, Shard 01, Shard 23 and 24d adapters honor exact request/response, timeout, retry and circuit contracts; no browser token crosses seam |
| BE24B-FAIL-001 | All | Dependency timeout, outbox crash, worker lease expiry and committed-disconnected replay recover with bounded retries and no duplicate effect |

### Event, recovery and accessibility-support tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE24B-EVT-001 | BE24B-GHO03, BE24B-GHO04, BE24B-GHO05 | Exact event types, envelope fields, aggregate versions, payload redaction and transactional outbox insertion are verified |
| BE24B-EVT-002 | BE24B-GHO04 | Transfer/custody event causes a new unresolved placeholder version; historical versions and source evidence remain |
| BE24B-REC-001 | All | Restore fence checks RLS, idempotency, outbox and snapshot integrity before re-enabling effects |
| BE24B-A11Y-001 | BE24B-GHO05, BE24B-GHO06 | Consumer projection order starts with textual advisory/gap summary, then findings/unchecked members; masked state has text labels and no color-only meaning |
| BE24B-PERF-001 | All | Route SLOs, body limits, member caps, evaluator budget, rate headers and no-store behavior are measured under concurrent load |

## Deepening Passes

| Pass | Result | Evidence |
|---|---|---|
| 1. Source classification | PASS | 24.03–24.06 are the complete rig/compatibility/export boundary from IA lines 49–52 and 70–73 |
| 2. Contract completeness | PASS | Four route entries, strict request/success schemas, bounded arrays, source states and BE00 error envelope are present |
| 3. Authorization | PASS | Acting party, context, source visibility, custody and grant predicates include explicit 403 versus 404 outcomes |
| 4. Privacy | PASS | Serial, location, value, private context and original media are excluded or purpose-gated; masked placeholders preserve shape |
| 5. Persistence | PASS | Five persistence tables list SQL types, nullability, constraints, FK targets, indexes, forced RLS and grants |
| 6. Concurrency | PASS | Idempotency, strong version CAS, immutable snapshots, transfer/custody races and outbox lease recovery are deterministic |
| 7. External seams | PASS | Every seam names exact request/response, timeout, retry ceiling/backoff and circuit behavior |
| 8. Events | PASS | Exact IA event names and parent envelope fields map to transactional producers and idempotent consumers |
| 9. Failure recovery | PASS | Typed unavailable/stale/gap outcomes prevent false compatibility, partial exports and duplicate effects |
| 10. Accessibility and operations | PASS | Text-first advisory/gap output, semantic labels, observability, restore and performance tests are specified |

## Ambiguity Gate

**PASS.** Evidence: IA interaction IDs 24.03, 24.04, 24.05 and 24.06 each map to exactly one route and one operation ID; Rig/RigVersion/RigMember/CompatibilityRun ownership is explicit; project/tour context is non-owning; placeholder, stale, unavailable, withheld and advisory outcomes are typed; custody and disclosure authority remain 24d-owned; Shard 32 owns document layout/carnet processing; all operation registries, persistence fields, seams and failure states are filled.

## Open Questions

None

## Dependency References

- Derives from [BE-00 platform contracts](00-infrastructure.md), especially the four-field ApiError, idempotency_records, outbox lease, forced RLS, Hono middleware order and ordinary command limits.
- Consumes [BE-23a identity and transfer contracts](23a-gear-identity-claims-transfers.md) and the canonical platform_private.gear_records relation; title and identity remain Shard 23 truth.
- Consumes 24d CustodyInterval and CustodyGrant through named read RPCs. This companion never creates or changes custody, grants, title or sale authority.
- Consumes 24a CollectionProjection and PublicGearProjection through safe projection/RPC boundaries. It does not duplicate collection/publication endpoints.
- Supplies Rig, RigVersion, RigMember, CompatibilityRun and RigExportSnapshot source evidence to Shard 32 advancing/planning; Shard 32 cannot mutate these rows.
- Supplies unresolved rig-member evidence to theft/condition/readiness consumers; downstream consumers refetch and cannot infer ownership or a booking guarantee.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Added BE24B-GHO03 through BE24B-GHO06 for rig creation, ordered member continuity, pinned advisory compatibility and disclosure-filtered source exports; added strict contracts, persistence, RLS, seams, events, tests and ambiguity evidence | /write-be-spec |
