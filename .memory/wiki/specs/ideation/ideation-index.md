# Ideation Index — WeJammin

> **Pipeline key file.** All downstream workflows read this index to locate ideation documents.
> This file is the entry point for `/create-prd`, `/decompose-architecture`, `/audit-ambiguity ideation`, and all other workflows that consume ideation output.

> Source: [idea.md](../../../../idea.md) — SoundBytez platform README (predecessor product)

## Project Overview

**Problem**: _[PENDING — discover shard]_

**One-liner**: _[PENDING — discover shard]_

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

| Metric | Value |
|--------|-------|
| Total surfaces | 1 (web) |
| Total domains | **24** |
| Candidate sub-domains (unclassified) | **423** |
| Total leaf features | 0 — _classification runs in `/ideate-discover`_ |
| Max depth reached | 1 |
| Nodes at [SURFACE] | 24 |
| Nodes at [DEEP] | 0 |
| Nodes at [EXHAUSTED] | 0 |
| Cross-cut mechanisms identified | 32 |
| CX interaction pairs confirmed | 0 — _CX Decision Gate runs in `/ideate-discover`_ |
| Not-product concerns routed to `/create-prd` | 24 |
| Candidates demoted from domain status | 21 |
| Raw concepts swept | 1,545 |
| Deep Think hypotheses confirmed | 24 domains survived 3× adversarial verification |
| Deep Think hypotheses rejected | 0 majority-refuted — **see D-17 caveat** |

## Document Map

> Downstream workflows: read this table to find the specific file you need.

### Meta Documents

| Document | Path | Status |
|----------|------|--------|
| Problem Statement | [problem-statement.md](meta/problem-statement.md) | `[PENDING]` |
| Personas | [personas.md](meta/personas.md) | `[PENDING]` |
| Competitive Landscape | [competitive-landscape.md](meta/competitive-landscape.md) | `[PENDING]` |
| Constraints | [constraints.md](meta/constraints.md) | `[PENDING]` |

### Global Cross-Cuts

| Document | Path |
|----------|------|
| Global Cross-Cuts | [ideation-cx.md](ideation-cx.md) |

### Structure Map

> **For single-surface projects**, domains are listed directly below.
> Every domain below is a FOLDER containing: `{domain}-index.md`, `{domain}-cx.md`, and child features/sub-domains.

#### Top-Level Domains

> **24 domains, ratified 2026-07-16 (D-16).** All `[SURFACE]` — identified with rationale and
> candidate children, not yet drilled. `/ideate-discover` classifies each candidate child
> through the Node Classification Gate and drills to `[DEEP]`/`[EXHAUSTED]`.

| # | Domain | Path | Status | Children | Depth | Novelty / Priority |
|---|--------|------|--------|----------|-------|--------------------|
| 01 | Identity, Profiles & Organizations | [01-identity-profiles-organizations/](./01-identity-profiles-organizations/) | `[SURFACE]` | 12 candidates | 1 | industry-standard / core |
| 02 | Credits & Attribution | [02-credits-attribution/](./02-credits-attribution/) | `[SURFACE]` | 11 candidates | 1 | whitespace / core |
| 03 | Community & Networking | [03-community-networking/](./03-community-networking/) | `[SURFACE]` | 16 candidates | 1 | in-source / core |
| 04 | Opportunities & Casting | [04-opportunities-casting/](./04-opportunities-casting/) | `[SURFACE]` | 14 candidates | 1 | industry-standard / important |
| 05 | Services Marketplace | [05-services-marketplace/](./05-services-marketplace/) | `[SURFACE]` | 25 candidates | 1 | in-source / core |
| 06 | Education, Lessons & Mentorship | [06-education-lessons-mentorship/](./06-education-lessons-mentorship/) | `[SURFACE]` | 9 candidates | 1 | industry-standard / important |
| 07 | Music Projects & Collaboration | [07-music-projects-collaboration/](./07-music-projects-collaboration/) | `[SURFACE]` | 35 candidates | 1 | in-source / core |
| 08 | Real-Time Jamming & Remote Sessions | [08-realtime-jamming-remote-sessions/](./08-realtime-jamming-remote-sessions/) | `[SURFACE]` | 6 candidates | 1 | industry-standard / important |
| 09 | Rights & Ownership | [09-rights-ownership/](./09-rights-ownership/) | `[SURFACE]` | 23 candidates | 1 | industry-standard / core |
| 10 | Royalties & Collections | [10-royalties-collections/](./10-royalties-collections/) | `[SURFACE]` | 18 candidates | 1 | industry-standard / core |
| 11 | Music Licensing | [11-music-licensing/](./11-music-licensing/) | `[SURFACE]` | 18 candidates | 1 | industry-standard / core |
| 12 | Release & Distribution | [12-release-distribution/](./12-release-distribution/) | `[SURFACE]` | 8 candidates | 1 | industry-standard / core |
| 13 | Gear Marketplace (Physical Goods) | [13-gear-marketplace/](./13-gear-marketplace/) | `[SURFACE]` | 28 candidates | 1 | user-directive / core |
| 14 | Digital Goods & Plugin Marketplace | [14-digital-goods-marketplace/](./14-digital-goods-marketplace/) | `[SURFACE]` | 24 candidates | 1 | user-directive / core |
| 15 | Gear Registry & Ownership | [15-gear-registry-ownership/](./15-gear-registry-ownership/) | `[SURFACE]` | 10 candidates | 1 | whitespace / important |
| 16 | Venues, Studios & Spaces | [16-venues-studios-spaces/](./16-venues-studios-spaces/) | `[SURFACE]` | 22 candidates | 1 | user-directive / core |
| 17 | Live Booking & Settlement | [17-live-booking-settlement/](./17-live-booking-settlement/) | `[SURFACE]` | 18 candidates | 1 | industry-standard / core |
| 18 | Show Production & Touring | [18-show-production-touring/](./18-show-production-touring/) | `[SURFACE]` | 33 candidates | 1 | in-source / core |
| 19 | Ticketing & Box Office | [19-ticketing-box-office/](./19-ticketing-box-office/) | `[SURFACE]` | 11 candidates | 1 | user-directive / important |
| 20 | Fanbase & Direct-to-Fan | [20-fanbase-direct-to-fan/](./20-fanbase-direct-to-fan/) | `[SURFACE]` | 17 candidates | 1 | industry-standard / important |
| 21 | Promotion & Marketing | [21-promotion-marketing/](./21-promotion-marketing/) | `[SURFACE]` | 12 candidates | 1 | industry-standard / important |
| 22 | Analytics & Market Intelligence | [22-analytics-market-intelligence/](./22-analytics-market-intelligence/) | `[SURFACE]` | 8 candidates | 1 | in-source / important |
| 23 | Career, Finance & Business Management | [23-career-finance-business/](./23-career-finance-business/) | `[SURFACE]` | 16 candidates | 1 | in-source / important |
| 24 | Trust, Safety & Disputes | [24-trust-safety-disputes/](./24-trust-safety-disputes/) | `[SURFACE]` | 29 candidates | 1 | industry-standard / core |

> **Full per-domain rationale, cross-cuts, not-product routing, and demotions**:
> [docs/wejammin-domain-map-proposal.md](../../../../docs/wejammin-domain-map-proposal.md)

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

## MoSCoW Summary

> Features reference their fractal path. Path format: `{domain}.{sub-domain}.{feature}`

_[PENDING — discover shard]_

### Must Have
_pending_

### Should Have
_pending_

### Could Have
_pending_

### Won't Have (Now)
_pending_
