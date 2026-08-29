# Content Schema Registry — Backend Specification

> IA Source: [Shard 03 — CMS content modeling and authoring](../ia/03-cms-content-modeling.md)
> Deep Dives: [Shard 03 CMS content modeling and authoring deep dive](../ia/deep-dives/03-cms-content-modeling.md)
> Foundation: [BE00 — Cross-cutting platform foundation](00-infrastructure.md)
> Status: Complete

## Split Group

This is the first of three backend specifications derived from IA Shard 03:

| BE spec | Owned IA interactions | Boundary |
|---|---|---|
| 03a-content-schema-registry.md | CMS-01, CMS-02, CMS-03, CMS-04, CMS-10 | Definition control plane: content-type and field schemas, allowlisted domain bindings, migrations, and code-owned block registration. |
| 03b-editorial-workflow-publication.md | CMS-05, CMS-06, CMS-07, CMS-08, CMS-09, CMS-13 | Entry revisions, editorial review, schedules, preview, and publication. |
| 03c-composition-taxonomy-localization.md | CMS-11, CMS-12, CMS-14, CMS-15, CMS-16 | Templates, patterns, composition, taxonomies, locale variants, and related-content rules. |

The split is independently implementable. 03a owns definition state and activation authority. Entry content, template composition, taxonomy assignment, locale variants, and public projection remain consumer concerns. BlockDefinitionVersion is registered here as a code-owned capability; 03c consumes its immutable versions when it specifies templates and composition. No route in this document duplicates a BE00 platform endpoint.

## Classification

- Type: domain-command and control-plane registry.
- IA source: 03-cms-content-modeling.md, including its one required deep dive.
- Classification: three-way split by aggregate authority, with CMS-10 co-located with the registry because a block renderer/schema is a code-owned definition and activation compatibility input.
- Inclusion: CMS-01 create content type draft; CMS-02 change field schema; CMS-03 bind domain record; CMS-04 activate schema version; CMS-10 register block version.
- Exclusion: entry/revision/review/publication mutation is 03b; template/pattern/taxonomy/locale/related-content mutation is 03c; route, job, audit, idempotency, error, request-id, session, CORS, and common event-envelope primitives are BE00.
- Authority boundary: this spec stores versioned definitions and migration evidence. It never copies authority, ownership, money, rights, identity, entitlements, or canonical domain state into a CMS record.
- Decision status: no new product or architecture decision. DEC-100 is inherited: cross-shard references are bounded, allowlisted projections and do not permit request-time upward reads or authority laundering.

## Referenced Material Inventory

| Material | Sections / lines consumed | Use in this specification |
|---|---|---|
| IA Shard 03 | Overview lines 9–22; Features lines 24–29; Acceptance Criteria lines 31–49 | Scope, acceptance, feature boundary, and non-negotiable behavior. |
| IA Shard 03 | Interactions lines 50–69, especially CMS-01 through CMS-04 and CMS-10 | Operation registry, request semantics, refusals, and recovery behavior. |
| IA Shard 03 | Contracts lines 77–113 | Built-in/reserved types, field kinds, immutable versions, migration, block registry, and storage rules. |
| IA Shard 03 | Data Models lines 114–143 | ContentType, ContentTypeVersion, FieldDefinitionVersion, RelationDefinition, SchemaMigrationPlan, and BlockDefinitionVersion fields and typing registry. |
| IA Shard 03 | Access Control lines 167–192; Accessibility lines 193–202 | Capability, ownership, protected approval, disclosure, and accessible validation handoff. |
| IA Shard 03 | Event Schemas lines 203–216 | cms.schema.activated.v1 and cms.template.activated.v1 payload and consumer contracts. |
| IA Shard 03 | Edge Cases lines 217–240; Cross-Shard Dependencies lines 268–272 | Negative paths, migration/activation races, and Shard 00/01/04/05/16 boundaries. |
| IA Shard 03 | Deep Dives Needed lines 273–284 | Required deep-dive coverage and cross-shard contract map. |
| IA Shard 03 deep dive | Scope lines 7–9; Deepening Record lines 11–18; Resolved Architecture Choices lines 20–36 | Locked implementation constraints and resolved ambiguity. |
| IA Shard 03 deep dive | Canonical Field Contracts lines 38–76; State Machines lines 78–89 | Exact field and lifecycle semantics. |
| IA Shard 03 deep dive | Schema Compilation and Compatibility lines 91–99; Migration Algorithm lines 121–128 | Deterministic compiler, compatibility classes, dry-run, cursor, and activation gates. |
| IA Shard 03 deep dive | Composition and Preview Validation lines 130–137; Abuse and Recovery Verification lines 148–161 | Block manifest security and impact checks relevant to CMS-10 and activation. |
| IA Shard 03 deep dive | Cross-Shard Contracts lines 163–170; Implementation Envelope lines 172–178 | Ownership, event handoff, Hono/Zod, PostgreSQL/RLS, Queue, and provider boundary. |
| BE00 | Contracts lines 84–165; middleware/auth lines 253–297; protected transaction/event/error lines 298–451; observability/tests lines 452–503 | Mandatory inherited wire, security, transaction, retry, and operational contract. |
| BE01a–01d | BE01a Shared Contract Inheritance 73–97 and API 98–192; BE01b Contract Conventions 88–137 and API 138–305; BE01c API 90–304 and schema 294–304; BE01d Inherited BE00 Protocol 87–109 and route semantics 424–502 | Principal resolution, acting context, party, capability, governance, and disclosure; no CMS-owned identity data. |
| BE02a–02c | BE02a Shared Contract Inheritance 85–98 and schema 427–498; BE02b source contracts 102–227, schema 429–652, middleware 652–700; BE02c request/response 90–258, schema 305–339, middleware 340–369 | Reserved canonical concepts and fixed-profile/provenance compatibility checks; no CMS ownership of profile, credential, or trader state. |
| Architecture Design | Tech Stack/hosting 143–196; persistence/feature-query map 198–266; auth boundary 267–283; API design 343–376; security/rate 535–668 and 770–797; integration/observability 916–995 | Hono on Cloudflare Workers, Supabase PostgreSQL/Auth/RLS, SLO classes, and no raw provider data. |
| Data Placement Strategy | N-Tier responsibilities 5–17; placement map 19–40; security boundaries 42–55; storage/isolation 86–93; lifecycle 95–114; tenancy/sync 116–148 | Data minimization and database placement; definitions contain no private content or PII. |
| Engineering Standards | Test coverage 27–44; performance 53–121; async/recovery 122–138; accessibility 140–148; security 149–165; migration/CI 185–207 | Contract-first, security, performance, accessibility, migration, and CI gates. |

## IA Source Map

| BE section | Source of truth | Exact section / lines |
|---|---|---|
| Boundary and classification | IA Shard 03 plus decomposition | Overview 9–22; Features 24–29; Cross-Shard Dependencies 268–272 |
| Route registry and endpoint reconciliation | IA Shard 03 | Interactions 50–69; Acceptance Criteria 31–49; Surface Applicability 241–266 |
| Content-type and field contracts | IA Shard 03 | Contracts 77–88; Data Models 114–122; typed registry 141–149 |
| Block registry | IA Shard 03 | CMS-10 at interaction line 63; Templates, Blocks, Taxonomy, and Locale 102–112; BlockDefinitionVersion line 130 |
| Zod request and response contracts | IA Shard 03 plus BE00 | Contracts 77–112; deep dive Canonical Field Contracts 38–76; BE00 Contracts |
| Persistence and RLS | IA Shard 03 plus placement strategy | Data Models 114–143; Access Control 167–192; Data Placement Strategy canonical-store and access sections |
| Compilation and migrations | IA Shard 03 deep dive | Schema Compilation and Compatibility 91–99; Migration Algorithm 121–128 |
| Middleware, authorization, and disclosure | IA Shard 03 plus BE00/BE01 | Access Control 167–192; Cross-Shard Dependencies 268–284; BE00 middleware/auth/error contracts |
| Events and async consumers | IA Shard 03 plus BE00 | Event Schemas 203–216; deep dive Cross-Shard Contracts 163–170; BE00 queue/outbox contract |
| Tests and ambiguity | IA Shard 03, deep dive, engineering standards | Edge Cases 217–240; Abuse and Recovery Verification 148–161; Engineering Standards test gates |

## Feature Ledger Coverage

| Ledger ID | Feature | BE ownership | Coverage evidence |
|---|---|---|---|
| 25.01.01 | Content Type Definitions | CMS-03A-01 | ContentType and ContentTypeVersion tables, draft route, reserved-key checks, Zod contract, RLS, and create/replay tests. |
| 25.01.02 | Field Schemas, Validation & Defaults | CMS-03A-02 | FieldDefinitionVersion table, all 14 field kinds, strict constraints/default/localization semantics, compatibility classification, and field-contract tests. |
| 25.01.03 | Relations & Domain Record Bindings | CMS-03A-03 | RelationDefinition table, allowlisted target/projection/cardinality/onUnavailable contract, target-authority boundary, and binding tests. |
| 25.01.04 | Schema Versioning & Migration | CMS-03A-04 | SchemaMigrationPlan table, deterministic compiler/dry-run, state machine, CAS activation, worker retry/DLQ, and migration recovery tests. |
| 25.03.01 | Approved Block Registry | CMS-03A-05 | BlockDefinitionVersion table, signed release registration, strict props/renderer/data/a11y manifest, immutable retirement, and release-spoof tests. |

25.02.01–25.02.04 and 25.03.02–25.03.04 are explicitly owned by 03b/03c. 25.05.* is also owned by 03c. This document supplies only the schema/block compatibility inputs those consumers are allowed to reference.

## Endpoint Completeness Reconciliation

The IA interaction table contains five flows owned by this file. Each has exactly one route registry entry and one operation contract. CMS-04 may enqueue migration work, but migration worker execution is an internal consumer, not a second HTTP endpoint. CMS-10 is admitted only from a trusted code-release registration path; an administrator cannot upload executable assets.

| IA interaction | Operation ID | Concrete endpoint / trigger | Reconciliation |
|---|---|---|---|
| CMS-01 Create content type draft | CMS-03A-01 | POST /api/v1/cms/content-types | One command creates private ContentType plus version 1 draft in one transaction. |
| CMS-02 Change field schema | CMS-03A-02 | POST /api/v1/cms/content-types/{contentTypeId}/versions/{versionId}/fields | One command appends a field definition to an unactivated draft and records compatibility impact. |
| CMS-03 Bind domain record | CMS-03A-03 | POST /api/v1/cms/content-types/{contentTypeId}/versions/{versionId}/relations | One command appends a read-only allowlisted RelationDefinition; it never grants target authority. |
| CMS-04 Activate schema version | CMS-03A-04 | POST /api/v1/cms/content-types/{contentTypeId}/versions/{versionId}/activate | One protected command freezes, verifies, switches active version, and writes an outbox work item atomically. |
| CMS-10 Register block version | CMS-03A-05 | POST /api/v1/cms/blocks/versions, trusted release principal only | One code-release registration creates immutable BlockDefinitionVersion. No public/admin upload route exists. |

BE00 endpoints are inherited, not repeated: GET /api/v1/jobs/{jobId} observes migration status when a job exists; this file does not redefine JobStatus. No INF-01, INF-03, INF-04, INF-10, or INF-08 duplicate is introduced.

## Shared Contract Inheritance

All operations use the BE00 API base /api/v1, request ID, JSON media guard, exact four-field error envelope, strong quoted decimal ETag, idempotency, rate-limit headers, audit, and transactional outbox rules.

~~~ts
import { z } from 'zod';

const UUID = z.string().uuid();
const Version = z.string().regex(/^[1-9][0-9]*$/);
const ApiError = z.strictObject({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
  message: z.string().min(1).max(500),
  requestId: UUID,
  details: z.record(z.string(), z.json())
});
~~~

ApiError is exactly { code, message, requestId, details }. details is capped by BE00 at 16 keys, four nesting levels, and 8 KiB serialized. HTTP status is on the response line, never a top-level error field. Every operation below cites this envelope and returns Content-Type application/json, X-Request-Id, Cache-Control no-store for authenticated/control-plane responses.

- Authentication is verified Supabase Auth session/JWT followed by server-resolved acting context; caller-supplied actor, party, capability, or owner fields are ignored.
- Mutations require Idempotency-Key of 8–128 printable ASCII bytes and exact strong If-Match for a mutable parent; same bound request replays the original response, a mismatched body/actor/path/version returns 409 CONFLICT.
- Hono middleware order is request-id → raw-size/media guard → JSON parse → Zod validation → session/JWT → acting-context/capability → CSRF → configured CORS allowlist → rate limiter → handler/RPC → response/error normalization.
- CORS is explicit per-operation: production allows configured first-party origins only, credentials only for those origins, never wildcard credentials. CMS-03A-05 accepts the configured release-worker origin and signed release principal, not browser origins.
- PostgreSQL RPC rechecks authority, state, version, idempotency, uniqueness, and allowlist under RLS. Domain mutation, idempotency record, audit row, and outbox row commit or roll back together.
- Queue messages carry IDs, versions, correlation/causation IDs, and no content payload. Consumers use at-least-once delivery, leases, CAS, maximum three retries at 15s/60s/300s, and DLQ for terminal or unknown-version failures.

## API Endpoints

### Route Registry

This table is the single authoritative route registry for 03a. CI must compare discovered Hono routes and generated OpenAPI to every row and fail on a missing/extra route, duplicate method/path, missing operation ID, or stale schema. Every downstream contract, error, authorization, idempotency, rate, observability, and test row keys to the operation ID.

| Operation ID | IA | Method and path | Request → success | Auth / 403 versus 404 | Middleware incl. CORS | Idempotency / concurrency | Rate / timeout / cache / SLO | Error envelope | Event |
|---|---|---|---|---|---|---|---|---|---|
| CMS-03A-01 | CMS-01 | POST /api/v1/cms/content-types | ContentTypeDraftRequest → 201 ContentTypeVersionResource | schema_designer for the caller's permitted registry scope; invalid target scope is 404, authenticated but insufficient capability is 403 | canonical BE00 order; CORS cms-console allowlist; CSRF; JSON 256 KiB; rate cms-definition-write | key required; parent absent create is bound to typeKey; serial unique key lock; no If-Match for new type | 30/min/user, 60/min/party; 15,000ms deadline, response target <2s; no-store; Tier 2 p95 <1,200ms | BE00 ApiError { code, message, requestId, details } | cms.schema.activated.v1 only on later activation |
| CMS-03A-02 | CMS-02 | POST /api/v1/cms/content-types/{contentTypeId}/versions/{versionId}/fields | FieldSchemaChangeRequest → 201 FieldDefinitionVersionResource | schema_designer on draft; unknown/unreadable type/version is 404; known resource lacking capability is 403 | canonical order; CORS cms-console allowlist; CSRF; strict JSON; rate cms-definition-write | key and If-Match required; CAS on version; stable field UUID/key cannot be reused | 60/min/user, 120/min/party; 15,000ms; no-store; Tier 2 | BE00 ApiError { code, message, requestId, details } | none |
| CMS-03A-03 | CMS-03 | POST /api/v1/cms/content-types/{contentTypeId}/versions/{versionId}/relations | RelationBindingRequest → 201 RelationDefinitionResource | schema_designer on draft and relation allowlist; unreadable type/version is 404; capability denial is 403 | canonical order; CORS cms-console allowlist; CSRF; strict JSON; rate cms-definition-write | key and If-Match required; CAS and unique field/version binding | 60/min/user, 120/min/party; 15,000ms; no-store; Tier 2 | BE00 ApiError { code, message, requestId, details } | none |
| CMS-03A-04 | CMS-04 | POST /api/v1/cms/content-types/{contentTypeId}/versions/{versionId}/activate | SchemaActivationRequest → 202 SchemaActivationResource | schema_designer plus two workflow-required distinct approvals; unreadable candidate is 404; missing capability/evidence is 403 or 409 per state disclosure | canonical order; CORS cms-console allowlist; CSRF; step-up MFA; strict JSON; rate cms-activation | key and If-Match required; one activation CAS; repeated key replays same switch/job | 10/min/user, 20/min/party; 15,000ms acceptance deadline; no-store; Tier 2 | BE00 ApiError { code, message, requestId, details } | cms.schema.activated.v1 after committed switch |
| CMS-03A-05 | CMS-10 | POST /api/v1/cms/blocks/versions | BlockRegistrationRequest → 201 BlockDefinitionVersionResource | signed release-worker principal with block_registry:write; unknown release target is 404; human/admin or invalid capability is 403 | canonical order; release-worker CORS only; no browser CSRF; raw signature guard before JSON; rate release-registry-write | key required; release digest + block key/version unique; immutable once committed | 20/min/release; 15,000ms, response target <2s; no-store; Tier 2 | BE00 ApiError { code, message, requestId, details } | cms.template.activated.v1 is emitted only when a registered block version is activated by the template control plane |

### Registry invariants

- Paths use UUID path parameters and are never inferred from labels. ContentType keys and field keys are lowercase ASCII, stable, never reused, and distinct from labels.
- All successful mutation responses include ETag: "<positive decimal version>", Location where a new resource exists, X-Request-Id, and no-store.
- Every row's failure response is ApiError { code, message, requestId, details }; the operation-specific error matrix below is exhaustive.
- CMS-03A-01 through CMS-03A-04 are first-party human console commands. CMS-03A-05 is a signed release command and cannot be reached with a human session or uploaded JS/CSS/template/expression.
- Activation never mutates a previously active version. A prior active version remains readable and serveable until the atomic switch commits.

### Route field validation matrix

| Operation | Field | Zod and semantic constraint | Failure |
|---|---|---|---|
| CMS-03A-01 | typeKey | string, regex /^[a-z][a-z0-9-]{1,63}$/, not built-in duplicate, retired, reserved canonical concept, or existing key | 422 VALIDATION_FAILED or 409 CONFLICT |
| CMS-03A-01 | label | string 2–120 Unicode characters, normalized NFC | 422 VALIDATION_FAILED |
| CMS-03A-01 | ownerCapability | string 1–128, protected capability registry member | 422 VALIDATION_FAILED |
| CMS-03A-01 | workflow | enum draft_review, author_review, protected_two_person | 422 VALIDATION_FAILED |
| CMS-03A-01 | fields | array 0–128; each stableFieldId UUID, key regex, kind closed registry, constraints strict | 422; no partial insert |
| CMS-03A-02 | path IDs | contentTypeId and versionId UUID; version must belong to type | 400 INVALID_REQUEST or 404 NOT_FOUND |
| CMS-03A-02 | stableFieldId | UUID; existing field UUID for change/deprecation or omitted only for a new field | 422 VALIDATION_FAILED |
| CMS-03A-02 | key / kind | key regex /^[a-z][a-z0-9_]{1,63}$/; kind enum short_text, long_text, rich_text, boolean, integer, decimal, date, datetime, enum, taxonomy, relation, media, object, list | 422; key/kind change is 409 when immutable |
| CMS-03A-02 | constraints | strict object; kind-specific only; max 64 keys, depth 4, 8 KiB; no expressions or executable strings | 422 VALIDATION_FAILED |
| CMS-03A-02 | required/default/localizable | boolean/JSON/null/boolean; required cannot be added over populated data without proven migration | 422 or 409 CONFLICT |
| CMS-03A-02 | migrationPlanId | UUID or null; required for conditional/breaking compatibility | 422 or 409 CONFLICT |
| CMS-03A-03 | fieldId | UUID of a relation-kind FieldDefinitionVersion in this type version | 422/409 |
| CMS-03A-03 | targetKind / projection | allowlisted lowercase target kind 1–96 and named projection 1–128; no arbitrary SQL/table | 422 VALIDATION_FAILED |
| CMS-03A-03 | cardinality | enum one, optional_one, many | 422 |
| CMS-03A-03 | onUnavailable | enum omit, block | 422; absence is never silently treated as omit |
| CMS-03A-04 | expectedVersion | positive decimal string; exact strong If-Match must match candidate version | 400 or 409 CONFLICT |
| CMS-03A-04 | dryRunId | UUID for an immutable report containing counts, hashes, compiler version, and result | 422/409 |
| CMS-03A-04 | approvalIds | exactly two distinct UUIDs for protected workflow; each decision is attributable and current | 422/403 |
| CMS-03A-04 | migrationPlanId | UUID or null; null only for additive/no-data migration | 422/409 |
| CMS-03A-05 | blockKey / blockVersion | blockKey /^[a-z][a-z0-9-]{1,63}$/; blockVersion positive safe integer; pair never reused | 422/409 |
| CMS-03A-05 | propsSchema | strict manifest, max 128 fields, depth 8, no unknown runtime keywords, no script/expression/dynamic import | 422 |
| CMS-03A-05 | rendererRef | registered code manifest reference 1–160 characters; no URL, source text, or uploaded module | 422 |
| CMS-03A-05 | children/slot/data rules | strict arrays/objects max 32 children and protected depth/count; data source names allowlisted projection contracts | 422 |
| CMS-03A-05 | accessibility | strict contract names required labels, heading behavior, keyboard/focus and status output; no arbitrary HTML | 422 |
| All | headers | Idempotency-Key 8–128 printable ASCII; If-Match exact quoted positive decimal where required; Content-Type application/json | 400 INVALID_REQUEST |

## Request/Response Contracts (Zod 4 schemas)

The following are the normative runtime schemas. Zod 4 strict objects generate TypeScript and OpenAPI types; parsing occurs before authorization. The examples omit no required operation field.

~~~ts
const Json = z.json();
const Key = z.string().regex(/^[a-z][a-z0-9_-]{1,63}$/);
const TypeKey = z.string().regex(/^[a-z][a-z0-9-]{1,63}$/);
const FieldKind = z.enum([
  'short_text', 'long_text', 'rich_text', 'boolean', 'integer', 'decimal',
  'date', 'datetime', 'enum', 'taxonomy', 'relation', 'media', 'object', 'list'
]);
const Constraints = z.strictObject({
  minLength: z.number().int().nonnegative().max(100000).optional(),
  maxLength: z.number().int().nonnegative().max(100000).optional(),
  minimum: z.number().finite().optional(),
  maximum: z.number().finite().optional(),
  pattern: z.string().max(512).optional(),
  enumValues: z.array(z.string().max(160)).max(256).optional(),
  itemKind: FieldKind.optional()
}).superRefine((value, ctx) => {
  if (value.minLength !== undefined && value.maxLength !== undefined &&
      value.minLength > value.maxLength) {
    ctx.addIssue({ code: 'custom', message: 'minLength exceeds maxLength' });
  }
});
const FieldDefinitionInput = z.strictObject({
  stableFieldId: UUID.optional(),
  key: Key,
  kind: FieldKind,
  constraints: Constraints,
  required: z.boolean(),
  defaultValue: Json.nullable().optional(),
  localizable: z.boolean(),
  editorMetadata: z.strictObject({
    label: z.string().min(1).max(120),
    helpText: z.string().max(500).optional(),
    order: z.number().int().nonnegative().max(10000)
  })
});
const ContentTypeDraftRequest = z.strictObject({
  typeKey: TypeKey,
  label: z.string().min(2).max(120),
  ownerCapability: z.string().min(1).max(128),
  workflow: z.enum(['draft_review', 'author_review', 'protected_two_person']),
  fields: z.array(FieldDefinitionInput).max(128)
});
const FieldSchemaChangeRequest = z.strictObject({
  stableFieldId: UUID.optional(),
  key: Key,
  kind: FieldKind,
  constraints: Constraints,
  required: z.boolean(),
  defaultValue: Json.nullable().optional(),
  localizable: z.boolean(),
  editorMetadata: FieldDefinitionInput.shape.editorMetadata,
  migrationPlanId: UUID.nullable().optional()
});
const RelationBindingRequest = z.strictObject({
  fieldId: UUID,
  targetKind: z.string().regex(/^[a-z][a-z0-9._-]{0,95}$/),
  projection: z.string().regex(/^[a-z][a-z0-9._-]{0,127}$/),
  cardinality: z.enum(['one', 'optional_one', 'many']),
  onUnavailable: z.enum(['omit', 'block'])
});
const SchemaActivationRequest = z.strictObject({
  expectedVersion: Version,
  dryRunId: UUID,
  approvalIds: z.array(UUID).length(2),
  migrationPlanId: UUID.nullable()
}).superRefine((value, ctx) => {
  if (value.approvalIds[0] === value.approvalIds[1]) {
    ctx.addIssue({ code: 'custom', path: ['approvalIds'], message: 'approvals must be distinct' });
  }
});
const BlockRegistrationRequest = z.strictObject({
  blockKey: TypeKey,
  blockVersion: z.number().int().positive().max(2147483647),
  propsSchema: z.strictObject({
    fields: z.array(z.strictObject({ name: Key, type: z.string().min(1).max(64) })).max(128),
    additionalProperties: z.literal(false)
  }),
  rendererRef: z.string().regex(/^[a-z][a-z0-9._/-]{0,159}$/),
  allowedChildren: z.array(TypeKey).max(32),
  slotRules: z.strictObject({ maxDepth: z.number().int().min(1).max(16), maxNodes: z.number().int().min(1).max(512) }),
  dataSourcePermissions: z.array(z.string().regex(/^[a-z][a-z0-9._-]{0,127}$/)).max(32),
  accessibility: z.strictObject({
    nameRequired: z.boolean(),
    keyboard: z.literal(true),
    focusOrder: z.enum(['document', 'managed']),
    statusAnnouncement: z.boolean()
  }),
  compatibility: z.strictObject({ minSchemaCompiler: z.string().min(1).max(32), maxSchemaCompiler: z.string().min(1).max(32) }),
  retirementPolicy: z.enum(['supported', 'deprecated', 'withdrawn']),
  releaseDigest: z.string().regex(/^[a-f0-9]{64}$/)
});
~~~

Success resources are strict and expose no private definition payload beyond the authorized caller's registry scope:

~~~ts
const ResourceMeta = z.strictObject({
  id: UUID,
  version: Version,
  state: z.enum(['draft', 'review', 'approved', 'scheduled', 'active', 'superseded', 'retired', 'blocked']),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true })
});
const ContentTypeVersionResource = ResourceMeta.extend({
  contentTypeId: UUID,
  typeKey: TypeKey,
  label: z.string().trim().min(2).max(120),
  ownerCapability: z.string().regex(/^[a-z][a-z0-9._-]{0,127}$/),
  workflow: z.enum(['draft_review', 'author_review', 'protected_two_person']),
  fieldCount: z.number().int().nonnegative(),
  compatibility: z.enum(['additive', 'conditional', 'breaking', 'unknown']),
  dryRunId: UUID.nullable()
});
const FieldDefinitionVersionResource = ResourceMeta.extend({
  contentTypeVersionId: UUID,
  stableFieldId: UUID,
  key: Key,
  kind: FieldKind,
  required: z.boolean(),
  localizable: z.boolean(),
  migrationPlanId: UUID.nullable()
});
const RelationDefinitionResource = ResourceMeta.extend({
  contentTypeVersionId: UUID,
  fieldId: UUID,
  targetKind: z.string().regex(/^[a-z][a-z0-9._-]{0,95}$/),
  projection: z.string().regex(/^[a-z][a-z0-9._-]{0,127}$/),
  cardinality: z.enum(['one', 'optional_one', 'many']),
  onUnavailable: z.enum(['omit', 'block'])
});
const SchemaActivationResource = ResourceMeta.extend({
  contentTypeVersionId: UUID,
  activatedAt: z.string().datetime({ offset: true }).nullable(),
  migrationPlanId: UUID.nullable(),
  jobId: UUID.nullable(),
  eventType: z.literal('cms.schema.activated.v1')
});
const BlockDefinitionVersionResource = ResourceMeta.extend({
  blockKey: TypeKey,
  blockVersion: z.number().int().positive(),
  rendererRef: z.string().regex(/^[a-z][a-z0-9._/-]{0,159}$/),
  releaseDigest: z.string().regex(/^[a-f0-9]{64}$/),
  retirementPolicy: z.enum(['supported', 'deprecated', 'withdrawn'])
});
~~~

The declared HTTP responses are 201 for draft/field/relation/block creation, 202 for activation acceptance when migration/projection work is queued, and 200 only for a completed synchronous activation with no queued work. CMS-03A-04 always returns SchemaActivationResource with a jobId when work remains. Every operation returns ApiError { code, message, requestId, details } on failure.

### Contract and error matrix

| Operation ID | 400 | 401 | 403 | 404 | 409 | 415 | 422 | 429 | 502/503/504 | 500 |
|---|---|---|---|---|---|---|---|---|---|---|
| CMS-03A-01 | malformed JSON/path/header, missing key | missing/expired session | capability/scope denied | concealed target scope or absent key only after structural validation | type key collision or idempotency mismatch | non-JSON | field/registry/quota schema failure | cms-definition-write limit | RPC unavailable/deadline | scrubbed internal error |
| CMS-03A-02 | malformed path/header/body | missing/expired session | draft capability denied | type/version hidden or absent | stale ETag, immutable field/key, idempotency mismatch | non-JSON | kind/constraint/migration schema failure | cms-definition-write limit | RPC unavailable/deadline | scrubbed internal error |
| CMS-03A-03 | malformed path/header/body | missing/expired session | draft capability denied | type/version hidden or absent | stale ETag, duplicate field binding, idempotency mismatch | non-JSON | target/projection/cardinality allowlist failure | cms-definition-write limit | RPC unavailable/deadline | scrubbed internal error |
| CMS-03A-04 | malformed path/header/body | missing/expired or missing step-up MFA | capability/approval evidence denied | candidate hidden or absent | stale ETag, invalid state, dry-run/hash mismatch, idempotency mismatch | non-JSON | approval/migration schema failure | cms-activation limit | compiler/RPC/deadline; Retry-After | scrubbed internal error |
| CMS-03A-05 | malformed signature/header/body | no valid release principal/signature | human, wrong release, or scope denied | unknown release registration target | key/version/digest collision, idempotency mismatch | unsupported media | manifest/renderer/accessibility failure | release-registry-write limit | registry/RPC/deadline | scrubbed internal error |

Error details are BE00 allowlists only: 400/422 may include at most 50 JSON-pointer violations; 401 has recoveryAction; 403 has reasonCode without policy predicates; 404 is empty; 409 may include expectedVersion/currentVersion only when the caller may read the candidate; 429 includes retryAfterSeconds, limit, resetAt; 502/503/504 includes dependencyClass, retryable, and optional retryAfterSeconds; 500 is empty. No error distinguishes a hidden resource from absence.

## Database Schema

All tables live in a private Supabase PostgreSQL schema exposed only through schema-qualified RPCs. RLS is enabled and forced on every table. Direct client table grants are revoked. Service-role use is limited to named migration/worker functions with an empty search_path, and those functions recheck acting context, capability, expected version, and idempotency.

### Canonical records and fields

The model names below are literal IA names. Every field includes SQL type, nullability, constraint, and relationship. JSONB is structured data validated by the compiled schema, not an EAV escape hatch.

| Model / table | Typed fields, constraints, and foreign keys | Query indexes and write rules |
|---|---|---|
| ContentType / cms_content_types | id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY; type_key text NOT NULL CHECK type_key ~ '^[a-z][a-z0-9-]{1,63}$' UNIQUE (never reused); owner_capability text NOT NULL CHECK octet_length(owner_capability) BETWEEN 1 AND 128; built_in boolean NOT NULL DEFAULT false; lifecycle cms_definition_state NOT NULL CHECK lifecycle IN ('draft','review','approved','scheduled','active','superseded','retired','blocked'); version bigint NOT NULL CHECK version > 0; created_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(). | UNIQUE(type_key); INDEX(owner_capability,lifecycle); INDEX(created_by,updated_at DESC). RLS SELECT requires schema_designer scope or approved read projection; INSERT/UPDATE only named RPC; type_key, built_in, created_by immutable; DELETE revoked. |
| ContentTypeVersion / cms_content_type_versions | id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY; content_type_id uuid NOT NULL REFERENCES cms_content_types(id); version bigint NOT NULL CHECK version > 0; labels jsonb NOT NULL CHECK jsonb_typeof(labels)='object'; workflow text NOT NULL CHECK workflow IN ('draft_review','author_review','protected_two_person'); default_locale text NOT NULL CHECK default_locale ~ '^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$'; default_template_version_id uuid NULL REFERENCES cms_template_versions(id); state cms_definition_state NOT NULL; content_hash char(64) NOT NULL CHECK content_hash ~ '^[a-f0-9]{64}$'; compatibility text NOT NULL CHECK compatibility IN ('additive','conditional','breaking','unknown'); supersedes_version_id uuid NULL REFERENCES cms_content_type_versions(id); dry_run_id uuid NULL; created_by uuid NOT NULL REFERENCES auth.users(id); approved_at timestamptz NULL; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(). | UNIQUE(content_type_id,version); UNIQUE(content_type_id) WHERE state='active'; INDEX(content_type_id,state,version DESC); INDEX(state,updated_at). Foreign key to cms_template_versions is the 03c template-owner boundary; activation refuses unresolved FK. Append-only except state/version transition through RPC. |
| FieldDefinitionVersion / cms_field_definition_versions | id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY; content_type_version_id uuid NOT NULL REFERENCES cms_content_type_versions(id); stable_field_id uuid NOT NULL; field_key text NOT NULL CHECK field_key ~ '^[a-z][a-z0-9_]{1,63}$'; kind text NOT NULL CHECK kind IN ('short_text','long_text','rich_text','boolean','integer','decimal','date','datetime','enum','taxonomy','relation','media','object','list'); constraints jsonb NOT NULL CHECK jsonb_typeof(constraints)='object'; required boolean NOT NULL; default_value jsonb NULL; localizable boolean NOT NULL DEFAULT false; editor_metadata jsonb NOT NULL CHECK jsonb_typeof(editor_metadata)='object'; lifecycle text NOT NULL CHECK lifecycle IN ('active','deprecated','retired'); version bigint NOT NULL CHECK version > 0; created_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(). | UNIQUE(content_type_version_id,stable_field_id); UNIQUE(content_type_version_id,field_key); INDEX(content_type_version_id,lifecycle); INDEX(stable_field_id). No physical deletion; deprecation is the only removal before retention eligibility. RelationDefinition FK references this table only for kind=relation. |
| RelationDefinition / cms_relation_definitions | id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY; field_definition_id uuid NOT NULL REFERENCES cms_field_definition_versions(id); target_kind text NOT NULL CHECK target_kind ~ '^[a-z][a-z0-9._-]{0,95}$'; projection text NOT NULL CHECK projection ~ '^[a-z][a-z0-9._-]{0,127}$'; cardinality text NOT NULL CHECK cardinality IN ('one','optional_one','many'); on_unavailable text NOT NULL CHECK on_unavailable IN ('omit','block'); version bigint NOT NULL CHECK version > 0; created_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(). | UNIQUE(field_definition_id); INDEX(target_kind,projection); INDEX(field_definition_id,version DESC). RPC verifies target_kind/projection against a code-owned allowlist and target authorization is deferred to each consumer read. |
| SchemaMigrationPlan / cms_schema_migration_plans | id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY; content_type_id uuid NOT NULL REFERENCES cms_content_types(id); from_version_id uuid NOT NULL REFERENCES cms_content_type_versions(id); to_version_id uuid NOT NULL REFERENCES cms_content_type_versions(id); classification text NOT NULL CHECK classification IN ('additive','conditional','breaking'); transform_key text NULL CHECK transform_key IS NULL OR transform_key ~ '^[a-z][a-z0-9._-]{0,127}$'; transform_version bigint NULL CHECK transform_version IS NULL OR transform_version > 0; dry_run_result jsonb NOT NULL CHECK jsonb_typeof(dry_run_result)='object'; cursor bigint NOT NULL DEFAULT 0 CHECK cursor >= 0; progress numeric(9,6) NOT NULL DEFAULT 0 CHECK progress BETWEEN 0 AND 1; state text NOT NULL CHECK state IN ('draft','dry_running','ready','blocked','running','verifying','completed','failed_retryable','failed_terminal'); source_count bigint NOT NULL DEFAULT 0 CHECK source_count >= 0; target_count bigint NOT NULL DEFAULT 0 CHECK target_count >= 0; row_error_count bigint NOT NULL DEFAULT 0 CHECK row_error_count >= 0; created_by uuid NOT NULL REFERENCES auth.users(id); started_at timestamptz NULL; completed_at timestamptz NULL; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK(from_version_id <> to_version_id); CHECK((classification='additive' AND transform_key IS NULL) OR (classification IN ('conditional','breaking') AND transform_key IS NOT NULL)). | UNIQUE(from_version_id,to_version_id); INDEX(content_type_id,state,updated_at); INDEX(state,updated_at) for worker leases. Direct progress updates revoked; worker RPC uses CAS on state, cursor, and version. A failed row remains readable under its old schema. |
| BlockDefinitionVersion / cms_block_definition_versions | id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY; block_key text NOT NULL CHECK block_key ~ '^[a-z][a-z0-9-]{1,63}$'; block_version integer NOT NULL CHECK block_version > 0; props_schema jsonb NOT NULL CHECK jsonb_typeof(props_schema)='object'; renderer_ref text NOT NULL CHECK octet_length(renderer_ref) BETWEEN 1 AND 160; allowed_children jsonb NOT NULL CHECK jsonb_typeof(allowed_children)='array'; slot_rules jsonb NOT NULL CHECK jsonb_typeof(slot_rules)='object'; data_source_permissions jsonb NOT NULL CHECK jsonb_typeof(data_source_permissions)='array'; accessibility_contract jsonb NOT NULL CHECK jsonb_typeof(accessibility_contract)='object'; compatibility_range jsonb NOT NULL CHECK jsonb_typeof(compatibility_range)='object'; retirement_policy text NOT NULL CHECK retirement_policy IN ('supported','deprecated','withdrawn'); release_digest char(64) NOT NULL CHECK release_digest ~ '^[a-f0-9]{64}$'; state cms_definition_state NOT NULL; created_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(). | UNIQUE(block_key,block_version); INDEX(block_key,state,block_version DESC); INDEX(retirement_policy). INSERT only signed release RPC; all definition fields immutable after insert. No table column stores uploaded script, CSS, template, expression, dynamic import, secret, or source body. |

### Database invariants and grants

- cms_definition_state is a private enum with draft, review, approved, scheduled, active, superseded, retired, blocked. Active records are immutable; blocked may return to draft only through an audited transition. Migration state is separate and cannot be inferred from job state.
- Every bigint crosses the API as a decimal string. Every UUID FK is checked inside the same transaction. JSONB is capped at 8 KiB per manifest cell, nesting 8, object keys 128, and array length 128 unless the field contract gives a lower bound.
- Fields without a relational FK are intentional: owner_capability, target_kind, projection, transform_key, renderer_ref, and manifest JSONB values resolve against protected code registries; dry_run_id identifies an immutable compiler report validated by hash. No caller-selected table, SQL expression, or arbitrary URL is a permitted substitute for those registries.
- The SQL API exposes only cms_create_type_draft, cms_add_field_definition, cms_bind_relation, cms_activate_schema, and cms_register_block RPCs to named capability grants. anon and authenticated roles have no direct INSERT/UPDATE/DELETE grants on these tables.
- RLS policies call a schema-qualified immutable helper that resolves the verified session and acting context. SELECT policy permits only the caller's schema-design scope or an explicitly authorized code-release principal; WITH CHECK requires the same scope, registry allowlist, and current state. A SECURITY DEFINER RPC sets search_path to pg_catalog, public, and the private CMS schema, then rechecks all predicates.
- Audit and outbox rows are BE00-owned and written atomically; this spec does not add shadow audit tables. A failed audit/outbox insert rolls back the definition mutation.
- Retention keeps active/superseded definitions and migration evidence for the configured legal/audit retention. Retirement is a new state, not deletion; key uniqueness prevents reuse forever. A legal hold or incident fence prevents purge.

### Permission, RLS and grants

| Table | Read predicate | Write predicate | Grants |
|---|---|---|---|
| cms_content_types | caller has schema_designer read scope for owner capability, or approved non-sensitive registry projection | create RPC with schema_designer; lifecycle transition RPC with two approvals where required | authenticated: none direct; named RPC EXECUTE only; cms_worker: no direct table |
| cms_content_type_versions | caller may read parent ContentType and version scope; concealed versions return 404 | add/version-state RPC, expected version and immutable hash | same; migration worker may update only migration state through named function |
| cms_field_definition_versions | caller may read parent version | field RPC on unactivated draft; no update/delete | same |
| cms_relation_definitions | caller may read parent version and allowlisted projection | relation RPC with code allowlist | same |
| cms_schema_migration_plans | schema designer sees own scope; worker sees ID/version only | activation RPC creates; worker CAS updates progress; no client delete | named worker RPC; no client table grants |
| cms_block_definition_versions | authorized template/schema consumer sees supported metadata; withdrawn details hidden | signed release RPC only | release principal EXECUTE on registration RPC; no human table writes |

## Middleware & Policies

### Per-operation authorization matrix

| Operation ID | Principal and capability | Ownership / state predicate | 403 rule | 404 rule | Extra gate |
|---|---|---|---|---|---|
| CMS-03A-01 | verified human with cms.schema_designer | typeKey unused and non-reserved; acting party has registry scope | authenticated actor lacks capability or scope | concealed owner scope and already-retired key | no browser-supplied owner |
| CMS-03A-02 | verified human with cms.schema_designer | parent ContentTypeVersion belongs to caller scope and state=draft | known draft but capability missing | hidden/absent parent | stable field identity and migration classification |
| CMS-03A-03 | verified human with cms.schema_designer | parent draft and target projection in code allowlist | capability/registry scope failure | hidden/absent parent | target never grants authority |
| CMS-03A-04 | verified human with cms.schema_designer plus required approver capabilities | candidate approved, dry-run exact, no unresolved ref, active compatibility | missing capability, approval, or recent MFA | hidden/absent candidate | two distinct humans; step-up MFA; atomic switch |
| CMS-03A-05 | signed release worker with release.block_registry.write | release digest verified; key/version pair unused | browser/human/wrong release principal | unregistered release target | signature over untouched body, replay window, no CSRF |

A known resource is not disguised as 404 when policy permits existence disclosure: a valid caller with insufficient capability receives 403. A caller who cannot read the parent, a retired key lookup, or an invalid target scope receives indistinguishable 404. Structural malformed IDs are 400 before existence checks.

### Security and abuse controls

- Raw body ceiling is 256 KiB; JSON nesting is at most 8, keys 128, arrays 128, and strings are bounded by the field matrix. Unknown keys reject. No HTML, CSS, JavaScript, template source, SQL, regular-expression backtracking bombs, expressions, URLs selecting code, or dynamic imports are accepted.
- CMS-03A-05 verifies a release signature and timestamp over untouched bytes before parsing; signature failures, unknown key, stale replay, digest mismatch, and malformed body have one safe 401 WEBHOOK_REJECTED-style release rejection shape. A valid duplicate digest is idempotent; a conflicting digest creates a severity-1 security signal and no second registration.
- CSRF is required for browser cookie/session mutations after origin check. Release-worker requests use a non-browser principal and signed body; they do not receive browser authority from CORS.
- Step-up MFA is recent and bound to acting context for activation. Approval IDs cannot identify the acting submitter, cannot repeat a human, and are invalidated if the candidate hash, compiler version, dependency set, or authority changes.
- Rate limits use BE00 token buckets keyed by actor, acting party, and release principal. Concurrent definition commands are capped at 3 per actor; activation and registration are separately capped.
- Definitions and manifests are safe to log only as IDs, hashes, operation, outcome, and size. No field labels, help text, renderer source, schema values, capability graph, or private projection is sent to logs or Sentry.

## Data Flow

### Transaction and external seams

Human command flow: raw request → request ID/media guard → strict Zod parse → session and acting context → capability/resource check → idempotency reservation → one schema-qualified RPC → version/allowlist/constraint checks → definition mutation + audit + idempotency completion + outbox in one transaction → normalized response. Idempotency reservation is rolled back when validation, auth, or mutation fails; a committed result is replayable.

CMS-03A-04 flow: RPC verifies the exact dryRunId/hash/compiler version and approval set, locks candidate and current active row, rechecks all referenced fields/relations/template/block compatibility, creates or advances SchemaMigrationPlan, switches active state only when all gates pass, records cms.schema.activated.v1 in the BE00 outbox, and returns the committed resource/job. A worker receives only contentTypeVersionId, migrationPlanId, expected version, correlation ID, and causation ID.

External seam policy: the canonical definition compiler and protected registries run in-process. If deployment chooses a remote registry service, the only admitted seam is an allowlisted HTTPS adapter with request/response Zod schemas, 2,000ms RPC timeout, application route deadline 15,000ms, at most three pre-effect retries at 15s/60s/300s with jitter, and a circuit opening after five consecutive retryable failures for 60s. Invalid responses map to 502, unavailable/open circuit to 503, deadline to 504. No mutation occurs until the remote result is validated; an ambiguous post-effect response is reconciled by the idempotency key/status RPC before retry.

### State machine and concurrency

Definition state is draft → review → approved → scheduled or active → superseded or retired; blocked may return to draft. Active ContentTypeVersion, FieldDefinitionVersion, RelationDefinition, SchemaMigrationPlan definitions after completion, and BlockDefinitionVersion rows are immutable. CMS-03A-02 and CMS-03A-03 use SELECT FOR UPDATE plus expected version; two writers cannot append the same stable field or relation.

Migration state is draft → dry_running → ready or blocked → running → verifying → completed, failed_retryable, or failed_terminal. The cursor, row counts, compiler hash, transform version, and source/target hashes are durable. Worker lease expiry is recoverable; each retry rechecks state and cursor. A failed migration leaves old active schema serving, never deletes rows, and cannot silently retry a changed transform.

Activation is a compare-and-swap against candidate version and current active version. Approval, reference, compiler, allowlist, and migration evidence changes invalidate the candidate and force review again. A duplicate event or worker delivery is harmless because consumers apply exact version monotonicity and dedupe by event identity.

### Event schemas

All events use the BE00 identifier-only envelope: eventId UUID, eventType, schemaVersion, occurredAt, producer, correlationId, causationId, aggregateType, aggregateId, aggregateVersion as lossless decimal string, and payload IDs only.

| Event type | Exact payload | Producer / consumer rule |
|---|---|---|
| cms.schema.activated.v1 | { contentTypeId: UUID, schemaVersionId: UUID, migrationPlanId: UUID or null } | CMS registry emits after active switch and outbox commit; migration, editor, and projection consumers refetch exact version under their own capability. Unknown event version goes to DLQ. |
| cms.template.activated.v1 | { templateId: UUID, templateVersionId: UUID } | 03c template control plane emits after a compatible block registry change; 03a activation/preflight consumers refetch the exact block/template version. This file never emits a template event for a bare block insert. |

Event consumers never receive field values, renderer code, secrets, user IDs beyond BE00-approved envelope identifiers, or target-domain authority. Retry max is three at 15s/60s/300s, then DLQ and alert. Out-of-order events cannot regress a higher observed version.

### Cross-shard direction

- From BE00: inherit ApiError, request IDs, Idempotency-Key, If-Match, audit/outbox, job observation, queue envelope, rate, CORS, CSRF, and SLOs.
- From BE01: resolve verified human, party, acting context, capability, recent MFA, and authorization facts. Never copy identity state into CMS definitions.
- To 03b: publish exact active schema version/hash, field stable IDs, relation definitions, and cms.schema.activated.v1. Entry revisions must snapshot schema version and reject stale definitions.
- To 03c: expose immutable BlockDefinitionVersion metadata and compatibility ranges. Template and pattern commands cannot register or mutate blocks.
- To Shard 04: provide exact active schema/block version IDs for delivery preflight. Shard 04 owns public route/cache/search projections.
- To Shard 05: consume governed settings only where explicitly allowlisted; settings cannot override reserved concepts, lifecycle, security, or migration invariants.
- To Shard 16: reserved concepts prevent CMS types/templates from impersonating credentials, entitlements, credits, EvidenceState, or InstitutionGate. No upward request-time reads.

## Error Handling

### Operation error coverage

The route registry is authoritative; each row below is keyed to every operation ID and uses the same ApiError { code, message, requestId, details } envelope.

| Operation ID | Before mutation | During transaction | After commit / async | Recovery |
|---|---|---|---|---|
| CMS-03A-01 | INVALID_REQUEST, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, UNSUPPORTED_MEDIA_TYPE, VALIDATION_FAILED, RATE_LIMITED | CONFLICT for key/idempotency/unique; DEPENDENCY_UNAVAILABLE on RPC timeout | no async effect; audit is committed with draft | correct registry input, use fresh key, replay exact idempotency key |
| CMS-03A-02 | same transport/auth errors plus reserved/key/kind validation | CONFLICT for stale version, immutable identity, missing migration plan | no event; prior draft remains | refetch draft, create valid migration plan, retry with new version |
| CMS-03A-03 | same transport/auth errors plus projection/cardinality validation | CONFLICT for stale version/duplicate relation | no event; prior schema remains | choose allowlisted projection, refetch, retry |
| CMS-03A-04 | transport/auth/step-up/approval/compatibility errors | CONFLICT for stale candidate, invalid transition, idempotency; DEPENDENCY_UNAVAILABLE for compiler/RPC | committed switch remains; queued migration is observed through BE00 JobStatus | reconcile by idempotency/status; worker resumes cursor or enters failed_terminal; prior active remains until switch |
| CMS-03A-05 | signature, principal, manifest, media, registry validation errors | CONFLICT for key/version/digest/idempotency; DEPENDENCY_UNAVAILABLE for registry/RPC | committed block is immutable; downstream template preflight may block | replay exact digest; conflicting digest goes manual review; withdrawn version blocks new use |

Retry rule: clients may retry a 503/504 only with the same idempotency key after checking status; they must not blind-retry a possibly committed command. 502 invalid upstream data is not retried until the adapter or registry version changes. 429 honors Retry-After. Unknown state is surfaced as pending/degraded, never guessed as active.

## Observability

Each route emits structured, scrubbed logs keyed by operation ID, requestId, traceId, correlationId, actor class, acting-context class, safe aggregate ID/hash, expected/current version where authorized, outcome, error code, duration, dependency class, and retryability. Logs never contain request bodies, field values, capability graphs, labels/help text, renderer references, release signatures, tokens, or private domain data.

Metrics are emitted per operation: cms_definition_request_total{operation,outcome}, cms_definition_latency_ms, cms_definition_error_total{operation,code}, cms_definition_rate_limited_total, cms_definition_conflict_total{operation,reason}, cms_registry_allowlist_reject_total, cms_migration_progress, cms_migration_blocked_total, cms_activation_age, cms_block_registration_total, cms_outbox_lag, cms_queue_retry_total, and cms_queue_dlq_total. Alert thresholds: activation blocked >15m, migration retry >3, DLQ >0, outbox age >2m, conflict spike >5%/5m, or unknown event version.

Traces cover validation → session/acting-context → capability → idempotency → RPC/SQL → audit/outbox → worker/refetch. Sentry captures unexpected errors and high-risk command failures with sendDefaultPii false; audit remains PostgreSQL authority. Telemetry loss does not roll back a committed definition, but audit failure does.

SLOs: Tier 2 command p95 <1,200ms, protected RPC p95 <300ms, acceptance p99 <1,000ms, queue first attempt p95 <60s, DLQ <0.1% daily. All dashboards split human console and release-worker traffic.

## Testing Strategy

### Contract and route tests

- Generated OpenAPI, Hono route registry, and every Route Registry row match method/path, operation ID, request, success, error, CORS, auth, rate, timeout, cache, and SLO.
- CMS-03A-01 tests every ContentTypeDraftRequest field, built-in/reserved/retired/colliding key, 0/128/129 fields, stable UUID, labels, workflow, and exact ContentTypeVersionResource.
- CMS-03A-02 tests new/add/deprecate/change, all 14 FieldKind values, constraints, unknown keys, required populated data, default/null distinction, migrationPlanId, stale If-Match, and exact FieldDefinitionVersionResource.
- CMS-03A-03 tests field kind, all cardinalities and onUnavailable values, allowlisted/non-allowlisted targetKind/projection, duplicate relation, target authority non-escalation, and exact RelationDefinitionResource.
- CMS-03A-04 tests approval distinctness, recent MFA, dry-run/hash/compiler match, additive/conditional/breaking gates, unresolved references, active immutability, queued 202, exact SchemaActivationResource, and cms.schema.activated.v1 payload.
- CMS-03A-05 tests signed raw-body verification, replay window, release principal, digest duplicate/conflict, block props/renderer/children/slot/data/a11y constraints, withdrawn behavior, and exact BlockDefinitionVersionResource.
- Every operation tests 400, 401, 403, 404, 409, 415, 422, 429, 502, 503, 504, and 500 where applicable, with exact ApiError shape, safe details, Content-Type, X-Request-Id, Cache-Control, Retry-After, and RateLimit headers.

### Authorization, persistence, and concurrency tests

- Anonymous, expired session, wrong actor, wrong acting party, missing/revoked capability, stale MFA, wrong registry scope, human using release route, forged JWT metadata, and service-role misuse are tested for every operation.
- Wrong readable resource returns 403; concealed owner/version/retired key returns 404; malformed UUID is 400. Tests assert no existence or capability leakage.
- Migrations test every SQL field type/nullability/check, FK, unique/partial index, enum transition, immutable field, state terminal transition, version CAS, RLS enabled/forced, direct grant revocation, and named RPC grant.
- Concurrent same-key requests produce one row and exact replay; same Idempotency-Key with changed body/actor/path/version returns 409; failed transaction leaves no reservation/audit/outbox/definition.
- Concurrent field/relation writes, activation versus edit, approval invalidation, migration lease expiry, duplicate/out-of-order events, unknown event version, worker crash, retry/DLQ, and restore-epoch fencing are covered.

### Security, performance, and recovery tests

- Fuzz JSON depth/keys/arrays, Unicode normalization, regex limits, unknown Zod keys, raw script/CSS/template/expression payloads, SQL-like strings, signature bytes, and oversized bodies.
- Contract tests assert no uploaded executable content, arbitrary data-source/projection, target authority, or PII reaches persistence, events, logs, public responses, or cache.
- Remote compiler adapter tests assert exact 2,000ms timeout, 15s/60s/300s retry schedule, five-failure/60s circuit, 502/503/504 mapping, and ambiguous-response idempotency reconciliation.
- Benchmark representative definitions and 128-field schemas at Tier 2 p95 <1,200ms and RPC p95 <300ms; migration worker reports truthful cursor/progress.
- Recovery drill proves failed migration keeps old active schema, activation rollback before switch, resumed cursor after worker loss, DLQ replay after fix, and no duplicate active switch.

### Accessibility handoff tests

Validation failures preserve stable JSON Pointer paths and safe messages for frontend error summaries. BlockDefinitionVersion accessibility manifest requires name, keyboard, focus, and status semantics. Registry responses never require private content or raw source to render an error. Representative CMS console flows pass keyboard and screen-reader contract tests; backend emits no inaccessible opaque error.

## Deepening Passes

| Pass | Focus | Evidence | Result |
|---|---|---|---|
| 1 | Source and split completeness | All five owned interactions, six owned registry models, two owned event types, contracts, access, events, edge cases, and deep-dive headings are mapped above. | PASS |
| 2 | Endpoint and contract reconciliation | One authoritative registry row per CMS-01/02/03/04/10; request/success/error schema and operation matrix key to all five IDs. | PASS |
| 3 | Persistence hard floor | Six tables list SQL type, nullability, checks, FKs, indexes, RLS predicates, grants, immutability, and retention. | PASS |
| 4 | State/concurrency/failure | CAS, immutable versions, migration cursor/lease, idempotency, outbox atomicity, old-active fallback, and DLQ behavior are explicit. | PASS |
| 5 | Security and disclosure | CORS is named per operation; CSRF, step-up, release signature, allowlists, 403/404, no executable content, and no PII logging are explicit. | PASS |
| 6 | External seams and operations | Remote adapter timeout/retry/backoff/circuit and 502/503/504 mapping are exact; metrics, traces, SLOs, and alert thresholds are per operation. | PASS |
| 7 | Testability | Every operation has field, error, auth, RLS, idempotency, concurrency, event, performance, recovery, and accessibility tests. | PASS |
| 8 | Cross-shard contracts | BE00/BE01/03b/03c/04/05/16 producer-consumer ownership, identifier-only events, and DEC-100 bounded references are explicit. | PASS |
| 9 | Two-implementer convergence | Two implementers using only this document choose the same routes, schemas, states, transaction boundaries, and denial behavior. | PASS |
| 10 | Adversarial review | Reserved concepts, key reuse, active mutation, stale approvals, unauthorized projections, release spoofing, duplicate effects, and existence leakage have deterministic refusals. | PASS |

## Ambiguity Gate

- Micro ambiguity PASS: every request field has a type, bound, null/default rule, unknown-key policy, and failure; every state transition names its guard and recovery; every operation has auth, CORS, rate, idempotency, If-Match, error, observability, and test rows.
- Macro ambiguity PASS: create → draft → field/relation changes → compile/dry-run → two-person activation → migration worker → downstream refetch is a single deterministic flow with no hidden endpoint or ownership handoff.
- Two-implementer PASS: independent implementers can derive the same six tables, five operation IDs, Zod schemas, event payloads, RPC transaction boundary, and 403/404 policy.
- Devil's-advocate PASS: hostile admin upload, reserved key reuse, relation-to-private-domain target, approval race, stale compiler, duplicate release digest, worker crash, and telemetry outage produce safe typed outcomes.
- No unresolved product, architecture, security, or implementation ambiguity remains in this boundary.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Classified IA Shard 03 into registry, editorial/publication, and composition/taxonomy/localization backend boundaries. | /write-be-spec-classify | Split Group, Classification |
| 2026-08-28 | Authored complete content schema registry backend contract for CMS-01, CMS-02, CMS-03, CMS-04, and CMS-10. | /write-be-spec-write | All |

## Dependency References

- [IA Shard 03 — CMS content modeling and authoring](../ia/03-cms-content-modeling.md)
- [IA Shard 03 deep dive — CMS content modeling and authoring](../ia/deep-dives/03-cms-content-modeling.md)
- [BE00 — Cross-cutting platform foundation](00-infrastructure.md)
- [BE01 — Identity authority and party governance](01a-auth-account-linking.md)
- [BE02 — Shadow/profile/credentials boundaries](02a-shadow-claim-ownership.md)
- [Architecture Design](../2026-08-02-architecture-design.md)
- [Data Placement Strategy](../data-placement-strategy.md)
- [DEC-100 — bounded allowlisted cross-shard projections](../../decisions.md#dec-100-shard-02-accepts-bounded-inbound-evidence-and-policy-commands-without-upward-store-reads-2026-08-28)
