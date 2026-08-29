# BE-24c — Organisation Registers, Condition and Public Backline

**Status:** Complete
**Backend surface:** Hono on Cloudflare Workers, Supabase PostgreSQL/RLS, transactional outbox, Cloudflare Queues
**Authority boundary:** Shard 24 owns organisation register lines, attributable condition evidence and the selected public backline projection. Shard 23 owns canonical gear identity; Shard 29 owns room and venue terms; 24a owns personal collection publication.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Classification | Multi-domain IA shard split; 24c owns register mode, condition append and public backline composition | BE index line 41 assigns registers/backline to 24c; IA interactions 24.07–24.09 at lines 53–55 and 74–76 |
| In-scope operations | Maintain organisation register, report condition, publish backline | IA source interactions lines 66–76; deep-dive Register and Condition Flow lines 31–39 |
| Canonical state | RegisterLine is identity or quantity mode; ConditionReport is append-only evidence; PublicBacklineProjection is a selected, versioned projection | IA models lines 118–120 and Typed Field Registry lines 137–139 |
| Boundary with 24a | 24a owns personal collection reads and item publication; this companion does not publish a personal item or expose a private aggregate | IA interactions 24.01–24.02 lines 47–48 and 68–69 |
| Boundary with 24b | 24b may consume condition and register events for rig source context; this companion does not edit rig membership or compatibility evidence | IA interactions 24.03–24.06 lines 49–52 |
| Boundary with 24d | 24d custody and manifest flows may consume condition projection; this companion does not infer custody, packing or logistics readiness | IA interactions 24.10–24.15 lines 56–61 |
| Non-goals | Choosing a tracking mode for the user, hiding condition, identifying a quantity unit, publishing serials/prices/posture, room availability or booking truth | IA decisions lines 31–32; edge cases lines 212–218; dependency map lines 220–225 |

## Referenced Material Inventory

| Source file | Section and lines | Material consumed |
|---|---|---|
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Overview and scope lines 7–20 | Organisation register, condition, public backline and relationship to identity, possession and room domains |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Holdings Decisions lines 26–34 | Per-item privacy, identity/quantity mode, condition honesty, custody separation and no public serial/value/location |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Acceptance criteria lines 53–55 | Required auth, entity roles, append/conflict behavior and last-known-good backline recovery |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Interactions lines 66–76 | Exact IA interaction IDs, preconditions, success and failure semantics for 24.07–24.09 |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Command Contracts lines 94–95 | UpsertRegisterLine and AppendConditionReport input and mode/report invariants |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Data Models and Typed Field Registry lines 118–120 and 137–139 | RegisterLine, ConditionReport, PublicBacklineProjection fields, grades, cardinality and deterministic types |
| .memory/wiki/specs/ia/24-gear-holdings-operations.md | Access Control and Events lines 149–163 and 186–201 | Entity asset role, fault-report capability, public projection boundary and exact event envelopes |
| .memory/wiki/specs/ia/deep-dives/24-gear-holdings-operations.md | Register and Condition Flow lines 31–39 | Explicit mode choice, quantity fault counts, conflicts, freshness and service supersession |
| .memory/wiki/specs/ia/deep-dives/24-gear-holdings-operations.md | Disclosure Matrix lines 83–98 | Public condition disclosure, private value/serial restrictions and revocation behavior |
| .memory/wiki/specs/ia/deep-dives/24-gear-holdings-operations.md | Edge Cases lines 122–135 | Quantity booking threshold, condition conflict, public holding disclosure and logistics boundary |
| .memory/wiki/specs/be/00-infrastructure.md | Request/Response Contracts lines 112–153 | Zod 4 strictness, BE00 ApiError, exact error details and no generic error envelope |
| .memory/wiki/specs/be/00-infrastructure.md | Database and RLS lines 208–251 | Forced RLS, exposed-schema grants, audit/outbox/idempotency relations and negative tests |
| .memory/wiki/specs/be/00-infrastructure.md | Middleware and route archetypes lines 255–296 | Hono sequence, CORS allowlist, ordinary/high-risk limits and deadlines |
| .memory/wiki/specs/be/00-infrastructure.md | Protected transaction and deterministic protocol lines 300–353 | Atomic command transaction, CAS, idempotency hash and input ceilings |
| .memory/wiki/specs/be/23a-gear-identity-claims-transfers.md | Canonical identity contracts and persistence | gear_records FK and ownership/configuration source for identity register lines |
| .memory/wiki/specs/be/23c-service-component-history.md | Service lifecycle and event consumers | out_for_service state and supersession evidence used by condition composition |
| .memory/wiki/specs/be/23d-valuation-insurance-discography.md | Valuation disclosure boundary | Private value is never copied into a public backline projection |

The requested alias 24-gear-collections.md is absent. The sole canonical IA source used here is .memory/wiki/specs/ia/24-gear-holdings-operations.md; this filename resolution is recorded for audit and does not alter the approved 24c boundary.

## IA Source Map

### Assigned interactions

| IA ID | Source trace | Backend operation | Completion and non-negotiable recovery |
|---|---|---|---|
| 24.07 | IA source lines 53 and 74; deep dive lines 31–35 | BE24C-GHO07 creates or updates one organisation RegisterLine in an explicitly selected mode | Identity and quantity shapes are mutually exclusive; mode conversion requires an explicit auditable command |
| 24.08 | IA source lines 54 and 75; deep dive lines 34–39 | BE24C-GHO08 appends one attributable ConditionReport | Conflicts coexist, corrections supersede without deletion, quantity faults remain count-level and never identify a unit |
| 24.09 | IA source lines 55 and 76; deep dive lines 36–39 | BE24C-GHO09 composes a versioned PublicBacklineProjection | Rows expose item/count and honest condition only; read failure serves aged last-known-good unless privacy/security requires withdrawal |

### Canonical Data Models

| IA Data Models name | 24c realization | Relationship and invariant |
|---|---|---|
| RegisterLine | organization_register_lines | N:1 to entity; mode identity or quantity is fixed per version and never inferred |
| ConditionReport | condition_reports | N:1 to RegisterLine; append-only, attributable and independently supersedable |
| PublicBacklineProjection | public_backline_projections | N:1 to entity/room; selected lines and condition composition are version-pinned |
| CollectionProjection | consumed from 24a | Private collection data is not copied into public backline |
| PublicGearProjection | consumed from 24a/23a | Safe labels only; original media and hidden identifiers remain outside this boundary |
| Rig | consumed from 24b | A register change may invalidate rig context but cannot mutate Rig |
| RigVersion | consumed from 24b | Source version may be included in readiness context only |
| RigMember | consumed from 24b | Quantity lines cannot produce identified rig members |
| CompatibilityRun | consumed from 24b | Condition or quantity change may cause a later advisory run, never rewrite a run |
| CustodyInterval | consumed from 24d | Backline publication does not assert or grant custody |
| CustodyGrant | consumed from 24d | Public projection of held gear requires a distinct owner disclosure grant |
| Case | consumed from 24d | Case contents are not public backline rows unless selected source line policy permits |
| CaseMembership | consumed from 24d | Effective-dated packing is not room availability |
| GearLogisticsFacts | consumed from 24d | Weight/origin may create private readiness gaps but never public price/posture |
| ManifestSnapshot | downstream consumer | Manifest may cite condition source versions; it owns its own snapshot |

### Event Schemas

| IA Event Schemas event type | Producer/consumer role | Payload restriction |
|---|---|---|
| gear.register_line_changed.v1 | Produced by GHO07 after register transaction | Entity/line IDs, mode, line version, actor hash and source record version; no private value or serial |
| gear.condition_reported.v1 | Produced by GHO08 after append | Line/report IDs, grade, referent, observedAt, affected-count class and actor hash; notes and private evidence stay protected |
| gear.collection_item_published.v1 | Consumed to refresh safe gear labels for a selected row | Re-read 24a/23a projection; event hint is not public authority |
| gear.rig_version_saved.v1 | Consumed by condition/readiness invalidation | Source-version linkage only; no rig owner or technical private data |
| gear.rig_member_unresolved.v1 | Consumed to remove an unavailable identified line from any derived presentation | Keep quantity lines separate; no identity substitution |
| gear.compatibility_run_completed.v1 | Consumed as advisory evidence | Never turns a condition report into a compatibility guarantee |
| gear.custody_changed.v1 | Consumed to suppress a held-item row when disclosure authority is lost | Re-read 24d grant; no possession-derived publication |
| gear.case_membership_changed.v1 | Consumed for freshness metadata | Case edits do not create room availability or alter history |
| gear.manifest_snapshot_created.v1 | Consumed as an immutable downstream source reference | No mutation of a backline projection |
| gear.readiness_gap_changed.v1 | Produced when selected public/readiness composition changes state | Gap type/status/version only; no private field or exact location |

All events use eventId, schemaVersion, aggregateId, aggregateVersion, actorId, actingPartyId, correlationId, causationId and occurredAt. Consumers dedupe by eventId and refetch canonical state.

## Endpoint Reconciliation

| IA interaction | Operation ID | Route | Why this boundary is complete |
|---|---|---|---|
| 24.07 Maintain org register | BE24C-GHO07 | POST /api/v1/gear/registers/:entityId/lines | Owns explicit identity/quantity choice, line version, audit and register event |
| 24.08 Report condition | BE24C-GHO08 | POST /api/v1/gear/register-lines/:lineId/condition-reports | Owns attributable append, conflict/supersession and serviceable-count derivation |
| 24.09 Publish backline | BE24C-GHO09 | POST /api/v1/gear/backline/publications | Owns selected public room projection, honest condition composition and last-known-good policy |

BE00 platform routes, 24a personal publication, 24b rig routes and 24d custody/case/manifest routes are dependencies, not alternate handlers. Each route below has one stable operation ID.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | IA interaction | Capability | Archetype | Success |
|---|---|---|---|---|---|---|
| BE24C-GHO07 | POST | /api/v1/gear/registers/:entityId/lines | 24.07 | gear.register.write | ordinary command | 201 Gho07Success |
| BE24C-GHO08 | POST | /api/v1/gear/register-lines/:lineId/condition-reports | 24.08 | gear.condition.report | ordinary command | 201 Gho08Success |
| BE24C-GHO09 | POST | /api/v1/gear/backline/publications | 24.09 | gear.backline.publish | high-risk public projection command | 201 Gho09Success |

Only this registry assigns these operation IDs. The handler rejects wrong methods and undocumented paths before entity/line lookup; a caller cannot select an operation ID.

### Request/Response Contracts (Zod 4)

Zod 4 schemas are strict executable contracts for Hono, TypeScript, OpenAPI and tests. Unknown keys fail. Decimal versions are strings. Public rows contain no serial, private value, price, provision posture, exact location or hidden history.

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
const grades = z.enum(["functional", "degraded", "faulty", "out_for_service"]);

const IdentityLineInput = z.strictObject({
  mode: z.literal("identity"),
  gearRecordId: uuid,
  commodity: z.null(),
  totalCount: z.null(),
});

const QuantityLineInput = z.strictObject({
  mode: z.literal("quantity"),
  gearRecordId: z.null(),
  commodity: z.strictObject({
    code: z.string().regex(/^[A-Z0-9_-]{1,64}$/),
    label: text.max(120),
    unit: z.enum(["unit", "pair", "set", "case", "meter", "kilogram"]),
  }),
  totalCount: z.number().int().min(1).max(1000000),
});

const RegisterLineInput = z.union([IdentityLineInput, QuantityLineInput]);

const Gho07Request = z.strictObject({
  entityId: uuid,
  line: RegisterLineInput,
  expectedVersion: version.nullable(),
  idempotencyKey: idemKey,
  requestId: uuid,
});

const ConditionSummary = z.strictObject({
  state: z.enum(["functional", "degraded", "faulty", "out_for_service", "unknown", "conflicting", "stale"]),
  worstPlausibleGrade: grades.nullable(),
  serviceableCount: z.number().int().nonnegative().nullable(),
  observedAt: z.string().datetime({ offset: true }).nullable(),
  conflict: z.boolean(),
  stale: z.boolean(),
});

const RegisterLineResource = z.strictObject({
  id: uuid,
  entityId: uuid,
  mode: z.enum(["identity", "quantity"]),
  gearRecordId: uuid.nullable(),
  commodity: z.strictObject({
    code: z.string().regex(/^[A-Z0-9_-]{1,64}$/),
    label: text.max(120),
    unit: z.enum(["unit", "pair", "set", "case", "meter", "kilogram"]),
  }).nullable(),
  totalCount: z.number().int().positive().nullable(),
  condition: ConditionSummary,
  version,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
}).superRefine((v, ctx) => {
  if (v.mode === "identity" && (v.gearRecordId === null || v.commodity !== null || v.totalCount !== null)) {
    ctx.addIssue({ code: "custom", path: ["mode"], message: "identity line shape is required" });
  }
  if (v.mode === "quantity" && (v.gearRecordId !== null || v.commodity === null || v.totalCount === null)) {
    ctx.addIssue({ code: "custom", path: ["mode"], message: "quantity line shape is required" });
  }
});

const Gho07Success = z.strictObject({
  operationId: z.literal("BE24C-GHO07"),
  line: RegisterLineResource,
  modeChanged: z.boolean(),
  eventType: z.literal("gear.register_line_changed.v1"),
  replayed: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
});

const ConditionReportInput = z.strictObject({
  referent: z.enum(["item", "quantity"]),
  grade: grades,
  note: text.max(4000),
  observedAt: z.string().datetime({ offset: true }),
  affectedCount: z.number().int().min(0).max(1000000).nullable(),
  supersedesReportId: uuid.nullable(),
  evidenceRef: uuid.nullable(),
}).superRefine((v, ctx) => {
  if (v.referent === "item" && v.affectedCount !== null && v.affectedCount !== 1) {
    ctx.addIssue({ code: "custom", path: ["affectedCount"], message: "item report count must be null or one" });
  }
  if (v.referent === "quantity" && v.affectedCount === null) {
    ctx.addIssue({ code: "custom", path: ["affectedCount"], message: "quantity report requires affected count" });
  }
});

const Gho08Request = z.strictObject({
  lineId: uuid,
  report: ConditionReportInput,
  expectedVersion: version,
  idempotencyKey: idemKey,
  requestId: uuid,
});

const ConditionReportResource = z.strictObject({
  id: uuid,
  registerLineId: uuid,
  reporterId: uuid,
  referent: z.enum(["item", "quantity"]),
  grade: grades,
  note: text.max(4000),
  observedAt: z.string().datetime({ offset: true }),
  affectedCount: z.number().int().nonnegative().nullable(),
  supersedesReportId: uuid.nullable(),
  evidenceRef: uuid.nullable(),
  state: z.enum(["active", "superseded", "disputed"]),
  version,
  createdAt: z.string().datetime({ offset: true }),
});

const Gho08Success = z.strictObject({
  operationId: z.literal("BE24C-GHO08"),
  report: ConditionReportResource,
  line: RegisterLineResource,
  conflict: z.boolean(),
  serviceableCount: z.number().int().nonnegative().nullable(),
  eventType: z.literal("gear.condition_reported.v1"),
  replayed: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
});

const BacklineSelection = z.strictObject({
  lineId: uuid,
  publicLabel: text.max(160),
  requestedCount: z.number().int().positive().nullable(),
});

const Gho09Request = z.strictObject({
  entityId: uuid,
  roomId: uuid,
  selectedLines: z.array(BacklineSelection).min(1).max(500),
  expectedVersion: version,
  publicPolicyVersion: version,
  idempotencyKey: idemKey,
  requestId: uuid,
});

const PublicBacklineRow = z.strictObject({
  lineId: uuid,
  publicLabel: text.max(160),
  availableCount: z.number().int().nonnegative().nullable(),
  condition: z.enum(["functional", "degraded", "faulty", "out_for_service", "unknown", "conflicting", "stale"]),
  conditionObservedAt: z.string().datetime({ offset: true }).nullable(),
  sourceState: z.enum(["current", "stale", "withheld", "not_applicable"]),
});

const Gho09Success = z.strictObject({
  operationId: z.literal("BE24C-GHO09"),
  projectionId: uuid,
  entityId: uuid,
  roomId: uuid,
  state: z.enum(["active", "stale", "withdrawn"]),
  rows: z.array(PublicBacklineRow).max(500),
  sourceVersion: version,
  publishedAt: z.string().datetime({ offset: true }),
  staleSince: z.string().datetime({ offset: true }).nullable(),
  lastKnownGoodAgeSeconds: z.number().int().nonnegative().nullable(),
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

ErrorResponse is the only failure body. HTTP status remains on the response line. BE00 forbids generic RFC fields and limits details to 16 keys, four nesting levels and 8 KiB.

### Contract Registry

| Operation ID | Request schema and source fields | Success schema and exact status | Global failure shape |
|---|---|---|---|
| BE24C-GHO07 | Gho07Request: entityId, one exact identity or quantity RegisterLineInput, expectedVersion, idempotencyKey and requestId | Gho07Success, 201; RegisterLineResource, modeChanged and exact register event type | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE24C-GHO08 | Gho08Request: lineId, ConditionReportInput with referent/grade/note/observedAt/count, expectedVersion and idempotencyKey | Gho08Success, 201; attributable report, recomposed line condition, conflict and serviceable count | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |
| BE24C-GHO09 | Gho09Request: entityId, roomId, selected lines/counts, expectedVersion, publicPolicyVersion, idempotencyKey and requestId | Gho09Success, 201; selected rows, honest condition, source age and stale/withdrawn state | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details } |

### Error Registry

| Operation ID | HTTP and code | Trigger | Safe details and recovery |
|---|---|---|---|
| BE24C-GHO07 | 400 INVALID_REQUEST or 422 VALIDATION_FAILED | Invalid entity/line shape, unknown key, invalid mode union, count or version | BE00 FieldViolation rows; no identity or entity disclosure |
| BE24C-GHO07 | 401 UNAUTHENTICATED or 403 FORBIDDEN | Missing session or no entity asset role | Reauthenticate/request the registered role; no membership graph |
| BE24C-GHO07 | 404 NOT_FOUND or 409 VERSION_MISMATCH | Concealed entity/gear record or stale register version | Concealed target is 404; authorized stale version carries safe expected/current versions |
| BE24C-GHO07 | 422 MODE_CHANGE_REQUIRES_HISTORY | Existing line mode differs from requested mode without explicit conversion evidence | Retry with an explicit conversion request; no inferred identity or quantity |
| BE24C-GHO08 | 400 INVALID_REQUEST or 422 VALIDATION_FAILED | Invalid grade/referent/count/note/time or report exceeds line count | Field violations; absence of a fault report is not represented as inspection |
| BE24C-GHO08 | 403 FORBIDDEN or 404 NOT_FOUND | Reporter lacks fault-report capability or line is concealed | Known unauthorized line is 403; absent/concealed line is 404 |
| BE24C-GHO08 | 409 VERSION_MISMATCH or 422 REPORT_CONFLICT | Line changed or supersession target is not in the same evidence chain | Re-read and retry; both conflicting reports remain visible |
| BE24C-GHO09 | 400 INVALID_REQUEST or 422 PUBLIC_POLICY_FAILED | Invalid selection, room, policy version or unsafe selected source | No projection activation; field/policy code only |
| BE24C-GHO09 | 403 FORBIDDEN or 404 NOT_FOUND | Publisher lacks entity/public-room control or target is concealed | Known unauthorized entity/room is 403; absent/concealed is 404 |
| BE24C-GHO09 | 409 VERSION_MISMATCH | Register, condition or policy version changed during composition | Recompose against a new source version; prior projection remains |
| BE24C-GHO09 | 503 PROJECTION_UNAVAILABLE | Current source cannot be read and no lawful last-known-good projection can be served | If privacy/security requires removal, return withdrawn with no rows; otherwise a committed stale projection carries age |
| All | 429 RATE_LIMITED or 500 INTERNAL_ERROR | Quota or unclassified failure | BE00 rate headers/details or empty internal details; no SQL, note, value or private field |

### Authorization and Middleware Registry

| Operation ID | Authentication and role | Ownership/purpose predicate and 403-vs-404 | Middleware, including CORS |
|---|---|---|---|
| BE24C-GHO07 | Verified Supabase session; entity controller/asset staff with gear.register.write | Shard 01 resolves entity role and target ownership. Known actor without role is 403; absent/revoked/concealed entity or gear record is 404 | Route inventory/request ID; TLS/body/header limits; CORS policy gear-api with explicit web/PWA origins, credentials only for allowlisted origins, no wildcard, Vary Origin; session; acting context; strict Zod; entity/record RLS; BE00 idempotency/CAS; register RPC; normalized response/error; sanitized audit |
| BE24C-GHO08 | Verified session; entity fault-report capability, owner/controller or active delegated holder for the line | Reporter may append evidence only to an authorized line. Known line without capability is 403; concealed line is 404; report never grants custody or publication | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins, credentials allowlist, no wildcard, Vary Origin; session/context; strict Zod; line RLS; BE00 idempotency/CAS; report RPC; event/outbox; redacted note handling; response normalization |
| BE24C-GHO09 | Verified session; entity controller/public-room publisher with current public policy capability | Publisher controls entity and selected public room; each held item requires 24d owner disclosure grant. Known actor without role is 403; concealed entity/room/line is 404; unsafe data is 422 | Route/request ID; TLS/body/header limits; CORS policy gear-api with explicit origins, credentials allowlist, no wildcard, Vary Origin; session/context; strict Zod; room and line policy; grant/privacy/media checks; BE00 idempotency/CAS; projection transaction; outbox; response/error normalization; no private fields |

### Idempotency and Concurrency Registry

| Operation ID | Idempotency contract | Version/race handling | Atomicity and replay |
|---|---|---|---|
| BE24C-GHO07 | Key is 8–128 printable ASCII, scoped by actor, operation, entity and normalized RegisterLineInput; request hash stored in BE00 idempotency_records for 30 days | expectedVersion pins the entity register; an existing line conversion requires explicit conversion evidence and a new line version | Reserve, insert/update line version, audit, gear.register_line_changed.v1 and response are one transaction. Same hash replays exact Gho07Success; changed hash returns IDEMPOTENCY_MISMATCH |
| BE24C-GHO08 | Key binds actor, line, expectedVersion, report fields, observedAt and supersession target | CAS locks RegisterLine.version and verifies supersession chain; concurrent reports append in observed-time order with conflicts visible | Report, recomposed condition summary, audit, gear.condition_reported.v1 and idempotency result commit together. No report is deleted by correction |
| BE24C-GHO09 | Key binds actor, entity, room, sorted selected line IDs/counts, expectedVersion and publicPolicyVersion | All selected lines, conditions, grants and room policy are read at one source version; changed source returns VERSION_MISMATCH | Projection, audit, event/gap update and idempotency result commit together. Matching replay returns same projection/version and never recomputes with newer source |

### Rate, CORS and SLO Registry

| Operation ID | Rate limit and concurrency | CORS policy | Deadline and SLO |
|---|---|---|---|
| BE24C-GHO07 | 60 requests/minute/user, 120/minute/entity, burst 20/10 seconds; max 8 concurrent line writes/entity | gear-api allowlist only; explicit origins, credentials only for allowlisted origins, OPTIONS exposes registered methods/headers, Vary Origin | 15 second hard deadline; p95 under 1,200 ms; no provider or media call in transaction |
| BE24C-GHO08 | 120/minute/user, 240/minute/entity, burst 30/10 seconds; max 16 concurrent reports/entity | gear-api allowlist only; no wildcard credentials and private note fields are never response headers | 15 second hard deadline; p95 under 1,000 ms; append is durable before response |
| BE24C-GHO09 | 10/minute/user, 20/minute/entity, burst 4/10 seconds; max 2 active public compositions/entity | gear-api allowlist only; public response is no-store unless a separate approved public cache projection is generated; Vary Origin | 15 second hard deadline; p95 under 2,000 ms for 500 selected rows; stale last-known-good read is bounded |

### Observability Registry

| Operation ID | Trace and metrics | Audit and redaction |
|---|---|---|
| BE24C-GHO07 | Span includes operation ID, requestId, correlationId, entity hash, mode, line version and source record version. Metrics cover identity/quantity writes, conversion rejects, replay, forbidden, conflict and latency | Audit actor/entity/line hashes, mode, source version and result. Never log serial, private value, exact location, commodity note or hidden owner |
| BE24C-GHO08 | Span includes operation ID, line/report hashes, grade, referent, observed-time bucket, conflict flag and serviceable-count class. Metrics cover grades, conflicts, supersessions, stale reports and latency | Audit reporter/line/report hashes, grade, referent, outcome and evidence digest. Note text is redacted; no private attachment key or identity serial |
| BE24C-GHO09 | Span includes operation ID, projection/entity/room hashes, selected count, source version, policy version, conflict count, stale age and state. Metrics cover active/stale/withdrawn, unsafe rows, grant gaps, replay and p95 | Audit publisher/entity/room hashes, selected-line count, policy and source versions, decision codes. Never log public labels with identifiers, price, posture, serial or private location |

## Database Schema

All tables have enabled and forced RLS. Named RPCs repeat the entity, line, room, capability, grant and version predicates. Direct anon/authenticated table grants are denied. Public consumers receive only the bounded projection.

### Complete Table Definitions

| Table / model | Columns with SQL type, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.organization_register_lines / RegisterLine | id uuid NOT NULL PK DEFAULT gen_random_uuid(); entity_id uuid NOT NULL FK identity.entities(id); mode register_line_mode NOT NULL CHECK IN ('identity','quantity'); gear_record_id uuid NULL FK platform_private.gear_records(id); commodity_code text NULL CHECK commodity_code ~ '^[A-Z0-9_-]{1,64}$'; commodity_label text NULL CHECK char_length(commodity_label) BETWEEN 1 AND 120; commodity_unit text NULL CHECK commodity_unit IN ('unit','pair','set','case','meter','kilogram'); total_count integer NULL CHECK total_count BETWEEN 1 AND 1000000; state register_line_state NOT NULL CHECK IN ('active','retired','conversion_pending'); version bigint NOT NULL DEFAULT 1 CHECK version>0; created_by uuid NOT NULL FK auth.users(id); correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK ((mode='identity' AND gear_record_id IS NOT NULL AND commodity_code IS NULL AND commodity_label IS NULL AND commodity_unit IS NULL AND total_count IS NULL) OR (mode='quantity' AND gear_record_id IS NULL AND commodity_code IS NOT NULL AND commodity_label IS NOT NULL AND commodity_unit IS NOT NULL AND total_count IS NOT NULL)) | PK; entity_id,state,updated_at DESC,id; gear_record_id where gear_record_id IS NOT NULL; entity_id,mode,updated_at DESC; unique entity_id,gear_record_id where mode='identity' and state='active' | Forced RLS. Entity controller/asset role reads/writes through register RPC; owner projection may read an identity line through authorized source policy; public never reads base row; direct grants denied; retirement/conversion is audited |
| platform_private.condition_reports / ConditionReport | id uuid NOT NULL PK DEFAULT gen_random_uuid(); register_line_id uuid NOT NULL FK platform_private.organization_register_lines(id); reporter_id uuid NOT NULL FK auth.users(id); referent condition_referent NOT NULL CHECK IN ('item','quantity'); grade condition_grade NOT NULL CHECK IN ('functional','degraded','faulty','out_for_service'); note text NOT NULL CHECK char_length(note) BETWEEN 1 AND 4000; observed_at timestamptz NOT NULL; affected_count integer NULL CHECK affected_count BETWEEN 0 AND 1000000; supersedes_report_id uuid NULL FK platform_private.condition_reports(id); evidence_object_id uuid NULL FK platform_private.object_records(id); state condition_report_state NOT NULL CHECK IN ('active','superseded','disputed'); version bigint NOT NULL DEFAULT 1 CHECK version>0; correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); CHECK ((referent='item' AND (affected_count IS NULL OR affected_count=1)) OR (referent='quantity' AND affected_count IS NOT NULL)); CHECK supersedes_report_id IS NULL OR supersedes_report_id <> id | PK; register_line_id,observed_at DESC,id; reporter_id,created_at DESC; register_line_id,grade,observed_at DESC; supersedes_report_id; partial register_line_id where state='active' | Forced RLS. Reporter can insert through capability RPC; entity controller reads all evidence; public projection receives composed grade/state only; UPDATE/DELETE denied; supersession is append-only |
| platform_private.public_backline_projections / PublicBacklineProjection | id uuid NOT NULL PK DEFAULT gen_random_uuid(); entity_id uuid NOT NULL FK identity.entities(id); room_id uuid NOT NULL FK venues.rooms(id); selected_line_ids uuid[] NOT NULL CHECK cardinality(selected_line_ids) BETWEEN 1 AND 500; rows jsonb NOT NULL CHECK jsonb_typeof(rows)='array'; source_version bigint NOT NULL CHECK source_version>0; public_policy_version bigint NOT NULL CHECK public_policy_version>0; condition_conflict_count integer NOT NULL DEFAULT 0 CHECK condition_conflict_count>=0; state public_backline_state NOT NULL CHECK IN ('active','stale','withdrawn'); published_at timestamptz NOT NULL DEFAULT now(); stale_since timestamptz NULL; last_known_good_age_seconds integer NULL CHECK last_known_good_age_seconds>=0; version bigint NOT NULL DEFAULT 1 CHECK version>0; published_by uuid NOT NULL FK auth.users(id); correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); CHECK (state='stale' OR stale_since IS NULL); CHECK (state='withdrawn' OR rows IS NOT NULL) | PK; entity_id,room_id,state,published_at DESC,id; room_id,state,published_at DESC; GIN selected_line_ids; source_version,public_policy_version; partial entity_id,room_id where state='active' | Forced RLS. Publisher writes through policy/grant RPC; public reads only sanitized active/stale projection; withdrawn rows return no rows; 24d/24b consumers read source version only; direct grants denied and projections are immutable after publication |

Rows JSON is schema-validated against PublicBacklineRow and contains only publicLabel, availableCount, condition, conditionObservedAt and sourceState. It cannot contain serial, private value, price, provision posture, exact location, owner identity, private note or original object key.

### Index and Constraint Invariants

| Invariant | Enforcement |
|---|---|
| Identity and quantity exclusivity | RegisterLine CHECK and discriminated Zod union require one mode and reject mixed fields |
| Quantity honesty | Quantity total_count is aggregate stock; condition affected_count is bounded and never identifies a unit |
| Condition evidence retention | Reports append; supersession changes state through an auditable RPC and does not delete prior attribution |
| Public condition honesty | Composition selects worse plausible grade when reports conflict; unknown/stale/conflicting state remains explicit |
| Public selection safety | Every selected line is authorized, current enough for policy and grant-checked before rows are emitted |
| Last-known-good age | Stale projection always carries staleSince and age; privacy/security withdrawal returns no rows |
| Version integrity | Register, report and projection CAS uses positive bigint versions; source versions are copied, not rewritten |

### Permission and RLS Matrix

| Model | Anonymous | Entity controller/asset role | Reporter/holder | Public projection reader | Queue/operator |
|---|---|---|---|---|---|
| RegisterLine | deny | read/write through entity RPC | read held line only when delegated; no mode conversion | deny base row | named invalidation consumer |
| ConditionReport | deny | read all entity evidence; append with role | append permitted evidence for authorized line | composed grade only | freshness/service consumer via lease RPC |
| PublicBacklineProjection | selected sanitized rows only | publish/read selected entity/room projection | no publish without explicit role/grant | read active/stale public rows; withdrawn is absent | rebuild/invalidate through named policy RPC |

RLS policies use security-invoker projections. A service credential does not replace Shard 01 acting-party resolution. Public rows are rebuilt from canonical register and condition evidence rather than trusted client values.

## Middleware & Policies

### Hono Order and Security

1. Route inventory assigns exactly one operation ID and rejects method/path mismatch.
2. Transport middleware validates/replaces X-Request-Id, starts correlation, enforces TLS/security headers, 256 KiB body/response ceilings and CORS policy gear-api. OPTIONS exposes only registered methods and headers.
3. Supabase session verification precedes entity, reporter and room resolution. Browser-supplied role claims are not authority.
4. Shard 01 resolves acting party, entity asset role, fault-report capability, public-room control and purpose.
5. Strict Zod parses path, headers and body; unknown keys, invalid NFC, non-finite numbers, over-limit arrays and invalid versions fail before target authorization.
6. Domain policy checks line mode, record ownership, holder grant, condition scope, room policy, safe label, public audience and stale/privacy rules.
7. BE00 idempotency and expected-version CAS execute in the same transaction as domain state, audit and outbox; no provider call occurs inside the transaction.
8. Success is parsed again and receives strong ETag, no-store and rate headers. Errors map to BE00 ApiError with sanitized details.
9. Audit/trace completion records hashes and decision codes. Queue dispatch is after commit; expired leases are retried by the sweeper.

### Policy Rules

| Policy | Enforced behavior |
|---|---|
| Mode selection | Caller must choose identity or quantity. The system never infers a mode from a label or available fields |
| Identity source | Identity line references one canonical Shard 23 gear record; it cannot duplicate an existing active entity identity line |
| Quantity source | Quantity line stores a commodity and total count; a condition report can affect a count but cannot identify a unit |
| Condition conflict | Reports with incompatible grades coexist; public composition exposes conflicting/worst plausible state and timestamps |
| Freshness | Configured freshness marks condition stale and prompts authorized staff; it cannot clear, verify or upgrade a report |
| Service completion | A service event may supersede a report while preserving its author, observed time and evidence |
| Public disclosure | A held record needs a separate owner disclosure grant; publication exposes safe label/count/condition, never serial/value/posture |
| Booking signal | Quantity fault notifications fire when serviceable count falls below a declared reservation threshold; this companion does not own reservation truth |
| Revoke/withdraw | Revoked grant or unsafe projection removes future/live public rows; lawful historical snapshots are not rewritten |

## Data Flow

### 24.07 Maintain organisation register

1. Validate Gho07Request and derive the server-side entity role.
2. Resolve an identity gear record through Shard 23 or validate the quantity descriptor/count. Do not guess the requested mode.
3. Reserve BE00 idempotency and lock the entity/line version.
4. For a new line, insert the selected shape. For a conversion, require an explicit conversion reason/history reference, preserve the old line and create the new versioned evidence.
5. Compose current condition summary from reports without marking unknown as functional.
6. Write audit and gear.register_line_changed.v1 in the same transaction, commit and dispatch the outbox ID.
7. Return RegisterLineResource. On rollback there is no line/event and the same idempotency key can retry.

### 24.08 Report condition

1. Validate referent, grade, note, observedAt, count and optional supersession target.
2. Authorize the reporter and line. A quantity report must not exceed current total_count; an item report cannot claim a unit count.
3. Verify supersession belongs to the same line and report chain; retain all prior rows.
4. Insert ConditionReport and recompute condition summary using observed time, active reports, service state and configured freshness.
5. Flag conflict when plausible reports disagree; for public output choose the worse plausible grade with equal or greater prominence.
6. Commit report, audit, event and idempotency result atomically. Response returns the new report and line summary.

### 24.09 Publish backline

1. Validate selected lines, room and public policy version.
2. Authorize entity/room publisher and each selected line. Re-read identity safe projection, condition reports, active custody/grants and room policy.
3. Compose rows with public label, item/count, honest condition, source state and observation time. Strip serial, private value, price, posture, exact location and private notes.
4. If a current read fails, select the last-known-good projection only when its privacy policy still permits display; attach staleSince and age. If privacy/security is uncertain, write withdrawn and emit a readiness gap.
5. CAS source/policy version, write PublicBacklineProjection, audit and outbox event atomically.
6. Return Gho09Success. A public cache may consume the sanitized projection; no caller receives base register rows.

## State Machines, Concurrency and Failure Recovery

### RegisterLine state

| State | Allowed transition | Guard and recovery |
|---|---|---|
| active | active to conversion_pending | Explicit mode conversion with history reference; old identity/count evidence remains |
| conversion_pending | conversion_pending to active | New shape validates and audit/event commit succeeds |
| conversion_pending | conversion_pending to retired | Authorized cancellation; no inferred replacement |
| retired | terminal | No direct reactivation; a new line with new identity is required |

### ConditionReport state

| State | Allowed transition | Guard and recovery |
|---|---|---|
| active | active to superseded | New report explicitly cites this report and remains attributable |
| active | active to disputed | Authorized conflict/review path records the dispute; original report remains |
| superseded | terminal evidence state | Cannot be deleted or rewritten |
| disputed | disputed to active or superseded | A later authoritative report adds evidence; no retroactive edit |

### PublicBacklineProjection state

| State | Allowed transition | Guard and recovery |
|---|---|---|
| active | active to stale | Source read/freshness threshold fails; staleSince and age are recorded |
| active | active to withdrawn | Privacy, grant, safe rendition or room policy requires removal |
| stale | stale to active | New coherent source/policy composition commits |
| stale | stale to withdrawn | Privacy/security rule or expired permission prevents lawful display |
| withdrawn | terminal for that version | A later publication creates a new projection/version; old rows remain evidence |

### Failure and race matrix

| Scenario | Detection | Recovery |
|---|---|---|
| Mode conversion races with report | RegisterLine version CAS differs | Reject stale conversion; report remains tied to old line and caller re-reads |
| Two conflicting reports arrive | Unique report IDs and observed-time composition | Append both; mark conflict; no last-write deletion |
| Fault report and service completion cross | Source event/version and observed/effective time | Compose by domain timestamps and evidence; arrival order does not erase fault |
| Quantity fault exceeds stock | affected_count > total_count at CAS | 422 without mutation; caller corrects count |
| Held item grant revoked during publish | 24d grant version changes | Abort activation or withdraw; no public row with stale authority |
| Room policy changes during publish | Shard 29 room/policy version mismatch | VERSION_MISMATCH; no mixed public projection |
| Current register read fails | bounded source timeout/circuit open | Serve aged last-known-good only if policy permits; otherwise withdrawn |
| Outbox dispatch crashes | lease expires without acknowledgement | Sweeper retries event ID; consumer dedupes and refetches |
| Same idempotency key races | BE00 unique actor/operation/key hash row | One commit; matching requests replay; different hash returns conflict |

## External Seams

Each adapter has an exact request/response and bounded failure budget. Provider or room calls are outside the canonical write transaction. Browser session tokens never cross an adapter boundary.

| Seam | Exact request | Exact response | Timeout, retry and circuit |
|---|---|---|---|
| BE00 command admission | operationId, actorId, actingPartyId, targetHash, requestHash, idempotencyKeyHash, expectedVersion and correlationId | reserved reservation; replay status/body hash; or IDEMPOTENCY_MISMATCH | 500 ms; 2 retries at 25 ms and 100 ms on connection reset only; open after 5 failures/30 s, half-open 15 s; open maps to DEPENDENCY_UNAVAILABLE |
| Shard 01 entity role | session subject, entityId, requested capability, purpose and correlationId | actor, party, entity role, mandate/purpose, decision and concealment flag | 800 ms; 2 retries at 50 ms and 150 ms for transport failure; open after 5/30 s, half-open 15 s; fail closed |
| Shard 23 identity projection | gearRecordId, sourceVersion, actingPartyId, requested safe fields and purpose | safe label, recordVersion, owner relation, availability, sourceState and condition reference; no private value/serial | 1,200 ms; 2 read retries at 50 ms and 200 ms; open after 5/30 s, half-open 20 s; unavailable becomes a typed gap |
| Shard 24d custody/grant read | line/gear ID, entity, actor, audience, purpose, asOf and expectedVersion | custody state/version, owner relation and accepted grants with subject/audience/term/revocation | 1,000 ms; 2 retries at 50 ms and 150 ms; open after 5/30 s, half-open 15 s; no disclosure on open |
| Shard 29 room/public policy | roomId, entityId, policyVersion, selected line classes and correlationId | room readability, publisher decision, policy version, privacy/security disposition and projection cache rule | 1,000 ms; 2 retries at 50 ms and 150 ms for read-only transport failures; open after 5/30 s, half-open 15 s; stale/withdrawn choice is explicit |
| Condition freshness policy | entity/line IDs, observed timestamps, configured policy version and current time | freshness state, threshold, staleSince and prompt class | 500 ms; 1 retry at 50 ms before composition; open after 5/30 s, half-open 15 s; unknown/stale rather than upgrade |
| BE00 outbox/Queue lease | eventId, eventType, aggregateId/version, payload digest and lease token | accepted queue ID or lease result | 500 ms; 2 retries at 25 ms and 100 ms; open after 5/30 s, half-open 15 s; event remains for sweeper |

An ambiguous dependency response never activates a public row. The operation replays the stored stale/withdrawn result or returns the typed dependency error under the same idempotency key.

## Events and Async Consumers

### Event envelope

| Event type | Required payload | Emission rule |
|---|---|---|
| gear.register_line_changed.v1 | entityId, lineId, mode, lineVersion, sourceRecordVersion, actor hash and correlation IDs | GHO07 commits it with the authoritative line |
| gear.condition_reported.v1 | entityId, lineId, reportId, grade, referent, observedAt, affected-count class, conflict and actor hash | GHO08 commits it with the append; note text and evidence object are excluded |
| gear.readiness_gap_changed.v1 | subjectId, gap type, prior/new state, source version and actor/system hash | Emitted when stale/withheld public or readiness state changes; no private gap value |

### Consumer obligations

| Consumer | Event/input | Required behavior |
|---|---|---|
| Public backline projection worker | gear.register_line_changed.v1, gear.condition_reported.v1, gear.custody_changed.v1 | Mark affected projection stale, re-evaluate grants/policy, and publish a new version only through the named policy RPC |
| Rig/export context worker | gear.register_line_changed.v1, gear.condition_reported.v1 | Mark source context stale; do not mutate Rig, RigVersion or CompatibilityRun |
| Booking dependency notifier | gear.condition_reported.v1 and declared reservation threshold | Notify only when serviceable quantity crosses below the reservation dependency; no reservation or availability mutation here |
| Manifest/readiness worker | gear.readiness_gap_changed.v1 | Add a typed source gap to the next manifest; never mark missing condition as functional |
| Search/public cache | sanitized PublicBacklineProjection | Cache only selected safe rows with state and age; withdraw on a revoked projection |

Consumers lease events, dedupe by eventId/aggregateVersion, refetch RLS-authorized canonical rows and acknowledge only after durable projection or notification evidence. Retries use bounded backoff.

## Error Handling

### Boundary Matrix

| Operation ID | Boundary | Required result |
|---|---|---|
| BE24C-GHO07 | Transport/schema | 400 INVALID_REQUEST or 422 VALIDATION_FAILED in BE00 ErrorResponse; no entity lookup |
| BE24C-GHO07 | Entity/source | 401 UNAUTHENTICATED, 403 FORBIDDEN or concealment-safe 404; no role or record detail |
| BE24C-GHO08 | Report contract | 422 VALIDATION_FAILED or REPORT_CONFLICT; no mutation when count/chain invalid |
| BE24C-GHO08 | CAS/idempotency | 409 VERSION_MISMATCH or IDEMPOTENCY_MISMATCH; all prior reports remain |
| BE24C-GHO09 | Projection policy | 403 FORBIDDEN, 404 NOT_FOUND or 422 PUBLIC_POLICY_FAILED; unsafe rows are never partially published |
| BE24C-GHO09 | Source availability | 201 stale/withdrawn projection when lawful, otherwise 503 PROJECTION_UNAVAILABLE; no false current state |
| All | Quota/system | 429 RATE_LIMITED, 502/503 dependency or 500 INTERNAL_ERROR with BE00 envelope and no private details |

### Error invariants

- Every handler returns ErrorResponse containing BE00 ApiError { code, message, requestId, details } and no alternate failure shape.
- NOT_FOUND details are empty for concealed resources. FORBIDDEN uses only a safe reason code and recovery action.
- Report notes, evidence references, serials, values, exact locations and owner identity never enter errors, metrics, events or public rows.
- A stale or conflicting condition is represented explicitly; it cannot be normalized to functional or verified working.
- Transaction rollback produces no line/report/projection/event. A queue or dependency failure cannot create a duplicate public projection.
- Last-known-good is served only when current privacy/security policy still permits it and always carries stale age.

## Testing Strategy

### Contract and route tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE24C-CON-001 | BE24C-GHO07 | Strict Zod union rejects mixed identity/quantity fields, invalid count, unknown keys, malformed UUID/version and oversized arrays |
| BE24C-CON-002 | BE24C-GHO08 | Condition schema enforces referent/count, grade, observedAt and append-only supersession |
| BE24C-CON-003 | BE24C-GHO09 | Public rows reject serial/value/price/posture/exact-location fields and require condition/source state and age semantics |
| BE24C-ROUTE-001 | All | Only the three route registry paths dispatch; method mismatch and duplicate operation registration fail |
| BE24C-ERR-001 | All | Every failure parses as ErrorResponse with BE00 ApiError { code, message, requestId, details }; generic RFC extras fail |

### Authorization and privacy tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE24C-AUTH-001 | BE24C-GHO07 | Correct entity controller/asset staff succeeds; wrong valid user is 403; absent/concealed entity or gear is 404 |
| BE24C-AUTH-002 | BE24C-GHO08 | Fault-report role can append; pending/stale/disputed custody does not create publication authority |
| BE24C-AUTH-003 | BE24C-GHO09 | Publisher requires entity/room control and per-held-item disclosure grant; known unauthorized is 403 and concealed is 404 |
| BE24C-PRIV-001 | All | Serial, private value, price, posture, exact location, owner identity, note and original media key never leak |
| BE24C-CORS-001 | All | CORS policy gear-api allowlist, no wildcard credentials, Vary Origin and registered method/header exposure are verified |

### Persistence, idempotency and concurrency tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE24C-DB-001 | All | Migrations prove SQL types, nullability, CHECKs, FKs, indexes, forced RLS, security-invoker views and denied direct grants |
| BE24C-DB-002 | BE24C-GHO07 | Concurrent mode writes produce one version and one conflict; no mixed identity/quantity row |
| BE24C-DB-003 | BE24C-GHO08 | Concurrent reports append independently, preserve observed attribution and compose conflicts deterministically |
| BE24C-DB-004 | BE24C-GHO09 | Public composition pins source/policy versions; stale source cannot produce a current projection |
| BE24C-IDEM-001 | All | Same key/body replays exact status/body; different body conflicts; rollback leaves no reservation |
| BE24C-RLS-001 | All | Wrong entity, forged party, revoked mandate, service credential misuse and public base-table access are denied |

### Domain and seam tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE24C-DOM-001 | BE24C-GHO07 | Mode conversion requires explicit history; quantity line never receives a gear identity |
| BE24C-DOM-002 | BE24C-GHO08 | Worst plausible grade, conflict, stale state, supersession and quantity threshold are deterministic |
| BE24C-DOM-003 | BE24C-GHO09 | Last-known-good age and withdraw policy are selected from current privacy/security policy |
| BE24C-SEAM-001 | All | BE00, Shard 01, Shard 23, 24d, Shard 29 and freshness adapters honor exact request/response, timeout, retries and circuits |
| BE24C-FAIL-001 | All | Dependency timeout, outbox crash, lease expiry and disconnected commit recover without duplicate effects or false current state |

### Event, recovery and accessibility-support tests

| Test ID | Operation IDs | Acceptance evidence |
|---|---|---|
| BE24C-EVT-001 | BE24C-GHO07, BE24C-GHO08 | Exact register/condition event names, parent envelope, redaction and transactional emission are verified |
| BE24C-EVT-002 | BE24C-GHO09 | Projection stale/withdrawn gap event and cache invalidation are idempotent |
| BE24C-REC-001 | All | Restore fence validates RLS, idempotency, outbox, condition attribution and projection policy before public activation |
| BE24C-A11Y-001 | BE24C-GHO08, BE24C-GHO09 | Conflict and stale summaries expose text grade, author/time and age; color/badge is not sole state signal |
| BE24C-PERF-001 | All | Route limits, 500-row cap, rate headers, no-store behavior and p95 budgets are measured under concurrent load |

## Deepening Passes

| Pass | Result | Evidence |
|---|---|---|
| 1. Source classification | PASS | 24.07–24.09 are the complete register/condition/backline boundary from IA lines 53–55 and 74–76 |
| 2. Contract completeness | PASS | Three route entries, strict mode/report/projection schemas, bounded collections and BE00 envelope are present |
| 3. Authorization | PASS | Entity roles, reporter standing, room control, grant checks and explicit 403 versus 404 outcomes are present |
| 4. Privacy | PASS | Public rows prohibit serial, private value, price, posture, location, owner and private notes |
| 5. Persistence | PASS | Three domain tables list SQL types, nullability, constraints, FK targets, indexes, forced RLS and grants |
| 6. Concurrency | PASS | Entity/line/source CAS, append-only reports, idempotency and stale projection recovery are deterministic |
| 7. External seams | PASS | Every seam specifies exact request/response, timeout, retry count/backoff and circuit behavior |
| 8. Events | PASS | Exact IA event types and parent envelope fields map to producers and idempotent consumers |
| 9. Failure recovery | PASS | Conflicts, stale age, dependency failure and privacy withdrawal avoid false condition/public state |
| 10. Accessibility and operations | PASS | Text-first conflict/stale output, observability, restore and performance tests are specified |

## Ambiguity Gate

**PASS.** Evidence: IA interaction IDs 24.07, 24.08 and 24.09 each map to exactly one route and operation ID; RegisterLine mode is explicitly identity or quantity; ConditionReport append/conflict/supersession and freshness are typed; PublicBacklineProjection exposes only selected safe rows with honest condition and age; entity role, reporter capability, room control and held-item disclosure are distinct; room availability, price, posture, custody, title and booking remain external authorities; every operation registry, persistence field, seam and recovery branch is filled.

## Open Questions

None

## Dependency References

- Derives from [BE-00 platform contracts](00-infrastructure.md), including the four-field ApiError, strict input rules, idempotency_records, outbox lease, forced RLS and route archetypes.
- Consumes [BE-23a identity and transfer contracts](23a-gear-identity-claims-transfers.md) for canonical gear_records and owner/configuration source evidence.
- Consumes [BE-23c service history](23c-service-component-history.md) for out_for_service and supersession evidence; this companion does not rewrite service history.
- Consumes 24d CustodyInterval and CustodyGrant through named reads; possession never becomes publication authority.
- Consumes 24a safe collection/publication projections and 24b source versions; it does not duplicate those routes.
- Consumes Shard 29 room/policy authority; it does not own room price, availability, provision posture or reservations.
- Supplies register/condition events and PublicBacklineProjection source rows to rigs, manifests, booking dependencies and public cache consumers; downstream consumers refetch and cannot elevate confidence.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Added BE24C-GHO07 through BE24C-GHO09 for explicit organisation register modes, append-only condition evidence and safe public backline projection with stale/withdrawn recovery | /write-be-spec |
