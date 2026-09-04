# WeJammin — Vision

> **One-sentence pitch**: The platform where music work happens — and where the record of who did what, and who owns what, survives.

> **This is a human-readable project summary.** For pipeline-grade detail, see
> [ideation-index.md](ideation/ideation-index.md) and the fractal domain tree it references
> (25 domains, 776 features, 1,186 Markdown files on disk — meta went 5 → 6 on 2026-07-22 with
> [meta/counterparties.md](ideation/meta/counterparties.md), D-71).
>
> **Ideation gate**: Locked — Run 8 fresh independent source-only ambiguity audit passed on 2026-08-02.

## Problem Statement

A music career is assembled from a dozen disconnected tools — Reverb for gear, SoundBetter for
services, Bandsintown for gigs, Splice for sounds, DistroKid for release, a WhatsApp thread for
the band, a spreadsheet for the money. None of them share an identity, a history, or a record of
who did what. The work gets done, but **the proof of it evaporates**: splits, credits, and
ownership are reconstructed years later, from memory, at the exact moment they become contested
and valuable. This is the single most litigated failure in music, and every existing tool is
structurally blind to it because none of them are present when the work happens.

## Target Users

Four primary personas (full detail in [personas.md](ideation/meta/personas.md)):

- **Musician** — the multi-hyphenate working musician (drums, mixes, three bands, sells a cymbal).
  Feels the fragmentation worst. Needs one identity that carries verified proof of work.
- **Producer / Engineer** — the session owner. Knows who played what, at the moment it's true.
  The **capture point** for the entire provenance thesis.
- **Operator** — venue / studio / rehearsal-space owner. Sells perishable time and space; runs the
  business from a phone at a loading dock.
- **Fan** — first-class user (not a CRM record). Follows artists, discovers shows, buys direct.
  Phase 2, but modelled from day one.

**Non-persona counterparts** (D-71 and D-76): some real platform actors are deliberately **not**
personas. The commercial licence buyer remains two D-71 profiles; D-76 classifies dealer/plugin
developer, private-hire buyer, crew, guardian, and manager as bounded roles; Admin/Moderator as
internal staff; and gatekeeper, insurer, and accountant as off-platform v1 counterparts. Neither
decision adds a Role Matrix column or amends D-19's four primary personas.

## Solution Overview

WeJammin is one platform for the whole music career, built on a single thesis: **provenance is the
wedge, consolidation is the platform.** Consolidation — gear, gigs, services, projects, releases in
one place — is the daily reason to show up. Provenance — credits and splits captured while the work
is still fresh and everyone is still in contact — is the reason you can't leave.

The two are causally linked, not merely bundled. Nobody opens an app to file a split sheet. But they
*will* confirm one inside the app they're already using to book the session, pay the engineer, and
share the stems. Consolidation is what puts WeJammin **in the workflow**; being in the workflow is
what makes the split capturable at all — truthfully, on the day, while everyone is still friendly.
That captured record is unrepeatable: no competitor who was not there can manufacture it later at
any price. It is the earned lock-in the whole product is built to create.

The platform is also operated as a **first-party content-management system**, not a set of hard-coded
pages. A WordPress-like backend provides structured content types, entries, controlled blocks/templates,
menus/navigation, taxonomies, media, revisions, publishing, preview, import/export, and typed settings.
Plugins, themes, arbitrary code, and generic storage for rights/credits/money/authority are excluded.

### What v1 claims — and what it does not

> **Restated for the v1 window** — owner decision 2026-07-22 (D-70). Domain 07 D-06 is binding
> here: *the platform never overclaims what it cannot do; these users are professionals, and an
> overclaim discovered later is an unrecoverable trust breach.*

**In v1, capture happens at the FIRST SHARING MOMENT — not inside the DAW.** No DAW-bridge feature
(`07.09`) is phased into v1 under any current decision, and no non-web client is authorised
([constraints.md § Project Surfaces](ideation/meta/constraints.md)). For the whole v1 window the
capture points are exactly two:

1. **The review link** (`07.05.02`) — the first moment the work leaves the producer's machine.
2. **The session-close prompt** (`07.06.02`) — delivered by PWA web push plus the in-app surface,
   fired by a producer tap, a booked session end, or the 72-hour backstop.

**"Capture at source" — inside the DAW, at the instant the take exists — is the stated DIRECTION,
not a current claim.** It becomes claimable only if the Desktop surface reopens on its enumerated
evidence and the bridge is built. v1 positioning, marketing and in-product copy must therefore say
*captured at the first sharing moment*, and must not say *captured at source* or *present at the
moment of creation*. The restatement is reversible if the gate reopens — two edits are cheaper than
carrying an overclaim.

## Domain Map

25 domains (full structure in [ideation-index.md](ideation/ideation-index.md)). Grouped by the
music-industry value chain:

- **Identity & trust**: [01 Identity, Profiles & Organizations](ideation/01-identity-profiles-organizations/) · [24 Trust, Safety & Disputes](ideation/24-trust-safety-disputes/)
- **The provenance core**: [02 Credits & Attribution](ideation/02-credits-attribution/) *(whitespace — the wedge)* · [09 Rights & Ownership](ideation/09-rights-ownership/)
- **Discovery & network**: [03 Community & Networking](ideation/03-community-networking/) · [04 Opportunities & Casting](ideation/04-opportunities-casting/)
- **Doing the work**: [05 Services Marketplace](ideation/05-services-marketplace/) · [07 Music Projects & Collaboration](ideation/07-music-projects-collaboration/) · [08 Real-Time Jamming](ideation/08-realtime-jamming-remote-sessions/) · [06 Education & Mentorship](ideation/06-education-lessons-mentorship/)
- **Money from music**: [10 Royalties & Collections](ideation/10-royalties-collections/) · [11 Music Licensing](ideation/11-music-licensing/) · [12 Release & Distribution](ideation/12-release-distribution/)
- **Commerce**: [13 Gear Marketplace](ideation/13-gear-marketplace/) · [14 Digital Goods & Plugins](ideation/14-digital-goods-marketplace/) · [15 Gear Registry & Ownership](ideation/15-gear-registry-ownership/) *(whitespace — provenance-follows-instrument)*
- **Live**: [16 Venues, Studios & Spaces](ideation/16-venues-studios-spaces/) · [17 Live Booking & Settlement](ideation/17-live-booking-settlement/) · [18 Show Production & Touring](ideation/18-show-production-touring/) · [19 Ticketing & Box Office](ideation/19-ticketing-box-office/)
- **Audience & growth**: [20 Fanbase & Direct-to-Fan](ideation/20-fanbase-direct-to-fan/) · [21 Promotion & Marketing](ideation/21-promotion-marketing/) · [22 Analytics & Market Intelligence](ideation/22-analytics-market-intelligence/) · [23 Career, Finance & Business](ideation/23-career-finance-business/)
- **Platform operations**: [25 Content Management & Platform Configuration](ideation/25-content-management-platform-configuration/) *(mission-critical first-party CMS and settings control plane)*

## Feature Inventory (MoSCoW)

Full ledger: [feature-ledger.md](feature-ledger.md) (776 features). Counts: **230 Must · 292 Should
· 201 Could · 53 Won't.**

> **All 230 Musts are retained** (D-20 + D-85). The release split below is a *sequencing* constraint from
> the solo + 3–6mo + wedge-first reality (D-28/D-31), not a scope cut.

### v1 — session spine + CMS/settings foundation (first release, ~80 Musts, 6 domains)
Identity (01), Credits/capture (02), Services (05), Projects (07), Rights-**capture** (09), and
Content Management & Platform Configuration (25). The
irreducible wedge — hire a collaborator → do the work → capture the credit and split at source → all
on one identity. Buildable solo in the timeframe; ships first and fast (D-31).

### v1.5 — the marketplaces (soon after v1, ~26 Musts, 3 domains)
Gear (13), Digital Goods (14), Gear Registry (15). Physical + digital commerce and gear provenance,
as a focused second release rather than gating the wedge.

### Phase 2+ — the remaining ~124 Musts
Royalty collection (10/11/12), live/events (16–19), fanbase (20), promotion (21), analytics (22),
career/finance (23), community (03), opportunities (04), education (06), jamming (08). Baseline
moderation (24) is needed from v1.

### Should Have — 292
Royalty collection, licensing, release/distribution, live/events, fanbase, promotion, analytics,
career/finance, community, opportunities, education. The full platform expands here.

### Could Have (Phase 3+) — 201
Deeper capability across all domains; explored at `[SURFACE]`, deepened when reached.

### Won't Have (now) — 53
Explicitly out of scope; retained in the ledger for traceability.

## Key Cross-Cutting Interactions

From the [global cross-cut file](ideation/ideation-cx.md) — a **26-mechanism registry** and **230
cross-domain interaction pairs**. The load-bearing ones:

- **Split-capture trigger** — fires from Projects (07) / Services (05) to Rights (09) at the moment
  of creation. The mechanism the whole thesis depends on.
- **Verified-credit-as-evidence** — Credits (02) feeds hiring, reputation, warm intros, analytics.
  Makes the professional graph real by construction rather than a graph of "accept?" clicks.
- **Payments / escrow / split-payouts** — routes to `/create-prd` (architecture, not a domain).
- **Identifier-binding seam** *(emergent, highest-risk)* — splits attach in Services (05) before an
  ISRC exists; Royalties (10) collects against identifiers; **nothing yet owns the binding step.**
  Full emergent list: [cross-cut-emergent-capabilities.md](ideation/meta/cross-cut-emergent-capabilities.md).

## Constraints Summary

Full detail: [constraints.md](ideation/meta/constraints.md).

| Constraint | Value |
|---|---|
| **Stack** | Astro islands · Cloudflare Pages + Workers · Supabase (locked) |
| **Team** | Solo (owner + AI agents) |
| **Timeline** | Wedge-first, 3–6 months to v1 (spine); v1.5 (marketplaces) soon after |
| **Budget** | Lean — scale-to-zero managed services |
| **Market** | United States to start (jurisdiction-parameterized for later expansion) |
| **Surfaces** | v1: web + PWA (`single-surface`). Native mobile = phase 2 (backend must be API-first). **Desktop / any locally-installed client = NOT AUTHORISED** (D-70) — reopens only on four named evidence items |
| **Repo** | `github.com/WeJustJammin/nevrite-music` (private); 3 self-hosted CI runners live |

## Success Metrics

Each metric below has a **measurement method** and a **target**. Targets marked *(baseline-set)*
depend on a first-90-day baseline and are finalized as numeric thresholds at `/create-prd-compile`;
they are stated here as the direction and the method so they are testable, not vague.

**The wedge (the one that proves the thesis):**

- **Split-capture rate** — % of v1 projects that record a signed split **before the project is
  marked complete**. Method: ratio of projects with a `split.signed` event preceding
  `project.closed` to all closed projects. **Target: ≥ 60% within 6 months of v1 launch** (the
  wedge is working when the majority of work captures provenance at source, not after).
- **Time-to-capture** — median time between last contribution and split signature. Method: event
  timestamp delta. **Target: < 7 days median** (captured while the session is fresh, not months later).

**Musician (consolidation working):**

- **Time-to-book** — median hours from posting/accepting a hire to a confirmed engagement. Method:
  `hire.requested` → `hire.confirmed` delta. Target: *(baseline-set)* — trend down quarter-over-quarter.
- **Credit citation rate** — % of a user's professional credits that are platform-verified rather
  than self-asserted. Method: `verified / total` on the credit graph. **Target: ≥ 50% verified** for
  active users by month 6.

**Producer (retention / wedge adoption):**

- **Repeat-session rate** — % of producers who run a 2nd project within 60 days of their 1st.
  Method: cohort retention. Target: *(baseline-set)*.

**Marketplace (v1 commerce):**

- **Listing-to-sale conversion** and **GMV per active seller** — method: standard funnel + revenue.
  Targets: *(baseline-set)* at `/create-prd-compile`.

**Platform health (current targets and remaining decisions):**

- **Normal-web p95 latency** — **<2 seconds** for first-party interactive web requests at expected
  v1 load, confirmed by the owner on 2026-08-02. Upload transfer, asynchronous/background work,
  and third-party completion wait are measured separately; this is not the phase-2 real-time
  jamming constraint.
- **Availability** — product intent is continuous operation outside scheduled outages; the measured
  monthly SLO is **99.9% availability excluding scheduled outages**. “100%” remains the operating
  aspiration, not a mathematically guaranteed SLO; every unplanned outage still triggers review.
- **Checkout success rate** — deferred to the performance budget stage. Posture: professional-scale
  in v1, consumer-scale budget when Fanbase (20) ships in phase 2.

**Content management and platform operability (v1):**

- **Definition coverage** — **100% of operator-changeable product variables** have a typed settings
  definition, owner, valid scopes, validation, and fallback/rollback classification before launch;
  release validation reports **0 unclassified product literals**.
- **Publication safety** — **100% of activated content/template/navigation/settings versions** pass
  schema, permission, route, dependency, and required accessibility preflight; target **0 public
  draft or preview disclosures per month**.
- **Publication convergence** — **≥99% of successful publication/configuration activations** reach
  all applicable first-party public projections, route manifests, search, sitemap, and caches within
  **60 seconds per calendar month**; failures remain visible and retryable.
- **Recovery** — an authorized operator can restore the last-known-good content or setting version
  within **5 minutes** for **≥99% of rollback exercises**, measured quarterly.
- **Admin accountability** — **100% of admin mutations** carry actor, acting context, capability,
  reason where required, immutable version, and audit event; high-risk mutations require step-up
  and the configured approval count.

## Competitive Landscape

Full analysis: [competitive-landscape.md](ideation/meta/competitive-landscape.md). Every competitor
is a point solution — Reverb, SoundBetter, Bandsintown, Splice, DistroKid, and the credits databases
(Jaxsta, Muso.AI, Sound Credit) that all fail identically by *reconstructing* credits after the fact.
WeJammin's moat is being **in the workflow** — hosting the hire, the project and the delivery, so the
record is captured at the first sharing moment rather than reconstructed years later. That is earned
lock-in from an accumulating, verified record no point solution can replicate. (D-70: the stronger
"present at the session, inside the DAW" claim is the direction, not the v1 position.)

## Key Decisions

1. **Rights stack is the thesis** (D-10) — early, evidenced capture is the differentiator.
   *(D-70 qualifies the v1 claim: capture at the first sharing moment; capture-at-source is the
   direction.)*
2. **Provenance is the wedge, consolidation the platform** (D-18).
3. **Fans are first-class users** (D-11), modelled now, surfaced phase 2.
4. **Three separate marketplace domains** (D-14) — gear / digital / services have different physics.
5. **24 domains confirmed** (D-26) — connectivity is structural; one merge candidate (08→07) for `/create-prd`.
6. **Release split** (D-31): v1 = session spine (~45 Musts), v1.5 = marketplaces (~26), phase 2+ = rest. **US market to start** (D-32). **Native mobile phase 2** (D-28).

- **D-85 — CMS/settings-first platform.** Content operations are first-party, schema-driven, versioned,
  previewable, capability-scoped, and separate from canonical transactional records. No plugins/themes.

## Open Questions

> **Canonical open-question list for ideation.** Q-numbers here are the authoritative namespace;
> per-file `Q-NN` markers inside `personas.md` / domain files are file-local and roll up to the
> entries below. Downstream stages resolve against this table.

| # | Question | Owner | Target Stage |
|---|----------|-------|-------------|
| Q-00 | ~~Is Admin a 5th persona or an internal operator role outside the persona set?~~ **RESOLVED — D-76.** Admin/Moderator is internal staff with a separate console and permission boundary; it is never a fifth persona or ordinary acting context. | User | ✅ Owner ratification A3, 2026-08-02 |
| Q-01 | `08 Real-Time Jamming` — keep as a domain or fold into `07 Music Projects`? | User | `/create-prd` |
| Q-02 | The identifier-binding seam — which mechanism/domain owns work↔identifier binding? | Agent | `/create-prd`, `/write-be-spec` |
| Q-03 | ~~Is ~71 Musts realistic solo in 3–6mo?~~ **Resolved (D-31): split into v1 spine (~45) + v1.5 marketplaces (~26).** `/plan-phase` sequences within each release. | — | resolved |
| Q-04 | Auth provider, media storage, payments provider, styling system (open stack decisions) | Agent | `/create-prd-stack` |
| Q-05 | ~~Is a dedicated dealer/developer persona needed for domains 13/14/15?~~ **RESOLVED — D-76.** Dealer/plugin-developer behavior is a bounded seller account/counterparty role, not a fifth persona. | User | ✅ Owner ratification A3, 2026-08-02 |
| Q-06 | Convert `WeJustJammin` from User account to Organization? | User | infra |
| Q-07 | **Desktop reopen evidence is unassigned.** D-70 prohibits any locally-installed client and names four evidence items (a)–(d) that would reopen it ([constraints.md § Desktop Surface — Reopen Evidence](ideation/meta/constraints.md)). Nobody is tasked with gathering them; they are owner-decision inputs, not tracked work. Who gathers them, and when? | User | `/create-prd-stack` |
| Q-08 | **Is the restated v1 claim still competitively differentiating?** D-70 restated the v1 thesis to "capture at the first sharing moment". Whether that still beats the credits-database incumbents on positioning is a market judgement no source in the ideation tree makes. Re-read [competitive-landscape.md](ideation/meta/competitive-landscape.md) against the new wording before v1 positioning copy is written. | User | `/create-prd` |
| Q-09 | ~~Non-persona actors beyond the licence buyer remain undescribed.~~ **RESOLVED — D-76.** The four-persona model is retained; bounded roles, internal staff, and off-platform v1 counterparts are classified in [counterparties.md](ideation/meta/counterparties.md). No downstream source may create a fifth persona or general Role Matrix column by implication. | User | ✅ Owner ratification A3, 2026-08-02 |


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]

### Constrained by
- [[decisions.md#d-71|D-71]]
- [[decisions.md#d-76|D-76]]
- [[decisions.md#d-19|D-19]]
- [[decisions.md#d-70|D-70]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-20|D-20]]
- [[decisions.md#d-85|D-85]]
- [[decisions.md#d-28|D-28]]
- [[decisions.md#d-31|D-31]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-26|D-26]]
- [[decisions.md#d-32|D-32]]
- [[decisions.md#d-03|D-03]]

### References
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
