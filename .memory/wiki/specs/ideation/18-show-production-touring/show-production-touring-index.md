# Show Production & Touring — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-16
> **Novelty**: `in-source` | **Priority**: `core`

## Overview

Everything from confirmed to performed — advancing, riders, stage plots, setlists, run of show, crew
and backline — plus the multi-show container: routing, itineraries, day sheets, travel, per diems,
visas and carnets.

**Why this is a top-level domain**: Doubly evidenced: idea.md names 'setlists, riders, and team management' and the owner names 'an event management tool' (D-08). Distinct from Live Booking by actor (TM/PM/crew vs agent/buyer), timeline (weeks vs months out), and artifact (operational documents vs commercial instruments). Advancing is the most universally hated workflow in live music — a 40-question email chain per date, repeated nightly — and because this platform would hold the structured rider AND the venue's technical truth (domain 16), advancing collapses from correspondence into a computed diff. That is the strongest wedge in the corpus for touring professionals and it is only possible where both datasets live together. Production and touring are kept as one domain because a tour is just the multi-show container of the same operational objects and the day sheet renders from both.

**Interacting capabilities** (what justifies domain status):

- event lifecycle & advancing
- structured riders + venue diff
- setlists, stage plots & run of show
- crew & backline
- routing, itinerary & day sheets
- travel, per diems & border compliance

## Children

> **Classified 2026-07-16** (`/ideate-discover` Step 3). 33 sweep candidates → **20 children**:
> 11 sub-domains and 9 domain-level features, containing **37 leaf features** (46 feature files
> total). All `[SURFACE]` — depth is allocated by MoSCoW in Step 5.

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 01 | Event Record & Lifecycle States | feature | [18.01-event-record-lifecycle.md](./18.01-event-record-lifecycle.md) | `[SURFACE]` | 16 hypotheses |
| 02 | Bill & Support Act Management | feature | [18.02-bill-support-acts.md](./18.02-bill-support-acts.md) | `[SURFACE]` | 5 hypotheses |
| 03 | Show Advancing | sub-domain | [18.03-show-advancing/](./18.03-show-advancing/) | `[SURFACE]` | 22 across 5 children |
| 04 | Riders | sub-domain | [18.04-riders/](./18.04-riders/) | `[SURFACE]` | 17 across 4 children |
| 05 | Stage Plot & Input List | sub-domain | [18.05-stage-plot-input-list/](./18.05-stage-plot-input-list/) | `[SURFACE]` | 12 across 3 children |
| 06 | Setlist & Show Files | sub-domain | [18.06-setlist-show-files/](./18.06-setlist-show-files/) | `[SURFACE]` | 18 across 4 children |
| 07 | Show Day Schedule & Timing | sub-domain | [18.07-show-day-schedule/](./18.07-show-day-schedule/) | `[SURFACE]` | 14 across 3 children |
| 08 | Crew, Call Times & Credentials | sub-domain | [18.08-crew-credentials/](./18.08-crew-credentials/) | `[SURFACE]` | 13 across 3 children |
| 09 | Backline & Gear Manifest | sub-domain | [18.09-backline-gear-manifest/](./18.09-backline-gear-manifest/) | `[SURFACE]` | 14 across 3 children |
| 10 | Day Sheet Generation & Distribution | feature | [18.10-day-sheet.md](./18.10-day-sheet.md) | `[SURFACE]` | 5 hypotheses |
| 11 | Tour Container & Routing | sub-domain | [18.11-tour-container-routing/](./18.11-tour-container-routing/) | `[SURFACE]` | 13 across 3 children |
| 12 | Travel, Accommodation & Ground | sub-domain | [18.12-travel-logistics/](./18.12-travel-logistics/) | `[SURFACE]` | 13 across 3 children |
| 13 | Tour Finance | sub-domain | [18.13-tour-finance/](./18.13-tour-finance/) | `[SURFACE]` | 13 across 3 children |
| 14 | Border, Visas & Carnets | sub-domain | [18.14-border-visas-carnets/](./18.14-border-visas-carnets/) | `[SURFACE]` | 13 across 3 children |
| 15 | Tour Merch Inventory & Per-Show Counts | feature | [18.15-tour-merch-inventory.md](./18.15-tour-merch-inventory.md) | `[SURFACE]` | 4 hypotheses |
| 16 | Show Safety, Permits & Insurance Certificates | feature | [18.16-show-safety-permits-insurance.md](./18.16-show-safety-permits-insurance.md) | `[SURFACE]` | 5 hypotheses |
| 17 | Weather Monitoring & Contingency | feature | [18.17-weather-contingency.md](./18.17-weather-contingency.md) | `[SURFACE]` | 5 hypotheses |
| 18 | Post-Show Report & Notes | feature | [18.18-post-show-report.md](./18.18-post-show-report.md) | `[SURFACE]` | 5 hypotheses |
| 19 | Rehearsal & Production Rehearsal Management | feature | [18.19-rehearsal-management.md](./18.19-rehearsal-management.md) | `[SURFACE]` | 4 hypotheses |
| 20 | Green Touring & Carbon Reporting | feature | [18.20-green-touring-carbon.md](./18.20-green-touring-carbon.md) | `[SURFACE]` | 5 hypotheses |

> **Type column values:**
> - `domain` — a top-level grouping within a surface (folder with index + CX)
> - `sub-domain` — a grouping within a domain that has 2+ interacting capabilities (folder with index + CX)
> - `feature` — a leaf node describing a single capability (.md file)

### Deep Think Additions (not in the sweep's candidate list)

| Node | Why it must exist |
|---|---|
| [18.03.05 Advance Freeze & Late-Change Control](./18.03-show-advancing/18.03.05-advance-freeze-change-control.md) | The sweep modelled advancing as an open-ended conversation. Every real advance has a moment where it becomes *the plan*, and everything bad happens after it. Without a freeze there is nothing for a change to be a change *to*. |
| [18.04.04 Rider Templates, Versioning & Per-Date Overrides](./18.04-riders/18.04.04-rider-templates-versioning.md) | A rider's defining property is that **one serves forty dates over years**. A flat model forces a copy per date, and copies are how riders drift into forty truths — the industry's current state. |
| [18.05.03 Monitor & IEM Requirements](./18.05-stage-plot-input-list/18.05.03-monitor-iem-requirements.md) | The sweep has a plot and an input list — what the *audience* hears. Nothing describes what the *band* hears, which is what decides whether they can play. |
| [18.06.04 Performed Setlist Capture & Live Performance Log](./18.06-setlist-show-files/18.06.04-performed-setlist-capture.md) | **The domain's provenance node.** The sweep captures the plan, never the performance. A live show is the most witnessed event in a musician's life and the industry's record of it is a fan wiki. Directly D-18. |
| [18.07.03 Live Schedule Slippage & Real-Time Updates](./18.07-show-day-schedule/18.07.03-live-slippage.md) | The plan's defining property is that it's wrong by 16:00. A platform that only builds the plan cedes the entire show day to WhatsApp. |
| [18.09.03 Load-Out Check & Gear Loss/Damage Log](./18.09-backline-gear-manifest/18.09.03-load-out-loss-damage.md) | The sweep plans what gear exists; nothing checks whether it still does. The manifest already exists and load-out is already happening — the check is nearly free. |
| [18.13.03 Tour Expense & Receipt Capture](./18.13-tour-finance/18.13.03-expense-receipt-capture.md) | The sweep has a float (cash out) and a budget (the scoreboard) with nothing to reconcile them. Without receipts the float can't reconcile and the budget has no cost actuals. |
| [18.14.03 Foreign Withholding Tax & Treaty Relief](./18.14-border-visas-carnets/18.14.03-withholding-tax.md) | The sweep has the two border facts people *know* about (visas, carnets). It missed the third: the destination country taxes the fee at source. It isn't a document you carry — it's money that doesn't arrive. |

## Role Matrix

> Personas per [meta/personas.md](../meta/personas.md) (D-19). See the **persona mapping** note below —
> this domain strains the four-persona model harder than any other.

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 18.01 Event Record & Lifecycle | ✅ Full | ✅ Full | ⚙️ Config | ❌ None |
| 18.02 Bill & Support Acts | ✅ Full (own act) | ✅ Full | ⚙️ Config | 👁️ Read-only (public bill) |
| 18.03 Show Advancing | 👁️ Read-only | ✅ Full | ✅ Full (own side) | ❌ None |
| 18.04 Riders | ⚙️ Config (own needs) | ✅ Full | 👁️ Read-only | ❌ None |
| 18.05 Stage Plot & Input List | ⚙️ Config (own gear) | ✅ Full | ⚙️ Config (patch column) | ❌ None |
| 18.06 Setlist & Show Files | ✅ Full | ✅ Full | ❌ None | 👁️ Read-only (published setlist only) |
| 18.07 Show Day Schedule | 👁️ Read-only | ✅ Full | ✅ Full (venue-side items) | 👁️ Read-only (public times) |
| 18.08 Crew & Credentials | 👁️ Read-only (own) | ✅ Full | ⚙️ Config (venue rules) | ❌ None |
| 18.09 Backline & Gear Manifest | ⚙️ Config (own gear) | ✅ Full | 👁️ Read-only | ❌ None |
| 18.10 Day Sheet | 👁️ Read-only (own) | ✅ Full | 👁️ Read-only (venue slice) | ❌ None |
| 18.11 Tour Container & Routing | ✅ Full | ✅ Full | ❌ None | 👁️ Read-only (announced dates) |
| 18.12 Travel & Ground | 👁️ Read-only (own) | ✅ Full | ❌ None | ❌ None |
| 18.13 Tour Finance | 👁️ Read-only (own PD) | ✅ Full | ❌ None | ❌ None |
| 18.14 Border, Visas & Carnets | ⚙️ Config (own docs) | ✅ Full | ⚙️ Config (sponsor/withholder) | ❌ None |
| 18.15 Tour Merch Inventory | ✅ Full | ✅ Full | ⚙️ Config (own cut) | ❌ None |
| 18.16 Safety, Permits & Insurance | ⚙️ Config (own certs) | ✅ Full | ⚙️ Config (requirements) | ❌ None |
| 18.17 Weather & Contingency | 👁️ Read-only | ✅ Full | ✅ Full (own site) | 👁️ Read-only (public consequence) |
| 18.18 Post-Show Report | ✅ Full (own show) | ✅ Full | 👁️ Read-only (aggregate) + right of reply | ❌ None |
| 18.19 Rehearsal Management | ✅ Full | ✅ Full | ⚙️ Config | ❌ None |
| 18.20 Green Touring & Carbon | 📊 Reports | ✅ Full | ⚙️ Config + 📊 Reports | ❌ None |

> **Legend**: ✅ Full access · ⚙️ Configuration only · 👁️ Read-only · 📊 Reports only · ❌ No access
>
> **Rules:**
> - Persona names come from `meta/personas.md` — use short names
> - NEVER redefine a persona here — reference only
> - Access icons are shorthand; detailed per-role behavior lives in each feature file's **Role Lens**

### Persona Mapping (D-02 below)

The sweep's provisional personas (tour manager, production manager, crew, FOH engineer, band, venue
production, stage manager) map onto the four ratified personas as follows:

| Sweep persona | Ratified persona | Basis |
|---|---|---|
| Tour manager, production manager, FOH/monitor engineer, stage manager | **Producer** | `personas.md`: "owns the room, coordinates contributors, delivers the finished work. Often the de-facto project manager" — the live analogue is exact |
| Band, artist, touring musician | **Musician** | The multi-hyphenate; on a DIY tour they are also the TM, the driver and the merch seller |
| Venue production, house engineer, promoter | **Operator** | The supply side — their room, their licence, their calendar |
| Local stagehand hired for four hours | **none of the four** | ⚠️ See Q-03 — the model's clearest gap in this domain |

**Fan is `None` almost everywhere and that is a finding, not an omission.** The three exceptions are
narrow and deliberate: a published *performed* setlist (18.06.04), public doors/stage times
(18.07, via 19/21), and the public bill (18.02). Everything else here is professional infrastructure.

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Doubly evidenced: idea.md names 'setlists, riders, and team management' and the owner names 'an event management tool' (D-08). Distinct from Live Booking by actor, timeline and artifact. | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | **Persona mapping**: TM/PM/FOH → Producer; band → Musician; venue production → Operator; Fan ≈ None | The four ratified personas (D-19) hold for the touring core: `personas.md`'s Producer definition ("owns the room, coordinates contributors, de-facto project manager") is the live production role almost verbatim. The model strains only at local hired labour — see Q-03. | Agent, `/ideate-discover` Step 3, 2026-07-16 |
| D-03 | **Riders (18.04) and Advancing (18.03) are separate nodes** | The sweep bundled them. Riders are *authored content* with their own lifecycle (one rider serves 40 dates); advancing is a *per-date reconciliation process* that consumes them. Conflating them means editing the rider because Manchester has no wedges. | Agent classification, 2026-07-16 |
| D-04 | **Structured data is the domain's hinge** — riders, plots, input lists and manifests are data, not documents | Every incumbent stores PDFs. The diff (18.03.02) — the domain's only defensible wedge — requires machine-comparable riders and venue specs. If the rider is a PDF, WeJammin is a file host. This decision recurs in 18.04.01 D-01, 18.05.01 D-01, 18.05.02 D-01 and 18.09.01 D-01. | Agent, from domain rationale + D-18 |
| D-05 | **No playback engine** (18.06.03 D-01) | Backing tracks run in Ableton on a dedicated stage machine — a hard-real-time audio path. A browser platform has no business in it and nobody would trust one. WeJammin owns file *custody and versioning*: "which version is on the rig?" is the real unsolved problem. | Agent Deep Think, 2026-07-16 |
| D-06 | **No route optimisation** (18.11.02 D-01) | Real routing is dominated by avails, offers, radius clauses and relationships a solver cannot see. Feasibility is checkable; optimality is a fantasy that would be confidently wrong. The check is the useful half and nobody does it. | Agent Deep Think, 2026-07-16 |
| D-07 | **No travel booking** (18.12 D-01) | GDS integration, inventory and cancellation liability with no music-specific edge — a band books a Travelodge like everyone else. Record-only, and even that is questioned (18.12.01 Q-01). | Agent Deep Think, 2026-07-16 |
| D-08 | **Plan and fact are always separate objects** | Recurs three times independently: planned vs performed setlist (18.06 D-01), planned vs actual schedule (18.07-cx CX-02), manifest vs load-out check (18.09-cx CX-02). Overwriting the plan with what happened destroys both. This is D-18's thesis expressed at document level. | Agent, cross-cutting pattern, 2026-07-16 |
| D-09 | **Advance sheet, day sheet and tour book are one render primitive, three artifacts** | Near-duplicate check considered and rejected (18.03.04 DT-02, 18.11.03 DT-02): different audience, timing and confidentiality scope. They share the mechanism (recorded as a cross-cut), not an identity. Merging would put per diems in a venue's inbox. | Agent, 2026-07-16 |
| D-10 | **The domain's value is gated on domain 16's venue supply** | The diff — the wedge — is worthless without the venue's structured spec. 18 cannot be a beachhead ahead of 16. This is a sequencing fact the MoSCoW and problem-statement Q-03 must absorb. | Agent Deep Think (18.03.02 DT-01), 2026-07-16 |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| ~~Q-01~~ | ~~Which candidates are sub-domains vs features?~~ | — | ✅ **RESOLVED** — 11 sub-domains, 9 domain-level features, 37 leaves |
| ~~Q-02~~ | ~~Are any candidates actually cross-cuts?~~ | — | ✅ **RESOLVED** — 9 mechanisms extracted to [show-production-touring-cx.md](./show-production-touring-cx.md); 5 concerns routed to `/create-prd` |
| Q-03 | `[OWNER]` **Does the touring crew break the four-persona model?** A local stagehand hired for four hours is not a Musician, Producer, Operator or Fan. This corroborates `personas.md` Q-01 (the dealer persona) from a second, independent direction — two domains now report the same strain. **Canonically owned by [`meta/personas.md`](../meta/personas.md) Q-05**, which lists the stagehand among the nine actors D-71 "explicitly does not close" and routes them to `/create-prd`. | User | `/create-prd` — **owner decision** |
| Q-04 | **Does the tour object live in 18 or 17?** An agent routes a tour while booking it; a TM runs it after. Same set of dates, two owners. The domain's biggest unresolved boundary. A domain/component-ownership question, so it lands with system structure. | User | `/create-prd-architecture` |
| Q-05 | `[OWNER]` **Operator adoption is the domain's central risk.** The diff needs venue data; venue data needs Operators to engage. The emailable advance sheet (18.03.04) is the cold-start hedge — is it enough on its own? A go-to-market risk judgement no later stage resolves on its own. | User | `/create-prd` — **owner decision** |
| Q-06 | **Offline on show day.** Three features independently demand it: the performer view (18.06.02), live slippage (18.07.03) and the day sheet (18.10). Venue basements have no signal. **The surface half is now closed**: `meta/constraints.md` § Project Surfaces locks v1 as one Astro web app installable as a **PWA**, with native mobile in phase 2 (D-28 / D-70). What remains open is the offline *capability* — caching depth, queued writes, conflict resolution — which is a data-flow design, not a surface choice. | User | `/create-prd-architecture` |
| Q-07 | **Three finance/commerce boundary questions of identical shape**: tour P&L (18.13 ↔ 23), tour merch (18.15 ↔ 20), withholding tax (18.14 ↔ 17/23). Each is an operational fact produced by touring and consumed by a finance domain. They should be answered together with one principle, not three times. Same class as Q-04 — component ownership, decided once at architecture. | User | `/create-prd-architecture` |
| Q-08 | **One vocabulary or four?** The gear taxonomy and equivalence model is needed by 18.04.01 (rider), 16 (venue specs), 13 (marketplace) and 15 (registry). Same question asked four times — answer it once. | User | `/create-prd-architecture` |
| Q-09 | **Data requirements this domain creates for others**: 16 must model performer-side accessibility (18.04.03 DT-03), console vs stage-box channels separately (18.05.02 D-03), and curfew as several distinct constraints (18.07.02 D-02). 15 must hold serials, values, weight and country of manufacture (18.14.02 D-02). These originate here and land elsewhere. Each is a field-level data-model requirement on another shard, so it lands where per-shard data models are locked. | Agent | `/write-architecture-spec` |
| Q-10 | Depth limit — no node exceeded 4 levels, and none felt like it wanted to. The 4-level soft limit was not stressed by this domain. | — | ✅ No action |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-19|D-19]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-71|D-71]]
- [[decisions.md#d-28|D-28]]
- [[decisions.md#d-70|D-70]]
