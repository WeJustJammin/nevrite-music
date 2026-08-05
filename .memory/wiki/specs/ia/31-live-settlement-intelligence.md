# Shard 31 — Agency, settlement and live-market intelligence

**Status:** Complete
**Surface:** Responsive web/PWA
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 31 owns representation-term consumption, commission accrual, show settlement computation/reconciliation/signoff, live-income split instructions, payout/tax readiness records, artist-owned draw history, private guidance, counterparty reliability facts and fan-demand inputs. It evaluates accepted commercial truth from [[specs/ia/30-booking-contracts|Shard 30]], uses shared money/event infrastructure from [[specs/ia/00-infrastructure|Shard 00]], consumes payout/accounting primitives from [[specs/ia/18-royalty-accounting|Shard 18]] without merging live and recording splits, and routes escalated disputes to [[specs/ia/06-trust-safety|Shard 06]].

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 26 |
| Child capabilities | 18 |
| Settlement boundary | Reconcile signed deal expression, counts, expenses and merch into line-level proposed/final versions |
| Money boundary | Compute obligations, accruals, statements and provider references; no multi-payee execution or escrow before B3 |
| Intelligence boundary | Artist-owned verified draw and own-history guidance; cross-account benchmarks disabled before B2 |
| Reliability boundary | Derived counterparty facts shown in qualified contexts, never public reviews or a bare score |
| Fan boundary | Private, aggregate, one-way demand input controlled by the artist; never a message or forecast |
| Launch exclusions | Multi-recipient payout, at-source commission, automatic clawback/netting, automated withholding advice and cross-account market benchmarks |

### Architecture Decisions

| Area | Locked decision |
|---|---|
| Representation | Shard-01 relationship is authoritative. Scope uses the same commercial-domain vocabulary plus territory/work-type constraints; commission basis and sunset are structured/versioned. |
| Commission | Deduction is calculated from the represented party's share and shown derivationally. At-source deduction/fan-out is disabled before B3; agency receives accrual/invoice evidence only. |
| Settlement | Shard-30 expression is evaluated, never re-entered. Every output line preserves formula, inputs, provenance, version and unsettled terms. |
| Counts | Sold, paid admissions and all admissions remain distinct. Ticket/scan/cash/asserted values reconcile per-number; principals never see fan rows. |
| Expenses | Categories/caps are structured. Unreceipted cash is deductible only when accepted deal permits it; otherwise visible and non-deductible. |
| Merch | Show merch is separate from D2C. Bundle allocation and gross/net-of-tax basis must be explicit or the cut remains unresolved. |
| Signoff | Both sides sign one computation version. `sign_under_protest` preserves the undisputed payable floor and quantifies contested ceiling; no platform escrow claim. |
| Amendments | Party-initiated amendments use a versioned policy window; fact-initiated restatements remain possible afterward. All derived draw/reliability/accrual facts fan out by causation. |
| Negative outcome | Artist-owes-operator amounts render as obligations; platform does not auto-collect debtor balances at launch. |
| Live split | Distinct from recording splits. Flat parties settle before share parties; full member-to-member share visibility is required for approval. Version pins atomically at settlement finality. |
| B1/B3 | Split response window is 30 days. Before B3, split drives statements/accrual only and one compliance-cleared entity payee may receive platform money; no individual fan-out or pooled holds. |
| Tax | Prompt, flag, record and evidence; never advise. Cross-border/withholding execution remains disabled until counsel/provider policy exists. |
| Draw | Only bilaterally signed settlement emits append-only performing-entity draw, with mandatory slot and paid-admissions quantity. |
| Draw access | Artist owns raw history. Other party sees only artist-authorized records or privacy-preserving guidance in an active negotiation, never the raw corpus by default. |
| Benchmarks | Cross-account comparables and sparse aggregates remain disabled under B2. Artist-own-history guidance may render ranges with basis/confidence, never a point estimate. |
| Reliability | Show specific settled facts and absence-of-history honestly; force majeure never harms reliability and contesting itself is not negative. |
| Fan demand | Verified-account requests aggregate privately to artist. Promoter visibility is opt-in and remains disabled until B2 privacy/threshold policy; no public counts. |
| Portability | Parties can export their full authorized settlement history in structured format plus accessible PDF; exports are immutable, versioned and non-locking. |

## Features

- **17.08 Agency Representation & Commission** — [ideation source](../ideation/17-live-booking-settlement/17.08-agency-representation-commission/17.08-agency-representation-commission-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **17.09 Settlement & Reconciliation** — [ideation source](../ideation/17-live-booking-settlement/17.09-settlement-reconciliation/17.09-settlement-reconciliation-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **17.10 Live Income Payout & Tax** — [ideation source](../ideation/17-live-booking-settlement/17.10-live-income-payout-tax/17.10-live-income-payout-tax-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **17.11 Draw History & Market Intelligence** — [ideation source](../ideation/17-live-booking-settlement/17.11-draw-history-market-intelligence/17.11-draw-history-market-intelligence-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **17.12 Counterparty Relationship & Payment Reliability** — [ideation source](../ideation/17-live-booking-settlement/17.12-counterparty-relationship-payment-reliability.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **17.13 Fan Demand Signals & Routing Requests** — [ideation source](../ideation/17-live-booking-settlement/17.13-fan-demand-signals.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-31.01 — Configure representation terms:** Given Active scoped Shard-01 edge; parties can bind, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Configure representation terms, and (6) return Structured scope, basis, rate and sunset version append; if the flow cannot complete, Ambiguous `net` or unsupported scope rejects.
- **AC-31.02 — Project agency pipeline:** Given Authorized agency roster scope, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Project agency pipeline, and (6) return Derived stage, confidence and gross/commission/net columns render; if the flow cannot complete, Projection lag is disclosed; no state owned here.
- **AC-31.03 — Accrue commission:** Given Final/provisional settlement and pinned representation version, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Accrue commission, and (6) return Derivation appends against represented-party share; if the flow cannot complete, B3 blocks at-source fan-out; accrual remains statement/invoice.
- **AC-31.04 — Open settlement:** Given Confirmed/performed Shard-30 deal and expression available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Open settlement, and (6) return Proposed sheet version evaluates exact accepted grammar; if the flow cannot complete, Missing/unmodellable terms remain visible and suppress finality.
- **AC-31.05 — Reconcile box office:** Given Authorized aggregates and count sources available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Reconcile box office, and (6) return Sold/paid/all-admissions, tiers, fees, comps and provenance reconcile; if the flow cannot complete, Gap is priced/attributed; platform never adjudicates.
- **AC-31.06 — Capture show expense:** Given Authorized phone capture; category known, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Capture show expense, and (6) return Amount, cap treatment, receipt/assertion and payer append; if the flow cannot complete, Unreceipted item follows accepted deductibility rule.
- **AC-31.07 — Reconcile merch:** Given Count-in/out and cash/statement evidence available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Reconcile merch, and (6) return Sell-through, basis, rate bands, allocation and venue cut compute; if the flow cannot complete, Bundle/basis ambiguity creates unresolved line.
- **AC-31.08 — Recompute settlement:** Given Source input/version changed, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Recompute settlement, and (6) return Explicit new sheet version and variance fan-out append; if the flow cannot complete, Prior signed version remains immutable.
- **AC-31.09 — Contest line:** Given Participant names line/input, basis and exposure, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Contest line, and (6) return Line dispute and evidence attach; undisputed floor remains; if the flow cannot complete, Derived-line contest redirects to causal inputs.
- **AC-31.10 — Sign settlement:** Given Actor has bind authority; version current, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Sign settlement, and (6) return `agreed` or `under_protest` signature appends to exact hash; if the flow cannot complete, Missing adverse-variance explanation blocks owning side.
- **AC-31.11 — Finalize settlement:** Given Both sides signed same version; run policy permits, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Finalize settlement, and (6) return Final settlement and downstream obligations emit; if the flow cannot complete, Open run stays provisional until run close.
- **AC-31.12 — Amend/restatement:** Given Eligible party window or later fact event, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Amend/restatement, and (6) return New version, reason and complete derived fan-out append; if the flow cannot complete, Late party request rejected; factual correction retained.
- **AC-31.13 — Export statement/history:** Given Authorized party; signed/final version exists, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Export statement/history, and (6) return Structured export plus accessible PDF and manifest issue; if the flow cannot complete, Export never includes private other-side trail or fan rows.
- **AC-31.14 — Propose live split:** Given Performing entity/show and eligible participants, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Propose live split, and (6) return Flat/share ordering and prefilled inert proposal publish; if the flow cannot complete, No agreement means no applied split.
- **AC-31.15 — Approve live split:** Given Entity governance satisfied; shares visible, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Approve live split, and (6) return Atomic show split version becomes eligible at settlement finality; if the flow cannot complete, Missing participant/percentage/scope blocks.
- **AC-31.16 — Build payout instruction:** Given Final settlement, split and payee eligibility, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Build payout instruction, and (6) return One-payee launch instruction or gated future recipient instructions; if the flow cannot complete, B3/eligibility failure holds no money; records pending obligation.
- **AC-31.17 — Record payout/tax evidence:** Given Provider or bilateral assertion available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Record payout/tax evidence, and (6) return Discharge, status, withholding/VAT facts and documents append; if the flow cannot complete, Platform gives no tax determination/advice.
- **AC-31.18 — Create verified draw:** Given Bilaterally signed settlement and slot present, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create verified draw, and (6) return Append-only paid-admissions record attaches to performing entity; if the flow cannot complete, Unsigned/protested-unresolved or inferred slot blocks.
- **AC-31.19 — View own draw/guidance:** Given Authorized artist-side actor, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) View own draw/guidance, and (6) return Raw own records and own-history range/basis/confidence render; if the flow cannot complete, Sparse/fast-changing data returns insufficient, not point estimate.
- **AC-31.20 — Share draw in negotiation:** Given Artist grants purpose/time-bound access, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Share draw in negotiation, and (6) return Counterparty receives selected records or derived range; if the flow cannot complete, Revocation stops future reads; accepted snapshot remains auditable.
- **AC-31.21 — View reliability facts:** Given Relevant active/past counterparty context, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) View reliability facts, and (6) return Specific late-pay, cancel, variance and resolution facts render; if the flow cannot complete, No history shows “no history”; no public score.
- **AC-31.22 — Submit fan demand request:** Given Verified fan; artist/location eligible, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Submit fan demand request, and (6) return One-way private aggregate signal records; if the flow cannot complete, Rate/identity abuse dedupes/routes Shard 06.
- **AC-31.23 — Share demand with promoter:** Given Artist opt-in and B2 gate satisfied, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Share demand with promoter, and (6) return Thresholded location/time aggregate becomes booking input; if the flow cannot complete, Below threshold/refused consent renders nothing.

## Interactions

| ID | Interaction | Preconditions | Success | Failure / recovery |
|---|---|---|---|---|
| 31.01 | Configure representation terms | Active scoped Shard-01 edge; parties can bind | Structured scope, basis, rate and sunset version append | Ambiguous `net` or unsupported scope rejects |
| 31.02 | Project agency pipeline | Authorized agency roster scope | Derived stage, confidence and gross/commission/net columns render | Projection lag is disclosed; no state owned here |
| 31.03 | Accrue commission | Final/provisional settlement and pinned representation version | Derivation appends against represented-party share | B3 blocks at-source fan-out; accrual remains statement/invoice |
| 31.04 | Open settlement | Confirmed/performed Shard-30 deal and expression available | Proposed sheet version evaluates exact accepted grammar | Missing/unmodellable terms remain visible and suppress finality |
| 31.05 | Reconcile box office | Authorized aggregates and count sources available | Sold/paid/all-admissions, tiers, fees, comps and provenance reconcile | Gap is priced/attributed; platform never adjudicates |
| 31.06 | Capture show expense | Authorized phone capture; category known | Amount, cap treatment, receipt/assertion and payer append | Unreceipted item follows accepted deductibility rule |
| 31.07 | Reconcile merch | Count-in/out and cash/statement evidence available | Sell-through, basis, rate bands, allocation and venue cut compute | Bundle/basis ambiguity creates unresolved line |
| 31.08 | Recompute settlement | Source input/version changed | Explicit new sheet version and variance fan-out append | Prior signed version remains immutable |
| 31.09 | Contest line | Participant names line/input, basis and exposure | Line dispute and evidence attach; undisputed floor remains | Derived-line contest redirects to causal inputs |
| 31.10 | Sign settlement | Actor has bind authority; version current | `agreed` or `under_protest` signature appends to exact hash | Missing adverse-variance explanation blocks owning side |
| 31.11 | Finalize settlement | Both sides signed same version; run policy permits | Final settlement and downstream obligations emit | Open run stays provisional until run close |
| 31.12 | Amend/restatement | Eligible party window or later fact event | New version, reason and complete derived fan-out append | Late party request rejected; factual correction retained |
| 31.13 | Export statement/history | Authorized party; signed/final version exists | Structured export plus accessible PDF and manifest issue | Export never includes private other-side trail or fan rows |
| 31.14 | Propose live split | Performing entity/show and eligible participants | Flat/share ordering and prefilled inert proposal publish | No agreement means no applied split |
| 31.15 | Approve live split | Entity governance satisfied; shares visible | Atomic show split version becomes eligible at settlement finality | Missing participant/percentage/scope blocks |
| 31.16 | Build payout instruction | Final settlement, split and payee eligibility | One-payee launch instruction or gated future recipient instructions | B3/eligibility failure holds no money; records pending obligation |
| 31.17 | Record payout/tax evidence | Provider or bilateral assertion available | Discharge, status, withholding/VAT facts and documents append | Platform gives no tax determination/advice |
| 31.18 | Create verified draw | Bilaterally signed settlement and slot present | Append-only paid-admissions record attaches to performing entity | Unsigned/protested-unresolved or inferred slot blocks |
| 31.19 | View own draw/guidance | Authorized artist-side actor | Raw own records and own-history range/basis/confidence render | Sparse/fast-changing data returns insufficient, not point estimate |
| 31.20 | Share draw in negotiation | Artist grants purpose/time-bound access | Counterparty receives selected records or derived range | Revocation stops future reads; accepted snapshot remains auditable |
| 31.21 | View reliability facts | Relevant active/past counterparty context | Specific late-pay, cancel, variance and resolution facts render | No history shows “no history”; no public score |
| 31.22 | Submit fan demand request | Verified fan; artist/location eligible | One-way private aggregate signal records | Rate/identity abuse dedupes/routes Shard 06 |
| 31.23 | Share demand with promoter | Artist opt-in and B2 gate satisfied | Thresholded location/time aggregate becomes booking input | Below threshold/refused consent renders nothing |

## Contracts

### Command Contracts

| Command | Required input | Output | Explicit errors |
|---|---|---|---|
| `VersionRepresentationTerms` | edge ref, scope, basis line, rate, sunset, approvals | terms version | `EDGE_INACTIVE`, `SCOPE_INVALID`, `BASIS_UNDEFINED`, `APPROVAL_INCOMPLETE` |
| `OpenSettlement` | accepted deal/expression, show/run, source versions | proposed sheet | `DEAL_NOT_SETTLEABLE`, `EXPRESSION_MISSING`, `TERM_UNEVALUATED` |
| `AppendSettlementInput` | sheet, line/source class, value, provenance, idempotency key | input/recomputed version | `SOURCE_FORBIDDEN`, `PROVENANCE_REQUIRED`, `STALE_VERSION` |
| `ContestSettlementLine` | version/line, basis, quantified exposure, evidence refs | dispute | `LINE_NOT_CONTESTABLE`, `EXPOSURE_INVALID`, `ALREADY_RESOLVED` |
| `SignSettlementVersion` | version hash, outcome, variance explanations, bind proof | signature/finality projection | `VERSION_STALE`, `AUTHORITY_REQUIRED`, `EXPLANATION_REQUIRED` |
| `RestateSettlement` | causal fact, affected version, reason/evidence | new version/fan-out | `CAUSE_UNSUPPORTED`, `LEGAL_HOLD_CONFLICT`, `IDEMPOTENCY_CONFLICT` |
| `ApproveLiveSplit` | show, participant rows, pool scope, governance rule/version | split version | `TOTAL_INVALID`, `PARTICIPANT_INELIGIBLE`, `APPROVAL_INCOMPLETE` |
| `BuildDisbursementInstruction` | final settlement, split, payee eligibility, gate state | instruction/pending obligations | `B3_DISABLED`, `PAYEE_INELIGIBLE`, `TAX_POSTURE_UNKNOWN` |
| `EmitVerifiedDraw` | signed settlement, performing entity, slot, paid admissions | draw record | `NOT_FINAL`, `SLOT_REQUIRED`, `COUNT_PROVENANCE_INSUFFICIENT` |
| `GrantDrawAccess` | artist authority, recipient, scope, purpose, expiry | access grant | `PURPOSE_INVALID`, `SCOPE_TOO_BROAD`, `AUTHORITY_REQUIRED` |
| `EvaluateGuidance` | artist-owned records, candidate market/date/slot | range/basis/confidence | `CORPUS_INSUFFICIENT`, `B2_DISABLED`, `MODEL_INPUT_STALE` |
| `RecordFanDemand` | fan, artist, coarse location/time, anti-abuse proof | private signal/dedupe | `FAN_UNVERIFIED`, `RATE_LIMITED`, `SIGNAL_DUPLICATE` |

### Boundary Rules

- Shard 30 owns accepted deal grammar, contracts, payment schedule obligations and bill identity; this shard evaluates and settles them.
- Shard 18 supplies canonical provider/payout/accounting primitives but recording/royalty splits never govern live income.
- Shard 06 owns escalated dispute/evidence adjudication; line disputes remain local until explicit escalation.
- B2 disables cross-account benchmarks, promoter fan-demand exposure and sparse analytics regardless of data availability.
- B3 disables platform escrow, contested-delta holding, multi-recipient disbursement, at-source commission and automatic clawback/netting.

## Data Models

### Canonical Aggregates

| Aggregate | Key relationships and invariants |
|---|---|
| `RepresentationTermVersion` | Shard-01 edge, commercial-domain/territory/work-type scope, basis line, rate, sunset and approvals |
| `CommissionAccrual` | Booking/settlement, pinned terms, represented-party share, basis derivation, state and invoice/disbursement refs |
| `SettlementSheet` | Deal/expression/show/run refs, version hash, line graph, proposed/signed/final state and payable floor/ceiling |
| `SettlementInput` | Count/expense/merch/payment source, value, provenance grade, device/server times and immutable lineage |
| `SettlementLine` | Formula, inputs, party/pool, amount/currency, evaluability, cap/deductibility and dispute state |
| `SettlementSignature` | Version hash, side, actor/role/authority, agreed/under-protest outcome and required explanations |
| `LineDispute` | Line/input, basis, quantified exposure, evidence, local/escalated state and outcome |
| `LiveSplitVersion` | Show/pools, flat participants, share participants, scope, approvals and settlement-final pin |
| `DisbursementInstruction` | Canonical obligation and provider reference; one-payee or B3-gated multi-recipient posture |
| `TaxEvidence` | Jurisdiction/party declarations, forms, expected/actual withholding and VAT facts; no advice status |
| `VerifiedDrawRecord` | Signed settlement, performing entity, slot, market/date/capacity context and paid-admissions quantity |
| `DrawAccessGrant` | Artist-controlled recipient/purpose/records or derived output, expiry and revocation |
| `GuidanceRun` | Own-history input set, range, basis, recency/confidence and insufficiency reason |
| `ReliabilityFact` | Counterparty/context, settled factual behavior, cause/resolution and permitted audience |
| `FanDemandSignal` | Pseudonymous fan, artist, coarse location/time, weight/dedupe and artist-sharing state |

### State Machines

- Settlement: `proposed → reconciling → signed_one_side → signed_both → final`; alternate `under_protest`, `restated`, `superseded`.
- Line dispute: `open → answered → resolved|escalated|withdrawn`; timeout never escalates automatically.
- Commission: `projected → accrued_provisional → accrued_final → invoiced|eligible_for_future_disbursement → reversed`.
- Split: `proposal_inert → approval_pending → approved → pinned → superseded`.
- Disbursement: `not_enabled|pending_eligibility → instructed → provider_pending → discharged|failed|reversed`; launch may remain record-only.
- Draw access: `active → expired|revoked`; accepted-deal snapshots persist under purpose/retention policy.

### Invariants

- Settlement evaluates the exact pinned grammar version and keeps every unresolved term visible.
- Signed sheet versions and audit inputs are append-only; nobody directly edits trail history.
- Undisputed payable floor remains distinct from contested ceiling even when B3 prevents holding/execution.
- Raw fan rows, fan identities and private side assumptions never enter settlement, draw-sharing or reliability projections.
- Draw records require bilateral settlement finality and explicit slot; no inferred or self-reported “verified” draw.
- Reliability derives from settled facts; a contest, no history or accepted force majeure is never negative by itself.
- All windows, thresholds, caps, materiality and privacy floors reference effective settings or counsel-approved gates.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`Aggregate`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Key relationships and invariants.
- **`RepresentationTermVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Shard-01 edge, commercial-domain/territory/work-type scope, basis line, rate, sunset and approvals.
- **`CommissionAccrual`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Booking/settlement, pinned terms, represented-party share, basis derivation, state and invoice/disbursement refs.
- **`SettlementSheet`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Deal/expression/show/run refs, version hash, line graph, proposed/signed/final state and payable floor/ceiling.
- **`SettlementInput`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Count/expense/merch/payment source, value, provenance grade, device/server times and immutable lineage.
- **`SettlementLine`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Formula, inputs, party/pool, amount/currency, evaluability, cap/deductibility and dispute state.
- **`SettlementSignature`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Version hash, side, actor/role/authority, agreed/under-protest outcome and required explanations.
- **`LineDispute`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Line/input, basis, quantified exposure, evidence, local/escalated state and outcome.
- **`LiveSplitVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Show/pools, flat participants, share participants, scope, approvals and settlement-final pin.
- **`DisbursementInstruction`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Canonical obligation and provider reference; one-payee or B3-gated multi-recipient posture.
- **`TaxEvidence`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Jurisdiction/party declarations, forms, expected/actual withholding and VAT facts; no advice status.
- **`VerifiedDrawRecord`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Signed settlement, performing entity, slot, market/date/capacity context and paid-admissions quantity.
- **`DrawAccessGrant`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Artist-controlled recipient/purpose/records or derived output, expiry and revocation.
- **`GuidanceRun`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Own-history input set, range, basis, recency/confidence and insufficiency reason.
- **`ReliabilityFact`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Counterparty/context, settled factual behavior, cause/resolution and permitted audience.
- **`FanDemandSignal`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Pseudonymous fan, artist, coarse location/time, weight/dedupe and artist-sharing state.

## Access Control

| Actor | Allowed | Denied |
|---|---|---|
| Artist entity/principal | Own settlement lines/trail, split, raw draw, guidance, access grants and demand | Other artist corpus, promoter private costs, fan identities |
| Promoter/operator principal | Shared settlement, own inputs/variance/reliability context and artist-authorized guidance | Raw artist draw by default, artist split/member payouts, fan rows |
| Agent/agency | Scoped roster projection, represented booking settlement and own commission derivation | Non-roster dates, artist internal split beyond required commission basis |
| Band/member approver | Full live split needed to approve residual, own obligations and settlement statement | Other-side internal deductions and tax documents |
| Finance operator | Provider reconcile, eligible instruction and exception workflow under dual control | Edit deal/split/settlement source or mark direct payment confirmed unilaterally |
| Fan | Submit/revoke own demand signal and see receipt | Counts, other fans, promoter routing, settlement/draw |
| Analyst/system worker | Gate-approved aggregate/model execution over allowlisted fields | B2 bypass, row-level export, write-back to draw/artist record |
| Moderator/adjudicator | Escalated evidence/dispute outcome and abuse controls | Settlement signature, split approval, tax advice or market guidance |

- Settlement participants see shared line lineage; artist-side deductions/splits remain artist-side except discharge totals required by payer.
- Draw and demand grants are purpose-limited, expiring, revocable and audited; social relationship alone grants no access.
- Export is field-allowlisted and excludes another party's protected trail, private assumptions and tax/identity records.

### Access Escalation

- **Artist entity/principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Promoter/operator principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Agent/agency:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Band/member approver:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Finance operator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Fan:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Analyst/system worker:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Moderator/adjudicator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Settlement lines expose formula, input provenance, cap/deductibility, dispute and variance in a navigable table plus linear list.
- Count reconciliation names sold, paid admissions and all admissions; charts always have equivalent values and explanations.
- Signoff identifies exact version and changed/adverse lines before action; under-protest reason is required and keyboard reachable.
- Phone expense/receipt capture supports camera and file/text alternatives, offline draft and resumable upload.
- Split approval announces flat-before-share order, residual formula and every participant percentage without relying on pie charts.
- Draw/guidance ranges state basis, sample count, dates and confidence in text; insufficient data is not an empty visualization.
- Export manifests and PDFs are tagged/accessible and have equivalent structured data.
- Demand controls explain privacy/sharing posture and offer non-map location entry.

## Event Schemas

All events include `event_id`, `event_type`, `schema_version`, `occurred_at`, actor/party/authority refs, aggregate/version, correlation/causation/idempotency IDs and privacy class.

| Event | Required payload | Primary consumers |
|---|---|---|
| `settlement.sheet.versioned` | sheet/version, deal/expression, totals, unresolved count | parties, signoff |
| `settlement.input.appended` | sheet/line/input, provenance grade, device/server times | recomputation, audit |
| `settlement.line.disputed` | line/input, exposure, state, case ref | parties, Shard 06 |
| `settlement.signature.changed` | version hash, side, outcome, authority ref | finality gate |
| `settlement.finalized` | sheet/version, payable floor/ceiling, pool totals | commission, split, draw |
| `settlement.restated` | old/new versions, causal fact, monetary/non-money fan-out | all derived consumers |
| `live.commission.changed` | accrual, representation version, basis, state | agency, statements |
| `live.split.changed` | show/split version, scope, approval/pin state | statements, future payout |
| `live.disbursement.changed` | instruction/obligation, gate/provider state, discharge total | finance, payer |
| `live.draw.recorded` | entity/show/slot/market, paid admissions, source version | artist record, guidance |
| `live.draw.access_changed` | grant, recipient/purpose/scope, state | privacy/audit |
| `live.reliability.fact_changed` | counterparty/context, fact/cause/resolution | qualified booking views |
| `live.demand.signal_changed` | artist/coarse market, aggregate eligibility, sharing state | artist, gated routing |

Events carry references rather than receipts, fan rows, tax forms, private split details or raw draw. Consumers order by aggregate version and handle restatement/reversal explicitly.

## Edge Cases

| Scenario | Required behavior |
|---|---|
| Deal contains unmodellable prose | Preserve term, suppress complete finality/breakeven and require bilateral treatment |
| Ticket and scan counts disagree | Show both with provenance and priced gap; no fan-row disclosure or platform ruling |
| Comp issuer exceeds allowance | Charge/flag issuer under deal grammar; never hide inside total admissions |
| Unreceipted cash expense | Apply accepted rule; label unevidenced and permit contest, never fabricate receipt |
| Merch bundle lacks allocation | Leave cut unresolved until bilateral allocation; never choose a favorable band |
| One side signs old version | Reject finality and focus newest adverse changes; old signature remains evidence |
| Dispute affects one line | Preserve undisputed floor and other lines; escalation is explicit act |
| B3-disabled contested delta | Record obligation/ceiling only; do not claim funds are held |
| Negative artist settlement | Render payable obligation and statement; no automatic debtor collection |
| Chargeback after finality | Fact-restatement appends outside party window; creates receivable/reversal record, no automatic clawback |
| Agency relationship ended | Pinned sunset terms determine accrual; current roster view does not rewrite history |
| Split participant unconfirmed after 30 days | Keep unconfirmed obligation pending; B1 does not authorize B3-disabled fan-out or forfeiture |
| Payee account restricted | Mark instruction blocked; payer sees undischarged total, not internal split |
| Withholding uncertain | Flag at offer/settlement and require qualified handling; no rate guess/advice |
| Artist revokes draw access mid-offer | Future reads stop; accepted/sent snapshot remains attributable under purpose policy |
| Sparse own history | Return insufficient or broad range; no cross-account data fallback |
| B2 disabled | Benchmarks, low-count aggregates and promoter demand exposure return feature-gated state |
| Reliability contest pattern | Show resolved facts/causes; do not count vigilance or accepted FM as negative |
| Coordinated fan-demand brigading | Deduplicate/rate-limit/link-analysis under Shard 06; do not publish aggregate |
| Export requested during restatement | Pin export version and mark superseded if newer final version lands |
| Scheduled outage during signoff | Offline draft only; server revalidates version/authority and never backdates signature |

## Surface Applicability

Responsive web/PWA is the sole launch surface. Offline capture is allowed for expense/receipt drafts, but settlement recompute, dispute, signature, split approval, provider reconciliation, draw access and demand sharing require server confirmation. Normal-web reads target p95 ≤2 seconds; signoff and reconciliation operate continuously except scheduled outages.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| 31.01 Configure representation terms | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.02 Project agency pipeline | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.03 Accrue commission | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.04 Open settlement | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.05 Reconcile box office | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.06 Capture show expense | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.07 Reconcile merch | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.08 Recompute settlement | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.09 Contest line | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.10 Sign settlement | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.11 Finalize settlement | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.12 Amend/restatement | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.13 Export statement/history | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.14 Propose live split | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.15 Approve live split | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.16 Build payout instruction | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.17 Record payout/tax evidence | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.18 Create verified draw | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.19 View own draw/guidance | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.20 Share draw in negotiation | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.21 View reliability facts | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.22 Submit fan demand request | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 31.23 Share demand with promoter | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]], [[specs/ia/06-trust-safety|Shard 06]], [[specs/ia/18-royalty-accounting|Shard 18]], [[specs/ia/30-booking-contracts|Shard 30]]
- **Depended on by:** [[specs/ia/34-event-ticketing|Shard 34]], [[specs/ia/41-career-business|Shard 41]]


### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 06:** consume [Shard 06 Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 06 Event Schemas](06-trust-safety.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 18:** consume [Shard 18 Contracts](18-royalty-accounting.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 18 Event Schemas](18-royalty-accounting.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 30:** consume [Shard 30 Contracts](30-booking-contracts.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 30 Event Schemas](30-booking-contracts.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 34:** consume [Shard 34 Contracts](34-event-ticketing.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 34 Event Schemas](34-event-ticketing.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 41:** consume [Shard 41 Contracts](41-career-business.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 41 Event Schemas](41-career-business.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | `/decompose-architecture-structure` | All |
| 2026-08-03 | Authored and deepened complete IA contract | `/write-architecture-spec` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty registration, ingestion, calculation and payout]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
