# Live Booking & Settlement — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Live Booking & Settlement](./live-booking-settlement-index.md)
> **Status**: [DEEP] — 14 children; 24 intra-domain cross-cuts synthesised, 7 rejected pairs held.
> **Last updated**: 2026-07-18

> **Reading note.** This file connects the domain's **14 children** (8 sub-domains + 6 features) to
> each other. Leaf-to-leaf edges that live *inside* one child — e.g. `17.01.01 ↔ 17.01.02` (both under
> 17.01), or `17.02.01 ↔ 17.02.02` — are refinements of that child's **own** sub-domain CX file and are
> not repeated here; they are cited only where they change a domain-level edge. The Step-6 pass added
> eight new domain-level edges (CX-17…CX-24) and completed the synthesis the breadth pass deferred.

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [17.03 Deal Structures](./17.03-deal-structures-economics/) | [17.09 Settlement & Reconciliation](./17.09-settlement-reconciliation/) | **The deal structure IS the settlement formula.** The expression compiled at offer time is evaluated months later against real counts | Musician, Operator | High | Domain index D-01 — "settlement is only computable if the offer was structured data" |
| CX-02 | [17.01 Availability, Holds & Confirmation](./17.01-availability-holds-confirmation/) | [17.02 Offers & Negotiation](./17.02-offers-negotiation/) | A hold claims a date; an offer proposes terms. Two clocks, two objects, routinely incoherent with each other | Musician, Operator | High | "Still held, no live offer" is normal; an offer good until Friday on a hold that dies Thursday is undetected |
| CX-03 | [17.02 Offers & Negotiation](./17.02-offers-negotiation/) | [17.04 Performance Contracts](./17.04-performance-contracts-deal-memos.md) | The accepted version generates the contract — terms flow through as data, never retyped | Musician, Operator | High | A retyped contract is a second source of truth that disagrees with the first at settlement |
| CX-04 | [17.04 Performance Contracts](./17.04-performance-contracts-deal-memos.md) | [17.05 Deposits, Balances & Cancellation](./17.05-deposits-balances-cancellation/) | Deposit, balance and cancellation terms are contract terms; execution starts the schedule | Musician, Operator | High | The schedule has no terms until a contract executes |
| CX-05 | [17.05 Deposits, Balances & Cancellation](./17.05-deposits-balances-cancellation/) | [17.01 Availability, Holds & Confirmation](./17.01-availability-holds-confirmation/) | Deposit receipt is an announce precondition; deposit failure reverts the booking — **but does not restore the destroyed holds** | Musician, Operator | High | 17.01 CX-03: confirmation destroys inferior holds irreversibly; revert is compensating, not rollback |
| CX-06 | [17.09 Settlement & Reconciliation](./17.09-settlement-reconciliation/) | [17.10 Live Income Payout & Tax](./17.10-live-income-payout-tax/) | Final signoff is the disbursement trigger; the settled pool is what the split divides | Musician | High | Nothing moves until both parties sign — a proposal is not a payment |
| CX-07 | [17.09 Settlement & Reconciliation](./17.09-settlement-reconciliation/) | [17.08 Agency Representation & Commission](./17.08-agency-representation-commission/) | Commission accrues from the settlement — an amendment after disbursement is a **clawback from a third party** | Musician | High | 17.08.02 DT-02: settlements get amended; agencies have been paid and have spent it |
| CX-08 | [17.09 Settlement & Reconciliation](./17.09-settlement-reconciliation/) | [17.11 Draw History & Market Intelligence](./17.11-draw-history-market-intelligence/) | **Settlement is the generator.** A signed settlement is what makes a draw record verified rather than claimed | Musician, Operator | High | Domain index: settlement is "the source dataset for draw intelligence" |
| CX-09 | [17.09 Settlement & Reconciliation](./17.09-settlement-reconciliation/) | [17.12 Counterparty Relationship & Payment Reliability](./17.12-counterparty-relationship-payment-reliability.md) | Settlement facts derive the reliability record — paid on time, count matched, contested or not | Musician, Operator | High | Domain index: settlement is "the source of payment-reliability reputation" |
| CX-10 | [17.11 Draw History](./17.11-draw-history-market-intelligence/) | [17.03 Deal Structures](./17.03-deal-structures-economics/) | Draw seeds the attendance assumption modelling would otherwise ask the user to guess — **the domain's only feedback loop** | Musician, Operator | High | 17.03.02 DT-03: a modeller with a blank attendance field launders a guess into a curve |
| CX-11 | [17.03 Deal Structures](./17.03-deal-structures-economics/) | [17.05 Deposits, Balances & Cancellation](./17.05-deposits-balances-cancellation/) | Cross-collateralization makes a single date's cancellation non-self-contained | Musician, Operator | Medium | 17.03.03: a cancelled date inside a run changes 11 other dates' economics |
| CX-12 | [17.14 Bill Construction](./17.14-bill-construction-support-slots.md) | [17.10 Live Income Payout & Tax](./17.10-live-income-payout-tax/) | Support fees come **off the top** before the headliner's split — a deduction the single-artist model did not have | Musician | High | 17.14 DT-01: most shows have 2-3 acts on separate deals |
| CX-13 | [17.14 Bill Construction](./17.14-bill-construction-support-slots.md) | [17.11 Draw History](./17.11-draw-history-market-intelligence/) | **The slot qualifier originates here.** 600 as an opener is not a 600 draw | Musician | High | 17.11.01 DT-01: without the slot, the record flatters the artist |
| CX-14 | [17.06 Radius Clause](./17.06-radius-clause-exclusivity.md) | [17.01 Availability, Holds & Confirmation](./17.01-availability-holds-confirmation/) | The radius check fires at **three moments** — publish (warn), hold (warn), confirm (hard block); the artist's own conflicts surface to the artist alone | Musician, Operator | High | 17.06 DT-02/DT-10/DT-12; D-13/D-15; permission asymmetry [30] |
| CX-15 | [17.07 Booking Enquiry Inbox](./17.07-booking-enquiry-inbox-rfq.md) | [17.01 Availability, Holds & Confirmation](./17.01-availability-holds-confirmation/) | Auto-qualification reads published avails; a qualified enquiry converts into a hold — and an **off-platform link recipient's reply lands here as an enquiry** because they cannot self-hold | Musician, Operator | Medium | Invite-only avail scoping complicates the read (17.01.01 Q-02); link-recipient reply [4] |
| CX-16 | [17.13 Fan Demand Signals](./17.13-fan-demand-signals.md) | [17.11 Draw History](./17.11-draw-history-market-intelligence/) | **Opposite provenance** — a settled fact vs an expressed wish. They must never render alike | Musician, Operator, Fan | High | 17.13 DT-02: requesting costs nothing; attending costs £20 and a Tuesday |
| CX-17 | [17.01 Availability, Holds & Confirmation](./17.01-availability-holds-confirmation/) | [17.08 Agency Representation & Commission](./17.08-agency-representation-commission/) | Booking authority gates every hold, publish and confirm; **positions belong to the act, not the placing agent** — representation change carries them, representation *end* freezes the windows | Musician (+ agent lens), Operator | High | [5],[13] — D-11/DT-15, D-15 |
| CX-18 | [17.01 Availability, Holds & Confirmation](./17.01-availability-holds-confirmation/) | [17.12 Counterparty Relationship & Payment Reliability](./17.12-counterparty-relationship-payment-reliability.md) | **The most under-modelled edge in the domain.** The ladder emits reliability facts 17.12 does not yet know exist: hold→confirm conversion, no-response lapse, repudiation, confirm-then-revert | Musician, Operator | High | [8],[21],[37] |
| CX-19 | [17.01 Availability, Holds & Confirmation](./17.01-availability-holds-confirmation/) | [17.14 Bill Construction & Support Slots](./17.14-bill-construction-support-slots.md) | Billing intent **selects the ladder** — support and headline holds never contend; bill shape is an avail field and a "fill date" is usually a support conversation | Musician, Operator | High | [7],[10] — D-05 |
| CX-20 | [17.01 Availability, Holds & Confirmation](./17.01-availability-holds-confirmation/) | [17.11 Draw History](./17.11-draw-history-market-intelligence/) | Draw is an **advisory read** into the ladder and the announce gate — never wired into position assignment; it also explains the guarantee floor/ceiling asymmetry | Musician, Operator | High | [6],[16],[44] — D-03/DT-02 |
| CX-21 | [17.02 Offers & Negotiation](./17.02-offers-negotiation/) | [17.08 Agency Representation & Commission](./17.08-agency-representation-commission/) | The offer fee is **gross to the artist side**; commission comes off it and is invisible to the Operator by design — the outcomes render is role-scoped | Musician (+ agent lens), Operator | High | [25] — DT-06/D-09 |
| CX-22 | [17.02 Offers & Negotiation](./17.02-offers-negotiation/) | [17.03 Deal Structures](./17.03-deal-structures-economics/) | The offer is **composed from the deal grammar**; the T1 tier IS 17.03's vocabulary; computed materiality requires 17.03 to define a per-term polarity | Musician, Operator | High | [32],[45] — D-04/D-05, index Q-08 |
| CX-23 | [17.02 Offers & Negotiation](./17.02-offers-negotiation/) | [17.09 Settlement & Reconciliation](./17.09-settlement-reconciliation/) | Unsettled (T3) free-text terms captured at offer time must surface on the settlement sheet and require **explicit bilateral acknowledgment at signoff** | Musician, Operator | High | [26] — D-05, index Q-02 |
| CX-24 | [17.14 Bill Construction & Support Slots](./17.14-bill-construction-support-slots.md) | [17.02 Offers & Negotiation](./17.02-offers-negotiation/) | A slot offer is a six-field short form authored in 17.02; the promoter's talent budget is **one shared pool**, so headline and support threads are economically coupled though modelled independent | Musician, Operator | Medium | [33],[47] — D-20/DT-05 |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Deal Structures ↔ Settlement & Reconciliation

**Relationship**: The domain's founding edge. An offer's deal terms compile to an evaluable expression
(17.03.01); months later, settlement evaluates that same expression against real counts (17.09.01). No
re-entry, no re-interpretation, no calculator. **This is the entire argument for booking and settlement
being one domain** — split them and the settlement engine has to parse prose.

**Role scoping**:
- **Operator**: authors the terms at offer time and supplies the inputs at settlement. They do not
  compute the number — the formula does, from terms they wrote months ago.
- **Musician**: for the first time arrives at settlement with the same arithmetic the promoter has.
- **Producer** / **Fan**: not affected (the Fan is the count, never sees the arithmetic).

**Synthesis questions answered**:
1. **Shared state conflict**: The expression is owned by the deal and immutable once accepted;
   amendments (17.04) create new versions. Settlement reads the version in force. No merge.
2. **Trigger chain**: Offer accepted → expression stored → show plays → counts arrive → evaluate. If the
   deal carries free-text terms outside the grammar, **the formula silently cannot see them** — the
   chain completes and the number is wrong. Resolved by CX-23 (T3 terms surface and are acknowledged at
   signoff); the residual risk is grammar coverage (index Q-08).
3. **Permission intersection**: Authoring terms does not grant computing the settlement; supplying counts
   does not grant altering the formula. The separation is what makes the number defensible.
4. **Notification fan-out**: Evaluation triggers the widest fan-out in the domain — signoff, then
   disbursement (CX-06), commission (CX-07), draw record (CX-08), reliability (CX-09).
5. **State transition conflict**: Cross-collateralization (17.03.03) makes evaluation **provisional**
   while contradicting 17.09's per-show finality (index Q-02 — the settlement entity's grain).

### CX-02: Availability, Holds & Confirmation ↔ Offers & Negotiation

**Relationship**: A hold claims a date; an offer proposes terms. They travel together and expire
separately, on different clocks. "We're still holding you but the money's off the table" is normal —
which is why they must not be merged (17.02.04 DT-01). The Step-6 pass added a concrete coupling: the
immutable indicative fee captured at hold-request time must surface against the formal offer as a delta
("held at £4,000, offered £2,500") — 17.02 is the consumer of that comparison ([11]).

**Role scoping**:
- **Operator**: places the hold and composes the offer, usually together.
- **Musician**: holds a date whose terms may die under them.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: Separate objects on one date; neither owns the other. The hold-time
   indicative fee is a read-only anchor for the offer, never a binding term.
2. **Trigger chain**: Hold → offer → accept → confirm. A challenge (17.01.03) forces "confirm on real
   terms", which requires a live offer to exist — the hazard is that under a 48h clock an agent confirms
   first and negotiates after (17.01.03 DT-02), whose only disincentive is the confirm-then-revert
   reliability fact of CX-18.
3. **Permission intersection**: Holding position 1 grants no authority to bind the artist — that is the
   entity's, resolved through 01.04 (see CX-17 / the domain-01 authority chain).
4. **Notification fan-out**: Independent; the two clocks warn separately, which is itself confusing —
   offer expiry may exceed hold expiry (warn + one-click hold extension, executed in 17.01.03).
5. **State transition conflict**: **Real and now bounded** — an offer good until Friday on a hold that
   dies Thursday is disclosed on the offer; a hold expiring mid-compose changes the disclosure between
   draft and send ([28]). Sibling offer threads on one date can still race (CX-24 note; [46]).

### CX-03: Offers & Negotiation ↔ Performance Contracts & Deal Memos

**Relationship**: The accepted offer version generates the contract; terms flow through as data, never
retyped. A retyped contract is a second source of truth that disagrees with the first at settlement —
the exact failure the single-domain design exists to prevent.

**Role scoping**:
- **Musician** / **Operator**: both sign; both rely on the contract being the offer, byte-for-byte.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The accepted offer version (an immutable snapshot, 17.02.02 D-13) is the
   single source; the contract is a rendering of it. No independent editable copy exists.
2. **Trigger chain**: Accept → generate contract from the version hash → sign. If generation embeds prose
   rather than referencing the structured version, the contract can drift from the deal — forbidden.
   Async e-signature (the Contracts/E-Signature cross-cut) completes the chain.
3. **Permission intersection**: Signing authority is the entity's (01.04), the same rule that binds the
   offer — see CX-17. An agent who may negotiate may not necessarily bind.
4. **Notification fan-out**: Contract-ready notifies both principals and their approvers; consent-chase
   cadence is the shared Contracts cross-cut.
5. **State transition conflict**: An amendment (17.04) supersedes rather than edits, producing a new
   version the settlement reads (CX-01). A signed contract is immutable evidence.

### CX-04: Performance Contracts & Deal Memos ↔ Deposits, Balances & Cancellation

**Relationship**: Deposit, balance and cancellation terms are contract terms; contract execution starts
the schedule. The schedule has no terms until a contract executes — deposit due-dates, balance timing
and the cancellation tier ladder are all authored in the deal and merely *operated* by 17.05.

**Role scoping**:
- **Operator**: owes the deposit and balance on the contract's schedule.
- **Musician**: their protection (a paid deposit, a forfeit tier) is only as strong as the executed term.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The contract owns the terms; 17.05 owns the *instances* (this invoice, this
   collection). The terms are immutable post-execution; instances have their own lifecycle.
2. **Trigger chain**: Execute → schedule instantiated → deposit invoice raised (17.05.01) → announce gate
   (CX-05). Deposit failure is the revert path. **Bidirectional and previously in conflict** ([39]):
   17.05.01 treated announce-gating as absolute, but the announce gate makes it a Tier-2 waivable-by-two-
   key precondition (P-07) — Step 6 reconciles them.
3. **Permission intersection**: Neither party may unilaterally release a held deposit — which is what
   makes the platform a money transmitter (17.05 Q-01; the Payments/Escrow cross-cut).
4. **Notification fan-out**: Deposit due / paid / overdue notifies both principals; telling the *artist*
   a promoter missed an instalment is the valuable half (17.05.02 DT-02).
5. **State transition conflict**: A deposit that clears then reverses via chargeback *after* announce
   becomes a cancellation event (CX-05; [43]), not a pre-announce revert — different tier, different
   forfeit.

### CX-05: Deposits, Balances & Cancellation ↔ Availability, Holds & Confirmation

**Relationship**: Deposit receipt is an announce precondition (17.01.04); deposit failure reverts the
booking. The asymmetry that matters: **the revert does not restore the holds the confirmation
destroyed.** Those parties have re-routed and moved on.

**Role scoping**:
- **Operator**: pays the deposit; failure triggers the revert.
- **Musician**: their date comes back; the inferior holds destroyed for it do not.
- **Producer**: not affected. **Fan**: not affected here — but is, via domain 19, if this happens
  post-announce.

**Synthesis questions answered**:
1. **Shared state conflict**: The booking is shared; the deposit belongs to the Payments/Escrow cross-cut.
2. **Trigger chain**: Confirm → destroy inferior holds → await deposit → (paid → announce | failed →
   revert). **The revert is a compensating action with permanent collateral damage**, never a rollback.
3. **Permission intersection**: Neither party may unilaterally release a held deposit — the money-
   transmitter boundary (17.05 Q-01).
4. **Notification fan-out**: A revert notifies both principals; the destroyed holds are already gone and
   arguably should be told the date is free again.
5. **State transition conflict**: Non-payment auto-void protects the artist's date and loses shows both
   parties wanted (17.05.01 Q-01).

### CX-06: Settlement & Reconciliation ↔ Live Income Payout & Tax

**Relationship**: Final bilateral signoff is the disbursement trigger; the settled pool is exactly what
the split divides. Nothing moves until both parties sign — a proposal is not a payment.

**Role scoping**:
- **Musician**: the split divides the settled pool among the act's members and payees.
- **Operator**: their obligation is discharged at signoff; the split is on the artist's side.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The settled pool is owned by the settlement (17.09); the split (17.10.01) is
   a separate pinned agreement dividing it. Party ≠ payee — a split can be valid with an unresolved payee
   (a dep with no account); disbursement is what blocks, not the split (domain-01 CX; [61]).
2. **Trigger chain**: Bilateral signoff → disburse via the Payments/Escrow rail. Per-member deductions
   (per diems, float — 18.13.01) land *after* division, costing one member entirely; pool deductions cost
   everyone proportionally ([63]).
3. **Permission intersection**: The split's approval rule is consumed from 01.04, the same rule that binds
   offers (CX-17) — resolve them differently and the platform holds two authority models for one band.
4. **Notification fan-out**: Disbursement notifies every payee; an unresolved payee gets a claim prompt.
5. **State transition conflict**: An amendment after disbursement is a clawback compounded across
   recipients (17.10.02) — the bound on the amendment window (index Q-02) is what makes it tractable.

### CX-07: Settlement & Reconciliation ↔ Agency Representation & Commission

**Relationship**: Commission evaluates against the finalised settlement (17.08.02). The hazard is
temporal: **a settlement can be amended after commission is disbursed** — a miscounted comp, a corrected
box-office number — and that is a clawback from an agency that has been paid and has spent it.

**Role scoping**:
- **Musician**: both the artist (whose money it is) and the agency (whose commission it is) sit on this
  side — the persona strain named in index Q-01.
- **Operator**: not affected — commission comes off the artist's side after their obligation discharges.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The settlement is the source; commission terms are pinned to the version in
   force when the date was booked (17.08.01 D-02).
2. **Trigger chain**: Settlement final → accrue → deduct → disburse. **Amendment after disbursement has no
   clean chain** — index Q-02's amendment window bounds the liability.
3. **Permission intersection**: An agent's authority to *negotiate* is separate from their entitlement to
   *commission*. An agent can be owed commission on a deal they had no authority to bind.
4. **Notification fan-out**: Recomputation notifies the artist and the agency; both may have banked it.
5. **State transition conflict**: The clawback problem, compounded across recipients in 17.10.02.

### CX-08: Settlement & Reconciliation ↔ Draw History & Market Intelligence

**Relationship**: **Settlement is the generator, not a consumer.** A signed settlement emits a draw record
(17.11.01) that exists nowhere else in the industry — verified, slot-qualified (CX-13), and unfalsifiable
because both parties agreed the show happened and how many came. The domain's clearest expression of the
D-18 provenance thesis.

**Role scoping**:
- **Musician**: the record is theirs and is the asset `meta/personas.md` says they need — evidence instead
  of re-proving themselves.
- **Operator**: reads a prospective act's record as decision support, never as a rank.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The record is derived and append-only; nobody writes it directly.
2. **Trigger chain**: Signoff → record → (consent gate) → comparables → guidance. **The gate is a consent
   policy, not a filter** (index Q-07).
3. **Permission intersection**: The artist's own record needs no consent; aggregating across artists needs
   one nobody has written.
4. **Notification fan-out**: None — and that is the problem. Nobody is told their data informed a
   competitor's decision.
5. **State transition conflict**: An amended settlement moves a record that may already sit in a spent
   benchmark.

### CX-09: Settlement & Reconciliation ↔ Counterparty Relationship & Payment Reliability

**Relationship**: Settlement facts derive the reliability record — paid on time, count matched, contested
or not. A star rating is a memory; a payment record is evidence (index D-09). This is the settlement-half
of reliability; the *booking*-half arrives from the ladder via CX-18.

**Role scoping**:
- **Musician** / **Operator**: both accrue a reliability history from settled facts.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: Reliability is derived and append-only; no party edits it directly. It reads
   settled facts, never the other way round.
2. **Trigger chain**: Signoff (or its absence) → derive fact (paid_on_time, count_matched, contested).
   A protest reason (17.09.05) is permanent, counterparty-visible and exportable — the longest-reach
   adversarial free-text field in the domain (domain-24 CX; [57]).
3. **Permission intersection**: A reliability score **informs humans; it does not price deals** (R-06).
   Exposure of one's own record vs a counterparty's is role-scoped.
4. **Notification fan-out**: A derived negative fact (a missed instalment, a disputed line) notifies the
   injured party — the valuable half of the notification.
5. **State transition conflict**: A settlement amendment restates a fact a reliability score already
   consumed — the same restatement problem as CX-08, propagated to reputation.

### CX-10: Draw History & Market Intelligence ↔ Deal Structures

**Relationship**: The domain's **only feedback loop**, and what makes it compound rather than repeat.
Settlement emits draw (CX-08); draw seeds modelling's attendance range (17.03.02); better modelling
produces better deals; better deals settle into better records.

**Role scoping**:
- **Musician** / **Operator**: both model from the same history with their own private cost assumptions.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: None — guidance is a pure read and **never writes back to the record**
   (17.11 R-01). Model output must not pollute settled facts.
2. **Trigger chain**: Records accumulate → seed modelling → inform offers. **Cold start breaks it** (no
   corpus, no seed — 17.11 Q-02). Related-party and unverified off-platform prices are excluded from the
   corpus so a self-dealt price is not a market signal ([29]).
3. **Permission intersection**: Own-record guidance is clean; comparable-based guidance inherits the
   consent question (index Q-07).
4. **Notification fan-out**: None.
5. **State transition conflict**: None — but the loop's value is a function of corpus size, which makes
   several features weaker than they look at launch.

### CX-11: Deal Structures ↔ Deposits, Balances & Cancellation

**Relationship**: Cross-collateralization (17.03.03) makes a single date's cancellation non-self-contained
— a cancelled date inside a run changes the economics of the other dates.

**Role scoping**:
- **Musician** / **Operator**: both feel a run's economics move when one date dies.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered** *(Medium confidence — validated at deepening)*:
1. **Shared state conflict**: The run's economics are shared state across its dates; a per-date cancel
   cannot be resolved in isolation, forcing the run to be the settlement grain (index Q-02).
2. **Trigger chain**: Cancel a date → recompute the run's cross-collateralized guarantee → re-tier the
   cancellation forfeit. Partly why per-show finality is arithmetically impossible for runs.
3. **Permission intersection**: A cancellation on one date is authored by whoever holds the cancellation
   right on *that* contract, but its economic effect crosses contracts — a real hazard.
4. **Notification fan-out**: A cancel notifies the run's counterparties whose numbers moved.
5. **State transition conflict**: The unresolved grain question (Q-02) — provisional vs per-show-final +
   true-up — is exactly this race.

### CX-12: Bill Construction & Support Slots ↔ Live Income Payout & Tax

**Relationship**: Support fees come **off the top** before the headliner's split — a deduction the sweep's
single-artist model did not have (17.14 DT-01: most shows have 2-3 acts on separate deals).

**Role scoping**:
- **Musician**: the headliner's dividable pool shrinks by the support guarantees; each support act has its
  own separate deal and split.
- **Operator**: pays each act on its own terms.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The night's gross is one pool; each act's deal is a separate claim on it.
   Support guarantees are pool deductions before the headliner's division.
2. **Trigger chain**: Settle the night → deduct support fees off the top → the headliner's settled pool
   feeds its split (CX-06). Order matters: a support fee taken after the split would mis-cost every member.
3. **Permission intersection**: A support act cannot see the headliner's deal and vice versa; each split
   is governed by its own entity's 01.04 rule.
4. **Notification fan-out**: Each act's settlement notifies only its own side.
5. **State transition conflict**: A late support-fee change (a dropped opener) reshapes the headliner's
   pool — coupled to CX-24's shared-budget observation.

### CX-13: Bill Construction & Support Slots ↔ Draw History

**Relationship**: **The slot qualifier originates here.** 600 people as an opener is not a 600 draw. Without
the slot stamped on the record, the draw is false in the direction that flatters the artist (17.11.01
DT-01).

**Role scoping**:
- **Musician**: their draw record is honest only if it carries the slot they played.
- **Operator**: reads slot-qualified draw as decision support.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The slot is a bill field owned by 17.14; the draw record (17.11.01) copies it
   at settlement time as an immutable qualifier. No later re-slotting.
2. **Trigger chain**: Bill locked → slot assigned → settlement → draw record stamped with slot. The record
   is meaningless without it.
3. **Permission intersection**: A support act's draw is theirs; the headliner cannot claim the room's draw
   as their own by having been on the bill.
4. **Notification fan-out**: None beyond the record's own creation (CX-08).
5. **State transition conflict**: None — the slot is frozen at settlement.

### CX-14: Radius Clause & Exclusivity ↔ Availability, Holds & Confirmation

**Relationship**: The prospective breach warning is nearly all the value (17.06 DT-02). The Step-6 pass
**extended it to three firing moments**: a window published inside an exclusion zone advertises dates that
cannot legally be sold, so the check runs at **publish** (warn); a hold inside a zone warns at **hold**;
and the obligation is actually breached the moment a conflicting date is **confirmed**, so confirm is a
**hard check** (C-06, DT-10) — a breach found later means two live contracts and one must break.

**Role scoping**:
- **Musician**: warned before double-booking themselves into a lawsuit; **their own radius conflicts
  surface to the artist alone** — showing them to an Operator would disclose who else booked them ([30]).
- **Operator**: sees only their *own* granted exclusions, never the artist's other bookings.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The clause is owned by 17.06; 17.01 owns the *moment* it is surfaced. The
   clause never mutates the calendar — it annotates and, at confirm, blocks.
2. **Trigger chain**: Publish → warn · Hold → warn · Confirm → check (radius conflicts warn-and-override
   with the override recorded; radius clauses are waived routinely, so a hard block would be wrong — [23]).
   Nobody checks a radius clause at 4am on deadline day, so the check must be pre-computed and surfaced,
   not left to the user to run.
3. **Permission intersection**: The permission asymmetry above is the load-bearing rule — the artist's
   pipeline is confidential from the buy side.
4. **Notification fan-out**: A prospective breach warns the artist's side; an override is logged.
5. **State transition conflict**: A confirm racing against a just-signed conflicting date elsewhere — the
   window between two confirms is where a real double-obligation is born.

### CX-15: Booking Enquiry Inbox & RFQ ↔ Availability, Holds & Confirmation

**Relationship**: Auto-qualification reads published avails; a qualified enquiry converts into a hold. The
Step-6 pass added that an **off-platform link recipient's reply lands here as a structured enquiry**,
because a non-platform party cannot self-hold — a hold needs a counterparty on a ladder ([4]).

**Role scoping**:
- **Operator**: raises an enquiry (or replies to a shared link) that may qualify against published avails.
- **Musician**: receives a qualified enquiry they can convert to a hold.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered** *(Medium confidence — validated at deepening)*:
1. **Shared state conflict**: An enquiry is short-lived and owned by 17.07; it ends the moment it converts
   to a hold or offer (17.07 D-02). It never writes an avail.
2. **Trigger chain**: Published avail → auto-qualify enquiry → convert to hold (in 17.01). Invite-only
   avail scoping complicates the read (17.01.01 Q-02): a qualifier must respect who may see which window.
3. **Permission intersection**: Visibility scoping on avails is the gate — an off-platform recipient sees
   only the curated dates the link exposes, never the whole calendar.
4. **Notification fan-out**: A qualified enquiry notifies the artist's side; a link-recipient reply
   surfaces as an inbound enquiry, not a hold.
5. **State transition conflict**: None material — conversion is a one-way transition; a dead enquiry does
   not resurrect.

### CX-16: Fan Demand Signals ↔ Draw History

**Relationship**: Recorded because the two look alike and are **opposites**. A draw record is a settled fact
— this many came, both parties signed. A demand signal is a wish — this many tapped a button. Requesting
costs nothing; attending costs £20 and a Tuesday night.

**Role scoping**:
- **Fan**: the only place they touch this domain.
- **Musician**: uses demand as leverage to pitch a room, and draw as evidence they can fill it.
- **Operator**: reads both, and must not confuse them.
- **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: None — separate objects, opposite provenance. **They must never render as the
   same kind of thing** (17.13 D-02).
2. **Trigger chain**: Demand → pitch → booking → settlement → draw. Demand can *cause* a draw record to
   exist — the loop's most interesting and most dangerous property (an artist who books on demand and does
   not sell has lost real money on a click).
3. **Permission intersection**: Demand exposure to promoters is the artist's choice — leverage when high, a
   weapon against them when low.
4. **Notification fan-out**: Converted demand notifies requesting fans (domain 20's alert).
5. **State transition conflict**: None.

### CX-17: Availability, Holds & Confirmation ↔ Agency Representation & Commission

**Relationship**: Agency representation supplies the **publishing and booking authority** for an act's
windows, scoped by territory (D-11/DT-15). Publishing dates for — or holding in the name of — an act you
do not represent is a real, current industry harm. The load-bearing rule: **a hold and a published window
belong to the act, not to the agent who placed them.** A representation change *carries positions across*
(D-15) — a departing agent must not be able to burn a roster's ladder — and representation *ending* must
**freeze** the act's live windows rather than orphan or auto-transfer them.

**Role scoping**:
- **Musician** (artist + their agent lens): the artist owns the positions; the agent operates them under a
  scoped, revocable delegation.
- **Operator**: sees a window/hold attributed to the act, never to the individual agent behind it.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The windows and ladder positions are owned by the **act entity**; the agency
   relationship is a delegated-authority grant (resolved through domain 01 / the Roles & Delegated
   Authority cross-cut), not an ownership. On a representation change the positions do not move — only the
   operator of them does.
2. **Trigger chain**: Grant representation → agent may publish/hold/confirm within territory scope. Revoke
   representation → **freeze** windows (no new holds, existing positions preserved for the act). A naive
   "delete the agent's holds" would be the burn hazard D-15 forbids.
3. **Permission intersection**: Booking authority gates *every* hold request and confirm; territory scope
   limits *which* windows an agent may touch. Authority to negotiate (17.02.03) is a separate grant from
   authority to publish availability.
4. **Notification fan-out**: A representation change notifies the incoming and outgoing agents and the
   Operators with live holds on the act — those holds now have a new operator, same owner.
5. **State transition conflict**: An agent placing a hold as representation is being revoked — the write
   must resolve against the authority state at commit time, or a just-fired agent lands a hold the act
   never authorised.

### CX-18: Availability, Holds & Confirmation ↔ Counterparty Relationship & Payment Reliability

**Relationship**: **The most under-modelled edge in the domain.** Reliability was framed as
settlement-derived (CX-09); this pass finds the **ladder is itself a first-class reliability generator**,
emitting facts 17.12 does not yet know exist: hold→confirm conversion rate; request-lapse rate per
Operator (`no-response`, distinct from `declined`); repudiation rate (holds placed in an act's name they
disown); challenge-spam / issue-and-withdraw; and — the sharp one — **confirm-then-revert rate**, the only
disincentive against defensive confirmation under a 48h challenge clock (the hazard 17.01.03 DT-02
confirms but leaves unpunished).

**Role scoping**:
- **Operator**: accrues a booking-conduct record (do they respond, do they repudiate, do they revert).
- **Musician**: accrues the same from the artist side (do they honour holds, do they ghost).
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: Reliability is derived and append-only; the ladder is the source of truth for
   the *fact*, 17.12 for its *aggregation*. **Hard constraint on 17.12**: the fact vocabulary must include
   fault-free reason codes (`timed-out-without-confirmed-delivery`, `voided-by-withdrawal`) so a merely
   unlucky counterparty is not scored as a bad one.
2. **Trigger chain**: Ladder event (lapse, repudiation, confirm-then-revert) → emit reliability fact → 17.12
   aggregates. Async; the fact is idempotent per ladder event.
3. **Permission intersection**: These facts **inform humans, they do not gate holds** (R-06) — a low score
   must never silently down-rank a hold, or the tool becomes the automated judgement 17.01.02 DT-02 rejects.
4. **Notification fan-out**: A pattern (hold flapping, mass-hoarding) surfaces to the injured party and, as
   an abuse signal, is reported to domain 24 (which owns the sanction).
5. **State transition conflict**: A challenger who withdraws during a challenge voids it as moot and is
   credited their rate limit back ([1]) — the reliability fact must record that as fault-free, not as a
   spam signal, or a legitimate withdrawal poisons a record.

### CX-19: Availability, Holds & Confirmation ↔ Bill Construction & Support Slots

**Relationship**: Billing intent **selects the ladder**. Bill shape (headline / co-headline / support-only)
is an avail field, and it partitions contention: **support and headline holds never contend and never share
a ladder** (D-05). 17.14 decides what the slots are; the ladder ranks who is in each. A "fill date" — a
room with a headliner needing an opener — is frequently a support-slot conversation, not an open call.

**Role scoping**:
- **Operator**: publishes an avail whose bill shape determines which ladder(s) a hold joins.
- **Musician**: holds for a headline slot or a support slot — different ladders, different contention.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The avail (17.01.01) carries the bill-shape field; 17.14 owns slot definition.
   They must agree that a window decomposes into slots and that a ladder hangs off each slot — the
   reconciliation Step 6 flags ([10],[14]).
2. **Trigger chain**: Publish avail with bill shape → 17.14 defines slots → each slot gets its own ladder →
   holds join the ladder for their slot. Confirmation requires *both* ladders resolved where a bill has
   support and headline (D-04) — a nuance the happy path did not state.
3. **Permission intersection**: Who may hold a support slot vs a headline slot follows the same booking
   authority as any hold (CX-17); a support offer is a lighter six-field form (CX-24).
4. **Notification fan-out**: A slot filled notifies the room and the other acts on the bill whose lineup
   just changed (subject to lineup-honesty, CX-3/P-04).
5. **State transition conflict**: A headline hold collapsing can strand the support slot it justified — the
   ladders are structurally independent but the *show* couples them.

### CX-20: Availability, Holds & Confirmation ↔ Draw History

**Relationship**: Draw is an **advisory read** into the ladder and the announce gate — never an input to
position assignment. Verified draw for a market renders *beside* a hold request so an Operator can judge
(D-03/DT-02); the announce-runway warning ("a show announced 12 days out will not sell") is sourced from
draw history rather than a hardcoded constant; and draw is why a room cannot publish a guarantee **floor**
— the room's price is a function of the act's draw, knowable only once there is an act, forcing the
ceiling/floor asymmetry at the two ends of the availability primitive.

**Role scoping**:
- **Operator**: reads draw as decision support when ranking holds and setting an announce runway.
- **Musician**: their own draw explains what a room can offer them.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: None — draw (17.11) is read-only here and must **never be wired into position
   assignment**. Automating the 1st-hold call removes the Operator's judgement and their reason to trust
   the tool.
2. **Trigger chain**: Hold request / announce decision → read draw comparable → surface as advice.
   Advisory, non-blocking; cold-start weakens it (Q, 17.11 Q-02).
3. **Permission intersection**: Own-record draw is freely readable by the act; cross-act comparables inherit
   the consent question (index Q-07).
4. **Notification fan-out**: None — a pure read.
5. **State transition conflict**: None — draw does not mutate ladder state.

### CX-21: Offers & Negotiation ↔ Agency Representation & Commission

**Relationship**: The sharpest visibility break in the domain (DT-06/D-09). The offer's fee is **gross to
the artist side**; the agent's commission comes off it and is **invisible to the Operator by design** — a
promoter who could see the commission would negotiate against it (domain Role Matrix: 17.08 Operator =
None). The outcomes render must therefore be role-scoped: the Operator sees the deal, the artist side sees
the deal *and* the commission split of it.

**Role scoping**:
- **Musician** (artist + agent lens): sees gross and the commission deducted from it.
- **Operator**: sees only the gross deal; the commission is not merely hidden but must not be inferable.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The offer (gross) is the shared object; the commission is a private overlay on
   the artist's side, pinned to the representation terms in force (17.08.01 D-02). No merge — they are two
   layers, one shared, one private.
2. **Trigger chain**: Offer composed (gross) → artist side computes net-of-commission privately → accept.
   The Operator's view never includes the commission layer.
3. **Permission intersection**: This IS a permission edge — the render is scoped so the buy side cannot see
   what the act pays its agent. A leak here hands a rival a negotiating lever.
4. **Notification fan-out**: Acceptance notifies both sides of the *deal*; commission accrual notifies only
   the artist side and the agency.
5. **State transition conflict**: A mid-negotiation representation change (CX-17) alters which commission
   overlay applies — the offer's gross is unaffected, but the artist's net moves.

### CX-22: Offers & Negotiation ↔ Deal Structures

**Relationship**: An offer is **composed from the deal grammar**. The T1 (settleable) tier of the deal
taxonomy *is* 17.03.01's vocabulary — every deal type the industry has and the grammar lacks becomes a T3
free-text term (CX-23). D-05's computed materiality (does an edit help or hurt each side?) requires 17.03
to define a **polarity** per term — a direction of benefit per side — and whether that is even possible is
the domain's ceiling question (index Q-08: closed vocabulary vs open expression language).

**Role scoping**:
- **Musician** / **Operator**: both compose and counter within the same grammar; both depend on its
  coverage.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: 17.03 owns the grammar (the type system); 17.02 owns instances (this offer).
   An offer cannot express a settleable term the grammar lacks — it degrades to T3.
2. **Trigger chain**: Author offer → validate against grammar → settleable terms typed, unknown terms
   captured as T3. The automation claim is **capped by grammar coverage** (Q-08).
3. **Permission intersection**: None specific — both parties use the same vocabulary.
4. **Notification fan-out**: A counteroffer's materiality (computed from term polarity) drives whether an
   approval is invalidated (17.02.03) — a material change re-triggers approval, a non-material one does not.
5. **State transition conflict**: Expiry has an asymmetric polarity — an extension is a concession to the
   artist (non-material there) and adverse to the buy side (material there) ([49]); the grammar must encode
   this or materiality is computed wrong.

### CX-23: Offers & Negotiation ↔ Settlement & Reconciliation

**Relationship**: The grammar cannot cover every deal (CX-22), so D-05 permits **free text, stamped and
surfaced at the moment of money**. Unsettled (T3) terms captured at offer time must **render on the
settlement sheet and require explicit bilateral acknowledgment at signoff** — without this, the escape-hatch
resolution to Q-02 is "a stamp nobody ever sees" and the settlement silently ignores a term both parties
agreed to.

**Role scoping**:
- **Musician** / **Operator**: both must acknowledge each unsettled term at signoff — the term is theirs to
  resolve by hand since the formula cannot.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The T3 term is authored on the offer (17.02) and carried immutably to the
   settlement sheet (17.09.05). Neither side may quietly drop it; it is settled by acknowledgment, not
   arithmetic.
2. **Trigger chain**: Offer with T3 term → contract → settlement sheet renders the term as unsettled →
   **signoff blocks until both parties explicitly acknowledge**. A hard dependency created by D-05 ([26]).
3. **Permission intersection**: Both principals must acknowledge; neither can acknowledge on the other's
   behalf.
4. **Notification fan-out**: An unresolved T3 term at signoff notifies both sides that the sheet cannot
   close.
5. **State transition conflict**: A T3 term acknowledged one way by one party and differently by the other
   is a settlement dispute (17.09.06) — the acknowledgment must be a shared, matched act, not two private
   stamps.

### CX-24: Bill Construction & Support Slots ↔ Offers & Negotiation

**Relationship**: A support-slot offer is a **six-field short form** authored in 17.02 (flat, fee, date,
slot, set length, expiry), everything else inheriting from the room template (D-20). But the promoter's
talent budget for the night is **one shared pool**: a £500 concession on the headliner's thread is £500 the
support thread cannot have. The threads are economically coupled; 17.14/17.02 model them as independent —
a knowing simplification (DT-05), not an oversight.

**Role scoping**:
- **Operator**: works one budget across multiple simultaneous offer threads.
- **Musician**: each act negotiates its own thread, blind to the others' claims on the shared pool.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered** *(Medium confidence — validated at deepening)*:
1. **Shared state conflict**: The night's talent budget is genuine shared state across threads, but is
   **not modelled as a shared object** — each thread proceeds independently. The coupling is real and
   currently implicit; a concession on one silently constrains the others.
2. **Trigger chain**: Compose headline offer → compose support slot offer(s) from the six-field form → each
   accepted independently. A sibling thread accepting can exhaust the budget another thread assumed.
3. **Permission intersection**: Slot control is a term authored on the offer; a support act cannot see the
   headline economics (extends CX-21's visibility scoping across the bill).
4. **Notification fan-out**: Each thread notifies only its own act; the shared-budget interaction is
   invisible to the acts by design.
5. **State transition conflict**: Two live threads against one budget (or one date — [46]) can both proceed
   to acceptance and over-commit; the promoter absorbs the reconciliation. Flagged as a knowing
   simplification for `/ideate-validate`.

---

## Cross-Cut Mechanisms Escalated to Global CX

> Discovered while classifying — **mechanisms serving many domains**, not nodes in this domain. For
> `ideation-cx.md` to absorb. Registry names in **bold** where they already exist; italic where this pass
> proposes a mechanism the registry does not yet carry.

| Mechanism | Serves | Why it is a cross-cut, not a node here |
|---|---|---|
| **Contracts, E-Signature & Attestation** | 05, 09, 11, 13, 17 | Split sheets, licences, service SOWs, consignment and performance contracts execute identically. Extracting it is what makes 17.04 a feature rather than a sub-domain. |
| **Payments, Escrow & Payouts** | 05, 13, 14, 16, 17, 18, 19, 23 | This domain owns *when money is due, who keeps it, who is owed what*; it does not own money movement. |
| **Availability, Scheduling & Reservations** | 05, 06, 08, 16, 17, 18 | The "time window with constraints" primitive serves lesson slots, session bookings, room hire and show dates — **but the avail itself is not part of it** (a commercial offer with audience, quota, posture and budget is domain-owned; folding it into a generic slot reproduces the anti-pattern D-14 rejects). |
| **Messaging & Conversations** (RFQ transport) | 05, 06, 16, 17 | The pipe is generic; the booking enquiry's *shape* is not (index D-08). |
| **Reviews, Ratings & Portable Reputation** | 05, 13, 14, 16, 17 | The generic review mechanism is shared; the **derived-from-settlement** half is domain-owned (index D-09, 17.12). |
| **Audit Log & Provenance Ledger** | 05, 09, 13, 14, 17, 19, 24 | Raise/mediate/resolve and the evidence locker (24.09) are generic; a settlement dispute's *line-scoping* is not (index D-07). The settlement trail is a settlement-shaped **instance** of the ledger — it must not fork it. |
| **Roles, Permissions & Delegated Authority** (Entity Binding Authority) | 01, 09, 11, 17 | Who may bind a band to a deal, a split, a settlement signature, or a licence is one question. Solved differently across offer-binding (17.02.03), settlement-signing (17.09.05), splits (17.10.01, 09) and licensing (11), the platform holds contradictory authority models for one band. **New constraint this pass**: the *same* rule must serve three different clocks (48h offer approval vs 4-minute car-park signoff vs open-ended split) — a unanimous-band rule that works for offers deadlocks every settlement. |
| _Structured Deal Terms → Recoupment / Settlement Evaluator_ | 05, 10, 11, 17 | Royalty statements, licence fees, service invoices and live settlements are all "typed terms compile to an evaluable formula, evaluated later against real inputs". 10.03.02 DT-03's guarantee-vs-door recoupment is **the same engine**. The registry has Split-Capture (disbursement) and Contracts (documents) but **no shared evaluator** — most likely to be reinvented differently on rounding (single-rounding-at-the-payable-boundary), deduction-stack order, and determinism/versioning. Domain 17 may own only the live *vocabulary* (17.03), not the evaluator. |
| **Tax Calculation & Remittance** | 05, 13, 14, 17, 19, 23 | Withholding, VAT and marketplace-facilitator tax share machinery. |
| **Localization, Currency & Timezone** (Multi-Currency & FX) | 05, 13, 14, 17, 19, 23 | A €-denominated guarantee settled in £ — the rate and its fixing date are T1 terms (17.03.01 DT-03), unmodelled everywhere. |
| **Notifications & Alerts** | All | The transport is generic; the **aiming** is product (telling the *artist* a promoter missed an instalment is the valuable half — 17.05.02 DT-02). Announce → follower alert must be exactly-once (17.01.04 → 20). |
| **Object & Evidence Storage** | 13, 17, 23 | Expense receipts, gear provenance, financial records. |
| **Privacy, Consent & Data Portability** | All | Where `meta/problem-statement.md` Q-02 (earned vs hostile lock-in) is answered concretely — for this domain, at 17.09.07 and 17.11.02, and at the fan-data boundary (19.10). |
| _Composed-Exposure / Physical-Safety Evaluator_ | 01, 15, 17, 18, 20 | Public tour dates (17/18) + a high-value gear collection (15) + a home address (01) + a fan surface (20) compose into a burglary/physical-safety risk (15.04, 15.02.01). **No single domain owns this evaluation** — a genuinely homeless cross-cut this pass surfaces. |

## Not-Product — Routed to `/create-prd`

| Concern | Why it is not product | Route to |
|---|---|---|
| **Durable scheduled timers** | Hold expiry and challenge countdowns are money-relevant deadlines that must fire exactly once and survive restarts. The *ladder semantics* are product; the timer substrate is architecture. | `/create-prd-architecture` |
| **Business-day / public-holiday reference data** | Per-jurisdiction, needed to compute challenge/expiry deadlines correctly; plus delivery-receipt tracking for notices ([24]). Reference data + delivery substrate, not product. | `/create-prd-architecture` |
| **Append-only / immutable storage** | 17.09.06's *visible, reliable record* is product — the domain's central claim. The immutability substrate is architecture. | `/create-prd-architecture` |
| **Statistical disclosure control** (k-anonymity, differencing defence) | Protects 17.11.02's aggregates. The consent policy it enforces is product (index Q-07); the technique is not. | `/create-prd-security` |
| **Offline capture & sync** | Settlement and expense capture happen at 1am with no signal. Architecture — but driven by a product question (index Q-09). | `/create-prd-architecture` |
| **KYC/AML** | Triggered by holding deposits in escrow and by per-recipient payouts. `[PENDING]` in `meta/constraints.md`. | `/create-prd-security` |
| **Tax reporting obligations** (1099-K / W-9 / W-8BEN) | Triggered by disbursing to individuals (index Q-06). `[PENDING]` in `meta/constraints.md`. | `/create-prd-security` |
| **Consumer protection / distance selling** | Fan refunds on cancellation — statutory, and domain 19's surface, not this domain's (17.05.03 D-03). | `/create-prd-security` |
| **Draw prediction model** (weighting, recency decay, confidence intervals) | The model is ML architecture. The product is what is shown, to whom, with what confidence (17.11.03 D-03). | `/create-prd-architecture` |
| **Idempotent send / exactly-once announce** | A duplicate announce is a duplicate alert to every follower (17.01.04 → 20 DT-16); send must be idempotent. Delivery guarantee is architecture; the exactly-once *requirement* is product. | `/create-prd-architecture` |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 17.06 Radius Clause | 17.09 Settlement & Reconciliation | A radius clause constrains **future bookings**; it is not an economic term. A breach costs a relationship and possibly a lawsuit, never a settlement line. The tempting false edge is a breach penalty — but any such penalty is a *contract* remedy (17.04) enforced through disputes (24), not arithmetic on a sheet. |
| R-02 | 17.07 Booking Enquiry Inbox | 17.09 Settlement & Reconciliation | An enquiry's life ends the moment it converts to a hold or offer (17.07 D-02) — months before a settlement exists. No state, no trigger, no data flows. The only conceivable link is analytical (enquiry → eventual revenue), which is domain 22's. |
| R-03 | 17.13 Fan Demand Signals | 17.09 Settlement & Reconciliation | Rejected as a **direct** edge, deliberately. "Did the demand convert into a settled show?" is real, but the answer travels **through the draw record** (CX-16 → CX-08), not the settlement. Wiring demand to settlement directly would invite writing an attendance expectation onto a settled fact — the pollution 17.11 R-01 forbids. |
| R-04 | 17.06 Radius Clause | 17.11 Draw History | A radius clause suppresses a booking that never happens, so it emits no record. The interesting counterfactual — "how much draw did this clause cost the artist?" — is unanswerable **by construction**: the show did not occur, so no fact exists. |
| R-05 | 17.08 Agency Commission | 17.10 Live Income Split | Rejected as a **merge**. Both take money out of a settlement, so they look like one thing. They are not: a split divides **one pool among its owners** under one agreement; commission is a **deduction from one party's share** under a separate agreement with a separate counterparty. Merging them would make the agent a band member. |
| R-06 | 17.12 Counterparty Reliability | 17.02 Offers & Negotiation | Rejected as an automatic edge. Reliability could plausibly *shape an offer* — shakier promoter, bigger deposit ask — but that path runs through **17.05's deposit terms**, not offer composition. **Reliability informs humans; it does not price deals.** A direct edge would let a derived score alter deal terms silently (the automated-judgement failure 17.01.02 DT-02 rejects). |
| R-07 | 17.13 Fan Demand Signals | 17.07 Booking Enquiry Inbox | Rejected, load-bearing. Both are inbound "someone wants a show" signals, so a merge looks natural. But an enquiry is a **professional, addressed, structured request that converts into a deal**; a demand signal is an **aggregate, unaddressed, one-way count that converts into nothing**. Merging them would put a consumer-scale pipe into a professional inbox — the harassment vector `meta/personas.md` names and 17.07 DT-03 rejects. |
| R-08 | 17.09 Settlement & Reconciliation | 17.13 Gear/Merch inventory (17.09.04 ↔ 13) | Recorded to prevent a false entity merge: **merch inventory is not gear inventory** ([13 cross]). A settlement's merch reconciliation shares no entity with the gear marketplace's stock; the resemblance is nominal only. |
