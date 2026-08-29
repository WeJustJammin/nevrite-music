# BE-22a — Release Build, Readiness and Distribution Footprint

Status: Complete

This backend specification turns the Shard 22 IA build, validation, asset, readiness, footprint, date-plan, and identifier interactions into seven Hono command endpoints. It owns release composition and delivery-gate evidence; partner message dispatch, lifecycle actions, UGC, catalogue export, enrichment, and label/distributor authority remain in companion specifications.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Classification | Multi-domain split, build/readiness/footprint subdomain | Approved Shard 22 split assigns DST-01 through DST-07 to 22a. |
| Backend surface | Authenticated Hono REST commands backed by Supabase PostgreSQL RPCs, Storage object metadata, and leased jobs | IA Contracts lines 112-128; deep dive Implementation Envelope lines 96-103; BE00 Middleware lines 253-297. |
| Canonical owner | 22a owns release composition, readiness evidence, footprint/date plans, asset analysis, and identifiers | IA Data Models lines 153-179; Typed Field Registry lines 181-216. |
| Explicit non-ownership | Partner messages/acks, lifecycle actions, UGC, exports, enrichment, label copy, and distributor authority | IA interactions DST-08 through DST-22, lines 88-102. |
| Split validity | PASS: source interactions have one owner and no conflicting write boundary | IA interaction table lines 79-102 and approved index split. |

## Referenced Material Inventory

| Source file | Section and lines | Material consumed |
|---|---|---|
| .memory/wiki/specs/ia/22-release-distribution.md | Overview lines 7-20 | Distribution domain and source-of-truth boundary. |
| .memory/wiki/specs/ia/22-release-distribution.md | Acceptance Criteria lines 52-75 | User-visible completion and failure requirements. |
| .memory/wiki/specs/ia/22-release-distribution.md | Interactions lines 77-87 | DST-01 through DST-07 preconditions, behavior, completion, failure and recovery. |
| .memory/wiki/specs/ia/22-release-distribution.md | Global Interaction Rules lines 104-110 | Snapshot, acknowledgement, notification and external-success rules. |
| .memory/wiki/specs/ia/22-release-distribution.md | Contracts lines 112-128 | Closed enums and domain error vocabulary. |
| .memory/wiki/specs/ia/22-release-distribution.md | Data Models lines 153-179 | Canonical model relationships and invariants. |
| .memory/wiki/specs/ia/22-release-distribution.md | Typed Field Registry lines 181-216 | Required core fields and deterministic typing. |
| .memory/wiki/specs/ia/22-release-distribution.md | Access Control lines 218-240 | Owner, admin, producer, operator, and system boundaries. |
| .memory/wiki/specs/ia/22-release-distribution.md | Event Schemas lines 252-272 | Safe payloads, consumers, and excluded data. |
| .memory/wiki/specs/ia/22-release-distribution.md | Dependency References lines 346-359 | BE00 and Shards 01, 06, 07, 09, 10, 20, 37-39. |
| .memory/wiki/specs/ia/deep-dives/22-release-distribution.md | Readiness Algorithm lines 18-27 | Machine gate, social chase, stale handoff and override. |
| .memory/wiki/specs/ia/deep-dives/22-release-distribution.md | Partner Knowledge Algorithm lines 28-38 | Immutable profile/spec version inputs. |
| .memory/wiki/specs/ia/deep-dives/22-release-distribution.md | Store/Date Algorithm lines 49-59 | Per-destination footprint and no automatic date movement. |
| .memory/wiki/specs/ia/deep-dives/22-release-distribution.md | Abuse/Recovery lines 71-84 | Idempotency, leases and failure recovery. |
| .memory/wiki/specs/ia/deep-dives/22-release-distribution.md | Cross-Shard Contracts lines 85-95 | Direction and authority of identity, rights, audio and infrastructure seams. |
| .memory/wiki/specs/be/00-infrastructure.md | Zod Contracts lines 112-200 | BE00 wire conventions, error envelope and command metadata. |
| .memory/wiki/specs/be/00-infrastructure.md | Database Schema lines 202-251 | Private schema, RPC-only access, RLS, grants, jobs, objects, outbox and audit. |
| .memory/wiki/specs/be/00-infrastructure.md | Middleware lines 253-297 | Middleware order, capability checks and CORS. |
| .memory/wiki/specs/be/00-infrastructure.md | Events lines 357-415 | Outbox envelope, leasing and consumer recovery. |
| .memory/wiki/specs/be/00-infrastructure.md | Error/Observability lines 416-461 | Boundary mapping, compensation, audit, metrics and traces. |
| .memory/wiki/specs/be/00-infrastructure.md | Testing Strategy lines 476-505 | Contract, RLS, provider and recovery obligations. |

## IA Source Map

### Assigned interactions

| IA interaction | Source trace | Backend operation | Canonical completion |
|---|---|---|---|
| DST-01 Owner composes release | IA line 81 | BE22A-DST01 | Versioned draft membership with add-time eligibility snapshot. |
| DST-02 System validates metadata | IA line 82 | BE22A-DST02 | Destination-scoped blocking/advisory findings. |
| DST-03 Producer supplies assets | IA line 83 | BE22A-DST03 | Immutable source analysis and per-target rendition state. |
| DST-04 Owner opens readiness gate | IA line 84 | BE22A-DST04 | Machine/social/exhausted/ready/overridden decision. |
| DST-05 Owner selects destinations/territories | IA line 85 | BE22A-DST05 | Exact recording × territory × model × destination footprint. |
| DST-06 Owner chooses release dates | IA line 86 | BE22A-DST06 | User-selected, territory-scoped date plan with costed forfeits. |
| DST-07 System assigns identifiers | IA line 87 | BE22A-DST07 | Immutable ISRC/UPC records independent of delivery success. |

### Canonical Data Models

Literal names from IA Data Models lines 157-179:

release, release_version, release_recording_membership, release_label_copy, label_distribution_mandate, distributor_authority_snapshot, partner_knowledge_version, release_enrichment, release_descriptor_correction, release_finding, delivery_readiness_item, destination_selection, release_date_plan, delivery_snapshot, delivery_message, delivery_step, partner_ack, store_status, store_artist_link, release_asset_analysis, asset_rendition, release_change_plan, catalogue_lifecycle_command, fingerprint_registration, ugc_whitelist, ugc_claim_case, recording_identifier, release_identifier, catalogue_export_job, import_manifest.

22a owns release, release_version, release_recording_membership, release_finding, delivery_readiness_item, destination_selection, release_date_plan, release_asset_analysis, asset_rendition, recording_identifier, and release_identifier. Other names are consumed or owned by companion specs and are not rewritten here.

### Event Schemas

Literal names from IA Event Schemas lines 256-270:

distribution.release.changed.v1, distribution.readiness.changed.v1, distribution.footprint.changed.v1, distribution.date-plan.changed.v1, distribution.message.changed.v1, distribution.destination-status.changed.v1, distribution.catalogue-lifecycle.changed.v1, distribution.ugc-registration.changed.v1, distribution.identifier.changed.v1, release.enrichment.changed.v1, release.enrichment.delivered.v1, release.descriptor-correction.changed.v1, distribution.partner-capability.changed.v1, distribution.label-copy.changed.v1, distribution.export.changed.v1.

22a emits release, readiness, footprint, date-plan, and identifier events. Payloads never contain media bytes, partner secrets, private rights evidence, exact dates before announcement, claim detail, or export URLs.

## Endpoint Reconciliation

| IA interaction | HTTP operation | Command transaction | Success event |
|---|---|---|---|
| DST-01 | POST /api/v1/releases/:releaseId/recordings | Reserve idempotency, authorize edit, resolve recording or licensed inclusion, insert membership and expiry obligation, audit/outbox atomically. | distribution.release.changed.v1 |
| DST-02 | POST /api/v1/releases/:releaseId/validations | Pin canonical version and immutable partner knowledge per destination, evaluate rule pack, persist findings. | distribution.readiness.changed.v1 |
| DST-03 | POST /api/v1/releases/:releaseId/assets/analyze | Verify immutable object/spec, create analysis job, persist target state and renditions only after evidence. | distribution.readiness.changed.v1 |
| DST-04 | POST /api/v1/releases/:releaseId/readiness/evaluate | Re-resolve machine facts, rights, consent, conflicts, profiles, assets, links and identifiers; reject stale handoff. | distribution.readiness.changed.v1 |
| DST-05 | POST /api/v1/releases/:releaseId/footprint | Derive destination/territory/model cells from rights and profile capabilities; unresolved territory is not worldwide. | distribution.footprint.changed.v1 |
| DST-06 | POST /api/v1/releases/:releaseId/date-plan | Compute earliest windows and forfeits, validate chosen dates, preserve user choice and announced date. | distribution.date-plan.changed.v1 |
| DST-07 | POST /api/v1/releases/:releaseId/identifiers/assign | Atomically lookup/reuse/assign recording ISRCs and release UPC policy; conflict blocks without merge. | distribution.identifier.changed.v1 |

## API Endpoints

### Umbrella Feature Trace

The IA Shard 22 feature bullets are represented across 22a–22d: 12.01 Release Builder & Delivery Readiness; 12.02 DDEX Delivery Messaging; 12.03 DSP Store & Territory Management; 12.04 Release Scheduling & Windows; 12.05 Catalog Lifecycle After Release; 12.06 Content ID & UGC Claiming; 12.07 Identifier Assignment at Delivery; 12.08 Catalog Migration & Exit.

### Authoritative Route Registry

This is the only route registry for 22a. Operation IDs are stable and are the keys used in every contract, error, authorization, idempotency, rate, observability, and test registry.

| Operation ID | Method | Path | Capability | Response |
|---|---|---|---|---|
| BE22A-DST01 | POST | /api/v1/releases/:releaseId/recordings | release.edit | Dst01Success |
| BE22A-DST02 | POST | /api/v1/releases/:releaseId/validations | release.validate | Dst02Success |
| BE22A-DST03 | POST | /api/v1/releases/:releaseId/assets/analyze | release.asset_write | Dst03Success |
| BE22A-DST04 | POST | /api/v1/releases/:releaseId/readiness/evaluate | release.readiness | Dst04Success |
| BE22A-DST05 | POST | /api/v1/releases/:releaseId/footprint | release.footprint | Dst05Success |
| BE22A-DST06 | POST | /api/v1/releases/:releaseId/date-plan | release.schedule | Dst06Success |
| BE22A-DST07 | POST | /api/v1/releases/:releaseId/identifiers/assign | release.identifier_assign | Dst07Success |

### Request/Response Contracts (Zod 4)

Every non-2xx response is ErrorResponse containing the BE00/global ApiError { code, message, requestId, details }. Unknown keys are rejected; route parameters are parsed as UUIDs before the body.

~~~ts
import { z } from "zod";
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const Uuid = z.uuid();
const Version = z.string().regex(/^[1-9]\d*$/);
const IdempotencyKey = z.string().min(1).max(128);
const DateTime = z.iso.datetime({ offset: true });
const DateOnly = z.iso.date();
const ApiError = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: Uuid,
  details: BE00ErrorDetails,
}).strict();
const ErrorResponse = z.object({ error: ApiError }).strict();
const Finding = z.object({
  findingId: Uuid,
  destinationId: Uuid,
  severity: z.enum(["blocking", "advisory"]),
  state: z.enum(["open", "resolved"]),
  field: z.string().min(1).max(128),
  remedy: z.string().min(1).max(1000),
}).strict();

const Dst01Request = z.object({
  releaseVersionId: Uuid, recordingId: Uuid.optional(), licensedInclusionId: Uuid.optional(),
  order: z.number().int().min(1), volume: z.number().int().min(1),
  focus: z.enum(["primary", "bonus", "hidden"]), gapless: z.boolean(),
  licenceExpiryAt: DateTime.optional(), idempotencyKey: IdempotencyKey,
}).strict().refine(
  v => Number(Boolean(v.recordingId)) + Number(Boolean(v.licensedInclusionId)) === 1,
  { path: ["recordingId"], message: "exactly one recordingId or licensedInclusionId is required" },
);
const Dst01Success = z.object({
  releaseVersionId: Uuid, membershipId: Uuid,
  state: z.enum(["draft", "gating"]), eligibilitySnapshotHash: z.string().length(64),
  version: Version,
}).strict();

const Dst02Request = z.object({
  releaseVersionId: Uuid, destinationIds: z.array(Uuid).min(1).max(100),
  snapshotVersion: Version, strict: z.boolean(), idempotencyKey: IdempotencyKey,
}).strict();
const Dst02Success = z.object({
  validationRunId: Uuid, state: z.enum(["passed", "advisory", "blocked"]),
  findings: z.array(Finding), snapshotVersion: Version, version: Version,
}).strict();

const Dst03Request = z.object({
  releaseVersionId: Uuid, releaseRecordingMembershipId: Uuid, sourceObjectId: Uuid,
  targetDestinationIds: z.array(Uuid).min(1).max(100),
  assetSpecVersionByDestination: z.record(Uuid, z.string().min(1).max(128)),
  idempotencyKey: IdempotencyKey,
}).strict();
const Dst03Success = z.object({
  analysisId: Uuid, state: z.enum(["queued", "running", "complete", "unverified", "blocked"]),
  targetResults: z.array(z.object({
    destinationId: Uuid,
    analysisState: z.enum(["conformant", "unverified", "blocked"]),
    renditionId: Uuid.optional(), findingIds: z.array(Uuid),
  }).strict()),
  jobId: Uuid, version: Version,
}).strict();

const Dst04Request = z.object({
  releaseVersionId: Uuid, targetSelectionRevision: Version,
  requestedOverride: z.boolean(), overrideReason: z.string().min(1).max(1000).optional(),
  idempotencyKey: IdempotencyKey,
}).strict().refine(v => !v.requestedOverride || Boolean(v.overrideReason),
  { path: ["overrideReason"], message: "overrideReason is required for an override" });
const Dst04Success = z.object({
  readinessId: Uuid,
  state: z.enum(["machine_blocked", "social_blocked", "exhausted", "ready", "overridden"]),
  machineBlockers: z.array(z.object({
    code: z.string().min(1), targetId: Uuid.optional(), actorPartyId: Uuid.optional(),
    remedy: z.string().min(1),
  }).strict()),
  socialChase: z.array(z.object({
    actorPartyId: Uuid, action: z.string().min(1), dueAt: DateTime.optional(),
  }).strict()),
  expiresAt: DateTime, version: Version,
}).strict();

const FootprintDestination = z.object({
  destinationId: Uuid,
  territoryCodes: z.array(z.string().regex(/^[A-Z]{2,3}$/)).min(1),
  commercialModel: z.string().min(1).max(64),
}).strict();
const Dst05Request = z.object({
  releaseVersionId: Uuid, destinations: z.array(FootprintDestination).min(1).max(100),
  rightsSnapshotVersion: Version, idempotencyKey: IdempotencyKey,
}).strict();
const Dst05Success = z.object({
  selectionRevision: Version,
  cells: z.array(z.object({
    destinationId: Uuid, territoryCode: z.string().regex(/^[A-Z]{2,3}$/),
    commercialModel: z.string().min(1),
    state: z.enum(["available", "blocked", "unknown"]),
    rightsBasis: z.string().min(1), reasonCode: z.string().optional(),
  }).strict()),
  version: Version,
}).strict();

const DateChoice = z.object({
  destinationId: Uuid, territoryCode: z.string().regex(/^[A-Z]{2,3}$/),
  deliveryDate: DateOnly, releaseDate: DateOnly, liveDate: DateOnly,
  timeZone: z.string().min(1).max(64), selected: z.boolean(),
}).strict();
const Dst06Request = z.object({
  releaseVersionId: Uuid, footprintRevision: Version,
  choices: z.array(DateChoice).min(1).max(100), idempotencyKey: IdempotencyKey,
}).strict();
const Dst06Success = z.object({
  datePlanId: Uuid, state: z.enum(["draft", "announced", "blocked"]),
  choices: z.array(DateChoice),
  forfeits: z.array(z.object({
    destinationId: Uuid, territoryCode: z.string().regex(/^[A-Z]{2,3}$/),
    window: z.string().min(1), cost: z.string().min(1),
  }).strict()),
  version: Version,
}).strict();

const IdentifierAssignment = z.object({
  recordingId: Uuid,
  suppliedIsrc: z.string().regex(/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/).optional(),
}).strict();
const Dst07Request = z.object({
  releaseVersionId: Uuid, registrantPartyId: Uuid,
  assignments: z.array(IdentifierAssignment).min(1).max(1000),
  upcPolicy: z.enum(["assign_if_missing", "reuse_existing", "new_for_reentry"]),
  allocationBatchId: Uuid.optional(), idempotencyKey: IdempotencyKey,
}).strict();
const Dst07Success = z.object({
  identifierSetId: Uuid,
  identifiers: z.array(z.object({
    recordingId: Uuid,
    isrc: z.string().regex(/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/),
    upc: z.string().min(8).max(20).optional(),
    provenance: z.enum(["platform", "artist", "third_party"]),
    state: z.enum(["assigned", "asserted", "conflict"]),
  }).strict()),
  version: Version,
}).strict();
~~~

### Contract Registry

| Operation ID | Request body | Success body | Canonical write and validation |
|---|---|---|---|
| BE22A-DST01 | Dst01Request | Dst01Success | Exactly one recording or licensed inclusion; membership and expiry obligation are one transaction. |
| BE22A-DST02 | Dst02Request | Dst02Success | Destination IDs resolve to immutable knowledge versions; findings are additive and scoped. |
| BE22A-DST03 | Dst03Request | Dst03Success | Object checksum and spec version are pinned; rendition never changes source bytes. |
| BE22A-DST04 | Dst04Request | Dst04Success | Machine gate precedes social chase; override is disclosed and does not alter source facts. |
| BE22A-DST05 | Dst05Request | Dst05Success | No unresolved territory becomes worldwide; every cell carries basis and state. |
| BE22A-DST06 | Dst06Request | Dst06Success | Chosen dates are validated against windows; system computes forfeits but never moves dates. |
| BE22A-DST07 | Dst07Request | Dst07Success | ISRC is recording-idempotent; UPC is release-version policy; conflict never merges identity. |

### Error Registry

Every row returns JSON ErrorResponse with BE00 ApiError { code, message, requestId, details }; details contain only safe field, target, version, retry, and remediation data.

| Operation ID | 400 / 401 | 403 vs 404 | 409 | 422 domain errors | 429 / 5xx recovery |
|---|---|---|---|---|---|
| BE22A-DST01 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without release.edit; NOT_FOUND hides inaccessible release/version | CONFLICT on version CAS | RECORDING_INELIGIBLE, RIGHTS_UNRESOLVED | RATE_LIMITED; dependency failure writes no membership. |
| BE22A-DST02 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without release.validate; NOT_FOUND hides release/destination | CONFLICT if pinned snapshot changed | PARTNER_RULE_BLOCKED, PROFILE_UNCERTIFIED, DELIVERY_SNAPSHOT_STALE | RATE_LIMITED; prior findings remain unchanged. |
| BE22A-DST03 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without asset standing; NOT_FOUND hides object/release | CONFLICT on source/spec revision | ASSET_UNANALYSABLE, PARTNER_RULE_BLOCKED | RATE_LIMITED; lease recovery never false-passes. |
| BE22A-DST04 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without readiness capability; NOT_FOUND hides release/target | CONFLICT on target revision | RIGHTS_UNRESOLVED, RELEASE_CONSENT_REQUIRED, THIRD_PARTY_CLEARANCE_REQUIRED, ARTIST_LINK_REQUIRED, PROFILE_UNCERTIFIED | RATE_LIMITED; stale result is discarded and rerun. |
| BE22A-DST05 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without footprint capability; NOT_FOUND hides release/destination | CONFLICT on rights/profile revision | TERRITORY_UNKNOWN, RIGHTS_UNRESOLVED, PARTNER_RULE_BLOCKED | RATE_LIMITED; unresolved cells remain unknown. |
| BE22A-DST06 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without schedule capability; NOT_FOUND hides release/footprint | CONFLICT on date revision | TERRITORY_UNKNOWN, DATE_WINDOW_BLOCKED | RATE_LIMITED; no partial date move. |
| BE22A-DST07 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without identifier capability; NOT_FOUND hides release/recording | CONFLICT on allocation batch/version | IDENTIFIER_CONFLICT, RIGHTS_UNRESOLVED | RATE_LIMITED; allocator timeout reconciles by lookup. |

### Authorization and Middleware Registry

Each operation runs request ID/trace, authenticated session, acting-party capability, CORS policy, rate limit, Zod validation, BE00 idempotency, RPC/job, audit and outbox in that order. CORS is explicit per row and never inferred from authentication.

| Operation ID | Roles and ownership | 403 rule | 404 rule | Middleware and CORS |
|---|---|---|---|---|
| BE22A-DST01 | Owner/admin with release.edit; contributor can submit a change request only. | FORBIDDEN when capability or current owner mandate is absent. | NOT_FOUND for invisible release/version/recording/inclusion. | auth → acting-party → CORS distribution-api (allowlisted origins, no wildcard credentials) → rate → Zod → idempotency → RPC. |
| BE22A-DST02 | Owner/admin release.validate or assigned distribution operator. | FORBIDDEN for unassigned operator or missing capability. | NOT_FOUND hides release/destination knowledge. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → RPC. |
| BE22A-DST03 | Owner/admin or Producer with release.asset_write and object standing. | FORBIDDEN for an actor who cannot map object to release. | NOT_FOUND hides release/membership/object/destination. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → job RPC. |
| BE22A-DST04 | Owner/admin release.readiness; leased system worker may resume. | FORBIDDEN for worker without lease or user without capability. | NOT_FOUND hides release/target. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → RPC. |
| BE22A-DST05 | Owner/admin release.footprint; assigned rights worker only. | FORBIDDEN for unassigned worker or non-owner. | NOT_FOUND hides release/destination/territory. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → RPC. |
| BE22A-DST06 | Owner/admin release.schedule; no worker may choose or move date. | FORBIDDEN for contributor or worker date selection. | NOT_FOUND hides release/footprint. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → RPC. |
| BE22A-DST07 | Owner/admin or assigned identifier operator; registrant must match authority. | FORBIDDEN for mismatched registrant or assignment. | NOT_FOUND hides release/recording. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → RPC. |

### Idempotency and Concurrency Registry

| Operation ID | Key and replay | Version/CAS | Failure recovery |
|---|---|---|---|
| BE22A-DST01 | Actor/operation/request-hash key; success or registered 4xx replays 30 days. | Lock release_version.version; unique membership recording and order. | Roll back membership and obligation together. |
| BE22A-DST02 | Key binds snapshot, destination set, strict flag. | Findings append under validation run; canonical value never overwritten. | Rerun same pinned inputs; stale run cannot authorize dispatch. |
| BE22A-DST03 | Key binds source checksum, membership, targets and spec map. | Job lease/version CAS; rendition checksum immutable. | Expired lease returns queued; third failure is unverified. |
| BE22A-DST04 | Key binds target revision and override disclosure. | Readiness item CAS; expiration invalidates old result. | Drift marks stale and reruns machine prerequisites. |
| BE22A-DST05 | Key binds rights snapshot and normalized cells. | Unique release/destination/territory/model cell; per-cell CAS. | Dependency outage marks only new unresolved cells unknown. |
| BE22A-DST06 | Key binds footprint revision and complete choices. | Date-plan CAS on footprint; announced date append-only. | Failed write leaves prior plan intact. |
| BE22A-DST07 | Key binds assignments and UPC policy. | Unique recording/kind; allocation batch CAS; identifiers never roll back. | Timeout uses lookup; conflict routes to review. |

### Rate, CORS and SLO Registry

| Operation ID | Rate limit | CORS policy | SLO |
|---|---|---|---|
| BE22A-DST01 | 30/minute per actor and release, burst 5 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 750 ms. |
| BE22A-DST02 | 20/minute per actor and release, burst 4 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms for 100 destinations. |
| BE22A-DST03 | 10/minute per actor and release, burst 2 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 1,000 ms enqueue; job ≤ 5 minutes. |
| BE22A-DST04 | 10/minute per actor and release, burst 2 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms. |
| BE22A-DST05 | 10/minute per actor and release, burst 2 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 1,500 ms for 100 cells. |
| BE22A-DST06 | 10/minute per actor and release, burst 2 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 1,500 ms for 100 choices. |
| BE22A-DST07 | 5/minute per actor and release, burst 1 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms excluding reconciliation. |

### Observability Registry

| Operation ID | Audit | Metrics | Trace and redaction |
|---|---|---|---|
| BE22A-DST01 | release.recording.added with actor, version, eligibility basis, decision | distribution_release_membership_total by outcome; command latency | IDs and idempotency hash only; no audio, rights text, or PII. |
| BE22A-DST02 | release.validation.completed with profile versions and finding counts | distribution_validation_total by state; finding total by severity/destination | Snapshot/profile hashes; rule payload and secrets redacted. |
| BE22A-DST03 | release.asset.analysis.requested and terminal decision | asset_analysis_total by state; attempt total | Object checksum/spec/job only; no bytes or signed URLs. |
| BE22A-DST04 | release.readiness.evaluated with state/blocker classes/override | readiness_total by state; readiness_stale_total | Target/revision/counts; contact details omitted. |
| BE22A-DST05 | release.footprint.derived with cell counts | footprint_cells_total by state; unknown_territory_total | Destination/territory/basis class; private rights evidence omitted. |
| BE22A-DST06 | release.date_plan.changed with revision/forfeits | date_plan_total by state; date_forfeit_total | Exact dates only after announcement; pre-announcement dates redacted. |
| BE22A-DST07 | release.identifier.assigned or conflict | identifier_total by kind/state; conflict_total | Hashed identifier values/allocation batch; raw rights evidence omitted. |

## Database Schema

All tables below live in non-exposed platform_private, have RLS enabled and forced, and are reachable only through named security-invoker RPCs/views. anon and browser direct table grants are denied. owner_id references identity.party(id); the identity boundary resolves an authenticated user to a party. A service credential is not an authorization decision.

| Table/model | All persistence fields with SQL type, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.releases / release | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); state release_state NOT NULL CHECK IN draft,gating,ready,scheduled,delivering,partial,live,suspended,withdrawn,archived; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now() CHECK >=created_at; release_type text NOT NULL CHECK length>0; current_version_id uuid NULL FK platform_private.release_versions(id); announced_at timestamptz NULL; unique id,owner_id | PK; owner_id,updated_at DESC,id; owner_id,state,updated_at DESC; unique current_version_id where not null | Forced RLS owner predicate in named RPC; owner/admin capability may read/write; operator receives assigned projection; worker CAS update only; no browser table grant. |
| platform_private.release_versions / release_version | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); release_id uuid NOT NULL FK platform_private.releases(id); state release_state NOT NULL CHECK IN draft,gating,ready,scheduled,delivering,partial,live,suspended,withdrawn,archived; version bigint NOT NULL CHECK >0; version_number bigint NOT NULL CHECK >0; canonical_snapshot_hash bytea NOT NULL CHECK octet_length=32; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now() CHECK >=created_at; published_at timestamptz NULL; unique release_id,version_number | PK; release_id,version_number DESC; owner_id,updated_at DESC; state,updated_at; unique release_id where published_at is not null and state not in withdrawn,archived | Forced RLS owner/admin read; append/version RPC only; published rows immutable; worker state CAS; no browser grant. |
| platform_private.release_recording_memberships / release_recording_membership | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); release_version_id uuid NOT NULL FK platform_private.release_versions(id); recording_id uuid NULL FK catalog.recordings(id); licensed_inclusion_id uuid NULL FK rights.licensed_inclusions(id); order_no integer NOT NULL CHECK >0; volume integer NOT NULL CHECK >0; focus text NOT NULL CHECK IN primary,bonus,hidden; gapless boolean NOT NULL DEFAULT false; origin_type text NOT NULL CHECK IN owned,licensed_inclusion; eligibility_snapshot_hash bytea NOT NULL CHECK octet_length=32; licence_expiry_at timestamptz NULL; state membership_state NOT NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK exactly one of recording_id and licensed_inclusion_id; unique release_version_id,order_no; unique release_version_id,recording_id where recording_id is not null | PK; release_version_id,order_no; recording_id,licence_expiry_at; licensed_inclusion_id | Forced RLS through release owner; insert requires release.edit; no app UPDATE/DELETE after delivery; Shard 20 FK is read-only; expiry worker may append state. |
| platform_private.release_findings / release_finding | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); release_version_id uuid NOT NULL FK platform_private.release_versions(id); destination_id uuid NOT NULL FK distribution.destinations(id); field text NOT NULL CHECK length>0; severity finding_severity NOT NULL CHECK IN blocking,advisory; state finding_state NOT NULL CHECK IN open,resolved; evidence jsonb NOT NULL; example text NOT NULL; remedy text NOT NULL; source_profile_version text NOT NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique release_version_id,destination_id,field,source_profile_version | PK; release_version_id,destination_id,state,severity; destination_id,state,updated_at; release_version_id,field | Forced RLS owner read; append-only finding history; resolution through validation RPC; evidence schema excludes private rights detail; no browser grant. |
| platform_private.delivery_readiness_items / delivery_readiness_item | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); release_version_id uuid NOT NULL FK platform_private.release_versions(id); target_kind text NOT NULL; target_id uuid NOT NULL; source_entity text NOT NULL; actor_party_id uuid NULL FK identity.party(id); state readiness_state NOT NULL CHECK IN machine_blocked,social_blocked,exhausted,ready,overridden; exhaustion_reason text NULL; override_reason text NULL; evaluated_revision bigint NOT NULL CHECK >0; expires_at timestamptz NOT NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK state <> overridden OR override_reason IS NOT NULL | PK; unique release_version_id,target_kind,target_id; state,expires_at; release_version_id,state; actor_party_id,state | Forced RLS owner; worker CAS only; override requires owner Full capability and audit; authenticated receives bounded projection. |
| platform_private.destination_selections / destination_selection | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); release_version_id uuid NOT NULL FK platform_private.release_versions(id); destination_id uuid NOT NULL FK distribution.destinations(id); territory_code text NOT NULL CHECK territory_code ~ ^[A-Z]{2,3}$; commercial_model text NOT NULL CHECK length>0; rights_basis text NOT NULL; state footprint_cell_state NOT NULL CHECK IN available,blocked,unknown; reason_code text NULL; cost jsonb NOT NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique release_version_id,destination_id,territory_code,commercial_model | PK; unique cell key; release_version_id,state; destination_id,territory_code,state; release_version_id,destination_id | Forced RLS owner; rights/profile RPC only; unknown cells never client-converted; worker lease can update state; no direct grant. |
| platform_private.release_date_plans / release_date_plan | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); release_version_id uuid NOT NULL FK platform_private.release_versions(id); footprint_revision bigint NOT NULL CHECK >0; destination_id uuid NOT NULL FK distribution.destinations(id); territory_code text NOT NULL CHECK territory_code ~ ^[A-Z]{2,3}$; delivery_date date NOT NULL; release_date date NOT NULL; live_date date NOT NULL; time_zone text NOT NULL; forfeited_windows jsonb NOT NULL DEFAULT []; state date_plan_state NOT NULL CHECK IN draft,announced,blocked; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); CHECK delivery_date <= release_date AND release_date <= live_date | PK; release_version_id,state,updated_at DESC; destination_id,territory_code,release_date; release_version_id,footprint_revision | Forced RLS owner; only owner/admin schedule RPC selects dates; announced rows append-only; pre-announcement dates excluded from events/logs; no worker date mutation. |
| platform_private.release_asset_analyses / release_asset_analysis | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); release_recording_membership_id uuid NOT NULL FK platform_private.release_recording_memberships(id); source_object_id uuid NOT NULL FK platform_private.object_records(id); spec_version text NOT NULL; source_checksum bytea NOT NULL CHECK octet_length=32; attempt_count integer NOT NULL DEFAULT 0 CHECK BETWEEN 0 AND 3; state asset_analysis_state NOT NULL CHECK IN queued,running,complete,unverified,blocked; metrics jsonb NOT NULL DEFAULT {}; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique release_recording_membership_id,spec_version,source_checksum | PK; unique analysis key; state,updated_at; owner_id,created_at DESC; source_object_id,spec_version | Forced RLS owner; object verifier/worker update only with lease/CAS; no media bytes in table/logs; browser sees status projection. |
| platform_private.asset_renditions / asset_rendition | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); analysis_id uuid NOT NULL FK platform_private.release_asset_analyses(id); target_destination_id uuid NOT NULL FK distribution.destinations(id); object_id uuid NOT NULL FK platform_private.object_records(id); derived_from_checksum bytea NOT NULL CHECK octet_length=32; rendition_checksum bytea NOT NULL CHECK octet_length=32; state rendition_state NOT NULL CHECK IN unverified,ready,rejected; spec_version text NOT NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique analysis_id,target_destination_id,spec_version | PK; unique rendition key; target_destination_id,state; analysis_id; rendition_checksum | Forced RLS owner; worker inserts immutable metadata; bytes separately authorized; no app UPDATE/DELETE; verifier may reject with evidence. |
| platform_private.recording_identifiers / recording_identifier | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); recording_id uuid NOT NULL FK catalog.recordings(id); kind identifier_kind NOT NULL CHECK kind=isrc; value text NOT NULL CHECK value ~ ^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$; provenance identifier_provenance NOT NULL CHECK IN platform,artist,third_party; state identifier_state NOT NULL CHECK IN assigned,asserted,conflict; collision_evidence jsonb NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique recording_id,kind; unique kind,value | PK; unique recording/kind; unique kind/value; state,updated_at; owner_id,created_at DESC | Forced RLS owner/rights capability; append conflict evidence only; Shards 06/10 receive bounded projection; no direct grant. |
| platform_private.release_identifiers / release_identifier | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); release_version_id uuid NOT NULL FK platform_private.release_versions(id); kind identifier_kind NOT NULL CHECK kind=upc; value text NOT NULL CHECK length BETWEEN 8 AND 20; provenance identifier_provenance NOT NULL; state identifier_state NOT NULL CHECK IN assigned,asserted,conflict; allocation_batch_id uuid NULL FK platform_private.identifier_allocation_batches(id); version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique release_version_id,kind; unique kind,value | PK; unique release/version/kind; unique kind/value; allocation_batch_id; state,updated_at | Forced RLS owner/identifier capability; append-only; allocator resolves timeout by lookup; no rollback after failed delivery; browser receives masked value where projection allows. |

### Shared persistence invariants

- Every command reserves BE00 platform_private.idempotency_records using actor, operation, request-hash, and idempotency key. A replay returns the stored safe status and resource reference, including registered 4xx outcomes.
- Domain rows, audit_private.audit_events, and platform_private.outbox_events commit atomically. Outbox payloads use the BE00 envelope and omit media bytes, private rights evidence, and pre-announcement dates.
- All private tables use security-invoker access paths. authenticated has no direct table grant; named RPCs repeat ownership and capability predicates. Operators and workers receive operation-specific grants only.
- No command trusts a service credential as actor authority. Hono resolves session, acting party, mandate, capability, and release ownership; RPCs repeat the checks.

## Middleware & Policies

### Hono order and security

1. Attach request ID, trace ID, route operation ID, and bounded body-size limit.
2. Apply CORS policy distribution-api: explicit allowlist, POST and OPTIONS only, no wildcard credential mode, Vary: Origin.
3. Validate session and resolve acting party, release owner, mandate, and capability.
4. Apply operation and actor/release rate limit.
5. Parse path/body with the operation Zod 4 schema; reject unknown keys and malformed UUIDs before database access.
6. Reserve BE00 idempotency; request-hash mismatch returns CONFLICT without execution.
7. Call named security-invoker RPC or job enqueue with actor context and expected version.
8. Append audit/outbox in the same transaction and return only the Success schema.

### Policy rules

| Policy | Required behavior |
|---|---|
| Release ownership | owner_id is resolved server-side; body owner fields never authorize an actor. |
| Release version | Only draft or gating versions are editable here; published/delivered versions are immutable from 22a. |
| Recording eligibility | recording_id requires its current right; licensed_inclusion_id requires valid Shard 20 inclusion. Add-time snapshot is evidence, not a delivery bypass. |
| Partner knowledge | Validation reads one immutable destination-specific partner_knowledge_version. Missing, unverified, revoked, or uncertified returns PROFILE_UNCERTIFIED. |
| Rights and territory | Worldwide is derived only from complete no-encumbrance evidence. Unknown territory stays unknown and blocks that cell. |
| Date choice | System computes windows/forfeits; owner/admin selects date; workers cannot move it. |
| Identifier collision | Conflict is quarantined and routed to rights/trust owners. No merge, overwrite, or second blind allocation. |
| PII and protected data | Logs/events contain IDs, hashes, state, safe blocker classes, and counts. They exclude audio, contacts, private rights evidence, secrets, and signed URLs. |

## Data Flow

### DST-01 composition

POST → auth/capability → idempotency → read release version → read recording right or Shard 20 inclusion → verify origin/eligibility → insert membership and expiry obligation → audit/outbox → Dst01Success. A failed add never mutates the recording aggregate.

### DST-02 validation

POST → pin release snapshot/destinations → read immutable partner knowledge and asset specs → evaluate canonical values without partner mutation → insert release_finding rows → readiness event → blockers/advisories. A profile/model gap is a platform validation failure, not an artist fault.

### DST-03 assets

POST → verify object_records state ready, checksum, purpose, and membership → enqueue job keyed by source checksum × spec version → lease worker → produce non-artistic renditions → persist target result/finding → readiness event. Failed analysis retains source and uncertainty.

### DST-04 readiness

POST → reread release/version, membership eligibility, rights, consent, conflicts, profile/rules, assets, links, identifiers and destination cells → machine gate → named social chase only after machine pass → set state/expiry → audit/outbox. A stale result cannot be used by DST-08.

### DST-05 footprint and DST-06 date plan

POST → normalize destination/territory/model cells → read rights basis and profile capability → write independent cells → compute business-day windows → validate user date choices → write date-plan revision. Unknown cells do not collapse to worldwide.

### DST-07 identifiers

POST → lock identity rows and allocation batch → accept well-formed third-party assertion as asserted → reuse/assign one ISRC per recording → apply UPC policy → reconcile timeout by lookup → persist immutable values → identifier event. 22a never deletes an identifier.

## State Machines, Concurrency and Failure Recovery

| Aggregate | States and transitions | Guard |
|---|---|---|
| release | draft → gating → ready → scheduled → delivering → partial → live; delivered states may later be suspended, withdrawn, or archived by 22c. | 22a moves draft/gating/readiness only after facts; clients never write state directly. |
| delivery_readiness_item | machine_blocked → social_blocked → exhausted; machine_blocked → ready; social_blocked → ready; eligible state → overridden only with disclosed owner Full approval. | Machine facts first; expiry/source drift returns to machine_blocked. |
| destination_selection | not_selected → available, blocked, or unknown; unknown changes only with new rights/profile revision. | Cells independent; no worldwide fallback. |
| release_asset_analysis | queued → running → complete; running → unverified after three failures; complete → blocked only from new target finding. | Lease/version CAS; source checksum/spec immutable. |
| recording_identifier | asserted → assigned after verification; asserted → conflict; assigned value terminal. | One ISRC binds to one recording; conflict never overwrites. |

| Failure | Transaction outcome | Recovery |
|---|---|---|
| Same idempotency key and request hash | Replay stored result, no new write. | Return original resource/status and request ID. |
| Idempotency hash mismatch | No domain write. | Return CONFLICT and security audit signal. |
| Version CAS loss | Roll back current command. | Reload and submit explicit new revision. |
| Rights/profile timeout | Preserve prior truth; new cell unknown or readiness stale. | Seam retry then typed dependency unavailable. |
| Asset worker crash | Lease expires; job remains queued/running. | Reclaim with attempt; third failure unverified. |
| Identifier allocation timeout | Pending, no second allocation. | Lookup by immutable allocation batch; conflict goes to review. |
| Outbox crash | Domain commit remains complete. | BE00 lease sweeper reclaims event and dispatches by event identity. |
| Unauthorized read | No existence detail. | NOT_FOUND for hidden resource and denied audit. |

## External Seams

Every seam failure maps to BE00 ApiError { code, message, requestId, details }; no seam is successful without its stated response evidence.

| Seam | Exact request | Exact response | Timeout | Retries/backoff | Circuit behavior |
|---|---|---|---:|---|---|
| BE00 admission/idempotency RPC | operationId, actorId, actingPartyId, targetId, requestHash, idempotencyKeyHash, expectedVersion | reservationId, replay, auditContext, currentVersion | 1,000 ms | 2 attempts at 100 ms and 300 ms before domain write; never retry commit ambiguity without lookup | Open 30 s after 5 failures in 60 s; fail closed with DEPENDENCY_UNAVAILABLE. |
| Supabase ObjectRecord RPC | objectId, ownerPartyId, purpose release_asset, expectedChecksum | objectId, state ready, checksum, mediaType, byteSize, retentionClass | 2,000 ms | 2 reads at 250 ms and 750 ms; no checksum retry | Open 60 s after 5 failures; target unverified. |
| Asset analysis queue | analysisId, sourceObjectId, sourceChecksum, specVersion, destinationId, jobLease | jobId, acceptedAt, state queued | 1,500 ms | 2 enqueue attempts at 200 ms and 600 ms with same key | Open 30 s after 5 failures; no queued claim unless accepted. |
| Shard 10 rights/territory RPC | releaseVersionId, recordingId, territoryCode, commercialModel, rightsSnapshotVersion | rightsBasis, state resolved/unknown/blocked, encumbrances, snapshotVersion | 1,200 ms | 1 read retry at 200 ms; no retry auth or malformed response | Open 30 s after 4 failures; cell unknown. |
| Partner knowledge registry | destinationId, releaseType, territoryCode, requiredSchema metadata-v1, requestedAt | knowledgeVersion, certification certified/unsupported/revoked, rulePackHash, assetSpecVersion, validThrough | 1,200 ms | 1 retry at 250 ms; exact immutable version required | Open 30 s after 4 failures; PROFILE_UNCERTIFIED. |
| Identifier allocator | recordingIds, registrantPartyId, allocationBatchId, suppliedAssertions, upcPolicy | assignments, providerEvidenceRefs, allocationBatchId, state assigned/conflict/pending | 2,000 ms | 1 request retry at 500 ms, then allocation-batch lookup; never blind reallocate | Open 60 s after 3 failures; remain pending and reconcile. |

## Events and Async Consumers

### Event envelope

Every outbox row follows BE00:

~~~ts
type DistributionEvent = {
  eventId: string;
  eventType: string;
  schemaVersion: 1;
  aggregateType: "release" | "release_version" | "destination_selection" | "recording_identifier";
  aggregateId: string;
  aggregateVersion: string;
  correlationId: string;
  causationId: string | null;
  occurredAt: string;
  payload: Record<string, unknown>;
};
~~~

| Operation ID | Event type | Safe payload | Consumers and delivery |
|---|---|---|---|
| BE22A-DST01 | distribution.release.changed.v1 | release/version/state/version/membership count | Projects/CMS; at-least-once, dedupe by eventId. |
| BE22A-DST02 | distribution.readiness.changed.v1 | release/target/state/blocker class/version | Owner task board and 22b gate; no evidence/secrets. |
| BE22A-DST03 | distribution.readiness.changed.v1 | release/target/analysis state/blocker class/version | Owner task board; terminal unverified after third failure only. |
| BE22A-DST04 | distribution.readiness.changed.v1 | release/target/readiness state/blocker class/version | Owner board and delivery admission; stale event cannot authorize. |
| BE22A-DST05 | distribution.footprint.changed.v1 | release/destination/territory/state/version | Rights/pre-save; unknown remains explicit. |
| BE22A-DST06 | distribution.date-plan.changed.v1 | release/territory/state/version after announcement | Promotion; pre-announcement exact dates excluded. |
| BE22A-DST07 | distribution.identifier.changed.v1 | recording-or-release/id-kind/state/version | Rights/royalties and 22b; values excluded. |

### Consumer guarantees

- Outbox insert is atomic with the command. Claim uses lease token and expected version; crash expires the lease.
- Consumers dedupe by eventId and aggregateType/aggregateId/aggregateVersion. They cannot rewrite 22a canonical rows.
- Private evidence requires an authorized purpose-bound RPC read and audit event.
- No 22a event asserts delivery, store-live, takedown, UGC response, enrichment delivery, or export completion.

## Error Handling

### Boundary mapping

| Boundary | Mapping |
|---|---|
| Zod failure | HTTP 400 INVALID_ARGUMENT with safe field paths and expected type. |
| Missing/expired session | HTTP 401 UNAUTHENTICATED with no target existence detail. |
| Capability/ownership/lease failure | HTTP 403 FORBIDDEN and denied audit decision. |
| Hidden/absent target | HTTP 404 NOT_FOUND, same for wrong-party probes. |
| Expected-version or idempotency conflict | HTTP 409 CONFLICT, current version only when visible. |
| Business gate failure | HTTP 422 exact code such as RECORDING_INELIGIBLE, RIGHTS_UNRESOLVED, PARTNER_RULE_BLOCKED, TERRITORY_UNKNOWN, or IDENTIFIER_CONFLICT. |
| Rate limit | HTTP 429 RATE_LIMITED with bounded Retry-After. |
| Dependency timeout/malformed response | HTTP 503 DEPENDENCY_UNAVAILABLE; prior truth unchanged. |
| Unhandled error | HTTP 500 INTERNAL; cause only in Sentry/structured logs keyed by request ID. |

### Error invariants

- Every error has exactly code, message, requestId, and details in ApiError. Stack traces, SQL, tokens, and private evidence never cross the boundary.
- Registered domain failures complete idempotency so retry cannot create a second membership, finding, job, date plan, or identifier.
- Findings include field, target, profile/spec version, example, severity, and remedy. A bare global invalid flag is not valid.
- Stale readiness/date results fail closed. Unknown/unverified never becomes success for convenience.

## Testing Strategy

| Operation ID | Contract and handler tests | Authorization, persistence, recovery |
|---|---|---|
| BE22A-DST01 | Owned recording, Shard 20 inclusion, exact-one refinement, unknown key, malformed UUID, response hash/enums. | Owner/admin pass; contributor/wrong party 403/404; RLS; duplicate order/recording; replay; CAS loser; atomic rollback. |
| BE22A-DST02 | Strict/advisory findings, destination cells, certified profile, Dst02Success/ErrorResponse. | Revoked profile, stale snapshot, append-only finding, no canonical mutation, outbox retry/dedupe. |
| BE22A-DST03 | Ready object, checksum mismatch, target map, bounded arrays, queued and unverified responses. | Producer standing, object RLS, lease expiry, three-attempt ceiling, source unchanged, circuit-open. |
| BE22A-DST04 | Machine-before-social, override reason, all five states, expiry. | Missing rights/consent/link, stale result, owner Full override audit, worker lease, no old-event admission. |
| BE22A-DST05 | Territory regex, required model, cell state/basis, unresolved-not-worldwide. | Rights timeout, partial cells, RLS, unique cell, profile model block, retry prior truth. |
| BE22A-DST06 | Date ordering/timezone/choice/forfeits response. | Worker cannot choose, competing revision, pre-announcement redaction, announced append-only, no automatic move. |
| BE22A-DST07 | ISRC regex, asserted provenance, UPC policy, assignment response. | Recording idempotency, allocation lookup, collision, rights routing, immutable identifier after failure. |

### Cross-cutting tests

- Property tests generate destination/territory cells and prove unresolved rights never produce worldwide availability.
- Contract tests validate every operation against Zod 4 request, success, and ErrorResponse schemas and verify every error includes BE00 ApiError.
- RLS tests cover anonymous, correct owner, wrong valid user, wrong party, forged party ID, revoked mandate, stale version, expired session, service credential misuse, and over-disclosure.
- Integration tests use deterministic fake object store, partner registry, rights RPC, and allocator timeout, malformed response, duplicate response, and circuit-open cases.
- Event tests verify atomic outbox creation, eventId dedupe, lease expiry, no duplicate membership/analysis/date/identifier write, and payload exclusion.

## Deepening Passes

| Pass | Result and evidence |
|---|---|
| 1 Source normalization | PASS — every assigned IA interaction maps one-to-one to BE22A-DST01 through BE22A-DST07 with source lines. |
| 2 Boundary review | PASS — 22a owns build/readiness/footprint; 22b delivery; 22c lifecycle; 22d enrichment/catalogue/label authority. |
| 3 Contract deepening | PASS — strict Zod 4 request/success schemas and BE00 ApiError error schema for all routes. |
| 4 Authorization deepening | PASS — capabilities, roles, 403 rules, and 404 anti-enumeration per operation. |
| 5 Persistence deepening | PASS — every owned model lists SQL type, nullability, CHECK/FK/unique constraints, indexes, forced RLS, and grants. |
| 6 Concurrency deepening | PASS — idempotency, CAS, unique keys, leases, immutable source/identifier facts, and stale rejection. |
| 7 Seam deepening | PASS — exact request/response, timeout ms, retry count/backoff, and circuit behavior for every seam. |
| 8 Observability deepening | PASS — every operation has audit, metric labels, trace fields, correlation and redaction. |
| 9 Test deepening | PASS — contract, handler, RLS, property, dependency, worker, outbox and recovery tests keyed to each operation. |
| 10 Ambiguity resolution | PASS — micro/macro, two-implementer, and devil's-advocate reviews found no unresolved contract choice. |

## Ambiguity Gate

PASS.

- Micro ambiguity: route parameters, ownership, closed enums, date ordering, exact-one eligibility, hash/version handling, error status, replay, CORS, and pre-announcement redaction are explicit.
- Macro ambiguity: 22a owns only seven build/readiness/footprint interactions; partner dispatch, lifecycle, UGC, exports, enrichment, and label/distributor authority have companion owners.
- Two-implementer test: one implementer can build Hono handlers from route/contract/control registries; another can build migrations/RPCs from database/state tables without a product question.
- Devil's-advocate test: outage, stale snapshot, duplicate, wrong-party probe, allocation timeout, worker crash, and unresolved territory each have typed, observable recovery.
- Decision lock: unrecognized territory, uncertified profile, unverified asset, stale readiness, conflicting identifier, and failed dependency never silently become a successful gate.

## Open Questions

None.

## Dependency References

- BE00: inherit command admission, idempotency, audit, private schema boundary, RPC-only grants, forced RLS, outbox envelope, leases, Sentry correlation, and ApiError { code, message, requestId, details }. 22a does not duplicate platform endpoints.
- Shard 01: consume identity/acting-party resolution, owner mandates, artist link projections, and verified party IDs; 22a never authors identity truth.
- Shard 06: consume trust/safety suspension and collision review paths; identifier conflicts route without merge.
- Shard 07: consume witnessed project/credit provenance; 22a never rewrites credits.
- Shard 09: consume exact audio-version/object authority; asset analysis produces only non-artistic renditions.
- Shard 10: consume rights, consent, territory, identifier, and ownership facts; 22a records basis/version and is not rights authority.
- Shard 20: consume licensed inclusion eligibility; membership stores inclusion snapshot and expiry obligation.
- 22b consumes readiness, footprint, date-plan, identifier, and release-change events; DST-08 rechecks all 22a facts at handoff.
- 22c consumes release/date/identifier truth for updates and takedowns; re-entry is a new release/UPC decision.
- 22d consumes release/version and descriptor facts for enrichment, export, and label/distributor commands.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Created BE-22a from approved IA Shard 22 split; mapped DST-01 through DST-07; added strict Zod 4 contracts, route-keyed controls, SQL/RLS schema, state/recovery, seams, events, tests, deepening passes, and ambiguity gate. | /write-be-spec with approved decision delegation. |
