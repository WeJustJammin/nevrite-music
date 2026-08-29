# BE Spec 34a — Tour Container, Routing, and Tour Book

> Source: [IA Shard 34](../ia/34-touring-operations.md), interactions 34.01–34.05. This companion owns the tour container, ordered tour dates, route evaluation facts, and recipient-scoped tour-book versions. Booking, event, venue, personnel, travel, budget, and gear sources remain canonical in their owning shards.

## Classification and Source Inventory

| Item | Decision |
|---|---|
| Split group | 34a of 34a–34d; tour structure, routing facts, and tour-book projection |
| Canonical models | `Tour`, `RouteLeg`, `TourBookVersion` |
| Canonical events | `tour.versioned`, `tour.route.evaluated` |
| Upstream sources | Shards 01/14/29–33 authority, engagement, venue, booking, settlement, production, and show-day versions |
| Non-ownership | A tour links source dates and participants; it does not rewrite booking/event/venue/person records |

## Endpoint Completeness

| IA ID | Operation | Invariant |
|---|---|---|
| 34.01 | Create/link tour | One authorized primary act owns the container; linked participant/date facts remain source-owned |
| 34.02 | Add show/hold/non-show day | Ordered member type, source version, constraints, and cost scope append under optimistic concurrency |
| 34.03 | Allocate shared co-headline cost | Both linked tour mandates approve one immutable allocation version before budget handoff |
| 34.04 | Evaluate route leg | Version-pinned distance, drive/rest ranges, profile confidence, and humane-risk facts render; no unsupported legality claim |
| 34.05 | Render tour book | Accessible recipient projection, artifact, live link, offline bundle, gaps, and supersession are versioned |

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 34](../ia/34-touring-operations.md) | Interactions lines 71–92; Contracts lines 93–112; Data Models lines 113–154; Access Control lines 155–180; Event Schemas and Edge Cases lines 190–220 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 18.11 Tour Container & Routing | BE34A-01–BE34A-05 / 34.01–34.05 |

## API Endpoints

### Authoritative Route Registry

| Operation ID | IA | Method | Path | Authorization | Idempotency/concurrency | Rate, cache, SLO | CORS policy |
|---|---|---|---|---|---|---|---|
| BE34A-01 | 34.01 | POST | `/api/v1/tours` | primary-act tour administrator | required key; create fingerprint | 20/hour/act; no-store; p95 400 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE34A-02 | 34.02 | POST | `/api/v1/tours/{tourId}/dates` | tour editor plus source-date authority | required key + `If-Match` | 120/hour/tour; no-store; p95 350 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE34A-03 | 34.03 | POST | `/api/v1/tours/{tourId}/cost-allocations` | both tour finance mandates | required key + both expected versions | 30/hour/date; no-store; p95 500 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE34A-04 | 34.04 | POST | `/api/v1/tours/{tourId}/route-legs/evaluations` | tour viewer with routing scope | key binds source versions/profile | 120/hour/tour; private 60 s by version; p95 900 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE34A-05 | 34.05 | POST | `/api/v1/tours/{tourId}/tour-books` | tour-book publisher and recipient-policy scope | required key + source digest | 20/hour/tour; no-store; 202 within 500 ms | `BE00-CORS-WEB-CREDENTIALLED` |

All paths use ULIDs. JSON bodies are capped at 128 KiB. Exact first-party origins receive credentialed CORS; service renderers receive non-browser allow-list CORS. Preflight permits only the route method plus `OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`; responses include `Vary: Origin`. Wildcard origins, public caches, and browser service credentials are forbidden.

### Per-Operation Validation Middleware Matrix

This is the validation column of the authoritative route registry: join on the stable operation ID above. Each row runs after BE00 request ID/CORS and authentication admission, before authorization/handler execution; the same registry row supplies the numeric rate and literal CORS policy.

| Operation ID | Validation middleware |
|---|---|
| BE34A-01 | strict headers and `CreateTour` body; reject unknown keys and validate the success body before serialization |
| BE34A-02 | strict path `tourId`, headers, and `AddTourDate` body; reject unknown keys and validate the success body before serialization |
| BE34A-03 | strict path `tourId`, headers, and `AllocateSharedCost` body; reject unknown keys and validate the success body before serialization |
| BE34A-04 | strict path `tourId`, headers, and `EvaluateRoute` body; reject unknown keys and validate the success body before serialization |
| BE34A-05 | strict path `tourId`, headers, and `RenderTourBook` body; reject unknown keys and validate the success body before serialization |

## Zod 4 Contracts

```ts
const Id = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const At = z.string().datetime({ offset: true });
const Version = z.number().int().positive();
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
const JsonPrimitive = z.union([z.string(), z.number().finite(), z.boolean(), z.null()]);
const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([JsonPrimitive, z.array(JsonValueSchema), z.record(z.string(), JsonValueSchema)]));
const ApiError = z.object({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/), message: z.string().min(1).max(500),
  requestId: z.string().uuid(),
  details: z.record(z.string(), JsonValueSchema).refine(v => Object.keys(v).length <= 16)
}).strict();

const CreateTour = z.object({
  primaryActId: Id, name: z.string().trim().min(1).max(160),
  participantIds: z.array(Id).max(100).default([]),
  sourceDateIds: z.array(Id).max(500).default([]),
  timezonePolicy: z.enum(['date_local','primary_act_home'])
}).strict().refine(v => !v.participantIds.includes(v.primaryActId), {
  path: ['participantIds'], message: 'primary act is implicit'
});

const AddTourDate = z.object({
  expectedVersion: Version, sourceDateId: Id.optional(),
  type: z.enum(['show','hold','non_show']), localDate: z.string().date(),
  orderAfterMemberId: Id.nullable(), constraintRefs: z.array(Id).max(50),
  costScope: z.enum(['tour','date','shared']), sourceVersion: Version.optional()
}).strict().superRefine((v,c) => {
  if (v.type !== 'non_show' && (!v.sourceDateId || !v.sourceVersion))
    c.addIssue({code:'custom',path:['sourceDateId'],message:'show/hold requires pinned source'});
});

const AllocateSharedCost = z.object({
  dateMemberId: Id, linkedTourId: Id, category: z.string().trim().min(1).max(80),
  amountMinor: z.bigint().nonnegative(), currency: z.string().regex(/^[A-Z]{3}$/),
  basis: z.enum(['fixed','percentage','headcount']),
  primaryShareBps: z.number().int().min(0).max(10_000),
  approvalIds: z.tuple([Id,Id]), expectedTourVersions: z.tuple([Version,Version])
}).strict().refine(v => v.basis !== 'percentage' || v.primaryShareBps <= 10_000, {
  path:['primaryShareBps'], message:'invalid allocation'
});

const EvaluateRoute = z.object({
  fromMemberId: Id, toMemberId: Id, transportMode: z.enum(['road','rail','air','sea']),
  loadOutAt: At, nextLoadInAt: At, driverCount: z.number().int().min(0).max(20),
  vehicleProfileRef: Id.optional(), ruleProfileRef: Id.optional(),
  sourceVersions: z.record(z.string(), Version)
}).strict().refine(v => Date.parse(v.loadOutAt) < Date.parse(v.nextLoadInAt), {
  path:['nextLoadInAt'], message:'must follow load-out'
});

const RenderTourBook = z.object({
  expectedTourVersion: Version, recipientPolicyId: Id,
  recipientIds: z.array(Id).min(1).max(500),
  formats: z.array(z.enum(['html','pdf','offline_bundle'])).min(1),
  locale: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
  sourceVersions: z.record(z.string(), Version)
}).strict();
```

Unknown keys, duplicate IDs, non-finite values, unsafe markup, invalid currency, stale versions, inaccessible sources, and recipient fields outside the policy fail before mutation. Response schemas are strict and expose opaque references, never private travel, credential, rooming, financial, or safety contents.

## Database Schema

```sql
create table tours (
  id text primary key, tenant_id text not null, primary_act_id text not null,
  name text not null check (char_length(name) between 1 and 160),
  state text not null check (state in ('draft','active','completed','cancelled')),
  timezone_policy text not null check (timezone_policy in ('date_local','primary_act_home')),
  version bigint not null check (version > 0), created_by text not null,
  created_at timestamptz not null, updated_at timestamptz not null
);
create table tour_participants (
  tour_id text not null references tours(id), party_id text not null,
  role text not null, source_version bigint not null check (source_version > 0),
  effective_from timestamptz not null, effective_to timestamptz,
  primary key (tour_id, party_id, effective_from),
  check (effective_to is null or effective_to > effective_from)
);
create table tour_date_members (
  id text primary key, tour_id text not null references tours(id),
  source_date_id text, member_type text not null check (member_type in ('show','hold','non_show')),
  local_date date not null, ordinal integer not null check (ordinal >= 0),
  constraint_refs jsonb not null, cost_scope text not null check (cost_scope in ('tour','date','shared')),
  source_version bigint, tour_version bigint not null check (tour_version > 0),
  unique (tour_id, ordinal), unique (tour_id, source_date_id)
);
create table route_legs (
  id text primary key, tour_id text not null references tours(id),
  from_member_id text not null references tour_date_members(id),
  to_member_id text not null references tour_date_members(id),
  input_versions jsonb not null, transport_mode text not null,
  distance_low_km numeric(12,2), distance_high_km numeric(12,2),
  drive_low_minutes integer, drive_high_minutes integer, rest_minutes integer,
  rule_profile_ref text, profile_confidence numeric(5,4) check (profile_confidence between 0 and 1),
  humane_risk text not null check (humane_risk in ('unknown','low','medium','high')),
  evaluated_at timestamptz not null, unique (tour_id,from_member_id,to_member_id,input_versions)
);
create table tour_book_versions (
  tour_id text not null references tours(id), version bigint not null check (version > 0),
  source_snapshot jsonb not null, recipient_policy_id text not null,
  artifact_hashes jsonb not null, live_link_ref text, offline_hash text,
  gap_refs jsonb not null, supersedes_version bigint, rendered_by text not null,
  created_at timestamptz not null, primary key (tour_id,version)
);
create table tour_cost_allocations (
  id text primary key, tour_id text not null references tours(id), linked_tour_id text not null,
  date_member_id text not null references tour_date_members(id), category text not null,
  amount_minor bigint not null check (amount_minor >= 0), currency char(3) not null,
  basis text not null, primary_share_bps integer not null check (primary_share_bps between 0 and 10000),
  approval_ids jsonb not null, allocation_version bigint not null check (allocation_version > 0),
  unique (tour_id,linked_tour_id,date_member_id,category,allocation_version)
);
```

Required indexes: tour owner/state, active participants, date order/local date, route adjacency/evaluation time, book current version, and allocation date/category. Every table enables and forces RLS. Direct client table writes and all `DELETE` grants are denied. Security-definer RPCs receive only authenticated execution; they recheck tenant, act/date mandate, recipient policy, source visibility, and expected versions. Tour readers see only tours in their active mandate; recipient projections are filtered before artifact creation. Workers have row-scoped leases, not broad user credentials.

## State, Transactions, and Recovery

- BE34A-01 validates primary-act authority and source visibility, inserts `Tour`, participants/date links, audit, outbox, and idempotency response atomically.
- BE34A-02 locks the tour version, checks source ownership/version, calculates a gapless ordinal, appends the date and next tour version, then emits one change event. Conflicting primary ownership is `409 SOURCE_OWNERSHIP_CONFLICT`.
- BE34A-03 locks both tours in sorted-ID order, verifies two live finance approvals, writes one allocation with reciprocal budget handoff receipts, and commits or rolls back both. Missing approval leaves no allocation.
- BE34A-04 reads adjacent pinned snapshots, calls distance/rule adapters outside the mutation transaction, then stores only if all source versions still match. Missing rule profile returns ranges and `humaneRisk=unknown`; it never asserts legality.
- BE34A-05 freezes a recipient-minimized snapshot and job in one transaction. Renderer artifacts are hashed, scanned, attached, and promoted only if the source digest remains current; otherwise the job finishes `superseded`.

Idempotency binds tenant, actor, operation, path, and canonical body hash for 24 hours (72 hours for allocations). Same key/different hash returns `409 IDEMPOTENCY_CONFLICT`; in-flight replay returns `409 REQUEST_IN_PROGRESS`; committed replay returns the stored status/body. Optimistic conflicts include current opaque version only.

## Events and External Boundaries

| Event | Trigger and payload | Delivery |
|---|---|---|
| `tour.versioned` | committed tour/date/participant/allocation version; `{tourId,version,ownerDelta,dateDeltas,participantDeltas,occurredAt}` | transactional outbox, ordered by tour/version, at-least-once |
| `tour.route.evaluated` | committed route result; `{tourId,legId,inputVersions,distanceRange,driveRange,restMinutes,profileRef,profileConfidence,humaneRisk,occurredAt}` | dedupe by event ID and leg/input digest |

Envelope is `{eventId,eventType,schemaVersion:1,aggregateId,aggregateVersion,tenantId,occurredAt,traceId,payload}`. Consumers ignore stale versions and quarantine equal-version digest conflicts. Payloads omit recipient lists and protected source data.

Distance/rule adapters: 500 ms connect, 2 s total, two retries at 200/800 ms full jitter for timeout/429/5xx, circuit after 5 failures/60 s for 60 s. Unknown dependency returns facts-only or typed `503 ROUTING_SOURCE_UNAVAILABLE`, never invented distance/rest/legality. Renderer/storage: 30 s per format, two retries at 1/5 s, circuit after 5 failures/min for 2 min; prior tour book remains current and the failed job is replayable. Source adapters use 2 s total and fail closed on authorization/version uncertainty.

### Exact integration contracts

| Seam | Exact request → response | Timeout, retry/backoff, circuit, and recovery |
|---|---|---|
| Source-date authority | `{sourceDateId,actorId,expectedRevision}` → `{sourceDateId,ownerPartyId,state,localDate,timezone,revision}` | 2 s total; two attempts after the original at 100/500 ms full-jitter backoff; opens after 5 failures/30 s for 60 s; any authorization or revision uncertainty returns `503 SOURCE_AUTHORITY_UNAVAILABLE` before mutation |
| Distance/rule adapter | `{fromCoordinatesRef,toCoordinatesRef,departAt,arriveBy,vehicleProfileVersion,restRuleProfileVersion,sourceRevisionDigest}` → `{distanceRangeKm,driveRangeMinutes,restMinutes,profileConfidence,ruleFacts,adapterReceipt}` | 500 ms connect/2 s total; two attempts at 200/800 ms full-jitter backoff for timeout/429/5xx; opens after 5 failures/60 s for 60 s; facts-only/unknown result is labeled and a stale source result is discarded |
| Renderer/storage | `{tourBookId,sourceSnapshotRef,sourceDigest,recipientPolicyId,formats}` → `{artifactReceipts:[{format,objectRef,checksum}],renderedAt}` | 30 s per format; two attempts at 1/5 s backoff; opens after 5 failures/min for 2 min; job remains replayable and the previous ready version stays current |

## Middleware, Errors, and Observability

Middleware order: request ID -> TLS/origin/CORS -> content/body limits -> authentication -> tenant/acting context -> rate -> strict Zod -> capability/source RLS -> idempotency/If-Match -> transaction -> response validation -> audit/outbox. Errors are `ApiError { code, message, requestId, details }` with allow-listed details.

| Status/code | Meaning |
|---|---|
| 400 `VALIDATION_FAILED` | malformed body, interval, order, allocation, or format |
| 401 `UNAUTHENTICATED` | missing/invalid principal |
| 403 `FORBIDDEN` | known resource but mandate/capability absent |
| 404 `NOT_FOUND` | resource inaccessible or absent without existence disclosure |
| 409 `VERSION_CONFLICT` | stale tour/source version |
| 409 `SOURCE_OWNERSHIP_CONFLICT` | source date has incompatible primary ownership |
| 409 `APPROVAL_REQUIRED` | one/both co-headline mandates absent |
| 422 `ROUTE_INPUT_INVALID` | non-adjacent, impossible time order, or unusable source |
| 429 `RATE_LIMITED` | budget exhausted; `Retry-After` supplied |
| 503 `ROUTING_SOURCE_UNAVAILABLE` | distance/rule dependency unavailable |
| 503 `RENDER_UNAVAILABLE` | artifact pipeline unavailable; prior version retained |

Logs contain request/trace/operation IDs, opaque tour/date/actor IDs, versions, outcome/code, latency, adapter attempts, route confidence class, render state, and outbox age; they exclude names, itinerary contents, room/travel facts, contacts, costs, and artifact URLs. Metrics cover latency/errors, version conflicts, unknown profile rate, high-risk legs, render duration/failure/supersession, allocation approval gaps, outbox lag, and dead letters. Availability target 99.9%; p99 synchronous writes <1.5 s; 99% render jobs <2 min. Page on outbox age >60 s, render queue oldest >10 min, or five-minute 5xx >2%.

## Verification Strategy

Contract tests cover every route/schema/error/CORS variant and reject unknown keys. Authorization matrices cross roles, tenants, source visibility, revoked mandates, and recipient policy. Transaction tests cover competing date inserts, both-tour lock order, partial allocation rollback, stale route results, idempotency races, and render supersession. RLS/grant tests run as authenticated and worker roles with cross-tenant probes. Adapter tests cover timeout/429/5xx/backoff/circuit/recovery and facts-only routing. Event tests cover atomic outbox, order, duplicate, poison, privacy, and schema evolution. Accessibility tests verify HTML/PDF reading order, headings, table semantics, contrast metadata, and offline manifest integrity.

CI fails for uncovered 34.01–34.05, missing `Tour`/`RouteLeg`/`TourBookVersion`, undocumented route/status/event, duplicate method+path, malformed table, broken link, direct client write grant, non-atomic audit/outbox, or sensitive logging.

## Exact Typed Success Schemas

Each operation comment below binds the authoritative route ID to one strict Zod 4 success body; undeclared response fields are rejected.

~~~ts
import { z } from "zod";
const Uuid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const Version = z.int().positive();
const Instant = z.iso.datetime({ offset: true });
const RequestId = z.string().min(16).max(128);
const Currency = z.string().regex(/^[A-Z]{3}$/);
const RateBps = z.int().min(0).max(10_000);
// BE34A-01 / 34.01
export const TourV1 = z.object({
  tourId: Uuid, primaryActId: Uuid, name: z.string().min(1).max(200),
  state: z.enum(["draft", "active", "completed", "cancelled"]),
  timezonePolicy: z.enum(["date_local", "primary_act_home"]), version: Version, createdAt: Instant, requestId: RequestId,
}).strict();
// BE34A-02 / 34.02
export const TourDateMemberV1 = z.object({
  memberId: Uuid, tourId: Uuid, type: z.enum(["show", "hold", "non_show"]), localDate: z.iso.date(),
  ordinal: z.int().min(1).max(10_000), costScope: z.enum(["tour", "date", "shared"]),
  sourceVersion: Version, version: Version, requestId: RequestId,
}).strict();
// BE34A-03 / 34.03
export const TourCostAllocationV1 = z.object({
  allocationId: Uuid, tourId: Uuid, linkedTourId: Uuid, dateMemberId: Uuid,
  amountMinor: z.bigint(), currency: Currency, basis: z.enum(["fixed", "percentage", "headcount"]),
  primaryShareBps: RateBps, approvalIds: z.array(Uuid).min(2).max(20), version: Version, requestId: RequestId,
}).strict();
// BE34A-04 / 34.04
export const RouteLegV1 = z.object({
  routeLegId: Uuid, fromMemberId: Uuid, toMemberId: Uuid,
  distanceRangeKm: z.object({ low: z.number().nonnegative(), high: z.number().nonnegative() }).strict(),
  driveRangeMinutes: z.object({ low: z.int().nonnegative(), high: z.int().nonnegative() }).strict(),
  restMinutes: z.int().nonnegative(), profileConfidence: z.number().min(0).max(1),
  humaneRisk: z.enum(["low", "medium", "high", "unknown"]), evaluatedAt: Instant, requestId: RequestId,
}).strict();
// BE34A-05 / 34.05
export const TourBookVersionV1 = z.object({
  jobId: Uuid, tourId: Uuid, sourceVersion: Version, recipientPolicyId: Uuid,
  formats: z.array(z.enum(["html", "pdf", "offline_bundle"])).min(1).max(3),
  state: z.enum(["queued", "rendering", "ready", "failed"]), version: Version, requestId: RequestId,
}).strict();
~~~

## Per-Operation Auditability Closure

Every error cell below uses the BE00 global `ApiError { code, message, requestId, details }`; safe `details` contain only the operation ID, current version, and non-sensitive recovery identifiers. Unhandled faults are `500 INTERNAL_ERROR`; admission failure is `429 RATE_LIMITED` with `Retry-After`.

| Operation | Exact request → success contract | Exact errors and deterministic recovery | Required observability | Required operation tests |
|---|---|---|---|---|
| BE34A-01 | `CreateTour` → 201 `TourV1 { tourId,primaryActId,name,state,timezonePolicy,version,createdAt,requestId }` | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 SOURCE_OWNERSHIP_CONFLICT or IDEMPOTENCY_CONFLICT; 429 RATE_LIMITED. No row/outbox on failure; correct authority/source and replay a new key only after body change. | `tour_create_total`, latency, denial/code, idempotency replay/conflict, outbox age; opaque act/tour IDs only | strict body/success schema; owner vs unrelated act; exact CORS/CSRF/ApiError; simultaneous create fingerprint; rollback/outbox |
| BE34A-02 | `AddTourDate` → 201 `TourDateMemberV1 { memberId,tourId,type,localDate,ordinal,costScope,sourceVersion,version,requestId }` | common 400/401/403/404/429 plus 409 VERSION_CONFLICT, SOURCE_OWNERSHIP_CONFLICT, or IDEMPOTENCY_CONFLICT. Refetch/rebase; source ownership conflict never inserts. | `tour_date_append_total`, version conflicts, reorder latency, source-validation outcome | date-type union and interval boundaries; source/date authority; CORS/ApiError; stale If-Match and concurrent ordinal insertion |
| BE34A-03 | `AllocateSharedCost` → 201 `TourCostAllocationV1 { allocationId,tourId,linkedTourId,dateMemberId,amountMinor,currency,basis,primaryShareBps,approvalIds,version,requestId }` | common set plus 409 APPROVAL_REQUIRED, VERSION_CONFLICT, or IDEMPOTENCY_CONFLICT. Missing approval leaves both tours unchanged; retry only after both mandates/version refresh. | `tour_allocation_total`, approval failures, cross-tour lock wait, amount-free audit outcome | bps/money properties; both mandates and 403/404 concealment; CORS/BE00 ApiError envelope; deadlock-safe concurrent cross-tour writes |
| BE34A-04 | `EvaluateRoute` → 200 `RouteLegV1 { routeLegId,fromMemberId,toMemberId,distanceRangeKm,driveRangeMinutes,restMinutes,profileConfidence,humaneRisk,evaluatedAt,requestId }` | common set plus 409 VERSION_CONFLICT; 422 ROUTE_INPUT_INVALID; 503 ROUTING_SOURCE_UNAVAILABLE. Invalid/unknown inputs produce no legality claim; dependency recovery replays the same key/input digest. | `route_evaluation_total`, source latency/attempt, circuit state, profile-confidence and humane-risk bands | adjacency/time-order properties; routing scope/404; CORS/BE00 ApiError envelope; retry/backoff/circuit and stale-version replay |
| BE34A-05 | `RenderTourBook` → 202 `TourBookVersionV1 { jobId,tourId,sourceVersion,recipientPolicyId,formats,state,version,requestId }` | common set plus 409 VERSION_CONFLICT or IDEMPOTENCY_CONFLICT; 503 RENDER_UNAVAILABLE. Prior ready book remains current; worker resumes from durable snapshot. | `tour_book_job_total`, queue/render latency, accessibility failure, circuit/dead-letter/outbox age | recipient allowlist and success schema; unauthorized field projection; CORS/ApiError; duplicate job, renderer timeout/retry, prior-version retention |

## Ambiguity Gate

- Interactions 34.01–34.05, all three canonical models, and both canonical events have explicit contracts.
- Ownership, concurrency, two-party allocation, facts-only routing, recipient minimization, supersession, recovery, errors, CORS, RLS/grants, SLOs, and tests are deterministic.
- Open Questions: None.
- Result: **PASS**.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Added explicit pre-audit structural closure and normalized authoritative per-operation CORS policies. |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [IA Shard 34](../ia/34-touring-operations.md)
- Shards 01/14/29–33 source authority, engagements, venues, bookings, settlement, production, and show-day contracts.
