# BE Spec 35a — Ticket Inventory, On-Sale, Presale, and Access Codes

> Source: [IA Shard 35](../ia/35-ticket-products-sales.md), interactions 35.01–35.06 and 35.22. This companion owns versioned ticket scaling, locked sale manifests, inventory blocks, fee profiles, on-sale schedules, presale policy, access-code issuance/redemption, and scheduled announcement execution. Event/venue truth, money movement, admission scanning, and external ticket-provider truth remain source-owned.

## Classification and Coverage

| IA | Operation | Canonical ownership |
|---|---|---|
| 35.01 | Configure scaling | `TicketScalingVersion` with priced/held/comp/accessible/reserve capacity invariants |
| 35.02 | Lock manifest | `Manifest` and `InventoryBlock`, immutable after lock except governed supersession |
| 35.03 | Configure fees | `FeeProfileVersion`, jurisdiction/source/effective interval and disclosure |
| 35.04 | Register and schedule announce/on-sale | `OnSaleSchedule`, pinned event/time-zone/channel/policy versions |
| 35.05 | Configure presale | Versioned eligibility/window/allocation policy within the schedule |
| 35.06 | Issue/redeem code | `AccessCode`, secret hash, scope, uses, expiry, revocation and redemption ledger |
| 35.22 | Execute scheduled announce | Leased, idempotent schedule transition and delivery receipt; never double opens inventory |

Canonical events are `ticketing.manifest.versioned` and `ticketing.schedule.changed.v1`.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 35](../ia/35-ticket-products-sales.md) | Interactions lines 77–103; Contracts lines 104–126; Data Models lines 127–173; Access Control lines 174–197; Event Schemas and Edge Cases lines 207–247 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 19.01 Ticket Configuration, Scaling & Allocations | BE35A-01–BE35A-03 / 35.01–35.03 |
| 19.02 On-Sale, Announce & Presale Access | BE35A-04–BE35A-06 and BE35A-22 / 35.04–35.06 and 35.22 |

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | Auth | Idempotency/concurrency | Rate/cache/SLO | CORS policy |
|---|---|---|---|---|---|---|
| BE35A-01 | POST | `/api/v1/ticketing/events/{eventId}/scaling-versions` | event ticket administrator | key + `If-Match` event/scaling | 20/hour/event; no-store; p95 500 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35A-02 | POST | `/api/v1/ticketing/events/{eventId}/manifests` | inventory controller + step-up for lock | key + scaling/source digest | 20/hour/event; no-store; p95 700 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35A-03 | POST | `/api/v1/ticketing/events/{eventId}/fee-profiles` | ticket finance/policy administrator | key + prior version/effective range | 20/hour/event; no-store; p95 500 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35A-04 | POST | `/api/v1/ticketing/events/{eventId}/on-sale-schedules` | event launch administrator | key + event/manifest/fee versions | 30/hour/event; no-store; p95 500 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35A-05 | POST | `/api/v1/ticketing/events/{eventId}/presales` | event launch administrator | key + schedule version | 30/hour/event; no-store; p95 500 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35A-06 | POST | `/api/v1/ticketing/events/{eventId}/access-codes` | presale code issuer | key binds batch/scope; 72 h | 20/hour/issuer; no-store; 202 <500 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35A-22 | POST | `/api/v1/ticketing/schedules/{scheduleId}/execute` | scheduler service or break-glass launch operator | occurrence key + lease/CAS | 10/min/schedule; no-store; p95 1 s | `BE00-CORS-WEB-CREDENTIALLED` |

All routes require TLS, ULID IDs, request ID, strict JSON, authenticated tenant context or signed scheduler principal, and a 128 KiB body cap (code batches: 1 MiB and asynchronous). Exact ticket-admin origins receive credentialed CORS; scheduler calls are non-browser. Preflight permits route method plus `OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`; wildcard credentials are denied. Responses use `Cache-Control: private, no-store`.

### Per-Operation Validation Middleware Matrix

This is the validation column of the authoritative route registry: join on the stable operation ID above. Each row runs after BE00 request ID/CORS and authentication admission, before authorization/handler execution; the same registry row supplies the numeric rate and literal CORS policy.

| Operation ID | Validation middleware |
|---|---|
| BE35A-01 | strict path `eventId`, headers, and `ScalingRequest` body; reject unknown keys and validate the success body before serialization |
| BE35A-02 | strict path `eventId`, headers, and `ManifestRequest` body; reject unknown keys and validate the success body before serialization |
| BE35A-03 | strict path `eventId`, headers, and `FeeProfileRequest` body; reject unknown keys and validate the success body before serialization |
| BE35A-04 | strict path `eventId`, headers, and `ScheduleRequest` body; reject unknown keys and validate the success body before serialization |
| BE35A-05 | strict path `eventId`, headers, and `PresaleRequest` body; reject unknown keys and validate the success body before serialization |
| BE35A-06 | strict path `eventId`, headers, and `CodeRequest` body; reject unknown keys and validate the success body before serialization |
| BE35A-22 | strict path `scheduleId`, headers, and `ExecuteSchedule` body; reject unknown keys and validate the success body before serialization |

## Zod 4 Contracts

```ts
const Id=z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const At=z.string().datetime({offset:true});
const Ver=z.number().int().positive();
const Money=z.object({amountMinor:z.bigint().nonnegative(),currency:z.string().regex(/^[A-Z]{3}$/)}).strict();
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
const JsonPrimitive=z.union([z.string(),z.number().finite(),z.boolean(),z.null()]);
const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(()=>z.union([JsonPrimitive,z.array(JsonValueSchema),z.record(z.string(),JsonValueSchema)]));
const ApiError=z.object({code:z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),message:z.string().min(1).max(500),requestId:z.string().uuid(),details:z.record(z.string(),JsonValueSchema).refine(v=>Object.keys(v).length<=16)}).strict();
const Capacity=z.object({
  priced:z.number().int().nonnegative(),held:z.number().int().nonnegative(),
  comp:z.number().int().nonnegative(),accessible:z.number().int().nonnegative(),
  reserve:z.number().int().nonnegative()
}).strict();
const ScalingRequest=z.object({
  expectedVersion:Ver,venueConfigurationRef:Id,venueConfigurationVersion:Ver,
  totalCapacity:z.number().int().positive().max(1_000_000),
  blocks:z.array(z.object({blockId:Id,sectionRef:Id,capacity:Capacity,price:Money,visibility:z.enum(['public','presale','internal'])}).strict()).min(1).max(5000)
}).strict().superRefine((v,c)=>{
  const sum=v.blocks.reduce((n,b)=>n+Object.values(b.capacity).reduce((x,y)=>x+y,0),0);
  if(sum!==v.totalCapacity)c.addIssue({code:'custom',path:['totalCapacity'],message:'block capacity must equal total'});
});
const ManifestRequest=z.object({
  scalingVersion:Ver,sourceMapVersion:Ver,action:z.enum(['draft','lock','supersede']),
  expectedManifestVersion:Ver.optional(),reason:z.string().trim().min(1).max(1000).optional()
}).strict().refine(v=>v.action!=='supersede'||Boolean(v.reason),{path:['reason'],message:'supersession requires reason'});
const FeeProfileRequest=z.object({
  expectedVersion:Ver,jurisdictionRef:Id,effectiveFrom:At,effectiveUntil:At,
  lines:z.array(z.object({code:z.string().regex(/^[A-Z0-9_]{1,40}$/),label:z.string().trim().min(1).max(120),kind:z.enum(['fixed','percentage']),value:z.string().regex(/^\d+(?:\.\d{1,6})?$/),includedInDisplayedPrice:z.boolean()}).strict()).max(100),
  sourceRefs:z.array(Id).min(1).max(30)
}).strict().refine(v=>Date.parse(v.effectiveFrom)<Date.parse(v.effectiveUntil),{path:['effectiveUntil'],message:'must follow start'});
const ScheduleRequest=z.object({
  manifestVersion:Ver,feeProfileVersion:Ver,timeZone:z.string().min(1).max(64),
  announceAt:At,onSaleAt:At,closeAt:At,channelRefs:z.array(Id).min(1).max(30),
  fallback:z.enum(['hold_closed','manual_release'])
}).strict().superRefine((v,c)=>{
  if(!(Date.parse(v.announceAt)<=Date.parse(v.onSaleAt)&&Date.parse(v.onSaleAt)<Date.parse(v.closeAt)))
    c.addIssue({code:'custom',path:['onSaleAt'],message:'invalid schedule order'});
});
const PresaleRequest=z.object({
  scheduleId:Id,expectedScheduleVersion:Ver,name:z.string().trim().min(1).max(120),
  opensAt:At,closesAt:At,allocationBlockIds:z.array(Id).min(1).max(500),
  eligibilityPolicyRef:Id,maxTicketsPerIdentity:z.number().int().min(1).max(100)
}).strict().refine(v=>Date.parse(v.opensAt)<Date.parse(v.closesAt),{path:['closesAt'],message:'must follow open'});
const CodeRequest=z.object({
  presaleId:Id,batchId:Id,count:z.number().int().min(1).max(100_000),
  usesPerCode:z.number().int().min(1).max(100),ticketLimitPerUse:z.number().int().min(1).max(100),
  expiresAt:At,scope:z.enum(['identity','organization','campaign']),scopeRef:Id.optional()
}).strict();
const ExecuteSchedule=z.object({expectedVersion:Ver,occurrenceAt:At,mode:z.enum(['scheduled','manual_break_glass']),reason:z.string().trim().min(1).max(1000).optional()}).strict()
  .refine(v=>v.mode!=='manual_break_glass'||Boolean(v.reason),{path:['reason'],message:'manual execution requires reason'});
```

Unknown keys, duplicate blocks/codes, invalid decimal money/fee values, capacity mismatch, overlapping effective fee versions, stale source versions, schedule ambiguity, inaccessible channel/policy, raw code secrets, and unsafe labels fail before persistence. Code plaintext is returned exactly once over a recipient-bound encrypted artifact; only an Argon2id hash and last-four display token persist.

## Persistence, RLS, and Grants

```sql
create table ticket_scaling_versions (
  id text not null unique, event_id text not null, version bigint not null check(version>0), venue_configuration_ref text not null,
  venue_configuration_version bigint not null, total_capacity integer not null check(total_capacity>0),
  block_json jsonb not null, state text not null check(state in ('draft','active','superseded','locked')),
  created_by text not null, created_at timestamptz not null,
  primary key(event_id,version)
);
create table ticket_manifests (
  id text not null unique, event_id text not null, version bigint not null check(version>0),
  scaling_version bigint not null, source_map_version bigint not null,
  state text not null check(state in ('draft','locked','superseded')),
  locked_at timestamptz, supersedes_version bigint, reason text,
  digest text not null, created_by text not null, created_at timestamptz not null,
  primary key(event_id,version), unique(event_id,digest),
  foreign key(event_id,scaling_version) references ticket_scaling_versions(event_id,version),
  check((state='locked')=(locked_at is not null))
);
create table inventory_blocks (
  id text primary key, event_id text not null, manifest_version bigint not null,
  section_ref text not null, priced integer not null check(priced>=0),
  held integer not null check(held>=0), comp integer not null check(comp>=0),
  accessible integer not null check(accessible>=0), reserve integer not null check(reserve>=0),
  price_minor bigint not null check(price_minor>=0), currency char(3) not null,
  visibility text not null check(visibility in ('public','presale','internal')),
  unique(event_id,manifest_version,section_ref),
  foreign key(event_id,manifest_version) references ticket_manifests(event_id,version)
);
create table fee_profile_versions (
  id text not null unique, event_id text not null, version bigint not null check(version>0),
  jurisdiction_ref text not null, effective_from timestamptz not null,
  effective_until timestamptz not null, line_json jsonb not null, source_refs jsonb not null,
  created_by text not null, created_at timestamptz not null,
  primary key(event_id,version), check(effective_from<effective_until)
);
create table on_sale_schedules (
  id text not null, version bigint not null check(version>0), event_id text not null,
  manifest_version bigint not null, fee_profile_version bigint not null,
  time_zone text not null, announce_at timestamptz not null, on_sale_at timestamptz not null,
  close_at timestamptz not null, channel_refs jsonb not null,
  state text not null check(state in ('scheduled','announced','open','closed','cancelled','failed')),
  fallback text not null, lease_until timestamptz, executed_occurrences jsonb not null,
  created_at timestamptz not null, primary key(id,version),
  check(announce_at<=on_sale_at and on_sale_at<close_at),
  foreign key(event_id,manifest_version) references ticket_manifests(event_id,version),
  foreign key(event_id,fee_profile_version) references fee_profile_versions(event_id,version)
);
create table presale_policy_versions (
  id text primary key, event_id text not null, schedule_id text not null, schedule_version bigint not null check(schedule_version>0),
  version bigint not null check(version>0), name text not null check(length(name) between 1 and 120),
  opens_at timestamptz not null, closes_at timestamptz not null,
  allocation_block_ids jsonb not null check(jsonb_typeof(allocation_block_ids)='array'),
  eligibility_policy_ref text not null, max_tickets_per_identity integer not null check(max_tickets_per_identity between 1 and 100),
  created_by text not null, created_at timestamptz not null,
  unique(schedule_id,name,version), check(opens_at<closes_at),
  foreign key(schedule_id,schedule_version) references on_sale_schedules(id,version)
);
create table access_code_batches (
  id text primary key, event_id text not null, presale_id text not null references presale_policy_versions(id),
  requested_count integer not null check(requested_count between 1 and 100000), issued_count integer not null check(issued_count between 0 and requested_count),
  uses_per_code integer not null check(uses_per_code between 1 and 100), ticket_limit_per_use integer not null check(ticket_limit_per_use between 1 and 100),
  scope text not null check(scope in ('identity','organization','campaign')), scope_ref text,
  state text not null check(state in ('queued','issued','expired','revoked')), expires_at timestamptz not null,
  version bigint not null check(version>0), created_by text not null, created_at timestamptz not null
);
create table access_codes (
  id text primary key, event_id text not null, presale_id text not null, batch_id text not null,
  secret_hash text not null unique, display_suffix char(4) not null,
  scope text not null, scope_ref text, uses_allowed integer not null check(uses_allowed>0),
  uses_committed integer not null default 0 check(uses_committed>=0),
  ticket_limit_per_use integer not null check(ticket_limit_per_use>0),
  expires_at timestamptz not null, revoked_at timestamptz,
  unique(batch_id,id), check(uses_committed<=uses_allowed),
  foreign key(batch_id) references access_code_batches(id)
);
create table access_code_redemptions (
  id text primary key, access_code_id text not null references access_codes(id),
  identity_id text not null, cart_id text not null, quantity integer not null check(quantity>0),
  committed_at timestamptz not null, unique(access_code_id,cart_id)
);
create table schedule_executions (
  id text primary key, schedule_id text not null, schedule_version bigint not null check(schedule_version>0),
  occurrence_at timestamptz not null,
  state text not null check(state in ('claimed','opened','held_closed','failed_retryable','dead_lettered')),
  opened_manifest_version bigint, delivery_state text not null check(delivery_state in ('queued','delivered','partial','failed')),
  version bigint not null check(version>0), created_at timestamptz not null,
  unique(schedule_id,occurrence_at),
  foreign key(schedule_id,schedule_version) references on_sale_schedules(id,version)
);
```

Required query indexes cover scaling current state/version, manifest lock/digest, inventory block visibility, active fee interval, `on_sale_schedules(state,announce_at,on_sale_at,lease_until)`, `presale_policy_versions(schedule_id,opens_at,closes_at)`, `access_code_batches(event_id,state,expires_at)`, access-code batch/hash/expiry, redemption identity/cart, and `schedule_executions(schedule_id,state,occurrence_at)`. All tables enable and force RLS. `anon` receives no base grants; authenticated callers execute scoped RPCs only. Event/finance/code roles are independently checked, code secret hashes are service-only, and public inventory reads use a minimized availability projection. Scheduler workers update only leased due rows. Direct client update/delete and cross-event reads are denied.

### Exhaustive entity state machines

This registry covers every domain entity with a stored state plus every immutable entity whose lifecycle is derived from its parent, effective interval, counter, or timestamp. BE00 idempotency, job, outbox, and delivery-attempt machines remain inherited and are not duplicated.

| Entity | Complete named state set | Exhaustive valid transitions and exact trigger | Blocked or rejected behavior in every state |
|---|---|---|---|
| TicketScalingVersion | draft, active, locked, superseded | absent → draft when BE35A-01 begins a serializable create; draft → active only when capacity equals the source venue configuration and all blocks validate in the same commit; active → locked when BE35A-02 locks the first manifest that pins this scaling version; active → superseded when a later scaling version activates before any manifest lock; locked → superseded only when an authorized governed successor manifest atomically locks a replacement scaling version. No other transition exists. | draft cannot be selected by a manifest, schedule, sale, or public projection; invalid draft creation rolls back rather than persisting failed state. active rejects in-place edits, stale If-Match, capacity/source mismatch, and a second active successor race with 409. locked is immutable and rejects activation/edit/unlock. superseded is terminal, read-only, and cannot be repinned. |
| Manifest | draft (serialized as open), locked, superseded | absent → draft on BE35A-02 action draft; draft → locked on action lock after scaling/source/capacity reconciliation and step-up; draft → superseded only when an authorized replacement draft is committed with a reason; locked → superseded only in the same transaction that creates and locks its governed successor. No transition returns to draft or locked. | draft cannot open inventory, arm a schedule, or serve buyers and rejects lock while any seat is unallocated/overallocated or source versions are stale. locked rejects mutation, unlock, and checksum/block changes. superseded is terminal and rejected by new schedules/sales; historical orders retain it. |
| InventoryBlock | draft_snapshot, locked_snapshot, superseded_snapshot, all derived from parent Manifest | absent → draft_snapshot with a draft manifest; draft_snapshot → locked_snapshot only with the parent draft → locked transaction; draft_snapshot or locked_snapshot → superseded_snapshot only with the parent → superseded transition. InventoryBlock has no independent transition or direct update. | draft_snapshot is invisible to sale/public projections; locked_snapshot rejects quantity, price, visibility, and section mutation; superseded_snapshot is historical only. Direct DML, cross-manifest movement, negative/capacity-breaking quantity, or parent/state mismatch is rejected. |
| FeeProfileVersion | scheduled, effective, expired, superseded, derived from database time and version authority | absent → scheduled when effective_from is future or absent → effective when database time is inside the interval; scheduled → effective at effective_from; effective → expired at effective_until; scheduled or effective → superseded only when BE35A-03 commits a non-overlapping governed successor that takes authority for the applicable future interval. Rows remain immutable evidence. | scheduled cannot price before effective_from; effective rejects overlap, in-place source/amount/jurisdiction edits, and use outside its interval; expired and superseded are historical-only and cannot price a new cart. Unsupported jurisdiction/source, overlap, or stale predecessor version rejects the new version without altering the prior row. |
| OnSaleSchedule | scheduled, announced, open, closed, cancelled, failed | absent → scheduled on BE35A-04 with locked manifest/fee/policy versions and coherent times; scheduled → announced when the leased announce occurrence fires with current Shard30 lifecycle and announce authority; announced → open when the leased on_sale occurrence fires and all pinned sources remain valid, including authorized manual_break_glass; open → closed at close_at; scheduled, announced, or open → cancelled only from a verified booking cancellation or announce-authority revocation; scheduled or announced → failed after a permanent configuration/adapter failure exhausts policy. No terminal state exits on the same version; recovery creates a successor schedule version. | scheduled rejects early/manual execution without break-glass reason and any stale/unknown/revoked premise. announced rejects a second announcement and remains closed when opening dependencies are uncertain. open rejects another open and any manifest/fee/policy mutation; cancellation immediately closes availability. closed, cancelled, and failed are terminal for execution and reject rearm/reopen; stale occurrence/version and lease loss return conflict/no effect. |
| PresalePolicyVersion | scheduled, open, closed, superseded, cancelled, derived from window, parent schedule, and version authority | absent → scheduled on BE35A-05; scheduled → open at opens_at only while the parent schedule is announced/open and eligibility/allocation sources are current; open → closed at closes_at; scheduled or open → superseded when BE35A-05 commits a higher version for the same schedule/name; scheduled or open → cancelled when the parent schedule becomes cancelled. No same-version reopen exists. | scheduled rejects redemption before opens_at; open rejects ineligible identity, exhausted allocation, per-identity limit breach, wrong schedule version, or non-allocated block; closed, superseded, and cancelled reject issuance/redemption and cannot return to open. Window outside the parent schedule or overlapping same-name version is rejected at create. |
| AccessCodeBatch | queued, issued, expired, revoked | absent → queued on BE35A-06 after authorization and batch uniqueness; queued → issued only after exactly requested_count unique hashes and the recipient-bound encrypted artifact commit; queued or issued → expired when database time reaches expires_at; queued or issued → revoked on authorized issuer action, parent cancellation, or compromise. expired and revoked are terminal; no other transition exists. | queued codes cannot redeem or leak plaintext and a delivery failure retries the same batch without regenerating secrets. issued rejects reissue, count/scope mutation, and plaintext replay. expired rejects redemption regardless of artifact possession. revoked rejects redemption immediately and cannot be restored; scopeRef mismatch and duplicate batch/hash fail before transition. |
| AccessCode | active, exhausted, expired, revoked, derived from batch state, uses_committed, expires_at, and revoked_at | absent → active only when its batch becomes issued; active → exhausted atomically when a committed redemption makes uses_committed equal uses_allowed; active → expired at expires_at or parent-batch expiry; active → revoked when revoked_at is set or the parent batch is revoked. exhausted, expired, and revoked are terminal. | active rejects wrong scope/identity, cart replay, per-use ticket excess, ineligible presale, or locked inventory without incrementing uses. exhausted rejects all further redemption. expired rejects regardless of clock skew/client cache. revoked wins over possession and rejects immediately. No state permits secret/hash disclosure or decrement of uses_committed. |
| AccessCodeRedemption | committed only; rejected attempts have no persisted redemption state | absent → committed exactly once inside the transaction that locks code, identity, cart, and inventory and increments uses_committed; uniqueness on access_code_id plus cart_id makes replay return the existing committed effect. committed is terminal and immutable. | Any invalid, expired, revoked, exhausted, wrong-scope, over-limit, ineligible, capacity-unavailable, or conflicting attempt creates no row and changes no counter. committed rejects update/delete, quantity change, identity/cart rebinding, and duplicate economic effect. |
| ScheduleExecution | claimed, opened, held_closed, failed_retryable, dead_lettered | absent → claimed when BE35A-22 wins FOR UPDATE SKIP LOCKED for the unique schedule/occurrence; claimed → opened after pinned-source validation and atomic inventory opening; claimed → held_closed when configured hold_closed/manual_release fallback applies; claimed → failed_retryable on retryable dependency/delivery failure; failed_retryable → claimed after lease expiry while retry budget remains; held_closed → claimed only through authorized manual_break_glass with reason and unchanged pinned versions; claimed or failed_retryable → dead_lettered on permanent error or exhausted attempts. opened and dead_lettered are terminal. | claimed rejects a second worker, stale lease/version, or duplicate occurrence. opened rejects duplicate open and preserves exactly-once effect even if response/delivery is lost. held_closed serves no inventory and rejects automatic open. failed_retryable serves no inventory and rejects retry before lease/backoff. dead_lettered serves no inventory and requires a successor occurrence or governed operator action, never an in-place reopen. |
| ScheduleExecution.delivery_state | queued, delivered, partial, failed | queued → delivered on complete provider receipts, queued → partial on a strict subset, queued → failed on permanent rejection/exhaustion; partial → delivered when all missing receipts reconcile or partial → failed when remaining delivery becomes terminal; failed → queued only by audited step-up replay using the same occurrence and destination idempotency keys. delivered is terminal. | queued/partial never imply announcement delivery beyond verified receipts. failed does not roll back an already opened inventory effect and blocks blind provider resend. delivered rejects resend/mutation. Any receipt destination/digest mismatch quarantines the receipt and leaves the prior state unchanged. |

## Transactions, Concurrency, and Recovery

- BE35A-01 locks the event scaling version, validates source capacity, inserts a complete `TicketScalingVersion` and draft blocks, audit/outbox, and response.
- BE35A-02 locks scaling/manifest, re-derives capacity, writes `Manifest` plus immutable `InventoryBlock` snapshot, and atomically marks the previous locked manifest superseded. Locking fails on any unallocated/overallocated seat.
- BE35A-03 excludes overlapping effective intervals per event/jurisdiction and appends `FeeProfileVersion`; historical orders retain their pinned fee snapshot.
- BE35A-04/05 pin manifest/fee/policy versions and enforce announce <= presale/on-sale < close. Schedule edits after announcement create a superseding version and explicit notifications.
- BE35A-06 generates secrets in a hardened worker, stores hashes in one transaction, creates the encrypted delivery artifact after commit, and marks failed delivery replayable without regenerating codes. Redemption locks the code row, eligibility identity, cart, and inventory reservation in stable order.
- BE35A-22 claims a due schedule with `FOR UPDATE SKIP LOCKED`, checks occurrence/version and source lock, transitions exactly once, opens the matching inventory projection, emits events, and records delivery receipts. Provider failure applies the configured `hold_closed|manual_release`; it never silently opens.

Idempotency binds tenant, actor, operation, route, event, and canonical body hash for 72 hours. Same key/different hash returns `409 IDEMPOTENCY_CONFLICT`; in-flight returns `409 REQUEST_IN_PROGRESS`; replay returns stored status/body. Database time controls schedules and code expiry.

## Events and Dependencies

| Event | Exact trigger and payload |
|---|---|
| `ticketing.manifest.versioned` | manifest/scaling/blocks commit: `{eventId,manifestVersion,scalingVersion,state,blockDeltas,totalCapacity,digest,occurredAt}` |
| `ticketing.schedule.changed.v1` | schedule/presale/execution transition: `{eventId,scheduleId,version,state,announceAt,onSaleAt,closeAt,manifestVersion,feeProfileVersion,changeCode,occurredAt}` |
| `booking.deal.lifecycle_changed.v1` (consumed from Shard 30) | `{dealId,dealVersion,state,termDigest,changeCode,occurredAt}`; update the pinned deal-lifecycle premise only after event-ID dedupe and monotonic `dealVersion` ordering; an unknown, stale, or out-of-order premise cannot open inventory or arm a schedule |
| `booking.announce.authorization_changed.v1` (consumed from Shard 30) | `{dealId,authorizationId,version,scope,state,policyVersion,occurredAt}`; update the pinned authorization premise only after event-ID dedupe and monotonic authorization-version ordering; absent, revoked, expired, stale, or unknown authority keeps the schedule blocked |

Envelope: `{eventId,eventType,schemaVersion:1,aggregateId,aggregateVersion,tenantId,occurredAt,traceId,payload}`. Transactional outbox, event/schedule ordering, at-least-once delivery, event-ID dedupe, 24-hour retry/dead-letter. Shard-30 lifecycle and authorization events are consumed as versioned premises, never as permission to create a second canonical deal or authorization record. Code secrets, identities, internal allocations, and fee-source documents are excluded.

Venue/event/policy sources use 2 s total, two retries at 100/500 ms, and a 60 s circuit after 5 failures/30 s; uncertainty fails closed. Delivery/channel adapters use 3 s, retries 1/5/30 s with jitter, and circuit 5/min for 2 min. Scheduler leases last 60 s and renew every 20 s. Permanent 4xx dead-letters with safe reason and step-up replay; exactly-once effect is enforced by occurrence/version uniqueness despite at-least-once execution.

### Exact integration contracts

| Seam | Exact request → response | Timeout, retry/backoff, circuit, and recovery |
|---|---|---|
| Venue/event/policy authority | `{eventId,venueId,actorId,requiredCapabilities,sourceRevisionDigest}` → `{authorized,eventState,venueCapacity,policyVersions,sourceVersions}` | 2 s total; two attempts at 100/500 ms full-jitter backoff; opens after 5 failures/30 s for 60 s; uncertainty returns `503 DEPENDENCY_UNAVAILABLE` before inventory opens or a version commits |
| Delivery/channel adapter | `{scheduleId,occurrenceAt,channel,artifactRef,recipientPolicyId,destinationKey}` → `{deliveryReceiptId,state,acceptedAt}` | 3 s total; three attempts at 1/5/30 s jittered backoff; opens after 5 failures/min for 2 min; permanent 4xx dead-letters with safe reason while manifest/schedule truth remains committed |
| Scheduler claim | `{scheduleId,occurrenceAt,scheduleVersion,workerId}` → `{claimed,leaseUntil,executionId}` | Local RPC deadline 500 ms; exactly 1 attempt, retry count 0, backoff/jitter N/A; `SKIP LOCKED` loser/`claimed=false` is success, validation/auth/version conflict terminal, serialization/deadlock/connectivity waits for the next 20 s scheduler tick; connectivity circuit opens after 5 failures/30 s for 30 s, admits one half-open 500 ms claim probe, closes after two successes, and reopens on failure; fallback leaves occurrence due/unclaimed/lease-free; 60 s lease, 20 s renewal, unique occurrence prevent double-open |

Attempt counts below include the initial attempt. Full jitter means a uniform delay from zero through each listed cap.

| Seam | Exact retryable and terminal conditions | Circuit open, half-open, and fallback closure |
|---|---|---|
| Venue/event/policy authority | 3 attempts total under the existing 2,000 ms operation deadline, with retry caps 100 ms then 500 ms. Retry timeout, connection reset, 408, 429, and 5xx; auth/policy denial, invalid source revision, response-schema failure, and non-429 4xx are terminal. | Open after 5 retryable failures in 30 s for 60 s; admit one half-open authority probe, close after two consecutive successes, and reopen on probe failure. Fallback is 503 DEPENDENCY_UNAVAILABLE before inventory opens or commits. |
| Delivery/channel adapter | 4 attempts total under the existing 3,000 ms per-attempt deadline, with retry caps 1 s, 5 s, and 30 s. Retry only known-no-effect timeout/connection failure, 408, 429, and 5xx; invalid destination/policy, auth/schema failure, non-429 4xx, and ambiguous acceptance are terminal for blind dispatch. | Open after 5 retryable failures in 60 s for 2 min; admit one half-open receipt-status probe before a new dispatch, close after two successes, and reopen on failure. Fallback dead-letters a safe reason while committed manifest/schedule truth remains; ambiguous acceptance reconciles by receipt key. |
| Scheduler claim | Exactly 1 local RPC attempt; retry count 0 and retry backoff/jitter N/A. A SKIP LOCKED loser or claimed=false is a successful bounded outcome; validation/auth/version conflict is terminal. Serialization/deadlock/connectivity is retryable only on the next 20 s scheduler tick, never inside the transaction. | Database-connectivity circuit opens after 5 failures in 30 s for 30 s; one half-open 500 ms health/claim probe closes after two successes or reopens on failure. Fallback leaves the occurrence due, unclaimed, and lease-free; the 60 s lease, 20 s renewal, and unique occurrence key prevent double-open. |

## Middleware, Errors, Observability, and Tests

Order: request ID -> TLS/CORS/body/content -> auth/service signature -> tenant/context -> rate -> strict Zod -> event/finance/code RLS -> step-up -> idempotency/If-Match -> RPC -> response schema -> redacted audit. Every failure uses `ApiError { code, message, requestId, details }`.

| Status/code | Condition |
|---|---|
| 400 `VALIDATION_FAILED` | schema/capacity/fee/interval/code failure |
| 401 `UNAUTHENTICATED` | invalid session/principal |
| 403 `FORBIDDEN` | known event but capability/scope absent |
| 404 `NOT_FOUND` | absent/concealed event/source/code |
| 409 `VERSION_CONFLICT` | stale event/manifest/schedule |
| 409 `CAPACITY_CONFLICT` | block totals or live reservations conflict |
| 409 `IDEMPOTENCY_CONFLICT` | key/body mismatch |
| 410 `CODE_EXPIRED` | code expired/revoked/exhausted |
| 422 `FEE_POLICY_INVALID` | fee source/effective interval invalid |
| 422 `SCHEDULE_INVALID` | time order/source lock invalid |
| 429 `RATE_LIMITED` | honor `Retry-After` |
| 503 `DEPENDENCY_UNAVAILABLE` | source/channel unavailable; configured safe state retained |

Logs include request/trace/operation IDs, opaque event/manifest/schedule/batch IDs, versions, counts, state/code, latency, worker lease, adapter attempt, and outbox age; exclude code secrets/hashes, identities, prices, fees, allocation details, and channel payloads. Metrics cover capacity reconciliation, schedule drift/execution, code issuance/redemption failures, version/idempotency conflicts, latency/errors/circuits/outbox/dead letters. Availability 99.95% during on-sale windows; p99 control writes <1.5 s; due schedule start error <5 s at p99. Page on due schedule lag >10 s, manifest mismatch, inventory opening without locked manifest, or five-minute 5xx >1%.

Tests cover strict schemas and cross-fields, capacity arithmetic/property cases, effective fee intervals, DST/time-zone/schedule boundaries, every route x role/tenant/revocation, RLS/grants, concurrent manifest locks/code redemptions/scheduler claims, idempotency races, delivery failure/replay, source retry/circuit/recovery, event order/dedupe/privacy, log redaction, migration/index plans, CORS, and alerts. CI fails on uncovered 35.01–35.06/35.22, missing six canonical models/two events, duplicate route, direct write grant, malformed table/link, or code secret leakage.

## Exact Typed Success Schemas

Each operation comment binds the authoritative route ID to one strict Zod 4 success body. Access-code secrets are deliberately absent from every replayable schema.

~~~ts
import { z } from "zod";
const Uuid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const Version = z.int().positive();
const Instant = z.iso.datetime({ offset: true });
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const RequestId = z.string().min(16).max(128);
const Currency = z.string().regex(/^[A-Z]{3}$/);
// BE35A-01 / 35.01
export const TicketScalingVersionV1 = z.object({
  scalingVersionId: Uuid, eventId: Uuid, capacity: z.int().nonnegative().max(10_000_000), configurationRef: Uuid,
  state: z.enum(["draft", "active", "superseded", "locked"]), version: Version, requestId: RequestId,
}).strict();
// BE35A-02 / 35.02
export const ManifestV1 = z.object({
  manifestId: Uuid, eventId: Uuid, scalingVersion: Version,
  blockTotals: z.array(z.object({ blockId: Uuid, class: z.enum(["priced", "held", "comp", "accessible", "reserve"]), quantity: z.int().nonnegative() }).strict()).max(100_000),
  lockState: z.enum(["open", "locked", "superseded"]), checksum: Digest, version: Version, requestId: RequestId,
}).strict();
// BE35A-03 / 35.03
export const FeeProfileVersionV1 = z.object({
  feeProfileId: Uuid, eventId: Uuid, jurisdiction: z.string().min(2).max(64), effectiveFrom: Instant, effectiveTo: Instant,
  allInDisclosure: z.array(z.object({ label: z.string().min(1).max(128), amountMinor: z.bigint(), currency: Currency, included: z.boolean() }).strict()).min(1).max(100),
  version: Version, requestId: RequestId,
}).strict();
// BE35A-04 / 35.04
export const OnSaleScheduleV1 = z.object({
  scheduleId: Uuid, eventId: Uuid, announceAt: Instant, onSaleAt: Instant, timezone: z.string().min(1).max(64),
  policyVersions: z.object({ manifest: Version, feeProfile: Version, purchaseLimit: Version, queue: Version }).strict(),
  state: z.enum(["scheduled", "announced", "open", "closed", "cancelled", "failed"]), version: Version, requestId: RequestId,
}).strict();
// BE35A-05 / 35.05
export const PresalePolicyV1 = z.object({
  presaleId: Uuid, scheduleId: Uuid, scheduleVersion: Version, name: z.string().min(1).max(120),
  window: z.object({ startsAt: Instant, endsAt: Instant }).strict(),
  allocationBlockIds: z.array(Uuid).min(1).max(500), eligibilityPolicyRef: Uuid,
  maxTicketsPerIdentity: z.int().min(1).max(100),
  version: Version, requestId: RequestId,
}).strict();
// BE35A-06 / 35.06
export const AccessCodeBatchV1 = z.object({
  batchId: Uuid, eventId: Uuid, presaleId: Uuid, count: z.int().min(1).max(100_000),
  usesPerCode: z.int().min(1).max(100), ticketLimitPerUse: z.int().min(1).max(100),
  scope: z.enum(["identity", "organization", "campaign"]), scopeRef: Uuid.nullable(),
  issuedCount: z.int().nonnegative().max(1_000_000), state: z.enum(["queued", "issued", "expired", "revoked"]),
  expiresAt: Instant, version: Version, requestId: RequestId,
}).strict();
// BE35A-22 / 35.22
export const ScheduleExecutionV1 = z.object({
  executionId: Uuid, scheduleId: Uuid, occurrence: Instant,
  state: z.enum(["claimed", "opened", "held_closed", "failed_retryable", "dead_lettered"]),
  openedManifestVersion: Version.nullable(), deliveryState: z.enum(["queued", "delivered", "partial", "failed"]),
  version: Version, requestId: RequestId,
}).strict();
~~~

## Per-Operation Auditability Closure

All failures use BE00 `ApiError { code, message, requestId, details }`; details exclude access-code secrets/hashes, buyer identity, private allocations, price/fee documents, credentials, and channel payloads. Unknown faults map to `500 INTERNAL_ERROR`; rate denial is `429 RATE_LIMITED` with `Retry-After`.

| Operation | Exact request → success contract | Exact errors and deterministic recovery | Required observability | Required operation tests |
|---|---|---|---|---|
| BE35A-01 | `ScalingRequest` → 201 `TicketScalingVersionV1 { scalingVersionId,eventId,capacity,configurationRef,state,version,requestId }` | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 VERSION_CONFLICT, CAPACITY_CONFLICT, or IDEMPOTENCY_CONFLICT; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE. Invariant failure commits nothing; refetch/rebase. | `ticket_scaling_total`, capacity mismatch, version conflict, source latency/circuit | capacity arithmetic/property and response; admin/tenant/RLS; CORS/ApiError; concurrent versions/source outage |
| BE35A-02 | `ManifestRequest` → 201 `ManifestV1 { manifestId,eventId,scalingVersion,blockTotals,lockState,checksum,version,requestId }` | common set plus 409 CAPACITY_CONFLICT or VERSION_CONFLICT. Lock is atomic; existing reservations prevent unsafe shrink; no partial manifest. | `ticket_manifest_total`, lock wait, block mismatch, step-up denial | block-sum/accessibility invariants; controller+step-up; CORS/BE00 ApiError envelope; concurrent locks/reservation conflict |
| BE35A-03 | `FeeProfileRequest` → 201 `FeeProfileVersionV1 { feeProfileId,eventId,jurisdiction,effectiveFrom,effectiveTo,allInDisclosure,version,requestId }` | common set plus 409 VERSION_CONFLICT; 422 FEE_POLICY_INVALID. Invalid/overlapping source interval commits nothing. | `fee_profile_total`, interval conflict, source age, denial/code | money/interval/disclosure properties; finance role; CORS/ApiError; overlapping effective versions |
| BE35A-04 | `ScheduleRequest` → 201 `OnSaleScheduleV1 { scheduleId,eventId,announceAt,onSaleAt,timezone,policyVersions,state,version,requestId }` | common set plus 409 VERSION_CONFLICT; 422 SCHEDULE_INVALID; 503 DEPENDENCY_UNAVAILABLE. Fail closed; inventory remains closed. | `onsale_schedule_total`, schedule drift, source/circuit state, outbox age | DST/order/source-lock boundaries; launch role; CORS/BE00 ApiError envelope; stale schedule and dependency failure |
| BE35A-05 | `PresaleRequest` → 201 `PresalePolicyV1 { presaleId,scheduleId,scheduleVersion,name,window,allocationBlockIds,eligibilityPolicyRef,maxTicketsPerIdentity,version,requestId }` | common set plus 409 CAPACITY_CONFLICT or VERSION_CONFLICT; 422 SCHEDULE_INVALID. Invalid allocation/window creates no policy. | `presale_policy_total`, allocation conflict, window validation | allocation/window/eligibility properties; launch admin; CORS/ApiError; concurrent policy versions |
| BE35A-06 | `CodeRequest` → 202 `AccessCodeBatchV1 { batchId,eventId,presaleId,count,usesPerCode,ticketLimitPerUse,scope,scopeRef,issuedCount,state,expiresAt,version,requestId }` | common set plus 409 IDEMPOTENCY_CONFLICT; 410 CODE_EXPIRED. Secret appears only once in the authorized issuance channel; replay returns metadata, never secret. | `access_code_batch_total`, redemption/expiry/revocation failures, delivery attempts | batch/use/expiry boundaries; issuer scope; CORS/BE00 ApiError envelope; secret non-replay, concurrent redemption |
| BE35A-22 | `ExecuteSchedule` → 200/201 `ScheduleExecutionV1 { executionId,scheduleId,occurrence,state,openedManifestVersion,deliveryState,version,requestId }` | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 VERSION_CONFLICT or IDEMPOTENCY_CONFLICT; 422 SCHEDULE_INVALID; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE. Lease/CAS prevents double-open; configured hold-closed/manual-release survives failure. | `schedule_execution_total`, claim/lease age, drift, adapter attempt/circuit, dead letters | occurrence/schema; scheduler/break-glass auth; CORS/ApiError; competing leases, crash/reclaim, channel retry/circuit, exactly-once open |

## Ambiguity Gate

- All seven interactions, `TicketScalingVersion`, `Manifest`, `InventoryBlock`, `FeeProfileVersion`, `OnSaleSchedule`, `AccessCode`, and both canonical events are fully specified.
- Capacity, fee disclosure, schedule clock, code secrecy/redemption, safe failure, persistence, RLS/grants, recovery, observability, and tests are deterministic.
- Open Questions: None.
- Result: **PASS**.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Added explicit pre-audit structural closure and normalized authoritative per-operation CORS policies. |
| 2026-08-29 | Added exhaustive stored and derived entity state machines with valid transitions, triggers, and per-state rejection behavior. |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [IA Shard 35](../ia/35-ticket-products-sales.md)
- Shards 01/11/29–34 identity, finance, venue, booking, production, show-day, and tour source contracts.
