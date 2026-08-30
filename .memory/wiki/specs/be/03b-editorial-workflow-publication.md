# Editorial Workflow and Publication — Backend Specification

> IA Source: [Shard 03 — CMS content modeling and authoring](../ia/03-cms-content-modeling.md)
> Deep Dives: [Shard 03 CMS content modeling and authoring deep dive](../ia/deep-dives/03-cms-content-modeling.md)
> Foundation: [BE00 — Cross-cutting platform foundation](00-infrastructure.md)
> Registry dependency: [03a — Content schema registry](03a-content-schema-registry.md)
> Status: Complete

## Split Group

This is the editorial and publication member of the three-way Shard 03 backend split:

| BE spec | Owned IA interactions | Boundary |
|---|---|---|
| 03a-content-schema-registry.md | CMS-01, CMS-02, CMS-03, CMS-04, CMS-10 | Immutable content schemas, allowlisted relations, migrations, and code-owned block registration. |
| 03b-editorial-workflow-publication.md | CMS-05, CMS-06, CMS-07, CMS-08, CMS-09, CMS-13 | Entry drafts/revisions, conflict resolution, revision history/restore, review/approval, scheduling, preview, and publication. |
| 03c-composition-taxonomy-localization.md | CMS-11, CMS-12, CMS-14, CMS-15, CMS-16 | Templates, patterns, composition, taxonomies, locale variants, and related-content rules. |

03b owns mutable editorial workflow and the publication control plane. 03a remains the source of schema/field/relation compatibility. 03c supplies template, pattern, taxonomy, and locale inputs that this file freezes and revalidates at review/publish. Shard 04 owns public route/render/search/cache projections after the committed publication event. No route here duplicates a BE00 endpoint or a 03a schema-registry route.

## Classification

- Type: domain command/query and protected publication control plane.
- IA source: 03-cms-content-modeling.md and its required deep dive.
- Included: CMS-05 create/edit entry; CMS-06 resolve concurrent edit; CMS-07 compare/restore revision; CMS-08 submit/review/approve; CMS-09 schedule publish/expire; CMS-13 preview/diff/publish.
- Split decisions: CMS-07, CMS-08, and CMS-13 each have separate read/command or preview/publication routes so safe reads, review decisions, and public effects have independent auth, rate, cache, and audit cells.
- Excluded: definitions/activation and block registration are 03a; template/pattern/taxonomy/locale/related-content definition and assignment are 03c; public delivery projection is Shard 04; identity, acting context, error envelope, jobs, idempotency, audit, outbox, queues, and provider primitives are BE00.
- Authority boundary: ContentEntry and its revisions are editorial records. They cannot manufacture canonical identity, party, authority, rights, money, entitlement, credential, evidence, or domain-record state.
- Decision status: no new decision. DEC-100 is inherited: references use bounded allowlisted projections and never perform request-time upward reads or copy producer authority.

## Referenced Material Inventory

| Material | Sections / lines consumed | Use in this specification |
|---|---|---|
| IA Shard 03 | Overview 9–22; Features 24–29; Acceptance Criteria 31–49 | Scope, acceptance, and feature boundaries. |
| IA Shard 03 | Interactions 50–69, especially CMS-05 through CMS-09 and CMS-13 | Route operations, preconditions, completion, refusal, and recovery rules. |
| IA Shard 03 | Contracts 90–112 | Revision/autosave/presence, risk review, schedule, preview, and publication contracts. |
| IA Shard 03 | Data Models 114–143 | ContentEntry, EntryRevision, EntryFieldValue, EntryRelation, EditorialReview, EditorialDecision, PublicationSchedule, and related model fields. |
| IA Shard 03 | Access Control 167–192; Accessibility 193–202 | Author/editor/publisher/reviewer roles, assignment, MFA, disclosure, and status/error accessibility. |
| IA Shard 03 | Event Schemas 203–216 | cms.entry.revision-created.v1, cms.entry.review-changed.v1, cms.publication.changed.v1, and cms.localization.changed.v1. |
| IA Shard 03 | Edge Cases 217–240; Cross-Shard Dependencies 268–272 | Conflict, authority, DST, preview, publication race, outage, and downstream projection behavior. |
| IA Shard 03 | Deep Dives Needed 273–284 and Changelog 285–294 | Required deepening, cross-shard map, and source corrections. |
| IA Shard 03 deep dive | Canonical Field Contracts 38–76; State Machines 78–89 | Exact revision/review/schedule/publication fields and transitions. |
| IA Shard 03 deep dive | Entry Validation and Revision Merge 101–109 | Assignment recheck, normalization, changed paths, conflicts, relation checks, and restore migration. |
| IA Shard 03 deep dive | Review and Publication Algorithm 111–119 | Frozen dependency set, preflights, distinct decisions, publication transaction, and projection handoff. |
| IA Shard 03 deep dive | Migration Algorithm 121–128; Composition and Preview Validation 130–137 | Restore migration, exact version set, preview binding, and fail-closed checks. |
| IA Shard 03 deep dive | Taxonomy, Localization, and Relationship Rules 139–146; Abuse and Recovery Verification 148–161 | Locale staleness, relationship authorization, and hostile/failure-path tests. |
| IA Shard 03 deep dive | Cross-Shard Contracts 163–170; Implementation Envelope 172–178 | 03a/03c/04/05/01 handoffs and PostgreSQL/RLS/Hono/Queue boundaries. |
| BE00 | Contracts 84–165; middleware/auth 253–297; transactions/events/errors 298–451; observability/tests 452–503 | Inherited wire shape, ApiError, ETag/idempotency, principal pipeline, queue, audit/outbox, SLO, and test floor. |
| 03a-content-schema-registry.md | Shared Contract Inheritance 95–119; route registry 123–143; Zod contracts 173–338; database 339–376 | Exact active schema, field UUID, relation allowlist, migration status, and BlockDefinitionVersion inputs. |
| 03c-composition-taxonomy-localization.md | Templates/patterns/taxonomies/locales and their route/contracts | Frozen template/taxonomy/locale dependency set; this file rechecks current versions at review and publish. |
| BE01a–01d | BE01a Shared Contract Inheritance 73–97; BE01b Contract Conventions 88–137; BE01c schema/access 294–395; BE01d disclosure semantics 424–502 | Verified human, person, party, acting context, mandate, capability, and MFA facts. |
| BE02a–02c | BE02a Shared Contract Inheritance 85–98; BE02b source contracts 102–227 and schema 429–652; BE02c schema 305–369 | Fixed profile/provenance restrictions and canonical-record non-smuggling. |
| Architecture Design | Tech Stack/hosting 143–196; persistence 198–266; API 343–376; security/rate 535–668 and 770–797; observability 916–995 | Hono/Cloudflare Workers, Supabase PostgreSQL/Auth/RLS, limits, and diagnostics. |
| Data Placement Strategy | N-Tier 5–17; placement 19–40; security 42–55; storage/isolation 86–93; lifecycle 95–114; tenancy/sync 116–148 | Canonical store, PII minimization, retention, RLS, and synchronization. |
| Engineering Standards | Tests 27–44; performance 53–121; async/recovery 122–138; accessibility 140–148; security 149–165; migration/CI 185–207 | Quality, accessibility, security, recovery, and release gates. |

## IA Source Map

| BE section | Source of truth | Exact section / lines |
|---|---|---|
| Classification and split | IA Shard 03 | Overview 9–22; Features 24–29; Interactions 50–69 |
| Routes and endpoint reconciliation | IA Shard 03 | Acceptance Criteria 31–49; Interactions 58–66; Surface Applicability 241–266 |
| Revision and conflict contracts | IA Shard 03 plus deep dive | Contracts 94–100; Data Models 123–129; Entry Validation and Revision Merge 101–109 |
| Review and approval | IA Shard 03 plus deep dive | Access Control 171–178; Review and Publication Algorithm 111–119 |
| Schedule and publication | IA Shard 03 plus deep dive | Contracts 98–100; CMS-09/CMS-13 at lines 62 and 66; Review and Publication Algorithm 111–119 |
| Preview and dependency freeze | IA Shard 03 plus deep dive | Contracts 106–112; Composition and Preview Validation 130–137 |
| Persistence, RLS, and grants | IA Shard 03, BE00, placement | Data Models 114–143; Access Control 167–192; BE00 schema/grants 202–251; placement 19–55 and 86–114 |
| Events and async | IA Shard 03 plus BE00 | Event Schemas 203–216; deep dive Cross-Shard Contracts 163–170; BE00 event/queue 274–451 |
| Tests and ambiguity | IA Shard 03, deep dive, standards | Edge Cases 217–240; Abuse and Recovery Verification 148–161; standards 27–44 and 185–207 |

## Feature Ledger Coverage

| Ledger ID | Feature | BE ownership | Coverage evidence |
|---|---|---|---|
| 25.02.01 | Entry Authoring, Autosave & Locking | CMS-03B-01 | ContentEntry, EntryRevision, EntryFieldValue, EntryRelation, presence lease, autosave cadence, assignment/RLS, and conflict tests. |
| 25.02.02 | Revision History, Compare & Restore | CMS-03B-03, CMS-03B-04 | Append-only revision history, schema-aware comparison, migration-chain restore, and no obsolete-schema activation. |
| 25.02.03 | Review, Approval & Editorial Ownership | CMS-03B-05, CMS-03B-06 | EditorialReview/EditorialDecision, frozen dependency manifest, distinct reviewer/MFA gates, invalidation, and decision tests. |
| 25.02.04 | Scheduling, Expiry & Archive | CMS-03B-07 | IANA/tzdb schedule, DST disambiguation, exact-version worker CAS, late-run evidence, and blocked recovery. |
| 25.03.04 | Preview, Diff & Safe Publish | CMS-03B-08, CMS-03B-09 | Audience-bound preview token, exact version set, preflight, publication_version, atomic outbox, and projection convergence. |

25.01.* and 25.03.01 are owned by 03a. 25.03.02–25.03.03 and 25.05.* are owned by 03c. 03b consumes those versions only through immutable IDs/hashes and revalidates them at submit, schedule, preview-open, and publish.

## Endpoint Completeness Reconciliation

The IA flows owned here reconcile to nine concrete operation IDs. CMS-07, CMS-08, and CMS-13 are intentionally split into read/restore, submission/decision, and preview/publication operations. There are no unregistered background HTTP endpoints; schedule, projection, review invalidation, and migration effects use BE00 jobs/outbox consumers.

| IA interaction | Operation ID(s) | Concrete route(s) | Reconciliation |
|---|---|---|---|
| CMS-05 Create/edit entry | CMS-03B-01 | POST /api/v1/cms/entries/{entryId}/revisions | Creates an immutable revision/autosave; it never publishes. |
| CMS-06 Resolve concurrent edit | CMS-03B-02 | POST /api/v1/cms/entries/{entryId}/conflicts/{conflictId}/resolve | Explicitly chooses same-field values and creates a two-parent revision. |
| CMS-07 Compare/restore revision | CMS-03B-03, CMS-03B-04 | GET /api/v1/cms/entries/{entryId}/revisions; POST /api/v1/cms/entries/{entryId}/revisions/{revisionId}/restore | Safe history/compare query is separate from edit-authorized restore. |
| CMS-08 Submit/review/approve | CMS-03B-05, CMS-03B-06 | POST /api/v1/cms/entries/{entryId}/reviews; POST /api/v1/cms/reviews/{reviewId}/decision | Submission freezes the candidate; decisions are append-only and distinct. |
| CMS-09 Schedule publish/expire | CMS-03B-07 | POST /api/v1/cms/publication-schedules | Stores local and resolved times; worker executes exact version once. |
| CMS-13 Preview/diff/publish | CMS-03B-08, CMS-03B-09 | POST /api/v1/cms/previews; POST /api/v1/cms/publications | Preview is revocable/read-only; publication is publisher-authorized and atomic. |

BE00 GET /api/v1/jobs/{jobId} remains the only job-status route and is inherited. 03a CMS-03A-01 through CMS-03A-05 remain the only schema/block-definition routes. Shard 04 owns delivery reads and never receives a draft through a public route.

## Shared Contract Inheritance

All operations use BE00 /api/v1, request ID, strict Zod 4, exact ApiError, strong quoted decimal ETag, Idempotency-Key, authenticated no-store responses, CORS allowlists, rate headers, audit, and outbox contracts.

~~~ts
import { z } from 'zod';

const UUID = z.string().uuid();
const Version = z.string().regex(/^[1-9][0-9]*$/);
const Json = z.json();
const ApiError = z.strictObject({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
  message: z.string().min(1).max(500),
  requestId: UUID,
  details: z.record(z.string(), z.json())
});
~~~

ApiError is exactly { code, message, requestId, details }. details is capped at 16 keys, four levels, and 8 KiB serialized. Every failure below cites this envelope and returns JSON, X-Request-Id, and Cache-Control no-store. 429 and retryable 503 include Retry-After and RateLimit headers.

- Authentication is Supabase Auth session/JWT followed by server-resolved person, acting party, assignment, capability, and RLS checks. Caller-supplied actor, owner, reviewer, party, or version fields do not confer authority.
- Mutations require Idempotency-Key 8–128 printable ASCII. Mutable parent commands require exact If-Match: "<positive decimal version>". Same binding replays the original result; mismatch returns 409.
- Middleware order is request-id → raw-size/media guard → JSON parse → Zod validation → session/JWT → acting-context/capability/assignment → CSRF → configured first-party CORS → rate limiter → handler/RPC → response/error normalization.
- CORS is explicit per route below. Browser session routes allow configured CMS-console origins only with credentials; preview and publication never use wildcard credentials. Worker/scheduler routes use registered non-browser principals.
- PostgreSQL RPC rechecks ownership, assignment, workflow state, current version, frozen hashes, dependency versions, idempotency, and target disclosure under RLS. Mutation, audit, idempotency, and outbox are atomic.
- Queue messages carry IDs, versions, hashes, correlation/causation IDs, and no private content, comments, field values, or tokens. At-least-once consumers re-read canonical state under a lease.

## API Endpoints

### Route Registry

This is the single authoritative 03b route registry. Generated OpenAPI and discovered Hono routes must match each method/path, operation ID, request/success/error schema, auth, CORS, rate, timeout, cache, SLO, idempotency, and BOLA declaration.

| Operation ID | IA | Method and path | Request → success | Auth / ownership / 403 versus 404 | Middleware incl. CORS | Idempotency / concurrency | Rate / timeout / cache / SLO | Error envelope | Event |
|---|---|---|---|---|---|---|---|---|---|
| CMS-03B-01 | CMS-05 | POST /api/v1/cms/entries/{entryId}/revisions | EntryRevisionRequest → 201 EntryRevisionResource | CMS author/editor with assignment to readable entry; hidden entry is 404; known entry without assignment is 403 | BE00 order; CORS cms-console; CSRF; JSON 256 KiB; schema registry read | key + If-Match; CAS entry version; changed paths/base revision | 120/min/user, 240/min/party; 15,000ms, target <2s; no-store; Tier 2 p95 <1,200ms | BE00 ApiError { code, message, requestId, details } | cms.entry.revision-created.v1 |
| CMS-03B-02 | CMS-06 | POST /api/v1/cms/entries/{entryId}/conflicts/{conflictId}/resolve | ConflictResolutionRequest → 201 EntryRevisionResource | assigned editor/author may resolve; hidden entry/conflict is 404; visible conflict without edit capability is 403 | BE00 order; CORS cms-console; CSRF; strict JSON; conflict rate class | key + If-Match; CAS conflict base and entry version; no inferred choice | 60/min/user, 120/min/party; 15,000ms; no-store; Tier 2 | BE00 ApiError { code, message, requestId, details } | cms.entry.revision-created.v1 |
| CMS-03B-03 | CMS-07 | GET /api/v1/cms/entries/{entryId}/revisions | RevisionHistoryQuery → 200 RevisionHistoryPage | assignment/read capability; hidden entry is 404; known entry without read scope is 403 | BE00 order; CORS cms-console; no CSRF mutation; cursor/context binding | safe read; no Idempotency-Key/If-Match; signed keyset cursor over `(revisionNumber DESC, revisionId DESC)`; default limit 25, max 50; stable sort `revisionNumber DESC, revisionId DESC`; filter allowlist `state`, `locale` only; ETag on page version | 300/min/user, 600/min/party; 8,000ms; no-store; Tier 1 p95 <750ms | BE00 ApiError { code, message, requestId, details } | none |
| CMS-03B-04 | CMS-07 | POST /api/v1/cms/entries/{entryId}/revisions/{revisionId}/restore | RevisionRestoreRequest → 201 EntryRevisionResource | edit capability + readable source revision; hidden entry/revision is 404; readable but no edit is 403 | BE00 order; CORS cms-console; CSRF; migration-chain recheck; strict JSON | key + If-Match; CAS current entry; migration chain immutable | 30/min/user, 60/min/party; 15,000ms; no-store; Tier 2 | BE00 ApiError { code, message, requestId, details } | cms.entry.revision-created.v1 |
| CMS-03B-05 | CMS-08 | POST /api/v1/cms/entries/{entryId}/reviews | ReviewSubmissionRequest → 201 EditorialReviewResource | submit capability/assignment; hidden entry/revision is 404; visible non-submitter is 403 | BE00 order; CORS cms-console; CSRF; dependency preflight; strict JSON | key + If-Match; one open review per revision via unique lock | 30/min/user, 60/min/party; 15,000ms; no-store; Tier 2 | BE00 ApiError { code, message, requestId, details } | cms.entry.review-changed.v1 |
| CMS-03B-06 | CMS-08 | POST /api/v1/cms/reviews/{reviewId}/decision | EditorialDecisionRequest → 200 EditorialReviewResource | reviewer capability and assigned review; hidden review is 404; eligible review without required capability is 403 | BE00 order; CORS cms-console; CSRF; step-up MFA for protected; strict JSON | key + If-Match; unique reviewer/review and review CAS | 30/min/user, 60/min/party; 15,000ms; no-store; Tier 2 | BE00 ApiError { code, message, requestId, details } | cms.entry.review-changed.v1 |
| CMS-03B-07 | CMS-09 | POST /api/v1/cms/publication-schedules | PublicationScheduleRequest → 202 PublicationScheduleResource | CMS publisher with entry/revision visibility; hidden target is 404; visible target without publisher is 403 | BE00 order; CORS cms-console; CSRF; step-up MFA; strict JSON | key + If-Match; exact action/version unique; worker CAS | 20/min/user, 40/min/party; 15,000ms acceptance; no-store; Tier 2 | BE00 ApiError { code, message, requestId, details } | cms.publication.changed.v1 only after execution |
| CMS-03B-08 | CMS-13 | POST /api/v1/cms/previews | PreviewRequest → 201 PreviewTokenResource | preview capability on entry/revision; hidden target is 404; visible target without preview scope is 403 | BE00 order; CORS cms-console; CSRF; no public cache; strict JSON | key required; revision/version-set CAS; same binding replays the same token metadata without revealing token hash | 60/min/user, 120/min/party; 8,000ms; no-store; Tier 1 | BE00 ApiError { code, message, requestId, details } | none |
| CMS-03B-09 | CMS-13 | POST /api/v1/cms/publications | PublicationRequest → 202 PublicationResource | CMS publisher plus frozen approval/dependency set; hidden target is 404; visible target without publisher is 403 | BE00 order; CORS cms-console; CSRF; step-up MFA where required; strict JSON | key + If-Match; CAS expected version set; exact publication unique | 20/min/user, 40/min/party; 15,000ms acceptance; no-store; Tier 2 | BE00 ApiError { code, message, requestId, details } | cms.publication.changed.v1 |

### Registry invariants

- Route path IDs are UUIDs. A route never accepts owner, reviewer, publisher, acting party, or current version as an authority assertion.
- CMS-03B-01, CMS-03B-02, CMS-03B-04, CMS-03B-05, CMS-03B-06, CMS-03B-07, and CMS-03B-09 return strong ETag and Location where a new resource is created. CMS-03B-03 returns an authenticated page ETag. CMS-03B-08 returns a short-lived token and no public ETag.
- Every row returns BE00 ApiError { code, message, requestId, details } for failures. No row exposes draft existence, private field values, review comments, token material, or capability graphs to an unauthorized caller.
- CMS-03B-07 schedule acceptance does not claim publication success. CMS-03B-09 returns pending/queued when downstream projection has not converged; canonical publication state is authoritative.
- CMS-03B-08 preview tokens are audience-bound and revocable. They cannot be exchanged for a publication command or reused after expiry.

### Route field validation matrix

| Operation | Field | Exact constraint | Failure |
|---|---|---|---|
| CMS-03B-01 | entryId | UUID path; must resolve to active ContentEntry after structural validation | 400 or policy-safe 404 |
| CMS-03B-01 | baseRevision | positive bigint decimal string; revision must be readable | 422 or 409 VERSION_MISMATCH |
| CMS-03B-01 | changedPaths | 1–128 unique JSON Pointers, each 1–256 chars, bound to stable field/block/relation IDs | 422 |
| CMS-03B-01 | values | strict object keyed by stable field IDs; max 128 keys/8 levels/256 KiB; rich text is structured AST | 422 |
| CMS-03B-01 | locale / expectedVersion | BCP 47 2–35 chars; positive decimal entry version | 422 or 409 |
| CMS-03B-02 | conflictId | UUID; same entry and unresolved conflict | 400/404/409 |
| CMS-03B-02 | choices | 1–128 strict { path, choice: base, theirs, yours, or explicit, value? }; explicit value must validate current schema | 422 |
| CMS-03B-03 | cursor/limit | signed context-bound cursor ≤512 chars; limit integer 1–50 default 25; cursor expires ≤24h | 400 |
| CMS-03B-03 | compareRevisionId/locale | UUID optional; BCP 47 optional; both revisions must be readable | 400/404 |
| CMS-03B-04 | revisionId/migrationChainId | UUIDs; source revision immutable and chain covers source schema to current active schema | 422/409 |
| CMS-03B-05 | frozenHash | exactly 64 lowercase hex; must equal normalized revision hash | 422/409 |
| CMS-03B-05 | dependencyManifest | strict IDs/hashes for schema/template/blocks/patterns/terms/locale/settings/relations/checkers; max 256 entries/32 KiB | 422 |
| CMS-03B-05 | riskClass | ordinary or protected; protected requires configured two-person workflow | 422 |
| CMS-03B-06 | decision/reason | approve or reject; reason 1–2000 safe Unicode chars | 422 |
| CMS-03B-06 | stepUpAt/capability | ISO timestamp within configured MFA freshness; named reviewer capability, never caller-selected authority | 401/403/422 |
| CMS-03B-07 | localDateTime/timezone | local ISO datetime without offset plus IANA timezone 1–64 chars | 422 |
| CMS-03B-07 | resolvedUtc/tzdbVersion/disambiguation | offset ISO instant, tzdb 1–32 chars, disambiguation earlier/later/none; nonexistent local time rejected | 422 |
| CMS-03B-07 | action | publish, unpublish, expire, or archive | 422 |
| CMS-03B-08 | versionSet | strict exact schema/template/taxonomy/settings/blocks/patterns IDs and hashes | 422; stale set 409 |
| CMS-03B-08 | audience/route | audience 1–64 safe chars; route 1–2048 normalized path; no external URL | 422 |
| CMS-03B-09 | frozenHash/expectedVersionSet | 64 lowercase hex and strict version/hash set equal to approved candidate | 422/409 |
| All mutation routes | headers | Idempotency-Key 8–128 printable ASCII; exact strong If-Match; Content-Type application/json | 400 INVALID_REQUEST |

## Request/Response Contracts (Zod 4 schemas)

Runtime Zod 4 schemas are the source for TypeScript, Hono validation, OpenAPI, tests, and JSONB checks. All objects are strict; unknown keys reject. Values are parsed against the active schema from 03a and are never accepted as untyped pass-through content.

~~~ts
const Bcp47 = z.string().regex(/^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$/);
const JsonPointer = z.string().regex(/^\/[^\u0000-\u001f]{0,255}$/);
const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const SafeText = z.string().max(2000).refine(v => !/[<>{}]/.test(v));
const VersionSet = z.strictObject({
  schemaVersionId: UUID,
  schemaHash: Hash,
  templateVersionId: UUID.nullable(),
  templateHash: Hash.nullable(),
  taxonomyVersionIds: z.array(UUID).max(64),
  blockVersionIds: z.array(UUID).max(128),
  patternVersionIds: z.array(UUID).max(128),
  settingsVersion: Version,
  compilerVersion: z.string().min(1).max(32)
});
const DependencyManifest = z.strictObject({
  schema: z.strictObject({ id: UUID, hash: Hash }),
  template: z.strictObject({ id: UUID, hash: Hash }).nullable(),
  blocks: z.array(z.strictObject({ id: UUID, hash: Hash })).max(128),
  patterns: z.array(z.strictObject({ id: UUID, hash: Hash })).max(128),
  terms: z.array(z.strictObject({ id: UUID, hash: Hash })).max(256),
  localeSources: z.array(z.strictObject({ locale: Bcp47, revisionId: UUID, hash: Hash })).max(32),
  settings: z.strictObject({ version: Version, hash: Hash }),
  relations: z.array(z.strictObject({ fieldId: UUID, targetId: UUID, targetVersion: Version })).max(128),
  checker: z.strictObject({ key: z.string().min(1).max(64), version: Version })
});
const EntryRevisionRequest = z.strictObject({
  entryId: UUID,
  baseRevision: Version,
  changedPaths: z.array(JsonPointer).min(1).max(128),
  values: z.record(z.string().uuid(), Json),
  locale: Bcp47,
  expectedVersion: Version
});
const ConflictChoice = z.strictObject({
  path: JsonPointer,
  choice: z.enum(['base', 'theirs', 'yours', 'explicit']),
  value: Json.optional()
}).superRefine((v, ctx) => {
  if (v.choice === 'explicit' && v.value === undefined) {
    ctx.addIssue({ code: 'custom', path: ['value'], message: 'explicit choice requires value' });
  }
});
const ConflictResolutionRequest = z.strictObject({
  entryId: UUID,
  conflictId: UUID,
  baseRevision: Version,
  choices: z.array(ConflictChoice).min(1).max(128),
  expectedVersion: Version
});
const RevisionHistoryQuery = z.strictObject({
  entryId: UUID,
  cursor: z.string().max(512).nullable().optional(),
  limit: z.number().int().min(1).max(50).default(25),
  state: z.enum(['draft', 'submitted', 'approved', 'rejected', 'scheduled', 'published']).optional(),
  compareRevisionId: UUID.optional(),
  locale: Bcp47.optional()
});
const RevisionRestoreRequest = z.strictObject({
  entryId: UUID,
  revisionId: UUID,
  migrationChainId: UUID,
  expectedVersion: Version
});
const ReviewSubmissionRequest = z.strictObject({
  entryId: UUID,
  revisionId: UUID,
  frozenHash: Hash,
  dependencyManifest: DependencyManifest,
  riskClass: z.enum(['ordinary', 'protected'])
});
const EditorialDecisionRequest = z.strictObject({
  reviewId: UUID,
  decision: z.enum(['approve', 'reject']),
  reason: SafeText.min(1),
  capability: z.string().min(1).max(128),
  expectedVersion: Version,
  stepUpAt: z.string().datetime({ offset: true }).nullable()
});
const PublicationScheduleRequest = z.strictObject({
  revisionId: UUID,
  action: z.enum(['publish', 'unpublish', 'expire', 'archive']),
  localDateTime: z.string().datetime({ offset: false }),
  timezone: z.string().min(1).max(64).regex(/^[A-Za-z0-9_+.-]+\/[A-Za-z0-9_+.-]+$/),
  resolvedUtc: z.string().datetime({ offset: true }),
  tzdbVersion: z.string().min(1).max(32),
  disambiguation: z.enum(['none', 'earlier', 'later']),
  expectedVersion: Version
});
const PreviewRequest = z.strictObject({
  entryId: UUID,
  revisionId: UUID,
  locale: Bcp47,
  audience: z.string().min(1).max(64),
  route: z.string().regex(/^\/[^\u0000-\u001f]{0,2047}$/),
  versionSet: VersionSet
});
const PublicationRequest = z.strictObject({
  entryId: UUID,
  revisionId: UUID,
  frozenHash: Hash,
  expectedVersionSet: VersionSet,
  expectedVersion: Version
});
~~~

Success resources are strict, hash/version aware, and expose only data authorized for the caller:

~~~ts
const ResourceMeta = z.strictObject({
  id: UUID,
  version: Version,
  state: z.string().min(1).max(32),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true })
});
const EntryRevisionResource = ResourceMeta.extend({
  entryId: UUID,
  revisionNumber: Version,
  schemaVersionId: UUID,
  templateVersionId: UUID.nullable(),
  taxonomyVersionIds: z.array(UUID).max(64),
  locale: Bcp47,
  contentHash: Hash,
  parentRevisionIds: z.array(UUID).max(2),
  validationState: z.enum(['valid', 'invalid', 'unknown']),
  conflictId: UUID.nullable()
});
const EditorialReviewResource = ResourceMeta.extend({
  revisionId: UUID,
  riskClass: z.enum(['ordinary', 'protected']),
  frozenHash: Hash,
  requiredDecisionCount: z.number().int().min(1).max(2),
  recordedDecisionCount: z.number().int().min(0).max(2),
  dependencyHash: Hash,
  invalidatedReason: z.string().max(128).nullable()
});
const PublicationScheduleResource = ResourceMeta.extend({
  entryId: UUID,
  revisionId: UUID,
  action: z.enum(['publish', 'unpublish', 'expire', 'archive']),
  localDateTime: z.string().datetime({ offset: false }),
  timezone: z.string().min(1).max(64).regex(/^[A-Za-z0-9_+.-]+\/[A-Za-z0-9_+.-]+$/),
  resolvedUtc: z.string().datetime({ offset: true }),
  tzdbVersion: z.string().regex(/^[A-Za-z0-9._-]{1,32}$/),
  state: z.enum(['pending', 'executing', 'completed', 'failed_retryable', 'blocked', 'cancelled']),
  jobId: UUID.nullable(),
  actualUtc: z.string().datetime({ offset: true }).nullable(),
  deviationSeconds: z.number().int().nullable()
});
const PreviewTokenResource = z.strictObject({
  token: z.string().min(43).max(512),
  expiresAt: z.string().datetime({ offset: true }),
  entryId: UUID,
  revisionId: UUID,
  locale: Bcp47,
  audience: z.string().trim().min(1).max(64).regex(/^[a-z0-9][a-z0-9._-]{0,63}$/),
  route: z.string().regex(/^\/[^\u0000-\u001f]{0,2047}$/),
  versionSet: VersionSet,
  revoked: z.boolean()
});
const PublicationResource = ResourceMeta.extend({
  publicationVersionId: UUID,
  entryId: UUID,
  revisionId: UUID,
  locale: Bcp47,
  audience: z.string().trim().min(1).max(64).regex(/^[a-z0-9][a-z0-9._-]{0,63}$/),
  publicationHash: Hash,
  state: z.enum(['active', 'superseded', 'revoked', 'pending']),
  projectionState: z.enum(['pending', 'converged', 'degraded']),
  eventType: z.literal('cms.publication.changed.v1')
});
const RevisionSummary = z.strictObject({
  id: UUID,
  revisionNumber: Version,
  locale: Bcp47,
  state: z.string().regex(/^[a-z][a-z0-9_]{0,31}$/),
  contentHash: Hash,
  createdAt: z.string().datetime({ offset: true }),
  authorClass: z.string().min(1).max(64)
});
const RevisionHistoryPage = z.strictObject({
  items: z.array(RevisionSummary).max(50),
  nextCursor: z.string().max(512).nullable(),
  pageVersion: Version,
  compare: z.strictObject({
    leftRevisionId: UUID,
    rightRevisionId: UUID,
    changes: z.array(z.strictObject({
      path: JsonPointer,
      kind: z.enum(['added', 'removed', 'changed', 'unchanged']),
      leftHash: Hash.nullable(),
      rightHash: Hash.nullable()
    })).max(512)
  }).nullable()
});
~~~

### Contract and error matrix

| Operation ID | 400 | 401 | 403 | 404 | 409 | 415 | 422 | 429 | 502/503/504 | 500 |
|---|---|---|---|---|---|---|---|---|---|---|
| CMS-03B-01 | malformed path/header/body | missing/expired session | assignment/edit capability | hidden/absent entry | stale base/version, conflict, idempotency | non-JSON | field/schema/value failure | author-write limit | schema/RPC deadline | scrubbed internal |
| CMS-03B-02 | malformed IDs/header/body | missing/expired session | resolve capability | hidden/absent conflict | base moved, invalid choice, idempotency | non-JSON | choice/value schema | conflict-write limit | RPC deadline | scrubbed internal |
| CMS-03B-03 | malformed path/query/cursor | missing/expired session | read scope | hidden/absent entry/revision | cursor/context mismatch | unsupported media if sent | query bounds | read limit | read dependency/deadline | scrubbed internal |
| CMS-03B-04 | malformed IDs/header/body | missing/expired session | edit capability | hidden/absent revision | stale version, migration mismatch, idempotency | non-JSON | restore schema | restore limit | migration/RPC deadline | scrubbed internal |
| CMS-03B-05 | malformed IDs/header/body | missing/expired session | submit/assignment | hidden/absent entry/revision | open review, hash/dependency changed, idempotency | non-JSON | manifest/risk failure | review-write limit | preflight/RPC deadline | scrubbed internal |
| CMS-03B-06 | malformed ID/header/body | missing/expired or step-up MFA | reviewer/capability | hidden/absent review | stale review, duplicate decision, hash invalid, idempotency | non-JSON | decision/reason failure | decision limit | RPC deadline | scrubbed internal |
| CMS-03B-07 | malformed IDs/header/body | missing/expired or step-up MFA | publisher | hidden/absent target | schedule collision/stale version/idempotency | non-JSON | time/tzdb/action failure | schedule limit | preflight/RPC deadline | scrubbed internal |
| CMS-03B-08 | malformed body/path/version set | missing/expired session | preview capability | hidden/absent target | stale version set/idempotency | non-JSON | route/audience/version failure | preview limit | schema/RPC deadline | scrubbed internal |
| CMS-03B-09 | malformed IDs/header/body | missing/expired or step-up MFA | publisher/review gate | hidden/absent target | stale set/hash, invalid state, idempotency | non-JSON | publication contract | publish limit | projection/RPC deadline | scrubbed internal |

Error details use BE00 allowlists: 400/422 may carry at most 50 JSON-pointer violations; 401 carries only recoveryAction; 403 reasonCode without policy predicates; 404 is empty; 409 may include authorized expected/current version and safe conflict hashes; 429 carries retryAfterSeconds, limit, resetAt; 502/503/504 carries dependencyClass, retryable, and optional retryAfterSeconds; 500 is empty. A denied entry/review/revision cannot be distinguished from absence when the caller lacks read authority.

## Database Schema

Canonical editorial records live in private Supabase PostgreSQL schemas. Every table below has RLS enabled and forced, direct browser grants revoked, and named RPC access only. Fields intentionally without FKs are code registries, opaque hashes, version snapshots, or JSON manifests; their values are checked against the producer contract and cannot select arbitrary tables or authority.

### Canonical records and fields

| Model / table | Typed fields, nullability, constraints, and FKs | Query indexes and write rules |
|---|---|---|
| ContentEntry / cms_content_entries | id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY; content_type_id uuid NOT NULL REFERENCES cms_content_types(id); owner_party_id uuid NULL REFERENCES identity_private.party(id); lifecycle text NOT NULL CHECK lifecycle IN ('active','archived','deletion_pending','held'); current_draft_revision_id uuid NULL; version bigint NOT NULL CHECK version > 0; created_by uuid NOT NULL REFERENCES auth.users(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(). | INDEX(owner_party_id,lifecycle,updated_at DESC); INDEX(content_type_id,lifecycle); UNIQUE(id,version). current_draft_revision_id is FK to cms_entry_revisions(id) added after table creation; one current draft enforced by RPC/CAS. No direct update/delete. |
| EntryRevision / cms_entry_revisions | id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY; entry_id uuid NOT NULL REFERENCES cms_content_entries(id); revision_number bigint NOT NULL CHECK revision_number > 0; schema_version_id uuid NOT NULL REFERENCES cms_content_type_versions(id); template_version_id uuid NULL REFERENCES cms_template_versions(id); taxonomy_version_ids jsonb NOT NULL CHECK jsonb_typeof(taxonomy_version_ids)='array'; parent_revision_ids jsonb NOT NULL CHECK jsonb_typeof(parent_revision_ids)='array' AND jsonb_array_length(parent_revision_ids) <= 2; locale text NOT NULL CHECK locale ~ '^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$'; payload_hash char(64) NOT NULL CHECK payload_hash ~ '^[a-f0-9]{64}$'; author_person_id uuid NOT NULL REFERENCES identity_private.person(id); acting_party_id uuid NULL REFERENCES identity_private.party(id); state text NOT NULL CHECK state IN ('draft','submitted','approved','rejected','scheduled','published'); validation_state text NOT NULL CHECK validation_state IN ('valid','invalid','unknown'); validation_report jsonb NOT NULL CHECK jsonb_typeof(validation_report)='object'; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); | UNIQUE(entry_id,revision_number,locale); INDEX(entry_id,locale,revision_number DESC); INDEX(entry_id,state,updated_at DESC); INDEX(schema_version_id); append-only after insert; state transition only RPC. |
| EntryFieldValue / cms_entry_field_values | revision_id uuid NOT NULL REFERENCES cms_entry_revisions(id); field_id uuid NOT NULL; field_definition_id uuid NOT NULL REFERENCES cms_field_definition_versions(id); locale text NOT NULL CHECK locale ~ '^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$'; value jsonb NULL; provenance text NOT NULL CHECK provenance IN ('authored','default','inherited','localized_fallback','explicit_null','missing'); value_hash char(64) NULL CHECK value_hash IS NULL OR value_hash ~ '^[a-f0-9]{64}$'; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); PRIMARY KEY(revision_id,field_id,locale); UNIQUE(revision_id,field_definition_id,locale). | INDEX(revision_id,locale); INDEX(field_id,locale); field_id is the stable UUID and field_definition_id is the versioned FK; value is validated by schema version and may be null only with explicit_null/missing provenance; no general EAV access or arbitrary field ID is accepted. |
| EntryRelation / cms_entry_relations | id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY; revision_id uuid NOT NULL REFERENCES cms_entry_revisions(id); field_id uuid NOT NULL; field_definition_id uuid NOT NULL REFERENCES cms_field_definition_versions(id); target_kind text NOT NULL CHECK target_kind ~ '^[a-z][a-z0-9._-]{0,95}$'; target_id uuid NOT NULL; expected_target_version bigint NULL CHECK expected_target_version > 0; position integer NOT NULL CHECK position >= 0 AND position < 512; on_unavailable text NOT NULL CHECK on_unavailable IN ('omit','block'); created_at timestamptz NOT NULL DEFAULT now(). | UNIQUE(revision_id,field_id,target_kind,target_id); INDEX(revision_id,field_id,position); INDEX(target_kind,target_id); field_id is the stable UUID and field_definition_id is the versioned FK; target_id has no cross-domain FK by design; target kind/projection are revalidated through 03a allowlist and target RLS at read/publish. |
| EditorialReview / cms_editorial_reviews | id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY; revision_id uuid NOT NULL REFERENCES cms_entry_revisions(id); risk_class text NOT NULL CHECK risk_class IN ('ordinary','protected'); state text NOT NULL CHECK state IN ('open','approved','rejected','invalidated'); frozen_hash char(64) NOT NULL CHECK frozen_hash ~ '^[a-f0-9]{64}$'; dependency_manifest jsonb NOT NULL CHECK jsonb_typeof(dependency_manifest)='object'; dependency_hash char(64) NOT NULL CHECK dependency_hash ~ '^[a-f0-9]{64}$'; required_capabilities jsonb NOT NULL CHECK jsonb_typeof(required_capabilities)='array'; required_decision_count smallint NOT NULL CHECK required_decision_count BETWEEN 1 AND 2; submitted_by uuid NOT NULL REFERENCES identity_private.person(id); submitted_at timestamptz NOT NULL DEFAULT now(); invalidated_reason text NULL; version bigint NOT NULL CHECK version > 0; updated_at timestamptz NOT NULL DEFAULT now(). | UNIQUE(revision_id) WHERE state IN ('open','approved'); INDEX(state,updated_at); INDEX(revision_id,state). Frozen hash/dependency set is immutable; invalidation is append-only audit plus state CAS. |
| EditorialDecision / cms_editorial_decisions | id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY; review_id uuid NOT NULL REFERENCES cms_editorial_reviews(id); reviewer_person_id uuid NOT NULL REFERENCES identity_private.person(id); acting_party_id uuid NULL REFERENCES identity_private.party(id); capability text NOT NULL CHECK octet_length(capability) BETWEEN 1 AND 128; decision text NOT NULL CHECK decision IN ('approve','reject'); reason text NOT NULL CHECK octet_length(reason) BETWEEN 1 AND 2000; comment_hash char(64) NULL CHECK comment_hash IS NULL OR comment_hash ~ '^[a-f0-9]{64}$'; reviewed_hash char(64) NOT NULL CHECK reviewed_hash ~ '^[a-f0-9]{64}$'; step_up_at timestamptz NULL; decided_at timestamptz NOT NULL DEFAULT now(); | UNIQUE(review_id,reviewer_person_id); INDEX(review_id,decided_at); INDEX(reviewer_person_id,decided_at DESC). Append-only; no update/delete; RPC verifies reviewer distinctness, capability, acting context, hash, and MFA freshness. |
| PublicationSchedule / cms_publication_schedules | id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY; entry_id uuid NOT NULL REFERENCES cms_content_entries(id); revision_id uuid NOT NULL REFERENCES cms_entry_revisions(id); action text NOT NULL CHECK action IN ('publish','unpublish','expire','archive'); local_datetime timestamp NOT NULL; timezone text NOT NULL CHECK octet_length(timezone) BETWEEN 1 AND 64; resolved_at_utc timestamptz NOT NULL; tzdb_version text NOT NULL CHECK octet_length(tzdb_version) BETWEEN 1 AND 32; disambiguation text NOT NULL CHECK disambiguation IN ('none','earlier','later'); state text NOT NULL CHECK state IN ('pending','executing','completed','failed_retryable','blocked','cancelled'); job_id uuid NULL; expected_version bigint NOT NULL CHECK expected_version > 0; actual_at_utc timestamptz NULL; deviation_seconds bigint NULL; version bigint NOT NULL CHECK version > 0; created_by uuid NOT NULL REFERENCES identity_private.person(id); created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(). | UNIQUE(entry_id,revision_id,action,local_datetime,timezone); INDEX(state,resolved_at_utc); INDEX(entry_id,state,resolved_at_utc); worker CAS on state/version; exact approved revision and dependency hash rechecked at execution. |

### Support records required by the IA algorithms

| Support record / table | Typed fields, nullability, constraints, and FKs | Query indexes and write rules |
|---|---|---|
| PublicationVersion / cms_publication_versions | id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY; entry_id uuid NOT NULL REFERENCES cms_content_entries(id); revision_id uuid NOT NULL REFERENCES cms_entry_revisions(id); schema_version_id uuid NOT NULL REFERENCES cms_content_type_versions(id); template_version_id uuid NULL REFERENCES cms_template_versions(id); taxonomy_version_ids jsonb NOT NULL CHECK jsonb_typeof(taxonomy_version_ids)='array'; settings_version bigint NOT NULL CHECK settings_version > 0; locale text NOT NULL CHECK locale ~ '^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$'; audience text NOT NULL CHECK octet_length(audience) BETWEEN 1 AND 64; publication_hash char(64) NOT NULL CHECK publication_hash ~ '^[a-f0-9]{64}$'; state text NOT NULL CHECK state IN ('active','superseded','revoked','pending'); activated_at timestamptz NULL; revoked_at timestamptz NULL; created_at timestamptz NOT NULL DEFAULT now(). | UNIQUE(entry_id,locale,audience) WHERE state='active'; INDEX(entry_id,locale,audience,state); INDEX(revision_id); append-only; transaction supersedes prior active and writes cms.publication.changed.v1 atomically. |
| PreviewToken / cms_preview_tokens | id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY; token_hash char(64) NOT NULL UNIQUE CHECK token_hash ~ '^[a-f0-9]{64}$'; entry_id uuid NOT NULL REFERENCES cms_content_entries(id); revision_id uuid NOT NULL REFERENCES cms_entry_revisions(id); user_id uuid NOT NULL REFERENCES auth.users(id); acting_party_id uuid NULL REFERENCES identity_private.party(id); capability_snapshot_hash char(64) NOT NULL CHECK capability_snapshot_hash ~ '^[a-f0-9]{64}$'; version_set jsonb NOT NULL CHECK jsonb_typeof(version_set)='object'; locale text NOT NULL CHECK locale ~ '^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$'; audience text NOT NULL CHECK octet_length(audience) BETWEEN 1 AND 64; route text NOT NULL CHECK route ~ '^/[^\u0000-\u001f]{0,2047}$'; expires_at timestamptz NOT NULL; nonce uuid NOT NULL; revoked_at timestamptz NULL; created_at timestamptz NOT NULL DEFAULT now(). | INDEX(entry_id,revision_id,expires_at); INDEX(user_id,expires_at); INDEX(expires_at) WHERE revoked_at IS NULL. Token plaintext never persists; default/max expiry 15 minutes; every open rechecks capability, acting context, version set, expiry, and revocation. |
| EditPresence / cms_edit_presence | entry_id uuid NOT NULL REFERENCES cms_content_entries(id); person_id uuid NOT NULL REFERENCES identity_private.person(id); acting_party_id uuid NULL REFERENCES identity_private.party(id); lease_until timestamptz NOT NULL; last_seen_at timestamptz NOT NULL; current_field_id uuid NULL; version bigint NOT NULL CHECK version > 0; PRIMARY KEY(entry_id,person_id). | INDEX(entry_id,lease_until); INDEX(person_id,lease_until); current_field_id is a stable field UUID revalidated against the active schema; advisory only; lease is 2 minutes, renewed every 30 seconds, expires without blocking another editor, and never grants write authority. |

### Permission, RLS and grants

- All ten tables are in private CMS schemas with RLS enabled and forced. authenticated and anon have no direct INSERT/UPDATE/DELETE grants. Named RPCs are cms_create_revision, cms_resolve_conflict, cms_list_revisions, cms_restore_revision, cms_submit_review, cms_record_review_decision, cms_schedule_publication, cms_mint_preview, cms_publish_revision.
- ContentEntry SELECT requires derived person/acting-party assignment or an approved public-control projection; owner_party_id is resolved server-side. EntryRevision/EntryFieldValue/EntryRelation inherit the parent entry predicate and additionally require locale/audience disclosure.
- EditorialReview SELECT requires reviewer/submitter assignment and risk capability; EditorialDecision SELECT returns only safe decision metadata to eligible participants and never exposes another reviewer's private comment.
- PublicationSchedule SELECT/write requires publisher scope on the entry. PublicationVersion is public only through Shard 04's authorized projection; control-plane reads are no-store. PreviewToken is never directly selectable; open is a SECURITY INVOKER RPC that hashes the token and rechecks all bindings.
- identity_private.person/id and identity_private.party/id are canonical BE01 references; this shard stores IDs only. Target domain IDs in EntryRelation are intentionally not FKs because target kinds cross producer-owned schemas and are authorized by named projection contracts.
- RLS predicates use verified session, acting party, relationship/assignment, capability, risk, lifecycle, locale, and target authorization. Caller-provided partyId, reviewer ID, author ID, or public flag is never trusted.
- Migration-owned SECURITY DEFINER functions are schema-qualified with empty search_path, PUBLIC execute revoked, named grants only, and positive/negative RLS tests. Audit/idempotency/outbox records remain BE00-owned and commit atomically.

## Middleware & Policies

### Per-operation authorization matrix

| Operation ID | Principal / capability | Ownership and state guard | 403 rule | 404 rule | Additional gate |
|---|---|---|---|---|---|
| CMS-03B-01 | verified human with cms.author or cms.editor | assigned active entry; active schema; draft/autosave allowed | visible entry, no assignment/edit | entry hidden/absent | schema and target relation recheck at save |
| CMS-03B-02 | assigned author/editor with conflict.resolve | unresolved conflict on assigned entry; base still readable | visible conflict, no resolve capability | hidden/absent entry/conflict | every same-field choice explicit |
| CMS-03B-03 | cms.author/editor/reviewer read scope | entry/revisions readable; cursor context matches actor/party | visible entry, no read capability | hidden/absent entry/revision | safe field diff only |
| CMS-03B-04 | cms.author/editor edit | source revision readable; migration chain registered; current schema compatible | source readable, no edit | hidden/absent entry/revision | restore creates new draft only |
| CMS-03B-05 | cms.editor or assigned submit capability | revision draft; dependency manifest resolves; submitter assigned | visible target, no submit | hidden/absent target | frozen hash and risk class |
| CMS-03B-06 | eligible reviewer/editor; legal/security reviewer for protected | review open; reviewer distinct; review hash current | visible review, capability/assignment missing | hidden/absent review | protected requires two humans, specialist capability, recent MFA |
| CMS-03B-07 | cms.publisher | approved revision/frozen set; schedule action allowed | visible target, no publish | hidden/absent target | step-up MFA; local/UTC/DST consistency |
| CMS-03B-08 | preview capability on target | revision/version set readable; token scope bounded | visible target, no preview | hidden/absent target | 15-minute token, noindex/no-store/no public cache |
| CMS-03B-09 | cms.publisher and approved candidate | frozen hash/dependencies current; no revocation/blocker | visible target, no publisher | hidden/absent target | preflight rerun and atomic publication/outbox |

Known readable resources with insufficient capability return 403. Resources outside the caller's disclosure scope, absent UUIDs after structural validation, expired/revoked preview tokens, and hidden reviews return indistinguishable 404 or the preview-safe denial. Structural malformed input is always 400 before an existence check.

### Security and abuse controls

- Raw body max 256 KiB; JSON nesting max 8, keys 128, arrays 128; rich text is an approved structured AST. Reject scripts, CSS, HTML event handlers, template expressions, SQL, executable URLs, arbitrary projection names, and hidden field injection.
- Autosave is advisory and bounded: default 3 seconds idle, hard maximum 30 seconds while dirty. Presence is a 2-minute lease renewed every 30 seconds and cannot block another editor. Local unsent values remain client-side when server authority changes.
- Every revision stores normalized hash, schema/template/taxonomy versions, author/acting context, parent IDs, validation result, and timestamp. A changed dependency, authority, or revision invalidates approval.
- Ordinary review requires author not equal to publisher where workflow says review. Protected policy/legal/security/financial disclosure requires two distinct humans, named specialist capability, and recent MFA. Reviewer identity is derived, never submitted as authority.
- Preview token plaintext is returned once, persisted only as a hash, bound to user, acting context, revision, full version set, locale, audience, route, expiry, nonce, and capability snapshot. Public caches/search/sitemaps never admit preview.
- Publication rechecks relation target visibility, privacy, rights/media, route/SEO, locale, migration, accessibility, settings, schema, template, block, pattern, and current revocation state. Last-known-good remains public only when no takedown/privacy/security fail-closed rule applies.
- Rate buckets are keyed by actor and acting party, with separate author/review/schedule/preview/publish classes. Concurrent revision writes cap at three per actor; duplicate exact commands are replayed, not multiplied.

## Data Flow

### Transaction and external seams

CMS-03B-01: parse request → authenticate/resolve acting context → check assignment and active schema → reserve idempotency → lock ContentEntry and base revision → validate changed paths/values/relations → insert immutable EntryRevision plus normalized EntryFieldValue/EntryRelation → update current draft pointer/version → append audit and cms.entry.revision-created.v1 outbox row → return 201. No publication or review mutation occurs.

CMS-03B-02: load conflict and common base under RLS → validate explicit choices against current schema → lock entry/base → insert revision with both parent IDs → close conflict atomically → audit/outbox. If base moved, return 409 with safe base/theirs/yours hashes/values and preserve both revisions.

CMS-03B-03 reads only authorized revision summaries and safe schema-aware hashes. CMS-03B-04 resolves a registered 03a migration chain, translates source content into current schema, validates non-fabricating defaults/relations, and inserts a new draft; it never edits or activates the source revision.

CMS-03B-05 revalidates author/assignment, freezes normalized content hash and dependency manifest, runs contract/relation/privacy/security/accessibility/rights/media/route/SEO/locale/migration/domain-binding preflights, creates EditorialReview, and writes cms.entry.review-changed.v1. CMS-03B-06 appends EditorialDecision, computes required count, and invalidates on any hash/dependency/authority change.

CMS-03B-07 stores local datetime, IANA timezone, resolved UTC, tzdb version, and disambiguation. A schedule worker receives only schedule ID, revision ID, expected version, dependency hash, and correlation IDs; it re-runs preflight at execution and transitions through CAS. CMS-03B-09 performs the same immediate preflight, then inserts PublicationVersion, supersedes prior active publication, records audit/idempotency, and writes exactly one cms.publication.changed.v1 event.

CMS-03B-08 validates exact version set and mints a short token. Every preview open rechecks the token hash, expiry, user/acting context, capability, version set, route, audience, locale, target relation authorization, and revocation. CMS-03B-09 never trusts a preview token as publication authorization.

The canonical compiler, migration transform, and projection consumers are internal. If a remote checker/registry adapter is enabled, its exact seam is: Zod request/response envelope, 2,000ms RPC timeout, application route deadline 15,000ms, at most three pre-effect retries at 15s/60s/300s with jitter, circuit opens after five consecutive retryable failures for 60s. Invalid upstream response maps 502, unavailable/open circuit 503, deadline 504. No publication commits on an unresolved preflight. An ambiguous post-effect response reconciles by idempotency/publication status before retry; no blind duplicate publish.

### State machine and concurrency

- EntryRevision: draft → submitted → approved or rejected → scheduled → published. Any changed draft creates a new revision and invalidates affected review. A rejected revision remains immutable and readable to authorized actors.
- EditorialReview: open → approved, rejected, or invalidated. Approval count and distinct people/capabilities are computed transactionally. Protected review requires two distinct humans and specialist/MFA evidence.
- PublicationSchedule: pending → executing → completed, failed_retryable, blocked, or cancelled. Exact action/revision/version is idempotent. Late/repeated workers record actual time/deviation and cannot duplicate a PublicationVersion.
- PublicationVersion: active → superseded or revoked. Unpublish/expire/archive creates a new state/version or tombstone; it never deletes prior evidence.
- Revision write uses SELECT FOR UPDATE and exact base/entry version. Same-field divergence never last-writes-wins; non-overlapping paths may merge with both parents. A lost response is resolved by the same idempotency key.
- Presence lease does not lock content. Worker/schedule leases use BE00 job semantics and CAS. Failed rows remain on old readable schema; a projection or provider outage cannot roll back committed publication state.

### Event schemas

All events use the BE00 identifier-only envelope: eventId UUID, eventType, schemaVersion, occurredAt, producer, correlationId, causationId, aggregateType, aggregateId, aggregateVersion as a lossless decimal string, and payload IDs only.

| Event type | Exact payload | Producer / consumer rule |
|---|---|---|
| cms.entry.revision-created.v1 | { entryId: UUID, revisionId: UUID } | CMS-03B-01, CMS-03B-02, and CMS-03B-04 emit after commit; review/search-draft/task consumers refetch under capability. |
| cms.entry.review-changed.v1 | { reviewId: UUID, revisionId: UUID } | CMS-03B-05/06 emit after review or decision commit; task/notification consumers refetch frozen state. |
| cms.publication.changed.v1 | { entryId: UUID, publicationVersionId: UUID } | CMS-03B-09 and schedule worker emit after publication transaction; Shard 04 route/render/search/sitemap/cache consumers converge exact ID/version. |
| cms.localization.changed.v1 | { entryId: UUID, locale: BCP47, revisionId: UUID } | 03c emits locale changes; 03b invalidates affected review/publication dependencies and refetches exact locale revision. |

Consumers are at-least-once, deduplicated by event identity, and monotonic by aggregate version. Unknown event versions go directly to DLQ. Retries are max three at 15s/60s/300s; terminal failure is visible as degraded/pending and never guessed as success. Events contain no content values, review comments, token, PII, or target-domain authority.

### Cross-shard direction

- BE00 provides ApiError, request IDs, ETags, idempotency, audit/outbox, jobs, queue envelope, CORS/CSRF, rate, SLO, and recovery fencing.
- BE01 provides verified person/party/acting context, assignment, mandate, capability, and MFA facts. 03b stores only canonical IDs and rechecks at commit.
- 03a provides active ContentTypeVersion, FieldDefinitionVersion, RelationDefinition, migration-chain, and BlockDefinitionVersion IDs/hashes. EntryRevision snapshots exact versions; stale schema rejects.
- 03c provides TemplateVersion, PatternVersion, TaxonomyVersion/Term, LocaleVariant, and related-content dependencies. 03b freezes hashes and invalidates on source/dependency change; 03c does not receive authority through a revision.
- Shard 04 consumes cms.publication.changed.v1 and refetches exact PublicationVersion under its own public projection/auth/cache policy. It owns route/render/search/sitemap convergence and tombstone handling.
- Shard 05 supplies governed settings/checker/risk definitions only through versioned allowlists; it cannot bypass editorial or legal/security gates.
- Domain shards supply named read-only projections for relations. A private/embargoed/deleted target is omitted or blocks per RelationDefinition; no stale target field is copied.
- Shard 16 canonical credential/entitlement/credit/EvidenceState/InstitutionGate records remain outside CMS; reserved-concept checks prevent entries or publications from impersonating them.

## Error Handling

### Operation error coverage

The route registry and contract matrix are exhaustive for all nine operation IDs. Every failure uses BE00 ApiError { code, message, requestId, details } and no command reports success before its canonical transaction outcome is known.

| Operation ID | Before mutation | Transaction / race | After commit / recovery |
|---|---|---|---|
| CMS-03B-01 | transport/auth/assignment/schema/value errors | 409 base/version/conflict/idempotency; rollback leaves no revision | committed revision event retries idempotently; local unsent value retained on denial |
| CMS-03B-02 | transport/auth/conflict-choice errors | 409 base moved or invalid transition; both parents preserved | new two-parent revision event; no inferred choice |
| CMS-03B-03 | transport/auth/cursor errors | safe read never mutates | projection lag does not change history; refetch cursor on expiry |
| CMS-03B-04 | transport/auth/migration errors | 409 stale version/chain/hash; source remains unchanged | new draft only; migration failure resumes or remains blocked |
| CMS-03B-05 | transport/auth/preflight errors | 409 open review/hash/dependency; no review on failure | review event retries; later dependency change invalidates review |
| CMS-03B-06 | transport/auth/MFA errors | 409 stale review/duplicate decision/hash; append-only decision | review event retries; approval cannot survive changed dependency |
| CMS-03B-07 | transport/auth/time errors | 409 exact schedule collision/version; no job effect | worker CAS, retry/DLQ; prior publication intact on blocked execution |
| CMS-03B-08 | transport/auth/version errors | 409 stale version set; no token mint | revocation/expiry causes 404-safe preview denial; no cache/search trace |
| CMS-03B-09 | transport/auth/preflight errors | 409 frozen hash/set/version/state; no partial publication | committed PublicationVersion remains canonical; Shard 04 retries projection; privacy/security/takedown may fail closed |

Failure cascade rules: a PostgreSQL disconnect before commit leaves no revision/review/schedule/publication; a lost response after commit is reconciled by idempotency/status. Queue/outbox failure does not roll back canonical state. Worker crash resumes by lease/CAS. Projection failure leaves pending/degraded status and last-known-good. Audit failure blocks the command. Unknown exception is 500 with empty details and scrubbed telemetry.

## Observability

Each operation emits structured scrubbed logs keyed by operation ID, requestId, traceId, correlationId, actor class, acting-context class, safe aggregate ID/hash, revision/version, outcome, error code, duration, dependency class, and retryability. No content values, review comments, token, email, party name, capability graph, raw target projection, or request body enters logs/provider-native diagnostics.

Per-operation metrics:

- cms_editorial_request_total{operation,outcome}, cms_editorial_latency_ms, cms_editorial_error_total{operation,code}, cms_editorial_rate_limited_total, cms_editorial_conflict_total{operation,reason}
- cms_revision_created_total, cms_revision_validation_failed_total, cms_conflict_open_total, cms_presence_active, cms_review_open_age, cms_review_invalidated_total
- cms_schedule_state_total, cms_schedule_lateness_seconds, cms_preview_minted_total, cms_preview_denied_total, cms_publication_state_total, cms_publication_projection_lag, cms_outbox_age, cms_queue_retry_total, cms_queue_dlq_total

Traces cover validation → principal/assignment → schema/dependency refetch → idempotency → RPC/SQL → audit/outbox → worker → Shard 04 refetch. Alert when review invalidation spikes >5%/5m, schedule blocked >15m, publication projection lag >2m, DLQ >0, outbox age >2m, or preview denial anomaly indicates forwarding/abuse. SLOs: Tier 1 p95 <750ms; Tier 2 p95 <1,200ms; protected RPC <300ms; job acceptance p95 ≤500ms/p99 ≤1,000ms; Queue first attempt p95 ≤60s; DLQ <0.1% daily.

## Testing Strategy

### Contract and route tests

- Generated OpenAPI, Hono routes, and registry rows match all nine operation IDs, method/path, request/success/error, auth, CORS, rate, timeout, cache, idempotency, ETag, and SLO fields.
- CMS-03B-01 tests every EntryRevisionRequest field, autosave 3s/30s, all field kinds through 03a, structured rich text, missing/null/empty/default/inherited provenance, relation allowlist, assignment denial, base conflict, and cms.entry.revision-created.v1.
- CMS-03B-02 tests base/theirs/yours conflict payloads, each explicit choice, cross-field merge, same-field choice, no-answer preservation, moved-base 409, and two-parent revision.
- CMS-03B-03 tests pagination limit 1/50, cursor signing/expiry/context binding, hidden revisions, compare hashes and safe field paths, no mutation, and no private content disclosure.
- CMS-03B-04 tests registered migration chain, missing step, non-fabricating transform, source immutability, current-schema draft, stale ETag, worker failure, and replay.
- CMS-03B-05 tests frozen content/dependency hashes, all preflight categories, ordinary/protected risk, one open review, duplicate submission, and review event.
- CMS-03B-06 tests author/reviewer distinctness, duplicate reviewer, ordinary/protected required counts, specialist/MFA freshness, stale hash, reject path, invalidation, and append-only decisions.
- CMS-03B-07 tests IANA timezone, tzdb snapshot, earlier/later DST, nonexistent time, all actions, exact-version schedule, duplicate/late worker, blocked/retryable/cancelled states, and actual deviation.
- CMS-03B-08 tests token entropy/one-time persistence, 15-minute max, user/acting/audience/locale/route/version-set binding, expiry/revocation/forwarding, no-store/noindex, and open-time reauthorization.
- CMS-03B-09 tests publisher/approval gates, all dependency rechecks, expected-version-set race, atomic PublicationVersion + outbox, prior active supersession, projection pending/degraded, and publication event.
- Every operation tests status 400, 401, 403, 404, 409, 415, 422, 429, 502, 503, 504, and 500 where applicable; exact ApiError shape/details and required response headers are asserted.

### Authorization, persistence, and concurrency tests

- Anonymous, expired session, wrong person, wrong acting party, unassigned editor, revoked mandate/capability, stale MFA, reviewer self-approval, hidden entry/review/revision, forged JWT metadata, service-role misuse, and over-disclosure tests cover every route.
- Every table tests SQL types/nullability/checks, FK targets, unique/partial indexes, enum transitions, append-only behavior, immutable hashes, RLS enabled/forced, direct grant revocation, named RPC grants, and target projection reauthorization.
- Concurrent same-key/same-body commands produce one effect and exact replay; same key with body/actor/path/version mismatch returns 409; failed transaction leaves no idempotency/audit/outbox/revision/review/schedule/publication.
- Concurrent autosaves, presence expiry, conflict resolution, review decisions, invalidation, schedule execution, publish race, preview revocation, duplicate/out-of-order events, worker lease expiry, restore migration, and restore epoch fencing are covered.

### Security, performance, and recovery tests

- Fuzz JSON nesting/keys/arrays, JSON Pointer, Unicode/control characters, rich-text AST, HTML/script/CSS/template/expression injection, route traversal, timezone/DST, cursor tampering, token forwarding, and oversized requests.
- Prove no draft/control/preview data reaches public cache/search/sitemap; private target relation cannot leak existence or stale fields; recommendation/preview/publication never grants target authority.
- Remote checker tests assert Zod response validation, exact 2,000ms timeout, 15s/60s/300s retries, five-failure/60s circuit, 502/503/504 mapping, and ambiguous outcome reconciliation.
- Performance tests use representative 128-field revisions and 50-page history: Tier 1 p95 <750ms, Tier 2 p95 <1,200ms, protected RPC <300ms, job acceptance p95 ≤500ms, projection event lag within SLO.
- Recovery drills prove old active publication survives blocked schedule, migration/restore failure creates no obsolete-schema publish, duplicate schedule/publish is harmless, DLQ replay converges, and privacy/takedown fail-closed removal supersedes last-known-good.

### Accessibility handoff tests

Validation errors preserve stable JSON Pointer paths and safe messages for focusable summaries. Autosave, connection, presence, conflict, review, schedule, preview, migration, and publication states expose truthful determinate/unknown/retryable status. Compare responses contain a semantic linear change list; no backend error requires color, drag, or inaccessible private content.

## Deepening Passes

| Pass | Focus | Evidence | Result |
|---|---|---|---|
| 1 | Source and split completeness | CMS-05–09 and CMS-13 mapped to nine routes; seven IA canonical models plus publication/preview/presence support records covered; four owned event types retained exactly. | PASS |
| 2 | Endpoint and contract reconciliation | Registry, field matrix, Zod schemas, error matrix, authorization, rate, CORS, observability, and tests key to every operation ID. | PASS |
| 3 | Persistence hard floor | Every canonical/support table lists SQL types, nullability/checks, FK target or intentional code-registry boundary, indexes, RLS, and grants. | PASS |
| 4 | Revision/review/publication sequencing | Immutable revisions, explicit conflicts, frozen hashes, distinct decisions, exact schedules, token rechecks, publication CAS, and outbox atomicity are deterministic. | PASS |
| 5 | Security and disclosure | Assignment/RLS, 403 versus 404, CSRF/CORS, MFA, no executable content, preview binding, target reauthorization, and fail-closed policy are explicit. | PASS |
| 6 | Failure and external seam | RPC/remote checker timeout, retries, circuit, ambiguous outcomes, worker lease/DLQ, projection lag, and audit failure have typed recovery. | PASS |
| 7 | Testability and accessibility | All operation success/refusal paths, data constraints, status headers, JSON pointers, and accessible status semantics have tests. | PASS |
| 8 | Cross-shard ownership | 03a schema, 03c composition/taxonomy/locale, BE01 authority, BE00 foundation, Shard 04 projection, and DEC-100 direction are explicit. | PASS |
| 9 | Two-implementer convergence | Independent implementers derive the same nine routes, state machines, version checks, transaction boundaries, error disclosure, and event payloads. | PASS |
| 10 | Adversarial review | Stale autosave, hidden target, self-approval, token forwarding, DST ambiguity, duplicate schedule, publication race, projection outage, and takedown all have deterministic outcomes. | PASS |

## Ambiguity Gate

- Micro ambiguity PASS: each operation has exact path, field types/bounds, success/error schema, auth/assignment, 403/404 disclosure, CORS, rate, timeout, idempotency, concurrency, observability, and tests.
- Macro ambiguity PASS: edit → revision → explicit conflict resolution → frozen review → distinct approval → schedule/preview → exact publication → outbox/projection is one complete flow; no hidden mutation or unowned handoff remains.
- Two-implementer PASS: two implementers using only this file and inherited 03a/BE00 contracts select identical routes, state transitions, RLS outcomes, event IDs, retry/DLQ behavior, and public fail-closed rules.
- Devil's-advocate PASS: hostile editor, reviewer self-approval, private relation target, stale schema/template/taxonomy, forwarded preview, ambiguous DST, duplicate schedule, worker crash, and Shard 04 outage are explicitly refused, reconciled, or degraded.
- No unresolved product, architecture, security, or implementation ambiguity remains in this boundary.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Classified IA Shard 03 into registry, editorial/publication, and composition/taxonomy/localization backend boundaries. | /write-be-spec-classify | Split Group, Classification |
| 2026-08-28 | Authored complete editorial workflow and publication backend contract for CMS-05–09 and CMS-13. | /write-be-spec-write | All |

## Dependency References

- [IA Shard 03 — CMS content modeling and authoring](../ia/03-cms-content-modeling.md)
- [IA Shard 03 deep dive — CMS content modeling and authoring](../ia/deep-dives/03-cms-content-modeling.md)
- [BE00 — Cross-cutting platform foundation](00-infrastructure.md)
- [03a — Content schema registry](03a-content-schema-registry.md)
- [03c — Composition, taxonomy, and localization](03c-composition-taxonomy-localization.md)
- [BE01 — Identity authority and party governance](01a-auth-account-linking.md)
- [BE02 — Shadow/profile/credentials boundaries](02a-shadow-claim-ownership.md)
- [Architecture Design](../2026-08-02-architecture-design.md)
- [Data Placement Strategy](../data-placement-strategy.md)
- [DEC-100 — bounded allowlisted cross-shard projections](../../decisions.md#dec-100-shard-02-accepts-bounded-inbound-evidence-and-policy-commands-without-upward-store-reads-2026-08-28)
