# Show Production & Touring — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Show Production & Touring](./show-production-touring-index.md)
> **Status**: [BREADTH] — 20 children classified; intra-domain cross-cuts mapped 2026-07-16.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [18.04 Riders](./18.04-riders/) | [18.03 Show Advancing](./18.03-show-advancing/) | The structured rider is one of the diff's two inputs; advancing consumes riders and never mutates them | Producer, Operator, Musician | High | 18.03 D-01; 18.04 D-02 — one rider serves 40 advances |
| CX-02 | [18.05 Stage Plot & Input List](./18.05-stage-plot-input-list/) | [18.03 Show Advancing](./18.03-show-advancing/) | Channel count vs console/stage-box is the highest-consequence comparison in the diff | Producer, Operator | High | 18.05.02 DT-02 — exceeding the console means the show cannot run as written |
| CX-03 | [18.06 Setlist & Show Files](./18.06-setlist-show-files/) | [18.07 Show Day Schedule](./18.07-show-day-schedule/) | Set duration is the schedule's primary derived input; its uncertainty propagates into the curfew margin | Producer, Musician, Operator | High | 18.06.01 D-01/D-02; 18.07.02 D-03 |
| CX-04 | [18.08 Crew & Credentials](./18.08-crew-credentials/) | [18.04 Riders](./18.04-riders/), [18.12 Travel](./18.12-travel-logistics/), [18.13 Tour Finance](./18.13-tour-finance/) | **Party size** silently drives catering quantities, beds and per diems across three sub-domains | Producer, Musician, Operator | High | 18.08.01 D-04; 18.04-riders-cx CX-02; 18.12-cx CX-01; 18.13-cx CX-03 |
| CX-05 | [18.07 Show Day Schedule](./18.07-show-day-schedule/) | [18.08 Crew & Credentials](./18.08-crew-credentials/), [18.10 Day Sheet](./18.10-day-sheet.md) | Call times derive from the timeline; every distributed sheet stales when it slips | Producer, Musician, Operator | High | 18.08.01 D-01; 18.10 DT-02 |
| CX-06 | [18.07 Show Day Schedule](./18.07-show-day-schedule/) | [18.12 Travel & Ground](./18.12-travel-logistics/), [18.11 Tour Routing](./18.11-tour-container-routing/) | **The cross-day cascade** — tonight's late load-out breaks tomorrow's legal drive, then the route, then the budget | Producer, Musician | High | 18.07.03 DT-05; 18.12.03 DT-04; 18.12-cx CX-02 |
| CX-07 | [18.09 Backline & Gear Manifest](./18.09-backline-gear-manifest/) | [18.03 Show Advancing](./18.03-show-advancing/) | A diff shortfall triggers rental sourcing; the confirmed rental returns as a date-scoped manifest entry | Producer, Operator | High | 18.09.02 DT-01 — the one loop where the platform detects a problem and completes the fix |
| CX-08 | [18.18 Post-Show Report](./18.18-post-show-report.md) | [18.03 Show Advancing](./18.03-show-advancing/) | **The venue-truth loop** — corrections from people who were in the room keep the diff honest | Producer, Operator | High | 18.18 DT-01; 18.03.02 DT-04 — a confidently wrong diff is worse than none |
| CX-09 | [18.09 Backline & Gear Manifest](./18.09-backline-gear-manifest/) | [18.14 Border, Visas & Carnets](./18.14-border-visas-carnets/) | A carnet **is** the manifest in a customs format — a projection, not a new document | Producer, Musician | High | 18.14.02 DT-01/D-01 |
| CX-10 | [18.11 Tour Container](./18.11-tour-container-routing/) | everything tour-scoped | The tour is the scope at which riders, rosters, budgets and manifests are held | Producer, Musician | High | 18.11.01 DT-01 — remove the container and every scope collapses to per-date |
| CX-11 | [18.02 Bill & Support Acts](./18.02-bill-support-acts.md) | [18.07 Show Day Schedule](./18.07-show-day-schedule/), [18.04 Riders](./18.04-riders/) | The bill scopes and orders objects it doesn't own — set times, changeovers, per-act rider privacy | Producer, Operator, Musician | Medium | 18.02 DT-01/DT-02 |
| CX-12 | [18.19 Rehearsal](./18.19-rehearsal-management.md) | [18.06 Setlist](./18.06-setlist-show-files/) | Rehearsal is where real set durations are first measured — and CX-03's uncertainty originates in their absence | Producer, Musician | Medium | 18.19 DT-02; 18.07.02 D-03 |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Riders → Show Advancing

**Relationship**: The domain's foundational edge. Advancing computes a diff between what the act
needs (the rider) and what the room has (domain 16). Neither exists in the other's node: the rider
is authored once and reused across forty dates; the advance is a per-date reconciliation. The
separation (18.03 D-01) is what stops Manchester's missing wedges from editing a rider that serves
39 other rooms.

**Role scoping**:
- **Producer**: authors the rider, runs the advance, and is the only role that sees both as one workflow.
- **Operator**: reads the resolved rider for their date; sees neither the rider's other dates nor its version history.
- **Musician**: contributes to the rider, sees the negotiated outcome on the day sheet.
- **Fan**: no visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: The rider is owned by the act and **immutable from advancing's perspective**. Per-date variation is a redline (bilateral, 18.03.03) or an override (unilateral, 18.04.04) — never an edit. Three writers exist across this edge (act, venue, negotiation) and each writes to a different object.
2. **Trigger chain**: Rider version resolved → diff runs → items generated → redlines resolve shortfalls → freeze. A rider change mid-tour re-diffs upcoming dates only; advanced dates hold their version (18.04-riders-cx CX-01).
3. **Permission intersection**: The Operator can read the rider but can only write a redline. The one exception across the whole domain is the input list's patch column (CX-02).
4. **Notification fan-out**: A recurring redline across dates signals the *rider* is wrong (18.03.03 edge case 4) — an aggregate insight only the platform can see, because only it holds every date.
5. **State transition conflict**: A frozen advance references a rider version; access requirements deliberately do not version (18.04-riders-cx CX-03), so a freeze cannot trap a new access need arising mid-tour.

### CX-02: Stage Plot & Input List → Show Advancing

**Relationship**: The input list's channel count is diffed against the room's console and stage box,
and it is the diff's highest-consequence comparison: most shortfalls are inconvenient, but exceeding
the channel count means the show cannot run as specified. It's also a pure integer comparison — the
cheapest check in the domain with the most expensive failure.

**Role scoping**:
- **Producer**: reads the count against the room while there's still time.
- **Operator**: supplies console channels and stage-box lines as **separate** facts (18.05.02 D-03), and writes the patch column — the domain's only venue-writable field in an act's document.
- **Musician**: unaffected until soundcheck.
- **Fan**: no visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: The act owns the sources; the venue owns the patch. Column-level co-authorship in one document — unique in this domain and worth flagging to whoever specs permissions.
2. **Trigger chain**: Plot changes → rows regenerate → count changes → diff re-runs → a patch already assigned may invalidate (18.05-cx CX-04).
3. **Permission intersection**: A venue editing their console spec in 16 silently re-validates every act advancing that room (18.07-cx CX-01 §3 records the same pattern for curfew).
4. **Notification fan-out**: A post-patch plot change must reach the house engineer, or they set the stage to a stale patch.
5. **State transition conflict**: Row identity must be stable across regeneration, or the patch column corrupts on re-order.

### CX-03: Setlist & Show Files → Show Day Schedule

**Relationship**: The domain's arithmetic spine. Set duration → set times → changeover → curfew
margin → whether the venue is fined. Every number in that chain is currently a TM's guess, because
the setlist lives on paper. The coupling is numeric and unavoidable — the only question is whether
anyone computes it.

**Role scoping**:
- **Producer**: sees the margin and decides what gives.
- **Musician**: owns the setlist and rarely connects it to the venue's licence.
- **Operator**: gets the duration, never the songs (18.06 D-03).
- **Fan**: sees the public consequence — a short set, a hard stop.

**Synthesis questions answered**:
1. **Shared state conflict**: The setlist owns durations; the schedule owns times. The schedule reads and never writes — but measured durations from the performed setlist (18.06.04) flow back into the plan, so the loop closes through a third object.
2. **Trigger chain**: Setlist change → set duration → schedule → curfew re-check. A song added at 17:00 can breach a licence condition, and nobody currently makes that connection.
3. **Permission intersection**: Band members have Full access to the setlist; a re-order by a member can therefore move a venue's curfew margin. **Permission in the act's most private document reaches into the venue's legal exposure** — a genuinely surprising path.
4. **Notification fan-out**: A margin change should reach the Operator, because they pay the fine (18.07.02 DT-05).
5. **State transition conflict**: Estimated durations produce an estimated margin (±8 min on a 4-min margin means nobody knows). The uncertainty must propagate visibly and is the strongest argument for CX-12.

### CX-04: Crew & Credentials → Riders, Travel, Tour Finance

**Relationship**: **The domain's widest silent coupling.** The roster's head count drives catering
quantities (18.04.02 D-01), beds (18.12.02), and per diems (18.13.01 D-01). Adding one merch seller
changes a rider obligation, a hotel booking and a payout — three sub-domains, none of which the
person edited. The "catering for 5, touring party of 9" failure exists entirely because nobody
connects them.

**Role scoping**:
- **Producer**: makes the roster edit; must see all three consequences.
- **Musician**: eats, sleeps and is paid according to a number they never see.
- **Operator**: must cater for a party size that changed after they agreed to it.
- **Fan**: no visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: The roster owns people; each consumer derives its own quantity. **The roster needs a type dimension** — touring party vs local labour — or a naive `count(roster)` caters for stagehands and books them hotel rooms (18.08-cx CX-02 §3). This is the single most actionable modelling finding in the domain.
2. **Trigger chain**: Roster change → three derivations re-run → if any date is frozen, three change-control events.
3. **Permission intersection**: Adding a crew member is a Producer action in 18.08 that mutates an obligation to the Operator in 18.04. Cross-sub-domain, cross-party, and currently silent.
4. **Notification fan-out**: The venue must be told the party grew — the domain's most common late change, originating outside the advance.
5. **State transition conflict**: A version pins the rider's items but must not pin a stale head count (18.04-riders-cx CX-02 §5).

### CX-05: Show Day Schedule → Crew & Day Sheet

**Relationship**: Call times are a function of the schedule ("backline: load-in minus 15"), and the
day sheet renders the whole thing. Both are derivations, so both follow slippage for free — which is
the entire reason to derive rather than type. A typed call time is stale the moment the truck is
late, which is exactly when it matters.

**Role scoping**:
- **Producer**: slips one item; nine call times move and nine people are told.
- **Musician**: gets their own call, on their phone, without asking.
- **Operator**: receives the venue-scoped slice only.
- **Fan**: no visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: The schedule owns times; call rules own offsets; neither is the day sheet, which owns nothing.
2. **Trigger chain**: Slip → calls recompute → sheets re-render → affected roles re-notified. Only affected roles — blanket re-sends train people to ignore them.
3. **Permission intersection**: The Operator slips a venue-side item and moves the act's crew's call times.
4. **Notification fan-out**: The domain's largest, and it needs acknowledgement on critical changes (18.03.05 D-04) — an unopened notification at 17:00 is a crew member at the wrong door.
5. **State transition conflict**: Offline recipients never get the change; the version stamp is the only cue (18.10 edge case 2).

### CX-06: Show Day Schedule → Travel & Routing (the cross-day cascade)

**Relationship**: **The most valuable finding in this domain, and the hardest to see.** A load-out
running to 00:30 breaks the driver's mandatory rest, which makes tomorrow's 09:00 departure illegal,
which makes the leg infeasible, which forces a travel day, which costs a hotel night and nine per
diems. Six hops, four sub-domains, one cause. **No incumbent connects hop 1 to hop 6** — and the
platform holds every link.

**Role scoping**:
- **Producer**: the only person who could act, if they could see it.
- **Musician**: is the driver (18.12.03 D-01) and the person who doesn't sleep.
- **Operator**: **caused it and never sees the consequence** — their room ran late; the cost lands two cities away.
- **Fan**: no visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: Each sub-domain owns its own object; the cascade is a chain of derivations across four of them. Nothing is co-owned — which is why nobody notices.
2. **Trigger chain**: Load-out slips (18.07.03) → rest breach (18.12.03) → leg infeasible (18.11.02) → human adds a travel day → accommodation + per diems (18.12.01, 18.13.01) → budget (18.13.02). The system may compute and surface; it must not decide (18.11-cx CX-03).
3. **Permission intersection**: The Operator's action creates the act's cost. There is no mechanism — and arguably no basis — to show them that.
4. **Notification fan-out**: The warning must reach the Producer *tonight*, while there's still a decision. By tomorrow morning it's a fact.
5. **State transition conflict**: The rest clock starts at the actual load-out, not the planned one — so the cascade depends entirely on someone recording the actual (18.07.03 DT-03). The whole chain is downstream of the domain's weakest link.

### CX-07: Backline & Gear Manifest ↔ Show Advancing

**Relationship**: The one loop where the platform **detects a problem and can complete the
transaction that fixes it**. The diff finds no bass rig; sourcing rents one; the rental lands on the
manifest; the advance item closes. Every other flow ends in a document or a decision. This one ends
in money moving, which is why it's the clearest argument that 18 and 13/16 belong on one platform.

**Role scoping**:
- **Producer**: decides bring/rent/substitute/redline.
- **Operator**: often the supplier — giving them a **commercial reason to keep capability data accurate**, which is the incentive the diff otherwise lacks (18.09.02 DT-03).
- **Musician**: plays something that isn't theirs.
- **Fan**: no visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: Owned items reference registry 15; rented items belong to a supplier and exist for one date. They cannot share an ownership model (18.09 Q-02, unresolved).
2. **Trigger chain**: Shortfall → rental → manifest → plot → load-out check. If the rental never arrives, the manifest promised something that doesn't exist.
3. **Permission intersection**: A venue-supplied rental is the Operator's item on the act's manifest — item-level visibility inside one document.
4. **Notification fan-out**: The aggregate insight (rented on 9 of 11 dates → carry it) exists only because the tour is one object (CX-10).
5. **State transition conflict**: A cancelled rental must re-open the shortfall, not vanish — otherwise the diff believes the gap was solved.

### CX-08: Post-Show Report → Show Advancing (the venue-truth loop)

**Relationship**: The loop that keeps the wedge honest. Domain 16's capability data is **self-reported
by Operators with an incentive to overstate**, and a confidently wrong diff is worse than no diff
because it removes the TM's instinct to check (18.03.02 DT-04). The post-show report is the only
mechanism that corrects it — evidence from people who were in the room.

**Role scoping**:
- **Producer**: files the substantive report; their attestation is the highest-trust input.
- **Operator**: sees discrepancies raised against them with a right of reply; corroboration required before a listing changes.
- **Musician**: files the short version.
- **Fan**: no visibility — this is not a review (18.18 D-01).

**Synthesis questions answered**:
1. **Shared state conflict**: 16 owns the listing; the report proposes a correction; **one report never rewrites it** (18.18 D-02). Single-source correction is weaponisable.
2. **Trigger chain**: Report → discrepancy → corroboration threshold → 16 corrected → the next diff is better. A slow loop that compounds — and the domain's only self-improving mechanism.
3. **Permission intersection**: An artist's factual claim about a room can change what every other artist sees about it. That power needs the corroboration threshold and the right of reply, or it's a weapon.
4. **Notification fan-out**: The Operator must be told and given a chance to correct — otherwise the loop is adversarial and they disengage, which is fatal given index Q-05.
5. **State transition conflict**: Reports are pre-filled from schedule variance (18.18 DT-04), which requires someone to have recorded actuals (18.07.03). **The truth loop depends on the domain's weakest link**, exactly as CX-06 does.

### CX-09: Backline & Gear Manifest → Border, Visas & Carnets

**Relationship**: The most literal instance of the consolidation dividend (D-18) in this domain. A
carnet is a serial-numbered, valued list of every item — which is the manifest, in a customs format.
Today someone types it from scratch off the backs of amplifiers. The platform holds (or references
via 15) every field it needs.

**Role scoping**:
- **Producer**: assembles it from the manifest and works with the carnet agent.
- **Musician**: their gear, their serials, their impounded instrument if the list is wrong.
- **Operator**: no involvement.
- **Fan**: no visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: The manifest is the source; the carnet is a projection — but a projection that, once issued, **cannot be re-versioned** (18.14-cx CX-01 §5). This is the only object in the domain where the change-control instinct hits a hard external wall: a chamber of commerce does not accept a version bump.
2. **Trigger chain**: Crossing → carnet list generated → gaps flagged (missing serials) → agent issues → each crossing stamped → discharge reconciles against the manifest.
3. **Permission intersection**: Serials and values come from 15, which belongs to the person, not the act.
4. **Notification fan-out**: A mid-tour loss (18.09.03) breaks the discharge — the failure surfaces at the *last* border, when you're trying to go home.
5. **State transition conflict**: The requirement lands on 15's data model (serial, value, origin, weight — index Q-09). It originates here and 15 may not know.

### CX-10: Tour Container → everything tour-scoped

**Relationship**: The container is the scope at which riders, rosters, budgets and manifests are
held. It is also what makes the domain's aggregate insights possible: rented on 9 of 11 dates
(CX-07), redlined on 7 of 9 (CX-01), this leg is illegal (CX-06). **No tour manager sees the
aggregate, because they solve each date as it arrives.** The platform sees the whole route at once,
and that is a capability the container creates rather than a report it renders.

**Role scoping**:
- **Producer** / **Musician**: Full — it's their run.
- **Operator**: **None, anywhere in the tour scope.** A venue is a node on someone's tour; the route is competitively sensitive and not theirs.
- **Fan**: announced dates only, via 20/21.

**Synthesis questions answered**:
1. **Shared state conflict**: The container owns sequence and scope; every sub-domain owns its own object attached to it. Ownership of the container itself is contested with 17 (index Q-04).
2. **Trigger chain**: Date added/removed → feasibility re-runs → tour book invalidates → attached scopes adjust.
3. **Permission intersection**: The Operator's total exclusion here is a deliberate firewall, and the inverse of 18.01 D-01 (crew must not see the fee).
4. **Notification fan-out**: A hold dropping in 17 can silently make the rest of the route infeasible — the consequence is two cities away and nobody is looking.
5. **State transition conflict**: The container must be **optional** (18.11.01 D-04) — most working musicians play one-off dates, not runs, and tour-scoped objects must fall back to act level. This matters for the beachhead.

### CX-11: Bill & Support Acts → Schedule, Riders

**Relationship**: Medium confidence — the bill *scopes and orders* objects it doesn't own. Set
lengths and changeovers are the schedule's input; per-act rider privacy is a confidentiality rule
applied to riders. This is exactly why the bill is a feature and not a sub-domain (18.02 DT-01): it
adds a dimension to existing objects rather than owning new ones.

**Role scoping**:
- **Producer**: sets order and lengths; decides what is shared vs private.
- **Operator**: sees the whole bill (they must schedule it) but only technical needs per act.
- **Musician**: as support, sees their slot and shared kit — never the headliner's rider, fee or guest list.
- **Fan**: the public bill only.

**Synthesis questions answered** _(Medium confidence — remainder deferred to Step 5)_:
1. **Shared state conflict**: Shared objects (house kit, input list, changeover) vs private ones (riders, guest lists). Default-private per act, enforced at the data layer, not the UI (18.02 DT-02).
3. **Permission intersection**: The domain's highest-consequence confidentiality boundary — a support act seeing the headliner's fee is relationship-ending.
5. **State transition conflict**: A support dropping out day-of frees time and recomputes the schedule and the curfew margin.

### CX-12: Rehearsal → Setlist

**Relationship**: Medium confidence, and small with a wide blast radius. Rehearsal is the only place
a **real** set duration exists before the first show. Every downstream number in CX-03 — set times,
changeover, curfew margin — currently inherits an estimate typed by a TM, and the cost of that
imprecision lands at 22:50 on the venue's licence (18.07-cx CX-03 §5). Nothing today writes measured
durations back.

**Role scoping**:
- **Producer**: times the set for real and signs off production readiness.
- **Musician**: rehearses; their setlist gets more accurate.
- **Operator**: never sees rehearsal, but benefits from a curfew margin computed on real numbers.
- **Fan**: no visibility.

**Synthesis questions answered** _(Medium confidence — remainder deferred to Step 5)_:
2. **Trigger chain**: Songs run → durations measured → written back to the setlist → schedule and curfew margins firm up. Also closed by the performed setlist (18.06-cx CX-03) once the tour is running.
5. **State transition conflict**: Most acts don't rehearse (18.19 edge case 5). The readiness checklist exists unticked, and the estimates persist — which is the normal case, not the exception.

---

## Cross-Cuts Extracted (mechanisms, not nodes)

> Candidates and recurring patterns that are **mechanisms serving many domains**. No node created —
> these belong in [ideation-cx.md](../ideation-cx.md), which the orchestrator owns.

| Mechanism | Serves | Why it's a cross-cut, not a node |
|---|---|---|
| **Document Generation & Distribution** | 18 (advance sheet, day sheet, tour book, setlist output), 09, 11, 17, 19 | Four artifacts in this domain alone share one primitive: compile held data → scope by recipient → version → distribute → supersede. Building it four times would be an obvious duplication (18.11.03 DT-01). |
| **Approval, Countersign & Attestation** | 18 (advance confirmation, redline acceptance, performed setlist), 02 (credit counter-attestation), 09 (split sign-off), 17 (contracts) | "Two parties confirm a fact and both identities are recorded" is the same mechanism everywhere. It is also the platform's thesis mechanism (D-18) — self-assertion is weaker evidence than counter-confirmation. |
| **Event Access Control & Credentialing** | 18 (crew passes), 19 (tickets) | A laminate and a ticket are both "this identity may enter this area now", scanned at the same door by the same person. Only issuance differs (18.08.02 DT-01). |
| **Notifications & Alerts (with acknowledgement)** | Global; acutely 18 (schedule slippage, advance changes, deadlines) | Domain 18 adds a requirement the general mechanism may not have: **acknowledgement tracking**, because an unopened notification at 17:00 is a crew member at the wrong door (18.03.05 D-04). |
| **Payouts & Money Movement** | Global; 18 (per diems, local crew, backline rentals, merch cash) | 18 adds an unusual requirement: **cash is first-class** (18.13 D-04). A payouts rail that assumes electronic money describes a tour that doesn't exist. |
| **Real-Time Presence & Live Document Sync** | Already a cross-cut per D-15; 18 (live slippage), 07, 08 | The show-day timeline is a live document multiple parties mutate under time pressure — the same transport D-15 extracted from domain 08. |
| **Document Custody, Validity & Verification** | 18 (insurance certs, visas, carnets), 15 (proof of ownership), 09 | "A document with an issuer, a validity window, and a human who accepts it" recurs across insurance, immigration, customs and ownership proof. Note 18's finding: **validity must be evaluated against the event date, not today** (18.16 D-02). |
| **File/Asset Custody & Versioning** | 18 (show files), 07 (project stems), 12 (release masters) | "Which version is current, and what's on the other machine?" is one problem in three contexts (18.06.03 DT-02). |
| **Structured Requirement ↔ Capability Diff** | 18 (rider vs venue), 04 (role vs musician), 05 (brief vs provider), 16 | ⚠️ **Medium confidence.** The *mechanism* (structured requirement set vs structured capability set → match/shortfall/unknown, with an equivalence model) plausibly recurs. The **venue diff and its gear equivalence model stay domain-owned** — only the shape generalises (18.03.02 DT-05). Flagged rather than asserted. |
| **Geo & Mapping** | 18 (drive times, distances), 16, 17, 03, 04 | Distance, geocoding and travel time serve discovery, booking and routing alike. |
| **Calendar & Availability** | 16, 17, 18, 06, 05 | The venue's calendar, the act's dates and a person's availability are one mechanism seen from three sides. |

## Not-Product (routed out)

> Architecture, infrastructure and NFR concerns wearing a product costume. Routed to `/create-prd`.

| Concern | Route to | Why it is not product |
|---|---|---|
| **Offline-capable data access on show day** | `/create-prd-architecture` | An NFR — but a **product-shaping** one. Three features independently demand it (18.06.02 D-03, 18.07.03 Q-01, 18.10 Q-01) and it is this domain's strongest input to the mobile/PWA surface question in `meta/constraints.md`. Routed, but flagged as consequential rather than incidental. |
| **Mapping / traffic / drive-time data provider** | `/create-prd-stack` | Build-vs-buy for a data source. The *feasibility check* (18.11.02) is product; the drive-time computation behind it is a vendor decision. |
| **Weather data provider integration** | `/create-prd-stack` | The *thresholds and decision chain* (18.17) are product; the forecast feed is an integration. |
| **PDF / document rendering pipeline** | `/create-prd-architecture` | The render primitive behind the Document Generation cross-cut. Mechanism, not capability. |
| **On-stage playback, timecode and MIDI/OSC device integration** | `/create-prd-architecture` | Only relevant if 18.06.03 Q-01 lands on format-specific export. Note the domain's D-05 rejects the playback *engine* as product scope — this routes only the export/integration surface. |
| **Receipt OCR / image capture** | `/create-prd` (build/buy) | Generic and solved elsewhere. The **float** is the music-specific part and stays product (18.13.03 DT-04). |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 18.06 Setlist & Show Files | 18.04 Riders | No shared state, no trigger. Both are act-authored and both reach the venue, but the rider is *what the room must provide* and the setlist is *what the act plays* — the venue never sees the setlist at all (18.06 D-03). The only connection is duration, which flows through the schedule (CX-03), not through the rider. |
| R-02 | 18.14 Border, Visas & Carnets | 18.04 Riders | Considered: does crossing a border change what the act needs from a room? Rejected — a rider is technical and hospitality, and a border changes neither. The rider is unaffected by geography; only the *people and things* crossing are (CX-04's roster, CX-09's manifest). |
| R-03 | 18.17 Weather & Contingency | 18.04 Riders | Considered: does weather change hospitality (a hot day needs more water)? Rejected as trivially real but structurally empty — no shared state, no trigger dependency worth modelling. Adding this edge would be modelling common sense as a feature. |
| R-04 | 18.20 Green Touring | 18.03 Show Advancing | Considered: should carbon be an advance item (does the venue run on renewables)? Rejected — venue energy is explicitly **out of the artist's scope** (18.20 D-03), and putting a carbon question into a workflow whose adoption is already the domain's central risk (index Q-05) would burden the wedge to serve a `wont` feature. |
| R-05 | 18.15 Tour Merch | 18.05 Stage Plot & Input List | Considered: the merch table is a physical thing in a room. Rejected — the stage plot is the *stage*; merch is in the foyer, which is the venue's floor plan (16), not the act's plot. Subject-matter adjacency, not a cross-cut. |
| R-06 | 18.19 Rehearsal | 18.03 Show Advancing | Considered: a rehearsal room is advanced like a venue. Rejected as a *distinct* edge — a rehearsal **is** an event subtype (18.19 D-01), so it uses the same advancing machinery by inheritance rather than by cross-cut. Recording an edge would imply a second, parallel advance flow. |
| R-07 | 18.16 Safety & Insurance | 18.09 Backline & Gear Manifest | Considered: gear insurance is on the manifest and the certificates are in 18.16. Rejected — 18.16 holds *show-delivery* documents (public liability, electrical, permits) demanded by a venue's licence; gear insurance is the *owner's* policy, belonging to 15/the person, and is claimed against via 18.09.03. Both involve insurance; they are different policies held by different parties for different reasons. |

> **Notes for agents:**
> - **CX-04 and CX-06 are the domain's two findings that no single feature file contains.** CX-04: the roster's head count needs a *type* dimension (touring party vs local labour) or three sub-domains' derivations break. CX-06: a six-hop causal chain from a late load-out to an unbudgeted hotel, crossing four sub-domains, that no incumbent connects and the platform holds every link of.
> - **Two edges depend on the domain's weakest link.** CX-06 (the cascade) and CX-08 (the venue-truth loop) both require someone to record what actually happened (18.07.03 DT-03) — a behaviour the domain hopes for and cannot guarantee.
> - The rejected pairs are mostly **subject-matter adjacency**: weather and water, merch and rooms, insurance and insurance. The discipline is shared state or a direct trigger — not "these things co-occur at a show".
