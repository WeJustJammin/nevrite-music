# BE Spec 34d — Tour Border Readiness, Carnets, Merch, and Carbon

> Source: [IA Shard 34](../ia/34-touring-operations.md), interactions 34.13–34.17. This companion owns evidence-backed readiness, reconciliation, movement, and estimate projections. It does not issue visas, work permits, tax advice, customs clearance, gear identity, inventory truth, settlement, or verified environmental claims.

## Classification and Source Inventory

| IA | Operation | Canonical model | Canonical event |
|---|---|---|---|
| 34.13 | Track visa/work permit | `BorderReadiness` | `tour.border.readiness_changed` |
| 34.14 | Generate/reconcile carnet | `CarnetReconciliation` | `tour.carnet.reconciled` |
| 34.15 | Track withholding readiness | `BorderReadiness` | `tour.border.readiness_changed` |
| 34.16 | Count tour merch | `TourMerchMovement` | `tour.merch.movement_recorded` |
| 34.17 | Generate carbon estimate | `CarbonEstimate` | `tour.carbon.estimated` |

Sources are tour/date/person authority, venue/border/jurisdiction references, gear/custody manifests, merch inventory and settlement receipts, finance/tax evidence, distance/travel inputs, and versioned carbon factors. Sensitive identity/document contents remain in their vault/source; this shard stores opaque refs, validity/state, deadlines, discrepancies, coverage, and exclusions.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 34](../ia/34-touring-operations.md) | Interactions lines 71–92; Contracts lines 93–112; Data Models lines 113–154; Access Control lines 155–180; Event Schemas and Edge Cases lines 190–220 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 18.14 Border, Visas & Carnets | BE34D-13–BE34D-15 / 34.13–34.15 |
| 18.15 Tour Merch Inventory & Per-Show Counts | BE34D-16 / 34.16 |
| 18.20 Green Touring & Carbon Reporting | BE34D-17 / 34.17 |

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method | Path | Authorization | Idempotency/concurrency | Rate/cache/SLO | CORS policy |
|---|---|---|---|---|---|---|
| BE34D-13 | POST | `/api/v1/tours/{tourId}/border-readiness` | tour immigration coordinator; person-purpose scope | key + person/border/date/source digest | 60/hour/tour; no-store; p95 700 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE34D-14 | POST | `/api/v1/tours/{tourId}/carnet-reconciliations` | carnet custodian with gear-manifest grant | key + crossing/manifest expected versions | 30/hour/crossing; no-store; p95 900 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE34D-15 | POST | `/api/v1/tours/{tourId}/withholding-readiness` | tour tax coordinator/finance mandate | key + jurisdiction/evidence digest | 30/hour/tour; no-store; p95 700 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE34D-16 | POST | `/api/v1/tours/{tourId}/merch-movements` | merch custodian or trusted settlement source | key + show/SKU/source sequence | 120/min/source; no-store; p95 500 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE34D-17 | POST | `/api/v1/tours/{tourId}/carbon-estimates` | tour analyst with authorized input scope | key + complete input/factor digest | 20/hour/tour; private version cache; p95 1.2 s | `BE00-CORS-WEB-CREDENTIALLED` |

TLS, ULID identifiers, authenticated tenant context or signed service principal, request ID, strict JSON, and a 128 KiB maximum are mandatory. Exact border/finance/operations-console origins receive credentialed CORS; connectors are non-browser. Preflight allows route method plus `OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`; wildcard credentialed CORS is forbidden. Sensitive responses use `Cache-Control: private, no-store`; carbon results may cache only by tenant/authorization/input digest for 60 seconds.

### Per-Operation Validation Middleware Matrix

This is the validation column of the authoritative route registry: join on the stable operation ID above. Each row runs after BE00 request ID/CORS and authentication admission, before authorization/handler execution; the same registry row supplies the numeric rate and literal CORS policy.

| Operation ID | Validation middleware |
|---|---|
| BE34D-13 | strict path `tourId`, headers, and `BorderReadinessRequest(kind=visa|work_permit)` body; reject unknown keys and validate the success body before serialization |
| BE34D-14 | strict path `tourId`, headers, and `CarnetRequest` body; reject unknown keys and validate the success body before serialization |
| BE34D-15 | strict path `tourId`, headers, and `BorderReadinessRequest(kind=withholding)` body; reject unknown keys and validate the success body before serialization |
| BE34D-16 | strict path `tourId`, headers, and `MerchMovementRequest` body; reject unknown keys and validate the success body before serialization |
| BE34D-17 | strict path `tourId`, headers, and `CarbonEstimateRequest` body; reject unknown keys and validate the success body before serialization |

## Zod 4 Contracts

```ts
const Id=z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const At=z.string().datetime({offset:true});
const Ver=z.number().int().positive();
const Ref=z.object({id:Id,version:Ver}).strict();
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
const JsonPrimitive=z.union([z.string(),z.number().finite(),z.boolean(),z.null()]);
const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(()=>z.union([JsonPrimitive,z.array(JsonValueSchema),z.record(z.string(),JsonValueSchema)]));
const ApiError=z.object({
  code:z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),message:z.string().min(1).max(500),
  requestId:z.string().uuid(),details:z.record(z.string(),JsonValueSchema).refine(v=>Object.keys(v).length<=16)
}).strict();

const BorderReadinessRequest=z.object({
  kind:z.enum(['visa','work_permit','withholding']),
  personId:Id,borderOrJurisdictionRef:Id,dateMemberId:Id,
  requirementCode:z.string().trim().min(1).max(100),requirementSource:Ref,
  leadTimeDays:z.number().int().min(0).max(730),deadlineAt:At,
  documentRef:Id.optional(),validFrom:At.optional(),validUntil:At.optional(),
  state:z.enum(['unknown','not_required','required','in_progress','ready','expired','blocked']),
  evidenceRefs:z.array(Id).max(30)
}).strict().superRefine((v,c)=>{
  if(v.state==='ready'&&!v.documentRef)c.addIssue({code:'custom',path:['documentRef'],message:'ready requires evidence document'});
  if(Boolean(v.validFrom)!==Boolean(v.validUntil))c.addIssue({code:'custom',path:['validUntil'],message:'validity bounds are paired'});
  if(v.validFrom&&v.validUntil&&Date.parse(v.validFrom)>=Date.parse(v.validUntil))c.addIssue({code:'custom',path:['validUntil'],message:'must follow validFrom'});
});

const CarnetRow=z.object({
  manifestItemRef:Id,identifierHash:z.string().regex(/^[a-f0-9]{64}$/),
  exportState:z.enum(['expected','present','missing','extra']),
  reentryState:z.enum(['pending','confirmed','discrepant']),evidenceRefs:z.array(Id).max(10)
}).strict();
const CarnetRequest=z.object({
  crossingRef:Id,manifest:Ref,documentOwnerId:Id,documentRef:Id,
  action:z.enum(['generate','record_export','record_reentry','reconcile']),
  rows:z.array(CarnetRow).min(1).max(5000),expectedVersion:Ver
}).strict().refine(v=>new Set(v.rows.map(x=>x.manifestItemRef)).size===v.rows.length,{path:['rows'],message:'duplicate manifest item'});

const MerchMovementRequest=z.object({
  showDateId:Id,skuRef:Id,sourceSequence:z.bigint().nonnegative(),
  movement:z.enum(['load_in','sale','comp','damage','return','count']),
  quantity:z.number().int().min(0).max(1_000_000),
  channel:z.enum(['venue_pos','tour_pos','manual_count','settlement_import']),
  sourceRef:Id,sourceVersion:Ver,observedAt:At
}).strict();

const CarbonEstimateRequest=z.object({
  expectedTourVersion:Ver,factorSet:Ref,
  inputs:z.array(z.object({
    dateMemberId:Id.optional(),legRef:Id.optional(),
    mode:z.enum(['road','rail','air','sea','venue_energy','freight','other']),
    activity:z.string().regex(/^\d+(?:\.\d{1,6})?$/),
    unit:z.string().trim().min(1).max(30),source:Ref,
    confidence:z.number().min(0).max(1)
  }).strict()).min(1).max(5000),
  exclusionRefs:z.array(Id).max(200),
  reportingPurpose:z.enum(['internal','counterparty','public_draft'])
}).strict();
```

Unknown keys, duplicate carnet rows or merch source sequences, invalid dates/validity, unsupported factor units, non-decimal activity, unsafe document contents, raw passport/tax IDs, and inaccessible person/gear/finance sources fail before persistence. `ready` means evidence meets the configured source requirement; it is not legal/tax/customs approval. Carbon output is always labelled `estimate_unverified` unless a separate external verification reference is supplied; the platform never acts as verifier.

## Database Schema, RLS, and Grants

```sql
create table border_readiness (
  id text not null, version bigint not null check(version>0), tenant_id text not null,
  tour_id text not null, kind text not null check(kind in ('visa','work_permit','withholding')),
  person_id text not null, border_or_jurisdiction_ref text not null, date_member_id text not null,
  requirement_code text not null, requirement_source_id text not null,
  requirement_source_version bigint not null, lead_time_days integer not null
    check(lead_time_days between 0 and 730), deadline_at timestamptz not null,
  document_ref text, valid_from timestamptz, valid_until timestamptz,
  state text not null check(state in ('unknown','not_required','required','in_progress','ready','expired','blocked')),
  evidence_refs jsonb not null, created_by text not null, created_at timestamptz not null,
  primary key(id,version), check((valid_from is null)=(valid_until is null)),
  check(valid_from is null or valid_from<valid_until)
);
create table carnet_reconciliations (
  id text not null, version bigint not null check(version>0), tour_id text not null,
  crossing_ref text not null, manifest_id text not null, manifest_version bigint not null,
  document_owner_id text not null, document_ref text not null, action text not null,
  rows_json jsonb not null, state text not null
    check(state in ('draft','export_recorded','reentry_pending','reconciled','discrepant')),
  discrepancy_refs jsonb not null, created_by text not null, created_at timestamptz not null,
  primary key(id,version), unique(crossing_ref,manifest_id,manifest_version,version)
);
create table tour_merch_movements (
  id text primary key, tenant_id text not null, tour_id text not null,
  show_date_id text not null, sku_ref text not null,
  source_sequence bigint not null check(source_sequence>=0),
  movement text not null check(movement in ('load_in','sale','comp','damage','return','count')),
  quantity integer not null check(quantity between 0 and 1000000),
  channel text not null, source_ref text not null, source_version bigint not null,
  state text not null check(state in ('recorded','reversed')), version bigint not null check(version>0),
  observed_at timestamptz not null, created_at timestamptz not null,
  unique(tenant_id,source_ref,source_sequence)
);
create table carbon_estimates (
  id text not null unique, tour_id text not null, version bigint not null check(version>0),
  tour_version bigint not null, factor_set_id text not null, factor_set_version bigint not null,
  input_digest text not null, output_json jsonb not null,
  coverage_bps integer not null check(coverage_bps between 0 and 10000),
  exclusion_refs jsonb not null,
  confidence_bps integer not null check(confidence_bps between 0 and 10000),
  label text not null check(label in ('estimate_unverified','externally_verified')),
  verifier_ref text, created_by text not null, created_at timestamptz not null,
  primary key(tour_id,version), unique(tour_id,input_digest),
  check((label='externally_verified')=(verifier_ref is not null))
);
```

Every relationship in these four tables terminates at an external source owner: tour/date membership (34a), person/mandate authority (01/11), gear manifest and custody (23/33), merch inventory and settlement, or the versioned factor registry. Those identifier/version pairs are opaque source-owner seams, not local foreign keys. Each write validates the exact pair at its named seam before persistence, stores the returned version or digest, and fails closed when the owner is unavailable or stale; no undeclared local parent-child relationship exists among these tables.

Indexes cover readiness person/date/state/deadline, expiring validity, carnet crossing/state/discrepancy, merch show/SKU/sequence/time, and carbon current factor/coverage. All tables enable and force RLS. No `anon` or public base-table grant exists; authenticated callers execute narrowly scoped security-definer RPCs. Person readiness requires immigration/tax purpose and field-level projection; document refs require step-up and audit. Carnet access requires manifest/custodian grant; hidden gear identities stay hashed. Merch access follows tour/inventory/settlement scope. Carbon reads require every underlying input or receive a pre-minimized projection. Direct client update/delete is denied; workers hold leased row scopes only.

## Transactions, Lifecycle, and Recovery

- BE34D-13 and BE34D-15 lock `(tour,person,border/date,kind)`, re-evaluate the pinned requirement source and document validity, append `BorderReadiness`, schedule deadline alerts, and commit audit/outbox. Source withdrawal/expiry appends `expired|blocked|unknown`; prior evidence remains immutable.
- BE34D-14 pins the gear manifest and crossing, validates unique identifier hashes and custodian authority, appends a complete `CarnetReconciliation` version, discrepancy rows, audit/outbox, and artifact job. Missing/extra rows remain discrepancies; no gear record is rewritten.
- BE34D-16 verifies monotonic source sequence and source signature, inserts one `TourMerchMovement`, derives a non-authoritative running projection, and emits the event. Corrections append reversing movements; inventory and settlement owners decide their own state.
- BE34D-17 freezes tour/leg/activity/factor sources, computes decimal outputs outside the transaction, rechecks versions, and inserts `CarbonEstimate` with coverage, confidence, exclusions, label, audit, and outbox. Factor/input changes create a new version; public-draft output is rejected below its policy coverage threshold.

Idempotency binds tenant, actor/source, route, aggregate, and canonical body hash for 72 hours. Same key/different body returns `409 IDEMPOTENCY_CONFLICT`; committed replay returns the original response. Every authoritative write uses database time and commits audit/outbox atomically.

## Events and External Seams

| Event | Trigger and required payload |
|---|---|
| `tour.border.readiness_changed` | committed visa/work-permit/withholding version: `{tourId,readinessId,version,personId,borderOrJurisdictionRef,dateMemberId,kind,state,deadlineAt,requirementSourceRef,occurredAt}` |
| `tour.carnet.reconciled` | committed carnet version: `{tourId,reconciliationId,version,crossingRef,manifestRef,state,discrepancyRefs,occurredAt}` |
| `tour.merch.movement_recorded` | committed movement: `{tourId,movementId,showDateId,skuRef,movement,quantity,sourceSequence,occurredAt}` |
| `tour.carbon.estimated` | committed estimate: `{tourId,version,factorSetRef,coverageBps,confidenceBps,exclusionRefs,label,occurredAt}` |

Envelope: `{eventId,eventType,schemaVersion:1,aggregateId,aggregateVersion,tenantId,occurredAt,traceId,payload}`. Transactional outbox, per-aggregate ordering, at-least-once, event-ID dedupe, 24-hour retry/dead letter. No document contents, passport/tax identifiers, gear owner facts, sales proceeds, private itinerary, or raw carbon inputs leave in events.

Requirement/tax/customs sources use 3 s total, two retries at 200/800 ms jitter for timeout/429/5xx, circuit 5 failures/min for 2 min; unavailable source produces `unknown`, never `ready`. Gear/inventory/settlement sources use 2 s and fail closed on version/authority uncertainty. Factor service uses 3 s, two retries, and a 2-minute circuit; absent/stale factor blocks estimation. Artifact/notification workers retry 1/5/30 s, lease 60 s, and dead-letter permanent failure with operator replay.

### Exact integration contracts

| Seam | Exact request → response | Timeout, retry/backoff, circuit, and recovery |
|---|---|---|
| Requirement/tax/customs source | `{kind,jurisdictionCodes,personOrTourRef,dateRange,sourceRevisionDigest}` → `{requirements:[{code,validFrom,validTo,evidenceClass}],sourceVersions,verifiedAt}` | 3 s total; two attempts at 200/800 ms full-jitter backoff for timeout/429/5xx; opens after 5 failures/min for 2 min; outage yields `state=unknown`, never ready/advice |
| Gear/inventory/settlement authority | `{tourId,dateMemberIds,manifestOrSettlementRefs,expectedVersions}` → `{authorized,items:[{sourceRef,state,version}],sourceDigest}` | 2 s total; two attempts at 100/500 ms backoff; opens after 5 failures/30 s for 60 s; version/authority uncertainty fails closed before reconciliation or movement commit |
| Carbon factor service | `{activities:[{kind,quantity,unit,region,date}],requiredFactorVersion}` → `{factors:[{kind,factorKgCo2e,unit,source}],factorVersion,validThrough}` | 3 s total; two attempts at 200/800 ms backoff; opens after 5 failures/min for 2 min; absent/stale factor returns `422 COVERAGE_INSUFFICIENT` and no estimate commits |
| Artifact/notification worker | `{aggregateId,version,recipientPolicyId,artifactKind,dedupeKey}` → `{jobReceiptId,state,artifactRef?}` | three attempts at 1/5/30 s backoff after a committed outbox row; opens after 5 failures/min for 2 min; 60 s lease, permanent failure dead-letters, step-up replay is reasoned |

## Middleware, Errors, Observability, and Verification

Order: request ID -> TLS/CORS/body/content -> auth/service signature -> tenant/context -> rate -> strict Zod -> purpose/RLS/source versions -> step-up -> idempotency/If-Match -> RPC transaction -> response validation -> redacted audit. Errors strictly match `ApiError { code, message, requestId, details }`; details contain safe codes/versions only.

| Status/code | Condition/recovery |
|---|---|
| 400 `VALIDATION_FAILED` | correct schema, validity, row, unit, or sequence |
| 401 `UNAUTHENTICATED` | reauthenticate/repair signature |
| 403 `FORBIDDEN` | known source but purpose/capability absent |
| 404 `NOT_FOUND` | absent/concealed person, manifest, SKU, or source |
| 409 `VERSION_CONFLICT` | refetch pinned aggregate/source |
| 409 `SOURCE_SEQUENCE_CONFLICT` | reconcile duplicate/out-of-order movement |
| 409 `IDEMPOTENCY_CONFLICT` | new key after body correction |
| 422 `EVIDENCE_INSUFFICIENT` | readiness cannot be marked ready |
| 422 `MANIFEST_DISCREPANCY` | persist discrepancy and route custodian review |
| 422 `COVERAGE_INSUFFICIENT` | add inputs or use internal draft |
| 429 `RATE_LIMITED` | honor `Retry-After` |
| 503 `DEPENDENCY_UNAVAILABLE` | retain unknown/pending; retry same key |

Logs include request/trace/operation IDs, opaque aggregate/person/source IDs, versions, state/code, counts, coverage/confidence bands, dependency attempt, latency, and outbox age. They exclude document refs/contents, identity/tax numbers, gear identifiers/owners, SKU descriptions, money, exact routes, and raw activity. Metrics cover readiness deadline/state/expiry, discrepancy age, merch sequence gaps, carbon coverage/factor age, latency/errors/circuits/outbox/dead letters. Availability target 99.9%; p99 writes <1.5 s; 99% alerts/events <30 s; page on active deadline-alert lag >5 min, discrepancy unowned >1 h, sequence gap >10 min, factor age above policy, or five-minute 5xx >2%.

Tests cover strict schemas and cross-fields, every route x role/purpose/tenant/revocation, evidence expiry and source withdrawal, unknown-not-ready invariant, concurrent readiness/carnet versions, manifest missing/extra/reentry, monotonic movement/reversal/dedupe, decimal carbon/factor/unit/coverage/exclusion properties, RLS/grants, idempotency races, transactional audit/outbox, dependency retries/circuits/recovery, event privacy/order/duplicates/evolution, log redaction, indexes/migrations, CORS, and SLO alerts.

## Exact Typed Success Schemas

The operation comments are the authoritative route mappings for these strict Zod 4 response objects. Readiness is factual status, never legal or tax advice.

~~~ts
import { z } from "zod";
const Uuid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const Version = z.int().positive();
const Instant = z.iso.datetime({ offset: true });
const RequestId = z.string().min(16).max(128);
// BE34D-13 / 34.13
// BE34D-15 / 34.15 uses this same factual-readiness schema with kind=withholding.
export const BorderReadinessV1 = z.object({
  readinessId: Uuid, kind: z.enum(["visa", "work_permit", "withholding"]), personId: Uuid, dateMemberId: Uuid,
  state: z.enum(["unknown", "not_required", "required", "in_progress", "ready", "expired", "blocked"]), deadlineAt: Instant,
  validity: z.object({ startsAt: Instant.nullable(), endsAt: Instant.nullable() }).strict(),
  coverage: z.object({ jurisdictionCodes: z.array(z.string().min(2).max(32)).max(100), complete: z.boolean() }).strict(),
  evidenceCount: z.int().nonnegative().max(10_000), version: Version, requestId: RequestId,
}).strict();
// BE34D-14 / 34.14
export const CarnetReconciliationV1 = z.object({
  reconciliationId: Uuid, crossingRef: Uuid, manifestVersion: Version,
  rowCounts: z.object({ expected: z.int().nonnegative(), observed: z.int().nonnegative(), matched: z.int().nonnegative() }).strict(),
  discrepancies: z.array(z.object({ rowRef: Uuid, code: z.string().regex(/^[a-z0-9_]{1,64}$/), expectedQuantity: z.int().nonnegative(), observedQuantity: z.int().nonnegative() }).strict()).max(100_000),
  state: z.enum(["draft", "export_recorded", "reentry_pending", "reconciled", "discrepant"]), version: Version, requestId: RequestId,
}).strict();
// BE34D-16 / 34.16
export const TourMerchMovementV1 = z.object({
  movementId: Uuid, tourId: Uuid, showDateId: Uuid, skuRef: Uuid, quantityDelta: z.int(), sourceSequence: z.bigint().nonnegative(),
  state: z.enum(["recorded", "reversed"]), version: Version, requestId: RequestId,
}).strict();
// BE34D-17 / 34.17
export const CarbonEstimateV1 = z.object({
  estimateId: Uuid, tourId: Uuid, totalKgCo2e: z.number().nonnegative(),
  coverage: z.number().min(0).max(1), exclusions: z.array(z.object({ inputRef: Uuid, reasonCode: z.string().regex(/^[a-z0-9_]{1,64}$/) }).strict()).max(10_000),
  factorVersion: Version, confidence: z.number().min(0).max(1), label: z.enum(["estimate_unverified", "externally_verified"]),
  version: Version, requestId: RequestId,
}).strict();
~~~

## Per-Operation Auditability Closure

Every failure is BE00 `ApiError { code, message, requestId, details }`; details contain only safe opaque refs/status and exclude identity/document, serial, tax, SKU-cost, or provider bodies. Unknown faults are `500 INTERNAL_ERROR`; rate denial is `429 RATE_LIMITED` with `Retry-After`.

| Operation | Exact request → success contract | Exact errors and deterministic recovery | Required observability | Required operation tests |
|---|---|---|---|---|
| BE34D-13 | `BorderReadinessRequest(kind='visa' or 'work_permit')` → 201 `BorderReadinessV1 { readinessId,kind,personId,dateMemberId,state,deadlineAt,validity,coverage,evidenceCount,version,requestId }` | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 VERSION_CONFLICT or IDEMPOTENCY_CONFLICT; 422 EVIDENCE_INSUFFICIENT; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE. Insufficient evidence stays non-ready; no advice claim. | `border_readiness_total`, deadline/validity bands, evidence failure, source circuit | validity/cross-field/success; person-purpose/404; CORS/ApiError; source outage and evidence recovery |
| BE34D-14 | `CarnetRequest` → 201 `CarnetReconciliationV1 { reconciliationId,crossingRef,manifestVersion,rowCounts,discrepancies,state,version,requestId }` | common set plus 409 VERSION_CONFLICT or IDEMPOTENCY_CONFLICT; 422 MANIFEST_DISCREPANCY; 503 DEPENDENCY_UNAVAILABLE. Discrepancy persists and routes review; gear truth is not rewritten. | `carnet_reconciliation_total`, discrepancy count, manifest freshness, router attempts | row/quantity properties and strict response; custodian/gear grant; CORS/BE00 ApiError envelope; concurrent manifest and review routing |
| BE34D-15 | `BorderReadinessRequest(kind='withholding')` → 201 `BorderReadinessV1` with factual readiness fields only | common set plus 422 EVIDENCE_INSUFFICIENT; 503 DEPENDENCY_UNAVAILABLE. State remains unknown/blocked; response never supplies tax advice. | `withholding_readiness_total`, jurisdiction/source age, blocked/unknown state | jurisdiction/evidence shape; tax mandate; CORS/ApiError; provider failure and no-advice invariant |
| BE34D-16 | `MerchMovementRequest` → 201/200 `TourMerchMovementV1 { movementId,tourId,showDateId,skuRef,quantityDelta,sourceSequence,state,version,requestId }` | common set plus 409 SOURCE_SEQUENCE_CONFLICT, VERSION_CONFLICT, or IDEMPOTENCY_CONFLICT; 503 DEPENDENCY_UNAVAILABLE. Duplicate sequence replays; out-of-order conflicts without inventory rewrite. | `tour_merch_movement_total`, dedupe/sequence conflict, source lag, outbox age | signed quantity/sequence properties; custodian/source auth; CORS/BE00 ApiError envelope; duplicate/out-of-order concurrent ingestion |
| BE34D-17 | `CarbonEstimateRequest` → 201 `CarbonEstimateV1 { estimateId,tourId,totalKgCo2e,coverage,exclusions,factorVersion,confidence,label,version,requestId }` | common set plus 409 VERSION_CONFLICT; 422 COVERAGE_INSUFFICIENT; 503 DEPENDENCY_UNAVAILABLE. `externally_verified` is withheld without verifier evidence; `estimate_unverified` retains explicit exclusions. | `carbon_estimate_total`, coverage/confidence/factor age, dependency circuit | units/factor/coverage properties and response; analyst/input scope; CORS/ApiError; stale factor, circuit recovery, no verified overclaim |

## Ambiguity Gate

- Interactions 34.13–34.17, `BorderReadiness`, `CarnetReconciliation`, `TourMerchMovement`, `CarbonEstimate`, and all four canonical events are explicitly covered.
- Evidence versus legal/tax/customs truth, identity minimization, source ownership, concurrency, discrepancy/reversal behavior, unverified estimates, RLS/grants, recovery, errors, SLOs, and tests are deterministic.
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

- [IA Shard 34](../ia/34-touring-operations.md)
- Shards 01/11/23/24/31/34a–34c identity, tax/finance, gear/custody, settlement, tour, budget, travel, and source contracts.
