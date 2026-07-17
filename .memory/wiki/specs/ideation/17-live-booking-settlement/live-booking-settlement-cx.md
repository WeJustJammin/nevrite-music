# Live Booking & Settlement — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Live Booking & Settlement](./live-booking-settlement-index.md)
> **Status**: [BREADTH] — 14 children classified; intra-domain cross-cuts mapped.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [17.03 Deal Structures](./17.03-deal-structures-economics/) | [17.09 Settlement & Reconciliation](./17.09-settlement-reconciliation/) | **The deal structure IS the settlement formula.** The expression compiled at offer time is evaluated months later against real counts | Musician, Operator | High | Domain index D-01: "settlement is only computable if the offer was structured data" — the edge that justifies one domain |
| CX-02 | [17.01 Availability, Holds & Confirmation](./17.01-availability-holds-confirmation/) | [17.02 Offers & Negotiation](./17.02-offers-negotiation/) | A hold claims a date; an offer proposes terms. Two clocks, two objects, routinely incoherent with each other | Musician, Operator | High | "Still held, no live offer" is a normal state; an offer good until Friday on a hold that dies Thursday is undetected |
| CX-03 | [17.02 Offers & Negotiation](./17.02-offers-negotiation/) | [17.04 Performance Contracts](./17.04-performance-contracts-deal-memos.md) | The accepted version generates the contract — terms flow through as data, never retyped | Musician, Operator | High | A retyped contract is a second source of truth that disagrees with the first at settlement |
| CX-04 | [17.04 Performance Contracts](./17.04-performance-contracts-deal-memos.md) | [17.05 Deposits, Balances & Cancellation](./17.05-deposits-balances-cancellation/) | Deposit, balance and cancellation terms are contract terms; execution starts the schedule | Musician, Operator | High | The schedule has no terms until a contract executes |
| CX-05 | [17.05 Deposits, Balances & Cancellation](./17.05-deposits-balances-cancellation/) | [17.01 Availability, Holds & Confirmation](./17.01-availability-holds-confirmation/) | Deposit receipt is an announce precondition; deposit failure reverts the booking — **but does not restore the destroyed holds** | Musician, Operator | High | 17.01 CX-03: confirmation destroys inferior holds irreversibly; revert is compensating, not rollback |
| CX-06 | [17.09 Settlement & Reconciliation](./17.09-settlement-reconciliation/) | [17.10 Live Income Payout & Tax](./17.10-live-income-payout-tax/) | Final signoff is the disbursement trigger; the settled pool is what the split divides | Musician | High | Nothing moves until both parties sign — a proposal is not a payment |
| CX-07 | [17.09 Settlement & Reconciliation](./17.09-settlement-reconciliation/) | [17.08 Agency Representation & Commission](./17.08-agency-representation-commission/) | Commission accrues from the settlement — and **an amendment after disbursement is a clawback from a third party** | Musician | High | 17.08.02 DT-02: settlements get amended; agencies have been paid and have spent it |
| CX-08 | [17.09 Settlement & Reconciliation](./17.09-settlement-reconciliation/) | [17.11 Draw History & Market Intelligence](./17.11-draw-history-market-intelligence/) | **Settlement is the generator.** A signed settlement is what makes a draw record verified rather than claimed | Musician, Operator | High | Domain index: settlement is "the source dataset for draw intelligence" |
| CX-09 | [17.09 Settlement & Reconciliation](./17.09-settlement-reconciliation/) | [17.12 Counterparty Relationship & Payment Reliability](./17.12-counterparty-relationship-payment-reliability.md) | Settlement facts derive the reliability record — paid on time, count matched, contested or not | Musician, Operator | High | Domain index: settlement is "the source of payment-reliability reputation" |
| CX-10 | [17.11 Draw History](./17.11-draw-history-market-intelligence/) | [17.03 Deal Structures](./17.03-deal-structures-economics/) | Draw seeds the attendance assumption modelling would otherwise ask the user to guess — **the domain's only feedback loop** | Musician, Operator | High | 17.03.02 DT-03: a modeller with a blank attendance field launders a guess into a curve |
| CX-11 | [17.03 Deal Structures](./17.03-deal-structures-economics/) | [17.05 Deposits, Balances & Cancellation](./17.05-deposits-balances-cancellation/) | Cross-collateralization makes a single date's cancellation non-self-contained | Musician, Operator | Medium | 17.03.03: a cancelled date inside a run changes 11 other dates' economics |
| CX-12 | [17.14 Bill Construction](./17.14-bill-construction-support-slots.md) | [17.10 Live Income Payout & Tax](./17.10-live-income-payout-tax/) | Support fees come **off the top** before the headliner's split — a deduction the sweep's single-artist model did not have | Musician | High | 17.14 DT-01: most shows have 2-3 acts on separate deals |
| CX-13 | [17.14 Bill Construction](./17.14-bill-construction-support-slots.md) | [17.11 Draw History](./17.11-draw-history-market-intelligence/) | **The slot qualifier originates here.** 600 as an opener is not a 600 draw | Musician | High | 17.11.01 DT-01: without the slot, the record is false in the direction that flatters the artist |
| CX-14 | [17.06 Radius Clause](./17.06-radius-clause-exclusivity.md) | [17.01 Availability, Holds & Confirmation](./17.01-availability-holds-confirmation/) | The breach warning fires at **hold time** — a breach found later means two live contracts and one must break | Musician, Operator | High | 17.06 DT-02: prospective warning is nearly all the value |
| CX-15 | [17.07 Booking Enquiry Inbox](./17.07-booking-enquiry-inbox-rfq.md) | [17.01 Availability, Holds & Confirmation](./17.01-availability-holds-confirmation/) | Auto-qualification reads published avails; a qualified enquiry converts into a hold | Musician, Operator | Medium | Invite-only avail scoping complicates the read (17.01.01 Q-02) |
| CX-16 | [17.13 Fan Demand Signals](./17.13-fan-demand-signals.md) | [17.11 Draw History](./17.11-draw-history-market-intelligence/) | **Opposite provenance** — a settled fact vs an expressed wish. They must never render alike | Musician, Operator, Fan | High | 17.13 DT-02: requesting costs nothing; attending costs £20 and a Tuesday |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Deal Structures ↔ Settlement & Reconciliation

**Relationship**: The domain's founding edge. An offer's deal terms compile to an evaluable expression
(17.03.01); months later, settlement evaluates that same expression against real counts (17.09.01).
No re-entry, no re-interpretation, no calculator. **This is the entire argument for booking and
settlement being one domain** — split them and the settlement engine has to parse prose.

**Role scoping**:
- **Operator**: authors the terms at offer time and supplies the inputs at settlement. They do not
  compute the number — the formula does, from terms they wrote months ago. That is the point, and it
  is also what they may resist.
- **Musician**: for the first time arrives at settlement with the same arithmetic the promoter has.
- **Producer**: not affected — no live role anywhere in this domain.
- **Fan**: not affected, though they are the count.

**Synthesis questions answered**:
1. **Shared state conflict**: The expression is owned by the deal and is immutable once accepted;
   amendments (17.04) create new versions. Settlement reads the version in force. No merge.
2. **Trigger chain**: Offer accepted → expression stored → show plays → counts arrive → evaluate. If
   the deal carries free-text terms outside the grammar, **the formula silently cannot see them** —
   the chain completes and the number is wrong. The domain's sharpest unresolved risk (index Q-08).
3. **Permission intersection**: Authoring terms does not grant computing the settlement; supplying
   counts does not grant altering the formula. The separation is what makes the number defensible.
4. **Notification fan-out**: Evaluation triggers the widest fan-out in the domain — signoff, then
   disbursement, commission, draw record, reliability.
5. **State transition conflict**: Cross-collateralization (17.03.03) makes the evaluation
   **provisional** while contradicting 17.09's per-show finality. Escalated as index Q-02 — it decides
   the settlement entity's grain.

### CX-02: Availability, Holds & Confirmation ↔ Offers & Negotiation

**Relationship**: A hold claims a date; an offer proposes terms. They travel together and expire
separately, on different clocks. "We're still holding you but the money's off the table" is entirely
normal — which is why they must not be merged (17.02.04 DT-01).

**Role scoping**:
- **Operator**: places the hold and composes the offer, usually together.
- **Musician**: holds a date whose terms may die under them.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: Separate objects on one date; neither owns the other.
2. **Trigger chain**: Hold → offer → accept → confirm. A challenge (17.01.03) forces "confirm on real
   terms", which requires an offer to exist — and **the hazard is that under a 48h clock an agent
   confirms first and negotiates after** (17.01.03 DT-02).
3. **Permission intersection**: Holding position 1 grants no authority to bind the artist — that is the
   entity's (17.02.03).
4. **Notification fan-out**: Independent; the two clocks warn separately, which is itself confusing.
5. **State transition conflict**: **Unmodelled and real** — an offer good until Friday on a hold that
   expires Thursday is incoherent and nothing detects it (17.02 CX-04).

### CX-05: Deposits, Balances & Cancellation ↔ Availability, Holds & Confirmation

**Relationship**: Deposit receipt is an announce precondition (17.01.04); deposit failure reverts the
booking. The asymmetry that matters: **the revert does not restore the holds the confirmation
destroyed.** Those parties have re-routed and moved on.

**Role scoping**:
- **Operator**: pays the deposit; their failure to pay triggers the revert.
- **Musician**: their date comes back; the inferior holds destroyed for it do not.
- **Producer**: not affected. **Fan**: not affected here — but is, via domain 19, if this happens
  post-announce.

**Synthesis questions answered**:
1. **Shared state conflict**: The booking is shared; the deposit belongs to the payments cross-cut.
2. **Trigger chain**: Confirm → destroy holds → await deposit → (paid → announce | failed → revert).
   **The revert is a compensating action with permanent collateral damage**, never a rollback.
3. **Permission intersection**: Neither party may unilaterally release a held deposit — which is
   exactly what makes the platform a money transmitter (17.05 Q-01).
4. **Notification fan-out**: A revert notifies both principals; the destroyed holds are already gone
   and arguably should be told the date is free again.
5. **State transition conflict**: Non-payment auto-void protects the artist's date and loses shows both
   parties wanted (17.05.01 Q-01).

### CX-07: Settlement & Reconciliation ↔ Agency Representation & Commission

**Relationship**: Commission evaluates against the finalised settlement (17.08.02). The hazard is
temporal: **a settlement can be amended after commission is disbursed** — a miscounted comp, a
corrected box office number — and that is a clawback from an agency that has been paid and has spent
it. The platform ends up holding an obligation it has no mechanism to execute.

**Role scoping**:
- **Musician**: both the artist (whose money it is) and the agency (whose commission it is) sit on
  this side — the persona strain named in index Q-01.
- **Operator**: not affected — commission comes off the artist's side after their obligation is
  discharged.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The settlement is the source; commission terms are pinned to the version
   in force when the date was booked (17.08.01 D-02).
2. **Trigger chain**: Settlement final → accrue → deduct → disburse. **Amendment after disbursement has
   no clean chain** — index Q-02's amendment window is what bounds the liability.
3. **Permission intersection**: An agent's authority to *negotiate* is separate from their entitlement
   to *commission*. An agent can be owed commission on a deal they had no authority to bind.
4. **Notification fan-out**: Recomputation notifies the artist and the agency; both may have banked it.
5. **State transition conflict**: The clawback problem, compounded across recipients in 17.10.02.

### CX-08: Settlement & Reconciliation ↔ Draw History & Market Intelligence

**Relationship**: **Settlement is the generator, not a consumer.** A signed settlement emits a draw
record (17.11.01) that exists nowhere else in the industry — verified, slot-qualified, and
unfalsifiable because both parties agreed the show happened and how many came. This is the domain's
clearest expression of the D-18 thesis.

**Role scoping**:
- **Musician**: the record is theirs and is the asset `meta/personas.md` says they need — evidence
  instead of re-proving themselves to every new client.
- **Operator**: reads a prospective act's record as decision support, never as a rank.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The record is derived and append-only; nobody writes it directly.
2. **Trigger chain**: Signoff → record → (gate) → comparables → guidance. **The gate is a consent
   policy, not a filter** (index Q-07).
3. **Permission intersection**: The artist's own record needs no consent; aggregating across artists
   needs one nobody has written.
4. **Notification fan-out**: None — and that is the problem. Nobody is told their data informed a
   competitor's decision.
5. **State transition conflict**: An amended settlement moves a record that may already be in a spent
   benchmark.

### CX-10: Draw History & Market Intelligence ↔ Deal Structures

**Relationship**: The domain's **only feedback loop**, and what makes it compound rather than merely
repeat. Settlement emits draw (CX-08); draw seeds modelling's attendance range (17.03.02); better
modelling produces better deals; better deals settle into better records. Without this edge every show
is settled in isolation and the platform accumulates numbers without accumulating knowledge.

**Role scoping**:
- **Musician** / **Operator**: both model from the same history, with their own private cost
  assumptions.
- **Producer** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: None — guidance is a pure read and **never writes back to the record**
   (17.11 R-01). Model output must not pollute settled facts.
2. **Trigger chain**: Records accumulate → seed modelling → inform offers. **Cold start breaks it**: no
   corpus, no seed, and the modeller is back to asking the user to guess (17.11 Q-02).
3. **Permission intersection**: Own-record guidance is clean; comparable-based guidance inherits the
   consent question.
4. **Notification fan-out**: None.
5. **State transition conflict**: None — but the loop's value is a function of corpus size, which makes
   several features weaker than they look at launch.

### CX-16: Fan Demand Signals ↔ Draw History & Market Intelligence

**Relationship**: Recorded because the two look alike and are **opposites**. A draw record is a settled
fact — this many people came, both parties signed. A demand signal is a wish — this many people tapped
a button. Requesting costs nothing; attending costs £20 and a Tuesday night.

**Role scoping**:
- **Fan**: the only place they touch this domain.
- **Musician**: uses demand as leverage to pitch a room, and draw as evidence they can fill it.
- **Operator**: reads both, and must not confuse them.
- **Producer**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: None — separate objects, opposite provenance. **They must never render as
   the same kind of thing** (17.13 D-02).
2. **Trigger chain**: Demand → pitch → booking → settlement → draw. Demand can *cause* a draw record to
   exist, which is the loop's most interesting property and its most dangerous: an artist who books on
   demand and does not sell has lost real money on a click.
3. **Permission intersection**: Demand exposure to promoters is the artist's choice — leverage when
   high, a weapon against them when low.
4. **Notification fan-out**: Converted demand notifies requesting fans (domain 20's alert).
5. **State transition conflict**: None.

> **CX-03, CX-04, CX-06, CX-09, CX-11, CX-12, CX-13, CX-14, CX-15**: relationships evidenced above;
> full synthesis questions `[PENDING — /ideate-discover Step 5 deepening]`. Deferred deliberately —
> their detail lives in the sub-domain CX files that own both ends.

---

## Cross-Cut Mechanisms Escalated to Global CX

> Discovered while classifying — these are **mechanisms serving many domains**, not nodes in this
> domain. No node was created for any of them. For `ideation-cx.md` to absorb.

| Mechanism | Serves | Why it is a cross-cut, not a node here |
|---|---|---|
| **Document Generation & E-Signature** | 05, 09, 11, 13, 17 | Split sheets, licences, service SOWs, consignment and performance contracts execute identically. **Extracting it is what makes 17.04 a feature rather than a sub-domain.** |
| **Payments, Escrow, Deposits & Payouts** | 05, 13, 14, 16, 17, 19 | This domain owns *when money is due, who keeps it, who is owed what*; it does not own money movement. |
| **Calendar & Availability Substrate** | 06, 07, 16, 17 | The "time window with constraints" primitive serves lesson slots, session bookings, room hire and show dates. |
| **Structured Enquiry/RFQ Transport & Messaging** | 05, 06, 16, 17 | The pipe is generic; the booking enquiry's *shape* is not (index D-08). |
| **Reputation, Reviews & Counterparty History** | 05, 13, 14, 16, 17 | The generic review mechanism is shared; the **derived-from-settlement** half is domain-owned (index D-09, 17.12). |
| **Dispute Resolution Machinery** | 05, 13, 14, 17, 19 (owned by 24) | Raise/mediate/resolve is generic; a settlement dispute's *line-scoping* is not (index D-07). |
| **Entity Approval Chains & Binding Authority** | 01, 09, 11, 17 | Who may bind a band to a deal is the same question as who may bind it to a split. **If solved twice, the platform holds two contradictory authority models for one band.** |
| **Structured Economic Terms → Computed Statement engine** | 05, 10, 11, 17 | Royalty statements, licence fees, service invoices and settlements are all "typed terms compile to an evaluable formula". Domain 17 may own only the live *vocabulary*, not the evaluator (17.03 Q-03). |
| **Tax Calculation & Withholding Engine** | 05, 13, 14, 17, 19, 23 | Withholding, VAT and marketplace facilitator tax share machinery. |
| **Multi-Currency & FX** | 05, 13, 14, 17, 19, 23 | A €-denominated guarantee settled in £ — the rate and its fixing date are unmodelled everywhere (17.03.01 DT-03). |
| **Notifications & Alerting** | All | The transport is generic; the **aiming** is product (17.05.02 DT-02 — telling the *artist* a promoter missed an instalment is the valuable half). |
| **Receipt/Document Capture & Storage** | 13, 17, 23 | Expense receipts, gear provenance, financial records. |
| **Data Rights, Consent & Portability** | All | Where `meta/problem-statement.md` Q-02 (earned vs hostile lock-in) is answered concretely — for this domain, at 17.09.07 and 17.11.02. |

## Not-Product — Routed to `/create-prd`

| Concern | Why it is not product | Route to |
|---|---|---|
| **Durable scheduled timers** | Hold expiry and challenge countdowns are money-relevant deadlines that must fire exactly once and survive restarts. The *ladder semantics* are product; the timer substrate is architecture. | `/create-prd-architecture` |
| **Append-only / immutable storage** | 17.09.06's *visible, reliable record* is product — the domain's central claim. The immutability substrate is architecture. | `/create-prd-architecture` |
| **Statistical disclosure control** (k-anonymity, differencing defence) | Protects 17.11.02's aggregates. **The consent policy it enforces is product** (index Q-07); the technique is not. | `/create-prd-security` |
| **Offline capture & sync** | Settlement and expense capture happen at 1am with no signal. Architecture — **but driven by a product question** (index Q-09). | `/create-prd-architecture` |
| **KYC/AML** | Triggered by holding deposits in escrow and by per-recipient payouts. `[PENDING]` in `meta/constraints.md`. | `/create-prd-security` |
| **Tax reporting obligations** (1099-K / W-9 / W-8BEN) | Triggered by disbursing to individuals (index Q-06). `[PENDING]` in `meta/constraints.md`. | `/create-prd-security` |
| **Consumer protection / distance selling** | Fan refunds on cancellation — statutory, and **domain 19's** surface, not this domain's (17.05.03 D-03). | `/create-prd-security` |
| **Draw prediction model** (weighting, recency decay, confidence intervals) | The model is ML architecture. The **product** is what is shown, to whom, with what confidence, and whether a point estimate is ever rendered (17.11.03 D-03). | `/create-prd-architecture` |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 17.06 Radius Clause | 17.09 Settlement & Reconciliation | Rejected. A radius clause constrains **future bookings**; it is not an economic term. A breach costs a relationship and possibly a lawsuit, never a settlement line. The tempting false edge is a breach penalty — but any such penalty is a *contract* remedy (17.04) enforced through disputes (24), not arithmetic on a sheet. Modelling it would put a legal consequence inside a computation. |
| R-02 | 17.07 Booking Enquiry Inbox | 17.09 Settlement & Reconciliation | Rejected. An enquiry's life ends the moment it converts to a hold or an offer (17.07 D-02) — months before a settlement exists. No state, no trigger, no data flows between them. The only conceivable link is analytical (enquiry → eventual revenue), which is domain 22's, not a domain-17 interaction. |
| R-03 | 17.13 Fan Demand Signals | 17.09 Settlement & Reconciliation | Rejected as a **direct** edge, deliberately, because it is superficially attractive: "did the demand convert into a settled show?" is a real question. But the answer travels **through the draw record** (CX-16 → CX-08), not the settlement. Wiring demand to settlement directly would invite writing an attendance expectation onto a settled fact — the exact pollution 17.11 R-01 forbids. |
| R-04 | 17.06 Radius Clause | 17.11 Draw History | Rejected. A radius clause suppresses a booking that never happens, so it emits no record and leaves no trace. The interesting counterfactual — "how much draw did this clause cost the artist?" — is unanswerable **by construction**: the show did not occur, so no fact exists. An honest absence, recorded to stop a later reader inventing the edge. |
| R-05 | 17.08 Agency Commission | 17.10 Live Income Split | Rejected as a **merge**, recorded because it is the tempting simplification (17.08 D-03, 17.10 D-04). Both take money out of a settlement, so they look like one thing. They are not: a split divides **one pool among its owners** under one agreement; commission is a **deduction from one party's share** under a separate agreement with a separate counterparty. Merging them would make the agent a band member — with a share of the pool and subject to the band's authority rule, neither of which is true. |
| R-06 | 17.12 Counterparty Reliability | 17.02 Offers & Negotiation | Rejected as an automatic edge. Reliability could plausibly *shape an offer* — shakier promoter, bigger deposit ask (17.05.01 Q-03) — but that path runs through **17.05's deposit terms**, not offer composition. A direct edge would let a derived score alter deal terms silently, which is the automated-judgement failure 17.01.02 DT-02 already rejected for the hold ladder. **Reliability informs humans; it does not price deals.** |
| R-07 | 17.13 Fan Demand Signals | 17.07 Booking Enquiry Inbox | Rejected, and the rejection is load-bearing. Both are inbound "someone wants a show" signals, which makes a merge look natural. But an enquiry is a **professional, addressed, structured request that converts into a deal**; a demand signal is an **aggregate, unaddressed, one-way count that converts into nothing**. Merging them would put a consumer-scale pipe into a professional inbox — the harassment vector `meta/personas.md` names and 17.07 DT-03 rejects — and would destroy the inbox's disqualification value (17.07 DT-02). |
