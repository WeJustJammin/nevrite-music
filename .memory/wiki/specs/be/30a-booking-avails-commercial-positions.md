# BE Spec 30a — Booking Avails and Commercial Positions

> Source: [IA Shard 30](../ia/30-booking-contracts.md), interactions 30.01–30.05. This companion owns versioned `Avail`, `CommercialLadder`, and `CommercialPosition` records. It does not own calendar/event truth, artist routing truth, offer terms, accepted deals, venue truth, or payment.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Scope | Multi-domain split: availability, ladder ordering, position, release/expiry, and challenge | IA Shard 30 `Interactions` lines 95–118 and `Contracts` lines 136–146 |
| Canonical ownership | This companion owns `Avail`, `CommercialLadder`, and `CommercialPosition`; Shard 29 owns room/calendar/physical-slot truth | IA `Data Models` lines 176–210; `Cross-Shard Dependencies` lines 439–449 |
| Explicit non-ownership | Offers, accepted deals, payments, announce gates, and venue/calendar source records stay in 30b–30e or Shard 29 | IA `Interactions` lines 119–132; approved BE index split |
| Split validity | PASS: 30.01–30.05 have one operation owner and no duplicate BE00/platform route | approved index line 47; IA `Interactions` lines 95–118 |

## Referenced Material Inventory

| Source file | Section / lines | Material consumed |
|---|---|---|
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Acceptance Criteria` lines 58–93 | availability, ladder, position, release, expiry, and challenge outcomes |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Interactions` lines 95–118 | exact 30.01–30.05 preconditions, commits, failures, and recovery |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Contracts` lines 136–174 | closed request/error vocabulary and boundary rules |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Data Models` lines 176–210 and `Event Schemas` lines 316–341 | canonical models, event identifiers, payload privacy |
| `.memory/wiki/specs/be/00-infrastructure.md` | `Request/Response Contracts` lines 112–200; `Error Handling` lines 426–461 | Zod 4 wire types, global error envelope, boundary recovery |
| `.memory/wiki/specs/be/00-infrastructure.md` | `Middleware & Policies` lines 253–308; `Database Schema` lines 202–251 | CORS, auth, limits, RPC-only persistence, RLS, grants, and audit/outbox |

## IA Source Map

| IA interaction | Source trace | Backend operation | Canonical completion |
|---|---|---|---|
| 30.01 | IA `Interactions` line 96; `AC-30.01` | BE30A-01 | versioned room-date `Avail` with source calendar snapshot |
| 30.02 | IA `Interactions` line 97; `AC-30.02` | BE30A-02 | versioned artist routing-window `Avail` with independent evidence |
| 30.03 | IA `Interactions` line 98; `AC-30.03` | BE30A-03 | ordered `CommercialPosition` under one `CommercialLadder` version |
| 30.04 | IA `Interactions` line 99; `AC-30.04` | BE30A-04 | append-only release/reorder/expiry action and affected versions |
| 30.05 | IA `Interactions` line 100; `AC-30.05` | BE30A-05 | evidence-backed challenge result without silent displacement |

### Canonical model and event coverage

| IA canonical identifier | Owned or consumed here | Trace |
|---|---|---|
| `Avail` | owned by BE30A-01/02 | IA `Data Models` line 182 |
| `CommercialLadder` | owned by BE30A-03/04/05 | IA `Data Models` line 183 |
| `CommercialPosition` | owned by BE30A-03/04/05 | IA `Data Models` line 184 |
| `booking.avail.changed` | emitted by BE30A-01/02 | IA `Event Schemas` line 322 |
| `booking.position.changed` | emitted by BE30A-03/04/05 | IA `Event Schemas` line 323 |

### Feature Ledger Coverage

| Ledger feature | Disposition | Operation or owning companion |
|---|---|---|
| `17.01.01` Availability Calendar & Avails Publishing | represented | BE30A-01/02 |
| `17.01.02` Hold Ladder & Priority Positions | represented | BE30A-03 |
| `17.01.03` Challenge, Release & Expiry | represented | BE30A-04/05 |
| `17.01.04` Confirmation & Announce Readiness Gate | Deferred | 30c, BE30C-14/28–34 |
| `17.02.01`, `17.02.02`, `17.02.03`, `17.02.04`, `17.03.01`, `17.03.02`, `17.03.03` | Deferred | 30b/30c |
| `17.04`, `17.05.01`, `17.05.02`, `17.07`, `17.14` | Deferred | 30c/30e |
| `17.05.03`, `17.05.04`, `17.06` | Deferred | 30d |

## Endpoint Completeness Reconciliation

| IA interaction | HTTP operation | Request → typed success | Error / event |
|---|---|---|---|
| 30.01 | POST `/api/v1/booking/rooms/{roomId}/avails` | `AvailRequest` → `AvailResult` (201) | `ApiError`; `booking.avail.changed` |
| 30.02 | POST `/api/v1/booking/artists/{artistId}/routing-windows` | `AvailRequest` → `RoutingWindowResult` (201) | `ApiError`; `booking.avail.changed` |
| 30.03 | POST `/api/v1/booking/avails/{availId}/positions` | `PositionRequest` → `PositionResult` (201) | `ApiError`; `booking.position.changed` |
| 30.04 | POST `/api/v1/booking/positions/{positionId}/actions` | `PositionAction` → `PositionActionResult` (200) | `ApiError`; `booking.position.changed` |
| 30.05 | POST `/api/v1/booking/positions/{positionId}/challenges` | `ChallengeRequest` → `ChallengeResult` (201) | `ApiError`; `booking.position.changed` |

## API Endpoints

### Authoritative Route Registry

This is the sole method/path registry for 30a. Operation IDs are stable keys for every contract, error, authorization, idempotency, rate, observability, and test row; 30b–30e and BE00 routes are inherited and never duplicated.

| Operation ID | IA | Method | Path | Authorization | Idempotency/concurrency | Rate/cache/SLO |
|---|---|---|---|---|---|---|
| BE30A-01 | 30.01 | POST | `/api/v1/booking/rooms/{roomId}/avails` | venue/room booking mandate | key + room/calendar version | 60/hour/room; no-store; p95 500 ms |
| BE30A-02 | 30.02 | POST | `/api/v1/booking/artists/{artistId}/routing-windows` | artist booking mandate | key + artist/calendar version | 60/hour/artist; no-store; p95 500 ms |
| BE30A-03 | 30.03 | POST | `/api/v1/booking/avails/{availId}/positions` | authorized buyer/promoter with venue scope | key + ladder/avail versions | 60/hour/avail; no-store; p95 600 ms |
| BE30A-04 | 30.04 | POST | `/api/v1/booking/positions/{positionId}/actions` | position holder for release; venue mandate for reorder | key + `If-Match` position/ladder | 60/hour/actor; no-store; p95 500 ms |
| BE30A-05 | 30.05 | POST | `/api/v1/booking/positions/{positionId}/challenges` | lower-position holder with published superior-position evidence | key + all affected versions | 20/hour/avail; no-store; p95 800 ms |

Room-date and artist-routing availabilities are independent evidence streams and never imply a hold or deal. A commercial position is one ordered, expiring opportunity under a published ladder. Reorder/release preserves history. Challenge evaluates only the published superior-position criteria and produces an evidence-backed result; it never silently displaces a holder.

TLS, ULID IDs, request ID, authenticated tenant/acting context, strict JSON, and 64 KiB bodies are required. Exact booking-console origins receive credentialed CORS. Preflight permits route method plus `OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`; wildcard credentials are denied. Results are private/no-store; public availability uses a non-enumerating coarse projection.

## Zod 4 Contracts

```ts
const Id=z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const At=z.string().datetime({offset:true});
const Ver=z.number().int().positive();
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const ApiError=z.object({code:z.string().min(1),message:z.string().min(1),requestId:z.string().min(1),details:BE00ErrorDetails}).strict();
const AvailRequest=z.object({
  subjectType:z.enum(['room','artist']),subjectId:Id,sourceCalendarRef:Id,sourceVersion:Ver,
  startsAt:At,endsAt:At,state:z.enum(['available','tentative','unavailable']),
  constraintRefs:z.array(Id).max(30),visibility:z.enum(['private','mandated_parties','market'])
}).strict().refine(v=>Date.parse(v.startsAt)<Date.parse(v.endsAt),{path:['endsAt'],message:'must follow start'});
const PositionRequest=z.object({
  expectedAvailVersion:Ver,ladderVersion:Ver,requestingPartyId:Id,
  mandateRef:Id,commercialIntentRef:Id,requestedExpiresAt:At,
  evidenceRefs:z.array(Id).min(1).max(30)
}).strict();
const PositionAction=z.object({
  action:z.enum(['release','reorder','expire']),expectedPositionVersion:Ver,
  expectedLadderVersion:Ver,newOrdinal:z.number().int().min(1).max(100).optional(),
  reason:z.string().trim().min(1).max(1000)
}).strict().refine(v=>(v.action==='reorder')===Boolean(v.newOrdinal),{path:['newOrdinal'],message:'required only for reorder'});
const ChallengeRequest=z.object({
  challengerPositionId:Id,challengedPositionId:Id,
  expectedLadderVersion:Ver,superiorCriterionCode:z.string().regex(/^[A-Z0-9_]{1,60}$/),
  evidenceRefs:z.array(Id).min(1).max(50),requestedResolutionAt:At
}).strict().refine(v=>v.challengerPositionId!==v.challengedPositionId,{path:['challengedPositionId'],message:'positions differ'});
```

### Typed success and error schemas

~~~ts
const AvailResult=z.object({availId:Id,version:Ver,state:z.enum(['available','tentative','unavailable']),subjectType:z.enum(['room','artist']),subjectId:Id,sourceVersion:Ver,replayed:z.boolean(),requestId:Id}).strict();
const RoutingWindowResult=z.object({availId:Id,version:Ver,state:z.enum(['available','tentative','unavailable']),subjectType:z.literal('artist'),subjectId:Id,sourceVersion:Ver,replayed:z.boolean(),requestId:Id}).strict();
const PositionResult=z.object({positionId:Id,availId:Id,ladderId:Id,version:Ver,ordinal:z.number().int().positive(),state:z.enum(['active','challenged','released','expired','displaced']),expiresAt:At,replayed:z.boolean(),requestId:Id}).strict();
const PositionActionResult=z.object({positionId:Id,version:Ver,ladderVersion:Ver,action:z.enum(['release','reorder','expire']),state:z.enum(['released','expired','active']),affectedPositionIds:z.array(Id).max(100),replayed:z.boolean(),requestId:Id}).strict();
const ChallengeResult=z.object({challengeId:Id,version:Ver,ladderId:Id,state:z.enum(['submitted','upheld','rejected','withdrawn']),challengerPositionId:Id,challengedPositionId:Id,replayed:z.boolean(),requestId:Id}).strict();
const ErrorResponse=z.object({error:ApiError}).strict();
~~~

| Operation ID | Request schema | Success schema / status | Error schema |
|---|---|---|---|
| BE30A-01 | `AvailRequest` | `AvailResult` / 201 | `ErrorResponse` / BE00 `ApiError` |
| BE30A-02 | `AvailRequest` | `RoutingWindowResult` / 201 | `ErrorResponse` / BE00 `ApiError` |
| BE30A-03 | `PositionRequest` | `PositionResult` / 201 | `ErrorResponse` / BE00 `ApiError` |
| BE30A-04 | `PositionAction` | `PositionActionResult` / 200 | `ErrorResponse` / BE00 `ApiError` |
| BE30A-05 | `ChallengeRequest` | `ChallengeResult` / 201 | `ErrorResponse` / BE00 `ApiError` |

Unknown keys, invalid intervals, stale/inaccessible source calendar, duplicate active avail/position, expired mandate, requested expiry outside ladder policy, non-contiguous reorder, unpublished criterion, self-challenge, unsafe reason, or missing evidence fail before mutation. Client ordinals and priority assertions are advisory; server derives final ladder order under the pinned policy.

## Persistence, RLS, and Grants

```sql
create table booking_avails (
  id text not null, version bigint not null check(version>0), tenant_id text not null,
  subject_type text not null check(subject_type in ('room','artist')), subject_id text not null,
  source_calendar_ref text not null, source_version bigint not null,
  starts_at timestamptz not null, ends_at timestamptz not null,
  state text not null check(state in ('available','tentative','unavailable')),
  constraint_refs jsonb not null, visibility text not null,
  created_by text not null, created_at timestamptz not null,
  primary key(id,version), check(starts_at<ends_at),
  unique(subject_type,subject_id,source_calendar_ref,source_version,starts_at,ends_at)
);
create table commercial_ladders (
  id text not null, version bigint not null check(version>0), avail_id text not null,
  policy_ref text not null, policy_version bigint not null,
  maximum_positions integer not null check(maximum_positions between 1 and 100),
  default_ttl_minutes integer not null check(default_ttl_minutes>0),
  superior_criteria jsonb not null, state text not null check(state in ('open','closed','superseded')),
  created_at timestamptz not null, primary key(id,version)
);
create table commercial_positions (
  id text not null, version bigint not null check(version>0), ladder_id text not null,
  ladder_version bigint not null, requesting_party_id text not null,
  mandate_ref text not null, commercial_intent_ref text not null,
  ordinal integer not null check(ordinal>0), evidence_refs jsonb not null,
  state text not null check(state in ('active','challenged','released','expired','displaced')),
  expires_at timestamptz not null, created_at timestamptz not null,
  primary key(id,version), unique(ladder_id,ladder_version,ordinal),
  unique(ladder_id,ladder_version,requesting_party_id)
);
create table commercial_position_challenges (
  id text not null, version bigint not null check(version>0), ladder_id text not null,
  challenger_position_id text not null, challenged_position_id text not null,
  criterion_code text not null, evidence_refs jsonb not null,
  state text not null check(state in ('submitted','upheld','rejected','withdrawn')),
  decision_reason_ciphertext bytea, decided_by text, created_at timestamptz not null,
  primary key(id,version), check(challenger_position_id<>challenged_position_id)
);
```

### Constraint, index, RLS, and grant registry

| Table | FK target / constraint | Query indexes | RLS and grants |
|---|---|---|---|
| `booking_avails` | `id text NOT NULL` + `version bigint NOT NULL CHECK >0`; `subject_id text NOT NULL` is a versioned opaque Shard-29 `Room`/artist ref; no cross-shard DML FK | `(tenant_id,subject_type,subject_id,starts_at)`; `(tenant_id,state,ends_at)`; unique source/window tuple | forced tenant/mandate RLS; command RPC only; no anon/authenticated base DML |
| `commercial_ladders` | `id text NOT NULL`, `version bigint NOT NULL CHECK >0`; `avail_id text NOT NULL` validated against `booking_avails(id,version)` in command transaction | `(avail_id,version DESC)`; `(state,avail_id)`; policy/version lookup | forced RLS through avail owner; ladder RPC insert only; expiry worker lease grant |
| `commercial_positions` | `ladder_id text NOT NULL`, `ladder_version bigint NOT NULL` validated to `commercial_ladders`; unique ladder/version/ordinal and requester | `(ladder_id,ladder_version,ordinal)`; `(state,expires_at)`; `(requesting_party_id,state)` | forced party/tenant RLS; holder projection only; direct update/delete denied |
| `commercial_position_challenges` | challenge IDs and position refs `text NOT NULL`; command validates both refs and inequality before insert | `(ladder_id,state,created_at)`; `(challenged_position_id,state)` | forced challenge-party RLS; decision RPC and leased worker only; evidence columns restricted |

Indexes cover avail subject/time/state, open ladder/avail, active position ladder/ordinal/expiry/party, and challenge state/time. All tables enable and force RLS. `anon` receives no base grants; authenticated clients execute scoped RPCs only. Room/artist avails follow their source mandate. Position holders see own full record and a minimized ordered availability projection; competitor identity/evidence is concealed unless challenge procedure requires disclosure. Venue booking staff need live mandate and conflict checks. Challenge decision evidence is restricted. Direct client update/delete is denied; expiry workers update leased due rows only.

## Transactions and State

- 30.01/30.02 lock the source subject/calendar interval, append `Avail`, audit/outbox, and invalidate projections. Source conflict is recorded as parallel evidence; neither stream overwrites the other.
- 30.03 locks avail/current ladder, verifies availability/mandate/capacity/expiry, allocates the next ordinal, inserts `CommercialPosition`, audit/outbox, and returns an opaque receipt. Concurrent requests serialize.
- 30.04 release/expire appends the position transition and compacts active ordinals in one ladder-version transaction. Reorder requires venue authority, reason, and deterministic permutation; every affected position gets a new version.
- 30.05 locks ladder and both positions in ID order, verifies active/unexpired state and criterion/evidence, appends the challenge, decision, affected position/ladder versions, audit/outbox, and notifications atomically. A tie or insufficient evidence rejects without reorder.

### Explicit state machine and blocked behavior

| Aggregate | States | Triggered transitions | Blocked/failure behavior |
|---|---|---|---|
| `Avail` | `draft`, `available`, `tentative`, `unavailable`, `expired`, `superseded` | source snapshot accepted → `available`/`tentative`; source conflict/withdraw → `unavailable`; deadline → `expired`; revision → `superseded` | stale calendar or mandate → `blocked` command outcome; no public available projection |
| `CommercialLadder` | `open`, `closed`, `superseded`, `blocked` | publish → `open`; close/revision → `closed`/`superseded`; policy/source uncertainty → `blocked` | blocked ladder cannot accept positions or reorder; retry after pinned source refresh |
| `CommercialPosition` | `requested`, `active`, `challenged`, `confirmed`, `released`, `expired`, `displaced` | admission → `active`; challenge → `challenged`; release/clock → terminal; upheld challenge → `displaced` | capacity/version race returns `POSITION_CONFLICT`; no silent ordinal rewrite |
| `PositionChallenge` | `submitted`, `upheld`, `rejected`, `withdrawn`, `blocked` | evidence check → `upheld`/`rejected`; withdrawal → `withdrawn`; source uncertainty → `blocked` | blocked challenge retains evidence and never changes ladder order |

Idempotency binds tenant, actor, route, aggregate, and canonical body hash for 72 hours. Same key/different body is `409 IDEMPOTENCY_CONFLICT`; completed replay returns the stored result. Database time governs expiry. Workers claim due positions with `FOR UPDATE SKIP LOCKED`.

## Events and Dependencies

| Event | Trigger and payload |
|---|---|
| `booking.avail.changed` | avail transition: `{availId,version,subjectType,subjectRef,timeRange,state,sourceVersion,changeCode,occurredAt}` |
| `booking.position.changed` | ladder/position/challenge transition: `{availId,ladderId,ladderVersion,positionId,positionVersion,ordinal,state,challengeId,changeCode,occurredAt}` |

Transactional outbox, per-avail/ladder ordering, at-least-once, event-ID dedupe, retry/dead-letter. Events omit party/competitor identity, evidence, commercial intent, constraints, and decision reason from general consumers.

Calendar/identity/mandate/policy sources use a 2 s total timeout, retries at 100/500 ms, and a circuit opened after 5 failures in 30 s for 60 s; uncertainty fails closed. Expiry/notification workers lease 60 s and retry at 1/5/30 s. Projection failure keeps source state authoritative and prevents a stale public “available” response past freshness policy.

## External Seam Contract Registry

| Seam | Exact request → response | Timeout | Retries / backoff | Circuit | Recovery |
|---|---|---:|---:|---|---|
| Shard-29 calendar/slot | {tenantId,subjectId,subjectType,startsAt,endsAt,expectedVersion} → {found,sourceVersion,state,slotRef,slotVersion} | 2,000 ms | 2; 100/500 ms safe reads | 5 failures/30 s → open 60 s | fail closed; retain stale source state and return 503 DEPENDENCY_UNAVAILABLE |
| Shard-01 identity/mandate | {tenantId,actorPartyId,subjectRef,capability,expectedVersion} → {authorized,partyId,mandateVersion,reasonCode} | 2,000 ms | 2; 100/500 ms | 5 failures/30 s → open 60 s | no mutation; retry same key after circuit recovery |
| Policy/criterion service | {availId,ladderVersion,criterionCode,policyVersion} → {published,criterionVersion,eligible} | 2,000 ms | 2; 100/500 ms | 5 failures/30 s → open 60 s | challenge remains blocked; never infer superiority |
| Outbox/notification worker | {eventId,eventType,aggregateId,aggregateVersion,payloadDigest} → {accepted,receiptId} | 3,000 ms | 3; 1/5/30 s | 5 failures/60 s → open 120 s | durable outbox retry/DLQ; domain commit is not repeated |

## Middleware, Errors, Observability, and Tests

Order: request ID -> TLS/CORS/body/content -> auth/context -> rate -> strict Zod -> subject/party RLS -> source/mandate/policy/conflict -> idempotency/If-Match -> transaction -> minimized response -> redacted audit. Errors strictly use `ApiError { code, message, requestId, details }`.

| Status/code | Condition |
|---|---|
| 400 `VALIDATION_FAILED` | malformed interval/position/action/challenge |
| 401 `UNAUTHENTICATED` | invalid session |
| 403 `FORBIDDEN` | subject/party/venue mandate absent |
| 404 `NOT_FOUND` | absent/concealed avail/position |
| 409 `VERSION_CONFLICT` | stale source/avail/ladder/position |
| 409 `POSITION_CONFLICT` | capacity/duplicate/order conflict |
| 409 `IDEMPOTENCY_CONFLICT` | key/body mismatch |
| 410 `POSITION_EXPIRED` | deadline passed |
| 422 `SUPERIOR_CRITERION_NOT_MET` | challenge evidence insufficient |
| 422 `SOURCE_OR_MANDATE_INVALID` | current authority/source unavailable |
| 429 `RATE_LIMITED` | honor `Retry-After` |
| 503 `DEPENDENCY_UNAVAILABLE` | no availability/priority inferred |

Logs contain request/trace/operation IDs, opaque avail/ladder/position/role IDs, versions/ordinal/state/code, latency, dependency attempt, and outbox age; exclude parties, evidence, intent, constraints, reason, and exact private windows. Metrics cover avail changes, position requests/releases/expiry/reorders, challenges/outcomes, version conflicts, worker lag, latency/errors/circuits/outbox. Availability 99.9%; p99 write <1.5 s; expiry convergence <10 s p99. Page on duplicate ordinal, expired active projection >30 s, or five-minute 5xx >2%.

Tests cover schemas/cross-fields, interval/ordinal/TTL/criterion properties, every role/tenant/mandate/revocation, RLS/field projection, concurrent position/reorder/release/challenge/expiry, idempotency races, source failure/recovery, event privacy/order/dedupe, log redaction, migration/index plans, CORS, and alerts. CI fails on uncovered 30.01–30.05, missing `Avail`/`CommercialLadder`/`CommercialPosition` or events, route collision, hidden reorder, direct write grant, malformed table/link, or unresolved question.

## Per-operation Error, Security, and Limits Matrix

| Operation ID | Status / app code | Stable message | Retry guidance | Authz and 403 vs 404 |
|---|---|---|---|---|
| BE30A-01 | 201 AVAIL_RECORDED; 400/401/403/404/409/429/503 | availability recorded or VALIDATION_FAILED: interval/source/state invalid | replay same key; 409 refresh version; 429 Retry-After; 503 after circuit | room mandate is 403; concealed room/calendar is 404 |
| BE30A-02 | 201 ROUTING_WINDOW_RECORDED; 400/401/403/404/409/429/503 | routing window recorded or VALIDATION_FAILED: interval/source/state invalid | same key replay; refresh on 409; 503 after circuit | artist mandate is 403; concealed artist/calendar is 404 |
| BE30A-03 | 201 POSITION_RECORDED; 400/401/403/404/409/429/503 | position recorded or POSITION_CONFLICT: ladder capacity/order conflict | same key replay; refresh ladder on 409; honor Retry-After | missing buyer/venue standing is 403; concealed avail is 404 |
| BE30A-04 | 200 POSITION_ACTION_RECORDED; 400/401/403/404/409/410/429/503 | position action recorded or VERSION_CONFLICT: position/ladder changed | refresh If-Match; expired position is terminal; retry 503 same key | release holder/reorder mandate is 403; concealed position is 404 |
| BE30A-05 | 201 CHALLENGE_RECORDED; 400/401/403/404/409/422/429/503 | challenge recorded or SUPERIOR_CRITERION_NOT_MET: evidence insufficient | refresh versions; 422 not retried; retry 503 after circuit | lower-position standing is 403; concealed positions are 404 |

Every error row serializes ErrorResponse from the [BE00 Error Handling / Error Architecture](00-infrastructure.md#error-handling): exact `ApiError { code, message, requestId, details }`; codes are operation-specific, messages are stable, and details allowlist only safe versions/retry fields.

### Per-operation middleware and output filtering

| Operation ID | Validation locus | Numeric rate | CORS policy | Output allowlist / forbidden |
|---|---|---:|---|---|
| BE30A-01 | Hono pre-handler + strict `AvailRequest` before RPC | 60/hour/room | `BE00-CORS-WEB-CREDENTIALLED` booking-console allowlist; POST/OPTIONS; no wildcard | id/version/window-state/source version; no private constraints or parties |
| BE30A-02 | Hono pre-handler + strict `AvailRequest` before RPC | 60/hour/artist | `BE00-CORS-WEB-CREDENTIALLED` booking-console allowlist; POST/OPTIONS; no wildcard | id/version/window-state/source version; no routing evidence |
| BE30A-03 | Hono pre-handler + strict `PositionRequest` before RPC | 60/hour/avail | `BE00-CORS-WEB-CREDENTIALLED` booking-console allowlist; POST/OPTIONS; no wildcard | position/ordinal/expiry/state; no competitor identity/evidence |
| BE30A-04 | Hono pre-handler + strict `PositionAction` before RPC | 60/hour/actor | `BE00-CORS-WEB-CREDENTIALLED` booking-console allowlist; POST/OPTIONS; no wildcard | action/version/state/affected count; no private reason |
| BE30A-05 | Hono pre-handler + strict `ChallengeRequest` before RPC | 20/hour/avail | `BE00-CORS-WEB-CREDENTIALLED` booking-console allowlist; POST/OPTIONS; no wildcard | challenge state/versions/reason class; no foreign evidence |

### Pagination and bounded command responses

| Operation ID | Pagination policy | Explicit limit |
|---|---|---|
| BE30A-01 | N/A: single avail command, not a collection read | 30 constraint refs; 64 KiB request body |
| BE30A-02 | N/A: single routing-window command, not a collection read | 30 constraint refs; 64 KiB request body |
| BE30A-03 | N/A: single position command, not a collection read | 30 evidence refs; 100 ladder positions |
| BE30A-04 | N/A: single action command, not a collection read | 100 affected positions; 64 KiB request body |
| BE30A-05 | N/A: single challenge command, not a collection read | 50 evidence refs; 64 KiB request body |

### Per-operation observability registry

| Operation ID | Structured logs and trace | Metrics and SLO | Audit, outbox, and alert |
|---|---|---|---|
| BE30A-01 | request/trace ID, opaque room/calendar/avail IDs, source version, state, latency; no window constraints | avail-recorded count, conflict/5xx rate, p95 500 ms | immutable audit plus change outbox; page on active projection lag >30 s |
| BE30A-02 | request/trace ID, opaque artist/calendar/avail IDs, source version, state, latency; no routing evidence | routing-window count, conflict/5xx rate, p95 500 ms | immutable audit plus change outbox; page on stale routing projection |
| BE30A-03 | request/trace ID, opaque avail/ladder/position IDs, ordinal, expiry, versions; no competitor identity | position-create/conflict rate, p95 600 ms | position audit and outbox; page on duplicate ordinal |
| BE30A-04 | request/trace ID, opaque position/ladder IDs, action, version, state; no private reason | action/reorder/release/expiry counts, p95 500 ms | transition audit and outbox; page on hidden reorder or expiry drift |
| BE30A-05 | request/trace ID, opaque position/challenge IDs, criterion class, versions; no evidence | challenge outcome/422 rate, p95 800 ms | challenge audit and outbox; page on unresolved duplicate challenge |

### Per-operation contract tests

| Test ID | Operation ID | Acceptance evidence |
|---|---|---|
| BE30A-T01 | BE30A-01 | strict AvailRequest, room mandate, source-version CAS, ApiError, audit/outbox, and CORS tests pass |
| BE30A-T02 | BE30A-02 | routing-window schema, artist mandate, independent-source invariant, ApiError, audit/outbox, and CORS tests pass |
| BE30A-T03 | BE30A-03 | PositionRequest ordinal/capacity rules, ladder lock, idempotency race, ApiError, and projection allowlist tests pass |
| BE30A-T04 | BE30A-04 | action/If-Match transitions, release/reorder/expiry races, 403/404, ApiError, and output-redaction tests pass |
| BE30A-T05 | BE30A-05 | challenge criterion/evidence limits, duplicate race, 422 behavior, ApiError, audit privacy, and CORS tests pass |

## Deepening Passes

| Pass | Question | Resolution and evidence |
|---|---|---|
| 1 cross-operation consistency | Can a position bypass the pinned avail, ladder, or routing source? | BE30A-01 through BE30A-05 require current source versions and the same serializable transaction boundary; no route creates authority by inference. |
| 2 sequencing and concurrency | What wins when two actors target one ordinal or reorder concurrently? | Per-aggregate version plus unique (avail_id, ordinal) constraint elects one commit; the loser receives VERSION_CONFLICT or POSITION_CONFLICT and must refetch. |
| 3 failure cascade | What happens when identity, venue mandate, or source lookup fails? | The transaction rolls back before any outbox row; dependency failure is 503 DEPENDENCY_UNAVAILABLE, with circuit state and no inferred availability. |
| 4 authorization completeness | Are role, ownership, and concealment decisions explicit for every operation? | The per-operation error and middleware matrices name room, artist, buyer, venue, and challenge standing; known-but-unauthorized is 403 and concealed targets are 404. |
| 5 observability completeness | Can an operator trace a mutation without exposing private windows or evidence? | Request/trace/operation IDs, opaque resource IDs, versions, latency, audit, outbox, metrics, and redaction rules are defined in the middleware and observability text. |
| 6 abuse and limit edges | Can burst, enumeration, mass assignment, or replay amplify a command? | Numeric actor/resource limits, strict allowlisted Zod bodies, bounded evidence/constraint arrays, idempotency body binding, and Retry-After handling apply to every route. |
| 7 partial-state hygiene | Can expiry, challenge, or release leave a split projection? | CAS/serializable writes, immutable audit, outbox enqueue, worker repair, and terminal expiry rules make commit, rollback, and recovery deterministic. |

## Ambiguity Gate

- Interactions 30.01–30.05, all three canonical models, and both canonical events are fully specified.
- Source independence, ordering, expiry, challenge evidence, concurrency, RLS/grants, recovery, errors, SLOs, and tests are deterministic.
- Open Questions: None.
- Result: **PASS**.

## Open Questions

None.

## Dependency References

- [IA Shard 30](../ia/30-booking-contracts.md)
- Shards 01/14/29/34 identity, engagement, venue, and routing-calendar contracts.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-08-28 | Completed BE30A contracts, route matrices, typed persistence, state/recovery, seam, security, deepening, and ambiguity gates. |
