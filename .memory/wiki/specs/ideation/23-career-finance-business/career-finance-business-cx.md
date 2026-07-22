# Career, Finance & Business Management — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Career, Finance & Business Management](./career-finance-business-index.md)
> **Status**: [DEEP] — 9 children classified; intra-domain cross-cuts synthesised with 5-question depth on every High-confidence pair.
> **Last updated**: 2026-07-18

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [23.01 Income Aggregation](./23.01-income-aggregation-financial-identity/23.01-income-aggregation-financial-identity-index.md) | **All other children** | The income ledger is the domain's spine — every other child reads it, and none of them work before it exists | Musician, Producer, Operator | High | Tax packs, invoicing reconciliation, netting, runway, P&L and benchmarking all consume income rows (D-05) |
| CX-02 | [23.03 Invoicing & Receivables](./23.03-invoicing-receivables/23.03-invoicing-receivables-index.md) | [23.01 Income Aggregation](./23.01-income-aggregation-financial-identity/23.01-income-aggregation-financial-identity-index.md) | If WeJammin collects on invoices, off-platform income becomes **verified** — attacking 23.01's coverage-vs-credibility tension at its root; and the dunning ladder must halt the instant the ledger reconciles | Musician, Producer, Operator | High | 23.03.02 Q-01 (highest-leverage question); 23.03.03 state-race on reconciliation lag |
| CX-03 | [23.04 Deal & Contract Vault](./23.04-deal-contract-vault/23.04-deal-contract-vault-index.md) | [23.06 Advances, Commission & Recoupment](./23.06-advances-commission-recoupment/23.06-advances-commission-recoupment-index.md) | Contract terms **are** the netting rules — rate, scope, sequence and sunset all come from the vault, not from settings | Musician, Producer | High | A commission rate someone typed is not a rate anyone agreed to (23.06.02 D-04) |
| CX-04 | [23.01 Income Aggregation](./23.01-income-aggregation-financial-identity/23.01-income-aggregation-financial-identity-index.md) | [23.06 Advances, Commission & Recoupment](./23.06-advances-commission-recoupment/23.06-advances-commission-recoupment-index.md) | Verified income is the underwriting asset; an advance taken is a **liability** that must never re-enter the ledger as income | Musician, Producer | High | 23.06.01 exists only because 23.01.04 does; the misclassification trap is 23.01.02's; imported-advance-as-income corrupts recoupment |
| CX-05 | [23.02 Expenses & Tax Readiness](./23.02-expenses-tax-readiness/23.02-expenses-tax-readiness-index.md) | [23.07 Budgeting & Project/Tour P&L](./23.07-budgeting-project-tour-pl/23.07-budgeting-project-tour-pl-index.md) | The same expense rows, cut two ways: by tax year (statutory) and by project (management) | Musician, Producer | High | A tour's van hire is both a 2026 deduction and a tour cost; captured once, viewed twice |
| CX-06 | [23.02 Expenses & Tax Readiness](./23.02-expenses-tax-readiness/23.02-expenses-tax-readiness-index.md) | [23.01 Income Aggregation](./23.01-income-aggregation-financial-identity/23.01-income-aggregation-financial-identity-index.md) | Tax-pack issuance is **gated on the ledger's reconciliation state** — unresolved import duplicates or missing FX rates block a final export, because a wrong number filed with a tax authority is worse than a late one | Musician, Producer | High | 23.02.03 blocked by 23.01.02 import duplicates + 23.01.03 unresolved FX (state-race); verified/declared segregation carried into the pack |
| CX-07 | [23.03 Invoicing & Receivables](./23.03-invoicing-receivables/23.03-invoicing-receivables-index.md) | [23.02 Expenses & Tax Readiness](./23.02-expenses-tax-readiness/23.02-expenses-tax-readiness-index.md) | An invoice must **anticipate withholding** so the ladder does not chase a lawful deduction as a debt; its tax-identity/VAT fields derive from the tax profile; and an uncollectable receivable becomes a bad-debt tax event | Musician, Producer | High | 23.03.02 → 23.02.04 (withholding-not-shortfall); 23.03.02 → 23.02.02 (VAT/jurisdiction from profile); 23.03.03 → 23.02.03 (bad-debt relief) |
| CX-08 | [23.04 Deal & Contract Vault](./23.04-deal-contract-vault/23.04-deal-contract-vault-index.md) | [23.02 Expenses & Tax Readiness](./23.02-expenses-tax-readiness/23.02-expenses-tax-readiness-index.md) | A performance contract specifies **who bears withholding** — the clause decides who actually loses the money 23.02.04 tries to reclaim | Musician | Medium | Foreign performance contracts routinely allocate withholding risk explicitly (CX-07's upstream cause) |
| CX-09 | [23.06 Advances, Commission & Recoupment](./23.06-advances-commission-recoupment/23.06-advances-commission-recoupment-index.md) | [23.05 Career Progression & Benchmarking](./23.05-career-progression-benchmarking/23.05-career-progression-benchmarking-index.md) | Runway (23.06.04) and stability-shaped goals (23.05.01) are the same anxiety in two shapes, reading the same rows | Musician, Producer | Medium | 23.05.01 DT-02 and 23.06.04 DT-02 reached the same finding independently |
| CX-10 | [23.08 Point-of-Need Insurance](./23.08-point-of-need-insurance.md) | [23.02 Expenses & Tax Readiness](./23.02-expenses-tax-readiness/23.02-expenses-tax-readiness-index.md) | Premiums are deductible expenses; policies are dated documents needing 23.04's alerting | Musician, Producer, Operator | Medium | A lapsed policy is a dated risk like any other contract term; registry (15) underwrites the sum insured |
| CX-11 | [23.01 Income Aggregation](./23.01-income-aggregation-financial-identity/23.01-income-aggregation-financial-identity-index.md) | [23.07 Budgeting & Project/Tour P&L](./23.07-budgeting-project-tour-pl/23.07-budgeting-project-tour-pl-index.md) | FX is not only a display projection — a tour budgeted in GBP and spent in EUR carries **realised FX exposure that is itself a P&L cost line**, not a rendering choice | Musician, Producer | Medium | 23.01.03 → 23.07 (FX exposure a real tour cost, distinct from CX-02's reporting projection) |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Cross-references:** When referencing a CX entry from another file, use format `career-finance-business-cx.md#CX-NN`.

---

## Cross-Cut Details

### CX-01: Income Aggregation ↔ All Other Children

**Relationship**: 23.01 is not one child among nine — it is the substrate. The tax pack assembles it; invoicing reconciles against it; netting deducts from it; runway forecasts it; the P&L scopes it; benchmarking aggregates it; underwriting assesses it. **Nothing else in this domain functions before the income ledger exists**, which makes the domain's build order fixed rather than negotiable and is the strongest argument for 23.01.01 being the domain's only `must` (D-05).

**Role scoping**:
- **Musician**: every child touches their ledger; the portfolio is the whole point.
- **Producer**: same, with the payer side (they pay contributors) doubling their exposure.
- **Operator**: reads it, but their books of record are elsewhere (23.02 D-02) — for them WeJammin is a feed, not a system.
- **Fan**: no access anywhere in domain 23.

**Synthesis questions answered**:
1. **Shared state conflict**: 23.01 owns income rows; every native currency/amount is immutable (23.01's own CX-02). No sibling writes them; all derive. A sibling that needs to create income (a collected invoice, a band distribution) does so by **emitting an event**, exactly as external domains do — never by direct write.
2. **Trigger chain**: An income event fans out asynchronously to tax, netting, runway, P&L and goals. Fan-out failure must not lose the row — the ledger is authoritative and consumers are eventually consistent. There is no rollback of the ledger row itself; consumers reconcile forward.
3. **Permission intersection**: Delegated access (accountant, manager, bookkeeper) is granted **per-sibling, not domain-wide**. An accountant needs the tax pack, not the runway; a manager needs commission, not the proof-of-earnings artefact. A delegate may never raise a row's trust tier.
4. **Notification fan-out**: A single income arrival can simultaneously complete a goal (23.05), clear a recoupment position (23.06) and stop a dunning ladder (23.03.03) — one event, three consumer notifications.
5. **State transition conflict**: A reversal must propagate everywhere — un-completing a goal, re-opening a recoupment position, restating a P&L that may already have been distributed and spent. **Reversal is the domain's hardest transition** and it is under-specified at breadth in every child.

### CX-02: Invoicing & Receivables ↔ Income Aggregation

**Relationship**: The domain's highest-leverage question, hiding inside its least glamorous sub-domain. 23.01's central tension is coverage vs credibility: imported income is complete but unprovable. If WeJammin puts a payment link on an off-platform invoice and collects it, that income arrives as **platform-moved money** — verified by construction. Invoicing would then be converting the unprovable half of a musician's income into the provable half, one invoice at a time, worth more to 23.01.04 and 23.06.01 than any feature inside them. The mirror problem: the dunning ladder (23.03.03) reads ledger status to know when to fire and stop, and **reconciliation lag is its most damaging failure mode** — chasing someone who already paid.

**Role scoping**:
- **Musician**: their off-platform income is the largest and least provable share.
- **Producer**: invoice-backed already; collection makes it verified.
- **Operator**: high volume in both directions.
- **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: A collected invoice emits an income event like any other domain (CX-01, point 1) — invoicing never writes the ledger directly. The invoice owns its own lifecycle; the ledger owns the money.
2. **Trigger chain**: Invoice issued → paid via platform → verified income event → ladder halts → statement improves. Synchronous halt on reconcile; the failure mode is async lag leaving the ladder live.
3. **Permission intersection**: The payer is usually **not a WeJammin user** (23.03.01 DT-03), which constrains the whole flow. A delegated bookkeeper must be able to run the same escalation ladder without owning the money.
4. **Notification fan-out**: Payment stops the dunning ladder immediately; every ladder step is meanwhile an outbound message to a (usually off-platform) counterparty via the Notifications cross-cut.
5. **State transition conflict**: Chargebacks and refunds on collected invoices reverse *verified* income — the CX-01 reversal problem at its most consequential, because a reversed verified row may already have underwritten an advance (CX-04).

### CX-03: Deal & Contract Vault ↔ Advances, Commission & Recoupment

**Relationship**: 23.06 computes; 23.04 supplies the rules it computes with. The commission rate, the income classes in scope, the netting sequence, the sunset date — all are contract terms, none are settings. This coupling is why 23.04.02's manual term entry must be first-class (23.04.02 D-02): if extraction were a prerequisite, 23.06 would be gated behind the domain's riskiest component.

**Role scoping**:
- **Musician**: the party deducted from, and the one who does not know what their contract says.
- **Producer**: points and production terms.
- **Operator**: neither — no commission, no recoupment.
- **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The vault owns terms; the netting ledger owns balances and sequence application. Terms are **time-versioned** — a netting pins to the rules in force on the event's date; a side letter becomes a new term-set version (23.04.01 DT-03 / D-14), not an edit.
2. **Trigger chain**: Term confirmed → rule active → income nets. An unspecified sequence **blocks** rather than defaults (23.06.03 D-01, INV-05).
3. **Permission intersection**: The manager is delegate *and* beneficiary — the domain's sharpest conflict of interest. They may never alter rate, scope or sequence.
4. **Notification fan-out**: A sunset expiring (23.04.03) stops a commission (23.06.02) — the highest-value automation in the domain; the money it saves leaves silently otherwise.
5. **State transition conflict**: A sunset expiring mid-netting; an amended contract restating live rules while a netting run is in flight.

### CX-04: Income Aggregation ↔ Advances, Commission & Recoupment

**Relationship**: Two directions. Forward: verified income (23.01.04) is the underwriting asset that makes 23.06.01 possible at all — no other party can see a working musician's portfolio. Backward: an advance is a **liability** that looks exactly like income when it lands in a bank account, and if 23.01.02 imports it as income, three artefacts are wrong at once (tax pack, proof-of-earnings, runway).

**Role scoping**: Musician and Producer. Operator excluded (23.06 Role Matrix — no advances, no commission, no catalogue); Fan excluded.

**Synthesis questions answered**:
1. **Shared state conflict**: Liabilities and income are separate records, never merged. An imported credit that is actually an advance must **net rather than count** (23.01.02 → 23.06).
2. **Trigger chain**: Advance → position opens → nets every covered income event → clears at zero. Recoupment state must be readable by the income-to-work projection (23.01.05) so a fully-recouped work still renders both gross and net-to-me.
3. **Permission intersection**: A funder reading a user's income is a distinct purpose requiring scoped, revocable consent (Consent & Purpose Limitation cross-cut). Delegated-manager visibility of earnings-per-work is **unresolved** — commission is computed from it (argues yes) but DT-03 default-deny argues no; deferred to `/create-prd-security`.
4. **Notification fan-out**: Position cleared — one of the domain's few genuinely good notifications.
5. **State transition conflict**: A reversal after recoupment re-opens a position; a reversed verified row that underwrote an advance is CX-01 point 5 at its most expensive.

### CX-05: Expenses & Tax Readiness ↔ Budgeting & Project/Tour P&L

**Relationship**: One capture, two cuts. A van hire is simultaneously a 2026 deduction (statutory view) and a tour cost (management view). Capturing twice would guarantee drift, so the row is captured once (23.02.01) and carries both a tax category and a project tag. **Project tagging is load-bearing for the P&L** (23.07.01 DT-02) while tax categorization is load-bearing for the pack — two independent classifications on one row, each silently fatal to a different consumer if missed.

**Role scoping**:
- **Musician**: both cuts matter; tagging is the weak link.
- **Producer**: recording budgets are contractual and recoupable, so the project cut carries legal weight.
- **Operator**: the event is their project (17), not a tour.
- **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: One row, two classifications, neither authoritative over the other. Category vocabulary is jurisdiction-defined (23.02.02) — there is no neutral category list.
2. **Trigger chain**: Capture → categorize (tax) + tag (project) → flows to pack and P&L independently. An uncategorized/evidence-less row surfaces as a pack **blocker** (23.02.01 → 23.02.03).
3. **Permission intersection**: Band project rows are visible to band members (a real intra-band disclosure); personal tax categories are not. A Band-entity expense must hit band P&L, not reduce personal taxable profit — entity context must be explicit at capture (23.02.01 → 01).
4. **Notification fan-out**: Budget-overrun alerts during the work; tax blockers alert at pack time.
5. **State transition conflict**: Re-categorizing or re-tagging a row inside a closed tax period or an already-distributed P&L; an accountant re-categorization must flow back to 23.02.02 without silently restating a filed pack.

### CX-06: Expenses & Tax Readiness ↔ Income Aggregation (issuance gate)

**Relationship**: Distinct from CX-01's generic "everything reads the ledger." The tax pack (23.02.03) does not merely consume income rows — its **final export is gated on the ledger's reconciliation state**. Unresolved duplicate-adjudication rows (23.01.02) or unresolved FX (23.01.03) must **block** a final pack, because overstating income to a tax authority — or issuing a verified statement carrying a wrong FX figure behind a verification badge — is a categorically worse failure than delivering the pack late. The pack also inherits the verified/declared segregation: the two totals are assembled separately and never summed (INV-03).

**Role scoping**:
- **Musician**: the party who files; the one harmed by a confidently wrong number.
- **Producer**: same, with a larger deduction surface.
- **Operator**: `📊 Reports` only — their books of record and their accountant sit outside WeJammin (23.02 D-02).
- **Fan**: no access.

**Synthesis questions answered**:
1. **Shared state conflict**: 23.01 owns the income rows and their reconciliation status; 23.02.03 owns the assembled, point-in-time pack artefact. The pack is a **snapshot with provenance**, not a live view — it pins the rows it was built from.
2. **Trigger chain**: Reconcile income → resolve FX → resolve import duplicates → *then* export is permitted. Any unresolved upstream state is a hard block, not a warning (INV-05). Synchronous gate at export time.
3. **Permission intersection**: Accountant handoff is a **scoped, revocable, period-limited delegated grant** (Representation & Delegated Access cross-cut) — not a PDF. The accountant is a delegated actor, not a fifth persona (D-19).
4. **Notification fan-out**: When income arrives *after* handoff, a **superseding pack version** is issued and both user and accountant are notified — the accountant may already have filed. A trust-tier change on a row a statement was issued from must likewise invalidate/supersede that statement.
5. **State transition conflict**: Late income vs an already-filed pack is the core race; resolved by supersede-and-notify rather than silent restatement. A row whose trust tier changes downstream re-opens a pack that was believed final.

### CX-07: Invoicing & Receivables ↔ Expenses & Tax Readiness

**Relationship**: Three concrete couplings, all real money. (a) A short payment on a foreign invoice may be **lawful withholding, not a shortfall** — the invoice must anticipate it (23.03.02 → 23.02.04) so the dunning ladder does not chase a foreign payer for tax they correctly withheld; the withheld amount is then carried into the pack as a **tax credit, not an expense** (worth real money to reclaim). (b) The invoice's tax-identity, VAT/GST status and compliance-field treatment **derive from the user's tax profile** (23.03.02 → 23.02.02) — the same jurisdiction-scalar problem, no neutral default. (c) An uncollectable receivable written off carries a **bad-debt tax consequence** (bad-debt relief in some jurisdictions) that must reach the pack (23.03.03 → 23.02.03).

**Role scoping**:
- **Musician**: the cross-border performer most exposed to at-source withholding.
- **Producer**: invoice-heavy; VAT treatment on service invoices matters most.
- **Operator**: `📊 Reports` on tax; issues invoices at volume.
- **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The invoice owns issued terms and status; the tax layer owns categorization and jurisdiction rules. Neither writes the other — the invoice **reads** the tax profile at issuance and **feeds** the pack at settlement/write-off.
2. **Trigger chain**: Issue invoice (reads tax profile → VAT fields) → payment short → reclassify as withholding *before* escalation → carry into pack as tax credit. Uncollectable → write off → bad-debt relief line in pack. Misclassifying withholding as a shortfall is the damaging failure (wrongly dunning a compliant payer).
3. **Permission intersection**: A delegated bookkeeper/manager must be able to run the ladder *and* see the withholding reclassification, but not alter the tax profile the invoice derives from.
4. **Notification fan-out**: Reclassifying a short payment as withholding suppresses the next ladder step; a written-off receivable notifies the pack that a bad-debt line is available.
5. **State transition conflict**: A payment arriving after a bad-debt write-off must reverse the relief already claimed in a pack (ties to CX-06's supersede path); a withholding reclassification that later proves to be a genuine shortfall must re-arm the ladder.

---

### CX-08: Deal & Contract Vault ↔ Expenses & Tax Readiness

**Relationship**: A foreign performance contract typically allocates withholding risk — gross vs net deals decide whether the promoter or the artist bears the 15–30% withheld at source. 23.02.04 tries to reclaim it; 23.04's contract says who lost it in the first place, and whether reclaiming it is even the user's right. This is the upstream cause of CX-07(a): the invoice anticipates withholding because the contract allocated it. Medium confidence; synthesis to firm up at `/create-prd-security` alongside Q-06 (jurisdiction as an attribute of identity).

### CX-09: Advances/Recoupment ↔ Career Progression

**Relationship**: 23.05.01 DT-02 concluded that meaningful goals are stability-shaped; 23.06.04 DT-02 concluded that runway's value is the gap and its lead time. Same insight from two directions — the musician's real financial question is not "how much" but "will it be there". Medium confidence: whether these are two features or one is genuinely unresolved, and it is a live argument for 23.05's thinness (Q-05).

### CX-10: Point-of-Need Insurance ↔ Expenses & Tax Readiness

**Relationship**: Premiums are deductible (23.02.01), and policies are dated documents whose lapse is a risk (23.04.03). The sum insured is underwritten by the Gear Registry (15), which values the same capital purchase 23.02 treats as a tax asset. Insurance is the domain's most connected leaf feature despite being its most peripheral. Medium confidence; synthesis deferred.

### CX-11: Income Aggregation ↔ Budgeting & Project/Tour P&L (realised FX)

**Relationship**: Distinct from CX-01's projection concern. FX in 23.01.03 is normally a *derived reporting projection* over an immutable native amount. But a tour **budgeted in GBP and spent in EUR** realises an actual FX gain or loss between commitment and settlement — and that delta is a genuine cost line the tour P&L (23.07) must book, not a display choice. The same multi-country reality (shared with 18 Touring) manufactures FX, withholding and per-diems as real tour costs. Medium confidence: whether realised FX is modelled as its own P&L line or absorbed into each converted row is unresolved and routes to `/create-prd-architecture` with Q-06.

---

## Domain-Wide Invariants

> Recorded here because each emerged **independently in three or more sub-domains** during this pass. That makes them properties of the domain rather than of any feature — downstream spec writers should apply them without re-deriving them.

| # | Invariant | Where it emerged |
|---|-----------|------------------|
| INV-01 | **Forecasts, plans and aspirations must never touch records of what happened.** A quote is not income; a goal is not income; a runway is not evidence. | Rejected pairs in 23.03 (`#R-01`), 23.05 (`#R-01`), 23.06 (`#R-02`) — three independent rejections of one mistake |
| INV-02 | **Surface and cite; never adjudicate.** The platform is not a party to its users' contracts. Disagreements are findings, not merge conflicts. | 23.04.04 D-01, 23.06.03 DT-03, 23.03.03's dispute handling |
| INV-03 | **Verified and declared are never summed.** Trust tiering is a property of every row and is destroyed by any consumer that averages across it. | 23.01 D-03, 23.05.03 D-04, 23.06.01 D-02 |
| INV-04 | **The maximal version of nearly every feature here requires a regulated role.** Filing (23.02.03), lending (23.06.01), routing commission (23.06.02), holding band funds (23.07.03), insurance broking (23.08). Five occurrences is the domain's defining characteristic, not five footnotes — and it is the one place where the maximal-ambition directive (D-03 global) meets a constraint that effort cannot dissolve. | 23.07.03 DT-03 named the pattern; the other four found it separately |
| INV-05 | **Refusing to compute is sometimes correct.** An unspecified netting sequence, an ambiguous commission scope, an undeterminable treaty position, an unresolved FX rate, an unadjudicated import duplicate: hold the row, name the gap, block the export. A confident wrong number is money. | 23.06.03 D-01, 23.06.02 D-02, 23.02.04's states, CX-06's issuance gate |

---

## Cross-Cuts Absorbed Into the Global CX

> These emerged during this pass as **mechanisms serving many domains**, not as children of 23. Recorded for the orchestrator to absorb into `ideation-cx.md`. Per the Node Classification Gate, no node was created for any of them.

| Mechanism | Why it is a cross-cut, not a node | Serves |
|-----------|-----------------------------------|--------|
| **Representation & Delegated Access** | Candidate 13 ("Artist Roster & Manager Workspace") classified here. A manager, accountant, bookkeeper or band admin acting on behalf of a person or entity is an authz mechanism, not a thing in 23 — and D-19 admits no fifth persona, so representation **must** be delegation rather than a role. Its sharpest property is domain-wide: the delegate is frequently the counterparty (a manager administering the agreement that pays them). Maps to the registry's *Roles, Permissions & Delegated Authority*, with the counterparty-delegate refinement. | 01, 05, 09, 10, 12, 17, 18, 21, 23 |
| **Income Event Emission Contract** | A normalized emission (gross/deductions/net, native currency, idempotency key, reversal semantics, optional `work_id`) that ~10 domains must implement for 23.01 to exist at all. A contract many domains implement is a mechanism, not a feature of its consumer. Domains that omit `work_id` silently break 23.01.05 with no error anywhere. **Not covered by the registry's Analytics Instrumentation (fire-and-forget, no money semantics) nor Split-Capture Trigger (disbursement, not aggregation).** | 05, 06, 10, 11, 12, 13, 14, 17, 19, 20 → 23 |
| **Document & Evidence Storage** | Receipts (23.02.01), contracts (23.04.01), policies (23.08), riders (18), split sheets (09) and licences (11) all need storage, versioning, retention and e-signature. Building it inside the contract vault would be the fifth copy — 23.04 D-03. Maps to registry *Object & Evidence Storage* + *Contracts, E-Signature & Attestation*. | 09, 11, 18, 23 |
| **Consent & Purpose Limitation** | Aggregating a user's verified income into another user's benchmark (23.05.03), or exposing it to a funder (23.06.01), are purposes distinct from the one they signed up for. A mechanism and a GDPR obligation, not a feature. Maps to registry *Privacy, Consent & Data Portability*. | 20, 22, 23, 24 |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 23.05 Career Progression & Benchmarking | 23.04 Deal & Contract Vault | No interaction. Career goals and contract terms share no state and no trigger: a management agreement's option window has nothing to do with whether you played 20 shows this year. The plausible-looking link ("a goal to get a publishing deal") is an aspiration about a document that does not exist yet — INV-01. |
| R-02 | 23.08 Point-of-Need Insurance | 23.06 Advances, Commission & Recoupment | Considered because both are referral businesses with an affiliate conflict (23.08 DT-01, 23.06.01 DT-03) — a shared *shape*, not a shared *interaction*. They touch no common state and neither triggers the other. Recorded because "both are financial products, group them" is a tempting and empty abstraction: a premium and an advance have nothing in common except that a third party provides them. |
| R-03 | 23.09 Career Sustainability Signals | 23.05 Career Progression & Benchmarking | Considered — both are "how is my career going" features — and rejected on the ground that 23.09 should not exist (proposed `wont`, 23.09 DT-03). Wiring a health-adjacent signal into cohort benchmarking would additionally mean **comparing users' inferred wellbeing to each other**, compounding 23.09's GDPR Art. 9 problem with 23.05.03's re-identification risk. Two dangerous features that are worse together than apart. |
| R-04 | 23.03 Invoicing & Receivables | 23.05 Career Progression & Benchmarking | Considered: should payment-history data inform career benchmarks ("peers get paid in 30 days, you wait 90")? Rejected — it is 23.03.03's counterparty-reputation question (DT-03, Q-01) wearing a benchmarking costume, and routing it through 23.05 would smuggle a de-facto credit rating on named businesses in through a side door while bypassing the values decision that question demands. |
| R-05 | 23.07 Budgeting & Project/Tour P&L | 23.03 Invoicing & Receivables | Considered — a tour's income arrives partly via invoices, so the two touch money for the same event. Rejected as **indirect**: both resolve through 23.01's ledger (CX-01), which is precisely what a spine is for. A direct link would be a second path between the same two facts and would drift from the first. |
| R-06 | 23.02 Expenses & Tax Readiness | 23.06 Advances, Commission & Recoupment | Considered because both "reduce a number": deductions reduce taxable profit, commission/recoupment reduce net income. Rejected — they net against **different bases in different orders** (tax profit vs gross receipts) and share no row and no trigger. Conflating them is the classic error INV-01/INV-05 guard against; each holds its own order-of-operations. |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-19|D-19]]
- [[decisions.md#d-03|D-03]]
