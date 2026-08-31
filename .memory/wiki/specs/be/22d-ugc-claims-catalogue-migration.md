# BE-22d — UGC Claims, Catalogue Migration and Release Enrichment

Status: Complete

This specification turns Shard 22 interactions DST-20 through DST-22 into three Hono command endpoints. It owns catalogue export/import jobs, the retained release enrichment and descriptor-correction history, label copy, label distribution mandates, and immutable distributor-authority snapshots. It consumes the 22a-22c release, identifier, message, status and lifecycle facts without duplicating their routes or BE00 platform endpoints.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Classification | Multi-domain split, UGC/claims/catalogue migration/enrichment/label-authority subdomain | Approved Shard 22 split assigns DST-20 through DST-22 to 22d. |
| Backend surface | Authenticated Hono REST commands, resumable export workers, descriptor-authority proposals, mandate checks, and Supabase RPCs | IA Contracts lines 112-128; deep dive Label/MEAD/Descriptor lines 39-47 and Lifecycle/Exit lines 60-69. |
| Canonical owner | 22d owns catalogue_export_job, import_manifest, release_enrichment, release_descriptor_correction, release_label_copy, label_distribution_mandate, and distributor_authority_snapshot | IA Data Models lines 157-179. |
| Consumed authority | 22a-22c own release/readiness/delivery/status/lifecycle facts; Shards 01, 09, and 10 own identity/audio/rights facts | IA Dependency References lines 346-359. |
| Split validity | PASS: DST-20 through DST-22 have one migration/enrichment/label authority and no conflict with build, delivery, or lifecycle routes | IA interaction table lines 79-102. |

## Referenced Material Inventory

| Source file | Section and lines | Material consumed |
|---|---|---|
| .memory/wiki/specs/ia/22-release-distribution.md | Overview lines 7-20 | Catalogue, enrichment, label and exit source-of-truth boundary. |
| .memory/wiki/specs/ia/22-release-distribution.md | Acceptance Criteria lines 52-75 | Export, enrichment, descriptor correction, MEAD and distributor criteria. |
| .memory/wiki/specs/ia/22-release-distribution.md | Interactions lines 100-102 | DST-20 through DST-22 preconditions, behavior, completion, failure and recovery. |
| .memory/wiki/specs/ia/22-release-distribution.md | Global Interaction Rules lines 104-110 | Snapshot, notification, evidence and external-success rules. |
| .memory/wiki/specs/ia/22-release-distribution.md | Contracts lines 112-128 | Provenance, MEAD, correction, label/distributor enums and errors. |
| .memory/wiki/specs/ia/22-release-distribution.md | Data Models lines 157-179 | Export, import, enrichment, correction, label and mandate invariants. |
| .memory/wiki/specs/ia/22-release-distribution.md | Typed Field Registry lines 181-216 | Core field types and cardinality. |
| .memory/wiki/specs/ia/22-release-distribution.md | Access Control lines 218-240 | Owner, producer, label-org and partner-capability boundaries. |
| .memory/wiki/specs/ia/22-release-distribution.md | Event Schemas lines 252-272 | Export/enrichment/correction/label safe payloads and excluded data. |
| .memory/wiki/specs/ia/22-release-distribution.md | Dependency References lines 346-359 | BE00, Shards 01, 06, 07, 09, 10, 20, 37-39 directions. |
| .memory/wiki/specs/ia/deep-dives/22-release-distribution.md | Label/MEAD/Descriptor-Correction Algorithm lines 39-47 | Mandate/distributor pinning, retained enrichment, MEAD certification, correction authority and history. |
| .memory/wiki/specs/ia/deep-dives/22-release-distribution.md | Lifecycle, Claims and Exit Algorithm lines 60-69 | Portable export, witnessed-loss disclosure, identifier identity and exit behavior. |
| .memory/wiki/specs/ia/deep-dives/22-release-distribution.md | Cross-Shard Contracts lines 85-95 | Release, rights, audio, identity and delivery seams. |
| .memory/wiki/specs/be/00-infrastructure.md | Zod Contracts lines 112-200 | BE00 wire conventions, ApiError envelope, command metadata and job status. |
| .memory/wiki/specs/be/00-infrastructure.md | Database Schema lines 202-251 | Private schema, RPC-only access, RLS, grants, jobs, objects, outbox and audit. |
| .memory/wiki/specs/be/00-infrastructure.md | Middleware lines 253-297 | Middleware order, capability checks and CORS. |
| .memory/wiki/specs/be/00-infrastructure.md | Events lines 357-415 | Outbox envelope, lease and dedupe recovery. |
| .memory/wiki/specs/be/00-infrastructure.md | Error/Observability lines 416-461 | Boundary mapping, compensation, audit, metrics and traces. |
| .memory/wiki/specs/be/00-infrastructure.md | Testing Strategy lines 476-505 | Contract, RLS, provider and recovery obligations. |

## IA Source Map

### Assigned interactions

| IA interaction | Source trace | Backend operation | Canonical completion |
|---|---|---|---|
| DST-20 Owner migrates/exports catalogue | IA line 100 | BE22D-DST20 | Portable canonical/partner/message/status package and honest asserted import boundary. |
| DST-21 Owner enriches release descriptors | IA line 101 | BE22D-DST21 | One retained enrichment, append-only correction/proposal state, and independently sequenced MEAD eligibility. |
| DST-22 Owner sets label copy and distributor of record | IA line 102 | BE22D-DST22 | Justified five-field label copy and immutable destination-scoped authority snapshot. |

### Canonical Data Models

Literal names from IA Data Models lines 157-179:

release, release_version, release_recording_membership, release_label_copy, label_distribution_mandate, distributor_authority_snapshot, partner_knowledge_version, release_enrichment, release_descriptor_correction, release_finding, delivery_readiness_item, destination_selection, release_date_plan, delivery_snapshot, delivery_message, delivery_step, partner_ack, store_status, store_artist_link, release_asset_analysis, asset_rendition, release_change_plan, catalogue_lifecycle_command, fingerprint_registration, ugc_whitelist, ugc_claim_case, recording_identifier, release_identifier, catalogue_export_job, import_manifest.

22d owns catalogue_export_job, import_manifest, release_enrichment, release_descriptor_correction, release_label_copy, label_distribution_mandate, and distributor_authority_snapshot. It consumes release, release_version, partner_knowledge_version, delivery_snapshot, delivery_message, delivery_step, partner_ack, store_status, release_change_plan, catalogue_lifecycle_command, fingerprint_registration, ugc_claim_case, recording_identifier, release_identifier, and all remaining canonical models without rewriting them.

### Event Schemas

Literal names from IA Event Schemas lines 256-270:

distribution.release.changed.v1, distribution.readiness.changed.v1, distribution.footprint.changed.v1, distribution.date-plan.changed.v1, distribution.message.changed.v1, distribution.destination-status.changed.v1, distribution.catalogue-lifecycle.changed.v1, distribution.ugc-registration.changed.v1, distribution.identifier.changed.v1, release.enrichment.changed.v1, release.enrichment.delivered.v1, release.descriptor-correction.changed.v1, distribution.partner-capability.changed.v1, distribution.label-copy.changed.v1, distribution.export.changed.v1.

22d emits distribution.export.changed.v1, release.enrichment.changed.v1, release.descriptor-correction.changed.v1, and distribution.label-copy.changed.v1. MEAD delivery emits release.enrichment.delivered.v1 only when 22b confirms a certified partner operation; unsupported, unverified, and revoked capability skips emit no failure event.

## Endpoint Reconciliation

| IA interaction | HTTP operation | Command transaction | Success event |
|---|---|---|---|
| DST-20 | POST /api/v1/catalogue/exports | Authorize scope, snapshot canonical/partner/message/status/identifier/asset manifests, create resumable job, checksum package, and mark import provenance/losses. | distribution.export.changed.v1 |
| DST-21 | POST /api/v1/releases/:releaseId/enrichment | Retain one descriptor record, append corrections, resolve exact Shard 09 version authority/proposal, and schedule MEAD only for certified destination capability. | release.enrichment.changed.v1 or release.descriptor-correction.changed.v1 |
| DST-22 | POST /api/v1/releases/:releaseId/label-copy | Derive/justify five fields from Shard 10, verify eligible distributor/mandate for every destination, pin immutable authority snapshot, and recheck before dispatch. | distribution.label-copy.changed.v1 |

## API Endpoints

### Authoritative Route Registry

This is the only 22d route registry. Operation IDs are stable keys for every contract, error, authorization, idempotency, rate, observability and test row. 22a-22c and BE00 routes are inherited and not duplicated.

| Operation ID | Method | Path | Capability | Response |
|---|---|---|---|---|
| BE22D-DST20 | POST | /api/v1/catalogue/exports | catalogue.export | Dst20Success |
| BE22D-DST21 | POST | /api/v1/releases/:releaseId/enrichment | release.enrichment | Dst21Success |
| BE22D-DST22 | POST | /api/v1/releases/:releaseId/label-copy | release.label_copy | Dst22Success |

### Request/Response Contracts (Zod 4)

Every non-2xx response is ErrorResponse containing the BE00/global ApiError { code, message, requestId, details }. Unknown keys are rejected and route parameters are UUIDs.

~~~ts
import { z } from "zod";
const Uuid = z.uuid();
const Version = z.string().regex(/^[1-9]\d*$/);
const IdempotencyKey = z.string().min(1).max(128);
const DateTime = z.iso.datetime({ offset: true });
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const ApiError = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: Uuid,
  details: BE00ErrorDetails,
}).strict();
const ErrorResponse = z.object({ error: ApiError }).strict();

const ExportScope = z.object({
  releaseIds: z.array(Uuid).max(1000).default([]),
  recordingIds: z.array(Uuid).max(10000).default([]),
  destinationIds: z.array(Uuid).max(100).default([]),
}).strict().refine(v => v.releaseIds.length + v.recordingIds.length + v.destinationIds.length > 0,
  { message: "export scope must name at least one object" });
const Dst20Request = z.object({
  mode: z.enum(["export", "import"]),
  scope: ExportScope, format: z.enum(["zip_json", "ndjson"]),
  includeEvidence: z.boolean(), checksumAlgorithm: z.literal("sha256"),
  sourceObjectId: Uuid.optional(), idempotencyKey: IdempotencyKey,
}).strict().refine(v => v.mode !== "import" || Boolean(v.sourceObjectId),
  { path: ["sourceObjectId"], message: "import requires sourceObjectId" });
const Dst20Success = z.object({
  jobId: Uuid, manifestId: Uuid,
  state: z.enum(["queued", "running", "succeeded", "failed", "blocked"]),
  checksumAlgorithm: z.literal("sha256"),
  witnessedState: z.enum(["witnessed", "asserted_not_witnessed"]),
  checksumCount: z.number().int().min(0),
  lossDisclosure: z.array(z.string().min(1)),
  version: Version,
}).strict();

const Descriptor = z.object({
  field: z.string().min(1).max(128),
  value: z.union([z.string(), z.number(), z.boolean()]),
  provenance: z.enum(["witnessed", "inferred", "asserted"]),
  assertingPartyId: Uuid.optional(),
  exactAudioVersionId: Uuid.optional(),
}).strict().refine(v => v.provenance === "witnessed" || Boolean(v.assertingPartyId),
  { path: ["assertingPartyId"], message: "non-witnessed descriptor requires asserting party" });
const DescriptorCorrection = z.object({
  field: z.string().min(1).max(128),
  priorInferredValueHash: z.string().length(64),
  correctedValue: z.union([z.string(), z.number(), z.boolean()]),
  reason: z.string().min(1).max(2000),
  exactAudioVersionId: Uuid.optional(),
  sharedCorrectionId: Uuid.optional(),
}).strict();
const Dst21Request = z.object({
  releaseVersionId: Uuid, descriptors: z.array(Descriptor).min(1).max(200),
  corrections: z.array(DescriptorCorrection).max(200).default([]),
  targetDestinationIds: z.array(Uuid).max(100).default([]),
  idempotencyKey: IdempotencyKey,
}).strict();
const Dst21Success = z.object({
  enrichmentId: Uuid,
  state: z.enum(["retained", "proposal_pending", "version_appended", "blocked"]),
  propagationStates: z.array(z.enum([
    "release_local_only", "version_appended", "proposal_pending",
    "proposal_accepted", "proposal_rejected",
  ])),
  proposalIds: z.array(Uuid),
  meadEligibleDestinationIds: z.array(Uuid),
  version: Version,
}).strict();

const Distributor = z.object({
  kind: z.enum(["wejammin_delivery_entity", "owner_controlled_label_org"]),
  partyId: Uuid, mandateId: Uuid,
}).strict();
const Dst22Request = z.object({
  releaseVersionId: Uuid,
  pCopyright: z.string().min(1).max(256),
  cCopyright: z.string().min(1).max(256),
  labelName: z.string().min(1).max(256),
  catalogNumber: z.string().min(1).max(128),
  distributor: Distributor,
  fieldJustifications: z.record(z.enum([
    "pCopyright", "cCopyright", "labelName", "catalogNumber", "distributor",
  ]), z.string().min(1).max(2000)),
  controlVersion: Version, destinationIds: z.array(Uuid).min(1).max(100),
  idempotencyKey: IdempotencyKey,
}).strict();
const Dst22Success = z.object({
  labelCopyId: Uuid, authoritySnapshotId: Uuid,
  distributorKind: z.enum(["wejammin_delivery_entity", "owner_controlled_label_org"]),
  distributorPartyId: Uuid,
  state: z.enum(["draft", "justified", "pinned", "frozen", "blocked"]),
  version: Version,
}).strict();
~~~

### Contract Registry

| Operation ID | Request body | Success body | Canonical validation |
|---|---|---|---|
| BE22D-DST20 | Dst20Request | Dst20Success | Export is always available; import source/provenance is asserted and not witnessed with explicit losses. |
| BE22D-DST21 | Dst21Request | Dst21Success | One retained enrichment; inferred correction is local immediately and exact-version authority decides append/proposal. |
| BE22D-DST22 | Dst22Request | Dst22Success | Exactly five label-copy fields, justification per field, eligible distributor and destination-scoped mandate. |

### Error Registry

Every row returns ErrorResponse with BE00 ApiError { code, message, requestId, details }. details contain safe target, provenance state, authority revision, destination, checksum, retry, or remediation information only.

| Operation ID | 400 / 401 | 403 vs 404 | 409 | 422 domain errors | 429 / 5xx recovery |
|---|---|---|---|---|---|
| BE22D-DST20 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without export standing; NOT_FOUND hides scope/source object | CONFLICT on job/manifest revision | IDENTIFIER_CONFLICT, OWNERSHIP_RECORD_ABSENT | RATE_LIMITED; resumable job retains exact scope and safe retry. |
| BE22D-DST21 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without release/descriptor standing; NOT_FOUND hides release/audio version | DESCRIPTOR_CORRECTION_CONFLICT, VERSION_DESCRIPTOR_TARGET_STALE | MEAD_CERTIFICATION_EVIDENCE_REQUIRED, MEAD_CERTIFICATION_REVISION_CONFLICT | RATE_LIMITED; proposal/local correction persists independently of MEAD delivery. |
| BE22D-DST22 | INVALID_ARGUMENT, UNAUTHENTICATED | FORBIDDEN without owner/admin/label mandate; NOT_FOUND hides release/label org | LABEL_COPY_CONCURRENT_EDIT, CONFLICT | LABEL_COPY_JUSTIFICATION_REQUIRED, OWNERSHIP_RECORD_ABSENT, RELEASE_YEAR_UNSET, DISTRIBUTOR_NOT_ELIGIBLE, DISTRIBUTION_MANDATE_REQUIRED, DISTRIBUTOR_AUTHORITY_STALE | RATE_LIMITED; dispatch holds and never silently switches distributor. |

### Authorization and Middleware Registry

Each operation runs request ID/trace, authenticated session, acting-party capability, explicit CORS policy, rate limit, Zod validation, BE00 idempotency, RPC/job/seam, audit and outbox in that order. No body-supplied owner, distributor, witness, or evidence reference grants access.

| Operation ID | Roles and ownership | 403 rule | 404 rule | Middleware and CORS |
|---|---|---|---|---|
| BE22D-DST20 | Owner/admin with catalogue.export; import source must be owned or explicitly delegated. | FORBIDDEN without export standing or source-object purpose. | NOT_FOUND hides release/recording/destination/source object. | auth → acting-party → CORS distribution-api (allowlisted origins, no wildcard credentials) → rate → Zod → idempotency → job RPC. |
| BE22D-DST21 | Owner/admin; authorized Producer may submit exact audio-version correction; partner scheduler is worker-only. | FORBIDDEN for unrelated release, project, or audio-version authority. | NOT_FOUND hides release/enrichment/audio version. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → RPC. |
| BE22D-DST22 | Owner/admin with release.label_copy; label org control and destination mandate are verified server-side. | FORBIDDEN without owner/admin authority, control, or mandate capability. | NOT_FOUND hides release, label organization, mandate, or destination. | auth → acting-party → CORS distribution-api → rate → Zod → idempotency → RPC. |

### Idempotency and Concurrency Registry

| Operation ID | Key and replay | Version/CAS | Failure recovery |
|---|---|---|---|
| BE22D-DST20 | Key binds mode, normalized scope, format, evidence flag, and source checksum; replay returns same job/manifest. | Job/manifest CAS; package objects and checksums immutable. | Lease recovery resumes exact scope; import conflicts block without merging identifiers. |
| BE22D-DST21 | Key binds release version, descriptor/correction hashes and target destinations. | One release_enrichment row per release/version; correction history append-only; shared correction ID unique. | Exact-version authority appends once or creates proposal; MEAD skip/backlog never alters enrichment. |
| BE22D-DST22 | Key binds release/version, five fields, justifications, control version, mandate IDs and destinations. | Label edit CAS; authority snapshot immutable; frozen after delivery. | Concurrent edit returns typed conflict; stale mandate holds dispatch with no fallback. |

### Rate, CORS and SLO Registry

| Operation ID | Rate limit | CORS policy | SLO |
|---|---|---|---|
| BE22D-DST20 | 5/minute per actor and scope, burst 1 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 1,500 ms to enqueue; 10,000-record job ≤ 10 minutes. |
| BE22D-DST21 | 20/minute per actor and release, burst 4 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms to retain/propose; MEAD scheduling async. |
| BE22D-DST22 | 10/minute per actor and release, burst 2 | distribution-api, allowlisted origins, POST/OPTIONS | p95 ≤ 2,000 ms to pin or typed hold. |

### Observability Registry

| Operation ID | Audit | Metrics | Trace and redaction |
|---|---|---|---|
| BE22D-DST20 | catalogue.export.requested/completed or import.asserted with actor, scope, loss disclosure and checksum count | export_job_total by mode/state; export_bytes_total; import_loss_total | Scope IDs, checksums and witnessed state; no download tokens, URLs, PII or private evidence. |
| BE22D-DST21 | enrichment.changed and descriptor_correction.changed with provenance/authority/propagation state | enrichment_total by state; correction_total by propagation; mead_skip_total | Field names/hashes and version IDs; no raw pitch, audio, Song musical attributes, or provider secrets. |
| BE22D-DST22 | label_copy.changed and distributor_authority.checked with kind, mandate revision and decision | label_copy_total by state; mandate_hold_total; authority_stale_total | Field provenance and hashes; no private ownership documents or uncontrolled contact data. |

## Database Schema

All tables are in non-exposed platform_private with RLS enabled and forced. anon, browser direct table access, and broad service-role access are denied. Named security-invoker RPCs repeat actor, owner, Producer exact-version authority, label-org control, mandate scope, and export-purpose predicates. owner_id references identity.party(id).

| Table/model | All persistence fields with SQL type, nullability, constraints and FKs | Query indexes | RLS and grants |
|---|---|---|---|
| platform_private.catalogue_export_jobs / catalogue_export_job | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); mode export_mode NOT NULL CHECK IN export,import; scope jsonb NOT NULL CHECK scope contains at least one release/recording/destination ID; format export_format NOT NULL CHECK IN zip_json,ndjson; include_evidence boolean NOT NULL; checksum_algorithm text NOT NULL CHECK checksum_algorithm=sha256; source_object_id uuid NULL FK platform_private.object_records(id); manifest_id uuid NULL FK platform_private.import_manifests(id); state job_state NOT NULL CHECK IN queued,running,succeeded,failed,cancelled,blocked; witnessed_state witnessed_state NOT NULL CHECK IN witnessed,asserted_not_witnessed; loss_disclosure jsonb NOT NULL DEFAULT []; result_ref jsonb NULL; attempt_count integer NOT NULL DEFAULT 0 CHECK BETWEEN 0 AND 32; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique owner_id,mode,scope checksum | PK; owner_id,created_at DESC; state,updated_at; mode,state; source_object_id; manifest_id | Forced RLS owner/export capability; job worker leases exact scope; result/download ref exposed only through signed projection; no direct table grant. |
| platform_private.import_manifests / import_manifest | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); job_id uuid NOT NULL FK platform_private.catalogue_export_jobs(id); origin text NOT NULL CHECK length(origin)>0; scope jsonb NOT NULL; object_count integer NOT NULL CHECK >=0; record_count integer NOT NULL CHECK >=0; checksum_algorithm text NOT NULL CHECK checksum_algorithm=sha256; package_checksum bytea NOT NULL CHECK octet_length(package_checksum)=32; provenance_state witnessed_state NOT NULL CHECK IN witnessed,asserted_not_witnessed; witnessed_data_loss jsonb NOT NULL; identifier_conflicts jsonb NOT NULL DEFAULT []; state import_state NOT NULL CHECK IN received,validated,imported,blocked,failed; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique job_id | PK; job_id; owner_id,created_at DESC; state,updated_at; GIN identifier_conflicts | Forced RLS owner/import capability; imported facts are asserted/not witnessed unless evidence explicitly supports witnessing; conflict rows are read-only to import worker; no direct grant. |
| platform_private.release_enrichments / release_enrichment | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); release_version_id uuid NOT NULL FK platform_private.release_versions(id); recording_id uuid NULL FK catalog.recordings(id); exact_audio_version_id uuid NULL FK audio.audio_versions(id); descriptor_set jsonb NOT NULL; descriptor_provenance descriptor_provenance NOT NULL CHECK IN witnessed,inferred,asserted; asserting_party_id uuid NULL FK identity.party(id); current_projection jsonb NOT NULL; correction_history jsonb NOT NULL DEFAULT []; mead_state enrichment_state NOT NULL CHECK IN retained,eligible,skipped,delivered; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique release_version_id,recording_id | PK; release_version_id,recording_id; mead_state,updated_at; exact_audio_version_id; owner_id,created_at DESC | Forced RLS release owner/authorized Producer read/write through enrichment RPC; one retained row is projected to MEAD/editorial; no Song musical-attribute column; partner worker reads bounded projection only. |
| platform_private.release_descriptor_corrections / release_descriptor_correction | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); release_enrichment_id uuid NOT NULL FK platform_private.release_enrichments(id); release_version_id uuid NOT NULL FK platform_private.release_versions(id); field text NOT NULL CHECK length(field)>0; prior_inferred_value_hash bytea NOT NULL CHECK octet_length(prior_inferred_value_hash)=32; corrected_value jsonb NOT NULL; reason text NOT NULL CHECK length(reason)>0; submitting_actor_party_id uuid NOT NULL FK identity.party(id); exact_audio_version_id uuid NULL FK audio.audio_versions(id); authority_decision authority_decision NOT NULL CHECK IN not_checked,authorized,proposal_required,accepted,rejected; authority_version bigint NULL CHECK authority_version>0; shared_correction_id uuid NULL; propagation_state descriptor_correction_propagation_state NOT NULL CHECK IN release_local_only,version_appended,proposal_pending,proposal_accepted,proposal_rejected; shard09_reference text NULL; reviewer_party_id uuid NULL FK identity.party(id); reviewer_reason text NULL; appended_at timestamptz NOT NULL DEFAULT now(); version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique release_enrichment_id,shared_correction_id where shared_correction_id is not null | PK; release_enrichment_id,appended_at DESC; exact_audio_version_id,field; propagation_state,updated_at; shared_correction_id | Forced RLS release owner/authorized Producer and Shard 09 proposal worker; immutable append-only; no UPDATE/DELETE of correction value/history; proposal cannot grant project read/write. |
| platform_private.release_label_copies / release_label_copy | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); release_version_id uuid NOT NULL FK platform_private.release_versions(id); p_copyright text NOT NULL CHECK length(p_copyright)>0; c_copyright text NOT NULL CHECK length(c_copyright)>0; label_name text NOT NULL CHECK length(label_name)>0; catalog_number text NOT NULL CHECK length(catalog_number)>0; distributor_kind distributor_of_record_kind NOT NULL CHECK IN wejammin_delivery_entity,owner_controlled_label_org; distributor_party_id uuid NOT NULL FK identity.party(id); field_provenance jsonb NOT NULL; field_justifications jsonb NOT NULL; authority_snapshot_id uuid NULL FK platform_private.distributor_authority_snapshots(id); state label_copy_state NOT NULL CHECK IN draft,justified,pinned,frozen,blocked; version bigint NOT NULL CHECK >0; frozen_at timestamptz NULL; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique release_version_id,version | PK; release_version_id,state,updated_at DESC; distributor_party_id; authority_snapshot_id; owner_id,created_at DESC | Forced RLS release owner/admin; derived rights/year values read from Shard 10; every override needs field justification; frozen after delivery; no direct browser grant. |
| platform_private.label_distribution_mandates / label_distribution_mandate | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); label_organization_id uuid NOT NULL FK identity.parties(id); verifying_actor_party_id uuid NOT NULL FK identity.party(id); evidence_ref text NOT NULL; destination_ids uuid[] NOT NULL CHECK cardinality>0; effective_at timestamptz NOT NULL; expires_at timestamptz NOT NULL CHECK expires_at>effective_at; revoked_at timestamptz NULL; state mandate_state NOT NULL CHECK IN pending,verified,expired,revoked; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique label_organization_id,version | PK; label_organization_id,state,expires_at; GIN destination_ids; verifying_actor_party_id; effective_at,expires_at | Forced RLS label organization and distribution verifier; destination-scoped current mandate only; mandate does not grant Shard 01 organization control; evidence ref purpose-bound; no anonymous/authenticated table grant. |
| platform_private.distributor_authority_snapshots / distributor_authority_snapshot | id uuid NOT NULL PK; owner_id uuid NOT NULL FK identity.party(id); release_version_id uuid NOT NULL FK platform_private.release_versions(id); label_copy_id uuid NOT NULL FK platform_private.release_label_copies(id); distributor_kind distributor_of_record_kind NOT NULL CHECK IN wejammin_delivery_entity,owner_controlled_label_org; distributor_party_id uuid NOT NULL FK identity.party(id); shard01_organization_id uuid NULL FK identity.parties(id); shard01_control_version bigint NULL CHECK shard01_control_version>0; mandate_id uuid NULL FK platform_private.label_distribution_mandates(id); mandate_version bigint NULL CHECK mandate_version>0; destination_ids_hash bytea NOT NULL CHECK octet_length(destination_ids_hash)=32; checked_at timestamptz NOT NULL; valid_through timestamptz NULL CHECK valid_through>checked_at; consequence_acknowledgement jsonb NOT NULL; state authority_snapshot_state NOT NULL CHECK IN valid,stale,revoked; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); unique release_version_id,label_copy_id,version | PK; release_version_id,state; distributor_party_id,state; mandate_id,valid_through; destination_ids_hash | Forced RLS release owner/read-only delivery gate; immutable snapshot; dispatch recheck can mark stale but never substitute distributor; no direct browser grant. |

### Shared persistence invariants

- Export contains canonical release/recording facts, partner/message/status history, identifiers, assets, evidence manifests, checksums, and a witnessed-loss disclosure. Import never upgrades asserted data to witnessed.
- One release_enrichment is retained even when no destination is MEAD-certified. It is independently sequenced from ERN; unsupported, unverified, or revoked capability skips before generation/send with no failure event.
- An inferred correction appends the release-local value immediately. Exact Shard 09 audio-version authority permits one shared-ID dual append; otherwise a pending proposal is created. Accepted proposals project witnessed facts; rejected proposals preserve local history.
- Label copy has exactly five fields: (P), (C), label name, catalog number, and distributor of record. Distributor is only the configured WeJammin delivery entity or an owner-controlled Shard 01 label organization with a current destination-scoped mandate.
- Domain rows, audit_private.audit_events, provider_operations, jobs, and platform_private.outbox_events commit atomically. Secrets, media, private rights proof, and export URLs remain outside events/logs.
- BE00 idempotency binds actor, operation, request hash, and job/enrichment/label target. Registered failures replay without duplicate import, correction, proposal, MEAD scheduling, label edit, or authority snapshot.

## Middleware & Policies

### Hono order and security

1. Attach request ID, trace ID, operation ID, bounded body limit, and correlation context.
2. Apply CORS policy distribution-api: explicit allowlisted product origins, POST and OPTIONS only, no wildcard credential mode, Vary: Origin.
3. Authenticate session, resolve acting party, owner/Producer exact-version authority, label control, mandate scope, and export purpose.
4. Apply operation/actor/release scope rate limit.
5. Validate path/body with the operation Zod 4 schema; reject unknown keys before any existence-sensitive lookup.
6. Reserve inherited BE00 idempotency; request-hash mismatch returns CONFLICT without side effects.
7. Call named security-invoker RPC/job/seam with expected revision and lease.
8. Append audit/outbox atomically; return only the Success schema.

### Policy rules

| Policy | Required behavior |
|---|---|
| Export | Export is always available to an authorized owner and is not withheld for commercial or partner-access reasons. Scope is exact and resumable. |
| Import | Origin, checksums, asserted/witnessed state, and every witnessed-data loss are shown. Conflicting ISRC evidence blocks merge and routes to Shards 06/10. |
| Enrichment | Witnessed, inferred, and asserted provenance are separate. Inferred values are never delivered as artist assertions; no Song musical attributes are authored. |
| Correction | Release-local correction is immediate. Exact Shard 09 version authority is required for a shared append; absent authority creates a proposal without privilege escalation. |
| MEAD | Partner defaults unsupported. Only destination-specific certified capability with adapter/profile evidence may generate/send. Certification never inherits; revocation stops new work while history remains. |
| Label copy | Shard 10 ownership and release year derive (P)/(C) values. Overrides require per-field justification and co-owner visibility. |
| Distributor | Only configured WeJammin delivery entity or owner-controlled Shard 01 label org with current verified mandate covering every destination. Authority is pinned and rechecked; no silent fallback. |
| Protected data | Events/logs expose IDs, hashes, state, provenance class, counts, and safe loss classes only. They exclude audio, pitch text, claimant/contact PII, private rights evidence, secrets, and download URLs. |

## Data Flow

### DST-20 catalogue export/import

POST → auth/export standing → normalize exact scope → snapshot 22a canonical and 22b/22c delivery/lifecycle evidence plus IDs/assets/manifests → create leased job → write checksummed package → complete export or validate imported package → mark asserted/not witnessed and loss disclosures → audit/outbox. A job timeout never implies a downloadable result.

### DST-21 enrichment and correction

POST → read canonical release/recording/audio version → retain one enrichment with per-field provenance → append inferred correction locally → ask exact Shard 09 version authority → dual append once when authorized or create version-owner/Producer proposal → resolve each immutable partner knowledge version → schedule MEAD only when capability is certified. MEAD and editorial project the same retained record.

Unsupported, unverified, or revoked MEAD capability skips before generation and emits no error event. A newly certified version unlocks retained backlog idempotently; revocation stops new work without deleting delivered history.

### DST-22 label/distributor

POST → derive ownership/year facts from Shard 10 → validate exactly five fields and justifications → resolve WeJammin entity or Shard 01 label control/mandate for every destination → persist label copy and immutable authority snapshot → recheck snapshot at 22b dispatch. Loss of control/mandate holds delivery; it never substitutes WeJammin or another distributor.

## State Machines, Concurrency and Failure Recovery

| Aggregate | States and transitions | Guard |
|---|---|---|
| catalogue_export_job | queued → running → succeeded, failed, cancelled, or blocked. | Job lease/CAS; terminal result immutable; retry preserves exact scope. |
| import_manifest | received → validated → imported; invalid/conflicting package → blocked/failed. | Checksums and provenance/loss disclosure required; asserted data never becomes witnessed. |
| release_enrichment | retained → eligible → delivered or skipped; skip is normal for unsupported/unverified/revoked MEAD. | One record per release/version/recording; ERN never waits on MEAD. |
| release_descriptor_correction | release_local_only → version_appended; unauthorized target → proposal_pending → proposal_accepted or proposal_rejected. | Exact audio-version authority; append-only history; no last-write-wins. |
| release_label_copy | draft → justified → pinned → frozen; invalid/stale authority → blocked. | Five fields/justifications and current authority; frozen after delivery. |
| label_distribution_mandate | pending → verified → expired/revoked. | Destination scope and current verified control required. |
| distributor_authority_snapshot | valid → stale/revoked. | Immutable check; stale snapshot holds dispatch and cannot trigger fallback. |

| Failure | Transaction outcome | Recovery |
|---|---|---|
| Same idempotency key/hash | Replay stored job/enrichment/label result. | No duplicate package, correction, proposal, MEAD schedule, or label snapshot. |
| Hash or revision CAS loss | No domain/provider write. | Return CONFLICT and require fresh explicit revision. |
| Export worker crash | Lease expires; exact job remains queued/running. | Reclaim bounded attempts; only checksummed completion returns succeeded. |
| Import checksum/identifier conflict | Manifest blocked; no merge. | Route conflict to rights/trust review; preserve asserted package and loss disclosure. |
| Shard 09 authority unavailable | Local correction remains; no upstream write. | Retry read; create proposal only after exact target is identified. |
| MEAD profile unsupported/revoked | No message generation/send and no failure event. | Retain enrichment; certified successor unlocks backlog. |
| Label mandate/control stale | Label write or dispatch holds; no fallback. | Obtain fresh verified mandate/control and create new authority snapshot. |
| Outbox/provider failure | Domain evidence remains committed. | BE00 lease sweeper reclaims and dedupes by event identity/provider key. |

## External Seams

No seam is successful without the exact response evidence below. All failures return BE00 ApiError { code, message, requestId, details } and preserve canonical state.

| Seam | Exact request | Exact response | Timeout | Retries/backoff | Circuit behavior |
|---|---|---|---:|---|---|
| 22a/22b/22c export snapshot RPC | scope, releaseVersionIds, includeEvidence, requestedRevision | canonicalPackageRefs, message/status/lifecycle refs, identifierRefs, assetManifestRefs, snapshotHash | 2,000 ms | 2 reads at 200 ms and 600 ms; no retry after job commit without lookup | Open 30 s after 5 failures in 60 s; job remains queued/blocked. |
| Object storage export worker | jobId, scope, objectRefs, checksumAlgorithm sha256 | resultObjectId, manifestId, packageChecksum, checksumCount, state succeeded/failed | 5,000 ms per chunk | 3 chunk attempts at 500 ms, 1,500 ms, and 3,000 ms; same chunk key | Open 60 s after 5 failures; job resumes at last committed chunk. |
| Shard 09 descriptor authority RPC | recordingId, exactAudioVersionId, field, correctionHash, actorPartyId | authorityState authorized/proposal_required/rejected, versionOwnerPartyId, audioVersionRevision, proposalRef | 1,200 ms | 1 read retry at 250 ms; no mutation retry after CAS ambiguity | Open 30 s after 4 failures; local correction remains. |
| Shard 10 ownership/year RPC | releaseVersionId, fieldSet pCopyright/cCopyright, actorPartyId | ownershipRecordVersion, releaseYear, derivedFields, authorityState resolved/absent/stale | 1,200 ms | 1 read retry at 250 ms | Open 30 s after 4 failures; label copy blocked with OWNERSHIP_RECORD_ABSENT or RELEASE_YEAR_UNSET. |
| Shard 01 label control/mandate RPC | labelOrganizationId, destinationIds, requestedMandateId, controlVersion | controlState verified/stale/revoked, mandateState verified/expired/revoked, mandateVersion, coveredDestinationIds | 1,500 ms | 1 read retry at 300 ms; exact revision required | Open 30 s after 4 failures; distributor authority stale, no fallback. |
| Partner capability registry | destinationId, releaseType, messageKind mead, requestedAt | knowledgeVersion, meadCapabilityState unsupported/certified/revoked, evidenceHash, adapterVersion, validThrough | 1,200 ms | 1 read retry at 250 ms | Open 30 s after 4 failures; skip with no failure event. |
| 22b MEAD delivery seam | enrichmentId, releaseVersionId, destinationId, knowledgeVersion, enrichmentHash, idempotencyKey | messageId or null, providerOperationId, state queued/sent/accepted/rejected, version | 2,000 ms | 1 pre-commit retry at 300 ms; lookup after ambiguity | Open 30 s after 4 failures; retained enrichment unaffected. |

## Events and Async Consumers

### Event envelope

Every outbox event inherits BE00:

~~~ts
type DistributionEvent = {
  eventId: string;
  eventType: string;
  schemaVersion: 1;
  aggregateType: "catalogue_export_job" | "release_enrichment" | "release_descriptor_correction" | "release_label_copy";
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
| BE22D-DST20 | distribution.export.changed.v1 | job/scope/state/version/checksum count/witnessed state | User task board; download URL and private records excluded. |
| BE22D-DST21 | release.enrichment.changed.v1 | release/partner/kind/state/version/provenance class | MEAD scheduler/editorial projection; unsupported skip has no failure event. |
| BE22D-DST21 | release.descriptor-correction.changed.v1 | release/exact audio version/field/shared correction/propagation/version | Shard 09/link projection/editorial; no corrected value or Song attributes. |
| BE22D-DST21 | release.enrichment.delivered.v1 | release/partner/kind/state/version | Emitted only after 22b confirms certified delivery. |
| BE22D-DST22 | distribution.label-copy.changed.v1 | release/version/field provenance/distributor kind and party/authority hash/state/version | Co-owners/rights/delivery gate; private ownership evidence excluded. |

Consumers dedupe by eventId and aggregate identity/version. Outbox insertion is atomic, lease expiry recovers crashes, and consumers cannot rewrite enrichment history, label copy, mandates, or import provenance. A MEAD skip never emits an error event.

## Error Handling

### Boundary matrix

| Boundary | Mapping |
|---|---|
| Zod/path/body failure | HTTP 400 INVALID_ARGUMENT with safe field paths and expected type. |
| Missing/expired session | HTTP 401 UNAUTHENTICATED without existence detail. |
| Owner/Producer/label/export capability failure | HTTP 403 FORBIDDEN and denied audit. |
| Hidden/absent release/audio/mandate/source | HTTP 404 NOT_FOUND, same for wrong-party probes. |
| Revision, idempotency, authority, or shared-correction CAS conflict | HTTP 409 CONFLICT with current version only when visible. |
| Export/import gate failure | HTTP 422 IDENTIFIER_CONFLICT, OWNERSHIP_RECORD_ABSENT, or IMPORT_PROVENANCE_INVALID. |
| Enrichment/correction gate failure | HTTP 422 MEAD_CERTIFICATION_EVIDENCE_REQUIRED, MEAD_CERTIFICATION_REVISION_CONFLICT, DESCRIPTOR_CORRECTION_CONFLICT, or VERSION_DESCRIPTOR_TARGET_STALE. |
| Label/distributor gate failure | HTTP 422 LABEL_COPY_JUSTIFICATION_REQUIRED, RELEASE_YEAR_UNSET, DISTRIBUTOR_NOT_ELIGIBLE, DISTRIBUTION_MANDATE_REQUIRED, or DISTRIBUTOR_AUTHORITY_STALE. |
| Rate limit | HTTP 429 RATE_LIMITED with bounded Retry-After. |
| Cross-shard/worker timeout or malformed response | HTTP 503 DEPENDENCY_UNAVAILABLE; prior truth and retry state retained. |
| Unhandled error | HTTP 500 INTERNAL; cause remains in provider-native structured logs keyed by requestId. |

### Error invariants

- Every error is ErrorResponse with BE00 ApiError { code, message, requestId, details }. details exclude media, tokens, private rights/ownership documents, claim PII, provider payloads, and export URLs.
- Export is never withheld; a long job is resumable and reports exact scope/checksums. Import conflict blocks merge while preserving asserted source and loss disclosure.
- MEAD is optional and independent: unsupported/unverified/revoked capability skips before generation/send without an error event or ERN failure.
- Descriptor correction never mutates Song/history. Unauthorized exact-version correction becomes a proposal; rejection leaves the release-local correction.
- Label/distributor stale authority writes nothing and never silently substitutes a distributor. Label copy freezes only after the valid delivery boundary.

## Testing Strategy

| Operation ID | Contract and handler tests | Authorization, persistence, recovery |
|---|---|---|
| BE22D-DST20 | Mode/scope refinement, format/checksum closure, import source requirement, loss/witnessed response. | Owner export standing, source RLS, job lease/resume, chunk checksums, import identifier conflict, always-available export and URL redaction. |
| BE22D-DST21 | Provenance closure, correction authority fields, propagation states, target destination arrays, MEAD success/skip response. | Exact Shard 09 authority, local/proposal/accept/reject history, partner certification/revocation, no Song mutation, event suppression on skip. |
| BE22D-DST22 | Five fields, per-field justification, distributor enum, destination mandate, authority response. | Shard 10 ownership/year, Shard 01 control/mandate, concurrent edit, stale dispatch recheck, frozen copy, no fallback. |

### Cross-cutting tests

- Contract tests validate all three operation schemas and every non-2xx response against ErrorResponse and BE00 ApiError.
- Property tests prove exports preserve checksums/loss disclosures, inferred correction history is append-only, MEAD never gates ERN, and stale authority cannot select a fallback distributor.
- Integration tests use deterministic 22a-22c, Shard 01/09/10, object-store, capability-registry and MEAD fakes with timeout, duplicate, malformed response and circuit-open cases.
- RLS tests cover anonymous, correct owner, wrong user, wrong party, unauthorized Producer, stale control, expired mandate, service credential misuse and over-disclosure.
- Event tests verify atomic outbox, eventId dedupe, lease recovery, safe payload exclusion, no failure event for capability skip, and delivered event only after confirmed 22b response.

## Deepening Passes

| Pass | Result and evidence |
|---|---|
| 1 Source normalization | PASS — DST-20 through DST-22 each map one-to-one to a route and exact IA line. |
| 2 Boundary review | PASS — 22d owns migration/enrichment/label authority; 22a-22c remain authoritative for release, delivery, status and lifecycle facts. |
| 3 Contract deepening | PASS — strict Zod 4 request/success schemas and BE00 ApiError for all three operations. |
| 4 Authorization deepening | PASS — owner, Producer exact-version, export, mandate and partner-capability boundaries include 403/404 behavior. |
| 5 Persistence deepening | PASS — every owned table lists SQL type, nullability, CHECK/FK/unique constraints, indexes, forced RLS and grants. |
| 6 Concurrency deepening | PASS — job leases, checksums, correction append/shared IDs, capability revision, label CAS, mandate snapshot and idempotency are explicit. |
| 7 Seam deepening | PASS — exact request/response, timeout ms, retry count/backoff and circuit behavior for every seam. |
| 8 Observability deepening | PASS — every operation has audit, metric labels, trace fields, correlation and redaction. |
| 9 Test deepening | PASS — contract, handler, provider, RLS, property, export, correction, event and recovery tests keyed to each operation. |
| 10 Ambiguity resolution | PASS — micro/macro, two-implementer and devil's-advocate reviews found no unresolved contract choice. |

## Ambiguity Gate

PASS.

- Micro ambiguity: export/import mode and loss state, descriptor provenance, exact audio-version authority, shared correction, MEAD capability, five label fields, mandate destination scope, distributor kind, frozen boundary, CORS, rate limits and ApiError are explicit.
- Macro ambiguity: 22d owns only DST-20 through DST-22. 22a owns build/readiness facts, 22b delivery, and 22c lifecycle/UGC registration; Shards 01/09/10 remain identity/audio/rights authorities.
- Two-implementer test: one implementer can build handlers from route/contract/control registries; another can build migrations, workers and cross-shard RPC adapters from schema/state/seam tables without a product question.
- Devil's-advocate test: export outage, import conflict, profile revocation, unauthorized correction, proposal rejection, stale mandate, concurrent label edit, dispatch recheck, and unavailable dependency each have typed recovery.
- Decision lock: exports stay available, imports never fabricate witnessing, MEAD never gates ERN, Song/history never mutates, and distributor control loss never triggers silent fallback.

## Open Questions

None.

## Dependency References

- BE00: inherit command admission, idempotency, audit, private schema boundary, RPC-only grants, forced RLS, jobs, provider operations, outbox leases, provider-native diagnostics correlation, CORS baseline, and ApiError { code, message, requestId, details }. No BE00 route is duplicated.
- 22a: consume release/version/readiness/identifier and canonical descriptor inputs; enrichment and label writes fail closed on stale version.
- 22b: consume message/status history and certified MEAD dispatch seam; emitted delivered event requires confirmed 22b response.
- 22c: consume lifecycle, takedown, fingerprint and claim history for complete export and provenance; 22d never rewrites it.
- Shard 01: consume identity, owner/label control, destination mandate and artist authority; label organizations do not gain control from a mandate.
- Shard 06: consume rights/trust conflict paths for import identifiers and claim evidence; no merge occurs here.
- Shard 07: consume witnessed credits/provenance for enrichment projection; no credit history mutation.
- Shard 09: consume exact audio-version descriptor authority and proposal path; Song has no musical attributes.
- Shard 10: consume ownership, release year, rights, consent, territory and identifier facts; derived label copy remains justified and auditable.
- Shard 20: consume licensed inclusion provenance through 22a.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Created BE-22d from approved IA Shard 22 split; mapped DST-20 through DST-22; added export/import, enrichment/correction, MEAD, label/distributor contracts, typed persistence/RLS, seams, state/recovery rules, events, tests, deepening passes, and ambiguity gate. | /write-be-spec with approved decision delegation. |
