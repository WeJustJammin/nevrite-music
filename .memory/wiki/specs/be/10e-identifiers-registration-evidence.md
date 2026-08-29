# Identifiers, Registration and Rights Evidence — Backend Specification

## Split Group

Shard 10 rights and ownership, split 10e. This companion owns identifier assertions and allocations, creation-proof timestamps, registration drafts, publication-safe rights projections and signed agreement/title-chain exports for RGT-17 through RGT-20. It does not allocate legal ownership, adjudicate conflicts, file registrations automatically or expose private ledger data through public lookup.

## Classification

| Capability | Classification | Boundary decision |
|---|---|---|
| RGT-17 allocate or reconcile identifier | Approved-adapter command | Preflight checks internal and external identifiers before reservation. Retries use one stable request key. Conflicts rank recommendations; owners confirm canonical value. Later-activation capability remains gated. |
| RGT-18 prepare registration | Reviewable draft command | Pins jurisdiction, form, source ledger/title versions, group, gaps and deadline. Filing is a separate capability and never occurs automatically. |
| RGT-19 view private or public rights evidence | Viewer-scoped query | Named parties receive full authorized evidence; public viewers receive a dedicated allowlisted projection with holders, contact, one-stop and provenance, never percentages or disputes. |
| RGT-20 export signed agreement or title chain | Pinned artifact command | Pins exact right, territory, period, current evidence and source versions. Mixed-version or unauthorized exports fail before artifact creation. |

BE00 inheritance is mandatory for every operation: requestId, authenticated acting context, strict Zod 4 parsing, idempotency ledger, audit/outbox, CORS, rate limits, RLS and ApiError { code, message, requestId, details }. Platform endpoints are not duplicated.

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 10](../ia/10-rights-ownership.md) | Interactions, lines 66–89 | RGT-17 through RGT-20 preconditions, adapter, registration, privacy and export behavior. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Core Types and Errors, lines 100–111 | RightType, TrustLevel, StandardError and identifier-provider refusal. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Agreements, Lifecycle and Evidence contracts, lines 125–145 | RecordSuccession, AnchorCreationProof and evidence boundaries. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Data Models, lines 147–206 | identifier_assertion, identifier_allocation, creation_timestamp, registration_draft, public_rights_projection and rights_audit_event. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Access Control and Accessibility, lines 208–242 | Registration/identifier operator, public, owner, estate and system-worker permissions and receipts. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Event Schemas and Edge Cases, lines 243–306 | Identifier and creation-proof event payloads, public/private projection and export recovery. |
| [Deep Dive 10](../ia/deep-dives/10-rights-ownership.md) | AI, NIL, Identifier and Evidence Algorithms, lines 127–135 | Idempotent identifier preflight, creation proof, registration draft and public allowlist rules. |
| [Deep Dive 10](../ia/deep-dives/10-rights-ownership.md) | Abuse and Recovery Verification, lines 137–153 | Identifier retry, anchor outage, public dispute leakage and asserted-data safeguards. |
| [BE00](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) | Global request, error, middleware and deterministic protocol contracts | Exact ApiError, request IDs, idempotency, audit/outbox, CORS, storage and fail-closed inheritance. |

## IA Source Map

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| RGT-17 Allocate/reconcile identifier | RGT-ID-API-01 | Requires approved adapter/profile and completed preflight, reserves idempotently, ranks conflicts and never asserts legal ownership. |
| RGT-18 Prepare registration | RGT-ID-API-02 | Pins jurisdiction/form/source versions, group, gaps and deadline for review; no automatic filing or copyright claim. |
| RGT-19 View private/public rights evidence | RGT-ID-API-03 | Private named-party view is separate from public allowlisted projection; public never falls back to private ledger or exposes percentages/disputes. |
| RGT-20 Export signed agreement/title chain | RGT-ID-API-04 | Requires exact right/territory/period and current evidence/source versions; mixed-version, unauthorized or failed export produces no artifact. |

## Endpoint Completeness Reconciliation

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| RGT-17 | Allocate or reconcile scheme identifier | RGT-ID-API-01 | Preflight manifest, stable request key, allocation/assertion state and ranked conflict result. |
| RGT-18 | Prepare reviewed registration draft | RGT-ID-API-02 | Jurisdiction/form/source manifest, group, gaps and review deadline with no filing effect. |
| RGT-19 | Serve private or public evidence view | RGT-ID-API-03 | Viewer-scoped projection, provenance labels and safe unavailable state. |
| RGT-20 | Export signed agreement/title chain | RGT-ID-API-04 | Immutable scoped artifact/checksum/receipt only after version-consistent authorized generation. |

## API Endpoints

### Authoritative Route Registry

This is the sole route registry for this companion. Every contract, error, authorization, idempotency, rate, observability, middleware and test row keys to one operation ID.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| RGT-ID-API-01 | POST | /api/v1/rights/identifiers/reconciliations | RGT-17 | Approved identifier operator with registrant profile for the object and scheme. | 201 ReconcileIdentifierSuccess |
| RGT-ID-API-02 | POST | /api/v1/rights/registration-drafts | RGT-18 | Actor authorized to read every object and source version in the registration group. | 201 PrepareRegistrationSuccess |
| RGT-ID-API-03 | POST | /api/v1/rights/evidence-views | RGT-19 | Named party for private view or public viewer for allowlisted projection. | 200 ViewRightsEvidenceSuccess |
| RGT-ID-API-04 | POST | /api/v1/rights/signed-chain-exports | RGT-20 | Actor authorized to read every record in the exact pinned scope. | 202 ExportSignedChainSuccess |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 acting-context verifier | {accessToken, actingContextId, resourceId, requiredRole} → {actorId, partyId, roles, mandateVersion, contextVersion} | 300 ms | 2 retries at 50 ms and 150 ms before mutation | Open after 5 failures in 30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| Approved identifier provider | {scheme, registrantProfileId, objectId, preflightHash, requestKey} → {providerValue, providerReference, allocationState, providerVersion} | 1200 ms | 3 retries at 200 ms, 600 ms and 1800 ms only with same request key | Open after 5 failures in 60 s; return IDENTIFIER_PROVIDER_FAILED and preserve reservation state; half-open after 30 s. |
| Shard 01 registrant and representation resolver | {actorId, profileId, objectId, requiredOperatorRole} → {profileState, authorityVersion, registrantScope, representationClass} | 500 ms | 2 retries at 75 ms and 225 ms; stale authority rejected | Open after 4 failures in 30 s; allocation stops with FORBIDDEN or dependency error; half-open after 20 s. |
| 10a object, ledger and title resolver | {objectIds, rightType, territory, period, sourceVersions} → {objects, ledgerStates, titleEvents, consentState, versions} | 700 ms | 2 retries at 100 ms and 300 ms with expected versions | Open after 4 failures in 30 s; registration/export remains pending and no mixed artifact is generated; half-open after 20 s. |
| Shard 09 source/project resolver | {sourceProjectId, sourceVersionIds, objectIds} → {sourceValues, readable, sourceHashes, versions} | 700 ms | 2 retries at 100 ms and 300 ms using same read key | Open after 4 failures in 30 s; draft/export returns VERSION_CONFLICT or DEPENDENCY_UNAVAILABLE; half-open after 20 s. |
| BE00 signed artifact storage | {artifactHash, scopeHash, authorizedObjectId, expiry} → {objectKey, checksum, receiptId} | 1200 ms | 3 retries at 300 ms, 900 ms and 2700 ms with same artifact key | Open after 5 failures in 60 s; no artifact/checksum/receipt is returned; half-open after 30 s. |
| BE00 audit and outbox | {eventType, aggregateId, version, requestId} → {auditId, outboxId, acceptedAt} | 400 ms | 3 retries at 100 ms, 300 ms and 900 ms | Open after 5 failures in 30 s; canonical state commits with dispatch pending; half-open after 15 s. |

## Request/Response Contracts

All mutation requests require Idempotency-Key and canonical body hashing. Public evidence view has a stable query key and no mutation. Every failure uses ApiError { code, message, requestId, details }.

### Zod 4 Contract Definitions

```typescript
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const RightTypeSchema = z.enum([
  "composition_writer", "composition_publisher", "master", "performer",
  "neighbouring", "nil", "ai_training", "security_interest"
]);
const RationalSchema = z.strictObject({
  numerator: z.int().positive(),
  denominator: z.int().positive()
});
const ApiErrorSchema = z.strictObject({
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: z.uuid(),
  details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)
});

export const ReconcileIdentifierRequest = z.strictObject({
  objectId: z.uuid(),
  scheme: z.string().min(1).max(64),
  registrantProfileId: z.uuid(),
  preflightHash: z.string().length(64),
  existingIdentifierRefs: z.array(z.string().min(1).max(256)).max(100),
  candidateValue: z.string().min(1).max(256),
  requestKey: z.string().min(32).max(128),
  expectedObjectVersion: z.int().positive()
});
export const ReconcileIdentifierSuccess = z.strictObject({
  assertionId: z.uuid(),
  allocationId: z.uuid().nullable(),
  state: z.enum(["ranked", "allocated", "conflict", "provider_failed"]),
  canonicalConfirmed: z.literal(false),
  requestId: z.uuid()
});

export const PrepareRegistrationRequest = z.strictObject({
  ownerContextId: z.uuid(),
  jurisdiction: z.string().min(1).max(64),
  formVersion: z.string().min(1).max(64),
  objectRefs: z.array(z.strictObject({
    objectId: z.uuid(),
    objectVersion: z.int().positive()
  })).min(1).max(200),
  group: z.string().min(1).max(128),
  gaps: z.array(z.string().min(1).max(256)),
  deadline: z.iso.datetime(),
  sourceLedgerVersion: z.int().positive(),
  sourceTitleVersion: z.int().positive()
});
export const PrepareRegistrationSuccess = z.strictObject({
  draftId: z.uuid(),
  submissionState: z.enum(["draft", "review_required", "not_filed"]),
  sourceManifestHash: z.string().length(64),
  requestId: z.uuid()
});

export const ViewRightsEvidenceRequest = z.strictObject({
  visibility: z.enum(["private", "public"]),
  objectId: z.uuid(),
  rightType: RightTypeSchema,
  territory: z.string().min(1).max(128),
  periodStart: z.iso.datetime(),
  periodEnd: z.iso.datetime().nullable(),
  projectionId: z.uuid().nullable(),
  ledgerVersion: z.int().positive().nullable()
});
export const ViewRightsEvidenceSuccess = z.strictObject({
  viewerScope: z.enum(["named_party", "public"]),
  provenanceClass: z.enum(["asserted", "proposed", "consented", "registered", "unavailable"]),
  evidenceState: z.enum(["available", "unavailable"]),
  holders: z.array(z.string().trim().min(1).max(128)).max(500).nullable(),
  contact: z.string().nullable(),
  oneStop: z.boolean().nullable(),
  requestId: z.uuid()
});

export const ExportSignedChainRequest = z.strictObject({
  objectId: z.uuid(),
  rightType: RightTypeSchema,
  territory: z.string().min(1).max(128),
  periodStart: z.iso.datetime(),
  periodEnd: z.iso.datetime(),
  ledgerVersion: z.int().positive(),
  titleVersion: z.int().positive(),
  evidenceVersion: z.int().positive(),
  sourceVersionIds: z.array(z.uuid()).min(1).max(200),
  format: z.enum(["pdf", "json"])
});
export const ExportSignedChainSuccess = z.strictObject({
  artifactId: z.uuid(),
  objectKey: z.string().min(1).max(512),
  checksum: z.string().length(64),
  receiptId: z.uuid(),
  requestId: z.uuid()
});
export const RightsEvidenceApiError = ApiErrorSchema;
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| RGT-ID-API-01 | ReconcileIdentifierRequest with Idempotency-Key | ReconcileIdentifierSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RGT-ID-API-02 | PrepareRegistrationRequest with Idempotency-Key | PrepareRegistrationSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RGT-ID-API-03 | ViewRightsEvidenceRequest with stable viewer query key | ViewRightsEvidenceSuccess / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,429,503 |
| RGT-ID-API-04 | ExportSignedChainRequest with Idempotency-Key | ExportSignedChainSuccess / 202 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Pagination and bounded reads

`RGT-ID-API-03` is a fixed, singular evidence projection, not a collection endpoint. Cursor, offset, page, sort, and list filters are not applicable and are rejected as unknown input; one object/right/territory/period/viewer tuple returns one `ViewRightsEvidenceSuccess`. The strict success contract bounds the optional `holders` projection to 500 entries and never enumerates ledger rows, disputes, percentages, or contact records.

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| RGT-ID-API-01 | Require approved scheme/profile, operator standing, completed preflight hash, stable requestKey and expected object version. Existing internal/external identifiers are checked before provider reservation. Candidate conflicts rank for owner confirmation; no value asserts legal ownership. |
| RGT-ID-API-02 | Require readable every object in group, supported jurisdiction/form, pinned source ledger/title versions, group, explicit gaps and deadline. Gaps remain gaps; no inference, automatic filing or claim that filing creates copyright. |
| RGT-ID-API-03 | Require exact object/right/territory/period and viewer authorization. Private view requires named party or purpose scope. Public view reads dedicated projection only and returns unavailable rather than falling back to private ledger. Asserted state cannot be rendered as consented. |
| RGT-ID-API-04 | Require exact right, territory, period, current ledger/title/evidence/source versions and read authority for every record. Version drift returns VERSION_CONFLICT and regenerates; failed generation creates no artifact, checksum or receipt and never claims clearance or legal effect. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| RGT-ID-API-01 | IDENTIFIER_PROVIDER_FAILED, VALIDATION_FAILED, FORBIDDEN, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for non-operator or foreign object; 404 hides unknown object/profile/identifier. | Required 7 years; hash covers scheme, profile, object, preflight, candidate and expected version. Replay returns same allocation/assertion; mismatch returns IDEMPOTENCY_MISMATCH. | 60 allocations/hour/operator; 10 concurrent/provider profile. | Log operationId, requestId, object/scheme hashes, preflight class, provider state, conflict rank class and request-key hash; no identifier value or owner name. |
| RGT-ID-API-02 | VALIDATION_FAILED, FORBIDDEN, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for missing group read authority; 404 hides unknown object/source/group. | Required 7 years; hash covers group, jurisdiction, form, object/version manifest, gaps and deadline. Replay returns draft; mismatch returns IDEMPOTENCY_MISMATCH. | 30 drafts/hour/context; 5 concurrent/group. | Log operationId, requestId, group/object hashes, form class, gap-count bucket, source manifest hash and state; no registration values or PII. |
| RGT-ID-API-03 | FORBIDDEN, EVIDENCE_UNAVAILABLE, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for unauthorized private read; 404 hides unknown object/projection/ledger and private existence. | Idempotency not applicable to this read-only query; stable viewer query key is accepted for cache binding and no mutation occurs. Repeated query returns viewer-scoped current state and provenance. | 600 views/hour/IP for public; 120/hour/party private; 50 concurrent/projection. | Log operationId, requestId, viewer scope, object/scope hashes, provenance class, availability and latency; no percentages, disputes or contact data. |
| RGT-ID-API-04 | FORBIDDEN, VALIDATION_FAILED, VERSION_CONFLICT, EXPORT_UNAVAILABLE, DEPENDENCY_UNAVAILABLE. 403 for any record outside actor scope; 404 hides unknown object/version/evidence. | Required 7 years; hash covers object/right/scope, all source/evidence versions and format. Replay returns artifact receipt; mismatch returns IDEMPOTENCY_MISMATCH. | 30 exports/hour/actor; 5 concurrent/object. | Log operationId, requestId, object/scope/artifact hashes, version manifest hash, format, state and storage latency; no artifact contents or exact rights. |

## Database Schema

### PostgreSQL Model Registry

PostgreSQL owns identifier assertions, allocations, creation-proof timestamps, registration drafts, public projections and immutable audit events. Each row declares typed nullable fields, constraints, foreign keys, indexes and RLS/grants.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| identifier_assertion | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; object_id uuid NOT NULL; scheme text NOT NULL; value text NOT NULL; issuer_id uuid NOT NULL FK identity.party; status text NOT NULL CHECK status IN ('candidate','canonical','superseded','conflict'); evidence_ref text NOT NULL; request_key_hash text NOT NULL CHECK length(request_key_hash)=64; reconciliation_chain_id uuid NULL; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(scheme, value, version); (object_id, scheme, status); (issuer_id, status); (request_key_hash); (reconciliation_chain_id) | Identifier operator appends in assigned profile scope; object owner reads own assertions; public projection reads allowlisted canonical status; direct update/delete denied; anon no grant. |
| identifier_allocation | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; object_id uuid NOT NULL; scheme text NOT NULL; value text NOT NULL; issuer_id uuid NOT NULL FK identity.party; registrant_profile_id uuid NOT NULL; request_key_hash text NOT NULL CHECK length(request_key_hash)=64; provider_reference text NULL; state text NOT NULL CHECK state IN ('preflight','reserved','allocated','provider_failed','reconciled','superseded'); allocated_at timestamptz NULL; supersedes_id uuid NULL FK rights.identifier_allocation; evidence_ref text NULL; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(request_key_hash); UNIQUE(scheme, value) WHERE state IN ('reserved','allocated','reconciled'); (object_id, scheme, state); (registrant_profile_id, state); (provider_reference); (supersedes_id) | Operator and provider worker use named RPC; object owner reads status; reconciliation worker updates pending through CAS; no direct client update/delete; anon no grant. |
| creation_timestamp | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; object_id uuid NOT NULL; object_version bigint NOT NULL CHECK object_version>0; source_hash text NOT NULL CHECK length(source_hash)=64; observed_at timestamptz NOT NULL; anchor_provider text NULL; anchor_provider_version text NULL; anchor_ref text NULL; evidence_hash text NOT NULL CHECK length(evidence_hash)=64; state text NOT NULL CHECK state IN ('pending','anchored','proof_failed'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL | UNIQUE(object_id, object_version); (object_id, observed_at DESC); (state, updated_at); (anchor_provider); (source_hash) | Object owner reads proof metadata; proof worker appends/updates state through RPC; public receives provenance class only; direct delete denied; anon no grant. |
| registration_draft | id uuid PK NOT NULL; owner_context_id uuid NOT NULL FK identity.party; jurisdiction text NOT NULL; form_version text NOT NULL; object_refs jsonb NOT NULL CHECK jsonb_typeof(object_refs)='array'; group_key text NOT NULL; gaps jsonb NOT NULL CHECK jsonb_typeof(gaps)='array'; artifact_hash text NULL CHECK artifact_hash IS NULL OR length(artifact_hash)=64; submission_state text NOT NULL CHECK submission_state IN ('draft','review_required','not_filed','submitted'); submission_evidence_ref text NULL; source_ledger_version bigint NOT NULL CHECK source_ledger_version>0; source_title_version bigint NOT NULL CHECK source_title_version>0; deadline timestamptz NOT NULL; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(owner_context_id, group_key, version); (owner_context_id, submission_state, deadline); (jurisdiction, form_version); (deadline, submission_state); (artifact_hash) | Context owner and authorized group readers read draft; registration operator appends assigned scope; filing service has no grant here; direct delete/update denied; anon no grant. |
| public_rights_projection | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; object_id uuid NOT NULL; right_type text NOT NULL; territory text NOT NULL; holder_projection jsonb NOT NULL CHECK jsonb_typeof(holder_projection)='array'; contact_projection text NULL; one_stop boolean NULL; provenance_class text NOT NULL CHECK provenance_class IN ('asserted','proposed','consented','registered','unavailable'); source_version bigint NOT NULL CHECK source_version>0; evidence_hash text NOT NULL CHECK length(evidence_hash)=64; state text NOT NULL CHECK state IN ('available','unavailable','superseded'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(object_id, right_type, territory, source_version); (object_id, state, version DESC); (right_type, territory, state); (provenance_class); (contact_projection) | Public reads only allowlisted projection; named parties read richer scoped projection; projection worker writes; percentages, disputes, private economics and evidence never stored; direct client mutation denied. |
| rights_audit_event | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; actor_id uuid NOT NULL FK identity.party; acting_context_id uuid NOT NULL; action text NOT NULL; scope_hash text NOT NULL CHECK length(scope_hash)=64; before_hash text NULL CHECK before_hash IS NULL OR length(before_hash)=64; after_hash text NULL CHECK after_hash IS NULL OR length(after_hash)=64; evidence_hash text NULL CHECK evidence_hash IS NULL OR length(evidence_hash)=64; request_hash text NOT NULL CHECK length(request_hash)=64; event_class text NOT NULL; version bigint NOT NULL CHECK version>0; occurred_at timestamptz NOT NULL | UNIQUE(request_hash, action, version); (actor_id, occurred_at DESC); (scope_hash, occurred_at DESC); (event_class, occurred_at DESC); (acting_context_id) | Audit service append-only; authorized reviewer reads assigned scope; application clients have no direct grant; retention and legal hold enforced; anon no grant. |

### State, Concurrency and Transaction Rules

- Identifier preflight reads every internal and external candidate before provider reservation. Stable request_key and unique request_key_hash make retries return the same allocation and never consume another code.
- Two valid identifiers produce a ranked recommendation only. Owner confirmation creates canonical assertion; no identifier asserts legal ownership. A provider failure leaves provider_failed and retryable reservation state.
- Creation timestamp hashes each asserted object/version and records observed time and anchor provider. Anchor outage sets proof_failed, retains object and retries the same source hash.
- Registration draft pins jurisdiction, form, source ledger/title versions, group, gaps and deadline. Form review is not filing, and no downstream call may claim legal registration or copyright creation.
- Private evidence view requires named-party scope. Public view is served from public_rights_projection only and does not fall back to private ledger when projection is unavailable.
- Signed export locks all source and evidence versions before generation. Any version change aborts generation and requires a fresh manifest; no mixed-version artifact, checksum or receipt is persisted.
- Audit and event rows commit with canonical mutation or projection state. Deletion/revocation preserves required audit/proof history and tombstones derived public access.

### Grants, RLS and Retention

- RLS scopes identifiers to operator profile/object owner, registrations to readable group, private evidence to named party and exports to every pinned record. Public projection is a separate allowlist.
- Exact identifier values, registration values, percentages, disputes, contact data, evidence blobs, private economics and export contents are excluded from public events and ordinary logs.
- Identifier, proof, registration, projection, audit and idempotency history retain 7 years or legal hold, whichever is longer. Superseded allocations and unavailable projections remain attributable.
- Service principals receive named RPC grants for provider reservation, proof anchoring, projection, registration draft and export jobs. No wildcard database or storage grant exists.

## Middleware & Policies

### Authorization Matrix

| Role | Allowed scope | Explicit denial |
|---|---|---|
| Registration or identifier operator | Approved scheme/profile allocation, reconciliation and assigned draft operations. | Allocate without preflight, hide conflict or assert legal ownership. |
| Named owner or writer | Read private rights evidence and own source/title manifests; confirm canonical identifier. | Other party evidence, public projection mutation or inferred consent. |
| Estate or successor | Read or export scoped records under verified Shard 01 representation. | Login as deceased or rewrite historical audit/proof. |
| Public or fan | Read allowlisted publication-safe projection and provenance class. | Percentages, disputes, private economics, evidence or hidden existence. |
| System worker | Anchor proof, project public view, generate signed export and audit. | Decide merits, infer consent, file registration or expose private ledger. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| RGT-ID-API-01 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(identifierReconciliation) → parseZod(ReconcileIdentifierRequest) → idempotency(7y) → authorizeIdentifierOperator → registrantProfileGuard → preflightCompletionGuard → stableRequestKeyGuard → providerAllocationSaga → ownerConfirmationGuard → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| RGT-ID-API-02 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(registrationDraft) → parseZod(PrepareRegistrationRequest) → idempotency(7y) → authorizeGroupRead → jurisdictionFormGuard → sourceManifestCAS → noAutoFileGuard → registrationDraftTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| RGT-ID-API-03 | requestId → strictCors(rightsOrigins) → optionalAuth → rateLimit(rightsEvidenceView) → parseZod(ViewRightsEvidenceRequest) → viewerScopeResolver → privatePartyGuard → publicAllowlistGuard → projectionAvailabilityGuard → provenanceRedactor → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| RGT-ID-API-04 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(signedChainExport) → parseZod(ExportSignedChainRequest) → idempotency(7y) → authorizeEveryPinnedRecord → exactScopeGuard → versionManifestCAS → signedArtifactJob → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |

### Security and Privacy Controls

- Strict Zod 4 parsing rejects incomplete preflight, unsupported form, unpinned scope, invalid periods, mutable history and public requests that try to select a private ledger.
- CORS separates credentialed operator/party origins from public projection access. Export and registration mutations require CSRF protection; provider request keys are server-bound.
- 403 denotes authenticated actor without authority over known object, group or private record. 404 hides unknown or out-of-scope resources and private existence. Public projection outage is an explicit unavailable state.
- Public response never contains default percentages, dispute flags, private economics, evidence, signatures or hidden counts. Asserted/proposed/consented/registered provenance remains visible.
- Identifier provider values, signed artifact bytes, registration values and audit hashes are encrypted or access-controlled. No route claims filing creates copyright or identifier ownership.

## Data Flow

1. RGT-ID-API-01 resolves operator profile and 10a object/version, performs preflight, calls approved provider with stable requestKey and writes assertion/allocation state. It emits rights.identifier.changed.v1.
2. A proof worker appends creation_timestamp and anchors source hash asynchronously, emitting rights.creation-proof.anchored.v1 on success or retryable failure state.
3. RGT-ID-API-02 prepares a pinned registration draft for review. RGT-ID-API-03 selects private named-party records or public_rights_projection and never substitutes one for the other.
4. RGT-ID-API-04 locks exact source/evidence versions, generates signed artifact and stores checksum/receipt. Version drift aborts generation.
5. Downstream release, distribution, licensing and reporting consumers read provenance-labelled projections and audit evidence only; they cannot infer legal ownership, consent or clearance.

## Events and Consumer Contracts

| Event type | Emitted by | Required payload and consumers |
|---|---|---|
| rights.identifier.changed.v1 | RGT-ID-API-01 | object hash, scheme, value-state class, reconciliation state and version; release, distribution and reporting consume it. Exact identifier value and issuer are excluded. |
| rights.creation-proof.anchored.v1 | proof worker | object hash, object version, source hash, anchor provider class, proof state and version; private evidence and title-chain consumers consume it. Anchor secret and evidence blob are excluded. |
| rights.object.changed.v1 | RGT-ID-API-02 projection refresh | object hash, object kind, source version, provenance class and version; public lookup and identifier consumers consume it. Registration values and private records are excluded. |

Events are transactional-outbox records keyed by event ID and aggregate version. Consumers preserve asserted, proposed, consented and registered distinctions and cannot strengthen provenance or legal effect.

## Error Handling and Failure Recovery

| Operation ID | Failure | Required response and recovery |
|---|---|---|
| RGT-ID-API-01 | Missing preflight, provider outage/rejection, duplicate candidate or stale object | Return VALIDATION_FAILED or IDENTIFIER_PROVIDER_FAILED; preserve ranked conflict and retry same requestKey without consuming a second code. Owner confirmation remains separate. |
| RGT-ID-API-02 | Unauthorized group, unsupported form/jurisdiction, source drift or draft outage | Return FORBIDDEN, VALIDATION_FAILED, VERSION_CONFLICT or dependency error; retain no partial submission artifact and never file automatically. |
| RGT-ID-API-03 | Private authorization failure, public projection unavailable, stale source or resolver outage | Return FORBIDDEN for private scope; return evidence unavailable for public projection; never fall back to private ledger or fabricate provenance. |
| RGT-ID-API-04 | Missing record authority, version drift, storage outage or generation failure | Return FORBIDDEN, VERSION_CONFLICT or EXPORT_UNAVAILABLE; produce no artifact/checksum/receipt and require regeneration from fresh version manifest. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| RGT-ID-API-01 | Strict scheme/profile/preflight/request key and exact ApiError schema. | Operator standing, no ownership assertion, CORS/rate and 403/404. | Preflight manifest, unique request key, provider reconciliation, RLS/grants and identifier event. | Provider outage, retry no duplicate code, conflict ranking and value redaction. |
| RGT-ID-API-02 | Jurisdiction/form/group/gaps/source versions and draft schema. | Group read scope, no auto-file, CORS/rate and PII privacy. | Draft manifest, source CAS, no submission artifact, RLS/grants and projection event. | Form outage, source drift, gaps, replay and registration-value redaction. |
| RGT-ID-API-03 | Private/public viewer scope, provenance and availability schema. | Named-party authorization, public allowlist, no fallback, CORS/rate and dispute privacy. | Projection isolation, unavailable state, RLS/grants and current-version read. | Projection outage, unauthorized private read, stale source and safe unavailable telemetry. |
| RGT-ID-API-04 | Exact scope, version manifest, format, checksum and receipt schema. | Every-record authority, no legal-effect claim, CORS/rate and artifact privacy. | CAS manifest, signed storage, no partial artifact, RLS/grants and audit. | Version drift, storage outage, replay, failed generation and content redaction. |

### Test Levels and Acceptance Gates

- Unit: strict Zod 4 rejects missing preflight, unsupported forms, incomplete scope, invalid periods and public/private scope confusion; every failure validates ApiError { code, message, requestId, details }.
- Integration: exercise BE00 context, Shard 01 representation, 10a objects/title/ledger, Shard 09 sources, identifier provider, storage and outbox adapters with exact timeout and retry behavior.
- Database: verify unique active identifiers, stable request-key CAS, proof state, projection allowlist, immutable audit, RLS and no direct client grants.
- Property: retry allocation never consumes another code; version drift prevents mixed export; public projection never reveals private record; proof failure preserves object and same source hash.
- Acceptance gate: all four operations have route, Zod contract, field, error/auth/idempotency/rate/observability, middleware, persistence and test rows; all six assigned models and three assigned events are literal-covered.

## Deepening Passes and Ambiguity Gate

### Micro Pass

- Provider unavailable, preflight absent, duplicate identifier, source drift, unsupported form, public projection outage, private unauthorized read and mixed export each have typed failure or unavailable state.
- Identifier ranking is not canonical confirmation. Registration draft is not filing. Asserted, proposed, consented and registered provenance are never collapsed.

### Meso Pass

- identifier_assertion and identifier_allocation remain separate from creation_timestamp, registration_draft, public_rights_projection and rights_audit_event. No model asserts legal ownership.
- Private evidence and public projection are separate paths. Signed exports are version-pinned artifacts and never substitute for live rights authority or clearance.

### Macro Pass

- 10a owns object/ledger bases, 10b owns amendments, 10c owns title/conflicts/freezes, 10d owns AI/NIL positions, Shard 01 owns representation, Shard 09 owns source versions and BE00 owns storage/outbox.
- Events and audit preserve state/provenance through downstream release, licensing and reporting. Deletion revokes derived access while required evidence and audit history remain.

## Ambiguity Gate

**PASS.** RGT-17 through RGT-20 map one-to-one to authoritative routes and complete operation-keyed matrices. Provider preflight and retry, owner confirmation, registration review/no filing, private/public isolation, unavailable projection, exact export scope, version drift, creation-proof outage and audit retention are deterministic. BE00 ApiError, CORS, RLS and event exclusions are explicit.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Authored identifier reconciliation, registration draft, scoped evidence view and signed title-chain export backend contracts. | /write-be-spec |

## Dependency References

- **Consumes:** [BE00 request and error contracts](00-infrastructure.md#requestresponse-contracts-zod-4-schemas), [Shard 01 Contracts](../ia/01-identity-authority.md#contracts) for authority and representation, [Shard 09 Contracts](../ia/09-projects-collaboration.md#contracts) for source versions, and 10a/10c contracts for objects, ledgers and title events.
- **Publishes:** rights.identifier.changed.v1, rights.creation-proof.anchored.v1 and rights.object.changed.v1 with hashed state/provenance metadata.
- **Sibling handoff:** 10a receives identifier and proof projections; 10b preserves evidence through amendments; 10c consumes title/evidence versions; 10d consumes content and contributor boundaries.
- **Downstream:** Release, distribution, licensing and reporting consumers receive allowlisted provenance-labelled projections and cannot infer ownership, consent, clearance or legal filing.
