# Deals, Recoupment & P&L — Backend Specification

**Status:** Complete

**IA source:** [Shard 41 — Career finance and business operations](../ia/41-career-finance.md)

**Companion:** [41a — Income, Tax Readiness & Receivables](41a-income-tax-receivables.md)

**Platform contract:** [BE 00 — Cross-cutting platform foundation](00-infrastructure.md)

## Classification

| Dimension | Decision |
|---|---|
| Classification | Multi-domain companion 41b: deal vault, terms/obligations, advance referrals, commission/recoupment, runway, P&L, closing, and band allocation |
| Included IA interactions | 41.12–41.19 |
| Included features | 23.04 Deal & Contract Vault; 23.06 Advances, Commission & Recoupment; 23.07 Budgeting & Project/Tour P&L |
| Excluded boundary | Income ingestion, FX, statements, expenses/tax packs, quotes, invoices, and dunning belong to 41a |
| Money/legal boundary | Records evidence, calculations, referrals, and allocations; never executes deduction, recoupment, distribution, lending, investment, or legal adjudication |
| Calculation boundary | Only confirmed clause-cited terms drive calculations; ambiguity or unspecified sequence produces a held result |

The approved split is source-faithful. Interactions 41.12–41.19 form one evidence-to-calculation-to-close lifecycle. Catalogue-stake finance, securitization, fan investment, loan approval/origination, and payment movement remain explicitly out of scope.

## Referenced Material Inventory

| Material | Exact source location | Use |
|---|---|---|
| IA scope and locked decisions | [IA 41 lines 7–49](../ia/41-career-finance.md#overview) | Vault, term, alert, referral, commission, recoupment, runway, P&L, and band boundaries |
| Feature inventory | [IA 41 lines 51–58](../ia/41-career-finance.md#features) | Features 23.04, 23.06, and 23.07 |
| Acceptance criteria | [IA 41 lines 60–80](../ia/41-career-finance.md#acceptance-criteria) | AC-41.12 through AC-41.19 |
| Interaction registry | [IA 41 lines 82–104](../ia/41-career-finance.md#interactions) | Operation completeness, failure, and recovery |
| Canonical contracts | [IA 41 lines 106–123](../ia/41-career-finance.md#contracts) | DealInstrumentV1, ConfirmedDealTermV1, RecoupmentEntryV1, ClosingVersionV1 |
| Canonical data models | [IA 41 lines 125–178](../ia/41-career-finance.md#data-models) | Thirteen canonical persistence models and cardinalities |
| Access control | [IA 41 lines 180–202](../ia/41-career-finance.md#access-control) | Holder, delegate, beneficiary, band, support, and service rules |
| Events and edge cases | [IA 41 lines 216–273](../ia/41-career-finance.md#event-schemas) | Four event types, races, revocation, and late-close behavior |
| Dependencies | [IA 41 lines 275–290](../ia/41-career-finance.md#cross-shard-dependencies) | Shards 00, 14, 18, 26, 28, 31, companion 41a, and consumer 42 |
| Global HTTP/runtime rules | [BE 00 lines 112–200](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) | Strict Zod 4, ApiError, identifiers, and response headers |
| Global middleware/protocols | [BE 00 lines 253–353](00-infrastructure.md#middleware--policies) | Auth, CORS, idempotency, ETag, limits, and ordering |
| Global events/errors/recovery | [BE 00 lines 355–500](00-infrastructure.md#event-and-consumer-contracts) | Event envelope, outbox, failure mapping, observability, and recovery |

## IA Source Map

| Operation | IA interaction and acceptance criterion | Canonical result |
|---|---|---|
| 41.12 | Store contract instrument; AC-41.12 | Immutable DealInstrumentV1 linked into a deal chain |
| 41.13 | Confirm key term; AC-41.13 | Clause-cited ConfirmedDealTermV1 and dependent obligation activation |
| 41.14 | Reconcile deal to facts; AC-41.14 | Cited observation, absence, or conflict; no correction/legal conclusion |
| 41.15 | Prepare advance referral; AC-41.15 | Consented verified-data package and cost comparison; no credit decision |
| 41.16 | Calculate commission/recoupment; AC-41.16 | Held or clause-cited commission calculation and RecoupmentEntryV1 append/reversal |
| 41.17 | View runway; AC-41.17 | Opt-in net-to-me range/confidence/gap or explicit unavailable state |
| 41.18 | View/close P&L; AC-41.18 | Provisional canonical-row projection or immutable ClosingVersionV1 |
| 41.19 | Record band allocation; AC-41.19 | Close-bound allocation evidence after member debts; no transfer |

### Canonical identifier registry

| Kind | Exact identifiers |
|---|---|
| Contracts | DealInstrumentV1; ConfirmedDealTermV1; RecoupmentEntryV1; ClosingVersionV1 |
| Models | deal; deal_instrument; term_proposal; confirmed_deal_term; obligation_alert; recoupment_entry; commission_calculation; runway_projection; budget_overlay; pl_projection; closing_version; member_debt; allocation_record |
| Events | finance.deal_term.confirmed.v1; finance.obligation.alert_resolved.v1; finance.recoupment.appended.v1; finance.pl.closed.v1 |

## Endpoint Completeness Reconciliation

| Op | Backend responsibility | Persistence effect | Event/effect |
|---|---|---|---|
| 41.12 | Validate clean document evidence and append an immutable instrument | deal, deal_instrument | Extraction proposal job only |
| 41.13 | Validate citation/reviewer and append a confirmed term version | term_proposal, confirmed_deal_term, obligation_alert | finance.deal_term.confirmed.v1 |
| 41.14 | Compare confirmed term versions with current typed producer facts | supporting deal_reconciliation_observation | Read-only toward producer facts |
| 41.15 | Gate consent/verified data and freeze a lender-facing package | supporting advance_referral | Artifact generation only; no underwriting/submission |
| 41.16 | Evaluate confirmed scope/rate/sequence and append held/final working | commission_calculation, recoupment_entry | finance.recoupment.appended.v1 for applied/reversal rows |
| 41.17 | Derive disposable net-to-me range, confidence, and lead-time gap | runway_projection | No domain event |
| 41.18 | Materialize canonical actuals plus optional budget; optionally close | budget_overlay, pl_projection, closing_version, member_debt | finance.pl.closed.v1 on final close |
| 41.19 | Validate governance rule/debt priority and append allocation evidence | allocation_record | Record only; no transfer or royalty split |

### Feature coverage

| Feature | Operations | Complete boundary |
|---|---|---|
| 23.04 | 41.12–41.14 | Immutable instrument chain, cited human confirmation, alerts, and non-adjudicative reconciliation |
| 23.06 | 41.15–41.17 | Referral-only advance preparation, clause-governed calculations, and confidence-safe runway |
| 23.07 | 41.18–41.19 | Actuals-first projections, versioned closing, debts, and record-only band allocation |

## Shared Contract Inheritance

This companion inherits all BE00 request IDs, authentication, CSRF/CORS, security headers, canonical idempotency hashes, ETags, strict validation, RLS context, upload/job/event protocols, structured logs, and recovery fences. It consumes immutable income/snapshot facts from 41a; it never duplicates 41a routes or mutates source facts.

Every failure uses exactly:

~~~ts
type ApiError = {
  code: string;
  message: string;
  requestId: string;
  details: Readonly<Record<string, JsonValue>>;
};
~~~

Top-level type, title, status, detail, instance, error, and timestamp are prohibited. Every failure includes Content-Type: application/json, X-Request-Id, Cache-Control: no-store, and applicable rate headers.

## API Endpoints

### Authoritative Route Registry

This is the sole route registry for 41b; each operation ID is the stable OpenAPI operationId.

| Op | Method and path | Principal | CORS policy | Validation | Rate limit | Idempotency | Success |
|---|---|---|---|---|---|---|---|
| 41.12 | POST /api/v1/finance/deal-instruments | Deal party or document delegate | BE00-CORS-WEB-CREDENTIALLED | JSON, uploadRef, conditional If-Match | 20/min/party or deal | Required, 24h | 201 |
| 41.13 | POST /api/v1/finance/deals/{dealId}/terms/confirmations | Authorized deal reviewer with step-up | BE00-CORS-WEB-CREDENTIALLED | Path, strict discriminated JSON | 30/min/deal | Required, 24h | 201 |
| 41.14 | POST /api/v1/finance/deals/{dealId}/reconciliations | Visible deal party or reconciliation delegate | BE00-CORS-WEB-CREDENTIALLED | Path, JSON, versions | 20/min/deal | Required, 24h | 200 |
| 41.15 | POST /api/v1/finance/advance-referrals | Holder with step-up and explicit consent | BE00-CORS-WEB-CREDENTIALLED | JSON, snapshot version | 4/hour/holder | Required, 24h | 201 |
| 41.16 | POST /api/v1/finance/deals/{dealId}/calculations | Holder; beneficiary is read-only | BE00-CORS-WEB-CREDENTIALLED | Discriminated JSON, If-Match | 30/min/deal | Required, 24h | 201 or 202 held |
| 41.17 | GET /api/v1/finance/runway | Holder only with feature opt-in | BE00-CORS-WEB-CREDENTIALLED | Strict query | 60/min/holder | Not accepted; deterministic cache key | 200 |
| 41.18 | POST /api/v1/finance/pl-projections | Scope owner or closing delegate; step-up on close | BE00-CORS-WEB-CREDENTIALLED | Discriminated JSON, If-Match on close | 30/min/scope; 6/hour close | Required, 24h | 200 view or 201 close |
| 41.19 | POST /api/v1/finance/closing-versions/{closingVersionId}/allocations | Band governance-authorized member with step-up | BE00-CORS-WEB-CREDENTIALLED | Path, JSON, If-Match | 6/hour/close | Required, 24h | 201 |

BE00-CORS-WEB-CREDENTIALLED and BE00-CORS-WEB-CREDENTIALLED are closed configured-origin policies. Write preflight allows only the named method, Content-Type, Idempotency-Key, If-Match, and X-CSRF-Token with credentials. No wildcard origin or null-origin credential request is allowed. BE00 answers OPTIONS before domain authorization.

### Operation Contract Matrix

| Op | Request contract | Success contract | Error contract |
|---|---|---|---|
| 41.12 | DealInstrumentRequest plus DealInstrumentHeaders | DealInstrumentResult | BE00 ApiError { code, message, requestId, details } |
| 41.13 | ConfirmDealTermRequest plus VersionedHeaders | ConfirmDealTermResult | BE00 ApiError { code, message, requestId, details } |
| 41.14 | DealReconciliationRequest plus CommandHeaders | DealReconciliationResult | BE00 ApiError { code, message, requestId, details } |
| 41.15 | AdvanceReferralRequest plus CommandHeaders | AdvanceReferralResult | BE00 ApiError { code, message, requestId, details } |
| 41.16 | CalculationRequest plus VersionedHeaders | CalculationResult | BE00 ApiError { code, message, requestId, details } |
| 41.17 | RunwayQuery | RunwayResult | BE00 ApiError { code, message, requestId, details } |
| 41.18 | PlProjectionRequest plus CommandHeaders or VersionedHeaders on close | PlProjectionResult | BE00 ApiError { code, message, requestId, details } |
| 41.19 | AllocationRequest plus VersionedHeaders | AllocationResult | BE00 ApiError { code, message, requestId, details } |

## Request and Response Contracts — Zod 4

Strict Zod 4 schemas are authoritative for runtime, TypeScript, OpenAPI, tests, and event validation. Actor identity is derived from verified context. Monetary values are integer minor units; ratios use decimal strings on the wire so floating-point representation never changes money.

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
const Url = z.url().max(2048);
const Ratio = z.string().regex(/^(0(\.[0-9]{1,6})?|1(\.0{1,6})?)$/);
const SafeText = z.string().trim().min(1).max(500);

const CommandHeaders = z.object({
  "idempotency-key": z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  "x-csrf-token": z.string().min(32).max(512),
}).strict();
const VersionedHeaders = CommandHeaders.extend({
  "if-match": z.string().regex(/^"[1-9][0-9]*"$/),
}).strict();
const DealInstrumentHeaders = CommandHeaders.extend({
  "if-match": z.string().regex(/^"[1-9][0-9]*"$/).optional(),
}).strict();

const ClauseCitation = z.object({
  instrumentId: Uuid,
  page: z.int().positive().nullable(),
  startOffset: z.int().min(0).nullable(),
  endOffset: z.int().positive().nullable(),
  citedTextDigest: Sha256,
  locatorLabel: z.string().trim().min(1).max(120),
}).strict().superRefine((v, ctx) => {
  if ((v.startOffset === null) !== (v.endOffset === null))
    ctx.addIssue({ code: "custom", path: ["startOffset"], message: "offsets_must_be_paired" });
  if (v.startOffset !== null && v.endOffset !== null && v.endOffset <= v.startOffset)
    ctx.addIssue({ code: "custom", path: ["endOffset"], message: "must_follow_start" });
});

const AccessPolicy = z.object({
  visiblePartyIds: z.array(Uuid).min(1).max(100),
  delegateGrantIds: z.array(Uuid).max(100),
  purpose: z.enum(["deal_review", "calculation", "audit", "obligation"]),
  expiresAt: Instant.nullable(),
}).strict().refine(v => new Set(v.visiblePartyIds).size === v.visiblePartyIds.length, {
  message: "visible_parties_must_be_unique",
});

export const DealInstrumentV1 = z.object({
  dealId: Uuid,
  instrumentId: Uuid,
  documentObjectRef: Uuid,
  documentDigest: Sha256,
  instrumentVersion: Version,
  partyIds: z.array(Uuid).min(1).max(100),
  effectiveDate: DateOnly.nullable(),
  accessPolicy: AccessPolicy,
  predecessorInstrumentId: Uuid.nullable(),
  storedAt: Instant,
}).strict().refine(v => new Set(v.partyIds).size === v.partyIds.length, {
  message: "party_ids_must_be_unique",
});
export const DealInstrumentRequest = z.object({
  action: z.enum(["append", "replace"]),
  dealId: Uuid.nullable(),
  dealTitle: z.string().trim().min(1).max(200).nullable(),
  uploadRef: Uuid,
  documentDigest: Sha256,
  partyIds: z.array(Uuid).min(1).max(100),
  effectiveDate: DateOnly.nullable(),
  accessPolicy: AccessPolicy,
  predecessorInstrumentId: Uuid.nullable(),
  requestExtraction: z.boolean(),
}).strict().superRefine((v, ctx) => {
  if (v.action === "replace" && (v.predecessorInstrumentId === null || v.dealId === null))
    ctx.addIssue({ code: "custom", path: ["predecessorInstrumentId"], message: "required_for_replace" });
  if (v.action === "append" && v.predecessorInstrumentId !== null)
    ctx.addIssue({ code: "custom", path: ["predecessorInstrumentId"], message: "forbidden_for_append" });
  if (v.dealId === null && (v.action !== "append" || v.dealTitle === null))
    ctx.addIssue({ code: "custom", path: ["dealTitle"], message: "new_deal_requires_title_and_append" });
  if (v.dealId !== null && v.dealTitle !== null)
    ctx.addIssue({ code: "custom", path: ["dealTitle"], message: "existing_deal_title_is_not_mutable_here" });
});
export const DealInstrumentResult = z.object({
  instrument: DealInstrumentV1,
  extractionJobId: Uuid.nullable(),
  replayed: z.boolean(),
}).strict();

const TermValue = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("money"), currency: Currency, amountMinor: MoneyMinor }).strict(),
  z.object({ kind: z.literal("percentage"), ratio: Ratio }).strict(),
  z.object({ kind: z.literal("date"), date: DateOnly, confirmedDate: z.boolean() }).strict(),
  z.object({
    kind: z.literal("ordered_sequence"),
    steps: z.array(z.object({
      sequence: z.int().positive(),
      classCode: z.string().regex(/^[a-z0-9_]{1,64}$/),
    }).strict()).min(1).max(100),
  }).strict().refine(v => v.steps.every((x, i) => x.sequence === i + 1), {
    message: "steps_must_be_contiguous_and_ordered",
  }),
  z.object({
    kind: z.literal("scope"),
    incomeClasses: z.array(z.string().regex(/^[a-z0-9_]{1,64}$/)).min(1).max(100),
    exclusions: z.array(z.string().regex(/^[a-z0-9_]{1,64}$/)).max(100),
  }).strict(),
  z.object({ kind: z.literal("text"), value: z.string().trim().min(1).max(2000) }).strict(),
]);

export const ConfirmedDealTermV1 = z.object({
  confirmedTermId: Uuid,
  dealId: Uuid,
  instrumentId: Uuid,
  citation: ClauseCitation,
  termType: z.enum([
    "advance_amount", "commission_rate", "commission_scope", "recoupment_sequence",
    "recoupable_cost", "obligation_date", "distribution_rule", "other"
  ]),
  value: TermValue,
  sourceClass: z.enum(["manual", "extraction_proposal"]),
  proposalId: Uuid.nullable(),
  confirmedByPartyId: Uuid,
  confirmedAt: Instant,
  version: Version,
  supersedesConfirmedTermId: Uuid.nullable(),
}).strict().superRefine((v, ctx) => {
  if (v.sourceClass === "extraction_proposal" && v.proposalId === null)
    ctx.addIssue({ code: "custom", path: ["proposalId"], message: "required_for_extraction_proposal" });
  const requiredKind = {
    advance_amount: "money", commission_rate: "percentage", commission_scope: "scope",
    recoupment_sequence: "ordered_sequence", recoupable_cost: "scope",
    obligation_date: "date", distribution_rule: "ordered_sequence"
  } as const;
  const expected = requiredKind[v.termType as keyof typeof requiredKind];
  if (expected && v.value.kind !== expected)
    ctx.addIssue({ code: "custom", path: ["value", "kind"], message: "kind_must_match_term_type" });
});
export const ConfirmDealTermRequest = z.object({
  instrumentId: Uuid,
  citation: ClauseCitation,
  termType: z.enum([
    "advance_amount", "commission_rate", "commission_scope", "recoupment_sequence",
    "recoupable_cost", "obligation_date", "distribution_rule", "other"
  ]),
  value: TermValue,
  sourceClass: z.enum(["manual", "extraction_proposal"]),
  proposalId: Uuid.nullable(),
  activateAlerts: z.boolean(),
}).strict().superRefine((v, ctx) => {
  if (v.sourceClass === "extraction_proposal" && v.proposalId === null)
    ctx.addIssue({ code: "custom", path: ["proposalId"], message: "required_for_extraction_proposal" });
  if (v.sourceClass === "manual" && v.proposalId !== null)
    ctx.addIssue({ code: "custom", path: ["proposalId"], message: "forbidden_for_manual" });
  const requiredKind = {
    advance_amount: "money", commission_rate: "percentage", commission_scope: "scope",
    recoupment_sequence: "ordered_sequence", recoupable_cost: "scope",
    obligation_date: "date", distribution_rule: "ordered_sequence"
  } as const;
  const expected = requiredKind[v.termType as keyof typeof requiredKind];
  if (expected && v.value.kind !== expected)
    ctx.addIssue({ code: "custom", path: ["value", "kind"], message: "kind_must_match_term_type" });
});
export const ConfirmDealTermResult = z.object({
  term: ConfirmedDealTermV1,
  obligationAlertIds: z.array(Uuid).max(100),
  replayed: z.boolean(),
}).strict();

const FactReference = z.object({
  producerShard: z.enum(["14", "18", "26", "28", "31", "41a"]),
  factType: z.string().regex(/^[a-z0-9_.]{1,80}$/),
  factId: Uuid,
  factVersion: Version,
  factDigest: Sha256,
}).strict();
export const DealReconciliationRequest = z.object({
  confirmedTermIds: z.array(Uuid).min(1).max(100),
  factReferences: z.array(FactReference).min(1).max(1000),
  asOf: Instant,
  purpose: z.enum(["rights_check", "income_check", "settlement_check", "obligation_check"]),
}).strict().superRefine((v, ctx) => {
  const keys = v.factReferences.map(x => x.producerShard + ":" + x.factType + ":" + x.factId);
  if (new Set(keys).size !== keys.length)
    ctx.addIssue({ code: "custom", path: ["factReferences"], message: "fact_references_must_be_unique" });
});
const ReconciliationObservation = z.object({
  observationId: Uuid,
  confirmedTermId: Uuid,
  classification: z.enum(["consistent", "absence", "conflict", "unknown"]),
  termCitation: ClauseCitation,
  factReference: FactReference.nullable(),
  reasonCode: z.string().regex(/^[A-Z0-9_]{1,64}$/),
  legalConclusion: z.literal(false),
}).strict();
export const DealReconciliationResult = z.object({
  reconciliationId: Uuid,
  observations: z.array(ReconciliationObservation).min(1).max(1000),
  autoCorrected: z.literal(false),
  generatedAt: Instant,
}).strict();

export const AdvanceReferralRequest = z.object({
  snapshotId: Uuid,
  expectedSnapshotDigest: Sha256,
  expectedTermMonths: z.int().min(1).max(120),
  providerOptionIds: z.array(Uuid).min(1).max(20),
  consent: z.object({
    purpose: z.literal("advance_referral_preparation"),
    providerOptionIds: z.array(Uuid).min(1).max(20),
    expiresAt: Instant,
    acceptedPolicyVersion: z.string().min(1).max(100),
  }).strict(),
}).strict().refine(v =>
  v.providerOptionIds.length === v.consent.providerOptionIds.length &&
  v.providerOptionIds.every(x => v.consent.providerOptionIds.includes(x)), {
  message: "provider_options_must_equal_consent_scope",
});
const AdvanceCostOption = z.object({
  providerOptionId: Uuid,
  advanceAmountMinor: NonNegativeMoney,
  currency: Currency,
  expectedTermMonths: z.int().min(1).max(120),
  totalExpectedCostMinor: NonNegativeMoney,
  costBasis: z.enum(["fixed_fee", "factor_rate", "revenue_share_projection"]),
  providerDisclosureVersion: z.string().min(1).max(100),
  notAnApproval: z.literal(true),
}).strict();
export const AdvanceReferralResult = z.object({
  referralId: Uuid,
  artifactUrl: Url,
  includedSnapshotId: Uuid,
  declaredIncomeExcluded: z.literal(true),
  options: z.array(AdvanceCostOption).min(1).max(20),
  state: z.literal("prepared"),
  submittedToProvider: z.literal(false),
  expiresAt: Instant,
}).strict();

export const RecoupmentEntryV1 = z.object({
  entryId: Uuid,
  dealId: Uuid,
  sourceIncomeEventId: Uuid,
  ruleTermId: Uuid,
  citation: ClauseCitation,
  ruleVersion: Version,
  sequence: z.int().positive(),
  entryKind: z.enum(["debit", "credit", "reversal"]),
  amountMinor: NonNegativeMoney,
  currency: Currency,
  balanceAfterMinor: MoneyMinor.nullable(),
  reversesEntryId: Uuid.nullable(),
  occurredAt: Instant,
  state: z.enum(["applied", "held_ambiguity"]),
  holdReasonCodes: z.array(z.string().regex(/^[A-Z0-9_]{1,64}$/)).max(20),
}).strict().superRefine((v, ctx) => {
  if ((v.entryKind === "reversal") !== (v.reversesEntryId !== null))
    ctx.addIssue({ code: "custom", path: ["reversesEntryId"], message: "required_only_for_reversal" });
  if ((v.state === "applied") !== (v.balanceAfterMinor !== null))
    ctx.addIssue({ code: "custom", path: ["balanceAfterMinor"], message: "required_only_when_applied" });
  if ((v.state === "held_ambiguity") !== (v.holdReasonCodes.length > 0))
    ctx.addIssue({ code: "custom", path: ["holdReasonCodes"], message: "required_only_when_held" });
});
const CommissionCalculationResult = z.object({
  calculationId: Uuid,
  dealId: Uuid,
  sourceIncomeEventId: Uuid,
  rateTermId: Uuid,
  scopeTermId: Uuid,
  sequenceTermId: Uuid.nullable(),
  baseAmountMinor: NonNegativeMoney,
  commissionAmountMinor: NonNegativeMoney,
  currency: Currency,
  state: z.enum(["calculated", "held_ambiguity", "reversed"]),
  holdReasonCodes: z.array(z.string().regex(/^[A-Z0-9_]{1,64}$/)).max(20),
  movesMoney: z.literal(false),
  version: Version,
}).strict();
export const CalculationRequest = z.discriminatedUnion("calculationKind", [
  z.object({
    calculationKind: z.literal("commission"),
    sourceIncomeEventIds: z.array(Uuid).min(1).max(1000),
    rateTermId: Uuid,
    scopeTermId: Uuid,
    sequenceTermId: Uuid.nullable(),
    expectedIncomeLedgerVersion: Version,
    ruleEffectiveDate: DateOnly,
  }).strict(),
  z.object({
    calculationKind: z.literal("recoupment"),
    sourceIncomeEventIds: z.array(Uuid).min(1).max(1000),
    sequenceTermId: Uuid,
    recoupableCostTermIds: z.array(Uuid).min(1).max(100),
    expectedRecoupmentVersion: Version,
    ruleEffectiveDate: DateOnly,
  }).strict(),
  z.object({
    calculationKind: z.literal("commission_reversal"),
    originalCalculationIds: z.array(Uuid).min(1).max(1000),
    reasonCode: z.enum(["source_reversal", "term_superseded", "holder_correction"]),
    expectedCalculationVersion: Version,
  }).strict(),
  z.object({
    calculationKind: z.literal("recoupment_reversal"),
    originalEntryIds: z.array(Uuid).min(1).max(1000),
    reasonCode: z.enum(["source_reversal", "term_superseded", "holder_correction"]),
    expectedRecoupmentVersion: Version,
  }).strict(),
]);
export const CalculationResult = z.discriminatedUnion("calculationKind", [
  z.object({
    calculationKind: z.literal("commission"),
    calculations: z.array(CommissionCalculationResult).min(1).max(1000),
    allHeld: z.boolean(),
  }).strict(),
  z.object({
    calculationKind: z.literal("recoupment"),
    entries: z.array(RecoupmentEntryV1).min(1).max(1000),
    allHeld: z.boolean(),
  }).strict(),
  z.object({
    calculationKind: z.literal("commission_reversal"),
    calculations: z.array(CommissionCalculationResult).min(1).max(1000),
    allHeld: z.literal(false),
  }).strict(),
  z.object({
    calculationKind: z.literal("recoupment_reversal"),
    entries: z.array(RecoupmentEntryV1).min(1).max(1000),
    allHeld: z.literal(false),
  }).strict(),
]);

export const RunwayQuery = z.object({
  reportingCurrency: Currency,
  horizonDays: z.int().min(30).max(730),
  confidenceFloor: z.enum(["low", "medium", "high"]),
  asOf: DateOnly,
}).strict();
export const RunwayResult = z.discriminatedUnion("state", [
  z.object({
    state: z.literal("available"),
    projectionId: Uuid,
    reportingCurrency: Currency,
    lowerDays: z.int().min(0).max(3650),
    upperDays: z.int().min(0).max(3650),
    confidence: z.enum(["low", "medium", "high"]),
    gapLeadTimeDays: z.int().min(0).max(3650).nullable(),
    inputVersion: Version,
    actionRouteCodes: z.array(z.string().regex(/^[a-z0-9_]{1,64}$/)).max(20),
    pointEstimateWithheld: z.literal(true),
  }).strict().refine(v => v.lowerDays <= v.upperDays, { message: "range_must_be_ordered" }),
  z.object({
    state: z.literal("unavailable"),
    reasonCode: z.enum(["not_opted_in", "insufficient_history", "confidence_below_floor", "fx_unresolved"]),
    confidence: z.enum(["low", "medium", "high"]).nullable(),
    pointEstimateWithheld: z.literal(true),
  }).strict(),
]);

const PlScope = z.object({
  kind: z.enum(["project", "tour", "band"]),
  scopeId: Uuid,
}).strict();
const BudgetOverlaySelection = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("none") }).strict(),
  z.object({ mode: z.literal("existing"), budgetOverlayId: Uuid, expectedVersion: Version }).strict(),
  z.object({
    mode: z.literal("inline"),
    plannedRows: z.array(z.object({
      categoryCode: z.string().regex(/^[a-z0-9_]{1,64}$/),
      rowKind: z.enum(["income", "expense"]),
      amountMinor: NonNegativeMoney,
      currency: Currency,
    }).strict()).min(1).max(1000),
  }).strict(),
]);
const Period = z.object({ from: DateOnly, through: DateOnly }).strict()
  .refine(v => v.from <= v.through, { message: "from_must_not_follow_through" });
const CanonicalRowRef = z.object({
  rowKind: z.enum(["income_event", "income_reversal", "expense_event", "commission_calculation", "recoupment_entry", "member_debt"]),
  rowId: Uuid,
  rowVersion: Version,
  amountMinor: MoneyMinor,
  currency: Currency,
  tagState: z.enum(["tagged", "untagged", "invalidated"]),
}).strict();
export const ClosingVersionV1 = z.object({
  closingVersionId: Uuid,
  scope: PlScope,
  period: Period,
  reportingCurrency: Currency,
  includedRows: z.array(CanonicalRowRef).min(1).max(100_000),
  memberDebtIds: z.array(Uuid).max(1000),
  closeKind: z.enum(["provisional", "final"]),
  closePolicyVersion: z.string().min(1).max(100),
  closedByPartyId: Uuid,
  closedAt: Instant,
  version: Version,
  supersedesClosingVersionId: Uuid.nullable(),
  digest: Sha256,
}).strict();
export const PlProjectionRequest = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("view"),
    scope: PlScope,
    period: Period,
    reportingCurrency: Currency,
    budgetOverlay: BudgetOverlaySelection,
    includeUntagged: z.boolean(),
  }).strict(),
  z.object({
    action: z.literal("close"),
    scope: PlScope,
    period: Period,
    reportingCurrency: Currency,
    budgetOverlay: BudgetOverlaySelection,
    closeKind: z.enum(["provisional", "final"]),
    closePolicyVersion: z.string().min(1).max(100),
    expectedProjectionVersion: Version,
    acknowledgedUntaggedRowIds: z.array(Uuid).max(10_000),
  }).strict(),
]);
const PlProjection = z.object({
  projectionId: Uuid,
  scope: PlScope,
  period: Period,
  reportingCurrency: Currency,
  actualIncomeMinor: MoneyMinor,
  actualExpenseMinor: MoneyMinor,
  actualNetMinor: MoneyMinor,
  budgetIncomeMinor: MoneyMinor.nullable(),
  budgetExpenseMinor: MoneyMinor.nullable(),
  budgetOverlayId: Uuid.nullable(),
  untaggedRowCount: z.int().min(0),
  unreconciledRowCount: z.int().min(0),
  version: Version,
}).strict().refine(v => v.actualIncomeMinor - v.actualExpenseMinor === v.actualNetMinor, {
  message: "actual_net_must_reconcile",
});
export const PlProjectionResult = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("view"),
    projection: PlProjection,
    closingVersion: z.null(),
    replayed: z.boolean(),
  }).strict(),
  z.object({
    action: z.literal("close"),
    projection: PlProjection,
    closingVersion: ClosingVersionV1,
    replayed: z.boolean(),
  }).strict(),
]);

const AllocationLine = z.object({
  memberPartyId: Uuid,
  debtAppliedMinor: NonNegativeMoney,
  residualAllocationMinor: NonNegativeMoney,
  currency: Currency,
  sequence: z.int().positive(),
}).strict();
export const AllocationRequest = z.object({
  governanceTermId: Uuid,
  expectedClosingDigest: Sha256,
  lines: z.array(AllocationLine).min(1).max(100),
  acknowledgedRecordOnly: z.literal(true),
}).strict().superRefine((v, ctx) => {
  if (new Set(v.lines.map(x => x.memberPartyId)).size !== v.lines.length)
    ctx.addIssue({ code: "custom", path: ["lines"], message: "members_must_be_unique" });
  const seq = [...v.lines].sort((a,b) => a.sequence-b.sequence);
  if (!seq.every((x,i) => x.sequence === i+1))
    ctx.addIssue({ code: "custom", path: ["lines"], message: "sequence_must_be_contiguous" });
});
export const AllocationResult = z.object({
  closingVersionId: Uuid,
  allocationRecordIds: z.array(Uuid).min(1).max(100),
  totalDebtAppliedMinor: NonNegativeMoney,
  totalResidualAllocatedMinor: NonNegativeMoney,
  currency: Currency,
  movesMoney: z.literal(false),
  royaltySplit: z.literal(false),
  replayed: z.boolean(),
}).strict();
~~~

### Fixed-read pagination and collection bounds

| Operation | Pagination | Exact returned-collection bounds |
|---|---|---|
| 41.17 | Pagination N/A: this GET returns one available-or-unavailable holder runway projection; strict `RunwayQuery` parsing rejects cursor, offset, page, limit, sort, and filter keys. | The available branch has `actionRouteCodes` capped at 20 entries; the unavailable branch and every other returned field have no collections. |

### Header and cross-field rules

| Op | Deterministic rule |
|---|---|
| 41.12 | New deal uses dealId=null, action=append, dealTitle, and no If-Match; existing deal requires If-Match; upload must be clean/digest-equal; replacement appends without overwriting |
| 41.13 | Reviewer must see cited instrument and have confirm_terms grant; extraction is proposal only; term type and value kind must match |
| 41.14 | Every fact version/digest is revalidated; result may cite absence/conflict but cannot mutate producer data or state legal effect |
| 41.15 | Snapshot must be immutable, verified, unexpired for purpose, and exclude declared totals; consent scope exactly equals provider options |
| 41.16 | Scope defaults to no income class; missing scope/rate/ordered sequence holds; delegate/beneficiary cannot alter terms; no money movement |
| 41.17 | Holder opt-in is server-side; range uses net-to-me inputs and withholds a point estimate; insufficient confidence returns unavailable |
| 41.18 | One canonical row set powers project/tour/band; actuals never derive from budget; final close pins exact row versions and visible debts |
| 41.19 | Closing version must be final and digest-equal; confirmed governance rule and debt priority must reconcile before residual allocation |

### Contract examples

| Op | Minimal valid semantic example |
|---|---|
| 41.12 | new deal: dealId=null, title, action=append, clean PDF uploadRef, two visible parties, deal_review policy |
| 41.13 | manual commission_rate with percentage value and exact clause digest |
| 41.14 | one confirmed term and one versioned Shard 31 settlement fact |
| 41.15 | verified snapshot, 12-month term, exact consented provider option set |
| 41.16 | commission request with explicit rate/scope and ordered income event IDs |
| 41.17 | GBP, 180-day horizon, medium confidence floor |
| 41.18 | view project actuals or close final with acknowledged untagged rows |
| 41.19 | final closing digest, confirmed distribution rule, debt-first member lines |

## Authorization, Ownership, and Disclosure

### Role-to-operation policy

| Actor | Allowed operations | Ownership and explicit denial |
|---|---|---|
| Deal party/holder | 41.12–41.18 for own/granted resources | Cannot rewrite instrument/term/history, promote proposals, move money, or declare legal effect |
| Accountant/bookkeeper delegate | 41.14–41.18 within mandate | Cannot become holder/issuer, confirm contract terms unless separately named, or change governance |
| Contract document delegate | 41.12 for named deal/instrument purpose | Grant is per document, expiring; no other instrument visibility |
| Authorized deal reviewer | 41.13 within confirm_terms grant | Must have step-up; confirmation is attributed and cannot be delegated implicitly |
| Manager/commission beneficiary | Read granted 41.16 results | Cannot alter rate, scope, sequence, source facts, or execute deduction |
| Band member | 41.18 shared band view; 41.19 if governance-authorized | Cannot see unrelated member finance, privately alter shared rows, or transfer funds |
| Support/admin | Purpose-bound mechanical recovery | Cannot confirm terms, decide credit, change calculations/trust, close P&L, or override hard boundary |
| Service principal | Extraction, scheduler, projection, renderer seam only | No general document/financial visibility or payment authority |

### 403 versus 404

- Visible resource but insufficient action grant returns 403 FORBIDDEN with a safe reasonCode; base authorization failure returns indistinguishable 404 NOT_FOUND.
- Unrelated deal, instrument, term, snapshot, close, member, or source fact is concealed as the same 404 body/details={}, headers, query plan class, and latency bucket as absence.
- Step-up is 401 STEP_UP_REQUIRED only after visibility and base action authorization.
- A beneficiary denied mutation receives 403 because their calculation visibility is known; a stranger receives 404.
- Public/referral artifact token absence, expiry, revocation, and concealed denial are indistinguishable 404.
- Cause-invariance tests compare status, exact ApiError, headers, safe body length class, query count, and latency distribution.

### Security/privacy and professional-boundary invariants

- Documents, citations, term values, financial projections, member debts, lender artifacts, and consent evidence live in restricted schema/storage; events/logs use IDs, digests, versions, bounded enums.
- Raw public/referral tokens are 256-bit random and stored only as keyed digests; no token, document text, cost detail, member amount, or legal language enters logs/events.
- Extracted terms remain untrusted proposals until an authorized human confirms the exact citation/value.
- Referral output says prepared, submittedToProvider=false, and notAnApproval=true; the platform never ranks approval odds or originates a loan.
- Commission and recoupment outputs state movesMoney=false; allocations state movesMoney=false and royaltySplit=false.
- Runway never exposes a reassuring point estimate; low confidence widens range or returns unavailable.
- Catalogue stake sale, securitization, and fan investment requests receive stable OUT_OF_SCOPE_FINANCE refusal with no hidden scaffold.

## Database Schema

All tables are in finance_private. Party references target platform_private.party(id). Producer-owned work, income, settlement, rights, project, tour, and band IDs are logical references validated at use time through typed seams. Direct client table access is forbidden.

### Exhaustive typed table definitions

~~~sql
CREATE TABLE finance_private.deal (
  id uuid PRIMARY KEY,
  owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  current_instrument_version bigint NOT NULL DEFAULT 0 CHECK (current_instrument_version >= 0),
  current_term_version bigint NOT NULL DEFAULT 0 CHECK (current_term_version >= 0),
  state text NOT NULL CHECK (state IN ('active','superseded','closed')),
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE finance_private.deal_instrument (
  id uuid PRIMARY KEY,
  deal_id uuid NOT NULL REFERENCES finance_private.deal(id),
  owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  document_object_ref uuid NOT NULL,
  document_digest text NOT NULL CHECK (document_digest ~ '^[a-f0-9]{64}$'),
  instrument_version bigint NOT NULL CHECK (instrument_version > 0),
  party_ids uuid[] NOT NULL CHECK (cardinality(party_ids) BETWEEN 1 AND 100),
  effective_date date NULL,
  access_policy jsonb NOT NULL CHECK (jsonb_typeof(access_policy)='object'),
  predecessor_instrument_id uuid NULL REFERENCES finance_private.deal_instrument(id),
  stored_by_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  stored_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deal_id, instrument_version),
  UNIQUE (deal_id, document_digest)
);

CREATE TABLE finance_private.term_proposal (
  id uuid PRIMARY KEY,
  deal_id uuid NOT NULL REFERENCES finance_private.deal(id),
  instrument_id uuid NOT NULL REFERENCES finance_private.deal_instrument(id),
  owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  citation jsonb NOT NULL CHECK (jsonb_typeof(citation)='object'),
  term_type text NOT NULL CHECK (term_type IN ('advance_amount','commission_rate','commission_scope','recoupment_sequence','recoupable_cost','obligation_date','distribution_rule','other')),
  proposed_value jsonb NOT NULL CHECK (jsonb_typeof(proposed_value)='object'),
  source_class text NOT NULL CHECK (source_class IN ('manual','extraction')),
  extractor_version text NULL CHECK (extractor_version IS NULL OR length(extractor_version) BETWEEN 1 AND 100),
  confidence numeric(9,6) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  state text NOT NULL CHECK (state IN ('proposed','confirmed','rejected','invalidated')),
  version bigint NOT NULL CHECK (version > 0),
  created_by_party_id uuid NULL REFERENCES platform_private.party(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((source_class='extraction') = (extractor_version IS NOT NULL AND confidence IS NOT NULL))
);

CREATE TABLE finance_private.confirmed_deal_term (
  id uuid PRIMARY KEY,
  deal_id uuid NOT NULL REFERENCES finance_private.deal(id),
  instrument_id uuid NOT NULL REFERENCES finance_private.deal_instrument(id),
  owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  proposal_id uuid NULL REFERENCES finance_private.term_proposal(id),
  citation jsonb NOT NULL CHECK (jsonb_typeof(citation)='object'),
  term_type text NOT NULL CHECK (term_type IN ('advance_amount','commission_rate','commission_scope','recoupment_sequence','recoupable_cost','obligation_date','distribution_rule','other')),
  confirmed_value jsonb NOT NULL CHECK (jsonb_typeof(confirmed_value)='object'),
  source_class text NOT NULL CHECK (source_class IN ('manual','extraction_proposal')),
  confirmed_by_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  confirmed_at timestamptz NOT NULL,
  version bigint NOT NULL CHECK (version > 0),
  supersedes_confirmed_term_id uuid NULL REFERENCES finance_private.confirmed_deal_term(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((source_class='extraction_proposal') = (proposal_id IS NOT NULL)),
  UNIQUE (deal_id, term_type, version)
);

CREATE TABLE finance_private.obligation_alert (
  id uuid PRIMARY KEY,
  deal_id uuid NOT NULL REFERENCES finance_private.deal(id),
  confirmed_term_id uuid NULL REFERENCES finance_private.confirmed_deal_term(id),
  recipient_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  due_date date NOT NULL,
  date_confidence text NOT NULL CHECK (date_confidence IN ('confirmed','unconfirmed')),
  lead_days integer NOT NULL CHECK (lead_days BETWEEN 0 AND 3650),
  policy_version text NOT NULL CHECK (length(policy_version) BETWEEN 1 AND 100),
  state text NOT NULL CHECK (state IN ('scheduled','sent','resolved','failed','cancelled')),
  outcome_code text NULL CHECK (outcome_code IS NULL OR outcome_code ~ '^[A-Z0-9_]{1,64}$'),
  scheduler_job_id uuid NULL,
  resolved_at timestamptz NULL,
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((state='resolved') = (resolved_at IS NOT NULL AND outcome_code IS NOT NULL))
);

CREATE TABLE finance_private.deal_reconciliation_observation (
  id uuid PRIMARY KEY,
  deal_id uuid NOT NULL REFERENCES finance_private.deal(id),
  owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  confirmed_term_id uuid NOT NULL REFERENCES finance_private.confirmed_deal_term(id),
  classification text NOT NULL CHECK (classification IN ('consistent','absence','conflict','unknown')),
  fact_reference jsonb NULL CHECK (fact_reference IS NULL OR jsonb_typeof(fact_reference)='object'),
  term_citation jsonb NOT NULL CHECK (jsonb_typeof(term_citation)='object'),
  reason_code text NOT NULL CHECK (reason_code ~ '^[A-Z0-9_]{1,64}$'),
  legal_conclusion boolean NOT NULL DEFAULT false CHECK (NOT legal_conclusion),
  input_digest text NOT NULL CHECK (input_digest ~ '^[a-f0-9]{64}$'),
  generated_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deal_id, confirmed_term_id, input_digest)
);

CREATE TABLE finance_private.advance_referral (
  id uuid PRIMARY KEY,
  holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  snapshot_id uuid NOT NULL REFERENCES finance_private.financial_snapshot(id),
  snapshot_digest text NOT NULL CHECK (snapshot_digest ~ '^[a-f0-9]{64}$'),
  consent_policy_version text NOT NULL CHECK (length(consent_policy_version) BETWEEN 1 AND 100),
  consent_provider_option_ids uuid[] NOT NULL CHECK (cardinality(consent_provider_option_ids) BETWEEN 1 AND 20),
  consent_expires_at timestamptz NOT NULL,
  expected_term_months integer NOT NULL CHECK (expected_term_months BETWEEN 1 AND 120),
  options jsonb NOT NULL CHECK (jsonb_typeof(options)='array' AND jsonb_array_length(options) BETWEEN 1 AND 20),
  artifact_ref uuid NOT NULL,
  artifact_digest text NOT NULL UNIQUE CHECK (artifact_digest ~ '^[a-f0-9]{64}$'),
  public_token_digest text NOT NULL UNIQUE CHECK (public_token_digest ~ '^[a-f0-9]{64}$'),
  state text NOT NULL CHECK (state IN ('prepared','expired','revoked')),
  declared_income_excluded boolean NOT NULL DEFAULT true CHECK (declared_income_excluded),
  submitted_to_provider boolean NOT NULL DEFAULT false CHECK (NOT submitted_to_provider),
  created_by_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE finance_private.commission_calculation (
  id uuid PRIMARY KEY,
  deal_id uuid NOT NULL REFERENCES finance_private.deal(id),
  holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  source_income_event_id uuid NOT NULL REFERENCES finance_private.income_event(id),
  rate_term_id uuid NOT NULL REFERENCES finance_private.confirmed_deal_term(id),
  scope_term_id uuid NOT NULL REFERENCES finance_private.confirmed_deal_term(id),
  sequence_term_id uuid NULL REFERENCES finance_private.confirmed_deal_term(id),
  rule_effective_date date NOT NULL,
  base_amount_minor bigint NULL CHECK (base_amount_minor IS NULL OR base_amount_minor >= 0),
  commission_amount_minor bigint NULL CHECK (commission_amount_minor IS NULL OR commission_amount_minor >= 0),
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  state text NOT NULL CHECK (state IN ('calculated','held_ambiguity','reversed')),
  hold_reason_codes text[] NOT NULL DEFAULT '{}',
  moves_money boolean NOT NULL DEFAULT false CHECK (NOT moves_money),
  citation_digest text NOT NULL CHECK (citation_digest ~ '^[a-f0-9]{64}$'),
  version bigint NOT NULL CHECK (version > 0),
  reverses_calculation_id uuid NULL REFERENCES finance_private.commission_calculation(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((state='held_ambiguity') = (base_amount_minor IS NULL AND commission_amount_minor IS NULL)),
  CHECK ((state='held_ambiguity') = (cardinality(hold_reason_codes) > 0)),
  CHECK ((state='reversed') = (reverses_calculation_id IS NOT NULL))
);

CREATE TABLE finance_private.recoupment_entry (
  id uuid PRIMARY KEY,
  deal_id uuid NOT NULL REFERENCES finance_private.deal(id),
  holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  source_income_event_id uuid NOT NULL REFERENCES finance_private.income_event(id),
  rule_term_id uuid NOT NULL REFERENCES finance_private.confirmed_deal_term(id),
  citation jsonb NOT NULL CHECK (jsonb_typeof(citation)='object'),
  rule_version bigint NOT NULL CHECK (rule_version > 0),
  sequence integer NOT NULL CHECK (sequence > 0),
  entry_kind text NOT NULL CHECK (entry_kind IN ('debit','credit','reversal')),
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  balance_after_minor bigint NULL,
  reverses_entry_id uuid NULL REFERENCES finance_private.recoupment_entry(id),
  occurred_at timestamptz NOT NULL,
  state text NOT NULL CHECK (state IN ('applied','held_ambiguity')),
  hold_reason_codes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((entry_kind='reversal') = (reverses_entry_id IS NOT NULL)),
  CHECK ((state='applied') = (balance_after_minor IS NOT NULL)),
  CHECK ((state='held_ambiguity') = (cardinality(hold_reason_codes) > 0)),
  UNIQUE (deal_id, source_income_event_id, rule_term_id, sequence, entry_kind)
);

CREATE TABLE finance_private.runway_projection (
  id uuid PRIMARY KEY,
  holder_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  reporting_currency char(3) NOT NULL CHECK (reporting_currency ~ '^[A-Z]{3}$'),
  as_of date NOT NULL,
  horizon_days integer NOT NULL CHECK (horizon_days BETWEEN 30 AND 730),
  input_version bigint NOT NULL CHECK (input_version > 0),
  lower_days integer NULL CHECK (lower_days BETWEEN 0 AND 3650),
  upper_days integer NULL CHECK (upper_days BETWEEN 0 AND 3650),
  confidence text NULL CHECK (confidence IN ('low','medium','high')),
  confidence_floor text NOT NULL CHECK (confidence_floor IN ('low','medium','high')),
  gap_lead_time_days integer NULL CHECK (gap_lead_time_days BETWEEN 0 AND 3650),
  state text NOT NULL CHECK (state IN ('available','unavailable')),
  unavailable_reason text NULL CHECK (unavailable_reason IN ('not_opted_in','insufficient_history','confidence_below_floor','fx_unresolved')),
  point_estimate_withheld boolean NOT NULL DEFAULT true CHECK (point_estimate_withheld),
  input_digest text NOT NULL CHECK (input_digest ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((state='available') = (lower_days IS NOT NULL AND upper_days IS NOT NULL AND confidence IS NOT NULL)),
  CHECK (lower_days IS NULL OR lower_days <= upper_days),
  CHECK (state='available' OR (lower_days IS NULL AND upper_days IS NULL)),
  CHECK ((state='unavailable') = (unavailable_reason IS NOT NULL)),
  UNIQUE (holder_party_id, reporting_currency, as_of, horizon_days, input_version)
);

CREATE TABLE finance_private.budget_overlay (
  id uuid PRIMARY KEY,
  owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  scope_kind text NOT NULL CHECK (scope_kind IN ('project','tour','band')),
  scope_id uuid NOT NULL,
  period_from date NOT NULL,
  period_through date NOT NULL CHECK (period_through >= period_from),
  reporting_currency char(3) NOT NULL CHECK (reporting_currency ~ '^[A-Z]{3}$'),
  planned_rows jsonb NOT NULL CHECK (jsonb_typeof(planned_rows)='array'),
  state text NOT NULL CHECK (state IN ('draft','active','superseded')),
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope_kind, scope_id, version)
);

CREATE TABLE finance_private.pl_projection (
  id uuid PRIMARY KEY,
  owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  scope_kind text NOT NULL CHECK (scope_kind IN ('project','tour','band')),
  scope_id uuid NOT NULL,
  period_from date NOT NULL,
  period_through date NOT NULL CHECK (period_through >= period_from),
  reporting_currency char(3) NOT NULL CHECK (reporting_currency ~ '^[A-Z]{3}$'),
  canonical_row_refs jsonb NOT NULL CHECK (jsonb_typeof(canonical_row_refs)='array'),
  budget_overlay_id uuid NULL REFERENCES finance_private.budget_overlay(id),
  actual_income_minor bigint NOT NULL,
  actual_expense_minor bigint NOT NULL,
  actual_net_minor bigint NOT NULL CHECK (actual_net_minor = actual_income_minor - actual_expense_minor),
  budget_income_minor bigint NULL,
  budget_expense_minor bigint NULL,
  untagged_row_count integer NOT NULL CHECK (untagged_row_count >= 0),
  unreconciled_row_count integer NOT NULL CHECK (unreconciled_row_count >= 0),
  input_digest text NOT NULL CHECK (input_digest ~ '^[a-f0-9]{64}$'),
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope_kind, scope_id, period_from, period_through, version)
);

CREATE TABLE finance_private.member_debt (
  id uuid PRIMARY KEY,
  owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  band_scope_id uuid NOT NULL,
  member_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  source_expense_event_id uuid NOT NULL REFERENCES finance_private.expense_event(id),
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  principal_minor bigint NOT NULL CHECK (principal_minor >= 0),
  outstanding_minor bigint NOT NULL CHECK (outstanding_minor BETWEEN 0 AND principal_minor),
  priority integer NOT NULL CHECK (priority > 0),
  governance_term_id uuid NOT NULL REFERENCES finance_private.confirmed_deal_term(id),
  state text NOT NULL CHECK (state IN ('open','partially_applied','satisfied','disputed')),
  version bigint NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((state='satisfied') = (outstanding_minor=0)),
  CHECK (state='satisfied' OR outstanding_minor>0),
  UNIQUE (band_scope_id, member_party_id, source_expense_event_id)
);

CREATE TABLE finance_private.closing_version (
  id uuid PRIMARY KEY,
  owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  pl_projection_id uuid NOT NULL REFERENCES finance_private.pl_projection(id),
  scope_kind text NOT NULL CHECK (scope_kind IN ('project','tour','band')),
  scope_id uuid NOT NULL,
  period_from date NOT NULL,
  period_through date NOT NULL CHECK (period_through >= period_from),
  reporting_currency char(3) NOT NULL CHECK (reporting_currency ~ '^[A-Z]{3}$'),
  included_rows jsonb NOT NULL CHECK (jsonb_typeof(included_rows)='array' AND jsonb_array_length(included_rows) BETWEEN 1 AND 100000),
  member_debt_ids uuid[] NOT NULL DEFAULT '{}',
  close_kind text NOT NULL CHECK (close_kind IN ('provisional','final')),
  close_policy_version text NOT NULL CHECK (length(close_policy_version) BETWEEN 1 AND 100),
  closed_by_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  closed_at timestamptz NOT NULL,
  version bigint NOT NULL CHECK (version > 0),
  supersedes_closing_version_id uuid NULL REFERENCES finance_private.closing_version(id),
  digest text NOT NULL UNIQUE CHECK (digest ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope_kind, scope_id, version)
);

CREATE TABLE finance_private.allocation_record (
  id uuid PRIMARY KEY,
  owner_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  closing_version_id uuid NOT NULL REFERENCES finance_private.closing_version(id),
  governance_term_id uuid NOT NULL REFERENCES finance_private.confirmed_deal_term(id),
  member_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  debt_applied_minor bigint NOT NULL CHECK (debt_applied_minor >= 0),
  residual_allocation_minor bigint NOT NULL CHECK (residual_allocation_minor >= 0),
  sequence integer NOT NULL CHECK (sequence > 0),
  moves_money boolean NOT NULL DEFAULT false CHECK (NOT moves_money),
  royalty_split boolean NOT NULL DEFAULT false CHECK (NOT royalty_split),
  version bigint NOT NULL CHECK (version > 0),
  recorded_by_party_id uuid NOT NULL REFERENCES platform_private.party(id),
  recorded_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (closing_version_id, member_party_id),
  UNIQUE (closing_version_id, sequence)
);
~~~

Append-only triggers reject UPDATE/DELETE on deal_instrument, confirmed_deal_term, deal_reconciliation_observation, commission_calculation, recoupment_entry, closing_version, and allocation_record. Superseding rows and reversals are the only correction paths. Deal and projection aggregate metadata may update only through version-checked security-definer commands.

### Indexes, RLS, and grants

| Tables | Required query indexes | RLS predicate | Grants |
|---|---|---|---|
| deal, deal_instrument | (owner_party_id, updated_at DESC); (deal_id, instrument_version DESC); document digest; party_ids GIN | owner/deal party or per-document mandate | finance_api command EXECUTE; vault_worker clean-object read; no direct DML |
| term_proposal, confirmed_deal_term | (deal_id, term_type, version DESC); instrument_id; proposal state; confirmer | visible instrument plus proposal/confirm scope; beneficiary read only for granted calculation terms | finance_api command EXECUTE; extraction_worker proposal INSERT only |
| obligation_alert | (recipient_party_id, state, due_date); (deal_id, state); scheduler_job_id | recipient/deal holder; scheduler exact partition | finance_api read/resolve command; alert_worker scheduled transition function |
| deal_reconciliation_observation | (deal_id, generated_at DESC); confirmed_term_id; input_digest | visible deal/term and reconciliation mandate | finance_api command SELECT/INSERT; immutable |
| advance_referral | (holder_party_id, created_at DESC); token digest; (state, consent_expires_at) | holder only; token function returns one artifact | finance_api command; renderer/capability function only; no lender DML |
| commission_calculation, recoupment_entry | (deal_id, created_at DESC); source_income_event_id; term IDs; reversal target; held-state partial indexes | holder/deal calculation grant; beneficiary read-only grant | calculation_worker constrained INSERT; finance_api SELECT; no UPDATE/DELETE |
| runway_projection | (holder_party_id, as_of DESC); unique input key; unavailable reason | holder only with current opt-in | projection_worker INSERT; finance_api SELECT; no delegate by default |
| budget_overlay, pl_projection | (scope_kind, scope_id, version DESC); period; owner; input_digest | scope owner/shared-band member/closing delegate | finance_api versioned command; projection_worker constrained read/write |
| member_debt, closing_version | (band_scope_id, member_party_id, state); source expense; (scope_kind, scope_id, version DESC); digest | shared band sees band rows; unrelated member finance excluded; close delegate by mandate | finance_api close command; no direct closing mutation |
| allocation_record | (closing_version_id, sequence); member_party_id; governance_term_id | shared band members for same close; support purpose grant is read-only | finance_api append command; no transfer worker grant |

Every table uses ENABLE ROW LEVEL SECURITY and FORCE ROW LEVEL SECURITY. Policies require transaction-local app.party_id/app.mandate_id/app.service_id/app.purpose_grant_id and indexed grant joins; missing context denies. migration_role owns tables. anon, authenticated, and generic service roles get no table DML. SECURITY DEFINER commands pin search_path, keep row_security on, validate purpose, and revoke PUBLIC EXECUTE.

### Retention and deletion

- Contract instruments, confirmed terms, calculations, recoupment rows, final closes, debts, and allocations follow contractual/fiscal retention and legal hold; erasure deidentifies optional labels only where lawful and never falsifies history.
- Extraction proposals and transient document text expire within 30 days after confirmation/rejection; document evidence follows instrument retention.
- Reconciliation observations retain cited IDs/digests and bounded reason codes; fetched producer payloads are not copied.
- Advance referral capability/consent expires at the earlier configured limit; artifact is revoked and deleted after retention unless hold exists.
- Runway and provisional P&L projections are disposable and expire after 90 days unless referenced by a close; final closing inputs remain pinned.
- Opt-out deletes future runway eligibility and cached projections while retaining issued/closed legal records.

## State Machines and Deterministic Invariants

| Aggregate | States and transitions | Forbidden and recovery behavior |
|---|---|---|
| Deal/instrument | deal active → closed; current instrument is derived as the chain leaf and becomes historical when a successor references it | Document bytes/version/state never overwrite; replacement requires a new instrument and fresh confirmations |
| Term | proposal proposed → confirmed/rejected/invalidated; confirmed term append → superseded | Extraction never self-confirms; prior term/alerts remain historical |
| Obligation alert | scheduled → sent/failed → resolved/cancelled; failed → scheduled retry | Unconfirmed dates carry label; counterparty inaction remains outcome; scheduler failure is loud |
| Reconciliation | immutable observation set consistent/absence/conflict/unknown | Never auto-corrects producer fact or asserts legal effect |
| Advance referral | prepared → expired/revoked | Never approved/submitted/originated; declared income excluded |
| Commission | held_ambiguity or calculated → reversal successor | Narrow empty scope default; beneficiary/delegate cannot alter inputs; no deduction |
| Recoupment | held_ambiguity or applied → reversal entry | Unspecified sequence blocks; append/reverse only; event-date rule version fixed |
| Runway | unavailable ↔ available disposable projections | No point estimate; low confidence widens/withholds; opt-out invalidates access |
| P&L/close | projection provisional → immutable provisional/final close → superseding close | Late row never mutates close; reopening creates a new version |
| Member debt/allocation | debt open → partially_applied → satisfied/disputed; allocation append-only | Debt priority precedes residual; missing governance rule blocks; no transfer |

Locks are acquired deal/scope → confirmed terms → source fact versions → calculation/close version → idempotency record. PostgreSQL serializable conflicts retry twice at 25 ms and 75 ms jittered backoff. Exhaustion returns 409 CONFLICT with no partial calculation, close, event, artifact, or job.

## Middleware and Policies

BE00 order applies: request ID → proxy normalization → security headers → CORS → body limit → authentication → CSRF → rate → strict validation → tenant/mandate authorization → step-up → idempotency/version → transaction → handler → response validation → audit/metrics.

| Op | CORS | Auth and authorization | Rate | Validation/idempotency |
|---|---|---|---|---|
| 41.12 | first-party-write | creating party, deal party, or per-document delegate | 20/min/party or deal | 64 KiB plus clean uploadRef; conditional If-Match and idempotency |
| 41.13 | first-party-write | visible instrument, confirm_terms grant, recent step-up | 30/min/deal | 128 KiB strict term union; If-Match/idempotency |
| 41.14 | first-party-write | visible deal and reconciliation mandate | 20/min/deal | 256 KiB; fact versions/digests; idempotency |
| 41.15 | first-party-write | holder, current consent, recent step-up | 4/hour/holder | 64 KiB; snapshot digest; idempotency |
| 41.16 | first-party-write | holder calculation authority; beneficiary denied writes | 30/min/deal | 256 KiB; If-Match/idempotency |
| 41.17 | first-party-read | holder only and opt-in | 60/min/holder | strict query; rejects Idempotency-Key |
| 41.18 | first-party-write | scope owner/delegate; step-up on close | 30/min/scope; 6/hour close | 512 KiB; idempotency; If-Match on close |
| 41.19 | first-party-write | final band close plus governance authority and step-up | 6/hour/close | 128 KiB; If-Match/idempotency |

Every row names CORS alongside auth, rate, and validation. Same canonical idempotency hash returns byte-equivalent status/body; key reuse with another hash returns 409 IDEMPOTENCY_MISMATCH. Idempotency protects document append, confirmation, artifacts, calculations/entries, closing versions, events, allocations, and jobs.

## Data Flow, Concurrency, and External Seams

### Operation flows

| Op | Transactional flow and recovery |
|---|---|
| 41.12 | Authorize creating party or existing deal/document → validate clean upload/digest → create deal or lock chain/If-Match → append instrument whose predecessor link makes the prior row non-current without mutation → enqueue extraction proposal → audit/commit |
| 41.13 | Authorize reviewer/step-up → validate instrument/citation/proposal → lock deal term version → append confirmed term → derive alerts with versioned lead policy → outbox event/jobs → commit |
| 41.14 | Lock requested term versions → batch-fetch exact producer facts → verify versions/digests → classify and append cited observations → return; dependency unknown stays unknown |
| 41.15 | Step-up/consent → lock verified immutable snapshot → exclude declared bands → fetch provider disclosures → freeze costs/artifact/capability → commit prepared referral without submitting |
| 41.16 | Lock terms and income/recoupment versions → enforce narrow scope/rate/sequence → append held or calculated rows and outbox events → commit; never calls payment rail |
| 41.17 | Verify holder opt-in → read pinned net-to-me income/outflow/FX inputs → compute confidence/range/gap → insert disposable projection → return unavailable when floor fails |
| 41.18 | Authorize scope → load one canonical row set and optional budget → compute projection → for close lock input version, enforce policy/blockers, pin rows/debts, append close/outbox → commit |
| 41.19 | Step-up → lock final close/digest and governance term → validate debt priority, members, currency, totals → append allocations/audit → commit; no transfer job exists |

### External integration seams

| Seam | Exact request → response | Timeout/retry/circuit contract |
|---|---|---|
| BE00 storage/scanner | {uploadRef, ownerPartyId, expectedDigest, allowedMediaTypes=[PDF,DOCX,image]} → {objectRef,digest,mediaType,scanState=clean} | 3,000 ms; 2 retries at 250/1,000 ms; circuit opens 60 s after 5 failures; non-clean blocks 41.12 |
| Term extraction worker | {instrumentId,objectRef,digest,extractorVersion,termTypeAllowlist} → {proposals:[citation,type,value,confidence],modelVersion} | 20,000 ms job attempt; 3 attempts at 30/120/600 s; circuit opens 5 min after 10 failures; final proposal job failed, never confirmed |
| Shards 14/18/26/28/31 and 41a fact read | {references:[producerShard,factType,factId,version,digest],purpose,requestId} → {facts:[id,version,digest,state,typedPayload]} | 2,000 ms; one batch retry at 200 ms; circuit opens 30 s after 5 failures; 41.14 returns unknown, money/close commands hold |
| Rule/settings service | {settingKeys,effectiveAt,jurisdictionOrScope} → {values:[key,value,version,digest,state]} | 1,000 ms; one retry at 100 ms; circuit opens 30 s after 5 failures; absence fails closed |
| Advance provider disclosure catalog | {providerOptionIds,currency,expectedTermMonths,asOf} → {options:[id,amount,costBasis,totalExpectedCost,disclosureVersion,validThrough]} | 2,000 ms; 2 retries at 200/800 ms; circuit opens 2 min after 5 failures; no referral issued with stale/missing cost |
| Artifact renderer | {kind,dataRef,dataDigest,templateVersion,locale} → {artifactRef,artifactDigest,mediaType,byteSize} | 15,000 ms; 2 retries at 1/4 s keyed by dataDigest; circuit opens 2 min after 5 failures; no prepared artifact row until success |
| Alert scheduler/notification | {alertId,recipientDeliveryRef,dueDate,leadDays,dateConfidence,policyVersion} → {jobId,scheduledAt}; send → {receiptId,acceptedAt} | schedule 2,000 ms, send 5,000 ms; 3 attempts at 5/30/180 s; circuit opens 2 min after 8 failures; alert state failed and pages operator |
| PostgreSQL command RPC | Strict request schema → domain row/outbox/audit/idempotency result | 5,000 ms; only SQLSTATE 40001 retries twice at 25/75 ms; DB circuit opens 15 s after 5 failures; no handler-side partial effect |

No seam sends raw documents except storage-to-extractor by object capability; no seam accepts an underwriting decision or payment instruction. All responses are strict-schema parsed. Circuits emit bounded dependencyClass metrics and preserve typed unknown/held states.

## Event and Consumer Contracts

All events use BE00 envelope fields eventId, eventType, eventVersion=1, occurredAt, producer, aggregateId, aggregateVersion, correlationId, causationId, subjectPartyId, and payload. Domain row, outbox row, audit row, and idempotency result commit atomically. Consumers deduplicate eventId and reject aggregate version gaps to replay/dead-letter recovery.

~~~ts
const ConfirmedTermEventValue = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("money"), currency: Currency, amountMinor: MoneyMinor }).strict(),
  z.object({ kind: z.literal("percentage"), ratio: Ratio }).strict(),
  z.object({ kind: z.literal("date"), date: DateOnly, confirmedDate: z.boolean() }).strict(),
  z.object({
    kind: z.literal("ordered_sequence"),
    steps: z.array(z.object({
      sequence: z.int().positive(),
      classCode: z.string().regex(/^[a-z0-9_]{1,64}$/),
    }).strict()).min(1).max(100),
  }).strict(),
  z.object({
    kind: z.literal("scope"),
    incomeClasses: z.array(z.string().regex(/^[a-z0-9_]{1,64}$/)).min(1).max(100),
    exclusions: z.array(z.string().regex(/^[a-z0-9_]{1,64}$/)).max(100),
  }).strict(),
  z.object({ kind: z.literal("text"), valueDigest: Sha256 }).strict(),
]);

export const FinanceDealTermConfirmedV1 = z.object({
  dealId: Uuid,
  instrumentId: Uuid,
  confirmedTermId: Uuid,
  citation: ClauseCitation,
  termType: z.enum([
    "advance_amount", "commission_rate", "commission_scope", "recoupment_sequence",
    "recoupable_cost", "obligation_date", "distribution_rule", "other"
  ]),
  value: ConfirmedTermEventValue,
  confirmedByPartyId: Uuid,
  version: Version,
}).strict(); // finance.deal_term.confirmed.v1

export const FinanceObligationAlertResolvedV1 = z.object({
  alertId: Uuid,
  dealId: Uuid,
  recipientPartyId: Uuid,
  dueDate: DateOnly,
  leadDays: z.int().min(0).max(3650),
  dateConfidence: z.enum(["confirmed", "unconfirmed"]),
  state: z.enum(["resolved", "cancelled", "failed"]),
  outcomeCode: z.string().regex(/^[A-Z0-9_]{1,64}$/),
  resolvedAt: Instant,
}).strict(); // finance.obligation.alert_resolved.v1

export const FinanceRecoupmentAppendedV1 = z.object({
  entryId: Uuid,
  dealId: Uuid,
  sourceIncomeEventId: Uuid,
  ruleTermId: Uuid,
  citationDigest: Sha256,
  ruleVersion: Version,
  sequence: z.int().positive(),
  entryKind: z.enum(["debit", "credit", "reversal"]),
  amountMinor: NonNegativeMoney,
  currency: Currency,
  balanceAfterMinor: MoneyMinor,
  occurredAt: Instant,
}).strict(); // finance.recoupment.appended.v1

export const FinancePlClosedV1 = z.object({
  scopeKind: z.enum(["project", "tour", "band"]),
  scopeId: Uuid,
  closingVersionId: Uuid,
  version: Version,
  closeKind: z.enum(["provisional", "final"]),
  includedRowCount: z.int().min(1).max(100_000),
  includedRowsDigest: Sha256,
  memberDebtCount: z.int().min(0).max(1000),
  memberDebtIds: z.array(Uuid).max(1000),
  digest: Sha256,
  closedAt: Instant,
}).strict().refine(v => v.memberDebtCount === v.memberDebtIds.length, {
  message: "member_debt_count_must_match_ids",
}); // finance.pl.closed.v1
~~~

Term events carry structured typed values, or a digest for free-text values, plus a locator/digest citation needed by authorized alert/calculation consumers; they never carry raw document text. Other events exclude document content, member-specific amounts, provider/lender identities, referral tokens, runway values, public URLs, and free-text legal/financial advice. Shard 42 may consume ranges/close facts only through authorized reads, not event payload inference.

## Error Handling

### Global status and error rules

| HTTP | Stable codes | Rule |
|---|---|---|
| 400 | INVALID_REQUEST | Malformed path/query/headers/JSON; no mutation |
| 401 | UNAUTHENTICATED, STEP_UP_REQUIRED | Base auth or recent assurance missing |
| 403 | FORBIDDEN | Visible resource but action, mandate, or governance authority denied |
| 404 | NOT_FOUND | Absence and concealed denial are indistinguishable |
| 409 | CONFLICT, VERSION_MISMATCH, IDEMPOTENCY_MISMATCH, INVALID_TRANSITION | Version, replay hash, or state race |
| 413/415 | PAYLOAD_TOO_LARGE, UNSUPPORTED_MEDIA_TYPE | BE00 request/upload enforcement |
| 422 | VALIDATION_FAILED plus domain code | Disclosed semantic invariant failure |
| 429 | RATE_LIMITED | Exact Retry-After and rate details |
| 502/503/504 | DEPENDENCY_UNAVAILABLE | Safe dependencyClass only |
| 500 | INTERNAL_ERROR | details={} and private correlation by requestId |

### Per-operation error matrix

| Op | Domain failures in BE00 ApiError { code, message, requestId, details } | Deterministic recovery |
|---|---|---|
| 41.12 | DOCUMENT_NOT_CLEAN; DOCUMENT_DIGEST_MISMATCH; DEAL_VERSION_CHANGED; PREDECESSOR_REQUIRED | Replace upload or refresh chain; prior instrument unchanged |
| 41.13 | CITATION_INVALID; PROPOSAL_NOT_AUTHORITATIVE; TERM_VALUE_KIND_MISMATCH; REVIEW_AUTHORITY_REQUIRED | Correct citation/value or obtain named reviewer grant |
| 41.14 | FACT_VERSION_CHANGED; FACT_DEPENDENCY_UNAVAILABLE; TERM_SUPERSEDED | Refresh facts/terms; unknown observation is allowed, no correction |
| 41.15 | VERIFIED_SNAPSHOT_REQUIRED; DECLARED_INCOME_PRESENT; CONSENT_SCOPE_MISMATCH; PROVIDER_DISCLOSURE_UNAVAILABLE | Select eligible snapshot/options or renew consent |
| 41.16 | COMMISSION_SCOPE_AMBIGUOUS; RECOUPMENT_SEQUENCE_UNSPECIFIED; TERM_VERSION_CHANGED; INCOME_ORDER_CHANGED | Append held result, confirm terms/order, then recalculate |
| 41.17 | RUNWAY_NOT_OPTED_IN; RUNWAY_CONFIDENCE_INSUFFICIENT; FX_RATE_UNRESOLVED | Return unavailable result or opt in/resolve inputs |
| 41.18 | PL_INPUT_VERSION_CHANGED; UNTAGGED_ROWS_UNACKNOWLEDGED; UNRECONCILED_ROWS_BLOCK_CLOSE; CLOSE_POLICY_CHANGED | Refresh/acknowledge/reconcile; existing close unchanged |
| 41.19 | FINAL_CLOSE_REQUIRED; CLOSING_DIGEST_MISMATCH; GOVERNANCE_RULE_MISSING; MEMBER_DEBT_UNRECONCILED; ALLOCATION_TOTAL_MISMATCH | Refresh close/rule/debts; no allocation or transfer |

All rows use the exact four-field ApiError. Details expose only already-visible stable IDs, safe reasonCode, authorized versions, and recoveryAction. Documents, clauses, terms, costs, member amounts, and provider internals are never echoed.

## Failure Cascades and Partial-State Recovery

| Failure | Durable truth | Recovery |
|---|---|---|
| Extraction misses/garbles clause | Immutable instrument plus failed/proposed term rows | Manual entry remains first-class; human confirms exact citation |
| Replacement instrument arrives | Old instrument/terms/alerts remain historical | Append successor; require new confirmations; cancel/recreate alerts by policy |
| Scheduler fails | obligation_alert state failed and no false send claim | Page immediately; retry same job ID; resolution event only after durable outcome |
| Producer fact unavailable | Terms and prior observations unchanged | 41.14 returns unknown; calculation/close holds where fact is required |
| Referral catalog/renderer fails | No prepared referral/capability row | Idempotent retry after circuit; consent expiry rechecked |
| Calculation worker crashes | Transaction contains all rows/events or none | Replay same key/result; recoupment uniqueness prevents duplicate entry |
| Recoupment order absent | Held entries/calculation with cited reason | Confirm ordered term and recalculate; never choose a platform default |
| Runway inputs sparse/revoked | Unavailable projection or invalidated cached projection | Recompute on new consent/facts; never reuse stale confidence |
| Late expense after close | Existing close remains immutable | New provisional projection and explicit superseding/reopening close |
| Member leaves or grant revokes | Member debt and final allocation evidence remain | Remove future private access per governance; never erase entity obligation |
| Outbox lag | Committed domain truth plus durable outbox | Alert after 60 s; replay idempotently; consumers handle gaps |

## Observability, Rate, and Abuse Controls

| Op | Safe fields and metric | SLO and alert |
|---|---|---|
| 41.12 | opId, action, mediaType, extractionRequested; finance_deal_instrument_total | p95 1.5 s excluding job; scan/error >2% alerts |
| 41.13 | opId, termType, sourceClass, alertsCreated; finance_term_confirm_total | p95 1 s; unauthorized/invalid spike and scheduler failure alert |
| 41.14 | opId, purpose, termCount, factCount, classification counts; finance_reconciliation_total | p95 3 s; dependency unknown >5% alerts |
| 41.15 | opId, optionCount, expectedTermMonths, state; finance_referral_prepare_total | p95 15 s; any declared-income invariant breach pages |
| 41.16 | opId, calculationKind, rowCount, heldReasonCode; finance_calculation_total | p95 3 s/1k rows; ambiguity rate tracked, system error >1% alerts |
| 41.17 | opId, horizonDays, confidenceFloor/result, reasonCode; finance_runway_total | p95 2 s; point-estimate invariant breach pages |
| 41.18 | opId, action, scopeKind, rowCount, blockerCode; finance_pl_projection_total | view p95 3 s; close p95 8 s; conflict/error >2% alerts |
| 41.19 | opId, memberCount, debtCount, result; finance_allocation_total | p95 2 s; any transfer/royalty invariant breach pages |

Logs omit document text, term values, member/provider identities, amounts tied to parties, referral URLs, runway results, and source payloads. Bounded enum metrics prevent cardinality leaks. Traces propagate requestId/correlationId; provider-native diagnostic sinks receive scrubbed exception classes and stable IDs only. Abuse detection watches document churn, confirmation bursts, referral scraping, repeated concealed misses, calculation amplification, and allocation races without inferring financial health.

## Release, Migration, and Recovery

- Apply restricted tables, indexes, RLS, grants, immutable triggers, functions, and registered event schemas before enabling routes.
- Consumers accept current and additive versions before producers emit. Backfills create projections only; they never synthesize confirmed terms, approval, recoupment order, or final close.
- Tenant-scoped flags independently gate vault extraction, referrals, calculations, runway, closing, and allocations while preserving historical reads.
- Rollback disables writers, drains outbox/jobs, verifies no new schema-version events, then rolls handler versions back; additive data stays readable.
- Recovery audits document/term chain versions, citation digests, held calculations, recoupment balances, close digests, debt/allocation totals, capability revocation, RLS isolation, and outbox age.
- Bulk/reconciliation jobs are cursor-based, restartable, purpose-scoped, and use the same RLS/security-definer commands as online operations.

## Testing Strategy

### Per-operation acceptance matrix

| Op | Contract and success test | Auth/CORS/ApiError test | Concurrency and recovery test |
|---|---|---|---|
| 41.12 | Append/replace produces exact immutable DealInstrumentV1 | Cross-deal concealed 404; document delegate scope; CORS/CSRF | Same key one instrument; competing If-Match one winner; extraction failure retained |
| 41.13 | Manual/proposal term kind/citation validates and alerts activate | Reviewer step-up; beneficiary/support mutation denied; ApiError exact | Concurrent confirmations one version; replacement invalidates dependent authority |
| 41.14 | Exact fact versions produce cited consistent/absence/conflict/unknown | Hidden deal/fact cause-invariant; no actor IDs | Fact race conflicts; dependency outage yields unknown without producer mutation |
| 41.15 | Verified-only package shows total cost and no approval/submission | Holder/step-up/consent CORS and ApiError | Consent/snapshot race blocks; renderer failure leaves no referral |
| 41.16 | Explicit scope/rate/sequence calculates and appends/reverses | Beneficiary read-only; hidden terms; ApiError | Missing sequence holds; duplicate events absent; concurrent balance serializes |
| 41.17 | Opt-in sufficient data returns ordered range/confidence/gap | Holder-only; delegate/stranger concealed; GET CORS | Sparse/revoked input unavailable; deterministic cache invalidates |
| 41.18 | Actuals reconcile; optional budget never changes actuals; final close pins rows | Scope/member isolation; step-up on close; ApiError | Late row leaves close fixed; concurrent close one winner and superseding workflow |
| 41.19 | Debt-first lines create record-only allocation with exact totals | Governance authority/step-up; unrelated member hidden | Close/rule/debt race blocks; replay one allocation set; no transfer job |

Additional suites:

- Zod/OpenAPI snapshots prove strict objects, term discriminants, citation pairing, consent equality, ordered sequences, ranges, P&L reconciliation, allocation uniqueness, and unknown-key rejection.
- SQL tests exercise every type/check/FK/unique/index, immutable trigger, held/applied constraints, recoupment reversal, ordered close version, debt bounds, and no-transfer flags.
- RLS tests cover owner, instrument mandate, reviewer, accountant, beneficiary, band member, departed member, expired/revoked grant, support purpose, worker partitions, and unrelated tenant.
- Property tests cover term-type/value mapping, commission scopes, recoupment sequences/reversals/balances, runway ordering/confidence, canonical P&L sums, debt priority, and allocations.
- Event tests validate exact four schemas/envelopes, outbox atomicity, duplicate delivery, gap handling, dead-letter replay, and payload privacy denylist.
- Security tests cover CORS/CSRF, 404 timing equivalence, token entropy/hash/revocation, malicious documents, extractor prompt injection isolation, SSRF-safe object refs, and log redaction.
- Failure-injection tests open every seam circuit, exhaust serializable retries, interrupt render/jobs/outbox, rotate settings, revoke consent/grants, and verify the specified durable truth.
- Load tests cover 100-party documents, 1,000-fact reconciliations/calculations, 100,000-row closes, band hot keys, RLS query plans, and scheduler backlog.

## Deepening Passes

| Pass | Evidence added |
|---|---|
| Contract completeness | All 41.12–41.19 interactions have exact routes, headers, strict schemas, success, ApiError, persistence, effects, and recovery |
| Financial/legal boundary | Human confirmation, citation, referral-only/no-approval, no money movement, no adjudication, no point estimate, and no fan investment are executable invariants |
| Data integrity | Immutable chains, term versions, held ambiguity, reversals, canonical actuals, pinned closes, debt priority, and allocation evidence have Zod plus SQL checks |
| Security/privacy | Per-document grants, step-up, RLS/grants, opaque artifacts, CORS/CSRF, concealed 404, consent, PII/event/log restrictions, and worker partitioning are explicit |
| Reliability/testability | Stable operation IDs key middleware/error/observability/tests; seams have exact timeout/retry/circuit contracts; recovery is deterministic |

## Ambiguity Gate

**PASS.** The approved 41b boundary exactly covers eight interactions, four canonical contracts, thirteen canonical models, four event types, and three features. Every operation has one unique route, strict Zod 4 request/success contracts, the BE00 four-field ApiError, explicit CORS/auth/rate/idempotency/observability/test rows, complete typed SQL/RLS/grants, deterministic concurrency/failure behavior, and enforceable money/legal/advice boundaries. No macro or micro ambiguity remains.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Initial production-grade 41b backend contract authored from approved Shard 41 split | /write-be-spec | All |
| 2026-08-29 | Declared 41.17 pagination N/A and exact nested response cap | D8 remediation | Request and Response Contracts |

## Dependency References

- [BE 00 — Cross-cutting platform foundation](00-infrastructure.md)
- [41a — Income, Tax Readiness & Receivables](41a-income-tax-receivables.md)
- [IA 14 — Services marketplace lifecycle](../ia/14-services-marketplace.md)
- [IA 18 — Royalty registration, ingestion, calculation and payout](../ia/18-royalty-accounting.md)
- [IA 26 — Gear transactions, fulfilment and possession models](../ia/26-gear-commerce-fulfilment.md)
- [IA 28 — Digital licensing, commerce, revocation and revenue](../ia/28-digital-licensing-commerce.md)
- [IA 31 — Agency, settlement and live-market intelligence](../ia/31-live-settlement-intelligence.md)
- [IA 42 — Career planning, insurance and sustainability](../ia/42-career-planning-risk.md)
