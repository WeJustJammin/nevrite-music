# BE Spec 30e — Booking RFQ and Bill Construction

> Source: [IA Shard 30](../ia/30-booking-contracts.md), interactions 30.26–30.27. This companion owns structured RFQ admission and the canonical `Bill` aggregate. It never scores a private note, converts an RFQ into a hold or deal, invents control over a Shard-29 slot, treats a TBA slot as a named booking, or hides an unsupported cancellation dependency.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Scope | Structured booking enquiry/RFQ admission, privacy-safe routing, and append-only bill/slot construction | IA Shard 30 `Interactions` lines 124–125 and `Contracts` lines 158–159 |
| Canonical ownership | This companion owns `Bill`, booking RFQ records, and version-pinned bill slots; Shard 29 owns physical slot/hold truth and 30b/30d own commercial/cancellation instruments | IA `Data Models` line 220 and `Cross-Shard Dependencies` lines 439–449 |
| Explicit non-ownership | RFQ never creates a hold/deal, bill never duplicates physical inventory, and private notes never enter routing/ranking or fan surfaces | IA `Interactions` lines 124–125; approved BE index split |
| Split validity | PASS: 30.26–30.27 have one operation owner and this is the sole registry for BE30E-26..27 | approved BE index and IA `Interactions` lines 124–125 |

## Referenced Material Inventory

| Source file | Section / lines | Material consumed |
|---|---|---|
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Acceptance Criteria` lines 88–89 | RFQ routing, structured decline, bill construction, TBA, and dependency obligations |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Interactions` lines 124–125 | exact 30.26–30.27 preconditions, success, failure, and recovery |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Contracts` lines 158–159 | RFQ/bill command inputs, buy-on exclusion, and slot lineage rules |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Data Models` lines 220, 305–307 | canonical Bill fields, slot relationships, state, and cardinality |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Event Schemas` line 341 | booking.bill.changed payload/privacy |
| `.memory/wiki/specs/be/00-infrastructure.md` | `Request/Response Contracts` lines 112–200; `Error Handling` lines 426–461 | Zod 4 wire conventions, global ApiError, and recovery |
| `.memory/wiki/specs/be/00-infrastructure.md` | `Middleware & Policies` lines 253–308; `Database Schema` lines 202–251 | CORS, auth, rate/body limits, RPC-only persistence, RLS, grants, audit, and outbox |

## IA Source Map

| IA interaction | Source trace | Backend operation | Canonical completion |
|---|---|---|---|
| 30.26 | IA `Interactions` line 124; `AC-30.26` | BE30E-26 | structured `RFQ` routed, manually triaged, or auto-declined without note scoring |
| 30.27 | IA `Interactions` line 125; `AC-30.27` | BE30E-27 | immutable `Bill` version with named/TBA slot and explicit dependency |

### Canonical model and event coverage

| IA canonical identifier | Owned or consumed here | Trace |
|---|---|---|
| `Bill` | owned by BE30E-27 | IA `Data Models` line 220 |
| `booking.bill.changed` | emitted by BE30E-27 | IA `Event Schemas` line 341 |

### Feature Ledger Coverage

| Ledger feature | Disposition | Operation or owning companion |
|---|---|---|
| `17.07` Booking Enquiry Inbox & RFQ | represented | BE30E-26 |
| `17.14` Bill Construction & Support Slot Offers | represented | BE30E-27 |
| `17.01.01`, `17.01.02`, `17.01.03`, `17.01.04` | deferred | 30a/30c |
| `17.02.01`, `17.02.02`, `17.02.03`, `17.02.04`, `17.03.01`, `17.03.02`, `17.03.03`, `17.04`, `17.05.01`, `17.05.02`, `17.05.03`, `17.05.04`, `17.06` | deferred | 30b/30c/30d |

## Endpoint Completeness Reconciliation

| IA interaction | HTTP operation | Request → typed success | Error / event |
|---|---|---|---|
| 30.26 | POST `/api/v1/booking/rfqs` | SubmitBookingRfq → RfqResult (202) | ApiError; RFQ audit/routing event |
| 30.27 | POST `/api/v1/booking/rfqs/{rfqId}/bill-versions` | ConstructBillVersion → BillResult (201) | ApiError; booking.bill.changed |

## API Endpoints

### Authoritative Route Registry

| ID | IA | Method | Path | Authorization/idempotency |
|---|---|---|---|---|
| BE30E-26 | 30.26 | POST | `/api/v1/booking/rfqs` | eligible booking actor with current act/party mandate; key + request/source-policy versions |
| BE30E-27 | 30.27 | POST | `/api/v1/booking/rfqs/{rfqId}/bill-versions` | show/bill owner with exact slot-control proof; key + RFQ/bill/slot/dependency versions |

Both routes require TLS, authenticated tenant/acting context, ULID request and idempotency identifiers, `application/json`, strict-origin booking-console CORS, a 128 KiB body cap, and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`. Preflight permits the registered method plus `OPTIONS`. Responses are `private, no-store`; errors never reveal an undiscoverable party, slot, bill, or RFQ.

- **BE30E-26:** 30 requests/hour/actor and 10/hour/target; p95 <700 ms, p99 <1.5 s. `Idempotency-Key` and all pinned policy/source versions are mandatory. A successful response is `202` with the RFQ, deterministic routing disposition, and no ranking score.
- **BE30E-27:** 20 writes/hour/bill and 60/hour/owner; p95 <800 ms, p99 <1.5 s. `Idempotency-Key` and `If-Match` are mandatory. A successful response is `201` with the immutable bill version and affected slot projection.

This is the sole authoritative route registry for 30e. BE30E-26 and BE30E-27 are stable operation IDs used as keys for every contract, error, authorization, idempotency, rate, observability, and test row; 30a–30d and BE00 routes are inherited and never duplicated here.

## Zod 4 Contracts

```ts
const Id = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const At = z.string().datetime({ offset: true });
const Ver = z.number().int().positive();
const Money = z.object({ amountMinor: z.number().int().nonnegative(), currency: z.string().regex(/^[A-Z]{3}$/) }).strict();
const VersionRef = z.object({ id: Id, version: Ver }).strict();
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const ApiError = z.object({ code: z.string().min(1), message: z.string().min(1), requestId: z.string().min(1), details: BE00ErrorDetails }).strict();

const SubmitBookingRfq = z.object({
  requesterPartyId: Id,
  requesterMandateRef: VersionRef,
  targetKind: z.enum(['party', 'avail', 'bill_slot']),
  targetRef: VersionRef,
  requestedActRef: VersionRef,
  requestedWindow: z.object({ startsAt: At, endsAt: At }).strict(),
  proposedPosition: z.enum(['headline', 'direct_support', 'support', 'opener', 'tba']),
  commercialEnvelope: z.object({ fee: Money.optional(), dealShape: z.enum(['guarantee', 'door_split', 'versus', 'buy_on', 'other']), negotiable: z.boolean() }).strict(),
  routingPolicyVersion: Ver,
  structuredRequirements: z.array(z.object({ code: z.string().regex(/^[A-Z0-9_]{1,64}$/), value: z.string().trim().min(1).max(500) }).strict()).max(40),
  privateNote: z.string().trim().max(2000).optional()
}).strict().refine(v => Date.parse(v.requestedWindow.startsAt) < Date.parse(v.requestedWindow.endsAt), { path: ['requestedWindow', 'endsAt'], message: 'must follow startsAt' });

const BillSlotInput = z.object({
  slotRef: VersionRef,
  resourceHoldRef: VersionRef.optional(),
  label: z.string().trim().min(1).max(120),
  billing: z.enum(['named', 'tba']),
  position: z.enum(['headline', 'direct_support', 'support', 'opener', 'other']),
  bookingRef: VersionRef.optional(),
  dealRef: VersionRef.optional(),
  commercialThreadRef: VersionRef,
  cancellationDependency: z.object({ state: z.enum(['none', 'supported', 'unsupported']), instrumentRef: VersionRef.optional(), reasonCode: z.string().regex(/^[A-Z0-9_]{1,64}$/).optional() }).strict()
}).strict()
  .refine(v => v.billing === 'tba' ? !v.bookingRef && !v.dealRef : true, { path: ['billing'], message: 'TBA cannot assert booking or deal' })
  .refine(v => v.cancellationDependency.state === 'supported' ? !!v.cancellationDependency.instrumentRef : true, { path: ['cancellationDependency', 'instrumentRef'], message: 'required when supported' })
  .refine(v => v.cancellationDependency.state === 'unsupported' ? !!v.cancellationDependency.reasonCode : true, { path: ['cancellationDependency', 'reasonCode'], message: 'required when unsupported' });

const ConstructBillVersion = z.object({
  action: z.enum(['create_bill', 'add_slot', 'replace_slot', 'remove_slot']),
  expectedRfqVersion: Ver,
  billId: Id.optional(),
  expectedBillVersion: Ver.optional(),
  showRef: VersionRef,
  ownerPartyId: Id,
  ownerMandateRef: VersionRef,
  slot: BillSlotInput,
  replacedSlotId: Id.optional(),
  dependencyManifest: z.array(VersionRef).max(50),
  attributedReason: z.string().trim().min(1).max(1000)
}).strict()
  .refine(v => v.action === 'create_bill' ? !v.billId && !v.expectedBillVersion : !!v.billId && !!v.expectedBillVersion, { path: ['billId'], message: 'existing bill and version required for mutation' })
  .refine(v => v.action === 'replace_slot' ? !!v.replacedSlotId : !v.replacedSlotId, { path: ['replacedSlotId'], message: 'present only for replace_slot' });

const RfqResult = z.object({ rfqId: Id, version: Ver, state: z.enum(['routed', 'auto_declined', 'manual_triage']), routedPartyId: Id.optional(), routedAvailId: Id.optional(), routedSlotId: Id.optional(), reasonCode: z.string().regex(/^[A-Z0-9_]{1,64}$/).optional(), noteScored: z.literal(false), createdAt: At }).strict();
const BillResult = z.object({ billId: Id, version: Ver, state: z.enum(['draft', 'open', 'locked', 'cancelled']), showRef: VersionRef, changedSlotId: Id, slotVersion: Ver, eventId: Id, createdAt: At }).strict();
```

Unknown keys, stale or concealed mandates/targets/acts/slots/holds/RFQs/bills/dependencies, inverted windows, invalid currency/amounts, body-mismatched idempotency keys, unsupported buy-on direction, missing control, duplicate physical slots, a named slot without a live booking/deal, a TBA slot with asserted booking/deal, unsupported cancellation dependency without a reason, or source versions changing during commit fail before mutation. `privateNote` is encrypted content for an authorized recipient and is excluded from routing, ranking, policy, analytics, logs, and events.

### Typed success and error schemas

Both routes return strict Zod 4 success objects. ErrorResponse is the BE00 global envelope ApiError { code, message, requestId, details }; output filtering removes private notes, unsupported dependency text, and unrelated parties or slots.

| Operation | Request schema | Success schema | Status | Error response |
|---|---|---|---|---|
| BE30E-26 | SubmitBookingRfq | RfqResult | 202 | ErrorResponse |
| BE30E-27 | ConstructBillVersion | BillResult | 201 | ErrorResponse |

## Persistence and Access

```sql
create table booking_rfqs (
  id text not null, version bigint not null check (version > 0), tenant_id text not null,
  requester_party_id text not null, requester_mandate_id text not null,
  target_kind text not null check (target_kind in ('party','avail','bill_slot')),
  target_id text not null, target_version bigint not null, requested_act_id text not null,
  starts_at timestamptz not null, ends_at timestamptz not null check (ends_at > starts_at),
  position text not null, commercial_envelope jsonb not null, requirements jsonb not null,
  private_note_ciphertext bytea, routing_policy_version bigint not null,
  state text not null check (state in ('routed','auto_declined','manual_triage')),
  routed_target_kind text, routed_target_id text, reason_code text,
  request_hash text not null, created_by text not null, created_at timestamptz not null default now(),
  primary key (id, version), unique (tenant_id, request_hash)
);

create table booking_bills (
  id text not null, version bigint not null check (version > 0), tenant_id text not null,
  show_id text not null, show_version bigint not null, owner_party_id text not null,
  state text not null check (state in ('draft','open','locked','cancelled')),
  supersedes_version bigint, reason text not null, created_by text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (id, version), unique (tenant_id, show_id, version),
  foreign key (id, supersedes_version) references booking_bills(id, version)
);

create table booking_bill_slots (
  id text not null, version bigint not null check (version > 0), tenant_id text not null,
  bill_id text not null, bill_version bigint not null, physical_slot_id text not null,
  physical_slot_version bigint not null, resource_hold_id text, resource_hold_version bigint,
  label text not null, billing text not null check (billing in ('named','tba')),
  position text not null, booking_id text, booking_version bigint, deal_id text, deal_version bigint,
  commercial_thread_id text not null, commercial_thread_version bigint not null,
  cancellation_dependency_state text not null check (cancellation_dependency_state in ('none','supported','unsupported')),
  cancellation_instrument_id text, cancellation_instrument_version bigint, dependency_reason_code text,
  state text not null check (state in ('active','replaced','removed')),
  created_at timestamptz not null default now(), primary key (id, version),
  foreign key (bill_id, bill_version) references booking_bills(id, version),
  check ((billing='tba' and booking_id is null and deal_id is null) or billing='named'),
  check ((cancellation_dependency_state='supported' and cancellation_instrument_id is not null) or cancellation_dependency_state<>'supported'),
  check ((cancellation_dependency_state='unsupported' and dependency_reason_code is not null) or cancellation_dependency_state<>'unsupported')
);

create unique index booking_bill_one_active_physical_slot on booking_bill_slots(tenant_id,bill_id,physical_slot_id) where state='active';
create index booking_rfq_requester_created on booking_rfqs(tenant_id,requester_party_id,created_at desc);
create index booking_rfq_route_state on booking_rfqs(tenant_id,state,created_at) where state in ('routed','manual_triage');
create index booking_bill_show_latest on booking_bills(tenant_id,show_id,version desc);
```

`Bill` is the canonical append-only aggregate represented by `booking_bills` and its version-pinned `booking_bill_slots`: show identity, owner, closed lifecycle enum, version, timestamps, named/TBA markers, and per-slot booking/deal references are explicit. RFQs are supporting command records, not a second canonical domain aggregate.

RLS derives tenant and actor from signed server context. Eligible actors may insert RFQs and select only their own RFQ plus privacy-safe disposition. The routed party may select the structured request and decrypt the note only for the active routing purpose. Bill owners with a current exact show/bill mandate may select bill history and call the bill command; affected booking parties receive only their own slot projection. Platform service principals may route RFQs and publish outbox rows. Support requires an expiring purpose grant and cannot decrypt notes, change routing, or mutate bills. Auditors receive immutable metadata without note, terms, mandate, or unrelated-slot fields. Cross-tenant joins and direct client DML are denied.

`ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` apply to all three tables. Revoke public/authenticated table DML; grant only `execute` on security-definer command functions with fixed `search_path`, explicit tenant checks, and result-column allowlists. FK-like cross-shard references are validated through versioned command APIs; local composite FKs enforce bill/version lineage. Retention: RFQ routing metadata seven years, encrypted notes 180 days then crypto-erasure, immutable bill history seven years or longer legal hold, idempotency rows 72 hours, audit/outbox per platform policy.

### Constraint, index, RLS, and grant registry

This typed registry is authoritative for every persisted field, including SQL type, nullability, constraint, local FK or explicitly named opaque seam, query indexes, and grants. Immutable versions are append-only.

| Table | Typed fields, nullability, and constraints | FK or opaque target | Query indexes | RLS and grants |
|---|---|---|---|---|
| booking_rfqs | id text NOT NULL; version bigint NOT NULL CHECK >0; tenant_id text NOT NULL; requester_party_id text NOT NULL; requester_mandate_id text NOT NULL; target_kind text NOT NULL CHECK party/avail/bill_slot; target_id text NOT NULL; target_version bigint NOT NULL CHECK >0; requested_act_id text NOT NULL; starts_at timestamptz NOT NULL; ends_at timestamptz NOT NULL CHECK ends_at>starts_at; position text NOT NULL CHECK closed position; commercial_envelope jsonb NOT NULL; requirements jsonb NOT NULL; private_note_ciphertext bytea NULL; routing_policy_version bigint NOT NULL CHECK >0; state text NOT NULL CHECK routed/auto_declined/manual_triage; routed_target_kind text NULL; routed_target_id text NULL; reason_code text NULL; request_hash text NOT NULL; created_by text NOT NULL; created_at timestamptz NOT NULL; PK(id,version); UNIQUE(tenant_id,request_hash) | requester/mandate/target/act/policy refs opaque Identity, Shard 29, and routing-policy seams | (tenant_id,requester_party_id,created_at DESC); (tenant_id,state,created_at); (target_kind,target_id,target_version); (request_hash) | RLS tenant plus requester/routed-purpose policy; note ciphertext service-only; RPC INSERT and projection SELECT; no direct DML |
| booking_bills | id text NOT NULL; version bigint NOT NULL CHECK >0; tenant_id text NOT NULL; show_id text NOT NULL; show_version bigint NOT NULL CHECK >0; owner_party_id text NOT NULL; state text NOT NULL CHECK draft/open/locked/cancelled; supersedes_version bigint NULL CHECK >0; reason text NOT NULL; created_by text NOT NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; PK(id,version); UNIQUE(tenant_id,show_id,version); FK(id,supersedes_version) references booking_bills(id,version) | show_id/show_version and owner_party_id opaque Shard 29/Identity seams; supersedes_version local composite FK | UNIQUE(tenant_id,show_id,version); (tenant_id,show_id,version DESC); (owner_party_id,state); (state,updated_at DESC) | RLS owner, affected booking party, and service route; RPC INSERT only; no direct update/delete |
| booking_bill_slots | id text NOT NULL; version bigint NOT NULL CHECK >0; tenant_id text NOT NULL; bill_id text NOT NULL; bill_version bigint NOT NULL CHECK >0; physical_slot_id text NOT NULL; physical_slot_version bigint NOT NULL CHECK >0; resource_hold_id text NULL; resource_hold_version bigint NULL CHECK >0; label text NOT NULL; billing text NOT NULL CHECK named/tba; position text NOT NULL CHECK closed position; booking_id text NULL; booking_version bigint NULL CHECK >0; deal_id text NULL; deal_version bigint NULL CHECK >0; commercial_thread_id text NOT NULL; commercial_thread_version bigint NOT NULL CHECK >0; cancellation_dependency_state text NOT NULL CHECK none/supported/unsupported; cancellation_instrument_id text NULL; cancellation_instrument_version bigint NULL CHECK >0; dependency_reason_code text NULL; state text NOT NULL CHECK active/replaced/removed; created_at timestamptz NOT NULL; PK(id,version); FK(bill_id,bill_version) references booking_bills(id,version); checks enforce TBA has no booking/deal and supported/unsupported dependency fields | physical slot/hold, booking/deal/thread, cancellation instrument opaque Shard 29/30b/30d seams; bill FK local | UNIQUE(tenant_id,bill_id,physical_slot_id) WHERE state=active; (bill_id,bill_version); (physical_slot_id,physical_slot_version); (state,created_at DESC); (booking_id,deal_id) | RLS bill owner plus affected slot party; service RPC INSERT; no direct DML; worker lease only |

All three tables enable and force RLS; anonymous/public table grants are revoked. Authenticated clients receive only purpose-scoped projections and execute security-definer RPCs with fixed search_path, tenant checks, source-version checks, and output allowlists. Unresolved opaque references fail closed; local composite FKs reject orphan bill/slot lineage. RFQ notes are encrypted and crypto-erased by retention policy, while bill history remains append-only for legal retention.

## Transactions and State

- **30.26 Submit booking RFQ:** validate schema, mandate, discoverability, act, target, window, policy version, and per-target quota before a serializable transaction inserts the RFQ, deterministic routing decision, audit, and notification outbox. Routing uses structured fields only. `auto_declined` requires a stable machine reason visible to the requester; `manual_triage` never synthesizes eligibility. Provider admission failure rolls back all rows.
- **30.27 Construct bill/support offer:** lock RFQ, owner mandate, show, current bill, physical slot/hold, commercial thread, booking/deal, and cancellation dependencies in stable identifier order. Recheck pinned versions, require RFQ routing to the owner, append one `booking_bills` version and a complete copied-forward slot set, mark replaced/removed lineage, then append audit and `booking.bill.changed` outbox atomically. Shard 29 remains authoritative for physical slot/hold reservation; this command records only a versioned reference and never acquires control.

RFQ states are terminal `routed|auto_declined` or reviewable `manual_triage`; a triage decision appends a new RFQ version. Bill state transitions are `draft -> open -> locked -> cancelled`; slot revisions are additive and a removed/replaced slot never reactivates. Only an explicit source command may unlock/cancel; this route cannot rewrite an accepted deal or cancellation instrument.

Idempotency binds tenant, actor, route, aggregate/target, pinned source versions, and canonical body hash for 72 hours. Replay returns the stored status/body; the same key with a different body returns `409 IDEMPOTENCY_CONFLICT`. `If-Match`/expected versions serialize concurrent bill edits: exactly one commits and losers receive `409 VERSION_CONFLICT`. Database time controls retention and deadlines.

### Explicit state machine and blocked behavior

| Aggregate | States | Allowed transitions and trigger | Blocked behavior |
|---|---|---|---|
| BookingRfq | routed, auto_declined, manual_triage | intake→routed or auto_declined from structured rules; uncertain target→manual_triage; triage appends a version | private note cannot change disposition; unavailable source retains manual_triage and returns 503 |
| Bill | draft, open, locked, cancelled | create→draft; add/replace/remove appends version; draft→open→locked; explicit source command may cancel | stale bill/RFQ/slot version rolls back; no partial slot set and no unrequested deal/hold |
| BillSlot | active, replaced, removed | create/add→active; replace/remove appends successor or terminal state | duplicate active physical slot returns DUPLICATE_ACTIVE_SLOT; removed slot never reactivates |
| CancellationDependency | none, supported, unsupported | source reference validation sets state; supported requires instrument ref; unsupported requires reason code | unresolved dependency remains unsupported/blocked and cannot be hidden or silently downgraded |

## Events and External Seams

### External Seam Contract Registry

Every external call has exact request/response, timeout, finite retry/backoff, circuit-breaker rule, and recovery. RFQ or bill state is never inferred from a failed seam.

| Seam | Exact request → response | Timeout | Retries and backoff | Circuit breaker | Recovery |
|---|---|---|---|---|---|
| Identity/party/mandate | {tenantId,partyId,mandateRef,requestedScope,expectedVersion} → {eligible,mandateVersion,reasonCode} | 3000 ms total | 2 retries at 100 ms and 500 ms for safe reads | open after 5 failures in 30 s; hold 60 s | RFQ remains uncommitted; return 503 and retry same key |
| Shard 29 slot/hold/availability | {slotRef,slotVersion,holdRef,holdVersion,tenantId} → {exists,state,sourceVersion,controlGranted} | 3000 ms total | 2 retries at 100 ms and 500 ms for safe reads | open after 5 failures in 30 s; hold 60 s | bill mutation fails closed; retain source tombstone when revoked |
| Commercial thread/deal/cancellation | {threadRef,dealRef,instrumentRef,expectedVersions,slotRef} → {exists,state,version,dependencyState} | 3000 ms total | 2 retries at 100 ms and 500 ms for safe reads | open after 5 failures in 30 s; hold 60 s | no unrequested deal/hold; retain explicit dependency reason and retry admission |
| Notification/event outbox | {eventId,eventType,billId,billVersion,payloadHash,occurredAt} → {accepted,sequence,dedupe} | 3000 ms total | 3 retries at 1 s, 5 s, and 30 s | open after 5 failures in 60 s; hold 120 s | bill/RFQ transaction rolls back before commit or replays durable outbox; no duplicate command |

| Event | Trigger and payload |
|---|---|
| `booking.bill.changed` | committed bill version: `{eventId,billId,billVersion,showId,showVersion,action,changedSlotId,slotVersion,billing,position,bookingRef,dealRef,cancellationDependencyState,occurredAt}` |

Transactional outbox delivery is at-least-once, ordered per bill, and deduplicated by event ID plus aggregate version. Payloads omit party identities, private notes, fees/terms, mandates, request requirements, reasons, hold details, and unsupported dependency text. Consumers treat unknown/new fields as ignorable and reject an impossible version regression.

Party/act/mandate, availability, Shard-29 slot/hold, commercial-thread/deal, cancellation, and event/show sources use 2-second connect and 3-second total timeouts, retries at 100/500 ms only for safe reads, and a circuit opened after five failures in 30 seconds for 60 seconds. RFQ submission may return `503` before commit; bill mutation always fails closed. Each asynchronous notification-delivery attempt uses a 3-second total timeout, destination idempotency, retries at 1/5/30 seconds, and a circuit opened after five failures in 1 minute for 2 minutes before dead-letter. Reconciliation replays a missing notification or outbox delivery but never repeats the RFQ or bill commit. A revoked/deleted source preserves required immutable evidence/tombstone, removes derived access, and queues dependent invalidation without orphaning bill history.

## Middleware, Errors, Observability, and Tests

Order: request ID -> TLS/CORS/content/body limit -> authentication/context -> route and target rate limits -> strict Zod -> tenant RLS -> mandate/discoverability/slot-control policy -> pinned source versions -> idempotency/`If-Match` -> serializable transaction -> minimized response -> audit. Errors use `ApiError { code, message, requestId, details }` exactly.

| Status/code | Condition |
|---|---|
| 400 `VALIDATION_FAILED` | malformed window, money, slot, dependency, or cross-field state |
| 401 `UNAUTHENTICATED` | missing or invalid acting session |
| 403 `FORBIDDEN` | eligibility, mandate, owner, or slot control absent |
| 404 `NOT_FOUND` | absent or concealed target/RFQ/bill/source |
| 409 `VERSION_CONFLICT` | RFQ, policy, bill, slot, hold, deal, or dependency changed |
| 409 `IDEMPOTENCY_CONFLICT` | same key with a different canonical body |
| 409 `DUPLICATE_ACTIVE_SLOT` | physical slot already active on bill |
| 410 `SOURCE_REVOKED` | mandate/target/source no longer usable |
| 422 `RFQ_AUTO_DECLINED` | stable structured reason returned; private note not evaluated |
| 422 `BUY_ON_DIRECTION_UNSUPPORTED` | configuration cannot represent requested direction |
| 422 `CANCELLATION_DEPENDENCY_UNSUPPORTED` | dependency remains explicit and no slot mutation occurs |
| 422 `TBA_OR_NAMED_SLOT_INVALID` | asserted booking/deal contradicts billing state |
| 429 `RATE_LIMITED` | `Retry-After` supplied |
| 503 `DEPENDENCY_UNAVAILABLE` | no routing or bill state inferred |

### Per-operation Error, Security, and Limits Matrix

Every row uses the BE00 global envelope ApiError { code, message, requestId, details }; app codes and messages are stable, and details contain only safe field names and opaque references.

| Operation | Success status/app code/message/retry | Error status/app code/message/retry | Ownership and 403/404 rule |
|---|---|---|---|
| BE30E-26 | 202 RFQ_ROUTED “booking RFQ disposition recorded”; replay returns stored result | 422 RFQ_AUTO_DECLINED “structured request was declined”; no retry; 503 DEPENDENCY_UNAVAILABLE “routing source unavailable”; retry after Retry-After | eligible booking actor; known target without mandate 403, concealed target/RFQ 404 |
| BE30E-27 | 201 BILL_VERSION_CREATED “bill version created”; no retry after commit, replay returns stored result | 409 VERSION_CONFLICT “bill or source version is stale”; refresh then retry; 422 TBA_OR_NAMED_SLOT_INVALID “slot billing state is invalid”; no retry | show/bill owner with slot-control proof; known bill without ownership 403, concealed bill/slot 404 |

### Per-operation middleware and output filtering

| Operation | Auth and ownership | Numeric rate limit | Validation locus | CORS policy | Output allowlist |
|---|---|---|---|---|---|
| BE30E-26 | session + act/party mandate and target discoverability; absent mandate 403, concealed target 404 | 30/hour/actor and 10/hour/target | Zod SubmitBookingRfq then structured routing/quota validator before insert | BE00-CORS-WEB-CREDENTIALLED exact origin | RFQ id/version/disposition/routed opaque ref/reason code/noteScored=false; no note |
| BE30E-27 | session + owner mandate and exact Shard 29 slot-control proof; absent control 403, concealed bill/slot 404 | 20/hour/bill and 60/hour/owner | Zod ConstructBillVersion then slot/TBA/dependency validator before serializable lock | BE00-CORS-WEB-CREDENTIALLED exact origin | bill/version/state/changed slot/slot version/event id; no private terms or unrelated slots |

### Pagination and bounded command responses

Both routes are bounded commands, not collection reads; no cursor is returned. Array caps are explicit in the request schemas.

| Operation | Pagination / limit rule |
|---|---|
| BE30E-26 | N/A single RFQ command; requirements max 40, private note max 2000, one disposition response |
| BE30E-27 | N/A single bill mutation; dependency manifest max 50 and one immutable bill version response |

Logs contain opaque request/RFQ/bill/show/slot/actor-role IDs, versions, disposition/action/state, code, latency, circuit/outbox age; exclude names, notes, requirements, amounts, terms, mandate evidence, routing candidates, and private dependencies. Metrics cover RFQ outcomes/reason classes without protected attributes, note-access denials, routing latency/circuit state, bill revisions/conflicts, TBA/named counts, unsupported dependencies, outbox lag, and errors. Availability target is 99.9%; page on any note entering routing/logs/events, duplicate active slot, bill commit without slot control, outbox lag >5 minutes, or five-minute 5xx >2%.

Tests cover strict and cross-field schemas, interval/currency properties, structured-only routing, note non-scoring and encryption/redaction, real auto-decline reasons, target concealment, quota races, all actor/tenant/mandate/revocation matrices, RFQ replay/body mismatch, bill create/add/replace/remove state transitions, named/TBA invariants, buy-on rejection, unsupported cancellation dependency retention, Shard-29 authority boundary, serializable competing bill writes, copied-forward version integrity, RLS/grants/result allowlists, provider timeout/retry/circuit recovery, notification/outbox replay/order/dedupe/privacy, source deletion invalidation, query plans, retention, CORS, SLOs, and alerts. CI fails on uncovered 30.26–30.27, missing `Bill` or `booking.bill.changed`, a route collision, private-note scoring, unstated hold/deal creation, direct DML grant, malformed table/link, or unresolved question.

### Per-operation observability registry

| Operation ID | Structured logs and trace | Metrics and SLO | Audit, outbox, and alert |
|---|---|---|---|
| BE30E-26 | opaque RFQ/target IDs, disposition, reason class, policy version, latency; no note | RFQ disposition/decline/quota rate, p95 <1.5 s | RFQ audit and routing outbox; page on private-note scoring |
| BE30E-27 | opaque RFQ/bill/slot IDs, versions, state, changed-slot count, latency; no terms/amounts | bill conflict/TBA/dependency rate, p95 <1.5 s | bill/slot audit and outbox; page on duplicate active slot |

### Per-operation contract tests

| Test ID | Operation ID | Acceptance evidence |
|---|---|---|
| BE30E-T26 | BE30E-26 | structured-only RFQ, note non-scoring, eligibility/403/404, ApiError, quota, and CORS tests pass |
| BE30E-T27 | BE30E-27 | slot-control proof, TBA/named invariants, serializable version race, ApiError, and event tests pass |

## Deepening Passes

| Pass | Question | Resolution and evidence |
|---|---|---|
| 1 cross-operation consistency | Can RFQ routing create a hold or can bill construction mutate a physical slot without Shard-29 authority? | BE30E-26 is structured routing only; BE30E-27 requires pinned slot-control proof and never creates an unrequested hold/deal. |
| 2 sequencing and concurrency | What wins when two bill versions add or replace the same physical slot? | Serializable bill lock, expected version, and unique active-slot constraint elect one writer; the loser receives VERSION_CONFLICT or DUPLICATE_ACTIVE_SLOT. |
| 3 failure cascade | What happens when routing, source, provider, cancellation, or notification dependencies fail? | Local RFQ/bill transaction rolls back before outbox; retryable provider work is bounded by circuit rules, while unsupported dependencies remain explicit and no billing state is inferred. |
| 4 authorization completeness | Are actor mandate, target discoverability, bill ownership, and slot control independently checked? | Per-operation rows name each predicate and use 403 for known scope without authority and 404 for concealed target/RFQ/bill/slot. |
| 5 observability completeness | Can a bill change be traced without exposing notes, terms, requirements, or amounts? | Opaque IDs, versions, disposition/state, latency, audit, outbox, metrics, and redaction rules are defined; private note content is excluded from all projections and telemetry. |
| 6 abuse and limit edges | Can RFQs, requirements, dependencies, or bill slots be oversized or replayed? | Strict schemas, explicit array/string caps, actor/target/bill numeric limits, idempotency body binding, quota races, and Retry-After handling apply to both routes. |
| 7 partial-state hygiene | Can a failed bill mutation leave a slot or cancellation dependency split from its immutable version? | Slot/CAS/version/audit/outbox writes commit atomically; retry replays the stored result, and unsupported or revoked dependencies block without partial mutation. |

## Open Questions

None.

## Ambiguity Gate

- Interactions 30.26–30.27, canonical model `Bill`, and event `booking.bill.changed` are fully specified.
- RFQ eligibility/routing, note non-scoring, auto-decline reasons, bill ownership/versioning, named/TBA slots, cancellation dependencies, physical-slot authority, RLS/grants, concurrency, recovery, errors, SLOs, and tests are deterministic.
- Open Questions: None.
- Result: **PASS**.

## Dependency References

- [IA Shard 30](../ia/30-booking-contracts.md)
- Shards 01/06/11/14/29/30a/30b/30d/31/32 identity, adjudication, relationship visibility, engagement, physical slots, avails, offer threads/deals, cancellation, settlement, and event-operations contracts.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-08-28 | Completed BE30E contracts, route matrices, typed persistence, state/recovery, seam, security, deepening, and ambiguity gates. |
