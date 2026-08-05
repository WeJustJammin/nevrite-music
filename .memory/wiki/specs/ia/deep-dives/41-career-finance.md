# Deep Dive 41 — Career finance and business operations

**Status:** Complete
**Parent:** [[specs/ia/41-career-finance|Shard 41 — Career finance and business operations]]
**Surface:** Responsive web/PWA

## Overview

This deep dive fixes financial event ordering, trust provenance, issued-instrument immutability, document-derived authority, non-advice boundaries, and versioned closing. The shard explains and packages money facts; it never becomes the ledger that moved funds or an unlicensed actor.

### Convergence Findings

| Pass | Finding | Resolution |
|---|---|---|
| Cross-section | Source ledgers and career totals both need correction history | Subscriber events append/reverse and retain producer source identity |
| What-if | Late payment races dunning send | Payment confidence rechecked at transport lease; unknown/paid halts |
| What-if | Contract extraction changes commission/recoupment | Only confirmed clause-cited term version drives calculation |
| Adversarial | Manager edits rate that pays manager | Beneficiary/delegate denied term/rule mutation; ambiguity holds row |
| Adversarial | Declared import promoted into verified statement | Trust tier emitter-owned; issuance separates trust totals |
| Operations | Late expense after final close | Close immutable; reopen creates superseding version, never restatement |

## Interactions

### Income Ordering and Reconciliation

1. Producer event validates source signature/schema, holder, native components and trust class.
2. Ledger inserts on unique `(producer, source_event_id)` and records producer cursor.
3. Reversal referencing absent predecessor enters `parked_predecessor_missing` and is excluded from totals.
4. Predecessor arrival atomically releases parked reversals in source order and rebuilds affected projections.
5. Off-platform import preview identifies exact/possible overlaps but commits as `declared` only after holder confirmation.
6. Reconciliation links rows or appends exclusion/reversal; it never deletes/merges source evidence.
7. FX projection stores native-row version, rate/date/source and reporting currency. Provider actual may supersede estimate without changing native event.
8. Statement issuance captures one consistent event/FX/reconciliation version and blocks unresolved items.

### Expense, Tax and Withholding

1. Platform-native purchase emits expense candidate with source evidence; upload stores original before extraction.
2. Extraction proposes supplier/date/amount/category/capital flags with confidence and evidence regions.
3. User confirms/corrects; original and proposal remain audit history.
4. Tax pack selects jurisdiction/year rule pack and validates reconciliations, receipts, FX, withholding and exceptions.
5. Unsupported jurisdiction or missing mandatory evidence blocks issuance; no fallback taxonomy.
6. Issued pack is immutable and states preparation-only/non-filing status. Correction creates superseding pack.
7. Withholding/reclaim workflow records deduction/deadline/checklist and alerts; it never submits claim or asserts treaty eligibility.

### Quotes, Invoices and Dunning

1. Draft quote may change; send creates immutable public version with soft expiry.
2. Accepted quote/terms may seed invoice draft, but fiscal fields are revalidated at issuance.
3. Number allocator serializes by issuer/sequence policy and assigns only in same transaction that issues immutable invoice.
4. Correction issues linked credit note/new invoice as jurisdiction policy permits; original remains visible.
5. Delivery/PO/payment events append independently.
6. Dunning scheduler evaluates opt-in, exclusion, due state, delivery/PO blockers and payment confidence.
7. Transport lease immediately rechecks payment state. Paid or unknown cancels lease; only confidently unpaid sends neutral template.
8. Counterparty exclusion cancels pending ladder and cannot be overridden by default policy.

### Contract Terms and Calculations

1. Upload creates immutable instrument digest/version and deal-chain relation; per-document access applies.
2. Extractor emits clause-cited proposals/absence findings but no operative terms.
3. Authorized reviewer confirms manual/proposed term; confirmation pins instrument digest/clause/version.
4. Obligation scheduler over-alerts based on action class and labels unconfirmed dates. Failure creates operations incident.
5. Deal reconciliation compares confirmed terms to source rights/finance projections and emits observations only.
6. Commission calculator applies narrowest confirmed scope. Missing/ambiguous scope/rate/sequence holds event.
7. Recoupment engine appends debit/credit/reversal using event-date rule and clause, then exposes full working.
8. Neither calculation authorizes a transfer or changes source payment ledger.

### P&L, Closing and Allocation

1. Canonical actual events enter project/tour/entity view by source linkage or explainable tag proposal.
2. Untagged/ambiguous rows remain visible and excluded/labeled; budget overlay is optional.
3. Provisional view recomputes over chosen row version and includes losses/member debts.
4. Close preview freezes included rows, debts, distribution rule and exceptions.
5. Authorized close commits immutable `closing_version`; record-only allocations bind its ID.
6. Late event does not mutate close. Reopen records reason and produces superseding close after review.
7. Member-funded debt ranks ahead of profit per governance rule; no payment/distribution command exists.

## Contracts

### Command Results

| Command | Success | Stable refusal / recovery |
|---|---|---|
| `AppendIncomeEvent` | `{eventId, ledgerVersion}` | `duplicate`, `components_unbalanced`, `source_untrusted` |
| `AppendIncomeReversal` | `{reversalId, state}` | Missing predecessor parks; never discarded/applied orphaned |
| `CommitIncomeImport` | `{batchId, declaredRows}` | `preview_stale`, `overlap_unresolved`, `metric_ambiguous` |
| `IssueFinancialSnapshot` | `{snapshotId, verifyUrl, version}` | `duplicate_unresolved`, `fx_unresolved`, `exception_blocking` |
| `ConfirmExpenseEvidence` | `{expenseId, version}` | `evidence_missing`, `revision_conflict` |
| `IssueTaxPack` | `{packId, version, exceptions}` | `jurisdiction_unsupported`, `rule_pack_unavailable`, `blocking_exception` |
| `IssueInvoice` | `{invoiceId, sequence, version}` | `fiscal_field_missing`, `sequence_conflict`, `issuer_denied` |
| `LeaseDunningSend` | `{leaseId, step, expiresAt}` | `paid`, `payment_unknown`, `excluded`, `mechanical_blocker` |
| `ConfirmDealTerm` | `{termId, version, clauseRef}` | `instrument_changed`, `reviewer_denied`, `value_ambiguous` |
| `AppendRecoupmentEntry` | `{entryId, balance, version}` | `sequence_unspecified`, `scope_ambiguous`, `term_unconfirmed` |
| `CloseProfitAndLoss` | `{closingId, version, state}` | `preview_stale`, `unresolved_row`, `governance_rule_missing` |

### Capability Gates

| Gate | Closed behavior | Activation evidence |
|---|---|---|
| `jurisdiction_tax_pack:<id>` | Evidence ledger available; pack/advice unavailable | Qualified tax rule owner, year/version, test cases, disclaimer and review cadence |
| `cross_border_reclaim:<id>` | Record withholding/deadline only; no jurisdiction checklist | Qualified local review and approved form/process sources |
| `advance_referral` | No lender package/transmission | Lending counsel, provider agreement, consent/data-sharing, adverse-action/support model |
| `money_movement_from_calculation` | Permanently absent under current architecture | B3/evolved architecture; calculation can never activate transfer by feature flag |
| `catalogue_finance` | Stable out-of-scope refusal | New ideation, securities/regulatory model and full architecture cascade |

## Data Models

### State Machines

| Aggregate | States |
|---|---|
| Income event | `active → reversed`; late reversal `parked → active_applied`; never edited/deleted |
| Reconciliation | `proposed → linked/excluded/rejected`; proposal has no total effect |
| Snapshot/pack | `issued → superseded/revoked`; payload immutable |
| Quote | `draft → sent → accepted/declined/expired_advisory → superseded` |
| Invoice | `draft → issued → partially_paid/paid/overdue/credited/void_by_instrument`; immutable issue data |
| Dunning | `eligible → leased → sent/blocked/cancelled`; payment state can cancel any pending step |
| Term | `proposed/manual → confirmed → superseded/disputed`; only confirmed active drives calculations |
| Close | `provisional → closing_preview → final`; reopening creates superseding chain |

### Invariants

| Model | Invariant |
|---|---|
| Income event | Native components/trust/source immutable; verified cannot originate from user path |
| FX projection | One native event version and one rate/date/source per component set |
| Invoice sequence | Unique issuer/series/number assigned only on issued instrument |
| Deal term | Instrument digest and clause citation required; no detached rate/sequence setting |
| Recoupment | Entry references source income and active confirmed term/event-date rule |
| P&L | References canonical actual rows; does not copy amount truth |
| Closing version | Included rows/debts/rule immutable; allocation references exactly one close |

Financial documents, receipts, tax IDs and public secrets stay restricted. Export jobs are encrypted, expiring and purpose-audited. Retention/legal hold is record-class policy; erasure never rewrites issued fiscal/evidential history where retention is required.

## Access Control

| Action | Predicate |
|---|---|
| Manage holder ledger | Holder self or explicit finance mandate |
| Set source trust | Producer service only; no user/admin mutation path |
| Issue snapshot/pack | Holder or scoped delegate + step-up; artifact always attributes holder |
| Issue invoice | Supplier entity fiscal mandate + sequence scope |
| Configure dunning | Supplier mandate; counterparty exclusion remains absolute |
| Confirm contract term | Party/document review mandate; beneficiary conflict cannot self-author term |
| Calculate commission | Read confirmed term/source income; beneficiary may view but not mutate rules |
| Close P&L | Scope governance authority + step-up + accepted preview |
| View band allocation | Current member/governed delegate; unrelated personal finance excluded |

RLS keys holder/entity/document/scope. Public links disclose one immutable artifact only. Support grants name one case/instrument and expire. No service role combines document read, calculation mutation and money authority.

## Accessibility

- Financial tables expose currency, sign, gross/deductions/net, trust and reversal links with semantic headers.
- Statement/tax/P&L blockers appear before issue controls and link to exact unresolved row.
- Receipt proposal shows source image region and confidence in text; manual entry remains complete first-class path.
- Invoice sequence, credit note and payment uncertainty use explicit text, never status color alone.
- Dunning opt-in/exclusion/next-send controls are keyboard complete and cancellation preserves focus/context.
- Contract term finding pairs summary with clause link and confirmation state; legal-observation disclaimer is adjacent.
- Runway range has text/table equivalent and avoids fear-inducing countdown/motion.
- Public and exported artifacts preserve headings, tables, locale-aware amount plus ISO currency and WCAG 2.1 AA.

## Event Schemas

### Ordering and Idempotency

| Stream | Rule |
|---|---|
| Income source | Producer sequence; orphan reversals park until predecessor |
| Invoice sequence | Serializable issuer/series allocator; retry returns same issued instrument |
| Receivable | Provider/source order plus confidence; unknown outranks stale unpaid for dunning safety |
| Deal term | Instrument/term revision; superseded term cannot drive later event-date calculations |
| Recoupment | Deal sequence; reversal references prior entry and recomputes balance deterministically |
| Closing | Scope close version; late events create reopen/supersede, never mutate final |

Event envelope includes IDs/versions, occurred/recorded time, correlation, causation and producer. Outbox commit is atomic. Shared events omit banking/card data, document/receipt body, tax ID, address, private clause text and public access token.

## Edge Cases

| Scenario | Required outcome |
|---|---|
| Producer retries same income | Idempotent same event; no duplicate total |
| Reversal amount differs from original | Explicit partial/full reversal validated, never implicit overwrite |
| FX source later corrected | New projection/restate; issued snapshot stays historical or superseded |
| Receipt contains multiple expenses | Parser proposes split; user confirms each, original evidence links all |
| Tax rule changes after filing year | New version does not restate issued prior-year pack |
| Two invoice issues race | Sequence lock serializes; no duplicate/gap from draft |
| Payment arrives during reminder call | Transport recheck cancels lease; provider acceptance uncertainty prevents retry |
| Counterparty excluded mid-ladder | All pending steps cancel; historical sends remain |
| Delegate is contract counterparty | Per-document/term conflict policy denies or requires independent confirmer |
| Contract has no commission scope | Row holds; narrow default may not invent missing scope |
| Sunset rule changes recoupment | Event-date rule version applies; historical entries unchanged |
| Closed tour receives late refund | Final close unchanged; reopen/superseding close exposes delta |
| Band distribution rule changes | Applies only to approved close/version/effective scope; prior allocation evidence remains |
| User requests automatic payment | Stable B3 refusal; provide export/instruction without initiating funds |

## Verification

- **Two-implementer check:** source ordering, trust, instrument states, command refusals, term authority and close supersession are explicit.
- **Devil's-advocate check:** trust promotion, wrongful dunning, delegate self-dealing, default recoupment priority, tax/legal overclaim and shadow transfers are blocked.
- **Bidirectional dependency check:** all commerce/royalty/licensing/live inputs remain source owners; career-planning consumer cannot strengthen finance facts.
- **Complexity check:** below 400-line pass threshold; no split required.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [41-career-finance § Contracts](../41-career-finance.md#contracts) defines commands/queries and [41-career-finance § Event Schemas](../41-career-finance.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | `/decompose-architecture-validate` | All |
| 2026-08-03 | Locked ledger ordering, instrument immutability, calculation authority and closing state | `/write-architecture-spec-deepen` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/41-career-finance|Shard 41 — Career finance and business operations]]
