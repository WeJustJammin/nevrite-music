# Box-office Counts, Drops, Walk-up & Close — Backend Specification

**Status:** Complete

**IA source:** [Shard 36 — Door access, box office, reconciliation and ticketing risk](../ia/36-box-office-risk.md)

**Platform contract:** [BE 00](00-infrastructure.md)

## Classification

| Dimension | Decision |
|---|---|
| Classification | Multi-domain companion 36b: live sourced counters, immutable drops, pacing, walk-up sales/float, and certified box-office close |
| Included IA interactions | 36.06–36.10 |
| Included feature | 19.05 Box Office Counts, Drops & Day-of-Show |
| Canonical models | BoxOfficeCount; DropSnapshot; WalkUpSale; BoxOfficeClose |
| Canonical contract | CloseBoxOffice |
| Boundary | Counts are never fan-facing; platform records cash float but never holds cash; count-dependent settlement cannot finalize on unknown/disputed counts |

## Referenced Material Inventory

| Material | Source location | Use |
|---|---|---|
| Locked count/close/walk-up decisions | [IA 36 lines 7–44](../ia/36-box-office-risk.md#overview) | Counter separation, drop immutability, cash boundary, close attestations |
| Feature and acceptance criteria | [IA 36 lines 46–77](../ia/36-box-office-risk.md#features) | 19.05 and AC-36.06–36.10 |
| Interactions | [IA 36 lines 79–103](../ia/36-box-office-risk.md#interactions) | Read count, drop, pacing, walk-up, close |
| Contract/model registry | [IA 36 lines 105–170](../ia/36-box-office-risk.md#contracts) | CloseBoxOffice and four canonical models |
| Access/events/edges | [IA 36 lines 172–272](../ia/36-box-office-risk.md#access-control) | Role floors, count/close events, offline oversell, single-party close |
| Dependencies | [IA 36 lines 274–285](../ia/36-box-office-risk.md#cross-shard-dependencies) | BE00, IA06, IA33, IA35 |
| Global contracts/middleware | [BE00 lines 112–500](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) | ApiError, Zod 4, CORS, idempotency, events, recovery |

## IA Source Map

| Op | IA interaction | Result |
|---|---|---|
| 36.06 | Read live count | Authorized consistent BoxOfficeCount snapshot with source/freshness |
| 36.07 | Issue immutable drop | Recipient/scope/count-version snapshot and forward-only movement |
| 36.08 | Evaluate pacing | Actionable deviation alert, silence, or explicit no-reference result |
| 36.09 | Sell walk-up | Manifest ticket admitted at birth plus cash/card and venue-float evidence |
| 36.10 | Close box office | Certified count/float/device/exceptions version with asynchronous counter-attestation |

### Canonical identifier registry

| Kind | Exact identifiers |
|---|---|
| Interactions | 36.06 Read live count; 36.07 Issue immutable drop; 36.08 Evaluate pacing; 36.09 Sell walk-up; 36.10 Close box office |
| Contract | CloseBoxOffice |
| Models | BoxOfficeCount; DropSnapshot; WalkUpSale; BoxOfficeClose |
| Events | boxoffice.count.versioned; boxoffice.close.changed |

## Endpoint Completeness Reconciliation

| Op | Responsibility | Durable effect |
|---|---|---|
| 36.06 | Materialize/read one consistent sourced counter version | BoxOfficeCount read/version |
| 36.07 | Freeze authorized recipient scope, source/freshness, counts, movement | DropSnapshot and delivery job |
| 36.08 | Compare versioned reference with current trajectory without inventing a claim | pacing_evaluation append or silence |
| 36.09 | Reserve/preallocated manifest unit, price all-in, record cash/card, admit at birth | WalkUpSale, Shard35 ticket, float line, 36a scan effect |
| 36.10 | Quiesce sales, reconcile/write off devices, certify counts/float/exceptions | BoxOfficeClose and close event |

Fan availability remains Shard35’s boolean inventory projection; 36.06 never returns internal counts to fan roles. Gross/net money stays deal-scoped outside this companion.

## Shared Contract Inheritance

BE00 supplies auth, request IDs, CORS/CSRF, ETags, idempotency, strict validation, event envelope/outbox, audit, jobs, observability, and recovery. Every failure uses:

~~~ts
type ApiError = {
  code: string;
  message: string;
  requestId: string;
  details: Readonly<Record<string, JsonValue>>;
};
~~~

## API Endpoints

### Authoritative Route Registry

| Op | Method/path | Principal | CORS | Validation | Rate | Idempotency | Success |
|---|---|---|---|---|---|---|---|
| 36.06 | GET /api/v1/box-office/events/{eventId}/counts | Operator, performing-act projection, finance deal role | BE00-CORS-WEB-CREDENTIALLED | Path/query | 180/min/event | Rejected on GET | 200 |
| 36.07 | POST /api/v1/box-office/events/{eventId}/drops | Operator or authorized deal role | BE00-CORS-WEB-CREDENTIALLED | JSON, If-Match | 30/min/event | Required 24h | 201 |
| 36.08 | POST /api/v1/box-office/events/{eventId}/pacing-evaluations | Operator/performing-act deal role | BE00-CORS-WEB-CREDENTIALLED | JSON/version | 60/min/event | Required 24h | 200 |
| 36.09 | POST /api/v1/box-office/events/{eventId}/walk-up-sales | Box-office seller/device | BE00-CORS-WEB-CREDENTIALLED | Discriminated JSON/device assertion | 300/min/window | Required 7d | 201 or 202 offline |
| 36.10 | POST /api/v1/box-office/events/{eventId}/closes | Operator/box-office lead with step-up | BE00-CORS-WEB-CREDENTIALLED | JSON, If-Match | 6/hour/event | Required 7d | 201 |

BE00-CORS-WEB-CREDENTIALLED/write are exact configured origins. Writes allow only required headers and credentials; no wildcard/null origin. BE00 handles OPTIONS.

### Operation Contract Matrix

| Op | Request | Success | Failure |
|---|---|---|---|
| 36.06 | CountQuery | CountResult | BE00 ApiError { code, message, requestId, details } |
| 36.07 | DropRequest plus VersionedHeaders | DropResult | BE00 ApiError { code, message, requestId, details } |
| 36.08 | PacingRequest plus CommandHeaders | PacingResult | BE00 ApiError { code, message, requestId, details } |
| 36.09 | WalkUpRequest plus SellerDeviceHeaders | WalkUpResult | BE00 ApiError { code, message, requestId, details } |
| 36.10 | CloseBoxOfficeRequest plus VersionedHeaders | CloseBoxOfficeResult | BE00 ApiError { code, message, requestId, details } |

## Request and Response Contracts — Zod 4

~~~ts
import { z } from "zod";
const Uuid=z.uuid();
const Instant=z.iso.datetime({offset:true});
const Currency=z.string().regex(/^[A-Z]{3}$/);
const NonNegativeMoney=z.int().min(0).max(9_000_000_000_000_000);
const Version=z.int().positive();
const Sha256=z.string().regex(/^[a-f0-9]{64}$/);
const CommandHeaders=z.object({
  "idempotency-key":z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  "x-csrf-token":z.string().min(32).max(512),
}).strict();
const VersionedHeaders=CommandHeaders.extend({
  "if-match":z.string().regex(/^"[1-9][0-9]*"$/),
}).strict();
const SellerDeviceHeaders=CommandHeaders.extend({
  "x-device-assertion":z.string().min(32).max(2048),
}).strict();

const CounterSet=z.object({
  paidCount:z.int().min(0).max(500_000),
  compCount:z.int().min(0).max(500_000),
  scannedCount:z.int().min(0).max(1_000_000),
  admittedCount:z.int().min(0).max(500_000),
  remainingCount:z.int().min(0).max(500_000),
  capacityCount:z.int().min(0).max(500_000),
}).strict().superRefine((v,ctx)=>{
  if(v.admittedCount>v.scannedCount)ctx.addIssue({code:"custom",path:["admittedCount"],message:"admitted_cannot_exceed_scanned"});
  if(v.paidCount+v.compCount+v.remainingCount>v.capacityCount)ctx.addIssue({code:"custom",path:["remainingCount"],message:"allocated_plus_remaining_cannot_exceed_capacity"});
});
const CounterSource=z.object({
  sourceClass:z.enum(["platform_sales","gate_observed","external_provider","manual_attestation","reconciled"]),
  sourceRef:Uuid,
  sourceVersion:Version,
  observedAt:Instant,
  freshness:z.enum(["live","fresh","stale","unknown"]),
}).strict();
export const BoxOfficeCountSchema=z.object({
  countVersionId:Uuid,
  eventId:Uuid,
  version:Version,
  counters:CounterSet,
  sources:z.array(CounterSource).min(1).max(20),
  consistency:z.enum(["consistent","provisional","unknown","disputed"]),
  generatedAt:Instant,
}).strict();
export const CountQuery=z.object({
  eventId:Uuid,
  projection:z.enum(["operator_full","performing_act_floor","finance_deal"]),
  asOf:Instant.optional(),
}).strict();
export const CountResult=z.object({
  count:BoxOfficeCountSchema,
  visibleFields:z.array(z.enum(["paid","comp","scanned","admitted","remaining","capacity","source","freshness"])).min(2).max(8),
  settlementFinality:z.enum(["eligible","blocked_unknown","blocked_disputed"]),
}).strict();

export const DropRequest=z.object({
  countVersionId:Uuid,
  recipientPartyId:Uuid,
  scope:z.enum(["paid_and_admissions_floor","full_operator","finance_deal"]),
  previousDropId:Uuid.nullable(),
  deliveryChannel:z.enum(["in_app","email_artifact","download"]),
}).strict();
export const DropSnapshotSchema=z.object({
  dropId:Uuid,
  eventId:Uuid,
  countVersionId:Uuid,
  recipientPartyId:Uuid,
  scope:z.enum(["paid_and_admissions_floor","full_operator","finance_deal"]),
  scopedCounters:z.record(z.string().regex(/^[a-z_]{1,32}$/),z.int().min(0)).refine(v=>Object.keys(v).length<=8),
  sourceDigest:Sha256,
  freshness:z.enum(["live","fresh","stale","unknown"]),
  movement:z.record(z.string().regex(/^[a-z_]{1,32}$/),z.int()).refine(v=>Object.keys(v).length<=8),
  previousDropId:Uuid.nullable(),
  deliveredAt:Instant.nullable(),
  version:Version,
}).strict();
export const DropResult=z.object({
  drop:DropSnapshotSchema,
  deliveryJobId:Uuid.nullable(),
  replayed:z.boolean(),
}).strict();

const PacingReference=z.discriminatedUnion("kind",[
  z.object({kind:z.literal("none")}).strict(),
  z.object({
    kind:z.literal("break_even"),
    referenceCount:z.int().min(0).max(500_000),
    referenceAt:Instant,
    sourceVersion:Version,
  }).strict(),
  z.object({
    kind:z.literal("trajectory"),
    expectedCountByNow:z.int().min(0).max(500_000),
    lowerToleranceCount:z.int().min(0).max(500_000),
    upperToleranceCount:z.int().min(0).max(500_000),
    sourceVersion:Version,
  }).strict().refine(v=>v.lowerToleranceCount<=v.expectedCountByNow&&v.expectedCountByNow<=v.upperToleranceCount,{
    message:"trajectory_bounds_must_contain_expected"
  }),
]);
export const PacingRequest=z.object({
  countVersionId:Uuid,
  metric:z.enum(["paid","admitted"]),
  reference:PacingReference,
  alertPolicyVersion:z.string().min(1).max(100),
  evaluatedAt:Instant,
}).strict();
export const PacingResult=z.discriminatedUnion("outcome",[
  z.object({outcome:z.literal("no_reference"),claimMade:z.literal(false),evaluationId:Uuid}).strict(),
  z.object({outcome:z.literal("silence"),evaluationId:Uuid,deviationCount:z.int(),reasonCode:z.literal("within_reference")}).strict(),
  z.object({
    outcome:z.literal("alert"),
    evaluationId:Uuid,
    deviationCount:z.int(),
    direction:z.enum(["below","above"]),
    actionCode:z.enum(["review_promotion","review_capacity","review_staffing","review_break_even"]),
    alertJobId:Uuid,
  }).strict(),
]);

const WalkUpBase=z.object({
  manifestUnitId:Uuid,
  inventoryBlockId:Uuid,
  ticketProductId:Uuid,
  allInPriceMinor:NonNegativeMoney,
  currency:Currency,
  operatorPartyId:Uuid,
  deviceId:Uuid,
  soldAt:Instant,
  purchaserDeliveryRef:Uuid.nullable(),
}).strict();
export const WalkUpRequest=z.discriminatedUnion("paymentKind",[
  WalkUpBase.extend({
    paymentKind:z.literal("cash"),
    cashTenderedMinor:NonNegativeMoney,
    changeGivenMinor:NonNegativeMoney,
    venueFloatId:Uuid,
  }).strict().refine(v=>v.cashTenderedMinor-v.changeGivenMinor===v.allInPriceMinor,{message:"cash_must_reconcile"}),
  WalkUpBase.extend({
    paymentKind:z.literal("card"),
    terminalPaymentRef:Uuid,
    providerAmountMinor:NonNegativeMoney,
  }).strict().refine(v=>v.providerAmountMinor===v.allInPriceMinor,{message:"card_amount_must_match_all_in"}),
]);
export const WalkUpSaleSchema=z.object({
  walkUpSaleId:Uuid,
  eventId:Uuid,
  manifestUnitId:Uuid,
  ticketId:Uuid,
  ticketEpoch:Version,
  paymentKind:z.enum(["cash","card"]),
  allInPriceMinor:NonNegativeMoney,
  currency:Currency,
  operatorPartyId:Uuid,
  deviceId:Uuid,
  venueFloatLineId:Uuid.nullable(),
  state:z.enum(["admitted","admitted_pending_sync","reconciled","refunded"]),
  admittedAtBirth:z.literal(true),
  platformHeldCash:z.literal(false),
  version:Version,
  soldAt:Instant,
}).strict();
export const WalkUpResult=z.object({
  sale:WalkUpSaleSchema,
  oversellState:z.enum(["none","authorized_offline_block_oversell"]),
  replayed:z.boolean(),
}).strict();

const DeviceCloseState=z.object({
  deviceId:Uuid,
  lastWatermark:z.int().min(0),
  state:z.enum(["reconciled","written_off"]),
  writeOffReasonCode:z.enum(["lost","destroyed","irrecoverable_unsynced","operator_authorized"]).nullable(),
}).strict().refine(v=>(v.state==="written_off")===(v.writeOffReasonCode!==null),{message:"writeoff_reason_required"});
const FloatLine=z.object({
  venueFloatId:Uuid,
  currency:Currency,
  openingMinor:NonNegativeMoney,
  cashSalesMinor:NonNegativeMoney,
  cashRefundsMinor:NonNegativeMoney,
  closingCountedMinor:NonNegativeMoney,
  varianceMinor:z.int(),
}).strict().refine(v=>v.openingMinor+v.cashSalesMinor-v.cashRefundsMinor-v.closingCountedMinor===v.varianceMinor,{
  message:"float_variance_must_reconcile"
});
export const CloseBoxOffice=z.object({
  eventId:Uuid,
  countVersionId:Uuid,
  counters:CounterSet,
  devices:z.array(DeviceCloseState).min(1).max(100),
  floatLines:z.array(FloatLine).max(20),
  exceptionCodes:z.array(z.string().regex(/^[A-Z0-9_]{1,64}$/)).max(100),
  operatorAttestation:z.object({
    actorPartyId:Uuid,
    statementVersion:z.string().min(1).max(100),
    signedAt:Instant,
  }).strict(),
}).strict().refine(v=>new Set(v.devices.map(x=>x.deviceId)).size===v.devices.length,{message:"devices_must_be_unique"});
export const CloseBoxOfficeRequest=CloseBoxOffice.extend({
  salesDrainToken:Uuid,
  expectedCountVersion:Version,
  closePolicyVersion:z.string().min(1).max(100),
}).strict();
export const BoxOfficeCloseSchema=z.object({
  closeId:Uuid,
  eventId:Uuid,
  countVersionId:Uuid,
  certifiedCounters:CounterSet,
  deviceStates:z.array(DeviceCloseState).min(1).max(100),
  floatLines:z.array(FloatLine).max(20),
  exceptionCodes:z.array(z.string().regex(/^[A-Z0-9_]{1,64}$/)).max(100),
  operatorPartyId:Uuid,
  counterpartyAttestationState:z.enum(["pending","accepted","disputed","lapsed","not_required"]),
  reconciliationState:z.enum(["reconciled","unreconciled","disputed"]),
  settlementFinality:z.enum(["eligible","blocked_unknown","blocked_disputed"]),
  version:Version,
  certifiedAt:Instant,
  supersedesCloseId:Uuid.nullable(),
  digest:Sha256,
}).strict();
export const CloseBoxOfficeResult=z.object({
  close:BoxOfficeCloseSchema,
  counterAttestationJobId:Uuid.nullable(),
  replayed:z.boolean(),
}).strict();
~~~

### Fixed-read pagination and collection bounds

| Operation | Pagination | Exact returned-collection bounds |
|---|---|---|
| 36.06 | Pagination N/A: this GET returns one transaction-consistent count projection; strict `CountQuery` rejects cursor, offset, page, limit, sort, and filter keys. | `count.sources` contains 1–20 `CounterSource` entries and `visibleFields` contains 2–8 unique allowlisted field codes; `count.counters` is a fixed object and no other returned field is a collection. |

### Contract invariants

| Op | Rule |
|---|---|
| 36.06 | Snapshot is transaction-consistent; every counter names source/version/freshness; performing act receives at least paid+admissions aggregate and no fan rows |
| 36.07 | Drop pins count version/scope; later scope changes create future drops only; delivered artifact never mutates |
| 36.08 | reference=none produces no claim/alert; evaluation cannot infer break-even or trajectory |
| 36.09 | All-in price equals Shard35 manifest; ticket is admitted atomically at birth; authorized offline block oversell is honored and later reconciled |
| 36.10 | Sales must be drained; each device reconciled or reasoned write-off; unknown/disputed count blocks settlement finality; operator certification is immediate and counter-attestation asynchronous |

## Authorization, Disclosure, and Privacy

| Actor | Allowed | Denied |
|---|---|---|
| Operator/box-office lead | 36.06–36.10 | Alter source facts, hide exceptions, or mark unknown/disputed final |
| Box-office seller | 36.09 and own float/device evidence | Full deal counts, drops, close certification |
| Performing act | 36.06 scoped floor, 36.07 named drops, counter-attest 36.10 where granted | Fan rows, device PII, unrelated deal money |
| Finance/deal role | Deal-scoped 36.06/07/10 | Door lookup or other deals |
| Service worker | Count materialization/delivery/settlement gate | General attendee or money access |
| Fan | None | Internal counts, pacing, close, fraud/float |

Invisible event/count/drop/sale/close returns cause-invariant 404; visible but disallowed action returns 403. Step-up absence after base authorization is 401. Logs/events never carry attendee identities or cash/card credentials. Money logs use currency and bounded variance class, not party-linked amounts. Fan availability is a different Shard35 boolean contract.

## Database Schema

Schema boxoffice_private; logical Shard33/35 IDs are version-validated. Party FKs target platform_private.party(id).

| Logical reference fields | Target or non-FK meaning | Enforcement |
|---|---|---|
| `*.event_id` | Shard33 event/show aggregate UUID | Event/version seam validation and transaction-local event RLS context |
| `walk_up_sale.manifest_unit_id`, `inventory_block_id`, `ticket_product_id`, `ticket_id` | Shard35 manifest-unit, authorized offline block, product, and ticket aggregate UUIDs | One Shard35 reservation/birth command validates ownership, remaining units, and ticket epoch under the event lock |
| `drop_snapshot.artifact_ref` | BE00 immutable artifact UUID | Nullable until artifact acceptance; worker writes only the digest-matched artifact response |
| `walk_up_sale.terminal_payment_ref` | Card-provider authorization receipt UUID, deliberately opaque | Required only for `payment_kind='card'`; provider query-before-retry verifies amount/currency/event and idempotency key |
| `walk_up_sale.venue_float_line_id` | Finance cash-float ledger line UUID, a cross-domain logical reference | Required only for cash; finance adapter verifies event, seller, amount, and append-only ledger digest |
| `walk_up_sale.device_id` | Shard33 box-office device UUID | Device/window authority seam binds the seller, event, and active sales window |

### Exhaustive typed table definitions

~~~sql
CREATE TABLE boxoffice_private.box_office_count (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 event_id uuid NOT NULL, version bigint NOT NULL CHECK(version>0),
 paid_count integer NOT NULL CHECK(paid_count>=0), comp_count integer NOT NULL CHECK(comp_count>=0),
 scanned_count integer NOT NULL CHECK(scanned_count>=0), admitted_count integer NOT NULL CHECK(admitted_count>=0),
 remaining_count integer NOT NULL CHECK(remaining_count>=0), capacity_count integer NOT NULL CHECK(capacity_count>=0),
 sources jsonb NOT NULL CHECK(jsonb_typeof(sources)='array' AND jsonb_array_length(sources) BETWEEN 1 AND 20),
 consistency text NOT NULL CHECK(consistency IN ('consistent','provisional','unknown','disputed')),
 source_digest text NOT NULL CHECK(source_digest ~ '^[a-f0-9]{64}$'),
 generated_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(admitted_count<=scanned_count), CHECK(paid_count+comp_count+remaining_count<=capacity_count),
 UNIQUE(event_id,version)
);
CREATE TABLE boxoffice_private.drop_snapshot (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 event_id uuid NOT NULL, count_version_id uuid NOT NULL REFERENCES boxoffice_private.box_office_count(id),
 recipient_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 scope text NOT NULL CHECK(scope IN ('paid_and_admissions_floor','full_operator','finance_deal')),
 scoped_counters jsonb NOT NULL CHECK(jsonb_typeof(scoped_counters)='object'),
 source_digest text NOT NULL CHECK(source_digest ~ '^[a-f0-9]{64}$'),
 freshness text NOT NULL CHECK(freshness IN ('live','fresh','stale','unknown')),
 movement jsonb NOT NULL CHECK(jsonb_typeof(movement)='object'),
 previous_drop_id uuid NULL REFERENCES boxoffice_private.drop_snapshot(id),
 delivery_channel text NOT NULL CHECK(delivery_channel IN ('in_app','email_artifact','download')),
 artifact_ref uuid NULL, delivered_at timestamptz NULL,
 version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(event_id,recipient_party_id,scope,version)
);
CREATE TABLE boxoffice_private.pacing_evaluation (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 event_id uuid NOT NULL, count_version_id uuid NOT NULL REFERENCES boxoffice_private.box_office_count(id),
 metric text NOT NULL CHECK(metric IN ('paid','admitted')),
 reference_kind text NOT NULL CHECK(reference_kind IN ('none','break_even','trajectory')),
 reference_payload jsonb NOT NULL CHECK(jsonb_typeof(reference_payload)='object'),
 alert_policy_version text NOT NULL CHECK(length(alert_policy_version) BETWEEN 1 AND 100),
 outcome text NOT NULL CHECK(outcome IN ('no_reference','silence','alert')),
 deviation_count integer NULL, direction text NULL CHECK(direction IN ('below','above')),
 action_code text NULL CHECK(action_code IN ('review_promotion','review_capacity','review_staffing','review_break_even')),
 evaluated_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((reference_kind='none')=(outcome='no_reference')),
 CHECK((outcome='alert')=(direction IS NOT NULL AND action_code IS NOT NULL))
);
CREATE TABLE boxoffice_private.walk_up_sale (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 event_id uuid NOT NULL, manifest_unit_id uuid NOT NULL, inventory_block_id uuid NOT NULL,
 ticket_product_id uuid NOT NULL, ticket_id uuid NOT NULL, ticket_epoch bigint NOT NULL CHECK(ticket_epoch>0),
 payment_kind text NOT NULL CHECK(payment_kind IN ('cash','card')),
 all_in_price_minor bigint NOT NULL CHECK(all_in_price_minor>=0),
 currency char(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 terminal_payment_ref uuid NULL, venue_float_line_id uuid NULL,
 operator_party_id uuid NOT NULL REFERENCES platform_private.party(id), device_id uuid NOT NULL,
 state text NOT NULL CHECK(state IN ('admitted','admitted_pending_sync','reconciled','refunded')),
 oversell_state text NOT NULL CHECK(oversell_state IN ('none','authorized_offline_block_oversell')),
 admitted_at_birth boolean NOT NULL DEFAULT true CHECK(admitted_at_birth),
 platform_held_cash boolean NOT NULL DEFAULT false CHECK(NOT platform_held_cash),
 version bigint NOT NULL CHECK(version>0), sold_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((payment_kind='card')=(terminal_payment_ref IS NOT NULL)),
 CHECK((payment_kind='cash')=(venue_float_line_id IS NOT NULL)),
 UNIQUE(event_id,manifest_unit_id), UNIQUE(ticket_id)
);
CREATE TABLE boxoffice_private.box_office_close (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 event_id uuid NOT NULL, count_version_id uuid NOT NULL REFERENCES boxoffice_private.box_office_count(id),
 certified_counters jsonb NOT NULL CHECK(jsonb_typeof(certified_counters)='object'),
 device_states jsonb NOT NULL CHECK(jsonb_typeof(device_states)='array'),
 float_lines jsonb NOT NULL CHECK(jsonb_typeof(float_lines)='array'),
 exception_codes text[] NOT NULL DEFAULT '{}',
 operator_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 operator_statement_version text NOT NULL CHECK(length(operator_statement_version) BETWEEN 1 AND 100),
 counterparty_attestation_state text NOT NULL CHECK(counterparty_attestation_state IN ('pending','accepted','disputed','lapsed','not_required')),
 reconciliation_state text NOT NULL CHECK(reconciliation_state IN ('reconciled','unreconciled','disputed')),
 settlement_finality text NOT NULL CHECK(settlement_finality IN ('eligible','blocked_unknown','blocked_disputed')),
 close_policy_version text NOT NULL CHECK(length(close_policy_version) BETWEEN 1 AND 100),
 version bigint NOT NULL CHECK(version>0), certified_at timestamptz NOT NULL,
 supersedes_close_id uuid NULL REFERENCES boxoffice_private.box_office_close(id),
 digest text NOT NULL UNIQUE CHECK(digest ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((settlement_finality='eligible')=(reconciliation_state='reconciled')),
 UNIQUE(event_id,version)
);
~~~

BoxOfficeCount, DropSnapshot, WalkUpSale, and BoxOfficeClose are represented exactly by their snake-case tables. Count/drop/close rows are append-only. Walk-up correction uses linked refund/unadmission facts, not destructive delete.

### Indexes, RLS, grants

| Tables | Indexes | RLS | Grants |
|---|---|---|---|
| box_office_count | (event_id,version DESC); consistency; generated_at | operator/deal projection; performing-act scoped view | count_worker INSERT; boxoffice_api scoped SELECT |
| drop_snapshot | (recipient_party_id,event_id,version DESC); count version; delivery pending partial | exact recipient/scope or operator | drop command INSERT/SELECT; delivery worker artifact-only |
| pacing_evaluation | (event_id,evaluated_at DESC); outcome/action partial | operator or performing-act deal role | pacing command; notification worker alert-only |
| walk_up_sale | (event_id,sold_at); operator/device; float line; state | seller own/lead; finance float grant | walkup command INSERT; no direct DML |
| box_office_close | (event_id,version DESC); reconciliation/finality; counterparty pending | operator, named counterparty/deal role | close/counter-attest functions only; settlement worker finality read |

All tables ENABLE/FORCE RLS. Transaction context includes party/event/deal/device/mandate/purpose. migration_role owns; no direct client DML and no public DML. Security-definer functions pin search_path/row_security and revoke PUBLIC.

### Retention and Deletion

- Count and close versions, walk-up fiscal evidence, and float exceptions follow show/deal fiscal retention and legal hold; deletion never rewrites certified history.
- Drop artifacts expire by recipient/deal policy; immutable count/scope/digest and delivery audit remain for the deal retention period.
- Pacing evaluations expire after 90 days unless referenced by a close/evidence hold.
- Walk-up delivery references deidentify after support/refund windows where lawful; cash/card credentials are never stored.

## State, Middleware, Concurrency, and Seams

| Aggregate | States | Rule |
|---|---|---|
| Count | provisional/unknown/disputed → consistent/reconciled successor | Never overwrite a version; gate-observed scanned remains platform source |
| Drop | created → delivered/failed delivery projection | Snapshot immutable; scope change forward-only |
| Walk-up | admitted_pending_sync/admitted → reconciled/refunded | Ticket admitted at birth; authorized offline oversell honored |
| Close | certified pending → accepted/disputed/lapsed successor | Single-party/lapsed labeled unreconciled; settlement blocked |

Per-operation middleware matrix:

| Op | CORS | Auth | Rate | Validation/idempotency |
|---|---|---|---|---|
| 36.06 | first-party-read | scoped count role | 180/min/event | strict query; rejects idempotency |
| 36.07 | first-party-write | operator/deal drop grant | 30/min/event | 64 KiB; If-Match; 24h |
| 36.08 | first-party-write | operator/act deal role | 60/min/event | 64 KiB; 24h |
| 36.09 | first-party-write | seller/device/window grant | 300/min/window | 64 KiB; 7d |
| 36.10 | first-party-write | lead + recent step-up | 6/hour/event | 512 KiB; If-Match; 7d |

Lock order: event sales gate → manifest unit/device → count version → close version → idempotency. Serializable retry twice 25/75 ms; no partial sale/count/close/outbox.

### Operation flows

| Op | Flow |
|---|---|
| 36.06 | Authorize projection → transactionally load latest source versions → materialize/return permitted fields and finality |
| 36.07 | Lock count version → resolve deal scope → compute movement → insert drop/delivery job/idempotency |
| 36.08 | Validate reference version → compare metric → append no-reference/silence/alert and optional job |
| 36.09 | Lock online/preallocated unit → verify all-in price/payment → create ticket/admission/float/sale atomically; offline sync honors authorized block |
| 36.10 | Step-up → acquire sales drain → validate device states/count/float → append close/outbox/counter-attest job → release drain after commit |

### External seams

| Seam | Request → response | Timeout/retry/circuit |
|---|---|---|
| 36a gate projection | {eventId,throughWatermark} → {scanned,admitted,conflicts,devices,version,digest} | Timeout 1,500 ms; 1 retry with 100 ms backoff; circuit opens for 30,000 ms after 5 consecutive failures; count becomes unknown |
| Shard35 sales/inventory | {eventId,version} → {paid,comp,remaining,capacity,sourceVersion,digest}; walkup command → {ticketId,epoch} | Timeout 2,000 ms; 2 retries with 200/800 ms backoff; circuit opens for 60,000 ms after 5 consecutive failures; reads stale-labeled, writes fail or use an authorized offline block |
| Shard33 device/window | {eventId,deviceIds,salesDrainToken} → {states,quiesced,version} | Timeout 1,500 ms; 1 retry with 100 ms backoff; circuit opens for 30,000 ms after 5 consecutive failures; close blocks |
| Card terminal | {terminalPaymentRef,amountMinor,currency,eventId} → {state=authorized,captureRef} | Timeout 5,000 ms; query before 2 retries with 1,000/4,000 ms backoff; circuit opens for 120,000 ms after 5 consecutive failures; no duplicate charge |
| Notification/artifact | {jobId,recipient,scope,dataDigest} → {receipt/artifactRef} | Timeout 5,000 ms for enqueue and 15,000 ms for artifact generation; 3 retries with 5,000/30,000/180,000 ms backoff; circuit opens for 120,000 ms after 5 consecutive failures; failed delivery stays explicit |

## Event Contracts

~~~ts
export const BoxOfficeCountVersionedEvent=z.object({
 eventId:Uuid,countVersionId:Uuid,version:Version,counters:CounterSet,
 sources:z.array(CounterSource).min(1).max(20),
 consistency:z.enum(["consistent","provisional","unknown","disputed"]),
 sourceDigest:Sha256,generatedAt:Instant
}).strict(); // boxoffice.count.versioned
export const BoxOfficeCloseChangedEvent=z.object({
 eventId:Uuid,closeId:Uuid,version:Version,
 deviceStateDigest:Sha256,floatStateDigest:Sha256,attestationState:z.enum(["pending","accepted","disputed","lapsed","not_required"]),
 reconciliationState:z.enum(["reconciled","unreconciled","disputed"]),
 settlementFinality:z.enum(["eligible","blocked_unknown","blocked_disputed"]),
 exceptionCodes:z.array(z.string().regex(/^[A-Z0-9_]{1,64}$/)).max(100),
 occurredAt:Instant
}).strict(); // boxoffice.close.changed
~~~

Events exclude fan rows, device PII, delivery targets, cash/card refs, and deal money.

## Errors, Failure Recovery, and Observability

### Per-operation error matrix

| Op | BE00 ApiError { code, message, requestId, details } | Recovery |
|---|---|---|
| 36.06 | COUNTER_UNKNOWN; COUNTER_DISPUTED; SOURCE_STALE; PROJECTION_FORBIDDEN | Return labeled snapshot/finality; never fan counts |
| 36.07 | COUNT_VERSION_CHANGED; DROP_SCOPE_FORBIDDEN; RECIPIENT_NOT_ELIGIBLE | Refresh version/scope; prior drops stay |
| 36.08 | REFERENCE_UNAVAILABLE; REFERENCE_VERSION_CHANGED; COUNT_VERSION_CHANGED | Return no_reference or refresh; no invented alert |
| 36.09 | WINDOW_CLOSED; INVENTORY_BLOCK_EXHAUSTED; PRICE_CHANGED; PAYMENT_UNCERTAIN | Refresh/hold; authorized offline oversell later reconciles |
| 36.10 | DEVICE_UNRECONCILED; SALE_DRAINING; COUNTER_UNKNOWN; FLOAT_MISMATCH; PREVIEW_STALE | Reconcile/write off with reason; no false finality |

Failure recovery matrix:

| Failure | Recovery |
|---|---|
| Count source outage | Last version becomes stale/unknown; settlement and close finality block |
| Offline oversell | Honor tickets from authorized block; append oversell exception/reconciliation |
| Cash variance | Preserve typed float variance and exception; platform never invents cash custody |
| Single-party/lapsed close | Immutable labeled close remains unreconciled; counterparty may append successor |
| Outbox/provider failure | Domain/outbox atomic; retry; delivery/card uncertainty explicit |

Per-operation observability matrix:

| Op | Safe fields/metric | SLO |
|---|---|---|
| 36.06 | opId,eventId,projection,sourceClass,freshness,consistency; count_read_total | p95 500 ms; unknown >2% alerts |
| 36.07 | opId,scope,freshness,movementClass,deliveryState; drop_total | p95 1 s; backlog >5 min |
| 36.08 | opId,metric,referenceKind,outcome,direction; pacing_total | p95 750 ms; false-claim invariant pages |
| 36.09 | opId,paymentKind,state,oversellState; walkup_total | p95 2 s card/500 ms cash; duplicate-charge pages |
| 36.10 | opId,deviceCount,reconciliationState,finality,exceptionCount; close_total | p95 5 s; finality invariant pages |

## Release and Testing

Deploy schemas/RLS/event registrations before writers. Feature flags gate drops/pacing/walk-up/close independently. Recovery verifies counter source digests, manifest uniqueness, float equations, close versions, finality, outbox, and RLS.

### Per-operation Tests

| Op | Contract/success | Auth/CORS/ApiError | Race/recovery |
|---|---|---|---|
| 36.06 | Distinct counters/source/freshness | fan denied/concealed, role field floor | source race returns consistent version |
| 36.07 | Immutable scoped movement | recipient/scope/If-Match | concurrent drop one version; delivery retry |
| 36.08 | alert/silence/no-reference exact | reference hidden and strict body | changed count/reference blocks |
| 36.09 | cash/card all-in admission | seller/device/window isolation | offline block oversell honored; card query-before-retry |
| 36.10 | certified float/device/finality | lead step-up and exact errors | drain/device race blocks; counter successor |

Additional tests cover Zod/OpenAPI, every SQL constraint/index/RLS role, property counter/float equations, immutable events/outbox, payment fault injection, load, accessible count/drop artifacts, and PII/log denylist.

## Deepening Passes

| Pass | Evidence |
|---|---|
| Integrity | Counter separation, source/freshness, immutable drops, all-in sale, float math, close/finality enforced |
| Security | Fan exclusion, projection floors, event/deal/device RLS, CORS/CSRF/step-up |
| Reliability | Sales drain, lock order, offline inventory, payment uncertainty, outbox/circuits/recovery |
| Auditability | Five operation IDs key contracts, middleware, errors, observability, and tests |

## Ambiguity Gate

**PASS.** Interactions 36.06–36.10, CloseBoxOffice, BoxOfficeCount, DropSnapshot, WalkUpSale, BoxOfficeClose, feature 19.05, and both canonical events are fully specified. Every operation has a unique route and explicit BE00 ApiError, CORS, authorization, validation, rate, idempotency, SQL/RLS/grants, failure recovery, observability, and tests. No macro or micro ambiguity remains.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Initial production-grade 36b backend contract | /write-be-spec | All |
| 2026-08-29 | Declared 36.06 pagination N/A and exact nested response caps | D8 remediation | Request and Response Contracts |

## Dependency References

- [BE00](00-infrastructure.md)
- [IA06](../ia/06-trust-safety.md)
- [IA33](../ia/33-show-day-operations.md)
- [IA35](../ia/35-ticket-products-sales.md)
- [36a](36a-door-replicas-scans-age.md)
- [36c](36c-ticket-refunds-event-changes.md)
- [36d](36d-external-counts-attestation-reconciliation.md)
- [36e](36e-ticket-limits-transfer-exchange-consent.md)
