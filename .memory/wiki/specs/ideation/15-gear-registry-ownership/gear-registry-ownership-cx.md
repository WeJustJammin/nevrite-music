# Gear Registry & Ownership — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Gear Registry & Ownership](./gear-registry-ownership-index.md)
> **Status**: [BREADTH] — 10 children classified; 10 intra-domain cross-cuts confirmed, 5 pairs rejected.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [15.01 Identity & Provenance](./15.01-instrument-identity-provenance/) | [15.02 Stolen Registry](./15.02-stolen-gear-registry-recovery/) | Flags attach to gear identities; a theft report on unregistered gear must mint a record; contested claims and false flags are **the same adjudication problem** and share one dispute path | Musician, Producer, Operator | High | 15.01.02 DT-02 (self-claim on someone else's serial is theft-adjacent) and 15.02.04 DT-01 (a flag is a weapon in an ownership dispute) arrive at one mechanism from opposite directions |
| CX-02 | [15.01 Identity & Provenance](./15.01-instrument-identity-provenance/) | [15.05 Valuation & Insurance](./15.05-valuation-appraisal-insurance/) | Chain completeness and attestation strength drive value; an appraisal is itself a chain event | Musician, Producer, Operator | High | The domain's Carfax premise: "every transaction enriches a record that makes the next one safer and better-priced" |
| CX-03 | [15.03 Service & Mod History](./15.03-service-repair-modification-history.md) | [15.01.06 Identity Continuity](./15.01-instrument-identity-provenance/15.01.06-identity-continuity-modification.md) | A mod event touching a serial-bearing component can **fork identity** — two records claiming one serial | Musician, Producer, Operator | High | Fender-style serials live on neck plates that are routinely swapped; this is how partscasters get sold as originals |
| CX-04 | [15.03 Service & Mod History](./15.03-service-repair-modification-history.md) | [15.05.01 Automated Valuation](./15.05-valuation-appraisal-insurance/15.05.01-automated-valuation-comps.md) | Originality is the dominant vintage price variable; a mod event flags revaluation and invalidates any appraisal | Musician, Producer, Operator | High | A refinish can halve a vintage instrument's value; a refret barely moves it. The mod's *kind* is the price signal |
| CX-05 | [15.08 Custody](./15.08-custody-loans-consignment.md) | [15.02.01 Theft Report](./15.02-stolen-gear-registry-recovery/15.02.01-theft-report-serial-flagging.md) | **The holder notices; the owner has standing.** Custody decides who can report and whose insurance answers | Musician, Producer, Operator | High | 15.08 DT-02: a studio robbery is discovered by the engineer; the guitar's owner may not know for weeks |
| CX-06 | [15.08 Custody](./15.08-custody-loans-consignment.md) | [15.06 Rig](./15.06-rig-profile-compatibility/) · [15.07 Asset Register](./15.07-studio-backline-asset-register/) | Rigs and room registers are substantially composed of gear held but not owned | Musician, Producer, Operator | High | 15.06.01 DT-02 (a fly rig is defined by what it doesn't include) and 15.07.01 (a room's gear isn't all the room's) independently require the same concept |
| CX-07 | [15.04 Collection & Visibility](./15.04-gear-collection-visibility.md) | [15.01.04 Chain](./15.01-instrument-identity-provenance/15.01.04-provenance-chain-view.md) · [15.07.03 Publication](./15.07-studio-backline-asset-register/15.07.03-backline-list-publication.md) · [15.09 Discography](./15.09-gear-discography.md) | **The exposure hazard.** Every public surface in this domain publishes *what someone owns and what it's worth*. Visibility must be evaluated across their union — and across domains 01/17/18/20 — not per surface | Musician, Producer, Operator, Fan | High | 15.04 DT-01: collection + tour dates + home city = a targeting package. Van and venue theft is endemic (domain rationale). **No single feature's privacy settings can see this composition** |
| CX-08 | [15.09 Gear Discography](./15.09-gear-discography.md) | [15.05.01 Automated Valuation](./15.05-valuation-appraisal-insurance/15.05.01-automated-valuation-comps.md) | Provenance premium — the fact is surfaced, the price is **deliberately not** computed | Musician, Producer, Fan | High | 15.05.01 DT-03: auto-pricing the premium creates a direct incentive to inflate discography claims, which is why 15.09 requires Producer attestation |
| CX-09 | [15.06.01 Rig Definition](./15.06-rig-profile-compatibility/15.06.01-rig-definition-signal-chain.md) | [15.10 Cases & Manifests](./15.10-cases-manifests-carnet-source-data.md) | Two **many-to-many** groupings over one gear set — functional vs physical. Neither is the parent | Musician, Operator | High | A rig spans cases; a case holds parts of several rigs. Volatility differs by an order of magnitude |
| CX-10 | [15.07.03 Backline Publication](./15.07-studio-backline-asset-register/15.07.03-backline-list-publication.md) | [15.06.02 Compatibility Oracle](./15.06-rig-profile-compatibility/15.06.02-compatibility-oracle.md) | The oracle's accuracy is **bounded by the register's freshness** — it can run flawless logic against rotten data and confidently authorise a show that will fail | Musician, Producer, Operator | High | personas.md names the Operator's accidental anti-behaviour: "publishes a stale gear list, so a band arrives to a room that can't run their show" |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Identity & Provenance ↔ Stolen Registry

**Relationship**: Two mechanisms discovered independently turn out to be one. 15.01.02 found that a
self-asserted claim on someone else's serial is a theft-adjacent attack; 15.02.04 found that a
theft flag is a weapon in an ownership dispute. Both are "two parties assert incompatible facts
about one object", and building two dispute systems would be a straightforward duplication. The
flag registry also depends on 15.01's retroactive mint path, because the overwhelming majority of
stolen gear was never registered before it was taken.

**Role scoping**:
- **Musician**: the archetype at both ends — robbed, and wrongly flagged by an ex-bandmate.
- **Producer**: skews to the accused side; they buy a lot of second-hand gear with unvouchable chains.
- **Operator**: the ambiguous case — a flag on backline whose ownership is genuinely unclear after a band dissolution.
- **Fan**: sees only the resulting state on a listing. "Contested" is enough for a buyer.

**Synthesis questions answered**:
1. **Shared state conflict**: The gear record is shared. A flag and a claim are separate facts on it; neither overwrites the other, and their *combination* is what a buyer reads.
2. **Trigger chain**: A theft report on unregistered gear triggers a retroactive mint (15.02.01 DT-01) whose claim is unverifiable by construction. That weakness must survive downstream and not be laundered by the flag's urgency.
3. **Permission intersection**: A contested claim blocks transfer initiation (15.01.03). A flag blocks listing (15.02.02). Both are ownership-adjacent locks and must not contradict each other.
4. **Notification fan-out**: A near-collision at registration ("someone is registering gear that may be yours") is simultaneously a duplicate-detection signal and a theft signal — the same event read two ways.
5. **State transition conflict**: Gear flagged while a transfer is in flight. The sale and the allegation race.

---

### CX-02: Identity & Provenance ↔ Valuation & Insurance

**Relationship**: The domain's economic thesis. A complete, well-attested chain makes an object
worth more and cheaper to insure, which is what motivates maintaining the chain, which makes the
next transaction better — the Carfax loop. The coupling runs both ways: an appraisal is itself an
event on the chain, and the chain's attestation strength is an input to what an appraiser and an
insurer will accept.

**Role scoping**:
- **Musician**: sees the loop's payoff at sale and at claim; carries its cost in the meantime.
- **Producer**: high-value gear, thin comps — the chain matters more precisely where the estimate matters least.
- **Operator**: business insurance makes this routine rather than dramatic.
- **Fan**: sees the estimate on a listing; never the appraisal.

**Synthesis questions answered**:
1. **Shared state conflict**: Valuation writes value facts to the record; identity owns the record. No merge.
2. **Trigger chain**: Chain events (transfer, mod, service) flag revaluation. Flagged, never silent (15.05.01 D-03).
3. **Permission intersection**: Estimates are buyer-visible; appraisals are owner-private (15.05.02 D-02). A public estimate must never be sourced from a private appraisal.
4. **Notification fan-out**: Large appraisal/estimate divergence is worth surfacing — either the market moved or the appraisal is stale.
5. **State transition conflict**: An appraisal landing while a listing is live changes the asking price mid-sale.

---

### CX-03: Service & Mod History ↔ Identity Continuity

**Relationship**: A modification is logged in 15.03 and its identity consequences land in 15.01.06.
When the modified component carries the serial, identity forks: the original body loses its number,
the new assembly gains one it has no history for, and both are registrable. This is the mechanism
by which the registry could *enable* the fraud it exists to prevent.

**Role scoping**:
- **Musician**: does the swap, has no idea they forked an identity.
- **Producer / Operator**: same on re-chassised outboard and rebuilt amps.
- **Fan**: none directly — but this is exactly the fraud a buyer needs protection from.

**Synthesis questions answered**:
1. **Shared state conflict**: Which record keeps the serial? Genuinely unresolved — 15.01.06 Q-01. A product decision, not an implementation detail.
2. **Trigger chain**: A mod event naming a serial-bearing component must trigger a fork decision rather than proceeding silently.
3. **Permission intersection**: The owner decides the fork; a future buyer bears the consequence. The asymmetry should be surfaced.
4. **Notification fan-out**: A fork must be visible on both resulting chains.
5. **State transition conflict**: Body sold to A, neck to B; both register against one serial. The collision case in 15.01's CX-01, arrived at legitimately.

---

### CX-04: Service & Mod History ↔ Automated Valuation

**Relationship**: Originality is the dominant price variable in vintage gear, so the mod log is the
single largest input to valuation — and the *kind* of mod is what carries the signal, which is why
15.01.06 rejects a boolean. A mod also invalidates any existing appraisal, because the appraised
object no longer exists in the form that was appraised.

**Role scoping**:
- **Musician**: discovers the value consequence of a mod they were about to make — arguably the most useful thing this domain can tell them.
- **Producer / Operator**: routine maintenance on old gear constantly crosses the mod line.
- **Fan**: sees an originality summary on a listing.

**Synthesis questions answered**:
1. **Shared state conflict**: None — valuation reads originality state.
2. **Trigger chain**: Mod → revaluation flagged (never silent) + appraisal invalidated. A value that changes quietly after a refret is unauditable.
3. **Permission intersection**: None.
4. **Notification fan-out**: Owner notified; a live listing must reflect it.
5. **State transition conflict**: A mod logged after a sale completes but describing pre-sale work.

---

### CX-05: Custody ↔ Theft Report

**Relationship**: The person who notices the theft and the person entitled to report it are
routinely different people, and the registry is the only thing that knows they're connected. A
studio is robbed; the engineer discovers a session player's guitar is gone; the owner is at home
and won't know for weeks. Insurance inherits the same split — the owner is insured, the holder had
it when it went.

**Role scoping**:
- **Musician**: owner of gear living in someone else's room; also the borrower whose van gets emptied.
- **Producer**: the discoverer, almost always. Their room holds other people's instruments.
- **Operator**: same, at higher volume, with the added ambiguity of hired and abandoned gear.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: Custody and ownership are separate states on one record; both can be true and different.
2. **Trigger chain**: A holder's fault/loss report should reach the owner — this is a capability the platform uniquely has and 15.02.01 currently cannot express (its Q-01).
3. **Permission intersection**: Who has standing to file? Unresolved — 15.08 Q-01.
4. **Notification fan-out**: A theft of gear under custody notifies both parties.
5. **State transition conflict**: Owner and holder file conflicting reports.

---

### CX-06: Custody ↔ Rig · Asset Register

**Relationship**: Both features independently discovered that they contain gear the user doesn't
own — a fly rig is *defined* by the house backline it excludes, and a studio's room is full of
other people's instruments. Neither works if the model assumes ownership implies possession. That
two unrelated features arrived at the same missing concept is the evidence custody is a node and
not a field.

**Role scoping**:
- **Musician**: rigs full of borrowed and house gear.
- **Producer**: a room full of gear belonging to people who left.
- **Operator**: a register that is wrong the moment it assumes everything in the room is theirs.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: Custody is state on the record; rigs and registers reference records. No merge.
2. **Trigger chain**: Custody ending (gear returned) should update rig and register membership. `[PENDING — /ideate-discover Step 5 deepening]`
3. **Permission intersection**: Publishing (15.07.03) or exporting (15.06.03) gear held-not-owned discloses someone else's asset. Real, unresolved.
4. **Notification fan-out**: An owner reclaiming gear affects the room's published list and the band's rig.
5. **State transition conflict**: Gear reclaimed mid-booking, after a band advanced against it.

---

### CX-07: Collection & Visibility ↔ Chain · Publication · Discography

**Relationship**: **The domain's most important cross-cut, and the one no single feature can own.**
Every public surface here publishes some version of *what someone owns and what it's worth*: a
public collection, a provenance chain naming prior owners, a studio's published backline, a gear
discography linking objects to famous records. Each is individually reasonable. Composed — and
composed further with domain 01 (home city), 17/18 (tour dates, which announce *absence*), and 20
(fan reach) — they produce a targeting package: *this person owns £40k of vintage guitars, lives in
Bristol, and is demonstrably in Berlin until the 14th.*

Van and venue theft is endemic; the domain rationale says so and it is why the stolen registry is
the domain's highest-goodwill feature. The bitter irony is that the same domain could make theft
*targeted*, and it would do so through a series of individually-defensible decisions the user made
on different days in different parts of the product.

**No single feature's privacy settings can detect this.** The composition has no owner. That is why
15.04 owns visibility rather than deferring to a global privacy toggle, why 15.07.03 withholds
serials unconditionally rather than offering the Operator a choice, and why this needs to escalate
to a platform-level cross-cut.

**Role scoping**:
- **Musician**: the primary target. Publishing their rig is part of their identity as a player; publishing their tour is their job. Neither feels like a disclosure.
- **Producer**: sharpest tension — a studio's gear list is *marketing*, so the incentive to publish is direct and commercial.
- **Operator**: worst-case exposure — a fixed public address, published opening hours, and a room full of vintage gear.
- **Fan**: the audience the publication exists for, and the population that makes it public rather than professional.

**Synthesis questions answered**:
1. **Shared state conflict**: Visibility is a property of the gear record but is *evaluated* against facts owned by four other domains. Nothing here can see the whole picture.
2. **Trigger chain**: A publication decision must evaluate the union at the moment of publication and warn on the specific composition — a generic "this will be public" notice is useless, because the hazard is invisible precisely by being distributed.
3. **Permission intersection**: The union is the permission. Serials withheld unconditionally (15.07.03 D-02); aggregate value has no public form at all (15.04 D-02); prior owners require per-event consent (15.01.04 DT-03); hidden discography counts are not disclosed (15.09 D-03). Four separate features each closing one hole in one surface.
4. **Notification fan-out**: Publishing high-value gear should warn *at the moment of publication*, naming what else is already public about them.
5. **State transition conflict**: Gear published while private; tour dates published later by a bandmate. The exposure is created by a decision the gear's owner never made — which is the deepest version of the problem.

---

### CX-08: Gear Discography ↔ Automated Valuation

**Relationship**: A deliberate half-connection. A gear discography creates real value — an
instrument played on a famous record is worth a multiple — and 15.05.01 refuses to price it. The
refusal is the interesting part: auto-pricing the premium would create a direct financial incentive
to inflate discography claims, and the mitigation for *that* is 15.09's Producer-attestation
requirement. Surface the fact; let the market price it.

**Role scoping**:
- **Musician**: benefits from the fact being credible; would benefit more from it being priced, which is exactly why it isn't theirs to assert.
- **Producer**: the attester, and the only party with no stake in the resale value.
- **Fan**: reads the fact on a listing and prices it themselves, which is what a market is.
- **Operator**: a studio's gear discography is room marketing rather than resale value.

**Synthesis questions answered**:
1. **Shared state conflict**: None — valuation reads the link and declines to act on it.
2. **Trigger chain**: Deliberately absent. A new discography link does **not** trigger revaluation.
3. **Permission intersection**: The link inherits the credit's visibility (15.09 D-02); a valuation must never leak a hidden session by pricing it.
4. **Notification fan-out**: None.
5. **State transition conflict**: A disputed credit (domain 02) would change a priced premium — another reason not to price it.

---

### CX-09: Rig Definition ↔ Cases & Manifests

**Relationship**: Two many-to-many groupings over one set of gear records. A rig is functional (what
works together); a case is physical (what travels together). They cut across each other by design,
and their volatility differs by an order of magnitude — a rig is stable for months, case membership
changes at every load-out. Forcing either into a tree over the other breaks the other's workflow.

**Role scoping**:
- **Musician**: maintains both, cares about rigs, updates cases under time pressure at 1am.
- **Operator**: cases for hire stock and touring backline.
- **Producer**: marginal — studio gear rarely travels.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: Both reference gear records; neither owns them. No conflict.
2. **Trigger chain**: None inherent. Both are groupings, not processes.
3. **Permission intersection**: Both can contain custody-held gear (CX-06).
4. **Notification fan-out**: A case theft flags every member (15.02.01 D-01), which may span several rigs.
5. **State transition conflict**: Gear repacked between cases while a manifest is out.

---

### CX-10: Backline Publication ↔ Compatibility Oracle

**Relationship**: The oracle's target data is the Operator's published backline, and the Operator's
named accidental failure is letting that list go stale. So the oracle can execute perfectly against
wrong inputs and confidently tell a band their rig will work in a room whose amp died last year —
which is *worse than no oracle*, because the band would otherwise have phoned. The oracle's value is
strictly downstream of 15.07.03's single-source-of-truth design; if the register rots, the oracle
manufactures false confidence in the same shape as a "verified clean" screening result.

**Role scoping**:
- **Musician**: acts on the verdict, bears the consequence at the show.
- **Producer**: same for sessions.
- **Operator**: publishes the data, does not run the check, and is the only party who can fix a mismatch.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: The oracle is a pure reader.
2. **Trigger chain**: A register change should re-run open checks and re-notify. The room that had a working amp last month may not now.
3. **Permission intersection**: The oracle sees only what the Operator published — so an unpublished asset reads as absent, and a band may bring gear the room already has.
4. **Notification fan-out**: A finding should route to the venue as a *requirement* via the spec sheet (15.06.03), because the band cannot fix a voltage mismatch from a tour bus and the venue often can.
5. **State transition conflict**: The check is a snapshot; the show is weeks later. Both the room's list and the band's sheet were true when exchanged and can both be wrong by the date.

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 15.09 Gear Discography | 15.06 Rig Profile & Compatibility | Considered because both group gear around use. Rejected — an instrument's session history has no bearing on whether it fits a venue's power supply, and a rig's signal chain says nothing about what it recorded. Independent lifecycles, no shared state beyond the gear record they both reference. The apparent connection ("gear that plays together") is a pun, not a relationship. |
| R-02 | 15.03 Service & Mod History | 15.10 Cases & Manifests | Considered because both are per-item records that travel with gear. Rejected — a repair log has no bearing on what's packed in which box, and case membership doesn't change an instrument's condition. They share a parent entity and nothing else. |
| R-03 | 15.02 Stolen Registry | 15.07.02 Asset Condition | Considered because both are "something is wrong with this asset" states. Rejected — independent state machines. A dead channel is a maintenance fact with a repair path and no counterparty; a theft flag is a legal-adjacent allegation with a dispute path and an adversary. An asset can be faulty-and-stolen, faulty-and-present, or fine-and-stolen. Merging would force one state machine to model both a repair queue and an ownership dispute. Also recorded at 15.07's level as its R-01. |
| R-04 | 15.05.03 Insurance Claim Pack | 15.09 Gear Discography | Considered because a famous instrument is worth more, and a claim is about value. Rejected as a **direct** pair — the path runs through 15.05.02 (an appraiser prices cultural significance into an appraisal, and the appraisal enters the pack). An insurer evaluates replacement cost from a professional valuation, not from a platform's session-history page. Wiring discography into claim packs would put an unpriceable, unappraised fact into an evidentiary document — the same error as putting an estimate in one (15.05's R-01). |
| R-05 | 15.04 Collection & Visibility | 15.02.02 Point-of-Sale Screening | Considered: should a public collection be screened, or should screening results appear on a collection? Rejected — screening is a **transaction-time** check bound to a listing (domain 13), and a collection is not a transaction. An owner's flagged gear already shows its flag via the chain (15.01.04), so screening the collection would duplicate that with no added protection for anyone. The genuine coupling is the exposure hazard, recorded as CX-07. |

---

## Cross-Cuts Escalated to the Platform Level

> These are mechanisms this domain **discovered but does not own**. Recorded here as pointers; the
> global CX file ([ideation-cx.md](../ideation-cx.md)) is the orchestrator's to write.

| Mechanism | Serves | Why it is not a node in this domain |
|---|---|---|
| **Attestation & counter-attestation** | 02, 05, 09, 15, 24 | The identical mechanic appears here four times (ownership claims, service entries, appraisals, gear discography) and is the platform's core thesis in domains 02 and 09. One mechanism, many domains. |
| **Append-only attested event chain** | 02, 09, 15 | The provenance chain (15.01.04), the credits graph and the chain of title are the same structure — dated events with graded attestation, where confidence is bounded by the weakest link. |
| **Composed-exposure evaluation** | 01, 15, 17, 18, 20, 24 | See CX-07. Value + identity + location + absence compose into a physical-safety hazard that no single domain can see. This domain can only close its own four holes. |
| **Formal document generation** | 09, 15, 18, 23 | This domain alone produces five (claim pack, appraisal, insurance schedule, rig spec sheet, carnet source data). Split sheets, riders and invoices are the same mechanism elsewhere. |
| **Entity ownership (person vs band vs studio vs label)** | 01, 09, 13, 15, 16 | personas.md establishes entities as first-class owners. Every gear record needs one; domain 01 defines it. |
