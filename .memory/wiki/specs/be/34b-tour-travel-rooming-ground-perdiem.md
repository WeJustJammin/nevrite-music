# BE Spec 34b — Tour Travel, Rooming, Ground Transport, and Per Diem

> Source: [IA Shard 34](../ia/34-touring-operations.md), interactions 34.06–34.09. This companion records confirmed travel/stay/ground facts, privacy-minimized room assignments, and governed per-diem/float versions. It never books travel, scrapes private messages/email, declares transport legality without an authoritative profile, or invents custody/receipt evidence.

## Classification and Source Inventory

| Boundary | Contract |
|---|---|
| Canonical models | `TravelRecord`, `RoomingList`, `PerDiemFloatVersion` |
| Canonical event | `tour.travel.versioned` |
| Consumed sources | tour/date versions (34a), engagement/roster authority (14), production calls (32), identity/payment mandates (01/11), confirmed provider references |
| Privacy | Rooming projections contain assignment constraints/codes, never sensitive reasons; payment/contact values remain vaulted opaque refs |

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 34](../ia/34-touring-operations.md) | Interactions lines 71–92; Contracts lines 93–112; Data Models lines 113–154; Access Control lines 155–180; Event Schemas and Edge Cases lines 190–220 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 18.12 Travel, Accommodation & Ground | BE34B-06–BE34B-09 / 34.06–34.09 |

## API Endpoints

### Authoritative Route Registry

| Operation ID | IA | Method | Path | Authorization | Idempotency/concurrency | Rate/cache/SLO | CORS policy |
|---|---|---|---|---|---|---|---|
| BE34B-06 | 34.06 | POST | `/api/v1/tours/{tourId}/travel-records` | tour travel editor plus source confirmation | key + source digest; append version | 60/hour/tour; no-store; p95 500 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE34B-07 | 34.07 | POST | `/api/v1/tours/{tourId}/rooming-lists` | rooming coordinator with person-purpose scope | key + `If-Match`; optimistic version | 30/hour/stay; no-store; p95 500 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE34B-08 | 34.08 | POST | `/api/v1/tours/{tourId}/ground-plans` | travel editor/transport coordinator | key + pinned vehicle/driver/call versions | 60/hour/tour; no-store; p95 900 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE34B-09 | 34.09 | POST | `/api/v1/tours/{tourId}/per-diem-floats` | tour finance editor and current treasury mandate | key + `If-Match`; 72 h replay | 20/hour/tour; no-store; p95 700 ms | `BE00-CORS-WEB-CREDENTIALLED` |

34.06 appends segment/stay/ground reference, traveler, cost, cancellation, and source facts only after explicit confirmation. 34.07 emits a minimal assignment grid and named conflicts. 34.08 emits feasibility ranges/call impacts and an `unknown` legal posture when no authoritative profile exists. 34.09 pins eligibility/rate/day/person derivation, custodian assertions, currency, and reconciliation state.

All routes require TLS, ULID path IDs, strict JSON, a 96 KiB body cap, request ID, authenticated tenant context, and exact origin CORS. Browser preflight allows only `POST, OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`; service callers use mTLS/service identity and no credentialed wildcard. Responses are `Cache-Control: no-store, private` and `Vary: Origin`.

### Per-Operation Validation Middleware Matrix

This is the validation column of the authoritative route registry: join on the stable operation ID above. Each row runs after BE00 request ID/CORS and authentication admission, before authorization/handler execution; the same registry row supplies the numeric rate and literal CORS policy.

| Operation ID | Validation middleware |
|---|---|
| BE34B-06 | strict path `tourId`, headers, and `TravelRecordRequest` body; reject unknown keys and validate the success body before serialization |
| BE34B-07 | strict path `tourId`, headers, and `RoomingListRequest` body; reject unknown keys and validate the success body before serialization |
| BE34B-08 | strict path `tourId`, headers, and `GroundPlanRequest` body; reject unknown keys and validate the success body before serialization |
| BE34B-09 | strict path `tourId`, headers, and `PerDiemFloatRequest` body; reject unknown keys and validate the success body before serialization |

## Zod 4 Contracts

```ts
const Id = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const At = z.string().datetime({offset:true});
const Ver = z.number().int().positive();
const Money = z.object({amountMinor:z.bigint(),currency:z.string().regex(/^[A-Z]{3}$/)}).strict();
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
const JsonPrimitive = z.union([z.string(),z.number().finite(),z.boolean(),z.null()]);
const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() => z.union([JsonPrimitive,z.array(JsonValueSchema),z.record(z.string(),JsonValueSchema)]));
const ApiError = z.object({code:z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),message:z.string().min(1).max(500),requestId:z.string().uuid(),details:z.record(z.string(),JsonValueSchema).refine(v=>Object.keys(v).length<=16)}).strict();

const TravelRecordRequest = z.object({
  kind:z.enum(['air','rail','road','sea','stay']), sourceConfirmationId:Id,
  providerRef:z.string().trim().min(1).max(200), referenceToken:Id,
  startAt:At, endAt:At, originRef:Id, destinationRef:Id,
  travelerIds:z.array(Id).min(1).max(100), cost:Money.optional(),
  cancellationState:z.enum(['active','cancelled','changed','unknown']),
  cancellationTermsRef:Id.optional(), sourceVersion:Ver
}).strict().refine(v=>Date.parse(v.startAt)<Date.parse(v.endAt),{path:['endAt'],message:'must follow start'});

const RoomAssignment = z.object({
  roomId:Id, occupantIds:z.array(Id).min(1).max(8),
  constraintCodes:z.array(z.enum(['accessible','single','quiet','adjacent','no_share','other'])).max(10)
}).strict();
const RoomingListRequest = z.object({
  stayTravelRecordId:Id, expectedVersion:Ver, inventoryVersion:Ver,
  assignments:z.array(RoomAssignment).max(300), unassignedPersonIds:z.array(Id).max(100)
}).strict().superRefine((v,c)=>{
  const ids=v.assignments.flatMap(x=>x.occupantIds);
  if(new Set(ids).size!==ids.length)c.addIssue({code:'custom',path:['assignments'],message:'person assigned more than once'});
});

const GroundPlanRequest = z.object({
  travelRecordId:Id, vehicleRef:Id, driverIds:z.array(Id).min(1).max(10),
  pickupAt:At, arrivalDeadline:At, passengerIds:z.array(Id).min(1).max(100),
  vehicleVersion:Ver, driverVersions:z.record(z.string(),Ver), callVersion:Ver,
  ruleProfileRef:Id.optional()
}).strict().refine(v=>Date.parse(v.pickupAt)<Date.parse(v.arrivalDeadline),{path:['arrivalDeadline'],message:'must follow pickup'});

const PerDiemFloatRequest = z.object({
  expectedVersion:Ver, periodStart:z.string().date(), periodEnd:z.string().date(),
  currency:z.string().regex(/^[A-Z]{3}$/), custodianId:Id, treasuryMandateId:Id,
  lines:z.array(z.object({
    personId:Id, eligibleDays:z.number().int().min(0).max(366),
    rateMinor:z.bigint().nonnegative(), sourceAssertionId:Id
  }).strict()).min(1).max(500),
  floatMinor:z.bigint().nonnegative(), reconciliationDueAt:At
}).strict().refine(v=>v.periodStart<=v.periodEnd,{path:['periodEnd'],message:'must not precede start'});
```

Unknown keys, duplicate travelers/occupants/lines, inaccessible persons, absent source confirmation, invalid time/range/currency, stale version, raw card/bank values, free-text sensitive rooming reasons, and unsafe provider strings fail before persistence. Total per-diem liability is derived with checked bigint arithmetic; clients cannot submit a trusted total.

## Persistence, RLS, and Grants

```sql
create table travel_records (
  id text not null, version bigint not null check(version>0), tenant_id text not null,
  tour_id text not null, kind text not null check(kind in ('air','rail','road','sea','stay')),
  source_confirmation_id text not null, provider_ref text not null, reference_token text not null,
  start_at timestamptz not null, end_at timestamptz not null, origin_ref text not null, destination_ref text not null,
  traveler_ids jsonb not null, amount_minor bigint, currency char(3),
  cancellation_state text not null check(cancellation_state in ('active','cancelled','changed','unknown')),
  cancellation_terms_ref text, source_version bigint not null check(source_version>0),
  created_by text not null, created_at timestamptz not null,
  primary key(id,version), check(start_at<end_at),
  check((amount_minor is null)=(currency is null))
);
create table rooming_lists (
  id text not null, version bigint not null check(version>0), tour_id text not null,
  stay_travel_record_id text not null, stay_travel_record_version bigint not null check(stay_travel_record_version>0),
  inventory_version bigint not null check(inventory_version>0),
  assignment_json jsonb not null, unassigned_person_ids jsonb not null,
  conflict_codes jsonb not null, created_by text not null, created_at timestamptz not null,
  primary key(id,version),
  foreign key(stay_travel_record_id,stay_travel_record_version) references travel_records(id,version)
);
create table ground_plans (
  id text not null, version bigint not null check(version>0), tour_id text not null,
  travel_record_id text not null, travel_record_version bigint not null check(travel_record_version>0),
  vehicle_ref text not null, driver_ids jsonb not null,
  pickup_at timestamptz not null, arrival_deadline timestamptz not null, passenger_ids jsonb not null,
  source_versions jsonb not null, rule_profile_ref text, feasibility_state text not null
    check(feasibility_state in ('feasible','at_risk','unknown')),
  legal_posture text not null check(legal_posture in ('within_known_rules','conflict','unknown')),
  call_impact_minutes integer, created_at timestamptz not null,
  primary key(id,version), check(pickup_at<arrival_deadline),
  foreign key(travel_record_id,travel_record_version) references travel_records(id,version)
);
create table per_diem_float_versions (
  tour_id text not null, version bigint not null check(version>0),
  period_start date not null, period_end date not null, currency char(3) not null,
  custodian_id text not null, treasury_mandate_id text not null,
  derivation_json jsonb not null, liability_minor bigint not null check(liability_minor>=0),
  float_minor bigint not null check(float_minor>=0),
  state text not null check(state in ('draft','issued','partially_reconciled','reconciled','cancelled')),
  custodian_state text not null check(custodian_state in ('unassigned','assigned','acknowledged')),
  reconciliation_state text not null check(reconciliation_state in ('pending','in_progress','reconciled','variance')),
  reconciliation_due_at timestamptz not null, created_by text not null, created_at timestamptz not null,
  primary key(tour_id,version), check(period_start<=period_end)
);
```

`rooming_lists` and `ground_plans` pin the exact local `travel_records(id,version)` row through the declared composite foreign keys; their command transactions resolve and store that version server-side, so a later travel revision cannot silently rewrite a rooming or ground-plan premise. All remaining identifiers (`tour_id`, person/custodian IDs, provider references, mandate IDs, and rule-profile references) are source-owner seams: the owning shard validates the exact identifier/version tuple before this shard inserts a row, and no cross-shard database foreign key is inferred.

Required query indexes cover tour/time/current travel, traveler GIN, stay/current rooming, `ground_plans(tour_id,feasibility_state,arrival_deadline)` plus `(tour_id,legal_posture,version DESC)`, and `per_diem_float_versions(tour_id,state,reconciliation_state,reconciliation_due_at)` plus `(custodian_id,state,version DESC)`. All tables enable and force RLS. Base-table grants to `anon` and direct authenticated writes are denied; authenticated users execute scoped RPCs only. Travel visibility requires active tour purpose and traveler/operations scope. Rooming rows project only assigned names/codes to authorized coordinators and each person's own assignment; sensitive constraint sources are never stored. Per-diem values require finance scope; payment refs are returned only to treasury roles. Workers receive narrow row-lease grants.

## Transactions, State, and Recovery

- BE34B-06 locks the source-confirmation digest, rejects silent/unconfirmed ingestion, appends a `TravelRecord` version, audit/outbox, and response atomically. Cancellation/change creates a new version; history is immutable.
- BE34B-07 locks the rooming aggregate/inventory version, validates unique occupancy and person-purpose constraints, stores the minimal grid plus conflict codes, and increments one version. Concurrent editor loses with `VERSION_CONFLICT`.
- BE34B-08 pins travel/vehicle/driver/call inputs, evaluates outside the write lock, rechecks versions, and writes `feasible|at_risk|unknown`. Missing rule authority is `unknown`, never `legal`.
- BE34B-09 locks the tour finance aggregate, rechecks roster eligibility and treasury mandate, derives liability, appends `PerDiemFloatVersion`, and emits an audit/outbox record. Issuance/reconciliation are separate authorized transitions; missing receipts/assertions leave explicit outstanding lines.

Idempotency binds tenant, actor, route, aggregate, and canonical body hash for 24 hours (72 hours for per diem). Same-key/different-body is `409 IDEMPOTENCY_CONFLICT`; committed replay returns the original response. Timestamps use database time; all writes include audit/outbox in the transaction.

## Event, Dependencies, and Delivery

| Event | Trigger and payload | Consumers/delivery |
|---|---|---|
| `tour.travel.versioned` | committed travel, rooming, ground, or per-diem version; `{tourId,recordType,recordId,version,segmentRefs,stayRefs,affectedTravelerIds,changeCode,occurredAt}` | tour book and budget; transactional outbox, per-record ordering, at-least-once, event-ID dedupe |

Envelope: `{eventId,eventType,schemaVersion:1,aggregateId,aggregateVersion,tenantId,occurredAt,traceId,payload}`. Room numbers, provider references, contacts, costs, payment refs, and constraint reasons are excluded. Breaking payload changes use a new schema version with dual-publish migration.

Roster/travel/production source adapters use 2 s total, two retries at 100/500 ms for timeout/429/5xx, circuit after 5 failures/30 s for 60 s; authorization/version uncertainty fails closed. Transport profile evaluator uses 2 s and the same retry policy; outage returns `feasibilityState=unknown`. Notification delivery uses 3 s and retries 1/5/30 s; failures leave a replayable outbox job and never roll back committed source facts.

### Exact integration contracts

| Seam | Exact request → response | Timeout, retry/backoff, circuit, and recovery |
|---|---|---|
| Roster/travel/production authority | `{tourId,personIds,dateMemberIds,actorId,sourceRevisionDigest}` → `{authorizedPersonIds,dateCalls:[{dateMemberId,callAt,timezone}],sourceVersions,authorizationVersion}` | 2 s total; two attempts at 100/500 ms full-jitter backoff for timeout/429/5xx; opens after 5 failures/30 s for 60 s; missing authority/version returns `503 DEPENDENCY_UNAVAILABLE` before persistence |
| Provider-reference verifier | `{providerRef,referenceToken,kind,startAt,endAt}` → `{confirmed,confirmationId,providerState,confirmedAt,expiresAt}` | 2 s total; two attempts at 100/500 ms backoff; same source circuit; `confirmed=false` or ambiguity returns `422 SOURCE_UNCONFIRMED`, never a synthesized booking |
| Transport-profile evaluator | `{segments,passengerCount,vehicleProfileVersion,callManifest}` → `{feasibilityState,reasons,sourceVersions,evaluatedAt}` | 2 s total; two attempts at 100/500 ms backoff; opens after 5 failures/30 s for 60 s; outage persists `feasibilityState=unknown` without a legality claim |
| Notification delivery | `{eventType,recipientPolicyId,artifactRef,dedupeKey}` → `{deliveryReceiptId,state}` | 3 s total; three attempts at 1/5/30 s backoff; opens after 5 failures/min for 2 min; committed facts remain and the outbox job is replayable |

## Middleware, Errors, Observability, and Tests

Middleware: request ID -> TLS/CORS/body/content -> auth/context -> rate -> strict Zod -> tour/person/finance RLS -> step-up where financial -> idempotency/If-Match -> RPC transaction -> response schema -> redacted audit. Every error is `ApiError { code, message, requestId, details }`; details contain safe field codes/current version, never itinerary, room, identity, payment, or mandate secrets.

| Status/code | Condition/recovery |
|---|---|
| 400 `VALIDATION_FAILED` | correct body/time/union |
| 401 `UNAUTHENTICATED` | reauthenticate |
| 403 `FORBIDDEN` | known resource but purpose/capability absent |
| 404 `NOT_FOUND` | absent/concealed source |
| 409 `VERSION_CONFLICT` | refetch current version |
| 409 `IDEMPOTENCY_CONFLICT` | new key after correcting body |
| 409 `ASSIGNMENT_CONFLICT` | resolve duplicate/inventory/person constraint |
| 422 `SOURCE_UNCONFIRMED` | provide explicit provider/source confirmation |
| 422 `MANDATE_INVALID` | current roster/treasury mandate required |
| 429 `RATE_LIMITED` | honor `Retry-After` |
| 503 `DEPENDENCY_UNAVAILABLE` | retry key; no facts invented |

Logs include opaque request/tour/record/person-count IDs, versions, operation, outcome/code, latency, dependency attempts, feasibility class, conflict count, and outbox age; exclude names, routes, room numbers, references, contacts, cost values, constraint reasons, and payment data. Metrics cover latency/errors, conflicts, unconfirmed-source rejects, feasibility unknown, rooming gaps, outstanding per-diem lines, dependency circuits, and event lag. Availability target 99.9%; p99 writes <1.5 s; 99% event publication <30 s.

Tests: strict schema boundary/property cases; all route/role/tenant/revocation combinations; RLS cross-tenant/person-purpose probes; concurrent room/per-diem edits; travel cancellation versioning; duplicate/replayed keys; bigint liability; provider timeout/retry/circuit/recovery; unknown legality posture; audit/outbox atomicity/order/duplicates; PII/log/event redaction; migration constraints/index plans; CORS matrices. CI fails on uncovered 34.06–34.09, absent canonical model/event, route collision, malformed table/link, raw payment/contact data, or public/direct write grant.

## Exact Typed Success Schemas

Operation comments are the normative route mappings for these strict Zod 4 success bodies.

~~~ts
import { z } from "zod";
const Uuid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const Version = z.int().positive();
const Instant = z.iso.datetime({ offset: true });
const RequestId = z.string().min(16).max(128);
const Currency = z.string().regex(/^[A-Z]{3}$/);
// BE34B-06 / 34.06
export const TravelRecordV1 = z.object({
  travelRecordId: Uuid, tourId: Uuid, kind: z.enum(["air", "rail", "road", "sea", "stay"]),
  sourceConfirmationId: z.string().min(1).max(256), startAt: Instant, endAt: Instant,
  cancellationState: z.enum(["active", "cancelled", "changed", "unknown"]), sourceVersion: Version, version: Version, requestId: RequestId,
}).strict();
const RoomAssignment = z.object({
  assignmentId: Uuid, occupantPartyId: Uuid, roomType: z.string().regex(/^[a-z0-9_]{1,64}$/),
  roomLabel: z.string().max(128).nullable(), checkInAt: Instant, checkOutAt: Instant,
}).strict();
// BE34B-07 / 34.07
export const RoomingListV1 = z.object({
  roomingListId: Uuid, tourId: Uuid, stayRef: Uuid, assignments: z.array(RoomAssignment).max(1000),
  conflicts: z.array(z.object({ assignmentId: Uuid, code: z.string().regex(/^[a-z0-9_]{1,64}$/) }).strict()).max(1000),
  fieldPolicyVersion: Version, version: Version, requestId: RequestId,
}).strict();
const GroundSegment = z.object({
  segmentId: Uuid, fromRef: Uuid, toRef: Uuid, startsAt: Instant, endsAt: Instant,
  vehicleRef: Uuid, driverRef: Uuid, passengerCount: z.int().nonnegative().max(500),
}).strict();
// BE34B-08 / 34.08
export const GroundPlanV1 = z.object({
  groundPlanId: Uuid, tourId: Uuid, segments: z.array(GroundSegment).min(1).max(1000),
  feasibility: z.enum(["feasible", "at_risk", "unknown"]),
  callImpacts: z.array(z.object({ callRef: Uuid, deltaMinutes: z.int(), severity: z.enum(["info", "warning", "hard"]) }).strict()).max(1000),
  legalPosture: z.enum(["within_known_rules", "conflict", "unknown"]),
  sourceManifest: z.array(z.object({ sourceRef: Uuid, version: Version }).strict()).max(1000),
  version: Version, requestId: RequestId,
}).strict();
// BE34B-09 / 34.09
export const PerDiemFloatVersionV1 = z.object({
  floatId: Uuid, tourId: Uuid, currency: Currency,
  eligibility: z.array(z.object({ partyId: Uuid, eligible: z.boolean(), reasonCode: z.string().regex(/^[a-z0-9_]{1,64}$/) }).strict()).max(1000),
  rateDays: z.array(z.object({ localDate: z.iso.date(), rateMinor: z.bigint(), eligiblePartyCount: z.int().nonnegative() }).strict()).max(1000),
  totalMinor: z.bigint(), custodianState: z.enum(["unassigned", "assigned", "acknowledged"]),
  reconciliationState: z.enum(["pending", "in_progress", "reconciled", "variance"]), version: Version, requestId: RequestId,
}).strict();
~~~

## Per-Operation Auditability Closure

Each failure below is the BE00 `ApiError { code, message, requestId, details }`; details are recovery-safe and exclude itinerary, room reason, payment/contact, or provider payload. Unhandled faults map to `500 INTERNAL_ERROR`; rate denial maps to `429 RATE_LIMITED` with `Retry-After`.

| Operation | Exact request → success contract | Exact errors and deterministic recovery | Required observability | Required operation tests |
|---|---|---|---|---|
| BE34B-06 | `TravelRecordRequest` → 201 `TravelRecordV1 { travelRecordId,tourId,kind,sourceConfirmationId,startAt,endAt,cancellationState,sourceVersion,version,requestId }` | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 IDEMPOTENCY_CONFLICT or VERSION_CONFLICT; 422 SOURCE_UNCONFIRMED; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE. No invented confirmation; same key may replay after transient recovery. | `travel_record_total`, source attempt/latency/circuit, confirmation failures, outbox age | interval/union/body and success schema; authority/404 privacy; CORS/BE00 ApiError envelope; source timeout/retry/circuit and replay |
| BE34B-07 | `RoomingListRequest` → 201 `RoomingListV1 { roomingListId,tourId,stayRef,assignments,conflicts,fieldPolicyVersion,version,requestId }` | common 400/401/403/404/429 plus 409 ASSIGNMENT_CONFLICT, VERSION_CONFLICT, or IDEMPOTENCY_CONFLICT. Refetch/rebase; sensitive reason is never returned. | `rooming_list_total`, conflict count, RLS denials, redaction failures, lock wait | occupant/inventory properties and strict success; person-purpose matrix; CORS/ApiError; concurrent room assignment conflict/redaction |
| BE34B-08 | `GroundPlanRequest` → 201 `GroundPlanV1 { groundPlanId,tourId,segments,feasibility,callImpacts,legalPosture,sourceManifest,version,requestId }` | common set plus 409 VERSION_CONFLICT; 422 SOURCE_UNCONFIRMED; 503 DEPENDENCY_UNAVAILABLE. Missing authoritative rule yields `legalPosture=unknown`, never legal approval. | `ground_plan_total`, feasibility/unknown posture, source freshness, dependency circuit | segment/time/capacity properties; coordinator scope; CORS/BE00 ApiError envelope; unavailable rule source, retry/circuit, unknown posture |
| BE34B-09 | `PerDiemFloatRequest` → 201 `PerDiemFloatVersionV1 { floatId,tourId,currency,eligibility,rateDays,totalMinor,custodianState,reconciliationState,version,requestId }` | common set plus 409 VERSION_CONFLICT or IDEMPOTENCY_CONFLICT; 422 MANDATE_INVALID; 503 DEPENDENCY_UNAVAILABLE. Invalid treasury mandate commits nothing; reconciliation resumes from prior durable version. | `per_diem_float_total`, mandate denial, derivation mismatch, reconciliation lag, connector attempts | bigint/day/rate properties and response; finance/treasury role/RLS; CORS/ApiError; concurrent version, stale mandate, connector recovery |

## Ambiguity Gate

- Interactions 34.06–34.09, `TravelRecord`, `RoomingList`, `PerDiemFloatVersion`, and `tour.travel.versioned` are fully contracted.
- Confirmation, privacy minimization, feasibility uncertainty, finance authority, concurrency, persistence, RLS/grants, errors, recovery, SLOs, and tests are deterministic.
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
- Shards 01/11/14/32/34a identity, treasury, roster, production-call, and tour/version contracts.
