# BE Spec 35e — Ticket Delivery, Pass Projection, and Transfer Claim

> Source: [IA Shard 35](../ia/35-ticket-products-sales.md), interactions 35.20–35.21. This companion owns canonical `Ticket` issuance/lifecycle and device/channel-specific `TicketPassProjection`. Orders, identity, restrictions, admission scans, refunds, and external wallet/provider state remain source-owned.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 35](../ia/35-ticket-products-sales.md) | Interactions lines 77–103; Contracts lines 104–126; Data Models lines 127–173; Access Control lines 174–197; Event Schemas and Edge Cases lines 207–247 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 19.12 Ticket Delivery & Fan Ticket Wallet | BE35E-20–BE35E-21 / 35.20–35.21 |

## API Endpoints

### Authoritative Route Registry

| Operation ID | IA | Method | Path | Authorization | Idempotency/concurrency | Rate/cache/SLO | CORS policy |
|---|---|---|---|---|---|---|---|
| BE35E-20 | 35.20 | POST | `/api/v1/ticketing/orders/{orderId}/ticket-deliveries` | confirmed-order worker or ticket holder requesting projection refresh | key + order/ticket/delivery policy versions | 30/min/order; no-store; 202 <500 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35E-21 | 35.21 | POST | `/api/v1/ticketing/transfers/{transferId}/claims` | exact recipient identity with signed single-use claim token | key + transfer/ticket/recipient versions | 10/min/transfer; no-store; p95 700 ms | `BE00-CORS-WEB-CREDENTIALLED` |

35.20 issues exactly the confirmed quantity, assigns opaque tickets to authorized holders, creates/updates signed pass projections, and supersedes old barcodes/tokens on lifecycle change. 35.21 atomically transfers control only after recipient proof, policy/restriction checks, and source ticket lock; failed or expired claims leave sender ownership unchanged.

TLS, ULID IDs, authenticated tenant/session or signed order worker, request ID, strict JSON, and 64 KiB body maximum are mandatory. Exact consumer wallet origins receive credentialed CORS; wallet/provider workers are non-browser. Preflight allows route method plus `OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`. Responses are `private, no-store`; pass artifacts use short-lived signed retrieval with no shared cache.

### Per-Operation Validation Middleware Matrix

This is the validation column of the authoritative route registry: join on the stable operation ID above. Each row runs after BE00 request ID/CORS and authentication admission, before authorization/handler execution; the same registry row supplies the numeric rate and literal CORS policy.

| Operation ID | Validation middleware |
|---|---|
| BE35E-20 | strict path `orderId`, headers, and `DeliveryRequest` body; reject unknown keys and validate the success body before serialization |
| BE35E-21 | strict path `transferId`, claim-token headers, and `ClaimTransferRequest` body; reject unknown keys and validate the success body before serialization |

## Zod 4 Contracts

```ts
const Id=z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const At=z.string().datetime({offset:true});
const Ver=z.number().int().positive();
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
const JsonPrimitive=z.union([z.string(),z.number().finite(),z.boolean(),z.null()]);
const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(()=>z.union([JsonPrimitive,z.array(JsonValueSchema),z.record(z.string(),JsonValueSchema)]));
const ApiError=z.object({code:z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),message:z.string().min(1).max(500),requestId:z.string().uuid(),details:z.record(z.string(),JsonValueSchema).refine(v=>Object.keys(v).length<=16)}).strict();
const DeliveryRequest=z.object({
  orderVersion:Ver,ticketVersion:Ver.optional(),deliveryPolicyVersion:Ver,
  holderIdentityIds:z.array(Id).min(1).max(500),
  channels:z.array(z.enum(['mobile_web','apple_wallet','google_wallet','will_call','accessible_pickup'])).min(1).max(5),
  deviceBindingRefs:z.array(Id).max(20),reason:z.enum(['initial','refresh','event_update','holder_update','security_rotate'])
}).strict().refine(v=>new Set(v.holderIdentityIds).size===v.holderIdentityIds.length,{path:['holderIdentityIds'],message:'duplicate holder'});
const ClaimTransferRequest=z.object({
  claimToken:z.string().min(32).max(2048),expectedTransferVersion:Ver,
  expectedTicketVersion:Ver,recipientIdentityId:Id,recipientProofId:Id,
  acceptedPolicyVersion:Ver,deviceBindingRef:Id.optional()
}).strict();
```

Unknown keys, quantity/holder mismatch, unconfirmed/cancelled/refunded order, stale ticket/transfer/policy, invalid/expired/replayed token, sender-recipient equality, restricted recipient, non-transferable product, scanned/void/refunded ticket, raw barcode/private key, and unsafe device/provider data fail before mutation. Claim tokens are 256-bit random, hashed at rest, recipient/policy/ticket-bound, single-use, and expire by database time.

## Persistence, RLS, and Grants

```sql
create table tickets (
  id text not null, version bigint not null check(version>0), tenant_id text not null,
  event_id text not null, order_id text not null, order_line_ref text not null,
  holder_identity_id text not null, product_ref text not null,
  seat_or_access_ref text not null, delivery_policy_version bigint not null,
  state text not null check(state in ('issued','delivered','transfer_pending','transferred','void','refunded','consumed')),
  credential_epoch bigint not null check(credential_epoch>0),
  prior_holder_hash text, created_at timestamptz not null,
  primary key(id,version), unique(order_id,order_line_ref)
);
create table ticket_pass_projections (
  id text not null, version bigint not null check(version>0), ticket_id text not null,
  ticket_version bigint not null, holder_identity_id text not null,
  channel text not null check(channel in ('mobile_web','apple_wallet','google_wallet','will_call','accessible_pickup')),
  device_binding_ref text, artifact_ref text, artifact_hash text,
  credential_hash text not null, credential_epoch bigint not null,
  state text not null check(state in ('pending','active','superseded','revoked','failed')),
  expires_at timestamptz not null, provider_receipt text, created_at timestamptz not null,
  primary key(id,version), unique(ticket_id,channel,credential_epoch),
  foreign key(ticket_id,ticket_version) references tickets(id,version) on delete restrict
);
create table ticket_transfers (
  id text not null, version bigint not null check(version>0), ticket_id text not null,
  ticket_version bigint not null, sender_identity_id text not null,
  recipient_identity_id text not null, claim_token_hash text not null unique,
  policy_version bigint not null, state text not null
    check(state in ('offered','claimed','expired','cancelled','rejected')),
  expires_at timestamptz not null, claimed_at timestamptz,
  created_at timestamptz not null, primary key(id,version),
  check(sender_identity_id<>recipient_identity_id),
  check((state='claimed')=(claimed_at is not null)),
  foreign key(ticket_id,ticket_version) references tickets(id,version) on delete restrict
);
create table ticket_delivery_jobs (
  id text primary key, order_id text not null, ticket_ids jsonb not null check(jsonb_typeof(ticket_ids)='array'),
  channels text[] not null check(cardinality(channels) between 1 and 5),
  state text not null check(state in ('queued','projecting','delivered','partial','failed_retryable','dead_lettered')),
  projection_version bigint not null check(projection_version>0), version bigint not null check(version>0),
  created_at timestamptz not null, unique(order_id,projection_version)
);
create table ticket_delivery_attempts (
  id text primary key, ticket_id text not null, ticket_version bigint not null check(ticket_version>0),
  pass_projection_id text not null, pass_projection_version bigint not null check(pass_projection_version>0),
  channel text not null, destination_digest text not null,
  attempt integer not null check(attempt>0), state text not null
    check(state in ('queued','signing','delivering','delivered','failed_retryable','dead_lettered')),
  provider_receipt text, error_code text, next_attempt_at timestamptz,
  created_at timestamptz not null, unique(pass_projection_id,attempt),
  foreign key(ticket_id,ticket_version) references tickets(id,version) on delete restrict,
  foreign key(pass_projection_id,pass_projection_version) references ticket_pass_projections(id,version) on delete restrict
);
```

Required query indexes cover ticket holder/event/state/current epoch, order, active pass/channel/device/expiry, transfer recipient/state/expiry, `ticket_delivery_jobs(order_id,state,created_at)`, and due `ticket_delivery_attempts(state,next_attempt_at)`. All tables enable and force RLS. `anon` has no grants; authenticated callers use security-definer RPCs only. Holders see own minimized tickets/passes; senders see transfer receipt state without recipient private data beyond what they supplied; recipients see only their addressed offer. Barcode/credential hashes and provider receipts are service-only. Scanner workers receive a verification projection keyed by ticket/epoch/state, not artifact secrets. Direct client update/delete is denied; delivery workers have leased attempt rows.

## Transactions, State, and Recovery

- BE35E-20 locks the confirmed 35b order and existing tickets. Initial delivery inserts exactly one `Ticket` per order line/quantity, verifies holder count, creates pending `TicketPassProjection` rows with a new credential epoch, audit/outbox, and jobs atomically. Refresh/update increments ticket version/epoch, supersedes prior passes, and writes deny-first scanner invalidations before exposing new artifacts.
- A delivery worker renders/signs the pass with KMS/HSM, scans the artifact, sends it through the selected channel, and CAS-transitions `pending -> active`. Retry reuses the same projection/credential epoch; it never issues another ticket. Terminal failure leaves will-call/accessibility recovery available under policy.
- Transfer offer creation is a governed ticket update consumed from the delivery/update command path: it locks an eligible issued ticket, appends `transfer_pending`, stores one recipient-bound token hash, and revokes active sender projections only when policy says pending transfer must suspend use.
- BE35E-21 locks transfer/ticket in stable order, verifies token constant-time, recipient proof/policy/restriction, and expiry, then appends the claimed transfer, a new ticket version/holder/credential epoch, revoked sender projections, pending recipient projections, scanner invalidation, audit/outbox, and response in one transaction. Any check failure leaves ownership unchanged.

Expiry/cancellation returns `transfer_pending -> issued|delivered` to the sender and rotates credentials when any claim token may have leaked. Consumed/refunded/void tickets cannot transfer. Idempotency binds tenant, actor/worker, route, order/transfer, and body hash for 72 hours; same key/different body is `409 IDEMPOTENCY_CONFLICT`.

## Event and External Seams

| Event | Trigger and payload |
|---|---|
| `ticketing.delivery.changed` | ticket/pass/transfer transition: `{eventId,ticketId,ticketVersion,credentialEpoch,holderChangeCode,passProjectionId,channel,state,transferId,occurredAt}` |

Envelope: `{eventId,eventType,schemaVersion:1,aggregateId,aggregateVersion,tenantId,occurredAt,traceId,payload}`. Transactional outbox, per-ticket ordering, at-least-once, event-ID dedupe, 24-hour retry/dead-letter. Identity, device, token, artifact URL, barcode, seat details, and provider payload are excluded. Scanner consumers receive an authorized `ticketId,credentialEpoch,state` projection.

Order/identity/restriction/scanner sources use 2 s, retries 100/500 ms, circuit after 5 failures/30 s for 60 s; authority uncertainty fails closed. Wallet/email/SMS adapters use 3 s, retries 1/5/30 s with jitter, circuit 5/min for 2 min, and destination idempotency key. KMS/signing timeout is 2 s with no unsafe fallback; circuit failure leaves projection pending. Workers lease 60 s/renew 20 s and operator replay requires step-up/reason.

### Exact integration contracts

| Seam | Exact request → response | Timeout, retry/backoff, circuit, and recovery |
|---|---|---|
| Order/identity/restriction/scanner authority | `{orderOrTicketId,holderOrRecipientRef,eventId,expectedVersions,policyVersion}` → `{authorized,orderState,ticketState,restrictionDecision,scannerEpoch,sourceVersions}` | 2 s total; two attempts at 100/500 ms full-jitter backoff; opens after 5 failures/30 s for 60 s; uncertainty fails closed before issue/claim and never splits ownership |
| Wallet/email/SMS adapter | `{ticketId,passProjectionRef,channel,destinationToken,destinationKey,credentialEpoch}` → `{providerReceiptId,state,acceptedEpoch}` | 3 s total; three attempts at 1/5/30 s jittered backoff; opens after 5 failures/min for 2 min; delivery stays pending/retryable and superseded epochs cannot reactivate |
| KMS/signing | `{ticketId,credentialEpoch,artifactDigest,keyPurpose}` → `{signature,keyVersion,signedAt}` | 2 s total; no retry after an ambiguous signature response, one pre-send retry at 200 ms only; opens after 5 failures/30 s for 60 s; no software-key fallback and projection remains pending for receipt reconciliation |

## Middleware, Errors, Observability, and Verification

Order: request ID -> TLS/CORS/body/content -> auth/service signature -> tenant/context -> rate -> strict Zod -> order/ticket/person RLS -> restriction/transfer policy -> step-up where required -> idempotency/If-Match -> transaction -> response validation -> redacted audit. Errors strictly match `ApiError { code, message, requestId, details }`.

| Status/code | Condition |
|---|---|
| 400 `VALIDATION_FAILED` | malformed holders/channels/token/proof |
| 401 `UNAUTHENTICATED` | invalid session/principal |
| 403 `FORBIDDEN` | holder/recipient/policy capability absent |
| 404 `NOT_FOUND` | absent/concealed order/ticket/transfer |
| 409 `VERSION_CONFLICT` | stale order/ticket/transfer |
| 409 `ORDER_QUANTITY_CONFLICT` | holders do not match confirmed quantity |
| 409 `TICKET_STATE_CONFLICT` | consumed/refunded/void/ineligible |
| 409 `IDEMPOTENCY_CONFLICT` | key/body mismatch |
| 410 `TRANSFER_EXPIRED` | ownership remains/returns to sender |
| 422 `RECIPIENT_OR_POLICY_INVALID` | proof/restriction/transfer policy failed |
| 429 `RATE_LIMITED` | honor `Retry-After` |
| 503 `SIGNING_UNAVAILABLE` | ticket retained, projection pending |
| 503 `DELIVERY_UNAVAILABLE` | retry/recovery channel remains explicit |

Logs include request/trace/operation IDs, opaque order/ticket/transfer/pass IDs, versions/epoch, channel/state/code, attempt, latency, circuit/outbox age; exclude identity, token/hash, device, seat, barcode, artifact, destination, and provider payload. Metrics cover issue quantity invariant, delivery latency/failure/channel, credential rotation/invalidation lag, transfer claim/expiry/conflict, signing/delivery circuits, errors/outbox/dead letters. Availability target 99.95%; p99 claim <1 s; 99% initial passes active <2 min; scanner invalidation p99 <3 s. Page on quantity invariant breach, invalidation >10 s, delivery oldest >10 min, or five-minute 5xx >1%.

Tests cover strict schemas/cross-fields, quantity/holder and state properties, every route x role/tenant/revocation, RLS/grants, concurrent issue/refresh/claim/expiry/scan, token expiry/replay/constant-time compare, sender unchanged on failure, credential rotation and deny-first scanner convergence, idempotency races, KMS/provider retries/circuit/recovery, event privacy/order/dedupe, log redaction, migration/index plans, CORS, and SLO alerts. CI fails on uncovered 35.20–35.21, missing `Ticket`/`TicketPassProjection`/event, route collision, duplicate ticket, transfer ownership split, direct write grant, malformed table/link, or secret leakage.

## Exact Typed Success Schemas

The operation comments are the normative route mappings for these strict Zod 4 bodies. Credential material and claim-token secrets never appear in a response.

~~~ts
import { z } from "zod";
const Uuid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const Version = z.int().positive();
const RequestId = z.string().min(16).max(128);
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
// BE35E-20 / 35.20
export const TicketDeliveryV1 = z.object({
  jobId: Uuid, orderId: Uuid, ticketIds: z.array(Uuid).min(1).max(1000),
  channels: z.array(z.enum(["mobile_web", "apple_wallet", "google_wallet", "will_call", "accessible_pickup"])).min(1).max(5),
  state: z.enum(["queued", "projecting", "delivered", "partial", "failed_retryable", "dead_lettered"]),
  projectionVersion: Version, version: Version, requestId: RequestId,
}).strict();
// BE35E-21 / 35.21
export const TicketTransferClaimV1 = z.object({
  transferId: Uuid, ticketId: Uuid, priorHolderHash: Digest, newHolderId: Uuid,
  state: z.literal("claimed"), credentialEpoch: Version, version: Version, requestId: RequestId,
}).strict();
~~~

## Per-Operation Auditability Closure

Each failure instantiates BE00 `ApiError { code, message, requestId, details }`; details exclude holder identity, claim token/proof, barcode/key, device binding, restriction, or provider payload. Unknown faults are `500 INTERNAL_ERROR`; rate denial is `429 RATE_LIMITED` with `Retry-After`.

| Operation | Exact request → success contract | Exact errors and deterministic recovery | Required observability | Required operation tests |
|---|---|---|---|---|
| BE35E-20 | `DeliveryRequest` → 202 `TicketDeliveryV1 { jobId,orderId,ticketIds,channels,state,projectionVersion,version,requestId }` | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 VERSION_CONFLICT, ORDER_QUANTITY_CONFLICT, TICKET_STATE_CONFLICT, or IDEMPOTENCY_CONFLICT; 429 RATE_LIMITED; 503 SIGNING_UNAVAILABLE or DELIVERY_UNAVAILABLE. Ticket persists; projection remains pending and retryable by same key. | `ticket_delivery_total`, projection age, signer/wallet attempt/circuit, supersession count | holder/quantity/channel body and response; holder/worker auth; CORS/ApiError; signer timeout, retry, stale credential supersession |
| BE35E-21 | `ClaimTransferRequest` → 201 `TicketTransferClaimV1 { transferId,ticketId,priorHolderHash,newHolderId,state,credentialEpoch,version,requestId }` | common 400/401/403/404/429 plus 409 VERSION_CONFLICT, TICKET_STATE_CONFLICT, or IDEMPOTENCY_CONFLICT; 410 TRANSFER_EXPIRED; 422 RECIPIENT_OR_POLICY_INVALID. Failure leaves sender owner and credential epoch unchanged; exact token replay returns original claim. | `ticket_transfer_claim_total`, token replay/expiry, restriction denial, lock latency | token/proof/policy body; exact recipient/404 concealment; CORS/BE00 ApiError envelope; claim-vs-revoke/expiry race and atomic holder/epoch change |

## Ambiguity Gate

- Interactions 35.20–35.21, both canonical models, and `ticketing.delivery.changed` are fully specified.
- Quantity, lifecycle, pass signing, delivery retry, transfer atomicity, credential invalidation, RLS/grants, errors, recovery, SLOs, and tests are deterministic.
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
- Shards 01/06/35a–35d/36 identity, restrictions, inventory, orders, packages, and scanner contracts.
