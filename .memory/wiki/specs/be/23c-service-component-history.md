# BE-23c — Gear Service and Component History

Status: Complete

This specification turns IA Shard 23 interactions GPR-11 and GPR-12 into two
authenticated Hono commands for append-only service history and component-level
modification facts. It owns service_event and component_fact persistence and
their safe event publication. It consumes identity, party, mandate, work-order
and valuation boundaries without treating a service entry as proof of title,
possession or whole-item originality.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Classification | Multi-domain split, service/component-history subdomain | BE index line 40 assigns 23c to service/components; IA interaction table lines 66-79 assigns GPR-11 and GPR-12. |
| Backend surface | Authenticated Hono REST commands, protected evidence references, Supabase RPCs, transactional outbox events | IA Contracts lines 106-120 and Access Control lines 165-187; BE00 Middleware lines 253-297 and Events lines 357-415. |
| Canonical owner | 23c owns service_event and component_fact, including configuration version, work evidence, originality provenance and supersession state | IA Data Models lines 123-140 and Typed Field Registry lines 142-163. |
| Consumed boundaries | 23a gear_record, gear_identity_key, gear_identifier_fact and gear_chain_event; Shard 01 party/mandate; completed Shard 14 or Shard 05 work order; Shard 23d valuation invalidation | IA GPR-11/GPR-12 lines 78-79, Access Control lines 169-176, and Cross-Shard Map lines 263-273. |
| Explicit non-ownership | Gear identity, theft flags/screenings/sightings, valuation/appraisal/insurance and discography remain companion boundaries 23a, 23b and 23d | IA Scope Reconciliation lines 13-20 and interactions lines 68-83. |
| Split validity | PASS: work history and component continuity share an append-only evidence boundary; no GPR-11/GPR-12 interaction is split across 23a, 23b or 23d | Approved BE index split plus IA interaction Preconditions, Required behavior, Completion and Failure / recovery lines 78-79. |

## Referenced Material Inventory

| Source file | Section and lines | Material consumed |
|---|---|---|
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Overview lines 7-9 | Shard ownership of service/modification history and evidence-preserving gear provenance. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Scope Reconciliation lines 11-20 | Service/component history boundary and protected evidence privacy. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Registry Decisions lines 22-35 | Append-only history, component-level originality, no silent valuation and no title inference. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Acceptance Criteria lines 57-58 | Normative AC-GPR-11 and AC-GPR-12 validation, authorization, version, idempotency, completion and recovery. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Interactions lines 78-79 | Exact GPR-11 and GPR-12 preconditions, behavior, completion and failure/recovery. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Global Interaction Rules lines 85-91 | Distinct identity, possession, ownership and history; retention and protected evidence. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Contracts lines 106-120 | AppendServiceEvent and component continuity contract; exact error vocabulary and no silent revaluation. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Data Models lines 123-140 | Canonical service_event and component_fact relationships and adjacent model boundaries. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Typed Field and Cardinality Registry lines 142-163 | Deterministic SQL types, required core fields, cardinality and constraints. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Access Control lines 165-187 | Owner, provider, possessor, reviewer and service-principal permissions and escalation limits. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Event Schemas lines 198-213 | gear.service.changed.v1 payload and exclusion of serials, locations, names, contact, documents and private detail. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Dependency References lines 235-240 and Cross-Shard Map lines 263-273 | BE00, Shards 01, 05, 06, 07, 08, 14, 24, 25 and 26 direction and producer ownership. |
| .memory/wiki/specs/ia/deep-dives/23-gear-provenance-registry.md | Service, Value and Discography Algorithm lines 40-48 | Completed work-order/manual declaration, component originality and modification effects on valuation. |
| .memory/wiki/specs/ia/deep-dives/23-gear-provenance-registry.md | Implementation Envelope lines 73-79 | Supabase/RLS, typed Hono/Zod boundaries, outbox, provider adapters and failure handling. |
| .memory/wiki/specs/be/00-infrastructure.md | Zod Contracts lines 112-200 | Strict Zod 4 objects, ApiError four-field envelope, details limits and response headers. |
| .memory/wiki/specs/be/00-infrastructure.md | Database Schema lines 202-251 | platform_private boundary, forced RLS, RPC-only access, idempotency, audit and outbox. |
| .memory/wiki/specs/be/00-infrastructure.md | Middleware lines 253-297 | Middleware order, CORS, authentication, acting context, capability and concurrency rules. |
| .memory/wiki/specs/be/00-infrastructure.md | Events lines 357-415 | Outbox envelope, leasing, retry and consumer recovery. |
| .memory/wiki/specs/be/00-infrastructure.md | Error and Observability lines 416-461 | Boundary mapping, compensation, structured audit, metrics, traces and redaction. |
| .memory/wiki/specs/be/00-infrastructure.md | Testing Strategy lines 476-505 | Contract, RLS, provider, event, idempotency and recovery test obligations. |

## IA Source Map

### Assigned interactions

| IA ID | Source trace | Backend realization | Completion and non-negotiable recovery |
|---|---|---|---|
| GPR-11 | IA 23-gear-provenance-registry.md lines 78 and 57; deep dive lines 40-43 | BE23C-GPR11 records a completed Shard 14 or Shard 05 work order with provider mandate, pinned gear/configuration version, parts, measurements, evidence and owner approval. | Returns an append-only service_event and safe event reference. Missing work completion or owner approval fails before mutation; a correction supersedes and never deletes. No service entry means no history recorded, never never-serviced. |
| GPR-12 | IA 23-gear-provenance-registry.md lines 79 and 58; deep dive lines 42-45 | BE23C-GPR12 records an owner-controlled add, remove or replace component fact with component-level originality provenance. | Returns a versioned component_fact. Serial-bearing replacement preserves the old identity key and calls 23a for an additive identity fact; prior valuation is invalidated or queued for review, never silently recalculated. Whole-item originality claims are rejected. |

### Canonical Data Models

| IA model name | 23c relationship and ownership |
|---|---|
| gear_record | Consumed parent aggregate from 23a; gear_id and owner predicate are checked, never rewritten by 23c. |
| gear_identity_key | Consumed key/version from 23a; a serial-bearing replacement is delegated to 23a. |
| gear_identifier_fact | Consumed and, when required, extended by 23a through its protected identity command; 23c does not own identifier truth. |
| gear_claim | Consumed only for owner-standing checks; no title adjudication. |
| claim_evidence | Consumed only through purpose-scoped evidence references; no public evidence access. |
| gear_chain_event | 23a owns the chain projection; 23c publishes a service event for the chain to consume. |
| gear_transfer | Consumed only to pin transfer/configuration context when a prior transfer is relevant; no transfer route is duplicated. |
| gear_duplicate_case | Consumed only as a protected identity context; 23c never merges records. |
| theft_case | Consumed only for protected projection boundaries; no theft route is duplicated. |
| theft_flag | Consumed only to prevent unsafe disclosure in history projections; 23c never changes its state. |
| gear_screening | Consumed only to preserve the screening boundary; no screening route is duplicated. |
| gear_sighting | Consumed only as protected recovery context; sighting identity/location never enters service facts. |
| service_event | Canonical 23c append-only record of completed work, provider mandate, parts, measurements, evidence and configuration. |
| component_fact | Canonical 23c append-only record of component add/remove/replace state and originality provenance. |
| valuation_estimate | Owned by 23d; a component mutation sends an invalidation/review signal and never writes valuation fields. |
| appraisal_record | Owned by 23d; appraisal documents are not accepted as a substitute for a service or component fact. |
| insurance_pack | Owned by 23d; 23c exposes only evidence references under the owner projection. |
| gear_credit_link | Owned by 23d/credit boundary; service history contains no discography or credit visibility expansion. |

### Event Schemas

| IA event type | 23c use | Safe payload rule |
|---|---|---|
| gear.identity.changed.v1 | Consumed after a serial-bearing component replacement is accepted by 23a. | Identity version and confidence only; no raw serial, location or evidence. |
| gear.claim.changed.v1 | Consumed for owner-standing projection invalidation. | Claim state/tier and pseudonymous gear reference only. |
| gear.transfer.changed.v1 | Consumed to pin transfer/configuration context when required. | Transfer state/version only; no parties, consideration or evidence. |
| gear.theft-flag.changed.v1 | Consumed for protected-history disclosure policy. | Flag state/weight class/version only. |
| gear.sighting.changed.v1 | Consumed only by protected recovery projections, never persisted into service history. | Case/sighting state/version only; no location/contact. |
| gear.service.changed.v1 | Produced by GPR-11 and GPR-12 after canonical commit. | Gear pseudonym, service/component event reference, configuration version, state and evidence class; no private detail. |
| gear.valuation.changed.v1 | Consumed by 23c only to mark an eventual valuation-review acknowledgement. | Estimate state/evidence class/version; no values in service telemetry. |
| gear.appraisal.changed.v1 | Consumed only to keep private-document boundaries intact. | Appraisal state/version only. |
| gear.insurance-pack.changed.v1 | Consumed only for owner-pack evidence projection. | Pack state/version only. |
| gear.credit-link.changed.v1 | Consumed only to ensure service history cannot widen discography visibility. | Gear/credit state only; no hidden use details. |

## Endpoint Reconciliation

The approved 23c split has one command endpoint per assigned IA interaction. The
route registry below is authoritative for this file. BE00 platform endpoints,
23a identity/chain endpoints, 23b theft/recovery endpoints and 23d valuation
endpoints are dependencies and are not copied here.

| IA interaction | Operation ID | Route | Why this boundary is complete |
|---|---|---|---|
| GPR-11 service provider records work | BE23C-GPR11 | POST /api/v1/gear/records/:gearId/service-events | A single transaction verifies completed work, mandate and approval, writes service_event/component facts and schedules event/audit effects. |
| GPR-12 owner records manual modification | BE23C-GPR12 | POST /api/v1/gear/records/:gearId/component-modifications | A single transaction writes the component-level fact and schedules 23a identity continuity and 23d valuation review where applicable. |
| Service-history read | Inherited projection | No 23c route | 23a provenance-view and downstream owner projections consume immutable facts; a new read route would duplicate projection ownership and could leak evidence. |
| Identity correction or serial replacement | 23a command | No 23c route | 23c requests 23a identity continuity for the replacement; 23a remains canonical for gear_identity_key and gear_identifier_fact. |
| Valuation invalidation/recalculation | 23d command/event | No 23c route | 23c emits a review signal only; 23d owns valuation_estimate and appraisal_record. |

## API Endpoints

### Authoritative Route Registry

This is the only 23c route registry. Every later registry uses these stable
operation IDs. No route is shared with 23a, 23b, 23d or BE00.

| Operation ID | Method | Path | Capability | Response |
|---|---|---|---|---|
| BE23C-GPR11 | POST | /api/v1/gear/records/:gearId/service-events | gear.service_append | Gpr11Success |
| BE23C-GPR12 | POST | /api/v1/gear/records/:gearId/component-modifications | gear.component_modify | Gpr12Success |

### Request/Response Contracts (Zod 4)

Zod 4 schemas are strict runtime contracts. The same schemas validate Hono
inputs, generated OpenAPI, success bodies, event payloads and contract tests.
Unknown keys, raw serial values and whole-item originality assertions fail
validation before any existence-sensitive lookup.

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
const LongText = z.string().trim().min(1).max(2000);

const CommandMeta = z.object({
  requestId: Uuid,
  idempotencyKey: z.string().trim().min(16).max(128),
  expectedGearVersion: Version,
  actorContextId: Uuid,
}).strict();

const EvidenceRef = z.object({
  evidenceId: Uuid,
  evidenceType: z.enum([
    "work_order",
    "owner_approval",
    "invoice",
    "measurement",
    "photo",
    "provider_note",
    "owner_statement",
  ]),
  digest: Digest,
  purpose: z.enum(["service_history", "component_provenance"]),
  capturedAt: Timestamp,
}).strict();

const PartRef = z.object({
  componentKey: ShortText.nullable(),
  partNumber: ShortText,
  manufacturer: ShortText.nullable(),
  action: z.enum(["installed", "removed", "replaced", "retained"]),
  quantity: z.number().int().positive().max(10000),
}).strict();

const Measurement = z.object({
  name: ShortText,
  value: z.number().finite(),
  unit: ShortText,
  capturedAt: Timestamp,
}).strict();

const OwnerApproval = z.object({
  approvalRef: ShortText,
  approvedByPartyId: Uuid,
  approvedAt: Timestamp,
  approvalVersion: Version,
}).strict();

const ServiceComponentDelta = z.object({
  componentKey: ShortText,
  operation: z.enum(["added", "removed", "replaced", "retained"]),
  serialBearing: z.boolean(),
  provenanceEvidence: z.array(EvidenceRef).min(1).max(20),
}).strict();

const Gpr11Request = z.object({
  gearId: Uuid,
  workOrderId: Uuid,
  workOrderSource: z.enum(["shard14", "shard05"]),
  workOrderVersion: Version,
  configurationVersion: Version,
  serviceKind: z.enum([
    "inspection",
    "maintenance",
    "repair",
    "calibration",
    "restoration",
    "modification",
  ]),
  performedAt: Timestamp,
  summary: LongText,
  parts: z.array(PartRef).max(100),
  measurements: z.array(Measurement).max(100),
  evidence: z.array(EvidenceRef).min(1).max(50),
  ownerApproval: OwnerApproval,
  componentDeltas: z.array(ServiceComponentDelta).max(100),
  meta: CommandMeta,
}).strict();

const Gpr11Success = z.object({
  operationId: z.literal("BE23C-GPR11"),
  gearId: Uuid,
  serviceEventId: Uuid,
  componentFactIds: z.array(Uuid),
  configurationVersion: Version,
  serviceState: z.enum(["recorded", "superseded"]),
  eventType: z.literal("gear.service.changed.v1"),
  evidenceClass: z.enum(["owner_approved", "provider_attested", "mixed"]),
  supersedesServiceEventId: Uuid.nullable(),
  version: Version,
  createdAt: Timestamp,
}).strict();

const ComponentProvenance = z.object({
  basis: z.enum([
    "manufacturer_record",
    "purchase_record",
    "provider_observation",
    "owner_statement",
    "serial_fact",
    "unknown",
  ]),
  statement: LongText,
  evidence: z.array(EvidenceRef).min(1).max(20),
}).strict();

const Gpr12Request = z.object({
  gearId: Uuid,
  configurationVersion: Version,
  componentKey: ShortText,
  componentType: z.enum([
    "body",
    "neck",
    "pickup",
    "bridge",
    "hardware",
    "electronics",
    "speaker",
    "case",
    "other",
  ]),
  operation: z.enum(["added", "removed", "replaced"]),
  serialBearing: z.boolean(),
  priorComponentFactId: Uuid.nullable(),
  replacementComponentKey: ShortText.nullable(),
  manufacturer: ShortText.nullable(),
  model: ShortText.nullable(),
  serialDigest: Digest.nullable(),
  originality: ComponentProvenance,
  effectiveAt: Timestamp,
  meta: CommandMeta,
}).strict();

const Gpr12Success = z.object({
  operationId: z.literal("BE23C-GPR12"),
  gearId: Uuid,
  componentFactId: Uuid,
  componentKey: ShortText,
  componentState: z.enum(["active", "removed", "superseded", "contested"]),
  configurationVersion: Version,
  identityFactId: Uuid.nullable(),
  valuationReview: z.enum(["not_required", "queued", "required"]),
  eventType: z.literal("gear.service.changed.v1"),
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

The request schemas require a caller-supplied expectedGearVersion inside
CommandMeta and an Idempotency-Key header whose normalized value must equal
meta.idempotencyKey. If-Match, when supplied, must contain the same quoted
version. Success responses contain no evidence bytes, provider text, raw
serial, exact location, owner contact or private document URL. Every error is
exactly the BE00/global ApiError { code, message, requestId, details } contract;
HTTP status is carried on the response line, not added to the JSON body.

### Contract Registry

| Operation ID | Request schema | Success schema | Domain errors | Global failure shape |
|---|---|---|---|---|
| BE23C-GPR11 | Gpr11Request; path gearId must equal body gearId; Idempotency-Key and expected version required | Gpr11Success; service_event and any component facts committed together | SERVICE_WORK_ORDER_INCOMPLETE, OWNER_APPROVAL_REQUIRED, MANDATE_OUT_OF_SCOPE, FORBIDDEN, NOT_FOUND, CONFLICT, DEPENDENCY_UNAVAILABLE | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details }. |
| BE23C-GPR12 | Gpr12Request; path gearId must equal body gearId; owner context and expected version required | Gpr12Success; component_fact committed with identity/valuation follow-up state | COMPONENT_PROVENANCE_REQUIRED, IDENTITY_KEY_INCOMPLETE, IDENTITY_KEY_CONFLICT, FORBIDDEN, NOT_FOUND, CONFLICT, DEPENDENCY_UNAVAILABLE | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details }. |

### Error Registry

| Operation ID | HTTP and code | Trigger and safe details |
|---|---|---|
| BE23C-GPR11 | 400 INVALID_REQUEST or 422 VALIDATION_FAILED | Malformed path/header/body or invalid field combination. Details use BE00 FieldViolation rows and never include evidence content. |
| BE23C-GPR11 | 401 UNAUTHENTICATED or STEP_UP_REQUIRED | Missing/expired session or a provider mandate requiring fresh step-up. No resource lookup occurs. |
| BE23C-GPR11 | 403 FORBIDDEN or MANDATE_OUT_OF_SCOPE | Provider is authenticated but its mandate does not cover this work order/gear or it requests unrelated history/private packs. Details contain only reasonCode and recoveryAction. |
| BE23C-GPR11 | 404 NOT_FOUND | Gear or work order is absent, revoked, or concealed by the caller's party projection. A valid but unauthorized target is returned as 403 only after the authorization predicate is safely evaluated; concealed existence is always 404. |
| BE23C-GPR11 | 409 CONFLICT | Stale expectedGearVersion, duplicate non-equivalent idempotency key, or invalid supersession. Details use BE00 conflict VERSION_MISMATCH, IDEMPOTENCY_MISMATCH or INVALID_TRANSITION. |
| BE23C-GPR11 | 422 SERVICE_WORK_ORDER_INCOMPLETE or OWNER_APPROVAL_REQUIRED | Work order is not completed/verified, configuration is not pinned, required evidence is absent, or approval is missing/revoked. No service row is written. |
| BE23C-GPR11 | 502/503/504 DEPENDENCY_UNAVAILABLE | Shard 14/05 verification, Shard 01 mandate, or BE00 admission is unavailable or times out. Details contain dependencyClass and retryable true; transfer/title state is not inferred. |
| BE23C-GPR11 | 429 RATE_LIMITED | Actor, provider party or gear quota exceeded. Retry-After and RateLimit headers match BE00 details. |
| BE23C-GPR12 | 400 INVALID_REQUEST or 422 VALIDATION_FAILED | Unknown fields, path/body mismatch, invalid operation/component combination, or attempted whole-item originality assertion. |
| BE23C-GPR12 | 401 UNAUTHENTICATED | Session or acting context is absent, expired or ambiguous. No target existence is disclosed. |
| BE23C-GPR12 | 403 FORBIDDEN | Caller is not the current controlling owner/party, or attempts to read/write provider mandate, unrelated history or private packs. Details contain no owner identity. |
| BE23C-GPR12 | 404 NOT_FOUND | Gear or prior component fact is absent, revoked, or concealed. A hidden target is indistinguishable from absence. |
| BE23C-GPR12 | 409 CONFLICT, IDENTITY_KEY_CONFLICT | Stale gear/configuration version, idempotency mismatch, or replacement key collides in 23a. Details use a BE00 conflict value and recovery action; no partial component fact remains. |
| BE23C-GPR12 | 422 COMPONENT_PROVENANCE_REQUIRED or IDENTITY_KEY_INCOMPLETE | Component/originality provenance is missing, serial-bearing replacement lacks a resolvable key, or the new component identity cannot be normalized. |
| BE23C-GPR12 | 502/503/504 DEPENDENCY_UNAVAILABLE | 23a identity continuity admission or BE00 transaction admission fails. The component command remains uncommitted and can be safely retried with the same idempotency key. |
| BE23C-GPR12 | 429 RATE_LIMITED | Owner, acting party or gear quota exceeded; no mutation occurs. |

All domain codes conform to the BE00 uppercase code pattern. The endpoint
never returns a 403 for an anonymous request that has not authenticated, and
never returns a 404 after it has disclosed that a protected resource exists.
Error messages are safe/localizable and details are capped at 16 keys, four
levels and 8 KiB as required by BE00.

### Authorization and Middleware Registry

| Operation ID | Authentication and role | Ownership/mandate predicate and 403-vs-404 | Middleware, including CORS |
|---|---|---|---|
| BE23C-GPR11 | Authenticated provider, or registered service principal bound to the provider work-order adapter | Provider party must own the completed work-order mandate for gearId and purpose service_history. A known actor with an evaluated but failed mandate receives 403; an absent or concealed gear/work order receives 404. Provider cannot read unrelated history, private packs or owner contact. | Route inventory and request ID; TLS/body/header limits; CORS policy gear-api with explicit web/PWA origins, credentials only for allowlisted origins, no wildcard, Vary Origin; Supabase session/service-principal verification; Shard 01 acting-party resolution; strict Zod validation; provider/gear rate limit; capability and mandate check; BE00 idempotency and expected-version CAS; transaction/RPC; response/error normalization; sanitized trace/audit completion. |
| BE23C-GPR12 | Authenticated current owner or controlling acting party with gear.service_modify capability | Current 23a owner/party predicate and gear version must match. A known caller without control receives 403; absent, revoked or concealed gear/component receives 404. Holder, possessor, provider and reviewer cannot use the owner command. | Route inventory and request ID; TLS/body/header limits; CORS policy gear-api with explicit web/PWA origins, credentials only for allowlisted origins, no wildcard, Vary Origin; Supabase session verification; Shard 01 acting-context resolution; strict Zod validation; owner/gear rate limit; capability and owner predicate; BE00 idempotency and expected-version CAS; transaction/RPC; 23a/23d outbox scheduling; response/error normalization; sanitized trace/audit completion. |

No browser role receives a direct table grant. The service credential is not an
authorization decision. RPCs revalidate actor, acting party, capability,
mandate, owner standing, target version and purpose even when Hono has already
checked them. Cookie-authenticated mutations require same-origin CSRF binding;
token clients require the registered authorization header and no ambient
cookie.

### Idempotency and Concurrency Registry

| Operation ID | Idempotency contract | Version and race handling | Atomicity and replay |
|---|---|---|---|
| BE23C-GPR11 | Require Idempotency-Key 16-128 characters. Scope key by actor, operation and gearId. Store a SHA-256 normalized request hash in inherited BE00 idempotency_records for 30 days. | Lock gear_record through 23a named RPC, compare expectedGearVersion and workOrderVersion, and serialize work-order/configuration duplicates. A losing writer receives typed 409 VERSION_MISMATCH; no second service event is created. | Reserve idempotency, validate completed work, append service_event/component facts, append audit and outbox rows, and complete the replay result in one transaction. Same request replay returns byte-equivalent Gpr11Success; key reuse with another request returns IDEMPOTENCY_MISMATCH and no effect. |
| BE23C-GPR12 | Require Idempotency-Key 16-128 characters. Scope key by actor, operation and gearId. The normalized component payload, expected versions and identity intent are hashed. | Lock gear_record and the component key; compare expectedGearVersion and configurationVersion. A serial-bearing replacement also uses 23a CAS on identity version. A losing writer receives 409 and cannot leave an orphan component fact. | Reserve idempotency, append component_fact, atomically persist audit/outbox and the 23a identity command result when needed, then complete replay. 23d valuation review is represented by durable outbox state; replay never duplicates review work. |

Rejected validation, authorization, version and dependency outcomes are
registered replayable outcomes only after the BE00 reservation policy permits
it; no retry may bypass a new authorization decision. Transaction rollback
removes all domain, audit and outbox writes except the immutable idempotency
failure record required for safe replay.

### Rate, CORS and SLO Registry

| Operation ID | Rate limit | CORS policy | Deadline and response SLO |
|---|---|---|---|
| BE23C-GPR11 | 20 requests/minute/provider actor, 60/minute/gear, burst 5/10 seconds; BE00 global quota can tighten it | gear-api allowlist only; POST and OPTIONS; explicit origins, no wildcard with credentials, Vary Origin, no exposed private headers | 15 second hard request deadline; p95 <= 1.5 seconds when dependencies are healthy; return 503/504 cannot-commit before deadline, never pretend completion. |
| BE23C-GPR12 | 30 requests/minute/owner actor, 90/minute/gear, burst 8/10 seconds; BE00 global quota can tighten it | gear-api allowlist only; POST and OPTIONS; explicit origins, no wildcard with credentials, Vary Origin, no exposed private headers | 15 second hard request deadline; p95 <= 1.0 seconds without 23a dependency and <= 2.0 seconds with it; durable outbox acknowledgement may finish valuation review asynchronously. |

Rate-limit keys use resolved actor/party/gear identity, never a caller-supplied
owner ID. OPTIONS has no mutation capability and returns only registered
methods and headers. Error responses include no-store and matching
RateLimit-* and Retry-After headers.

### Observability Registry

| Operation ID | Trace and metrics | Audit and redaction |
|---|---|---|
| BE23C-GPR11 | Trace span names operation ID, requestId, correlationId, gear aggregate hash, work-order source and dependency class. Metrics count accepted, replayed, validation_denied, forbidden, not_found, conflict, dependency_unavailable, latency and outbox lag. | Audit records actor/acting party, target UUID hash, mandate decision, work-order source, outcome and reason code. Never log summary, provider note, parts, measurements, approval text, evidence IDs/digests, serials, location or private URLs. |
| BE23C-GPR12 | Trace span names operation ID, requestId, correlationId, gear aggregate hash, component operation, serialBearing boolean and dependency class. Metrics count accepted, replayed, identity_conflict, valuation_review_queued, denied, conflict, latency and outbox lag. | Audit records actor/acting party, target UUID hash, component-key hash, operation, authorization outcome, identity continuity outcome and reason code. Never log component label, manufacturer/model/serial, provenance statement, evidence content or owner identity. |

Request IDs are returned as X-Request-Id and are validated as UUIDs. Structured
logs carry stable operation IDs and safe enumerations only. Sentry events
receive the correlation ID, operation ID and sanitized code; breadcrumbs and
request bodies are disabled for evidence-bearing fields.

## Database Schema

All 23c tables live in non-exposed platform_private with RLS enabled and
forced. The 23a gear_record and identity tables, Shard 01 identity.party and
the completed work-order tables are cross-boundary foreign-key targets. The
application has no table grants; named security-invoker RPCs repeat actor,
owner/mandate, purpose and expected-version predicates. Any security-definer
helper uses an empty fixed search_path, fully qualified names, revoked PUBLIC
execution and positive/negative authorization tests.

### Complete Table Definitions

| Table / model | Columns with SQL type, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.service_events / service_event | id uuid NOT NULL PK DEFAULT gen_random_uuid(); gear_id uuid NOT NULL FK platform_private.gear_records(id); owner_id uuid NOT NULL FK identity.party(id); provider_party_id uuid NOT NULL FK identity.party(id); shard14_work_order_id uuid NULL FK services.work_orders(id); shard05_work_order_id uuid NULL FK legacy_services.work_orders(id); work_order_source service_work_order_source NOT NULL CHECK IN shard14,shard05; work_order_version bigint NOT NULL CHECK >0; CHECK ((work_order_source = 'shard14' AND shard14_work_order_id IS NOT NULL AND shard05_work_order_id IS NULL) OR (work_order_source = 'shard05' AND shard05_work_order_id IS NOT NULL AND shard14_work_order_id IS NULL)); configuration_version bigint NOT NULL CHECK >0; service_kind service_kind NOT NULL CHECK IN inspection,maintenance,repair,calibration,restoration,modification; summary text NOT NULL CHECK char_length(summary) BETWEEN 1 AND 2000; performed_at timestamptz NOT NULL; parts jsonb NOT NULL DEFAULT []; CHECK jsonb_typeof(parts)=array and jsonb_array_length(parts)<=100; measurements jsonb NOT NULL DEFAULT []; CHECK jsonb_typeof(measurements)=array and jsonb_array_length(measurements)<=100; evidence_refs uuid[] NOT NULL CHECK cardinality(evidence_refs)>=1; owner_approval_ref text NOT NULL CHECK char_length(owner_approval_ref) BETWEEN 1 AND 256; supersedes_event_id uuid NULL FK platform_private.service_events(id); state service_event_state NOT NULL CHECK IN recorded,superseded; version bigint NOT NULL CHECK >0; correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK work_order_source = 'shard14' OR work_order_source = 'shard05' | PK; partial UNIQUE gear_id,shard14_work_order_id,work_order_version where work_order_source='shard14'; partial UNIQUE gear_id,shard05_work_order_id,work_order_version where work_order_source='shard05'; gear_id,performed_at DESC,id; provider_party_id,performed_at DESC; shard14_work_order_id; shard05_work_order_id; supersedes_event_id; state,created_at | Forced RLS. Owner projection may read its own gear history; provider may insert/read only its mandated work order through RPC; assigned reviewer gets purpose-scoped projection; queue may read event by lease. anon and authenticated direct table grants denied; UPDATE/DELETE denied to application roles. |
| platform_private.component_facts / component_fact | id uuid NOT NULL PK DEFAULT gen_random_uuid(); gear_id uuid NOT NULL FK platform_private.gear_records(id); owner_id uuid NOT NULL FK identity.party(id); service_event_id uuid NULL FK platform_private.service_events(id); configuration_version bigint NOT NULL CHECK >0; component_key text NOT NULL CHECK char_length(component_key) BETWEEN 1 AND 256; component_type component_type NOT NULL CHECK IN body,neck,pickup,bridge,hardware,electronics,speaker,case,other; operation component_operation NOT NULL CHECK IN added,removed,replaced,retained; serial_bearing boolean NOT NULL; prior_component_fact_id uuid NULL FK platform_private.component_facts(id); replacement_component_key text NULL CHECK replacement_component_key IS NULL OR char_length(replacement_component_key) BETWEEN 1 AND 256; manufacturer text NULL CHECK manufacturer IS NULL OR char_length(manufacturer) BETWEEN 1 AND 256; model text NULL CHECK model IS NULL OR char_length(model) BETWEEN 1 AND 256; serial_digest bytea NULL CHECK serial_digest IS NULL OR octet_length(serial_digest)=32; originality_basis originality_basis NOT NULL CHECK IN manufacturer_record,purchase_record,provider_observation,owner_statement,serial_fact,unknown; originality_statement text NOT NULL CHECK char_length(originality_statement) BETWEEN 1 AND 2000; provenance_evidence_refs uuid[] NOT NULL CHECK cardinality(provenance_evidence_refs)>=1; identity_fact_id uuid NULL FK platform_private.gear_identifier_facts(id); effective_at timestamptz NOT NULL; supersedes_fact_id uuid NULL FK platform_private.component_facts(id); valuation_review_required boolean NOT NULL DEFAULT true; state component_fact_state NOT NULL CHECK IN active,removed,superseded,contested; version bigint NOT NULL CHECK >0; correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK serial_bearing=false OR serial_digest IS NOT NULL; CHECK operation <> replaced OR prior_component_fact_id IS NOT NULL; UNIQUE gear_id,component_key,version | PK; gear_id,component_key,effective_at DESC,id; gear_id,configuration_version; service_event_id; prior_component_fact_id; identity_fact_id; partial gear_id,component_key where state=active; valuation_review_required where true | Forced RLS. Owner may read/write its own facts only through owner RPC; provider may attach facts only within a completed mandated service RPC; assigned reviewer receives purpose-scoped projection; queue may read by event lease. anon and authenticated direct table grants denied; UPDATE/DELETE denied to application roles. |

Cross-shard FK names are explicit implementation contracts: services.work_orders
is the canonical Shard 14 completed-work reference and
legacy_services.work_orders is the Shard 05 reference. The adapter verifies
that exactly one target matches work_order_source, the work order belongs to
gear_id, status is completed, configuration_version is pinned, and
provider_party_id is the mandated provider before the domain transaction. A
migration may normalize both into one canonical work-order view, but it may not
remove the source, version or FK/predicate from this contract.

### Shared persistence invariants

- Every command reserves inherited BE00 idempotency using actor, operation,
  request hash and gear target. Domain rows, audit events and outbox events
  commit atomically.
- service_event and component_fact are append-only. A correction creates a new
  fact with supersedes_fact_id or supersedes_event_id; no update or delete
  removes relied-upon history.
- GPR-11 accepts only a completed, verified Shard 14 or Shard 05 work order
  with provider mandate, pinned configuration, required evidence and owner
  approval. A police, theft, marketplace or title state is never inferred.
- GPR-12 accepts only a current controlling owner and component-level
  originality provenance. There is no whole-item originality field or command.
- A serial-bearing replacement preserves the old 23a key/fact history and
  commits its new 23a identity fact in the same logical command. An identity
  conflict rolls back the component fact.
- A component modification sets valuation_review_required and publishes a
  durable 23d review signal. It never writes a valuation value or treats a
  valuation_estimate as service evidence.
- Public and downstream event projections contain no raw serial, exact
  location, party name/contact, evidence bytes, private document URL or
  provider note. No service history means no history recorded, never
  never-serviced.
- Erasure/revocation removes derived projections and object access while
  retaining legally required immutable evidence/tombstones. No service
  credential bypasses RLS or purpose grants.

## Middleware & Policies

### Hono order and security

1. Match only the route registry, attach UUID requestId, operation ID, trace
   and correlation context, and enforce URL/header/body ceilings.
2. Apply TLS/security headers and CORS policy gear-api. Allow only registered
   product web/PWA origins, POST and OPTIONS, and never wildcard credentials.
3. Authenticate the Supabase session or registered provider service principal.
   Reject caller-supplied actor, owner or provider identity where it is not
   derived from the verified principal.
4. Resolve Shard 01 acting party, current owner standing, provider mandate and
   target party context. Ambiguous context fails closed.
5. Apply actor, party and gear rate limits before resource-sensitive work.
6. Validate path, headers and strict Zod body; require path gearId to equal body
   gearId and Idempotency-Key to equal meta.idempotencyKey.
7. Authorize capability, owner/mandate/purpose, evidence visibility and
   expected version. Use RLS/RPC predicates as defense in depth.
8. Reserve BE00 idempotency and request hash, then invoke one named
   security-invoker domain RPC. Provider calls never run inside the DB
   transaction.
9. Commit canonical rows, audit and outbox atomically. Return only the
   operation's success schema or BE00 ErrorResponse.
10. Normalize ETag, X-Request-Id, no-store and rate headers, close sanitized
    traces and emit one completion audit event.

### Policy rules

| Policy | Required behavior |
|---|---|
| GPR-11 provider mandate | Completed work-order source, provider_party_id, gear_id, configuration version, owner approval and evidence must agree. A service principal may act only for the registered adapter purpose. |
| GPR-12 owner control | Current 23a owner/controlling party and expected gear/configuration versions are required. Holder, possessor, provider and reviewer cannot escalate to owner modification. |
| Component originality | Basis and evidence attach to one component fact. The system rejects any field or statement that asserts whole-item originality. |
| Serial-bearing replacement | The old identity remains immutable; 23a receives a normalized replacement request. Missing/partial key is IDENTITY_KEY_INCOMPLETE; collision is IDENTITY_KEY_CONFLICT. |
| Valuation safety | Every accepted modification marks valuation review. 23d decides invalidation/recalculation; 23c never silently changes a value. |
| Evidence | Evidence references are purpose-limited, digest-bound and private. Bytes are served only by BE00 object authorization, never from these endpoints. |
| History disclosure | Public history projection may say service history is recorded and label evidence class; it cannot expose summary, provider, parts, measurements or exact dates when policy forbids it. |
| Absence semantics | Empty history is rendered as no history recorded. It is never rendered as never-serviced and cannot lower a confidence tier by itself. |

## Data Flow

### GPR-11 service provider records work

1. Hono authenticates the provider, validates Gpr11Request and resolves the
   acting party plus provider mandate.
2. The Shard 14/05 adapter verifies the work order is completed, belongs to
   gearId, pins configurationVersion, verifies provider scope, and returns
   owner approval and evidence references. An unavailable or ambiguous answer
   is typed pending/unavailable and blocks commit.
3. The 23a RPC verifies gear_record identity and expectedGearVersion. It does
   not change title, custody or identity.
4. One transaction appends service_event and any component facts from
   componentDeltas, reserves/completes idempotency, appends audit and emits
   gear.service.changed.v1 through BE00 outbox.
5. The response contains only identifiers, state, version, configuration and
   evidence class. A later correction points to the prior event with
   supersedesServiceEventId.

### GPR-12 owner records manual modification

1. Hono authenticates the owner, resolves current control and validates the
   component operation. Unknown whole-item originality fields fail strict
   validation.
2. The 23a RPC checks gear identity/configuration and prior component fact
   ownership. For serialBearing true, it normalizes the replacement identity
   and reserves the 23a identity change with the same idempotency/correlation
   context.
3. The 23c transaction appends component_fact, preserves prior fact state by
   supersession, sets valuation_review_required and writes audit/outbox.
4. The 23d review signal is delivered from durable outbox; its outage does not
   roll back the already committed component fact, but the response remains
   valuationReview queued and the outbox alert is observable.
5. The response contains identityFactId only when 23a committed it. It never
   claims the entire gear is original or that a missing fact proves originality.

## State Machines, Concurrency and Failure Recovery

### Service event state

| State | Allowed transition | Guard and recovery |
|---|---|---|
| recorded | recorded to superseded | A correction command references the prior event, proves the same gear/configuration lineage and appends a replacement. |
| superseded | none | Terminal historical state for this version. It remains queryable through authorized projections and cannot be edited or deleted. |

### Component fact state

| State | Allowed transition | Guard and recovery |
|---|---|---|
| active | active to removed, superseded or contested | A later append with the same gear/component lineage, valid expected version and evidence marks the prior fact by supersedes_fact_id. |
| removed | removed to active only through a new add fact | Reinstallation is a new fact and never edits the removal row. |
| contested | contested to superseded or active | A reviewer/owner evidence transition is append-only; 23c does not adjudicate title or legal originality. |
| superseded | none | Historical fact retained indefinitely under legal retention; no destructive cleanup. |

### Failure and race matrix

| Scenario | Detection | Recovery |
|---|---|---|
| Work order not completed or configuration not pinned | Adapter status/version validation before domain transaction | Return SERVICE_WORK_ORDER_INCOMPLETE 422; provider completes/corrects the source and retries with a new or same key according to idempotency policy. |
| Owner approval missing/revoked | Approval reference and current version check | Return OWNER_APPROVAL_REQUIRED 422; no service/component row or outbox event. |
| Provider mandate out of scope | Shard 01 capability/mandate predicate | Return MANDATE_OUT_OF_SCOPE/403 with safe recovery action; never reveal unrelated history. |
| Two writers modify same gear | Gear and component advisory locks plus expectedGearVersion CAS | One commits; the loser receives typed 409 and re-reads an authorized projection before retry. |
| Serial-bearing replacement collides | 23a composite-key uniqueness/CAS | Roll back component transaction and return IDENTITY_KEY_CONFLICT; old key history remains untouched. |
| 23a identity dependency unavailable | Timeout/circuit state before commit | Return DEPENDENCY_UNAVAILABLE for serial replacement; caller retries same idempotency key. Non-serial fact is not coupled to this dependency. |
| 23d valuation review unavailable | Outbox delivery failure after canonical commit | Keep valuation_review_required and queued outbox row; lease/retry with bounded backoff and alert after exhaustion. |
| Worker crash after commit | BE00 outbox lease and immutable idempotency result | Expired lease is reclaimed; event dispatch is deduplicated by event ID and aggregate version. |
| Request times out after commit | Idempotency result lookup | Replay same key returns the stored success; no second fact or event. |
| Revocation/deletion request | Shard 01/BE00 legal retention policy | Remove derived visibility/object grants, retain required fact tombstones and audit/outbox evidence, and enqueue idempotent projection invalidation. |

No transition labels the possessor as criminal, changes title, or converts an
absence of service/component facts into a negative originality assertion.

## External Seams

Every seam has a typed request/response, a bounded timeout, a finite retry
policy and a circuit rule. Raw provider payloads never enter the canonical
database, queue or logs.

| Seam | Exact request and response | Timeout, retry and circuit |
|---|---|---|
| BE00 command admission and idempotency | Request: operationId, actorId, actingPartyId, gearId, idempotencyKeyHash, requestHash, expectedGearVersion and correlationId. Response: reserved, replay with stored status/body hash, or rejected with IDEMPOTENCY_MISMATCH. | 500 ms; 2 retries at 25 ms and 100 ms for connection/reset only; no retry for a typed refusal. Open after 5 failures in 30 seconds, half-open after 15 seconds; while open fail closed with DEPENDENCY_UNAVAILABLE. |
| Shard 01 identity/mandate | Request: actorId, actingPartyId, gearId, capability, purpose, providerPartyId or owner target, expected authority timestamp. Response: resolved party, role, mandateId, scope, expiry, stepUpSatisfied and ownerStanding. | 800 ms; 1 retry at 50 ms for transport failure; circuit opens after 5 failures in 30 seconds and fails closed. Expired/ambiguous mandate is a typed 403, not a retry. |
| Shard 14 or Shard 05 work-order verification | Request: workOrderSource, workOrderId, gearId, workOrderVersion, providerPartyId, configurationVersion and requestId. Response: completed true, canonical workOrderId, source, providerPartyId, gearId, configurationVersion, ownerApprovalRef, evidenceRef digests and verifiedAt. | 1200 ms; 2 retries at 100 ms and 250 ms for transport failure only. Circuit opens after 5 failures in 60 seconds, half-open at 30 seconds; open or ambiguous status returns DEPENDENCY_UNAVAILABLE and blocks GPR-11. |
| 23a identity continuity | Request: gearId, priorComponentFactId, old identity key version, normalized replacement component key, expectedGearVersion, idempotencyKey and correlationId. Response: committed identityFactId, new identityKeyVersion, or IDENTITY_KEY_INCOMPLETE/IDENTITY_KEY_CONFLICT. | 1000 ms; 2 retries at 100 ms and 250 ms using the same idempotency key. Circuit opens after 5 failures in 30 seconds; open state blocks serial-bearing GPR-12 and leaves no component row. |
| BE00 object/evidence authorization | Request: evidenceId list, purpose component or service history, actor/party, target gearId and digest list. Response: verified references with owner/mandate scope and no bytes. | 700 ms; 1 retry at 50 ms for transport failure. Circuit opens after 5 failures in 30 seconds; unavailable required evidence returns DEPENDENCY_UNAVAILABLE before mutation. |
| Shard 23d valuation review | Request: gearId, componentFactId, configurationVersion, reason component_modified, source event ID and correlationId. Response: accepted review job ID or durable outbox acknowledgement; no value is returned. | Outbox handoff is committed locally within 500 ms; delivery retries 3 times at 1, 5 and 30 seconds, then leases for operator review. Circuit opens after 5 consumer failures in 60 seconds; canonical component state remains committed with valuationReview queued. |

The domain transaction never waits on provider-side document transfer or
long-running valuation work. An ambiguous external result is pending/unknown
and cannot be converted to completed by a retry without the same idempotency
key and a fresh authorization check.

## Events and Async Consumers

### Event envelope

Each emitted event uses the inherited BE00 outbox envelope:

~~~ts
type GearServiceEvent = {
  id: string,
  eventType: "gear.service.changed.v1",
  schemaVersion: 1,
  aggregateType: "gear_record",
  aggregateId: string,
  aggregateVersion: string,
  correlationId: string,
  causationId: string | null,
  occurredAt: string,
  payload: {
    gearId: string,
    serviceEventId: string | null,
    componentFactIds: string[],
    configurationVersion: string,
    state: "recorded" | "superseded" | "removed" | "contested",
    evidenceClass: "owner_approved" | "provider_attested" | "mixed"
  }
};
~~~

The payload is validated by a strict event schema before insertion. It excludes
serials, exact locations, names/contact, evidence documents, measurements,
parts, owner approval text, provider summaries and values. Consumers receive a
bounded fact and must resolve their own authorization; no consumer strengthens
provenance, confidence, title, permission or terminal state.

GPR-11 emits one gear.service.changed.v1 event after service_event and any
component facts commit. GPR-12 emits one event after component_fact commit;
when serialBearing is true, 23a separately emits gear.identity.changed.v1.
Events are deduplicated by event ID and aggregate version. Consumers that fail
lease processing leave the outbox row undispatched and retry without changing
payload.

### Consumer obligations

| Consumer | Event/input | Required behavior |
|---|---|---|
| 23a chain projection | gear.service.changed.v1 | Append a bounded service chain fact under 23a authorization; never expose provider/private evidence in public provenance. |
| 23d valuation review | gear.service.changed.v1 | Invalidate or mark review required for prior estimate according to 23d policy; do not silently revalue. |
| Shards 24, 25 and 26 | gear.service.changed.v1 | Consume only bounded service status/configuration version for holdings, catalog and fulfilment projections. |
| 23c continuity worker | gear.identity.changed.v1 | Reconcile identityFactId for a serial-bearing component and mark the local component fact linkage complete; mismatch goes to manual review. |
| Protected recovery/claim projections | gear.claim.changed.v1, gear.theft-flag.changed.v1, gear.sighting.changed.v1 | Keep history projections privacy-safe; no recovery identity, location or contact enters service rows. |
| Owner evidence/pack projection | gear.valuation.changed.v1, gear.appraisal.changed.v1, gear.insurance-pack.changed.v1 | Read status/version only through the owner projection; private documents remain BE00-authorized. |
| Discography projection | gear.credit-link.changed.v1 | Do not infer credit visibility or gear use from a service event. |

## Error Handling

### Boundary matrix

| Operation ID | Boundary | Required result |
|---|---|---|
| BE23C-GPR11 | Transport, malformed JSON or unknown field | 400 INVALID_REQUEST with BE00 ErrorResponse; no lookup or mutation. |
| BE23C-GPR11 | Missing/expired session or mandate context | 401 UNAUTHENTICATED or 403 MANDATE_OUT_OF_SCOPE; no private existence detail. |
| BE23C-GPR11 | Work order, approval or evidence gate | 404 for absent/concealed source, 422 SERVICE_WORK_ORDER_INCOMPLETE or OWNER_APPROVAL_REQUIRED for known invalid state; no partial row. |
| BE23C-GPR11 | Version, idempotency or event race | 409 CONFLICT with BE00 details and safe retry action; exactly one winner. |
| BE23C-GPR11 | Provider/BE00 dependency timeout | 503 DEPENDENCY_UNAVAILABLE with retryable true; pending external work never reports recorded. |
| BE23C-GPR12 | Transport, unknown field or whole-item claim | 400 INVALID_REQUEST or 422 VALIDATION_FAILED; no lookup or mutation. |
| BE23C-GPR12 | Owner predicate or concealed resource | 403 FORBIDDEN for evaluated non-owner; 404 NOT_FOUND for absent/revoked/concealed target. |
| BE23C-GPR12 | Component evidence or identity key gate | 422 COMPONENT_PROVENANCE_REQUIRED or IDENTITY_KEY_INCOMPLETE; no component fact. |
| BE23C-GPR12 | Version, idempotency or 23a identity conflict | 409 CONFLICT or IDENTITY_KEY_CONFLICT; transaction rollback preserves prior history. |
| BE23C-GPR12 | 23a/BE00 dependency timeout | 503 DEPENDENCY_UNAVAILABLE; same idempotency key remains the only retry path. |

### Error invariants

- All operation failures have Content-Type application/json, X-Request-Id,
  Cache-Control no-store and the endpoint's rate headers.
- ErrorResponse contains exactly one top-level error object with ApiError fields
  code, message, requestId and details. RFC problem fields, SQL, stack traces,
  provider payloads, evidence, serials and party identity are prohibited.
- Validation and authority checks happen before existence-sensitive data access.
  A concealed target cannot be distinguished from absence.
- Failed or timed-out transactions leave no service_event/component_fact,
  identity linkage, valuation signal, audit completion or event payload except
  the registered idempotency evidence needed for deterministic replay.
- FORBIDDEN never becomes a success through a service credential, and
  DEPENDENCY_UNAVAILABLE never becomes a successful service or modification
  merely because a retry was attempted.

## Testing Strategy

### Contract and route tests

| Test ID | Operation ID | Acceptance evidence |
|---|---|---|
| BE23C-T11 | BE23C-GPR11 | Gpr11Request/Gpr11Success strict fields, provider mandate, service-version CAS, ApiError, RLS, event, and output-redaction assertions pass |
| BE23C-T12 | BE23C-GPR12 | Gpr12Request/Gpr12Success strict fields, owner authority, component originality, idempotency race, ApiError, RLS, event, and CORS assertions pass |

- Parse every Gpr11Request, Gpr11Success, Gpr12Request, Gpr12Success and
  ErrorResponse with Zod 4; assert unknown keys, missing evidence, path/body
  mismatch, raw serial fields and whole-item originality fields fail.
- Assert the route registry has exactly two unique method/path pairs, one
  operation row per GPR-11/GPR-12 interaction, and every registry below
  contains both operation IDs.
- Assert all failures serialize the four-field BE00 ApiError and success
  bodies contain no private evidence, summary, parts, measurements or contact.

### Authorization and privacy tests

- For each operation test provider with valid mandate, provider outside mandate,
  current owner, non-owner authenticated user, holder, possessor, reviewer,
  anonymous, revoked party, expired step-up and forged actorContextId.
- Assert evaluated non-owner is 403, absent/concealed gear/work/component is
  404, anonymous is 401, and no branch leaks target existence or owner identity.
- Assert CORS gear-api rejects unallowlisted origins, wildcard credentials and
  unregistered methods; OPTIONS exposes only registered POST headers.
- Assert public, marketplace and downstream projections omit serials,
  locations, names/contact, evidence bytes, private URLs, work summaries,
  measurements, parts and owner approval text.

### Persistence, idempotency and concurrency tests

- Migration tests verify platform_private schema, foreign keys, enum checks,
  array cardinality, digest lengths, unique keys, query indexes, forced RLS,
  revoked direct grants and named RPC grants.
- Replay the exact request after success, after a response timeout and after a
  worker crash; assert byte-equivalent success and one service/component/event
  row. Reuse the key with a changed payload and assert IDEMPOTENCY_MISMATCH.
- Run concurrent same-gear service and component commands with stale and equal
  expected versions; assert one CAS winner, typed 409 loser and no orphan
  identity/valuation linkage.
- Attempt deletion/update of recorded, removed, contested and superseded facts
  as browser, provider, reviewer, queue and maintenance roles; assert only
  named retention/runbook paths can create audited tombstones.

### Domain and seam tests

- GPR-11 tests completed Shard 14 and Shard 05 work orders, uncompleted work,
  source mismatch, unpinned configuration, missing/revoked approval, empty
  evidence, duplicate work-order version and correction supersession.
- GPR-12 tests add/remove/replace component, serial-bearing replacement,
  missing/partial key, 23a identity conflict, component-level provenance,
  valuation review queued and whole-item originality rejection.
- Contract-test every external seam's exact request/response, timeout, retry
  count/backoff, circuit-open behavior, ambiguous result and same-key replay.
- Assert 23a failure rolls back serial-bearing component facts; 23d outage
  leaves a durable valuation-review outbox row and never changes a value.

### Event, recovery and accessibility-support tests

- Validate gear.service.changed.v1 strict payloads, event ID/aggregate-version
  dedupe, outbox lease expiry, retry exhaustion and consumer replay. Assert all
  ten IA event identifiers remain present in the source map and safe event
  registry.
- Property-test append-only histories: every replacement has a prior fact,
  every serial-bearing replacement has an identityFactId or a typed pending
  result, and no absence is rendered as never-serviced or original.
- Inject DB, queue, 23a, Shard 14/05 and object-authorization failures at every
  boundary; assert honest typed failure, no partial side effects and alertable
  metrics.
- API documentation and client fixtures expose explicit state/evidence labels,
  retry actions and does-not-prove-originality/title disclosures. Error and
  status text remains understandable without color or private detail.

## Deepening Passes

| Pass | Result | Evidence |
|---|---|---|
| 1. Source coverage | PASS | GPR-11/GPR-12, all 18 canonical model names and all 10 IA event types are retained in the IA Source Map. |
| 2. Contract exactness | PASS | Strict Zod 4 request/success/error schemas, path/header agreement and BE00 ApiError envelope are explicit. |
| 3. Endpoint reconciliation | PASS | Two operation IDs map one-to-one to the approved 23c split; no 23a/23b/23d/BE00 route duplication. |
| 4. Authorization | PASS | Provider mandate, owner standing, service principal, 403-vs-404 and privacy projections are keyed per operation. |
| 5. Persistence | PASS | service_event and component_fact fields include SQL type, nullability, constraints, FK targets, indexes and forced-RLS/grants. |
| 6. Concurrency/idempotency | PASS | BE00 reservation, request hashing, CAS versions, component locks, atomic rollback and replay are defined per operation. |
| 7. External failure | PASS | Every seam has exact request/response, timeout, retry/backoff and circuit behavior; ambiguous outcomes fail closed. |
| 8. Security/observability | PASS | CORS gear-api, middleware order, no-secret/evidence logging, audit, metrics and trace redaction are explicit. |
| 9. Adversarial review | PASS | Whole-item originality, serial collision, provider overreach, absent history, dependency outage and valuation substitution are fail-closed. |
| 10. Implementer replay | PASS | Two independent implementers can derive the same routes, states, tables, retries, events and tests without unstated choices. |

## Ambiguity Gate

PASS. Micro-level review fixed field names, enum values, nullability,
header/body equality, state transitions, evidence minimums, error details and
response disclosure. Macro-level review fixed the 23c boundary: service_event
and component_fact are owned here; 23a owns identity/chain, 23d owns
valuation, and 14/05 own completed work-order truth. A two-implementer replay
produced the same two routes and same atomic command sequencing. Devil's
advocate cases (provider without mandate, missing approval, serial replacement
collision, stale concurrent write, no service history, whole-item originality
claim, 23a outage, 23d outage and post-commit timeout) all have typed,
recoverable outcomes. Decision lock: corrections supersede, deletion never
removes relied-upon history, serial continuity remains 23a-owned, and
valuation review is never silent.

## Open Questions

None

## Dependency References

- Depends on: BE00 for ApiError, command metadata, idempotency, RLS, audit,
  outbox and event leasing; Shard 01 for party, acting context, provider
  mandate and owner standing; Shard 14 or Shard 05 for completed service
  work-order truth; 23a for gear identity/configuration and chain continuity;
  23d for valuation invalidation/review.
- Publishes to: 23a chain projection, 23d valuation review, and bounded
  Shards 24, 25 and 26 service-history projections through
  gear.service.changed.v1.
- Consumes: gear.identity.changed.v1, gear.claim.changed.v1,
  gear.transfer.changed.v1, gear.theft-flag.changed.v1,
  gear.sighting.changed.v1, gear.valuation.changed.v1,
  gear.appraisal.changed.v1, gear.insurance-pack.changed.v1 and
  gear.credit-link.changed.v1 only through authorized projections.
- Direction: 23c never reads companion stores directly; named RPCs/events
  cross each boundary, producers retain canonical ownership, and consumers
  cannot strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Added BE23C-GPR11 service work-order append command and BE23C-GPR12 component modification command with strict contracts, persistence, RLS, failure recovery and event coverage | /write-be-spec |
| 2026-08-28 | Locked component-level originality, serial continuity delegation to 23a, no-history semantics and valuation-review handoff | /write-be-spec-deepen |
