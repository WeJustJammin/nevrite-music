# Room Reservations, Series & Performance Handoff — Backend Specification

**Status:** Backend contract locked
**IA source:** `../ia/29-venues-spaces.md`
**Platform baseline:** `00-infrastructure.md` (BE00)

## Classification

- **Backend-bearing:** yes. Interactions 29.15–29.18, 29.20 and 29.22 freeze static pricing, authorize payment, atomically commit simple/compound room-hire reservations, govern mutations and attendance finality, create bounded recurring series, and hand performance use to Shard 30.
- **Boundary:** this companion owns `RateCardVersion`, `QuoteSnapshot`, `Reservation`, `CompoundReservation` and `RecurringSeries`. Shard 29c owns availability/holds; Shard 24 owns person/asset truth; payment owns authorization/capture/refund; Shard 30 exclusively owns performance negotiation/deals/contracts after accepted handoff.
- **Split validation:** the approved `29d` companion exactly captures room-hire commercial commitment and the performance seam. Static variants are allowed; request-time dynamic pricing is disabled. No calendar, room-spec or performance-deal lifecycle is duplicated.
- **BE00 inheritance:** HTTPS JSON, UUID request IDs, strict Zod 4/OpenAPI response validation, named CORS, authentication/acting context, CSRF, 30-day minimum hash-bound idempotency, common audit/outbox, rate headers, deadlines and `ApiError { code, message, requestId, details }`.

## Referenced Material Inventory

| Material | Sections / lines | Locked input used here |
|---|---:|---|
| IA Shard 29 | Overview/scope/architecture decisions, lines 7–38 | binding instant quote, estimate enquiry posture, static pricing, US launch/statutory and versioned configuration |
| IA Shard 29 | AC-29.15–AC-29.18, AC-29.20 and AC-29.22, lines 66–73 | all-or-release booking, compound identity, atomic mutation, provisional completion, bounded series and handoff |
| IA Shard 29 | Interactions 29.15–29.18, 29.20 and 29.22, lines 93–100 | triggers, preconditions, commits and explicit failures |
| IA Shard 29 | Commands/boundaries, lines 102–127 | `QuoteRoomHire`, `CommitRoomReservation`, `MutateReservation`; Shard 24/30/payment boundaries |
| IA Shard 29 | Models/states/invariants/fields, lines 129–193 | `RateCardVersion`, `QuoteSnapshot`, `Reservation`, `CompoundReservation`, `RecurringSeries`; freeze and lifecycle invariants |
| IA Shard 29 | Access control, lines 194–220 | requester, full operator, delegate, worker and privacy capabilities |
| IA Shard 29 | Event Schemas, lines 233–252 | `venue.quote.issued`, `venue.reservation.changed` |
| IA Shard 29 | Edge cases/surface matrix, lines 254–306 | payment/hold race, shared resources, reassignment, operator remedy, no-show and series conflicts |
| Architecture + Engineering Standards | API/data/security/testing sections | Hono Workers, Supabase PostgreSQL, Zod 4, deny-by-default, TDD and observability |
| BE00 | wire types, command archetype, CORS, idempotency, audit/outbox and recovery | platform contracts inherited rather than duplicated |

## IA Source Map

| IA interaction | Stable operation ID | Owned behavior | Canonical artifacts |
|---|---|---|---|
| 29.15 | `V29_15_INSTANT_BOOK` | compute a binding static quote, freeze policy/spec/accessibility/statutory inputs, authorize payment and commit or compensate | `QuoteRoomHire`, `CommitRoomReservation`, `RateCardVersion`, `QuoteSnapshot`, `Reservation`, `venue.quote.issued`, `venue.reservation.changed` |
| 29.16 | `V29_16_COMMIT_COMPOUND` | quote and reserve every room/person/asset member beneath one atomic root | `CommitRoomReservation`, `CompoundReservation`, `Reservation`, `venue.quote.issued`, `venue.reservation.changed` |
| 29.17 | `V29_17_MUTATE_RESERVATION` | cancel, reduce or reschedule one reservation using its frozen ladder and one allowed atomic move | `MutateReservation`, `Reservation`, `QuoteSnapshot`, `venue.reservation.changed` |
| 29.18 | `V29_18_FINALIZE_ATTENDANCE` | infer/start provisional completion or record timely no-show and gate evidence harvest separately from money disputes | `Reservation`, `venue.reservation.changed` |
| 29.20 | `V29_20_CREATE_SERIES` | validate and atomically materialize every bounded instance plus review horizon and exceptions | `RecurringSeries`, `Reservation`, `venue.reservation.changed` |
| 29.22 | `V29_22_HANDOFF_BILL_SLOT` | send immutable room/spec/availability snapshots to Shard 30 and reject room-hire commercial fields | Shard 30 handoff reference; no duplicate `Reservation` lifecycle |

## Endpoint Reconciliation and Shared Inheritance

The registry adds only the six assigned Shard 29 interactions. Rate-card authoring is a governed CMS/config publication into immutable `RateCardVersion` rows and is not a new unapproved public endpoint. Quote calculation is part of instant/compound commands; BE00 shared idempotency, payments, calendars/holds, resource allocations and Shard 30 routes are not duplicated.

Five browser commands use `BE00-CORS-WEB-CREDENTIALLED`, `no-store`, session-bound CSRF and BE00's **ordinary command** 15,000 ms deadline. `V29_18_FINALIZE_ATTENDANCE` is a machine command with `BE00-CORS-DENY` and the **async acceptance** 2,000 ms deadline. Idempotency survives saga terminality and at least 30 days; payment-related keys and results remain seven years.

## API Endpoints

### Authoritative Route Registry

This is the sole route registry for this companion; its operation IDs key every contract, authorization, middleware, flow, error, observability and test row.

| Operation ID | Method and path | IA | Success | Idempotency | Rate limit |
|---|---|---|---|---|---|
| `V29_15_INSTANT_BOOK` | `POST /api/v1/venues/instant-bookings` | 29.15 | `201 InstantBookResult` | required through payment/reservation terminal + 7 years | 10/min/account + holder + room |
| `V29_16_COMMIT_COMPOUND` | `POST /api/v1/venues/compound-reservations` | 29.16 | `201 CompoundReservationResult` | required through compensation terminal + 7 years | 5/min/account + holder; max 50 members |
| `V29_17_MUTATE_RESERVATION` | `POST /api/v1/venues/reservation-mutations` | 29.17 | `200 MutateReservationResult` | required through money instruction terminal + 7 years | 20/min/account + holder/reservation |
| `V29_18_FINALIZE_ATTENDANCE` | `POST /api/v1/internal/venues/reservation-attendance-outcomes` | 29.18 | `202 AttendanceOutcomeResult` | source event/version; reservation lifetime + 7 years | 300/min/worker; burst 50 |
| `V29_20_CREATE_SERIES` | `POST /api/v1/venues/recurring-series` | 29.20 | `201 RecurringSeriesResult` | required through series terminal + 7 years | 3/min/account + holder; 10/day |
| `V29_22_HANDOFF_BILL_SLOT` | `POST /api/v1/venues/performance-slot-handoffs` | 29.22 | `202 PerformanceSlotHandoffResult` | required through Shard 30 receipt + 7 years | 10/min/account + operator + room |

### Operation Contract Matrix

| Operation ID | Exact request | Exact success | Error contract | Authorization |
|---|---|---|---|---|
| `V29_15_INSTANT_BOOK` | `InstantBookRoomHire` containing `QuoteRoomHire` inputs and commit acceptance | `InstantBookResult` | BE00 `ApiError { code, message, requestId, details }` | eligible holder; room must have full claim, payout readiness and instant posture |
| `V29_16_COMMIT_COMPOUND` | `CommitCompoundReservation`; server derives one `CommitRoomReservation` per member | `CompoundReservationResult` | BE00 `ApiError { code, message, requestId, details }` | eligible holder; every room/resource and payment scope authorized |
| `V29_17_MUTATE_RESERVATION` | `MutateReservation` | `MutateReservationResult` | BE00 `ApiError { code, message, requestId, details }` | holder for client actions; operator/delegate for operator actions |
| `V29_18_FINALIZE_ATTENDANCE` | `RecordAttendanceOutcome` | `AttendanceOutcomeResult` | BE00 `ApiError { code, message, requestId, details }` | registered scheduler/check-in worker or scoped operator attestation |
| `V29_20_CREATE_SERIES` | `CreateRecurringSeries` | `RecurringSeriesResult` | BE00 `ApiError { code, message, requestId, details }` | eligible holder; every generated instance passes room/resource policy |
| `V29_22_HANDOFF_BILL_SLOT` | `PerformanceBillSlotHandoff` | `PerformanceSlotHandoffResult` | BE00 `ApiError { code, message, requestId, details }` | full operator or `handoff_performance_slot` delegate |

## Zod 4 Contracts

```ts
import { z } from "zod";
const UUID=z.uuid(); const Instant=z.iso.datetime({offset:true}); const Version=z.string().regex(/^[1-9][0-9]{0,18}$/); const RequestId=z.uuid();
const Minor=z.string().regex(/^(0|[1-9][0-9]{0,17})$/); const Currency=z.string().regex(/^[A-Z]{3}$/);
const ErrorCode=z.string().min(1).max(64).regex(/^[A-Z][A-Z0-9_]*$/);
type JsonValue=null|boolean|number|string|JsonValue[]|{[key:string]:JsonValue};
const JsonPrimitive=z.union([z.string(),z.number().finite(),z.boolean(),z.null()]);
const JsonValueSchema:z.ZodType<JsonValue>=z.lazy(()=>z.union([JsonPrimitive,z.array(JsonValueSchema),z.record(z.string(),JsonValueSchema)]));
const depth=(v:JsonValue):number=>v===null||typeof v!=="object"?0:Array.isArray(v)?1+Math.max(0,...v.map(depth)):1+Math.max(0,...Object.values(v).map(depth));
const ErrorDetails=z.record(z.string(),JsonValueSchema).superRefine((v,c)=>{if(Object.keys(v).length>16)c.addIssue({code:"custom",message:"details_key_limit"});if(depth(v)>4)c.addIssue({code:"custom",message:"details_depth_limit"});if(new TextEncoder().encode(JSON.stringify(v)).length>8192)c.addIssue({code:"custom",message:"details_size_limit"});});
export const ApiError=z.object({code:ErrorCode,message:z.string().min(1).max(500),requestId:RequestId,details:ErrorDetails}).strict();
export const ReservationError=z.enum(["RATE_UNAVAILABLE","MANDATORY_EXTRA_MISSING","QUOTE_POLICY_UNAVAILABLE","HOLD_EXPIRED","QUOTE_EXPIRED","PAYMENT_NOT_AUTHORIZED","AUTHORITY_LOST","RESOURCE_UNAVAILABLE","COMPOUND_MEMBER_FAILED","POLICY_BLOCKED","MINIMUM_BLOCK","STALE_VERSION","ALREADY_FINAL","PROVISIONAL_WINDOW_OPEN","NO_SHOW_WINDOW_CLOSED","SERIES_CONFLICT","REVIEW_HORIZON_INVALID","ROOM_HIRE_FIELDS_FORBIDDEN","SNAPSHOT_MISSING","HANDOFF_REJECTED","COMPENSATION_PENDING","IDEMPOTENCY_CONFLICT"]);

export const UseType=z.enum(["recording","rehearsal","room_hire","education","broadcast","private_event","performance"]);
export const ZonedInterval=z.object({startsAt:Instant,endsAt:Instant,timeZone:z.string().min(3).max(64),utcOffsetMinutes:z.int().min(-840).max(840)}).strict().superRefine((v,c)=>{if(Date.parse(v.endsAt)<=Date.parse(v.startsAt))c.addIssue({code:"custom",path:["endsAt"],message:"end_must_follow_start"});});
const ExtraSelection=z.object({extraKey:z.string().min(1).max(64),quantity:z.int().min(1).max(1000)}).strict();
export const QuoteRoomHire=z.object({actingPartyId:UUID,holderPartyId:UUID,roomId:UUID,useType:UseType.exclude(["performance"]),slot:ZonedInterval,configurationKey:z.string().min(1).max(64),staticVariantKey:z.string().min(1).max(64),extras:z.array(ExtraSelection).max(50),quoteKey:z.string().min(8).max(128)}).strict();
const QuoteLine=z.object({lineKey:z.string().min(1).max(64),kind:z.enum(["base","duration","extra","discount","tax"]),description:z.string().min(1).max(180),quantity:z.int().positive(),unitAmountMinor:Minor,lineAmountMinor:Minor,allocationRef:UUID.nullable()}).strict();
export const QuoteSnapshotResult=z.object({quoteSnapshotId:UUID,rateCardVersionId:UUID,bindingPosture:z.literal("binding"),lines:z.array(QuoteLine).min(1).max(100),subtotalMinor:Minor,taxMinor:Minor,totalMinor:Minor,currency:Currency,policySnapshotId:UUID,expiresAt:Instant,computationHash:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
const PolicyAcceptance=z.object({policySnapshotId:UUID,acceptedAt:Instant,acceptanceDigest:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export const CommitRoomReservation=z.object({actingPartyId:UUID,holderPartyId:UUID,holdId:UUID,quoteSnapshotId:UUID,paymentAuthorizationId:z.string().min(8).max(256),policyAcceptance:PolicyAcceptance,expectedHoldVersion:Version,clientMutationId:z.string().min(8).max(128)}).strict();
export const InstantBookRoomHire=z.object({quote:QuoteRoomHire,holdId:UUID,expectedHoldVersion:Version,paymentMethodRef:z.string().min(8).max(256),policyAcceptance:PolicyAcceptance,clientMutationId:z.string().min(8).max(128)}).strict();
export const InstantBookResult=z.object({quote:QuoteSnapshotResult,reservationId:UUID,state:z.literal("confirmed"),paymentState:z.literal("authorized"),holdState:z.literal("converted"),version:Version,replayed:z.boolean(),requestId:RequestId}).strict();

const CompoundMember=z.object({memberKey:z.string().min(1).max(64),holdId:UUID,expectedHoldVersion:Version,quote:QuoteRoomHire,resourceRefs:z.array(z.object({kind:z.enum(["room","person","asset"]),resourceId:UUID,quantity:z.number().positive().max(100000).nullable()}).strict()).min(1).max(100),policyAcceptance:PolicyAcceptance}).strict();
export const CommitCompoundReservation=z.object({actingPartyId:UUID,holderPartyId:UUID,members:z.array(CompoundMember).min(2).max(50),paymentMethodRef:z.string().min(8).max(256),clientMutationId:z.string().min(8).max(128)}).strict();
export const CompoundReservationResult=z.object({compoundReservationId:UUID,state:z.literal("confirmed"),memberReservationIds:z.array(UUID).min(2).max(50),quoteSnapshotIds:z.array(UUID).min(2).max(50),totalMinor:Minor,currency:Currency,paymentState:z.literal("authorized"),compensationState:z.literal("not_required"),failedMemberKey:z.null(),version:Version,replayed:z.boolean(),requestId:RequestId}).strict();

const MoneyInstruction=z.object({kind:z.enum(["none","capture","additional_charge","refund","void"]),amountMinor:Minor,currency:Currency,paymentOperationId:UUID.nullable(),state:z.enum(["not_required","pending","complete","failed"])}).strict();
const CancelMutation=z.object({operation:z.enum(["cancel_client","cancel_operator"]),effectiveAt:Instant,reasonCode:z.string().min(1).max(64)}).strict();
const ReduceMutation=z.object({operation:z.literal("reduce"),newSlot:ZonedInterval,releasedResourceRefs:z.array(UUID).max(100)}).strict();
const RescheduleMutation=z.object({operation:z.literal("reschedule"),newHoldId:UUID,newSlot:ZonedInterval,newQuoteSnapshotId:UUID}).strict();
export const MutateReservation=z.object({actingPartyId:UUID,reservationId:UUID,expectedVersion:Version,mutation:z.discriminatedUnion("operation",[CancelMutation,ReduceMutation,RescheduleMutation]),acceptedPolicySnapshotId:UUID,clientMutationId:z.string().min(8).max(128)}).strict();
export const MutateReservationResult=z.object({reservationId:UUID,oldState:z.string().min(1).max(32),newState:z.enum(["confirmed","cancelled_client","cancelled_operator"]),oldSlot:ZonedInterval,newSlot:ZonedInterval.nullable(),releasedDeltaMinor:Minor,moneyInstruction:MoneyInstruction,version:Version,replayed:z.boolean(),requestId:RequestId}).strict();

export const RecordAttendanceOutcome=z.object({sourceEventId:UUID,sourceVersion:Version,reservationId:UUID,outcome:z.enum(["started","completed","no_show"]),observedAt:Instant,source:z.enum(["scheduler","operator_attestation","check_in"]),evidenceRef:UUID.nullable(),provisionalWindowVersion:Version,expectedReservationVersion:Version}).strict();
export const AttendanceOutcomeResult=z.object({reservationId:UUID,oldState:z.string().min(1).max(32),newState:z.enum(["in_progress","completed_provisional","completed","no_show"]),provisionalUntil:Instant.nullable(),harvestEligibility:z.enum(["ineligible","provisional","eligible","voided"]),moneyDisputeState:z.enum(["unchanged","separate_case"]),version:Version,duplicate:z.boolean(),requestId:RequestId}).strict();

const RecurrenceRule=z.object({frequency:z.literal("weekly"),intervalWeeks:z.int().min(1).max(12),weekdays:z.array(z.int().min(1).max(7)).min(1).max(7),localStartTime:z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/),durationMinutes:z.int().min(30).max(1440),timeZone:z.string().min(3).max(64),startsOn:z.iso.date(),count:z.int().min(2).max(52)}).strict();
export const CreateRecurringSeries=z.object({actingPartyId:UUID,holderPartyId:UUID,roomId:UUID,useType:UseType.exclude(["performance"]),rule:RecurrenceRule,reviewDate:z.iso.date(),exceptionDates:z.array(z.iso.date()).max(52),staticVariantKey:z.string().min(1).max(64),paymentMethodRef:z.string().min(8).max(256),policySnapshotId:UUID,expectedCalendarVersion:Version,clientMutationId:z.string().min(8).max(128)}).strict();
export const RecurringSeriesResult=z.object({seriesId:UUID,state:z.enum(["active","review_due"]),instanceReservationIds:z.array(UUID).min(2).max(52),skippedDates:z.array(z.iso.date()).max(52),reviewDate:z.iso.date(),nextReviewAt:Instant,version:Version,replayed:z.boolean(),requestId:RequestId}).strict();

export const PerformanceBillSlotHandoff=z.object({actingPartyId:UUID,roomId:UUID,useType:z.literal("performance"),slot:ZonedInterval,roomSnapshotId:UUID,specSnapshotId:UUID,accessibilitySnapshotId:UUID,statutorySnapshotId:UUID,availabilitySnapshotId:UUID,operatorPartyId:UUID,promoterPartyId:UUID.nullable(),resourceRefs:z.array(UUID).max(100),expectedRoomVersion:Version,clientMutationId:z.string().min(8).max(128)}).strict();
export const PerformanceSlotHandoffResult=z.object({handoffRef:UUID,state:z.enum(["queued","accepted"]),bookingAggregateRef:UUID.nullable(),roomSnapshotId:UUID,availabilitySnapshotId:UUID,ownership:z.literal("shard_30"),replayed:z.boolean(),requestId:RequestId}).strict();
```

`PerformanceBillSlotHandoff.strict()` rejects rate-card, quote, payment, cancellation-policy or room-hire reservation fields with `ROOM_HIRE_FIELDS_FORBIDDEN`. The handler validates supplied offsets against the IANA zone and uses half-open UTC intervals. JSON money is decimal minor-unit strings; PostgreSQL stores signed-safe `bigint`. Static variant/rate inputs are selected before quote creation and frozen; neither demand nor requester identity may alter price.

`CommitRoomReservation` is the exact internal command constructed after `QuoteRoomHire` persists a snapshot. For instant book its values are derived from the composite request plus generated quote ID/payment authorization. Compound commit constructs one command per member beneath one root and never exposes a partially confirmed success.

## Authorization and Disclosure

| Operation ID | Allowed principal | Ownership/capability checks | 403 versus 404 / disclosure |
|---|---|---|---|
| `V29_15_INSTANT_BOOK` | authenticated eligible requester/holder | acting context equals holder or valid mandate; room full claim, instant posture, payout/rate/calendar/hold/quote/policy current | hidden room/hold is 404; visible but ineligible holder or room posture is 403; response never reveals schedule competitors, payout account or private rate allocation |
| `V29_16_COMMIT_COMPOUND` | authenticated eligible requester/holder | same holder for all members; every room/resource visible and authorized; one payment scope and current hold vector | any hidden member collapses entire result to 404; known unauthorized member is 403 with opaque member key; no partial identities leak |
| `V29_17_MUTATE_RESERVATION` | holder for client cancel/reduce/reschedule; full operator/delegate for operator cancel | current owner/mandate, action class, frozen policy, expected version and replacement hold/quote | foreign reservation is 404; owner/known operator lacking action capability is 403; counterparty/private payment details omitted |
| `V29_18_FINALIZE_ATTENDANCE` | registered scheduler/check-in worker or scoped operator attestation | source grant, room scope, event monotonicity, evidence permission and provisional policy version | unknown/foreign reservation is generic 404; known worker outside scope is 403; holder identity/evidence content not returned |
| `V29_20_CREATE_SERIES` | authenticated eligible requester/holder | holder/context, room/posture, calendar/rate/policy and payment readiness for every materialized instance | hidden room is 404; visible room/requester failing policy is 403; conflicting result names only own instance date/member |
| `V29_22_HANDOFF_BILL_SLOT` | full operator or scoped performance-handoff delegate | declared performance use, room authority and immutable snapshot versions; no room-hire commercial fields | hidden room 404; visible scope without handoff capability 403; Shard 30 counterparty terms never returned |

Public projections expose rate posture only when the immutable rate-card visibility permits; exact client identity, occupancy, payment/payout refs, private discounts, cancellation evidence and compound resources never appear. Support can retry mechanical compensation/delivery under an expiring purpose grant but cannot create, accept, mutate or finalize commercial state.

## Database Schema

All canonical tables live in `venue_private`; public rate/availability views are independently shaped. Core fields are explicit on every model. External party/payment/policy/spec/resource identifiers are versioned logical references and are revalidated at commit.

```sql
CREATE TABLE venue_private.rate_card_version (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('draft','active','superseded','retired')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 room_id uuid NOT NULL REFERENCES venue_private.room(id) ON DELETE RESTRICT, use_type text NOT NULL CHECK(use_type IN ('recording','rehearsal','room_hire','education','broadcast','private_event')), duration_basis text NOT NULL CHECK(duration_basis IN ('hour','fixed_block','day')),
 minimum_minutes integer NOT NULL CHECK(minimum_minutes BETWEEN 30 AND 1440), billing_increment_minutes integer NOT NULL CHECK(billing_increment_minutes BETWEEN 1 AND 1440), static_variant_key text NOT NULL CHECK(length(static_variant_key) BETWEEN 1 AND 64),
 base_amount_minor bigint NOT NULL CHECK(base_amount_minor>=0), currency char(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'), extras jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(extras)='array' AND jsonb_array_length(extras)<=100),
 visibility text NOT NULL CHECK(visibility IN ('public','authenticated','private_quote')), effective_range tstzrange NOT NULL CHECK(NOT isempty(effective_range) AND lower_inc(effective_range) AND NOT upper_inc(effective_range)),
 tax_context jsonb NOT NULL CHECK(jsonb_typeof(tax_context)='object'), policy_snapshot_id uuid NOT NULL, config_version bigint NOT NULL CHECK(config_version>0), published_at timestamptz NULL, supersedes_id uuid NULL REFERENCES venue_private.rate_card_version(id) ON DELETE RESTRICT,
 CHECK((state='draft')=(published_at IS NULL)), UNIQUE(room_id,use_type,static_variant_key,version)
);
CREATE INDEX rate_card_room_use_idx ON venue_private.rate_card_version(room_id,use_type,state,version DESC);
CREATE INDEX rate_card_owner_state_idx ON venue_private.rate_card_version(owner_id,state,updated_at DESC);
CREATE INDEX rate_card_effective_gist_idx ON venue_private.rate_card_version USING gist(effective_range) WHERE state='active';
CREATE INDEX rate_card_policy_idx ON venue_private.rate_card_version(policy_snapshot_id,config_version);
```

Rate rows are append-only after publication; activation serializes overlapping `(room,use,variant,effective_range)` and rejects ambiguity.

```sql
CREATE TABLE venue_private.quote_snapshot (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('binding','estimate','expired','consumed','void')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 holder_party_id uuid NOT NULL, room_id uuid NOT NULL REFERENCES venue_private.room(id) ON DELETE RESTRICT, rate_card_version_id uuid NOT NULL REFERENCES venue_private.rate_card_version(id) ON DELETE RESTRICT, hold_id uuid NULL REFERENCES venue_private.resource_hold(id) ON DELETE RESTRICT,
 use_type text NOT NULL CHECK(use_type IN ('recording','rehearsal','room_hire','education','broadcast','private_event')), slot tstzrange NOT NULL CHECK(NOT isempty(slot) AND lower_inc(slot) AND NOT upper_inc(slot)), configuration_key text NOT NULL CHECK(length(configuration_key) BETWEEN 1 AND 64),
 static_variant_key text NOT NULL CHECK(length(static_variant_key) BETWEEN 1 AND 64), selected_extras jsonb NOT NULL CHECK(jsonb_typeof(selected_extras)='array' AND jsonb_array_length(selected_extras)<=50), line_allocation jsonb NOT NULL CHECK(jsonb_typeof(line_allocation)='array' AND jsonb_array_length(line_allocation) BETWEEN 1 AND 100),
 subtotal_minor bigint NOT NULL CHECK(subtotal_minor>=0), tax_minor bigint NOT NULL CHECK(tax_minor>=0), total_minor bigint NOT NULL CHECK(total_minor=subtotal_minor+tax_minor), currency char(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 binding_posture text NOT NULL CHECK(binding_posture IN ('binding','estimate')), expires_at timestamptz NOT NULL, policy_snapshot_id uuid NOT NULL, spec_snapshot_id uuid NOT NULL, accessibility_snapshot_id uuid NOT NULL, statutory_snapshot_id uuid NOT NULL,
 computation_hash text NOT NULL CHECK(computation_hash ~ '^[a-f0-9]{64}$'), quote_key_hash text NOT NULL CHECK(quote_key_hash ~ '^[a-f0-9]{64}$'), consumed_reservation_id uuid NULL, CHECK(owner_id=holder_party_id), CHECK(expires_at>created_at), CHECK((binding_posture='binding')=(hold_id IS NOT NULL)), CHECK((state='binding' AND binding_posture='binding') OR (state='estimate' AND binding_posture='estimate') OR state IN ('expired','consumed','void'))
);
CREATE UNIQUE INDEX quote_snapshot_key_uq ON venue_private.quote_snapshot(holder_party_id,quote_key_hash);
CREATE INDEX quote_holder_state_idx ON venue_private.quote_snapshot(holder_party_id,state,created_at DESC);
CREATE INDEX quote_room_slot_idx ON venue_private.quote_snapshot(room_id,lower(slot),upper(slot));
CREATE INDEX quote_expiry_idx ON venue_private.quote_snapshot(expires_at,id) WHERE state IN ('binding','estimate');
CREATE INDEX quote_rate_idx ON venue_private.quote_snapshot(rate_card_version_id,created_at DESC);
```

```sql
CREATE TABLE venue_private.compound_reservation (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('pending_authorization','confirmed','failed','cancelled','completed')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 holder_party_id uuid NOT NULL, member_keys text[] NOT NULL CHECK(cardinality(member_keys) BETWEEN 2 AND 50), member_reservation_ids uuid[] NOT NULL DEFAULT '{}', resource_refs jsonb NOT NULL CHECK(jsonb_typeof(resource_refs)='array' AND jsonb_array_length(resource_refs) BETWEEN 2 AND 500),
 quote_snapshot_ids uuid[] NOT NULL CHECK(cardinality(quote_snapshot_ids) BETWEEN 2 AND 50), total_minor bigint NOT NULL CHECK(total_minor>=0), currency char(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'), payment_authorization_ref text NOT NULL CHECK(length(payment_authorization_ref) BETWEEN 8 AND 256),
 payment_state text NOT NULL CHECK(payment_state IN ('pending','authorized','captured','voided','refunded','failed')), compensation_state text NOT NULL CHECK(compensation_state IN ('not_required','pending','complete','failed')), failed_member_key text NULL CHECK(failed_member_key IS NULL OR length(failed_member_key) BETWEEN 1 AND 64),
 idempotency_key_hash text NOT NULL CHECK(idempotency_key_hash ~ '^[a-f0-9]{64}$'), terminal_at timestamptz NULL, CHECK(owner_id=holder_party_id), CHECK((state='confirmed')=(cardinality(member_reservation_ids)=cardinality(member_keys))), CHECK(state<>'failed' OR failed_member_key IS NOT NULL)
);
CREATE UNIQUE INDEX compound_idempotency_uq ON venue_private.compound_reservation(holder_party_id,idempotency_key_hash);
CREATE INDEX compound_holder_state_idx ON venue_private.compound_reservation(holder_party_id,state,updated_at DESC);
CREATE INDEX compound_payment_idx ON venue_private.compound_reservation(payment_authorization_ref,payment_state);
CREATE INDEX compound_member_gin_idx ON venue_private.compound_reservation USING gin(member_reservation_ids);
CREATE INDEX compound_compensation_idx ON venue_private.compound_reservation(compensation_state,updated_at) WHERE compensation_state IN ('pending','failed');
```

```sql
CREATE TABLE venue_private.recurring_series (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('draft','active','review_due','completed','cancelled')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 holder_party_id uuid NOT NULL, room_id uuid NOT NULL REFERENCES venue_private.room(id) ON DELETE RESTRICT, use_type text NOT NULL CHECK(use_type IN ('recording','rehearsal','room_hire','education','broadcast','private_event')),
 recurrence_rule jsonb NOT NULL CHECK(jsonb_typeof(recurrence_rule)='object'), timezone text NOT NULL CHECK(length(timezone) BETWEEN 3 AND 64), starts_on date NOT NULL, review_date date NOT NULL, next_review_at timestamptz NOT NULL,
 generated_instance_ids uuid[] NOT NULL CHECK(cardinality(generated_instance_ids) BETWEEN 2 AND 52), exception_dates date[] NOT NULL DEFAULT '{}', explicit_moves jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(explicit_moves)='array' AND jsonb_array_length(explicit_moves)<=52),
 static_variant_key text NOT NULL CHECK(length(static_variant_key) BETWEEN 1 AND 64), policy_snapshot_id uuid NOT NULL, schedule_version bigint NOT NULL CHECK(schedule_version>0), idempotency_key_hash text NOT NULL CHECK(idempotency_key_hash ~ '^[a-f0-9]{64}$'), terminal_at timestamptz NULL,
 CHECK(owner_id=holder_party_id), CHECK(review_date>=starts_on), CHECK(cardinality(exception_dates)<=52)
);
CREATE UNIQUE INDEX recurring_series_idempotency_uq ON venue_private.recurring_series(holder_party_id,idempotency_key_hash);
CREATE INDEX recurring_series_room_review_idx ON venue_private.recurring_series(room_id,state,next_review_at);
CREATE INDEX recurring_series_holder_idx ON venue_private.recurring_series(holder_party_id,state,updated_at DESC);
CREATE INDEX recurring_series_instances_gin_idx ON venue_private.recurring_series USING gin(generated_instance_ids);
```

```sql
CREATE TABLE venue_private.reservation (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL, state text NOT NULL CHECK(state IN ('pending_authorization','confirmed','in_progress','completed_provisional','completed','cancelled_client','cancelled_operator','no_show','failed')), version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 holder_party_id uuid NOT NULL, room_id uuid NOT NULL REFERENCES venue_private.room(id) ON DELETE RESTRICT, use_type text NOT NULL CHECK(use_type IN ('recording','rehearsal','room_hire','education','broadcast','private_event')), slot tstzrange NOT NULL CHECK(NOT isempty(slot) AND lower_inc(slot) AND NOT upper_inc(slot)),
 hold_id uuid NOT NULL REFERENCES venue_private.resource_hold(id) ON DELETE RESTRICT, quote_snapshot_id uuid NOT NULL REFERENCES venue_private.quote_snapshot(id) ON DELETE RESTRICT, policy_snapshot_id uuid NOT NULL, spec_snapshot_id uuid NOT NULL, accessibility_snapshot_id uuid NOT NULL, statutory_snapshot_id uuid NOT NULL,
 resource_graph_version bigint NOT NULL CHECK(resource_graph_version>0), payment_authorization_ref text NOT NULL CHECK(length(payment_authorization_ref) BETWEEN 8 AND 256), payment_state text NOT NULL CHECK(payment_state IN ('pending','authorized','captured','voided','refunded','failed')),
 cancellation_ladder_version bigint NOT NULL CHECK(cancellation_ladder_version>0), compound_reservation_id uuid NULL REFERENCES venue_private.compound_reservation(id) ON DELETE RESTRICT, recurring_series_id uuid NULL REFERENCES venue_private.recurring_series(id) ON DELETE RESTRICT,
 idempotency_lineage_hash text NOT NULL CHECK(idempotency_lineage_hash ~ '^[a-f0-9]{64}$'), started_at timestamptz NULL, ended_at timestamptz NULL, provisional_until timestamptz NULL, harvest_eligibility text NOT NULL CHECK(harvest_eligibility IN ('ineligible','provisional','eligible','voided')),
 money_dispute_ref uuid NULL, terminal_at timestamptz NULL, CHECK(owner_id=holder_party_id), CHECK((state='completed_provisional')=(provisional_until IS NOT NULL)), CHECK(state<>'no_show' OR harvest_eligibility='voided')
);
CREATE UNIQUE INDEX reservation_idempotency_uq ON venue_private.reservation(holder_party_id,idempotency_lineage_hash);
CREATE INDEX reservation_room_slot_gist_idx ON venue_private.reservation USING gist(room_id,slot) WHERE state IN ('pending_authorization','confirmed','in_progress');
CREATE INDEX reservation_holder_state_idx ON venue_private.reservation(holder_party_id,state,updated_at DESC);
CREATE INDEX reservation_payment_idx ON venue_private.reservation(payment_authorization_ref,payment_state);
CREATE INDEX reservation_compound_idx ON venue_private.reservation(compound_reservation_id,id) WHERE compound_reservation_id IS NOT NULL;
CREATE INDEX reservation_series_idx ON venue_private.reservation(recurring_series_id,lower(slot)) WHERE recurring_series_id IS NOT NULL;
CREATE INDEX reservation_provisional_idx ON venue_private.reservation(provisional_until,id) WHERE state='completed_provisional';
```

### References, RLS, Grants, and Retention

| Table/model | FK/logical reference enforcement | RLS and grants | Retention/deletion |
|---|---|---|---|
| `RateCardVersion` → `venue_private.rate_card_version` | physical room/self FKs; owner/party, policy/config/tax refs logical to Shards 01/config; activation trigger prevents overlapping active variant windows | full operator/`manage_rates` delegate via publication RPC; public/authenticated/private shaped view by visibility; quote worker SELECT; no browser table DML | published versions immutable and retained while any quote/reservation plus statutory 7 years; drafts erase after 1 year |
| `QuoteSnapshot` → `venue_private.quote_snapshot` | physical room/rate/hold FKs; policy/spec/accessibility/statutory refs validated at quote; consumed reservation is deferred logical ref | owner safe SELECT; quote/booking workers INSERT/transition; operator sees authorized allocation, never holder payment; no public binding quote rows | immutable for reservation/statutory 7 years; unconsumed expired quote private inputs erased after 1 year |
| `CompoundReservation` → `venue_private.compound_reservation` | holder/payment logical refs; member and quote arrays checked by deferrable trigger against same holder/root; resource refs validated to Shards 29a/24 | holder-shaped SELECT; booking/compensation workers transitions; operator scoped summary only; no direct browser DML | commercial/audit record 7 years after terminal; private resource/client detail erased when lawful without deleting totals |
| `RecurringSeries` → `venue_private.recurring_series` | physical room FK; holder/policy/payment logical refs; generated IDs deferrably resolve to reservations with same series | holder action/read RPC; operator availability summary only; series worker materialize/review; no public row grant | terminal series and instance linkage 7 years; reminder/exception metadata erased under consent schedule |
| `Reservation` → `venue_private.reservation` | physical room/hold/quote/compound/series FKs; holder/payment/policy/spec/accessibility/statutory/resource/dispute refs version-validated at commit | holder safe lifecycle SELECT/action; scoped operator/delegate action; attendance/payment/harvest workers named columns; public none | money/policy/snapshot lineage 7 years after terminal or longer legal hold; evidence/contact/private resource data minimized/erased separately |

Every table has `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`. Definer RPCs pin `search_path`, keep `row_security=on`, assert BE00 acting party/mandate/purpose/version and revoke `PUBLIC`. Migration role owns. Rate publication and system workers receive only named grants. No `anon` or generic `authenticated` role can inspect client identity, exact occupancy, payment/payout references, private pricing, compound composition or cancellation/no-show evidence.

## State, Middleware, Concurrency, and Flow

| Aggregate/process | Legal state machine and guard |
|---|---|
| Rate card version | `draft → active → superseded|retired`; published rows are immutable; activation never overlaps the same room/use/static variant interval |
| Quote snapshot | `binding|estimate → consumed|expired|void`; only binding, unexpired quotes may commit room hire; frozen computation and line allocation never mutate |
| Reservation | `pending_authorization → confirmed → in_progress → completed_provisional → completed`; alternate terminals `cancelled_client|cancelled_operator|no_show|failed`; terminal rows never reopen |
| Compound reservation | `pending_authorization → confirmed → completed`; failure path `pending_authorization → failed`, compensation `not_required|pending → complete|failed`; every member shares one terminal commercial outcome |
| Recurring series | `draft → active → review_due → active|completed`; `active|review_due → cancelled`; instance exceptions do not rewrite the bounded rule or silently add dates |
| Performance handoff | durable delivery `queued → accepted|rejected`; acceptance transfers lifecycle ownership to Shard 30 and never creates a Shard 29 room-hire `Reservation` |

Reservation state and payment state are separate. A payment dispute may create a logical dispute reference without rewriting attendance or source history. `completed_provisional` is harvest-ineligible until its versioned window elapses; timely `no_show` changes harvest to `voided`, while money recovery follows its own policy/case.

### Per-operation Middleware

| Operation ID | Ordered middleware including CORS | Validation, idempotency, rate and deadline |
|---|---|---|
| `V29_15_INSTANT_BOOK` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → session auth/acting context → strict composite Zod → holder/room posture → idempotency → rate → quote/payment/commit saga → success/`ApiError` validation | required actor/method/path/body hash through terminal+7 years; 10/min/account+holder+room; 15,000 ms ordinary-command deadline |
| `V29_16_COMMIT_COMPOUND` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → session auth/context → strict members/uniqueness → all-member authorization → idempotency → rate → sorted resource/payment saga → success/`ApiError` validation | root key binds ordered canonical member hash through compensation+7 years; 5/min/account+holder, 50 members; 15,000 ms deadline |
| `V29_17_MUTATE_RESERVATION` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → session auth/context → strict discriminated mutation → owner/action/policy → idempotency → rate → mutation/payment saga → success/`ApiError` validation | key binds reservation/version/action/body through money terminal+7 years; 20/min/account+holder/reservation; 15,000 ms deadline |
| `V29_18_FINALIZE_ATTENDANCE` | request ID → `BE00-CORS-DENY` → mTLS/service token → signed source event → strict Zod → worker/scope/evidence authorization → idempotency/event dedupe → rate → reservation transaction/outbox → success/`ApiError` validation | source event/version/body hash retained reservation lifetime+7 years; 300/min/worker burst 50; 2,000 ms async-acceptance deadline |
| `V29_20_CREATE_SERIES` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → session auth/context → strict bounded recurrence/DST → holder/room policy → idempotency → rate → all-instance preflight/saga → success/`ApiError` validation | root key binds rule/instances/review horizon through terminal+7 years; 3/min/account+holder and 10/day; 15,000 ms deadline |
| `V29_22_HANDOFF_BILL_SLOT` | request ID → `BE00-CORS-WEB-CREDENTIALLED` preflight → CSRF → session auth/context → strict performance-only Zod → room/handoff capability → idempotency → rate → snapshot/handoff outbox → success/`ApiError` validation | key binds room/slot/snapshot vector through receipt+7 years; 10/min/account+operator+room; 15,000 ms deadline |

Every failure is the BE00 `ApiError { code, message, requestId, details }`. CORS denial precedes resource lookup. Same key/same hash replays the stored response; a changed hash is `409 IDEMPOTENCY_CONFLICT`; an in-flight saga is `409 REQUEST_IN_PROGRESS` with safe phase and retry hint. No middleware row may bypass authority revalidation at final commit.

### Operation Flows and Recovery

| Operation ID | Transaction/concurrency algorithm | Failure recovery / prohibited result |
|---|---|---|
| `V29_15_INSTANT_BOOK` | phase A validates authority, full claim/payout, fresh calendar/hold and immutable rate/policy/spec snapshots; serializable transaction inserts binding quote, `pending_authorization` reservation, audit/outbox/idempotency; payment authorize uses saga key; phase B relocks room/hold/quote/reservation, revalidates, converts hold and confirms | any phase-B loss marks reservation failed, releases hold and idempotently voids authorization; unknown void is durable `COMPENSATION_PENDING`; client never sees confirmed until hold/payment/state commit; quote event remains truthful |
| `V29_16_COMMIT_COMPOUND` | canonicalize member order; preflight every calendar/hold/rate/policy/resource; sorted advisory locks; insert root, quotes and pending members; authorize one total; relock all, convert all holds and confirm root/members in one transaction | first failed member key is safe and all holds release; authorization voids as one compensation; no member success response or orphan quote consumption; retry resumes saga phase, never starts a second payment |
| `V29_17_MUTATE_RESERVATION` | lock reservation then replacement hold/quote if any; CAS version; evaluate frozen ladder on released delta; stage exact money instruction; perform idempotent payment action; relock/revalidate and atomically swap slot/resources/state/quote with audit/outbox | stale state returns current safe terms; payment unknown leaves pending instruction and original commercial state until reconciliation; reschedule never releases old hold before replacement is secured; no partial reduce |
| `V29_18_FINALIZE_ATTENDANCE` | dedupe signed source event; lock reservation; require legal time/state; started enters `in_progress`; completed enters `completed_provisional`; sweeper later promotes to completed/eligible; timely no-show CAS voids provisional harvest and emits change | late/conflicting source is typed and leaves state; no-show vs completion race has one version winner; harvest invalidation retries independently; money dispute is only linked, never inferred/resolved |
| `V29_20_CREATE_SERIES` | expand weekly rule with exact offset semantics through bounded count/review; name invalid DST/conflicting instance; preflight/lock every slot/resource/rate; stage one series and all pending instances; authorize configured payment posture; confirm all or roll all back | conflict returns date/member and creates no hidden subset; user may submit new trimmed/split rule; payment/hold failure releases all; review worker stops future generation at horizon and never auto-extends |
| `V29_22_HANDOFF_BILL_SLOT` | verify performance use and snapshot immutability/current authority; reject unknown fields; generate handoffRef; atomically store replay/audit/outbox; invoke Shard 30 with exact snapshot vector; persist receipt in BE00 delivery record | circuit leaves explicit queued 202; Shard 30 rejection is `HANDOFF_REJECTED` without reservation; accepted receipt establishes Shard 30 ownership; retries use same handoffRef and cannot create dual lifecycle |

### External Seams

| Seam | Exact request → response | Timeout, retry/backoff, circuit behavior |
|---|---|---|
| Shard 01 authority/payout readiness | `{accountId,actingPartyId,holderPartyId,roomId,capability,contextVersion,requireFullClaim,requirePayout}` → `{allowed,partyVersion,mandateVersion,claimLevel,payoutReady,safeReason}` | 250 ms; 1 retry after 25 ms; opens after 15 failures/30 s for 30 s; open circuit fails closed before quote/commit |
| Shard 29c availability/hold | `{action:"validate"|"convert"|"release",holdId,expectedHoldVersion,holderPartyId,resourceRefs,slot,reservationRef,sagaKey}` → `{accepted,holdState,currentVersion,calendarVersion,failedResourceRef?,safeReason}` | 500 ms; 2 retries after 50/150 ms; opens after 10 failures/30 s for 30 s; open circuit confirms nothing and queues idempotent release when compensating |
| rate/tax/policy snapshotter | `{roomId,useType,slot,configurationKey,staticVariantKey,extras,holderJurisdiction,rateVersion?,calculationAt}` → `{rateCardVersionId,lines,subtotalMinor,taxMinor,totalMinor,currency,policySnapshotId,expiresAt,computationHash}` | 700 ms; 2 retries after 75/250 ms; opens after 8 failures/60 s for 60 s; open circuit returns `QUOTE_POLICY_UNAVAILABLE`, persists no quote and never substitutes a rate |
| payment provider | `{operationId,sagaKey,action:"authorize"|"capture"|"void"|"refund"|"additional_charge",amountMinor,currency,paymentMethodRef?,authorizationRef?}` → `{providerOperationRef,state:"succeeded"|"declined"|"pending"|"unknown",authorizationRef?,safeDeclineCode?}` | 2,500 ms; 2 retries after 200/800 ms using same provider key; opens after 6 failures/60 s for 60 s; unknown enters reconciliation/compensation and never authorizes again under a new key |
| Shard 24 resource allocation | `{action:"validate"|"allocate"|"release",resourceRefs,slot,reservationOrCompoundRef,expectedGraphVersion,sagaKey}` → `{accepted,currentGraphVersion,failedResourceRef?,allocationRefs,safeReason}` | 600 ms; 2 retries after 75/225 ms; opens after 10 failures/30 s for 30 s; open circuit fails closed and releases already staged allocations idempotently |
| Shard 30 performance handoff | `{handoffRef,roomId,slot,roomSnapshotId,specSnapshotId,accessibilitySnapshotId,statutorySnapshotId,availabilitySnapshotId,operatorPartyId,promoterPartyId?,resourceRefs}` → `{accepted,bookingAggregateRef?,receiptVersion,safeReason?}` | 1,000 ms; 3 retries after 200/800/3,200 ms; opens after 8 failures/60 s for 60 s; open circuit retains queued handoff; rejection creates no Shard 29 reservation |
| evidence-harvest eligibility | `{reservationId,state,provisionalUntil,holderRef,roomRef,snapshotRefs,eligibilityVersion}` → `{accepted,harvestRunRef?,state}` | 800 ms; 3 retries after 1/4/16 s; opens after 10 failures/60 s for 60 s; eligibility outbox remains durable; no-show invalidation has priority over publication |
| BE00 outbox dispatcher | `{eventId,eventType,aggregateRef,aggregateVersion,payload}` → `{accepted,receipt}` | 1,000 ms; 5 retries after 1/2/4/8/16 s; opens after 10 failures/60 s for 60 s; committed truth remains in outbox and drains in aggregate-version order |

## Event Contracts

```ts
const VenueEventBase=z.object({event_id:UUID,event_type:z.string().min(1).max(96),schema_version:z.literal("1"),occurred_at:Instant,actor_ref:UUID.nullable(),acting_party_ref:UUID.nullable(),aggregate_ref:UUID,aggregate_version:Version,correlation_id:UUID,causation_id:UUID.nullable(),idempotency_key:z.string().min(8).max(128),payload:JsonValueSchema}).strict();
export const VenueQuoteIssued=VenueEventBase.extend({event_type:z.literal("venue.quote.issued"),payload:z.object({quoteSnapshotId:UUID,roomId:UUID,rateCardVersionId:UUID,bindingPosture:z.enum(["binding","estimate"]),expiresAt:Instant,totalMinor:Minor,currency:Currency,policySnapshotId:UUID}).strict()}).strict();
export const VenueReservationChanged=VenueEventBase.extend({event_type:z.literal("venue.reservation.changed"),payload:z.object({aggregateKind:z.enum(["reservation","compound"]),reservationId:UUID.nullable(),compoundReservationId:UUID.nullable(),oldState:z.string().min(1).max(32),newState:z.enum(["pending_authorization","confirmed","in_progress","completed_provisional","completed","cancelled_client","cancelled_operator","no_show","failed"]),policySnapshotIds:z.array(UUID).min(1).max(50),quoteSnapshotIds:z.array(UUID).min(1).max(50),cause:z.string().min(1).max(64)}).strict().superRefine((v,c)=>{if((v.aggregateKind==="reservation")!==(v.reservationId!==null))c.addIssue({code:"custom",message:"aggregate_id_mismatch"});if((v.aggregateKind==="compound")!==(v.compoundReservationId!==null))c.addIssue({code:"custom",message:"aggregate_id_mismatch"});})}).strict();
```

Recurring-series creation emits one ordered `venue.reservation.changed` for each materialized reservation; series metadata is audit truth and does not invent another event. Performance handoff emits the Shard 30 owning contract through its seam. Consumers deduplicate `event_id`, order by `(aggregate_ref,aggregate_version)`, ignore older versions and reauthorize before disclosure. Events contain opaque refs and totals only—never payment method/payout, holder identity, exact private resource composition, evidence or commercial conversation.

## Errors, Recovery, and Observability

BE00 transport/media/size, authentication, CSRF, CORS, deadline, dependency and rate failures apply alongside these domain outcomes. All failures validate against the exact four-field `ApiError` schema; `details` may carry only safe current version, failed member key/date and compensation state.

| Operation ID | HTTP/status and domain code | Safe trigger/recovery |
|---|---|---|
| `V29_15_INSTANT_BOOK` | 422 `RATE_UNAVAILABLE`/`MANDATORY_EXTRA_MISSING`/`QUOTE_POLICY_UNAVAILABLE`; 409 `HOLD_EXPIRED`/`QUOTE_EXPIRED`/`PAYMENT_NOT_AUTHORIZED`/`AUTHORITY_LOST`/`COMPENSATION_PENDING`/`IDEMPOTENCY_CONFLICT`; 403; 404; 429; 503 | refresh availability/rate/policy/payment; failed saga exposes safe compensation state and no confirmed reservation |
| `V29_16_COMMIT_COMPOUND` | 422 `RATE_UNAVAILABLE`; 409 `COMPOUND_MEMBER_FAILED`/`RESOURCE_UNAVAILABLE`/`PAYMENT_NOT_AUTHORIZED`/`COMPENSATION_PENDING`/`IDEMPOTENCY_CONFLICT`; 403; 404; 429; 503 | correct named own member/resource or retry same saga; all members remain unconfirmed/released |
| `V29_17_MUTATE_RESERVATION` | 422 `POLICY_BLOCKED`/`MINIMUM_BLOCK`; 409 `STALE_VERSION`/`ALREADY_FINAL`/`RESOURCE_UNAVAILABLE`/`PAYMENT_NOT_AUTHORIZED`/`COMPENSATION_PENDING`/`IDEMPOTENCY_CONFLICT`; 403; 404; 429; 503 | refresh current state/frozen terms or replacement hold/quote; no partial slot/money change |
| `V29_18_FINALIZE_ATTENDANCE` | 422 `PROVISIONAL_WINDOW_OPEN`/`NO_SHOW_WINDOW_CLOSED`; 409 `STALE_VERSION`/`ALREADY_FINAL`/`IDEMPOTENCY_CONFLICT`; 401; 403; 404; 429; 503 | replay exact source, await window or route evidence dispute; attendance and money truth remain separate |
| `V29_20_CREATE_SERIES` | 422 `REVIEW_HORIZON_INVALID`; 409 `SERIES_CONFLICT`/`RESOURCE_UNAVAILABLE`/`PAYMENT_NOT_AUTHORIZED`/`COMPENSATION_PENDING`/`IDEMPOTENCY_CONFLICT`; 403; 404; 429; 503 | submit trimmed/split bounded rule using returned own conflict date; no partial series or hidden instance |
| `V29_22_HANDOFF_BILL_SLOT` | 422 `ROOM_HIRE_FIELDS_FORBIDDEN`/`SNAPSHOT_MISSING`; 409 `STALE_VERSION`/`HANDOFF_REJECTED`/`IDEMPOTENCY_CONFLICT`; 403; 404; 429; 503 | remove commercial fields, refresh snapshots/authority or retry queued receipt; no Shard 29 reservation exists |

| Operation ID | Safe logs/traces | Metrics/SLO and alert |
|---|---|---|
| `V29_15_INSTANT_BOOK` | request/op/actor/holder/room/hold/quote/reservation opaque IDs, versions, total/currency, saga phase, payment safe state, replay; no method/payout | quote/authorize/confirm/compensate counts and latency; p95 <3 s; page confirmed-without-converted-hold or compensation age >2 min |
| `V29_16_COMMIT_COMPOUND` | holder/root IDs, member count/hash, failed member key, total/currency, phase/compensation/version/replay; resource details scrubbed | success/failure/member/lock/payment latency; p95 <5 s; page mixed terminal outcome or orphan member |
| `V29_17_MUTATE_RESERVATION` | actor/reservation/action, old/new state/version, released delta, money kind/state, policy version/replay; reason/evidence safe code only | mutation/conflict/refund/reconcile latency; p95 <2.5 s; page slot changed with failed money instruction |
| `V29_18_FINALIZE_ATTENDANCE` | worker/source/reservation IDs, outcome/states, window/eligibility versions, duplicate; no holder/evidence body | transition/duplicate/conflict/harvest lag; p95 accept <500 ms; page published harvest after timely no-show |
| `V29_20_CREATE_SERIES` | actor/holder/room/series IDs, rule hash, instance/exception counts, review date, conflict date, saga/replay | create/conflict/instance/compensation/review lag; p95 <8 s; page partial instance set or horizon auto-extension |
| `V29_22_HANDOFF_BILL_SLOT` | actor/room/handoff/snapshot hashes, slot bucket, route state/receipt/replay; no deal or payout fields | queued/accepted/rejected/delivery age; p95 accept <1 s; page duplicate Shard 30 aggregate or queued >2 min |

Audit rows contain actor/context/action/scope, before/after hashes, authority/calendar/hold/rate/policy/spec/accessibility/statutory/resource/payment-safe versions, idempotency/request hash and result. provider-native diagnostic sinks receive opaque IDs and codes only. Payment method/payout, holder contact, exact private occupancy/resources, evidence, policy text and Shard 30 terms are scrubbed from logs, traces, errors and events.

## Release and Testing

### Per-operation Tests

| Operation ID | Contract/authorization tests | Idempotency/concurrency/failure/observability tests |
|---|---|---|
| `V29_15_INSTANT_BOOK` | strict composite/offset/money/extras shapes; static-only rate; full claim/payout/fresh calendar; holder/403/404; snapshot freeze | replay/mismatch, hold expiry during payment, CAS race, provider unknown then void/reconcile, all-or-release, events/CORS/rate/`ApiError`/redaction |
| `V29_16_COMMIT_COMPOUND` | 2–50 unique member keys/rooms/resources, common holder/currency, every authority/rate/policy/hold, opaque failed member | shared-resource races one winner, nth-member failure releases all, one payment key/void, crash-resume saga, no mixed root/member state, metrics |
| `V29_17_MUTATE_RESERVATION` | action union/ownership, frozen ladder/minimum block, operator vs client cancel, replacement hold/quote, terminal refusal | stale/CAS races, reschedule preserves old until new secured, payment unknown no state swap, refund replay, audit/event/privacy |
| `V29_18_FINALIZE_ATTENDANCE` | signed source/scope, legal time/state/source, evidence permission, provisional/no-show boundaries, `BE00-CORS-DENY` | event replay/mismatch, completed vs no-show one winner, sweeper race, harvest invalidation priority, money untouched, async SLO/alert |
| `V29_20_CREATE_SERIES` | bounded weekly rule/count/review, DST fold/gap, exception limits, every instance policy/availability, own conflict disclosure | all-instance concurrency, conflict creates none, payment/hold compensation, root replay, review stops extension, ordered events/index plans |
| `V29_22_HANDOFF_BILL_SLOT` | performance-only strict schema, immutable snapshots/current room authority, delegated capability, room-hire fields rejected | same handoff one Shard 30 aggregate, circuit queued recovery, rejection no reservation, stale snapshot race, CORS/rate/audit/trace |

Additional suites cover Zod/OpenAPI/event snapshots; SQL checks/FKs/deferrable member triggers/index plans; RLS/grants for public/holder/operator/delegate/rate-worker/payment/attendance/harvest/support/foreign roles; property tests for minor-unit arithmetic, static-price determinism and series expansion; randomized saga/crash/payment reconciliation; reservation-room overlap invariant; outbox order/dedup; retention/erasure, migration rollback and privacy differential tests.

Release requires compatible OpenAPI diff, expand/contract migration rehearsal, immutable-rate overlap and reservation-overlap invariant queries, RLS/grant verification, payment/hold/resource/Shard 30 circuit drills, saga reconciliation with zero aged unknowns, DST/series fixture replay, snapshot/redaction scans, dashboards/alerts and rollback proof. Rollback disables new quote/commit/mutation/series/handoff commands, preserves commercial truth/idempotency/audit/outbox, drains compensation and delivery, and never deletes or reopens confirmed/terminal reservations.

## Deepening Passes

1. **Traceability:** all six IA interactions, three named IA commands, five canonical models and two literal events map to stable routes, exact contracts and persistence.
2. **Contracts/security:** strict Zod 4 requests/successes/errors, BE00 `ApiError`, per-operation named CORS/deadlines/rates/idempotency, ownership, 403/404 and privacy are closed.
3. **Data:** every canonical persistence field has SQL type/nullability/check, FK/logical enforcement, query indexes, forced RLS, least-privilege grants and retention.
4. **Reliability:** immutable snapshots, static-price determinism, sorted locks, CAS, explicit payment sagas/compensation, all-or-none compound/series commits and durable handoff prevent partial truth.
5. **Operations/tests:** safe telemetry, per-operation tests, chaos/reconciliation, migrations, release and rollback cover ordinary, concurrent and dependency-failure paths.

## Ambiguity Gate

**PASS.** Macro room-hire pricing/reservation ownership, payment/resource seams, provisional completion, bounded recurrence and exclusive Shard 30 performance handoff are reconciled. Micro routes, operation IDs, schemas, bounds, state/payment machines, CORS, deadlines, rates, idempotency, 403/404, SQL fields/constraints/FKs/indexes/RLS/grants, locks, compensation, seam timeout/retry/circuits, errors, telemetry, tests and rollback are exact. No unresolved, provisional or unspecified implementation choice remains.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial production backend contract for approved Shard 29d split. |

## Dependency References

- [BE00 Infrastructure](./00-infrastructure.md)
- [IA Shard 29 — Venues, Studios and Spaces](../ia/29-venues-spaces.md)
- [Architecture Design](../2026-08-02-architecture-design.md)
- [Engineering Standards](../ENGINEERING-STANDARDS.md)
- [Shard 01 Identity & Authority](../ia/01-identity-authority.md)
- [Shard 24 Gear Holdings & Operations](../ia/24-gear-holdings-operations.md)
- [Shard 30 Booking & Contracts](../ia/30-booking-contracts.md)
- [Shard 32 Show Production Planning](../ia/32-show-production-planning.md)
- [Shard 35 Ticket Products & Sales](../ia/35-ticket-products-sales.md)
