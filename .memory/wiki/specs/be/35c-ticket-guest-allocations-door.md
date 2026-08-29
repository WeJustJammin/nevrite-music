# BE Spec 35c — Guest Allocations and Door Changes

> Source: [IA Shard 35](../ia/35-ticket-products-sales.md), interactions 35.12–35.14. This companion owns `GuestAllocation`, guest/+1 entries, approval/limit history, and controlled door-time additions. It does not own ticket inventory, identity truth, admission scanning, venue security, or payment.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 35](../ia/35-ticket-products-sales.md) | Interactions lines 77–103; Contracts lines 104–126; Data Models lines 127–173; Access Control lines 174–197; Event Schemas and Edge Cases lines 207–247 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 19.03 Guest List & Comps | BE35C-12–BE35C-14 / 35.12–35.14 |

## API Endpoints

### Authoritative Route Registry

| Operation ID | IA | Method | Path | Authorization | Idempotency/concurrency | Rate/cache/SLO | CORS policy |
|---|---|---|---|---|---|---|---|
| BE35C-12 | 35.12 | POST | `/api/v1/ticketing/events/{eventId}/guest-allocations` | event guest-list administrator; raises require allocation approver | key + `If-Match` manifest/allocation | 30/hour/event; no-store; p95 500 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35C-13 | 35.13 | POST | `/api/v1/ticketing/guest-allocations/{allocationId}/entries` | scoped allocation delegate | key + allocation version/limit | 60/hour/delegate; no-store; p95 500 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35C-14 | 35.14 | POST | `/api/v1/ticketing/events/{eventId}/door-guests` | live door supervisor + step-up + door window | key + live allocation/door session | 30/min/door; no-store; p95 600 ms | `BE00-CORS-WEB-CREDENTIALLED` |

35.12 creates or raises a bounded allocation against a locked 35a comp block; a raise is inactive until a distinct authorized approver accepts it. 35.13 appends named guest or constrained +1 records without exceeding approved capacity. 35.14 is an audited late-change path: it never bypasses capacity, age/credential policy, restriction edges, or scanner visibility.

TLS, ULID IDs, authenticated tenant/acting context, request ID, strict JSON, and a 64 KiB body cap are required. Exact staff/door console origins receive credentialed CORS; preflight permits route method plus `OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`. Responses are `private, no-store`; guest names/contact/access needs never enter shared caches.

### Per-Operation Validation Middleware Matrix

This is the validation column of the authoritative route registry: join on the stable operation ID above. Each row runs after BE00 request ID/CORS and authentication admission, before authorization/handler execution; the same registry row supplies the numeric rate and literal CORS policy.

| Operation ID | Validation middleware |
|---|---|
| BE35C-12 | strict path `eventId`, headers, and `AllocationRequest` body; reject unknown keys and validate the success body before serialization |
| BE35C-13 | strict path `allocationId`, headers, and `GuestEntryRequest` body; reject unknown keys and validate the success body before serialization |
| BE35C-14 | strict path `eventId`, door-session headers, and `DoorGuestRequest` body; reject unknown keys and validate the success body before serialization |

## Zod 4 Contracts

```ts
const Id=z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const At=z.string().datetime({offset:true});
const Ver=z.number().int().positive();
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
const JsonPrimitive=z.union([z.string(),z.number().finite(),z.boolean(),z.null()]);
const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(()=>z.union([JsonPrimitive,z.array(JsonValueSchema),z.record(z.string(),JsonValueSchema)]));
const ApiError=z.object({code:z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),message:z.string().min(1).max(500),requestId:z.string().uuid(),details:z.record(z.string(),JsonValueSchema).refine(v=>Object.keys(v).length<=16)}).strict();
const AllocationRequest=z.object({
  expectedManifestVersion:Ver,allocationId:Id.optional(),
  ownerPartyId:Id,inventoryBlockId:Id,requestedLimit:z.number().int().min(0).max(10_000),
  priorApprovedLimit:z.number().int().min(0).max(10_000).default(0),
  purpose:z.enum(['artist','promoter','venue','press','production','accessibility','other']),
  approverId:Id.optional(),reason:z.string().trim().min(1).max(1000)
}).strict().superRefine((v,c)=>{
  if(v.requestedLimit>v.priorApprovedLimit&&!v.approverId)c.addIssue({code:'custom',path:['approverId'],message:'raise requires approver'});
  if(v.approverId===v.ownerPartyId)c.addIssue({code:'custom',path:['approverId'],message:'raise approver must be distinct'});
});
const GuestEntryRequest=z.object({
  expectedAllocationVersion:Ver,guestIdentityId:Id.optional(),
  displayName:z.string().trim().min(1).max(160),plusOneCount:z.number().int().min(0).max(10),
  category:z.enum(['guest','plus_one','working','press','accessible_companion']),
  accessibilityCode:z.enum(['none','wheelchair_space','companion','other']),
  credentialPolicyRef:Id,expiresAt:At
}).strict().refine(v=>Boolean(v.guestIdentityId)||v.category==='plus_one',{path:['guestIdentityId'],message:'named categories require identity'});
const DoorGuestRequest=z.object({
  doorSessionId:Id,allocationId:Id,expectedAllocationVersion:Ver,
  guest:GuestEntryRequest.omit({expectedAllocationVersion:true}),
  supervisorId:Id,stepUpProofId:Id,reason:z.string().trim().min(1).max(1000),
  observedAt:At
}).strict();
```

Unknown keys, duplicate identity/display-name digest in the active allocation, stale versions, limit/capacity overflow, self-approved raise, invalid door window/session/step-up, restricted identity, expired credential policy, raw contact data, or unsafe names/reasons fail before persistence. Display names are normalized for comparison but preserved for presentation; enumeration-safe conflict responses contain no other guest details.

## Persistence, RLS, and Grants

```sql
create table guest_allocations (
  id text not null, version bigint not null check(version>0), tenant_id text not null,
  event_id text not null, manifest_version bigint not null, inventory_block_id text not null,
  owner_party_id text not null, purpose text not null,
  requested_limit integer not null check(requested_limit>=0),
  approved_limit integer not null check(approved_limit>=0),
  consumed_count integer not null check(consumed_count>=0),
  state text not null check(state in ('pending_approval','active','closed','revoked')),
  approved_by text, approval_reason text, created_by text not null,
  created_at timestamptz not null, primary key(id,version),
  check(consumed_count<=approved_limit),
  check((state='pending_approval')=(approved_by is null)),
  foreign key(inventory_block_id) references inventory_blocks(id)
);
create table guest_entries (
  id text primary key, tenant_id text not null, event_id text not null,
  allocation_id text not null, allocation_version bigint not null,
  guest_identity_id text, display_name_ciphertext bytea not null,
  normalized_name_hash text not null, plus_one_count integer not null check(plus_one_count between 0 and 10),
  category text not null, accessibility_code text not null,
  credential_policy_ref text not null,
  source text not null check(source in ('advance','door')),
  state text not null check(state in ('active','checked_in','cancelled','expired','denied')),
  expires_at timestamptz not null, version bigint not null check(version>0), created_by text not null, created_at timestamptz not null,
  unique(allocation_id,guest_identity_id),
  unique(allocation_id,normalized_name_hash,source),
  foreign key(allocation_id,allocation_version) references guest_allocations(id,version)
);
create table door_guest_actions (
  id text primary key, event_id text not null, door_session_id text not null,
  guest_entry_id text not null references guest_entries(id), supervisor_id text not null,
  step_up_proof_ref text not null, reason_ciphertext bytea not null,
  allocation_before bigint not null, allocation_after bigint not null,
  admission_projection_state text not null
    check(admission_projection_state in ('queued','projected','failed_retryable','blocked')),
  version bigint not null check(version>0), observed_at timestamptz not null, created_at timestamptz not null
);
```

Allocation reservations consume the 35a comp inventory block with a unique event/block/allocation tuple. Indexes cover event/owner/state/current allocation, pending raises, entry allocation/state/expiry/identity hash, and door session/time/supervisor. All tables enable and force RLS. No anonymous or direct authenticated base-table writes exist. Allocation owners see own minimized counts and entries; delegates need an active versioned mandate. Door personnel see only the active event/session projection and cannot export lists. Accessibility code is purpose-filtered. Step-up/audit custodians may retrieve encrypted reason under break-glass. Scanner workers receive only opaque entry/pass state.

## Transactions and State

- BE35C-12 locks the comp inventory block and current allocation. New/decreased limits can activate within available capacity; raises insert `pending_approval` until a distinct approver transaction rechecks authority/capacity and activates. Every version, reservation delta, audit, event, and response commits atomically.
- BE35C-13 locks active allocation and reservation, computes `1 + plusOneCount`, enforces approved/event/identity limits and restrictions, appends the entry, increments consumed count/version, creates an admission projection, and emits one event. Partial writes are impossible.
- BE35C-14 validates active door session/window, supervisor step-up, live allocation/capacity, credential/restriction policy, then uses the same entry transaction with `source=door` and an immutable `door_guest_action`. Failure never creates a scanner pass.

Cancellation/expiry appends a state transition, decrements active consumption exactly once, and updates the admission projection. Check-in makes the admission consumed and capacity non-returnable unless an explicit event policy permits revocation. Idempotency binds tenant, actor, route, event/allocation, and body hash for 72 hours; same-key/different-body is `409 IDEMPOTENCY_CONFLICT`.

## Event and Dependencies

| Event | Trigger and payload |
|---|---|
| `ticketing.comp.changed` | committed allocation/entry/door transition: `{eventId,allocationId,allocationVersion,entryId,changeType,state,approvedLimit,consumedCount,source,occurredAt}` |

Transactional outbox, per-allocation ordering, at-least-once, event-ID dedupe, 24-hour retry/dead-letter. Payload excludes display name, identity, accessibility code, reason, step-up proof, and credential details. Admission/scanner consumers receive an independently authorized opaque pass projection.

Inventory/identity/restriction/credential sources use 2 s total, two retries 100/500 ms, circuit after 5 failures/30 s for 60 s; uncertainty fails closed. Scanner projection delivery uses 1 s, three retries 100/500/2000 ms; deny-first source state applies until convergence. Workers lease 60 s and dead-letter permanent failures with alert and reasoned replay.

### Exact integration contracts

| Seam | Exact request → response | Timeout, retry/backoff, circuit, and recovery |
|---|---|---|
| Inventory/identity/restriction authority | `{eventId,allocationId,subjectRef,quantity,expectedVersions,policyVersion}` → `{authorized,remainingCapacity,restrictionDecision,sourceVersions}` | 2 s total; two attempts at 100/500 ms full-jitter backoff; opens after 5 failures/30 s for 60 s; uncertainty fails closed and creates no entry/pass projection |
| Credential authority | `{eventId,subjectRef,doorSessionId,requiredCredentialClass}` → `{valid,credentialRef,state,expiresAt,version}` | 2 s total; two attempts at 100/500 ms backoff; same source circuit; invalid/unknown returns `422 CREDENTIAL_OR_RESTRICTION_FAILED` without exposing identity |
| Scanner projection | `{entryId,eventId,admissionState,projectionVersion,dedupeKey}` → `{scannerReceiptId,state,appliedVersion}` | 1 s total; three attempts at 100/500/2000 ms backoff; opens after 5 failures/30 s for 60 s; projection stays deny-first/failed_retryable until monotonic convergence |

## Middleware, Errors, Observability, and Tests

Order: request ID -> TLS/CORS/body/content -> auth/context -> rate -> strict Zod -> event/allocation/person RLS -> restriction/credential -> step-up for door/raise -> idempotency/If-Match -> transaction -> response validation -> redacted audit. Errors are exactly `ApiError { code, message, requestId, details }`.

| Status/code | Condition |
|---|---|
| 400 `VALIDATION_FAILED` | malformed limit, guest, window, or reason |
| 401 `UNAUTHENTICATED` | invalid session |
| 403 `FORBIDDEN` | allocation/door/approval capability absent |
| 404 `NOT_FOUND` | absent/concealed event/allocation/guest |
| 409 `VERSION_CONFLICT` | stale manifest/allocation |
| 409 `ALLOCATION_LIMIT_REACHED` | approved limit or comp block exhausted |
| 409 `DUPLICATE_GUEST` | same active identity/name digest |
| 409 `APPROVAL_REQUIRED` | raise awaits distinct approver |
| 410 `DOOR_WINDOW_CLOSED` | late change prohibited |
| 422 `CREDENTIAL_OR_RESTRICTION_FAILED` | entry cannot receive admission |
| 429 `RATE_LIMITED` | honor `Retry-After` |
| 503 `DEPENDENCY_UNAVAILABLE` | no entry/pass created |

Logs contain request/trace/operation IDs, opaque event/allocation/entry/role IDs, versions/counts, source/state/code, latency, dependency attempt, and outbox age; exclude names, identities, accessibility, reasons, proofs, credentials, and list contents. Metrics cover pending raises, allocation utilization/conflicts, door additions/denials, scanner projection lag, latency/errors/circuit/outbox. Availability target 99.95% during doors; p99 write <1 s; scanner projection p99 <3 s. Page on capacity invariant breach, projection lag >10 s during doors, or five-minute 5xx >1%.

Tests cover strict schemas/cross-fields, self-approval/limit/capacity/duplicate properties, every role/tenant/delegate/revocation combination, RLS/field projection, concurrent raises/entries/cancellations, door window/step-up/session, idempotency races, restriction/credential/source failure and recovery, event privacy/order/dedupe, scanner convergence, log redaction, migration/index plans, CORS, and alerts. CI fails on uncovered 35.12–35.14, missing `GuestAllocation`/event, route collision, direct write grant, PII leak, malformed table/link, or capacity bypass.

## Exact Typed Success Schemas

Each operation comment maps its route to a strict Zod 4 response; identity PII is excluded from these bodies.

~~~ts
import { z } from "zod";
const Uuid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const Version = z.int().positive();
const Instant = z.iso.datetime({ offset: true });
const RequestId = z.string().min(16).max(128);
// BE35C-12 / 35.12
export const GuestAllocationV1 = z.object({
  allocationId: Uuid, eventId: Uuid, ownerPartyId: Uuid, approvedLimit: z.int().nonnegative().max(100_000),
  pendingLimit: z.int().nonnegative().max(100_000).nullable(), state: z.enum(["pending_approval", "active", "closed", "revoked"]),
  version: Version, requestId: RequestId,
}).strict();
// BE35C-13 / 35.13
export const GuestEntryV1 = z.object({
  entryId: Uuid, allocationId: Uuid, category: z.string().regex(/^[a-z0-9_]{1,64}$/), plusOneCount: z.int().min(0).max(20),
  state: z.enum(["active", "checked_in", "cancelled", "expired", "denied"]), expiresAt: Instant,
  version: Version, requestId: RequestId,
}).strict();
// BE35C-14 / 35.14
export const DoorGuestV1 = z.object({
  entryId: Uuid, eventId: Uuid, doorSessionId: Uuid,
  admissionProjectionState: z.enum(["queued", "projected", "failed_retryable", "blocked"]),
  version: Version, requestId: RequestId,
}).strict();
~~~

## Per-Operation Auditability Closure

All failures instantiate BE00 `ApiError { code, message, requestId, details }`; details exclude name, identity, accessibility code/reason, step-up proof, credentials, and list contents. Unknown faults map to `500 INTERNAL_ERROR`; rate denial is `429 RATE_LIMITED` with `Retry-After`.

| Operation | Exact request → success contract | Exact errors and deterministic recovery | Required observability | Required operation tests |
|---|---|---|---|---|
| BE35C-12 | `AllocationRequest` → 201 `GuestAllocationV1 { allocationId,eventId,ownerPartyId,approvedLimit,pendingLimit,state,version,requestId }` | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 VERSION_CONFLICT, ALLOCATION_LIMIT_REACHED, APPROVAL_REQUIRED, or IDEMPOTENCY_CONFLICT; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE. Raise remains pending until distinct approval; no capacity mutation on failure. | `guest_allocation_total`, pending raise age, capacity conflicts, approval denials | limit/approver properties and response; administrator/approver separation; CORS/ApiError; concurrent raise/capacity |
| BE35C-13 | `GuestEntryRequest` → 201 `GuestEntryV1 { entryId,allocationId,category,plusOneCount,state,expiresAt,version,requestId }` | common set plus 409 ALLOCATION_LIMIT_REACHED, DUPLICATE_GUEST, VERSION_CONFLICT, or IDEMPOTENCY_CONFLICT; 422 CREDENTIAL_OR_RESTRICTION_FAILED. No entry/pass on failure. | `guest_entry_total`, duplicate/capacity/restriction outcome, projection lag | identity/category/+1 bounds; allocation delegate/RLS; CORS/BE00 ApiError envelope; duplicate and concurrent last-slot insertion |
| BE35C-14 | `DoorGuestRequest` → 201 `DoorGuestV1 { entryId,eventId,doorSessionId,admissionProjectionState,version,requestId }` | common set plus 409 ALLOCATION_LIMIT_REACHED or VERSION_CONFLICT; 410 DOOR_WINDOW_CLOSED; 422 CREDENTIAL_OR_RESTRICTION_FAILED; 503 DEPENDENCY_UNAVAILABLE. No entry/pass is created; caller uses governed exception path only. | `door_guest_total`, step-up/window denial, scanner projection latency/circuit | live-window/body/success; supervisor+step-up; CORS/ApiError; close-vs-add race and projection retry/fail-closed |

## Ambiguity Gate

- Interactions 35.12–35.14, `GuestAllocation`, and `ticketing.comp.changed` have complete contracts.
- Approval separation, allocation/capacity accounting, privacy, door controls, scanner convergence, persistence, RLS/grants, errors, recovery, SLOs, and tests are deterministic.
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

- [IA Shard 35](../ia/35-ticket-products-sales.md)
- Shards 01/06/35a/36 identity, restriction, inventory, and admission/scanner contracts.
