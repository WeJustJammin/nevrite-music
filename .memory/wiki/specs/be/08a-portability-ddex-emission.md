# BE 08a — Portability, DDEX/RIN emission and artifact lifecycle

## Split Group

| Parent IA shard | Backend companion group | Boundary |
|---|---|---|
| Shard 08 — Credit reporting, exchange and disclosure | 08a — Portability and DDEX/RIN emission | CXR-01 through CXR-05; own-credit export, RIN preflight and generation, stale-emission review, portability receipts, immutable output snapshots and delivery evidence. |

## Classification

This companion owns versioned output requests and artifacts. It reads authorized Shard 07 projections at pinned versions and never changes credit truth, provenance, rights, ownership, splits, payment or union status. CXR-01 is a user command that creates an own-scope export request; CXR-02 is a read-only preflight command; CXR-03 and CXR-05 are artifact commands; CXR-04 is a stale/re-emission command. Delivery acceptance remains recipient-owned.

| IA interaction | Operation ID | Backend classification | Authority and completion |
|---|---|---|---|
| CXR-01 Export own credit history | CXR-08A-01 | Authenticated command plus asynchronous artifact worker | Acting-context owner creates an export request, receives a private immutable artifact or failed state, and can retry with the same idempotency key. |
| CXR-02 Preflight RIN package | CXR-08A-02 | Authorized read-only validation command | Export owner receives blocking, warning and lossy gaps against exact profile and source versions; no source mutation occurs. |
| CXR-03 Generate RIN package | CXR-08A-03 | Confirmed artifact-generation command | Export owner confirms the pinned preflight and receives a sealed RIN artifact or a durable failed state. |
| CXR-04 Review stale emission | CXR-08A-04 | Stale-detection and re-emission command | Export owner or reporting operator reviews a changed source version and may start a new artifact; recipient supersession is never inferred. |
| CXR-05 Generate portability receipt | CXR-08A-05 | Receipt projection command | Export owner downloads a receipt only after a complete manifest and checksum exist; URL renewal never regenerates content. |

The following boundaries are explicit:

- BE00 owns request context, the canonical error envelope, idempotency records, queue delivery, object-storage safety, audit and outbox mechanics. This file does not redefine platform endpoints.
- BE01 owns party, acting-context, authority and identifier truth. This file consumes purpose-scoped snapshots only.
- BE07 owns credit, visibility, provenance and disclosure source projections. This file never reads unrestricted graph tables and never widens a visibility state.
- 08b owns union forms and certification; 08c owns gear linkage; 08d owns AI disclosure and destination policy. No 08a route duplicates those commands.
- DDEX or recipient adapters own external acceptance. A local emitted state is not a claim that the recipient accepted a package.

## Referenced Material Inventory

| Source | Sections and exact lines | Use in this companion |
|---|---|---|
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | title, overview, scope reconciliation lines 1-24 | Establishes output snapshots, omission declarations, stale detection and the no-canonical-mutation boundary. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | features and delivery phases lines 25-38 | Defines 02.08 portability/RIN scope, launch versus gated DDEX emission and disabled behavior. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | acceptance criteria lines 40-46 | Supplies CXR-01 through CXR-05 preconditions, completion, source-stale behavior, artifact quarantine and receipt rules. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | interactions and global rules lines 57-82 | Supplies exact interaction IDs, output-state transitions, snapshot and no-inference rules. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | core types and errors lines 84-95 | Defines OutputKind, ArtifactState, GapSeverity and StandardError values. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | export and emission contracts lines 96-106 | Defines CreatePortabilityExport, PreflightRIN, GenerateRIN, RecordEmission, MarkEmissionStale and ReemitArtifact invariants. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | data models and typed registry lines 119-165 | Defines output_request, output_gap, generated_artifact, artifact_credit_snapshot, emission_record and output_audit_event fields and cardinalities. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | access control and escalation lines 166-187 | Defines credited-party, recipient-adapter, reporting-admin and system-worker authority and prohibitions. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | accessibility lines 188-195 | Defines gap grouping, progress, stale status, manifest readability and accessible download retry behavior. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | event schemas lines 197-208 | Defines credit.output.generated.v1, credit.output.emitted.v1 and credit.output.stale.v1 payload minimums and privacy exclusions. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | edge cases and coverage matrix lines 210-249 | Supplies mixed-version, embargo, loss, rejection, profile-change, deletion and worker-failure outcomes for every flow. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | cross-shard dependencies and contract map lines 251-267 | Establishes BE00, BE01 and BE07 inputs and the recipient/gear inbound direction. |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | changelog and dependencies lines 269-295 | Records locked output, RIN, inbound and disabled-submission decisions. No deep-dive file is required; scope reconciliation line 23 and Deep Dives Needed lines 258-260 say none. |
| .memory/wiki/specs/feature-ledger.md | row 223 | 02.08 Credit Export and DDEX RIN Emission is the owned partial feature row. |
| .memory/wiki/specs/be/00-infrastructure.md | API Endpoints line 67; Database Schema line 202; Middleware and Policies line 253; Data Flow line 298 | Inherits platform envelope, idempotency, queue, storage, audit, RLS and service-boundary contracts. |
| .memory/wiki/specs/be/01b-party-identity-aliases.md | API Endpoints line 138; Database Schema line 305; Middleware and Policies line 659; Data Flow line 691 | Consumes party, acting-context, authority and identifier projections without copying ownership tables. |
| .memory/wiki/specs/be/07a-credit-assertions-visibility.md | API Endpoints line 119; Database Schema line 369; Data Flow line 432; Event Schemas line 464 | Consumes viewer-relative credit and visibility snapshots and stale-trigger source versions. |

## IA Source Map

The parent IA field registry is retained for companion reconciliation: scope_detail?, tool_name?, tool_version?, model_name? and subject_is_own_model? are exact optional AI Disclosure Entry V1 JSON keys owned by 08d, not fields of 08a.

### Interaction map

| IA interaction | Backend operation | Owned command or query | Source trace |
|---|---|---|---|
| CXR-01 Export own credit history | CXR-08A-01 | Create an own-scope request, pin Shard 07 versions, include authorized embargoed own credits, generate a private artifact and manifest. | Parent IA acceptance line 42 and interaction line 61; global rules lines 76-82. |
| CXR-02 Preflight RIN package | CXR-08A-02 | Validate exact DDEX and recipient profiles, identifiers, role mappings, visibility and representational gaps without mutation. | Parent IA acceptance line 43 and interaction line 62; export contracts lines 100-102. |
| CXR-03 Generate RIN package | CXR-08A-03 | Generate only after exact preflight and explicit per-credit overrides; seal source-version manifest and loss declarations. | Parent IA acceptance line 44 and interaction line 63; export contracts lines 101-103. |
| CXR-04 Review stale emission | CXR-08A-04 | Mark matching active emission stale after source amendment, retraction or disclosure change and optionally create a linked re-emission. | Parent IA acceptance line 45 and interaction line 64; export contracts lines 104-105. |
| CXR-05 Generate portability receipt | CXR-08A-05 | Project format, profile, scope, omissions, degradation notes, checksum and generated-at metadata over a complete artifact. | Parent IA acceptance line 46 and interaction line 65; accessibility lines 190-195. |

### Model map

| IA model name | BE owner | Persistence and contract use | Source trace |
|---|---|---|---|
| output_request | CXR-08A-01 through CXR-08A-05 | Request owner, purpose, scope, output kind, profile, source hash, state, idempotency and version. | Parent IA line 123; typed registry line 153. |
| output_gap | CXR-08A-02 and CXR-08A-03 | Safe gap code, severity, source version, remediation and hidden-record omission policy. | Parent IA line 124; typed registry line 154. |
| generated_artifact | CXR-08A-01, CXR-08A-03 and CXR-08A-05 | Immutable locator, media/schema profile, checksum, manifest, retention and state. | Parent IA line 125; typed registry line 155. |
| artifact_credit_snapshot | CXR-08A-01 and CXR-08A-03 | Per-credit source version, disclosure version, inclusion and explicit override reason. | Parent IA line 126; typed registry line 156. |
| emission_record | CXR-08A-03 and CXR-08A-04 | Recipient/profile, package hash, delivery evidence, stale reason and re-emission links. | Parent IA line 127; typed registry line 157. |
| output_audit_event | CXR-08A-01 through CXR-08A-05 | Immutable safe audit of actor, context, source, recipient, hashes and before/after state. | Parent IA line 134; typed registry line 164. |

### Event map

| Event type | Produced by | Payload use | Source trace |
|---|---|---|---|
| credit.output.generated.v1 | CXR-08A-01 and CXR-08A-03 | Artifact, source hash, output kind, profile, checksum and generated state for download and audit projections. | Parent IA line 201 and event schema line 197. |
| credit.output.emitted.v1 | CXR-08A-03 | Emission, artifact, recipient, profile and delivery evidence for stale monitoring and receipts. | Parent IA line 202 and event schema line 197. |
| credit.output.stale.v1 | CXR-08A-04 | Emission, changed source versions, stale reasons and detection time for exporter tasks. | Parent IA line 203 and event schema line 197. |

## Feature Ledger Coverage

| Feature ID | Feature | Covered operations | Backend proof |
|---|---|---|---|
| 02.08 | Credit Export and DDEX RIN Emission | CXR-08A-01 through CXR-08A-05 | Own-credit completeness, exact profile preflight, explicit loss declarations, private immutable artifacts, stale/re-emit linkage and verifiable receipts. |

Source trace: feature-ledger.md row 223 names 02.08 as Credit Export and DDEX RIN Emission and points to 08-credit-reporting-disclosure.

## Endpoint Completeness Reconciliation

Every owned interaction has one stable operation ID, one route registry row, one strict request and success schema, one error row, one authorization row, one idempotency/rate rule, one observability row and one test row. CXR-08A-01 creates the request and artifact lifecycle; CXR-08A-02 is read-only; CXR-08A-03 cannot bypass preflight; CXR-08A-04 is the only stale/re-emission command; CXR-08A-05 cannot issue a receipt over an incomplete manifest.

| Interaction | Request and success | Persistence effect | External effect |
|---|---|---|---|
| CXR-01 | CreatePortabilityExportRequest to CreatePortabilityExportResponse | Insert output_request, source snapshot rows and audit/outbox after authorization. | Queue worker; object write is quarantined until manifest commit. |
| CXR-02 | PreflightRINRequest to PreflightRINResponse | Read only; gaps may be persisted against request version for repeatable review. | Profile and source projection reads only. |
| CXR-03 | GenerateRINRequest to GenerateRINResponse | Insert artifact, credit snapshots, gaps, emission attempt and audit atomically. | DDEX/recipient adapter delivery is retried by outbox, never synchronously trusted. |
| CXR-04 | ReviewStaleEmissionRequest to ReviewStaleEmissionResponse | CAS stale marker and optional new request/artifact linked to the prior emission. | Recipient is notified only with delivery-attempt evidence. |
| CXR-05 | PortabilityReceiptRequest to PortabilityReceiptResponse | Receipt audit and short-lived URL issuance; no artifact mutation. | Storage URL renewal only. |

## Shared Contract Inheritance

- Request envelope is BE00-owned and contains requestId, authenticated session or service principal, acting context, locale, schema version and trace context.
- Success envelope is data, requestId and schemaVersion. Every route uses the exact error envelope ApiError { code, message, requestId, details } for 4xx and 5xx.
- Idempotency-Key binds actor, route, normalized request hash and schema version. A matching replay returns the original result; a different payload returns IDEMPOTENCY_MISMATCH with no second effect.
- Commands carry expectedVersion or sourceSnapshotHash. Compare-and-set losers return VERSION_CONFLICT. Queue delivery uses the same request and idempotency key.
- RLS and purpose projections are deny-first. Own embargoed credits may appear only to the owning party in a private artifact; no public or recipient projection can widen that state.
- Object storage writes an unreferenced temporary object, verifies checksum and manifest, then commits the reference. Failed workers quarantine the temporary object.

## API Endpoints

### Authoritative Route Registry

| Operation ID | IA interaction | Method and path | Auth and ownership | Request | Success | Errors | Idempotency and rate | Middleware, CORS and error |
|---|---|---|---|---|---|---|---|---|
| CXR-08A-01 | CXR-01 Export own credit history | POST /api/v1/credits/exports | Authenticated acting-context party; request owner must be the party whose own scope is selected | CreatePortabilityExportRequest | CreatePortabilityExportResponse 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422 or 503 | Idempotency-Key required; 10/hour per party and 60/hour per source projection lane | CORS first-party consumer allowlist with credentials; BE00 context and CSRF, strict Zod, source authorization, rate, queue and ApiError normalization |
| CXR-08A-02 | CXR-02 Preflight RIN package | POST /api/v1/credits/exports/{requestId}/rin/preflight | Export owner or reporting operator with scoped export review capability | PreflightRINRequest | PreflightRINResponse 200 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422 or 503 | Idempotency-Key required; 30/hour per export owner and 120/hour preflight lane | CORS first-party consumer and staff allowlist with credentials; BE00 context, CSRF, strict Zod, export ownership, profile/source gates, rate and ApiError normalization |
| CXR-08A-03 | CXR-03 Generate RIN package | POST /api/v1/credits/exports/{requestId}/rin/generate | Export owner or reporting operator; explicit preflight and per-credit overrides required | GenerateRINRequest | GenerateRINResponse 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422 or 503 | Idempotency-Key required; 5/hour per export owner and 30/hour generation lane | CORS first-party consumer and staff allowlist with credentials; BE00 context, CSRF, strict Zod, preflight CAS, source/visibility gates, rate, queue and ApiError normalization |
| CXR-08A-04 | CXR-04 Review stale emission | POST /api/v1/credits/emissions/{emissionId}/review-stale | Export owner, assigned reporting operator or stale monitor service principal for the emission scope | ReviewStaleEmissionRequest | ReviewStaleEmissionResponse 200 or 202 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 503 | Idempotency-Key required; 20/hour per emission owner and 120/hour stale-monitor lane | CORS first-party staff allowlist with credentials for humans and non-browser service allowlist for monitor; BE00 principal/context, strict Zod, source CAS, rate and ApiError normalization |
| CXR-08A-05 | CXR-05 Generate portability receipt | POST /api/v1/credits/exports/{requestId}/receipt | Export owner or authorized recipient of the private artifact; manifest must be complete | PortabilityReceiptRequest | PortabilityReceiptResponse 200 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409 or 503 | Idempotency-Key required; 60/hour per export owner and 300/hour receipt lane | CORS first-party consumer allowlist with credentials; BE00 context, CSRF, strict Zod, artifact completeness, rate, URL issuance and ApiError normalization |

### Registry invariants

- Every operation returns ApiError { code, message, requestId, details }; details contain field paths, opaque IDs, state and retry metadata only.
- 403 means the export, emission or artifact is visible to the actor's purpose but the actor lacks owner, reporting or monitor capability. 404 means RLS hides the request, source, artifact or emission, or the opaque ID is absent. CXR-08A-01 returns 404 for a hidden work/source and 403 for a visible non-owner scope; CXR-08A-05 never reveals an artifact manifest to an unrelated actor.
- 409 means idempotency mismatch, stale request/profile/source version, duplicate active emission or an already-complete receipt. 422 means invalid kind, profile, gap override, recipient requirement or checksum precondition. 503 means a durable worker or adapter operation remains pending after its bounded retry budget.
- A receipt never asserts external acceptance. Re-emission creates a new artifact and emission; prior external copies remain unclaimed unless the adapter supplies delivery evidence.

### Operation contract and error matrix

| Operation ID | Request to success contract | Error outcomes and 403 versus 404 |
|---|---|---|
| CXR-08A-01 | CreatePortabilityExportRequest to CreatePortabilityExportResponse with request ID, private state, scope hash and artifact/manifest state. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for visible non-owner scope; SOURCE_NOT_FOUND 404 for hidden source; IDEMPOTENCY_MISMATCH or VERSION_CONFLICT 409; INVALID_OUTPUT_KIND or SCOPE_UNAUTHORIZED 422; ARTIFACT_GENERATION_FAILED 503 if worker remains pending. |
| CXR-08A-02 | PreflightRINRequest to PreflightRINResponse with exact profile, source snapshot, grouped gaps and draft/blocked state. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-owner reviewer; REQUEST_NOT_FOUND 404 for hidden export; VERSION_CONFLICT 409; PROFILE_UNAVAILABLE or RIN_INPUT_INVALID 422; SOURCE_UNAVAILABLE 503. |
| CXR-08A-03 | GenerateRINRequest to GenerateRINResponse with artifact, checksum, manifest, loss declarations and generated/failed state. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for missing export capability; REQUEST_NOT_FOUND 404 for hidden export; SOURCE_STALE or VERSION_CONFLICT 409; RECIPIENT_REQUIREMENT_UNMET or OVERRIDE_INVALID 422; ARTIFACT_GENERATION_FAILED 503. |
| CXR-08A-04 | ReviewStaleEmissionRequest to ReviewStaleEmissionResponse with stale reasons, current versions and optional new emission reference. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for out-of-scope owner/operator; EMISSION_NOT_FOUND 404 for hidden emission; VERSION_CONFLICT or IDEMPOTENCY_MISMATCH 409; DELIVERY_ADAPTER_UNAVAILABLE 503 without external-acceptance claim. |
| CXR-08A-05 | PortabilityReceiptRequest to PortabilityReceiptResponse with format, scope, omissions, degradation, checksum and expiring URL metadata. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for unrelated viewer; ARTIFACT_NOT_FOUND 404 for hidden or absent artifact; VERSION_CONFLICT 409; ARTIFACT_INCOMPLETE 422; STORAGE_UNAVAILABLE 503. |

### Route field validation matrix

| Operation ID | Required validation | Success assertion |
|---|---|---|
| CXR-08A-01 | Own party scope, allowed portability kind, acting-context version, bounded locale and no support-only flag. | Request is private, source snapshot is pinned and artifact worker is queued exactly once. |
| CXR-08A-02 | Request owner, exact DDEX/profile versions, normalized source snapshot and no hidden-record enumeration. | Gaps are grouped as blocking, warning or lossy and source remains unchanged. |
| CXR-08A-03 | Preflight ID/version, confirmed snapshot, per-credit override list and no confidential record selection. | Package is sealed only with one source-version manifest and explicit loss declarations. |
| CXR-08A-04 | Emission owner/scope, current source versions, review action and expected emission version. | Stale state is CAS-protected; re-emission is a new immutable artifact. |
| CXR-08A-05 | Complete manifest, checksum, artifact ownership and URL lifetime within the platform maximum. | Receipt never describes an incomplete or unverified object. |

## Request/Response Contracts (Zod 4 schemas)

~~~ts
import { z } from "zod";

export const ApiError = z.strictObject({
  code: z.string().min(1).max(80),
  message: z.string().min(1).max(500),
  requestId: z.uuid(),
  details: z.record(z.string(), z.json()),
});

const Id = z.uuid();
const Version = z.number().int().nonnegative();
const DateTime = z.iso.datetime({ offset: true });
const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const Key = z.string().min(16).max(128);
const OutputKind = z.enum(["portability_json", "portability_csv", "portability_pdf", "ddex_rin"]);
const ArtifactState = z.enum(["draft", "validating", "blocked", "generated", "emitted", "stale", "superseded", "failed"]);
const GapSeverity = z.enum(["blocking", "warning", "lossy"]);

export const CreatePortabilityExportRequest = z.strictObject({
  partyId: Id,
  scope: z.enum(["own_credits", "own_embargoed_credits"]),
  outputKind: z.enum(["portability_json", "portability_csv", "portability_pdf"]),
  locale: z.string().min(2).max(20),
  actingContextVersion: Version,
  sourceSnapshotVersion: Version,
  includeContested: z.boolean(),
  expectedVersion: Version,
});

export const CreatePortabilityExportResponse = z.strictObject({
  exportRequestId: Id,
  artifactId: Id.optional(),
  state: ArtifactState,
  scopeHash: Hash,
  sourceSnapshotVersion: Version,
  includedCreditCount: z.number().int().nonnegative(),
  privateArtifact: z.literal(true),
  shareDefault: z.literal(false),
  requestId: Id,
  schemaVersion: z.string().min(1),
});

export const PreflightRINRequest = z.strictObject({
  exportRequestId: Id,
  ddexProfileVersion: z.string().min(1).max(80),
  recipientProfileId: Id,
  sourceSnapshotVersion: Version,
  expectedVersion: Version,
});

export const PreflightRINResponse = z.strictObject({
  preflightId: Id,
  exportRequestId: Id,
  state: z.enum(["draft", "validating", "blocked"]),
  profileVersion: z.string().min(1),
  sourceSnapshotVersion: Version,
  gaps: z.array(z.strictObject({
    code: z.string().min(1).max(80),
    severity: GapSeverity,
    sourceObjectRef: Id.optional(),
    safeMessage: z.string().min(1).max(300),
    remediationRoute: z.string().min(1).max(160).optional(),
  })).max(5000),
  blockingCount: z.number().int().nonnegative(),
  warningCount: z.number().int().nonnegative(),
  lossyCount: z.number().int().nonnegative(),
  requestId: Id,
  schemaVersion: z.string().min(1),
});

export const GenerateRINRequest = z.strictObject({
  exportRequestId: Id,
  preflightId: Id,
  ddexProfileVersion: z.string().min(1).max(80),
  recipientProfileId: Id,
  sourceSnapshotVersion: Version,
  confirmed: z.literal(true),
  lowTierOverrides: z.array(z.strictObject({
    creditId: Id,
    reasonCode: z.string().min(1).max(80),
  })).max(500),
  expectedVersion: Version,
});

export const GenerateRINResponse = z.strictObject({
  artifactId: Id,
  emissionId: Id.optional(),
  state: ArtifactState,
  outputKind: z.literal("ddex_rin"),
  packageHash: Hash.optional(),
  manifestHash: Hash.optional(),
  sourceVersions: z.array(z.strictObject({ objectRef: Id, version: Version })).max(5000),
  lossDeclarations: z.array(z.string().min(1).max(300)).max(500),
  recipientAcceptance: z.enum(["not_attempted", "attempted", "accepted", "rejected", "unknown"]),
  requestId: Id,
  schemaVersion: z.string().min(1),
});

export const ReviewStaleEmissionRequest = z.strictObject({
  emissionId: Id,
  action: z.enum(["review", "reemit"]),
  currentSourceVersions: z.array(z.strictObject({ objectRef: Id, version: Version })).max(5000),
  reasonCode: z.enum(["credit_amended", "credit_retracted", "disclosure_changed", "profile_changed", "manual_review"]),
  expectedVersion: Version,
});

export const ReviewStaleEmissionResponse = z.strictObject({
  emissionId: Id,
  state: z.enum(["active", "stale", "superseded"]),
  staleReasons: z.array(z.string().min(1).max(80)).max(50),
  newArtifactId: Id.optional(),
  supersedesEmissionId: Id.optional(),
  recipientAcceptance: z.enum(["not_attempted", "attempted", "accepted", "rejected", "unknown"]),
  requestId: Id,
  schemaVersion: z.string().min(1),
});

export const PortabilityReceiptRequest = z.strictObject({
  exportRequestId: Id,
  artifactId: Id,
  expectedVersion: Version,
  urlLifetimeSeconds: z.number().int().min(60).max(900),
});

export const PortabilityReceiptResponse = z.strictObject({
  receiptId: Id,
  artifactId: Id,
  outputKind: OutputKind,
  scopeHash: Hash,
  sourceSnapshotVersion: Version,
  omissions: z.array(z.string().min(1).max(300)).max(500),
  degradationNotes: z.array(z.string().min(1).max(300)).max(500),
  checksum: Hash,
  generatedAt: DateTime,
  downloadUrl: z.string().url(),
  expiresAt: DateTime,
  requestId: Id,
  schemaVersion: z.string().min(1),
});
~~~

Headers are inherited from BE00: X-Request-Id, Idempotency-Key for commands, Content-Type application/json, schema version and trace context. The request schemas reject unknown keys and all path identifiers are UUIDs. Responses never include private source narratives, hidden record counts or internal provider credentials.

## Database Schema

The six tables below are the complete 08a persistence set. Shard 07 credit, visibility, provenance and disclosure records are referenced by opaque purpose-scoped IDs; 08a stores the exact version used, not a copied source row. Supabase PostgreSQL RLS is enabled on every table.

### Canonical records and fields

| Table and IA model | Typed fields with nullability and constraints | Foreign keys and indexes | RLS and grants |
|---|---|---|---|
| output_request | id uuid NOT NULL PRIMARY KEY; owner_id uuid NOT NULL; acting_context_version bigint NOT NULL CHECK > 0; purpose text NOT NULL CHECK own_export or rin_export; output_kind text NOT NULL CHECK portability_json, portability_csv, portability_pdf or ddex_rin; scope_hash char(64) NOT NULL; source_snapshot_hash char(64) NOT NULL; state text NOT NULL CHECK draft, validating, blocked, generated, emitted, stale, superseded or failed; idempotency_key_hash char(64) NOT NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; failed_reason text NULL. | owner_id is a BE01 opaque party ref; source refs are BE07 opaque refs with recorded versions and no local FK. UNIQUE owner_id, idempotency_key_hash; indexes owner_id, state, created_at DESC, scope_hash, source_snapshot_hash. | RLS allows owner and assigned reporting operator to purpose projection; service output worker writes; anon has no grant; storage worker receives only request-scoped view. |
| output_gap | id uuid NOT NULL PRIMARY KEY; request_id uuid NOT NULL; source_object_ref uuid NULL; source_version bigint NULL CHECK >= 0; code text NOT NULL; severity text NOT NULL CHECK blocking, warning or lossy; safe_message text NOT NULL CHECK char_length <= 300; remediation_route text NULL CHECK char_length <= 160; hidden_source boolean NOT NULL DEFAULT false CHECK hidden_source = false; created_at timestamptz NOT NULL. | request_id FK to output_request.id ON DELETE CASCADE; source_object_ref is an opaque BE07 ref; UNIQUE request_id, source_object_ref, code; indexes request_id, severity, source_object_ref. | RLS permits owner/reviewer only; rows for hidden source are never inserted; svc_output and assigned reviewer grants; no client table grant. |
| generated_artifact | id uuid NOT NULL PRIMARY KEY; request_id uuid NOT NULL; storage_locator text NULL; media_type text NOT NULL; schema_version text NOT NULL; profile_version text NULL; checksum char(64) NULL; manifest_hash char(64) NULL; byte_size bigint NULL CHECK >= 0; state text NOT NULL CHECK draft, validating, blocked, generated, emitted, stale, superseded or failed; retention_until timestamptz NULL; quarantined_at timestamptz NULL; generated_at timestamptz NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | request_id FK to output_request.id ON DELETE RESTRICT; storage locator has no external FK; UNIQUE request_id, manifest_hash when manifest_hash IS NOT NULL; indexes request_id, state, checksum, retention_until, created_at DESC. | RLS exposes artifact metadata to request owner and purpose-granted recipient; storage locator is redacted until complete; svc_output writes; no direct client table grant. |
| artifact_credit_snapshot | id uuid NOT NULL PRIMARY KEY; artifact_id uuid NOT NULL; credit_id uuid NOT NULL; credit_version bigint NOT NULL CHECK > 0; disclosure_version bigint NULL CHECK >= 0; visibility_state text NOT NULL CHECK public, embargoed or confidential; included boolean NOT NULL; override_reason text NULL; source_hash char(64) NOT NULL; created_at timestamptz NOT NULL. | artifact_id FK to generated_artifact.id ON DELETE CASCADE; credit and disclosure refs are BE07 opaque refs; UNIQUE artifact_id, credit_id; indexes credit_id, artifact_id, visibility_state, source_hash. | RLS permits owner and worker; recipient sees only allowed fields and never private evidence; svc_output inserts append-only; no client table grant. |
| emission_record | id uuid NOT NULL PRIMARY KEY; artifact_id uuid NOT NULL; recipient_profile_id uuid NOT NULL; profile_version text NOT NULL; emitted_at timestamptz NULL; delivery_state text NOT NULL CHECK not_attempted, attempted, accepted, rejected or unknown; delivery_evidence_ref uuid NULL; package_hash char(64) NULL; stale_at timestamptz NULL; stale_reasons jsonb NOT NULL DEFAULT []; supersedes_id uuid NULL; superseded_by_id uuid NULL; version bigint NOT NULL DEFAULT 1 CHECK > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | artifact_id FK to generated_artifact.id ON DELETE RESTRICT; supersedes_id and superseded_by_id self FKs; recipient profile is an adapter opaque ref. UNIQUE artifact_id, recipient_profile_id, profile_version; indexes artifact_id, delivery_state, stale_at, supersedes_id, superseded_by_id. | RLS exposes delivery state to owner and assigned operator; evidence ref is service-only; svc_output and delivery worker grants; no client table grant. |
| output_audit_event | id uuid NOT NULL PRIMARY KEY; request_id uuid NOT NULL; actor_ref uuid NULL; action text NOT NULL; before_state text NULL; after_state text NOT NULL; source_hash char(64) NULL; request_hash char(64) NOT NULL; recipient_ref uuid NULL; details jsonb NOT NULL DEFAULT {}; occurred_at timestamptz NOT NULL. | request_id FK to output_request.id ON DELETE RESTRICT; actor, source and recipient are opaque refs; indexes request_id, actor_ref, action, occurred_at DESC, request_hash. | RLS permits owner-safe events and compliance reviewers; private details are service-only; svc_output inserts; no update/delete grant and no client table grant. |

### Persistence invariants

- output_request is the idempotency and lifecycle root. A request cannot move to generated or emitted without a complete source-version manifest and artifact checksum.
- Every artifact_credit_snapshot records the exact Shard 07 version and effective visibility. A public export never includes confidential records; an own private export may include embargoed records with the actual state.
- output_gap is safe-to-display only. Hidden records are absent, not represented as omissions, and cannot be counted through timing or gap cardinality.
- generated_artifact storage_locator remains null or quarantined until checksum, manifest hash, byte count and retention are committed in one transaction.
- emission_record is append-only in its delivery history. Stale marking is idempotent and score-only confidence changes do not stale an emission.
- output_audit_event has no update or delete path. Erasure removes private details through a protected redaction reference while preserving the non-PII audit tombstone.

## Middleware & Policies

### Hono middleware order

1. HTTPS and request-size limit: JSON body 256 KiB for commands, 8 KiB for receipt/query metadata, reject unsupported media types.
2. CORS policy: first-party credentialed consumer or staff allowlist per route; non-browser service allowlist for monitor/adapter routes; never wildcard credentials.
3. Request ID and trace context: accept a valid X-Request-Id or mint one, propagate traceparent and bind logs to requestId.
4. BE00 authentication and acting-context verification: validate session/service principal, schema version, CSRF for browser commands and replay window.
5. Strict Zod 4 parse: reject unknown keys, malformed UUIDs, unsupported enum values, oversized arrays and invalid cross-field combinations.
6. Scope and visibility authorization: resolve BE01 owner/role and BE07 purpose projection before existence-sensitive queries.
7. Rate and idempotency: reserve the route key, compare normalized request hash, then acquire the command budget.
8. Transaction and CAS: lock request/emission rows, recheck source/profile versions, write canonical rows plus audit/outbox atomically.
9. Queue/object adapter: use bounded timeout/retry policy and quarantine unreferenced objects; normalize all failures to ApiError.
10. Response projection: redact storage locators, private sources, hidden counts and provider credentials; emit metrics and safe audit fields.

### Per-operation authorization matrix

| Operation ID | Actor and capability | Ownership and scope checks | Lock/recheck | 403 versus 404 |
|---|---|---|---|---|
| CXR-08A-01 | Authenticated party with own-export capability | Party equals acting-context subject; scope is own and source projection is authorized | Lock idempotency row; recheck party context and source snapshot | Hidden source/work is 404; visible non-owner or support-only request is 403. |
| CXR-08A-02 | Export owner or reporting operator | Request owner or assigned export-review scope; profile is named and effective | Lock request version; recheck profile and source snapshot | Hidden request is 404; visible request without review capability is 403. |
| CXR-08A-03 | Export owner or reporting operator | Preflight belongs to request and all selected credits are authorized/non-confidential | Lock request/preflight; recheck every source version and override | Hidden request is 404; visible request without generation capability is 403. |
| CXR-08A-04 | Export owner, assigned operator or stale monitor | Emission belongs to scope and changed source versions are evidence-bound | Lock emission; recheck active state and source versions | Hidden emission is 404; visible emission outside scope is 403. |
| CXR-08A-05 | Export owner or purpose-granted recipient | Artifact belongs to request and manifest is complete | Lock artifact; recheck checksum, retention and expected version | Hidden artifact is 404; visible artifact without purpose grant is 403. |

### Security and abuse controls

- Scope is derived from BE01 and BE07 authority, never from a caller-supplied party ID alone. Support cannot create an export on behalf of a party without an expiring purpose grant.
- Private artifacts use short-lived URLs, content-disposition attachment, no public cache, encrypted storage and a redacted download audit. Recipient adapters receive only the selected exact scope.
- DDEX profile and recipient policy versions are immutable references. Unknown profile, role mapping or identifier produces a blocking gap or PROFILE_UNAVAILABLE, never a fabricated default.
- Per-credit low-tier overrides require a reason and produce an audit row. There is no bulk confidence bypass.
- Path, body, array, byte-size and export-count limits are enforced before provider calls. Zip/package decompression and checksum computation run in a bounded worker budget.
- Logs contain opaque IDs, hash prefixes, output kind, state and timing class only. Artifact contents, embargoed titles, raw recipient credentials and private source notes are excluded.

## Data Flow

### Transaction and external seams

| Operations | Seam | Exact request | Exact response | Timeout, retries and circuit breaker |
|---|---|---|---|---|
| CXR-08A-01, CXR-08A-02, CXR-08A-03 | Shard 07 authorized projection | partyRef, scopeHash, purpose, requestedObjectRefs, expectedSourceVersions | objectRef, sourceVersion, visibilityState, provenanceState, disclosureVersion, safe fields | 2,000 ms; 2 read retries at 100/500 ms, no mutation retry; circuit opens after 5 failures in 60 seconds; unknown source stays hidden or creates SOURCE_UNAVAILABLE. |
| CXR-08A-02, CXR-08A-03 | DDEX profile registry | profileId, profileVersion, recipientProfileId, locale | exact profile version, identifier rules, role mappings, required fields, loss rules | 1,000 ms; 3 retries at 100/500/1,500 ms for reads; circuit 5 failures/60 seconds; no default profile on outage. |
| CXR-08A-03, CXR-08A-04 | Recipient delivery adapter | artifactId, packageHash, profileVersion, recipientRef, requestId | deliveryAttemptId, accepted or rejected or unknown, evidenceRef, responseCode | 5,000 ms; 3 retries at 15/60/300 seconds with same idempotency key; circuit 5/60 seconds; unknown acceptance remains unknown. |
| CXR-08A-01, CXR-08A-03 | Object storage and artifact worker | tempLocator, expectedByteLimit, checksum, manifestHash, retentionUntil | objectReceipt, byteSize, checksum, committedLocator | 10,000 ms; 2 retries at 1,000/5,000 ms; circuit 3 failures/60 seconds; failed writes are quarantined and never referenced. |
| CXR-08A-04, CXR-08A-05 | Notification and URL issuer | eventRef, recipientScope, artifactId, expirySeconds | notificationReceipt or signedUrl, expiresAt | 2,000 ms; 2 retries at 250/1,000 ms; circuit 5/60 seconds; URL failure leaves receipt retryable without artifact regeneration. |

Every seam request carries requestId and idempotency key. A provider timeout after local commit is reconciled by the outbox and deliveryAttemptId before a new attempt.

### State machines and concurrency

- output_request: draft -> validating -> blocked or generated or failed. A generated request may become stale or superseded; it never returns to draft. CAS uses version and normalized request hash.
- generated_artifact: draft -> validating -> generated -> emitted -> stale -> superseded. A worker failure goes to failed; a quarantined object is not generated. Receipt requires generated, emitted or stale with a complete manifest.
- emission_record: not_attempted -> attempted -> accepted, rejected or unknown; any active record can become stale once a matching source amendment/retraction/disclosure version is observed. Stale marking is monotonic.
- Two identical command keys serialize on output_request. Same key and same hash returns the first response; same key with another hash returns IDEMPOTENCY_MISMATCH. Competing expected versions return VERSION_CONFLICT.
- Stale detection compares every artifact_credit_snapshot version and disclosure version under lock. A confidence score-only change is excluded from the stale trigger.

### Failure recovery

- Source version changes during generation abort sealing, write SOURCE_STALE, retain the selected scope and queue a retry against the new snapshot. No mixed-version manifest is emitted.
- Worker failure before object write leaves failed request state. Failure after object write marks the locator quarantined and schedules bounded cleanup; no manifest references it.
- Recipient rejection records attempted/rejected evidence, leaves the new artifact immutable and does not mark the prior external copy superseded.
- Adapter outage after local emission commit leaves delivery state unknown, retries through the outbox and alerts after three attempts. No 200 response claims acceptance.
- Profile or identifier outage yields PROFILE_UNAVAILABLE or blocking gaps. The user can review or retry without changing Shard 07.
- Owner deletion or authority revocation removes derived access, expires URLs and queues redaction while preserving required non-PII hashes and tombstones.

## Event Schemas

### Payload contracts

| Event type | Required payload | Privacy and delivery rule |
|---|---|---|
| credit.output.generated.v1 | eventId, requestId, artifactId, outputKind, profileVersion, sourceSnapshotHash, manifestHash, checksum, state, occurredAt | Opaque IDs and hashes only; outbox after artifact transaction; consumers refetch authorized projections. |
| credit.output.emitted.v1 | eventId, emissionId, artifactId, recipientProfileId, profileVersion, deliveryState, deliveryEvidenceRef, occurredAt | Delivery evidence is purpose-scoped; never includes package contents or recipient credentials. |
| credit.output.stale.v1 | eventId, emissionId, artifactId, changedSourceRefs, changedVersions, staleReasons, detectedAt | Changed refs are opaque; hidden titles, counts and private disclosure text are excluded. |

~~~ts
export const OutputGeneratedEvent = z.strictObject({
  eventId: z.uuid(), requestId: z.uuid(), artifactId: z.uuid(),
  outputKind: z.enum(["portability_json", "portability_csv", "portability_pdf", "ddex_rin"]),
  profileVersion: z.string().min(1), sourceSnapshotHash: z.string().regex(/^[a-f0-9]{64}$/),
  manifestHash: z.string().regex(/^[a-f0-9]{64}$/), checksum: z.string().regex(/^[a-f0-9]{64}$/),
  state: z.enum(["generated", "failed"]), occurredAt: z.iso.datetime({ offset: true }),
});
export const OutputEmittedEvent = z.strictObject({
  eventId: z.uuid(), emissionId: z.uuid(), artifactId: z.uuid(),
  recipientProfileId: z.uuid(), profileVersion: z.string().min(1),
  deliveryState: z.enum(["attempted", "accepted", "rejected", "unknown"]),
  deliveryEvidenceRef: z.uuid().optional(), occurredAt: z.iso.datetime({ offset: true }),
});
export const OutputStaleEvent = z.strictObject({
  eventId: z.uuid(), emissionId: z.uuid(), artifactId: z.uuid(),
  changedSourceRefs: z.array(z.uuid()).min(1).max(5000),
  changedVersions: z.array(z.number().int().positive()).min(1).max(5000),
  staleReasons: z.array(z.string().min(1).max(80)).min(1).max(50),
  detectedAt: z.iso.datetime({ offset: true }),
});
~~~

Outbox publication is after commit and uses eventId plus aggregate version for deduplication. Consumers treat unknown provider delivery as non-acceptance until a scoped receipt is available.

## Error Handling

### Boundary mapping

| Boundary | Mapping | Recovery |
|---|---|---|
| Envelope, origin, CSRF or authentication | UNAUTHENTICATED or INVALID_REQUEST | Reject before database/provider effect; retain requestId. |
| Scope, source visibility or ownership | FORBIDDEN or source/artifact 404 | Return no existence signal beyond the actor's purpose projection. |
| Profile, identifier or role rule | PROFILE_UNAVAILABLE, RIN_INPUT_INVALID or blocking gap | Preserve draft request and let the owner correct or retry. |
| CAS, idempotency or source snapshot | IDEMPOTENCY_MISMATCH, VERSION_CONFLICT or SOURCE_STALE | Return current safe version metadata; never merge mixed versions. |
| Artifact/storage worker | ARTIFACT_GENERATION_FAILED or STORAGE_UNAVAILABLE | Failed state plus quarantine/cleanup and idempotent retry. |
| Recipient adapter | DELIVERY_ADAPTER_UNAVAILABLE or unknown acceptance | Keep local artifact immutable, retry outbox and do not claim external acceptance. |
| Erasure, revocation or retention | ACCESS_REVOKED or URL_EXPIRED | Remove derived access, retain required audit tombstone and issue a new URL only after reauthorization. |

### Operation error coverage

| Operation ID | Invalid input and authority cases | Concurrent, provider and deletion cases |
|---|---|---|
| CXR-08A-01 | Invalid kind, non-own scope, stale context, hidden source or over-limit request is rejected before queueing. | Same idempotency key collapses; source change fails snapshot; owner deletion revokes artifact access and queues cleanup. |
| CXR-08A-02 | Unknown profile, hidden source, invalid recipient requirement or non-owner reviewer is rejected without source mutation. | Profile outage returns PROFILE_UNAVAILABLE; repeated preflight at same version is stable; revocation removes gap access. |
| CXR-08A-03 | Missing preflight, blocking gap, confidential selection or invalid override is rejected before artifact write. | Competing generation serializes; worker quarantine handles partial storage; source deletion prevents sealing and preserves tombstone. |
| CXR-08A-04 | Hidden/out-of-scope emission, invalid current version or unsupported action is rejected. | Stale CAS is monotonic; adapter rejection is not supersession; source revocation purges dependent output projections. |
| CXR-08A-05 | Incomplete manifest, invalid checksum or unrelated viewer cannot receive a receipt. | URL renewal is idempotent; storage outage preserves artifact; expiry or deletion never exposes a stale URL. |

## Observability

| Operation ID | Audit event and metrics | Safe trace fields and alert |
|---|---|---|
| CXR-08A-01 | output.request.created, export_requests_total, export_queue_latency_ms, export_failed_total | requestId, outputRequestId, actorRef hash, kind, scope hash prefix, state; alert on failure ratio and queue age. |
| CXR-08A-02 | rin.preflight.completed, preflight_total, blocking_gap_total, profile_unavailable_total | requestId, requestRef, profileVersion, gap counts, source version; alert on profile outage and hidden-record leakage test. |
| CXR-08A-03 | output.artifact.generated, artifact_generation_total, artifact_bytes, source_stale_total | requestId, artifactId, manifest hash prefix, state, duration; alert on checksum mismatch, quarantine growth and mixed-version refusal. |
| CXR-08A-04 | output.emission.stale, stale_emission_total, reemit_total, delivery_unknown_total | requestId, emissionId, changed version count and reason codes; alert on stale backlog and adapter circuit open. |
| CXR-08A-05 | portability.receipt.issued, receipt_total, url_renewal_total, storage_error_total | requestId, receiptId, artifactId, expiry class and checksum prefix; alert on receipt over incomplete manifest or URL failures. |

Logs are structured JSON. Raw artifact bytes, private notes, embargoed titles, union identifiers and recipient secrets are never logged. Sentry events carry only opaque IDs and a redacted error code.

## Testing Strategy

### Contract and route tests

| Operation ID | Required contract, authorization and failure tests |
|---|---|
| CXR-08A-01 | Parse strict request and response; reject support-only or non-own scope; verify 403 versus hidden 404; replay same idempotency key; assert queue once and private shareDefault false. |
| CXR-08A-02 | Parse exact profile and gap response; verify read-only source; reject hidden source and non-owner reviewer; assert blocking/warning/lossy counts match rows. |
| CXR-08A-03 | Require preflight and confirmed snapshot; reject confidential and bulk overrides; simulate source stale, checksum failure and quarantine; verify one sealed manifest. |
| CXR-08A-04 | Verify stale trigger reasons and score-only non-trigger; CAS competing reviewers; adapter rejection and unknown acceptance; assert new artifact links prior emission. |
| CXR-08A-05 | Reject incomplete manifest and unrelated viewer; verify checksum and expiry; renew URL without new artifact; storage outage returns retryable ApiError. |

### Persistence, concurrency and recovery tests

- Migration tests assert every table, type, nullability, check, FK, index, RLS policy and grant listed above.
- Property tests generate unknown JSON keys, oversized arrays, malformed hashes, mixed source versions and unsupported output kinds.
- Concurrency tests run duplicate commands, same-key different-body commands, stale CAS updates, simultaneous stale markers and two workers racing on one temporary object.
- Security tests prove embargoed/confidential credits, hidden source rows, recipient credentials, artifact bytes and private gap messages cannot cross purpose projections.
- Queue tests prove transactional outbox ordering, bounded retries, circuit opening, quarantine cleanup and reconciliation by requestId plus idempotency key.
- Accessibility tests verify semantic gap severity, progress/stale announcements, keyboard download controls, checksum labels, 200 percent zoom and persistent retry routes.

## Deepening Passes

| Pass | Evidence and outcome |
|---|---|
| Micro contract pass | Every CXR-01 through CXR-05 row has strict request/success schemas, status/error mapping, idempotency and numeric rate. |
| Snapshot pass | Source version and disclosure version are pinned per artifact credit; mixed-version sealing is impossible. |
| Persistence pass | Six IA models have typed SQL fields, constraints, FKs or opaque-ref rationale, indexes, RLS and grants. |
| State/recovery pass | Request, artifact and emission states, CAS, queue retry, quarantine and provider unknown behavior are explicit. |
| Adversarial pass | Hidden records, embargoes, non-owner access, bulk low-tier overrides, replay, URL leakage and recipient rejection are covered. |
| Macro boundary pass | BE00, BE01 and BE07 are consumed by projection; 08b, 08c and 08d routes are not duplicated; external acceptance remains external. |
| Auditability pass | Source inventory, exact source-map IDs, one route registry, per-operation matrices, event payloads, tests and links reconcile. |

## Ambiguity Gate

PASS. The sole canonical IA source is .memory/wiki/specs/ia/08-credit-reporting-disclosure.md; its source reconciliation says no deep-dive file is required. CXR-01 through CXR-05 have one owner and one operation. Own embargo handling, exact source snapshots, profile gaps, DDEX gating, explicit loss, stale/re-emission semantics, recipient acceptance, 403 versus 404, idempotency, numeric rates, CORS, ApiError, external timeout/retry/circuit budgets, RLS, grants, deletion and object quarantine are resolved. No route duplicates BE00, 08b, 08c or 08d. All Markdown tables have matching widths and no unescaped cell pipes.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Classified and authored portability, DDEX/RIN, stale emission and receipt backend contracts from canonical Shard 08 IA. | /write-be-spec | All |
| 2026-08-28 | Added exact Zod 4 contracts, typed persistence, external seam budgets, route matrices and ambiguity evidence. | /write-be-spec-write | API, Contracts, Database, Middleware, Data Flow, Tests |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md)
- [BE01b — Party identity and aliases](01b-party-identity-aliases.md)
- [BE07a — Credit assertions and visibility](07a-credit-assertions-visibility.md)
- [BE07b — Session capture and offline](07b-session-capture-offline.md)
- [BE07c — Claims, attestations, confidence and taxonomy](07c-claims-attestations-confidence-taxonomy.md)
- [IA Shard 08 — Credit reporting, exchange and disclosure](../ia/08-credit-reporting-disclosure.md)
