# Rights & Ownership — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children (sub-domains) of [Rights & Ownership](./rights-ownership-index.md)
> **Status**: [DEEP] — 6 sub-domains; all sub-domain pairs synthesised from Step-6 feature-level evidence.
> **Last updated**: 2026-07-18

> This file connects the domain's **sub-domains** (09.01–09.06). Feature-to-feature interactions
> *within* one sub-domain (e.g. 09.01.02 ↔ 09.01.04 anchoring, 09.02.01 ↔ 09.02.04 re-consent) are
> rolled up here where they cross a sub-domain boundary, and otherwise recorded in each sub-domain's
> own CX file. The organising fact of the domain: **09.02 is the only write path that creates a
> consented ledger; every other sub-domain reads, transfers, defends, anchors to, or publishes what
> capture created.**

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [09.02 Split Capture](./09.02-split-capture-agreements/) | [09.01 Rights Registry](./09.01-rights-registry/) | Capture is the **only write path** that produces a consented ledger. Registry owns invariants + state; capture owns prompting, consent and lock. The `unallocated` alarm is exposed in 09.01.02, acted on in 09.02.01. | Musician, Producer | High | Registry D-04 scopes the validator out of deal semantics; capture is the sole author of `consented`. |
| CX-02 | [09.03 Chain of Title & Lifecycle](./09.03-chain-of-title-lifecycle/) | [09.01 Rights Registry](./09.01-rights-registry/) | Two views of one truth: the chain says **how** a row came to be; the registry says **what** it is now. Registry state is derivable from chain events; divergence is a defect, not an opinion. | Musician, Producer | High | Reversion/termination move title with no actor; both must propagate to registry atomically. |
| CX-03 | [09.04 Conflicts & Disputes](./09.04-rights-conflicts-disputes/) | [09.01 Rights Registry](./09.01-rights-registry/) | A conflict is **about** a ledger; a resolution **corrects** one. `disputed` freezes payouts and blocks every exploitation verdict. The ledger does not defend itself; the platform does not rule (D-04). | Musician, Producer | High | 09.04 D-01: the remedy is a corrected ledger, never a refund; freeze is share-scoped. |
| CX-04 | [09.05 AI, Voice & Likeness](./09.05-ai-voice-likeness-consent/) | [09.01 Rights Registry](./09.01-rights-registry/) | Training consent is **anchored** to the ownership ledger — a grant means something only from parties who demonstrably hold the right. **NIL is not anchored at all** (ownership ≠ control). | Musician | High | 09.05 D-01/09.05.02 D-03: a buyout extinguishes the copyright, never the voice. |
| CX-05 | [09.06 Evidence & Public Record](./09.06-rights-evidence-public-record/) | [09.01 Rights Registry](./09.01-rights-registry/) | The lookup reads a **publication-safe projection**, deliberately never the ledger — privacy is opt-in by construction. Writer identity may be public; percentages, deal types and rates never cross. | Musician, Producer, Operator, Fan | High | 09.06.04 D-01/R-02; domain Q-06 (what is public). |
| CX-06 | [09.04 Conflicts & Disputes](./09.04-rights-conflicts-disputes/) | [09.02 Split Capture](./09.02-split-capture-agreements/) | Resolution is applied as a **consented amendment** ([09.02.04](./09.02-split-capture-agreements/09.02.04-split-amendment-reconsent.md)), never a unilateral write. No admin path into the ledger exists — including for dispute resolution. | Musician, Producer | High | 09.02.04 D-02: an override is the domain's highest-value attack surface. |
| CX-07 | [09.06 Evidence & Public Record](./09.06-rights-evidence-public-record/) | [09.03 Chain of Title & Lifecycle](./09.03-chain-of-title-lifecycle/) | **Trust level** is defined by the chain (provenance class: captured / asserted / imported) and rendered by the lookup — the domain's honesty made visible, including for WeJammin's own imported data. | Musician, Producer, Fan | High | 09.06.04 DT-03: without it, WeJammin is Jaxsta with better fonts. |
| CX-08 | [09.05 AI, Voice & Likeness](./09.05-ai-voice-likeness-consent/) | [09.02 Split Capture](./09.02-split-capture-agreements/) | A work-for-hire buyout **does not** extinguish NIL. The session singer who owns nothing still holds their own voice, and must be surfaced the NIL question at capture. | Musician | High | 09.05.02 D-03 / 09.02.03 R-02: the fee buys the copyright, not the person. |
| CX-09 | [09.02 Split Capture](./09.02-split-capture-agreements/) | [09.03 Chain of Title & Lifecycle](./09.03-chain-of-title-lifecycle/) | A buyout of an **agreed** share is a chain-of-title **transfer to a named acquirer** (must name a beneficiary, DT-05), not a redistribution; a **term-limited** buyout's expiry is a **reversion** (09.03.02). Capture originates chain events. | Musician, Producer, Operator | High | 09.02.03 DT-05/DT-07: a share does not evaporate, it moves to whoever bought it. |
| CX-10 | [09.02 Split Capture](./09.02-split-capture-agreements/) | [09.06 Evidence & Public Record](./09.06-rights-evidence-public-record/) | **Two interactions.** (a) Fixation trigger: session close produces both the evidence timestamp and the ledger. (b) An amendment **desynchronises every external filing** (PRO/MLC/CO) — notify, never silently refile (DT-08). | Musician, Producer | High | 09.02.04 → 09.06.03 DT-08; registries accept coarser precision than the ledger's exact rationals. |
| CX-11 | [09.03 Chain of Title & Lifecycle](./09.03-chain-of-title-lifecycle/) | [09.04 Conflicts & Disputes](./09.04-rights-conflicts-disputes/) | A **double assignment** is a chain-integrity failure that surfaces as a conflict. The chain detects it; the dispute machinery handles it; the remedy lands back on the chain and registry. | Musician | Medium | 09.04.01: double assignment is a detection class with high certainty. |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Cross-level references:** Where a cross-cut spans levels it is recorded here with a link to the specific lower-level item; the detail of HOW two features interact lives in the relevant sub-domain CX file. Cross-file reference format: `{filename}#CX-NN`.

---

## Cross-Cut Details

### CX-01: Split Capture ↔ Rights Registry

**Relationship**: The domain has exactly one front door.
[09.02.01](./09.02-split-capture-agreements/09.02.01-moment-of-creation-split-capture.md) is the only
thing that produces a consented ledger from nothing; 09.01 stores and validates it, 09.03 transfers it,
09.04 defends it, 09.05 anchors consent to it, 09.06 publishes it. The division of labour is precise:
**09.01.02 owns share arithmetic, invariants and consent state; 09.02 owns prompting, chase and lock.**
Step 6 sharpened the first question capture asks per contributor from binary to **ternary** — *share /
fee / present-not-a-party* (DT-10/D-10) — and this must never fabricate a fee obligation for the third
branch. The uncomfortable corollary: **if capture does not reach the room, the domain is an empty
database with excellent architecture**, which makes
[09.02 Q-02](./09.02-split-capture-agreements/09.02-split-capture-agreements-index.md) (DAW-vs-browser
surface) a domain-level risk.

**Role scoping**:
- **Musician**: Consents; the party whose rights exist or do not depending on whether this fires.
- **Producer**: The capture point. Drives the flow; holds no authority over anyone's percentage.
- **Operator**: Not a party except via a studio-held work-for-hire (read-only stake).
- **Fan**: No visibility, ever.

**Synthesis questions answered**:
1. **Shared state conflict**: The registry owns the ledger; capture proposes it. Object creation opens an `unallocated` ledger (INV-2/INV-3 for works, INV-1 for masters); capture is the only write path to `consented`. Duplicate-work merges are ledger merges gated on consent from every party on both sides.
2. **Trigger chain**: Session close ([domain 07](../07-music-projects-collaboration/)) → capture → `consented` ledger → downstream unlocks. **Async, no rollback**: if capture is skipped the recording is permanently badged and release-blocked ([domain 12](../12-release-distribution/)) — a consequence, never an obstruction (09.02.01 D-01). The consent-based (not role-based) writer-row rule means being named grants read on that ledger only.
3. **Permission intersection**: Write access to a recording does **not** confer the right to allocate its shares. Deriving project access from a ledger row is forbidden (DT-11/D-07) — naming someone must never become a security decision.
4. **Notification fan-out**: To every named party, including invited non-users via signed link (identity stub that later merges carrying its consent). Also to [domain 02](../02-credits-attribution/) (credits) and [09.01.05](./09.01-rights-registry/09.01.05-performer-neighbouring-rights.md) (performer records) — **one prompt, up to three record types**; the ensemble fee case emits N credits from one designation, so 02 must not assume a credit implies a ledger row.
5. **State transition conflict**: Concurrent edits during `proposed` invalidate in-flight consents; consent binds to a ledger **version**, not a ledger. Concurrent proposals queue, never merge. Capture's edit-invalidates-consent rule (D-07) is the same mechanism as 09.02.04's re-consent, applied pre-lock — one mechanism, two entry points.

### CX-02: Chain of Title & Lifecycle ↔ Rights Registry

**Relationship**: The registry says *X owns 25% today*; the chain says *how X came to own 25%, and from
whom*. The registry is derivable from the chain, so any divergence is the worst defect available: the
platform's two authoritative records naming different owners of one right. The boundary that keeps the
chain honest is the **encumbrance-vs-covenant** distinction (09.01.03): encumbrances travel with the
asset, covenants (e.g. a re-recording restriction) do not — put them in one list and every sale preview
is wrong in one direction.

**Role scoping**:
- **Musician**: Owner; sees both, harmed if they disagree.
- **Producer**: Read-only on the chain; a party where they hold shares or points.
- **Operator**: Only via a studio entity holding work-for-hire.
- **Fan**: No visibility (the public projection is CX-07's trust badge, not the chain).

**Synthesis questions answered**:
1. **Shared state conflict**: The chain is authoritative for history, the registry for current state. Neither wins a disagreement — a disagreement is an incident. Co-pub assignments write a transfer; admin appointments write **nothing** (09.01.04 D-01) — get this wrong and every administered work has a fictional chain of title.
2. **Trigger chain**: Chain event → registry update, **atomically**. The hard cases move with no actor: a reversion fires because time passed (09.03.02); a termination reaches back to unwind a 35-year-old link (09.03.03). Per domain D-05 these **notify rather than execute** where a human must act.
3. **Permission intersection**: Nobody can suppress a chain event, including the parties it disadvantages — a grantee cannot veto a reversion. A dissolved-entity owner's share does not vanish; it becomes an asset of the liquidation (governed in [domain 01](../01-identity-profiles-organizations/)).
4. **Notification fan-out**: Affected parties, plus [domain 10](../10-royalties-collections/) (payee changes) and [domain 12](../12-release-distribution/) (distribution rights ending).
5. **State transition conflict**: An event landing mid-royalty-run splits the period between departing and returning payee. Distribution binds to registry **state at run start** — the same version-binding discipline as CX-01 and CX-10.

### CX-03: Conflicts & Disputes ↔ Rights Registry

**Relationship**: A conflict is *about* a ledger and a resolution *corrects* one; disputes never produce
their own truth. `disputed` is a registry state that **freezes payouts and blocks every exploitation
verdict** in a master's Control Summary. Because freeze is **share-scoped, not work-scoped**, the ledger
must support a **partially-frozen** state where uncontested rows keep paying while contested rows escrow
(09.01.02 ↔ 09.04.03). Conflict causes of action include: a stranger claiming an unclaimed stub, an
ISRC collision across differently-consented ledgers, a cover-link dispute, and an off-platform society
registration that disagrees with the ledger — the last originating **outside** the platform entirely.

**Role scoping**:
- **Musician / Producer**: Claimant or respondent; the contested share's holder.
- **Operator**: Only via a studio-held stake.
- **Fan**: No visibility (CX-05/R-02 forbids publishing dispute status).

**Synthesis questions answered**:
1. **Shared state conflict**: The registry owns the row; 09.04 owns the *contest over* the row. The remedy is a consented amendment (CX-06), never a platform ruling (D-04).
2. **Trigger chain**: Conflict detected/asserted → contested share flips to `disputed`/frozen → royalties divert to escrow ([domain 10](../10-royalties-collections/)) → resolution → consented amendment → freeze lifts. **Rollback**: an unresolved claim never mutates the ledger; the last consented state keeps governing.
3. **Permission intersection**: A DMCA claim can contradict a consented ledger; the ledger consumes as evidence but does not self-adjudicate — routes to 09.04 and [domain 24](../24-trust-safety-disputes/). Being a claimant grants no write access to the contested row.
4. **Notification fan-out**: All ledger parties on the contested object, plus domain 10 (escrow diversion) and domain 24 (case machinery, bad-faith pattern detection).
5. **State transition conflict**: Two claimants racing on one share both land in `disputed`; the freeze is idempotent per share. Manufactured-conflict abuse (repeat bad-faith claims) is a T&S signal (domain 24), not a rights outcome — prevention at source (CX-06's one-sheet-per-work rule) is cheaper than detection.

### CX-04: AI, Voice & Likeness ↔ Rights Registry

**Relationship**: [09.05](./09.05-ai-voice-likeness-consent/) lives inside domain 09 for one reason:
consent granted here is **anchored** to a consented ownership ledger. Every standalone AI-consent
registry collects assertions from parties whose authority to grant is unverified — a lead singer opting
in a label-co-owned master has recorded a *preference*, not a *permission*. Anchoring requires **all
owners of the right**, which makes WeJammin's consent slower and less complete than a competitor's, and
is the only thing that makes it mean anything. **The asymmetry that matters: NIL is not anchored to the
ledger at all** — a voice attaches to a person, not property, so master ownership confers zero NIL
authority.

**Role scoping**:
- **Musician**: Owner (training consent) *and* person (NIL). A WFH session singer is the second without the first.
- **Producer**: Surfaces both questions at capture; holds neither.
- **Operator**: No stake.
- **Fan**: No consent visibility; sees only AI-generation disclosure ([09.05.03](./09.05-ai-voice-likeness-consent/09.05.03-ai-generated-content-disclosure.md)).

**Synthesis questions answered**:
1. **Shared state conflict**: The ledger anchors training consent (owned property). NIL is a separate record on a *person* and cannot be written by ledger parties. The registry must anchor what is owned and never be allowed to anchor what is not ownable.
2. **Trigger chain**: Training request → resolve ledger consent (all owners) → resolve NIL (each identified performer) → grant only if both complete; otherwise missing or refused. **No partial grants.** If training is *licensed* (scope/grantee/term/compensation) rather than merely permitted, it becomes a licence and belongs to [domain 11](../11-music-licensing/) (09.05.01 → 11).
3. **Permission intersection**: Master ownership confers **zero** NIL authority — a 100% master owner cannot license the recording for AI training over a performer's non-consent. This is the load-bearing rule of 09.05.
4. **Notification fan-out**: A training request notifies all owners **and** every identified performer — including those who own nothing and would otherwise never hear about it.
5. **State transition conflict**: A master sold mid-request moves the *ownership* question to the buyer; the NIL grant does not move at all. Rights that travel and rights that do not, diverging in real time.

### CX-05: Evidence & Public Record ↔ Rights Registry

**Relationship**: The public lookup ([09.06.04](./09.06-rights-evidence-public-record/09.06.04-public-rights-lookup.md))
reads a **publication-safe projection**, deliberately never the ledger — a separate product wearing the
same brand, not a filtered professional view. The visibility asymmetry is deliberate and per-field:
writer identity is public (it is on the back of every record ever pressed); percentages, deal types and
rates are not, and are **asymmetrically damaging** (a publisher learning a writer's admin rate before a
renegotiation; a competitor learning who is absent). The dupe-detection confidentiality tension (DT-15
— detection could leak unreleased works) is a narrower instance of the same question (domain Q-06).

**Role scoping**:
- **Musician, Producer**: Own the underlying rows; choose (via Q-06 policy) what projects.
- **Operator**: Sees the public projection like anyone else; no ledger access.
- **Fan**: The **only** Fan-facing surface of the entire domain — sees the projection, never the fight, never the numbers.

**Synthesis questions answered**:
1. **Shared state conflict**: The registry owns the canonical rows; the lookup owns a derived, minimised view. The projection can never write back.
2. **Trigger chain**: Ledger reaches a publishable consented state → projection recomputes. A `disputed` state does **not** surface (R-02); the lookup shows the last consented state or "not currently confirmed", never the dispute.
3. **Permission intersection**: No credential elevates the public view — it is public-by-construction. Percentages and deal terms have no code path to the lookup.
4. **Notification fan-out**: None to Fans (a lookup is a pull, not a push). Owner-facing "your public record changed" is an owner concern, not part of this projection.
5. **State transition conflict**: If the ledger is mid-amendment, the projection shows the current consented version, not the pending proposal — the same version discipline as CX-01/CX-02.

### CX-06: Conflicts & Disputes ↔ Split Capture

**Relationship**: A dispute resolution is applied to the ledger the **only** way anything is — as a
**consented amendment** through [09.02.04](./09.02-split-capture-agreements/09.02.04-split-amendment-reconsent.md).
There is no admin write path, including for dispute resolution: an override would be the domain's
highest-value attack surface. Prevention at source is designed in — capture enforces **one sheet per
work** (a second proposer joins rather than forks), so rival sheets on one work are 09.04's cause of
action that capture refuses to manufacture.

**Role scoping**:
- **Musician, Producer**: Parties who must re-consent to the corrected ledger.
- **Operator**: No write authority; a studio party re-consents like any other.
- **Fan**: No visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: 09.04 produces a *proposed resolution*; 09.02.04 turns it into a *consented amendment*. The consented version keeps governing while a proposal is pending; post-lock changes supersede rather than mutate.
2. **Trigger chain**: Resolution reached → amendment proposed → re-consent from every party (the consent set may have **grown** since original capture — anchored publishers become consent-holders on any amendment diluting their anchor, 09.01.04 D-11) → lock. **Rollback**: if re-consent stalls, the pre-dispute consented ledger governs; escrow holds.
3. **Permission intersection**: No role can bypass consent. A dispute win does not grant unilateral write — it grants the right to *propose* the corrected ledger, which the losing party still counter-signs.
4. **Notification fan-out**: Every current consent-holder (a set that grows every time any writer signs a publishing deal), via the consent-chase mechanism.
5. **State transition conflict**: Concurrent amendments queue, never merge. A true-up consented during dispute resolution is netted against future royalties, not clawed back retroactively.

### CX-07: Evidence & Public Record ↔ Chain of Title & Lifecycle

**Relationship**: **Trust level** is defined by the chain and rendered by the lookup — the domain's
honesty made visible. Every rendered record carries its **provenance class** (captured / asserted /
imported, 09.06.04 DT-03 / 09.01.03 DT-08): an in-the-room captured ledger with signed consents is not
the same evidentiary object as an imported or asserted one, and must never render with a captured
ledger's signed badge. This is the difference between WeJammin and "Jaxsta with better fonts", and it
applies to WeJammin's own imported data.

**Role scoping**:
- **Musician, Producer**: See the trust tier on their own catalogue.
- **Operator**: Sees the same public tier.
- **Fan**: Sees the badge, not the underlying chain.

**Synthesis questions answered**:
1. **Shared state conflict**: The chain owns the provenance facts; the lookup owns the badge derived from them. The badge cannot be set independently of the chain.
2. **Trigger chain**: Chain establishes/updates provenance class → lookup recomputes the trust tier. An asserted record that later gains captured consent upgrades its tier.
3. **Permission intersection**: No one can hand-set a "captured/signed" badge without the underlying signed consent existing — the badge is not editable content.
4. **Notification fan-out**: None to Fans; owner-facing "your record is now verified" is an owner surface.
5. **State transition conflict**: The badge always reflects the current chain state; a downgrade (e.g. a consent later repudiated) reflows to the tier.

### CX-08: AI, Voice & Likeness ↔ Split Capture

**Relationship**: A work-for-hire buyout does **not** extinguish NIL. The fee buys the copyright, not
the fact of having played — so the session singer who owns nothing after a buyout still holds their own
voice, and capture must surface the NIL question independently of the share/fee question. This is the
most commercially live instance of the domain's central axiom, *ownership ≠ control*: a 100% master
owner cannot clear an AI voice-clone over the non-consenting performer.

**Role scoping**:
- **Musician**: The performer whose NIL survives the buyout.
- **Producer**: Runs capture; must ask the NIL question even for bought-out contributors.
- **Operator**: A studio holding WFH acquires copyright, not NIL.
- **Fan**: No visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: The buyout writes the ledger (share → fee, transferred to acquirer); NIL is a separate person-record capture must also open. Neither overwrites the other.
2. **Trigger chain**: Buyout designation at capture → ledger transfer (CX-09) **and** a still-open NIL record for the performer. The two records diverge permanently thereafter.
3. **Permission intersection**: Buying the copyright grants zero NIL authority — the load-bearing rule shared with CX-04.
4. **Notification fan-out**: The NIL question notifies the performer even when their ledger share is 0% or fee-only.
5. **State transition conflict**: The master can later be sold (moving the ledger owner) without touching the NIL record — the same travel/no-travel divergence as CX-04.

### CX-09: Split Capture ↔ Chain of Title & Lifecycle

**Relationship**: Capture is where chain-of-title events are *born* for agreements struck in the room.
The sharp distinction Step 6 fixed: a buyout of an **agreed** share is a **transfer to a named
acquirer** (DT-05) — it must name a beneficiary, because an agreed share does not evaporate, it *moves*
to whoever bought it — landing in [09.03.01 Chain of Title](./09.03-chain-of-title-lifecycle/09.03.01-chain-of-title-ledger.md).
A **term-limited** buyout's expiry is a **reversion** landing in
[09.03.02](./09.03-chain-of-title-lifecycle/09.03.02-term-territory-reversion.md), and per domain D-05
it *notifies* rather than auto-executes. Copy must say "transfers your 25% to [acquirer]", never
"administrative update". This sharpens 09.02.04 Q-04's amendment-vs-transfer boundary: **a buyout with a
beneficiary is a transfer; one without is not a buyout.**

**Role scoping**:
- **Musician, Producer**: The seller (loses the share) and the acquirer (named on the chain).
- **Operator**: A studio-as-entity is the classic WFH/vesting acquirer — its only genuine stake in this sub-domain.
- **Fan**: No visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: Capture proposes the transfer; the chain records it as a title event with a named acquirer. The registry's current row and the chain's transfer event must agree atomically (CX-02).
2. **Trigger chain**: Buyout/WFH designation at capture → chain transfer event **+** registry row move (sync, atomic). A term-limited buyout additionally schedules a future reversion event (async, notify-not-execute). Designating WFH while the ledger is mid-consent invalidates in-flight consents (share→fee leaves the ledger short of 100% — validation must require explicit reallocation, never auto-fill, D-08).
3. **Permission intersection**: An entity acquirer needs an authorised signatory (no signatory → the designation cannot complete); a studio on a ledger is an **entity**, not an Operator persona (which is why Operator stays None).
4. **Notification fan-out**: Seller, acquirer, and — for reversions — [domain 10](../10-royalties-collections/) (payee change) and [domain 12](../12-release-distribution/) (live-release takedown, Q-03). Unpaid fees, refunded engagements and contested designations route to [09.04.02](./09.04-rights-conflicts-disputes/09.04.02-split-ownership-dispute-cases.md) rather than auto-resolving.
5. **State transition conflict**: A reversion landing mid-royalty-period splits the payout by effective date (CX-02). Neighbouring-rights entitlement is **not** extinguished by the buyout (R-02) — a contribution cut from the final master after buyout becomes a contested performer edit routed to 09.04, not decided at capture.

### CX-10: Split Capture ↔ Evidence & Public Record

**Relationship**: Two distinct interactions. **(a) Shared fixation trigger** — session close produces
both the proof-of-creation timestamp (09.06.02) and the consented ledger; both are byproducts of being
in the room, neither is a task the user chooses. **(b) Amendment desynchronisation** — an amendment
(09.02.04) desynchronises **every external filing** (PRO / MLC / Copyright Office). Registries accept
coarser precision than the ledger's exact rationals (09.01.02 D-02), so the registrable restatement may
not equal the agreed figure. Rule: **notify, never silently refile** (DT-08, domain D-05).

**Role scoping**:
- **Musician, Producer**: Owners whose filings drift out of sync after any amendment.
- **Operator**: No stake.
- **Fan**: The public lookup surface is CX-05, not this seam.

**Synthesis questions answered**:
1. **Shared state conflict**: The ledger is canonical; external filings are downstream copies at coarser precision. The platform's record can be right and the society's stale — reconciliation direction can even reverse (domain 10 feeds society-held registration data back).
2. **Trigger chain**: (a) fixation → timestamp + ledger, in one event. (b) amendment lock → *notification* that N external filings are now stale → owner decides whether to refile. **No silent refile** — an automated restatement at coarser precision could itself become a conflicting record.
3. **Permission intersection**: Only the owner initiates a refile; the platform surfaces the drift and the human-readable signed export, it does not act on a society's behalf.
4. **Notification fan-out**: The owner(s) of each affected filing; machine interchange (CWR/DDEX RIN) is [domain 10](../10-royalties-collections/)'s job, the human-readable signed export is capture's.
5. **State transition conflict**: An amendment during an in-flight external registration means the registrable figure and the agreed figure momentarily disagree — the notification names the ledger version so the mismatch is diagnosable, not silent.

### CX-11: Chain of Title & Lifecycle ↔ Conflicts & Disputes *(Medium)*

**Relationship**: A **double assignment** — the same share transferred to two acquirers — is a
chain-integrity failure that surfaces as a conflict. The chain detects it (a title search returns two
live owners of one right); the dispute machinery in 09.04 handles it; the remedy lands back as a
consented amendment (CX-06) that repairs both the chain and the registry. *Medium* pending validation
of exactly where detection fires (at the second assignment vs at a later title search).

**Synthesis (deferred — Medium confidence)**: The five questions are provisionally answered by
inheritance — shared-state and version discipline follow CX-02; trigger/rollback and notification follow
CX-03/CX-06. Promote to full synthesis at `/write-architecture-spec` once the detection trigger point is
fixed.

---

## Cross-Cut Mechanisms (routed OUT of this domain)

> Candidates that turned out to be mechanisms serving many domains. **No nodes were created for these.**
> Recorded so the global CX file (`ideation-cx.md`) can absorb them. Several are now in the Step-6
> mechanism registry; **Territory Model** and **Effective-Share Resolution** are flagged as *emergent*
> (not yet in the registry) — see the structured return.

| Mechanism | Serves | Why it is not a node here |
|---|---|---|
| **E-Signature & Consent Capture** | 05, 06, 09, 11, 13, 14, 16, 17 | Sweep candidate 02 was "Moment-of-Creation Split Agreement **& E-Signature**". The **split sheet** is domain-owned; the **pen** is not. Non-negotiable constraint on the shared pen: consent **arrival method** (in-account vs signed link, with redacted address) must be a permanent, visible property of every consent (DT-12/D-08) — a pen that renders all signatures identically destroys the only defence a non-account party has. Now the registry's *Contracts, E-Signature & Attestation* mechanism. |
| **Consent Chase & Escalating Notification** | 02, 05, 09, 11, 17 | "Waiting on 3 of 4" with decaying reminders appears identically in split capture, credit confirmation, licence counter-signature and booking. Requirements this domain imposes: schedule T+0/1d/3d/7d/14d/30d → monthly to 12mo → quarterly indefinitely; **no expiry** (a stale proposal is still evidence); per-party mute **recorded on the sheet** ("chased nine times, muted at reminder four" vs "never received it" are different facts). Now the registry's *Notifications & Alerts* mechanism. |
| **Dispute Case Machinery** | 05, 09, 13, 14, 17, 19, 24 | Cases, evidence submission, arbitration, resolution UI, bad-faith pattern detection — [domain 24](../24-trust-safety-disputes/) owns the courtroom. Domain 09 owns only the **cause of action** (competing claims over one right) and the **remedy** (a corrected ledger, not a refund). Now the registry's *Admin Backoffice* + domain-24 machinery. |
| **Audio Fingerprinting & Content Identification** | 02, 09, 10, 11, 12, 24 | Precision-first duplicate detection (domain D-06) depends on ISWC/ISRC identifiers and audio fingerprints produced upstream at registration/release (domain 12). Now the registry's *Audio Fingerprinting* mechanism (owner: 09). |
| **Work/Recording Duality (as a data axiom)** | 02, 07, 09, 10, 11, 12, 22 | The domain index calls it "an axiom every other domain must inherit" — the definition of a cross-cut. The *product surface* stays as [09.01.01](./09.01-rights-registry/09.01.01-work-recording-duality.md); the axiom is global (now under the registry's *Canonical Data & Entity Resolution*). |

---

## Not-Product (routed to `/create-prd`)

> Architecture and NFR concerns discovered while drilling this domain. **No nodes created.**

| Concern | Route to | Why |
|---|---|---|
| **Territory as a dimension of the ownership model** | `/create-prd-architecture` | **Emergent — not in the registry.** Territory is a *dimension of the ownership/grant model*, not an attribute of one grant (09.03.02 D-01): term, reversion, public domain, moral rights, licensing scope, sub-publishing and distribution all vary by territory and *differently from each other*. Effective share is a right-type × territory **matrix**, not a scalar (09.01.04 D-07). The 8/90 interaction budget cannot absorb a territory prompt at capture, so it is flagged-not-designed at capture (Q-05). The highest-leverage schema decision touching this domain. |
| **Effective-vs-nominal share resolution** | `/create-prd-architecture` | **Emergent — not in the registry.** [Domain 10](../10-royalties-collections/) (payouts), [domain 11](../11-music-licensing/) (one-stop clearance) and [domain 23](../23-career-finance-business-management/) (forecasting) all need the **effective** net after the encumbrance waterfall, co-pub shares-of-shares and recoupment — never the nominal ledger figure. Forecasting on nominal overstates income for every writer in a co-pub deal (26.85% in the worked example). The waterfall **tier order** (gross → net → owners' share) is a rights fact declared in 09.01.03 and *executed* in domain 10. A shared derivation, currently implicit. |
| **Exact rational share representation** | `/create-prd-architecture` | 09.01.02 DT-01: three co-writers is the most common configuration and is exactly what decimals cannot represent (33.33 × 3 = 99.99). Ledger owes exact rationals **plus a deterministic canonical row order**; domain 10 owns cent allocation + sub-cent remainder. Without canonical order, two runs of one distribution pay differently. Trivial now, unfixable after a million rows. |
| **Ledger-version binding / as-of resolution** | `/create-prd-architecture` | Distribution binds to the ledger **version current at run start** (or one period is computed against two splits, unreconcilable); licences record the version they resolved against; statements name the version ID + bind timestamp. An application of the registry's *Audit Log & Provenance Ledger* (point-in-time/as-of) — not a new mechanism, but a hard requirement the ledger imposes. |
| **Escrow as regulated fund-holding** | `/create-prd-stack`, `/create-prd-security` | 09.04.03 DT-02: holding third-party funds pending a dispute is a regulated activity. The rights half (which share, contested by whom) is domain-owned; the money-transmission half is domain 10 + *Payments/Escrow* mechanism. Activates the KYC/AML items `[PENDING]` in `meta/constraints.md`. |
| **Blockchain / DLT for the rights ledger** | `/create-prd-architecture` | Rejected as product with prejudice (09.03.01 DT-01). The oracle problem is fatal: a chain proves a claim was *recorded* and unaltered, never that it was *true*; an immutable false statement is worse than a mutable database. What makes WeJammin's chain trustworthy is multi-party consent in the room, not a chain. |
| **External timestamp anchoring** (RFC 3161 / Merkle) | `/create-prd-architecture` | The one place cryptographic anchoring earns its keep (09.06.02 DT-03). "This hash existed by this date" is a statement about the record itself. **Anchor the timestamp; do not anchor the ownership.** |
| **PII isolation for rights parties** | `/create-prd-security` | Legal names, addresses, tax IDs; interacts with GDPR erasure vs the permanence of consent as a legal fact (09.01.02 Q-03) — the consent must survive, the personal data must not. |
| **DDEX RIN / CWR message-format compliance** | `/create-prd` (integration) | Interchange formats for session metadata and work registration. The *format compliance* is an integration contract; the *product* (export your splits to a society) belongs to [domain 10](../10-royalties-collections/). |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | [09.05 AI, Voice & Likeness](./09.05-ai-voice-likeness-consent/) | [09.03 Chain of Title & Lifecycle](./09.03-chain-of-title-lifecycle/) | NIL **never entered** the chain, so it cannot fail to travel through it — it was never a link. Moral rights *are* the chain's business (a carve-out from a transfer that happened); NIL is a personhood right no transfer ever touched. Coupling them would imply a voice is a thing that could have been assigned and merely was not. |
| R-02 | [09.06 Evidence & Public Record](./09.06-rights-evidence-public-record/) | [09.04 Conflicts & Disputes](./09.04-rights-conflicts-disputes/) | Deliberately rejected. Publishing dispute status would be a **reputational weapon** — a bad-faith actor could damage a rival's commercial prospects by asserting a claim they never intend to win, and the platform would supply the weapon. The lookup shows the last consented state or "not currently confirmed", never the fight (09.06.04 D-04). |
| R-03 | [09.05 AI, Voice & Likeness](./09.05-ai-voice-likeness-consent/) | [09.06 Evidence & Public Record](./09.06-rights-evidence-public-record/) | A public "who has opted out of AI training" surface is a **scraping target list** — it tells exactly the wrong actors which catalogues are unprotected and which owners are absent. Inverts the sub-domain's purpose. Whether a *licensable-corpus* surface exists is 09.05 Q-02, a very different product. |
| R-04 | [09.05 AI, Voice & Likeness](./09.05-ai-voice-likeness-consent/) | [09.01.05 Performer & Neighbouring Rights](./09.01-rights-registry/09.01.05-performer-neighbouring-rights.md) | Tempting to fuse "performer identity for neighbouring-rights payout" with "performer NIL consent" — but one is a **money entitlement paid by an exploiter via a society**, the other a **veto over use of the person**. Fusing them would imply consenting to AI use forfeits neighbouring-rights income, or vice versa. Disjoint by design. |
| R-05 | [09.03 Chain of Title & Lifecycle](./09.03-chain-of-title-lifecycle/) | [09.05 AI, Voice & Likeness](./09.05-ai-voice-likeness-consent/) | An AI training grant transfers no ownership, creates no encumbrance on title, and does not appear in a title search — a revocable permission that leaves the ownership record untouched. Recording grants in the chain would make every consent look like an assignment. |
| R-06 | [09.01.05 Performer & Neighbouring Rights](./09.01-rights-registry/09.01.05-performer-neighbouring-rights.md) | [09.01.02 Ownership Ledger](./09.01-rights-registry/09.01.02-ownership-ledger-validation.md) | *Intra-09.01, recorded to prevent re-linking.* Disjoint records over one human: a session drummer is a 0%-or-absent ledger row **and** a full performer record. Ledger presence must not imply performer presence, or vice versa — neighbouring-rights entitlement is explicitly **not** an encumbrance on the master (paid by the exploiter via a society, DT-06 REJECTED). |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-06|D-06]]
