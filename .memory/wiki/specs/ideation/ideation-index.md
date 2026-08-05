# Ideation Index — WeJammin

> **Pipeline key file.** All downstream workflows read this index to locate ideation documents.
> This file is the entry point for `/create-prd`, `/decompose-architecture`, `/audit-ambiguity ideation`, and all other workflows that consume ideation output.

> Source: SoundBytez platform README (predecessor product). The original intake file is not retained in this repository; this ideation corpus is the canonical surviving source.
>
> **Ideation gate**: **LOCKED** — Run 8 fresh independent source-only ambiguity audit passed on 2026-08-02. Downstream work begins at `/create-prd`; counsel-gated capabilities remain explicit non-shipping scope until qualified approval.

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
| Total domains | **25** — 24 `[BREADTH]` + domain 25 `[DEEP]` |
| Total sub-domains | **175** |
| Total leaf features | **776** |
| Total ideation files | **1,185** (776 features · 201 indexes · 201 CX · 6 meta · 1 super-index (`ideation-index.md`); excludes the recovery-only `domain-map-proposal.md`). |
| Max depth reached | 3 |
| Domains at [BREADTH] | 24 / 25; domain 25 is [DEEP] |
| Must features at [DEEP] | **230 / 230** — original 195 plus 35 CMS/settings features |
| Should features at [PARTIAL]+ | **292 / 292** — 285 original plus 7 CMS features at [DEEP] |
| Could/Won't features at [SURFACE] | 254 — _correctly out of Step 5 scope_ |
| Nodes at [EXHAUSTED] | 0 |
| Role Lens coverage | **776 / 776** feature files (3,104 rows = 4 personas × 776) |
| Invented personas | **0** — only Musician / Producer / Operator / Fan |
| Placeholder leaks | **0** |
| Deep Think nodes added beyond the sweep's candidates | **166** |
| Duplicate candidates merged during classification | **118** |
| Cross-cut mechanisms (consolidated registry) | **26** — in `ideation-cx.md` |
| Not-product concerns routed to `/create-prd` | 142 |
| Cross-domain interaction pairs synthesized | **230** (208 full synthesis, 22 tracked) — includes all 24 domain-25 seams |
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
| Counterparty Profiles (**not** personas) | [counterparties.md](meta/counterparties.md) | `[DEEP]` (2 profiles — professional licence buyer, creator micro-licence buyer; D-71) |
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

> **25 domains.** Domains 01–24 were ratified 2026-07-16 (D-16); domain 25 was owner-directed 2026-08-02 (D-85).
> Domains 01–24 remain `[BREADTH]`; domain 25 is `[DEEP]` —
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
| 25 | Content Management & Platform Configuration | [25-content-management-platform-configuration/](./25-content-management-platform-configuration/) | `[DEEP]` | 10 sub-domains + 42 features | 3 | user-directive / core |

> **Ratified recovery provenance, per-domain rationale, cross-cuts, not-product routing, and demotions**:
> [domain-map-proposal.md](domain-map-proposal.md)
>
> The earlier [historical pre-ratification proposal](../../../../docs/wejammin-domain-map-proposal.md) is retained for traceability only. It does not override this index, the numbered domain tree, or D-35.

## Ideation Rubric Self-Check (`/ideate-validate`, 2026-07-18)

| # | Dimension | Score | Evidence |
|---|-----------|-------|----------|
| 1 | Problem Clarity | ✅ | Single falsifiable sentence naming the multi-hyphenate musician + the "proof evaporates" pain. [problem-statement.md](meta/problem-statement.md) |
| 2 | Persona Specificity | ✅ | 4 personas, all 6 fields each, no generic "users". [personas.md](meta/personas.md). **Amended 2026-07-22 (D-71)**: this run scored ✅ without recording an answer to the licence-buyer gap it should have caught. That gap is now closed by two non-persona counterparty profiles at the same field depth ([counterparties.md](meta/counterparties.md)); the persona count is unchanged at 4. Nine other non-persona actors remain explicitly open — `vision.md` Q-09. |
| 3 | Feature Completeness | ✅ | 230 Musts at `[DEEP]` with edge cases + Role Lens; 292 Shoulds `[PARTIAL]` or deeper; MoSCoW mutually exclusive; 776 features in [feature-ledger.md](../feature-ledger.md) |
| 4 | Constraint Explicitness | ✅ | Budget/timeline/team/compliance/performance/surfaces all have specific values (D-28/**31/32** — supersedes D-29/30). Open stack items explicitly deferred to `/create-prd`. [constraints.md](meta/constraints.md) |
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
| D-20 | **All 195 Must-haves retained** (still live). ~~v1 beachhead sequencing deferred to `/plan-phase`~~ **— the "defer the beachhead" half is AMENDED by D-31**, which chose v1 = session spine + v1.5 = marketplaces. The retention of all 195 Musts stands; only the sequencing-deferral is superseded. | User decision, 2026-07-16, `/ideate-discover`; amended 2026-07-18 by D-31 | Global |
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
| D-33 | **Split-Capture Trigger ownership layered** (audit remediation): **09 Rights owns the split SHEET** (instrument + %); **02 Credits owns the credit record**; the **capture trigger is a cross-cut** fired from 05/07 at creation — no single domain owns it. **10 Royalties does NOT own capture** (collection is phase 2). Term "split machinery" retired. Corrects a contradiction where the cross-cut registry wrongly assigned owner=10. | User decision, 2026-07-18, `/audit-ambiguity` | 02, 09, 10, cross-cut |
| D-34 | **Ladder/challenge/expiry engine owned by 17 Live Booking** (audit remediation): the mechanic for competing holds on a bookable slot is a booking-transaction behavior. 16 Venues/Studios owns the place's existence, specs, and base calendar only. Resolves a 16-vs-17 boundary contradiction that blocked IA sharding. | User decision, 2026-07-18, `/audit-ambiguity` | 16, 17 |
| D-35 | **24-domain map reaffirmed after restart/recovery.** Owner confirmed all 24 domains on 2026-07-19 following recovery of the 14-lens / 1,545-concept sweep. Four fresh independent audits found no missing required domain, cross-cut, blocker, or major boundary defect. Existing 24-folder fractal tree is authoritative; the recovery proposal is ratified evidence, not a competing structure. Scope remains governed by existing MoSCoW and release decisions (D-20/D-31), not by deleting domains. | User confirmation + recovery/audit evidence, 2026-07-19 | Global |
| D-36 | **A-02 review-link recipient-isolation contract ratified.** Domain 07 preserves CX-01, D-13, D-14, and 07.05.02 D-10: an unauthenticated/private-link recipient sees only their own thread and replies, never roster/internal or other-recipient feedback, other versions, project content, hidden counts, or teasers; audience is immutable at post and link comments notify the roster. Queue A-02 and ledger `r-51[0]` are resolved; no new ACL, visibility widening, or v1 scope change. | Owner ratification + source-contract recheck, 2026-07-19 | 07 |
| D-37 | **A-03 DAW parsing support is validation-gated.** Before a DAW can be selected for a parser or track-mapping integration, validate representative real sessions and complete DAW-specific legal review. Person-free track names retain available track/instrument context but produce no contributor guess; the existing Producer prompt asks explicitly. Ambiguity does not infer, and unsupported/unreadable formats remain non-blocking. This resolves queue A-03 / ledger `r-52[0]` without choosing DAWs, bridge delivery, or a new surface. | Owner decision + source-contract recheck, 2026-07-20 | 07 |
| D-38 | **A-04 vault default profiles are validation-gated.** The proposed per-song × sensitivity-class, role-derived profiles require practitioner validation and an approved profile version before v1 enforcement. Validation may refine grants but cannot replace least-privilege role derivation with manual per-asset ACLs, project-wide grants, or owner-configured-only access. First-access NDA evidence, immediate fail-closed revocation, terms-not-grants separation, version-pinned ordinary acceptance, and explained denial remain locked. NDA legal force and master-owner precedence remain separately open. | Owner decision + source-contract recheck, 2026-07-20 | 07, 09 |
| D-39 | **A-05 mixed DSP outcomes use attached rejected-item details.** One `(release × store × territory)` row retains its identity. Under mixed partner evidence, a `Partial acceptance` projection exposes accepted/rejected/pending counts and actionable details; each rejected item preserves stable item ID, partner plus original delivery/message correlation, evidence, triage/remediation state, and successor-delivery correlation. Parent health returns only when evidence supports the full release; redelivery remains rejecting-partner-scoped. | Owner decision + source-contract recheck, 2026-07-20 | 12 |
| D-40 | **DQ-04.06 hold-ladder consistency uses optimistic version checks.** Each bookable-slot ladder has server-assigned dense ordering and receipt-time ties. Every mutation is version-conditional: stale intents reject before mutation and are re-offered against the authoritative ladder. No merge, automatic replay, queue-behind, lock, or last-write-wins path exists. A successful mutation atomically preserves ordering, version, required attribution/reason, terminal action semantics, and audit/notification intent; release beats a simultaneous challenge. | Owner decision + source-contract recheck, 2026-07-20 | 17 |
| D-41 | **CQ-02 comped-out credits render transparently when otherwise public.** A retained not-in-final-master contribution remains tier-unchanged and renders once in its ordinary public discography position with the plain-language qualifier "not in final master." Ordinary visibility/publication gates still win; visitors receive no trigger date, reason, or delivery history. This display contract decides no Domain 10 registration, ownership, royalty, payment, union, or neighbouring-rights outcome. | Owner decision + source-contract recheck, 2026-07-20 | 02, 10 |
| D-42 | **CQ-04 suspected-ring demotion changes ordinary traversal rank, not presentation.** An otherwise eligible traversal edge consumes its silently demoted per-edge-derived weight and, if returned through ordinary gates and ordinary result-window ranking, renders normally. No collusion-specific threshold, hiding, label, rationale, notification, detector metadata, or topology-only Domain 24 action exists. | Owner decision + source-contract recheck, 2026-07-20 | 02, 24 |
| D-43 | **CQ-06 recorded master `majority-by-share` requires strict `>50%` exact ownership approval.** A specific master action needs affirmative exact nominal master-owner share strictly greater than half of the full current consented pool; equality fails closed. Absent rule remains unanimous; invalid/stale records, silence, unreachability, points, or rounding do not manufacture approval. This affects no separate licensing-policy veto, publishing/performer/sample permission, release/takedown decision, payout calculation, or Domain 24 case. | Owner decision + source-contract recheck, 2026-07-20 | 09, 11, 12, 24 |
| D-44 | **CQ-07 overlapping mashup work weights are declarant-entered, never inferred.** Every embodied overlapping work has a positive exact Recording→Work weight, with the full set totaling 100%; duration proration remains an editable proposal only for declared disjoint spans. Domain 10 consumes the valid as-of allocation but never calculates duration, normalizes, equal-splits, infers a remainder/contribution, or repairs it. Works remain separate and source-master lineage/sample declarations remain independently required. | Owner decision + source-contract recheck, 2026-07-20 | 09, 10 |
| D-45 | **CQ-08 unclaimed-stub auto-merge requires exact canonical asserted writer-name-set equality, never identity inference.** `writer-name-canonical-v1` pins Unicode 15.1 NFC → Default Case Folding → trim/collapse Unicode whitespace → NFD/remove marks/NFC, compares order-independent sets exactly, and retains original assertions as evidence. It applies only to current unclaimed, unconsented, conflict-free stubs with no distinct-person or unresolved identity/alias evidence; fuzzy, title, audio, identifier, legal/stage identity, or alias signals can nominate but never authorize action. Commit rechecks atomically and retains provenance/lineage. Later incompatible claims use ordinary detection/dispute routing without auto-unmerge, case, freeze, or identity adjudication. | Owner decision + source-contract recheck, 2026-07-21 | 01, 09 |
| D-46 | **CQ-09 v1 term and moral-right status is bounded to `US`, `FR`, `DE`, and `GB`.** Each determinate jurisdictional result requires its source-attributed facts and applicable rule; missing/insufficient evidence and every other territory are explicit `unknown` / not determined. Copyright term/public-domain status remains territory-scoped and is never global clearance, licensing approval, ownership adjudication, or release authorization. Economic transfers never transfer moral rights; France/Germany non-waivability, UK waiver treatment, and US music non-applicability remain jurisdiction-specific. | Owner decision + source-contract recheck, 2026-07-21 | 09, 11, 12 |
| D-47 | **P-01 production-stage vocabulary uses a validation-gated shared-enum policy.** The owner selected one platform-owned, fixed, music-specific vocabulary as the only permissible stage model, but no candidate labels, stage order, initial state, terminal approved-master semantic, or prompt mapping becomes enforceable until the validation packet records complete beatmaker and session-player workflow traces, dispositions for every mismatch, a passing result, and explicit product-owner approval of one immutable enum version. Validation may refine the candidate; it may not introduce configurable columns, production-model-specific vocabularies, a second state machine, or unnormalised exceptions. `Song.current_stage` ownership, non-blocking capture, completeness debt, and P-02/P-03 boundaries remain unchanged. | Owner-selected Option B + source-contract recheck, 2026-07-21 | 07 |
| D-48 | **P-02 large catalogues render as a dense table, never a second lifecycle.** The selected scope counts unique visible authorized Songs before local filtering: `0–59` renders the craft board and `60+` automatically renders a catalogue table. Both project the same `Song.current_stage`, and a table row action invokes the identical per-Song transition — same authorization, non-blocking capture, completeness debt, LWW attributed notice, and derived Release-readiness recomputation. No bulk stage write, configurable column, per-card assignee, table-owned stage, or Release-local state exists in v1; pagination and view mechanics defer to `/write-be-spec` and `/write-fe-spec`. | Owner decision + source-contract recheck, 2026-07-21 | 07 |
| D-49 | **P-03 superseded approvals reinstate on version identity, never on judgement.** A backward stage transition marks later-stage approvals superseded, never deleted. On re-advance they reinstate iff no new immutable version landed in between; any intervening version re-collects against the current approver set — which D-01's "an approval never transfers to a later version" already implied. The predicate is the append-only version timeline, so no materiality classifier, human judge, or certified zero-delta is introduced, and nothing in the append-only trail is retracted. Presentation-agnostic across the P-02 board/table split; Release re-readiness stays derived. | Owner decision + source-contract recheck, 2026-07-21 | 07 |
| D-50 | **P-04 handoff specs are authored where owned and referenced where not.** `07.08.01` originates `mastering`, `mix`, and `archive`'s asset half; `sync` references domain 11, DSP destination references domain 12, and engagement-purchased handover references `05.04.02`/`05.04.04`. Referencing validates presence and surfaces the owner's verdict, never restating the requirement — generalising `07.07.03` D-04. `live` and `remix` are defined nowhere and become an ownership question, not authoring work; the Empty state advertises only specs with contents behind them. Every requirement warns, with integrity failure the sole hard stop. | Owner decision + source-contract recheck, 2026-07-21 | 07, 05, 11, 12 |
| D-51 | **P-05 readiness targets follow P-04's ownership rule; pin-vs-live is dissolved.** `07.08.01` authors `ready-for-mastering` and `ready-for-mix-handoff`; `ready-for-DSP-release` references domain 12 and `ready-for-sync-pitch` domain 11, consuming their severities as weights rather than re-deriving them. An unowned target is not offerable — readiness ships per target as each becomes available, which is build order, never a user gate. One target-spec store with one version identity: the score is a live view, the package a pinned record that also pins its spec version. Only DSP-release is fully scoreable today. | Owner decision + source-contract recheck, 2026-07-21 | 07, 11, 12 |
| D-52 | **P-06 a mis-typed source declaration is flagged, never reclassified.** A "preset" that is really a full melodic loop keeps its declared type; a disputed type uses the existing attributed conflict path where both are kept and surfaced. Mitigation is upstream — the capture prompt asks enumeratively (loop / one-shot / break / stem / bought beat). No detector, no reclassification, no rejection: 07 owns capture while 09/11 own clearance, the type axes belong to domain 14, and the capture prompt never blocks. | Owner decision + source-contract recheck, 2026-07-21 | 07, 11, 14 |
| D-53 | **P-07a vault re-gating fires only on an owner-declared material change.** Terms re-versions do not re-gate existing holders by default and acceptance records stay version-pinned; an owner-flagged material change re-gates at next access, never mid-transfer. Materiality is declared by the owner who authored the change, never platform-detected — so it does not repeat the semantic reading P-03 rejected. Vault fail-closed revocation is untouched: domain D-04's absolute non-blocking rule governs creative surfaces, not the vault. | Owner decision + source-contract recheck, 2026-07-21 | 07 |
| D-54 | **P-07b an access downgrade notifies the affected person and the roster.** A downgrade is an instance of D-09 ("every roster write is announced"), not an exception; the roster audience is scoped by D-16 to those who can already see that person's entry. Work is rostered rather than assigned, so the roster is the coordination record — and the downgraded party's live URLs are already dead. Audience only; cadence stays with the notification cross-cut. | Owner decision + source-contract recheck, 2026-07-21 | 07 |
| D-55 | **P-08a originality aggregates into a nominal enum.** `13.02.03` D-05 derives an enumerated aggregate from the component vector to fill the locked comp key `model × condition × originality`. The enum is explicitly unordered — D-04 makes originality a factual axis, not a quality scale — so it partitions comp sets without ranking units. Authored on the owning axis, consumed by 13.04. | Owner decision + source-contract recheck, 2026-07-21 | 13 |
| D-56 | **P-08b an originality change voids a live offer in either direction.** `13.02.03` D-06 applies 13.03.02 principle 3 literally. A direction test was unavailable: the axis is non-ordinal and mandates no photo evidence, so "downgrade" is uncomputable. Framed as seller-protection with a re-offer path so late honest disclosure is not punished. | Owner decision + source-contract recheck, 2026-07-21 | 13 |
| D-57 | **P-09 local-pickup settlement is a per-listing seller choice.** `13.11` D-04 confirms what the tree already implements. A global settled rule imposes facilitator tax and 1099-K duties on every cash handshake; a global off-platform rule strands the escrow and chain machinery. The chain follows the money: settled writes the transfer, off-platform uses 15.01.03's manual handshake. | Owner decision + source-contract recheck, 2026-07-21 | 13, 15 |
| D-58 | **P-10a/P-10b a rights takedown preserves the holder record; an ordinary revision appends.** `14.03.02` D-04 states both paths. Takedown stops onward delivery while the entitlement row persists with date and reason; revision appends and notifies while every prior entitled version stays fetchable. Two paths, never one — 14.04.01 already said so. | Owner decision + source-contract recheck, 2026-07-21 | 14 |
| D-59 | **P-11 a departed contributor's confirmed split row survives unchanged.** `14.10.03` D-05 — never zeroed, redistributed or forfeited. The question's *accruing* premise is out of scope: pool funding and download accrual are WONT. Redistribution is foreclosed by 09.02.04 D-14 and forfeiture by 10.04.03 D-01. | Owner decision + source-contract recheck, 2026-07-21 | 14, 09, 10 |
| D-60 | **P-12 a host-update break is an external change — flag, disclose, never revoke.** `14.04.02` D-04 ratifies the pattern locked at 14.07.01 D-04/D-06: perpetual promises the entitlement and artifact, not function. One story for OS drift, lapsed dependencies and host breaks. No default refund, no vendor obligation for a third party's act. | Owner decision + source-contract recheck, 2026-07-21 | 14 |
| D-61 | **DQ-MG-01 the bulk-import quality bar does not bend; the evidence moment moves.** Four axes resolve independently: model binding unrelaxed (bulk raises it), grading bounded-and-disclosed with reduced comp weight, disclosure unrelaxed with no substitute, unit media unrelaxed with capture moved to label print. Absence is disclosed, never gated — and there is no shadow listing tier. | Owner decision + source-contract recheck, 2026-07-21 | 13 |
| D-62 | **DQ-MG-02 stolen-serial review consumes domain 24's severity.** The listing is held not deleted, neither party accused; severity, SLA and escalation come from `24.01.03` and domain 13 authors no number. The seller's remedy is the locked `reported → contested` dispute path, not a support queue. | Owner decision + source-contract recheck, 2026-07-21 | 13, 15, 24 |
| D-63 | **DQ-MG-03 approval-required licence transfers freeze on vendor exit.** The platform never substitutes for a departed vendor's discretionary approval and never invents consent. Auto-approval was rejected as commissioning a mechanism that does not exist — the registry stores a policy, not an evaluator. | Owner decision + source-contract recheck, 2026-07-21 | 14 |
| D-64 | **DQ-MG-04 theft-report standing binds to enumerated custody states.** The owner or a party in a `15.08` custody state may file, with capacity recorded; the platform never adjudicates title. "Documented custody" was rejected as undefined — it would have locked out the loan and consignment cases the answer exists to serve. | Owner decision + source-contract recheck, 2026-07-21 | 15 |
| D-65 | **DQ-MG-05/06 identity-confidence and collision rules move to the owning file.** `15.01.05` authors the canonical confidence set and `15.01.01` renders it; colliding records never auto-merge — both retained, both notified, merge only on mutual consent, following CQ-08's precedent. CX-01 blocks the mint pending disambiguation; it does not fork. | Owner decision + source-contract recheck, 2026-07-21 | 15 |
| D-66 | **DQ-MG-07 unclaimed-record suggestions auto-apply by field class.** Factual classes apply immediately with community provenance; higher-stakes classes queue; commercial stays Operator-only. Uses `16.01.01`'s existing class model and mirrors "automation may propose, never dispose". | Owner decision + source-contract recheck, 2026-07-21 | 16 |
| D-67 | **DQ-04.01/.02/.03/.04/.05/.07 the live-booking block resolves by consuming rules its own files already point to.** Held dates stay available with an aggregate hold state (never identities); band governance is consumed from domain 01, so with no rule configured no offer is approved; offers expire with no implicit grace and extensions are explicit and pre-expiry; conflicting counts stay provisional while undisputed portions settle; the paid admissions quantity is the verified draw — **name rebound by DQ-17.2 from `scanned_paid` to `admissions_paid`** (19.05.01 D-09, 17.11.01 D-06), the same quantity in the same role, with `scanned` now reserved for the gate-observed component alone; alerts fire for announced first-party shows at on-sale. | Owner decision + source-contract recheck, 2026-07-21; name binding 2026-07-22 | 17, 20, 01, 19 |
| D-68 | **P-01 closes on its policy; its validation evidence is implementation work.** The finding was "exact stage vocabulary still explicitly owner-open" and no longer is — the model, gate, cohort minima, pass conditions and owner-approval requirement are all decided and propagated. Candidate labels stay non-enforceable because the gate is **in force**, not because a decision is pending. Same disposition as A-03 and A-04, which also closed on their gate rather than their evidence. **All 107 remediation findings are now `verified-fixed`.** | Owner decision, 2026-07-22 | 07 |
| D-69 | **DQ-02 a band's default authority is a PEER SEED, bounded by a value ceiling and keyed to capacity.** The coarse activity enum is fixed at **seven** — book / sign / spend / list / release / settle / administer — and `01.03.03` DT-02's incidental "four coarse activities" is corrected to "a handful"; `release` and `settle` stay individually addressable. Every confirmed **`permanent`** band-membership edge carries the full seven-activity set: the creator's owning mandate is the *first instance* of that set, not a superior grade, so no band is one death away from unadministrable. A default **value ceiling of USD 1,000 per act**, configurable per band, bounds seeded authority; over-ceiling acts escalate to the owning-mandate holder, which makes `01.03.03` D-06 reachable in the unconfigured state instead of inert. The seed is a **rebuttable default**, not a derivation: `touring` / `staff` / `honorary` capacities carry presence with **zero** authority until explicitly granted — R-02 is amended in the same pass to bar *derivation* of mandate from capacity while permitting a capacity-keyed default. **Band only**: studio / venue / label / shop / agency default to the owning mandate plus explicit grants. Accepted costs recorded: the Producer split-push anti-persona is maximally enabled and detected only after the fact via `01.04.03` D-01 transparency; the seeded `administer` right is wider than the partnership default the disclosure screen describes, so disclosure copy and mandate screen must be reconciled; alias-capture bands (CX-12) inherit peer authority for everyone named at capture and the skip must be legible. | Owner decision + source-contract recheck, 2026-07-22 | 01 |
| D-70 | **DQ-08 no client on the producer's machine; the v1 capture prompt ships on PWA push; the v1 thesis is restated.** (a) **Surface** — no non-web client is authorised. `meta/constraints.md`'s Desktop row stops being an absence ("Not in scope. No directive.") and becomes a prohibition with a named exit: it reopens **only** on four enumerated evidence items — commercial-studio installability (`07.09.01` Q-02 / DT-03(b)), real-session support for the track-name premise (domain 07 Q-08 / `07.09.02` Q-03), a costed agent build/signing/notarisation/support load against Team=Solo and Budget=Lean (DT-03(a)), and a verifiable read-scope model (`07.09.01` D-06 / DT-03(c)). `07.09` D-04's parser gate stays a separate, additional gate. Nobody is assigned to gather the evidence — flagged as `vision.md` Q-07. (b) **Prompt delivery** — the `07.06.02` Tier 1 contributor card and Tier 2 Producer card are delivered in v1 by **PWA web push + in-app**, a capability D-28 already locked; closes `07.06.02` Q-09 and `07.09.03` Q-03. Ratified with the payload caveat (no parse in v1, so pre-fill comes from the session roll and roster only, and D-11 suppresses a card with neither) and a VERIFY item (iOS Safari web push needs the PWA home-screen install — a platform fact no source states). (c) **MoSCoW** — `07.09.01/.02/.03` keep **`Should`, unphased**; no ledger change, and the six bridge-dependent features are not re-scoped. (d) **Thesis** — restated for the v1 window in `vision.md`, `meta/problem-statement.md` and `meta/competitive-landscape.md`: v1 captures at the **first sharing moment** (review link `07.05.02` + close prompt); capture-at-source is the **direction**, not the current claim. Domain 07 D-06 makes this an obligation. Closes `07.09` Q-02; opens `vision.md` Q-08 (is the restated claim still differentiating). | Owner decision + source-contract recheck, 2026-07-22 | 07, Global |
| D-71 | **DQ-10 the commercial licence buyer is described as TWO non-persona counterparty profiles.** D-19 stands unamended at four personas and **no Role Matrix column is added**. [meta/counterparties.md](meta/counterparties.md) authors a **professional licence buyer** (supervisor / brand / agency — referenced by 11.01, 11.02, 11.03, 11.08) and a **creator micro-licence buyer** (podcaster / streamer / small-business channel — referenced by 11.06 and by `11.02.01`'s Fan row), each with the six persona fields plus Workflow and Anti-Persona Behavior, under a header stating in terms that they are not personas. Two artifacts rather than one because `11.06` records the two gaps as different in **kind** — there the buyer matches one persona *badly*, which is more dangerous than matching none. Buyer-facing Role Lens notes change from "this feature's primary user is unspecified" to a **reference**, authored once and never restated (D-50 / P-04). `personas.md` carries a pointer, without which the profile is easy to miss. `11.08.02` D-11 (licensee ≠ purchaser) stays load-bearing and is expressed in prose, not a column. **Closes** 11 Q-01, 11.06 Q-01, 11.01.02 Q-01 and the 11.02.01 Role Lens block. **Explicitly does NOT close** nine other non-persona actors — dealer (personas.md Q-01), Admin/Moderator (personas.md Q-02, `24.01.03` Q-01, `vision.md` Q-00), curator/journalist/radio/DSP gatekeeper (`21.02` Q-01 with 21 D-03), dealer counterparty (`13.09` D-03 with 13.13), stagehand, insurer, accountant, manager, fee-paying parent — rolled up as `vision.md` Q-09. Accepted: a reader skimming only a four-column Role Matrix still sees no buyer, and a small production company sits unclaimed between the two profiles. | Owner decision + source-contract recheck, 2026-07-22 | 11, Global |
| D-72 | **DQ-14 the jurisdiction axis is retained; only a US profile is authored.** Applies D-32's second half. Statutory facts resolve against a named **jurisdiction profile**; the UK vocabulary retires into an **UNAUTHORED** profile whose statutory fields resolve to explicit `unknown`, never a silent UK default — the precedent D-46 set for term and moral-right status. Profiles declare **capabilities**, not instruments, so every place naming a premises licence, PAT, PLI or TEN as *the* instrument is restated against a profile capability (16.01.06, 16.02.01, 16.02.03, 16.05.*); the capability vocabulary is deliberately small and must not grow into a rules engine. `16.05.07` D-08 becomes: where the profile declares a decisive statutory building key, equality proves and inequality refutes — where it does not, the rule has no input. The **US profile's five statutory slots are locked** (occupancy ceiling, liability cover, electrical/fire safety record, performing-rights licence status, hirer requirements), each with issuer and expiry, each a declaration and never a platform-verified certificate; the **US instrument names are deferred to `/create-prd-security`** because no ideation source contains them, keeping a LIVE `[PENDING]` in 16.01.06. **Register availability is per licensing authority**, resolved per record address — not a per-profile boolean and not a blanket unavailability — so L2 and D-08 gate on the resolved value and render `unknown` when unresolved; a per-authority coverage record is new structure that must be maintained, and at cold start most authorities are unresolved. **No statutory temporary permission exists where there is no statutory condition**: the date-range exception type survives under `16.02.03` D-05, curfew and dB limits are Operator claims labelled as claims (D-01), and `16.06.03` D-22 (the premises licence as a hard overrun ceiling) **has no input** in a licence-less profile — which must be written explicitly. Accepted gaps: the worked UK example is lost, and a US venue may be bound by a municipal ordinance the platform cannot represent as statutory. | Owner decision + source-contract recheck, 2026-07-22 | 16, Global |
| D-73 | **DQ-15 rehearsal backline reads through the gear register, quantity-tracked, with provision posture typed on the room spec.** (a) `16.04` confirms `15.07` D-01 for rehearsal rooms: backline renders from `15.07.03` filtered by `15.07.02` condition and `16.04` stops typing its own item list — the same read-through both sibling room types already confirmed (16.02.02 D-06, 16.03.02 D-04/D-05), avoiding the two-stores-two-update-paths rot `15.07.03` DT-01 exists to prevent. Recorded as a per-feature confirmation; it does **not** close domain-15 Q-07 or 15.07 Q-01. (b) **Quantity-tracked** mode for commodity rehearsal stock, identity-tracking retained per item where the Operator wants it — commissioning a genuine model addition inside domain 15, degrading `15.07.02` D-01 (condition-on-a-count: "4 amps, 1 faulty" cannot say which) and `16.03.02` D-08 (a reservation's gear dependency has no referent on a count, and must be respecified for quantity lines). (c) `16.04` owns a typed per-category **provision enum** (`included` / `hire-extra` / `bring-your-own-only` / `none`, with `unstated` a distinct non-value); 15 owns the items and `16.06.07` owns the price — requiring one explicit boundary sentence, because inference fails in both directions (an empty register renders `unstated`, not `none`). **Unresolved precondition, blocking a real population**: `15.07` publishes ORG registers, so per `16.03.02` DT-12 a sole-trader rehearsal Operator with no org entity cannot publish at all. | Owner decision + source-contract recheck, 2026-07-22 | 16, 15 |
| D-74 | **DQ-20 the coverage verification badge is earned by the ARTEFACT, never by pitch provenance.** Artefact class plus retrievability determines strength: a fixed, live, retrievable article renders `verified` whether or not a WeJammin pitch produced it. `21.07` owns the verification taxonomy — its `Verified` trigger contains no pitch condition, D-03 declares parentless coverage fully valid ("often the best coverage there is"), and D-04 commits verification to a **link** act ("we verify the link, not the reading"), performable on any URL. This **overrules** the later, deeper `promotion-marketing-cx.md` on ownership rather than recency, editing ratified `[DEEP]` CX prose in two places (CX-05 Relationship, CX-08 synthesis Q3). It also **weakens** what the badge proves about WeJammin specifically: index D-02 rested the domain's existence on "it sent the pitch, it holds the link", and that defensibility claim must be re-founded on the link-verification act. Separately, **provenance stays a log state**: `Attributed` / `Organic` remains a record state visible to the Musician, driving the CRM flip and the directory denominator, while the EPK renders **one** strength badge per item and nothing about sourcing — `21.09` is untouched while `[PARTIAL]`, and a compound label would be new spec no source has written. Accepted: a journalist reading the EPK cannot distinguish a platform-observed capture from an artist-self-logged one. | Owner decision + source-contract recheck, 2026-07-22 | 21 |
| D-75 | **DQ-R2-01 a representation edge carries TWO independent flat axes, conjoined at the call site.** The closed seven-verb **activities** enum — book / sign / spend / list / release / settle / administer — is untouched and unrepealed (`01.03.03` D-01, restated globally as D-69); it gains a second, independent axis, **domains**, a subset of the commercial-domain set (live booking / recording / publishing / sync / merch). An action is authorised **iff** its verb is in the edge's `activities` **and** its domain is in the edge's `domains` — the two axes ANDed at the call site, at the moment of the action. Neither axis is a matrix and the conjunction is no cell grid: two flat lists are at most **7 + 5 = 12** plain-language statements per edge, never 35 addressable cells, which is what keeps `01.03.03` DT-02 (permission matrix REJECTED) and its D-02 (plain language, not a permission grid) intact — authority renders as prose, "may book and settle, for live and recording". A **membership** edge carries the activity axis only and resolves to **all five** domains, which is what preserves `01.03-cx` CX-03: enforcement sees one shape, `{activities, domains}`, whichever route the authority arrived by, and D-69's peer seed is neither widened nor narrowed. Terminology is fixed platform-wide — **activities** is reserved for the seven verbs, so `01.03.02`'s "scope (which activities — live booking, recording, publishing, sync, merch)" is renamed **domains**, and the identity claim "scope **is** the mandate" (`01.03.02`:76, `01.03-cx` CX-02) is corrected: the **mandate is the activity axis**; **scope is activities AND domains** conjoined at resolution. Derived rule (agent decision, owner may override): a representation edge must declare **at least one** domain at creation — an empty `domains` set is invalid rather than silently universal, on the least-privilege default in [ideation-cx.md](ideation-cx.md)'s Roles, Permissions & Delegated Authority cross-cut plus `01.03.02`:50 ("the edge **is** the represented party's consent" — and a consent to nothing is not a consent); membership edges are exempt because their universality is the rule above, not an empty set. Accepted cost recorded: **territory, term and commission stay edge-level and do not vary per domain** — they bound the edge and are inherited by the mandate (`01.03.03`:25, correcting CX-02's "additionally bounding"), so a mandate that is worldwide for `publishing` but narrower for `live booking` cannot be expressed on one edge; that is the price of two flat axes, and it is recorded as accepted, not left silent. Carve-out: `administer` does not reach authorship — with or without the `publishing` domain it confers no authority to name a publisher over a writer share the represented party did not write, and `09.01.04` D-06 stands over the mandate. Tracked, unresolved — **[OWNER]**: are the five domains identical to domain 17's ratified work-type enum, or a fourth vocabulary? `01.03.02`:25 lists **sync** as publishing's *sibling* while `09.01.04`:102 carves sync *inside* publishing as a right type (performance, mechanical, sync, print); this needs a taxonomy ruling and is not answered here. | Owner decision, 2026-07-29 | 01 |
| D-76 | **Batch 1 owner ratification — party, communication, actor, and unclaimed-portfolio boundaries.** (A1) An organisation is optional; person and each legally separate band/studio/agency/label are distinct parties of record, and acting for another party requires a recorded mandate. (A2) `communicate` is a separate, explicit mandate grant: no commercial activity or commercial domain silently authorises speaking as a party. (A3) D-19's four primary personas remain fixed; dealer/plugin developer, private-hire buyer, crew, guardian, and manager are bounded account/counterparty roles; Admin/Moderator is internal staff; gatekeepers, insurers, and accountants are off-platform v1 counterparts. (A4) An unclaimed non-user portfolio may accrue as a provisional record but is neither public nor search-indexed until lawful basis, notice, and removal controls are approved; claimed or explicitly consented public paths remain eligible. | Owner ratification A1–A4, 2026-08-02 | Global, 01, 04, 05, 06, 15, 21, 24 |
| D-77 | **Batch 2 owner ratification — payout, follow, and counsel-gated release boundaries.** (B1) After 30 calendar days from a recorded split request, pay confirmed shares and hold only the unresolved portion in a non-forfeitable record with a claim path; silence never reallocates or forfeits it. (B2) Segment sends, audience export, demand maps, and sparse-cluster disclosure do not ship before qualified privacy/security approval of the numeric floor and enforcement scope; counts and a fan's own record remain available. (B3) V1 D2F sales are a compliance-cleared single-payee path only; multi-party payout and held collaborator funds are excluded pending qualified approval. (B4) A browser-local follow has no alert delivery; verified email plus explicit alert consent makes it durable, and later account creation links the same consented follow. (B5) Private free-text notes about identifiable third parties are excluded from v1; structured outcomes only pending qualified review. (B6) Automatic CSAM action, crisis emergency-contact/escalation, self-service law-enforcement portal, and 24/7 response are excluded pending qualified approval. | Owner ratification B1/B4 + counsel gates B2/B3/B5/B6, 2026-08-02 | Global, 14, 20, 21, 24 |
| D-78 | **Batch 3 owner-autonomy ratification — claims, education, and royalty safeguards.** (C1) Tier-C counter-attestation creates only a provisional claim, never public trust, ownership change, or contest resolution before independent proof. (C2) Contested lifts use a 7-calendar-day evidence exchange and a 30-calendar-day final-decision target; unsupported objections lift, while timely substantiated cases stay embargoed with weekly status and priority review. (C3) Guardians see feedback and billing/entitlement facts, never an identifiable child practice diary. (C4) Course refunds are available for 14 days before 20% material consumption, subject to defect, misrepresentation, and mandatory-law overrides. (C5) Contradictory royalty terms use minimal bilateral reconciliation with affected-counterparty consent; unresolved terms remain held. | Owner autonomy delegation, 2026-08-02 | Global, 01, 02, 06, 10 |
| D-79 | **Batch 4 owner-autonomy ratification — release distribution safeguards.** (D1) Distribution updates the artist and emits `release.date_changed` but never directly messages fans; promotion needs artist authorization and applicable consent. (D2) Suspension permits only timestamped, claimant-visible additive evidence; challenged facts, delivery state, and prior evidence remain immutable. (D3) Destructive redelivery requires a persisted per-store plan and visible idempotent recovery. (D4) An unresolved UGC ownership conflict blocks new registration across platforms while retaining existing platform-specific state. (D5) Whitelist source changes create a protected, artist-reviewed reconciliation with no automatic removal. | Owner autonomy delegation, 2026-08-02 | Global, 12, 20, 21 |
| D-80 | **Batch 5 owner-autonomy ratification — marketplace, messaging, and adjudication safeguards.** (E1) A timely damage claim atomically suspends settlement and title transfer. (E2) Rights takedown stops delivery only for the identified asset at the smallest valid container scope while preserving records. (E3) An unavailable required template dependency stops future completable sales and gives existing buyers a compatible-update-or-refund remedy. (E4) An approved base refund permits keeping an upgrade only through explicit, paid re-pricing; otherwise both refund and revoke. (E5) Weak-provenance and stale-consent imports are quarantined until fresh lawful consent. (E6) V1 bulk broadcasting is disabled pending managed sender operations. (E7) V1 paid campaign funding is excluded pending qualified funds-protection approval. (E8) Public reachability is discovery evidence, never authorization; authority evidence receives human review and unresolved cases remain embargoed. | Owner autonomy delegation, 2026-08-02 | Global, 02, 13, 14, 20, 24 |
| D-81 | **Batch 6 owner-autonomy ratification — scene-feed candidacy boundary.** Scene membership may select a member's own candidate event set only. It never appears as a rank input, boost, or tie-breaker; scoring uses graph proximity, geographic relevance, event class, recency, and reader controls. An “in your scene” explanation labels geographic candidacy rather than a participation score. | Owner autonomy delegation, 2026-08-02 | Global, 03 |
| D-82 | **Batch 7 owner-autonomy ratification — entitlement payment-failure recovery.** One `(product, holder)` entitlement record persists across every lifecycle state. Retries and new purchases serialise on that record; only a fresh confirmed capture may append a new acquisition epoch and terms snapshot before it becomes `active`. Failed/cancelled attempts grant nothing and cannot mint a duplicate. | Owner autonomy delegation, 2026-08-02 | Global, 14 |
| D-83 | **Batch 8 owner-autonomy ratification — transaction-dispute limits and entity authority.** V1 addresses a perishable no-show only through the transaction's recorded cancellation/no-show amount or deposit/escrow allocation, never speculative lost revenue, reputation, opportunity, or platform-protection compensation. An entity needs `communicate` authority for evidence/non-binding messages and independently recorded `settle` authority to bind a settlement; without it, normal non-response rules apply. Evidence-backed adjudication is not marketed as an outcome guarantee. | Owner autonomy delegation, 2026-08-02 | Global, 01, 17, 24 |
| D-84 | **Batch 9 owner-autonomy ratification — MoSCoW rationale authority.** The linked leaf specification, not a ledger digest, is the sole canonical rationale for a MoSCoW placement. Historical excerpts remain navigation-only and may be truncated; no audit, gate, or implementation choice may rely on them. | Owner autonomy delegation, 2026-08-02 | Global |
| D-85 | **Content management and settings-first operation are mission-critical.** Add a first-party Content Management & Platform Configuration domain with editable structured content types, controlled templates/blocks, entries, navigation, taxonomies, media, revision/publishing workflow, preview, import/export, and a capability-scoped admin workspace. Product-operable variables are typed/scoped/versioned settings, never scattered literals. Plugins, themes, arbitrary executable templates, and genericization of rights/credits/money/authority/dispute/entitlement records are excluded. | Owner directive, 2026-08-02 | Global, 01–24, 25 |
| D-32 | **Primary market = UNITED STATES to start** (owner revision from D-30's global). One coherent federal framework + state-privacy patchwork instead of every jurisdiction at once — resolves the global-vs-solo tension. US model: CCPA/CPRA, ESIGN/UETA e-sign, DMCA §512, state marketplace-facilitator sales tax (provider-handled), 1099-K, COPPA deferred. `/create-prd-security` keeps the data model jurisdiction-parameterized so later international expansion is additive, not a rewrite. | User, 2026-07-18 | Global, 24 |

## MoSCoW Summary

> **Full ledger with all 776 features, paths and rationale**: [moscow-ledger.md](./moscow-ledger.md)
> Every row links to a verified file on disk (734/734 resolved, 0 broken).
> **Caveat on "rationale"**: the ledger's Rationale column is a *digest*, and 608 of its 734 digests
> were hard-cut at 220 characters by the generator that wrote them. They are marked with a trailing
> `…` and the full reasoning is intact in the leaf file each row links to — see the ledger's own
> header note and its Q-01. Tiers, counts and paths are unaffected; only the digest tails were lost.

| Priority | Count | Share |
|---|---|---|
| **MUST** | **230** | 29.6% |
| **SHOULD** | 292 | 37.6% |
| **COULD** | 201 | 25.9% |
| **WON'T (now)** | 53 | 6.8% |
| **TOTAL** | **776** | 100% |

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
| 25 Content Management & Configuration | 35 | | | |
| 04 Opportunities & Casting | 9 | | | |
| 07 Music Projects & Collab | 9 | | | |
| 06 Education & Mentorship | 8 | | | |
| 10 Royalties & Collections | 8 | | | |
| 11 Music Licensing | 8 | | | |
| 24 Trust, Safety & Disputes | 8 | | | |

> **✅ Sequencing UPDATED by D-31 + D-85.** All original 195 Musts are retained (D-20) and 35
> mission-critical CMS/settings Musts are added (D-85), for 230 total. The
> release is now **split into v1 / v1.5 / phase-2+** — this supersedes the earlier "defer the
> beachhead to `/plan-phase`" position recorded under D-20.
>
> - **v1 — session spine + CMS/settings foundation** (01, 02, 05, 07, **09-capture**, 25), ~80 Musts. The provenance wedge:
>   hire → session → split captured at the **first sharing moment**, on one identity. *(Restated
>   per D-70: with no locally-installed client authorised and `07.09` unphased, v1's capture points
>   are the review link `07.05.02` and the session-close prompt `07.06.02`. Capture-at-source is the
>   direction, not the v1 claim — domain 07 D-06 makes honest claims an obligation.)*
> - **v1.5 — marketplaces** (13, 14, 15), ~26 Musts. Released soon after v1.
> - **phase 2+** — the remaining ~124 Musts (still `Must` per D-20).
>
> **`09-capture`** = the split-**capture** slice of Rights & Ownership: sub-domains
> **09.01 rights-registry + 09.02 split-capture-agreements + 09.03 chain-of-title-lifecycle**
> (the record + the signed split + provenance of title). Royalty **collection** and the rest of
> domain 09/10/11/12 are phase 2 (capture now, collect later — D-10). This defines the "~45 Musts"
> arithmetic: 01(10) + 02(9) + 05(10) + 07(9) + 09-capture(7) + 25(35) = 80.
>
> **What `/plan-phase` does now**: it orders **within each release** by dependency. The beachhead
> is chosen (v1 = the spine); `/plan-phase` sequences the ~45 v1 Musts, then the ~26 v1.5 Musts.
> It no longer needs to pick a beachhead — D-31 did.
>
> See [meta/constraints.md § Release Plan](meta/constraints.md) for the full per-domain breakdown.

### Should Have — 292
See [moscow-ledger.md](./moscow-ledger.md#should-292).

### Could Have — 201
See [moscow-ledger.md](./moscow-ledger.md#could-201).

### Won't Have (Now) — 53
See [moscow-ledger.md](./moscow-ledger.md#wont-53).


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-71|D-71]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-85|D-85]]
- [[decisions.md#d-35|D-35]]
- [[decisions.md#d-28|D-28]]
- [[decisions.md#d-29|D-29]]
- [[decisions.md#d-26|D-26]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-12|D-12]]
- [[decisions.md#d-13|D-13]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-17|D-17]]
- [[decisions.md#d-19|D-19]]
- [[decisions.md#d-20|D-20]]
- [[decisions.md#d-31|D-31]]
- [[decisions.md#d-21|D-21]]
- [[decisions.md#d-22|D-22]]
- [[decisions.md#d-23|D-23]]
- [[decisions.md#d-24|D-24]]
- [[decisions.md#d-25|D-25]]
- [[decisions.md#d-27|D-27]]
- [[decisions.md#d-30|D-30]]
- [[decisions.md#d-32|D-32]]
- [[decisions.md#d-33|D-33]]
- [[decisions.md#d-34|D-34]]
- [[decisions.md#d-36|D-36]]
- [[decisions.md#d-37|D-37]]
- [[decisions.md#d-38|D-38]]
- [[decisions.md#d-39|D-39]]
- [[decisions.md#d-40|D-40]]
- [[decisions.md#d-41|D-41]]
- [[decisions.md#d-42|D-42]]
- [[decisions.md#d-43|D-43]]
- [[decisions.md#d-44|D-44]]
- [[decisions.md#d-45|D-45]]
- [[decisions.md#d-46|D-46]]
- [[decisions.md#d-47|D-47]]
- [[decisions.md#d-48|D-48]]
- [[decisions.md#d-49|D-49]]
- [[decisions.md#d-50|D-50]]
- [[decisions.md#d-51|D-51]]
- [[decisions.md#d-52|D-52]]
- [[decisions.md#d-53|D-53]]
- [[decisions.md#d-54|D-54]]
- [[decisions.md#d-55|D-55]]
- [[decisions.md#d-56|D-56]]
- [[decisions.md#d-57|D-57]]
- [[decisions.md#d-58|D-58]]
- [[decisions.md#d-59|D-59]]
- [[decisions.md#d-60|D-60]]
- [[decisions.md#d-61|D-61]]
- [[decisions.md#d-62|D-62]]
- [[decisions.md#d-63|D-63]]
- [[decisions.md#d-64|D-64]]
- [[decisions.md#d-65|D-65]]
- [[decisions.md#d-66|D-66]]
- [[decisions.md#d-67|D-67]]
- [[decisions.md#d-68|D-68]]
- [[decisions.md#d-69|D-69]]
- [[decisions.md#d-70|D-70]]
- [[decisions.md#d-72|D-72]]
- [[decisions.md#d-73|D-73]]
- [[decisions.md#d-74|D-74]]
- [[decisions.md#d-75|D-75]]
- [[decisions.md#d-76|D-76]]
- [[decisions.md#d-77|D-77]]
- [[decisions.md#d-78|D-78]]
- [[decisions.md#d-79|D-79]]
- [[decisions.md#d-80|D-80]]
- [[decisions.md#d-81|D-81]]
- [[decisions.md#d-82|D-82]]
- [[decisions.md#d-83|D-83]]
- [[decisions.md#d-84|D-84]]
