# BE-22c — Release Promotion, Updates and Takedowns

Status: Complete

This specification turns Shard 22 interactions DST-14 through DST-19 into six Hono command endpoints. It owns announced-date changes, live metadata/audio change classification, voluntary and involuntary lifecycle commands, fingerprint/whitelist registration, and explicit UGC claim decisions. It consumes 22a release/date/identifier truth and 22b delivery/status evidence; it never duplicates or rewrites those routes.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Classification | Multi-domain split, promotion/update/takedown/claims subdomain | Approved Shard 22 split assigns DST-14 through DST-19 to 22c. |
| Backend surface | Authenticated Hono REST commands, scoped lifecycle workers, partner/provider adapters, Supabase RPCs and append-only evidence | IA Contracts lines 112-128; deep dive Lifecycle/Claims lines 60-69; BE00 Middleware lines 253-297. |
| Canonical owner | 22c owns release_change_plan, catalogue_lifecycle_command, fingerprint_registration, ugc_whitelist, and ugc_claim_case | IA Data Models lines 174-179; deep dive lines 62-67. |
| Consumed authority | 22a owns release/date/identifier facts; 22b owns delivery/message/status facts; Shard 06 owns trust/safety evidence and assigned case | IA Dependency References lines 346-359 and companion BE specs. |
| Split validity | PASS: DST-14 through DST-19 have one lifecycle/claims owner and no conflict with build, delivery, enrichment, or catalogue-export boundaries | IA interaction table lines 79-102. |

## Referenced Material Inventory

| Source file | Section and lines | Material consumed |
|---|---|---|
| .memory/wiki/specs/ia/22-release-distribution.md | Overview lines 7-20 | Release lifecycle, delivery and exit source-of-truth boundaries. |
| .memory/wiki/specs/ia/22-release-distribution.md | Acceptance Criteria lines 52-75 | Date changes, update plans, takedown, removal, fingerprint and UGC criteria. |
| .memory/wiki/specs/ia/22-release-distribution.md | Interactions lines 94-99 | DST-14 through DST-19 preconditions, behavior, completion, failure and recovery. |
| .memory/wiki/specs/ia/22-release-distribution.md | Global Interaction Rules lines 104-110 | Destructive confirmation, store evidence, notification and external-success rules. |
| .memory/wiki/specs/ia/22-release-distribution.md | Contracts lines 112-128 | ReleaseState, DestinationState, DeliveryMessageKind and lifecycle/claim errors. |
| .memory/wiki/specs/ia/22-release-distribution.md | Data Models lines 157-179 | Change, lifecycle, fingerprint, whitelist and claim invariants. |
| .memory/wiki/specs/ia/22-release-distribution.md | Typed Field Registry lines 181-216 | Core field types and cardinality. |
| .memory/wiki/specs/ia/22-release-distribution.md | Access Control lines 218-240 | Owner Full, reviewer, artist and case-evidence boundaries. |
| .memory/wiki/specs/ia/22-release-distribution.md | Event Schemas lines 252-272 | Lifecycle/UGC/identifier safe payloads and excluded claim detail. |
| .memory/wiki/specs/ia/22-release-distribution.md | Dependency References lines 346-359 | BE00 and Shards 01, 06, 07, 09, 10, 20, 37-39 directions. |
| .memory/wiki/specs/ia/deep-dives/22-release-distribution.md | Lifecycle, Claims and Exit Algorithm lines 60-69 | Classification, Full approval, provenance, evidence-scoped removal, strict fingerprint gate, no auto-response. |
| .memory/wiki/specs/ia/deep-dives/22-release-distribution.md | Abuse and Recovery Verification lines 71-83 | Projection-only changes, takedown retention, no duplicate identifiers, claim decision, and exit guarantees. |
| .memory/wiki/specs/ia/deep-dives/22-release-distribution.md | Cross-Shard Contracts lines 85-95 | Delivery, rights, safety, audio and identity seams. |
| .memory/wiki/specs/be/00-infrastructure.md | Zod Contracts lines 112-200 | BE00 wire conventions, ApiError envelope, command metadata and job contracts. |
| .memory/wiki/specs/be/00-infrastructure.md | Database Schema lines 202-251 | Private schema, RPC-only access, RLS, grants, jobs, provider operations, outbox and audit. |
| .memory/wiki/specs/be/00-infrastructure.md | Middleware lines 253-297 | Middleware order, capability checks and CORS. |
| .memory/wiki/specs/be/00-infrastructure.md | Events lines 357-415 | Outbox envelope, lease and dedupe recovery. |
| .memory/wiki/specs/be/00-infrastructure.md | Error/Observability lines 416-461 | Boundary mapping, compensation, audit, metrics and traces. |
| .memory/wiki/specs/be/00-infrastructure.md | Testing Strategy lines 476-505 | Contract, RLS, provider and recovery obligations. |

## IA Source Map

### Assigned interactions

| IA interaction | Source trace | Backend operation | Canonical completion |
|---|---|---|---|
| DST-14 Owner changes release date | IA line 94 | BE22C-DST14 | New date-plan revision with broken-promise/forfeit consequences and event only. |
| DST-15 Owner updates live metadata/audio | IA line 95 | BE22C-DST15 | Per-destination change classification and approved recovery plan. |
| DST-16 Owner requests voluntary takedown | IA line 96 | BE22C-DST16 | Scoped withdrawal command with irreversible-loss confirmation and retained provenance. |
| DST-17 Platform processes involuntary removal | IA line 97 | BE22C-DST17 | Evidence-scoped suspension/removal with notification, contest and post-mortem. |
| DST-18 Owner registers fingerprint/whitelist | IA line 98 | BE22C-DST18 | Strict rights/sample/ownership gate and confirmed provider operation. |
| DST-19 Artist handles UGC claim | IA line 99 | BE22C-DST19 | Explicit user decision; no platform auto-response. |

### Canonical Data Models

Literal names from IA Data Models lines 157-179:

release, release_version, release_recording_membership, release_label_copy, label_distribution_mandate, distributor_authority_snapshot, partner_knowledge_version, release_enrichment, release_descriptor_correction, release_finding, delivery_readiness_item, destination_selection, release_date_plan, delivery_snapshot, delivery_message, delivery_step, partner_ack, store_status, store_artist_link, release_asset_analysis, asset_rendition, release_change_plan, catalogue_lifecycle_command, fingerprint_registration, ugc_whitelist, ugc_claim_case, recording_identifier, release_identifier, catalogue_export_job, import_manifest.

22c owns release_change_plan, catalogue_lifecycle_command, fingerprint_registration, ugc_whitelist, and ugc_claim_case. It consumes release, release_version, release_date_plan, release_identifier, recording_identifier, delivery_snapshot, delivery_message, delivery_step, partner_ack, store_status, release_finding, release_enrichment, and the remaining canonical models without rewriting them.

### Event Schemas

Literal names from IA Event Schemas lines 256-270:

distribution.release.changed.v1, distribution.readiness.changed.v1, distribution.footprint.changed.v1, distribution.date-plan.changed.v1, distribution.message.changed.v1, distribution.destination-status.changed.v1, distribution.catalogue-lifecycle.changed.v1, distribution.ugc-registration.changed.v1, distribution.identifier.changed.v1, release.enrichment.changed.v1, release.enrichment.delivered.v1, release.descriptor-correction.changed.v1, distribution.partner-capability.changed.v1, distribution.label-copy.changed.v1, distribution.export.changed.v1.

22c emits distribution.date-plan.changed.v1, distribution.release.changed.v1, distribution.catalogue-lifecycle.changed.v1, distribution.ugc-registration.changed.v1, and distribution.identifier.changed.v1 where an immutable identifier projection changes. Events contain no claim detail, private evidence, media bytes, provider secrets, or export URLs.

## Endpoint Reconciliation

| IA interaction | HTTP operation | Command transaction | Success event |
|---|---|---|---|
| DST-14 | POST /api/v1/releases/:releaseId/date-changes | Re-read 22a announced plan, validate mandate/new dates/forfeits, append revision and consequences, emit event only. | distribution.date-plan.changed.v1 |
| DST-15 | POST /api/v1/releases/:releaseId/change-plans | Classify each field/asset/store effect before authorization, require Full approval for destructive effects, persist per-destination steps. | distribution.release.changed.v1 |
| DST-16 | POST /api/v1/releases/:releaseId/takedowns | Confirm irreversible losses and accepted deliveries from 22b, append voluntary command, issue only valid scoped takedown work. | distribution.catalogue-lifecycle.changed.v1 |
| DST-17 | POST /api/v1/catalogue-lifecycle/removals | Verify assigned Shard 06 evidence, narrow scope, notify basis/contest route, append post-mortem. | distribution.catalogue-lifecycle.changed.v1 |
| DST-18 | POST /api/v1/recordings/:recordingId/fingerprint-registrations | Apply stricter ownership/sample/rights gate, review whitelist, execute confirmed provider operation. | distribution.ugc-registration.changed.v1 |
| DST-19 | POST /api/v1/ugc-claim-cases/:caseId/decisions | Show held evidence and record the artist/owner decision; no automatic release, whitelist, or dispute. | distribution.ugc-registration.changed.v1 |

## API Endpoints

### Authoritative Route Registry

This is the only 22c route registry. Operation IDs are stable keys for every contract, error, authorization, idempotency, rate, observability, and test row. 22a, 22b, and BE00 routes are inherited and not duplicated.

| Operation ID | Method | Path | Capability | Response |
|---|---|---|---|---|
| BE22C-DST14 | POST | /api/v1/releases/:releaseId/date-changes | release.date_change | Dst14Success |
| BE22C-DST15 | POST | /api/v1/releases/:releaseId/change-plans | release.change_plan | Dst15Success |
| BE22C-DST16 | POST | /api/v1/releases/:releaseId/takedowns | release.takedown | Dst16Success |
| BE22C-DST17 | POST | /api/v1/catalogue-lifecycle/removals | catalogue.removal_review | Dst17Success |
| BE22C-DST18 | POST | /api/v1/recordings/:recordingId/fingerprint-registrations | recording.fingerprint_register | Dst18Success |
| BE22C-DST19 | POST | /api/v1/ugc-claim-cases/:caseId/decisions | ugc.claim_decide | Dst19Success |

### Request/Response Contracts (Zod 4)

Every non-2xx response is ErrorResponse containing the BE00/global ApiError { code, message, requestId, details }. Unknown keys are rejected and route parameters are UUIDs.

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
const Territory = z.string().regex(/^[A-Z]{2,3}$/);

const DateChange = z.object({
  destinationId: Uuid, territoryCode: Territory,
  deliveryDate: DateOnly, releaseDate: DateOnly, liveDate: DateOnly,
  timeZone: z.string().min(1).max(64),
  consequenceSummary: z.string().min(1).max(2000),
  forfeitedWindowCost: z.string().min(1).max(256),
}).strict();
const Dst14Request = z.object({
  releaseVersionId: Uuid, currentDatePlanVersion: Version,
  changes: z.array(DateChange).min(1).max(100),
  consequencesAcknowledged: z.boolean(), idempotencyKey: IdempotencyKey,
}).strict().refine(v => v.consequencesAcknowledged,
  { path: ["consequencesAcknowledged"], message: "date consequences must be acknowledged" });
const Dst14Success = z.object({
  datePlanId: Uuid, state: z.enum(["draft", "announced", "blocked"]),
  eventId: Uuid, version: Version,
}).strict();

const DestinationEffect = z.object({
  destinationId: Uuid,
  effect: z.enum(["metadata_update", "redelivery", "takedown", "new_release"]),
  destructive: z.boolean(),
}).strict();
const ChangeRequest = z.object({
  field: z.string().min(1).max(128),
  requestedValueHash: z.string().length(64),
  requestedAssetObjectId: Uuid.optional(),
  sameRecording: z.boolean().optional(),
  effects: z.array(DestinationEffect).min(1).max(100),
}).strict();
const Dst15Request = z.object({
  releaseVersionId: Uuid, changes: z.array(ChangeRequest).min(1).max(100),
  ownerFullApprovalId: Uuid.optional(), idempotencyKey: IdempotencyKey,
}).strict().refine(v => v.changes.every(c => !c.effects.some(e => e.destructive) || Boolean(v.ownerFullApprovalId)),
  { path: ["ownerFullApprovalId"], message: "destructive change requires owner Full approval" });
const Dst15Success = z.object({
  changePlanId: Uuid,
  classifications: z.array(z.object({
    field: z.string().min(1), destinationId: Uuid,
    effect: z.enum(["metadata_update", "redelivery", "takedown", "new_release"]),
  }).strict()),
  state: z.enum(["draft", "approved", "queued", "blocked"]), version: Version,
}).strict();

const LossSummary = z.object({
  preSaveCount: z.number().int().min(0),
  liveItemCount: z.number().int().min(0),
  identifierCount: z.number().int().min(0),
  irreversibleConsequences: z.array(z.string().min(1)).min(1),
}).strict();
const Dst16Request = z.object({
  releaseVersionId: Uuid, destinationIds: z.array(Uuid).min(1).max(100),
  lossSummary: LossSummary, confirmation: z.literal(true),
  ownerFullApprovalId: Uuid, idempotencyKey: IdempotencyKey,
}).strict();
const Dst16Success = z.object({
  commandId: Uuid, state: z.enum(["queued", "withdrawn", "partial", "blocked"]),
  issuedDestinationIds: z.array(Uuid), retainedProvenance: z.literal(true),
  version: Version,
}).strict();

const Dst17Request = z.object({
  caseId: Uuid, releaseVersionId: Uuid,
  evidenceRefs: z.array(z.string().min(1).max(256)).min(1).max(100),
  scope: z.enum(["release", "destination", "territory", "item"]),
  claimantPartyId: Uuid, reviewerDecision: z.enum(["suspend", "remove"]),
  notificationRefs: z.array(z.string().min(1).max(256)).min(1),
  contestWindowDays: z.number().int().min(1).max(90),
  idempotencyKey: IdempotencyKey,
}).strict();
const Dst17Success = z.object({
  commandId: Uuid, state: z.enum(["suspended", "removed", "blocked"]),
  scope: z.enum(["release", "destination", "territory", "item"]),
  contestDueAt: DateTime, postMortemId: Uuid, version: Version,
}).strict();

const Dst18Request = z.object({
  recordingId: Uuid, providerId: Uuid, sourceObjectId: Uuid,
  ownershipEvidenceRef: z.string().min(1).max(256),
  sampleClearanceRefs: z.array(z.string().min(1).max(256)).min(1).max(100),
  whitelistReviewId: Uuid, idempotencyKey: IdempotencyKey,
}).strict();
const Dst18Success = z.object({
  registrationId: Uuid,
  state: z.enum(["registered", "blocked", "withdrawn", "reconciling"]),
  providerOperationId: Uuid.optional(), version: Version,
}).strict();

const Dst19Request = z.object({
  caseId: Uuid,
  decision: z.enum(["release", "whitelist", "dispute", "keep_open"]),
  evidenceRefs: z.array(z.string().min(1).max(256)).min(1).max(100),
  userConfirmation: z.literal(true), idempotencyKey: IdempotencyKey,
}).strict();
const Dst19Success = z.object({
  caseId: Uuid,
  state: z.enum(["open", "released", "whitelisted", "disputed"]),
  action: z.enum(["release", "whitelist", "dispute", "keep_open"]),
  disputeId: Uuid.optional(), version: Version,
}).strict();
~~~

### Contract Registry

| Operation ID | Request body | Success body | Canonical validation |
|---|---|---|---|
| BE22C-DST14 | Dst14Request | Dst14Success | Current announced plan, date ordering, consequences and costed forfeits required; emits event only. |
| BE22C-DST15 | Dst15Request | Dst15Success | Every field/store effect is classified before authorization; destructive effects require owner Full. |
| BE22C-DST16 | Dst16Request | Dst16Success | Concrete irreversible losses and accepted delivery scope required; provenance retention is literal. |
| BE22C-DST17 | Dst17Request | Dst17Success | Assigned evidence, narrowed scope, claimant/basis notification and contest window required. |
| BE22C-DST18 | Dst18Request | Dst18Success | Stricter ownership/sample gate and reviewed whitelist precede provider operation. |
| BE22C-DST19 | Dst19Request | Dst19Success | Explicit user decision and held evidence; platform has no standing to auto-respond. |

### Error Registry

Every row returns ErrorResponse with BE00 ApiError { code, message, requestId, details }. details contain safe target, current revision, evidence class, contest deadline, retry guidance, or remediation owner only.

| Operation ID | 400 / 401 | 403 vs 404 | 409 | 422 domain errors | 429 / 5xx recovery |
|---|---|---|---|---|---|
| BE22C-DST14 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without release mandate; NOT_FOUND hides release/plan | CONFLICT on date-plan revision | TERRITORY_UNKNOWN, DATE_WINDOW_BLOCKED | RATE_LIMITED; refused change leaves announced date. |
| BE22C-DST15 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without owner mandate/Full approval; NOT_FOUND hides release | CONFLICT on change-plan revision | DELIVERY_SNAPSHOT_STALE, PARTNER_RULE_BLOCKED | RATE_LIMITED; no per-store step writes on stale plan. |
| BE22C-DST16 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without takedown authority/Full approval; NOT_FOUND hides release/destination | CONFLICT on lifecycle revision | TAKEDOWN_NOT_DELIVERED | RATE_LIMITED; invalid destinations are not issued a takedown. |
| BE22C-DST17 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN outside assigned case; NOT_FOUND hides case/release | CONFLICT on case evidence revision | EVIDENCE_SCOPE_INSUFFICIENT, CLAIM_CASE_UNRESOLVED | RATE_LIMITED; narrow scope or hold for review, never broaden. |
| BE22C-DST18 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without recording/provider standing; NOT_FOUND hides recording | CONFLICT on whitelist review | CLAIM_REGISTRATION_BLOCKED, RIGHTS_UNRESOLVED, OWNERSHIP_RECORD_ABSENT | RATE_LIMITED; provider ambiguity remains reconciling. |
| BE22C-DST19 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN outside case/party standing; NOT_FOUND hides case/evidence | CONFLICT on user decision | CLAIM_REGISTRATION_BLOCKED | RATE_LIMITED; undecided case remains open, no auto-response. |

### Authorization and Middleware Registry

Each operation runs request ID/trace, authenticated session or assigned reviewer, acting-party capability, explicit CORS policy, rate limit, Zod validation, BE00 idempotency, RPC/provider/job, audit and outbox in that order.

| Operation ID | Roles and ownership | 403 rule | 404 rule | Middleware and CORS |
|---|---|---|---|---|
| BE22C-DST14 | Release owner/admin with release.date_change. | FORBIDDEN for contributor, worker, or missing mandate. | NOT_FOUND hides release/date plan. | auth → acting-party → CORS distribution-api (allowlisted origins, no wildcard credentials) → rate → Zod → idempotency → RPC. |
| BE22C-DST15 | Release owner/admin with release.change_plan; only owner Full approves destructive effect. | FORBIDDEN without mandate or Full approval. | NOT_FOUND hides release/version. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → RPC. |
| BE22C-DST16 | Release owner/admin with release.takedown and owner Full. | FORBIDDEN for contributor or no destructive approval. | NOT_FOUND hides release/destination delivery. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → RPC. |
| BE22C-DST17 | Assigned Shard 06 rights/safety reviewer with catalogue.removal_review. | FORBIDDEN for reviewer outside case/scope or general catalogue browsing. | NOT_FOUND hides case/release/evidence. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → reviewer RPC. |
| BE22C-DST18 | Recording owner/Producer with recording.fingerprint_register and provider scope. | FORBIDDEN without recording rights or provider assignment. | NOT_FOUND hides recording/object/provider. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → provider RPC. |
| BE22C-DST19 | Artist/owner named in claim case with ugc.claim_decide. | FORBIDDEN for unrelated party or platform attempting response. | NOT_FOUND hides case/evidence/video. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → case RPC. |

### Idempotency and Concurrency Registry

| Operation ID | Key and replay | Version/CAS | Failure recovery |
|---|---|---|---|
| BE22C-DST14 | Actor/operation/request hash; same date change replays revision/event for 30 days. | Date-plan CAS on current announced revision; prior announced date immutable. | Rejected change leaves prior promise; no partial plan. |
| BE22C-DST15 | Key binds source version, field/effect set and approval. | Change plan CAS; per-destination step unique; source message/history immutable. | Stale plan requires fresh 22a/22b snapshot; non-destructive canonical credit update remains explicit. |
| BE22C-DST16 | Key binds release, destinations, loss summary and approval. | Lifecycle command CAS; one command per destination/revision; provenance append-only. | Missing accepted delivery yields TAKEDOWN_NOT_DELIVERED and no provider write. |
| BE22C-DST17 | Key binds assigned case, evidence digest, scope and decision. | Case evidence/version CAS; append-only claim and contest records. | Evidence insufficient narrows/blocks; no broadened suspension. |
| BE22C-DST18 | Key binds recording/provider/source checksum/review. | Registration and whitelist review CAS; provider operation key immutable. | Ambiguous provider write is reconciling and looked up, never duplicated. |
| BE22C-DST19 | Key binds case, decision, evidence digest and actor. | One decision revision CAS; case remains open until explicit resolution. | Timeout preserves open case/evidence; no service-generated response. |

### Rate, CORS and SLO Registry

| Operation ID | Rate limit | CORS policy | SLO |
|---|---|---|---|
| BE22C-DST14 | 10/minute per actor and release, burst 2 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 1,500 ms. |
| BE22C-DST15 | 10/minute per actor and release, burst 2 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms to plan persistence. |
| BE22C-DST16 | 5/minute per actor and release, burst 1 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms to scoped queue. |
| BE22C-DST17 | 10/minute per reviewer and case, burst 2 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms to evidence decision. |
| BE22C-DST18 | 5/minute per actor, recording and provider, burst 1 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms to confirmed operation/reconciling. |
| BE22C-DST19 | 20/minute per actor and case, burst 4 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 1,500 ms to decision persistence. |

### Observability Registry

| Operation ID | Audit | Metrics | Trace and redaction |
|---|---|---|---|
| BE22C-DST14 | release.date_change.requested with old/new revision, consequences and actor | date_change_total by state; forfeiture_total | Dates only after announcement; pre-announcement dates and contact PII redacted. |
| BE22C-DST15 | release.change_plan.created with field/effect/approval classes | change_plan_total by effect/state; destructive_approval_total | Version/effect hashes and IDs; audio and rights evidence excluded. |
| BE22C-DST16 | release.takedown.requested with destination scope, loss counts and approval | takedown_total by state; takedown_not_delivered_total | Counts, IDs and provenance hash; no private claimant evidence. |
| BE22C-DST17 | catalogue.removal.decided with case, evidence class, scope and contest | removal_total by state/scope; contest_total | Case/evidence hashes; claimant identity and protected evidence redacted. |
| BE22C-DST18 | fingerprint.registration.requested/confirmed/blocked | fingerprint_total by state; registration_blocked_total | Recording/provider/review IDs; samples, rights documents and provider secrets omitted. |
| BE22C-DST19 | ugc.claim.decision with case, action and actor class | ugc_claim_total by decision/state; auto_response_attempt_total | Case/evidence hashes; video URLs, claimant PII and response text redacted. |

## Database Schema

All tables are in non-exposed platform_private with RLS enabled and forced. anon, browser direct table access, and broad service-role access are denied. Named security-invoker RPCs repeat actor, acting-party, owner Full, assigned case, recording standing, provider scope, and evidence-purpose predicates. owner_id references identity.party(id).

| Table/model | All persistence fields with SQL type, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.release_change_plans / release_change_plan | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); release_version_id uuid NOT NULL FK platform_private.release_versions(id); source_revision bigint NOT NULL CHECK >0; change_set jsonb NOT NULL; classification change_effect NOT NULL CHECK IN metadata_update,redelivery,takedown,new_release; owner_full_approval_id uuid NULL FK audit_private.audit_events(id); state change_plan_state NOT NULL CHECK IN draft,approved,queued,partially_applied,completed,blocked; failure_reason text NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique release_version_id,version | PK; release_version_id,state,updated_at DESC; owner_id,created_at DESC; classification,state; owner_full_approval_id | Forced RLS release owner; Full approval RPC required for destructive classifications; per-destination child steps append-only; no browser table grant. |
| platform_private.catalogue_lifecycle_commands / catalogue_lifecycle_command | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); release_version_id uuid NOT NULL FK platform_private.release_versions(id); command_kind lifecycle_command_kind NOT NULL CHECK IN voluntary_takedown,involuntary_suspend,involuntary_remove; scope lifecycle_scope NOT NULL CHECK IN release,destination,territory,item; destination_ids uuid[] NOT NULL CHECK cardinality>0; evidence_refs text[] NOT NULL CHECK cardinality>0; loss_summary jsonb NOT NULL; reviewer_party_id uuid NULL FK identity.party(id); claimant_party_id uuid NULL FK identity.party(id); contest_due_at timestamptz NULL; notification_refs text[] NOT NULL; post_mortem_id uuid NULL; state lifecycle_state NOT NULL CHECK IN queued,suspended,withdrawn,removed,partial,blocked,contested; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now() | PK; release_version_id,state; command_kind,created_at DESC; reviewer_party_id,state; contest_due_at; GIN destination_ids | Forced RLS owner for voluntary commands; reviewer-assigned case policy for involuntary commands; evidence refs purpose-scoped; UPDATE/DELETE denied after decision; no broad catalogue reads. |
| platform_private.fingerprint_registrations / fingerprint_registration | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); recording_id uuid NOT NULL FK catalog.recordings(id); provider_id uuid NOT NULL FK integration.providers(id); source_object_id uuid NOT NULL FK platform_private.object_records(id); ownership_evidence_ref text NOT NULL; sample_clearance_refs text[] NOT NULL CHECK cardinality>0; whitelist_review_id uuid NOT NULL FK platform_private.ugc_whitelists(id); provider_operation_id uuid NULL FK platform_private.provider_operations(id); state fingerprint_state NOT NULL CHECK IN queued,registered,blocked,withdrawn,reconciling; attempt_count integer NOT NULL DEFAULT 0 CHECK BETWEEN 0 AND 32; failure_code text NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique recording_id,provider_id,source_object_id | PK; recording_id,state; provider_id,state,updated_at; provider_operation_id; whitelist_review_id | Forced RLS recording owner/Producer and assigned provider worker; stricter rights/sample gate RPC; samples/evidence are references only; provider key immutable; no browser raw evidence grant. |
| platform_private.ugc_whitelists / ugc_whitelist | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); recording_id uuid NOT NULL FK catalog.recordings(id); provider_id uuid NOT NULL FK integration.providers(id); source_ref text NOT NULL; review_id uuid NOT NULL; reviewer_party_id uuid NOT NULL FK identity.party(id); state whitelist_state NOT NULL CHECK IN pending,approved,rejected,withdrawn; rights_gate_hash bytea NOT NULL CHECK octet_length=32; sample_gate_hash bytea NOT NULL CHECK octet_length=32; reviewed_at timestamptz NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique recording_id,provider_id,review_id | PK; recording_id,provider_id,state; reviewer_party_id,updated_at DESC; rights_gate_hash; sample_gate_hash | Forced RLS reviewer and recording owner; approval is append-only and must precede provider registration; no platform auto-approval; no browser direct grant. |
| platform_private.ugc_claim_cases / ugc_claim_case | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); recording_id uuid NOT NULL FK catalog.recordings(id); provider_id uuid NOT NULL FK integration.providers(id); content_ref text NOT NULL; claim_ref text NOT NULL; claimant_party_id uuid NULL FK identity.party(id); responding_artist_party_id uuid NULL FK identity.party(id); evidence_refs text[] NOT NULL CHECK cardinality>0; decision ugc_decision NULL CHECK IN release,whitelist,dispute,keep_open; decision_actor_party_id uuid NULL FK identity.party(id); dispute_id uuid NULL; state ugc_case_state NOT NULL CHECK IN open,released,whitelisted,disputed,closed; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique provider_id,claim_ref | PK; provider_id,state,updated_at DESC; recording_id,state; claimant_party_id; decision_actor_party_id | Forced RLS only named case parties and assigned safety reviewer; evidence projection is purpose-bound; state changes require explicit user decision; service credential cannot decide; no direct table grant. |

### Shared persistence invariants

- Voluntary and involuntary lifecycle commands are append-only evidence. A takedown preserves release history and identifiers; a later re-entry is a new release/UPC while existing recording ISRCs remain.
- A destructive release_change_plan has owner Full approval and a persisted destination/item step. Non-destructive metadata/credit updates remain canonical even when a partner rejects them, but delivery effect is separately classified.
- Fingerprint registration is stricter than normal delivery: unresolved ownership, uncleared samples, or incomplete rights blocks all supported providers. Whitelist review precedes provider registration.
- UGC case evidence and user decisions are append-only. The platform has no standing to release, whitelist, dispute, or answer content on a user's behalf.
- Domain rows, audit_private.audit_events, provider_operations, and platform_private.outbox_events commit atomically. Raw media, samples, claimant PII, provider payloads, and private rights documents are not stored in these tables.
- BE00 idempotency binds actor, operation, request hash, and command/case target. Registered failures replay without duplicate takedown, provider operation, or user decision.

## Middleware & Policies

### Hono order and security

1. Attach request ID, trace ID, operation ID, bounded body limit, and correlation context.
2. Apply CORS policy distribution-api: explicit allowlisted product origins, POST and OPTIONS only, no wildcard credential mode, Vary: Origin.
3. Authenticate session or verified assigned reviewer/provider receipt; resolve acting party, mandate, owner Full capability, case assignment, recording standing, and provider scope.
4. Apply operation/actor/release/recording rate limit.
5. Validate path/body with the operation Zod 4 schema; reject unknown keys before lookup.
6. Reserve inherited BE00 idempotency; hash mismatch returns CONFLICT without side effects.
7. Call named security-invoker RPC/provider operation with expected revision and lease.
8. Append audit/outbox atomically and return only the Success schema.

### Policy rules

| Policy | Required behavior |
|---|---|
| Date change | Re-read 22a announced plan and 22b deadline/status facts. A new date states broken-promise/forfeit consequences; event only, no direct fan message. |
| Change classification | Each field and destination is classified as metadata update, redelivery, takedown, or new release before authorization. Replacing a master asks same recording versus new version explicitly. |
| Full approval | Any destructive change or voluntary takedown needs owner Full approval bound to exact scope and loss summary. Contributor approval is insufficient. |
| Voluntary takedown | Issue only where accepted delivery exists. Missing accepted delivery returns TAKEDOWN_NOT_DELIVERED and writes no invalid provider message. |
| Involuntary removal | Shard 06-assigned evidence narrows scope to exactly what it supports; claimant/basis/contest route is notified; evidence and contest additions are append-only. |
| Fingerprint gate | Ownership, samples, rights and reviewed whitelist all pass before provider registration. Provider silence is reconciling, not registered. |
| UGC | Evidence is shown to the case party; only explicit decision transitions case. No automatic response, release, whitelist, or dispute. |
| Identity | Recording identifier conflicts route to rights/trust review; ISRC remains recording-idempotent and values are never merged by lifecycle action. |

## Data Flow

### DST-14 date change

POST → auth/mandate → read 22a date-plan revision and 22b delivery/editorial windows → calculate forfeits and pre-save consequences → require acknowledgement → append new plan revision/event → return Dst14Success. The announced date is never silently moved by a worker.

### DST-15 update/change plan

POST → normalize each field/asset request → read 22a canonical version and 22b delivery/store status → classify per destination → ask same recording/new release where master changes → require Full approval for destructive effect → persist per-destination steps → queue only approved work. Canonical credit updates do not depend on store acceptance.

### DST-16/17 lifecycle commands

Voluntary: show irreversible losses and accepted-delivery scope → confirm → append command → send only valid destination work through 22b. Involuntary: verify Shard 06 assigned case/evidence → narrow scope → append suspension/removal, basis, contest and notifications → retain post-mortem. Neither action erases provenance.

### DST-18/19 claims

Fingerprint: verify rights/sample/ownership → review derived whitelist → create provider operation → reconcile confirmed result. UGC: fetch held case evidence → record explicit artist/owner decision → route release/whitelist/dispute only as requested. Conflicts block new registration and unresolved cases stay open.

## State Machines, Concurrency and Failure Recovery

| Aggregate | States and transitions | Guard |
|---|---|---|
| release_change_plan | draft → approved → queued → partially_applied → completed; any nonterminal state → blocked. | Per-field/store classification first; destructive step requires exact owner Full approval and expected source revision. |
| catalogue_lifecycle_command | queued → suspended, withdrawn, removed, partial, or blocked; suspended/removed → contested by append-only contest evidence. | Voluntary requires accepted delivery; involuntary requires assigned evidence and narrowed scope. |
| fingerprint_registration | queued → registered, blocked, withdrawn, or reconciling. | Strict gate and reviewed whitelist; provider operation evidence required for registered. |
| ugc_whitelist | pending → approved, rejected, or withdrawn. | Reviewer and rights/sample hashes; approval never inferred from provider state. |
| ugc_claim_case | open → released, whitelisted, disputed, or closed. | Explicit user decision; no automatic response or timeout resolution. |
| date plan | announced → superseded by a new explicit announced revision; prior promise remains history. | New date must satisfy footprint windows and state consequences. |

| Failure | Transaction outcome | Recovery |
|---|---|---|
| Same idempotency key/hash | Replay stored result and safe state. | No duplicate command, provider operation, case decision, or event. |
| Hash/revision CAS loss | No domain or provider write. | Return CONFLICT and require a fresh explicit revision/approval. |
| Date window/territory unresolved | Prior date remains; new plan blocked. | Refresh 22a footprint/profile facts; no automatic date movement. |
| Missing accepted delivery | Voluntary takedown not issued at that destination. | Return TAKEDOWN_NOT_DELIVERED and show exact scope. |
| Evidence scope insufficient | Involuntary action narrowed or blocked. | Reviewer adds evidence/contest append-only; never broadens automatically. |
| Provider fingerprint timeout | Registration stays reconciling. | Lookup by provider operation/idempotency key; never duplicate registration. |
| UGC response timeout | Case stays open with evidence. | User resumes explicit decision; no service-generated answer. |
| Worker crash/outbox failure | Lease expires; committed command/evidence remains. | BE00 sweeper reclaims bounded work and dedupes event. |

## External Seams

No seam is successful without the exact response evidence below. Failures return BE00 ApiError { code, message, requestId, details } and preserve canonical state.

| Seam | Exact request | Exact response | Timeout | Retries/backoff | Circuit behavior |
|---|---|---|---:|---|---|
| 22a date/release revision RPC | releaseVersionId, datePlanVersion, destinationIds, requestedChanges | currentDatePlanVersion, footprintRevision, earliestWindows, acceptedDeliveryFlags, canonicalVersion | 1,000 ms | 2 reads at 100 ms and 300 ms; no retry after append ambiguity | Open 30 s after 5 failures in 60 s; return DELIVERY_SNAPSHOT_STALE/DEPENDENCY_UNAVAILABLE. |
| 22b delivery/takedown command seam | releaseVersionId, destinationId, commandKind takedown/update, sourceRevision, approvalId, idempotencyKey | commandRef, messageId or null, state queued/blocked, acceptedDeliveryEvidence | 2,000 ms | 1 pre-commit retry at 300 ms; lookup after ambiguity | Open 30 s after 4 failures; no invalid takedown fallback. |
| Shard 06 case/evidence RPC | caseId, releaseVersionId, requestedScope, evidenceRefs, reviewerPartyId | assignedCase, supportedScope, claimantRef, basisClass, contestRoute, evidenceRevision | 1,500 ms | 1 read retry at 250 ms; no retry for authorization | Open 30 s after 4 failures; action remains blocked/narrowed. |
| Shard 09 exact audio-version RPC | recordingId, sourceObjectId, requestedField, correctionOrFingerprintHash | exactAudioVersionId, authorityState, versionOwnerPartyId, correctionPermission | 1,200 ms | 1 read retry at 200 ms | Open 30 s after 4 failures; no project mutation or registration. |
| Fingerprint provider | recordingId, fingerprintObjectRef, rightsGateHash, whitelistReviewId, providerIdempotencyKey | providerOperationId, providerReference, state registered/rejected/pending, observedAt | 5,000 ms | 2 attempts at 500 ms and 1,500 ms only before confirmed send; then lookup | Open 60 s after 3 failures; reconciling state, never blind retry. |
| UGC provider claim lookup/action | providerId, claimRef, caseId, userDecision, evidenceDigest, providerIdempotencyKey | providerOperationId, state released/whitelisted/disputed/pending, providerTimestamp | 4,000 ms | 1 pre-commit retry at 500 ms; lookup after ambiguity | Open 60 s after 3 failures; case stays open and platform sends no unrequested answer. |
| ObjectRecord evidence reader | sourceObjectId, recordingId, purpose fingerprint, expectedChecksum | objectId, state ready, checksum, byteSize, retentionClass | 2,000 ms | 2 reads at 250 ms and 750 ms; checksum mismatch is terminal | Open 60 s after 5 failures; registration blocked. |

## Events and Async Consumers

### Event envelope

Every outbox event inherits BE00:

~~~ts
type DistributionEvent = {
  eventId: string;
  eventType: string;
  schemaVersion: 1;
  aggregateType: "release_change_plan" | "catalogue_lifecycle_command" | "fingerprint_registration" | "ugc_claim_case";
  aggregateId: string;
  aggregateVersion: string;
  correlationId: string;
  causationId: string | null;
  occurredAt: string;
  payload: Record<string, unknown>;
};
~~~

| Operation ID | Event type | Safe payload | Consumer/delivery rule |
|---|---|---|---|
| BE22C-DST14 | distribution.date-plan.changed.v1 | release/territory/state/version after announcement | Promotion; no pre-announcement exact dates. |
| BE22C-DST15 | distribution.release.changed.v1 | release/version/change effect/state/version | Delivery and CMS; no media bytes or private effect evidence. |
| BE22C-DST16 | distribution.catalogue-lifecycle.changed.v1 | release/command/scope/state/version | Stores/claims; provenance retained. |
| BE22C-DST17 | distribution.catalogue-lifecycle.changed.v1 | release/command/scope/state/version/contest state | Stores/claims; claimant and evidence detail excluded. |
| BE22C-DST18 | distribution.ugc-registration.changed.v1 | recording/provider/state/version | Claims/licensing; samples and rights proof excluded. |
| BE22C-DST19 | distribution.ugc-registration.changed.v1 | recording/provider/case state/version | Claims/licensing; no automatic response payload. |

Consumers dedupe by eventId and aggregate identity/version. Outbox insert is atomic, lease expiry recovers crashes, and no consumer may rewrite release, rights, delivery, or case evidence. No event asserts provider success before confirmed response.

## Error Handling

### Boundary matrix

| Boundary | Mapping |
|---|---|
| Zod/path/body failure | HTTP 400 INVALID_ARGUMENT with safe field paths and expected type. |
| Missing/expired session | HTTP 401 UNAUTHENTICATED without target existence detail. |
| Owner/case/provider/Full capability failure | HTTP 403 FORBIDDEN and denied audit. |
| Hidden/absent release/plan/case/recording | HTTP 404 NOT_FOUND, same for wrong-party probes. |
| Revision, approval, idempotency or decision CAS conflict | HTTP 409 CONFLICT with current version only when visible. |
| Date/update/takedown gate failure | HTTP 422 TERRITORY_UNKNOWN, DATE_WINDOW_BLOCKED, DELIVERY_SNAPSHOT_STALE, PARTNER_RULE_BLOCKED, or TAKEDOWN_NOT_DELIVERED. |
| Removal/fingerprint/UGC gate failure | HTTP 422 EVIDENCE_SCOPE_INSUFFICIENT, CLAIM_REGISTRATION_BLOCKED, RIGHTS_UNRESOLVED, OWNERSHIP_RECORD_ABSENT, or CLAIM_CASE_UNRESOLVED. |
| Rate limit | HTTP 429 RATE_LIMITED with bounded Retry-After. |
| 22a/22b/Shard 06/09/provider timeout or malformed response | HTTP 503 DEPENDENCY_UNAVAILABLE; prior truth remains. |
| Unhandled error | HTTP 500 INTERNAL; cause remains in provider-native structured logs keyed by requestId. |

### Error invariants

- Every error is ErrorResponse with BE00 ApiError { code, message, requestId, details }. details never contain claimant PII, provider payloads, tokens, media, samples, or private rights documents.
- A voluntary takedown cannot be issued without accepted delivery evidence. An involuntary action cannot exceed assigned evidence scope.
- A provider operation with ambiguous outcome stays reconciling and is resolved by lookup; blind retries are forbidden.
- A UGC case never transitions from timeout or provider silence to a user decision. Only an authenticated case party can decide.
- Registered errors complete idempotency; retries cannot erase provenance, duplicate a lifecycle command, allocate another fingerprint, or auto-answer a claim.

## Testing Strategy

| Operation ID | Contract and handler tests | Authorization, persistence, recovery |
|---|---|---|
| BE22C-DST14 | Date ordering/timezone, consequence acknowledgement, forfeits, response state/event. | Owner mandate, worker denial, revision conflict, announced append-only, no fan message, pre-announcement redaction. |
| BE22C-DST15 | Field/effect closure, same-recording flag, approval refinement, per-destination classification. | Full approval, non-destructive update, stale 22a/22b facts, destination scope, idempotent plan, no source overwrite. |
| BE22C-DST16 | Loss summary counts, literal confirmation, destination scope, retained provenance. | Accepted-delivery requirement, missing delivery error, Full approval, duplicate command, provider seam ambiguity. |
| BE22C-DST17 | Evidence refs, scope, reviewer decision, notification and contest fields. | Assigned-case RLS, insufficient evidence narrowing, claimant notification, contest append, no general catalogue browse. |
| BE22C-DST18 | Sample/ownership fields, whitelist review, provider response states. | Strict gate, provider key uniqueness, timeout reconciliation, no false registered, object/RLS and provider circuit tests. |
| BE22C-DST19 | Explicit decision closure, evidence list, user confirmation, state/action response. | Case-party RLS, wrong party 403/404, timeout open, no auto-response, decision CAS and event dedupe. |

### Cross-cutting tests

- Contract tests validate all six operation schemas and every non-2xx response against ErrorResponse and BE00 ApiError.
- Property tests prove lifecycle actions retain provenance, per-destination scope never broadens, identifier identity is not merged, and UGC timeout cannot decide.
- Integration tests use deterministic 22a/22b, Shard 06/09, object store, fingerprint provider, and UGC provider fakes with timeout, duplicate, malformed, and circuit-open cases.
- RLS tests cover anonymous, owner, wrong valid user, wrong party, contributor, unassigned reviewer, revoked mandate, stale session, service credential misuse, and evidence over-disclosure.
- Event tests verify atomic outbox, eventId dedupe, lease recovery, safe payload exclusion, and no auto-response/false-provider-success event.

## Deepening Passes

| Pass | Result and evidence |
|---|---|
| 1 Source normalization | PASS — DST-14 through DST-19 each map one-to-one to a route and exact IA line. |
| 2 Boundary review | PASS — 22c owns date/update/lifecycle/claims; 22a prerequisite truth, 22b delivery evidence, 22d enrichment/catalogue/label remain authoritative. |
| 3 Contract deepening | PASS — strict Zod 4 request/success schemas and BE00 ApiError for all six operations. |
| 4 Authorization deepening | PASS — owner Full, reviewer, artist, provider and case-party capabilities include 403/404 behavior. |
| 5 Persistence deepening | PASS — every owned table lists SQL type, nullability, CHECK/FK/unique constraints, indexes, forced RLS and grants. |
| 6 Concurrency deepening | PASS — revision CAS, idempotency, per-destination scope, provider lookup, evidence append, and decision CAS are explicit. |
| 7 Seam deepening | PASS — exact request/response, timeout ms, retry count/backoff and circuit behavior for every seam. |
| 8 Observability deepening | PASS — every operation has audit, metric labels, trace fields, correlation and redaction. |
| 9 Test deepening | PASS — contract, handler, provider, case, RLS, property, outbox and recovery tests keyed to each operation. |
| 10 Ambiguity resolution | PASS — micro/macro, two-implementer and devil's-advocate reviews found no unresolved contract choice. |

## Ambiguity Gate

PASS.

- Micro ambiguity: date consequences, field/store classification, Full approval, accepted-delivery prerequisite, evidence scope, contest route, stricter fingerprint gate, provider reconciliation, explicit UGC decision, CORS, rate limits and ApiError are explicit.
- Macro ambiguity: 22c consumes 22a/22b facts and owns only DST-14 through DST-19. It does not author release build, partner message, enrichment, export, label, or distributor truth.
- Two-implementer test: one implementer can build handlers from route/contract/control registries; another can build migrations and lifecycle/provider/case workers from database/state/seam tables without a product question.
- Devil's-advocate test: stale date, missing delivery, evidence overreach, provider ambiguity, unresolved rights, wrong party, worker crash, and no user decision each have typed recovery.
- Decision lock: no date moves silently, no takedown erases provenance, no evidence broadens scope, no provider silence means registered, and no platform timeout becomes a UGC response.

## Open Questions

None.

## Dependency References

- BE00: inherit command admission, idempotency, audit, private schema boundary, RPC-only grants, forced RLS, provider-operation evidence, outbox leases, provider-native diagnostics correlation, CORS baseline, and ApiError { code, message, requestId, details }. No BE00 route is duplicated.
- 22a: consume date-plan, release/version, rights/footprint, identifier and canonical revision facts. Date changes and change plans fail closed on stale revisions.
- 22b: consume delivery snapshot/message/step/ack/store status and use its scoped update/takedown command seam; provider acceptance is never store-live proof.
- Shard 01: consume owner/artist authority and party standing; no identity or artist merge truth is authored here.
- Shard 06: consume assigned safety/rights cases, evidence scope, claim and contest routes; no general catalogue browsing.
- Shard 07: consume witnessed credit/provenance facts; lifecycle commands retain but do not rewrite them.
- Shard 09: consume exact audio-version authority and object descriptors; same-recording/new-version decisions remain explicit.
- Shard 10: consume rights, consent, territory, ownership and identifier facts; fingerprint gate is stricter but not a substitute rights authority.
- Shard 20: consume licensed-inclusion provenance through 22a.
- 22d: consumes lifecycle/claim events and retained provenance for exports, enrichment, catalogue migration, and label/distributor decisions.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Created BE-22c from approved IA Shard 22 split; mapped DST-14 through DST-19; added date/update/lifecycle/claims contracts, typed persistence/RLS, provider and evidence seams, state/recovery rules, events, tests, deepening passes, and ambiguity gate. | /write-be-spec with approved decision delegation. |
