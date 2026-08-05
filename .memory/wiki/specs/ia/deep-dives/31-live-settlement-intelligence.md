# Deep Dive 31 — Agency, settlement and live-market intelligence

**Status:** Complete
**Parent:** [[specs/ia/31-live-settlement-intelligence|Shard 31]]

## Overview

This deep dive closes line-level settlement provenance, dispute/finality races, B1/B2/B3 behavior, artist-owned draw privacy and causally complete restatement.

## Interactions

### Representation and Commission

1. Resolve active Shard-01 representation edge and author structured commercial-domain, territory, work-type, rate, basis-line and sunset terms.
2. Both principals approve a version. Every booking pins the term version active when representation admitted it.
3. Agency pipeline derives dates/stages/confidence from booking and settlement events and owns no state.
4. At settlement finality, compute commission from the represented party's named share line after the defined deductions.
5. Append provisional/final/reversal derivation and agency statement. Do not vary rate by booking or infer “net.”
6. Before B3, no at-source split or netting occurs; agency invoices/settles externally against recorded accrual.

### Settlement Computation

1. Pin Shard-30 accepted expression, show/run, payment schedule and relevant source versions.
2. Compile a line graph: ticket pools/counts, allowed deductions, guarantee/versus, expenses, merch, commission and party shares.
3. Append each input with provenance grade and both device-asserted/server times.
4. Evaluate under the expression's pinned grammar; never re-enter terms or silently omit uncompiled prose.
5. Produce proposed version with formula, input links, amount/currency, unresolved count and payable floor/contested ceiling.
6. Any source correction explicitly emits a successor version; no background mutation moves believed money.

### Count, Expense and Merch Reconciliation

1. Ingest aggregate ticket statement components, gate scans, comps by issuer, holds/kills with release time and cash assertions.
2. Derive `sold`, `admissions_paid` and `admissions_total` separately by tier/fee recipient; never expose fan rows.
3. Record walk-up evidence or label assertion unevidenced. Platform prices disagreement but never chooses a winner.
4. Capture expenses at source on mobile against controlled category and accepted schedule/cap.
5. Over-cap remains visible and non-deductible. Unreceipted cash follows deal rule and remains lower provenance.
6. Compute merch sell-through from count-in/out and reconcile cash/statement.
7. Require explicit bundle allocation and tax basis; unresolved ambiguity remains a named settlement line.

### Signoff, Dispute and Restatement

1. A dispute names input/line, factual/contract basis and quantified exposure. Derived-line disputes redirect to causal inputs.
2. Local line dispute does not create a Shard-06 case; escalation requires explicit party action.
3. Each side signs exact version as agreed or under protest. Owning side explains every configured-material adverse variance.
4. Two signatures create finality; open cross-collateralized run can record per-show agreement while money remains provisional.
5. Party amendment is allowed within effective settings window and requires both binding chains.
6. Later objective fact—chargeback, corrected count, provider reversal—creates restatement outside that window.
7. Restatement propagates to commission, split obligation, draw, reliability, exports and guidance through causation IDs.

### Live Split and Disbursement

1. Build show-specific split proposal distinct from recording ownership: flat fees first, then percentage participants over declared pools.
2. Show all member shares/residual to approvers; unagreed proposal is inert.
3. Ratification follows entity governance and pins atomically at settlement finality.
4. Generate obligations and statements. One eligible entity payee may receive enabled single-payee platform money.
5. Individual/multi-party fan-out, at-source commission, held contested delta and automatic clawback remain disabled under B3.
6. When B3 eventually enables recipients, confirmed shares may progress while only unconfirmed share stays pending after the approved B1 30-day response window; no forfeiture.

### Draw, Guidance and Reliability

1. Bilaterally signed settlement emits performing-entity record with explicit slot and `admissions_paid`.
2. Artist sees raw append-only history, including poor nights, provenance and any later restatement.
3. Artist may grant selected records or derived range to named counterparty/purpose/time.
4. Own-history guidance renders range, basis, recency, sample and confidence; rising/stale/insufficient inputs widen/refuse.
5. Cross-account corpus and comparables do not execute until B2 consent/privacy floor is approved.
6. Reliability derives specific settled behaviors and resolutions, never a public or bare score. Contesting, no history and accepted force majeure carry no negative inference.

### Fan Demand

1. Verified fan submits one unaddressed request for artist and coarse market/time window.
2. Deduplicate account/device/risk-linked patterns and retain pseudonymous source for abuse response.
3. Artist sees private aggregate only when anti-abuse confidence passes; never a forecast.
4. Artist explicitly opts into promoter sharing. B2 must additionally authorize privacy threshold and lawful use.
5. Promoter receives only thresholded aggregate booking input; no fan identity, message or public count.

## Contracts

### Settlement Line

```text
SettlementLine = {
  line_id,
  version,
  kind,
  party_or_pool_ref,
  formula,
  input_refs[],
  provenance_grade,
  amount,
  currency,
  status: evaluated | unevaluated | non_deductible | contested,
  dispute_ref?,
  causation_id
}
```

Provenance grades are `platform_fact`, `asserted_evidenced`, `asserted_unevidenced`. Grade labels do not adjudicate truth; they determine disclosure and confidence.

### Three-Count Model

| Quantity | Purpose | Exclusions |
|---|---|---|
| `sold` | money reconciliation | refunds/voids under explicit statement semantics |
| `admissions_paid` | verified artist draw | comps, staff and other unpaid bodies |
| `admissions_total` | occupancy/merch per-head | no collapse into paid draw |

Every component names tier, fee recipient, source and version. “Sellout” is invalid without denominator.

### Finality Rule

```text
settlement_final iff
  version == current_proposed_version &&
  both_sides.signed(version_hash) &&
  material_variance_explanations.complete &&
  unresolved_term_policy.satisfied &&
  run_finality_policy.allows
```

`sign_under_protest` can satisfy version acknowledgment while its quantified disputed line remains contested. Finality records agreed floor and contested ceiling separately.

### B-Gate Matrix

| Gate | Locked behavior |
|---|---|
| B1 | unconfirmed-share response window is 30 days; no forfeiture |
| B2 | cross-account benchmarks, sparse aggregates and promoter demand exposure disabled |
| B3 | escrow, pooled/held funds, at-source commission, multi-recipient payout and auto-clawback disabled |

Terms such as `held`, `escrow`, `paid` and `discharged` are reserved for states proven by approved provider/contract semantics. Pending internal obligation is never money custody.

## Data Models

### Lineage Graph

- Deal expression is root commercial authority.
- Inputs attach to leaf facts with immutable source/version.
- Derived lines cite every causal input and formula version.
- Signatures cite complete sheet hash.
- Restatement cites superseded version and objective/approved cause.
- Commission, split obligation, draw, reliability and guidance cite settlement finality/restatement event.
- Export manifest cites exact authorized versions and privacy projection.

### Dispute and Money Partition

- Each dispute scopes one causal input/line and exposure.
- Sheet computes `undisputed_floor` and `contested_ceiling`; values do not imply custody.
- Party can settle undisputed obligation externally or via enabled single-payee rail without resolving contested line.
- Later outcome appends allocation/reversal; no direct edit.
- Escalation creates Shard-06 case with evidence references, not copied files.

### Split Scope

Split row declares `performance`, `show_merch` or both. Flat dep/sideman fee precedes residual shares and references accepted engagement/deal term. Recording/royalty split IDs may be displayed for comparison but never imported as defaults.

### Privacy Projections

- Shared settlement: shared deal/count/expense/merch lines and both signatures.
- Artist-side: live split, member shares, agency deduction and tax documents.
- Operator-side: discharge total and own reliability facts, not recipient fan-out.
- Artist draw: raw history only to artist-authorized actors.
- Guidance: purpose-bound derived range; raw records excluded unless explicitly selected.
- Demand: coarse thresholded aggregate after artist consent and B2, no rows.

## Access Control

### Permission Predicates

```text
may_sign =
  acting_party.binds(settlement.side, amount_bounds) &&
  authority.active_at(commit_time)

may_view_raw_draw =
  actor.controls(performing_entity) ||
  active_draw_grant.includes(actor, record, purpose)

may_export =
  actor.is_party_to(records) &&
  projection.allowlist_applies &&
  legal_hold_and_privacy_checks_pass
```

- Agency access is representation-edge scoped by terms/version; termination removes future roster view but not historical commission evidence.
- Finance users can reconcile provider states and cannot edit line sources, signatures or split.
- Analyst execution runs only on B2-approved projection and cannot write artist records.
- Fan demand abuse reviewers receive pseudonymous risk data only as needed.
- Administrative correction is an append-only fact/restatement with reason and dual control, never a database rewrite.

## Accessibility

- Per-line lineage is the primary audit view; chronological log is secondary and keyboard navigable.
- Variance and dispute screens announce old/new values, formula impact and exposure without color-only cues.
- Signature/under-protest actions state legal/commercial effect in plain language without claiming legal advice.
- Count components and merch allocations support spreadsheet-like keyboard navigation plus linear mobile forms.
- Receipt capture has OCR-independent manual entry and accessible upload progress/error recovery.
- Draw records and guidance can render as tables with all chart data and confidence rationale.
- Privacy grants show recipient, purpose, records, expiry and revoke effect before confirmation.

## Event Schemas

### Ordering and Idempotency

All input, recompute, sign, dispute, restatement, split, obligation, draw and access commands require stable idempotency keys. Same key/different payload fails.

| Race | Resolution |
|---|---|
| Input correction vs signature | version lock makes signature stale; correction emits successor |
| Two sides sign different versions | each signature persists; finality fails until same hash |
| Dispute vs finality | version/state lock includes dispute partition; result records protest/floor/ceiling correctly |
| Chargeback vs amendment-window close | objective fact restates regardless of party window |
| Split approval vs settlement finality | finality pins exact approved split or fails |
| Representation termination vs show settlement | booking-pinned term/sunset decides accrual |
| Provider payout callback vs restatement | callback attaches original instruction; restatement emits reversal/receivable |
| Draw access revoke vs guidance read | grant epoch checked at read; accepted snapshot remains separately authorized |
| Fan deletion vs abuse hold | source pseudonymizes/deletes per lawful hold while aggregate eligibility recomputes |

### Restatement Fan-Out

One `settlement.restated` event references old/new versions and causal fact. Consumers append, never overwrite: commission delta; split obligation delta; discharge/receivable; verified-draw correction; reliability fact correction; guidance invalidation; export supersession. Failed consumer retries from outbox until every projection reaches source aggregate version.

## Edge Cases

### Failure and Recovery Matrix

| Failure | Deterministic recovery |
|---|---|
| Offline receipt has wrong device time | Store both times; server order controls version while device time remains evidence |
| OCR or parser misreads receipt | Draft only; human confirmation required before input append |
| Ticket provider sends corrected statement | Objective restatement versions count and all derived lines |
| Both parties share same natural person | Conflict stamp and separate authority proofs; never infer independent approval |
| Materiality setting changes mid-sheet | Sheet pins policy version; new sheet uses new threshold |
| Under-protest line later resolves | Append resolution and successor final version; old protest remains |
| Commission basis line restates | Commission reversal/accrual delta appends; no silent future netting |
| Agent leaves after booking | Pinned terms/sunset govern; roster access ends according to authority |
| Split totals valid but member cannot onboard | Obligation remains pending; one-payee launch does not fabricate individual payout |
| B3 disabled but UI says “held” | Conformance failure; replace with `contested obligation` and block release |
| Artist asks to delete bad draw | Append-only fact remains under retention basis; correct errors via restatement, not deletion |
| Raw draw grant expires during negotiation | Future reads denied; sent/accepted authorized snapshot retained |
| Guidance corpus is stale/rising-act biased | Widen/refuse range and disclose basis; never supplement with B2-disabled peers |
| Reliability fact later overturned | Restatement retracts/corrects fact and every projection |
| Fan submits many nearby locations | Risk-linked dedupe/weighting prevents multiplication; no public feedback loop |
| Artist revokes promoter demand consent | Future routing projection disappears; audit retains prior lawful grant/use evidence |
| Full-history export is large | Asynchronous expiring artifact with manifest, progress and retry; no truncation |
| Scheduled outage during settlement night | Offline capture drafts only; signoff/finality wait for authoritative server version |

### Two-Implementer Check

Independent implementations must converge on: pinned representation terms; derivational commission; expression-driven line settlement; three distinct counts; line-scoped disputes; same-version bilateral signoff; fact restatement outside party window; B3 record-only money; separate live split; B1 non-forfeiting pending share; artist-owned raw draw; B2-disabled cross-account intelligence; fact-based reliability; and artist-controlled one-way demand. Any implementation that edits audit history, reveals fan rows, publishes scores, calls obligations escrow, auto-claws back, or uses peer data before B2 is non-conformant.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [31-live-settlement-intelligence § Contracts](../31-live-settlement-intelligence.md#contracts) defines commands/queries and [31-live-settlement-intelligence § Event Schemas](../31-live-settlement-intelligence.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | `/decompose-architecture-validate` | All |
| 2026-08-03 | Completed deepening and adversarial convergence | `/write-architecture-spec-deepen` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]
