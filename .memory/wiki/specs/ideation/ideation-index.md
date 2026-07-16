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
| Total surfaces | 1 |
| Total domains | _PENDING_ |
| Total leaf features | _PENDING_ |
| Max depth reached | _0_ |
| Leaf nodes at [SURFACE] | _0_ |
| Leaf nodes at [DEEP] | _0_ |
| Leaf nodes at [EXHAUSTED] | _0_ |
| CX entries confirmed | _0_ |
| Deep Think hypotheses confirmed | _0_ |
| Deep Think hypotheses rejected | _0_ |

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

_[PENDING — awaiting confirmed domain classification table]_

| # | Domain | Path | Status | Children | Depth | Deep Think |
|---|--------|------|--------|----------|-------|------------|
| — | _pending_ | — | — | — | — | — |

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
