# Ideation Index — WeJammin

> **Pipeline key file.** All downstream workflows read this index to locate ideation documents.
> This file is the entry point for `/create-prd`, `/decompose-architecture`, `/audit-ambiguity ideation`, and all other workflows that consume ideation output.

> Source: [idea.md](../../../../idea.md) — SoundBytez platform README (predecessor product)

## Project Overview

**Problem**: A music career is assembled from a dozen disconnected tools that share no identity, no history, and no record of who did what — so the work gets done, but the proof of it evaporates, and splits and credits get reconstructed years later from memory, at the exact moment they become contested and valuable.

**One-liner**: The platform where music work happens — and where the record of it survives.

**Thesis** (D-18): **Provenance is the wedge; consolidation is the platform.** Consolidation wins the user (the daily reason to show up); provenance keeps them (the reason they can't leave). The two are causally linked — being where the work happens is the *precondition* for capturing the split at source. See [meta/problem-statement.md](meta/problem-statement.md).

## Expansion Mode

- Type: `full`
- Targets: All domains — breadth-before-depth sweep, then vertical drilling per domain
- Basis: Thin document (4.9 KB) with 3+ domains → default per `expansion-modes.md`. Source enumerates 9 features and specifies the behavior of none; "improve the plan" requires genuine discovery, not transcription.
- Cross-cut Detection: always-on
- Deep Think Protocol: active
- Selected: 2026-07-16 (user confirmation)

## Engagement Tier

- Tier: `Hybrid`
- Rationale: User authored the predecessor product (deep domain context) and arrived with stack constraints pre-decided, but this run is explicitly an "improve the plan" pass requiring genuine product exploration across ~8 candidate domains. Related decisions are grouped; obvious structural calls are made and stated; product/scope decisions are presented with options and trade-offs.
- Selected: 2026-07-16 (user confirmation)
- **Gate override**: Product and Architecture gates remain always-interactive regardless of tier, per `.claude/rules/decision-classification.md`.

## Structural Classification

- **Project Shape**: `single-surface`
- **Hub Surface** _(hub-and-spoke only)_: N/A
- **Surfaces**: N/A — single responsive web surface
- **Classification Basis**: Detected from document. Source describes one web platform with one stack and one shared audience pool; no distinct platform names, no per-surface stacks, no exclusive-surface features. User-declared constraints (Astro islands on Cloudflare Pages + Workers) confirm a single web surface.

> **Project Shapes:**
> - `single-surface` — One platform. Domains are top-level children of `ideation/`.
> - `multi-surface-shared` — 2+ platforms, same stack, >80% shared logic. Domains at top level with surface annotations.
> - `multi-product-hub` — 2+ platforms, one is the central platform/API. Hub owns shared domains. Spokes reference via CX.
> - `multi-product-peer` — 2+ platforms, no primary. `shared/` folder as a peer for cross-surface domains.

## Input Classification

- **Input Type**: Thin document (4.9 KB — structured but shallow; feature bullets + stack/deploy notes, no behavioral depth)
- **Extraction Mode**: Expansion
- **Rebrand**: SoundBytez → **WeJammin**
- **Domain**: https://wejamm.in _(not yet pointed at Cloudflare — see constraints)_

## Progress Summary

> All counts read from disk, not from agent self-reports.

| Metric | Value |
|--------|-------|
| Total surfaces | 1 (web) |
| Total domains | **24** — all `[BREADTH]` |
| Total sub-domains | **165** |
| Total leaf features | **734** |
| Total ideation files | **1,118** (190 indexes · 190 CX · 734 features · meta · super-index) |
| Max depth reached | 3 |
| Domains at [BREADTH] | 24 / 24 (mixed: Musts [DEEP], Shoulds/Coulds [SURFACE]) |
| Must features at [DEEP] | **195 / 195** — Step 5 complete |
| Should features at [PARTIAL] | **285 / 285** — Step 5 Level-1 complete |
| Could/Won't features at [SURFACE] | 254 — _correctly out of Step 5 scope_ |
| Nodes at [EXHAUSTED] | 0 |
| Role Lens coverage | **734 / 734** feature files (2,936 rows = 4 personas × 734, verified) |
| Invented personas | **0** — only Musician / Producer / Operator / Fan |
| Placeholder leaks | **0** |
| Deep Think nodes added beyond the sweep's candidates | **166** |
| Duplicate candidates merged during classification | **118** |
| Cross-cut mechanisms (consolidated registry) | **25** — in `ideation-cx.md` |
| Not-product concerns routed to `/create-prd` | 142 |
| Cross-domain interaction pairs synthesized | **206** (184 full synthesis, 22 tracked) — Step 6 complete |
| Domain CX files at [DEEP] | **24 / 24** |
| Emergent cross-cuts / features (Step 6) | 52 / 76 — [meta/cross-cut-emergent-capabilities.md](meta/cross-cut-emergent-capabilities.md) |
| Candidates demoted from domain status (extract) | 21 |
| Raw concepts swept (extract) | 1,545 |
| Independent audit verdicts | 13 clean · 11 minor · **0 major** |

## Document Map

> Downstream workflows: read this table to find the specific file you need.

### Meta Documents

| Document | Path | Status |
|----------|------|--------|
| Problem Statement | [problem-statement.md](meta/problem-statement.md) | `[DEEP]` |
| Personas | [personas.md](meta/personas.md) | `[DEEP]` (4 primary) |
| Competitive Landscape | [competitive-landscape.md](meta/competitive-landscape.md) | `[PARTIAL]` |
| Constraints | [constraints.md](meta/constraints.md) | `[PARTIAL]` |
| Cross-Cut Emergent Capabilities | [cross-cut-emergent-capabilities.md](meta/cross-cut-emergent-capabilities.md) | `[DEEP]` (Step 6) |

### Global Cross-Cuts

| Document | Path |
|----------|------|
| Global Cross-Cuts | [ideation-cx.md](ideation-cx.md) |

### Structure Map

> **For single-surface projects**, domains are listed directly below.
> Every domain below is a FOLDER containing: `{domain}-index.md`, `{domain}-cx.md`, and child features/sub-domains.

#### Top-Level Domains

> **24 domains, ratified 2026-07-16 (D-16).** All at `[BREADTH]` as of 2026-07-16 —
> children classified through the Node Classification Gate and written to disk.
> **Counts below are read from disk, not from agent self-reports.**
> Depth (Step 5 deepening) is allocated by MoSCoW — see `## MoSCoW Summary`.

| # | Domain | Path | Status | Children | Depth | Novelty / Priority |
|---|--------|------|--------|----------|-------|--------------------|
| 01 | Identity, Profiles & Organizations | [01-identity-profiles-organizations/](./01-identity-profiles-organizations/) | `[BREADTH]` | 6 sub-domains + 24 features | 3 | industry-standard / core |
| 02 | Credits & Attribution | [02-credits-attribution/](./02-credits-attribution/) | `[BREADTH]` | 4 sub-domains + 23 features | 3 | whitespace / core |
| 03 | Community & Networking | [03-community-networking/](./03-community-networking/) | `[BREADTH]` | 7 sub-domains + 29 features | 3 | in-source / core |
| 04 | Opportunities & Casting | [04-opportunities-casting/](./04-opportunities-casting/) | `[BREADTH]` | 5 sub-domains + 23 features | 3 | industry-standard / important |
| 05 | Services Marketplace | [05-services-marketplace/](./05-services-marketplace/) | `[BREADTH]` | 7 sub-domains + 32 features | 3 | in-source / core |
| 06 | Education, Lessons & Mentorship | [06-education-lessons-mentorship/](./06-education-lessons-mentorship/) | `[BREADTH]` | 4 sub-domains + 23 features | 3 | industry-standard / important |
| 07 | Music Projects & Collaboration | [07-music-projects-collaboration/](./07-music-projects-collaboration/) | `[BREADTH]` | 9 sub-domains + 37 features | 3 | in-source / core |
| 08 | Real-Time Jamming & Remote Sessions | [08-realtime-jamming-remote-sessions/](./08-realtime-jamming-remote-sessions/) | `[BREADTH]` | 5 sub-domains + 20 features | 3 | industry-standard / important |
| 09 | Rights & Ownership | [09-rights-ownership/](./09-rights-ownership/) | `[BREADTH]` | 6 sub-domains + 26 features | 3 | industry-standard / core |
| 10 | Royalties & Collections | [10-royalties-collections/](./10-royalties-collections/) | `[BREADTH]` | 5 sub-domains + 28 features | 3 | industry-standard / core |
| 11 | Music Licensing | [11-music-licensing/](./11-music-licensing/) | `[BREADTH]` | 8 sub-domains + 34 features | 3 | industry-standard / core |
| 12 | Release & Distribution | [12-release-distribution/](./12-release-distribution/) | `[BREADTH]` | 6 sub-domains + 25 features | 3 | industry-standard / core |
| 13 | Gear Marketplace (Physical Goods) | [13-gear-marketplace/](./13-gear-marketplace/) | `[BREADTH]` | 10 sub-domains + 43 features | 3 | user-directive / core |
| 14 | Digital Goods & Plugin Marketplace | [14-digital-goods-marketplace/](./14-digital-goods-marketplace/) | `[BREADTH]` | 10 sub-domains + 42 features | 3 | user-directive / core |
| 15 | Gear Registry & Ownership | [15-gear-registry-ownership/](./15-gear-registry-ownership/) | `[BREADTH]` | 5 sub-domains + 24 features | 3 | whitespace / important |
| 16 | Venues, Studios & Spaces | [16-venues-studios-spaces/](./16-venues-studios-spaces/) | `[BREADTH]` | 5 sub-domains + 35 features | 3 | user-directive / core |
| 17 | Live Booking & Settlement | [17-live-booking-settlement/](./17-live-booking-settlement/) | `[BREADTH]` | 8 sub-domains + 37 features | 3 | industry-standard / core |
| 18 | Show Production & Touring | [18-show-production-touring/](./18-show-production-touring/) | `[BREADTH]` | 11 sub-domains + 46 features | 3 | in-source / core |
| 19 | Ticketing & Box Office | [19-ticketing-box-office/](./19-ticketing-box-office/) | `[BREADTH]` | 9 sub-domains + 38 features | 3 | user-directive / important |
| 20 | Fanbase & Direct-to-Fan | [20-fanbase-direct-to-fan/](./20-fanbase-direct-to-fan/) | `[BREADTH]` | 6 sub-domains + 27 features | 3 | industry-standard / important |
| 21 | Promotion & Marketing | [21-promotion-marketing/](./21-promotion-marketing/) | `[BREADTH]` | 6 sub-domains + 27 features | 3 | industry-standard / important |
| 22 | Analytics & Market Intelligence | [22-analytics-market-intelligence/](./22-analytics-market-intelligence/) | `[BREADTH]` | 8 sub-domains + 26 features | 3 | in-source / important |
| 23 | Career, Finance & Business Management | [23-career-finance-business/](./23-career-finance-business/) | `[BREADTH]` | 7 sub-domains + 29 features | 3 | in-source / important |
| 24 | Trust, Safety & Disputes | [24-trust-safety-disputes/](./24-trust-safety-disputes/) | `[BREADTH]` | 8 sub-domains + 36 features | 3 | industry-standard / core |

> **Full per-domain rationale, cross-cuts, not-product routing, and demotions**:
> [docs/wejammin-domain-map-proposal.md](../../../../docs/wejammin-domain-map-proposal.md)

## Ideation Rubric Self-Check (`/ideate-validate`, 2026-07-18)

| # | Dimension | Score | Evidence |
|---|-----------|-------|----------|
| 1 | Problem Clarity | ✅ | Single falsifiable sentence naming the multi-hyphenate musician + the "proof evaporates" pain. [problem-statement.md](meta/problem-statement.md) |
| 2 | Persona Specificity | ✅ | 4 personas, all 6 fields each, no generic "users". [personas.md](meta/personas.md) |
| 3 | Feature Completeness | ✅ | 195 Musts at `[DEEP]` with edge cases + Role Lens; 285 Shoulds `[PARTIAL]`; MoSCoW mutually exclusive; 734 features in [feature-ledger.md](../feature-ledger.md) |
| 4 | Constraint Explicitness | ✅ | Budget/timeline/team/compliance/performance/surfaces all have specific values (D-28/29/30). Open stack items explicitly deferred to `/create-prd`. [constraints.md](meta/constraints.md) |
| 5 | Success Measurability | ✅ | Each metric has a method + target; wedge metrics numeric (split-capture ≥60% @ 6mo, capture <7d); baseline-set + hard SLOs deferred to `/create-prd-compile`. [vision.md](../vision.md) |
| 6 | Competitive Positioning | ✅ | 17 named competitors, capture-vs-reconstruct differentiation, earned-provenance moat, partner-vs-rival split. [competitive-landscape.md](meta/competitive-landscape.md) |
| 7 | Open Question Resolution | ✅ | Every open question has owner + target stage (pipeline-stage = deadline). [vision.md](../vision.md) Open Questions |
| 8 | Structural Compliance | ✅ | 24/24 domains have index+cx; Role Matrix populated in all; 734/734 Role Lens; 0 single-child folders; Structure Map matches disk |

**Result: 8/8 ✅ — no warning or fail dimensions. Ideation ready for review.**

## Domain Exhaustion (`/ideate-validate`, 2026-07-18)

Depth is **deliberately allocated by MoSCoW**, not uniform — this is the exhaustion procedure's
"intentionally minimal" path, not incompleteness:

| Tier | Count | Depth | Rationale |
|------|-------|-------|-----------|
| Must | 195 | `[DEEP]` — full edge cases, states, Deep Think | v1 + phase-2 core |
| Should | 285 | `[PARTIAL]` — Level 1 | one level, deepened further when reached |
| Could | 201 | `[SURFACE]` — intentionally minimal | deepened at spec time if pursued |
| Won't | 53 | `[SURFACE]` — intentionally minimal | retained for traceability, not built |

- **CX exhaustion**: 24/24 domain CX files `[DEEP]`; global `ideation-cx.md` `[DEEP]` with 206
  synthesized pairs (22 medium/low tracked, not blocking).
- **Missing-domain reasoning**: the 14-lens sweep + 3× adversarial verification (D-16) and the
  Step 6 boundary analysis (D-26) both concluded the 24-domain map is complete and correctly split;
  one merge candidate (08→07) escalated to `/create-prd`. No missing domains identified.

## Decision Log

Numbered decisions with source references.

| # | Decision | Source | Domain |
|---|----------|--------|--------|
| D-01 | Rebrand SoundBytez → WeJammin; canonical domain `wejamm.in` | User directive, ideate invocation | Global |
| D-02 | Project shape is `single-surface` (responsive web) | Detected from idea.md + stack constraints | Global |
| D-03 | **Ambition is maximal**: "a platform that musicians cannot live without" — "everything that people in the music industry want in a platform". Coverage is preferred over minimalism during ideation; scope is cut at MoSCoW, not at domain-map time. | User directive | Global |
| D-04 | **Cover all domains** — no domain is excluded from exploration for scope reasons | User directive | Global |
| D-05 | **Multi-vendor marketplace** for **physical goods** (new + used music equipment, instruments) | User directive | Commerce |
| D-06 | **Digital goods marketplace** — DAW plugins (and adjacent digital products) | User directive | Commerce |
| D-07 | **Directory** for **venues, studios, and musicians** to buy and sell their services | User directive | Directory / Services |
| D-08 | **Event management tool** is in scope | User directive | Live / Events |
| D-09 | Predecessor README (`idea.md`) is treated as **weak evidence of intent**, not a specification. Its 9 bullets are marketing copy specifying no behavior; 3 of them (Enterprise Security, Global CDN, Tech Stack) are architecture concerns misclassified as features. | Input classification, extract shard | Global |
| D-10 | **The rights stack is the THESIS, not an adjacency.** Rights & Ownership, Royalties & Collections, Music Licensing, and Release & Distribution are all `core` (~70 sub-domains). WeJammin holds the ownership record end-to-end. Rationale: the differentiator (split-at-creation, payment↔rights atomicity, black-box royalty recovery) only exists if the platform owns the chain of title. Accepted cost: the most regulated, most integration-heavy scope in the industry. | User decision, 2026-07-16, domain-map ratification | 09, 10, 11, 12 |
| D-11 | **Fans are first-class USERS, not CRM records.** Fans get accounts, follow artists, receive gig alerts, and discover shows. Domain 20's fan-side children are live product, not gated. | User decision, 2026-07-16, domain-map ratification | 20, 19, 03 |
| D-12 | **Structural Classification remains `single-surface`** despite D-11. Corrects an error in the sweep's synthesis, which asserted that a fan audience implies multi-surface. Per `prd-templates/references/surface-model.md`, a *surface* is a **deployment target** (web / mobile / desktop / cli / api / extension) — **not an audience**. Fans and professionals on one Astro web app = one surface. The fan is a **persona**, and the consequence is a materially expanded Role Matrix in every domain index, not a folder-layout change. | Agent correction, verified against surface-model.md, 2026-07-16 | Global |
| D-13 | **Consequences of D-11 requiring downstream attention**: (a) consumer-scale traffic — fans outnumber professionals by orders of magnitude, which changes the performance budget; (b) a second moderation population with different failure modes; (c) statutory duties that scale with consumer reach (children's access / age assurance, DSA thresholds) — escalate to `/create-prd-security`; (d) **strengthens the mobile-surface question** already open in `meta/constraints.md` — fan gig alerts and show discovery are push-notification and phone-shaped workflows. | Derived from D-11, 2026-07-16 | 20, 24, Global |
| D-14 | **Three separate marketplace domains** — Gear/Physical (13), Digital Goods/Plugins (14), Services (05). Rejected the merge into one "Marketplace". Rationale: everything genuinely shared (cart, payments, messaging, search, reviews, disputes, tax, shipping) is already a cross-cut, so the merge buys nothing; everything that differs is irreconcilable at schema level (qty=1 non-fungible stock with condition-as-price vs licence keys + format×OS×DAW matrix vs scoped human output). A merge yields a `listing` entity with ~40 nullable columns. | User decision, 2026-07-16, domain-map ratification | 05, 13, 14 |
| D-15 | **Real-Time Jamming (08) retained as a domain, narrowed.** Audio transport extracted into the `Real-Time Rooms, Presence & Audio Transport` cross-cut (serves Education, Services, Projects, Community) — this concedes the strongest adversarial objection. What remains domain-owned is unowned elsewhere: the ~25–30 ms desync ceiling caps playable radius at a few hundred miles, making latency-aware collaborator matching a real feature. | User decision, 2026-07-16, domain-map ratification | 08 |
| D-16 | **Domain map RATIFIED**: 24 domains, 423 candidate sub-domains, 32 cross-cuts, 24 not-product concerns routed to `/create-prd`, 21 candidates demoted. Full proposal with per-domain rationale: [docs/wejammin-domain-map-proposal.md](../../../../docs/wejammin-domain-map-proposal.md). Method: 14-lens sweep → 1,545 raw concepts → consolidation → 3× adversarial verification per candidate → synthesis (88 agents). | User ratification, 2026-07-16 | Global |
| D-17 | **Verification caveat recorded**: 0 of 24 candidates were majority-refuted. This is a caution flag on the domain COUNT, not proof of correctness — verifiers may have been lenient. Mitigating evidence: adversaries did materially alter the map (21 demotions; boundary narrowing on 01, 03, 08). `/audit-ambiguity ideation` should treat domain-count inflation as a live hypothesis. | Agent, method transparency, 2026-07-16 | Global |
| D-18 | **THESIS: Provenance is the wedge; consolidation is the platform.** Consolidation wins the user (daily reason to show up); provenance keeps them (reason they can't leave). Rejected framing these as alternatives — they are causally linked: being where the work happens is the *precondition* for capturing splits at source. Provenance alone = the Jaxsta/Muso.AI failure (no daily hook). Consolidation alone = copyable, six incumbent fights, nothing compounds. | User decision, 2026-07-16, `/ideate-discover` | Global |
| D-19 | **4 primary personas**: `Musician` (multi-hyphenate — feels fragmentation worst), `Producer` (session owner — the provenance capture point), `Operator` (venue/studio — the supply side), `Fan` (per D-11). Band is an **entity** (domain 01), not a persona. Coverage verified across all 24 domains; two gaps flagged as open questions (dealer persona for 13/14/15; Admin for 24). | User decision, 2026-07-16, `/ideate-discover` | All |
| D-20 | **All 195 Must-haves retained; v1 beachhead sequencing deferred to `/plan-phase`.** Owner declined the session/gear/live spine options. Agent flagged: `/plan-phase` orders by dependency, not strategy — it will not select a beachhead, so this decision is deferred rather than resolved. `/audit-ambiguity ideation` is likely to flag a 195-Must ledger as carrying no priority signal. Options retained in the MoSCoW Summary for re-decision. | User decision, 2026-07-16, `/ideate-discover` | Global |
| D-21 | **Breadth pass complete**: 165 sub-domains + 734 leaf features written across 24 domains (1,118 files). Deep Think added **166 nodes** the sweep's candidate list missed; **118 duplicate candidates merged**; 142 not-product concerns routed to `/create-prd`; 175 cross-cut mechanisms surfaced pending consolidation. Independent disk audit: 13 clean / 11 minor / **0 major**; Role Lens 734/734 with 0 invented personas; 0 placeholder leaks. | `/ideate-discover` Step 3, verified against disk 2026-07-16 | All |
| D-22 | **Systemic gap found by audit and fixed**: the drill step never wrote back to the parent `ideation-index.md`, leaving all 24 domains reported as `[SURFACE]`/"N candidates"/Depth 1 while disk showed `[BREADTH]`/real children/Depth 3. Auditors correctly diagnosed this as a workflow gap rather than per-driller negligence. Parent index reconciled **from disk**, not from agent self-reports. | Audit finding, 2026-07-16 | Global |
| D-23 | **Step 5 deepening of all 195 Musts complete and verified.** Every Must feature taken from `[SURFACE]` to `[DEEP]` with full Behavior/Happy Path/Edge Cases/States/Deep Think, verified by 195 independent adversarial agents (no sampling), 0 real behavior-section PENDING leaks (precise scan), 24 domain index trees reconciled deterministically from disk (109 status cells). Executed across 4 workflow runs spanning 2 session-limit resets; each run's counts cross-checked against disk truth, never trusted from self-reports. Sub-domains stay `[BREADTH]` (mixed Must-[DEEP]/Should-[SURFACE]) per rollup rule. | `/ideate-discover` Step 5, 2026-07-17 | All |
| D-24 | **Step 5 Should-deepening (Level 1) complete.** All 285 Should features taken from `[SURFACE]` to `[PARTIAL]` — Behavior, Happy Path, primary edge cases, States, Role Lens, ≥2 Deep Think hypotheses each. Structurally verified in code (0 missing sections, 0 invented personas, 0 thin files). Indexes reconciled deterministically (256 status cells). Coulds (201) and Won'ts (53) correctly remain `[SURFACE]` — out of Step 5 scope. **Step 5 is now fully complete**: 195 Must=[DEEP], 285 Should=[PARTIAL], all 24 domains=[BREADTH]. | `/ideate-discover` Step 5, 2026-07-18 | All |
| D-25 | **Step 6 cross-cut synthesis complete.** From 4,818 harvested cross-cut notes: (a) a **25-mechanism cross-cut registry** consolidated from ~235 raw name-buckets; (b) all **24 domain CX files at `[DEEP]`** with intra-domain sub-domain synthesis (5 questions answered for high-confidence pairs); (c) **`ideation-cx.md` rebuilt** with **206 cross-domain pairs** (184 fully synthesized, 22 medium/low tracked), mechanism registry, and top-25 high-confidence synthesis. Executed in 2 workflow runs; domain 01 and the global assembly were redone after a transient safety-classifier block and an inline-data truncation, both caught by disk cross-check. | `/ideate-discover` Step 6, 2026-07-18 | All |
| D-26 | **D-17 resolved — keep 24 domains.** Cross-domain connectivity is 211/276 pairs (76%) but judged **structural, not over-splitting**: ~85 of 101 flagged boundary problems are legitimate seam-work between near-mirror domains (the money/show/gear/credit clusters), the universal hubs were lifted into the mechanism registry rather than left as edges, and ~10 flags are explicit clean-seam counter-examples FOR the split. **One genuine merge candidate survives: `08 Real-Time Jamming` → `07 Music Projects`** (Overdub machinery; rejected only narrowly at 08.07 DT-03) — escalated to `/create-prd` for an explicit keep-or-fold. High-tension seams (17/18, 17/19, 13/15, 14/20, 04/05) resolve via a named shared owner or extracted cross-cut, not merger. | `/ideate-discover` Step 6 boundary analysis, 2026-07-18 | Global |
| D-27 | **Emergent capabilities persisted** to [meta/cross-cut-emergent-capabilities.md](meta/cross-cut-emergent-capabilities.md): **52 new cross-cut mechanisms** and **76 new features** surfaced during synthesis that neither the sweep nor the breadth pass named. Highest-risk: the **identifier-binding seam** — splits/titles attach in Services (05) years before an ISRC/ISWC exists, but Royalties (10) collects against identifiers, and NO mechanism owns the binding step. Routed to `/create-prd` and `/write-be-spec`. | `/ideate-discover` Step 6, 2026-07-18 | 05, 10, Global |
| D-28 | **Constraints locked** (`/ideate-validate`): **Team** = solo (owner + AI); **Timeline** = wedge-first, 3–6mo to v1; **Budget** = lean (scale-to-zero managed services); **Mobile** = native app is **phase 2** (v1 = web + PWA; classification stays `single-surface`, native tracked as a future surface, backend must be API-first). See [meta/constraints.md](meta/constraints.md). | User, 2026-07-18 | Global |
| D-29 | ~~V1 scope = session spine + all 3 marketplaces (~71 Musts)~~ **SUPERSEDED by D-31.** Original single-v1 covering 8 domains including all marketplaces; flagged as over-aggressive for solo/3–6mo. Retained for history. | User, 2026-07-18 | Global |
| D-30 | ~~Primary market = GLOBAL from day one~~ **SUPERSEDED by D-32.** Original global-day-one choice; flagged as heaviest-possible compliance surface. Retained for history. | User, 2026-07-18 | Global |
| D-31 | **Release split into v1 + v1.5** (owner revision, resolving the D-29 risk): **v1 = session spine** (01, 02, 05, 07, 09-capture) ~45 Musts — the wedge, shipped first and fast. **v1.5 = the 3 marketplaces** (13, 14, 15) ~26 Musts — released soon after, not gating the wedge. Phase 2+ = the remaining ~124 Musts. This is the mitigation the agent recommended for the marketplace risk; the owner adopted it. | User, 2026-07-18 | Global |
| D-32 | **Primary market = UNITED STATES to start** (owner revision from D-30's global). One coherent federal framework + state-privacy patchwork instead of every jurisdiction at once — resolves the global-vs-solo tension. US model: CCPA/CPRA, ESIGN/UETA e-sign, DMCA §512, state marketplace-facilitator sales tax (provider-handled), 1099-K, COPPA deferred. `/create-prd-security` keeps the data model jurisdiction-parameterized so later international expansion is additive, not a rewrite. | User, 2026-07-18 | Global, 24 |

## MoSCoW Summary

> **Full ledger with all 734 features, paths and rationale**: [moscow-ledger.md](./moscow-ledger.md)
> Every row links to a verified file on disk (734/734 resolved, 0 broken).

| Priority | Count | Share |
|---|---|---|
| **MUST** | **195** | 26.6% |
| **SHOULD** | 285 | 38.8% |
| **COULD** | 201 | 27.4% |
| **WON'T (now)** | 53 | 7.2% |
| **TOTAL** | **734** | 100% |

### Must Have — by domain

| Domain | Musts | | Domain | Musts |
|---|---|---|---|---|
| 19 Ticketing & Box Office | 16 | | 20 Fanbase & D2F | 7 |
| 13 Gear Marketplace | 15 | | 09 Rights & Ownership | 7 |
| 16 Venues, Studios & Spaces | 15 | | 22 Analytics & Market Intel | 6 |
| 17 Live Booking & Settlement | 12 | | 18 Show Production & Touring | 5 |
| 12 Release & Distribution | 11 | | 03 Community & Networking | 4 |
| 01 Identity & Organizations | 10 | | 08 Real-Time Jamming | 4 |
| 05 Services Marketplace | 10 | | 21 Promotion & Marketing | 2 |
| 14 Digital Goods & Plugins | 10 | | 15 Gear Registry | 1 |
| 02 Credits & Attribution | 9 | | 23 Career, Finance & Business | 1 |
| 04 Opportunities & Casting | 9 | | | |
| 07 Music Projects & Collab | 9 | | | |
| 06 Education & Mentorship | 8 | | | |
| 10 Royalties & Collections | 8 | | | |
| 11 Music Licensing | 8 | | | |
| 24 Trust, Safety & Disputes | 8 | | | |

> **⚠️ Sequencing risk — recorded, owner-accepted (D-20).** 195 Musts spanning all 24 domains is
> not a shippable v1 and carries no priority signal. The proposals were made per-domain by
> agents with no view of the whole, so each optimised locally; none is wrong in isolation.
> The owner deferred sequencing to `/plan-phase`.
>
> **What `/plan-phase` will and will not do**: it orders by **dependency**, not by strategy. It
> will not choose a beachhead — it will build the dependency graph and start at the bottom
> (likely Identity + the Payments cross-cut). The beachhead decision is deferred, not resolved.
>
> **Beachhead options presented and declined** (retained for `/plan-phase` and re-decision):
> - **Session spine** (01+05+07+02+09, ~45 musts) — the only option where acquisition and the
>   provenance wedge share one funnel: hire → session → split captured at source.
> - **Gear spine** (01+13+15, ~26 musts) — highest traffic, first directive; but buying gear
>   never produces a split sheet, so the wedge stays theoretical.
> - **Live spine** (01+16+17+18+19, ~48 musts) — Operator persona, event directive; gigs produce
>   credits but rarely splits.

### Should Have — 285
See [moscow-ledger.md](./moscow-ledger.md#should-285).

### Could Have — 201
See [moscow-ledger.md](./moscow-ledger.md#could-201).

### Won't Have (Now) — 53
See [moscow-ledger.md](./moscow-ledger.md#wont-53).
