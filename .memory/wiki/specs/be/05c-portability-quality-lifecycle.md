# BE 05c — Portability, quality and lifecycle

## Split Group

This companion is the backend contract for Shard 05 portability, quality and
data-lifecycle operations. It owns CFG-13 and CFG-14 and the 25.10 feature
family:

- 25.10.01 Import, Mapping, Validation & Dry Run
- 25.10.02 Export, Backup, Restore & Portability
- 25.10.03 Accessibility & Content Quality Gates
- 25.10.04 Retention, Legal Hold & Erasure

05a owns settings and runtime configuration. 05b owns admin workspace,
capabilities, audit links and diagnostics. Shard 03 and Shard 04 retain
canonical CMS records and media. Shard 06 retains safety cases, legal
restrictions and evidence truth. This split orchestrates bounded jobs and
stores proof; it cannot import authority, ownership, consent, verification,
money, rights, legal status or evidence as truth.

## Classification

| IA interaction | Operation ID | Backend classification | Authority and completion |
|---|---|---|---|
| CFG-13 Import/export/restore | CFG-05C-01 | Protected portability command with dry-run import, scoped export and isolated restore verification | Source and target manifests are explicit and hashed; imports are source-marked claims, exports expire, and restore promotion requires all integrity and policy checks. |
| CFG-14 Run quality/retention action | CFG-05C-02 | Registered quality-check command and privacy/legal lifecycle workflow | Checker versions and exact target versions produce evidence; lifecycle actions use cross-store manifests, legal holds and truthful partial completion. |

## Referenced Material Inventory

| Source | Sections and exact lines | Use in this companion |
|---|---|---|
| .memory/wiki/specs/ia/05-platform-configuration-admin.md | title, links and scope lines 1-22 | Confirms the parent boundary, three-way split and deferred enterprise administration. |
| .memory/wiki/specs/ia/05-platform-configuration-admin.md | Features and acceptance criteria lines 24-45 | Binds feature IDs 25.10.01 through 25.10.04 and all import, export, restore, quality and lifecycle failure behavior. |
| .memory/wiki/specs/ia/05-platform-configuration-admin.md | Interactions and global rules lines 47-71 | Supplies exact CFG-13 and CFG-14 identifiers and the no-authority-import boundary. |
| .memory/wiki/specs/ia/05-platform-configuration-admin.md | Contracts lines 98-106 | Supplies import mapping, export allowlist, isolated restore, quality blockers and hold/erasure contracts. |
| .memory/wiki/specs/ia/05-platform-configuration-admin.md | Data Models and typed registry lines 108-152 | Supplies ImportJob, ExportArtifact, RestoreVerification, QualityCheckRun and DataLifecycleRequest. |
| .memory/wiki/specs/ia/05-platform-configuration-admin.md | Access Control and escalation lines 154-187 | Supplies privacy/legal operator, support purpose grant and no-override escalation. |
| .memory/wiki/specs/ia/05-platform-configuration-admin.md | Accessibility lines 189-197 | Supplies accessible import mapping, restore verification and checker findings. |
| .memory/wiki/specs/ia/05-platform-configuration-admin.md | Event Schemas lines 199-211 | Supplies quality.lifecycle.changed.v1 and the identifier-only event envelope. |
| .memory/wiki/specs/ia/05-platform-configuration-admin.md | Edge cases and matrix lines 213-258 | Supplies protected-field export, restore false confidence, publish blocker and hold/shared-record conflict recovery. |
| .memory/wiki/specs/ia/deep-dives/05-platform-configuration-admin.md | scope and deepening record lines 1-18 | Confirms portability and lifecycle boundaries and adversarial convergence. |
| .memory/wiki/specs/ia/deep-dives/05-platform-configuration-admin.md | portability, quality and lifecycle models lines 35-55 | Expands import, export, restore, check, lifecycle and store-result fields. |
| .memory/wiki/specs/ia/deep-dives/05-platform-configuration-admin.md | state machines lines 57-69 | Locks import, export and lifecycle transitions, including blocked and partial outcomes. |
| .memory/wiki/specs/ia/deep-dives/05-platform-configuration-admin.md | portability algorithms lines 106-121 | Locks private upload, mapping, dry run, allowlist, encryption, isolated restore and proof requirements. |
| .memory/wiki/specs/ia/deep-dives/05-platform-configuration-admin.md | quality/lifecycle algorithms lines 123-130 | Locks checker blockers, cross-store manifest, hold sealing and shared-record exception handling. |
| .memory/wiki/specs/ia/deep-dives/05-platform-configuration-admin.md | abuse/recovery and cross-shard lines 132-162 | Locks export exfiltration, count-only restore failure, evidence preservation and provider boundaries. |
| .memory/wiki/specs/feature-ledger.md | Shard 05 rows lines 785-788 | Reconciles every assigned 25.10 feature row to an operation and test surface. |
| .memory/wiki/specs/be/00-infrastructure.md | inventory, ApiError and contracts lines 22-41 and 112-138 | Inherits RequestContext, strict Zod 4 and exact ApiError { code, message, requestId, details }. |
| .memory/wiki/specs/be/00-infrastructure.md | database, middleware, jobs and provider boundaries lines 202-365 | Inherits private schema, RLS, middleware, idempotency, queue retry, object and provider circuit rules. |
| .memory/wiki/specs/be/00-infrastructure.md | errors, observability, tests and ambiguity lines 416-534 | Inherits typed status mapping, scrubbed telemetry, recovery proof and quality gates. |
| .memory/wiki/specs/2026-08-02-architecture-design.md | stack, access and integration lines 157-167, 348-370 and 495-502 | Confirms Hono/Zod/Workers, server-derived authorization, PostgreSQL authority and replaceable storage/provider seams. |
| .memory/wiki/specs/2026-08-02-architecture-design.md | data/security lines 638-655, 707-765 and 900-907 | Confirms PostgreSQL/RLS source, Storage metadata boundary, secrets exclusion, BOLA/BOPLA and allowlisted APIs. |
| .memory/wiki/specs/data-placement-strategy.md | placement and isolation lines 13-16, 23-32, 42-52 and 120-130 | Confirms relational authority, governed objects, protected schemas and server-derived acting context. |
| .memory/wiki/specs/ENGINEERING-STANDARDS.md | contract, bounds, security and migration lines 35-50, 92-101 and 149-188 | Sets strict validation, 256 KiB request bound, 50-row lists, endpoint tests and RLS/grant tests. |

## IA Source Map

| Exact source item | 05c ownership | Backend realization |
|---|---|---|
| CFG-13 Import/export/restore | Owned | CFG-05C-01 with import job, export artifact and restore verification action branches. |
| CFG-14 Run quality/retention action | Owned | CFG-05C-02 with quality check, lifecycle request and per-store evidence branches. |
| ImportJob | Owned | Bounded private import job with source hash, mapping, cursor and quarantine evidence. |
| ExportArtifact | Owned | Encrypted, checksummed, expiring and download-limited artifact projection. |
| RestoreVerification | Owned | Isolated restore proof for schema, count, hash, reference, RLS, rendering and accessibility. |
| QualityCheckRun | Owned | Versioned checker evidence against an exact target and blocking finding count. |
| DataLifecycleRequest | Owned | Hold, archive, delete, anonymize and erasure plan with conflicts and residual manifest. |
| LifecycleStoreResult | Supporting deep-dive model, owned | One evidence result for every database, object, projection, cache, export, backup and processor store. |
| quality.lifecycle.changed.v1 | Owned event | Identifier-only event after lifecycle request or store-result state change. |
| CFG-01 through CFG-12 | Excluded | 05a and 05b own settings/runtime and admin operations. |

## Feature Ledger Coverage

| Feature ledger ID | Feature | Operation coverage | Acceptance evidence |
|---|---|---|---|
| 25.10.01 | Import, Mapping, Validation & Dry Run | CFG-05C-01 import action | Private scan, schema mapping, duplicate classification, dry-run counts, quarantine and exact cursor tests. |
| 25.10.02 | Export, Backup, Restore & Portability | CFG-05C-01 export and restore actions | Scope/field allowlist, encryption, expiry/download limits, isolated restore and full proof tests. |
| 25.10.03 | Accessibility & Content Quality Gates | CFG-05C-02 quality_check action | Code-owned checker version, blocking structural/reference/a11y/privacy/rights/legal findings and human review. |
| 25.10.04 | Retention, Legal Hold & Erasure | CFG-05C-02 lifecycle actions | Cross-store manifest, hold precedence, sealed access, shared-evidence conflict, partial completion and residual proof. |

## Endpoint Completeness Reconciliation

The two assigned interactions each have exactly one route registry entry, one
strict request contract with action-specific branches, one success projection,
one status/error row, one authorization row, one idempotency/rate/telemetry
row and one test row below. CFG-05C-01 does not duplicate BE00's upload,
object or job endpoints: it requests a private object intent through an
internal adapter and owns only the import/export/restore job records.

CFG-05C-02 combines checker and lifecycle actions behind a strict action
discriminant while keeping quality evidence and destructive lifecycle state
machines distinct. Quality warnings cannot authorize publication, and CMS
cannot decide legal exceptions. Shard 06 and counsel-gated policy packs remain
owners of case, evidence and legal decisions.

## Shared Contract Inheritance

Every route inherits BE00 request ID, TLS and method guard, exact first-party
CORS, body/content limits, session and acting-party resolution, CSRF for
cookie mutations, strict Zod 4 validation, capability/RLS checks, idempotency,
transactional outbox, bounded queue workers, object reconciliation and exact
ApiError { code, message, requestId, details } normalization. details is
limited to 16 keys, four nesting levels and 8 KiB.

The server derives actor, party and scope. Caller-supplied ownership,
authority, consent, verification, legal, rights, money or evidence fields are
source claims only and cannot become canonical state. Export and restore
never expose secrets, signed tokens or protected payload to an unauthorized
actor.

## API Endpoints

### Route Registry

| Operation ID | IA interaction | Method and path | Auth and capability | Request contract | Success contract | Error contract | Idempotency and rate | CORS and middleware |
|---|---|---|---|---|---|---|---|---|
| CFG-05C-01 | CFG-13 Import/export/restore | POST /api/v1/admin/portability/actions | Admin operator for import/export scope; restore operator with isolated-target permission; step-up for protected data | Cfg05c01PortabilityActionRequest | Cfg05c01PortabilityActionResponse 200 or 202 | ApiError { code, message, requestId, details }; 401 or 403 or 404 or 409 or 415 or 422 or 503 | Idempotency-Key required; 10/min user and 20/min party; 15s route deadline, queued job | CORS first-party admin allowlist; BE00 request-id, session/context, CSRF, strict Zod, capability, rate, object/RPC and ApiError normalization |
| CFG-05C-02 | CFG-14 Run quality/retention action | POST /api/v1/admin/quality-lifecycle/actions | Admin operator for quality; privacy/legal operator with MFA for lifecycle; support only named purpose grant | Cfg05c02QualityLifecycleActionRequest | Cfg05c02QualityLifecycleActionResponse 200 or 202 | ApiError { code, message, requestId, details }; 401 or 403 or 404 or 409 or 422 or 503 | Idempotency-Key required; 10/min user and 20/min party; 15s route deadline, queued store plan | CORS first-party admin allowlist; BE00 request-id, session/context, CSRF, strict Zod, step-up, capability, rate, RPC and ApiError normalization |

### Registry invariants

- Portability actions accept only registered formats, schema versions, mapping
  versions, duplicate strategies, target scopes and field manifests.
- Import always scans privately, maps to supported CMS/config shapes, records
  source hash and provenance, dry-runs before commit, and quarantines
  unsupported or authority-like rows. It never writes canonical ownership,
  consent, verification, money, rights or legal truth.
- Export scope and field manifests are allowlisted and compiled server-side.
  Artifacts are encrypted where required, checksummed, short-lived,
  download-limited and revoked before bytes are served.
- Restore always targets an isolated non-production environment first. Counts
  alone never prove success; schema, hashes, references, RLS, rendering,
  accessibility and secret-exclusion checks must pass before promotion.
- Quality checkers are code-owned and versioned. A finding against a changed
  target or checker is stale. Blocking findings prevent publication and leave
  the last active output intact.
- Lifecycle requests enumerate every affected store and shared reference.
  Legal hold wins over destructive actions. Erasure of jointly authored
  evidence becomes a counsel/operator-reviewed exception, not silent deletion.
- 403 means a visible job, target or policy is known but the action is outside
  the current grant. 404 hides inaccessible target or artifact existence.

### Operation contract and error matrix

| Operation ID | Request and success | Error codes and status | 403 versus 404 |
|---|---|---|---|
| CFG-05C-01 | PortabilityActionRequest import/export/restore branch to PortabilityActionResponse with job/artifact/verification state | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403; PORTABILITY_TARGET_NOT_FOUND 404; UNSUPPORTED_FORMAT 415; MANIFEST_CONFLICT 409; PROTECTED_FIELD 422; RESTORE_UNVERIFIED 422; PORTABILITY_UNAVAILABLE 503 | Hidden object, target or artifact is 404; visible scope outside actor grant is 403; protected source claim is 422 and never canonicalized. |
| CFG-05C-02 | QualityLifecycleActionRequest quality or lifecycle branch to QualityLifecycleActionResponse with evidence/state | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403; LIFECYCLE_TARGET_NOT_FOUND 404; VERSION_CONFLICT 409; BLOCKING_FINDING 422; HOLD_CONFLICT 422; LIFECYCLE_UNAVAILABLE 503 | Hidden target or hold is 404; visible target without privacy/legal or quality capability is 403; blocking evidence or hold conflict is 422 with no destructive mutation. |

## Request/Response Contracts (Zod 4 schemas)

All objects are Zod 4 strictObject schemas. Action branches are a strict
discriminated union. Unknown keys fail. UUIDs are canonical UUIDs, timestamps
carry offsets and all manifests are bounded to 500 entries and 256 KiB
request bodies. Export is asynchronous; no synchronous export bytes are
returned.

~~~ts
import { z } from "zod";

const Uuid = z.uuid();
const IsoTime = z.string().datetime({ offset: true });
const Version = z.string().regex(/^[1-9][0-9]{0,17}$/);
const NonEmptyText = z.string().trim().min(1).max(512);
const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const Key = z.string().regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+){0,15}$/).max(128);
 const JsonValue = z.json().refine(v => {
  const encoded = JSON.stringify(v);
  return encoded !== undefined && encoded.length <= 65536;
}, "value exceeds 64 KiB");
const JsonObject = z.record(z.string().max(128), JsonValue).superRefine((v, c) => {
  if (Object.keys(v).length > 64) c.addIssue({ code: "custom", message: "too many keys" });
});
const ScopeManifest = z.array(z.strictObject({
  resourceType: z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/),
  resourceId: Uuid,
  version: Version
})).min(1).max(500);
const FieldManifest = z.array(z.string().regex(/^[a-z][a-z0-9_.-]{1,63}$/)).min(1).max(128);
const ApiError = z.strictObject({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{2,63}$/),
  message: z.string().min(1).max(256),
  requestId: Uuid,
   details: z.record(z.string().max(64), z.json()).superRefine((v, c) => {
    if (Object.keys(v).length > 16) c.addIssue({ code: "custom", message: "too many details" });
  })
});

const ImportAction = z.strictObject({
  action: z.literal("import"),
  objectId: Uuid,
  sourceFormat: z.enum(["json", "csv", "ndjson", "xml", "cms_bundle"]),
  sourceVersion: Version,
  mappingVersion: Version,
  provenance: z.strictObject({
    sourceSystem: z.string().trim().min(1).max(128),
    sourceRunId: z.string().trim().min(1).max(128),
    sourceHash: Hash
  }),
  duplicatePolicy: z.enum(["reject", "quarantine", "update_if_version_matches", "create_new"]),
  targetScope: JsonObject,
  fieldManifest: FieldManifest,
  dryRun: z.boolean(),
  reason: NonEmptyText
});
const ExportAction = z.strictObject({
  action: z.literal("export"),
  exportType: z.enum(["cms", "settings", "audit_safe_projection", "portability_bundle"]),
  scopeManifest: ScopeManifest,
  fieldManifest: FieldManifest,
  actorPurpose: NonEmptyText,
  encryptionMode: z.enum(["managed_key", "recipient_key"]),
  expiresAt: IsoTime,
  maxDownloads: z.number().int().min(1).max(3),
  excludeProtectedEvidence: z.literal(true),
  reason: NonEmptyText
});
const RestoreAction = z.strictObject({
  action: z.literal("restore"),
  sourceArtifactId: Uuid,
  targetEnvironment: z.string().trim().min(1).max(64),
  isolatedTarget: z.literal(true),
  requestedScope: ScopeManifest,
  expectedManifestHash: Hash,
  verifyAccessibility: z.literal(true),
  verifyRls: z.literal(true),
  reason: NonEmptyText
});
export const Cfg05c01PortabilityActionRequest = z.discriminatedUnion("action", [ImportAction, ExportAction, RestoreAction]);

export const Cfg05c01PortabilityActionResponse = z.strictObject({
  action: z.enum(["import", "export", "restore"]),
  importJobId: Uuid.nullable(),
  exportArtifactId: Uuid.nullable(),
  restoreVerificationId: Uuid.nullable(),
  state: z.enum(["draft", "dry_run", "approved", "running", "ready", "completed", "partial", "failed", "expired", "revoked", "cancelled"]),
  sourceHash: Hash.nullable(),
  manifestHash: Hash.nullable(),
  cursor: z.number().int().min(0).max(500),
  importedCount: z.number().int().min(0).max(500),
  quarantinedCount: z.number().int().min(0).max(500),
  blockedCount: z.number().int().min(0).max(500),
  expiresAt: IsoTime.nullable(),
  downloadCount: z.number().int().min(0).max(3),
  verification: z.strictObject({
    schema: z.enum(["pass", "fail", "unknown"]),
    counts: z.enum(["pass", "fail", "unknown"]),
    hashes: z.enum(["pass", "fail", "unknown"]),
    references: z.enum(["pass", "fail", "unknown"]),
    rls: z.enum(["pass", "fail", "unknown"]),
    rendering: z.enum(["pass", "fail", "unknown"]),
    accessibility: z.enum(["pass", "fail", "unknown"])
  }).nullable(),
  outboxEventId: Uuid.nullable()
});

const QualityAction = z.strictObject({
  action: z.literal("quality_check"),
  checkerKey: Key,
  checkerVersion: Version,
  targetType: z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/),
  targetId: Uuid,
  targetVersion: Version,
  reason: NonEmptyText
});
const LifecycleAction = z.strictObject({
  action: z.enum(["archive", "delete", "anonymize", "hold", "release_hold", "erasure"]),
  subjectPersonId: Uuid,
  targetType: z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/),
  targetId: Uuid,
  targetVersion: Version.nullable(),
  scope: JsonObject,
  verifiedSubject: z.literal(true),
  manifest: z.strictObject({
    manifestHash: Hash,
    stores: z.array(z.strictObject({
      store: z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/),
      itemCount: z.number().int().min(0).max(1000000),
      sharedReferenceCount: z.number().int().min(0).max(1000000)
    })).min(1).max(64)
  }),
  counselDecisionRef: z.string().trim().min(1).max(256).nullable(),
  stepUpToken: z.string().min(20).max(4096),
  reason: NonEmptyText
}).superRefine((v, c) => {
  if ((v.action === "delete" || v.action === "erasure") && v.counselDecisionRef === null) c.addIssue({ code: "custom", path: ["counselDecisionRef"], message: "counsel decision required" });
});
export const Cfg05c02QualityLifecycleActionRequest = z.discriminatedUnion("action", [QualityAction, LifecycleAction]);

export const Cfg05c02QualityLifecycleActionResponse = z.strictObject({
  action: z.enum(["quality_check", "archive", "delete", "anonymize", "hold", "release_hold", "erasure"]),
  qualityCheckRunId: Uuid.nullable(),
  lifecycleRequestId: Uuid.nullable(),
  state: z.enum(["requested", "verifying", "planned", "approved", "blocked", "executing", "running", "healthy", "stale", "completed", "partial", "failed"]),
  targetType: z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/),
  targetId: Uuid,
  targetVersion: Version.nullable(),
  blockingCount: z.number().int().min(0).max(1000000),
  warningCount: z.number().int().min(0).max(1000000),
  manifestHash: Hash.nullable(),
  residualCount: z.number().int().min(0).max(1000000),
  holdConflict: z.boolean(),
  evidenceRef: z.string().max(256).nullable(),
  outboxEventId: Uuid.nullable()
});

export type Cfg05cApiError = z.infer<typeof ApiError>;
~~~

### Contract and policy rules

- Import requires private object identity, format/version, mapping version,
  provenance hash, duplicate policy and field manifest. A dry run emits
  create/update/duplicate/conflict/quarantine/unsupported counts and bounded
  errors before any canonical write.
- Imported ownership, authority, consent, verification, money, rights and
  legal fields remain source-marked claims or quarantine records. They cannot
  satisfy Shard 01, Shard 03, Shard 04 or Shard 06 authorization or truth
  predicates.
- Export requires exact server-validated scope and field manifests, purpose,
  encryption, expiry, download cap and protected-evidence exclusion. The
  artifact is not downloadable by possession of an object key or link.
- Restore requires isolatedTarget true, requested scope, expected hash and
  explicit RLS and accessibility verification. Production promotion is a
  separate runbook-gated step after all checks pass.
- Quality checkers identify exact target and version and return bounded
  findings with field/block/route, severity and rule. Structural, schema,
  reference, required accessibility, privacy, rights and legal blockers
  prevent publish; readability/style are warnings unless policy elevates them.
- Lifecycle actions require a verified subject, scope, complete store manifest,
  step-up and purpose. Legal hold prevents destructive actions, seals and
  minimizes access, and shared authored evidence becomes an operator/counsel
  exception with residual proof.

## Database Schema

All tables are in private schema platform_private, RLS-enabled and forced.
Every field includes SQL type, nullability and constraint. Object IDs refer to
BE00 object metadata, while source/target polymorphic IDs are validated by
registered producer RPCs rather than a generic foreign key. Defaults are
revoked from public, anon and authenticated; only named Worker RPCs have
grants.

### Canonical records and fields

| Table | Fields with SQL type, nullability and constraints | Foreign keys | Query indexes and uniqueness | RLS and grants |
|---|---|---|---|---|
| platform_private.quality_import_jobs | id uuid NOT NULL PRIMARY KEY; source_format text NOT NULL CHECK registered format; source_version bigint NOT NULL CHECK >0; object_id uuid NOT NULL; source_hash text NOT NULL CHECK 64 lowercase hex; target_scope jsonb NOT NULL; mapping_version bigint NOT NULL CHECK >0; duplicate_policy text NOT NULL CHECK reject or quarantine or update_if_version_matches or create_new; state text NOT NULL CHECK draft or dry_run or approved or running or completed or partial or failed or cancelled; cursor integer NOT NULL CHECK 0..500; imported_count integer NOT NULL CHECK 0..500; quarantined_count integer NOT NULL CHECK 0..500; blocked_count integer NOT NULL CHECK 0..500; dry_run_report jsonb NULL; quarantine_object_id uuid NULL; actor_person_id uuid NOT NULL; acting_party_id uuid NULL; idempotency_key text NOT NULL CHECK length 16..128; version_no bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | object_id references platform_private.object_records(id); quarantine_object_id references platform_private.object_records(id); actor_person_id references auth.users(id); acting_party_id references platform_private.party(id); format/mapping are release registry references | UNIQUE actor_person_id and idempotency_key; INDEX state and updated_at; INDEX source_hash; INDEX object_id; INDEX acting_party_id and created_at DESC; INDEX mapping_version and source_format | RLS forced; import RPC checks scope/capability and object intent; worker lease checks cursor/version; no direct authenticated table grant; source claims never enter authority tables |
| platform_private.quality_export_artifacts | id uuid NOT NULL PRIMARY KEY; export_type text NOT NULL CHECK cms or settings or audit_safe_projection or portability_bundle; scope_manifest jsonb NOT NULL; field_manifest jsonb NOT NULL; object_id uuid NULL; checksum text NOT NULL CHECK 64 lowercase hex; encryption_mode text NOT NULL CHECK managed_key or recipient_key; encryption_ref text NOT NULL; expires_at timestamptz NOT NULL; max_downloads integer NOT NULL CHECK 1..3; download_count integer NOT NULL CHECK 0..3; actor_person_id uuid NOT NULL; acting_party_id uuid NULL; purpose text NOT NULL CHECK length 1..512; state text NOT NULL CHECK requested or generating or ready or expired or revoked or failed; version_no bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; revoked_at timestamptz NULL | object_id references platform_private.object_records(id); actor_person_id references auth.users(id); acting_party_id references platform_private.party(id); scope and fields validated against owning projection registries | INDEX actor_person_id, state and expires_at; INDEX acting_party_id and created_at DESC; INDEX checksum; INDEX object_id; partial INDEX ready and expires_at WHERE state = ready; UNIQUE id and version_no | RLS forced; export RPC applies actor scope and field allowlist; object download RPC rechecks current grant, expiry, revocation and count; no object URL in logs |
| platform_private.quality_restore_verifications | id uuid NOT NULL PRIMARY KEY; source_artifact_id uuid NOT NULL; target_environment text NOT NULL; target_scope jsonb NOT NULL; schema_result text NOT NULL CHECK pass or fail or unknown; count_result text NOT NULL CHECK pass or fail or unknown; hash_result text NOT NULL CHECK pass or fail or unknown; reference_result text NOT NULL CHECK pass or fail or unknown; rls_result text NOT NULL CHECK pass or fail or unknown; render_result text NOT NULL CHECK pass or fail or unknown; accessibility_result text NOT NULL CHECK pass or fail or unknown; secret_scan_result text NOT NULL CHECK pass or fail or unknown; state text NOT NULL CHECK requested or restoring or verifying or verified or failed; reviewer_person_id uuid NULL; completed_at timestamptz NULL; evidence_ref text NULL; expected_manifest_hash text NOT NULL CHECK 64 lowercase hex; actual_manifest_hash text NULL CHECK 64 lowercase hex; version_no bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL | source_artifact_id references quality_export_artifacts(id); reviewer_person_id references auth.users(id); target environment is a setup/runbook registry value and never production for initial pass | INDEX source_artifact_id and created_at DESC; INDEX target_environment and state; INDEX state and completed_at; UNIQUE source_artifact_id, target_environment, expected_manifest_hash | RLS forced; restore RPC and isolated verifier only; production promotion requires all result columns pass and runbook approval; authenticated sees status projection only |
| platform_private.quality_check_runs | id uuid NOT NULL PRIMARY KEY; checker_key text NOT NULL CHECK registered key; checker_version bigint NOT NULL CHECK >0; target_type text NOT NULL CHECK registered type; target_id uuid NOT NULL; target_version bigint NOT NULL CHECK >0; state text NOT NULL CHECK requested or running or healthy or stale or failed; findings jsonb NOT NULL; blocking_count integer NOT NULL CHECK 0..1000000; warning_count integer NOT NULL CHECK 0..1000000; evidence_ref text NULL; run_at timestamptz NOT NULL; expires_at timestamptz NOT NULL; actor_person_id uuid NOT NULL; version_no bigint NOT NULL CHECK >0; UNIQUE checker_key, checker_version, target_type, target_id, target_version, run_at | checker and target are code/producer registry references validated by quality RPC; actor_person_id references auth.users(id) | INDEX target_type, target_id, target_version, run_at DESC; INDEX checker_key, checker_version, expires_at; INDEX state and blocking_count; INDEX evidence_ref | RLS forced; checker registry and quality RPC only; target owner/capability rechecked before response; no direct findings write |
| platform_private.quality_data_lifecycle_requests | id uuid NOT NULL PRIMARY KEY; request_type text NOT NULL CHECK archive or delete or anonymize or hold or release_hold or erasure; subject_person_id uuid NOT NULL; scope jsonb NOT NULL; verification jsonb NOT NULL; store_manifest jsonb NOT NULL; manifest_hash text NOT NULL CHECK 64 lowercase hex; conflict_refs uuid[] NOT NULL; decision_ref text NULL; state text NOT NULL CHECK requested or verifying or planned or approved or blocked or executing or completed or partial or failed; requester_person_id uuid NOT NULL; acting_party_id uuid NULL; counsel_decision_ref text NULL; reason text NOT NULL CHECK length 1..512; idempotency_key text NOT NULL CHECK length 16..128; version_no bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; completed_at timestamptz NULL; residual_manifest jsonb NULL | subject_person_id, requester_person_id reference auth.users(id); acting_party_id references platform_private.party(id); conflict_refs reference protected case/hold registry through typed RPC; counsel_decision_ref references approved policy registry when destructive | UNIQUE requester_person_id and idempotency_key; INDEX subject_person_id, request_type, state; INDEX manifest_hash; INDEX state and updated_at; INDEX acting_party_id and created_at DESC; INDEX conflict_refs using GIN | RLS forced; privacy/legal RPC verifies subject/scope, MFA, hold and counsel policy; worker updates only store evidence; held rows sealed and audited; no direct authenticated DML |
| platform_private.quality_lifecycle_store_results | id uuid NOT NULL PRIMARY KEY; request_id uuid NOT NULL; store text NOT NULL CHECK registered store; item_count bigint NOT NULL CHECK >=0; action text NOT NULL CHECK archive or delete or anonymize or hold or release_hold or erasure; state text NOT NULL CHECK pending or executing or completed or partial or failed or blocked; evidence_ref text NULL; attempted_at timestamptz NOT NULL; completed_at timestamptz NULL; error_code text NULL CHECK uppercase code <=64; residual_count bigint NOT NULL CHECK >=0; version_no bigint NOT NULL CHECK >0 | request_id references quality_data_lifecycle_requests(id); store is a code-owned adapter registry reference; no generic FK to heterogeneous stores | UNIQUE request_id, store, action; INDEX request_id, state; INDEX store, state; INDEX error_code; INDEX attempted_at DESC | RLS forced; lifecycle worker and status RPC only; store adapter may append result but cannot mark request complete; authenticated sees aggregate projection only |

### Permission, RLS and grants

The Worker role receives EXECUTE only on portability_action and
quality_lifecycle_action RPCs plus named object-intent, export-download,
restore-verify and lifecycle-lease functions. Security-definer functions use
an empty fixed search path, fully qualified objects and server-derived
RequestContext.

Import RLS requires private object ownership/intent, target scope and actor
capability. Export RLS checks every manifest resource and field before
compilation and again before download. Restore RLS limits initial writes to
isolated targets and requires the expected artifact hash. Quality RLS checks
the exact target/version and checker registry. Lifecycle RLS checks verified
subject, acting party, privacy/legal capability, hold precedence and purpose
grant; a store worker cannot widen a manifest or close a request from one
store result.

## Middleware & Policies

### Hono middleware order

Every route runs request ID, TLS/method/security headers and exact CORS,
content/body size guard, session and acting context, CSRF for cookie
mutations, strict Zod action parsing, target/scope capability policy, step-up
for protected/lifecycle operations, rate limiting, idempotency lookup,
handler/RPC, transaction/outbox, queue lease and ApiError normalization.
Object adapters run after database authorization, never before.

### Per-operation authorization matrix

| Operation ID | Principal and capability | Ownership and scope predicate | Commit or response recheck | Denial result |
|---|---|---|---|---|
| CFG-05C-01 | Admin operator with portability scope; restore operator for isolated target; step-up for protected export/restore | Import object intent, target scope, source format/mapping and manifest are registered; export every resource/field is allowed; restore target is isolated | Lock job/artifact/verification; recheck actor grant, source hash, expected manifest, expiry and target environment | Hidden object/artifact/target 404; visible scope outside grant 403; protected field or failed proof 422 |
| CFG-05C-02 | Quality operator for checker; privacy/legal operator with MFA; support only named purpose grant | Checker owns registered target/version; lifecycle subject and stores are verified; hold/counsel policy applies | Lock request and store manifest; recheck grant, hold, subject, checker version and each store result before terminal state | Hidden target/hold 404; visible action outside capability 403; blocker/hold conflict 422 |

### Security and abuse controls

- Import bytes are scanned privately before mapping. Supported fields,
  relations, routes, media manifests and setting values are mapped through
  versioned registries. Unknown rows are bounded and quarantined; no
  caller-controlled SQL, template, executable, HTML or object path runs.
- Import provenance is preserved and source claims cannot create authority,
  ownership, consent, verification, money, rights or legal status. A duplicate
  policy never overwrites a newer target without an exact version match.
- Export has a server-built allowlist for scope, fields and references.
  Secrets, credentials, private content, unrelated evidence, raw audit
  payload and provider tokens are excluded or require a separate protected
  workflow. Encryption key references never enter response or logs.
- Artifact access rechecks actor, party, scope, expiry, revocation and
  download count. A signed URL or object key is not an authorization decision.
- Restore proof checks schema, counts, hashes, references, RLS, representative
  rendering, accessibility and secret absence. Count-only success is failure.
  The isolated target is fenced from production until proof and runbook
  approval are complete.
- Quality findings include exact target version, location, severity, rule,
  evidence reference and blocker classification. Warnings do not become facts
  or replace human review; stale checker or target results cannot gate current
  content as healthy.
- Lifecycle planning enumerates DB rows, revisions, projections, objects,
  renditions, caches, search, sitemap, exports, backups, processors and
  third-party references. Legal holds block destructive actions and minimize
  access. Erasure separates subject-owned optional content from jointly
  authored evidence and records residual exceptions.
- Rate counters use verified user and acting party. Logs and event payloads
  contain IDs, hashes, versions, counts and codes only, never source bytes,
  private fields, evidence or credentials.

## Data Flow

### Transaction and external seams

| Operation ID | Canonical transaction | External seam request and response | Timeout, retries and circuit breaker |
|---|---|---|---|
| CFG-05C-01 import | Validate private object intent; create import job; scan/map dry run; on approved run lease exact cursor and batch; record quarantine, counts, idempotency and outbox | Object adapter request: object ID, owner scope and scan profile. Response: format, version, source hash and scan result. Mapper request: format/version, mapping version, bounded batch. Response: typed row classifications and target IDs/versions. | Object/mapper call 2,000 ms; 3 retries at 15/60/300 s for safe scan/map only; circuit after 5 failures for 60 s. Unknown scan remains pending; route deadline 15,000 ms and queue handles execution. |
| CFG-05C-01 export | Validate manifest and fields; compile canonical versions; create encrypted object intent and artifact; commit hash, expiry, download cap and audit/outbox | Export compiler request: scope manifest, field manifest, canonical versions and encryption mode. Response: object ID, checksum, encryption reference and manifest hash. | Compiler 2,000 ms, 3 retries at 15/60/300 s; circuit 5/60 s. Unknown compile leaves generating, never ready; download adapter 2,000 ms and one retry only for idempotent metadata. |
| CFG-05C-01 restore | Validate artifact and isolated target; create verification; restore bounded batch; run schema/count/hash/reference/RLS/render/a11y/secret checks; promotion remains runbook-gated | Restore adapter request: source artifact ID, target environment, expected hash and scope. Response: target ID, actual hash and row/object counts. Validator request: target ID and check set. Response: each result pass/fail/unknown plus evidence reference. | Restore/validator attempt 2,000 ms; 3 retries at 15/60/300 s for idempotent verification; circuit 5/60 s. Any fail or unknown prevents verified state and promotion. |
| CFG-05C-02 quality | Lock exact checker/target; insert run; execute checker; persist findings/evidence and outbox | Checker adapter request: checker key/version, target type/id/version and bounded input. Response: findings with location, severity, rule, blocker and evidence reference. | Stored checker timeout 100..2,000 ms; one retry at 250 ms for idempotent read; circuit 5/60 s. Timeout is unknown/stale, never healthy; queued run deadline 15,000 ms. |
| CFG-05C-02 lifecycle | Lock request/manifest; verify subject, hold and policy; lease each store; append result/evidence; derive completed only when every store terminal and no residual conflict | Store processor request: request ID, store name, action, exact manifest subset and idempotency key. Response: attempted/completed counts, residual count, state, error code and evidence reference. | Processor 2,000 ms; 3 retries at 15/60/300 s only for idempotent store operation; circuit 5/60 s per store. Unknown remains partial/pending; held store stays blocked. |

All portability, checker and lifecycle jobs are BE00 at-least-once jobs with
stable idempotency keys and dead-letter evidence after three attempts. A worker
crash after a store commit is reconciled by request/store/action uniqueness.
An unknown provider result is pending, partial or unknown, never complete.

### State machine and concurrency

| Aggregate | Allowed transitions and guards | Concurrent or failure behavior |
|---|---|---|
| Import job | draft to dry_run to approved to running to completed or partial or failed or cancelled | Source and mapping hashes are frozen. Cursor and batch idempotency are CAS-protected; interrupted execution resumes exact cursor; target version mismatch quarantines that row. |
| Export artifact | requested to generating to ready to expired or revoked or failed | Artifact is downloadable only in ready state before expiry and cap. Expiry/revoke removes delivery capability before bytes; duplicate request replays the artifact. |
| Restore verification | requested to restoring to verifying to verified or failed | Initial target is isolated. Any schema/count/hash/reference/RLS/render/a11y/secret failure fences promotion; a later verification uses a new evidence version. |
| Quality check run | requested to running to healthy or stale or failed | Checker and target version are immutable. Target or dependency change marks result stale; duplicate run uses exact idempotency and does not claim current health. |
| Lifecycle request | requested to verifying to planned to approved or blocked to executing to completed or partial or failed | Hold conflict remains blocked. Each store result is unique and retryable; completion requires all store evidence and empty residual obligations. |
| Lifecycle store result | pending to executing to completed or partial or failed or blocked | Store processor cannot close parent. Reconcile after unknown outcome before retrying; completed items remain evidence. |

Import execution never reruns a broad query. Export field and scope manifests
are exact. Restore promotion is separately fenced. Quality publishing uses the
last active output while blockers exist. Lifecycle deletion and erasure are
never inferred from a missing store result; partial state remains open until
operator resolution or a recorded exception.

## Event Schemas

The event uses the BE00 identifier-only envelope: eventId uuid, eventType
literal, occurredAt timestamptz, requestId uuid, correlationId uuid,
actorRef uuid nullable, aggregateId uuid, aggregateVersion bigint and strict
payload. No source bytes, legal rationale, subject identity, evidence content
or store payload is emitted.

~~~ts
export const QualityLifecycleChangedV1 = z.strictObject({
  lifecycleRequestId: z.uuid()
});
~~~

| Event type | Producer operation | Payload and consumer rule |
|---|---|---|
| quality.lifecycle.changed.v1 | CFG-05C-02 | lifecycleRequestId; lifecycle, privacy/legal and admin projections refetch current authorized state and store evidence, never infer completion from the event. |

Import, export, restore and quality-check job transitions use BE00 job/event
records and remain identifier-only. They do not mint additional Shard 05 event
types or duplicate the parent event registry.

## Error Handling

### Boundary mapping

| Boundary | Typed internal failure | HTTP and ApiError code | State guarantee |
|---|---|---|---|
| Action/schema | Unknown action branch, format, field, scope, manifest or oversized body | 400 INVALID_REQUEST or 415 UNSUPPORTED_FORMAT | No object, artifact, checker or lifecycle mutation. |
| Auth/session/step-up | Missing session, expired session or stale MFA | 401 UNAUTHENTICATED or 401 STEP_UP_REQUIRED | No target lookup that could disclose existence and no lease. |
| Capability/scope | Visible target outside portability, quality, privacy/legal or purpose grant | 403 FORBIDDEN | No mutation, download or destructive lease. |
| Visibility | Object, artifact, target, hold or subject not visible | 404 NOT_FOUND | No existence, count, snippet, artifact or hold leakage. |
| Version/hash/idempotency | Changed target, manifest, checker, source or duplicate key | 409 VERSION_CONFLICT, MANIFEST_CONFLICT or IDEMPOTENCY_CONFLICT | Transaction rolls back; prior active output and evidence remain. |
| Domain safety | Protected field, unsupported mapping, blocking finding, hold/shared-record conflict | 422 PROTECTED_FIELD, BLOCKING_FINDING or HOLD_CONFLICT | Import quarantines, export refuses, publish remains active, lifecycle remains blocked. |
| Provider/worker | Storage, mapper, checker, validator or store timeout/unavailability | 503 PORTABILITY_UNAVAILABLE or LIFECYCLE_UNAVAILABLE; 504 UPSTREAM_TIMEOUT | Pending, unknown, stale or partial state; never ready, healthy or complete. |
| Unexpected | Unclassified exception | 500 INTERNAL_ERROR | Rollback and safe request ID telemetry; no false terminal state. |

### Operation error coverage

| Operation ID | Required edge cases and recovery |
|---|---|
| CFG-05C-01 | Unsupported format/version, malformed mapping, duplicate/conflict, ownership/authority import claim, protected export field, expired/revoked artifact, download over cap, restore count-only pass with schema/hash/reference/RLS/render/a11y failure, and interrupted cursor; quarantine, deny, expire or retry exact state. |
| CFG-05C-02 | Structural/schema/reference/a11y/privacy/rights/legal blocker, stale checker/target, unavailable diagnostic dependency, missing store, legal hold, shared evidence, failed processor and residual erasure; preserve active output, block/partial state and store-by-store evidence. |

## Observability

| Operation ID | Required structured event and metrics | Trace and redaction |
|---|---|---|
| CFG-05C-01 import | quality.import.changed with job ID, state, source format/version, mapping version, cursor, counts and outcome; quarantine, conflict, retry and DLQ metrics | Trace object scan, mapper and target RPC; source bytes, rows, ownership claims and private fields are scrubbed |
| CFG-05C-01 export | quality.export.changed with artifact ID, export type, manifest hash, state, expiry and download count; rejected-field, expiry, revoke and download-denial metrics | Trace compiler and object intent; no fields, scope IDs, encryption references or object links |
| CFG-05C-01 restore | quality.restore.changed with verification ID, target environment, result-state vector and outcome; false-confidence and proof-failure metrics | Trace isolated restore and validators; target payload, object bytes and secret scan content are excluded |
| CFG-05C-02 quality | quality.check.changed with run ID, checker key/version, target type/version, state and finding counts; blocker, stale, unknown and latency metrics | Trace checker registry and adapter; finding text and evidence content are redacted |
| CFG-05C-02 lifecycle | quality.lifecycle.changed with request ID, action, state, manifest hash, store count, residual count and outcome; hold, partial, conflict, deletion and reconciliation metrics | Trace planner and each store lease; subject identity, legal rationale, evidence and store payload are excluded |

Logs use BE00 severity, environment, release, service, operation, outcome,
latency, requestId and correlationId. provider-native diagnostic sinks receive only scrubbed exception
metadata. Metrics distinguish requested, running, ready, healthy, stale,
unknown, blocked, partial, failed, expired and revoked; no absent evidence
implies success.

## Testing Strategy

### Contract and route tests

| Operation ID | Contract and route acceptance tests |
|---|---|
| CFG-05C-01 | Parse each strict import/export/restore branch; reject unknown keys, unsupported format, missing dry-run fields, protected export fields, non-isolated restore and oversized manifests; assert exact 403/404/409/415/422/503 and ApiError envelope. |
| CFG-05C-02 | Parse quality checker and all six lifecycle actions; reject missing subject, manifest, step-up or counsel ref; assert blocker, hold, stale, unknown, partial and terminal projections with CORS and idempotent replay. |

### Authorization, persistence and concurrency tests

- For both operations test anonymous, wrong valid user, wrong party, forged
  object/artifact/target ID, expired/revoked grant, missing/stale MFA, hidden
  subject, stale target version and changed manifest. Match the exact matrix.
- Verify direct table access is denied to anon and authenticated. Positive and
  negative RLS/RPC tests cover admin portability, restore, quality, privacy/
  legal and named support purpose grants.
- Run two identical imports, exports, restores and lifecycle requests and
  assert one job/artifact/verification/request, one outbox event where
  applicable and identical replay response. Crash after object or store commit
  must reconcile by idempotency before retry.
- Change a target after import dry run or quality start and assert quarantine
  or stale result rather than overwrite. Revoke export grant before download
  and assert access denied even with a previously issued object link.
- Create a legal hold while lifecycle execution is queued and a shared
  evidence conflict during planning. Assert destructive stores block, optional
  subject-owned records are separated and residual manifest remains open.

### Security, performance and recovery tests

- Fuzz import bytes, mapping keys, field manifests, scope manifests, checker
  inputs and lifecycle JSON. Confirm no SQL, template, executable, HTML,
  path traversal, secret or provider token reaches adapters or logs.
- Prove imported claims cannot satisfy ownership, authority, consent,
  verification, money, rights or legal policy. Prove export count, filename,
  object key and manifest cannot disclose protected fields.
- Measure command route under 15-second deadline and queue adapters at exact
  2,000 ms provider timeout. Assert three retries at 15/60/300 seconds,
  circuit open after five failures for 60 seconds and DLQ after three worker
  attempts.
- Simulate storage, mapper, checker, validator and lifecycle provider timeout,
  duplicate delivery, unknown commit, partial store and restore false
  confidence. Assert pending, unknown, stale, failed or partial—not ready,
  healthy or complete.
- Verify export encryption and expiry, artifact revocation, isolated restore,
  secret scan, RLS negative tests, accessibility verification and no
  production promotion before all proof fields pass.

### Accessibility handoff tests

The FE companion must render import mapping, row classification, dry-run
counts, quarantine errors and exact cursor state as keyboard-accessible tables.
Export scope/field allowlists, expiry, encryption and download limit are
announced in text. Restore verification presents every schema/count/hash/
reference/RLS/render/accessibility result, not just a green count. Quality
findings identify target, field/block/route, severity, rule and human-review
state. Lifecycle UI announces hold, blocker, store progress, residual
manifest and partial completion with semantic status rather than color alone.

## Deepening Passes

| Pass | Resulting hardening |
|---|---|
| Micro contract pass | Added strict action unions, bounded manifests, format/version enums, isolated restore literal, consent/counsel/step-up refinements and exact result vectors. |
| Boundary pass | Kept BE00 object/upload/job ownership intact; separated source claims from canonical truth, quality evidence from publication, and lifecycle orchestration from Shard 06 legal/evidence truth. |
| Adversarial pass | Rejected protected exports, authority imports, link-possession downloads, count-only restore, stale checker health, hold bypass and shared-evidence deletion. |
| Failure/recovery pass | Added exact cursors, per-store idempotency, unknown/pending/partial states, retry/circuit behavior, isolated restore fencing and residual manifests. |
| Data pass | Typed every table field, constraint, FK or registry rationale, index, forced RLS and named grant. |
| Macro consistency pass | Reconciled four 25.10 features, two interactions, six canonical/support models and the exact lifecycle event with 05a/05b and Shard 06 ownership. |

## Ambiguity Gate

PASS. Evidence:

- Micro: CFG-05C-01 and CFG-05C-02 each have strict action-specific
  request/success contracts, exact ApiError/status mappings, explicit
  403/404 behavior, rate/idempotency rules and operation-keyed tests.
- Macro: all four 25.10 ledger rows, two interactions, five canonical model
  names, one supporting store-result model and quality.lifecycle.changed.v1
  map once; settings/admin ownership is explicit.
- External seams: object, mapper, compiler, restore validator, checker and
  store adapters have exact request/response, timeout, retry/backoff and
  circuit behavior. Unknown outcomes remain pending, stale, blocked or
  partial.
- Persistence: every table field has SQL type, nullability, constraint,
  foreign key or registered polymorphic rationale, index, forced RLS and
  grant boundary.
- Transport: every registry row names CORS and exact BE00
  ApiError { code, message, requestId, details }.
- Tables: Markdown table widths were checked after authoring; cells contain
  no unescaped pipe separators.
- No unresolved gap, hidden authorization rule or undecided choice
  remains in this split.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored 05c backend contracts from approved Shard 05 IA and deep dive; reconciled 25.10.01 through 25.10.04 | /write-be-spec | All |
| 2026-08-28 | Added strict portability branches, isolated restore proof, quality blockers, hold precedence and store-level lifecycle recovery | /write-be-spec-write | API, database, middleware, events, tests |

## Dependency References

- BE00 Cross-cutting platform foundation: ApiError, RequestContext,
  object intents, jobs, idempotency, outbox, logging, SLOs and recovery.
- Shard 01 Identity authority and party governance: session, acting party,
  subject verification and MFA freshness.
- Shard 03 CMS content modeling and authoring: canonical content revisions,
  import/export projections and quality target versions.
- Shard 04 CMS navigation, media and delivery: media manifests, renditions,
  route projections, restore references and delivery quality.
- Shard 05a settings, flags and runtime: settings definitions and values
  accepted only through typed registry/import rules.
- Shard 05b admin workspace and operations: admin capabilities, task/audit
  projections and diagnostic evidence.
- Shard 06 Trust and safety: legal holds, safety cases, evidence and
  counsel-gated restrictions; this split stores references and orchestration.
