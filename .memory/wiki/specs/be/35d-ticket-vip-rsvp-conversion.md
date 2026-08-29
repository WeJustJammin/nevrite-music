# BE Spec 35d — VIP Packages, RSVP Admission, and Free-to-Paid Conversion

> Source: [IA Shard 35](../ia/35-ticket-products-sales.md), interactions 35.15–35.19. This companion owns versioned `AccessPackage` composition and `RSVPAdmission` lifecycle. Inventory, cart/order/payment, identity, credentials, scanning, and event state remain canonical at their owning seams.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 35](../ia/35-ticket-products-sales.md) | Interactions lines 77–103; Contracts lines 104–126; Data Models lines 127–173; Access Control lines 174–197; Event Schemas and Edge Cases lines 207–247 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 19.08 VIP Packages & Meet-and-Greet | BE35D-15–BE35D-17 / 35.15–35.17 |
| 19.11 RSVP & Free/Private Event Admission | BE35D-18–BE35D-19 / 35.18–35.19 |

## API Endpoints

### Authoritative Route Registry

| Operation ID | IA | Method | Path | Authorization | Idempotency/concurrency | Rate/cache/SLO | CORS policy |
|---|---|---|---|---|---|---|---|
| BE35D-15 | 35.15 | POST | `/api/v1/ticketing/events/{eventId}/access-packages` | event VIP/product administrator | key + `If-Match` manifest/product versions | 30/hour/event; no-store; p95 600 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35D-16 | 35.16 | POST | `/api/v1/ticketing/access-packages/{packageId}/purchases` | eligible purchaser/controller | key + package/inventory/cart versions | 10/min/identity; no-store; 202 <800 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35D-17 | 35.17 | POST | `/api/v1/ticketing/access-packages/{packageId}/redemptions` | exact entitlement holder or authorized scanner | key + entitlement/version/checkpoint | 30/min/checkpoint; no-store; p95 500 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35D-18 | 35.18 | POST | `/api/v1/ticketing/events/{eventId}/rsvps` | eligible identity under admission policy | key + identity/event/policy | 10/hour/identity; no-store; p95 400 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE35D-19 | 35.19 | POST | `/api/v1/ticketing/events/{eventId}/paid-conversions` | event ticket administrator + step-up | key + source RSVP set/manifest versions | 5/day/event; no-store; 202 <800 ms | `BE00-CORS-WEB-CREDENTIALLED` |

35.15 composes sale/admission plus bounded benefits, fulfillment owner, capacity, schedule, transfer, accessibility, and refund policy. 35.16 uses 35b checkout and creates benefits only after the order is confirmed. 35.17 consumes the exact benefit once while allowing explicitly multi-use benefits. 35.18 creates free admission within capacity and identity limits. 35.19 freezes a conversion cohort, preserves already consumed/guaranteed admissions under explicit policy, and offers or migrates remaining RSVPs without silently charging anyone.

TLS, ULID IDs, request ID, strict JSON, authenticated tenant/session or scanner principal, and a 96 KiB cap are required. Exact consumer/admin/scanner origins receive their separate credentialed CORS policies; preflight permits only route method plus `OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`. Responses are private/no-store; public package discovery uses a separate minimized read projection.

### Per-Operation Validation Middleware Matrix

This is the validation column of the authoritative route registry: join on the stable operation ID above. Each row runs after BE00 request ID/CORS and authentication admission, before authorization/handler execution; the same registry row supplies the numeric rate and literal CORS policy.

| Operation ID | Validation middleware |
|---|---|
| BE35D-15 | strict path `eventId`, headers, and `PackageRequest` body; reject unknown keys and validate the success body before serialization |
| BE35D-16 | strict path `packageId`, headers, and `PurchaseRequest` body; reject unknown keys and validate the success body before serialization |
| BE35D-17 | strict path `packageId`, scanner headers, and `RedemptionRequest` body; reject unknown keys and validate the success body before serialization |
| BE35D-18 | strict path `eventId`, headers, and `RSVPRequest` body; reject unknown keys and validate the success body before serialization |
| BE35D-19 | strict path `eventId`, headers, and `ConversionRequest` body; reject unknown keys and validate the success body before serialization |

## Zod 4 Contracts

```ts
const Id=z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const At=z.string().datetime({offset:true});
const Ver=z.number().int().positive();
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
const JsonPrimitive=z.union([z.string(),z.number().finite(),z.boolean(),z.null()]);
const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(()=>z.union([JsonPrimitive,z.array(JsonValueSchema),z.record(z.string(),JsonValueSchema)]));
const ApiError=z.object({code:z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),message:z.string().min(1).max(500),requestId:z.string().uuid(),details:z.record(z.string(),JsonValueSchema).refine(v=>Object.keys(v).length<=16)}).strict();
const Benefit=z.object({
  benefitId:Id,type:z.enum(['admission','meet_greet','merch','hospitality','early_entry','soundcheck','other']),
  fulfillmentOwnerId:Id,capacity:z.number().int().min(0).max(1_000_000),
  uses:z.number().int().min(1).max(100),windowStart:At,windowEnd:At,
  accessibilityPolicyRef:Id,transferable:z.boolean()
}).strict().refine(v=>Date.parse(v.windowStart)<Date.parse(v.windowEnd),{path:['windowEnd'],message:'must follow start'});
const PackageRequest=z.object({
  expectedVersion:Ver,manifestVersion:Ver,name:z.string().trim().min(1).max(160),
  productRef:Id,priceSnapshotRef:Id,benefits:z.array(Benefit).min(1).max(50),
  salesOpenAt:At,salesCloseAt:At,refundPolicyRef:Id,transferPolicyRef:Id
}).strict().superRefine((v,c)=>{
  if(Date.parse(v.salesOpenAt)>=Date.parse(v.salesCloseAt))c.addIssue({code:'custom',path:['salesCloseAt'],message:'must follow open'});
  if(new Set(v.benefits.map(x=>x.benefitId)).size!==v.benefits.length)c.addIssue({code:'custom',path:['benefits'],message:'benefit ID unique'});
});
const PurchaseRequest=z.object({
  expectedPackageVersion:Ver,purchaserId:Id,quantity:z.number().int().min(1).max(100),
  cartId:Id,paymentIntentRef:Id,recipientIdentityIds:z.array(Id).min(1).max(100)
}).strict().refine(v=>v.recipientIdentityIds.length===new Set(v.recipientIdentityIds).size,{path:['recipientIdentityIds'],message:'duplicate recipient'});
const RedemptionRequest=z.object({
  entitlementId:Id,benefitId:Id,holderIdentityId:Id,checkpointId:Id,
  expectedEntitlementVersion:Ver,scannerSequence:z.bigint().nonnegative(),observedAt:At
}).strict();
const RSVPRequest=z.object({
  identityId:Id,admissionPolicyVersion:Ver,quantity:z.number().int().min(1).max(20),
  accessibilityCode:z.enum(['none','wheelchair_space','companion','other']),
  sourceChannelRef:Id
}).strict();
const ConversionRequest=z.object({
  expectedEventVersion:Ver,sourceRSVPPolicyVersion:Ver,manifestVersion:Ver,
  conversionPolicy:z.enum(['honor_confirmed','offer_purchase','mixed']),
  honorStates:z.array(z.enum(['checked_in','guaranteed','confirmed'])).min(1),
  offerExpiresAt:At,priceSnapshotRef:Id,reason:z.string().trim().min(1).max(1000)
}).strict();
```

Unknown keys, duplicate benefits/recipients, stale product/policy/manifest, capacity mismatch, invalid windows, ineligible/restricted identity, duplicate scanner sequence, expired entitlement/RSVP/offer, raw payment data, and unsafe names/reasons fail before persistence. Purchase total and benefit capacity derive from pinned sources; client values are not trusted.

## Persistence, RLS, and Grants

```sql
create table access_packages (
  id text not null, version bigint not null check(version>0), tenant_id text not null,
  event_id text not null, manifest_version bigint not null, product_ref text not null,
  name text not null, price_snapshot_ref text not null, benefit_json jsonb not null,
  capacity integer not null check(capacity>=0),
  sales_open_at timestamptz not null, sales_close_at timestamptz not null,
  refund_policy_ref text not null, transfer_policy_ref text not null,
  state text not null check(state in ('draft','on_sale','closed','cancelled','superseded')),
  created_by text not null, created_at timestamptz not null,
  primary key(id,version), check(sales_open_at<sales_close_at)
);
create table package_purchases (
  id text primary key, package_id text not null, package_version bigint not null check(package_version>0),
  cart_id text not null, order_id text not null unique, purchaser_identity_id text not null,
  recipient_count integer not null check(recipient_count between 1 and 100),
  state text not null check(state in ('pending_order','active','partially_redeemed','redeemed','cancelled','refunded')),
  version bigint not null check(version>0), created_at timestamptz not null,
  foreign key(package_id,package_version) references access_packages(id,version) on delete restrict
);
create table package_entitlements (
  id text not null, version bigint not null check(version>0), package_id text not null,
  package_version bigint not null, purchase_id text not null references package_purchases(id) on delete restrict,
  order_id text not null, holder_identity_id text not null,
  benefit_state jsonb not null,
  state text not null check(state in ('pending_order','active','partially_redeemed','redeemed','cancelled','refunded')),
  created_at timestamptz not null, primary key(id,version),
  unique(order_id,holder_identity_id)
);
create table package_redemptions (
  id text primary key, entitlement_id text not null, entitlement_version bigint not null check(entitlement_version>0), benefit_id text not null,
  holder_identity_id text not null, checkpoint_id text not null,
  scanner_sequence bigint not null check(scanner_sequence>=0), remaining_uses integer not null check(remaining_uses>=0),
  state text not null check(state in ('redeemed','replayed','reversed')), observed_at timestamptz not null,
  created_at timestamptz not null,
  unique(entitlement_id,benefit_id,scanner_sequence)
);
create table rsvp_admissions (
  id text not null, version bigint not null check(version>0), tenant_id text not null,
  event_id text not null, identity_id text not null, admission_policy_version bigint not null,
  quantity integer not null check(quantity>0), accessibility_code text not null,
  state text not null check(state in ('confirmed','guaranteed','offered_paid','converted','cancelled','expired','checked_in')),
  source_channel_ref text not null, admission_ref text, conversion_cohort_id text,
  created_at timestamptz not null, primary key(id,version),
  unique(event_id,identity_id,admission_policy_version)
);
create table paid_conversion_cohorts (
  id text primary key, job_id text not null unique, event_id text not null, event_version bigint not null,
  source_policy_version bigint not null, manifest_version bigint not null,
  conversion_policy text not null, honor_states jsonb not null,
  offer_expires_at timestamptz not null, price_snapshot_ref text not null,
  source_digest text not null unique, state text not null
    check(state in ('planned','processing','complete','partial','cancelled')),
  preserved_count integer not null default 0 check(preserved_count>=0),
  offered_count integer not null default 0 check(offered_count>=0),
  released_count integer not null default 0 check(released_count>=0),
  version bigint not null check(version>0), created_by text not null, created_at timestamptz not null
);
alter table package_entitlements add constraint package_entitlement_package_fk
  foreign key(package_id,package_version) references access_packages(id,version) on delete restrict;
alter table package_redemptions add constraint package_redemption_entitlement_fk
  foreign key(entitlement_id,entitlement_version) references package_entitlements(id,version) on delete restrict;
alter table rsvp_admissions add constraint rsvp_conversion_cohort_fk
  foreign key(conversion_cohort_id) references paid_conversion_cohorts(id) on delete restrict;
create index access_packages_event_state_window_idx on access_packages(event_id,state,sales_open_at,sales_close_at);
create index package_purchases_package_state_idx on package_purchases(package_id,package_version,state,created_at desc);
create index package_purchases_purchaser_state_idx on package_purchases(purchaser_identity_id,state,created_at desc);
create index package_entitlements_holder_state_idx on package_entitlements(holder_identity_id,state,created_at desc);
create index package_entitlements_order_idx on package_entitlements(order_id,version desc);
create index package_redemptions_checkpoint_sequence_idx on package_redemptions(checkpoint_id,scanner_sequence);
create index rsvp_admissions_event_state_idx on rsvp_admissions(event_id,state,created_at desc);
create index paid_conversion_cohorts_event_state_idx on paid_conversion_cohorts(event_id,state,offer_expires_at);
```

Benefit capacity/reservation rows are unique by package/version/benefit/entitlement and prevent over-consumption. `event_id`, `product_ref`, `order_id`, `holder_identity_id`, policy/snapshot references, and actor/tenant IDs are revision-pinned owner seams to the Shard35 ticket-event/product/order owners and Shard00 party/policy owners; migrations verify existence through deferrable constraint triggers because those aggregates are not duplicated here. Local composite foreign keys above use `ON DELETE RESTRICT`; the nullable cohort relation also restricts deletion. All tables enable and force RLS. `anon` has no base grants; authenticated clients execute RPCs only. Purchasers/holders see own minimized package/entitlement/RSVP. VIP staff see assigned fulfillment benefits, not unrelated identity/payment. Scanner projection is opaque and checkpoint-scoped. Admin conversion access requires event scope and step-up. Direct client update/delete is denied; workers use leased rows.

## Transactions and Lifecycles

- BE35D-15 locks product/manifest and all benefit capacities, validates fulfillment owners and windows, then appends `AccessPackage`, capacity rows, audit/outbox, and response.
- BE35D-16 reserves every benefit in stable benefit-ID order, creates a 35b cart/checkout receipt, and inserts pending entitlements. Confirmed order activates all entitlements atomically; payment failure releases all reservations exactly once.
- BE35D-17 locks entitlement/benefit, verifies holder/checkpoint/window/sequence and remaining uses, appends redemption, decrements uses, updates state, and emits the event. Offline scanner replay is idempotent by entitlement/benefit/sequence.
- BE35D-18 locks RSVP capacity and identity limit, appends `RSVPAdmission`, creates an admission projection, and commits. Cancellation/expiry releases unused capacity once; check-in is non-returnable.
- BE35D-19 freezes the source RSVP cohort/digest, locks event/manifest capacity, writes one decision per RSVP: honor, paid offer, or preserved terminal state. It never creates a payment intent or converts consent implicitly. Worker retries converge by cohort/RSVP uniqueness; partial outcomes remain explicit and replayable.

Idempotency binds tenant, actor/scanner, route, aggregate, and body hash for 72 hours. Same-key/different-body returns `409 IDEMPOTENCY_CONFLICT`; completed replay returns the stored response. Database time controls windows and expiry.

## Events and Dependencies

| Event | Trigger and payload |
|---|---|
| `ticketing.package.changed` | package/entitlement/redemption transition: `{eventId,packageId,packageVersion,entitlementId,benefitId,state,usesRemaining,checkpointId,occurredAt}` |
| `ticketing.admission.changed` | RSVP/conversion transition: `{eventId,admissionId,version,state,quantity,conversionCohortId,changeCode,occurredAt}` |

35b order confirmation is consumed by pinned order/version; 35d purchase orchestration also produces the canonical `ticketing.order.changed` through the 35b owner, never a competing order event. Transactional outbox, per-aggregate ordering, at-least-once, event-ID dedupe, 24-hour retry/dead-letter. Events exclude identity, accessibility, payment, price, policy details, and scanner credentials.

Inventory/order/identity/restriction sources use 2 s, retries 100/500 ms, circuit 5 failures/30 s for 60 s and fail closed. Scanner projection uses 1 s and retries 100/500/2000 ms; local offline entries sync by monotonic scanner sequence. Fulfillment notifications use 3 s and retries 1/5/30 s; source entitlement state remains authoritative.

### Exact integration contracts

| Seam | Exact request → response | Timeout, retry/backoff, circuit, and recovery |
|---|---|---|
| Inventory/order/identity/restriction authority | `{eventId,packageOrRsvpId,subjectRefs,quantity,expectedVersions,policyVersion}` → `{authorized,orderState,capacityRemaining,restrictionDecisions,sourceVersions}` | 2 s total; two attempts at 100/500 ms full-jitter backoff; opens after 5 failures/30 s for 60 s; uncertainty fails closed and releases only this operation's uncommitted reservation |
| Scanner projection | `{entitlementOrAdmissionId,eventId,state,credentialEpoch,projectionVersion,dedupeKey}` → `{scannerReceiptId,state,appliedVersion}` | 1 s total; three attempts at 100/500/2000 ms backoff; opens after 5 failures/30 s for 60 s; local source state remains authoritative and sync is monotonic |
| Fulfillment notification | `{purchaseOrConversionId,recipientPolicyId,templateVersion,destinationKey}` → `{deliveryReceiptId,state}` | 3 s total; three attempts at 1/5/30 s backoff; opens after 5 failures/min for 2 min; failed delivery is retryable and never revokes the source entitlement/admission |

## Middleware, Errors, Observability, and Tests

Order: request ID -> TLS/CORS/body/content -> auth/scanner signature -> tenant/context -> rate -> strict Zod -> event/person/package RLS -> eligibility/restriction -> step-up for conversion -> idempotency/If-Match -> transaction -> response schema -> redacted audit. Every failure is `ApiError { code, message, requestId, details }`.

| Status/code | Meaning |
|---|---|
| 400 `VALIDATION_FAILED` | malformed benefit/window/recipient/policy |
| 401 `UNAUTHENTICATED` | session/scanner invalid |
| 403 `FORBIDDEN` | package/event/checkpoint capability absent |
| 404 `NOT_FOUND` | absent/concealed package/entitlement/RSVP |
| 409 `VERSION_CONFLICT` | stale package/event/entitlement |
| 409 `CAPACITY_CONFLICT` | benefit/admission unavailable |
| 409 `ALREADY_REDEEMED` | uses exhausted or scanner replay conflict |
| 409 `IDEMPOTENCY_CONFLICT` | key/body mismatch |
| 410 `WINDOW_CLOSED` | sale/benefit/RSVP/offer expired |
| 422 `ORDER_NOT_CONFIRMED` | purchase cannot activate |
| 422 `CONVERSION_POLICY_INVALID` | cohort would remove protected admission or imply consent |
| 429 `RATE_LIMITED` | honor `Retry-After` |
| 503 `DEPENDENCY_UNAVAILABLE` | no capacity/entitlement mutation |

Logs contain opaque request/event/package/benefit/entitlement/admission/cohort IDs, versions/counts/state/code, latency, scanner sequence class, dependency attempt, and outbox age; exclude identity, accessibility, payment, price, reason, and checkpoint secrets. Metrics cover package capacity, purchase activation, redemption conflict/offline lag, RSVP utilization, conversion outcomes/partial age, latency/errors/circuits/outbox. Availability 99.95% during access windows; p99 redemption <750 ms; oversubscription zero. Page on capacity invariant breach, scanner sync lag >30 s during event, conversion partial >10 min, or five-minute 5xx >1%.

Tests cover strict schemas/cross-fields, benefit/RSVP capacity and multi-use properties, every route x role/tenant/revocation/checkpoint, RLS/grants, concurrent purchases/redemptions/RSVPs/conversions, payment/order failure release, scanner duplicate/offline order, protected RSVP conversion, idempotency races, adapter retries/circuit/recovery, event privacy/order/dedupe, log redaction, migration/index plans, CORS, and SLO alerts. CI fails on uncovered 35.15–35.19, missing `AccessPackage`/`RSVPAdmission` or events, route collision, silent paid conversion, direct write grant, malformed table/link, or sensitive leakage.

## Exact Typed Success Schemas

Operation comments bind all five routes to strict Zod 4 success objects. A conversion body reports cohort disposition only and cannot imply an unconsented charge.

~~~ts
import { z } from "zod";
const Uuid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const Version = z.int().positive();
const Instant = z.iso.datetime({ offset: true });
const RequestId = z.string().min(16).max(128);
const Window = z.object({ startsAt: Instant, endsAt: Instant }).strict();
// BE35D-15 / 35.15
export const AccessPackageV1 = z.object({
  packageId: Uuid, eventId: Uuid, name: z.string().min(1).max(160),
  benefits: z.array(z.object({ benefitId: Uuid, code: z.string().regex(/^[a-z0-9_]{1,64}$/), useLimit: z.int().positive().max(100), window: Window }).strict()).min(1).max(100),
  capacity: z.int().nonnegative().max(1_000_000), salesWindow: Window,
  state: z.enum(["draft", "on_sale", "closed", "cancelled", "superseded"]), version: Version, requestId: RequestId,
}).strict();
// BE35D-16 / 35.16
export const AccessPackagePurchaseV1 = z.object({
  purchaseId: Uuid, packageId: Uuid, orderId: Uuid,
  state: z.enum(["pending_order", "active", "partially_redeemed", "redeemed", "cancelled", "refunded"]), recipientCount: z.int().positive().max(100),
  version: Version, requestId: RequestId,
}).strict();
// BE35D-17 / 35.17
export const BenefitRedemptionV1 = z.object({
  redemptionId: Uuid, entitlementId: Uuid, benefitId: Uuid, remainingUses: z.int().nonnegative().max(100),
  state: z.enum(["redeemed", "replayed", "reversed"]), scannerSequence: z.bigint().nonnegative(), requestId: RequestId,
}).strict();
// BE35D-18 / 35.18
export const RSVPAdmissionV1 = z.object({
  rsvpId: Uuid, eventId: Uuid, identityId: Uuid, state: z.enum(["confirmed", "guaranteed", "offered_paid", "converted", "cancelled", "expired", "checked_in"]),
  admissionRef: Uuid.nullable(), policyVersion: Version, version: Version, requestId: RequestId,
}).strict();
// BE35D-19 / 35.19
export const PaidConversionV1 = z.object({
  conversionId: Uuid, eventId: Uuid, cohortId: Uuid,
  preservedCount: z.int().nonnegative(), offeredCount: z.int().nonnegative(), releasedCount: z.int().nonnegative(),
  state: z.enum(["planned", "processing", "complete", "partial", "cancelled"]), version: Version, requestId: RequestId,
}).strict();
~~~

## Per-Operation Auditability Closure

Every failure is BE00 `ApiError { code, message, requestId, details }`; details exclude identity, accessibility, payment, price, reason, scanner credential, or policy body. Unknown faults are `500 INTERNAL_ERROR`; rate denial is `429 RATE_LIMITED` with `Retry-After`.

| Operation | Exact request → success contract | Exact errors and deterministic recovery | Required observability | Required operation tests |
|---|---|---|---|---|
| BE35D-15 | `PackageRequest` → 201 `AccessPackageV1 { packageId,eventId,name,benefits,capacity,salesWindow,state,version,requestId }` | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 VERSION_CONFLICT, CAPACITY_CONFLICT, or IDEMPOTENCY_CONFLICT; 410 WINDOW_CLOSED; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE. Invalid package commits nothing. | `access_package_total`, capacity/window conflicts, version/denial outcome | benefit/window/capacity properties and response; product admin; CORS/ApiError; concurrent versions |
| BE35D-16 | `PurchaseRequest` → 202 `AccessPackagePurchaseV1 { purchaseId,packageId,orderId,state,recipientCount,version,requestId }` | common set plus 409 CAPACITY_CONFLICT or VERSION_CONFLICT; 410 WINDOW_CLOSED; 422 ORDER_NOT_CONFIRMED; 503 DEPENDENCY_UNAVAILABLE. Capacity/benefits activate only after confirmed order; failure releases reservation. | `access_purchase_total`, order pending/failure, capacity release, source circuit | recipient/quantity/body; purchaser/controller; CORS/BE00 ApiError envelope; payment/order failure and capacity rollback |
| BE35D-17 | `RedemptionRequest` → 201/200 `BenefitRedemptionV1 { redemptionId,entitlementId,benefitId,remainingUses,state,scannerSequence,requestId }` | common set plus 409 ALREADY_REDEEMED, CAPACITY_CONFLICT, or VERSION_CONFLICT; 410 WINDOW_CLOSED; 503 DEPENDENCY_UNAVAILABLE. Exact duplicate sequence replays; conflicting use is denied. | `benefit_redemption_total`, conflict/offline lag, checkpoint latency | uses/window/sequence; holder/scanner/checkpoint; CORS/ApiError; simultaneous/offline duplicate and ordered sync |
| BE35D-18 | `RSVPRequest` → 201 `RSVPAdmissionV1 { rsvpId,eventId,identityId,state,admissionRef,policyVersion,version,requestId }` | common set plus 409 CAPACITY_CONFLICT or IDEMPOTENCY_CONFLICT; 410 WINDOW_CLOSED; 503 DEPENDENCY_UNAVAILABLE. No over-capacity admission; duplicate eligible identity replays. | `rsvp_admission_total`, capacity utilization, duplicate/eligibility outcome | identity/policy/capacity; eligible actor; CORS/BE00 ApiError envelope; concurrent last admission |
| BE35D-19 | `ConversionRequest` → 202 `PaidConversionV1 { conversionId,eventId,cohortId,preservedCount,offeredCount,releasedCount,state,version,requestId }` | common set plus 409 VERSION_CONFLICT or IDEMPOTENCY_CONFLICT; 422 CONVERSION_POLICY_INVALID; 503 DEPENDENCY_UNAVAILABLE. Protected admissions persist; partial cohort resumes idempotently and never charges silently. | `paid_conversion_total`, cohort counts, partial age, order/source circuit | cohort/policy schema; ticket admin+step-up; CORS/ApiError; concurrent freeze, partial crash/recovery, no-silent-charge |

## Ambiguity Gate

- Interactions 35.15–35.19, both canonical models, and both canonical events are fully specified.
- Capacity, fulfillment, redemption, RSVP, free-to-paid consent/preservation, concurrency, RLS/grants, recovery, errors, SLOs, and tests are deterministic.
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
- Shards 01/06/35a/35b/35e/36 identity, restrictions, inventory, orders, delivery, and scanning contracts.
