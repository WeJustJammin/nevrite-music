# Income, Tax Readiness & Receivables — Backend Specification

**Status:** Complete

**IA source:** [Shard 41 — Career finance and business operations](../ia/41-career-finance.md)

**Companion:** [41b — Deals, Recoupment & P&L](41b-deals-recoupment-pl.md)

**Platform contract:** [BE 00 — Cross-cutting platform foundation](00-infrastructure.md)

## Classification

| Dimension | Decision |
|---|---|
| Classification | Multi-domain companion 41a: income aggregation, FX, statements, expense/tax readiness, quotes, invoices, and dunning |
| Included IA interactions | 41.01–41.11 |
| Included features | 23.01 Income Aggregation & Financial Identity; 23.02 Expenses & Tax Readiness; 23.03 Invoicing & Receivables |
| Excluded boundary | Deal instruments, confirmed terms, advances, commission, recoupment, runway, P&L, and band allocation belong to 41b |
| Money/advice boundary | Records facts and obligations; never moves money, files tax returns, determines deductibility, or supplies legal/tax advice |
| Trust boundary | Producer-observed income may be verified/observed; imports remain declared forever and never enter a verified headline |

The approved split is source-faithful. Interactions 41.01–41.11 share the income-to-receivable lifecycle and the first eight canonical contracts; no interaction is divided between companions.

## Referenced Material Inventory

| Material | Exact source location | Use |
|---|---|---|
| IA scope and locked decisions | [IA 41 lines 7–49](../ia/41-career-finance.md#overview) | Ledger, trust, FX, statement, tax, invoice, and dunning boundaries |
| Feature inventory | [IA 41 lines 51–58](../ia/41-career-finance.md#features) | Features 23.01, 23.02, and 23.03 |
| Acceptance criteria | [IA 41 lines 60–80](../ia/41-career-finance.md#acceptance-criteria) | AC-41.01 through AC-41.11 |
| Interaction registry | [IA 41 lines 82–104](../ia/41-career-finance.md#interactions) | Operation completeness and recovery behavior |
| Canonical contracts | [IA 41 lines 106–123](../ia/41-career-finance.md#contracts) | First eight contract names and invariants |
| Canonical data models | [IA 41 lines 125–178](../ia/41-career-finance.md#data-models) | Fifteen persistence models and cardinalities |
| Access control | [IA 41 lines 180–202](../ia/41-career-finance.md#access-control) | Holder, delegate, recipient, admin, and service-principal policy |
| Events and edge cases | [IA 41 lines 216–273](../ia/41-career-finance.md#event-schemas) | Five event types, concurrency, revocation, and recovery |
| Dependencies | [IA 41 lines 275–290](../ia/41-career-finance.md#cross-shard-dependencies) | Shards 00, 14, 18, 26, 28, 31, and downstream 42 |
| Global HTTP/runtime rules | [BE 00 lines 112–200](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) | Strict Zod 4, ApiError, identifiers, pagination, and response headers |
| Global middleware and protocols | [BE 00 lines 253–353](00-infrastructure.md#middleware--policies) | Auth, CORS, idempotency, ETag, limits, and request ordering |
| Global events/errors/recovery | [BE 00 lines 355–500](00-infrastructure.md#event-and-consumer-contracts) | At-least-once envelopes, error mapping, observability, and recovery |

No source summary overrides these cited normative sections.

## IA Source Map

| Operation | IA interaction and acceptance criterion | Canonical result |
|---|---|---|
| 41.01 | Ingest income event; AC-41.01 | Immutable verified/observed IncomeEventV1 or parked IncomeReversalV1 |
| 41.02 | Import off-platform income; AC-41.02 | Preview/commit of permanently declared IncomeEventV1 rows |
| 41.03 | View FX projection; AC-41.03 | Provenance-bearing FxProjectionV1 or unresolved rate |
| 41.04 | Issue income statement; AC-41.04 | Immutable IssuedFinancialSnapshotV1 plus verification page |
| 41.05 | Link income to work; AC-41.05 | Permissioned attribution projection; income fact remains unchanged |
| 41.06 | Capture expense/receipt; AC-41.06 | ExpenseEvidenceV1 with human-confirmed extracted fields |
| 41.07 | Build tax pack; AC-41.07 | Immutable evidence snapshot or fail-closed jurisdiction/blocker result |
| 41.08 | Track withholding/reclaim; AC-41.08 | Preparation checklist and alert only; no filing or eligibility decision |
| 41.09 | Send/revise quote; AC-41.09 | Immutable QuoteVersionV1 and opaque recipient link |
| 41.10 | Issue/correct invoice; AC-41.10 | InvoiceInstrumentV1 or linked credit note; never in-place correction |
| 41.11 | Run dunning ladder; AC-41.11 | DunningDecisionV1 and additive receivable evidence |

### Canonical identifier registry

| Kind | Exact identifiers |
|---|---|
| Contracts | IncomeEventV1; IncomeReversalV1; FxProjectionV1; IssuedFinancialSnapshotV1; ExpenseEvidenceV1; QuoteVersionV1; InvoiceInstrumentV1; DunningDecisionV1 |
| Models | income_event; income_reversal; income_reconciliation_case; fx_projection; financial_snapshot; verification_page; expense_event; receipt_evidence; tax_rule_pack; tax_pack; quote; quote_version; invoice; credit_note; receivable_event |
| Events | finance.income.appended.v1; finance.income.reversed.v1; finance.snapshot.issued.v1; finance.invoice.issued.v1; finance.receivable.changed.v1 |

## Endpoint Completeness Reconciliation

| Operation | Backend responsibility | Persistence effect | Event/effect |
|---|---|---|---|
| 41.01 | Authenticate producer, verify source allowlist, append or park reversal | income_event, income_reversal, income_reconciliation_case | finance.income.appended.v1 or finance.income.reversed.v1 |
| 41.02 | Validate declared rows, detect overlaps, preview or atomically commit | income_event, income_reconciliation_case | finance.income.appended.v1 for committed rows |
| 41.03 | Read native event and materialize one-rate projection | fx_projection | No domain event; disposable projection |
| 41.04 | Gate duplicates/FX, freeze included versions, issue snapshot | financial_snapshot, verification_page | finance.snapshot.issued.v1 |
| 41.05 | Validate work/credit permission and set derived attribution | supporting income_work_attribution projection; income_event remains immutable | No money or source-fact event |
| 41.06 | Bind uploaded evidence, propose extraction, confirm expense | expense_event, receipt_evidence | Internal audit/job events only |
| 41.07 | Resolve exact jurisdiction rules and render immutable pack | tax_rule_pack read; tax_pack write | finance.snapshot.issued.v1 with kind tax_pack |
| 41.08 | Store withholding evidence, deadline, and preparation state | supporting withholding_reclaim_record | finance.receivable.changed.v1 |
| 41.09 | Freeze successor quote version and issue recipient capability | quote, quote_version | Delivery job; no payment effect |
| 41.10 | Lock numbering and issue invoice or linked credit note | invoice, credit_note, receivable_event | finance.invoice.issued.v1 |
| 41.11 | Evaluate opt-in, uncertainty, exclusion, then send/hold | receivable_event | finance.receivable.changed.v1 |

### Feature coverage

| Feature | Operations | Proof of complete boundary |
|---|---|---|
| 23.01 | 41.01–41.05 | Source ingestion/import, reconciliation, FX, issued statements, and work attribution |
| 23.02 | 41.06–41.08 | Evidence-first expense capture, supported-rule packs, and withholding preparation |
| 23.03 | 41.09–41.11 | Versioned quotes, immutable fiscal instruments, and uncertainty-safe dunning |

## Shared Contract Inheritance

This companion inherits BE 00 without redefining platform endpoints. Every request uses BE 00 request IDs, session/service authentication, canonical idempotency hashing, body limits, ETag/version grammar, structured logging, event envelopes, job reconciliation, and security headers. Every failure uses exactly:

~~~ts
type ApiError = {
  code: string;
  message: string;
  requestId: string;
  details: Readonly<Record<string, JsonValue>>;
};
~~~

No top-level error fields beyond code, message, requestId, and details are permitted. All failures set Content-Type: application/json, X-Request-Id, Cache-Control: no-store, and applicable rate headers. This spec adds domain codes only; it does not create authentication, upload, job, event-replay, or generic public-capability endpoints.

## API Endpoints

### Authoritative Route Registry

This is the sole route registry for 41a. Operation IDs are stable OpenAPI operationId values.

| Op | Method and path | Principal | CORS policy | Validation | Rate limit | Idempotency | Success |
|---|---|---|---|---|---|---|---|
| 41.01 | POST /api/v1/internal/finance/income-events | Allowlisted source service | BE00-CORS-DENY | JSON plus signed event headers | 600/min/source; burst 100 | Required, 24h replay | 201 or 202 |
| 41.02 | POST /api/v1/finance/income-imports | Holder or finance delegate | BE00-CORS-WEB-CREDENTIALLED | JSON; CSV uses BE00 upload reference | 20/min/holder | Required, 24h | 200 preview or 201 commit |
| 41.03 | GET /api/v1/finance/income-events/{incomeEventId}/fx-projection | Holder or finance delegate | BE00-CORS-WEB-CREDENTIALLED | Path and query | 120/min/holder | Not accepted; deterministic cache key | 200 |
| 41.04 | POST /api/v1/finance/income-statements | Holder or named statement delegate with step-up | BE00-CORS-WEB-CREDENTIALLED | JSON and Idempotency-Key | 6/hour/holder | Required, 24h | 201 |
| 41.05 | PUT /api/v1/finance/income-events/{incomeEventId}/work-link | Holder only | BE00-CORS-WEB-CREDENTIALLED | Path, JSON, If-Match | 30/min/holder | Required, 24h | 200 |
| 41.06 | POST /api/v1/finance/expenses | Holder or expense delegate | BE00-CORS-WEB-CREDENTIALLED | Discriminated JSON, uploadRef, conditional If-Match | 60/min/holder | Required, 24h | 201 |
| 41.07 | POST /api/v1/finance/tax-packs | Holder or named tax delegate with step-up | BE00-CORS-WEB-CREDENTIALLED | JSON and Idempotency-Key | 4/hour/holder | Required, 24h | 201 |
| 41.08 | PUT /api/v1/finance/withholding-reclaims/{incomeEventId} | Holder or tax delegate | BE00-CORS-WEB-CREDENTIALLED | Path, JSON, If-Match | 30/min/holder | Required, 24h | 200 |
| 41.09 | POST /api/v1/finance/quote-versions | Supplier owner or quote delegate with step-up on send | BE00-CORS-WEB-CREDENTIALLED | JSON, conditional If-Match | 30/min/supplier | Required, 24h | 201 |
| 41.10 | POST /api/v1/finance/invoices/issuances | Issuer owner or invoice delegate with step-up | BE00-CORS-WEB-CREDENTIALLED | Discriminated JSON | 20/min/issuer | Required, 24h | 201 |
| 41.11 | POST /api/v1/internal/finance/dunning-decisions | Scheduler service | BE00-CORS-DENY | JSON plus scheduler assertion | 300/min/service; 20/min/invoice | Required, 24h | 200 |

CORS policies are closed allowlists: BE00-CORS-WEB-CREDENTIALLED permits configured first-party origins and GET; BE00-CORS-WEB-CREDENTIALLED permits configured first-party origins, the named method, Content-Type, Idempotency-Key, If-Match, and X-CSRF-Token with credentials; BE00-CORS-DENY rejects any Origin header. OPTIONS is handled by BE00 and never reaches domain authorization.

### Operation Contract Matrix

| Op | Request contract | Success contract | Error contract |
|---|---|---|---|
| 41.01 | IncomeIngestRequest plus ServiceHeaders | IncomeIngestResult | BE00 ApiError { code, message, requestId, details } |
| 41.02 | IncomeImportRequest plus CommandHeaders | IncomeImportResult | BE00 ApiError { code, message, requestId, details } |
| 41.03 | FxProjectionParams | FxProjectionResult | BE00 ApiError { code, message, requestId, details } |
| 41.04 | IncomeStatementRequest plus CommandHeaders | IncomeStatementResult | BE00 ApiError { code, message, requestId, details } |
| 41.05 | WorkLinkRequest plus VersionedHeaders | WorkLinkResult | BE00 ApiError { code, message, requestId, details } |
| 41.06 | ExpenseCaptureRequest plus ExpenseCaptureHeaders | ExpenseCaptureResult | BE00 ApiError { code, message, requestId, details } |
| 41.07 | TaxPackRequest plus CommandHeaders | TaxPackResult | BE00 ApiError { code, message, requestId, details } |
| 41.08 | WithholdingReclaimRequest plus VersionedHeaders | WithholdingReclaimResult | BE00 ApiError { code, message, requestId, details } |
| 41.09 | QuoteVersionRequest plus QuoteVersionHeaders | QuoteVersionResult | BE00 ApiError { code, message, requestId, details } |
| 41.10 | InvoiceIssuanceRequest plus CommandHeaders | InvoiceIssuanceResult | BE00 ApiError { code, message, requestId, details } |
| 41.11 | DunningRequest plus ServiceHeaders | DunningResult | BE00 ApiError { code, message, requestId, details } |

## Request and Response Contracts — Zod 4

All schemas are strict Zod 4 schemas and are the only source for runtime validation, TypeScript inference, tests, and OpenAPI. UUIDs are lowercase canonical UUIDs; instants are offset-aware RFC 3339; currency is ISO 4217 uppercase; money uses integer minor units.

~~~ts
import { z } from "zod";

const Uuid = z.uuid();
const Instant = z.iso.datetime({ offset: true });
const DateOnly = z.iso.date();
const Currency = z.string().regex(/^[A-Z]{3}$/);
const MoneyMinor = z.int().min(-9_000_000_000_000_000).max(9_000_000_000_000_000);
const NonNegativeMoney = MoneyMinor.min(0);
const Version = z.int().positive();
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const SafeText = z.string().trim().min(1).max(500);
const Url = z.url().max(2048);
const PublicToken = z.string().regex(/^[A-Za-z0-9_-]{32,128}$/);
const PositiveDecimal = z.string().max(40).regex(/^(?:0\.[0-9]*[1-9][0-9]*|[1-9][0-9]*(?:\.[0-9]+)?)$/);
const Ratio = z.string().regex(/^(0(\.[0-9]{1,6})?|1(\.0{1,6})?)$/);

const CommandHeaders = z.object({
  "idempotency-key": z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  "x-csrf-token": z.string().min(32).max(512),
}).strict();
const VersionedHeaders = CommandHeaders.extend({
  "if-match": z.string().regex(/^"[1-9][0-9]*"$/),
}).strict();
const QuoteVersionHeaders = CommandHeaders.extend({
  "if-match": z.string().regex(/^"[1-9][0-9]*"$/).optional(),
}).strict();
const ExpenseCaptureHeaders = CommandHeaders.extend({
  "if-match": z.string().regex(/^"[1-9][0-9]*"$/).optional(),
}).strict();
const ServiceHeaders = z.object({
  "idempotency-key": z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  "x-source-event-signature": z.string().min(32).max(1024),
  "x-source-event-timestamp": z.string().regex(/^[0-9]{10,13}$/),
}).strict();

const MoneyComponents = z.object({
  currency: Currency,
  grossMinor: MoneyMinor,
  deductionsMinor: NonNegativeMoney.nullable(),
  netMinor: MoneyMinor,
  completeness: z.enum(["complete", "net_only"]),
}).strict().superRefine((v, ctx) => {
  if (v.completeness === "complete" && v.deductionsMinor === null)
    ctx.addIssue({ code: "custom", path: ["deductionsMinor"], message: "required_when_complete" });
  if (v.completeness === "complete" && v.deductionsMinor !== null &&
      v.grossMinor - v.deductionsMinor !== v.netMinor)
    ctx.addIssue({ code: "custom", path: ["netMinor"], message: "gross_minus_deductions_must_equal_net" });
  if (v.completeness === "net_only" && (v.deductionsMinor !== null || v.grossMinor !== v.netMinor))
    ctx.addIssue({ code: "custom", path: ["completeness"], message: "net_only_requires_unknown_deductions" });
});

export const IncomeEventV1 = z.object({
  eventId: Uuid,
  holderPartyId: Uuid,
  sourceShard: z.enum(["14", "18", "26", "28", "31", "import"]),
  sourceEventId: z.string().min(1).max(200),
  occurredAt: Instant,
  money: MoneyComponents,
  trustClass: z.enum(["verified", "observed", "declared"]),
  provenanceDigest: Sha256,
  version: Version,
}).strict();

export const IncomeReversalV1 = z.object({
  reversalId: Uuid,
  originalEventId: Uuid,
  sourceEventId: z.string().min(1).max(200),
  reasonCode: z.enum(["refund", "chargeback", "void", "source_correction"]),
  occurredAt: Instant,
  money: MoneyComponents,
  state: z.enum(["applied", "parked_predecessor_missing"]),
  version: Version,
}).strict();

export const IncomeIngestRequest = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("income"),
    holderPartyId: Uuid,
    sourceShard: z.enum(["14", "18", "26", "28", "31"]),
    sourceEventId: z.string().min(1).max(200),
    occurredAt: Instant,
    money: MoneyComponents,
    trustClass: z.enum(["verified", "observed"]),
    provenanceDigest: Sha256,
  }).strict(),
  z.object({
    kind: z.literal("reversal"),
    holderPartyId: Uuid,
    sourceShard: z.enum(["14", "18", "26", "28", "31"]),
    sourceEventId: z.string().min(1).max(200),
    originalSourceEventId: z.string().min(1).max(200),
    reasonCode: z.enum(["refund", "chargeback", "void", "source_correction"]),
    occurredAt: Instant,
    money: MoneyComponents,
    provenanceDigest: Sha256,
  }).strict(),
]);
export const IncomeIngestResult = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("income"), replayed: z.boolean(), income: IncomeEventV1 }).strict(),
  z.object({ kind: z.literal("reversal"), replayed: z.boolean(), reversal: IncomeReversalV1 }).strict(),
]);

const ImportRow = z.object({
  clientRowId: z.string().min(1).max(100),
  occurredAt: Instant,
  money: MoneyComponents,
  payerLabel: z.string().trim().min(1).max(160),
  externalReference: z.string().trim().min(1).max(200).nullable(),
  provenanceDigest: Sha256,
}).strict().superRefine((v, ctx) => {
  if (v.money.completeness === "net_only" && v.money.deductionsMinor !== null)
    ctx.addIssue({ code: "custom", path: ["money", "deductionsMinor"], message: "must_be_unknown" });
});
export const IncomeImportRequest = z.object({
  mode: z.enum(["preview", "commit"]),
  importBatchId: Uuid.nullable(),
  sourceKind: z.enum(["csv_upload", "manual"]),
  uploadRef: Uuid.nullable(),
  rows: z.array(ImportRow).min(1).max(1000),
  overlapDecisions: z.array(z.object({
    clientRowId: z.string().min(1).max(100),
    candidateIncomeEventId: Uuid,
    decision: z.enum(["keep_both", "exclude_import"]),
  }).strict()).max(1000),
}).strict().superRefine((v, ctx) => {
  if (v.sourceKind === "csv_upload" && v.uploadRef === null)
    ctx.addIssue({ code: "custom", path: ["uploadRef"], message: "required_for_csv_upload" });
  if (v.mode === "commit" && v.importBatchId === null)
    ctx.addIssue({ code: "custom", path: ["importBatchId"], message: "required_for_commit" });
  if (new Set(v.rows.map(r => r.clientRowId)).size !== v.rows.length)
    ctx.addIssue({ code: "custom", path: ["rows"], message: "client_row_ids_must_be_unique" });
});
export const IncomeImportResult = z.object({
  importBatchId: Uuid,
  mode: z.enum(["preview", "commit"]),
  declaredOnly: z.literal(true),
  overlaps: z.array(z.object({
    clientRowId: z.string().min(1).max(100),
    candidateIncomeEventId: Uuid,
    reasonCode: z.enum(["same_reference", "amount_date_similarity"]),
    state: z.enum(["needs_decision", "resolved"]),
  }).strict()),
  committedIncomeEventIds: z.array(Uuid),
}).strict();

export const FxProjectionParams = z.object({
  incomeEventId: Uuid,
  reportingCurrency: Currency,
  rateDate: DateOnly,
  sourceClass: z.enum(["estimated", "accounting", "provider_actual"]),
}).strict();
export const FxProjectionV1 = z.discriminatedUnion("state", [
  z.object({
    state: z.literal("resolved"),
    projectionId: Uuid,
    incomeEventId: Uuid,
    nativeCurrency: Currency,
    reportingCurrency: Currency,
    rate: PositiveDecimal,
    rateDate: DateOnly,
    sourceClass: z.enum(["estimated", "accounting", "provider_actual"]),
    rateSourceVersion: z.string().min(1).max(100),
    convertedGrossMinor: MoneyMinor,
    convertedDeductionsMinor: MoneyMinor.nullable(),
    convertedNetMinor: MoneyMinor,
    unresolvedReason: z.null(),
    supersedesProjectionId: Uuid.nullable(),
    version: Version,
  }).strict(),
  z.object({
    state: z.literal("unresolved"),
    projectionId: Uuid,
    incomeEventId: Uuid,
    nativeCurrency: Currency,
    reportingCurrency: Currency,
    rate: z.null(),
    rateDate: DateOnly,
    sourceClass: z.enum(["estimated", "accounting", "provider_actual"]),
    rateSourceVersion: z.null(),
    convertedGrossMinor: z.null(),
    convertedDeductionsMinor: z.null(),
    convertedNetMinor: z.null(),
    unresolvedReason: z.enum(["rate_missing", "provider_unavailable", "unsupported_pair"]),
    supersedesProjectionId: Uuid.nullable(),
    version: Version,
  }).strict(),
]);
export const FxProjectionResult = z.object({ projection: FxProjectionV1 }).strict();

const Period = z.object({ from: DateOnly, through: DateOnly }).strict()
  .refine(v => v.from <= v.through, { message: "from_must_not_follow_through" });
export const IncomeStatementRequest = z.object({
  period: Period,
  reportingCurrency: Currency,
  title: z.string().trim().min(1).max(120),
  verificationExpiresAt: Instant,
  expectedLedgerVersion: Version,
}).strict();
export const IssuedFinancialSnapshotV1 = z.object({
  snapshotId: Uuid,
  holderPartyId: Uuid,
  kind: z.enum(["income_statement", "tax_pack"]),
  period: Period,
  reportingCurrency: Currency,
  includedIncomeEventIds: z.array(Uuid).min(1).max(100_000),
  includedLedgerVersion: Version,
  verifiedGrossMinor: MoneyMinor,
  verifiedNetMinor: MoneyMinor,
  declaredGrossMinor: MoneyMinor,
  declaredNetMinor: MoneyMinor,
  exceptionCodes: z.array(z.string().regex(/^[A-Z0-9_]{1,64}$/)).max(1000),
  issuedAt: Instant,
  supersedesSnapshotId: Uuid.nullable(),
  digest: Sha256,
}).strict();
export const IncomeStatementResult = z.object({
  snapshot: IssuedFinancialSnapshotV1,
  verificationUrl: Url,
  verificationExpiresAt: Instant,
}).strict().refine(v => v.snapshot.kind === "income_statement", {
  message: "income_statement_result_requires_income_statement_snapshot",
});

export const WorkLinkRequest = z.object({
  action: z.enum(["link", "unlink"]),
  candidateType: z.enum(["work", "credit"]),
  candidateId: Uuid,
  evidenceCode: z.enum(["holder_selected", "source_reference", "credit_match"]),
}).strict();
export const WorkLinkResult = z.object({
  incomeEventId: Uuid,
  state: z.enum(["attributed", "unlinked", "degraded_credit_revoked"]),
  candidateType: z.enum(["work", "credit"]),
  candidateId: Uuid,
  projectionVersion: Version,
}).strict();

export const ExpenseEvidenceV1 = z.object({
  expenseEventId: Uuid,
  holderPartyId: Uuid,
  occurredOn: DateOnly,
  nativeAmountMinor: NonNegativeMoney,
  currency: Currency,
  supplierLabel: z.string().trim().min(1).max(160),
  evidenceRef: Uuid,
  evidenceDigest: Sha256,
  categoryProposal: z.string().trim().min(1).max(80).nullable(),
  confirmedCategory: z.string().trim().min(1).max(80).nullable(),
  projectTagId: Uuid.nullable(),
  extractionState: z.enum(["not_requested", "proposed", "failed", "confirmed"]),
  version: Version,
}).strict();
export const ExpenseCaptureRequest = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("capture"),
    occurredOn: DateOnly,
    nativeAmountMinor: NonNegativeMoney,
    currency: Currency,
    supplierLabel: z.string().trim().min(1).max(160),
    evidenceRef: Uuid,
    evidenceDigest: Sha256,
    categoryProposal: z.string().trim().min(1).max(80).nullable(),
    confirmedCategory: z.string().trim().min(1).max(80).nullable(),
    projectTagId: Uuid.nullable(),
    requestExtraction: z.boolean(),
  }).strict(),
  z.object({
    action: z.literal("confirm_extraction"),
    expenseEventId: Uuid,
    receiptEvidenceId: Uuid,
    evidenceDigest: Sha256,
    confirmedCategory: z.string().trim().min(1).max(80),
    projectTagId: Uuid.nullable(),
    extractionProposalVersion: Version,
  }).strict(),
]);
export const ExpenseCaptureResult = z.object({ expense: ExpenseEvidenceV1 }).strict();

export const TaxPackRequest = z.object({
  jurisdictionCode: z.string().regex(/^[A-Z]{2}(-[A-Z0-9]{1,3})?$/),
  taxYear: z.int().min(2000).max(2200),
  reportingCurrency: Currency,
  includeWithholding: z.boolean(),
  expectedLedgerVersion: Version,
  issue: z.literal(true),
}).strict();
export const TaxPackResult = z.object({
  taxPackId: Uuid,
  snapshot: IssuedFinancialSnapshotV1,
  rulePackVersion: z.string().min(1).max(100),
  state: z.literal("issued"),
  exceptionCodes: z.array(z.string().regex(/^[A-Z0-9_]{1,64}$/)).max(1000),
  artifactUrl: Url,
}).strict().refine(v => v.snapshot.kind === "tax_pack", {
  message: "tax_pack_result_requires_tax_pack_snapshot",
});

export const WithholdingReclaimRequest = z.object({
  territoryCode: z.string().regex(/^[A-Z]{2}(-[A-Z0-9]{1,3})?$/),
  deductionMinor: NonNegativeMoney,
  currency: Currency,
  deadline: DateOnly,
  deadlineSource: z.enum(["authority_published", "contract_confirmed", "user_confirmed"]),
  checklist: z.array(z.object({
    itemCode: z.string().regex(/^[a-z0-9_]{1,64}$/),
    state: z.enum(["needed", "collected", "not_applicable"]),
    evidenceRef: Uuid.nullable(),
  }).strict()).max(100),
  state: z.enum(["preparing", "ready_for_external_filing", "closed"]),
}).strict();
export const WithholdingReclaimResult = z.object({
  incomeEventId: Uuid,
  reclaimRecordId: Uuid,
  state: z.enum(["preparing", "ready_for_external_filing", "closed"]),
  filesNothing: z.literal(true),
  version: Version,
}).strict();

const QuoteLine = z.object({
  description: z.string().trim().min(1).max(300),
  quantity: z.int().positive().max(1_000_000),
  unitPriceMinor: NonNegativeMoney,
  taxRate: Ratio,
}).strict();
export const QuoteVersionV1 = z.object({
  quoteId: Uuid,
  quoteVersionId: Uuid,
  supplierPartyId: Uuid,
  recipientPartyId: Uuid.nullable(),
  currency: Currency,
  lines: z.array(QuoteLine).min(1).max(200),
  terms: z.string().trim().min(1).max(10_000),
  expiresAt: Instant.nullable(),
  version: Version,
  state: z.enum(["draft", "sent"]),
  sentAt: Instant.nullable(),
  predecessorVersionId: Uuid.nullable(),
  digest: Sha256,
}).strict().superRefine((v, ctx) => {
  if ((v.state === "sent") !== (v.sentAt !== null))
    ctx.addIssue({ code: "custom", path: ["sentAt"], message: "required_only_when_sent" });
});
export const QuoteVersionRequest = z.object({
  action: z.enum(["save_draft", "send"]),
  quoteId: Uuid.nullable(),
  recipientPartyId: Uuid.nullable(),
  recipientDeliveryRef: Uuid.nullable(),
  currency: Currency,
  lines: z.array(QuoteLine).min(1).max(200),
  terms: z.string().trim().min(1).max(10_000),
  expiresAt: Instant.nullable(),
}).strict().superRefine((v, ctx) => {
  if (v.action === "send" && v.recipientPartyId === null && v.recipientDeliveryRef === null)
    ctx.addIssue({ code: "custom", path: ["recipientDeliveryRef"], message: "recipient_required_for_send" });
});
export const QuoteVersionResult = z.object({
  quote: QuoteVersionV1,
  publicUrl: Url.nullable(),
  replayed: z.boolean(),
}).strict().refine(v => (v.quote.state === "sent") === (v.publicUrl !== null), {
  message: "public_url_required_only_for_sent_version",
});

const InvoiceLine = QuoteLine.extend({
  serviceDate: DateOnly.nullable(),
}).strict();
export const InvoiceInstrumentV1 = z.object({
  invoiceId: Uuid,
  issuerPartyId: Uuid,
  customerPartyId: Uuid.nullable(),
  number: z.string().min(1).max(80),
  currency: Currency,
  lines: z.array(InvoiceLine).min(1).max(500),
  subtotalMinor: NonNegativeMoney,
  taxMinor: NonNegativeMoney,
  totalMinor: NonNegativeMoney,
  issueDate: DateOnly,
  dueDate: DateOnly,
  sourceQuoteVersionId: Uuid.nullable(),
  purchaseOrderRef: z.string().trim().min(1).max(200).nullable(),
  deliveryEvidenceRef: Uuid.nullable(),
  digest: Sha256,
  state: z.literal("issued"),
}).strict().superRefine((v, ctx) => {
  if (v.subtotalMinor + v.taxMinor !== v.totalMinor)
    ctx.addIssue({ code: "custom", path: ["totalMinor"], message: "subtotal_plus_tax_must_equal_total" });
  if (v.issueDate > v.dueDate)
    ctx.addIssue({ code: "custom", path: ["dueDate"], message: "due_date_before_issue_date" });
});
export const InvoiceIssuanceRequest = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("issue"),
    issuerPartyId: Uuid,
    customerPartyId: Uuid.nullable(),
    customerFiscalRef: Uuid,
    currency: Currency,
    lines: z.array(InvoiceLine).min(1).max(500),
    issueDate: DateOnly,
    dueDate: DateOnly,
    sourceQuoteVersionId: Uuid.nullable(),
    purchaseOrderRef: z.string().trim().min(1).max(200).nullable(),
    deliveryEvidenceRef: Uuid.nullable(),
    numberingPolicyVersion: z.string().min(1).max(100),
  }).strict(),
  z.object({
    action: z.literal("credit"),
    issuerPartyId: Uuid,
    invoiceId: Uuid,
    reasonCode: z.enum(["pricing_error", "tax_error", "cancellation", "partial_refund"]),
    creditedSubtotalMinor: NonNegativeMoney,
    creditedTaxMinor: NonNegativeMoney,
    issueDate: DateOnly,
    numberingPolicyVersion: z.string().min(1).max(100),
  }).strict(),
]);
export const InvoiceIssuanceResult = z.discriminatedUnion("instrumentKind", [
  z.object({ instrumentKind: z.literal("invoice"), invoice: InvoiceInstrumentV1, publicUrl: Url }).strict(),
  z.object({
    instrumentKind: z.literal("credit_note"),
    creditNoteId: Uuid,
    invoiceId: Uuid,
    number: z.string().min(1).max(80),
    totalMinor: NonNegativeMoney,
    issuedAt: Instant,
    digest: Sha256,
    publicUrl: Url,
  }).strict(),
]);

export const DunningDecisionV1 = z.object({
  decisionId: Uuid,
  invoiceId: Uuid,
  ladderStep: z.int().min(0).max(20),
  paymentState: z.enum(["unpaid", "paid", "uncertain"]),
  deliveryState: z.enum(["deliverable", "failed", "unknown"]),
  exclusion: z.enum(["none", "counterparty", "owner_paused", "dispute"]),
  policyVersion: z.string().min(1).max(100),
  decision: z.enum(["send", "hold", "skip"]),
  reasonCode: z.enum(["due", "paid", "payment_uncertain", "excluded", "delivery_failed", "not_due"]),
  decidedAt: Instant,
}).strict().superRefine((v, ctx) => {
  if (v.decision === "send" &&
      (v.paymentState !== "unpaid" || v.deliveryState !== "deliverable" || v.exclusion !== "none"))
    ctx.addIssue({ code: "custom", path: ["decision"], message: "send_requires_certain_unpaid_deliverable_unexcluded" });
  if ((v.decision === "send") !== (v.reasonCode === "due"))
    ctx.addIssue({ code: "custom", path: ["reasonCode"], message: "due_reason_required_only_for_send" });
});
export const DunningRequest = z.object({
  invoiceId: Uuid,
  asOf: Instant,
  observedInvoiceVersion: Version,
  paymentState: z.enum(["unpaid", "paid", "uncertain"]),
  deliveryState: z.enum(["deliverable", "failed", "unknown"]),
  exclusion: z.enum(["none", "counterparty", "owner_paused", "dispute"]),
  ladderStep: z.int().min(0).max(20),
  policyVersion: z.string().min(1).max(100),
}).strict();
export const DunningResult = z.object({
  decision: DunningDecisionV1,
  notificationJobId: Uuid.nullable(),
  replayed: z.boolean(),
}).strict().refine(v => (v.decision.decision === "send") === (v.notificationJobId !== null), {
  message: "notification_job_required_only_for_send",
});
~~~

### Fixed-read pagination and collection bounds

| Operation | Pagination | Exact returned-collection bounds |
|---|---|---|
| 41.03 | Pagination N/A: this GET returns one resolved-or-unresolved FX projection for the named income event; strict `FxProjectionParams` parsing rejects cursor, offset, page, limit, sort, and filter keys. | `FxProjectionResult` and both `FxProjectionV1` branches contain no returned collections. |

### Header and cross-field rules

| Op | Deterministic rule |
|---|---|
| 41.01 | Signature timestamp skew is at most 300 seconds; sourceShard must equal authenticated service grant; sourceEventId is immutable and unique within sourceShard |
| 41.02 | Imports force trustClass declared; commit must reference an unexpired preview by the same holder and identical canonical row hash |
| 41.03 | One projection uses one rate/date/source for gross, deductions, and net; missing rate returns a domain conflict rather than zero |
| 41.04 | Included ledger version must still match under lock; any unresolved duplicate, net-only verified claim, or FX row blocks issuance |
| 41.05 | If-Match is required; authenticated holder is derived server-side; revoked credit changes attribution to degraded rather than deleting income |
| 41.06 | capture requires a clean holder-owned upload and omits If-Match; confirm_extraction requires If-Match and appends a human-confirmed evidence successor; OCR cannot self-confirm |
| 41.07 | Exact jurisdiction/year rule pack must be active; unsupported combinations fail closed and issue no approximate pack |
| 41.08 | deadlineSource must be explicit; ready_for_external_filing means evidence prepared, never submitted |
| 41.09 | quoteId=null creates the stable quote and omits If-Match; an existing quote requires If-Match; sent versions are immutable successors and expiresAt is advisory |
| 41.10 | Fiscal fields and numbering lock are checked inside one serializable transaction; correction can only create credit_note |
| 41.11 | Counterparty exclusion, paid, uncertain payment, or non-deliverable state always wins over ladder due state |

### Contract examples

| Op | Minimal valid semantic example |
|---|---|
| 41.01 | kind=income, sourceShard=18, complete USD components, trustClass=verified |
| 41.02 | mode=preview, sourceKind=manual, one net-only declared row |
| 41.03 | reportingCurrency=GBP, rateDate=2026-08-28, sourceClass=accounting |
| 41.04 | period 2026-01-01 through 2026-03-31, GBP, expectedLedgerVersion=12 |
| 41.05 | action=link, candidateType=work, holder_selected evidence |
| 41.06 | action=capture with clean receipt, then action=confirm_extraction with If-Match and proposal version |
| 41.07 | jurisdictionCode=GB, taxYear=2026, issue=true |
| 41.08 | territoryCode=US, authority_published deadline, state=preparing |
| 41.09 | quoteId=null, action=send, one quote line, recipientDeliveryRef present |
| 41.10 | action=issue, one line, dueDate not before issueDate |
| 41.11 | unpaid, deliverable, exclusion=none may result in send only when due |

## Authorization, Ownership, and Disclosure

### Role-to-operation policy

| Actor | Allowed operations | Ownership and limits |
|---|---|---|
| Source service principal | 41.01 only | Exact sourceShard grant; cannot import, issue, view documents, or assign trust beyond emitter grant |
| Holder/entity owner | 41.02–41.10; own results of 41.01 | Own party records; step-up for statements, tax packs, sent quotes, invoices, and exports |
| Accountant/bookkeeper delegate | 41.02–41.08 within mandate | Named holder, scopes, period, and expiry; issuer/holder remains principal party |
| Quote/invoice delegate | 41.09–41.10 within document mandate | Cannot change supplier/issuer identity or numbering/tax policy |
| Scheduler service | 41.11 only | Signed schedule assertion and invoice partition; cannot override owner or counterparty exclusion |
| Quote/invoice/report recipient | Signed rendered artifact only | No account API access; opaque capability reveals one immutable artifact |
| Support/admin | Purpose-bound mechanical recovery | Cannot change trust, fiscal instrument, payment fact, tax conclusion, or dunning exclusion |

Manager/commission-beneficiary and band-member rights defined by IA are not used by 41a unless they separately hold an explicit finance mandate. Acting party, service, and delegation are always derived from verified context, never request actor fields.

### 403 versus 404

- A caller authorized to know a resource exists but lacking the requested action receives 403 FORBIDDEN with a safe reasonCode.
- A caller lacking resource visibility receives the same 404 NOT_FOUND body, headers, timing bucket, and query shape as true absence.
- Invalid or expired public capability returns indistinguishable 404; it never reveals holder, counterparty, invoice, quote, or snapshot existence.
- Internal source mismatch returns 403 only after service authentication; unauthenticated services receive 401.
- Step-up absence is 401 STEP_UP_REQUIRED only after base authorization confirms visibility.
- Tests compare absent and concealed cases for status, ApiError details={}, cache headers, body length class, and latency envelope.

### Security and privacy invariants

- Financial PII, receipt contents, fiscal identities, public-link secrets, and delivery targets remain in restricted schema/storage; events and logs carry IDs/digests only.
- Public tokens are 256-bit random capabilities stored only as keyed hashes; raw tokens appear once in the returned URL, never logs, analytics, database, or events.
- CSV formula injection is neutralized on export; uploads are MIME-sniffed, size-limited, quarantined, scanned, and bound by digest through BE00.
- No route accepts bank/card credentials, performs custody, executes invoice payment, files tax forms, or asserts professional conclusions.
- Tenant ID is transaction-local and cleared on release; RLS remains enabled for owner, delegate, worker, support, and maintenance paths.
- Generated artifacts are encrypted, signed by digest, have controlled retention, and require step-up to regenerate or extend access.

## Database Schema

All domain rows live in restricted schema finance_private. Public API roles have no direct table access. Party FKs target platform_private.party(id); producer-owned resource IDs are validated through typed service calls and retained as logical references rather than cross-domain FKs.

### Exhaustive typed table definitions

~~~sql
CREATE TABLE finance_private.income_event (
  id uuid PRIMARY KEY,
  holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  source_shard text NOT NULL CHECK (source_shard IN ('14','18','26','28','31','import')),
  source_event_id text NOT NULL CHECK (length(source_event_id) BETWEEN 1 AND 200),
  occurred_at timestamptz NOT NULL,
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  gross_minor bigint NOT NULL,
  deductions_minor bigint NULL CHECK (deductions_minor IS NULL OR deductions_minor >= 0),
  net_minor bigint NOT NULL,
  completeness text NOT NULL CHECK (completeness IN ('complete','net_only')),
  trust_class text NOT NULL CHECK (trust_class IN ('verified','observed','declared')),
  provenance_digest text NOT NULL CHECK (provenance_digest ~ '^[a-f0-9]{64}$'),
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((completeness='complete' AND deductions_minor IS NOT NULL AND gross_minor-deductions_minor=net_minor)
      OR (completeness='net_only' AND deductions_minor IS NULL AND gross_minor=net_minor)),
  CHECK (source_shard <> 'import' OR trust_class = 'declared'),
  UNIQUE (source_shard, source_event_id)
);

CREATE TABLE finance_private.income_work_attribution (
  id uuid PRIMARY KEY,
  income_event_id uuid NOT NULL REFERENCES finance_private.income_event(id),
  holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  candidate_type text NOT NULL CHECK (candidate_type IN ('work','credit')),
  candidate_id uuid NOT NULL,
  evidence_code text NOT NULL CHECK (evidence_code IN ('holder_selected','source_reference','credit_match')),
  state text NOT NULL CHECK (state IN ('attributed','unlinked','degraded_credit_revoked')),
  version bigint NOT NULL CHECK (version > 0),
  supersedes_attribution_id uuid NULL REFERENCES finance_private.income_work_attribution(id),
  created_by_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (income_event_id, version)
);

CREATE TABLE finance_private.income_reversal (
  id uuid PRIMARY KEY,
  holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  original_income_event_id uuid NULL REFERENCES finance_private.income_event(id),
  original_source_event_id text NOT NULL CHECK (length(original_source_event_id) BETWEEN 1 AND 200),
  source_shard text NOT NULL CHECK (source_shard IN ('14','18','26','28','31')),
  source_event_id text NOT NULL CHECK (length(source_event_id) BETWEEN 1 AND 200),
  reason_code text NOT NULL CHECK (reason_code IN ('refund','chargeback','void','source_correction')),
  occurred_at timestamptz NOT NULL,
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  gross_minor bigint NOT NULL,
  deductions_minor bigint NULL CHECK (deductions_minor IS NULL OR deductions_minor >= 0),
  net_minor bigint NOT NULL,
  completeness text NOT NULL CHECK (completeness IN ('complete','net_only')),
  state text NOT NULL CHECK (state IN ('applied','parked_predecessor_missing')),
  provenance_digest text NOT NULL CHECK (provenance_digest ~ '^[a-f0-9]{64}$'),
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_shard, source_event_id),
  CHECK ((completeness='complete' AND deductions_minor IS NOT NULL AND gross_minor-deductions_minor=net_minor)
      OR (completeness='net_only' AND deductions_minor IS NULL AND gross_minor=net_minor)),
  CHECK ((state='applied') = (original_income_event_id IS NOT NULL))
);

CREATE TABLE finance_private.income_reconciliation_case (
  id uuid PRIMARY KEY,
  holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  import_batch_id uuid NULL,
  imported_income_event_id uuid NULL REFERENCES finance_private.income_event(id),
  candidate_income_event_id uuid NULL REFERENCES finance_private.income_event(id),
  candidate_source_shard text NULL CHECK (candidate_source_shard IS NULL OR length(candidate_source_shard) BETWEEN 1 AND 16),
  candidate_source_event_id text NULL CHECK (candidate_source_event_id IS NULL OR length(candidate_source_event_id) BETWEEN 1 AND 200),
  reason_code text NOT NULL CHECK (reason_code IN ('same_reference','amount_date_similarity','predecessor_missing')),
  decision text NULL CHECK (decision IN ('keep_both','exclude_import','apply_reversal')),
  decided_by_party_id uuid NULL REFERENCES platform_private.party(id),
  decided_at timestamptz NULL,
  state text NOT NULL CHECK (state IN ('open','resolved','expired')),
  evidence_digest text NOT NULL CHECK (evidence_digest ~ '^[a-f0-9]{64}$'),
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((decision IS NULL) = (decided_at IS NULL)),
  CHECK ((decision IS NULL) = (decided_by_party_id IS NULL))
);

CREATE TABLE finance_private.fx_projection (
  id uuid PRIMARY KEY,
  holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  income_event_id uuid NOT NULL REFERENCES finance_private.income_event(id),
  native_currency char(3) NOT NULL CHECK (native_currency ~ '^[A-Z]{3}$'),
  reporting_currency char(3) NOT NULL CHECK (reporting_currency ~ '^[A-Z]{3}$'),
  rate numeric(24,12) NULL CHECK (rate IS NULL OR rate > 0),
  rate_date date NOT NULL,
  source_class text NOT NULL CHECK (source_class IN ('estimated','accounting','provider_actual')),
  rate_source_version text NULL CHECK (rate_source_version IS NULL OR length(rate_source_version) BETWEEN 1 AND 100),
  converted_gross_minor bigint NULL,
  converted_deductions_minor bigint NULL,
  converted_net_minor bigint NULL,
  state text NOT NULL CHECK (state IN ('resolved','unresolved')),
  supersedes_projection_id uuid NULL REFERENCES finance_private.fx_projection(id),
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((state='resolved') = (rate IS NOT NULL AND rate_source_version IS NOT NULL
    AND converted_gross_minor IS NOT NULL AND converted_net_minor IS NOT NULL)),
  CHECK (state='resolved' OR (rate IS NULL AND rate_source_version IS NULL
    AND converted_gross_minor IS NULL AND converted_deductions_minor IS NULL AND converted_net_minor IS NULL)),
  UNIQUE (income_event_id, reporting_currency, rate_date, source_class, version)
);

CREATE TABLE finance_private.financial_snapshot (
  id uuid PRIMARY KEY,
  holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  kind text NOT NULL CHECK (kind IN ('income_statement','tax_pack')),
  period_from date NOT NULL,
  period_through date NOT NULL CHECK (period_through >= period_from),
  reporting_currency char(3) NOT NULL CHECK (reporting_currency ~ '^[A-Z]{3}$'),
  included_income_event_ids uuid[] NOT NULL CHECK (cardinality(included_income_event_ids) BETWEEN 1 AND 100000),
  included_ledger_version bigint NOT NULL CHECK (included_ledger_version > 0),
  verified_gross_minor bigint NOT NULL,
  verified_net_minor bigint NOT NULL,
  declared_gross_minor bigint NOT NULL,
  declared_net_minor bigint NOT NULL,
  exception_codes text[] NOT NULL DEFAULT '{}',
  issued_by_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  issued_at timestamptz NOT NULL,
  supersedes_snapshot_id uuid NULL REFERENCES finance_private.financial_snapshot(id),
  digest text NOT NULL UNIQUE CHECK (digest ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE finance_private.verification_page (
  id uuid PRIMARY KEY,
  snapshot_id uuid NOT NULL REFERENCES finance_private.financial_snapshot(id),
  holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  token_digest text NOT NULL UNIQUE CHECK (token_digest ~ '^[a-f0-9]{64}$'),
  artifact_ref uuid NOT NULL,
  artifact_digest text NOT NULL CHECK (artifact_digest ~ '^[a-f0-9]{64}$'),
  state text NOT NULL CHECK (state IN ('active','expired','revoked')),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((state='revoked') = (revoked_at IS NOT NULL))
);

CREATE TABLE finance_private.expense_event (
  id uuid PRIMARY KEY,
  holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  occurred_on date NOT NULL,
  native_amount_minor bigint NOT NULL CHECK (native_amount_minor >= 0),
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  supplier_label text NOT NULL CHECK (length(supplier_label) BETWEEN 1 AND 160),
  confirmed_category text NULL CHECK (confirmed_category IS NULL OR length(confirmed_category) BETWEEN 1 AND 80),
  project_tag_id uuid NULL,
  tag_state text NOT NULL CHECK (tag_state IN ('untagged','tagged','invalidated')),
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((tag_state='tagged') = (project_tag_id IS NOT NULL))
);

CREATE TABLE finance_private.receipt_evidence (
  id uuid PRIMARY KEY,
  holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  expense_event_id uuid NOT NULL REFERENCES finance_private.expense_event(id),
  storage_object_ref uuid NOT NULL,
  evidence_digest text NOT NULL CHECK (evidence_digest ~ '^[a-f0-9]{64}$'),
  media_type text NOT NULL CHECK (media_type IN ('application/pdf','image/jpeg','image/png','image/webp')),
  category_proposal text NULL CHECK (category_proposal IS NULL OR length(category_proposal) BETWEEN 1 AND 80),
  extraction_payload jsonb NULL CHECK (extraction_payload IS NULL OR jsonb_typeof(extraction_payload)='object'),
  extraction_state text NOT NULL CHECK (extraction_state IN ('not_requested','queued','proposed','failed','confirmed')),
  confirmed_by_party_id uuid NULL REFERENCES platform_private.party(id),
  confirmed_at timestamptz NULL,
  supersedes_receipt_evidence_id uuid NULL REFERENCES finance_private.receipt_evidence(id),
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((extraction_state='confirmed') = (confirmed_by_party_id IS NOT NULL AND confirmed_at IS NOT NULL)),
  UNIQUE (expense_event_id, evidence_digest, version)
);

CREATE TABLE finance_private.tax_rule_pack (
  id uuid PRIMARY KEY,
  jurisdiction_code text NOT NULL CHECK (jurisdiction_code ~ '^[A-Z]{2}(-[A-Z0-9]{1,3})?$'),
  tax_year integer NOT NULL CHECK (tax_year BETWEEN 2000 AND 2200),
  rule_version text NOT NULL CHECK (length(rule_version) BETWEEN 1 AND 100),
  rules_digest text NOT NULL CHECK (rules_digest ~ '^[a-f0-9]{64}$'),
  effective_from date NOT NULL,
  effective_through date NULL CHECK (effective_through IS NULL OR effective_through >= effective_from),
  state text NOT NULL CHECK (state IN ('draft','active','retired')),
  approved_by_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (jurisdiction_code, tax_year, rule_version)
);

CREATE TABLE finance_private.tax_pack (
  id uuid PRIMARY KEY,
  holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  snapshot_id uuid NOT NULL REFERENCES finance_private.financial_snapshot(id),
  tax_rule_pack_id uuid NOT NULL REFERENCES finance_private.tax_rule_pack(id),
  jurisdiction_code text NOT NULL CHECK (jurisdiction_code ~ '^[A-Z]{2}(-[A-Z0-9]{1,3})?$'),
  tax_year integer NOT NULL CHECK (tax_year BETWEEN 2000 AND 2200),
  reporting_currency char(3) NOT NULL CHECK (reporting_currency ~ '^[A-Z]{3}$'),
  exception_codes text[] NOT NULL DEFAULT '{}',
  artifact_ref uuid NOT NULL,
  artifact_digest text NOT NULL UNIQUE CHECK (artifact_digest ~ '^[a-f0-9]{64}$'),
  state text NOT NULL CHECK (state IN ('issued','superseded')),
  issued_by_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  issued_at timestamptz NOT NULL,
  supersedes_tax_pack_id uuid NULL REFERENCES finance_private.tax_pack(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE finance_private.withholding_reclaim_record (
  id uuid PRIMARY KEY,
  holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  income_event_id uuid NOT NULL REFERENCES finance_private.income_event(id),
  territory_code text NOT NULL CHECK (territory_code ~ '^[A-Z]{2}(-[A-Z0-9]{1,3})?$'),
  deduction_minor bigint NOT NULL CHECK (deduction_minor >= 0),
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  deadline date NOT NULL,
  deadline_source text NOT NULL CHECK (deadline_source IN ('authority_published','contract_confirmed','user_confirmed')),
  checklist jsonb NOT NULL CHECK (jsonb_typeof(checklist)='array' AND jsonb_array_length(checklist) <= 100),
  state text NOT NULL CHECK (state IN ('preparing','ready_for_external_filing','closed')),
  files_nothing boolean NOT NULL DEFAULT true CHECK (files_nothing),
  version bigint NOT NULL CHECK (version > 0),
  created_by_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (income_event_id, territory_code, version)
);

CREATE TABLE finance_private.quote (
  id uuid PRIMARY KEY,
  supplier_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  current_version bigint NOT NULL CHECK (current_version > 0),
  state text NOT NULL CHECK (state IN ('draft','sent','superseded','accepted','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE finance_private.quote_version (
  id uuid PRIMARY KEY,
  quote_id uuid NOT NULL REFERENCES finance_private.quote(id),
  supplier_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  recipient_party_id uuid NULL REFERENCES platform_private.party(id),
  recipient_delivery_ref uuid NULL,
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  lines jsonb NOT NULL CHECK (jsonb_typeof(lines)='array' AND jsonb_array_length(lines) BETWEEN 1 AND 200),
  terms text NOT NULL CHECK (length(terms) BETWEEN 1 AND 10000),
  expires_at timestamptz NULL,
  version bigint NOT NULL CHECK (version > 0),
  state text NOT NULL CHECK (state IN ('draft','sent')),
  sent_at timestamptz NULL,
  predecessor_version_id uuid NULL REFERENCES finance_private.quote_version(id),
  public_token_digest text NULL UNIQUE CHECK (public_token_digest IS NULL OR public_token_digest ~ '^[a-f0-9]{64}$'),
  digest text NOT NULL UNIQUE CHECK (digest ~ '^[a-f0-9]{64}$'),
  created_by_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((state='sent') = (sent_at IS NOT NULL AND public_token_digest IS NOT NULL))
);

CREATE TABLE finance_private.invoice (
  id uuid PRIMARY KEY,
  issuer_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  customer_party_id uuid NULL REFERENCES platform_private.party(id),
  customer_fiscal_ref uuid NOT NULL,
  number text NOT NULL CHECK (length(number) BETWEEN 1 AND 80),
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  lines jsonb NOT NULL CHECK (jsonb_typeof(lines)='array' AND jsonb_array_length(lines) BETWEEN 1 AND 500),
  subtotal_minor bigint NOT NULL CHECK (subtotal_minor >= 0),
  tax_minor bigint NOT NULL CHECK (tax_minor >= 0),
  total_minor bigint NOT NULL CHECK (total_minor = subtotal_minor + tax_minor),
  issue_date date NOT NULL,
  due_date date NOT NULL CHECK (due_date >= issue_date),
  source_quote_version_id uuid NULL REFERENCES finance_private.quote_version(id),
  purchase_order_ref text NULL CHECK (purchase_order_ref IS NULL OR length(purchase_order_ref) BETWEEN 1 AND 200),
  delivery_evidence_ref uuid NULL,
  numbering_policy_version text NOT NULL CHECK (length(numbering_policy_version) BETWEEN 1 AND 100),
  state text NOT NULL DEFAULT 'issued' CHECK (state='issued'),
  public_token_digest text NOT NULL UNIQUE CHECK (public_token_digest ~ '^[a-f0-9]{64}$'),
  digest text NOT NULL UNIQUE CHECK (digest ~ '^[a-f0-9]{64}$'),
  issued_by_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  issued_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer_party_id, number)
);

CREATE TABLE finance_private.credit_note (
  id uuid PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES finance_private.invoice(id),
  issuer_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  number text NOT NULL CHECK (length(number) BETWEEN 1 AND 80),
  reason_code text NOT NULL CHECK (reason_code IN ('pricing_error','tax_error','cancellation','partial_refund')),
  credited_subtotal_minor bigint NOT NULL CHECK (credited_subtotal_minor >= 0),
  credited_tax_minor bigint NOT NULL CHECK (credited_tax_minor >= 0),
  credited_total_minor bigint NOT NULL CHECK (credited_total_minor = credited_subtotal_minor + credited_tax_minor),
  issue_date date NOT NULL,
  numbering_policy_version text NOT NULL CHECK (length(numbering_policy_version) BETWEEN 1 AND 100),
  public_token_digest text NOT NULL UNIQUE CHECK (public_token_digest ~ '^[a-f0-9]{64}$'),
  digest text NOT NULL UNIQUE CHECK (digest ~ '^[a-f0-9]{64}$'),
  issued_by_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  issued_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer_party_id, number)
);

CREATE TABLE finance_private.receivable_event (
  id uuid PRIMARY KEY,
  holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  invoice_id uuid NULL REFERENCES finance_private.invoice(id),
  income_event_id uuid NULL REFERENCES finance_private.income_event(id),
  kind text NOT NULL CHECK (kind IN ('delivery','payment_observation','dunning_decision','dunning_delivery')),
  occurred_at timestamptz NOT NULL,
  state text NOT NULL CHECK (length(state) BETWEEN 1 AND 64),
  confidence text NULL CHECK (confidence IN ('certain','uncertain')),
  ladder_step integer NULL CHECK (ladder_step BETWEEN 0 AND 20),
  exclusion text NULL CHECK (exclusion IN ('none','counterparty','owner_paused','dispute')),
  policy_version text NULL CHECK (policy_version IS NULL OR length(policy_version) BETWEEN 1 AND 100),
  evidence_digest text NOT NULL CHECK (evidence_digest ~ '^[a-f0-9]{64}$'),
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (invoice_id IS NOT NULL OR income_event_id IS NOT NULL)
);
~~~

Rows called immutable reject UPDATE/DELETE through triggers except legal-hold metadata maintained in a separate platform table. Reversals, credit notes, superseding snapshots, quote versions, and receivable events are the only correction paths.

### Indexes, RLS, and grants

| Tables | Required query indexes | RLS predicate | Grants |
|---|---|---|---|
| income_event, income_reversal | (holder_party_id, occurred_at DESC, id); unique source key; original event | holder or scoped ledger delegate; source service insert only for own sourceShard | finance_api SELECT/INSERT through security-definer commands; no UPDATE/DELETE; finance_worker SELECT |
| income_work_attribution | (income_event_id, version DESC); (holder_party_id, state, created_at DESC); (candidate_type, candidate_id) | holder only; follows visible immutable income_event | finance_api SELECT/INSERT through command; projection worker may append degraded successor; no UPDATE/DELETE |
| income_reconciliation_case | (holder_party_id, state, created_at); import_batch_id; candidate IDs | holder/delegate; support only with active purpose grant | finance_api SELECT/UPDATE decision columns through command; finance_worker INSERT |
| fx_projection | unique projection key; (holder_party_id, reporting_currency, rate_date DESC); supersedes ID | follows visible income_event holder | finance_api SELECT; finance_worker SELECT/INSERT; no user mutation |
| financial_snapshot, verification_page | (holder_party_id, issued_at DESC); snapshot_id; token_digest unique; (state, expires_at) | holder/delegate; token lookup via isolated constant-time function | finance_api SELECT/INSERT command only; public_renderer EXECUTE token function only |
| expense_event, receipt_evidence | (holder_party_id, occurred_on DESC); project tag; expense_event_id; digest | holder or scoped expense/tax delegate | finance_api SELECT/INSERT and command UPDATE; ocr_worker SELECT clean object ref and INSERT proposal only |
| tax_rule_pack, tax_pack | unique jurisdiction/year/version; (state, effective dates); (holder_party_id, tax_year DESC) | rule pack service-readable; tax pack holder/named tax delegate | settings_worker manages rule packs; finance_api tax-pack command; renderer read by artifact ref |
| withholding_reclaim_record | (holder_party_id, deadline, state); (income_event_id, territory_code, version DESC) | holder or scoped tax delegate; follows visible income_event | finance_api command SELECT/INSERT/UPDATE through versioned function; no filing-provider grant |
| quote, quote_version | (supplier_party_id, updated_at DESC); (quote_id, version DESC); public token unique | supplier or quote delegate; token function returns one version | finance_api command EXECUTE; delivery_worker artifact-only |
| invoice, credit_note | unique issuer/number; (issuer_party_id, issue_date DESC); customer party; invoice_id | issuer or invoice delegate; token function returns one instrument | finance_api command EXECUTE; no UPDATE/DELETE; renderer artifact-only |
| receivable_event | (invoice_id, occurred_at DESC); (holder_party_id, kind, occurred_at DESC); (income_event_id, kind) | holder/delegate; scheduler partition grant for dunning | finance_api SELECT/INSERT command; dunning_worker SELECT/INSERT constrained function |

Every table has ENABLE ROW LEVEL SECURITY and FORCE ROW LEVEL SECURITY. Policies use transaction-local app.party_id, app.mandate_id, app.service_id, and app.purpose_grant_id; absent context denies. Owner/delegate policies join indexed grant tables. Table ownership is migration_role; anon/authenticated/service roles receive no direct DML. SECURITY DEFINER functions pin search_path, validate tenant context, set row_security=on, and revoke PUBLIC EXECUTE.

### Retention and deletion

- Issued statements, tax packs, quotes, invoices, credit notes, income facts, and audit evidence follow configured fiscal/legal retention and legal holds; deletion requests deidentify optional labels where lawful without falsifying history.
- Draft imports expire after 30 days; unresolved preview payloads after 7 days; raw CSV staging follows BE00 upload expiry.
- FX estimates may be compacted after supersession while retaining rate/date/source/version and snapshot-linked projections.
- Receipt blobs follow tax-record retention; OCR transient payload is removed within 30 days after confirmation or failure.
- Public capabilities revoke immediately; digests and access audit remain. Expiry workers are idempotent.
- Dunning delivery bodies are not stored in events; provider receipt IDs and safe status persist for the invoice retention period.

## State Machines and Deterministic Invariants

| Aggregate | States and permitted transitions | Forbidden/recovery behavior |
|---|---|---|
| Income event and attribution | income_event append-only; imported rows are declared; separate attribution projection transitions unlinked → attributed → degraded/unlinked | Trust/source money cannot change; correction is IncomeReversalV1; attribution change appends a successor; predecessor-missing reversal parks |
| Reconciliation case | open → resolved or expired | No automatic merge; resolution is explicit and auditable |
| FX projection | unresolved → resolved; estimate → additive accounting/provider_actual successor | Native values never mutate; no zero/default rate |
| Financial snapshot | issued → superseded | Draft is built transactionally but not exposed; issued snapshot never updates |
| Receipt extraction | not_requested → queued → proposed/failed → confirmed | OCR cannot confirm; failed retains clean evidence for manual entry |
| Tax pack | transactional build → issued → superseded | Unsupported jurisdiction/year or blocker produces no issued row/artifact |
| Quote | draft → sent → successor draft/sent → accepted/closed | Sent version immutable; expiry warns only |
| Invoice | sequence reserved in transaction → issued → partially_credited/fully_credited | No draft with number; no in-place correction; total credits cannot exceed invoice |
| Dunning | not_due/due → send/hold/skip → delivered/failed | Paid, uncertain, excluded, disputed, or failed delivery blocks later sends until new certain evidence |

Locks are acquired in order holder aggregate → source/numbering key → document aggregate → idempotency record. Commands compare expected revision under lock, then commit row, outbox event/job, audit, and idempotency result atomically. Serializable retry is limited to two database retries with 25 ms then 75 ms jittered backoff; exhaustion returns 409 CONFLICT and no partial effect.

## Middleware and Policies

Middleware order is BE00 request ID → trusted proxy normalization → security headers → CORS → body limit → authentication → CSRF for credentialed writes → rate limit → strict validation → tenant/delegation authorization → step-up → idempotency/version → transaction → handler → response validation → audit/metrics.

| Op | CORS | Auth and authorization | Rate | Validation/idempotency |
|---|---|---|---|---|
| 41.01 | service-no-origin | mTLS/service JWT; sourceShard grant | 600/min/source | 256 KiB JSON; signature; required idempotency |
| 41.02 | first-party-write | holder or finance-import mandate | 20/min/holder | 2 MiB JSON or uploadRef; required idempotency |
| 41.03 | first-party-read | visible holder ledger | 120/min/holder | strict path/query; rejects idempotency header |
| 41.04 | first-party-write | holder/named delegate plus recent step-up | 6/hour/holder | 64 KiB; required idempotency and ledger version |
| 41.05 | first-party-write | holder only | 30/min/holder | 32 KiB; If-Match plus idempotency |
| 41.06 | first-party-write | holder/expense mandate | 60/min/holder | 64 KiB; clean upload on capture; conditional If-Match; idempotency |
| 41.07 | first-party-write | holder/tax mandate plus recent step-up | 4/hour/holder | 64 KiB; exact rule lookup; idempotency |
| 41.08 | first-party-write | holder/tax mandate | 30/min/holder | 128 KiB; If-Match plus idempotency |
| 41.09 | first-party-write | supplier/quote mandate; step-up on send | 30/min/supplier | 256 KiB; conditional If-Match plus idempotency |
| 41.10 | first-party-write | issuer/invoice mandate plus recent step-up | 20/min/issuer | 512 KiB; discriminated body; idempotency |
| 41.11 | service-no-origin | scheduler JWT and partition grant | 300/min/service | 64 KiB; assertion; required idempotency |

Rate exhaustion returns BE00 ApiError code RATE_LIMITED with exact Retry-After and RateLimit headers. Idempotency reuse with another canonical hash returns 409 IDEMPOTENCY_MISMATCH; same hash returns byte-equivalent status/body and no repeated event, number allocation, render, or notification.

## Data Flow, Concurrency, and External Seams

### Operation flows

| Op | Transactional flow and recovery |
|---|---|
| 41.01 | Verify signature/source → canonicalize → lock source key → replay or append → if reversal lookup predecessor and park when absent → outbox event → commit; resolver later applies parked reversal exactly once |
| 41.02 | Preview validates rows and stores digest/overlaps → commit locks preview and ledger → verifies holder/hash/expiry/decisions → appends only included declared rows and outbox events → expires preview |
| 41.03 | Authorize event → read immutable native row → lookup exact rate → return/store unresolved or compute every component with one rate and currency rounding → append projection |
| 41.04 | Step-up → lock holder ledger version → prove no open blocker and complete FX → freeze exact event/projection IDs → insert snapshot and capability digest → render artifact → publish outbox; render failure rolls back issuance |
| 41.05 | Lock event/latest attribution → compare If-Match → validate candidate through owner shard → append attribution successor only → audit; candidate revoke later appends a degraded successor idempotently |
| 41.06 | Capture validates clean upload then inserts expense/evidence and optional OCR job; confirmation locks latest proposal/If-Match and appends a confirmed receipt_evidence successor; failures preserve original evidence |
| 41.07 | Lock ledger version → exact active rule lookup → validate reconciled inputs → snapshot inputs → render artifact → insert tax pack/outbox; any exception before commit leaves no issued pack |
| 41.08 | Lock latest reclaim event/version → validate deduction/deadline/checklist → append new receivable_event → schedule alert → commit; alert failure remains explicit and retryable |
| 41.09 | Create quote when quoteId=null or lock existing quote/version and compare If-Match → insert immutable version → on send create token digest and transactional delivery job → commit; failed send remains explicit without deleting version |
| 41.10 | Lock issuer numbering sequence → validate fiscal ref and totals → allocate number → insert invoice or credit note, receivable event, capability, outbox → commit; render retries from digest |
| 41.11 | Lock invoice/latest receivable evidence → re-evaluate payment/exclusion/delivery under lock → append decision and optional notification job → commit; provider result appends delivery event |

### External integration seams

| Seam | Exact request → response | Timeout/retry/circuit contract |
|---|---|---|
| Shards 14/18/26/28/31 income events | Signed IncomeEventV1 or IncomeReversalV1 envelope → 201 accepted, 202 parked, or stable ApiError | 2,000 ms; producer retries 3 times at 250/1,000/4,000 ms plus jitter; consumer idempotent; circuit opens 30 s after 5 failures/60 s, queues without loss |
| FX provider | {base, quote, rateDate, sourceClass, requestId} → {rate decimal string, rateDate, providerVersion, observedAt} | 1,500 ms; 2 retries at 100/400 ms only on timeout/5xx; circuit opens 60 s after 5 failures; return FX_RATE_UNRESOLVED, never cached zero |
| Producer resource validation | {resourceType, resourceId, holderPartyId, permission, requestId} → {exists, authorized, version, revokedAt} | 1,000 ms; one retry at 100 ms for reads; circuit opens 30 s after 8 failures; concealed miss maps to 404 |
| BE00 storage/scanner | {uploadRef, holderPartyId, expectedDigest, allowedMediaTypes} → {objectRef, digest, mediaType, scanState=clean} | 3,000 ms; 2 retries at 250/1,000 ms; circuit opens 60 s after 5 failures; non-clean blocks mutation |
| Receipt extraction worker | {objectRef, digest, localeHint, requestId} → {proposalFields, confidenceByField, extractorVersion} | 10,000 ms job attempt; 3 attempts at 30/120/600 s; circuit opens 5 min after 10 failures; final state failed with evidence retained |
| Rule/settings service | {settingKey, jurisdictionCode, taxYear, effectiveAt} → {value, version, digest, state} | 1,000 ms; one retry at 100 ms; circuit opens 30 s after 5 failures; absence fails closed |
| Artifact renderer | {kind, templateVersion, dataDigest, dataRef, locale} → {artifactRef, artifactDigest, mediaType, byteSize} | 15,000 ms; 2 retries at 1/4 s by dataDigest; circuit opens 2 min after 5 failures; no issued row until result |
| Notification provider | {jobId, templateId, deliveryRef, locale, variablesAllowlist} → {providerReceiptId, acceptedAt} | 5,000 ms; 3 attempts at 5/30/180 s; circuit opens 2 min after 8 failures; append failed delivery, never infer payment |

Circuit-open state emits dependency health metrics and returns/enqueues the specified deterministic outcome. Provider payloads are schema-parsed; unexpected fields are rejected or isolated as signed opaque payloads outside domain rows.

## Event and Consumer Contracts

All events inherit the BE00 envelope with eventId UUID, eventType, eventVersion=1, occurredAt, producer, aggregateId, aggregateVersion, correlationId, causationId, subjectPartyId, and schema-valid payload. Outbox commit is atomic with domain mutation; delivery is at least once; consumers deduplicate by eventId and enforce monotonic aggregateVersion.

~~~ts
export const FinanceIncomeAppendedV1 = z.object({
  eventId: Uuid,
  holderPartyId: Uuid,
  sourceShard: z.enum(["14", "18", "26", "28", "31", "import"]),
  sourceEventId: z.string().min(1).max(200),
  occurredAt: Instant,
  money: MoneyComponents,
  trustClass: z.enum(["verified", "observed", "declared"]),
  provenanceDigest: Sha256,
}).strict(); // finance.income.appended.v1

export const FinanceIncomeReversedV1 = z.object({
  reversalId: Uuid,
  originalEventId: Uuid,
  reasonCode: z.enum(["refund", "chargeback", "void", "source_correction"]),
  occurredAt: Instant,
  money: MoneyComponents,
}).strict(); // finance.income.reversed.v1

export const FinanceSnapshotIssuedV1 = z.object({
  snapshotId: Uuid,
  holderPartyId: Uuid,
  kind: z.enum(["income_statement", "tax_pack"]),
  period: Period,
  includedLedgerVersion: Version,
  includedEventCount: z.int().min(1).max(100_000),
  includedVersionSetDigest: Sha256,
  exceptionCodes: z.array(z.string().regex(/^[A-Z0-9_]{1,64}$/)).max(1000),
  digest: Sha256,
  issuedAt: Instant,
}).strict(); // finance.snapshot.issued.v1

export const FinanceInvoiceIssuedV1 = z.object({
  invoiceId: Uuid,
  issuerPartyId: Uuid,
  number: z.string().min(1).max(80),
  currency: Currency,
  totalMinor: NonNegativeMoney,
  dueDate: DateOnly,
  digest: Sha256,
}).strict(); // finance.invoice.issued.v1

export const FinanceReceivableChangedV1 = z.object({
  receivableEventId: Uuid,
  invoiceId: Uuid.nullable(),
  incomeEventId: Uuid.nullable(),
  kind: z.enum(["delivery", "payment_observation", "dunning_decision", "dunning_delivery", "withholding_reclaim"]),
  state: z.string().regex(/^[a-z0-9_]{1,64}$/),
  confidence: z.enum(["certain", "uncertain"]).nullable(),
  occurredAt: Instant,
}).strict().refine(v => v.invoiceId !== null || v.incomeEventId !== null, {
  message: "one_subject_required",
}); // finance.receivable.changed.v1
~~~

Events exclude PII labels, receipt/document content, fiscal references, public tokens, delivery targets, and free text. FX, P&L, and Shard 42 consumers must preserve trust bands and unknown states rather than coalescing them.

## Error Handling

### Global status and error rules

| HTTP | Stable codes | Rule |
|---|---|---|
| 400 | INVALID_REQUEST | Malformed JSON, query, path, or headers; no mutation |
| 401 | UNAUTHENTICATED, STEP_UP_REQUIRED | Authentication or recent assurance missing |
| 403 | FORBIDDEN | Visible resource but action/mandate/source grant denied |
| 404 | NOT_FOUND | True absence and concealed denial are indistinguishable |
| 409 | CONFLICT, IDEMPOTENCY_MISMATCH, VERSION_MISMATCH, INVALID_TRANSITION | Concurrent version, replay hash, or state conflict |
| 413/415 | PAYLOAD_TOO_LARGE, UNSUPPORTED_MEDIA_TYPE | BE00 size/media enforcement |
| 422 | VALIDATION_FAILED plus domain code | Schema-valid request violates a disclosed business invariant |
| 429 | RATE_LIMITED | Exact retry and limit details |
| 502/503/504 | DEPENDENCY_UNAVAILABLE | Safe dependencyClass only; no provider payload |
| 500 | INTERNAL_ERROR | Empty details; requestId correlates private diagnostics |

### Per-operation error matrix

| Op | Domain failures in BE00 ApiError { code, message, requestId, details } | Recovery |
|---|---|---|
| 41.01 | SOURCE_NOT_ALLOWED; SOURCE_EVENT_CONFLICT; REVERSAL_PREDECESSOR_MISSING | Park missing predecessor; source corrects key/payload; replay same hash |
| 41.02 | IMPORT_PREVIEW_EXPIRED; IMPORT_HASH_MISMATCH; OVERLAP_DECISION_REQUIRED | Re-preview or submit explicit holder decisions |
| 41.03 | FX_RATE_UNRESOLVED; PROJECTION_INPUT_INVALIDATED | Select another supported date/source or retry after rate ingest |
| 41.04 | LEDGER_VERSION_CHANGED; RECONCILIATION_BLOCKED; FX_RATE_UNRESOLVED | Refresh blockers/version; no partial snapshot |
| 41.05 | CANDIDATE_NOT_VISIBLE; CREDIT_REVOKED; VERSION_MISMATCH | Select visible candidate or refresh version |
| 41.06 | EVIDENCE_NOT_CLEAN; EVIDENCE_DIGEST_MISMATCH; EXTRACTION_UNAVAILABLE; EXTRACTION_VERSION_CHANGED | Replace upload, refresh proposal, or complete manually |
| 41.07 | TAX_RULE_UNSUPPORTED; TAX_INPUT_BLOCKED; LEDGER_VERSION_CHANGED | Choose supported rule/year or resolve cited blockers |
| 41.08 | DEADLINE_SOURCE_REQUIRED; DEDUCTION_MISMATCH; VERSION_MISMATCH | Correct evidence/checklist and retry |
| 41.09 | QUOTE_VERSION_CHANGED; RECIPIENT_REQUIRED; IMMUTABLE_VERSION | Refresh quote or create successor |
| 41.10 | FISCAL_FIELD_REQUIRED; NUMBERING_POLICY_CHANGED; CREDIT_EXCEEDS_BALANCE | Correct fiscal input/refresh policy; no number consumed on rollback |
| 41.11 | DUNNING_EXCLUDED; PAYMENT_UNCERTAIN; DELIVERY_UNAVAILABLE; INVOICE_VERSION_CHANGED | Hold/skip until new certain evidence; never force-send |

Domain failure details contain only stable IDs already visible, reasonCode, currentVersion when authorized, and recoveryAction. Validation violations use JSON Pointer paths; secrets and PII are never echoed.

## Failure Cascades and Partial-State Recovery

| Failure | Durable truth | Recovery |
|---|---|---|
| Reversal before original | Parked income_reversal plus open reconciliation case | Predecessor resolver applies once original arrives; alert after 15 min and 24 h |
| Import worker crash | Preview or committed transaction, never partial rows | Idempotency replay returns saved result; expired preview requires new preview |
| FX provider unavailable | Native event plus unresolved projection | Retry provider circuit; statement/tax issuance stays blocked |
| Renderer timeout | No issued snapshot/tax pack/instrument when synchronous issuance fails | Safe retry by idempotency/data digest; orphan artifact janitor deletes unreferenced object |
| OCR failure | Receipt and expense remain readable | Mark failed and allow manual confirmation; no invented category |
| Quote/invoice delivery failure | Immutable instrument and failed delivery event | Recipient target correction creates delivery retry; instrument unchanged |
| Numbering transaction abort | Sequence reservation rolls back or is recorded void under jurisdiction policy | Never silently reuse a committed number; audit void reason |
| Payment provider uncertainty | Latest receivable_event is uncertain | Halt dunning until signed certain observation |
| Outbox lag | Domain row and durable outbox remain atomic | Alarm at 60 s; replay idempotently; no direct side effect in request transaction |
| Revoked grant/public link | Canonical record remains, access ceases | Invalidate capability cache within 30 s; retain audit and legal record |

## Observability, Rate, and Abuse Controls

| Op | Safe structured fields and metric | SLO and alert |
|---|---|---|
| 41.01 | opId, sourceShard, trustClass, replayed, parked; finance_income_ingest_total | p95 300 ms; parked >1%/15 min or error >2% alerts |
| 41.02 | opId, mode, rowCount, overlapCount; finance_import_rows_total | preview p95 2 s/1k rows; commit p95 3 s; failures >5% alert |
| 41.03 | opId, sourceClass, currencyPair, state; finance_fx_projection_total | p95 500 ms cached/2 s provider; unresolved >5% alerts |
| 41.04 | opId, periodDays, eventCount, blockerCode; finance_snapshot_issue_total | p95 15 s; any renderer circuit or error >2% alerts |
| 41.05 | opId, candidateType, action, resultState; finance_work_link_total | p95 500 ms; conflict >10% alerts |
| 41.06 | opId, mediaType, extractionRequested/state; finance_expense_capture_total | p95 1 s excluding OCR; failed extraction >10% alerts |
| 41.07 | opId, jurisdictionCode, taxYear, exceptionCount; finance_tax_pack_total | p95 15 s; unsupported tracked, system errors >1% alert |
| 41.08 | opId, territoryCode, checklistCount, state; finance_reclaim_total | p95 750 ms; scheduler failure immediate alert |
| 41.09 | opId, action, lineCount, deliveryQueued; finance_quote_version_total | p95 1 s; delivery backlog >5 min alerts |
| 41.10 | opId, instrumentKind, lineCount, policyVersion; finance_invoice_issue_total | p95 2 s before render; numbering conflict/error immediate alert |
| 41.11 | opId, decision, reasonCode, ladderStep; finance_dunning_decision_total | p95 500 ms; wrongful-send invariant breach pages immediately |

Logs never contain amounts tied to identities, payer/supplier/customer labels, fiscal refs, terms, document content, delivery targets, URLs/tokens, or checklist evidence. Metrics use bounded enums. Traces propagate requestId/correlationId across providers and jobs; provider-native diagnostics strips request bodies and financial tags.

## Release, Migration, and Recovery

- Migrate restricted schemas and RLS before routes; deploy event consumers in accept-old/accept-new mode; register schemas before producers emit.
- Backfill only derived projections. Imported historical rows remain declared and preserve source provenance/digest.
- Feature flags are tenant-scoped for import, tax pack, public artifacts, and dunning; disabling a flag stops new commands without hiding canonical history.
- Rollback disables writers, drains outbox, confirms no new schema-version events, then rolls handlers back. Additive columns/events remain readable.
- Recovery verifies row counts, source-key uniqueness, snapshot digests, public-token revocation, outbox age, and RLS isolation before re-enable.
- Reconciliation jobs are restartable by cursor and idempotency key; no bulk job bypasses RLS or immutable-row triggers.

## Testing Strategy

### Per-operation acceptance matrix

| Op | Contract and success test | Auth/CORS/error test | Concurrency/recovery test |
|---|---|---|---|
| 41.01 | Accept valid producer event/reversal and exact schemas | Reject Origin, wrong source grant, bad signature with ApiError | Duplicate replay stable; payload mismatch conflicts; reversal parks then applies |
| 41.02 | Preview and commit only selected declared rows | Cross-holder concealed 404; unknown key/oversize fail | Two commits create one batch; crash replays saved result |
| 41.03 | Same rate converts all components with provenance | Delegate scope and bad query tested | Provider failure unresolved; actual projection supersedes estimate |
| 41.04 | Clean ledger issues immutable digest/snapshot | Step-up, CORS, hidden holder, all ApiError headers | Ledger change/blocker races refuse; render failure leaves none |
| 41.05 | Link/unlink leaves native event unchanged | Holder-only, concealed candidate, CSRF | If-Match one winner; credit revoke degrades |
| 41.06 | Clean evidence captures and OCR only proposes; human confirmation appends successor | Cross-holder upload and unsafe MIME blocked | OCR timeout retains evidence; replay creates one expense/confirmation |
| 41.07 | Exact supported pack produces immutable artifact | Unsupported jurisdiction fails closed; step-up | Ledger/rule version races block; renderer rollback |
| 41.08 | Saves deadline/checklist with no filing state | Delegate scope and invalid deadline source | If-Match one winner; alert job retry idempotent |
| 41.09 | Sent version immutable and link opaque | Recipient/account isolation, step-up, CORS | Concurrent successors one winner; delivery retry unchanged |
| 41.10 | Issue/credit totals and dates validate | Fiscal/issuer mandate and concealed invoice | Number allocation serializes; over-credit blocked; render retry |
| 41.11 | Send only certain unpaid deliverable unexcluded | Service-only/no-Origin; every hold returns ApiError where applicable | Payment/exclusion race wins; one notification job per step |

Additional suites:

- Zod/OpenAPI snapshots prove strict objects, UUID/date/currency/money bounds, discriminants, refinements, and rejection of actor-supplied identity.
- Database tests prove every CHECK/FK/unique index, immutable triggers, credit ceiling, one-rate projection, number serialization, and row_security=force.
- RLS matrix tests holder, each mandate, expired/revoked mandate, source partition, scheduler partition, public-token lookup, purpose grant, and unrelated tenant.
- Property tests generate money components, FX rounding, invoice totals, overlapping imports, credit totals, and dunning precedence.
- Event tests validate exact five schemas, envelope, outbox atomicity, duplicate delivery, ordering gaps, dead-letter replay, and PII denylist.
- Security tests cover CSRF/CORS, timing-equivalent 404, token entropy/hash/revocation, CSV formula injection, malicious upload, SSRF-safe renderer refs, and log redaction.
- Accessibility contract tests require semantic HTML/PDF metadata and declared/verified, reversal, exception, provisional, and non-advice labels from the render seam.
- Load tests cover 600 source events/min, 1,000-row previews, 100,000-event snapshots, numbering hot keys, dunning batches, and RLS plans using required indexes.

## Deepening Passes

| Pass | Evidence added |
|---|---|
| Contract completeness | Every 41.01–41.11 operation has exact request, success, headers, ApiError, state, and event/effect mapping |
| Data integrity | Native components, declared trust, one-rate FX, immutable issues, credit-only correction, and dunning precedence have Zod plus SQL enforcement |
| Security/privacy | PII isolation, purpose/mandate checks, RLS/grants, opaque links, step-up, CORS, CSRF, and cause-invariant 404 are explicit |
| Reliability | Lock order, idempotency replay, outbox, provider timeouts/retries/circuits, partial-state recovery, and alerts are deterministic |
| Testability | Each operation keys contract/auth/error/concurrency tests to its stable operation ID; all canonical identifiers are mechanically present |

## Ambiguity Gate

**PASS.** Classification matches the approved multi-domain index and IA ownership. All eleven assigned interactions, eight canonical contracts, fifteen canonical models, five event types, and three features reconcile exactly. Every operation has one unique route, strict Zod 4 input/output, BE00 ApiError, explicit CORS/auth/rate/idempotency/observability/test rows, typed persistence, failure recovery, and a deterministic professional-advice/money boundary. No macro or micro ambiguity remains.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Initial production-grade 41a backend contract authored from approved Shard 41 split | /write-be-spec | All |
| 2026-08-29 | Declared 41.03 pagination N/A and no returned collections | D8 remediation | Request and Response Contracts |

## Dependency References

- [BE 00 — Cross-cutting platform foundation](00-infrastructure.md)
- [IA 14 — Services marketplace lifecycle](../ia/14-services-marketplace.md)
- [IA 18 — Royalty registration, ingestion, calculation and payout](../ia/18-royalty-accounting.md)
- [IA 26 — Gear transactions, fulfilment and possession models](../ia/26-gear-commerce-fulfilment.md)
- [IA 28 — Digital licensing, commerce, revocation and revenue](../ia/28-digital-licensing-commerce.md)
- [IA 31 — Agency, settlement and live-market intelligence](../ia/31-live-settlement-intelligence.md)
- [IA 42 — Career planning, insurance and sustainability](../ia/42-career-planning-risk.md)
- [41b — Deals, Recoupment & P&L](41b-deals-recoupment-pl.md)
