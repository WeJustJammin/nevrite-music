# Audit Scope — Ideation (Vision Layer)

> Status: `[RECOVERY-IN-PROGRESS]` — original tiered audit executed 2026-07-18; remediation
> stopped at a weekly model limit after 33 of 81 cross-file manifests. Fresh audit not yet run.
> Recovery ledger: [remediation-state.md](remediation-state.md).

## Layer

**ideation** (scored with the **Vision Rubric**).

## Rubric Files

- `/home/rob/Projects/WeJammin/.claude/skills/pipeline-rubrics/references/vision-rubric.md` (8 dimensions)
- `/home/rob/Projects/WeJammin/.claude/skills/pipeline-rubrics/references/scoring.md` (formula + methodology)

## Document Enumeration (from filesystem)

All `.md` files under `.memory/wiki/specs/ideation/` plus `vision.md` and `feature-ledger.md`.

| Class | Count | Path pattern |
|-------|------:|--------------|
| Super-index + global CX | 2 | `ideation-index.md`, `ideation-cx.md` |
| Meta documents | 5 | `meta/*.md` |
| Ideation working ledger | 1 | `moscow-ledger.md` |
| Domain indexes | 24 | `NN-slug/slug-index.md` |
| Sub-domain indexes | 165 | `NN.MM-slug/…-index.md` |
| CX files (domain + sub-domain) | 189 | `NN-slug/*-cx.md`, `NN.MM-slug/*-cx.md` |
| Feature files | 734 | `NN.MM[.KK]-slug.md` |
| **Total ideation `.md`** | **1,120** | |
| Compiled outputs | 2 | `../vision.md`, `../feature-ledger.md` |
| **Total scoped documents** | **1,122** | |

### Feature files by depth (audit-relevance tiers)

| MoSCoW | Depth | Count | Audit relevance |
|--------|-------|------:|-----------------|
| Must | `[DEEP]` | 195 | High — feeds `/create-prd`; v1 (45) most urgent. |
| Should | `[PARTIAL]` | 285 | Medium — specced in later phases. |
| Could | `[SURFACE]` | 201 | Intentionally minimal under D-20. |
| Won't | `[SURFACE]` | 53 | Traceability only. |

## Applicability Ruling

Could/Won't features are intentionally `[SURFACE]`; shallow depth alone is not an ambiguity
finding. They receive a class-level applicability ruling, not 254 noise reports.

| Tier | Documents | Count | Treatment |
|------|-----------|------:|-----------|
| A | Vision-level: super-index, global CX, 5 meta, `moscow-ledger.md`, compiled outputs | 10 | Full 3a→3b→3c per document |
| B | v1 + v1.5 Must content in domains 01/02/05/07/09/13/14/15 | variable | Full 3a→3b→3c per document |
| C | Remaining Must + all Should content | variable | Full 3a→3b→3c per document |
| D | Could/Won't `[SURFACE]` feature files | 254 | Class-level applicability ruling |

## Coverage State

- Enumeration gate: passed — 1,120 ideation Markdown files; single-surface tree correctly has no
  `surfaces/` directory.
- Original report claims 867 full-audited + 254 class-ruled-out files = 1,121. One of the 1,122
  scoped documents lacks a recorded coverage disposition. The fresh audit must reconcile it.
- The original audit executed under owner-approved tiering. This file’s former “awaiting execution”
  status was stale.

## Remediation State

- 107 cross-file findings across 81 manifests entered remediation.
- 33 manifests / 48 findings had edits reported applied but remain independently unverified.
- 48 manifests / 59 findings remain pending, including 17 blockers.
- No final `## Gaps Fixed` entry exists yet because every manifest lacks a final verified disposition.

## Execution Handoff

1. Complete and independently verify every row in [remediation-state.md](remediation-state.md).
2. Record `## Gaps Fixed` only after that reconciliation.
3. Run a fresh full `/audit-ambiguity ideation`; it is the only eligible advance gate.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-20|D-20]]
