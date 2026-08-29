# Ticket Refunds & Event Changes — Backend Specification

**Status:** Complete

**IA source:** [Shard 36](../ia/36-box-office-risk.md)

**Platform contract:** [BE00](00-infrastructure.md)

## Classification

| Dimension | Decision |
|---|---|
| Classification | Multi-domain companion 36c: individual refund/exchange resolution, irreversible event cancellation, reschedule/postpone, opt-out windows, and refund obligations |
| Included interactions | 36.11–36.13 |
| Included feature | 19.06 Refunds, Cancellations & Rescheduling |
| Canonical contracts | ResolveRefund; CancelTicketedEvent; RescheduleEvent |
| Canonical models | RefundObligation; EventChange |
| Boundary | Change commitment is independent of refund rails; original all-in amount is owed; one obligation per ticket; platform does not silently substitute refund destination |

## Referenced Material Inventory

| Material | Source | Use |
|---|---|---|
| Refund/change decisions | [IA36 lines 7–44](../ia/36-box-office-risk.md#overview) | All-in refund, irreversible cancellation, TBC conversion, second-change restart |
| Feature/criteria | [IA36 lines 46–77](../ia/36-box-office-risk.md#features) | 19.06, AC-36.11–36.13 |
| Interactions | [IA36 lines 79–103](../ia/36-box-office-risk.md#interactions) | Exact preconditions/results/failures |
| Contracts/models | [IA36 lines 105–170](../ia/36-box-office-risk.md#contracts) | Three commands and two canonical aggregates |
| Roles/events/edges | [IA36 lines 172–272](../ia/36-box-office-risk.md#access-control) | Fan/holder/payer/finance, two events, rail failure/dead method |
| Dependencies | [IA36 lines 274–285](../ia/36-box-office-risk.md#cross-shard-dependencies) | BE00, IA06, IA33, IA35 |
| Global contracts | [BE00 lines 112–500](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) | ApiError, strict Zod 4, step-up/idempotency/events/recovery |

## IA Source Map

| Op | Interaction | Backend result |
|---|---|---|
| 36.11 | Request individual refund/exchange | Automatic/excluded/discretionary decision or atomic exchange; one RefundObligation |
| 36.12 | Cancel event | Irreversible EventChange and per-ticket obligations commit before rail attempts |
| 36.13 | Reschedule/postpone | Successor date/TBC deadline, wallet updates, and full opt-out window |

### Canonical identifier registry

| Kind | Exact identifiers |
|---|---|
| Interactions | 36.11 Request individual refund/exchange; 36.12 Cancel event; 36.13 Reschedule/postpone |
| Contracts | ResolveRefund; CancelTicketedEvent; RescheduleEvent |
| Models | RefundObligation; EventChange |
| Events | ticketing.refund.obligation_changed; ticketing.event_change.committed |

## Endpoint Completeness Reconciliation

| Op | Responsibility | Durable effect |
|---|---|---|
| 36.11 | Resolve policy/scan/payer state and create/return one obligation or atomic exchange | refund_obligation, refund_attempt or Shard35 exchange |
| 36.12 | Verify step-up/preview, commit terminal cancellation, create all obligations, enqueue rail/delivery | event_change, refund_obligation set, outbox |
| 36.13 | Commit scheduled/TBC successor, restart opt-out window, schedule TBC conversion | event_change and change_opt_out_window |

Refund obligation is distinct from commercial cancellation allocation in other domains. Cancellation never waits for or rolls back because of a payment provider.

## Shared Contract Inheritance

All BE00 security, auth, CORS, CSRF, request IDs, step-up, idempotency, ETags, jobs, outbox, errors, logs, and recovery apply. Exact error wire:

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
| 36.11 | POST /api/v1/ticketing/refund-resolutions | Holder/payer or finance role | BE00-CORS-WEB-CREDENTIALLED | Discriminated JSON, If-Match | 20/min/account | Required 30d | 200/201 |
| 36.12 | POST /api/v1/ticketing/events/{eventId}/cancellations | Event operator with recent step-up | BE00-CORS-WEB-CREDENTIALLED | Path, preview hash, If-Match | 2/hour/event | Required 30d | 201 |
| 36.13 | POST /api/v1/ticketing/events/{eventId}/changes | Event operator with recent step-up | BE00-CORS-WEB-CREDENTIALLED | Scheduled/TBC union, If-Match | 6/hour/event | Required 30d | 201 |

BE00-CORS-WEB-CREDENTIALLED is exact-origin credentialed CORS; allowed headers are Content-Type, X-CSRF-Token, Idempotency-Key, If-Match. BE00 owns OPTIONS.

### Operation Contract Matrix

| Op | Request | Success | Failure |
|---|---|---|---|
| 36.11 | ResolveRefundRequest plus VersionedHeaders | ResolveRefundResult | BE00 ApiError { code, message, requestId, details } |
| 36.12 | CancelTicketedEventRequest plus VersionedHeaders | CancelTicketedEventResult | BE00 ApiError { code, message, requestId, details } |
| 36.13 | RescheduleEventRequest plus VersionedHeaders | RescheduleEventResult | BE00 ApiError { code, message, requestId, details } |

## Request/Success Contracts — Zod 4

~~~ts
import {z} from "zod";
const Uuid=z.uuid(), Instant=z.iso.datetime({offset:true}), DateOnly=z.iso.date();
const Currency=z.string().regex(/^[A-Z]{3}$/), Version=z.int().positive();
const Sha256=z.string().regex(/^[a-f0-9]{64}$/);
const NonNegativeMoney=z.int().min(0).max(9_000_000_000_000_000);
const VersionedHeaders=z.object({
 "idempotency-key":z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
 "x-csrf-token":z.string().min(32).max(512),
 "if-match":z.string().regex(/^"[1-9][0-9]*"$/)
}).strict();

export const ResolveRefund=z.object({
 ticketId:Uuid,
 ticketEpoch:Version,
 requestedByPartyId:Uuid,
 expectedHolderPartyId:Uuid,
 expectedPayerPartyId:Uuid,
 cause:z.enum(["policy_granted","event_cancelled","material_change","door_age_refusal","buyer_request","cash_walkup"]),
 policyVersion:z.string().min(1).max(100),
 expectedTicketState:z.enum(["issued","transferred","claimed","listed","unscanned"]),
}).strict();
export const ResolveRefundRequest=z.discriminatedUnion("requestedOutcome",[
 ResolveRefund.extend({requestedOutcome:z.literal("refund")}).strict(),
 ResolveRefund.extend({
  requestedOutcome:z.literal("exchange"),
  targetTicketProductId:Uuid,
  targetManifestUnitId:Uuid,
  acceptedPriceDifferenceMinor:z.int().min(-9_000_000_000_000_000).max(9_000_000_000_000_000),
 }).strict()
]);
export const RefundObligationSchema=z.object({
 obligationId:Uuid,ticketId:Uuid,eventId:Uuid,cause:z.enum(["policy_granted","event_cancelled","material_change","door_age_refusal","buyer_request","cash_walkup"]),
 payerPartyId:Uuid,holderPartyId:Uuid,originalPaymentMethodRef:Uuid,
 originalAllInAmountMinor:NonNegativeMoney,currency:Currency,
 outcomeClass:z.enum(["automatic","excluded","discretionary"]),
 state:z.enum(["open","rail_pending","rail_uncertain","discharged","alternative_required","lawful_unclaimed_process"]),
 providerControl:z.enum(["platform","external_provider","venue_cash"]),
 dischargeRef:Uuid.nullable(),version:Version,createdAt:Instant,dischargedAt:Instant.nullable(),
}).strict().superRefine((v,ctx)=>{
 if((v.state==="discharged")!==(v.dischargeRef!==null&&v.dischargedAt!==null))
  ctx.addIssue({code:"custom",path:["dischargeRef"],message:"discharge_evidence_required"});
});
export const ResolveRefundResult=z.union([
 z.object({
  outcome:z.literal("refund"),decision:z.literal("automatic"),obligation:RefundObligationSchema,
  refundAmountMinor:NonNegativeMoney,feeRetainedMinor:z.literal(0),
  destinationClass:z.enum(["original_method","venue_cash","provider_managed"]),replayed:z.boolean()
 }).strict().superRefine((v,ctx)=>{
  if(v.refundAmountMinor!==v.obligation.originalAllInAmountMinor)
   ctx.addIssue({code:"custom",path:["refundAmountMinor"],message:"automatic_refund_must_equal_original_all_in"});
  if(v.obligation.outcomeClass!=="automatic")
   ctx.addIssue({code:"custom",path:["obligation","outcomeClass"],message:"automatic_decision_requires_automatic_obligation"});
 }),
 z.object({
  outcome:z.literal("refund"),decision:z.literal("excluded"),obligation:z.null(),
  refundAmountMinor:z.literal(0),feeRetainedMinor:z.literal(0),
  destinationClass:z.enum(["original_method","venue_cash","provider_managed"]),replayed:z.boolean()
 }).strict(),
 z.object({
  outcome:z.literal("refund"),decision:z.literal("discretionary"),obligation:z.null(),
  refundAmountMinor:z.literal(0),feeRetainedMinor:z.literal(0),
  destinationClass:z.enum(["original_method","venue_cash","provider_managed"]),replayed:z.boolean()
 }).strict(),
 z.object({outcome:z.literal("exchange"),obligation:z.null(),oldTicketId:Uuid,newTicketId:Uuid,newTicketEpoch:Version,atomic:z.literal(true),priceDifferenceMinor:z.int(),replayed:z.boolean()}).strict()
]);

const BlastRadius=z.object({
 ticketCount:z.int().min(0).max(500_000),
 totalAllInMinor:NonNegativeMoney,
 currency:Currency,
 externalProviderTicketCount:z.int().min(0).max(500_000),
 cashTicketCount:z.int().min(0).max(500_000),
 inaccessibleRecipientCount:z.int().min(0).max(500_000),
 generatedAt:Instant,
 sourceVersion:Version,
 digest:Sha256,
}).strict();
export const CancelTicketedEvent=z.object({
 eventId:Uuid,
 preview:BlastRadius,
 reasonCode:z.enum(["operator_cancelled","venue_unavailable","safety","force_majeure","tbc_deadline_expired"]),
 policyVersion:z.string().min(1).max(100),
 requestedByPartyId:Uuid,
}).strict();
export const CancelTicketedEventRequest=CancelTicketedEvent.extend({
 expectedEventVersion:Version,
 acknowledgeIrreversible:z.literal(true),
}).strict();
export const EventChangeSchema=z.object({
 changeId:Uuid,eventId:Uuid,
 changeKind:z.enum(["cancelled","rescheduled","postponed_tbc"]),
 predecessorChangeId:Uuid.nullable(),
 newStartAt:Instant.nullable(),tbcDeadline:Instant.nullable(),
 blastRadius:BlastRadius,optOutPolicyVersion:z.string().min(1).max(100).nullable(),
 optOutOpensAt:Instant.nullable(),optOutClosesAt:Instant.nullable(),
 state:z.enum(["committed","window_open","window_closed","converted_to_cancellation"]),
 committedByPartyId:Uuid,committedAt:Instant,version:Version,digest:Sha256,
}).strict().superRefine((v,ctx)=>{
 if(v.changeKind==="cancelled"&&(v.newStartAt!==null||v.tbcDeadline!==null))
  ctx.addIssue({code:"custom",path:["changeKind"],message:"cancel_has_no_successor_date"});
 if(v.changeKind==="rescheduled"&&v.newStartAt===null)
  ctx.addIssue({code:"custom",path:["newStartAt"],message:"required_for_reschedule"});
 if(v.changeKind==="postponed_tbc"&&v.tbcDeadline===null)
  ctx.addIssue({code:"custom",path:["tbcDeadline"],message:"required_for_tbc"});
 const hasWindow=v.optOutPolicyVersion!==null&&v.optOutOpensAt!==null&&v.optOutClosesAt!==null;
 if((v.changeKind!=="cancelled")!==hasWindow)
  ctx.addIssue({code:"custom",path:["optOutPolicyVersion"],message:"window_required_only_for_reschedule_or_tbc"});
 if(v.optOutOpensAt!==null&&v.optOutClosesAt!==null&&v.optOutOpensAt>=v.optOutClosesAt)
  ctx.addIssue({code:"custom",path:["optOutClosesAt"],message:"window_must_be_ordered"});
});
export const CancelTicketedEventResult=z.object({
 change:EventChangeSchema,
 obligationCount:z.int().min(0).max(500_000),
 obligationBatchId:Uuid,
 railJobCount:z.int().min(0).max(500_000),
 notificationJobId:Uuid,
 cancellationCommitted:z.literal(true),
 railFailureCanRollback:z.literal(false),
 replayed:z.boolean(),
}).strict().refine(v=>v.change.changeKind==="cancelled",{message:"cancellation_result_requires_cancelled_change"});

const OptOutPolicy=z.object({
 policyVersion:z.string().min(1).max(100),
 windowDurationHours:z.int().min(1).max(8760),
 opensAt:Instant,
 closesAt:Instant,
 refundBasis:z.literal("original_all_in"),
}).strict().refine(v=>v.opensAt<v.closesAt,{message:"optout_window_must_be_ordered"});
export const RescheduleEvent=z.discriminatedUnion("changeKind",[
 z.object({changeKind:z.literal("rescheduled"),eventId:Uuid,newStartAt:Instant,optOutPolicy:OptOutPolicy,reasonCode:z.string().regex(/^[A-Z0-9_]{1,64}$/)}).strict(),
 z.object({changeKind:z.literal("postponed_tbc"),eventId:Uuid,tbcDeadline:Instant,optOutPolicy:OptOutPolicy,reasonCode:z.string().regex(/^[A-Z0-9_]{1,64}$/)}).strict()
]);
export const RescheduleEventRequest=z.object({
 change:RescheduleEvent,
 preview:BlastRadius,
 expectedEventVersion:Version,
 requestedByPartyId:Uuid,
 acknowledgeMaterialChange:z.literal(true),
}).strict();
export const RescheduleEventResult=z.object({
 change:EventChangeSchema,
 optOutWindowId:Uuid,
 walletUpdateJobId:Uuid,
 notificationJobId:Uuid,
 tbcConversionJobId:Uuid.nullable(),
 fullWindowRestarted:z.literal(true),
 replayed:z.boolean(),
}).strict().superRefine((v,ctx)=>{
 if((v.change.changeKind==="postponed_tbc")!==(v.tbcConversionJobId!==null))
  ctx.addIssue({code:"custom",path:["tbcConversionJobId"],message:"required_only_for_tbc"});
});
~~~

### Invariants

| Op | Rule |
|---|---|
| 36.11 | Refund requires unscanned/current epoch; automatic policy/event cancellation pays exact original all-in to original method; exchange invalidates old ticket and allocates new atomically |
| 36.12 | Step-up and fresh preview hash/version are required; cancellation/event obligations commit in one DB transaction; rails begin only after commit |
| 36.13 | New date or finite TBC deadline required; every material/second change creates a fresh full opt-out window; expired TBC invokes 36.12 with deterministic cause |

## Authorization, Ownership, and Disclosure

| Actor | Allowed | Denied |
|---|---|---|
| Current holder | Request exchange/refund where policy allows; view change/obligation | Change payer destination or other tickets |
| Original payer | Receive refunds and change notices; view own obligation | Override current holder logistics or choose unsupported destination |
| Event operator | 36.12/13 with event grant and step-up | Roll back cancellation, retain fees, mark obligations discharged |
| Finance/refund role | Process rail/alternative incident under exact obligation | Door lookup, change event state, silently issue platform credit |
| External provider worker | Update provider-owned attempt only | Claim platform control over external ticket/refund |
| Support | Purpose-bound mechanical recovery | Change policy entitlement, payer identity, amount, or terminal change |

Resource invisibility returns 404 with details={}; visible but denied returns 403. Step-up returns 401 only after base authority. Holder/payer views disclose only own ticket/obligation. Blast radius aggregates contain no attendee rows. Payment method is opaque ref; no card/bank data enters request, logs, events, or artifacts.

## Database Schema

Restricted ticketing_private schema. Party FKs target platform_private.party(id); Shard35 ticket/event/product/payment refs are logical versioned refs.

| Logical reference fields | Target or non-FK meaning | Enforcement |
|---|---|---|
| `refund_obligation.ticket_id`, `refund_obligation.event_id`, `event_change.event_id`, `change_opt_out_window.event_id` | Shard35 ticket and event aggregates | Ticket/event version seams validate payer, holder, scan state, and same-event ownership before command locks |
| `refund_obligation.original_payment_method_ref` | Shard35 purchase payment-method capability UUID | Immutable original destination; refund provider receives the reference only through a scoped server capability |
| `refund_obligation.discharge_ref` | Immutable provider/cash discharge-evidence UUID | Required exactly in `discharged`; command verifies amount, currency, obligation, and final provider state |
| `refund_attempt.provider_receipt_ref` | External refund-provider receipt UUID, deliberately opaque | Nullable until provider supplies a safe receipt; uniqueness and request key prevent receipt reuse |
| `change_opt_out_window.tbc_conversion_job_id` | BE00 durable scheduler job UUID | Nullable before scheduling; scheduler response must match the window/action/digest before storage |

### Exhaustive typed tables

~~~sql
CREATE TABLE ticketing_private.refund_obligation (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 ticket_id uuid NOT NULL, event_id uuid NOT NULL,
 cause text NOT NULL CHECK(cause IN ('policy_granted','event_cancelled','material_change','door_age_refusal','buyer_request','cash_walkup')),
 payer_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 original_payment_method_ref uuid NOT NULL,
 original_all_in_amount_minor bigint NOT NULL CHECK(original_all_in_amount_minor>=0),
 currency char(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 outcome_class text NOT NULL CHECK(outcome_class IN ('automatic','excluded','discretionary')),
 state text NOT NULL CHECK(state IN ('open','rail_pending','rail_uncertain','discharged','alternative_required','lawful_unclaimed_process')),
 provider_control text NOT NULL CHECK(provider_control IN ('platform','external_provider','venue_cash')),
 policy_version text NOT NULL CHECK(length(policy_version) BETWEEN 1 AND 100),
 discharge_ref uuid NULL, discharged_at timestamptz NULL,
 version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((state='discharged')=(discharge_ref IS NOT NULL AND discharged_at IS NOT NULL)),
 UNIQUE(ticket_id)
);
CREATE TABLE ticketing_private.refund_attempt (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 obligation_id uuid NOT NULL REFERENCES ticketing_private.refund_obligation(id),
 attempt_number integer NOT NULL CHECK(attempt_number>0),
 destination_class text NOT NULL CHECK(destination_class IN ('original_method','venue_cash','provider_managed','verified_alternative')),
 amount_minor bigint NOT NULL CHECK(amount_minor>=0), currency char(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 provider_request_key text NOT NULL CHECK(length(provider_request_key) BETWEEN 16 AND 128),
 provider_receipt_ref uuid NULL,
 state text NOT NULL CHECK(state IN ('queued','submitted','uncertain','succeeded','failed','manual_incident')),
 failure_class text NULL CHECK(failure_class IS NULL OR failure_class ~ '^[A-Z0-9_]{1,64}$'),
 created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz NULL,
 UNIQUE(obligation_id,attempt_number), UNIQUE(provider_request_key)
);
CREATE TABLE ticketing_private.event_change (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 event_id uuid NOT NULL,
 change_kind text NOT NULL CHECK(change_kind IN ('cancelled','rescheduled','postponed_tbc')),
 predecessor_change_id uuid NULL REFERENCES ticketing_private.event_change(id),
 new_start_at timestamptz NULL, tbc_deadline timestamptz NULL,
 blast_radius jsonb NOT NULL CHECK(jsonb_typeof(blast_radius)='object'),
 preview_digest text NOT NULL CHECK(preview_digest ~ '^[a-f0-9]{64}$'),
 reason_code text NOT NULL CHECK(reason_code ~ '^[A-Z0-9_]{1,64}$'),
 opt_out_policy_version text NULL CHECK(opt_out_policy_version IS NULL OR length(opt_out_policy_version) BETWEEN 1 AND 100),
 opt_out_opens_at timestamptz NULL, opt_out_closes_at timestamptz NULL,
 state text NOT NULL CHECK(state IN ('committed','window_open','window_closed','converted_to_cancellation')),
 committed_by_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 committed_at timestamptz NOT NULL, version bigint NOT NULL CHECK(version>0),
 digest text NOT NULL UNIQUE CHECK(digest ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(change_kind<>'cancelled' OR (new_start_at IS NULL AND tbc_deadline IS NULL)),
 CHECK(change_kind<>'rescheduled' OR new_start_at IS NOT NULL),
 CHECK(change_kind<>'postponed_tbc' OR tbc_deadline IS NOT NULL),
 CHECK((change_kind<>'cancelled')=(opt_out_policy_version IS NOT NULL AND opt_out_opens_at IS NOT NULL AND opt_out_closes_at IS NOT NULL)),
 CHECK(opt_out_opens_at IS NULL OR opt_out_closes_at>opt_out_opens_at),
 UNIQUE(event_id,version)
);
CREATE TABLE ticketing_private.change_opt_out_window (
 id uuid PRIMARY KEY, owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
 event_change_id uuid NOT NULL REFERENCES ticketing_private.event_change(id),
 event_id uuid NOT NULL, policy_version text NOT NULL CHECK(length(policy_version) BETWEEN 1 AND 100),
 opens_at timestamptz NOT NULL, closes_at timestamptz NOT NULL CHECK(closes_at>opens_at),
 refund_basis text NOT NULL CHECK(refund_basis='original_all_in'),
 tbc_conversion_job_id uuid NULL,
 state text NOT NULL CHECK(state IN ('scheduled','open','closed','converted')),
 version bigint NOT NULL CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(event_change_id)
);
~~~

RefundObligation and EventChange map exactly to refund_obligation/event_change. Event changes are append-only; cancellation cannot transition back. Obligation state changes append audit/provider attempt evidence and use version-checked functions; ticket uniqueness ensures one obligation.

### Indexes, RLS, grants

| Tables | Indexes | RLS | Grants |
|---|---|---|---|
| refund_obligation | ticket unique; (payer_party_id,state); (holder_party_id,state); event/state | payer/holder own, exact finance mandate, provider partition | refund command; finance worker versioned state function; no direct client DML |
| refund_attempt | (obligation_id,attempt_number); state/created partial; provider key | payer sees safe projection; finance/provider worker exact obligation | refund_worker INSERT/update safe columns |
| event_change | (event_id,version DESC); kind/state; predecessor | event operator; affected holder/payer projection through function | change command INSERT only; delivery/refund workers scoped read |
| change_opt_out_window | (event_id,state,closes_at); conversion job | affected ticket party and event operator | scheduler transition function; refund resolver read |

All tables ENABLE/FORCE RLS; transaction context includes party/event/ticket/mandate/purpose. migration_role owns, public/client roles get no table DML, security-definer functions pin search_path/row_security and revoke PUBLIC.

### Retention and Deletion

- Refund obligations never silently expire; they persist until discharge or counsel-authorized unclaimed-funds state plus applicable fiscal/legal retention.
- Terminal event changes, preview digests, and opt-out versions remain immutable for ticket/dispute retention; optional operator linkage deidentifies where lawful.
- Provider attempt payloads are not stored; safe receipts/failure classes persist with the obligation, and transient rail responses expire within 30 days.
- Erasure removes non-required delivery metadata but cannot falsify cancellation, payer obligation, or discharge evidence.

## State, Middleware, and Data Flow

| Aggregate | State machine | Recovery |
|---|---|---|
| Obligation | open → rail_pending → discharged; pending → uncertain/alternative_required; counsel-gated lawful_unclaimed_process | Never silently expires; failed rail leaves open |
| Event change | none/rescheduled/TBC → immutable successor; any nonterminal → cancelled; cancellation terminal | Second change new version/window; TBC scheduler calls cancellation |
| Window | scheduled/open → closed or converted | Opt-out accepted until authoritative closesAt |

Per-operation middleware matrix:

| Op | CORS | Auth | Rate | Validation/idempotency |
|---|---|---|---|---|
| 36.11 | first-party-write | holder/payer/finance scope | 20/min/account | 64 KiB, If-Match, 30d |
| 36.12 | first-party-write | operator + recent step-up | 2/hour/event | 128 KiB, preview/If-Match, 30d |
| 36.13 | first-party-write | operator + recent step-up | 6/hour/event | 128 KiB union/If-Match, 30d |

Lock order event terminal state → ticket epoch/scan state → obligation unique key → inventory exchange → idempotency. Serializable retry twice 25/75 ms.

### Operation flows

| Op | Flow |
|---|---|
| 36.11 | Authorize party → lock ticket/epoch/scan/obligation → resolve exact policy → create/return obligation and job or atomically exchange Shard35 allocation/epoch → commit |
| 36.12 | Step-up → recompute blast radius/digest → lock event terminal state → insert cancellation + obligations batch + outbox/jobs atomically → commit → rails execute asynchronously |
| 36.13 | Step-up → validate date/TBC/policy → lock event version → append change/window/jobs → wallet/delivery async; TBC expiry invokes idempotent 36.12 |

### External seams

| Seam | Request → response | Timeout/retry/circuit |
|---|---|---|
| Shard35 ticket snapshot | {ticketId,epoch,purpose} → {event,holder,payer,scanState,allIn,methodRef,providerControl,version} | Timeout 1,500 ms; 1 retry with 100 ms backoff; circuit opens for 30,000 ms after 5 consecutive failures; mutation blocks |
| Shard35 atomic exchange | {oldTicket,targetUnit,expectedEpoch,priceDifference,idempotencyKey} → {oldInvalidated,newTicket,newEpoch} | Timeout 3,000 ms; query before 2 retries with 250/1,000 ms backoff; circuit opens for 60,000 ms after 5 consecutive failures; unknown returns dependency uncertainty |
| 36a scan read | {ticketId,epoch} → {admitted,latestScanVersion} | Timeout 1,000 ms; 1 retry with 100 ms backoff; circuit opens for 30,000 ms after 5 consecutive failures; individual refund blocks unknown |
| Refund provider | {obligationId,methodRef,amount,currency,providerRequestKey} → {state,receiptRef} | Timeout 10,000 ms; query before 3 retries with 1,000/5,000/30,000 ms backoff; circuit opens for 120,000 ms after 5 consecutive failures; uncertain halts duplicate |
| Wallet/delivery | {eventChangeId,affectedRefs,templateVersion} → {jobId,acceptedCount} | Timeout 5,000 ms; 3 retries with 5,000/30,000/180,000 ms backoff; circuit opens for 120,000 ms after 5 consecutive failures; change remains committed |
| Scheduler | {windowId,runAt,action,tbcDigest} → {jobId} | Timeout 2,000 ms; 3 retries with 1,000/5,000/30,000 ms backoff; circuit opens for 60,000 ms after 5 consecutive failures; scheduler failure pages and reconciliation scan catches overdue work |

## Event Contracts

~~~ts
export const RefundObligationChangedEvent=z.object({
 ticketId:Uuid,obligationId:Uuid,cause:z.enum(["policy_granted","event_cancelled","material_change","door_age_refusal","buyer_request","cash_walkup"]),
 amountMinor:NonNegativeMoney,currency:Currency,destinationClass:z.enum(["original_method","venue_cash","provider_managed","verified_alternative"]),
 state:z.enum(["open","rail_pending","rail_uncertain","discharged","alternative_required","lawful_unclaimed_process"]),
 version:Version,occurredAt:Instant
}).strict(); // ticketing.refund.obligation_changed
export const EventChangeCommittedEvent=z.object({
 eventId:Uuid,changeId:Uuid,changeKind:z.enum(["cancelled","rescheduled","postponed_tbc"]),
 blastRadiusDigest:Sha256,affectedTicketCount:z.int().min(0).max(500_000),
 optOutOpensAt:Instant.nullable(),optOutClosesAt:Instant.nullable(),tbcDeadline:Instant.nullable(),
 version:Version,committedAt:Instant
}).strict(); // ticketing.event_change.committed
~~~

No attendee rows, payment details, delivery targets, or free-text reason.

## Error, Recovery, Observability

### Per-operation errors

| Op | BE00 ApiError { code, message, requestId, details } | Recovery |
|---|---|---|
| 36.11 | ALREADY_SCANNED; ALREADY_REFUNDED; POLICY_EXCLUDED; TICKET_EPOCH_CHANGED; PAYMENT_UNCERTAIN; EXCHANGE_UNAVAILABLE | Refresh; return explicit excluded/discretionary; never duplicate obligation |
| 36.12 | STEP_UP_REQUIRED; PREVIEW_STALE; ALREADY_TERMINAL; EVENT_VERSION_CHANGED | Re-preview/reauth; terminal cancellation replays |
| 36.13 | DATE_INVALID; DEADLINE_INVALID; STALE_VERSION; OPT_OUT_POLICY_INVALID | Correct/refresh; prior change/window remains |

Failure recovery matrix:

| Failure | Durable recovery |
|---|---|
| Rail fails/uncertain | Cancellation stays; obligation open/uncertain; query provider before retry |
| Dead method | State alternative_required; identity-verified provider-supported/manual incident, never silent credit |
| Notification outage | Change/obligation persists; retry delivery and show in-app state |
| TBC scheduler outage | Overdue scanner invokes cancellation; immediate operator alert |
| Outbox lag | Domain/outbox atomic; alert at 60 s and replay |

Per-operation observability matrix:

| Op | Safe metric fields | SLO |
|---|---|---|
| 36.11 | opId,cause,outcomeClass,state,providerControl; refund_resolution_total | p95 2 s excluding rail; duplicate obligation page |
| 36.12 | opId,reasonCode,ticketCount,providerMix,jobCount; cancellation_total | p95 8 s/500k obligations staged; terminal rollback invariant page |
| 36.13 | opId,changeKind,windowHours,secondChange,tbcJob; event_change_total | p95 2 s; overdue TBC/scheduler failure page |

Logs omit party identity, amounts linked to party, payment refs, and delivery targets. Metrics use bounded classes.

## Release and Testing

Deploy tables/RLS/events/jobs before routes. Feature flags gate individual resolution and mass changes independently. Recovery audits ticket uniqueness, obligation totals against original all-in, terminal changes, windows/jobs, provider uncertainty, outbox, and RLS.

### Per-operation Tests

| Op | Contract/success | Auth/CORS/ApiError | Race/failure |
|---|---|---|---|
| 36.11 | exact all-in/zero fee, one obligation or atomic exchange | holder/payer/finance isolation | scan/refund race one winner; provider uncertainty |
| 36.12 | fresh preview commits cancellation+all obligations | operator step-up, cause-invariant event | double cancel replay; rail failure cannot rollback |
| 36.13 | date/TBC and full restarted window | step-up/If-Match/strict union | second change successor; overdue TBC converts once |

Additional suites cover Zod/OpenAPI, SQL constraints/index/RLS, property all-in obligations/window ordering, provider fault injection, outbox duplicate/gap, privacy/log denylist, accessible fan notices, and 500k-ticket batch load/restart.

## Deepening Passes

| Pass | Evidence |
|---|---|
| Contract | Three IA commands have exact request/success/error/state contracts |
| Financial integrity | Original all-in, zero retained fee, unique obligation, original method, atomic exchange |
| Finality | Cancellation separate/terminal, fresh blast preview, rails async, TBC deterministic |
| Security/reliability | Step-up, RLS, CORS, idempotency, provider uncertainty, scheduler/outbox recovery |

## Ambiguity Gate

**PASS.** Interactions 36.11–36.13, ResolveRefund, CancelTicketedEvent, RescheduleEvent, RefundObligation, EventChange, feature 19.06, and both canonical events reconcile exactly. All routes and per-operation contracts/middleware/errors/observability/tests are complete; SQL/RLS/grants and failure recovery are deterministic. No macro or micro ambiguity remains.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Initial production-grade 36c backend contract | /write-be-spec | All |

## Dependency References

- [BE00](00-infrastructure.md)
- [IA06](../ia/06-trust-safety.md)
- [IA33](../ia/33-show-day-operations.md)
- [IA35](../ia/35-ticket-products-sales.md)
- [36a](36a-door-replicas-scans-age.md)
- [36b](36b-boxoffice-counts-drops-walkup-close.md)
- [36d](36d-external-counts-attestation-reconciliation.md)
- [36e](36e-ticket-limits-transfer-exchange-consent.md)
