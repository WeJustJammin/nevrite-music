# Shard 41 — Career finance and business operations

**Status:** Complete
**Surface:** Responsive web/PWA
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 41 owns the subscriber income ledger, declared imports, FX projections, verified income statements, expense/tax-readiness records, quotes/invoices/dunning, immutable contract instruments and confirmed-term alerts, commission/recoupment calculations, runway ranges, and project/tour/band closing views. It consumes commerce/settlement facts from [[specs/ia/14-services-marketplace|Shard 14]], [[specs/ia/18-royalty-accounting|Shard 18]], [[specs/ia/26-gear-commerce-fulfilment|Shard 26]], [[specs/ia/28-digital-licensing-commerce|Shard 28]] and [[specs/ia/31-live-settlement-intelligence|Shard 31]]. It never moves money or replaces accountants, tax authorities, lawyers or lenders.

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 38 |
| Child capabilities | 24 across 23.01–23.04, 23.06 and 23.07 |
| Ledger boundary | Append-only subscriber to source transactions; gross/deductions/net remain separate; user imports remain declared |
| Advice boundary | Tax pack/reclaim preparation and clause observations only; no filing, legal conclusion or jurisdiction fallback |
| Money boundary | Invoices and calculations record obligations; no custody, commission deduction, recoupment transfer or distribution execution under B3 |
| Lending boundary | Verified-data referral only, never underwriting decision/origination; catalogue-stake finance and fan investment excluded |
| Group boundary | Shared visibility, evidence and closing versions; partnership distributions are not royalty splits |

### Architecture Decisions

| Area | Locked decision |
|---|---|
| Income ledger | Events append; corrections reverse. Source trust tier is emitter-assigned and immutable. Ledger subscribes to money owners and never creates payment state. |
| Reconciliation | Platform transaction ID binds authoritative rows; off-platform duplicates are proposed, never auto-merged. Out-of-order reversals park until predecessor. |
| Income fields | Native gross, itemized deductions and net are distinct; net-only imports flag unknown deductions. Income-to-work is a permissioned read projection. |
| Trust | Only platform-observed source facts can be `verified`; imports are permanently `declared`. Verified and declared never merge into one statement headline. |
| FX | Native amount immutable. Estimated/accounting/provider-actual conversions are separate projections; one row uses one rate/date for gross/deductions/net. |
| Statements | Issued immutable snapshot plus hosted verification. Block on unresolved duplicate/FX; delegates generate only as named holder. |
| Expenses | Native purchases create evidence-backed rows. Receipt extraction proposes; user confirms. Capital-treatment prompt is advisory and jurisdiction-rule versioned. |
| Tax | Unsupported jurisdiction fails closed. Tax pack, cross-border withholding facts and deadline alerts prepare evidence but never file or guarantee deductibility/reclaim. |
| Quotes | Sent quote immutable/versioned and accessible to non-user recipient without signup. Expiry is advisory, not enforced. |
| Invoices | Number assigned at issuance; issued invoice immutable; correction is credit note. PO/delivery evidence first-class. |
| Dunning | Neutral platform sender only with explicit owner opt-in. Payment/uncertainty halts ladder; mechanical causes precede tone; counterparty exclusion always wins. |
| Contract vault | Deal is chain of immutable instruments; per-document delegation. Storage/media mechanics remain platform cross-cut. |
| Term extraction | Manual terms first-class. Extraction is a cited proposal requiring confirmation; missing term is reportable finding. |
| Obligations | Over-alert by configurable lead time; unconfirmed date alerts with label. Counterparty inaction is first-class. Scheduler failure is loud. |
| Deal reconciliation | Confirmed terms compare to rights/ledger facts; platform cites differences/absence and never auto-corrects or declares legal effect. |
| Advances | Referral only. Eligible data uses verified income stability/payer diversity; cost shown in money over expected term. No platform credit decision. |
| Commission | Calculation is a stop/check. Scope defaults narrow; ambiguity holds row. Delegate/beneficiary cannot alter rate/scope/sequence; confirmed contract terms govern. |
| Recoupment | Append-only reversing ledger with event-date rule version and clause-cited working. Unspecified sequence blocks. No money movement/adjudication. |
| Runway | Opt-in net-to-me ranges with visible confidence and lead-time gap; no gross runway, gamification, nagging or reassuring point estimate. |
| Catalogue finance | Stake sale/securitization marketplace is out of scope; fan-as-investor rejected. |
| P&L | Actuals-first; budget optional overlay. One canonical row set powers project/tour views; untagged rows explicit. Closing pins version. |
| Band treasury | Member-funded costs are visible debts before profit. Distribution rule captured early from identity governance; record-only allocation, not royalty split or transfer. |
| Configuration | FX sources, tax-year rules, numbering, due/dunning windows, alert lead times, confidence, runway horizons and close policies are typed versioned settings. |

## Features

- **23.01 Income Aggregation & Financial Identity** — [ideation source](../ideation/23-career-finance-business/23.01-income-aggregation-financial-identity/23.01-income-aggregation-financial-identity-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **23.02 Expenses & Tax Readiness** — [ideation source](../ideation/23-career-finance-business/23.02-expenses-tax-readiness/23.02-expenses-tax-readiness-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **23.03 Invoicing & Receivables** — [ideation source](../ideation/23-career-finance-business/23.03-invoicing-receivables/23.03-invoicing-receivables-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **23.04 Deal & Contract Vault** — [ideation source](../ideation/23-career-finance-business/23.04-deal-contract-vault/23.04-deal-contract-vault-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **23.06 Advances, Commission & Recoupment** — [ideation source](../ideation/23-career-finance-business/23.06-advances-commission-recoupment/23.06-advances-commission-recoupment-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **23.07 Budgeting & Project/Tour P&L** — [ideation source](../ideation/23-career-finance-business/23.07-budgeting-project-tour-pl/23.07-budgeting-project-tour-pl-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-41.01 — Ingest income event:** Given Trusted source event/idempotency key, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Ingest income event, and (6) return Immutable verified/observed row appends; if the flow cannot complete, Late reversal parks; duplicate proposes reconciliation.
- **AC-41.02 — Import off-platform income:** Given Holder and supported file/manual entry, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Import off-platform income, and (6) return Declared rows preview then commit; if the flow cannot complete, Overlap stays visible until holder decision.
- **AC-41.03 — View FX projection:** Given Native row and selected reporting currency/date policy, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) View FX projection, and (6) return Estimated/actual conversion shows provenance; if the flow cannot complete, Missing rate yields unresolved, blocks issued statement.
- **AC-41.04 — Issue income statement:** Given Holder/delegate, clean period and complete FX, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Issue income statement, and (6) return Immutable snapshot and verification page publish; if the flow cannot complete, Duplicate/FX blocker refuses issuance.
- **AC-41.05 — Link income to work:** Given Earner permission and candidate work/credit, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Link income to work, and (6) return Read projection attributes without moving facts; if the flow cannot complete, Credit revoke degrades attribution, never deletes income.
- **AC-41.06 — Capture expense/receipt:** Given Holder and purchase/upload, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Capture expense/receipt, and (6) return Evidence row and confirmed fields append; if the flow cannot complete, Extraction failure retains receipt for manual completion.
- **AC-41.07 — Build tax pack:** Given Supported jurisdiction/tax year and reconciled records, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Build tax pack, and (6) return Immutable evidence pack plus exceptions issues; if the flow cannot complete, Unsupported rules/blockers refuse with no generic advice.
- **AC-41.08 — Track withholding/reclaim:** Given Income deduction, territory and confirmed deadline, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Track withholding/reclaim, and (6) return Preparation checklist/alert saves; if the flow cannot complete, No filing/submission or legal eligibility claim.
- **AC-41.09 — Send/revise quote:** Given Authorized supplier entity, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Send/revise quote, and (6) return Immutable sent version and public recipient link; if the flow cannot complete, Revision creates successor; expiry only warns.
- **AC-41.10 — Issue/correct invoice:** Given Accepted terms/customer fields and sequence lock, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Issue/correct invoice, and (6) return Numbered immutable invoice or linked credit note issues; if the flow cannot complete, Missing required fiscal field blocks issuance.
- **AC-41.11 — Run dunning ladder:** Given Opt-in invoice, unpaid fact and no exclusion, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Run dunning ladder, and (6) return Neutral reminder sends and appends evidence; if the flow cannot complete, Payment/unknown status halts; failed send stays explicit.
- **AC-41.12 — Store contract instrument:** Given Authorized party and document evidence, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Store contract instrument, and (6) return Immutable instrument links into deal chain; if the flow cannot complete, Delegation scoped per document; replacement never overwrites.
- **AC-41.13 — Confirm key term:** Given Cited extraction/manual entry and authorized reviewer, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Confirm key term, and (6) return Confirmed term version activates dependent alerts; if the flow cannot complete, Ambiguous/unconfirmed term remains non-authoritative.
- **AC-41.14 — Reconcile deal to facts:** Given Confirmed term and current rights/financial projection, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Reconcile deal to facts, and (6) return Cited observation/absence/conflict renders; if the flow cannot complete, No auto-correction or legal conclusion.
- **AC-41.15 — Prepare advance referral:** Given Holder opt-in and sufficient verified statement, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Prepare advance referral, and (6) return Lender-facing consented package/cost comparison prepares; if the flow cannot complete, Declared income excluded; platform never approves loan.
- **AC-41.16 — Calculate commission/recoupment:** Given Confirmed terms and ordered income events, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Calculate commission/recoupment, and (6) return Clause-cited calculation/reversals append; if the flow cannot complete, Ambiguous scope/sequence holds row.
- **AC-41.17 — View runway:** Given Holder opt-in and confidence-sufficient net cashflow, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) View runway, and (6) return Range and gap lead time render with action routes; if the flow cannot complete, Low confidence withholds reassurance.
- **AC-41.18 — View/close P&L:** Given Authorized project/tour/band and canonical rows, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) View/close P&L, and (6) return Provisional view or immutable closing version; if the flow cannot complete, Untagged/unreconciled rows remain visible/block per policy.
- **AC-41.19 — Record band allocation:** Given Confirmed governance rule, close version and member debts, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Record band allocation, and (6) return Record-only allocation evidence appends; if the flow cannot complete, No transfer; missing rule blocks distribution calculation.

## Interactions

| ID | Interaction | Preconditions | Success | Failure / recovery |
|---|---|---|---|---|
| 41.01 | Ingest income event | Trusted source event/idempotency key | Immutable verified/observed row appends | Late reversal parks; duplicate proposes reconciliation |
| 41.02 | Import off-platform income | Holder and supported file/manual entry | Declared rows preview then commit | Overlap stays visible until holder decision |
| 41.03 | View FX projection | Native row and selected reporting currency/date policy | Estimated/actual conversion shows provenance | Missing rate yields unresolved, blocks issued statement |
| 41.04 | Issue income statement | Holder/delegate, clean period and complete FX | Immutable snapshot and verification page publish | Duplicate/FX blocker refuses issuance |
| 41.05 | Link income to work | Earner permission and candidate work/credit | Read projection attributes without moving facts | Credit revoke degrades attribution, never deletes income |
| 41.06 | Capture expense/receipt | Holder and purchase/upload | Evidence row and confirmed fields append | Extraction failure retains receipt for manual completion |
| 41.07 | Build tax pack | Supported jurisdiction/tax year and reconciled records | Immutable evidence pack plus exceptions issues | Unsupported rules/blockers refuse with no generic advice |
| 41.08 | Track withholding/reclaim | Income deduction, territory and confirmed deadline | Preparation checklist/alert saves | No filing/submission or legal eligibility claim |
| 41.09 | Send/revise quote | Authorized supplier entity | Immutable sent version and public recipient link | Revision creates successor; expiry only warns |
| 41.10 | Issue/correct invoice | Accepted terms/customer fields and sequence lock | Numbered immutable invoice or linked credit note issues | Missing required fiscal field blocks issuance |
| 41.11 | Run dunning ladder | Opt-in invoice, unpaid fact and no exclusion | Neutral reminder sends and appends evidence | Payment/unknown status halts; failed send stays explicit |
| 41.12 | Store contract instrument | Authorized party and document evidence | Immutable instrument links into deal chain | Delegation scoped per document; replacement never overwrites |
| 41.13 | Confirm key term | Cited extraction/manual entry and authorized reviewer | Confirmed term version activates dependent alerts | Ambiguous/unconfirmed term remains non-authoritative |
| 41.14 | Reconcile deal to facts | Confirmed term and current rights/financial projection | Cited observation/absence/conflict renders | No auto-correction or legal conclusion |
| 41.15 | Prepare advance referral | Holder opt-in and sufficient verified statement | Lender-facing consented package/cost comparison prepares | Declared income excluded; platform never approves loan |
| 41.16 | Calculate commission/recoupment | Confirmed terms and ordered income events | Clause-cited calculation/reversals append | Ambiguous scope/sequence holds row |
| 41.17 | View runway | Holder opt-in and confidence-sufficient net cashflow | Range and gap lead time render with action routes | Low confidence withholds reassurance |
| 41.18 | View/close P&L | Authorized project/tour/band and canonical rows | Provisional view or immutable closing version | Untagged/unreconciled rows remain visible/block per policy |
| 41.19 | Record band allocation | Confirmed governance rule, close version and member debts | Record-only allocation evidence appends | No transfer; missing rule blocks distribution calculation |

## Contracts

| Contract | Producer → consumer | Required fields | Errors / invariants |
|---|---|---|---|
| `IncomeEventV1` | Money-owning shards/import → ledger | source ID, holder, native currency, gross, deductions, net, occurred-at, trust/provenance | Append-only; gross-deductions=net or explicit incomplete state |
| `IncomeReversalV1` | Source/reconciliation → ledger | original event, reason, amounts, occurred-at | Cannot precede unknown original in totals |
| `FxProjectionV1` | FX policy/provider → finance views | event, reporting currency, rate/date, source class, converted components | Native unchanged; one rate across row |
| `IssuedFinancialSnapshotV1` | Statement/tax/P&L service → recipient | holder, period, included event/version set, trust bands, exceptions, issued-at | Immutable; corrections supersede |
| `ExpenseEvidenceV1` | Purchase/receipt → expense ledger | holder, native amount, supplier/date, evidence ref, category proposal/confirmation | Extraction never authoritative without confirmation |
| `QuoteVersionV1` | Supplier → counterparty | supplier, lines/terms/currency, expiry, version, public token policy | Sent version immutable |
| `InvoiceInstrumentV1` | Supplier → receivable | issuer/customer, fiscal fields, lines, issue/due dates, sequence, source quote/PO | Issued immutable; correction by credit note |
| `DunningDecisionV1` | Receivable → notification | invoice, payment confidence, ladder step, exclusion, policy version | Unknown/paid/excluded never sends |
| `DealInstrumentV1` | Party → vault | deal, document digest/version, parties, effective date, access policy | Immutable chain; per-document delegation |
| `ConfirmedDealTermV1` | Reviewer → alerts/calculations | instrument/clause citation, term type/value, confidence source, confirmed-by/at | Unconfirmed extraction cannot drive money/legal state |
| `RecoupmentEntryV1` | Calculation → recoupment ledger | deal, source income, rule/clause version, sequence, debit/credit, balance | Append/reverse only; unspecified sequence blocks |
| `ClosingVersionV1` | P&L → allocation | scope, included rows, debts, provisional/final, closed-by/at, version | Allocations bind one closing version |

All mutations carry acting-party authority, expected revision, idempotency key and audit correlation. Provider/payment uncertainty remains pending and stops dunning/calculation finality. Public verification/quote/invoice links are opaque, expiring where appropriate and non-enumerable.

## Data Models

| Entity | Key relationships and constraints |
|---|---|
| `income_event` / `income_reversal` | Holder/source/native components/trust; immutable and source-id unique |
| `income_reconciliation_case` | Candidate duplicates, evidence and explicit holder decision |
| `fx_projection` | Event/reporting currency/rate/date/source class; disposable/versioned |
| `financial_snapshot` / `verification_page` | Immutable period event set, trust totals, exceptions and hosted status |
| `expense_event` / `receipt_evidence` | Native cost, evidence, category confirmation and project tag state |
| `tax_rule_pack` / `tax_pack` | Jurisdiction/year rules and issued evidence snapshot; no filing state |
| `quote` / `quote_version` | Stable offer chain and immutable sent versions |
| `invoice` / `credit_note` / `receivable_event` | Sequence/fiscal instrument and additive delivery/payment/dunning facts |
| `deal` / `deal_instrument` | Deal identity and immutable instrument chain with scoped access |
| `term_proposal` / `confirmed_deal_term` | Clause-cited proposed/manual/confirmed term history |
| `obligation_alert` | Confirmed/unconfirmed date, lead policy, recipient and scheduler state |
| `recoupment_entry` / `commission_calculation` | Clause/rule-versioned additive working and held ambiguity |
| `runway_projection` | Net cashflow input version, range/confidence/gap horizon; disposable |
| `budget_overlay` / `pl_projection` / `closing_version` | Canonical actual row refs, optional plan and immutable close |
| `member_debt` / `allocation_record` | Member-funded cost priority and record-only close-bound allocation |

Financial PII and documents use restricted schemas/storage with RLS, encryption and purpose audit. Source transaction facts remain owned by producer shard; Shard 41 stores immutable subscriber references/events. Retention/deletion follows record class/legal hold; erasure deidentifies where law permits but never falsifies issued instrument history.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`income_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Holder/source/native components/trust; immutable and source-id unique.
- **`income_reversal`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Holder/source/native components/trust; immutable and source-id unique.
- **`income_reconciliation_case`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Candidate duplicates, evidence and explicit holder decision.
- **`fx_projection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Event/reporting currency/rate/date/source class; disposable/versioned.
- **`financial_snapshot`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable period event set, trust totals, exceptions and hosted status.
- **`verification_page`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable period event set, trust totals, exceptions and hosted status.
- **`expense_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Native cost, evidence, category confirmation and project tag state.
- **`receipt_evidence`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Native cost, evidence, category confirmation and project tag state.
- **`tax_rule_pack`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Jurisdiction/year rules and issued evidence snapshot; no filing state.
- **`tax_pack`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Jurisdiction/year rules and issued evidence snapshot; no filing state.
- **`quote`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Stable offer chain and immutable sent versions.
- **`quote_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Stable offer chain and immutable sent versions.
- **`invoice`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Sequence/fiscal instrument and additive delivery/payment/dunning facts.
- **`credit_note`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Sequence/fiscal instrument and additive delivery/payment/dunning facts.
- **`receivable_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Sequence/fiscal instrument and additive delivery/payment/dunning facts.
- **`deal`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Deal identity and immutable instrument chain with scoped access.
- **`deal_instrument`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Deal identity and immutable instrument chain with scoped access.
- **`term_proposal`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Clause-cited proposed/manual/confirmed term history.
- **`confirmed_deal_term`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Clause-cited proposed/manual/confirmed term history.
- **`obligation_alert`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Confirmed/unconfirmed date, lead policy, recipient and scheduler state.
- **`recoupment_entry`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Clause/rule-versioned additive working and held ambiguity.
- **`commission_calculation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Clause/rule-versioned additive working and held ambiguity.
- **`runway_projection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Net cashflow input version, range/confidence/gap horizon; disposable.
- **`budget_overlay`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Canonical actual row refs, optional plan and immutable close.
- **`pl_projection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Canonical actual row refs, optional plan and immutable close.
- **`closing_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Canonical actual row refs, optional plan and immutable close.
- **`member_debt`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Member-funded cost priority and record-only close-bound allocation.
- **`allocation_record`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Member-funded cost priority and record-only close-bound allocation.

## Access Control

| Actor | Allowed | Explicitly denied |
|---|---|---|
| Account holder/entity owner | View/manage own ledgers, instruments, packs, referrals and closes | Promote declared to verified or rewrite issued history |
| Accountant/bookkeeper delegate | Scoped records/packs/statements under mandate | Become issuer/holder, move money or alter governance/contract terms |
| Manager/commission beneficiary | View agreed calculation where granted | Alter rate/scope/sequence or execute deduction |
| Band member | Shared band P&L, member debts and confirmed allocation evidence | Read another member's unrelated finance or privately alter shared rows |
| Quote/invoice/report recipient | Read named immutable public instrument/snapshot | Navigate holder account or other instruments |
| Support/admin | Purpose-bound case or dual-controlled settings | Provide professional advice, change ledger trust, terms or numbered instrument |
| Service principal | One ingestion/projection/notification contract | General financial-document access or payment authority |

Statements, tax packs, CRM-like finance exports, referrals and final close require step-up. Document grants are per document/purpose and expiring. No administrator bypasses B3 money movement or professional-advice boundaries.

### Access Escalation

- **Account holder/entity owner:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Accountant/bookkeeper delegate:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Manager/commission beneficiary:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Band member:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Quote/invoice/report recipient:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Support/admin:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Service principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Every amount includes native currency, gross/deductions/net and trust/provenance text; color never distinguishes verified/declared alone.
- Reversals/restatements appear in chronological accessible tables linked to originals; totals expose reconciliation formula.
- Receipt extraction proposals are labeled and fully editable by keyboard without losing original evidence.
- Tax/contract observations use plain-language non-advice labels and link each finding to jurisdiction rule or clause citation.
- Quote/invoice/public verification pages are server-rendered, printable, keyboard/screen-reader complete and target p95 ≤2 seconds.
- Dunning state names next action, exclusion and payment uncertainty; cancellation is one keyboard action.
- Runway uses range/confidence and text explanation, not a single gauge or alarming animation.
- P&L/allocations expose provisional/final, included-row version, member debts and non-transfer status in text.
- Generated PDF/CSV/HTML packs preserve headings, tables, currency, provenance, exceptions and reading order.

## Event Schemas

| Event | Required payload | Consumers |
|---|---|---|
| `finance.income.appended.v1` | event, holder, source, native components, trust/provenance, occurred-at | FX, statements, P&L |
| `finance.income.reversed.v1` | reversal, original, reason, native components | reconciliation, projections |
| `finance.snapshot.issued.v1` | snapshot, holder, kind, period/version set, exceptions | verification/audit |
| `finance.invoice.issued.v1` | invoice, issuer, sequence, currency/total, due-at | receivable/dunning |
| `finance.receivable.changed.v1` | invoice, payment/delivery state, confidence, occurred-at | dunning, P&L |
| `finance.deal_term.confirmed.v1` | deal/instrument/clause, term type/value, confirmer, version | alerts, commission, recoupment |
| `finance.obligation.alert_resolved.v1` | alert, recipient, due/lead, state/outcome | operations/audit |
| `finance.recoupment.appended.v1` | entry, deal, source event, clause/rule, amount/balance | holder view, P&L |
| `finance.pl.closed.v1` | scope, close version, rows/debts, provisional/final | allocation evidence |

Events are versioned, append-only and at-least-once. Consumers deduplicate by event/source/instrument key. Shared events exclude bank/card data, receipt/document contents, tax IDs, private addresses, public-link secrets and free-text legal/tax advice.

## Edge Cases

- Reversal arrives before income event: park and alert source; never apply negative orphan or discard.
- Net-only statement import: record declared with deductions unknown; tax/verified statement blockers remain visible.
- Actual FX conversion arrives after estimate: native unchanged; provider-actual projection supersedes estimate additively.
- Two imports overlap one platform event: proposal preserves all rows until holder resolves; no auto-merge.
- Delegate issues statement: issuer remains holder and audit names delegate.
- Unsupported tax jurisdiction/year: pack refuses; no generic nearest-country rules.
- Invoice payment provider times out: status uncertain halts dunning, avoiding wrongful chase.
- Credit note crosses tax period: linked immutable instruments preserve both periods; rules determine pack representation.
- Contract replacement signed: new instrument joins deal chain; prior term/alerts remain historical and new confirmations required.
- Extractor misses clause: absence finding remains proposal until human confirms; platform never claims legal omission automatically.
- Commission beneficiary edits source contract metadata: denied; term change requires authorized party confirmation/new instrument.
- Recoupment order absent: rows hold without platform default priority.
- Runway inputs are sparse: wider range or unavailable state, never confident point estimate.
- P&L closes while late expense arrives: closed version stays fixed; later event creates reopening/superseding close workflow.
- Member leaves after funding cost: debt remains entity obligation per close/governance; no private deletion.
- Catalogue/fan-investment request: stable out-of-scope policy refusal, no partial marketplace scaffold.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| 41.01 Ingest income event | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.02 Import off-platform income | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.03 View FX projection | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.04 Issue income statement | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.05 Link income to work | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.06 Capture expense/receipt | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.07 Build tax pack | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.08 Track withholding/reclaim | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.09 Send/revise quote | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.10 Issue/correct invoice | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.11 Run dunning ladder | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.12 Store contract instrument | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.13 Confirm key term | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.14 Reconcile deal to facts | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.15 Prepare advance referral | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.16 Calculate commission/recoupment | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.17 View runway | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.18 View/close P&L | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 41.19 Record band allocation | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]], [[specs/ia/14-services-marketplace|Shard 14]], [[specs/ia/18-royalty-accounting|Shard 18]], [[specs/ia/26-gear-commerce-fulfilment|Shard 26]], [[specs/ia/28-digital-licensing-commerce|Shard 28]], [[specs/ia/31-live-settlement-intelligence|Shard 31]]
- **Depended on by:** [[specs/ia/42-career-planning-risk|Shard 42 — Career planning, insurance and sustainability]]
- **Deep dive:** [[specs/ia/deep-dives/41-career-finance|Deep Dive 41 — Career finance and business operations]]


### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 14:** consume [Shard 14 Contracts](14-services-marketplace.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 14 Event Schemas](14-services-marketplace.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 18:** consume [Shard 18 Contracts](18-royalty-accounting.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 18 Event Schemas](18-royalty-accounting.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 26:** consume [Shard 26 Contracts](26-gear-commerce-fulfilment.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 26 Event Schemas](26-gear-commerce-fulfilment.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 28:** consume [Shard 28 Contracts](28-digital-licensing-commerce.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 28 Event Schemas](28-digital-licensing-commerce.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 31:** consume [Shard 31 Contracts](31-live-settlement-intelligence.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 31 Event Schemas](31-live-settlement-intelligence.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 42 — Career planning, insurance and sustainability:** consume [Shard 42 — Career planning, insurance and sustainability Contracts](42-career-planning-risk.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 42 — Career planning, insurance and sustainability Event Schemas](42-career-planning-risk.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | `/decompose-architecture-structure` | All |
| 2026-08-03 | Locked immutable finance evidence, instrument, recoupment and closing architecture | `/write-architecture-spec` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty registration, ingestion, calculation and payout]]
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
- [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/42-career-planning-risk|Shard 42 — Career planning, insurance and sustainability]]
- [[specs/ia/deep-dives/41-career-finance|Deep Dive 41 — Career finance and business operations]]
