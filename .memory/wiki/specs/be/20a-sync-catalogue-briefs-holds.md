# Sync Catalogue, Briefs and Holds — Backend Specification

## Split Group

Shard 20 licensing core, split 20a. This companion owns catalogue publication projections, professional scope searches, buyer briefs and bilateral licence holds for LIC-01 through LIC-04. It does not own rights truth, clearance authority, policy folds, quotes, issued instruments or lifecycle state. Those remain with Shard 10 or the other Shard 20 companions.

## Classification

| Capability | Classification | Boundary decision |
|---|---|---|
| LIC-01 catalogue preparation | Command plus derived projection | PostgreSQL records the human-confirmed publication candidate and emits a projection event; work, master, asset and rights authority remain upstream. |
| LIC-02 professional search | Scoped query | Search returns publication-approved fields and advisory clearance age only; a search result never grants rights or substitutes for a fresh gate. |
| LIC-03 brief and pitch request | Command | The brief freezes buyer, named licensee, named end client, hard constraints, LicenceScope and deadline; pitch candidates are bounded and terminal. |
| LIC-04 hold request | Protected command | A hold reserves both required sides for an exact scope and time window only after a fresh conflict and clearance check; unknown or partial reservation fails closed. |

BE00 inheritance is mandatory for every operation: requestId, authenticated acting context, strict Zod 4 parsing, idempotency ledger, audit record, transactional outbox, RLS and the global `ApiError { code, message, requestId, details }` envelope are platform contracts, not duplicated platform endpoints. Rate limits are explicit per operation: LIC-CAT-API-01 `catalogueProjectionWrite` 30/minute per acting party, LIC-CAT-API-02 `catalogueSearch` 60/minute per actor, LIC-CAT-API-03 `briefCreate` 20/hour per buyer, and LIC-CAT-API-04 `holdCreate` 30/hour per buyer; every bucket returns `429 RATE_LIMITED` with `Retry-After` seconds.

### IA Feature Mapping

The following `## Features` bullets are reproduced verbatim from `../ia/20-licensing-core.md:36-40` and mapped to the owning backend route registries.

| IA feature bullet (verbatim) | BE coverage and authoritative operations |
|---|---|
| **11.01 Sync Licensing** — [ideation source](../ideation/11-music-licensing/11.01-sync-licensing/11.01-sync-licensing-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [20a](20a-sync-catalogue-briefs-holds.md#authoritative-route-registry): `LIC-CAT-API-01`–`LIC-CAT-API-04`. |
| **11.02 Clearance & One-Stop Status** — [ideation source](../ideation/11-music-licensing/11.02-clearance-one-stop-status/11.02-clearance-one-stop-status-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [20b](20b-clearance-evidence-consent.md#authoritative-route-registry): `LIC-CLR-API-01`–`LIC-CLR-API-04`. |
| **11.03 Licence Pricing & Negotiation** — [ideation source](../ideation/11-music-licensing/11.03-licence-pricing-negotiation/11.03-licence-pricing-negotiation-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [20c](20c-owner-policy-quotes-mfn.md#authoritative-route-registry): `LIC-POL-API-04`–`LIC-POL-API-06`. |
| **11.04 Licensing Policy & Rights-Holder Preferences** — [ideation source](../ideation/11-music-licensing/11.04-licensing-policy-preferences/11.04-licensing-policy-preferences-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [20c](20c-owner-policy-quotes-mfn.md#authoritative-route-registry): `LIC-POL-API-01`–`LIC-POL-API-03`. |
| **11.08 Licence Instrument & Lifecycle** — [ideation source](../ideation/11-music-licensing/11.08-licence-instrument-lifecycle/11.08-licence-instrument-lifecycle-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [20d](20d-licence-issuance-verification-lifecycle.md#authoritative-route-registry): `LIC-INS-API-01`–`LIC-INS-API-05`. |

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 20](../ia/20-licensing-core.md) | Interactions, lines 64–71 | Normative preconditions, behavior, completion and recovery for LIC-01 through LIC-04. |
| [IA Shard 20](../ia/20-licensing-core.md) | Global Interaction Rules, lines 88–95 | Fresh issuance gate, distinct consent parties, privacy, consideration and issued-scope constraints. |
| [IA Shard 20](../ia/20-licensing-core.md) | Contracts, lines 99–119 | LicenceScope, ClearanceVerdict, evidence states and CreateHold semantics. |
| [IA Shard 20](../ia/20-licensing-core.md) | Data Models, lines 133–164 and 157–182 | Catalogue, brief, pitch and hold ownership, cardinality and deterministic field typing. |
| [IA Shard 20](../ia/20-licensing-core.md) | Access Control and Event Schemas, lines 184–232 | Role boundaries, audience-safe projections and licensing catalogue or hold events. |
| [IA Shard 20](../ia/20-licensing-core.md) | Edge Cases and matrices, lines 234–297 | No-scope, stale verdict, partial reservation, deletion, concurrency and cross-shard behavior. |
| [Deep Dive 20](../ia/deep-dives/20-licensing-core.md) | Scope and Clearance Algorithm, lines 18–27 | Pinned grammar, explicit territory, bitemporal inputs, precedence and audience projections. |
| [Deep Dive 20](../ia/deep-dives/20-licensing-core.md) | Abuse and Recovery Verification, lines 73–85 | Cached-clear prevention, partial-issue protection, exclusion races and projection authority. |
| [Deep Dive 20](../ia/deep-dives/20-licensing-core.md) | Cross-Shard Contracts and Implementation Envelope, lines 87–104 | BE00, identity, works/assets, rights and PostgreSQL/RLS/queue/outbox seams. |
| [BE00](00-infrastructure.md) | Request/Response Contracts and Deterministic Protocol Rules | ApiError { code, message, requestId, details }, request IDs, replay hashes, audit and fail-closed defaults inherited by all four operations. |

## IA Source Map

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| LIC-01 Owner prepares sync catalogue entry | LIC-CAT-API-01 | Binds work, master and assets only after human tag confirmation and governed asset evidence for asset-backed flags; projection is derived and carries no rights authority. |
| LIC-02 Professional buyer searches | LIC-CAT-API-02 | Requires a complete scope snapshot; returns publication-approved candidates with advisory verdict and age, never a cached right or default scope. |
| LIC-03 Buyer creates brief and pitch request | LIC-CAT-API-03 | Freezes hard constraints, named licensee, named end client, target scope, deadline and clearance requirement; rejects inferred affiliates and makes candidate pitches terminal. |
| LIC-04 Buyer requests hold | LIC-CAT-API-04 | Rechecks conflicts and clearance fresh, reserves both required sides atomically for exact scope and window, expires automatically and refuses unknown or partial holds. |

## Endpoint Completeness Reconciliation

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| LIC-01 | Publish a human-confirmed sync catalogue projection | LIC-CAT-API-01 | Versioned projection with governed asset evidence, publication state and licensing.catalogue.changed.v1 outbox event. |
| LIC-02 | Search eligible catalogue projections by scope | LIC-CAT-API-02 | Scope-pinned candidate page with advisory clearance verdict age and no rights authority. |
| LIC-03 | Create buyer brief and bounded pitches | LIC-CAT-API-03 | Frozen brief, candidate pitch records and terminal-state guarantee or named empty constraint. |
| LIC-04 | Reserve both required rights sides | LIC-CAT-API-04 | Atomic bilateral hold or typed refusal; exclusion check and expiry are durable. |

## API Endpoints

### Authoritative Route Registry

This is the sole route registry for this companion. Every contract, error, authorization, idempotency, rate, observability and test row below keys to an operation ID here.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| LIC-CAT-API-01 | POST | /api/v1/licensing/catalogue-projections | LIC-01 | Work or licensing administrator with owner/mandate scope and asset evidence authority. | 201 PrepareCatalogueSuccess |
| LIC-CAT-API-02 | POST | /api/v1/licensing/catalogue-searches | LIC-02 | Authenticated professional buyer or buyer representative with declared scope. | 200 SearchCatalogueSuccess |
| LIC-CAT-API-03 | POST | /api/v1/licensing/briefs | LIC-03 | Buyer or declared-mandate representative; licensee and end client remain named. | 201 CreateBriefSuccess |
| LIC-CAT-API-04 | POST | /api/v1/licensing/holds | LIC-04 | Buyer or declared-mandate representative for the brief and candidate scope. | 201 CreateHoldSuccess |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 acting-context verifier | {accessToken, actingContextId, resourceId, requiredRole} → {actorId, partyId, roles, mandateVersion, contextVersion} | 300 ms | 2 retries at 50 ms and 150 ms before mutation | Open after 5 failures in 30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| Shard 09 work/master/asset resolver | {workId, masterId, assetIds, expectedVersions} → {workVersion, masterVersion, assets, governedEvidenceRefs} | 700 ms | 2 retries at 100 ms and 300 ms using the same read key | Open after 4 failures in 30 s; candidate remains unpublished and returns DEPENDENCY_UNAVAILABLE; half-open after 20 s. |
| Shard 10 rights and fresh clearance resolver | {workId, scopeHash, requiredSides, asOf} → {sideVersions, clearanceVerdict, snapshotId, evaluatedAt} | 800 ms | 2 retries at 100 ms and 300 ms; no cache accepted for hold | Open after 4 failures in 30 s; search marks advisory verdict unknown and hold refuses CLEARANCE_UNKNOWN; half-open after 20 s. |
| Search projection index | {projectionVersion, scopeHash, query, cursor} → {candidateIds, publicationFields, advisorySnapshotAge, nextCursor} | 500 ms | 2 retries at 75 ms and 225 ms; projection retry is idempotent | Open after 4 failures in 30 s; read returns INDEX_UNAVAILABLE without manufacturing candidates; half-open after 20 s. |
| BE00 queue and outbox | {eventType, aggregateId, version, idempotencyKey} → {outboxId, acceptedAt} | 400 ms | 3 retries at 100 ms, 300 ms and 900 ms | Open after 5 failures in 30 s; canonical transaction commits with dispatch pending; half-open after 15 s. |

## Request/Response Contracts

All operation responses use BE00 requestId and the exact global error shape ApiError { code, message, requestId, details }. Unknown resource existence is not disclosed. Idempotency-Key is required as a header and its normalized body hash is stored in BE00's idempotency ledger.

### Zod 4 Contract Definitions

```typescript
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const LicenceScopeSchema = z.strictObject({
  grammarVersion: z.string().min(1).max(64),
  media: z.array(z.string().min(1)).min(1),
  dataUse: z.array(z.string().min(1)).min(1),
  territoryCountries: z.array(z.string().length(2)).min(1),
  termTrigger: z.string().min(1).max(128),
  termDuration: z.string().min(1).max(128),
  exclusivity: z.enum(["non_exclusive", "exclusive"]),
  usage: z.array(z.string().min(1)).min(1),
  scale: z.string().min(1).max(128),
  extent: z.string().min(1).max(128),
  granteePartyId: z.uuid()
});

const ApiErrorSchema = z.strictObject({
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: z.uuid(),
  details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)
});

export const PrepareCatalogueRequest = z.strictObject({
  workId: z.uuid(),
  masterId: z.uuid(),
  assetIds: z.array(z.uuid()).min(1).max(200),
  humanConfirmedTagIds: z.array(z.uuid()).min(1).max(500),
  assetBackedFlags: z.record(z.string(), z.boolean()),
  expectedWorkVersion: z.int().nonnegative(),
  expectedMasterVersion: z.int().nonnegative()
});
export const PrepareCatalogueSuccess = z.strictObject({
  projectionId: z.uuid(),
  state: z.enum(["eligible", "blocked"]),
  version: z.int().positive(),
  blockedReasons: z.array(z.string()),
  requestId: z.uuid()
});

export const SearchCatalogueRequest = z.strictObject({
  scope: LicenceScopeSchema,
  query: z.string().trim().min(1).max(200),
  cursor: z.string().max(512).optional(),
  limit: z.int().min(1).max(100).default(25)
});
export const SearchCatalogueSuccess = z.strictObject({
  results: z.array(z.strictObject({
    projectionId: z.uuid(),
    workId: z.uuid(),
    advisoryVerdict: z.enum(["unknown", "blocked", "contested", "encumbered", "incomplete", "consent_needed", "clearable_now"]),
    snapshotAgeSeconds: z.int().nonnegative().nullable(),
    remedyClass: z.string().min(1).max(64)
  })),
  nextCursor: z.string().max(512).nullable(),
  requestId: z.uuid()
});

export const CreateBriefRequest = z.strictObject({
  licenseeId: z.uuid(),
  endClientId: z.uuid(),
  mandateId: z.uuid().nullable(),
  scope: LicenceScopeSchema,
  hardConstraints: z.record(z.string().regex(/^[a-z][a-z0-9_.-]{0,63}$/), z.string().trim().min(1).max(512)).max(64),
  deadline: z.iso.datetime(),
  clearanceRequirement: z.enum(["advisory", "fresh_before_hold", "fresh_before_issue"])
});
export const CreateBriefSuccess = z.strictObject({
  briefId: z.uuid(),
  pitchIds: z.array(z.uuid()),
  state: z.enum(["candidate_bounded", "no_candidate"]),
  bindingConstraint: z.string().nullable(),
  requestId: z.uuid()
});

export const CreateHoldRequest = z.strictObject({
  briefId: z.uuid(),
  projectionId: z.uuid(),
  scope: LicenceScopeSchema,
  windowStart: z.iso.datetime(),
  windowEnd: z.iso.datetime(),
  expectedBriefVersion: z.int().positive(),
  expectedProjectionVersion: z.int().positive()
});
export const CreateHoldSuccess = z.strictObject({
  holdId: z.uuid(),
  state: z.enum(["active", "expired"]),
  expiresAt: z.iso.datetime(),
  reservedSideCount: z.int().positive(),
  requestId: z.uuid()
});
export const LicensingApiError = ApiErrorSchema;
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| LIC-CAT-API-01 | PrepareCatalogueRequest with Idempotency-Key | PrepareCatalogueSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| LIC-CAT-API-02 | SearchCatalogueRequest with Idempotency-Key | SearchCatalogueSuccess / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| LIC-CAT-API-03 | CreateBriefRequest with Idempotency-Key | CreateBriefSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| LIC-CAT-API-04 | CreateHoldRequest with Idempotency-Key | CreateHoldSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| LIC-CAT-API-01 | Require UUID work/master/assets, positive expected versions, at least one human-confirmed tag, and an asset-backed flag only when each flagged asset has governed evidence. Reject machine-only tags and stale work or master versions before mutation. |
| LIC-CAT-API-02 | Require a complete supported LicenceScope, explicit country codes and nonempty query. Unset scope axes are non-permissive. Return SCOPE_REQUIRED or GRAMMAR_UNSUPPORTED without querying a default scope; stale or unavailable advisory snapshots serialize as unknown. |
| LIC-CAT-API-03 | Require distinct named licensee and end client, deadline after current server time, hard constraints and scope. Reject undisclosed end clients, inferred corporate affiliates and unsupported grammar. Persist an empty bounded candidate set with bindingConstraint when no projection qualifies. |
| LIC-CAT-API-04 | Require an active brief and projection in the caller scope, exact scope and ordered window, fresh clearance and both required sides. Unknown conflict or clearance returns CLEARANCE_UNKNOWN; overlapping grant or hold returns HOLD_CONFLICT or EXCLUSIVITY_CONFLICT. Never write one side without the other. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| LIC-CAT-API-01 | VALIDATION_FAILED, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign work or missing owner/administrator authority; 404 hides unknown work, master or asset. | Required 30 days; hash covers work, master, assets, confirmed tags, flags and expected versions. Replay returns projection; body mismatch returns IDEMPOTENCY_MISMATCH. | 120 writes/hour/owner; 20 concurrent/work. | Log operationId, requestId, work/master hash, asset count, evidence class, blocked reason class and version; no tag text, media or private evidence. |
| LIC-CAT-API-02 | SCOPE_REQUIRED, GRAMMAR_UNSUPPORTED, INDEX_UNAVAILABLE, NOT_AUTHORIZED. 403 for non-professional or undeclared mandate; 404 hides unknown scope-linked projection. | Required 24 hours; hash covers scope, query and cursor. Replay returns the same result page; mismatch returns IDEMPOTENCY_MISMATCH. | 600 searches/hour/buyer; 30 concurrent/buyer. | Log operationId, requestId, scope/query hashes, result bucket, advisory verdict classes, snapshot age bucket and index latency; no buyer brief or blocker identity. |
| LIC-CAT-API-03 | VALIDATION_FAILED, NOT_AUTHORIZED, GRAMMAR_UNSUPPORTED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign buyer or invalid mandate; 404 hides unknown projection, work or end client. | Required 30 days; hash covers named parties, mandate, scope, constraints and deadline. Replay returns brief and pitches; mismatch returns IDEMPOTENCY_MISMATCH. | 60 briefs/hour/buyer; 10 concurrent/buyer. | Log operationId, requestId, brief/party hashes, candidate count bucket, empty constraint class and version; no end-client name or private pitch media. |
| LIC-CAT-API-04 | SCOPE_REQUIRED, CLEARANCE_UNKNOWN, HOLD_CONFLICT, EXCLUSIVITY_CONFLICT, VERSION_CONFLICT, NOT_AUTHORIZED, DEPENDENCY_UNAVAILABLE. 403 for foreign brief or candidate; 404 hides unknown brief/projection/hold. | Required through expiry plus 30 days; hash covers brief, projection, scope, window and expected versions. Replay returns hold; mismatch returns IDEMPOTENCY_MISMATCH. | 30 hold requests/hour/buyer; 5 concurrent/work. | Log operationId, requestId, brief/projection/scope hashes, conflict class, reserved-side count, TTL bucket and resolver latency; no private scope text or counterparty identity. |

## Database Schema

### PostgreSQL Model Registry

All rows are PostgreSQL-owned canonical records or derived projections as stated. Every domain field is typed, nullable status is explicit, constraints and foreign keys are named, and indexes support the route predicates. No client receives direct table grants.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| licensing_catalogue_projection | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; work_id uuid NOT NULL FK works.work; master_id uuid NOT NULL FK works.master; asset_ids uuid[] NOT NULL CHECK cardinality(asset_ids)>0; human_confirmed_tag_ids uuid[] NOT NULL CHECK cardinality(human_confirmed_tag_ids)>0; asset_backed_flags jsonb NOT NULL CHECK jsonb_typeof(asset_backed_flags)='object'; publication_state text NOT NULL CHECK publication_state IN ('draft','blocked','eligible','superseded'); advisory_clearance_snapshot_id uuid NULL FK licensing.clearance_snapshot; source_version bigint NOT NULL CHECK source_version>0; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(work_id, master_id, source_version); (owner_id, publication_state, updated_at DESC); (work_id, version DESC); GIN(asset_ids); (advisory_clearance_snapshot_id) | Owner or mandate administrator may insert revisions in own scope; projection worker may update derived advisory fields; professional buyers read publication_state='eligible' rows only; anon no grant; DELETE denied and supersession is additive. |
| licensing_brief | id uuid PK NOT NULL; buyer_id uuid NOT NULL FK identity.party; licensee_id uuid NOT NULL FK identity.party; end_client_id uuid NOT NULL FK identity.party; mandate_id uuid NULL FK identity.mandate; scope jsonb NOT NULL CHECK jsonb_typeof(scope)='object'; hard_constraints jsonb NOT NULL CHECK jsonb_typeof(hard_constraints)='object'; deadline timestamptz NOT NULL; clearance_requirement text NOT NULL CHECK clearance_requirement IN ('advisory','fresh_before_hold','fresh_before_issue'); state text NOT NULL CHECK state IN ('candidate_bounded','no_candidate','closed'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | (buyer_id, state, deadline); (end_client_id, deadline); (mandate_id, version DESC); UNIQUE(buyer_id, id, version) | Buyer reads and appends own briefs; valid mandate representative reads declared buyer scope; projection service appends candidate links; owners see only pitches addressed to them; anon no grant; direct end-client enumeration denied. |
| pitch | id uuid PK NOT NULL; brief_id uuid NOT NULL FK licensing.licensing_brief; projection_id uuid NOT NULL FK licensing.licensing_catalogue_projection; owner_id uuid NOT NULL FK identity.party; match_reasons jsonb NOT NULL CHECK jsonb_typeof(match_reasons)='object'; rank integer NOT NULL CHECK rank>0; state text NOT NULL CHECK state IN ('proposed','accepted','declined','expired','withdrawn','no_candidate'); terminal_at timestamptz NULL; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(brief_id, projection_id); (brief_id, state, rank); (owner_id, state, updated_at DESC); (projection_id, state) | Brief buyer reads own pitches; projection owner reads their addressed pitch; matcher service inserts bounded candidates; no cross-brief listing; anon no grant; media is stored through Shard 09 metadata only. |
| licence_hold | id uuid PK NOT NULL; buyer_id uuid NOT NULL FK identity.party; brief_id uuid NOT NULL FK licensing.licensing_brief; work_id uuid NOT NULL FK works.work; required_side_ids uuid[] NOT NULL CHECK cardinality(required_side_ids)>=2; projection_id uuid NOT NULL FK licensing.licensing_catalogue_projection; scope jsonb NOT NULL CHECK jsonb_typeof(scope)='object'; window_start timestamptz NOT NULL; window_end timestamptz NOT NULL CHECK window_end>window_start; state text NOT NULL CHECK state IN ('active','expired','released','conflict'); expires_at timestamptz NOT NULL; clearance_snapshot_id uuid NOT NULL FK licensing.clearance_snapshot; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; CHECK state<>'active' OR expires_at>created_at | EXCLUDE USING gist (work_id WITH =, tstzrange(window_start, window_end, '[)') WITH &&) WHERE state='active'; (buyer_id, state, expires_at); (work_id, state, expires_at); (brief_id, version DESC); (clearance_snapshot_id) | Buyer or mandate representative reads own holds; hold gate RPC is the only writer and locks all required sides; owners read only their side-scoped projection; expiry worker transitions active to expired; anon no grant; no direct UPDATE or DELETE. |

### State, Concurrency and Transaction Rules

- Catalogue publication is a compare-and-swap on work and master versions. A stale revision returns VERSION_CONFLICT and cannot emit a duplicate projection. Machine-generated tags remain proposals until human confirmation.
- Search uses only publication_state eligible rows and stores advisory snapshot age. Search never creates a hold or treats advisory clearable_now as authority.
- Brief creation stores an immutable scope and named parties. A candidate matcher writes bounded pitch rows with a terminal state. Re-running with the same key is a replay; no candidate means a durable no_candidate state with the binding hard constraint.
- Hold creation runs one serializable transaction: lock the brief, projection, all required side rows and the work exclusion key; load fresh clearance and conflict facts; insert the active hold only if every required side succeeds. A failed side rolls back every reservation.
- The GiST exclusion constraint rejects overlapping active windows for the same work. The loser gets HOLD_CONFLICT or EXCLUSIVITY_CONFLICT and is not queued behind the winner. Expected versions and idempotency hash prevent lost updates.
- An expiry worker uses compare-and-swap on hold version and server time. Release, expiry and conflict transitions append history and outbox events; they never delete the original record.

### Grants, RLS and Retention

- RLS predicates require acting party membership in buyer_id, owner_id or a declared mandate, plus side-scoped checks for hold reads. Support receives an expiring purpose grant with a ticket reference and cannot broaden scope.
- Search projection fields exclude private pitch media, blocker identities, evidence, consent text, buyer constraints and verification secrets. Certificate or rights authority is never stored here.
- Immutable audit and idempotency rows retain 7 years or the applicable legal hold, whichever is longer. Derived eligible projections and search documents are tombstoned on source revocation; holds retain lifecycle history for 7 years.
- Service principals receive named RPC grants only: catalogue projector, pitch matcher, hold expiry worker and outbox dispatcher. No wildcard database or storage grant exists.

## Middleware & Policies

### Authorization Matrix

| Role | Allowed scope | Explicit denial |
|---|---|---|
| Professional buyer | Search eligible projections and create or read own briefs, pitches and holds. | Co-owner identities, private evidence, another buyer's brief or clearance blocker. |
| Buyer representative | Act for the declared buyer and named licensee under a live mandate. | Inferred affiliate, undisclosed end client, or scope outside mandate. |
| Share owner or licensing administrator | Publish own work projection and read addressed pitches or hold summaries. | Another share's policy, owner consent, clearance override or issued licence rewrite. |
| Rights/licensing operator | Assigned catalogue and adapter administration. | Arbitrary publication, hold override, multi-party authority or private evidence disclosure. |
| Service principal | Purpose-limited projection, matching, expiry and outbox jobs. | Interactive authority, wildcard reads or client impersonation. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| LIC-CAT-API-01 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → rateLimit(catalogueProjectionWrite) → parseZod(PrepareCatalogueRequest) → idempotency(30d) → authorizeWorkOwnerOrAdministrator → verifyGovernedAssetEvidence → expectedVersionCAS → catalogueProjectionTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| LIC-CAT-API-02 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → rateLimit(catalogueSearch) → parseZod(SearchCatalogueRequest) → idempotency(24h) → authorizeProfessionalBuyerScope → supportedGrammarGuard → publicationProjectionQuery → advisoryFreshnessGuard → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| LIC-CAT-API-03 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → rateLimit(briefCreate) → parseZod(CreateBriefRequest) → idempotency(30d) → authorizeBuyerOrMandate → namedLicenseeEndClientGuard → scopeGrammarGuard → candidateBoundTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| LIC-CAT-API-04 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → rateLimit(holdCreate) → parseZod(CreateHoldRequest) → idempotency(holdWindowPlus30d) → authorizeBriefScope → freshClearanceGuard → sideCompletenessGuard → activeExclusionGuard → bilateralHoldTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |

### Security and Privacy Controls

- All body, path and header input is strict Zod 4 validated; scope hashes use canonical JSON with sorted keys. Request IDs and idempotency keys are unguessable and never accepted from a client as an authority claim.
- CORS allows only configured licensing web origins and credentialed requests with an explicit allow-list. CSRF protection covers cookie-authenticated mutations. Cache-Control is private for buyer briefs and holds.
- 403 means an authenticated actor lacks authority over a known resource. 404 is returned for unknown or out-of-scope resources to prevent existence leakage. Error details contain stable refusal codes, not private names or evidence.
- Search ranking and pitch matching cannot expose hidden end clients, co-owner identity, blocker reasons, private evidence or media. Logs use keyed hashes and bucketed counts.
- Holds are exact-scope, exact-window reservations. No endpoint accepts a wildcard scope, unstated territory, default data use or client-supplied publication eligibility.

## Data Flow

1. LIC-CAT-API-01 verifies acting authority and Shard 09 work, master, asset and governed evidence versions, then stores an additive projection or blocked candidate and emits licensing.catalogue.changed.v1.
2. LIC-CAT-API-02 validates LicenceScope and grammar, reads eligible projections and advisory clearance snapshots, and returns an age-labelled result page. No rights state changes.
3. LIC-CAT-API-03 freezes named parties, hard constraints, deadline and scope, then creates bounded pitch rows or a named no_candidate result. Pitch status transitions are additive and terminal.
4. LIC-CAT-API-04 resolves fresh Shard 10 clearance, required sides and existing holds inside a serializable transaction. It writes one bilateral hold or rolls back completely, then emits licensing.hold.changed.v1.
5. Downstream issuance consumes hold state as an input only. This companion never claims clearance, consent, consideration or instrument authority.

## Events and Consumer Contracts

| Event type | Emitted by | Required payload and consumers |
|---|---|---|
| licensing.catalogue.changed.v1 | LIC-CAT-API-01 | projectionId, workId hash, publication state, source version, asset evidence class and projection version; Search consumes it. Payload excludes tags, private media, evidence contents and rights authority. |
| licensing.hold.changed.v1 | LIC-CAT-API-04 and expiry worker | holdId, work hash, scope hash, state, expiresAt bucket and version; issuance gate and notifications consume it. Payload excludes buyer name, blocker identity and private scope text. |

Events are emitted through the transactional outbox after the canonical write. Consumers cannot strengthen provenance, permission, confidence or terminal state; replay is safe by event ID and aggregate version.

## Error Handling and Failure Recovery

| Operation ID | Failure | Required response and recovery |
|---|---|---|
| LIC-CAT-API-01 | Missing governed evidence, machine-only tag, upstream outage or version race | Return VALIDATION_FAILED, DEPENDENCY_UNAVAILABLE or VERSION_CONFLICT before publication; retain blocked candidate and retry resolver/outbox with the same idempotency key. |
| LIC-CAT-API-02 | Missing scope, unsupported grammar, stale advisory snapshot or index outage | Return SCOPE_REQUIRED or GRAMMAR_UNSUPPORTED; render unknown advisory state or INDEX_UNAVAILABLE. Never default a scope or create a right. |
| LIC-CAT-API-03 | Undisclosed end client, no bounded candidate or matcher outage | Refuse invalid authority; persist no_candidate with binding constraint for valid empty matches; retry matching idempotently without silently expiring a pitch. |
| LIC-CAT-API-04 | Conflict, unknown clearance, stale version, deadlock or expiry race | Return HOLD_CONFLICT, EXCLUSIVITY_CONFLICT, CLEARANCE_UNKNOWN or VERSION_CONFLICT with no partial reservation; retry only the same key after backoff, and let CAS decide expiry winner. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| LIC-CAT-API-01 | Zod strict assets, tags, flags, versions, success and exact ApiError schema. | Owner or administrator mandate, CORS, CSRF, 403/404 and private evidence redaction. | Projection uniqueness, source CAS, RLS/grants, outbox and supersession. | Missing evidence, resolver outage, replay, duplicate event, redacted audit and stale race. |
| LIC-CAT-API-02 | LicenceScope grammar, explicit countries, limit/cursor and advisory result schema. | Professional buyer role, no-scope refusal, CORS/rate, query privacy and 404 hiding. | Eligible projection filter, snapshot-age handling, RLS and deterministic page replay. | Stale snapshot, index outage, cursor replay and log hash assertions. |
| LIC-CAT-API-03 | Named parties, deadline, constraints, scope and terminal pitch schema. | Mandate containment, affiliate refusal, CORS/rate and end-client privacy. | Brief/pitch uniqueness, no_candidate persistence, terminal transition and RLS. | Matcher outage, empty candidate, replay, supersession and safe diagnostics. |
| LIC-CAT-API-04 | Exact scope/window, positive versions, hold success and refusal schemas. | Buyer ownership, fresh-gate enforcement, CORS/rate and no existence leakage. | Serializable bilateral reservation, GiST exclusion, expiry CAS, RLS and event. | Competing exclusive, unknown resolver, deadlock, partial rollback, expiry race and replay. |

### Test Levels and Acceptance Gates

- Unit: every Zod schema rejects unknown keys, empty scopes, non-country territories, invalid windows and malformed UUIDs; every refusal maps to ApiError { code, message, requestId, details }.
- Integration: test BE00 identity, Shard 09 asset evidence, Shard 10 fresh clearance and outbox adapters with exact timeout and retry behavior.
- Database: run RLS matrix for each role, verify no direct table grant, unique and exclusion constraints, CAS, tombstone retention and event version monotonicity.
- Contract: replay each operation with identical and mismatched Idempotency-Key bodies; verify one side can never persist without the other and search never mutates rights.
- Acceptance gate: all four operation IDs have route, Zod contract, field, error/auth/idempotency/rate/observability, middleware, persistence and test rows; all listed IA interactions, models and events are literal-covered.

## Deepening Passes and Ambiguity Gate

### Micro Pass

- Input: omitted data-use, territory shorthand, unsupported grammar, machine-only tag, stale source version, inferred affiliate and reversed hold window.
- Resolution: reject or return typed unknown; require explicit countries, human evidence, named end client and exact ordered window. No permissive default exists.

### Meso Pass

- Search advisory state is isolated from the hold gate. A stale clearable_now result becomes unknown and cannot authorize reservation.
- Brief, pitch and hold ownership is separate from rights authority. A buyer may own a hold request without owning any rights side; issuance rechecks all sides.

### Macro Pass

- Shard 09 owns works, assets and private media; Shard 10 owns rights and fresh clearance; Shard 20b owns evidence and consent; 20c owns policy and quotes; 20d owns instruments and lifecycle. Outbox consumers only read these contracts.
- Delivery, payment, certificate and verifier effects are absent from this companion. The platform's B3 and consideration gates remain inherited and are enforced by the issuance companion.

## Ambiguity Gate

**PASS.** Source truth was reconciled against the approved 20a split: LIC-01 through LIC-04 each have one authoritative route and one operation-keyed contract, validation, authorization, idempotency, rate, observability, middleware and test row. Scope omission, stale advisory state, undisclosed end client, missing evidence, unknown clearance, overlapping holds, exact expiry and partial reservation have deterministic outcomes. Cross-shard ownership and BE00 ApiError inheritance are explicit.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Authored catalogue projection, professional search, buyer brief, bounded pitch and bilateral hold backend contracts with fail-closed scope and fresh-gate behavior. | /write-be-spec |

## Dependency References

- **Consumes:** [Shard 00 Contracts](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) for identity context, ApiError, idempotency, audit, outbox and B3 settings; [Shard 09 Contracts](../ia/09-projects-collaboration.md#contracts) for works, masters, assets, pitches and private media; [Shard 10 Contracts](../ia/10-rights-ownership.md#contracts) for rights sides, conflict and fresh clearance; [Shard 01 Contracts](../ia/01-identity-authority.md#contracts) for parties and mandates.
- **Publishes:** licensing.catalogue.changed.v1 to search and downstream licensing projections; licensing.hold.changed.v1 to gate and notification consumers.
- **Sibling handoff:** 20b consumes projection, brief and scope references for evidence and consent; 20c consumes brief and hold references for policy, quotes and negotiations; 20d consumes active hold state as an issuance input but owns the licence instrument and lifecycle.
- **Downstream:** Shard 21 and Shard 22 consume only publication-approved catalogue, named brief, hold and scope references; they cannot infer rights authority from this projection.
