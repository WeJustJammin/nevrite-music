# Gear Registry & Ownership — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Gear Registry & Ownership](./gear-registry-ownership-index.md)
> **Status**: [DEEP] — 10 children; 19 intra-domain cross-cuts synthesised, 6 pairs rejected, 5 mechanisms escalated to the platform level.
> **Last updated**: 2026-07-18

## Reading this file

Two structural findings from the Step 5 deepening pass frame everything below:

1. **Custody (15.08) is the domain's connective tissue.** Added late (D-04) because four unrelated
   features independently produced wrong answers, it now touches seven of the other nine children —
   identity, theft, service, collection, rig, asset register, and discography. Any child that
   assumes *ownership implies possession* is wrong the moment gear sits in a studio, on loan, with a
   tech, in transit, or on consignment. Custody is where that assumption is corrected once.
2. **The registry never overstates what it knows (D-06).** Almost every cross-cut below is really a
   restatement of this: a gap must render as a gap, not as clean; a stale register must not read as
   fresh; a contested flag must not read as "stolen"; an empty screen must not read as "verified".
   The dangerous failure mode of this domain is not silence — it is false confidence.

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [15.01 Identity & Provenance](./15.01-instrument-identity-provenance/) | [15.02 Stolen Registry](./15.02-stolen-gear-registry-recovery/) | Flags attach to gear identities; a theft report on unregistered gear must mint a record; contested claims and false flags are **one adjudication problem** sharing one dispute path; screening matches the composite key, never the bare serial | Musician, Producer, Operator, Fan | High | 15.01.02 (self-claim on someone else's serial is theft-adjacent) and 15.02.04 (a flag is a weapon in an ownership dispute) meet from opposite directions; DT-10 (mint against a flagged serial proceeds + notifies, never blocks) |
| CX-02 | [15.01 Identity & Provenance](./15.01-instrument-identity-provenance/) | [15.05 Valuation & Insurance](./15.05-valuation-appraisal-insurance/) | Chain completeness and attestation strength drive value; an appraisal is itself a chain event — the Carfax loop | Musician, Producer, Operator | High | Domain premise: "every transaction enriches a record that makes the next one safer and better-priced" |
| CX-03 | [15.01 Identity & Provenance](./15.01-instrument-identity-provenance/) | [15.03 Service & Mod History](./15.03-service-repair-modification-history.md) | Service/repair/mod events are a primary source in the chain timeline; a mod touching a serial-bearing component can **fork identity** (15.01.06) | Musician, Producer, Operator | High | Fender serials live on neck plates routinely swapped; 15.01.04 renders service events; this is how partscasters get sold as originals |
| CX-04 | [15.01 Identity & Provenance](./15.01-instrument-identity-provenance/) | [15.08 Custody](./15.08-custody-loans-consignment.md) | **Ownership and possession are decoupled.** A sale moves ownership before possession; the transfer handshake (15.01.03) and the custody move are separate events on one record | Musician, Producer, Operator | High | 15.08: "a sale moves ownership before possession, so the two states diverge and must be modelled independently"; disputed-custody concurrency must hold both claims, not last-writer-wins |
| CX-05 | [15.01 Identity & Provenance](./15.01-instrument-identity-provenance/) | [15.09 Gear Discography](./15.09-gear-discography.md) | Records-played-on events are sourced into the provenance chain; discography is a read-projection that enriches identity | Musician, Producer, Fan | High | 15.01.04 sources "records-played-on events into the chain"; the provenance premium becomes a chain fact |
| CX-06 | [15.04 Collection & Visibility](./15.04-gear-collection-visibility.md) | [15.01.04 Chain](./15.01-instrument-identity-provenance/) · [15.07.03 Publication](./15.07-studio-backline-asset-register/) · [15.09 Discography](./15.09-gear-discography.md) | **The exposure hazard.** Every public surface here publishes *what someone owns and what it's worth*; visibility must be evaluated across their union — and across domains 01/17/18/20 — never per surface | Musician, Producer, Operator, Fan | High | 15.04: collection + tour dates + home city = a targeting package; van and venue theft is endemic; **no single feature's privacy settings can see this composition** |
| CX-07 | [15.02 Stolen Registry](./15.02-stolen-gear-registry-recovery/) | [15.05 Valuation & Insurance](./15.05-valuation-appraisal-insurance/) | A theft report feeds the insurer claim pack — the domain's peak-value moment; an insurance payout changes title (owner → insurer) **while the flag is live** | Musician, Producer, Operator | High | 15.02.01 → 15.05.03 claim pack; 15.02.04: "a payout changes title while the flag is live; claimant identity under the flag must be reassignable" |
| CX-08 | [15.02 Stolen Registry](./15.02-stolen-gear-registry-recovery/) | [15.08 Custody](./15.08-custody-loans-consignment.md) | **The holder notices; the owner has standing.** Custody decides who can report and whose insurance answers | Musician, Producer, Operator | High | 15.08: a studio robbery is discovered by the engineer; the owner may not know for weeks; 15.02.01 currently cannot express the split (Q-01) |
| CX-09 | [15.02 Stolen Registry](./15.02-stolen-gear-registry-recovery/) | [15.10 Cases & Manifests](./15.10-cases-manifests-carnet-source-data.md) | A van theft is a **case-level event** — the primary filing path is bulk-flag by case/rig, not per-item | Musician, Operator | High | 15.02.01: "a van theft is a case-level event (D-01)"; a case theft flags every member, which may span several rigs |
| CX-10 | [15.03 Service & Mod History](./15.03-service-repair-modification-history.md) | [15.05.01 Automated Valuation](./15.05-valuation-appraisal-insurance/) | Originality is the dominant vintage price variable; a mod flags revaluation and invalidates any prior appraisal | Musician, Producer, Operator | High | A refinish can halve a vintage instrument's value; a refret barely moves it. The mod's *kind* is the price signal |
| CX-11 | [15.04 Collection & Visibility](./15.04-gear-collection-visibility.md) | [15.05 Valuation & Insurance](./15.05-valuation-appraisal-insurance/) | The collection surface shows the owner their **private** aggregate value; that value has no public form at all | Musician, Producer, Operator | High | 15.04: "shows private value (15.05)"; 15.04 D-02: no sortable aggregate value is ever public (the exposure mitigation) |
| CX-12 | [15.04 Collection & Visibility](./15.04-gear-collection-visibility.md) | [15.07 Studio & Backline Asset Register](./15.07-studio-backline-asset-register/) | A personal collection and an org asset register can each hold the **same physical unit** — same object seen through two ownership lenses | Musician, Producer, Operator | Medium | 15.04: "personal vs org register (15.07) can duplicate a physical unit"; resolves through custody + entity ownership |
| CX-13 | [15.04 Collection & Visibility](./15.04-gear-collection-visibility.md) | [15.08 Custody](./15.08-custody-loans-consignment.md) | The collection surface presents **owned-not-held** and **held-not-owned** as first-class lists, not one merged pile | Musician, Producer, Operator | High | 15.08: "surfaces owned-not-held and held-not-owned lists to the user" |
| CX-14 | [15.04 Collection & Visibility](./15.04-gear-collection-visibility.md) | [15.09 Gear Discography](./15.09-gear-discography.md) | A private-collection setting narrows the owner's own surface but **cannot retract an already-public session credit** | Musician, Producer, Fan | High | 15.09: "Private-collection setting cannot retract an already-public session credit (CX-06 tension)" — visibility asymmetry between owner-controlled and attested-public facts |
| CX-15 | [15.06 Rig Profile & Compatibility](./15.06-rig-profile-compatibility/) | [15.08 Custody](./15.08-custody-loans-consignment.md) | A rig is **defined partly by gear held-not-owned** — house backline, borrowed amps; the model breaks if it assumes ownership | Musician, Producer, Operator | High | 15.06.01: a fly rig is defined by what it doesn't include; 15.08: "rigs contain gear held-not-owned" |
| CX-16 | [15.06 Rig Profile & Compatibility](./15.06-rig-profile-compatibility/) | [15.10 Cases & Manifests](./15.10-cases-manifests-carnet-source-data.md) | Two **many-to-many** groupings over one gear set — functional (rig) vs physical (case). Neither is the parent; volatility differs by an order of magnitude | Musician, Operator | High | A rig spans cases; a case holds parts of several rigs; case membership changes at every load-out |
| CX-17 | [15.06 Rig Profile & Compatibility](./15.06-rig-profile-compatibility/) | [15.07 Studio & Backline Asset Register](./15.07-studio-backline-asset-register/) | The compatibility oracle reads the Operator's published backline; its accuracy is **bounded by that register's freshness** | Musician, Producer, Operator | High | personas.md names the anti-behaviour: "publishes a stale gear list, so a band arrives to a room that can't run their show" |
| CX-18 | [15.07 Studio & Backline Asset Register](./15.07-studio-backline-asset-register/) | [15.08 Custody](./15.08-custody-loans-consignment.md) | A room's asset register **wrongly absorbs on-loan / room-resident gear** unless custody exists as a distinct concept | Producer, Operator | High | 15.08: "a room's asset register wrongly absorbs on-loan/room-resident gear unless custody exists" |
| CX-19 | [15.08 Custody](./15.08-custody-loans-consignment.md) | [15.03 Service & Mod History](./15.03-service-repair-modification-history.md) | A tech holding an instrument **is custody**, created by a service booking (domain 05) and closed when the work completes | Musician, Producer, Operator | High | 15.08: "a tech holding an instrument is custody created by a service booking; custody closes when the work completes" |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Identity & Provenance ↔ Stolen Registry

**Relationship**: Two mechanisms discovered independently turn out to be one. A self-asserted claim
on someone else's serial (15.01.02) is a theft-adjacent attack; a theft flag (15.02.04) is a weapon
in an ownership dispute. Both are "two parties assert incompatible facts about one object", and
building two dispute systems would be a straightforward duplication. Two hard couplings run through
this pair: the flag registry depends on 15.01's **retroactive mint path** (most stolen gear was
never registered before it was taken), and screening depends on 15.01.05's **composite key** —
matching a bare serial produces false "stolen" flags on innocent sellers, the domain's worst output.

**Role scoping**:
- **Musician**: the archetype at both ends — robbed, and wrongly flagged by an ex-bandmate.
- **Producer**: skews to the accused side; buys second-hand gear with unvouchable chains.
- **Operator**: the ambiguous case — a flag on backline whose ownership is unclear after a band dissolution.
- **Fan**: sees only the resulting state on a listing. "Contested" is enough for a buyer.

**Synthesis questions answered**:
1. **Shared state conflict**: The gear record is shared. A flag and a claim are separate facts on it; neither overwrites the other, and their *combination* is what a buyer reads. Never auto-merge two claim chains (15.01.01/15.01.05): both claim-holders must consent, source chains preserved as labelled branches.
2. **Trigger chain**: A theft report on unregistered gear triggers a retroactive mint (15.02.01) whose claim is unverifiable by construction; that weakness must survive downstream and not be laundered by the flag's urgency. A mint against a flagged serial (DT-10) **proceeds and notifies** — never blocks — because the registrant is overwhelmingly the innocent buyer or recovering owner.
3. **Permission intersection**: A contested claim blocks transfer initiation (15.01.03); a flag blocks listing (15.02.02). Both are ownership-adjacent locks and must not contradict each other.
4. **Notification fan-out**: A near-collision at registration ("someone is registering gear that may be yours") is simultaneously a duplicate-detection signal and a theft signal — the same event read two ways; it notifies the existing record-holder.
5. **State transition conflict**: Gear flagged while a transfer is in flight, or a flag transitioning active → contested mid-checkout. The purchase-time screen and the transfer mint must resolve in **one transaction** (15.02.02 ↔ 15.01.03) or the race has no clean resolution point.

---

### CX-02: Identity & Provenance ↔ Valuation & Insurance

**Relationship**: The domain's economic thesis. A complete, well-attested chain makes an object
worth more and cheaper to insure, which motivates maintaining the chain, which makes the next
transaction better — the Carfax loop. The coupling runs both ways: an appraisal is itself an event
on the chain, and the chain's attestation strength is an input to what an appraiser and insurer accept.

**Role scoping**:
- **Musician**: sees the loop's payoff at sale and at claim; carries its cost in the meantime.
- **Producer**: high-value gear, thin comps — the chain matters most precisely where the estimate matters least.
- **Operator**: business insurance makes this routine rather than dramatic.
- **Fan**: sees the estimate on a listing; never the appraisal.

**Synthesis questions answered**:
1. **Shared state conflict**: Valuation writes value facts to the record; identity owns the record. No merge.
2. **Trigger chain**: Chain events (transfer, mod, service) flag revaluation — flagged, never silent (15.05.01 D-03).
3. **Permission intersection**: Estimates are buyer-visible; appraisals are owner-private (15.05.02 D-02). A public estimate must never be sourced from a private appraisal.
4. **Notification fan-out**: Large appraisal/estimate divergence is worth surfacing — either the market moved or the appraisal is stale.
5. **State transition conflict**: An appraisal landing while a listing is live changes the asking price mid-sale.

---

### CX-03: Identity & Provenance ↔ Service & Mod History

**Relationship**: Service, repair and modification events are a primary source in the chain timeline
(15.01.04). The dangerous case is a mod touching a serial-bearing component: identity forks
(15.01.06) — the original body loses its number, the new assembly gains one it has no history for,
and both are registrable. This is the mechanism by which the registry could *enable* the fraud it
exists to prevent. Serial *changes* route to 15.01.06 rather than being applied in place; only
reliance-bounded corrections (D-04) are appended events.

**Role scoping**:
- **Musician**: does the swap, has no idea they forked an identity.
- **Producer / Operator**: same on re-chassised outboard and rebuilt amps.
- **Fan**: none directly — but this is exactly the fraud a buyer needs protection from.

**Synthesis questions answered**:
1. **Shared state conflict**: Which record keeps the serial on a fork? Genuinely unresolved — 15.01.06 Q-01. A product decision, not an implementation detail. Corrections append; changes fork.
2. **Trigger chain**: A mod event naming a serial-bearing component must trigger a fork *decision* rather than proceeding silently; disagreeing secondary numbers at mint (DT-06) are a possible-partscaster signal and a fork precursor.
3. **Permission intersection**: The owner decides the fork; a future buyer bears the consequence. The asymmetry should be surfaced.
4. **Notification fan-out**: A fork must be visible on both resulting chains, split at the swap date with shared pre-fork and divergent post-fork history.
5. **State transition conflict**: Body sold to A, neck to B; both register against one serial — the collision case arrived at legitimately.

---

### CX-04: Identity & Provenance ↔ Custody

**Relationship**: Ownership and possession are separate states on one record and routinely diverge.
An ownership transfer (15.01.03) and a custody move (15.08) are decoupled: shipping means ownership
moves before possession. A `held` mint intent is the entry point for a dealer, studio or tech
registering gear they hold but do not own — custody reaching the mint flow (D-04). The custody
record is 15.08's; the gear record is 15.01.01's.

**Role scoping**:
- **Musician**: owner of gear living in someone else's room; also the borrower whose gear is elsewhere.
- **Producer**: the holder, almost always — their room holds other people's instruments.
- **Operator**: same at higher volume, plus hired and abandoned gear.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: Custody and ownership are orthogonal states on one record; both can be true and different. Disputed custody (owner says returned, holder says still held) must hold **both claims**, not last-writer-wins.
2. **Trigger chain**: A confirmed transfer mints a Witnessed claim (15.01.02) without any assertion by the claimant; the custody move is a separate event that may lead or lag ownership.
3. **Permission intersection**: A `held` mint confers no ownership claim (D-03); custody grants no title. Listing rights derive from custody + owner-granted selling rights, never ownership or possession alone.
4. **Notification fan-out**: A stale-custody decaying-confidence nudge (15.08 DT-04) fires to both holder and owner after a silence window.
5. **State transition conflict**: Ownership transferred (shipped) while possession still sits with the seller — the gap between transfer and custody move is where theft/loss standing is ambiguous.

---

### CX-05: Identity & Provenance ↔ Gear Discography

**Relationship**: Records-played-on events are sourced into the provenance chain (15.01.04). The
discography is a read-projection — an instrument played on a famous record is a chain fact that
enriches identity and raises value. The `observed` mint intent (Producer-only) exists so a Producer
can attest session gear whose owner is not a WeJammin user; without it the discography can only
describe already-registered gear, gutting it at cold start (Q-08).

**Role scoping**:
- **Musician**: benefits from the credible fact appearing on their instrument's chain.
- **Producer**: the attester — the only party with no stake in the resale value.
- **Fan**: reads the fact on a listing and prices it themselves.
- **Operator**: a studio's gear discography is room marketing.

**Synthesis questions answered**:
1. **Shared state conflict**: Discography writes session-link events; identity owns the chain. No merge — links are appended.
2. **Trigger chain**: A `observed` attestation mints no ownership claim; it appends a session-link event. A new link does **not** trigger revaluation (see CX-08 in the old numbering / the deliberate half-connection to valuation).
3. **Permission intersection**: The link inherits the credit's visibility (15.09 D-02); the chain must never leak a hidden session. `observed`/`held` mints are rate-limited (5/account/24h) against fabrication.
4. **Notification fan-out**: A near-collision at mint notifies the existing record-holder.
5. **State transition conflict**: A disputed credit (domain 02) changes a chain fact — the chain renders the disputed state honestly, never as clean.

---

### CX-06: Collection & Visibility ↔ Chain · Publication · Discography (THE EXPOSURE HAZARD)

**Relationship**: **The domain's most important cross-cut, and the one no single feature can own.**
Every public surface here publishes some version of *what someone owns and what it's worth*: a
public collection, a provenance chain naming prior owners, a studio's published backline, a gear
discography linking objects to famous records. Each is individually reasonable. Composed — and
composed further with domain 01 (home city), 17/18 (tour dates, which announce *absence*), and 20
(fan reach) — they produce a targeting package: *this person owns £40k of vintage guitars, lives in
Bristol, and is demonstrably in Berlin until the 14th.* DT-12's rejection of gamified/nagged
registration is a direct constraint here: driving users to concentrate their whole collection builds
exactly this package.

**No single feature's privacy settings can detect this.** The composition has no owner — which is
why 15.04 owns visibility rather than deferring to a global toggle, why 15.07.03 withholds serials
unconditionally, and why this escalates to a platform-level cross-cut.

**Role scoping**:
- **Musician**: the primary target. Publishing their rig is part of their identity; publishing their tour is their job.
- **Producer**: sharpest tension — a studio's gear list is *marketing*, so the incentive to publish is commercial.
- **Operator**: worst-case exposure — a fixed public address, published hours, and a room of vintage gear.
- **Fan**: the audience the publication exists for, and the population that makes it public rather than professional.

**Synthesis questions answered**:
1. **Shared state conflict**: Visibility is a property of the gear record but is *evaluated* against facts owned by four other domains. Nothing here can see the whole picture.
2. **Trigger chain**: A publication decision must evaluate the union at the moment of publication and warn on the specific composition — a generic "this will be public" notice is useless because the hazard is invisible by being distributed.
3. **Permission intersection**: The union is the permission. Serials withheld unconditionally (15.07.03 D-02); aggregate value has no public form (15.04 D-02); prior owners require per-event consent (15.01.04 DT-03); hidden discography counts are not disclosed (15.09 D-03). Four features each closing one hole in one surface.
4. **Notification fan-out**: Publishing high-value gear should warn *at the moment of publication*, naming what else is already public about them.
5. **State transition conflict**: Gear published while private; tour dates published later by a bandmate. The exposure is created by a decision the gear's owner never made — the deepest version of the problem.

---

### CX-07: Stolen Registry ↔ Valuation & Insurance

**Relationship**: A theft report (15.02.01) feeds the insurer claim pack (15.05.03) — the domain's
peak-value moment. The complication is that an insurance payout changes title: the insurer becomes
the owner of the recovery interest while the theft flag is still live. The claimant identity under
the flag must be reassignable (owner → insurer) without clearing the flag, because the object is
still stolen — only the beneficiary of its recovery has changed.

**Role scoping**:
- **Musician**: files the report, assembles the pack, and may sign the recovery interest to an insurer.
- **Producer**: same with higher-value, thinner-comp gear.
- **Operator**: routine business insurance; the volume case.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: The theft flag (15.02) and the claim pack (15.05) are separate artifacts on one record; the pack is built from flag + chain + valuation but does not own the flag.
2. **Trigger chain**: Theft report → claim pack assembly → (off-platform) insurer decision → payout → title/beneficiary reassignment. The insurer is off-platform; the boundary is a document (D-08).
3. **Permission intersection**: Only the owner (or a holder with standing, CX-08) can file; only the current title-holder can assemble the pack.
4. **Notification fan-out**: A payout-driven title change notifies both the prior owner and any recovery-coordination participants.
5. **State transition conflict**: Payout reassigns title while the flag is live — a state race the flag lifecycle (15.02.04) must model, because a recovered object now belongs to the insurer, not the reporter.

---

### CX-08: Stolen Registry ↔ Custody

**Relationship**: The person who notices the theft and the person entitled to report it are
routinely different, and the registry is the only thing that knows they're connected. A studio is
robbed; the engineer discovers a session player's guitar is gone; the owner is at home and won't
know for weeks. Insurance inherits the same split — the owner is insured, the holder had it when it
went. When owner and holder differ, both may file, but standing rules are unresolved (Q-04).

**Role scoping**:
- **Musician**: owner of gear living in someone else's room; also the borrower whose van gets emptied.
- **Producer**: the discoverer, almost always.
- **Operator**: same, at higher volume, with hired and abandoned gear.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: Custody and ownership are separate states on one record; both can be true and different.
2. **Trigger chain**: A holder's fault/loss report should reach the owner — a capability the platform uniquely has and 15.02.01 currently cannot express (its Q-01).
3. **Permission intersection**: Who has standing to file? Unresolved — 15.08 Q-01. The holder notices; the owner has standing; both may need to.
4. **Notification fan-out**: A theft of gear under custody notifies both parties.
5. **State transition conflict**: Owner and holder file conflicting reports — the record must hold both, not last-writer-wins.

---

### CX-09: Stolen Registry ↔ Cases & Manifests

**Relationship**: A van theft is a **case-level event** — an entire rig or case is taken at once, so
the primary filing path is bulk-flag by case/rig, not per-item (D-01). Conversely, a case theft flag
must fan out to every member, and because a case's contents cut across rigs (CX-16), a single theft
can flag gear belonging to several functional configurations at once.

**Role scoping**:
- **Musician**: files a van/case theft as one event, not thirty.
- **Operator**: touring backline and hire stock stolen by the case.
- **Producer**: marginal — studio gear rarely travels.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: The case is a grouping (15.10); the flags land on member gear records (15.01/15.02). The case does not own the flag; it addresses a set of them.
2. **Trigger chain**: Case theft → bulk flag over all current members → each member's chain gets a theft event. Membership at time of theft is the set that matters.
3. **Permission intersection**: Standing to file a case theft follows the same custody/ownership rules as a single item (CX-08), scaled to the set.
4. **Notification fan-out**: A case flag notifies every member's owner — which, for held-not-owned gear, may be several parties beyond the filer.
5. **State transition conflict**: Gear repacked between cases while a manifest is out; the flagged set must be the membership at the theft moment, not at flag-processing time.

---

### CX-10: Service & Mod History ↔ Automated Valuation

**Relationship**: Originality is the dominant price variable in vintage gear, so the mod log is the
single largest input to valuation — and the *kind* of mod carries the signal, which is why 15.01.06
rejects a boolean. A mod also invalidates any existing appraisal, because the appraised object no
longer exists in the form that was appraised.

**Role scoping**:
- **Musician**: discovers the value consequence of a mod before making it — arguably the most useful thing this domain can tell them.
- **Producer / Operator**: routine maintenance on old gear constantly crosses the mod line.
- **Fan**: sees an originality summary on a listing.

**Synthesis questions answered**:
1. **Shared state conflict**: None — valuation reads originality state.
2. **Trigger chain**: Mod → revaluation flagged (never silent) + appraisal invalidated. A value that changes quietly after a refret is unauditable.
3. **Permission intersection**: None.
4. **Notification fan-out**: Owner notified; a live listing must reflect it.
5. **State transition conflict**: A mod logged after a sale completes but describing pre-sale work.

---

### CX-11: Collection & Visibility ↔ Valuation & Insurance

**Relationship**: The collection surface (15.04) is where the owner sees their **private** aggregate
value, sourced from 15.05. This is the pair where the exposure principle bites structurally: the
aggregate exists for the owner and for insurance scheduling, but D-02 forbids it from ever having a
public or sortable form — because a sortable aggregate value across users is precisely the target
list CX-06 exists to prevent.

**Role scoping**:
- **Musician**: sees total collection value privately; would never want it ranked publicly.
- **Producer**: high aggregate, high sensitivity.
- **Operator**: the register's aggregate underwrites business insurance.
- **Fan**: no access — aggregate value has no public form.

**Synthesis questions answered**:
1. **Shared state conflict**: Valuation supplies per-item estimates; the collection composes them into a private total. No merge — composition is read-only.
2. **Trigger chain**: An item revaluation (CX-02/CX-10) updates the private aggregate silently; no public surface changes because none exists.
3. **Permission intersection**: The aggregate is owner-only; estimates per item may be buyer-visible on a listing, but never summed publicly (D-02).
4. **Notification fan-out**: A large aggregate swing may prompt an insurance-schedule review nudge to the owner.
5. **State transition conflict**: Item sold/transferred out mid-view — the aggregate recomposes; there is no cached public number to go stale.

---

### CX-12: Collection & Visibility ↔ Studio & Backline Asset Register

**Relationship**: A personal collection (15.04) and an org asset register (15.07) can each contain
the **same physical unit** — a Producer who owns half the studio's mic locker personally sees those
mics both in their collection and in the room's register. The unit is one object viewed through two
ownership lenses (personal entity vs org entity), and resolving the duplication depends on custody
(CX-13/CX-18) and entity ownership (domain 01).

**Role scoping**:
- **Musician**: rarely — personal collection only.
- **Producer**: the archetype — the multi-hyphenate who owns studio gear personally (15.01.01 DT-11).
- **Operator**: the org-register side of the same object.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: One gear record; two registers reference it under two entities. The record is not duplicated — the *view* is. Entity attribution at mint (domain 01, DT-11) decides which register is authoritative for ownership.
2. **Trigger chain**: Not a process — two overlapping membership sets over one record.
3. **Permission intersection**: The personal owner and the org may have different publication rights over the same unit; the stricter governs any public surface.
4. **Notification fan-out**: A change to the unit (sold, moved) must update both views.
5. **State transition conflict**: The Producer sells a personally-owned mic that the room's register still lists — the register must reflect the ownership change, not silently retain it.

---

### CX-13: Collection & Visibility ↔ Custody

**Relationship**: The collection surface presents **owned-not-held** and **held-not-owned** as
distinct first-class lists rather than one merged pile. A user's "collection" is not simply what they
own — it is the intersection and difference of ownership and custody, and conflating them produces
the wrong list at exactly the moment it matters (an insurance schedule, a theft report, a loan-out).

**Role scoping**:
- **Musician**: sees "mine, elsewhere" and "not mine, here" as separate truths.
- **Producer**: a room full of held-not-owned gear that must not read as owned.
- **Operator**: the same at inventory scale.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: Custody (15.08) and ownership (15.01) are separate states; the collection view composes both without merging them.
2. **Trigger chain**: Custody ending (gear returned) should move an item between the held-not-owned and absent states in the view.
3. **Permission intersection**: A held-not-owned item's details are the owner's, not the holder's — the holder's collection view must not disclose the owner's private value or serials.
4. **Notification fan-out**: An owner reclaiming gear updates the holder's held-not-owned list.
5. **State transition conflict**: Gear reclaimed while the holder still lists it — the view must reflect the custody change, not the holder's assumption.

---

### CX-14: Collection & Visibility ↔ Gear Discography

**Relationship**: A private-collection setting (15.04) narrows the *owner's own* surface but cannot
retract an already-public session credit (15.09). The discography link is Producer-attested and
inherits the credit's visibility from domain 02 — so an owner who later privates their collection
cannot un-publish the fact that their instrument played on a released record. This is the visibility
asymmetry between owner-controlled facts and attested-public facts.

**Role scoping**:
- **Musician**: may want privacy after the fact; the public credit persists.
- **Producer**: the attester whose credit created the public link.
- **Fan**: reads the persistent public credit.
- **Operator**: room-marketing discography, deliberately public.

**Synthesis questions answered**:
1. **Shared state conflict**: The collection setting governs the owner's surface; the discography link's visibility is owned by the credit (domain 02). They can disagree, and the credit wins for the public fact.
2. **Trigger chain**: Privating a collection does not cascade to retract public credits — by design.
3. **Permission intersection**: The owner controls collection visibility; the credit's visibility is set at attestation and governed by 02. A private collection cannot leak, but it also cannot retract.
4. **Notification fan-out**: None inherent.
5. **State transition conflict**: Collection privated after a credit is public — the credit stays; the tension is real and unresolvable in this domain's favour (CX-06 exposure genealogy).

---

### CX-15: Rig Profile & Compatibility ↔ Custody

**Relationship**: A rig is **defined partly by gear held-not-owned** — a fly rig is defined by the
house backline it excludes, and a working rig routinely contains borrowed amps and hired pieces. The
rig model breaks if it assumes every member is owned; custody is what lets a rig reference gear the
user holds, borrows, or expects the venue to supply.

**Role scoping**:
- **Musician**: rigs full of borrowed and house gear.
- **Producer**: session rigs mixing owned and studio-resident gear.
- **Operator**: backline the rig depends on but the band does not own.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: Custody is state on the record; rigs reference records. No merge.
2. **Trigger chain**: Custody ending (a borrowed amp returned) should update rig membership or flag the rig incomplete.
3. **Permission intersection**: Exporting a rig spec (15.06.03) that includes held-not-owned gear discloses someone else's asset — real and unresolved (CX-18 sibling).
4. **Notification fan-out**: An owner reclaiming borrowed gear affects any rig that depends on it.
5. **State transition conflict**: Gear reclaimed mid-booking after a band advanced against it — the rig becomes unrunnable and the compatibility check (CX-17) must re-fire.

---

### CX-16: Rig Profile & Compatibility ↔ Cases & Manifests

**Relationship**: Two many-to-many groupings over one set of gear records. A rig is functional (what
works together); a case is physical (what travels together). They cut across each other by design,
and their volatility differs by an order of magnitude — a rig is stable for months, case membership
changes at every load-out. Forcing either into a tree over the other breaks the other's workflow.

**Role scoping**:
- **Musician**: maintains both; cares about rigs, updates cases under time pressure at 1am.
- **Operator**: cases for hire stock and touring backline.
- **Producer**: marginal — studio gear rarely travels.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: Both reference gear records; neither owns them. No conflict.
2. **Trigger chain**: None inherent. Both are groupings, not processes.
3. **Permission intersection**: Both can contain custody-held gear (CX-15, CX-18).
4. **Notification fan-out**: A case theft flags every member (CX-09), which may span several rigs.
5. **State transition conflict**: Gear repacked between cases while a manifest is out.

---

### CX-17: Rig Profile & Compatibility ↔ Studio & Backline Asset Register

**Relationship**: The compatibility oracle's target data is the Operator's published backline
(15.07.03), and the Operator's named accidental failure is letting that list go stale. So the oracle
can execute perfectly against wrong inputs and confidently tell a band their rig will work in a room
whose amp died last year — *worse than no oracle*, because the band would otherwise have phoned. The
oracle's value is strictly downstream of the register's single-source-of-truth design; if the
register rots, the oracle manufactures false confidence in the same shape as a "verified clean"
screening result (D-06).

**Role scoping**:
- **Musician**: acts on the verdict, bears the consequence at the show.
- **Producer**: same for sessions.
- **Operator**: publishes the data, does not run the check, and is the only party who can fix a mismatch.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: The oracle is a pure reader of the register.
2. **Trigger chain**: A register change should re-run open checks and re-notify — the room that had a working amp last month may not now.
3. **Permission intersection**: The oracle sees only what the Operator published; an unpublished asset reads as absent, so a band may bring gear the room already has.
4. **Notification fan-out**: A finding routes to the venue as a *requirement* via the spec sheet (15.06.03), because the band cannot fix a voltage mismatch from a tour bus and the venue often can.
5. **State transition conflict**: The check is a snapshot; the show is weeks later. Both the room's list and the band's sheet were true when exchanged and can both be wrong by the date.

---

### CX-18: Studio & Backline Asset Register ↔ Custody

**Relationship**: A room's asset register **wrongly absorbs on-loan and room-resident gear** unless
custody exists as a distinct concept. A studio is full of instruments belonging to people who left
them there, session players who stored them, and consignors — and a register that assumes everything
in the room is the room's is wrong the moment it is created. Custody is the concept that lets the
register distinguish "ours" from "here".

**Role scoping**:
- **Producer**: configures a register for a room full of other people's gear.
- **Operator**: owns the register and the liability for miscataloguing custody.
- **Musician**: the owner of gear parked in the room, who must not lose title to a register entry.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: The register references gear records; custody state on each record decides whether it is org-owned or merely room-resident. The register does not overwrite ownership.
2. **Trigger chain**: A `held` mint or a custody move places gear in the room without transferring title; custody ending removes it from the org-owned view.
3. **Permission intersection**: Publishing the register (15.07.03) must not disclose a held-not-owned owner's serials or value — the two-access-model problem (house engineer vs visiting producer) lives here.
4. **Notification fan-out**: An owner reclaiming room-resident gear updates the published register and any dependent oracle checks (CX-17).
5. **State transition conflict**: Owner reclaims gear the register still lists as available — a booking may have advanced against it (CX-15 sibling).

---

### CX-19: Custody ↔ Service & Mod History

**Relationship**: A tech holding an instrument **is custody** — created by a service booking (domain
05) and closed when the work completes. The service event (15.03) and the custody window (15.08) are
two facets of one real-world episode: the instrument leaves the owner's possession, gains a service
record, and returns. Modelling the service without the custody loses the fact that the object was
someone else's responsibility while it was worked on.

**Role scoping**:
- **Musician**: hands their guitar to a luthier and stops holding it for two weeks.
- **Producer / Operator**: the same at volume, and sometimes the tech.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: The service record (15.03) and the custody window (15.08) are separate events on one gear record; the service booking (domain 05) is the process that opens both.
2. **Trigger chain**: Service booking → custody opens (tech holds) → work logged (15.03) → work completes → custody closes → gear returns. The booking (05) supplies process; the registry supplies evidence (D-08).
3. **Permission intersection**: The tech, while holding, can add service records but gains no ownership claim (D-03); the owner retains title throughout.
4. **Notification fan-out**: Custody opening and closing notifies the owner; a stale-custody nudge fires if the window runs long (15.08 DT-04).
5. **State transition conflict**: A theft during the service window (CX-08) — the tech holds, the owner has standing; both must be reachable.

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 15.09 Gear Discography | 15.06 Rig Profile & Compatibility | Considered because both group gear around use. Rejected — an instrument's session history has no bearing on whether it fits a venue's power supply, and a rig's signal chain says nothing about what it recorded. The apparent connection ("gear that plays together") is a pun, not a relationship. Independent lifecycles; only the shared gear record connects them. |
| R-02 | 15.03 Service & Mod History | 15.10 Cases & Manifests | Considered because both are per-item records that travel with gear. Rejected — a repair log has no bearing on what's packed in which box, and case membership doesn't change an instrument's condition. They share a parent entity and nothing else. |
| R-03 | 15.02 Stolen Registry | 15.07.02 Asset Condition | Considered because both are "something is wrong with this asset" states. Rejected — independent state machines. A dead channel is a maintenance fact with a repair path and no counterparty; a theft flag is a legal-adjacent allegation with a dispute path and an adversary. An asset can be faulty-and-stolen, faulty-and-present, or fine-and-stolen. Merging would force one machine to model both a repair queue and an ownership dispute. |
| R-04 | 15.05.03 Insurance Claim Pack | 15.09 Gear Discography | Considered because a famous instrument is worth more and a claim is about value. Rejected as a **direct** pair — the path runs through 15.05.02 (an appraiser prices cultural significance into an appraisal, and the appraisal enters the pack). An insurer evaluates replacement cost from a professional valuation, not from a session-history page. Wiring discography into claim packs would put an unpriceable, unappraised fact into an evidentiary document. |
| R-05 | 15.04 Collection & Visibility | 15.02.02 Point-of-Sale Screening | Considered: should a public collection be screened, or should screening results appear on a collection? Rejected — screening is a **transaction-time** check bound to a listing (domain 13), and a collection is not a transaction. An owner's flagged gear already shows its flag via the chain (15.01.04), so screening the collection would duplicate that with no added protection. The genuine coupling is the exposure hazard (CX-06). |
| R-06 | 15.05 Valuation & Insurance | 15.06 Rig Profile & Compatibility | Considered because a rig is a set of valued gear and one might want a rig's total value. Rejected — a rig is a functional configuration for *compatibility*, not an ownership or insurance set; it routinely contains gear the user doesn't own (CX-15), so summing its value would total someone else's assets. Value composition belongs to the collection (CX-11) and the asset register, which are ownership sets. The rig references records; it is not a valuation container. |

---

## Cross-Cuts Escalated to the Platform Level

> Mechanisms this domain **discovered but does not own**. Recorded here as pointers; the global CX
> file ([ideation-cx.md](../ideation-cx.md)) is the orchestrator's to write.

| Mechanism | Serves | Why it is not a node in this domain |
|---|---|---|
| **Attestation & counter-attestation** | 02, 05, 09, 15, 24 | The identical mechanic appears here four times (ownership claims, service entries, appraisals, gear discography) and is the platform's core thesis in domains 02 and 09. One mechanism, many domains — graded-confidence attestation over arbitrary record events, distinct from contract e-signature. |
| **Append-only attested event chain** | 02, 09, 15 | The provenance chain (15.01.04), the credits graph and the chain of title are the same structure — dated events with graded attestation where confidence is bounded by the weakest link. |
| **Composed-exposure evaluation** | 01, 15, 17, 18, 20, 24 | See CX-06. Value + identity + location + absence compose into a physical-safety hazard no single domain can see. This domain can only close its own four holes; the cross-domain evaluator has no home. |
| **Formal document generation** | 09, 15, 18, 23 | This domain alone produces five (claim pack, appraisal, insurance schedule, rig spec sheet, carnet source data). Split sheets, riders and invoices are the same mechanism elsewhere. |
| **Custody / possession-vs-ownership tracking** | 05, 13, 15, 16, 18 | Custody (15.08) is modelled here but leaks outward: listing/consignment rights (13) derive from it, a service booking (05) creates it, room-resident gear (16) depends on it, and touring gear (18) moves through it. The concept is broader than one domain — flagged for the platform. |
| **Entity ownership (person vs band vs studio vs label)** | 01, 09, 13, 15, 16 | personas.md establishes entities as first-class owners. Every gear record needs one; domain 01 defines it. |
