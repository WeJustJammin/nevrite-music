# Opportunities & Casting — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Opportunities & Casting](./opportunities-casting-index.md)
> **Status**: [DEEP] — 7 children; sub-domain cross-cuts synthesised at Step 6 from feature-level evidence.
> **Last updated**: 2026-07-18

The domain is structured by workflow **stage** (D-02), so its internal cross-cuts are overwhelmingly
the seams *between* stages of one `Opportunity`/`Submission` lifecycle plus two off-spine consumers
(04.06 member-wanted, 04.07 open calls). Step 6 confirmed the spine chain (CX-01→CX-04) and surfaced
four seams the breadth pass under-weighted: the board↔close-out "anti-rot" loop (CX-07), the
submission↔obligation multiplier (CX-08), the posting↔close-out trigger set (CX-06), and the
member-wanted reviewer-conflict (CX-10).

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [04.01 Posting & Targeting](./04.01-opportunity-posting-targeting/) | [04.02 Discovery, Matching & Alerts](./04.02-discovery-matching-alerts/) | Publication gate is the fan-out's **sole** trigger; entitlement resolves *before* ranking; edits and bumps must never re-fire the alert; the honest gate turns the board into a de-facto **price signal** | Musician, Producer, Operator, Fan (open rung) | High | 04.01.03 gate-pass-sole-trigger; 04.01.01 D-13 bump-no-refire; 04.02.01 D-15; 04.01.03 D-18/DT-06 |
| CX-02 | [04.02 Discovery, Matching & Alerts](./04.02-discovery-matching-alerts/) | [04.03 Submission & Audition](./04.03-submission-audition/) | Discovery produces a candidate who *believes* they are eligible; the entitlement filter blocks unreachable posts here (not there); eligibility must not diverge between match time and submit time; an existing submission suppresses further alerts | Musician, Producer, Operator | High | 04.01 CX-03 synth Q2; 04.03.01↔04.02.01 entitlement filter; 04.02.04↔04.03 alert suppression |
| CX-03 | [04.03 Submission & Audition](./04.03-submission-audition/) | [04.04 Triage, Shortlist & Decisioning](./04.04-triage-shortlist-decisioning/) | Submission *structure* determines whether triage is tractable — and tractable triage is what makes close-out honourable; free text renders at shortlist and nowhere earlier; a live offer freezes the submission object | Musician, Producer, Operator | High | 04.03.01 D-01; 04.04 D-01/D-03; 04.03.01↔04.04.02 (D-08); 04.03.01↔04.04.03 (DT-07) |
| CX-04 | [04.04 Triage, Shortlist & Decisioning](./04.04-triage-shortlist-decisioning/) | [04.05 Outcome, Response & Handoff](./04.05-outcome-response-handoff/) | Acceptance produces `won`, which forks the product into another domain; every other outcome closes cleanly here; one acceptance discharges the poster's whole obligation | Musician, Producer, Operator | High | 04.05 CX-02; 04.05.03 D-02 |
| CX-05 | [04.01 Posting & Targeting](./04.01-opportunity-posting-targeting/) | [04.04 Triage, Shortlist & Decisioning](./04.04-triage-shortlist-decisioning/) | The ranked targeting list **is** the urgent-fill cascade order — a posting-stage input consumed directly at decisioning, skipping discovery and submission; the decider field is the precondition for the decider-cannot-be-candidate rule | Musician, Operator | High | 04.01.02 D-01; 04.04.04; 04.01.01 D-07 |
| CX-06 | [04.01 Posting & Targeting](./04.01-opportunity-posting-targeting/) | [04.05 Outcome, Response & Handoff](./04.05-outcome-response-handoff/) | Posting emits **three** close-out triggers — expiry, withdrawal, and `filled elsewhere`; `filled elsewhere` is decisive (the case where the poster otherwise never returns) and must NOT score as ghosting; retired types must still render in history | Musician, Producer, Operator | High | 04.01.01→04.05.01 (DT-07); 04.01.01→04.05.02; 04.01.01→04.05.04 (D-05) |
| CX-07 | [04.02 Discovery, Matching & Alerts](./04.02-discovery-matching-alerts/) | [04.05 Outcome, Response & Handoff](./04.05-outcome-response-handoff/) | **The domain's anti-rot loop (DT-03).** The board renders every listing's response-reputation signal and its `filled/closed` landing state; the close-out obligation is what keeps the board from filling with dead ads — the incumbents' cause of death | Musician, Producer, Operator, Fan (read-only) | High | 04.02.01→04.05.01 (DT-03, D-04); 04.02.01→04.05.02 (D-13); 04.02.04→04.05 (D-11) |
| CX-08 | [04.03 Submission & Audition](./04.03-submission-audition/) | [04.05 Outcome, Response & Handoff](./04.05-outcome-response-handoff/) | A submission *creates* the close-out obligation, and 04.03.01 D-05 (one submission may carry two roles) makes the obligation's arithmetic **two dispositions owed per applicant**; the applicant-pipeline mirror is the source of truth for "did it send?" | Musician, Producer, Operator | High | 04.03.01→04.05.01 (DT-01, D-05); 04.03.01→04.05.04 (D-03) |
| CX-09 | [04.06 Band & Member Wanted](./04.06-band-member-wanted.md) | [04.01 Posting & Targeting](./04.01-opportunity-posting-targeting/) | Member-wanted is why the compensation gate must be **type-scoped** — a global gate blocks the most common amateur post; the collision is sharper than breadth had it: member-wanted comp can flow *from* the applicant (rehearsal-room chip-in), which the gate's original D-02 called unrepresentable | Musician, Producer | High | 04.01 CX-04; 04.06 DT-01; 04.01.03↔04.06 D-12 collision |
| CX-10 | [04.06 Band & Member Wanted](./04.06-band-member-wanted.md) | [04.03 Submission & Audition](./04.03-submission-audition/) | Band submissions: to a band, from a band, reviewed by band members who may themselves want the chair — the sharpest consumer of the decider-cannot-be-candidate rule; the guitarist reviewing applicants for a singer they'd rather be | Musician, Producer | High | 04.03.01→04.06 (DT-09); 04.01.01 D-07 |
| CX-11 | [04.07 Open Calls](./04.07-open-calls-festival-showcase-competition.md) | [04.04 Triage, Shortlist & Decisioning](./04.04-triage-shortlist-decisioning/) | Batch/portfolio review inverts rolling triage; the 25-slot soft ceiling routes here — past it, a post is a hiring round the spine deliberately lacks the batch tooling for | Operator, Musician | Medium | 04.07 DT-03; 04.01.01→04.07 (25-slot ceiling); depends on 18 |
| CX-12 | [04.04.03 Offer](./04.04-triage-shortlist-decisioning/) · [04.05.03 Handoff](./04.05-outcome-response-handoff/) · [04.06 Member Wanted](./04.06-band-member-wanted.md) | **09 Rights & Ownership** ([../09-rights-ownership/](../09-rights-ownership/)) _(cross-level)_ | The **split-capture trigger** recurs at three independent points — the cross-cut signature. This domain owns the trigger + timing; 09 owns the instrument. Routed to the global CX; detail in the cross rows | Musician, Producer | High | 04.04.03 DT-02; 04.05.03 DT-02; 04.06 DT-02; domain D-06 |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Posting & Targeting ↔ Discovery, Matching & Alerts

**Relationship**: The publication gate (04.01.03) is upstream of every alert in the domain — nothing
reaches the board or the fan-out until compensation is declared. Targeting then resolves *before*
matching (a security property, not an optimisation: ranking an entitled pool after computing a match
would let an alert reveal an invite-only post exists). Step 6 hardened two rules on the write side:
compensation **edits must never re-fire** the alert (a £1 upward edit would be a free bump and the
board would fill with resurfacing spam), and publication `bump` must not re-fire either — one alert
per post per subscriber, ever. Emergent property (D-18/DT-06): because the gate forces honest
compensation, aggregate board data publishes the local going rate (40 dep calls at £150 *is* the
London dep rate) — a price signal nobody meant to build.

**Role scoping**:
- **Musician**: alerts are the domain's highest-value output; this chain feeds them.
- **Producer**: same at lower volume/urgency.
- **Operator**: gap-fill posts escalate through the rungs to reach the board.
- **Fan**: only the open rung is ever visible; the price signal is the only board data a Fan reads.

**Synthesis questions answered**:
1. **Shared state conflict**: The post is owned by 04.01; 04.02 is a reader with no write-back. The
   saved-search/subscription (04.02.04) is the only 04.02-owned object and it never mutates the post.
2. **Trigger chain**: Publish → gate → targeting → matching → alert, synchronous through the gate.
   Gate failure stops everything; alert-delivery failure degrades to the board (pull fallback). A
   comp *edit* re-enters the gate for re-validation but is fire-suppressed for the fan-out.
3. **Permission intersection**: Targeting-before-matching is the boundary keeping invite-only posts
   invisible; ordering it wrong is a leak, not a bug. Entitlement can only *widen* by escalation, so
   posts enter the board but never leave it by escalation.
4. **Notification fan-out**: Publication is the fan-out's sole trigger; bump and edit are excluded by
   rule (D-13). Targeting-widening is the only legal cause of a second alert (cap 2 lifetime per user/post).
5. **State transition conflict**: A published post's comp/criteria edit races already-alerted
   candidates — resolved downstream at CX-02 (version-binding) rather than here.

### CX-02: Discovery ↔ Submission

**Relationship**: Discovery produces a candidate who believes they are eligible; submission
re-evaluates that belief. If the two evaluations disagree, the user sees a post, taps it, and is told
they can't apply — the platform having lied a moment earlier. Step 6 split the enforcement cleanly:
the **entitlement filter** (blocked-applicant, invite-only) is enforced at the board (04.02.01) and
never reaches submission at all — and the blocked case renders as "this opportunity isn't available",
never "you are blocked" (a harassment-surface rule). **Eligibility** (the requirement checklist) is
advisory at match time and *binding* at submit time; the board stamps its fit evaluation with a
timestamp so a divergence renders as "the poster added a requirement after you saw this", never a
bare "you don't qualify". An existing submission suppresses further alerts on that post.

**Role scoping**:
- **Musician**: most exposed, highest volume.
- **Producer / Operator**: same mechanism, lower volume.
- **Fan**: no submission path.

**Synthesis questions answered**:
1. **Shared state conflict**: Criteria owned by 04.01.04; both stages read them. The board holds an
   advisory pre-evaluation (timestamped); submission holds the binding verdict. Neither writes criteria.
2. **Trigger chain**: Match → display → submit → re-evaluate. Divergence is a named bug class; the
   timestamp is the compensating render, not a lock.
3. **Permission intersection**: Entitlement (targeting) blocks at the board; eligibility (criteria)
   gates at submit. An invited-but-ineligible person is the unresolved intersection (04.01 CX-03).
4. **Notification fan-out**: None from discovery→submission itself; submission existence feeds back
   to *suppress* alerts (04.02.04).
5. **State transition conflict**: Criteria tightened between match and submit — the race the timestamp
   render exists to explain honestly rather than prevent.

### CX-03: Submission ↔ Triage

**Relationship**: The domain's most important internal dependency, causal not sequential. Structured,
assembled submissions (04.03.01 D-01) make triage cheap; cheap triage makes close-out (04.05.01)
honourable; close-out is the domain's credibility bet. Step 6 added two mechanics: free text (D-08,
plain-text-only, no upload) is collected at submission but **renders only at shortlist** (04.04.02) —
triage stays coarse (04.04.01 D-01), which is what makes deferring free-text coherent; and a **live
offer freezes** the submission object (no supersede) — a state-machine boundary (DT-07) owned jointly.
The urgent-fill path (04.04.04) is a *negative* boundary: it produces candidates with **no
submission**, so nothing in triage may assume candidate implies submission.

**Role scoping**:
- **Musician**: as poster, triaging fast on a phone; as applicant, the beneficiary of not being ghosted.
- **Producer**: their queue is where audition media actually gets listened to — the one genuinely
  expensive triage in the domain.
- **Operator**: partly mechanical triage (insurance/certs or not).
- **Fan**: no access.

**Synthesis questions answered**:
1. **Shared state conflict**: One submission entity, two viewpoints (applicant pipeline 04.05.04,
   poster queue 04.04.01). A live offer freezes it against supersede.
2. **Trigger chain**: Submit → queue → triage → disposition. The maybe-pile is where the chain stalls
   (04.04.01 DT-01) and where ghosting is created. Review/submit mutual exclusion (D-10) is enforced
   at 04.04.02.
3. **Permission intersection**: Reviewers invited at shortlist could not see the raw queue; a card
   collapse (04.04.01 D-10) guarantees a submission-spam failure elsewhere is an artefact, not evidence.
4. **Notification fan-out**: Every disposition notifies its applicant.
5. **State transition conflict**: Submissions arriving mid-triage reorder a live queue (resolved by
   04.02.01 D-14: no live restack — changes accumulate behind an explicit "N new" control).

### CX-04: Triage ↔ Outcome

**Relationship**: Acceptance is the fork. `won` hands off to another domain and the opportunity
ceases to be one; everything else closes here. It is also the moment one action — the winner
accepting — discharges the poster's entire obligation to everyone else, which is what makes the
close-out gate affordable. The offer state changes withdrawal's verb to *decline* (04.03.01 D-12);
post-acceptance breakage lands on 04.04.03 Q-01 (is acceptance a contract?), unresolved and not this
domain's to invent.

**Role scoping**:
- **Musician**: winner, or one of the many told no.
- **Producer / Operator**: the poster discharging an obligation.
- **Fan**: no access.

**Synthesis questions answered**:
1. **Shared state conflict**: The opportunity closes; a booking/engagement is born elsewhere. The
   back-reference must survive or the provenance chain breaks (04.05.03 D-02).
2. **Trigger chain**: Accept → disposition `won` → handoff. **If handoff fails, someone has accepted
   a gig that exists nowhere** (04.05.03 Q-01) — sync, and its failure is physical not administrative.
3. **Permission intersection**: The winner needs access to a domain they may never have used; commit
   authority is inherited from 01, strictly narrower than review access.
4. **Notification fan-out**: The winner's success triggers the losers' answers.
5. **State transition conflict**: Winner cancels post-handoff — shortlist released, losers told no,
   opportunity closed. Reopening is unmodelled and is the likeliest real sequence (04.05.03 Q-02).

### CX-05: Posting & Targeting ↔ Triage (the urgent bypass)

**Relationship**: The unusual one. The ranked list a poster builds at *posting* time is consumed
directly at *decisioning* time as the cascade order, skipping discovery and submission. A 9pm dep
call never touches the board, never produces an application, never gets triaged — which is why this
domain is structured by stage: only a stage-based structure expresses a *skipped* stage. Step 6 added
the decider dependency: 04.01.01 D-07's decider field is the **precondition** for the
decider-cannot-be-candidate conflict rule (undetectable without it), and the multi-hyphenate case is
real (an MD taking a keys slot in the band they cast).

**Role scoping**:
- **Musician**: the only persona this fires for in anger.
- **Operator**: pool-shaped variant for a cancelled slot.
- **Producer**: rare — sessions reschedule where shows cannot.
- **Fan**: no access.

**Synthesis questions answered**:
1. **Shared state conflict**: The list is a posting attribute read by decisioning. No write-back.
2. **Trigger chain**: Raise → cascade → offer with a fuse → next rung. Failure means the gig doesn't
   happen — physical stakes. The serial fuse creates an unfixable rank side-channel (DT-05).
3. **Permission intersection**: An invite is a permission grant; the decider field lets the platform
   detect the conflict it otherwise couldn't compute.
4. **Notification fan-out**: Each rung is a Critical interruption; this flow is what justifies the
   quiet-hours override existing at all (04.02.04 D-02) — and a manufactured override requires
   manufacturing a show (04.01.01 D-02 hard gate on Critical).
5. **State transition conflict**: The double-accept race (04.04.04 DT-02) — accepted as a trade, not
   prevented; a Critical push can be obsolete before it is read (DT-07).

### CX-06: Posting & Targeting ↔ Outcome (the close-out trigger set)

**Relationship**: Posting is where a close-out obligation is *born* — Step 6 identified three distinct
triggers originating here (04.01.01→04.05.01, DT-07): **expiry**, **withdrawal**, and **`filled
elsewhere`**. The last is decisive: it is the case where the poster otherwise never returns (gig
filled in the DMs, 12 applicants ghosted), and the domain's beachhead (D-04) is undeliverable without
it. Two guard rules attach: `filled elsewhere` must **not** score as ghosting in the response signal
(it is honest and it dispositioned everyone), and reputation accrues to the **acting identity**, not
the human who typed the post (a studio's response record is the studio's).

**Role scoping**:
- **Musician / Producer / Operator**: all post and therefore all owe; the acting-identity rule matters
  most for Operators and Producers who post as venues/studios/labels.
- **Fan**: read-only; sees only the resulting response signal on a public board.

**Synthesis questions answered**:
1. **Shared state conflict**: The post's lifecycle state (04.01) is the input; the disposition ledger
   and response signal (04.05) are the outputs. History is never remapped even when a type retires
   (04.01.01 D-05) — remapping would rewrite what applicants applied to.
2. **Trigger chain**: expiry (time-triggered) / withdrawal / `filled elsewhere` → disposition sweep →
   response-signal update. Async and idempotent; a re-fired trigger must not double-count ghosting.
3. **Permission intersection**: Only the acting identity (or its 01-granted delegates) may set
   `filled elsewhere`; the reputation lands on that identity, not the typing human.
4. **Notification fan-out**: Each trigger dispositions and notifies every open applicant at once.
5. **State transition conflict**: `filled elsewhere` racing a late genuine submission — the submission
   is dispositioned as closed, never silently dropped, and the applicant is told the post closed.

### CX-07: Discovery, Matching & Alerts ↔ Outcome (the anti-rot loop)

**Relationship**: **The strongest new Step 6 finding (DT-03).** Every incumbent musician board
(JoinMyBand, Bandmix, Craigslist, Facebook dep groups) died of ads filled and never closed — rot, not
emptiness. The board (04.02.01) renders each listing's **response-reputation signal** (04.05.02) and
its `filled/closed` landing state, and the close-out obligation (04.05.01) is precisely what keeps the
board from rotting. The signal is also the incentive that makes an applicant spend 20 minutes on a
submission and that makes close-out self-enforcing rather than merely obligatory. The cold-start empty
state (04.02.01 D-16) hands off to alerts (04.02.04) as its only honest offer: an empty board's only
legitimate product is a standing promise.

**Role scoping**:
- **Musician / Producer / Operator**: see response signals on every listing before deciding to apply;
  owe the signal on their own posts.
- **Fan**: read-only — response signals are visible only if the board is public (Q-11).

**Synthesis questions answered**:
1. **Shared state conflict**: 04.05 owns the disposition ledger and the derived response signal; the
   board (04.02) is a reader that renders them. The signal is derived, never directly editable.
2. **Trigger chain**: disposition (04.05.01) → response-signal recompute (04.05.02) → board re-render
   (04.02.01). Async; the board is eventually consistent behind the "N new" control (D-14).
3. **Permission intersection**: Suppression trail ("Hidden because you were booked (N)", 90-day,
   recipient-only, pull-only) and muted-intent affordances are board-hosted but derive from
   availability (04.02.02) and subscription (04.02.04) state.
4. **Notification fan-out**: The "Filled 4 minutes ago" render is only showable *because* close-out
   forces the state; the alert's landing surface resolves to `filled/closed` (04.02.04 D-11).
5. **State transition conflict**: A listing filled between a Fan's page-load and tap renders its
   `filled` state on arrival rather than a stale open form.

### CX-08: Submission ↔ Outcome (obligation creation & the two-disposition multiplier)

**Relationship**: A submission *creates* an obligation (DT-01) — the domain's beachhead candidate
(D-04). Step 6 surfaced the multiplier: 04.03.01 D-05 lets one submission carry two roles (applying
as both engineer and drummer), which means **two candidacies = two dispositions owed**, correct but
making the obligation's arithmetic depend on the submission's polymorphism. The applicant-pipeline
mirror (04.05.04) is the source of truth for "did it send?" — the WhatsApp status-quo's defining
ambiguity — and its entries survive post deletion (04.05.04 D-03), which is why a
post-deleted-after-submission still resolves the disposition owed.

**Role scoping**:
- **Musician**: the applicant owed a disposition, and the party the pipeline mirror serves.
- **Producer / Operator**: as posters, the debtors of the obligation.
- **Fan**: no access.

**Synthesis questions answered**:
1. **Shared state conflict**: The submission object (04.03) is mirrored by the pipeline entry (04.05.04);
   the pipeline entry outlives the post (D-03). The disposition ledger (04.05.01) is 04.05-owned.
2. **Trigger chain**: submit → obligation created (one per candidacy, so *two* if D-05 fires) →
   disposition discharges it. Async; a post deletion does not vacate the obligation.
3. **Permission intersection**: Only the acting poster identity discharges; the applicant sees the
   mirror regardless of the poster's actions.
4. **Notification fan-out**: Each disposition notifies its applicant; two candidacies mean two notices.
5. **State transition conflict**: A submission superseded/withdrawn before disposition — the obligation
   count decrements; a live offer freezes it (CX-03) so it cannot be superseded away to dodge a decline.

### CX-09: Band & Member Wanted ↔ Posting & Targeting

**Relationship**: A single feature that constrains a whole sub-domain's design. Because joining a band
is legitimately unpaid, the compensation gate cannot be global — it must be type-scoped or it blocks
the most common amateur-scene post. Step 6 found and fixed the collision (DT-10/D-12): 04.06 states
member-wanted comp is "usually nothing or negative (you chip in for the rehearsal room)" — money
flowing **from** the applicant, which the gate's original D-02 called unrepresentable. D-02 was
restated so a type-scoped negative/zero comp is representable for member-wanted without opening the
applicant-side-fee door the anti-fee thesis (D-03) forecloses everywhere else.

**Role scoping**:
- **Musician**: the only persona meaningfully affected.
- **Producer**: occasionally (project bands; the member-who-also-engineers case).
- **Operator**: no access — an Operator in a band is being a Musician.
- **Fan**: read-only on the public board; the likeliest Fan→Musician conversion path.

**Synthesis questions answered**:
1. **Shared state conflict**: None — 04.06 is a consumer of the spine's gate with divergent, type-scoped rules.
2. **Trigger chain**: The gate reads type and applies the member-wanted rule set; a missing rule set
   fails closed (04.01 CX-04).
3. **Permission intersection**: Confidentiality for quiet replacements (04.01.02 DT-02) — a
   member-wanted vacancy is often a lineup change the current member hasn't been told about (unresolved).
4. **Notification fan-out**: Auto-escalation would leak a confidential vacancy — escalation is gated for this type.
5. **State transition conflict**: Mutual selection breaks the one-way disposition model (04.06 Q-01).

### CX-10: Band & Member Wanted ↔ Submission & Audition

**Relationship**: New Step 6 seam. Band submissions are polymorphic in a way the spine's
single-applicant model strains: a submission **to** a band, **from** a band (04.03.01 D-04 submit
authority), reviewed **by** band members who may themselves want the chair. This is the sharpest real
case of the decider-cannot-be-candidate rule (DT-09): a band posts for a singer and the guitarist,
who is a reviewer, would rather be the singer — making them a reviewer of their own competition.
Everything 04.03.01 decides about identity keying (D-05), supersede (D-02/D-11) and withdrawal (D-12)
must hold for a band-anchored submission or the polymorphism is a lie.

**Role scoping**:
- **Musician**: the applicant and the conflicted reviewer are both Musicians.
- **Producer**: project bands; the member-who-also-engineers.
- **Operator / Fan**: no access.

**Synthesis questions answered**:
1. **Shared state conflict**: The submission is 04.03-owned; band submit/review authority is an
   01-granted entity capability (fails closed until 01 decides). Two candidacies from one submission
   (D-05) apply here too.
2. **Trigger chain**: band posts → members become reviewers → conflict detection (needs decider field,
   CX-05) excludes the wanting member from deciding their own chair.
3. **Permission intersection**: Review access is entity-inherited; commit authority is strictly
   narrower; a member wanting the chair keeps review but loses decide on that slot.
4. **Notification fan-out**: A band submission notifies the band's alert delegates (01, DT-04), deduped per human.
5. **State transition conflict**: A reviewing member self-nominating mid-review — must convert them to
   candidate and strip their decide right on that slot atomically, or they vote themselves in.

### CX-11: Open Calls ↔ Triage

**Relationship**: Batch/portfolio review inverts rolling triage, and curation inverts independent
evaluation. A festival assembles a lineup as a portfolio (genre balance, draw, stage times, radius
clauses) so a great act can be rejected because Saturday already has three of them. 04.04's model
assumes candidates are compared to a standard, not to each other's collective shape. The 25-slot soft
ceiling (04.01.01→04.07) routes here: past 25 slots a post is a hiring round, and the open call is the
shape with the batch review the spine deliberately lacks.

**Role scoping**:
- **Operator**: the curator; 2,000 submissions and a fortnight.
- **Musician**: the applicant, rejected for reasons not about them.
- **Producer**: peripheral (a credit on a submitting act).
- **Fan**: read-only; explicitly excluded from voting (04.07 D-03).

**Synthesis**: Deferred — curation tooling depends on 18's model of what a lineup *is* (04.07 DT-03,
Q-03). Medium confidence pending that. Strongest candidate for promotion to a sub-domain.

### CX-12: Offer / Handoff / Member-Wanted ↔ 09 Rights & Ownership _(cross-level, external)_

**Relationship**: The **split-capture trigger** — the same insight arrived independently at three
unrelated points (04.04.03 DT-02 acceptance, 04.05.03 DT-02 handoff, 04.06 DT-02 joining a band),
each "the last moment a split is socially free". Three independent derivations is the signature of a
cross-cut. This domain owns the **trigger and the moment**; 09 owns the **instrument**. Step 6 added
two constraints 09 needs: the trigger is **type-scoped** (a dep gig has no split; over-firing kills
the prompt), and a post-declared points/buyout is **intent, not an instrument** (04.01.03 D-07: no
counterparty exists at post time; the instrument is created at offer acceptance, not before).

**Routed to**: the global CX file as the **Split-Capture Trigger** mechanism (registry-owned by 10),
and to `/create-prd-architecture` for the 04↔09 seam. Full synthesis lives in the cross rows.

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 04.02 Discovery, Matching & Alerts | 04.05 Outcome (as a *matching feedback* path) | Considered feeding outcomes back into matching — "you didn't get the last 5, so we rank you lower". **Rejected on values** (domain D-07): it builds a system where losing makes you less findable, compounding rejection into invisibility for exactly the working musicians the platform serves. Note this is distinct from CX-07, which is the *forward* render of response signals onto the board — no ranking feedback. If ever revisited it must be a user decision with the compounding effect stated plainly. |
| R-02 | 04.06 Band & Member Wanted | 04.07 Open Calls | Considered merging as "the two non-standard types". Rejected — non-standard in opposite directions. Member-wanted is one-to-one, open-ended, unpaid, mutual, often confidential; an open call is many-to-few, deadline-bound, curated, public. Sharing "doesn't fit the spine" is not a relationship. |
| R-03 | 04.03 Submission & Audition | 04.01 Posting & Targeting (as a *write* path) | Considered letting submission volume auto-tune a post's targeting — no applicants after 24h, so loosen the criteria. Rejected — it silently rewrites what the poster asked for, and criteria may be load-bearing (insurance, certification, right to work). Auto-loosening a legal requirement to fill a queue is a liability transfer disguised as convenience. Escalation of *reach* (04.01.02 D-03) is the safe version and already exists; escalation of *requirements* is not. |
| R-04 | 04.02 Discovery, Matching & Alerts | 04.06 Band & Member Wanted | Considered material-aware matching for member-wanted ("this bassist knows your back catalogue"). Rejected (R-04, reaffirmed) — it misreads the decision. Joining a band is about whether you want two years of Tuesdays with these people; knowing the songs is table stakes a competent player solves in a week. Optimising the wrong variable would make the feature look clever and be useless. |
| R-05 | 04.04 Triage, Shortlist & Decisioning | 04.02.03 Material-Aware Dep Matching (as a triage input) | Considered surfacing a material-fit *count* ("18 of 25 songs") in the triage queue. Rejected on a leak: a count discloses the 7 unplayed songs, leaking setlist contents to a reviewer possibly not entitled (04.02.04 D-14 — material copy states only the recipient's own facts). Triage sees fit as a boolean band, never the enumerated gap. |
