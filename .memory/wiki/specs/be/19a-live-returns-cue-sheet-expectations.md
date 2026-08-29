# Live Returns & Cue-Sheet Expectations — Backend Specification

**Status:** Complete
**IA source:** [Shard 19 — Performance reporting, money-in-flight and forecasting](../ia/19-royalty-reporting-forecasting.md)
**Deep-dive source:** [Deep Dive 19 — Royalty reporting and forecasting](../ia/deep-dives/19-royalty-reporting-forecasting.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns live-performance return drafts and amendments, registered-work/setlist line reconciliation, PRO submission sequencing, cue-sheet expectations and off-platform chase history. It contains RRF-01 through RRF-05. Show, setlist, placement and accounting truth remain in Shards 09, 10 and 18; this split never invents a registration, borrows accreditation, files a production cue sheet, or promises income.

## Classification

- **Type:** provenance-preserving performance-reporting boundary with versioned external submissions and evidence-based expectation tracking.
- **Boundary:** live_performance_return, return_line and cue_sheet_expectation ownership; show/setlist/placement source records, society membership/profile, work registration mappings, cases and money remain explicit seams.
- **Expected operations:** five HTTP operations, one for each assigned IA interaction (RRF-01, RRF-02, RRF-03, RRF-04 and RRF-05).
- **Approval:** blanket approval from /write-be-spec all shards; delegated decision authority applies.
- **Decision lock:** manual shows are lower-provenance but admitted; covers report the writer's work while explaining performer income may be zero; unregistered originals retain setlist evidence and omit return lines; society delivery is sequence-aware; cue-sheet state is expected/confirmed/missing/unverifiable and the platform only chases.

### IA Feature Mapping

The following `## Features` bullets are reproduced verbatim from `../ia/19-royalty-reporting-forecasting.md:23-26` and mapped to the owning backend route registries.

| IA feature bullet (verbatim) | BE coverage and authoritative operations |
|---|---|
| **10.06 Live Performance Setlist → PRO Reporting** — [ideation source](../ideation/10-royalties-collections/10.06-live-setlist-pro-reporting.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [19a](19a-live-returns-cue-sheet-expectations.md#authoritative-route-registry): `RRF-RET-API-01`–`RRF-RET-API-03`. |
| **10.07 Cue Sheets & Broadcast Performance Reporting** — [ideation source](../ideation/10-royalties-collections/10.07-cue-sheets-broadcast-reporting.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [19a](19a-live-returns-cue-sheet-expectations.md#authoritative-route-registry): `RRF-RET-API-04`–`RRF-RET-API-05`. |
| **10.09 Distribution Calendar & Money-in-Flight** — [ideation source](../ideation/10-royalties-collections/10.09-distribution-calendar-money-in-flight.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [19b](19b-distribution-calendar-money-in-flight.md#authoritative-route-registry): `RRF-CAL-API-01`–`RRF-CAL-API-04`. |
| **10.10 Royalty Forecasting** — [ideation source](../ideation/10-royalties-collections/10.10-royalty-forecasting.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [19c](19c-royalty-forecast-calibration.md#authoritative-route-registry): `RRF-FC-API-01`–`RRF-FC-API-03`. |

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 19](../ia/19-royalty-reporting-forecasting.md) | ## Acceptance Criteria, lines 30–34 | Validate/authorize/report completed shows, own PRO membership, amendment supersession, cue-sheet evidence and off-platform chase behavior. |
| [IA Shard 19](../ia/19-royalty-reporting-forecasting.md) | ## Interactions, lines 43–51 | Normative preconditions, behavior, completion and recovery for RRF-01 through RRF-05. |
| [IA Shard 19](../ia/19-royalty-reporting-forecasting.md) | ## Contracts, lines 60–77 | CreateLiveReturn, SubmitLiveReturn, CreateCueSheetExpectation, state enums and named errors. |
| [IA Shard 19](../ia/19-royalty-reporting-forecasting.md) | ## Data Models, lines 79–92 | live_performance_return, return_line and cue_sheet_expectation invariants and upstream ownership. |
| [IA Shard 19](../ia/19-royalty-reporting-forecasting.md) | ## Event Schemas, lines 135–146 | royalty.live-return.changed.v1 and royalty.cue-sheet-expectation.changed.v1 safe payloads and exclusions. |
| [Deep Dive 19](../ia/deep-dives/19-royalty-reporting-forecasting.md) | ## Reporting Algorithm, lines 18–26 | Show/setlist matching, covers, own membership, frozen profile/sequence, amendments and unverifiable cue status. |
| [Deep Dive 19](../ia/deep-dives/19-royalty-reporting-forecasting.md) | ## Abuse and Recovery Verification, lines 47–57 | Duplicate return, invented amount, fabricated cue status, and evidence/uncertainty proof. |
| [Deep Dive 19](../ia/deep-dives/19-royalty-reporting-forecasting.md) | ## Cross-Shard Contracts and ## Implementation Envelope, lines 59–74 | Shards 00, 09, 10 and 18 seams, PostgreSQL/RLS, Zod/Hono, queues and outbox. |
| [BE00](00-infrastructure.md) | Request/Response Contracts, lines 112–138; Middleware & Policies, lines 253–298; Deterministic Protocol Rules, lines 330–348; Error Handling, lines 418–452 | Actor context, request IDs, idempotency, audit/outbox, CORS, error envelope and fail-closed conventions inherited by every operation. |

## IA Source Map

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| RRF-01 Performer reports completed show | RRF-RET-API-01 | Load immutable show/setlist, match registered works, admit lower-provenance manual input, explain covers/unmatched lines and return honest no-route state. |
| RRF-02 Performer/operator submits PRO return | RRF-RET-API-02 | Require reporter's own PRO membership or permitted operator role, freeze society profile/sequence/expected-by and refuse blind duplicate. |
| RRF-03 Performer amends setlist | RRF-RET-API-03 | Create superseding return, retain prior filing and restart expected-by; never create a second independent filing or erase history. |
| RRF-04 Rights holder tracks cue sheet | RRF-RET-API-04 | Evidence-backed placement/production/territory expectation with expected/confirmed/missing/unverifiable state; no production filing. |
| RRF-05 User chases missing cue sheet | RRF-RET-API-05 | Create off-platform contact task/evidence for missing or unverifiable expectation; unreachable production is an honest dead end with retained history. |

## Endpoint Completeness Reconciliation

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| RRF-01 | Report completed show | RRF-RET-API-01 | Draft/no-route return with per-item match, cover and unmatched explanation. |
| RRF-02 | Submit PRO return | RRF-RET-API-02 | Frozen submitted/manual task/typed block with membership and sequence evidence. |
| RRF-03 | Amend setlist | RRF-RET-API-03 | Superseding version linked to prior return with restarted expected-by. |
| RRF-04 | Track cue sheet | RRF-RET-API-04 | Evidence-backed expectation and per-territory unverifiable state. |
| RRF-05 | Chase cue sheet | RRF-RET-API-05 | Contact task/dead-end history; no production filing side effect. |

## API Endpoints

### Authoritative Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| RRF-RET-API-01 | POST | /api/v1/royalties/live-returns | RRF-01 | Performer/reporter owns the completed show report or has an explicit act reporting role. | 201 CreateLiveReturnSuccess |
| RRF-RET-API-02 | POST | /api/v1/royalties/live-returns/{returnId}/submissions | RRF-02 | Original reporter with own PRO membership or territory-authorized operator. | 202 SubmitLiveReturnSuccess |
| RRF-RET-API-03 | POST | /api/v1/royalties/live-returns/{returnId}/amendments | RRF-03 | Original reporter or operator with the same reporting role owns amendment authority. | 201 AmendLiveReturnSuccess |
| RRF-RET-API-04 | POST | /api/v1/royalties/cue-sheet-expectations | RRF-04 | Rights holder or mandated administrator owns the licensed placement scope. | 201 CreateCueSheetExpectationSuccess |
| RRF-RET-API-05 | POST | /api/v1/royalties/cue-sheet-expectations/{expectationId}/chases | RRF-05 | Rights holder/admin in the expectation mandate may create a contact task. | 201 ChaseCueSheetSuccess |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-party verifier | {accessToken, actingContextId, resourceId, requiredRole} → {actorId, partyId, roles, mandateVersion, contextVersion} | 300 ms | 2 retries at 50 ms/150 ms before mutation | Open after 5 failures/30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| Shard 09 show/setlist resolver | {showId, actId, setlistVersionId, actorId} → {show, venue, territory, performanceDate, immutableItems[], readableVersion} | 700 ms | 2 retries at 100 ms/300 ms with same read key | Open after 4 failures/30 s; draft remains pending/no-route; half-open after 20 s. |
| Shard 18 work-registration mapping | {performedItemKeys[], territory, asOfDate, reporterPartyId} → {registeredWorks[], coverWriterRefs[], mappingVersion, blockers[]} | 700 ms | 2 retries at 100 ms/300 ms; no retry as a write | Open after 4 failures/30 s; unmatched lines remain preserved; half-open after 20 s. |
| Society profile/membership directory | {reporterPartyId, membershipId, territory, profileVersion} → {membershipVerified, reportingRole, societyProfile, channel, sequencePolicy} | 600 ms | 2 retries at 100 ms/300 ms; no fallback accreditation | Open after 4 failures/30 s; submission becomes typed block; half-open after 20 s. |
| Society submission adapter | {returnId, profileVersion, sequence, immutablePayloadHash, idempotencyKey} → {receiptRef, societySequence, acceptedAt, expectedBy} | 1,500 ms | 2 retries at 500 ms/1,500 ms only after provider idempotency acknowledgement | Open after 4 failures/60 s; state remains manual_task/unknown; half-open after 30 s. |
| Shard 06 case/evidence handoff | {mandateRef, placementId, productionId, evidenceRefs, taskType} → {caseId, taskId, acceptedRefs, caseState} | 800 ms | 2 retries at 100 ms/300 ms through durable outbox | Open after 4 failures/30 s; local chase remains collecting/dead_end; half-open after 20 s. |

## Request/Response Contracts

All schemas are Zod 4 strict objects. Unknown keys reject with VALIDATION_FAILED; identifiers are UUIDs, dates are ISO calendar dates, timestamps are RFC 3339 with offset, and every error uses the BE00/global envelope ApiError { code, message, requestId, details }.

```typescript
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const Uuid = z.uuid();
const DateOnly = z.iso.date();
const DateTime = z.iso.datetime({ offset: true });
const Key = z.string().min(16).max(160).regex(/^[A-Za-z0-9._:-]+$/);
const Context = z.object({ actingContextId: Uuid }).strict();
const ApiErrorSchema = z.object({
  code: z.string().min(1).max(80),
  message: z.string().min(1).max(500),
  requestId: Uuid,
  details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)
}).strict();
const Provenance = z.enum(["captured", "manual"]);
const ReturnItem = z.object({
  itemKey: Key,
  workId: Uuid.nullable(),
  isCover: z.boolean(),
  sourceRef: Key,
  note: z.string().trim().max(240).nullable()
}).strict();

export const CreateLiveReturnRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  showId: Uuid,
  actId: Uuid,
  venueId: Uuid,
  setlistVersionId: Uuid,
  performanceDate: DateOnly,
  territory: z.string().trim().min(2).max(16),
  provenance: Provenance,
  items: z.array(ReturnItem).min(1).max(500),
  expectedVersion: z.int().positive().nullable()
}).strict();
export const CreateLiveReturnSuccess = z.object({
  returnId: Uuid,
  state: z.enum(["draft", "not_filed"]),
  lineCount: z.int().nonnegative(),
  unmatchedCount: z.int().nonnegative(),
  noRoute: z.boolean(),
  version: z.int().positive()
}).strict();

export const SubmitLiveReturnRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  returnId: Uuid,
  membershipId: Uuid.nullable(),
  reportingRole: z.enum(["own_membership", "authorized_operator"]),
  societyProfileVersion: Key,
  sequence: z.int().positive(),
  expectedBy: DateOnly,
  expectedVersion: z.int().positive()
}).strict();
export const SubmitLiveReturnSuccess = z.object({
  returnId: Uuid,
  state: z.enum(["submitted", "manual_task", "blocked"]),
  receiptRef: Key.nullable(),
  expectedBy: DateOnly.nullable(),
  version: z.int().positive()
}).strict();

export const AmendLiveReturnRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  returnId: Uuid,
  setlistVersionId: Uuid,
  items: z.array(ReturnItem).min(1).max(500),
  expectedBy: DateOnly.nullable(),
  expectedVersion: z.int().positive()
}).strict();
export const AmendLiveReturnSuccess = z.object({
  returnId: Uuid,
  supersedesReturnId: Uuid,
  state: z.literal("amended"),
  expectedBy: DateOnly.nullable(),
  version: z.int().positive()
}).strict();

export const CreateCueSheetExpectationRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  placementId: Uuid,
  productionId: Uuid,
  rightsHolderPartyId: Uuid,
  territory: z.string().trim().min(2).max(16),
  obligationRef: Key,
  evidenceRefs: z.array(Key).min(1).max(100),
  expectedBy: DateOnly.nullable(),
  expectedVersion: z.int().positive().nullable()
}).strict();
export const CreateCueSheetExpectationSuccess = z.object({
  expectationId: Uuid,
  state: z.enum(["expected", "confirmed", "missing", "unverifiable"]),
  evidenceCount: z.int().positive(),
  expectedBy: DateOnly.nullable(),
  version: z.int().positive()
}).strict();

export const ChaseCueSheetRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  expectationId: Uuid,
  contactRoute: Key.nullable(),
  recordedAbsence: z.boolean(),
  evidenceRef: Key,
  expectedAt: DateTime,
  expectedVersion: z.int().positive()
}).strict();
export const ChaseCueSheetSuccess = z.object({
  expectationId: Uuid,
  taskId: Uuid,
  state: z.enum(["collecting", "dead_end"]),
  nextAction: z.enum(["contact", "manual_review", "none"]),
  version: z.int().positive()
}).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| RRF-RET-API-01 | CreateLiveReturnRequest | CreateLiveReturnSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RRF-RET-API-02 | SubmitLiveReturnRequest | SubmitLiveReturnSuccess / 202 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RRF-RET-API-03 | AmendLiveReturnRequest | AmendLiveReturnSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RRF-RET-API-04 | CreateCueSheetExpectationRequest | CreateCueSheetExpectationSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RRF-RET-API-05 | ChaseCueSheetRequest | ChaseCueSheetSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| RRF-RET-API-01 | Require completed Shard 09 show, immutable setlist version, act/date/venue/territory and actor reporting authority. Manual provenance is admitted and labeled lower-provenance. Preserve every item; a missing registration emits WORK_UNREGISTERED, omits only that return line and creates a registration/leakage action. No amount field is accepted. |
| RRF-RET-API-02 | Require draft return, reporter's own membership or explicitly permitted operator role, versioned society profile, positive sequence and expected-by. Existing show/reporter/society/sequence filing returns RETURN_DUPLICATE; missing membership returns MEMBERSHIP_REQUIRED; unavailable route becomes manual_task. |
| RRF-RET-API-03 | Require submitted return, same show and same reporting authority, a new setlist version and expected version. Create an additive superseding return; prior submission remains immutable and expected-by restarts. A second independent filing is RETURN_DUPLICATE. |
| RRF-RET-API-04 | Require licensed placement, production/territory obligation and at least one evidence ref under a placement mandate. Missing proof yields unverifiable, never assumed filed or missing; no production filing command is exposed. |
| RRF-RET-API-05 | Require missing or unverifiable expectation, mandate scope, evidence ref and contact route or explicit recorded absence. Create contact evidence/task only; unreachable or defunct production becomes dead_end with expectation/history retained. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| RRF-RET-API-01 | WORK_UNREGISTERED, REPORTING_ROUTE_UNAVAILABLE, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for a non-reporter/non-act actor; 404 hides unknown show/setlist/act. | Required 30 days; hash includes show/setlist/act/items/provenance. Replay returns return version; mismatch returns IDEMPOTENCY_MISMATCH. | 30 drafts/hour/act; 200/day/reporter. | Log operationId, requestId, show/act hashes, provenance, matched/unmatched counts and route class; no setlist titles or private notes. |
| RRF-RET-API-02 | MEMBERSHIP_REQUIRED, REPORTING_ROUTE_UNAVAILABLE, RETURN_DUPLICATE, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign return or role; 404 hides unknown return/membership. | Required 30 days; hash includes return/membership/profile/sequence/expected-by. Replay returns receipt/state; mismatch returns IDEMPOTENCY_MISMATCH. | 10 submissions/hour/show; 30/day/operator. | Log operationId, requestId, return/profile hashes, role class, sequence class, provider latency and state; no membership IDs or payload. |
| RRF-RET-API-03 | RETURN_DUPLICATE, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for non-reporter/operator; 404 hides unknown return/setlist. | Required 30 days; hash includes return/new setlist/items/expected-by. Replay returns superseding version; mismatch returns IDEMPOTENCY_MISMATCH. | 10 amendments/hour/show; 50/day/reporter. | Log operationId, requestId, return/setlist hashes, amendment version, line-count classes and expected-by; no item titles. |
| RRF-RET-API-04 | NOT_AUTHORIZED, VALIDATION_FAILED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign placement mandate; 404 hides unknown placement/production/expectation. | Required 30 days; hash includes placement/production/territory/obligation/evidence hashes. Replay returns expectation; mismatch returns IDEMPOTENCY_MISMATCH. | 60 expectations/hour/mandate; 500/day/administrator. | Log operationId, requestId, placement/production hashes, territory, evidence count, state and dependency latency; no production names or evidence bytes. |
| RRF-RET-API-05 | NOT_AUTHORIZED, VALIDATION_FAILED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign expectation; 404 hides unknown expectation/task. | Required 24 hours; hash includes expectation/contact/evidence/absence flag. Replay returns task/state; mismatch returns IDEMPOTENCY_MISMATCH. | 120 chases/hour/mandate; 20/day/expectation. | Log operationId, requestId, expectation/task hashes, contact class, absence flag, state and latency; no contact address or case notes. |

## Database Schema

### PostgreSQL Model Registry

All tables are in schema royalty, use UUID primary keys, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL and version bigint NOT NULL CHECK (version > 0). Return and expectation evidence is append-only; private contact routes and membership details are encrypted.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| live_performance_return | id uuid PK NOT NULL; show_id uuid NOT NULL FK projects.show; act_id uuid NOT NULL FK identity.party; reporter_party_id uuid NOT NULL FK identity.party; venue_id uuid NOT NULL FK venues.place; setlist_version_id uuid NOT NULL FK projects.setlist_version; performance_date date NOT NULL; territory text NOT NULL; membership_id uuid NULL FK identity.membership; society_profile_version text NULL; sequence integer NULL CHECK (sequence IS NULL OR sequence > 0); expected_by date NULL; provenance text NOT NULL CHECK (provenance IN ('captured','manual')); state text NOT NULL CHECK (state IN ('draft','submitted','amended','overdue','distributed','not_filed')); supersedes_return_id uuid NULL FK royalty.live_performance_return; immutable_payload_hash char(64) NOT NULL CHECK (immutable_payload_hash ~ '^[a-f0-9]{64}$'); version bigint NOT NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | Unique (show_id, reporter_party_id, society_profile_version, sequence, version); (reporter_party_id, performance_date DESC); (show_id, state); (supersedes_return_id). | Reporter reads/writes own returns; authorized operator reads mandate scope; service worker advances submission state through RPC; society adapter sees signed payload only; anon no grant. |
| return_line | id uuid PK NOT NULL; return_id uuid NOT NULL FK royalty.live_performance_return; item_key text NOT NULL; registered_work_id uuid NULL FK rights.work; writer_work_id uuid NULL FK rights.work; is_cover boolean NOT NULL; source_ref text NOT NULL; match_state text NOT NULL CHECK (match_state IN ('matched','unmatched','work_unregistered','no_route')); unmatched_reason text NULL; provenance text NOT NULL CHECK (provenance IN ('captured','manual')); version bigint NOT NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | Unique (return_id, item_key, version); (return_id, match_state); (registered_work_id); (writer_work_id). | Return owner reads own lines; Shard 18 mapping worker writes match projection; no client rewrite/delete; writer/third-party identity is redacted outside authorized scope. |
| cue_sheet_expectation | id uuid PK NOT NULL; placement_id uuid NOT NULL FK rights.placement; production_id uuid NOT NULL FK production.production; rights_holder_party_id uuid NOT NULL FK identity.party; territory text NOT NULL; obligation_ref text NOT NULL; evidence_refs jsonb NOT NULL CHECK (jsonb_typeof(evidence_refs) = 'array'); expected_by date NULL; contact_route_ciphertext bytea NULL; state text NOT NULL CHECK (state IN ('expected','confirmed','missing','unverifiable','collecting')); last_chased_at timestamptz NULL; dead_end_reason text NULL; version bigint NOT NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | Unique (placement_id, production_id, territory, obligation_ref, version); (rights_holder_party_id, state, expected_by); (production_id, territory); (expected_by, state). | Rights holder/admin reads and writes mandate-scoped expectation; chase worker appends tasks through RPC; Shard 06 receives protected evidence refs; production contact is never public; anon no grant. |

### State, Concurrency and Transaction Rules

- live_performance_return moves draft → submitted, amended, overdue, distributed or not_filed. Amendment creates a new row with supersedes_return_id and restarts expected-by; prior rows never change.
- RRF-01 matches through Shard 18 registration mappings but never asserts ownership. A cover points to the writer's work and explicitly says the performer may earn nothing. An unregistered item remains in the setlist and becomes a named WORK_UNREGISTERED action.
- RRF-02 locks show/reporter/society/sequence under compare-and-swap. Own membership or permitted operator role is required; a route outage becomes a manual task, not an empty success. Provider retries reuse the return payload hash and idempotency key.
- cue_sheet_expectation moves expected/confirmed/missing/unverifiable/collecting. Unverifiable is first-class per territory. A chase writes a task/evidence row and cannot create a production filing or society acceptance.
- Every command uses a unique idempotency record and transactional outbox. Races return VERSION_CONFLICT or RETURN_DUPLICATE; partial provider outcomes remain submitted/manual_task/unknown with receipt evidence and safe retry.
- Source deletion/revocation tombstones required show/setlist/placement evidence, removes derived access and requeues dependent state; no orphaned return line or chase is silently removed.

### Grants, RLS and Retention

- RLS derives app.actor_party_id() and mandate version from BE00. Return predicates require reporter/act authority; cue predicates require rights-holder placement mandate; service workers are constrained to one job scope.
- Return owners see their own show, line and society status; authorized operators see only territory/reporting-role mandate scope; third-party production/member details remain private. Shard 18 receives only mapping inputs and safe return state.
- Immutable return payload, society receipt, cue evidence refs and chase history follow reporting/legal retention. Erasure revokes derived access and pseudonymizes ordinary projections without deleting audit, receipt, evidence or supersession lineage.
- No amounts, guaranteed income, member accreditation borrowed from another party, raw setlist/production content, contact address or provider credential is emitted in logs/events.

## Middleware & Policies

### Authorization Matrix

| Role | Allowed scope | Explicit denial |
|---|---|---|
| Performer/reporter | Create/read own return, submit with own membership, amend own submission, and chase own expectation. | Another act's return, another party's membership, guaranteed-income claim or production filing. |
| Venue/operator | Submit only when explicit territory reporting role grants the named show/act. | Membership impersonation, arbitrary setlist edits or cross-act reads. |
| Rights holder/admin | Create/read mandate-scoped cue expectations and chase history. | Filing a production cue sheet, foreign placement, or changing Shard 18 registration truth. |
| Society adapter/service principal | Verify profile/sequence and deliver one signed return payload. | Broad catalogue access, membership borrowing or creating an unrequested filing. |
| Shard 06 reviewer | Read assigned protected evidence/task projection. | Return mutation, production filing or cross-case browsing. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| RRF-RET-API-01 | requestId → strictCors(royaltyReportingOrigins) → requireAuth → resolveActingContext → rateLimit(liveReturnDraft) → parseZod(CreateLiveReturnRequest) → idempotency(30d) → authorizeShowReporter → immutableSetlistGuard → registrationMappingProjection → returnDraftTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| RRF-RET-API-02 | requestId → strictCors(royaltyReportingOrigins) → requireAuth → resolveActingContext → requireReportingRole → rateLimit(liveReturnSubmit) → parseZod(SubmitLiveReturnRequest) → idempotency(30d) → authorizeReturnReporter → membershipProfileGuard → sequenceGuard → societySubmissionOutbox → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| RRF-RET-API-03 | requestId → strictCors(royaltyReportingOrigins) → requireAuth → resolveActingContext → requireReportingRole → rateLimit(liveReturnAmend) → parseZod(AmendLiveReturnRequest) → idempotency(30d) → authorizeReturnReporter → supersessionVersionGuard → amendmentTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| RRF-RET-API-04 | requestId → strictCors(royaltyReportingOrigins) → requireAuth → resolveActingContext → rateLimit(cueExpectationWrite) → parseZod(CreateCueSheetExpectationRequest) → idempotency(30d) → authorizePlacementMandate → evidenceScopeGuard → unverifiableStateGuard → expectationTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| RRF-RET-API-05 | requestId → strictCors(royaltyReportingOrigins) → requireAuth → resolveActingContext → rateLimit(cueSheetChase) → parseZod(ChaseCueSheetRequest) → idempotency(24h) → authorizeExpectationScope → contactPrivacyGuard → noProductionFilingGuard → chaseOutboxTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |

### Security and Privacy Controls

Use opaque IDs, private/no-store return and expectation responses, one-use signed case links and encrypted membership/contact refs. CORS never permits * with credentials. Never log setlist titles, production names, membership numbers, contact addresses, raw evidence, society payload bytes or provider credentials. All external submission payloads are immutable and hashed; browser input cannot select another party's membership or trigger a production cue-sheet filing.

## Data Flow

1. RRF-RET-API-01 resolves the Shard 09 show/setlist, verifies acting reporter, queries Shard 18 registration mappings and writes a draft return plus one line per item.
2. Registered matches become reportable lines, covers point to writer work with no income promise, and unregistered originals remain preserved with WORK_UNREGISTERED action. A missing territory route returns no-route rather than an empty filing.
3. RRF-RET-API-02 verifies own membership/operator role and society profile, freezes sequence/expected-by, and sends one idempotent signed payload or creates a manual task.
4. RRF-RET-API-03 writes a superseding return and links prior history. RRF-RET-API-04 records evidence-backed cue expectation; RRF-RET-API-05 emits only off-platform contact/task evidence.
5. Events and Shard 06 handoffs expose scoped state/version and evidence classes; no event or consumer infers society acceptance, ownership or payable income.

## Events and Consumer Contracts

Events are transactional-outbox records with eventId, eventType, schemaVersion, occurredAt, aggregateId, aggregateVersion, correlationId and causationId. Payloads exclude setlists, society/member IDs, production details, evidence bytes and amounts.

| Event type | Emitted by | Required payload and consumers |
|---|---|---|
| royalty.live-return.changed.v1 | RRF-RET-API-01/02/03 | returnId, showId hash, society/profile class, state, sequence class, version; reporting tasks, registration leakage and Shard 18 projections consume it. |
| royalty.cue-sheet-expectation.changed.v1 | RRF-RET-API-04/05 | expectationId, placement/production hashes, territory, state, evidenceCount, version; chase tasks, leakage views and Shard 06 consume it. |

Consumers deduplicate by eventId and aggregate version, reject stale state, and never reinterpret a return as accepted income or a cue expectation as filed.

## Error Handling and Failure Recovery

| Operation ID | Failure | Required response and recovery |
|---|---|---|
| RRF-RET-API-01 | Show/setlist dependency outage or missing work registration | Return DEPENDENCY_UNAVAILABLE or preserve item with WORK_UNREGISTERED; no line is fabricated or dropped, and retry uses the same idempotency key. |
| RRF-RET-API-02 | Missing membership, route outage, provider ambiguity or duplicate | Return MEMBERSHIP_REQUIRED/manual_task/RETURN_DUPLICATE as applicable; retain draft and payload hash, retry provider only with acknowledged idempotency. |
| RRF-RET-API-03 | Concurrent amendment or provider state race | CAS returns VERSION_CONFLICT/RETURN_DUPLICATE; prior filing remains authoritative, new version is additive and expected-by restarts. |
| RRF-RET-API-04 | Obligation evidence insufficient | Persist unverifiable per territory and never assume filed/missing; evidence owner receives a named task. |
| RRF-RET-API-05 | No contact route or case handoff outage | Persist recorded absence/dead_end or local outbox task; never fabricate escalation or production filing, and retry handoff idempotently. |

All errors serialize ApiError { code, message, requestId, details }; details contains safe blocker owner, state, route class and retry metadata without private source or contact data.

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| RRF-RET-API-01 | Zod strict show/setlist/items/provenance and exact error envelope. | Reporter authority, manual provenance, cover/unregistered behavior, CORS/rate and redaction. | Immutable return/line rows, mapping projection, CAS, RLS/grants and event. | Missing registration, no route, Shard 09 outage, replay and safe telemetry. |
| RRF-RET-API-02 | Membership/role/profile/sequence/expected-by schema. | Own accreditation, duplicate sequence, CORS/rate and no payload leak. | Submission outbox, receipt, unique sequence, RLS and event. | Route/provider timeout, acknowledged retry, missing membership and duplicate replay. |
| RRF-RET-API-03 | Superseding setlist/items/version schema. | Same-role amendment, no history deletion, CORS/rate. | Supersession link, expected-by restart, CAS and event. | Concurrent amendment, provider race, duplicate and redacted audit. |
| RRF-RET-API-04 | Placement/production/territory/evidence schema. | Mandate scope, unverifiable state, no production filing, CORS/rate. | Expectation uniqueness, evidence retention, RLS and event. | Missing evidence, dependency outage and territory-specific status. |
| RRF-RET-API-05 | Chase route/absence/evidence/dead-end schema. | Expectation mandate, contact privacy, no fabricated escalation, CORS/rate. | Task/outbox, dead-end persistence, RLS and event. | Defunct production, case outage, duplicate chase and safe logs. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 strict schemas, setlist line limits, own-membership requirements, sequence/expected-by and unverifiable state. PostgreSQL tests prove immutable payloads, return supersession, line preservation, expectation evidence, RLS, CAS, idempotency and outbox atomicity. Adapter tests prove society retries do not duplicate a filing and no contact/production data leaks. Playwright covers keyboard-accessible return tables, cover/unmatched explanations, no-route/manual-task text, territory-specific cue states and private evidence views. The gate fails on borrowed accreditation, dropped unregistered line, fabricated cue status, second filing, provider duplicate or guaranteed-income language.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — boundary:** verified RRF-01 through RRF-05 map one-to-one to five routes; calendars, money-in-flight and forecasts remain in sibling companions.
- **Pass 2 — micro:** resolved manual provenance, cover treatment, WORK_UNREGISTERED, own membership, sequence, amendments, unverifiable cue state and off-platform dead end.
- **Pass 3 — macro:** traced show/setlist → mapping → return → society route and placement → expectation → chase/case; Shards 09/10/18/06 own their canonical facts.
- **Pass 4 — abuse/recovery:** covered duplicate filing, provider ambiguity, no route, missing membership/evidence, defunct production, dependency outage, CAS race and privacy-safe telemetry.
- **Pass 5 — contract:** every operation has exact Zod request/success/error, 403/404, idempotency, rate, CORS, ApiError, persistence, RLS, event and test rows.

## Ambiguity Gate

**PASS.** The five reporting and cue-sheet interactions are source-complete. Manual input, cover/unmatched behavior, membership authority, sequence races, territory-specific unverifiability and no-filing chase behavior have explicit states and recovery. No unresolved ambiguity remains inside this split.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Authored live return, PRO submission/amendment and cue-sheet expectation/chase backend contracts. | /write-be-spec |

## Dependency References

- **Depends on:** [BE00](00-infrastructure.md) for authority, CORS, ApiError, idempotency, audit and outbox; Shard 09 for show/setlist/placement; Shard 10 and Shard 18 for work registration/mapping; Shard 06 for protected case/evidence.
- **Consumed by:** 19b money-in-flight and 19c forecast projections may consume versioned return/expectation state; no consumer may infer acceptance, ownership or income.
- **Boundary:** this split records and submits the reporter's own return and observes/chases cue-sheet obligations. It never files for a production or manufactures a payable amount.
