# Opportunities & Casting — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Opportunities & Casting](./opportunities-casting-index.md)
> **Status**: [BREADTH] — 7 children classified; intra-domain cross-cuts mapped.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [04.01 Posting & Targeting](./04.01-opportunity-posting-targeting/) | [04.02 Discovery, Matching & Alerts](./04.02-discovery-matching-alerts/) | Publication releases the post to the board and the alert fan-out; targeting resolves *before* matching so an invite-only post never leaks via a match | Musician, Producer, Operator | High | 04.01 CX-01; 04.02.02 D-04 |
| CX-02 | [04.02 Discovery, Matching & Alerts](./04.02-discovery-matching-alerts/) | [04.03 Submission & Audition](./04.03-submission-audition/) | Discovery produces the candidate; eligibility is evaluated at *both* match time and submit time and must not diverge | Musician, Producer, Operator | High | 04.01 CX-03 synthesis Q2 |
| CX-03 | [04.03 Submission & Audition](./04.03-submission-audition/) | [04.04 Triage, Shortlist & Decisioning](./04.04-triage-shortlist-decisioning/) | Submission structure determines whether triage is tractable — and tractable triage is what makes the close-out obligation honourable rather than punitive | Musician, Producer, Operator | High | 04.03.01 DT-01; 04.04 D-03; 04.05.01 DT-02 |
| CX-04 | [04.04 Triage, Shortlist & Decisioning](./04.04-triage-shortlist-decisioning/) | [04.05 Outcome, Response & Handoff](./04.05-outcome-response-handoff/) | Acceptance produces `won`, which forks the whole product into another domain; every other outcome closes cleanly | Musician, Producer, Operator | High | 04.05 CX-02 |
| CX-05 | [04.01 Posting & Targeting](./04.01-opportunity-posting-targeting/) | [04.04 Triage, Shortlist & Decisioning](./04.04-triage-shortlist-decisioning/) | Targeting's ranked list **is** the urgent-fill cascade order — a posting-stage input consumed directly at decisioning, skipping discovery and submission entirely | Musician | High | 04.01.02 D-01; 04.04.04 |
| CX-06 | [04.06 Band & Member Wanted](./04.06-band-member-wanted.md) | [04.01 Posting & Targeting](./04.01-opportunity-posting-targeting/) | Member-wanted is why unpaid legitimacy is type-scoped — a global compensation gate would block a legitimate post | Musician | High | 04.01 CX-04; 04.06 DT-01 |
| CX-07 | [04.07 Open Calls](./04.07-open-calls-festival-showcase-competition.md) | [04.04 Triage, Shortlist & Decisioning](./04.04-triage-shortlist-decisioning/) | Batch review and curation diverge from rolling triage — candidates are assembled as a portfolio, not evaluated independently | Musician, Operator | Medium | 04.07 DT-03; depends on 18 |
| CX-08 | [04.04.03 Offer](./04.04-triage-shortlist-decisioning/04.04.03-offer-acceptance.md) · [04.05.03 Handoff](./04.05-outcome-response-handoff/04.05.03-won-opportunity-handoff.md) · [04.06 Member Wanted](./04.06-band-member-wanted.md) | **09 Rights & Ownership** ([../09-rights-ownership/](../09-rights-ownership/)) | The **split-capture trigger** recurs at three independent points in this domain — evidence it is a cross-cutting mechanism, not a feature of any one place | Musician, Producer | High | 04.04.03 DT-02; 04.05.03 DT-02; 04.06 DT-02 |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Posting & Targeting ↔ Discovery, Matching & Alerts

**Relationship**: The publication gate (04.01.03) is upstream of every alert in the domain — nothing
reaches the board or the fan-out until compensation is declared. Targeting then resolves *before*
matching, which is a security property rather than an optimisation: matching an entitled pool after
computing a match would let an alert reveal that an invite-only post exists.

**Role scoping**:
- **Musician**: their alerts are the domain's highest-value output and this chain is what feeds them.
- **Producer**: same at lower volume and lower urgency.
- **Operator**: their gap-fill posts escalate through the rungs to reach the board.
- **Fan**: only the open rung is ever visible.

**Synthesis questions answered**:
1. **Shared state conflict**: The post is owned by 04.01; 04.02 is a reader. No write path back.
2. **Trigger chain**: Publish → gate → targeting → matching → alert. Gate failure stops everything
   synchronously; alert-delivery failure degrades to the board (04.02 CX-01).
3. **Permission intersection**: Targeting-before-matching is the boundary that keeps invite-only
   posts invisible. Getting the order wrong is a leak, not a bug.
4. **Notification fan-out**: Publication is the fan-out's sole trigger.
5. **State transition conflict**: Editing a published post's compensation (04.01.03 Q-02) or criteria
   (04.01.04 Q-02) re-opens questions for already-alerted candidates. Both unresolved.

### CX-02: Discovery ↔ Submission

**Relationship**: Discovery produces a candidate who believes they are eligible. Submission
re-evaluates that. If the two evaluations can disagree, a user sees a post on their board, taps it,
and is told they can't apply — which is the platform having lied to them a moment earlier.

**Role scoping**:
- **Musician**: most exposed, highest volume.
- **Producer / Operator**: same mechanism, lower volume.
- **Fan**: no submission path at all.

**Synthesis questions answered**:
1. **Shared state conflict**: Criteria owned by 04.01.04; both stages read them.
2. **Trigger chain**: Match → display → submit → re-evaluate. Divergence between the two evaluations
   is a named bug class (04.01 CX-03 synthesis Q2).
3. **Permission intersection**: The invite-vs-eligibility conflict (04.01 CX-03) surfaces here as the
   concrete question of whether an invited-but-ineligible person can actually submit.
4. **Notification fan-out**: None.
5. **State transition conflict**: Criteria tightened between match and submit — the race that makes
   the two evaluations disagree.

### CX-03: Submission ↔ Triage

**Relationship**: The domain's most important internal dependency, and it is causal rather than
sequential. Structured, assembled submissions (04.03.01 D-01) make triage cheap; cheap triage makes
the close-out obligation (04.05.01) honourable; the close-out obligation is the domain's credibility
bet. Free-text submissions break the chain at the first link — which makes 04.03.01 Q-01 (can posters
ask free-text questions?) a bigger question than it looks.

**Role scoping**:
- **Musician**: as poster, triaging fast on a phone; as applicant, the beneficiary of not being ghosted.
- **Producer**: their queue is where audition media actually gets listened to — the one genuinely
  expensive triage in the domain.
- **Operator**: their triage is partly mechanical (insurance or not).
- **Fan**: no access.

**Synthesis questions answered**:
1. **Shared state conflict**: One submission entity, two viewpoints (applicant pipeline, poster queue).
2. **Trigger chain**: Submit → queue → triage → disposition. The maybe-pile is where the chain stalls
   (04.04.01 DT-01) and it is where ghosting is actually created.
3. **Permission intersection**: Reviewers invited at shortlist could not see the queue (04.04 CX-01).
4. **Notification fan-out**: Every disposition notifies its applicant.
5. **State transition conflict**: Submissions arriving mid-triage reorder a live queue.

### CX-04: Triage ↔ Outcome

**Relationship**: Acceptance is the fork. `won` hands off to another domain and the opportunity
ceases to be one; everything else closes here. It is also the moment one action — the winner
accepting — discharges the poster's entire obligation to everyone else, which is what makes the
close-out gate affordable.

**Role scoping**:
- **Musician**: winner, or one of the many told no.
- **Producer / Operator**: the poster discharging an obligation.
- **Fan**: no access.

**Synthesis questions answered**:
1. **Shared state conflict**: The opportunity closes; a booking/engagement is born elsewhere. The
   back-reference must survive or the provenance chain breaks (04.05.03 D-02).
2. **Trigger chain**: Accept → disposition `won` → handoff. **If handoff fails, someone has accepted
   a gig that exists nowhere** (04.05.03 Q-01).
3. **Permission intersection**: The winner needs access to a domain they may never have used.
4. **Notification fan-out**: The winner's success triggers the losers' answers.
5. **State transition conflict**: Winner cancels post-handoff — shortlist released, losers told no,
   opportunity closed. Reopening is unmodelled and is the likeliest real sequence (04.05.03 Q-02).

### CX-05: Posting & Targeting ↔ Triage (the urgent bypass)

**Relationship**: The unusual one. The ranked list a poster builds at *posting* time is consumed
directly at *decisioning* time as the cascade order, skipping discovery and submission entirely.
A dep call at 9pm never touches the board, never produces an application, and never gets triaged —
which is why this domain is structured by workflow stage rather than by type: only a stage-based
structure can express that a stage can be skipped.

**Role scoping**:
- **Musician**: the only persona this fires for in anger.
- **Operator**: pool-shaped variant for a cancelled slot.
- **Producer**: rare — sessions reschedule where shows cannot.
- **Fan**: no access.

**Synthesis questions answered**:
1. **Shared state conflict**: The list is a posting attribute read by decisioning. No write-back.
2. **Trigger chain**: Raise → cascade → offer with a fuse → next rung. Failure means the gig doesn't
   happen — physical stakes, not administrative ones.
3. **Permission intersection**: An invite is a permission grant, which is why the invite-vs-eligibility
   question (04.01 CX-03) matters most here — an MD's ranked list encodes judgement the platform
   cannot compute.
4. **Notification fan-out**: Each rung is an interruption; this flow is what justifies the
   quiet-hours override existing at all (04.02.04 D-02).
5. **State transition conflict**: The double-accept race (04.04.04 DT-02) — accepted as a trade, not
   prevented.

### CX-06: Band & Member Wanted ↔ Posting & Targeting

**Relationship**: A single feature that constrains a whole sub-domain's design. Because joining a
band is legitimately unpaid, the compensation gate cannot be global — it must be type-scoped, or it
blocks the most common amateur-scene post on the platform. 04.06 is the reason 04.01 CX-04 exists.

**Role scoping**:
- **Musician**: the only persona meaningfully affected.
- **Producer**: occasionally (project bands; the member-who-also-engineers case).
- **Operator**: no access — an Operator in a band is being a Musician.
- **Fan**: read-only on the public board; the most likely Fan→Musician conversion path.

**Synthesis questions answered**:
1. **Shared state conflict**: None — 04.06 is a consumer of the spine with divergent rules.
2. **Trigger chain**: The gate reads type and stays silent. A missing rule set fails closed (04.01 CX-04).
3. **Permission intersection**: Confidentiality for quiet replacements (04.01.02 DT-02) — unresolved.
4. **Notification fan-out**: Auto-escalation would leak a confidential vacancy.
5. **State transition conflict**: Mutual selection breaks the one-way disposition model (04.06 Q-01).

### CX-07: Open Calls ↔ Triage

**Relationship**: Batch review inverts rolling triage, and curation inverts independent evaluation.
A festival assembles a lineup as a portfolio — genre balance, draw, stage times, radius clauses — so
a great act can be rejected because Saturday already has three of them. 04.04's model assumes
candidates are compared to a standard, not to each other's collective shape.

**Role scoping**:
- **Operator**: the curator; 2,000 submissions and a fortnight.
- **Musician**: the applicant, rejected for reasons that are not about them.
- **Producer**: peripheral — appears as a credit on a submitting act's material.
- **Fan**: read-only on the public board; explicitly excluded from voting (04.07 D-03).

**Synthesis questions answered**: Deferred — curation tooling depends on 18's model of what a lineup
is (04.07 DT-03, Q-03). Medium confidence pending that. This is the strongest candidate for
promotion to a sub-domain at Step 5.

### CX-08: Offer / Handoff / Member-Wanted ↔ 09 Rights & Ownership _(cross-level, external)_

**Relationship**: **The most important finding in this domain's drilling.** The same insight arrived
independently at three unrelated points:

- **04.04.03 DT-02** — acceptance is the last moment before work starts where a split is socially free.
- **04.05.03 DT-02** — the handoff *is* the lazy path, and `personas.md` says "the design must make
  the lazy path the correct path".
- **04.06 DT-02** — a new band member walks into an ownership structure nobody explains to them.

Three independent derivations of one mechanism is the signature of a cross-cut, not a feature. This
domain owns the **trigger and the moment**; 09 owns the **instrument**. `personas.md` names the
Producer's worst accidental behaviour as closing a project without capturing splits — "the exact
failure the platform exists to prevent, committed by the persona best placed to prevent it" — and
this domain sits on three of the moments where that failure could be pre-empted at zero social cost,
because nobody has done any work yet and so nobody yet has an opinion about their own contribution.

**Role scoping**:
- **Musician**: the party who most often discovers the missing split years later (`problem-statement.md`).
- **Producer**: the persona best placed to prevent it and the one who accidentally doesn't.
- **Operator**: not affected — they sell time and space, which generates no split.
- **Fan**: no access.

**Synthesis questions answered**:
1. **Shared state conflict**: 09 owns splits absolutely. This domain must never create a parallel
   split model — a second source of ownership truth is the failure the thesis exists to end.
2. **Trigger chain**: Accept / handoff / join → prompt → 09 creates a provisional split. If 09 does
   not exist yet, the prompt has nowhere to go and must not be faked.
3. **Permission intersection**: Who can agree a split on a band's behalf is 01's governance question
   (04.04.02 Q-03).
4. **Notification fan-out**: A provisional split notifies every party — that is the point. It is
   agreement while everyone is present, which `personas.md` calls "the moment that matters".
5. **State transition conflict**: A provisional split agreed at acceptance vs the real contribution
   after the work. The provisional must be revisable without being ignorable.

**Routed to**: the global CX file as a candidate cross-cut mechanism (**Split-Capture Trigger**), and
to `/create-prd-architecture` for the 04↔09 seam.

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 04.02 Discovery, Matching & Alerts | 04.05 Outcome, Response & Handoff | Considered feeding outcomes back into matching — "you didn't get the last 5, so we rank you lower". **Rejected on values, not mechanics.** It builds a system where losing makes you less findable, compounding rejection into invisibility for exactly the working musicians the platform exists to serve. It is also the fairness hazard in the domain's Q-02 at its worst: a ranking that decides who gets *offered* work, trained on who previously *got* work. If ever revisited it must be a user decision with the compounding effect stated plainly. |
| R-02 | 04.06 Band & Member Wanted | 04.07 Open Calls | Considered merging as "the two non-standard types". Rejected — they are non-standard in opposite directions and share nothing. Member-wanted is one-to-one, open-ended, unpaid, mutual and often confidential; an open call is many-to-few, deadline-bound, curated and public. The only thing they have in common is not fitting the spine, which is not a relationship. |
| R-03 | 04.03 Submission & Audition | 04.01 Posting & Targeting (as a *write* path) | Considered letting submission volume auto-tune a post's targeting — no applicants after 24h, so loosen the criteria. Rejected — it silently rewrites what the poster asked for, and criteria may be load-bearing (insurance, certification, right to work). Auto-loosening a legal requirement to fill a queue is a liability transfer disguised as a convenience. Escalation of *reach* (04.01.02 D-03) is the safe version and already exists; escalation of *requirements* is not. |
| R-04 | 04.02 Discovery, Matching & Alerts | 04.06 Band & Member Wanted | Considered material-aware matching for member-wanted ("this bassist knows your back catalogue"). Rejected — it misreads the decision. Joining a band is about whether you want to spend two years of Tuesdays with these people; knowing the songs is table stakes a competent player solves in a week. Optimising the wrong variable would make the feature look clever and be useless. |
