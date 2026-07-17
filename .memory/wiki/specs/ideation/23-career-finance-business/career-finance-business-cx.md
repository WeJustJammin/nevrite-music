# Career, Finance & Business Management — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Career, Finance & Business Management](./career-finance-business-index.md)
> **Status**: [BREADTH] — 9 children classified; intra-domain cross-cuts mapped.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [23.01 Income Aggregation](./23.01-income-aggregation-financial-identity/23.01-income-aggregation-financial-identity-index.md) | **All other children** | The income ledger is the domain's spine — every other child reads it, and none of them work before it exists | Musician, Producer, Operator | High | Tax packs, invoicing reconciliation, netting, runway, P&L and benchmarking all consume income rows |
| CX-02 | [23.03 Invoicing & Receivables](./23.03-invoicing-receivables/23.03-invoicing-receivables-index.md) | [23.01 Income Aggregation](./23.01-income-aggregation-financial-identity/23.01-income-aggregation-financial-identity-index.md) | If WeJammin collects on invoices, off-platform income becomes **verified** — attacking 23.01's coverage-vs-credibility tension at its root | Musician, Producer, Operator | High | The highest-leverage interaction in the domain; see 23.03.02 Q-01 |
| CX-03 | [23.04 Deal & Contract Vault](./23.04-deal-contract-vault/23.04-deal-contract-vault-index.md) | [23.06 Advances, Commission & Recoupment](./23.06-advances-commission-recoupment/23.06-advances-commission-recoupment-index.md) | Contract terms **are** the netting rules — rate, scope, sequence and sunset all come from the vault, not from settings | Musician, Producer | High | A commission rate someone typed is not a rate anyone agreed to (23.06.02 D-04) |
| CX-04 | [23.01 Income Aggregation](./23.01-income-aggregation-financial-identity/23.01-income-aggregation-financial-identity-index.md) | [23.06 Advances, Commission & Recoupment](./23.06-advances-commission-recoupment/23.06-advances-commission-recoupment-index.md) | Verified income is the underwriting asset; an advance taken is a **liability** that must never re-enter the ledger as income | Musician, Producer | High | 23.06.01 exists only because 23.01.04 does; the misclassification trap is 23.01.02's |
| CX-05 | [23.02 Expenses & Tax Readiness](./23.02-expenses-tax-readiness/23.02-expenses-tax-readiness-index.md) | [23.07 Budgeting & Project/Tour P&L](./23.07-budgeting-project-tour-pl/23.07-budgeting-project-tour-pl-index.md) | The same expense rows, cut two ways: by tax year (statutory) and by project (management) | Musician, Producer | High | A tour's van hire is both a 2026 deduction and a tour cost; captured once, viewed twice |
| CX-06 | [23.06 Advances, Commission & Recoupment](./23.06-advances-commission-recoupment/23.06-advances-commission-recoupment-index.md) | [23.05 Career Progression & Benchmarking](./23.05-career-progression-benchmarking/23.05-career-progression-benchmarking-index.md) | Runway (23.06.04) and stability-shaped goals (23.05.01) are the same anxiety in two shapes, reading the same rows | Musician, Producer | Medium | 23.05.01 DT-02 and 23.06.04 DT-02 reached the same finding independently |
| CX-07 | [23.04 Deal & Contract Vault](./23.04-deal-contract-vault/23.04-deal-contract-vault-index.md) | [23.02 Expenses & Tax Readiness](./23.02-expenses-tax-readiness/23.02-expenses-tax-readiness-index.md) | A performance contract specifies **who bears withholding** — the clause decides who actually loses the money 23.02.04 tries to reclaim | Musician | Medium | Foreign performance contracts routinely allocate withholding risk explicitly |
| CX-08 | [23.08 Point-of-Need Insurance](./23.08-point-of-need-insurance.md) | [23.02 Expenses & Tax Readiness](./23.02-expenses-tax-readiness/23.02-expenses-tax-readiness-index.md) | Premiums are deductible expenses; policies are dated documents needing 23.04's alerting | Musician, Producer, Operator | Medium | A lapsed policy is a dated risk like any other contract term |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Income Aggregation ↔ All Other Children

**Relationship**: 23.01 is not one child among nine — it is the substrate. The tax pack assembles it; invoicing reconciles against it; netting deducts from it; runway forecasts it; the P&L scopes it; benchmarking aggregates it; underwriting assesses it. **Nothing else in this domain functions before the income ledger exists**, which makes the domain's build order fixed rather than negotiable and is the strongest argument for 23.01.01 being the domain's only `must`.

**Role scoping**:
- **Musician**: every child touches their ledger; the portfolio is the whole point.
- **Producer**: same, with the payer side (they pay contributors) doubling their exposure.
- **Operator**: reads it, but their books of record are elsewhere (23.02 D-02) — for them WeJammin is a feed, not a system.
- **Fan**: no access anywhere in domain 23.

**Synthesis questions answered**:
1. **Shared state conflict**: 23.01 owns income rows. No sibling writes them; all derive. A sibling that needs to create income (a collected invoice, a band distribution) does so by **emitting an event**, exactly as external domains do.
2. **Trigger chain**: An income event fans out to tax, netting, runway, P&L and goals. Fan-out failure must not lose the row — the ledger is authoritative and consumers are eventually consistent.
3. **Permission intersection**: Delegated access (accountant, manager, bookkeeper) is granted per-sibling, not domain-wide. An accountant needs the tax pack, not the runway; a manager needs commission, not the proof-of-earnings artefact.
4. **Notification fan-out**: Income arrival can simultaneously complete a goal (23.05), clear a position (23.06) and stop a dunning ladder (23.03.03).
5. **State transition conflict**: A reversal must propagate everywhere — un-completing a goal, re-opening a recoupment position, restating a P&L that may already have been distributed and spent. **Reversal is the domain's hardest transition** and it is under-specified at breadth in every child.

### CX-02: Invoicing & Receivables ↔ Income Aggregation

**Relationship**: The domain's highest-leverage question, hiding inside its least glamorous sub-domain. 23.01's central tension is coverage vs credibility (`23.01-income-aggregation-financial-identity-cx.md#CX-01`): imported income is complete but unprovable. If WeJammin puts a payment link on an off-platform invoice and collects it, that income arrives as **platform-moved money** — verified by construction. Invoicing would then be converting the unprovable half of a musician's income into the provable half, one invoice at a time, which is worth more to 23.01.04 and 23.06.01 than any feature inside them.

**Role scoping**:
- **Musician**: their off-platform income is the largest and least provable share.
- **Producer**: invoice-backed already; collection makes it verified.
- **Operator**: high volume in both directions.
- **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: A collected invoice emits an income event like any other domain (CX-01, point 1) — invoicing never writes the ledger directly.
2. **Trigger chain**: Invoice issued → paid via platform → verified income event → ladder stops → statement improves.
3. **Permission intersection**: The payer is usually **not a WeJammin user** (23.03.01 DT-03), which constrains the entire flow.
4. **Notification fan-out**: Payment stops the dunning ladder immediately — the reconciliation lag is 23.03.03's worst bug.
5. **State transition conflict**: Chargebacks and refunds on collected invoices reverse *verified* income — the CX-01 reversal problem at its most consequential, because a reversed verified row may already have underwritten an advance.

### CX-03: Deal & Contract Vault ↔ Advances, Commission & Recoupment

**Relationship**: 23.06 computes; 23.04 supplies the rules it computes with. The commission rate, the income classes in scope, the netting sequence, the sunset date — all are contract terms, none are settings. This coupling is why 23.04.02's manual term entry must be first-class (23.04.02 D-02): if extraction were a prerequisite, 23.06 would be gated behind the domain's riskiest component.

**Role scoping**:
- **Musician**: the party deducted from, and the one who does not know what their contract says.
- **Producer**: points and production terms.
- **Operator**: neither — no commission, no recoupment.
- **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The vault owns terms; the netting ledger owns balances and sequence application. Terms are **time-versioned** — a netting pins to the rules in force on the event's date.
2. **Trigger chain**: Term confirmed → rule active → income nets. An unspecified sequence **blocks** rather than defaults (23.06.03 D-01).
3. **Permission intersection**: The manager is delegate *and* beneficiary — the domain's sharpest conflict of interest. They may never alter rate, scope or sequence.
4. **Notification fan-out**: A sunset expiring (23.04.03) stops a commission (23.06.02) — the highest-value automation in the domain; the money it saves leaves silently otherwise.
5. **State transition conflict**: A sunset expiring mid-netting; an amended contract restating live rules.

### CX-04: Income Aggregation ↔ Advances, Commission & Recoupment

**Relationship**: Two directions. Forward: verified income (23.01.04) is the underwriting asset that makes 23.06.01 possible at all — no other party can see a working musician's portfolio. Backward: an advance is a **liability** that looks exactly like income when it lands in a bank account, and if 23.01.02 imports it as income, three artefacts are wrong at once (tax pack, proof-of-earnings, runway).

**Role scoping**: Musician and Producer. Operator excluded (23.06 Role Matrix — no advances, no commission, no catalogue); Fan excluded.

**Synthesis questions answered**:
1. **Shared state conflict**: Liabilities and income are separate records, never merged.
2. **Trigger chain**: Advance → position opens → nets every covered income event → clears at zero.
3. **Permission intersection**: A funder reading a user's income is a distinct purpose requiring scoped, revocable consent.
4. **Notification fan-out**: Position cleared — one of the domain's few genuinely good notifications.
5. **State transition conflict**: A reversal after recoupment re-opens a position; see CX-01 point 5.

### CX-05: Expenses & Tax Readiness ↔ Budgeting & Project/Tour P&L

**Relationship**: One capture, two cuts. A van hire is simultaneously a 2026 deduction (statutory view) and a tour cost (management view). Capturing twice would guarantee drift, so the row is captured once (23.02.01) and carries both a tax category and a project tag. **Project tagging is load-bearing for the P&L** (23.07.01 DT-02) while tax categorization is load-bearing for the pack — two independent classifications on one row, each silently fatal to a different consumer if missed.

**Role scoping**:
- **Musician**: both cuts matter; tagging is the weak link.
- **Producer**: recording budgets are contractual and recoupable, so the project cut carries legal weight.
- **Operator**: the event is their project (17), not a tour.
- **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: One row, two classifications, neither authoritative over the other.
2. **Trigger chain**: Capture → categorize (tax) + tag (project) → flows to pack and P&L independently.
3. **Permission intersection**: Band project rows are visible to band members (a real intra-band disclosure); personal tax categories are not.
4. **Notification fan-out**: Budget overrun alerts during the work; tax blockers alert at pack time.
5. **State transition conflict**: Re-categorizing or re-tagging a row inside a closed tax period or an already-distributed P&L.

### CX-06: Advances/Recoupment ↔ Career Progression

**Relationship**: 23.05.01 DT-02 concluded that meaningful goals are stability-shaped; 23.06.04 DT-02 concluded that runway's value is the gap and its lead time. Same insight from two directions — the musician's real financial question is not "how much" but "will it be there". Medium confidence: whether these are two features or one is genuinely unresolved, and it is a live argument for 23.05's thinness (23.05 Q-01).

**Synthesis questions**: Deferred per template guidance — Medium confidence.

### CX-07: Deal & Contract Vault ↔ Expenses & Tax Readiness

**Relationship**: A foreign performance contract typically allocates withholding risk — gross vs net deals decide whether the promoter or the artist bears the 15–30% withheld at source. 23.02.04 tries to reclaim it; 23.04's contract says who lost it in the first place, and whether reclaiming it is even the user's right. Medium confidence; synthesis deferred.

### CX-08: Point-of-Need Insurance ↔ Expenses & Tax Readiness

**Relationship**: Premiums are deductible (23.02.01), and policies are dated documents whose lapse is a risk (23.04.03). Insurance is the domain's most connected leaf feature despite being its most peripheral. Medium confidence; synthesis deferred.

---

## Domain-Wide Invariants

> Recorded here because each emerged **independently in three or more sub-domains** during this pass. That makes them properties of the domain rather than of any feature — downstream spec writers should apply them without re-deriving them.

| # | Invariant | Where it emerged |
|---|-----------|------------------|
| INV-01 | **Forecasts, plans and aspirations must never touch records of what happened.** A quote is not income; a goal is not income; a runway is not evidence. | Rejected pairs in 23.03 (`#R-01`), 23.05 (`#R-01`), 23.06 (`#R-02`) — three independent rejections of one mistake |
| INV-02 | **Surface and cite; never adjudicate.** The platform is not a party to its users' contracts. Disagreements are findings, not merge conflicts. | 23.04.04 D-01, 23.06.03 DT-03, 23.03.03's dispute handling |
| INV-03 | **Verified and declared are never summed.** Trust tiering is a property of every row and is destroyed by any consumer that averages across it. | 23.01 D-03, 23.05.03 D-04, 23.06.01 D-02 |
| INV-04 | **The maximal version of nearly every feature here requires a regulated role.** Filing (23.02.03), lending (23.06.01), routing commission (23.06.02), holding band funds (23.07.03), insurance broking (23.08). Five occurrences is the domain's defining characteristic, not five footnotes — and it is the one place where the maximal-ambition directive (D-03 global) meets a constraint that effort cannot dissolve. | 23.07.03 DT-03 named the pattern; the other four found it separately |
| INV-05 | **Refusing to compute is sometimes correct.** An unspecified netting sequence, an ambiguous commission scope, an undeterminable treaty position: hold the row, name the gap. A confident wrong number is money. | 23.06.03 D-01, 23.06.02 D-02, 23.02.04's states |

---

## Cross-Cuts Absorbed Into the Global CX

> These emerged during this pass as **mechanisms serving many domains**, not as children of 23. Recorded for the orchestrator to absorb into `ideation-cx.md`. Per the Node Classification Gate, no node was created for any of them.

| Mechanism | Why it is a cross-cut, not a node | Serves |
|-----------|-----------------------------------|--------|
| **Representation & Delegated Access** | Candidate 13 ("Artist Roster & Manager Workspace") classified here. A manager, accountant, bookkeeper or band admin acting on behalf of a person or entity is an authz mechanism, not a thing in 23 — and D-19 admits no fifth persona, so representation **must** be delegation rather than a role. Its sharpest property is domain-wide: the delegate is frequently the counterparty (a manager administering the agreement that pays them). | 01, 05, 09, 10, 12, 17, 18, 21, 23 |
| **Income Event Emission Contract** | A normalized emission (gross/deductions/net, native currency, idempotency key, reversal semantics, optional `work_id`) that ~10 domains must implement for 23.01 to exist at all. A contract many domains implement is a mechanism, not a feature of its consumer. Domains that omit `work_id` silently break 23.01.05 with no error anywhere. | 05, 06, 10, 11, 12, 13, 14, 17, 19, 20 → 23 |
| **Document & Evidence Storage** | Receipts (23.02.01), contracts (23.04.01), policies (23.08), riders (18), split sheets (09) and licences (11) all need storage, versioning, retention and e-signature. Building it inside the contract vault would be the fifth copy — 23.04 D-03. | 09, 11, 18, 23 |
| **Consent & Purpose Limitation** | Aggregating a user's verified income into another user's benchmark (23.05.03), or exposing it to a funder (23.06.01), are purposes distinct from the one they signed up for. A mechanism and a GDPR obligation, not a feature. | 20, 22, 23, 24 |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 23.05 Career Progression & Benchmarking | 23.04 Deal & Contract Vault | No interaction. Career goals and contract terms share no state and no trigger: a management agreement's option window has nothing to do with whether you played 20 shows this year. The plausible-looking link ("a goal to get a publishing deal") is an aspiration about a document that does not exist yet — INV-01. |
| R-02 | 23.08 Point-of-Need Insurance | 23.06 Advances, Commission & Recoupment | Considered because both are referral businesses with an affiliate conflict (23.08 DT-01, 23.06.01 DT-03) — a shared *shape*, not a shared *interaction*. They touch no common state and neither triggers the other. Recorded because "both are financial products, group them" is a tempting and empty abstraction: a premium and an advance have nothing in common except that a third party provides them. |
| R-03 | 23.09 Career Sustainability Signals | 23.05 Career Progression & Benchmarking | Considered — both are "how is my career going" features — and rejected on the ground that 23.09 should not exist (proposed `wont`, 23.09 DT-03). Wiring a health-adjacent signal into cohort benchmarking would additionally mean **comparing users' inferred wellbeing to each other**, compounding 23.09's GDPR Art. 9 problem with 23.05.03's re-identification risk. Two dangerous features that are worse together than apart. |
| R-04 | 23.03 Invoicing & Receivables | 23.05 Career Progression & Benchmarking | Considered: should payment-history data inform career benchmarks ("peers get paid in 30 days, you wait 90")? Rejected — it is 23.03.03's counterparty-reputation question (DT-03, Q-01) wearing a benchmarking costume, and routing it through 23.05 would smuggle a de-facto credit rating on named businesses in through a side door while bypassing the values decision that question demands. |
| R-05 | 23.07 Budgeting & Project/Tour P&L | 23.03 Invoicing & Receivables | Considered — a tour's income arrives partly via invoices, so the two touch money for the same event. Rejected as **indirect**: both resolve through 23.01's ledger (CX-01), which is precisely what a spine is for. A direct link would be a second path between the same two facts and would drift from the first. |
