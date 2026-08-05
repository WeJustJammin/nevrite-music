# Ideation Ambiguity Audit — Run 3

> **Layer**: ideation (vision)
> **Date**: 2026-07-30
> **Run**: 3 — fresh post-remediation verification run (`/audit-ambiguity`, canonical skill)
> **Coverage**: 191 / 191 units · 1,122 / 1,122 files · 26 domain shards
> **Tree state audited**: post-DQ-R2-01 — D-75 / A′ propagated across 37 files, 2026-07-29
> **Rubric**: `.claude/skills/pipeline-rubrics/references/vision-rubric.md`
> **Verdict**: **FAIL**

---

## 1. Headline

| Metric | Value |
|---|---|
| Units audited | **191 / 191** (100%) |
| Files read | **1,122 / 1,122** (100%) |
| Raw findings raised | **436** |
| Refuted on adversarial verification | **302 (69.3%)** |
| **Confirmed blocking** | **18** |
| Confirmed warning | **116** |
| blocking → warning downgrades | 24 |
| Raw rubric ambiguity | **16.98%** (190.0 points / 1,119 applicable checkpoints) |
| Join integrity | 0 verdicts unmatched to a finding · 0 findings without a verdict |

436 = 302 refuted + 18 blocking + 116 warning. Every raw finding carries exactly one verdict and
every verdict maps to exactly one finding.

### Comparison with runs 1 and 2

| | Run 1 (2026-07-22) | Run 2 (2026-07-28) | Run 3 (2026-07-30) |
|---|---|---|---|
| Units scored | 191 / 191 | **154 / 191 (81%)** | **191 / 191 (100%)** |
| Verification pass | ran | **never ran** | ran |
| Raw ambiguity | 16.96% | 1.63% | **16.98%** |
| Raw findings | 1,449 | not retained | 436 |
| Refuted | 1,251 (86.3%) | n/a — no verification | 302 (69.3%) |
| Blocking | **20 verified** | 4 **raw, unverified** | **18 verified** |

**Run 2's raw figure is the outlier, and it is not comparable to anything.** Run 2 stopped at
154 of 191 units, its verification pass never executed, and its detailed findings for roughly
134 units were lost to a cleaned scratchpad. Its 1.63% is a raw, auditor-assigned number on
81% of the tree that no adversarial pass ever tested; its "4 blocking" are raw claims, not
confirmed ones. Run 2 itself said so — `ideation-ambiguity-report-run2-interim.md:4`:
"INTERIM — 154/191 units scored (81%), **verification did not run**". Placing 1.63% beside
run 1's or run 3's numbers compares an unverified partial sample to two complete verified
measurements.

**Run 3 sits essentially on run 1's raw figure: 16.98% against 16.96%, a difference of 0.02
percentage points.** Run 3 is the first complete verified measurement since run 1.

**This is not a regression.** Run 1 → run 3 raw ambiguity is flat, and the verified blocking
count moved **20 → 18** — against *full* coverage rather than run 2's 81%, and after the
DQ-R2-01 remediation cycle landed. The raw rubric percentage measures how many rubric
checkpoints an auditor marked WARN or FAIL before anything was tested; it was never the gate,
and run 1 said the same (`ideation-ambiguity-report.md:45-46`: "Neither number is the gate on
its own. The **confirmed blocking count (20)** is what determines whether downstream stages
can proceed"). What moved between run 1 and run 3 is not the raw score — it is what survives
verification.

### What the refutation profile says that the percentages do not

| | Run 1 | Run 3 |
|---|---|---|
| Refute rate | 86.3% | 69.3% |
| Refutations caused by **misquoting the source** | dominant class | **4 of 302 (1.3%)** |

Run 1's refutations were driven by auditors misquoting or misreading the documents they cited.
Run 3's were not: only **4 findings in 302** were refuted because the auditor misquoted. The
other 298 quoted the tree correctly and were refuted because the divergence they found did not
matter — it was answered elsewhere, tracked as a live deferral, or a level of detail the
ideation layer does not owe. **Run 3's findings were accurate but frequently immaterial.**
That is a different and healthier failure mode: the auditors read the tree correctly and
over-reported, rather than reading it wrongly.

---

## 2. Verdict — FAIL

**The ideation layer FAILS this audit.**

The criterion is not the percentage. It is this: **18 confirmed blocking findings remain, and
the pass condition is zero.** A blocking finding is, by rubric definition, a point where an
implementer cannot proceed without inventing product truth the specification does not contain.
Eighteen such points survived an adversarial pass whose refute rate was 69.3% — they are what
was left after the verifier actively tried to kill them.

Eleven of the eighteen were mechanical and have been remediated in this run. **Seven require
owner decisions and are unremediable by any agent** — they are contradictions between two
self-consistent ratified decisions, or dependencies on fields no file defines. They are
enumerated in [run3-owner-decision-queue.md](./run3-owner-decision-queue.md).

The layer does not pass until those seven are ratified and swept. `/create-prd` is blocked.

---

## 3. The 18 confirmed blocking findings

| Split | Count | Meaning |
|---|---|---|
| **Mechanical** | **11** | One file drifted from a ratified decision in the file that owns the concept. The correct text was fully determined by the canonical source. **Fixed in-run.** |
| **Owner** | **7** | Two or more owning files carry opposed, self-consistent numbered decisions with independent rationale — or a dependency on a field/state no file defines. **Not fixed.** |

Distribution by domain: 04 (5), 05 (3), 09 (2), 17 (2), 06 (1), 07 (1), 14 (1), 18 (1),
20 (1), root (1). Fourteen other domains produced zero blocking findings.

By rubric dimension, **17 of the 18 score under Dimension 3 (Feature Completeness)** — they are
contradictions and gaps in specified behaviour, not problem-statement, persona, or positioning
defects. The eighteenth (`root#001`) is a document-integrity defect with no single dimension.

#### B-01 · `04-opportunities-casting#001` — Alert cap stated as 1 and as 2 inside one cross-cut

| | |
|---|---|
| **Unit** | `04-opportunities-casting (domain root)` |
| **Classification** | **MECHANICAL** |
| **Disposition** | Remediated in-run |

**Finding.** opportunities-casting-cx.md contradicts itself on the alert cap within one cross-cut: CX-01 states both that a post may alert a subscriber exactly once ever and that the cap is two per user per post.

**Evidence.** opportunities-casting-cx.md:45-46 - "compensation **edits must never re-fire** the alert ... and publication `bump` must not re-fire either - **one alert per post per subscriber, ever**." ; opportunities-casting-cx.md:66 - "4. **Notification fan-out**: Publication is the fan-out's sole trigger; bump and edit are excluded by rule (D-13). Targeting-widening is the only legal cause of a second alert (**cap 2 lifetime per user/post**)." ; opportunities-casting-cx.md:19 (CX-01 map row) - "Publication gate is the fan-out's **sole** trigger". The canonical decision is 04.02.04 D-12 (line 244): "**Two alerts per (user, post), lifetime.** The second is spent on an eligibility-widening edit or a deadline escalation - whichever comes first", and 04.02.04:149 makes a deadline escalation an alert with no publication event behind it: "Post's deadline burns from > 14d into 72h | Tier escalates Digest -> Timely (D-06). Consumes alert 2 of 2."

**Canonical source.** .memory/wiki/specs/ideation/04-opportunities-casting/04.02-discovery-matching-alerts/04.02.04-alert-subscriptions-delivery.md:244 — "| D-12 | **Two alerts per (user, post), lifetime.** The second is spent on an eligibility-widening edit or a deadline escalation — whichever comes first | Without a cap, edit-republish is a spam loop and a burning deadline is a drip campaign. …"; corroborated at :86 ("Alerts per (user, post) | **2 lifetime** (D-12)"), :148 and :149 ("Consumes alert 2 of 2").

**Fix applied.** The domain CX file capped alerts at one-per-post-per-subscriber in its CX-01 prose while its own synthesis answer said 'cap 2 lifetime', and the CX-01 map row called publication the fan-out's 'sole' trigger. The alert pipe's owning file settles all three: 04.02.04 D-12 caps at 2 lifetime, and names the eligibility-widening edit and the deadline escalation as the two things that can spend the second. Rewrote the map row, the CX-01 relationship paragraph and synthesis answer 4 to state D-12's rule and cite it.

**Files changed.** `04-opportunities-casting/opportunities-casting-cx.md`, `04-opportunities-casting/04.01-opportunity-posting-targeting/04.01.03-compensation-spec-work-guardrails.md`

#### B-02 · `04-opportunities-casting#006` — Dep-call happy path pre-fills compensation that D-17 forbids

| | |
|---|---|
| **Unit** | `04.01-opportunity-posting-targeting` |
| **Classification** | **MECHANICAL** |
| **Disposition** | Remediated in-run |

**Finding.** 04.01.01's flagship happy path inherits compensation from the source booking and relies on that to clear the gate without interaction; 04.01.03 D-17 forbids exactly that, every time, with no exception.

**Evidence.** 04.01.01-opportunity-post-type-taxonomy.md:104 - "2. System opens the composer **pre-filled from the show**: date (venue-local, D-10), venue, **compensation (inherited from the booking)**, setlist (from 18), and the hirer" ; :108-111 - "4. Poster taps publish. The compensation gate evaluates synchronously (CX-01), and **passes without interaction because the fee came from the booking.** ... **Three interactions from 'drummer dropped out' to 'asking Sam'.**" ; :27 - "raised from a booked show (D-02) a dep call is **type -> slot -> confirm, three interactions**, because the show already knows the date, venue, **fee** and setlist" ; D-02 at :263 - "The platform already holds the show, the setlist, the project and **the fee**." ; flatly contradicted by 04.01.03-compensation-spec-work-guardrails.md D-17 at :223 - "**Compensation is never pre-filled from the source booking**, even when the post is raised from context (04.01.01 D-02) | Inheriting the fee leaks the fixer's margin to the dep (DT-15)." ; and its edge case :140 - "| Poster raises a dep call from their own booked show (04.01.01 D-02) | Date, venue and setlist inherit. **Compensation does not** (DT-15) ... | **Compensation step is blank and required, every time** |" ; and Happy Path step 1 at :87 - "Compensation is **never pre-filled from the source booking** even when the post was raised from context". The claim is repeated downstream at 04.02.03:40 and 04.04.04:38 ("date, venue, setlist and fee already known").

**Canonical source.** .memory/wiki/specs/ideation/04-opportunities-casting/04.01-opportunity-posting-targeting/04.01.03-compensation-spec-work-guardrails.md:223 — "| D-17 | **Compensation is never pre-filled from the source booking**, even when the post is raised from context (04.01.01 D-02) | Inheriting the fee leaks the fixer's margin to the dep (DT-15). …"; :140 — "Date, venue and setlist inherit. **Compensation does not** (DT-15) … | Compensation step is blank and required, every time"; :180 (DT-15) — "**Compensation is never pre-filled from the source booking** (D-17), every time, no exception."; :186 — "its D-02 'post-from-context' must not pre-fill compensation".

**Fix applied.** 04.01.01's flagship post-from-context flow pre-filled compensation from the source booking and cleared the gate 'without interaction because the fee came from the booking'. 04.01.03 owns compensation, and its DT-15 is a defect trace that names 04.01.01 D-02 by number and fixes exactly this — the ratification swept 04.01.03 (Happy Path, edge case, D-17, cross-cut note) and never reached 04.01.01. Rewrote the composer pre-fill list, the publish step, the Musician Role Lens interaction count and D-02's own statement.

**Files changed.** `04-opportunities-casting/04.01-opportunity-posting-targeting/04.01.01-opportunity-post-type-taxonomy.md`

#### B-03 · `04-opportunities-casting#011` — 04.01.01 asserts a one-alert-ever cap it does not own

| | |
|---|---|
| **Unit** | `04.01-opportunity-posting-targeting` |
| **Classification** | **MECHANICAL** |
| **Disposition** | Remediated in-run |

**Finding.** 04.01.01 D-13 and its Cross-Cut Notes assert an absolute one-alert-per-subscriber-per-post rule and that publication is the fan-out's sole trigger; 04.02.04 D-12, which owns the alert pipe, sets the cap at two and names two non-publication triggers.

**Evidence.** 04.01.01-opportunity-post-type-taxonomy.md:128 - "6. On pass, the post enters `published` and is released to the board (04.02.01) and the alert fan-out (04.02.04). **The fan-out fires once per post per subscriber, ever (D-13).**" ; :240 - "Touches **04.02.04 Alert Subscriptions & Delivery** ... Publication is the fan-out's **sole** trigger, and **bump must not re-fire it** (D-13) - **one alert per post per subscriber, ever.**" ; :198 - "| Published | Gate passed; >=1 slot open | Live on board, **alerts fanned out once** (D-13), submission open |" ; contradicted by 04.02.04-alert-subscriptions-delivery.md D-12 at :244 - "**Two alerts per (user, post), lifetime.** The second is spent on an eligibility-widening edit or a deadline escalation - whichever comes first" ; :86 - "| Alerts per (user, post) | **2 lifetime** (D-12) | The first is the match. The second is spent on whichever comes first: an eligibility-widening edit (04.01.02) or a deadline escalation (D-06). A third would be an edit-loop spam vector. |" ; :148 - "| Post edited to widen targeting (invite-only -> network) | The recipient is **newly eligible** - this is the one legal re-alert. **Consumes alert 2 of 2** (D-12). |" ; :149 - "| Post's deadline burns from > 14d into 72h | Tier escalates Digest -> Timely (D-06). **Consumes alert 2 of 2.** |"

**Canonical source.** .memory/wiki/specs/ideation/04-opportunities-casting/04.02-discovery-matching-alerts/04.02.04-alert-subscriptions-delivery.md:244 — "| D-12 | **Two alerts per (user, post), lifetime.** The second is spent on an eligibility-widening edit or a deadline escalation — whichever comes first …". 04.01.01's own D-13 (now :281) claims only 'Bump: 1 per rolling 24h, max 3 per post, **never re-fires alerts**' — it never sets a per-subscriber cap.

**Fix applied.** The 04.01 side of the same divergence. 04.01.01 asserted 'the fan-out fires once per post per subscriber, ever (D-13)' in its happy path, its post-level state table and its cross-cut note. D-13 itself only ever decided that **bump never re-fires alerts** — a rule fully compatible with the pipe's cap. The 'ever' clause is 04.01.01 restating a cap it does not own. Rewrote all three restatements to keep D-13's bump rule and cite 04.02.04 D-12 for the cap.

**Files changed.** `04-opportunities-casting/04.01-opportunity-posting-targeting/04.01.01-opportunity-post-type-taxonomy.md`

#### B-04 · `04-opportunities-casting#021` — Five decisions depend on a post `decide-by` date no file defines

| | |
|---|---|
| **Unit** | `04.04-triage-shortlist-decisioning` |
| **Classification** | **OWNER** |
| **Disposition** | Not fixed — [owner queue](./run3-owner-decision-queue.md) entry |

**Finding.** Five decisions and two states across two sub-domains are built on a post field - the decide-by date - that the file owning the post object never defines, and no open question anywhere asks for it.

**Evidence.** 04.04.01-review-queue-triage.md D-05 at :211 - "every hold has a **resolve-by date bounded by the post's decide-by** (04.01.01)" ; D-06 at :212 - "The applicant is told **a date, not a state** - "You'll hear by 14 Aug" | **Derived from the post's decide-by (04.01.01)**" ; :96 - "**Holds carry a blocker and a resolve-by date** defaulting to - and never exceeding - the post's decide-by date (04.01.01)" ; the Dormant state at :158 - "| Dormant | >=1 candidate, 0 triage actions, **>=50% of the publish->decide-by window elapsed** |" ; the Abandoned state at :160 - "| Abandoned | Poster stopped returning; **decide-by reached** with cards untouched |" ; and the file names the risk itself at :192 - "The post's **decide-by date** is the ceiling on every hold's resolve-by (D-05) and the denominator of the `dormant` trigger. **Without a decide-by, D-05's forcing function has no bound.**" 04.05.01 depends on it four more times, including a proposed default computed from it (:254 - "Proposed default if yes: **decide-by + 7 days**"). 04.01.01, which owns the post, never mentions decide-by: its context fields are ":38 - type, acting identity, hirer, decider, date, location, compensation policy", its terms set is D-09's ":270 - type, acting identity, date, location, slot count, compensation, required criteria", and its only expiry rule keys on the event date (":169 - Post's date passes while still `published`"). Contrast 04.05.03 Q-07 (:260), which does track a comparable missing field and says why: "*Status check: `04.01.01` still carries neither field ... so the gap is live.* ... Leaving it unrecorded means the handoff is unbuildable as specified." No equivalent question exists for decide-by.

**Why no canonical answer exists.** The post has no decide-by date. 04.01.01 owns the opportunity object and never mentions one; 04.04 and 04.05 build five decisions and two queue states on it as though it were an established field. Nobody can invent it — whether posters must supply one, what it defaults to per type, and whether it (not the event date) is what auto-closes a post are product calls.

**Owner brief.** See [run3-owner-decision-queue.md](./run3-owner-decision-queue.md).

#### B-05 · `04-opportunities-casting#026` — Applicant withdrawal permitted after an offer is live

| | |
|---|---|
| **Unit** | `04.05-outcome-response-handoff` |
| **Classification** | **MECHANICAL** |
| **Disposition** | Remediated in-run |

**Finding.** 04.05.04 permits an applicant to withdraw while an offer is live and records it as a withdrawal; 04.03.01 D-12 scopes withdrawal to pre-offer states only and requires that act to be a decline - and the two paths have different reputation and offer-chain consequences.

**Evidence.** 04.05.04-applicant-pipeline-history.md:55 - "| Applicant withdraws while an offer is live | **Allowed** - withdraw is the applicant's own act, unlike self-close. **Entry moves to `withdrawn`**; the live offer's fuse is released back to the poster (04.05.03) | "Withdrawn" - and the offer is gone, deliberately irreversible |" ; D-06 at :98 - "| D-06 | Applicants **can withdraw** (unlike self-close), which **releases a live offer's fuse** back to the poster |" ; contradicted by 04.03.01-structured-submission.md D-12 at :202 - "**Withdrawal is scoped to pre-offer states only** | Withdraw, decline and break-a-commitment are three verbs with three costs and three owners (DT-07). **Once an offer is live the control hands to 04.04.03.**" ; and its edge case :100 - "| **Withdraw after an offer is live** | **Not a withdrawal - a decline** (D-12, DT-07). Control changes and hands off to 04.04.03. | The decline path, not the withdraw path. |" ; DT-07 at :155 records the conflation as the defect it fixed - "**Withdrawal and decline are different verbs and the state machine conflated them.**" The consequences differ materially: 04.05.01 D-09 (:243) excludes withdrawals "**from the denominator entirely**" while a decline is a poster-answered event that falls to #2 and carries a structured reason (04.04.03 D-11 at :255, CX-02 at :11).

**Canonical source.** .memory/wiki/specs/ideation/04-opportunities-casting/04.03-submission-audition/04.03.01-structured-submission.md:202 — "| D-12 | **Withdrawal is scoped to pre-offer states only** | Withdraw, decline and break-a-commitment are three verbs with three costs and three owners (DT-07). Once an offer is live the control hands to 04.04.03."; :100 — "| **Withdraw after an offer is live** | **Not a withdrawal — a decline** (D-12, DT-07). Control changes and hands off to 04.04.03. | The decline path, not the withdraw path. |"; :155 (DT-07) — "**Withdrawal and decline are different verbs and the state machine conflated them.** … Withdrawal is scoped to the pre-offer states only (D-12)". Corroborated by 04.04.03-offer-acceptance.md:118 ("**The candidate accepts, counters, or declines** (D-06)") and :194 ("| Declined | Candidate declines | Falls to #2 (CX-02). Structured reason if given (D-11) |").

**Fix applied.** 04.05.04 — the applicant's read-only pipeline/history surface — let an applicant withdraw from a live offer and recorded it as `withdrawn`. The submission state machine's owner already walked this exact case and split the verbs: 04.03.01 DT-07 records 'the state machine conflated them' as the defect it fixed, and D-12 scopes withdrawal to pre-offer states, handing offer-stage control to 04.04.03 — whose verb set (accept / counter / decline, D-06) has no 'withdraw' in it. 04.05.04 is the sibling the DT-07 sweep missed; its D-06 rationale is entirely about the contrast with self-close, and the offer-stage clause is a slip inside that contrast. Rewrote the edge case, D-06 and the entry-state table.

**Files changed.** `04-opportunities-casting/04.05-outcome-response-handoff/04.05.04-applicant-pipeline-history.md`

#### B-06 · `05-services-marketplace#001` — Craft mutability on a live listing specified both ways

| | |
|---|---|
| **Unit** | `05.01-service-listings-pricing` |
| **Classification** | **MECHANICAL** |
| **Disposition** | Remediated in-run |

**Finding.** Whether a seller may change the craft of a live listing is specified both ways: 05.01.01 blocks it as immutable, 05.01.02 permits it. Neither statement carries a marker or references the other.

**Evidence.** 05.01.01-service-listings-packages-rate-cards.md:191 — "| D-10 | Craft is immutable on a live listing — archive and republish | Craft determines the legal model set, facet set, benchmark cohort and reputation cohort. A mutable craft is reputation laundering via a form field. |"; 05.01.01:82 — "| Seller changes the **craft** of a live listing (Mixing → Mastering) | Blocked. ... | "You can't change the craft of a live listing. Archive it and publish a new one — your Mixing reviews stay with Mixing." |"; contradicted by 05.01.02-service-category-taxonomy-attributes.md:105 — "| **Seller edits craft on a listing with accumulated reputation** | Reputation is **per-role** (Reviews cross-cut; `05.01.01` DT-03) — changing craft does not carry mix reviews onto a mastering listing. **The edit is permitted; the reputation does not follow** | "Reviews stay with the work you did. This listing starts fresh in Mastering." |" and by 05.01.02:95 — "| **Listing's craft changes while a quote derived from it is live** | Listing version increments; the issued quote honours its own snapshot until expiry |"

**Canonical source.** 05.01-service-listings-pricing/05.01.01-service-listings-packages-rate-cards.md:191 — "| D-10 | Craft is immutable on a live listing — archive and republish | Craft determines the legal model set, facet set, benchmark cohort and reputation cohort. A mutable craft is reputation laundering via a form field. |"; reinforced at 05.01.01:82 — "Blocked. Craft determines the legal model set (CX-01), the facet set, the benchmark cohort (CX-08) and the per-craft reputation cohort. Changing it migrates reviews into a craft they were never earned in — reputation laundering by form field." with buyer copy "You can't change the craft of a live listing. Archive it and publish a new one — your Mixing reviews stay with Mixing."

**Fix applied.** Seller-initiated craft change on a live listing is blocked. 05.01.01 owns listing edit rules and states it three ways (D-10, the edge-case row at :82, and its buyer copy); 05.01.02 is the taxonomy file and carried one drifted edge-case row saying the edit is permitted. 05.01.02 has fourteen numbered decisions and none of them touches seller-edited craft mutability, so nothing in the taxonomy file is authoritative here. Corrected the drifted row to state the block and cite 05.01.01 D-10, and disambiguated the neighbouring quote row so the only craft change it describes is the curation-driven re-point under D-12/D-13.

**Files changed.** `05-services-marketplace/05.01-service-listings-pricing/05.01.02-service-category-taxonomy-attributes.md`

#### B-07 · `05-services-marketplace#010` — Benchmark band on a live quote — symmetric vs sellers-only

| | |
|---|---|
| **Unit** | `05.02-quotes-scope-contracting` |
| **Classification** | **OWNER** |
| **Disposition** | Not fixed — [owner queue](./run3-owner-decision-queue.md) entry |

**Finding.** 05.02.01 D-15 requires the benchmark band to render to both parties on a live quote; 05.01 decided sellers-only and rejected the buyer-facing pairing three times. Neither side flags the other.

**Evidence.** 05.02.01-custom-quotes-proposals-scope.md:244 — "| D-15 | The benchmark band (05.01.04) is rendered on a live quote **symmetrically** to both parties, or to neither | An asymmetric benchmark makes the platform an agent for one side of a negotiation it is supposed to referee. |", enacted at :77 ("the benchmark band for this craft/cohort (05.01.04, symmetric — D-15)"). Against 05.01.01:186 D-05 — "The benchmark band renders in the seller's pricing step only — never in the buyer preview or on the public listing"; 05.01.04:96 Q-03 — "✅ **Resolved — `05.01.01` D-05, upheld by sub-domain CX R-04 and domain CX R-06. Sellers only.**"; 05.01-service-listings-pricing-cx.md:89 R-04 — "The band renders in the pricing *step*, not on the public listing"; services-marketplace-cx.md:216 R-06 — "The benchmark band renders only in the seller's pricing step (05.01.04 D-01)".

**Why no canonical answer exists.** Whether a buyer sees the benchmark band on a live quote is decided both ways by two [DEEP] numbered decisions with opposed, genuine principles — 05.02.01 D-15 (symmetric or nothing) against 05.01.04 Q-03's ratified "sellers only". Resolving it moves negotiating power between buyer and seller, so it is the owner's call.

**Owner brief.** See [run3-owner-decision-queue.md](./run3-owner-decision-queue.md).

#### B-08 · `05-services-marketplace#018` — `spec` pricing model has no legal rights-posture row

| | |
|---|---|
| **Unit** | `05.06-rights-warranties-transfer` |
| **Classification** | **OWNER** |
| **Disposition** | Not fixed — [owner queue](./run3-owner-decision-queue.md) entry |

**Finding.** The `spec` pricing model has no legal rights-posture combination, and its conditional vesting cannot be expressed in the closed posture vocabulary — yet a posture election is mandatory before a listing tier can publish.

**Evidence.** 05.01.03-music-pricing-model-library.md:43 — "| Spec | nothing | **trigger condition** · the term that vests on trigger | speculative writing/production | No — conditional (DT-10) |", and DT-10 rejects mapping it onto points: "spec is **conditional** ... A points deal vests at acceptance". The legal-combinations table in 05.06.01-engagement-rights-posture.md:70-74 has exactly three rows — "Cash-only (flat · per-song · per-minute · day rate · per-stem)", "Points-only", "Fee + points" — none of which is spec. 05.06.01:208 D-07 — "**The posture vocabulary is closed.** Four master postures, four composition postures, no free text, no "other", and no rider may qualify what executes", and D-01 — "**No default posture** — an explicit election is required to publish a tier". 05.06.01 Q-07 concedes the adjacent gap ("**Reversion is a common, legitimate term this vocabulary cannot express**") but not this one.

**Why no canonical answer exists.** The `spec` pricing model is publishable per 05.01.03 but has no row in 05.06.01's legal rights-posture combinations, and its defining property — a term that vests on a future trigger — cannot be expressed in a vocabulary D-07 declares closed, while D-01 forbids a default and D-05 requires both postures on every tier. A spec listing therefore cannot publish without inventing a posture. Nothing in the tree decided this; the adjacent Q-07 covers reversion only.

**Owner brief.** See [run3-owner-decision-queue.md](./run3-owner-decision-queue.md).

#### B-09 · `06-education-lessons-mentorship#002` — Safeguarding vetting rendered as a badge the owning file bans

| | |
|---|---|
| **Unit** | `06.02-teacher-discovery-profiles-trials` |
| **Classification** | **MECHANICAL** |
| **Disposition** | Remediated in-run |

**Finding.** Safeguarding vetting is required to render as a 'badge' with status grammar on the two highest-traffic surfaces (public profile, result card) by two sibling features, while the feature that owns the credential block bans exactly that rendering and calls it the most dangerous design in the file.

**Evidence.** 06.02.01-teacher-tuition-profile.md:124 (D-09 tier table): "**Public, indexed** (no account) | Identity header; ... credential **claims** and badges ("played bass on {record}"; "DBS checked, current"); reviews; rate ..." and 06.02.01-teacher-tuition-profile.md:32 (Fan Role Lens): "Sees: identity header, all self-authored and structured tuition content, credential **claims** and badges". 06.02.03-teacher-discovery-match-criteria.md:162 (Happy Path 5): "Each card states its top two reasons in plain language, the rate in the viewer's currency, next availability as a **shape** (signed-out), a vetting badge, and the evidence mix from 06.02.02"; also :223 (Populated state) "vetting badge" and :197 "Nobody sees a stale vetting badge". Contradicted by 06.02.02-verified-credentials-credit-backed-credibility.md:313 (D-11): "Vetting renders as a **dated statement naming the check and its jurisdiction**, never as a badge, tick or shield"; :161 "No green tick. No shield. No word "safe"."; :270 (DT-07) "Vetting can be rendered as a verified badge ... ❌ REJECTED, and this is the most dangerous design in the file ... **A tick is status grammar; the fact is a snapshot.**"; :304 (D-02) "no composite trust score, **no summary badge, no headline count**". The parent index agrees with 06.02.02: 06.02-teacher-discovery-profiles-trials-index.md:41 says the Fan sees "each credit as a plain sentence with its record and role ... **never a badge** (D-02)".

**Canonical source.** 06.02.02-verified-credentials-credit-backed-credibility.md:313 (D-11) — "Vetting renders as a **dated statement naming the check and its jurisdiction**, never as a badge, tick or shield | Per DT-07 and DT-10. The fact is a snapshot with no legal expiry; a tick asserts a current status the platform cannot possess, and implies a safety assessment the check never made. The date is the honesty." Reinforced by 06.02.02:304 (D-02) "no composite trust score, **no summary badge, no headline count**"; 06.02.02:161 "No green tick. No shield. No word "safe"."; 06.02.02:270 (DT-07) "❌ REJECTED, and this is the most dangerous design in the file ... **A tick is status grammar; the fact is a snapshot.**". Ownership seam asserted from the owning side at 06.02.02:285 ("Consumes **Safeguarding & Minor Protection** ... Owned there; **gated** at 06.01.04; **displayed** here. Three different files, deliberately.") and 06.02.02:289 ("Touches **06.02.01 Teacher & Tuition Profile** — renders inside it, but is not authorable by it (D-01, CX-02)"). Parent index concurs: 06.02-teacher-discovery-profiles-trials-index.md:41 "**Never a badge** — 06.02.02 D-02 bans a composite trust score, a summary badge and a headline count".

**Fix applied.** 06.02.01 and 06.02.03 rendered the safeguarding vetting signal as a 'badge' with status grammar ('DBS checked, current'), contradicting 06.02.02 D-11/D-02/DT-07 — the file that owns the credential block and its rendering. Rewrote all six drifted locations to state the dated-statement form and cited 06.02.02 D-11 / D-02 inline, and added the missing rendering seam to both consumers' cross-cut notes.

**Files changed.** `06-education-lessons-mentorship/06.02-teacher-discovery-profiles-trials/06.02.01-teacher-tuition-profile.md`, `06-education-lessons-mentorship/06.02-teacher-discovery-profiles-trials/06.02.03-teacher-discovery-match-criteria.md`

#### B-10 · `07-music-projects-collaboration#004` — Band acceptance — one section credit or one plus four

| | |
|---|---|
| **Unit** | `07.03-contributors-access-confidentiality` |
| **Classification** | **MECHANICAL** |
| **Disposition** | Remediated in-run |

**Finding.** Whether accepting a band invitation produces one section credit or one plus four member credits is stated both ways across the unit, and the sibling misquotes the ratified framing it cites.

**Evidence.** 07.03.01-contributor-roster-role-assignment.md:252 D-10 — "**Bands and organizations may hold roster entries** where the role admits the party type; **band membership never fans out to member entries or member credits**... The horn section is one negotiation and one section credit. Fan-out fabricates a credit for the member who missed the session", restated at :167 — "**One** section credit, frozen to the contribution-date lineup (D-10, `02.01.01` D-07). It does **not** create four member credits and it does **not** grant four vault logins." 07.03.02-contributor-invitation-scoped-onboarding.md:152 — "acceptance by any one of them creates a **single band roster entry**. Individual member credits are separate entries created afterward — the horn section is one negotiation and four credits (parent Q-03's framing)." The parent it cites says the opposite: 07.03-contributors-access-confidentiality-index.md:57 Q-03 — "the horn section is one negotiation and one section credit; band membership never fans out to member entries or member credits."

**Canonical source.** 07.03.01-contributor-roster-role-assignment.md:252 — "| D-10 | **Bands and organizations may hold roster entries** where the role admits the party type; **band membership never fans out to member entries or member credits** | **Resolves Q-03 / parent Q-03**, per `02.01.01` D-07 (ratified) and `02.06` D-21. The horn section is one negotiation and one section credit. Fan-out fabricates a credit for the member who missed the session; roll-up fabricates a band credit for a two-member session. |"

**Fix applied.** 07.03.02's 'Bands as invitees' block said band-entity acceptance yields 'one negotiation and four credits' and attributed that to parent Q-03, which states the exact opposite. Rewrote the block to state D-10's ratified rule — one section credit, no fan-out — with D-11 for the access half.

**Files changed.** `07-music-projects-collaboration/07.03-contributors-access-confidentiality/07.03.02-contributor-invitation-scoped-onboarding.md`

#### B-11 · `09-rights-ownership#003` — Publishing draft save blocked where the validator says save is never gated

| | |
|---|---|
| **Unit** | `09.01-rights-registry` |
| **Classification** | **MECHANICAL** |
| **Disposition** | Remediated in-run |

**Finding.** The publishing feature blocks saving a draft whose publisher rows do not reconcile to their anchor writer's share, while the ledger feature that owns validation states as a ratified decision that save is never gated and only Propose is - a rule two other features cite as governing.

**Evidence.** 09.01.04-publishing-rights.md:162 'Publisher rows anchored to W total != W's writer share | **Save blocked**, with the specific remainder named per writer - not a global "doesn't total 200".' and :197 States 'Partial | All positions declared, one writer's publisher pool != their writer share | Per-writer remainder named; **save disabled** with the reason stated as a question, not a code'. CONTRA 09.01.02-ownership-ledger-validation.md:262 D-05 '**Save is never gated; Propose is.** An unbalanced draft persists as `unallocated` | The capture moment is unrepeatable. Blocking save is a data-loss path aimed at the persona whose lazy path must be the correct path (DT-10).' and :167 'Shares total 97% | Draft **saves**. ... **Save is never blocked**; the Propose button carries the reason.' and :229 DT-10 rejecting blocked-save because 'it contradicts the thesis ... a Producer mid-session typing shares who cannot save loses the work'. The same rule is cited as governing by 09.02.04-split-amendment-reconsent.md:80 'Draft | Saved always, never gated ([09.01.02] D-05)' and 09.02.04:273 D-10 'notification is rate-limited ..., saving never is'. 09.01.04:23-24 places its own anchoring rule inside that validator: 'The arithmetic that validates them is [09.01.02]; this feature contributes one invariant to that validator (the anchoring rule, D-05)'.

**Canonical source.** 09.01.02-ownership-ledger-validation.md:262 — "| D-05 | **Save is never gated; Propose is.** An unbalanced draft persists as `unallocated` | The capture moment is unrepeatable. Blocking save is a data-loss path aimed at the persona whose lazy path must be the correct path (DT-10). |"; corroborated by 09.01.02:167 "Draft **saves**. Ledger stays `unallocated`. **Propose** is disabled. … Save is never blocked; the Propose button carries the reason.", 09.01.02:207 "**Propose disabled with the reason on the button**. Save always available (D-05).", and 09.01.02:229 DT-10 "❌ REJECTED — **and it contradicts the thesis** … Save always succeeds; **Propose** is what the invariants gate." Subordination is stated by the drifted file itself at 09.01.04:22-24: "The arithmetic that validates them is [09.01.02]; this feature contributes one invariant to that validator (the anchoring rule, D-05)", and the rule is cited as governing by a third file at 09.02.04-split-amendment-reconsent.md:80 "Draft | Saved always, never gated ([09.01.02] D-05)."

**Fix applied.** 09.01.04 Publishing Rights blocked/disabled SAVE when a writer's anchored publisher pool did not reconcile to their writer share, contradicting the ratified rule in the file that owns validation. 09.01.02 D-05 is canonical — save is never gated, Propose is — and 09.01.04 itself concedes 09.01.02 is the validator and that it contributes only the anchoring invariant. Both drifted rows now state Propose-disabled with save always available, citing 09.01.02 D-05.

**Files changed.** `09-rights-ownership/09.01-rights-registry/09.01.04-publishing-rights.md`

#### B-12 · `09-rights-ownership#012` — `public-domain` ledger state has no writer anywhere in the tree

| | |
|---|---|
| **Unit** | `09.03-chain-of-title-lifecycle` |
| **Classification** | **OWNER** |
| **Disposition** | Not fixed — [owner queue](./run3-owner-decision-queue.md) entry |

**Finding.** The registry depends on a `public-domain` terminal publishing-ledger state that satisfies the release gate, but the feature that owns the determination produces only per-jurisdiction statuses for four named jurisdictions, declares everything else `unknown`, and states that a determinate status is not an ownership determination - so nothing in the tree can set the state the registry requires.

**Evidence.** 09.01.01-work-recording-duality.md:289 'A work in the **public domain** | Its publishing ledger is `public-domain`, a terminal state - **not** `unallocated`. **It satisfies the release gate.** Without this, no PD work could ever be released, which is absurd. The determination is [09.03.05]'s, never this feature's. | "Composition is in the public domain - no publishing owners."' and :334 'public-domain` is a terminal publishing-ledger state that **satisfies** the release gate'. CONTRA 09.03.05-copyright-term-public-domain.md:43-50 '**CQ-09 Option B - v1 supports exactly `US`, `FR`, `DE`, and `GB`** ... Any other territory, missing death date or historical fact, unsupported work/category rule, or insufficient source evidence is explicitly **`unknown` / `not determined`** - never omitted, extrapolated from another jurisdiction, or guessed.' and :119 D-06 'A determinate term status is **not clearance, legal advice, ownership, or release authorization**', with :80 'User treats a determinate term status as clearance, licence, ownership decision, or release approval | **Block the inference, not the work.**' The ledger meanwhile has exactly one territory: 09.01.02-ownership-ledger-validation.md:272 D-15 'Invariants are evaluated **per territory**; v1 has exactly one territory (`World`)'.

**Why no canonical answer exists.** 09.01.01 depends on a terminal `public-domain` publishing-ledger state that satisfies the release gate, but the feature it names as the determiner (09.03.05) emits only per-jurisdiction term statuses for US/FR/DE/GB, marks everything else `unknown`, is read-only to all personas, and rules by numbered decision that a term status is not ownership or release authorization. No file in the tree writes the state, and no rule collapses four jurisdictions onto the ledger's single `World` territory. Owner decision required — resolving it means choosing who may declare a work public domain and on what evidence, which changes what a user can release.

**Owner brief.** See [run3-owner-decision-queue.md](./run3-owner-decision-queue.md).

#### B-13 · `14-digital-goods-marketplace#001` — Published SHA-256 cannot match bytes delivery rewrites per buyer

| | |
|---|---|
| **Unit** | `14.03-delivery-versioning-library` |
| **Classification** | **OWNER** |
| **Disposition** | Not fixed — [owner queue](./run3-owner-decision-queue.md) entry |

**Finding.** Delivery specifies a single per-artifact SHA-256, published before any bytes move and auto-verified against on completion, while the same delivery step is specified elsewhere to rewrite the artifact's bytes per buyer (embedded tempo/key/loop metadata, and a per-buyer forensic watermark). Both cannot hold: for every content product the delivered bytes cannot match the published hash, so the specified verification fails and E-19's escalation path quarantines correctly-delivered builds.

**Evidence.** 14.03.01-download-delivery-resumable-transfer.md:73 '| Checksum | **SHA-256, published as copyable text** beside the download control | Auto-verified for the Musician; hand-verifiable for the air-gapped Operator (D-09). |' — :82 '3. System shows, **before any bytes move**: download size, **unpacked size** (D-02), version, SHA-256…' — :89 '10. On completion, SHA-256 is verified automatically against the published checksum.' — :114 (E-19) 'A second failure means the **stored artifact** is bad — every buyer of that build will hit it. Escalate: alert vendor and platform, quarantine the build from new grants.' — :184 (D-09) 'The SHA-256 is published as **copyable text**, so the Operator verifies by hand on a machine that has never met us.' CONTRADICTED BY 14.03.05-per-buyer-forensic-watermarking.md:32 'Marking makes each delivered artifact unique, which is why it collides head-on with edge caching (CX-04)…' and :39 '3. Delivery generates a buyer-unique mark and stamps it during transfer (CX-04).' AND BY 14.04.01-sample-loop-pack-catalog.md:275 (D-06) '**Delivered files carry embedded tempo/key/loop metadata**; an estimated key is embedded only where declaration and extraction agree' AND BY digital-goods-marketplace-cx.md:35 (CX-24) 'Delivered audio must be **written** with embedded tempo/key/loop metadata (ACIDized-WAV / Apple-Loops), not merely served… This lands on the *same* delivery step as per-buyer watermarking: two writers on one artifact.'

**Why no canonical answer exists.** Not mechanical. The checksum side is a self-consistent set of normative statements in the file that OWNS delivery (14.03.01: parameter rows :73/:74, happy-path steps :82/:89, edge case E-19 :114, decision D-09 :184, Populated state :132). The byte-rewrite side is an equally self-consistent set in the files that OWN their concepts (14.04.01 D-06 :275 for embedded metadata, 14.03.05 :39 for watermarking, digital-goods-marketplace-cx.md CX-24 :455/:464 for the composed ordering). Neither side is a summary restating the other wrongly, and neither is stale text a ratification swept past. The tree never decided what the published hash is a hash OF once delivery writes bytes. Choosing changes what the Operator can verify by hand, what E-19 escalates on, and what the buyer sees on screen — a product decision with real trade-offs.

**Owner brief.** See [run3-owner-decision-queue.md](./run3-owner-decision-queue.md).

#### B-14 · `17-live-booking-settlement#001` — Radius conflict at confirm — hard block vs recorded override

| | |
|---|---|
| **Unit** | `17.01-availability-holds-confirmation` |
| **Classification** | **OWNER** |
| **Disposition** | Not fixed — [owner queue](./run3-owner-decision-queue.md) entry |

**Finding.** A radius-clause conflict at confirmation is specified as a hard block in two files and as never-a-hard-block in a third, with no marker on either side, so an implementer cannot tell whether a confirm-under-challenge with a radius conflict and no waiver on file is refused or permitted with a recorded override.

**Evidence.** 17.01.04-confirmation-announce-gate.md:51 introduces the set as '**Confirmation preconditions** — all hard, evaluated at the moment of commit, not at the moment the button rendered'. Line 61: '| C-06 | No radius-clause breach against an existing confirmed booking, **unless a waiver from the constraining promoter is on file** ([17.06](../17.06-radius-clause-exclusivity.md)) | The obligation is breached the moment the second date is confirmed, not when it announces (DT-10). Radius waivers are routinely negotiated — the block must have a legitimate door | Blocked with the constraining contract named and a "request waiver" route |'. Line 277: '| D-13 | Radius-clause compliance is checked at **confirm**, not announce, with a waiver-on-file exception |'. Line 248: '- Touches **[17.06 Radius Clause & Exclusivity Tracking](../17.06-radius-clause-exclusivity.md)** — *hard permission check at confirm* (C-06, DT-10), including the waiver-on-file path. This edge did not exist before Step 5 and it is a blocking one.' Corroborated by 17.01.02-hold-ladder-priority.md:259 '| D-12 | Radius conflicts are **warned at hold time**, blocked at confirmation |' and :158 'A waiver (17.06) is required before this can confirm.' CONTRADICTED BY 17.01.03-challenge-release-expiry.md:228 '| D-15 | Radius (17.06) and routing (18) checks run before confirm-under-challenge — **warn + override, recorded**; never hard-block | DT-12. ... But radius clauses are waived routinely — hard-blocking would lose an artist a date over a conflict whose consent is obtainable, just not within 48h.' Same file :142 'On conflict: **warn + require explicit override with the conflicting show named**; the override is recorded. Not a hard block'. Same file :201 'conflicts warn-and-override with the override recorded, never hard-block.' 17.01.03:109 routes that same path through the blocking gate: 'Confirmation hands off to 17.01.04, which owns the atomic transition'. The domain CX reproduces both sides inside one section without noticing: live-booking-settlement-cx.md:31 'The radius check fires at **three moments** — publish (warn), hold (warn), confirm (hard block)' versus :371 'Confirm → check (radius conflicts warn-and-override with the override recorded; radius clauses are waived routinely, so a hard block would be wrong — [23]).'

**Why no canonical answer exists.** Radius-clause conflict at confirm is a hard block absent a waiver in 17.01.04 (owner of the confirmation gate) and an explicit never-hard-block warn+recorded-override in 17.01.03 (owner of the confirm-under-challenge path). Both are ratified numbered decisions with independent Deep Think rationale, and 17.01.03 routes its confirm through 17.01.04's gate, so both rules fire on the same commit. Resolving it decides whether the platform refuses a booking that breaches a third party's contract or permits it on record. Not fixed — owner brief below.

**Owner brief.** See [run3-owner-decision-queue.md](./run3-owner-decision-queue.md).

#### B-15 · `17-live-booking-settlement#002` — Disbursement blocks all payment where signoff releases the undisputed floor

| | |
|---|---|
| **Unit** | `17.09-settlement-reconciliation` |
| **Classification** | **MECHANICAL** |
| **Disposition** | Remediated in-run |

**Finding.** Two files in 17.09 require money to move on an unsigned, non-final settlement (the 'undisputed floor'), while the file that owns disbursement and the domain CX both state that nothing moves until both parties sign — an unmarked contradiction about when funds leave the platform.

**Evidence.** 17.09.05-settlement-signoff-variance.md:67 '| **Refuse** | Not agreed | **Undisputed floor** moves; the contested delta is held (D-09) | No — settlement stays open |'. Same file :86 'That evaluation is the **undisputed floor** — the amount neither party contests — and it is payable immediately.' :318 '| D-09 | **Refusal blocks finality, not payment** — the undisputed floor is payable immediately | ... Symmetric — an Operator refusal pays the floor too.' :297 states the requirement on the downstream file as settled: 'Touches **17.10.02 Disbursement Execution** ... **trigger dependency**: final signoff is the disbursement trigger; a **refusal releases the undisputed floor only**'. 17.09.06-settlement-audit-trail-disputes.md:267 '| D-08 | A disputed line does **not** block the undisputed remainder — the sheet has a **payable floor** and a **contested ceiling** |'; :284 'Q-03 ~~**Does the payable floor disburse on one signature or two?**~~ **RESOLVED — the floor is payable without a second signature**'. CONTRADICTED BY 17.10-live-income-payout-tax/17.10.02-disbursement-execution.md:67 '| Blocked | Settlement unsigned | Nothing moves; a proposal is not a payment |', whose Behavior (:26) begins 'Disbursement executes the split (CX-01) against whatever survives withholding (CX-03)' only after ':41 1. Settlement signs off (17.09.05); the number is final.' That file's only partial-payment concept is per-recipient, not partial-of-pool: ':101 | D-02 | Partial disbursement is a normal state | One member without a payout method must not stop the other four being paid.' And live-booking-settlement-cx.md:23 'CX-06 ... Final signoff is the disbursement trigger; the settled pool is what the split divides ... Nothing moves until both parties sign — a proposal is not a payment', repeated verbatim at :179.

**Canonical source.** 17.09-settlement-reconciliation/17.09.05-settlement-signoff-variance.md:318 — "| D-09 | **Refusal blocks finality, not payment** — the undisputed floor is payable immediately | Derivable from line-scoped disputes (17.09.06 D-02) ... Resolves Q-01. Symmetric — an Operator refusal pays the floor too." Reinforced at :67 ("**Refuse** | Not agreed | **Undisputed floor** moves; the contested delta is held (D-09) | No — settlement stays open"), :86 ("it is payable immediately"), and :297 which names the un-propagated input: "a **refusal releases the undisputed floor only** (D-09), which is a new disbursement input its `Ready`/`Partial` states do not currently carry". Corroborated by 17.09.06-settlement-audit-trail-disputes.md:267 (D-08 payable floor / contested ceiling) and :284 ("Q-03 ~~Does the payable floor disburse on one signature or two?~~ **RESOLVED — the floor is payable without a second signature**").

**Fix applied.** 17.09.05 D-09 — the ratified decision in the file that owns the sign/refuse outcome — resolves that a refusal releases the undisputed floor immediately, corroborated by 17.09.06 D-08 and its Q-03 marked RESOLVED. 17.10.02 carries no competing decision on the question (its D-01..D-04 are silent on signoff) and its States row 'Blocked | Settlement unsigned | Nothing moves' is pre-D-09 text; 17.09.05:297 itself names the gap. Propagated the canonical rule into 17.10.02 and the domain CX-06.

**Files changed.** `17-live-booking-settlement/17.10-live-income-payout-tax/17.10.02-disbursement-execution.md`, `17-live-booking-settlement/live-booking-settlement-cx.md`

#### B-16 · `18-show-production-touring#001` — `require-confirmation` rider flag has no blocking mechanism

| | |
|---|---|
| **Unit** | `18.04-riders` |
| **Classification** | **OWNER** |
| **Disposition** | Not fixed — [owner queue](./run3-owner-decision-queue.md) entry |

**Finding.** The `verification` flag — one of the three flags 18.04.01 D-04 makes mandatory on every rider item — has no mechanism anywhere in the tree, and its specified effect ('blocks the freeze even on an automatic match') is directly contradicted by 18.03.01 D-04, which says a diff `match` generates no checklist item at all.

**Evidence.** 18.04.01-technical-rider.md:50 — '| **Verification** | `trust-listing` · `require-confirmation` | Does the venue's listing data alone satisfy this, or must a human confirm? | Freeze gate (18.03.02 DT-03) |'. 18.04.01:107 — '`require-confirmation` items block the freeze even on an automatic match.' 18.04.01:134 — '| `require-confirmation` item matched automatically | Still blocks the freeze until a human at the venue confirms | "Room's data says yes — you asked for confirmation. Awaiting [venue]." |'. 18.04.01:181 — '`hard`+`unknown` and unresolved `require-confirmation` items block the freeze.' 18.04.01 D-05:68 floors EVERY power item at '`require-confirmation` on verification'. AGAINST: 18.03.01-advance-checklist.md:191 D-04 — 'A diff `match` generates **no item**. Only shortfalls, unknowns, near-matches and judgement items do'; 18.03.01:35 lists the four generating outcomes and states 'A `match` produces **no item** (D-04)'; 18.03.01 D-05/D-07 make the freeze gate 'the **hard-outstanding count** … every `hard` item not in a terminal state' over CHECKLIST items; 18.03-show-advancing-cx.md:146 R-03 — 'The freeze reads the checklist's outstanding count, not the diff's output.' 18.03.02 D-11 — 'The diff is silent and non-blocking by construction … Its only output is checklist rows and a delta notice'. Grep-verified: the strings `require-confirmation` and `trust-listing` appear ONLY in 18.04.01 — never in 18.03.01, 18.03.02 or 18.03.05 — and `verification` is not among 18.03.02 D-05's five qualifiers (`basis`, `caveats[]`, `confidence`, `severity`, `judgement-required`).

**Why no canonical answer exists.** The rider's `verification` axis (18.04.01 D-04) says a `require-confirmation` item blocks the freeze even on an automatic diff match, but the freeze gate reads the checklist's hard-outstanding count and 18.03.01 D-04 says a diff `match` generates no checklist item at all — so the blocking behaviour has no mechanism. Two numbered decisions in two owning files; wiring either way is a product call about safety vs. alert fatigue, not drift.

**Owner brief.** See [run3-owner-decision-queue.md](./run3-owner-decision-queue.md).

#### B-17 · `20-fanbase-direct-to-fan#001` — Re-download entitlement format-bound vs format-agnostic

| | |
|---|---|
| **Unit** | `20.06-fan-experience-discovery` |
| **Classification** | **MECHANICAL** |
| **Disposition** | Remediated in-run |

**Finding.** Download re-download rights are specified two incompatible ways: 20.04.03 makes the entitlement format-agnostic (buy once, download any offered format forever) and explicitly rejects the alternative, while 20.06.03 restricts re-download to the formats actually purchased.

**Evidence.** 20.04.03-digital-sales-name-your-price-bundles.md:69-70 — "the entitlement is format-agnostic (one purchase entitles all offered formats — you bought the record, not a file), and re-downloading in a different format later is free and unlimited"; D-08 (line 161) — "Download entitlement is format-agnostic and never expires | See DT-05. Buy the record, not a file; re-download any offered format forever"; DT-05 (line 130) — "❌ REJECTED — the fan buys the record, not a file. Binding the entitlement to a single format re-download is a streaming-era mistake: it means a fan who bought MP3 in 2026 and wants FLAC in 2029 has to re-buy." AGAINST: 20.06.03-fan-library-collection.md:67-68 — "Download: the fan re-downloads the original purchased formats (e.g. FLAC, WAV, MP3-320, ALAC — whatever the release offered and they bought)"; :24 Role Lens Fan — "re-downloads in the format purchased"; D-01 (line 168) — "re-downloadable indefinitely, in the purchased formats, with no expiry or count cap".

**Canonical source.** 20.04-direct-to-fan-storefront/20.04.03-digital-sales-name-your-price-bundles.md:161 — "| D-08 | Download entitlement is format-agnostic and never expires | See DT-05. Buy the record, not a file; re-download any offered format forever. Reinforces the 'you own this' promise at zero storage cost. |"; :130 DT-05 — "❌ REJECTED — the fan buys **the record**, not a file. Binding the entitlement to a single format re-download is a streaming-era mistake: it means a fan who bought MP3 in 2026 and wants FLAC in 2029 has to re-buy."; :69-70 — "the entitlement is format-agnostic (one purchase entitles all offered formats — you bought the record, not a file), and re-downloading in a different format later is free and unlimited"; :95 (Edge Cases, User Sees column) — "Library, indefinitely, all offered formats"; :140 (Cross-Cut Notes) — "Delivers to 20.06.03 Fan Library & Collection — the entitlement's permanent, format-agnostic home"

**Fix applied.** The download re-download entitlement was stated as format-bound in four places in 20.06.03 (Role Lens, governing promise, Playback & Download Depth, D-01), contradicting the owning file 20.04.03, whose DT-05 explicitly rejected format-bound re-download and whose D-08 ratified a format-agnostic entitlement. Fixed the library file to state the canonical rule and cite it.

**Files changed.** `20-fanbase-direct-to-fan/20.06-fan-experience-discovery/20.06.03-fan-library-collection.md`

#### B-18 · `root#001` — 11 of 25 cross-domain syntheses in `ideation-cx.md` are hard-truncated

| | |
|---|---|
| **Unit** | `(root)` |
| **Classification** | **MECHANICAL** |
| **Disposition** | Remediated in-run |

**Finding.** 11 of the 25 `## 3. High-Confidence Synthesis` blocks in ideation-cx.md are hard-truncated mid-word / mid-clause, and the cut content exists nowhere else in the tree.

**Evidence.** ideation-cx.md — ten `- **Synthesis**:` lines are exactly 817 characters long and one is exactly 1313, each ending mid-token: line 350 (02-03) ends "…Constraint: a co-presence edge published before its credit publishes routes around embar"; line 362 (02-05) ends "…05's delivery-acceptance commit emits a credit CLAIM (not a fact) that 02 carries as unatteste"; line 380 (02-08) ends "…two independent close prompts (08.05.04 vs 02.02.03) fire at the same instant — probable merge. Near-col"; line 404 (02-12) ends "…Trigger: the release event authoritatively lifts embar"; line 422 (02-16) ends "…relocation makes a moved venue a DIFFERENT record (D-04) and merge retires an identifier — a live". Same defect at lines 356, 368, 374, 386, 392, 398. Complete blocks for comparison: line 410 (len 660) and line 416 (len 813) both end with a full stop. The file nonetheless declares "**Status**: [DEEP]" (ideation-cx.md:5) and "Last updated: 2026-07-29" (:6). The lost text is NOT recoverable: `grep -r` over the whole ideation tree for "merge retires an identifier", "co-presence edge published before its credit", "carries as unatteste" and "Near-col" returns ideation-cx.md and nothing else; the linked source-domain file 02-credits-attribution/credits-attribution-cx.md contains none of these phrases. ideation-cx.md is the only file in the tree with more than one 817-character line (10 of them).

**Canonical source.** Not a drift between two statements of one rule — a content-regeneration item. The prior investigation (.memory/wiki/specs/audits/run3/CONFIRMED-root-001-truncated-synthesis.md:40-62) establishes that no complete version exists in any git revision including f71b1d9 (the commit that created the section), and that probes for each cut tail match no other file among the 190 CX files on disk. The regeneration is therefore grounded per-clause in the domain files rather than copied from a canonical twin. Representative anchors: 03-community-networking/community-networking-cx.md:372 "co-presence is a graph edge created BEFORE any credit exists ... must not become visible before the credit publishes (02.01.05 embargo)"; 02-credits-attribution/credits-attribution-cx.md:343 "Consumers (03, 04, 05, 06, 08) *map* rather than extend (`02.06` D-14); rights outcomes (featured-performer pay) belong to 10 not the vocabulary (D-15); gear objects belong to 13/15 (D-08)"; 16-venues-studios-spaces/16.05-curation-provenance-data-integrity/16.05.07-duplicate-detection-merge.md:328 "A credit citing the loser must resolve to the record **as of the cited date** — and reversal must not rewrite it either".

**Fix applied.** Regenerated all 11 hard-truncated `- **Synthesis**:` bullets in `## 3. High-Confidence Synthesis` of ideation-cx.md (the domain-02 pair run 02-03 through 02-16). Every cut landed inside the SECOND `||` segment of the bullet; each surviving prefix was preserved verbatim and extended from source material on disk. All 25 bullets now terminate cleanly; zero 817-character lines remain in the file.

**Files changed.** `ideation-cx.md`

---

## 4. The 116 confirmed warnings, by rubric dimension

A warning is a confirmed defect that does not force an implementer to invent product truth —
it degrades the spec without stopping it. Warnings do not block `/create-prd`.

| Rubric dimension | Warnings | Share |
|---|---|---|
| Dimension 3 — Feature Completeness | **46** | 39.7% |
| Dimension 7 — Open Question Resolution | **35** | 30.2% |
| Dimension 8 — Structural Compliance | **21** | 18.1% |
| Dimension 5 — Success Measurability | 6 | 5.2% |
| Cross-dimension (no single dimension) | 6 | 5.2% |
| Dimension 1 — Problem Clarity | 2 | 1.7% |
| Dimension 2 — Persona Specificity | 0 | — |
| Dimension 4 — Constraint Explicitness | 0 | — |
| Dimension 6 — Competitive Positioning | 0 | — |
| **Total** | **116** | **100%** |

Three dimensions carry 88.0% of the warning mass. Dimensions 2, 4 and 6 produced **zero**
confirmed warnings across all 191 units: personas, constraints and competitive positioning are
the settled parts of this tree.

**24 of the 116 were raised as blocking and downgraded during verification** — the verifier
found the quoted divergence real but non-forcing (a safe default reading existed, the gap was
tracked, or the answer sat in a sibling file). Those 24 are listed separately below.

#### Dimension 3 — Feature Completeness — 46 warnings

| ID | Unit | Finding |
|---|---|---|
| `02-credits-attribution#003` | `02-credits-attribution` | 02.01.02 D-07 and the domain CX declare a hard structural requirement that 02.06 expose a stable role family/leaf hierarchy with every leaf in exactly one family. 02.06 defines no family tier on the role axi… |
| `02-credits-attribution#004` | `02-credits-attribution` | 02.10's Producer Role Lens grants Full access and session-level AI disclosure, which contradicts its own D-04 (you disclose your own contribution only), 02.02.02's refusal of Producer writes on another party… |
| `02-credits-attribution#016` | `02.04-attestation-credit-confidence` | 02.04.01's attestation state table renders the confirmed state as a 'Verified marker', which 02.04.02 D-02 forbids and which the sub-domain flags as a liability surface rather than a copy choice. |
| `04-opportunities-casting#002` | `04-opportunities-casting (domain root)` | 04.07 specifies 'waitlisted' as a third disposition tier that goes out to applicants, while its own resolved Q-02 and the closed disposition vocabulary in 04.05.01 both forbid telling an applicant a waitlist… |
| `04-opportunities-casting#016` | `04.03-submission-audition` | The type-scoped free-text question ceiling names a type that does not exist in the closed taxonomy and leaves five of the twelve real types without a ceiling. |
| `04-opportunities-casting#017` | `04.03-submission-audition` | Blind mode is declared type-scoped but the per-type property table that governs every other type-scoped rule carries no blind-mode column, and only one of twelve types is assigned a value. |
| `04-opportunities-casting#023` | `04.04-triage-shortlist-decisioning` | 04.04.02 permits the poster to signal 'still in consideration' to a shortlisted applicant; 04.04.01 D-06 forbids telling an applicant a state at all, naming that exact signal as a hope-raising rank leak. |
| `04-opportunities-casting#024` | `04.04-triage-shortlist-decisioning` | The queue collapses a candidate to one card per identity and never addresses the two-candidacy case that its siblings require to render as two. |
| `04-opportunities-casting#027` | `04.05-outcome-response-handoff` | The disposition vocabulary is presented as complete and contains no value for a candidate declining a live offer, although declining is a first-class act with its own state and reason model in 04.04.03. |
| `05-services-marketplace#008` | `05 (domain root)` | The domain CX file resolves the capacity-vs-immutable-offer collision by making the concurrency ceiling block quote issuance; both owning features specify that it does not — it binds ordering only, and issua… |
| `05-services-marketplace#011` | `05.03-engagement-lifecycle` | Whether a credit is emitted at milestone acceptance is decided in both directions across sibling features, and each cites the other as its authority. Under one reading a cancelled staged engagement emits dup… |
| `05-services-marketplace#012` | `05.03-engagement-lifecycle` | The engagement state machine's trigger for `Closed` is the recall window expiring, while the same file's happy path and the recall feature both put the engagement in `Closed` with the window still open — and… |
| `05-services-marketplace#017` | `05.05-multi-party-supply` | Mid-chain cancellation settlement across a bundle's sellers, and the terminal 'Broken' state for a seller exiting mid-chain, are both left [PENDING] with no owner and no open question covering them. |
| `05-services-marketplace#020` | `05.07-custodial-physical-services` | A defect warranty on custodial labour is named as a trade norm with a range instead of a platform behaviour, and nothing decides whether the platform implements one or for how long. |
| `06-education-lessons-mentorship#005` | `06-education-lessons-mentorship (domain root)` | Whether a WeJammin certificate may render on the same surface as verified credits is answered both ways, and 06.08 cites as its authority the very rejected-pair row that permits what 06.08 forbids. |
| `06-education-lessons-mentorship#015` | `06.01-lesson-booking-packages-delivery` | Two sibling features define a series state with the same name, 'At Risk', on different triggers, and the ledger owner claims ownership of the timing while the calendar owner fixes the trigger at zero balance. |
| `07-music-projects-collaboration#003` | `07.05-review-feedback-approval` | The post-revocation grace for an in-flight comment is specified as 60 s in one [DEEP] feature and 120 s in its sibling's decision, unmarked in both. |
| `07-music-projects-collaboration#009` | `07.02-songwriting-composition-workspace` | The chart reading surface — which the feature calls its own centre of gravity — has no specified behaviour, and its only tracking marker has no owner and points at a stage that has already run. |
| `07-music-projects-collaboration#010` | `07.03-contributors-access-confidentiality` | The vault's sensitivity-class enumeration and role x class grant matrix omit `takes`, which a sibling decision requires and which the domain CX asserts as settled behaviour. |
| `08-realtime-jamming-remote-sessions#001` | `08 (domain root)` | The domain index's Decision Log still asserts that Overdub carries the provenance 'intact' / that the attendance record 'ships with any session mechanism' — the exact claim 08.07 D-04 and domain CX-07 declar… |
| `08-realtime-jamming-remote-sessions#003` | `08 (domain root)` | The provenance-grade enum — a value domains 02 and 09 consume — has three mutually inconsistent definitions across the files that define, own and export it: three values in 08.07, two values in the owning re… |
| `08-realtime-jamming-remote-sessions#021` | `08.05-session-capture-recall` | The sub-domain CX still describes the presence-to-contribution relationship as unresolved and as the substance of index Q-01, which has since been resolved with a three-component bridge. |
| `08-realtime-jamming-remote-sessions#022` | `08.05-session-capture-recall` | 08.05.04's Cross-Cut Notes still assert overdub 'works identically', the precise wording 08.07 DT-08 and domain CX-07 declare wrong, contradicting the corrected edge row in the same file and misidentifying t… |
| `09-rights-ownership#001` | `09.01-rights-registry` | A lineage child recording (`edit-of` / `remaster-of` / `alternate-take-of`) is specified as sharing its parent's consented master ledger by reference, but the ledger feature specifies that a ledger's rows ar… |
| `09-rights-ownership#015` | `09.04-rights-conflicts-disputes` | A moral-rights objection is specified as routing into this sub-domain by the moral-rights feature and as bypassing it entirely by this sub-domain's own rejected-pair rationale. |
| `09-rights-ownership#019` | `09.06-rights-evidence-public-record` | Trust level is declared the public lookup's first-class visible differentiator, but the tree defines two different three-value vocabularies for it and the domain cross-cut asserts they are the same attribute… |
| `12-release-distribution#002` | `12.03-dsp-store-territory-management` | A partner-suspension `Held` has no state or mapping in the per-store status board, which owns the status object — two sibling features specify `Held` with mandated artist-facing copy, and 12.03.02 resolves t… |
| `15-gear-registry-ownership#001` | `15.02-stolen-gear-registry-recovery` | Whether point-of-sale screening produces a match on a partial identity key is stated three mutually incompatible ways — within one file and across two — so an implementer must invent the matching rule that g… |
| `15-gear-registry-ownership#006` | `15-gear-registry-ownership` | A disputed gear-discography link is specified both as suppressed from public surfaces and as rendered honestly-as-disputed on the provenance chain; the two cannot both hold and neither is marked. |
| `16-venues-studios-spaces#001` | `16.01-place-records-rooms` | 16.01.05's States table lets a corroborated community report plus a timeout auto-flip a record to `permanently closed`, which the same file's Edge Cases and D-06 explicitly forbid. |
| `16-venues-studios-spaces#010` | `16.01-place-records-rooms` | 16.01.01's happy path claims a community-created record can be claimed by anchoring to its pre-claim public phone number, which 16.05.02's anchor rule makes impossible because every human-supplied value is e… |
| `16-venues-studios-spaces#012` | `16.02-venue-technical-specification` | 16.02.02 asserts three times that room exclusion is binary and cannot express "co-bookable but degraded", contradicting 16.01.02 D-06's ratified `contends` edge type, which is exemplified with the identical … |
| `16-venues-studios-spaces#013` | `16.02-venue-technical-specification` | 16.02.01 says a subdivided room is retired, and points at the wrong question; 16.01.02, which owns the room lifecycle, says subdivision supersedes the room, and `Retired` is a different, reversible state. |
| `17-live-booking-settlement#003` | `17.02-offers-negotiation` | The rule for what a new offer version does to existing approvals is stated unconditionally (every counter invalidates every approval) in the file that owns the approval chain, and conditionally (approvals ca… |
| `17-live-booking-settlement#004` | `17-live-booking-settlement (domain root)` | 17.14 states as normative behaviour an announce precondition ('supports locked') that 17.01.04 — the file that owns the announce gate — explicitly rejects and replaces with lineup honesty plus TBA, and 17.14… |
| `17-live-booking-settlement#013` | `17.01-availability-holds-confirmation` | The canonical double-booking precondition C-05 is stated at date grain in its own row and at slot grain in the same file's resolution note, and no file defines how slots compare across two different venues —… |
| `18-show-production-touring#003` | `18.04-riders` | 18.04.02's illustrative venue-facing payload prints exactly the count-of-one detail its own D-05 / DT-05 / edge case forbid. |
| `19-ticketing-box-office#010` | `19.04-door-scanning-access-control` | 19.04.03 offers three per-show re-entry policies including re-scan, while its own D-01 states re-entry is via physical token and the ticket is strictly use-once; 19.04.01's verdict states then treat a re-ent… |
| `19-ticketing-box-office#012` | `19.05-box-office-counts-drops` | The canonical count omits the `carted` bucket entirely and defines `remaining` by a formula that contradicts the manifest invariant, so the two normative definitions of the same counter differ by the whole c… |
| `20-fanbase-direct-to-fan#002` | `20.04-direct-to-fan-storefront` | The payout-plan version that governs a sale is bound at two different payment-lifecycle events in two files dated the same day: at payment settlement in 20.04.03 and at payment authorization in 20.04.04. |
| `20-fanbase-direct-to-fan#003` | `.` | The demand map is specified as both floored and unfloored for k-anonymity: 20.07 makes a k-anonymity floor on the map a locked decision, while the domain CX and 20.02.01 both state that aggregate/counting su… |
| `20-fanbase-direct-to-fan#014` | `20.04-direct-to-fan-storefront` | The 10% rolling reserve is described as taken from each disbursement in the parameter table and from each accrual in the happy path, which changes the balance the payee sees. |
| `20-fanbase-direct-to-fan#015` | `20.04-direct-to-fan-storefront` | The fund-segregation policy for money-now-object-later sales is scoped to pre-order *bundles* everywhere it is stated, leaving a standalone physical-record pre-order — which the catalogue explicitly supports… |
| `20-fanbase-direct-to-fan#017` | `20.05-memberships-patronage-campaigns` | Physical-class membership benefits are gated on a fulfilment path 'routed to 20.05.05', but 20.05.05 is entirely campaign-backer scoped and specifies no membership fulfilment surface, no address collection, … |
| `23-career-finance-business#003` | `23.07-budgeting-project-tour-pl` | 23.07.03 enumerates the band distribution rule's permitted shapes twice, with different members, both times as a closed set — its Behavior says Equal / Weighted / Per-role, while its own resolved Q-02 and th… |
| `24-trust-safety-disputes#001` | `24.01-reporting-moderation` | The factual-rights-dispute reason family is specified as bypassing the general moderation queue entirely AND as an S2 tier routed into a skill-scoped queue inside that same queue, with `credit-dispute` named… |

#### Dimension 7 — Open Question Resolution — 35 warnings

| ID | Unit | Finding |
|---|---|---|
| `01-identity-profiles-organizations#004` | `01-identity-profiles-organizations` | Two cross-cut gaps in the domain CX file are deferred only to `/ideate-validate`, a stage that completed on 2026-07-18, and are covered by no live tracked question — so nothing downstream will pick them up. |
| `01-identity-profiles-organizations#005` | `01.01-person-identity-roles` | Two gaps in this unit's CX file are deferred only to Step 5, which completed 2026-07-18, and are covered by no live tracked question. |
| `01-identity-profiles-organizations#007` | `01.03-membership-representation-mandate` | This unit's CX file names an unspecified representation-expiry notification behaviour and an unconfirmed value-ceiling union rule, both routed only to the completed Step 5 with no live tracked question — and… |
| `01-identity-profiles-organizations#008` | `01.05-profile-claiming-verification` | Two contest-interaction gaps in this unit's CX file are routed only to the completed Step 5 and are covered by no live tracked question, while every other Step-5 marker in the same file was in fact resolved … |
| `02-credits-attribution#014` | `02.03-claiming-cold-start-seeding` | 02.03.03's years-later contest case states that accumulated downstream effects 'must unwind' and then leaves the behaviour as '[PENDING — Step 5]' — no owner, and a target stage that has already completed. |
| `03-community-networking#006` | `03.01-connections-follows-endorsements` | Deferred behaviour in 03.01 is marked with bare `[PENDING]` tokens carrying neither an owner nor a deferral stage, including the expiry period for pending connection requests — which the same file makes a fi… |
| `04-opportunities-casting#005` | `04-opportunities-casting (domain root)` | Two edge cases in this unit are deferred to a pipeline stage the same files record as already run and closed, with no owner named - so the deferral mechanism has no destination and no accountable party. |
| `04-opportunities-casting#010` | `04.01-opportunity-posting-targeting` | The blocked-invitee case is marked pending against a stage that has run and closed, has no owner, and is covered by none of the file's three open questions - so a cascade behaviour is genuinely undefined and… |
| `04-opportunities-casting#013` | `04.02-discovery-matching-alerts` | Three of this unit's CX synthesis slots are left as bare pending markers pointed at a stage that has run and closed, with no owner - and one of them has no answer anywhere in the tree. |
| `04-opportunities-casting#014` | `04.02-discovery-matching-alerts` | 04.02.03 declares a Stale state whose entire user-visible behaviour is a pending marker aimed at a closed stage, with no owner and no covering open question - and the undefined behaviour changes who is offer… |
| `04-opportunities-casting#018` | `04.03-submission-audition` | Five of this unit's CX synthesis slots are blank pending markers aimed at a closed stage with no owner, including three of the five slots on the cross-cut that a sibling's resolved question cites as its own … |
| `05-services-marketplace#009` | `05 (domain root)` | A money-affecting escrow rule is left with a bare [PENDING] carrying neither an owner nor a deferral target. |
| `05-services-marketplace#019` | `05.06-rights-warranties-transfer` | Whether an elected points participation survives a re-recording of the work is marked [PENDING] with no owner, no deferral target and no covering open question. |
| `05-services-marketplace#021` | `05.07-custodial-physical-services` | Two behaviours are left with bare [PENDING] markers that carry no owner and no deferral target, and no open question in the unit covers either. |
| `06-education-lessons-mentorship#008` | `06-education-lessons-mentorship (domain root)` | 06.06 carries four in-body deferrals to the completed /ideate-discover Step 5 run, one of which is the behaviour of a state the file declares, and is covered by none of its four open questions. |
| `06-education-lessons-mentorship#009` | `06-education-lessons-mentorship (domain root)` | Two domain cross-cuts hold their role scoping open with a bare [PENDING] marker carrying neither an owner nor a deferral target, and two more point at the completed /ideate-discover Step 5 run. |
| `07-music-projects-collaboration#020` | `07.01-song-release-production-board` | The sub-domain CX carries two unowned `[PENDING]` markers pointing at a stage that has completed; one leaves a Role scoping block unwritten on a question the index records as resolved, the other leaves real … |
| `09-rights-ownership#008` | `09.01-rights-registry` | The sub-domain cross-cut defers a substantive open item to `/ideate-discover Step 5`, a pipeline stage that has already completed, so the deferral can never be honoured; a second obligation is flagged 'for S… |
| `09-rights-ownership#011` | `09.02-split-capture-agreements` | The sub-domain cross-cut defers CX-05's synthesis to `/ideate-discover Step 5`, a stage that has already completed, so the deferral cannot be honoured. |
| `09-rights-ownership#013` | `09.03-chain-of-title-lifecycle` | Four of the sub-domain's six cross-cut pairs have no synthesis and are deferred to `/ideate-discover Step 5`, a stage that has already completed. |
| `09-rights-ownership#018` | `09.05-ai-voice-likeness-consent` | The sub-domain cross-cut defers CX-03 and CX-04 synthesis and one live CX-02 question to `/ideate-discover Step 5`, a stage that has already completed. |
| `09-rights-ownership#020` | `09.06-rights-evidence-public-record` | The sub-domain cross-cut defers CX-03 and CX-04 synthesis and one live CX-02 question to `/ideate-discover Step 5`, a stage that has already completed. |
| `10-royalties-collections#008` | `10.04-disbursement-payee-statements` | Three product decisions in this unit are parked against a pipeline stage that has already completed, with no owner — a marker class the tree elsewhere recognises as expired and requiring promotion. |
| `13-gear-marketplace#014` | `13.09-tradein-consignment` | Two inline deferral markers in 13.09 carry no owner, and one carries no target at all; neither is covered by any tracked question in the unit, unlike the unit's other markers which are. |
| `14-digital-goods-marketplace#013` | `14-digital-goods-marketplace (domain root)` | Q-12 is marked RESOLVED while carrying a corrective action against another document, with no owner and no deferral target — so the participant-list defect it names has nobody to fix it. The defect is real: t… |
| `15-gear-registry-ownership#012` | `15.05-valuation-appraisal-insurance` | Four inline deferrals in this unit point at a completed pipeline stage, two of them on the payout/title question the same file's Q-01 records as settled. |
| `15-gear-registry-ownership#014` | `15.06-rig-profile-compatibility` | A cross-cut synthesis slot carries no content at all — only a deferral to a completed stage — and six further inline markers defer to that same finished stage for items the file's own question rows were expl… |
| `16-venues-studios-spaces#016` | `16.05-curation-provenance-data-integrity` | 16.05.03 defers four live behaviours to `[PENDING — Step 5]`, a stage that has completed; one of them — arbitration between two contradicting equal-class community suggestions — is covered by no open questio… |
| `17-live-booking-settlement#012` | `17-live-booking-settlement (domain root)` | 17.07 carries inline PENDING markers asserting that two matters are undecided, and points them at Q-01 and Q-03 — both of which its own Open Questions table records as RESOLVED. |
| `19-ticketing-box-office#008` | `19.03-guest-list-comps` | A separation-of-duties question over the certified statement is left with a bare marker carrying no owner and no deferral target, and two leaf questions are deferred to the completed MoSCoW stage. |
| `19-ticketing-box-office#017` | `19.08-vip-packages-meet-and-greet` | An edge-case row still carries a bare unowned marker for a fairness question that the same file's Q-02 records as resolved by the domain's ratified capacity-reduction ladder. |
| `19-ticketing-box-office#018` | `19.09-ticketing-fraud-bot-resale-controls` | Two money- and statute-bearing edge cases are left with bare markers carrying no owner and no deferral target, and neither is covered by any Open Question in this unit or in the sibling features they name. |
| `20-fanbase-direct-to-fan#010` | `20.02-segmentation-superfan-intelligence` | 20.02.02 leaves two edge-case outcomes as bare [PENDING] with no owner and no deferral target, although that same file's decision table already fixes both. |
| `20-fanbase-direct-to-fan#018` | `20.06-fan-experience-discovery` | 20.06.02 has two different open questions both numbered Q-04 — one an open [OWNER] radius decision, one resolved — and two decisions each claiming to reference or resolve 'Q-04', so the identifier is unusabl… |
| `24-trust-safety-disputes#014` | `24.07-identity-abuse-ownership-disputes` | The sub-domain's deferral tracking is systematically stale: four markers defer to questions recorded as resolved, three carry no owner and no target, and 24.07.03 has zero unresolved Open Questions while lea… |

#### Dimension 8 — Structural Compliance — 21 warnings

| ID | Unit | Finding |
|---|---|---|
| `03-community-networking#015` | `03-community-networking (domain root)` | The domain's structure map carries four mutually inconsistent depth-status claims: the Children table's own preamble contradicts the table, and two sub-domain indexes and one feature file disagree with the s… |
| `04-opportunities-casting#004` | `04-opportunities-casting (domain root)` | The domain index's own totals disagree with the parent structure map and with the tree on disk, on both the leaf-feature count and the Deep Think count. |
| `07-music-projects-collaboration#017` | `07.05-review-feedback-approval` | 07.05.01's Behavior section cites decision numbers that resolve to different decisions in its own Decisions table — five instances. |
| `08-realtime-jamming-remote-sessions#007` | `08 (domain root)` | The domain index's Children preamble contradicts its own table, the child files' own headers, and its own record that MoSCoW has completed; its child-count sentence also double-counts the three domain-level … |
| `09-rights-ownership#021` | `09-rights-ownership (domain root)` | The domain index's Children table and its narrative both declare every node `[SURFACE]`, but on disk every sub-domain index declares `[BREADTH]` and the 26 leaf features declare `[DEEP]`, `[PARTIAL]` or `[SU… |
| `11-music-licensing#006` | `.` | The domain index's Children table states every child is `[SURFACE]` and that only a breadth pass has run; on disk eight leaves are `[DEEP]`, seventeen are `[PARTIAL]`, all eight sub-domain indexes are `[BREA… |
| `13-gear-marketplace#002` | `13-gear-marketplace (root)` | gear-marketplace-cx.md gives CX-M11 two different mechanism identities eight lines apart, and routes message-to-disclosure promotion to the wrong cross-cut: messaging is CX-M06 everywhere else in the tree, i… |
| `13-gear-marketplace#003` | `13.02-condition-originality-disclosure` | 13.02.02 declares a dependency on CX-M11 for messaging, but CX-M11 is Real-Time Rooms, Presence & Audio Transport; the messaging mechanism this feature needs is CX-M06. |
| `15-gear-registry-ownership#004` | `15-gear-registry-ownership` | The domain index's structural summary contradicts the tree it maps and its own MoSCoW table on three separate counts, all unmarked. |
| `15-gear-registry-ownership#005` | `15-gear-registry-ownership` | Seven `#CX-NN` anchors in this unit resolve to unrelated cross-cuts in the current domain CX numbering, sending a reader to the wrong relationship. |
| `15-gear-registry-ownership#016` | `15.07-studio-backline-asset-register` | Three domain-cross-cut anchors in this unit resolve to unrelated pairs, including the register→oracle dependency the unit calls decisive. |
| `18-show-production-touring#006` | `18.03-show-advancing` | Tool-serialisation residue is committed inside the body of 18.03.02 — the domain's largest and one of its five Must files — between the Open Questions table and the auto-generated Related Specs block. |
| `18-show-production-touring#007` | `18.07-show-day-schedule` | The same tool-serialisation residue is committed inside the body of 18.07.01, also a Must file. |
| `18-show-production-touring#017` | `18-show-production-touring (domain root)` | Five relative cross-reference paths in the domain do not resolve on disk, and the domain index's Children status column is stale against every child file it describes. |
| `19-ticketing-box-office#001` | `19-ticketing-box-office (domain root)` | The domain index's one-line description of its own cross-cut file is stale on all three counts, and the 19.12 Role Lens grants an access level the domain Role Matrix does not. |
| `19-ticketing-box-office#019` | `19.09-ticketing-fraud-bot-resale-controls` | Three places in this unit present refund-on-a-transferred-ticket as an open tangle and cite a question number that now holds a different question, when the case is decided by 19.06.01 D-10. |
| `20-fanbase-direct-to-fan#019` | `.` | The domain CX status header states 13 High and 1 Medium confidence pairs; the cross-cut map contains 12 High and 2 Medium. |
| `21-promotion-marketing#004` | `21-promotion-marketing` | The domain index's Children table asserts every child is `[SURFACE]` and 'not yet deepened'; seven of nine rows disagree with the files on disk, and the same document's D-08 contradicts its own table for 21.07. |
| `21-promotion-marketing#005` | `21-promotion-marketing` | The domain Role Matrix grants the Producer read-only access across 21.01 and explains that choice explicitly, but 21.01.02 grants the Producer write access (mark-final, flag-recall) that its own happy path r… |
| `meta#005` | `meta` | The index and D-27 state that this file holds 52 cross-cut mechanisms and 76 features; the file actually holds 54 mechanisms and 83 features, with no reconciliation on either side. |
| `meta#006` | `meta` | competitive-landscape.md and constraints.md each self-declare `[DEEP]` in their status header while the ideation-index Key Files table declares both `[PARTIAL]`, with no marker on either side saying which is… |

#### Dimension 5 — Success Measurability — 6 warnings

| ID | Unit | Finding |
|---|---|---|
| `04-opportunities-casting#009` | `04.01-opportunity-posting-targeting` | The trigger for the 'filled elsewhere' prompt - the mechanism the domain's stated beachhead depends on - is a threshold with no value for any of the twelve types, and no tracked question asks for one. |
| `04-opportunities-casting#028` | `04.05-outcome-response-handoff` | The credit trigger's fire time is defined only relative to a scheduled end, which four of the nine handoff rows do not have - including both handoff targets that exist at launch. |
| `07-music-projects-collaboration#002` | `07.06-sessions-documentation-recall` | 07.06.01's own auto-close, resume-merge and reopen windows cannot all hold; one edge case is arithmetically impossible. |
| `07-music-projects-collaboration#022` | `07.04-audio-version-control-lineage` | The change-summary edit window carries an unbounded owner override with no range and an ambiguous "Owner", on the exact surface the file identifies as its forgery vector. |
| `18-show-production-touring#015` | `18-show-production-touring (domain root)` | 18.18 states two behavioural deadlines as literal 'N days' with no value, no range and no tracked question — while the file's third window is correctly marked [PENDING]. |
| `22-analytics-market-intelligence#002` | `22.01-source-connections-ingestion` | Two files give different numeric thresholds and different state names for the same freshness classification of the same timestamp, with no marker on either. |

#### Dimension 1 — Problem Clarity — 2 warnings

| ID | Unit | Finding |
|---|---|---|
| `02-credits-attribution#007` | `02.01-credit-graph-discography` | Billing/display order is declared a ledger property asserted by 'the work owner', but the term is never defined, the same file also attributes the order to the Producer, and no default is specified for a led… |
| `05-services-marketplace#013` | `05.03-engagement-lifecycle` | Two [DEEP] files specify different, incompatible nudge schedules for the same requirements-gate stall, and the second calls its day-7 notice the 'first nudge'. |

#### Cross-dimension (no single rubric dimension) — 6 warnings

| ID | Unit | Finding |
|---|---|---|
| `01-identity-profiles-organizations#012` | `01.05-profile-claiming-verification` | A shadow party's name may be up to 120 characters and D-13 requires that name to become an alias on claim, but an alias display name is capped at 100 characters — leaving a 20-character band in which a legal… |
| `10-royalties-collections#001` | `10.02-statement-ingestion-normalization` | The reconciliation tolerance formula and the worked example that defines its intent disagree by 13x, so the domain's only hard oracle has two incompatible definitions of 'close enough'. |
| `10-royalties-collections#006` | `10.03-calculation-recoupment` | 10.03.01 D-14 routes split-shortfall residuals into 10.02.05, whose reason taxonomy is declared closed and contains no code for them, and whose unit of record is the source identity rather than a fraction of… |
| `10-royalties-collections#013` | `10.01-society-registration-delivery` | 10.01.06's render states and registration lifecycle disagree about whether a credit with no ISRC appears in the list at all. |
| `15-gear-registry-ownership#013` | `15.06-rig-profile-compatibility` | Whether an outgoing spec sheet discloses gear the band holds but does not own is unspecified, and its only marker points at a completed stage — no question row in the tree carries it. |
| `root#004` | `(root)` | domain-map-proposal.md still carries "DAW & Desktop Bridge" as a ratified cross-cutting system with no marker, while D-70 in the same directory's index prohibits any locally-installed client. |

#### Of these, 24 were raised as blocking and downgraded on verification

| ID | Unit | Why it was downgraded |
|---|---|---|
| `02-credits-attribution#003` | `02-credits-attribution` | Verified on both sides. 02.01.02:155 (D-07) and :134 place a 'hard requirement on 02.06: a stable family/leaf hierarchy, every leaf in exactly one family', and credits-attribution-cx.md:21/:138 (CX-06) repeat it. 02.06 does not deliver it: 02.06:44 gives th… |
| `02-credits-attribution#004` | `02-credits-attribution` | Quotes verified at 02.10:19 ('Producer \| Full \| Discloses at the session level and per contribution'), 02.10:122 (D-04 'You disclose your own contribution only'), 02.02.02:109 (Producer write on another party's disclosure axis 'Refused ... Disclosure cont… |
| `04-opportunities-casting#002` | `04-opportunities-casting (domain root)` | Quotes verified: 04.07-open-calls-festival-showcase-competition.md:35 'Outcome \| Won / not selected \| **Tiered** — accepted, waitlisted, rejected', :45 '5. Tiered dispositions go out — accepted, waitlisted, rejected. All of them (04.05.01).' 04.05.01-disp… |
| `05-services-marketplace#008` | `05 (domain root)` | Quotes verified. services-marketplace-cx.md:137 'issuance of a new quote is what the ceiling blocks. Failure surfaces at issuance ("you're at capacity")' imposes a hard block that neither owning feature carries: 05.01.07-seller-capacity-queue-intake-limits.… |
| `05-services-marketplace#011` | `05.03-engagement-lifecycle` | Quotes verified. 05.03.02-milestones-staged-deliverables.md:107 D-06, :36 and :73 all emit a credit at milestone acceptance, and 05.06.03-rights-transfer-split-execution.md:59 and :131 agree. 05.03.05-cancellation-abandonment-kill-fee.md:274 D-06 asserts th… |
| `05-services-marketplace#012` | `05.03-engagement-lifecycle` | Verified. 05.03.01-order-lifecycle-requirements-gating.md:157 gives Closed the trigger 'Support/recall window expired (05.03.06)', while :101 in the same file has 'Engagement enters Closed, with the support/recall window still open', and 05.03.06-post-deliv… |
| `07-music-projects-collaboration#003` | `07.05-review-feedback-approval` | Verified verbatim on both sides and unmarked. 07.05.01-timestamped-waveform-review.md:204 grants 'a post submitted within **60 s of revocation**', restated at :268 ('the 60 s post-revocation grace'), while the owning feature says 120 s in three places: 07.0… |
| `07-music-projects-collaboration#009` | `07.02-songwriting-composition-workspace` | The marker is verified verbatim at 07.02.03-chord-arrangement-chart-workspace.md:58 with an empty Owner column and a target stage the same file twice records as complete (:103 Q-02 and :104 Q-03, both '`/ideate-discover` Step 5 has run'). That is malformed … |
| `08-realtime-jamming-remote-sessions#001` | `08 (domain root)` | Quotes verified verbatim. realtime-jamming-remote-sessions-index.md:122 D-05 does read 'Overdub also runs on the locked stack and carries the provenance intact', header :5-6 is '[BREADTH] / Last updated: 2026-07-16', while realtime-jamming-remote-sessions-c… |
| `08-realtime-jamming-remote-sessions#003` | `08 (domain root)` | All three loci verified. 08.07-overdub-mode.md:172-176 presents a three-row table headed 'Grade' whose third row is 'Counter-attested', and D-04 at :353 repeats 'The record states its own basis (`delivered-by` / `observed-playing` / `counter-attested`)'. Th… |
| `09-rights-ownership#001` | `09.01-rights-registry` | Quotes verify verbatim. 09.01.01:91-92 and D-07 (:356) state edit-of/remaster-of/alternate-take-of inherit the parent's consented master ledger by reference; 09.01.02:35-36 attaches a ledger to exactly one rights object, :139-140 opens a fresh unallocated l… |
| `09-rights-ownership#019` | `09.06-rights-evidence-public-record` | Quotes verify. 09.06.04:50-51 equates the lookup's trust level with '[09.03.01] D-01', whose enum at 09.03.01:100 is `platform-witnessed`/`evidence-attached`/`asserted`; rights-ownership-cx.md:179-181 CX-07 also calls it 'Trust level ... defined by the chai… |
| `10-royalties-collections#001` | `10.02-statement-ingestion-normalization` | Quotes verified verbatim. 10.02.02:47 formula `0.5 × 10^-q + n × 0.5 × 10^-p` with p=q=2, n=12 yields £0.065, but :50 states £0.005 and 'a penny out is a real failure'. The rationale prose is also self-inconsistent: :53 says a fixed £0.01 is 'far too loose … |
| `12-release-distribution#002` | `12.03-dsp-store-territory-management` | Quotes verify exactly. 12.03.02-per-store-delivery-status.md:44-55 is a closed board vocabulary with no Held; :110 resolves the sibling case by name ('Transport failure is not a state here — it is 12.02.03's Failed and stays Sent'); 12.03.02:62-74 + 12.03-d… |
| `15-gear-registry-ownership#001` | `15.02-stolen-gear-registry-recovery` | Quotes verify verbatim. 15.02.02-point-of-sale-serial-screening.md:67 States row reads "\| Partial \| Identity partially resolved (no era, no serial) \| "Limited check — we matched on maker and model only" \|" while the same file's Edge Cases row :54 give… |
| `16-venues-studios-spaces#001` | `16.01-place-records-rooms` | Quote confirmed verbatim. 16.01.05-place-status-at-risk-signalling.md:72 States row reads '\| Permanently closed \| Operator sets, or corroborated + timeout \| Read-only historical record; still linked from past gigs \|'. The same file at :59 says the corro… |
| `17-live-booking-settlement#003` | `17.02-offers-negotiation` | Quotes verified. 17.02.02-counteroffer-thread-versions.md:70-71 and :270 (D-05) make carry-forward conditional ('iff the new version is not worse for the approver on any term') with a per-change polarity table at :80-86; 17.02.03-offer-approval-chain.md:68 … |
| `17-live-booking-settlement#004` | `17-live-booking-settlement (domain root)` | Substantively verified (the evidence adds bold markup the source does not carry, but the sentence is present). 17.14-bill-construction-support-slots.md:59 'Announce is blocked — supports-locked is a precondition', with :74, :75 and :89 repeating it, versus … |
| `19-ticketing-box-office#012` | `19.05-box-office-counts-drops` | Both formulas verify verbatim and they genuinely differ. 19.05.01-live-count-manifest-state.md:36 defines 'Remaining \| Sellable right now (= capacity − killed − held − paid − comp)' and its counter table at :27-36 has no `carted` row at all, while 19.01.02… |
| `20-fanbase-direct-to-fan#002` | `20.04-direct-to-fan-storefront` | Quotes verbatim. 20.04.03:108 'The payout plan version is bound at payment settlement, not at add-to-cart'; 20.04.04:99 'Split applied at payment authorization against the plan version live at that instant', repeated at :115, :120, :121. Authorization and c… |
| `20-fanbase-direct-to-fan#003` | `.` | Quotes verbatim: 20.07:110 D-05 'k-anonymity floor on the map'; :69 same, 'Ties to 20.02.01 DT-03'; fanbase-direct-to-fan-cx.md:255 CX-10 §3 'aggregate geo-density is unfloored map data'; :55 CX-01 §3 'counting/record-view is unfloored'; 20.02.01:99 DT-03 '… |
| `22-analytics-market-intelligence#002` | `22.01-source-connections-ingestion` | Both quotes verify verbatim. 22.01.01-dsp-account-connection-sync.md:49-51 emits 'healthy when last_successful_sync < 26h, stale at 26h-50h'; 22.01.03-ingestion-health-gaps-freshness.md:49 fixes cadence at 'DSP daily-batch ~24h' and :54-55 define 'fresh' at… |
| `23-career-finance-business#003` | `23.07-budgeting-project-tour-pl` | Verified on both sides and genuinely divergent. 23.07.03-band-treasury-member-distribution.md:29-32 states a closed set — 'one of three shapes … Equal / Weighted / Per-role'. The owning spec 01.04.03-treasury-mandate.md:25 states a different closed set — 'T… |
| `24-trust-safety-disputes#001` | `24.01-reporting-moderation` | All quotes verified verbatim: 24.01.01-report-intake-notice-and-action.md:36-38 ('Three reason families **bypass the general moderation queue entirely** ... factual rights disputes (→ domains 02/09, not a policy question)'), 24.01-reporting-moderation-cx.md… |

---

## 5. Per-domain coverage and score

| Domain | Units | Files | Raw | Refuted | Blocking | Warning | Points | Applicable | Raw ambiguity |
|---|---|---|---|---|---|---|---|---|---|
| `(root)` | 1 | 4 | 7 | 5 | 1 | 1 | 2.5 | 8 | 31.3% |
| `01-identity-profiles-organizations` | 7 | 38 | 14 | 9 | 0 | 5 | 8.5 | 44 | 19.3% |
| `02-credits-attribution` | 5 | 33 | 18 | 13 | 0 | 5 | 4.5 | 40 | 11.3% |
| `03-community-networking` | 8 | 45 | 17 | 15 | 0 | 2 | 9.5 | 40 | 23.8% |
| `04-opportunities-casting` | 6 | 35 | 28 | 9 | **5** | 14 | 7.5 | 38 | 19.7% |
| `05-services-marketplace` | 8 | 48 | 21 | 9 | **3** | 9 | 8.0 | 41 | 19.5% |
| `06-education-lessons-mentorship` | 5 | 33 | 19 | 14 | **1** | 4 | 5.0 | 32 | 15.6% |
| `07-music-projects-collaboration` | 10 | 57 | 24 | 16 | **1** | 7 | 11.0 | 60 | 18.3% |
| `08-realtime-jamming-remote-sessions` | 6 | 32 | 23 | 18 | 0 | 5 | 8.0 | 45 | 17.8% |
| `09-rights-ownership` | 7 | 40 | 21 | 10 | **2** | 9 | 7.0 | 42 | 16.7% |
| `10-royalties-collections` | 6 | 40 | 17 | 13 | 0 | 4 | 6.0 | 31 | 19.4% |
| `11-music-licensing` | 9 | 52 | 6 | 5 | 0 | 1 | 3.0 | 46 | 6.5% |
| `12-release-distribution` | 7 | 39 | 17 | 16 | 0 | 1 | 6.5 | 50 | 13.0% |
| `13-gear-marketplace` | 11 | 65 | 15 | 12 | 0 | 3 | 7.5 | 67 | 11.2% |
| `14-digital-goods-marketplace` | 11 | 64 | 14 | 12 | **1** | 1 | 9.5 | 57 | 16.7% |
| `15-gear-registry-ownership` | 6 | 36 | 16 | 8 | 0 | 8 | 5.0 | 37 | 13.5% |
| `16-venues-studios-spaces` | 6 | 47 | 17 | 12 | 0 | 5 | 9.5 | 36 | 26.4% |
| `17-live-booking-settlement` | 9 | 55 | 16 | 10 | **2** | 4 | 10.5 | 46 | 22.8% |
| `18-show-production-touring` | 12 | 70 | 18 | 12 | **1** | 5 | 8.0 | 61 | 13.1% |
| `19-ticketing-box-office` | 10 | 58 | 19 | 12 | 0 | 7 | 8.5 | 60 | 14.2% |
| `20-fanbase-direct-to-fan` | 7 | 41 | 19 | 10 | **1** | 8 | 8.5 | 36 | 23.6% |
| `21-promotion-marketing` | 7 | 41 | 23 | 21 | 0 | 2 | 7.5 | 43 | 17.4% |
| `22-analytics-market-intelligence` | 9 | 44 | 12 | 11 | 0 | 1 | 9.5 | 59 | 16.1% |
| `23-career-finance-business` | 8 | 45 | 14 | 13 | 0 | 1 | 8.0 | 47 | 17.0% |
| `24-trust-safety-disputes` | 9 | 54 | 14 | 12 | 0 | 2 | 7.0 | 45 | 15.6% |
| `meta` | 1 | 6 | 7 | 5 | 0 | 2 | 4.0 | 8 | 50.0% |
| **Total** | **191** | **1,122** | **436** | **302** | **18** | **116** | **190.0** | **1,119** | **16.98%** |

Reading notes, stated so the table is not over-read:

- **`meta` at 50.0% and `(root)` at 31.3% are small-denominator artifacts.** Each is a single
  unit with 8 applicable checkpoints; one WARN mark moves the figure 6.25 points. They are not
  the worst parts of the tree — `(root)` carries 1 blocking finding and `meta` carries 0.
- **A high raw percentage does not track blocking findings.** `16-venues-studios-spaces` scores
  26.4% raw with **zero** blocking; `04-opportunities-casting` scores 19.7% with **five**. The
  raw score counts checkpoint marks; blocking counts what survived verification.
- **`11-music-licensing` (6.5%, 6 raw findings across 52 files) is the cleanest domain in the
  tree** and `02-credits-attribution` (11.3%) the cleanest large one.
- Domains 04 and 05 together account for **8 of the 18 blocking findings** (44%) on 83 of 1,122
  files (7.4%). The blocking mass is concentrated, not diffuse.

---

## 6. Refutation analysis

302 of 436 raw findings (69.3%) were refuted by an independent adversarial pass that read the
cited source directly and tried to kill each finding before upholding it.

| Refutation reason | Count | Share of refuted | What it means |
|---|---|---|---|
| `answered-elsewhere` | **111** | 36.8% | The finding was real about the file it read, but a sibling or owning file already answers it. |
| `no-real-divergence` | **80** | 26.5% | Both quotes verified verbatim, but they do not actually conflict — different scopes, different subjects, or compatible readings. |
| `tracked-deferral` | **77** | 25.5% | The gap is real and is a live, owned, correctly-targeted open question. Tracked gaps are not ambiguity. |
| `downstream-detail` | **30** | 9.9% | Real gap, but it is detail the ideation layer does not owe — it belongs to `/create-prd` or a spec layer. |
| `misquoted` | **4** | **1.3%** | The auditor misquoted or misread the source. |
| **Total** | **302** | **100%** | |

### What this says about auditor calibration

**The auditors read the tree accurately and applied severity too aggressively.** 298 of 302
refutations (98.7%) concern *materiality*, not *accuracy*: the quoted text was there, it said
what the auditor said it said, and the verifier overturned the finding because the divergence
did not force an invention. Only 4 refutations (1.3%) were caused by the auditor getting the
source wrong.

This inverts run 1, where misquoting was the dominant refutation class and the 86.3% refute
rate largely measured auditor error. Run 3's 69.3% measures auditor *over-reporting* instead.
Practically:

- **The upheld set is more trustworthy.** When 98.7% of the refuted set was factually correct,
  a finding that survived the pass survived on materiality grounds, not because the verifier
  failed to catch a misquote.
- **The largest single calibration error is treating a tracked deferral as a defect** — 77
  findings (25.5% of refutations). Live `[PENDING]`/`[OWNER]` markers with a named owner and a
  valid downstream target are the system working, not failing. A refinement for run 4: check
  the marker's target stage against the pipeline state *before* filing, and file only where the
  target has already closed.
- **The second largest is not following the citation** — 111 findings (36.8%) were answered in a
  file the auditor did not open. This is the `source-before-ask` discipline applied to auditing:
  follow every cross-reference before filing a contradiction.
- **24 blocking→warning downgrades (11.8% of the 203 findings that were upheld or downgraded)**
  is the severity calibration gap specifically. Every one had a real divergence; none forced an
  invention.

---

## 7. Run 2's three lost blocking units, re-audited

Run 2 reported 4 raw blocking findings but lost the detail for three of them when its scratchpad
was cleaned, and its verification pass never ran — so it could not say whether they were real.
(The fourth, `01.03.02`, was the representation-scope collision subsequently ratified as
DQ-R2-01 / D-75 and is not at issue.) Run 3 re-audited all three **blind** — run-3 auditors were
instructed not to read `.memory/wiki/specs/audits/`, so none knew these units had been flagged.

| Unit | Run 2 | Run 3 raw severity | Run 3 verified | Rubric |
|---|---|---|---|---|
| `07.08-delivery-readiness-qc` | raw blocking, unverified | **warning** (2 findings) | **0 findings** — both refuted (`downstream-detail`, `tracked-deferral`) | 1.0 / 6 |
| `14.06-used-licence-transfer` | raw blocking, unverified | **warning** (1 finding) | **0 findings** — refuted (`tracked-deferral`) | 1.0 / 5 |
| `20.01-fan-graph-owned-audience` | raw blocking, unverified | **warning** (3 findings) | **0 findings** — all refuted (`no-real-divergence`, `answered-elsewhere`, `tracked-deferral`) | 1.0 / 5 |

**None of the three is blocking.** No run-3 auditor raised a blocking finding on any of them,
and every raw finding they did raise was refuted on verification — five of the six as tracked
deferrals or answers sitting in a sibling file. Each unit scores 1.0 rubric point with WARN
marks on Dimension 3 and Dimension 7 and PASS on the rest.

This settles the question run 2 could not answer. Run 2's own interim report predicted it
(`ideation-ambiguity-report-run2-interim.md:28`: "the 4 raw blocking likely verify to ~0–1"),
and that prediction was correct for these three.

---

## 8. Mechanical defects found outside the finding set

Two defect classes were confirmed **deterministically** — by script or direct inspection, not by
auditor judgement — and are therefore not in the 436. They are queued in
[`run3/MECHANICAL-REMEDIATION-QUEUE.md`](./run3/MECHANICAL-REMEDIATION-QUEUE.md). All are agent
work; none is an owner decision.

### M1 — Leaked tool-call fragments in spec bodies: 10 sites across 7 files

Bare `</content>` / `</invoke>` lines written into published specs by the generating agent.

| File | Lines |
|---|---|
| `04-opportunities-casting/04.03-submission-audition/04.03.01-structured-submission.md` | 218 |
| `04-opportunities-casting/04.05-outcome-response-handoff/04.05.03-won-opportunity-handoff.md` | 261, 262 |
| `11-music-licensing/11.08-licence-instrument-lifecycle/11.08.01-licence-scope-grammar.md` | 242 |
| `13-gear-marketplace/13.12-gear-seller-storefront-policies.md` | 220 |
| `18-show-production-touring/18.03-show-advancing/18.03.02-venue-capability-diff.md` | 300, 301 |
| `18-show-production-touring/18.07-show-day-schedule/18.07.01-run-of-show.md` | 276, 277 |
| `19-ticketing-box-office/19.01-ticket-config-scaling-allocations/19.01.02-capacity-manifest-allocations-holds.md` | 239 |

Several sit at end-of-file, where a section may also have been cut short — each must be checked
for accompanying truncation before the line is deleted.

### M2 — Stale children-table hypothesis counts: 276 of 771 claims (35.8%)

Sub-domain index children tables claim a Deep Think count per child that does not match the
`DT-NN` rows actually present in that child. The error is typically large, not off-by-one —
indexes claim **3** where **12–15** exist, which indicates the tables were written from an early
draft and never refreshed as deepening added hypotheses.

| Index → child | Claims | Actual |
|---|---|---|
| `01.01-person-identity-roles-index.md` → `01.01.03-acting-context-switcher.md` | 3 | 15 |
| `01.02-organizations-entity-model-index.md` → `01.02.02-organization-creation-lifecycle.md` | 3 | 15 |
| `01.03-membership-representation-mandate-index.md` → `01.03.01-membership-records-lifecycle.md` | 3 | 13 |

This is the single largest Dimension 8 (Structural Compliance) driver in the tree and appears in
almost every sub-domain's score. The fix is fully deterministic — recompute every claim from
disk (`^\| DT-\d+` row count per child) and rewrite the cell. It must be scripted, not
hand-edited across 276 cells.

Both queues were deliberately held until all 26 verifiers finished: every fix shifts line
numbers, which would have broken the `file:line` references the verifiers were checking against
and made run 3 non-reproducible.

---

## 9. Coverage attestation

| Check | Result |
|---|---|
| Units enumerated from disk | **191** |
| Units audited | **191** — 100%, zero skipped |
| Files enumerated from disk | **1,122** |
| Files read | **1,122** — 100%, zero skipped |
| Unit-to-file reconciliation | 191 units account for 1,122 / 1,122 files — zero orphans, zero double-counting |
| Shards | 26 (24 domains + `meta` + root) |
| Sampling | **None.** Every file audited individually through the full 3a→3b→3c cycle. |
| Session independence | Every unit audited by an agent instructed not to read `.memory/wiki/specs/audits/`. Nothing inherited from run 1 or run 2. |
| Adversarial verification | Ran on **all 436** raw findings. 0 findings without a verdict; 0 verdicts unmatched to a finding. |
| Data durability | All findings written as structured data to `.memory/wiki/specs/audits/run3/` — a tracked location, not a scratchpad. This is the run-2 regression guard, and it held. |
| Cross-layer checks (Step 4) | Not applicable — scope is ideation only. |

Per-shard evidence: `run3/<domain>.json` (raw findings), `run3/<domain>-rekeyed.json` (verdicts),
`run3/<domain>-remediation.json` (fixes and owner briefs), `run3/VERIFIED-blocking.json` and
`run3/VERIFIED-warnings.json` (aggregates).

---

## 10. Next step

**`/create-prd` is blocked.** The gate is the confirmed blocking count, and it is 18, of which
7 remain open.

1. **Ratify the 7 owner decisions.** [run3-owner-decision-queue.md](./run3-owner-decision-queue.md)
   — each entry has both sides quoted with `file:line`, 3–4 options with trade-offs, a
   recommendation, and its downstream impact. This is the only step that requires the owner and
   the only one that cannot be parallelised away.
2. **Sweep each ratification** with `/propagate-decision`, using the "what changes downstream"
   list in each entry. Entry 3 (`spec` rights posture) should be decided jointly with
   `05.06.01` Q-07 — they are the same shape, and deciding them separately will produce two
   incompatible mechanisms.
3. **Clear the mechanical queue** — M1 (10 leaked fragments, 7 files) and M2 (276 stale counts,
   scripted). M2 is the largest Dimension 8 driver in the tree.
4. **Re-verify.** A fresh run over the changed units confirms the 7 ratifications landed and the
   mechanical sweeps did not introduce drift. The 11 mechanical fixes applied in this run are
   included in that scope.

The 116 warnings do not block and should not be remediated ahead of the owner queue. Re-triage
them after the blocking set is zero — the run-3 refutation profile shows this tree's dominant
failure mode is over-reporting, and a warning sweep run now would spend effort on findings a
later pass may itself downgrade.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-75|D-75]]
- [[decisions.md#d-13|D-13]]
- [[decisions.md#d-12|D-12]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-17|D-17]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-21|D-21]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-27|D-27]]
- [[decisions.md#d-70|D-70]]
