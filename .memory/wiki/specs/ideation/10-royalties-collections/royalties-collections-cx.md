# Royalties & Collections — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Royalties & Collections](./royalties-collections-index.md)
> **Status**: [DEEP] — sub-domain cross-cuts synthesised; every high-confidence edge carries the five synthesis answers.
> **Last updated**: 2026-07-18

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
| CX-13 | [10.02 Statement Ingestion](./10.02-statement-ingestion-normalization/10.02-statement-ingestion-normalization-index.md) | [10.08 Statement Disputes](./10.08-statement-disputes-audit-rights.md) | The **platform-discovered** dispute: a statement that structurally reconciles but whose own arithmetic (rate × units ≠ line, or Σ ≠ declared total) is wrong is a dispute the platform found, with the counterparty's own document as evidence | Musician, Producer | High | 10.02.02 DT-06; 10.02.04 D-15; 10.08 D-05 |
| CX-14 | [10.02 Statement Ingestion](./10.02-statement-ingestion-normalization/10.02-statement-ingestion-normalization-index.md) | [10.03 Calculation & Recoupment](./10.03-calculation-recoupment/10.03-calculation-recoupment-index.md) | Reverse blast-radius edge: a **reversed line-matching mapping** is not one overpayment but every line that mapping ever attributed, across every statement since it was confirmed — `10.03.04` must size the blast before the user confirms | Musician, Producer | High | 10.02.03 → 10.03.04 (D-10, DT-05) |

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

### CX-02: Statement Ingestion ↔ Calculation & Recoupment

**Relationship**: The seam where a parsed fact becomes an income fact. `10.02.03` D-01 guarantees only **confirmed** attributions cross it — no suggestion, no auto-accept — and they must cross **typed by right type** (`10.02.03` DT-12, D-16). The multi-hyphenate gets three statements about one song in one quarter — PRS as writer, PPL as performer, DistroKid as master — one work, three distinct income facts that the calculation engine must never merge into "£X for that song".

Three properties travel with every matched line and are load-bearing on the far side:
- **Right type** selects which of 09's three ledgers the split is read from (composition / master / performer are three party lists, not one — `10.03.01` via 09 DT-04). The type is not a tag on the output; it *chooses the input*.
- **Usage period** (from `10.02.04`) selects the split *version* in 09's as-of read, and fixes the currency-ordering rule: allocate in **source** currency, then convert (`10.02.04` D-09) — because "the parts sum to the whole" is true in exactly one currency and conversion breaks it.
- **The `Unoracled` flag** (`10.02.02` D-09): a number derived from an unverified parse is a weaker claim than one from a verified parse, and the derivation must carry that provenance rather than launder it into a clean figure.

**Role scoping**:
- **Musician**: read-only on the engine; the matched line is the last thing they touch before the working becomes untouchable.
- **Producer**: config on the terms/advances the engine applies; also administers the entities whose lines flow here.
- **Operator / Fan**: absent.

**Synthesis questions answered**:
1. **Shared state conflict**: The matched line is **one object with an attribution state** (`10.02.05` CX-03 Q1) — matching writes it, the engine reads it, neither copies it. If the engine cached a copy, a later re-match (`10.02.05` D-03) would leave two disagreeing truths about one line's owner.
2. **Trigger chain**: parse → reconcile-to-stated-total (HARD gate) → match → **confirm** → type → calculate. Async and staged; a line never reaches the engine unconfirmed, and the reconciliation gate means matching never runs on an un-reconciled statement.
3. **Permission intersection**: A parse the platform could not oracle (`Unoracled`) does not lower what the engine may compute, but it lowers the *confidence label* the derivation must publish (D-08's "state which checks ran and which did not").
4. **Notification fan-out**: A pending file marker (splits summing to 97%) does not silently redistribute — the shortfall routes to `10.02.05` as an aged, money-denominated residual (`10.03.01` DT-11/D-14). Invention is forbidden by domain D-15.
5. **State transition conflict**: The domain's sharpest race (→ CX-14): a **reversed mapping** un-attributes every line it ever touched. Already-moved money becomes an overpayment in `10.03.04`; un-moved money returns to `10.02.05` under cause `reversed`, and the queue's Open total goes *up*, which is correct and will look like a bug.

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

### CX-05: Distribution Calendar ↔ Recovery & Leakage

**Relationship**: Leakage detection's precondition. `10.05.03` cannot flag money that *did not arrive* without a model of what *should have* arrived and by when — and that model is `10.09`'s distribution calendar (`10.09` DT-02, D-04). No calendar, no expectation; no expectation, no detectable absence. The whole leakage thesis (money you never knew you were owed) rests on the platform holding a schedule the user does not.

The calendar's inputs are themselves hand-maintained (`10.09` is not fed by an API — societies do not publish machine-readable schedules), which makes `10.09` load-bearing rather than decorative and creates a reverse dependency: `10.02.04`'s receipt-basis period reasoning uses `10.09`'s usage→distribution lag to bound the usage window of a receipt-dated line.

**Role scoping**:
- **Musician / Producer**: reports-only on the calendar; leakage findings arrive as `10.05.03`'s money-denominated, rate-limited alerts.
- **Operator / Fan**: absent.

**Synthesis questions answered**:
1. **Shared state conflict**: `10.09` owns the expectation (a schedule + expected amount band); `10.05.03` owns the finding. `10.05.03` never writes back a "resolved" onto the calendar — it derives, it does not amend the schedule.
2. **Trigger chain**: calendar says PRS distributes in the March cycle → March passes → no statement (or a £0.00 line, a different finding) → `10.05.03` raises "expected, absent" → routes toward `10.05.01`/registration diagnosis. Async, clock-driven — the absence produces no event, so the calendar manufactures one (D-04's spine).
3. **Permission intersection**: None new; both are the user's own money surfaces.
4. **Notification fan-out**: Subject to `10.05.03` D-03's one-at-a-time, money-denominated discipline — a quarter of missed cycles delivered at once is an indictment, not information.
5. **State transition conflict**: A statement that arrives *late* (after the alarm fired) must retire the finding cleanly, not leave a phantom leak. An expectation is a band, not a point; a distribution inside the band closes it silently.

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

### CX-08: Calculation ↔ Statement Disputes

**Relationship**: Most royalty disputes are **term-interpretation** disputes wearing arithmetic (`10.08` DT-02). The payee says "£0.62 is wrong"; the real disagreement is whether producer points come off the artist's share or gross, whether a deduction stacks before or after the split. `10.03`'s derivation — every step, every base, every clause citation — is the opening evidence, not a defence written after the fact.

The tightest bond here runs to `10.03.02` (Deal Terms → Rate Application), whose D-01 ("every term cites its clause") exists so that a dispute can be argued at the clause, not the number. A term recorded `unwitnessed` (a payer authoring a term against an absent payee) is itself a dispute signal (`10.03.02` → 24).

**Role scoping**:
- **Musician**: disputes as payee; the derivation is what lets them dispute the *interpretation* rather than merely doubting the total.
- **Producer**: both disputes and responds — often the party whose term is being contested.
- **Operator / Fan**: absent.

**Synthesis questions answered**:
1. **Shared state conflict**: The derivation is immutable and versioned (`10.03` D-04); a dispute never edits it — it opens a case that *references* a specific version. Resolving the case may produce a new version with an explicit cause.
2. **Trigger chain**: payee reads statement → disputes a figure → case opens against derivation version N → resolution → if upheld, restatement (`10.03.04`) with money already moved → clawback cascade.
3. **Permission intersection**: `10.03.01`'s explainability promise, taken literally, would publish a bilateral contract to a stranger — the chain explaining a session player's £0.62 names every co-payee's share. Resolution is `10.02.02` D-13's shape one layer out: **compute the whole, disclose only the disputant's slice**.
4. **Notification fan-out**: A dispute freezes the disputed money (→ CX-09) and notifies the counterparty; the derivation travels as the evidence pack.
5. **State transition conflict**: A restatement landing while a dispute on the same period is live must not race the case to a verdict — the money stays held (`10.04.04`) until the case closes.

---

### CX-09: Statement Disputes ↔ Disbursement

**Relationship**: A live dispute holds the money. `10.04.04` (disputed-royalty escrow) exists because paying **either** side of a contested figure is a verdict the platform is not entitled to render (`10.04.04` D-01; `10.08` D-05). The money is real, computed, and payable — and precisely for that reason must not move.

**Role scoping**:
- **Musician / Producer**: the disputing and disputed parties; both see the held state and its reason.
- **Operator**: absent here (dispute *adjudication* tooling is the global Dispute Case Engine's operator surface, not this domain's).
- **Fan**: absent.

**Synthesis questions answered**:
1. **Shared state conflict**: `10.04.04` owns the hold; `10.08` owns the case. The hold is a *consequence* of the case state, never an independent flag — closing the case is the only thing that releases it.
2. **Trigger chain**: dispute opens → payable amount moves to hold → case runs → resolution → release to the correct party (possibly split) or restatement.
3. **Permission intersection**: Only the parties to the disputed line see the hold; a co-payee on the same statement whose share is undisputed is paid normally.
4. **Notification fan-out**: Both parties on open, hold, and release; the payout run (`10.04.01`) must skip held lines without treating them as failures (a hold is not a payment error).
5. **State transition conflict**: A payout run firing mid-dispute must find the line already held — the hold transition must win the race against the run, or the platform pays out money it is adjudicating.

---

### CX-10: Distribution Calendar ↔ Forecasting

**Relationship**: The domain's confidence-firewall. `10.09`'s deterministic in-flight money (a distribution the platform *knows* is scheduled and roughly sized) is forecasting's high-confidence floor; `10.10`'s regression guess is a different epistemic object. `10.09` D-01 and `10.10` D-01 exist to guarantee the two **never share a confidence label** — a known receivable and a statistical estimate must be visually and semantically distinct, or the platform launders a guess into a promise.

**Role scoping**:
- **Musician / Producer**: reports-only on both; the distinction protects them from acting on a forecast as if it were money in flight.
- **Operator / Fan**: absent.

**Synthesis questions answered**:
1. **Shared state conflict**: None — `10.09` is deterministic in-flight, `10.10` is derived estimate. They are adjacent surfaces, not shared state; the firewall is precisely that they must not blend.
2. **Trigger chain**: `10.09`'s calendar → known receivable feeds `10.10` as its high-confidence layer; `10.10` extrapolates beyond it. One-directional; the guess never rewrites the known.
3. **Permission intersection**: None new.
4. **Notification fan-out**: In-flight money can justify a notification ("£X arriving in the March cycle"); a forecast must not — the first optimisation anyone proposes ("show the forecast on the statement") is the one both D-01s forbid.
5. **State transition conflict**: When in-flight money actually arrives (becomes a real statement), it must leave `10.09` and stop being double-counted by `10.10`'s baseline.

---

### CX-12: Cue Sheets ↔ Setlist Reporting _(the instructive contrast)_

**Relationship**: Not a sibling pair — a deliberate contrast that defines the domain's honesty about leverage. `10.06` works because the performer can be **prompted at pack-down** and files against their own membership. `10.07` does not have that lever: a broadcast cue sheet is filed by a **third-party production company** the platform cannot prompt, cannot compel, and often cannot verify (`10.07` D-01, D-02). The pairing exists to stop the second feature over-claiming the first's mechanic.

**Role scoping**:
- **Musician / Producer**: full on their own placements/performances in both; the difference is whether the platform can act or only observe.
- **Operator / Fan**: absent.

**Synthesis questions answered**:
1. **Shared state conflict**: None — different filers, different documents, different bodies. They share only the abstract "a usage report generates PRO money" shape.
2. **Trigger chain**: `10.06`: show → prompt → member files. `10.07`: placement airs → *someone else* should file → the platform can only track the absence.
3. **Permission intersection**: `10.06` rides the user's own credential; `10.07` has no credential to ride, because the filing party is not the user.
4. **Notification fan-out**: `10.06` nudges the member to file; `10.07` can at most surface "no cue sheet observed for this placement" — an absence in a stranger's compliance, not a task.
5. **State transition conflict**: None — `10.07` never writes a filing, so it cannot race one. Its only state is "observed / not observed", which is why merging it with `10.06`'s "file it" affordance would manufacture a fake capability (`10.07` DT-02).

---

### CX-13: Statement Ingestion ↔ Statement Disputes _(the platform-discovered dispute)_

**Relationship**: A new seam the ingestion pass surfaced. `10.02.02`'s reconciliation runs two checks: **structural** (Σ lines = declared total) and **monetary** (rate × units = line). A statement can pass the first and fail the second — which means the **source's own arithmetic does not add up** (`10.02.02` DT-06). That is not a parse failure to route to the exception queue; it is a `source-total-disputed` finding — a dispute the platform *found*, carrying the counterparty's own document as the evidence (`10.02.04` D-15: a file-asserted rate is an assertion, never silently corrected).

This is a materially different origin from CX-08's disputes: CX-08 starts with a payee objecting; CX-13 starts with the platform detecting an internal contradiction in the source before any human looks.

**Role scoping**:
- **Musician / Producer**: the payee whose money the source under-stated; the finding is raised *for* them without them noticing anything wrong.
- **Operator / Fan**: absent.

**Synthesis questions answered**:
1. **Shared state conflict**: The parsed statement is immutable and retained (D-08 discipline); the dispute references it, never rewrites it. The `source-total-disputed` flag is provenance the payee statement (`10.04.02`) inherits.
2. **Trigger chain**: parse → structural reconcile passes → monetary reconcile fails → raise `source-total-disputed` → open case against the source → propagate the flag downstream so no derivation launders it into a clean number.
3. **Permission intersection**: The finding is scoped to the payee(s) named on the failing lines; a multi-party label statement's other parties do not see it.
4. **Notification fan-out**: The user is told the platform found a discrepancy in the source's own figures — a rare "we caught this for you" event, which is the domain's trust-building shape.
5. **State transition conflict**: An adapter correction that re-parses the statement must re-run reconciliation; a discrepancy that disappears on re-parse was the platform's bug (an adapter fault, `10.03.04` D-04), and must be named as such rather than reported as "the source fixed it".

---

### CX-14: Statement Ingestion ↔ Restatement _(the reversed-mapping blast radius)_

**Relationship**: The domain's largest silent-failure surface, and domain D-10/DT-05 made concrete. A line-matching mapping (`10.02.03`) is not a per-line decision — it is a **rule** that has attributed *every* line matching that identity, across *every* statement, since the day it was confirmed. Reversing it (because it was wrong) is therefore not one overpayment: it is a clawback whose size grows with catalogue age and statement volume. `10.03.04` must compute and present that blast radius — **in money and in lines** — *before* the user confirms the reversal.

**Role scoping**:
- **Musician / Producer**: the party confirming the reversal, who must see the true cost of a correction before making it; also potentially the payee facing a clawback.
- **Operator / Fan**: absent.

**Synthesis questions answered**:
1. **Shared state conflict**: The mapping lives in `10.02.03`; the money it moved lives across `10.03`/`10.04` ledgers. Neither can reverse unilaterally — the reversal is one transaction spanning both, or the platform holds an inconsistent belief about who was paid what.
2. **Trigger chain**: user proposes mapping reversal → `10.03.04` enumerates every attributed line since confirmation → sizes the blast (money + line count) → user confirms *with the number in view* → clawbacks issue; un-moved money returns to `10.02.05` under cause `reversed`.
3. **Permission intersection**: Only the affected payees see their portion of the clawback; the reversal's blast summary is the confirming user's, not published to third parties.
4. **Notification fan-out**: Every payee whose already-paid money is clawed back is notified with the cause named honestly (`10.03.04` D-04) — a reversed mapping is the platform's own correction, not "a society adjustment".
5. **State transition conflict**: A statement ingesting *while* a reversal is mid-flight must not be matched by the mapping being reversed — the mapping's state (active / reversing / reversed) gates matching, or the reversal chases a moving target.

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
| R-07 | 10.02.05 Unmatched Line Queue | 10.04.03 Thresholds, Holds & Unpayable Balances | Rejected as a **merge**, and the surface pass had this wrong (`10.02.05` DT-12). Both look like "held money", so the instinct is one queue. But a line cannot be both unattributed and unpayable, because **attribution precedes payment**: `10.02.05` holds money with **no known owner**; `10.04.03` holds money whose owner is **known but unreachable** (below threshold, no method, unclaimed shell). Opposite causes, opposite remedies — one needs a match, the other needs a payout route. They share only a clock (both age and alarm, D-04), which CX-06 records; merging their state would let a resolved attribution silently look like a payout failure, or vice versa. |
| R-08 | 10.02.02 Statement Parsing | 10.02.05 Unmatched Line Queue | Rejected as a destination for **parse failures**, and the boundary is load-bearing (`10.02` R-03). An unparseable line is not an exception to be queued — it **blocks the whole statement at the reconciliation gate** (`10.02.02` D-02), because Σ(parseable lines) ≠ declared total by construction, which destroys the stated-total oracle. Routing parse failures into the unmatched queue would convert a platform-side parsing bug into what looks like ordinary unattributed money, hiding a defect the platform must fix behind money it tells the user is merely "pending a match". The only lines that reach `10.02.05` are cleanly parsed lines that matched nothing. |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-13|D-13]]
- [[decisions.md#d-01s|D-01s]]
