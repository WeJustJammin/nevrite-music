# Royalties & Collections — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-16
> **Novelty**: `industry-standard` | **Priority**: `core` _(raised to core by D-10 — rights stack is the thesis)_

## Overview

Registering with the bodies that collect and turning what arrives into correct, explainable, per-person money — PRO/mechanical/neighbouring registration, statement ingestion, calculation and recoupment, payee statements, and black-box recovery.

**Why this is a top-level domain**: Kept separate from Rights & Ownership because owning something and collecting on it are different problems with different counterparties: money arrives not because you own a work but because you registered it with the right body, in the right territory, in the right format — and the hard part is the rejection loop nobody notices for a year. Songtrust, Curve, Exactuals and Reprtoir are whole companies inside this box. Black-box recovery is the strongest activation event in the corpus: real money, already collected, belonging to a specific person who cannot find it because matching needs exactly the credits-plus-identity graph this platform builds. 'We found you £800 you didn't know you had' is the most powerful onboarding moment available — but note it is a once-event, not a daily habit, which is why it is the activation and not the wedge. Live setlist reporting is the same mechanic applied to the gigs nobody reports.

**Interacting capabilities** (what justifies domain status):

- society registration & rejection handling
- statement ingestion & normalization
- royalty calculation & recoupment
- split disbursement & payee statements
- black-box recovery
- live setlist → PRO reporting

## Children

> Classified 2026-07-16 through the Node Classification Gate. 18 sweep candidates → **5 sub-domains
> + 5 top-level features** (28 leaf features in total), with 1 candidate split, 2 re-cut, and
> 7 Deep Think additions. 81 Deep Think hypotheses logged. All `[SURFACE]`.

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 10.01 | Society Registration & Delivery | sub-domain | [10.01-society-registration-delivery/](./10.01-society-registration-delivery/) | `[BREADTH]` | 19 hypotheses (7 children) |
| 10.02 | Statement Ingestion & Normalization | sub-domain | [10.02-statement-ingestion-normalization/](./10.02-statement-ingestion-normalization/) | `[DEEP]` | 15 hypotheses (5 children) |
| 10.03 | Royalty Calculation & Recoupment | sub-domain | [10.03-calculation-recoupment/](./10.03-calculation-recoupment/) | `[BREADTH]` | 12 hypotheses (4 children) |
| 10.04 | Disbursement & Payee Statements | sub-domain | [10.04-disbursement-payee-statements/](./10.04-disbursement-payee-statements/) | `[BREADTH]` | 11 hypotheses (4 children) |
| 10.05 | Recovery & Leakage | sub-domain | [10.05-recovery-leakage/](./10.05-recovery-leakage/) | `[BREADTH]` | 9 hypotheses (3 children) |
| 10.06 | Live Performance Setlist → PRO Reporting | feature | [10.06-live-setlist-pro-reporting.md](./10.06-live-setlist-pro-reporting.md) | `[SURFACE]` | 3 hypotheses |
| 10.07 | Cue Sheets & Broadcast Performance Reporting | feature | [10.07-cue-sheets-broadcast-reporting.md](./10.07-cue-sheets-broadcast-reporting.md) | `[SURFACE]` | 3 hypotheses |
| 10.08 | Statement Disputes & Audit Rights | feature | [10.08-statement-disputes-audit-rights.md](./10.08-statement-disputes-audit-rights.md) | `[SURFACE]` | 3 hypotheses |
| 10.09 | Distribution Calendar & Money-in-Flight | feature | [10.09-distribution-calendar-money-in-flight.md](./10.09-distribution-calendar-money-in-flight.md) | `[SURFACE]` | 3 hypotheses |
| 10.10 | Royalty Forecasting | feature | [10.10-royalty-forecasting.md](./10.10-royalty-forecasting.md) | `[SURFACE]` | 3 hypotheses |

> **Type column values:**
> - `sub-domain` — a grouping with 2+ interacting capabilities (folder with index + CX)
> - `feature` — a leaf node describing a single capability (.md file)

### Candidate Disposition

> Every sweep candidate accounted for. Pruning, re-cutting and promotion are all expected outcomes.

| Sweep candidate | Disposition |
|---|---|
| 01 PRO/CMO Registration & Society Delivery | → **re-cut** across `10.01.01`–`10.01.04` (D-07). It named delivery and buried the rejection loop in a bullet |
| 02 Mechanical Rights Administration (MLC/HFA/MCPS) | → feature `10.01.05` |
| 03 Neighbouring Rights & Performer Auto-Registration | → feature `10.01.06` — **the domain's tightest bond to the thesis** (D-11) |
| 04 Sub-Publishing & Territory Administration | → feature `10.01.07`, scoped to "hold the map, name the gaps" (D-12) |
| 05 CWR & Society File Exchange | → feature `10.01.03`, **renamed in substance** to per-society delivery profiles (`10.01.03` D-01) |
| 06 Works Registration & Clean Metadata Emission | → **re-cut**; the payload half is `10.01.02`, overlapping candidate 01 (D-07) |
| 07 Black Box & Unclaimed Royalty Recovery | → **split**: search `10.05.01` (ungated) / claim `10.05.02` (five gates). D-13 |
| 08 Live Performance Setlist → PRO Reporting | → feature `10.06` |
| 09 Cue Sheets & Broadcast Performance Reporting | → feature `10.07` — real leak, minimal platform leverage (`10.07` DT-02) |
| 10 Royalty Statement Ingestion & Normalization | → **expanded** into sub-domain `10.02` (5 features) |
| 11 Royalty Calculation Engine | → feature `10.03.01` |
| 12 Advances & Recoupment | → feature `10.03.03` |
| 13 Split Payments & Disbursement | → feature `10.04.01` — rails are a cross-cut (`10.04` D-02) |
| 14 Royalty Statements to Payees | → feature `10.04.02` — **where the domain's value is delivered** (`10.04.02` DT-01) |
| 15 Statement Disputes & Audit Rights | → **feature** `10.08` — the dispute *engine* is a cross-cut (D-05) |
| 16 Escrow for Disputed Royalties | → feature `10.04.04` — escrow is a cross-cut (D-06) |
| 17 Royalty Leakage Detection | → feature `10.05.03` |
| 18 Royalty Forecasting & Analytics | → feature `10.10`; the **money-in-flight** half split out as `10.09` (D-14) |
| _Deep Think addition_ | `10.01.04` Registration Status & Rejection Loop — **the domain's own Overview names it as the hard part; no candidate covered it** |
| _Deep Think addition_ | `10.02.04` Currency, FX & Period Normalization |
| _Deep Think addition_ | `10.02.05` Unmatched Line & Exception Queue |
| _Deep Think addition_ | `10.03.02` Deal Terms → Royalty Rate Application |
| _Deep Think addition_ | `10.03.04` Restatement, Adjustment & Overpayment — **retroactive change is the normal weather; the sweep had none of it** |
| _Deep Think addition_ | `10.04.03` Thresholds, Holds & Unpayable Balances |
| _Deep Think addition_ | `10.09` Distribution Calendar & Money-in-Flight |

## Role Matrix

> Personas from [meta/personas.md](../meta/personas.md) — referenced, never redefined.
> The sweep's provisional list (songwriter, performer, publisher, label, manager, rights
> administrator, estate) is **superseded by D-19**. Those are not personas; they are roles a
> Musician or Producer occupies, which is exactly `personas.md`'s multi-hyphenate point.
>
> **Legend**: ✅ Full access · ⚙️ Configuration only · 👁️ Read-only · 📊 Reports only · ❌ No access

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 10.01 Society Registration & Delivery | ✅ Full (own works + memberships) | ✅ Full (own + as publisher entity) | ❌ None | ❌ None |
| 10.02 Statement Ingestion & Normalization | ✅ Full (own sources + unmatched money) | ✅ Full (own + administered entities) | ❌ None | ❌ None |
| 10.03 Calculation & Recoupment | 👁️ Read-only (the working; never editable) | ⚙️ Config (terms/advances they pay under) | ❌ None | ❌ None |
| 10.04 Disbursement & Payee Statements | ✅ Full (own statement) · ⚙️ Config (payout method) | ✅ Full (own + issues statements to payees) | ❌ None | ❌ None |
| 10.05 Recovery & Leakage | ✅ Full (searches/claims own) · 📊 Reports (gaps) | ✅ Full (own + administered) | ❌ None | ❌ None |
| 10.06 Live Setlist → PRO Reporting | ✅ Full (own performances) | ✅ Full (where they perform) | **⚙️ Config** (their licence generated the money; they can report/confirm) | ❌ None |
| 10.07 Cue Sheets & Broadcast Reporting | ✅ Full (own placements) | ✅ Full | ❌ None | ❌ None |
| 10.08 Statement Disputes & Audit Rights | ✅ Full (disputes as payee) | ✅ Full (disputes and responds) | ❌ None | ❌ None |
| 10.09 Distribution Calendar & Money-in-Flight | 📊 Reports | 📊 Reports | ❌ None | ❌ None |
| 10.10 Royalty Forecasting | 📊 Reports | 📊 Reports | ❌ None | ❌ None |

> **Three findings worth carrying downstream:**
> - **Fan is `None` across all ten children — the only domain drilled so far with no Fan surface whatsoever.** Not simplified, not read-only, absent. Domain 02 found the opposite (`credits-attribution-index.md`: Discogs and AllMusic are fan products). Royalty collection has no consumer-facing half, and D-13's "fans are first-class users" has zero consequence here. That is a real fact, not an oversight.
> - **Operator appears exactly once, at `10.06`.** A venue's blanket PRS/ASCAP licence is what *generated* live performance money, and in several territories they carry a reporting obligation. Everywhere else in this domain they sell time and space and hold no rights. The exception was nearly missed (`10.06` DT-03) and is the sweep's provisional persona list being wrong in the opposite direction from domain 02's.
> - **Musician and Producer diverge on payee-vs-payer, never on seniority.** A Producer configures terms and advances because they are on the paying side; when they are the payee their access is identical. Do not build two products from one scope difference.

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Kept separate from Rights & Ownership because owning something and collecting on it are different problems with different counterparties: money arrives not because you own a work but because you registered it with the right body, in the right territory, in the right format. | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | **Domain 10 never owns a split.** It reads domain 09's ledger **as of the usage period**, never as it stands today | A Q1 2024 usage pays the people who owned it in Q1 2024, even if the split changed in 2025. Current-state resolution does not error — it produces a plausible wrong number and pays the wrong party. Reached independently by `10.01.07` DT-02, `10.02.04` DT-02 and `10.03.01` D-03. **Requires 09 to support as-of reads; see Q-05.** | Deep Think, `/ideate-discover` Step 3 |
| D-03 | **The domain splits into an ungated half and a gated half, and the split is the roadmap** | *Ungated* (needs nobody's permission): ingest statements the user already receives (`10.02`), calculate (`10.03`), search public unclaimed pools (`10.05.01`), detect leakage (`10.05.03`), show the pipeline (`10.09`). *Gated* on being an accredited administrator: register (`10.01`), claim (`10.05.02`), disburse (`10.04`). The ungated half is buildable today and delivers most of the activation value. | Deep Think, Step 3 |
| D-04 | **An absence produces no event, so the platform must declare an expectation and let a clock manufacture one** | Reached independently **five times**: `10.01.03` D-03 (expected-by on submissions), `10.01.04` D-02 (silence synthesised), `10.02.01` D-02 (source registry exists to make absence visible), `10.02.05` D-05 + `10.04.03` D-03 (ageing alarms), `10.09` DT-02 (the distribution calendar). This is the domain's defining discipline — every characteristic royalty failure is money that never arrived, unremarked, because nothing ever promised it. | Deep Think, Step 3 |
| D-05 | **The dispute case engine is a cross-cut**; `10.08` is a feature riding it | Case, evidence, adjudicator, SLA and appeal are identical across 02, 05, 09, 13, 14, 17, 19, 24. Domain 02 reached this first (`credits-attribution-index.md` D-03); two domains converging independently is strong evidence it is real. Only royalty-specific evidence semantics are domain-owned. | Node Classification Gate, Step 3 |
| D-06 | **The money rails and escrow are cross-cuts** (`CX-M01`); `10.04.01` and `10.04.04` ride them | Domain-owned is **royalty payout-run semantics** — periodic, batched, thousands of sub-penny amounts, aggregation-before-payment, idempotent resume, and an unpayable-balance concept a checkout has no reason to invent (`10.04.01` DT-01). | Node Classification Gate, Step 3 |
| D-07 | Sweep candidates 01 and 06 **re-cut**, not merged | Both under-named the hard part. The re-cut separates affiliation (`10.01.01`), payload (`10.01.02`), transport (`10.01.03`) and the ack/reject loop (`10.01.04`) — which the sweep omitted entirely despite this domain's own Overview naming it as the hard part. | Node Classification Gate, Step 3 |
| D-08 | **Explainability is the deliverable; the number is a byproduct** | Curve, Exactuals and Reprtoir already produce correct-ish amounts; none can explain one, because their split was reconstructed and their terms were interpreted by whoever owed the money. WeJammin's chain ends in a split six people confirmed in a room (`D-18`). Store the derivation and the number is recomputable; store the number and the derivation is gone. | `10.03.01` DT-01; `10.04.02` DT-01 |
| D-09 | **The platform must not become its own black box** | `10.02.05` (unattributed money) and `10.04.03` (unpayable balances) are exactly the condition `10.05.01` sells recovery from: money held by an institution that knows the amount, knows the work, and cannot reach the person. A `NULL` in a matching table and a `balance` column with no clock would make WeJammin the thing it criticises. Both must be money-denominated, aged and alarmed. | `10.02.05` DT-01; `10.04.03` DT-01 |
| D-10 | **Capture-at-creation gives facts, not identifiers — the wedge does not automatically produce registration** | A session yields "Sarah played bass and wrote 20%". A society needs "IPI 00123456789, role CA, 20.00, territory 826". The platform cannot mint an IPI and cannot look one up (`10.01.01` DT-02). **The modal registration is blocked on a person, not on data** (`10.01.02` DT-03). A live risk to the domain's premise, not an edge case. | `10.01.02` DT-01 |
| D-11 | **Neighbouring rights (`10.01.06`) is the domain's tightest bond to the thesis, and the least gated** | It is the only registration keyed on a **credit** rather than an agreed split — no negotiation, no 100% arithmetic, no co-writer to chase. And SoundExchange/PPL admit **performers directly**, so the user's own membership is the credential and D-03's gate does not apply. The naive roadmap builds performance/mechanical first because they sound central; the evidence says otherwise. | `10.01.06` DT-01, DT-02 |
| D-12 | Sub-publishing is **a business, not a feature** — the platform holds the map and names the gaps | A sub-publisher network is dozens of negotiated bilateral relationships requiring local publisher standing. It cannot be shipped; it can only be signed, over years. A roadmap listing "sub-publishing" as a deliverable is committing to a corp-dev programme under a product name. | `10.01.07` DT-01 |
| D-13 | Candidate 07 **split** into search and claim | Opposite gating: searching public unclaimed data needs nobody's permission; claiming needs a mandate, standing, and societies that read evidence — five gates, four outside the platform's control (`10.05.02` DT-02). Bundling hid that the activation event is shippable without the gated half. | Node Classification Gate, Step 3 |
| D-14 | Candidate 18 **split**: deterministic money-in-flight (`10.09`) separated from statistical forecasting (`10.10`) | A wrong forecast is embarrassing; a wrong in-flight claim is a broken promise. In a domain whose discipline is refusing to invent numbers (D-15), blending a published institutional fact with a regression output under one confidence label is the failure to avoid. | `10.09` DT-01 |
| D-15 | **The platform states what it knows and says so when it doesn't** | Reached independently five times: `10.01.07` D-03 (at-source netting disclosed, never reverse-engineered), `10.02.04` D-01 (source amount is the fact, conversion is a view), `10.05.03` D-02 (leakage named, not sized), `10.09` D-02 (dates without amounts), `10.03.01` D-06 (unknown terms flagged, never assumed). Inventing a number is the reconstruction failure `problem-statement.md` blames the industry for, committed by the system built to prevent it. | Deep Think, Step 3 |
| D-16 | **Recovery is the activation event; prevention is the competence — and they are in tension** | If `10.01.04` works, WeJammin is the reason its own users have less black-box money for `10.05.01` to find. Both arguments are correct and point at different roadmaps. Proposed resolution: **recover the back catalogue once; prevent from today, forever.** Only one of those is a business; the other is the door. | `10.01.04` DT-02; `10.05` CX-02 |

## MoSCoW Proposal

> **Proposal only — the owner decides.** Anchored to D-18 (provenance is the wedge; consolidation
> is the platform) and to **D-03** (the ungated/gated split), not to the agent's sense of importance.

| Proposal | Features |
|---|---|
| **Must** | `10.02.01` Source Registry · `10.02.02` Parsing & Adapters · `10.02.03` Line Matching · `10.02.04` FX & Period · `10.02.05` Exception Queue · `10.03.01` Calculation Engine · `10.03.02` Deal Terms · `10.05.01` Black Box Search |
| **Should** | `10.01.01` Affiliation · `10.01.02` Registration Payload · `10.01.04` Status & Rejection Loop · `10.01.06` Neighbouring Rights · `10.03.03` Recoupment Position · `10.03.04` Restatement & Overpayment · `10.04.02` Payee Statements · `10.05.03` Leakage Detection · `10.09` Distribution Calendar · `10.06` Setlist → PRO Reporting |
| **Could** | `10.01.03` CWR & File Exchange · `10.01.05` Mechanical Rights · `10.04.01` Payout Run · `10.04.03` Unpayable Balances · `10.04.04` Escrow · `10.05.02` Claim Submission · `10.08` Statement Disputes · `10.10` Forecasting |
| **Won't (now)** | `10.01.07` Sub-Publishing · `10.07` Cue Sheets |

**Reasoning**: the Must set is **exactly D-03's ungated half**. Every item in it works with a statement the user already receives and a graph the platform already builds — no accreditation, no society relationship, no counterparty. `10.02` plus `10.03.01`/`10.03.02` deliver the sentence no competitor can say honestly: *"you earned £0.62 from this, here is the line that paid it and the split you agreed in the room."* That is `D-18`'s wedge cashing out in money, and it is buildable now. `10.05.01` joins Must as the activation event — with `10.05.01` Q-01's warning attached: it needs a credits graph the new user does not have, so it is downstream of `02.03.01` import and its licensing question.

`10.01.06` sits at Should despite D-11 arguing it is the domain's tightest bond to the thesis — because it needs a credits graph with ISRCs, which does not exist at launch. It should be the **first Should promoted** once domain 02 is dense; nothing else in the domain converts captured credits into money with so few intermediate steps. `10.09` is Should not for its own value but because `10.05.03` cannot detect a missing distribution without it (D-04).

`10.04` is almost entirely Could because of `Q-07`: **if the platform does not move money, most of it does not exist.** `10.04.02` is the exception at Should — a statement is valuable even when someone else holds the cash. The two Won'ts are honest: sub-publishing is a corp-dev programme (D-12), and cue sheets is a real leak the platform cannot reach (`10.07` DT-02) for a segment it may not serve.

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | ~~Which candidate children are sub-domains vs features?~~ | Agent | ✅ Resolved this pass — see Candidate Disposition |
| Q-02 | ~~Are any candidate children actually cross-cuts?~~ | Agent | ✅ Resolved — 5 routed out (D-05, D-06) |
| Q-03 | **Is WeJammin an accredited rights administrator/publisher, a partner of one (the Songtrust model), or neither?** The domain's load-bearing question. It gates `10.01` entirely, `10.05.02` mostly, and `10.04` partly — and D-03's whole ungated/gated split hangs on it. Nothing else in this domain is worth deciding first. | User | `/ideate-validate` |
| Q-04 | **Holding client money** — escrow (`10.04.04`), unpayable balances (`10.04.03`), royalty float — is regulated activity (e-money / payment institution) in most territories. It is already flagged in `constraints.md` under KYC/AML but not as *client-money custody*, which is a different and heavier permission. | User | `/create-prd-security` |
| Q-05 | **Does domain 09's ledger support as-of reads?** D-02 requires it. If 09 models current state only, every restatement in `10.03` is silently wrong and **no test will catch it**. A structural dependency across a domain boundary, discovered here and unfixable here. | User | `/create-prd-architecture` |
| Q-06 | **What happens to money nobody can claim?** `10.02.05` Q-01 (unattributable) and `10.04.03` Q-01 (unpayable) are one question. Hold forever is the societies' behaviour that `10.05.01` attacks; escheat is a real legal regime; redistribute is theft with extra steps. Every answer is uncomfortable and D-09 forbids the default. | User | `/create-prd` |
| Q-07 | **Does WeJammin move money at all?** Compute-only is ungated, useful and shippable — a band leader who got a lump sum can be told exactly what each member is owed. Disbursing makes WeJammin a regulated financial institution. This decides whether `10.04` exists. | User | `/ideate-validate` |
| Q-08 | **Who owns "the deal"?** Terms appear in 09 (producer agreements), 23 (contract vault) and `10.03.02` (executable rule). Three owners of one document is the second-source-of-truth failure the platform exists to prevent — and `10.03.02` DT-03 argues the *engine* is a cross-cut shared with 17 and 23 as well. | User | `/create-prd-architecture` |
| Q-09 | **Source licensing**: can WeJammin ingest, store and re-present statements (`10.02.01`), society unclaimed data (`10.05.01`), and MLC public records (`10.01.05`)? Three legal gates on the Must set. Same family as `credits-attribution-index.md` Q-10. | User | `/create-prd` |
| Q-10 | **D-16's tension**: recovery is the advertised hook; prevention is the competence that destroys its supply. "Recover the back catalogue, prevent from today" is the proposed answer and it must be *chosen*, because the two point at different first screens and different marketing. | User | `/ideate-validate` |
| Q-11 | **D-10 is a threat to the domain's premise.** Capture-at-creation gives facts; societies need IPIs the platform cannot mint or look up. If there is no plan for getting a co-writer's IPI, registration only ever works for fully-onboarded, fully-affiliated rosters — i.e. almost nobody at launch. | User | `/create-prd` |
| Q-12 | **Do societies consume evidence, or only forms?** (`10.05.02` Q-01.) The highest-value cheap question in the domain: one conversation with the MLC answers it, and it determines whether the platform's thesis has any purchase on claiming or is merely a nicer way to fill in the same form. | User | `/create-prd` |
| Q-13 | Does the platform **charge a commission** on recovered money? It is the industry's model and it works. It is also a fee on money that was always the user's, charged by the platform that criticises the institutions holding it. | User | `/ideate-validate` |
