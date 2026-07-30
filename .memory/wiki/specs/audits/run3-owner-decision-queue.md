# Run-3 Owner Decision Queue — Ideation Layer

> **Layer**: ideation (vision)
> **Source audit**: [ideation-ambiguity-report-run3.md](./ideation-ambiguity-report-run3.md)
> **Generated**: 2026-07-30
> **Entries**: 7 of 18 confirmed blocking findings
> **Status**: OPEN — all 7 block `/create-prd`

## What this queue is

Run 3 confirmed **18 blocking findings** after adversarial verification. Each was then
classified by whether the tree already contains the answer:

| Classification | Count | Meaning | Disposition |
|---|---|---|---|
| **Mechanical** | 11 | One file drifted from a ratified decision in the file that owns the concept. The correct text was fully determined by the canonical source. | **Remediated in-run.** No owner input needed. See the audit report, § "The 18 confirmed blocking findings". |
| **Owner** | 7 | Two or more owning files carry opposed, self-consistent numbered decisions with independent rationale — or a dependency exists on a field/state no file defines. No canonical answer exists to restore. | **This queue.** Not fixed. No files edited. |

The distinction is not difficulty. It is whether the information needed to write the correct
text exists on disk. For all 7 entries below it does not: choosing changes what a user can do,
what the platform promises, or where negotiating power sits — a product judgement, not a
drafting correction.

## How to use this queue

Each entry states the collision in one sentence, quotes **both sides with `file:line`**,
explains why no precedence rule settles it, gives 3–4 options with genuine trade-offs, gives a
recommendation with reasoning, and lists what changes downstream if ratified.

Ratify by choosing an option (or a variant) per entry. Each ratification then needs
`/propagate-decision` to sweep the downstream locations named in its "what changes downstream"
section.

## Index

| # | Domain | Decision | Recommended |
|---|---|---|---|
| 1 | 04 Opportunities & Casting | The opportunity post's `decide-by` date does not exist | Option B — derived by default, always present, overridable |
| 2 | 05 Services Marketplace | Does the buyer see the benchmark band on a live quote? | Option B — sellers-only pre-transactionally, symmetric on a live quote |
| 3 | 05 Services Marketplace | How does a `spec` deal elect a rights posture? | Option D — pre-commit the posture, defer its effect (decided jointly with `05.06.01` Q-07) |
| 4 | 09 Rights & Ownership | Who can put a publishing ledger into `public-domain`? | Option D — self-declared now, machine-corroborated later |
| 5 | 14 Digital Goods Marketplace | What is the published SHA-256 a hash of? | Option B — move the metadata write upstream; Option A for watermarked products only |
| 6 | 17 Live Booking & Settlement | Radius-clause conflict at confirm — refuse, or record an override? | Option D — hard block, with the waiver made a real-time instrument |
| 7 | 18 Show Production & Touring | Does a `require-confirmation` rider item block the freeze? | Option B — the requirement holds at `unknown` until a human confirms |

> Entries 2 and 3 are both in domain 05 but are independent. Entry 3 should be decided
> jointly with `05.06.01` Q-07 (reversion), which is the same shape.

---

## 1. The opportunity post’s `decide-by` date does not exist

| | |
|---|---|
| **Finding ID** | `04-opportunities-casting#021` |
| **Audit unit** | `04.04-triage-shortlist-decisioning (consumed by 04.05, 04.07)` |
| **Verified severity** | blocking — CONFIRMED on adversarial verification |
| **Classification** | OWNER — no canonical statement exists to restore |
| **Remediation status** | Not fixed. No files edited. Awaiting owner ratification. |

**The collision in one sentence**: Five decisions and two queue states across `04.04` and `04.05` treat a **decide-by date** as an established field on the opportunity post, and `04.01.01` — the file that owns the post object — never mentions it, defines it, or asks for it.

### Both sides, quoted

**The dependents treat it as existing and load-bearing:**

- `04.04.01-review-queue-triage.md:211` (D-05) — "A hold requires a **blocker** from a closed vocabulary; every blocker has an owner and a **detectable resolution event**; every hold has a **resolve-by date bounded by the post's decide-by** (04.01.01)."
- `04.04.01-review-queue-triage.md:212` (D-06) — "The applicant is told **a date, not a state** — 'You'll hear by 14 Aug' | Derived from the post's decide-by (04.01.01)."
- `04.04.01-review-queue-triage.md:158` — "| Dormant | ≥1 candidate, 0 triage actions, **≥50% of the publish→decide-by window elapsed** |"
- `04.04.01-review-queue-triage.md:160` — "| Abandoned | Poster stopped returning; **decide-by reached** with cards untouched |"
- `04.04.01-review-queue-triage.md:52` — the `awaiting-eligibility` blocker resolves on "The criterion is satisfied, **or** the post's decide-by passes".
- `04.04.01-review-queue-triage.md:192` names the consequence itself — "The post's **decide-by date** is the ceiling on every hold's resolve-by (D-05) and the denominator of the `dormant` trigger. **Without a decide-by, D-05's forcing function has no bound.**"
- `04.05.01-disposition-close-out-obligation.md:68` — "04.01.01 **auto-closes a post at its decide-by**"; :147 — "| **Post expires at its decide-by with people waiting** | Auto-closes (04.01.01); **the obligation survives** …"; :239 (D-05) — the obligation "survives it, as it survives deletion (D-12) and the decide-by (04.01.01)".
- `04.05.01-disposition-close-out-obligation.md:254` (Q-02) computes a default from it — "Proposed default if yes: **decide-by + 7 days**, computed in the post's own date semantics (04.01.01 D-10)".
- `04.04.03-offer-acceptance.md:169` — an unanswered offer leaves "the post … live again with its **decide-by unchanged** (04.01.01)".
- `04.07-open-calls-festival-showcase-competition.md:102` inherits the whole mechanism for waitlists.

**The owning file has no such field, and its expiry keys on a different date:**

- `04.01.01-opportunity-post-type-taxonomy.md:38` — "The post carries context — type, acting identity, hirer, decider, **date**, location, compensation policy." No decide-by.
- `04.01.01-opportunity-post-type-taxonomy.md:277` (D-09) — the terms set is closed and enumerated: "type, acting identity, date, location, slot count, compensation, required criteria". No decide-by.
- `04.01.01-opportunity-post-type-taxonomy.md:176` — the only expiry rule in the file keys on the **event** date: "| Post's date passes while still `published` | Every open slot auto-transitions to `closed`, but the close-out obligation still fires (04.05.01) …" This directly contradicts `04.05.01:68`'s claim that 04.01.01 auto-closes at the decide-by.
- Nothing in the domain asks for it. Contrast `04.05.03` Q-07, which tracks a comparable missing post field and says why — "*Status check: `04.01.01` still carries neither field … so the gap is live.*" There is no equivalent row for decide-by anywhere in domain 04.

### Why this is yours and not a drafting error

There is no canonical statement to restore. The tree never decided whether the poster supplies this date, what it defaults to, or whether it is the date that closes the post — and each answer changes what a poster must do at the composer and what every applicant is told. `04.04.01` D-06 ("a date, not a state") is the domain's self-described "cheapest anti-ghosting act in the product", and it cannot render for a post that has no such date, so the answer also decides whether that promise holds universally or only sometimes.

### Options

**Option A — Mandatory field, type-scoped default offered in the composer.**
Every post carries a decide-by; the composer pre-fills a per-type default (dep call: the event date; brief: the stated deadline; open call: the announce date) and the poster may edit it before publish. It joins D-09's terms set, so changing it on a live post re-gates and notifies with a one-tap withdraw.
- *Pros*: Every dependent mechanism is bounded by construction. D-06's date always exists. The poster is confronted with "when will these people hear from you?" at the moment they are asking for their time — which is exactly the domain's stated ethic.
- *Cons*: A fifth required interaction on the urgent dep path the domain optimises hardest (04.01.01 Happy Path A is now four). Posters will treat it as ceremony and accept whatever is pre-filled, which makes it a default wearing a required field's costume.

**Option B — Always present, derived by default, explicitly overridable (recommended).**
The post always has a decide-by. It is *derived*, not asked: presence types default it to the event date, delivery types to the stated deadline, per `04.01.01` D-10's type-scoped date semantics. The composer shows it as a derived value with an edit affordance and asks nothing extra; a poster who wants to decide sooner shortens it. Open calls and briefs (04.07), where the decide-by is genuinely a separate fact, get a real field because their type says so.
- *Pros*: Bounded by construction like A, with zero added interactions on the urgent path. Honours the domain's existing "the show already knows" posture without inventing a leak. Gives 04.05.01 Q-02 a real base for its "decide-by + 7 days" proposal. Keeps the per-type nuance the taxonomy already exists to carry.
- *Cons*: A derived decide-by equal to the event date is weak for a dep call posted three weeks out — the dormant trigger fires at 50% of a window that is mostly padding. The default's per-type table is another thing to get right, and getting it wrong is invisible.

**Option C — Derived only, never a field.** The decide-by *is* the post's date (presence) or deadline (delivery); there is no separate concept, and every dependent reference resolves to that one date.
- *Pros*: Smallest possible object; nothing new to validate; one date to reason about across a domain that already has type-scoped date semantics.
- *Cons*: Breaks the cases where the two dates are honestly different — an open call decides in September for a festival in June, a brief closes submissions before delivery. `04.07` needs both. It also makes `04.05.01` Q-02's "decide-by + 7 days" mean "seven days after the gig", which is the wrong answer to a ghosting question.

**Option D — Leave it out; let the dependents degrade.** No decide-by; holds carry poster-set resolve-by dates with no ceiling, and `dormant` triggers on elapsed time since publish rather than a fraction of a window.
- *Pros*: No new post-time obligation at all.
- *Cons*: `04.04.01:192` already states the cost — "Without a decide-by, D-05's forcing function has no bound." D-05 was the resolution of that file's most important open question, and this option unresolves it. D-06's "You'll hear by 14 Aug" has no date to name. Recommended only if you intend to reopen 04.04.01 Q-01.

### Recommendation — Option B

Derived-by-default, always present, overridable. It is the only option that gives every dependent mechanism a bound without spending an interaction on the path the domain says is won in minutes, and it uses machinery the tree already built (D-10's type-scoped date semantics, the type-scoped composer). A carries the same guarantees but taxes the dep call; C is cheapest and breaks 04.07; D knowingly unresolves 04.04.01 D-05.

### What changes downstream if ratified

1. **`04.01.01` gains the field**: the post-context list (:38), the type-scoped composer in both Happy Paths, and — decisively — **D-09's terms set** (:277), which is closed and enumerated. If decide-by is a terms field, moving it on a live post re-gates and notifies every submitter with a one-tap withdraw; if it is not, that must be stated, because a poster silently pushing the decide-by back is the ghosting the whole 04.05 sub-domain exists to price.
2. **`04.01.01`'s expiry rule (:176) must be reconciled**: today only the *event* date closes a post, while `04.05.01:68` and `:147` and `04.04.01:136` all assert an auto-close at the decide-by. Under B these are the same date for presence types and different for delivery types — the state table must say which one closes what.
3. **A new decision row and per-type default table** in `04.01.01`, plus the tuning note the domain uses for interval calls ("stated as the senior-dev call; tunable at `/create-prd`", as D-13 does).
4. **`04.05.01` Q-02 becomes answerable**: its proposed `decide-by + 7 days` default finally has a defined base and defined date semantics.
5. **`04.04.01` D-05/D-06 and the `dormant`/`abandoned` triggers stop citing a field that does not exist**; `04.07`'s waitlist resolution inherits a real bound.
6. **`04.02.04` D-06's deadline escalation** ("> 14d into 72h") should be checked against whichever date is authoritative — it currently reads as time-to-close, and after this decision the domain must be explicit about whether that is the decide-by or the event date, since that escalation spends the second and last alert (04.02.04 D-12).

---

## 2. Does the buyer see the benchmark band on a live quote?

| | |
|---|---|
| **Finding ID** | `05-services-marketplace#010` |
| **Audit unit** | `05.02-quotes-scope-contracting` |
| **Verified severity** | blocking — CONFIRMED on adversarial verification |
| **Classification** | OWNER — no canonical statement exists to restore |
| **Remediation status** | Not fixed. No files edited. Awaiting owner ratification. |

**The collision, in one sentence:** `05.02.01` D-15 requires the benchmark band to render to **both parties** on a live quote (or to neither), while `05.01.04` Q-03 was closed as **sellers only** — and specifically marked the buyer-viewing-a-quote case as superseded text — so the same band is simultaneously required and forbidden on the same surface.

### Both sides, quoted

**Side A — symmetric on a live quote.** Two decisions, plus the seam note, in the file that owns the quote surface:

> `05.02-quotes-scope-contracting/05.02.01-custom-quotes-proposals-scope.md:244` — "| D-15 | The benchmark band (05.01.04) is rendered on a live quote **symmetrically** to both parties, or to neither | An asymmetric benchmark makes the platform an agent for one side of a negotiation it is supposed to referee. Safe because 05.01.04 D-01 already restricts output to bands, never individual rates. |"
>
> `05.02.01:192` — "Touches **05.01.04 Rate Benchmarking** — the band is rendered on a live quote **symmetrically to both parties** (D-15). An asymmetric benchmark makes the platform a party to the negotiation on one side."

**Side B — sellers only, everywhere.** Four statements across the sub-domain that owns benchmarking:

> `05.01-service-listings-pricing/05.01.04-rate-benchmarking-price-transparency.md:96` — "| Q-03 | ~~Should the band be shown to buyers at all, or only to sellers?~~ | User | ✅ **Resolved — `05.01.01` D-05, upheld by sub-domain CX R-04 and domain CX R-06. Sellers only.** … ⚠️ **Consequence for this file**: its Musician Role Lens (*"Sees the same band as a buyer when evaluating a quote"*) and Happy Path step 5 (*"Buyer viewing a quote sees the same band"*) are breadth-pass text that the later `[DEEP]` decision supersedes"
>
> `05.01.01-service-listings-packages-rate-cards.md:186` — "| D-05 | The benchmark band renders in the seller's pricing step only — never in the buyer preview or on the public listing | … a band on a public listing is individual rate exposure wearing a cohort's clothes. |"
>
> `05.01-service-listings-pricing-cx.md:89` — "R-04 … Rejected — that is individual rate exposure wearing a band's clothes, and it violates 05.01.04 D-01. The band renders in the pricing *step*, not on the public listing."
>
> `services-marketplace-cx.md:216` — "R-06 … The benchmark band renders only in the seller's pricing step (05.01.04 D-01) and never touches posture election."

**Why this is not a drift to sweep.** D-15 was written with the benchmarking file open — it cites `05.01.04` D-01 to argue its own safety — and Q-03's ⚠️ consequence list names only `05.01.04`'s *own* stale Role Lens and Happy Path, not D-15. Note also the asymmetry in the evidence: every Side-B statement is textually scoped to the **listing** surface ("public listing", "buyer preview"), yet Q-03 closed a question broader than that evidence ("shown to buyers **at all**").

### Options

| | Option | Pros | Cons |
|---|---|---|---|
| **A** | **Sellers only, everywhere.** Retract D-15; the band never renders to a buyer on any surface, including a live quote. | Ratifies what the tree already says. No new privacy surface. Nothing further for `/create-prd-security` to size. | Contradicts the house principle of symmetric disclosure (`05.06.01` D-10: describe consequences symmetrically, never advise one side). Leaves the platform running an information asymmetry in favour of the seller in a negotiation it also adjudicates (24). The buyer here is frequently another working musician with the same pricing blindness `meta/personas.md` names. |
| **B** | **Surface split: sellers-only pre-transactionally, symmetric on a live quote.** Public listing, browse and buyer preview stay band-free; once a quote is issued both parties see the band. | Each rule then protects what it was actually argued for — D-05's argument is about a *public* surface at browse scale, which is a different exposure from one buyer, one seller, one bilateral document. Satisfies D-15 as written. Restores `05.01.04`'s original instinct (:18, :37) instead of deleting it. | The buyer holds the seller's exact figure *and* the cohort band, which together read as that seller's position — the closest the system comes to the individual exposure D-01 exists to prevent. Raises the stakes on `05.01.04` Q-01's minimum cohort size *k*, which now gates a buyer-facing render. |
| **C** | **Neither party, on the quote.** Take D-15's own "or to neither" branch: the band lives in the listing pricing step and is absent from the quote surface entirely. | Resolves the contradiction with zero product change to 05.01 and zero new buyer exposure. Literally compliant with both D-15 and Q-03. Cheapest to ship. | Removes the band from the moment it is worth most — a bespoke quote for an 11-track album is precisely the price the listing's rate card does not set. Guts the feature's value for the persona it exists for. Weakens `05.02.01`'s Drafting state (:137), which currently promises the seller the band while writing. |
| **D** | **Symmetric but de-positioned.** Both parties see the cohort band on a live quote; only the seller sees their own position marker within it ("you're at £180"). | Keeps the referee argument intact — neither side holds market information the other lacks — while withholding the one element that turns a band into individual exposure. | A buyer holding the band and the quoted number computes the position in their head; the withholding is cosmetic. Adds a third render variant of one component for the FE spec to carry. |

### Recommendation — **Option B**

The two rules were argued against different threats and only one of them survives at the negotiating table. `05.01.01` D-05, CX R-04 and CX R-06 are all reasoning about a **public, browse-scale** surface — a band beside a shopfront lets anyone shop the whole cohort's position, and that is the undercutting spiral. A live quote is bilateral, post-request, and already discloses the seller's exact figure to that one buyer; the marginal exposure of adding the cohort band is small, and the marginal *fairness* gain is large. D-15's argument — that the platform must not arm one side of a negotiation it also referees — is the same principle the tree applies to postures in `05.06.01` D-10 and to normalisation in `05.01.03` DT-11: describe symmetrically, never advise, never fabricate.

If the residual privacy exposure is unacceptable, **Option C is the safe fallback** — it is literally compliant with both decisions and costs only the seller's drafting aid. Option A should be chosen only if the owner intends the band as a seller-support tool rather than a market-transparency feature, in which case say so explicitly, because the feature's own Role Lens currently claims the opposite.

### If B is ratified, this changes downstream

- `05.01.04` Q-03 is re-resolved as a **surface split**, not "sellers only"; its ⚠️ consequence note is withdrawn and its Role Lens (:18) and Happy Path step 5 (:37) become correct as written rather than stale.
- `05.01.01` D-05 gains an explicit scope qualifier (listing surfaces only); `05.01-service-listings-pricing-cx.md` R-04 and `services-marketplace-cx.md` R-06 take the same qualifier so the CX layer stops asserting a global rule.
- `05.02.01` D-15 stands; its Drafting state row (:137, "Seller-only, with benchmark band") and Happy Path step 3 (:77, which tags the *drafting* step "symmetric — D-15") must be reconciled so the transition is unambiguous: seller-only while drafting, both parties once issued.
- `05.01.04` Q-01 (minimum cohort size *k*) becomes buyer-facing and therefore harder — a band rendered to a buyer alongside one named seller's exact price needs a larger *k* than a band rendered privately. Escalate to `/create-prd-security` with that framing.
- FE spec gains a second render context for the band component (quote surface, two viewers) beyond the listing pricing step.

---

## 3. How does a `spec` deal elect a rights posture?

| | |
|---|---|
| **Finding ID** | `05-services-marketplace#018` |
| **Audit unit** | `05.06-rights-warranties-transfer` |
| **Verified severity** | blocking — CONFIRMED on adversarial verification |
| **Classification** | OWNER — no canonical statement exists to restore |
| **Remediation status** | Not fixed. No files edited. Awaiting owner ratification. |

**The collision, in one sentence:** `spec` is a first-class pricing model whose whole nature is a term that vests on a trigger that may never fire, but `05.06.01`'s legal-combinations table has no spec row and its closed posture vocabulary has no conditional form — so a mandatory election has no legal answer and a spec tier cannot publish.

### Both sides, quoted

**The model exists and is publishable:**

> `05.01-service-listings-pricing/05.01.03-music-pricing-model-library.md:43` — "| Spec | nothing | **trigger condition** · the term that vests on trigger | speculative writing/production | No — conditional (DT-10) |"
>
> `05.01.03:95` — "| Spec engagement | Zero cash **and** a term that vests only on a future trigger the platform cannot see from this domain (DT-10) | "Nothing is due unless {trigger}. This is speculative work." |"
>
> `05.01.03:105` routes free work *into* spec — "A rate must be above zero. Working for free? Use the spec model — it records what you get if it works out."
>
> `05.01.03:150` DT-10 forbids the obvious shortcut — "❌ REJECTED — spec is **conditional** … A points deal vests at acceptance … A spec deal vests on a **trigger event that may never occur** … That difference is not a parameter, it is a different lifecycle."

**The posture layer has no room for it:**

> `05.06-rights-warranties-transfer/05.06.01-engagement-rights-posture.md:70-74` — the legal-combinations table has exactly three pricing-model rows: "Cash-only (flat · per-song · per-minute · day rate · per-stem)", "Points-only", "Fee + points". No spec row.
>
> `05.06.01:202` — "| D-01 | **No default posture** — an explicit election is required to publish a tier |"
>
> `05.06.01:206` — "| D-05 | **The posture is elected per copyright**: a master posture and a composition posture, both required, on every tier. Each posture declares required parameters; a posture missing a parameter is **Unelected, not partial** |"
>
> `05.06.01:208` — "| D-07 | **The posture vocabulary is closed.** Four master postures, four composition postures, no free text, no "other", and no rider may qualify what executes | … Honest cost: some real deals cannot be done here. Q-07. |"
>
> `05.06.03-rights-transfer-split-execution.md:10` — "Acceptance releases the money and, in the same indivisible act, executes the rights posture (05.06.01) …" — an execution model spec structurally cannot use.

The entire `05.06` sub-domain contains no occurrence of *spec* or *speculative*. `05.06.01` Q-07 concedes the **adjacent** gap only — "Reversion is a common, legitimate term this vocabulary cannot express" — and `05.01.03` Q-07 tracks only *who detects* the vesting trigger, explicitly not the posture mapping.

### Options

| | Option | Pros | Cons |
|---|---|---|---|
| **A** | **Open the vocabulary: add a conditional posture** ("vests on trigger") per copyright, with trigger condition and vested term as required parameters. | Directly expressible; spec becomes a normal election. Same machinery reversion needs, so it answers Q-07 in the same stroke. | Reopens D-07, whose closure is load-bearing — once "conditional" exists, "conditional on what?" is a free-text field in all but name. Adds a fifth posture to a vocabulary two other features enumerate. |
| **B** | **Two-stage instrument.** The engagement executes *no transfer* at acceptance; the vesting term is a **separate future instrument** offered when the trigger fires, per D-11 ("a later change by agreement is a **new instrument** — a subsequent link in 09's chain"). | No vocabulary change; D-07 stays closed. Matches D-11's append-only principle exactly. `09` already models the chain. | The seller's entire compensation is an unexecuted promise to sign later — the buyer can simply decline. That is the exploitation pattern `05.01.03` DT-01 and Q-04 identify, rebuilt as a product feature, against the population the domain most wants to protect. |
| **C** | **Spec cannot publish as a listing tier** — remove it from the listing model library, or restrict it to bespoke quotes only. | Honest and cheap; no new machinery; nothing publishes with an invented posture. | Kills a real market (speculative topline and production is how a large share of new writers work) and contradicts `05.01.03`'s model table and its routing of £0 work into spec. If restricted to quotes, the posture problem simply moves to `05.02.01` unchanged. |
| **D** | **Pre-commit the posture, defer its effect.** The seller elects a normal posture from the existing closed vocabulary; the signed instrument states that it **takes effect on the named trigger**. Effective-date becomes a property of the instrument, not a new posture. | D-07 stays closed — no fifth posture, no free text. The seller holds *signed paper*, not a promise to sign, which is the only version that protects them. Consistent with D-08's "store the determining facts" and D-12's "what the seller grants". Reversion is the mirror case (effect *ends* on trigger), so one property answers Q-07 too. | Needs an exception to `05.06.03:10`'s indivisible acceptance-executes-rights act; rights execution and credit emission decouple in time. Still depends on trigger detection (`05.01.03` Q-07 / domain 12), which becomes blocking rather than deferrable. |

### Recommendation — **Option D, decided jointly with `05.06.01` Q-07**

Spec and reversion are one shape seen twice: a posture whose *effect* is bound to a trigger, not a posture whose *content* is unknown. Modelling it as an effective-window property of an already-closed posture keeps D-07's closure — which exists to prevent two disagreeing records of one deal — while giving the spec seller an executed instrument instead of a promise. Option B's failure is decisive: a speculative writer whose only protection is the buyer's willingness to sign a second document later has exactly the protection they have today off-platform, and `05.01.03` DT-01 names that population as the most exploited on the platform. Option A gets to the same place but pays for it by reopening a closure two other features depend on.

Deciding D and Q-07 separately is the real risk: they will otherwise get two incompatible mechanisms for one shape, which is the reconstruction problem `05.06.01` D-07 was written to prevent.

### If D is ratified, this changes downstream

- `05.06.01`'s legal-combinations table (:70-74) gains a **Spec** row naming which master and composition postures may be elected with deferred effect. **While that table is open, confirm its coverage generally** — its "Cash-only" row enumerates flat · per-song · per-minute · day rate · per-stem, which leaves hourly, half-day, retainer and buyout unaddressed, and `05.01.03` DT-13 explicitly requires a buyout to be "paired with the rights posture in 05.06.01" because it is cash for rights, not labour.
- `05.06.01` D-05's "Unelected, not partial" parameter sets gain the conditional case: trigger condition and vesting term become required parameters wherever effect is deferred.
- `05.06.01` D-07 keeps its wording but records that deferred effect is a property of the instrument, not an expansion of the vocabulary; Q-07 resolves onto the same mechanism.
- `05.06.03`'s indivisible acceptance act (:10) needs an explicit second execution path, with the `05.03.02` DT-01 milestone precedent ("a contingent interest vests") as its nearest existing model.
- `05.01.03` Q-07 (who detects the trigger, in domain 12, possibly years later) is promoted from a deferred architecture coordination to a **prerequisite** — a deferred-effect instrument nobody can trigger is Option B with extra steps. Pair it with `05.02.03` DT-03's new-use gap as DT-10 already recommends.
- Escrow and take-rate: spec is zero-cash, so it inherits `05.01.03` DT-08's unmonetised/unprotected problem already open as its Q-06.

---

## 4. Who can put a publishing ledger into `public-domain`, and what does that state authorize?

| | |
|---|---|
| **Finding ID** | `09-rights-ownership#012` |
| **Audit unit** | `09.03-chain-of-title-lifecycle (consumed by 09.01)` |
| **Verified severity** | blocking — CONFIRMED on adversarial verification |
| **Classification** | OWNER — no canonical statement exists to restore |
| **Remediation status** | Not fixed. No files edited. Awaiting owner ratification. |

**The collision in one sentence:** the registry treats `public-domain` as a terminal publishing-ledger state that *satisfies* the release gate, but the feature it names as the sole determiner produces only per-jurisdiction term statuses for four countries, is read-only to every persona, and rules by numbered decision that a term status is **not** ownership or release authorization — so no path in the tree can ever set the state the registry depends on.

### Both sides, quoted

**Side A — the registry consumes a ledger state and gates release on it.**

- `09.01.01-work-recording-duality.md:289` — "| A work in the **public domain** | Its publishing ledger is `public-domain`, a terminal state — **not** `unallocated`. **It satisfies the release gate.** Without this, no PD work could ever be released, which is absurd. The determination is [09.03.05]'s, never this feature's. | "Composition is in the public domain — no publishing owners. You own your recording of it." |"
- `09.01.01-work-recording-duality.md:334` — "`public-domain` is a terminal publishing-ledger state that **satisfies** the release gate, unlike `unallocated` which blocks it. This file consumes that determination and never makes it."
- `09.01.01-work-recording-duality.md:342` — "`work-unlinked`, `writers-unconfirmed`, `unallocated`, incomplete medley weights, and uncleared medley permissions all resolve to a release refusal. `public-domain` does not."
- `09.01.01-work-recording-duality.md:146` and `:323` make the state structural, not decorative — "The derived work's ledger is fully real even though the parent's ledger is `public-domain` and empty (DT-13)" and DT-13 "❌ REJECTED — a **public-domain parent** makes it structural … classical and trad-folk consist of almost nothing else. Without `derived-from` those users cannot express the only rights fact that matters to them, and the registry has silently declared an entire genre out of scope."

**Side B — the named determiner cannot produce it, and forbids the inference.**

- `09.03.05-copyright-term-public-domain.md:119` D-06 — "A determinate term status is **not clearance, legal advice, ownership, or release authorization** | It states source-attributed facts and one jurisdictional rule; licensing and release have independent rights/evidence gates."
- `09.03.05:116` D-03 — "Term is **computed, never declared** — read-only to all personas | Nobody chooses when their copyright expires. An editable term field is a fiction with legal consequences."
- `09.03.05:118` D-05 / `:43-50` — "**CQ-09 Option B — v1 supports exactly `US`, `FR`, `DE`, and `GB` for term-status determination.** … Any other territory, missing death date or historical fact, unsupported work/category rule, or insufficient source evidence is explicitly **`unknown` / `not determined`** — never omitted, extrapolated from another jurisdiction, or guessed."
- `09.03.05:80` — "| User treats a determinate term status as clearance, licence, ownership decision, or release approval | **Block the inference, not the work.** Licensing and release retain their independent evidence/permission gates. |"
- `09.03.05:83-91` — the States table emits per-territory statuses only (`Populated | Term computed | Per-territory status + the inputs used`). No row, decision, or cross-cut note in the file writes anything to a ledger.

**Two compounding facts.**

- *Territory mismatch.* `09.01.02-ownership-ledger-validation.md:272` D-15 — "Invariants are evaluated **per territory**; v1 has exactly one territory (`World`)" and `:198` "v1 has exactly one territory (`World`) and the invariants run per territory against that single value." 09.03.05 determines four named jurisdictions and calls a single global answer "not a simplification; it is **wrong**" (`09.03.05:41`). Nothing in the tree maps four jurisdictional statuses onto one `World` ledger state.
- *Timing mismatch.* `09.03.05:127` Q-03 — "**Resolved — `Could`, not now.** [moscow-ledger.md] places 09.03.05 in the `COULD (201)` bucket … it 'Answers questions about OTHER people's old works, which needs reference data (historical death dates) WeJammin does not have on day one — so it launches empty regardless of build effort.'" 09.01.01 is a `MUST`. If the state's only writer is 09.03.05, the PD path is dead at launch — and a trad-folk arrangement, the exact case DT-13 calls structural, cannot be released.

A repo-wide grep confirms the state is named nowhere outside 09.01.01. Domain 12 never mentions it. An implementer must invent both the writer of the state and the jurisdiction collapse, or leave PD works permanently release-blocked.

### Options

#### Option A — Self-declared PD, evidence-recorded, never platform-asserted
The **user declares** "this composition is in the public domain" on the work, exactly as they declare a cover, a sample, or a work-for-hire. The declaration sets the publishing ledger to `public-domain`, which satisfies the release gate. 09.03.05, when it exists, is a *lookup that informs the declaration* — it pre-fills, shows its inputs and jurisdictions, and warns when it says `in copyright` or `unknown` — but it never writes and never blocks.

- **Pros.** Consistent with the domain's spine: `09.01.01:321` D-08/DT-11 — "**this feature blocks nothing at capture. It records, flags, and lets the release gate refuse**", and `09 D-05` "interpretation notifies, arithmetic executes." It matches how every other unverifiable rights fact on the platform already works (an asserted publisher row is "a claim, rendered as a claim", `09.01.04:176`). It ships on day one without 09.03.05 or any death-date reference dataset. It keeps the platform a witness rather than a certifier, which `09 D-04` says is the entire asset. It does not touch 09.03.05's decisions at all — D-03, D-05 and D-06 stand unmodified.
- **Cons.** A user can release an in-copyright song by ticking a box. The mitigation is the one the tree already uses everywhere — the declaration is attributed, timestamped, visible to anyone who looks, and disputable via `09.04.01` — but it is a mitigation, not a prevention. It also puts a legally consequential judgement on the least-equipped persona.

#### Option B — PD is a release-gate evidence path in domain 12, not a ledger state at all
Delete `public-domain` from the publishing-ledger state machine. A PD composition's ledger simply has **no writer rows and no publisher rows**, and domain 12's release gate gains an explicit exception: `unallocated` blocks release *unless* the work carries a recorded public-domain assertion with its evidence. The ledger stays an arithmetic object; the authorization stays in the gate that owns authorization.

- **Pros.** Cleanest boundary. `09.01.02` D-04 — "The validator holds **arithmetic only**; deal semantics live in sibling features" — and a PD exemption is not arithmetic. It removes the write-path problem entirely: nobody needs permission to mutate a ledger state. It sits naturally beside 09.03.05 D-06's "licensing and release retain their independent evidence/permission gates", because that is precisely where the exception would live.
- **Cons.** Owned by domain 12, not 09 — this shard cannot ratify it alone, and it exports the decision rather than settling it. It also loses the useful *display* affordance: `09.01.01:206`-style alarm copy ("Nobody owns this yet") would fire on a PD work whose emptiness is correct and permanent, unless 09.01.02 gains a way to render an `unallocated` ledger as deliberately empty. That is close to re-introducing the state under another name.

#### Option C — Only a determinate 09.03.05 status can set it, and the collapse rule is unanimity across the four jurisdictions
`public-domain` is written **only** by 09.03.05, only when every one of `US`, `FR`, `DE`, `GB` returns a determinate public-domain status; any `unknown` or `in-copyright` leaves the ledger `unallocated`. 09.03.05 D-06 is amended to carve out this one mechanical consequence — a term status is still not clearance or ownership, but a unanimous four-jurisdiction PD result does open the release gate for the composition side.

- **Pros.** Keeps determination with the feature that owns the facts and the rule versions. Fully auditable — every PD ledger carries four jurisdictional results and their inputs. Honours `09.03.05:41`'s insistence that territory is decisive, by demanding all four rather than inventing a global answer.
- **Cons.** The PD path is unusable until 09.03.05 ships and has historical death-date reference data, and 09.03.05 is a `COULD` that "launches empty regardless of build effort". Every trad-folk and classical arrangement is release-blocked in the interim — the outcome `09.01.01:289` calls "absurd". It also amends a ratified CQ-09 decision (D-06), and unanimity-across-four is itself an invented rule: a work PD in the US but in copyright in Germany is a real and common case (rule-of-the-shorter-term, wartime extensions) with no obvious right answer for a single-territory ledger.

#### Option D — Hybrid: self-declared now, machine-corroborated later
Option A's declaration is the writer of the state, and 09.03.05 — when built — attaches its per-jurisdiction results to the declaration as **corroboration or contradiction**, never as an override. A contradiction ("you declared PD; term status says in copyright in `DE` until 2031") surfaces persistently on the work and routes to `09.04.01` if a party objects, but the release already made is not retracted by the platform.

- **Pros.** Ships on day one and gets stronger as reference data lands. Mirrors the `consented` ≠ `registered` posture already ratified at `09.01.04:174` D-09 — two truths kept apart and both shown — which the domain has already proved it can express. Requires no amendment to any 09.03.05 decision.
- **Cons.** Two sources of truth over one state, which is the shape that produced this finding in the first place. Needs a specified precedence rule and a specified contradiction UI, both of which are new spec surface. More to build than A.

### Recommendation — Option D, with Option A as its day-one behaviour

The declaration must be the writer, because every alternative that makes 09.03.05 the writer blocks trad-folk and classical release until a `COULD`-bucket feature with reference data the platform does not have ships — and `09.01.01:289` already names that outcome absurd. Option A is the tree's own consistent posture (`D-08`: block nothing at capture; `09 D-05`: notify, don't execute; asserted rows rendered as claims), and it requires amending nothing in 09.03.05. Option D is A plus the corroboration layer the domain has already shown it can express cleanly through the `consented`/`registered` two-truths pattern, so the eventual arrival of 09.03.05 strengthens the record instead of contradicting it. Option C is the most legally cautious and the only one that ships nothing usable; Option B is arguably the cleanest boundary but is not this shard's to ratify and quietly re-creates the state inside 09.01.02's rendering rules.

### If ratified (Option D), what changes downstream

- **09.01.01** gains a numbered decision — the file currently states the PD rule only in prose at `:143-146`, an edge-case row at `:289`, and cross-cut notes at `:334`/`:342`, with no `D-nn` behind it. That decision names the declaration as the writer of `public-domain`, states that the platform never asserts it, and states that the state satisfies the composition side of the release gate only.
- **09.01.02** must accept `public-domain` as a terminal publishing-ledger state alongside `unallocated`/`proposed`/`consented`/`disputed`/`superseded` (`:203-214`), with zero rows valid and the invariants not run — and its Empty-state alarm copy at `:206` ("Nobody owns this yet", "Deliberately alarming copy (DT-03)") must not fire on it. DT-03's thesis is that absence is the alarm; this is the one absence that is an answer.
- **09.03.05** needs a Cross-Cut Note and probably an edge-case row for the corroboration/contradiction path, and D-06 is *confirmed* rather than amended — the term status still authorizes nothing; the declaration does.
- **Territory**: the single-territory (`World`) ledger of `09.01.02` D-15 versus 09.03.05's four jurisdictions needs one sentence of precedence — the recommendation is that a v1 declaration is worldwide, and a jurisdictional contradiction from 09.03.05 is surfaced rather than modelled, deferring to `09 Q-05` when territory becomes a real dimension.
- **Domain 12** must add `public-domain` to the release-gate state table as satisfying the composition requirement while the master side is unaffected — `09.03.05` D-02's "the answer is **always two answers**" is exactly the trap: the song is free, the recording of it is not.
- **Domain 11** (`11.09` cover/compulsory mechanical, `11.05.04` interpolation) already says "Composition is public domain | No licence needed — **but the specific arrangement may be protected**"; those paths should read the declaration rather than re-asking the user.
- **09.04.01** gains the contradiction (declared PD vs determinate in-copyright status) as a claim-conflict trigger.

---

## 5. What is the published SHA-256 a hash of, once delivery rewrites the bytes?

| | |
|---|---|
| **Finding ID** | `14-digital-goods-marketplace#001` |
| **Audit unit** | `14.03-delivery-versioning-library` |
| **Verified severity** | blocking — CONFIRMED on adversarial verification |
| **Classification** | OWNER — no canonical statement exists to restore |
| **Remediation status** | Not fixed. No files edited. Awaiting owner ratification. |

### The collision, in one sentence

Delivery publishes a single per-artifact SHA-256 **before any bytes move** and auto-verifies the completed download against it, while the *same* delivery step is specified to rewrite every content artifact's bytes per buyer — so for every sample pack, loop pack and marked audio product the delivered file cannot match the published hash, verification fails, and E-19 quarantines a correctly-delivered build.

### Both sides, quoted

**Side A — one hash per artifact, published up front, verified on completion.** Owned by `14.03.01-download-delivery-resumable-transfer.md`:

- `:73` — "| Checksum | **SHA-256, published as copyable text** beside the download control | Auto-verified for the Musician; hand-verifiable for the air-gapped Operator (D-09). |"
- `:82` — "3. System shows, **before any bytes move**: download size, **unpacked size** (D-02), version, SHA-256, and — if the artifact is archived — the restore wait (DT-04)."
- `:89` — "10. On completion, SHA-256 is verified automatically against the published checksum."
- `:114` (E-19) — "A second failure means the **stored artifact** is bad — every buyer of that build will hit it. Escalate: alert vendor and platform, quarantine the build from new grants."
- `:184` (D-09) — "The SHA-256 is published as **copyable text**, so the Operator verifies by hand on a machine that has never met us." This is the entire resolution of that file's Q-02 (air-gapped carry).

**Side B — delivery writes the bytes, per buyer, every time.** Owned by three places:

- `14.04-sound-content-catalogs/14.04.01-sample-loop-pack-catalog.md:275` (D-06) — "**Delivered files carry embedded tempo/key/loop metadata**; an estimated key is embedded only where declaration and extraction agree"
- `14.03-delivery-versioning-library/14.03.05-per-buyer-forensic-watermarking.md:39` — "3. Delivery generates a buyer-unique mark and stamps it during transfer (CX-04)."
- `digital-goods-marketplace-cx.md:455` (CX-24) — "Delivered audio must be **written** with embedded tempo/key/loop metadata (ACIDized-WAV / Apple-Loops convention), not merely served … **two writers on one artifact**."
- `digital-goods-marketplace-cx.md:464` (CX-24 q2) — "Grant issued → embed tempo/key/loop metadata → apply per-buyer watermark → serve."

### Why this is not already answered somewhere

I searched every occurrence of `sha-256` / `checksum` / `hash` / `digest` / `integrity` across all 64 files of domain 14. The only substantive hits are the twelve lines in `14.03.01` listed above. Nothing anywhere reconciles a pre-published hash with a delivery-time byte write, and no `[PENDING]` / `[OWNER]` / `[DEFERRED]` marker covers it.

The omission is conspicuous rather than accidental — `14.03.01` works out every *other* consequence of stamping in detail: `:85` and `:105` (E-10) force a deterministic per-grant seed so resumed ranges regenerate byte-identically; `:122` (E-27) handles a stamping failure and requires the grant to record that the artifact is unmarked; DT-03/DT-07/DT-08 at `:147`/`:151`/`:152` close out CDN, P2P and delta patching under marking. The checksum is the one thing never revisited.

The nearest open question, `14.04.01:293` (Q-07, "which feature owns writing bytes at delivery?", routed to `/create-prd-architecture`), asks about **ordering and ownership** of the two writers. It does not ask what the integrity contract is, and an architecture stage cannot answer it without inventing D-09's product promise.

**It is not deferrable as a COULD-band nicety.** `moscow-ledger.md:136` (14.03.01) and `:138` (14.04.01) are both inside the MUST band, so the metadata writer alone collides with the checksum at launch — watermarking aside.

**What the buyer sees today, under the spec as written**: every content download completes, fails verification, silently re-verifies, fails again, and the buyer is told *"This file didn't verify. That's on us, not your connection — we've flagged it with the vendor. You'll be emailed when it's fixed."* — while the vendor's perfectly good build is quarantined from new grants.

### Options

#### Option A — Two hashes: publish the master, verify the copy

The published SHA-256 stays the hash of the **stored master artifact** — the bytes the vendor uploaded and 14.08.02/14.08.03 QA passed. At grant mint the platform also records a **per-grant SHA-256** of the bytes that will actually be served (computable, because DT-03 already forces the mark to be deterministic per grant), and *that* is what the client auto-verifies. The download panel shows both: "This build: `a3f2…` · Your copy: `9c71…`".

| | |
|---|---|
| **Pros** | Nothing is cut — metadata embedding, watermarking and automatic verification all survive intact. E-19 gets sharper, not weaker: a per-grant mismatch is transfer corruption or a stamping fault (retry, then support), while a master mismatch is a genuine stored-artifact defect (quarantine). The air-gapped Operator still has a copyable hex string for the file they actually carry, so D-09's workflow survives in shape. |
| **Cons** | The per-grant hash is only knowable once the stamped bytes exist, so for a 100 GB library it must be stream-computed while serving and delivered as a trailer — which means the *verifiable* hash cannot appear "before any bytes move", and step `:82` has to be rewritten. Worse for D-09's actual promise: a per-buyer hash is a number only **we** can vouch for. The master hash is corroborable — two buyers of the same build compare and agree, a vendor publishes it on their own site. "Verify on a machine that has never met us" quietly degrades to "verify against a number we told you". |

#### Option B — Move the metadata write upstream; hash the master; treat marking as the only per-buyer write

Embedded tempo/key/loop metadata is a property of the **product**, not of the buyer — so write it once at ingest, in 14.08.03 audio QC, into the stored master. Delivery then has at most **one** writer, not two. For products where the vendor did not enable watermarking (per `14.03.05:97` Q-03, which is already leaning to per-product opt-in on cost grounds) the delivered bytes are byte-identical to the master and today's single published hash is simply correct. Watermark-enabled products fall back to Option A's two-hash treatment.

| | |
|---|---|
| **Pros** | Kills half the collision for free and for the right reason — there is no product argument for re-deriving "142 BPM, G minor" per buyer. Restores one canonical, corroborable hash for **all software, all Kontakt libraries, all presets, all MIDI and every unmarked pack** — which is exactly the inventory the Operator carries across an air gap, so D-09 survives untouched rather than degraded. Removes the "two writers on an uncacheable path" problem from `14.04.01` Q-07 by deleting one of the writers. Cheapest path to a shippable v1. |
| **Cons** | Contradicts CX-24's stated trigger chain (`:464`) and D-06's phrasing "**Delivered** files carry" — both need rewording, and CX-24 loses its "two writers on one artifact" framing. Makes a metadata correction a **new build**: fixing one wrong key on one loop re-writes the master and changes its hash, which lands on 14.03.02's versioning and the append-and-correct revision rule. Leaves watermarked packs still needing Option A, so the two-hash machinery is deferred, not avoided. |

#### Option C — Stop verifying the whole file; verify the transfer

Drop whole-file verification. Publish the master hash as **build provenance only** — an identifier, explicitly not something the delivered file is expected to match. Integrity of the transfer is checked per range, against server-supplied per-chunk digests, continuously during the download.

| | |
|---|---|
| **Pros** | The only option that is honest by construction about per-buyer bytes — no dual-hash bookkeeping, no trailer, no explaining to a buyer why their hash differs from their friend's. Catches corruption *during* a 14-hour transfer rather than at the end of it, which is a real improvement on E-19's current "discover the failure after the whole night". |
| **Cons** | Destroys D-09. The Operator has nothing to hand-verify on the far side of the air gap, so `14.03.01` Q-02 reopens and the air-gapped carry needs a real feature after all — the exact ceremony D-09 was written to avoid. Also weakens the vendor-facing story: a stored-artifact defect is no longer detected by buyers at all, so E-19's escalation loses its trigger and QA has to catch everything at ingest. |

#### Option D — The integrity promise wins: no delivery-time byte writes at all

Rule: nothing rewrites an artifact on the way out. Embedded metadata moves to ingest (as in B); per-buyer forensic watermarking is **cut** from v1 and 14.03.05 becomes a post-v1 feature. One artifact, one hash, cacheable at the edge.

| | |
|---|---|
| **Pros** | Simplest contract in the domain, and it recovers everything `14.03.01` DT-07/DT-08 said watermarking costs us: the CDN comes back, delta patching becomes possible (a 200 MB patch instead of a 60 GB re-fetch), P2P stops being structurally impossible. Directly attacks DT-02's uncosted, possibly domain-fatal egress problem on the largest files in the catalog. D-09 is untouched. |
| **Cons** | Per `14.03.05:13`, for content with no serial and no activation check — "most of this store's realistic inventory" — watermarking is "not one anti-piracy tool among several; it is **the only one that exists**". Cutting it launches the sample-pack catalog with zero enforcement, which is a hard sell to the Producer-as-vendor persona this domain is built around. It also pre-empts `14.03.05` Q-02 and Q-03, which are already routed to you as separate decisions — this option answers them by fiat. |

### Recommendation

**Option B, with Option A applied only to watermark-enabled products.**

The two writers are not the same kind of thing and the spec has been treating them as one. Embedded tempo/key/loop metadata is a fact about the *product* — "this loop is 142 BPM" is true for every buyer, and 14.04.01 D-06's own reasoning ("the destination is a DAW, not our web page") gives no reason whatsoever to compute it per delivery. Writing it at ingest costs one QC step in 14.08.03 and removes it from the delivery path entirely. Only the watermark is genuinely per-buyer, and it is already opt-in-shaped: 14.03.05 Q-03 is leaning to per-product opt-in on the cost evidence 14.03.01 DT-07/DT-08 supplied.

That split means the single published hash — the thing D-09's air-gapped carry, E-19's quarantine trigger and the Operator's `shasum` all depend on — stays exactly true for every product that is not marked audio, which is all software, all large-format instruments, all presets and all MIDI. The two-hash complexity of Option A then applies to a bounded, opt-in subset where the buyer has already been told (14.03.05 D-02) that their file is personally unique, so "your copy has its own hash" is a consistent story rather than a surprise.

I would not take Option D. It is the cleanest engineering answer and it silently decides 14.03.05 Q-02 and Q-03, which are your calls and are routed to you with their own evidence — deciding them as a side effect of a checksum question is the wrong order.

### What changes downstream if this is ratified

| Location | Change |
|---|---|
| `14.03.01:73` (Checksum parameter row) | Restate as the **master-artifact** SHA-256; add a second row for the per-grant hash on watermarked products. |
| `14.03.01:82` (happy path step 3) | "before any bytes move" holds for the master hash; the per-grant hash is disclosed as arriving with the transfer, not before it. |
| `14.03.01:89` (step 10) | Name which hash is auto-verified — master for unmarked, per-grant for marked. |
| `14.03.01:114` (E-19) | Split the escalation: a per-grant mismatch is a transfer/stamping fault; only a master mismatch quarantines the build. Today it quarantines on both. |
| `14.03.01:184` (D-09) | Add the scope sentence — hand-verification is exact for unmarked artifacts, which is the entire air-gapped Operator inventory. |
| `14.03.01` Decisions | New decision recording the integrity contract; `14.03.01` currently has no D-numbered statement of it at all. |
| `14.04.01:275` (D-06) | "Delivered files carry" → written at ingest, carried by the stored master; delivery serves, does not write. |
| `14.04.01:293` (Q-07) | Largely closed — with the metadata writer moved upstream there is one writer at delivery, not two. |
| `digital-goods-marketplace-cx.md:455/:464` (CX-24) | The relationship is no longer "two writers on one artifact"; the trigger chain loses its embed step and becomes "grant issued → apply per-buyer watermark (if enabled) → serve". |
| `14.08.03-audio-content-qc.md` | Gains ownership of the embedded-metadata write and of re-writing on a metadata correction. |
| `14.03.02-versioning-updates-legacy-archive.md` | A metadata correction now changes the master hash — needs to be reconciled with the append-and-correct revision rule. |
| `14.03.05` Q-03 | Gains weight: per-product opt-in now also decides which products keep the simple one-hash contract. |
| `/create-prd-architecture` | Receives a settled integrity contract instead of an open one; the stream-hash-and-trailer requirement for marked artifacts is new routed work. |

---

## 6. Does a radius-clause conflict with no waiver refuse the confirm, or permit a recorded override?

| | |
|---|---|
| **Finding ID** | `17-live-booking-settlement#001` |
| **Audit unit** | `17.01-availability-holds-confirmation` |
| **Verified severity** | blocking — CONFIRMED on adversarial verification |
| **Classification** | OWNER — no canonical statement exists to restore |
| **Remediation status** | Not fixed. No files edited. Awaiting owner ratification. |

### The collision, in one sentence

17.01.04 makes a radius breach a **hard confirmation precondition** that blocks absent a waiver, while 17.01.03 makes the same check at the same moment **warn + explicit recorded override, never a hard block** — and because confirm-under-challenge is routed through 17.01.04's gate, both rules fire on the same commit for the same user.

### Side A — hard block absent a waiver

- `17.01.04-confirmation-announce-gate.md:51` — "**Confirmation preconditions** — all hard, evaluated at the moment of commit, not at the moment the button rendered". No carve-out for confirm-under-challenge appears anywhere in C-01..C-06.
- `17.01.04-confirmation-announce-gate.md:61` — "C-06 | No radius-clause breach against an existing confirmed booking, **unless a waiver from the constraining promoter is on file** ([17.06]) | The obligation is breached the moment the second date is confirmed, not when it announces (DT-10). Radius waivers are routinely negotiated — the block must have a legitimate door | Blocked with the constraining contract named and a "request waiver" route".
- `17.01.04-confirmation-announce-gate.md:277` — "D-13 | Radius-clause compliance is checked at **confirm**, not announce, with a waiver-on-file exception".
- `17.01.04-confirmation-announce-gate.md:231` (DT-10) — "❌ REJECTED: **the obligation is breached at confirm.** ... Checking at announce would let the platform record a breach it helped create weeks earlier."
- `17.01.04-confirmation-announce-gate.md:248` — "Touches **17.06 Radius Clause & Exclusivity Tracking** — *hard permission check at confirm* (C-06, DT-10) ... This edge did not exist before Step 5 and it is a blocking one."
- Corroborated by the ladder file: `17.01.02-hold-ladder-priority.md:259` — "D-12 | Radius conflicts are **warned at hold time**, blocked at confirmation"; and `:158` — "A waiver (17.06) is required before this can confirm."

### Side B — warn + recorded override, never a hard block

- `17.01.03-challenge-release-expiry.md:228` — "D-15 | Radius (17.06) and routing (18) checks run before confirm-under-challenge — **warn + override, recorded**; never hard-block | DT-12. ... But radius clauses are waived routinely — hard-blocking would lose an artist a date over a conflict whose consent is obtainable, just not within 48h. The override's record is what makes warn-not-block honest."
- `17.01.03-challenge-release-expiry.md:142` — "On conflict: **warn + require explicit override with the conflicting show named**; the override is recorded. Not a hard block".
- `17.01.03-challenge-release-expiry.md:201` — "conflicts warn-and-override with the override recorded, never hard-block."
- `17.01.03-challenge-release-expiry.md:189` (DT-12) — "Resolved by running both checks **before** the confirm action is offered, warn-and-override rather than hard-block (D-15)".
- And `:109` puts the two rules on the same commit: "Confirmation hands off to 17.01.04, which owns the atomic transition and the entity approval chain".

### Why no precedence rule settles it

17.01.04 owns the confirmation gate; 17.01.03 owns the under-challenge path. Each ratified a numbered D-row off its own Deep Think entry (DT-10 vs DT-12), and neither declares confirm-under-challenge a carve-out from C-01..C-06. The reconciliation layer contradicts itself **inside one entry**: `live-booking-settlement-cx.md:31` (CX-14) says "confirm (**hard block**)" while the body of that same CX-14 section at `:371` says "radius conflicts warn-and-override with the override recorded; radius clauses are waived routinely, so a hard block would be wrong". `17.06-radius-clause-exclusivity.md:70` is silent on permission and adds a third reading — "Breaching | A confirmed date breaches a live clause | **Flagged** to both the artist and the protecting Operator" — which only makes sense if the confirm was not refused.

### Options

**A. Hard block wins everywhere. Delete the warn-and-override carve-out.**
C-06 stands as written; 17.01.03 D-15 is rewritten to "blocked, with the waiver-request route surfaced inside the countdown", and the 48h pressure is answered by the extension mechanism 17.01.03 already owns (its own DT-02 resolution: "the clock can bend when a deal is live").
- *Pros*: The platform never records itself facilitating a breach of a contract it can read, which is exactly DT-10's own argument applied one step further. Consistent with 17.01.02 D-12 and with 17.06's thesis that the warning exists precisely so the artist is not surprised at confirm. One rule, one screen, no branch on whether a clock happens to be running.
- *Cons*: Loses a real date when the constraining promoter would obviously have said yes but is asleep. Pushes exactly the case 17.01.03 fears — the deal done by phone, off-platform, and the platform loses the record. A block whose only door is a third party's response time is a block the industry will route around, which is the failure mode 17.01.04 itself names.

**B. Warn + recorded override wins everywhere. Demote C-06.**
C-06 moves out of the hard precondition table into the Confirmation warnings table as W-04; the override is recorded and attributed, and the breach is flagged to the constraining Operator immediately.
- *Pros*: The platform never invents an enforcement power it does not have — it is not a party to the radius clause and cannot adjudicate one. Records the truth, which is the domain thesis. Never loses a date to a signature the artist could obtain in a week.
- *Cons*: Contradicts three ratified rows (17.01.04 C-06/D-13, 17.01.02 D-12) rather than one. The Musician persona's stated value from 17.06 is "warned **before** booking a date that would breach one" — a warning that is dismissible at the last irreversible step is the weakest possible version of it. And the artist under pressure at 1am will click through it; that is what pressure does.

**C. Split by pressure — hard block on an ordinary confirm, warn+override only while a challenge clock is live.**
C-06 gains an explicit exception naming confirm-under-challenge; 17.01.03 D-15 is scoped to that path only.
- *Pros*: Both files keep their reasoning; the change is a documented carve-out rather than a reversal. Honest about the asymmetry — a 48h clock genuinely is a different decision environment.
- *Cons*: Makes a **contractual permission** depend on whether a rival happened to challenge, which no counterparty could defend afterwards. Creates a perverse incentive: the cheapest route to an override is to be put on a clock. And it is the branch most likely to be implemented wrong, because the same button now has two permission models.

**D. Hard block, with the waiver made a real-time instrument (recommended).**
C-06 stands. The block's "request waiver" route becomes a first-class in-app action against the constraining Operator with its own short clock, escalating on the same channel ladder 17.01.03 already specifies. Break-glass exists but is narrow: an override is available **only** while a challenge clock is live, requires the artist principal (never a delegate), notifies the constraining promoter at the moment it is used rather than after, and is recorded as a named breach event feeding 17.12.
- *Pros*: Keeps the rule that a contract breach is a refusal, and attacks the real objection — that consent is obtainable but not in 48h — by making consent obtainable in 48h. Break-glass is priced (the injured party is told immediately, and the record follows the confirming party), so it is not a click-through. Reuses 17.01.03's existing escalation and recording machinery rather than inventing any.
- *Cons*: The most machinery of the four — a waiver-request instrument with its own clock and escalation is new scope for 17.06, which is a leaf feature today. Still permits a breach in the break-glass case, so it does not satisfy a strict reading of DT-10. Two paths to specify instead of one.

### Recommendation

**Option D**, and Option A as the cheaper fallback if 17.06 is not to gain a waiver instrument in v1.

The reason is that 17.01.03's argument for never-blocking is not really an argument about permission — it is an argument about **latency**: "consent is obtainable, just not within 48h". Fix the latency and the argument dissolves, and the tree gets to keep the rule that its two other files already assume. The residual break-glass is what stops D collapsing back into A's failure mode of losing a date to an unreachable promoter, and pricing it (principal-only, injured party notified at the moment of use, recorded against the confirming party) is the same instrument 17.01.03 already trusts for defensive confirmation — record, not prohibition, at the one point prohibition would push the deal off-platform.

What I would not do is Option C. A permission that depends on whether a rival happened to challenge is indefensible to the promoter whose clause was breached, and it hands the market a reason to manufacture challenges.

### What changes downstream if D is ratified

- `17.01.03-challenge-release-expiry.md` — D-15 rewritten (radius half only; the routing half is untouched, 18 owns feasibility not permission), plus `:142`, `:201`, and DT-12's outcome text at `:189`.
- `17.01.04-confirmation-announce-gate.md` — C-06's "On failure" cell gains the break-glass path and its conditions; D-13 gains the same clause. The "all hard" framing at `:51` needs one qualifying sentence naming the single exception, or it stays literally false.
- `live-booking-settlement-cx.md` — CX-14 at `:31` and its section body at `:371-372` must state one rule; today they state both.
- `17.06-radius-clause-exclusivity.md` — gains the waiver-request instrument (actor, clock, escalation, grant/refuse outcomes) and a confirm-time permission row; its States table `Breaching` at `:70` must distinguish a breach created under break-glass from one created by a third party's later confirm.
- `17.12-counterparty-relationship-payment-reliability.md` — a new derived fact: radius break-glass usage, attributed to the confirming party. Note the 17.01.03 D-12 constraint — this is counterparty behaviour, not a platform failure, so it *does* debit.
- `01-identity-profiles-organizations` — "artist principal, never a delegate" is a third authority slot alongside offer-binding (17.02.03 D-03) and settlement-signing (17.09.05 D-06).

---

## 7. Does a `require-confirmation` rider item block the advance freeze, and by what mechanism?

| | |
|---|---|
| **Finding ID** | `18-show-production-touring#001` |
| **Audit unit** | `18.04-riders (gated by 18.03)` |
| **Verified severity** | blocking — CONFIRMED on adversarial verification |
| **Classification** | OWNER — no canonical statement exists to restore |
| **Remediation status** | Not fixed. No files edited. Awaiting owner ratification. |

### The collision in one sentence

The technical rider's third flag, `verification`, is specified to block the advance freeze on items the diff has already matched — but the freeze gate is the checklist's hard-outstanding count, and the checklist is decided never to generate an item for a match, so a `require-confirmation` match currently blocks nothing and there is no mechanism anywhere in the tree that could make it block.

### Both sides, quoted

**Side A — the rider owns the flag and asserts the blocking effect.**

- `18.04.01-technical-rider.md:50` — `| **Verification** | `trust-listing` · `require-confirmation` | Does the venue's listing data alone satisfy this, or must a human confirm? | Freeze gate (18.03.02 DT-03) |`
- `18.04.01-technical-rider.md:107` (Happy Path step 9) — "`require-confirmation` items block the freeze even on an automatic match."
- `18.04.01-technical-rider.md:134` (edge case) — "| `require-confirmation` item matched automatically | Still blocks the freeze until a human at the venue confirms | "Room's data says yes — you asked for confirmation. Awaiting [venue]." |"
- `18.04.01-technical-rider.md:181` (cross-cut to 18.03.05) — "`hard`+`unknown` and unresolved `require-confirmation` items block the freeze."
- `18.04.01-technical-rider.md:195` (D-05) floors **every** power item at "`exact` on voltage/frequency/phase, `hard` on negotiability, and `require-confirmation` on verification" — so this is not a rare flag, it is mandatory on a whole category.
- `18.04.01-technical-rider.md:167` (DT-11) is the argument the flag exists to carry: "**capability ≠ availability ≠ consent.** … The diff compares against a *listing*, which records what exists in the room, not what the venue will hand over. … it is why the verification axis in DT-05 must exist: the act declaring 'this item is too important to trust your data on' is the only mechanism that catches it before load-in."

**Side B — the checklist owns item generation and the freeze gate, and both exclude matches.**

- `18.03.01-advance-checklist.md:191` (D-04) — "A diff `match` generates **no item**. Only shortfalls, unknowns, near-matches and judgement items do" — with the reason at `:161` (DT-14): auto-confirming a match "**launders venue data age into an attested fact**" and 31 auto-confirmed rows "train the TM to stop reading".
- `18.03.01-advance-checklist.md:67` / `:192` (D-05) — "the **hard-outstanding count** is every `hard` item not in a terminal state … This is the number 18.03.05's freeze reads."
- `18.03-show-advancing-cx.md:146` (R-03) — "The freeze reads the checklist's outstanding count, not the diff's output."
- `18.03.02-venue-capability-diff.md:281` (D-11) — "**The diff is silent and non-blocking by construction** … Its only output is checklist rows and a delta notice to the Producer on changed outcomes".
- `18.03.02-venue-capability-diff.md:275` (D-05) closes the diff's row model at **three outcomes and five qualifiers** — `basis`, `caveats[]`, `confidence`, `severity`, `judgement-required`. `verification` is not among them.
- Grep across the whole ideation tree: the strings `require-confirmation` and `trust-listing` occur **only** in `18.04.01-technical-rider.md`. No consumer implements them.
- Corroborating tell: when `18.03.01` closed its own Q-03 against 18.04.01 D-04 (`18.03.01-advance-checklist.md:210`), it absorbed only two of the three flags — "a diff-sourced item inherits the rider item's `substitution` and `negotiability` values". `verification` was ratified in 18.04 and silently never picked up downstream.

### Why this is not a drift fix

Neither side is stale text. 18.04.01 D-04 is the ratified answer to a question three siblings asked independently (18.03.02 Q-03, 18.03.03 Q-02, 18.03.02 DT-03) and all three now cite it as resolved. 18.03.01 D-04 is a live decision with its own adversarial argument (DT-14) and it governs the gate. Making a matched `require-confirmation` row generate an item requires inventing facts nobody has stated: which side owns it, whether it is `hard` (18.03.01 D-06 derives severity from *source + declared strictness*, and `verification` is not a strictness value in that scheme), whether the Producer may downgrade it, and how much volume it adds — power alone is floored at `require-confirmation`, so a 6-item power section would emit 6 confirmation rows on a room that already matched all six. That volume question is precisely the alert-fatigue trade-off DT-14 was decided on. It is a product call.

### Options

**Option A — Fifth generation source: a matched `require-confirmation` requirement emits a venue-side confirmation item.**
Add a source row to 18.03.01's generation table: outcome `match` + rider `verification: require-confirmation` → a venue-side item "confirm the act may use [x]", severity inherited from the requirement's `negotiability`.
- *Pros*: most literal reading of 18.04.01 D-04; the item is unambiguously the venue's to answer, which is what DT-11's house-piano case actually needs; two-sided confirmation (18.03.01 D-02) then does exactly the job it was built for.
- *Cons*: punches a hole in 18.03.01 D-04's headline rule ("a `match` generates no item") and forces it to be restated with an exception, which is the kind of caveat that gets lost by a spec writer reading only the decision line. Adds the largest item volume of any option — power's floor guarantees it. Needs a new severity derivation branch in D-06 that has no precedent.

**Option B — A `require-confirmation` requirement never resolves to `match` on listing data alone; it holds at `unknown` until a named human confirms.**
The diff gains one `basis` value (e.g. `awaiting-confirmation`) meaning "the room states a satisfying value, but this requirement does not accept listing data as proof". The row is `unknown`, so 18.03.01's *existing* source-1 rule fires — `unknown` → a venue-side question — and 18.03.01 D-06's existing sentence, "An `unknown` on a hard requirement is `hard`", derives severity with no new rule at all.
- *Pros*: nothing new is invented; every mechanism already exists. It has a direct, load-bearing precedent one domain over — 16.05.05 D-03 already "forces `match` → `unknown` on stale show-stopping rows" (cited at `18.03.02:241`), which is the identical shape: *the data says yes and you may not trust it*. 18.03.01 D-04 stands untouched and un-caveated. The freeze consequence falls out correctly — power (`hard` + `require-confirmation`) becomes hard-outstanding and blocks a clean freeze, while a `nice-to-have` + `require-confirmation` item produces a soft unknown that does not. It is also semantically honest: 18.03.02 D-01 already holds that `unknown` means "nothing can be concluded", and "the room lists a Steinway but has not said you may touch it" is exactly that.
- *Cons*: changes the diff's headline arithmetic — a room that genuinely has everything now reports unknowns, and the Producer must read `basis` to see why. The `unknown` band is currently the honest-majority bucket, so confirmation rows land among genuine no-data rows unless the UI separates them. 18.03.02's five-qualifier model gains a sixth `basis` value (cheap — `basis` is already a seven-value enum).

**Option C — Verification is advisory, not gating.**
Keep the flag; it renders a badge on the diff row and on the advance sheet ("you asked for confirmation on this") and generates nothing and blocks nothing. Delete the blocking claims at 18.04.01:107, :134 and :181.
- *Pros*: cheapest; zero change to the checklist, the diff or the freeze; no item volume at all.
- *Cons*: guts the flag. DT-11 argues the verification axis is "the only mechanism that catches it before load-in" — an advisory badge on a screen the Producer reads once at T-14d is not that mechanism. The band still arrives at a Steinway they may not touch, which is the concrete failure the axis was created for.

**Option D — Drop the verification axis; express the intent through negotiability.**
Revert D-04 to two flags. "Too important to trust your data on" becomes a manual checklist item the Producer adds by hand.
- *Pros*: smallest model; three orthogonal flags across a 40-item rider is real authoring burden, which 18.04.01:57 already concedes.
- *Cons*: contradicts a decision that three separate files now cite as resolved (18.03.01 Q-03, 18.03.03 Q-02, 18.03.02 Q-03) — reopening it cascades into all three. It also relocates the work to human memory, which is the failure mode this entire domain exists to end, and it strands 18.04.01 D-05's power floor, which has no way left to say "confirm this one".

### Recommendation — Option B

It is the only option that adds no new machinery. Every part already exists and is already decided: `unknown` generates a venue-side question (18.03.01, source 1), `unknown` on a hard requirement is `hard` (D-06), hard-outstanding is the freeze gate (D-05/D-07), and every freeze stays overridable with a stated reason (18.03.05 D-03). It leaves 18.03.01 D-04 exactly as written — a `match` still generates no item, because a `require-confirmation` row is no longer a match. And the precedent is not invented for the occasion: 16.05.05 D-03 already demotes a match to `unknown` when the underlying fact cannot be trusted, and "listing data is not consent" (DT-11) is the same claim about a different kind of untrustworthiness. Option A is defensible but buys a permanent exception to a rule that was decided precisely to keep the checklist readable; Option C and D both discard a ratified decision.

### What changes downstream if B is ratified

1. **18.03.02** — `basis` gains one value (`awaiting-confirmation` or similar) and one matching rule in the Matching-semantics section: a requirement flagged `require-confirmation` never resolves to `match` from listing data. D-05's qualifier count is unchanged (still five); D-01's "`unknown` is never rendered as a match" gains a sibling clause. Its Happy Path counts (`:160`) and the 31-match figure in 18.03.01's Happy Path step 2 (`:93`) both need re-stating.
2. **18.04.01** — `:107`, `:134` and `:181` are reworded from "blocks the freeze even on an automatic match" to the mechanism that actually exists: a `require-confirmation` requirement holds at `unknown` until a named human at the venue confirms, and inherits whatever freeze consequence its `negotiability` gives an `unknown` (18.03.01 D-06). `:50`'s consumer column should also be corrected — it currently reads "Freeze gate (18.03.02 DT-03)", but 18.03.02 D-11 and 18.03-cx R-03 both establish the diff never gates; the consumer is the checklist (18.03.01 D-06) and, through it, the freeze (18.03.05).
3. **18.03.01** — D-04 and D-06 are untouched. The generation table's `unknown` row gains a parenthetical noting the two ways a row becomes `unknown` (no data, or confirmation required), because the Operator-facing copy differs: "do you have 3-phase?" vs "can we use the Steinway?".
4. **18.03.05** — unchanged. Zero hard-outstanding remains the precondition; overrides still record what was left open.
5. **16.02 / 16.05.05** — unchanged; B consumes 16.05.05 D-03's existing demotion pattern rather than extending it.

### If instead A is ratified

18.03.01 D-04 must be rewritten with an explicit exception and D-06 must gain a severity branch for verification-sourced items; the volume concern (every floored power item emitting a row on a matched room) needs an explicit answer in the same decision, or DT-14's alert-fatigue objection returns unaddressed.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-12|D-12]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-13|D-13]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-nn|D-NN]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-numbered|D-numbered]]
- [[decisions.md#d-row|D-row]]
