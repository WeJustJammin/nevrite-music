# BE-09b — Roster, invitations and vault access

## Split Group

This companion owns per-song roster events and projections, scoped invitations, governed asset/blob metadata, NDA acceptance, role-profile evidence, derived short-lived access grants and manual source declarations. It does not own identity/party records, credit truth, audio lineage, project containers, sessions, packages, rights or local-agent state. The parent source is [IA Shard 09 — Music projects and collaboration](../ia/09-projects-collaboration.md).

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Boundary | Capability-derived roster and confidentiality boundary | IA scope and access-control rows, lines 9–24 and 264–289. |
| Operations | Four routes for `PRJ-05`, `PRJ-06`, `PRJ-07`, `PRJ-19` | IA interaction rows 82–84 and 96. |
| Data | Nine canonical tables, all append-only or derived; no per-asset hand-grant table | IA Data Models rows 183–187 and 203, typed registry lines 222–229 and 259. |
| Launch | Web/PWA manual invitation, asset access, source declaration and roster flows | IA Delivery Phases lines 40–44 and Surface Applicability lines 355–357. |
| Security | Sensitivity and NDA checks precede listing, counts, URLs, streaming and downstream projections | IA Global Interaction Rules lines 104–111 and Edge Cases lines 325–344. |
| Explicit exclusions | No bearer-link privilege, platform AI/source detection, credit deletion, per-asset hand grants, or public/anonymous vault audience | IA Access Control lines 268–276 and Delivery Phases line 44. |

## Referenced Material Inventory

| Source file | Section and lines | Material used | Trace |
|---|---|---|---|
| [IA parent](../ia/09-projects-collaboration.md) | Overview/Scope Reconciliation, lines 1–24 | Owner, confidentiality and launch boundary | IA-09B-SCOPE |
| [IA parent](../ia/09-projects-collaboration.md) | Features and Delivery Phases, lines 26–44 | Roster, invitation, vault and source-declaration capability limits | IA-09B-FEATURES |
| [IA parent](../ia/09-projects-collaboration.md) | PRJ-05 through PRJ-07, PRJ-19, lines 52–54 and 96 | Preconditions, completion and failure/recovery behavior | IA-09B-INT |
| [IA parent](../ia/09-projects-collaboration.md) | Contracts, lines 113–143 and 168–172 | `ChangeRoster`, `IssueInvitation`, `ResolveVaultAccess`, `RecordSourceDeclaration`, `SensitivityClass` | IA-09B-CONTRACT |
| [IA parent](../ia/09-projects-collaboration.md) | Data Models and Typed Field Registry, lines 174–205 and 222–229, 259 | Exact model identifiers and fields | IA-09B-DATA |
| [IA parent](../ia/09-projects-collaboration.md) | Access Control/Escalation and Accessibility, lines 264–299 | Role capabilities, hidden-resource behavior and accessible denial | IA-09B-ACCESS |
| [IA parent](../ia/09-projects-collaboration.md) | Event Schemas, lines 301–319 | Roster/access/source events and PII exclusions | IA-09B-EVENT |
| [IA parent](../ia/09-projects-collaboration.md) | Edge Cases and Edge-Case Coverage Matrix, lines 321–387 | Forwarded invites, revocation, unresolved roles, deletion and replay | IA-09B-EDGE |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | Canonical Field Contracts, lines 22–33 and 61 | Roster, invite, asset, blob, NDA and source-declaration fields | DD09B-FIELDS |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | Roster, Invitation and Access Algorithm, lines 76–85 | Ordered authorization and short-lived grant algorithm | DD09B-ACCESS |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | Abuse and Recovery Verification, lines 153–169 | Anti-leak, revocation and no-hand-grant controls | DD09B-RECOVERY |
| [Feature ledger](../feature-ledger.md) | rows 62–63, 265, 272 | Assigned roster, invitation, vault and declaration features | FL-09B |
| [BE00](00-infrastructure.md) | Shared context, error, storage, idempotency, cache and audit contracts | Inherited platform behavior | BE00-INHERIT |

## IA Source Map

### Interaction map

| IA interaction | IA lines | Backend operation | Owned result |
|---|---:|---|---|
| `PRJ-05` Manage roster | 82 | `PRJ-05` `POST /api/v1/songs/{songId}/roster-events` | Roster projection, Shard 07 claim command and notices |
| `PRJ-06` Invite contributor | 83 | `PRJ-06` `POST /api/v1/songs/{songId}/invitations` | T0/T1/T2 invitation state and scoped grant record |
| `PRJ-07` Access vault asset | 84 | `PRJ-07` `POST /api/v1/songs/{songId}/assets/{assetId}/access-grants` | Short-lived derived stream/download grant or safe denial |
| `PRJ-19` Declare source use | 96 | `PRJ-19` `POST /api/v1/songs/{songId}/source-declarations` | Versioned source fact and downstream clearance reference |

### Model map

| IA first-column identifier | IA line | Ownership in this companion |
|---|---:|---|
| `roster_event` | 183 | Append-only party/shell/entity role event |
| `roster_projection` | 183 | Derived current involvement/access projection |
| `contributor_invitation` | 184 | Scoped recipient-bound invitation and typed response |
| `asset` | 185 | Song/version-linked governed asset metadata |
| `asset_blob` | 185 | Immutable checksum/residency metadata, locator protected |
| `nda_acceptance` | 186 | Identity, terms version and acceptance evidence |
| `access_grant` | 186 | Derived short-lived grant/revocation state |
| `role_access_profile_version` | 187 | Candidate role profile evidence; enforcement reads `vault_role_class` on Shard 07 role version |
| `source_declaration` | 203 | Append-only asset/section source fact |

### Event map

| IA event type | IA line | Producer/consumer treatment |
|---|---:|---|
| `project.roster.changed.v1` | 306 | Published after roster event/projection and Shard 07 claim outbox commit |
| `project.access.changed.v1` | 307 | Published for role, block, NDA, asset or material-policy revocation; no content payload |
| `project.source-declaration.changed.v1` | 315 | Published after declaration supersession; downstream clearance/readiness consumes it |
| `project.song.changed.v1` | 305 | Consumed for song visibility only; song owner is 09a |
| `project.version.ingested.v1` | 308 | Consumed to bind an asset to an exact version; audio truth is 09c |
| `project.recall-projection-access.changed.v1` | 317 | Not produced; recall grant is 09d |

Events contain opaque IDs, state, version, reason codes and hashes only. They never include invitation contacts, asset bytes, hidden names, NDA terms, source notes or unrestricted PII.

## Feature Ledger Coverage

| Ledger ID | Capability | Ledger line | Backend treatment |
|---|---|---:|---|
| `07.03.01` | Contributor Roster & Per-Song Role Assignment | 62 | `PRJ-05`; explicit subject disambiguation and append-only claim event |
| `07.03.02` | Contributor Invitation & Scoped Onboarding | 63 | `PRJ-06`; T0/T1/T2 disclosure ladder and intended identity binding |
| `07.03.03` | Rights-Aware Asset Vault & NDA Gating | 265 | `PRJ-07`; role/sensitivity/NDA intersection and revocable grant |
| `07.08.04` | Source Declaration — Samples, Interpolations & AI Content | 272 | `PRJ-19`; voluntary manual declaration, no detection or clearance mutation |

## Endpoint Completeness Reconciliation

| IA interaction | Route | Request | Success | Errors and recovery | Event/audit |
|---|---|---|---|---|---|
| `PRJ-05` | `POST /api/v1/songs/{songId}/roster-events` | `ManageRosterRequest` | `RosterMutationResponse` | `FORBIDDEN`, `VALIDATION_FAILED`, `ROLE_UNRESOLVED`, `VERSION_CONFLICT` | `project.roster.changed.v1`, Shard 07 claim command, audit |
| `PRJ-06` | `POST /api/v1/songs/{songId}/invitations` | `InviteContributorRequest` | `InvitationResponse` | `FORBIDDEN`, `VALIDATION_FAILED`, `NDA_REQUIRED`, `VERSION_CONFLICT` | `project.access.changed.v1`, audit |
| `PRJ-07` | `POST /api/v1/songs/{songId}/assets/{assetId}/access-grants` | `AccessGrantRequest` | `AccessGrantResponse` | `FORBIDDEN`, `ACCESS_REVOKED`, `NDA_REQUIRED`, `ROLE_CLASS_UNASSIGNED`, `ASSET_NOT_FOUND` | `project.access.changed.v1`, audit |
| `PRJ-19` | `POST /api/v1/songs/{songId}/source-declarations` | `SourceDeclarationRequest` | `SourceDeclarationResponse` | `FORBIDDEN`, `VALIDATION_FAILED`, `ASSET_NOT_FOUND`, `VERSION_CONFLICT` | `project.source-declaration.changed.v1`, audit |

## Shared Contract Inheritance

BE00 supplies request IDs, authentication context, idempotency fingerprints, `ApiError { code, message, requestId, details }`, tenant-safe lookup, storage quarantine, signed URL revocation, cache purge, audit hashing and outbox delivery. BE01 is the identity and authority source; this companion only references party, shell and block IDs. BE07 is the role taxonomy and credit-claim source; this companion stores a bounded roster event and claim command but never edits credit records. A role with no `vault_role_class` or a pending alias floors to `review` and cannot obtain a higher-sensitivity grant.

## API Endpoints

### Authoritative Route Registry

| Operation ID | IA interaction | Method and path | Request → success | Auth / ownership / 403 versus 404 | Middleware incl. CORS | Idempotency / concurrency | Rate / timeout / cache / SLO | Error envelope | Event |
|---|---|---|---|---|---|---|---|---|---|
| `PRJ-05` | `PRJ-05` | `POST /api/v1/songs/{songId}/roster-events` | `ManageRosterRequest` → `RosterMutationResponse` | `roster:write` from current song-role union; hidden song 404, known song without capability 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → idempotency → audit`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(song_id, idempotency_key)` unique; projection version CAS; one event per command | 30 requests/minute/party; 900 ms deadline; purge roster/access cache; p95 ≤ 450 ms | `ApiError { code, message, requestId, details }` | `project.roster.changed.v1` |
| `PRJ-06` | `PRJ-06` | `POST /api/v1/songs/{songId}/invitations` | `InviteContributorRequest` → `InvitationResponse` | `may_invite` on current role union; hidden song 404, known song without capability 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → idempotency → audit`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(song_id, idempotency_key)` unique; invitation version CAS; delivery is outbox-owned | 10 requests/minute/party; 1,200 ms command deadline; no contact/body cache; p95 ≤ 650 ms | `ApiError { code, message, requestId, details }` | `project.access.changed.v1` |
| `PRJ-07` | `PRJ-07` | `POST /api/v1/songs/{songId}/assets/{assetId}/access-grants` | `AccessGrantRequest` → `AccessGrantResponse` | Live role/sensitivity/NDA/block intersection; hidden song or asset 404, known target with denied policy 403 or `ACCESS_REVOKED` | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → idempotency → signedGrant`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(asset_id, identity_id, idempotency_key)` unique; grant version and revocation epoch CAS | 120 requests/minute/identity; 500 ms deadline; grant TTL 15 min; p95 ≤ 250 ms | `ApiError { code, message, requestId, details }` | `project.access.changed.v1` |
| `PRJ-19` | `PRJ-19` | `POST /api/v1/songs/{songId}/source-declarations` | `SourceDeclarationRequest` → `SourceDeclarationResponse` | Contributor or higher role with asset/section read; hidden song/asset 404, known unauthorized 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → idempotency → audit`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(target_id, idempotency_key)` unique; declaration version CAS; supersession append-only | 30 requests/minute/party; 900 ms deadline; purge declaration projection; p95 ≤ 450 ms | `ApiError { code, message, requestId, details }` | `project.source-declaration.changed.v1` |

### Registry invariants

1. Authorization is evaluated over the current per-song role union, not a cached hand grant. Tenant-scoped lookup precedes policy disclosure; hidden resources return 404 and known policy denial returns 403 only after safe existence is established.
2. The exact shared envelope is `ApiError { code, message, requestId, details }`. Details include safe required action, state or field path; they never include hidden asset names, contact addresses, role membership, NDA text, source notes or storage locators.
3. Invitation disclosure is monotonic by tier: T0 context may be forwarded, T1 streams only one non-confidential pinned rough, and T2 requires verified intended identity and current NDA acceptance. A bearer link never becomes T1 or T2.
4. `access_grant` is derived and short-lived. Role, block, NDA, asset state or material-policy changes increment a revocation epoch and invalidate signed URLs and caches. No API or table grants a per-asset hand permission.

### Pagination and response bounds

Collection behavior is explicit outside the operation matrices. Each command returns one bounded object; no cursor is accepted. `limit` caps the bounded input or projection and cannot be raised by the caller.

| Operation ID | Pagination and cursor | Limit and rationale |
|---|---|---|
| `PRJ-05` | Pagination: N/A; cursor: N/A | One append-only roster event and projection; request body limit 32 KiB. |
| `PRJ-06` | Pagination: N/A; cursor: N/A | One invitation; entries limit 50 and request body limit 32 KiB. |
| `PRJ-07` | Pagination: N/A; cursor: N/A | One access grant; scope list limit 32 and request body limit 16 KiB. |
| `PRJ-19` | Pagination: N/A; cursor: N/A | One source declaration; request body limit 32 KiB. |

### Operation contract and error matrix

| Operation ID | Request and validation | Success | Declared errors | Recovery |
|---|---|---|---|---|
| `PRJ-05` | Explicit subject discriminator, role version or bounded literal, add/end action, active-involvement check and expected projection version | Projection version, Shard 07 claim command ID and notices ID | `FORBIDDEN`, `VALIDATION_FAILED`, `ROLE_UNRESOLVED`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | Retry the projection read after role taxonomy resolves; replaying the command key returns the original bounded literal/claim, while derived access fails closed until resolution |
| `PRJ-06` | Roster event IDs, recipient binding, tier, expiry, material capability and suppression check | Invitation ID, delivery state, response type and scoped grant reference | `FORBIDDEN`, `VALIDATION_FAILED`, `NDA_REQUIRED`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | Delivery retry uses same outbox ID; decline/expiry/suppression preserve roster attribution |
| `PRJ-07` | Exact song/asset, requested stream/download, identity and current role/NDA context | Grant ID, signed URL token, expiry, sensitivity and revocation epoch | `FORBIDDEN`, `ACCESS_REVOKED`, `NDA_REQUIRED`, `ROLE_CLASS_UNASSIGNED`, `ASSET_NOT_FOUND` | Retry only after re-resolving the current policy and satisfying the required action; revocation invalidates the grant, and downloaded bytes cannot be reclaimed |
| `PRJ-19` | Asset or section target, state enum, source kind/details when declared, optional superseded declaration | Declaration version and clearance reference | `FORBIDDEN`, `VALIDATION_FAILED`, `ASSET_NOT_FOUND`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | Retry with the current declaration version, or supersede to `not_reviewed`; no rights, split or clearance mutation |

### Route field validation matrix

| Operation ID | Path and body fields | Limits and invariants | Rejection |
|---|---|---|---|
| `PRJ-05` | `songId`, `event_kind`, `subject`, `role_version?`, `role_literal?`, `expected_projection_version`, `idempotency_key` | Subject is party, shell or entity, never name-only; role literal ≤ 120; end requires active involvement | `VALIDATION_FAILED` before event append |
| `PRJ-06` | `songId`, `roster_event_ids`, `intended_recipient_hash`, `disclosure_tier`, `expires_at`, `material_refs`, `delegate_party_id?` | 1–100 event IDs; expiry 15 minutes–30 days; T1/T2 material proof; T2 NDA/identity gate | `VALIDATION_FAILED` or `NDA_REQUIRED` |
| `PRJ-07` | `songId`, `assetId`, `requested_mode`, `acting_context_version`, `idempotency_key` | Mode stream/download; grant TTL ≤ 15 minutes; role class must meet sensitivity; tombstoned asset unavailable | `VALIDATION_FAILED`, `ROLE_CLASS_UNASSIGNED`, `ASSET_NOT_FOUND` |
| `PRJ-19` | `songId`, `asset_id?`, `section_ref?`, `state`, `kind?`, `details?`, `supersedes_id?` | Exactly asset or section; state `none`, `unknown`, `declared`, `not_reviewed`; declared requires kind/details; details ≤ 2,000 | `VALIDATION_FAILED` |

## Request/Response Contracts (Zod 4 schemas)

```ts
import { z } from "zod";

const UUID = z.string().uuid();
const Version = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const IdempotencyKey = z.string().trim().min(16).max(128);
const ApiError = z.object({
  code: z.enum([
    "VALIDATION_FAILED", "FORBIDDEN", "RESOURCE_NOT_FOUND", "ROLE_UNRESOLVED",
    "ROLE_CLASS_UNASSIGNED", "NDA_REQUIRED", "ACCESS_REVOKED", "ASSET_NOT_FOUND",
    "VERSION_CONFLICT", "IDEMPOTENCY_MISMATCH", "STORAGE_UNAVAILABLE", "DEPENDENCY_UNAVAILABLE"
  ]),
  message: z.string().trim().min(1).max(240),
  requestId: UUID,
  details: z.record(z.string(), z.json())
}).strict();

const ActorContext = z.object({
  actor_person_id: UUID,
  acting_party_id: UUID.optional(),
  acting_context_version: Version,
  idempotency_key: IdempotencyKey,
  request_id: UUID
}).strict();

const Subject = z.discriminatedUnion("subject_kind", [
  z.object({ subject_kind: z.literal("party"), party_id: UUID }).strict(),
  z.object({ subject_kind: z.literal("shell"), shell_id: UUID }).strict(),
  z.object({ subject_kind: z.literal("entity"), entity_id: UUID }).strict()
]);

export const ManageRosterRequest = ActorContext.extend({
  song_id: UUID,
  event_kind: z.enum(["propose", "activate", "end"]),
  subject: Subject,
  role_version: UUID.optional(),
  role_literal: z.string().trim().min(1).max(120).optional(),
  expected_projection_version: Version
}).strict().refine(x => Boolean(x.role_version || x.role_literal), "role version or bounded literal required");

export const RosterMutationResponse = z.object({
  roster_event_id: UUID,
  roster_projection_id: UUID,
  claim_command_id: UUID,
  notices_id: UUID,
  involvement_state: z.enum(["proposed", "active", "ended"]),
  access_projection_state: z.enum(["available", "pending_role", "revoked"]),
  version: Version,
  audit_event_id: UUID,
  event_id: UUID
}).strict();

const MaterialRef = z.object({
  asset_id: UUID,
  pinned_version_id: UUID.optional(),
  confidentiality: z.enum(["public", "review", "stems", "takes", "restricted"])
}).strict();

export const InviteContributorRequest = ActorContext.extend({
  song_id: UUID,
  roster_event_ids: z.array(UUID).min(1).max(100),
  intended_recipient_hash: z.string().regex(/^[a-f0-9]{64}$/),
  disclosure_tier: z.enum(["T0", "T1", "T2"]),
  expires_at: z.string().datetime({ offset: true }),
  material_refs: z.array(MaterialRef).min(1).max(20),
  delegate_party_id: UUID.optional()
}).strict();

export const InvitationResponse = z.object({
  invitation_id: UUID,
  delivery_state: z.enum(["draft", "sent", "delivered", "accepted", "declined", "expired", "suppressed", "failed"]),
  disclosure_tier: z.enum(["T0", "T1", "T2"]),
  scoped_grant_id: UUID.nullable(),
  response_kind: z.enum(["pending", "accepted", "declined", "expired", "suppressed", "failed"]),
  version: Version,
  audit_event_id: UUID,
  event_id: UUID
}).strict();

export const AccessGrantRequest = ActorContext.extend({
  song_id: UUID,
  asset_id: UUID,
  requested_mode: z.enum(["stream", "download"])
}).strict();

export const AccessGrantResponse = z.object({
  grant_id: UUID,
  asset_id: UUID,
  mode: z.enum(["stream", "download"]),
  sensitivity_class: z.enum(["roster", "review", "stems", "takes", "restricted"]),
  signed_url: z.string().url(),
  expires_at: z.string().datetime({ offset: true }),
  revocation_epoch: Version,
  event_id: UUID
}).strict();

const SourceDeclared = z.object({
  state: z.literal("declared"),
  kind: z.enum(["sample", "interpolation", "ai", "other"]),
  details: z.string().trim().min(1).max(2000)
}).strict();
const SourceNotDeclared = z.object({
  state: z.enum(["none", "unknown", "not_reviewed"]),
  kind: z.never().optional(),
  details: z.never().optional()
}).strict();

export const SourceDeclarationRequest = ActorContext.extend({
  song_id: UUID,
  asset_id: UUID.optional(),
  section_ref: UUID.optional(),
  declaration: z.union([SourceDeclared, SourceNotDeclared]),
  supersedes_id: UUID.optional()
}).strict().refine(x => Boolean(x.asset_id) !== Boolean(x.section_ref), "exactly one target required");

export const SourceDeclarationResponse = z.object({
  declaration_id: UUID,
  target_id: UUID,
  state: z.enum(["none", "unknown", "declared", "not_reviewed"]),
  version: Version,
  clearance_ref: UUID.nullable(),
  event_id: UUID,
  audit_event_id: UUID
}).strict();

export type ApiError = z.infer<typeof ApiError>;
export type ManageRosterRequest = z.infer<typeof ManageRosterRequest>;
export type RosterMutationResponse = z.infer<typeof RosterMutationResponse>;
export type InviteContributorRequest = z.infer<typeof InviteContributorRequest>;
export type InvitationResponse = z.infer<typeof InvitationResponse>;
export type AccessGrantRequest = z.infer<typeof AccessGrantRequest>;
export type AccessGrantResponse = z.infer<typeof AccessGrantResponse>;
export type SourceDeclarationRequest = z.infer<typeof SourceDeclarationRequest>;
export type SourceDeclarationResponse = z.infer<typeof SourceDeclarationResponse>;
```

### Contract field traceability

| Field | IA source | Enforcement |
|---|---|---|
| `event_kind`, `subject`, `role_version`, `role_literal`, `expected_projection_version` | `ChangeRoster` and PRJ-05, lines 52, 82, 137 | Explicit subject union, role resolution and CAS |
| `roster_event_ids`, `intended_recipient_hash`, `disclosure_tier`, `expires_at`, `material_refs` | `IssueInvitation` and PRJ-06, lines 53 and 83 | Tier capability check and intended binding |
| `asset_id`, `requested_mode` | `ResolveVaultAccess` and PRJ-07, lines 54, 84, 140 | Sensitivity, role, block, NDA and residency intersection |
| `state`, `kind`, `details`, target and `supersedes_id` | `RecordSourceDeclaration` and PRJ-19, lines 96 and 171 | Closed state, declared payload requirement and append-only supersession |

## Database Schema

### Canonical records and fields

| Table | Typed fields with nullability and constraints | Foreign keys, indexes and RLS/grants |
|---|---|---|
| `roster_event` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `subject_kind text NOT NULL CHECK (subject_kind IN ('party','shell','entity'))`; `subject_id uuid NOT NULL`; `role_version_id uuid NULL`; `role_literal text NULL CHECK (role_literal IS NULL OR char_length(role_literal) <= 120)`; `event_kind text NOT NULL CHECK (event_kind IN ('propose','activate','end'))`; `authored_by_person_id uuid NOT NULL`; `acting_context_version bigint NOT NULL CHECK (acting_context_version >= 0)`; `effective_at timestamptz NOT NULL`; `claim_id uuid NULL`; `access_profile_version bigint NULL`; `version bigint NOT NULL CHECK (version >= 0)`; `created_at timestamptz NOT NULL` | FK `song_id → song.id`, `role_version_id → role_version.id` opaque BE07 reference, `authored_by_person_id → person.id`, `claim_id → claim.id` opaque BE07 reference; indexes `(song_id, created_at DESC)`, `(song_id, subject_id, effective_at DESC)`, `(claim_id)`; RLS song owner/roster-role read and capability-scoped append, no update/delete grants |
| `roster_projection` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `subject_kind text NOT NULL`; `subject_id uuid NOT NULL`; `role_version_id uuid NULL`; `role_literal text NULL`; `involvement_state text NOT NULL CHECK (involvement_state IN ('proposed','active','ended'))`; `vault_role_class text NOT NULL CHECK (vault_role_class IN ('roster','review','stems','takes','restricted'))`; `blocked boolean NOT NULL DEFAULT false`; `valid_from timestamptz NOT NULL`; `valid_to timestamptz NULL`; `source_event_id uuid NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)` | FK `song_id → song.id`, `source_event_id → roster_event.id`, role reference opaque; indexes `(song_id, subject_id, involvement_state)`, `(song_id, valid_to)`, `(subject_id, blocked)`; RLS derived policy only, no client insert/update/delete, service projection grant |
| `contributor_invitation` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `roster_event_ids jsonb NOT NULL CHECK (jsonb_array_length(roster_event_ids) BETWEEN 1 AND 100)`; `inviter_person_id uuid NOT NULL`; `delegate_party_id uuid NULL`; `intended_recipient_hash text NOT NULL CHECK (intended_recipient_hash ~ '^[a-f0-9]{64}$')`; `disclosure_tier text NOT NULL CHECK (disclosure_tier IN ('T0','T1','T2'))`; `material_refs jsonb NOT NULL`; `delivery_state text NOT NULL`; `response_kind text NOT NULL`; `expires_at timestamptz NOT NULL`; `contact_suppressed boolean NOT NULL DEFAULT false`; `version bigint NOT NULL CHECK (version >= 0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL` | FK `song_id → song.id`, `inviter_person_id → person.id`, `delegate_party_id → party.id`; invitation/event IDs are JSON references because an invitation can bind a bounded set; indexes `(song_id, expires_at, delivery_state)`, `(intended_recipient_hash, song_id)`; RLS inviter/authorized owner sees status, recipient sees only intended preview, no contact address grant |
| `asset` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `source_version_id uuid NULL`; `kind text NOT NULL`; `sensitivity_class text NOT NULL CHECK (sensitivity_class IN ('roster','review','stems','takes','restricted'))`; `declared_owner_party_id uuid NOT NULL`; `state text NOT NULL CHECK (state IN ('active','redacted','tombstoned'))`; `version bigint NOT NULL CHECK (version >= 0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL` | FK `song_id → song.id`, `declared_owner_party_id → party.id`; `source_version_id` opaque 09c pointer with no cross-writer FK; indexes `(song_id, sensitivity_class, state)`, `(source_version_id)`, `(declared_owner_party_id, state)`; RLS sensitivity policy before row projection, owner/role read; GRANT policy: authenticated SELECT via RLS, domain/storage function INSERT, client UPDATE/DELETE revoked |
| `asset_blob` | `id uuid NOT NULL PRIMARY KEY`; `asset_id uuid NOT NULL`; `checksum text NOT NULL CHECK (checksum ~ '^[a-f0-9]{64}$')`; `bytes bigint NOT NULL CHECK (bytes >= 0)`; `media_type text NOT NULL CHECK (char_length(media_type) <= 120)`; `residency text NOT NULL CHECK (residency IN ('hot','cold','tombstoned'))`; `storage_locator text NOT NULL`; `integrity_state text NOT NULL CHECK (integrity_state IN ('unverified','verified','failed'))`; `tombstoned_at timestamptz NULL`; `created_at timestamptz NOT NULL` | FK `asset_id → asset.id`; unique `(asset_id, checksum)`; indexes `(asset_id, residency, integrity_state)`, `(checksum)`; storage locator never selected through user RLS, service-only grant, signed URL function is the only locator consumer |
| `nda_acceptance` | `id uuid NOT NULL PRIMARY KEY`; `subject_identity_id uuid NOT NULL`; `song_id uuid NOT NULL`; `terms_version text NOT NULL CHECK (char_length(terms_version) BETWEEN 1 AND 80)`; `accepted_at timestamptz NOT NULL`; `method text NOT NULL CHECK (method IN ('web','api','support_recovery'))`; `evidence_hash text NOT NULL CHECK (evidence_hash ~ '^[a-f0-9]{64}$')`; `created_at timestamptz NOT NULL` | FK `subject_identity_id → identity.id`, `song_id → song.id`; unique `(subject_identity_id, song_id, terms_version)`; indexes `(subject_identity_id, song_id, accepted_at DESC)`; RLS subject and authorized song owner can read acceptance state, terms/evidence details service-only; GRANT policy: authenticated state SELECT via RLS, acceptance function INSERT, evidence columns service-role only, UPDATE/DELETE revoked |
| `access_grant` | `id uuid NOT NULL PRIMARY KEY`; `asset_id uuid NOT NULL`; `subject_identity_id uuid NOT NULL`; `sensitivity_class text NOT NULL`; `mode text NOT NULL CHECK (mode IN ('stream','download'))`; `grant_version bigint NOT NULL CHECK (grant_version >= 0)`; `revocation_epoch bigint NOT NULL CHECK (revocation_epoch >= 0)`; `token_hash text NOT NULL CHECK (token_hash ~ '^[a-f0-9]{64}$')`; `expires_at timestamptz NOT NULL`; `revoked_at timestamptz NULL`; `revocation_reason text NULL`; `created_at timestamptz NOT NULL` | FK `asset_id → asset.id`, `subject_identity_id → identity.id`; unique `(asset_id, subject_identity_id, grant_version)`; indexes `(subject_identity_id, expires_at, revoked_at)`, `(asset_id, revocation_epoch)`; RLS subject can see active grant metadata, service-only token hash, revoke function only, no direct update/delete |
| `role_access_profile_version` | `id uuid NOT NULL PRIMARY KEY`; `profile_key text NOT NULL`; `profile_version integer NOT NULL CHECK (profile_version >= 0)`; `candidate_rows jsonb NOT NULL`; `enforceable boolean NOT NULL DEFAULT false`; `approved_by_person_id uuid NULL`; `approved_at timestamptz NULL`; `source_evidence_hash text NOT NULL`; `created_at timestamptz NOT NULL`; unique `(profile_key, profile_version)` | FK `approved_by_person_id → person.id`; indexes `(profile_key, profile_version DESC)`, `(enforceable, approved_at)`; RLS service and owner diagnostics read only, no enforcement write from this table, no client grants |
| `source_declaration` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `asset_id uuid NULL`; `section_ref uuid NULL`; `state text NOT NULL CHECK (state IN ('none','unknown','declared','not_reviewed'))`; `kind text NULL CHECK (kind IS NULL OR kind IN ('sample','interpolation','ai','other'))`; `details text NULL CHECK (details IS NULL OR char_length(details) <= 2000)`; `authored_by_person_id uuid NOT NULL`; `declared_at timestamptz NOT NULL`; `supersedes_id uuid NULL`; `clearance_ref uuid NULL`; `version bigint NOT NULL CHECK (version >= 0)`; CHECK exactly one of `asset_id` and `section_ref` is non-null | FK `song_id → song.id`, `asset_id → asset.id`, `authored_by_person_id → person.id`, `supersedes_id → source_declaration.id`; `section_ref` opaque document/section reference with no cross-domain FK; indexes `(song_id, asset_id, declared_at DESC)`, `(song_id, section_ref, declared_at DESC)`, `(supersedes_id)`; RLS song contributor-role read/append, downstream clearance gets event projection only; GRANT policy: authenticated contributor SELECT/INSERT via RLS, clearance projection read-only, UPDATE/DELETE revoked |

Grant invariant applies row-for-row: client API roles receive no direct table `GRANT`; authenticated reads and writes use the named RLS or command function, while the service role receives only least-privilege `GRANT EXECUTE` on that function. No raw table grant exposes roster, asset, or vault data.

### Persistence invariants

- Roster events are append-only. Ending involvement sets the derived projection to ended and revokes access; it never removes attribution, credit or version history.
- If the role taxonomy is unavailable, a bounded literal and Shard 07 claim command commit in one outbox transaction, but the projection cannot authorize vault access until a role profile resolves.
- Invitations store recipient hashes and roster event IDs, never contact addresses in the domain row. Delivery outcomes are typed and attribution survives decline, expiry, suppression and failure.
- Asset sensitivity is a hard ceiling. An access grant is computed from all live roles, role class, block state, NDA terms, asset residency and material policy. No direct grant path can bypass that intersection.
- `source_declaration` is a factual, voluntary record. Supersession returns `not_reviewed` when a declaration is removed and cannot mutate rights, split, clearance or ownership state.

## Middleware & Policies

### Hono middleware order

1. `requestId` creates or validates UUID and binds it to response, audit and trace.
2. `cors(consumer-web-pwa)` permits the configured web/PWA origin allowlist and mutation headers; credentialed wildcard origins are rejected.
3. `authContext` validates BE00 session, acting party and context version; stale context stops before subject lookup.
4. `rateLimit` selects party, identity and IP buckets; strict Zod schemas reject unknown fields and oversized payloads.
5. `tenantScope` resolves song and asset under owning-party policy before any count, role or state disclosure.
6. `roleResolution` loads current BE07 role version and block state; unresolved role is a bounded event for PRJ-05 and a deny for PRJ-07.
7. `authorization` checks capability, sensitivity, NDA, intended invitation identity and target ownership.
8. `idempotency` fingerprints command body and reserves the key; mismatch returns 409 without mutation.
9. `transactionAuditOutbox` commits row, audit and event; `signedGrant` creates only an expiring token after the transaction.
10. `responseFilter` strips contacts, locator, NDA evidence, hidden names and source notes from the response.

### Per-operation authorization matrix

| Operation ID | Required capability and ownership | 403 versus 404 | Idempotency and rate | CORS and output policy |
|---|---|---|---|---|
| `PRJ-05` | Current per-song role has `roster:write`; subject is explicit party, shell or entity | Hidden song 404; known song without capability 403; ambiguous subject is 400 | `(song, actor, key)` replay; 30/minute/party | `consumer-web-pwa`; no hidden personnel, search result or role profile leakage |
| `PRJ-06` | Current role has `may_invite`; material supports tier and recipient is not suppressed | Hidden song 404; known song without capability 403; unsupported tier 400 | `(song, actor, key)` replay; 10/minute/party | `consumer-web-pwa`; contact hash and T0 preview only |
| `PRJ-07` | Live role class meets asset sensitivity and current NDA/block/residency policy | Hidden song/asset 404; known denied target 403 or `ACCESS_REVOKED` | `(asset, identity, key)` replay; 120/minute/identity | `consumer-web-pwa`; signed URL only, no locator/name leakage |
| `PRJ-19` | Contributor or higher role that may read target asset/section | Hidden target 404; known role without capability 403 | `(target, actor, key)` replay; 30/minute/party | `consumer-web-pwa`; declaration details only to authorized project roles |

### Security and abuse controls

- Subject resolution requires an explicit discriminator. Name search cannot bind an existing party; shell IDs are bounded until BE01 claims them.
- T1/T2 invitations use one-time recipient binding, short expiry, replay detection and no privilege from forwarded bearer material. T2 acceptance requires verified identity and exact current NDA terms version.
- Signed grants carry asset ID hash, identity hash, grant version, revocation epoch and expiry. Edge and origin check epoch on every new range request; cache keys include grant version.
- Role, block, NDA, asset or source policy changes purge active grants and signed-URL cache. Already downloaded bytes cannot be recalled and are never represented as protected.
- Source details are encrypted at rest and absent from events, logs and downstream projections unless the authorized project role requests them. provider-native diagnostics gets operation ID and safe code only.
- Abuse buckets: 10 failed access decisions per identity/asset/10 minutes, 10 invitations per party/10 minutes, 5 MB declaration details per minute and 20 roster conflict responses per minute.

## Data Flow

### Transaction and external seams

| Seam | Exact request and response | Timeout | Retry | Circuit behavior |
|---|---|---:|---:|---|
| BE00 context/idempotency | `RequestContext { requestId, actorPersonId, actingPartyId?, contextVersion, key }` → `ContextDecision { accepted, fingerprint, replay? }` | 100 ms | 0 retries; no backoff; in-process | N/A for network circuit (in-process); fail closed when context unavailable |
| BE01 party/identity authority | `ResolveSubject { subjectKind, subjectId, actorPersonId, partyId }` → `SubjectDecision { visible, boundPartyId?, blocked, authorityVersion }` | 300 ms | 2 at 50 ms and 100 ms | Open after 5 failures for 30 s; hidden target remains 404 |
| BE07 role taxonomy/claims | `ResolveSongRole { songId, actorPartyId, capability }` → `RoleDecision { allowed, roleVersion, vaultRoleClass?, claimRefs }` | 400 ms | 2 at 75 ms and 150 ms | Open after 5 failures for 30 s; PRJ-07 denies, PRJ-05 records bounded literal |
| BE00 storage/signed URL | `IssueAssetGrant { assetId, identityId, mode, grantVersion, epoch, expiresAt }` → `SignedGrant { token, expiry, epoch }` | 500 ms | 2 at 100 ms and 250 ms | Open after 4 failures for 20 s; return `STORAGE_UNAVAILABLE` |
| Shard 07 role event | `RosterClaimCommand { rosterEventId, subjectRef, roleVersion, idempotencyKey }` → `ClaimReceipt { claimId, status }` | 600 ms | 3 at 100 ms, 300 ms, 900 ms | Open after 5 failures for 30 s; local event is retained and derived access stays closed |
| Notification adapter | `InvitationNotice { invitationId, tier, recipientHash, expiresAt }` → `DeliveryReceipt { deliveryId, status }` | 1,000 ms | 3 at 100 ms, 300 ms, 900 ms | Open after 5 failures for 60 s; invitation remains typed pending/failed |

External seams receive hashes and opaque references only. No adapter receives asset bytes, invitation contacts, NDA terms, hidden roster fields or source notes.

### State machines and concurrency

- Roster involvement is `proposed → active → ended`. Events are append-only and projection version CAS serializes competing edits.
- Invitation is `draft → sent → delivered → accepted, declined, expired, suppressed`. A response is terminal for that invitation version and cannot grant access without identity/NDA policy.
- Asset blob is `uploading → settling → hot → cold → tombstoned`; the record remains after bytes tombstone. A failed checksum is never readable.
- Access grant is `active → revoked | expired`; every policy change increments revocation epoch. New reads fail even if a previous token has remaining TTL.
- Source declaration appends versions; one target's current projection is the highest accepted version. Supersession never deletes historical evidence.
- Outbox events are at-least-once and deduplicated by event type, aggregate ID and version. A consumer cannot widen access from a stale event.

### Failure recovery

| Failure | Durable result | Retry/recovery |
|---|---|---|
| Role taxonomy unavailable | Roster literal/claim event commits; derived access closed | Rebuild role projection when BE07 returns |
| Invitation delivery timeout | Invitation remains pending or typed failed; attribution remains | Retry delivery with same outbox ID |
| Forwarded invitation | Bearer gets T0 only | Intended identity must complete separate T1/T2 checks |
| NDA missing or stale | No grant row or signed URL | Accept current terms, then issue a new key |
| Revocation during stream | Epoch increment and cache purge | New range request receives `ACCESS_REVOKED`; bytes already read remain unrecalled |
| Asset checksum failure | Blob `integrity_state=failed`; no access grant | Quarantine/re-upload under new hash; asset history remains |
| Declaration target removed | Historical declaration retained, projection unavailable | Append `not_reviewed`; no downstream rights mutation |
| Concurrent roster edit | One expected version wins | Loser reloads projection and resubmits |

## Event Schemas

### Payload contracts

| Event type | Required payload | Privacy and delivery |
|---|---|---|
| `project.roster.changed.v1` | `eventId uuid`, `songId uuid`, `subjectRefHash text`, `roleVersionId uuid?`, `eventKind`, `involvementState`, `accessProfileVersion bigint?`, `version bigint` | No subject name, contact, role notes or claim details; outbox dedupe by aggregate/version |
| `project.access.changed.v1` | `eventId uuid`, `songId uuid`, `subjectRefHash text`, `reasonCode`, `state`, `revocationEpoch bigint`, `version bigint` | No asset name, sensitivity source, NDA terms or token; invalidation consumers only |
| `project.source-declaration.changed.v1` | `eventId uuid`, `songId uuid`, `targetRef uuid`, `state`, `kind`, `version bigint`, `clearanceRef uuid?` | No source details, notes or unrestricted PII; downstream receives fact/status only |
| `project.song.changed.v1` | `eventId uuid`, `songId uuid`, `songVersion bigint`, `sourceHash text` | Consumed only; no title or body |
| `project.version.ingested.v1` | `eventId uuid`, `songId uuid`, `versionId uuid`, `checksum text`, `residency`, `integrity` | Consumed only; no bytes or author contact |
| `project.recall-projection-access.changed.v1` | `eventId uuid`, `sheetVersionId uuid`, `recipientPartyId uuid`, `grantState`, `expiresAt`, `policyHash` | Consumed only; recall owner is 09d |

## Error Handling

### Boundary mapping

| Condition | HTTP | `code` | Safe details |
|---|---:|---|---|
| Missing discriminator, invalid tier/state or oversized details | 400 | `VALIDATION_FAILED` | Field path and allowed bounds |
| Hidden song or asset | 404 | `RESOURCE_NOT_FOUND` or `ASSET_NOT_FOUND` | Empty details |
| Known resource without roster/contributor capability | 403 | `FORBIDDEN` | Required action only |
| Role profile unavailable | 409 | `ROLE_UNRESOLVED` | Bounded role state; no hidden identity |
| Role has no vault class | 403 | `ROLE_CLASS_UNASSIGNED` | Required action and review floor |
| Missing/current NDA not accepted | 403 | `NDA_REQUIRED` | Terms version hash, never terms text |
| Grant/token revoked | 403 | `ACCESS_REVOKED` | Retry action and request ID |
| Expected projection or declaration moved | 409 | `VERSION_CONFLICT` | Committed version number |
| Reused idempotency key with different body | 409 | `IDEMPOTENCY_MISMATCH` | Fingerprint hash only |
| Storage or authority dependency unavailable | 503 | `STORAGE_UNAVAILABLE` or `DEPENDENCY_UNAVAILABLE` | Retry-after bucket |

### Operation error coverage

| Operation ID | 400 | 403 | 404 | 409 | 503 |
|---|---|---|---|---|---|
| `PRJ-05` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `ROLE_UNRESOLVED`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |
| `PRJ-06` | `VALIDATION_FAILED` | `FORBIDDEN`, `NDA_REQUIRED` | `RESOURCE_NOT_FOUND` | `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |
| `PRJ-07` | `VALIDATION_FAILED` | `FORBIDDEN`, `ACCESS_REVOKED`, `NDA_REQUIRED`, `ROLE_CLASS_UNASSIGNED` | `ASSET_NOT_FOUND` | `IDEMPOTENCY_MISMATCH` | `STORAGE_UNAVAILABLE`, `DEPENDENCY_UNAVAILABLE` |
| `PRJ-19` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND`, `ASSET_NOT_FOUND` | `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |

Every failure serializes exactly as `ApiError { code, message, requestId, details }`; no error branch leaks resource existence before authorization.

## Observability

| Operation ID | Metrics | Structured logs | Trace and alerts |
|---|---|---|---|
| `PRJ-05` | roster event count, unresolved-role count, conflict rate, projection lag | song ID, subject hash, role version, event kind, result | `prj.roster.manage`; alert unresolved-role surge and projection lag |
| `PRJ-06` | invitations by tier/state, delivery latency, suppression count | invitation ID, song ID, recipient hash, tier, result | `prj.invitation.issue`; alert T2 denial/delivery failure spike |
| `PRJ-07` | access decisions, grant issuance, revocation hits, epoch mismatch | asset ID, identity hash, sensitivity, mode, decision code | `prj.vault.grant`; alert repeated denials and token replay |
| `PRJ-19` | declaration state/kind, validation failures, supersession count | target ID, actor hash, state, detail hash, result | `prj.source_declaration.write`; alert attempted detection-like bulk writes |

No log contains invitation address, asset name, body, source details, NDA text, signed URL, storage locator or hidden personnel. provider-native diagnostic sinks receive request ID, operation ID and error code only.

## Testing Strategy

### Contract and route tests

| Operation ID | Required tests |
|---|---|
| `PRJ-05` | Subject discriminator and name-only rejection; role literal bound; role outage commits bounded event but denies derived access; end revokes access; 403 versus hidden 404; CAS/idempotency; Shard 07 claim outbox; CORS and exact ApiError |
| `PRJ-06` | T0/T1/T2 material gates; forwarded bearer remains T0; T2 identity/NDA; suppression/expiry/decline typed responses; delivery replay; 403/404; CORS and exact ApiError |
| `PRJ-07` | Role union and highest class; pending alias floors review; NDA/block/residency denial; signed URL TTL; revocation epoch during range request; hidden asset 404; CORS and exact ApiError |
| `PRJ-19` | Target XOR; state/kind/details discriminator; declared and not-reviewed transitions; source details privacy; supersession and CAS; downstream event; CORS and exact ApiError |

### Persistence, concurrency and recovery tests

- Migration tests inspect each field's SQL type, nullability, check, FK or opaque-reference rationale, index, RLS policy and grant. Direct client writes to projections, blobs, grants and audit paths are denied.
- Property tests prove an ended involvement cannot delete attribution, a grant cannot exceed asset sensitivity, a bearer invitation cannot elevate tier, and a declaration cannot mutate rights or clearance.
- Concurrent roster and declaration writes use serializable expected versions; exactly one projection version and one audit/outbox pair wins.
- Revocation tests issue a token, increment policy epoch, request a new range and assert immediate `ACCESS_REVOKED`; already-rendered bytes are not relabelled.
- Dependency tests inject BE00/BE01/BE07/storage/notification timeouts and duplicate outbox delivery; retries preserve idempotency and never expose private payload.
- Playwright tests cover keyboard-accessible invitation tier text, focus-stable denial, readable sensitivity/NDA explanations and no hidden asset name in DOM or accessible name.

## Deepening Passes

| Pass | Evidence and resolution |
|---|---|
| Boundary | Roster, invitation, asset, vault and declaration ownership traced to IA lines 82–84 and 96; no identity, credit or rights write |
| Interaction | Four IA IDs map one-to-one to registry rows, contracts, error rows, observability and tests |
| Contract | Strict Zod 4 discriminated unions cover subject, tier, access mode and declaration state |
| Authorization | Current role union, sensitivity ceiling, block and NDA checks precede grants; 403/404 rule is explicit |
| Persistence | Nine tables list every domain field with SQL type, nullability, constraints, FKs or opaque rationale, indexes, RLS and grants |
| Concurrency | Roster/declaration CAS, invitation terminal state and grant epoch prevent duplicate/elevated effects |
| Recovery | Role outage, forwarded invite, delivery failure, revocation, checksum failure and source supersession converge safely |
| Privacy | Contact, asset, NDA, source and locator fields are hashed or excluded from events/logs/projections |
| Accessibility | Denial names required action; tier/NDA copy precedes acceptance; keyboard and screen-reader paths are specified |
| Cross-shard | BE00, BE01, BE07, storage and notification seams have exact payload, timeout, retry and circuit behavior |

## Ambiguity Gate

PASS. Evidence: `PRJ-05`, `PRJ-06`, `PRJ-07` and `PRJ-19` each have one authoritative route; role taxonomy is an input and unresolved roles fail closed for access; invitation tiers never elevate through bearer forwarding; asset access is derived rather than hand-granted; source declarations are factual and do not imply clearance; every route has CORS and the exact BE00 error envelope; all 52 parent model identifiers are distributed across the five companions; assigned model fields are typed with constraints and RLS/grants; tables and links are structurally valid; and no open implementation choice was invented.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored roster, invitation, vault-access and source-declaration backend companion | `/write-be-spec` | All |
| 2026-08-28 | Locked strict contracts, policy intersection, typed persistence, revocation epoch and ambiguity evidence | `/write-be-spec-write` | API, contracts, database, security, tests |

## Dependency References

- [BE00 Cross-cutting platform foundation](00-infrastructure.md) — request context, errors, idempotency, storage, signed URLs, cache purge, audit and outbox.
- [IA Shard 01 Identity authority](../ia/01-identity-authority.md) — party, shell, identity, membership, authority and block source.
- [IA Shard 07 Credits core](../ia/07-credits-core.md) — role taxonomy, claim commands and credit boundary.
- [IA Shard 09 parent](../ia/09-projects-collaboration.md) — source of truth for assigned interactions and model/event fields.
- [IA Shard 20 Licensing core](../ia/20-licensing-core.md) — downstream asset evidence consumer; no rights mutation here.
- [IA Shard 22 Release and distribution](../ia/22-release-distribution.md) — downstream declaration/clearance consumer; no release authority here.
