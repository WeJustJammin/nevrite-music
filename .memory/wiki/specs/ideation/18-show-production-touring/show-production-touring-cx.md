# Show Production & Touring — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Show Production & Touring](./show-production-touring-index.md)
> **Status**: [DEEP] — 20 children classified; intra-domain cross-cuts synthesised 2026-07-18 (`/ideate-discover` Step 6).
> **Last updated**: 2026-07-18

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [18.04 Riders](./18.04-riders/) | [18.03 Show Advancing](./18.03-show-advancing/) | The structured rider is one of the diff's inputs; advancing consumes riders and never mutates them | Producer, Operator, Musician | High | 18.03 D-01; 18.04 D-02 — one rider serves 40 advances |
| CX-02 | [18.05 Stage Plot & Input List](./18.05-stage-plot-input-list/) | [18.03 Show Advancing](./18.03-show-advancing/) | Channel count vs console/stage-box is the highest-consequence comparison in the diff | Producer, Operator | High | 18.05.02 DT-02 — exceeding the console means the show cannot run as written |
| CX-03 | [18.06 Setlist & Show Files](./18.06-setlist-show-files/) | [18.07 Show Day Schedule](./18.07-show-day-schedule/) | Set duration is the schedule's primary derived input; its uncertainty propagates into the curfew margin | Producer, Musician, Operator | High | 18.06.01 D-01/D-02; 18.07.02 D-03 |
| CX-04 | [18.08 Crew & Credentials](./18.08-crew-credentials/) | [18.04 Riders](./18.04-riders/), [18.12 Travel](./18.12-travel-logistics/), [18.13 Tour Finance](./18.13-tour-finance/) | **Party size** silently drives catering quantities, beds and per diems across three sub-domains | Producer, Musician, Operator | High | 18.08.01 D-04; 18.04.02→18.08.01 (party-size derivation) |
| CX-05 | [18.07 Show Day Schedule](./18.07-show-day-schedule/) | [18.08 Crew & Credentials](./18.08-crew-credentials/), [18.10 Day Sheet](./18.10-day-sheet.md) | Call times derive from the timeline; every distributed sheet stales when it slips | Producer, Musician, Operator | High | 18.08.01 D-01; 18.10 DT-02 |
| CX-06 | [18.07 Show Day Schedule](./18.07-show-day-schedule/) | [18.12 Travel & Ground](./18.12-travel-logistics/), [18.11 Tour Routing](./18.11-tour-container-routing/), [18.13 Tour Finance](./18.13-tour-finance/) | **The cross-day cascade** — tonight's late load-out breaks tomorrow's legal drive, then the route, then the budget | Producer, Musician | High | 18.07.03 DT-05; 18.12.03 DT-04 |
| CX-07 | [18.09 Backline & Gear Manifest](./18.09-backline-gear-manifest/) | [18.03 Show Advancing](./18.03-show-advancing/) | A diff shortfall triggers rental sourcing; the confirmed rental returns as a date-scoped manifest entry | Producer, Operator | High | 18.09.02 DT-01 — the one loop where the platform detects a problem and completes the fix |
| CX-08 | [18.18 Post-Show Report](./18.18-post-show-report.md) | [18.03 Show Advancing](./18.03-show-advancing/) | **The venue-truth loop** — corrections from people who were in the room keep the diff honest | Producer, Operator | High | 18.18 DT-01; 18.03.02 DT-04 — a confidently wrong diff is worse than none |
| CX-09 | [18.09 Backline & Gear Manifest](./18.09-backline-gear-manifest/) | [18.14 Border, Visas & Carnets](./18.14-border-visas-carnets/) | A carnet **is** the manifest in a customs format — a projection, not a new document | Producer, Musician | High | 18.14.02 DT-01/D-01 |
| CX-10 | [18.11 Tour Container](./18.11-tour-container-routing/) | everything tour-scoped | The tour is the scope at which riders, rosters, budgets and manifests are held | Producer, Musician | High | 18.11.01 DT-01 — remove the container and every scope collapses to per-date |
| CX-11 | [18.02 Bill & Support Acts](./18.02-bill-support-acts.md) | [18.07 Show Day Schedule](./18.07-show-day-schedule/), [18.04 Riders](./18.04-riders/), [18.05 Stage Plot](./18.05-stage-plot-input-list/) | The bill scopes and orders objects it doesn't own — set times, changeovers, per-act rider privacy, shared plot layers | Producer, Operator, Musician | High | 18.02 DT-01/DT-02; 18.02→18.05 (shared plot layers cross the act boundary) |
| CX-12 | [18.19 Rehearsal](./18.19-rehearsal-management.md) | [18.06 Setlist](./18.06-setlist-show-files/) | Rehearsal is where real set durations are first measured — and CX-03's uncertainty originates in their absence | Producer, Musician | Medium | 18.19 DT-02; 18.07.02 D-03 |
| CX-13 | [18.16 Safety, Permits & Insurance](./18.16-show-safety-permits-insurance.md) | [18.03 Show Advancing](./18.03-show-advancing/) | **The third generation source** — statutory permits and safety certs are the diff's only non-downgradable hard items | Producer, Operator | High | 18.03.01 (gen source 2); 18.16 D-05/D-06 — statutory lead time drives resolve-by |
| CX-14 | [18.03.05 Advance Freeze & Change Control](./18.03-show-advancing/18.03.05-advance-freeze-change-control.md) | [18.01 Event Record](./18.01-event-record-lifecycle.md), [18.07 Show Day Schedule](./18.07-show-day-schedule/), [18.10 Day Sheet](./18.10-day-sheet.md) | **The change-control hub** — the freeze *is* the `advancing→advanced` transition, and every post-freeze change stales every distributed sheet | Producer, Operator, Musician | High | 18.03.05→18.01/18.07/18.10 (freeze drives transition; applied change forces re-issue) |
| CX-15 | [18.01 Event Record & Lifecycle](./18.01-event-record-lifecycle.md) | [18.02 Bill & Support Acts](./18.02-bill-support-acts.md) | One lifecycle state per record, but per-act completeness lives on the bill; a late support act is a change-control event, not a state | Producer, Operator | High | 18.01 DT-13/D-15; 18.02 D-03 — off-platform name-only acts get no advance section |
| CX-16 | [18.06.04 Performed Setlist Capture](./18.06-setlist-show-files/18.06.04-performed-setlist-capture.md) | [18.18 Post-Show Report](./18.18-post-show-report.md), [18.01 Event Record](./18.01-event-record-lifecycle.md) | Pressing `performed` is the trigger that opens the report and unlocks settlement — the domain's weakest link, and both flagship loops die silently without it | Producer, Musician | High | 18.01 DT-08 — CX-06 and CX-08 both depend on someone recording actuals |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Riders → Show Advancing

**Relationship**: The domain's foundational edge. Advancing computes a diff between what the act
needs (the rider) and what the room has (domain 16). Neither exists in the other's node: the rider
is authored once and reused across forty dates; the advance is a per-date reconciliation. The
separation (18.03 D-01) is what stops Manchester's missing wedges from editing a rider that serves
39 other rooms. **Step 6 sharpened this into a three-way convergence** (18.03.01 intra): per-requirement
strictness (18.03.02 Q-03), redline negotiability (18.03.03 Q-02) and severity derivation (D-06) are
*one question* — how negotiable is this line — and it must be answered **once, in 18.04**, not three times.

**Role scoping**:
- **Producer**: authors the rider, runs the advance, and is the only role that sees both as one workflow.
- **Operator**: reads the resolved rider for their date; sees neither the rider's other dates nor its version history.
- **Musician**: contributes to the rider, sees the negotiated outcome on the day sheet.
- **Fan**: no visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: The rider is owned by the act and **immutable from advancing's perspective**. Per-date variation is a redline (bilateral, 18.03.03) or an override (unilateral, 18.04.04) — never an edit. Three writers exist across this edge (act, venue, negotiation) and each writes to a different object. Overrides and redlines must stay distinct: collapsing them poisons the amendment signal (18.04.04 intra).
2. **Trigger chain**: Rider version resolved → diff runs → items generated → redlines resolve shortfalls → re-diff → freeze. A rider change mid-tour re-diffs upcoming dates only; advanced dates hold their pinned version.
3. **Permission intersection**: The Operator can read the rider but can only write a redline. The one exception across the whole domain is the input list's patch column (CX-02). The Operator's scope is *the single resolved rider for their date* — version history and sibling overrides must 403, or the tour shape and other venues' negotiations leak (18.04.04 intra).
4. **Notification fan-out**: A recurring redline across dates signals the *rider* is wrong (18.03.03 edge case 4) — an aggregate insight only the platform can see, because only it holds every date. Recurring redlines propose a deliberate rider amendment back into 18.04.04.
5. **State transition conflict**: A frozen advance references a rider **version**, not a moving document (18.04.04 intra); access requirements deliberately do not version (18.04.03), so a freeze cannot trap a new access need arising mid-tour.

### CX-02: Stage Plot & Input List → Show Advancing

**Relationship**: The input list's channel count is diffed against the room's console and stage box,
and it is the diff's highest-consequence comparison: most shortfalls are inconvenient, but exceeding
the channel count means the show cannot run as specified. It's also a pure integer comparison — the
cheapest check in the domain with the most expensive failure. Internally, the plot is the source
document: sources placed on it auto-generate input-list rows (a JPEG import generates none),
monitor/IEM positions must exist on it before a mix can reference them, and its physical items feed
the manifest (18.05.01 intra).

**Role scoping**:
- **Producer**: reads the count against the room while there's still time.
- **Operator**: supplies console channels and stage-box lines as **separate** facts (18.05.02 D-03), and writes the patch column — the domain's only venue-writable field in an act's document.
- **Musician**: unaffected until soundcheck.
- **Fan**: no visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: The act owns the sources; the venue owns the patch. Column-level co-authorship in one document — unique in this domain and worth flagging to whoever specs permissions (needs column-scoped write grants across a two-party boundary, 18.05.02 intra).
2. **Trigger chain**: Plot changes → rows regenerate → count changes → diff re-runs → a patch already assigned may invalidate. Footprint/clearance shortfall surfaces as a diff item; an Operator's "won't fit my stage" is reported as a shortfall against the plot, never an edit of it (18.05.01 intra).
3. **Permission intersection**: A venue editing their console spec in 16 silently re-validates every act advancing that room.
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
2. **Trigger chain**: Setlist change → set duration → schedule → curfew re-check. A song added at 17:00 can breach the room's hard stop — a statutory condition where the regime profile declares an instrument, the Operator's own stated ceiling where it does not (18.07.02 D-06; `16.02.03` D-01/D-13) — and nobody currently makes that connection.
3. **Permission intersection**: Band members have Full access to the setlist; a re-order by a member can therefore move a venue's curfew margin. **Permission in the act's most private document reaches into the venue's legal exposure** — a genuinely surprising path.
4. **Notification fan-out**: A margin change should reach the Operator, because they pay the fine (18.07.02 DT-05).
5. **State transition conflict**: Estimated durations produce an estimated margin (±8 min on a 4-min margin means nobody knows). The uncertainty must propagate visibly and is the strongest argument for CX-12.

### CX-04: Crew & Credentials → Riders, Travel, Tour Finance

**Relationship**: **The domain's widest silent coupling.** The roster's head count drives catering
quantities (18.04.02 D-01 — party size is the source of every hospitality quantity), beds (18.12.02),
and per diems (18.13.01 D-01). Adding one merch seller changes a rider obligation, a hotel booking
and a payout — three sub-domains, none of which the person edited. The "catering for the band,
forgetting the crew" failure exists entirely because nobody connects them.

**Role scoping**:
- **Producer**: makes the roster edit; must see all three consequences.
- **Musician**: eats, sleeps and is paid according to a number they never see.
- **Operator**: must cater for a party size that changed after they agreed to it.
- **Fan**: no visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: The roster owns people; each consumer derives its own quantity. **The roster needs a type dimension** — touring party vs local labour — or a naive `count(roster)` caters for stagehands and books them hotel rooms. This is the single most actionable modelling finding in the domain, and it collides directly with Q-03 (the local stagehand is none of the four personas).
2. **Trigger chain**: Roster change → three derivations re-run → if any date is frozen, three change-control events (CX-14).
3. **Permission intersection**: Adding a crew member is a Producer action in 18.08 that mutates an obligation to the Operator in 18.04. Cross-sub-domain, cross-party, and currently silent. An assistant/PA named in the access rider (18.04.03) also needs a credential the head count did not plan for.
4. **Notification fan-out**: The venue must be told the party grew — the domain's most common late change, originating outside the advance.
5. **State transition conflict**: A version pins the rider's items but must not pin a stale head count; profile edits recompute aggregates but must not silently alter a frozen advance pack (18.04.02 intra).

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
1. **Shared state conflict**: The schedule owns times; call rules own offsets; neither is the day sheet, which owns nothing (it is a pure render — CX-14).
2. **Trigger chain**: Slip → calls recompute → sheets re-render → affected roles re-notified. Only affected roles — blanket re-sends train people to ignore them.
3. **Permission intersection**: The Operator slips a venue-side item and moves the act's crew's call times.
4. **Notification fan-out**: The domain's largest, and it needs acknowledgement on critical changes (18.03.05 D-04) — an unopened notification at 17:00 is a crew member at the wrong door.
5. **State transition conflict**: Offline recipients never get the change; the version stamp is the only cue (18.10 edge case 2). This is the domain's strongest input to the offline/PWA surface question (index Q-06).

### CX-06: Show Day Schedule → Travel, Routing & Finance (the cross-day cascade)

**Relationship**: **The most valuable finding in this domain, and the hardest to see.** A load-out
running to 00:30 breaks the driver's mandatory rest, which makes tomorrow's 09:00 departure illegal,
which makes the leg infeasible, which forces a travel day, which costs a hotel night and nine per
diems. Six hops, four sub-domains, one cause. **No incumbent connects hop 1 to hop 6** — and the
platform holds every link. Step 6 corroborated the input from 16: the load-out/vehicle-movement
curfew is a *routing* input, not a venue detail (16.02.03 cross) — a band that cannot legally load
out until 07:00 cannot make tomorrow's drive.

**Role scoping**:
- **Producer**: the only person who could act, if they could see it.
- **Musician**: is the driver (18.12.03 D-01) and the person who doesn't sleep.
- **Operator**: **caused it and never sees the consequence** — their room ran late; the cost lands two cities away.
- **Fan**: no visibility.

**Synthesis questions answered**:
1. **Shared state conflict**: Each sub-domain owns its own object; the cascade is a chain of derivations across four of them. Nothing is co-owned — which is why nobody notices.
2. **Trigger chain**: Load-out slips (18.07.03) → rest breach (18.12.03) → leg infeasible (18.11.02) → human adds a travel day → accommodation + per diems (18.12.01, 18.13.01) → budget (18.13.02). The system may compute and surface; it must not decide (feasibility is checkable, optimality is a fantasy — D-06).
3. **Permission intersection**: The Operator's action creates the act's cost. There is no mechanism — and arguably no basis — to show them that.
4. **Notification fan-out**: The warning must reach the Producer *tonight*, while there's still a decision. By tomorrow morning it's a fact.
5. **State transition conflict**: The rest clock starts at the **actual** load-out, not the planned one — so the cascade depends entirely on someone recording the actual (18.07.03 DT-03). The whole chain is downstream of the domain's weakest link (CX-16).

### CX-07: Backline & Gear Manifest ↔ Show Advancing

**Relationship**: The one loop where the platform **detects a problem and can complete the
transaction that fixes it**. The diff finds no bass rig; sourcing rents one; the rental lands on the
manifest; the advance item closes. Every other flow ends in a document or a decision. This one ends
in money moving, which is why it's the clearest argument that 18 and 13/16 belong on one platform.

**Role scoping**:
- **Producer**: decides bring/rent/substitute/redline.
- **Operator**: often the supplier — giving them a **commercial reason to keep capability data accurate**, which is the incentive the diff otherwise lacks (18.09.02 DT-03). House backline and load-in planning read the per-date manifest to know arriving weight, quantity and crew needs.
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
2. **Trigger chain**: Report → discrepancy → corroboration threshold → 16 corrected → the next diff is better. A slow loop that compounds — and the domain's only self-improving mechanism. Contested or weaponised corrections escalate out into 24 (18.18 cross).
3. **Permission intersection**: An artist's factual claim about a room can change what every other artist sees about it. That power needs the corroboration threshold and the right of reply, or it's a weapon.
4. **Notification fan-out**: The Operator must be told and given a chance to correct — otherwise the loop is adversarial and they disengage, which is fatal given index Q-05.
5. **State transition conflict**: Reports are pre-filled from schedule variance (18.18 DT-04), which requires someone to have recorded actuals (18.07.03). **The truth loop depends on the domain's weakest link** (CX-16), exactly as CX-06 does.

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
1. **Shared state conflict**: The manifest is the source; the carnet is a projection — but a projection that, once issued, **cannot be re-versioned**. This is the only object in the domain where the change-control instinct hits a hard external wall: a chamber of commerce does not accept a version bump.
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
1. **Shared state conflict**: The container owns sequence and scope; every sub-domain owns its own object attached to it. Ownership of the container itself is contested with 17 (index Q-04) — the domain's biggest unresolved boundary.
2. **Trigger chain**: Date added/removed → feasibility re-runs → tour book invalidates → attached scopes adjust. Cancelled/re-routed dates require detaching and re-offering rider overrides (18.04.04 intra).
3. **Permission intersection**: The Operator's total exclusion here is a deliberate firewall, and the inverse of 18.01 D-06 (crew must not see the fee).
4. **Notification fan-out**: A hold dropping in 17 can silently make the rest of the route infeasible — the consequence is two cities away and nobody is looking.
5. **State transition conflict**: The container must be **optional** (18.11.01 D-04) — most working musicians play one-off dates, not runs, and tour-scoped objects must fall back to act level. This matters for the beachhead. **UNOWNED (Q-04 / DT-06)**: the run/residency link, where nights 2..N share one advance, contradicts 18.03's per-date model — see emergent feature note.

### CX-11: Bill & Support Acts → Schedule, Riders, Stage Plot

**Relationship**: The bill *scopes and orders* objects it doesn't own. Set lengths and changeovers
are the schedule's input (add/drop recomputes run of show, and curfew is checked at bill level, not
per act — 18.02 intra); per-act rider privacy is a confidentiality rule applied to riders; and shared
plot/input-list layers cross the act boundary **only when explicitly marked shared** (18.02→18.05
intra) — inter-act gear conflicts surface on the shared plot. This is exactly why the bill is a
feature and not a sub-domain (18.02 DT-01): it adds a dimension to existing objects rather than
owning new ones.

**Role scoping**:
- **Producer**: sets order and lengths; decides what is shared vs private.
- **Operator**: sees the whole bill (they must schedule it) but only technical needs per act; cross-act house-kit contention across a changeover is visible **only** to them (18.03.01 intra).
- **Musician**: as support, sees their slot and shared kit — never the headliner's rider, fee or guest list.
- **Fan**: the public bill only.

**Synthesis questions answered**:
1. **Shared state conflict**: Shared objects (house kit, input list, changeover) vs private ones (riders, guest lists). Default-private per act, enforced at the data layer, not the UI (18.02 DT-02). Simultaneous venue-side and artist-side reorders need an optimistic version check on the whole ordered list (18.02 intra; exact model → `/write-be-spec`).
2. **Trigger chain**: Add/drop act → run of show recomputes → bill-level curfew re-check; a support dropping day-of frees time and recomputes the schedule and margin.
3. **Permission intersection**: The domain's highest-consequence confidentiality boundary — a support act seeing the headliner's fee is relationship-ending. Per-act rider confidentiality scope is defined on the bill and consumed by riders: venue sees all, acts never see each other's.
4. **Notification fan-out**: Cross-act house-kit contention routes back to each act's checklist separately, never cross-act (18.03.01 intra) — resolution must not leak one act's needs to another.
5. **State transition conflict**: A late support act is a **change-control event** against a possibly-frozen bill (CX-14, CX-15), not a quiet insert.

### CX-12: Rehearsal → Setlist

**Relationship**: Medium confidence, and small with a wide blast radius. Rehearsal is the only place
a **real** set duration exists before the first show. Every downstream number in CX-03 — set times,
changeover, curfew margin — currently inherits an estimate typed by a TM, and the cost of that
imprecision lands at 22:50 on the venue's licence. Nothing today writes measured durations back.

**Role scoping**:
- **Producer**: times the set for real and signs off production readiness.
- **Musician**: rehearses; their setlist gets more accurate.
- **Operator**: never sees rehearsal, but benefits from a curfew margin computed on real numbers.
- **Fan**: no visibility.

**Synthesis questions answered** _(Medium confidence — remainder deferred to Step 5)_:
2. **Trigger chain**: Songs run → durations measured → written back to the setlist → schedule and curfew margins firm up. Also closed by the performed setlist (CX-16) once the tour is running.
5. **State transition conflict**: Most acts don't rehearse (18.19 edge case 5). The readiness checklist exists unticked, and the estimates persist — which is the normal case, not the exception.

### CX-13: Safety, Permits & Insurance → Show Advancing

**Relationship**: **The advance's third generation source, and its only hard floor.** The advance
diff pulls items from two sources — the rider (CX-01) and the venue's standing questions (16). Safety
is the third: statutory permits (pyro, noise, structures), public-liability certificates and
electrical sign-offs. What makes it structurally different is that these are the **only
non-downgradable items** in the domain (18.16 D-06). A rider line is negotiable; a permit is not.
The feature declares a statutory **lead time** per requirement, and the advance's resolve-by
computation consumes it — a permit with a 10-working-day notice period is a blocker at T-11, not T-1.

**Role scoping**:
- **Producer**: owns the show-delivery documents and works the resolve-by dates backwards from the show.
- **Operator**: declares which permits *their* licence and room require (a fireworks permit is theirs to know); supplies the requirement, not the certificate.
- **Musician**: rarely sees this layer unless it blocks the date.
- **Fan**: sees only the public consequence if a show is pulled for a failed permit.

**Synthesis questions answered**:
1. **Shared state conflict**: 18.16 owns the requirement *and* its statutory lead time; the advance owns the resolve-by date derived from it. Neither can downgrade the other — the hard-item flag propagates into the freeze precondition (CX-14) unchanged.
2. **Trigger chain**: Permit requirement declared (with lead time) → advance item generated with a computed resolve-by → unresolved hard item at its deadline is a **blocker**, not a nudge → escalation. A lead time longer than the runway to the show is a red flag the day the date is confirmed.
3. **Permission intersection**: The Operator declares requirements bounded by their room and licence; they cannot mark another party's certificate satisfied. The certificate itself (a document with an issuer and a validity window) is evaluated against the **event date, not today** (18.16 D-02) — an expiring insurance cert that is valid now but lapses before the show is already a shortfall.
4. **Notification fan-out**: A hard item approaching its resolve-by escalates on the acknowledgement-tracked ladder (18.03.05 D-04) — but unlike a soft nudge, it cannot be silenced by an override without recording who overrode a statutory requirement.
5. **State transition conflict**: A hard outstanding item **blocks the freeze** (CX-14) — zero-hard-outstanding is the freeze precondition; overrides record what wasn't resolved and who accepted the risk.

### CX-14: Advance Freeze & Change Control → Event Record, Schedule, Day Sheet

**Relationship**: **The domain's change-control hub, and the moment everything bad happens after.**
The freeze is not a UI nicety — it *is* the `advancing→advanced` transition on the event record
(18.03.05→18.01 intra), fired by the day-of auto-freeze. Before it, edits are quiet; after it, every
change is a tracked change-control event with authorship, acknowledgement and re-issue. It is the
same mechanism operating at three time scales: the advance freeze (weeks out), day-of schedule
slippage (hours out, 18.07.03), and any post-send correction that stales a distributed sheet.

**Role scoping**:
- **Producer**: proposes/approves/applies changes; owns the frozen pack.
- **Operator**: receives change-control notifications on their date's items with acknowledgement tracking.
- **Musician**: gets the re-issued day sheet; never sees the change log's commercial context.
- **Fan**: never — this is a production-confidential path (18.03.05), distinct from the public listing.

**Synthesis questions answered**:
1. **Shared state conflict**: The frozen pack is the shared entity the advance sheet (18.03.04) renders and the day sheet (18.10) draws from; a new version **re-issues** it rather than mutating it in place. The frozen pack references a rider *version* (CX-01) and a manifest snapshot, not moving documents. Immutability here is a **legal, tamper-evident property** (18.03.05→24), not only a UX one — the frozen pack is dispute evidence.
2. **Trigger chain**: Freeze precondition (zero hard-outstanding — CX-13) met → `advancing→advanced` on 18.01 → pack frozen. Post-freeze change → change-control event → re-approval → apply → **every distributed sheet stales and forces re-issue** (18.03.05→18.10) → affected roles re-notified with acknowledgement tracking. Redlines proposed after freeze become change-control events requiring re-approval, not quiet edits (18.03.03 intra).
3. **Permission intersection**: Propose/approve/apply with recorded authorship is the shared attestation primitive (18.03.05→cross-cut) — the same one behind rider sign-off and settlement approval. A `self-confirmed` case (the multi-hyphenate holding both sides) must be a first-class state, not an error.
4. **Notification fan-out**: Critical-change delivery **plus acknowledgement tracking and escalation** — the ladder escalates to a *different human*, not more messages to the same non-responder (18.03.01 D-14), and nudges are per-side, aggregated, capped at 1 per 48h regardless of item count.
5. **State transition conflict**: Postponement re-opens **only** date-dependent items (curfew, staffing, doors, catering); date-independent items (console model, dock height) stay confirmed with a re-check prompt (18.03.01→18.01 intra). This is how 18.01's "N advance items need re-confirmation" count is computed — and it must not double-count or the record and the checklist drift.

### CX-15: Event Record & Lifecycle → Bill & Support Acts

**Relationship**: The record carries exactly **one lifecycle state** (DT-13/D-15) because the venue's
production office needs exactly one answer to "is this show advanced?". But a show is often a *bill*
of acts, and per-act advance completeness cannot collapse into that single state — it lives in the
per-act sections of the advance checklist (18.03.01). The tension is deliberate: the record is
show-scoped; completeness is act-scoped.

**Role scoping**:
- **Producer**: manages the bill and reads the single show state.
- **Operator**: sees one show state and the per-act technical sections they must schedule.
- **Musician**: as an act on the bill, sees only their own advance section.
- **Fan**: the public bill and the show's public state (cancelled/postponed) only.

**Synthesis questions answered**:
1. **Shared state conflict**: The event record owns the single lifecycle state; the bill owns per-act membership and each act's completeness. One advance runs for the whole bill with per-act sections (18.02→18.03 intra). Off-platform, name-only acts get **no** advance section (18.02 D-03) — they exist on the public bill but not in the operational workflow.
2. **Trigger chain**: A late support act added to the bill is a **change-control event** (CX-14) against a possibly-advanced record, not a new lifecycle state — it re-opens the affected schedule and curfew computations without resetting the show's `advanced` status for the acts already done.
3. **Permission intersection**: A participant is a Band entity id (18.02→01 cross); off-platform name-only entries can later claim and link to a real Band, back-filling bill history without rewriting the show state.
4. **Notification fan-out**: Adding/dropping an act notifies the venue (schedule impact) and the affected acts, never the other acts' private context (CX-11).
5. **State transition conflict**: The single show state must not be recomputed from per-act completeness (that would let one lagging support act hold the whole show `advancing`), nor may per-act completeness be inferred from the show state. Two levels, two owners, no derivation between them.

### CX-16: Performed Setlist Capture → Post-Show Report, Event Record

**Relationship**: **The domain's provenance node and its single weakest link.** Pressing `performed`
(18.06.04) is the human action that: (a) opens the post-show report (18.18), (b) becomes the
performance credit that travels to 02, (c) unlocks the 17 settlement trigger, and (d) supplies the
measured durations that firm up future schedules (CX-03). The problem is that **all of it depends on
someone pressing a button after the show ends** (18.01 DT-08) — the moment everyone is tired, paid
and leaving. If nobody does, both flagship loops (CX-06's cascade and CX-08's venue-truth loop) and
the settlement itself die silently.

**Role scoping**:
- **Producer**: captures the performed set and files the substantive report.
- **Musician**: the performed set is *their* credit and *their* history, accruing to the person across every band (18.06.04→01 cross).
- **Operator**: attests occurrence only — the disinterested third party who confirms the show happened in their room (18.06.04→16/17) — never the private setlist or personnel.
- **Fan**: sees only a *published* performed setlist (the setlist.fm use case), never the raw capture.

**Synthesis questions answered**:
1. **Shared state conflict**: 18.06.04 owns the capture; 18.18 owns the report; 02 owns the credit record; 17 owns settlement. The performed setlist is a **separate object** from the planned one (D-08) — overwriting the plan with what happened would destroy both. The captured fact is what every downstream consumer references, not a mutation of the plan.
2. **Trigger chain**: `performed` pressed → report opens (pre-filled from schedule variance) + settlement trigger fires (17) + credit created (02) + PRO royalty report fileable (10) + measured durations written back (CX-03). **Every one of these is downstream of the single press** — the domain's most consequential single point of failure. Mitigation is to make capture as close to free as possible (infer as much as the schedule and setlist already know).
3. **Permission intersection**: Who may file and co-edit the single shared report is derived from the show's production party and performing roster; the Band-as-entity governs co-edit permission (18.18→01 cross).
4. **Notification fan-out**: A published performed setlist notifies fans (20) — but only *published* sets are fan-visible; the raw capture stays production-private.
5. **State transition conflict**: The report and settlement must not open on a *planned* setlist — only the `performed` transition may unlock them, or a show that never happened accrues a credit and triggers a payout. The rest-clock for CX-06 also starts at the actual load-out captured here, tying the two weakest-link edges together.

---

## Cross-Cuts Extracted (mechanisms, not nodes)

> Candidates and recurring patterns that are **mechanisms serving many domains**. No node created —
> these belong in [ideation-cx.md](../ideation-cx.md), which the orchestrator owns. Several are new
> or extend a registry entry — see the Step 6 emergent findings returned to the orchestrator.

| Mechanism | Serves | Why it's a cross-cut, not a node |
|---|---|---|
| **Document Generation & Distribution** | 18 (advance sheet, day sheet, tour book, setlist output), 09, 11, 17, 19 | Four artifacts in this domain alone share one primitive: compile held data → scope by recipient → version → distribute → supersede (18.03.04, 18.10, 18.11.03 all instance it). **Not in the registry** — flagged emergent. |
| **Structured Requirement ↔ Capability Diff** | 18 (rider vs venue), 04 (role vs musician), 05 (brief vs provider), 16 | ⚠️ Medium confidence. Requirement set vs capability set → match/shortfall/unknown, with an equivalence model. The venue diff and its gear-equivalence model stay **domain-owned**; only the shape generalises (18.03.02 DT-05). **Not in the registry** — flagged emergent. |
| **Approval, Countersign & Attestation** | 18 (advance confirmation, redline acceptance, performed capture, freeze), 02, 09, 17 | Registry has **Contracts, E-Signature & Attestation** — but 18 needs a lighter case: two parties confirm a *fact* (not a document) and both identities are recorded, including a first-class `self-confirmed` case for the multi-hyphenate. Extends the registry entry. |
| **Notifications & Alerts (with acknowledgement)** | Global; acutely 18 (schedule slippage, advance changes, hard deadlines) | Registry **Notifications & Alerts** lacks 18's requirements: **acknowledgement tracking**, a per-side aggregated cap (1/48h), and escalation to a *different human*. Extends the registry entry. |
| **Payouts & Money Movement (cash first-class)** | Global; 18 (per diems, local crew, backline rentals, merch cash) | Registry **Payments, Escrow & Payouts** assumes electronic money; 18 requires **cash as first-class** (18.13 D-04). Extends the registry entry. |
| **Document Custody, Validity & Verification** | 18 (insurance certs, visas, carnets, permits), 15 (proof of ownership), 09 | "A document with an issuer, a validity window, and a human who accepts it" — and 18's twist: validity is evaluated against the **event date, not today** (18.16 D-02). Not cleanly covered by registry storage/contracts entries — flagged emergent. |
| **File/Asset Custody & Versioning** | 18 (show files — "which version is on the rig?"), 07 (project stems), 12 (release masters) | One problem in three contexts (18.06.03 DT-02). Distinct from Document Generation: this is custody of an opaque asset, not a rendered artifact. |
| **Geo, Mapping & Drive-Time** | 18 (drive times, feasibility), 16, 17, 03, 04 | Distance, geocoding and travel time serve discovery, booking and routing alike. Registry **Search** has geo *discovery* but not drive-time computation — flagged emergent (build/buy → `/create-prd-stack`). |
| **Plan-vs-Fact Paired Records** | 18 (planned/performed setlist, planned/actual schedule, manifest/load-out check), and shows up as booking/settlement, offer/contract elsewhere | D-08's thesis at document level: plan and fact are always **separate objects**; overwriting one with the other destroys both. Recurs three times inside 18 and rhymes across the corpus — flagged as an emergent modelling pattern. |

## Not-Product (routed out)

> Architecture, infrastructure and NFR concerns wearing a product costume. Routed to `/create-prd`.

| Concern | Route to | Why it is not product |
|---|---|---|
| **Offline-capable data access on show day** | `/create-prd-architecture` | An NFR — but a **product-shaping** one. Three features independently demand it (18.06.02, 18.07.03, 18.10) and it is this domain's strongest input to the mobile/PWA surface question (index Q-06). Routed, but flagged as consequential. |
| **Mapping / traffic / drive-time data provider** | `/create-prd-stack` | Build-vs-buy for a data source behind the feasibility check (18.11.02) and CX-06. |
| **Weather data provider integration** | `/create-prd-stack` | The thresholds and decision chain (18.17) are product; the forecast feed is an integration. |
| **PDF / document rendering pipeline** | `/create-prd-architecture` | The render primitive behind the Document Generation cross-cut. |
| **On-stage playback, timecode and MIDI/OSC device integration** | `/create-prd-architecture` | Only relevant if 18.06.03 Q-01 lands on format-specific export. D-05 rejects the playback *engine* as product scope — this routes only the export/integration surface. |
| **Receipt OCR / image capture** | `/create-prd` (build/buy) | Generic and solved elsewhere. The **float** is the music-specific part and stays product (18.13.03 DT-04). |
| **Health-adjacent dietary data lawful basis / retention** | `/create-prd-security` | Sharing dietary data with venues (third parties, sometimes cross-border) needs a lawful basis, retention rule and re-identification floor (18.04.02 intra) — a security-model decision, not a feature. |
| **Account-less advance-link auth & inbound-email spoofing** | `/create-prd-security` | The emailable advance sheet's link scope (read-only vs answer-items) and inbound-email spoofing surface (18.03.04 intra) are unresolved auth decisions. |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 18.06 Setlist & Show Files | 18.04 Riders | No shared state, no trigger. Both are act-authored and both reach the venue, but the rider is *what the room must provide* and the setlist is *what the act plays* — the venue never sees the setlist at all (18.06 D-03). The only connection is duration, which flows through the schedule (CX-03), not the rider. |
| R-02 | 18.14 Border, Visas & Carnets | 18.04 Riders | Considered: does crossing a border change what the act needs from a room? Rejected — a rider is technical and hospitality, and a border changes neither. Only the *people and things* crossing are affected (CX-04's roster, CX-09's manifest). |
| R-03 | 18.17 Weather & Contingency | 18.04 Riders | Considered: does weather change hospitality (a hot day needs more water)? Rejected as trivially real but structurally empty — no shared state, no trigger worth modelling. Adding it would be modelling common sense as a feature. |
| R-04 | 18.20 Green Touring | 18.03 Show Advancing | Considered: should carbon be an advance item (does the venue run on renewables)? Rejected — venue energy is explicitly **out of the artist's scope** (18.20 D-03), and burdening the advance (whose adoption is the domain's central risk, Q-05) to serve a `wont` feature is backwards. |
| R-05 | 18.15 Tour Merch | 18.05 Stage Plot & Input List | Considered: the merch table is a physical thing in a room. Rejected — the stage plot is the *stage*; merch is in the foyer, which is the venue's floor plan (16), not the act's plot. Subject-matter adjacency, not a cross-cut. |
| R-06 | 18.19 Rehearsal | 18.03 Show Advancing | Considered: a rehearsal room is advanced like a venue. Rejected as a *distinct* edge — a rehearsal **is** an event subtype (18.19 D-01), so it uses the same advancing machinery by inheritance, not by cross-cut. Recording an edge would imply a second parallel advance flow. |
| R-07 | 18.16 Safety & Insurance | 18.09 Backline & Gear Manifest | Considered: gear insurance is on the manifest and the certificates are in 18.16. Rejected — 18.16 holds *show-delivery* documents (public liability, electrical, permits) demanded by a venue's licence; gear insurance is the *owner's* policy, belonging to 15/the person, claimed against via 18.09.03. Different policies, different parties, different reasons. |
| R-08 | 18.16 Safety, Permits & Insurance | 18.02 Bill & Support Acts | Considered: does adding a support act change the safety/permit requirements? Rejected — permits attach to the *show and room* (occupancy, pyro, noise), not to who is on the bill. A support act's own certs flow through their own advance section (CX-15), not through the headliner's permit set. |
| R-09 | 18.13 Tour Finance | 18.14 Border, Visas & Carnets | Considered: carnet bonds and visa fees are tour costs, so finance and borders must couple. Rejected as merely a line-item relationship — every sub-domain generates costs that land in 18.13; that makes 18.13 a *consumer of costs* (CX-04, CX-06), not specifically coupled to borders. Withholding tax (18.14.03) is the real border↔finance edge, and it lands on 23/17 (Q-07), not on the tour budget. |

> **Notes for agents:**
> - **CX-04 and CX-06 remain the domain's two findings that no single feature file contains.** CX-04: the roster's head count needs a *type* dimension (touring party vs local labour) or three sub-domains' derivations break — and this collides with Q-03 (the local stagehand is none of the four personas). CX-06: a six-hop causal chain from a late load-out to an unbudgeted hotel, crossing four sub-domains, that no incumbent connects.
> - **Three edges depend on the domain's weakest link.** CX-06 (the cascade), CX-08 (the venue-truth loop) and CX-16 (the whole provenance/settlement chain) all require someone to record what actually happened (18.07.03 DT-03 / 18.06.04). CX-16 is the button they all wait on.
> - **CX-13, CX-14, CX-15 and CX-16 are new in the Step 6 synthesis.** CX-13 adds Safety/Permits as the advance's non-downgradable third source; CX-14 promotes the freeze to an explicit change-control hub spanning three sub-domains; CX-15 resolves the show-state-vs-per-act-completeness tension; CX-16 makes the `performed` press the domain's single point of failure.
> - The rejected pairs are mostly **subject-matter adjacency**: weather and water, merch and rooms, insurance and insurance, costs and borders. The discipline is shared state or a direct trigger — not "these things co-occur at a show".


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-08|D-08]]
