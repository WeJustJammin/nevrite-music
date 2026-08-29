# BE-23d — Gear Valuation, Insurance Packs and Discography Links

Status: Complete

This specification turns IA Shard 23 interactions GPR-13 through GPR-16 into
four authenticated Hono commands for evidence-bounded valuation, private
appraisals, deterministic insurance claim packs and producer-attested gear-use
links. It owns valuation_estimate, appraisal_record, insurance_pack and
gear_credit_link. It consumes identity, service, claim, credit and object
boundaries without treating an estimate as an appraisal, a pack as insurance
coverage, a credit link as ownership, or missing history as proof.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Classification | Multi-domain split, valuation/insurance/discography subdomain | BE index line 40 assigns 23d to valuation/insurance/discography; IA interaction table lines 66-83 assigns GPR-13 through GPR-16. |
| Backend surface | Authenticated Hono REST commands, bounded comparable lookup, private object references, resumable pack job, Supabase RPCs and transactional outbox events | IA Contracts lines 118-121 and Access Control lines 165-187; BE00 Middleware lines 253-297, Jobs lines 216 and Events lines 357-415. |
| Canonical owner | 23d owns valuation_estimate, appraisal_record, insurance_pack and gear_credit_link, including evidence thresholds, privacy state, manifest integrity and inherited credit visibility | IA Data Models lines 123-140 and Typed Field Registry lines 142-163. |
| Consumed boundaries | 23a gear_record/identity/claims, 23c service_event/component_fact, Shard 01 party/acting context, Shard 02 or 07 credit/session status, and BE00 objects/jobs/evidence | IA GPR-13 through GPR-16 lines 80-83, Access Control lines 169-176, and Cross-Shard Map lines 263-273. |
| Explicit non-ownership | Identity/claims/transfers, theft/recovery, service/component facts and credit canonical status remain companion boundaries 23a, 23b, 23c and Shard 07 | IA Scope Reconciliation lines 13-20 and interactions lines 68-83. |
| Split validity | PASS: valuation, owner-private appraisal, deterministic evidence pack and producer credit projection share a privacy/evidence boundary; no GPR-13 through GPR-16 interaction is split across companions | Approved BE index split plus IA interaction Preconditions, Required behavior, Completion and Failure / recovery lines 80-83. |

## Referenced Material Inventory

| Source file | Section and lines | Material consumed |
|---|---|---|
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Overview lines 7-9 | Shard ownership of valuation/appraisal/insurance packs and producer-attested gear discography. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Scope Reconciliation lines 11-20 | Evidence-chain boundary and protected owner/private data projection. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Registry Decisions lines 22-35 | Comp floor, appraisal distinction, deterministic pack, no insurer submission and inherited credit visibility. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Acceptance Criteria lines 59-62 | Normative AC-GPR-13 through AC-GPR-16 validation, authorization, version, idempotency, completion and recovery. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Interactions lines 80-83 | Exact GPR-13 through GPR-16 preconditions, behavior, completion and failure/recovery. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Global Interaction Rules lines 85-91 | Distinct identity, possession and title; protected evidence and retention. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Contracts lines 106-121 | EstimateGearValue, IssueAppraisal, BuildInsurancePack and AttestGearUse contracts and error vocabulary. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Data Models lines 123-140 | Canonical valuation_estimate, appraisal_record, insurance_pack and gear_credit_link relationships. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Typed Field and Cardinality Registry lines 142-163 | Deterministic SQL types, required core fields, cardinality and constraints. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Access Control lines 165-187 | Owner, appraiser, producer, reviewer and service-principal permission boundaries. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Event Schemas lines 198-213 | Valuation, appraisal, pack and credit-link payloads and excluded private fields. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Dependency References lines 235-240 and Cross-Shard Map lines 263-273 | BE00, Shards 01, 02, 06, 07, 08, 14, 24, 25 and 26 direction and ownership. |
| .memory/wiki/specs/ia/deep-dives/23-gear-provenance-registry.md | Service, Value and Discography Algorithm lines 40-48 | Exact normalization/comp threshold, modification invalidation, appraisal privacy, pack checksum and credit visibility inheritance. |
| .memory/wiki/specs/ia/deep-dives/23-gear-provenance-registry.md | Abuse and Recovery Verification lines 50-62 | Estimate/appraisal separation and hidden-credit non-disclosure risks. |
| .memory/wiki/specs/ia/deep-dives/23-gear-provenance-registry.md | Implementation Envelope lines 73-79 | Supabase/RLS, typed Hono/Zod commands, jobs, outbox and ambiguous-provider recovery. |
| .memory/wiki/specs/ia/23-gear-provenance-registry.md | Repository path check | Requested alias 23-gear-provenance.md does not exist; 23-gear-provenance-registry.md is the sole matching canonical IA source used here. |
| .memory/wiki/specs/be/00-infrastructure.md | Zod Contracts lines 112-200 | Strict Zod 4 objects, ApiError four-field envelope, details limits and response headers. |
| .memory/wiki/specs/be/00-infrastructure.md | Database Schema lines 202-251 | platform_private objects/jobs, forced RLS, RPC-only access, idempotency, audit and outbox. |
| .memory/wiki/specs/be/00-infrastructure.md | Middleware lines 253-297 | Middleware order, CORS, authentication, capability and concurrency rules. |
| .memory/wiki/specs/be/00-infrastructure.md | Events lines 357-415 | Outbox envelope, leasing, retry and consumer recovery. |
| .memory/wiki/specs/be/00-infrastructure.md | Error and Observability lines 416-461 | Boundary mapping, compensation, structured audit, metrics, traces and redaction. |
| .memory/wiki/specs/be/00-infrastructure.md | Testing Strategy lines 476-505 | Contract, RLS, provider, job, event, idempotency and recovery obligations. |

## IA Source Map

### Assigned interactions

| IA ID | Source trace | Backend realization | Completion and non-negotiable recovery |
|---|---|---|---|
| GPR-13 | IA 23-gear-provenance-registry.md lines 80 and 59; deep dive lines 44-45 | BE23D-GPR13 normalizes exact gear configuration, condition, market and time, queries governed eligible comparables and returns an evidence-labelled range only above the current comp floor. | Returns range plus sample/recency/caveats or a typed VALUATION_INSUFFICIENT_EVIDENCE refusal. A modification invalidates or flags prior estimates; no fabricated wide range or silent revaluation. |
| GPR-14 | IA 23-gear-provenance-registry.md lines 81 and 60; deep dive line 46 | BE23D-GPR14 verifies appraiser identity/mandate, pins exact gear/configuration snapshot and stores an immutable owner-private appraisal document. | Returns distinct appraisal state and private object reference to owner/appraiser only. Expiry warns and retains; an appraisal never overwrites or substitutes for valuation_estimate. |
| GPR-15 | IA 23-gear-provenance-registry.md lines 82 and 61; deep dive line 47 | BE23D-GPR15 accepts owner-selected items, evidence, appraisals, purchase records, service history and photos, then runs a deterministic manifest/checksum job. | Returns resumable pack/job status and explicit gaps. It never transmits to an insurer, promises coverage, silently drops missing evidence or exposes another party's private appraisal. |
| GPR-16 | IA 23-gear-provenance-registry.md lines 83 and 62; deep dive line 48 | BE23D-GPR16 verifies an eligible Shard 07 credit/session, binds a stated gear role/use and inherits exact credit status/visibility. | Returns a link whose projection cannot widen credit visibility. Disputed/hidden source status suppresses the link and hidden-link count; all corrections/status changes remain in the credit owner boundary. |

### Canonical Data Models

| IA model name | 23d relationship and ownership |
|---|---|
| gear_record | Consumed parent aggregate from 23a; gear identity/version and owner predicate are checked, never rewritten by 23d. |
| gear_identity_key | Consumed exact configuration/key snapshot; raw key values stay private and are represented by a digest in valuation/pack evidence. |
| gear_identifier_fact | Consumed for normalized identity and snapshot continuity; 23d does not correct or supersede identifiers. |
| gear_claim | Consumed for owner standing and appraisal/pack access; claim state never becomes a value or title assertion. |
| claim_evidence | Consumed as purpose-scoped evidence references; no claim bytes enter valuation responses or public credit links. |
| gear_chain_event | 23a owns chain history; 23d emits valuation/appraisal/pack/link events for bounded projections. |
| gear_transfer | Consumed for configuration/custody context and evidence selection; transfer authority remains 23a. |
| gear_duplicate_case | Consumed only to avoid valuing or packing an unresolved identity without its contest state. |
| theft_case | Consumed only for disclosure policy; theft case evidence is never included by default in a pack or valuation. |
| theft_flag | Consumed only for safe status/caveat projection; a flag does not create a value or coverage promise. |
| gear_screening | Consumed only as a bounded evidence/status input; screening does not establish market value. |
| gear_sighting | Consumed only as protected recovery context; exact sighting location/contact never enters 23d models. |
| service_event | Consumed to normalize configuration and invalidate prior estimates after a modification; 23c owns service facts. |
| component_fact | Consumed to detect configuration changes and valuation review requirements; 23c owns component facts. |
| valuation_estimate | Canonical 23d evidence-labelled range with comp set, policy, sample and recency. |
| appraisal_record | Canonical 23d owner-private immutable appraiser document/value snapshot, distinct from estimate. |
| insurance_pack | Canonical 23d deterministic selected-evidence manifest, gaps, checksum, document job and download state. |
| gear_credit_link | Canonical 23d projection binding gear and eligible credit/session while inheriting source visibility/status exactly. |

### Event Schemas

| IA event type | 23d use | Safe payload rule |
|---|---|---|
| gear.identity.changed.v1 | Consumed to invalidate normalized configuration snapshots and re-evaluate pending estimates. | Identity version/confidence only; no raw serial, location or evidence. |
| gear.claim.changed.v1 | Consumed to re-check owner standing and private pack/appraisal projections. | Claim state/tier and pseudonymous gear reference only. |
| gear.transfer.changed.v1 | Consumed to identify the effective configuration/custody evidence boundary. | Transfer state/version only; no parties or consideration. |
| gear.theft-flag.changed.v1 | Consumed to add bounded theft-status caveat where policy permits. | Gear/flag state/weight class/version only; no reporter or police reference. |
| gear.sighting.changed.v1 | Consumed only to ensure recovery detail never enters pack/valuation projection. | Case/sighting state/version only; no location/contact. |
| gear.service.changed.v1 | Consumed to invalidate/review estimates after service or modification. | Gear/service/component state and configuration version only; no provider/private detail. |
| gear.valuation.changed.v1 | Produced by GPR-13 when an estimate is issued, withheld or invalidated. | Gear/estimate state/evidence class/version; no raw comparable values beyond authorized owner projection. |
| gear.appraisal.changed.v1 | Produced by GPR-14 on immutable issue/expiry state changes. | Gear/appraisal state/version only; document/value is owner-private. |
| gear.insurance-pack.changed.v1 | Produced by GPR-15 on queued, progress, success or retryable failure state. | Pack/state/version only; no manifest contents or document URL. |
| gear.credit-link.changed.v1 | Produced by GPR-16 on link create/suppress/status projection. | Gear/credit state only; no hidden credit use or widened visibility. |

## Endpoint Reconciliation

The approved 23d split has one command endpoint per assigned IA interaction.
The route registry below is authoritative for this file. BE00 platform routes,
23a identity/claim routes, 23b theft routes, 23c service routes and Shard 07
credit commands are dependencies and are not copied here.

| IA interaction | Operation ID | Route | Why this boundary is complete |
|---|---|---|---|
| GPR-13 owner requests valuation | BE23D-GPR13 | POST /api/v1/gear/records/:gearId/valuation-estimates | One command normalizes configuration/condition/market/time, applies comp policy, persists estimate or refusal evidence and emits the valuation event. |
| GPR-14 appraiser issues appraisal | BE23D-GPR14 | POST /api/v1/gear/records/:gearId/appraisals | One command verifies mandate, pins snapshot, stores private appraisal object reference and emits the appraisal event. |
| GPR-15 owner builds insurance claim pack | BE23D-GPR15 | POST /api/v1/gear/insurance-packs | One async acceptance command validates selected evidence, creates a deterministic job/manifest and emits resumable pack state; there is no insurer-submit route. |
| GPR-16 producer attests gear use | BE23D-GPR16 | POST /api/v1/gear/records/:gearId/credit-links | One command verifies source credit/session eligibility and writes a visibility-inheriting link; Shard 07 owns source correction/status. |
| Valuation read/projection | Inherited owner/public projection | No 23d read route | Reads are served by registered owner/public projections with precision/privacy policy; no duplicate unbounded detail route is introduced. |
| Appraisal download | BE00 object authorization | No 23d object route | Object bytes and signed URLs remain BE00-owned and purpose/owner scoped; 23d stores only the reference. |
| Credit correction/status | Shard 07 credit lifecycle | No 23d correction route | Link status and visibility can only follow the producer credit/session boundary; 23d cannot widen or repair it. |
| Insurer submission | Explicitly unsupported | No route | The platform generates a document only; the user transmits it externally and no coverage is asserted. |

## API Endpoints

### Authoritative Route Registry

This is the only 23d route registry. Every later registry uses these stable
operation IDs. No route is shared with 23a, 23b, 23c, Shard 07 or BE00.

| Operation ID | Method | Path | Capability | Response |
|---|---|---|---|---|
| BE23D-GPR13 | POST | /api/v1/gear/records/:gearId/valuation-estimates | gear.valuation_request | Gpr13Success |
| BE23D-GPR14 | POST | /api/v1/gear/records/:gearId/appraisals | gear.appraisal_issue | Gpr14Success |
| BE23D-GPR15 | POST | /api/v1/gear/insurance-packs | gear.insurance_pack_build | Gpr15Success |
| BE23D-GPR16 | POST | /api/v1/gear/records/:gearId/credit-links | gear.credit_link_attest | Gpr16Success |

### Request/Response Contracts (Zod 4)

Zod 4 schemas are strict runtime contracts. They validate Hono path, headers
and body, generated OpenAPI, persisted result projections, job status, event
payloads and contract fixtures. Unknown keys and private source values fail
before existence-sensitive lookup.

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
const Minor = z.string().regex(/^(0|[1-9][0-9]*)$/);
const ShortText = z.string().trim().min(1).max(256);
const LongText = z.string().trim().min(1).max(2000);
const Currency = z.string().regex(/^[A-Z]{3}$/);

const CommandMeta = z.object({
  requestId: Uuid,
  idempotencyKey: z.string().trim().min(16).max(128),
  expectedGearVersion: Version,
  actorContextId: Uuid,
}).strict();

const EvidenceRef = z.object({
  evidenceId: Uuid,
  evidenceType: z.enum([
    "purchase_record",
    "service_event",
    "component_fact",
    "comparable_set",
    "appraisal_document",
    "photo",
    "owner_statement",
    "credit_source",
  ]),
  digest: Digest,
  purpose: z.enum([
    "valuation",
    "appraisal",
    "insurance_pack",
    "credit_attestation",
  ]),
  capturedAt: Timestamp,
}).strict();

const ConfigurationSnapshot = z.object({
  identityVersion: Version,
  configurationVersion: Version,
  manufacturerDigest: Digest,
  modelDigest: Digest,
  serialDigest: Digest.nullable(),
  componentFactDigest: Digest,
}).strict();

const ConditionSnapshot = z.object({
  grade: z.enum(["mint", "excellent", "good", "fair", "poor", "unknown"]),
  normalizedDigest: Digest,
  assessedAt: Timestamp,
}).strict();

const MarketSnapshot = z.object({
  marketKey: z.string().trim().regex(/^[A-Z0-9][A-Z0-9_.-]{1,63}$/),
  regionCode: z.string().trim().regex(/^[A-Z]{2}(-[A-Z0-9]{1,3})?$/),
  currency: Currency,
  observedAt: Timestamp,
}).strict();

const Gpr13Request = z.object({
  gearId: Uuid,
  configuration: ConfigurationSnapshot,
  condition: ConditionSnapshot,
  market: MarketSnapshot,
  valuationAt: Timestamp,
  policyVersion: Version,
  compFloor: z.number().int().positive().max(10000),
  maxComparableAgeDays: z.number().int().positive().max(3650),
  evidence: z.array(EvidenceRef).min(1).max(50),
  meta: CommandMeta,
}).strict();

const Gpr13Success = z.object({
  operationId: z.literal("BE23D-GPR13"),
  gearId: Uuid,
  estimateId: Uuid,
  state: z.enum(["issued", "review_required", "invalidated"]),
  range: z.object({
    lowMinor: Minor,
    highMinor: Minor,
    currency: Currency,
  }).strict().nullable(),
  comparableCount: z.number().int().nonnegative(),
  oldestComparableAt: Timestamp.nullable(),
  newestComparableAt: Timestamp.nullable(),
  recencyDays: z.number().int().nonnegative().nullable(),
  policyVersion: Version,
  evidenceClass: z.enum(["governed_comparables", "owner_evidence", "mixed"]),
  caveats: z.array(ShortText).max(20),
  eventType: z.literal("gear.valuation.changed.v1"),
  version: Version,
  createdAt: Timestamp,
}).strict();

const AppraisalDocumentRef = z.object({
  objectId: Uuid,
  digest: Digest,
  mediaType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
}).strict();

const Gpr14Request = z.object({
  gearId: Uuid,
  configuration: ConfigurationSnapshot,
  appraiserMandateId: Uuid,
  valueMinor: Minor,
  currency: Currency,
  effectiveAt: Timestamp,
  expiresAt: Timestamp,
  document: AppraisalDocumentRef,
  evidence: z.array(EvidenceRef).min(1).max(50),
  meta: CommandMeta,
}).strict().refine(
  value => value.expiresAt > value.effectiveAt,
  { message: "expiresAt must be after effectiveAt", path: ["expiresAt"] },
);

const Gpr14Success = z.object({
  operationId: z.literal("BE23D-GPR14"),
  gearId: Uuid,
  appraisalId: Uuid,
  state: z.enum(["issued", "expired"]),
  ownerPrivate: z.literal(true),
  configurationVersion: Version,
  valueMinor: Minor,
  currency: Currency,
  effectiveAt: Timestamp,
  expiresAt: Timestamp,
  documentObjectId: Uuid,
  eventType: z.literal("gear.appraisal.changed.v1"),
  version: Version,
  createdAt: Timestamp,
}).strict();

const PackItem = z.object({
  gearId: Uuid,
  snapshotVersion: Version,
  snapshotDigest: Digest,
}).strict();

const Gpr15Request = z.object({
  items: z.array(PackItem).min(1).max(500),
  evidenceIds: z.array(Uuid).max(500),
  appraisalIds: z.array(Uuid).max(200),
  purchaseEvidenceIds: z.array(Uuid).max(500),
  serviceEventIds: z.array(Uuid).max(500),
  photoObjectIds: z.array(Uuid).max(500),
  includeKnownGaps: z.boolean(),
  manifestPolicyVersion: Version,
  meta: CommandMeta,
}).strict();

const Gpr15Success = z.object({
  operationId: z.literal("BE23D-GPR15"),
  packId: Uuid,
  jobId: Uuid,
  state: z.enum(["queued", "running", "succeeded", "failed_retryable"]),
  selectedItemCount: z.number().int().positive(),
  gapCount: z.number().int().nonnegative(),
  manifestDigest: Digest.nullable(),
  documentObjectId: Uuid.nullable(),
  transmitsToInsurer: z.literal(false),
  eventType: z.literal("gear.insurance-pack.changed.v1"),
  version: Version,
  createdAt: Timestamp,
}).strict();

const CreditSource = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("credit"), creditId: Uuid }).strict(),
  z.object({ kind: z.literal("session"), sessionId: Uuid }).strict(),
]);

const Gpr16Request = z.object({
  gearId: Uuid,
  source: CreditSource,
  roleOrUse: ShortText,
  evidence: z.array(EvidenceRef).min(1).max(20),
  meta: CommandMeta,
}).strict();

const Gpr16Success = z.object({
  operationId: z.literal("BE23D-GPR16"),
  linkId: Uuid,
  gearId: Uuid,
  creditId: Uuid.nullable(),
  sessionId: Uuid.nullable(),
  state: z.enum(["active", "suppressed", "disputed"]),
  sourceStatus: z.enum(["eligible", "disputed", "hidden"]),
  visibility: z.enum(["public", "private", "hidden"]),
  visibilityInherited: z.literal(true),
  eventType: z.literal("gear.credit-link.changed.v1"),
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

All requests require an Idempotency-Key header whose normalized value equals
meta.idempotencyKey. If-Match, when present, carries the quoted
meta.expectedGearVersion. GPR-13 and GPR-14 path gearId must equal body gearId.
GPR-15 derives owner scope from each selected item and does not trust a
caller-supplied owner. GPR-16 never accepts a visibility or source-status
override. Every error is exactly the BE00/global ApiError { code, message,
requestId, details } contract; HTTP status remains on the response line.
Private document bytes, comparable raw values, evidence contents, party
identity/contact and hidden credit use are never in a success body.

### Contract Registry

| Operation ID | Request schema | Success schema | Domain errors | Global failure shape |
|---|---|---|---|---|
| BE23D-GPR13 | Gpr13Request; exact configuration/condition/market/time snapshots, policy and evidence required | Gpr13Success; range is nullable only for review/invalidation state and carries sample/recency/caveats | VALUATION_INSUFFICIENT_EVIDENCE, FORBIDDEN, NOT_FOUND, CONFLICT, DEPENDENCY_UNAVAILABLE | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details }. |
| BE23D-GPR14 | Gpr14Request; appraiser mandate, pinned snapshot, value, currency, effective/expiry and private document required | Gpr14Success; ownerPrivate is always true and document reference is purpose-scoped | APPRAISAL_PRIVATE, FORBIDDEN, NOT_FOUND, CONFLICT, VALIDATION_FAILED, DEPENDENCY_UNAVAILABLE | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details }. |
| BE23D-GPR15 | Gpr15Request; selected item snapshots and explicit evidence/appraisal/service/photo sets required | Gpr15Success; job/pack state is resumable and transmitsToInsurer is always false | APPRAISAL_PRIVATE, FORBIDDEN, NOT_FOUND, CONFLICT, DEPENDENCY_UNAVAILABLE, VALIDATION_FAILED | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details }. |
| BE23D-GPR16 | Gpr16Request; exactly one eligible credit/session source and role/use required | Gpr16Success; visibilityInherited is always true and state follows the source | DISCography_CREDIT_INELIGIBLE, FORBIDDEN, NOT_FOUND, CONFLICT, DEPENDENCY_UNAVAILABLE | Every 4xx/5xx is ErrorResponse with BE00 ApiError { code, message, requestId, details }. |

### Error Registry

| Operation ID | HTTP and code | Trigger and safe details |
|---|---|---|
| BE23D-GPR13 | 400 INVALID_REQUEST or 422 VALIDATION_FAILED | Malformed path/header/body, invalid digest/currency/time, missing evidence or non-positive comp policy. Details use BE00 FieldViolation rows and no comparable contents. |
| BE23D-GPR13 | 401 UNAUTHENTICATED | Missing, expired or ambiguous owner session/acting context. No gear existence is disclosed. |
| BE23D-GPR13 | 403 FORBIDDEN | Authenticated actor lacks current owner standing or valuation capability. Details contain reasonCode/recoveryAction only. |
| BE23D-GPR13 | 404 NOT_FOUND | Gear is absent, revoked or concealed by the owner projection; comparable source is not disclosed as a resource. |
| BE23D-GPR13 | 409 CONFLICT | Stale gear/configuration version, duplicate non-equivalent idempotency key or estimate supersession race. Details use BE00 VERSION_MISMATCH, IDEMPOTENCY_MISMATCH or INVALID_TRANSITION. |
| BE23D-GPR13 | 422 VALUATION_INSUFFICIENT_EVIDENCE | Eligible comparable set is below policy compFloor or older than maxComparableAgeDays, or a modification invalidates the requested snapshot. No range is fabricated; a withheld estimate may be retained as evidence. |
| BE23D-GPR13 | 502/503/504 DEPENDENCY_UNAVAILABLE | 23a/23c snapshot, comparable lookup or BE00 admission is unavailable or times out. Details contain dependencyClass and retryable true; no stale value is issued. |
| BE23D-GPR13 | 429 RATE_LIMITED | Owner, party, gear or comparable-query quota exceeded; no estimate mutation occurs. |
| BE23D-GPR14 | 400 INVALID_REQUEST or 422 VALIDATION_FAILED | Invalid date order, currency/value, snapshot, document media type or evidence reference. No private object is read before schema validation. |
| BE23D-GPR14 | 401 UNAUTHENTICATED or STEP_UP_REQUIRED | Appraiser/owner session or fresh appraisal step-up is absent/expired. |
| BE23D-GPR14 | 403 FORBIDDEN | Appraiser mandate does not cover gear/configuration or caller is not an authorized issuing appraiser. Owner identity and mandate graph remain hidden. |
| BE23D-GPR14 | 404 NOT_FOUND | Gear, mandate, evidence or object is absent/revoked/concealed. A hidden appraisal is not distinguishable from absent to other parties. |
| BE23D-GPR14 | 409 CONFLICT | Stale gear/configuration version, duplicate idempotency request or appraisal snapshot race. Prior appraisal remains immutable. |
| BE23D-GPR14 | 422 APPRAISAL_PRIVATE | Any actor other than owner or issuing appraiser asks for a private appraisal projection or document. Details contain recoveryAction only. |
| BE23D-GPR14 | 502/503/504 DEPENDENCY_UNAVAILABLE | Shard 01 mandate, BE00 object verification or admission is unavailable. No appraisal row or private document link is committed. |
| BE23D-GPR14 | 429 RATE_LIMITED | Owner/appraiser/gear quota exceeded; no appraisal is issued. |
| BE23D-GPR15 | 400 INVALID_REQUEST or 422 VALIDATION_FAILED | Empty item list, duplicate item, unsupported selection, invalid manifest policy or malformed evidence ID. |
| BE23D-GPR15 | 401 UNAUTHENTICATED | Missing or expired owner session/acting context. No selected item existence is disclosed. |
| BE23D-GPR15 | 403 FORBIDDEN | Actor lacks owner standing for any selected item or requests another party's appraisal/evidence. Pack creation fails as a whole, with no partial manifest. |
| BE23D-GPR15 | 404 NOT_FOUND | Item, evidence, appraisal, service event, photo object or job target is absent/revoked/concealed. Hidden item existence is not disclosed. |
| BE23D-GPR15 | 409 CONFLICT | Stale item snapshot, idempotency mismatch or pack version collision. A prior pack/job is replayed rather than duplicated. |
| BE23D-GPR15 | 422 APPRAISAL_PRIVATE | Selected appraisal is not available to the owner projection or its object purpose is invalid. No other appraisal detail is revealed. |
| BE23D-GPR15 | 502/503/504 DEPENDENCY_UNAVAILABLE | BE00 object authorization, job admission or selected evidence verification is unavailable. The pack is not reported succeeded; retry uses the same key. |
| BE23D-GPR15 | 429 RATE_LIMITED | Owner/party/pack quota exceeded; no job or document is created. |
| BE23D-GPR16 | 400 INVALID_REQUEST or 422 VALIDATION_FAILED | Missing role/use, invalid source discriminator, malformed evidence or path/body mismatch. Visibility/status fields are rejected as unknown. |
| BE23D-GPR16 | 401 UNAUTHENTICATED | Producer session or acting context is absent/expired. No credit or session existence is disclosed. |
| BE23D-GPR16 | 403 FORBIDDEN | Producer is not authorized to attest the source or attempts owner assertion/visibility widening. |
| BE23D-GPR16 | 404 NOT_FOUND | Gear is absent/revoked/concealed; a source hidden by Shard 07 is returned as concealed absence to an unauthorized actor. |
| BE23D-GPR16 | 409 CONFLICT | Stale gear version, duplicate idempotency request or link race. Existing link state is replayed only for the same request hash. |
| BE23D-GPR16 | 422 DISCography_CREDIT_INELIGIBLE | Credit/session is not an eligible attestation path, is withdrawn, or the link would widen its status/visibility. No link is published. |
| BE23D-GPR16 | 502/503/504 DEPENDENCY_UNAVAILABLE | Shard 07 eligibility/status lookup or BE00 admission is unavailable. Link creation remains uncommitted and cannot be guessed active. |
| BE23D-GPR16 | 429 RATE_LIMITED | Producer/party/gear quota exceeded; no link mutation occurs. |

All codes conform to the BE00 uppercase code pattern, including the
source-locked spelling DISCography_CREDIT_INELIGIBLE. Errors have safe,
localizable messages and details capped at 16 keys, four levels and 8 KiB.
Anonymous requests receive 401 before resource lookup. Evaluated authority
failure is 403; absent, revoked or deliberately concealed targets are 404.

### Authorization and Middleware Registry

| Operation ID | Authentication and role | Ownership/mandate predicate and 403-vs-404 | Middleware, including CORS |
|---|---|---|---|
| BE23D-GPR13 | Authenticated current owner or controlling acting party with gear.valuation_request capability | 23a owner/party standing, current gear/configuration version and valuation purpose must match. Known non-owner is 403; absent/revoked/concealed gear is 404. Public visitors have no command authority. | Route inventory/request ID; TLS/body/header ceilings; CORS policy gear-api with explicit web/PWA origins, credentials only for allowlisted origins, no wildcard, Vary Origin; Supabase session; Shard 01 acting context and owner standing; strict Zod validation; owner/gear rate limit; capability/purpose check; BE00 idempotency and expected-version CAS; named valuation RPC; response/error normalization; sanitized trace/audit. |
| BE23D-GPR14 | Authenticated appraiser with verified mandate, with owner-private read projection | Shard 01 mandate must cover exact gear/configuration and object purpose. Known unauthorized appraiser is 403; absent/revoked/concealed gear/mandate/object is 404; private read by other role maps to APPRAISAL_PRIVATE 422 without value disclosure. | Route inventory/request ID; TLS/body/header ceilings; CORS policy gear-api with explicit web/PWA origins, credentials only for allowlisted origins, no wildcard, Vary Origin; session and step-up; acting-context/mandate resolution; strict Zod validation; appraiser/gear rate limit; capability/object-purpose check; BE00 idempotency/CAS; private appraisal RPC; response/error normalization; sanitized trace/audit. |
| BE23D-GPR15 | Authenticated owner/controller for every selected item; registered pack worker is internal only | Server resolves owner standing per item and appraisal/evidence purpose. Any known item without standing is 403 and aborts all selection; absent/concealed item/evidence is 404. Worker cannot be invoked through HTTP or used to bypass selection authorization. | Route inventory/request ID; TLS/body/header ceilings; CORS policy gear-api with explicit web/PWA origins, credentials only for allowlisted origins, no wildcard, Vary Origin; session/acting context; strict Zod validation; owner/pack rate limit; per-item capability and object-purpose checks; BE00 idempotency/job admission; transaction plus queue outbox; response/error normalization; sanitized trace/audit. |
| BE23D-GPR16 | Authenticated Producer with eligible Shard 07 credit/session attestation capability | Shard 07 source eligibility, producer relation, gear identity and role/use are checked. Known producer without attestation authority is 403; absent/concealed gear/source is 404; status/visibility is never caller-selected. | Route inventory/request ID; TLS/body/header ceilings; CORS policy gear-api with explicit web/PWA origins, credentials only for allowlisted origins, no wildcard, Vary Origin; Supabase session; Shard 01 acting context; strict Zod validation; producer/gear rate limit; Shard 07 eligibility/capability check; BE00 idempotency/CAS; link RPC/outbox; response/error normalization; sanitized trace/audit. |

No browser role receives direct table grants. Service credentials do not imply
owner, appraiser or producer authority. RPCs repeat actor, acting party,
capability, mandate, owner standing, source visibility, purpose and target
version. Cookie mutations require same-origin CSRF binding; bearer clients use
the registered authorization header and no ambient cookie.

### Idempotency and Concurrency Registry

| Operation ID | Idempotency contract | Version and race handling | Atomicity and replay |
|---|---|---|---|
| BE23D-GPR13 | Require Idempotency-Key 16-128 characters, scoped by actor, operation and gearId; hash normalized snapshots, policy, evidence and expected version in BE00 idempotency_records for 30 days. | Lock gear_record and valuation snapshot; compare expectedGearVersion, configurationVersion and policyVersion. One estimate wins; a concurrent modification returns 409 without a second value. | Reserve key, verify comp set, append valuation_estimate, audit and gear.valuation.changed.v1 outbox row atomically. Same request returns byte-equivalent Gpr13Success; changed request returns IDEMPOTENCY_MISMATCH. |
| BE23D-GPR14 | Scope key by actor, operation and gearId; hash mandate, snapshot, value, dates, document digest and evidence refs. | Lock gear/configuration and appraisal snapshot; compare expectedGearVersion/configurationVersion. Appraisal is unique for mandate plus snapshot plus effective version. | Reserve key, verify object/mandate, append immutable appraisal_record, audit and event atomically. Replay returns the same private reference to the authorized original actor; key reuse with changed payload has no effect. |
| BE23D-GPR15 | Scope key by actor, operation and deterministic item-set digest. Store selected IDs, snapshot versions, manifest policy and request hash before job creation. | Lock pack request and selected item snapshots; any stale item aborts the whole pack. Job state uses BE00 CAS lease/version; only one live job exists per key. | Reserve key, authorize every selection, create insurance_pack and BE00 job/outbox rows atomically. Replays return the same pack/job; worker retries never duplicate manifest or document. |
| BE23D-GPR16 | Scope key by actor, operation, gearId and source ID; hash source, role/use and evidence refs. | Lock gear and source link; compare expectedGearVersion and sourceVersion from Shard 07. Concurrent status change supersedes/suppresses through a new source event, never an edit. | Reserve key, verify source eligibility, append gear_credit_link, audit and event atomically. Same request replays byte-equivalent state; changed role/use with same key returns IDEMPOTENCY_MISMATCH. |

Validation, authority and dependency failures may be recorded as replayable
outcomes only under BE00 reservation policy. A retry must recheck current
authorization and source status. Rollback removes domain/audit/outbox/job writes
except immutable idempotency evidence needed for deterministic replay.

### Rate, CORS and SLO Registry

| Operation ID | Rate limit | CORS policy | Deadline and response SLO |
|---|---|---|---|
| BE23D-GPR13 | 20 requests/minute/owner actor, 60/minute/gear, burst 5/10 seconds; comparable-provider quota is separate and tighter if needed | gear-api allowlist only; POST and OPTIONS; explicit origins, no wildcard credentials, Vary Origin, no private headers exposed | 15 second hard deadline; p95 <= 2 seconds with healthy comparable lookup; timeout returns 503/504 and no estimate. |
| BE23D-GPR14 | 10 requests/minute/appraiser actor, 30/minute/gear, burst 3/10 seconds; step-up command quota applies | gear-api allowlist only; POST and OPTIONS; explicit origins, no wildcard credentials, Vary Origin, no document URL exposed | 15 second hard deadline; p95 <= 1.5 seconds with healthy object/mandate checks; private document generation remains BE00-owned. |
| BE23D-GPR15 | 5 pack requests/hour/owner, 20 items/pack synchronous admission limit, burst 2/10 minutes; BE00 global quota can tighten | gear-api allowlist only; POST and OPTIONS; explicit origins, no wildcard credentials, Vary Origin, no signed URL exposed | 2 second acceptance SLO; return queued/running and job ID before long work. Worker has bounded lease; no synchronous insurer/document wait. |
| BE23D-GPR16 | 30 requests/minute/producer actor, 90/minute/gear, burst 8/10 seconds; source credit quota can tighten | gear-api allowlist only; POST and OPTIONS; explicit origins, no wildcard credentials, Vary Origin, no hidden source headers | 15 second hard deadline; p95 <= 1.2 seconds with healthy Shard 07 lookup; unavailable source never becomes active. |

Rate keys use resolved actor/party/gear/source identity, not caller-supplied
owner, producer, credit or visibility fields. Error responses carry no-store,
X-Request-Id, matching RateLimit headers and Retry-After where applicable.

### Observability Registry

| Operation ID | Trace and metrics | Audit and redaction |
|---|---|---|
| BE23D-GPR13 | Span includes operation ID, requestId, correlationId, gear aggregate hash, policy version, comparable count, result state and dependency class. Metrics cover issued, withheld, invalidated, replayed, insufficient_evidence, forbidden, conflict, latency and projection lag. | Audit records actor/party hash, gear hash, policy version, threshold decision, outcome and reason. Never log range values, comparable IDs/raw values, configuration, evidence, location, owner identity or provider payload. |
| BE23D-GPR14 | Span includes operation ID, requestId, correlationId, gear hash, appraiser mandate hash, snapshot version, outcome and dependency class. Metrics cover issued, expired, private_denied, forbidden, replayed, conflict, object failures and latency. | Audit records actor/appraiser hash, gear hash, mandate decision, object digest hash, state and reason. Never log appraisal value, document bytes/URL, configuration, evidence or owner identity. |
| BE23D-GPR15 | Span includes operation ID, requestId, correlationId, pack/job IDs, selection count, gap count, worker state and dependency class. Metrics cover accepted, running, succeeded, retryable_failed, replayed, private_denied, gaps, queue lag and duration. | Audit records actor hash, selected item count, selection digest, gap count, policy version, job state and reason. Never log item IDs, evidence/appraisal IDs, manifest contents, document URL or private values. |
| BE23D-GPR16 | Span includes operation ID, requestId, correlationId, gear hash, source kind/hash, source status, inherited visibility and dependency class. Metrics cover active, suppressed, disputed, ineligible, hidden, replayed, forbidden, conflict and latency. | Audit records actor/producer hash, gear/source hash, eligibility decision, inherited state/visibility and reason. Never log credit/session identity, hidden use, owner identity or source payload. |

Sentry receives only correlation ID, operation ID and sanitized code. Structured
logs use stable enums and digests; request bodies, signed URLs, evidence, values,
credit identifiers and private text are excluded.

## Database Schema

All 23d tables live in non-exposed platform_private with RLS enabled and forced.
23a gear_record/identity tables, identity.party, 23c service/component tables,
Shard 07 credit/session tables and BE00 object/job tables are explicit
cross-boundary FK targets. Browser roles receive no table grants. Named
security-invoker RPCs repeat owner, appraiser, producer, purpose, source
visibility and expected-version predicates. A security-definer helper, if
needed, uses an empty fixed search_path, fully qualified objects, revoked PUBLIC
execution and positive/negative authorization tests.

### Complete Table Definitions

| Table / model | Columns with SQL type, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.valuation_estimates / valuation_estimate | id uuid NOT NULL PK DEFAULT gen_random_uuid(); gear_id uuid NOT NULL FK platform_private.gear_records(id); owner_id uuid NOT NULL FK identity.party(id); configuration_version bigint NOT NULL CHECK >0; identity_snapshot_digest bytea NOT NULL CHECK octet_length(identity_snapshot_digest)=32; condition_digest bytea NOT NULL CHECK octet_length(condition_digest)=32; market_key text NOT NULL CHECK char_length(market_key) BETWEEN 2 AND 64; region_code text NOT NULL CHECK char_length(region_code) BETWEEN 2 AND 6; currency char(3) NOT NULL CHECK currency ~ '^[A-Z]{3}$'; valuation_at timestamptz NOT NULL; policy_version bigint NOT NULL CHECK >0; comp_floor integer NOT NULL CHECK comp_floor BETWEEN 1 AND 10000; max_comparable_age_days integer NOT NULL CHECK max_comparable_age_days BETWEEN 1 AND 3650; comparable_set_digest bytea NOT NULL CHECK octet_length(comparable_set_digest)=32; comparable_count integer NOT NULL CHECK comparable_count>=0; oldest_comparable_at timestamptz NULL; newest_comparable_at timestamptz NULL; range_low_minor bigint NULL CHECK range_low_minor IS NULL OR range_low_minor>=0; range_high_minor bigint NULL CHECK range_high_minor IS NULL OR range_high_minor>=0; evidence_class valuation_evidence_class NOT NULL CHECK IN governed_comparables,owner_evidence,mixed; caveats jsonb NOT NULL DEFAULT []; state valuation_estimate_state NOT NULL CHECK IN issued,review_required,invalidated,withheld; supersedes_estimate_id uuid NULL FK platform_private.valuation_estimates(id); service_revision bigint NULL; version bigint NOT NULL CHECK >0; correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK (range_low_minor IS NULL AND range_high_minor IS NULL) OR (range_low_minor IS NOT NULL AND range_high_minor IS NOT NULL AND range_high_minor>=range_low_minor); CHECK state <> 'issued' OR comparable_count>=comp_floor; CHECK newest_comparable_at IS NULL OR oldest_comparable_at IS NULL OR newest_comparable_at>=oldest_comparable_at | PK; unique gear_id,configuration_version,policy_version,valuation_at; gear_id,valuation_at DESC,id; gear_id,state,updated_at DESC; market_key,region_code,valuation_at DESC; comparable_set_digest; supersedes_estimate_id | Forced RLS. Owner may read own authorized projection; 23c invalidation consumer may append review state through named event RPC; valuation worker may insert only lease-bound results; public receives bounded range/status projection if policy permits. anon/authenticated direct table grants denied; UPDATE/DELETE denied except audited retention tombstone path. |
| platform_private.appraisal_records / appraisal_record | id uuid NOT NULL PK DEFAULT gen_random_uuid(); gear_id uuid NOT NULL FK platform_private.gear_records(id); owner_id uuid NOT NULL FK identity.party(id); appraiser_party_id uuid NOT NULL FK identity.party(id); appraiser_mandate_id uuid NOT NULL FK identity.mandates(id); configuration_version bigint NOT NULL CHECK >0; snapshot_digest bytea NOT NULL CHECK octet_length(snapshot_digest)=32; value_minor bigint NOT NULL CHECK value_minor>=0; currency char(3) NOT NULL CHECK currency ~ '^[A-Z]{3}$'; effective_at timestamptz NOT NULL; expires_at timestamptz NOT NULL CHECK expires_at>effective_at; document_object_id uuid NOT NULL FK platform_private.object_records(id); document_digest bytea NOT NULL CHECK octet_length(document_digest)=32; state appraisal_state NOT NULL CHECK IN issued,expired,superseded; version bigint NOT NULL CHECK >0; correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK state <> 'expired' OR expires_at<=created_at OR expires_at>effective_at | PK; unique gear_id,appraiser_mandate_id,configuration_version,effective_at; gear_id,owner_id,effective_at DESC,id; appraiser_party_id,created_at DESC; appraiser_mandate_id,state; document_object_id | Forced RLS. Owner projection may read its own private appraisal; issuing appraiser may read only its issued artifact; BE00 object RPC authorizes document separately; assigned reviewer requires explicit evidence capability and reason. anon/authenticated direct table grants denied; UPDATE/DELETE denied, expiry is an append-only state transition. |
| platform_private.insurance_packs / insurance_pack | id uuid NOT NULL PK DEFAULT gen_random_uuid(); owner_id uuid NOT NULL FK identity.party(id); selection_digest bytea NOT NULL CHECK octet_length(selection_digest)=32; manifest_policy_version bigint NOT NULL CHECK >0; selected_item_count integer NOT NULL CHECK selected_item_count>0; selected_evidence_count integer NOT NULL CHECK selected_evidence_count>=0; selected_appraisal_count integer NOT NULL CHECK selected_appraisal_count>=0; selected_service_count integer NOT NULL CHECK selected_service_count>=0; selected_photo_count integer NOT NULL CHECK selected_photo_count>=0; gap_count integer NOT NULL DEFAULT 0 CHECK gap_count>=0; gaps jsonb NOT NULL DEFAULT []; manifest_digest bytea NULL CHECK manifest_digest IS NULL OR octet_length(manifest_digest)=32; document_object_id uuid NULL FK platform_private.object_records(id); job_id uuid NOT NULL FK platform_private.jobs(id); state insurance_pack_state NOT NULL CHECK IN queued,running,succeeded,failed_retryable,cancelled; transmits_to_insurer boolean NOT NULL DEFAULT false CHECK transmits_to_insurer=false; version bigint NOT NULL CHECK >0; correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK state <> 'succeeded' OR manifest_digest IS NOT NULL; CHECK state <> 'succeeded' OR document_object_id IS NOT NULL | PK; unique owner_id,selection_digest,manifest_policy_version; owner_id,created_at DESC,id; job_id; state,updated_at; document_object_id; partial owner_id where state IN queued,running | Forced RLS. Owner may read its pack/job projection and download only through BE00 object authorization; pack worker may update state/version through lease RPC; reviewer may inspect bounded gap/status projection with capability. anon/authenticated direct table grants denied; no insurer or public document grant; UPDATE/DELETE denied except audited cancellation/retention RPC. |
| platform_private.gear_credit_links / gear_credit_link | id uuid NOT NULL PK DEFAULT gen_random_uuid(); gear_id uuid NOT NULL FK platform_private.gear_records(id); producer_party_id uuid NOT NULL FK identity.party(id); credit_id uuid NULL FK credits_private.credits(id); session_id uuid NULL FK credits_private.sessions(id); source_kind credit_source_kind NOT NULL CHECK IN credit,session; role_or_use text NOT NULL CHECK char_length(role_or_use) BETWEEN 1 AND 256; source_version bigint NOT NULL CHECK >0; source_status credit_link_source_status NOT NULL CHECK IN eligible,disputed,hidden; inherited_visibility credit_visibility NOT NULL CHECK IN public,private,hidden; state gear_credit_link_state NOT NULL CHECK IN active,suppressed,disputed; evidence_digest bytea NOT NULL CHECK octet_length(evidence_digest)=32; version bigint NOT NULL CHECK >0; correlation_id uuid NOT NULL; idempotency_record_id uuid NOT NULL FK platform_private.idempotency_records(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK ((source_kind='credit' AND credit_id IS NOT NULL AND session_id IS NULL) OR (source_kind='session' AND session_id IS NOT NULL AND credit_id IS NULL)); CHECK source_status='hidden' OR inherited_visibility IN ('public','private'); CHECK state='active' OR source_status IN ('disputed','hidden'); | PK; partial unique gear_id,credit_id where source_kind='credit' and credit_id IS NOT NULL; partial unique gear_id,session_id where source_kind='session' and session_id IS NOT NULL; gear_id,state,updated_at DESC; producer_party_id,created_at DESC; credit_id,source_version; session_id,source_version; inherited_visibility,state | Forced RLS. Producer may read own eligible projection; owner may read link only through gear projection; Shard 07 status consumer may append suppression/dispute; public sees only links whose inherited visibility is public. anon/authenticated direct table grants denied; UPDATE/DELETE denied, status changes append-only through source/event RPC. |

Every array/JSON selection is validated against the strict request and manifest
schema before insertion; the digest binds the complete normalized selection.
Where a field refers to multiple evidence/appraisal/service/photo IDs, the
transaction verifies each target through its owner/purpose RPC before counting
it. Cross-shard arrays do not weaken the individual FK and RLS checks.

For insurance_packs, the migration materializes the selected references behind
the selection digest as selected_item_ids uuid[] NOT NULL CHECK cardinality
selected_item_ids = selected_item_count, item_snapshot_digest bytea NOT NULL
CHECK octet_length(item_snapshot_digest)=32, selected_evidence_ids uuid[] NOT
NULL DEFAULT [], selected_appraisal_ids uuid[] NOT NULL DEFAULT [],
selected_service_event_ids uuid[] NOT NULL DEFAULT [], and
selected_photo_object_ids uuid[] NOT NULL DEFAULT []. Each array element is
verified by a named owner/purpose RPC against platform_private.gear_records,
platform_private.object_records, platform_private.appraisal_records or
platform_private.service_events before insertion; the array columns therefore
have FK-target and RLS semantics even though PostgreSQL cannot declare an
element-wise foreign key. The row also has GIN indexes on selected_item_ids,
selected_evidence_ids and selected_service_event_ids, and inherits the
owner-only pack RLS, worker lease grant and denied browser/object grants stated
above.

The gear_credit_links migration adds the source-state invariant
CHECK ((source_status = 'eligible' AND state = 'active') OR
      (source_status = 'disputed' AND state = 'disputed') OR
      (source_status = 'hidden' AND state = 'suppressed')) and
CHECK ((source_status = 'hidden' AND inherited_visibility = 'hidden') OR
      (source_status <> 'hidden' AND inherited_visibility IN
       ('public', 'private', 'hidden'))). These checks make the Shard 07
status/visibility inheritance fail closed even if a malformed event reaches a
migration or replay path.

### Shared persistence invariants

- Every command reserves inherited BE00 idempotency using actor, operation,
  request hash and target. Domain rows, audit events, job state and outbox
  events commit atomically.
- valuation_estimate is issued only when the exact normalized configuration,
  condition, market and time satisfy current policy compFloor and recency.
  Sparse/stale data produces no range and never a fabricated wide estimate.
- A consumed service_event or component_fact modification invalidates or marks
  review_required on affected estimates. 23d never silently recalculates a
  value and never overwrites service/component truth.
- appraisal_record is immutable, owner-private, mandate-bound and distinct from
  valuation_estimate. Expiry is a retained state transition, not deletion.
- insurance_pack selection, gap list, manifest and checksum are deterministic.
  Missing evidence is an explicit gap; transmits_to_insurer is permanently
  false and no route submits to an insurer.
- gear_credit_link inherits Shard 07 source status and visibility exactly.
  Hidden/disputed source status suppresses or disputes the link; 23d cannot
  widen visibility, change source state or claim ownership.
- Public/downstream events contain no values, raw comparable data, appraiser
  identity, document URL, evidence bytes, credit/session identity, contact or
  hidden use. Object bytes are BE00-authorized separately.
- Erasure/revocation removes derived projections and object grants while
  retaining required immutable evidence/tombstones and audit/outbox history.

## Middleware & Policies

### Hono order and security

1. Match the registered route, attach UUID requestId, operation ID, trace and
   correlation context, and enforce URL/header/body ceilings.
2. Apply TLS/security headers and CORS policy gear-api. Allow only registered
   product web/PWA origins, POST and OPTIONS, and never wildcard credentials.
3. Authenticate Supabase session or registered internal worker/service
   principal. Ignore caller-supplied owner, producer or source status.
4. Resolve Shard 01 acting party, owner/appraiser/producer authority, per-item
   standing and step-up freshness. Ambiguous context fails closed.
5. Apply actor, party, gear, pack and source rate limits before sensitive work.
6. Validate path, headers and strict Zod body; bind path gearId, Idempotency-Key
   and If-Match to their body/command values.
7. Authorize capability, owner/mandate/source visibility, evidence purpose and
   expected versions. RLS/RPC predicates repeat each decision.
8. Reserve BE00 idempotency and request hash, then invoke one named domain RPC.
   Comparable lookups and object calls are outside the DB transaction.
9. Commit canonical rows, audit and outbox; create pack job only through the
   registered BE00 job RPC. Return only the success schema or ErrorResponse.
10. Normalize ETag, X-Request-Id, no-store/rate headers; close sanitized spans
    and emit one completion audit event.

### Policy rules

| Policy | Required behavior |
|---|---|
| Valuation normalization | Configuration, condition, market and time use normalized digests and current policy version. Comparable set must meet both count and recency floor. |
| Valuation disclosure | Owner receives range, sample, recency and caveats; public projections receive only policy-approved bounded status. No range is a title, coverage or guaranteed price. |
| Appraisal privacy | Issuing appraiser and owner are the only ordinary readers. Object bytes use BE00 purpose authorization; other roles receive APPRAISAL_PRIVATE without existence/value leakage. |
| Modification invalidation | gear.service.changed.v1 marks affected estimates review_required/invalidated by configuration version; 23d never edits 23c rows or silently revalues. |
| Pack determinism | Normalize item/evidence IDs and snapshots, compute selection_digest, list all gaps, sign manifest and checksum, and expose resumable job state. |
| No insurer transmission | transmits_to_insurer is constrained false; there is no insurer endpoint, webhook or provider credential in this boundary. |
| Credit inheritance | Source credit/session status and visibility are authoritative. Link projections cannot widen, repair or reinterpret them. |
| Evidence | Evidence refs are digest-bound, purpose-scoped and private. Bytes and signed URLs stay in BE00 object flows. |
| Absence semantics | Missing service/modification facts do not prove originality, condition, value, insurance coverage or gear use. |

## Data Flow

### GPR-13 owner requests valuation

1. Hono authenticates owner, resolves acting context and validates
   Gpr13Request. It obtains the current 23a gear/configuration snapshot and
   23c service/component revision under owner projection.
2. The comparable adapter receives only normalized configuration/condition/
   market/time digests and policy thresholds. It returns candidate count,
   recency and set digest, never raw provider payload to the command.
3. The valuation RPC verifies compFloor and maxComparableAgeDays under the
   current policy. Below floor returns VALUATION_INSUFFICIENT_EVIDENCE before
   issuing a range.
4. A transaction appends valuation_estimate, audit and
   gear.valuation.changed.v1 outbox event, with review/invalidated state when a
   known modification makes the snapshot stale.
5. Gpr13Success exposes range/sample/recency/caveats only to the authorized
   owner projection. It never asserts title, insurance coverage or guaranteed
   sale price.

### GPR-14 appraiser issues appraisal

1. Hono authenticates appraiser, enforces step-up and resolves the exact
   Shard 01 mandate for gear/configuration.
2. BE00 verifies the document object is ready, owner-scoped and digest-matched;
   object bytes remain outside the response and DB transaction.
3. The appraisal RPC pins gear/configuration version, verifies value/date
   fields, appends immutable appraisal_record and audit, and emits
   gear.appraisal.changed.v1.
4. Owner/appraiser receives owner-private Gpr14Success. Expiry is computed by
   projection/worker and appends a state transition; no estimate is overwritten.

### GPR-15 owner builds insurance claim pack

1. Hono validates the selected item/evidence/appraisal/service/photo IDs and
   resolves owner standing independently for every item.
2. BE00 object/evidence RPC verifies each reference and purpose. An inaccessible
   appraisal fails the complete selection with APPRAISAL_PRIVATE; missing
   optional evidence is represented as a gap only when policy permits.
3. A deterministic selection digest and queued BE00 job are created with
   insurance_pack in one transaction. Worker leases use job version CAS.
4. Worker snapshots authorized records, writes explicit gaps, signs manifest,
   stores a digest-bound document through BE00 and transitions succeeded only
   after both manifest and object are ready.
5. The response always says transmitsToInsurer false. The user downloads through
   BE00 and transmits externally; no coverage status is inferred.

### GPR-16 producer attests gear use

1. Hono authenticates the Producer and validates only gear/source/role/use and
   evidence. It rejects visibility, status and owner assertion fields.
2. Shard 07 verifies the credit/session is an eligible attestation path and
   returns source status, version and visibility. A disputed/hidden source
   cannot be promoted to active/public.
3. The link RPC verifies gear identity and expected version, appends
   gear_credit_link and emits gear.credit-link.changed.v1.
4. Public/owner projections use the exact inherited visibility/status. Later
   source changes append suppression/dispute state; 23d has no correction route.

## State Machines, Concurrency and Failure Recovery

### Valuation estimate state

| State | Allowed transition | Guard and recovery |
|---|---|---|
| issued | issued to review_required or invalidated | A service/component or identity version change invalidates the pinned snapshot through an authorized event consumer; a new estimate uses a new version. |
| review_required | review_required to issued or invalidated | 23d re-runs current policy after a fresh authorized request; no old range is silently presented as current. |
| invalidated | none | Historical result remains for owner/audit projection with caveat; new evidence creates a new estimate. |
| withheld | withheld to issued or invalidated | A later fresh request may meet policy; the withheld result never contains a fabricated range. |

### Appraisal and pack states

| Model | State transitions | Guard and recovery |
|---|---|---|
| appraisal_record | issued to expired or superseded | Expiry is time/policy driven; correction creates a new appraisal; value/document/snapshot are never edited. |
| insurance_pack | queued to running to succeeded | Worker must hold a lease/version, manifest digest and ready document object. |
| insurance_pack | queued/running to failed_retryable | Bounded retryable worker failure preserves selection/gaps and requeues with same job/key; no false success. |
| insurance_pack | queued/running to cancelled | Owner or audited operator cancellation leaves manifest/attempt history and never transmits externally. |
| gear_credit_link | active to suppressed/disputed | Source status/visibility event drives transition; no local correction or widening. |
| gear_credit_link | suppressed/disputed to active | Only a fresh eligible source event and CAS may restore active; local actor cannot reinstate it. |

### Failure and race matrix

| Scenario | Detection | Recovery |
|---|---|---|
| Sparse or stale comparable set | Count/recency policy gate | Return VALUATION_INSUFFICIENT_EVIDENCE, retain withheld evidence if authorized, and require a fresh request. |
| Service/component modification after estimate | 23c event with newer configuration/version | Mark review_required/invalidated; never silently reuse or revalue. |
| Appraiser mandate absent/expired | Shard 01 mandate and step-up check | Return FORBIDDEN or APPRAISAL_PRIVATE; no appraisal/object disclosure. |
| Appraisal object unavailable or digest mismatch | BE00 object state/digest check | Return 404 for concealed object or 503 for dependency failure; no appraisal row. |
| Selected pack item loses owner standing | Per-item authorization before job commit | Abort entire pack with 403; no partial selection, job or document. |
| Pack worker crashes after manifest | BE00 job lease/version and manifest digest | Expired lease resumes; same job/idempotency key prevents duplicate manifest/document. |
| Pack object upload ambiguous | Object state/checksum reconciliation | Keep job running or failed_retryable; never mark succeeded or expose URL until ready. |
| Credit source becomes disputed/hidden | Shard 07 status/version event | Append suppressed/disputed link and remove public projection/hidden-link count; no source payload leak. |
| Concurrent valuation requests | Gear/policy lock and expected version | One estimate wins; loser gets 409 or same replay result, no duplicate current range. |
| Concurrent appraisal/pack/link command | Target/source locks and idempotency hashes | One transaction wins; loser receives typed conflict; all prior evidence remains immutable. |
| Request times out after commit | BE00 idempotency result | Replay same key returns stored success; no second estimate, appraisal, job or link. |
| Revocation/erasure | Shard 01/BE00 legal retention event | Revoke projections/object grants; retain required evidence/tombstones and enqueue idempotent invalidation. |

No state transition infers title, coverage, ownership, originality or public
credit use from an estimate, appraisal, pack, service absence or source outage.

## External Seams

Every seam has an exact typed request/response, timeout, bounded retries/backoff
and circuit behavior. Raw values, documents, evidence and credit payloads do
not cross into logs or canonical rows.

| Seam | Exact request and response | Timeout, retry and circuit |
|---|---|---|
| BE00 command admission/idempotency | Request: operationId, actorId, actingPartyId, target hash, idempotencyKeyHash, requestHash, expectedVersion and correlationId. Response: reserved, replay with stored status/body hash, or IDEMPOTENCY_MISMATCH. | 500 ms; 2 retries at 25 ms and 100 ms for connection/reset only. Open after 5 failures in 30 seconds, half-open after 15 seconds; open returns DEPENDENCY_UNAVAILABLE. |
| Shard 01 standing/mandate | Request: actorId, actingPartyId, gearId, capability, purpose, appraiserMandateId or owner target, requested step-up. Response: role, party, mandate scope/expiry, owner standing, producer relation and stepUpSatisfied. | 800 ms; 1 retry at 50 ms for transport failure. Open after 5 failures in 30 seconds and fail closed; expired/ambiguous authority is 403, not a retry. |
| 23a identity/configuration snapshot | Request: gearId, expectedGearVersion, requested configurationVersion and projection purpose. Response: identityVersion, configurationVersion, normalized identity digest, owner standing and state. | 700 ms; 2 retries at 50 ms and 150 ms for transport failure. Open after 5 failures in 30 seconds; stale/unknown snapshot blocks valuation/appraisal/pack/link. |
| 23c service/component revision | Request: gearId, configurationVersion, purpose valuation, expected revision and correlationId. Response: current service/component revision, modification state and snapshot digest. | 700 ms; 2 retries at 50 ms and 150 ms. Open after 5 failures in 30 seconds; unavailable revision returns DEPENDENCY_UNAVAILABLE rather than a stale value. |
| Comparable lookup adapter | Request: normalized configurationDigest, conditionDigest, marketKey, regionCode, valuationAt, policyVersion, compFloor and maxAgeDays. Response: comparableSetDigest, count, oldestComparableAt, newestComparableAt and evidenceClass; no raw values in this seam response. | 1200 ms; 2 retries at 100 ms and 250 ms for transport errors only. Open after 5 failures in 60 seconds, half-open at 30 seconds; open/ambiguous result withholds range. |
| BE00 object/evidence authorization | Request: object/evidence IDs, target owner/gear, purpose, digest list and actor context. Response: verified references, media type/state, purpose grant and no bytes. | 700 ms; 1 retry at 50 ms. Open after 5 failures in 30 seconds; unavailable required evidence returns DEPENDENCY_UNAVAILABLE before mutation. |
| BE00 job/object worker | Request: jobId, packId, leaseVersion, selectionDigest, authorized item/evidence refs and manifestPolicyVersion. Response: lease, attempt result, manifestDigest, ready documentObjectId or retryable failure code. | Lease 1000 ms; worker retries 3 times at 1, 5 and 30 seconds, then manual review. Circuit opens after 5 failures in 60 seconds; no success until manifest/object checks pass. |
| Shard 07 credit/session eligibility | Request: source kind/id, producerPartyId, gearId, role/use, evidenceDigest and requested purpose. Response: eligible boolean, sourceVersion, sourceStatus eligible/disputed/hidden, inheritedVisibility and source correlation. | 900 ms; 2 retries at 100 ms and 250 ms for transport failure. Open after 5 failures in 30 seconds; unavailable/ambiguous source blocks link creation. |

No seam may return a private value merely because it has a service credential.
Provider retries reuse the same idempotency key and re-evaluate current
authority. Ambiguous object/job/source outcomes remain pending/unknown and never
become success by timeout.

## Events and Async Consumers

### Event envelope

Every emitted event uses the inherited BE00 outbox envelope:

~~~ts
type GearValuationEvent = {
  id: string,
  eventType: "gear.valuation.changed.v1" |
    "gear.appraisal.changed.v1" |
    "gear.insurance-pack.changed.v1" |
    "gear.credit-link.changed.v1",
  schemaVersion: 1,
  aggregateType: "gear_record" | "insurance_pack",
  aggregateId: string,
  aggregateVersion: string,
  correlationId: string,
  causationId: string | null,
  occurredAt: string,
  payload: {
    gearId: string | null,
    resourceId: string,
    state: string,
    evidenceClass: string | null,
    visibility: "public" | "private" | "hidden" | null
  }
};
~~~

Payloads are strict and omit raw comparable values, range values outside an
authorized owner projection, appraiser identity, documents, evidence, owner
contact, credit/session IDs, hidden use, serials and exact locations.
gear.valuation.changed.v1 is emitted after estimate state commits;
gear.appraisal.changed.v1 after private appraisal issue/expiry;
gear.insurance-pack.changed.v1 after pack/job state transitions; and
gear.credit-link.changed.v1 after link state commits. Event IDs and aggregate
versions deduplicate consumers; lease failures leave outbox rows retryable.

### Consumer obligations

| Consumer | Event/input | Required behavior |
|---|---|---|
| 23a chain/provenance projection | gear.valuation.changed.v1, gear.appraisal.changed.v1, gear.insurance-pack.changed.v1, gear.credit-link.changed.v1 | Add bounded evidence/status facts under 23a projection policy; never expose private value, document, pack manifest or hidden credit use. |
| 23c valuation invalidation | gear.identity.changed.v1, gear.service.changed.v1, gear.claim.changed.v1 | Mark affected estimates review_required/invalidated by version; never edit 23c service/component rows or silently revalue. |
| 23b protected recovery projection | gear.theft-flag.changed.v1, gear.sighting.changed.v1 | Supply only safe caveat/status; no pack/valuation path receives reporter identity/location. |
| Owner evidence projection | gear.appraisal.changed.v1, gear.insurance-pack.changed.v1 | Show private status and authorized document/job references through BE00 object/job checks. |
| Shards 24, 25 and 26 | gear.valuation.changed.v1, gear.service.changed.v1, gear.identity.changed.v1 | Consume bounded evidence class/status only; never present estimate as title, insurance or guaranteed price. |
| Shard 07 credit lifecycle | gear.credit-link.changed.v1 | Use the link as a projection; source credit/session status remains authoritative and can suppress the link. |

## Error Handling

### Boundary matrix

| Operation ID | Boundary | Required result |
|---|---|---|
| BE23D-GPR13 | Transport/schema/normalization | 400 INVALID_REQUEST or 422 VALIDATION_FAILED with BE00 ErrorResponse; no source lookup or mutation. |
| BE23D-GPR13 | Owner/gear authority | 401 UNAUTHENTICATED, 403 FORBIDDEN or concealed 404; no owner identity or configuration leak. |
| BE23D-GPR13 | Comparable evidence floor | 422 VALUATION_INSUFFICIENT_EVIDENCE; no range or stale estimate success. |
| BE23D-GPR13 | Version/idempotency race | 409 CONFLICT with BE00 details; one winner and no duplicate current estimate. |
| BE23D-GPR13 | Dependency timeout | 503 DEPENDENCY_UNAVAILABLE with retryable true; no guessed value. |
| BE23D-GPR14 | Transport/date/object schema | 400 INVALID_REQUEST or 422 VALIDATION_FAILED; no document lookup before validation. |
| BE23D-GPR14 | Mandate/private access | 403 FORBIDDEN for known bad mandate or APPRAISAL_PRIVATE for private read; 404 for concealed target. |
| BE23D-GPR14 | Version/idempotency race | 409 CONFLICT; immutable prior appraisal remains unchanged. |
| BE23D-GPR14 | Object/mandate timeout | 503 DEPENDENCY_UNAVAILABLE; no appraisal row or private URL. |
| BE23D-GPR15 | Selection/owner/evidence gate | 400/422 for invalid input, 403 for any failed owner predicate, 404 for concealed item, APPRAISAL_PRIVATE for inaccessible appraisal; all-or-nothing job creation. |
| BE23D-GPR15 | Job/object failure | 503 DEPENDENCY_UNAVAILABLE or queued failed_retryable status; never succeeded without manifest and ready document. |
| BE23D-GPR15 | Retry/idempotency race | 409 or stored replay; one selection digest, pack and job. |
| BE23D-GPR16 | Source eligibility | 422 DISCography_CREDIT_INELIGIBLE; no link or visibility widening. |
| BE23D-GPR16 | Gear/source authority | 401/403/404 according to auth and concealment; no credit/session identity leak. |
| BE23D-GPR16 | Source/gear race | 409 CONFLICT or source-driven suppression; no local reinstatement. |
| BE23D-GPR16 | Shard 07 timeout | 503 DEPENDENCY_UNAVAILABLE; cannot-check source never becomes active. |

### Error invariants

- Every failure returns Content-Type application/json, X-Request-Id,
  Cache-Control no-store and matching rate headers.
- ErrorResponse has exactly one ApiError object with code, message, requestId and
  details. RFC problem fields, SQL, stack, provider payloads, values, document
  URLs, evidence and private identity are prohibited.
- Validation and authentication happen before existence-sensitive lookup.
  Concealed targets are indistinguishable from absence.
- Failed/time-out transactions leave no valuation, appraisal, pack, job, link,
  audit completion or event payload except registered idempotency evidence.
- A service credential cannot bypass APPRAISAL_PRIVATE, owner standing, source
  visibility or the no-insurer-transmission invariant.

## Testing Strategy

### Contract and route tests

| Test ID | Operation ID | Acceptance evidence |
|---|---|---|
| BE23D-T13 | BE23D-GPR13 | Gpr13Request/Gpr13Success date and estimate constraints, owner standing, ApiError, idempotency, RLS, event, and output-filter assertions pass |
| BE23D-T14 | BE23D-GPR14 | Gpr14Request/Gpr14Success appraisal provenance and comp-floor constraints, appraiser mandate, ApiError, CAS, event, and CORS assertions pass |
| BE23D-T15 | BE23D-GPR15 | Gpr15Request/Gpr15Success pack completeness and retention constraints, owner authorization, ApiError, retry/circuit, RLS, and privacy assertions pass |
| BE23D-T16 | BE23D-GPR16 | Gpr16Request/Gpr16Success eligible-source and credit-link constraints, producer authority, ApiError, idempotency, event, and output-filter assertions pass |

- Parse Gpr13Request/Gpr13Success, Gpr14Request/Gpr14Success,
  Gpr15Request/Gpr15Success, Gpr16Request/Gpr16Success and ErrorResponse with
  Zod 4. Assert unknown fields, raw private fields, visibility overrides,
  invalid date order, zero comp floor, empty pack and malformed source fail.
- Assert exactly four unique method/path pairs, one operation row per
  GPR-13 through GPR-16 interaction, and every operation ID appears in the
  contract, error, authorization, idempotency, rate and observability registries.
- Assert all failures serialize the four-field BE00 ApiError and successes omit
  evidence bytes, raw comparable values, private document URLs, party identity,
  hidden credit use and insurer transmission.

### Authorization and privacy tests

- For each operation test correct owner, wrong owner, holder, possessor,
  appraiser with/without mandate, producer with eligible/ineligible source,
  reviewer, anonymous, revoked party, expired session and forged context.
- Assert evaluated non-owner/mandate failure is 403, absent/revoked/concealed
  target is 404, unauthenticated is 401, and private appraisal access maps to
  APPRAISAL_PRIVATE without value/existence leakage.
- Assert CORS gear-api rejects unallowlisted origins, wildcard credentials and
  unregistered methods; OPTIONS exposes only registered POST headers.
- Assert public/downstream projections omit appraiser identity, values where
  policy forbids them, raw comps, evidence, documents, owner contact,
  credit/session identity and hidden link details.

### Persistence, RLS and idempotency tests

- Migration tests verify platform_private schema, all field SQL types and
  nullability, enum/check constraints, cross-shard FKs, digest lengths, partial
  uniqueness, indexes, forced RLS, no browser grants and named RPC grants.
- Replay each exact command after success, response timeout and worker crash;
  assert byte-equivalent result and one estimate/appraisal/pack-job/link/event.
  Reuse a key with changed payload and assert IDEMPOTENCY_MISMATCH.
- Run concurrent estimate requests, appraisals, packs and links with equal and
  stale versions; assert one CAS winner, typed 409 loser, no duplicate current
  state and no orphan object/job/event.
- Attempt direct read/update/delete as anon, authenticated, owner, appraiser,
  producer, reviewer, queue and maintenance roles; assert purpose/RLS grants
  and append-only retention rules.

### Domain and seam tests

- GPR-13 tests exact snapshot normalization, comp count/recency floor, stale
  modification invalidation, caveats, withheld state and no fabricated range.
- GPR-14 tests mandate scope, step-up, document readiness/digest, effective/
  expiry date, immutable expiry and estimate/appraisal non-substitution.
- GPR-15 tests deterministic item/evidence ordering, duplicate IDs, explicit
  gaps, inaccessible appraisal, worker lease/CAS, manifest/checksum, object
  readiness, resumable retry and transmitsToInsurer false.
- GPR-16 tests eligible credit/session source, producer relation, source
  version race, hidden/disputed suppression, exact visibility inheritance and
  correction refusal.
- Contract-test every external seam's exact request/response, timeout, retry
  count/backoff, circuit-open behavior, ambiguous result and same-key replay.

### Events, recovery and accessibility-support tests

- Validate all ten IA event identifiers and strict payloads, event ID/aggregate
  version dedupe, outbox lease expiry, retry exhaustion and consumer replay.
- Property-test estimate invariants: issued range has low/high/sample/recency,
  high is not below low, stale input cannot issue, and modification creates
  review/invalidated state.
- Property-test pack determinism: same normalized selection yields same digest,
  every omission becomes an explicit gap, no succeeded pack lacks manifest and
  ready object, and no job transmits to an insurer.
- Property-test credit links: visibility equals source visibility, hidden source
  has no public link, disputed source is never active/public and local request
  cannot change source state.
- Inject DB, 23a, 23c, comparable, BE00 object/job and Shard 07 failures at
  every boundary; assert honest typed errors, no partial effects and alertable
  metrics.
- API fixtures state sample/recency/caveats, private appraisal disclosure,
  explicit pack gaps/retry actions, inherited visibility and does-not-prove
  title/originality/coverage notices without relying on color.

## Deepening Passes

| Pass | Result | Evidence |
|---|---|---|
| 1. Source coverage | PASS | GPR-13 through GPR-16, all 18 canonical model names and all 10 IA event types are retained in the IA Source Map. |
| 2. Contract exactness | PASS | Strict Zod 4 schemas, path/header equality, cross-field expiry validation and BE00 ApiError envelope are explicit. |
| 3. Endpoint reconciliation | PASS | Four operation IDs map one-to-one to the approved 23d split; no companion/BE00 route duplication and insurer submission is explicitly absent. |
| 4. Authorization | PASS | Owner, appraiser mandate, producer/source eligibility, private appraisal, per-item pack standing and 403-vs-404 are keyed per operation. |
| 5. Persistence | PASS | Four owned models list SQL types, nullability, constraints, FK targets, indexes and forced-RLS/grants. |
| 6. Concurrency/idempotency | PASS | BE00 reservations, request hashes, target locks, CAS versions, job leases, atomic rollback and replay are defined per operation. |
| 7. External failure | PASS | Every seam has exact request/response, timeout, retry/backoff and circuit behavior; ambiguous values/jobs/sources fail closed. |
| 8. Security/observability | PASS | CORS gear-api, middleware order, private-value/document/credit redaction, audit, metrics and traces are explicit. |
| 9. Adversarial review | PASS | Sparse comps, stale modifications, appraisal leakage, pack omission/transmission, hidden credit and source outage are fail-closed. |
| 10. Implementer replay | PASS | Two independent implementers can derive the same routes, state machines, schemas, tables, worker, events and tests without unstated choices. |

## Ambiguity Gate

PASS. Micro-level review fixed normalized snapshot/digest fields, comp floor and
recency semantics, money/currency types, appraisal date ordering, pack selection
and gap behavior, private object scope, credit source discrimination, inherited
visibility, error details and response disclosure. Macro-level review fixed the
23d boundary: valuation_estimate, appraisal_record, insurance_pack and
gear_credit_link are owned here; 23a owns identity/claims/chain, 23c owns
service/component facts, Shard 07 owns credit status/visibility and BE00 owns
objects/jobs. A two-implementer replay produced the same four routes and
atomic/async sequencing. Devil's advocate cases (sparse/stale comps, service
mutation after estimate, unmandated appraiser, expired appraisal, inaccessible
pack selection, worker crash, ambiguous object upload, hidden/disputed credit,
source outage and post-commit timeout) all have typed recoverable outcomes.
Decision lock: estimates never fabricate, appraisals remain private/distinct,
packs never transmit or promise coverage, links never widen credit visibility,
and missing history never proves anything.

## Open Questions

None

## Dependency References

- Depends on: BE00 for ApiError, command metadata, idempotency, objects, jobs,
  audit, outbox and event leases; Shard 01 for party/acting context, owner
  standing and appraiser mandate; 23a for identity/configuration/claim/chain
  snapshots; 23c for service/component revision; Shard 07 for credit/session
  eligibility/status/visibility; comparable adapters for governed evidence.
- Publishes to: 23a bounded chain/provenance projections, 23c invalidation
  consumer, owner evidence/pack projections, and bounded Shards 24, 25 and 26
  through gear.valuation.changed.v1, gear.appraisal.changed.v1,
  gear.insurance-pack.changed.v1 and gear.credit-link.changed.v1.
- Consumes: gear.identity.changed.v1, gear.claim.changed.v1,
  gear.transfer.changed.v1, gear.theft-flag.changed.v1,
  gear.sighting.changed.v1, gear.service.changed.v1 and bounded Shard 07
  credit lifecycle inputs. Producer-owned status remains authoritative.
- Direction: 23d never reads companion stores directly; named RPCs/events cross
  each boundary, producers retain canonical ownership, and consumers cannot
  strengthen provenance, permission, confidence, visibility or terminal state.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Added BE23D-GPR13 valuation, BE23D-GPR14 appraisal, BE23D-GPR15 insurance pack and BE23D-GPR16 credit-link commands with strict contracts, persistence, privacy, worker recovery and event coverage | /write-be-spec |
| 2026-08-28 | Locked comp-floor withholding, owner-private appraisal, deterministic no-insurer pack generation and Shard 07 visibility inheritance | /write-be-spec-deepen |
