# BE Spec 34c — Tour Budgets, Actuals, and Expenses

> Source: [IA Shard 34](../ia/34-touring-operations.md), interactions 34.10–34.12. This companion owns versioned tour budget projections, append-only actual facts, and governed expense evidence. Settlement, treasury, payroll, card, tax, and accounting systems remain canonical at their owning boundaries.

## Classification and Endpoint Completeness

| IA ID | Canonical model | Operation invariant |
|---|---|---|
| 34.10 | `TourBudgetVersion` | Planned values by date/category/currency, FX inputs, visibility, and source versions form an immutable version |
| 34.11 | `TourActual` | One source fact accrues once with date/category/amount/currency/period and variance lineage |
| 34.12 | `TourExpense` | Authorized payer appends spend, receipt-or-explanation, category, currency, sync period, and evidence state |

Canonical event: `tour.budget.actual_changed`. Consumed sources are 34a/34b tour, allocation, travel and per-diem versions; 11 treasury/payment mandates; 30/31 booking/settlement facts; approved FX and accounting connectors. No route moves money, posts a general-ledger entry, modifies a settlement, or treats a forecast as an actual.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 34](../ia/34-touring-operations.md) | Interactions lines 71–92; Contracts lines 93–112; Data Models lines 113–154; Access Control lines 155–180; Event Schemas and Edge Cases lines 190–220 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 18.13 Tour Finance | BE34C-10–BE34C-12 / 34.10–34.12 |

## API Endpoints

### Authoritative Route Registry

| Operation ID | IA | Method | Path | Authorization | Concurrency/idempotency | Rate/cache/SLO | CORS policy |
|---|---|---|---|---|---|---|---|
| BE34C-10 | 34.10 | POST | `/api/v1/tours/{tourId}/budget-versions` | tour finance editor with category visibility | key + `If-Match`; source/FX digest | 20/hour/tour; no-store; p95 700 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE34C-11 | 34.11 | POST | `/api/v1/tours/{tourId}/actuals` | trusted source principal or finance reconciler | key binds source fact identity/version | 120/min/source; no-store; p95 500 ms | `BE00-CORS-WEB-CREDENTIALLED` |
| BE34C-12 | 34.12 | POST | `/api/v1/tours/{tourId}/expenses` | current tour payer/finance delegate | key + payer mandate; append-only | 60/hour/payer; no-store; p95 700 ms | `BE00-CORS-WEB-CREDENTIALLED` |

TLS, ULID identifiers, authenticated tenant/acting context, `application/json`, 96 KiB limit, and request ID are mandatory. Exact finance-console origins receive credentialed CORS; source connectors use non-browser service identity. Preflight allows `POST, OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`; wildcard origin/credentials are denied. Responses use `Cache-Control: private, no-store`.

### Per-Operation Validation Middleware Matrix

This is the validation column of the authoritative route registry: join on the stable operation ID above. Each row runs after BE00 request ID/CORS and authentication admission, before authorization/handler execution; the same registry row supplies the numeric rate and literal CORS policy.

| Operation ID | Validation middleware |
|---|---|
| BE34C-10 | strict path `tourId`, headers, and `BudgetVersionRequest` body; reject unknown keys and validate the success body before serialization |
| BE34C-11 | strict path `tourId`, headers, and `ActualRequest` body; reject unknown keys and validate the success body before serialization |
| BE34C-12 | strict path `tourId`, headers, and `ExpenseRequest` body; reject unknown keys and validate the success body before serialization |

## Zod 4 Contracts

```ts
const Id=z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const Ver=z.number().int().positive();
const At=z.string().datetime({offset:true});
const Currency=z.string().regex(/^[A-Z]{3}$/);
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
const JsonPrimitive=z.union([z.string(),z.number().finite(),z.boolean(),z.null()]);
const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(()=>z.union([JsonPrimitive,z.array(JsonValueSchema),z.record(z.string(),JsonValueSchema)]));
const ApiError=z.object({code:z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),message:z.string().min(1).max(500),requestId:z.string().uuid(),details:z.record(z.string(),JsonValueSchema).refine(v=>Object.keys(v).length<=16)}).strict();
const Money=z.object({amountMinor:z.bigint(),currency:Currency}).strict();

const BudgetLine=z.object({
  lineId:Id,dateMemberId:Id.optional(),category:z.string().trim().min(1).max(80),
  planned:Money,visibility:z.enum(['tour_finance','date_parties','owner_only']),
  sourceRefs:z.array(z.object({id:Id,version:Ver}).strict()).max(30)
}).strict();
const BudgetVersionRequest=z.object({
  expectedVersion:Ver,baseCurrency:Currency,
  fx:z.array(z.object({from:Currency,to:Currency,rate:z.string().regex(/^\d+(?:\.\d{1,12})?$/),asOf:At,sourceId:Id}).strict()).max(100),
  lines:z.array(BudgetLine).min(1).max(2000)
}).strict().superRefine((v,c)=>{
  if(new Set(v.lines.map(x=>x.lineId)).size!==v.lines.length)c.addIssue({code:'custom',path:['lines'],message:'lineId must be unique'});
  for(const x of v.lines)if(x.planned.currency!==v.baseCurrency&&!v.fx.some(r=>r.from===x.planned.currency&&r.to===v.baseCurrency))
    c.addIssue({code:'custom',path:['fx'],message:'missing conversion'});
});

const ActualRequest=z.object({
  sourceSystem:z.enum(['settlement','travel','per_diem','payroll','card','cash','manual_reconciliation']),
  sourceFactId:Id,sourceVersion:Ver,dateMemberId:Id.optional(),
  category:z.string().trim().min(1).max(80),amount:Money,
  occurredAt:At,accountingPeriod:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  budgetLineId:Id.optional(),evidenceRefs:z.array(Id).max(30)
}).strict();

const ExpenseRequest=z.object({
  spentAt:At,payerId:Id,payerMandateId:Id,merchantRef:Id.optional(),
  category:z.string().trim().min(1).max(80),amount:Money,
  receiptRef:Id.optional(),explanation:z.string().trim().min(1).max(2000).optional(),
  syncPeriod:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  sourceRef:Id,sourceVersion:Ver
}).strict().refine(v=>Boolean(v.receiptRef)!==Boolean(v.explanation),{
  path:['receiptRef'],message:'exactly one receipt or explanation required'
});
```

Unknown keys, duplicate lines/source facts, invalid currency/decimal/period, floating-point money, stale source/FX values, inaccessible category/date, missing evidence, raw bank/card data, and unsafe receipt/explanation content fail before persistence. FX uses arbitrary-precision decimal with explicit round-half-even to minor units; both unrounded input and rounded result are retained. Negative actuals require an explicit reversal source kind and reference to the original fact.

## Database and Policy

```sql
create table tour_budget_versions (
  id text not null unique, tour_id text not null, version bigint not null check(version>0),
  base_currency char(3) not null, source_digest text not null, fx_snapshot jsonb not null,
  created_by text not null, created_at timestamptz not null,
  primary key(tour_id,version), unique(tour_id,source_digest)
);
create table tour_budget_lines (
  tour_id text not null, budget_version bigint not null, line_id text not null,
  date_member_id text, category text not null,
  planned_minor bigint not null, source_currency char(3) not null,
  base_minor bigint not null, visibility text not null
    check(visibility in ('tour_finance','date_parties','owner_only')),
  source_refs jsonb not null,
  primary key(tour_id,budget_version,line_id),
  foreign key(tour_id,budget_version) references tour_budget_versions(tour_id,version)
);
create table tour_actuals (
  id text primary key, tenant_id text not null, tour_id text not null,
  source_system text not null, source_fact_id text not null, source_version bigint not null check(source_version>0),
  date_member_id text, category text not null, amount_minor bigint not null, currency char(3) not null,
  occurred_at timestamptz not null, accounting_period char(7) not null,
  budget_line_id text, variance_base_minor bigint, evidence_refs jsonb not null,
  reverses_actual_id text references tour_actuals(id), version bigint not null check(version>0), created_at timestamptz not null,
  unique(tenant_id,source_system,source_fact_id,source_version)
);
create table tour_expenses (
  id text primary key, tenant_id text not null, tour_id text not null,
  date_member_id text,
  spent_at timestamptz not null, payer_id text not null, payer_mandate_id text not null,
  merchant_ref text, category text not null, amount_minor bigint not null, currency char(3) not null,
  receipt_ref text, explanation_ciphertext bytea, sync_period char(7) not null,
  source_ref text not null, source_version bigint not null check(source_version>0),
  evidence_state text not null check(evidence_state in ('receipt','explained','under_review','rejected')),
  sync_state text not null check(sync_state in ('pending','synced','failed_retryable','dead_lettered')),
  version bigint not null check(version>0),
  created_at timestamptz not null,
  check((receipt_ref is null)<>(explanation_ciphertext is null)),
  unique(tenant_id,source_ref,source_version)
);
```

Indexes cover budget current version/category/date, actual source/date/category/period, expense payer/period/category, review queue, and variance magnitude. All tables enable and force RLS. `anon` receives no grants; authenticated clients receive RPC execution only and no base-table `INSERT/UPDATE/DELETE`. Finance visibility is evaluated per tour/category/date mandate. Payers may read their own minimized expense state; receipt/explanation access requires explicit audit purpose and step-up. Source workers can insert only through signed source-specific RPCs and cannot read unrelated rows.

## Transactions and Lifecycle

- BE34C-10 locks the budget aggregate, verifies expected/source/FX versions and visibility, derives base amounts, inserts `TourBudgetVersion` plus lines, audit/outbox, and idempotency response atomically. Published history is immutable; correction is a new version.
- BE34C-11 verifies signed source identity, dedupe tuple, source fact/evidence, and period; inserts one `TourActual`, links the pinned budget line, derives variance with its FX snapshot, and commits audit/outbox. Source correction appends a reversal and replacement; it never updates the prior fact.
- BE34C-12 verifies payer and mandate at `spentAt`, scans/validates a receipt or encrypts a bounded explanation, inserts `TourExpense`, optionally queues accounting sync, and commits audit/outbox. Connector failure leaves `syncState=pending`; it does not erase the expense.

Idempotency records bind tenant, actor/source, route, aggregate, and canonical request hash for 72 hours. Same key/different body returns `409 IDEMPOTENCY_CONFLICT`; in-flight returns `409 REQUEST_IN_PROGRESS`; completed replay returns the stored response. Database time governs write order.

## Event and External Seams

| Event | Exact contract |
|---|---|
| `tour.budget.actual_changed` | On committed budget, actual, reversal, expense, or sync-state change: `{tourId,dateMemberId,category,changeType,sourceRef,amountMinor,currency,budgetVersion,varianceBaseMinor,occurredAt}`; opaque source/evidence refs only |

Envelope is `{eventId,eventType,schemaVersion:1,aggregateId,aggregateVersion,tenantId,occurredAt,traceId,payload}`. Transactional outbox, per-tour aggregate ordering, at-least-once delivery, event-ID dedupe, 24-hour retry, then dead letter. Amount exposure follows the consumer's finance contract; general consumers receive change/category/version without amount.

FX adapter: 500 ms connect/2 s total, two retries 200/800 ms jitter for timeout/429/5xx, circuit 5 failures/60 s for 60 s; unavailable/stale FX blocks a new cross-currency budget version. Accounting/receipt connectors: 3 s total, retries 1/5/30 s, circuit 5/min for 2 min; jobs use 60 s leases and idempotent destination keys. Permanent 4xx dead-letters with a safe reason; operator replay requires step-up and rationale.

### Exact integration contracts

| Seam | Exact request → response | Timeout, retry/backoff, circuit, and recovery |
|---|---|---|
| FX adapter | `{baseCurrency,quoteCurrencies,valuationDate,requiredRateVersion}` → `{rates:[{quoteCurrency,rate,asOf,sourceCode}],rateVersion,expiresAt,receipt}` | 500 ms connect/2 s total; two attempts at 200/800 ms full-jitter backoff for timeout/429/5xx; opens after 5 failures/60 s for 60 s; missing/stale rate returns `422 FX_UNAVAILABLE` and no budget version commits |
| Receipt verifier | `{uploadReceiptId,ownerPartyId,purposeCode}` → `{verified,checksum,mediaType,objectRef,verifiedAt}` | 3 s total; three attempts at 1/5/30 s backoff; opens after 5 failures/min for 2 min; unverified evidence returns `422 EVIDENCE_REQUIRED` before expense commit |
| Accounting connector | `{expenseId,tourId,amountMinor,currency,category,sourceFactId,destinationKey}` → `{connectorReceiptId,state,acceptedAt}` | 3 s total; three attempts at 1/5/30 s backoff; opens after 5 failures/min for 2 min; post-commit failure leaves `syncState=pending`, a leased retry job, and never duplicates the destination entry |

## Middleware, Error Contract, and Observability

Order: request ID -> TLS/CORS/body/content -> auth/service signature -> tenant/acting context -> rate -> strict Zod -> finance/source RLS -> step-up -> idempotency/If-Match -> RPC -> response schema -> redacted audit. Every failure is `ApiError { code, message, requestId, details }`.

| Status/code | Condition |
|---|---|
| 400 `VALIDATION_FAILED` | schema, currency, FX, period, or evidence failure |
| 401 `UNAUTHENTICATED` | invalid session/source signature |
| 403 `FORBIDDEN` | category/date/payer/source authority absent |
| 404 `NOT_FOUND` | absent or concealed tour/source |
| 409 `VERSION_CONFLICT` | stale budget/source version |
| 409 `SOURCE_FACT_EXISTS` | actual/expense dedupe tuple already committed |
| 409 `IDEMPOTENCY_CONFLICT` | key/body mismatch |
| 422 `FX_UNAVAILABLE` | required rate absent/stale |
| 422 `EVIDENCE_REQUIRED` | neither valid receipt nor explanation |
| 429 `RATE_LIMITED` | honor `Retry-After` |
| 503 `DEPENDENCY_UNAVAILABLE` | connector unavailable; pending work retained |

Logs include request/trace/operation IDs, opaque tour/source/payer IDs, category code, currency, version, outcome/code, latency, connector attempt, and outbox age; never amount, merchant, receipt, explanation, bank/card, mandate, or source payload. Metrics cover latency/errors, version/dedupe conflicts, FX age, variance bands, evidence review, sync lag/failure, outbox lag, and dead letters. Availability 99.9%; p99 write <1.5 s; 99% accounting jobs <5 min when healthy.

## Test Strategy

Tests cover schema boundaries, bigint/decimal/rounding properties, duplicate line/source fact, reversal lineage, receipt XOR explanation, stale mandate/source/FX, every role/tenant/category visibility combination, step-up, RLS/grants, concurrent budget versions, idempotency races, rollback of audit/outbox, adapter retries/circuit/recovery, event privacy/order/dedupe, log redaction, migration constraints/index plans, CORS, and SLO alerts.

All 34.10–34.12 interactions, `TourBudgetVersion`, `TourActual`, `TourExpense`, and `tour.budget.actual_changed` have deterministic ownership, validation, persistence, concurrency, access, event, failure, recovery, and verification contracts. Open Questions: None. Result: **PASS**.

## Exact Typed Success Schemas

Operation comments bind every route to one strict Zod 4 success parser.

~~~ts
import { z } from "zod";
const Uuid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const Version = z.int().positive();
const RequestId = z.string().min(16).max(128);
const Currency = z.string().regex(/^[A-Z]{3}$/);
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const Category = z.string().regex(/^[a-z0-9_]{1,64}$/);
// BE34C-10 / 34.10
export const TourBudgetVersionV1 = z.object({
  budgetVersionId: Uuid, tourId: Uuid, baseCurrency: Currency, lineCount: z.int().nonnegative().max(100_000),
  totalByCategory: z.array(z.object({ category: Category, amountMinor: z.bigint(), currency: Currency }).strict()).max(500),
  sourceDigest: Digest, version: Version, requestId: RequestId,
}).strict();
// BE34C-11 / 34.11
export const TourActualV1 = z.object({
  actualId: Uuid, tourId: Uuid, dateMemberId: Uuid.nullable(), category: Category, amountMinor: z.bigint(), currency: Currency,
  sourceRef: z.object({ system: z.string().regex(/^[a-z0-9_]{1,64}$/), factId: z.string().min(1).max(256), version: Version }).strict(),
  varianceBaseMinor: z.bigint(), version: Version, requestId: RequestId,
}).strict();
// BE34C-12 / 34.12
export const TourExpenseV1 = z.object({
  expenseId: Uuid, tourId: Uuid, dateMemberId: Uuid.nullable(), category: Category,
  amountMinor: z.bigint(), currency: Currency, evidenceState: z.enum(["receipt", "explained", "under_review", "rejected"]),
  syncState: z.enum(["pending", "synced", "failed_retryable", "dead_lettered"]), version: Version, requestId: RequestId,
}).strict();
~~~

## Per-Operation Auditability Closure

All failures instantiate BE00 `ApiError { code, message, requestId, details }`; details never contain amount, merchant, receipt, explanation, bank/card, mandate, or connector payload. Unknown faults are `500 INTERNAL_ERROR`; rate denial is `429 RATE_LIMITED` with `Retry-After`.

| Operation | Exact request → success contract | Exact errors and deterministic recovery | Required observability | Required operation tests |
|---|---|---|---|---|
| BE34C-10 | `BudgetVersionRequest` → 201 `TourBudgetVersionV1 { budgetVersionId,tourId,baseCurrency,lineCount,totalByCategory,sourceDigest,version,requestId }` | 400 VALIDATION_FAILED; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 VERSION_CONFLICT or IDEMPOTENCY_CONFLICT; 422 FX_UNAVAILABLE; 429 RATE_LIMITED; 503 DEPENDENCY_UNAVAILABLE. Stale/missing FX blocks commit; refetch and replay corrected input. | `tour_budget_version_total`, FX age/attempt/circuit, version conflict, lock duration, outbox age | currency/decimal/bigint/FX properties; category visibility; CORS/ApiError; concurrent versions and FX outage recovery |
| BE34C-11 | `ActualRequest` → 201/200 `TourActualV1 { actualId,tourId,dateMemberId,category,amountMinor,currency,sourceRef,varianceBaseMinor,version,requestId }` | common 400/401/403/404/429 plus 409 SOURCE_FACT_EXISTS, VERSION_CONFLICT, or IDEMPOTENCY_CONFLICT; 503 DEPENDENCY_UNAVAILABLE. Exact duplicate replays, digest mismatch conflicts, no double accrual. | `tour_actual_total`, source dedupe/conflict, source latency, variance band without raw amount | strict fact/success; source/finance principal matrix; CORS/BE00 ApiError envelope; exact duplicate, digest conflict, concurrent ingestion |
| BE34C-12 | `ExpenseRequest` → 201 `TourExpenseV1 { expenseId,tourId,dateMemberId,category,amountMinor,currency,evidenceState,syncState,version,requestId }` | common set plus 409 SOURCE_FACT_EXISTS or IDEMPOTENCY_CONFLICT; 422 EVIDENCE_REQUIRED; 503 DEPENDENCY_UNAVAILABLE. Expense persists with `syncState=pending` after post-commit connector failure; missing evidence commits nothing. | `tour_expense_total`, evidence state, accounting sync age/attempt/circuit, dead letters | receipt-XOR-explanation and success; payer mandate/RLS; CORS/ApiError; duplicate spend, sync timeout/retry and durable pending state |

## Ambiguity Gate

**PASS.** All source identifiers, operations, contracts, persistence rules, security decisions, concurrency behavior, recovery seams, and verification expectations are deterministic; independent implementers choose the same behavior and adversarial review leaves no surviving gap.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Added explicit ambiguity/open-question/changelog gates and normalized authoritative per-operation CORS policies. |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [IA Shard 34](../ia/34-touring-operations.md)
- Shards 11/30/31/34a/34b treasury, settlement, tour, allocation, travel, and per-diem contracts.
