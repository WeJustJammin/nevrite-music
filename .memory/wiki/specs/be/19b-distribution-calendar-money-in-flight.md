# Distribution Calendars & Money-in-Flight — Backend Specification

**Status:** Complete
**IA source:** [Shard 19 — Performance reporting, money-in-flight and forecasting](../ia/19-royalty-reporting-forecasting.md)
**Deep-dive source:** [Deep Dive 19 — Royalty reporting and forecasting](../ia/deep-dives/19-royalty-reporting-forecasting.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns reviewed, versioned society distribution calendars, registration-gated dated expectations, statement-arrival reconciliation and tolerance-aware overdue observations. It contains RRF-06 through RRF-09. It consumes Shard 18 registration/statement facts and never edits accounting truth, fabricates an amount, treats a calendar as an income gate, or labels ordinary market delay as leakage.

## Classification

- **Type:** governed reference-data and expectation-projection boundary with bitemporal calendar versions and source-independent arrival reconciliation.
- **Boundary:** distribution_calendar_version and money_in_flight_expectation ownership; society schedules, registrations, statements, rights, shows, cases and forecast models remain explicit seams.
- **Expected operations:** four HTTP operations, one for each assigned IA interaction (RRF-06, RRF-07, RRF-08 and RRF-09).
- **Approval:** blanket approval from /write-be-spec all shards; delegated decision authority applies.
- **Decision lock:** only reviewed calendars activate; corrections supersede; active registration plus calendar yields dates/status only; statement arrivals reconcile by source/right/period even when unpredicted; overdue requires versioned tolerance and delay signal, and is never an automatic leakage accusation.

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 19](../ia/19-royalty-reporting-forecasting.md) | ## Acceptance Criteria, lines 35–39 | Calendar review/versioning, registration-gated expectation, independent arrival matching and tolerance/delay handling. |
| [IA Shard 19](../ia/19-royalty-reporting-forecasting.md) | ## Interactions, lines 52–55 | Normative preconditions, behavior, completion and recovery for RRF-06 through RRF-09. |
| [IA Shard 19](../ia/19-royalty-reporting-forecasting.md) | ## Contracts, lines 66–69 and 73–77 | PublishDistributionCalendar, ProjectMoneyInFlight, EvaluateOverdueDistribution and states/errors. |
| [IA Shard 19](../ia/19-royalty-reporting-forecasting.md) | ## Data Models, lines 85–87 and 92 | Calendar/expectation invariants, Shard 18 canonical ownership and derived model rule. |
| [IA Shard 19](../ia/19-royalty-reporting-forecasting.md) | ## Event Schemas, lines 141–143 | royalty.distribution-calendar.changed.v1 and royalty.money-in-flight.changed.v1 payloads and exclusions. |
| [Deep Dive 19](../ia/deep-dives/19-royalty-reporting-forecasting.md) | ## Calendar and In-Flight Algorithm, lines 28–35 | Review activation, affected expectations, amount absence, arrival matching and overdue tolerance. |
| [Deep Dive 19](../ia/deep-dives/19-royalty-reporting-forecasting.md) | ## Abuse and Recovery Verification, lines 47–57 | Invented in-flight amount, silent calendar edit, fabricated cue status and delay handling. |
| [Deep Dive 19](../ia/deep-dives/19-royalty-reporting-forecasting.md) | ## Cross-Shard Contracts and ## Implementation Envelope, lines 59–74 | Shards 00, 09, 10 and 18 seams, PostgreSQL/RLS, Zod/Hono, queues and outbox. |
| [BE00](00-infrastructure.md) | Request/Response Contracts, lines 112–138; Middleware & Policies, lines 253–298; Deterministic Protocol Rules, lines 330–348; Error Handling, lines 418–452 | Actor context, request IDs, idempotency, audit/outbox, CORS, error envelope and fail-closed conventions inherited by every operation. |

## IA Source Map

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| RRF-06 Curator updates calendar | RRF-CAL-API-01 | Version body/territory/income type/usage rule/schedule/tolerance with provenance; reviewed activation only; corrections supersede and identify affected expectations. |
| RRF-07 System projects money-in-flight | RRF-CAL-API-02 | Require active Shard 18 registration belief plus active calendar; return dated status and amount unknown, never default cadence or fabricated amount. |
| RRF-08 Statement arrives | RRF-CAL-API-03 | Reconcile source/right/period independent of expected amount or calendar; unexpected arrival is valid unexplained arrival. |
| RRF-09 Expected distribution is late | RRF-CAL-API-04 | Apply calendar-version tolerance and counterparty-wide delay signal; return overdue observation or suppression, never automatic leakage accusation. |

## Endpoint Completeness Reconciliation

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| RRF-06 | Update distribution calendar | RRF-CAL-API-01 | Reviewed active immutable version, provenance and affected-expectation manifest. |
| RRF-07 | Project money-in-flight | RRF-CAL-API-02 | Registration/calendar join yields dated expectation with amount absent. |
| RRF-08 | Reconcile statement arrival | RRF-CAL-API-03 | Source/right/period match and unexplained-arrival state independent of expectation. |
| RRF-09 | Evaluate late distribution | RRF-CAL-API-04 | Versioned tolerance and delay signal produce overdue/within/suppressed observation. |

## API Endpoints

### Authoritative Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| RRF-CAL-API-01 | POST | /api/v1/royalties/distribution-calendars | RRF-06 | Calendar curator with a reviewed source and territory/income-type reference-data authority. | 201 PublishDistributionCalendarSuccess |
| RRF-CAL-API-02 | POST | /api/v1/royalties/money-in-flight/expectations | RRF-07 | Projection worker or mandate-scoped operator reads the named work/registration/calendar scope. | 201 ProjectMoneyInFlightSuccess |
| RRF-CAL-API-03 | POST | /api/v1/royalties/money-in-flight/arrivals | RRF-08 | Authorized statement projection worker records a Shard 18 arrival; payee/admin may request scoped reconciliation. | 200 RecordStatementArrivalSuccess |
| RRF-CAL-API-04 | POST | /api/v1/royalties/money-in-flight/overdue-evaluations | RRF-09 | Expectation owner, mandate-scoped operator or schedule worker evaluates only its expectation scope. | 200 EvaluateOverdueDistributionSuccess |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-party verifier | {accessToken, actingContextId, resourceId, requiredRole} → {actorId, partyId, roles, mandateVersion, contextVersion} | 300 ms | 2 retries at 50 ms/150 ms before mutation | Open after 5 failures/30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| Curated society calendar source | {bodyId, territory, incomeType, sourceRef, effectiveWindow} → {schedule, toleranceDays, provenance, sourceVersion, reviewedState} | 800 ms | 2 retries at 100 ms/300 ms; no activation on stale response | Open after 4 failures/30 s; candidate remains draft/reviewed; half-open after 20 s. |
| Shard 18 registration resolver | {workId, bodyId, territory, asOfDate} → {beliefState, registrationVersion, registeredFlag, registrationEvidenceClass} | 700 ms | 2 retries at 100 ms/300 ms with same read key | Open after 4 failures/30 s; projection returns REGISTRATION_REQUIRED/DEPENDENCY_UNAVAILABLE; half-open after 20 s. |
| Shard 18 statement resolver | {statementId, sourceId, rightType, periodStart, periodEnd} → {statementVersion, sourceClass, rightClass, periodEvidence, arrivalAt} | 700 ms | 2 retries at 100 ms/300 ms; amount is not a matching key | Open after 4 failures/30 s; arrival remains unexplained/pending; half-open after 20 s. |
| Counterparty-wide delay signal | {counterpartyId, bodyId, territory, period, asOf} → {signal: none, market_wide or counterparty_specific; observedAt, sourceVersion} | 500 ms | 2 retries at 75 ms/225 ms; absence means no signal, not no delay | Open after 4 failures/30 s; evaluate with signal unknown and expose freshness; half-open after 20 s. |

## Request/Response Contracts

All schemas are Zod 4 strict objects. Unknown keys reject with VALIDATION_FAILED; identifiers are UUIDs, dates are ISO calendar dates, timestamps are RFC 3339 with offset, and every error uses the BE00/global envelope ApiError { code, message, requestId, details }.

```typescript
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const Uuid = z.uuid();
const DateOnly = z.iso.date();
const DateTime = z.iso.datetime({ offset: true });
const Key = z.string().min(16).max(160).regex(/^[A-Za-z0-9._:-]+$/);
const ExactAmount = z.string().regex(/^-?(0|[1-9]\d*)(\.\d{1,18})?$/);
const Context = z.object({ actingContextId: Uuid }).strict();
const ApiErrorSchema = z.object({
  code: z.string().min(1).max(80),
  message: z.string().min(1).max(500),
  requestId: Uuid,
  details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)
}).strict();

export const PublishDistributionCalendarRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  bodyId: Uuid,
  territory: z.string().trim().min(2).max(16),
  incomeType: z.string().trim().min(1).max(80),
  usagePeriodRule: z.enum(["usage", "distribution", "receipt", "payout"]),
  schedule: z.object({ cadence: z.enum(["weekly", "monthly", "quarterly", "irregular"]), offsetDays: z.int().nonnegative().max(3650) }).strict(),
  toleranceDays: z.int().nonnegative().max(3650),
  sourceRef: Key,
  provenance: z.enum(["society_published", "mandate_confirmed", "curator_reviewed"]),
  effectiveFrom: DateOnly,
  effectiveTo: DateOnly.nullable(),
  expectedVersion: z.int().positive().nullable()
}).strict();
export const PublishDistributionCalendarSuccess = z.object({
  calendarVersionId: Uuid,
  state: z.enum(["candidate", "reviewed", "active", "superseded"]),
  affectedExpectationCount: z.int().nonnegative(),
  version: z.int().positive()
}).strict();

export const ProjectMoneyInFlightRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  workId: Uuid,
  bodyId: Uuid,
  territory: z.string().trim().min(2).max(16),
  incomeType: z.string().trim().min(1).max(80),
  calendarVersionId: Uuid,
  registrationBelief: z.enum(["registered", "registered_unmatched", "matched"]),
  registrationVersion: z.int().positive(),
  periodStart: DateOnly,
  periodEnd: DateOnly,
  expectedVersion: z.int().positive().nullable()
}).strict();
export const ProjectMoneyInFlightSuccess = z.object({
  expectationId: Uuid.nullable(),
  state: z.enum(["scheduled", "due", "arrived", "overdue", "unknown"]),
  dueDate: DateOnly.nullable(),
  amount: z.null(),
  amountKnown: z.literal(false),
  calendarVersionId: Uuid,
  version: z.int().positive()
}).strict();

export const RecordStatementArrivalRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  statementId: Uuid,
  sourceId: Uuid,
  rightType: z.string().trim().min(1).max(80),
  periodStart: DateOnly,
  periodEnd: DateOnly,
  sourceAmount: ExactAmount.nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
  expectedVersion: z.int().positive().nullable()
}).strict();
export const RecordStatementArrivalSuccess = z.object({
  statementId: Uuid,
  state: z.enum(["arrived", "reconciled", "unexplained"]),
  matchedExpectationId: Uuid.nullable(),
  amountMismatch: z.boolean(),
  version: z.int().positive()
}).strict();

export const EvaluateOverdueDistributionRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  expectationId: Uuid,
  asOfDate: DateOnly,
  calendarVersionId: Uuid,
  toleranceDays: z.int().nonnegative().max(3650),
  delaySignal: z.enum(["none", "market_wide", "counterparty_specific"]),
  delaySignalVersion: Key.nullable(),
  expectedVersion: z.int().positive()
}).strict();
export const EvaluateOverdueDistributionSuccess = z.object({
  expectationId: Uuid,
  state: z.enum(["within_tolerance", "overdue", "suppressed"]),
  leakageFinding: z.literal(false),
  toleranceAppliedDays: z.int().nonnegative(),
  version: z.int().positive()
}).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| RRF-CAL-API-01 | PublishDistributionCalendarRequest | PublishDistributionCalendarSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RRF-CAL-API-02 | ProjectMoneyInFlightRequest | ProjectMoneyInFlightSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RRF-CAL-API-03 | RecordStatementArrivalRequest | RecordStatementArrivalSuccess / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RRF-CAL-API-04 | EvaluateOverdueDistributionRequest | EvaluateOverdueDistributionSuccess / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| RRF-CAL-API-01 | Require reviewed source, body/territory/income type, usage rule, schedule, tolerance, provenance and effective dates. Candidate cannot activate without curator review. Corrections create a superseding version and affected-expectation manifest; existing expectations retain the calendar version under which they were computed. |
| RRF-CAL-API-02 | Require active registration belief exactly registered, registered_unmatched or matched and active calendar covering body/territory/income type/period. Missing registration returns REGISTRATION_REQUIRED; missing calendar returns CALENDAR_UNKNOWN. Amount is always null/amountKnown false unless an independent Shard 18 fact is later joined. |
| RRF-CAL-API-03 | Require resolvable Shard 18 source/right/period evidence. Match does not use expected amount and does not require an expectation. An unpredicted arrival is unexplained but valid; amount mismatch never suppresses arrival. |
| RRF-CAL-API-04 | Require expectation, calendar version and current due/tolerance facts. Before tolerance expires return EXPECTATION_NOT_DUE/within_tolerance. A market-wide delay signal suppresses the finding; overdue is an observation and leakageFinding remains false. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| RRF-CAL-API-01 | NOT_AUTHORIZED, VALIDATION_FAILED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for non-curator/reference-data authority; 404 hides unknown body/source/calendar. | Required 30 days; hash includes body/territory/income/rule/schedule/tolerance/effective window. Replay returns calendar version; mismatch returns IDEMPOTENCY_MISMATCH. | 120 candidate writes/hour/curator; 20 activations/hour/body. | Log operationId, requestId, body/territory hashes, source/provenance class, state, affected-count bucket and version; no source credentials. |
| RRF-CAL-API-02 | REGISTRATION_REQUIRED, CALENDAR_UNKNOWN, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign work/mandate; 404 hides unknown work/registration/calendar. | Required 24 hours; hash includes work/body/territory/income/calendar/registration/period. Replay returns expectation; mismatch returns IDEMPOTENCY_MISMATCH. | 600 projections/hour/worker; 50 concurrent/work. | Log operationId, requestId, work/body hashes, registration/calendar state, amountKnown false, due-date class and dependency latency; no amount. |
| RRF-CAL-API-03 | NOT_AUTHORIZED, VALIDATION_FAILED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign statement/source; 404 hides unknown statement/source. | Required 30 days; hash includes statement/source/right/period and source-fact hash. Replay returns arrival state; mismatch returns IDEMPOTENCY_MISMATCH. | 600 arrivals/hour/source; 50 concurrent/worker. | Log operationId, requestId, statement/source hashes, right/period classes, matched/unexplained state and latency; no source amount or line. |
| RRF-CAL-API-04 | EXPECTATION_NOT_DUE, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign expectation; 404 hides unknown expectation/calendar. | Required 24 hours; hash includes expectation/calendar/as-of/tolerance/delay signal. Replay returns evaluation; mismatch returns IDEMPOTENCY_MISMATCH. | 240 evaluations/hour/expectation scope; 20 concurrent/worker. | Log operationId, requestId, expectation/calendar hashes, tolerance, delay-signal class, state and freshness; no amount or counterparty name. |

## Database Schema

### PostgreSQL Model Registry

All tables are in schema royalty, use UUID primary keys, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL and version bigint NOT NULL CHECK (version > 0). Calendar sources/provenance are immutable per version; expectation amount is nullable and unknown by default.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| distribution_calendar_version | id uuid PK NOT NULL; body_id uuid NOT NULL FK royalty.society_body; territory text NOT NULL; income_type text NOT NULL; usage_period_rule text NOT NULL CHECK (usage_period_rule IN ('usage','distribution','receipt','payout')); cadence text NOT NULL CHECK (cadence IN ('weekly','monthly','quarterly','irregular')); offset_days integer NOT NULL CHECK (offset_days BETWEEN 0 AND 3650); tolerance_days integer NOT NULL CHECK (tolerance_days BETWEEN 0 AND 3650); source_ref text NOT NULL; provenance text NOT NULL CHECK (provenance IN ('society_published','mandate_confirmed','curator_reviewed')); effective_from date NOT NULL; effective_to date NULL CHECK (effective_to IS NULL OR effective_to >= effective_from); state text NOT NULL CHECK (state IN ('candidate','reviewed','active','superseded')); reviewed_by uuid NULL FK identity.party; supersedes_id uuid NULL FK royalty.distribution_calendar_version; affected_manifest jsonb NOT NULL CHECK (jsonb_typeof(affected_manifest) = 'object'); version bigint NOT NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | Unique (body_id, territory, income_type, effective_from, version); (body_id, territory, income_type, state, effective_from DESC); (state, updated_at); (supersedes_id). | Curator inserts/reviews mandate-scoped source; projection workers read active versions; payees read versions governing their expectations; direct client activation/update denied; anon no grant. |
| money_in_flight_expectation | id uuid PK NOT NULL; work_id uuid NOT NULL FK rights.work; body_id uuid NOT NULL FK royalty.society_body; territory text NOT NULL; income_type text NOT NULL; calendar_version_id uuid NOT NULL FK royalty.distribution_calendar_version; registration_version bigint NOT NULL; period_start date NOT NULL; period_end date NOT NULL CHECK (period_end >= period_start); due_date date NULL; amount numeric(38,18) NULL CHECK (amount IS NULL OR amount >= 0); currency char(3) NULL CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'); amount_known boolean NOT NULL CHECK (amount_known = false OR amount IS NOT NULL); state text NOT NULL CHECK (state IN ('scheduled','due','arrived','overdue','unknown')); arrived_statement_id uuid NULL FK royalty.payee_statement; delay_signal text NULL CHECK (delay_signal IS NULL OR delay_signal IN ('none','market_wide','counterparty_specific')); version bigint NOT NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | Unique (work_id, body_id, territory, income_type, period_start, calendar_version_id); (work_id, state, due_date); (body_id, territory, income_type, due_date); (arrived_statement_id). | Payee/rightsholder reads own work expectations; mandated admin reads governed scope; projection worker writes through RPC; Shard 18 arrival worker may link statement only; anon no grant. |

### State, Concurrency and Transaction Rules

- distribution_calendar_version moves candidate → reviewed → active → superseded. Activation requires curator authority and reviewed source; corrections append a new version with affected_manifest, and prior expectations retain their calendar version.
- RRF-07 accepts only Shard 18 active registration belief members registered, registered_unmatched or matched. The projection records body/period/due date and amount null; it never applies default cadence when registration/calendar is absent.
- RRF-08 resolves arrivals by source, right and period evidence. A statement without a matching expectation is unexplained but reconciled normally; expected amount and calendar do not gate acceptance.
- RRF-09 computes due date plus tolerance from the named calendar version. Before tolerance, state remains within_tolerance/EXPECTATION_NOT_DUE. A market-wide delay signal suppresses an automatic finding; overdue is not leakage.
- Every command uses expected version, unique idempotency and transactional outbox. CAS serializes calendar correction and expectation evaluation; retries reuse keys. A stale evaluation cannot overwrite a newer arrival or calendar version.
- Source revocation tombstones derived expectations, removes unauthorized projections and queues dependent invalidation. Required source/version evidence remains retained.

### Grants, RLS and Retention

- RLS derives app.actor_party_id() and mandate version from BE00. Calendar predicates require curator/source authority; expectation predicates require work/payee ownership or mandate; schedule workers are limited to a job scope.
- Payees see their own dated expectations and arrival state but no other payee's source or delay details. Curators see governed calendar sources; Shard 18 receives only arrival/reconciliation projection; no consumer can edit accounting truth.
- Calendar provenance, affected manifests, expectation versions, source references and arrival evidence follow reporting/legal retention. Erasure revokes derived access and pseudonymizes projections without deleting required audit/version evidence.
- Exact amounts are absent unless independently sourced; logs/events contain amountKnown and source classes only. No forecast, expectation or overdue state is a payment guarantee.

## Middleware & Policies

### Authorization Matrix

| Role | Allowed scope | Explicit denial |
|---|---|---|
| Calendar curator | Review/activate mandate-scoped body/territory/income calendar versions and corrections. | Silent activation, accounting edits, foreign source or expectation mutation. |
| Payee/rightsholder | Read own money-in-flight expectation and arrival state. | Other payees, calendar activation or delay-signal manipulation. |
| Rights administrator | Read/trigger projections inside active mandate scope. | Default cadence, amount invention, statement mutation or leakage verdict. |
| Projection service principal | Read Shard 18 registration/statements and append scoped expectations/events. | Broad catalogue access, changing registration/accounting truth or bypassing active calendar. |
| Finance/support | Read scoped status/diagnostics only. | Payout action, amount fabrication or automatic leakage accusation. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| RRF-CAL-API-01 | requestId → strictCors(royaltyReportingOrigins) → requireAuth → resolveActingContext → rateLimit(calendarWrite) → parseZod(PublishDistributionCalendarRequest) → idempotency(30d) → authorizeCalendarCurator → reviewedSourceGuard → activeVersionCAS → calendarTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| RRF-CAL-API-02 | requestId → strictCors(royaltyReportingOrigins) → requireAuth → resolveActingContext → rateLimit(inFlightProjection) → parseZod(ProjectMoneyInFlightRequest) → idempotency(24h) → authorizeWorkScope → activeRegistrationGuard → activeCalendarGuard → amountUnknownGuard → expectationTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| RRF-CAL-API-03 | requestId → strictCors(royaltyReportingOrigins) → requireAuth → resolveActingContext → rateLimit(statementArrival) → parseZod(RecordStatementArrivalRequest) → idempotency(30d) → authorizeStatementScope → sourceRightPeriodGuard → expectedAmountIndependenceGuard → arrivalTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| RRF-CAL-API-04 | requestId → strictCors(royaltyReportingOrigins) → requireAuth → resolveActingContext → rateLimit(overdueEvaluation) → parseZod(EvaluateOverdueDistributionRequest) → idempotency(24h) → authorizeExpectationScope → toleranceVersionGuard → delaySignalGuard → overdueTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |

### Security and Privacy Controls

Use private/no-store expectation views, opaque work/body/source IDs, mandate-scoped RLS and signed curator/source links. CORS never permits * with credentials. Never log source credentials, society schedules not in the actor's scope, expected amounts, counterparty names, statement lines or private delay evidence. A calendar cannot be selected from client state unless active and authorized. Arrival matching never uses an amount supplied by an expectation.

## Data Flow

1. RRF-CAL-API-01 imports/reviews source schedule, writes a reviewed/active calendar version and queues affected expectation recomputation on correction.
2. RRF-CAL-API-02 reads Shard 18 registration belief and active calendar, then writes dated expectation with amount null/amountKnown false.
3. RRF-CAL-API-03 reads Shard 18 source/right/period evidence, links a matching expectation if present, and otherwise writes unexplained arrival without rejection.
4. RRF-CAL-API-04 evaluates due date, tolerance and counterparty-wide delay signal. It emits overdue observation or suppression, never an automatic leakage accusation.
5. Events expose state/version/freshness only; Shard 18 remains canonical for statement and registration facts, and 19c consumes labelled expectations separately from forecast ranges.

## Events and Consumer Contracts

Events are transactional-outbox records with eventId, eventType, schemaVersion, occurredAt, aggregateId, aggregateVersion, correlationId and causationId. Payloads exclude exact amounts, society/member IDs, statement lines, private schedules and counterparty names.

| Event type | Emitted by | Required payload and consumers |
|---|---|---|
| royalty.distribution-calendar.changed.v1 | RRF-CAL-API-01 | calendarVersionId, body/territory/income classes, state, source/provenance class, affectedCount, version; in-flight projector and curator tasks consume it. |
| royalty.money-in-flight.changed.v1 | RRF-CAL-API-02/03/04 | expectationId, work/body/territory hash, period, due/state, amountKnown, delay-signal class, version; dashboards, leakage views and forecast eligibility consume it. |

Consumers deduplicate by eventId and aggregate version, preserve calendar lineage and unexplained arrival, and never infer money, leakage, registration acceptance or forecast certainty.

## Error Handling and Failure Recovery

| Operation ID | Failure | Required response and recovery |
|---|---|---|
| RRF-CAL-API-01 | Source unavailable, unreviewed candidate or correction race | Return DEPENDENCY_UNAVAILABLE/validation refusal; keep candidate reviewed/draft, require curator review and append superseding version with manifest; no silent activation. |
| RRF-CAL-API-02 | Registration/calendar missing or resolver outage | Return REGISTRATION_REQUIRED/CALENDAR_UNKNOWN/DEPENDENCY_UNAVAILABLE; render honest absence, do not create default expectation or amount. |
| RRF-CAL-API-03 | Arrival has no expectation or source mismatch | Persist unexplained arrival when source/right/period are valid; do not reject due to amount mismatch. Invalid/unknown source fails closed and retries idempotently. |
| RRF-CAL-API-04 | Tolerance not elapsed, market delay or stale evaluation | Return EXPECTATION_NOT_DUE/within_tolerance or suppressed; preserve delay signal/freshness. CAS rejects stale overwrite and re-evaluates current version. |

All errors serialize ApiError { code, message, requestId, details }; details contains safe state, owner, freshness and retry metadata without source amount or private schedule.

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| RRF-CAL-API-01 | Zod strict source/schedule/tolerance/effective-window schema and exact error envelope. | Curator mandate, reviewed activation, CORS/rate and source privacy. | Immutable calendar version, supersession manifest, CAS, RLS/grants and event. | Stale source, correction race, outage, replay and redacted audit. |
| RRF-CAL-API-02 | Registration/calendar/period and null amount invariants. | Active registration, amountUnknown, scope, CORS/rate. | Expectation uniqueness, version retention, arrival link, RLS and event. | Missing registration/calendar, resolver outage, duplicate projection and stale calendar. |
| RRF-CAL-API-03 | Source/right/period/optional amount and arrival-state schema. | Statement ownership, amount-independent match, CORS/rate and redaction. | Unexplained arrival, expectation link, CAS, RLS and event. | Unexpected arrival, amount mismatch, source outage and replay. |
| RRF-CAL-API-04 | As-of/tolerance/delay-signal and leakageFinding false schema. | Expectation scope, market-delay suppression, no leakage verdict, CORS/rate. | CAS against arrival/calendar, durable observation, RLS and event. | Not-due, stale race, delay outage, duplicate evaluation and freshness. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 strict schemas, calendar enum/tolerance, registration state, nullable amount, source/right/period match and delay suppression. PostgreSQL tests prove reviewed-only activation, immutable supersession, expectation amount absence, arrival reconciliation, CAS, RLS and outbox atomicity. Worker tests replay affected manifests and verify no default cadence, amount invention or leakage accusation. Playwright covers accessible date/status tables, unknown amount labels, unexpected arrival explanation, tolerance/market-delay text and private source controls. The gate fails on silent activation, fabricated amount, calendar-gated arrival, false leakage, stale overwrite or cross-tenant source disclosure.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — boundary:** verified RRF-06 through RRF-09 map one-to-one to four routes; live returns/cue sheets and forecasts remain in sibling companions.
- **Pass 2 — micro:** resolved review activation, superseding correction, active registration members, amount absence, independent arrival match, tolerance and market-wide delay suppression.
- **Pass 3 — macro:** traced source calendar → registration/calendar expectation → Shard 18 arrival → overdue evaluation; canonical accounting remains external.
- **Pass 4 — abuse/recovery:** covered silent activation, stale correction, missing registration/calendar, invented amount, unexpected arrival, amount mismatch, delay signal outage and CAS race.
- **Pass 5 — contract:** every operation has exact Zod request/success/error, 403/404, idempotency, rate, CORS, ApiError, persistence, RLS, event and test rows.

## Ambiguity Gate

**PASS.** Calendar review/versioning, registration gating, amount-independent arrival reconciliation and tolerance-aware overdue behavior are fully resolved. Unknown calendar/registration, unexpected arrival, market delay and stale version have explicit outcomes. No unresolved ambiguity remains inside this split.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Authored reviewed distribution calendars, dated money-in-flight expectations, arrival reconciliation and tolerance-aware overdue contracts. | /write-be-spec |

## Dependency References

- **Depends on:** [BE00](00-infrastructure.md) for authority, CORS, ApiError, idempotency, audit and outbox; Shard 18 for registration/statement facts; Shards 09/10 for source/right context; Shard 01 for curator mandates.
- **Consumed by:** 19c forecast eligibility consumes labelled dated expectations; dashboards/leakage views consume versioned state only. No consumer may treat an expectation as income or an overdue observation as a leakage verdict.
- **Boundary:** this split governs calendar reference data and derived expectation timing. It never edits accounting, invents amounts, rejects valid arrivals or claims a payout.
