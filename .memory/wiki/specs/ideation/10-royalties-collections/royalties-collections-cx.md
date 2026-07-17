# Royalties & Collections — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Royalties & Collections](./royalties-collections-index.md)
> **Status**: [BREADTH] — children classified; intra-domain cross-cuts mapped.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [10.01 Society Registration](./10.01-society-registration-delivery/10.01-society-registration-delivery-index.md) | [10.02 Statement Ingestion](./10.02-statement-ingestion-normalization/10.02-statement-ingestion-normalization-index.md) | Registration is why money arrives; ingestion is where it lands. The domain's whole loop, and its slowest one | Musician, Producer | High | 10.01.04 D-01; 10.02.01 D-02 |
| CX-02 | [10.02 Statement Ingestion](./10.02-statement-ingestion-normalization/10.02-statement-ingestion-normalization-index.md) | [10.03 Calculation & Recoupment](./10.03-calculation-recoupment/10.03-calculation-recoupment-index.md) | Matched lines are the only input to calculation — and `10.02.03` D-01 guarantees no suggestion ever reaches it | Musician, Producer | High | 10.02.03 D-01; 10.03.01 happy path |
| CX-03 | [10.03 Calculation & Recoupment](./10.03-calculation-recoupment/10.03-calculation-recoupment-index.md) | [10.04 Disbursement & Statements](./10.04-disbursement-payee-statements/10.04-disbursement-payee-statements-index.md) | The derivation is stored upstream and **spent** downstream — `10.04.02` is the only place the domain's value is ever experienced | Musician, Producer | High | 10.03.01 DT-01, D-01; 10.04.02 DT-01 |
| CX-04 | [10.01 Society Registration](./10.01-society-registration-delivery/10.01-society-registration-delivery-index.md) | [10.05 Recovery & Leakage](./10.05-recovery-leakage/10.05-recovery-leakage-index.md) | `overdue`, `unregistered` and `eligible-but-unaffiliated` are leakage's highest-confidence inputs — **and prevention destroys recovery's supply** | Musician, Producer | High | 10.01.04 DT-02; 10.05.03 DT-02; D-16 |
| CX-05 | [10.09 Distribution Calendar](./10.09-distribution-calendar-money-in-flight.md) | [10.05 Recovery & Leakage](./10.05-recovery-leakage/10.05-recovery-leakage-index.md) | No calendar, no expectation, no detectable absence. The calendar is leakage detection's precondition | Musician, Producer | High | 10.09 DT-02, D-04 |
| CX-06 | [10.02 Statement Ingestion](./10.02-statement-ingestion-normalization/10.02-statement-ingestion-normalization-index.md) + [10.04 Disbursement](./10.04-disbursement-payee-statements/10.04-disbursement-payee-statements-index.md) | [10.05 Recovery & Leakage](./10.05-recovery-leakage/10.05-recovery-leakage-index.md) | `10.02.05` and `10.04.03` are **WeJammin's own black box** — the exact condition `10.05.01` sells recovery from | Musician, Producer | High | D-09; 10.02.05 DT-01; 10.04.03 DT-01 |
| CX-07 | [10.06 Setlist Reporting](./10.06-live-setlist-pro-reporting.md) | [10.01 Society Registration](./10.01-society-registration-delivery/10.01-society-registration-delivery-index.md) | Both file against the **performer's own membership**, dodging the accreditation gate the rest of the domain waits on | Musician, Producer, **Operator** | High | 10.06 D-02; 10.01.06 D-02 |
| CX-08 | [10.03 Calculation & Recoupment](./10.03-calculation-recoupment/10.03-calculation-recoupment-index.md) | [10.08 Statement Disputes](./10.08-statement-disputes-audit-rights.md) | Most royalty disputes are **term-interpretation** disputes wearing arithmetic; the derivation is the opening evidence | Musician, Producer | High | 10.03.02 behavior; 10.08 DT-02 |
| CX-09 | [10.08 Statement Disputes](./10.08-statement-disputes-audit-rights.md) | [10.04 Disbursement](./10.04-disbursement-payee-statements/10.04-disbursement-payee-statements-index.md) | A live dispute holds the money (`10.04.04`); paying either side would be a verdict | Musician, Producer | High | 10.04.04 D-01; 10.08 D-05 |
| CX-10 | [10.09 Distribution Calendar](./10.09-distribution-calendar-money-in-flight.md) | [10.10 Forecasting](./10.10-royalty-forecasting.md) | Deterministic in-flight is forecasting's high-confidence layer — and must never share a confidence label with the guess | Musician, Producer | High | 10.09 DT-01; 10.10 D-01 |
| CX-11 | [10.02 Statement Ingestion](./10.02-statement-ingestion-normalization/10.02-statement-ingestion-normalization-index.md) | [10.01 Society Registration](./10.01-society-registration-delivery/10.01-society-registration-delivery-index.md) | Reverse edge: at the MLC, a *registered* work sitting unmatched is **publicly observable** — the domain's only external check on its own registrations | Musician | Medium | 10.01.05 DT-02, D-02 |
| CX-12 | [10.07 Cue Sheets](./10.07-cue-sheets-broadcast-reporting.md) | [10.06 Setlist Reporting](./10.06-live-setlist-pro-reporting.md) | The instructive contrast, not a sibling: the performer can be prompted; a production company cannot be made to file | Musician, Producer | High | 10.07 DT-01, D-01 |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Society Registration ↔ Statement Ingestion

**Relationship**: The domain's whole loop, stated once: **you register so that money arrives; the money arrives as a statement.** Registration (`10.01`) creates the entitlement; ingestion (`10.02`) is where the consequence shows up, six to eighteen months later.

The loop's defect is that it closes *slowly and silently*. A registration that failed produces no statement — and no statement produces no event. Both halves independently reach the domain's D-04 discipline from opposite ends: `10.01.03` D-03 puts an expected-by on the submission; `10.02.01` D-02 builds a source registry whose only purpose is to make a missing distribution observable. Neither works alone. A registration that succeeded and a source that never pays look identical without both.

**Role scoping**:
- **Musician / Producer**: full on both, and the loop is the only reason either half matters to them.
- **Operator / Fan**: absent (Role Matrix findings).

**Synthesis questions answered**:
1. **Shared state conflict**: `10.01.04` owns registration belief; `10.02.01` owns arrival fact. They must not infer each other — a statement arriving does not prove a registration is correct (it may be someone else's money, `10.02.03` DT-03), and a registration does not promise a statement.
2. **Trigger chain**: Register → ack → expectation (`10.09`) → distribution → statement → parse → match → calculate. Six to eighteen months, and every step can fail silently.
3. **Permission intersection**: Registration is gated on accreditation (D-03/Q-03); ingestion is not. **The loop's two halves have completely different permission worlds**, which is why the ungated half is shippable alone.
4. **Notification fan-out**: Both alarm on absence. The alarms must be reconciled or a user gets "registration overdue" and "statement overdue" for one underlying failure.
5. **State transition conflict**: A statement arriving for a work the platform believes unregistered is *information*, not an error — the belief was stale (`10.01.04` D-03). Reconcile toward reality, never toward the belief.

---

### CX-03: Calculation ↔ Disbursement & Statements

**Relationship**: Where the domain either delivers or doesn't. `10.03.01` DT-01 argues the derivation is the product and the number is a byproduct; `10.04.02` DT-01 completes it: **the derivation is only ever experienced in one document.**

Everything upstream — as-of splits (D-02), immutable versions (`10.03` D-04), itemised deductions (`10.03.01` D-05), earned-vs-paid separation (`10.03.01` DT-02) — exists to make one statement true and traceable. A payee never sees the calculation engine. If `10.04.02` renders `£0.00` with no working, every one of those decisions was wasted and the platform shipped a prettier Curve.

`10.04.02` DT-02 identifies the differentiator's exact location: the chain must run **past** the source line (which Curve and Exactuals already do) to the **split as of the usage period** and **the session where that split was agreed**. Those two links are unreproducible by anyone who was not in the room — `problem-statement.md`'s root cause ("absence at the point of truth") stated as a product feature.

**Role scoping**:
- **Musician**: read-only on calculation, full on their statement. The statement is the deliverable; the transfer is plumbing.
- **Producer**: config on terms/advances (payer side), and **issues** statements to payees they administer.
- **Operator / Fan**: absent.

**Synthesis questions answered**:
1. **Shared state conflict**: The derivation is `10.03.01`'s and is read by the statement and the run — never copied, or two documents about one payment would eventually disagree.
2. **Trigger chain**: Calculate → payability (`10.03.03`) → select → aggregate → net → pay → **statement always**, including zero-paid (`10.04.01` D-03).
3. **Permission intersection**: A payer-issued statement exposes session economics to a payee entitled to their share and not everyone else's (`10.04.02` Q-02) — unresolved.
4. **Notification fan-out**: Every payee, every period. Non-payment has five distinct meanings (`10.04.01` DT-02) and all five render identically unless the statement distinguishes them.
5. **State transition conflict**: A restatement after issue requires a new version with an explicit delta and its **cause** (`10.03.04` D-02) — never a silent reissue of a document the payee already holds.

---

### CX-04: Society Registration ↔ Recovery & Leakage

**Relationship**: The domain's most uncomfortable edge, and the one the owner must resolve.

The mechanical half is clean: `10.01.04`'s `overdue`, `unregistered` and `rejected` states, plus `10.01.01`'s missing affiliations and `10.01.06`'s "eligible but unaffiliated", are `10.05.03`'s highest-confidence and highest-volume inputs. Registration state *is* leakage detection's raw material.

The strategic half is not clean. `10.01.04` DT-02 states it plainly: **if registration works, WeJammin is the reason its own users have less black-box money to find.** The domain's advertised activation event — *"we found you £800"* — is powered by precisely the failure `10.01.04` exists to eliminate. `10.05.03` DT-02 arrives at the same collision from the other side and adds the gating asymmetry: recovery needs five external permissions, prevention needs none.

Domain D-16 proposes the resolution — **recover the back catalogue once; prevent from today, forever** — and flags that it must be *chosen*, because the two arguments point at different first screens, different roadmaps and different marketing (Q-10, `10.05.03` Q-02).

**Role scoping**:
- **Musician**: experiences recovery as a moment and prevention as an ongoing absence of bad news — harder to sell, better to have.
- **Producer**: highest yield on both. More works, more territories, more sessions, more gaps.
- **Operator / Fan**: absent.

**Synthesis questions answered**:
1. **Shared state conflict**: None. `10.01.04` owns registration belief; `10.05.03` derives findings from it and must never write back — a detector that "fixes" state would be inferring registration from its own diagnosis.
2. **Trigger chain**: Leak → unregistered work → society collects → cannot attribute → black box → `10.05.01` finds it → `10.05.02` claims it → registration follows → **the leak closes and stops producing more**.
3. **Permission intersection**: The decisive asymmetry (`10.05` CX-04). Detection: zero external gates. Search: two. Claiming: five. The roadmap should follow the gates, not the drama.
4. **Notification fan-out**: `10.05.03` D-03 rate-limits findings to one at a time — a career's accumulated leakage delivered at once is an indictment, not information (`10.05.03` DT-03). A black-box hit is the rare finding that has earned an interruption.
5. **State transition conflict**: A leak remedied while a black-box claim on the same work is in flight — a registration and a claim arriving at one body, about one work, from one platform. Almost certainly a society-side conflict (`10.05.02` Q-03), unresolved.

---

### CX-06: Ingestion + Disbursement ↔ Recovery _(the platform's own black box)_

**Relationship**: The domain's integrity check, and domain D-09.

`10.05.01` sells recovery from a specific, nameable condition: **money held by an institution that knows the amount, knows the work, and cannot reach the person.** Two features in this domain produce exactly that condition inside WeJammin:

- **`10.02.05`** — a royalty line that arrived, parsed, reconciled, and matched nothing. Real money, no owner.
- **`10.04.03`** — money calculated correctly for a payee who cannot be paid: below threshold, no method, or an **unclaimed shell** (`02.03`) with a real credit and a real neighbouring-rights claim who has never heard of WeJammin.

A `NULL` in a matching table and a `balance` column with no clock are, functionally and precisely, a black box. The platform building the cure would be quietly accumulating the disease — and a competitor, a journalist, or a user will eventually name it.

Hence the shared design: both must be **money-denominated** (`10.02.05` D-01, `10.04.03` D-01), both **age and alarm** (D-04's fourth and fifth occurrences), and neither may ever silently drop.

**Role scoping**:
- **Musician**: sees their own unattributed and held money as money, not as an error log. The honest sibling of `10.05.01`'s pitch, pointed inward.
- **Producer**: the party most able to resolve an unmatched line, and the **only channel** to a shell payee (`credits-attribution-cx.md` CX-04) — now with cash attached (`10.04.03` DT-02).
- **Operator / Fan**: absent.

**Synthesis questions answered**:
1. **Shared state conflict**: The two are distinct and must stay so (`10.04` R-01): `10.02.05` is money with **no owner**; `10.04.03` is money with **no route to a known owner**. Opposite causes, opposite remedies. They share only a clock.
2. **Trigger chain**: Arrive → fail to attribute → queue → age → alarm → *(claim window closes)* → **permanent loss**. And: calculate → cannot pay → hold → age → alarm → *(forever?)*.
3. **Permission intersection**: You only ever see your own. Label statements naming third parties are the sharp edge (`10.02` Q-03) — one user's document, several people's money.
4. **Notification fan-out**: `10.04.03` DT-02's unresolved question is the sharpest in the drill: is *"£340 is waiting for you"* an acceptable message to a person who never signed up? It is simultaneously the **strongest growth lever on the map** and an unsolicited financial communication to a non-user.
5. **State transition conflict**: `10.02.05` D-03 re-sweeps the queue whenever the catalogue changes — a human confirmation must outrank an automated re-match, or the sweep quietly overwrites a decision.

---

### CX-07: Setlist Reporting ↔ Society Registration _(the ungated path)_

**Relationship**: The pair that inverts the naive roadmap, and the domain's only appearance of the Operator persona.

Domain D-03 splits everything on one gate: is WeJammin an accredited administrator (Q-03)? Two features escape it entirely, for the same reason. `10.01.06` D-02: **SoundExchange and PPL admit performers directly.** `10.06` D-02: **a setlist return is filed against the performer's own PRO membership.** In both cases the user's own credential is the credential, and the platform's standing is irrelevant.

Compose that with `10.01.06` DT-01 — neighbouring rights is keyed on a **credit**, the one thing domain 02 captures — and with `10.06` DT-02 — the setlist's hard part is a **prompt at pack-down**, which is `02.02.03`'s close prompt in a different room — and a pattern appears: **the two features most tightly bound to `D-18`'s wedge are also the two least blocked by the domain's biggest business-model unknown.** A roadmap that builds performance and mechanical registration first because they sound more central has it backwards.

`10.06` DT-03 adds the domain's only Operator: a venue's blanket licence is what *generated* the live money, and in several territories they carry a reporting obligation. It was nearly missed.

**Role scoping**:
- **Musician**: the persona both features exist for. A session player with credits and no PPL membership; a gigging musician playing 80 shows nobody reports.
- **Producer**: performer in both; also `10.01.06` DT-03's featured/non-featured assertion about people who are not present.
- **Operator**: **config at `10.06` only** — the single exception across 28 leaf features.
- **Fan**: absent, as everywhere in this domain.

**Synthesis questions answered**:
1. **Shared state conflict**: Both write per-body, per-territory registration/return state — one keyed on a recording, one on a performance. `10.01.04` D-01's model covers both.
2. **Trigger chain**: Credit captured (02) + ISRC → eligibility → **member's own filing**. And: show (17/18) → setlist prompt at pack-down → match to works → **member's own return**. Neither chain passes through the platform's standing.
3. **Permission intersection**: The good kind — the credential belongs to the user, so Q-03 does not apply.
4. **Notification fan-out**: "Eligible, unregistered" is the highest-volume finding in the domain and lands on people who have never heard of neighbouring rights. For shells, money accrues to someone with no channel (`10.01.06` Q-02).
5. **State transition conflict**: `10.06` Q-02 — if the venue and the act both report one show, the platform must not file twice at one PRO. Two returns for one show from one platform is a bad first impression with a counterparty `10.01` needs.

---

## Cross-Cuts Routed to the Global CX

> Mechanisms that are **not** nodes in this domain. Recorded here so `ideation-cx.md` can absorb
> them; also returned in this drill's `crossCuts`.

| Mechanism | Serves | Domain 10's relationship |
|---|---|---|
| **Deal Terms & Settlement Rules Engine** _(proposed — new)_ | 10, 17, 23, 05, 13, 14 | **The drill's strongest structural finding** (`10.03.02` DT-03). "Compute money from receipts under agreed terms, net against what was fronted" is not a royalty concept. A live settlement is a guarantee vs a door percentage after costs, recouping the guarantee — an advance and a rate in different clothes (17). Management commission is a rate on receipts (23). Fee schedules are rates (05/13/14). One engine: terms, thresholds, deductions, recoupment against a float, applied as of a date. Built four times = four dialects, four rounding policies, four sets of bugs — and the live-settlement one will be written by someone who has never heard of packaging deductions. |
| **Point-in-Time / As-Of Record Resolution** _(proposed — new)_ | 09, 10, 11, 12, 23 | Domain D-02. A Q1 2024 usage pays the people who owned it in Q1 2024. Needed independently by `10.01.07` (territorial chains), `10.02.04` (usage vs payment dates), `10.03.01` (splits), `10.03.02` (terms) and `10.03.04` (restatement) — and by 11 (ownership as of the licence date) and 23 (contract terms as of). Bitemporal by necessity. **Q-05 is the live risk**: if 09 is current-state, everything downstream is silently wrong. |
| **Unclaimed & Unpayable Balance Handling** _(proposed — new)_ | 10, 05, 13, 14, 17, 19 | Domain D-09 (`10.04.03` DT-01). Money owed to a payee the platform cannot reach — an unclaimed shell (`02.03`), a below-threshold balance, a dead payee. **Not a payment-rails concept**: the rails handle a failed transfer, not money owed to someone who does not exist on the platform. Any domain whose payout can target a shell has this problem, and every one of them will otherwise reinvent it as a `balance` column with no clock. |
| **Standards-Body Emission & Acknowledgement Transport** _(proposed — new)_ | 02, 10, 11, 12 | `10.01.03` Q-03. This domain's CWR delivery, 12's DDEX ERN, `02.08`'s RIN and `10.05.02`'s claim submissions are one machine: batch payload, no per-item status call, sequence-stateful retries, ack parsing, and an **expected-by alarm** because silence is the failure mode (D-04). Differ only in payload and counterparty. Three domains are otherwise about to build it three times. |
| **Payments, Escrow & Payouts** (`CX-M01`) | already global | `10.04.01` and `10.04.04` ride the rails. Domain-owned: **royalty payout-run semantics** — aggregation-before-payment, thresholds, idempotent resume (`10.04.01` DT-01) — and **royalty hold triggers** (`10.04.04` DT-01). A checkout splits one known payment three ways; a royalty run pays hundreds of parties across tens of thousands of sub-penny lines. |
| **Canonical Data, Taxonomy & Entity Resolution** (`CX-M17`) | already global | `10.02.03` and `10.05.01` ride the matching machinery — **with inverted error budgets** (`10.05.01` DT-01), which the cross-cut's owner needs to know. Domain-owned is the **credits graph as the discriminator** (`10.02.03` DT-02): a generic matcher compares a line to a title list; this platform can ask whether that writer surname was in the room. |
| **Dispute Case Engine** _(already routed by `credits-attribution-cx.md`)_ | 02, 05, 09, 10, 13, 14, 17, 19, 24 | `10.08` rides it (D-05); `10.04.04` holds the money. **Two domains reached this independently** — the strongest available evidence the cross-cut is real rather than an evasion. |
| **Audit Log & Provenance Ledger** (`CX-M19`) | already global | Immutable calculation versions and preserved causation (`10.03.04` D-01, D-02). `credits-attribution-cx.md` already named domain 10 as a consumer; this drill confirms it from the money side. |
| **Tax & Fiscal Compliance** (`CX-M02`) | already global | Withholding at payout (`10.04.01`); 23 owns the cross-border reclaim side. |
| **Localization, Currency & Timezone** (`CX-M20`) | already global | `10.02.04` rides rate sourcing. The **policy** — which rate, which date, **who bears the FX movement** — is domain-owned and unresolved (`10.02.04` Q-01, DT-03). Not deciding means the platform silently absorbs an unhedged currency position. |
| **Analytics Instrumentation & Per-Domain Reporting** (`CX-M30`) | already global | `10.05.03` and `10.10` ride the surface. **The expectation and the semantics stay here** (`10.05.03` DT-01, `10.10` DT-03) — a detector in domain 22 would chart numbers with no notion of what is missing. |
| **Integrations, Public API & Webhooks** (`CX-M22`) | already global | `10.01.03` rides credentials/retries/scheduling. Domain-owned: batch semantics and **human delivery channels** (`10.01.03` D-05) — several societies have no automated intake, and hiding that behind a spinner produces silent stalls. |
| **Notifications & Alerts** (`CX-M07`) | already global | Delivery is machinery; the **money-denominated framing** and one-at-a-time discipline (`10.05.03` D-03) are domain-owned. "412 rows" gets muted; "£340 of your money" gets clicked. |
| **Offline & Low-Connectivity Field Resilience** (`CX-M32`) | already global | `10.06` Q-03 — the setlist prompt fires on a phone, in a venue, at 1am, possibly with no signal. Load-bearing here, not a nicety. |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 10.05 Recovery & Leakage | 10.03 Calculation & Recoupment | Rejected: they are both "about money that should be yours" and share nothing else. `10.03` computes amounts from **statements that arrived**; `10.05` finds money that **never arrived or arrived elsewhere**. There is no shared state, no trigger, and — decisively — a recovered amount does not enter calculation as a special case; it is a payment from a society for a claim, arriving through `10.02` like any other statement. Wiring them would suggest the calculation engine can compute money the platform never received, which is forecasting (`10.10`) wearing a calculator's costume. |
| R-02 | 10.01 Society Registration | 10.04 Disbursement | Rejected as a direct pair despite both being "about money reaching a person". Registration determines whether a **society** pays *the platform's user*; disbursement determines whether **the platform** pays *a payee*. Different money, different direction, different counterparty. They are connected only through the entire chain (CX-01 → CX-02 → CX-03), and a direct edge would imply registration state gates a payout — which would be false and would break the compute-only product shape that Q-07 keeps open. |
| R-03 | 10.10 Forecasting | 10.03 Calculation & Recoupment | Rejected, and the boundary is load-bearing given D-15. `10.03` computes money that **exists**, from lines that arrived, with a derivation. `10.10` guesses money that **might exist**. Linking them would put a statistical output adjacent to an auditable one in the same neighbourhood, and the first optimisation anyone proposes would be "show the forecast on the statement". `10.09` D-01 and `10.10` D-01 exist precisely to keep a published fact and a regression output from sharing a confidence label; a domain-level edge here would undo both. The legitimate relationship is CX-10, and it runs through `10.09` — the deterministic half — on purpose. |
| R-04 | 10.07 Cue Sheets | 10.01 Society Registration | Rejected: both involve PROs, and that is the whole of the resemblance. `10.01` registers **a work's ownership** with a body, from domain 09's ledger, under the platform's or the user's standing. `10.07` tracks whether **a third-party production** filed a usage document the platform cannot file, cannot compel, and often cannot even verify (`10.07` D-02, D-04). One is an act the platform performs; the other is an absence it observes in a stranger's compliance. Merging them would put a "file it" affordance next to something unfileable — the exact over-claim `10.07` DT-02 rejects. |
| R-05 | 10.06 Setlist Reporting | 10.02 Statement Ingestion | Rejected as a **pipeline** pair. It is tempting because filing a return eventually produces income that arrives as a statement — but that is true of every registration in the domain and is CX-01's content, not a special edge. `10.06`'s genuine dependency on `10.02` is narrow and already recorded: it borrows `10.02.03`'s song→work matching machinery. Logging a pipeline edge would imply setlist returns have a distinct ingestion path, which they do not: live performance income arrives on a PRS distribution like everything else, indistinguishable from the rest of the line item. |
| R-06 | 10.09 Distribution Calendar | 10.04 Disbursement | Rejected, and the confusion is worth pre-empting because both are about "when money moves". `10.09` tracks **society distribution schedules** — when a third party pays *in*. `10.04.01` Q-02 asks about **payout cadence** — when the platform pays *out*. They are unrelated clocks with unrelated owners, and coupling them would suggest the platform's payout run should follow a society's calendar. It should not: a run pays whatever is payable from all sources, and a payee's money from six sources on six schedules is one transfer (`10.04.01` D-02). |
