# Production Events, Bill and Rehearsal — Backend Specification

## Split Group

- IA source: ../ia/32-show-production-planning.md.
- Assigned interactions: 32.01 Create event from booking, 32.02 Manage bill projection and 32.16 Create rehearsal event.
- Owned aggregates: ProductionEvent and ProductionBill. Owned event: production.event.changed.
- Shard 30 owns booking/deal lifecycle and bill identity; Shard 29 owns room calendars/reservations. This companion creates production projections and never duplicates or mutates those canonical records.

## Referenced-Material Inventory

| Source | Exact source spans | Use in this companion |
|---|---|---|
| [IA Shard 32](../ia/32-show-production-planning.md) | Interactions lines 68–88; Contracts lines 89–107; Data Models lines 108–151; Access Control lines 152–177; Event Schemas and Edge Cases lines 187–217 | 32.01, 32.02, and 32.16 behavior, contracts, ownership, production event/bill models, event payload, and source-boundary failures |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, exact ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, recovery, and telemetry inheritance |

## Endpoint Completeness

| IA ID | Method | Path | Success |
|---|---|---|---|
| 32.01 | POST | /api/v1/internal/production/events | 201/200 ProductionEventV1 |
| 32.02 | PUT | /api/v1/production/events/{eventId}/bill | 200 ProductionBillV1 |
| 32.16 | POST | /api/v1/production/events/{eventId}/rehearsals | 201/200 ProductionEventV1 |

References: ../ia/32-show-production-planning.md and 00-infrastructure.md. Planned Shards 29/30 provide room/booking source contracts.

## Shared Contract Inheritance

- Failures use ApiError { code, message, requestId, details }; details may contain current version and mergeable slot IDs, never private deal, room access, act contact or sensitive rider data.
- Browser writes require allowlisted credentialled CORS, CSRF and show-production mandate. Internal causation requires service JWT, mTLS, registered booking producer and deny CORS.
- Mutations require Idempotency-Key. Bill updates require If-Match/current version; collision returns 409 BILL_SLOT_CONFLICT with safe base/current slot digests.

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 18.01 Event Record & Lifecycle States | 32.01 |
| 18.02 Bill & Support Act Management | 32.02 |
| 18.19 Rehearsal & Production Rehearsal Management | 32.16 |

## API Endpoints

### Authoritative Route Registry

| ID | Method | Path | Authorization | Concurrency/idempotency | Rate/cache/deadline | Middleware and CORS |
|---|---|---|---|---|---|---|
| 32.01 | POST | /api/v1/internal/production/events | registered accepted/confirmed booking consumer | event ID key; booking causation unique; source revision CAS | 600/min worker; no-store; 2s | BE00-CORS-DENY, service auth, producer allowlist, booking/deal/room validation |
| 32.02 | PUT | /api/v1/production/events/{eventId}/bill | show producer with production.bill.manage | key plus If-Match; stable slot IDs and three-way conflict | 60/hour event; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, event/act/slot policy |
| 32.16 | POST | /api/v1/production/events/{eventId}/rehearsals | production.event.manage and valid Shard29 room booking | key; parent/room booking/readiness scope unique; no room write | 20/hour event; no-store; 2s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, parent/room/readiness policy |

## Zod 4 Request and Response Contracts

| ID | Strict request | Success |
|---|---|---|
| 32.01 | ProductionEventCreate { sourceEventId, bookingId, bookingRevision, dealId, dateId, roomId, billId, lifecycleState confirmed/performed/cancelled, actRefs, counterpartyRefs, timezone } | ProductionEventV1 { eventId, causation, lifecycleProjection, date/room/bill/act refs, state planning/active/cancelled/completed, version } |
| 32.02 | ProductionBillPut { expectedVersion, slots array 1–200 with stable slotId/orderKey/start/end/type act/tba/off_platform, actRef nullable, label nullable, perActVisibility, sourceBillRevision } | ProductionBillV1 { billId, eventId, slots, sourceBillRevision, version, mergeBaseHash } |
| 32.16 | RehearsalCreate { roomBookingId, roomBookingRevision, startsAt, endsAt, timezone, readinessScope typed array, participantActRefs, desiredOutcomeCodes } | ProductionEventV1 { rehearsalEventId, parentEventId, subtype rehearsal, roomRef, readinessScope, outcomes empty, state planning, version } |

### Exact typed success schemas

The operation comments are normative route mappings. Successful bodies reject every undeclared field.

~~~ts
import { z } from "zod";
const Uuid = z.uuid();
const Version = z.int().positive();
const Instant = z.iso.datetime({ offset: true });
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const EventState = z.enum(["planning", "active", "cancelled", "completed"]);
const EventRefs = z.object({ dateId: Uuid, roomId: Uuid, billId: Uuid, actIds: z.array(Uuid).min(1).max(200) }).strict();
// 32.01
export const CreateProductionEventSuccess = z.object({
  eventId: Uuid,
  causation: z.object({ sourceEventId: Uuid, bookingId: Uuid, bookingRevision: Version, dealId: Uuid }).strict(),
  lifecycleProjection: z.object({ sourceState: z.enum(["confirmed", "performed", "cancelled"]), projectedAt: Instant }).strict(),
  refs: EventRefs, state: EventState, version: Version,
}).strict();
const BillSlot = z.object({
  slotId: Uuid, orderKey: z.string().min(1).max(64), startsAt: Instant, endsAt: Instant,
  type: z.enum(["act", "tba", "off_platform"]), actRef: Uuid.nullable(), label: z.string().max(160).nullable(),
  perActVisibility: z.enum(["all_participants", "own_act", "production_only"]),
}).strict();
// 32.02
export const ProductionBillV1 = z.object({
  billId: Uuid, eventId: Uuid, slots: z.array(BillSlot).min(1).max(200), sourceBillRevision: Version,
  version: Version, mergeBaseHash: Digest,
}).strict();
// 32.16
export const CreateRehearsalEventSuccess = z.object({
  rehearsalEventId: Uuid, parentEventId: Uuid, subtype: z.literal("rehearsal"), roomRef: Uuid,
  readinessScope: z.array(z.string().regex(/^[a-z0-9_]{1,64}$/)).min(1).max(100),
  outcomes: z.array(z.object({ code: z.string().regex(/^[a-z][a-z0-9_]{0,63}$/), achieved: z.boolean() }).strict()).length(0),
  state: z.literal("planning"), version: Version,
}).strict();
~~~

### Invariants

- 32.01 accepts only eligible Shard30 booking causation and returns the existing event on exact replay. Changed digest/source revision for the same booking event quarantines.
- Bill slots are ordered, non-overlapping within one stage/room track and within event bounds. TBA and off-platform placeholders have no internal act ownership and expose only approved label/visibility.
- Slot identities persist across reorder. Concurrent disjoint edits may return a merge patch; overlapping edits return conflict and write nothing.
- Rehearsal references an existing Shard29 room booking whose time/room/participants cover the rehearsal. It does not create calendar/reservation state.
- Source booking cancellation mirrors event cancelled and invalidates future production schedules; historical bill/rehearsal versions remain.

## Database Schema

| Model | Typed fields, constraints, indexes and relationships | RLS/grants |
|---|---|---|
| ProductionEvent | id uuid PK; causation_kind booking/rehearsal; source_booking_id/revision nullable; source_event_id; parent_event_id nullable; deal/date/room/bill refs; subtype show/rehearsal; lifecycle_projection; state; timezone; readiness_scope jsonb; desired_outcomes text array; version; created/updated_at | unique booking causation for show; unique parent/room booking/readiness checksum for rehearsal; FK parent; indexes date,state and parent/subtype. Production participants scoped read; event worker insert; source owners cannot mutate projection |
| ProductionBill | id uuid PK; event_id unique; source_bill_id/revision; version; slots_json validated; slot_order_checksum; merge_base_hash; updated_by/at | FK event; unique event/version history table plus current pointer; GIN slots; append immutable bill_version rows. Show producer writes, per-act view uses security-invoker projection |

RLS is enabled; no PUBLIC/anon/base authenticated grants. Stable SQL functions validate slot overlap/order/act visibility. History rows are append-only; correction appends. Rehearsal room/deal refs are typed external identifiers with source-revision manifests, not copied canonical rows.

### D4 SQL Type, Nullability, Relationship, and Index Closure

Every field is `NOT NULL` unless explicitly marked `NULL`; enums are closed `text CHECK` domains, UUIDs are non-nil, JSON values have declared shape checks, and local FKs use `ON DELETE RESTRICT`.

| Table | Exact SQL fields | Relationships and query-pattern indexes |
|---|---|---|
| `production_events` (ProductionEvent) | `id uuid PRIMARY KEY`; `causation_kind text CHECK (causation_kind IN ('booking','rehearsal'))`; `source_booking_id uuid NULL`; `source_booking_revision bigint NULL CHECK (source_booking_revision IS NULL OR source_booking_revision>0)`; `source_event_id uuid`; `parent_event_id uuid NULL`; `deal_ref uuid NULL`; `date_ref uuid`; `room_ref uuid NULL`; `bill_ref uuid NULL`; `subtype text CHECK (subtype IN ('show','rehearsal'))`; `lifecycle_projection text`; `state text`; `timezone text`; `readiness_scope jsonb CHECK (jsonb_typeof(readiness_scope)='object')`; `desired_outcomes text[] DEFAULT '{}'`; `version bigint CHECK (version>0)`; `created_at timestamptz`; `updated_at timestamptz`; booking ID/revision are both NULL or both present | Self-FK parent; booking/deal/date/room/bill are Shard29/30 refs. Partial unique booking causation; rehearsal uniqueness on parent/room/source checksum; `INDEX(date_ref,state)`; `INDEX(parent_event_id,subtype,state)`; `INDEX(source_event_id)`. |
| `production_bills` (ProductionBill) | `id uuid PRIMARY KEY`; `event_id uuid`; `source_bill_id uuid`; `source_bill_revision bigint CHECK (source_bill_revision>0)`; `version bigint CHECK (version>0)`; `slots_json jsonb CHECK (jsonb_typeof(slots_json)='array')`; `slot_order_checksum bytea CHECK (octet_length(slot_order_checksum)=32)`; `merge_base_hash bytea CHECK (octet_length(merge_base_hash)=32)`; `updated_by uuid`; `updated_at timestamptz` | FK `event_id -> production_events.id`; source bill/actor are owner refs. `UNIQUE(event_id,version)`; `UNIQUE(event_id,slot_order_checksum)`; `INDEX(event_id,version DESC)`; GIN `(slots_json jsonb_path_ops)`. |

Both tables FORCE RLS. Production participants receive scoped SELECT; event consumer/bill editor get bounded INSERT or version-transition EXECUTE; per-act views redact other acts. PUBLIC/anon/authenticated receive no base grants and history rows reject UPDATE/DELETE. Migration tests cover constraints, relationship validators, index plans, policies, and grants.

## State, Middleware and Recovery

- ProductionEvent: planning → active → completed/cancelled; rehearsal planning → active → completed/cancelled. Booking lifecycle may advance/stop projection but cannot be reversed here.
- Bill: version N → N+1; prior versions immutable.
- 32.01 inserts event/current projection plus production.event.changed outbox atomically.
- 32.02 locks event/bill, validates expected/base version and inserts immutable version/current pointer/outbox atomically.
- 32.16 validates room booking source and inserts rehearsal plus outbox atomically; source failure writes nothing.

Middleware order: request ID → CORS → auth/service → CSRF → strict body/headers → rate → event/show/producer RLS → idempotency/If-Match → source/slot/room policy → transaction → response validation → redacted audit. Logs omit deal terms, participant contacts and room access details.

## Events and Integrations

| Event/seam | Contract and delivery |
|---|---|
| production.event.changed | eventId/type/schemaVersion, production event/version, booking/lifecycle refs, state, occurredAt, producer, traceId; at-least-once, event-version dedupe |
| Shard30 booking/bill | source IDs/revisions → accepted causation/bill snapshot; 2s, 2 retries 100ms/500ms, circuit 5 failures/30s for 30s; fail closed |
| Shard29 room booking | room booking/revision → room/time/participants/state; 2,000 ms/attempt; 3 total attempts with full-jitter caps 100ms/500ms; retry timeout, connection reset, 408/429/5xx; terminal invalid room/revision/time, conflict, auth/schema, non-429 4xx; circuit opens after 5 retryable failures/30s for 30s, admits one half-open room probe, closes after two successes, and reopens on failure; fallback commits no duplicate reservation |

Queue retry uses 1s/5s/30s/2m/10m and cap 15m; poison after eight. Stale source versions no-op, equal-version changed digest quarantines and future schemas quarantine.

### Exact retryability and circuit closure

Attempt totals include the initial attempt; every delay is full jitter from zero through its stated cap. Half-open circuits admit one probe at a time, close after two consecutive successful probes, and reopen for the full interval after a retryable probe failure.

| Seam | Deadline and exact attempt schedule | Retryable versus terminal outcomes | Circuit open, half-open, and fallback |
|---|---|---|---|
| Shard30 booking/bill | 2,000 ms per attempt; 3 attempts total; retry caps 100 ms then 500 ms. | Retry timeout, connection reset, 408, 429, and 5xx. Invalid booking/bill revision, auth denial, lifecycle conflict, response-schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open booking probe. Fallback fails production-event creation/update closed and commits no guessed bill snapshot. |
| Shard29 room booking | 2,000 ms per attempt; 3 attempts total; retry caps 100 ms then 500 ms. | Retry timeout, connection reset, 408, 429, and 5xx. Invalid room/revision/time, reservation conflict, auth denial, schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 30 s; one half-open room probe. Fallback commits no duplicate reservation and returns dependency unavailable. |
| production.event.changed consumer | 30,000 ms handler deadline; 8 attempts total; retry caps 1 s, 5 s, 30 s, 2 min, 10 min, 15 min, and 15 min. | Retry transient dependency/DB availability, serialization/deadlock, handler timeout, and retryable 5xx. Invalid signature/schema/digest, unsupported version, auth denial, invariant failure, and equal-version changed digest are terminal and quarantined. | Open the consumer event-type partition after 20 retryable failures in 60 s for 60 s; one half-open event probe. Open retains the durable event; attempt 8 moves it to DLQ with alert and leaves the projection at its last verified version. |

## Error Handling

| ID | Status and ApiError codes |
|---|---|
| 32.01 | 400 CAUSATION_INVALID; 401 SERVICE_AUTH_REQUIRED; 409 SOURCE_EVENT_CONFLICT; 422 BOOKING_NOT_ELIGIBLE/ROOM_OR_BILL_MISSING; 503 BOOKING_SOURCE_UNAVAILABLE |
| 32.02 | 400 BILL_INVALID/SLOT_OVERLAP/ACT_REF_INVALID; 403 BILL_CAPABILITY_REQUIRED; 409 BILL_SLOT_CONFLICT; 412 REVISION_MISMATCH; 422 EVENT_NOT_EDITABLE |
| 32.16 | 400 REHEARSAL_INVALID; 403 EVENT_CAPABILITY_REQUIRED; 409 REHEARSAL_EXISTS; 422 ROOM_BOOKING_INVALID/TIME_OUT_OF_SCOPE; 503 ROOM_SOURCE_UNAVAILABLE |

Unknown failures map 500 INTERNAL_ERROR, dependency deadlines 503 DEPENDENCY_TIMEOUT and rate admission 429 RATE_LIMITED with Retry-After. Hidden events are 404.

## Verification and Test Strategy

| ID | Tests |
|---|---|
| 32.01 | exact replay/existing event, changed source conflict, eligible lifecycle, no duplicated deal/room/bill state |
| 32.02 | ordered/TBA/off-platform visibility, overlap rejection, version CAS, disjoint merge and conflicting slot edit |
| 32.16 | valid room booking/readiness link, duplicate causation, time/source change and no calendar mutation |

RLS/grant tests cover producer, each act, unrelated act, show producer and service. Transaction tests prove event/bill/outbox atomicity and immutable histories.

## Deepening Passes

- Micro: causation, placeholders, slot identity/order, visibility, lifecycle mirror and rehearsal scope are exact.
- Macro: Shards29/30 remain source owners; this companion owns production projections only.
- Devil's advocate: no implementation may duplicate bookings/rooms, assign TBA ownership, leak another act's bill detail or silently win a slot conflict.
- Two-implementer and ambiguity gates: PASS; no open decision.

## Per-Operation Observability and Synthetic Registry

Every authoritative operation has an independent telemetry/test row below. Logs are BE00-redacted and always include `requestId`, `traceId`, the exact `operationId`, tenant/actor role, opaque aggregate ID and version, idempotency replay class, outcome/code, latency, dependency attempt, and outbox/lease age when applicable. They never include request/response bodies, PII, secrets, evidence, money details, tokens, or provider payloads. Metrics use bounded labels only; alerts apply the route deadline/SLO and the recovery contract already specified.

| Operation | Required metrics and alert | Required keyed synthetic/acceptance test |
|---|---|---|
| 32.01 | `be_http_requests_total{operation_id="32.01",outcome,code}`, `be_http_latency_seconds{operation_id="32.01"}`, and `be_operation_recovery_total{operation_id="32.01",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 32.02 | `be_http_requests_total{operation_id="32.02",outcome,code}`, `be_http_latency_seconds{operation_id="32.02"}`, and `be_operation_recovery_total{operation_id="32.02",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 32.16 | `be_http_requests_total{operation_id="32.16",outcome,code}`, `be_http_latency_seconds{operation_id="32.16"}`, and `be_operation_recovery_total{operation_id="32.16",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |

Telemetry contract tests reject unbounded/dynamic labels and any forbidden field; synthetic tests assert the row's `operationId` appears in logs, spans, metrics, audit records, and failure alerts.

## Ambiguity Gate

**PASS.** Source inventory, authoritative operations, strict contracts, typed persistence, authorization, failures, idempotency, rate limits, observability, state/concurrency/recovery, external seams, and verification resolve every micro- and macro-level implementation choice. The two-implementer simulation yields the same behavior and the adversarial review leaves no surviving ambiguity.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial Shard 32a production backend specification |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [Backend infrastructure](00-infrastructure.md)
- [IA Shard 32](../ia/32-show-production-planning.md)
- Planned Shard 29 room and Shard 30 booking/bill source contracts.
