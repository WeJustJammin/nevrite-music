# Opportunities & Casting — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-16
> **Novelty**: `industry-standard` | **Priority**: `important`

## Overview

The demand side of work — posted gigs, dep calls, auditions, band vacancies, crew jobs, festival and showcase applications, creative briefs and writing camps — with structured submission, triage and outcome tracking.

**Why this is a top-level domain**: The inverse of the services marketplace and a distinct domain: there a seller lists and a buyer purchases; here a demander posts a need, many apply, and someone selects. Both must exist — the dep circuit, the function-band scene and the crew network run entirely on Facebook groups and WhatsApp today, the clearest displacement target in the corpus. One workflow (post → target → submit → triage → decide → notify) serves gigs, auditions, festival slots, briefs and camps, so building it five times is waste. It is arguably the #1 reason a working musician opens the app: alerts carry money and dep gigs are won in minutes. Sonicbids and ReverbNation are the cautionary tale — the mechanic is right; charging desperate artists per submission is what destroyed their credibility. Boundary adjusted: absorbed 'Briefs/RFPs/Job Posts' and 'Auditions, Pitches & Blind Submissions' from Services Marketplace, which were duplicating this workflow. The clean handoff is that a won Opportunity CREATES a Services engagement. Sync briefs remain in Music Licensing, inseparable from clearance status and catalog search — an acknowledged reuse of this mechanism across a domain boundary.

**Interacting capabilities** (what justifies domain status):

- opportunity posting & targeting
- alerts & availability-aware matching
- structured submission & audition
- triage, shortlist & decisioning
- outcome & response tracking

## Children

> **Structured by workflow stage, not by opportunity type.** The sweep offered 14 candidates, 10 of
> which were *types* (gig board, dep calls, auditions, briefs, crew jobs, festival calls, support
> slots, A&R briefs, camps, member-wanted). This domain's own rationale rules that out: "one workflow
> serves gigs, auditions, festival slots, briefs and camps, so building it five times is waste."
> Type is a discriminator on one `Opportunity` object (04.01.01); the **stages** are the structure.
> Two candidates survived as separate nodes on mechanical rather than typed divergence (04.06, 04.07).

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 01 | Opportunity Posting & Targeting | sub-domain | [04.01-opportunity-posting-targeting/](./04.01-opportunity-posting-targeting/) | `[BREADTH]` | 10 hypotheses |
| 02 | Discovery, Matching & Alerts | sub-domain | [04.02-discovery-matching-alerts/](./04.02-discovery-matching-alerts/) | `[BREADTH]` | 10 hypotheses |
| 03 | Submission & Audition | sub-domain | [04.03-submission-audition/](./04.03-submission-audition/) | `[BREADTH]` | 13 hypotheses |
| 04 | Triage, Shortlist & Decisioning | sub-domain | [04.04-triage-shortlist-decisioning/](./04.04-triage-shortlist-decisioning/) | `[BREADTH]` | 10 hypotheses |
| 05 | Outcome, Response & Handoff | sub-domain | [04.05-outcome-response-handoff/](./04.05-outcome-response-handoff/) | `[BREADTH]` | 11 hypotheses |
| 06 | Band & Member Wanted | feature | [04.06-band-member-wanted.md](./04.06-band-member-wanted.md) | `[SURFACE]` | 2 hypotheses |
| 07 | Open Calls — Festival, Showcase & Competition | feature | [04.07-open-calls-festival-showcase-competition.md](./04.07-open-calls-festival-showcase-competition.md) | `[SURFACE]` | 3 hypotheses |

> **Type column values:**
> - `sub-domain` — a grouping with 2+ interacting capabilities (folder with index + CX)
> - `feature` — a leaf node describing a single capability (.md file)

**Totals**: 5 sub-domains · 22 leaf feature files · 59 Deep Think hypotheses logged.

## Role Matrix

> Personas from [meta/personas.md](../meta/personas.md) — referenced, never redefined.
>
> **Legend**: ✅ Full · ⚙️ Config · 👁️ Read-only · 📊 Reports · ❌ None

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 04.01 Opportunity Posting & Targeting | ✅ Full — dep calls, member-wanted, function subs | ✅ Full — session calls, briefs | ✅ Full — support slots, crew, house calls | ❌ None — cannot post |
| 04.02 Discovery, Matching & Alerts | ✅ Full — the #1 reason they open the app | ✅ Full — briefs, session calls | ✅ Full — inverted: fills their gaps | 👁️ Read-only — public board listings only |
| 04.03 Submission & Audition | ✅ Full — the primary applicant | ✅ Full — both sides; the attestor who makes evidence real | ✅ Full — applies for house work; mostly receives | ❌ None |
| 04.04 Triage, Shortlist & Decisioning | ✅ Full — as poster; the dep circuit's urgent fill | ✅ Full — as poster; convenes the artist/label | ✅ Full — venue+promoter joint review | ❌ None |
| 04.05 Outcome, Response & Handoff | ✅ Full — owes and receives dispositions | ✅ Full — both sides | ✅ Full — reputation compounds with 16/17 | 👁️ Read-only — response signals, only if the board is public |
| 04.06 Band & Member Wanted | ✅ Full — the only real user | ✅ Full — project bands; member-who-also-engineers | ❌ None — an Operator in a band is being a Musician | 👁️ Read-only — the likeliest Fan→Musician conversion path |
| 04.07 Open Calls | ✅ Full — the applicant, usually via a Band entity | 👁️ Read-only — appears as a credit on submitting acts | ✅ Full — the curator (festival, showcase, competition) | 👁️ Read-only — **explicitly excluded from voting** (04.07 D-03) |

> **Persona gaps found during drilling** — see Q-01 and Q-02. Two populations in this domain are not
> covered by the 4 personas: the **function/private-hire buyer** (who posts the gigs this domain
> calls its clearest displacement target) and **crew** (a lighting tech is not a Musician). Same
> shape as the dealer-persona gap already open in `meta/personas.md` Q-01.

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | The inverse of the services marketplace and a distinct domain: there a seller lists and a buyer purchases; here a demander posts a need, many apply, and someone selects. Both must ... | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | **Structured by workflow stage, not by opportunity type** | 10 of 14 sweep candidates were types. This domain's own rationale forbids building the workflow per type. One `Opportunity` object with a type discriminator (04.01.01); five stages as sub-domains. Only a stage-based structure can express that the urgent-fill path *skips* stages (CX-05). | `/ideate-discover` Step 3 classification |
| D-03 | **The anti-fee position is structural, not editorial** | The domain names Sonicbids/ReverbNation as its cautionary tale. Applicant-side fees are made *unrepresentable* in the data model (04.01.03 D-02), not prohibited by policy. This forecloses the revenue line the incumbents used — the owner must confirm knowingly (Q-03). | `/ideate-discover` Step 3 Deep Think |
| D-04 | **The close-out obligation is the domain's beachhead candidate** | The Sonicbids collapse had two causes: charging to submit *and* never answering. The second is still committed daily by every incumbent. Unlike this domain's more novel features, it has no credit-graph dependency, no cold-start problem, and costs nothing — it works on day one with an empty platform. | `/ideate-discover` Step 3 Deep Think (04.05.01 DT-01) |
| D-05 | **Material-aware dep matching is the domain's differentiator and its least launch-ready feature** | It is D-18's thesis compressed into one screen — consolidation supplies the setlist (18), provenance verifies "played this" (02) — and it is exactly what a Facebook dep group structurally cannot do. It is also worthless until 02 and 18 exist. Proposed `could` on sequencing, not on value. | `/ideate-discover` Step 3 Deep Think (04.02.03 DT-01, DT-02) |
| D-06 | **The split-capture trigger is a cross-cut, discovered three times independently** | Offer acceptance, won-opportunity handoff, and joining a band each independently surfaced as "the last moment a split is socially free". Three derivations of one mechanism is a cross-cut signature. This domain owns the trigger and the moment; 09 owns the instrument. | `/ideate-discover` Step 3 Deep Think (CX-08) |
| D-07 | **Rejection must never feed back into matching** | Considered and rejected on values: it would make losing compound into invisibility for exactly the working musicians the platform serves. Recorded as a rejected pair (CX R-01) rather than silently omitted. | `/ideate-discover` Step 3 Deep Think |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | Which candidate children are sub-domains vs features? | Agent | ✅ **RESOLVED** — 5 sub-domains, 2 domain-level features, 22 leaf features. See Children table and D-02. |
| Q-02 | Are any candidate children actually cross-cuts? | Agent | ✅ **RESOLVED** — 6 cross-cuts routed out (availability, notification delivery, reputation, verified-credit-as-evidence, pitchable asset packet, split-capture trigger). Candidate 12 (Song Catalog & Pitch One-Sheet) was entirely a cross-cut. |
| Q-03 | **The function/private-hire buyer** (wedding, corporate) posts the gigs this domain calls its clearest displacement target, but is not a Musician, Producer, Operator or Fan. Out of scope, civilian/Fan-tier account, or a 5th persona? | User | `/ideate-validate` |
| Q-04 | **Crew are not covered by the 4 personas.** A lighting tech is not a Musician. Same shape as `meta/personas.md` Q-01 (dealer persona). | User | `/ideate-validate` |
| Q-05 | **Is "no applicant-side fees, ever" a permanent commitment (D-03)?** It is encoded structurally (unrepresentable, not prohibited), which makes reversal expensive. It forecloses the revenue line Sonicbids used, from the users least able to refuse. | User | `/ideate-validate` |
| Q-06 | **Cold-start seeding is this domain's biggest risk.** A board's entire value is other people's supply, and an empty board teaches users the product is dead. Where does the first supply come from? | User | `/ideate-validate` |
| Q-07 | **Does matching rank by fit or by quality?** Ranking humans by fitness for paid work is the domain's sharpest fairness hazard, and it bites hardest in the triage queue where the ranking becomes a decision. | User | `/ideate-validate` |
| Q-08 | **The evidence/blind-review contradiction (04.03 Q-01).** Evidence-backed applications and anonymised review negate each other; both are legitimate. Retained unresolved rather than silently dropping either. | User | `/ideate-validate` |
| Q-09 | **Is acceptance a contract (04.04.03 Q-01)?** Binding means penalties and disputes; non-binding is an expensive fiction against the Operator's perishable inventory. | User | `/ideate-validate` |
| Q-10 | **Is the close-out obligation enforced or encouraged (04.05 Q-01)?** A gate has teeth and costs supply; a nag is ignored by the posters who ghost most. | User | `/ideate-validate` |
| Q-11 | Is the board **public/SEO-indexable** or login-walled? Public aids cold start and makes the Fan read-only lens load-bearing; it also exposes the pool to scraping. | User | `/ideate-validate` |
| Q-12 | **The sweep's blind spot is informative.** None of the 14 candidates connected casting to the credit graph — the domain's single most thesis-aligned feature (04.03.02) was absent. A category sweep finds category features; the differentiator is by definition not in the category yet. Worth testing whether other domains share this blind spot. | Agent | `/audit-ambiguity ideation` |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-07|D-07]]
